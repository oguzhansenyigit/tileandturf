# Veritabanı İçe Aktarma Rehberi

## SQL Dosyası Hazır: `database.sql`

Bu dosya tüm tabloları ve varsayılan verileri içerir.

## İçe Aktarma Yöntemleri

### Yöntem 1: phpMyAdmin (Önerilen)

1. **phpMyAdmin'e giriş yapın**
   - Hosting panelinizden phpMyAdmin'e erişin
   - Veritabanı: `u632602124_tile1` seçin

2. **SQL dosyasını içe aktarın**
   - Üst menüden **"Import"** (İçe Aktar) sekmesine tıklayın
   - **"Choose File"** (Dosya Seç) butonuna tıklayın
   - `database.sql` dosyasını seçin
   - **"Go"** (Git) butonuna tıklayın

3. **Başarı mesajını kontrol edin**
   - Tüm tablolar başarıyla oluşturuldu mesajını görmelisiniz

### Yöntem 2: MySQL Komut Satırı

```bash
mysql -u u632602124_tile -p u632602124_tile1 < database.sql
```

Şifre istenecek: `11241124Oguzhan.`

### Yöntem 3: Hosting Panel (cPanel, Plesk, vb.)

1. Hosting panelinizde **"MySQL Databases"** bölümüne gidin
2. **"phpMyAdmin"** veya **"Import"** seçeneğini bulun
3. `database.sql` dosyasını yükleyin
4. İçe aktarma işlemini başlatın

## Dosyada Neler Var?

### Tablolar (15 tablo):
1. ✅ **categories** - Kategoriler
2. ✅ **products** - Ürünler (PDF alanları dahil)
3. ✅ **orders** - Siparişler
4. ✅ **order_items** - Sipariş öğeleri
5. ✅ **google_merchant_products** - Google Merchant ürünleri
6. ✅ **statistics** - İstatistikler
7. ✅ **product_views** - Ürün görüntülenme takibi
8. ✅ **settings** - Site ayarları
9. ✅ **sliders** - Slider yönetimi
10. ✅ **customers** - Müşteriler
11. ✅ **menu_items** - Menü öğeleri
12. ✅ **social_media** - Sosyal medya linkleri
13. ✅ **google_merchant_settings** - Google Merchant ayarları

### Varsayılan Veriler:
- ✅ Site ayarları (top banner, WhatsApp, vb.)
- ✅ Menü öğeleri (7 adet)
- ✅ Sosyal medya linkleri (WhatsApp, Instagram)

## İçe Aktarma Sonrası Kontrol

1. **Debug script'ini çalıştırın:**
   ```
   https://tileandturf.oguzhansenyigit.com/api/debug.php
   ```

2. **Beklenen sonuç:**
   ```json
   {
       "connection": true,
       "tables": {
           "categories": true,
           "products": true,
           "orders": true,
           "order_items": true
       }
   }
   ```

## Notlar

- ⚠️ **Eğer tablolar zaten varsa:** `CREATE TABLE IF NOT EXISTS` kullanıldığı için güvenle çalıştırabilirsiniz
- ⚠️ **INSERT IGNORE kullanıldı:** Varsayılan veriler sadece yoksa eklenecek
- ✅ **Foreign key'ler:** Tablolar doğru sırayla oluşturulur
- ✅ **PDF alanları:** Products tablosunda hazır

## Hata Durumunda

Eğer hata alırsanız:
1. Hata mesajını not edin
2. phpMyAdmin'de **"SQL"** sekmesinden teker teker tablo oluşturmayı deneyin
3. Veya bana hata mesajını gönderin

