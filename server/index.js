/**
 * =================================================================
 * Prestige Rentals - Master Backend API
 * =================================================================
 * Node.js Express server for the car rental application.
 * * SECURED VERSION
 * =================================================================
 */

// --- IMPORTS AND INITIAL SETUP ---
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');

const app = express();

// --- EJS VIEW ENGINE SETUP ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// --- STATIC FILES ---
app.use(express.static(path.join(__dirname, '../public')));

// --- SECURITY MIDDLEWARE ---

// Set secure HTTP headers with custom CSP for Google Maps
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://www.youtube.com", "https://unpkg.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            frameSrc: ["'self'", "https://www.google.com", "https://maps.google.com", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
            connectSrc: ["'self'"]
        }
    }
}));

// Configure CORS for specific origins
const corsOptions = {
    origin: [
        'http://localhost:4321', // Your Astro dev server
        'https://your-production-domain.com' // CHANGE THIS to your live site URL
    ]
};
app.use(cors(corsOptions));

// JSON body parser
app.use(express.json());

// --- RATE LIMITERS ---
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per window
    message: { success: false, error: 'Too many login attempts, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 registration requests per hour
    message: { success: false, error: 'Too many accounts created from this IP, please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 reset requests per hour
    message: { success: false, error: 'Too many password reset requests, please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- FILE UPLOAD CONFIGURATION ---

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/images/blog');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for blog image uploads
const blogImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp-randomstring-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
    }
});

const blogImageUpload = multer({
    storage: blogImageStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});


const PORT = 3001;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined. Set it in your .env file.');
    process.exit(1);
}

// --- DATABASE CONNECTION POOL ---
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'car_rental_db',
    port: parseInt(process.env.DB_PORT) || 8889, // MAMP MySQL port
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0
});

// --- HELPER FUNCTIONS ---
function detectCardType(number) {
    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    if (/^6(?:011|5)/.test(number)) return 'Discover';
    return 'Card';
}

// --- AUTHENTICATION MIDDLEWARE ---

function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ success: false, error: 'No token provided. Access denied.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Invalid token. Access forbidden.' });
        }
        
        // Optional: Check if (user.job_title) exists for admin role
        req.user = user;
        next();
    });
}

function authenticateCustomer(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ success: false, error: 'No token provided. Access denied.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Invalid token. Access forbidden.' });
        }
        
        req.user = user; // This 'user' is the JWT payload { id, email, role }
        next();
    });
}

// Optional auth: Verifies token if present, but does not fail if missing
// Used for public routes that show user-specific data (e.g., "is_favorite")
function getAuthenticatedUser(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return next(); // No token, proceed as anonymous
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Token is present but invalid, this is an error
            return res.status(403).json({ success: false, error: 'Invalid token.' });
        }
        
        req.user = user; // Token is valid, attach user
        next();
    });
}


// --- AUTHENTICATION ROUTES ---

// Employee Login
app.post('/api/employees/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const sql = 'SELECT * FROM Employees WHERE username = ?';
        const [rows] = await pool.query(sql, [username]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        
        const user = rows[0];
        
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const userPayload = {
                id: user.employee_id,
                job_title: user.job_title,
                role: 'employee'
            };
            const token = jwt.sign(
                userPayload,
                JWT_SECRET,
                { expiresIn: '8h' }
            );
            
            // Send back user info, but OMIT the password hash
            const userInfo = {
                employee_id: user.employee_id,
                first_name: user.first_name,
                last_name: user.last_name,
                job_title: user.job_title
            };
            
            res.json({ success: true, user: userInfo, token: token });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Employee Login Error:', error);
        res.status(500).json({ success: false, error: 'A server error occurred.' });
    }
});

// Customer Login
app.post('/api/customers/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const sql = 'SELECT * FROM Customers WHERE email = ?';
        const [rows] = await pool.query(sql, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }
        
        const user = rows[0];
        
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const userProfile = {
                customer_id: user.customer_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email
            };
            
            const userPayload = {
                id: user.customer_id,
                email: user.email,
                role: 'customer'
            };
            
            const token = jwt.sign(
                userPayload,
                JWT_SECRET,
                { expiresIn: '8h' }
            );
            
            res.json({ success: true, user: userProfile, token: token });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }
    } catch (error) {
        console.error('Customer Login Error:', error);
        res.status(500).json({ success: false, error: 'A server error occurred.' });
    }
});

// Customer Registration
app.post('/api/customers/register', registerLimiter, async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;
        
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const sql = 'INSERT INTO Customers (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
        const [result] = await pool.query(sql, [first_name, last_name, email, hashedPassword]);
        
        res.status(201).json({ success: true, customerId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'Email already exists.' });
        }
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, error: 'Failed to register.' });
    }
});

