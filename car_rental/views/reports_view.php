<?php
// This view is included from index.php and has access to $pdo

// --- 1. PHP: Prepare data for the existing summary cards ---
function getFinancialSummary($pdo) {
    $stmt = $pdo->query("SELECT COUNT(*) as total_rentals, SUM(total_cost) as total_revenue FROM Rentals WHERE total_cost IS NOT NULL");
    return $stmt->fetch();
}

function getActiveRentals($pdo) {
    $sql = "SELECT c.make, c.model, c.license_plate, r.pickup_date 
            FROM Cars c JOIN Rentals r ON c.car_id = r.car_id 
            WHERE c.status = 'Rented' AND r.return_date IS NULL";
    return $pdo->query($sql)->fetchAll();
}

// New: Function to get overdue rentals
function getOverdueRentals($pdo) {
    $sql = "SELECT r.rental_id, c.make, c.model, c.license_plate, r.pickup_date
            FROM Rentals r
            JOIN Cars c ON r.car_id = c.car_id
            WHERE r.return_date IS NULL AND r.pickup_date < CURDATE()";
    return $pdo->query($sql)->fetchAll();
}

$financialSummary = getFinancialSummary($pdo);
$activeRentals = getActiveRentals($pdo);
$overdueRentals = getOverdueRentals($pdo);


// --- 2. PHP: Prepare data for the new charts ---

// Query for Monthly Revenue (Bar Chart)
$monthlyRevenueQuery = "
    SELECT DATE_FORMAT(payment_date, '%Y-%m') AS month, SUM(amount) AS total 
    FROM Payments 
    GROUP BY month 
    ORDER BY month ASC 
    LIMIT 12";
$stmt = $pdo->query($monthlyRevenueQuery);
$monthlyRevenueData = $stmt->fetchAll();

// Process data for Chart.js
$revenueLabels = [];
$revenueValues = [];
foreach ($monthlyRevenueData as $row) {
    $revenueLabels[] = date("M Y", strtotime($row['month'] . "-01"));
    $revenueValues[] = $row['total'];
}


// Query for Car Type Popularity (Pie Chart)
$carTypeQuery = "
    SELECT ct.type_name, COUNT(r.rental_id) as rental_count 
    FROM Rentals r
    JOIN Cars c ON r.car_id = c.car_id
    JOIN Car_Types ct ON c.car_type_id = ct.car_type_id
    GROUP BY ct.type_name
    ORDER BY rental_count DESC";
$stmt = $pdo->query($carTypeQuery);
$carTypeData = $stmt->fetchAll();

// Process data for Chart.js
$carTypeLabels = [];
$carTypeValues = [];
foreach ($carTypeData as $row) {
    $carTypeLabels[] = $row['type_name'];
    $carTypeValues[] = $row['rental_count'];
}

?>

<h1>Employee Dashboard Reports</h1>

<div class="reports-container">
    <div class="report-card">
        <h2>Financial Summary</h2>
        <p><strong>Total Rentals:</strong> <?= $financialSummary['total_rentals'] ?? 0 ?></p>
        <p><strong>Total Revenue:</strong> $<?= number_format($financialSummary['total_revenue'] ?? 0, 2) ?></p>
    </div>
    
    <div class="report-card">
        <h2>Active Rentals</h2>
        <?php if (empty($activeRentals)): ?>
            <p>No cars are currently rented out.</p>
        <?php else: ?>
            <ul>
                <?php foreach ($activeRentals as $rental): ?>
                    <li><?= htmlspecialchars("{$rental['make']} {$rental['model']} (Plate: {$rental['license_plate']})") ?></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </div>
    
    <div class="report-card">
        <h2>Overdue Rentals</h2>
        <?php if (empty($overdueRentals)): ?>
            <p>No rentals are currently overdue.</p>
        <?php else: ?>
            <ul>
                <?php foreach ($overdueRentals as $rental): ?>
                    <li><?= htmlspecialchars("{$rental['make']} {$rental['model']} (Plate: {$rental['license_plate']})") ?> - Picked up on <?= $rental['pickup_date'] ?></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </div>
</div>

<hr style="margin: 40px 0;">

<div class="reports-container">
    <div class="report-card">
        <h2>Monthly Revenue</h2>
        <canvas id="monthlyRevenueChart"></canvas>
    </div>
    <div class="report-card">
        <h2>Car Type Popularity</h2>
        <canvas id="carTypePopularityChart"></canvas>
    </div>
</div>


<script>
document.addEventListener('DOMContentLoaded', () => {

    // --- Pass PHP data to JavaScript using json_encode ---
    const revenueLabels = <?= json_encode($revenueLabels) ?>;
    const revenueValues = <?= json_encode($revenueValues) ?>;
    const carTypeLabels = <?= json_encode($carTypeLabels) ?>;
    const carTypeValues = <?= json_encode($carTypeValues) ?>;

    // --- Create Monthly Revenue Bar Chart ---
    const revenueCtx = document.getElementById('monthlyRevenueChart').getContext('2d');
    new Chart(revenueCtx, {
        type: 'bar',
        data: {
            labels: revenueLabels,
            datasets: [{
                label: 'Total Revenue ($)',
                data: revenueValues,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // --- Create Car Type Popularity Pie Chart ---
    const carTypeCtx = document.getElementById('carTypePopularityChart').getContext('2d');
    new Chart(carTypeCtx, {
        type: 'pie',
        data: {
            labels: carTypeLabels,
            datasets: [{
                label: 'Number of Rentals',
                data: carTypeValues,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
});
</script>