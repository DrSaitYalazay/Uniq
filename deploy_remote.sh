#!/bin/bash
# ============================================================================
# UniqSuite — Deploy auf dem Server (wird von .github/workflows/deploy.yml per SSH
# gestartet: ssh cy 'bash /root/UniqSuite/deploy_remote.sh').
# Gleicher Ablauf wie ClaudeCWS, aber OHNE eigenen Caddy: TLS und Weiterleitung
# macht der Caddy von ClaudeCWS (Site-Block uniq.cyberwerk.online).
#
# V-4: Bis hierhin stand dieses Skript als "script:" einer Fremd-Action
# (appleboy/ssh-action) im Workflow. Diese Action lud zur Laufzeit ein
# ungeprüftes Programm nach und bekam dabei den root-SSH-Schlüssel des Servers.
# Jetzt liegt das Skript im Repository (prüfbar, versioniert) und wird über das
# OpenSSH des Runners ausgeführt.
# Reihenfolge ab V-4: Images aktualisieren -> SICHERUNG -> Caddyfile prüfen ->
# Migrationen -> Builds -> Neustart -> Caddy-Reload -> Gesundheitsprüfung.
# Der Job wird rot, wenn Build, Reload oder Gesundheitsprüfung scheitern.
# ============================================================================
cd /root/UniqSuite || exit 1
# Erster Deploy: .env mit eigenen Zufalls-Geheimnissen anlegen (siehe ersteinrichtung.sh).
[ -f .env ] || sh ./ersteinrichtung.sh || { echo "::error::ERSTEINRICHTUNG FEHLGESCHLAGEN"; exit 1; }
# V-4: .env enthält alle Geheimnisse (DB-Passwörter, JWT_SECRET) — nur root darf
# sie lesen. "Nachweis Betrieb" fand 644 (für jeden lesbar).
chmod 600 .env 2> /dev/null || true
# Externes Netz zum Caddy von ClaudeCWS (docker-compose.yml: web haengt daran).
# Fehlt es, scheitert "compose up" mit "network uniqsuite_edge ... could not be found".
docker network inspect uniqsuite_edge > /dev/null 2>&1 || docker network create uniqsuite_edge > /dev/null 2>&1 || true
# 0a) V-4: fertige Images (Postgres, Caddy) zuerst aktualisieren — damit die
#     Sicherung und die Prüfung der Caddyfile schon mit den Images laufen, die
#     danach in Betrieb gehen. Ohne diesen Schritt liefen sie für immer auf dem
#     Stand der Erstinstallation. Ein Fehlschlag ist nicht fatal.
docker compose pull --quiet db migrate backup || echo "::warning::Image-Aktualisierung fehlgeschlagen - bisherige Images laufen weiter"
# 0b) V-4: Sicherung VOR allen Migrationen. Die Schritte darunter löschen und
#     schreiben Katalogdaten in der Live-DB (3k: DELETE + Neuaufbau). Ohne diese
#     Sicherung gäbe es nach einem Fehler keinen Weg zurück. Schlägt sie fehl,
#     wird NICHTS migriert und der Deploy endet rot. Die letzten 10 Sicherungen
#     bleiben in ./backups (cy_predeploy_*).
mkdir -p backups && chmod 700 backups
if ! docker compose run --rm --no-deps -T backup once predeploy < /dev/null; then
  echo "::error::SICHERUNG FEHLGESCHLAGEN - Deploy abgebrochen, es wurde nichts migriert."
  exit 1
