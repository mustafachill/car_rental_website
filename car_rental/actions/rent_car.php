<?php
require_once '../config.php';
require_once '../mailer.php'; // Include the mailer file

if ($_SESSION['user_role'] !== 'customer') {
    redirect('../index.php');
}

$carId = $_GET['car_id'] ?? null;
$customerId = $_SESSION['customer_id'] ?? null;

if (!$carId || !$customerId) {
    redirect('../index.php?table=Cars&error=Invalid rental parameters.');
}

try {
    $pdo->beginTransaction();

    // 1. Create the rental record
    $sqlInsert = "INSERT INTO Rentals (customer_id, car_id, pickup_date) VALUES (?, ?, CURDATE())";
    $stmtInsert = $pdo->prepare($sqlInsert);
    $stmtInsert->execute([$customerId, $carId]);

    // 2. Update the car's status to 'Rented'
    $sqlUpdate = "UPDATE Cars SET status = 'Rented' WHERE car_id = ?";
    $stmtUpdate = $pdo->prepare($sqlUpdate);
    $stmtUpdate->execute([$carId]);

    $pdo->commit();
    
    writeToAuditLog("Customer #$customerId rented Car #$carId");
    
    // --- New: Fetch car details for the email ---
    $carStmt = $pdo->prepare("SELECT make, model FROM Cars WHERE car_id = ?");
    $carStmt->execute([$carId]);
    $carInfo = $carStmt->fetch();

    // --- New: Fetch customer email for the email ---
    $custStmt = $pdo->prepare("SELECT email, first_name FROM Customers WHERE customer_id = ?");
    $custStmt->execute([$customerId]);
    $custInfo = $custStmt->fetch();

    if ($carInfo && $custInfo) {
        $subject = 'Rental Confirmation - ' . htmlspecialchars($carInfo['make'] . ' ' . $carInfo['model']);
        $body = "<h2>Hello, " . htmlspecialchars($custInfo['first_name']) . "!</h2>"
              . "<p>This email confirms your rental of the " . htmlspecialchars($carInfo['make'] . ' ' . $carInfo['model']) . ".</p>"
              . "<p>Your pickup date is today, " . date('Y-m-d') . ". Enjoy your trip!</p>";
        send_email($custInfo['email'], $subject, $body);
    }

    redirect('../index.php?table=Cars&success=Car rented successfully!');

} catch (PDOException $e) {
    $pdo->rollBack();
    redirect('../index.php?table=Cars&error=Error renting car: ' . $e->getMessage());
}