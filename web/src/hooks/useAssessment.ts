/**
 * useAssessment — loads the control catalog for the selected frameworks,
 * their ISO 27001 mappings, and the tenant's answers. Provides an optimistic,
 * debounced `saveAnswer` that upserts into `public.answers`.
 *
 * Answers are keyed by (framework, control_id, asset_id). A null `asset_id`
 * represents the organization-scope answer; a uuid represents a per-asset
 * override. Both coexist thanks to the `NULLS NOT DISTINCT` unique constraint
 * on `(tenant_id, framework, control_id, asset_id)`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { AnswerRow, ControlRow, IsoMapping, AnchorRef, ControlRelation } from "@/lib/assessmentEngine";

/** Zeile aus public.control_mapping (STRM/OSCAL, partielle/gerichtete Relationen). */
interface ControlMappingRow {
  source_framework: string;
  source_control_id: string;
  target_node_id: string | null;
  target_framework: string | null;
  target_control_id: string | null;
  relation: ControlRelation;
}

const SAVE_DEBOUNCE_MS = 700;

/** Sentinel used to represent "no asset" (organization scope) inside the map key. */
const ORG_SCOPE = "__org__";

export function answerKey(framework: string, control_id: string, asset_id?: string | null): string {
  return `${framework}::${control_id}::${asset_id ?? ORG_SCOPE}`;
}

