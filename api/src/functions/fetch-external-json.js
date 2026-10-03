// ============================================================================
// REST-Import: holt EINE externe JSON-Ressource im Auftrag des angemeldeten
// Nutzers. Gewollte Funktion, heikle Stellung: der Aufruf geht nicht vom
// Browser des Kunden aus, sondern von unserem Server — und der steht INNERHALB
// des Docker-Netzes und der VPS. Was der Kunde von aussen nicht erreicht,
// erreicht dieser Handler sehr wohl. Genau das ist SSRF.
//
// ----------------------------------------------------------------------------
// V-2, 19.09.2026 — was die vorige Fassung durchliess (gemessen, nicht vermutet:
// outputs/szenario_ssrf.mjs, 9 Befunde):
//
//   1. Die Sperre war eine Zeichenketten-Regex auf dem Hostnamen. Ihr fehlte
//      172.16.0.0/12 — ausgerechnet der Bereich, aus dem Docker dem Host-
//      Gateway ueblicherweise 172.17.0.1 gibt.
//   2. IPv6 war vollstaendig offen: `new URL()` liefert den Hostnamen MIT
//      Klammern (`[::1]`), der Ausdruck `::1` traf also nie. fd00::/7 und
//      fe80::/10 standen ohnehin nicht drin.
//   3. Blosse Dienstnamen ohne Punkt gingen durch — `https://db:5432`,
//      `https://cy-api:3000`: im Docker-Netz die Datenbank und wir selbst.
//   4. Und der Punkt, der alles andere erledigte: `fetch()` folgt Weiter-
//      leitungen von selbst. Geprueft wurde nur die ERSTE URL. Ein Server des
//      Angreifers antwortet mit `302 Location: http://169.254.169.254/…` und
//      die gesamte Adresspruefung ist umgangen — einschliesslich „nur https".
//
// Die Lehre steckt in Nr. 4: eine Pruefung auf dem Namen prueft, was jemand
// GESAGT hat. Was zaehlt, ist, wohin die Verbindung wirklich geht. Deshalb:
//   · aufloesen und JEDE zurueckgegebene Adresse gegen die gesperrten Bereiche
//     halten (nicht nur die erste — ein Name darf mehrere haben);
//   · `redirect: 'manual'` und jeden Sprung erneut durch dieselbe Pruefung;
//   · beim Wechsel des Ursprungs die Anmeldekopfzeilen fallen lassen, sonst
//     verschenkt eine Weiterleitung den API-Schluessel des Kunden an Fremde.
//
// EHRLICH ZUM RESTRISIKO: zwischen unserer Aufloesung und dem Verbindungsaufbau
// liegt ein Moment, in dem ein Angreifer mit eigenem DNS und sehr kurzer TTL
// die Antwort wechseln kann (DNS-Rebinding). Ganz zu schliessen waere das nur,
// indem man die Verbindung an die geprueste IP bindet — das gibt `fetch()` in
// Node 20 ohne zusaetzliche Abhaengigkeit nicht her. Der Weg ueber Weiter-
// leitungen und der ueber blosse Namen sind zu; dieser eine bleibt offen und
// steht deshalb hier, statt unerwaehnt zu bleiben.
// ============================================================================
import dns from 'node:dns/promises';
import net from 'node:net';
import { requireUser, json } from './_shared.js';

const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 15_000;
const MAX_HOPS = 3;

// ── Gesperrte IPv4-Bereiche (CIDR) ─────────────────────────────────────────
// Bewusst grosszuegig gesperrt: alles, was nicht oeffentlich routbar ist. Ein
// zu weiter Filter kostet eine Fehlermeldung, ein zu enger kostet die Firma.
const V4_GESPERRT = [
  ['0.0.0.0', 8],         // „dieses Netz"
  ['10.0.0.0', 8],        // privat
  ['100.64.0.0', 10],     // Carrier-NAT
  ['127.0.0.0', 8],       // Loopback
  ['169.254.0.0', 16],    // link-local + Cloud-Metadatendienste
  ['172.16.0.0', 12],     // privat — hier liegt die Docker-Bridge
  ['192.0.0.0', 24],      // IETF-Protokollzuweisungen
  ['192.0.2.0', 24],      // Dokumentation
  ['192.168.0.0', 16],    // privat
  ['198.18.0.0', 15],     // Messzwecke
  ['198.51.100.0', 24],   // Dokumentation
  ['203.0.113.0', 24],    // Dokumentation
  ['224.0.0.0', 4],       // Multicast
  ['240.0.0.0', 4],       // reserviert (deckt 255.255.255.255 mit ab)
];

