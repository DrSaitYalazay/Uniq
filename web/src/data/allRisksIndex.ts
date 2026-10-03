/**
 * Flat, searchable index of every CatalogRisk available in the system —
 * union of `zokCatalog` (auto-routed from controlCatalog) and `zokSpecialtySeed`.
 *
 * Mirrors `allMeasuresIndex` and powers the RiskPicker UI so users can
 * search across the full library and add catalog risks to their register.
 */

import { zokCatalog } from "./zokCatalog";
import { zokSpecialtySeed } from "./zokSpecialtySeed";
import { getZok, type ZokId } from "./zielobjektkategorien";
import type { CatalogRisk } from "./controlCatalog";
import { controlMetadata } from "./controlMetadata";

export interface IndexedRisk {
  risk: CatalogRisk;
  /** Originating control ID (derived from risk id prefix, e.g. "a-01-r1" → "a-01"). */
  control_id: string;
  /** Capability/family the originating control belongs to (for grouping/filter). */
  capability_tag: string;
  /** ZOK ids this risk surfaces in. */
  zok_ids: (ZokId | "__isms__")[];
  zok_labels_de: string[];
  zok_labels_en: string[];
  /** Lower-cased haystack for fast text search. */
  haystack: string;
}

function deriveControlId(riskId: string): string {
  // "a-01-r1" → "a-01" ;  "isms-r5" → "isms"
  const m = riskId.match(/^(.*)-r\d+$/);
  return m ? m[1] : riskId;
}

function buildIndex(): IndexedRisk[] {
  const byId = new Map<string, IndexedRisk>();

  function ingest(zokKey: ZokId | "__isms__", risks: CatalogRisk[]) {
    const node = zokKey === "__isms__" ? null : getZok(zokKey);
    const label_de = zokKey === "__isms__" ? "ISMS (verbundweit)" : (node?.label_de ?? zokKey);
    const label_en = zokKey === "__isms__" ? "ISMS (organization-wide)" : (node?.label_en ?? zokKey);
    for (const r of risks) {
      const existing = byId.get(r.id);
      if (existing) {
        if (!existing.zok_ids.includes(zokKey)) {
          existing.zok_ids.push(zokKey);
          existing.zok_labels_de.push(label_de);
          existing.zok_labels_en.push(label_en);
          existing.haystack += " " + label_de.toLowerCase() + " " + label_en.toLowerCase();
        }
      } else {
        const control_id = deriveControlId(r.id);
        const capability_tag = controlMetadata[control_id]?.familyId ?? "general";
        byId.set(r.id, {
          risk: r,
          control_id,
          capability_tag,
          zok_ids: [zokKey],
          zok_labels_de: [label_de],
          zok_labels_en: [label_en],
          haystack: [
            r.id, control_id, capability_tag,
            r.title_de, r.title_en, r.description_de, r.description_en,
            r.threat_category, r.cia.join(" "),
            label_de, label_en,
          ].join(" ").toLowerCase(),
        });
      }
    }
  }

  for (const [key, entry] of Object.entries(zokCatalog)) {
    ingest(key as ZokId | "__isms__", entry.risks);
  }
  for (const [key, entry] of Object.entries(zokSpecialtySeed)) {
    if (entry?.risks) ingest(key as ZokId, entry.risks);
  }

  return [...byId.values()].sort((a, b) => a.risk.id.localeCompare(b.risk.id));
}

export const allRisksIndex: IndexedRisk[] = buildIndex();

export function getCatalogRiskById(id: string): IndexedRisk | undefined {
  return allRisksIndex.find(ir => ir.risk.id === id);
}

export interface RiskSearchOpts {
  query?: string;
  cia?: "C" | "I" | "A";
  threatCategory?: string;
  zokId?: ZokId | "__isms__";
  excludeIds?: Set<string>;
  limit?: number;
}

export function searchCatalogRisks(opts: RiskSearchOpts): IndexedRisk[] {
  const tokens = (opts.query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const out: IndexedRisk[] = [];
  for (const ir of allRisksIndex) {
    if (opts.excludeIds?.has(ir.risk.id)) continue;
    if (opts.cia && !ir.risk.cia.includes(opts.cia)) continue;
    if (opts.threatCategory && ir.risk.threat_category !== opts.threatCategory) continue;
    if (opts.zokId && !ir.zok_ids.includes(opts.zokId)) continue;
    if (tokens.length && !tokens.every(t => ir.haystack.includes(t))) continue;
    out.push(ir);
    if (opts.limit && out.length >= opts.limit) break;
  }
  return out;
}

export function getThreatCategories(): string[] {
  const set = new Set<string>();
  for (const ir of allRisksIndex) set.add(ir.risk.threat_category);
  return [...set].sort();
}
