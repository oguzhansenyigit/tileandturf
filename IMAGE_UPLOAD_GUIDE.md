# Resim ve Dosya Yükleme Rehberi

## 📁 Klasör Yapısı

### 1. Yüklenen Resimler (Admin Panelden)
- **Klasör:** `api/uploads/images/`
- **URL Formatı:** `/api/uploads/images/filename.jpg`
- **Oluşturulma:** Admin panelden resim yüklendiğinde otomatik oluşturulur

### 2. Yüklenen PDF'ler
- **Klasör:** `uploads/pdfs/` (proje kök dizininde)
- **URL Formatı:** `/uploads/pdfs/filename.pdf`
- **Oluşturulma:** Admin panelden PDF yüklendiğinde otomatik oluşturulur

### 3. Statik Resimler (Slider, Logo, vb.)
- **Klasör:** Proje kök dizini (`/`)
- **Örnekler:**
  - `slider.webp`, `slider2.webp`, `slider3.webp` (ana sayfa slider)
  - `logo.svg` (logo)
  - `porcelain-paver.webp`, `porcelain-paver-after.webp` (ürün resimleri)
  - Diğer statik resimler

## 🚀 Yeni Sunucuya Taşıma

### Adım 1: Upload Klasörlerini Oluştur

Yeni sunucuda şu klasörleri oluşturun:

```
api/uploads/images/
uploads/pdfs/
```

**İzinler:**
- `api/uploads/` klasörü: **755** veya **777**
- `api/uploads/images/` klasörü: **777** (yazma izni için)
- `uploads/` klasörü: **755** veya **777**
- `uploads/pdfs/` klasörü: **777** (yazma izni için)

### Adım 2: Mevcut Resimleri Kopyala

**Eski sunucudan yeni sunucuya kopyalanması gerekenler:**

1. **Statik Resimler (Kök Dizin):**
   ```
   slider.webp
   slider2.webp
   slider3.webp
   slider4.webp
   slider5.webp
   logo.svg
   porcelain-paver.webp
   porcelain-paver-after.webp
   porcelain-paver2.webp
   ipe1.webp
   ipe2.webp
   greenroof-mainpage.webp
   greenroof-slider.png
   ... (diğer tüm statik resimler)
   ```

2. **Yüklenen Resimler:**
   ```
   api/uploads/images/ klasörünün tüm içeriği
   ```

3. **Yüklenen PDF'ler:**
   ```
   uploads/pdfs/ klasörünün tüm içeriği
   ```

### Adım 3: .htaccess Dosyası (Apache için)

Eğer Apache kullanıyorsanız, `api/uploads/` klasörüne erişim için `.htaccess` dosyası gerekebilir:

**`api/uploads/.htaccess`:**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /api/uploads/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [L,QSA]
</IfModule>
```

**`uploads/.htaccess`:**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /uploads/
</IfModule>
```

## 🔍 Kontrol Listesi

- [ ] `api/uploads/images/` klasörü oluşturuldu ve izinleri ayarlandı (777)
- [ ] `uploads/pdfs/` klasörü oluşturuldu ve izinleri ayarlandı (777)
- [ ] Tüm statik resimler kök dizine kopyalandı
- [ ] Yüklenen resimler `api/uploads/images/` klasörüne kopyalandı
- [ ] Yüklenen PDF'ler `uploads/pdfs/` klasörüne kopyalandı
- [ ] `.htaccess` dosyaları oluşturuldu (gerekirse)
- [ ] Resimler tarayıcıda görüntüleniyor
- [ ] Admin panelden yeni resim yüklenebiliyor

## ⚠️ Önemli Notlar

1. **İzinler:** Upload klasörlerinin yazma izni olması gerekir (777)
2. **Path Kontrolü:** Veritabanındaki resim yollarını kontrol edin:
   - `/api/uploads/images/` ile başlayanlar → `api/uploads/images/` klasöründe
   - `/uploads/pdfs/` ile başlayanlar → `uploads/pdfs/` klasöründe
   - `/slider.webp` gibi kök dizin yolları → proje kök dizininde

3. **URL Formatı:**
   - Yüklenen resimler: `https://tileandturf.com/api/uploads/images/filename.jpg`
   - Yüklenen PDF'ler: `https://tileandturf.com/uploads/pdfs/filename.pdf`
   - Statik resimler: `https://tileandturf.com/slider.webp`

## 🐛 Sorun Giderme

### Resimler Görünmüyor
1. Klasör izinlerini kontrol edin (777)
2. Dosya yollarını kontrol edin
3. `.htaccess` dosyasını kontrol edin
4. Tarayıcı konsolunda 404 hatalarını kontrol edin

### Yeni Resim Yüklenemiyor
1. `api/uploads/images/` klasörünün izinlerini kontrol edin (777)
2. PHP `upload_max_filesize` ve `post_max_size` ayarlarını kontrol edin
3. `api/upload-image.php` dosyasının çalıştığını test edin