const v4ZuZahl = (ip) => ip.split('.').reduce((n, o) => ((n << 8) | Number(o)) >>> 0, 0) >>> 0;

function v4Gesperrt(ip) {
  const n = v4ZuZahl(ip);
  return V4_GESPERRT.some(([netz, bits]) => {
    const maske = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (n & maske) >>> 0 === (v4ZuZahl(netz) & maske) >>> 0;
  });
}

/** IPv6 in acht 16-Bit-Gruppen ausschreiben (`::` aufgeloest). */
function v6Gruppen(ip) {
  let rest = ip;
  let v4Schwanz = null;
  const m = rest.match(/:((?:\d{1,3}\.){3}\d{1,3})$/);   // ::ffff:127.0.0.1
  if (m) { v4Schwanz = m[1]; rest = rest.slice(0, -m[1].length) + '0:0'; }
  const [links, rechts] = rest.split('::');
  const l = links ? links.split(':').filter(Boolean) : [];
  const r = rechts !== undefined ? (rechts ? rechts.split(':').filter(Boolean) : []) : null;
  let teile;
  if (r === null) teile = l;
  else teile = [...l, ...Array(Math.max(0, 8 - l.length - r.length)).fill('0'), ...r];
  const gruppen = teile.map((h) => parseInt(h, 16) & 0xffff);
  while (gruppen.length < 8) gruppen.push(0);
  if (v4Schwanz) {
    const n = v4ZuZahl(v4Schwanz);
    gruppen[6] = (n >>> 16) & 0xffff;
    gruppen[7] = n & 0xffff;
  }
  return gruppen.slice(0, 8);
}

function v6Gesperrt(ip) {
  const g = v6Gruppen(ip.toLowerCase());
  const erstes = g[0];
  // IPv4-abgebildet (::ffff:a.b.c.d) bzw. IPv4-kompatibel: die eingebettete
  // v4-Adresse entscheidet — sonst waere ::ffff:127.0.0.1 ein offenes Tor.
  if (g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xffff || g[5] === 0)) {
    const v4 = `${(g[6] >> 8) & 0xff}.${g[6] & 0xff}.${(g[7] >> 8) & 0xff}.${g[7] & 0xff}`;
    if (g.slice(0, 7).every((x) => x === 0) && g[7] <= 1) return true;   // :: und ::1
    return v4Gesperrt(v4);
  }
  if ((erstes & 0xfe00) === 0xfc00) return true;   // fc00::/7  ULA (privat)
  if ((erstes & 0xffc0) === 0xfe80) return true;   // fe80::/10 link-local
  if ((erstes & 0xff00) === 0xff00) return true;   // ff00::/8  Multicast
  return false;
}

const adresseGesperrt = (ip) =>
  net.isIPv4(ip) ? v4Gesperrt(ip) : net.isIPv6(ip) ? v6Gesperrt(ip) : true;

class ZielFehler extends Error {
  constructor(status, nachricht) { super(nachricht); this.status = status; }
}

/**
 * Prueft EIN Sprungziel vollstaendig: Protokoll, Aufloesung, Adressbereich.
 * Wird fuer jeden Sprung erneut aufgerufen — deshalb eine eigene Funktion und
 * kein Block im Ablauf: eine Pruefung, die nur an einer Stelle steht, wird
 * beim naechsten Sprung vergessen. Genau das war der Befund.
 */
