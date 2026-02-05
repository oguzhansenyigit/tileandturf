<?php
require_once 'config.php';

header('Content-Type: application/json');

// Check if column exists
$checkSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
             WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
             AND TABLE_NAME = 'products' 
             AND COLUMN_NAME = 'catalog_mode'";
$result = $conn->query($checkSql);
$row = $result->fetch_assoc();

if ($row['count'] == 0) {
    $sql = "ALTER TABLE products ADD COLUMN catalog_mode ENUM('yes', 'no') DEFAULT 'no'";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true, 'message' => 'Catalog mode field added successfully']);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
} else {
    echo json_encode(['success' => true, 'message' => 'Catalog mode field already exists']);
}

$conn->close();
?>

