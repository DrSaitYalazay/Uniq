## Kural
NIS2, Adım 1'de framework olarak seçilmediyse (`active` listesinde NIS2 yoksa) UI'da ve üretilen raporlarda hiçbir NIS2 metni/başlık/citation/artikel görünmesin. Framework verisinin kendisi (nis2Controls katalog, mapping) kalıyor — sadece kullanıcıya gösterilen metin gizleniyor.

## Şu ana kadar yapılan
- TrainingTab guidance + footer → `nis2Active` guard
- TopicParticipantsList hint → aktif framework'lere göre dinamik referans listesi
- Implementation.tsx delta-tooltip → aktif framework'lere göre dinamik örnek
- Roadmap.tsx: "NIS2-Katalog", "NIS2-Kategorie", "NIS2-Audit ≥ 80%" → `primary.short` / neutral

## Kalan iş (bu plan)

### 1. UI'da kalan NIS2 metinleri
- `src/pages/Assessment.tsx` (satır 437-438): "ISO 27001, NIS2, BSI, DORA" listesi → aktif frameworklerden üret
- `src/pages/Datenschutz.tsx` (satır 136-137, 419-420, 450-453): "NIS2-Richtlinie" bölümleri → yasal sayfa olduğu için genel bir liste, `nis2Active` yerine olduğu gibi tutalım mı? **Karar: Datenschutz/Impressum kalır** (yasal tenant-bağımsız metin).
- `src/pages/Policies.tsx` (satır 137, 352, 1048): framework chip listesi ve source metinleri → `activeKeys`'e göre dinamik göster
- `src/pages/Dashboard.tsx` (satır 13): FRAMEWORK_LABELS mapping — bu sadece etiket, kalıyor

### 2. Raporlarda NIS2 metinleri
Aşağıdaki generator'lara `nis2Active: boolean` (veya `activeFrameworks: FrameworkKey[]`) parametresi eklenecek. Metin ve bölüm koşullu render edilecek.

**a) `src/lib/auditReportGenerator.ts`**
- Risk-narratives (satır 36, 40): "NIS2-Richtlinie (EU 2022/2555)... Bußgeld 10 Mio. EUR" → NIS2 aktif değilse genel formülasyona geç ("regulatorische Anforderungen")

**b) `src/lib/executionReportGenerator.ts`**
- "Umsetzungsfortschritt — NIS2 Art. 21(2)" (satır 512-513, 804-805) → NIS2 aktifse başlık ve NIS2-chart bölümü render; değilse sadece Domain view
- "Die NIS2-Ansicht gruppiert nach Art. 21..." açıklamaları (satır 217-218, 628-629) → NIS2 aktifse dahil et

**c) `src/lib/gapReportGenerator.ts`**
- Narrative metinlerinde "NIS2 Art. 20/21/Art. 21(2)(d)/NIS2-Klauseln" ifadeleri (satır 289, 310, 314, 327 vs.) → NIS2 aktifse cite, değilse jenerik "regulatorische Anforderungen" / aktif framework citation

**d) `src/lib/kvpReportGenerator.ts`, `src/lib/riskReportPdf.ts`, `src/lib/incidentReportGenerator.ts`, `src/lib/policyReportGenerator.ts`, `src/lib/maturityReportGenerator.ts`, `src/lib/kpiReportGenerator.ts`**
- `grep`'le her birinde kalan NIS2 mention'larını çıkarıp aynı guard uygula

**e) `src/lib/companyTemplates.ts`**
- NIS2-özel şablonlar (NIS2-Registrierungsdaten, Lieferanten-NIS2-Anschreiben, "NIS2-Kontakt"): bu şablonlar zaten sadece NIS2 için üretilir — çağrı yerinde `nis2Active` kontrolü ile export butonlarını gizle (Policies/Company sayfası). Şablon içeriği dokunulmaz.

### 3. Çağrı yerlerinde `nis2Active` iletimi
- Rapor üreten butonların bulunduğu component'lerde `useFramework()` çağrılıp `nis2Active = active.some(f => f.key === "NIS2")` generator'a geçirilecek.
- Ana çağrı yerleri: `Assessment.tsx`, `Roadmap.tsx`, `Implementation.tsx`, `Risk.tsx`, `Policies.tsx`, `Dashboard.tsx`, `Scope.tsx`, `KPI` sayfası.

### 4. Test
- `src/test/no-turkish.test.ts` benzeri hızlı bir doğrulama: NIS2 seçili değilken üretilen HTML/PDF içinde "NIS2" substring geçmemeli (opsiyonel, kapsam çok).

## Teknik notlar
- Kaynak-of-truth: `useFramework().active`.
- Sadece render/metin katmanı değişecek — hesaplama ve mapping mantığı NIS2 verisiyle çalışmaya devam eder (ör. `nis2Domains` gruplama iç veri olarak kalır, sadece etiket "Domain X" olarak sunulur).
- Datenschutz/Impressum (yasal sayfa) tüm frameworkleri tarayan referans listesi olarak kalır — tenant-bağımsız.

## Kapsam dışı
- Framework verisi (nis2Controls, capabilityMap, nis2Mapping) değişmez.
- Test dosyalarındaki NIS2 mention'ları değişmez.
- Landing page'de NIS2 kalır (proje halen NIS2-öncelikli pazarlanıyor). **Onay isterim** — landing'den de silinsin mi?

## Sıralama
1. Rapor generator'ları (audit, execution, gap, kvp, risk, incident, policy, maturity, kpi) — en görünür yer
2. UI (Assessment, Policies chip listesi)
3. Company templates çağrı-yeri guard
4. Doğrulama testi (opsiyonel)
