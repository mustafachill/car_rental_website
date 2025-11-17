<?php

function validate_data(string $tableName, array $data, PDO $pdo, int $recordId = null): array
{
    $errors = [];
    $columns = TABLES_AND_COLUMNS[$tableName];

    // --- General Validations (applies to most tables) ---
    foreach ($columns as $column) {
        // Skip primary key for new records
        if ($column === $columns[0] && !$recordId) {
            continue;
        }

        // Check for required fields (assuming most are required)
        if (empty($data[$column]) && !is_null($data[$column])) {
            $errors[] = formatColumnName($column) . " is a required field.";
        }
    }
    
    // --- Specific Column/Business Rule Validations ---
    
    // Validate Email format
    if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Please provide a valid email address.";
    }
    
    // Validate Phone Number format
    if (!empty($data['phone_number']) && !preg_match('/^\d{10}$/', $data['phone_number'])) {
        $errors[] = "Phone number must be exactly 10 digits.";
    }
    
    // Validate Year
    if (!empty($data['year']) && (!is_numeric($data['year']) || strlen((string)$data['year']) != 4)) {
        $errors[] = "Year must be a 4-digit number.";
    }

    // Validate License Plate Uniqueness
    if ($tableName === 'Cars' && !empty($data['license_plate'])) {
        $sql = "SELECT car_id FROM Cars WHERE license_plate = ?";
        $params = [$data['license_plate']];
        if ($recordId) {
            $sql .= " AND car_id != ?";
            $params[] = $recordId;
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        if ($stmt->fetch()) {
            $errors[] = "This license plate is already registered.";
        }
    }

    // Validate Rental Dates
    if ($tableName === 'Rentals' && !empty($data['pickup_date']) && !empty($data['return_date'])) {
        try {
            $pickup = new DateTime($data['pickup_date']);
            $return = new DateTime($data['return_date']);
            if ($return < $pickup) {
                $errors[] = "Return date cannot be earlier than the pickup date.";
            }
        } catch (Exception $e) {
            $errors[] = "Invalid date format provided for rental dates.";
        }
    }

    return $errors;
}