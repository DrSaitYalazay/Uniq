// ============================================================================
// cy — Data gateway: JSON sorgu tarifini parametreli SQL'e çevirir.
// Frontend'deki hafif client (.from().select().eq()...) bu tarifi üretir;
// burada RLS altında (withClaims) güvenle çalıştırılır. PostgREST muadili.
// ============================================================================
import { withClaims } from '../db.js';

const IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// ----------------------------------------------------------------------------
// V-2: Die Operator-Allowlist ist eine MAP, kein Objektliteral.
// ----------------------------------------------------------------------------
// Vorher stand hier `const OPS = { eq: '=', ... }` und geprueft wurde mit
// `if (OPS[op])`. Ein Objektliteral erbt von Object.prototype, also lieferte
// `OPS['constructor']`, `OPS['toString']`, `OPS['valueOf']`,
// `OPS['hasOwnProperty']` und `OPS['__proto__']` jeweils einen wahrheitsgemaessen
// Wert — die Allowlist liess sie durch, und ihr Text landete UNGEPRUEFT im SQL:
//
//     SELECT * FROM public."controls" WHERE "id" function Object() { … } $1
//
// Ausnutzbar war das nicht: der eingesetzte Text ist der Quelltext einer
// JS-Standardfunktion, den ein Angreifer nicht bestimmt — die Anweisung wird
// zum Syntaxfehler. Aber der Schutz war Zufall, nicht Absicht. Eine Allowlist,
// die fuenf Schluessel durchlaesst, die niemand eingetragen hat, ist keine.
// `Map.has()` kennt nur, was wirklich eingetragen wurde — genau so, wie die
// RPC-Allowlist in rpc.js es mit einem Set schon richtig macht.
// Gemessen mit outputs/szenario_gateway_fuzz.mjs (9 FAIL vor dieser Aenderung).
const OPS = new Map([
  ['eq', '='], ['neq', '<>'], ['gt', '>'], ['gte', '>='], ['lt', '<'], ['lte', '<='],
  ['like', 'LIKE'], ['ilike', 'ILIKE'],
]);
const opSql = (op) => (typeof op === 'string' && OPS.has(op) ? OPS.get(op) : null);

// ----------------------------------------------------------------------------
// V-2: Serverseitige Mengenobergrenze.
// ----------------------------------------------------------------------------
// Ohne sie holt EIN Aufruf ohne `limit` den gesamten Bestand einer Tabelle in
// den Speicher der API. control_risk traegt rund 56.000 Zeilen; auf der kleinen
// VPS reicht ein solcher Aufruf, um den Dienst fuer ALLE Mandanten zu stoeren.
// Verfuegbarkeit ist in NIS2 ein Schutzziel wie Vertraulichkeit.
//
// Entscheidend ist, WIE gedeckelt wird: NICHT stillschweigend abschneiden.
// Dies ist ein Compliance-Werkzeug — eine stumm gekuerzte Ergebnismenge wuerde
// zu einer falschen Zahl im Bericht, und eine falsche Zahl ist schlimmer als
// eine abgelehnte Anfrage. Wer mehr will, blaettert (der Client tut das
// ueberall mit range(), Seitengroesse 1000).
const MAX_ROWS = Number(process.env.GATEWAY_MAX_ROWS || 10000);

function ident(name) {
  if (typeof name !== 'string' || !IDENT.test(name)) {
    throw httpErr(400, `Geçersiz tanımlayıcı: ${name}`);
  }
  return `"${name}"`;
}

function qualifiedTable(table) {
  // SICHERHEIT: nur das public-Schema ist ueber den Daten-Gateway erreichbar.
  // Ohne diese Grenze koennte ein authenticated-Client z. B. auth.users lesen
  // (bcrypt-Hashes/recovery_token) -> Konto-Uebernahme. Der App-Client nutzt
  // ausschliesslich public.*; auth/storage laufen ueber eigene Router.
  const parts = String(table).split('.');
  if (parts.length === 2) {
    if (parts[0] !== 'public') {
      throw new Error(`gateway: nur das public-Schema ist erlaubt (angefragt: ${parts[0]})`);
    }
    return `public.${ident(parts[1])}`;
  }
  return `public.${ident(table)}`;
}

