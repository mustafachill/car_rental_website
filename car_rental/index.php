<?php
require_once 'config.php';

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Check if user is logged in, if not, redirect to login page
if (!isset($_SESSION['user_role'])) {
    redirect('login.php');
}

$userRole = $_SESSION['user_role'];
$allowedTables = array_keys(TABLES_AND_COLUMNS);
$defaultTable = ($userRole === 'employee') ? 'Cars' : 'Cars';

// Determine the current table to display
$currentTable = $_GET['table'] ?? $defaultTable;

// Security check: Make sure the user is allowed to see this table
if ($userRole === 'customer' && $currentTable !== 'Cars') {
    $currentTable = 'Cars';
}

if (!in_array($currentTable, $allowedTables) && $currentTable !== 'Reports' && $currentTable !== 'Calendar') {
    $currentTable = $defaultTable;
}

if ($userRole === 'customer' && ($currentTable === 'Reports' || $currentTable === 'Calendar')) {
    $currentTable = 'Cars';
}

if (basename($_SERVER['PHP_SELF']) == 'account.php') $currentTable = 'Account';


// Include the header
include 'header.php';

// --- DISPLAY SESSION MESSAGES (FLASH MESSAGES) ---
echo '<div class="container">';

if (isset($_SESSION['errors'])) {
    echo '<div class="flash-messages error-messages">';
    echo '<h4>Please correct the following errors:</h4>';
    echo '<ul>';
    foreach ($_SESSION['errors'] as $error) {
        echo '<li>' . htmlspecialchars($error) . '</li>';
    }
    echo '</ul></div>';
    unset($_SESSION['errors']);
}

if (isset($_SESSION['success'])) {
    echo '<div class="flash-messages success-messages">';
    echo '<p>' . htmlspecialchars($_SESSION['success']) . '</p>';
    echo '</div>';
    unset($_SESSION['success']);
}

// --- MAIN CONTENT ---
echo '<main>';

if ($currentTable === 'Reports' && $userRole === 'employee') {
    include 'views/reports_view.php';
} elseif ($currentTable === 'Calendar' && $userRole === 'employee') {
    include 'views/calendar_view.php';
} else {
    include 'views/table_view.php';
}

echo '</main>';
echo '</div>';


// Include the footer
include 'footer.php';