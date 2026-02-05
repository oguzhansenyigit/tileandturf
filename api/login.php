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
    
    $email = $conn->real_escape_string($data['email'] ?? '');
    $password = $data['password'] ?? '';
    
    // Validate required fields
    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email and password are required']);
        exit();
    }
    
    // Check if customer exists
    $sql = "SELECT id, first_name, last_name, email, phone, password, status FROM customers WHERE email = '$email'";
    $result = $conn->query($sql);
    
    if ($result && $result->num_rows > 0) {
        $customer = $result->fetch_assoc();
        
        // Verify password
        if (password_verify($password, $customer['password'])) {
            // Check if account is approved
            if ($customer['status'] === 'pending') {
                echo json_encode([
                    'success' => false,
                    'error' => 'Your account is pending approval. Please wait for admin approval.'
                ]);
                exit();
            }
            
            if ($customer['status'] === 'inactive') {
                echo json_encode([
                    'success' => false,
                    'error' => 'Your account has been deactivated. Please contact support.'
                ]);
                exit();
            }
            
            // Remove password from response
            unset($customer['password']);
            
            // Generate a simple token (for session management)
            $token = bin2hex(random_bytes(32));
            
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'user' => $customer,
                'token' => $token
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
        }
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();
?>

