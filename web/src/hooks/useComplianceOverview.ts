/**
 * useComplianceOverview — read-only compliance snapshot for the Dashboard.
 *
 * Loads the user's enabled frameworks + their control catalog + answers
 * (via useAssessment), applies the framework-neutral NODE-ONLY projection
 * (inhaltsgleiche Kontrollen teilen einen Kontroll-Knoten / same-as; kein
 * ISO-Hub/Master — control_iso dient nur als Fallback für noch nicht gemappte
 * Kontrollen), and returns per-framework compliance stats.
 *
 * Kept in a hook so the Dashboard doesn't need to reproduce the projection
 * logic that lives in Assessment.tsx.
 */

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAssessment, answerKey } from "@/hooks/useAssessment";
import { useFrameworkInheritance } from "@/hooks/useFrameworkInheritance";
import { useCoverageReview } from "@/hooks/useCoverageReview";
import { useToolData } from "@/hooks/useToolData";
import { useUmsetzungEffective } from "@/hooks/useUmsetzungEffective";
import { useSoaNotApplicable } from "@/hooks/useSoaNotApplicable";
import { onFrameworksUpdated } from "@/lib/frameworkBus";
import { visibleFrameworkCodes } from "@/config/uniqFeatures";
import {
  computeStats, projectAnswer, buildAnchorAnswerMap,
  type AnswerRow, type ControlRow, type EffectiveAnswer, type FrameworkStats,
} from "@/lib/assessmentEngine";

export interface FrameworkOverview {
  framework: string;
  stats: FrameworkStats;
  controls: ControlRow[];
  effective: Map<string, EffectiveAnswer>;
}

/** Ampel-Rang: höher = „besser umgesetzt". na wird bewusst NICHT vom Overlay angehoben. */
const RANK: Record<string, number> = { ja: 3, teilweise: 2, nein: 1, na: 0 };

/**
 * „Spätere Phase gewinnt": hebt eine effektive Gap-Antwort auf den Umsetzungs-Status
 * an (nie herab, nie über „na"). Pure Funktion, damit Audit/Reports dieselbe Logik
 * nutzen wie das Dashboard.
 */
export function applyUmsetzungOverlay(eff: EffectiveAnswer, m?: "ja" | "teilweise"): EffectiveAnswer {
  if (!m || eff.status === "na") return eff;
  return ((RANK[m] ?? -1) > (RANK[eff.status ?? ""] ?? -1)) ? { ...eff, status: m } : eff;
}

