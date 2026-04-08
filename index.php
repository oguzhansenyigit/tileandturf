<?php
/**
 * Production shell: serves Vite build output.
 * Looks for built index.html in common deploy layouts.
 */
$headTrackingSnippets = '';
$bodyTrackingSnippets = '';

try {
    ob_start();
    require_once __DIR__ . '/api/config.php';
    ob_end_clean();

    header('Content-Type: text/html; charset=UTF-8');

    if (isset($conn) && $conn instanceof mysqli && !$conn->connect_error) {
        $sql = "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('head_tracking_snippets','body_tracking_snippets','google_ads_head_tag')";
        $res = $conn->query($sql);
        $map = [];
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $map[$row['setting_key']] = (string)($row['setting_value'] ?? '');
            }
        }
        $headTrackingSnippets = trim($map['head_tracking_snippets'] ?? '');
        if ($headTrackingSnippets === '') {
            $headTrackingSnippets = trim($map['google_ads_head_tag'] ?? '');
        }
        $bodyTrackingSnippets = trim($map['body_tracking_snippets'] ?? '');
        $conn->close();
    }
} catch (Throwable $e) {
    // Continue without admin head injection
}

/**
 * Find a production-built index.html (has /assets/, not Vite dev /src/main.jsx).
 */
function tileandturf_resolve_built_index(string $baseDir): ?string
{
    $candidates = [
        $baseDir . DIRECTORY_SEPARATOR . 'dist' . DIRECTORY_SEPARATOR . 'index.html',
        $baseDir . DIRECTORY_SEPARATOR . 'index.html',
    ];
    foreach ($candidates as $path) {
        if (!is_file($path) || !is_readable($path)) {
            continue;
        }
        $head = @file_get_contents($path, false, null, 0, 20000);
        if ($head === false || $head === '') {
            continue;
        }
        // Dev index: would break production
        if (preg_match('#/src/main\.jsx#', $head)) {
            continue;
        }
        // Built bundle references hashed assets
        if (strpos($head, '/assets/') !== false || strpos($head, '"/assets/') !== false) {
            return $path;
        }
    }
    return null;
}

$baseDir = __DIR__;
$distIndex = tileandturf_resolve_built_index($baseDir);

if ($distIndex === null) {
    http_response_code(503);
    header('Content-Type: text/html; charset=UTF-8');
    $d1 = htmlspecialchars($baseDir . '/dist/index.html', ENT_QUOTES, 'UTF-8');
    $d2 = htmlspecialchars($baseDir . '/index.html', ENT_QUOTES, 'UTF-8');
    $hasDistAssets = is_dir($baseDir . '/dist/assets');
    $hasDistIndex = is_file($baseDir . '/dist/index.html');
    $hasRootAssets = is_dir($baseDir . '/assets');
    $hasRootIndex = is_file($baseDir . '/index.html');

    echo '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Build bulunamadı</title>';
    echo '<style>body{font-family:system-ui,sans-serif;max-width:44rem;margin:2rem auto;padding:0 1rem;line-height:1.55}code{background:#f3f4f6;padding:.1rem .35rem;border-radius:4px}</style></head><body>';
    echo '<h1>Production build bulunamadı</h1>';
    echo '<p><code>index.php</code> şu dosyalardan <strong>birini</strong> arıyor (içinde <code>/assets/</code> olan, <strong>build</strong> edilmiş <code>index.html</strong>):</p>';
    echo '<ul><li><code>' . $d1 . '</code> (önerilen)</li><li>veya kökte <code>' . $d2 . '</code> (dist içeriğini köke açtıysanız)</li></ul>';

    echo '<p><strong>Sunucu kontrolü (şu an):</strong></p><ul>';
    echo '<li><code>dist/index.html</code> → ' . ($hasDistIndex ? '✓ var' : '✗ yok') . '</li>';
    echo '<li><code>dist/assets/</code> → ' . ($hasDistAssets ? '✓ var' : '✗ yok') . '</li>';
    echo '<li><code>index.html</code> (kök) → ' . ($hasRootIndex ? '✓ var' : '✗ yok') . '</li>';
    echo '<li><code>assets/</code> (kök) → ' . ($hasRootAssets ? '✓ var' : '✗ yok') . '</li>';
    echo '</ul>';

    if ($hasDistAssets && !$hasDistIndex) {
        echo '<p style="color:#b45309"><strong>Sık hata:</strong> Sadece <code>dist/assets</code> yüklemişsiniz; <code>dist/index.html</code> de şart. <code>npm run build</code> sonrası <strong>dist</strong> klasörünün tamamını yükleyin.</p>';
    }
    if ($hasRootAssets && !$hasRootIndex) {
        echo '<p style="color:#b45309"><strong>Sık hata:</strong> Kökte sadece <code>assets</code> var; <code>dist/index.html</code> dosyasını da aynı yere <code>index.html</code> adıyla koymalı veya tüm <code>dist</code> klasörünü yüklemelisiniz.</p>';
    }

    echo '<p>Bilgisayarınızda: <code>npm run build</code> → oluşan <code>dist</code> içindeki <strong>index.html + assets</strong> birlikte gitsin.</p>';
    echo '</body></html>';
    exit;
}

$html = file_get_contents($distIndex);
if ($html === false) {
    http_response_code(500);
    echo 'Failed to read built index.html';
    exit;
}

if ($headTrackingSnippets !== '') {
    $html = str_replace('</head>', $headTrackingSnippets . "\n</head>", $html);
}

if ($bodyTrackingSnippets !== '') {
    $html = preg_replace('#<body[^>]*>#i', '$0' . "\n" . $bodyTrackingSnippets . "\n", $html, 1);
}

echo $html;
