<?php
/**
 * First-touch traffic attribution (paid vs organic vs direct…).
 */

function tileandturf_attribution_ensure_tables($conn) {
    static $done = false;
    if ($done || !($conn instanceof mysqli)) {
        return;
    }
    $done = true;

    @$conn->query(
        "CREATE TABLE IF NOT EXISTS visitor_attribution (
            session_id VARCHAR(64) PRIMARY KEY,
            channel VARCHAR(32) NOT NULL DEFAULT 'unknown',
            utm_source VARCHAR(120) NULL,
            utm_medium VARCHAR(120) NULL,
            utm_campaign VARCHAR(180) NULL,
            gclid VARCHAR(120) NULL,
            landing_path VARCHAR(500) NULL,
            referrer VARCHAR(500) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_attr_channel (channel),
            KEY idx_attr_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $orderCols = [
        'traffic_channel' => "VARCHAR(32) NULL",
        'utm_source' => "VARCHAR(120) NULL",
        'utm_medium' => "VARCHAR(120) NULL",
        'utm_campaign' => "VARCHAR(180) NULL",
        'gclid' => "VARCHAR(120) NULL",
        'landing_path' => "VARCHAR(500) NULL",
        'attribution_referrer' => "VARCHAR(500) NULL",
    ];
    foreach ($orderCols as $col => $def) {
        $r = @$conn->query("SHOW COLUMNS FROM orders LIKE '" . $conn->real_escape_string($col) . "'");
        if ($r && $r->num_rows === 0) {
            @$conn->query("ALTER TABLE orders ADD COLUMN `{$col}` {$def}");
        }
    }
}

function tileandturf_attribution_clean($value, $max = 120) {
    $value = trim((string) $value);
    if ($value === '') {
        return '';
    }
    $value = preg_replace('/[\x00-\x1F\x7F]/', '', $value);
    return substr($value, 0, $max);
}

/**
 * Classify first-touch into paid | organic | direct | referral | social | unknown
 */
function tileandturf_attribution_classify($meta) {
    $utmSource = strtolower(tileandturf_attribution_clean($meta['utm_source'] ?? '', 120));
    $utmMedium = strtolower(tileandturf_attribution_clean($meta['utm_medium'] ?? '', 120));
    $gclid = tileandturf_attribution_clean($meta['gclid'] ?? '', 120);
    if ($gclid === '') {
        $gclid = tileandturf_attribution_clean($meta['gbraid'] ?? '', 120);
    }
    if ($gclid === '') {
        $gclid = tileandturf_attribution_clean($meta['wbraid'] ?? '', 120);
    }
    $referrer = strtolower(tileandturf_attribution_clean($meta['referrer'] ?? '', 500));

    $paidMediums = [
        'cpc', 'ppc', 'paid', 'paidsearch', 'paid_search', 'shopping', 'pmax',
        'display', 'cpm', 'cpv', 'paid-social', 'paidsocial', 'paid_social',
        'sponsor', 'sponsored', 'ads', 'ad',
    ];
    if ($gclid !== '' || in_array($utmMedium, $paidMediums, true)) {
        return 'paid';
    }
    if ($utmMedium === 'organic' || $utmMedium === 'free' || $utmMedium === 'free_listings') {
        return 'organic';
    }

    $host = '';
    if ($referrer !== '') {
        $parts = @parse_url($referrer);
        $host = strtolower((string) ($parts['host'] ?? ''));
        $host = preg_replace('/^www\./', '', $host);
    }

    $searchHosts = [
        'google.com', 'google.co.uk', 'google.ca', 'google.com.tr',
        'bing.com', 'yahoo.com', 'duckduckgo.com', 'ecosia.org',
        'search.yahoo.com', 'googleadservices.com',
    ];
    foreach ($searchHosts as $sh) {
        if ($host === $sh || substr($host, -strlen('.' . $sh)) === '.' . $sh) {
            if (strpos($host, 'googleadservices') !== false || strpos($referrer, 'aclk') !== false) {
                return 'paid';
            }
            return 'organic';
        }
    }

    $socialHosts = [
        'facebook.com', 'fb.com', 'm.facebook.com', 'l.facebook.com',
        'instagram.com', 'l.instagram.com', 'twitter.com', 'x.com', 't.co',
        'linkedin.com', 'pinterest.com', 'tiktok.com', 'youtube.com', 'youtu.be',
    ];
    foreach ($socialHosts as $sh) {
        if ($host === $sh || substr($host, -strlen('.' . $sh)) === '.' . $sh) {
            return 'social';
        }
    }

    if ($host !== '' && $host !== 'tileandturf.com') {
        return 'referral';
    }

    if ($utmSource !== '' || $utmMedium !== '') {
        return 'referral';
    }

    return 'direct';
}

function tileandturf_attribution_normalize_payload($data) {
    if (!is_array($data)) {
        $data = [];
    }
    $meta = [
        'utm_source' => tileandturf_attribution_clean($data['utm_source'] ?? '', 120),
        'utm_medium' => tileandturf_attribution_clean($data['utm_medium'] ?? '', 120),
        'utm_campaign' => tileandturf_attribution_clean($data['utm_campaign'] ?? '', 180),
        'gclid' => tileandturf_attribution_clean($data['gclid'] ?? ($data['gbraid'] ?? ($data['wbraid'] ?? '')), 120),
        'landing_path' => tileandturf_attribution_clean($data['landing_path'] ?? ($data['path'] ?? ''), 500),
        'referrer' => tileandturf_attribution_clean($data['referrer'] ?? '', 500),
    ];
    $meta['channel'] = tileandturf_attribution_classify(array_merge($meta, [
        'gbraid' => tileandturf_attribution_clean($data['gbraid'] ?? '', 120),
        'wbraid' => tileandturf_attribution_clean($data['wbraid'] ?? '', 120),
    ]));
    return $meta;
}

/**
 * Save first-touch only (INSERT IGNORE). Returns stored row or null.
 */
function tileandturf_attribution_save_first_touch($conn, $sessionId, $data) {
    tileandturf_attribution_ensure_tables($conn);
    $sessionId = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) $sessionId);
    $sessionId = substr($sessionId, 0, 64);
    if ($sessionId === '') {
        return null;
    }

    $meta = tileandturf_attribution_normalize_payload($data);

    $stmt = $conn->prepare(
        'INSERT IGNORE INTO visitor_attribution
         (session_id, channel, utm_source, utm_medium, utm_campaign, gclid, landing_path, referrer)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    if ($stmt) {
        $stmt->bind_param(
            'ssssssss',
            $sessionId,
            $meta['channel'],
            $meta['utm_source'],
            $meta['utm_medium'],
            $meta['utm_campaign'],
            $meta['gclid'],
            $meta['landing_path'],
            $meta['referrer']
        );
        $stmt->execute();
        $stmt->close();
    }

    return tileandturf_attribution_for_session($conn, $sessionId);
}

function tileandturf_attribution_for_session($conn, $sessionId) {
    tileandturf_attribution_ensure_tables($conn);
    $sessionId = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) $sessionId);
    $sessionId = substr($sessionId, 0, 64);
    if ($sessionId === '' || !($conn instanceof mysqli)) {
        return null;
    }
    return tileandturf_db_fetch_one(
        $conn,
        'SELECT session_id, channel, utm_source, utm_medium, utm_campaign, gclid, landing_path, referrer, created_at
         FROM visitor_attribution WHERE session_id = ? LIMIT 1',
        's',
        $sessionId
    );
}

function tileandturf_attribution_channel_label($channel) {
    switch ((string) $channel) {
        case 'paid':
            return 'Paid (sponsored)';
        case 'organic':
            return 'Organic';
        case 'direct':
            return 'Direct';
        case 'referral':
            return 'Referral';
        case 'social':
            return 'Social';
        default:
            return 'Unknown';
    }
}
