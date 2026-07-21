<?php
require_once 'config.php';
require_once __DIR__ . '/order-pricing.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || empty($data['items']) || !is_array($data['items'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid order data']);
        exit();
    }

    $pricing = tileandturf_calculate_order_totals($conn, $data['items']);
    if (!$pricing['ok']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $pricing['error']]);
        exit();
    }

    $resolvedItems = $pricing['items'];
    $total = floatval($pricing['total']);
    
    // Generate order number
    $orderNumber = 'ORD-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    
    $firstName = trim($data['firstName'] ?? '');
    $lastName = trim($data['lastName'] ?? '');
    $email = trim($data['email'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $address = trim($data['address'] ?? '');
    $city = trim($data['city'] ?? '');
    $state = trim($data['state'] ?? '');
    $zipCode = trim($data['zipCode'] ?? '');
    $country = trim($data['country'] ?? 'United States');
    $paymentMethod = trim($data['paymentMethod'] ?? 'credit_card');

    if ($firstName === '' || $lastName === '' || $email === '' || $address === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required order fields']);
        exit();
    }

    if (!tileandturf_validate_email($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid email address']);
        exit();
    }

    tileandturf_ensure_orders_ip_column($conn);
    $checkoutIp = tileandturf_client_ip();
    $checkoutIp = ($checkoutIp !== '') ? substr((string) $checkoutIp, 0, 45) : '';

    $orderId = tileandturf_db_execute(
        $conn,
        'INSERT INTO orders (order_number, first_name, last_name, email, phone, address, city, state, zip_code, country, total, payment_method, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        'ssssssssssdss',
        $orderNumber,
        $firstName,
        $lastName,
        $email,
        $phone,
        $address,
        $city,
        $state,
        $zipCode,
        $country,
        $total,
        $paymentMethod,
        $checkoutIp
    );

    // Fallback if ip_address column could not be added on this host.
    if ($orderId === false) {
        $orderId = tileandturf_db_execute(
            $conn,
            'INSERT INTO orders (order_number, first_name, last_name, email, phone, address, city, state, zip_code, country, total, payment_method)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            'ssssssssssds',
            $orderNumber,
            $firstName,
            $lastName,
            $email,
            $phone,
            $address,
            $city,
            $state,
            $zipCode,
            $country,
            $total,
            $paymentMethod
        );
    }

    if ($orderId !== false) {
        $sessionId = trim((string)($data['session_id'] ?? ''));
        require_once __DIR__ . '/analytics-helpers.php';
        tileandturf_analytics_ensure_tables($conn);
        $ip = $checkoutIp ?: tileandturf_client_ip();
        if ($sessionId !== '') {
            tileandturf_funnel_record(
                $conn,
                $sessionId,
                'purchase',
                null,
                intval($orderId),
                $ip
            );
        }

        // Mark abandoned-cart remiders as recovered
        $emailEsc = $conn->real_escape_string(strtolower($email));
        @$conn->query(
            "UPDATE abandoned_carts SET recovered_at = NOW()
             WHERE recovered_at IS NULL AND (
               LOWER(email) = '$emailEsc'" .
            ($sessionId !== ''
                ? " OR session_id = '" . $conn->real_escape_string($sessionId) . "'"
                : '') .
            ')'
        );

        $orderItems = [];
        foreach ($resolvedItems as $item) {
            $productId = intval($item['product_id']);
            $productName = $item['product_name'];
            $productPrice = floatval($item['product_price']);
            $quantity = intval($item['quantity']);
            $subtotal = floatval($item['subtotal']);
            $selectedSize = isset($item['selected_size']) ? trim((string)$item['selected_size']) : '';
            $qtyLabel = trim((string)($item['qty_label'] ?? $quantity));
            if ($qtyLabel === '') {
                $qtyLabel = (string) $quantity;
            }

            if ($sessionId !== '' && $productId > 0) {
                tileandturf_funnel_record(
                    $conn,
                    $sessionId,
                    'purchase',
                    $productId,
                    intval($orderId),
                    $ip
                );
            }

            if ($selectedSize !== '') {
                tileandturf_db_execute(
                    $conn,
                    'INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal, selected_size)
                     VALUES (?, ?, ?, ?, ?, ?, ?)',
                    'iisdids',
                    $orderId,
                    $productId,
                    $productName,
                    $productPrice,
                    $quantity,
                    $subtotal,
                    $selectedSize
                );
            } else {
                tileandturf_db_execute(
                    $conn,
                    'INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
                     VALUES (?, ?, ?, ?, ?, ?)',
                    'iisdid',
                    $orderId,
                    $productId,
                    $productName,
                    $productPrice,
                    $quantity,
                    $subtotal
                );
            }

            $orderItems[] = [
                'name' => $productName,
                'quantity' => $quantity,
                'qty_label' => $qtyLabel,
                'selected_size' => $selectedSize,
                'price' => $productPrice,
                'subtotal' => $subtotal,
                'is_sqft' => $selectedSize !== '' && stripos($selectedSize, 'sqft') !== false,
            ];
        }
        
        // Email to customer - HTML format with logo and signature
        $customerSubject = "Order Confirmation - $orderNumber";
        
        // Build items table HTML
        $itemsHtml = '';
        foreach ($orderItems as $item) {
            $qtyCell = htmlspecialchars($item['qty_label']);
            $priceCell = '$' . number_format($item['price'], 2);
            if (!empty($item['is_sqft'])) {
                $priceCell .= '/sqft';
            }
            $itemsHtml .= '<tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">' . htmlspecialchars($item['name']) . '</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">' . $qtyCell . '</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">' . $priceCell . '</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">$' . number_format($item['subtotal'], 2) . '</td>
            </tr>';
        }
        
        $customerBody = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header with Logo -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #43a047 0%, #66bb6a 100%); padding: 30px; text-align: center;">
                            <div style="margin-bottom: 15px;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 1px;">TILE & TURF</h1>
                            </div>
                            <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 500; opacity: 0.95;">Order Confirmation</h2>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px;">
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Dear ' . htmlspecialchars($firstName) . ' ' . htmlspecialchars($lastName) . ',
                            </p>
                            
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Thank you for your order! Your order has been received and is being processed.
                            </p>
                            
                            <!-- Important Notice -->
                            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p style="color: #991b1b; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                                    Order Processing Information
                                </p>
                                <p style="color: #7f1d1d; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                                    Your order and payment processes will be completed after our customer service contacts you for payment confirmation, shipping calculation, and product approval.
                                </p>
                                <p style="color: #7f1d1d; font-size: 14px; line-height: 1.6; margin: 0;">
                                    You may also call us at <a href="tel:+15167741808" style="color: #991b1b; font-weight: bold; text-decoration: underline;">(516) 774-1808</a> if you prefer.
                                </p>
                            </div>
                            
                            <!-- Order Details -->
                            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h2 style="color: #111827; font-size: 20px; margin: 0 0 15px 0; border-bottom: 2px solid #43a047; padding-bottom: 10px;">Order Details</h2>
                                <table width="100%" cellpadding="5" cellspacing="0">
                                    <tr>
                                        <td style="color: #6b7280; font-weight: 600; padding: 8px 0;">Order Number:</td>
                                        <td style="color: #111827; font-weight: bold; padding: 8px 0; text-align: right; font-size: 18px; color: #43a047;">' . htmlspecialchars($orderNumber) . '</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #6b7280; font-weight: 600; padding: 8px 0;">Order Date:</td>
                                        <td style="color: #111827; padding: 8px 0; text-align: right;">' . date('F j, Y') . '</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Order Items -->
                            <h2 style="color: #111827; font-size: 20px; margin: 30px 0 15px 0; border-bottom: 2px solid #43a047; padding-bottom: 10px;">Order Items</h2>
                            <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
                                <thead>
                                    <tr style="background-color: #f9fafb;">
                                        <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Product</th>
                                        <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Qty / Sqft</th>
                                        <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Price</th>
                                        <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ' . $itemsHtml . '
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="3" style="padding: 15px; text-align: right; font-weight: bold; color: #374151; font-size: 16px; border-top: 2px solid #e5e7eb;">Total:</td>
                                        <td style="padding: 15px; text-align: right; font-weight: bold; color: #111827; font-size: 20px; border-top: 2px solid #e5e7eb; color: #43a047;">$' . number_format($total, 2) . '</td>
                                    </tr>
                                </tfoot>
                            </table>
                            
                            <!-- Shipping Address -->
                            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h2 style="color: #111827; font-size: 20px; margin: 0 0 15px 0; border-bottom: 2px solid #43a047; padding-bottom: 10px;">Shipping Address</h2>
                                <p style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0;">
                                    ' . htmlspecialchars($address) . '<br>
                                    ' . htmlspecialchars($city) . ', ' . htmlspecialchars($state) . ' ' . htmlspecialchars($zipCode) . '<br>
                                    ' . htmlspecialchars($country) . '
                                </p>
                            </div>
                            
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                                A customer service representative will contact you shortly to confirm your order details and arrange payment.
                            </p>
                            
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                                Thank you for choosing Tile and Turf!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer with Signature -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
                            <p style="color: #374151; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Best regards,</p>
                            <p style="color: #43a047; font-size: 18px; margin: 0 0 5px 0; font-weight: bold;">Tile and Turf Team</p>
                            <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
                                Phone: <a href="tel:+15167741808" style="color: #43a047; text-decoration: none;">(516) 774-1808</a><br>
                                Email: <a href="mailto:info@tileandturf.com" style="color: #43a047; text-decoration: none;">info@tileandturf.com</a><br>
                                Address: 5424 73rd Pl, Maspeth, NY 11378
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>';
        
        $customerHeaders = tileandturf_mail_from_header(true);
        $customerHeaders .= 'Reply-To: ' . tileandturf_mail_reply_to() . "\r\n";
        $customerHeaders .= "MIME-Version: 1.0\r\n";
        $customerHeaders .= "Content-Type: text/html; charset=UTF-8\r\n";
        
        @mail($email, $customerSubject, $customerBody, $customerHeaders);
        
        // Email to configured admin notification addresses
        $adminSubject = "New Order Received - $orderNumber";
        $adminBody = "New order received:\n\n";
        $adminBody .= "ORDER NUMBER: $orderNumber\n";
        $adminBody .= "ORDER DATE: " . date('F j, Y, g:i a') . "\n\n";
        $adminBody .= "CUSTOMER INFORMATION:\n";
        $adminBody .= "Name: $firstName $lastName\n";
        $adminBody .= "Email: $email\n";
        $adminBody .= "Phone: $phone\n\n";
        $adminBody .= "SHIPPING ADDRESS:\n";
        $adminBody .= "$address\n";
        $adminBody .= "$city, $state $zipCode\n";
        $adminBody .= "$country\n\n";
        $adminBody .= "ORDER ITEMS:\n";
        foreach ($orderItems as $item) {
            $qtyPart = $item['qty_label'];
            $pricePart = '$' . number_format($item['price'], 2);
            if (!empty($item['is_sqft'])) {
                $pricePart .= '/sqft';
            }
            $adminBody .= "- {$item['name']} — {$qtyPart} @ {$pricePart} = $" . number_format($item['subtotal'], 2) . "\n";
        }
        $adminBody .= "\nTOTAL: $" . number_format($total, 2) . "\n";
        $adminBody .= "PAYMENT METHOD: $paymentMethod\n\n";
        $adminBody .= "Please contact the customer to confirm the order and arrange payment.\n";
        
        $adminHeaders = tileandturf_mail_from_header(false);
        $adminHeaders .= "Reply-To: $email\r\n";
        $adminHeaders .= "Content-Type: text/plain; charset=UTF-8\r\n";

        foreach (tileandturf_order_notify_emails() as $notifyEmail) {
            @mail($notifyEmail, $adminSubject, $adminBody, $adminHeaders);
        }
        
        $confirmationToken = tileandturf_order_confirmation_token($orderId, $orderNumber);

        echo json_encode([
            'success' => true,
            'orderId' => $orderId,
            'orderNumber' => $orderNumber,
            'total' => $total,
            'confirmationToken' => $confirmationToken,
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
}

$conn->close();
?>

