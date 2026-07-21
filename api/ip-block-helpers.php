<?php
/**
 * Visitor IP block list + enforcement.
 */

function tileandturf_ensure_blocked_ips_table($conn) {
    static $done = false;
    if ($done || !($conn instanceof mysqli)) {
        return;
    }
    $done = true;

    @$conn->query(
        "CREATE TABLE IF NOT EXISTS blocked_ips (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            ip_address VARCHAR(45) NOT NULL,
            city VARCHAR(100) NULL,
            region VARCHAR(100) NULL,
            country VARCHAR(8) NULL,
            reason VARCHAR(255) NULL,
            blocked_by VARCHAR(100) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_blocked_ip (ip_address),
            KEY idx_blocked_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function tileandturf_normalize_ip($ip) {
    $ip = trim((string) $ip);
    if ($ip === '' || !filter_var($ip, FILTER_VALIDATE_IP)) {
        return '';
    }
    return $ip;
}

function tileandturf_ip_is_blocked($conn, $ip) {
    $ip = tileandturf_normalize_ip($ip);
    if ($ip === '' || !($conn instanceof mysqli)) {
        return false;
    }
    tileandturf_ensure_blocked_ips_table($conn);
    $row = tileandturf_db_fetch_one(
        $conn,
        'SELECT id FROM blocked_ips WHERE ip_address = ? LIMIT 1',
        's',
        $ip
    );
    return !empty($row);
}

function tileandturf_ip_block_path_is_exempt() {
    $script = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? ''));
    $uriPath = parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH) ?: '';

    // Always allow the admin SPA shell so a blocked IP can still open /admin and unblock.
    if (preg_match('#^/admin(?:/|$)#', $uriPath)) {
        return true;
    }

    // Admin login/session must stay reachable so a mistaken self-block can be fixed.
    if (preg_match('#/api/admin/(login|session)\.php$#', $script)) {
        return true;
    }
    // Authenticated admin tools may manage the block list.
    if (strpos($script, '/api/admin/') !== false && function_exists('tileandturf_admin_session_valid')
        && tileandturf_admin_session_valid()) {
        return true;
    }
    return false;
}

function tileandturf_enforce_ip_block($conn) {
    if (!($conn instanceof mysqli) || tileandturf_ip_block_path_is_exempt()) {
        return;
    }

    $ip = tileandturf_client_ip();
    if (!tileandturf_ip_is_blocked($conn, $ip)) {
        return;
    }

    http_response_code(403);
    $isHtmlShell = basename((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === 'index.php';
    if ($isHtmlShell || defined('TILEANDTURF_SKIP_JSON_HEADERS')) {
        header('Content-Type: text/html; charset=UTF-8');
        echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
        echo '<title>Access denied</title>';
        echo '<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#111;line-height:1.5}</style>';
        echo '</head><body><h1>Access denied</h1><p>Your access to this website has been restricted.</p></body></html>';
        exit();
    }

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'error' => 'Access denied']);
    exit();
}

function tileandturf_block_ip($conn, $ip, $meta = []) {
    $ip = tileandturf_normalize_ip($ip);
    if ($ip === '') {
        return ['success' => false, 'error' => 'Invalid IP address'];
    }
    tileandturf_ensure_blocked_ips_table($conn);

    $city = substr(trim((string) ($meta['city'] ?? '')), 0, 100);
    $region = substr(trim((string) ($meta['region'] ?? '')), 0, 100);
    $country = substr(trim((string) ($meta['country'] ?? '')), 0, 8);
    $reason = substr(trim((string) ($meta['reason'] ?? '')), 0, 255);
    $blockedBy = substr(trim((string) ($meta['blocked_by'] ?? 'admin')), 0, 100);

    $ok = tileandturf_db_execute(
        $conn,
        'INSERT INTO blocked_ips (ip_address, city, region, country, reason, blocked_by)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           city = VALUES(city),
           region = VALUES(region),
           country = VALUES(country),
           reason = VALUES(reason),
           blocked_by = VALUES(blocked_by)',
        'ssssss',
        $ip,
        $city,
        $region,
        $country,
        $reason,
        $blockedBy
    );

    if ($ok === false) {
        return ['success' => false, 'error' => 'Could not block IP'];
    }
    return ['success' => true, 'ip' => $ip];
}

