# 🚗 Prestige Rentals - Car Rental Management System

> A comprehensive, full-stack car rental management system built with Node.js, Express, Astro, React, and MySQL. Features a public website, customer portal, and admin dashboard.

**Location:** Houston, Texas | **Database:** MySQL | **Architecture:** Multi-tier Application

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Features](#-features)
- [Security](#-security)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## 🎯 Overview

Prestige Rentals is a **production-ready car rental management system** featuring:

- ✅ **Public Website** - Browse cars, read blog posts, contact form
- ✅ **Customer Portal** - Book rentals, manage profile, save favorites, write reviews
- ✅ **Admin Dashboard** - Comprehensive management of cars, customers, rentals, blog, maintenance
- ✅ **RESTful API** - Complete backend API with JWT authentication
- ✅ **Multi-tier Pricing** - Hourly, daily, weekly, and monthly rental rates
- ✅ **Reviews & Ratings** - Customer feedback system
- ✅ **Blog/CMS** - Content management for blog posts
- ✅ **Contact Management** - Admin panel for contact form submissions

### 🎓 Academic Disclaimer

This project was created as part of a cybersecurity degree curriculum for a database class. While it demonstrates robust database interaction and front-end access control, it is primarily an educational project and not intended to be completely secure against all attack vectors. Please keep this in mind when encountering bugs or possible vulnerabilities.

**Code Attribution:** All code was written by the original author but organized using Google Gemini for readability. Comments may be AI-generated, but the logic and implementation are original.

---

## 🏗️ System Architecture

The system consists of **3 applications** working together:

### Application 1: Express Backend (Port 3001) ⭐ PRIMARY

**Purpose:** Main backend server + Public website
**Technology:** Node.js + Express + EJS
**Location:** `/server/` directory

- 🌐 Serves public website with server-side rendering (EJS templates)
- 🔌 Provides RESTful API for all CRUD operations
- 🗄️ Direct MySQL database connection
- 🔐 JWT authentication and authorization
- 📊 Business logic and data processing

### Application 2: Astro Frontend (Port 4321) ⭐ DASHBOARDS

**Purpose:** Customer & Admin Dashboards
**Technology:** Astro + React + Tailwind CSS
**Location:** `/src/` directory (project root)

- 🎨 Modern, interactive user interfaces
- 👤 Customer dashboard (bookings, profile, favorites)
- 👨‍💼 Admin dashboard (comprehensive management)
- 📱 Responsive design with Tailwind CSS
- 🔄 Consumes Express API via fetch/JWT

### Application 3: PHP Legacy (Port 80) - OPTIONAL

**Purpose:** Legacy PHP application
**Technology:** PHP + MAMP
**Location:** `/car_rental/` directory

- ⚠️ Older version of the system
- 🔧 Can be ignored for modern development
- 📦 Included for reference/migration purposes

---

## 🎨 Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
└────────┬────────────────────────────────────────────────────────┘
         │
         ├── http://localhost:4321/ (Astro Entry Point)
         │   └─> Auto-redirects to → http://localhost:3001/
         │
         ├── http://localhost:3001/ (Express - PUBLIC WEBSITE)
         │   ├─> Homepage (EJS)
         │   ├─> About, Services, Pricing, Cars, Blog, Contact
         │   └─> Static assets from /public/
         │
         └── http://localhost:4321/login (Astro - AUTH PAGES)
             │
             ├── Customer Login
             │   ├─> POST /api/customers/login → Receives JWT
             │   ├─> Stores token in sessionStorage
             │   └─> Redirects to /customer/dashboard
             │       ├─> Browse & search available cars
             │       ├─> Book rental with add-ons
             │       ├─> View active rentals & history
             │       ├─> Manage profile & payment methods
             │       ├─> Add cars to favorites
             │       └─> Write reviews & ratings
             │
             └── Admin/Employee Login
                 ├─> POST /api/employees/login → Receives JWT
                 ├─> Stores token in localStorage
                 └─> Redirects to /admin/dashboard
                     ├─> Dashboard metrics & analytics
                     ├─> Manage cars (CRUD + features)
                     ├─> Manage customers & employees
                     ├─> Process rental returns
                     ├─> Track vehicle maintenance
                     ├─> Publish blog posts
                     └─> Handle contact messages
```

---

## ⚙️ Technology Stack

### Backend (Express Server)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Express** | 5.1.0 | Web framework |
| **EJS** | 3.1.10 | Template engine for views |
| **MySQL2** | 3.15.2 | Database driver (with Promises) |
| **bcrypt** | 6.0.0 | Password hashing |
| **jsonwebtoken** | 9.0.2 | JWT authentication |
| **Helmet** | 8.1.0 | Security HTTP headers |
| **CORS** | 2.8.5 | Cross-origin resource sharing |
| **express-rate-limit** | 8.1.0 | Rate limiting (DDoS protection) |
| **Multer** | 2.0.2 | File upload handling |
| **dotenv** | 17.2.3 | Environment variables |

### Frontend (Astro Application)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Astro** | 5.15.1 | Static site generator + framework |
| **React** | 19.2.0 | UI component library |
| **Tailwind CSS** | 3.0 | Utility-first CSS framework |
| **Framer Motion** | 12.23.24 | Animation library |
| **Chart.js** | 4.5.1 | Data visualization (admin analytics) |
| **react-router-dom** | 7.9.4 | Client-side routing |
| **jsPDF** | 3.0.3 | PDF generation (invoices) |
| **html2canvas** | 1.4.1 | Screenshot/export functionality |
| **FontAwesome** | 7.1.0 | Icon library |

### Database

| Technology | Details |
|------------|---------|
| **MySQL** | Version 8+ (via MAMP) |
| **Port** | 8889 |
| **Database Name** | `car_rental_db` |
| **Total Tables** | 19 tables |
| **Schema Lines** | 1,338 lines of SQL |

---

## 📁 Project Structure

```
car_rental_website/
│
├── 📄 .env                          # Environment variables (DB, JWT secrets)
├── 📄 package.json                  # Astro app dependencies
├── 📄 astro.config.mjs              # Astro configuration
├── 📄 tailwind.config.mjs           # Tailwind CSS configuration
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 README.md                     # This file
│
├── 📂 server/                       # EXPRESS BACKEND (Port 3001)
│   ├── 📄 index.js                  # Main server file (2,355 lines)
│   ├── 📄 package.json              # Server dependencies
│   ├── 📄 hashgen.js                # Password hashing utility
│   └── 📂 middleware/
│       ├── 📄 auth.js               # JWT authentication middleware
│       └── 📄 authMiddleware.js     # Additional auth helpers
│
├── 📂 src/                          # ASTRO FRONTEND (Port 4321)
│   ├── 📂 pages/                    # Astro routes
│   │   ├── 📄 index.astro           # Redirects to Express (3001)
│   │   ├── 📄 login.astro           # Login page (with session check)
│   │   ├── 📄 logout.astro          # Logout & session cleanup
│   │   ├── 📄 reset-password.astro  # Password reset flow
│   │   ├── 📂 admin/
│   │   │   └── 📄 dashboard.astro   # Admin dashboard entry
│   │   └── 📂 customer/
│   │       ├── 📄 dashboard.astro   # Customer dashboard entry
│   │       ├── 📄 profile.astro     # Customer profile page
│   │       └── 📂 rent/
│   │           └── 📄 [id].astro    # Dynamic rental booking flow
│   │
│   ├── 📂 components/               # React Components
│   │   ├── 📄 LoginForm.jsx         # Login/Register form
│   │   ├── 📄 CustomerProfile.jsx   # Profile management
│   │   ├── 📄 RentalFlow.jsx        # Rental booking flow
│   │   ├── 📄 CustomerCarSearch.jsx # Car search & filtering
│   │   ├── 📄 GuestCarSearch.jsx    # Public car search
│   │   ├── 📂 admin/                # Admin React components
│   │   │   ├── 📄 AdminDashboard.jsx        # Main admin component
│   │   │   ├── 📄 MetricsDashboard.jsx      # Analytics dashboard
│   │   │   ├── 📄 CarManager.jsx            # Car CRUD operations
│   │   │   ├── 📄 CustomerManager.jsx       # Customer management
│   │   │   ├── 📄 EmployeeManager.jsx       # Employee management
│   │   │   ├── 📄 RentalManager.jsx         # Rental management
│   │   │   ├── 📄 MaintenanceManager.jsx    # Maintenance tracking
│   │   │   ├── 📄 BlogManager.jsx           # Blog CMS
│   │   │   └── 📄 ContactMessageManager.jsx # Contact messages
│   │   └── 📂 template/             # Astro template components
│   │       ├── 📄 TemplateNavbar.astro
│   │       ├── 📄 TemplateFooter.astro
│   │       ├── 📄 CarGrid.astro
│   │       ├── 📄 BlogGrid.astro
│   │       └── 📄 StatsCounter.astro
│   │
│   ├── 📂 layouts/
│   │   └── 📄 Layout.astro          # Main layout wrapper
│   ├── 📂 styles/                   # Global CSS
│   └── 📂 utils/                    # Utility functions
│
├── 📂 views/                        # EJS TEMPLATES (for Express)
│   ├── 📄 index.ejs                 # Homepage
│   ├── 📄 about.ejs                 # About page
│   ├── 📄 services.ejs              # Services page
│   ├── 📄 pricing.ejs               # Pricing with multi-tier rates
│   ├── 📄 car.ejs                   # Car listing (paginated)
│   ├── 📄 car-single.ejs            # Single car details
│   ├── 📄 blog.ejs                  # Blog listing
│   ├── 📄 blog-single.ejs           # Single blog post
│   ├── 📄 contact.ejs               # Contact form with Google Maps
│   ├── 📄 404.ejs                   # Error page
│   └── 📂 partials/                 # Reusable EJS partials
│       ├── 📄 _header.ejs
│       ├── 📄 _footer.ejs
│       ├── 📄 _navbar.ejs           # Navigation (session-aware)
│       ├── 📄 _about.ejs
│       ├── 📄 _services.ejs
│       ├── 📄 _testimonials.ejs
│       ├── 📄 _blog.ejs
│       └── 📄 _contact.ejs          # Contact form + Google Maps
│
├── 📂 public/                       # Static Assets
│   ├── 📂 images/                   # Car images, blog images
│   ├── 📂 css/                      # Stylesheets
│   ├── 📂 js/                       # Client-side JavaScript
│   ├── 📂 fonts/                    # Web fonts
│   ├── 📂 uploads/                  # User-uploaded files
│   └── 📄 splash.jpg                # Landing page image
│
├── 📂 database/                     # Database Migration Files
│   ├── 📄 contact_messages_table.sql  # Contact messages table
│   └── 📄 add_pricing_columns.sql     # Pricing tiers migration
│
└── 📂 car_rental/                   # PHP LEGACY APP (Optional)
    ├── 📄 SQL_code.txt              # Complete schema (1,338 lines)
    ├── 📄 DATABASE_CHANGELOG.md     # Detailed DB changes log
    └── 📄 README.txt                # PHP app documentation
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   📥 [Download Node.js](https://nodejs.org/en/download)
   ⚠️ **Restart your system after installation**

2. **MAMP** (for MySQL server)
   📥 [Download MAMP](https://www.mamp.info/en/downloads/)

3. **MySQL Workbench** (for database setup)
   📥 [Download MySQL Workbench](https://dev.mysql.com/downloads/workbench/)

4. **Visual Studio Code** (optional, for code editing)
   📥 [Download VS Code](https://code.visualstudio.com/download)

---

### Step 1: Database Setup

1. **Start MAMP**
   - Launch MAMP application
   - Ensure MySQL is running on port **8889**
   - Web Server port: **80** (for legacy PHP app, optional)

2. **Create Database**
   - Open **MySQL Workbench**
   - Connect to localhost:8889 (username: `root`, password: `root`)
   - Create new schema: `car_rental_db`

3. **Import SQL Schema**
   - Open the SQL file: `/car_rental/SQL_code.txt`
   - Copy all **1,338 lines** of SQL code
   - Execute in MySQL Workbench against `car_rental_db`
   - This creates all 19 tables with sample data

---

### Step 2: Environment Configuration

Create a `.env` file in the project root (if not exists) with the following:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=8889
DB_USER=root
DB_PASSWORD=root
DB_NAME=car_rental_db

# Server Configuration
PORT=3001

# JWT Configuration
JWT_SECRET=fb27cab2a5a28dbb41e9aae5e52df8161dac3b2017a65229c01aaeb7935dd4f8
JWT_EXPIRES_IN=2h
COOKIE_NAME=jwt_token
```

---

### Step 3: Install Dependencies

#### For Express Backend (Port 3001)

```bash
# Navigate to server directory
cd car_rental_website/server

# Install all dependencies
npm install

# Packages installed:
# - express, ejs, mysql2, bcrypt, jsonwebtoken
# - helmet, cors, express-rate-limit, multer, dotenv
```

#### For Astro Frontend (Port 4321)

```bash
# Navigate to project root
cd car_rental_website

# Install all dependencies
npm install

# Packages installed:
# - astro, react, react-dom, @astrojs/react, @astrojs/tailwind
# - tailwind css, chart.js, framer-motion, react-router-dom
# - jspdf, html2canvas, fontawesome
```

---

### Step 4: Start Applications

You need **TWO command prompts/terminals** running simultaneously:

#### Terminal 1: Express Backend

```bash
cd car_rental_website/server
node index.js
```

**Expected Output:**
```
Server running on http://localhost:3001
MySQL database connected successfully!
```

#### Terminal 2: Astro Frontend

```bash
cd car_rental_website
npm run dev
```

**Expected Output:**
```
🚀 astro v5.15.1 started in XXXms

  ┃ Local    http://localhost:4321/
  ┃ Network  use --host to expose
```

---

### Step 5: Access the Application

1. **Visit the Public Website**
   Open browser: **http://localhost:3001/**
   Browse cars, read blog, explore services

2. **Login to Dashboard**
   Open browser: **http://localhost:4321/login**

   **Employee/Admin Login:**
   - Username: `user`
   - Password: `user`
   - ⚠️ **Change password immediately after first login!**

   **Customer Login:**
   - Click "Sign Up" to create a new account
   - Use your email and password to login

3. **Access Dashboards**
   - **Customer:** http://localhost:4321/customer/dashboard
   - **Admin:** http://localhost:4321/admin/dashboard

---

## 🗄️ Database Schema

The system uses a **comprehensive 19-table MySQL database** (`car_rental_db`):

### Core Tables (Original 6)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| **Car_Types** | Lookup table for car categories | type_id, type_name |
| **Cars** | Vehicle inventory | car_id, make, model, year, daily_rate, hourly_rate, weekly_rate, monthly_rate, status, mileage |
| **Customers** | Customer accounts | customer_id, first_name, last_name, email, password, reset_token |
| **Employees** | Employee/Admin accounts | employee_id, username, password, first_name, last_name, role |
| **Rentals** | Rental transactions | rental_id, customer_id, car_id, start_date, return_date, due_date, total_cost, late_fee, status |
| **Payments** | Payment records | payment_id, rental_id, amount, payment_date, payment_method |
| **Maintenance** | Vehicle service records | maintenance_id, car_id, service_type, service_date, completion_date, cost, mileage_at_service |

### Extended Tables (13 New)

| Table | Purpose | Features |
|-------|---------|----------|
| **ContactMessages** | Contact form submissions | Status tracking (unread/read/archived), timestamps |
| **Reviews** | Customer car reviews | Rating (1-5), review text, timestamps, foreign keys |
| **FavoriteCars** | Customer favorites | Junction table (customer ↔ car) |
| **CustomerPaymentMethods** | Saved payment methods | Masked card numbers, expiry dates, default flag |
| **Features** | Car features lookup | Name, description, icon (12 sample features) |
| **CarFeatures** | Car-to-feature mapping | Junction table with CASCADE delete |
| **Addons** | Rental add-ons | GPS, child seat, insurance, etc. (8 sample addons) |
| **RentalAddons** | Rental-to-addon mapping | Quantity, total price |
| **BlogCategories** | Blog taxonomy | Name, slug, description (5 sample categories) |
| **BlogPosts** | Blog content | Title, slug, content, author, status, views, timestamps |
| **BlogPostCategories** | Blog-to-category mapping | Many-to-many relationship |
| **Locations** | Rental branches | Address, city, state, phone, operating hours |

### Database Features

- ✅ **Multi-tier Pricing:** Hourly, daily, weekly, monthly rates for all cars
- ✅ **Foreign Key Constraints:** Referential integrity with CASCADE delete
- ✅ **Indexes:** Performance optimization on frequently queried columns
- ✅ **ENUM Types:** Status fields with predefined values
- ✅ **Timestamps:** Automatic created_at, updated_at tracking
- ✅ **Sample Data:** 25+ sample entries for testing

**Full Schema:** See `/car_rental/SQL_code.txt` (1,338 lines)
**Change Log:** See `/car_rental/DATABASE_CHANGELOG.md`

---

## 🔌 API Documentation

The Express backend provides a comprehensive RESTful API on **port 3001**.

### Base URL

```
http://localhost:3001/api
```

### Authentication

All protected endpoints require a JWT token:

```http
Authorization: Bearer <jwt_token>
```

---

### Public Endpoints (No Auth)

#### Cars & Inventory

```http
GET /api/public/featured-cars
GET /api/car-types
GET /api/features
GET /api/addons
```

#### Blog

```http
GET /api/public/blog-posts          # Published posts only
GET /api/public/blog-posts/:slug    # Single post by slug
GET /api/public/blog-categories     # All categories
```

#### Testimonials

```http
GET /api/public/testimonials        # Customer testimonials
```

#### Contact

```http
POST /api/contact                   # Submit contact form
Body: { name, email, subject, message }
```

---

### Authentication Endpoints (Rate Limited)

```http
POST /api/employees/login
Body: { username, password }
Response: { success, token, user }
Rate Limit: 10 requests per 15 minutes

POST /api/customers/login
Body: { email, password }
Response: { success, token, user }
Rate Limit: 10 requests per 15 minutes

POST /api/customers/register
Body: { first_name, last_name, email, password }
Response: { success, message }
Rate Limit: 10 accounts per hour per IP

POST /api/customers/forgot-password
Body: { email }
Response: { success, message }
Rate Limit: 5 requests per hour per IP

POST /api/customers/reset-password
Body: { token, newPassword }
Response: { success, message }
Rate Limit: 5 requests per hour per IP
```

---

### Customer Endpoints (JWT Required)

#### Profile Management

```http
GET /api/customers/profile              # Get customer profile
PUT /api/customers/profile              # Update profile
PUT /api/customers/password             # Change password
```

#### Car Browsing & Rental

```http
GET /api/cars/available                 # Browse available cars
GET /api/cars/:id                       # Get car details

POST /api/rentals/create                # Create rental booking
Body: { car_id, start_date, return_date, addons[] }

GET /api/customers/active-rental        # Get active rental
GET /api/customers/rental-history       # Get rental history

PUT /api/rentals/return-by-customer/:rentalId    # Return rental
DELETE /api/rentals/:rentalId           # Cancel rental
```

#### Reviews

```http
GET /api/customers/can-review/:carId    # Check if can review
POST /api/reviews                       # Create review
Body: { car_id, rating, review_text }

PUT /api/reviews/:reviewId              # Update review
DELETE /api/reviews/:reviewId           # Delete review
```

#### Favorites

```http
GET /api/customers/favorites            # Get favorite cars
POST /api/customers/favorites           # Add to favorites
Body: { car_id }

DELETE /api/customers/favorites/:car_id # Remove from favorites
```

#### Payment Methods

```http
GET /api/customers/payment-methods      # Get saved payment methods
POST /api/customers/payment-methods     # Add payment method
DELETE /api/customers/payment-methods/:methodId  # Remove method
```

---

### Admin Endpoints (Employee JWT Required)

#### Dashboard & Analytics

```http
GET /api/admin/dashboard/metrics        # Dashboard summary
Response: { totalRevenue, activeRentals, totalCars, totalCustomers, ... }

GET /api/admin/metrics/revenue-by-month # Monthly revenue chart data
GET /api/admin/metrics/popular-car-types # Car type popularity
```

#### Employee Management

```http
GET /api/admin/employees                # List all employees
POST /api/admin/employees               # Create employee
PUT /api/admin/employees/:id            # Update employee
DELETE /api/admin/employees/:id         # Delete employee
```

#### Customer Management

```http
GET /api/admin/customers                # List all customers
PUT /api/admin/customers/:id            # Update customer
DELETE /api/admin/customers/:id         # Delete customer
```

#### Car Management

```http
GET /api/admin/cars                     # List all cars
POST /api/admin/cars                    # Create car (with file upload)
PUT /api/admin/cars/:id                 # Update car
DELETE /api/admin/cars/:id              # Delete car
POST /api/admin/cars/:carId/features    # Assign features to car
```

#### Rental Management

```http
GET /api/admin/rentals                  # List all rentals (with filters)
PUT /api/admin/rentals/return/:rental_id # Process rental return
```

#### Maintenance Management

```http
GET /api/admin/maintenance/active       # Active maintenance records
GET /api/admin/maintenance/history/:carId # Maintenance history for car
POST /api/admin/maintenance             # Create maintenance record
PUT /api/admin/maintenance/complete/:maintenance_id  # Complete maintenance
PUT /api/admin/maintenance/:maintenance_id  # Update maintenance
```

#### Blog Management (CMS)

```http
GET /api/admin/blog                     # List all posts (including drafts)
GET /api/admin/blog/:id                 # Get single post
POST /api/admin/blog                    # Create post
PUT /api/admin/blog/:id                 # Update post
DELETE /api/admin/blog/:id              # Delete post
PUT /api/admin/blog/:id/publish         # Publish/unpublish post
GET /api/admin/blog-categories          # Get categories
POST /api/admin/blog/upload-image       # Upload blog image (multipart/form-data)
```

#### Contact Messages

```http
GET /api/admin/contact-messages         # List messages (with status filter)
Query: ?status=unread&page=1&limit=20

PUT /api/admin/contact-messages/:id/status  # Update message status
Body: { status: 'read' | 'unread' | 'archived' }

DELETE /api/admin/contact-messages/:id  # Delete message
```

---

## ✨ Features

### Public Website Features (Express/EJS)

- 🏠 **Homepage** - Featured cars, testimonials, services overview
- ℹ️ **About Page** - Company information and mission
- 🛠️ **Services** - Rental services and benefits
- 💰 **Pricing** - Multi-tier pricing table (hourly/daily/weekly/monthly) with pagination (8 cars per page)
- 🚘 **Car Listing** - Browse all available cars with filtering
- 📝 **Car Details** - Detailed car information, features, reviews, ratings
- 📰 **Blog** - Published blog posts with categories
- 📞 **Contact** - Contact form with Google Maps integration
- 🎨 **Responsive Design** - Bootstrap-based responsive templates

### Customer Portal Features (Astro/React)

- 🔐 **Authentication**
  - Login/Register with validation
  - Password reset via email token
  - Session management (sessionStorage)
  - Auto-redirect if already logged in

- 🚗 **Car Search & Booking**
  - Advanced search with filters (type, price, availability)
  - Real-time availability checking
  - Multi-step rental booking flow
  - Add-on selection (GPS, child seat, insurance, etc.)
  - Price calculation with add-ons

- 📊 **Dashboard**
  - Active rental tracking with countdown
  - Rental history with status
  - Quick actions (extend, return, cancel)

- 👤 **Profile Management**
  - Update personal information
  - Change password
  - View account statistics

- ❤️ **Favorites**
  - Save favorite cars
  - Quick access to preferred vehicles

- ⭐ **Reviews & Ratings**
  - Write reviews for rented cars
  - 1-5 star rating system
  - Edit/delete own reviews

- 💳 **Payment Methods**
  - Save payment methods securely
  - Masked card numbers
  - Set default payment method

### Admin Dashboard Features (Astro/React)

- 📈 **Analytics Dashboard**
  - Total revenue, active rentals, total cars, total customers
  - Monthly revenue chart (Chart.js)
  - Popular car types visualization
  - Recent activity feed

- 🚙 **Car Management**
  - Full CRUD operations
  - Image upload for car photos
  - Assign features to cars
  - Track car status (Available, Rented, Maintenance)
  - Set multi-tier pricing (hourly, daily, weekly, monthly)

- 👥 **Customer Management**
  - View all customers
  - Edit customer information
  - Delete customer accounts
  - View customer rental history

- 👨‍💼 **Employee Management**
  - Create new employee accounts
  - Assign roles
  - Update employee information
  - Delete employees

- 📋 **Rental Management**
  - View all rentals (past, active, upcoming)
  - Filter by status, customer, car
  - Process rental returns
  - Calculate late fees automatically
  - View rental details with customer/car info

- 🔧 **Maintenance Tracking**
  - Schedule maintenance for cars
  - Track active maintenance
  - View maintenance history per car
  - Mark maintenance as complete
  - Update car status automatically

- 📝 **Blog CMS**
  - Create/edit/delete blog posts
  - Rich text editor
  - Upload featured images
  - Assign categories
  - Publish/draft status
  - View post analytics (views)

- 📬 **Contact Messages**
  - View all contact form submissions
  - Filter by status (unread, read, archived)
  - Mark as read/unread
  - Delete messages
  - Pagination support

---

## 🔐 Security

### Authentication & Authorization

- **JWT (JSON Web Tokens)**
  - Secret: Stored in .env (256-bit key)
  - Expiration: 2 hours
  - Payload: user_id, role, email
  - Storage: localStorage (admin), sessionStorage (customer)

- **Password Security**
  - bcrypt hashing with salt rounds
  - Minimum password requirements (enforced client-side)
  - Password reset via secure token (expires in 1 hour)

### Request Security

- **Helmet.js** - Secure HTTP headers
  - Content Security Policy (CSP) configured for:
    - Google Maps (maps.googleapis.com)
    - YouTube embeds (youtube.com)
    - Self-hosted assets
  - XSS Protection
  - No Sniff
  - Frame Options

- **CORS** - Cross-Origin Resource Sharing
  - Allowed origins: localhost:4321 (dev), production domain
  - Credentials: true (for cookies)
  - Methods: GET, POST, PUT, DELETE

- **Rate Limiting**
  - Login attempts: 10 per 15 minutes per IP
  - Registration: 10 accounts per hour per IP
  - Password reset: 5 requests per hour per IP
  - Prevents brute force attacks

### Data Security

- **SQL Injection Prevention**
  - Parameterized queries with mysql2
  - No string concatenation in queries

- **XSS Prevention**
  - Input sanitization on backend
  - Content Security Policy
  - React's built-in XSS protection

- **File Upload Security**
  - Multer file type validation
  - File size limits
  - Secure file naming
  - Upload directory outside web root

### Session Management

- **Token Expiration:** 2 hours
- **Logout:** Clears localStorage, sessionStorage, and cookies
- **Auto-redirect:** Logged-in users redirected from login page
- **Protected Routes:** JWT verification middleware

---

## 🛠️ Development

### NPM Scripts

#### Astro Frontend

```bash
npm run dev          # Start Astro dev server (port 4321)
npm run build        # Build for production
npm run preview      # Preview production build
```

#### Express Backend

```bash
node index.js        # Start Express server (port 3001)
```

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `DB_HOST` | MySQL host | localhost |
| `DB_PORT` | MySQL port | 8889 |
| `DB_USER` | Database user | root |
| `DB_PASSWORD` | Database password | root |
| `DB_NAME` | Database name | car_rental_db |
| `PORT` | Express server port | 3001 |
| `JWT_SECRET` | JWT signing secret | (256-bit key) |
| `JWT_EXPIRES_IN` | Token expiration | 2h |
| `COOKIE_NAME` | JWT cookie name | jwt_token |

### Database Migrations

New database changes should be:
1. Created in `/database/` directory as `.sql` files
2. Appended to `/car_rental/SQL_code.txt`
3. Documented in `/car_rental/DATABASE_CHANGELOG.md`

### Code Organization

- **Backend Routes:** `/server/index.js` (lines 218-2309)
- **React Components:** `/src/components/`
- **Astro Pages:** `/src/pages/`
- **EJS Views:** `/views/`
- **Middleware:** `/server/middleware/`
- **Utilities:** `/src/utils/`

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:8889
```

**Solution:**
- Ensure MAMP is running
- Check MySQL is on port 8889
- Verify credentials in .env file

#### 2. JWT Token Invalid

```
Error: jwt malformed
```

**Solution:**
- Clear localStorage and sessionStorage
- Log out and log back in
- Check JWT_SECRET matches in .env

#### 3. CORS Error

```
Access to fetch at 'http://localhost:3001/api/...' has been blocked by CORS policy
```

**Solution:**
- Verify CORS configuration in `/server/index.js`
- Ensure request includes credentials: `credentials: 'include'`
- Check Origin header matches allowed origins

#### 4. Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
- Kill existing process on port 3001:
  ```bash
  # macOS/Linux
  lsof -ti:3001 | xargs kill -9

  # Windows
  netstat -ano | findstr :3001
  taskkill /PID <PID> /F
  ```

#### 5. Google Maps Not Loading

```
This content is blocked. Contact the site owner to fix the issue.
```

**Solution:**
- Verify Helmet CSP configuration allows `maps.googleapis.com`
- Check frameSrc includes `https://www.google.com`

#### 6. Session Not Persisting

**Solution:**
- Check browser allows localStorage/sessionStorage
- Verify token is being saved in LoginForm.jsx (lines 159-160)
- Ensure logout.astro clears all storage

---

## 📚 Additional Resources

- **Database Schema:** `/car_rental/SQL_code.txt` (1,338 lines)
- **Database Changes:** `/car_rental/DATABASE_CHANGELOG.md`
- **PHP Legacy Docs:** `/car_rental/README.txt`

---

## 📄 License

This project is created for educational purposes as part of a cybersecurity degree curriculum.

**Academic Use:** Free to use for learning and reference.
**Commercial Use:** Not recommended without significant security enhancements.

---

## 🙏 Acknowledgments

- **Original Author:** Project created for database class
- **Code Organization:** Google Gemini (for readability)
- **Template:** Bootstrap-based car rental template
- **Icons:** FontAwesome
- **Database:** MySQL Community Edition
- **Frameworks:** Express.js, Astro, React

---

## 📞 Support

For issues, questions, or contributions:
- Check the troubleshooting section above
- Review the database changelog for recent changes
- Examine the Express server logs for API errors
- Inspect browser console for frontend errors

---

**Last Updated:** 2025-11-17
**Version:** 2.0 (Astro + Express Multi-tier Architecture)
**Database Tables:** 19 tables with 1,338 lines of SQL
**Total Features:** Customer Portal + Admin Dashboard + Public Website + RESTful API

---

**🚀 Happy Coding! Enjoy building with Prestige Rentals!**
