#!/bin/bash
# ============================================================================
# UniqSuite Website – Deploy auf dem Server. Wird von .github/workflows/website.yml
# per SSH gestartet: ssh cy 'bash /root/UniqSuiteWeb/deploy_remote.sh'.
#
# Ablauf: Netz prüfen -> Konfiguration prüfen -> neue Version aktivieren ->
# Container starten -> Edge-Block bei ClaudeCWS sicherstellen -> Gesundheitsprüfung.
# Die App (uniq.cyberwerk.online, /root/UniqSuite) wird NICHT angefasst.
# ============================================================================
set -euo pipefail
cd /root/UniqSuiteWeb
chmod 700 /root/UniqSuiteWeb
IMAGE=public.ecr.aws/docker/library/caddy:2-alpine
CWS=/root/ClaudeCWS
HOST=uniqsuite.cyberwerk.online

# 1) Externes Netz zum Edge-Caddy (legt UniqSuite/ClaudeCWS sonst selbst an)
docker network inspect uniqsuite_edge > /dev/null 2>&1 || docker network create uniqsuite_edge > /dev/null

# 2) Caddy-Konfiguration des Website-Containers prüfen, BEVOR etwas umgestellt wird
docker pull -q "$IMAGE" > /dev/null || echo "::warning::Image-Aktualisierung fehlgeschlagen - vorhandenes Image wird genutzt"
if ! docker run --rm --network none \
     -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" \
     -v "$PWD/security-headers.caddy:/etc/caddy/security-headers.caddy:ro" \
     "$IMAGE" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile > /dev/null; then
  echo "::error::CADDYFILE DER WEBSITE UNGUELTIG - Deploy abgebrochen, die laufende Version bleibt aktiv."
  exit 1
fi

# 3) Neue Version aktivieren (atomarer Symlink-Wechsel, letzte 5 Versionen bleiben)
sh release.sh uniqsuite-site.tgz
rm -f uniqsuite-site.tgz

# 4) Container starten bzw. aktualisieren (Dateien sind eingebunden, kein Neubau nötig)
docker compose up -d --remove-orphans

# 5) Edge-Block in der Caddyfile von ClaudeCWS sicherstellen und wirksam machen.
#    Dauerhaft steht der Block im ClaudeCWS-Repository; fehlt er auf dem Server, wird er angehängt.
#    Wichtig: Die Caddyfile ist als EINZELDATEI in den Caddy-Container eingebunden. Ersetzt jemand
#    die Datei (z. B. tar beim ClaudeCWS-Deploy: neue Datei, neuer Inode), sieht der laufende
#    Container weiter den alten Inhalt, und "caddy reload" lädt diesen alten Inhalt.
#    Deshalb: mit der Host-Datei prüfen (frischer Container) und den laufenden Container nur
#    neu laden, wenn er dieselbe Datei sieht - sonst neu erstellen.
if [ -f "$CWS/Caddyfile" ]; then
  APPENDED=0
  if ! grep -q "^$HOST {" "$CWS/Caddyfile"; then
    cp "$CWS/Caddyfile" "$CWS/Caddyfile.vor-uniqsuite-www"
    {
      printf '\n# >>> uniqsuite-www BEGIN (%s) >>>\n' "$HOST"
      printf '# Quelle: Uniq-Repository website/deploy/edge-block.caddy - eingefügt von website/deploy/deploy_remote.sh\n'
      cat edge-block.caddy
      printf '# <<< uniqsuite-www END <<<\n'
    } >> "$CWS/Caddyfile"
    APPENDED=1
  fi
  if ! (cd "$CWS" && docker compose run --rm --no-deps -T --entrypoint caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile < /dev/null > /dev/null 2>&1); then
    if [ "$APPENDED" = 1 ]; then
      cat "$CWS/Caddyfile.vor-uniqsuite-www" > "$CWS/Caddyfile"
      echo "::error::EDGE-BLOCK UNGUELTIG - Caddyfile von ClaudeCWS wiederhergestellt"
    else
      echo "::error::CADDYFILE VON CLAUDECWS UNGUELTIG - nichts geaendert"
    fi
    exit 1
  fi
  if (cd "$CWS" && docker compose exec -T caddy cat /etc/caddy/Caddyfile) | cmp -s - "$CWS/Caddyfile"; then
    (cd "$CWS" && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile) \
      || echo "::error::CADDY RELOAD FEHLGESCHLAGEN - bisherige Konfiguration bleibt aktiv"
  else
    echo "::notice::Caddy-Container von ClaudeCWS sieht eine veraltete Caddyfile - Container wird neu erstellt"
    (cd "$CWS" && docker compose up -d --no-deps --force-recreate caddy)
  fi
fi

# 6) Gesundheitsprüfung von außen über die echte Adresse
HEALTH=fail
for i in $(seq 1 24); do
  if curl -fsS -o /dev/null --max-time 10 "https://$HOST/de/"; then HEALTH=ok; break; fi
  sleep 5
done
echo "--- Antwort-Header ---"
curl -sSI --max-time 10 "https://$HOST/de/" | grep -iE "^(HTTP|content-security|strict-transport|x-frame|referrer|permissions|cross-origin|server)" || true
if [ "$HEALTH" != ok ]; then
  # Diagnose: ohne sie bleibt unsichtbar, ob der Block geladen ist, der Container antwortet
  # oder die Zertifikatsausstellung (ACME) scheitert.
  echo "--- Diagnose: Edge-Block in der Datei ---"
  grep -n "^$HOST {" "$CWS/Caddyfile" || echo "FEHLT in $CWS/Caddyfile"
  echo "--- Diagnose: laufende Caddy-Konfiguration kennt $HOST? ---"
  (cd "$CWS" && docker compose exec -T caddy wget -qO- http://127.0.0.1:2019/config/ 2>/dev/null | grep -o "$HOST" | head -1) || echo "nein (oder Admin-API nicht erreichbar)"
  echo "--- Diagnose: Website-Container aus Sicht von Caddy ---"
  (cd "$CWS" && docker compose exec -T caddy wget -S -qO /dev/null http://uniqsuite-www:8080/de/ 2>&1 | head -3) || echo "nicht erreichbar"
  echo "--- Diagnose: Caddy-Meldungen zu Zertifikat/ACME (30 min) ---"
  (cd "$CWS" && docker compose logs caddy --since 30m 2>/dev/null | grep -iE "$HOST|acme|challenge|obtain|certificate|error" | tail -60) || true
  echo "--- Diagnose: Website-Container ---"
  docker compose ps || true
  docker compose logs www --tail=20 || true
fi
echo "Website-Deploy: $(date) | aktiv=$(readlink site/current) | health=$HEALTH"
[ "$HEALTH" = ok ] || { echo "::error::GESUNDHEITSPRUEFUNG FEHLGESCHLAGEN (Zertifikat kann beim ersten Mal einige Minuten dauern)"; exit 1; }
