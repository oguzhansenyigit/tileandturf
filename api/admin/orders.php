<?php
/**
 * Admin orders hub: list (search/filter), stats, top products, update, delete.
 */
require_once '../config.php';

tileandturf_require_admin();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? ($_POST['action'] ?? null);

if ($method === 'GET' && ($action === 'stats' || isset($_GET['stats']))) {
    echo json_encode(['success' => true, 'stats' => tileandturf_admin_order_stats($conn)]);
    $conn->close();
    exit();
}

/** Lightweight poll for live admin order notifications */
if ($method === 'GET' && ($action === 'poll' || isset($_GET['poll']))) {
    try {
        $sinceId = max(0, intval($_GET['since_id'] ?? 0));

        $latestRow = tileandturf_db_fetch_one(
            $conn,
            'SELECT COALESCE(MAX(id), 0) AS max_id FROM orders',
            ''
        );
        $latestId = intval(($latestRow ?? [])['max_id'] ?? 0);

        $pendingRow = tileandturf_db_fetch_one(
            $conn,
            "SELECT COUNT(*) AS c FROM orders WHERE status = 'pending'",
            ''
        );
        $pendingCount = intval(($pendingRow ?? [])['c'] ?? 0);

        $todayRow = tileandturf_db_fetch_one(
            $conn,
            "SELECT COUNT(*) AS c FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'cancelled'",
            ''
        );
        $todayCount = intval(($todayRow ?? [])['c'] ?? 0);

        $newOrders = [];
        if ($sinceId > 0 && $latestId > $sinceId) {
            $rows = tileandturf_db_fetch_all(
                $conn,
                "SELECT id, order_number, first_name, last_name, email, phone, total, status, created_at,
                        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = orders.id) AS item_count
                 FROM orders
                 WHERE id > ?
                 ORDER BY id DESC
                 LIMIT 25",
                'i',
                $sinceId
            );
            foreach ($rows as $row) {
                $newOrders[] = [
                    'id' => intval($row['id']),
                    'order_number' => $row['order_number'] ?: ('ORD-' . $row['id']),
                    'customerName' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                    'email' => $row['email'] ?? '',
                    'phone' => $row['phone'] ?? '',
                    'total' => floatval($row['total'] ?? 0),
                    'status' => $row['status'] ?? 'pending',
                    'item_count' => intval($row['item_count'] ?? 0),
                    'created_at' => $row['created_at'] ?? '',
                ];
            }
        } elseif ($sinceId <= 0) {
            // First poll: establish baseline without flooding toasts
            $seed = tileandturf_db_fetch_one(
                $conn,
                'SELECT id, order_number, first_name, last_name, total, status, created_at FROM orders ORDER BY id DESC LIMIT 1',
                ''
            );
            if ($seed) {
                $latestId = max($latestId, intval($seed['id']));
            }
        }

        echo json_encode([
            'success' => true,
            'latest_id' => $latestId,
            'pending_count' => $pendingCount,
            'today_count' => $todayCount,
            'new_orders' => $newOrders,
            'has_new' => count($newOrders) > 0,
            'server_time' => date('c'),
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Order poll failed',
            'detail' => $e->getMessage(),
        ]);
    }
    $conn->close();
    exit();
}

if ($method === 'GET' && ($action === 'insights' || isset($_GET['insights']))) {
    echo json_encode([
        'success' => true,
        'top_products' => tileandturf_admin_top_products($conn),
        'most_viewed' => tileandturf_admin_most_viewed($conn),
        'status_breakdown' => tileandturf_admin_status_breakdown($conn),
        'recent_revenue' => tileandturf_admin_recent_revenue($conn),
    ]);
    $conn->close();
    exit();
}

