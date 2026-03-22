<?php
require_once 'config.php';

$sql = "ALTER TABLE order_items ADD COLUMN selected_size VARCHAR(50) NULL AFTER subtotal";
if ($conn->query($sql)) {
    echo "Migration successful: selected_size column added to order_items.\n";
} else {
    if (strpos($conn->error, 'Duplicate column') !== false) {
        echo "Column selected_size already exists - migration skipped.\n";
    } else {
        echo "Migration failed: " . $conn->error . "\n";
    }
}
$conn->close();
