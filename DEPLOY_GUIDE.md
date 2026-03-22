# 📤 Deployment Rehberi - tileandturf.oguzhansenyigit.com

## 🎯 ÖNEMLİ: Sunucuya Hangi Dosyaları Yükleyeceksin?

### ✅ 1. BUILD EDİLMİŞ FRONTEND (dist/ klasörü)

**YERELDE:**
```bash
npm run build
```
Bu komut `dist/` klasörü oluşturur.

**SUNUCUYA YÜKLENECEK:**
- `dist/` klasörünün **TÜM İÇERİĞİ** → Sunucunun kök dizinine (public_html veya www)
  - `dist/index.html` → `index.html` (kök dizine)
  - `dist/assets/` klasörü → `assets/` (kök dizine)
  - `dist/assets/*.js` → JavaScript dosyaları
  - `dist/assets/*.css` → CSS dosyaları
  - `dist/assets/*.png`, `*.svg`, `*.webp` → Resimler

### ✅ 2. BACKEND API (PHP Dosyaları)

**SUNUCUYA YÜKLENECEK:**
- `api/` klasörünün **TAMAMI** → `api/` klasörü olarak kök dizine
  - `api/config.php`
  - `api/products.php`
  - `api/categories.php`
  - `api/orders.php`
  - `api/admin/*.php` (tüm admin API'leri)
  - `api/google-merchant/feed.php`
  - `api/uploads/` klasörü (eğer yoksa oluştur, izin: 755 veya 777)

### ✅ 3. STATIK DOSYALAR

**SUNUCUYA YÜKLENECEK (Kök dizine):**
- `.htaccess` dosyası → Kök dizine
- Resimler (eğer build içinde yoksa):
  - `slider.webp`, `slider2.webp`, `slider3.webp`, `slider4.webp`, `slider5.webp`
  - `adjustable-pedestal-mainpage.webp`
  - `greenroof-mainpage.webp`
  - `logo.svg`
  - `creditcart.png`

---

## 📁 Sunucu Dizin Yapısı (Hedef)

```
public_html/ (veya www/)
│
├── index.html                    ← dist/index.html
├── .htaccess                     ← .htaccess
│
├── assets/                       ← dist/assets/
│   ├── index-*.js
│   ├── index-*.css
│   ├── *.png
│   ├── *.svg
│   └── *.webp
│
├── api/                          ← api/ klasörü
│   ├── config.php
│   ├── products.php
│   ├── categories.php
│   ├── orders.php
│   ├── admin/
│   │   ├── login.php
│   │   ├── dashboard.php
│   │   ├── products.php
│   │   ├── orders.php
│   │   ├── customers.php
│   │   ├── sliders.php
│   │   ├── menu.php
│   │   ├── settings.php
│   │   └── social-media.php
│   ├── google-merchant/
│   │   └── feed.php
│   └── uploads/
│       └── pdfs/                 ← Oluştur (izni: 755 veya 777)
│
└── [Resimler] (kök dizinde)
    ├── slider.webp
    ├── slider2.webp
    ├── slider3.webp
    ├── slider4.webp
    ├── slider5.webp
    ├── adjustable-pedestal-mainpage.webp
    ├── greenroof-mainpage.webp
    ├── logo.svg
    └── creditcart.png
```

---

## 🚀 ADIM ADIM DEPLOY

### **ADIM 1: Build Et (YERELDE)**

```bash
npm run build
```

### **ADIM 2: FTP/cPanel ile Yükle**

#### **2a. Frontend (dist/ içeriği)**
1. `dist/` klasörünün **içindeki TÜM dosyaları** seç
2. Sunucunun kök dizinine (public_html veya www) yükle
3. `dist/index.html` → `index.html` olarak yüklenecek
4. `dist/assets/` → `assets/` olarak yüklenecek

#### **2b. Backend (api/ klasörü)**
1. `api/` klasörünün **TAMAMINI** seç
2. Kök dizine `api/` olarak yükle
3. Klasör yapısı korunmalı

#### **2c. .htaccess**
1. `.htaccess` dosyasını kök dizine yükle

#### **2d. Resimler (opsiyonel)**
- Eğer resimler `dist/assets/` içinde değilse, kök dizine yükle

### **ADIM 3: Sunucuda Yapılacaklar**

#### **3a. Klasör İzinleri**
- `api/uploads/pdfs/` klasörünü oluştur
- İzni **755** veya **777** yap (PDF upload için)

#### **3b. Database Kurulumu (phpMyAdmin veya SQL)**
1. **Yöntem 1: SQL Dosyası (Önerilen)**
   - phpMyAdmin'e gir
   - `u632602124_tile1` veritabanını seç
   - "Import" sekmesine tıkla
   - `database.sql` dosyasını yükle
   - "Go" butonuna tıkla

2. **Yöntem 2: PHP Scriptleri**
   - Tarayıcıda aç:
     - `https://tileandturf.oguzhansenyigit.com/api/init_database.php`
     - `https://tileandturf.oguzhansenyigit.com/api/init_advanced_database.php`
     - `https://tileandturf.oguzhansenyigit.com/api/add_pdf_fields.php`

---

## ❌ YÜKLEMEYECEKLERİN

- `node_modules/` klasörü → **ASLA yükleme!**
- `src/` klasörü → **Gerek yok (build edilmiş hali var)**
- `package.json`, `package-lock.json` → **Gerek yok**
- `vite.config.js`, `tailwind.config.js` → **Gerek yok**
- `.git/` klasörü → **Gerek yok**
- `dist/` klasörünün kendisi → **İçeriğini yükle, klasörü değil!**

---

## ✅ KONTROL LİSTESİ

### Yerelde:
- [ ] `npm run build` çalıştırdım
- [ ] `dist/` klasörü oluştu
- [ ] `dist/index.html` var
- [ ] `dist/assets/` klasörü var

### Sunucuda (FTP/cPanel):
- [ ] `index.html` kök dizinde
- [ ] `assets/` klasörü kök dizinde
- [ ] `api/` klasörü kök dizinde
- [ ] `.htaccess` kök dizinde
- [ ] `api/uploads/pdfs/` klasörü var ve izinleri 755/777

### Sunucuda (Tarayıcı):
- [ ] Ana sayfa açılıyor: `https://tileandturf.oguzhansenyigit.com`
- [ ] Admin paneli açılıyor: `https://tileandturf.oguzhansenyigit.com/admin`
- [ ] API çalışıyor: `https://tileandturf.oguzhansenyigit.com/api/products.php`
- [ ] Veritabanı bağlantısı çalışıyor

---

## 🎯 ÖZET: Hangi Dosyalar Nereye?

| Dosya/Klasör | Nereye Yüklenecek? | Önem |
|-------------|-------------------|------|
| `dist/index.html` | Kök dizin → `index.html` | ⭐⭐⭐ |
| `dist/assets/*` | Kök dizin → `assets/*` | ⭐⭐⭐ |
| `api/` (tam klasör) | Kök dizin → `api/` | ⭐⭐⭐ |
| `.htaccess` | Kök dizin → `.htaccess` | ⭐⭐⭐ |
| Resimler (`.webp`, `.svg`, `.png`) | Kök dizin veya `assets/` | ⭐⭐ |
| `database.sql` | phpMyAdmin'e import | ⭐⭐⭐ |

---

## 💡 İPUÇLARI

1. **Build öncesi:** Kod değişikliklerini kaydettiğinden emin ol
2. **Build sonrası:** `dist/` klasörünü kontrol et
3. **Yükleme:** Klasör yapısını koru (özelikle `api/` klasörü)
4. **İzinler:** `api/uploads/pdfs/` klasörüne yazma izni ver
5. **Test:** Yükleme sonrası mutlaka test et

---

## 🆘 SORUN GİDERME

### "404 Not Found" hatası:
- `.htaccess` dosyası yüklü mü?
- Apache mod_rewrite aktif mi?

### "500 Internal Server Error":
- `api/config.php` veritabanı bilgileri doğru mu?
- `api/uploads/` klasörü izinleri doğru mu?

### "Admin paneli açılmıyor":
- `dist/assets/` dosyaları yüklü mü?
- Browser console'da hata var mı?

### "API çalışmıyor":
- `api/` klasörü doğru yerde mi?
- PHP çalışıyor mu?

