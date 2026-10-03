-- 2026-09-03 · wipe_tenant_data / count_tenant_data schema-sicher machen.
--
-- Befund (E2E-Test 2026-09-03, F-05): Die RPC `wipe_tenant_data` bricht auf der
-- Live-DB mit `column "user_id" does not exist` ab. Ursache: die vorige Fassung
-- (20260719000001) löscht statisch aus Tabellen, die auf der Live-DB gar nicht
-- existieren bzw. anders geartet sind (u. a. `assessment_answers`,
-- `org_assessment_answers`, `critical_services`, `evidence`, `answer_evidence` —
-- live liefert „relation … does not exist"). Da die Funktion atomar ist, trifft
-- sie die erste fehlende Tabelle und wirft — es wird NICHTS gelöscht, „Alle Daten
-- zurücksetzen" ist damit komplett funktionslos.
--
-- Fix: identische Tabellen-/Spaltenliste wie zuvor (gleiche fachliche Absicht,
-- FK-sichere Reihenfolge Kinder→Eltern), aber JEDER Schritt wird zur Laufzeit
-- übersprungen, wenn (a) die Tabelle nicht existiert (`to_regclass`) oder (b) die
-- erwartete Besitzer-Spalte fehlt (`information_schema.columns`). So läuft die
-- Funktion auf jeder Schema-Variante durch und löscht genau das, was vorhanden
-- ist. Gelöschte Tabellen und Zeilenzahlen kommen weiterhin im JSON-Ergebnis;
-- übersprungene Tabellen erscheinen als `"<tab>": "skipped"`.
--
-- Globale Kataloge (controls, control_iso, control_node_member, control_mapping,
-- frameworks, risks, control_risk) werden bewusst NICHT angetastet.

CREATE OR REPLACE FUNCTION public.wipe_tenant_data(_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  caller_tenant uuid;
  deleted jsonb := '{}'::jsonb;
  c bigint;
  t text;
  col text;
  -- (Tabelle, Besitzer-Spalte) — FK-sichere Reihenfolge: Kinder zuerst, Profil/User zuletzt.
  tbls text[] := ARRAY[
    'incident_checklist_items','incidents','audit_checklist_items','audit_findings','audits',
    'improvement_items','policy_acknowledgements','policy_versions','policy_metadata',
    'training_quiz_results','training_completions','assessment_answers','org_assessment_answers',
    'criticality_overrides','service_criticality_results','service_criticality_inputs',
    'control_test_results','answer_evidence','control_tests','evidence','quant_runs','quant_scenarios',
    'answers','roadmap_items','implementation_status','compliance_deadlines','maturity_targets',
    'kpi_snapshots','control_status_log','org_tool_data',
    'dependencies','assets','critical_services','company_profiles','user_snapshots','user_tool_data'
  ];
  cols text[] := ARRAY[
    'user_id','user_id','user_id','user_id','user_id',
    'user_id','user_id','user_id','user_id',
    'user_id','user_id','user_id','user_id',
    'user_id','user_id','user_id',
    'tenant_id','tenant_id','tenant_id','tenant_id','tenant_id','tenant_id',
    'tenant_id','user_id','tenant_id','tenant_id','tenant_id',
    'tenant_id','tenant_id','tenant_id',
    'user_id','user_id','user_id','user_id','user_id','user_id'
  ];
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  caller_tenant := COALESCE(public.get_org_owner_id(caller_id), caller_id);

  IF _tenant_id IS DISTINCT FROM caller_tenant THEN
    RAISE EXCEPTION 'cannot wipe data for a different tenant (caller_tenant=%, requested=%)',
      caller_tenant, _tenant_id;
  END IF;

  FOR t, col IN SELECT u.tab, u.ocol FROM unnest(tbls, cols) AS u(tab, ocol) LOOP
    -- (a) Tabelle vorhanden?
    IF to_regclass('public.' || t) IS NULL THEN
      deleted := deleted || jsonb_build_object(t, 'skipped');
      CONTINUE;
    END IF;
    -- (b) erwartete Besitzer-Spalte vorhanden? (sonst nicht raten — überspringen)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = col
    ) THEN
      deleted := deleted || jsonb_build_object(t, 'skipped');
      CONTINUE;
    END IF;

    EXECUTE format(
      'WITH d AS (DELETE FROM public.%I WHERE %I = $1 RETURNING 1) SELECT count(*) FROM d',
      t, col
    ) INTO c USING _tenant_id;
    deleted := deleted || jsonb_build_object(t, c);
  END LOOP;

  RETURN deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.wipe_tenant_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wipe_tenant_data(uuid) TO authenticated;


-- Verifikations-Helper identisch schema-sicher (STABLE): dieselbe Liste, gleiche
-- Guards. Nicht vorhandene Tabellen erscheinen als `"<tab>": "skipped"`.
CREATE OR REPLACE FUNCTION public.count_tenant_data(_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  caller_tenant uuid;
  counts jsonb := '{}'::jsonb;
  c bigint;
  t text;
  col text;
  tbls text[] := ARRAY[
    'assets','assessment_answers','org_assessment_answers','audit_checklist_items','audit_findings',
    'audits','company_profiles','critical_services','criticality_overrides','dependencies',
    'improvement_items','incident_checklist_items','incidents','policy_acknowledgements','policy_metadata',
    'policy_versions','service_criticality_inputs','service_criticality_results','training_completions',
    'training_quiz_results','user_snapshots','user_tool_data',
    'answers','roadmap_items','implementation_status','control_tests','control_test_results','evidence',
    'answer_evidence','compliance_deadlines','maturity_targets','kpi_snapshots','control_status_log',
    'quant_scenarios','quant_runs','org_tool_data'
  ];
  cols text[] := ARRAY[
    'user_id','user_id','user_id','user_id','user_id',
    'user_id','user_id','user_id','user_id','user_id',
    'user_id','user_id','user_id','user_id','user_id',
    'user_id','user_id','user_id','user_id',
    'user_id','user_id','user_id',
    'tenant_id','user_id','tenant_id','tenant_id','tenant_id','tenant_id',
    'tenant_id','tenant_id','tenant_id','tenant_id','tenant_id',
    'tenant_id','tenant_id','tenant_id'
  ];
BEGIN
  IF caller_id IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  caller_tenant := COALESCE(public.get_org_owner_id(caller_id), caller_id);
  IF _tenant_id IS DISTINCT FROM caller_tenant THEN
    RAISE EXCEPTION 'cannot inspect a different tenant';
  END IF;

  FOR t, col IN SELECT u.tab, u.ocol FROM unnest(tbls, cols) AS u(tab, ocol) LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      counts := counts || jsonb_build_object(t, 'skipped');
      CONTINUE;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = col
    ) THEN
      counts := counts || jsonb_build_object(t, 'skipped');
      CONTINUE;
    END IF;
    EXECUTE format('SELECT count(*) FROM public.%I WHERE %I = $1', t, col)
      INTO c USING _tenant_id;
    counts := counts || jsonb_build_object(t, c);
  END LOOP;

  RETURN counts;
END;
$$;

REVOKE ALL ON FUNCTION public.count_tenant_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_tenant_data(uuid) TO authenticated;
