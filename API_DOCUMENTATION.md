# API Documentation

> Complete REST API reference for Prestige Rentals Car Rental System

**Base URL:** `http://localhost:3001/api`

---

## Table of Contents

- [Authentication](#authentication)
- [Public Endpoints](#public-endpoints)
- [Customer Endpoints](#customer-endpoints)
- [Admin Endpoints](#admin-endpoints)

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| Login | 10 requests / 15 min |
| Registration | 10 accounts / hour / IP |
| Password Reset | 5 requests / hour / IP |

---

## Public Endpoints (No Auth Required)

### Cars & Inventory

```http
GET /api/public/featured-cars
GET /api/car-types
GET /api/features
GET /api/addons
```

### Blog

```http
GET /api/public/blog-posts          # Published posts only
GET /api/public/blog-posts/:slug    # Single post by slug
GET /api/public/blog-categories     # All categories
```

### Testimonials

```http
GET /api/public/testimonials        # Customer testimonials
```

### Contact

```http
POST /api/contact
Body: { name, email, subject, message }
```

---

## Authentication Endpoints

```http
POST /api/employees/login
Body: { username, password }
Response: { success, token, user }

POST /api/customers/login
Body: { email, password }
Response: { success, token, user }

POST /api/customers/register
Body: { first_name, last_name, email, password }
Response: { success, message }

POST /api/customers/forgot-password
Body: { email }
Response: { success, message }

POST /api/customers/reset-password
Body: { token, newPassword }
Response: { success, message }
```

---

## Customer Endpoints (JWT Required)

### Profile Management

```http
GET /api/customers/profile              # Get customer profile
PUT /api/customers/profile              # Update profile
PUT /api/customers/password             # Change password
```

### Car Browsing & Rental

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

### Reviews

```http
GET /api/customers/can-review/:carId    # Check if can review
POST /api/reviews                       # Create review
Body: { car_id, rating, review_text }

PUT /api/reviews/:reviewId              # Update review
DELETE /api/reviews/:reviewId           # Delete review
```

### Favorites

```http
GET /api/customers/favorites            # Get favorite cars
POST /api/customers/favorites           # Add to favorites
Body: { car_id }

DELETE /api/customers/favorites/:car_id # Remove from favorites
```

### Payment Methods

```http
GET /api/customers/payment-methods      # Get saved payment methods
POST /api/customers/payment-methods     # Add payment method
DELETE /api/customers/payment-methods/:methodId  # Remove method
```

---

## Admin Endpoints (Employee JWT Required)

### Dashboard & Analytics

```http
GET /api/admin/dashboard/metrics        # Dashboard summary
Response: { totalRevenue, activeRentals, totalCars, totalCustomers, ... }

GET /api/admin/metrics/revenue-by-month # Monthly revenue chart data
GET /api/admin/metrics/popular-car-types # Car type popularity
```

### Employee Management

```http
GET /api/admin/employees                # List all employees
POST /api/admin/employees               # Create employee
PUT /api/admin/employees/:id            # Update employee
DELETE /api/admin/employees/:id         # Delete employee
```

### Customer Management

```http
GET /api/admin/customers                # List all customers
PUT /api/admin/customers/:id            # Update customer
DELETE /api/admin/customers/:id         # Delete customer
```

### Car Management

```http
GET /api/admin/cars                     # List all cars
POST /api/admin/cars                    # Create car (with file upload)
PUT /api/admin/cars/:id                 # Update car
DELETE /api/admin/cars/:id              # Delete car
POST /api/admin/cars/:carId/features    # Assign features to car
```

### Rental Management

```http
GET /api/admin/rentals                  # List all rentals (with filters)
PUT /api/admin/rentals/return/:rental_id # Process rental return
```

### Maintenance Management

```http
GET /api/admin/maintenance/active       # Active maintenance records
GET /api/admin/maintenance/history/:carId # Maintenance history for car
POST /api/admin/maintenance             # Create maintenance record
PUT /api/admin/maintenance/complete/:maintenance_id  # Complete maintenance
PUT /api/admin/maintenance/:maintenance_id  # Update maintenance
```

### Blog Management (CMS)

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

### Contact Messages

```http
GET /api/admin/contact-messages         # List messages (with status filter)
Query: ?status=unread&page=1&limit=20

PUT /api/admin/contact-messages/:id/status  # Update message status
Body: { status: 'read' | 'unread' | 'archived' }

DELETE /api/admin/contact-messages/:id  # Delete message
```

---

## Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests (Rate Limited) |
| 500 | Internal Server Error |
