# UniqSuite — Kurulum (uniq.cyberwerk.online)

UniqSuite, CyberWerkSuite'in ayrı markalı kopyasıdır. Aynı sunucuda çalışır ama
**kendi veritabanı, kendi kullanıcıları ve kendi yedekleri** vardır. CWS ile
paylaştığı tek şey Caddy'dir (HTTPS ve yönlendirme).

```
İnternet ─► Caddy (ClaudeCWS) ─┬─► cyberwerk.online        → CWS web
                               ├─► manager.cyberwerk.online → nis2plat
                               └─► uniq.cyberwerk.online    → UniqSuite web (ağ: uniqsuite_edge)
                                                               └─► UniqSuite api ─► UniqSuite db
```

## Sıra (bir kez)

1. **DNS (Cloudflare):** `uniq` için A kaydı aç. IP, `cyberwerk.online` ile aynı.
   Proxy kapalı olsun (gri bulut), diğer kayıtlar nasılsa öyle.
2. **ClaudeCWS'i push et.** Bu push Caddyfile'a `uniq.cyberwerk.online` bloğunu,
   Caddy'ye `uniqsuite_edge` ağını ve demo-hesap kilidini getirir.
3. **GitHub'da yeni özel depo:** adı `UniqSuite`. Bu klasörü oraya push et.
4. **Secrets:** yeni depoda Settings → Secrets → Actions altına ClaudeCWS'tekiyle
   AYNI dört değeri gir: `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `SSH_KNOWN_HOSTS`.
5. **Deploy:** Actions → "Deploy UniqSuite to IONOS" → Run workflow
   (ya da secrets'tan sonra bir push). İlk deploy:
   - `/root/UniqSuite` klasörünü açar,
   - `.env`'i rastgele şifrelerle kendisi üretir (`ersteinrichtung.sh`),
   - veritabanını kurar, tüm katalogları yükler (yerelde sıfırdan denendi:
     AIACT 131, NIS2 268, ISO 27001 318 … CWS ile aynı),
   - `https://uniq.cyberwerk.online/health` adresini kontrol eder.
6. **İlk giriş:** `https://uniq.cyberwerk.online/auth` → **Registrieren** ile
   `admin@cyberwerk.online` hesabını aç. Bu adres otomatik olarak admin olur.
   İlk gerçek kullanıcıdan sonra kayıt kapanır (CWS'teki gibi); diğer kullanıcıları
   Admin panelinden eklersin.

## Bilinmesi gerekenler

- **Kaynak:** Sunucuda ikinci bir Postgres + API + worker + web çalışır. Küçük bir
  VPS'te bellek darlaşabilir; ilk hafta `free -m` ile bak.
- **Yedek:** UniqSuite kendi günlük yedeğini `/root/UniqSuite/backups` altına alır
  (14 gün). Sunucu dışı yedek CWS ile birlikte planlanacak (SIRADAKI-ISLER).
- **E-posta:** SMTP bilgileri ClaudeCWS'ten kopyalanır. Gönderen adresi (`EMAIL_FROM`)
  CWS ile aynıdır; değiştirmek için `/root/UniqSuite/.env`.
- **Güncellemeler:** Bu depo artık ayrı. CWS'e yapılan düzeltmeler buraya kendiliğinden
  gelmez; gerekirse elle taşınır.
- **Güvenlik bulgusu (03.10.2026):** `db/schema.sql` ilk kurulumda bilinen şifreli bir
  admin hesabı (`demo@uniqsuite.com`) açıyordu. Her deploy'da
  `db/seeds/demo_konto_sperren.sql` bu hesabın admin yetkisini alır, şifresini
  rastgele yapar ve hesabı dondurur. Hesap silinmez.
