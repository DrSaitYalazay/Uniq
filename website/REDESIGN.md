# UniqSuite web sitesi – derin inceleme ve „premium“ planı

Tarih: 4 Ekim 2026. Başlangıç notu: 5/10 (kullanıcı). Ölçüt: Awwwards „Site of the Day“ düzeyindeki B2B/SaaS siteleri (Linear, Vercel, Stripe Sessions, Lusion, Active Theory işleri).

İnceleme yöntemi: canlı sürümün yerel kopyası 1440×900 ve 390×844'te, 3D açıkken her bölümde ekran görüntüsü alındı ve bölüm bölüm değerlendirildi.

Durum işaretleri: `[x]` bu turda uygulandı · `[~]` kısmen · `[ ]` sonraki tur (gerekçesiyle).

---

## 1. Neden 5/10 – ana teşhis

1. **Görsel dil „siber klişe“.** Neon yeşil–mavi parçacıklar, her yerde bloom/parıltı, koyu lacivert zemin. Bu, sektördeki yüzlerce güvenlik ürününün diliyle aynı. Ödül alan siteler bunun yerine bir **imza** taşır: tipografi, kompozisyon ve sükûnet.
2. **Tipografi tek sesli.** Her başlık Inter Display ExtraBold 800, her vurgu düz yeşil renk. Kalın ve sıkışık; „bağırıyor“. Premium siteler büyük ama daha ince (500–600) başlık, editoryal bir serif vurgu ve teknik bir mono ile üç katmanlı bir tipografi kullanır.
3. **Metinler kutu içinde.** Her istasyonda yarı saydam, kenarlıklı „cam kart“. Bu bir şablon hissi verir ve 3D sahneyi bölüyor. Ödüllü sitelerde metin doğrudan sahnenin üzerinde durur; okunabilirliği yumuşak bir karartma (scrim) sağlar.
4. **Hero kalabalık.** Rozet + başlık + paragraf + 2 buton + 5 çip + sayı + kaydırma ipucu: 7 ayrı öğe. Göz nereye bakacağını bilmiyor.
5. **Hareket dili yok.** Başlıklar sadece belirip kayıyor. Satır/kelime maskeli açılış, sayıların akışı, akan bant (marquee) gibi „ritim“ öğeleri yok.
6. **Bölümler arası tutarsızlık.** Parçacık bulutu, ağ grafiği, halka, ince çizgili zaman ekseni ve kuleler: her sahne ayrı bir görsel deyim. „Fristen“ sahnesi boş ve bitmemiş görünüyor (ince çizgiler, sönük zemin).
7. **Küçük ve soluk metinler.** Zaman çizelgesi, etiketler ve dipnotlar 12–13 px, gri üstüne gri. Hem premium his hem erişilebilirlik (kontrast) zayıf.
8. **Ürün görselleri koyu sitede açık tema ekran görüntüsü.** Çerçevesiz, küçük ve kalabalık bento. „Ürün kahramanı“ anı yok.
9. **Güven bölümü jenerik.** 6 ikonlu ızgara her SaaS sitesinde var.
10. **Kapanış zayıf.** Son ekran düz bir başlık + 2 buton; altbilgi sıradan. Akılda kalan bir „son kare“ yok.
11. **„Demo vereinbaren“ e-posta açıyor.** Premium bir B2B sitesinde bu kopuk bir deneyim; form yerinde açılmalı.

## 2. Bölüm bölüm bulgular ve önlemler

### 2.1 Tipografi ve marka sistemi
- [x] Başlıklar: Inter Display **500/600** (optik boyut 32, değişken fonttan sabit kesit), daha sıkı satır aralığı, negatif harf aralığı.
- [x] Vurgu kelimeleri: **Instrument Serif İtalik** (OFL) + yumuşak nane yeşili. Örn. „Ein klarer *Stand.*“
- [x] Teknik katman: **JetBrains Mono** (OFL) – bölüm etiketleri, tarih, sayı, meta satırları, buton altı ipuçları.
- [x] Bölüm numaraları: her istasyonun etiketi „01 — Prinzip“ biçiminde (editoryal indeks).
- [x] Fontlar yine kendi sunucumuzda (DSGVO), latin alt kümesi.

### 2.2 Renk ve ışık
- [x] Zemin daha derin ve daha az doygun mürekkep tonu; köşe parıltıları zayıflatıldı.
- [x] Bloom yoğunluğu 1,25 → 0,9; neon etkisi azaltıldı, sahne daha „sinematik“.
- [x] Yeşil yalnızca işaret rengi: butonlar, aktif durum, vurgu kelimesi. Metin tonları daha sıcak beyaz/gri.
- [ ] Sahne renk paleti (parçacık renkleri) için ayrı bir sanat yönetimi turu: tek bir ana ton + vurgu. *Gerekçe: shader/geometri değişikliği, ayrı test gerektirir.*