if ($method === 'GET') {
    $search = trim((string)($_GET['search'] ?? ''));
    $status = trim((string)($_GET['status'] ?? ''));
    $dateFrom = trim((string)($_GET['date_from'] ?? ''));
    $dateTo = trim((string)($_GET['date_to'] ?? ''));
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(100, max(10, intval($_GET['limit'] ?? 25)));
    $offset = ($page - 1) * $limit;

    $where = ['1=1'];
    $types = '';
    $params = [];

    if ($search !== '') {
        $like = '%' . $search . '%';
        $where[] = '(o.order_number LIKE ? OR o.first_name LIKE ? OR o.last_name LIKE ? OR o.email LIKE ? OR o.phone LIKE ? OR CONCAT(o.first_name, \' \', o.last_name) LIKE ?)';
        $types .= 'ssssss';
        array_push($params, $like, $like, $like, $like, $like, $like);
    }

    $allowedStatus = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if ($status !== '' && in_array($status, $allowedStatus, true)) {
        $where[] = 'o.status = ?';
        $types .= 's';
        $params[] = $status;
    }

    if ($dateFrom !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
        $where[] = 'DATE(o.created_at) >= ?';
        $types .= 's';
        $params[] = $dateFrom;
    }
    if ($dateTo !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
        $where[] = 'DATE(o.created_at) <= ?';
        $types .= 's';
        $params[] = $dateTo;
    }

    $whereSql = implode(' AND ', $where);

    $countRow = tileandturf_db_fetch_one(
        $conn,
        "SELECT COUNT(*) AS cnt FROM orders o WHERE $whereSql",
        $types,
        ...$params
    );
    $total = intval($countRow['cnt'] ?? 0);

    $listTypes = $types . 'ii';
    $listParams = array_merge($params, [$limit, $offset]);
    $rows = tileandturf_db_fetch_all(
        $conn,
        "SELECT o.*,
                (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
         FROM orders o
         WHERE $whereSql
         ORDER BY o.created_at DESC
         LIMIT ? OFFSET ?",
        $listTypes,
        ...$listParams
    );

    $orders = [];
    foreach ($rows as $row) {
        $row['customerName'] = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
        $row['total'] = floatval($row['total'] ?? 0);
        $row['item_count'] = intval($row['item_count'] ?? 0);
        $orders[] = $row;
    }

    echo json_encode([
        'success' => true,
        'orders' => $orders,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => max(1, (int)ceil($total / $limit)),
        ],
    ]);
    $conn->close();
    exit();
}

