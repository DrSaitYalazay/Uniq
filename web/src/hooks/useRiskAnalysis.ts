/**
 * useRiskAnalysis — Phase 4 data loader + engine driver.
 *
 * Loads the ISO 27001 hub answers, Phase 2 inventory (assets, services,
 * dependencies) from Supabase, builds ConsolidatedGap objects directly from
 * the `controls` table (bypasses controlMetadata which is nis2-catalog scoped),
 * and feeds `generateRisks()` to produce a `RiskAnalysisResult`.
 *
 * The Assessment page (Phase 3) is the source of truth for which controls
 * exist — same rows are re-read here so screen and risk view stay in sync.
 */

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFrameworkInheritance } from "@/hooks/useFrameworkInheritance";
import { useCoverageReview } from "@/hooks/useCoverageReview";
import { generateRisks, applyResidualRiskV2, DEFAULT_RISK_CONFIG, type RiskAnalysisResult, type RiskMatrixConfig } from "@/lib/riskEngine";
import type {
  ConsolidatedGap, Finding, AssetInfo, CritLevel, GapSeverityProvider,
} from "@/lib/gapEngine";
import { buildFindingsAndGaps, computeGapSeverity } from "@/lib/gapEngine";
import type { ControlRow, AnswerStatus, IsoMapping } from "@/lib/assessmentEngine";
import { projectAnswer, buildAnchorAnswerMap } from "@/lib/assessmentEngine";
import type { AnchorRef } from "@/lib/assessmentEngine";
import { extractIsoRef } from "@/data/iso27001Effort";
import { isoEntry } from "@/data/isoAnnexMap";
import { capabilityFor } from "@/lib/capabilityMap";
import {
  computeControlEffectiveness,
  type ControlEff, type ControlEffectRow, type ControlEffectDimension, type RiskControlLink,
} from "@/lib/controlEffectivenessEngine";
import { useEngineConfig } from "@/hooks/useEngineConfig";
import { useToolData } from "@/hooks/useToolData";
import { useImplementationStatus } from "@/hooks/useImplementationStatus";
import { computeUmsetzungEffective } from "@/hooks/useUmsetzungEffective";
import { applyUmsetzungOverlay } from "@/hooks/useComplianceOverview";
import { visibleFrameworkCodes } from "@/config/uniqFeatures";


interface ServiceRow {
  id: string;
  name: string;
  criticality: number | null;
  category: string | null;
}

interface AssetRow {
  id: string;
  service_id: string | null;
  asset_name: string;
  asset_type: string | null;
  environment: string | null;
  inherited_criticality: boolean | null;
  user_override_criticality: boolean | null;
}

interface DependencyRow {
  source_type: string | null;
  source_id: string;
  target_type: string | null;
  target_id: string;
  is_spof: boolean | null;
  criticality: number | null;
}


interface AnswerRow {
  framework: string;
  control_id: string;
  asset_id: string | null;
  antwort: AnswerStatus | null;
  reifegrad: number | null;
  note: string | null;
  updated_at?: string | null;   // für LWW-Projektion (projectAnswer)
}

const HUB = "ISO27001";

/** Normalisiert einen ISO-Annex-Bezeichner auf die kanonische "A.x.y"-Form.
 *  extractIsoRef greift nur bei bereits vorhandenem "A."-Präfix ("A.5.15");
 *  reine "5.15"-Bezeichner werden hier ergänzt. Gibt null zurück, wenn nichts
 *  Verwertbares gefunden wird. */
function normalizeIsoRef(raw?: string | null): string | null {
  if (!raw) return null;
  const direct = extractIsoRef(raw);
  if (direct) return direct;
  // Managementsystem-Klausel ("6.1.2", "4.3") — seit S1 fuehrt control_iso.iso_id
  // die Referenz selbst, nicht mehr die alte Katalog-Id.
  if (/^\d+(\.\d+){1,2}$/.test(raw.trim())) return raw.trim();
  // ENTFERNT (S1, 2026-09-13): der Zweig "a5-15" → "A.5.15". Diese Umrechnung war
  // falsch — bei BSI/KRITIS/DORA/MaRisk/TISAX war "a5-15" die 15. PRUEFFRAGE und
  // gehoerte zu A.5.7 (Threat Intelligence), nicht zu A.5.15 (Zugangssteuerung).
  // Solche Ids gibt es nicht mehr; taucht doch eine auf, ist sie Altbestand und
  // wird bewusst verworfen statt in eine erfundene Referenz umgedeutet.
  return null;
}

