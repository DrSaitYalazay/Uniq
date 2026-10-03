/**
 * applicabilityGates — Anwendbarkeit von Kontrollen, die nur unter einer
 * Bedingung gelten.
 * ----------------------------------------------------------------------------
 * Der Unified Control Catalogue v6 kennt zwei Arten bedingter Kontrollen
 * (`meta.applicability` in `public.controls`):
 *
 *  • presentation = "scope_gate"  — Entitätstyp-Frage, die EINMAL VORAB gestellt
 *    wird. Aktuell genau eine Gruppe: APP-DOM (TLD-Namenregister / Domain-
 *    Registrierungsdienst, NIS2 Art. 28). Wer das nicht ist, bekommt die acht
 *    Fragen gar nicht erst zu sehen — sie werden automatisch als „nicht
 *    anwendbar" in der SoA geführt.
 *
 *  • presentation = "inline"      — Bedingung steht IM Kontrolltext und wird in
 *    der Kontrollliste mitgezeigt. Diese Kontrollen werden NICHT ausgeblendet;
 *    der Nutzer beantwortet die Bedingung selbst (Antwort „na" + Begründung).
 *
 * Die Vorab-Antwort liegt org-weit in `org_tool_data` (tool_key "scope-gates")
 * und wird gespiegelt in localStorage, damit der Katalog-Loader sie synchron
 * lesen kann.
 */
import { supabase } from "@/integrations/supabase/client";

export const SCOPE_GATE_TOOL_KEY = "scope-gates";
export const SCOPE_GATE_LS_KEY = "cws.scope-gates.v1";

/** Antwort auf eine Scope-Gate-Frage. */
export type GateAnswer = "yes" | "no" | "unknown";

/** Gespeicherter Zustand: { "APP-DOM": "no", ... } */
export type ScopeGateState = Record<string, GateAnswer>;

export interface ScopeGateDef {
  id: string;
  /** Frameworks, für die die Frage überhaupt relevant ist. */
  frameworks: string[];
  questionDe: string;
  questionEn: string;
  hintDe: string;
  hintEn: string;
  /** Kontroll-IDs, die an dieser Frage hängen (Katalog v6). */
  controlIds: string[];
}

/**
 * Quelle: Applicability_Model.json → scope_gates. Die Kontroll-IDs sind hier
 * bewusst fest hinterlegt (und nicht aus der DB gelesen), damit die Vorab-Frage
 * auch dann funktioniert, wenn der Katalog noch nicht geladen ist. Sie werden
 * vor jedem Schreibvorgang gegen `public.controls` geprüft.
 */
export const SCOPE_GATES: ScopeGateDef[] = [
  {
    id: "APP-DOM",
    frameworks: ["NIS2"],
    questionDe:
      "Betreibt Ihre Organisation ein TLD-Namenregister oder bietet sie Domainnamen-Registrierungsdienste an?",
    questionEn:
      "Does your entity operate a TLD name registry or provide domain-name registration services?",
    hintDe:
      "Eine eigene Domain zu besitzen, DNS zu nutzen oder eine Website zu betreiben aktiviert diese Gruppe NICHT. Gemeint sind Registries und Registrare im Sinne von NIS2 Art. 28.",
    hintEn:
      "Owning a domain, using DNS or operating a website alone does not activate this group. This is about registries and registrars under NIS2 Art. 28.",
    controlIds: ["C19.1", "C19.2", "C19.3", "C19.4", "C19.5", "C19.6", "C19.8", "C19.9"],
  },
];

/** Marker in `answers.note`, damit automatisch gesetzte N/A wieder entfernbar sind. */
export const GATE_NOTE_PREFIX = "[auto:scope-gate]";

export function gateById(id: string): ScopeGateDef | undefined {
  return SCOPE_GATES.find((g) => g.id === id);
}

/** Für ein Framework relevante Gates. */
export function gatesForFrameworks(frameworks: string[]): ScopeGateDef[] {
  const set = new Set(frameworks);
  return SCOPE_GATES.filter((g) => g.frameworks.some((f) => set.has(f)));
}

