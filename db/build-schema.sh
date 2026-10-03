#!/usr/bin/env bash
# ============================================================================
# cy — tam şemayı tek dosyada birleştirir: schema.sql
#   00_bootstrap.sql  (roller, auth/storage şeması, auth.uid() vs.)
#   10_shims.sql      (pgmq/pg_net/vault/cron shim'leri)
#   migrations/*.sql  (98 Lovable migration'ı, sıralı — CREATE EXTENSION temizlenir)
#
# Postgres imajı ilk boot'ta docker-entrypoint-initdb.d üzerinden schema.sql'i
# çalıştırır. Bu script'i şema değiştikçe yeniden koştur.
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"

OUT="schema.sql"
echo "-- OTOMATİK ÜRETİLDİ — build-schema.sh. Elle düzenleme." > "$OUT"
echo "-- Üretim: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$OUT"
echo "" >> "$OUT"

append() {
  echo "" >> "$OUT"
  echo "-- ==================================================================" >> "$OUT"
  echo "-- KAYNAK: $1" >> "$OUT"
  echo "-- ==================================================================" >> "$OUT"
  # Desteklenmeyen Supabase eklentilerinin CREATE EXTENSION satırlarını sil.
  # (Onların yerine 10_shims.sql'deki objeler geçer.)
  sed -E '/CREATE +EXTENSION +IF +NOT +EXISTS +(pg_net|pg_cron|supabase_vault|pgmq)/d' "$1" >> "$OUT"
  echo "" >> "$OUT"
}

append 00_bootstrap.sql
append 10_shims.sql

# Migration'ları dosya adına göre (zaman damgası) sıralı ekle.
# Bir migration'dan ÖNCE çalışması gereken yama varsa (patches/pre_<ad>) önce onu ekle.
for f in $(ls migrations/*.sql | sort); do
  base="$(basename "$f")"
  if [ -f "patches/pre_${base}" ]; then
    append "patches/pre_${base}"
  fi
  append "$f"
done

# Tam framework/kontrol kataloğu (18 framework, 3293 kontrol) — master_kontrollen.csv'den
append seeds/catalog.sql
append seeds/iso.sql
append seeds/risks.sql
append seeds/overrides.sql

# Son: grant'ları migration'lardan sonra tekrar uygula (yeni tablolar için)
append 99_grants.sql

echo "" >> "$OUT"
echo "Oluşturuldu: $OUT ($(wc -l < "$OUT") satır)"
