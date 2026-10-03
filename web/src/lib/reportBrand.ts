/**
 * reportBrand — resolves the brand name to print on every customer-facing
 * report / policy / template.
 *
 * Rule (customer white-label): the tool name "UniqSuite" NEVER appears in
 * generated deliverables. It only appears in the Auth screen, the in-app
 * sidebar, and the HTML <title> / SEO metadata.
 *
 * If the tenant has filled the Company Profile (Step 1), we use that name.
 * Otherwise we fall back to a neutral placeholder so reports still generate
 * but the customer sees they still need to complete Step 1.
 */
import { getCompanyBrand } from "@/lib/companyBrand";

export type Lang = "de" | "en";

/** Fallback brand shown when the tenant has not filled the Company Profile. */
export const BRAND_PLACEHOLDER: Record<Lang, string> = {
  de: "Ihr Unternehmen",
  en: "Your organisation",
};


/**
 * Company name to embed in reports/policies/templates.
 * Never returns the tool name — always the tenant's name or a neutral fallback.
 */
export function getReportBrandName(lang: Lang | boolean = "de"): string {
  const l: Lang = typeof lang === "boolean" ? (lang ? "de" : "en") : lang;
  const name = getCompanyBrand().companyName?.trim();
  return name || BRAND_PLACEHOLDER[l];
}

/** True when the tenant has NOT yet filled the Company Profile. */
export function isPlaceholderBrand(): boolean {
  return !getCompanyBrand().companyName?.trim();
}

/** Slug-safe brand name for use in generated file names. */
export function getReportBrandSlug(lang: Lang | boolean = "de"): string {
  return getReportBrandName(lang)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "Report";
}
