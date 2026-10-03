import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { onFrameworksUpdated } from "@/lib/frameworkBus";
import { useAuth } from "@/contexts/AuthContext";


/**
 * Framework abstraction — all pipeline/UI copy must read framework-specific
 * labels and references through this context instead of hard-coding "NIS2".
 *
 * Today only NIS2 is active. When ISO 27001 / DORA / BSI are added, extending
 * FRAMEWORKS + the reference map is the only change needed; consumers stay put.
 */

export type FrameworkKey =
  | "NIS2"
  | "ISO27001"
  | "DORA"
  | "BSI_ITGS"
  | "TISAX"
  | "MaRisk"
  | "KRITIS"
  | "GDPR"
  | "CRA"
  | "AIACT"
  | "ISO42001"
  | "NIST_AI_RMF"
  | "NIST_CSF"
  | "ISO27701"
  | "BCM22301"
  | "BSI200_4"
  | "ISO27017"
  | "ISO27018"
  | "TR03183"
  // KI_SEC ist KEINE Norm, sondern ein UniqSuite-Härtungskatalog: 15 technische
  // KI-Kontrollen (Prompt Injection, Modellherkunft, Container-Isolierung …),
  // die weder der AI Act noch ISO 42001 noch ISO 27001/BSI verlangen. Bewusst
  // eigener Code, damit keine Anforderung unter einer Norm erscheint, die sie
  // nicht fordert. Entstanden aus ISO27001_AI/BSI_AI (13.09.2026, 60 → 15).
  | "KI_SEC";


export interface FrameworkDefinition {
  key: FrameworkKey;
  short: string;         // "NIS2"
  displayName: string;   // "NIS2 · EU Directive 2022/2555"
  shortDe: string;
  shortEn: string;
  fullDe: string;
  fullEn: string;
  /** Anchor label for legal reference ("EU Directive 2022/2555", "ISO/IEC 27001:2022"). */
  standard: string;
}

