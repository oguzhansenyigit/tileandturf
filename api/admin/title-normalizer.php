<?php
require_once '../config.php';
require_once __DIR__ . '/../title-helpers.php';

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

    if (!tileandturf_rate_limit_allowed('title_scan', 20, 300)) {
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => 'Too many scans. Try again shortly.']);
        exit();
    }

    try {
        echo json_encode(tileandturf_title_scan($conn));
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Scan failed: ' . $e->getMessage(),
        ]);
    }
    exit();
}

if ($method === 'POST') {
    if (!tileandturf_rate_limit_allowed('title_apply', 60, 300)) {
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

    if (($data['action'] ?? '') !== 'apply') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Unknown action']);
        exit();
    }

    $items = $data['items'] ?? [];
    if (!is_array($items) || count($items) === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No items to apply']);
        exit();
    }

    $updated = 0;
    $results = [];
    $errors = [];
    foreach ($items as $item) {
        try {
            $res = tileandturf_title_apply($conn, $item);
        } catch (Throwable $e) {
            $res = ['success' => false, 'id' => $item['id'] ?? null, 'error' => $e->getMessage()];
        }
        if (!empty($res['success'])) {
            if (!empty($res['changed'])) {
                $updated++;
            }
            $results[] = $res;
        } else {
            $errors[] = ['id' => $res['id'] ?? null, 'error' => $res['error'] ?? 'Failed'];
        }
    }

    echo json_encode([
        'success' => count($results) > 0,
        'updated' => $updated,
        'results' => $results,
        'errors' => $errors,
        'message' => "Applied to " . count($results) . " product(s); {$updated} changed.",
    ]);
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