// Forgot Password
app.post('/api/customers/forgot-password', passwordResetLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        const [users] = await pool.query('SELECT customer_id FROM Customers WHERE email = ?', [email]);

        if (users.length > 0) {
            const token = crypto.randomBytes(32).toString('hex');
            const expires = Date.now() + 3600000; // 1 hour
            await pool.query('UPDATE Customers SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [token, expires, email]);
            
            // In a real app, you would email this link
            console.log(`SIMULATED EMAIL: Password reset link for ${email}: http://localhost:4321/reset-password?token=${token}`);
            
            res.json({ success: true, message: 'Password reset token generated (check server console).', token });
        } else {
            // Respond vaguely to prevent user enumeration
            res.json({ success: true, message: 'If an account exists, a link has been sent.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'A server error occurred.' });
    }
});

// Reset Password
app.post('/api/customers/reset-password', passwordResetLimiter, async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const [users] = await pool.query('SELECT * FROM Customers WHERE reset_token = ? AND reset_token_expires > ?', [token, Date.now()]);

        if (users.length === 0) {
            return res.status(400).json({ success: false, error: 'Token is invalid or has expired.' });
        }

        const saltRounds = 10;
        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        await pool.query('UPDATE Customers SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE customer_id = ?', [newHashedPassword, users[0].customer_id]);
        res.json({ success: true, message: 'Password has been reset.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'A server error occurred.' });
    }
});


// --- PUBLIC & GENERAL DATA ROUTES ---

// Get Featured Cars for Homepage
app.get('/api/public/featured-cars', async (req, res) => {
    try {
        const sql = "SELECT car_id, make, model, daily_rate, image_url FROM Cars WHERE status = 'Available' ORDER BY daily_rate DESC LIMIT 3";
        const [rows] = await pool.query(sql);
        res.json({ success: true, cars: rows });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Could not fetch featured cars.' });
    }
});

// Get Testimonials for Homepage
app.get('/api/public/testimonials', async (req, res) => {
    try {
        const sql = `
            SELECT r.rating, r.review_text, c.first_name, car.make, car.model
            FROM Reviews r JOIN Customers c ON r.customer_id = c.customer_id
            JOIN Cars car ON r.car_id = car.car_id
            WHERE r.rating >= 4 ORDER BY r.review_date DESC LIMIT 4`;
        const [rows] = await pool.query(sql);
        res.json({ success: true, testimonials: rows });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Could not fetch testimonials.' });
    }
});

// Get Published Blog Posts (with pagination)
app.get('/api/public/blog-posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const offset = (page - 1) * limit;
        const categorySlug = req.query.category || '';

        let countSql = `
            SELECT COUNT(DISTINCT bp.post_id) as total
            FROM BlogPosts bp
            WHERE bp.status = 'published'
        `;
        let dataSql = `
            SELECT
                bp.post_id,
                bp.title,
                bp.slug,
                bp.excerpt,
                bp.featured_image,
                bp.published_at,
                bp.views,
                e.first_name,
                e.last_name,
                GROUP_CONCAT(bc.name SEPARATOR ', ') as categories
            FROM BlogPosts bp
            LEFT JOIN Employees e ON bp.author_id = e.employee_id
            LEFT JOIN BlogPostCategories bpc ON bp.post_id = bpc.post_id
            LEFT JOIN BlogCategories bc ON bpc.category_id = bc.category_id
            WHERE bp.status = 'published'
        `;

        const queryParams = [];

        // Filter by category if provided
        if (categorySlug) {
            countSql = `
                SELECT COUNT(DISTINCT bp.post_id) as total
                FROM BlogPosts bp
                INNER JOIN BlogPostCategories bpc ON bp.post_id = bpc.post_id
                INNER JOIN BlogCategories bc ON bpc.category_id = bc.category_id
                WHERE bp.status = 'published' AND bc.slug = ?
            `;
            dataSql += ` AND bc.slug = ?`;
            queryParams.push(categorySlug);
        }

        dataSql += ` GROUP BY bp.post_id ORDER BY bp.published_at DESC LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);

        const [[{ total }]] = await pool.query(countSql, categorySlug ? [categorySlug] : []);
        const [posts] = await pool.query(dataSql, queryParams);

        res.json({
            success: true,
            posts: posts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalPosts: total,
                limit: limit
            }
        });
    } catch (e) {
        console.error('Error fetching blog posts:', e);
        res.status(500).json({ success: false, error: 'Could not fetch blog posts.' });
    }
});

// Get Single Blog Post by slug
app.get('/api/public/blog-posts/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const sql = `
            SELECT
                bp.post_id,
                bp.title,
                bp.slug,
                bp.excerpt,
                bp.content,
                bp.featured_image,
                bp.published_at,
                bp.views,
                e.first_name,
                e.last_name,
                e.job_title,
                GROUP_CONCAT(bc.name SEPARATOR ', ') as categories
            FROM BlogPosts bp
            LEFT JOIN Employees e ON bp.author_id = e.employee_id
            LEFT JOIN BlogPostCategories bpc ON bp.post_id = bpc.post_id
            LEFT JOIN BlogCategories bc ON bpc.category_id = bc.category_id
            WHERE bp.slug = ? AND bp.status = 'published'
            GROUP BY bp.post_id
        `;

        const [rows] = await pool.query(sql, [slug]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Blog post not found.' });
        }

        // Increment view count
        await pool.query('UPDATE BlogPosts SET views = views + 1 WHERE post_id = ?', [rows[0].post_id]);

        res.json({ success: true, post: rows[0] });
    } catch (e) {
        console.error('Error fetching blog post:', e);
        res.status(500).json({ success: false, error: 'Could not fetch blog post.' });
    }
});

// Get All Blog Categories
app.get('/api/public/blog-categories', async (req, res) => {
    try {
        const sql = `
            SELECT
                bc.category_id,
                bc.name,
                bc.slug,
                COUNT(bpc.post_id) as post_count
            FROM BlogCategories bc
            LEFT JOIN BlogPostCategories bpc ON bc.category_id = bpc.category_id
            LEFT JOIN BlogPosts bp ON bpc.post_id = bp.post_id AND bp.status = 'published'
            GROUP BY bc.category_id
            ORDER BY bc.name ASC
        `;

        const [categories] = await pool.query(sql);
        res.json({ success: true, categories: categories });
    } catch (e) {
        console.error('Error fetching blog categories:', e);
        res.status(500).json({ success: false, error: 'Could not fetch blog categories.' });
    }
});

// Get all Car Types
app.get('/api/car-types', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Car_Types');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Get all Car Features
app.get('/api/features', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT name FROM Features ORDER BY name ASC');
        const featureNames = rows.map(row => row.name);
        res.json({ success: true, features: featureNames });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch features.' });
    }
});

// Get all rental Add-ons
app.get('/api/addons', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Addons ORDER BY price ASC');
        res.json({ success: true, addons: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Could not retrieve rental add-ons.' });
    }
});


// --- CAR & RENTAL ROUTES (CUSTOMER FACING) ---

// Get available cars with filtering
app.get('/api/cars/available', getAuthenticatedUser, async (req, res) => {
    try {
        const { type, search } = req.query;
        // Get customer ID from token if authenticated, otherwise 0
        const customerId = req.user ? req.user.id : 0; 
        
        let query = `
            SELECT c.*, ct.type_name, AVG(r.rating) as average_rating,
                   (SELECT COUNT(*) FROM FavoriteCars WHERE car_id = c.car_id AND customer_id = ?) as is_favorite
            FROM Cars c
            JOIN Car_Types ct ON c.car_type_id = ct.car_type_id
            LEFT JOIN Reviews r ON c.car_id = r.car_id
            WHERE c.status = 'Available'
        `;
        const params = [customerId];

        if (type) {
            query += ' AND c.car_type_id = ?';
            params.push(type);
        }
        if (search) {
            query += ' AND (c.make LIKE ? OR c.model LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        query += ' GROUP BY c.car_id, ct.type_name';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching available cars:", error);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Get details for a specific car
app.get('/api/cars/:id', getAuthenticatedUser, async (req, res) => {
    try {
        const customerId = req.user ? req.user.id : 0;
        
        const [carRows] = await pool.query(`
            SELECT c.*, ct.type_name FROM Cars c
            JOIN Car_Types ct ON c.car_type_id = ct.car_type_id
            WHERE c.car_id = ?`, [req.params.id]);

        if (carRows.length === 0) {
            return res.status(404).json({ error: 'Car not found.' });
        }

        const [featureRows] = await pool.query(`
            SELECT f.name FROM CarFeatures cf
            JOIN Features f ON cf.feature_id = f.feature_id
            WHERE cf.car_id = ?`, [req.params.id]);

        const [reviewRows] = await pool.query(`
            SELECT r.*, cust.first_name FROM Reviews r
            JOIN Customers cust ON r.customer_id = cust.customer_id
            WHERE r.car_id = ? ORDER BY r.review_date DESC`, [req.params.id]);

        const reviews = reviewRows.map(r => ({
            ...r,
            isOwner: customerId ? r.customer_id === customerId : false
        }));

        res.json({
            car: { ...carRows[0], features: featureRows.map(f => f.name) },
            reviews
        });
    } catch (error) {
        console.error('Car Fetch Error:', error);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Create a new rental (Authenticated)
app.post('/api/rentals/create', authenticateCustomer, async (req, res) => {
    // customer_id comes from the token, not the body
    const customer_id = req.user.id;
    const { car_id, pickup_date, due_date, addon_ids } = req.body;
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [carRows] = await connection.query('SELECT daily_rate FROM Cars WHERE car_id = ?', [car_id]);
        if (carRows.length === 0) throw new Error('Car not found.');
        const dailyRate = carRows[0].daily_rate;
        const rentalDays = Math.max(1, Math.ceil((new Date(due_date) - new Date(pickup_date)) / (1000 * 60 * 60 * 24)));
        let totalCost = rentalDays * dailyRate;

        if (addon_ids && addon_ids.length > 0) {
            const [addonRows] = await connection.query('SELECT SUM(price) as addons_total FROM Addons WHERE addon_id IN (?)', [addon_ids]);
            if (addonRows[0].addons_total) totalCost += parseFloat(addonRows[0].addons_total);
        }

        const [rentalResult] = await connection.query('INSERT INTO Rentals (customer_id, car_id, pickup_date, due_date, total_cost) VALUES (?, ?, ?, ?, ?)', [customer_id, car_id, pickup_date, due_date, totalCost]);
        const rentalId = rentalResult.insertId;

        if (addon_ids && addon_ids.length > 0) {
            const rentalAddonValues = addon_ids.map(id => [rentalId, id]);
            await connection.query('INSERT INTO RentalAddons (rental_id, addon_id) VALUES ?', [rentalAddonValues]);
        }

        await connection.query('INSERT INTO Payments (rental_id, amount, payment_date, payment_method) VALUES (?, ?, ?, "Card on File")', [rentalId, totalCost, pickup_date]);
        await connection.query("UPDATE Cars SET status = 'Rented' WHERE car_id = ?", [car_id]);

        await connection.commit();
        res.status(201).json({ success: true, rentalId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, error: 'Database transaction failed.' });
    } finally {
        connection.release();
    }
});

// Return a rental (by customer) (Authenticated)
app.put('/api/rentals/return-by-customer/:rentalId', authenticateCustomer, async (req, res) => {
    const customerId = req.user.id;
    const { rentalId } = req.params;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Verify this rental belongs to the authenticated customer
        const [rentalRows] = await connection.query('SELECT car_id, due_date, customer_id FROM Rentals WHERE rental_id = ?', [rentalId]);
        if (rentalRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Rental not found.' });
        }
        
        if (rentalRows[0].customer_id !== customerId) {
            return res.status(403).json({ success: false, error: 'You are not authorized to return this rental.' });
        }

        const { car_id, due_date } = rentalRows[0];
        let earlyReturnFee = 0;
        if (new Date() < new Date(due_date)) {
            earlyReturnFee = 25.00;
            await connection.query('UPDATE Rentals SET late_fee = ? WHERE rental_id = ?', [earlyReturnFee, rentalId]);
        }

        await connection.query("UPDATE Cars SET status = 'Available' WHERE car_id = ?", [car_id]);
        await connection.query('UPDATE Rentals SET return_date = CURDATE() WHERE rental_id = ?', [rentalId]);

        await connection.commit();
        res.json({ success: true, feeApplied: earlyReturnFee });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, error: 'Return process failed.' });
    } finally {
        connection.release();
    }
});

// Delete a rental record from history (Authenticated)
app.delete('/api/rentals/:rentalId', authenticateCustomer, async (req, res) => {
    const { rentalId } = req.params;
    const customerId = req.user.id; // Get ID from token
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rentalRows] = await connection.query(
            'SELECT customer_id FROM Rentals WHERE rental_id = ? AND return_date IS NOT NULL',
            [rentalId]
        );

        if (rentalRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Completed rental record not found.' });
        }

        if (rentalRows[0].customer_id !== customerId) {
            return res.status(403).json({ success: false, error: 'You are not authorized to delete this record.' });
        }

        await connection.query('DELETE FROM RentalAddons WHERE rental_id = ?', [rentalId]);
        await connection.query('DELETE FROM Payments WHERE rental_id = ?', [rentalId]);
        const [result] = await connection.query('DELETE FROM Rentals WHERE rental_id = ?', [rentalId]);

        await connection.commit();

        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Rental record deleted.' });
        } else {
            await connection.rollback();
            res.status(404).json({ success: false, error: 'Rental could not be deleted.' });
        }
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Delete Rental Error:", error);
        res.status(500).json({ success: false, error: 'Failed to delete rental record due to a server error.' });
    } finally {
        if (connection) connection.release();
    }
});


// --- CUSTOMER PROFILE & DATA ROUTES (ALL AUTHENTICATED) ---

// Get customer profile
app.get('/api/customers/profile', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const [rows] = await pool.query('SELECT * FROM Customers WHERE customer_id = ?', [customerId]);
        if (rows.length > 0) {
            // Omit sensitive data before sending
            const { password, reset_token, reset_token_expires, ...profile } = rows[0];
            res.json({ success: true, profile: profile });
        } else {
            res.status(404).json({ success: false, error: 'Customer not found.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database error.' });
    }
});

// Update customer profile
app.put('/api/customers/profile', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { first_name, last_name, email, phone_number, address, city, state, zip_code } = req.body;
        const sql = 'UPDATE Customers SET first_name=?, last_name=?, email=?, phone_number=?, address=?, city=?, state=?, zip_code=? WHERE customer_id=?';
        const params = [first_name, last_name, email, phone_number, address, city, state, zip_code, customerId];
        await pool.query(sql, params);
        res.json({ success: true, message: 'Profile updated.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'Email already in use.' });
        }
        res.status(500).json({ success: false, error: 'Failed to update profile.' });
    }
});

// Update customer password from profile
app.put('/api/customers/password', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        
        const [rows] = await pool.query('SELECT password FROM Customers WHERE customer_id = ?', [customerId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }
        
        const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
        
        if (!isMatch) {
            return res.status(403).json({ success: false, error: 'Incorrect current password.' });
        }
        
        const saltRounds = 10;
        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await pool.query('UPDATE Customers SET password = ? WHERE customer_id = ?', [newHashedPassword, customerId]);
        res.json({ success: true, message: 'Password updated.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update password.' });
    }
});

// Get customer's active rental
app.get('/api/customers/active-rental', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const sql = `
            SELECT r.*, c.make, c.model, c.year, c.daily_rate, DATEDIFF(CURDATE(), r.pickup_date) as days_rented
            FROM Rentals r JOIN Cars c ON r.car_id = c.car_id
            WHERE r.customer_id = ? AND r.return_date IS NULL`;
        const [rows] = await pool.query(sql, [customerId]);

        if (rows.length > 0) {
            const rental = rows[0];
            rental.estimated_cost = Math.max(1, (rental.days_rented || 0) + 1) * rental.daily_rate;
            res.json({ success: true, rental });
        } else {
            res.json({ success: true, rental: null });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database error.' });
    }
});

// Get customer's rental history
app.get('/api/customers/rental-history', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const [rows] = await pool.query(`
            SELECT r.rental_id, r.pickup_date, r.return_date, r.total_cost, c.make, c.model
            FROM Rentals r
            JOIN Cars c ON r.car_id = c.car_id
            WHERE r.customer_id = ?
            ORDER BY r.pickup_date DESC;
        `, [customerId]);
        res.json({ success: true, history: rows });
    } catch (err) {
        console.error("Error fetching rental history:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Check if customer can review a car
app.get('/api/customers/can-review/:carId', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { carId } = req.params;
        
        const [past] = await pool.query('SELECT 1 FROM Rentals WHERE customer_id = ? AND car_id = ? AND return_date IS NOT NULL', [customerId, carId]);
        const [active] = await pool.query('SELECT 1 FROM Rentals WHERE customer_id = ? AND car_id = ? AND return_date IS NULL', [customerId, carId]);
        const [reviewed] = await pool.query('SELECT 1 FROM Reviews WHERE customer_id = ? AND car_id = ?', [customerId, carId]);

        const canReview = (past.length > 0 || active.length > 0) && reviewed.length === 0;
        res.json({ success: true, canReview });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Submit a new review
app.post('/api/reviews', authenticateCustomer, async (req, res) => {
    const customer_id = req.user.id;
    const { car_id, rating, review_text } = req.body;
    try {
        const sql = 'INSERT INTO Reviews (car_id, customer_id, rating, review_text) VALUES (?, ?, ?, ?)';
        await pool.query(sql, [car_id, customer_id, rating, review_text]);
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to submit review.' });
    }
});

// Update a review
app.put('/api/reviews/:reviewId', authenticateCustomer, async (req, res) => {
    const customer_id = req.user.id;
    const { reviewId } = req.params;
    const { rating, review_text } = req.body;
    try {
        // Check for ownership
        const [rows] = await pool.query('SELECT customer_id FROM Reviews WHERE review_id = ?', [reviewId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Review not found.' });
        }
        if (rows[0].customer_id !== customer_id) {
            return res.status(403).json({ success: false, error: 'You are not authorized to update this review.' });
        }
        
        const sql = 'UPDATE Reviews SET rating = ?, review_text = ? WHERE review_id = ?';
        await pool.query(sql, [rating, review_text, reviewId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update review.' });
    }
});

// Delete a review
app.delete('/api/reviews/:reviewId', authenticateCustomer, async (req, res) => {
    const customer_id = req.user.id;
    const { reviewId } = req.params;
    try {
        // Check for ownership
        const [rows] = await pool.query('SELECT customer_id FROM Reviews WHERE review_id = ?', [reviewId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Review not found.' });
        }
        if (rows[0].customer_id !== customer_id) {
            return res.status(403).json({ success: false, error: 'You are not authorized to delete this review.' });
        }
        
        await pool.query('DELETE FROM Reviews WHERE review_id = ?', [reviewId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete review.' });
    }
});

// Get customer's favorite cars
app.get('/api/customers/favorites', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const [rows] = await pool.query(`
            SELECT c.car_id, c.make, c.model, c.year
            FROM FavoriteCars f
            JOIN Cars c ON f.car_id = c.car_id
            WHERE f.customer_id = ?;
        `, [customerId]);
        res.json({ success: true, favorites: rows });
    } catch (err) {
        console.error("Error fetching favorites:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Add a car to favorites
app.post('/api/customers/favorites', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { car_id } = req.body;
        await pool.query('INSERT INTO FavoriteCars (customer_id, car_id) VALUES (?, ?)', [customerId, car_id]);
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add favorite.' });
    }
});

// Remove a car from favorites
app.delete('/api/customers/favorites/:car_id', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { car_id } = req.params;
        await pool.query('DELETE FROM FavoriteCars WHERE customer_id = ? AND car_id = ?', [customerId, car_id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to remove favorite.' });
    }
});

// Get customer payment methods
app.get('/api/customers/payment-methods', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const [rows] = await pool.query(
            'SELECT payment_method_id, card_type, masked_number FROM CustomerPaymentMethods WHERE customer_id = ?',
            [customerId]
        );
        res.json({ success: true, methods: rows });
    } catch (err) {
        console.error("Error fetching payment methods:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Add a payment method
app.post('/api/customers/payment-methods', authenticateCustomer, async (req, res) => {
    const customerId = req.user.id;
    // CRITICAL: Raw 'cardNumber' is removed. 
    // The frontend should send 'maskedNumber' and 'cardType' (e.g., from Stripe.js)
    const { cardHolderName, expiryDate, maskedNumber, cardType } = req.body;
    
    if (!cardHolderName || !expiryDate || !maskedNumber || !cardType) {
        return res.status(400).json({ success: false, error: 'Missing required payment details.' });
    }
    
    try {
        const sql = 'INSERT INTO CustomerPaymentMethods (customer_id, card_holder_name, card_type, masked_number, expiry_date) VALUES (?, ?, ?, ?, ?)';
        await pool.query(sql, [customerId, cardHolderName, cardType, maskedNumber, expiryDate]);
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to save payment method.' });
    }
});

// Delete a payment method
app.delete('/api/customers/payment-methods/:methodId', authenticateCustomer, async (req, res) => {
    const customer_id = req.user.id;
    const { methodId } = req.params;
    try {
        // Check for ownership
        const [rows] = await pool.query('SELECT customer_id FROM CustomerPaymentMethods WHERE payment_method_id = ?', [methodId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Payment method not found.' });
        }
        if (rows[0].customer_id !== customer_id) {
            return res.status(403).json({ success: false, error: 'You are not authorized to delete this method.' });
        }
        
        await pool.query('DELETE FROM CustomerPaymentMethods WHERE payment_method_id = ?', [methodId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete payment method.' });
    }
});


// --- ADMIN ROUTES ---

// All routes below this line are protected by the authenticateAdmin middleware
app.use('/api/admin', authenticateAdmin);

// Generic GET endpoint creator for simple tables
const createAdminGetEndpoint = (query, dataKey) => {
    return async (req, res) => {
        try {
            const [rows] = await pool.query(query);
            res.json({ success: true, [dataKey]: rows });
        } catch (error) {
            console.error(`Admin endpoint error for ${dataKey}:`, error);
            res.status(500).json({ success: false, error: 'A server error occurred.' });
        }
    };
};

// --- Admin: Get Data ---
// This is secure as it explicitly lists non-sensitive columns
app.get('/api/admin/employees', createAdminGetEndpoint('SELECT employee_id, first_name, last_name, job_title, hire_date, email, username FROM Employees', 'employees'));

app.get('/api/admin/rentals', createAdminGetEndpoint(`SELECT r.*, c.first_name, c.last_name, car.make, car.model FROM Rentals r JOIN Customers c ON r.customer_id = c.customer_id JOIN Cars car ON r.car_id = car.car_id ORDER BY r.pickup_date DESC`, 'rentals'));

// This is secure as it explicitly lists non-sensitive columns
app.get('/api/admin/customers', async (req, res) => {
    try {
        const sql = `
            SELECT customer_id, first_name, last_name, email, phone_number, address, city, state, zip_code
            FROM Customers ORDER BY last_name ASC`;
        const [rows] = await pool.query(sql);
        res.json({ success: true, customers: rows });
    } catch (error) {
        console.error('Admin Customers Fetch Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch customers.' });
    }
});

app.get('/api/admin/cars', async (req, res) => {
    try {
        const sql = `
            SELECT c.*, ct.type_name, GROUP_CONCAT(f.name) AS features
            FROM Cars c
            JOIN Car_Types ct ON c.car_type_id = ct.car_type_id
            LEFT JOIN CarFeatures cf ON c.car_id = cf.car_id
            LEFT JOIN Features f ON cf.feature_id = f.feature_id
            GROUP BY c.car_id
            ORDER BY c.car_id ASC`;
        const [rows] = await pool.query(sql);
        res.json({ success: true, cars: rows });
    } catch (error) {
        console.error('Admin get cars error:', error);
        res.status(500).json({ success: false, error: 'A server error occurred.' });
    }
});


// --- Admin: Car Management ---
app.post('/api/admin/cars', async (req, res) => {
    try {
        const { make, model, year, license_plate, daily_rate, car_type_id, status, mileage, image_url } = req.body;
        const sql = `INSERT INTO Cars (make, model, year, license_plate, daily_rate, car_type_id, status, mileage, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [make, model, year, license_plate, daily_rate, car_type_id, status, mileage, image_url || null];
        const [result] = await pool.query(sql, params);
        res.status(201).json({ success: true, carId: result.insertId });
    } catch (error) {
        console.error('Create Car Error:', error);
        res.status(500).json({ success: false, error: 'Failed to create car.' });
    }
});

app.put('/api/admin/cars/:id', async (req, res) => {
    try {
        const { make, model, year, license_plate, daily_rate, car_type_id, status, mileage, image_url, next_service_due_date, next_service_details } = req.body;
        const sql = `UPDATE Cars SET make=?, model=?, year=?, license_plate=?, daily_rate=?, car_type_id=?, status=?, image_url=?, mileage=?, next_service_due_date=?, next_service_details=? WHERE car_id=?`;
        const params = [make, model, year, license_plate, daily_rate, car_type_id, status, image_url || null, mileage, next_service_due_date || null, next_service_details || null, req.params.id];
        await pool.query(sql, params);
        res.json({ success: true });
    } catch (error) {
        console.error('Update Car Error:', error);
        res.status(500).json({ success: false, error: 'Failed to update car.' });
    }
});

app.delete('/api/admin/cars/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM Cars WHERE car_id=?', [req.params.id]);
        res.json({ success: true, message: 'Car deleted.' });
    } catch (error) {
        console.error('Delete Car Error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete car.' });
    }
});

