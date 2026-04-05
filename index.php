<?php
/**
 * Production shell: serves Vite build output (dist/index.html).
 * Do NOT reference /src/main.jsx here — that path only exists in Vite dev server.
 */
$googleAdsHeadTag = '';

try {
    ob_start();
    require_once __DIR__ . '/api/config.php';
    ob_end_clean();

    header('Content-Type: text/html; charset=UTF-8');

    if (isset($conn) && $conn instanceof mysqli && !$conn->connect_error) {
        $sql = "SELECT setting_value FROM settings WHERE setting_key = 'google_ads_head_tag' LIMIT 1";
        $res = $conn->query($sql);
        if ($res && $row = $res->fetch_assoc()) {
            $googleAdsHeadTag = (string)($row['setting_value'] ?? '');
        }
        $conn->close();
    }
} catch (Throwable $e) {
    // Continue without admin head injection
}

$distIndex = __DIR__ . '/dist/index.html';
if (!is_file($distIndex)) {
    http_response_code(503);
    header('Content-Type: text/html; charset=UTF-8');
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Build required</title></head><body>';
    echo '<p>Production build missing. Run <code>npm run build</code> and upload the <code>dist</code> folder to the server.</p>';
    echo '</body></html>';
    exit;
}

$html = file_get_contents($distIndex);
if ($html === false) {
    http_response_code(500);
    echo 'Failed to read dist/index.html';
    exit;
}

if (!empty($googleAdsHeadTag)) {
    $html = str_replace('</head>', $googleAdsHeadTag . "\n</head>", $html);
}

echo $html;
