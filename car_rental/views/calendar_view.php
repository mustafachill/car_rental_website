<?php
// This view is included from index.php and has access to $pdo, $currentTable, etc.

$currentYear = $_GET['year'] ?? date('Y');
$currentMonth = $_GET['month'] ?? date('m');
$numDays = cal_days_in_month(CAL_GREGORIAN, $currentMonth, $currentYear);
$firstDayOfMonth = date('N', strtotime("$currentYear-$currentMonth-01"));

// Get rental data for the current month
try {
    $sql = "SELECT car_id, pickup_date, return_date FROM Rentals WHERE YEAR(pickup_date) = ? AND MONTH(pickup_date) = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$currentYear, $currentMonth]);
    $rentals = $stmt->fetchAll(PDO::FETCH_GROUP | PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Error fetching rental data: " . $e->getMessage());
}

// Get all cars to display in the calendar
try {
    $cars = $pdo->query("SELECT car_id, make, model FROM Cars")->fetchAll();
} catch (PDOException $e) {
    die("Error fetching car data: " . $e->getMessage());
}

?>

<h1>Car Availability Calendar</h1>

<div class="calendar-nav">
    <?php
    $prevMonth = ($currentMonth == 1) ? 12 : $currentMonth - 1;
    $prevYear = ($currentMonth == 1) ? $currentYear - 1 : $currentYear;
    $nextMonth = ($currentMonth == 12) ? 1 : $currentMonth + 1;
    $nextYear = ($currentMonth == 12) ? $currentYear + 1 : $currentYear;
    ?>
    <a href="index.php?table=Calendar&year=<?= $prevYear ?>&month=<?= $prevMonth ?>" class="btn">&laquo; Previous Month</a>
    <h2><?= date('F Y', strtotime("$currentYear-$currentMonth-01")) ?></h2>
    <a href="index.php?table=Calendar&year=<?= $nextYear ?>&month=<?= $nextMonth ?>" class="btn">Next Month &raquo;</a>
</div>

<div class="table-responsive">
    <table class="calendar-table">
        <thead>
            <tr>
                <th>Car</th>
                <?php for ($i = 1; $i <= $numDays; $i++): ?>
                    <th><?= $i ?></th>
                <?php endfor; ?>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($cars as $car): ?>
                <tr>
                    <td><?= htmlspecialchars($car['make'] . ' ' . $car['model']) ?></td>
                    <?php for ($i = 1; $i <= $numDays; $i++): ?>
                        <td class="calendar-day">
                            <?php
                            $isRented = false;
                            $rentalInfo = null;
                            foreach ($rentals as $rental):
                                if ($rental['car_id'] == $car['car_id']) {
                                    $pickupDate = new DateTime($rental['pickup_date']);
                                    $returnDate = $rental['return_date'] ? new DateTime($rental['return_date']) : new DateTime();
                                    $currentDay = new DateTime("$currentYear-$currentMonth-$i");
                                    if ($currentDay >= $pickupDate && $currentDay <= $returnDate) {
                                        $isRented = true;
                                        $rentalInfo = $rental;
                                        break;
                                    }
                                }
                            endforeach;
                            if ($isRented):
                            ?>
                                <span class="rented-indicator" title="Rented from <?= $rentalInfo['pickup_date'] ?> to <?= $rentalInfo['return_date'] ?? 'N/A' ?>"></span>
                            <?php endif; ?>
                        </td>
                    <?php endfor; ?>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>