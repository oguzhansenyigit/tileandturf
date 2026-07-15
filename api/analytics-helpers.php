<?php
/**
 * Analytics helpers: schema ensure, geo lookup, device parse.
 */

function tileandturf_analytics_ensure_tables($conn) {
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;

    @$conn->query("CREATE TABLE IF NOT EXISTS page_hits (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        ip_address VARCHAR(45) NULL,
        path VARCHAR(500) NULL,
        referrer VARCHAR(500) NULL,
        product_id INT NULL,
        country VARCHAR(8) NULL,
        region VARCHAR(100) NULL,
        region_code VARCHAR(16) NULL,
        city VARCHAR(100) NULL,
        device VARCHAR(32) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_page_hits_created (created_at),
        KEY idx_page_hits_region (region_code),
        KEY idx_page_hits_session (session_id),
        KEY idx_page_hits_product (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    @$conn->query("CREATE TABLE IF NOT EXISTS geo_ip_cache (
        ip_address VARCHAR(45) PRIMARY KEY,
        country VARCHAR(8) NULL,
        region VARCHAR(100) NULL,
        region_code VARCHAR(16) NULL,
        city VARCHAR(100) NULL,
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    @$conn->query("CREATE TABLE IF NOT EXISTS active_visitors (
        session_id VARCHAR(64) PRIMARY KEY,
        ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(500) NULL,
        path VARCHAR(500) NULL,
        product_id INT NULL,
        country VARCHAR(8) NULL,
        region_code VARCHAR(16) NULL,
        city VARCHAR(100) NULL,
        last_activity DATETIME NOT NULL,
        KEY idx_active_last (last_activity),
        KEY idx_active_product (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    @$conn->query("CREATE TABLE IF NOT EXISTS funnel_events (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        event_type VARCHAR(32) NOT NULL,
        product_id INT NULL,
        order_id INT NULL,
        ip_address VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_funnel_created (created_at),
        KEY idx_funnel_session (session_id),
        KEY idx_funnel_type (event_type),
        KEY idx_funnel_product (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    @$conn->query("CREATE TABLE IF NOT EXISTS abandoned_carts (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        email VARCHAR(255) NOT NULL,
        cart_json MEDIUMTEXT NOT NULL,
        cart_total DECIMAL(12,2) NOT NULL DEFAULT 0,
        source VARCHAR(32) NULL DEFAULT 'cart',
        recovered_at DATETIME NULL,
        emailed_at DATETIME NULL,
        email_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_abandoned_email (email),
        KEY idx_abandoned_pending (recovered_at, emailed_at, updated_at),
        KEY idx_abandoned_session (session_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Soft-add columns if an older active_visitors table exists without them
    $cols = [
        'path' => "VARCHAR(500) NULL",
        'product_id' => "INT NULL",
        'country' => "VARCHAR(8) NULL",
        'region_code' => "VARCHAR(16) NULL",
        'city' => "VARCHAR(100) NULL",
    ];
    foreach ($cols as $col => $def) {
        $r = @$conn->query("SHOW COLUMNS FROM active_visitors LIKE '$col'");
        if ($r && $r->num_rows === 0) {
            @$conn->query("ALTER TABLE active_visitors ADD COLUMN $col $def");
        }
    }

    // Normalize collations (MariaDB 11 often defaults to utf8mb4_uca1400_ai_ci)
    foreach (['page_hits', 'active_visitors', 'funnel_events', 'abandoned_carts', 'geo_ip_cache'] as $table) {
        $cr = @$conn->query(
            "SELECT TABLE_COLLATION AS c FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '" . $conn->real_escape_string($table) . "' LIMIT 1"
        );
        if ($cr && ($crow = $cr->fetch_assoc())) {
            $coll = (string)($crow['c'] ?? '');
            if ($coll !== '' && $coll !== 'utf8mb4_unicode_ci') {
                @$conn->query(
                    "ALTER TABLE `$table` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                );
            }
        }
    }

    @$conn->query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
}

/**
 * Record a funnel event (add_to_cart, begin_checkout, purchase, view_product).
 */
function tileandturf_funnel_record($conn, $sessionId, $eventType, $productId = null, $orderId = null, $ip = null) {
    $allowed = ['view_product', 'add_to_cart', 'begin_checkout', 'purchase'];
    if (!in_array($eventType, $allowed, true)) {
        return false;
    }
    $sessionId = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) $sessionId);
    $sessionId = substr($sessionId, 0, 64);
    if ($sessionId === '') {
        return false;
    }

    $pid = ($productId !== null && intval($productId) > 0) ? intval($productId) : null;
    $oid = ($orderId !== null && intval($orderId) > 0) ? intval($orderId) : null;
    $ip = $ip !== null ? substr((string) $ip, 0, 45) : null;

    // Light dedupe: same session + event + product within 45s
    $dedupeSql = "SELECT id FROM funnel_events
         WHERE session_id = '" . $conn->real_escape_string($sessionId) . "'
           AND event_type = '" . $conn->real_escape_string($eventType) . "'
           AND created_at >= DATE_SUB(NOW(), INTERVAL 45 SECOND)";
    if ($pid !== null) {
        $dedupeSql .= ' AND product_id = ' . $pid;
    } else {
        $dedupeSql .= ' AND product_id IS NULL';
    }
    $dedupeSql .= ' LIMIT 1';
    $existing = @$conn->query($dedupeSql);
    if ($existing && $existing->num_rows > 0) {
        return true;
    }

    $pidSql = $pid === null ? 'NULL' : (string) $pid;
    $oidSql = $oid === null ? 'NULL' : (string) $oid;
    $ipSql = ($ip === null || $ip === '')
        ? 'NULL'
        : "'" . $conn->real_escape_string($ip) . "'";

    return (bool) @$conn->query(
        "INSERT INTO funnel_events (session_id, event_type, product_id, order_id, ip_address) VALUES (" .
        "'" . $conn->real_escape_string($sessionId) . "'," .
        "'" . $conn->real_escape_string($eventType) . "'," .
        $pidSql . ',' . $oidSql . ',' . $ipSql . ')'
    );
}

/**
 * Unique-session funnel + abandon counts for a time window.
 */
function tileandturf_funnel_window_stats($conn, $intervalSql) {
    $empty = [
        'view_product' => 0,
        'add_to_cart' => 0,
        'begin_checkout' => 0,
        'purchase' => 0,
        'cart_no_checkout' => 0,
        'checkout_no_purchase' => 0,
    ];

    $q = @$conn->query(
        "SELECT event_type, COUNT(DISTINCT session_id) AS c
         FROM funnel_events
         WHERE created_at >= $intervalSql
         GROUP BY event_type"
    );
    if ($q) {
        while ($row = $q->fetch_assoc()) {
            $t = $row['event_type'];
            if (isset($empty[$t])) {
                $empty[$t] = intval($row['c']);
            }
        }
    }

    $cartOnly = @$conn->query(
        "SELECT COUNT(DISTINCT a.session_id) AS c
         FROM funnel_events a
         WHERE BINARY a.event_type = BINARY 'add_to_cart'
           AND a.created_at >= $intervalSql
           AND NOT EXISTS (
             SELECT 1 FROM funnel_events b
             WHERE BINARY b.session_id = BINARY a.session_id
               AND (
                 BINARY b.event_type = BINARY 'begin_checkout'
                 OR BINARY b.event_type = BINARY 'purchase'
               )
               AND b.created_at >= $intervalSql
           )"
    );
    if ($cartOnly && ($r = $cartOnly->fetch_assoc())) {
        $empty['cart_no_checkout'] = intval($r['c']);
    }

    $chkOnly = @$conn->query(
        "SELECT COUNT(DISTINCT a.session_id) AS c
         FROM funnel_events a
         WHERE BINARY a.event_type = BINARY 'begin_checkout'
           AND a.created_at >= $intervalSql
           AND NOT EXISTS (
             SELECT 1 FROM funnel_events b
             WHERE BINARY b.session_id = BINARY a.session_id
               AND BINARY b.event_type = BINARY 'purchase'
               AND b.created_at >= $intervalSql
           )"
    );
    if ($chkOnly && ($r = $chkOnly->fetch_assoc())) {
        $empty['checkout_no_purchase'] = intval($r['c']);
    }

    return $empty;
}

// Use security.php's tileandturf_client_ip() when available.
if (!function_exists('tileandturf_client_ip')) {
    function tileandturf_client_ip() {
        $candidates = [
            $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '',
            $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '',
            $_SERVER['REMOTE_ADDR'] ?? '',
        ];
        foreach ($candidates as $c) {
            if ($c === '') {
                continue;
            }
            $parts = array_map('trim', explode(',', $c));
            foreach ($parts as $ip) {
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        return '0.0.0.0';
    }
}

function tileandturf_is_public_ip($ip) {
    return (bool) filter_var(
        $ip,
        FILTER_VALIDATE_IP,
        FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
    );
}

function tileandturf_device_from_ua($ua) {
    $ua = strtolower((string) $ua);
    if ($ua === '') {
        return 'unknown';
    }
    if (preg_match('/bot|crawl|spider|slurp|facebookexternalhit/i', $ua)) {
        return 'bot';
    }
    if (preg_match('/ipad|tablet|kindle|silk/i', $ua)) {
        return 'tablet';
    }
    if (preg_match('/mobi|iphone|android.*mobile|windows phone/i', $ua)) {
        return 'mobile';
    }
    return 'desktop';
}

/**
 * Resolve geo for an IP. Cached in DB. Uses ip-api.com (no key, HTTP).
 */
function tileandturf_geo_lookup($conn, $ip) {
    $empty = [
        'country' => null,
        'region' => null,
        'region_code' => null,
        'city' => null,
    ];
    if (!tileandturf_is_public_ip($ip)) {
        return $empty;
    }

    $stmt = $conn->prepare('SELECT country, region, region_code, city, fetched_at FROM geo_ip_cache WHERE ip_address = ? LIMIT 1');
    if ($stmt) {
        $stmt->bind_param('s', $ip);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res && ($row = $res->fetch_assoc())) {
            $age = time() - strtotime($row['fetched_at']);
            if ($age < 86400 * 14) {
                $stmt->close();
                return [
                    'country' => $row['country'],
                    'region' => $row['region'],
                    'region_code' => $row['region_code'],
                    'city' => $row['city'],
                ];
            }
        }
        $stmt->close();
    }

    $geo = tileandturf_geo_fetch_remote($ip);
    if ($geo === null) {
        return $empty;
    }

    $up = $conn->prepare(
        'INSERT INTO geo_ip_cache (ip_address, country, region, region_code, city, fetched_at)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE country = VALUES(country), region = VALUES(region),
           region_code = VALUES(region_code), city = VALUES(city), fetched_at = NOW()'
    );
    if ($up) {
        $up->bind_param(
            'sssss',
            $ip,
            $geo['country'],
            $geo['region'],
            $geo['region_code'],
            $geo['city']
        );
        $up->execute();
        $up->close();
    }

    return $geo;
}

function tileandturf_geo_fetch_remote($ip) {
    $url = 'http://ip-api.com/json/' . rawurlencode($ip) . '?fields=status,countryCode,regionName,region,city';
    $raw = null;

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 2,
            CURLOPT_CONNECTTIMEOUT => 2,
        ]);
        $raw = curl_exec($ch);
        curl_close($ch);
    } else {
        $ctx = stream_context_create(['http' => ['timeout' => 2]]);
        $raw = @file_get_contents($url, false, $ctx);
    }

    if (!$raw) {
        return null;
    }
    $data = json_decode($raw, true);
    if (!is_array($data) || ($data['status'] ?? '') !== 'success') {
        return null;
    }

    return [
        'country' => $data['countryCode'] ?? null,
        'region' => $data['regionName'] ?? null,
        'region_code' => $data['region'] ?? null,
        'city' => $data['city'] ?? null,
    ];
}

function tileandturf_normalize_us_state($code, $name = '') {
    $code = strtoupper(trim((string) $code));
    if (strlen($code) === 2) {
        return $code;
    }
    static $map = [
        'alabama' => 'AL', 'alaska' => 'AK', 'arizona' => 'AZ', 'arkansas' => 'AR',
        'california' => 'CA', 'colorado' => 'CO', 'connecticut' => 'CT', 'delaware' => 'DE',
        'florida' => 'FL', 'georgia' => 'GA', 'hawaii' => 'HI', 'idaho' => 'ID',
        'illinois' => 'IL', 'indiana' => 'IN', 'iowa' => 'IA', 'kansas' => 'KS',
        'kentucky' => 'KY', 'louisiana' => 'LA', 'maine' => 'ME', 'maryland' => 'MD',
        'massachusetts' => 'MA', 'michigan' => 'MI', 'minnesota' => 'MN', 'mississippi' => 'MS',
        'missouri' => 'MO', 'montana' => 'MT', 'nebraska' => 'NE', 'nevada' => 'NV',
        'new hampshire' => 'NH', 'new jersey' => 'NJ', 'new mexico' => 'NM', 'new york' => 'NY',
        'north carolina' => 'NC', 'north dakota' => 'ND', 'ohio' => 'OH', 'oklahoma' => 'OK',
        'oregon' => 'OR', 'pennsylvania' => 'PA', 'rhode island' => 'RI', 'south carolina' => 'SC',
        'south dakota' => 'SD', 'tennessee' => 'TN', 'texas' => 'TX', 'utah' => 'UT',
        'vermont' => 'VT', 'virginia' => 'VA', 'washington' => 'WA', 'west virginia' => 'WV',
        'wisconsin' => 'WI', 'wyoming' => 'WY', 'district of columbia' => 'DC',
    ];
    $key = strtolower(trim((string) $name));
    return $map[$key] ?? '';
}

/**
 * Active US sessions grouped by state (last 5 minutes).
 * @return list<array{state:string,visitors:int,cities?:string}>
 */
function tileandturf_live_by_state($conn) {
    $out = [];
    $res = @$conn->query(
        "SELECT UPPER(TRIM(region_code)) AS state_code,
                COUNT(*) AS visitors,
                GROUP_CONCAT(DISTINCT NULLIF(city, '') ORDER BY city SEPARATOR ', ') AS cities
         FROM active_visitors
         WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
           AND country IN ('US', 'USA', 'United States')
           AND region_code IS NOT NULL
           AND TRIM(region_code) != ''
         GROUP BY UPPER(TRIM(region_code))
         ORDER BY visitors DESC"
    );
    if (!$res) {
        return $out;
    }
    while ($row = $res->fetch_assoc()) {
        $state = tileandturf_normalize_us_state($row['state_code'] ?? '');
        if ($state === '') {
            continue;
        }
        $out[] = [
            'state' => $state,
            'visitors' => intval($row['visitors'] ?? 0),
            'cities' => $row['cities'] ?? '',
        ];
    }
    return $out;
}
