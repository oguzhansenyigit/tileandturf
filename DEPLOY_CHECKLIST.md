# ✅ Deploy Checklist - tileandturf.oguzhansenyigit.com

## 🚀 Hızlı Deploy Adımları

### 1️⃣ Frontend Build (YERELDE)
```bash
npm run build
```
Bu komut `dist/` klasörü oluşturur.

### 2️⃣ Sunucuya Yüklenecek Dosyalar

#### ✅ Frontend (dist/ klasöründen)
- [ ] `dist/` klasörünün TÜM içeriği → Sunucunun kök dizinine (public_html veya www)
- [ ] `dist/index.html` → `index.html` olarak kök dizine
- [ ] `dist/assets/` klasörü → `assets/` olarak kök dizine

#### ✅ Resimler ve Statik Dosyalar
- [ ] `*.webp` (slider.webp, slider2.webp, slider3.webp, slider4.webp, slider5.webp)
- [ ] `adjustable-pedestal-mainpage.webp`
- [ ] `greenroof-mainpage.webp`
- [ ] `logo.svg`
- [ ] `creditcart.png`

#### ✅ Backend (API) Dosyaları
- [ ] `api/` klasörünün TAMAMI → `api/` klasörü olarak
- [ ] `.htaccess` dosyası → Kök dizine

#### ✅ Veritabanı Config (ÖNEMLİ!)
- [ ] `api/config.php` → Veritabanı bilgileri zaten doğru (kontrol edin)

### 3️⃣ Sunucuda Yapılacaklar

#### Database Kurulumu (SIRASIYLA!)
1. [ ] `http://tileandturf.oguzhansenyigit.com/api/init_database.php` → Çalıştır
2. [ ] `http://tileandturf.oguzhansenyigit.com/api/init_advanced_database.php` → Çalıştır
3. [ ] `http://tileandturf.oguzhansenyigit.com/api/add_pdf_fields.php` → Çalıştır (opsiyonel)

#### Klasör İzinleri
- [ ] `api/uploads/pdfs/` klasörü oluştur → 755 veya 777 izin ver

#### .htaccess Kontrolü
- [ ] Kök dizinde `.htaccess` dosyası var mı?
- [ ] Apache mod_rewrite aktif mi?

### 4️⃣ Güncellenecek Dosyalar (ZATEN YAPILDI ✅)

- ✅ `api/google-merchant/feed.php` → baseUrl güncellendi
- ✅ `api/config.php` → DB bilgileri doğru
- ✅ `.htaccess` → Oluşturuldu

### 5️⃣ Test Adımları

1. [ ] Ana sayfa: `https://tileandturf.oguzhansenyigit.com`
2. [ ] Admin paneli: `https://tileandturf.oguzhansenyigit.com/admin` (şifre: admin123)
3. [ ] API test: `https://tileandturf.oguzhansenyigit.com/api/products.php`
4. [ ] Google Merchant feed: `https://tileandturf.oguzhansenyigit.com/api/google-merchant/feed.php`

### 6️⃣ Son Kontroller

- [ ] Tüm resimler yüklendi mi?
- [ ] API endpoint'leri çalışıyor mu?
- [ ] Admin paneli açılıyor mu?
- [ ] Veritabanı bağlantısı çalışıyor mu?

---

## 📝 Özet: Hangi Dosyalar Güncellenmeli?

**GÜNCELLEME GEREKMEYEN (Zaten hazır):**
- ✅ Frontend kodları (build edilecek)
- ✅ Backend API dosyaları
- ✅ Google Merchant feed (baseUrl güncellendi)
- ✅ Database config (doğru)

**SUNUCUDA YAPILACAKLAR:**
- Database initialization (3 script çalıştırılacak)
- Klasör izinleri (uploads/pdfs)
- .htaccess kontrolü

**YERELDE YAPILACAKLAR:**
- `npm run build` → Frontend build et
- Build çıktısını sunucuya yükle

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Frontend Build:** Her kod değişikliğinden sonra `npm run build` çalıştırın
2. **PHP Dosyaları:** Build gerektirmez, direkt çalışır
3. **node_modules:** Sunucuya YÜKLEMEYİN
4. **Build Çıktısı:** Sadece `dist/` klasörünün içeriğini yükleyin

