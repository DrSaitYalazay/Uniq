// Dependency CSV import / export utilities
// Format: source_asset,target_asset,dependency_type,description

export const DEP_TYPES = ["technical", "data_flow", "network", "external_provider"] as const;

export interface CsvDepRow {
  source_asset: string;
  target_asset: string;
  dependency_type: string;
  description: string;
}

export interface DepCsvImportResult {
  rows: CsvDepRow[];
  errors: string[];
  warnings: string[];
}

export const DEP_CSV_COLUMNS: { key: keyof CsvDepRow; aliases: string[]; required: boolean; description: { de: string; en: string } }[] = [
  { key: "source_asset", required: true, aliases: ["source_asset", "source", "from", "quelle", "von"],
    description: { de: "Pflicht. Name des Quell-Assets (muss exakt mit einem Asset-Namen übereinstimmen).", en: "Required. Source asset name (must exactly match an existing asset)." } },
  { key: "target_asset", required: true, aliases: ["target_asset", "target", "to", "ziel", "nach"],
    description: { de: "Pflicht. Name des Ziel-Assets.", en: "Required. Target asset name." } },
  { key: "dependency_type", required: false, aliases: ["dependency_type", "type", "typ"],
    description: { de: `Erlaubt: ${DEP_TYPES.join(", ")}. Default: technical.`, en: `Allowed: ${DEP_TYPES.join(", ")}. Default: technical.` } },
  { key: "description", required: false, aliases: ["description", "beschreibung", "notes", "notizen"],
    description: { de: "Freitext-Beschreibung der Abhängigkeit.", en: "Free-text description of the dependency." } },
];

function detectDelimiter(headerLine: string): string {
  const semi = (headerLine.match(/;/g) || []).length;
  const comma = (headerLine.match(/,/g) || []).length;
  return semi > comma ? ";" : ",";
}

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

export function parseDependencyCsv(text: string): DepCsvImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const clean = text.replace(/^\uFEFF/, "").trim();
  const lines = clean.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], errors: ["CSV must contain a header row and at least one data row."], warnings };
  }

  const delim = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delim).map(h => h.toLowerCase().replace(/^\uFEFF/, ""));

  const idx: Partial<Record<keyof CsvDepRow, number>> = {};
  DEP_CSV_COLUMNS.forEach(col => {
    const found = headers.findIndex(h => col.aliases.includes(h));
    if (found >= 0) idx[col.key] = found;
  });

  if (idx.source_asset === undefined || idx.target_asset === undefined) {
    return { rows: [], errors: [`Required columns 'source_asset' and 'target_asset' not found. Detected headers: ${headers.join(", ")}`], warnings };
  }

  const rows: CsvDepRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delim);
    const get = (k: keyof CsvDepRow) => (idx[k] !== undefined ? (cols[idx[k]!] ?? "") : "");

    const src = get("source_asset").trim();
    const tgt = get("target_asset").trim();
    if (!src || !tgt) { warnings.push(`Row ${i + 1}: missing source or target, skipped.`); continue; }
    if (src === tgt) { warnings.push(`Row ${i + 1}: source equals target, skipped.`); continue; }

    const typeRaw = get("dependency_type").toLowerCase().trim();
    const type = (DEP_TYPES as readonly string[]).includes(typeRaw) ? typeRaw : "technical";
    if (typeRaw && !(DEP_TYPES as readonly string[]).includes(typeRaw)) {
      warnings.push(`Row ${i + 1}: unknown dependency_type "${typeRaw}" → defaulted to technical.`);
    }

    rows.push({
      source_asset: src,
      target_asset: tgt,
      dependency_type: type,
      description: get("description").trim(),
    });
  }

  return { rows, errors, warnings };
}

export function buildDependencyCsvTemplate(): string {
  const headers = DEP_CSV_COLUMNS.map(c => c.key).join(",");
  const example = [
    `"CRM Production","PostgreSQL Cluster","technical","CRM uses primary DB"`,
    `"CRM Production","Edge Firewall","network","Traffic via firewall"`,
    `"PostgreSQL Cluster","Backup Storage","data_flow","Nightly backups"`,
  ].join("\n");
  return `${headers}\n${example}\n`;
}

