<?php
require_once 'config.php';

// Add "OUR PRODUCTS" menu item to the database if it doesn't exist
$sql = "SELECT id FROM menu_items WHERE slug = 'our-products' LIMIT 1";
$result = $conn->query($sql);

if ($result->num_rows === 0) {
    // Insert "OUR PRODUCTS" as the first menu item
    $insertSql = "INSERT INTO menu_items (name, slug, link, parent_id, order_index, status) 
                  VALUES ('OUR PRODUCTS', 'our-products', '/products', NULL, 0, 'active')";
    
    if ($conn->query($insertSql)) {
        $ourProductsId = $conn->insert_id;
        
        // Update order_index of other menu items to make room for OUR PRODUCTS
        $updateSql = "UPDATE menu_items SET order_index = order_index + 1 WHERE id != $ourProductsId";
        $conn->query($updateSql);
        
        echo json_encode([
            'success' => true,
            'message' => 'OUR PRODUCTS menu item added successfully',
            'id' => $ourProductsId
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => $conn->error
        ]);
    }
} else {
    $row = $result->fetch_assoc();
    echo json_encode([
        'success' => true,
        'message' => 'OUR PRODUCTS menu item already exists',
        'id' => $row['id']
    ]);
}

$conn->close();
?>

