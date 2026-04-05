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
    $path = htmlspecialchars(__DIR__ . '/dist/index.html', ENT_QUOTES, 'UTF-8');
    echo '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>dist klasörü yok</title>';
    echo '<style>body{font-family:system-ui,sans-serif;max-width:42rem;margin:2rem auto;padding:0 1rem;line-height:1.5}</style></head><body>';
    echo '<h1>Production build bulunamadı</h1>';
    echo '<p><strong>Bilgisayarınızda</strong> proje klasöründe şunu çalıştırın: <code>npm run build</code></p>';
    echo '<p>Oluşan <strong>dist</strong> klasörünün tamamını sunucuya yükleyin — <strong>index.php ile aynı dizinde</strong> olmalı (yani <code>dist/index.html</code> şu yolu bulabilmeli).</p>';
    echo '<p>Beklenen dosya: <code>' . $path . '</code></p>';
    echo '<p><small>İçinde şunlar olmalı: <code>dist/index.html</code>, <code>dist/assets/</code> (JS/CSS)</small></p>';
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
