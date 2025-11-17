<?php
require_once '../config.php';
require_once '../mailer.php'; // Include the mailer file

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect('../register.php');
}

// --- Get Data ---
$firstName = trim($_POST['first_name'] ?? '');
$lastName = trim($_POST['last_name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone_number'] ?? '');
$password = $_POST['password'] ?? '';

// --- Server-Side Validation ---
if (empty($firstName) || empty($lastName) || empty($email) || empty($phone) || empty($password)) {
    redirect('../register.php?error=All fields are required.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirect('../register.php?error=Invalid email format.');
}
if (strlen($password) < 8) {
    redirect('../register.php?error=Password must be at least 8 characters long.');
}

// --- Check if email already exists ---
try {
    $stmt = $pdo->prepare("SELECT customer_id FROM Customers WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        redirect('../register.php?error=An account with this email already exists.');
    }

    // --- Hash Password and Insert User ---
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $sql = "INSERT INTO Customers (first_name, last_name, email, phone_number, password) VALUES (?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$firstName, $lastName, $email, $phone, $hashedPassword]);

    // --- New: Send a welcome email ---
    $subject = 'Welcome to the Car Rental App!';
    $body = "<h2>Hello, " . htmlspecialchars($firstName) . "!</h2>"
          . "<p>Thank you for registering with our service. You can now log in to manage your rentals and view car availability.</p>"
          . "<p>Your account is ready to go!</p>";
    send_email($email, $subject, $body);

    // Redirect to login page with a success message
    redirect('../login.php?success=Registration successful! Please log in.');
} catch (PDOException $e) {
    // For a real app, you might log this error instead of showing it
    redirect('../register.php?error=A database error occurred. Please try again.');
}