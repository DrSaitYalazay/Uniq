-- PATCH (cy): Bu migration public.controls'a TISAX ve ISO42001 kontrolleri ekler
-- ama bu iki framework'ü frameworks tablosuna hiçbir migration eklemiyordu
-- (orijinal projede uygulama/CSV-import ile eklenmişti). Taze DB'de FK ihlali
-- olmaması için eksik iki framework'ü burada idempotent seed'liyoruz.
INSERT INTO public.frameworks (code, name_de, name_en, role, uses_maturity, color, sort_order) VALUES
  ('TISAX',    'TISAX (ISA 6.0)',                    'TISAX (ISA 6.0)',                    'delta', true, '#9333EA', 160),
  ('ISO42001', 'ISO/IEC 42001 (KI-Managementsystem)','ISO/IEC 42001 (AI Management System)','spoke', true, '#14B8A6', 165)
ON CONFLICT (code) DO NOTHING;