if ($method === 'POST' || $method === 'PUT' || $method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        $data = $_POST;
    }
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
        $conn->close();
        exit();
    }

    $postAction = $data['action'] ?? $action ?? '';

    if ($method === 'DELETE' || $postAction === 'delete' || $postAction === 'delete_bulk') {
        $rawIds = $data['orderIds'] ?? $data['ids'] ?? null;
        $orderIds = [];
        if (is_array($rawIds)) {
            foreach ($rawIds as $rawId) {
                $id = intval($rawId);
                if ($id > 0) {
                    $orderIds[] = $id;
                }
            }
            $orderIds = array_values(array_unique($orderIds));
        } else {
            $orderId = intval($data['orderId'] ?? $data['id'] ?? $_GET['id'] ?? 0);
            if ($orderId > 0) {
                $orderIds[] = $orderId;
            }
        }

        if (count($orderIds) === 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Order ID required']);
            $conn->close();
            exit();
        }

        $deleted = 0;
        foreach ($orderIds as $orderId) {
            // order_items cascade via FK when present; delete items first for safety
            tileandturf_db_execute($conn, 'DELETE FROM order_items WHERE order_id = ?', 'i', $orderId);
            $ok = tileandturf_db_execute($conn, 'DELETE FROM orders WHERE id = ?', 'i', $orderId);
            if ($ok !== false) {
                $deleted++;
            }
        }

        if ($deleted === 0) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to delete order(s)']);
            $conn->close();
            exit();
        }

        $msg = $deleted === 1 ? 'Order deleted' : ($deleted . ' orders deleted');
        echo json_encode(['success' => true, 'message' => $msg, 'deleted' => $deleted]);
        $conn->close();
        exit();
    }

    if ($postAction === 'update' || $postAction === 'update_status' || isset($data['orderId'])) {
        $orderId = intval($data['orderId'] ?? $data['id'] ?? 0);
        if ($orderId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Order ID required']);
            $conn->close();
            exit();
        }

        $existing = tileandturf_db_fetch_one($conn, 'SELECT id FROM orders WHERE id = ? LIMIT 1', 'i', $orderId);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Order not found']);
            $conn->close();
            exit();
        }

        $allowedStatus = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
        $sets = [];
        $types = '';
        $params = [];

        $fields = [
            'status' => 's',
            'first_name' => 's',
            'last_name' => 's',
            'email' => 's',
            'phone' => 's',
            'address' => 's',
            'city' => 's',
            'state' => 's',
            'zip_code' => 's',
            'country' => 's',
            'payment_method' => 's',
            'total' => 'd',
        ];

        foreach ($fields as $field => $type) {
            if (!array_key_exists($field, $data)) {
                continue;
            }
            if ($field === 'status') {
                $status = trim((string)$data['status']);
                if (!in_array($status, $allowedStatus, true)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Invalid status']);
                    $conn->close();
                    exit();
                }
                $sets[] = 'status = ?';
                $types .= 's';
                $params[] = $status;
                continue;
            }
            if ($field === 'total') {
                $sets[] = 'total = ?';
                $types .= 'd';
                $params[] = floatval($data['total']);
                continue;
            }
            $sets[] = "$field = ?";
            $types .= 's';
            $params[] = trim((string)$data[$field]);
        }

        // Optional line-item updates
        if (!empty($data['items']) && is_array($data['items'])) {
            $newTotal = 0;
            foreach ($data['items'] as $item) {
                $itemId = intval($item['id'] ?? 0);
                if ($itemId <= 0) {
                    continue;
                }
                $qty = max(0, intval($item['quantity'] ?? 1));
                $price = floatval($item['product_price'] ?? $item['price'] ?? 0);
                $subtotal = isset($item['subtotal'])
                    ? floatval($item['subtotal'])
                    : round($price * max(1, $qty), 2);
                $size = isset($item['selected_size']) ? trim((string)$item['selected_size']) : null;
                $name = isset($item['product_name']) ? trim((string)$item['product_name']) : null;

                if ($qty <= 0) {
                    tileandturf_db_execute($conn, 'DELETE FROM order_items WHERE id = ? AND order_id = ?', 'ii', $itemId, $orderId);
                    continue;
                }

                if ($name !== null && $size !== null) {
                    tileandturf_db_execute(
                        $conn,
                        'UPDATE order_items SET product_name = ?, product_price = ?, quantity = ?, subtotal = ?, selected_size = ? WHERE id = ? AND order_id = ?',
                        'sdisii',
                        $name,
                        $price,
                        $qty,
                        $subtotal,
                        $size,
                        $itemId,
                        $orderId
                    );
                } elseif ($name !== null) {
                    tileandturf_db_execute(
                        $conn,
                        'UPDATE order_items SET product_name = ?, product_price = ?, quantity = ?, subtotal = ? WHERE id = ? AND order_id = ?',
                        'sdidii',
                        $name,
                        $price,
                        $qty,
                        $subtotal,
                        $itemId,
                        $orderId
                    );
                } else {
                    tileandturf_db_execute(
                        $conn,
                        'UPDATE order_items SET product_price = ?, quantity = ?, subtotal = ? WHERE id = ? AND order_id = ?',
                        'didii',
                        $price,
                        $qty,
                        $subtotal,
                        $itemId,
                        $orderId
                    );
                }
                $newTotal += $subtotal;
            }
            if (!array_key_exists('total', $data)) {
                $sets[] = 'total = ?';
                $types .= 'd';
                $params[] = round($newTotal, 2);
            }
        }

        if (empty($sets)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            $conn->close();
            exit();
        }

        $types .= 'i';
        $params[] = $orderId;
        $sql = 'UPDATE orders SET ' . implode(', ', $sets) . ' WHERE id = ?';
        $ok = tileandturf_db_execute($conn, $sql, $types, ...$params);
        if ($ok === false) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Update failed']);
            $conn->close();
            exit();
        }

        echo json_encode(['success' => true, 'message' => 'Order updated']);
        $conn->close();
        exit();
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Unknown action']);
    $conn->close();
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
$conn->close();

