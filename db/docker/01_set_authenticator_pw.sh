#!/bin/bash
# Postgres init: authenticator rolünün şifresini .env'den ayarlar.
# schema.sql (00_) authenticator rolünü yer tutucu şifreyle oluşturdu; burada
# gerçek şifreyi veriyoruz. API bu rolle bağlanır (RLS PostgREST modeli).
set -e
: "${AUTHENTICATOR_PASSWORD:?AUTHENTICATOR_PASSWORD gerekli}"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
ALTER ROLE authenticator WITH PASSWORD '${AUTHENTICATOR_PASSWORD}';
SQL
echo "[cy-db] authenticator şifresi ayarlandı"
