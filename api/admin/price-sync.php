<?php
require_once '../config.php';
require_once __DIR__ . '/../price-sync-helpers.php';

tileandturf_require_admin();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'categories';

    if ($action === 'categories') {
        $cats = [];
        foreach (tileandturf_ps_categories() as $key => $cfg) {
            $cats[] = ['key' => $key, 'label' => $cfg['label'], 'url' => $cfg['url']];
        }
        echo json_encode(['success' => true, 'categories' => $cats]);
        exit();
    }

    if ($action === 'list') {
        if (!tileandturf_rate_limit_allowed('price_sync_list', 30, 300)) {
            http_response_code(429);
            echo json_encode(['success' => false, 'error' => 'Too many requests. Try again shortly.']);
            exit();
        }

        $key = $_GET['category'] ?? '';
        $cats = tileandturf_ps_categories();
        if (!isset($cats[$key])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Unknown category']);
            exit();
        }

        $res = tileandturf_ps_category_product_urls($cats[$key]['url']);
        if ($res['error']) {
            http_response_code(502);
            echo json_encode(['success' => false, 'error' => $res['error']]);
            exit();
        }

        echo json_encode([
            'success' => true,
            'category' => $key,
            'species' => $cats[$key]['species'],
            'urls' => $res['urls'],
            'count' => count($res['urls']),
        ]);
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

    if ($action === 'preview') {
        if (!tileandturf_rate_limit_allowed('price_sync_preview', 200, 300)) {
            http_response_code(429);
            echo json_encode(['success' => false, 'error' => 'Too many requests. Slow down.']);
            exit();
        }

        $url = $data['url'] ?? '';
        $species = $data['species'] ?? '';
        if (!tileandturf_ps_is_allowed_url($url)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'URL not allowed']);
            exit();
        }

        $html = tileandturf_ps_http_get($url);
        if ($html === null) {
            echo json_encode([
                'success' => false,
                'error' => 'Could not fetch product page',
                'url' => $url,
            ]);
            exit();
        }

        $external = tileandturf_ps_parse_product_page($html);
        $preview = tileandturf_ps_build_preview($conn, $external, $species, $url);
        $preview['url'] = $url;

        echo json_encode(['success' => true, 'preview' => $preview]);
        exit();
    }

    if ($action === 'apply') {
        if (!tileandturf_rate_limit_allowed('price_sync_apply', 200, 300)) {
            http_response_code(429);
            echo json_encode(['success' => false, 'error' => 'Too many requests. Slow down.']);
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
            $res = tileandturf_ps_apply_item($conn, $item);
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

    if ($action === 'add_drafts') {
        if (!tileandturf_rate_limit_allowed('price_sync_add_drafts', 50, 300)) {
            http_response_code(429);
            echo json_encode(['success' => false, 'error' => 'Too many requests. Slow down.']);
            exit();
        }

        $items = $data['items'] ?? [];
        if (!is_array($items) || count($items) === 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No products selected']);
            exit();
        }
        if (count($items) > 25) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Select at most 25 products at once']);
            exit();
        }

        $added = [];
        $errors = [];
        foreach ($items as $item) {
            $url = is_array($item) ? ($item['url'] ?? '') : '';
            $species = is_array($item) ? ($item['species'] ?? '') : '';
            $result = tileandturf_ps_add_draft($conn, $url, $species);
            if (!empty($result['success'])) {
                $added[] = $result;
            } else {
                $errors[] = [
                    'url' => $url,
                    'error' => $result['error'] ?? 'Could not add draft',
                ];
            }
        }

        echo json_encode([
            'success' => count($added) > 0,
            'added' => $added,
            'errors' => $errors,
            'message' => count($added) . ' product(s) added as hidden drafts.',
        ]);
        exit();
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Unknown action']);
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