async function pruefeZiel(u) {
  if (u.protocol !== 'https:') throw new ZielFehler(400, 'https only');
  const host = u.hostname.replace(/^\[|\]$/g, '');   // `new URL()` behaelt die Klammern
  if (!host) throw new ZielFehler(400, 'invalid url');

  let adressen;
  if (net.isIP(host)) {
    adressen = [host];
  } else {
    try {
      adressen = (await dns.lookup(host, { all: true, verbatim: true })).map((a) => a.address);
    } catch {
      // Ein Name, der sich nicht aufloesen laesst, wird nicht ausprobiert.
      throw new ZielFehler(400, 'host not resolvable');
    }
    // Namen ohne Punkt sind im Docker-Netz die Dienstnamen der Nachbarcontainer
    // (`db`, `cy-api`). Selbst wenn die Aufloesung eine oeffentliche Adresse
    // ergaebe: eine Ressource im oeffentlichen Internet hat einen FQDN.
    if (!host.includes('.')) throw new ZielFehler(400, 'private hosts not allowed');
  }
  if (!adressen.length) throw new ZielFehler(400, 'host not resolvable');
  // JEDE Adresse, nicht nur die erste: ein Name darf mehrere haben, und es
  // genuegt eine interne darunter.
  for (const a of adressen) {
    if (adresseGesperrt(a)) throw new ZielFehler(400, 'private hosts not allowed');
  }
}

const UMLEITUNGEN = new Set([301, 302, 303, 307, 308]);
// Kopfzeilen, die beim Wechsel des Ursprungs NICHT mitwandern duerfen: sonst
// liefert eine Weiterleitung den API-Schluessel des Kunden bei Fremden ab.
const NUR_GLEICHER_URSPRUNG = /^(authorization|cookie|proxy-authorization)$/i;

export default async function fetchExternalJson(req, res) {
  const claims = requireUser(req, res); if (!claims) return;
  const { url, headers } = req.body || {};
  let method = (req.body || {}).method || 'GET';
  if (typeof url !== 'string') return json(res, 400, { error: 'url required' });
  let ziel;
  try { ziel = new URL(url); } catch { return json(res, 400, { error: 'invalid url' }); }
  if (!['GET', 'POST'].includes(method)) return json(res, 400, { error: 'method not allowed' });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const outbound = { Accept: 'application/json' };
  if (headers && typeof headers === 'object') {
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === 'string' && !/^(host|content-length|connection)$/i.test(k)) outbound[k] = v;
    }
  }

  try {
    let resp;
    const startUrsprung = ziel.origin;
    for (let sprung = 0; ; sprung++) {
      await pruefeZiel(ziel);
      resp = await fetch(ziel.toString(), {
        method,
        headers: outbound,
        redirect: 'manual',      // der Kern der Korrektur
        signal: ctrl.signal,
      });
      if (!UMLEITUNGEN.has(resp.status)) break;
      const ort = resp.headers.get('location');
      if (!ort) break;
      if (sprung + 1 > MAX_HOPS) throw new ZielFehler(400, `too many redirects (>${MAX_HOPS})`);
      const vorher = ziel.origin;
      try { ziel = new URL(ort, ziel); } catch { throw new ZielFehler(400, 'invalid redirect target'); }
      if (ziel.origin !== vorher || ziel.origin !== startUrsprung) {
        for (const k of Object.keys(outbound)) if (NUR_GLEICHER_URSPRUNG.test(k)) delete outbound[k];
      }
      // Standardverhalten nachbilden: 303 (und 301/302 nach POST) wird GET.
      if (resp.status === 303 || (method === 'POST' && (resp.status === 301 || resp.status === 302))) {
        method = 'GET';
      }
    }

    clearTimeout(timer);
    const reader = resp.body?.getReader();
    if (!reader) return json(res, 502, { error: 'empty response body' });
    const chunks = []; let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) { reader.cancel(); return json(res, 413, { error: 'response too large (>5MB)' }); }
      chunks.push(value);
    }
    const text = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
    let parsedJson;
    try { parsedJson = JSON.parse(text); }
    catch { return json(res, 502, { error: 'upstream returned non-JSON', status: resp.status, body_preview: text.slice(0, 500) }); }
    return json(res, 200, { status: resp.status, data: parsedJson });
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof ZielFehler) return json(res, e.status, { error: e.message });
    // Kein Durchreichen des Netzwerk-Fehlertextes: „ECONNREFUSED 10.0.0.5:443"
    // gegen „Zeitueberschreitung" ist fuer einen Angreifer eine Landkarte des
    // internen Netzes, Antwort fuer Antwort. Details bleiben im Serverprotokoll.
    console.error('[fetch-external-json] upstream fehlgeschlagen:', e.message);
    return json(res, 502, { error: 'upstream fetch failed' });
  }
}
