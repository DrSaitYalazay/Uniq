// Sector-Pack data model — "Service + Asset + Dependency" bundles
// pre-validated per industry, loaded in one transaction in Phase 2 (Inventar).

export interface SectorPackAsset {
  asset_name: string;
  asset_type: "Application" | "Database" | "Server" | "Network" | "Endpoint" | "Cloud" | "SaaS" | "Data" | "AI Model" | "Document" | "Other";
  environment: "Production" | "Staging" | "Development" | "DR";
  vendor?: string;
  data_sensitivity?: "Public" | "Normal" | "Confidential" | "Highly Confidential";
  external_exposure?: boolean;
  instance_count?: number;
  notes?: string;
}

export interface SectorPackDependency {
  /** matches an `asset_name` in the pack */
  source_asset_name: string;
  /** matches another existing `asset_name` in the pack */
  target_asset_name: string;
  description: string;
}

export interface SectorPackService {
  service_name: string;
  category: "Business" | "Support" | "IT";
  criticality: number; // 0-4
  description?: string;
  owner?: string;
  rto_hours?: number;
  rpo_hours?: number;
  assets: SectorPackAsset[];
}

export interface SectorPack {
  id: string;
  sectorKey: string;
  label_de: string;
  label_en: string;
  source_de: string;
  source_en: string;
  services: SectorPackService[];
  dependencies: SectorPackDependency[];
}

export interface SectorPackRegistryEntry {
  sectorKey: string;
  label_de: string;
  label_en: string;
  pack: SectorPack | null;
  comingSoonReason_de?: string;
  comingSoonReason_en?: string;
}
