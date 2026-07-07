<?php
require_once '../config.php';
require_once __DIR__ . '/../seo-assistant-helpers.php';

tileandturf_require_admin();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'scan';

    if ($action !== 'scan') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Unknown action']);
        exit();
    }

    if (!tileandturf_rate_limit_allowed('seo_assistant_scan', 10, 300)) {
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => 'Too many scans. Try again in a few minutes.']);
        exit();
    }

    echo json_encode(tileandturf_seo_scan($conn));
    exit();
}

if ($method === 'POST') {
    if (!tileandturf_rate_limit_allowed('seo_assistant_write', 20, 300)) {
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => 'Too many requests. Try again later.']);
        exit();
    }

    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
        exit();
    }

    $action = $data['action'] ?? '';

    if ($action === 'suggest') {
        $productId = intval($data['product_id'] ?? 0);
        $useAi = !empty($data['use_ai']);

        if (!$productId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'product_id required']);
            exit();
        }

        $product = tileandturf_db_fetch_one(
            $conn,
            "SELECT p.*, c.name AS category_name FROM products p
             LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ? LIMIT 1",
            'i',
            $productId
        );

        if (!$product) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Product not found']);
            exit();
        }

        $base = tileandturf_seo_build_suggestions($product, $product['category_name'] ?? '', []);
        $titleCounts = [];
        if (!empty($product['meta_title'])) {
            $titleCounts[$product['meta_title']] = 1;
        }
        $finding = tileandturf_seo_analyze_product($product, $product['category_name'] ?? '', $titleCounts);
        if ($finding) {
            $issueCodes = array_map(function ($issue) {
                return $issue['code'];
            }, $finding['issues']);
            $base = tileandturf_seo_build_suggestions($product, $product['category_name'] ?? '', $issueCodes);
        }

        if ($useAi && tileandturf_openai_api_key() !== '') {
            $result = tileandturf_openai_enhance_product_seo($product, $product['category_name'] ?? '', $base);
            echo json_encode([
                'success' => $result['success'],
                'product_id' => $productId,
                'suggested' => $result['suggested'],
                'ai_used' => $result['ai_used'],
                'error' => $result['error'] ?? null,
            ]);
            exit();
        }

        echo json_encode([
            'success' => true,
            'product_id' => $productId,
            'suggested' => $base,
            'ai_used' => false,
        ]);
        exit();
    }

    if ($action === 'apply') {
        $items = $data['items'] ?? [];
        if (!is_array($items) || count($items) === 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No items to apply']);
            exit();
        }

        $updated = 0;
        $errors = [];
        $results = [];
        foreach ($items as $item) {
            $result = tileandturf_seo_apply_product($conn, $item);
            if ($result['success']) {
                $updated++;
                $results[] = $result;
            } else {
                $errors[] = ['id' => $item['id'] ?? null, 'error' => $result['error'] ?? 'Failed'];
            }
        }

        echo json_encode([
            'success' => $updated > 0,
            'updated' => $updated,
            'errors' => $errors,
            'results' => $results,
            'message' => $updated > 0
                ? "Updated SEO for {$updated} product(s)."
                : 'No products were updated. Check errors.',
        ]);
        exit();
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Unknown action']);
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);

$conn->close();
