<?php
// Start the session on every page
session_start();

// --- Database Configuration ---
define('DB_HOST', 'localhost');
define('DB_PORT', '8889');
// MAMP's MySQL port
define('DB_NAME', 'car_rental_db');
define('DB_USER', 'root');
define('DB_PASS', 'root');

// --- Establish Database Connection ---
try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    // For a real application, you'd want a more user-friendly error page
    die("Database connection failed: " . $e->getMessage());
}

// --- Table and Column Definitions (from Java app) ---
const TABLES_AND_COLUMNS = [
    "Cars" => ["car_id", "make", "model", "year", "license_plate", "daily_rate", "car_type_id", "current_location", "status", "image_path", "mileage", "purchase_date", "previous_owners"],
    "Car_Types" => ["car_type_id", "type_name"],
    "Customers" => ["customer_id", "first_name", "last_name", "email", "phone_number", "address", "city", "state", "zip_code", "date_of_birth", "password"],
    "Employees" => ["employee_id", "first_name", "last_name", "job_title", "hire_date", "email"],
    "Rentals" => ["rental_id", "customer_id", "car_id", "pickup_date", "return_date", "total_cost", "late_fee"],
    "Payments" => ["payment_id", "rental_id", "amount", "payment_date", "payment_method"],
    "Maintenance" => ["maintenance_id", "car_id", "service_date", "service_type", "cost", "notes"]
];

// --- Utility Functions ---

/**
 * Writes a message to the audit log file.
 * @param string $action The message to log.
 */
function writeToAuditLog(string $action): void {
    $logEntry = date('Y-m-d H:i:s') . " - " . $action . PHP_EOL;
    file_put_contents('audit.log', $logEntry, FILE_APPEND);
}

/**
 * Formats a database column name (e.g., "first_name") into a readable format ("First Name").
 * @param string $colName The column name.
 * @return string The formatted name.
 */
function formatColumnName(string $colName): string {
    return ucwords(str_replace('_', ' ', $colName));
}

/**
 * Redirects to a specified URL and terminates the script.
 * @param string $url The URL to redirect to.
 */
function redirect(string $url): void {
    header("Location: $url");
    exit();
}