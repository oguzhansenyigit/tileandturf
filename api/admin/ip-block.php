<?php
require_once '../config.php';
require_once __DIR__ . '/../analytics-helpers.php';
require_once __DIR__ . '/../ip-block-helpers.php';

tileandturf_require_admin();
tileandturf_analytics_ensure_tables($conn);
tileandturf_ensure_blocked_ips_table($conn);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    if ($action === '' || $action === 'visitors') {
        $days = max(1, min(90, intval($_GET['days'] ?? 30)));
        $limit = max(20, min(500, intval($_GET['limit'] ?? 200)));

        $visitors = [];
        $sql = "SELECT
                    ph.ip_address,
                    MAX(NULLIF(ph.city, '')) AS city,
                    MAX(NULLIF(ph.region, '')) AS region,
                    MAX(NULLIF(ph.region_code, '')) AS region_code,
                    MAX(NULLIF(ph.country, '')) AS country,
                    COUNT(*) AS hits,
                    COUNT(DISTINCT ph.session_id) AS sessions,
                    MIN(ph.created_at) AS first_seen,
                    MAX(ph.created_at) AS last_seen
                FROM page_hits ph
                WHERE ph.ip_address IS NOT NULL
                  AND TRIM(ph.ip_address) != ''
                  AND ph.created_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)
                GROUP BY ph.ip_address
                ORDER BY last_seen DESC
                LIMIT {$limit}";
        $res = @$conn->query($sql);
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $visitors[] = $row;
            }
        }

        $buyerMap = tileandturf_buyer_stats_by_ip($conn, $days);
        $recentOrders = tileandturf_recent_buyer_orders($conn, 60);

        require_once __DIR__ . '/../attribution-helpers.php';
        tileandturf_attribution_ensure_tables($conn);

        $channelByIp = [];
        $chRes = @$conn->query(
            "SELECT ph.ip_address,
                    SUBSTRING_INDEX(GROUP_CONCAT(va.channel ORDER BY ph.created_at DESC SEPARATOR '|||'), '|||', 1) AS channel,
                    SUBSTRING_INDEX(GROUP_CONCAT(IFNULL(va.utm_medium, '') ORDER BY ph.created_at DESC SEPARATOR '|||'), '|||', 1) AS utm_medium
             FROM page_hits ph
             INNER JOIN visitor_attribution va ON BINARY va.session_id = BINARY ph.session_id
             WHERE ph.ip_address IS NOT NULL AND TRIM(ph.ip_address) != ''
               AND ph.created_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)
             GROUP BY ph.ip_address"
        );
        if ($chRes) {
            while ($crow = $chRes->fetch_assoc()) {
                $cip = (string) ($crow['ip_address'] ?? '');
                if ($cip === '') {
                    continue;
                }
                $channelByIp[$cip] = [
                    'traffic_channel' => (string) ($crow['channel'] ?? ''),
                    'utm_medium' => (string) ($crow['utm_medium'] ?? ''),
                ];
            }
        }

        $attachBuyer = function (array $row) use ($buyerMap, $channelByIp) {
            $ip = (string) ($row['ip'] ?? '');
            $buyer = $buyerMap[$ip] ?? null;
            $row['is_buyer'] = $buyer !== null;
            $row['order_count'] = $buyer ? intval($buyer['order_count']) : 0;
            $row['recent_order_count'] = $buyer ? intval($buyer['recent_order_count']) : 0;
            $row['last_order_at'] = $buyer['last_order_at'] ?? null;
            $row['last_order_number'] = $buyer['last_order_number'] ?? '';
            $row['buyer_name'] = $buyer['buyer_name'] ?? '';
            $row['buyer_email'] = $buyer['buyer_email'] ?? '';
            $ch = $channelByIp[$ip] ?? null;
            $row['traffic_channel'] = $row['traffic_channel'] ?? ($ch['traffic_channel'] ?? '');
            $row['utm_medium'] = $row['utm_medium'] ?? ($ch['utm_medium'] ?? '');
            return $row;
        };

        $blockedMap = [];
        $blockedRows = tileandturf_db_fetch_all(
            $conn,
            'SELECT ip_address, city, region, country, reason, blocked_by, created_at FROM blocked_ips ORDER BY created_at DESC'
        );
        foreach ($blockedRows as $b) {
            $blockedMap[$b['ip_address']] = $b;
        }

        $out = [];
        $seenIps = [];
        foreach ($visitors as $v) {
            $ip = (string) ($v['ip_address'] ?? '');
            $seenIps[$ip] = true;
            $blocked = $blockedMap[$ip] ?? null;
            $out[] = $attachBuyer([
                'ip' => $ip,
                'city' => $v['city'] ?: ($blocked['city'] ?? ''),
                'region' => $v['region'] ?: ($blocked['region'] ?? ''),
                'region_code' => $v['region_code'] ?? '',
                'country' => $v['country'] ?: ($blocked['country'] ?? ''),
                'hits' => intval($v['hits'] ?? 0),
                'sessions' => intval($v['sessions'] ?? 0),
                'first_seen' => $v['first_seen'] ?? null,
                'last_seen' => $v['last_seen'] ?? null,
                'blocked' => $blocked !== null,
                'block_reason' => $blocked['reason'] ?? '',
                'blocked_at' => $blocked['created_at'] ?? null,
            ]);
        }

        // Include blocked IPs that have no recent page hits.
        foreach ($blockedMap as $ip => $b) {
            if (!empty($seenIps[$ip])) {
                continue;
            }
            $seenIps[$ip] = true;
            $out[] = $attachBuyer([
                'ip' => $ip,
                'city' => $b['city'] ?? '',
                'region' => $b['region'] ?? '',
                'region_code' => '',
                'country' => $b['country'] ?? '',
                'hits' => 0,
                'sessions' => 0,
                'first_seen' => null,
                'last_seen' => null,
                'blocked' => true,
                'block_reason' => $b['reason'] ?? '',
                'blocked_at' => $b['created_at'] ?? null,
            ]);
        }

        // Include buyer IPs with no page hits / block row in the window.
        foreach ($buyerMap as $ip => $buyer) {
            if (!empty($seenIps[$ip])) {
                continue;
            }
            $seenIps[$ip] = true;
            $out[] = $attachBuyer([
                'ip' => $ip,
                'city' => '',
                'region' => '',
                'region_code' => '',
                'country' => '',
                'hits' => 0,
                'sessions' => 0,
                'first_seen' => null,
                'last_seen' => $buyer['last_order_at'] ?? null,
                'blocked' => isset($blockedMap[$ip]),
                'block_reason' => $blockedMap[$ip]['reason'] ?? '',
                'blocked_at' => $blockedMap[$ip]['created_at'] ?? null,
            ]);
        }

        // Buyers first, then recent activity.
        usort($out, function ($a, $b) {
            $ar = intval($a['recent_order_count'] ?? 0);
            $br = intval($b['recent_order_count'] ?? 0);
            if ($ar !== $br) {
                return $br <=> $ar;
            }
            $ab = !empty($a['is_buyer']) ? 1 : 0;
            $bb = !empty($b['is_buyer']) ? 1 : 0;
            if ($ab !== $bb) {
                return $bb <=> $ab;
            }
            return strcmp((string) ($b['last_seen'] ?? ''), (string) ($a['last_seen'] ?? ''));
        });

        $live = [];
        $liveRes = @$conn->query(
            "SELECT av.ip_address,
                    MAX(NULLIF(av.city, '')) AS city,
                    MAX(NULLIF(av.region_code, '')) AS region_code,
                    MAX(NULLIF(av.country, '')) AS country,
                    SUBSTRING_INDEX(GROUP_CONCAT(av.path ORDER BY av.last_activity DESC SEPARATOR '|||'), '|||', 1) AS path,
                    MAX(av.last_activity) AS last_activity,
                    COUNT(*) AS sessions,
                    SUBSTRING_INDEX(GROUP_CONCAT(IFNULL(va.channel, '') ORDER BY av.last_activity DESC SEPARATOR '|||'), '|||', 1) AS traffic_channel,
                    SUBSTRING_INDEX(GROUP_CONCAT(IFNULL(va.utm_medium, '') ORDER BY av.last_activity DESC SEPARATOR '|||'), '|||', 1) AS utm_medium
             FROM active_visitors av
             LEFT JOIN visitor_attribution va ON BINARY va.session_id = BINARY av.session_id
             WHERE av.last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
               AND av.ip_address IS NOT NULL
               AND TRIM(av.ip_address) != ''
             GROUP BY av.ip_address
             ORDER BY last_activity DESC
             LIMIT 50"
        );
        if ($liveRes) {
            while ($row = $liveRes->fetch_assoc()) {
                $ip = (string) ($row['ip_address'] ?? '');
                $live[] = $attachBuyer([
                    'ip' => $ip,
                    'city' => $row['city'] ?? '',
                    'region_code' => $row['region_code'] ?? '',
                    'country' => $row['country'] ?? '',
                    'path' => $row['path'] ?? '',
                    'last_activity' => $row['last_activity'] ?? null,
                    'sessions' => intval($row['sessions'] ?? 0),
                    'blocked' => isset($blockedMap[$ip]),
                    'traffic_channel' => (string) ($row['traffic_channel'] ?? ''),
                    'utm_medium' => (string) ($row['utm_medium'] ?? ''),
                ]);
            }
        }

        echo json_encode([
            'success' => true,
            'days' => $days,
            'visitors' => $out,
            'live' => $live,
            'recent_orders' => $recentOrders,
            'blocked_count' => count($blockedRows),
        ]);
        exit();
    }

    if ($action === 'blocked') {
        $rows = tileandturf_db_fetch_all(
            $conn,
            'SELECT ip_address AS ip, city, region, country, reason, blocked_by, created_at AS blocked_at
             FROM blocked_ips ORDER BY created_at DESC'
        );
        echo json_encode(['success' => true, 'blocked' => $rows]);
        exit();
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Unknown action']);
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
        exit();
    }

    $action = $data['action'] ?? '';

    if ($action === 'block') {
        $ip = $data['ip'] ?? '';
        $selfIp = tileandturf_client_ip();
        if (tileandturf_normalize_ip($ip) !== '' && tileandturf_normalize_ip($ip) === tileandturf_normalize_ip($selfIp)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'You cannot block your own current IP.']);
            exit();
        }

        $result = tileandturf_block_ip($conn, $ip, [
            'city' => $data['city'] ?? '',
            'region' => $data['region'] ?? '',
            'country' => $data['country'] ?? '',
            'reason' => $data['reason'] ?? '',
            'blocked_by' => 'admin',
        ]);
        if (empty($result['success'])) {
            http_response_code(400);
        }
        echo json_encode($result);
        exit();
    }

    if ($action === 'unblock') {
        $result = tileandturf_unblock_ip($conn, $data['ip'] ?? '');
        if (empty($result['success'])) {
            http_response_code(400);
        }
        echo json_encode($result);
        exit();
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Unknown action']);
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
