/**
 * Tier feature configuration — single source of truth for CORE / ENTERPRISE / XL
 * Roles: pro = CORE, premium = ENTERPRISE, xl = XL/Consultant, admin = all access
 */

export interface TierFeature {
  id: string;
  labelDe: string;
  labelEn: string;
  tier: "free" | "core" | "enterprise" | "xl";
}

export const TIER_FEATURES: TierFeature[] = [
  // FREE
  { id: "blog", labelDe: "Blog-Artikel", labelEn: "Blog articles", tier: "free" },
  { id: "preview", labelDe: "~10% der Inhalte je Bereich", labelEn: "~10% content per section", tier: "free" },

// CORE (pro role) — €2.900
  { id: "pipeline", labelDe: "Vollständige 18-Schritte Pipeline", labelEn: "Full 18-step pipeline", tier: "core" },
  { id: "controls", labelDe: "236 Kontrollpunkte & Gap-Analyse", labelEn: "236 controls & gap analysis", tier: "core" },
  { id: "risk", labelDe: "Risikomatrix & Reifegrad", labelEn: "Risk matrix & maturity", tier: "core" },
  { id: "policies", labelDe: "50+ Richtlinienvorlagen (DE/EN)", labelEn: "50+ policy templates (DE/EN)", tier: "core" },
  { id: "reports", labelDe: "PDF & Word Berichte", labelEn: "PDF & Word reports", tier: "core" },
  { id: "kpi", labelDe: "KPI-Dashboard", labelEn: "KPI dashboard", tier: "core" },
  { id: "email-support", labelDe: "E-Mail-Support", labelEn: "Email support", tier: "core" },
  { id: "single-user", labelDe: "1 Benutzer", labelEn: "1 user", tier: "core" },
  { id: "implementation-core", labelDe: "Erweiterte Implementierungs-Begleitung (bis zu 3h pro Jahr)", labelEn: "Extended implementation guidance (up to 3h per year)", tier: "core" },

  // ENTERPRISE (premium role) — €5.900
  { id: "multi-user-5", labelDe: "Bis zu 5 Benutzer", labelEn: "Up to 5 users", tier: "enterprise" },
  { id: "implementation-enterprise", labelDe: "Erweiterte Implementierungs-Begleitung (bis zu 6h pro Jahr)", labelEn: "Extended implementation guidance (up to 6h per year)", tier: "enterprise" },
  { id: "quarterly-review", labelDe: "Quartalsweise Review-Calls", labelEn: "Quarterly review calls", tier: "enterprise" },
  { id: "priority-support", labelDe: "Prioritäts-Support (24h)", labelEn: "Priority support (24h response)", tier: "enterprise" },
  { id: "audit-prep", labelDe: "Audit-Vorbereitung & Beratung", labelEn: "Audit preparation & consulting", tier: "enterprise" },
  { id: "dedicated-manager", labelDe: "Dedizierter Ansprechpartner", labelEn: "Dedicated account manager", tier: "enterprise" },

  // XL (xl role) — €9.900 — größere Teams & komplexe Organisationen
  { id: "multi-user-15", labelDe: "Bis zu 15 Benutzer", labelEn: "Up to 15 users", tier: "xl" },
  { id: "implementation-xl", labelDe: "Erweiterte Implementierungs-Begleitung (bis zu 10h pro Jahr)", labelEn: "Extended implementation guidance (up to 10h per year)", tier: "xl" },
  { id: "senior-manager", labelDe: "Dedizierter Senior-Ansprechpartner mit Quartals-Strategie-Reviews", labelEn: "Dedicated senior account manager with quarterly strategy reviews", tier: "xl" },
];

export function getTierName(
  isPro: boolean,
  isPremium: boolean,
  isAdmin: boolean,
  de: boolean,
  isXl: boolean = false,
  isLecturer: boolean = false,
): string {
  if (isAdmin) return "Admin";
  if (isLecturer) return "Enterprise";
  if (isXl) return "XL";
  if (isPremium) return "Enterprise";
  if (isPro) return "Core";
  return de ? "Kostenlos" : "Free";
}

export function getTierBadgeClass(isPro: boolean, isPremium: boolean, isXl: boolean = false): string {
  if (isXl) return "bg-foreground text-background";
  if (isPremium) return "gold-gradient text-accent-foreground";
  if (isPro) return "eu-gradient text-primary-foreground";
  return "bg-muted text-muted-foreground";
}

export function getFeaturesByTier(tier: "free" | "core" | "enterprise" | "xl") {
  return TIER_FEATURES.filter(f => f.tier === tier);
}

/** Seat limits per tier — keep in sync with public.org_seat_limit() in the database */
export const SEAT_LIMITS = { free: 1, core: 1, enterprise: 5, xl: 15, admin: 51, lecturer: 51 } as const;

export function getSeatLimit(flags: { isAdmin?: boolean; isLecturer?: boolean; isXl?: boolean; isPremium?: boolean; isPro?: boolean }): number {
  if (flags.isAdmin) return SEAT_LIMITS.admin;
  if (flags.isLecturer) return SEAT_LIMITS.lecturer;
  if (flags.isXl) return SEAT_LIMITS.xl;
  if (flags.isPremium) return SEAT_LIMITS.enterprise;
  if (flags.isPro) return SEAT_LIMITS.core;
  return SEAT_LIMITS.free;
}
