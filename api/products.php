<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $category = isset($_GET['category']) ? $conn->real_escape_string($_GET['category']) : null;
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        $slug = isset($_GET['slug']) ? $conn->real_escape_string(urldecode($_GET['slug'])) : null;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : null;
        $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : null;
        
        // Check if admin parameter is set (accept both '1' and 'true')
        $admin = (isset($_GET['admin']) && ($_GET['admin'] == '1' || $_GET['admin'] == 'true'));
        
        // Check if is_hidden column exists (check once for all queries)
        $checkIsHiddenSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                           WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                           AND TABLE_NAME = 'products' 
                           AND COLUMN_NAME = 'is_hidden'";
        $checkIsHiddenResult = $conn->query($checkIsHiddenSql);
        $hasIsHiddenField = false;
        if ($checkIsHiddenResult) {
            $row = $checkIsHiddenResult->fetch_assoc();
            $hasIsHiddenField = $row['count'] > 0;
        }
        
        if ($search) {
            // Search products by name or SKU
            $searchTerm = '%' . $search . '%';
            // Check if category PDF columns exist
            $checkCatColumns = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                               WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                               AND TABLE_NAME = 'categories' 
                               AND COLUMN_NAME IN ('datasheet_pdf', 'brochure_pdf')";
            $catColResult = $conn->query($checkCatColumns);
            $hasCatPDFColumns = false;
            if ($catColResult) {
                $catColRow = $catColResult->fetch_assoc();
                $hasCatPDFColumns = $catColRow['count'] >= 2;
            }
            
            // Build WHERE clause
            $whereConditions = ["p.status = 'active'"];
            if (!$admin && $hasIsHiddenField) {
                $whereConditions[] = "(p.is_hidden = 0 OR p.is_hidden IS NULL)";
            }
            $whereConditions[] = "(p.name LIKE '$searchTerm' OR p.sku LIKE '$searchTerm')";
            $whereClause = "WHERE " . implode(" AND ", $whereConditions);
            
            if ($hasCatPDFColumns) {
                $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug, 
                        c.datasheet_pdf as category_datasheet_pdf, c.brochure_pdf as category_brochure_pdf
                        FROM products p 
                        LEFT JOIN categories c ON p.category_id = c.id 
                        $whereClause
                        ORDER BY COALESCE(p.order_index, 999999) ASC, p.created_at DESC";
            } else {
                $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug 
                        FROM products p 
                        LEFT JOIN categories c ON p.category_id = c.id 
                        $whereClause
                        ORDER BY COALESCE(p.order_index, 999999) ASC, p.created_at DESC";
            }
            if ($limit) {
                $sql .= " LIMIT $limit";
            }
        } else if ($slug || $id) {
            // Get single product by slug or id
            // Check if category PDF columns exist
            $checkCatColumns = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                               WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                               AND TABLE_NAME = 'categories' 
                               AND COLUMN_NAME IN ('datasheet_pdf', 'brochure_pdf')";
            $catColResult = $conn->query($checkCatColumns);
            $hasCatPDFColumns = false;
            if ($catColResult) {
                $catColRow = $catColResult->fetch_assoc();
                $hasCatPDFColumns = $catColRow['count'] >= 2;
            }
            
            // Build WHERE clause: slug takes precedence, fallback to id
            $whereClause = '';
            if ($slug) {
                $whereConditions = ["p.slug = '$slug'", "p.status = 'active'"];
                if (!$admin && $hasIsHiddenField) {
                    $whereConditions[] = "(p.is_hidden = 0 OR p.is_hidden IS NULL)";
                }
                $whereClause = "WHERE " . implode(" AND ", $whereConditions);
            } else if ($id) {
                $whereConditions = ["p.id = $id", "p.status = 'active'"];
                if (!$admin && $hasIsHiddenField) {
                    $whereConditions[] = "(p.is_hidden = 0 OR p.is_hidden IS NULL)";
                }
                $whereClause = "WHERE " . implode(" AND ", $whereConditions);
            }
            
            if ($hasCatPDFColumns) {
                $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug, 
                        c.datasheet_pdf as category_datasheet_pdf, c.brochure_pdf as category_brochure_pdf
                        FROM products p 
                        LEFT JOIN categories c ON p.category_id = c.id 
                        $whereClause";
            } else {
                $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug 
                        FROM products p 
                        LEFT JOIN categories c ON p.category_id = c.id 
                        $whereClause";
            }
        } else if ($category) {
            // Get products by category
            // Check if category PDF columns exist
            $checkCatColumns = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                               WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                               AND TABLE_NAME = 'categories' 
                               AND COLUMN_NAME IN ('datasheet_pdf', 'brochure_pdf')";
            $catColResult = $conn->query($checkCatColumns);
            $hasCatPDFColumns = false;
            if ($catColResult) {
                $catColRow = $catColResult->fetch_assoc();
                $hasCatPDFColumns = $catColRow['count'] >= 2;
            }
            
            if ($hasCatPDFColumns) {
                $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug, 
                        c.datasheet_pdf as category_datasheet_pdf, c.brochure_pdf as category_brochure_pdf
                        FROM products p 
                        LEFT JOIN categories c ON p.category_id = c.id 
                        WHERE c.slug = '$category' AND p.status = 'active'";
                if (!$admin && $hasIsHiddenField) {
                    $sql .= " AND (p.is_hidden = 0 OR p.is_hidden IS NULL)";
                }
                $sql .= " ORDER BY COALESCE(p.order_index, 999999) ASC, p.created_at DESC";
            } else {
                $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug 
                        FROM products p 
                        LEFT JOIN categories c ON p.category_id = c.id 
                        WHERE c.slug = '$category' AND p.status = 'active'";
                if (!$admin && $hasIsHiddenField) {
                    $sql .= " AND (p.is_hidden = 0 OR p.is_hidden IS NULL)";
                }
                $sql .= " ORDER BY COALESCE(p.order_index, 999999) ASC, p.created_at DESC";
            }
            if ($limit) {
                $sql .= " LIMIT $limit";
            }
        } else {
            // Get all products
            // Check if category PDF columns exist
            $checkCatColumns = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                               WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                               AND TABLE_NAME = 'categories' 
                               AND COLUMN_NAME IN ('datasheet_pdf', 'brochure_pdf')";
            $catColResult = $conn->query($checkCatColumns);
            $hasCatPDFColumns = false;
            if ($catColResult) {
                $catColRow = $catColResult->fetch_assoc();
                $hasCatPDFColumns = $catColRow['count'] >= 2;
            }
            
            $whereClause = $admin ? '' : "WHERE p.status = 'active'";
            if (!$admin && $hasIsHiddenField) {
                $whereClause .= " AND (p.is_hidden = 0 OR p.is_hidden IS NULL)";
            }
            
            if ($hasCatPDFColumns) {
                $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug, 
                        c.datasheet_pdf as category_datasheet_pdf, c.brochure_pdf as category_brochure_pdf
                        FROM products p 
                        LEFT JOIN categories c ON p.category_id = c.id 
                        $whereClause
                        ORDER BY COALESCE(p.order_index, 999999) ASC, p.created_at DESC";
            } else {
                $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug 
                        FROM products p 
                        LEFT JOIN categories c ON p.category_id = c.id 
                        $whereClause
                        ORDER BY COALESCE(p.order_index, 999999) ASC, p.created_at DESC";
            }
            if ($limit) {
                $sql .= " LIMIT $limit";
            }
        }
        
        $result = $conn->query($sql);
        
        $products = [];
        if ($result) {
            if ($result->num_rows > 0) {
                while($row = $result->fetch_assoc()) {
                    $products[] = $row;
                }
            }
            // Return single product if id or slug is used, otherwise return array
            if ($id || $slug) {
                echo json_encode($products[0] ?? null);
            } else {
                echo json_encode($products);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Query failed: ' . $conn->error]);
        }
    } else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
            exit();
        }
        
        $name = $conn->real_escape_string($data['name'] ?? '');
        $slug = $conn->real_escape_string($data['slug'] ?? '');
        $description = $conn->real_escape_string($data['description'] ?? '');
        $price = floatval($data['price'] ?? 0);
        $image = $conn->real_escape_string($data['image'] ?? '');
        $category_id = isset($data['category_id']) && $data['category_id'] ? intval($data['category_id']) : null;
        $stock = isset($data['stock']) ? intval($data['stock']) : 0;
        $weight_lbs = isset($data['weight_lbs']) && $data['weight_lbs'] ? floatval($data['weight_lbs']) : null;
        $variations = isset($data['variations']) && !empty($data['variations']) ? $conn->real_escape_string($data['variations']) : null;
        $gallery_images = isset($data['gallery_images']) && !empty($data['gallery_images']) ? $conn->real_escape_string($data['gallery_images']) : null;
        $comparison_before = isset($data['comparison_before']) && !empty($data['comparison_before']) ? $conn->real_escape_string($data['comparison_before']) : null;
        $comparison_after = isset($data['comparison_after']) && !empty($data['comparison_after']) ? $conn->real_escape_string($data['comparison_after']) : null;
        $related_products = isset($data['related_products']) && !empty($data['related_products']) ? $conn->real_escape_string($data['related_products']) : null;
        
        // Handle PDF fields - convert empty strings to null
        $datasheet_pdf = isset($data['datasheet_pdf']) && !empty($data['datasheet_pdf']) ? $conn->real_escape_string($data['datasheet_pdf']) : null;
        $brochure_pdf = isset($data['brochure_pdf']) && !empty($data['brochure_pdf']) ? $conn->real_escape_string($data['brochure_pdf']) : null;
        
        // Handle SEO fields
        $meta_title = isset($data['meta_title']) && !empty($data['meta_title']) ? $conn->real_escape_string($data['meta_title']) : null;
        $meta_description = isset($data['meta_description']) && !empty($data['meta_description']) ? $conn->real_escape_string($data['meta_description']) : null;
        $meta_keywords = isset($data['meta_keywords']) && !empty($data['meta_keywords']) ? $conn->real_escape_string($data['meta_keywords']) : null;
        
        // Handle catalog mode
        $catalog_mode = isset($data['catalog_mode']) ? $conn->real_escape_string($data['catalog_mode']) : 'no';
        
        // Handle sqft and length fields
        $sqft_enabled = isset($data['sqft_enabled']) ? intval($data['sqft_enabled']) : 0;
        $sqft_price = isset($data['sqft_price']) && $data['sqft_price'] ? floatval($data['sqft_price']) : null;
        $length_enabled = isset($data['length_enabled']) ? intval($data['length_enabled']) : 0;
        $length_base_price = isset($data['length_base_price']) && $data['length_base_price'] ? floatval($data['length_base_price']) : null;
        $length_increment_price = isset($data['length_increment_price']) && $data['length_increment_price'] ? floatval($data['length_increment_price']) : null;
        
        // Handle package fields
        $is_packaged = isset($data['is_packaged']) ? intval($data['is_packaged']) : 0;
        $pack_size = isset($data['pack_size']) && $data['pack_size'] !== '' && $data['pack_size'] !== null ? floatval($data['pack_size']) : null;
        $pcs_per_box = isset($data['pcs_per_box']) && $data['pcs_per_box'] !== '' && $data['pcs_per_box'] !== null ? intval($data['pcs_per_box']) : null;
        $show_unit_price = isset($data['show_unit_price']) ? intval($data['show_unit_price']) : 0;
        $show_price_unit_kit = isset($data['show_price_unit_kit']) ? intval($data['show_price_unit_kit']) : 0;
        
        // Handle call for pricing
        $call_for_pricing = isset($data['call_for_pricing']) ? intval($data['call_for_pricing']) : 0;
        
        // Check if SEO columns exist
        $checkSeoSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                       WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                       AND TABLE_NAME = 'products' 
                       AND COLUMN_NAME = 'meta_title'";
        $checkResult = $conn->query($checkSeoSql);
        $hasSeoFields = false;
        if ($checkResult) {
            $row = $checkResult->fetch_assoc();
            $hasSeoFields = $row['count'] > 0;
        }
        
        // Check if sqft/length columns exist
        $checkSqftSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                        WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                        AND TABLE_NAME = 'products' 
                        AND COLUMN_NAME = 'sqft_enabled'";
        $checkSqftResult = $conn->query($checkSqftSql);
        $hasSqftFields = false;
        if ($checkSqftResult) {
            $row = $checkSqftResult->fetch_assoc();
            $hasSqftFields = $row['count'] > 0;
        }
        
        // Check if package columns exist
        $checkPackageSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                           WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                           AND TABLE_NAME = 'products' 
                           AND COLUMN_NAME = 'is_packaged'";
        $checkPackageResult = $conn->query($checkPackageSql);
        $hasPackageFields = false;
        if ($checkPackageResult) {
            $row = $checkPackageResult->fetch_assoc();
            $hasPackageFields = $row['count'] > 0;
        }
        
        // Check if call_for_pricing column exists
        $checkCallForPricingSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                                  WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                                  AND TABLE_NAME = 'products' 
                                  AND COLUMN_NAME = 'call_for_pricing'";
        $checkCallForPricingResult = $conn->query($checkCallForPricingSql);
        $hasCallForPricingField = false;
        if ($checkCallForPricingResult) {
            $row = $checkCallForPricingResult->fetch_assoc();
            $hasCallForPricingField = $row['count'] > 0;
        }
        
        // Check if gift_product_id column exists
        $checkGiftProductSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                               WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                               AND TABLE_NAME = 'products' 
                               AND COLUMN_NAME = 'gift_product_id'";
        $checkGiftProductResult = $conn->query($checkGiftProductSql);
        $hasGiftProductField = false;
        if ($checkGiftProductResult) {
            $row = $checkGiftProductResult->fetch_assoc();
            $hasGiftProductField = $row['count'] > 0;
        }
        
        // Handle gift product
        $gift_product_id = isset($data['gift_product_id']) && $data['gift_product_id'] ? intval($data['gift_product_id']) : null;
        
        // Handle is_hidden
        $is_hidden = isset($data['is_hidden']) ? intval($data['is_hidden']) : 0;
        
        // Handle order_index
        $order_index = isset($data['order_index']) && $data['order_index'] !== '' && $data['order_index'] !== null ? intval($data['order_index']) : 0;
        
        // Check if show_price_unit_kit column exists
        $checkShowPriceUnitKitSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                                    WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                                    AND TABLE_NAME = 'products' 
                                    AND COLUMN_NAME = 'show_price_unit_kit'";
        $checkShowPriceUnitKitResult = $conn->query($checkShowPriceUnitKitSql);
        $hasShowPriceUnitKitField = false;
        if ($checkShowPriceUnitKitResult) {
            $row = $checkShowPriceUnitKitResult->fetch_assoc();
            $hasShowPriceUnitKitField = $row['count'] > 0;
        }
        
        // Check if is_hidden column exists
        $checkIsHiddenSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                           WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                           AND TABLE_NAME = 'products' 
                           AND COLUMN_NAME = 'is_hidden'";
        $checkIsHiddenResult = $conn->query($checkIsHiddenSql);
        $hasIsHiddenField = false;
        if ($checkIsHiddenResult) {
            $row = $checkIsHiddenResult->fetch_assoc();
            $hasIsHiddenField = $row['count'] > 0;
        }
        
        // Check if order_index column exists
        $checkOrderIndexSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                             WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                             AND TABLE_NAME = 'products' 
                             AND COLUMN_NAME = 'order_index'";
        $checkOrderIndexResult = $conn->query($checkOrderIndexSql);
        $hasOrderIndexField = false;
        if ($checkOrderIndexResult) {
            $row = $checkOrderIndexResult->fetch_assoc();
            $hasOrderIndexField = $row['count'] > 0;
        }
        
        $datasheetPdfValue = $datasheet_pdf ? "'$datasheet_pdf'" : 'NULL';
        $brochurePdfValue = $brochure_pdf ? "'$brochure_pdf'" : 'NULL';
        $weightLbsValue = $weight_lbs ? $weight_lbs : 'NULL';
        $variationsValue = $variations ? "'$variations'" : 'NULL';
        $galleryImagesValue = $gallery_images ? "'$gallery_images'" : 'NULL';
        $comparisonBeforeValue = $comparison_before ? "'$comparison_before'" : 'NULL';
        $comparisonAfterValue = $comparison_after ? "'$comparison_after'" : 'NULL';
        $relatedProductsValue = $related_products ? "'$related_products'" : 'NULL';
        
        $sqftPriceValue = $sqft_price ? $sqft_price : 'NULL';
        $lengthBasePriceValue = $length_base_price ? $length_base_price : 'NULL';
        $lengthIncrementPriceValue = $length_increment_price ? $length_increment_price : 'NULL';
        
        // Validate required fields
        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Product name is required']);
            exit();
        }
        
        // Build SQL dynamically based on which fields exist
        $columns = ['name', 'slug', 'description', 'price', 'image', 'category_id', 'stock', 'weight_lbs', 'variations', 'gallery_images', 'comparison_before', 'comparison_after', 'related_products', 'datasheet_pdf', 'brochure_pdf', 'catalog_mode', 'status'];
        $values = ["'$name'", "'$slug'", "'$description'", $price, "'$image'", ($category_id ? $category_id : 'NULL'), $stock, $weightLbsValue, $variationsValue, $galleryImagesValue, $comparisonBeforeValue, $comparisonAfterValue, $relatedProductsValue, $datasheetPdfValue, $brochurePdfValue, "'$catalog_mode'", "'active'"];
        
        if ($hasSeoFields) {
            $columns = array_merge($columns, ['meta_title', 'meta_description', 'meta_keywords']);
            $metaTitleValue = $meta_title ? "'$meta_title'" : 'NULL';
            $metaDescriptionValue = $meta_description ? "'$meta_description'" : 'NULL';
            $metaKeywordsValue = $meta_keywords ? "'$meta_keywords'" : 'NULL';
            $values = array_merge($values, [$metaTitleValue, $metaDescriptionValue, $metaKeywordsValue]);
        }
        
        if ($hasSqftFields) {
            $columns = array_merge($columns, ['sqft_enabled', 'sqft_price', 'length_enabled', 'length_base_price', 'length_increment_price']);
            $values = array_merge($values, [$sqft_enabled, $sqftPriceValue, $length_enabled, $lengthBasePriceValue, $lengthIncrementPriceValue]);
        }
        
        if ($hasPackageFields) {
            $columns = array_merge($columns, ['is_packaged', 'pack_size', 'show_unit_price']);
            $packSizeValue = $pack_size !== null ? $pack_size : 'NULL';
            $values = array_merge($values, [$is_packaged, $packSizeValue, $show_unit_price]);
        }
        
        if ($hasShowPriceUnitKitField) {
            $columns = array_merge($columns, ['show_price_unit_kit']);
            $values = array_merge($values, [$show_price_unit_kit]);
        }
        
        if ($hasPcsPerBoxField) {
            $columns = array_merge($columns, ['pcs_per_box']);
            $pcsPerBoxValue = $pcs_per_box !== null ? $pcs_per_box : 'NULL';
            $values = array_merge($values, [$pcsPerBoxValue]);
        }
        
        if ($hasCallForPricingField) {
            $columns = array_merge($columns, ['call_for_pricing']);
            $values = array_merge($values, [$call_for_pricing]);
        }
        
        if ($hasGiftProductField) {
            $columns = array_merge($columns, ['gift_product_id']);
            $giftProductIdValue = $gift_product_id ? $gift_product_id : 'NULL';
            $values = array_merge($values, [$giftProductIdValue]);
        }
        
        if ($hasIsHiddenField) {
            $columns = array_merge($columns, ['is_hidden']);
            $values = array_merge($values, [$is_hidden]);
        }
        
        if ($hasOrderIndexField) {
            $columns = array_merge($columns, ['order_index']);
            $values = array_merge($values, [$order_index]);
        }
        
        // Validate that columns and values arrays have the same length
        if (count($columns) !== count($values)) {
            http_response_code(500);
            echo json_encode([
                'success' => false, 
                'error' => 'Columns and values count mismatch: ' . count($columns) . ' columns, ' . count($values) . ' values',
                'columns' => $columns,
                'values' => $values
            ]);
            exit();
        }
        
        // Validate that columns and values are not empty
        if (empty($columns) || empty($values)) {
            http_response_code(500);
            echo json_encode([
                'success' => false, 
                'error' => 'Columns or values array is empty'
            ]);
            exit();
        }
        
        $sql = "INSERT INTO products (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $values) . ")";
        
        if ($conn->query($sql)) {
            $insertedId = $conn->insert_id;
            
            // Auto-generate SKU if not provided and SKU column exists
            $checkSkuSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                           WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                           AND TABLE_NAME = 'products' 
                           AND COLUMN_NAME = 'sku'";
            $checkSkuResult = $conn->query($checkSkuSql);
            $hasSkuColumn = false;
            if ($checkSkuResult) {
                $row = $checkSkuResult->fetch_assoc();
                $hasSkuColumn = $row['count'] > 0;
            }
            
            // Generate SKU if column exists and SKU not provided
            if ($hasSkuColumn && (!isset($data['sku']) || empty($data['sku']))) {
                $sku = 'PROD-' . str_pad($insertedId, 6, '0', STR_PAD_LEFT);
                $updateSkuSql = "UPDATE products SET sku = '$sku' WHERE id = $insertedId";
                $conn->query($updateSkuSql);
            }
            
            echo json_encode(['success' => true, 'id' => $insertedId]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error, 'sql' => $sql]);
        }
    } else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Update product
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
            exit();
        }
        
        $id = intval($data['id'] ?? 0);
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Product ID is required']);
            exit();
        }
        
        $name = $conn->real_escape_string($data['name'] ?? '');
        $slug = $conn->real_escape_string($data['slug'] ?? '');
        $description = $conn->real_escape_string($data['description'] ?? '');
        $price = floatval($data['price'] ?? 0);
        $image = $conn->real_escape_string($data['image'] ?? '');
        $category_id = isset($data['category_id']) && $data['category_id'] ? intval($data['category_id']) : null;
        $stock = isset($data['stock']) ? intval($data['stock']) : 0;
        $weight_lbs = isset($data['weight_lbs']) && $data['weight_lbs'] ? floatval($data['weight_lbs']) : null;
        $variations = isset($data['variations']) && !empty($data['variations']) ? $conn->real_escape_string($data['variations']) : null;
        $gallery_images = isset($data['gallery_images']) && !empty($data['gallery_images']) ? $conn->real_escape_string($data['gallery_images']) : null;
        $comparison_before = isset($data['comparison_before']) && !empty($data['comparison_before']) ? $conn->real_escape_string($data['comparison_before']) : null;
        $comparison_after = isset($data['comparison_after']) && !empty($data['comparison_after']) ? $conn->real_escape_string($data['comparison_after']) : null;
        $related_products = isset($data['related_products']) && !empty($data['related_products']) ? $conn->real_escape_string($data['related_products']) : null;
        
        // Handle PDF fields - convert empty strings to null
        $datasheet_pdf = isset($data['datasheet_pdf']) && !empty($data['datasheet_pdf']) ? $conn->real_escape_string($data['datasheet_pdf']) : null;
        $brochure_pdf = isset($data['brochure_pdf']) && !empty($data['brochure_pdf']) ? $conn->real_escape_string($data['brochure_pdf']) : null;
        
        // Handle SEO fields
        $meta_title = isset($data['meta_title']) && !empty($data['meta_title']) ? $conn->real_escape_string($data['meta_title']) : null;
        $meta_description = isset($data['meta_description']) && !empty($data['meta_description']) ? $conn->real_escape_string($data['meta_description']) : null;
        $meta_keywords = isset($data['meta_keywords']) && !empty($data['meta_keywords']) ? $conn->real_escape_string($data['meta_keywords']) : null;
        
        // Handle catalog mode
        $catalog_mode = isset($data['catalog_mode']) ? $conn->real_escape_string($data['catalog_mode']) : 'no';
        
        // Handle call for pricing
        $call_for_pricing = isset($data['call_for_pricing']) ? intval($data['call_for_pricing']) : 0;
        
        // Handle sqft and length fields
        $sqft_enabled = isset($data['sqft_enabled']) ? intval($data['sqft_enabled']) : 0;
        $sqft_price = isset($data['sqft_price']) && $data['sqft_price'] ? floatval($data['sqft_price']) : null;
        $length_enabled = isset($data['length_enabled']) ? intval($data['length_enabled']) : 0;
        $length_base_price = isset($data['length_base_price']) && $data['length_base_price'] ? floatval($data['length_base_price']) : null;
        $length_increment_price = isset($data['length_increment_price']) && $data['length_increment_price'] ? floatval($data['length_increment_price']) : null;
        
        // Handle package fields
        $is_packaged = isset($data['is_packaged']) ? intval($data['is_packaged']) : 0;
        $pack_size = isset($data['pack_size']) && $data['pack_size'] !== '' && $data['pack_size'] !== null ? floatval($data['pack_size']) : null;
        $pcs_per_box = isset($data['pcs_per_box']) && $data['pcs_per_box'] !== '' && $data['pcs_per_box'] !== null ? intval($data['pcs_per_box']) : null;
        $show_unit_price = isset($data['show_unit_price']) ? intval($data['show_unit_price']) : 0;
        $show_price_unit_kit = isset($data['show_price_unit_kit']) ? intval($data['show_price_unit_kit']) : 0;
        
        // Check if SEO columns exist
        $checkSeoSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                       WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                       AND TABLE_NAME = 'products' 
                       AND COLUMN_NAME = 'meta_title'";
        $checkResult = $conn->query($checkSeoSql);
        $hasSeoFields = false;
        if ($checkResult) {
            $row = $checkResult->fetch_assoc();
            $hasSeoFields = $row['count'] > 0;
        }
        
        // Check if sqft/length columns exist
        $checkSqftSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                        WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                        AND TABLE_NAME = 'products' 
                        AND COLUMN_NAME = 'sqft_enabled'";
        $checkSqftResult = $conn->query($checkSqftSql);
        $hasSqftFields = false;
        if ($checkSqftResult) {
            $row = $checkSqftResult->fetch_assoc();
            $hasSqftFields = $row['count'] > 0;
        }
        
        $datasheetPdfValue = $datasheet_pdf ? "'$datasheet_pdf'" : 'NULL';
        $brochurePdfValue = $brochure_pdf ? "'$brochure_pdf'" : 'NULL';
        $weightLbsValue = $weight_lbs ? $weight_lbs : 'NULL';
        $variationsValue = $variations ? "'$variations'" : 'NULL';
        $galleryImagesValue = $gallery_images ? "'$gallery_images'" : 'NULL';
        $comparisonBeforeValue = $comparison_before ? "'$comparison_before'" : 'NULL';
        $comparisonAfterValue = $comparison_after ? "'$comparison_after'" : 'NULL';
        $relatedProductsValue = $related_products ? "'$related_products'" : 'NULL';
        
        $sqftPriceValue = $sqft_price ? $sqft_price : 'NULL';
        $lengthBasePriceValue = $length_base_price ? $length_base_price : 'NULL';
        $lengthIncrementPriceValue = $length_increment_price ? $length_increment_price : 'NULL';
        
        // Validate required fields
        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Product name is required']);
            exit();
        }
        
        // Build SQL dynamically based on which fields exist
        $updateFields = [
            "name = '$name'",
            "slug = '$slug'",
            "description = '$description'",
            "price = $price",
            "image = '$image'",
            "category_id = " . ($category_id ? $category_id : 'NULL'),
            "stock = $stock",
            "weight_lbs = $weightLbsValue",
            "variations = $variationsValue",
            "gallery_images = $galleryImagesValue",
            "comparison_before = $comparisonBeforeValue",
            "comparison_after = $comparisonAfterValue",
            "related_products = $relatedProductsValue",
            "datasheet_pdf = $datasheetPdfValue",
            "brochure_pdf = $brochurePdfValue",
            "catalog_mode = '$catalog_mode'"
        ];
        
        if ($hasSeoFields) {
            $metaTitleValue = $meta_title ? "'$meta_title'" : 'NULL';
            $metaDescriptionValue = $meta_description ? "'$meta_description'" : 'NULL';
            $metaKeywordsValue = $meta_keywords ? "'$meta_keywords'" : 'NULL';
            $updateFields[] = "meta_title = $metaTitleValue";
            $updateFields[] = "meta_description = $metaDescriptionValue";
            $updateFields[] = "meta_keywords = $metaKeywordsValue";
        }
        
        if ($hasSqftFields) {
            $updateFields[] = "sqft_enabled = $sqft_enabled";
            $updateFields[] = "sqft_price = $sqftPriceValue";
            $updateFields[] = "length_enabled = $length_enabled";
            $updateFields[] = "length_base_price = $lengthBasePriceValue";
            $updateFields[] = "length_increment_price = $lengthIncrementPriceValue";
        }
        
        // Check if package columns exist
        $checkPackageSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                           WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                           AND TABLE_NAME = 'products' 
                           AND COLUMN_NAME = 'is_packaged'";
        $checkPackageResult = $conn->query($checkPackageSql);
        $hasPackageFields = false;
        if ($checkPackageResult) {
            $row = $checkPackageResult->fetch_assoc();
            $hasPackageFields = $row['count'] > 0;
        }
        
        // Check if pcs_per_box column exists
        $checkPcsPerBoxSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                             WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                             AND TABLE_NAME = 'products' 
                             AND COLUMN_NAME = 'pcs_per_box'";
        $checkPcsPerBoxResult = $conn->query($checkPcsPerBoxSql);
        $hasPcsPerBoxField = false;
        if ($checkPcsPerBoxResult) {
            $row = $checkPcsPerBoxResult->fetch_assoc();
            $hasPcsPerBoxField = $row['count'] > 0;
        }
        
        // Check if call_for_pricing column exists
        $checkCallForPricingSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                                  WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                                  AND TABLE_NAME = 'products' 
                                  AND COLUMN_NAME = 'call_for_pricing'";
        $checkCallForPricingResult = $conn->query($checkCallForPricingSql);
        $hasCallForPricingField = false;
        if ($checkCallForPricingResult) {
            $row = $checkCallForPricingResult->fetch_assoc();
            $hasCallForPricingField = $row['count'] > 0;
        }
        
        // Check if show_price_unit_kit column exists for UPDATE
        $checkShowPriceUnitKitSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                                    WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                                    AND TABLE_NAME = 'products' 
                                    AND COLUMN_NAME = 'show_price_unit_kit'";
        $checkShowPriceUnitKitResult = $conn->query($checkShowPriceUnitKitSql);
        $hasShowPriceUnitKitField = false;
        if ($checkShowPriceUnitKitResult) {
            $row = $checkShowPriceUnitKitResult->fetch_assoc();
            $hasShowPriceUnitKitField = $row['count'] > 0;
        }
        
        if ($hasPackageFields) {
            $updateFields[] = "is_packaged = $is_packaged";
            $packSizeValue = $pack_size !== null ? $pack_size : 'NULL';
            $updateFields[] = "pack_size = $packSizeValue";
            $updateFields[] = "show_unit_price = $show_unit_price";
        }
        
        if ($hasPcsPerBoxField) {
            $pcsPerBoxValue = $pcs_per_box !== null ? $pcs_per_box : 'NULL';
            $updateFields[] = "pcs_per_box = $pcsPerBoxValue";
        }
        
        if ($hasShowPriceUnitKitField) {
            $updateFields[] = "show_price_unit_kit = $show_price_unit_kit";
        }
        
        if ($hasCallForPricingField) {
            $updateFields[] = "call_for_pricing = $call_for_pricing";
        }
        
        // Check if gift_product_id column exists for UPDATE
        $checkGiftProductSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                               WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                               AND TABLE_NAME = 'products' 
                               AND COLUMN_NAME = 'gift_product_id'";
        $checkGiftProductResult = $conn->query($checkGiftProductSql);
        $hasGiftProductField = false;
        if ($checkGiftProductResult) {
            $row = $checkGiftProductResult->fetch_assoc();
            $hasGiftProductField = $row['count'] > 0;
        }
        
        // Handle gift product for UPDATE
        $gift_product_id = isset($data['gift_product_id']) && $data['gift_product_id'] ? intval($data['gift_product_id']) : null;
        
        // Handle is_hidden for UPDATE
        $is_hidden = isset($data['is_hidden']) ? intval($data['is_hidden']) : 0;
        
        // Handle order_index for UPDATE
        $order_index = isset($data['order_index']) && $data['order_index'] !== '' && $data['order_index'] !== null ? intval($data['order_index']) : 0;
        
        // Check if is_hidden column exists for UPDATE
        $checkIsHiddenSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                           WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                           AND TABLE_NAME = 'products' 
                           AND COLUMN_NAME = 'is_hidden'";
        $checkIsHiddenResult = $conn->query($checkIsHiddenSql);
        $hasIsHiddenField = false;
        if ($checkIsHiddenResult) {
            $row = $checkIsHiddenResult->fetch_assoc();
            $hasIsHiddenField = $row['count'] > 0;
        }
        
        // Check if order_index column exists for UPDATE
        $checkOrderIndexSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                             WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                             AND TABLE_NAME = 'products' 
                             AND COLUMN_NAME = 'order_index'";
        $checkOrderIndexResult = $conn->query($checkOrderIndexSql);
        $hasOrderIndexField = false;
        if ($checkOrderIndexResult) {
            $row = $checkOrderIndexResult->fetch_assoc();
            $hasOrderIndexField = $row['count'] > 0;
        }
        
        if ($hasGiftProductField) {
            $giftProductIdValue = $gift_product_id ? $gift_product_id : 'NULL';
            $updateFields[] = "gift_product_id = $giftProductIdValue";
        }
        
        if ($hasIsHiddenField) {
            $updateFields[] = "is_hidden = $is_hidden";
        }
        
        if ($hasOrderIndexField) {
            $updateFields[] = "order_index = $order_index";
        }
        
        $sql = "UPDATE products SET " . implode(', ', $updateFields) . " WHERE id = $id";
        
        if ($conn->query($sql)) {
            // Auto-generate SKU if not provided and SKU column exists
            $checkSkuSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                           WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                           AND TABLE_NAME = 'products' 
                           AND COLUMN_NAME = 'sku'";
            $checkSkuResult = $conn->query($checkSkuSql);
            $hasSkuColumn = false;
            if ($checkSkuResult) {
                $row = $checkSkuResult->fetch_assoc();
                $hasSkuColumn = $row['count'] > 0;
            }
            
            // Generate SKU if column exists, SKU not provided, and product doesn't have SKU
            if ($hasSkuColumn && (!isset($data['sku']) || empty($data['sku']))) {
                // Check if product already has SKU
                $checkExistingSku = "SELECT sku FROM products WHERE id = $id";
                $existingSkuResult = $conn->query($checkExistingSku);
                if ($existingSkuResult) {
                    $existingRow = $existingSkuResult->fetch_assoc();
                    if (empty($existingRow['sku'])) {
                        $sku = 'PROD-' . str_pad($id, 6, '0', STR_PAD_LEFT);
                        $updateSkuSql = "UPDATE products SET sku = '$sku' WHERE id = $id";
                        $conn->query($updateSkuSql);
                    }
                }
            }
            
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
        }
    } else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $id = intval($_GET['id'] ?? 0);
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Product ID is required']);
            exit();
        }
        
        // Hard delete - permanently delete the product
        // Foreign keys are set to ON DELETE SET NULL or CASCADE, so related records will be handled automatically
        $sql = "DELETE FROM products WHERE id = $id";
        
        if ($conn->query($sql)) {
            echo json_encode(['success' => true, 'message' => 'Product deleted permanently']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

$conn->close();
?>
