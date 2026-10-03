#!/bin/sh
# ============================================================================
# cy — SSH-Zugang des Runners zum Server vorbereiten (V-4)
#
# Ersetzt die Fremd-Actions appleboy/scp-action und appleboy/ssh-action. Beide
# erhielten den root-Schlüssel des Servers und luden zur Laufzeit Code nach, der
# durch kein Festnageln des Action-Commits gedeckt war (Docker-Image per Tag,
# Programm-Download ohne Prüfsumme). Jetzt: nur das OpenSSH des Runners.
#
# Eingaben (als Umgebungsvariablen, nie in Befehlszeilen):
#   SSH_HOST, SSH_USER, SSH_KEY   wie bisher (Repository-Secrets)
#   SSH_PORT                      optional, Standard 22
#   SSH_KNOWN_HOSTS               optional: Host-Schlüssel des Servers. Entweder
#                                 vollständige known_hosts-Zeilen oder nur
#                                 "Typ Schlüssel" (z. B. "ssh-ed25519 AAAA…") —
#                                 dann wird der Host davorgesetzt. Den Wert gibt
#                                 der Workflow "Nachweis Betrieb" aus. Fehlt er,
#                                 wird der Host-Schlüssel wie bisher NICHT geprüft
#                                 (Warnung im Log).
# Danach: "ssh -F ~/.ssh/cy_config cy …". (-F ausdrücklich, weil OpenSSH seine
# Standard-Konfiguration aus dem Heimatverzeichnis laut passwd liest, nicht aus $HOME.)
# ============================================================================
set -eu
umask 077
: "${SSH_HOST:?SSH_HOST fehlt}" "${SSH_USER:?SSH_USER fehlt}" "${SSH_KEY:?SSH_KEY fehlt}"
PORT="${SSH_PORT:-22}"
if [ "$PORT" = 22 ]; then HOSTNAME_IM_EINTRAG="$SSH_HOST"; else HOSTNAME_IM_EINTRAG="[$SSH_HOST]:$PORT"; fi

mkdir -p "$HOME/.ssh"
printf '%s\n' "$SSH_KEY" > "$HOME/.ssh/cy_deploy"

if [ -n "${SSH_KNOWN_HOSTS:-}" ]; then
  printf '%s\n' "$SSH_KNOWN_HOSTS" | while IFS= read -r zeile; do
    [ -n "$zeile" ] || continue
    case "$zeile" in
      ssh-* | ecdsa-* | sk-*) printf '%s %s\n' "$HOSTNAME_IM_EINTRAG" "$zeile" ;;
      *) printf '%s\n' "$zeile" ;;
    esac
  done > "$HOME/.ssh/cy_known_hosts"
  PRUEFUNG=yes
else
  : > "$HOME/.ssh/cy_known_hosts"
  PRUEFUNG=accept-new
  echo "::warning::Secret SSH_KNOWN_HOSTS fehlt - der Host-Schluessel des Servers wird nicht geprueft. Wert: Workflow 'Nachweis Betrieb', Abschnitt 'SSH-Host-Schluessel'."
fi

cat > "$HOME/.ssh/cy_config" << EOF
Host cy
  HostName $SSH_HOST
  User $SSH_USER
  Port $PORT
  IdentityFile $HOME/.ssh/cy_deploy
  IdentitiesOnly yes
  UserKnownHostsFile $HOME/.ssh/cy_known_hosts
  StrictHostKeyChecking $PRUEFUNG
  BatchMode yes
  ConnectTimeout 30
  ServerAliveInterval 30
  ServerAliveCountMax 20
EOF
echo "SSH vorbereitet (Host-Schluessel-Pruefung: $PRUEFUNG)"
