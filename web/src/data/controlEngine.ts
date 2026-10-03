/**
 * Asset-Driven Control Engine
 * 
 * Transforms the domain-based control structure (A.5–A.8) into an
 * asset-class-driven assessment engine. All 236 controls remain intact
 * with original IDs and descriptions — only the structure changes.
 * 
 * Flow: Asset Class → Control Families → Control IDs
 */

import { nis2Domains, type ControlQuestion } from "./nis2Controls";
import { zokNodes } from "./zielobjektkategorien";

// =============================================
// 1. ASSET CLASSES
// =============================================

/**
 * Asset Class IDs are aligned with the 10 BSI Grundschutz++ ZOK roots
 * (Zielobjektkategorien — Level 1). This is the engine grouping used in
 * Step 6 (Baseline Assessment) and Step 7 (Gap Analysis).
 *
 * Drill-down to ZOK Level 2+ (e.g. SCADA, PLC, SIS under ics_ot) is
 * handled in the asset inventory layer (Step 4) and may be surfaced in
 * future engine phases.
 */
export type AssetClassId =
  | "standorte"
  | "nutzende"
  | "netze"
  | "it_systeme"
  | "ics_ot"
  | "iot"
  | "prozesse"
  | "lieferanten"
  | "informationen"
  | "anwendungen";

export interface AssetClass {
  id: AssetClassId;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  /** Which control families apply to this asset class */
  families: ControlFamilyId[];
}

/**
 * 10 ZOK roots (BSI Grundschutz++ Zielobjektkategorien — Level 1).
 * Family lists are derived from the legacy 12-class mapping consolidated
 * into the 10 ZOK roots.
 */
export const assetClasses: AssetClass[] = [
  {
    id: "standorte",
    label: "Standorte & Räume",
    labelEn: "Sites & Rooms",
    description: "Liegenschaften, Gebäude, Räume, Serverräume, Rechenzentren",
    descriptionEn: "Sites, buildings, rooms, server rooms, data centers",
    icon: "building-2",
    families: [
      "governance", "physical_security", "compliance_audit",
      "business_continuity", "asset_mgmt",
    ],
  },
  {
    id: "nutzende",
    label: "Nutzende",
    labelEn: "Users",
    description: "Mitarbeitende, Führungskräfte, Administrierende, Externe",
    descriptionEn: "Employees, managers, administrators, externals",
    icon: "users",
    families: [
      "personnel_security", "identity_access_mgmt", "awareness_training",
      "governance", "compliance_audit",
    ],
  },
  {
    id: "netze",
    label: "Netze",
    labelEn: "Networks",
    description: "Interne/externe Netze, WLAN, VPN, Internet-Anbindung, WAN",
    descriptionEn: "Internal/external networks, WLAN, VPN, internet uplink, WAN",
    icon: "network",
    families: [
      "network_security", "monitoring_logging", "cryptography",
      "vulnerability_mgmt", "incident_mgmt", "asset_mgmt",
    ],
  },
  {
    id: "it_systeme",
    label: "IT-Systeme",
    labelEn: "IT Systems",
    description: "Hostsysteme, Endgeräte, Mobilgeräte, Netzkomponenten, Speicher, Drucker",
    descriptionEn: "Hosts, endpoints, mobile devices, network components, storage, printers",
    icon: "server",
    families: [
      "asset_mgmt", "endpoint_security", "vulnerability_mgmt",
      "monitoring_logging", "business_continuity", "cryptography",
      "incident_mgmt", "identity_access_mgmt", "physical_security",
      "data_protection",
    ],
  },
  {
    id: "ics_ot",
    label: "ICS / OT",
    labelEn: "ICS / OT",
    description: "SCADA / Leitsysteme, SPS/PLC, Sensoren/Aktoren, Safety-Systeme, Maschinen, Fernwartung OT",
    descriptionEn: "SCADA / control systems, PLC, sensors/actuators, safety systems, machines, remote OT maintenance",
    icon: "factory",
    families: [
      "network_security", "physical_security", "vulnerability_mgmt",
      "monitoring_logging", "incident_mgmt", "business_continuity",
      "asset_mgmt", "identity_access_mgmt",
    ],
  },
  {
    id: "iot",
    label: "IoT",
    labelEn: "IoT",
    description: "Vernetzte Geräte mit eingeschränkter Härtbarkeit (Smart-Building, Sensorik, Wearables)",
    descriptionEn: "Connected devices with limited hardenability (smart building, sensors, wearables)",
    icon: "radio",
    families: [
      "asset_mgmt", "vulnerability_mgmt", "network_security",
      "monitoring_logging",
    ],
  },
  {
    id: "prozesse",
    label: "Prozesse",
    labelEn: "Processes",
    description: "Geschäftsprozesse, Fachverfahren — ISO 27005 Primary Asset",
    descriptionEn: "Business processes, technical procedures — ISO 27005 primary asset",
    icon: "workflow",
    families: [
      "governance", "risk_mgmt", "business_continuity", "compliance_audit",
    ],
  },
  {
    id: "lieferanten",
    label: "Lieferanten / Dienstleister",
    labelEn: "Suppliers / Service Providers",
    description: "Lieferketten, kritische Dienstleister, Cloud-Provider — NIS2 Art. 21(2)d",
    descriptionEn: "Supply chains, critical service providers, cloud providers — NIS2 Art. 21(2)d",
    icon: "truck",
    families: [
      "supplier_security", "risk_mgmt", "compliance_audit",
      "incident_mgmt", "business_continuity", "identity_access_mgmt",
      "data_protection",
    ],
  },
  {
    id: "informationen",
    label: "Informationen",
    labelEn: "Information",
    description: "Daten, Dokumente, Datenbanken — schutzbedürftige Informationen",
    descriptionEn: "Data, documents, databases — protection-worthy information",
    icon: "database",
    families: [
      "data_protection", "cryptography", "compliance_audit",
      "governance", "asset_mgmt",
    ],
  },
  {
    id: "anwendungen",
    label: "Anwendungen",
    labelEn: "Applications",
    description: "Webanwendungen, Office, E-Mail, Verzeichnisdienste, Cloud-Services, Sicherheits-Tools",
    descriptionEn: "Web apps, office, email, directory services, cloud services, security tools",
    icon: "app-window",
    families: [
      "governance", "identity_access_mgmt", "vulnerability_mgmt",
      "secure_development", "monitoring_logging", "data_protection",
      "incident_mgmt", "compliance_audit", "cryptography",
      "business_continuity",
    ],
  },
];