function tileandturf_unblock_ip($conn, $ip) {
    $ip = tileandturf_normalize_ip($ip);
    if ($ip === '') {
        return ['success' => false, 'error' => 'Invalid IP address'];
    }
    tileandturf_ensure_blocked_ips_table($conn);
    $stmt = $conn->prepare('DELETE FROM blocked_ips WHERE ip_address = ?');
    if (!$stmt) {
        return ['success' => false, 'error' => 'Could not unblock IP'];
    }
    $stmt->bind_param('s', $ip);
    $ok = $stmt->execute();
    $stmt->close();
    return $ok ? ['success' => true, 'ip' => $ip] : ['success' => false, 'error' => 'Could not unblock IP'];
}

/**
 * Persist checkout client IP on orders (for admin visitor / buyer matching).
 */
function tileandturf_ensure_orders_ip_column($conn) {
    static $done = false;
    if ($done || !($conn instanceof mysqli)) {
        return;
    }
    $done = true;
    $r = @$conn->query("SHOW COLUMNS FROM orders LIKE 'ip_address'");
    if ($r && $r->num_rows === 0) {
        @$conn->query('ALTER TABLE orders ADD COLUMN ip_address VARCHAR(45) NULL, ADD KEY idx_orders_ip (ip_address)');
    }
}

/**
 * Map IP => buyer stats from orders.ip_address + funnel purchase events.
 *
 * @return array<string, array>
 */
function tileandturf_buyer_stats_by_ip($conn, $days = 30) {
    $days = max(1, min(90, intval($days)));
    $map = [];

    if (!($conn instanceof mysqli)) {
        return $map;
    }

    tileandturf_ensure_orders_ip_column($conn);

    $absorb = function ($ip, $row) use (&$map) {
        $ip = tileandturf_normalize_ip($ip);
        if ($ip === '') {
            return;
        }
        if (!isset($map[$ip])) {
            $map[$ip] = [
                'is_buyer' => true,
                'order_count' => 0,
                'order_ids' => [],
                'last_order_at' => null,
                'last_order_number' => '',
                'buyer_name' => '',
                'buyer_email' => '',
                'recent_order_count' => 0,
            ];
        }
        $oid = intval($row['order_id'] ?? 0);
        if ($oid > 0 && empty($map[$ip]['order_ids'][$oid])) {
            $map[$ip]['order_ids'][$oid] = true;
            $map[$ip]['order_count']++;
            $created = $row['created_at'] ?? null;
            if ($created && (empty($map[$ip]['last_order_at']) || strcmp((string) $created, (string) $map[$ip]['last_order_at']) > 0)) {
                $map[$ip]['last_order_at'] = $created;
                $map[$ip]['last_order_number'] = (string) ($row['order_number'] ?? '');
                $map[$ip]['buyer_name'] = trim(
                    trim((string) ($row['first_name'] ?? '')) . ' ' . trim((string) ($row['last_name'] ?? ''))
                );
                $map[$ip]['buyer_email'] = (string) ($row['email'] ?? '');
            }
            $ts = $created ? strtotime((string) $created) : false;
            if ($ts !== false && $ts >= time() - 3600) {
                $map[$ip]['recent_order_count']++;
            }
        }
    };

    // Direct IP on orders (new checkouts).
    $colCheck = @$conn->query("SHOW COLUMNS FROM orders LIKE 'ip_address'");
    if ($colCheck && $colCheck->num_rows > 0) {
        $res = @$conn->query(
            "SELECT id AS order_id, order_number, first_name, last_name, email, created_at, ip_address
             FROM orders
             WHERE ip_address IS NOT NULL AND TRIM(ip_address) != ''
               AND created_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)"
        );
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $absorb($row['ip_address'] ?? '', $row);
            }
        }
    }

    // Funnel purchase events (covers orders placed with analytics session).
    $feCheck = @$conn->query("SHOW TABLES LIKE 'funnel_events'");
    if ($feCheck && $feCheck->num_rows > 0) {
        $res = @$conn->query(
            "SELECT o.id AS order_id, o.order_number, o.first_name, o.last_name, o.email, o.created_at,
                    fe.ip_address
             FROM funnel_events fe
             INNER JOIN orders o ON o.id = fe.order_id
             WHERE fe.event_type = 'purchase'
               AND fe.order_id IS NOT NULL
               AND fe.ip_address IS NOT NULL
               AND TRIM(fe.ip_address) != ''
               AND o.created_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)"
        );
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $absorb($row['ip_address'] ?? '', $row);
            }
        }
    }

    foreach ($map as $ip => &$stats) {
        $stats['order_ids'] = array_map('intval', array_keys($stats['order_ids']));
        unset($stats);
    }

    return $map;
}

/**
 * Resolve an order's client IP from orders.ip_address, funnel, page_hits session,
 * or (last resort) the only active visitor IP around the order timestamp.
 *
 * Returns ['ip' => string, 'source' => string, 'candidates' => array]
 */
