<?php
// 1. Security & Setup
require_once 'config.php';

// Only allow logged-in employees to access this feature
if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'employee') {
    die("Access Denied: You do not have permission to access this page.");
}

$tableName = $_GET['table'] ?? '';

// Validate that the requested table is one of our allowed tables
if (!array_key_exists($tableName, TABLES_AND_COLUMNS)) {
    die("Error: Invalid table specified.");
}

// 2. Fetch ALL data from the database
// We ignore pagination and search for exports to get the full dataset
try {
    $sql = "SELECT * FROM `$tableName`";
    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Database Error: Could not fetch data for export. " . $e->getMessage());
}

// 3. Set HTTP headers for CSV download
$fileName = strtolower($tableName) . '_export_' . date('Y-m-d') . '.csv';

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $fileName . '"');
header('Pragma: no-cache');
header('Expires: 0');

// 4. Open output stream and write CSV data
// 'php://output' is a write-only stream that allows you to write to the response body
$output = fopen('php://output', 'w');

if (!empty($rows)) {
    // Write the header row to the CSV file
    $headers = array_keys($rows[0]);
    fputcsv($output, $headers);

    // Loop through the data and write each row to the CSV file
    foreach ($rows as $row) {
        fputcsv($output, $row);
    }
} else {
    // If there is no data, just write the headers
    $headers = TABLES_AND_COLUMNS[$tableName];
    fputcsv($output, $headers);
}

fclose($output);
exit();