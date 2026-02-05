<?php
require_once 'config.php';

// Create tables one by one
$tables = [
    "CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    
    "CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(500),
        category_id INT,
        stock INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )",
    
    "CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL,
        zip_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) DEFAULT 'United States',
        total DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled') DEFAULT 'pending',
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    
    "CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT,
        product_name VARCHAR(255) NOT NULL,
        product_price DECIMAL(10, 2) NOT NULL,
        quantity INT NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )",
    
    "CREATE TABLE IF NOT EXISTS google_merchant_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        google_product_id VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        link VARCHAR(500),
        image_link VARCHAR(500),
        price DECIMAL(10, 2) NOT NULL,
        availability VARCHAR(50) DEFAULT 'in stock',
        brand VARCHAR(100),
        condition VARCHAR(50) DEFAULT 'new',
        google_product_category VARCHAR(255),
        product_type VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )"
];

$success = true;
$errors = [];

foreach ($tables as $sql) {
    if (!$conn->query($sql)) {
        $success = false;
        $errors[] = $conn->error;
    }
}

if ($success) {
    echo json_encode(['success' => true, 'message' => 'Database initialized successfully']);
} else {
    echo json_encode(['success' => false, 'errors' => $errors]);
}

$conn->close();
?>

