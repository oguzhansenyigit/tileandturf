<?php
/**
 * Cron: send abandoned-cart reminder emails (~90 minutes after last cart save).
 *
 * Hosting crontab example (every 15 min):
 *   */15 * * * * curl -fsS "https://tileandturf.com/api/cron/abandoned-carts.php?key=YOUR_SECRET"
 *
 * Or CLI:
 *   php api/cron/abandoned-carts.php YOUR_SECRET
 *
 * Set TILEANDTURF_CRON_SECRET in config / env (default below if unset).
 */
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/analytics-helpers.php';

header('Content-Type: application/json');

$provided = '';
if (PHP_SAPI === 'cli') {
    $provided = (string)($argv[1] ?? '');
} else {
    $provided = (string)($_GET['key'] ?? $_SERVER['HTTP_X_CRON_KEY'] ?? '');
}

$secret = defined('TILEANDTURF_CRON_SECRET') && TILEANDTURF_CRON_SECRET !== ''
    ? TILEANDTURF_CRON_SECRET
    : (getenv('TILEANDTURF_CRON_SECRET') ?: 'tileandturf-cron-change-me');

if ($provided === '' || !hash_equals($secret, $provided)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Forbidden']);
    exit();
}

tileandturf_analytics_ensure_tables($conn);

$origin = 'https://tileandturf.com';
$phone = '+1 (516) 774-1808';
$delayMinutes = 90;
$limit = 40;
$sent = 0;
$skipped = 0;
$errors = 0;

$rows = @$conn->query(
    "SELECT id, session_id, email, cart_json, cart_total, source, updated_at
     FROM abandoned_carts
     WHERE recovered_at IS NULL
       AND (emailed_at IS NULL OR email_count = 0)
       AND updated_at <= DATE_SUB(NOW(), INTERVAL $delayMinutes MINUTE)
       AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     ORDER BY updated_at ASC
     LIMIT $limit"
);

if (!$rows) {
    echo json_encode(['success' => true, 'sent' => 0, 'message' => 'No candidates or query failed']);
    $conn->close();
    exit();
}

while ($row = $rows->fetch_assoc()) {
    $sessionId = $row['session_id'];
    $email = $row['email'];
    $id = intval($row['id']);

    // Skip if this session already purchased
    $sidEsc = $conn->real_escape_string($sessionId);
    $purchased = @$conn->query(
        "SELECT id FROM funnel_events
         WHERE session_id = '$sidEsc' AND event_type = 'purchase'
         LIMIT 1"
    );
    if ($purchased && $purchased->num_rows > 0) {
        @$conn->query("UPDATE abandoned_carts SET recovered_at = NOW() WHERE id = $id");
        $skipped++;
        continue;
    }

    // Also skip if same email placed an order after cart was saved
    $emailEsc = $conn->real_escape_string($email);
    $updatedEsc = $conn->real_escape_string($row['updated_at']);
    $recentOrder = @$conn->query(
        "SELECT id FROM orders
         WHERE LOWER(email) = '$emailEsc'
           AND created_at >= '$updatedEsc'
           AND status != 'cancelled'
         LIMIT 1"
    );
    if ($recentOrder && $recentOrder->num_rows > 0) {
        @$conn->query("UPDATE abandoned_carts SET recovered_at = NOW() WHERE id = $id");
        $skipped++;
        continue;
    }

    $items = json_decode($row['cart_json'], true);
    if (!is_array($items) || count($items) === 0) {
        $skipped++;
        continue;
    }

    $itemsHtml = '';
    foreach ($items as $item) {
        $name = htmlspecialchars((string)($item['name'] ?? 'Product'), ENT_QUOTES, 'UTF-8');
        $qty = intval($item['quantity'] ?? 1);
        $sub = number_format(floatval($item['subtotal'] ?? 0), 2);
        $extra = '';
        if (!empty($item['sqft'])) {
            $extra = ' · ' . htmlspecialchars((string)$item['sqft']) . ' sqft';
        } elseif (!empty($item['selected_size'])) {
            $extra = ' · ' . htmlspecialchars((string)$item['selected_size']);
        }
        $itemsHtml .= '<tr>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;">' . $name . $extra . '</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;">' . $qty . '</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">$' . $sub . '</td>
          </tr>';
    }

    $cartTotal = number_format(floatval($row['cart_total']), 2);
    $checkoutUrl = $origin . '/checkout';
    $cartUrl = $origin . '/cart';

    $subject = 'Your Tile and Turf cart is waiting — shipping quote by phone';
    $body = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f3f4f6;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;">
    <div style="background:#1a5f2a;padding:20px;text-align:center;">
      <img src="' . $origin . '/logo.svg" alt="Tile and Turf" style="height:40px;max-width:200px;" />
    </div>
    <div style="padding:28px 24px;">
      <h1 style="margin:0 0 12px;font-size:22px;color:#111;">Still thinking it over?</h1>
      <p style="color:#374151;line-height:1.55;margin:0 0 16px;">
        You left items in your cart. Shipping for materials like pavers and turf is quoted by phone
        so we can give you an accurate freight cost — call us and we will finish the order with you.
      </p>
      <p style="margin:0 0 20px;">
        <a href="tel:+15167741808" style="display:inline-block;background:#1a5f2a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold;">
          Call ' . htmlspecialchars($phone, ENT_QUOTES, 'UTF-8') . '
        </a>
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px;text-align:left;">Item</th>
            <th style="padding:10px;text-align:center;">Qty</th>
            <th style="padding:10px;text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>' . $itemsHtml . '</tbody>
      </table>
      <p style="text-align:right;font-size:16px;font-weight:bold;margin:0 0 20px;">
        Subtotal: $' . $cartTotal . '
      </p>
      <p style="margin:0 0 8px;">
        <a href="' . htmlspecialchars($checkoutUrl, ENT_QUOTES, 'UTF-8') . '" style="color:#1a5f2a;font-weight:bold;">
          Return to checkout
        </a>
        &nbsp;·&nbsp;
        <a href="' . htmlspecialchars($cartUrl, ENT_QUOTES, 'UTF-8') . '" style="color:#1a5f2a;">
          View cart
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px;margin:24px 0 0;line-height:1.5;">
        Questions? Email <a href="mailto:info@tileandturf.com">info@tileandturf.com</a>
        or call ' . htmlspecialchars($phone, ENT_QUOTES, 'UTF-8') . '.
        If you already ordered or prefer not to get cart reminders, you can ignore this message.
      </p>
    </div>
  </div>
</body></html>';

    $headers = tileandturf_mail_from_header(true);
    $headers .= 'Reply-To: ' . tileandturf_mail_reply_to() . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

    if (@mail($email, $subject, $body, $headers)) {
        @$conn->query(
            "UPDATE abandoned_carts
             SET emailed_at = NOW(), email_count = email_count + 1
             WHERE id = $id"
        );
        $sent++;
    } else {
        $errors++;
    }
}

echo json_encode([
    'success' => true,
    'sent' => $sent,
    'skipped' => $skipped,
    'errors' => $errors,
    'delay_minutes' => $delayMinutes,
]);
$conn->close();
