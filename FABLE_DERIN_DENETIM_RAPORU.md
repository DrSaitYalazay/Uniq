# CWS — Fable Derin Denetim Raporu (2026-09-03)

**Kapsam:** 3 paralel Fable ajanı — (1) Veri akışı (aşamalar-arası + araçlara), (2) İçerik/uygunluk (kanun + framework), (3) Rapor/çıktı formatı.
**Canlı temel:** commit `881e7f5 "1.1"` (çalışıyor). Bu turda uygulanan güvenli fixler bunun üstünde, pending push.

> ⚠️ **Kritik kural (bu turda uyuldu):** Global projeksiyon hot-path'i (`useAssessment.ts`, `useComplianceOverview.ts`, `assessmentEngine.projectAnswer/buildAnchorAnswerMap`) **değiştirilmedi** — bu dosyalara `control_iso` fallback + answers-filtresi-kaldırma uygulamak daha önce **canlıyı çökertti** (tüm sayfalar sonsuz "Laden…", framework'ler "keine"). Bu tür değişiklikler ancak **staging/fixture testinden** sonra.

---

## BÖLÜM 0 — Bu turda UYGULANAN (güvenli, pending push, 16 dosya)

**P0 rapor (müşteri PDF'inde görünen) — düzeltildi:**
- `policyReportGenerator.ts` + `policyClauseExporterPdf.ts`: her sayfada basılan literal `__PAGE__` kaldırıldı, gerçek sayfa-numarası stampi eklendi.
- `AuditWorkbench.tsx`: audit-rapor başlığındaki araç adı "CyberWerkSuite" → şirket adı (`getReportBrandName`). **Ek: iki runtime-landmine yakalandı ve düzeltildi** (`companyName` ve `getReportBrandName` tanımsızdı → import eklendi; esbuild bunları global sanıp geçiyordu — Star-çökme dersi).
- `trainingPlanReport.ts`: footer'daki "CyberWerkSuite" → marka adı.

**İçerik/kanun (deploy eden TS/JSON):**
- `incidentReportForms.ts`: KRITIS Abschlussmeldung 720h → **792h** (§ 32 Abs. 1 Nr. 4 BSIG, NIS2 ile tutarlı).
- `frameworkCatalogs.ts`: NIS2 kova etiketleri düzeltildi ("Zugriffskontrolle…" → "Art. 21(2)(a) · Risikoanalyse…"; "Cyberhygiene" → "Art. 21(2)(g) · …").
- `structure.json` + `nis2Controls.ts` (+ source): terminoloji **"Datenschutz" → "Datensicherheit"** (data-security bağlamında yanlıştı).

**Marka/tutarlılık (rapor altyapısı):**
- `reportTheme.ts`: navy `#1A2E41` → **`#122D54`** (marka rengi).
- `reportBrand.ts`: boş profilde placeholder "CyberWerkSuite" → **"Ihr Unternehmen / Your organisation"**.
- `ManagementSummaryCard.tsx`: Vorstandsbericht %'i artık **applicable-ağırlıklı** (Dashboard hero ile birebir; N/A varken tutarsızlık giderildi).
- `gapReport.ts`: yanlış "Reifegrad" sütun/başlık (aslında Compliance gösteriyordu) → "Compliance".

**Rapor içerik (yanlış/dev-metin):**
- `soaGenerator.ts`: her müşteriye basılan hardcode "NIS2-Richtlinie Art. 21(2)" → jenerik **"Erklärung zur Anwendbarkeit (ISO/IEC 27001 Kap. 6.1.3 d)"** (SoA bir ISO gerekliliğidir; ISO-only müşteriye NIS2 basılıyordu).
- `roadmapReportGenerator.ts`: teslimata basılan **geliştirici notu** kaldırıldı; "Maßnahmenregister - jede Zeile" → "Maßnahmenregister".
- `inventoryReport.ts`: null RTO/RPO'da "— h" → "—".

Whole-tree derleme temiz, lock yok, hot-path dokunulmadı.

---

## BÖLÜM 1 — VERİ AKIŞI (Fable ajan 1) — 32 bulgu (P0:1, P1:17, P2:14)

### Aşamalar-arası
- **F-01 (P0, hot-path kökü / SAFE azaltma):** Boş framework-scope'ta `useAssessment.loading` hiç `false` olmuyor → yeni müşteride Dashboard/Gap sonsuz "Laden…". Kök fix hot-path (staging); sayfa-seviyesi azaltma güvenli (Assessment/Dashboard busy-guard).
- **F-02 (P1, SAFE):** `FrameworkContext` boş scope'u ve bilinmeyen DB kodlarını (SOC2, ISO27001_AI, BSI_AI) yok sayıyor → "tümünü kaldır" sonrası eski liste kalıyor, o 3 framework hiç yüklenmiyor.
- **F-05 (P2, SAFE):** Asset-kritiklik boolean→sayı hatalı çevriliyor (override kritik iken düşük olabiliyor).
- **F-11 (P1, SAFE):** Roadmap `isoRef`'i metin-regex'ten türetiyor, `meta.iso_ids`'ten değil → bundle-key/effort/owner/tema büyük oranda boşa düşüyor.
- **F-12/F-16 (P1, SAFE):** SoA & Umsetzung katalogları `sub`/`scored=false` kontrolleri sayıyor → nenner şişiyor (Gap/Dashboard hariç tutuyor).
- **F-13 (P1, SAFE opsiyon A):** SoA "nicht anwendbar" ikinci bir gerçek; 5 tüketiciden yalnız 2'si onurluyor → aynı kontrol Umsetzung'da n/a, Dashboard/Risk/Audit'te "offen". Fix: SoA toggle'ı Gap `na` yazsın (tek kaynak).
- **F-15 (P1, SAFE):** Roadmap durumu/owner'ı ada (`nis2-execution-actions`), Umsetzung `implementation_status` — 4 ayrı owner deposu; Roadmap "fertig" Umsetzung/Dashboard'a ulaşmıyor.
- **F-17 (P1, SAFE):** Implementation, login sonrası ilk mount'ta `umsetzung-effective={}` + `umsetzung-progress={total:0}` persist ediyor (FrameworkContext henüz boşken) → org overlay/progress kısa süre (veya kalıcı) siliniyor. **← en yüksek öncelik, veri-kaybı riski.**

### Araçlara
- **F-21 (P1, SAFE) — UYGULANDI:** Dashboard'da 3 farklı "Gesamt-Compliance" formülü (KPI/Hero/server). ManagementSummaryCard applicable-ağırlığı düzeltildi.
- **F-22 (P1, api):** Server KPI-snapshot 4. formül (ham answers, projeksiyon/overlay yok) → sparkline tutarsız.
- **F-23 (P1, SAFE):** Delta-Backlog Gap/overlay/SoA'yı yoksayıyor; BSI etiketi ham.
- **F-26 (P1, SAFE):** Incident yaşam döngüsü fristleri güncellemiyor (silinen incident'ın deadline'ı açık kalıyor, "abgesendet" tamamlamıyor).
- **F-27 (P1, SAFE):** Dokümanter periyodik reviewlar `compliance_deadlines`'a hiç ulaşmıyor.
- **F-28 (P1, SAFE):** Policy `nextReviewDate` ne deadline ne doküman → gecikmiş review Dashboard'da görünmez.
- **F-31 (P1, SAFE):** Beschaffungs-Freigabe tamamen izole (Inventar/Lieferant/Personnel/deadline bağı yok).

---

## BÖLÜM 2 — İÇERİK / UYGUNLUK (Fable ajan 2) — P0:1, P1:7, P2:14, VERIFY:5

**Kapsam iyi:** NIS2(238), DORA(270), BSI(999), KRITIS(571), ISO27001(418), TISAX(80), MaRisk(146), SOC2(151). **İnce:** AI Act(76, Art.4/26/50 eksik), ISO42001(32), ISO27701(23).

**Meldefrist tablosu:** çoğu doğru. Düzeltilenler: KRITIS 792 (UYGULANDI). Kalan:
- **INC-01 (P1):** AI Act Art.73 tek 15-gün timer; 2-gün (kritik altyapı/yaygın) ve 10-gün (ölüm) varyantları yok. Motor-branch gerektiriyor → **test turuna** (geçici konservatif 48h opsiyonu var).
- **INC-04 (P2):** CRA final-rapor tek timer; Schwachstelle(14T)/Vorfall(1M) ayrılmalı.

**Kanun-atıf düzeltmeleri (SAFE-CONTENT, TS — uygulanabilir; kısmen seed):**
- **CM-01 (P0, seed re-seed):** 10 yeni framework'ün (GDPR/CRA/AIACT/SOC2/ISO42001/…) `control_iso`/`meta.iso_ids`'i Annex-A numarası olarak yazılmış ama hub sıralı ID kullanıyor → ~700 satır yanlış hub sorusuna işaret. Projeksiyon node-only olduğu için yüzdeler kaymıyor ama Roadmap-applicability/treatment-öneri/audit-family yanlış. **Fix: `controls-map.json`'dan crosswalk yeniden üret + re-seed.** Büyük iş, ayrı tur.
- **LEG-02/05/06/08 (P1/P2):** eski § 8a/§ 8b BSIG atıfları → § 30/31/32; DORA madde atıfları; NIS2 reg-01 Art. 27→Art. 3(4). Kısmı TS (frameworkArticleMap, deltaDocuments, nis2Mapping) uygulanabilir; kısmı seed.
- **LEG-03/04 (P1):** KRITIS Nachweis "2 yıl" → **3 yıl (§ 39 Abs. 1 BSIG)**; uydurma DORA "2-yıllık Nachweis" override'ı silinmeli. (Kısmı seed.)
- **TERM-01 (UYGULANDI kısmen)** + TERM-02 (ISO 27002:2024 → DIN EN ISO/IEC 27002:2024, seed).
- **COV-01 (P1, seed):** AI Act Art. 4/26/50 kontrolleri eklenmeli.
- **MAP-01/02/03:** isoFamilyMap/capabilityMap aile eşleşmeleri; ABF ankraları (seed).

**VERIFY (uygulamadan önce doğrula):** ISO27701:2025 numaralama · AI Act yüksek-risk tarih ertelemesi · KRITIS-DachG § 18 alıcı · B3S-Eignung turnus · MaRisk-DORA-RTS atıfları.

---

## BÖLÜM 3 — RAPOR / ÇIKTI FORMATI (Fable ajan 3) — P0:3, P1:17, P2:~32 (hepsi SAFE-CONTAINED)

**Verdict:** Gap/Risk/Training-Status/Policy-Overview yayına yakın; **Roadmap, SoA, Policy-Report, Audit, Vorstandsbericht standart-altı** (marka/grafik/dev-metin/placeholder). 10 rapor-üreteci hiç bağlı değil (orphan).

**P0 — UYGULANDI:** policy `__PAGE__` (×2), audit başlığında araç adı.

**Kalan yüksek-değer (SAFE, uygulanabilir — ayrı turda):**
- **Paylaşılan altyapı:** reportHtmlLayout Word-cover solid-fallback (X1), EN-etiket (X2), `break-inside:avoid` (X4), @page footer sayfa-no+classification (X3); tüm raporlarda `chartPalette` importu (X5); marka rengi/tarih birleştirme (X6/X7); DOCX header/footer/logo (X10).
- **Audit raporu (A2-A4):** tamamen DE, marka/kapak/metod/sonuç yok → paylaşılan HTML-layout'a taşı.
- **Vorstandsbericht (B2):** en yönetim-yüzlü teslim çıplak HTML; kapak+grafik ekle.
- **Roadmap raporu (RM2/RM4):** kapak+grafik yok, 6pt font; **RM1 dev-notu UYGULANDI**.
- **SoA (S3-S5):** rasterize html2canvas → print-HTML; versiyon/onay bloğu + donut.
- **Risk (K3/K4):** heatmap zon-renkleri; tam risk-register tablosu.

---

## ÖNCELİKLİ YOL HARİTASI (test edilebilir turda)

**1. En acil — veri-koruma (F-17):** Implementation'ın login-sonrası boş-persist wipe'ı. Tek fix, yüksek etki. (Sayfa-scoped ama persist yazıyor → dikkatli + test.)
**2. Araç entegrasyonları (F-26/27/28/31):** Incident/Doküman/Policy → `compliance_deadlines`; Beschaffung → Inventar. Davranış değiştirir → test.
**3. Sayı-tutarlılığı (F-22 server, F-23, B1✓):** KPI-snapshot formülü + Delta-Backlog.
**4. İçerik/kanun re-seed (CM-01, LEG-03/04/08, COV-01, TERM-02, MAP-03):** seed SQL düzenle → staging re-seed → prod. Büyük ama yüksek-değer (uygunluk).
**5. Rapor standardizasyonu (X1-X10 + A/B/RM/SoA yeniden-yazım):** paylaşılan altyapı önce.
**6. Global hot-path (F-01 kök, F-03, control_iso fallback):** yalnız staging + fixture testiyle.

---

**Özet:** Bu turda ~20 güvenli, deploy-eden, yüksek-değerli fix uygulandı (P0 rapor hataları + kanun-atıf + marka + terminoloji + sayı-tutarlılığı), hepsi derleniyor, hot-path dokunulmadı, 2 runtime-landmine yakalandı. Kalan derin/davranışsal işler (araç entegrasyonları, re-seed, rapor yeniden-yazım, hot-path) yukarıda önceliklendirildi — bunlar **test edilebilir bir turda** yapılmalı, canlıya kör gitmemeli.
