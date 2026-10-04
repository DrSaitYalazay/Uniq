# Güvenlik – UniqSuite Web Sitesi (uniqsuite.cyberwerk.online)

Bu dosya, sitenin güvenlik önlemlerini takip etmek için kullanılır.

- `[x]` yapıldı
- `[ ]` açık
- `[~]` yerelde yapıldı, canlıda doğrulanacak

Son güncelleme: 4 Ekim 2026

## 1 · Mimari

- [x] Tamamen statik site: sunucuda kod, veritabanı ya da form yok.
- [x] Sunucu yapısı kontrol edildi (ClaudeCWS ve Uniq depoları, 3–4 Ekim 2026): Caddy, ClaudeCWS'in Docker Compose'unda `caddy:2-alpine` konteyneri olarak çalışıyor. 80/443 portlarını tutuyor ve UniqSuite uygulamasına `uniqsuite_edge` ağı üzerinden erişiyor.
- [x] Site kendi konteynerinde çalışır (`deploy/docker-compose.yml`) ve aynı `uniqsuite_edge` ağına bağlanır. Uygulamanın ayarlarına dokunulmaz.
- [x] Konteyner sıkılaştırması:
  - Root olmayan kullanıcı (65534).
  - Salt okunur dosya sistemi; site dosyaları da salt okunur bağlanır.
  - Tüm Linux yetkileri kaldırıldı (`cap_drop: ALL`), `no-new-privileges` açık.
  - Bellek ve süreç sınırı var, healthcheck var.
- [~] Edge bloğu (`deploy/edge-block.caddy`) ilk website deploy'unda sunucudaki ClaudeCWS Caddyfile'ına kendi işaretleri arasında eklenir. Önce doğrulanır, hata olursa dosya eski haline döner. nis2plat bölümüne dokunulmaz.
- [ ] Edge bloğu kalıcı olarak ClaudeCWS deposuna da eklenecek.
- [x] Deploy GitHub Actions ile yapılıyor (`.github/workflows/website.yml`):
  - Yalnızca `contents: read` izni var; Action'lar commit'e sabitlenmiş.
  - SSH için uygulamayla aynı `ssh-vorbereiten.sh` kullanılıyor; dışarıdan Action yüklenmiyor.
  - `npm audit` yüksek/kritik açıkta deploy'u durduruyor.
  - CSP denetimi başarısız olursa sunucuya hiç dokunulmuyor.
- [x] E-posta formu yok. cyberwerk.online alan adından posta gönderilmez (null MX, SPF -all, DMARC reject). Demo butonu yalnızca `mailto:info@cyberwerksuite.com` linkidir.
- [x] Quick-Check tamamen tarayıcıda çalışır. Cevaplar hiçbir sunucuya gönderilmez ve kaydedilmez.
- [x] PDF raporu tarayıcıda oluşturulur (pdf-lib); veri yüklenmez.
- [x] Sitede hiçbir üçüncü taraf isteği yok: font, CDN, analiz, harita ve video yok. `connect-src 'self'` ve `default-src 'none'` ile yerel testte doğrulandı; konsolda engellenen istek yok.

## 2 · Güvenlik başlıkları (Caddy)

- [~] HTTPS: Let's Encrypt sertifikası ve HTTP→HTTPS yönlendirmesi (Caddy otomatik yapar).
- [~] HSTS: `max-age=31536000; includeSubDomains` (preload yok; preload ana alan adını da bağlar).
- [~] Content-Security-Policy:
  - Temel: `default-src 'none'`.
  - Sadece kendi dosyaları: script, style, font, connect.
  - `frame-ancestors 'none'`, `base-uri 'none'`, `form-action 'none'`, `object-src 'none'`.
  - Yok: `unsafe-inline`, `unsafe-eval`.
- [~] Trusted Types: `require-trusted-types-for 'script'` ve `trusted-types 'none'`. Kodda `innerHTML` kullanılmaz.
- [~] `X-Content-Type-Options: nosniff`
- [~] `X-Frame-Options: DENY` (eski tarayıcılar için)
- [~] `Referrer-Policy: strict-origin-when-cross-origin`
- [~] `Permissions-Policy`: kamera, mikrofon, konum, ödeme, USB ve diğerleri kapalı.
- [~] `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`
- [~] `Server` ve `X-Powered-By` başlıkları kaldırıldı.
- [x] Yalnızca GET/HEAD istekleri kabul edilir; diğerleri 405 döner.
- [x] Gizli dosyalar (`.git`, `.env` vb.) 404 döner; `.well-known` hariç.
- [x] Caddy yapılandırmaları (`deploy/Caddyfile`, `deploy/edge-block.caddy`) `caddy validate` kontrolünden geçti (v2.10.2). Compose dosyası `docker compose config` kontrolünden geçti.

## 3 · Kod ve build