export function toAssetInfo(assets: AssetRow[], services: ServiceRow[], deps: DependencyRow[]): AssetInfo[] {
  const svcMap = new Map(services.map(s => [s.id, s]));
  // Inbound edge count per asset (SPOF ≥ 3). Only asset→asset edges count.
  const inbound = new Map<string, number>();
  for (const d of deps) {
    if ((d.target_type ?? "asset") !== "asset") continue;
    inbound.set(d.target_id, (inbound.get(d.target_id) ?? 0) + 1);
  }

  return assets.map(a => {
    const svc = a.service_id ? svcMap.get(a.service_id) : undefined;
    const svcCrit = svc?.criticality ?? 0;
    // riskEngine/gapEngine erwarten englische Stufen (Critical/High/Medium/Low);
    // deutsche Labels ließen den Kritikalitäts-Boost immer auf 0 fallen.
    const critLabel = svcCrit >= 4 ? "Critical" : svcCrit >= 3 ? "High" : svcCrit >= 2 ? "Medium" : "Low";
    const inCount = inbound.get(a.id) ?? 0;
    return {
      id: a.id,
      asset_name: a.asset_name,
      asset_type: a.asset_type ?? "",
      service_id: a.service_id ?? "",
      service_name: svc?.name,
      inherited_criticality: !!a.inherited_criticality && !a.user_override_criticality,
      criticality_classification: critLabel,
      dependency_count: inCount,
      is_single_point_of_failure: inCount >= 3,
      supports_critical_service: svcCrit >= 3,
    };
  });
}

export interface ImplementedAnswerRow {
  control_id: string;
  source: "baseline" | "assessment";
}

export interface UseRiskAnalysisState {
  loading: boolean;
  error: string | null;
  result: RiskAnalysisResult | null;
  gaps: ConsolidatedGap[];
  findings: Finding[];
  assetInfos: AssetInfo[];
  answered: number;
  totalIsoControls: number;
  treatmentControls: ControlRow[];
  controlIsoMappings: IsoMapping[];
  enabledFrameworks: string[];
  /** Controls answered "ja" in Gap/Baseline — mirrored to TreatmentState. */
  implementedAnswers: ImplementedAnswerRow[];
  /** Knoten-Brücke (Spec-ITEM 18, Schritt 2): fremde control_id → kanonische
   *  ISO-Annex-Ref ("A.x.y"), verdichtet aus control_node_member (ISO27001-
   *  Mitglied je Knoten) mit control_iso als Fallback. Rein additiv — noch
   *  konsumiert niemand dieses Feld (das ist Schritt 3). */
  isoRefByControlId: ReadonlyMap<string, string>;
}

interface RawInputs {
  gaps: ConsolidatedGap[];
  findings: Finding[];
  assetInfos: AssetInfo[];
  depTuples: { source_asset_id: string; target_asset_id: string }[];
  answered: number;
  totalIsoControls: number;
  treatmentControls: ControlRow[];
  controlIsoMappings: IsoMapping[];
  enabledFrameworks: string[];
  implementedAnswers: ImplementedAnswerRow[];
  isoRefByControlId: ReadonlyMap<string, string>;
  /** E2 (residual_model='multiplicative'): Control-Effectiveness je "framework::id". Leer im Legacy-Pfad. */
  effByControl: Map<string, ControlEff>;
  /** E2: Risiko↔Control-Links (Capability-Match, damping 0.8). Leer im Legacy-Pfad. */
  links: RiskControlLink[];
  /** E2: aktiv, wenn residual_model='multiplicative'. Steuert die Residual-Anreicherung im useMemo. */
  residualMultiplicative: boolean;
}


