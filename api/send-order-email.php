<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        exit();
    }
    
    $orderId = intval($data['order_id'] ?? 0);
    $email = $conn->real_escape_string($data['email'] ?? '');
    
    if (!$orderId || !$email) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Order ID and email are required']);
        exit();
    }
    
    // Get order details
    $sql = "SELECT * FROM orders WHERE id = $orderId";
    $result = $conn->query($sql);
    
    if (!$result || $result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Order not found']);
        exit();
    }
    
    $order = $result->fetch_assoc();
    
    // Get order items
    $itemsSql = "SELECT * FROM order_items WHERE order_id = $orderId";
    $itemsResult = $conn->query($itemsSql);
    $orderItems = [];
    while($row = $itemsResult->fetch_assoc()) {
        $orderItems[] = $row;
    }
    
    // Prepare email - HTML format with logo and signature
    $orderNumber = $order['order_number'] ?: "ORD-{$orderId}";
    $firstName = $order['first_name'];
    $lastName = $order['last_name'];
    
    $subject = "Order Confirmation - $orderNumber";
    
    // Build items table HTML
    $itemsHtml = '';
    foreach ($orderItems as $item) {
        $itemsHtml .= '<tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">' . htmlspecialchars($item['product_name']) . '</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">' . $item['quantity'] . '</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">$' . number_format($item['product_price'], 2) . '</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">$' . number_format($item['subtotal'], 2) . '</td>
        </tr>';
    }
    
    $body = '<!DOCTYPE html>
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
                                        <td style="color: #111827; padding: 8px 0; text-align: right;">' . date('F j, Y', strtotime($order['created_at'])) . '</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Order Items -->
                            <h2 style="color: #111827; font-size: 20px; margin: 30px 0 15px 0; border-bottom: 2px solid #43a047; padding-bottom: 10px;">Order Items</h2>
                            <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
                                <thead>
                                    <tr style="background-color: #f9fafb;">
                                        <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Product</th>
                                        <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Qty</th>
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
                                        <td style="padding: 15px; text-align: right; font-weight: bold; color: #111827; font-size: 20px; border-top: 2px solid #e5e7eb; color: #43a047;">$' . number_format($order['total'], 2) . '</td>
                                    </tr>
                                </tfoot>
                            </table>
                            
                            <!-- Shipping Address -->
                            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h2 style="color: #111827; font-size: 20px; margin: 0 0 15px 0; border-bottom: 2px solid #43a047; padding-bottom: 10px;">Shipping Address</h2>
                                <p style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0;">
                                    ' . htmlspecialchars($order['address']) . '<br>
                                    ' . htmlspecialchars($order['city']) . ', ' . htmlspecialchars($order['state']) . ' ' . htmlspecialchars($order['zip_code']) . '<br>
                                    ' . htmlspecialchars($order['country']) . '
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
    
    $headers = "From: Tile and Turf <noreply@tileandturf.com>\r\n";
    $headers .= "Reply-To: info@tileandturf.com\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    
    if (@mail($email, $subject, $body, $headers)) {
        echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to send email']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();
?>

