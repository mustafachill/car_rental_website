<?php
// --- Database Configuration ---
$db_host = '127.0.0.1'; // Use the IP address
$db_port = '3306';
$db_name = 'car_rental_db';
$db_user = 'root';
$db_pass = 'root';

echo "<h1>Database Connection Test</h1>";

try {
    $dsn = "mysql:host=" . $db_host . ";port=" . $db_port . ";dbname=" . $db_name . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $pdo = new PDO($dsn, $db_user, $db_pass, $options);

    echo "<p style='color:green; font-weight:bold;'>✅ Connection Successful!</p>";

} catch (PDOException $e) {
    echo "<p style='color:red; font-weight:bold;'>❌ Connection Failed.</p>";
    echo "<p><strong>Error Message:</strong> " . $e->getMessage() . "</p>";
}

// Check if the PDO MySQL driver is loaded
if (extension_loaded('pdo_mysql')) {
    echo "<p style='color:green;'>✅ pdo_mysql extension is loaded.</p>";
} else {
    echo "<p style='color:red;'>❌ pdo_mysql extension is NOT loaded. This is likely the problem.</p>";
}

phpinfo(); // Display all PHP info for debugging