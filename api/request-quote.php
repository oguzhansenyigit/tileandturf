<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        exit();
    }
    
    $name = $conn->real_escape_string($data['name'] ?? '');
    $email = $conn->real_escape_string($data['email'] ?? '');
    $phone = $conn->real_escape_string($data['phone'] ?? '');
    $company = $conn->real_escape_string($data['company'] ?? '');
    $productName = $conn->real_escape_string($data['product_name'] ?? '');
    $productId = isset($data['product_id']) ? intval($data['product_id']) : null;
    $quantity = $conn->real_escape_string($data['quantity'] ?? '');
    $message = $conn->real_escape_string($data['message'] ?? '');
    
    // Validate required fields
    if (empty($name) || empty($email) || empty($phone) || empty($productName)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Required fields are missing']);
        exit();
    }
    
    // Insert into quote_requests table (create if not exists)
    $createTableSql = "CREATE TABLE IF NOT EXISTS quote_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        company VARCHAR(255),
        product_name VARCHAR(255) NOT NULL,
        product_id INT,
        quantity VARCHAR(50),
        message TEXT,
        status ENUM('pending', 'contacted', 'completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )";
    $conn->query($createTableSql);
    
    $sql = "INSERT INTO quote_requests (name, email, phone, company, product_name, product_id, quantity, message) 
            VALUES ('$name', '$email', '$phone', " . ($company ? "'$company'" : 'NULL') . ", '$productName', " . ($productId ? $productId : 'NULL') . ", " . ($quantity ? "'$quantity'" : 'NULL') . ", " . ($message ? "'$message'" : 'NULL') . ")";
    
    if ($conn->query($sql)) {
        // Send email to info@tileandturf.com
        $to = 'info@tileandturf.com';
        $subject = 'New Quote Request: ' . $productName;
        $emailBody = "New quote request received:\n\n";
        $emailBody .= "Name: $name\n";
        $emailBody .= "Email: $email\n";
        $emailBody .= "Phone: $phone\n";
        if ($company) $emailBody .= "Company: $company\n";
        $emailBody .= "Product: $productName\n";
        if ($quantity) $emailBody .= "Quantity: $quantity\n";
        if ($message) $emailBody .= "Message: $message\n";
        
        $headers = "From: noreply@tileandturf.com\r\n";
        $headers .= "Reply-To: $email\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        
        @mail($to, $subject, $emailBody, $headers);
        
        echo json_encode(['success' => true, 'message' => 'Quote request submitted successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();
?>