// Update a car's features
app.post('/api/admin/cars/:carId/features', async (req, res) => {
    const { features } = req.body;
    const carId = req.params.carId;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        if (features && features.length > 0) {
            for (const feature of features) {
                await connection.query('INSERT IGNORE INTO Features (name) VALUES (?)', [feature]);
            }
        }

        await connection.query('DELETE FROM CarFeatures WHERE car_id = ?', [carId]);

        if (features && features.length > 0) {
            const [featureRows] = await connection.query('SELECT feature_id FROM Features WHERE name IN (?)', [features]);
            const featureValues = featureRows.map(f => [carId, f.feature_id]);
            if (featureValues.length > 0) {
                await connection.query('INSERT INTO CarFeatures (car_id, feature_id) VALUES ?', [featureValues]);
            }
        }

        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        await connection.rollback();
        console.error('Save Car Features Error:', error);
        res.status(500).json({ success: false, error: 'Failed to save car features.' });
    } finally {
        connection.release();
    }
});


// --- Admin: Employee Management ---
app.post('/api/admin/employees', async (req, res) => {
    try {
        const { first_name, last_name, job_title, email, username, password } = req.body;
        
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const sql = 'INSERT INTO Employees (first_name, last_name, job_title, email, username, password) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await pool.query(sql, [first_name, last_name, job_title, email, username, hashedPassword]);
        res.status(201).json({ success: true, employeeId: result.insertId });
    } catch (error) {
        console.error('Create Employee Error:', error);
        res.status(500).json({ success: false, error: 'Failed to create employee.' });
    }
});

