<?php
// Enable error reporting at the top to catch any issues
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'config.php';

// Security Check: Ensure user is a logged-in customer
if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'customer') {
    redirect('login.php');
}

$customerId = $_SESSION['customer_id'];
$customer = null;
$rentalHistory = [];

// --- 1. Fetch Customer's Personal Information ---
try {
    $stmt = $pdo->prepare("SELECT * FROM Customers WHERE customer_id = ?");
    $stmt->execute([$customerId]);
    $customer = $stmt->fetch();
} catch (PDOException $e) {
    die("Error fetching customer data: " . $e->getMessage());
}

// If for some reason the customer doesn't exist in DB, redirect
if (!$customer) {
    redirect('logout.php'); 
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

// --- DEFINE THE CURRENT PAGE *BEFORE* INCLUDING THE HEADER ---
$currentTable = 'Account'; 
include 'header.php';
?>

<div class="container">
    <h1>My Account</h1>

    <?php if (isset($_SESSION['errors'])): ?>
        <div class="flash-messages error-messages">
            <h4>Please correct the following errors:</h4>
            <ul>
                <?php foreach ($_SESSION['errors'] as $error) echo '<li>' . htmlspecialchars($error) . '</li>'; ?>
            </ul>
        </div>
        <?php unset($_SESSION['errors']); ?>
    <?php endif; ?>
    <?php if (isset($_SESSION['success'])): ?>
        <div class="flash-messages success-messages">
            <p><?= htmlspecialchars($_SESSION['success']) ?></p>
        </div>
        <?php unset($_SESSION['success']); ?>
    <?php endif; ?>


    <div class="report-card" style="margin-bottom: 30px;">
        <div class="profile-header">
            <h2>My Profile</h2>
            <button id="editProfileBtn" class="btn btn-primary">✏️ Edit Profile</button>
        </div>

        <div id="displayProfile">
            <p><strong>Name:</strong> <?= htmlspecialchars($customer['first_name'] . ' ' . $customer['last_name']) ?></p>
            <p><strong>Email:</strong> <?= htmlspecialchars($customer['email']) ?></p>
            <p><strong>Phone Number:</strong> <?= htmlspecialchars($customer['phone_number']) ?></p>
            <p><strong>Address:</strong> <?= htmlspecialchars($customer['address'] . ', ' . $customer['city'] . ', ' . $customer['state'] . ' ' . $customer['zip_code']) ?></p>
        </div>

        <form action="actions/update_profile.php" method="post" id="editProfileForm" class="hidden modal-form">
            <div class="form-group">
                <label for="email">Email (Cannot be changed)</label>
                <input type="email" id="email" name="email" value="<?= htmlspecialchars($customer['email']) ?>" readonly>
            </div>
            <div class="form-group">
                <label for="phone_number">Phone Number</label>
                <input type="tel" id="phone_number" name="phone_number" value="<?= htmlspecialchars($customer['phone_number']) ?>" required pattern="\d{10}">
            </div>
            <div class="form-group">
                <label for="address">Address</label>
                <input type="text" id="address" name="address" value="<?= htmlspecialchars($customer['address']) ?>" required>
            </div>
            <div class="form-group">
                <label for="city">City</label>
                <input type="text" id="city" name="city" value="<?= htmlspecialchars($customer['city']) ?>" required>
            </div>
            <div class="form-group">
                <label for="state">State</label>
                <input type="text" id="state" name="state" value="<?= htmlspecialchars($customer['state']) ?>" required>
            </div>
            <div class="form-group">
                <label for="zip_code">Zip Code</label>
                <input type="text" id="zip_code" name="zip_code" value="<?= htmlspecialchars($customer['zip_code']) ?>" required>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-success">Save Changes</button>
                <button type="button" id="cancelEditBtn" class="btn btn-danger">Cancel</button>
            </div>
        </form>
    </div>

    <h2>My Rental History</h2>
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
                        <td colspan="4">You have no past or current rentals.</td>
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

<?php 
// This final line is ESSENTIAL. It loads the footer, which contains the
// <script> tag that makes your buttons and dark mode toggle work.
include 'footer.php'; 
?>