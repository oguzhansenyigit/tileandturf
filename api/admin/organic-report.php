<?php
/**
 * Admin report: organic (SEO) + direct traffic audience.
 */
require_once '../config.php';
require_once __DIR__ . '/../analytics-helpers.php';
require_once __DIR__ . '/../attribution-helpers.php';

tileandturf_require_admin();
tileandturf_analytics_ensure_tables($conn);
tileandturf_attribution_ensure_tables($conn);

$days = max(1, min(90, intval($_GET['days'] ?? 30)));
$channelFilter = strtolower(trim((string) ($_GET['channel'] ?? 'both')));
if (!in_array($channelFilter, ['both', 'organic', 'direct'], true)) {
    $channelFilter = 'both';
}

$channels = $channelFilter === 'both' ? ['organic', 'direct'] : [$channelFilter];
$channelIn = "'" . implode("','", array_map(function ($c) use ($conn) {
    return $conn->real_escape_string($c);
}, $channels)) . "'";

$summary = [
    'organic_sessions' => 0,
    'direct_sessions' => 0,
    'organic_orders' => 0,
    'direct_orders' => 0,
    'organic_revenue' => 0.0,
    'direct_revenue' => 0.0,
    'paid_sessions' => 0,
    'other_sessions' => 0,
];

$chCounts = @$conn->query(
    "SELECT channel, COUNT(*) AS c
     FROM visitor_attribution
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)
     GROUP BY channel"
);
if ($chCounts) {
    while ($row = $chCounts->fetch_assoc()) {
        $ch = strtolower((string) ($row['channel'] ?? ''));
        $c = intval($row['c'] ?? 0);
        if ($ch === 'organic') {
            $summary['organic_sessions'] = $c;
        } elseif ($ch === 'direct') {
            $summary['direct_sessions'] = $c;
        } elseif ($ch === 'paid') {
            $summary['paid_sessions'] = $c;
        } else {
            $summary['other_sessions'] += $c;
        }
    }
}

$hasOrderChannel = false;
$col = @$conn->query("SHOW COLUMNS FROM orders LIKE 'traffic_channel'");
if ($col && $col->num_rows > 0) {
    $hasOrderChannel = true;
    $ord = @$conn->query(
        "SELECT traffic_channel AS channel,
                COUNT(*) AS orders,
                COALESCE(SUM(total), 0) AS revenue
         FROM orders
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)
           AND (status IS NULL OR status != 'cancelled')
           AND traffic_channel IN ('organic', 'direct')
         GROUP BY traffic_channel"
    );
    if ($ord) {
        while ($row = $ord->fetch_assoc()) {
            $ch = strtolower((string) ($row['channel'] ?? ''));
            if ($ch === 'organic') {
                $summary['organic_orders'] = intval($row['orders'] ?? 0);
                $summary['organic_revenue'] = floatval($row['revenue'] ?? 0);
            } elseif ($ch === 'direct') {
                $summary['direct_orders'] = intval($row['orders'] ?? 0);
                $summary['direct_revenue'] = floatval($row['revenue'] ?? 0);
            }
        }
    }
}

// Daily trend for organic + direct sessions
$daily = [];
$dailyRes = @$conn->query(
    "SELECT DATE(created_at) AS day, channel, COUNT(*) AS sessions
     FROM visitor_attribution
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)
       AND channel IN ('organic', 'direct')
     GROUP BY DATE(created_at), channel
     ORDER BY day ASC"
);
$dailyMap = [];
if ($dailyRes) {
    while ($row = $dailyRes->fetch_assoc()) {
        $day = (string) ($row['day'] ?? '');
        if ($day === '') {
            continue;
        }
        if (!isset($dailyMap[$day])) {
            $dailyMap[$day] = ['day' => $day, 'organic' => 0, 'direct' => 0];
        }
        $ch = strtolower((string) ($row['channel'] ?? ''));
        if ($ch === 'organic' || $ch === 'direct') {
            $dailyMap[$day][$ch] = intval($row['sessions'] ?? 0);
        }
    }
}
$daily = array_values($dailyMap);

// Top landing pages
$landings = [];
$landRes = @$conn->query(
    "SELECT channel,
            COALESCE(NULLIF(landing_path, ''), '/') AS landing_path,
            COUNT(*) AS sessions
     FROM visitor_attribution
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)
       AND channel IN ({$channelIn})
     GROUP BY channel, COALESCE(NULLIF(landing_path, ''), '/')
     ORDER BY sessions DESC
     LIMIT 40"
);
if ($landRes) {
    while ($row = $landRes->fetch_assoc()) {
        $landings[] = [
            'channel' => (string) ($row['channel'] ?? ''),
            'landing_path' => (string) ($row['landing_path'] ?? '/'),
            'sessions' => intval($row['sessions'] ?? 0),
        ];
    }
}

