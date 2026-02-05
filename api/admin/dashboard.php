<?php
require_once '../config.php';

header('Content-Type: application/json');

// Get today's statistics
$today = date('Y-m-d');
$sql = "SELECT * FROM statistics WHERE date = '$today'";
$result = $conn->query($sql);
$todayStats = $result->num_rows > 0 ? $result->fetch_assoc() : [
    'date' => $today,
    'page_views' => 0,
    'unique_visitors' => 0,
    'orders_count' => 0,
    'revenue' => 0
];

// Get last 7 days statistics
$sql = "SELECT * FROM statistics WHERE date >= DATE_SUB('$today', INTERVAL 7 DAY) ORDER BY date DESC";
$result = $conn->query($sql);
$last7Days = [];
while ($row = $result->fetch_assoc()) {
    $last7Days[] = $row;
}

// Get total products
$sql = "SELECT COUNT(*) as total FROM products WHERE status = 'active'";
$result = $conn->query($sql);
$totalProducts = $result->fetch_assoc()['total'];

// Get total orders
$sql = "SELECT COUNT(*) as total FROM orders";
$result = $conn->query($sql);
$totalOrders = $result->fetch_assoc()['total'];

// Get total revenue
$sql = "SELECT SUM(total) as total FROM orders WHERE status != 'cancelled'";
$result = $conn->query($sql);
$totalRevenue = $result->fetch_assoc()['total'] ?? 0;

// Get top viewed products
$sql = "SELECT p.id, p.name, SUM(pv.view_count) as total_views 
        FROM products p 
        LEFT JOIN product_views pv ON p.id = pv.product_id 
        WHERE p.status = 'active'
        GROUP BY p.id 
        ORDER BY total_views DESC 
        LIMIT 10";
$result = $conn->query($sql);
$topProducts = [];
while ($row = $result->fetch_assoc()) {
    $topProducts[] = $row;
}

// Get recent orders
$sql = "SELECT * FROM orders ORDER BY created_at DESC LIMIT 10";
$result = $conn->query($sql);
$recentOrders = [];
while ($row = $result->fetch_assoc()) {
    $recentOrders[] = $row;
}

echo json_encode([
    'success' => true,
    'today' => $todayStats,
    'last7Days' => $last7Days,
    'totals' => [
        'products' => (int)$totalProducts,
        'orders' => (int)$totalOrders,
        'revenue' => (float)$totalRevenue
    ],
    'topProducts' => $topProducts,
    'recentOrders' => $recentOrders
]);

$conn->close();
?>

