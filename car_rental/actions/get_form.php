<?php
require_once '../config.php';
// Security check: Only employees can access this
if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'employee') {
    http_response_code(403);
    echo "<h2>Access Denied</h2><p>You do not have permission to perform this action.</p>";
    exit();
}

$tableName = $_GET['table'] ?? '';
$id = $_GET['id'] ?? null;
$mode = $id ? 'Edit' : 'Add';

if (!array_key_exists($tableName, TABLES_AND_COLUMNS)) {
    http_response_code(400);
    echo "<h2>Invalid Request</h2><p>The specified table does not exist.</p>";
    exit();
}

$columns = TABLES_AND_COLUMNS[$tableName];
$primaryKey = $columns[0];
$record = null;
// If in Edit mode, fetch the existing record
if ($id) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM `$tableName` WHERE `$primaryKey` = ?");
        $stmt->execute([$id]);
        $record = $stmt->fetch();
    } catch (PDOException $e) {
        http_response_code(500);
        echo "<h2>Database Error</h2><p>Could not fetch record details.</p>";
        exit();
    }
}

// Determine the correct action script for the form
$actionUrl = $mode === 'Add' ? 'actions/create_record.php' : 'actions/update_record.php';

?>

<h2><?= $mode ?> Record in <?= htmlspecialchars(formatColumnName($tableName)) ?></h2>

<form action="<?= $actionUrl ?>" method="post" enctype="multipart/form-data" class="modal-form">
    <input type="hidden" name="tableName" value="<?= htmlspecialchars($tableName) ?>">
    
    <?php foreach ($columns as $column): ?>
        <div class="form-group">
            <label for="<?= htmlspecialchars($column) ?>"><?= htmlspecialchars(formatColumnName($column)) ?>:</label>
            
            <?php
            $value = $record[$column] ?? '';
            $isPrimaryKey = ($column === $primaryKey);
            $attributes = $isPrimaryKey && $mode === 'Edit' ? 'readonly' : '';
            $inputType = 'text';

            if (str_contains($column, 'date')) {
                $inputType = 'date';
            } elseif (str_contains($column, 'rate') || str_contains($column, 'cost') || str_contains($column, 'amount')) {
                $inputType = 'number';
                $attributes .= ' step="0.01"';
            } elseif ($column === 'year' || str_contains($column, '_id')) {
                $inputType = 'number';
            }
            
            // Hide the primary key field when adding a new record
            if ($isPrimaryKey && $mode === 'Add') {
                echo "<input type='hidden' name='{$column}' value=''>";
                echo "<p><em>(Auto-generated upon creation)</em></p>";
                continue;
            }

            // New: Handle the image_path file input
            if ($column === 'image_path') {
                echo '<input type="file" id="car_image" name="car_image" accept=".jpg, .jpeg, .png">';
                if (!empty($value)) {
                    echo '<p><a href="/car_rental/uploads/' . htmlspecialchars($value) . '" data-lightbox><img src="/car_rental/uploads/' . htmlspecialchars($value) . '" alt="Current Car Image" style="width: 150px; margin-top: 10px;"></a></p>';
                }
                continue;
            }
            ?>
            
            <input 
                type="<?= $inputType ?>" 
                id="<?= htmlspecialchars($column) ?>" 
                name="<?= htmlspecialchars($column) ?>" 
                value="<?= htmlspecialchars($value) ?>"
                <?= $attributes ?>
                required
            >
        </div>
    <?php endforeach; ?>
    
    <div class="form-actions">
        <button type="submit" class="btn btn-success"><?= $mode ?> Record</button>
    </div>
</form>