export function useComplianceOverview(opts?: {
  overlay?: boolean;
  /** Optional: nur dieses Framework ausgeben (Dashboard-Filter). `null`/fehlend = alle. */
  frameworkFilter?: string | null;
}) {
  const overlay = opts?.overlay ?? true;
  const frameworkFilter = opts?.frameworkFilter ?? null;
  const { tenantId } = useAuth();
  const [enabledFrameworks, setEnabledFrameworks] = useState<string[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("company_profiles")
        .select("enabled_frameworks")
        .eq("user_id", tenantId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!alive) return;
      setEnabledFrameworks(visibleFrameworkCodes((data?.enabled_frameworks ?? []) as string[]));
      setProfileLoaded(true);
    })();
    return () => { alive = false; };
  }, [tenantId]);

  // Sofort auf Framework-Änderungen aus Scope reagieren (sonst bleibt die
  // Dashboard-Compliance bis zum Reload stale).
  useEffect(() => {
    const off = onFrameworksUpdated(({ enabled_frameworks }) => {
      setEnabledFrameworks(visibleFrameworkCodes((enabled_frameworks ?? []) as string[]));
    });
    return off;
  }, []);

  const { controls, answers, anchorsBySpokeControl, loading } = useAssessment(enabledFrameworks);
  const { mode: inheritanceMode } = useFrameworkInheritance();
  // Y8: EIN gemeinsamer Deckungs-Resolver fuer ALLE Verbraucher der Projektion.
  // Geerbtes „ja" aus einem anderen Framework bleibt „teilweise", bis Umfang,
  // Zeitraum und Nachweisdeckung bestaetigt sind.
  const { coverage } = useCoverageReview();
  // Effektive Umsetzung LIVE aus implementation_status (EINE Quelle — kein Cache-Blob mehr,
  // der nur beim Besuch der Umsetzung-Seite aktualisiert wurde).
  const umsEffective = useUmsetzungEffective(controls, enabledFrameworks);
  // SoA-Entscheidungen (Phase 05): „nicht anwendbar" wirkt auf ALLE Kennzahlen als „na" —
  // sonst zählt Gap/Dashboard eine in der SoA ausgeschlossene Kontrolle weiter als anwendbar
  // (Befund P5.R.4: „Anwendbar 404 vs. 403").
  const soaNa = useSoaNotApplicable();

  // Knoten-zuerst-Anker (control_node_member), Fallback ISO-Selbstanker.
  const isoAnchorsBySpokeControl = anchorsBySpokeControl;

  // HUB-AGNOSTISCH: jede Framework-Antwort füttert den (Knoten-)Anker.
  // Bei Modus "off" (Übernahme aus): LEERE Anker-Map → projectAnswer nutzt nur
  // die eigene Antwort (keine Cross-Framework-Vererbung).
  const isoAnswerByControl = useMemo(
    () => inheritanceMode === "off"
      ? new Map<string, AnswerRow>()
      : buildAnchorAnswerMap(answers, (fw, cid) => isoAnchorsBySpokeControl.get(`${fw}::${cid}`)?.map((a) => a.anchorId) ?? []),
    [answers, isoAnchorsBySpokeControl, inheritanceMode],
  );

  const controlsByFramework = useMemo(() => {
    const m = new Map<string, ControlRow[]>();
    for (const c of controls) {
      if (c.tags?.includes("sub")) continue;
      if ((c.meta as any)?.scored === false) continue;
      if (!m.has(c.framework)) m.set(c.framework, []);
      m.get(c.framework)!.push(c);
    }
    return m;
  }, [controls]);

  const overview = useMemo<FrameworkOverview[]>(() => {
    const members = umsEffective.members ?? {};
    const out: FrameworkOverview[] = [];
    controlsByFramework.forEach((list, fw) => {
      const effective = new Map<string, EffectiveAnswer>();
      for (const c of list) {
        const key = answerKey(fw, c.id, null);
        let eff = projectAnswer(c, answers[key], isoAnswerByControl, isoAnchorsBySpokeControl, { coverage });
        // „Spätere Phase gewinnt": effektive Umsetzung (Gap ∪ Umsetzung, aus der
        // Umsetzung-Seite) hebt den Status an — nie herab. Hält ALLE Kennzahlen
        // (Compliance, Posture, Hero) aus EINER Quelle konsistent.
        // „na" (nicht anwendbar) ist eine bewusste Ausklammerung und darf vom
        // Overlay NICHT angehoben werden (sonst schrumpft der na-Nenner und die
        // Compliance verfälscht sich).
        if (overlay) eff = applyUmsetzungOverlay(eff, members[`${fw}:${c.id}`] as "ja" | "teilweise" | undefined);
        // SoA „nicht anwendbar" (Phase 05) gewinnt: Kontrolle zählt überall als „na".
        if (soaNa.has(fw, c.id) && eff.status !== "na") eff = { ...eff, status: "na" };
        effective.set(c.id, eff);
      }
      out.push({ framework: fw, stats: computeStats(list, effective), controls: list, effective });
    });
    // Framework-neutral: KEIN Framework wird bevorzugt (kein ISO-Hub). Reihenfolge
    // folgt der vom Nutzer aktivierten Framework-Liste; Rest alphabetisch.
    const orderIdx = (fw: string) => {
      const i = enabledFrameworks.indexOf(fw);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    out.sort((a, b) => {
      const d = orderIdx(a.framework) - orderIdx(b.framework);
      return d !== 0 ? d : a.framework.localeCompare(b.framework);
    });
    return out;
  }, [controlsByFramework, answers, isoAnswerByControl, isoAnchorsBySpokeControl, enabledFrameworks, umsEffective.members, overlay, soaNa, coverage]);

  // Aufwand je Kontrolle (`${fw}:${id}` → PT) — dieselbe Quelle wie die Umsetzung (controls.effort_pt).
  const effortByControl = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of controls) { const v = Number(c.effort_pt ?? 0); if (Number.isFinite(v) && v > 0) m.set(`${c.framework}:${c.id}`, v); }
    return m;
  }, [controls]);

  // Framework-Filter (Dashboard): alle abgeleiteten Werte nur aus dem gewählten Framework.
  const visible = useMemo(
    () => (frameworkFilter ? overview.filter(o => o.framework === frameworkFilter) : overview),
    [overview, frameworkFilter],
  );

  // Primär = das ERSTE vom Nutzer aktivierte Framework (nicht hart auf ISO).
  const primary = visible.find(o => o.framework === enabledFrameworks[0]) ?? visible[0];
  const secondary = visible.filter(o => o.framework !== primary?.framework);

  // Gap-Antwortdatum je Kontrolle (`${framework}:${control_id}` → updated_at).
  // Basis für „wann wurde umgesetzt" in der Fortschritts-/Velocity-Auswertung,
  // solange kein expliziter Umsetzungs-Abschluss (completed_at) vorliegt.
  const gapDateByControl = useMemo(() => {
    const m = new Map<string, string>();
    for (const [key, a] of Object.entries(answers)) {
      // key = `${framework}::${control_id}` (answerKey ohne Asset) → normalisieren.
      const parts = key.split("::");
      if (parts.length < 2) continue;
      const [fw, cid, asset] = parts;
      if (asset && asset !== "__org__") continue; // Asset-Datumszeilen nicht das Org-Datum überschreiben lassen
      if ((a as AnswerRow).updated_at) m.set(`${fw}:${cid}`, (a as AnswerRow).updated_at as string);
    }
    return m;
  }, [answers]);

  // Datenaktualität („Stand"): woraus speist sich der aktuelle Wert und wie alt
  // ist er? Trennt „durch dokumentierte Umsetzung bestätigt" von „nur aus der
  // (evtl. veralteten) Gap-Analyse" und zählt seit > 12 Monaten nicht neu
  // bewertete Anforderungen. Nur für einen Info-Hinweis (nicht im Wert selbst).
  const freshness = useMemo(() => {
    const members = umsEffective.members ?? {};
    const STALE_MS = 365 * 24 * 3600 * 1000;
    const now = Date.now();
    let total = 0, met = 0, fromImpl = 0, fromGapOnly = 0, stale = 0, asOf = 0;
    for (const o of visible) {
      o.effective.forEach((eff, cid) => {
        const st = eff.status;
        if (st === "na") return;
        total++;
        const key = `${o.framework}:${cid}`;
        const gd = gapDateByControl.get(key);
        const t = gd ? Date.parse(gd) : 0;
        if (t) asOf = Math.max(asOf, t);
        if (st === "ja" || st === "teilweise") {
          met++;
          if (members[key] === "ja" || members[key] === "teilweise") fromImpl++;
          else { fromGapOnly++; if (!t || now - t > STALE_MS) stale++; }
        }
      });
    }
    return { total, met, fromImpl, fromGapOnly, stale, staleMonths: 12, asOf: asOf ? new Date(asOf).toISOString() : null };
  }, [visible, umsEffective.members, gapDateByControl]);

  return {
    loading: !profileLoaded || loading || umsEffective.loading,
    enabledFrameworks,
    overview: visible,
    /** Ungefiltert — alle Frameworks im Scope (für Auswahllisten). */
    allOverview: overview,
    primary,
    secondary,
    gapDateByControl,
    freshness,
    /** Umsetzungszeile je Kontrolle (`${fw}:${id}`) — Status/Owner/Frist/Nachweis, live aus implementation_status. */
    umsetzungByMember: umsEffective.byMember,
    /** PT je Kontrolle (`${fw}:${id}`) aus controls.effort_pt. */
    effortByControl,
  };
}
