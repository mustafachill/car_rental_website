<?php
// --- REWRITTEN AND CORRECTED VERSION ---

// Set error display for debugging purposes
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Ensure the request method is GET, though this script is primarily for GET requests.
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

// Set the content type to application/json
header('Content-Type: application/json');

try {
    // Include the database configuration file
    require_once '../config.php';
    
    // --- Input Validation and Sanitization ---
    $tableName = $_GET['table'] ?? '';
    $searchQuery = $_GET['search'] ?? '';
    $currentPage = (int)($_GET['page'] ?? 1);
    $sortColumn = $_GET['sort'] ?? '';
    $sortOrder = $_GET['order'] ?? 'ASC';

    // Validate table name against a predefined list
    if (!array_key_exists($tableName, TABLES_AND_COLUMNS)) {
        throw new Exception('Invalid table specified.');
    }

    $userRole = $_SESSION['user_role'] ?? 'guest';
    $columns = TABLES_AND_COLUMNS[$tableName];
    $primaryKey = $columns[0];

    // Validate sort column and order
    if (empty($sortColumn) || !in_array($sortColumn, $columns)) {
        $sortColumn = $primaryKey;
    }
    $sortOrder = strtoupper($sortOrder) === 'DESC' ? 'DESC' : 'ASC';

    $recordsPerPage = 15;
    $offset = ($currentPage - 1) * $recordsPerPage;

    // --- Build the SQL Query ---
    $baseSql = "FROM `$tableName`";
    $params = [];
    $whereClause = [];

    // Add search clause if a query is provided
    if (!empty($searchQuery)) {
        $searchClauses = [];
        foreach ($columns as $col) {
            $searchClauses[] = "`$col` LIKE ?";
            $params[] = "%$searchQuery%";
        }
        $whereClause[] = "(" . implode(" OR ", $searchClauses) . ")";
    }

    // Add customer-specific filter for 'Cars' table
    if ($userRole === 'customer' && $tableName === 'Cars') {
        $whereClause[] = "`status` = 'Available'";
    }

    // Finalize the WHERE clause
    if (!empty($whereClause)) {
        $baseSql .= " WHERE " . implode(" AND ", $whereClause);
    }
    
    // --- Total Records Query ---
    $totalRecordsQuery = "SELECT COUNT(*) " . $baseSql;
    $stmtTotal = $pdo->prepare($totalRecordsQuery);
    $stmtTotal->execute($params);
    $totalRecords = $stmtTotal->fetchColumn();
    $totalPages = ceil($totalRecords / $recordsPerPage);

    // --- Main Data Query ---
    $sql = "SELECT * " . $baseSql . " ORDER BY `$sortColumn` $sortOrder LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    
    // Explicitly bind parameters to prevent PDO errors
    foreach ($params as $i => $value) {
        $stmt->bindValue($i + 1, $value);
    }
    $stmt->bindValue(':limit', $recordsPerPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // --- Generate HTML for the Table Body ---
    ob_start();

    if (empty($rows)) {
        echo '<tr><td colspan="' . (count($columns) + 1) . '">No records found.</td></tr>';
    } else {
        foreach ($rows as $row) {
            echo '<tr class="data-row" data-id="' . htmlspecialchars($row[$primaryKey]) . '">';
            foreach ($columns as $column) {
                echo '<td>';
                if ($tableName === 'Cars' && $column === 'image_path') {
                    if (!empty($row['image_path'])) {
                        echo '<img src="/car_rental/uploads/' . htmlspecialchars($row['image_path']) . '" alt="Car Image" style="width: 100px; height: auto;">';
                    } else {
                        echo 'No Image';
                    }
                } else {
                    echo htmlspecialchars($row[$column] ?? 'N/A');
                }
                echo '</td>';
            }
            
            // Action buttons
            echo '<td class="action-buttons">';
            if ($userRole === 'employee') {
                if ($tableName === 'Cars') {
                    echo '<button id="viewDashboardBtn" class="btn btn-info">📊 View Dashboard</button>';
                }
                if ($tableName === 'Customers') {
                    echo '<a href="view_customer.php?id=' . htmlspecialchars($row[$primaryKey]) . '" class="btn btn-info">👤 View Profile</a>';
                }
                echo '<button class="btn btn-primary" onclick="openModal(\'' . htmlspecialchars($tableName) . '\', ' . htmlspecialchars($row[$primaryKey]) . ')">✏️ Edit</button>';
                echo '<a href="actions/delete_record.php?table=' . htmlspecialchars($tableName) . '&id=' . htmlspecialchars($row[$primaryKey]) . '" class="btn btn-danger" onclick="return confirm(\'Are you sure you want to delete this record?\');">❌ Delete</a>';
                if ($tableName === 'Rentals' && empty($row['return_date'])) {
                     echo '<a href="actions/return_rental.php?rental_id=' . htmlspecialchars($row['rental_id']) . '&car_id=' . htmlspecialchars($row['car_id']). '" class="btn btn-info" onclick="return confirm(\'Are you sure you want to process this return?\');">Return Car</a>';
                }
            } elseif ($userRole === 'customer' && $tableName === 'Cars') {
                echo '<button id="viewCustomerDashboardBtn" class="btn btn-info">View Details</button>';
                echo '<a href="actions/rent_car.php?car_id=' . htmlspecialchars($row['car_id']) . '" class="btn btn-success" onclick="return confirm(\'Are you sure you want to rent this car?\');">Rent This Car</a>';
            }
            echo '</td></tr>';
        }
    }
    $tableBodyHtml = ob_get_clean();

    // --- Generate HTML for Pagination ---
    ob_start();
    if ($totalPages > 1) {
        if ($currentPage > 1) echo '<a href="#" data-page="' . ($currentPage - 1) . '" class="btn page-link">&laquo; Previous</a>';
        for ($i = 1; $i <= $totalPages; $i++) echo '<a href="#" data-page="' . $i . '" class="btn page-link ' . ($i == $currentPage ? 'active' : '') . '">' . $i . '</a>';
        if ($currentPage < $totalPages) echo '<a href="#" data-page="' . ($currentPage + 1) . '" class="btn page-link">Next &raquo;</a>';
    }
    $paginationHtml = ob_get_clean();

    // --- Final JSON Output ---
    echo json_encode([
        'tableBody' => $tableBodyHtml,
        'pagination' => $paginationHtml,
        'currentPage' => $currentPage,
        'totalPages' => $totalPages,
        'totalRecords' => $totalRecords
    ]);

} catch (Throwable $e) {
    // Catch any exceptions and return a structured JSON error response
    http_response_code(500);
    echo json_encode([
        'error' => 'A server error occurred. See debug info.',
        'debug_message' => $e->getMessage(),
        'debug_file' => $e->getFile(),
        'debug_line' => $e->getLine()
    ]);
}
?>