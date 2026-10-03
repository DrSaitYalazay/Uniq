/**
 * companyBrand — single source of truth for the tenant's company name and
 * uploaded logo. Used across the UI header and every PDF/Word report.
 *
 * Design notes:
 * - The Storage bucket `company-logos` is PRIVATE. We store the storage
 *   path in `company_profiles.logo_url` and download the file on demand to
 *   a base64 dataURL, which is embedded in reports and shown in the UI.
 * - We cache the loaded brand in-memory + localStorage so downstream code
 *   (report generators) does not need to await another network round trip.
 */
import { supabase } from "@/integrations/supabase/client";

export interface CompanyBrand {
  companyName: string;
  logoDataUrl: string | null; // base64 dataURL for direct embedding
  logoPath: string | null;    // storage object path (tenantId/filename)
}

const LS_KEY = "company_brand_v1";
const LOGO_BUCKET = "company-logos";

let cache: CompanyBrand = { companyName: "", logoDataUrl: null, logoPath: null };
let hydrated = false;
const listeners = new Set<(b: CompanyBrand) => void>();

function loadFromLocalStorage(): CompanyBrand | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.companyName !== "string") return null;
    return {
      companyName: parsed.companyName ?? "",
      logoDataUrl: parsed.logoDataUrl ?? null,
      logoPath: parsed.logoPath ?? null,
    };
  } catch {
    return null;
  }
}

function saveToLocalStorage(b: CompanyBrand) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(b));
  } catch {
    /* quota — skip */
  }
}

function emit() {
  for (const l of Array.from(listeners)) {
    try { l(cache); } catch { /* ignore */ }
  }
}

export function getCompanyBrand(): CompanyBrand {
  if (!hydrated) {
    const ls = loadFromLocalStorage();
    if (ls) cache = ls;
    hydrated = true;
  }
  return cache;
}

export function setCompanyBrand(patch: Partial<CompanyBrand>) {
  cache = { ...getCompanyBrand(), ...patch };
  saveToLocalStorage(cache);
  emit();
}

export function subscribeCompanyBrand(fn: (b: CompanyBrand) => void): () => void {
  listeners.add(fn);
  // fire immediately with current value
  try { fn(getCompanyBrand()); } catch { /* ignore */ }
  return () => { listeners.delete(fn); };
}

export function clearCompanyBrand() {
  cache = { companyName: "", logoDataUrl: null, logoPath: null };
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  emit();
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Download logo bytes from the private bucket → dataURL. */
export async function downloadLogoDataUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(LOGO_BUCKET).download(path);
  if (error || !data) return null;
  try { return await blobToDataUrl(data); } catch { return null; }
}

/**
 * Load the current tenant's brand from `company_profiles` (name + logo_url),
 * download the logo file if present, and populate the cache.
 * Safe to call multiple times; downstream subscribers get notified.
 */
export async function hydrateCompanyBrandFromCloud(tenantId: string): Promise<void> {
  if (!tenantId) return;
  const { data } = await supabase
    .from("company_profiles")
    .select("company_name, logo_url")
    .eq("user_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return;

  const nextName = (data.company_name ?? "").trim();
  const nextPath = (data.logo_url ?? "").trim() || null;
  const current = getCompanyBrand();

  // Only re-download if the path changed
  let nextDataUrl = current.logoDataUrl;
  if (nextPath && nextPath !== current.logoPath) {
    nextDataUrl = await downloadLogoDataUrl(nextPath);
  } else if (!nextPath) {
    nextDataUrl = null;
  }

  setCompanyBrand({
    companyName: nextName,
    logoDataUrl: nextDataUrl,
    logoPath: nextPath,
  });
}

/**
 * Upload a new logo image for the tenant. Returns the storage path.
 * Also updates the in-memory cache with the fresh dataURL.
 */
export async function uploadCompanyLogo(
  tenantId: string,
  file: File,
): Promise<{ path: string; dataUrl: string }> {
  if (!tenantId) throw new Error("missing tenantId");
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${tenantId}/logo-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || "image/png" });
  if (error) throw error;

  const dataUrl = await blobToDataUrl(file);
  setCompanyBrand({ logoPath: path, logoDataUrl: dataUrl });
  return { path, dataUrl };
}

/** Delete the tenant's logo file from storage and clear cache. */
export async function removeCompanyLogo(currentPath: string | null | undefined) {
  if (currentPath) {
    try { await supabase.storage.from(LOGO_BUCKET).remove([currentPath]); } catch { /* ignore */ }
  }
  setCompanyBrand({ logoPath: null, logoDataUrl: null });
}

/* ------------------------------------------------------------------------ */
/*  Standard-Logo: Anfangsbuchstabe des Firmennamens (2026-09-10)             */
/* ------------------------------------------------------------------------ */

/** Erster Buchstabe des Firmennamens (Unicode-sicher, Großschreibung), "" wenn leer. */
export function companyInitial(name: string | null | undefined): string {
  const t = (name ?? "").trim();
  if (!t) return "";
  const first = Array.from(t)[0] ?? "";
  return first.toLocaleUpperCase("de-DE");
}

/**
 * Logo für Berichte/HTML: hochgeladenes Logo, sonst generiertes SVG mit dem
 * Anfangsbuchstaben in der AKTUELLEN Akzentfarbe (Verlauf hell→Akzent).
 * `accentHex`/`accent2Hex` werden vom Aufrufer aus accentTheme gereicht, damit
 * dieses Modul keinen Import-Zyklus bekommt.
 */
export function brandLogoDataUrl(brand: CompanyBrand, accentHex: string, accent2Hex: string): string | null {
  if (brand.logoDataUrl) return brand.logoDataUrl;
  const ch = companyInitial(brand.companyName);
  if (!ch) return null;
  const esc = (x: string) => x.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${accent2Hex}"/><stop offset="1" stop-color="${accentHex}"/></linearGradient></defs>
  <rect width="64" height="64" rx="12" fill="#ffffff"/>
  <text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="Inter, system-ui, Arial, sans-serif" font-weight="800" font-size="38" fill="url(#g)">${esc(ch)}</text>
</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
