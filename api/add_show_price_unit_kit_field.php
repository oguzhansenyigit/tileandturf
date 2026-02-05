<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    // Check if column already exists
    $checkSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                 WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                 AND TABLE_NAME = 'products' 
                 AND COLUMN_NAME = 'show_price_unit_kit'";
    
    $result = $conn->query($checkSql);
    $exists = false;
    
    if ($result) {
        $row = $result->fetch_assoc();
        $exists = $row['count'] > 0;
    }
    
    if ($exists) {
        echo json_encode([
            'success' => true,
            'message' => 'Column show_price_unit_kit already exists'
        ]);
    } else {
        // Add the column
        $sql = "ALTER TABLE products ADD COLUMN show_price_unit_kit TINYINT(1) DEFAULT 0 AFTER show_unit_price";
        
        if ($conn->query($sql)) {
            echo json_encode([
                'success' => true,
                'message' => 'Column show_price_unit_kit added successfully'
            ]);
        } else {
            throw new Exception('Error adding column: ' . $conn->error);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

$conn->close();
?>
