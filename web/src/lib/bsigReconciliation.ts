/**
 * Reconciliation engine: compares the rendered `bsigSectors` data against
 * the canonical BGBl. source-of-truth (`bsigCanonicalSource`) and reports
 * structural drift (missing/extra/renamed sector, branche, einrichtungsart).
 *
 * Used by the UI to surface deviations from the official BGBl. wording
 * immediately and per-sector, so editors cannot silently introduce drift.
 */

import { anlage1Data, anlage2Data, type AnlageData, type Sektor } from "@/data/bsigSectors";
import {
  canonicalAnlage1, canonicalAnlage2,
  type CanonicalAnlage, type CanonicalSektor,
} from "@/data/bsigCanonicalSource";

export type DeviationSeverity = "error" | "warning";

export interface Deviation {
  severity: DeviationSeverity;
  scope: "anlage" | "sektor" | "branche" | "einrichtungsart";
  sektorNr?: string;
  brancheId?: string;
  einrichtungsartId?: string;
  messageDe: string;
  messageEn: string;
}

export interface SektorReconciliation {
  nr: string;
  ok: boolean;
  deviations: Deviation[];
}

export interface AnlageReconciliation {
  id: "anlage1" | "anlage2";
  expectedSectorCount: number;
  actualSectorCount: number;
  ok: boolean;
  deviations: Deviation[];
  perSektor: Record<string, SektorReconciliation>;
}

function reconcileSektor(rendered: Sektor | undefined, canonical: CanonicalSektor): SektorReconciliation {
  const deviations: Deviation[] = [];

  if (!rendered) {
    deviations.push({
      severity: "error", scope: "sektor", sektorNr: canonical.nr,
      messageDe: `Sektor ${canonical.nr} „${canonical.name}" fehlt`,
      messageEn: `Sector ${canonical.nr} "${canonical.name}" is missing`,
    });
    return { nr: canonical.nr, ok: false, deviations };
  }

  if (rendered.name.trim() !== canonical.name.trim()) {
    deviations.push({
      severity: "warning", scope: "sektor", sektorNr: canonical.nr,
      messageDe: `Sektorname weicht ab — erwartet „${canonical.name}", gerendert „${rendered.name}"`,
      messageEn: `Sector name deviates — expected "${canonical.name}", rendered "${rendered.name}"`,
    });
  }

  const renderedBrancheIds = new Set(rendered.branchen.map(b => b.id));
  const canonicalBrancheIds = new Set(canonical.branchen.map(b => b.id));

  // Missing branches
  canonical.branchen.forEach(cb => {
    if (!renderedBrancheIds.has(cb.id)) {
      deviations.push({
        severity: "error", scope: "branche", sektorNr: canonical.nr, brancheId: cb.id,
        messageDe: `Branche ${cb.id} „${cb.name}" fehlt`,
        messageEn: `Industry ${cb.id} "${cb.name}" is missing`,
      });
    }
  });

  // Extra branches
  rendered.branchen.forEach(rb => {
    if (!canonicalBrancheIds.has(rb.id)) {
      deviations.push({
        severity: "error", scope: "branche", sektorNr: canonical.nr, brancheId: rb.id,
        messageDe: `Branche ${rb.id} ist nicht in der BGBl.-Quelle vorgesehen`,
        messageEn: `Industry ${rb.id} is not present in the BGBl. source`,
      });
    }
  });

  // Per-branche einrichtungsart drift
  canonical.branchen.forEach(cb => {
    const rb = rendered.branchen.find(b => b.id === cb.id);
    if (!rb) return;

    if (rb.name.trim() !== cb.name.trim()) {
      deviations.push({
        severity: "warning", scope: "branche", sektorNr: canonical.nr, brancheId: cb.id,
        messageDe: `Branchenname ${cb.id} weicht ab — erwartet „${cb.name}", gerendert „${rb.name}"`,
        messageEn: `Industry name ${cb.id} deviates — expected "${cb.name}", rendered "${rb.name}"`,
      });
    }

    const renderedEaIds = new Set(rb.einrichtungsarten.map(e => e.id));
    const canonicalEaIds = new Set(cb.einrichtungsartIds);

    cb.einrichtungsartIds.forEach(eaId => {
      if (!renderedEaIds.has(eaId)) {
        deviations.push({
          severity: "error", scope: "einrichtungsart",
          sektorNr: canonical.nr, brancheId: cb.id, einrichtungsartId: eaId,
          messageDe: `Einrichtungsart ${eaId} fehlt`,
          messageEn: `Entity type ${eaId} is missing`,
        });
      }
    });

    rb.einrichtungsarten.forEach(ea => {
      if (!canonicalEaIds.has(ea.id)) {
        deviations.push({
          severity: "error", scope: "einrichtungsart",
          sektorNr: canonical.nr, brancheId: cb.id, einrichtungsartId: ea.id,
          messageDe: `Einrichtungsart ${ea.id} ist nicht in der BGBl.-Quelle vorgesehen`,
          messageEn: `Entity type ${ea.id} is not present in the BGBl. source`,
        });
      }
    });
  });

  return { nr: canonical.nr, ok: deviations.length === 0, deviations };
}

function reconcileAnlage(rendered: AnlageData, canonical: CanonicalAnlage): AnlageReconciliation {
  const deviations: Deviation[] = [];
  const perSektor: Record<string, SektorReconciliation> = {};

  if (rendered.sektoren.length !== canonical.expectedSectorCount) {
    deviations.push({
      severity: "error", scope: "anlage",
      messageDe: `Sektoranzahl weicht ab — erwartet ${canonical.expectedSectorCount}, gerendert ${rendered.sektoren.length}`,
      messageEn: `Sector count deviates — expected ${canonical.expectedSectorCount}, rendered ${rendered.sektoren.length}`,
    });
  }

  const renderedNrs = new Set(rendered.sektoren.map(s => s.nr));
  rendered.sektoren.forEach(s => {
    if (!canonical.sektoren.some(c => c.nr === s.nr)) {
      deviations.push({
        severity: "error", scope: "sektor", sektorNr: s.nr,
        messageDe: `Sektor ${s.nr} ist nicht in der BGBl.-Quelle vorgesehen`,
        messageEn: `Sector ${s.nr} is not present in the BGBl. source`,
      });
    }
  });

  canonical.sektoren.forEach(c => {
    const rendered_s = rendered.sektoren.find(s => s.nr === c.nr);
    const result = reconcileSektor(rendered_s, c);
    perSektor[c.nr] = result;
    if (!renderedNrs.has(c.nr)) {
      // missing-sector deviation already pushed inside reconcileSektor
    }
    deviations.push(...result.deviations);
  });

  return {
    id: canonical.id,
    expectedSectorCount: canonical.expectedSectorCount,
    actualSectorCount: rendered.sektoren.length,
    ok: deviations.length === 0,
    deviations,
    perSektor,
  };
}

export function reconcileAnlage1(): AnlageReconciliation {
  return reconcileAnlage(anlage1Data, canonicalAnlage1);
}

export function reconcileAnlage2(): AnlageReconciliation {
  return reconcileAnlage(anlage2Data, canonicalAnlage2);
}
