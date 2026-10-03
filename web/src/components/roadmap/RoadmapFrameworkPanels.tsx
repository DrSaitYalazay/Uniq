/**
 * RoadmapFrameworkPanels — one collapsed accordion per active framework,
 * showing a compact Now / Next / Later view scoped to bundles that belong
 * to that framework.
 *
 * Deduplication rule: bundles are computed ONCE on the deduplicated
 * roadmapItems set (keyed on ISO Annex A via `isoRef`). A bundle that
 * appears in multiple frameworks is shown in every relevant panel with a
 * "Auch in X, Y" badge — but its PT is counted once in the global totals.
 *
 * Owner assignment stays control-centric: bundles use the shared
 * useBundleOwners store keyed on isoRef, so changing the owner in one
 * framework panel updates the owner everywhere.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Layers, Zap, ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { FRAMEWORKS, type FrameworkDefinition, type FrameworkKey } from "@/contexts/FrameworkContext";

type Lang = "de" | "en";
type Phase = "now" | "next" | "later";

interface BundleLike {
  key: string;                 // isoRef (e.g. "A.5.15") or "cat:<id>"
  title: string;
  titleEn: string;
  totalEffortPT: number;
  primaryOwner: string;
  isoRef: string | null;
  phase: Phase;
  isQuickWin: boolean;
  memberCount: number;
  doneCount: number;
}

interface Props {
  frameworks: FrameworkDefinition[]; // active
  bundles: BundleLike[];             // deduplicated across all frameworks
  isoToFrameworks: Record<string, string[]>; // iso_id (e.g. "a5-15") → framework DB codes
  primaryKey: FrameworkKey;
  lang: Lang;
}

// ── ISO ref normalization ──
// bundle.isoRef ist die Annex-/Klausel-Referenz ("A.5.15", "6.1.2") — genau die
// Waehrung, die control_iso.iso_id seit S1 (2026-09-13) fuehrt. Also identisch.
//
// VORHER (falsch): hier wurde aus "A.5.15" wieder die alte Katalog-Id "a5-15"
// gebaut. Diese Ids waren aber bei BSI/KRITIS/DORA/MaRisk/TISAX PRUEFFRAGEN-
// Nummern, nicht Annex-Nummern — "a5-15" ist die 15. Prueffrage und gehoert zu
// A.5.7 (Threat Intelligence). Von 116 ISO-Refs trafen 101 auf einen Eintrag,
// davon 89 auf die FALSCHE Kontrolle: das Buendel "A.5.15 Zugangssteuerung"
// zeigte die Frameworks von "A.5.7 Threat Intelligence".
function normalizeIsoRef(ref: string): string {
  return ref.trim();
}

// BSI stored as "BSI" in control_iso, but FrameworkKey is "BSI_ITGS".
const DB_TO_FW: Record<string, FrameworkKey> = {
  ISO27001: "ISO27001", NIS2: "NIS2", DORA: "DORA", BSI: "BSI_ITGS",
  TISAX: "TISAX", MaRisk: "MaRisk", KRITIS: "KRITIS", GDPR: "GDPR",
  CRA: "CRA", AIACT: "AIACT", ISO42001: "ISO42001",
  NIST_AI_RMF: "NIST_AI_RMF", NIST_CSF: "NIST_CSF", ISO27701: "ISO27701",
  BCM22301: "BCM22301", BSI200_4: "BSI200_4",
};

/**
 * For a given bundle, return the set of active framework KEYS it belongs to.
 * ISO27001 (hub) always applies. Non-ISO frameworks apply if control_iso links
 * their controls to this bundle's isoRef.
 */
function bundleFrameworksFor(
  bundle: BundleLike,
  activeKeys: FrameworkKey[],
  isoToFrameworks: Record<string, string[]>,
): Set<FrameworkKey> {
  const out = new Set<FrameworkKey>();
  // Every bundle is at minimum an ISO27001 hub deliverable when it has an isoRef.
  if (bundle.isoRef && activeKeys.includes("ISO27001")) out.add("ISO27001");
  if (bundle.isoRef) {
    const normalized = normalizeIsoRef(bundle.isoRef);
    const dbCodes = isoToFrameworks[normalized] ?? [];
    for (const code of dbCodes) {
      const fw = DB_TO_FW[code];
      if (fw && activeKeys.includes(fw)) out.add(fw);
    }
  }
  // Framework-specific bundles (cat:...) — attribute to primary only.
  return out;
}

const PHASE_META: Record<Phase, { icon: typeof Zap; toneCls: string; labelDe: string; labelEn: string }> = {
  now:   { icon: Zap,        toneCls: "text-destructive",             labelDe: "Jetzt",  labelEn: "Now" },
  next:  { icon: ArrowRight, toneCls: "st-teilweise-text", labelDe: "Nächste", labelEn: "Next" },
  later: { icon: Clock,      toneCls: "text-primary",                  labelDe: "Später", labelEn: "Later" },
};

