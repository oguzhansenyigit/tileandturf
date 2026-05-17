<?php
// Error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Sitemap, robots.txt, etc. define TILEANDTURF_SKIP_JSON_HEADERS before including this file.
if (!defined('TILEANDTURF_SKIP_JSON_HEADERS')) {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'u753039087_newweb');
define('DB_PASS', '11241124Oguzhan.');
define('DB_NAME', 'u753039087_newweb1');

// Fail fast instead of hanging until nginx returns 504
ini_set('mysqli.connect_timeout', '5');
ini_set('default_socket_timeout', '5');

$conn = mysqli_init();
if ($conn === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Database init failed']);
    exit();
}
$conn->options(MYSQLI_OPT_CONNECT_TIMEOUT, 5);

if (!$conn->real_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME)) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . mysqli_connect_error()]);
    exit();
}

$conn->set_charset('utf8');

