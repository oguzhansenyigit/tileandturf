<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'POST only']);
    exit;
}

try {
    require_once __DIR__ . '/config.php';
} catch (Throwable $e) {
    echo json_encode(['success' => false, 'error' => 'Config: ' . $e->getMessage()]);
    exit;
}

try {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data) || empty($data['items'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid data or empty cart']);
        exit;
    }

    $orderNumber = 'ORD-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    $firstName = $conn->real_escape_string($data['firstName'] ?? '');
    $lastName = $conn->real_escape_string($data['lastName'] ?? '');
    $email = $conn->real_escape_string($data['email'] ?? '');
    $phone = $conn->real_escape_string($data['phone'] ?? '');
    $address = $conn->real_escape_string($data['address'] ?? '');
    $city = $conn->real_escape_string($data['city'] ?? '');
    $state = $conn->real_escape_string($data['state'] ?? '');
    $zipCode = $conn->real_escape_string($data['zipCode'] ?? '');
    $country = $conn->real_escape_string($data['country'] ?? 'United States');
    $total = floatval($data['total'] ?? 0);
    $paymentMethod = $conn->real_escape_string($data['paymentMethod'] ?? 'credit_card');

    $sql = "INSERT INTO orders (order_number, first_name, last_name, email, phone, address, city, state, zip_code, country, total, payment_method) 
            VALUES ('$orderNumber', '$firstName', '$lastName', '$email', '$phone', '$address', '$city', '$state', '$zipCode', '$country', $total, '$paymentMethod')";

    if (!$conn->query($sql)) {
        echo json_encode(['success' => false, 'error' => 'Order insert: ' . $conn->error]);
        exit;
    }

    $orderId = $conn->insert_id;
    $cols = $conn->query("SHOW COLUMNS FROM order_items LIKE 'selected_size'");
    $hasSelectedSize = ($cols && $cols->num_rows > 0);

    foreach ($data['items'] as $item) {
        $productId = isset($item['id']) && intval($item['id']) > 0 ? intval($item['id']) : 'NULL';
        $productName = $conn->real_escape_string(substr($item['name'] ?? 'Product', 0, 255));
        $productPrice = floatval($item['price'] ?? 0);
        $quantity = max(1, intval($item['quantity'] ?? 1));
        $subtotal = $productPrice * $quantity;
        $selectedSize = ($hasSelectedSize && !empty($item['selectedSize']))
            ? "'" . $conn->real_escape_string($item['selectedSize']) . "'" : ($hasSelectedSize ? 'NULL' : '');

        $colPart = $hasSelectedSize ? ', selected_size' : '';
        $valPart = $hasSelectedSize ? ", $selectedSize" : '';
        $itemSql = "INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal$colPart) 
                    VALUES ($orderId, $productId, '$productName', $productPrice, $quantity, $subtotal$valPart)";
        if (!$conn->query($itemSql)) {
            echo json_encode(['success' => false, 'error' => 'Item insert: ' . $conn->error]);
            exit;
        }
    }

    $orderItems = [];
    foreach ($data['items'] as $item) {
        $orderItems[] = [
            'name' => $item['name'] ?? 'Product',
            'quantity' => intval($item['quantity'] ?? 1),
            'price' => floatval($item['price'] ?? 0),
            'selectedSize' => $item['selectedSize'] ?? null
        ];
    }

    $itemsHtml = '';
    foreach ($orderItems as $i) {
        $name = htmlspecialchars($i['name']);
        if (!empty($i['selectedSize'])) $name .= ' <span style="color:#6b7280">(' . htmlspecialchars($i['selectedSize']) . ')</span>';
        $sub = $i['price'] * $i['quantity'];
        $itemsHtml .= "<tr><td>$name</td><td style='text-align:center'>{$i['quantity']}</td><td style='text-align:right'>\$" . number_format($i['price'], 2) . "</td><td style='text-align:right;font-weight:bold'>\$" . number_format($sub, 2) . "</td></tr>";
    }

    $customerBody = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Order Confirmation</title></head><body style="font-family:Arial;padding:20px">';
    $customerBody .= "<h1>TILE & TURF</h1><h2>Order Confirmation</h2>";
    $customerBody .= "<p>Dear $firstName $lastName,</p><p>Thank you for your order!</p>";
    $customerBody .= "<p><strong>Order #:</strong> $orderNumber</p><p><strong>Date:</strong> " . date('F j, Y') . "</p>";
    $customerBody .= "<table border='1' cellpadding='10' style='border-collapse:collapse;width:100%'><tr style='background:#f5f5f5'><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>$itemsHtml";
    $customerBody .= "<tr><td colspan='3' style='text-align:right'><strong>Total</strong></td><td style='text-align:right;font-weight:bold'>\$" . number_format($total, 2) . "</td></tr></table>";
    $customerBody .= "<p><strong>Shipping:</strong> $address, $city, $state $zipCode, $country</p><p>Thank you!</p></body></html>";

    $headers = "From: Tile and Turf <noreply@tileandturf.com>\r\nContent-Type: text/html; charset=UTF-8\r\n";
    @mail($email, "Order Confirmation - $orderNumber", $customerBody, $headers);

    $adminBody = "New order $orderNumber\nCustomer: $firstName $lastName\nEmail: $email\n\nItems:\n";
    foreach ($orderItems as $i) {
        $adminBody .= "- {$i['name']} x{$i['quantity']} @ \$" . number_format($i['price'], 2);
        if (!empty($i['selectedSize'])) $adminBody .= " [{$i['selectedSize']}]";
        $adminBody .= "\n";
    }
    $adminBody .= "\nTotal: \$" . number_format($total, 2) . "\n";
    $adminHeaders = "From: noreply@tileandturf.com\r\nContent-Type: text/plain; charset=UTF-8\r\n";
    @mail('info@tileandturf.com', "New Order - $orderNumber", $adminBody, $adminHeaders);
    @mail('anil@pedexon.com', "New Order - $orderNumber", $adminBody, $adminHeaders);

    echo json_encode(['success' => true, 'orderId' => $orderId, 'orderNumber' => $orderNumber]);
} catch (Throwable $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

$conn->close();
