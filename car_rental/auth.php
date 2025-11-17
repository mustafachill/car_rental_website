<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect('login.php');
}

$role = $_POST['role'] ?? '';

if ($role === 'employee') {
    // --- Employee Authentication (No changes needed here) ---
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $hashedPassword = hash('sha256', $password);
    $employeeFile = 'employees.txt';

    $isValid = false;
    if (file_exists($employeeFile)) {
        $credentials = file_get_contents($employeeFile);
        list($storedUser, $storedHash) = explode(':', trim($credentials));
        if ($username === $storedUser && $hashedPassword === $storedHash) {
            $isValid = true;
        }
    } else {
         // First time running: create the file with the provided credentials
        file_put_contents($employeeFile, "$username:$hashedPassword");
        $isValid = true;
        writeToAuditLog("Employee file created. First employee registered: $username");
    }

    if ($isValid) {
        $_SESSION['user_role'] = 'employee';
        $_SESSION['username'] = $username;
        writeToAuditLog("Employee logged in: $username");
        redirect('index.php');
    } else {
        redirect('login.php?error=Invalid employee credentials.');
    }

} elseif ($role === 'customer') {
    // --- NEW Customer Login Logic ---
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        redirect('login.php?error=Email and password are required.');
    }

    try {
        // Find the customer by email
        $stmt = $pdo->prepare("SELECT * FROM Customers WHERE email = ?");
        $stmt->execute([$email]);
        $customer = $stmt->fetch();

        // Verify the customer exists and the password is correct
        if ($customer && password_verify($password, $customer['password'])) {
            // Password is correct! Set session variables.
            $_SESSION['user_role'] = 'customer';
            $_SESSION['customer_id'] = $customer['customer_id'];
            $_SESSION['customer_name'] = $customer['first_name'] . ' ' . $customer['last_name'];
            writeToAuditLog("Customer logged in: {$_SESSION['customer_name']} (ID: {$customer['customer_id']})");
            
            redirect('index.php?table=Cars');
        } else {
            // Invalid credentials
            redirect('login.php?error=Invalid email or password.');
        }

    } catch (PDOException $e) {
        redirect('login.php?error=A database error occurred.');
    }

} else {
    redirect('login.php?error=Invalid role specified.');
}