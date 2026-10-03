# UniqSuite — Basitleştirme Önerileri

*Hazırlayan: Claude, 03.10.2026. Bu belge sadece bir öneri; birlikte değerlendirilecek. Kodda henüz hiçbir şey değişmedi. UniqSuite şu an CWS'in birebir kopyası.*

## Hedef

"iPhone gibi": ilk açılışta ne yapılacağı belli olmalı. Her ekranda tek bir ana iş olmalı. Derinlik silinmez, sadece istenince açılır.

Üç ilke:

1. **Önce sonuç, sonra ayrıntı.** Kullanıcı 10 dakika içinde ilk somut sonucunu görmeli: bir uyum skoru ve ilk 5 iş.
2. **Varsayılan her zaman hazır.** Ayar yapmadan doğru çalışmalı. Ayarlar "Uzman" alanında durur.
3. **Bir ekran, bir karar.** Bir sayfada birden fazla tablo, grafik ve sekme olmaz.

Değişmeyen kural: hesaplamalar CWS'teki gibi deterministik kalır. Basitleştirme arayüzde ve akışta yapılır, motorlara dokunulmaz.

## Bugünkü durum (ölçülen)

| Ne | Değer |
|---|---|
| Uygulama sayfası (rota) | 24 (7 aşama + 12 araç + ayarlar/admin) |
| Framework | 17 framework, yaklaşık 4.400 kontrol |
| Sayfa kodu | yaklaşık 20.000 satır; yalnız `Roadmap.tsx` 3.907 satır |
| En büyük JS parçaları | Risk sayfası 3,6 MB, politika PDF dışa aktarımı 3,0 MB, ExcelJS 0,9 MB |
| Toplam derleme | 15 MB, 155 JS dosyası |
| Kenar çubuğu | 7 aşama + 12 araç = 19 menü kalemi |

## Öneriler

**Etki** kullanıcının hissedeceği farkı, **Emek** kabaca geliştirme yükünü gösterir.

### A. Gezinme — 19 menü yerine 4 sekme

- Alt sekme çubuğu (mobilde) veya sade bir üst menü olsun. Dört sekme:
  - **Bugün**: yapılacak ilk 5 iş, yaklaşan süreler, skor.
  - **Kontroller**: değerlendirme ve uygulama tek listede.
  - **Belgeler**: politikalar, SoA, raporlar.
  - **Ayarlar**
- 12 araç (BCM, TPRM, KI-Governance …) tek tek menüde durmaz. "Modüller" altında açılıp kapanır. Kapalı modül hiç görünmez.
- PDCA aşama numaraları (01–07) kullanıcıya gösterilmez. Akış arka planda kalır.
- Etki: çok yüksek · Emek: orta

### B. İlk kurulum — 3 soruluk sihirbaz

- Soru 1: Sektör / kuruluş tipi.
- Soru 2: Hangi yükümlülükler? Cevap hazır paket olarak seçilir: "NIS2", "NIS2 + ISO 27001", "AI Act".
- Soru 3: Çalışan sayısı.
- Sonuç: Scope, framework seçimi ve kapsam kapıları otomatik dolar. Kullanıcı doğrudan "Bugün" ekranına düşer.
- Bugünkü Scope sayfasındaki ayrıntılı form "Uzman" moduna taşınır.
- Etki: çok yüksek · Emek: orta

### C. Framework seçimi — 17 yerine 3 paket

- Ana ekranda yalnız 3–4 hazır paket görünür. 17 framework'ün tamamı "Uzman"da kalır.
- Varsayılan görünümde kontroller framework'e göre değil, **konuya göre** listelenir (Erişim, Yedekleme, Olay …). Aynı kontrol tek satır olur ("same-as" ağı zaten var). Bu, iki framework seçildiğinde görülen tekrar hissini ortadan kaldırır.
- Etki: yüksek · Emek: düşük-orta (gruplama verisi mevcut)

### D. Değerlendirme — kart kart, tek soru

- Satır tabloları yerine tek soru kartı olsun, cevap üç düğmeyle verilir: **Var / Kısmen / Yok**. "Uygulanamaz" küçük bir bağlantı olur.
- Olgunluk seviyesi (0–5), kanıt ve not alanları cevaptan sonra isteğe bağlı açılır.
- Toplu işlem (bulk) ve varlık bazlı değerlendirme Uzman'a taşınır.
- Kaydetme her yerde otomatik olur; ayrı kaydetme çubukları kaldırılır.
- Etki: çok yüksek · Emek: orta

### E. Risk — hesap motoru kalsın, ekranı sadeleşsin

- Varsayılan ekranda: ilk 10 risk, renkli tek bir ısı haritası ve her riske tek cümlelik bir öneri.
- FAIR/nicel risk, matris ayarı, LI düzeltme ve formül ayarları Uzman'a taşınır.
- Risk sayfası 3,6 MB'lık tek parça. Büyük katalog verisi ancak gerektiğinde yüklenmeli (aşağıda J).
- Etki: yüksek · Emek: orta