- [x] Build'de satır içi CSS/JS yok: `inlineStylesheets: 'never'`, `assetsInlineLimit: 0`.
- [x] Build çıktısında satır içi `<script>`, `style=""`, `<style>` ve `on*=` olmadığı otomatik denetleniyor (`npm run check`, şu an 8/8 sayfa uyumlu).
- [x] Tarayıcı konsolunda CSP ve Trusted Types ihlali yok. Gerçek başlıklarla yerel Caddy'de (`deploy/Caddyfile.local`) 3D gezinti, Quick-Check ve PDF dahil test edildi. Kodda `innerHTML` yok; DOM yalnızca `createElement` ve `textContent` ile kuruluyor.
- [x] Fontlar (Inter) kendi sunucumuzdan yüklenir; Google Fonts kullanılmaz.
- [x] Dış linklerde (Impressum) `rel="noopener noreferrer"` kullanılıyor.
- [x] `npm audit` kurulumda 0 açık gösterdi (4 Ekim 2026).
- [x] Her deploy öncesinde `npm audit` çalıştırılması README'ye adım olarak eklendi.
- [x] Bağımlılıklar `package-lock.json` ile sabitlendi; README deploy adımları `npm ci` kullanıyor.
- [x] Kaynak haritaları (`.map`) üretilmiyor.

## 4 · Gizlilik (DSGVO)

- [x] Çerez yok. Onay gerektiren hiçbir şey yok, bu yüzden çerez banner'ı da gerekmez.
- [x] Varsayılan olarak takip veya analiz yok.
- [x] `localStorage` ve çerez kullanılmıyor. Quick-Check verisi yalnızca bellekte tutuluyor; sayfa kapanınca siliniyor.
- [~] Erişim kayıtları edge Caddy'de tutulur:
  - IP maskeli (IPv4 /24, IPv6 /48).
  - Referer ve Cookie başlıkları silinir.
  - En fazla 7 gün saklanır.
- [x] Datenschutzerklärung şablonu hazır (DE/EN): sunucu kayıtları, çerez yok, Quick-Check'in yerel çalışması, e-posta. Açık noktalar TODO olarak işaretli (bkz. TODO.md).

## 4a · Demo-Anfrage formu (4 Ekim 2026)

- [x] Site statik kalıyor; tek istisna `POST /api/anfrage`. Website Caddy'si yalnızca bu yolu, yalnızca POST ile ve en fazla 8 KB gövdeyle uygulamanın web konteynerine iletiyor. Cookie ve Authorization başlıkları silinerek gönderiliyor.
- [x] CSP değişmedi: `connect-src 'self'` (aynı kaynak), `form-action 'none'` (gönderim fetch ile).
- [x] Gerçek istemci IP'si: Website Caddy'si yalnızca Docker iç ağındaki edge Caddy'ye güveniyor (`trusted_proxies private_ranges`). Dışarıdan gönderilen sahte X-Forwarded-For dikkate alınmıyor.
- [x] Sunucu tarafı denetim (`api/src/functions/website-anfrage.js`): alan uzunlukları, e-posta biçimi, freemail listesi, telefon biçimi. Kontrol karakterleri (CR/LF dahil) siliniyor, böylece mail başlığına enjeksiyon yapılamıyor. Mail şablonunda HTML kaçışı yapılıyor.
- [x] Kötüye kullanım sınırları veritabanında tutuluyor (`auth.login_attempts`, kind=`anfrage`): IP başına saatte 5, adres başına günde 3, toplam günde 200 talep. Bu kayıtlar 30 gün sonra otomatik siliniyor.
- [x] Bot filtresi: bal küpü alanı ve en kısa doldurma süresi. Yakalanan istek „başarılı“ yanıtı alıyor ama gönderilmiyor.
- [x] Talep edene otomatik mail gitmiyor. Böylece form, üçüncü kişilere mail göndermek için kullanılamıyor.
- [ ] Canlıda bir test talebi gönderilip mailin info@ adresine ulaştığı doğrulanacak. Uygulamada SMTP ayarlı olmalı.

## 5 · Sunucu ve DNS

- [x] `/.well-known/security.txt` (iletişim: info@cyberwerksuite.com, geçerlilik: 1 Ekim 2027).
- [ ] İleride ayrı bir `security@cyberwerksuite.com` adresi açılacak ve security.txt'e yazılacak. Şimdilik info@ kullanılıyor (karar: 4 Ekim 2026).
- [x] Sürüm dizinleri ve `current` sembolik linki kullanılır (`deploy/release.sh`). Son 5 sürüm saklanır. Geri almak için tek komut yeter: `sh release.sh --rollback`.
- [ ] Konteyner sunucuda ilk kez başlatılacak; healthcheck ve başlıklar canlıda kontrol edilecek.
- [ ] Cloudflare'de CAA kaydı: yalnızca `letsencrypt.org` sertifika verebilecek.
- [ ] Cloudflare'de DNSSEC (isteğe bağlı, ana alan adı için).

## 6 · Canlıda doğrulama (deploy sonrası)

- [ ] securityheaders.com → hedef notu A veya A+
- [ ] Mozilla HTTP Observatory → hedef A+
- [ ] SSL Labs → hedef A+
- [ ] Tarayıcı konsolu: CSP ve Trusted Types hatası yok (Chrome, Firefox, Safari)
- [ ] `curl -I` ile tüm başlıkların HTML, JS, PDF ve 404 yanıtlarında geldiği kontrol edilecek
- [ ] HTTP isteğinin HTTPS'e 308 ile yönlendirildiği kontrol edilecek

## Notlar

- Impressum ayrı tutulmaz; https://cyberwerksuite.com/impressum adresine bağlanır (karar: 4 Ekim 2026).
