# Test Checklist - tileandturf.oguzhansenyigit.com

## ✅ Veritabanı Kontrolü

1. **Debug Script Testi:**
   ```
   https://tileandturf.oguzhansenyigit.com/api/debug.php
   ```
   
   Beklenen sonuç:
   ```json
   {
       "connection": true,
       "tables": {
           "categories": true,
           "products": true,
           "orders": true,
           "order_items": true
       },
       "tables": {
           "categories_count": 0,
           "products_count": 0,
           "orders_count": 0,
           "order_items_count": 0
       }
   }
   ```

## ✅ API Endpoint Testleri

2. **Categories API:**
   ```
   https://tileandturf.oguzhansenyigit.com/api/categories.php
   ```
   Beklenen: Boş array `[]` (henüz kategori yok)

3. **Products API:**
   ```
   https://tileandturf.oguzhansenyigit.com/api/products.php
   ```
   Beklenen: Boş array `[]` (henüz ürün yok)

## ✅ Frontend Testleri

4. **Ana Sayfa:**
   ```
   https://tileandturf.oguzhansenyigit.com
   ```
   - Site açılıyor mu?
   - Hata mesajı var mı?

5. **Admin Paneli:**
   ```
   https://tileandturf.oguzhansenyigit.com/admin
   ```
   - Giriş sayfası görünüyor mu?
   - Şifre: `admin123`
   - Dashboard açılıyor mu?

## ⚠️ Bilinen Durumlar

- Kategoriler ve ürünler henüz eklenmedi (boş tablolar normal)
- Admin paneli temel özellikler mevcut (Dashboard hazır)
- Diğer admin paneli özellikleri (Products, Orders, Settings, vb.) henüz tamamlanmadı

## Sonraki Adımlar

1. ✅ Veritabanı kontrolü yap
2. ✅ API'leri test et
3. ✅ Frontend'i test et
4. ⏳ Admin paneli özelliklerini tamamla (Products, Orders, Settings, vb.)

