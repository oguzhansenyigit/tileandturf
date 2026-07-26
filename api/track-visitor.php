<?php
require_once 'config.php';
require_once __DIR__ . '/analytics-helpers.php';
require_once __DIR__ . '/attribution-helpers.php';

header('Content-Type: application/json');

tileandturf_analytics_ensure_tables($conn);
tileandturf_attribution_ensure_tables($conn);

$ip = tileandturf_client_ip();
$ua = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500);
$device = tileandturf_device_from_ua($ua);

function tileandturf_sql_null_or_str($conn, $v) {
    if ($v === null || $v === '') {
        return 'NULL';
    }
    return "'" . $conn->real_escape_string((string) $v) . "'";
}

function tileandturf_live_payload($conn) {
    if (function_exists('tileandturf_attribution_ensure_tables')) {
        tileandturf_attribution_ensure_tables($conn);
    }

    $countRes = $conn->query(
        "SELECT COUNT(*) AS count FROM active_visitors WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)"
    );
    $count = $countRes ? intval($countRes->fetch_assoc()['count']) : 0;

    $live = [];
    $liveRes = @$conn->query(
        "SELECT av.session_id, av.path, av.product_id, av.country, av.region_code, av.city, av.last_activity,
                av.ip_address,
                p.name AS product_name,
                va.channel AS traffic_channel,
                va.utm_medium,
                va.utm_source,
                va.utm_campaign
         FROM active_visitors av
         LEFT JOIN products p ON p.id = av.product_id
         LEFT JOIN visitor_attribution va ON BINARY va.session_id = BINARY av.session_id
         WHERE av.last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
         ORDER BY av.last_activity DESC
         LIMIT 40"
    );
    if ($liveRes) {
        while ($row = $liveRes->fetch_assoc()) {
            // Never expose raw IPs on the public live endpoint.
            unset($row['ip_address']);
            $live[] = $row;
        }
    }

    $liveProducts = [];
    $lp = @$conn->query(
        "SELECT av.product_id, p.name, p.image, COUNT(*) AS viewers
         FROM active_visitors av
         LEFT JOIN products p ON p.id = av.product_id
         WHERE av.last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
           AND av.product_id IS NOT NULL
         GROUP BY av.product_id, p.name, p.image
         ORDER BY viewers DESC
         LIMIT 30"
    );
    if ($lp) {
        while ($row = $lp->fetch_assoc()) {
            $liveProducts[] = [
                'product_id' => intval($row['product_id']),
                'name' => $row['name'] ?: ('Product #' . $row['product_id']),
                'image' => $row['image'],
                'viewers' => intval($row['viewers']),
            ];
        }
    }

    // Live behavior: active sessions matched to recent funnel stages (last 24h events)
    $onProduct = 0;
    $op = @$conn->query(
        "SELECT COUNT(*) AS c FROM active_visitors
         WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
           AND product_id IS NOT NULL"
    );
    if ($op) {
        $onProduct = intval($op->fetch_assoc()['c']);
    }

    $onCheckout = 0;
    $oc = @$conn->query(
        "SELECT COUNT(*) AS c FROM active_visitors
         WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
           AND path LIKE '/checkout%'"
    );
    if ($oc) {
        $onCheckout = intval($oc->fetch_assoc()['c']);
    }

    $inCartNotCheckout = 0;
    $ic = @$conn->query(
        "SELECT COUNT(DISTINCT av.session_id) AS c
         FROM active_visitors av
         WHERE av.last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
           AND EXISTS (
             SELECT 1 FROM funnel_events fe
             WHERE BINARY fe.session_id = BINARY av.session_id
               AND BINARY fe.event_type = BINARY 'add_to_cart'
               AND fe.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
           )
           AND NOT EXISTS (
             SELECT 1 FROM funnel_events fe
             WHERE BINARY fe.session_id = BINARY av.session_id
               AND (
                 BINARY fe.event_type = BINARY 'begin_checkout'
                 OR BINARY fe.event_type = BINARY 'purchase'
               )
               AND fe.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
           )
           AND (av.path IS NULL OR av.path NOT LIKE '/checkout%')"
    );
    if ($ic) {
        $inCartNotCheckout = intval($ic->fetch_assoc()['c']);
    }

    $checkoutNoPurchase = 0;
    $cnp = @$conn->query(
        "SELECT COUNT(DISTINCT av.session_id) AS c
         FROM active_visitors av
         WHERE av.last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
           AND (
             av.path LIKE '/checkout%'
             OR EXISTS (
               SELECT 1 FROM funnel_events fe
               WHERE BINARY fe.session_id = BINARY av.session_id
                 AND BINARY fe.event_type = BINARY 'begin_checkout'
                 AND fe.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
             )
           )
           AND NOT EXISTS (
             SELECT 1 FROM funnel_events fe
             WHERE BINARY fe.session_id = BINARY av.session_id
               AND BINARY fe.event_type = BINARY 'purchase'
               AND fe.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
           )"
    );
    if ($cnp) {
        $checkoutNoPurchase = intval($cnp->fetch_assoc()['c']);
    }

    return [
        'success' => true,
        'active_visitors' => $count,
        'live' => $live,
        'live_by_state' => tileandturf_live_by_state($conn),
        'live_products' => $liveProducts,
        'live_behavior' => [
            'on_product' => $onProduct,
            'in_cart_not_checkout' => $inCartNotCheckout,
            'on_checkout' => $onCheckout,
            'checkout_no_purchase' => $checkoutNoPurchase,
        ],
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        $data = [];
    }

    $sessionId = trim((string)($data['session_id'] ?? ''));
    if ($sessionId === '' || strlen($sessionId) > 64) {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            @session_start();
        }
        $sessionId = session_id() ?: ('v_' . bin2hex(random_bytes(8)));
    }
    $sessionId = preg_replace('/[^a-zA-Z0-9_\-]/', '', $sessionId);
    $sessionId = substr($sessionId, 0, 64);

    $path = substr(trim((string)($data['path'] ?? '/')), 0, 500);
    $referrer = substr(trim((string)($data['referrer'] ?? '')), 0, 500);
    $productId = isset($data['product_id']) ? intval($data['product_id']) : 0;
    if ($productId <= 0) {
        $productId = null;
    }
    $isHeartbeat = !empty($data['heartbeat']);

    $isAdmin = strpos($path, '/admin') === 0;

    // First-touch attribution (paid vs organic). Ignore heartbeats / admin.
    if (!$isHeartbeat && !$isAdmin) {
        $attrIn = is_array($data['attribution'] ?? null) ? $data['attribution'] : [];
        if (empty($attrIn['referrer']) && $referrer !== '') {
            $attrIn['referrer'] = $referrer;
        }
        if (empty($attrIn['landing_path'])) {
            $attrIn['landing_path'] = $path;
        }
        tileandturf_attribution_save_first_touch($conn, $sessionId, $attrIn);
    }

    $geo = tileandturf_geo_lookup($conn, $ip);
    $country = $geo['country'];
    $region = $geo['region'];
    $regionCode = $geo['region_code'];
    $city = $geo['city'];
    if (($country === 'US' || $country === 'USA') && ($regionCode || $region)) {
        $normalized = tileandturf_normalize_us_state($regionCode, $region);
        if ($normalized !== '') {
            $regionCode = $normalized;
        }
    }

    $esc = function ($v) use ($conn) {
        return "'" . $conn->real_escape_string((string) ($v ?? '')) . "'";
    };

    $pidSql = $productId === null ? 'NULL' : (string) intval($productId);

    $conn->query(
        'INSERT INTO active_visitors (session_id, ip_address, user_agent, path, product_id, country, region_code, city, last_activity) VALUES (' .
        $esc($sessionId) . ',' . $esc($ip) . ',' . $esc($ua) . ',' . $esc($path) . ',' . $pidSql . ',' .
        tileandturf_sql_null_or_str($conn, $country) . ',' .
        tileandturf_sql_null_or_str($conn, $regionCode) . ',' .
        tileandturf_sql_null_or_str($conn, $city) . ', NOW())
         ON DUPLICATE KEY UPDATE
           ip_address = VALUES(ip_address),
           user_agent = VALUES(user_agent),
           path = VALUES(path),
           product_id = VALUES(product_id),
           country = VALUES(country),
           region_code = VALUES(region_code),
           city = VALUES(city),
           last_activity = NOW()'
    );

    @$conn->query("DELETE FROM active_visitors WHERE last_activity < DATE_SUB(NOW(), INTERVAL 5 MINUTE)");

    // Heartbeats only refresh presence — do not inflate page_hits / funnel proxies
    if (!$isHeartbeat && !$isAdmin && $device !== 'bot') {
        $conn->query(
            'INSERT INTO page_hits (session_id, ip_address, path, referrer, product_id, country, region, region_code, city, device) VALUES (' .
            $esc($sessionId) . ',' .
            $esc($ip) . ',' .
            $esc($path) . ',' .
            $esc($referrer) . ',' .
            $pidSql . ',' .
            tileandturf_sql_null_or_str($conn, $country) . ',' .
            tileandturf_sql_null_or_str($conn, $region) . ',' .
            tileandturf_sql_null_or_str($conn, $regionCode) . ',' .
            tileandturf_sql_null_or_str($conn, $city) . ',' .
            $esc($device) . ')'
        );

        $date = date('Y-m-d');
        @$conn->query(
            "INSERT INTO statistics (date, page_views, unique_visitors) VALUES ('$date', 1, 0)
             ON DUPLICATE KEY UPDATE page_views = page_views + 1"
        );

        $ipEsc = $conn->real_escape_string($ip);
        $seen = @$conn->query(
            "SELECT COUNT(*) AS c FROM page_hits WHERE ip_address = '$ipEsc' AND DATE(created_at) = '$date'"
        );
        $seenRow = $seen ? $seen->fetch_assoc() : null;
        if ($seenRow && intval($seenRow['c']) === 1) {
            @$conn->query(
                "UPDATE statistics SET unique_visitors = unique_visitors + 1 WHERE date = '$date'"
            );
        }

        if ($productId) {
            @$conn->query(
                "INSERT INTO product_views (product_id, view_date, view_count)
                 VALUES (" . intval($productId) . ", '$date', 1)
                 ON DUPLICATE KEY UPDATE view_count = view_count + 1"
            );
            tileandturf_funnel_record($conn, $sessionId, 'view_product', $productId, null, $ip);
        }
    }

    echo json_encode([
        'success' => true,
        'session_id' => $sessionId,
        'geo' => [
            'country' => $country,
            'region' => $region,
            'region_code' => $regionCode,
            'city' => $city,
        ],
    ]);
    $conn->close();
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(tileandturf_live_payload($conn));
    $conn->close();
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
$conn->close();