### F. SoA + Yol haritası + Uygulama → tek "Plan" akışı

- Bugün üç ayrı sayfa var (SoA & Roadmap 3.907 satır, Implementation 2.006 satır). Kullanıcı açısından tek bir soru var: "Hangi iş, kimde, ne zaman?"
- Tek liste önerisi: her satır bir iş. Sahibi, tarihi ve durumu (Yapılacak / Sürüyor / Bitti) var. Gantt ve aşama görünümleri bir düğmeyle açılır.
- SoA bir **belge** olarak ele alınır ("Belgeler"de tek tıkla PDF/Word/Excel). Uygulanabilirlik kararı ancak bir kontrol "uygulanamaz" işaretlenince sorulur.
- Etki: çok yüksek · Emek: yüksek (en büyük iş)

### G. Araçlar (12 modül)

- Her modül açık/kapalı olsun. Varsayılan olarak kapalı.
- Paket seçimine göre öneri gelsin: NIS2 seçilirse "Olay yönetimi" ve "Tedarikçi" modülleri açık önerilir.
- Benzer araçlar birleşir:
  - "Lieferanten-Check" ve "Drittparteien/TPRM" → **Tedarikçiler**
  - "Dokumenten-Lebenszyklus" ve "Richtlinien" → **Belgeler**
- Etki: yüksek · Emek: orta

### H. Raporlar — tek "Rapor al" düğmesi

- Bugün her sayfada ayrı bir PDF/Word/Excel menüsü var.
- Öneri: tek yerde 4 hazır rapor:
  - Yönetim özeti (1 sayfa)
  - Gap raporu
  - SoA
  - Denetim paketi (zip)
- Biçim seçimi raporun içinde yapılır.
- Etki: orta · Emek: düşük

### I. Ayarlar — görünüş seçeneklerini kaldır

- Vurgu rengi seçici, grafik paleti ve tema seçici kaldırılır. "Überblick/Detail" anahtarı, tek bir "Uzman modu" anahtarına dönüşür. Marka renkleri sabit olur; koyu mod sistemi takip eder.
- Etki: orta · Emek: düşük

### J. Hız

- Büyük katalog dosyaları (`zokCatalog` 4 MB, `catalogV2` 1,7 MB, `controlCatalog` 1,5 MB kaynak kod) sayfa parçalarına gömülü; Risk sayfasının 3,6 MB olması bundan. Bu veriler sunucudan, ihtiyaç kadar gelmeli.
- PDF/Excel kütüphaneleri (jsPDF, ExcelJS, docx) yalnız "Rapor al"a basınca yüklenmeli. Kısmen zaten böyle; hepsi için geçerli hâle getirilmeli.
- Hedef: ilk açılış 1 MB'ın altında, ekran geçişi 300 ms'nin altında. Lighthouse ile ölçülür.
- Etki: yüksek · Emek: orta

### K. Mobil

- "Bugün" ve "Kontroller" telefonda tam çalışmalı: kart düzeni, büyük dokunma alanları, alt sekme çubuğu.
- Uzman ekranları (Gantt, matrisler) masaüstünde kalabilir.
- Etki: orta-yüksek · Emek: orta

### L. Dil ve metin

- Ekran metinleri kısa olsun: başlık ve en fazla bir cümle. Uzun açıklamalar "?" simgesinin arkasına taşınır.
- Kısaltmalar (SoA, BIA, RTO, TPRM) varsayılan görünümde açık yazılır.
- Etki: orta · Emek: düşük-orta

## Önerilen sıra

1. **Dalga 1 (hızlı kazanımlar, yaklaşık 1–2 hafta):** I, H, C, L ve J'nin ilk kısmı (rapor kütüphanelerinin geç yüklenmesi).
2. **Dalga 2 (yeni iskelet, yaklaşık 3–4 hafta):** A, B, D ve G (Uzman modu anahtarı ile birlikte).
3. **Dalga 3 (en büyük iş):** F, E, K ve J'nin kalan kısmı.

Her dalgadan sonra iki ölçü alınır: ilk sonuca kadar geçen süre ve ilk açılış boyutu.

## Senin karar vermen gereken sorular

1. **Hedef kitle:** KOBİ / belediye / yeni başlayan mı, yoksa CWS ile aynı kitle mi? Paketlerin içeriği buna göre değişir.
2. **Framework kapsamı:** UniqSuite yalnız 3–4 paketle mi çıksın, 17 framework Uzman'da kalsın mı?
3. **Uzman modu:** UniqSuite'te olsun mu (tek uygulama, iki seviye), yoksa derin iş için kullanıcı CWS'e mi yönlendirilsin (iki ürün, net ayrım)?
4. **Fiyat:** Basit ürünün fiyatı ve paketleri ayrı mı olacak? `tierConfig` buna göre ayarlanır.
5. **Ortak kod:** İleride CWS'teki düzeltmeler UniqSuite'e taşınacak mı? Taşınacaksa ortak bir motor paketi düşünülmeli. Bugün iki ayrı depo var.
