-- ============================================================================
-- cy — Zeilenzahl jeder Tabelle (V-4, Wiederherstellungsprobe)
-- Eine Zeile pro Tabelle: "schema.tabelle=anzahl", sortiert.
-- Wird zweimal ausgeführt: in der Live-DB im SELBEN Snapshot wie pg_dump
-- (backup.sh nachweis) und in der zurückgespielten Wegwerf-DB. Beide Listen
-- müssen zeichengleich sein.
-- Läuft als Superuser: RLS greift dabei nicht, gezählt wird wirklich alles.
-- ============================================================================
SELECT format('%s.%s=%s', n.nspname, c.relname,
              (xpath('/row/c/text()',
                     query_to_xml(format('SELECT count(*) AS c FROM %I.%I', n.nspname, c.relname),
                                  false, true, '')))[1]::text)
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE c.relkind IN ('r', 'p')
   AND c.relpersistence <> 't'          -- temporäre Tabellen anderer Sitzungen
   AND n.nspname NOT IN ('pg_catalog', 'information_schema')
   AND n.nspname NOT LIKE 'pg\_toast%'
 ORDER BY 1;