export const FRAMEWORKS: Record<FrameworkKey, FrameworkDefinition> = {
  NIS2: {
    key: "NIS2", short: "NIS2", displayName: "NIS2",
    shortDe: "NIS2", shortEn: "NIS2",
    fullDe: "NIS2 – EU-Richtlinie 2022/2555",
    fullEn: "NIS2 – EU Directive 2022/2555",
    standard: "EU Directive 2022/2555",
  },
  ISO27001: {
    key: "ISO27001", short: "ISO 27001", displayName: "ISO/IEC 27001",
    shortDe: "ISO 27001", shortEn: "ISO 27001",
    fullDe: "ISO/IEC 27001:2022 Informationssicherheits-Managementsystem",
    fullEn: "ISO/IEC 27001:2022 Information Security Management System",
    standard: "ISO/IEC 27001:2022",
  },
  DORA: {
    key: "DORA", short: "DORA", displayName: "DORA",
    shortDe: "DORA", shortEn: "DORA",
    fullDe: "DORA – EU-Verordnung 2022/2554",
    fullEn: "DORA – EU Regulation 2022/2554",
    standard: "EU Regulation 2022/2554",
  },
  BSI_ITGS: {
    key: "BSI_ITGS", short: "BSI IT-GS", displayName: "BSI IT-Grundschutz",
    shortDe: "BSI Grundschutz++", shortEn: "BSI IT-Grundschutz++",
    fullDe: "BSI IT-Grundschutz-Kompendium",
    fullEn: "BSI IT-Grundschutz Compendium",
    standard: "BSI 200-x",
  },
  TISAX: {
    key: "TISAX", short: "TISAX", displayName: "TISAX",
    shortDe: "TISAX ISA 6.0.2", shortEn: "TISAX ISA 6.0.2",
    fullDe: "TISAX – VDA ISA Katalog",
    fullEn: "TISAX – VDA ISA Catalog",
    standard: "VDA ISA",
  },
  MaRisk: {
    key: "MaRisk", short: "MaRisk", displayName: "MaRisk + BAIT",
    shortDe: "MaRisk + BAIT", shortEn: "MaRisk + BAIT",
    fullDe: "MaRisk / BAIT – BaFin Anforderungen",
    fullEn: "MaRisk / BAIT – BaFin Requirements",
    standard: "BaFin MaRisk / BAIT",
  },
  KRITIS: {
    key: "KRITIS", short: "KRITIS", displayName: "KRITIS (B3S)",
    shortDe: "KRITIS (B3S)", shortEn: "KRITIS (B3S)",
    fullDe: "KRITIS – Branchenspezifischer Sicherheitsstandard (B3S)",
    fullEn: "KRITIS – Sector-specific Security Standard (B3S)",
    standard: "BSI-KritisV / B3S",
  },
  GDPR: {
    key: "GDPR", short: "GDPR", displayName: "DSGVO / GDPR",
    shortDe: "DSGVO", shortEn: "GDPR",
    fullDe: "Datenschutz-Grundverordnung (DSGVO)",
    fullEn: "General Data Protection Regulation (GDPR)",
    standard: "EU Regulation 2016/679",
  },
  CRA: {
    key: "CRA", short: "CRA", displayName: "EU Cyber Resilience Act",
    shortDe: "CRA", shortEn: "CRA",
    fullDe: "CRA – EU Cyber Resilience Act",
    fullEn: "CRA – EU Cyber Resilience Act",
    standard: "EU Regulation (CRA)",
  },
  AIACT: {
    key: "AIACT", short: "AI Act", displayName: "EU AI Act",
    shortDe: "EU AI Act", shortEn: "EU AI Act",
    fullDe: "EU KI-Verordnung (AI Act)",
    fullEn: "EU AI Act",
    standard: "EU Regulation 2024/1689",
  },
  ISO42001: {
    key: "ISO42001", short: "ISO 42001", displayName: "ISO/IEC 42001 (AIMS)",
    shortDe: "ISO/IEC 42001 (AIMS)", shortEn: "ISO/IEC 42001 (AIMS)",
    fullDe: "ISO/IEC 42001 – AI Management System",
    fullEn: "ISO/IEC 42001 – AI Management System",
    standard: "ISO/IEC 42001",
  },
  NIST_AI_RMF: {
    key: "NIST_AI_RMF", short: "NIST AI RMF", displayName: "NIST AI RMF 1.0",
    shortDe: "NIST AI RMF 1.0", shortEn: "NIST AI RMF 1.0",
    fullDe: "NIST AI Risk Management Framework 1.0",
    fullEn: "NIST AI Risk Management Framework 1.0",
    standard: "NIST AI RMF 1.0",
  },
  NIST_CSF: {
    key: "NIST_CSF", short: "NIST CSF", displayName: "NIST CSF 2.0",
    shortDe: "NIST CSF 2.0", shortEn: "NIST CSF 2.0",
    fullDe: "NIST Cybersecurity Framework 2.0",
    fullEn: "NIST Cybersecurity Framework 2.0",
    standard: "NIST CSF 2.0",
  },
  ISO27701: {
    key: "ISO27701", short: "ISO 27701", displayName: "ISO/IEC 27701 (PIMS)",
    shortDe: "ISO/IEC 27701 (PIMS)", shortEn: "ISO/IEC 27701 (PIMS)",
    fullDe: "ISO/IEC 27701 – Privacy Information Management",
    fullEn: "ISO/IEC 27701 – Privacy Information Management",
    standard: "ISO/IEC 27701",
  },
  BCM22301: {
    key: "BCM22301", short: "ISO 22301", displayName: "ISO 22301 (BCMS)",
    shortDe: "ISO 22301 (BCMS)", shortEn: "ISO 22301 (BCMS)",
    fullDe: "ISO 22301 – Business Continuity Management",
    fullEn: "ISO 22301 – Business Continuity Management",
    standard: "ISO 22301",
  },
  BSI200_4: {
    key: "BSI200_4", short: "BSI 200-4", displayName: "BSI 200-4 Notfallmanagement",
    shortDe: "BSI 200-4 Notfallmanagement", shortEn: "BSI 200-4 Business Continuity",
    fullDe: "BSI 200-4 Notfallmanagement",
    fullEn: "BSI 200-4 Business Continuity",
    standard: "BSI 200-4",
  },
  ISO27017: {
    key: "ISO27017", short: "ISO 27017", displayName: "ISO/IEC 27017 (Cloud)",
    shortDe: "ISO/IEC 27017 (Cloud)", shortEn: "ISO/IEC 27017 (Cloud)",
    fullDe: "ISO/IEC 27017:2015 – Cloud-spezifische Sicherheitskontrollen",
    fullEn: "ISO/IEC 27017:2015 – Cloud-specific security controls",
    standard: "ISO/IEC 27017:2015",
  },
  ISO27018: {
    key: "ISO27018", short: "ISO 27018", displayName: "ISO/IEC 27018 (PII Cloud)",
    shortDe: "ISO/IEC 27018 (PII Cloud)", shortEn: "ISO/IEC 27018 (PII Cloud)",
    fullDe: "ISO/IEC 27018:2019 – Schutz personenbezogener Daten in Public Clouds",
    fullEn: "ISO/IEC 27018:2019 – Protection of PII in public clouds",
    standard: "ISO/IEC 27018:2019",
  },
  TR03183: {
    key: "TR03183", short: "TR-03183", displayName: "BSI TR-03183 (CRA-technisch)",
    shortDe: "BSI TR-03183", shortEn: "BSI TR-03183",
    fullDe: "BSI TR-03183 – Technische Anforderungen zum CRA (SBOM, CVD)",
    fullEn: "BSI TR-03183 – Technical requirements for CRA (SBOM, CVD)",
    standard: "BSI TR-03183",
  },
  KI_SEC: {
    key: "KI_SEC", short: "KI-Sicherheit", displayName: "KI-Sicherheit (UniqSuite-Härtung)",
    shortDe: "KI-Sicherheit", shortEn: "AI Security",
    fullDe: "KI-Sicherheit – technische Härtung (UniqSuite-Katalog, keine Zertifizierungsnorm)",
    fullEn: "AI Security – technical hardening (UniqSuite catalogue, not a certification standard)",
    standard: "UniqSuite-Härtung · OWASP LLM Top 10 2026 · BSI 200-2 · AIC4",
  },
};



