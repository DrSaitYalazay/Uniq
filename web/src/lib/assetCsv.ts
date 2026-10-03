// Asset CSV import / template utilities
// Supports both `,` and `;` delimiters, quoted fields, BOM, and bilingual headers.

export const ASSET_TYPES = [
  "Application", "Server", "Database", "Cloud", "Network",
  "OT/ICS", "SCADA", "PLC", "Sensor", "Safety", "Machine",
  "External", "Endpoint", "Mobile Device", "IoT", "Security Tool",
  "Storage", "Printer", "Directory", "Process", "Document",
  "Supplier", "Critical Supplier",
] as const;
export const ENVIRONMENTS = ["On-prem", "Cloud", "Hybrid"] as const;
export const SENSITIVITIES = ["Public", "Normal", "Confidential", "Highly Confidential"] as const;

export interface CsvAssetRow {
  asset_name: string;
  asset_type: string;
  owner: string;
  vendor: string;
  environment: string;
  data_sensitivity: string;
  external_exposure: boolean;
  user_override_criticality: boolean | null;
  notes: string;
  instance_count: number;
}


export interface CsvImportResult {
  rows: CsvAssetRow[];
  errors: string[];
  warnings: string[];
}

// CSV column headers (canonical English keys, multilingual aliases recognised)
export const CSV_COLUMNS: { key: keyof CsvAssetRow; aliases: string[]; required: boolean; description: { de: string; en: string } }[] = [
  { key: "asset_name", required: true, aliases: ["asset_name", "name", "asset", "assetname", "bezeichnung"],
    description: { de: "Pflichtfeld. Eindeutiger Asset-Name.", en: "Required. Unique asset name." } },
  { key: "asset_type", required: false, aliases: ["asset_type", "type", "typ"],
    description: { de: `Erlaubt: ${ASSET_TYPES.join(", ")}`, en: `Allowed: ${ASSET_TYPES.join(", ")}` } },
  { key: "owner", required: false, aliases: ["owner", "besitzer", "verantwortlich"],
    description: { de: "Verantwortliche Person oder Team.", en: "Responsible person or team." } },
  { key: "vendor", required: false, aliases: ["vendor", "hersteller", "anbieter", "lieferant"],
    description: { de: "Hersteller / Lieferant.", en: "Vendor / supplier." } },
  { key: "environment", required: false, aliases: ["environment", "umgebung", "env"],
    description: { de: `Erlaubt: ${ENVIRONMENTS.join(", ")}`, en: `Allowed: ${ENVIRONMENTS.join(", ")}` } },
  { key: "data_sensitivity", required: false, aliases: ["data_sensitivity", "sensitivity", "sensitivitaet", "datenklassifizierung", "klassifizierung"],
    description: { de: `Erlaubt: ${SENSITIVITIES.join(", ")}`, en: `Allowed: ${SENSITIVITIES.join(", ")}` } },
  { key: "external_exposure", required: false, aliases: ["external_exposure", "exposed", "external", "extern", "internetzugang"],
    description: { de: "true / false – Asset aus dem Internet erreichbar?", en: "true / false – exposed to the internet?" } },
  { key: "user_override_criticality", required: false, aliases: ["criticality_override", "user_override_criticality", "kritikalitaet", "critical", "kritisch"],
    description: { de: "true = manuell kritisch, false = manuell nicht kritisch, leer = vom Dienst erben.", en: "true = mark critical, false = mark non-critical, empty = inherit from service." } },
  { key: "notes", required: false, aliases: ["notes", "notizen", "comment", "kommentar"],
    description: { de: "Freitext-Notizen.", en: "Free-text notes." } },
  { key: "instance_count", required: false, aliases: ["instance_count", "anzahl", "count", "instanzen", "stueckzahl"],
    description: { de: "Optional. Anzahl gleichartiger Instanzen (Standard: 1).", en: "Optional. Number of identical instances (default: 1)." } },

];

function detectDelimiter(headerLine: string): string {
  const semi = (headerLine.match(/;/g) || []).length;
  const comma = (headerLine.match(/,/g) || []).length;
  return semi > comma ? ";" : ",";
}

