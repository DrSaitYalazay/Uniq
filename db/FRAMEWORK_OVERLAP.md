# Framework-Überschneidung & Delta (strict same-as Knoten-Modell)

Kaynak: `db/seeds/catalog.sql` (controls) + `db/seeds/overrides.sql` (control_node_member).
Ölçüt: iki kontrol AYNI strict-same-as knoten'i paylaşıyorsa 'örtüşen' sayılır.
Delta = o framework'ün toplam kontrolü − hedef framework ile knoten paylaşan kontrol.
NOT: strict same-as KONSERVATİF — içerikçe benzer ama birebir-eş olmayan kontroller delta sayılır.
Canlı katalog seed'den farklı olabilir (NIS2 live≈240 vs seed 238).

| Framework | Toplam | ISO27001 ile örtüşen | Δ vs ISO27001 | BSI ile örtüşen | Δ vs BSI | Knoten-siz (tam bağımsız) |
|---|--:|--:|--:|--:|--:|--:|
| ISO27001 | 418 | 418 | 0 | 83 | 335 | 189 |
| BSI | 999 | 85 | 914 | 999 | 0 | 760 |
| NIS2 | 238 | 81 | 157 | 57 | 181 | 89 |
| DORA | 270 | 21 | 249 | 28 | 242 | 140 |
| KRITIS | 571 | 74 | 497 | 84 | 487 | 361 |
| TISAX | 80 | 78 | 2 | 62 | 18 | -79 |
| MaRisk | 146 | 12 | 134 | 15 | 131 | 57 |
| AIACT | 76 | 1 | 75 | 1 | 75 | 62 |
| CRA | 66 | 2 | 64 | 15 | 51 | 38 |
| GDPR | 58 | 0 | 58 | 0 | 58 | 33 |
| BSI200_4 | 49 | 17 | 32 | 16 | 33 | -53 |
| BCM22301 | 46 | 51 | -5 | 15 | 31 | -73 |
| ISO42001 | 32 | 2 | 30 | 0 | 32 | 24 |
| NIST_AI_RMF | 26 | 0 | 26 | 0 | 26 | 19 |
| ISO27701 | 23 | 1 | 22 | 0 | 23 | 2 |
