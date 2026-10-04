/**
 * inventoryReport — Phase 2 (Services / Assets / Dependencies) report.
 * White-labelled; PDF (print), Word (.doc), Excel (.xlsx).
 */

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import { RT } from "./reportTheme";
import { getCompanyBrand } from "./companyBrand";
import { getReportBrandName } from "./reportBrand";
import {
  buildCoverHtml, buildKpiGrid, wrapHtmlDoc, esc,
  renderHtmlToPdf, renderHtmlToWord,
  rtDocFooter,
} from "./reportHtmlLayout";

export interface InvService {
  id: string;
  name: string;
  description: string | null;
  category: string;
  criticality: number;
  owner: string | null;
  rto_hours: number | null;
  rpo_hours: number | null;
}
export interface InvAsset {
  id: string;
  service_id: string;
  asset_name: string;
  asset_type: string;
  owner: string | null;
  environment: string;
  data_sensitivity: string | null;
  external_exposure: boolean | null;
  vendor: string | null;
  instance_count: number;
  inherited_criticality: boolean;
}
export interface InvDependency {
  id: string;
  source_label: string;
  target_label: string;
  source_type: string;
  target_type: string;
  dependency_type: string;
  criticality: number;
  is_spof: boolean;
  supplier_country: string | null;
  notes: string | null;
}

export interface InventoryReportInput {
  services: InvService[];
  assets: InvAsset[];
  dependencies: InvDependency[];
  de: boolean;
  authorName?: string;
}

const CRIT_DE = ["–", "Niedrig", "Mittel", "Hoch", "Kritisch"];
const CRIT_EN = ["–", "Low", "Medium", "High", "Critical"];
const critLabel = (n: number, de: boolean) =>
  (de ? CRIT_DE : CRIT_EN)[Math.max(0, Math.min(4, n | 0))];
const critBadgeCls = (n: number) => n >= 4 ? "critical" : n === 3 ? "high" : n === 2 ? "medium" : "low";

function fmtDate(d: Date, de: boolean) {
  return de ? d.toLocaleDateString("de-DE") : d.toLocaleDateString("en-US");
}

