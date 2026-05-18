<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!tileandturf_rate_limit_allowed('quote_request', 10, 600)) {
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => 'Too many requests. Try again later.']);
        exit();
    }
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        exit();
    }
    
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $company = trim($data['company'] ?? '');
    $productName = trim($data['product_name'] ?? '');
    $productId = isset($data['product_id']) ? intval($data['product_id']) : 0;
    $quantity = trim($data['quantity'] ?? '');
    $message = trim($data['message'] ?? '');
    
    if (empty($name) || empty($email) || empty($phone) || empty($productName)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Required fields are missing']);
        exit();
    }

    if (!tileandturf_validate_email($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid email address']);
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
    
    $companyVal = $company !== '' ? $company : '';
    $quantityVal = $quantity !== '' ? $quantity : '';
    $messageVal = $message !== '' ? $message : '';

    if ($productId > 0) {
        $insertOk = tileandturf_db_execute(
            $conn,
            'INSERT INTO quote_requests (name, email, phone, company, product_name, product_id, quantity, message)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            'sssssis',
            $name,
            $email,
            $phone,
            $companyVal,
            $productName,
            $productId,
            $quantityVal,
            $messageVal
        );
    } else {
        $insertOk = tileandturf_db_execute(
            $conn,
            'INSERT INTO quote_requests (name, email, phone, company, product_name, quantity, message)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            'sssssss',
            $name,
            $email,
            $phone,
            $companyVal,
            $productName,
            $quantityVal,
            $messageVal
        );
    }

    if ($insertOk !== false) {
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
        
        $headers = "From: noreply@tileandturf.oguzhansenyigit.com\r\n";
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