fi
# 1) Katalog-Overrides einspielen (idempotent).
# 0) Schema-Tabellen nachziehen, die nach dem Erst-Init dazukamen (2026-09-11: 9 Tabellen fehlten in Prod)
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=0 < db/seeds/_ensure_schema_tables.sql || true
docker compose exec -T db psql -U postgres -d cy < db/seeds/overrides.sql || true
# 2) Nach-Init hinzugekommene Tabellen idempotent sicherstellen (schema.sql
#    läuft nur beim ersten DB-Boot) — behebt u.a. „Fristen konnten nicht
#    geladen werden" (compliance_deadlines fehlte auf bestehender DB).
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=0 < db/seeds/_ensure_runtime_tables.sql || true
# 3) v3.0-Laufzeit-Migrationen (Lizenz + Katalog-Gate + Sicherheits-Härtung
#    + CHG-04 Wipe) als Superuser anwenden. Gleicher Inhalt wie der
#    migrate-Service, hier explizit im Deploy — idempotent, ON_ERROR_STOP=0
#    damit ein bereits angewandtes Stück den Deploy nicht abbricht.
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=0 < db/runtime-ensure.sql || true
# 3b/3c) ENTFERNT am 2026-09-12: nis2_70_backbone.sql und
#     nis2_70_mapping.sql bauten den 70er-NIS2-Katalog (IDs a-01,
#     org-05, art21-27 …). Der wird durch den v6-Katalog (268 NIS2 /
#     318 ISO, Schritt 3k) ersetzt. Liefe das Rückgrat weiter, stünden
#     beide Kataloge nebeneinander in `controls` und die Zählungen in
#     Dashboard/SoA/Berichten wären doppelt.
# 3d) KI-Kontrollen (AIACT/ISO42001/NIST) — systemische Korrektur:
#     iso_ids-Neuvergabe + req_en + sachfremde R-Risiken entfernt (Fable-Audit).
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/ai_controls_fix.sql || true
# 3e) 115 neue KI-Kontrollen (Lücken: Art.50-Transparenz, ISO42001-Risiko-Kern/A.7, Security)
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/ai_new_controls.sql || true
# 3f) hochwertige KI-Risikotexte (Fable, je Kontrolle einzeln)
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/ai_risk_texts.sql || true
# 3f2) KI_SEC: die beiden unerreichbaren KI-Overlays (ISO27001_AI 35 +
#      BSI_AI 25) einzeln geprueft -> 45 doppelten den Basiskatalog und
#      entfallen, 15 mit KI-eigenem Gegenstand wandern in einen ehrlich
#      benannten Haertungskatalog. 0 Antworten betroffen (13.09.2026).
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/ki_sec_consolidation.sql || true
# 3f3) AIACT: alle 124 Kontrollen hatten muss=NULL, 75 ohne Fundstelle.
#      Regel aus dem NIS2-Katalog gemessen: binding R -> muss true,
#      H -> false. Ohne das konnte 'Kritische Luecken' fuer den AI Act
#      nie etwas anzeigen, auch nicht die Verbote des Art. 5.
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/aiact_muss_legalref.sql || true
# 3f4) ISO42001 (111) + NIST_AI_RMF (29): ebenfalls durchgaengig muss=NULL.
#      Massstab hier ist NICHT die NIS2-Regel, sondern der ISO-27001-Katalog:
#      Klauseln 4-10 sind Pflicht, Anhang-A-Kontrollen sind ueber die SoA
#      ausschliessbar. ISO 42001 hat dieselbe SoA-Mechanik (Kl. 6.1.3 d).
#      NIST AI RMF ist per Gesetz freiwillig -> dort gibt es keine Pflichtebene.
#      Dazu: 31 Prueffragen ohne jede Fundstelle bekommen eine, die
#      erfundene Angabe "42001 Amd. 1:2024" wird richtiggestellt (existiert
#      nicht; die Klimapruefung steht schon in der Erstausgabe 2023-12),
#      und drei NIST-Unterkategorien werden auf die richtige Nummer gesetzt.
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/iso42001_nist_muss_anker.sql || true
# 3f5) ISO42001-Altbestand: 19 Kontrollen trugen ASCII-Umlaute, waren
#      Stichworte statt Prueffragen und mischten Deutsch und Englisch.
#      Beim Abgleich gegen den Normtext zeigten fuenf Kennungen auf die
#      falsche Stelle (6.1.4->6.1.2, 8.3->8.4, A.6.2->A.9.2,
#      A.9.2->A.10.3, A.10.2->A.6.2.6). Kennung bleibt, Fundstelle und
#      Text werden richtiggestellt, die Abweichung steht in id_hinweis.
#      Dazu drei OWASP-Fundstellen in Schraegstrich-Form (…/…:2025),
#      die der vorige Seed nicht traf.
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/iso42001_altbestand.sql || true
# 3f6) 20 KI-Kontrollen trugen ueberhaupt kein Risiko und tauchten damit in
#      der Risikoanalyse gar nicht auf — beantwortbar, aber nicht bewertbar.
#      Es ist exakt derselbe unfertige Altbestand wie in 3f5 plus AIACT-A-50.1.
#      22 Risiken (zwei Kontrollen haben zwei verschiedene Fehlerwege),
#      ohne den Baustein "Risiko bei Nichterfuellung:", den 130 der 286
#      vorhandenen KI-Risiken tragen. stufe/typ bleiben NULL wie in allen
#      2788 Risiken der Datenbank.
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/ki_risiken_luecke.sql || true
# 3f7) REC-METRIC (MTTR) ist nach 3k verschoben — siehe 3k-2.
#      Grund: 3k loescht NIS2 und ISO 27001 komplett und legt sie neu
#      an. Jede Korrektur an diesen beiden Katalogen, die VOR 3k
#      laeuft, ist danach weg. Das galt fuer den MTTR-Seed an dieser
#      Stelle: er waere bei jedem Deploy sauber gelaufen und
#      unmittelbar danach ueberschrieben worden, ohne Fehlermeldung.
# 3g) CRA-Systemkorrektur (Fable-Audit): iso_ids Annex->sequenziell,
#     coverage, req_en (65), 6 inhaltliche req_de-Korrekturen.
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/cra_controls_fix.sql || true
# 3h) 17 neue CRA-Kontrollen (Risikobewertung, Supportzeitraum, DoC/CE,
#     Nutzerinfo Annex II, Komponenten-Sorgfalt, schwerer Vorfall Art.14).
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/cra_new_controls.sql || true
# 3i) hochwertige CRA-Risikotexte (Fable, de+en, 83 einzeln) statt Echo.
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/cra_risk_texts.sql || true
# 3j) ISO 27001: Annex-A-/Klausel-Referenz (meta.annex/title_de/title_en) + muss
#     (Klauseln 4–10 = 'true', Annex A = 'false') für alle 417 Prüffragen. Idempotent.
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/iso_meta_annex.sql || true
# 3k) Unified Control Catalogue v6: ersetzt NIS2 (70 -> 268) und
#     ISO 27001 (417 Prüffragen -> 318 Kontrollen) vollständig.
#     Sichert vorher Antworten, Risiko-Verknüpfungen, control_effect
#     und Knoten-Mitgliedschaften in v6_pre_*-Tabellen, überträgt die
#     ISO-Antworten über iso_qid_map_v6 (schwächstes Glied gewinnt)
#     und erzeugt risks/control_risk aus den Katalog-Risikotexten.
#     ON_ERROR_STOP=1 und ein DO-Block am Ende: stimmen die Zahlen
#     nicht, wird die gesamte Transaktion zurückgerollt.
#     KEIN "|| true" — ein Fehler hier MUSS den Deploy rot machen,
#     sonst liefe der alte Katalog weiter und niemand merkte es.
#     Codex-Pruefung Y9: `ON_ERROR_STOP=1` bricht nur psql ab. Das
#     ssh-action-Skript lief danach WEITER und der Job endete gruen —
#     eine gescheiterte Migration waere unbemerkt geblieben. Deshalb
#     hier explizit: Exitcode pruefen, Deploy hart beenden.
if ! docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/iso27001_nis2_v6_replace.sql; then
  echo "::error::MIGRATION FEHLGESCHLAGEN (iso27001_nis2_v6_replace.sql) - Deploy abgebrochen, Datenbank unveraendert (Transaktion zurueckgerollt)."
  exit 1
