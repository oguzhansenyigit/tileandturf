-- Brazilian Wood E-Commerce Database
-- Database: u632602124_tile1

-- ============================================
-- TEMEL TABLOLAR
-- ============================================

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(500),
    category_id INT,
    stock INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    datasheet_pdf VARCHAR(500) NULL,
    brochure_pdf VARCHAR(500) NULL,
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    meta_keywords VARCHAR(500) NULL,
    catalog_mode ENUM('yes', 'no') DEFAULT 'no',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
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
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Google Merchant Products Table
CREATE TABLE IF NOT EXISTS google_merchant_products (
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
    `condition` VARCHAR(50) DEFAULT 'new',
    google_product_category VARCHAR(255),
    product_type VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================
-- GELİŞMİŞ TABLOLAR (ADMIN PANEL)
-- ============================================

-- Statistics Table
CREATE TABLE IF NOT EXISTS statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    page_views INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    orders_count INT DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Product Views Tracking
CREATE TABLE IF NOT EXISTS product_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    view_date DATE NOT NULL,
    view_count INT DEFAULT 1,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_date (product_id, view_date)
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sliders Table
CREATE TABLE IF NOT EXISTS sliders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image VARCHAR(500) NOT NULL,
    button_text VARCHAR(100),
    button_link VARCHAR(500),
    order_index INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    image_position_x VARCHAR(50) DEFAULT 'center',
    image_position_y VARCHAR(50) DEFAULT 'center',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    password VARCHAR(255),
    status ENUM('active', 'pending', 'inactive') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
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
);

-- Social Media Links
CREATE TABLE IF NOT EXISTS social_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    platform VARCHAR(50) NOT NULL UNIQUE,
    url VARCHAR(500) NOT NULL,
    icon VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Google Merchant Settings
CREATE TABLE IF NOT EXISTS google_merchant_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id VARCHAR(255),
    feed_url VARCHAR(500),
    auto_update ENUM('yes', 'no') DEFAULT 'yes',
    last_update TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Product Variations Table
CREATE TABLE IF NOT EXISTS product_variations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'select',
    options TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- DEFAULT VERİLER
-- ============================================

-- Default Settings
INSERT IGNORE INTO settings (setting_key, setting_value, setting_type) VALUES
('top_banner_text', '🌿 Special Offer: Enjoy up to 25% OFF on all eco-friendly decking, tiles, and outdoor materials! Visit Our Shop →', 'text'),
('top_banner_link', '/products', 'text'),
('top_banner_status', 'active', 'text'),
('whatsapp_number', '1234567890', 'text'),
('whatsapp_message', 'Hello, I need support with your products.', 'text');

-- Default Menu Items
INSERT IGNORE INTO menu_items (name, slug, link, parent_id, order_index, status) VALUES
('OUR PRODUCTS', 'our-products', '/products', NULL, 0, 'active'),
('GREEN ROOF SYSTEMS', 'green-roof-systems', '/products/green-roof-systems', NULL, 2, 'active'),
('PAVER PEDESTAL SYSTEMS', 'paver-pedestal-systems', '/products/paver-pedestal-systems', NULL, 3, 'active'),
('SYNTHETIC SYSTEMS', 'synthetic-systems', '/products/synthetic-systems', NULL, 4, 'active'),
('IPE TILE SYSTEMS', 'ipe-tile-systems', '/products/ipe-tile-systems', NULL, 5, 'active'),
('CONCRETE PAVERS SYSTEM', 'concrete-pavers-system', '/products/concrete-pavers-system', NULL, 6, 'active'),
('RESOURCE LIBRARY', 'resource-library', '/resources', NULL, 7, 'active');

-- Default Social Media
INSERT IGNORE INTO social_media (platform, url, icon, status) VALUES
('whatsapp', 'https://wa.me/1234567890', 'whatsapp', 'active'),
('instagram', 'https://instagram.com', 'instagram', 'active');

