<?php
require_once '../config.php';

if ($_SESSION['user_role'] !== 'employee') {
    redirect('../index.php');
}

$tableName = $_GET['table'] ?? '';
$id = $_GET['id'] ?? null;

if (!array_key_exists($tableName, TABLES_AND_COLUMNS) || !$id) {
    redirect('../index.php?error=Invalid parameters for deletion.');
}

$primaryKey = TABLES_AND_COLUMNS[$tableName][0];

try {
    $sql = "DELETE FROM `$tableName` WHERE `$primaryKey` = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);

    writeToAuditLog("Deleted record #$id from $tableName by {$_SESSION['username']}");
    redirect("../index.php?table=$tableName&success=Record deleted successfully.");
    
} catch (PDOException $e) {
    // Catch foreign key constraint errors
    $errorMessage = "Error deleting record. It may be in use by another table (e.g., a car in an active rental).";
    redirect("../index.php?table=$tableName&error=" . urlencode($errorMessage));
}