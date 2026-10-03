-- ============================================================================
-- Migration'lardan SONRA: yeni oluşturulan tüm public tablolar/fonksiyonlar
-- için grant'ları tekrar uygula (PostgREST rol modeli).
-- ============================================================================
GRANT ALL    ON ALL TABLES    IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES    IN SCHEMA public TO anon;
GRANT ALL    ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- pgmq kuyruk tabloları (migration çalışırken oluştu)
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'pgmq' LOOP
    EXECUTE format('GRANT ALL ON pgmq.%I TO service_role, authenticated', r.tablename);
  END LOOP;
END
$$;