fi
# ---- ALLES AB HIER LAEUFT NACH 3k UND MUSS DAS AUCH ----------------
# 3k loescht NIS2 + ISO 27001 vollstaendig (DELETE FROM public.controls
# WHERE framework IN ('NIS2','ISO27001')) und legt sie aus dem
# v7-Katalog neu an; risks werden per ON CONFLICT DO UPDATE ebenfalls
# ueberschrieben. Korrekturen an diesen beiden Katalogen wirken darum
# NUR, wenn sie danach laufen. Vorher platziert waeren sie bei jedem
# Deploy still verloren — der Seed selbst meldet keinen Fehler.
#
# 3k-1) NIS2 (268) + ISO 27001 (318) auf Deutsch.
#     Befund vom 15.09.2026: von 4407 Kontrollen tragen 3821 deutschen
#     Text. Genau diese beiden Kataloge nicht — 3k schreibt denselben
#     englischen Satz in req_de UND req_en (586 von 586 Zeilen). Die
#     Oberflaeche druckt req_de im deutschen Modus woertlich aus, es
#     gibt keine Uebersetzungsschicht: deutsche Kunden lasen NIS2 und
#     ISO 27001 vollstaendig auf Englisch.
#     Quelle: die fertige deutsche Kontrollliste vom Schreibtisch
#     (268 IDs, deckungsgleich mit dem Live-Stand) + 94 eigens
#     uebersetzte ISO-Kontrollen. req_en bleibt unangetastet; das
#     Deutsche kommt unter eigenen meta-Schluesseln daneben.
#     Enthaelt ausserdem: <br>-Tags aus 89 Risikotexten entfernt (die
#     Oberflaeche rendert Risikotext als Text, der Nutzer sah das Tag),
#     meta.topic_label trug die Untergruppe statt des Themennamens,
#     und ISO-IP-USAGE nannte eine "Malware approval" in einer
#     Lizenzkontrolle (A.5.32).
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/nis2_iso_deutsch.sql || true
# 3k-2) REC-METRIC: Das Buch reserviert die Abkuerzung MTTR fuer
#     "mean time to remediate" und kuerzt die Wiederherstellungsgroesse
#     bewusst NICHT so ab (S. 201/207). Die Kontrollliste benutzte
#     dieselbe Abkuerzung fuenfmal fuer "Mean Time to Recovery". Beide
#     Werke werden zusammen verkauft — eine Abkuerzung, zwei
#     Bedeutungen, genau beim Messen. Inhalt bleibt, nur die Benennung
#     wird ausgeschrieben. Laeuft nach 3k-1, damit die Korrektur auch
#     den deutschen Titel trifft.
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/nis2_mttr_begriff.sql || true
# 3k-3) AI-Act-Kontrollkatalog nach dem SoA-Pruefbericht vom 02.10.2026:
#     4 neue Kontrollen (Art. 5(1)(e), 5(1)(ba), 5(1)(bb), Art. 26(7)/(11)),
#     Aufteilungen A-02.4 / E-05b / T-21b, 25 korrigierte Texte (DE+EN),
#     Geltungsbeginn (meta.applies_from, Art. 113 i. d. F. VO 2026/1744),
#     Rolle, Kennzeichnung interne Praxis/Vorgabe, Buch-Zuordnung,
#     A-50.1 als nicht bewertete Uebersicht, Delta-Risikotexte.
#     MUSS nach ai_controls_fix (3f…) laufen: der setzt bei jedem Deploy die
#     alten englischen Texte erneut. Idempotent; DO-Block prueft die 7 neuen IDs.
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/aiact_soa_pruefung_2026_10.sql || true
# Nur lesen, VOR dem Sperren: wurde das Demo-Konto je benutzt? (Ausgabe im Log)
docker compose exec -T db psql -U postgres -d cy < db/seeds/demo_konto_bericht.sql || true
# 3y) Sicherheitsbefund 03.10.2026: schema.sql legt ein Admin-Konto
#     demo@uniqsuite.com mit bekanntem Passwort an. Sperren (nichts geloescht).
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/demo_konto_sperren.sql || echo "::error::Demo-Konto konnte nicht gesperrt werden"
# Admin-MFA-Pflicht (schaltbar im Admin-Bereich, Standard AUS): Einstellungstabelle
# und has_role() mit aal-Pruefung. Idempotent; laesst einen gesetzten Wert stehen.
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 < db/seeds/admin_mfa_pflicht.sql || echo "::error::Admin-MFA-Seed fehlgeschlagen"
# 3z) UniqSuite: Plattform-Admin aus .env (ADMIN_EMAIL) — frische DB hat sonst keinen.
ADMIN_EMAIL=$(grep '^ADMIN_EMAIL=' .env 2> /dev/null | cut -d= -f2)
docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 -v admin_email="${ADMIN_EMAIL}" < db/seeds/uniqsuite_admin_bootstrap.sql || echo "::warning::Admin-Bootstrap fehlgeschlagen"
# Etiketten-Waechter: zeigt die Oberflaeche irgendwo einen INTERNEN
# CODE statt eines Gruppennamens? Dreimal ist genau das durchgerutscht
# ("C22", "BC-BIA", "ASSET-OFFSITE" + "Weitere Kontrollen"), weil eine
# Code->Name-Tabelle einen alten Schluesselraum kannte und der Fallback
# bei Nichttreffer den Code selbst ausgab. Der Waechter fuehrt die
# ECHTEN App-Funktionen ueber den VOLLSTAENDIGEN Katalog aus (4407
# Kontrollen, 17 Frameworks, beide Sprachen) und faellt durch, sobald
# es MEHR Fundstellen gibt als im dokumentierten Stand. Laeuft lokal
# vor dem Push (outputs/etikett_waechter.cjs) — hier steht nur der
# Hinweis, weil der Runner den Katalogexport nicht hat.
echo "--- Etiketten-Waechter: vor dem Push lokal laufen lassen ---"
echo "    node outputs/etikett_waechter.cjs   (Schwelle: etikett_waechter_schwelle.json)"
# Sanity: nach 3k-1 darf kein NIS2/ISO-Text mehr englisch sein.
echo "--- seed sanity: deutscher Katalogtext ---"
DE_SANITY=$(docker compose exec -T db psql -U postgres -d cy -tA -c "SELECT count(*) FROM public.controls WHERE framework IN ('NIS2','ISO27001') AND req_de = req_en" 2>/dev/null || echo "-1")
echo "NIS2+ISO mit req_de = req_en: $DE_SANITY (erwartet 0)"
if [ "${DE_SANITY:-1}" != "0" ]; then echo "::error::SEED SANITY: $DE_SANITY NIS2/ISO-Kontrollen tragen weiterhin englischen Text in req_de — nis2_iso_deutsch.sql hat nicht gegriffen (Reihenfolge gegenueber 3k pruefen)"; fi
# 4) Erst Platz schaffen (kleine VPS), dann bauen.
docker image prune -f || true
# Builds sind NICHT-fatal (|| true): schlägt ein Build fehl (z. B. OOM),
# bleibt das zuletzt funktionierende Image bestehen und der Container wird
# trotzdem gestartet — der Dienst darf durch einen Build-Fehler NIE
# ausfallen (Ursache des 502: api/worker-Rebuild+force-recreate hatte den
# api-Container gekillt; früher wurde bewusst nur web gebaut).
# Build-Fehler bleiben nicht-fatal, werden aber SICHTBAR (2026-09-10:
# Docker-Hub TLS-Timeout → web-Build still übersprungen, alte Version
# blieb tagelang live, Deploy zeigte trotzdem "Success").
# Fallback (2026-09-10): IONOS → registry-1.docker.io "TLS handshake
# timeout". BuildKit fragt IMMER den Hub nach Basis-Image-Metadaten,
# der Legacy-Builder (DOCKER_BUILDKIT=0) nutzt die lokal vorhandenen
# node:20-alpine / nginx:alpine ohne Netz → Build gelingt offline.
# Seed-Sanity: same-as-Netz muss mehrere Frameworks verbinden. 2026-09-11 war
# control_node_member in Produktion leer (FK-Fehler still verschluckt).
echo "--- seed sanity: control_node_member ---"
NODE_SANITY=$(docker compose exec -T db psql -U postgres -d cy -tA -c "SELECT count(*)||'|'||count(DISTINCT framework)||'|'||count(DISTINCT node_id) FROM public.control_node_member" 2>/dev/null || echo "0|0|0")
echo "members|frameworks|nodes = $NODE_SANITY"
NM=$(echo "$NODE_SANITY" | cut -d'|' -f1); NF=$(echo "$NODE_SANITY" | cut -d'|' -f2)
if [ "${NM:-0}" -lt 1000 ] || [ "${NF:-0}" -lt 5 ]; then echo "::error::SEED SANITY: control_node_member hat nur $NM Mitglieder / $NF Frameworks — same-as-Netz unvollständig (overrides.sql prüfen)"; fi
MISSING=$(docker compose exec -T db psql -U postgres -d cy -tA -c "SELECT string_agg(t, ', ') FROM unnest(ARRAY['evidence','answer_evidence','control_tests','control_test_results','quant_runs','quant_scenarios','control_effect','control_mapping','benchmark_stats','control_node','control_node_member','risks','control_risk','implementation_status','answers','org_tool_data','user_tool_data','compliance_deadlines','kpi_snapshots']) t WHERE to_regclass('public.'||t) IS NULL" 2>/dev/null || echo "?")
if [ -n "$MISSING" ] && [ "$MISSING" != "?" ]; then echo "::error::SCHEMA SANITY: fehlende Tabellen in Prod: $MISSING"; else echo "schema sanity: alle Kerntabellen vorhanden"; fi
# Netz-Diagnose im Log: Hub vs. AWS-Spiegel (je 8 s Timeout)
echo "--- registry reachability ---"
curl -sS -m 8 -o /dev/null -w "docker.io  HTTP %{http_code} in %{time_total}s\n" https://registry-1.docker.io/v2/ || echo "docker.io  UNREACHABLE"
curl -sS -m 8 -o /dev/null -w "ecr.aws    HTTP %{http_code} in %{time_total}s\n" https://public.ecr.aws/v2/ || echo "ecr.aws    UNREACHABLE"
WEB_BUILD=ok; API_BUILD=ok
docker compose build web || { echo "::warning::WEB BUILD (BuildKit) fehlgeschlagen — Fallback Legacy-Builder mit lokalen Basis-Images"; DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker compose build web || WEB_BUILD=FAILED; }
# V-4: api und worker haben denselben Build-Kontext (./api), aber ZWEI Images
# (uniqsuite-api, uniqsuite-worker). Bisher wurde nur api gebaut — der worker
# (E-Mail-Versand, nodemailer) lief mit einem zwei Wochen alten Image weiter
# ("Nachweis Betrieb", 19.09.2026). Beide bauen; der zweite Build kommt aus dem Cache.
docker compose build api worker || { echo "::warning::API BUILD (BuildKit) fehlgeschlagen — Fallback Legacy-Builder"; DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker compose build api worker || API_BUILD=FAILED; }
# ALLE Dienste hochfahren: startet auch einen gefallenen api-Container
# (nutzt vorhandenes Image, falls der Build übersprungen/fehlgeschlagen ist).
docker compose up -d --remove-orphans
# Kein eigener Caddy: TLS/Weiterleitung kommt vom Caddy der ClaudeCWS-Installation.
RELOAD=entfaellt
# V-4: Gesundheitsprüfung von aussen über die echte Adresse (TLS, Caddy, nginx,
# API). Vorher konnte der Job grün sein, während die Seite nicht antwortete.
# Adresse aus PUBLIC_APP_URL (https://uniq.cyberwerk.online -> uniq.cyberwerk.online).
DOMAIN=$(grep '^PUBLIC_APP_URL=' .env 2> /dev/null | cut -d= -f2 | sed -e 's#^https\?://##' -e 's#/.*$##')
HEALTH=uebersprungen
if [ -n "$DOMAIN" ] && [ "${DOMAIN#:}" = "$DOMAIN" ]; then
  HEALTH=fehlgeschlagen
  for _ in 1 2 3 4 5 6 7 8 9 10 11 12; do
    if curl -fsS -o /dev/null --max-time 10 "https://$DOMAIN/health"; then HEALTH=ok; break; fi
    sleep 5
  done
  [ "$HEALTH" = ok ] || echo "::error::GESUNDHEITSPRUEFUNG FEHLGESCHLAGEN - https://$DOMAIN/health antwortet nicht"
