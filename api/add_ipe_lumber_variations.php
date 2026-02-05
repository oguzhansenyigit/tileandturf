<?php
/**
 * Add metre-based variations to IPE Lumber products
 * This script:
 * 1. Finds or creates "Metre" variation
 * 2. Adds metre options to the variation
 * 3. Finds products and links them to the variation with prices
 */

require_once 'config.php';

header('Content-Type: application/json');

try {
    if (!$conn) {
        throw new Exception('Database connection failed');
    }

    // Product configurations with their metre-based price lists
    $productConfigs = [
        [
            'name' => 'Ipe Lumber 1×3',
            'search_terms' => [
                "Ipe Lumber 1×3",
                "IPE Lumber 1×3",
                "Ipe Lumber 1x3",
                "IPE Lumber 1x3",
                "ipe lumber 1×3",
                "ipe lumber 1x3"
            ],
            'metre_prices' => [
                3 => 10.36,
                4 => 13.82,
                5 => 17.27,
                6 => 20.73,
                7 => 24.18,
                8 => 28.24,
                9 => 31.77,
                10 => 35.30,
                11 => 38.83,
                12 => 42.36,
                13 => 45.89,
                14 => 49.42,
                15 => 60.84,
                16 => 64.89,
                17 => 68.95,
                18 => 73.00,
                19 => 79.91,
                20 => 84.12,
                21 => 89.07,
                22 => 93.31
            ]
        ],
        [
            'name' => 'Ipe Tropical Hardwood (1×2)',
            'search_terms' => [
                "Ipe Tropical Hardwood (1×2)",
                "IPE Tropical Hardwood (1×2)",
                "Ipe Tropical Hardwood (1x2)",
                "IPE Tropical Hardwood (1x2)",
                "ipe tropical hardwood 1×2",
                "ipe tropical hardwood 1x2",
                "Ipe Tropical Hardwood 1×2",
                "Ipe Tropical Hardwood 1x2"
            ],
            'metre_prices' => [
                3 => 6.75,
                4 => 9.00,
                5 => 11.26,
                6 => 13.51,
                7 => 15.76,
                8 => 18.40,
                9 => 20.70,
                10 => 23.00,
                11 => 25.30,
                12 => 27.60,
                13 => 29.90,
                14 => 32.20,
                15 => 39.64,
                16 => 42.28,
                17 => 44.92,
                18 => 47.57,
                19 => 52.07,
                20 => 54.81
            ]
        ],
        [
            'name' => 'Ipe 1×4',
            'search_terms' => [
                "Ipe 1×4",
                "IPE 1×4",
                "Ipe 1x4",
                "IPE 1x4",
                "ipe 1×4",
                "ipe 1x4",
                "Ipe Lumber 1×4",
                "IPE Lumber 1×4",
                "Ipe Lumber 1x4",
                "IPE Lumber 1x4"
            ],
            // Liste'deki "metre 1" = gerçekte "metre 3" (3 baz al)
            // Liste'deki "metre 21" = gerçekte "metre 23" (21 + 2 = 23)
            'metre_prices' => [
                3 => 16.65,   // liste'deki metre 1
                4 => 22.20,   // liste'deki metre 2
                5 => 27.75,   // liste'deki metre 3
                6 => 33.30,   // liste'deki metre 4
                7 => 38.85,   // liste'deki metre 5
                8 => 45.36,   // liste'deki metre 6
                9 => 51.03,   // liste'deki metre 7
                10 => 56.70,  // liste'deki metre 8
                11 => 62.37,  // liste'deki metre 9
                12 => 68.04,  // liste'deki metre 10
                13 => 73.71,  // liste'deki metre 11
                14 => 79.38,  // liste'deki metre 12
                15 => 97.72,  // liste'deki metre 13
                16 => 104.23, // liste'deki metre 14
                17 => 110.75, // liste'deki metre 15
                18 => 117.26, // liste'deki metre 16
                19 => 128.36, // liste'deki metre 17
                20 => 135.11, // liste'deki metre 18
                21 => 143.06, // liste'deki metre 19
                22 => 149.87, // liste'deki metre 20
                23 => 157.99  // liste'deki metre 21
            ]
        ],
        [
            'name' => 'Ipe 1×8',
            'search_terms' => [
                "Ipe 1×8",
                "IPE 1×8",
                "Ipe 1x8",
                "IPE 1x8",
                "ipe 1×8",
                "ipe 1x8",
                "Ipe Lumber 1×8",
                "IPE Lumber 1×8",
                "Ipe Lumber 1x8",
                "IPE Lumber 1x8"
            ],
            // Bu liste tam yazıldığı gibi, metre 1 = metre 1, metre 23 = metre 23
            'metre_prices' => [
                1 => 13.75,
                2 => 27.50,
                3 => 40.37,
                4 => 53.83,
                5 => 67.29,
                6 => 80.74,
                7 => 94.20,
                8 => 110.00,
                9 => 123.75,
                10 => 137.50,
                11 => 151.25,
                12 => 165.00,
                13 => 178.75,
                14 => 192.50,
                15 => 236.97,
                16 => 252.77,
                17 => 268.56,
                18 => 284.36,
                19 => 311.28,
                20 => 327.66,
                21 => 346.93,
                22 => 363.45,
                23 => 383.13
            ]
        ],
        [
            'name' => 'Ipe 1×10',
            'search_terms' => [
                "Ipe 1×10",
                "IPE 1×10",
                "Ipe 1x10",
                "IPE 1x10",
                "ipe 1×10",
                "ipe 1x10",
                "Ipe Lumber 1×10",
                "IPE Lumber 1×10",
                "Ipe Lumber 1x10",
                "IPE Lumber 1x10"
            ],
            // Liste'deki "metre 1" = gerçekte "metre 3" (3 baz al)
            // Liste'deki "metre 21" = gerçekte "metre 23" (21 + 2 = 23)
            'metre_prices' => [
                3 => 34.62,   // liste'deki metre 1
                4 => 46.16,   // liste'deki metre 2
                5 => 57.70,   // liste'deki metre 3
                6 => 69.23,   // liste'deki metre 4
                7 => 80.77,   // liste'deki metre 5
                8 => 94.32,   // liste'deki metre 6
                9 => 106.11,  // liste'deki metre 7
                10 => 117.90, // liste'deki metre 8
                11 => 129.69, // liste'deki metre 9
                12 => 141.48, // liste'deki metre 10
                13 => 153.27, // liste'deki metre 11
                14 => 165.06, // liste'deki metre 12
                15 => 203.19, // liste'deki metre 13
                16 => 216.74, // liste'deki metre 14
                17 => 230.28, // liste'deki metre 15
                18 => 243.83, // liste'deki metre 16
                19 => 266.91, // liste'deki metre 17
                20 => 280.95, // liste'deki metre 18
                21 => 297.48, // liste'deki metre 19
                22 => 311.64, // liste'deki metre 20
                23 => 328.52  // liste'deki metre 21
            ]
        ],
        [
            'name' => 'Ipe 1×12',
            'search_terms' => [
                "Ipe 1×12",
                "IPE 1×12",
                "Ipe 1x12",
                "IPE 1x12",
                "ipe 1×12",
                "ipe 1x12",
                "Ipe Lumber 1×12",
                "IPE Lumber 1×12",
                "Ipe Lumber 1x12",
                "IPE Lumber 1x12"
            ],
            // Liste'deki "metre 1" = gerçekte "metre 4" (4 ile başla)
            // Liste'deki "metre 20" = gerçekte "metre 23" (20 + 3 = 23)
            'metre_prices' => [
                4 => 55.79,   // liste'deki metre 1
                5 => 69.73,   // liste'deki metre 2
                6 => 83.68,   // liste'deki metre 3
                7 => 97.63,   // liste'deki metre 4
                8 => 114.00,  // liste'deki metre 5
                9 => 128.25,  // liste'deki metre 6
                10 => 142.50, // liste'deki metre 7
                11 => 156.75, // liste'deki metre 8
                12 => 171.00, // liste'deki metre 9
                13 => 185.25, // liste'deki metre 10
                14 => 199.50, // liste'deki metre 11
                15 => 245.59, // liste'deki metre 12
                16 => 261.96, // liste'deki metre 13
                17 => 278.33, // liste'deki metre 14
                18 => 294.70, // liste'deki metre 15
                19 => 322.60, // liste'deki metre 16
                20 => 339.57, // liste'deki metre 17
                21 => 359.55, // liste'deki metre 18
                22 => 376.67, // liste'deki metre 19
                23 => 397.07  // liste'deki metre 20
            ]
        ],
        [
            'name' => 'Ipe 5/4×6',
            'search_terms' => [
                "Ipe 5/4×6",
                "IPE 5/4×6",
                "Ipe 5/4x6",
                "IPE 5/4x6",
                "ipe 5/4×6",
                "ipe 5/4x6",
                "Ipe 5/4 × 6",
                "IPE 5/4 × 6",
                "Ipe 5/4 x 6",
                "IPE 5/4 x 6",
                "Ipe Lumber 5/4×6",
                "IPE Lumber 5/4×6"
            ],
            // Liste'deki "metre 1" = gerçekte "metre 3" (3 ile başla)
            // Liste'deki "metre 20" = gerçekte "metre 22" (20 + 2 = 22)
            'metre_prices' => [
                3 => 28.67,   // liste'deki metre 1
                4 => 38.22,   // liste'deki metre 2
                5 => 47.78,   // liste'deki metre 3
                6 => 57.33,   // liste'deki metre 4
                7 => 66.89,   // liste'deki metre 5
                8 => 77.52,   // liste'deki metre 6
                9 => 87.21,   // liste'deki metre 7
                10 => 96.90,  // liste'deki metre 8
                11 => 106.59, // liste'deki metre 9
                12 => 116.28, // liste'deki metre 10
                13 => 125.97, // liste'deki metre 11
                14 => 135.66, // liste'deki metre 12
                15 => 159.46, // liste'deki metre 13
                16 => 170.09, // liste'deki metre 14
                17 => 180.72, // liste'deki metre 15
                18 => 191.35, // liste'deki metre 16
                19 => 207.09, // liste'deki metre 17
                20 => 217.99, // liste'deki metre 18
                21 => 230.93, // liste'deki metre 19
                22 => 241.92  // liste'deki metre 20
            ]
        ]
    ];

    // Get all unique metre values from all products
    $allMetres = [];
    foreach ($productConfigs as $config) {
        $allMetres = array_merge($allMetres, array_keys($config['metre_prices']));
    }
    $allMetres = array_unique($allMetres);
    sort($allMetres);

    // Step 1: Find or create "Metre" variation
    $checkVariationSql = "SELECT * FROM product_variations WHERE LOWER(name) = 'metre' OR LOWER(name) = 'meter' OR LOWER(name) = 'length' LIMIT 1";
    $variationResult = $conn->query($checkVariationSql);
    $variationId = null;

    if ($variationResult && $variationResult->num_rows > 0) {
        $variation = $variationResult->fetch_assoc();
        $variationId = $variation['id'];
        echo "Found existing variation: {$variation['name']} (ID: $variationId)\n";
        
        // Update variation options with all possible metres
        $options = [];
        foreach ($allMetres as $metre) {
            $options[] = "metre $metre";
        }
        $optionsJson = json_encode($options);
        $updateVariationSql = "UPDATE product_variations SET options = '$optionsJson', type = 'select' WHERE id = $variationId";
        if ($conn->query($updateVariationSql)) {
            echo "Updated variation options with all metres\n";
        } else {
            throw new Exception("Failed to update variation: " . $conn->error);
        }
    } else {
        // Create new variation
        $options = [];
        foreach ($allMetres as $metre) {
            $options[] = "metre $metre";
        }
        $optionsJson = json_encode($options);
        $insertVariationSql = "INSERT INTO product_variations (name, type, options, description) VALUES ('Metre', 'select', '$optionsJson', 'Select length in metres')";
        if ($conn->query($insertVariationSql)) {
            $variationId = $conn->insert_id;
            echo "Created new variation: Metre (ID: $variationId)\n";
        } else {
            throw new Exception("Failed to create variation: " . $conn->error);
        }
    }

    // Step 2: Process each product configuration
    $results = [];
    $errors = [];

    foreach ($productConfigs as $config) {
        $product = null;
        $productName = $config['name'];
        $metrePrices = $config['metre_prices'];
        
        // Try to find product using search terms
        foreach ($config['search_terms'] as $searchTerm) {
            $searchSql = "SELECT * FROM products WHERE name LIKE '%" . $conn->real_escape_string($searchTerm) . "%' LIMIT 1";
            $productResult = $conn->query($searchSql);
            if ($productResult && $productResult->num_rows > 0) {
                $product = $productResult->fetch_assoc();
                break;
            }
        }

        if (!$product) {
            $errors[] = [
                'product_name' => $productName,
                'error' => 'Product not found',
                'searched_terms' => $config['search_terms']
            ];
            continue;
        }

        // Step 3: Link product to variation with all prices
        $productVariations = [];
        
        // Parse existing variations if any
        if (!empty($product['variations'])) {
            $productVariations = json_decode($product['variations'], true);
            if (!is_array($productVariations)) {
                $productVariations = [];
            }
        }

        // Add metre variation with all options and prices for this product
        $productVariations[$variationId] = [];
        foreach ($metrePrices as $metre => $price) {
            $optionKey = "metre $metre";
            $productVariations[$variationId][$optionKey] = [
                'value' => "metre $metre",
                'price' => $price
            ];
        }

        $variationsJson = json_encode($productVariations);
        $variationsEscaped = $conn->real_escape_string($variationsJson);

        // Update product
        $updateProductSql = "UPDATE products SET variations = '$variationsEscaped' WHERE id = {$product['id']}";
        if ($conn->query($updateProductSql)) {
            $results[] = [
                'success' => true,
                'product_id' => $product['id'],
                'product_name' => $product['name'],
                'variation_id' => $variationId,
                'variation_name' => 'Metre',
                'options_added' => count($metrePrices),
                'price_range' => [
                    'min' => min($metrePrices),
                    'max' => max($metrePrices),
                    'metres' => array_keys($metrePrices)
                ]
            ];
            echo "✓ Added variations to: {$product['name']} (ID: {$product['id']})\n";
        } else {
            $errors[] = [
                'product_name' => $productName,
                'product_id' => $product['id'],
                'error' => "Failed to update product: " . $conn->error
            ];
        }
    }

    // Return summary
    $response = [
        'success' => count($results) > 0,
        'variation_id' => $variationId,
        'variation_name' => 'Metre',
        'products_updated' => count($results),
        'products_failed' => count($errors),
        'results' => $results
    ];

    if (count($errors) > 0) {
        $response['errors'] = $errors;
    }

    echo json_encode($response, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}

$conn->close();
?>
