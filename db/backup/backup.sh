#!/bin/sh
# ============================================================================
# cy — Sicherung von Datenbank und hochgeladenen Dateien (V-4)
#
# Läuft im Dienst "backup" (docker-compose.yml, Image postgres:16-alpine):
#   backup.sh loop          täglich eine Sicherung (Standard des Dienstes)
#   backup.sh once TAG      genau eine Sicherung, z. B. TAG=predeploy (Deploy)
#   backup.sh nachweis      Sicherung + Zeilenzahlen aus DEMSELBEN Snapshot,
#                           Grundlage der Wiederherstellungsprobe (restore_test.sh)
#
# Pro Sicherung entstehen in /backups (auf dem Host: ./backups):
#   cy_<TAG>_<ZEIT>.dump        pg_dump, Custom-Format (Tabellen, RLS, Funktionen)
#   cy_<TAG>_<ZEIT>.roles.sql   Rollen OHNE Passwörter — nur nötig, wenn auf einen
#                               Server zurückgespielt wird, dessen DB nicht aus
#                               schema.sql initialisiert wurde
#   storage_<TAG>_<ZEIT>.tgz    hochgeladene Dateien (Volume storage_data)
#
# Eine Datei bekommt ihren endgültigen Namen erst, wenn sie geprüft ist
# (pg_restore --list liest das ganze Archiv). Eine abgebrochene Sicherung kann
# so nie mit einer gültigen verwechselt werden; Reste heißen *.part.
#
# Fehlerbehandlung bewusst ohne "set -e": in einer Funktion, die in einem
# if/|| aufgerufen wird, schaltet POSIX-sh "set -e" still ab. Jeder Schritt
# prüft daher selbst und bricht mit "|| return 1" ab.
# ============================================================================
set -u
umask 077

DIR="${BACKUP_DIR:-/backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"   # tägliche Sicherungen: Aufbewahrung in Tagen
KEEP_COUNT="${BACKUP_KEEP_COUNT:-10}" # predeploy u. a.: Anzahl der neuesten Sätze
# Obergrenze für JEDE Sicherung (DSGVO Art. 5 Abs. 1 lit. e): gelöschte
# personenbezogene Daten dürfen in Sicherungen nicht unbegrenzt weiterleben.
# Ohne diese Grenze hielten die predeploy-Sätze (nach Anzahl) bei seltenen
# Deploys Daten über Monate. Aufgeräumt wird nur nach einer erfolgreichen
# Sicherung — es bleibt also immer mindestens eine frische erhalten.
MAX_DAYS="${BACKUP_MAX_DAYS:-30}"
STORAGE="${BACKUP_STORAGE_DIR:-/data/storage}"
QUERY="${BACKUP_COUNT_QUERY:-/backup/zeilenzahlen.sql}"

log() { echo "[backup] $(date -u +%FT%TZ) $*"; }

# Dateien (Volume storage_data) sichern; zusätzlich ihre Anzahl festhalten.
dateien_sichern() {  # $1 = Präfix ohne Endung, z. B. /backups/storage_daily_2026...
  [ -d "$STORAGE" ] || return 0
  tar -czf "$1.tgz.part" -C "$(dirname "$STORAGE")" "$(basename "$STORAGE")" || return 1
  tar -tzf "$1.tgz.part" > /dev/null || return 1
  mv "$1.tgz.part" "$1.tgz" || return 1
  find "$STORAGE" -type f | wc -l | tr -d ' ' > "$1.files" || return 1
}

# Gemeinsamer Abschluss: Dump prüfen, Rollen sichern, umbenennen, Dateien sichern.
abschliessen() {  # $1 = TAG, $2 = ZEIT
  base="$DIR/cy_$1_$2"
  pg_restore --list "$base.dump.part" > /dev/null || { log "FEHLER: Dump unlesbar"; return 1; }
  pg_dumpall --roles-only --no-role-passwords > "$base.roles.sql.part" || return 1
  mv "$base.dump.part" "$base.dump" || return 1
  mv "$base.roles.sql.part" "$base.roles.sql" || return 1
  dateien_sichern "$DIR/storage_$1_$2" || { log "FEHLER: Dateisicherung"; return 1; }
  log "ok: $(basename "$base").dump ($(du -h "$base.dump" | cut -f1))"
}

