#!/bin/sh
# ============================================================================
# UniqSuite — Ersteinrichtung auf dem Server (läuft automatisch beim ERSTEN
# Deploy aus deploy_remote.sh, wenn /root/UniqSuite/.env noch fehlt).
#
# Erzeugt .env mit eigenen, zufälligen Geheimnissen (eigene Datenbank,
# eigener JWT-Schlüssel — nichts wird mit ClaudeCWS geteilt). Nur die
# SMTP-Zugangsdaten werden, falls vorhanden, aus /root/ClaudeCWS/.env
# übernommen, damit Einladungen und Passwort-Mails sofort funktionieren.
# Eine vorhandene .env wird NIE überschrieben.
# ============================================================================
set -eu
cd "$(dirname "$0")"
if [ -f .env ]; then echo "ersteinrichtung: .env vorhanden, nichts zu tun."; exit 0; fi
gen() { openssl rand -hex "$1"; }
cws() { grep "^$1=" /root/ClaudeCWS/.env 2>/dev/null | head -1 | cut -d= -f2- || true; }
umask 077
cat > .env <<ENV
# UniqSuite — erzeugt von ersteinrichtung.sh am $(date -u +%Y-%m-%dT%H:%MZ)
POSTGRES_DB=cy
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(gen 24)
AUTHENTICATOR_PASSWORD=$(gen 24)
JWT_SECRET=$(gen 32)
PUBLIC_APP_URL=https://uniq.cyberwerk.online
CORS_ORIGIN=https://uniq.cyberwerk.online
AUTH_AUTOCONFIRM=$(cws AUTH_AUTOCONFIRM)
SMTP_HOST=$(cws SMTP_HOST)
SMTP_PORT=$(cws SMTP_PORT)
SMTP_USER=$(cws SMTP_USER)
SMTP_PASS=$(cws SMTP_PASS)
EMAIL_FROM=$(cws EMAIL_FROM)
BACKUP_KEEP_DAYS=14
# Diese Adresse wird Plattform-Admin (bei der Registrierung bzw. beim nächsten Deploy).
ADMIN_EMAIL=admin@cyberwerk.online
ENV
# Leere Werte auf die Standardwerte aus docker-compose.yml zurückfallen lassen
sed -i -e '/^AUTH_AUTOCONFIRM=$/d' -e '/^SMTP_PORT=$/d' -e '/^EMAIL_FROM=$/d' .env
chmod 600 .env
echo "ersteinrichtung: .env angelegt (Geheimnisse zufällig erzeugt, SMTP aus ClaudeCWS übernommen, falls vorhanden)."
