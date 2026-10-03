/**
 * useFrameworkCatalog — returns a NIS2Category[]-shaped catalog for the
 * given framework key. NIS2 and ISO 27001 resolve synchronously from
 * bundled data. All other frameworks lazy-load from `public.controls`
 * (with 1000-row range pagination) and are memoised in-module for the
 * session so switching primary back-and-forth is instant.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  staticCatalogFor,
  buildDbCategories,
  FRAMEWORK_DB_VALUE,
  type DbControlRow,
} from "@/data/frameworkCatalogs";
import type { NIS2Category } from "@/data/nis2Controls";
import type { FrameworkKey } from "@/contexts/FrameworkContext";
import {
  isGatedOut,
  readScopeGatesLocal,
  scopeGateSignature,
} from "@/lib/applicabilityGates";

const cache = new Map<string, NIS2Category[]>();
const inflight = new Map<string, Promise<NIS2Category[]>>();

async function fetchAll(framework: string): Promise<DbControlRow[]> {
  const PAGE = 1000;
  const rows: DbControlRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const to = from + PAGE - 1;
    const { data, error } = await supabase
      .from("controls")
      .select("id, framework, req_de, req_en, meta")
      .eq("framework", framework)
      .order("id")
      .range(from, to);
    if (error) throw error;
    const chunk = (data ?? []) as DbControlRow[];
    rows.push(...chunk);
    if (chunk.length < PAGE) break;
  }
  return rows;
}

/**
 * Cache-Schlüssel enthält die Scope-Gate-Antworten: ändert der Nutzer in Phase 1
 * die Vorab-Frage (z. B. „kein TLD-Registry"), muss der Katalog neu gefiltert
 * werden statt aus dem alten Cache zu kommen.
 */
function cacheKey(key: FrameworkKey): string {
  const sig = scopeGateSignature();
  return sig ? `${key}|${sig}` : key;
}

async function loadCatalog(key: FrameworkKey): Promise<NIS2Category[]> {
  const ck = cacheKey(key);
  const cached = cache.get(ck);
  if (cached) return cached;
  const running = inflight.get(ck);
  if (running) return running;
  const dbValue = FRAMEWORK_DB_VALUE[key];
  const p = fetchAll(dbValue)
    .then((rows) => {
      // Kontrollen einer mit „Nein" beantworteten Scope-Gruppe (z. B. NIS2
      // Art. 28 für Nicht-Registries) werden gar nicht erst gefragt. In der SoA
      // erscheinen sie über die automatisch gesetzte Antwort „nicht anwendbar".
      const gateState = readScopeGatesLocal();
      const visible = rows.filter((r) => !isGatedOut(r.meta, gateState));
      const cats = buildDbCategories(visible, dbValue);
      cache.set(ck, cats);
      inflight.delete(ck);
      return cats;
    })
    .catch((err) => {
      inflight.delete(ck);
      throw err;
    });
  inflight.set(ck, p);
  return p;
}

export function useFrameworkCatalog(key: FrameworkKey): {
  categories: NIS2Category[];
  loading: boolean;
  error: string | null;
} {
  const initialStatic = staticCatalogFor(key);
  const [categories, setCategories] = useState<NIS2Category[]>(
    initialStatic ?? cache.get(cacheKey(key)) ?? [],
  );
  const [loading, setLoading] = useState<boolean>(!initialStatic && !cache.get(cacheKey(key)));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const staticCats = staticCatalogFor(key);
    if (staticCats) {
      setCategories(staticCats);
      setLoading(false);
      setError(null);
      return () => {
        cancelled = true;
      };
    }
    const cached = cache.get(cacheKey(key));
    if (cached) {
      setCategories(cached);
      setLoading(false);
      setError(null);
      return () => {
        cancelled = true;
      };
    }
    setLoading(true);
    setError(null);
    loadCatalog(key)
      .then((cats) => {
        if (cancelled) return;
        setCategories(cats);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? String(err));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { categories, loading, error };
}
