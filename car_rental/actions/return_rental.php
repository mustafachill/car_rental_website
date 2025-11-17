<?php
require_once '../config.php';

if ($_SESSION['user_role'] !== 'employee') {
    redirect('../index.php');
}

$rentalId = $_GET['rental_id'] ?? null;
$carId = $_GET['car_id'] ?? null;

if (!$rentalId || !$carId) {
    redirect('../index.php?table=Rentals&error=Invalid return parameters.');
}

try {
    $pdo->beginTransaction();

    // 1. Get car's daily rate and pickup date
    $sqlInfo = "SELECT c.daily_rate, r.pickup_date 
                FROM Cars c 
                JOIN Rentals r ON c.car_id = r.car_id 
                WHERE r.rental_id = ?";
    $stmtInfo = $pdo->prepare($sqlInfo);
    $stmtInfo->execute([$rentalId]);
    $info = $stmtInfo->fetch();

    if (!$info) {
        throw new Exception("Rental information not found.");
    }
    
    $dailyRate = new \Decimal\Decimal($info['daily_rate']);
    $pickupDate = new DateTime($info['pickup_date']);
    $returnDate = new DateTime();
    $today = new DateTime();
    
    // Calculate rental duration (at least 1 day)
    $days = $today->diff($pickupDate)->days;
    $rentalDays = max(1, $days); 
    
    $totalCost = $dailyRate->mul($rentalDays);

    // New: Calculate late fee (assuming a 25% late fee per day after pickup date)
    $lateFee = 0;
    if ($today > $pickupDate) {
        $overdueDays = $today->diff($pickupDate)->days;
        $lateFee = $dailyRate->mul(0.25)->mul($overdueDays);
    }
    
    // 2. Update the rental record
    $sqlUpdateRental = "UPDATE Rentals SET return_date = CURDATE(), total_cost = ?, late_fee = ? WHERE rental_id = ?";
    $stmtUpdateRental = $pdo->prepare($sqlUpdateRental);
    $stmtUpdateRental->execute([$totalCost, $lateFee, $rentalId]);

    // 3. Update the car's status to 'Available'
    $sqlUpdateCar = "UPDATE Cars SET status = 'Available' WHERE car_id = ?";
    $stmtUpdateCar = $pdo->prepare($sqlUpdateCar);
    $stmtUpdateCar->execute([$carId]);

    // 4. Create a payment record
    $sqlAddPayment = "INSERT INTO Payments (rental_id, amount, payment_date, payment_method) VALUES (?, ?, CURDATE(), 'Credit Card')";
    $stmtAddPayment = $pdo->prepare($sqlAddPayment);
    $stmtAddPayment->execute([$rentalId, $totalCost->plus($lateFee)]);

    $pdo->commit();

    writeToAuditLog("Processed return for Rental #$rentalId by {$_SESSION['username']}");
    $message = "Rental returned successfully. Total Cost: $" . $totalCost . ($lateFee > 0 ? " (includes a late fee of $" . $lateFee . ")" : "");
    redirect("../index.php?table=Rentals&success=" . urlencode($message));

} catch (Exception $e) {
    $pdo->rollBack();
    redirect('../index.php?table=Rentals&error=Error processing return: ' . $e->getMessage());
}