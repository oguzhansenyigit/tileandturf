<?php
/**
 * Admin analytics dashboard — orders, traffic, geo, products, devices.
 */
require_once '../config.php';
require_once __DIR__ . '/../analytics-helpers.php';
require_once __DIR__ . '/../attribution-helpers.php';

tileandturf_require_admin();
header('Content-Type: application/json');

try {
    if (function_exists('tileandturf_analytics_ensure_tables')) {
        tileandturf_analytics_ensure_tables($conn);
    }
    if (function_exists('tileandturf_attribution_ensure_tables')) {
        tileandturf_attribution_ensure_tables($conn);
    }

    $today = date('Y-m-d');

    $activeVisitors = 0;
    $activeRes = @$conn->query(
        "SELECT COUNT(*) AS c FROM active_visitors WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)"
    );
    if ($activeRes) {
        $activeVisitors = intval($activeRes->fetch_assoc()['c']);
    }

    $todayStatsRow = null;
    $ts = @$conn->query("SELECT * FROM statistics WHERE date = '$today' LIMIT 1");
    if ($ts && $ts->num_rows) {
        $todayStatsRow = $ts->fetch_assoc();
    }

    $hitsTodayRow = null;
    $hitsToday = @$conn->query(
        "SELECT COUNT(*) AS views, COUNT(DISTINCT session_id) AS visitors
         FROM page_hits WHERE DATE(created_at) = CURDATE()"
    );
    if ($hitsToday) {
        $hitsTodayRow = $hitsToday->fetch_assoc();
    }

    $todayStats = [
        'date' => $today,
        'page_views' => intval($hitsTodayRow['views'] ?? $todayStatsRow['page_views'] ?? 0),
        'unique_visitors' => intval($hitsTodayRow['visitors'] ?? $todayStatsRow['unique_visitors'] ?? 0),
    ];

    $oa = [];
    $ordersAgg = @$conn->query(
        "SELECT
            COUNT(*) AS total_orders,
            COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) AS revenue,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN DATE(created_at) = CURDATE() AND status != 'cancelled' THEN 1 ELSE 0 END) AS orders_today,
            COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() AND status != 'cancelled' THEN total ELSE 0 END), 0) AS revenue_today,
            SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status != 'cancelled' THEN 1 ELSE 0 END) AS orders_week,
            COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status != 'cancelled' THEN total ELSE 0 END), 0) AS revenue_week,
            SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND status != 'cancelled' THEN 1 ELSE 0 END) AS orders_month,
            COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND status != 'cancelled' THEN total ELSE 0 END), 0) AS revenue_month,
            COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total END), 0) AS avg_order
         FROM orders"
    );
    if ($ordersAgg) {
        $oa = $ordersAgg->fetch_assoc() ?: [];
    }

    $productsCount = 0;
    $pc = @$conn->query("SELECT COUNT(*) AS c FROM products WHERE status = 'active'");
    if ($pc) {
        $productsCount = intval($pc->fetch_assoc()['c']);
    }

    $trafficMap = [];
    $tr = @$conn->query(
        "SELECT DATE(created_at) AS day, COUNT(*) AS views, COUNT(DISTINCT session_id) AS visitors
         FROM page_hits
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
         GROUP BY DATE(created_at)
         ORDER BY day ASC"
    );
    if ($tr) {
        while ($row = $tr->fetch_assoc()) {
            $trafficMap[$row['day']] = [
                'views' => intval($row['views']),
                'visitors' => intval($row['visitors']),
            ];
        }
    }
    $revMap = [];
    $rr = @$conn->query(
        "SELECT DATE(created_at) AS day,
                COUNT(*) AS orders,
                COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) AS revenue
         FROM orders
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
         GROUP BY DATE(created_at)
         ORDER BY day ASC"
    );
    if ($rr) {
        while ($row = $rr->fetch_assoc()) {
            $revMap[$row['day']] = [
                'orders' => intval($row['orders']),
                'revenue' => round(floatval($row['revenue']), 2),
            ];
        }
    }
    $trafficSeries = [];
    for ($i = 13; $i >= 0; $i--) {
        $d = date('Y-m-d', strtotime("-$i days"));
        $trafficSeries[] = [
            'day' => $d,
            'views' => $trafficMap[$d]['views'] ?? 0,
            'visitors' => $trafficMap[$d]['visitors'] ?? 0,
            'orders' => $revMap[$d]['orders'] ?? 0,
            'revenue' => $revMap[$d]['revenue'] ?? 0,
        ];
    }

    $salesByState = [];
    $sbs = @$conn->query(
        "SELECT UPPER(TRIM(state)) AS state_code,
                COUNT(*) AS orders,
                COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) AS revenue
         FROM orders
         WHERE state IS NOT NULL AND TRIM(state) != ''
         GROUP BY UPPER(TRIM(state))
         ORDER BY revenue DESC"
    );
    if ($sbs) {
        while ($row = $sbs->fetch_assoc()) {
            $code = tileandturf_normalize_us_state($row['state_code'], $row['state_code']);
            if ($code === '' && strlen($row['state_code']) === 2) {
                $code = $row['state_code'];
            }
            if ($code === '') {
                continue;
            }
            if (!isset($salesByState[$code])) {
                $salesByState[$code] = ['state' => $code, 'orders' => 0, 'revenue' => 0];
            }
            $salesByState[$code]['orders'] += intval($row['orders']);
            $salesByState[$code]['revenue'] += floatval($row['revenue']);
        }
    }
    $salesByStateList = array_values($salesByState);
    usort($salesByStateList, function ($a, $b) {
        return $b['revenue'] <=> $a['revenue'];
    });
    foreach ($salesByStateList as &$s) {
        $s['revenue'] = round($s['revenue'], 2);
    }
    unset($s);

    $visitsByState = [];
    $vbs = @$conn->query(
        "SELECT UPPER(TRIM(region_code)) AS state_code,
                COUNT(*) AS hits,
                COUNT(DISTINCT session_id) AS visitors
         FROM page_hits
         WHERE country IN ('US', 'USA') AND region_code IS NOT NULL AND region_code != ''
           AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY UPPER(TRIM(region_code))
         ORDER BY hits DESC"
    );
    if ($vbs) {
        while ($row = $vbs->fetch_assoc()) {
            $code = tileandturf_normalize_us_state($row['state_code'], '');
            if ($code === '' && strlen($row['state_code']) === 2) {
                $code = $row['state_code'];
            }
            if ($code === '') {
                continue;
            }
            $visitsByState[] = [
                'state' => $code,
                'hits' => intval($row['hits']),
                'visitors' => intval($row['visitors']),
            ];
        }
    }

    $topPaths = [];
    $tp = @$conn->query(
        "SELECT path, COUNT(*) AS hits, COUNT(DISTINCT session_id) AS visitors
         FROM page_hits
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY path
         ORDER BY hits DESC
         LIMIT 12"
    );
    if ($tp) {
        while ($row = $tp->fetch_assoc()) {
            $topPaths[] = [
                'path' => $row['path'],
                'hits' => intval($row['hits']),
                'visitors' => intval($row['visitors']),
            ];
        }
    }

    $devices = [];
    $dv = @$conn->query(
        "SELECT device, COUNT(*) AS hits
         FROM page_hits
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY device
         ORDER BY hits DESC"
    );
    if ($dv) {
        while ($row = $dv->fetch_assoc()) {
            $devices[] = [
                'device' => $row['device'] ?: 'unknown',
                'hits' => intval($row['hits']),
            ];
        }
    }

    $topViewed = [];
    $tv = @$conn->query(
        "SELECT p.id, p.name, p.image, COALESCE(SUM(pv.view_count), 0) AS total_views
         FROM products p
         LEFT JOIN product_views pv ON p.id = pv.product_id
         WHERE p.status = 'active'
         GROUP BY p.id, p.name, p.image
         HAVING total_views > 0
         ORDER BY total_views DESC
         LIMIT 10"
    );
    if ($tv) {
        while ($row = $tv->fetch_assoc()) {
            $topViewed[] = [
                'id' => intval($row['id']),
                'name' => $row['name'],
                'image' => $row['image'],
                'total_views' => intval($row['total_views']),
            ];
        }
    }

    $topSelling = [];
    $tsell = @$conn->query(
        "SELECT oi.product_id, oi.product_name AS name, MAX(p.image) AS image,
                COUNT(DISTINCT oi.order_id) AS order_count,
                SUM(oi.quantity) AS units,
                COALESCE(SUM(oi.subtotal), 0) AS revenue
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
         LEFT JOIN products p ON p.id = oi.product_id
         GROUP BY oi.product_id, oi.product_name
         ORDER BY revenue DESC
         LIMIT 10"
    );
    if ($tsell) {
        while ($row = $tsell->fetch_assoc()) {
            $topSelling[] = [
                'id' => $row['product_id'] ? intval($row['product_id']) : null,
                'name' => $row['name'],
                'image' => $row['image'],
                'order_count' => intval($row['order_count']),
                'units' => intval($row['units']),
                'revenue' => round(floatval($row['revenue']), 2),
            ];
        }
    }

    $recentOrders = [];
    $ro = @$conn->query(
        "SELECT id, order_number, first_name, last_name, email, state, city, total, status, created_at
         FROM orders ORDER BY created_at DESC LIMIT 12"
    );
    if ($ro) {
        while ($row = $ro->fetch_assoc()) {
            $row['total'] = floatval($row['total']);
            $recentOrders[] = $row;
        }
    }

    $live = [];
    // Prefer product-aware live rows; fall back if product_id column not yet migrated
    $lv = @$conn->query(
        "SELECT av.path, av.product_id, av.country, av.region_code, av.city, av.last_activity,
                p.name AS product_name
         FROM active_visitors av
         LEFT JOIN products p ON p.id = av.product_id
         WHERE av.last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
         ORDER BY av.last_activity DESC
         LIMIT 25"
    );
    if (!$lv) {
        $lv = @$conn->query(
            "SELECT path, country, region_code, city, last_activity
             FROM active_visitors
             WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
             ORDER BY last_activity DESC
             LIMIT 25"
        );
    }
    if ($lv) {
        while ($row = $lv->fetch_assoc()) {
            $live[] = $row;
        }
    }

    $liveProducts = [];
    $lpr = @$conn->query(
        "SELECT av.product_id, p.name, p.image, COUNT(*) AS viewers
         FROM active_visitors av
         LEFT JOIN products p ON p.id = av.product_id
         WHERE av.last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
           AND av.product_id IS NOT NULL
         GROUP BY av.product_id, p.name, p.image
         ORDER BY viewers DESC
         LIMIT 30"
    );
    if ($lpr) {
        while ($row = $lpr->fetch_assoc()) {
            $liveProducts[] = [
                'product_id' => intval($row['product_id']),
                'name' => $row['name'] ?: ('Product #' . $row['product_id']),
                'image' => $row['image'],
                'viewers' => intval($row['viewers']),
            ];
        }
    }

    $liveBehavior = [
        'on_product' => 0,
        'in_cart_not_checkout' => 0,
        'on_checkout' => 0,
        'checkout_no_purchase' => 0,
    ];
    $op = @$conn->query(
        "SELECT COUNT(*) AS c FROM active_visitors
         WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) AND product_id IS NOT NULL"
    );
    if ($op && ($opr = $op->fetch_assoc())) {
        $liveBehavior['on_product'] = intval($opr['c']);
    }
    $oc = @$conn->query(
        "SELECT COUNT(*) AS c FROM active_visitors
         WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) AND path LIKE '/checkout%'"
    );
    if ($oc && ($ocr = $oc->fetch_assoc())) {
        $liveBehavior['on_checkout'] = intval($ocr['c']);
    }

    $hasFunnel = false;
    $feCheck = @$conn->query("SHOW TABLES LIKE 'funnel_events'");
    if ($feCheck && $feCheck->num_rows > 0) {
        $hasFunnel = true;
    }

    if ($hasFunnel) {
        $ic = @$conn->query(
            "SELECT COUNT(DISTINCT av.session_id) AS c
             FROM active_visitors av
             WHERE av.last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
               AND EXISTS (
                 SELECT 1 FROM funnel_events fe
                 WHERE BINARY fe.session_id = BINARY av.session_id AND BINARY fe.event_type = BINARY 'add_to_cart'
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
        if ($ic && ($icr = $ic->fetch_assoc())) {
            $liveBehavior['in_cart_not_checkout'] = intval($icr['c']);
        }
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
        if ($cnp && ($cnpr = $cnp->fetch_assoc())) {
            $liveBehavior['checkout_no_purchase'] = intval($cnpr['c']);
        }
    }

    $emptyFunnel = [
        'view_product' => 0,
        'add_to_cart' => 0,
        'begin_checkout' => 0,
        'purchase' => 0,
        'cart_no_checkout' => 0,
        'checkout_no_purchase' => 0,
    ];
    if ($hasFunnel && function_exists('tileandturf_funnel_window_stats')) {
        $funnelToday = tileandturf_funnel_window_stats($conn, 'CURDATE()');
        $funnel7d = tileandturf_funnel_window_stats($conn, 'DATE_SUB(NOW(), INTERVAL 7 DAY)');
        $funnel30d = tileandturf_funnel_window_stats($conn, 'DATE_SUB(NOW(), INTERVAL 30 DAY)');
    } else {
        $funnelToday = $emptyFunnel;
        $funnel7d = $emptyFunnel;
        $funnel30d = $emptyFunnel;
        // Legacy fallback from page_hits if funnel helpers missing
        $fp = @$conn->query(
            "SELECT
                SUM(CASE WHEN path LIKE '/product/%' OR product_id IS NOT NULL THEN 1 ELSE 0 END) AS product_views,
                SUM(CASE WHEN path LIKE '/checkout%' THEN 1 ELSE 0 END) AS checkout_hits
             FROM page_hits
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
        );
        if ($fp && ($fpr = $fp->fetch_assoc())) {
            $funnel30d['view_product'] = intval($fpr['product_views']);
            $funnel30d['begin_checkout'] = intval($fpr['checkout_hits']);
        }
        $funnel30d['purchase'] = intval($oa['orders_month'] ?? 0);
    }

    // Per-product funnel (unique sessions)
    $productFunnel = [];
    if ($hasFunnel) {
        $pf = @$conn->query(
            "SELECT
                fe.product_id,
                p.name,
                p.image,
                COUNT(DISTINCT CASE WHEN BINARY fe.event_type = BINARY 'view_product' THEN fe.session_id END) AS views,
                COUNT(DISTINCT CASE WHEN BINARY fe.event_type = BINARY 'add_to_cart' THEN fe.session_id END) AS add_to_cart,
                COUNT(DISTINCT CASE WHEN BINARY fe.event_type = BINARY 'begin_checkout' THEN fe.session_id END) AS checkouts,
                COUNT(DISTINCT CASE WHEN BINARY fe.event_type = BINARY 'purchase' THEN fe.session_id END) AS purchases
             FROM funnel_events fe
             LEFT JOIN products p ON p.id = fe.product_id
             WHERE fe.product_id IS NOT NULL
               AND fe.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY fe.product_id, p.name, p.image
             HAVING COUNT(DISTINCT CASE WHEN BINARY fe.event_type = BINARY 'view_product' THEN fe.session_id END) > 0
                 OR COUNT(DISTINCT CASE WHEN BINARY fe.event_type = BINARY 'add_to_cart' THEN fe.session_id END) > 0
                 OR COUNT(DISTINCT CASE WHEN BINARY fe.event_type = BINARY 'begin_checkout' THEN fe.session_id END) > 0
                 OR COUNT(DISTINCT CASE WHEN BINARY fe.event_type = BINARY 'purchase' THEN fe.session_id END) > 0
             ORDER BY views DESC, add_to_cart DESC
             LIMIT 40"
        );
        if ($pf) {
            while ($row = $pf->fetch_assoc()) {
                $views = intval($row['views']);
                $atc = intval($row['add_to_cart']);
                $chk = intval($row['checkouts']);
                $purch = intval($row['purchases']);
                $productFunnel[] = [
                    'product_id' => intval($row['product_id']),
                    'name' => $row['name'] ?: ('Product #' . $row['product_id']),
                    'image' => $row['image'],
                    'views' => $views,
                    'add_to_cart' => $atc,
                    'checkouts' => $chk,
                    'purchases' => $purch,
                    'view_to_cart_pct' => $views > 0 ? round(($atc / $views) * 100, 1) : 0,
                    'cart_to_checkout_pct' => $atc > 0 ? round(($chk / $atc) * 100, 1) : 0,
                    'checkout_to_order_pct' => $chk > 0 ? round(($purch / $chk) * 100, 1) : 0,
                ];
            }
        }
    }

    // Keep legacy keys for older UI bits
    $funnel = [
        'product_views' => intval($funnel30d['view_product'] ?? 0),
        'checkout_hits' => intval($funnel30d['begin_checkout'] ?? 0),
        'orders' => intval($funnel30d['purchase'] ?? 0) > 0
            ? intval($funnel30d['purchase'])
            : intval($oa['orders_month'] ?? 0),
        'add_to_cart' => intval($funnel30d['add_to_cart'] ?? 0),
        'cart_no_checkout' => intval($funnel30d['cart_no_checkout'] ?? 0),
        'checkout_no_purchase' => intval($funnel30d['checkout_no_purchase'] ?? 0),
        'today' => $funnelToday,
        '7d' => $funnel7d,
        '30d' => $funnel30d,
    ];

    $payload = [
        'success' => true,
        'active_visitors' => $activeVisitors,
        'today' => $todayStats,
        'kpis' => [
            'products' => $productsCount,
            'orders' => intval($oa['total_orders'] ?? 0),
            'revenue' => round(floatval($oa['revenue'] ?? 0), 2),
            'avg_order' => round(floatval($oa['avg_order'] ?? 0), 2),
            'pending' => intval($oa['pending'] ?? 0),
            'orders_today' => intval($oa['orders_today'] ?? 0),
            'revenue_today' => round(floatval($oa['revenue_today'] ?? 0), 2),
            'orders_week' => intval($oa['orders_week'] ?? 0),
            'revenue_week' => round(floatval($oa['revenue_week'] ?? 0), 2),
            'orders_month' => intval($oa['orders_month'] ?? 0),
            'revenue_month' => round(floatval($oa['revenue_month'] ?? 0), 2),
        ],
        'series' => $trafficSeries,
        'sales_by_state' => $salesByStateList,
        'visits_by_state' => $visitsByState,
        'top_paths' => $topPaths,
        'devices' => $devices,
        'top_viewed' => $topViewed,
        'top_selling' => $topSelling,
        'recent_orders' => $recentOrders,
        'live_visitors' => $live,
        'live_by_state' => tileandturf_live_by_state($conn),
        'live_products' => $liveProducts,
        'live_behavior' => $liveBehavior,
        'funnel' => $funnel,
        'product_funnel' => $productFunnel,
        'totals' => [
            'products' => $productsCount,
            'orders' => intval($oa['total_orders'] ?? 0),
            'revenue' => round(floatval($oa['revenue'] ?? 0), 2),
        ],
        'topProducts' => $topViewed,
        'recentOrders' => $recentOrders,
    ];

            $flags = defined('JSON_INVALID_UTF8_SUBSTITUTE') ? JSON_INVALID_UTF8_SUBSTITUTE : 0;
    $json = json_encode($payload, $flags);
    if ($json === false) {
        $json = json_encode([
            'success' => true,
            'active_visitors' => $activeVisitors,
            'kpis' => $payload['kpis'],
            'totals' => $payload['totals'],
            'funnel' => $funnel,
            'product_funnel' => [],
            'warning' => 'Partial dashboard: JSON encode failed on some fields',
        ]);
    }
    echo $json;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Dashboard failed: ' . $e->getMessage(),
    ]);
}

$conn->close();