function selectList(columns) {
  if (!columns || columns === '*') return '*';
  // "a, b, c" — her biri tanımlayıcı olmalı (embed/nested desteklenmez)
  return String(columns)
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      // "alias:col" veya "col" biçimini destekle
      const [a, b] = c.split(':').map((x) => x.trim());
      if (b) return `${ident(b)} AS ${ident(a)}`;
      return ident(a);
    })
    .join(', ');
}

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// WHERE cümlesi kur; params dizisine ekler
function buildWhere(filters, or, params) {
  const clauses = [];
  for (const f of filters || []) {
    const { col, op, val } = f;
    // Der RUECKGABEWERT von ident() wird eingesetzt, nicht die rohe Eingabe.
    // Vorher stand hier `ident(col)` als blosse Pruefung und darunter `"${col}"`.
    // Das war korrekt, weil ident() bei allem Ungueltigen wirft — aber es haelt
    // nur so lange, wie niemand die Pruefung verschiebt oder lockert. Die
    // gereinigte Fassung zu benutzen macht den Schutz zur Eigenschaft des Codes
    // statt zu einer Eigenschaft der Reihenfolge seiner Zeilen.
    const spalte = ident(col);
    if (op === 'is') {
      const v = val === null ? 'NULL' : val === true ? 'TRUE' : val === false ? 'FALSE' : null;
      if (v === null) throw httpErr(400, `is filtresi null/true/false olmalı`);
      clauses.push(`${spalte} IS ${v}`);
    } else if (op === 'in') {
      params.push(val);
      clauses.push(`${spalte} = ANY($${params.length})`);
    } else {
      const sqlOp = opSql(op);
      if (!sqlOp) throw httpErr(400, `Desteklenmeyen operatör: ${op}`);
      params.push(val);
      clauses.push(`${spalte} ${sqlOp} $${params.length}`);
    }
  }
  // Ham "or" (col.op.val,col.op.val) — nadir; güvenli parse
  if (or) {
    const orParts = String(or).split(',').map((p) => {
      const [c, o, ...rest] = p.split('.');
      const v = rest.join('.');
      const spalte = ident(c);
      const sqlOp = opSql(o);
      if (!sqlOp) throw httpErr(400, `or içinde desteklenmeyen op: ${o}`);
      params.push(castOrValue(v));
      return `${spalte} ${sqlOp} $${params.length}`;
    });
    if (orParts.length) clauses.push('(' + orParts.join(' OR ') + ')');
  }
  return clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
}

function castOrValue(v) {
  if (v === 'null') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}

function orderClause(order) {
  if (!order || !order.length) return '';
  const parts = order.map((o) => {
    const spalte = ident(o.col);   // gereinigte Fassung einsetzen, nicht die rohe
    const dir = o.asc === false ? 'DESC' : 'ASC';
    const nulls = o.nullsFirst === true ? 'NULLS FIRST' : o.nullsFirst === false ? 'NULLS LAST' : '';
    return `${spalte} ${dir} ${nulls}`.trim();
  });
  return 'ORDER BY ' + parts.join(', ');
}

/**
 * Sorgu tarifini çalıştırır. Supabase yanıt şekli döner: { data, error, count }.
 */
export async function runQuery(descriptor, claims) {
  try {
    const data = await withClaims(claims, (client) => execDescriptor(descriptor, client));
    return data;
  } catch (err) {
    if (!err.status) console.error('[gateway] sorgu hatası:', err.message);
    return {
      data: null,
      count: null,
      error: { message: err.message, code: err.code || String(err.status || 500) },
    };
  }
}

