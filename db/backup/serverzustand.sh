#!/bin/sh
# ============================================================================
# cy — Serverzustand (V-4), NUR LESEND
# Belegt, was sich von aussen nicht messen lässt: SSH-Einstellungen, Firewall,
# Sicherheitsupdates, Docker-Protokollierung, Alter der Images, Plattenplatz,
# vorhandene Sicherungen. Ändert nichts; gibt keine Geheimnisse aus.
#
# Aufruf auf dem Server (Workflow "Nachweis Betrieb"):
#   cd /root/UniqSuite && sh db/backup/serverzustand.sh
# ============================================================================
cd "$(dirname "$0")/../.." || exit 1
abschnitt() { printf '\n=== %s ===\n' "$1"; }

abschnitt "System"
# shellcheck disable=SC1091  # Systemdatei, nur zur Anzeige
. /etc/os-release 2> /dev/null
echo "${PRETTY_NAME:-unbekannt} | Kernel $(uname -r) | $(ssh -V 2>&1)"
uptime

abschnitt "SSH (wirksame Einstellungen)"
sshd -T 2> /dev/null | grep -Ei '^(permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication|maxauthtries|x11forwarding) ' \
  || echo "sshd -T nicht verfügbar"

abschnitt "SSH-Host-Schluessel (Wert fuer das Secret SSH_KNOWN_HOSTS)"
# Öffentliche Schlüssel — kein Geheimnis. Die Zeilen unverändert als Secret
# SSH_KNOWN_HOSTS hinterlegen; danach prüft jeder Workflow, dass er wirklich
# mit diesem Server spricht.
for f in /etc/ssh/ssh_host_ed25519_key.pub /etc/ssh/ssh_host_ecdsa_key.pub; do
  [ -f "$f" ] && cut -d' ' -f1,2 "$f"
done
for f in /etc/ssh/ssh_host_ed25519_key.pub /etc/ssh/ssh_host_ecdsa_key.pub; do
  [ -f "$f" ] && ssh-keygen -lf "$f"
done

abschnitt "Firewall"
ufw status verbose 2> /dev/null || echo "ufw nicht installiert"

abschnitt "Lauschende TCP-Ports auf dem Host"
ss -tlnH 2> /dev/null | awk '{ print $4 }' | sort -u

abschnitt "Sicherheitsupdates"
echo "unattended-upgrades: $(systemctl is-enabled unattended-upgrades 2> /dev/null || echo 'nicht installiert')"
grep -h 'Unattended-Upgrade' /etc/apt/apt.conf.d/20auto-upgrades 2> /dev/null
if [ -f /var/run/reboot-required ]; then echo "NEUSTART AUSSTEHEND"; else echo "kein Neustart ausstehend"; fi
echo "ausstehende Sicherheitsupdates: $(apt list --upgradable 2> /dev/null | grep -ci -- '-security')"
echo "fail2ban: $(systemctl is-active fail2ban 2> /dev/null || true)"

abschnitt "Docker"
docker version --format 'Docker-Server {{.Server.Version}}' 2> /dev/null
docker info --format 'Log-Treiber: {{.LoggingDriver}}' 2> /dev/null
if [ -f /etc/docker/daemon.json ]; then cat /etc/docker/daemon.json; else echo "keine /etc/docker/daemon.json"; fi

abschnitt "Laufende Images und ihr Alter"
docker compose ps --format '{{.Service}}: {{.Image}} ({{.Status}})' 2> /dev/null
docker image ls --format '{{.Repository}}:{{.Tag}}  erstellt {{.CreatedSince}}' 2> /dev/null | grep -v '<none>' | head -n 15

abschnitt "Platte"
df -h / | tail -n 1
du -sh backups /var/lib/docker/containers 2> /dev/null

abschnitt "Sicherungen (neueste zuerst)"
if [ -d backups ]; then
  # shellcheck disable=SC2012  # nur Anzeige, Namen stammen von backup.sh
  ls -lt backups/cy_daily_*.dump backups/cy_predeploy_*.dump 2> /dev/null | head -n 8 | awk '{ print $5, $6, $7, $8, $9 }'
  echo "Anzahl: $(find backups -maxdepth 1 -name 'cy_daily_*.dump' | wc -l | tr -d ' ') täglich," \
       "$(find backups -maxdepth 1 -name 'cy_predeploy_*.dump' | wc -l | tr -d ' ') vor Deploys"
else
  echo "KEIN Ordner backups"
fi

abschnitt "Hochgeladene Dateien: Metadaten gegen Volume"
# Zählt nur (Bucket und Anzahl), keine Namen oder Inhalte. Weichen die beiden
# Zahlen voneinander ab, fehlen Dateien (oder es liegen verwaiste im Volume).
docker compose exec -T db psql -X -U postgres -d cy -At -c \
  "SELECT coalesce(string_agg('DB ' || bucket_id || ' ' || n, E'\\n' ORDER BY bucket_id), 'DB: keine Objekte')
     FROM (SELECT bucket_id, count(*) AS n FROM storage.objects GROUP BY 1) t" 2> /dev/null \
  || echo "DB: nicht lesbar"
docker compose exec -T api sh -c 'n=0; for b in /data/storage/*/; do [ -d "$b" ] || continue; n=1; echo "Volume $(basename "$b") $(find "$b" -type f | wc -l)"; done; [ "$n" = 1 ] || echo "Volume: leer"' 2> /dev/null \
  || echo "Volume: nicht lesbar"

abschnitt "Mandanten-Konsistenz (V-5)"
# Nutzer mit mehr als einer Org-Mitgliedschaft. Soll 0 sein: bis V-5 konnte ein
# Mitglied (Reiter "Team") eine zweite Org bekommen; dann wurde sein Mandant
# zufaellig aufgeloest. Nur eine Zahl, keine Namen.
docker compose exec -T db psql -X -U postgres -d cy -At -c \
  "SELECT 'Nutzer mit mehreren Mitgliedschaften: ' || count(*) FROM (SELECT user_id FROM public.org_members GROUP BY 1 HAVING count(*) > 1) t" \
  2> /dev/null || echo "nicht lesbar"
# Bis V-5 las jede Person mit der Rolle "lecturer" die Daten ALLER Kunden.
docker compose exec -T db psql -X -U postgres -d cy -At -c \
  "SELECT 'Nutzer mit Rolle lecturer: ' || count(DISTINCT user_id) FROM public.user_roles WHERE role::text = 'lecturer'" \
  2> /dev/null || echo "nicht lesbar"

abschnitt "Zugriffsprotokoll (Caddy)"
docker compose exec -T caddy sh -c 'ls -l /data/access*.log* 2> /dev/null | head -n 5' 2> /dev/null || echo "keins"

abschnitt "Konfiguration (.env, nur unkritische Werte)"
grep -E '^(AUTH_AUTOCONFIRM|CORS_ORIGIN|PUBLIC_APP_URL|CY_DOMAIN|BACKUP_KEEP_DAYS)=' .env 2> /dev/null
if grep -qE '^SMTP_HOST=.+' .env 2> /dev/null; then echo "SMTP: konfiguriert"; else echo "SMTP: NICHT konfiguriert (E-Mails werden nur protokolliert)"; fi

abschnitt "Dateirechte"
stat -c '%a %U %n' .env backups 2> /dev/null
exit 0
