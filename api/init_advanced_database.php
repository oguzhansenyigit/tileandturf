<?php
require_once 'config.php';

// Create advanced tables for admin panel
$tables = [
    // Statistics table
    "CREATE TABLE IF NOT EXISTS statistics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        page_views INT DEFAULT 0,
        unique_visitors INT DEFAULT 0,
        orders_count INT DEFAULT 0,
        revenue DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    
    // Product views tracking
    "CREATE TABLE IF NOT EXISTS product_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        view_date DATE NOT NULL,
        view_count INT DEFAULT 1,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_product_date (product_id, view_date)
    )",
    
    // Settings table
    "CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        setting_type VARCHAR(50) DEFAULT 'text',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    
    // Sliders table
    "CREATE TABLE IF NOT EXISTS sliders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image VARCHAR(500) NOT NULL,
        button_text VARCHAR(100),
        button_link VARCHAR(500),
        order_index INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    
    // Customers table
    "CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50),
        password VARCHAR(255),
        status ENUM('active', 'pending', 'inactive') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    
    // Menu items table
    "CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        link VARCHAR(500),
        parent_id INT NULL,
        order_index INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE SET NULL
    )",
    
    // Social media links
    "CREATE TABLE IF NOT EXISTS social_media (
        id INT AUTO_INCREMENT PRIMARY KEY,
        platform VARCHAR(50) NOT NULL UNIQUE,
        url VARCHAR(500) NOT NULL,
        icon VARCHAR(100),
        status ENUM('active', 'inactive') DEFAULT 'active',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    
    // Google Merchant settings
    "CREATE TABLE IF NOT EXISTS google_merchant_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        merchant_id VARCHAR(255),
        feed_url VARCHAR(500),
        auto_update ENUM('yes', 'no') DEFAULT 'yes',
        last_update TIMESTAMP NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

// Insert default settings
$defaultSettings = [
    ['top_banner_text', '🌿 Special Offer: Enjoy up to 25% OFF on all eco-friendly decking, tiles, and outdoor materials! Visit Our Shop →', 'text'],
    ['top_banner_link', '/products', 'text'],
    ['top_banner_status', 'active', 'text'],
    ['whatsapp_number', '1234567890', 'text'],
    ['whatsapp_message', 'Hello, I need support with your products.', 'text']
];

foreach ($defaultSettings as $setting) {
    $key = $conn->real_escape_string($setting[0]);
    $value = $conn->real_escape_string($setting[1]);
    $type = $conn->real_escape_string($setting[2]);
    
    $sql = "INSERT IGNORE INTO settings (setting_key, setting_value, setting_type) 
            VALUES ('$key', '$value', '$type')";
    $conn->query($sql);
}

// Insert default menu items
$defaultMenuItems = [
    ['OUR PRODUCTS', 'products', '/products', null, 1],
    ['GREEN ROOF SYSTEMS', 'green-roof-systems', '/products/green-roof-systems', null, 2],
    ['PAVER PEDESTAL SYSTEMS', 'paver-pedestal-systems', '/products/paver-pedestal-systems', null, 3],
    ['SYNTHETIC SYSTEMS', 'synthetic-systems', '/products/synthetic-systems', null, 4],
    ['IPE TILE SYSTEMS', 'ipe-tile-systems', '/products/ipe-tile-systems', null, 5],
    ['CONCRETE PAVERS SYSTEM', 'concrete-pavers-system', '/products/concrete-pavers-system', null, 6],
    ['RESOURCE LIBRARY', 'resource-library', '/resources', null, 7]
];

foreach ($defaultMenuItems as $item) {
    $name = $conn->real_escape_string($item[0]);
    $slug = $conn->real_escape_string($item[1]);
    $link = $conn->real_escape_string($item[2]);
    $parentId = $item[3];
    $orderIndex = $item[4];
    
    $sql = "INSERT IGNORE INTO menu_items (name, slug, link, parent_id, order_index) 
            VALUES ('$name', '$slug', '$link', " . ($parentId ? $parentId : 'NULL') . ", $orderIndex)";
    $conn->query($sql);
}

// Insert default social media
$defaultSocial = [
    ['whatsapp', 'https://wa.me/1234567890', 'whatsapp', 'active'],
    ['instagram', 'https://instagram.com', 'instagram', 'active']
];

foreach ($defaultSocial as $social) {
    $platform = $conn->real_escape_string($social[0]);
    $url = $conn->real_escape_string($social[1]);
    $icon = $conn->real_escape_string($social[2]);
    $status = $conn->real_escape_string($social[3]);
    
    $sql = "INSERT IGNORE INTO social_media (platform, url, icon, status) 
            VALUES ('$platform', '$url', '$icon', '$status')";
    $conn->query($sql);
}

if ($success) {
    echo json_encode(['success' => true, 'message' => 'Advanced database initialized successfully']);
} else {
    echo json_encode(['success' => false, 'errors' => $errors]);
}

$conn->close();
?>

