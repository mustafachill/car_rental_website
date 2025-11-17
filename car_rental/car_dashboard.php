<?php
require_once 'config.php';

// Security Check: Ensure user is a logged-in employee
if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'employee') {
    redirect('login.php');
}

$carId = $_GET['id'] ?? null;
if (!$carId) {
    redirect('index.php?table=Cars');
}

// --- Fetch Car Details ---
try {
    $sql = "SELECT * FROM Cars WHERE car_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$carId]);
    $car = $stmt->fetch();
} catch (PDOException $e) {
    die("Error fetching car data: " . $e->getMessage());
}

if (!$car) {
    die("Car not found.");
}

// --- Fetch Maintenance History ---
try {
    $sql = "SELECT * FROM Maintenance WHERE car_id = ? ORDER BY service_date DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$carId]);
    $maintenanceHistory = $stmt->fetchAll();
} catch (PDOException $e) {
    die("Error fetching maintenance history: " . $e->getMessage());
}

$currentTable = 'Cars'; // Highlight the Cars tab
include 'header.php';
?>

<div class="container">
    <h1>Car Dashboard: <?= htmlspecialchars($car['make'] . ' ' . $car['model']) ?></h1>

    <div class="report-card" style="margin-bottom: 30px;">
        <h2>Car Details</h2>
        <div class="profile-grid">
            <div class="profile-image">
                <?php if ($car['image_path']): ?>
                    <img src="/car_rental/uploads/<?= htmlspecialchars($car['image_path']) ?>" alt="Car Image">
                <?php else: ?>
                    <p>No Image Available</p>
                <?php endif; ?>
            </div>
            <div class="profile-details">
                <p><strong>License Plate:</strong> <?= htmlspecialchars($car['license_plate']) ?></p>
                <p><strong>Status:</strong> <?= htmlspecialchars($car['status']) ?></p>
                <p><strong>Purchase Date:</strong> <?= htmlspecialchars($car['purchase_date']) ?></p>
                <p><strong>Previous Owners:</strong> <?= htmlspecialchars($car['previous_owners']) ?></p>
                <p><strong>Mileage:</strong> <span id="mileage-value"><?= htmlspecialchars($car['mileage']) ?></span> <span id="mileage-unit">miles</span></p>
                <button id="toggle-mileage" class="btn btn-primary btn-sm">Toggle to Kilometers</button>
            </div>
        </div>
    </div>

    <h2>Maintenance History</h2>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>Service Date</th>
                    <th>Service Type</th>
                    <th>Cost</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($maintenanceHistory)): ?>
                    <tr><td colspan="4">No maintenance history found.</td></tr>
                <?php else: ?>
                    <?php foreach ($maintenanceHistory as $maintenance): ?>
                        <tr>
                            <td><?= htmlspecialchars($maintenance['service_date']) ?></td>
                            <td><?= htmlspecialchars($maintenance['service_type']) ?></td>
                            <td>$<?= htmlspecialchars(number_format($maintenance['cost'], 2)) ?></td>
                            <td><?= htmlspecialchars($maintenance['notes']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include 'footer.php'; ?>