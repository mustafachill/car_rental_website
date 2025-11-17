<?php
require_once 'config.php';

// Security Check: Ensure user is a logged-in employee
if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'employee') {
    redirect('login.php');
}

// Get the customer ID from the URL
$customerId = $_GET['id'] ?? null;

if (!$customerId) {
    // If no ID is provided, redirect to the customer list
    redirect('index.php?table=Customers');
}

// --- 1. Fetch Customer's Personal Information ---
try {
    $stmt = $pdo->prepare("SELECT * FROM Customers WHERE customer_id = ?");
    $stmt->execute([$customerId]);
    $customer = $stmt->fetch();
} catch (PDOException $e) {
    die("Error fetching customer data: " . $e->getMessage());
}

if (!$customer) {
    die("Customer not found.");
}

// --- 2. Fetch Customer's Rental History ---
try {
    $historySql = "
        SELECT 
            r.rental_id, c.make, c.model, c.year, r.pickup_date, r.return_date, r.total_cost
        FROM Rentals r
        JOIN Cars c ON r.car_id = c.car_id
        WHERE r.customer_id = ?
        ORDER BY r.pickup_date DESC";
    $stmt = $pdo->prepare($historySql);
    $stmt->execute([$customerId]);
    $rentalHistory = $stmt->fetchAll();
} catch (PDOException $e) {
    die("Error fetching rental history: " . $e->getMessage());
}

$currentTable = 'Customers'; // Highlight the Customers tab
include 'header.php';
?>

<div class="container">
    <h1>Viewing Profile: <?= htmlspecialchars($customer['first_name'] . ' ' . $customer['last_name']) ?></h1>

    <div class="report-card" style="margin-bottom: 30px;">
        <h2>Customer Profile</h2>
        <p><strong>Customer ID:</strong> <?= htmlspecialchars($customer['customer_id']) ?></p>
        <p><strong>Email:</strong> <?= htmlspecialchars($customer['email']) ?></p>
        <p><strong>Phone Number:</strong> <?= htmlspecialchars($customer['phone_number']) ?></p>
        <p><strong>Address:</strong> <?= htmlspecialchars($customer['address'] . ', ' . $customer['city'] . ', ' . $customer['state'] . ' ' . $customer['zip_code']) ?></p>
    </div>

    <h2>Rental History</h2>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>Car</th>
                    <th>Pickup Date</th>
                    <th>Return Date</th>
                    <th>Total Cost</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($rentalHistory)): ?>
                    <tr>
                        <td colspan="4">This customer has no past or current rentals.</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($rentalHistory as $rental): ?>
                        <tr>
                            <td><?= htmlspecialchars($rental['year'] . ' ' . $rental['make'] . ' ' . $rental['model']) ?></td>
                            <td><?= htmlspecialchars($rental['pickup_date']) ?></td>
                            <td><?= htmlspecialchars($rental['return_date'] ?? '<em>Currently Rented</em>') ?></td>
                            <td><?= $rental['total_cost'] ? '$' . number_format($rental['total_cost'], 2) : '<em>N/A</em>' ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include 'footer.php'; ?>