async function execDescriptor(d, client) {
  const params = [];
  const table = qualifiedTable(d.table);
  const action = d.action || 'select';

  let sql;
  if (action === 'select') {
    const where = buildWhere(d.filters, d.or, params);
    const order = orderClause(d.order);
    let cols = selectList(d.columns);

    if (d.head && d.count) {
      sql = `SELECT count(*)::int AS __count FROM ${table} ${where}`;
      const r = await client.query(sql, params);
      return { data: null, count: r.rows[0]?.__count ?? 0, error: null };
    }

    if (d.count) cols = `${cols === '*' ? '*' : cols}, count(*) OVER()::int AS __count`;

    // ── Mengenobergrenze (siehe MAX_ROWS oben) ────────────────────────────
    // Ganzzahlen erzwingen: `typeof x === 'number'` laesst NaN, Infinity und
    // 1.5 durch. Die landeten als Parameter in LIMIT/OFFSET und quittierte
    // Postgres mit einem 500er — ein Client-Fehler, als Serverfehler getarnt.
    const ganz = (x) => Number.isInteger(x) && x >= 0;
    let angefordert = null;   // null = „alles", also ohne Wunschmenge
    let offset = null;
    if (d.rangeFrom !== undefined || d.rangeTo !== undefined) {
      if (!ganz(d.rangeFrom) || !ganz(d.rangeTo) || d.rangeTo < d.rangeFrom) {
        throw httpErr(400, 'rangeFrom/rangeTo müssen ganze Zahlen ≥ 0 mit rangeTo ≥ rangeFrom sein');
      }
      angefordert = d.rangeTo - d.rangeFrom + 1;
      offset = d.rangeFrom;
    } else if (d.limit !== undefined) {
      if (!ganz(d.limit)) throw httpErr(400, 'limit muss eine ganze Zahl ≥ 0 sein');
      angefordert = d.limit;
    }

    if (angefordert !== null && angefordert > MAX_ROWS) {
      throw httpErr(400,
        `Zu viele Zeilen auf einmal angefordert (${angefordert} > ${MAX_ROWS}). Bitte blättern.`);
    }

    // Ohne Wunschmenge: EINE Zeile mehr holen als erlaubt. Kommt sie zurueck,
    // gibt es mehr Daten als wir ausliefern duerfen — dann lieber eine klare
    // Absage als eine stumm gekuerzte Liste, aus der ein falscher Bericht wird.
    const grenze = angefordert === null ? MAX_ROWS + 1 : angefordert;
    params.push(grenze);
    let limitOffset = `LIMIT $${params.length}`;
    if (offset !== null) { params.push(offset); limitOffset += ` OFFSET $${params.length}`; }

    sql = `SELECT ${cols} FROM ${table} ${where} ${order} ${limitOffset}`;
    const r = await client.query(sql, params);

    if (angefordert === null && r.rows.length > MAX_ROWS) {
      throw httpErr(400,
        `Ergebnis überschreitet ${MAX_ROWS} Zeilen. Bitte mit range()/limit blättern — ` +
        `eine stillschweigend gekürzte Liste würde zu falschen Kennzahlen führen.`);
    }

    let count = null;
    if (d.count && r.rows.length) count = r.rows[0].__count;
    const rows = r.rows.map(({ __count, ...rest }) => rest);
    return finalizeRows(rows, d, count);
  }

  if (action === 'insert' || action === 'upsert') {
    const values = Array.isArray(d.values) ? d.values : [d.values];
    if (!values.length) throw httpErr(400, 'insert için değer yok');
    const cols = Object.keys(values[0]);
    const colsSql = cols.map(ident);   // gereinigte Fassung einsetzen, nicht die rohe
    const rowsSql = values.map((row) => {
      const ph = cols.map((c) => { params.push(row[c] ?? null); return `$${params.length}`; });
      return `(${ph.join(', ')})`;
    });
    let conflict = '';
    if (action === 'upsert') {
      const target = d.onConflict ? d.onConflict.split(',').map((c) => ident(c.trim())).join(', ') : '';
      const inConflict = (d.onConflict || '').split(',').map((s) => s.trim());
      const updates = cols
        .filter((c) => !inConflict.includes(c))
        .map((c) => `${ident(c)} = EXCLUDED.${ident(c)}`).join(', ');
      conflict = target
        ? `ON CONFLICT (${target}) DO ${updates ? 'UPDATE SET ' + updates : 'NOTHING'}`
        : 'ON CONFLICT DO NOTHING';
    }
    const returning = d.returning === false ? '' : `RETURNING ${selectList(d.columns)}`;
    sql = `INSERT INTO ${table} (${colsSql.join(', ')}) VALUES ${rowsSql.join(', ')} ${conflict} ${returning}`;
    const r = await client.query(sql, params);
    return finalizeRows(r.rows, d, null);
  }

  if (action === 'update') {
    const setCols = Object.keys(d.values || {});
    if (!setCols.length) throw httpErr(400, 'update için değer yok');
    const setSql = setCols.map((c) => {
      const spalte = ident(c);   // gereinigte Fassung einsetzen, nicht die rohe
      params.push(d.values[c] ?? null);
      return `${spalte} = $${params.length}`;
    }).join(', ');
    const where = buildWhere(d.filters, d.or, params);
    if (!where) throw httpErr(400, 'update WHERE olmadan reddedildi');
    const returning = d.returning === false ? '' : `RETURNING ${selectList(d.columns)}`;
    sql = `UPDATE ${table} SET ${setSql} ${where} ${returning}`;
    const r = await client.query(sql, params);
    return finalizeRows(r.rows, d, null);
  }

  if (action === 'delete') {
    const where = buildWhere(d.filters, d.or, params);
    if (!where) throw httpErr(400, 'delete WHERE olmadan reddedildi');
    const returning = d.returning === false ? '' : `RETURNING ${selectList(d.columns)}`;
    sql = `DELETE FROM ${table} ${where} ${returning}`;
    const r = await client.query(sql, params);
    return finalizeRows(r.rows, d, null);
  }

  throw httpErr(400, `Bilinmeyen action: ${action}`);
}

function finalizeRows(rows, d, count) {
  if (d.single) {
    if (rows.length !== 1) {
      return { data: null, count, error: { message: 'Tam olarak bir satır beklendi', code: 'PGRST116' } };
    }
    return { data: rows[0], count, error: null };
  }
  if (d.maybeSingle) {
    return { data: rows[0] ?? null, count, error: null };
  }
  return { data: rows, count, error: null };
}
