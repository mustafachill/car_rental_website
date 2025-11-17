<?php
// This view is included from index.php and has access to $pdo, $currentTable, etc.

$columns = TABLES_AND_COLUMNS[$currentTable];
$primaryKey = $columns[0];

// --- 1. PAGINATION SETUP ---
$recordsPerPage = 15;
$currentPage = 1;
// Always start on page 1 for initial load
$offset = 0;
// --- INITIAL DATA LOAD ---
// (Search query is now handled by live_search.php, so we do a simple initial fetch)
$sortColumn = $primaryKey;
$sortOrder = 'ASC';
$nextSortOrder = 'DESC';
$searchQuery = ''; // Empty for initial load

$baseSql = "FROM `$currentTable`";
$whereClause = '';
if ($userRole === 'customer' && $currentTable === 'Cars') {
    $whereClause = " WHERE `status` = 'Available'";
}
$baseSql .= $whereClause;

// Count total records for initial pagination
$totalRecordsQuery = "SELECT COUNT(*) " . $baseSql;
$totalRecords = $pdo->query($totalRecordsQuery)->fetchColumn();
$totalPages = ceil($totalRecords / $recordsPerPage);

// Fetch the first page of records
$sql = "SELECT * " . $baseSql . " ORDER BY `$sortColumn` $sortOrder LIMIT " . $recordsPerPage . " OFFSET " . $offset;
$rows = $pdo->query($sql)->fetchAll();
?>

<h1><?= htmlspecialchars(formatColumnName($currentTable)) ?></h1>

<div class="table-controls">
    <div class="search-form">
        <input type="text" id="liveSearchInput" placeholder="Search in real-time..." 
               data-table="<?= htmlspecialchars($currentTable) ?>"
               data-sort-col="<?= htmlspecialchars($sortColumn) ?>"
               data-sort-order="<?= htmlspecialchars($sortOrder) ?>"
        >
    </div>
    <div class="top-buttons">
        <?php if ($userRole === 'employee'): ?>
            <?php if ($currentTable === 'Cars'): ?>
                <button id="viewDashboardBtn" class="btn btn-info">📊 View Dashboard</button>
            <?php endif; ?>
            <a href="export.php?table=<?= htmlspecialchars($currentTable) ?>" class="btn btn-info">📄 Export to CSV</a>
            <button class="btn btn-success" onclick="openModal('<?= $currentTable ?>', null)">➕ Add New</button>
        <?php endif; ?>
        <?php if ($userRole === 'customer' && $currentTable === 'Cars'): ?>
            <button id="viewCustomerDashboardBtn" class="btn btn-info">View Details</button>
        <?php endif; ?>
    </div>
</div>

<div class="table-responsive">
    <table>
        <thead>
            <tr id="tableHeaderRow">
                <?php foreach ($columns as $column): ?>
                    <th>
                        <a href="#" class="sort-link" data-sort-col="<?= $column ?>" data-sort-order="<?= ($sortColumn === $column) ? $nextSortOrder : 'ASC' ?>">
                            <?= htmlspecialchars(formatColumnName($column)) ?>
                            <?php if ($sortColumn === $column) echo ($sortOrder === 'ASC' ? ' ▲' : ' ▼'); ?>
                        </a>
                    </th>
                <?php endforeach; ?>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="tableBodyContent">
            <?php if (empty($rows)): ?>
                <tr><td colspan="<?= count($columns) + 1 ?>">No records found.</td></tr>
            <?php else: ?>
                <?php foreach ($rows as $row): ?>
                    <tr class="data-row" data-id="<?= $row[$primaryKey] ?>">
                        <?php foreach ($columns as $column): ?>
                            <td>
                                <?php if ($currentTable === 'Cars' && $column === 'image_path'): ?>
                                    <?php if ($row['image_path']): ?>
                                        <img src="/car_rental/uploads/<?= htmlspecialchars($row['image_path']) ?>" alt="Car Image" style="width: 100px; height: auto;">
                                    <?php else: ?>
                                        No Image
                                    <?php endif; ?>
                                <?php else: ?>
                                    <?= htmlspecialchars($row[$column] ?? 'N/A') ?>
                                <?php endif; ?>
                            </td>
                        <?php endforeach; ?>
                        <td class="action-buttons">
                           <?php if ($userRole === 'employee'): ?>
                                <?php if ($currentTable === 'Customers'): ?>
                                    <a href="view_customer.php?id=<?= $row[$primaryKey] ?>" class="btn btn-info">👤 View Profile</a>
                                <?php endif; ?>
                                <button class="btn btn-primary" onclick="openModal('<?= $currentTable ?>', <?= $row[$primaryKey] ?>)">✏️ Edit</button>
                               <a href="actions/delete_record.php?table=<?= $currentTable ?>&id=<?= $row[$primaryKey] ?>" class="btn btn-danger" onclick="return confirm('Are you sure you want to delete this record?');">❌ Delete</a>
                                <?php if ($currentTable === 'Rentals' && empty($row['return_date'])): ?>
                                <a href="actions/return_rental.php?rental_id=<?= $row['rental_id'] ?>&car_id=<?= $row['car_id']?>" class="btn btn-info" onclick="return confirm('Are you sure you want to process this return?');">Return Car</a>
                                <?php endif; ?>
                            <?php elseif ($userRole === 'customer' && $currentTable === 'Cars'): ?>
                                <a href="actions/rent_car.php?car_id=<?= $row['car_id'] ?>" class="btn btn-success" onclick="return confirm('Are you sure you want to rent this car?');">Rent This Car</a>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>
</div>

<div class="pagination" id="paginationContainer">
    <?php if ($totalPages > 1): ?>
        <?php for ($i = 1; $i <= $totalPages; $i++): ?>
            <a href="#" data-page="<?= $i ?>" class="btn page-link <?= ($i == $currentPage) ? 'active' : '' ?>"><?= $i ?></a>
        <?php endfor; ?>
        <?php if ($currentPage < $totalPages): ?>
            <a href="#" data-page="<?= $currentPage + 1 ?>" class="btn page-link">Next &raquo;</a>
        <?php endif; ?>
    <?php endif; ?>
</div>