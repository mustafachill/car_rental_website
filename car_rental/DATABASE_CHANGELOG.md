# Database Changelog - Prestige Rentals

**Last Updated:** 2025-11-17

## Summary
SQL_code.txt has been updated from **1,036 lines** to **1,338 lines** (+302 lines) with all recent database changes.

---

## 📊 Database Statistics

### Before Update
- **Total Tables:** 6
- **File Lines:** 1,036

### After Update
- **Total Tables:** 19 (+13 new tables)
- **File Lines:** 1,338
- **New Columns:** 10+ added to existing tables
- **New Features:** Reviews, Blog, Contact Messages, Payment Methods, Car Features, Addons

---

## 🆕 Section 1: ALTER TABLE Statements

### Cars Table
Added multi-tier pricing system:
- ✅ `hourly_rate DECIMAL(10,2)` - Hourly rental rate
- ✅ `weekly_rate DECIMAL(10,2)` - Weekly rental rate (6-day pricing)
- ✅ `monthly_rate DECIMAL(10,2)` - Monthly rental rate (25-day pricing)

**Data Migration:** All existing cars have calculated rates based on daily_rate

### Employees Table
Added authentication fields:
- ✅ `username VARCHAR(100) UNIQUE` - Login username
- ✅ `password VARCHAR(255)` - Hashed password

### Customers Table
Added password reset functionality:
- ✅ `reset_token VARCHAR(255)` - Password reset token
- ✅ `reset_token_expires BIGINT` - Token expiration timestamp

### Rentals Table
Added due date tracking:
- ✅ `due_date DATE` - Planned return date (separate from actual return_date)

### Maintenance Table
Added completion tracking:
- ✅ `completion_date DATE` - Service completion date
- ✅ `mileage_at_service INT` - Vehicle mileage at service time

---

## 🆕 Section 2: New Tables (13 Total)

### 1. ContactMessages
**Purpose:** Store contact form submissions
**Columns:** message_id, name, email, subject, message, status, created_at, read_at
**Features:**
- ENUM status: 'unread', 'read', 'archived'
- Indexed on status and created_at for fast filtering

### 2. Reviews
**Purpose:** Customer reviews and ratings for cars
**Columns:** review_id, car_id, customer_id, rating, review_text, review_date
**Features:**
- Rating constraint: 1.0 to 5.0
- Foreign keys to Cars and Customers (CASCADE delete)
- Indexed for performance

### 3. FavoriteCars
**Purpose:** Customer favorite cars (junction table)
**Columns:** customer_id, car_id, added_date
**Features:**
- Composite primary key (customer_id, car_id)
- CASCADE delete on both foreign keys

### 4. CustomerPaymentMethods
**Purpose:** Store saved payment methods
**Columns:** payment_method_id, customer_id, card_holder_name, card_type, masked_number, expiry_date, is_default, created_at
**Features:**
- Supports multiple payment methods per customer
- Boolean flag for default payment method

### 5. Features
**Purpose:** Lookup table for car features
**Columns:** feature_id, name, description, icon
**Sample Data:** 12 features (AC, GPS, Bluetooth, Backup Camera, etc.)

### 6. CarFeatures
**Purpose:** Link cars to their features (junction table)
**Columns:** car_id, feature_id
**Features:**
- Composite primary key
- CASCADE delete on both sides

### 7. Addons
**Purpose:** Rental add-ons and extras
**Columns:** addon_id, name, description, price, price_type, is_active
**Features:**
- Price types: 'daily' or 'one-time'
- Active/inactive flag for availability
**Sample Data:** 8 addons (GPS, Child Seat, Insurance, etc.)

### 8. RentalAddons
**Purpose:** Link rentals to selected addons (junction table)
**Columns:** rental_id, addon_id, quantity, total_price
**Features:**
- Supports multiple quantities
- Stores calculated total_price

### 9. BlogCategories
**Purpose:** Blog post categories
**Columns:** category_id, name, slug, description
**Sample Data:** 5 categories (Travel Tips, Car Maintenance, Road Trips, etc.)

### 10. BlogPosts
**Purpose:** Blog articles and content
**Columns:** post_id, title, slug, excerpt, content, featured_image, author_id, status, published_at, created_at, updated_at, views
**Features:**
- Status: 'draft', 'published', 'archived'
- View counter for analytics
- Foreign key to Employees (author)
- Automatic timestamps