function buildInventoryHtmlBody(inp: InventoryReportInput): string {
  const { services, assets, dependencies, de, authorName } = inp;
  const brand = getCompanyBrand();
  const companyName = brand.companyName || getReportBrandName(de ? "de" : "en");
  const dateStr = fmtDate(new Date(), de);

  const criticalServices = services.filter(s => s.criticality >= 3).length;
  const spofDeps = dependencies.filter(d => d.is_spof).length;

  const cover = buildCoverHtml({
    badge: "PHASE 2",
    title: de ? "Inventar & Abhängigkeiten" : "Inventory & Dependencies",
    subtitle: de
      ? "Services, Assets und Abhängigkeiten — Grundlage für Gap-Analyse und Risiko-Engine"
      : "Services, assets and dependencies — foundation for gap analysis and risk engine",
    companyName,
    authorName: authorName ?? "",
    dateStr,
  });

  const kpis = buildKpiGrid([
    { label: "Services", value: services.length, variant: "accent" },
    { label: "Assets", value: assets.length },
    { label: de ? "Abhängigkeiten" : "Dependencies", value: dependencies.length },
    { label: de ? "Kritisch" : "Critical", value: criticalServices, variant: "crit" },
  ]);

  const serviceRows = services.length === 0
    ? `<tr><td colspan="6" style="text-align:center;color:${RT.muted}">${esc(de ? "Keine Services erfasst." : "No services recorded.")}</td></tr>`
    : services.map(s => `<tr>
        <td style="font-weight:600;color:${RT.ink}">${esc(s.name)}</td>
        <td>${esc(s.category)}</td>
        <td><span class="rt-badge ${critBadgeCls(s.criticality)}">${esc(critLabel(s.criticality, de))}</span></td>
        <td>${esc(s.owner || "—")}</td>
        <td style="text-align:right">${s.rto_hours != null ? `${s.rto_hours} h` : "—"}</td>
        <td style="text-align:right">${s.rpo_hours != null ? `${s.rpo_hours} h` : "—"}</td>
      </tr>`).join("");
  const servicesTable = `<table><thead><tr>
      <th>${esc(de ? "Service" : "Service")}</th>
      <th>${esc(de ? "Kategorie" : "Category")}</th>
      <th>${esc(de ? "Kritikalität" : "Criticality")}</th>
      <th>${esc(de ? "Verantwortlich" : "Owner")}</th>
      <th style="text-align:right">RTO</th>
      <th style="text-align:right">RPO</th>
    </tr></thead><tbody>${serviceRows}</tbody></table>`;

  const svcNameById = new Map(services.map(s => [s.id, s.name]));
  const assetRows = assets.length === 0
    ? `<tr><td colspan="6" style="text-align:center;color:${RT.muted}">${esc(de ? "Keine Assets erfasst." : "No assets recorded.")}</td></tr>`
    : assets.map(a => `<tr>
        <td style="font-weight:600;color:${RT.ink}">${esc(a.asset_name)}</td>
        <td>${esc(a.asset_type)}</td>
        <td>${esc(svcNameById.get(a.service_id) || "—")}</td>
        <td>${esc(a.environment)}</td>
        <td>${esc(a.vendor || "—")}</td>
        <td style="text-align:right">${a.instance_count ?? 1}</td>
      </tr>`).join("");
  const assetsTable = `<table><thead><tr>
      <th>${esc(de ? "Asset" : "Asset")}</th>
      <th>${esc(de ? "Typ" : "Type")}</th>
      <th>Service</th>
      <th>${esc(de ? "Umgebung" : "Environment")}</th>
      <th>${esc(de ? "Lieferant" : "Vendor")}</th>
      <th style="text-align:right">${esc(de ? "Anzahl" : "Count")}</th>
    </tr></thead><tbody>${assetRows}</tbody></table>`;

  const depRows = dependencies.length === 0
    ? `<tr><td colspan="5" style="text-align:center;color:${RT.muted}">${esc(de ? "Keine Abhängigkeiten erfasst." : "No dependencies recorded.")}</td></tr>`
    : dependencies.map(d => `<tr>
        <td style="font-weight:600;color:${RT.ink}">${esc(d.source_label)}</td>
        <td style="text-align:center;color:${RT.muted}">→</td>
        <td style="font-weight:600;color:${RT.ink}">${esc(d.target_label)}</td>
        <td>${esc(d.dependency_type)}</td>
        <td>${d.is_spof ? `<span class="rt-badge critical">SPOF</span>` : "—"}</td>
      </tr>`).join("");
  const depsTable = `<table><thead><tr>
      <th>${esc(de ? "Quelle" : "Source")}</th>
      <th style="width:6%"></th>
      <th>${esc(de ? "Ziel" : "Target")}</th>
      <th>${esc(de ? "Typ" : "Type")}</th>
      <th>SPOF</th>
    </tr></thead><tbody>${depRows}</tbody></table>`;

  const spofNote = spofDeps > 0
    ? `<div class="rt-note"><strong>${esc(de ? "SPOF-Hinweis" : "SPOF notice")}:</strong>
        <p>${esc(de
          ? `Es wurden ${spofDeps} Single-Points-of-Failure erkannt. Diese sollten in Phase 4 (Risiko) priorisiert werden.`
          : `${spofDeps} single-points-of-failure detected. These should be prioritised in Phase 4 (Risk).`)}</p></div>`
    : "";

  return `${cover}
    <div class="rt-section">${kpis}</div>
    <div class="rt-section"><h2>${esc(de ? "Services" : "Services")}</h2>${servicesTable}</div>
    <div class="rt-section"><h2>Assets</h2>${assetsTable}</div>
    <div class="rt-section"><h2>${esc(de ? "Abhängigkeiten" : "Dependencies")}</h2>${depsTable}${spofNote}</div>
    ${rtDocFooter(companyName, de ? "de" : "en")}`;
}

function fileBase(de: boolean) {
  const brand = getCompanyBrand();
  const name = (brand.companyName || getReportBrandName(de ? "de" : "en"))
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "inventory";
  const ymd = new Date().toISOString().slice(0, 10);
  return `${name}-inventory-${ymd}`;
}

export async function exportInventoryReportPdf(inp: InventoryReportInput): Promise<void> {
  const body = buildInventoryHtmlBody(inp);
  const doc = wrapHtmlDoc({
    title: inp.de ? "Inventar & Abhängigkeiten" : "Inventory & Dependencies",
    lang: inp.de ? "de" : "en",
    body,
  });
  await renderHtmlToPdf(doc, fileBase(inp.de) + ".pdf");
}

export async function exportInventoryReportDocx(inp: InventoryReportInput): Promise<void> {
  const body = buildInventoryHtmlBody(inp);
  const doc = wrapHtmlDoc({
    title: inp.de ? "Inventar & Abhängigkeiten" : "Inventory & Dependencies",
    lang: inp.de ? "de" : "en",
    body,
  });
  await renderHtmlToWord(doc, fileBase(inp.de));
}

// ── Excel ────────────────────────────────────────────────────────────────
const NAVY = "FF1A2E41";
const HEADER_FONT: Partial<ExcelJS.Font> = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
const BORDER: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FFDBE3EF" } };
const ALL_BORDERS: Partial<ExcelJS.Borders> = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function styleHeader(row: ExcelJS.Row) {
  row.eachCell(c => {
    c.font = HEADER_FONT;
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    c.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    c.border = ALL_BORDERS;
  });
  row.height = 22;
}
function styleBody(ws: ExcelJS.Worksheet) {
  ws.eachRow((r, idx) => {
    if (idx === 1) return;
    r.eachCell(c => { c.border = ALL_BORDERS; c.font = { name: "Arial", size: 11 }; c.alignment = { vertical: "top", wrapText: true }; });
  });
}

