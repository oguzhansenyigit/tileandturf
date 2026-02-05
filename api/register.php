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
    
    $firstName = $conn->real_escape_string($data['first_name'] ?? '');
    $lastName = $conn->real_escape_string($data['last_name'] ?? '');
    $email = $conn->real_escape_string($data['email'] ?? '');
    $phone = $conn->real_escape_string($data['phone'] ?? '');
    $password = $data['password'] ?? '';
    
    // Validate required fields
    if (empty($firstName) || empty($lastName) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'All required fields must be filled']);
        exit();
    }
    
    // Check if email already exists
    $checkSql = "SELECT id FROM customers WHERE email = '$email'";
    $checkResult = $conn->query($checkSql);
    if ($checkResult && $checkResult->num_rows > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email already registered']);
        exit();
    }
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert new customer with pending status
    $sql = "INSERT INTO customers (first_name, last_name, email, phone, password, status) 
            VALUES ('$firstName', '$lastName', '$email', " . ($phone ? "'$phone'" : 'NULL') . ", '$hashedPassword', 'pending')";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true, 'message' => 'Registration successful. Your account is pending approval.']);
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

