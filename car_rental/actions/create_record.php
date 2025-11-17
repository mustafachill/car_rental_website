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

// --- Handle file upload first ---
$imagePath = null;
if (isset($_FILES['car_image']) && $_FILES['car_image']['error'] == 0) {
    $uploadDir = '../uploads/';
    $fileName = uniqid() . '_' . basename($_FILES['car_image']['name']);
    $uploadedFile = $uploadDir . $fileName;

    if (move_uploaded_file($_FILES['car_image']['tmp_name'], $uploadedFile)) {
        $imagePath = $fileName;
    } else {
        $_SESSION['errors'] = ["Error uploading file."];
        redirect("../index.php?table=$tableName");
    }
}

// --- Validate the incoming data ---
$errors = validate_data($tableName, $_POST, $pdo);
if (!empty($errors)) {
    // If errors, save them and redirect back
    $_SESSION['errors'] = $errors;
    redirect("../index.php?table=$tableName");
} else {
    // If no errors, proceed with insertion
    try {
        $columns = TABLES_AND_COLUMNS[$tableName];
        $fields = [];
        $placeholders = [];
        $values = [];

        foreach ($columns as $col) {
            if ($col === $columns[0] || $col === 'image_path') continue;
            if (isset($_POST[$col])) {
                $fields[] = "`$col`";
                $placeholders[] = '?';
                $values[] = $_POST[$col] === '' ? null : $_POST[$col];
            }
        }

        // Add the image path if it exists
        if ($imagePath) {
            $fields[] = "`image_path`";
            $placeholders[] = '?';
            $values[] = $imagePath;
        }

        $sql = "INSERT INTO `$tableName` (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        $_SESSION['success'] = "Record added successfully!";
        writeToAuditLog("Added record to $tableName by {$_SESSION['username']}");
        redirect("../index.php?table=$tableName");
    } catch (PDOException $e) {
        $_SESSION['errors'] = ["Error adding record: " . $e->getMessage()];
        redirect("../index.php?table=$tableName");
    }
}