// Prüft den Build auf Dinge, die die strikte CSP brechen würden:
// Inline-Skripte (außer JSON-Daten), style-Attribute, on*-Handler, externe Quellen.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const files = [];
const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p); });
walk('dist');
let bad = 0;
for (const f of files) {
  const h = readFileSync(f, 'utf8');
  const problems = [];
  for (const m of h.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1];
    if (/type="application\/(ld\+)?json"/.test(attrs)) continue;
    if (/\ssrc=/.test(attrs) && !m[2].trim()) continue;
    problems.push('Inline-Skript');
  }
  if (/<[^>]+\sstyle=/.test(h)) problems.push('style-Attribut');
  if (/<[^>]+\son[a-z]+=/.test(h)) problems.push('on*-Handler');
  if (/<style[\s>]/.test(h)) problems.push('<style>-Block');
  if (/(src|href)="https?:\/\/(?!uniqsuite\.cyberwerk\.online|uniq\.cyberwerk\.online|cyberwerksuite\.com)/.test(h)) problems.push('externe Quelle');
  if (problems.length) { bad++; console.error(`✗ ${f}: ${[...new Set(problems)].join(', ')}`); }
}
console.log(bad ? `${bad} Datei(en) mit Problemen` : `✓ ${files.length} HTML-Dateien CSP-konform`);
process.exit(bad ? 1 : 0);
