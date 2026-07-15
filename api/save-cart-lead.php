<?php
/**
 * Save cart lead for abandoned-cart reminders.
 * POST: { session_id, email, items[], source?: 'cart'|'checkout' }
 */
require_once 'config.php';
require_once __DIR__ . '/analytics-helpers.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

if (!tileandturf_rate_limit_allowed('save_cart_lead', 30, 600)) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Too many requests']);
    exit();
}

tileandturf_analytics_ensure_tables($conn);

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit();
}

$sessionId = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string)($data['session_id'] ?? ''));
$sessionId = substr($sessionId, 0, 64);
$email = strtolower(trim((string)($data['email'] ?? '')));
$source = trim((string)($data['source'] ?? 'cart'));
if (!in_array($source, ['cart', 'checkout'], true)) {
    $source = 'cart';
}

if ($sessionId === '' || !tileandturf_validate_email($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Valid session_id and email required']);
    exit();
}

$rawItems = $data['items'] ?? [];
if (!is_array($rawItems) || count($rawItems) === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Cart items required']);
    exit();
}

$snapshot = [];
$total = 0.0;
foreach (array_slice($rawItems, 0, 40) as $item) {
    if (!is_array($item)) {
        continue;
    }
    $id = intval($item['id'] ?? $item['product_id'] ?? 0);
    $name = substr(trim((string)($item['name'] ?? 'Product')), 0, 200);
    $qty = max(1, intval($item['quantity'] ?? 1));
    $price = floatval($item['price'] ?? $item['product_price'] ?? 0);
    $line = floatval($item['subtotal'] ?? ($price * $qty));
    if (!empty($item['sqft'])) {
        $line = floatval($item['totalPrice'] ?? $item['subtotal'] ?? ($price * floatval($item['sqft'])));
    }
    $total += $line;
    $snapshot[] = [
        'id' => $id,
        'name' => $name,
        'quantity' => $qty,
        'price' => round($price, 2),
        'subtotal' => round($line, 2),
        'sqft' => isset($item['sqft']) ? floatval($item['sqft']) : null,
        'selected_size' => isset($item['selected_size']) ? substr((string)$item['selected_size'], 0, 64) : null,
        'image' => isset($item['image']) ? substr((string)$item['image'], 0, 500) : null,
    ];
}

if (count($snapshot) === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No valid cart items']);
    exit();
}

$cartJson = json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($cartJson === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Could not encode cart']);
    exit();
}

$emailEsc = $conn->real_escape_string($email);
$sessionEsc = $conn->real_escape_string($sessionId);
$jsonEsc = $conn->real_escape_string($cartJson);
$sourceEsc = $conn->real_escape_string($source);
$totalSql = number_format($total, 2, '.', '');

// Upsert: refresh cart, reopen reminder window if previously recovered or emailed long ago
$ok = @$conn->query(
    "INSERT INTO abandoned_carts (session_id, email, cart_json, cart_total, source, updated_at)
     VALUES ('$sessionEsc', '$emailEsc', '$jsonEsc', $totalSql, '$sourceEsc', NOW())
     ON DUPLICATE KEY UPDATE
       cart_json = VALUES(cart_json),
       cart_total = VALUES(cart_total),
       source = VALUES(source),
       session_id = VALUES(session_id),
       updated_at = NOW(),
       recovered_at = NULL,
       emailed_at = IF(
         emailed_at IS NOT NULL AND emailed_at > DATE_SUB(NOW(), INTERVAL 7 DAY),
         emailed_at,
         NULL
       )"
);

if (!$ok) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not save cart']);
    $conn->close();
    exit();
}

echo json_encode(['success' => true]);
$conn->close();