export async function exportInventoryReportXlsx(inp: InventoryReportInput): Promise<void> {
  const { services, assets, dependencies, de } = inp;
  const brand = getCompanyBrand();
  const brandName = brand.companyName || getReportBrandName(de ? "de" : "en");
  const wb = new ExcelJS.Workbook();
  wb.creator = brandName;
  wb.created = new Date();

  // Summary
  const sum = wb.addWorksheet(de ? "Zusammenfassung" : "Summary");
  sum.columns = [
    { header: de ? "Kennzahl" : "Metric", key: "k", width: 40 },
    { header: de ? "Wert" : "Value", key: "v", width: 20 },
  ];
  styleHeader(sum.getRow(1));
  const criticalServices = services.filter(s => s.criticality >= 3).length;
  const spofDeps = dependencies.filter(d => d.is_spof).length;
  [
    [de ? "Firma" : "Company", brandName],
    [de ? "Erstellt am" : "Created", fmtDate(new Date(), de)],
    ["Services", services.length],
    ["Assets", assets.length],
    [de ? "Abhängigkeiten" : "Dependencies", dependencies.length],
    [de ? "Kritische Services (≥ Hoch)" : "Critical services (≥ High)", criticalServices],
    ["SPOF", spofDeps],
  ].forEach(([k, v]) => sum.addRow({ k, v }));
  styleBody(sum);

  // Services
  const sv = wb.addWorksheet("Services");
  sv.columns = [
    { header: "Service", key: "n", width: 34 },
    { header: de ? "Kategorie" : "Category", key: "c", width: 18 },
    { header: de ? "Kritikalität" : "Criticality", key: "k", width: 14 },
    { header: de ? "Verantwortlich" : "Owner", key: "o", width: 26 },
    { header: "RTO (h)", key: "rto", width: 10 },
    { header: "RPO (h)", key: "rpo", width: 10 },
    { header: de ? "Beschreibung" : "Description", key: "d", width: 50 },
  ];
  styleHeader(sv.getRow(1));
  services.forEach(s => sv.addRow({
    n: s.name, c: s.category, k: critLabel(s.criticality, de),
    o: s.owner || "", rto: s.rto_hours ?? "", rpo: s.rpo_hours ?? "", d: s.description || "",
  }));
  styleBody(sv);

  // Assets
  const svcNameById = new Map(services.map(s => [s.id, s.name]));
  const as = wb.addWorksheet("Assets");
  as.columns = [
    { header: "Asset", key: "n", width: 30 },
    { header: de ? "Typ" : "Type", key: "t", width: 16 },
    { header: "Service", key: "s", width: 26 },
    { header: de ? "Umgebung" : "Environment", key: "e", width: 16 },
    { header: de ? "Lieferant" : "Vendor", key: "v", width: 22 },
    { header: de ? "Anzahl" : "Count", key: "ic", width: 10 },
    { header: de ? "Externe Exponierung" : "External exposure", key: "ex", width: 18 },
    { header: de ? "Datenklasse" : "Data class", key: "ds", width: 18 },
    { header: de ? "Verantwortlich" : "Owner", key: "o", width: 24 },
  ];
  styleHeader(as.getRow(1));
  assets.forEach(a => as.addRow({
    n: a.asset_name, t: a.asset_type, s: svcNameById.get(a.service_id) || "",
    e: a.environment, v: a.vendor || "", ic: a.instance_count ?? 1,
    ex: a.external_exposure ? (de ? "Ja" : "Yes") : (de ? "Nein" : "No"),
    ds: a.data_sensitivity || "", o: a.owner || "",
  }));
  styleBody(as);

  // Dependencies
  const dep = wb.addWorksheet(de ? "Abhängigkeiten" : "Dependencies");
  dep.columns = [
    { header: de ? "Quelle" : "Source", key: "s", width: 32 },
    { header: de ? "Ziel" : "Target", key: "t", width: 32 },
    { header: de ? "Typ" : "Type", key: "dt", width: 16 },
    { header: "SPOF", key: "sp", width: 8 },
    { header: de ? "Land" : "Country", key: "co", width: 12 },
    { header: de ? "Notiz" : "Note", key: "n", width: 40 },
  ];
  styleHeader(dep.getRow(1));
  dependencies.forEach(d => dep.addRow({
    s: d.source_label, t: d.target_label, dt: d.dependency_type,
    sp: d.is_spof ? "SPOF" : "", co: d.supplier_country || "", n: d.notes || "",
  }));
  styleBody(dep);

  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileBase(de) + ".xlsx");
}
