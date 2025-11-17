<?php
require_once '../config.php';

// Security Check: Ensure user is a logged-in customer and form was submitted
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'customer') {
    redirect('../login.php');
}

$customerId = $_SESSION['customer_id'];

// --- 1. Get and Sanitize Input ---
$phone = trim($_POST['phone_number'] ?? '');
$address = trim($_POST['address'] ?? '');
$city = trim($_POST['city'] ?? '');
$state = trim($_POST['state'] ?? '');
$zip = trim($_POST['zip_code'] ?? '');

// --- 2. Server-Side Validation ---
$errors = [];
if (empty($phone) || empty($address) || empty($city) || empty($state) || empty($zip)) {
    $errors[] = "All fields are required.";
}
if (!preg_match('/^\d{10}$/', $phone)) {
    $errors[] = "Phone number must be exactly 10 digits.";
}

if (!empty($errors)) {
    $_SESSION['errors'] = $errors;
    redirect('../account.php');
}

// --- 3. Update the Database ---
try {
    $sql = "UPDATE Customers SET 
                phone_number = ?, 
                address = ?, 
                city = ?, 
                state = ?, 
                zip_code = ? 
            WHERE customer_id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$phone, $address, $city, $state, $zip, $customerId]);

    $_SESSION['success'] = "Your profile has been updated successfully!";
    writeToAuditLog("Customer #$customerId updated their profile.");

} catch (PDOException $e) {
    $_SESSION['errors'] = ["A database error occurred: " . $e->getMessage()];
}

redirect('../account.php');