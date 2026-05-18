<?php
/**
 * Shared security helpers (sessions, CORS, admin auth, uploads, rate limits).
 */

function tileandturf_allowed_origins() {
    $raw = defined('TILEANDTURF_ALLOWED_ORIGINS') ? TILEANDTURF_ALLOWED_ORIGINS : '';
    if ($raw === '') {
        return [
            'https://tileandturf.com',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ];
    }
    return array_values(array_filter(array_map('trim', explode(',', $raw))));
}

function tileandturf_send_cors_headers() {
    if (defined('TILEANDTURF_SKIP_JSON_HEADERS')) {
        return;
    }

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = tileandturf_allowed_origins();

    if ($origin !== '' && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    } elseif ($origin === '') {
        // Same-origin requests often omit Origin.
        header('Access-Control-Allow-Credentials: true');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

function tileandturf_send_security_headers() {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');

    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
    if ($secure) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
}

function tileandturf_validate_email($email) {
    return is_string($email) && filter_var($email, FILTER_VALIDATE_EMAIL);
}

function tileandturf_admin_configured() {
    return (defined('TILEANDTURF_ADMIN_PASSWORD_HASH') && TILEANDTURF_ADMIN_PASSWORD_HASH !== '')
        || (defined('TILEANDTURF_ADMIN_PASSWORD') && TILEANDTURF_ADMIN_PASSWORD !== '');
}

function tileandturf_init_session() {
    if (session_status() !== PHP_SESSION_NONE) {
        return;
    }

    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    session_name('tileandturf_admin');
    session_start();
}

function tileandturf_verify_admin_password($password) {
    if (!is_string($password) || $password === '') {
        return false;
    }

    if (defined('TILEANDTURF_ADMIN_PASSWORD_HASH') && TILEANDTURF_ADMIN_PASSWORD_HASH !== '') {
        return password_verify($password, TILEANDTURF_ADMIN_PASSWORD_HASH);
    }

    if (defined('TILEANDTURF_ADMIN_PASSWORD') && TILEANDTURF_ADMIN_PASSWORD !== '') {
        return hash_equals(TILEANDTURF_ADMIN_PASSWORD, $password);
    }

    return false;
}

function tileandturf_admin_session_valid() {
    tileandturf_init_session();
    if (empty($_SESSION['admin_authenticated'])) {
        return false;
    }

    $loginAt = intval($_SESSION['admin_login_at'] ?? 0);
    $maxAge = defined('TILEANDTURF_ADMIN_SESSION_TTL') ? intval(TILEANDTURF_ADMIN_SESSION_TTL) : 28800;
    if ($loginAt > 0 && (time() - $loginAt) > $maxAge) {
        $_SESSION = [];
        session_destroy();
        return false;
    }

    return true;
}

function tileandturf_admin_login($password) {
    if (!tileandturf_verify_admin_password($password)) {
        return false;
    }

    tileandturf_init_session();
    session_regenerate_id(true);
    $_SESSION['admin_authenticated'] = true;
    $_SESSION['admin_login_at'] = time();
    return true;
}

function tileandturf_admin_logout() {
    tileandturf_init_session();
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

function tileandturf_require_admin() {
    if (!tileandturf_admin_session_valid()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit();
    }
}

/** Public site may read via GET; mutations still require admin session. */
function tileandturf_require_admin_for_write() {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'], true)) {
        tileandturf_require_admin();
    }
}

function tileandturf_public_settings_keys() {
    return [
        'top_banner_text',
        'top_banner_link',
        'top_banner_status',
        'product_detail_promo_content',
        'product_detail_promo_status',
    ];
}

function tileandturf_client_ip() {
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($parts[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function tileandturf_rate_limit_file($action, $ip) {
    $dir = sys_get_temp_dir() . '/tileandturf_rate';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $safeAction = preg_replace('/[^a-z0-9_\-]/i', '', $action);
    return $dir . '/' . $safeAction . '_' . md5($ip) . '.json';
}

function tileandturf_rate_limit_allowed($action, $maxAttempts = 5, $lockSeconds = 900) {
    $ip = tileandturf_client_ip();
    $file = tileandturf_rate_limit_file($action, $ip);
    if (!file_exists($file)) {
        return true;
    }

    $data = json_decode(file_get_contents($file), true);
    if (!is_array($data)) {
        return true;
    }

    if (!empty($data['locked_until']) && time() < intval($data['locked_until'])) {
        return false;
    }

    return true;
}

function tileandturf_rate_limit_fail($action, $maxAttempts = 5, $lockSeconds = 900) {
    $ip = tileandturf_client_ip();
    $file = tileandturf_rate_limit_file($action, $ip);
    $data = ['attempts' => 0, 'locked_until' => 0];

    if (file_exists($file)) {
        $decoded = json_decode(file_get_contents($file), true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }

    if (!empty($data['locked_until']) && time() < intval($data['locked_until'])) {
        return;
    }

    $data['attempts'] = intval($data['attempts'] ?? 0) + 1;
    if ($data['attempts'] >= $maxAttempts) {
        $data['locked_until'] = time() + $lockSeconds;
        $data['attempts'] = 0;
    }

    file_put_contents($file, json_encode($data), LOCK_EX);
}

function tileandturf_rate_limit_success($action) {
    $ip = tileandturf_client_ip();
    $file = tileandturf_rate_limit_file($action, $ip);
    if (file_exists($file)) {
        @unlink($file);
    }
}

function tileandturf_login_rate_allowed() {
    return tileandturf_rate_limit_allowed('admin_login', 5, 900);
}

function tileandturf_login_rate_fail() {
    tileandturf_rate_limit_fail('admin_login', 5, 900);
}

function tileandturf_login_rate_success() {
    tileandturf_rate_limit_success('admin_login');
}

function tileandturf_order_confirmation_secret() {
    if (defined('TILEANDTURF_ORDER_CONFIRM_SECRET') && TILEANDTURF_ORDER_CONFIRM_SECRET !== '') {
        return TILEANDTURF_ORDER_CONFIRM_SECRET;
    }
    if (defined('TILEANDTURF_ADMIN_PASSWORD') && TILEANDTURF_ADMIN_PASSWORD !== '') {
        return TILEANDTURF_ADMIN_PASSWORD;
    }
    if (defined('DB_PASS') && DB_PASS !== '') {
        return DB_PASS;
    }
    return 'tileandturf-order-confirm';
}

function tileandturf_order_confirmation_token($orderId, $orderNumber) {
    $payload = intval($orderId) . '|' . (string) $orderNumber;
    return hash_hmac('sha256', $payload, tileandturf_order_confirmation_secret());
}

function tileandturf_order_confirmation_token_valid($orderId, $orderNumber, $token) {
    if (!is_string($token) || $token === '' || strlen($token) > 128) {
        return false;
    }
    return hash_equals(
        tileandturf_order_confirmation_token($orderId, $orderNumber),
        $token
    );
}

function tileandturf_validate_uploaded_file($file, $allowedMimeTypes, $allowedExtensions, $maxBytes) {
    if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
        return ['ok' => false, 'error' => 'Upload failed'];
    }

    if ($file['size'] > $maxBytes) {
        return ['ok' => false, 'error' => 'File size exceeds limit'];
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExtensions, true)) {
        return ['ok' => false, 'error' => 'Invalid file extension'];
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $detected = $finfo ? finfo_file($finfo, $file['tmp_name']) : ($file['type'] ?? '');
    if ($finfo) {
        finfo_close($finfo);
    }

    if (!in_array($detected, $allowedMimeTypes, true)) {
        return ['ok' => false, 'error' => 'Invalid file type'];
    }

    return ['ok' => true, 'extension' => $ext, 'mime' => $detected];
}

?>
