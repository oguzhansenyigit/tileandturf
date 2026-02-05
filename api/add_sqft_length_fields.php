<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    // Check if columns exist before adding
    $checkColumns = $conn->query("SHOW COLUMNS FROM products LIKE 'sqft_enabled'");
    $sqftEnabledExists = $checkColumns->num_rows > 0;
    
    $checkColumns = $conn->query("SHOW COLUMNS FROM products LIKE 'sqft_price'");
    $sqftPriceExists = $checkColumns->num_rows > 0;
    
    $checkColumns = $conn->query("SHOW COLUMNS FROM products LIKE 'length_enabled'");
    $lengthEnabledExists = $checkColumns->num_rows > 0;
    
    $checkColumns = $conn->query("SHOW COLUMNS FROM products LIKE 'length_base_price'");
    $lengthBasePriceExists = $checkColumns->num_rows > 0;
    
    $checkColumns = $conn->query("SHOW COLUMNS FROM products LIKE 'length_increment_price'");
    $lengthIncrementPriceExists = $checkColumns->num_rows > 0;
    
    $alterStatements = [];
    
    if (!$sqftEnabledExists) {
        $alterStatements[] = "ADD COLUMN sqft_enabled TINYINT(1) DEFAULT 0 COMMENT 'Enable sqft pricing for this product'";
    }
    
    if (!$sqftPriceExists) {
        $alterStatements[] = "ADD COLUMN sqft_price DECIMAL(10, 2) NULL COMMENT 'Price per square foot'";
    }
    
    if (!$lengthEnabledExists) {
        $alterStatements[] = "ADD COLUMN length_enabled TINYINT(1) DEFAULT 0 COMMENT 'Enable length pricing for this product'";
    }
    
    if (!$lengthBasePriceExists) {
        $alterStatements[] = "ADD COLUMN length_base_price DECIMAL(10, 2) NULL COMMENT 'Base price for length calculation'";
    }
    
    if (!$lengthIncrementPriceExists) {
        $alterStatements[] = "ADD COLUMN length_increment_price DECIMAL(10, 2) NULL COMMENT 'Price increment per length unit'";
    }
    
    if (!empty($alterStatements)) {
        $sql = "ALTER TABLE products " . implode(", ", $alterStatements);
        if ($conn->query($sql)) {
            echo json_encode([
                'success' => true,
                'message' => 'Sqft and Length fields added successfully',
                'added' => [
                    'sqft_enabled' => !$sqftEnabledExists,
                    'sqft_price' => !$sqftPriceExists,
                    'length_enabled' => !$lengthEnabledExists,
                    'length_base_price' => !$lengthBasePriceExists,
                    'length_increment_price' => !$lengthIncrementPriceExists
                ]
            ]);
        } else {
            throw new Exception("Error adding columns: " . $conn->error);
        }
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'All sqft and length fields already exist',
            'added' => [
                'sqft_enabled' => false,
                'sqft_price' => false,
                'length_enabled' => false,
                'length_base_price' => false,
                'length_increment_price' => false
            ]
        ]);
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

