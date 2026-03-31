<?php
$googleAdsHeadTag = '';

// Server-side injection so Google crawlers can detect tags in raw HTML.
try {
    $dbHost = 'localhost';
    $dbUser = 'u753039087_newweb';
    $dbPass = '11241124Oguzhan.';
    $dbName = 'u753039087_newweb1';

    $db = @new mysqli($dbHost, $dbUser, $dbPass, $dbName);
    if (!$db->connect_error) {
        $db->set_charset('utf8');
        $sql = "SELECT setting_value FROM settings WHERE setting_key = 'google_ads_head_tag' LIMIT 1";
        $res = $db->query($sql);
        if ($res && $row = $res->fetch_assoc()) {
            $googleAdsHeadTag = (string)($row['setting_value'] ?? '');
        }
        $db->close();
    }
} catch (Throwable $e) {
    // Fail silently to avoid breaking page rendering.
}
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/logo.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tile and Turf - Building Materials</title>
    <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.css"/>
    <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick-theme.min.css"/>
    <?php
      // Stored tag HTML should be trusted only for admin users.
      if (!empty($googleAdsHeadTag)) {
          echo $googleAdsHeadTag . "\n";
      }
    ?>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
