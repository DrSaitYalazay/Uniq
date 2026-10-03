import type { SectorPackRegistryEntry } from "./types";
import { healthcarePack } from "./healthcare";

const COMING = {
  de: "In Vorbereitung — basiert auf validierten Pilot-Daten.",
  en: "In preparation — based on validated pilot data.",
};

export const SECTOR_PACK_REGISTRY: SectorPackRegistryEntry[] = [
  { sectorKey: "health",    label_de: "Gesundheit / Krankenhaus", label_en: "Healthcare / Hospital", pack: healthcarePack },
  { sectorKey: "energy",    label_de: "Energie",                  label_en: "Energy",                pack: null, comingSoonReason_de: COMING.de, comingSoonReason_en: COMING.en },
  { sectorKey: "finance",   label_de: "Finanzen & Versicherung",  label_en: "Finance & Insurance",   pack: null, comingSoonReason_de: COMING.de, comingSoonReason_en: COMING.en },
  { sectorKey: "transport", label_de: "Transport & Verkehr",      label_en: "Transport",             pack: null, comingSoonReason_de: COMING.de, comingSoonReason_en: COMING.en },
  { sectorKey: "ict",       label_de: "IT & Telekom",             label_en: "IT & Telecom",          pack: null, comingSoonReason_de: COMING.de, comingSoonReason_en: COMING.en },
  { sectorKey: "water",     label_de: "Wasser",                   label_en: "Water",                 pack: null, comingSoonReason_de: COMING.de, comingSoonReason_en: COMING.en },
  { sectorKey: "food",      label_de: "Ernährung",                label_en: "Food",                  pack: null, comingSoonReason_de: COMING.de, comingSoonReason_en: COMING.en },
  { sectorKey: "gov",       label_de: "Staat & Verwaltung",       label_en: "Government",            pack: null, comingSoonReason_de: COMING.de, comingSoonReason_en: COMING.en },
  { sectorKey: "media",     label_de: "Medien & Kultur",          label_en: "Media & Culture",       pack: null, comingSoonReason_de: COMING.de, comingSoonReason_en: COMING.en },
  { sectorKey: "waste",     label_de: "Siedlungsabfall",          label_en: "Municipal Waste",       pack: null, comingSoonReason_de: COMING.de, comingSoonReason_en: COMING.en },
];

export function getRegistryEntry(sectorKey: string | null | undefined): SectorPackRegistryEntry | null {
  if (!sectorKey) return null;
  const k = sectorKey.toLowerCase().trim();
  return SECTOR_PACK_REGISTRY.find((e) => e.sectorKey === k) ?? null;
}

export { healthcarePack };
export type { SectorPack, SectorPackRegistryEntry } from "./types";