/**
 * Capability -> per-framework clause reference. Extend as new frameworks land.
 * Consumers call frameworkRef("access-control") to get the right label.
 */
const REFERENCE_MAP: Record<string, Partial<Record<FrameworkKey, string>>> = {
  "access-control": {
    NIS2: "NIS2 Art. 21 (2)(i)",
    ISO27001: "ISO/IEC 27001 A.5.15",
    DORA: "DORA Art. 9",
  },
  "incident-management": {
    NIS2: "NIS2 Art. 23",
    ISO27001: "ISO/IEC 27001 A.5.24",
    DORA: "DORA Art. 17",
  },
  "risk-management": {
    NIS2: "NIS2 Art. 21 (2)(a)",
    ISO27001: "ISO/IEC 27001 Cl. 6.1",
    DORA: "DORA Art. 6",
  },
  "supply-chain": {
    NIS2: "NIS2 Art. 21 (2)(d)",
    ISO27001: "ISO/IEC 27001 A.5.19",
    DORA: "DORA Art. 28",
  },
  "business-continuity": {
    NIS2: "NIS2 Art. 21 (2)(c)",
    ISO27001: "ISO/IEC 27001 A.5.29",
    DORA: "DORA Art. 11",
  },
  "cryptography": {
    NIS2: "NIS2 Art. 21 (2)(h)",
    ISO27001: "ISO/IEC 27001 A.8.24",
  },
  "training": {
    NIS2: "NIS2 Art. 20 (2)",
    ISO27001: "ISO/IEC 27001 A.6.3",
  },
};

interface FrameworkContextType {
  primary: FrameworkDefinition;
  active: FrameworkDefinition[];
  setPrimary: (key: FrameworkKey) => void;
  toggleActive: (key: FrameworkKey) => void;
  /** Localised reference label for a capability under the primary framework. */
  frameworkRef: (capability: string) => string;
}

const FrameworkContext = createContext<FrameworkContextType | undefined>(undefined);

const STORAGE_PRIMARY = "cws.framework.primary";
const STORAGE_ACTIVE = "cws.framework.active";

