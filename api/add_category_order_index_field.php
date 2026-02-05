<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    // Check if order_index column already exists
    $checkColumn = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                    WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                    AND TABLE_NAME = 'categories' 
                    AND COLUMN_NAME = 'order_index'";
    
    $result = $conn->query($checkColumn);
    $columnExists = false;
    
    if ($result) {
        $row = $result->fetch_assoc();
        $columnExists = $row['count'] > 0;
    }
    
    if ($columnExists) {
        echo json_encode([
            'success' => true,
            'message' => 'order_index column already exists in categories table',
            'column_exists' => true
        ]);
    } else {
        // Add order_index column
        $sql = "ALTER TABLE categories ADD COLUMN order_index INT DEFAULT 0 AFTER parent_id";
        
        if ($conn->query($sql)) {
            // Initialize order_index for existing categories based on created_at
            $initSql = "UPDATE categories SET order_index = (
                SELECT @row_number := @row_number + 1 AS row_number
                FROM (SELECT @row_number := -1) AS r
                ORDER BY created_at ASC
            )";
            
            // Actually, simpler approach - update based on id order
            $initSql = "UPDATE categories c1
                        INNER JOIN (
                            SELECT id, (@row_number := @row_number + 1) AS row_number
                            FROM categories, (SELECT @row_number := -1) AS r
                            ORDER BY id ASC
                        ) c2 ON c1.id = c2.id
                        SET c1.order_index = c2.row_number";
            
            // Even simpler - just set order_index = id for existing records
            $initSql = "UPDATE categories SET order_index = id WHERE order_index = 0";
            $conn->query($initSql);
            
            echo json_encode([
                'success' => true,
                'message' => 'order_index column added successfully to categories table',
                'column_exists' => true
            ]);
        } else {
            throw new Exception('Failed to add order_index column: ' . $conn->error);
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
