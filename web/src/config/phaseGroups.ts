/**
 * 7-phase PDCA pipeline (framework-independent control-node architecture).
 * Each phase is a single top-level route. Sub-tabs (if any) come later.
 *
 * NOTE: The old 18-step PIPELINE_STEPS array has been removed. Legacy code
 * that referenced individual step paths (/services, /assets, /baseline, ...)
 * has been deleted as part of the cleanup for the new build.
 */
import {
  ClipboardList,
  Boxes,
  Gauge,
  ScrollText,
  Wrench,
  Route,
  Repeat,
  FileText,
  LayoutDashboard,
  GraduationCap,
  ShieldAlert,
  FolderArchive,
  ShoppingCart,
  Truck,
  Network,
  ShieldCheck,
  Activity,
  Radar,
  Brain,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

export interface PhaseGroup {
  id: string;
  path: string;
  de: string;
  en: string;
  icon: LucideIcon;
  pdca: "P" | "D" | "C" | "A" | "CA";
}

export const PHASE_GROUPS_V2: PhaseGroup[] = [
  { id: "scope",          path: "/context",        de: "Scope & Kontext",  en: "Scope & Context",   icon: ClipboardList, pdca: "P"  },
  { id: "inventory",      path: "/inventory",      de: "Inventar", en: "Inventory", icon: Boxes, pdca: "P" },
  { id: "assessment",     path: "/assessment",     de: "Gap-Analyse",      en: "Gap Analysis",      icon: Gauge,         pdca: "P"  },
  { id: "decision",       path: "/decision",       de: "Risikoanalyse",    en: "Risk Analysis",     icon: ScrollText,    pdca: "P"  },

  { id: "roadmap",        path: "/roadmap",        de: "SoA & Roadmap",    en: "SoA & Roadmap",     icon: Route,         pdca: "D"  },
  { id: "implementation", path: "/implementation", de: "Umsetzung",        en: "Implementation",    icon: Wrench,        pdca: "D"  },
  { id: "audit",          path: "/audit",          de: "Audit & KVP",      en: "Audit & CI",        icon: Repeat,        pdca: "CA" },
];

/** Standalone tools — NOT part of the numbered pipeline. Rendered separately
 *  in the sidebar (no step number, no PDCA badge). */
export const STANDALONE_TOOLS: PhaseGroup[] = [
  { id: "dashboard", path: "/dashboard", de: "Management-Dashboard", en: "Management Dashboard", icon: LayoutDashboard, pdca: "C" },
  { id: "policies",  path: "/policies",  de: "Richtlinien",          en: "Policies",             icon: FileText,        pdca: "D" },
  { id: "trainings", path: "/trainings", de: "Schulungen",           en: "Trainings",            icon: GraduationCap,   pdca: "D" },
  { id: "incidents", path: "/incidents", de: "Incident-Management",   en: "Incident Management",  icon: ShieldAlert,     pdca: "A" },
  { id: "documents", path: "/documents", de: "Dokumenten-Lebenszyklus", en: "Document Lifecycle", icon: FolderArchive,  pdca: "D" },
  { id: "procurement", path: "/procurement", de: "Beschaffungs-Freigabe", en: "Procurement Approval", icon: ShoppingCart, pdca: "P" },
  { id: "suppliers", path: "/suppliers", de: "Lieferanten-Check",     en: "Supplier Check",       icon: Truck,           pdca: "P" },
  { id: "tprm", path: "/tprm", de: "Drittparteien / TPRM", en: "Third-party / TPRM", icon: Network, pdca: "P" },
  { id: "datenschutz-cockpit", path: "/datenschutz-cockpit", de: "Datenschutz-Cockpit", en: "Privacy Cockpit", icon: ShieldCheck, pdca: "D" },
  { id: "bcm", path: "/bcm", de: "BCM & Resilienz", en: "BCM & Resilience", icon: Activity, pdca: "A" },
  { id: "ki-governance", path: "/ki-governance", de: "KI-Governance", en: "AI Governance", icon: Brain, pdca: "D" },
  { id: "management-review", path: "/management-review", de: "Management-Review", en: "Management Review", icon: ClipboardCheck, pdca: "C" },
  { id: "control-monitoring", path: "/control-monitoring", de: "Control-Monitoring", en: "Control Monitoring", icon: Radar, pdca: "C" },
];

export const pdcaTitle = (p: PhaseGroup["pdca"]) =>
  p === "P" ? "Plan" : p === "D" ? "Do" : p === "C" ? "Check" : p === "A" ? "Act" : "Check + Act";
