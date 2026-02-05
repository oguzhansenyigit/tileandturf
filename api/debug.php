<?php
// Debug script to check database connection and tables
header('Content-Type: application/json');

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'u632602124_tile');
define('DB_PASS', '11241124Oguzhan.');
define('DB_NAME', 'u632602124_tile1');

$result = [
    'connection' => false,
    'tables' => [],
    'errors' => []
];

// Test connection
try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        $result['errors'][] = 'Connection failed: ' . $conn->connect_error;
    } else {
        $result['connection'] = true;
        
        // Check tables
        $tables = ['categories', 'products', 'orders', 'order_items'];
        foreach ($tables as $table) {
            $check = $conn->query("SHOW TABLES LIKE '$table'");
            $result['tables'][$table] = $check && $check->num_rows > 0;
            
            if ($result['tables'][$table]) {
                $count = $conn->query("SELECT COUNT(*) as count FROM $table");
                if ($count) {
                    $row = $count->fetch_assoc();
                    $result['tables'][$table . '_count'] = $row['count'];
                }
            }
        }
        
        $conn->close();
    }
} catch (Exception $e) {
    $result['errors'][] = $e->getMessage();
}

echo json_encode($result, JSON_PRETTY_PRINT);
?>