### 2.3 Hero
- [x] Rozet ve 5 çip kaldırıldı; yerine üstte tek satır mono meta („NIS2 · ISO 27001 · EU AI Act · ISO 42001 · CRA“).
- [x] Başlık daha büyük, daha ince, kelime kelime maskeli açılış.
- [x] Alt kısımda editoryal istatistik şeridi: 910 Anforderungen · 227 gemeinsame Kontrollpunkte · 5 Regelwerke (mono etiketlerle).
- [x] Butonlar hap biçimi, ok ikonu üzerine gelince kayıyor.

### 2.4 İstasyon metinleri (3D üstü)
- [x] Masaüstünde kutular kaldırıldı: kenarlık ve cam efekti yok; okunabilirlik soldan sağa yumuşak karartma ile.
- [x] Mobilde hafif zemin korunuyor (sahne metnin arkasında).
- [x] Büyük gövde metinleri daha büyük ve daha açık.

### 2.5 Fristen (zaman ekseni)
- [x] Tarihler mono, daha büyük; pasif kilometre taşları 0,45 → 0,62 opaklık; açıklamalar daha açık renk.
- [ ] Sahnenin kendisi (ince çizgiler + boş zemin) yeniden tasarlanmalı: kalın, ışıklı bir zaman şeridi ve tarih „kapıları“. *Gerekçe: 3D geometri işi, ayrı tur.*

### 2.6 Funktionen (ürün)
- [x] Ekran görüntüleri pencere çerçevesinde (üç nokta, ince kenar, gölge), daha büyük başlıklar, sakin hover.
- [ ] Ekran görüntüleri koyu temada yeniden çekilmeli ya da bir „ürün turu“ (kaydırmayla değişen tek büyük ekran) yapılmalı. *Gerekçe: demo tenant'ta koyu tema ve yeni çekim gerekir.*

### 2.7 Vertrauen
- [x] İkon ızgarası yerine numaralı editoryal liste (01–06), ince çizgiler, büyük başlıklar.

### 2.8 Ritim öğeleri
- [x] Quick-Check ile Vertrauen arasına akan bant: Regelwerk adları serif italik, yavaş, hareket azaltmada durur.
- [x] Sayı sayacı (hero istatistikleri) – zaten vardı, yeni şeritte de çalışıyor.

### 2.9 Kapanış ve altbilgi
- [x] Son ekran: çok büyük başlık + tek birincil eylem (Demo-Anfrage formu) + ikincil giriş.
- [x] Altbilgide dev, kırpılmış „UniqSuite“ kelime işareti (ödüllü sitelerin klasik son karesi).

### 2.10 Demo talebi
- [x] „Demo vereinbaren“ artık yerinde bir form açıyor: Firma, Vorname, Nachname, geschäftliche E-Mail, Telefon (opsiyonel).
- [x] Freemail adresleri (gmail, gmx, web.de …) reddediliyor, hem tarayıcıda hem sunucuda.
- [x] Mail info@cyberwerksuite.com'a gidiyor; „Antworten“ doğrudan talep edene yazıyor.
- [x] Kötüye kullanım koruması: bal küpü alanı, en kısa doldurma süresi, IP/adres/gün sınırı (veritabanında). CAPTCHA ve üçüncü taraf yok.
- [x] Talep edene otomatik mail gitmiyor (sunucumuz spam aracı olamaz).
- [x] Datenschutz metnine form bölümü eklendi (taslak, senin onayına).

### 2.11 Erişilebilirlik ve performans (premium'un görünmeyen yarısı)
- [x] Yeni animasyonların hepsi `prefers-reduced-motion`'da kapalı.
- [x] Form: etiketler, `autocomplete`, `:user-invalid` ile etkileşimden sonra hata, `aria-invalid` eşlemesi, odak yönetimi (`<dialog>`).
- [x] Yeni fontlar toplam ~70 KB (Inter Display 500, Instrument Serif İtalik, JetBrains Mono 400). Lighthouse mobil (yerel): eski 94 → yeni 93, CLS 0,002. Ölçüm sırasında görülen gerilemeyi (89, CLS 0,23) gidermek için yedek fontlar ölçülerek ayarlandı ve kesit sayısı azaltıldı.
- [ ] Mobil LCP < 2,5 sn hedefi (şu an ~3,0 sn). *Gerekçe: ayrı ölçüm turu.*

## 3. Sonraki tur (bu turda yapılmadı)

1. **3D sahneleri tek görsel deyimde birleştirmek** – her istasyon aynı „malzemeden“ (ör. ışıklı ince çizgi + mat cam) olsun.
2. **Sahneler arası geçiş efektleri** (shader tabanlı çözülme/morph) – Lusion/Active Theory düzeyi.
3. **Ürün turu**: kaydırdıkça değişen tek büyük, koyu temalı uygulama ekranı.
4. **Gerçek referans / vaka** (izinli bir müşteri, sayılarla). Ödül jürisi de alıcı da „kanıt“ arar.
5. **Mikro sesler** (isteğe bağlı, varsayılan kapalı) ve özel imleç – yalnızca masaüstü.
6. **Mobil için ayrı 3D kurgu** (daha az parçacık, dikey kompozisyon).
7. **Sayfa geçişleri** (View Transitions) Datenschutz/Barrierefreiheit sayfalarına.
8. **OG görselleri** yeni tipografiyle yeniden üretmek.
