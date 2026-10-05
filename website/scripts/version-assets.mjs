// Hängt an jeden Verweis auf /img/, /docs/ und /og/ in den gebauten Dateien einen Inhalts-Hash an
// (z. B. /img/doc-wp-en-05.webp?v=3f9a1c2b). Ändert sich eine Datei, ändert sich ihre Adresse:
// Browser und Zwischenspeicher laden sie neu, statt bis zu einer Woche die alte Fassung zu zeigen.
// Versionierte Adressen liefert Caddy als "immutable" aus, unversionierte werden stets nachgeprüft.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const hashes = new Map();
const hashOf = (url) => {
  if (!hashes.has(url)) {
    const file = join(DIST, decodeURIComponent(url));
    hashes.set(url, existsSync(file) && statSync(file).isFile()
      ? createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10)
      : null);
  }
  return hashes.get(url);
};

const files = [];
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) walk(p);
  else if (/\.(html|css|js|xml|webmanifest)$/.test(p)) files.push(p);
});
walk(DIST);

// Pfad beginnt nach einem Anführungszeichen, Leerzeichen, Komma, "(" oder dem eigenen Host
const re = /(^|["'\s,(=]|https:\/\/uniqsuite\.cyberwerk\.online)(\/(?:img|docs|og)\/[A-Za-z0-9._\-/%]+\.[A-Za-z0-9]+)(?![?A-Za-z0-9])/g;
let changed = 0, refs = 0;
const missing = new Set();
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const out = src.replace(re, (m, pre, url) => {
    const h = hashOf(url);
    if (!h) { missing.add(url); return m; }
    refs++;
    return `${pre}${url}?v=${h}`;
  });
  if (out !== src) { writeFileSync(f, out); changed++; }
}
console.log(`✓ ${refs} Verweise in ${changed} Dateien versioniert (${hashes.size} Dateien gehasht)`);
if (missing.size) {
  console.error(`✗ Verweise auf fehlende Dateien:\n  ${[...missing].join('\n  ')}`);
  process.exit(1);
}
