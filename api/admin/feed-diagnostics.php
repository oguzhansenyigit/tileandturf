<?php
require_once '../config.php';

header('Content-Type: application/json');

// Admin-only: add auth check if needed
// if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) { http_response_code(403); exit; }

$hasIsHidden = false;
$checkCol = $conn->query("SELECT COUNT(*) as c FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = '" . $conn->real_escape_string(DB_NAME) . "' AND TABLE_NAME = 'products' AND COLUMN_NAME = 'is_hidden'");
if ($checkCol && ($r = $checkCol->fetch_assoc()) && $r['c'] > 0) {
    $hasIsHidden = true;
}

$where = ["p.status = 'active'"];
if ($hasIsHidden) {
    $where[] = "(p.is_hidden = 0 OR p.is_hidden IS NULL)";
}

$sql = "SELECT p.id, p.name, p.slug, p.image, p.price, p.description, p.stock, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE " . implode(' AND ', $where) . "
        ORDER BY p.name";
$result = $conn->query($sql);

$ok = [];
$issues = [
    'no_image' => [],
    'no_price' => [],
    'short_description' => [],
    'no_title' => [],
    'no_slug' => []
];

while ($result && $row = $result->fetch_assoc()) {
    $p = [
        'id' => (int)$row['id'],
        'name' => $row['name'] ?? '',
        'slug' => $row['slug'] ?? '',
        'category' => $row['category_name'] ?? null
    ];
    $hasIssue = false;

    if (empty(trim($row['name'] ?? ''))) {
        $issues['no_title'][] = $p;
        $hasIssue = true;
    }
    if (empty(trim($row['slug'] ?? ''))) {
        $issues['no_slug'][] = $p;
        $hasIssue = true;
    }
    if (empty(trim($row['image'] ?? ''))) {
        $issues['no_image'][] = $p;
        $hasIssue = true;
    }
    if (((float)($row['price'] ?? 0)) <= 0) {
        $issues['no_price'][] = $p;
        $hasIssue = true;
    }
    $descLen = strlen(strip_tags($row['description'] ?? ''));
    if ($descLen < 10) {
        $issues['short_description'][] = array_merge($p, ['description_length' => $descLen]);
        $hasIssue = true;
    }

    if (!$hasIssue) {
        $ok[] = $p;
    }
}

$total = count($ok) + count($issues['no_image']) + count($issues['no_price']) + count($issues['short_description']) + count($issues['no_title']) + count($issues['no_slug']);
$totalIssues = count($issues['no_image']) + count($issues['no_price']) + count($issues['short_description']) + count($issues['no_title']) + count($issues['no_slug']);

// Deduplicate - a product can have multiple issues
$allIssueIds = [];
foreach (['no_image', 'no_price', 'short_description', 'no_title', 'no_slug'] as $k) {
    foreach ($issues[$k] as $item) {
        $allIssueIds[$item['id']] = true;
    }
}

echo json_encode([
    'total_active' => $total,
    'feed_ready' => count($ok),
    'with_issues' => count($allIssueIds),
    'issues' => $issues,
    'summary' => [
        'no_image' => count($issues['no_image']),
        'no_price' => count($issues['no_price']),
        'short_description' => count($issues['short_description']),
        'no_title' => count($issues['no_title']),
        'no_slug' => count($issues['no_slug'])
    ]
], JSON_UNESCAPED_UNICODE);

$conn->close();
