<?php
// This file is included by index.php, so it has access to $pdo, $userRole, $currentTable etc.
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($currentTable) ?> - Car Rental System</title>
    <link rel="stylesheet" href="/car_rental/assets/style.css">
</head>
<body>
    <header>
        <nav class="container">
            <a href="index.php" class="logo">Car Rental System</a>
            
            <div class="nav-main">
                <ul class="nav-links">
                    <?php
                    $tablesToShow = ['Cars', 'Car_Types', 'Customers', 'Employees', 'Rentals', 'Payments', 'Maintenance'];
                    if ($_SESSION['user_role'] === 'customer') {
                        $tablesToShow = ['Cars'];
                    }
                    
                    foreach ($tablesToShow as $tableName) {
                        $activeClass = ($tableName === $currentTable) ? 'active' : '';
                        echo "<li><a href='index.php?table=$tableName' class='$activeClass'>" . htmlspecialchars($tableName) . "</a></li>";
                    }
                    ?>
                </ul>
            </div>

            <div class="nav-utility">
                <ul class="nav-links">
                    <?php if ($_SESSION['user_role'] === 'employee'): ?>
                        <li><a href="index.php?table=Reports" class="<?= ($currentTable === 'Reports') ? 'active' : '' ?>">Reports</a></li>
                        <li><a href="index.php?table=Calendar" class="<?= ($currentTable === 'Calendar') ? 'active' : '' ?>">Calendar</a></li>
                    <?php endif; ?>
                    <?php if (isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'customer'): ?>
                        <li><a href="account.php" class="<?= ($currentTable === 'Account') ? 'active' : '' ?>">My Account</a></li>
                    <?php endif; ?>
                </ul>
                
                <div class="user-info">
                    <button id="theme-toggle">☀️</button> 
                    <a href="logout.php" class="btn btn-danger">Logout (<?= htmlspecialchars($_SESSION['user_role']) ?>)</a>
                </div>
            </div>
        </nav>
    </header>