// Recent organic/direct sessions with geo from page_hits / active_visitors
$sessions = [];
$sessRes = @$conn->query(
    "SELECT va.session_id, va.channel, va.utm_source, va.utm_medium, va.utm_campaign,
            va.landing_path, va.referrer, va.created_at,
            (
              SELECT ph.ip_address FROM page_hits ph
              WHERE BINARY ph.session_id = BINARY va.session_id
                AND ph.ip_address IS NOT NULL AND TRIM(ph.ip_address) != ''
              ORDER BY ph.created_at DESC LIMIT 1
            ) AS ip_address,
            (
              SELECT ph.city FROM page_hits ph
              WHERE BINARY ph.session_id = BINARY va.session_id
              ORDER BY ph.created_at DESC LIMIT 1
            ) AS city,
            (
              SELECT ph.region_code FROM page_hits ph
              WHERE BINARY ph.session_id = BINARY va.session_id
              ORDER BY ph.created_at DESC LIMIT 1
            ) AS region_code,
            (
              SELECT ph.country FROM page_hits ph
              WHERE BINARY ph.session_id = BINARY va.session_id
              ORDER BY ph.created_at DESC LIMIT 1
            ) AS country
     FROM visitor_attribution va
     WHERE va.created_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)
       AND va.channel IN ({$channelIn})
     ORDER BY va.created_at DESC
     LIMIT 150"
);
if ($sessRes) {
    while ($row = $sessRes->fetch_assoc()) {
        $sessions[] = [
            'session_id' => (string) ($row['session_id'] ?? ''),
            'channel' => (string) ($row['channel'] ?? ''),
            'utm_source' => (string) ($row['utm_source'] ?? ''),
            'utm_medium' => (string) ($row['utm_medium'] ?? ''),
            'utm_campaign' => (string) ($row['utm_campaign'] ?? ''),
            'landing_path' => (string) ($row['landing_path'] ?? ''),
            'referrer' => (string) ($row['referrer'] ?? ''),
            'created_at' => $row['created_at'] ?? null,
            'ip' => (string) ($row['ip_address'] ?? ''),
            'city' => (string) ($row['city'] ?? ''),
            'region_code' => (string) ($row['region_code'] ?? ''),
            'country' => (string) ($row['country'] ?? ''),
        ];
    }
}

// Orders from organic/direct
$orders = [];
if ($hasOrderChannel) {
    $oRes = @$conn->query(
        "SELECT id, order_number, first_name, last_name, email, total, status, created_at,
                traffic_channel, utm_source, utm_medium, utm_campaign, ip_address, landing_path
         FROM orders
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)
           AND (status IS NULL OR status != 'cancelled')
           AND traffic_channel IN ({$channelIn})
         ORDER BY created_at DESC
         LIMIT 80"
    );
    if ($oRes) {
        while ($row = $oRes->fetch_assoc()) {
            $orders[] = [
                'id' => intval($row['id'] ?? 0),
                'order_number' => (string) ($row['order_number'] ?? ''),
                'buyer_name' => trim(trim((string) ($row['first_name'] ?? '')) . ' ' . trim((string) ($row['last_name'] ?? ''))),
                'buyer_email' => (string) ($row['email'] ?? ''),
                'total' => floatval($row['total'] ?? 0),
                'status' => (string) ($row['status'] ?? ''),
                'created_at' => $row['created_at'] ?? null,
                'channel' => (string) ($row['traffic_channel'] ?? ''),
                'utm_medium' => (string) ($row['utm_medium'] ?? ''),
                'utm_campaign' => (string) ($row['utm_campaign'] ?? ''),
                'ip' => (string) ($row['ip_address'] ?? ''),
                'landing_path' => (string) ($row['landing_path'] ?? ''),
            ];
        }
    }
}

// Live organic/direct right now
$live = [];
$liveRes = @$conn->query(
    "SELECT av.session_id, av.path, av.city, av.region_code, av.country, av.last_activity, av.ip_address,
            va.channel, va.utm_medium, va.landing_path
     FROM active_visitors av
     INNER JOIN visitor_attribution va ON BINARY va.session_id = BINARY av.session_id
     WHERE av.last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
       AND va.channel IN ({$channelIn})
     ORDER BY av.last_activity DESC
     LIMIT 40"
);
if ($liveRes) {
    while ($row = $liveRes->fetch_assoc()) {
        $live[] = [
            'session_id' => (string) ($row['session_id'] ?? ''),
            'channel' => (string) ($row['channel'] ?? ''),
            'utm_medium' => (string) ($row['utm_medium'] ?? ''),
            'path' => (string) ($row['path'] ?? ''),
            'landing_path' => (string) ($row['landing_path'] ?? ''),
            'city' => (string) ($row['city'] ?? ''),
            'region_code' => (string) ($row['region_code'] ?? ''),
            'country' => (string) ($row['country'] ?? ''),
            'ip' => (string) ($row['ip_address'] ?? ''),
            'last_activity' => $row['last_activity'] ?? null,
        ];
    }
}

echo json_encode([
    'success' => true,
    'days' => $days,
    'channel' => $channelFilter,
    'summary' => $summary,
    'daily' => $daily,
    'landings' => $landings,
    'sessions' => $sessions,
    'orders' => $orders,
    'live' => $live,
]);
$conn->close();