# Die Sicherungen liegen auf derselben Platte wie die Datenbank. Läuft sie voll,
# bricht Postgres ab (PANIC). Deshalb vor jeder Sicherung: frei muss mindestens
# das Dreifache der grössten bisherigen Sicherung plus 1 GiB Reserve sein.
platz_pruefen() {
  frei_kb=$(df -Pk "$DIR" | awk 'NR == 2 { print $4 }')
  groesste_kb=$(find "$DIR" -maxdepth 1 -type f \( -name 'cy_*.dump' -o -name 'storage_*.tgz' \) \
                  -exec du -k {} \; 2>/dev/null | cut -f1 | sort -n | tail -n 1)
  noetig_kb=$(( ${groesste_kb:-0} * 3 + 1048576 ))
  if [ "${frei_kb:-0}" -lt "$noetig_kb" ]; then
    log "FEHLER: zu wenig Platz (frei ${frei_kb:-?} KiB, nötig $noetig_kb KiB) — keine Sicherung, um die Datenbank nicht zu gefährden"
    return 1
  fi
}

sichern() {  # $1 = TAG
  platz_pruefen || return 1
  ts=$(date -u +%Y%m%dT%H%M%SZ)
  pg_dump --format=custom --file="$DIR/cy_$1_$ts.dump.part" || { log "FEHLER: pg_dump"; return 1; }
  abschliessen "$1" "$ts"
}

# Dump und Zeilenzahlen aus EINEM Snapshot: die Transaktion exportiert ihren
# Snapshot, pg_dump übernimmt ihn (--snapshot) und danach wird in derselben
# Transaktion gezählt. Beide sehen exakt denselben Datenstand — die zurück-
# gespielte DB muss darum zeichengleich dieselben Zahlen liefern.
nachweis() {
  platz_pruefen || return 1
  ts=$(date -u +%Y%m%dT%H%M%SZ)
  base="$DIR/cy_nachweis_$ts"
  psql -X -q -t -A -v ON_ERROR_STOP=1 \
       -v dumpfile="$base.dump.part" -v zaehlung="$QUERY" \
       > "$base.counts.part" <<'SQL' || { log "FEHLER: Snapshot/Zählung"; return 1; }
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT pg_export_snapshot() AS snap \gset
\setenv CY_SNAPSHOT :snap
\setenv CY_DUMPFILE :dumpfile
\! pg_dump --format=custom --snapshot="$CY_SNAPSHOT" --file="$CY_DUMPFILE"
\i :zaehlung
COMMIT;
SQL
  [ -s "$base.counts.part" ] || { log "FEHLER: keine Zeilenzahlen"; return 1; }
  mv "$base.counts.part" "$base.counts" || return 1
  abschliessen nachweis "$ts"
}

# Tägliche Sätze nach Alter, alle anderen nach Anzahl ausdünnen.
aufraeumen() {
  find "$DIR" -maxdepth 1 -type f \( -name 'cy_daily_*' -o -name 'storage_daily_*' \) \
       -mtime +"$KEEP_DAYS" -exec rm -f {} \; 2>/dev/null
  find "$DIR" -maxdepth 1 -type f -name '*.part' -mmin +720 -exec rm -f {} \; 2>/dev/null
  find "$DIR" -maxdepth 1 -type f \( -name 'cy_*' -o -name 'storage_*' -o -name 'wiederherstellung_fehler_*' \) \
       ! -name '*.part' -mtime +"$MAX_DAYS" -exec rm -f {} \; 2>/dev/null
  for tag in $(for f in "$DIR"/cy_*_*.dump; do
                 [ -e "$f" ] || continue
                 b=${f##*/}; b=${b#cy_}; echo "${b%%_*}"
               done | sort -u); do
    case "$tag" in daily | nachweis) continue ;; esac
    # Zeitstempel im Namen sortieren lexikalisch = chronologisch; neueste zuerst.
    for f in "$DIR"/cy_"$tag"_*.dump; do [ -e "$f" ] && echo "${f##*/}"; done |
    sort -r | tail -n +"$((KEEP_COUNT + 1))" |
    while read -r alt; do
      ts=${alt#cy_"${tag}"_}; ts=${ts%.dump}
      rm -f "$DIR/cy_${tag}_${ts}".* "$DIR/storage_${tag}_${ts}".*
    done
  done
}

mkdir -p "$DIR" || exit 1
case "${1:-loop}" in
  once)
    sichern "${2:-manual}" || exit 1
    aufraeumen
    ;;
  nachweis)
    nachweis || exit 1
    ;;
  loop)
    log "Dienst gestartet: täglich, Aufbewahrung ${KEEP_DAYS} Tage, keine Sicherung älter als ${MAX_DAYS} Tage"
    while true; do
      if sichern daily; then aufraeumen; else log "FEHLER: tägliche Sicherung fehlgeschlagen"; fi
      sleep 86400
    done
    ;;
  *)
    echo "Aufruf: backup.sh loop | once TAG | nachweis" >&2
    exit 2
    ;;
esac
