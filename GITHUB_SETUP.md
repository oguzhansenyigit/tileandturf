# Projeyi GitHub'a Yükleme

Bu projeyi GitHub'a yüklemek için aşağıdaki adımları **kendi bilgisayarınızda** (PowerShell veya CMD) proje klasöründe uygulayın.

> **Dikkat:** Terminale komut yazarken veya yapıştırırken **\`\`\`powershell** ve **\`\`\`** satırlarını KOPYALAMAYIN. Bunlar sadece dokümandaki kod kutusunun işaretidir. Sadece komut satırlarının kendisini (örn. `git init`) yazın veya yapıştırın.

## 1. Git kurulu mu kontrol edin

PowerShell veya CMD açıp şunu yazın:

```
git --version
```

**"git is not recognized"** hatası alırsanız Git yüklü değildir. Şunları yapın:

1. **İndirin:** https://git-scm.com/download/win  
2. **Kurun:** İndirdiğiniz `.exe` dosyasını çalıştırın. Varsayılan ayarlarla "Next" deyip kurun (özellikle "Git from the command line and also from 3rd-party software" seçili kalsın).  
3. **Terminali kapatıp yeniden açın** (PowerShell veya CMD).  
4. Tekrar `git --version` yazın; sürüm numarası görünmeli.

Bundan sonra bu rehberdeki diğer adımlara geçebilirsiniz.

**Git nereye kuruldu?** Varsayılan: `C:\Program Files\Git\`. Başlat menüsünde **"Git Bash"** kısayolu da oluşur; CMD/PowerShell'de `git` tanınmıyorsa Git Bash açıp komutları orada çalıştırabilirsiniz (proje klasörü: `cd "/c/Users/USER/OneDrive/Masaüstü/react brazilian wood"` — USER kısmını kendi kullanıcı adınızla değiştirin).

---

## 2. Proje klasörüne gidin

Boşluklu klasör adı olduğu için **mutlaka tırnak içinde** yazın:

```powershell
cd "C:\Users\USER\OneDrive\Masaüstü\react brazilian wood"
```

Sadece Masaüstü'ndeyken:
```powershell
cd "react brazilian wood"
```

---

## 3. Git deposu oluşturup ilk commit

Bu komutları **sırayla** yazın veya **sadece aşağıdaki satırları** kopyalayıp yapıştırın (\`\`\` işaretlerini değil). Her komuttan sonra Enter.

**1)** Terminale yazın veya yapıştırın:
```
git init
```
Enter.

**2)** Sonra:
```
git add .
```
Enter.

**3)** Son olarak (tırnaklar dahil tek satır):
```
git commit -m "Initial commit: Tile & Turf e-commerce"
```
Enter.

**Not:** `api/config.php` dosyası `.gitignore`'da olduğu için repoya **eklenmez** (veritabanı şifresi güvende kalır). Sunucuda veya yeni kurulumda `api/config.example.php` dosyasını kopyalayıp `config.php` yapıp bilgileri doldurun.

---

## 4. GitHub'da yeni repo oluşturun

1. [github.com](https://github.com) → giriş yapın  
2. Sağ üst **+** → **New repository**  
3. Repository name: örn. `tile-and-turf` veya `react-brazilian-wood`  
4. **Public** seçin, README eklemeyin (zaten projede var)  
5. **Create repository** tıklayın  

---

## 5. Uzak repoyu bağlayıp yükleyin

GitHub’da repo oluşturduktan sonra sayfada gösterilen komutlardan şunu kullanın (kullanıcı adı ve repo adını kendinize göre değiştirin):

```powershell
git remote add origin https://github.com/KULLANICI_ADINIZ/REPO_ADI.git
git branch -M main
git push -u origin main
```

Örnek:

```powershell
git remote add origin https://github.com/oguzhansenyigit/tile-and-turf.git
git branch -M main
git push -u origin main
```

İlk `git push`’ta GitHub kullanıcı adı ve şifre/token istenebilir. Şifre yerine **Personal Access Token** kullanmanız gerekir: GitHub → Settings → Developer settings → Personal access tokens.

---

## Özet

| Adım | Komut / İşlem |
|------|----------------|
| 1 | `git init` |
| 2 | `git add .` |
| 3 | `git commit -m "Initial commit: Tile & Turf e-commerce"` |
| 4 | GitHub’da yeni repo oluştur |
| 5 | `git remote add origin https://github.com/KULLANICI/REPO.git` |
| 6 | `git branch -M main` |
| 7 | `git push -u origin main` |

Bu adımları uyguladıktan sonra proje GitHub’da yayında olur.
