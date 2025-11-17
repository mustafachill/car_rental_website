<?php
require_once '../config.php';
require_once 'validate.php'; // Include the validator

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || $_SESSION['user_role'] !== 'employee') {
    redirect('../index.php');
}

$tableName = $_POST['tableName'] ?? '';
if (!array_key_exists($tableName, TABLES_AND_COLUMNS)) {
    die("Invalid table specified.");
}

$columns = TABLES_AND_COLUMNS[$tableName];
$primaryKey = $columns[0];
$primaryKeyValue = $_POST[$primaryKey] ?? null;

if (!$primaryKeyValue) {
    die("Primary key value is missing.");
}

// --- Handle file upload ---
$imagePath = null;
if (isset($_FILES['car_image']) && $_FILES['car_image']['error'] == 0) {
    $uploadDir = '../uploads/';
    $fileName = uniqid() . '_' . basename($_FILES['car_image']['name']);
    $uploadedFile = $uploadDir . $fileName;

    if (move_uploaded_file($_FILES['car_image']['tmp_name'], $uploadedFile)) {
        $imagePath = $fileName;
    } else {
        $_SESSION['errors'] = ["Error uploading new image."];
        redirect("../index.php?table=$tableName");
    }
}

// --- Validate the incoming data ---
$errors = validate_data($tableName, $_POST, $pdo, $primaryKeyValue);
if (!empty($errors)) {
    // If errors, save them and redirect back
    $_SESSION['errors'] = $errors;
    redirect("../index.php?table=$tableName");
} else {
    // If no errors, proceed with the update
    try {
        $setClauses = [];
        $values = [];

        // Add the image path if a new one was uploaded
        if ($imagePath) {
            $setClauses[] = "`image_path` = ?";
            $values[] = $imagePath;
        }

        foreach ($columns as $col) {
            if ($col === $primaryKey || $col === 'image_path') continue;
            if (isset($_POST[$col])) {
                $setClauses[] = "`$col` = ?";
                $values[] = $_POST[$col] === '' ? null : $_POST[$col];
            }
        }
        $values[] = $primaryKeyValue; // Add the primary key value at the end

        $sql = "UPDATE `$tableName` SET " . implode(', ', $setClauses) . " WHERE `$primaryKey` = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);

        $_SESSION['success'] = "Record updated successfully!";
        writeToAuditLog("Updated record #$primaryKeyValue in $tableName by {$_SESSION['username']}");
        redirect("../index.php?table=$tableName");
    } catch (PDOException $e) {
        $_SESSION['errors'] = ["Error updating record: " . $e->getMessage()];
        redirect("../index.php?table=$tableName");
    }
}