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

# 5) Edge-Block in der Caddyfile von ClaudeCWS sicherstellen.
#    Dauerhaft gehört der Block in das ClaudeCWS-Repository; dieser Schritt sorgt nur dafür,
#    dass die Seite auch vor dem nächsten ClaudeCWS-Deploy erreichbar ist.
#    Die Datei ist in den Caddy-Container eingebunden: nur anhängen bzw. Inhalt zurückschreiben,
#    nie ersetzen (sonst sieht der Container die Änderung nicht).
if [ -f "$CWS/Caddyfile" ] && ! grep -q "^$HOST {" "$CWS/Caddyfile"; then
  cp "$CWS/Caddyfile" "$CWS/Caddyfile.vor-uniqsuite-www"
  {
    printf '\n# >>> uniqsuite-www BEGIN (%s) >>>\n' "$HOST"
    printf '# Quelle: Uniq-Repository website/deploy/edge-block.caddy - eingefügt von website/deploy/deploy_remote.sh\n'
    cat edge-block.caddy
    printf '# <<< uniqsuite-www END <<<\n'
  } >> "$CWS/Caddyfile"
  if (cd "$CWS" && docker compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile > /dev/null); then
    (cd "$CWS" && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile) \
      || echo "::error::CADDY RELOAD FEHLGESCHLAGEN - bisherige Konfiguration bleibt aktiv"
  else
    cat "$CWS/Caddyfile.vor-uniqsuite-www" > "$CWS/Caddyfile"
    echo "::error::EDGE-BLOCK UNGUELTIG - Caddyfile von ClaudeCWS wiederhergestellt"
    exit 1
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
echo "Website-Deploy: $(date) | aktiv=$(readlink site/current) | health=$HEALTH"
[ "$HEALTH" = ok ] || { echo "::error::GESUNDHEITSPRUEFUNG FEHLGESCHLAGEN (Zertifikat kann beim ersten Mal einige Minuten dauern)"; exit 1; }