export function useAssessment(frameworks: string[]) {
  const { user, tenantId } = useAuth();
  const [controls, setControls] = useState<ControlRow[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerRow>>({});
  const [isoMappings, setIsoMappings] = useState<IsoMapping[]>([]);
  const [nodeMembers, setNodeMembers] = useState<{ node_id: string; framework: string; control_id: string }[]>([]);
  const [controlMappings, setControlMappings] = useState<ControlMappingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const saveTimers = useRef<Map<string, number>>(new Map());

  // Node-only: NUR die vom Nutzer gewählten Frameworks laden — kein erzwungenes
  // ISO27001 mehr (kein Hub). ISO nimmt nur teil, wenn es selbst gewählt ist;
  // gemeinsame Kontrollen verbinden sich framework-neutral über die Knoten.
  const activeFrameworks = useMemo(
    () => Array.from(new Set(frameworks.filter(Boolean))),
    [frameworks],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || activeFrameworks.length === 0) return;
      setLoading(true);

      async function fetchAll<T>(
        build: (from: number, to: number) => any,
      ): Promise<T[]> {
        const PAGE = 1000;
        const out: T[] = [];
        let from = 0;
        for (let i = 0; i < 50; i++) {
          const { data, error } = await build(from, from + PAGE - 1);
          if (error) throw error;
          const rows = (data ?? []) as T[];
          out.push(...rows);
          if (rows.length < PAGE) break;
          from += PAGE;
        }
        return out;
      }

      try {
        const [controlRows, mapRows, nodeRows, answerRows, mappingRows] = await Promise.all([
          fetchAll<ControlRow>((from, to) =>
            supabase
              .from("controls")
              .select("id, framework, sub_sector, req_de, req_en, muss, tags, meta, effort_pt")
              .in("framework", activeFrameworks)
              .order("id")
              .range(from, to),
          ),
          fetchAll<IsoMapping>((from, to) =>
            supabase
              .from("control_iso")
              .select("framework, control_id, iso_id")
              .in("framework", activeFrameworks)
              .order("framework").order("control_id").order("iso_id")
              .range(from, to),
          ),
          // Framework-unabhängige Kontroll-Knoten (same-as). Alle Zeilen laden —
          // die LWW-Vererbung gilt bewusst über ALLE Frameworks, auch nicht gewählte.
          fetchAll<{ node_id: string; framework: string; control_id: string }>((from, to) =>
            supabase
              .from("control_node_member")
              .select("node_id, framework, control_id")
              .order("node_id").order("framework").order("control_id")
              .range(from, to),
          ),
          fetchAll<AnswerRow>((from, to) =>
            supabase
              .from("answers")
              .select("framework, control_id, asset_id, antwort, reifegrad, evidence, note, updated_at, severity, severity_source, severity_note")
              .in("framework", activeFrameworks)
              .order("id")
              .range(from, to),
          ).catch(() =>
            // Y7: Die Severity-Spalten kommen über _ensure_runtime_tables.sql.
            // Läuft der Frontend-Stand vor der Migration, fehlen sie noch —
            // dann OHNE sie laden statt das ganze Assessment scheitern zu lassen.
            fetchAll<AnswerRow>((from, to) =>
              supabase
                .from("answers")
                .select("framework, control_id, asset_id, antwort, reifegrad, evidence, note, updated_at")
                .in("framework", activeFrameworks)
                .order("id")
                .range(from, to),
            ),
          ),
          // Partielle/gerichtete Mappings (STRM/OSCAL). Tabelle ist zunächst leer →
          // null Verhaltensänderung. Defensiv: fehlt/erroriert die Tabelle, wird []
          // genutzt (kein Abbruch des Assessment-Ladens, exakt heutiges Verhalten).
          fetchAll<ControlMappingRow>((from, to) =>
            supabase
              .from("control_mapping")
              .select("source_framework, source_control_id, target_node_id, target_framework, target_control_id, relation")
              .order("id")
              .range(from, to),
          ).catch(() => [] as ControlMappingRow[]),
        ]);

        if (cancelled) return;

        setControls(controlRows);
        setIsoMappings(mapRows);
        setNodeMembers(nodeRows);
        setControlMappings(mappingRows);
        const map: Record<string, AnswerRow> = {};
        for (const r of answerRows) {
          map[answerKey(r.framework as string, r.control_id as string, r.asset_id ?? null)] = r;
        }
        setAnswers(map);
      } catch (err: any) {
        if (!cancelled) {
          toast({ title: "Fehler beim Laden", description: err?.message ?? String(err), variant: "destructive" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, tenantId, activeFrameworks.join("|")]);


  const persistNow = useCallback(async (framework: string, controlId: string, assetId: string | null, row: AnswerRow) => {
    if (!tenantId) return;

    // Empty status → delete the specific (framework, control, asset) row.
    if (row.antwort == null) {
      let q = supabase
        .from("answers")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("framework", framework)
        .eq("control_id", controlId);
      q = assetId == null ? q.is("asset_id", null) : q.eq("asset_id", assetId);
      const { error } = await q;
      if (error) {
        toast({ title: "Speichern fehlgeschlagen", description: error.message, variant: "destructive" });
      }
      return;
    }

    const payload = {
      tenant_id: tenantId,
      framework,
      control_id: controlId,
      asset_id: assetId,
      antwort: row.antwort,
      reifegrad: row.reifegrad ?? null,
      evidence: row.evidence,
      note: row.note,
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    };
    // Y7: Abweichungsgrad nur mitschreiben, wenn der Prüfer ihn entschieden hat.
    // Ein Katalogvorschlag wird NICHT gespeichert — sonst stünde im Bericht ein
    // Vorschlag als Bewertung (assessment_contract.severity).
    const graded = row.severity_source === "pruefer" && !!row.severity;
    // Immer mitschreiben — auch als NULL. Sonst bliebe ein zurückgenommener
    // Prüferentscheid in der Datenbank stehen, während die Oberfläche schon
    // wieder den Vorschlag zeigt.
    const fullPayload = {
      ...payload,
      severity: graded ? row.severity : null,
      severity_source: graded ? "pruefer" : null,
      severity_note: graded ? (row.severity_note ?? null) : null,
      severity_by: graded ? (user?.id ?? null) : null,
      severity_at: graded ? new Date().toISOString() : null,
    };

    let { error } = await supabase
      .from("answers")
      .upsert(fullPayload, { onConflict: "tenant_id,framework,control_id,asset_id" });
    // Nur wenn die Severity-Spalten fehlen (Migration noch nicht gelaufen) ein
    // zweiter Versuch ohne sie — bei echten Fehlern (Netz, RLS) NICHT, sonst
    // würde eine Störung als „Einstufung fehlt" fehlgedeutet.
    if (error && /severity/i.test(error.message ?? "")) {
      const retry = await supabase
        .from("answers")
        .upsert(payload, { onConflict: "tenant_id,framework,control_id,asset_id" });
      error = retry.error;
      if (!error && graded) {
        toast({
          title: "Einstufung nicht gespeichert",
          description: "Die Antwort wurde gesichert. Das Feld für Haupt-/Nebenabweichung fehlt in der Datenbank noch (Migration ausstehend).",
        });
      }
    }
    if (error) {
      toast({ title: "Speichern fehlgeschlagen", description: error.message, variant: "destructive" });
    }
  }, [tenantId, user]);


  const scheduleSave = useCallback((framework: string, controlId: string, assetId: string | null) => {
    const key = answerKey(framework, controlId, assetId);
    const existing = saveTimers.current.get(key);
    if (existing) window.clearTimeout(existing);
    const handle = window.setTimeout(() => {
      const row = answersRef.current[key];
      if (row) persistNow(framework, controlId, assetId, row);
      saveTimers.current.delete(key);
    }, SAVE_DEBOUNCE_MS);
    saveTimers.current.set(key, handle);
  }, [persistNow]);

  /**
   * Anker je Kontrolle (framework-neutral, node-only):
   *   • control_mapping  — deklarierte Relationen (partiell/gerichtet); Tabelle leer ⇒ keine Wirkung.
   *   • control_node_member — strikte same-as-Knoten, relation "equal".
   * KEIN control_iso, KEIN ISO-Selbstanker. Kontrolle ohne Eintrag ⇒ unabhängig.
   */
  const anchorsBySpokeControl = useMemo(() => {
    const m = new Map<string, AnchorRef[]>();
    // control_mapping ⇒ deklarierte Relation (partiell/gerichtet).
    for (const r of controlMappings) {
      const anchorId = r.target_node_id ?? r.target_control_id;
      if (!anchorId) continue;
      const k = `${r.source_framework}::${r.source_control_id}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push({ anchorId, relation: r.relation });
    }
    // Knoten-Mitgliedschaft ⇒ relation "equal", additiv (neben control_mapping;
    // Dedupe auf gleichen equal-Anker). control_mapping leer ⇒ Ergebnis = [{node_id,"equal"}].
    for (const r of nodeMembers) {
      const k = `${r.framework}::${r.control_id}`;
      if (!m.has(k)) m.set(k, []);
      const arr = m.get(k)!;
      if (!arr.some((a) => a.anchorId === r.node_id && a.relation === "equal")) {
        arr.push({ anchorId: r.node_id, relation: "equal" });
      }
    }
    return m;
  }, [nodeMembers, controlMappings]);

  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const setAnswer = useCallback(
    (framework: string, controlId: string, patch: Partial<AnswerRow>, assetId: string | null = null) => {
      const key = answerKey(framework, controlId, assetId);
      setAnswers((prev) => {
        const next = { ...prev };
        const current = next[key] ?? {
          framework, control_id: controlId, asset_id: assetId,
          antwort: null, reifegrad: null, evidence: null, note: null,
        };
        // updated_at lokal olarak da JETZT — sonst gewinnt in projectAnswer (LWW) ein
        // geerbter ISO-Anker (mit updated_at) über die frische Direktantwort (ts=0),
        // wodurch z. B. „Alle → Nein" bei geerbten Kontrollen scheinbar nicht greift.
        //
        // Y7-Ausnahme: Eine reine Einstufung (Haupt-/Nebenabweichung) ist keine
        // neue Antwort. Würde sie updated_at anheben, verschöbe sie die
        // LWW-Reihenfolge der Vererbung — der Prüfer würde durch das Setzen
        // eines Befundgrades unbemerkt Antworten anderer Frameworks überstimmen.
        const onlySeverity = Object.keys(patch).length > 0 && Object.keys(patch).every(
          k => k === "severity" || k === "severity_source" || k === "severity_note",
        );
        next[key] = {
          ...current, ...patch, framework, control_id: controlId, asset_id: assetId,
          updated_at: onlySeverity ? current.updated_at : new Date().toISOString(),
        };
        return next;
      });
      scheduleSave(framework, controlId, assetId);
    },
    [scheduleSave],
  );

  const clearAnswer = useCallback(async (framework: string, controlId: string, assetId: string | null = null) => {
    if (!tenantId) return;
    const key = answerKey(framework, controlId, assetId);
    setAnswers((prev) => {
      const n = { ...prev }; delete n[key]; return n;
    });
    let q = supabase
      .from("answers")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("framework", framework)
      .eq("control_id", controlId);
    q = assetId == null ? q.is("asset_id", null) : q.eq("asset_id", assetId);
    await q;
  }, [tenantId]);

  return { controls, answers, isoMappings, anchorsBySpokeControl, loading, setAnswer, clearAnswer };
}
