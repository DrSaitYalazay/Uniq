/**
 * Flat, searchable index of every CatalogMeasure available in the system —
 * union of `zokCatalog` (auto-routed from controlCatalog) and `zokSpecialtySeed`
 * (domain-specific seeds for E-Mail, Webserver, etc.).
 *
 * Used by the MeasurePicker UI so users can search across the full library
 * and manually pin additional measures into their treatment plan.
 */

import { zokCatalog } from "./zokCatalog";
import { zokSpecialtySeed } from "./zokSpecialtySeed";
import { getZok, type ZokId } from "./zielobjektkategorien";
import type { CatalogMeasure } from "./controlCatalog";

export interface IndexedMeasure {
  measure: CatalogMeasure;
  /** ZOK ids this measure surfaces in (for explainability badges). */
  zok_ids: (ZokId | "__isms__")[];
  /** Localized labels of those ZOKs. */
  zok_labels_de: string[];
  zok_labels_en: string[];
  /** Lower-cased haystack for fast text search (id+title+desc+refs+ZOK labels). */
  haystack: string;
}

function buildIndex(): IndexedMeasure[] {
  const byId = new Map<string, IndexedMeasure>();

  function ingest(zokKey: ZokId | "__isms__", measures: CatalogMeasure[]) {
    const node = zokKey === "__isms__" ? null : getZok(zokKey);
    const label_de = zokKey === "__isms__" ? "ISMS (verbundweit)" : (node?.label_de ?? zokKey);
    const label_en = zokKey === "__isms__" ? "ISMS (organization-wide)" : (node?.label_en ?? zokKey);
    for (const m of measures) {
      const existing = byId.get(m.id);
      if (existing) {
        if (!existing.zok_ids.includes(zokKey)) {
          existing.zok_ids.push(zokKey);
          existing.zok_labels_de.push(label_de);
          existing.zok_labels_en.push(label_en);
          existing.haystack += " " + label_de.toLowerCase() + " " + label_en.toLowerCase();
        }
      } else {
        byId.set(m.id, {
          measure: m,
          zok_ids: [zokKey],
          zok_labels_de: [label_de],
          zok_labels_en: [label_en],
          haystack: [
            m.id, m.title_de, m.title_en, m.description_de, m.description_en,
            m.iso_ref ?? "", m.bsi_ref ?? "", m.priority, m.effort,
            label_de, label_en,
          ].join(" ").toLowerCase(),
        });
      }
    }
  }

  for (const [key, entry] of Object.entries(zokCatalog)) {
    ingest(key as ZokId | "__isms__", entry.measures);
  }
  for (const [key, entry] of Object.entries(zokSpecialtySeed)) {
    if (entry) ingest(key as ZokId, entry.measures);
  }

  return [...byId.values()].sort((a, b) => a.measure.id.localeCompare(b.measure.id));
}

export const allMeasuresIndex: IndexedMeasure[] = buildIndex();

export function getMeasureById(id: string): IndexedMeasure | undefined {
  return allMeasuresIndex.find(im => im.measure.id === id);
}

/**
 * Token-based search across id, titles, descriptions, references and ZOK labels.
 * Optionally filtered by priority, effort or ZOK.
 */
export interface MeasureSearchOpts {
  query?: string;
  priority?: "must" | "should" | "could";
  effort?: "low" | "medium" | "high";
  zokId?: ZokId | "__isms__";
  excludeIds?: Set<string>;
  limit?: number;
}

export function searchMeasures(opts: MeasureSearchOpts): IndexedMeasure[] {
  const tokens = (opts.query ?? "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const out: IndexedMeasure[] = [];
  for (const im of allMeasuresIndex) {
    if (opts.excludeIds?.has(im.measure.id)) continue;
    if (opts.priority && im.measure.priority !== opts.priority) continue;
    if (opts.effort && im.measure.effort !== opts.effort) continue;
    if (opts.zokId && !im.zok_ids.includes(opts.zokId)) continue;
    if (tokens.length && !tokens.every(t => im.haystack.includes(t))) continue;
    out.push(im);
    if (opts.limit && out.length >= opts.limit) break;
  }
  return out;
}