export function useRiskAnalysis(config: RiskMatrixConfig = DEFAULT_RISK_CONFIG): UseRiskAnalysisState {
  const { user, tenantId } = useAuth();
  const { mode: inheritanceMode } = useFrameworkInheritance();
  // Y8: EIN gemeinsamer Deckungs-Resolver fuer ALLE Verbraucher der Projektion.
  // Geerbtes „ja" aus einem anderen Framework bleibt „teilweise", bis Umfang,
  // Zeitraum und Nachweisdeckung bestaetigt sind.
  const { coverage } = useCoverageReview();
  // Engine-Flags (org-scoped). Default 'legacy' / gap_context=false ⇒ heutiges Verhalten.
  const { config: engineConfig, loading: engineLoading } = useEngineConfig();
  const residualMultiplicative = engineConfig.residual_model === "multiplicative";
  const gapContextOn = engineConfig.gap_context === true;
  // Umsetzungs-Overlay („spätere Phase gewinnt") — LIVE aus implementation_status
  // (dieselbe Bündelung wie Umsetzung/Dashboard; kein Cache-Blob mehr).
  const { rows: implRows, loading: implLoading } = useImplementationStatus();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<RawInputs | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    if (engineLoading || implLoading) return; // Engine-Flags/Umsetzungsstatus erst nach dem Laden anwenden
    (async () => {
      setLoading(true); setError(null);
      try {
        async function fetchAll<T>(build: (from: number, to: number) => any): Promise<T[]> {
          const PAGE = 1000; const out: T[] = []; let from = 0;
          for (let i = 0; i < 20; i++) {
            const { data, error } = await build(from, from + PAGE - 1);
            if (error) throw error;
            const rows = (data ?? []) as T[];
            out.push(...rows);
            if (rows.length < PAGE) break;
            from += PAGE;
          }
          return out;
        }

        const { data: profile } = await supabase
          .from("company_profiles")
          .select("enabled_frameworks")
          .eq("user_id", tenantId ?? user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const userSelected = visibleFrameworkCodes(((profile?.enabled_frameworks ?? []) as string[]).filter(Boolean));
        // Node-only: exakt die gewählten Frameworks — kein erzwungenes ISO27001 (kein
        // Hub). Nur wenn NICHTS gewählt ist, ISO als sinnvoller Default (leere Ansicht vermeiden).
        const enabledFrameworks = userSelected.length ? Array.from(new Set(userSelected)) : [HUB];

        const [controls, controlIsoMappings, nodeMembers, answers, assets, services, deps] = await Promise.all([
          fetchAll<ControlRow>((f, t) =>
            supabase.from("controls")
              .select("id, framework, sub_sector, req_de, req_en, muss, tags, meta")
              .in("framework", enabledFrameworks).order("id").range(f, t)),
          fetchAll<IsoMapping>((f, t) =>
            supabase.from("control_iso")
              .select("framework, control_id, iso_id")
              .in("framework", enabledFrameworks)
              .order("framework").order("control_id").order("iso_id").range(f, t)),
          fetchAll<{ node_id: string; framework: string; control_id: string }>((f, t) =>
            supabase.from("control_node_member")
              .select("node_id, framework, control_id")
              .order("node_id").order("framework").order("control_id").range(f, t)),
          fetchAll<AnswerRow>((f, t) =>
            supabase.from("answers")
              .select("framework, control_id, asset_id, antwort, reifegrad, note, updated_at")
              .in("framework", enabledFrameworks).order("id").range(f, t)),
          fetchAll<AssetRow>((f, t) =>
            supabase.from("assets")
              .select("id, service_id, asset_name, asset_type, environment, inherited_criticality, user_override_criticality")
              .order("id").range(f, t)),
          fetchAll<ServiceRow>((f, t) =>
            supabase.from("services").select("id, name, criticality, category").order("id").range(f, t)),
          fetchAll<DependencyRow>((f, t) =>
            supabase.from("dependencies").select("source_type, source_id, target_type, target_id, is_spof, criticality").order("id").range(f, t)),
        ]);

        if (cancelled) return;

        // ── E2/E5 · Control-Effectiveness-Katalog (nur wenn ein Flag aktiv) ──
        // Wird ausschließlich geladen, wenn residual_model='multiplicative'
        // ODER gap_context=true. Fehler/leere Tabelle sind unkritisch: die
        // Engine greift dann auf base_eff=0.5-Defaults zurück (eff-Default).
        const needsEffect = residualMultiplicative || gapContextOn;
        let controlEffectRows: ControlEffectRow[] = [];
        if (needsEffect) {
          try {
            controlEffectRows = await fetchAll<ControlEffectRow>((f, t) =>
              supabase.from("control_effect")
                .select("framework, control_id, dimension, kind, base_eff")
                .in("framework", enabledFrameworks)
                .order("framework").order("control_id").order("dimension").range(f, t));
          } catch { controlEffectRows = []; }
          if (cancelled) return;
        }
        const effectRowByControl = new Map<string, ControlEffectRow>();
        for (const er of controlEffectRows) effectRowByControl.set(`${er.framework}::${er.control_id}`, er);

        // ISO 27001 bleibt der Hub — Bewertungen laufen gegen ISO.
        //
        // Wenn der Nutzer zusätzlich Nicht-Hub-Frameworks (z. B. DORA, NIS2)
        // aktiviert hat, hängt das Verhalten vom globalen "Framework-
        // Übernahme"-Toggle ab (useFrameworkInheritance):
        //
        //  - inheritanceMode === "off"  (Aus)
        //      Wenn der Hub (ISO 27001) NICHT in der Auswahl ist, werden
        //      Hub-Antworten NICHT übernommen. Der Umfang bleibt leer,
        //      solange der Nutzer die anderen Frameworks nicht direkt
        //      beantwortet — das ist die "strikte" Sicht.
        //
        //  - inheritanceMode === "preview" | "applied"  (Vorschau / Übernommen)
        //      Hub-Antworten werden über das control_iso-Mapping in die
        //      Nicht-Hub-Frameworks übernommen. Weiterverarbeitung erfolgt
        //      gegen die auf Nicht-Hub-Frameworks gemappten ISO-Kontrollen.
        // ── Hub-agnostische Effektiv-Bewertung (identisch zur Bewertungsseite) ──
        // Jede Framework-Antwort speist über den gemeinsamen Kontroll-Knoten
        // (Weakest-Link: strengster Status gewinnt, CHG-07). Findings kommen aus dem EFFEKTIVEN Status der
        // Kontrollen der AKTIV gewählten Frameworks (bzw. ISO-Hub, wenn nur dieser
        // gewählt) — deckt DIREKTE und GEERBTE Gaps ab. Behebt „Risikoanalyse leer",
        // wenn der Nutzer Nicht-Hub-Frameworks (BSI/DORA/…) direkt bewertet hat.
        const answersRecord: Record<string, AnswerRow> = {};
        for (const a of answers) answersRecord[`${a.framework}::${a.control_id}::${a.asset_id ?? "__org__"}`] = a;
        // Anker (node-only): Kontroll-Knoten (same-as), relation "equal". KEIN control_iso,
        // KEIN ISO-Selbstanker. control_mapping wird in diesem Hook (wie bisher) nicht geladen
        // — Tabelle ist leer; bei Befüllung hier nachziehen (Parität zu useAssessment).
        const anchorsBySpoke = new Map<string, AnchorRef[]>();
        // Akkumulieren (nicht überschreiben): eine Kontrolle kann Mitglied mehrerer Knoten sein.
        for (const nm of nodeMembers) {
          const k = `${nm.framework}::${nm.control_id}`;
          const arr = anchorsBySpoke.get(k) ?? [];
          if (!arr.some((a) => a.anchorId === nm.node_id)) arr.push({ anchorId: nm.node_id, relation: "equal" });
          anchorsBySpoke.set(k, arr);
        }
        // (control_iso-Fallback bewusst NICHT aktiv — verursachte in der Live-
        //  Projektion einen Hänger; erst nach Fixture-Test wieder aktivieren.)
        const anchorsFor = (fw: string, cid: string) => (anchorsBySpoke.get(`${fw}::${cid}`)?.map((a) => a.anchorId) ?? []);
        // Bei Modus "off" (Übernahme aus): LEERE Anker-Map → projectAnswer nutzt nur
        // die eigene Antwort (keine Cross-Framework-Vererbung).
        const isoAnswerByControl = inheritanceMode === "off"
          ? new Map<string, AnswerRow>()
          : buildAnchorAnswerMap(answersRecord as any, anchorsFor);

        const findingFrameworks = userSelected.length ? userSelected : [HUB];
        const findingControls = controls.filter(c =>
          findingFrameworks.includes(c.framework) &&
          !c.tags?.includes("sub") && (c.meta as any)?.scored !== false,
        );
        const effAnswers: AnswerRow[] = [];
        const implementedAnswers: ImplementedAnswerRow[] = [];
        let answeredCount = 0;
        const umsMembers = computeUmsetzungEffective(controls as any, enabledFrameworks, implRows).members;
        // B-10 (akıllı dedup): same-as paylaşılan bir „nein"/„teilweise" jedes
        // Frameworks würde sonst je Framework EIN Finding erzeugen (×4 bei 4 FW) →
        // Missing-Zähler, findings.length-Schwellen und Kritik-Zähler künstlich
        // aufgebläht. Deshalb: NICHT-Delta-Kontrollen je same-as-Knoten nur EINMAL
        // als org-Finding zählen; Delta-Kontrollen (framework-spezifische Pflichten,
        // z. B. NIS2 72h vs DORA 4h) bleiben separat.
        const nodeIdByControl = new Map<string, string>();
        for (const nm of nodeMembers) nodeIdByControl.set(`${nm.framework}::${nm.control_id}`, nm.node_id);
        const seenNodeOrg = new Set<string>();
        for (const c of findingControls) {
          const own = answersRecord[`${c.framework}::${c.id}::__org__`];
          const eff = applyUmsetzungOverlay(projectAnswer(c as any, own as any, isoAnswerByControl as any, anchorsBySpoke, { coverage }), umsMembers[`${c.framework}:${c.id}`]);
          if (eff.status) answeredCount++;
          if (eff.status === "nein" || eff.status === "teilweise") {
            const isDelta = (c.meta as any)?.coverage === "delta";
            const nodeId = nodeIdByControl.get(`${c.framework}::${c.id}`);
            if (!isDelta && nodeId) {
              if (seenNodeOrg.has(nodeId)) continue; // same-as-Geschwister nur einmal
              seenNodeOrg.add(nodeId);
            }
            effAnswers.push({ framework: c.framework, control_id: c.id, asset_id: null, antwort: eff.status, reifegrad: null, note: own?.note ?? null });
          } else if (eff.status === "ja") {
            implementedAnswers.push({ control_id: c.id, source: "baseline" as const });
          }
        }
        // Per-Asset-Overrides (explizit, keine Projektion nötig) — sonst bleiben
        // Asset-Kritikalität/SPOF/Abhängigkeits-Logik im Live-Pfad unerreichbar.
        const findingSet = new Set(findingControls.map(c => `${c.framework}::${c.id}`));
        for (const a of answers) {
          if (!a.asset_id) continue;
          if (a.antwort !== "nein" && a.antwort !== "teilweise") continue;
          if (!findingSet.has(`${a.framework}::${a.control_id}`)) continue;
          effAnswers.push({ framework: a.framework, control_id: a.control_id, asset_id: a.asset_id, antwort: a.antwort, reifegrad: null, note: a.note ?? null });
        }
        // ── Knoten-Brücke (Spec-ITEM 18, Schritt 2): control_id → ISO-Ref ──
        // Aus dem bereits geladenen control_node_member wird je Knoten das
        // ISO27001-Mitglied bestimmt; dessen kanonischer Annex-Ref ("A.x.y")
        // gilt für ALLE Mitglieder des Knotens (auch fremde/Nicht-NIS2-IDs).
        // Fallback: control_iso.iso_id direkt normalisieren. Rein additiv —
        // niemand konsumiert dieses Feld bislang (das ist Schritt 3).
        const isoRefByControlId = new Map<string, string>();
        for (const m of controlIsoMappings) {
          const ref = normalizeIsoRef(m.iso_id);
          if (ref) isoRefByControlId.set(m.control_id, ref);
        }
        const isoRefByNode = new Map<string, string>();
        const membersByNode = new Map<string, { node_id: string; framework: string; control_id: string }[]>();
        for (const nm of nodeMembers) {
          const arr = membersByNode.get(nm.node_id) ?? [];
          arr.push(nm);
          membersByNode.set(nm.node_id, arr);
          if (nm.framework === HUB) {
            // HUB-Mitglied ist eine ISO-27001-KONTROLL-Id des v7-Katalogs
            // ("BC-BIA", "C29.4"), keine Referenz. Die kanonische Annex-/Klausel-
            // Referenz kommt aus isoAnnexMap.
            //
            // VORHER (falsch): normalizeIsoRef("C29.4") zog per /(\d+\.\d+)/ die
            // "29.4" heraus und erfand daraus "A.29.4" — eine Referenz, die es in
            // ISO/IEC 27001:2022 nicht gibt (Annex A endet bei A.8.34).
            const ref = isoEntry(nm.control_id)?.ref ?? null;
            if (ref) isoRefByNode.set(nm.node_id, ref);
          }
        }
        for (const [nodeId, ref] of isoRefByNode) {
          for (const nm of membersByNode.get(nodeId) ?? []) isoRefByControlId.set(nm.control_id, ref);
        }

        const assetInfos = toAssetInfo(assets, services, deps);

        // ── E5 · Kontext-/Risiko-Severity-Provider (nur bei gap_context) ──
        // Ohne Flag KEIN Provider ⇒ buildFindingsAndGaps nutzt severityFor →
        // byte-identisch. Mit Flag baut computeGapSeverity aus base_eff (E2),
        // Asset-Kritikalität, SPOF und capability_tag den kontextualen Score.
        let severityOpts: { severityProvider?: Parameters<typeof buildFindingsAndGaps>[4] extends infer O ? (O extends { severityProvider?: infer P } ? P : never) : never } | undefined;
        if (gapContextOn) {
          const assetCtx = new Map(assetInfos.map(ai => [ai.id, ai]));
          severityOpts = {
            severityProvider: ({ muss, answer, control, finding }) => {
              const key = control ? `${control.framework}::${control.id}` : "";
              const baseEff = effectRowByControl.get(key)?.base_eff;
              const ai = finding.asset_id ? assetCtx.get(finding.asset_id) : undefined;
              const assetCritLevel = (ai?.criticality_classification ?? null) as CritLevel | null;
              return computeGapSeverity(muss, answer, {
                controlEff: typeof baseEff === "number" ? baseEff : undefined,
                assetCritLevel,
                spof: ai?.is_single_point_of_failure,
                capabilityTag: finding.capability_tag,
              }).level;
            },
          };
        }

        // ── Risikotext-Katalog (Tabelle `risks` über `control_risk`) ──
        // Liefert je Kontrolle den konkreten Risikotext (Bedrohung → Folge →
        // Rechtsfolge). Fehler sind unkritisch: dann greift der generische Satz.
        let riskTextFor: ((framework: string, controlId: string) => { de: string; en: string } | null) | undefined;
        try {
          const links = await fetchAll<{ framework: string; control_id: string; risk_id: string; link_typ: string | null }>((f, t) =>
            supabase.from("control_risk").select("framework, control_id, risk_id, link_typ")
              .in("framework", enabledFrameworks).order("framework").order("control_id").order("risk_id").range(f, t));
          const ids = Array.from(new Set(links.map(l => l.risk_id)));
          const texts = new Map<string, { de: string; en: string; stufe: string | null }>();
          for (let i = 0; i < ids.length; i += 500) {
            const chunk = ids.slice(i, i + 500);
            const { data } = await supabase.from("risks").select("risk_id, text_de, text_en, stufe").in("risk_id", chunk);
            for (const r of (data ?? []) as Array<{ risk_id: string; text_de: string; text_en: string | null; stufe: string | null }>) {
              texts.set(r.risk_id, { de: r.text_de ?? "", en: r.text_en ?? r.text_de ?? "", stufe: r.stufe });
            }
          }
          // Verlässlichkeit der Verknüpfung (live 2026-09-11 geprüft): „exakt/direkt/delta/knoten"
          // treffen die Kontrolle; „klausel/thema/klausel-anker" sind Klausel-Sammelanker und bei
          // ISO teils falsch zugeordnet (a5-42 „Anmeldedaten" → R-0001 „Behördenkontakte"). Solche
          // Texte werden NICHT als Risikotext verwendet (dann greift der kontrollbezogene
          // Fallback in gapEngine), damit nie ein themenfremder Text erscheint.
          const linkRank: Record<string, number> = { exakt: 0, direkt: 1, delta: 2, knoten: 3, klausel: 6, thema: 7, "klausel-anker": 8 };
          const trusted = (lt: string | null) => (linkRank[lt ?? ""] ?? 9) <= 3;
          const byControl = new Map<string, { de: string; en: string; _r: number }[]>();
          const stufeRank = (x: string | null) => (x === "hoch" ? 0 : x === "mittel" ? 1 : 2);
          for (const l of links) {
            if (!trusted(l.link_typ)) continue;
            const t = texts.get(l.risk_id);
            if (!t || !t.de) continue;
            const k = `${l.framework}:${l.control_id}`;
            const arr = byControl.get(k) ?? [];
            arr.push({ de: t.de, en: t.en, _r: (linkRank[l.link_typ ?? ""] ?? 9) * 10 + stufeRank(t.stufe) });
            byControl.set(k, arr);
          }
          for (const arr of byControl.values()) arr.sort((a, b) => a._r - b._r);
          riskTextFor = (fw, cid) => { const hit = byControl.get(`${fw}:${cid}`)?.[0]; return hit ? { de: hit.de, en: hit.en } : null; };
        } catch { riskTextFor = undefined; }
        if (cancelled) return;

        const { findings, gaps } = buildFindingsAndGaps(findingControls, effAnswers, assets, services, { ...(severityOpts ?? {}), riskTextFor });
        const depTuples = deps
          .filter(d => (d.source_type ?? "asset") === "asset" && (d.target_type ?? "asset") === "asset")
          .map(d => ({ source_asset_id: d.source_id, target_asset_id: d.target_id }));

        // ── E2 · Control-Effectiveness-Map + Risiko↔Control-Links ──
        // Nur im multiplikativen Pfad befüllt; sonst leer ⇒ useMemo lässt das
        // Ergebnis unangetastet (kein residual_* Feld, byte-identisch).
        const effByControl = new Map<string, ControlEff>();
        const links: RiskControlLink[] = [];
        if (residualMultiplicative) {
          // eff_c je Kontrolle aus wirksamer Antwort (projectAnswer) × Katalog.
          const controlsByCap = new Map<string, { key: string; dimension: ControlEffectDimension }[]>();
          for (const c of findingControls) {
            const key = `${c.framework}::${c.id}`;
            const own = answersRecord[`${c.framework}::${c.id}::__org__`];
            const effAns = projectAnswer(c as any, own as any, isoAnswerByControl as any, anchorsBySpoke, { coverage });
            effByControl.set(key, computeControlEffectiveness(effectRowByControl.get(key), effAns));
            const cap = capabilityFor(c as any);
            const arr = controlsByCap.get(cap) ?? [];
            arr.push({ key, dimension: effectRowByControl.get(key)?.dimension ?? "likelihood" });
            controlsByCap.set(cap, arr);
          }
          // Capability-Match: Kontrollen derselben Capability mildern die Risiken
          // dieser Capability (damping 0.8, weil nicht explizit per Treatment
          // verknüpft). risk_id spiegelt generateRisks: `risk-${gap.gap_id}`.
          for (const gap of gaps) {
            const riskId = `risk-${gap.gap_id}`;
            for (const cm of controlsByCap.get(gap.capability_tag) ?? []) {
              links.push({ risk_id: riskId, control_key: cm.key, dimension: cm.dimension, damping: 0.8 });
            }
          }
        }

        setRaw({
          gaps, findings, assetInfos, depTuples,
          answered: answeredCount,
          totalIsoControls: findingControls.length,
          treatmentControls: controls,
          controlIsoMappings,
          enabledFrameworks,
          implementedAnswers,
          isoRefByControlId,
          effByControl,
          links,
          residualMultiplicative,
        });

        setLoading(false);
      } catch (err: any) {
        if (!cancelled) { setError(err?.message ?? String(err)); setLoading(false); setRaw(null); }
      }
    })();
    return () => { cancelled = true; };
  }, [user, tenantId, inheritanceMode, residualMultiplicative, gapContextOn, engineLoading, implRows, implLoading, coverage]);

  // Re-run risk engine when config changes without re-fetching.
  const result = useMemo(() => {
    if (!raw) return null;
    const base = generateRisks({
      gaps: raw.gaps, findings: raw.findings, assets: raw.assetInfos,
      dependencies: raw.depTuples, config,
    });
    // E2 · multiplikatives Residual NUR wenn Flag aktiv (raw.residualMultiplicative);
    // sonst unveraendert -> byte-identisch zum Legacy-Pfad (residual_* bleiben undefined).
    if (raw.residualMultiplicative && base?.risks?.length) {
      const enriched = applyResidualRiskV2(
        base.risks, raw.links, raw.effByControl,
        { ...config, residual_model: "multiplicative" },
      );
      return { ...base, risks: enriched };
    }
    return base;
  }, [raw, config]);

  return {
    loading, error, result,
    gaps: raw?.gaps ?? [], findings: raw?.findings ?? [], assetInfos: raw?.assetInfos ?? [],
    answered: raw?.answered ?? 0, totalIsoControls: raw?.totalIsoControls ?? 0,
    treatmentControls: raw?.treatmentControls ?? [],
    controlIsoMappings: raw?.controlIsoMappings ?? [],
    enabledFrameworks: raw?.enabledFrameworks ?? [HUB],
    implementedAnswers: raw?.implementedAnswers ?? [],
    isoRefByControlId: raw?.isoRefByControlId ?? new Map<string, string>(),
  };
}