function tileandturf_resolve_order_ip_detail($conn, $orderId, $knownIp = '', $orderCreatedAt = null) {
    $orderId = intval($orderId);
    $empty = ['ip' => '', 'source' => 'none', 'candidates' => []];
    if ($orderId <= 0 || !($conn instanceof mysqli)) {
        return $empty;
    }

    $ip = tileandturf_normalize_ip($knownIp);
    if ($ip !== '') {
        return ['ip' => $ip, 'source' => 'order', 'candidates' => []];
    }

    $sessions = [];

    // 1) Funnel rows for this order.
    $fe = @$conn->query(
        "SELECT ip_address, session_id
         FROM funnel_events
         WHERE order_id = {$orderId}
         ORDER BY id DESC
         LIMIT 20"
    );
    if ($fe) {
        while ($row = $fe->fetch_assoc()) {
            $cand = tileandturf_normalize_ip($row['ip_address'] ?? '');
            if ($cand !== '') {
                return ['ip' => $cand, 'source' => 'funnel', 'candidates' => []];
            }
            $sid = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) ($row['session_id'] ?? ''));
            if ($sid !== '') {
                $sessions[$sid] = true;
            }
        }
    }

    // 2) page_hits / active_visitors via funnel session_id.
    if ($sessions) {
        $sidList = "'" . implode("','", array_map(function ($s) use ($conn) {
            return $conn->real_escape_string($s);
        }, array_keys($sessions))) . "'";

        $ph = @$conn->query(
            "SELECT ip_address FROM page_hits
             WHERE session_id IN ($sidList)
               AND ip_address IS NOT NULL AND TRIM(ip_address) != ''
             ORDER BY created_at DESC
             LIMIT 1"
        );
        if ($ph && ($row = $ph->fetch_assoc())) {
            $cand = tileandturf_normalize_ip($row['ip_address'] ?? '');
            if ($cand !== '') {
                return ['ip' => $cand, 'source' => 'session', 'candidates' => []];
            }
        }

        $av = @$conn->query(
            "SELECT ip_address FROM active_visitors
             WHERE session_id IN ($sidList)
               AND ip_address IS NOT NULL AND TRIM(ip_address) != ''
             LIMIT 1"
        );
        if ($av && ($row = $av->fetch_assoc())) {
            $cand = tileandturf_normalize_ip($row['ip_address'] ?? '');
            if ($cand !== '') {
                return ['ip' => $cand, 'source' => 'session', 'candidates' => []];
            }
        }
    }

    // 3) Last resort: IPs hitting the site near the order time (esp. /checkout).
    if ($orderCreatedAt === null) {
        $o = @$conn->query("SELECT created_at FROM orders WHERE id = {$orderId} LIMIT 1");
        if ($o && ($orow = $o->fetch_assoc())) {
            $orderCreatedAt = $orow['created_at'] ?? null;
        }
    }
    $orderCreatedAt = trim((string) $orderCreatedAt);
    if ($orderCreatedAt === '' || !preg_match('/^\d{4}-\d{2}-\d{2}/', $orderCreatedAt)) {
        return $empty;
    }
    $tsEsc = $conn->real_escape_string($orderCreatedAt);

    $candidates = [];
    $phNear = @$conn->query(
        "SELECT ph.ip_address,
                COUNT(*) AS hits,
                SUM(CASE WHEN ph.path LIKE '%checkout%' OR ph.path LIKE '%cart%' THEN 1 ELSE 0 END) AS checkout_hits,
                MAX(NULLIF(ph.city, '')) AS city,
                MAX(NULLIF(ph.region_code, '')) AS region_code,
                MAX(NULLIF(ph.country, '')) AS country
         FROM page_hits ph
         WHERE ph.created_at BETWEEN DATE_SUB('{$tsEsc}', INTERVAL 3 MINUTE)
                                AND DATE_ADD('{$tsEsc}', INTERVAL 1 MINUTE)
           AND ph.ip_address IS NOT NULL
           AND TRIM(ph.ip_address) != ''
         GROUP BY ph.ip_address
         ORDER BY checkout_hits DESC, hits DESC
         LIMIT 8"
    );
    if ($phNear) {
        while ($row = $phNear->fetch_assoc()) {
            $cand = tileandturf_normalize_ip($row['ip_address'] ?? '');
            if ($cand === '') {
                continue;
            }
            $candidates[] = [
                'ip' => $cand,
                'hits' => intval($row['hits'] ?? 0),
                'checkout_hits' => intval($row['checkout_hits'] ?? 0),
                'city' => (string) ($row['city'] ?? ''),
                'region_code' => (string) ($row['region_code'] ?? ''),
                'country' => (string) ($row['country'] ?? ''),
            ];
        }
    }

    if (!$candidates) {
        return $empty;
    }

    // Prefer a single IP that hit checkout/cart near the order.
    $withCheckout = array_values(array_filter($candidates, function ($c) {
        return intval($c['checkout_hits']) > 0;
    }));
    if (count($withCheckout) === 1) {
        return [
            'ip' => $withCheckout[0]['ip'],
            'source' => 'inferred_checkout',
            'candidates' => $candidates,
        ];
    }
    if (count($candidates) === 1) {
        return [
            'ip' => $candidates[0]['ip'],
            'source' => 'inferred_alone',
            'candidates' => $candidates,
        ];
    }

    // Multiple IPs — return top candidate as soft guess, keep full list for admin.
    return [
        'ip' => $candidates[0]['ip'],
        'source' => 'inferred_guess',
        'candidates' => $candidates,
    ];
}