// Minimal RFC4180-ish parser: handles quoted fields containing the delimiter.
function parseCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQ = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') inQ = true;
      else if (ch === delim) { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function parseBool(v: string): boolean | null {
  const s = v.trim().toLowerCase();
  if (!s) return null;
  if (["true", "1", "yes", "ja", "y", "x"].includes(s)) return true;
  if (["false", "0", "no", "nein", "n"].includes(s)) return false;
  return null;
}

function matchEnum<T extends string>(v: string, allowed: readonly T[]): T | null {
  if (!v) return null;
  const lower = v.toLowerCase().trim();
  return (allowed.find(a => a.toLowerCase() === lower) as T | undefined) ?? null;
}

export function parseAssetCsv(text: string): CsvImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  // Strip UTF-8 BOM
  const clean = text.replace(/^\uFEFF/, "").trim();
  const lines = clean.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], errors: ["CSV must contain a header row and at least one data row."], warnings };
  }

  const delim = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delim).map(h => h.toLowerCase().replace(/^\uFEFF/, ""));

  // Map column key -> index
  const idx: Partial<Record<keyof CsvAssetRow, number>> = {};
  CSV_COLUMNS.forEach(col => {
    const found = headers.findIndex(h => col.aliases.includes(h));
    if (found >= 0) idx[col.key] = found;
  });

  if (idx.asset_name === undefined) {
    return { rows: [], errors: [`Required column 'asset_name' (or 'name') not found. Detected headers: ${headers.join(", ")}`], warnings };
  }

  const rows: CsvAssetRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delim);
    const get = (k: keyof CsvAssetRow) => (idx[k] !== undefined ? (cols[idx[k]!] ?? "") : "");

    const name = get("asset_name").trim();
    if (!name) { warnings.push(`Row ${i + 1}: empty asset_name skipped.`); continue; }

    const typeRaw = get("asset_type");
    const type = matchEnum(typeRaw, ASSET_TYPES) ?? "Application";
    if (typeRaw && !matchEnum(typeRaw, ASSET_TYPES)) warnings.push(`Row ${i + 1}: unknown asset_type "${typeRaw}" → defaulted to Application.`);

    const envRaw = get("environment");
    const env = matchEnum(envRaw, ENVIRONMENTS) ?? "On-prem";
    if (envRaw && !matchEnum(envRaw, ENVIRONMENTS)) warnings.push(`Row ${i + 1}: unknown environment "${envRaw}" → defaulted to On-prem.`);

    const sensRaw = get("data_sensitivity");
    const sens = matchEnum(sensRaw, SENSITIVITIES) ?? "Normal";
    if (sensRaw && !matchEnum(sensRaw, SENSITIVITIES)) warnings.push(`Row ${i + 1}: unknown data_sensitivity "${sensRaw}" → defaulted to Normal.`);

    const instRaw = get("instance_count").trim();
    let inst = 1;
    if (instRaw) {
      const n = parseInt(instRaw, 10);
      if (!isNaN(n) && n >= 1) inst = n;
      else warnings.push(`Row ${i + 1}: invalid instance_count "${instRaw}" → defaulted to 1.`);
    }

    rows.push({
      asset_name: name,
      asset_type: type,
      owner: get("owner").trim(),
      vendor: get("vendor").trim(),
      environment: env,
      data_sensitivity: sens,
      external_exposure: parseBool(get("external_exposure")) === true,
      user_override_criticality: parseBool(get("user_override_criticality")),
      notes: get("notes").trim(),
      instance_count: inst,
    });
  }

  return { rows, errors, warnings };
}

export function buildAssetCsvTemplate(): string {
  const headers = CSV_COLUMNS.map(c => c.key).join(",");
  const example = [
    `"CRM Production","Application","Anna Müller","Salesforce","Cloud","Confidential","true","true","Customer-facing CRM","1"`,
    `"PostgreSQL Cluster","Database","DBA Team","PostgreSQL","On-prem","Highly Confidential","false","","Primary OLTP database","3"`,
    `"Sales Laptops","Endpoint","IT Ops","Lenovo","On-prem","Normal","false","","Sales department fleet","45"`,
  ].join("\n");
  return `${headers}\n${example}\n`;
}

export function downloadCsvTemplate() {
  const blob = new Blob([buildAssetCsvTemplate()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "asset-inventory-template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
