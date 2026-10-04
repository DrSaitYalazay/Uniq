# UniqSuite Web Sitesi

Adres: https://uniqsuite.cyberwerk.online. Site Almanca (`/de/`) ve İngilizcedir (`/en/`); kökten açılan `/` adresi `/de/`'ye yönlenir. Tamamen statiktir: sunucuda kod, veritabanı ya da form çalışmaz.

## Yapı

| Klasör / dosya | İçerik |
|---|---|
| `src/config.ts` | **SITE_URL, LOGIN_URL, DEMO_URL, CONTACT_EMAIL** – tek tanım yeri |
| `src/i18n/de.ts`, `src/i18n/en.ts` | Sitedeki tüm metinler (DE resmî „Sie“, EN İngiliz İngilizcesi) |
| `src/data/quickcheck.json` | Quick-Check soruları (DE/EN, dayanak, gerekçe, öneri, ağırlık) |
| `src/data/nodes.json` | 227 ortak kontrol noktası (katalogdan, 3D sahnenin verisi) |
| `src/components/Home.astro` | Ana sayfanın bölümleri |
| `src/scripts/main.ts` | Kaydırma (Lenis), bölüm çubuğu, URL hash, klavye, 3D'nin yüklenmesi |
| `src/scripts/world/` | three.js sahnesi: kamera yolu, parçacıklar, halka, süreler, kuleler |
| `src/scripts/qc/` | Quick-Check ve PDF raporu (tarayıcıda çalışır, hiçbir veri gönderilmez) |
| `src/styles/global.css` | Tasarım değişkenleri ve tüm stiller |
| `public/` | Fontlar (Inter, sitenin kendi sunucusundan), görseller, durağan kareler, white paper PDF'leri, OG görselleri |
| `deploy/` | Docker Compose, Caddy, sürüm betiği |
| `SECURITY.md` | Güvenlik önlemleri listesi (yapılan / kalan) |
| `TODO.md` | Açık işler |

## Yerelde çalıştırma

```sh
npm ci
npm run dev            # http://localhost:4321/de/
npm run build:check    # dist/ üretir ve CSP uyumluluğunu kontrol eder
```

Canlıdaki güvenlik başlıklarıyla test etmek için:

```sh
caddy run --config deploy/Caddyfile.local   # http://127.0.0.1:8090/de/
```

Test için kullanışlı URL parametreleri:

- `?no3d`: 3D sahne yerine durağan görseller gösterilir.
- `?reduced`: azaltılmış hareket modu.
- `?auto3d`: 3D sahne kullanıcı etkileşimi beklenmeden başlar.
- `?still=4.6&w=1600&h=900`: sahnenin tek bir karesi render edilir. Durağan görseller bununla üretilir.

## Metin ve soruları düzenleme

- **Metinler:** `src/i18n/de.ts` ve `src/i18n/en.ts`. İki dosyanın yapısı aynı olmalıdır; TypeScript bunu denetler.
- **Quick-Check:** `src/data/quickcheck.json`.
  - Kaynak dosya `quickcheck_src.py`'dir; JSON'u bu betik üretir ve ağırlıkları kontrol eder.
  - Her soru şu alanlardan oluşur: `id`, `weight`, `ref`, `q`, `why`, `rec`. Hepsi `de` ve `en` olarak yazılır.
  - Ağırlık kuralı: ilk ve son soru 1,5; diğerleri 1.
  - Puanlama: Evet 100, Kısmen 50, Hayır 0. Bantlar: 0–39 / 40–69 / 70–100.
- Değişiklikten sonra `npm run build:check` çalıştırılır.

## Sunucu (canlı ortam)

Sunucudaki düzen (ClaudeCWS ve Uniq depolarından kontrol edildi):

- 80/443 portlarını ClaudeCWS'in Docker Compose'undaki Caddy konteyneri tutar.
- UniqSuite uygulaması (`/root/UniqSuite`) bu Caddy'ye `uniqsuite_edge` ağı üzerinden bağlıdır.
- Web sitesi kendi küçük konteynerinde çalışır (`/root/UniqSuiteWeb`) ve aynı ağa bağlanır. Uygulamanın ayarlarına dokunulmaz.

### İlk kurulum (bir kez)

1. `deploy/` içindeki dosyaları sunucuya kopyalayın: `/root/UniqSuiteWeb/` altına `docker-compose.yml`, `Caddyfile`, `security-headers.caddy` ve `release.sh`.
2. `deploy/edge-block.caddy` içindeki bloğu ClaudeCWS deposundaki `Caddyfile`'a ekleyin.
   - Blok ayrı tutulmalı; nis2plat işaretli bölüme dokunulmaz.
   - Değişiklik ClaudeCWS'in normal deploy süreciyle yayınlanır.
   - Caddy Let's Encrypt sertifikasını kendisi alır.
3. İlk sürümü yükleyip konteyneri başlatın (aşağıdaki adımlar 1–3, sonra `docker compose up -d`).

### Her yeni sürüm

```sh
# 1) Yerelde
npm ci && npm audit --omit=dev && npm run build:check
tar -czf uniqsuite-site.tgz -C dist .

# 2) Yükleme
scp uniqsuite-site.tgz <sunucu>:/root/UniqSuiteWeb/

# 3) Sunucuda: yeni sürümü etkinleştir (anında, yeniden başlatma gerekmez)
cd /root/UniqSuiteWeb && sh release.sh uniqsuite-site.tgz
```

`release.sh` sürümü `site/releases/<zaman damgası>` klasörüne açar ve `site/current` linkini atomik olarak yeni sürüme çevirir. Son 5 sürüm saklanır.

### Geri alma

```sh
cd /root/UniqSuiteWeb && sh release.sh --rollback
```

## Kalite kontrolleri (bu sürümde yapıldı)

- **CSP ve Trusted Types:** canlı başlıklarla test edildi. Sayfa gezintisi, Quick-Check ve PDF oluşturma sırasında konsolda hiçbir ihlal yok. `npm run check` derlenmiş HTML'i denetler.
- **Lighthouse (mobil, yerel):** Performance 93, Accessibility 100, Best Practices 100, SEO 100.
- **Yedek görünümler:** azaltılmış hareket ve WebGL'siz modda durağan görseller ve aynı bölüm yapısı gösterilir.
- **Quick-Check:** iki çerçeve arka arkaya tamamlandı, PDF indirildi ve sayfa sayfa kontrol edildi.
