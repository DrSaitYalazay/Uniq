#!/bin/sh
# Neue Version aktivieren:  sh release.sh /tmp/uniqsuite-site.tgz
# Zurück zur vorherigen:    sh release.sh --rollback
set -eu
cd "$(dirname "$0")"
mkdir -p site/releases
if [ "${1:-}" = "--rollback" ]; then
  cur=$(readlink site/current 2>/dev/null || true)
  prev=$(ls -1 site/releases | sort | grep -v "^$(basename "$cur")\$" | tail -1)
  [ -n "$prev" ] || { echo "Keine vorherige Version vorhanden"; exit 1; }
  ln -sfn "releases/$prev" site/current.tmp && mv -T site/current.tmp site/current
  echo "Zurückgesetzt auf $prev"; exit 0
fi
pkg="${1:?Pfad zum Paket (.tgz) fehlt}"
ts=$(date -u +%Y%m%dT%H%M%SZ)
mkdir "site/releases/$ts"
tar -xzf "$pkg" --no-same-owner -C "site/releases/$ts"
[ -f "site/releases/$ts/de/index.html" ] || { echo "Paket unvollständig – abgebrochen"; rm -rf "site/releases/$ts"; exit 1; }
chmod -R a+rX,go-w "site/releases/$ts"
ln -sfn "releases/$ts" site/current.tmp && mv -T site/current.tmp site/current
# nur die letzten 5 Versionen behalten
ls -1 site/releases | sort | head -n -5 | while read -r old; do rm -rf "site/releases/$old"; done
echo "Aktiv: $ts"