function tileandturf_admin_order_stats($conn) {
    $base = tileandturf_db_fetch_one(
        $conn,
        "SELECT
            COUNT(*) AS total_orders,
            COALESCE(SUM(total), 0) AS total_revenue,
            COALESCE(AVG(total), 0) AS avg_order,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing,
            SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
         FROM orders",
        ''
    );

    $today = tileandturf_db_fetch_one(
        $conn,
        "SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
         FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'cancelled'",
        ''
    );
    $week = tileandturf_db_fetch_one(
        $conn,
        "SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
         FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status != 'cancelled'",
        ''
    );
    $month = tileandturf_db_fetch_one(
        $conn,
        "SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
         FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND status != 'cancelled'",
        ''
    );

    return [
        'total_orders' => intval($base['total_orders'] ?? 0),
        'total_revenue' => round(floatval($base['total_revenue'] ?? 0), 2),
        'avg_order' => round(floatval($base['avg_order'] ?? 0), 2),
        'pending' => intval($base['pending'] ?? 0),
        'processing' => intval($base['processing'] ?? 0),
        'shipped' => intval($base['shipped'] ?? 0),
        'completed' => intval($base['completed'] ?? 0),
        'cancelled' => intval($base['cancelled'] ?? 0),
        'today_orders' => intval($today['orders'] ?? 0),
        'today_revenue' => round(floatval($today['revenue'] ?? 0), 2),
        'week_orders' => intval($week['orders'] ?? 0),
        'week_revenue' => round(floatval($week['revenue'] ?? 0), 2),
        'month_orders' => intval($month['orders'] ?? 0),
        'month_revenue' => round(floatval($month['revenue'] ?? 0), 2),
    ];
}

function tileandturf_admin_top_products($conn) {
    $rows = tileandturf_db_fetch_all(
        $conn,
        "SELECT
            oi.product_id,
            oi.product_name,
            COUNT(DISTINCT oi.order_id) AS order_count,
            SUM(oi.quantity) AS units_sold,
            COALESCE(SUM(oi.subtotal), 0) AS revenue,
            MAX(p.image) AS image
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi.order_id
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE o.status != 'cancelled'
         GROUP BY oi.product_id, oi.product_name
         ORDER BY revenue DESC
         LIMIT 10",
        ''
    );

    $out = [];
    foreach ($rows as $row) {
        $out[] = [
            'product_id' => $row['product_id'] ? intval($row['product_id']) : null,
            'name' => $row['product_name'],
            'order_count' => intval($row['order_count']),
            'units_sold' => intval($row['units_sold']),
            'revenue' => round(floatval($row['revenue']), 2),
            'image' => $row['image'] ?? '',
        ];
    }
    return $out;
}

function tileandturf_admin_most_viewed($conn) {
    // Gracefully empty if product_views missing
    $check = @$conn->query("SHOW TABLES LIKE 'product_views'");
    if (!$check || $check->num_rows === 0) {
        return [];
    }

    $rows = tileandturf_db_fetch_all(
        $conn,
        "SELECT p.id AS product_id, p.name, p.image,
                COALESCE(SUM(pv.view_count), 0) AS views
         FROM products p
         INNER JOIN product_views pv ON pv.product_id = p.id
         GROUP BY p.id, p.name, p.image
         ORDER BY views DESC
         LIMIT 10",
        ''
    );

    $out = [];
    foreach ($rows as $row) {
        $out[] = [
            'product_id' => intval($row['product_id']),
            'name' => $row['name'],
            'image' => $row['image'] ?? '',
            'views' => intval($row['views']),
        ];
    }
    return $out;
}

function tileandturf_admin_status_breakdown($conn) {
    $rows = tileandturf_db_fetch_all(
        $conn,
        "SELECT status, COUNT(*) AS cnt, COALESCE(SUM(total), 0) AS revenue
         FROM orders GROUP BY status",
        ''
    );
    $out = [];
    foreach ($rows as $row) {
        $out[] = [
            'status' => $row['status'],
            'count' => intval($row['cnt']),
            'revenue' => round(floatval($row['revenue']), 2),
        ];
    }
    return $out;
}

function tileandturf_admin_recent_revenue($conn) {
    $rows = tileandturf_db_fetch_all(
        $conn,
        "SELECT DATE(created_at) AS day,
                COUNT(*) AS orders,
                COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) AS revenue
         FROM orders
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
         GROUP BY DATE(created_at)
         ORDER BY day ASC",
        ''
    );
    $out = [];
    foreach ($rows as $row) {
        $out[] = [
            'day' => $row['day'],
            'orders' => intval($row['orders']),
            'revenue' => round(floatval($row['revenue']), 2),
        ];
    }
    return $out;
}