export function downloadDependencyCsvTemplate() {
  const blob = new Blob([buildDependencyCsvTemplate()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dependencies-template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportDependenciesAsCsv(
  deps: { source_asset_id: string; target_asset_id: string; dependency_type: string; description: string }[],
  assets: { id: string; asset_name: string }[],
) {
  const nameMap: Record<string, string> = {};
  assets.forEach(a => { nameMap[a.id] = a.asset_name; });

  const headers = DEP_CSV_COLUMNS.map(c => c.key).join(",");
  const escape = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
  const rows = deps.map(d =>
    [
      escape(nameMap[d.source_asset_id] || ""),
      escape(nameMap[d.target_asset_id] || ""),
      escape(d.dependency_type),
      escape(d.description || ""),
    ].join(",")
  );
  const csv = [headers, ...rows].join("\n") + "\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dependencies-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── Auto-suggestion engine ────────────────────────────
   Suggests typical dependencies based on asset types.
   Returns pairs (source, target, type, reason) that don't exist yet. */

interface SuggestionRule {
  sourceTypes: string[];
  targetTypes: string[];
  type: string;
  reason: { de: string; en: string };
}

const SUGGESTION_RULES: SuggestionRule[] = [
  // ── Technical (host/runs-on) ──────────────────────────
  { sourceTypes: ["Application"], targetTypes: ["Server"], type: "technical",
    reason: { de: "Anwendung läuft auf einem Server.", en: "Application runs on a server." } },
  { sourceTypes: ["Database"], targetTypes: ["Server"], type: "technical",
    reason: { de: "Datenbank läuft auf einem Server.", en: "Database runs on a server." } },
  { sourceTypes: ["Application", "Database", "Server"], targetTypes: ["Cloud"], type: "technical",
    reason: { de: "Komponente wird in der Cloud gehostet.", en: "Component is hosted in the cloud." } },

  // ── Data flow (information exchange) ─────────────────
  { sourceTypes: ["Application"], targetTypes: ["Database"], type: "data_flow",
    reason: { de: "Anwendung liest/schreibt Daten in die Datenbank.", en: "Application reads/writes data to the database." } },
  { sourceTypes: ["Application"], targetTypes: ["Application"], type: "data_flow",
    reason: { de: "Anwendungen tauschen Daten über APIs aus.", en: "Applications exchange data via APIs." } },
  { sourceTypes: ["IoT", "OT/ICS"], targetTypes: ["Application", "Database"], type: "data_flow",
    reason: { de: "Sensor-/OT-Daten fließen in Anwendungen.", en: "Sensor / OT data flows into applications." } },

  // ── Network (transport) ──────────────────────────────
  { sourceTypes: ["Application", "Server", "Database"], targetTypes: ["Network"], type: "network",
    reason: { de: "Komponente kommuniziert über das Netzwerk.", en: "Component communicates via network." } },
  { sourceTypes: ["IoT", "OT/ICS", "Endpoint", "Mobile Device"], targetTypes: ["Network"], type: "network",
    reason: { de: "Gerät über Netzwerk angebunden.", en: "Device connected via network." } },

  // ── Security monitoring (technical control) ──────────
  { sourceTypes: ["Application", "Server", "Database", "Cloud", "Endpoint"], targetTypes: ["Security Tool"], type: "technical",
    reason: { de: "Komponente wird durch Security Tool überwacht.", en: "Component is monitored by security tool." } },

  // ── Endpoints / mobile access ────────────────────────
  { sourceTypes: ["Endpoint", "Mobile Device"], targetTypes: ["Application"], type: "data_flow",
    reason: { de: "Endgerät greift auf Anwendung zu (Datenfluss).", en: "Endpoint accesses application (data flow)." } },

  // ── External providers ───────────────────────────────
  { sourceTypes: ["Application", "Cloud"], targetTypes: ["External"], type: "external_provider",
    reason: { de: "Komponente nutzt externe Dienste/APIs.", en: "Component consumes external services/APIs." } },
  { sourceTypes: ["External"], targetTypes: ["Application"], type: "external_provider",
    reason: { de: "Externer Anbieter liefert Daten an die Anwendung.", en: "External provider delivers data to the application." } },
];

export interface DependencySuggestion {
  source_asset_id: string;
  target_asset_id: string;
  dependency_type: string;
  reason: { de: string; en: string };
}

export function suggestDependencies(
  assets: { id: string; asset_name: string; asset_type: string; service_id: string }[],
  existingDeps: { source_asset_id: string; target_asset_id: string; dependency_type?: string }[],
): DependencySuggestion[] {
  // existing keyed by source|target|type so different types between same pair are still allowed
  const existing = new Set(existingDeps.map(d => `${d.source_asset_id}|${d.target_asset_id}|${d.dependency_type ?? "*"}`));
  const suggestions: DependencySuggestion[] = [];

  for (const rule of SUGGESTION_RULES) {
    const sources = assets.filter(a => rule.sourceTypes.includes(a.asset_type));
    const targets = assets.filter(a => rule.targetTypes.includes(a.asset_type));

    for (const s of sources) {
      // prefer same-service targets first
      const sameService = targets.filter(t => t.service_id === s.service_id && t.id !== s.id);
      const candidates = sameService.length > 0 ? sameService : targets.filter(t => t.id !== s.id);

      for (const t of candidates) {
        const key = `${s.id}|${t.id}|${rule.type}`;
        if (existing.has(key)) continue;
        suggestions.push({
          source_asset_id: s.id,
          target_asset_id: t.id,
          dependency_type: rule.type,
          reason: rule.reason,
        });
      }
    }
  }

  // dedupe by source|target|type so the same pair can appear with different types
  const seen = new Set<string>();
  return suggestions.filter(s => {
    const k = `${s.source_asset_id}|${s.target_asset_id}|${s.dependency_type}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
