<?php
require_once '../config.php';

// This is for AJAX requests, so it only outputs HTML fragments
if ($_SESSION['user_role'] !== 'employee' || !isset($_GET['customer_id'])) {
    echo '<p>Unauthorized access.</p>';
    exit();
}

$customerId = $_GET['customer_id'];

try {
    $sql = "SELECT r.rental_id, c.make, c.model, r.pickup_date, r.return_date, r.total_cost 
            FROM Rentals r 
            JOIN Cars c ON r.car_id = c.car_id 
            WHERE r.customer_id = ? ORDER BY r.pickup_date DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$customerId]);
    $history = $stmt->fetchAll();

    if (empty($history)) {
        echo '<p>This customer has no rental history.</p>';
        exit();
    }

    // Output as an HTML table
    echo '<table><thead><tr><th>Rental ID</th><th>Car</th><th>Pickup Date</th><th>Return Date</th><th>Total Cost</th></tr></thead><tbody>';
    foreach ($history as $rental) {
        echo '<tr>';
        echo '<td>' . htmlspecialchars($rental['rental_id']) . '</td>';
        echo '<td>' . htmlspecialchars($rental['make'] . ' ' . $rental['model']) . '</td>';
        echo '<td>' . htmlspecialchars($rental['pickup_date']) . '</td>';
        echo '<td>' . htmlspecialchars($rental['return_date'] ?? 'Not Returned') . '</td>';
        echo '<td>$' . htmlspecialchars(number_format($rental['total_cost'] ?? 0, 2)) . '</td>';
        echo '</tr>';
    }
    echo '</tbody></table>';

} catch (PDOException $e) {
    echo '<p>Error fetching rental history: ' . $e->getMessage() . '</p>';
}