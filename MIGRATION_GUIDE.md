# Migration Guide - tileandturf.com

Bu dosya, projeyi yeni sunucuya (tileandturf.com) taşıma adımlarını içerir.

## 1. Veritabanı Konfigürasyonu

✅ `api/config.php` dosyası yeni veritabanı bilgileriyle güncellendi:
- Database: `u753039087_newweb1`
- User: `u753039087_newweb`
- Password: `11241124Oguzhan.`

## 2. Veritabanı Export/Import

### Eski Sunucudan Export

1. **phpMyAdmin ile Export:**
   - Eski sunucunun phpMyAdmin'ine giriş yapın
   - Veritabanını seçin (`u632602124_tile1`)
   - "Export" sekmesine gidin
   - "Quick" method seçin
   - "Go" butonuna tıklayın
   - SQL dosyasını indirin

2. **Komut Satırı ile Export:**
   ```bash
   mysqldump -u u632602124_tile -p u632602124_tile1 > backup.sql
   ```

### Yeni Sunucuya Import

1. **phpMyAdmin ile Import:**
   - Yeni sunucunun phpMyAdmin'ine giriş yapın
   - Veritabanını seçin (`u753039087_newweb1`)
   - "Import" sekmesine gidin
   - Export ettiğiniz SQL dosyasını seçin
   - "Go" butonuna tıklayın

2. **Komut Satırı ile Import:**
   ```bash
   mysql -u u753039087_newweb -p u753039087_newweb1 < backup.sql
   ```

## 3. Dosya Yükleme

1. Tüm proje dosyalarını yeni sunucuya yükleyin (FTP/SFTP ile)
2. Dosya izinlerini kontrol edin:
   - `api/` klasörü: 755
   - Upload klasörleri (varsa): 777

## 4. Gerekli Script'leri Çalıştırma

Yeni veritabanında eksik kolonları eklemek için şu script'leri çalıştırın:

1. **Package Fields:**
   ```
   https://tileandturf.com/api/add_package_fields.php
   ```

2. **PCS Per Box Field:**
   ```
   https://tileandturf.com/api/add_pcs_per_box_field.php
   ```

3. **Show Unit Price Field:**
   ```
   https://tileandturf.com/api/add_show_unit_price_field.php
   ```

4. **Call for Pricing Field:**
   ```
   https://tileandturf.com/api/add_call_for_pricing_field.php
   ```

5. **Gift Product Field:**
   ```
   https://tileandturf.com/api/add_gift_product_field.php
   ```

6. **Is Hidden Field:**
   ```
   https://tileandturf.com/api/add_is_hidden_field.php
   ```

7. **Category PDF Fields:**
   ```
   https://tileandturf.com/api/add_category_pdf_fields.php
   ```

8. **SEO Fields:**
   ```
   https://tileandturf.com/api/add_seo_fields.php
   ```

9. **SKU Field:**
   ```
   https://tileandturf.com/api/add_sku_field.php
   ```

## 5. Resim ve Dosya Yükleme

Detaylı bilgi için `IMAGE_UPLOAD_GUIDE.md` dosyasına bakın.

**Özet:**
1. `api/uploads/images/` klasörünü oluşturun (izin: 777)
2. `uploads/pdfs/` klasörünü oluşturun (izin: 777)
3. Tüm statik resimleri (slider.webp, logo.svg, vb.) kök dizine kopyalayın
4. Eski sunucudan yüklenen resimleri `api/uploads/images/` klasörüne kopyalayın
5. Eski sunucudan yüklenen PDF'leri `uploads/pdfs/` klasörüne kopyalayın

## 6. Build ve Deploy

1. **Development Build:**
   ```bash
   npm run build
   ```

2. **Production Build:**
   ```bash
   npm run build
   ```

3. `dist/` klasöründeki dosyaları yeni sunucuya yükleyin

## 7. Kontrol Listesi

- [ ] `api/config.php` güncellendi
- [ ] Veritabanı export edildi
- [ ] Veritabanı yeni sunucuya import edildi
- [ ] Tüm dosyalar yeni sunucuya yüklendi
- [ ] Gerekli script'ler çalıştırıldı
- [ ] Build yapıldı ve deploy edildi
- [ ] Site test edildi
- [ ] Admin paneli çalışıyor
- [ ] Ürünler görüntüleniyor
- [ ] Sipariş sistemi çalışıyor

## 8. Önemli Notlar

- **Image/PDF Paths:** Eğer görsel veya PDF yolları mutlak path kullanıyorsa, bunları kontrol edin
- **Email Settings:** E-posta gönderimi için SMTP ayarlarını kontrol edin
- **SSL Certificate:** HTTPS için SSL sertifikası kurulu olmalı
- **.htaccess:** Apache için `.htaccess` dosyası gerekli olabilir

## 9. Sorun Giderme

### Veritabanı Bağlantı Hatası
- `api/config.php` dosyasındaki bilgileri kontrol edin
- Veritabanı kullanıcısının yetkilerini kontrol edin

### 404 Hataları
- `.htaccess` dosyasını kontrol edin
- Apache mod_rewrite aktif olmalı

### Image/PDF Yüklenmiyor
- Upload klasörlerinin izinlerini kontrol edin (777)
- `php.ini` dosyasında `upload_max_filesize` ve `post_max_size` değerlerini kontrol edin

## 10. İletişim

Sorun yaşarsanız, hata mesajlarını ve console log'larını kontrol edin.
