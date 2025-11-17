<?php
require_once 'config.php';
// If user is already logged in, redirect them to the main page
if (isset($_SESSION['user_role'])) {
    redirect('index.php');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Car Rental System</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body id="login-body">
    <div class="login-container">
        <h1>Car Rental Database</h1>
        <p>Please select your login type.</p>
        
        <?php if (isset($_GET['error'])): ?>
            <div class="error-message"><?= htmlspecialchars($_GET['error']) ?></div>
        <?php endif; ?>
        <?php if (isset($_GET['success'])): ?>
            <div class="flash-messages success-messages" style="text-align: left;"><?= htmlspecialchars($_GET['success']) ?></div>
        <?php endif; ?>

        <div class="login-forms">
            <div class="form-wrapper">
                <h2>Employee Login</h2>
                <form action="auth.php" method="post">
                    <input type="hidden" name="role" value="employee">
                    <div class="form-group">
                        <label for="username">Username:</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password:</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Login as Employee</button>
                </form>
            </div>

            <div class="form-wrapper">
                <h2>Customer Login</h2>
                <form action="auth.php" method="post">
                    <input type="hidden" name="role" value="customer">
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="cust_password">Password:</label>
                        <input type="password" id="cust_password" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-success">Login as Customer</button>
                </form>
                <p style="text-align: center; margin-top: 20px;">
                    Don't have an account? <a href="register.php">Register here</a>
                </p>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const body = document.body;
            const applyTheme = (theme) => {
                if (theme === 'dark') {
                    body.setAttribute('data-theme', 'dark');
                } else {
                    body.removeAttribute('data-theme');
                }
            };

            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                applyTheme(savedTheme);
            } else {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                    applyTheme('dark');
                } else {
                    applyTheme('light');
                }
            }
        });
    </script>
</body>
</html>