// =============================================
// 2. CONTROL FAMILIES
// =============================================

export type ControlFamilyId =
  | "governance"
  | "risk_mgmt"
  | "asset_mgmt"
  | "identity_access_mgmt"
  | "mfa_strong_auth"
  | "supplier_security"
  | "incident_mgmt"
  | "business_continuity"
  | "compliance_audit"
  | "personnel_security"
  | "awareness_training"
  | "physical_security"
  | "endpoint_security"
  | "network_security"
  | "cryptography"
  | "vulnerability_mgmt"
  | "secure_development"
  | "monitoring_logging"
  | "data_protection";

export interface ControlFamily {
  id: ControlFamilyId;
  label: string;
  labelEn: string;
  icon: string;
  /** Original control IDs belonging to this family */
  controlIds: string[];
}

export const controlFamilies: ControlFamily[] = [
  {
    id: "governance",
    label: "Governance",
    labelEn: "Governance",
    icon: "shield-check",
    controlIds: [
      "a-01", "a-13", "org-01", "org-02", "org-03", "org-04",
      "a-14", "org-06", "gov-01", "gov-02",
      "reg-01", "reg-02", "gov-03", "gov-04",
      "ai-1",
    ],
  },
  {
    id: "risk_mgmt",
    label: "Risikomanagement",
    labelEn: "Risk Management",
    icon: "bar-chart",
    // a-07 (Datenklassifizierung) moved to data_protection — it's an
    // information-asset / data-governance control, not a risk-mgmt control.
    controlIds: [
      "a-02", "org-07", "org-08", "a-15", "risk-01", "risk-02", "risk-03",
    ],
  },
  {
    id: "asset_mgmt",
    label: "Asset Management",
    labelEn: "Asset Management",
    icon: "database-backup",
    controlIds: [
      "a-03", "a-04", "a-16", "org-09", "org-10", "org-11", "org-12",
      "org-13", "a-17",
    ],
  },
  {
    id: "identity_access_mgmt",
    label: "Identitäts- & Zugriffsmanagement",
    labelEn: "Identity & Access Management",
    icon: "lock",
    controlIds: [
      "org-14", "org-15", "g-01", "g-03", "g-04", "org-16", "org-17", "i-09", "g-13",
    ],
  },
  {
    id: "mfa_strong_auth",
    label: "MFA & Starke Authentifizierung",
    labelEn: "MFA & Strong Authentication",
    icon: "smartphone",
    controlIds: [
      "iam-mfa-1", "iam-mfa-2", "iam-mfa-3", "iam-mfa-4", "iam-mfa-5", "iam-mfa-6",
    ],
  },
  {
    id: "supplier_security",
    label: "Lieferantensicherheit",
    labelEn: "Supplier Security",
    icon: "link",
    controlIds: [
      "d-01", "d-02", "d-03", "d-04", "d-05", "d-06", "d-07", "d-08",
      "d-09", "d-10", "d-11", "d-12", "d-13", "org-18", "sup-01", "sup-02",
      "sup-03", "sup-04", "sup-05", "sup-06",
      "sup-7", "sup-8", "sup-9", "ai-4",
    ],
  },
  {
    id: "incident_mgmt",
    label: "Vorfallmanagement",
    labelEn: "Incident Management",
    icon: "alert-triangle",
    controlIds: [
      "b-01", "b-02", "b-03", "b-04", "b-05", "b-06", "b-07", "b-08",
      "b-09", "b-11", "b-12", "b-13", "b-14", "inc-01", "inc-comm-1", "inc-comm-2", "inc-comm-3", "inc-17", "ai-5",
    ],
  },
  {
    id: "business_continuity",
    label: "Business Continuity",
    labelEn: "Business Continuity",
    icon: "database-backup",
    controlIds: [
      "c-01", "c-02", "c-03", "c-04", "c-05", "c-06", "c-07", "c-08",
      "c-09", "c-10", "c-11", "c-12", "c-13", "org-19", "cont-01", "cont-02",
    ],
  },
  {
    id: "compliance_audit",
    label: "Compliance & Audit",
    labelEn: "Compliance & Audit",
    icon: "bar-chart",
    controlIds: [
      "org-20", "org-22", "org-24", "org-25",
      "f-01", "f-02", "f-03", "f-04", "f-05", "f-06", "f-07", ],
  },
  {
    id: "personnel_security",
    label: "Personalsicherheit",
    labelEn: "Personnel Security",
    icon: "users",
    controlIds: [
      "i-01", "i-02", "i-03", "ppl-01", "ppl-02", "ppl-03",
    ],
  },
  {
    id: "awareness_training",
    label: "Awareness & Schulung",
    labelEn: "Awareness & Training",
    icon: "graduation-cap",
    controlIds: [
      "a-12", "g-06", "g-07", "g-08", "g-10", "g-11", "g-12",
      "ppl-04", "aw-01", "aw-02", "i-10", "i-06",
      "awr-13",
    ],
  },
  {
    id: "physical_security",
    label: "Physische Sicherheit",
    labelEn: "Physical Security",
    icon: "lock",
    controlIds: [
      "phy-01", "phy-02", "phy-03", "phy-04", "phy-05", "phy-06",
      "phy-07", "phy-08", "phy-09", "phy-10", "phy-11", "i-04", "i-05", "i-07", "i-08",
    ],
  },
  {
    id: "endpoint_security",
    label: "Endgerätesicherheit",
    labelEn: "Endpoint Security",
    icon: "monitor",
    controlIds: [
      "g-09", "e-20", "g-02", "g-05", "e-03", "e-05", "tech-01",
      "tech-03", "ep-01", "ep-02",
    ],
  },
  {
    id: "network_security",
    label: "Netzwerksicherheit",
    labelEn: "Network Security",
    icon: "network",
    // net-01 (Pen-Test) moved to vulnerability_mgmt — penetration testing is
    // security validation / vulnerability discovery, not segmentation work.
    controlIds: [
      "e-01", "e-02", "e-04", "e-06", "e-12", "e-13", "j-05", "j-06",
      "j-07", "a-08", "e-11", "tech-04", "net-02", "net-03",
      "ot-1", "ot-2", "ot-3", "ot-4",
    ],
  },
  {
    id: "cryptography",
    label: "Kryptographie",
    labelEn: "Cryptography",
    icon: "lock",
    controlIds: [
      "h-01", "h-02", "h-03", "h-04", "h-05", "h-06", "h-07", "h-08",
      "h-09", "j-01", "j-02", "j-03", "j-04",
      "cry-pq-1", "cry-pq-2",
    ],
  },
  {
    id: "vulnerability_mgmt",
    label: "Schwachstellenmanagement",
    labelEn: "Vulnerability Management",
    icon: "alert-triangle",
    // net-01 (Pen-Test) lives here — security validation discipline.
    controlIds: [
      "a-09", "e-07", "e-08", "e-09", "e-10", "a-11", "e-19", "a-05",
      "a-06", "tech-05", "tech-06", "net-01",
      "vul-7", "vul-8", "vul-9", "vul-10",
    ],
  },
  {
    id: "secure_development",
    label: "Sichere Entwicklung",
    labelEn: "Secure Development",
    icon: "code",
    controlIds: [
      "e-14", "e-16", "e-17", "e-18", "e-15", "a-18", "tech-02",
      "tech-07", "tech-08", "tech-09", "tech-10",
      "dev-12", "ai-3",
    ],
  },
  {
    id: "monitoring_logging",
    label: "Überwachung & Logging",
    labelEn: "Monitoring & Logging",
    icon: "bar-chart",
    controlIds: [
      "a-10", "b-10", "j-08", "tech-11", "tech-12", "tech-13",
    ],
  },
  {
    id: "data_protection",
    label: "Datensicherheit & Datenklassifizierung",
    labelEn: "Data Security & Classification",
    icon: "database-backup",
    // a-07 (Datenklassifizierung) lives here — data governance, not risk mgmt.
    controlIds: [
      "tech-14", "tech-15", "tech-16", "tech-17", "tech-18", "tech-19",
      "tech-20", "a-07",
      ],
  },

];