export default function RoadmapFrameworkPanels({
  frameworks, bundles, isoToFrameworks, primaryKey, lang,
}: Props) {
  const de = lang === "de";
  const activeKeys = useMemo(() => frameworks.map(f => f.key), [frameworks]);




  // Precompute framework membership per bundle (once).
  const membership = useMemo(() => {
    const m = new Map<string, Set<FrameworkKey>>();
    for (const b of bundles) {
      const fws = bundleFrameworksFor(b, activeKeys, isoToFrameworks);
      // Fallback: bundles without isoRef (framework-native categories) → attribute to primary
      if (fws.size === 0) fws.add(primaryKey);
      m.set(b.key, fws);
    }
    return m;
  }, [bundles, activeKeys, isoToFrameworks, primaryKey]);

  // Global dedup totals (bundles counted once regardless of framework overlap).
  const totals = useMemo(() => {
    let pt = 0;
    for (const b of bundles) pt += b.totalEffortPT;
    return { uniqueBundles: bundles.length, totalPT: Math.round(pt * 10) / 10 };
  }, [bundles]);

  const [openFw, setOpenFw] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setOpenFw(p => ({ ...p, [k]: !p[k] }));

  if (frameworks.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Header + dedup explainer */}
        <div className="flex items-center gap-2 flex-wrap">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">
            {de ? "Roadmap pro Framework" : "Roadmap per framework"}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {frameworks.length} {de ? "Frameworks" : "frameworks"}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {totals.uniqueBundles} {de ? "eindeutige Bündel" : "unique bundles"}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {totals.totalPT} PT {de ? "gesamt (dedupliziert)" : "total (deduplicated)"}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {de
            ? "Kontrollen, die in mehreren Frameworks vorkommen, werden nur einmal gezählt und einmal umgesetzt. Ein Wechsel des Verantwortlichen in einem Framework wirkt für alle."
            : "Controls that appear in multiple frameworks are counted and executed once. Changing the owner in one framework propagates to all of them."}
        </p>

        {/* Framework accordions */}
        <div className="space-y-2">
          {frameworks.map(fw => {
            const isOpen = openFw[fw.key] ?? false;
            const fwBundles = bundles.filter(b => membership.get(b.key)?.has(fw.key));
            const byPhase: Record<Phase, BundleLike[]> = { now: [], next: [], later: [] };
            for (const b of fwBundles) byPhase[b.phase].push(b);
            const fwPT = fwBundles.reduce((s, b) => s + b.totalEffortPT, 0);
            const label = de ? fw.shortDe : fw.shortEn;

            return (
              <Card key={fw.key} className="overflow-hidden">
                <button
                  onClick={() => toggle(fw.key)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
                >
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-foreground">{label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <Badge variant="outline" className="text-[10px]">
                      {fwBundles.length} {de ? "Bündel" : "bundles"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                      {Math.round(fwPT * 10) / 10} PT
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">
                      {de ? "Jetzt" : "Now"}: {byPhase.now.length}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] st-teilweise-border st-teilweise-text">
                      {de ? "Nächste" : "Next"}: {byPhase.next.length}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
                      {de ? "Später" : "Later"}: {byPhase.later.length}
                    </Badge>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border p-3 bg-muted/10 space-y-3">
                    {(["now", "next", "later"] as Phase[]).map(phase => {
                      const list = byPhase[phase];
                      const meta = PHASE_META[phase];
                      const Icon = meta.icon;
                      return (
                        <div key={phase}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon className={cn("h-3.5 w-3.5", meta.toneCls)} />
                            <span className={cn("text-xs font-semibold", meta.toneCls)}>
                              {de ? meta.labelDe : meta.labelEn}
                            </span>
                            <span className="text-[11px] text-muted-foreground">({list.length})</span>
                          </div>
                          {list.length === 0 ? (
                            <div className="text-[11px] text-muted-foreground italic pl-5">
                              {de ? "Keine Bündel in dieser Phase." : "No bundles in this phase."}
                            </div>
                          ) : (
                            <ul className="space-y-1 pl-5">
                              {list.map(b => {
                                const memberFws = Array.from(membership.get(b.key) ?? []);
                                const otherFws = memberFws.filter(k => k !== fw.key);
                                return (
                                  <li
                                    key={b.key}
                                    className="flex items-start gap-2 py-1.5 px-2 rounded-md border border-border/60 bg-background/60"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-foreground truncate">
                                        {de ? b.title : b.titleEn}
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                        {b.isoRef && (
                                          <span className="text-[10px] text-muted-foreground font-mono">
                                            {b.isoRef}
                                          </span>
                                        )}
                                        {b.isQuickWin && (
                                          <Badge variant="outline" className="text-[9px] h-4 px-1 st-ja-border st-ja-text">
                                            Quick Win
                                          </Badge>
                                        )}
                                        {otherFws.length > 0 && (
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] h-4 px-1 border-primary/30 text-primary"
                                            title={de ? "Wird auch in diesen Frameworks gefordert — Umsetzung erfolgt einmalig" : "Also required in these frameworks — implemented once"}
                                          >
                                            {de ? "Auch in " : "Also in "}
                                            {otherFws.map(k => (de ? FRAMEWORKS[k].shortDe : FRAMEWORKS[k].shortEn)).join(", ")}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] shrink-0">
                                      {b.totalEffortPT} PT
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] shrink-0">
                                      {b.doneCount}/{b.memberCount}
                                    </Badge>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