export const FrameworkProvider = ({ children }: { children: ReactNode }) => {
  const { tenantId } = useAuth();
  // CWS: NIS2 KEINE Standardvorauswahl. Frameworks werden ausschließlich in
  // Schritt 1 (Unternehmensprofil) gewählt. Ohne Auswahl: leer (kein NIS2).
  // primaryKey nutzt ISO 27001 (Hub) nur als neutrales Label-Fallback.
  const [primaryKey, setPrimaryKey] = useState<FrameworkKey>(() => {
    if (typeof window === "undefined") return "ISO27001";
    const stored = localStorage.getItem(STORAGE_PRIMARY) as FrameworkKey | null;
    return stored && FRAMEWORKS[stored] ? stored : "ISO27001";
  });

  const [activeKeys, setActiveKeys] = useState<FrameworkKey[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_ACTIVE);
      const parsed = raw ? (JSON.parse(raw) as FrameworkKey[]) : [];
      return parsed.filter((k): k is FrameworkKey => k in FRAMEWORKS);
    } catch {
      return [];
    }
  });

  const setPrimary = useCallback((key: FrameworkKey) => {
    setPrimaryKey(key);
    setActiveKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_PRIMARY, key);
    }
  }, []);

  const toggleActive = useCallback((key: FrameworkKey) => {
    setActiveKeys((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      // Keep primary in active
      const withPrimary = next.includes(primaryKey) ? next : [primaryKey, ...next];
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_ACTIVE, JSON.stringify(withPrimary));
      }
      return withPrimary;
    });
  }, [primaryKey]);

  // ── Sync active frameworks with Step 1 (company_profiles.enabled_frameworks) ──
  // DB codes map identity to FrameworkKey except for BSI (→ BSI_ITGS).
  const codeToKey = useCallback((code: string): FrameworkKey | null => {
    const normalized = code === "BSI" ? "BSI_ITGS" : code;
    return normalized in FRAMEWORKS ? (normalized as FrameworkKey) : null;
  }, []);

  const applyEnabledFromDb = useCallback((codes: string[]) => {
    const keys = codes.map(codeToKey).filter((k): k is FrameworkKey => !!k);
    if (keys.length === 0) return;
    setActiveKeys(keys);
    setPrimaryKey((prev) => (keys.includes(prev) ? prev : keys[0]));
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_ACTIVE, JSON.stringify(keys));
      if (!keys.includes(primaryKey)) {
        localStorage.setItem(STORAGE_PRIMARY, keys[0]);
      }
    }
  }, [codeToKey, primaryKey]);

  // Aktive Frameworks aus der Mandanten-Zeile lesen (tenantId = Owner-ID, damit
  // Org-Mitglieder & Dozenten-„View-as" dieselben Frameworks sehen wie
  // Assessment/Audit/useComplianceOverview — EINE Quelle der Wahrheit).
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("company_profiles")
        .select("enabled_frameworks")
        .eq("user_id", tenantId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      const codes = ((data?.enabled_frameworks ?? []) as string[]).filter(Boolean);
      if (codes.length > 0) applyEnabledFromDb(codes);
    })();
    const off = onFrameworksUpdated(({ enabled_frameworks }) => {
      applyEnabledFromDb(enabled_frameworks);
    });
    return () => {
      cancelled = true;
      off();
    };
  }, [applyEnabledFromDb, tenantId]);



  const frameworkRef = useCallback(
    (capability: string) => {
      const map = REFERENCE_MAP[capability];
      return map?.[primaryKey] ?? FRAMEWORKS[primaryKey].short;
    },
    [primaryKey],
  );

  const value = useMemo<FrameworkContextType>(
    () => ({
      primary: FRAMEWORKS[primaryKey],
      active: activeKeys.map((k) => FRAMEWORKS[k]),
      setPrimary,
      toggleActive,
      frameworkRef,
    }),
    [primaryKey, activeKeys, setPrimary, toggleActive, frameworkRef],
  );

  return <FrameworkContext.Provider value={value}>{children}</FrameworkContext.Provider>;
};

export const useFramework = () => {
  const ctx = useContext(FrameworkContext);
  if (!ctx) throw new Error("useFramework must be used within FrameworkProvider");
  return ctx;
};