// =============================================
// 3. LOOKUP INDEXES (built once at import)
// =============================================

/** Flat map: controlId → ControlQuestion (from original nis2Controls) */
const _controlMap = new Map<string, ControlQuestion>();
for (const domain of nis2Domains) {
  for (const cat of domain.categories) {
    for (const q of cat.questions) {
      _controlMap.set(q.id, q);
    }
  }
}

/** controlId → familyId */
const _controlToFamily = new Map<string, ControlFamilyId>();
for (const family of controlFamilies) {
  for (const cid of family.controlIds) {
    _controlToFamily.set(cid, family.id);
  }
}

/** familyId → ControlFamily */
const _familyMap = new Map<ControlFamilyId, ControlFamily>();
for (const f of controlFamilies) {
  _familyMap.set(f.id, f);
}

/** assetClassId → AssetClass */
const _assetClassMap = new Map<AssetClassId, AssetClass>();
for (const ac of assetClasses) {
  _assetClassMap.set(ac.id, ac);
}

// =============================================
// 4. HELPER FUNCTIONS
// =============================================

/** Get the ControlQuestion object by its original ID */
export function getControlById(controlId: string): ControlQuestion | undefined {
  return _controlMap.get(controlId);
}

/** Get the family a control belongs to */
export function getControlFamily(controlId: string): ControlFamilyId | undefined {
  return _controlToFamily.get(controlId);
}

