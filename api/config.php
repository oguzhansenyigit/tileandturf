<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

$localConfig = __DIR__ . '/config.local.php';
$legacyConfig = __DIR__ . '/config.legacy.php';

if (is_readable($localConfig)) {
    require_once $localConfig;
} elseif (is_readable($legacyConfig)) {
    require_once $legacyConfig;
}

if (!defined('DB_HOST')) {
    define('DB_HOST', defined('TILEANDTURF_DB_HOST') ? TILEANDTURF_DB_HOST : (getenv('DB_HOST') ?: 'localhost'));
}
if (!defined('DB_USER')) {
    define('DB_USER', defined('TILEANDTURF_DB_USER') ? TILEANDTURF_DB_USER : (getenv('DB_USER') ?: ''));
}
if (!defined('DB_PASS')) {
    define('DB_PASS', defined('TILEANDTURF_DB_PASS') ? TILEANDTURF_DB_PASS : (getenv('DB_PASS') ?: ''));
}
if (!defined('DB_NAME')) {
    define('DB_NAME', defined('TILEANDTURF_DB_NAME') ? TILEANDTURF_DB_NAME : (getenv('DB_NAME') ?: ''));
}

if (!defined('TILEANDTURF_MAIL_FROM')) {
    define('TILEANDTURF_MAIL_FROM', 'noreply@tileandturf.com');
}
if (!defined('TILEANDTURF_MAIL_FROM_NAME')) {
    define('TILEANDTURF_MAIL_FROM_NAME', 'Tile and Turf');
}
if (!defined('TILEANDTURF_MAIL_REPLY_TO')) {
    define('TILEANDTURF_MAIL_REPLY_TO', 'info@tileandturf.com');
}
if (!defined('TILEANDTURF_ORDER_NOTIFY_EMAILS')) {
    define('TILEANDTURF_ORDER_NOTIFY_EMAILS', 'info@tileandturf.com,anil@pedexon.com,oguzhansenyigit14@gmail.com');
}
if (!defined('TILEANDTURF_CRON_SECRET')) {
    // Change this on the server (or set env TILEANDTURF_CRON_SECRET)
    define('TILEANDTURF_CRON_SECRET', getenv('TILEANDTURF_CRON_SECRET') ?: 'tileandturf-cron-change-me');
}

require_once __DIR__ . '/security.php';
require_once __DIR__ . '/db-helpers.php';
require_once __DIR__ . '/ip-block-helpers.php';

if (!defined('TILEANDTURF_SKIP_JSON_HEADERS')) {
    header('Content-Type: application/json');
    tileandturf_send_security_headers();
    tileandturf_send_cors_headers();

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

if (DB_USER === '' || DB_NAME === '') {
    http_response_code(503);
    echo json_encode(['error' => 'Database is not configured. Create api/config.local.php from config.local.php.example']);
    exit();
}

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
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

$conn->set_charset('utf8mb4');

if (!defined('TILEANDTURF_SKIP_IP_BLOCK')) {
    tileandturf_enforce_ip_block($conn);
}

?>
