/**
 * CSV import/export for the personnel registry (responsible persons).
 * Mirrors the conventions used by assetCsv: header row, auto-detect , or ;,
 * UTF-8 with BOM for Excel compatibility.
 */
import type { Person } from "./personnel";

export interface PersonnelCsvColumn {
  key: string;
  required: boolean;
  description: { de: string; en: string };
}

export const PERSONNEL_CSV_COLUMNS: PersonnelCsvColumn[] = [
  { key: "name",       required: true,  description: { de: "Vollständiger Name", en: "Full name" } },
  { key: "title",      required: true,  description: { de: "Titel / Rolle (z. B. CISO)", en: "Title / role (e.g. CISO)" } },
  { key: "department", required: false, description: { de: "Abteilung (optional)", en: "Department (optional)" } },
  { key: "email",      required: false, description: { de: "E-Mail für Frist-Erinnerungen (optional)", en: "E-mail for deadline reminders (optional)" } },
];

const newId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function escapeCsv(value: string): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",;\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function detectDelimiter(headerLine: string): "," | ";" {
  const semis = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semis > commas ? ";" : ",";
}

function parseCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = false; }
      } else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === delim) { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

export function personnelToCsv(people: Person[]): string {
  const header = PERSONNEL_CSV_COLUMNS.map(c => c.key).join(",");
  const rows = people.map(p =>
    [p.name, p.title, p.department ?? "", p.email ?? ""].map(escapeCsv).join(",")
  );
  return [header, ...rows].join("\r\n");
}

export interface PersonnelCsvParseResult {
  people: Person[];
  errors: string[];
  skipped: number;
}

export function parsePersonnelCsv(text: string): PersonnelCsvParseResult {
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { people: [], errors: ["Empty file"], skipped: 0 };

  const delim = detectDelimiter(lines[0]);
  const header = parseCsvLine(lines[0], delim).map(h => h.toLowerCase());
  const idx = (k: string) => header.indexOf(k);
  const iName = idx("name");
  const iTitle = idx("title");
  const iDept = idx("department");
  const iEmail = idx("email");

  const errors: string[] = [];
  if (iName < 0) errors.push("Missing required column: name");
  if (iTitle < 0) errors.push("Missing required column: title");
  if (errors.length) return { people: [], errors, skipped: 0 };

  const people: Person[] = [];
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i], delim);
    const name = (row[iName] ?? "").trim();
    const title = (row[iTitle] ?? "").trim();
    if (!name || !title) { skipped++; continue; }
    const email = iEmail >= 0 ? (row[iEmail] ?? "").trim() : "";
    const department = iDept >= 0 ? (row[iDept] ?? "").trim() : "";
    people.push({
      id: newId(),
      name,
      title,
      department: department || undefined,
      email: email || undefined,
    });
  }
  return { people, errors: [], skipped };
}

function download(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPersonnelCsv(people: Person[], filename = "personnel.csv") {
  download(filename, personnelToCsv(people));
}

export function downloadPersonnelCsvTemplate(filename = "personnel-template.csv") {
  const header = PERSONNEL_CSV_COLUMNS.map(c => c.key).join(",");
  const sample = [
    ["Jane Doe", "CISO", "IT", "jane.doe@example.com"].map(escapeCsv).join(","),
    ["John Smith", "Data Protection Officer", "Legal", "john.smith@example.com"].map(escapeCsv).join(","),
  ];
  download(filename, [header, ...sample].join("\r\n"));
}
