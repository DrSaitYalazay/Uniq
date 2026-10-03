/**
 * implementationEngine — builds the two-block Umsetzung view.
 *
 * Block A "Gemeinsame Kontrollen": mapped controls (voll/teil/hub) from all
 * active frameworks, deduplicated by ISO ref. Status is shared across
 * frameworks that hit the same ISO control.
 *
 * Block B "Framework-spezifische Pflichten": delta controls per framework
 * (Meldepflichten, DPIA, Registrierung etc.). NOT deduplicated — NIS2 72h,
 * DORA 4h and GDPR 72h are legally distinct obligations.
 */
import type { FrameworkKey } from "@/contexts/FrameworkContext";

export interface RawControl {
  id: string;
  framework: string;
  req_de: string | null;
  req_en: string | null;
  effort_pt: number | null;
  meta: Record<string, unknown> | null;
}

export interface SharedTask {
  bundle_key: string;              // ISO ref, e.g. "A.5.15"
  title: string;                   // best req_de from a member control
  titleEn: string;
  frameworks: FrameworkKey[];      // active frameworks contributing to this bundle
  alsoIn: FrameworkKey[];          // other (non-active) frameworks that also map here
  memberControlIds: string[];      // control ids from all active frameworks
  effort_pt: number;               // max PT across members (upper bound)
}

export interface DeltaTask {
  bundle_key: string;              // "FRAMEWORK:CONTROL_ID"
  framework: FrameworkKey;
  control_id: string;
  title: string;
  titleEn: string;
  effort_pt: number;
  memberControlIds: string[];      // = [bundle_key]; so Gap↔Umsetzung overlay & SoA-exclusion work for delta controls too
  legalRef?: string;
  quelle?: string;
  trigger?: string;
  alsoIn?: FrameworkKey[];         // other frameworks mapping to same ISO ref (informational)
}


export interface UmsetzungView {
  shared: SharedTask[];
  deltaByFramework: Record<string, DeltaTask[]>;
  totalControls: number;
  totalPtBrutto: number;
  totalPtNetto: number;
}

/**
 * Zuordnungsziel einer Kontrolle: „diese Anforderung entspricht Kontrolle X".
 * Feldname historisch `iso_ids` (v7-Kontroll-IDs wie C41.6, D04-03), früher `iso`.
 *
 * NICHT gelesen wird `meta.iso_refs`. Das tragen nur ISO 27001 und NIS2, und es
 * enthält Klausel-/Annex-Referenzen („5.1", „A.8.8"), keine Kontroll-IDs. Ein
 * erster Anlauf am 17.09.2026 hängte es hier an, um die leeren „Gemeinsamen
 * Kontrollen" zu füllen — das Ergebnis war schlechter als das Problem: 503
 * Kontrollen fielen in 88 Bündel, das größte („A.8.8") verschmolz 22
 * verschiedene Anforderungen (D04-27 … D04-36) zu EINER Aufgabe mit dem Titel
 * einer davon. Eine Klausel ist keine Anforderung; viele Anforderungen zitieren
 * dieselbe Klausel. Die echte Gleichheit steht woanders — siehe
 * `gleicheKontrolleInMehrerenFrameworks`.
 */
function extractIsoRefs(meta: Record<string, unknown> | null): string[] {
  if (!meta) return [];
  const raw = (meta as any).iso_ids ?? (meta as any).iso;
  if (!raw) return [];
  const arr: string[] = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  return arr.map(s => String(s).trim()).filter(Boolean);
}

function isDelta(meta: Record<string, unknown> | null): boolean {
  const cov = meta ? String((meta as any).coverage ?? "").toLowerCase() : "";
  return cov === "delta";
}