app.put('/api/admin/employees/:id', async (req, res) => {
    try {
        const { first_name, last_name, job_title, email, username, password } = req.body;
        let query = 'UPDATE Employees SET first_name=?, last_name=?, job_title=?, email=?, username=?';
        const params = [first_name, last_name, job_title, email, username];

        if (password) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            query += ', password=?';
            params.push(hashedPassword);
        }
        query += ' WHERE employee_id=?';
        params.push(req.params.id);

        await pool.query(query, params);
        res.json({ success: true, message: 'Employee updated.' });
    } catch (error) {
        console.error('Update Employee Error:', error);
        res.status(500).json({ success: false, error: 'Failed to update employee.' });
    }
});

app.delete('/api/admin/employees/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM Employees WHERE employee_id=?', [req.params.id]);
        res.json({ success: true, message: 'Employee deleted.' });
    } catch (error) {
        console.error('Delete Employee Error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete employee.' });
    }
});


// --- Admin: Customer Management ---
app.put('/api/admin/customers/:id', async (req, res) => {
    try {
        const { first_name, last_name, email, phone_number, address, city, state, zip_code } = req.body;
        const sql = 'UPDATE Customers SET first_name=?, last_name=?, email=?, phone_number=?, address=?, city=?, state=?, zip_code=? WHERE customer_id=?';
        const params = [first_name, last_name, email, phone_number, address, city, state, zip_code, req.params.id];
        await pool.query(sql, params);
        res.json({ success: true, message: 'Customer updated successfully.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'Email already in use by another customer.' });
        }
        console.error("Admin Update Customer Error:", error);
        res.status(500).json({ success: false, error: 'Failed to update customer profile.' });
    }
});

app.delete('/api/admin/customers/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM Customers WHERE customer_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Customer deleted successfully.' });
    } catch (error) {
        console.error('Delete Customer Error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete customer. They may have existing rental records.' });
    }
});