### 11. BlogPostCategories
**Purpose:** Link blog posts to categories (junction table)
**Columns:** post_id, category_id
**Features:**
- Many-to-many relationship
- CASCADE delete

### 12. Locations
**Purpose:** Rental locations/branches
**Columns:** location_id, name, address, city, state, zip_code, phone, email, operating_hours, is_active
**Features:**
- Indexed on city and state
- Active/inactive flag
**Sample Data:** 1 location (IAH Airport Houston)

---

## 📦 Sample Data Included

### Features (12 items)
Air Conditioning, GPS Navigation, Bluetooth, Backup Camera, Sunroof, Leather Seats, Heated Seats, Cruise Control, Apple CarPlay, Android Auto, USB Charging, Parking Sensors

### Addons (8 items)
GPS Device ($10/day), Child Seat ($8/day), Additional Driver ($15 one-time), Full Insurance ($25/day), Wifi Hotspot ($12/day), Ski Rack ($15/day), Bike Rack ($12/day), Snow Chains ($20 one-time)

### Blog Categories (5 items)
Travel Tips, Car Maintenance, Road Trips, Company News, Safety

### Locations (1 item)
Prestige Rentals - IAH Airport (Houston, TX)

---

## 🔗 Foreign Key Relationships

### New Relationships Added:
1. **Reviews** → Cars (car_id)
2. **Reviews** → Customers (customer_id)
3. **FavoriteCars** → Cars (car_id)
4. **FavoriteCars** → Customers (customer_id)
5. **CustomerPaymentMethods** → Customers (customer_id)
6. **CarFeatures** → Cars (car_id)
7. **CarFeatures** → Features (feature_id)
8. **RentalAddons** → Rentals (rental_id)
9. **RentalAddons** → Addons (addon_id)
10. **BlogPosts** → Employees (author_id)
11. **BlogPostCategories** → BlogPosts (post_id)
12. **BlogPostCategories** → BlogCategories (category_id)

All junction tables use **CASCADE DELETE** for automatic cleanup.

---

## 📈 Performance Optimizations

### Indexes Added:
- ContactMessages: status, created_at
- Reviews: car_id, customer_id, rating
- FavoriteCars: car_id
- CustomerPaymentMethods: customer_id
- CarFeatures: feature_id
- RentalAddons: addon_id
- BlogPosts: author_id, status, slug
- BlogPostCategories: category_id
- Locations: city, state

---

## 🎯 Migration Path

To apply these changes to an existing database:

```sql
-- Run the entire SQL_code.txt file on a fresh database
-- OR
-- Run only the "DATABASE UPDATES AND NEW TABLES" section (lines 1038+)
-- on an existing database that has the original 6 tables
```

⚠️ **Important:** The ALTER TABLE statements are safe to run on existing data. New columns are nullable and won't break existing records.

---

## ✅ Verification Checklist

- [x] All pricing columns added to Cars table
- [x] All authentication fields added to Employees table
- [x] Password reset fields added to Customers table
- [x] Due date field added to Rentals table
- [x] Completion tracking added to Maintenance table
- [x] ContactMessages table created (from migration file)
- [x] Reviews system implemented
- [x] Favorites functionality implemented
- [x] Payment methods storage implemented
- [x] Car features system implemented
- [x] Rental addons system implemented
- [x] Blog system implemented
- [x] Locations table implemented
- [x] Sample data provided for all lookup tables
- [x] All foreign keys defined
- [x] All indexes created
- [x] Documentation updated

---

## 📝 Notes

1. **Backward Compatibility:** All ALTER statements use NULL columns to maintain compatibility with existing data
2. **Data Migration:** Pricing tiers are automatically calculated for existing cars
3. **Sample Data:** Included for Features, Addons, Blog Categories, and Locations to jumpstart the application
4. **Engine:** All tables use InnoDB for transaction support and foreign key constraints
5. **Charset:** Uses database default (utf8mb4 recommended)

---

## 🚀 Next Steps

1. ✅ SQL_code.txt updated - **COMPLETED**
2. ⏭️ Test migration on development database
3. ⏭️ Populate CarFeatures with actual car-to-feature mappings
4. ⏭️ Add blog posts content
5. ⏭️ Configure additional locations as business expands

---

**Generated:** 2025-11-17
**Project:** Prestige Rentals - Houston Car Rental System
**Database:** car_rental_db