export function buildUmsetzungView(
  controls: RawControl[],
  activeFrameworks: FrameworkKey[],
  allControls?: RawControl[],
): UmsetzungView {
  const activeSet = new Set(activeFrameworks.map(f => f.toUpperCase()));
  // Nicht bewertete Übersichtszeilen (meta.scored === false, z. B. AI Act A-50.1 über
  // T-09…T-43) sind keine eigene Aufgabe — sonst doppelt zur Umsetzung (SoA-Prüfbericht B-15).
  const applicable = controls.filter(c => activeSet.has(c.framework.toUpperCase()) && (c.meta as any)?.scored !== false);

  // Build cross-framework ISO ref index from the full corpus (falls back to
  // `controls` if the caller did not pass a wider set). Used to enrich rows
  // with "also required by <framework>" tags.
  const universe = allControls && allControls.length > 0 ? allControls : controls;
  const isoIndex = new Map<string, Set<string>>();
  for (const c of universe) {
    for (const ref of extractIsoRefs(c.meta)) {
      const s = isoIndex.get(ref) ?? new Set<string>();
      s.add(c.framework.toUpperCase());
      isoIndex.set(ref, s);
    }
  }

  // Welcher Bündelschlüssel wird von MEHREREN aktiven Frameworks getragen?
  //
  // Ohne diese Vorprüfung landete jede Kontrolle mit einer ISO-Referenz in
  // Block A — auch dann, wenn sie dort allein stand. Gemessen am 17.09.2026
  // mit ISO 27001 + NIS2 + DORA + BSI: alle 35 „gemeinsamen" Bündel enthielten
  // AUSSCHLIESSLICH DORA-Kontrollen, kein einziges hatte zwei Frameworks. Die
  // Überschrift des Blocks („Gleiche Anforderung in mehreren Frameworks = eine
  // Aufgabe") war damit für 35 von 35 Zeilen falsch.
  //
  // Schlimmer: die 35 Schlüssel sind selbst Kontrollen (C37.2, CHG-AUTH, …),
  // die in Block B nochmals als eigene Aufgabe standen. Dieselbe Anforderung
  // war zweimal auf dem Schirm, und die Summe stimmte nicht: 1662 Aufgaben
  // aus 1853 Kontrollen.
  //
  // Regel jetzt: ein Bündel ist nur dann „gemeinsam", wenn mindestens zwei
  // aktive Frameworks darin liegen. Alles andere bleibt eine framework-eigene
  // Aufgabe und wird in Block B gezeigt — einmal, an einer Stelle.
  //
  // Dieselbe Kontrolle in mehreren Frameworks — die eigentliche Gleichheit.
  // ISO 27001 und NIS2 führen 224 Kontrollen unter DERSELBEN ID; gemessen am
  // 17.09.2026 ist bei allen 224 der Anforderungstext wortgleich und keine
  // davon ist eine Delta-Pflicht. Es sind buchstäblich dieselben Sätze, zweimal
  // gespeichert. Bis dahin standen 224 Anforderungen doppelt auf dem Schirm —
  // einmal unter ISO 27001, einmal unter NIS2 — und „Gemeinsame Kontrollen"
  // zeigte 0. Trägt die eigene ID zwei aktive Frameworks, ist SIE der Schlüssel.
  const fwProId = new Map<string, Set<string>>();
  for (const c of applicable) {
    const s = fwProId.get(c.id) ?? new Set<string>();
    s.add(c.framework.toUpperCase());
    fwProId.set(c.id, s);
  }
  /** Bündelschlüssel: eigene ID, wenn geteilt — sonst das Zuordnungsziel. */
  const schluesselVon = (c: RawControl): string | undefined =>
    (fwProId.get(c.id)?.size ?? 0) >= 2 ? c.id : extractIsoRefs(c.meta)[0];

  const fwProSchluessel = new Map<string, Set<string>>();
  for (const c of applicable) {
    if (isDelta(c.meta)) continue;
    const primary = schluesselVon(c);
    if (!primary) continue;
    const s = fwProSchluessel.get(primary) ?? new Set<string>();
    s.add(c.framework.toUpperCase());
    fwProSchluessel.set(primary, s);
  }
  const istGemeinsam = (schluessel: string) => (fwProSchluessel.get(schluessel)?.size ?? 0) >= 2;

  const sharedMap = new Map<string, SharedTask>();
  const deltaByFramework: Record<string, DeltaTask[]> = {};
  let bruttoSum = 0;
  // Bündel, deren Titel bereits vom ISO-27001-Mitglied stammt (P6.4).
  const isoTitled = new Set<string>();
  const isIsoFw = (f: string) => f.toUpperCase() === "ISO27001";

  for (const c of applicable) {
    const ptRaw = Number(c.effort_pt ?? 0);
    const pt = Number.isFinite(ptRaw) ? ptRaw : 0; // String-Müll ⇒ 0 statt NaN in den Summen
    bruttoSum += pt;
    // WICHTIG: framework verbatim (DB-Code) verwenden — NICHT toUpperCase.
    // memberControlIds `${fw}:${id}` müssen exakt zum Compliance-Overlay-Key
    // (`${o.framework}:${id}`, ebenfalls DB-Code) passen, sonst greift „spätere
    // Phase gewinnt" z. B. bei MaRisk nie (MARISK ≠ MaRisk).
    const fw = c.framework as FrameworkKey;

    if (isDelta(c.meta)) {
      const key = `${fw}:${c.id}`;
      const meta = c.meta ?? {};
      const t: DeltaTask = {
        bundle_key: key,
        framework: fw,
        control_id: c.id,
        title: c.req_de ?? c.id,
        titleEn: c.req_en ?? c.req_de ?? c.id,
        effort_pt: pt,
        memberControlIds: [key],
        legalRef: (meta as any).ref ?? undefined,
        quelle: (meta as any).quelle ?? undefined,
        trigger: (meta as any).stufe ?? (meta as any).hinweis ?? undefined,
        alsoIn: [], // CWS: keine inaktiven "auch:"-Frameworks
      };

      (deltaByFramework[fw] ??= []).push(t);
      continue;
    }

    // Mapped: dedupe by primary ISO ref (first one wins for grouping).
    // Ein Schlüssel, den nur EIN aktives Framework trägt, ist kein gemeinsames
    // Bündel — er wird wie eine framework-eigene Aufgabe behandelt.
    const kandidat = schluesselVon(c);
    const primary = kandidat && istGemeinsam(kandidat) ? kandidat : undefined;
    if (!primary) {
      const key = `${fw}:${c.id}`;
      const t: DeltaTask = {
        bundle_key: key, framework: fw, control_id: c.id,
        title: c.req_de ?? c.id, titleEn: c.req_en ?? c.req_de ?? c.id,
        effort_pt: pt, memberControlIds: [key],
      };
      (deltaByFramework[fw] ??= []).push(t);
      continue;
    }

    const existing = sharedMap.get(primary);
    if (existing) {
      if (!existing.frameworks.includes(fw)) existing.frameworks.push(fw);
      existing.memberControlIds.push(`${fw}:${c.id}`);
      existing.effort_pt = Math.max(existing.effort_pt, pt);
      // P6.4: Bündel-Titel kommt bevorzugt vom ISO-27001-Mitglied (das Bündel IST
      // die ISO-Kontrolle). Sonst zeigt z. B. a5-01 die DORA-Frage als Titel, nur
      // weil DORA in der DB-Reihenfolge vor ISO27001 kam. Erster Member bleibt
      // Fallback, wenn ISO 27001 nicht aktiv ist.
      if (isIsoFw(fw) && !isoTitled.has(primary) && c.req_de) {
        existing.title = c.req_de;
        existing.titleEn = c.req_en ?? c.req_de;
        isoTitled.add(primary);
      }
    } else {
      if (isIsoFw(fw) && c.req_de) isoTitled.add(primary);
      sharedMap.set(primary, {
        bundle_key: primary,
        title: c.req_de ?? primary,
        titleEn: c.req_en ?? c.req_de ?? primary,
        frameworks: [fw],
        alsoIn: [],
        memberControlIds: [`${fw}:${c.id}`],
        effort_pt: pt,
      });
    }
  }

  // CWS-Regel: nur AKTIV ausgewählte Frameworks anzeigen — keine "auch:"-Badges
  // für inaktive Frameworks (auch wenn sie dieselbe ISO-Referenz teilen).
  for (const t of sharedMap.values()) {
    t.alsoIn = [];
  }

  const shared = Array.from(sharedMap.values()).sort((a, b) => a.bundle_key.localeCompare(b.bundle_key));

  for (const fw of Object.keys(deltaByFramework)) {
    deltaByFramework[fw].sort((a, b) => a.control_id.localeCompare(b.control_id));
  }

  const nettoSharedPt = shared.reduce((s, t) => s + t.effort_pt, 0);
  const nettoDeltaPt = Object.values(deltaByFramework).flat().reduce((s, t) => s + t.effort_pt, 0);
  const nettoSum = nettoSharedPt + nettoDeltaPt;

  const totalControls =
    shared.length +
    Object.values(deltaByFramework).reduce((s, arr) => s + arr.length, 0);

  return {
    shared,
    deltaByFramework,
    totalControls,
    totalPtBrutto: bruttoSum,
    totalPtNetto: nettoSum,
  };
}