// --- Admin: Blog Management ---

// Get all blog posts (including drafts)
app.get('/api/admin/blog', async (req, res) => {
    try {
        const sql = `
            SELECT
                bp.post_id,
                bp.title,
                bp.slug,
                bp.excerpt,
                bp.status,
                bp.published_at,
                bp.created_at,
                bp.updated_at,
                bp.views,
                bp.featured_image,
                e.first_name,
                e.last_name,
                GROUP_CONCAT(bc.name SEPARATOR ', ') as categories
            FROM BlogPosts bp
            LEFT JOIN Employees e ON bp.author_id = e.employee_id
            LEFT JOIN BlogPostCategories bpc ON bp.post_id = bpc.post_id
            LEFT JOIN BlogCategories bc ON bpc.category_id = bc.category_id
            GROUP BY bp.post_id
            ORDER BY bp.created_at DESC, bp.post_id DESC
        `;
        const [posts] = await pool.query(sql);
        res.json({ success: true, posts: posts });
    } catch (error) {
        console.error('Admin Get Blog Posts Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch blog posts.' });
    }
});

// Get single blog post for editing
app.get('/api/admin/blog/:id', async (req, res) => {
    try {
        const sql = `
            SELECT
                bp.*,
                GROUP_CONCAT(bpc.category_id) as category_ids
            FROM BlogPosts bp
            LEFT JOIN BlogPostCategories bpc ON bp.post_id = bpc.post_id
            WHERE bp.post_id = ?
            GROUP BY bp.post_id
        `;
        const [rows] = await pool.query(sql, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Blog post not found.' });
        }

        // Convert category_ids from comma-separated string to array
        if (rows[0].category_ids) {
            rows[0].category_ids = rows[0].category_ids.split(',').map(id => parseInt(id));
        } else {
            rows[0].category_ids = [];
        }

        res.json({ success: true, post: rows[0] });
    } catch (error) {
        console.error('Admin Get Blog Post Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch blog post.' });
    }
});

