# Açık işler – UniqSuite web sitesi

Son güncelleme: 4 Ekim 2026

## Senin kararın / bilgin gerekenler

- [ ] **Quick-Check soruları:** 59 soru, tablo halinde `webgenel/UniqSuite-Website-Konzept.html` dosyasında. Tablonun gözden geçirilip onaylanması gerekiyor.
- [ ] **DEMO_URL:** randevu aracı henüz yok. Şimdilik buton `mailto:info@cyberwerksuite.com` adresine gidiyor (`src/config.ts`).
- [ ] **Datenschutzerklärung ve Barrierefreiheitserklärung:** şablonlar hazır, hukuki metin TODO olarak işaretli.
  - Eksik bilgiler: sorumlu kişi, hosting firması ve AVV, denetim makamı, e-postaların saklama süresi.
- [x] **White paper ve broşür:** § 38 BSIG ifadesi „umsetzen und überwachen“ olarak düzeltildi (DE/EN, 4 Ekim 2026); `public/docs/` ve marketing klasörü güncellendi.
- [ ] **„Zugang anfordern“:** erişim talebi için bir akış var mı? Şu an „Anmelden“ butonu yalnızca giriş sayfasına gidiyor.

## Teknik

- [ ] Uygulama (uniq.cyberwerk.online) `?lang=de|en` parametresini henüz okumuyor. Site parametreyi gönderiyor; uygulamada küçük bir ek gerekiyor.
- [ ] **Uniq deposu, `website` dalı:** PR birleştirilince site otomatik yayınlanır (`.github/workflows/website.yml`). İlk yayında edge bloğu sunucudaki ClaudeCWS Caddyfile'ına otomatik eklenir.
- [ ] Edge bloğu (`deploy/edge-block.caddy`) kalıcı olarak ClaudeCWS deposunun `Caddyfile`'ına da eklenecek. Aksi halde bir sonraki ClaudeCWS deploy'u bloğu siler.
- [ ] Cloudflare'de CAA kaydı açılacak (yalnızca letsencrypt.org).
- [ ] Canlıda kontrol edilecekler: securityheaders.com, Mozilla Observatory, SSL Labs.
- [ ] Gerçek cihazlarda test: iPhone Safari, Android Chrome, Firefox masaüstü. Headless testler yazılım tabanlı WebGL ile yapıldı.
- [ ] Lighthouse masaüstü ölçümü (yerel test çalışmadı; canlıda PageSpeed ile yapılacak).
- [ ] Mobil LCP yerelde 3,0 sn (hedef < 2,5 sn). Seçenekler:
  - gövde fontunu `font-display: optional` yapmak,
  - kritik CSS'i hash ile satır içine almak.
- [ ] Genel İngilizce metinler için ana dili İngilizce olan biri son okuma yapabilir (isteğe bağlı).

## Bilgi notları

- 3D sahnedeki 227 düğüm gerçek katalogdan geliyor (`src/data/nodes.json`).
  - 224'ü NIS2 ↔ ISO 27001 eşleşmesi, 2'si AI Act ↔ CRA, 1'i AI Act ↔ ISO 42001.
  - Bu yüzden imleç ipucunda çoğunlukla „1 Antwort → NIS2 · ISO 27001“ yazıyor. Prompt'taki „NIS2 · ISO 27001 · ISO 42001“ örneği gerçek veride yok.
- 3D sahne ilk kullanıcı etkileşiminde başlıyor (kaydırma, fare veya dokunma). Öncesinde aynı sahneden render edilmiş durağan kare gösteriliyor; bu sayfanın hızlı açılmasını sağlıyor.
- AI tarafından üretilmiş `ref-*` görselleri yalnızca sanat yönetimi referansı olarak kullanıldı. Sitedeki tüm görseller gerçek sahneden render edildi ya da uygulamanın gerçek ekran görüntüleri (demo tenant, „fiktiv“ etiketli).
