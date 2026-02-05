<?php
require_once 'config.php';

header('Content-Type: application/json');

$alterations = [
    "ALTER TABLE sliders ADD COLUMN image_position_x VARCHAR(50) DEFAULT 'center'",
    "ALTER TABLE sliders ADD COLUMN image_position_y VARCHAR(50) DEFAULT 'center'"
];

$success = true;
$errors = [];

foreach ($alterations as $sql) {
    // Check if column exists before adding
    $columnName = '';
    if (preg_match('/ADD COLUMN IF NOT EXISTS (\w+)/', $sql, $matches)) {
        $columnName = $matches[1];
    } elseif (preg_match('/ADD COLUMN (\w+)/', $sql, $matches)) {
        $columnName = $matches[1];
    }
    
    if ($columnName) {
        $checkSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                     WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                     AND TABLE_NAME = 'sliders' 
                     AND COLUMN_NAME = '$columnName'";
        $result = $conn->query($checkSql);
        if ($result) {
            $row = $result->fetch_assoc();
            if ($row['count'] > 0) {
                continue; // Column already exists
            }
        }
    }
    
    // Remove IF NOT EXISTS for MySQL compatibility
    $sql = preg_replace('/IF NOT EXISTS /', '', $sql);
    
    if (!$conn->query($sql)) {
        $success = false;
        $errors[] = $conn->error;
    }
}

if ($success) {
    echo json_encode(['success' => true, 'message' => 'Slider position fields added successfully']);
} else {
    echo json_encode(['success' => false, 'errors' => $errors]);
}

$conn->close();
?>