// Create new blog post
app.post('/api/admin/blog', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { title, slug, excerpt, content, featured_image, status, category_ids } = req.body;
        const author_id = req.employee.employee_id; // From authenticateAdmin middleware

        // Generate slug from title if not provided
        const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        const sql = `
            INSERT INTO BlogPosts (title, slug, excerpt, content, featured_image, author_id, status, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const published_at = status === 'published' ? new Date() : null;
        const [result] = await connection.query(sql, [
            title,
            finalSlug,
            excerpt || null,
            content,
            featured_image || null,
            author_id,
            status,
            published_at
        ]);

        const post_id = result.insertId;

        // Insert categories
        if (category_ids && category_ids.length > 0) {
            const categoryValues = category_ids.map(cat_id => [post_id, cat_id]);
            await connection.query('INSERT INTO BlogPostCategories (post_id, category_id) VALUES ?', [categoryValues]);
        }

        await connection.commit();
        res.status(201).json({ success: true, post_id: post_id });
    } catch (error) {
        await connection.rollback();
        console.error('Create Blog Post Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'A blog post with this slug already exists.' });
        }
        res.status(500).json({ success: false, error: 'Failed to create blog post.' });
    } finally {
        connection.release();
    }
});

// Update blog post
app.put('/api/admin/blog/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { title, slug, excerpt, content, featured_image, status, category_ids } = req.body;
        const post_id = req.params.id;

        // If publishing for the first time, set published_at
        const [currentPost] = await connection.query('SELECT status, published_at FROM BlogPosts WHERE post_id = ?', [post_id]);

        let published_at = currentPost[0].published_at;
        if (status === 'published' && currentPost[0].status === 'draft' && !published_at) {
            published_at = new Date();
        }

        const sql = `
            UPDATE BlogPosts
            SET title=?, slug=?, excerpt=?, content=?, featured_image=?, status=?, published_at=?
            WHERE post_id=?
        `;

        await connection.query(sql, [
            title,
            slug,
            excerpt || null,
            content,
            featured_image || null,
            status,
            published_at,
            post_id
        ]);

        // Update categories
        await connection.query('DELETE FROM BlogPostCategories WHERE post_id = ?', [post_id]);
        if (category_ids && category_ids.length > 0) {
            const categoryValues = category_ids.map(cat_id => [post_id, cat_id]);
            await connection.query('INSERT INTO BlogPostCategories (post_id, category_id) VALUES ?', [categoryValues]);
        }

        await connection.commit();
        res.json({ success: true, message: 'Blog post updated successfully.' });
    } catch (error) {
        await connection.rollback();
        console.error('Update Blog Post Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'A blog post with this slug already exists.' });
        }
        res.status(500).json({ success: false, error: 'Failed to update blog post.' });
    } finally {
        connection.release();
    }
});

// Delete blog post
app.delete('/api/admin/blog/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM BlogPosts WHERE post_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Blog post deleted successfully.' });
    } catch (error) {
        console.error('Delete Blog Post Error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete blog post.' });
    }
});

// Toggle blog post publish status
app.put('/api/admin/blog/:id/publish', async (req, res) => {
    try {
        const { status } = req.body; // 'published' or 'draft'
        const post_id = req.params.id;

        const [currentPost] = await pool.query('SELECT status, published_at FROM BlogPosts WHERE post_id = ?', [post_id]);

        if (currentPost.length === 0) {
            return res.status(404).json({ success: false, error: 'Blog post not found.' });
        }

        let published_at = currentPost[0].published_at;

        // If publishing for the first time, set published_at
        if (status === 'published' && !published_at) {
            published_at = new Date();
        }

        await pool.query(
            'UPDATE BlogPosts SET status = ?, published_at = ? WHERE post_id = ?',
            [status, published_at, post_id]
        );

        res.json({ success: true, message: `Blog post ${status === 'published' ? 'published' : 'unpublished'} successfully.` });
    } catch (error) {
        console.error('Toggle Publish Error:', error);
        res.status(500).json({ success: false, error: 'Failed to update blog post status.' });
    }
});

// Get all blog categories (admin)
app.get('/api/admin/blog-categories', async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT * FROM BlogCategories ORDER BY name ASC');
        res.json({ success: true, categories: categories });
    } catch (error) {
        console.error('Admin Get Blog Categories Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch blog categories.' });
    }
});

// Upload blog image
app.post('/api/admin/blog/upload-image', blogImageUpload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image file provided.' });
        }

        // Return the public URL path
        const imageUrl = `/images/blog/${req.file.filename}`;
        res.json({
            success: true,
            imageUrl: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Blog Image Upload Error:', error);
        res.status(500).json({ success: false, error: 'Failed to upload image.' });
    }
});


// --- Admin: Rental & Maintenance Management ---
app.put('/api/admin/rentals/return/:rental_id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rentalRows] = await connection.query('SELECT car_id FROM Rentals WHERE rental_id = ?', [req.params.rental_id]);
        if (rentalRows.length > 0) {
            await connection.query("UPDATE Cars SET status = 'Available' WHERE car_id = ?", [rentalRows[0].car_id]);
            await connection.query('UPDATE Rentals SET return_date = CURDATE() WHERE rental_id = ?', [req.params.rental_id]);
        } else {
            throw new Error('Rental not found.');
        }

        await connection.commit();
        res.json({ success: true, message: 'Return processed.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, error: 'DB transaction failed.' });
    } finally {
        connection.release();
    }
});

app.get('/api/admin/maintenance/active', async (req, res) => {
    try {
        const sql = `
            SELECT m.maintenance_id, m.service_date, m.service_type, m.notes, m.cost,
                   c.car_id, c.make, c.model, c.license_plate
            FROM Maintenance m JOIN Cars c ON m.car_id = c.car_id
            WHERE m.completion_date IS NULL ORDER BY m.service_date DESC`;
        const [rows] = await pool.query(sql);
        res.json({ success: true, active_maintenance: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database query failed.' });
    }
});

app.get('/api/admin/maintenance/history/:carId', async (req, res) => {
    try {
        const sql = 'SELECT * FROM Maintenance WHERE car_id = ? ORDER BY service_date DESC';
        const [rows] = await pool.query(sql, [req.params.carId]);
        res.json({ success: true, history: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database query failed.' });
    }
});

app.post('/api/admin/maintenance', async (req, res) => {
    const { car_id, service_date, service_type, cost, notes, mileage_at_service } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const sql = 'INSERT INTO Maintenance (car_id, service_date, service_type, cost, notes, completion_date) VALUES (?, ?, ?, ?, ?, NULL)';
        await connection.query(sql, [car_id, service_date, service_type, cost || null, notes || null]);
        await connection.query("UPDATE Cars SET status = 'Maintenance', mileage = ? WHERE car_id = ?", [mileage_at_service, car_id]);

        await connection.commit();
        res.status(201).json({ success: true, message: 'Maintenance scheduled.' });
    } catch (error) {
        console.error('MAINTENANCE SUBMISSION ERROR:', error);
        await connection.rollback();
        res.status(500).json({ success: false, error: 'Database transaction failed.' });
    } finally {
        connection.release();
    }
});

app.put('/api/admin/maintenance/complete/:maintenance_id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [maintRows] = await connection.query('SELECT car_id FROM Maintenance WHERE maintenance_id = ?', [req.params.maintenance_id]);
        if (maintRows.length === 0) throw new Error('Maintenance record not found.');
        const carId = maintRows[0].car_id;

        await connection.query("UPDATE Maintenance SET completion_date = CURDATE() WHERE maintenance_id = ?", [req.params.maintenance_id]);
        await connection.query("UPDATE Cars SET status = 'Available' WHERE car_id = ?", [carId]);

        await connection.commit();
        res.json({ success: true, message: 'Car has been returned to service.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, error: 'DB transaction failed.' });
    } finally {
        connection.release();
    }
});

app.put('/api/admin/maintenance/:maintenance_id', async (req, res) => {
    try {
        const { cost, notes } = req.body;
        await pool.query('UPDATE Maintenance SET cost = ?, notes = ? WHERE maintenance_id = ?', [cost, notes, req.params.maintenance_id]);
        res.json({ success: true, message: 'Maintenance record updated.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database query failed.' });
    }
});


// --- Admin: Dashboard & Metrics ---
app.get('/api/admin/dashboard/metrics', async (req, res) => {
    try {
        const [carStatusRows] = await pool.query(`
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available,
                   SUM(CASE WHEN status = 'Rented' THEN 1 ELSE 0 END) as rented,
                   SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) as maintenance
            FROM Cars`);
        const [revenueRows] = await pool.query(`SELECT SUM(total_cost) as totalRevenue FROM Rentals WHERE return_date IS NOT NULL`);

        const carStatus = carStatusRows[0] || { total: 0, available: 0, rented: 0, maintenance: 0 };
        const revenue = revenueRows[0] || { totalRevenue: 0 };
        res.json({ success: true, metrics: { carStatus, revenue } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'DB query failed' });
    }
});

app.get('/api/admin/metrics/revenue-by-month', async (req, res) => {
    try {
        const sql = `
            SELECT DATE_FORMAT(return_date, '%Y-%m') as month, SUM(total_cost) as revenue
            FROM Rentals WHERE return_date IS NOT NULL
            GROUP BY month ORDER BY month ASC LIMIT 12`;
        const [rows] = await pool.query(sql);
        res.json({ success: true, data: rows });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

app.get('/api/admin/metrics/popular-car-types', async (req, res) => {
    try {
        const sql = `
            SELECT ct.type_name, COUNT(r.rental_id) as rental_count
            FROM Rentals r
            JOIN Cars c ON r.car_id = c.car_id
            JOIN Car_Types ct ON c.car_type_id = ct.car_type_id
            GROUP BY ct.type_name ORDER BY rental_count DESC`;
        const [rows] = await pool.query(sql);
        res.json({ success: true, data: rows });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});


// --- Admin: Contact Messages Management ---

// Get all contact messages with optional filtering
app.get('/api/admin/contact-messages', async (req, res) => {
    try {
        const status = req.query.status || ''; // Filter by status if provided
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        let countSql = 'SELECT COUNT(*) as total FROM ContactMessages';
        let dataSql = 'SELECT * FROM ContactMessages';
        const queryParams = [];

        if (status) {
            countSql += ' WHERE status = ?';
            dataSql += ' WHERE status = ?';
            queryParams.push(status);
        }

        dataSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [[{ total }]] = await pool.query(countSql, status ? [status] : []);
        const [messages] = await pool.query(dataSql, queryParams);

        res.json({
            success: true,
            messages: messages,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalMessages: total,
                limit: limit
            }
        });
    } catch (error) {
        console.error('Admin Get Contact Messages Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch messages.' });
    }
});

// Update contact message status
app.put('/api/admin/contact-messages/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['unread', 'read', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be: unread, read, or archived.'
            });
        }

        const readAt = status === 'read' ? new Date() : null;
        const sql = 'UPDATE ContactMessages SET status = ?, read_at = ? WHERE message_id = ?';
        await pool.query(sql, [status, readAt, id]);

        res.json({ success: true, message: 'Message status updated.' });
    } catch (error) {
        console.error('Update Contact Message Status Error:', error);
        res.status(500).json({ success: false, error: 'Failed to update message status.' });
    }
});

// Delete contact message
app.delete('/api/admin/contact-messages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM ContactMessages WHERE message_id = ?', [id]);
        res.json({ success: true, message: 'Message deleted successfully.' });
    } catch (error) {
        console.error('Delete Contact Message Error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete message.' });
    }
});


// =================================================================
// VIEW ROUTES (EJS Templates for Public Pages)
// =================================================================

// Home page
app.get('/', async (req, res) => {
    try {
        // Fetch featured cars, car types, locations, and blog posts in parallel
        const [cars] = await pool.query(`
            SELECT c.car_id, c.make, c.model, c.year, c.daily_rate, c.image_url, c.mileage,
                   ct.type_name
            FROM Cars c
            JOIN Car_Types ct ON c.car_type_id = ct.car_type_id
            WHERE c.status = 'Available'
            ORDER BY c.car_id DESC
            LIMIT 6
        `);

        const [carTypes] = await pool.query('SELECT * FROM Car_Types ORDER BY type_name ASC');
        const [locations] = await pool.query('SELECT * FROM Locations ORDER BY name ASC');

        // Fetch latest 3 published blog posts
        const [blogPosts] = await pool.query(`
            SELECT post_id, title, slug, excerpt, featured_image as image,
                   DATE_FORMAT(published_at, '%b %d, %Y') as date
            FROM BlogPosts
            WHERE status = 'published'
            ORDER BY published_at DESC
            LIMIT 3
        `);

        // Fetch statistics for experience section
        const [totalCarsResult] = await pool.query('SELECT COUNT(*) as total FROM Cars');
        const [totalCustomersResult] = await pool.query('SELECT COUNT(*) as total FROM Customers');
        const [totalLocationsResult] = await pool.query('SELECT COUNT(*) as total FROM Locations');

        const stats = {
            yearsExperience: 23,
            totalCars: totalCarsResult[0].total,
            happyCustomers: totalCustomersResult[0].total,
            totalBranches: totalLocationsResult[0].total
        };

        res.render('index', {
            title: 'Prestige Rentals - Houston Car Rental | Premium Vehicles',
            user: null,
            page_name: 'index',
            featuredCars: cars,
            carTypes: carTypes,
            locations: locations,
            blogs: blogPosts,
            stats: stats
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.render('index', {
            title: 'Prestige Rentals - Houston Car Rental | Premium Vehicles',
            user: null,
            page_name: 'index',
            featuredCars: [],
            carTypes: [],
            locations: [],
            blogs: [],
            stats: {
                yearsExperience: 23,
                totalCars: 0,
                happyCustomers: 0,
                totalBranches: 0
            }
        });
    }
});

// About page
app.get('/about', async (req, res) => {
    try {
        // Get statistics
        const [totalCarsResult] = await pool.query('SELECT COUNT(*) as total FROM Cars');
        const [totalCustomersResult] = await pool.query('SELECT COUNT(*) as total FROM Customers');
        const [totalLocationsResult] = await pool.query('SELECT COUNT(*) as total FROM Locations');

        res.render('about', {
            title: 'About - Prestige Rentals | Houston Car Rental',
            user: null,
            page_name: 'about',
            stats: {
                yearsExperience: 23,
                totalCars: totalCarsResult[0].total,
                happyCustomers: totalCustomersResult[0].total,
                totalBranches: totalLocationsResult[0].total
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.render('about', {
            title: 'About - Prestige Rentals | Houston Car Rental',
            user: null,
            page_name: 'about',
            stats: {
                yearsExperience: 23,
                totalCars: 0,
                happyCustomers: 0,
                totalBranches: 0
            }
        });
    }
});

// Services page
app.get('/services', (req, res) => {
    res.render('services', {
        title: 'Services - Prestige Rentals | Houston Car Rental',
        user: null,
        page_name: 'services'
    });
});

// Pricing page
app.get('/pricing', async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = 8; // 8 cars per page
        const offset = (page - 1) * limit;

        // Get total count of available cars
        const [[{ total }]] = await pool.query(`
            SELECT COUNT(*) as total
            FROM Cars
            WHERE status = 'Available'
        `);

        // Get available cars with pricing tiers, ratings, and top features
        const [cars] = await pool.query(`
            SELECT
                c.car_id,
                c.make,
                c.model,
                c.year,
                c.daily_rate,
                c.hourly_rate,
                c.weekly_rate,
                c.monthly_rate,
                c.image_url,
                c.mileage,
                ct.type_name,
                COALESCE(AVG(r.rating), 0) as average_rating,
                COUNT(DISTINCT r.review_id) as review_count,
                GROUP_CONCAT(DISTINCT f.name ORDER BY f.name ASC SEPARATOR ', ') as features
            FROM Cars c
            JOIN Car_Types ct ON c.car_type_id = ct.car_type_id
            LEFT JOIN Reviews r ON c.car_id = r.car_id
            LEFT JOIN CarFeatures cf ON c.car_id = cf.car_id
            LEFT JOIN Features f ON cf.feature_id = f.feature_id
            WHERE c.status = 'Available'
            GROUP BY c.car_id, c.make, c.model, c.year, c.daily_rate, c.hourly_rate,
                     c.weekly_rate, c.monthly_rate, c.image_url, c.mileage, ct.type_name
            ORDER BY c.daily_rate ASC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        // Get unique car types for filtering
        const [carTypes] = await pool.query('SELECT DISTINCT type_name FROM Car_Types ORDER BY type_name ASC');

        // Calculate pagination info
        const totalPages = Math.ceil(total / limit);

        res.render('pricing', {
            title: 'Pricing - Prestige Rentals | Houston Car Rental',
            user: null,
            page_name: 'pricing',
            cars: cars,
            carTypes: carTypes,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalCars: total,
                limit: limit
            }
        });
    } catch (error) {
        console.error('Error fetching pricing:', error);
        res.render('pricing', {
            title: 'Pricing - Prestige Rentals | Houston Car Rental',
            user: null,
            page_name: 'pricing',
            cars: [],
            carTypes: [],
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalCars: 0,
                limit: 8
            }
        });
    }
});

