# cy — IONOS'ta dağıtım + GitHub Desktop ile push

İki adım: (A) kodu GitHub'a gönder, (B) IONOS sunucusunda Docker ile çalıştır.

---

## A) GitHub Desktop ile push

1. **GitHub Desktop** → `File > Add Local Repository` → `cy` klasörünü seçin.
   - "This directory does not appear to be a Git repository" derse → **Create a repository** deyin.
2. Repo adı: `cy`. **Create Repository**.
3. `.gitignore` zaten `node_modules` ve `.env`'i hariç tutuyor — sırlarınız push edilmez.
4. Sağ altta **Commit to main** (özet: "cy: Supabase'siz ilk sürüm").
5. Üstte **Publish repository**.
   - Özel kalsın istiyorsanız **Keep this code private** işaretli kalsın. **Publish**.

> Sonraki değişikliklerde: düzenle → GitHub Desktop commit → **Push origin**.

---

## B) IONOS sunucu kurulumu

### 1. Sunucu
IONOS'ta bir **VPS / Cloud Server** (Ubuntu 22.04+, en az 2 vCPU / 4 GB RAM önerilir).
Panelden root SSH erişimi alın.

### 2. Alan adı
IONOS DNS'te `cy.example.com` için bir **A kaydı** oluşturup sunucunun IP'sine yönlendirin.

### 3. Docker kurulumu (sunucuda, root)
```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
```

### 4. Kodu çekin
```bash
# Özel repoysa önce bir GitHub Personal Access Token'la:
git clone https://github.com/DrSaitYalazay/cy.git
cd cy
```

### 5. Ortamı ayarlayın
```bash
cp .env.example .env
nano .env
```
Doldurun:
- `POSTGRES_PASSWORD`, `AUTHENTICATOR_PASSWORD`, `JWT_SECRET` → her biri için `openssl rand -hex 32`
- `CY_DOMAIN=cy.example.com` (Caddy otomatik Let's Encrypt sertifikası alır)
- `PUBLIC_APP_URL=https://cy.example.com`
- SMTP\_\* → e-posta göndermek için (yoksa e-postalar sadece loglanır)

### 6. Şemayı üretin ve başlatın
```bash
bash db/build-schema.sh          # db/schema.sql üretir
docker compose up -d --build
```
İlk boot'ta Postgres `schema.sql`'i yükler (bootstrap + shim + 98 migration).

### 7. Kontrol
```bash
docker compose ps
curl -s https://cy.example.com/health      # {"ok":true,...}
```
Tarayıcıdan `https://cy.example.com` → kaydolun.

### 8. Portlar / güvenlik duvarı
IONOS güvenlik duvarında yalnızca **80** ve **443**'ü açın. Postgres (5432)
dışarı açık OLMAMALI (compose'da yalnızca iç ağda).

---

## Güncelleme akışı
```bash
cd cy
git pull
bash db/build-schema.sh          # migration değiştiyse
docker compose up -d --build
```

## Yedekleme ve geri yükleme (V-4)

- **Otomatik:** `backup` servisi her gün `backups/` altına yedek alır: veritabanı
  (`cy_daily_*.dump`), rol listesi (`*.roles.sql`, şifresiz) ve yüklenen dosyalar
  (`storage_daily_*.tgz`). 14 gün saklanır (`BACKUP_KEEP_DAYS`).
- **Her deploy'dan önce:** `cy_predeploy_*` yedeği alınır; alınamazsa deploy
  durur ve hiçbir migration çalışmaz. Son 10 tanesi saklanır.
- **Azami süre:** hiçbir yedek 30 günden eski tutulmaz (`BACKUP_MAX_DAYS`,
  DSGVO Art. 5 Abs. 1 lit. e). Silinen kişisel veriler yedeklerde en geç 30 gün
  sonra kaybolur; gizlilik metni bu süreyle uyumlu olmalı.
- **Kanıt:** GitHub → Actions → "Nachweis Betrieb" → Run workflow. Taze bir yedeği
  ağsız, geçici bir Postgres'e geri yükler ve her tablonun satır sayısını canlı
  veriyle karşılaştırır.
- **Uyarı:** yedekler aynı sunucuda duruyor. Sunucu kaybına karşı dışarıda,
  şifreli ikinci bir kopya gerekir (IONOS Backup veya harici depolama).

### Acil durumda geri yükleme (aynı sunucu)
```bash
cd /root/UniqSuite
ls -lt backups/ | head                               # doğru yedeği seç
docker compose stop api worker backup                # DB bağlantılarını kes
docker compose exec -T db dropdb -U postgres --force cy
docker compose cp backups/cy_daily_<ZAMAN>.dump db:/tmp/geri.dump
docker compose exec -T db pg_restore -U postgres -d postgres --create --exit-on-error /tmp/geri.dump
# yüklenen dosyalar:
docker compose run --rm --no-deps -T --entrypoint sh api -c 'tar -xzf - -C /data' < backups/storage_daily_<ZAMAN>.tgz
docker compose start api worker backup
```
Yeni bir sunucuda: önce `docker compose up -d db` (şema ve roller `.env` ile
kurulur), sonra yukarıdaki adımlar. Roller zaten var olduğu için `*.roles.sql`
yalnızca şemasız kurulmuş bir sunucuda gerekir.

## Sık sorunlar
- **HTTPS gelmiyor**: DNS A kaydı sunucuya işaret ediyor mu? 80/443 açık mı? `docker compose logs caddy`.
- **DB'ye bağlanamıyor**: `.env`'deki `AUTHENTICATOR_PASSWORD` iki yerde de (db init + api DATABASE_URL) aynı türetilir; değiştirdiyseniz `docker compose down -v` ile volume'u sıfırlayıp yeniden başlatın (DİKKAT: veri siler).
- **Şema değişikliği görünmüyor**: `schema.sql` sadece ilk boot'ta yüklenir. Mevcut DB'ye migration'ı elle uygulayın veya (veri kaybını göze alarak) `docker compose down -v && docker compose up -d`.
- **E-posta gitmiyor**: SMTP boşsa worker sadece loglar (`docker compose logs worker`).