function tileandturf_resolve_order_ip($conn, $orderId, $knownIp = '') {
    $detail = tileandturf_resolve_order_ip_detail($conn, $orderId, $knownIp, null);
    return $detail['ip'] ?? '';
}

/**
 * Recent purchase rows for admin (who ordered in the last N minutes).
 */
function tileandturf_recent_buyer_orders($conn, $minutes = 60) {
    $minutes = max(5, min(24 * 60, intval($minutes)));
    $rows = [];
    if (!($conn instanceof mysqli)) {
        return $rows;
    }

    tileandturf_ensure_orders_ip_column($conn);

    $seen = [];
    $push = function ($row) use (&$rows, &$seen) {
        $oid = intval($row['order_id'] ?? 0);
        if ($oid <= 0 || isset($seen[$oid])) {
            return;
        }
        $seen[$oid] = true;
        $rows[] = [
            'order_id' => $oid,
            'order_number' => (string) ($row['order_number'] ?? ''),
            'buyer_name' => trim(
                trim((string) ($row['first_name'] ?? '')) . ' ' . trim((string) ($row['last_name'] ?? ''))
            ),
            'buyer_email' => (string) ($row['email'] ?? ''),
            'total' => isset($row['total']) ? floatval($row['total']) : null,
            'created_at' => $row['created_at'] ?? null,
            'ip' => tileandturf_normalize_ip($row['ip_address'] ?? ''),
            'ip_source' => tileandturf_normalize_ip($row['ip_address'] ?? '') !== '' ? 'order' : 'none',
            'ip_candidates' => [],
        ];
    };

    $colCheck = @$conn->query("SHOW COLUMNS FROM orders LIKE 'ip_address'");
    if ($colCheck && $colCheck->num_rows > 0) {
        $res = @$conn->query(
            "SELECT id AS order_id, order_number, first_name, last_name, email, total, created_at, ip_address
             FROM orders
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL {$minutes} MINUTE)
             ORDER BY created_at DESC
             LIMIT 50"
        );
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $push($row);
            }
        }
    } else {
        $res = @$conn->query(
            "SELECT id AS order_id, order_number, first_name, last_name, email, total, created_at, NULL AS ip_address
             FROM orders
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL {$minutes} MINUTE)
             ORDER BY created_at DESC
             LIMIT 50"
        );
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $push($row);
            }
        }
    }

    $hasIpCol = $colCheck && $colCheck->num_rows > 0;

    foreach ($rows as &$r) {
        $detail = tileandturf_resolve_order_ip_detail(
            $conn,
            $r['order_id'],
            $r['ip'],
            $r['created_at']
        );
        $r['ip'] = $detail['ip'] ?? '';
        $r['ip_source'] = $detail['source'] ?? 'none';
        $r['ip_candidates'] = $detail['candidates'] ?? [];

        // Only hard-backfill confident matches onto the order row.
        if (
            $hasIpCol
            && $r['ip'] !== ''
            && in_array($r['ip_source'], ['funnel', 'session', 'inferred_checkout', 'inferred_alone'], true)
        ) {
            $ipEsc = $conn->real_escape_string($r['ip']);
            $oid = intval($r['order_id']);
            @$conn->query(
                "UPDATE orders SET ip_address = '{$ipEsc}'
                 WHERE id = {$oid} AND (ip_address IS NULL OR TRIM(ip_address) = '')"
            );
        }
    }
    unset($r);

    usort($rows, function ($a, $b) {
        return strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? ''));
    });

    return $rows;
}