// Cars listing page with filters, search and pagination
app.get('/cars', async (req, res) => {
    try {
        // Get query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const type = req.query.type || '';
        const location = req.query.location || '';
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || 999999;
        const sortBy = req.query.sortBy || 'newest';
        const pickupDate = req.query.pickupDate || '';
        const dropoffDate = req.query.dropoffDate || '';

        // Build WHERE clause
        let whereConditions = [];
        let queryParams = [];

        if (search) {
            whereConditions.push('(c.make LIKE ? OR c.model LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        if (type) {
            whereConditions.push('ct.type_name = ?');
            queryParams.push(type);
        }

        if (location) {
            whereConditions.push('c.location_id = ?');
            queryParams.push(location);
        }

        whereConditions.push('c.daily_rate BETWEEN ? AND ?');
        queryParams.push(minPrice, maxPrice);

        // Check for date-based availability if dates are specified
        if (pickupDate && dropoffDate) {
            whereConditions.push("c.status = 'Available'");
            // Exclude cars that have overlapping rentals during the requested period
            whereConditions.push(`
                c.car_id NOT IN (
                    SELECT car_id
                    FROM Rentals
                    WHERE status IN ('Reserved', 'Active')
                    AND (
                        (pickup_date <= ? AND return_date >= ?)
                        OR (pickup_date <= ? AND return_date >= ?)
                        OR (pickup_date >= ? AND return_date <= ?)
                    )
                )
            `);
            queryParams.push(
                dropoffDate, pickupDate,  // New rental overlaps with start
                pickupDate, dropoffDate,  // New rental overlaps with end
                pickupDate, dropoffDate   // New rental is completely within period
            );
        }

        const whereClause = whereConditions.length > 0
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';

        // Build ORDER BY clause
        let orderBy = 'c.car_id DESC';
        switch(sortBy) {
            case 'price_low':
                orderBy = 'c.daily_rate ASC';
                break;
            case 'price_high':
                orderBy = 'c.daily_rate DESC';
                break;
            case 'year_new':
                orderBy = 'c.year DESC';
                break;
            case 'year_old':
                orderBy = 'c.year ASC';
                break;
            case 'newest':
            default:
                orderBy = 'c.car_id DESC';
        }

        // Get total count for pagination
        const [countResult] = await pool.query(`
            SELECT COUNT(*) as total
            FROM Cars c
            JOIN Car_Types ct ON c.car_type_id = ct.car_type_id
            ${whereClause}
        `, queryParams);

        const totalCars = countResult[0].total;
        const totalPages = Math.ceil(totalCars / limit);

        // Get cars with pagination
        const [cars] = await pool.query(`
            SELECT c.car_id, c.make, c.model, c.year, c.daily_rate, c.image_url, c.mileage, c.status,
                   ct.type_name
            FROM Cars c
            JOIN Car_Types ct ON c.car_type_id = ct.car_type_id
            ${whereClause}
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `, [...queryParams, limit, offset]);

        // Get all car types and locations for filter dropdowns
        const [carTypes] = await pool.query('SELECT DISTINCT type_name FROM Car_Types ORDER BY type_name');
        const [locations] = await pool.query('SELECT * FROM Locations ORDER BY name ASC');

        res.render('car', {
            title: 'Cars - Prestige Rentals | Houston Car Rental',
            user: null,
            page_name: 'car',
            cars: cars,
            carTypes: carTypes,
            locations: locations,
            currentPage: page,
            totalPages: totalPages,
            totalCars: totalCars,
            filters: {
                search: search,
                type: type,
                location: location,
                minPrice: minPrice > 0 ? minPrice : '',
                maxPrice: maxPrice < 999999 ? maxPrice : '',
                sortBy: sortBy,
                pickupDate: pickupDate,
                dropoffDate: dropoffDate
            }
        });
    } catch (error) {
        console.error('Error fetching cars:', error);
        res.render('car', {
            title: 'Cars - Prestige Rentals | Houston Car Rental',
            user: null,
            page_name: 'car',
            cars: [],
            carTypes: [],
            locations: [],
            currentPage: 1,
            totalPages: 1,
            totalCars: 0,
            filters: {
                search: '',
                type: '',
                location: '',
                minPrice: '',
                maxPrice: '',
                sortBy: 'newest',
                pickupDate: '',
                dropoffDate: ''
            }
        });
    }
});

// Single car detail page
app.get('/car/:id', async (req, res) => {
    try {
        const [carRows] = await pool.query(`
            SELECT c.*, ct.type_name
            FROM Cars c
            JOIN Car_Types ct ON c.car_type_id = ct.car_type_id
            WHERE c.car_id = ?
        `, [req.params.id]);

        if (carRows.length === 0) {
            return res.status(404).render('404', {
                title: 'Car Not Found - Prestige Rentals | Houston Car Rental',
                user: null,
                page_name: 'car'
            });
        }

        const car = carRows[0];

        // Fetch features for this car
        const [features] = await pool.query(`
            SELECT f.name as feature_name
            FROM CarFeatures cf
            JOIN Features f ON cf.feature_id = f.feature_id
            WHERE cf.car_id = ?
        `, [req.params.id]);

        // Fetch reviews for this car
        const [reviews] = await pool.query(`
            SELECT r.rating, r.review_text as comment, r.review_date as created_at,
                   c.first_name, c.last_name
            FROM Reviews r
            JOIN Customers c ON r.customer_id = c.customer_id
            WHERE r.car_id = ?
            ORDER BY r.review_date DESC
        `, [req.params.id]);

        // Fetch related cars (same type, different car)
        const [relatedCars] = await pool.query(`
            SELECT c.car_id, c.make, c.model, c.daily_rate, c.image_url
            FROM Cars c
            WHERE c.car_type_id = ? AND c.car_id != ? AND c.status = 'Available'
            LIMIT 3
        `, [car.car_type_id, req.params.id]);

        res.render('car-single', {
            title: `${car.make} ${car.model} - Prestige Rentals | Houston Car Rental`,
            user: null,
            page_name: 'car',
            car: car,
            features: features,
            reviews: reviews,
            relatedCars: relatedCars
        });
    } catch (error) {
        console.error('Error fetching car details:', error);
        res.status(500).render('404', {
            title: 'Error - Prestige Rentals | Houston Car Rental',
            user: null,
            page_name: 'car'
        });
    }
});

// Blog listing page
app.get('/blog', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const offset = (page - 1) * limit;

        // Get total count of published posts
        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) as total FROM BlogPosts WHERE status = "published"'
        );

        // Get published blog posts with author info
        const sql = `
            SELECT
                bp.post_id,
                bp.title,
                bp.slug,
                bp.excerpt,
                bp.featured_image,
                bp.published_at,
                e.first_name,
                e.last_name
            FROM BlogPosts bp
            LEFT JOIN Employees e ON bp.author_id = e.employee_id
            WHERE bp.status = 'published'
            ORDER BY bp.published_at DESC
            LIMIT ? OFFSET ?
        `;
        const [blogs] = await pool.query(sql, [limit, offset]);

        // Format the data for the view
        const formattedBlogs = blogs.map(blog => ({
            id: blog.post_id,
            title: blog.title,
            excerpt: blog.excerpt || 'No excerpt available...',
            image: blog.featured_image || '/images/image_1.jpg',
            date: new Date(blog.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            slug: blog.slug
        }));

        const totalPages = Math.ceil(total / limit);

        res.render('blog', {
            title: 'Blog - Prestige Rentals | Houston Car Rental',
            user: null,
            page_name: 'blog',
            blogs: formattedBlogs,
            currentPage: page,
            totalPages: totalPages,
            totalBlogs: total
        });
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        res.status(500).render('error', {
            title: 'Error - Prestige Rentals | Houston Car Rental',
            user: null,
            page_name: 'error',
            message: 'Failed to load blog posts'
        });
    }
});