// --- Family display-code system (UI-only, internal IDs unchanged) ---
const FAMILY_CODE_PREFIX: Record<ControlFamilyId, string> = {
  governance: "GOV",
  risk_mgmt: "RSK",
  asset_mgmt: "AST",
  identity_access_mgmt: "IAM",
  mfa_strong_auth: "MFA",
  supplier_security: "SUP",
  incident_mgmt: "INC",
  business_continuity: "BCM",
  compliance_audit: "CMP",
  personnel_security: "PER",
  awareness_training: "AWR",
  physical_security: "PHY",
  endpoint_security: "EPS",
  network_security: "NET",
  cryptography: "CRY",
  vulnerability_mgmt: "VUL",
  secure_development: "DEV",
  monitoring_logging: "MON",
  data_protection: "DAT",
};

const _controlDisplayCode = new Map<string, string>();
for (const family of controlFamilies) {
  const prefix = FAMILY_CODE_PREFIX[family.id];
  family.controlIds.forEach((cid, idx) => {
    _controlDisplayCode.set(cid, `${prefix}-${idx + 1}`);
  });
}

/** UI display code per control (family-prefix + sequence within family).
 *  Example: "GOV-3" for organization-scoped, "GOV-A-3" for asset-scoped.
 *
 *  The "-A" infix disambiguates asset-scoped controls from organization-scoped
 *  controls that share the same family (e.g. IAM-1 org vs IAM-A-1 asset).
 *
 *  When `visibleFamilyIds` is provided, the sequence is computed against
 *  the visible-in-view controls of that family (1..N in family order), so
 *  numbers always start at 1 and have no gaps in the current view.
 *  Without `visibleFamilyIds`, falls back to the stable full-family index. */
