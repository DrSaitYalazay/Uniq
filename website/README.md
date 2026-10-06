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

### Otomatik yayın (GitHub Actions)

Site, Uniq deposunun `website/` klasöründedir. `main` dalında `website/**` altında bir değişiklik olunca `.github/workflows/website.yml` çalışır:

1. `npm ci`, `npm audit` (yüksek/kritik açık varsa durur), `npm run build:check` (build + CSP denetimi).
2. `website/deploy/` dosyaları ve `uniqsuite-site.tgz` paketi SSH ile `/root/UniqSuiteWeb/` klasörüne kopyalanır (uygulamanın deploy'uyla aynı anahtar ve aynı `ssh-vorbereiten.sh`).
3. Sunucuda `deploy_remote.sh` çalışır:
   - Website konteynerinin Caddy yapılandırmasını doğrular.
   - Yeni sürümü etkinleştirir (`release.sh`).
   - Konteyneri başlatır.
   - ClaudeCWS Caddyfile'ında `uniqsuite.cyberwerk.online` bloğu yoksa ekler, doğrular ve Caddy'yi yeniden yükler. Hata olursa Caddyfile eski haline döner.
   - Sonunda `https://uniqsuite.cyberwerk.online/de/` adresini ve güvenlik başlıklarını kontrol eder.

Uygulamanın deploy'u (`deploy.yml`) yalnızca website değişikliklerinde çalışmaz (`paths-ignore`); app ve site birbirinden bağımsız yayınlanır.

**Kalıcı edge bloğu:** `deploy/edge-block.caddy` içeriği ClaudeCWS deposundaki `Caddyfile`'a da eklenmelidir. Aksi halde bir sonraki ClaudeCWS deploy'u dosyayı depo sürümüyle değiştirir ve site, bir sonraki website deploy'una kadar erişilemez olur. Blok ayrı tutulmalı, nis2plat işaretli bölüme dokunulmaz.

### Elle yayın (gerekirse)

```sh
npm ci && npm audit --omit=dev && npm run build:check
tar -czf uniqsuite-site.tgz -C dist .
scp uniqsuite-site.tgz deploy/* <sunucu>:/root/UniqSuiteWeb/
ssh <sunucu> 'bash /root/UniqSuiteWeb/deploy_remote.sh'
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