// Single blog post page
app.get('/blog/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const sql = `
            SELECT
                bp.post_id,
                bp.title,
                bp.slug,
                bp.excerpt,
                bp.content,
                bp.featured_image,
                bp.published_at,
                bp.views,
                e.first_name,
                e.last_name,
                e.job_title,
                GROUP_CONCAT(bc.name SEPARATOR ', ') as categories
            FROM BlogPosts bp
            LEFT JOIN Employees e ON bp.author_id = e.employee_id
            LEFT JOIN BlogPostCategories bpc ON bp.post_id = bpc.post_id
            LEFT JOIN BlogCategories bc ON bpc.category_id = bc.category_id
            WHERE bp.slug = ? AND bp.status = 'published'
            GROUP BY bp.post_id
        `;

        const [rows] = await pool.query(sql, [slug]);

        if (rows.length === 0) {
            return res.status(404).render('error', {
                title: 'Blog Post Not Found - Prestige Rentals | Houston Car Rental',
                user: null,
                page_name: 'error',
                message: 'The blog post you are looking for does not exist.'
            });
        }

        const post = rows[0];

        // Increment view count
        await pool.query('UPDATE BlogPosts SET views = views + 1 WHERE post_id = ?', [post.post_id]);

        // Format data for the view
        const formattedPost = {
            id: post.post_id,
            title: post.title,
            content: post.content,
            excerpt: post.excerpt,
            image: post.featured_image || '/images/image_1.jpg',
            author: `${post.first_name} ${post.last_name}`,
            author_title: post.job_title || 'Author',
            date: new Date(post.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            views: post.views + 1,
            categories: post.categories || 'Uncategorized'
        };

        res.render('blog-single', {
            title: `${post.title} - Prestige Rentals Blog`,
            user: null,
            page_name: 'blog',
            post: formattedPost
        });
    } catch (error) {
        console.error('Error fetching blog post:', error);
        res.status(500).render('error', {
            title: 'Error - Prestige Rentals | Houston Car Rental',
            user: null,
            page_name: 'error',
            message: 'Failed to load blog post'
        });
    }
});

// Contact page
app.get('/contact', (req, res) => {
    res.render('contact', {
        title: 'Contact - Prestige Rentals | Houston Car Rental',
        user: null,
        page_name: 'contact'
    });
});

// Contact form submission (public endpoint)
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required.'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid email address.'
            });
        }

        // Insert into database
        const sql = 'INSERT INTO ContactMessages (name, email, subject, message) VALUES (?, ?, ?, ?)';
        const [result] = await pool.query(sql, [name, email, subject, message]);

        res.status(201).json({
            success: true,
            message: 'Thank you for contacting us! We will get back to you soon.',
            messageId: result.insertId
        });
    } catch (error) {
        console.error('Contact Form Submission Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send message. Please try again later.'
        });
    }
});

// =================================================================
// END VIEW ROUTES
// =================================================================

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`API Server is running successfully on http://localhost:${PORT}`);
});
