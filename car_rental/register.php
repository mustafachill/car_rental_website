<?php
require_once 'config.php';
// If user is already logged in, redirect them away from register page
if (isset($_SESSION['user_role'])) {
    redirect('index.php');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Car Rental System</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
    <div class="login-container" style="max-width: 500px;">
        <h1>Create Customer Account</h1>
        
        <?php if (isset($_GET['error'])): ?>
            <div class="error-message" style="text-align: left;"><?= htmlspecialchars($_GET['error']) ?></div>
        <?php endif; ?>

        <div class="form-wrapper">
            <form action="actions/register_action.php" method="post">
                <div class="form-group">
                    <label for="first_name">First Name:</label>
                    <input type="text" id="first_name" name="first_name" required>
                </div>
                <div class="form-group">
                    <label for="last_name">Last Name:</label>
                    <input type="text" id="last_name" name="last_name" required>
                </div>
                 <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" required>
                </div>
                 <div class="form-group">
                    <label for="phone">Phone Number:</label>
                    <input type="tel" id="phone" name="phone_number" required pattern="\d{10}" title="Enter a 10-digit phone number">
                </div>
                <div class="form-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="btn btn-success">Register</button>
            </form>
            <p style="text-align: center; margin-top: 20px;">
                Already have an account? <a href="login.php">Login here</a>
            </p>
        </div>
    </div>
</body>
</html>