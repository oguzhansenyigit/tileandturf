# Deployment Guide - tileandturf.oguzhansenyigit.com

## Adım 1: Frontend Build

```bash
npm run build
```

Bu komut `dist/` klasörü oluşturur. Bu klasörü sunucuya yükleyeceksiniz.

## Adım 2: Dosya Yükleme Listesi

### Frontend Dosyaları (dist/ klasöründen)
- `dist/` klasörünün tüm içeriği → Sunucunun kök dizinine (public_html veya www)
- Resimler: `*.webp`, `logo.svg`, `creditcart.png` → Kök dizine

### Backend Dosyaları (direkt yüklenir, build gerekmez)
- `api/` klasörünün TAMAMı → Sunucunun `api/` klasörüne
- `api/config.php` → Veritabanı bilgilerini güncelleyin!

## Adım 3: Veritabanı Kurulumu

1. Önce temel veritabanını oluşturun:
   ```
   http://tileandturf.oguzhansenyigit.com/api/init_database.php
   ```

2. Sonra gelişmiş admin paneli tablolarını oluşturun:
   ```
   http://tileandturf.oguzhansenyigit.com/api/init_advanced_database.php
   ```

3. PDF alanlarını ekleyin (eğer gerekirse):
   ```
   http://tileandturf.oguzhansenyigit.com/api/add_pdf_fields.php
   ```

## Adım 4: Önemli Dosya Güncellemeleri

### 1. api/config.php
```php
<?php
define('DB_HOST', 'localhost'); // veya sunucunuzun MySQL host'u
define('DB_USER', 'u632602124_tile');
define('DB_PASS', '11241124Oguzhan.');
define('DB_NAME', 'u632602124_tile1');

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
```

### 2. api/google-merchant/feed.php
`$baseUrl` değişkenini güncelleyin:
```php
$baseUrl = 'https://tileandturf.oguzhansenyigit.com';
```

### 3. .htaccess (Apache için)
Kök dizinde `.htaccess` dosyası oluşturun (SPA routing için):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Adım 5: Klasör Yapısı

Sunucuda klasör yapısı şöyle olmalı:

```
/public_html/ (veya www/)
├── index.html (dist/ içinden)
├── assets/ (dist/ içinden)
├── logo.svg
├── *.webp (resimler)
├── creditcart.png
├── .htaccess
└── api/
    ├── config.php (GÜNCELLE!)
    ├── init_database.php
    ├── init_advanced_database.php
    ├── add_pdf_fields.php
    ├── admin/
    ├── google-merchant/
    └── ... (diğer PHP dosyaları)
```

## Adım 6: İzinler (Permissions)

Sunucuda şu klasörlere yazma izni verin:
- `api/uploads/pdfs/` → 755 veya 777

## Adım 7: Test

1. Ana sayfa: `https://tileandturf.oguzhansenyigit.com`
2. Admin paneli: `https://tileandturf.oguzhansenyigit.com/admin` (şifre: admin123)
3. API test: `https://tileandturf.oguzhansenyigit.com/api/products.php`

## Önemli Notlar

- Frontend build'i HER değişiklikten sonra tekrar yapın
- PHP dosyaları build gerektirmez, direkt çalışır
- `node_modules/` klasörünü sunucuya YÜKLEMEYİN
- Sadece `dist/` klasörünün içeriğini yükleyin

