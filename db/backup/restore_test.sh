#!/bin/sh
# ============================================================================
# cy — Wiederherstellungsprobe (V-4)
# Eine Sicherung, die nie zurückgespielt wurde, ist keine Sicherung.
#
#   1. frische Sicherung + Zeilenzahlen aus DEMSELBEN Snapshot (backup.sh nachweis)
#   2. Rückspielen in einen Wegwerf-Postgres OHNE Netz (--network none)
#   3. Zeilenzahl jeder Tabelle: Live-Snapshot gegen Rückspielung, zeichengleich
#   4. Dateiarchiv: Anzahl Dateien im Archiv gegen Anzahl im Volume
#
# Die Live-Datenbank wird nur gelesen. Wegwerf-Container und Probedateien werden
# am Ende in jedem Fall entfernt (trap). Ins Log kommen nur Summen und — im
# Fehlerfall — die abweichenden Tabellennamen, keine Inhalte.
#
# Aufruf auf dem Server (Workflow "Nachweis Betrieb"):
#   cd /root/UniqSuite && sh db/backup/restore_test.sh
# ============================================================================
set -eu
umask 077
cd "$(dirname "$0")/../.."
PROBE=cy-wiederherstellungsprobe
IMG=public.ecr.aws/docker/library/postgres:16-alpine

aufraeumen() {
  docker rm -f -v "$PROBE" > /dev/null 2>&1 || true
  rm -f backups/cy_nachweis_* backups/storage_nachweis_*
}
trap aufraeumen EXIT
trap 'exit 1' INT TERM

echo "1) Sicherung mit Zeilenzahlen aus einem Snapshot"
docker compose run --rm --no-deps -T backup nachweis
DUMP=$(find backups -maxdepth 1 -name 'cy_nachweis_*.dump' | sort | tail -n 1)
BASE=${DUMP%.dump}
TABELLEN=$(wc -l < "$BASE.counts" | tr -d ' ')
echo "   $(basename "$DUMP"): $(du -h "$DUMP" | cut -f1), $TABELLEN Tabellen"

echo "2) Rückspielen in Wegwerf-Postgres ohne Netz"
# Die Probe-DB braucht Platz auf derselben Platte wie die Live-DB. Grob das
# Zehnfache des (komprimierten) Dumps plus 1 GiB Reserve, sonst lieber abbrechen.
WURZEL=$(docker info --format '{{.DockerRootDir}}' 2> /dev/null || echo /var/lib/docker)
FREI_KB=$(df -Pk "$WURZEL" | awk 'NR == 2 { print $4 }')
NOETIG_KB=$(( $(du -k "$DUMP" | cut -f1) * 10 + 1048576 ))
if [ "$FREI_KB" -lt "$NOETIG_KB" ]; then
  echo "FEHLER: zu wenig Platz für die Probe (frei $FREI_KB KiB, nötig $NOETIG_KB KiB) — abgebrochen, Live-System unberührt"
  exit 1
fi
docker rm -f -v "$PROBE" > /dev/null 2>&1 || true
# Begrenzt, damit die Probe dem Live-Betrieb weder Speicher noch CPU wegnimmt.
docker run -d --name "$PROBE" --network none --memory 1g --cpus 1 \
  -e POSTGRES_PASSWORD="$(od -An -N16 -tx1 /dev/urandom | tr -d ' \n')" "$IMG" > /dev/null
# Über TCP prüfen: der Initialisierungs-Server des Images lauscht nur am Socket
# und startet danach neu — "bereit" am Socket wäre zu früh.
i=0
until docker exec "$PROBE" pg_isready -h 127.0.0.1 -U postgres -q 2> /dev/null; do
  i=$((i + 1))
  [ "$i" -le 120 ] || { echo "FEHLER: Probe-DB startet nicht"; exit 1; }
  sleep 1
done
# Rollen zuerst (Richtlinien und Rechte verweisen auf sie). "postgres existiert
# bereits" ist erwartet und wird ignoriert.
docker exec -i "$PROBE" psql -X -q -U postgres -d postgres < "$BASE.roles.sql" > /dev/null 2>&1 || true
docker cp "$DUMP" "$PROBE:/tmp/probe.dump"
DBNAME=$(docker exec "$PROBE" pg_restore --list /tmp/probe.dump | sed -n 's/^;[[:space:]]*dbname:[[:space:]]*//p' | head -n 1)
T0=$(date +%s)
# Fehlermeldungen von pg_restore können Zeileninhalte zitieren ("COPY users, line 1:
# …") — sie gehen deshalb NICHT ins Workflow-Log, sondern in eine Datei, die nur
# root auf dem Server lesen kann.
if ! docker exec "$PROBE" pg_restore -U postgres -d postgres --create --exit-on-error /tmp/probe.dump 2> "$BASE.restore.err"; then
  FEHLERPROTOKOLL="backups/wiederherstellung_fehler_$(date -u +%Y%m%dT%H%M%SZ).log"
  mv "$BASE.restore.err" "$FEHLERPROTOKOLL"
  echo "FEHLER: pg_restore ist gescheitert. Einzelheiten (enthalten evtl. Daten) nur auf dem Server: /root/UniqSuite/$FEHLERPROTOKOLL"
  exit 1
fi
DAUER=$(($(date +%s) - T0))
echo "   Datenbank \"$DBNAME\" in ${DAUER}s zurückgespielt, ohne Fehler"

echo "3) Zeilenzahlen vergleichen"
docker exec -i "$PROBE" psql -X -q -t -A -v ON_ERROR_STOP=1 -U postgres -d "$DBNAME" \
  < db/backup/zeilenzahlen.sql > "$BASE.probe"
if cmp -s "$BASE.counts" "$BASE.probe"; then
  ZEILEN=$(awk -F= '{ s += $NF } END { print s + 0 }' "$BASE.counts")
  echo "   gleich: $TABELLEN Tabellen, $ZEILEN Zeilen"
else
  echo "FEHLER: Abweichung zwischen Live-Snapshot (<) und Rückspielung (>):"
  diff "$BASE.counts" "$BASE.probe" | grep '^[<>]' | head -n 40 || true
  exit 1
fi

echo "4) Dateiarchiv prüfen"
TGZ=$(find backups -maxdepth 1 -name 'storage_nachweis_*.tgz' | sort | tail -n 1)
if [ -n "$TGZ" ]; then
  IM_ARCHIV=$(tar -tzf "$TGZ" | grep -vc '/$' || true)
  IM_VOLUME=$(cat "${TGZ%.tgz}.files")
  if [ "$IM_ARCHIV" = "$IM_VOLUME" ]; then
    echo "   gleich: $IM_VOLUME Dateien im Volume und im Archiv"
  else
    echo "FEHLER: Archiv enthält $IM_ARCHIV Dateien, Volume $IM_VOLUME"
    exit 1
  fi
else
  echo "   kein Dateiarchiv (Volume leer oder nicht eingebunden)"
fi

echo "ERGEBNIS: Sicherung vollständig zurückgespielt und geprüft (${DAUER}s)."
