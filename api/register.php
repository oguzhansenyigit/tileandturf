<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!tileandturf_rate_limit_allowed('customer_register', 6, 900)) {
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

    $firstName = trim($data['first_name'] ?? '');
    $lastName = trim($data['last_name'] ?? '');
    $email = trim($data['email'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $password = $data['password'] ?? '';

    if ($firstName === '' || $lastName === '' || $email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'All required fields must be filled']);
        exit();
    }

    if (!tileandturf_validate_email($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid email address']);
        exit();
    }

    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters']);
        exit();
    }

    $existing = tileandturf_db_fetch_one(
        $conn,
        'SELECT id FROM customers WHERE email = ? LIMIT 1',
        's',
        $email
    );
    if ($existing) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email already registered']);
        exit();
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $insertId = tileandturf_db_execute(
        $conn,
        'INSERT INTO customers (first_name, last_name, email, phone, password, status) VALUES (?, ?, ?, ?, ?, ?)',
        'ssssss',
        $firstName,
        $lastName,
        $email,
        $phone,
        $hashedPassword,
        'pending'
    );

    if ($insertId === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Registration failed']);
        exit();
    }

    tileandturf_rate_limit_success('customer_register');
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful. Your account is pending approval.',
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();

?>