fi
docker image prune -f || true
# Diagnose im Log: Container-Status + api-Logs, damit ein etwaiger
# api-Boot-Crash sichtbar ist statt als stummes 502 zu enden.
sleep 6
echo "--- docker compose ps ---"
docker compose ps || true
echo "--- api logs (letzte 40) ---"
docker compose logs api --tail=40 || true
# Zertifikat und Weiterleitung liegen beim Caddy von ClaudeCWS:
#   cd /root/ClaudeCWS && docker compose logs caddy --tail=400 | grep -i uniq
echo "--- ausgelieferte index.html ---"
docker compose exec -T web sh -c 'ls -l /usr/share/nginx/html/index.html; grep -o "index-[A-Za-z0-9_]*\.js" /usr/share/nginx/html/index.html | head -1' || true
if [ "$WEB_BUILD" != ok ]; then echo "::error::WEB BUILD FAILED — es läuft weiterhin die ALTE Web-Version! (Docker-Hub/Netz prüfen, dann Re-run)"; fi
if [ "$API_BUILD" != ok ]; then echo "::error::API BUILD FAILED — es läuft weiterhin die ALTE API-Version!"; fi
echo "Deploy tamam: $(date) | web=$WEB_BUILD api=$API_BUILD caddy-reload=$RELOAD health=$HEALTH"
[ "$WEB_BUILD" = ok ] && [ "$API_BUILD" = ok ] && [ "$HEALTH" != fehlgeschlagen ]
