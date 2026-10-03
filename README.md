# UniqSuite

> Kurulum ve canlıya alma: **KURULUM.md**. Basitleştirme önerileri: **docs/BASITLESTIRME_ONERILERI.md**.

UniqSuite'in Supabase'siz sürümü. Aynı React/Vite frontend'i, ama backend artık
**Supabase değil, kendi sunucunuzda çalışan düz PostgreSQL + Node API**. Supabase
kütüphaneleri (`@supabase/supabase-js`, Lovable Cloud) tamamen kaldırıldı.

## Neden

- **Tam veri egemenliği / DSGVO**: her şey kendi sunucunuzda (IONOS, Almanya).
- Managed Supabase EU bağımlılığı yok.
- 316 RLS politikası ve 55+ tablo dahil tüm veri modeli **değiştirilmeden** korunur.

## Mimari

```
  Tarayıcı ──HTTPS──► Caddy ──► web (nginx: React SPA)
                                  │  /auth /db /storage /functions  (proxy)
                                  ▼
                                api (Node/Express)  ──►  PostgreSQL
                                worker (e-posta kuyruğu)      (RLS korunur)
```

Kilit fikir — **PostgREST modeli**: API her isteği bir transaction içinde
`SET LOCAL ROLE authenticated` + `request.jwt.claims` ile çalıştırır. Böylece
migration'lardaki `auth.uid()` ve tüm RLS politikaları düz Postgres'te aynen çalışır.

| Supabase parçası | cy karşılığı |
|---|---|
| GoTrue (auth, MFA) | `api/src/auth` (JWT, bcrypt, TOTP) |
| PostgREST | `api/src/gateway` (JSON sorgu → parametreli SQL, RLS altında) |
| Storage | `api/src/storage.js` (disk + `storage.objects` RLS) |
| Edge Functions | `api/src/functions/*` (8 fonksiyon) |
| pg_cron + pg_net e-posta | `api/src/worker` + `pgmq` shim |
| `auth`, `storage`, `pgmq`, `vault` şemaları | `db/00_bootstrap.sql` + `db/10_shims.sql` |

## Klasörler

- `web/` — frontend (Vite/React/shadcn). Tek değişen: `src/integrations/supabase/client.ts` artık cy-api'ye konuşan drop-in.
- `api/` — Node API (auth + gateway + storage + functions + worker).
- `db/` — `00_bootstrap.sql`, `10_shims.sql`, `migrations/` (98 orijinal migration), `build-schema.sh` → `schema.sql`.
- `docker-compose.yml`, `Caddyfile` — dağıtım.

## Hızlı başlangıç (yerel)

```bash
cp .env.example .env      # değerleri doldurun (CY_DOMAIN=:80 ile TLS'siz)
bash db/build-schema.sh   # schema.sql üret (migration değişince tekrar)
docker compose up -d --build
# http://localhost
```

İlk kullanıcı: uygulamadan kaydolun. Admin yapmak için (isteğe bağlı):
`db/migrations` içindeki signup trigger'ları rolleri otomatik atar.

## Şema güncelleme

Migration ekl/değiştir → `bash db/build-schema.sh` → yeni `schema.sql`.
**Not:** `schema.sql` yalnızca DB'nin **ilk** boot'unda yüklenir. Mevcut bir DB'ye
değişiklik uygulamak için migration'ı `psql` ile elle çalıştırın veya volume'u sıfırlayın.

Dağıtım adımları için `docs/DEPLOY_IONOS.md`.
