# Prestige Rentals - Database Schema Documentation

> **Database:** `car_rental_db`
> **Engine:** MySQL / InnoDB
> **Total Tables:** 19
> **Last Updated:** 2025-11-22

---

## Table of Contents

1. [Overview](#overview)
2. [Entity-Relationship Diagram](#entity-relationship-diagram)
3. [Table Details](#table-details)
   - [Core Tables](#core-tables)
   - [Customer Related Tables](#customer-related-tables)
   - [Rental & Payment Tables](#rental--payment-tables)
   - [Blog & Content Tables](#blog--content-tables)
   - [Lookup & Configuration Tables](#lookup--configuration-tables)
4. [Relationship Summary](#relationship-summary)

---

## Overview

| # | Table Name | Type | Description |
|---|------------|------|-------------|
| 1 | `Car_Types` | Lookup | Vehicle categories (Sedan, SUV, etc.) |
| 2 | `Cars` | Core | Vehicle inventory |
| 3 | `Customers` | Core | Customer accounts |
| 4 | `Employees` | Core | Staff/Admin accounts |
| 5 | `Rentals` | Core | Rental transactions |
| 6 | `Payments` | Transaction | Payment records |
| 7 | `Maintenance` | Operations | Vehicle service history |
| 8 | `ContactMessages` | Support | Contact form submissions |
| 9 | `Reviews` | Feedback | Customer car reviews |
| 10 | `FavoriteCars` | Junction | Customer favorites (M:N) |
| 11 | `CustomerPaymentMethods` | Customer | Saved payment cards |
| 12 | `Features` | Lookup | Car feature definitions |
| 13 | `CarFeatures` | Junction | Car-Feature mapping (M:N) |
| 14 | `Addons` | Lookup | Rental add-ons (GPS, insurance) |
| 15 | `RentalAddons` | Junction | Rental-Addon mapping (M:N) |
| 16 | `BlogCategories` | Content | Blog category definitions |
| 17 | `BlogPosts` | Content | Blog articles |
| 18 | `BlogPostCategories` | Junction | Post-Category mapping (M:N) |
| 19 | `Locations` | Configuration | Rental branch locations |

---

## Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PRESTIGE RENTALS DATABASE                           │
│                                   car_rental_db                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   Car_Types     │
                              │─────────────────│
                              │ PK car_type_id  │
                              │    type_name    │
                              └────────┬────────┘
                                       │ 1
                                       │
                                       │ N
┌─────────────────┐           ┌────────▼────────────────────────────┐
│    Features     │           │               Cars                  │
│─────────────────│           │─────────────────────────────────────│
│ PK feature_id   │           │ PK car_id                           │
│    name         │◄──┐       │ FK car_type_id                      │
│    description  │   │       │    make, model, year                │
│    icon         │   │       │    license_plate (UNIQUE)           │
└─────────────────┘   │       │    daily_rate, hourly_rate          │
         ▲            │       │    weekly_rate, monthly_rate        │
         │ N          │       │    status, image_path, mileage      │
         │            │       │    current_location                 │
┌────────┴────────┐   │       └──────────┬──────────────────────────┘
│  CarFeatures    │   │                  │
│   (Junction)    │   │       ┌──────────┼──────────┬───────────────┐
│─────────────────│   │       │          │          │               │
│ PK,FK car_id    │───┘       │ 1        │ 1        │ 1             │ 1
│ PK,FK feature_id│           │          │          │               │
└─────────────────┘           ▼ N        ▼ N        ▼ N             ▼ N
                    ┌─────────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────────┐
                    │ Maintenance │ │ Reviews │ │FavoriteCars │ │   Rentals   │
                    │─────────────│ │─────────│ │ (Junction)  │ │─────────────│
                    │PK maint_id  │ │PK rev_id│ │─────────────│ │PK rental_id │
                    │FK car_id    │ │FK car_id│ │PK,FK car_id │ │FK car_id    │
                    │service_date │ │FK cust_id│ │PK,FK cust_id│ │FK customer_id
                    │service_type │ │rating   │ │ added_date  │ │pickup_date  │
                    │cost, notes  │ │comment  │ └──────┬──────┘ │due_date     │
                    └─────────────┘ └────┬────┘        │        │total_cost   │
                                         │             │        └──────┬──────┘
                                         │ N           │ N             │
                                         │             │               │
                                         ▼ 1           ▼ 1             │
                    ┌─────────────────────────────────────────┐        │
                    │               Customers                  │        │
                    │─────────────────────────────────────────│        │
                    │ PK customer_id                           │◄───────┤ N
                    │    first_name, last_name                │        │
                    │    email (UNIQUE), phone_number         │        │
                    │    address, city, state, zip_code       │        │
                    │    date_of_birth, password              │        │
                    │    reset_token, reset_token_expires     │        │
                    └──────────────────┬──────────────────────┘        │
                                       │ 1                             │
                                       │                               │
                                       ▼ N                             │
                    ┌─────────────────────────────────────────┐        │
                    │       CustomerPaymentMethods            │        │
                    │─────────────────────────────────────────│        │
                    │ PK payment_method_id                    │        │
                    │ FK customer_id                          │        │
                    │    card_holder_name, card_type          │        │
                    │    masked_number, expiry_date           │        │
                    │    is_default                           │        │
                    └─────────────────────────────────────────┘        │
                                                                       │
                    ┌──────────────────────────────────────────────────┘
                    │
                    │ 1
                    ▼ N
┌─────────────────┐           ┌─────────────────┐
│    Payments     │           │  RentalAddons   │           ┌─────────────────┐
│─────────────────│           │   (Junction)    │           │     Addons      │
│ PK payment_id   │           │─────────────────│           │─────────────────│
│ FK rental_id    │◄──────────│ PK,FK rental_id │           │ PK addon_id     │
│    amount       │           │ PK,FK addon_id  │──────────►│    name         │
│    payment_date │           │    quantity     │           │    price        │
│    payment_method           │    total_price  │           │    price_type   │
└─────────────────┘           └─────────────────┘           └─────────────────┘


┌─────────────────┐           ┌─────────────────────────────────────────┐
│   Employees     │           │               BlogPosts                 │
│─────────────────│     1     │─────────────────────────────────────────│
│ PK employee_id  │──────────►│ PK post_id                              │
│    username     │           │ FK author_id                            │
│    first_name   │           │    title, slug (UNIQUE)                 │
│    last_name    │           │    excerpt, content (LONGTEXT)          │
│    job_title    │           │    featured_image, status               │
│    email        │           │    published_at, views                  │
│    password     │           └──────────────────┬──────────────────────┘
└─────────────────┘                              │
                                                 │ N
                                                 │
                              ┌──────────────────▼──────────────────────┐
                              │         BlogPostCategories              │
                              │            (Junction)                   │
                              │─────────────────────────────────────────│
                              │ PK,FK post_id                           │
                              │ PK,FK category_id                       │
                              └──────────────────┬──────────────────────┘
                                                 │ N
                                                 │
                                                 ▼ 1
                              ┌─────────────────────────────────────────┐
                              │           BlogCategories                │
                              │─────────────────────────────────────────│
                              │ PK category_id                          │
                              │    name, slug (UNIQUE)                  │
                              │    description                          │
                              └─────────────────────────────────────────┘


┌─────────────────────────────┐     ┌─────────────────────────────┐
│      ContactMessages        │     │          Locations          │
│      (Standalone)           │     │        (Standalone)         │
│─────────────────────────────│     │─────────────────────────────│
│ PK message_id               │     │ PK location_id              │
│    name, email              │     │    name, address            │
│    subject, message         │     │    city, state, zip_code    │
│    status (enum)            │     │    phone, email             │
│    created_at, read_at      │     │    operating_hours          │
└─────────────────────────────┘     │    is_active                │
                                    └─────────────────────────────┘
```

---

## Table Details

### Core Tables

#### 1. Car_Types

Vehicle category definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `car_type_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `type_name` | VARCHAR(45) | NOT NULL, UNIQUE | Category name |

**Sample Data:** Sedan, SUV, Truck, Convertible, Van

---

#### 2. Cars

Vehicle inventory and specifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `car_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `car_type_id` | INT | FK → Car_Types | Vehicle category |
| `make` | VARCHAR(45) | NOT NULL | Manufacturer (Honda, Toyota) |
| `model` | VARCHAR(45) | NOT NULL | Model name |
| `year` | INT | NOT NULL | Manufacturing year |
| `license_plate` | VARCHAR(45) | NOT NULL, UNIQUE | License plate number |
| `daily_rate` | DECIMAL(10,2) | NOT NULL | Daily rental price |
| `hourly_rate` | DECIMAL(10,2) | NULL | Hourly rental price |
| `weekly_rate` | DECIMAL(10,2) | NULL | Weekly rental price |
| `monthly_rate` | DECIMAL(10,2) | NULL | Monthly rental price |
| `status` | VARCHAR(45) | NOT NULL | Available/Rented/Maintenance |
| `image_path` | VARCHAR(255) | NULL | Vehicle image URL |
| `mileage` | INT | NULL | Current odometer reading |
| `current_location` | VARCHAR(255) | NULL | Current location |
| `purchase_date` | DATE | NULL | Date of purchase |
| `previous_owners` | VARCHAR(255) | NULL | Previous owner info |

**Foreign Keys:**
- `car_type_id` → `Car_Types(car_type_id)`

**Referenced By:**
- `Rentals.car_id`
- `Maintenance.car_id`
- `Reviews.car_id`
- `FavoriteCars.car_id`
- `CarFeatures.car_id`

---

#### 3. Customers

Customer account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `customer_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `first_name` | VARCHAR(45) | NOT NULL | First name |
| `last_name` | VARCHAR(45) | NOT NULL | Last name |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Email address |
| `phone_number` | VARCHAR(20) | NULL | Phone number |
| `address` | VARCHAR(255) | NULL | Street address |
| `city` | VARCHAR(45) | NULL | City |
| `state` | VARCHAR(45) | NULL | State |
| `zip_code` | VARCHAR(10) | NULL | ZIP code |
| `date_of_birth` | DATE | NULL | Date of birth |
| `password` | VARCHAR(255) | NULL | Hashed password |
| `reset_token` | VARCHAR(255) | NULL | Password reset token |
| `reset_token_expires` | BIGINT | NULL | Token expiration timestamp |

**Referenced By:**
- `Rentals.customer_id`
- `Reviews.customer_id`
- `FavoriteCars.customer_id`
- `CustomerPaymentMethods.customer_id`

---

#### 4. Employees

Staff and administrator accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `employee_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `username` | VARCHAR(100) | UNIQUE, NULL | Login username |
| `first_name` | VARCHAR(45) | NOT NULL | First name |
| `last_name` | VARCHAR(45) | NOT NULL | Last name |
| `job_title` | VARCHAR(45) | NULL | Job position |
| `hire_date` | DATE | NULL | Employment start date |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Email address |
| `password` | VARCHAR(255) | NULL | Hashed password |

**Referenced By:**
- `BlogPosts.author_id`

---

### Rental & Payment Tables

#### 5. Rentals

Rental transaction records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `rental_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `customer_id` | INT | FK → Customers, NOT NULL | Renting customer |
| `car_id` | INT | FK → Cars, NOT NULL | Rented vehicle |
| `pickup_date` | DATE | NOT NULL | Rental start date |
| `return_date` | DATE | NULL | Actual return date |
| `due_date` | DATE | NULL | Expected return date |
| `total_cost` | DECIMAL(10,2) | NULL | Total rental cost |
| `late_fee` | DECIMAL(10,2) | NULL | Late return penalty |

**Foreign Keys:**
- `customer_id` → `Customers(customer_id)`
- `car_id` → `Cars(car_id)`

**Referenced By:**
- `Payments.rental_id`
- `RentalAddons.rental_id`

---

#### 6. Payments

Payment transaction records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `payment_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `rental_id` | INT | FK → Rentals, NOT NULL | Associated rental |
| `amount` | DECIMAL(10,2) | NOT NULL | Payment amount |
| `payment_date` | DATE | NOT NULL | Date of payment |
| `payment_method` | VARCHAR(45) | NULL | Credit Card/Cash/Online |

**Foreign Keys:**
- `rental_id` → `Rentals(rental_id)`

---

#### 7. Maintenance

Vehicle service and maintenance history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `maintenance_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `car_id` | INT | FK → Cars, NOT NULL | Serviced vehicle |
| `service_date` | DATE | NOT NULL | Service start date |
| `completion_date` | DATE | NULL | Service completion date |
| `service_type` | VARCHAR(100) | NOT NULL | Type of service |
| `cost` | DECIMAL(10,2) | NULL | Service cost |
| `mileage_at_service` | INT | NULL | Odometer at service |
| `notes` | TEXT | NULL | Additional notes |

**Foreign Keys:**
- `car_id` → `Cars(car_id)`

---

### Customer Related Tables

#### 8. Reviews

Customer reviews and ratings for vehicles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `review_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `car_id` | INT | FK → Cars, NOT NULL | Reviewed vehicle |
| `customer_id` | INT | FK → Customers, NOT NULL | Reviewer |
| `rating` | DECIMAL(2,1) | NOT NULL, CHECK (1-5) | Star rating |
| `review_text` | TEXT | NULL | Review comment |
| `review_date` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Review date |

**Foreign Keys:**
- `car_id` → `Cars(car_id)` ON DELETE CASCADE
- `customer_id` → `Customers(customer_id)` ON DELETE CASCADE

---

#### 9. FavoriteCars (Junction Table)

Many-to-Many: Customers ↔ Cars

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `customer_id` | INT | PK, FK → Customers | Customer |
| `car_id` | INT | PK, FK → Cars | Favorited car |
| `added_date` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Date added |

**Foreign Keys:**
- `customer_id` → `Customers(customer_id)` ON DELETE CASCADE
- `car_id` → `Cars(car_id)` ON DELETE CASCADE

---

#### 10. CustomerPaymentMethods

Saved payment methods for customers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `payment_method_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `customer_id` | INT | FK → Customers, NOT NULL | Card owner |
| `card_holder_name` | VARCHAR(100) | NOT NULL | Name on card |
| `card_type` | VARCHAR(20) | NOT NULL | Visa/Mastercard/etc. |
| `masked_number` | VARCHAR(20) | NOT NULL | Last 4 digits only |
| `expiry_date` | VARCHAR(7) | NOT NULL | MM/YYYY format |
| `is_default` | BOOLEAN | DEFAULT FALSE | Default payment method |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Date added |

**Foreign Keys:**
- `customer_id` → `Customers(customer_id)` ON DELETE CASCADE

---

#### 11. ContactMessages (Standalone)

Contact form submissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `message_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `name` | VARCHAR(100) | NOT NULL | Sender name |
| `email` | VARCHAR(100) | NOT NULL | Sender email |
| `subject` | VARCHAR(200) | NOT NULL | Message subject |
| `message` | TEXT | NOT NULL | Message body |
| `status` | ENUM | DEFAULT 'unread' | unread/read/archived |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Submission date |
| `read_at` | TIMESTAMP | NULL | Date when read |

**Indexes:** `idx_status`, `idx_created_at`

---

### Lookup & Configuration Tables

#### 12. Features

Car feature definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `feature_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Feature name |
| `description` | TEXT | NULL | Feature description |
| `icon` | VARCHAR(50) | NULL | Icon identifier |

**Sample Data:** Air Conditioning, GPS Navigation, Bluetooth, Backup Camera, Sunroof, Leather Seats, Heated Seats, Cruise Control, Apple CarPlay, Android Auto, USB Charging, Parking Sensors

---

#### 13. CarFeatures (Junction Table)

Many-to-Many: Cars ↔ Features

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `car_id` | INT | PK, FK → Cars | Vehicle |
| `feature_id` | INT | PK, FK → Features | Feature |

**Foreign Keys:**
- `car_id` → `Cars(car_id)` ON DELETE CASCADE
- `feature_id` → `Features(feature_id)` ON DELETE CASCADE

---

#### 14. Addons

Rental add-on services.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `addon_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `name` | VARCHAR(100) | NOT NULL | Add-on name |
| `description` | TEXT | NULL | Description |
| `price` | DECIMAL(10,2) | NOT NULL | Price |
| `price_type` | ENUM | DEFAULT 'daily' | daily/one-time |
| `is_active` | BOOLEAN | DEFAULT TRUE | Available for selection |

**Sample Data:** GPS Device, Child Seat, Additional Driver, Full Insurance, Wifi Hotspot, Ski Rack, Bike Rack, Snow Chains

---

#### 15. RentalAddons (Junction Table)

Many-to-Many: Rentals ↔ Addons

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `rental_id` | INT | PK, FK → Rentals | Rental transaction |
| `addon_id` | INT | PK, FK → Addons | Selected add-on |
| `quantity` | INT | DEFAULT 1 | Quantity |
| `total_price` | DECIMAL(10,2) | NOT NULL | Calculated price |

**Foreign Keys:**
- `rental_id` → `Rentals(rental_id)` ON DELETE CASCADE
- `addon_id` → `Addons(addon_id)` ON DELETE CASCADE

---

### Blog & Content Tables

#### 16. BlogCategories

Blog category definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `category_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Category name |
| `slug` | VARCHAR(100) | NOT NULL, UNIQUE | URL-friendly slug |
| `description` | TEXT | NULL | Category description |

**Sample Data:** Travel Tips, Car Maintenance, Road Trips, Company News, Safety

---

#### 17. BlogPosts

Blog articles and content.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `post_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `author_id` | INT | FK → Employees, NOT NULL | Post author |
| `title` | VARCHAR(200) | NOT NULL | Post title |
| `slug` | VARCHAR(200) | NOT NULL, UNIQUE | URL-friendly slug |
| `excerpt` | TEXT | NULL | Short summary |
| `content` | LONGTEXT | NOT NULL | Full content (HTML) |
| `featured_image` | VARCHAR(255) | NULL | Cover image URL |
| `status` | ENUM | DEFAULT 'draft' | draft/published/archived |
| `published_at` | TIMESTAMP | NULL | Publication date |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |
| `updated_at` | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update |
| `views` | INT | DEFAULT 0 | View count |

**Foreign Keys:**
- `author_id` → `Employees(employee_id)`

**Indexes:** `idx_author_id`, `idx_status`, `idx_slug`

---

#### 18. BlogPostCategories (Junction Table)

Many-to-Many: BlogPosts ↔ BlogCategories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `post_id` | INT | PK, FK → BlogPosts | Blog post |
| `category_id` | INT | PK, FK → BlogCategories | Category |

**Foreign Keys:**
- `post_id` → `BlogPosts(post_id)` ON DELETE CASCADE
- `category_id` → `BlogCategories(category_id)` ON DELETE CASCADE

---

#### 19. Locations (Standalone)

Rental branch/location information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `location_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `name` | VARCHAR(100) | NOT NULL | Branch name |
| `address` | VARCHAR(255) | NOT NULL | Street address |
| `city` | VARCHAR(100) | NOT NULL | City |
| `state` | VARCHAR(2) | NOT NULL | State code |
| `zip_code` | VARCHAR(10) | NOT NULL | ZIP code |
| `phone` | VARCHAR(20) | NULL | Phone number |
| `email` | VARCHAR(100) | NULL | Email address |
| `operating_hours` | TEXT | NULL | Hours of operation |
| `is_active` | BOOLEAN | DEFAULT TRUE | Currently operating |

**Indexes:** `idx_city`, `idx_state`

---

## Relationship Summary

### One-to-Many (1:N)

| Parent Table | Child Table | Foreign Key |
|--------------|-------------|-------------|
| Car_Types | Cars | `car_type_id` |
| Cars | Rentals | `car_id` |
| Cars | Maintenance | `car_id` |
| Cars | Reviews | `car_id` |
| Customers | Rentals | `customer_id` |
| Customers | Reviews | `customer_id` |
| Customers | CustomerPaymentMethods | `customer_id` |
| Rentals | Payments | `rental_id` |
| Employees | BlogPosts | `author_id` |

### Many-to-Many (M:N)

| Table A | Junction Table | Table B |
|---------|----------------|---------|
| Cars | CarFeatures | Features |
| Cars | FavoriteCars | Customers |
| Rentals | RentalAddons | Addons |
| BlogPosts | BlogPostCategories | BlogCategories |

### Standalone Tables (No Foreign Keys)

| Table | Purpose |
|-------|---------|
| ContactMessages | Contact form submissions |
| Locations | Branch location data |

---

## Notes

1. **Engine:** All tables use InnoDB for transaction support and foreign key constraints
2. **Cascade Rules:** Most junction tables use `ON DELETE CASCADE` for referential integrity
3. **Authentication:** Passwords are stored as bcrypt hashes (VARCHAR 255)
4. **Timestamps:** Created/updated timestamps use `DEFAULT CURRENT_TIMESTAMP`
5. **Soft Delete:** Not implemented - consider adding `is_deleted` flag for production

---

*Generated from `/car_rental/SQL_code.txt` (1,338 lines)*