/** Synchron aus localStorage (Katalog-Loader braucht das ohne await). */
export function readScopeGatesLocal(): ScopeGateState {
  try {
    const raw = localStorage.getItem(SCOPE_GATE_LS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? (parsed as ScopeGateState) : {};
  } catch {
    return {};
  }
}

export function writeScopeGatesLocal(state: ScopeGateState): void {
  try {
    localStorage.setItem(SCOPE_GATE_LS_KEY, JSON.stringify(state));
  } catch {
    /* Speicher voll / privater Modus — kein harter Fehler */
  }
}

/** Org-weiten Zustand laden (und lokal spiegeln). */
export async function loadScopeGates(tenantId: string): Promise<ScopeGateState> {
  const { data, error } = await supabase
    .from("org_tool_data")
    .select("data")
    .eq("tenant_id", tenantId)
    .eq("tool_key", SCOPE_GATE_TOOL_KEY)
    .limit(1);
  if (error) return readScopeGatesLocal();
  const state = ((data?.[0] as any)?.data ?? {}) as ScopeGateState;
  writeScopeGatesLocal(state);
  return state;
}

/**
 * Antwort speichern und die abhängigen Kontrollen konsistent halten:
 *  • "no"      → alle Kontrollen der Gruppe als `antwort='na'` mit Begründung
 *                anlegen (SoA zeigt „nicht anwendbar").
 *  • "yes"     → die automatisch gesetzten N/A wieder entfernen, damit der
 *                Nutzer die Fragen normal beantwortet.
 *  • "unknown" → nichts automatisch setzen (Scope-Klärung nötig).
 *
 * Nur Zeilen mit dem Marker in `note` werden wieder entfernt — von Hand
 * gesetzte Antworten bleiben unangetastet.
 */
export async function applyScopeGate(
  tenantId: string,
  gateId: string,
  answer: GateAnswer,
  userId?: string | null,
): Promise<{ marked: number; cleared: number }> {
  const gate = gateById(gateId);
  if (!gate) return { marked: 0, cleared: 0 };

  // Nur Kontrollen verwenden, die im aktuellen Katalog wirklich existieren.
  const present: Array<{ framework: string; id: string }> = [];
  for (const fw of gate.frameworks) {
    const { data } = await supabase
      .from("controls")
      .select("id, framework")
      .eq("framework", fw)
      .in("id", gate.controlIds);
    for (const row of (data ?? []) as any[]) present.push({ framework: row.framework, id: row.id });
  }
  if (present.length === 0) return { marked: 0, cleared: 0 };

  if (answer === "no") {
    const note = `${GATE_NOTE_PREFIX} ${gate.id}: ${gate.questionDe} → Nein`;
    const rows = present.map((c) => ({
      tenant_id: tenantId,
      framework: c.framework,
      control_id: c.id,
      asset_id: null,
      antwort: "na",
      note,
      updated_by: userId ?? null,
    }));
    // Konfliktziel = der tatsächliche Unique-Index (… , asset_id) NULLS NOT DISTINCT.
    // Mit "tenant_id,framework,control_id" lehnte Postgres das Upsert ab („no unique
    // or exclusion constraint matching") — „Nein" markierte still keine Kontrolle.
    const { error } = await supabase
      .from("answers")
      .upsert(rows, { onConflict: "tenant_id,framework,control_id,asset_id" });
    return { marked: error ? 0 : rows.length, cleared: 0 };
  }

  if (answer === "yes") {
    let cleared = 0;
    for (const c of present) {
      const { data } = await supabase
        .from("answers")
        .select("id, note")
        .eq("tenant_id", tenantId)
        .eq("framework", c.framework)
        .eq("control_id", c.id)
        .limit(1);
      const row = (data ?? [])[0] as any;
      if (row && typeof row.note === "string" && row.note.startsWith(GATE_NOTE_PREFIX)) {
        await supabase
          .from("answers")
          .delete()
          .eq("tenant_id", tenantId)
          .eq("framework", c.framework)
          .eq("control_id", c.id);
        cleared++;
      }
    }
    return { marked: 0, cleared };
  }

  return { marked: 0, cleared: 0 };
}

/**
 * true = diese Kontrolle gehört zu einer Scope-Gruppe, die der Nutzer mit
 * „Nein" beantwortet hat. Solche Kontrollen werden in der Bewertung
 * ausgeblendet (in der SoA erscheinen sie über die automatische N/A-Antwort).
 */
export function isGatedOut(meta: any, state: ScopeGateState = readScopeGatesLocal()): boolean {
  const app = meta?.applicability;
  if (!app || app.presentation !== "scope_gate") return false;
  const gid = app.gate_id ?? app.scope_group;
  if (!gid) return false;
  return state[gid] === "no";
}

/** Bedingungstext einer Inline-Kontrolle (sonst ""). */
export function inlineCondition(meta: any): string {
  const app = meta?.applicability;
  if (!app || app.presentation !== "inline") return "";
  return typeof app.condition === "string" ? app.condition : "";
}

/** Signatur für Cache-Schlüssel: ändert sich, wenn eine Antwort sich ändert. */
export function scopeGateSignature(state: ScopeGateState = readScopeGatesLocal()): string {
  return Object.keys(state)
    .sort()
    .map((k) => `${k}=${state[k]}`)
    .join(",");
}
