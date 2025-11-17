<?php
require_once 'config.php';

$user = $_SESSION['username'] ?? $_SESSION['customer_name'] ?? 'User';
writeToAuditLog("$user logged out.");

// Unset all of the session variables
$_SESSION = [];

// Destroy the session
session_destroy();

// Redirect to login page
redirect('login.php');