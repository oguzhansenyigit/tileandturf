<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!tileandturf_rate_limit_allowed('customer_login', 8, 900)) {
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => 'Too many attempts. Try again later.']);
        exit();
    }

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        exit();
    }

    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if ($email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email and password are required']);
        exit();
    }

    if (!tileandturf_validate_email($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid email address']);
        exit();
    }

    $customer = tileandturf_db_fetch_one(
        $conn,
        'SELECT id, first_name, last_name, email, phone, password, status FROM customers WHERE email = ? LIMIT 1',
        's',
        $email
    );

    if (!$customer || !password_verify($password, $customer['password'])) {
        tileandturf_rate_limit_fail('customer_login', 8, 900);
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
        exit();
    }

    if ($customer['status'] === 'pending') {
        echo json_encode([
            'success' => false,
            'error' => 'Your account is pending approval. Please wait for admin approval.',
        ]);
        exit();
    }

    if ($customer['status'] === 'inactive') {
        echo json_encode([
            'success' => false,
            'error' => 'Your account has been deactivated. Please contact support.',
        ]);
        exit();
    }

    tileandturf_rate_limit_success('customer_login');
    unset($customer['password']);

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => $customer,
        'token' => bin2hex(random_bytes(32)),
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();

?>