export function getControlDisplayCode(
  controlId: string,
  visibleFamilyIds?: string[],
  scope?: "asset" | "organization",
): string {
  const infix = scope === "asset" ? "-A" : "";
  const familyId = _controlToFamily.get(controlId);
  if (familyId && visibleFamilyIds && visibleFamilyIds.length > 0) {
    const family = _familyMap.get(familyId);
    if (family) {
      const visibleSet = new Set(visibleFamilyIds);
      const visibleInFamily = family.controlIds.filter(cid => visibleSet.has(cid));
      const idx = visibleInFamily.indexOf(controlId);
      if (idx >= 0) return `${FAMILY_CODE_PREFIX[familyId]}${infix}-${idx + 1}`;
    }
  }
  const base = _controlDisplayCode.get(controlId);
  if (!base) return controlId;
  if (!infix) return base;
  // splice infix into "PREFIX-NN"
  const dash = base.indexOf("-");
  return dash > 0 ? `${base.slice(0, dash)}${infix}${base.slice(dash)}` : base;
}


/** Get all control IDs for a given asset class */
export function getControlIdsForAssetClass(assetClassId: AssetClassId): string[] {
  const ac = _assetClassMap.get(assetClassId);
  if (!ac) return [];
  const ids = new Set<string>();
  for (const familyId of ac.families) {
    const family = _familyMap.get(familyId);
    if (family) {
      for (const cid of family.controlIds) {
        ids.add(cid);
      }
    }
  }
  return Array.from(ids);
}

/** Get full ControlQuestion objects for a given asset class */
export function getControlsForAssetClass(assetClassId: AssetClassId): ControlQuestion[] {
  const ids = getControlIdsForAssetClass(assetClassId);
  return ids
    .map(id => _controlMap.get(id))
    .filter((q): q is ControlQuestion => q !== undefined);
}

/** Get controls grouped by family for a given asset class */
export function getControlsByFamilyForAssetClass(
  assetClassId: AssetClassId
): { family: ControlFamily; controls: ControlQuestion[] }[] {
  const ac = _assetClassMap.get(assetClassId);
  if (!ac) return [];
  return ac.families
    .map(familyId => {
      const family = _familyMap.get(familyId);
      if (!family) return null;
      const controls = family.controlIds
        .map(id => _controlMap.get(id))
        .filter((q): q is ControlQuestion => q !== undefined);
      return { family, controls };
    })
    .filter((entry): entry is { family: ControlFamily; controls: ControlQuestion[] } =>
      entry !== null && entry.controls.length > 0
    );
}

/** Get the AssetClass definition */
export function getAssetClass(id: AssetClassId): AssetClass | undefined {
  return _assetClassMap.get(id);
}

/** Get the ControlFamily definition */
export function getFamily(id: ControlFamilyId): ControlFamily | undefined {
  return _familyMap.get(id);
}

/**
 * Map a legacy DB `asset_type` string to a ZOK root (AssetClassId).
 * For new assets that already carry `zok_ids[]`, prefer `mapZokIdToRoot()`
 * which uses the BSI Grundschutz++ hierarchy directly.
 */
