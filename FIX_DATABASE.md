# Veritabanı Düzeltme - tileandturf.oguzhansenyigit.com

## Durum
- ✅ Veritabanı bağlantısı çalışıyor
- ❌ Temel tablolar (categories, products, orders) YOK
- ✅ Advanced database çalıştırılmış (ama temel tablolar olmadan çalışmaz)

## Çözüm

### 1. Temel Veritabanını Oluştur
Önce temel tabloları oluştur:
```
https://tileandturf.oguzhansenyigit.com/api/init_database.php
```

Bu script şu tabloları oluşturur:
- categories
- products
- orders
- order_items
- google_merchant_products

### 2. Sonra Advanced Database Script'ini Tekrar Çalıştır
Temel tablolar oluştuktan sonra, advanced script'i tekrar çalıştırabilirsin:
```
https://tileandturf.oguzhansenyigit.com/api/init_advanced_database.php
```

Bu script şu tabloları oluşturur:
- statistics
- product_views
- settings
- sliders
- customers
- menu_items
- social_media
- google_merchant_settings

### 3. PDF Alanları Ekle (Opsiyonel)
```
https://tileandturf.oguzhansenyigit.com/api/add_pdf_fields.php
```

## Sıralama ÖNEMLİ:
1. **ÖNCE:** init_database.php (temel tablolar)
2. **SONRA:** init_advanced_database.php (gelişmiş tablolar)
3. **SON OLARAK:** add_pdf_fields.php (PDF alanları)

## Test
Tekrar debug script'ini çalıştır:
```
https://tileandturf.oguzhansenyigit.com/api/debug.php
```

Şimdi tüm tablolar `true` olmalı!

