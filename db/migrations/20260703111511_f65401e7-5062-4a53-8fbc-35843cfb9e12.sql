insert into public.frameworks (code, name_de, name_en, role, uses_maturity, color, sort_order)
values ('NIST_CSF','NIST CSF 2.0','NIST CSF 2.0','spoke', true, '#0F4C81', 90)
on conflict (code) do update set name_de=excluded.name_de, name_en=excluded.name_en, role=excluded.role, uses_maturity=excluded.uses_maturity, color=excluded.color;