export function mapAssetTypeToClass(assetType: string): AssetClassId {
  const mapping: Record<string, AssetClassId> = {
    "Application": "anwendungen",
    "Server": "it_systeme",
    "Storage": "it_systeme",
    "Endpoint": "it_systeme",
    "Mobile Device": "it_systeme",
    "Printer": "it_systeme",
    "Database": "informationen",
    "Document": "informationen",
    "Cloud": "anwendungen",
    "Directory": "anwendungen",
    "Security Tool": "anwendungen",
    "Network": "netze",
    "External": "netze",
    "OT/ICS": "ics_ot",
    "SCADA": "ics_ot",
    "PLC": "ics_ot",
    "Sensor": "ics_ot",
    "Safety": "ics_ot",
    "Machine": "ics_ot",
    "IoT": "iot",
    "Process": "prozesse",
    "Supplier": "lieferanten",
    "Critical Supplier": "lieferanten",
    "Site": "standorte",
    "Room": "standorte",
    "User": "nutzende",
  };
  return mapping[assetType] ?? "anwendungen";
}

/**
 * Map a ZOK leaf id (e.g. "scada_leitsystem") to its ZOK root (AssetClassId).
 * Uses the BSI Grundschutz++ hierarchy from `zielobjektkategorien`.
 */
export function mapZokIdToRoot(zokId: string): AssetClassId | null {
  const node = _zokRootCache.get(zokId);
  return (node ?? null) as AssetClassId | null;
}

// Lazily populated lookup of zokId → root (filled on first import below)
const _zokRootCache = new Map<string, string>();
for (const node of zokNodes) {
  _zokRootCache.set(node.id, node.rootId);
}

/**
 * Resolve the engine asset class for an asset row. Prefers `zok_ids[0]`
 * when present, otherwise falls back to the legacy `asset_type`.
 */
export function resolveAssetClass(asset: {
  asset_type?: string | null;
  zok_ids?: string[] | null;
}): AssetClassId {
  const firstZok = asset.zok_ids?.[0];
  if (firstZok) {
    const root = mapZokIdToRoot(firstZok);
    if (root) return root;
  }
  return mapAssetTypeToClass(asset.asset_type ?? "");
}

// =============================================
// 5. SUB-CLASS DRILL-DOWN (Phase 2 — all 10 ZOK roots)
// =============================================

/**
 * Map of root → ZOK Level-2 leaf ids that should be exposed as sub-classes
 * in Step 6/7 drill-down. Empty array means root has no Level-2 children
 * in the BSI Grundschutz++ ZOK hierarchy (e.g. `iot`).
 *
 * Derived dynamically from `zokNodes` so it stays in sync with the
 * BSI Grundschutz++ taxonomy without manual maintenance.
 */
export const subClasses: Record<AssetClassId, string[]> = (() => {
  const map: Record<string, string[]> = {
    standorte: [], nutzende: [], netze: [], it_systeme: [],
    ics_ot: [], iot: [], prozesse: [], lieferanten: [],
    informationen: [], anwendungen: [],
  };
  for (const node of zokNodes) {
    if (node.level === 2 && node.rootId in map) {
      map[node.rootId].push(node.id);
    }
  }
  return map as Record<AssetClassId, string[]>;
})();

/**
 * Resolve the ZOK Level-2 sub-class for an asset (e.g. "scada_leitsystem").
 * Returns null when the asset's root has no drill-down or the asset is
 * tagged only at the root level.
 */
export function resolveAssetSubClass(asset: {
  asset_type?: string | null;
  zok_ids?: string[] | null;
}): string | null {
  const root = resolveAssetClass(asset);
  const subs = subClasses[root];
  if (!subs || subs.length === 0) return null;
  for (const id of asset.zok_ids ?? []) {
    if (subs.includes(id)) return id;
  }
  return null;
}

/** Total number of controls across all families (should be 236) */
export function getTotalControlCount(): number {
  return _controlMap.size;
}

/** Summary stats for an asset class */
export function getAssetClassStats(assetClassId: AssetClassId): {
  totalControls: number;
  familyCount: number;
  families: { id: ControlFamilyId; label: string; controlCount: number }[];
} {
  const ac = _assetClassMap.get(assetClassId);
  if (!ac) return { totalControls: 0, familyCount: 0, families: [] };

  const families = ac.families
    .map(fid => {
      const f = _familyMap.get(fid);
      if (!f) return null;
      return { id: f.id, label: f.label, controlCount: f.controlIds.length };
    })
    .filter((x): x is { id: ControlFamilyId; label: string; controlCount: number } => x !== null);

  const totalControls = getControlIdsForAssetClass(assetClassId).length;
  return { totalControls, familyCount: families.length, families };
}
