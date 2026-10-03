/**
 * demoPackage — vollständiger, wiederholbar ladbarer Demo-Datensatz
 * „Nordwerk Energie GmbH (Demo)" für NIS2, ISO/IEC 27001, EU AI Act und
 * ISO/IEC 42001.
 *
 * Laden = erst ALLE Mandantendaten löschen, dann das Paket schreiben. Danach
 * sind alle Phasen gefüllt: Scope, Inventar mit Abhängigkeiten, Gap-Analyse
 * (vier Frameworks), daraus abgeleitet Risiko/SoA/Roadmap, Umsetzung mit
 * Verlauf, Audit mit Befunden und Maßnahmen, Management-Review sowie die
 * Werkzeuge (Personen, KI-Register, Dokumente, Richtlinien, Vorfälle,
 * Lieferanten, DORA-Register, BCM, Fristen, Nachweise, KPI-Verlauf).
 *
 * Nur für den Eigentümer-Account (UI-Gate in DemoDataLoader). Geschrieben wird
 * ausschliesslich in den Mandanten des angemeldeten Nutzers (RLS).
 * Deterministisch: jeder Ladevorgang erzeugt denselben fachlichen Stand
 * (nur Zeitstempel relativ zu „heute").
 */
import { supabase } from "@/integrations/supabase/client";
import { buildUmsetzungView, type RawControl } from "@/lib/implementationEngine";
import type { Person } from "@/lib/personnel";
import type { KiSystem } from "@/lib/kiGovernance";
import { untriggeredJustification } from "@/lib/aiActMatrix";
import { catalogMetaOf } from "@/data/frameworkCatalogs";
import type { LifecycleDoc, Supplier, Dienstleister, BcmProzess } from "@/lib/tools/toolLinks";
import type { AuditRecord, AuditItem, AuditState } from "@/components/audit/auditProgram";
import { ladeZusatz, DEMO_GATE_CONTROLS, DEMO_GATE_NOTE, istPflichtKlausel } from "@/lib/demoPackageMore";

export const DEMO_TAG = "__demo__";
export const DEMO_FRAMEWORKS = ["NIS2", "ISO27001", "AIACT", "ISO42001"];
export const DEMO_COMPANY = "Nordwerk Energie GmbH (Demo)";

type Step = (msg: string) => void;
type Antwort = "ja" | "teilweise" | "nein" | "na";

// ── Hilfen ───────────────────────────────────────────────────────────────────
const tag = (d: number) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };
const iso = (d: number, h = 9) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x.toISOString(); };
/** Stabiler Hash (FNV-1a) → gleiche Antwort je Kontrolle bei jedem Laden. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0) / 0xffffffff;
}
async function q<T = any>(p: PromiseLike<{ data: T; error: any }>, was: string): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(`${was}: ${error.message ?? error}`);
  return data;
}

// ── Personen ─────────────────────────────────────────────────────────────────
export const DEMO_PEOPLE: Person[] = [
  { id: "demo-p01", name: "Dr. Katrin Weber", title: "Geschäftsführerin", department: "Geschäftsleitung", email: "k.weber@nordwerk-demo.example" },
  { id: "demo-p02", name: "Thomas Albers", title: "CISO", department: "Informationssicherheit", email: "t.albers@nordwerk-demo.example" },
  { id: "demo-p03", name: "Miriam Hoffmann", title: "IT-Leiterin", department: "IT", email: "m.hoffmann@nordwerk-demo.example" },
  { id: "demo-p04", name: "Jonas Brandt", title: "Datenschutzbeauftragter", department: "Recht & Compliance", email: "j.brandt@nordwerk-demo.example" },
  { id: "demo-p05", name: "Dr. Leyla Aydin", title: "KI-Beauftragte", department: "Digitalisierung", email: "l.aydin@nordwerk-demo.example" },
  { id: "demo-p06", name: "Stefan Kühn", title: "Leiter Netzbetrieb (OT)", department: "Netzbetrieb", email: "s.kuehn@nordwerk-demo.example" },
  { id: "demo-p07", name: "Sabine Wolff", title: "Leiterin Einkauf", department: "Einkauf", email: "s.wolff@nordwerk-demo.example" },
  { id: "demo-p08", name: "Markus Lehmann", title: "Personalleiter", department: "Personal", email: "m.lehmann@nordwerk-demo.example" },
  { id: "demo-p09", name: "Julia Schröder", title: "Compliance-Managerin", department: "Recht & Compliance", email: "j.schroeder@nordwerk-demo.example" },
  { id: "demo-p10", name: "Felix Wagner", title: "SOC-Analyst", department: "IT", email: "f.wagner@nordwerk-demo.example" },
];
const P = Object.fromEntries(DEMO_PEOPLE.map(p => [p.id, `${p.name} (${p.title})`])) as Record<string, string>;
const person = (i: number) => P[DEMO_PEOPLE[i % DEMO_PEOPLE.length].id];

// ── Inventar ─────────────────────────────────────────────────────────────────
const SERVICES = [
  { key: "netz", name: "Netzleitsystem Strom (OT)", category: "Business", criticality: 4, owner: P["demo-p06"], rto: 2, rpo: 1, description: "Steuerung und Überwachung des Mittel- und Niederspannungsnetzes (Leitwarte)." },
  { key: "abrechnung", name: "Abrechnung & Kundenportal", category: "Business", criticality: 3, owner: P["demo-p03"], rto: 24, rpo: 4, description: "Verbrauchsabrechnung, Kundenkonto, Zählerstände, Abschlagspläne." },
  { key: "prognose", name: "Last- & Erzeugungsprognose (KI)", category: "Business", criticality: 3, owner: P["demo-p05"], rto: 8, rpo: 4, description: "KI-gestützte Prognose für Netzbetrieb und Energiebeschaffung." },
  { key: "service", name: "Kundenservice (Chatbot & Callcenter)", category: "Support", criticality: 2, owner: P["demo-p09"], rto: 24, rpo: 24, description: "KI-Chatbot auf der Website, Callcenter, Ticketsystem." },
  { key: "personal", name: "Personalwesen & Bewerbermanagement", category: "Support", criticality: 2, owner: P["demo-p08"], rto: 72, rpo: 24, description: "Personalverwaltung und KI-gestützte Vorauswahl von Bewerbungen." },
  { key: "m365", name: "E-Mail & Kollaboration (M365)", category: "IT", criticality: 2, owner: P["demo-p03"], rto: 24, rpo: 8, description: "E-Mail, Teams, SharePoint, Copilot." },
  { key: "infra", name: "Zentrale IT-Infrastruktur (RZ, Netz, IAM)", category: "IT", criticality: 4, owner: P["demo-p03"], rto: 4, rpo: 1, description: "Rechenzentrum, Netzwerk, Active Directory/Entra ID, Backup." },
];
/** BIA-Assistent je Service (q1–q7, 0–4; gewichtet ergibt es die Kritikalität). */
const BIA: Record<string, Record<string, unknown>> = {
  netz: { q1: 4, q2: 4, q3: 4, q4: 3, q5: 4, q6: 4, q7: 4, mode: "wizard" },
  abrechnung: { q1: 1, q2: 3, q3: 4, q4: 3, q5: 3, q6: 4, q7: 2, mode: "wizard" },
  prognose: { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 2, q7: 3, mode: "wizard" },
  service: { q1: 0, q2: 2, q3: 3, q4: 1, q5: 2, q6: 3, q7: 1, mode: "wizard" },
  personal: { q1: 0, q2: 2, q3: 2, q4: 1, q5: 3, q6: 3, q7: 1, mode: "manual", manual_value: 2, override_reason: "Bewerberdaten besonders schützenswert — Einstufung vom Datenschutzbeauftragten bestätigt." },
  m365: { q1: 0, q2: 3, q3: 3, q4: 3, q5: 1, q6: 2, q7: 2, mode: "wizard" },
  infra: { q1: 3, q2: 4, q3: 4, q4: 4, q5: 4, q6: 3, q7: 4, mode: "wizard" },
};
const ASSETS = [
  { key: "scada", svc: "netz", name: "SCADA-Leitsystem", type: "Application", env: "Production", sens: "Highly Confidential", exposed: false, vendor: "Siemens", owner: P["demo-p06"] },
  { key: "rtu", svc: "netz", name: "Fernwirktechnik / RTUs (Umspannwerke)", type: "Network", env: "Production", sens: "Confidential", exposed: false, vendor: "ABB", owner: P["demo-p06"], count: 42 },
  { key: "historian", svc: "netz", name: "Prozessdaten-Historian", type: "Database", env: "Production", sens: "Confidential", exposed: false, vendor: "AVEVA", owner: P["demo-p06"] },
  { key: "sap", svc: "abrechnung", name: "SAP IS-U Abrechnung", type: "Application", env: "Production", sens: "Highly Confidential", exposed: false, vendor: "SAP", owner: P["demo-p03"] },
  { key: "hana", svc: "abrechnung", name: "Kundendatenbank (HANA)", type: "Database", env: "Production", sens: "Highly Confidential", exposed: false, vendor: "SAP", owner: P["demo-p03"] },
  { key: "portal", svc: "abrechnung", name: "Kundenportal (Web)", type: "Application", env: "Production", sens: "Confidential", exposed: true, vendor: "Eigenentwicklung", owner: P["demo-p03"] },
  { key: "modell", svc: "prognose", name: "Prognosemodell „Lastfluss\" (ML)", type: "AI Model", env: "Production", sens: "Confidential", exposed: false, vendor: "Eigenentwicklung", owner: P["demo-p05"] },
  { key: "mlops", svc: "prognose", name: "ML-Plattform (Azure ML)", type: "Cloud", env: "Production", sens: "Confidential", exposed: false, vendor: "Microsoft", owner: P["demo-p05"] },
  { key: "wetter", svc: "prognose", name: "Wetter- & Marktdaten-Feed", type: "SaaS", env: "Production", sens: "Normal", exposed: true, vendor: "Meteo-Datendienst", owner: P["demo-p05"] },
  { key: "chatbot", svc: "service", name: "Kunden-Chatbot (LLM)", type: "AI Model", env: "Production", sens: "Confidential", exposed: true, vendor: "Anbieter GPAI-Modell", owner: P["demo-p09"] },
  { key: "ticket", svc: "service", name: "Ticketsystem", type: "SaaS", env: "Production", sens: "Confidential", exposed: true, vendor: "ServiceDesk Cloud", owner: P["demo-p09"] },
  { key: "bewerber", svc: "personal", name: "Bewerbermanagement mit KI-Ranking", type: "SaaS", env: "Production", sens: "Highly Confidential", exposed: true, vendor: "HR-Tech Anbieter", owner: P["demo-p08"] },
  { key: "hr", svc: "personal", name: "Personalakte & Entgelt", type: "Application", env: "Production", sens: "Highly Confidential", exposed: false, vendor: "DATEV", owner: P["demo-p08"] },
  { key: "exo", svc: "m365", name: "Exchange Online / Teams", type: "SaaS", env: "Production", sens: "Confidential", exposed: true, vendor: "Microsoft", owner: P["demo-p03"] },
  { key: "copilot", svc: "m365", name: "Microsoft 365 Copilot", type: "AI Model", env: "Production", sens: "Confidential", exposed: false, vendor: "Microsoft", owner: P["demo-p03"] },
  { key: "ad", svc: "infra", name: "Active Directory / Entra ID", type: "Server", env: "Production", sens: "Highly Confidential", exposed: false, vendor: "Microsoft", owner: P["demo-p03"] },
  { key: "fw", svc: "infra", name: "Firewall-Cluster & OT-DMZ", type: "Network", env: "Production", sens: "Confidential", exposed: true, vendor: "Fortinet", owner: P["demo-p03"] },
  { key: "backup", svc: "infra", name: "Backup-System (Immutable)", type: "Server", env: "DR", sens: "Highly Confidential", exposed: false, vendor: "Veeam", owner: P["demo-p03"] },
  { key: "vm", svc: "infra", name: "Virtualisierungscluster", type: "Server", env: "Production", sens: "Confidential", exposed: false, vendor: "VMware", owner: P["demo-p03"] },
  { key: "clients", svc: "infra", name: "Arbeitsplatz-Clients (380)", type: "Endpoint", env: "Production", sens: "Normal", exposed: false, vendor: "Dell", owner: P["demo-p03"], count: 380 },
];
// Quelle hängt von Ziel ab („source → target")
const DEPS: { s: string; t: string; type: string; crit: number; spof?: boolean; note: string }[] = [
  { s: "scada", t: "rtu", type: "technical", crit: 4, spof: true, note: "Steuerbefehle an die Umspannwerke" },
  { s: "scada", t: "historian", type: "data", crit: 3, note: "Prozessdaten-Archiv" },
  { s: "scada", t: "fw", type: "technical", crit: 4, spof: true, note: "Einziger Übergang IT/OT (OT-DMZ)" },
  { s: "scada", t: "modell", type: "data", crit: 3, note: "Lastprognose als Führungsgröße für die Netzsteuerung" },
  { s: "modell", t: "mlops", type: "technical", crit: 3, note: "Training und Inferenz" },
  { s: "modell", t: "wetter", type: "data", crit: 3, spof: true, note: "Externer Datenlieferant — kein Ersatzanbieter" },
  { s: "modell", t: "historian", type: "data", crit: 3, note: "Trainingsdaten aus Prozesshistorie" },
  { s: "sap", t: "hana", type: "technical", crit: 4, spof: true, note: "Primärdatenbank Abrechnung" },
  { s: "portal", t: "sap", type: "technical", crit: 3, note: "Kundendaten, Abschläge" },
  { s: "portal", t: "fw", type: "technical", crit: 3, note: "Veröffentlichung über WAF" },
  { s: "chatbot", t: "ticket", type: "technical", crit: 2, note: "Übergabe an Mitarbeitende" },
  { s: "chatbot", t: "portal", type: "data", crit: 2, note: "Auskunft zu Vertrag und Abschlag" },
  { s: "bewerber", t: "hr", type: "data", crit: 2, note: "Übernahme eingestellter Bewerbender" },
  { s: "copilot", t: "exo", type: "technical", crit: 2, note: "Zugriff auf Postfächer und Teams-Inhalte" },
  { s: "exo", t: "ad", type: "technical", crit: 3, note: "Identitäten und MFA" },
  { s: "sap", t: "ad", type: "technical", crit: 3, note: "Anmeldung (SSO)" },
  { s: "hana", t: "backup", type: "technical", crit: 4, note: "Tägliche Sicherung, 30 Tage Aufbewahrung" },
  { s: "sap", t: "vm", type: "technical", crit: 4, spof: true, note: "Läuft auf dem Virtualisierungscluster" },
  { s: "clients", t: "ad", type: "technical", crit: 3, note: "Anmeldung, Gruppenrichtlinien" },
];

// ── KI-Register ──────────────────────────────────────────────────────────────
export const DEMO_KI: KiSystem[] = [
  { id: "demo-ki-1", name: "Lastfluss-Prognose Netzsteuerung", zweck: "Prognose von Last und Einspeisung als Führungsgröße für die Netzleitwarte (Sicherheitsbauteil Stromnetz)",
    rolle: "anbieter", risikoklasse: "hoch", gpai: false, status: "betrieb", verantwortlicher: P["demo-p05"], personenbezug: false,
    annexIII: ["kritis"], art5: [], transparenzpflicht: false, docStatus: { D25: "vorhanden", D27: "entwurf", D60: "entwurf", D63: "vorhanden", D29: "fehlt", D73: "fehlt", SCHULUNG: "vorhanden" },
    kennung: "KI-001", version: "3.2", bewertetAm: tag(-40), freigegebenVon: P["demo-p01"], nachweise: "https://intranet.example.com/ki/lastfluss/technische-doku\nhttps://intranet.example.com/ki/lastfluss/aufsicht" },
  { id: "demo-ki-2", name: "Bewerber-Ranking (HR-Tech)", zweck: "Vorauswahl und Ranking eingehender Bewerbungen für Ausbildungs- und Fachstellen",
    rolle: "betreiber", risikoklasse: "hoch", gpai: false, status: "betrieb", verantwortlicher: P["demo-p08"], personenbezug: true, friaPflicht: true,
    annexIII: ["beschaeftigung"], art5: [], transparenzpflicht: false, docStatus: { D25: "vorhanden", D63: "entwurf", D26: "fehlt", D21: "entwurf", SCHULUNG: "entwurf", INFO: "entwurf" },
    kennung: "KI-002", version: "2026.1", bewertetAm: tag(-75), freigegebenVon: P["demo-p01"], nachweise: "https://intranet.example.com/ki/bewerber-ranking/dsfa" },
  { id: "demo-ki-3", name: "Kunden-Chatbot „Nora\"", zweck: "Beantwortung von Kundenanfragen zu Tarifen, Abschlägen und Störungen auf der Website",
    rolle: "betreiber", risikoklasse: "begrenzt", gpai: true, status: "betrieb", verantwortlicher: P["demo-p09"], personenbezug: true,
    annexIII: [], art5: [], transparenzpflicht: true, docStatus: { D25: "vorhanden", SCHULUNG: "vorhanden", TRANSP: "entwurf" },
    kennung: "KI-003", version: "1.4", bewertetAm: tag(-20), freigegebenVon: P["demo-p02"] },
  { id: "demo-ki-4", name: "Microsoft 365 Copilot", zweck: "Assistenz beim Erstellen von Texten, Protokollen und Auswertungen in der Verwaltung",
    rolle: "betreiber", risikoklasse: "minimal", gpai: true, status: "planung", verantwortlicher: P["demo-p03"], personenbezug: true,
    annexIII: [], art5: [], transparenzpflicht: false, docStatus: { D25: "vorhanden", SCHULUNG: "fehlt" },
    kennung: "KI-004" },
];

// ── Dokumenten-Lebenszyklus ──────────────────────────────────────────────────
const DOCS: LifecycleDoc[] = [
  { id: "demo-d01", name: "Informationssicherheitsleitlinie", docClass: "einmalig", owner: P["demo-p02"], status: "active", lastReview: tag(-200), intervalMonths: 0, basis: "ISO 27001 5.2", notes: "Von der Geschäftsführung freigegeben." },
  { id: "demo-d02", name: "ISMS-Geltungsbereich (Scope)", docClass: "einmalig", owner: P["demo-p02"], status: "active", lastReview: tag(-190), intervalMonths: 0, basis: "ISO 27001 4.3", notes: "" },
  { id: "demo-d03", name: "Erklärung zur Anwendbarkeit (SoA)", docClass: "einmalig", owner: P["demo-p02"], status: "draft", lastReview: "", intervalMonths: 0, basis: "ISO 27001 6.1.3 d)", notes: "Wird aus Phase 05 erzeugt." },
  { id: "demo-d04", name: "Risikoregister", docClass: "register", owner: P["demo-p02"], status: "active", lastReview: tag(-40), intervalMonths: 0, basis: "ISO 27001 6.1.2", notes: "" },
  { id: "demo-d05", name: "Asset-/Inventarverzeichnis", docClass: "register", owner: P["demo-p03"], status: "active", lastReview: tag(-30), intervalMonths: 0, basis: "ISO 27001 A.5.9", notes: "" },
  { id: "demo-d06", name: "Vorfallregister", docClass: "register", owner: P["demo-p10"], status: "active", lastReview: tag(-5), intervalMonths: 0, basis: "ISO 27001 A.5.24 / NIS2 Art. 23", notes: "" },
  { id: "demo-d07", name: "Verzeichnis von Verarbeitungstätigkeiten (VVT)", docClass: "register", owner: P["demo-p04"], status: "active", lastReview: tag(-60), intervalMonths: 0, basis: "DSGVO Art. 30", notes: "" },
  { id: "demo-d08", name: "Internes ISMS-Audit", docClass: "periodisch", owner: P["demo-p09"], status: "active", lastReview: tag(-120), intervalMonths: 12, basis: "ISO 27001 9.2", notes: "" },
  { id: "demo-d09", name: "Management-Review", docClass: "periodisch", owner: P["demo-p01"], status: "active", lastReview: tag(-380), intervalMonths: 12, basis: "ISO 27001 9.3", notes: "Überfällig — Termin im Oktober." },
  { id: "demo-d10", name: "Backup-Wiederherstellungstest", docClass: "periodisch", owner: P["demo-p03"], status: "active", lastReview: tag(-210), intervalMonths: 6, basis: "ISO 27001 A.8.13", notes: "Überfällig." },
  { id: "demo-d11", name: "Notfall-/BCM-Übung", docClass: "periodisch", owner: P["demo-p06"], status: "active", lastReview: tag(-100), intervalMonths: 12, basis: "ISO 22301 8.5", notes: "Blackout-Übung Leitwarte." },
  { id: "demo-d12", name: "KI-Systemregister (KI-Inventar)", docClass: "register", owner: P["demo-p05"], status: "active", lastReview: tag(-14), intervalMonths: 0, basis: "ISO/IEC 42001 A.4 / KI-VO Art. 6", notes: "Wird im Werkzeug KI-Governance gepflegt." },
  { id: "demo-d13", name: "KI-Politik (AI Policy)", docClass: "einmalig", owner: P["demo-p05"], status: "active", lastReview: tag(-90), intervalMonths: 0, basis: "ISO/IEC 42001 5.2, A.2.2", notes: "" },
  { id: "demo-d14", name: "AIMS-Geltungsbereich", docClass: "einmalig", owner: P["demo-p05"], status: "draft", lastReview: "", intervalMonths: 0, basis: "ISO/IEC 42001 4.3", notes: "" },
  { id: "demo-d15", name: "Grundrechte-Folgenabschätzung (FRIA)", docClass: "einmalig", owner: P["demo-p08"], status: "draft", lastReview: "", intervalMonths: 0, basis: "KI-VO Art. 27", notes: "Für das Bewerber-Ranking." },
  { id: "demo-d16", name: "Technische Dokumentation Hochrisiko-KI", docClass: "einmalig", owner: P["demo-p05"], status: "draft", lastReview: "", intervalMonths: 0, basis: "KI-VO Art. 11, Anhang IV", notes: "Lastfluss-Prognose." },
  { id: "demo-d17", name: "Protokolle Hochrisiko-KI (Aufbewahrung mind. 6 Monate)", docClass: "register", owner: P["demo-p05"], status: "active", lastReview: tag(-20), intervalMonths: 0, basis: "KI-VO Art. 12, 19, 26 Abs. 6", notes: "" },
  { id: "demo-d18", name: "Nachweise KI-Kompetenz", docClass: "register", owner: P["demo-p08"], status: "active", lastReview: tag(-45), intervalMonths: 0, basis: "KI-VO Art. 4 / ISO/IEC 42001 7.2", notes: "" },
  { id: "demo-d19", name: "KI-Systemauswirkungsabschätzung", docClass: "periodisch", owner: P["demo-p05"], status: "active", lastReview: tag(-300), intervalMonths: 12, basis: "ISO/IEC 42001 6.1.4, 8.4", notes: "" },
  { id: "demo-d20", name: "Überwachung von KI-Systemen im Betrieb", docClass: "periodisch", owner: P["demo-p05"], status: "active", lastReview: tag(-200), intervalMonths: 6, basis: "KI-VO Art. 26 Abs. 5 / ISO/IEC 42001 A.6.2.6", notes: "Überfällig." },
];

// ── Richtlinien-Stand (Teilmenge, Rest bleibt „Entwurf") ─────────────────────
const POLICY_STATUS: Record<string, { s: string; owner: number; review: number; doc?: string }> = {
  p01: { s: "implemented", owner: 1, review: -200, doc: "demo-d01" }, p02: { s: "implemented", owner: 1, review: -150 },
  p03: { s: "implemented", owner: 1, review: -150 }, p04: { s: "partially_implemented", owner: 8, review: -60 },
  p05: { s: "partially_implemented", owner: 8, review: -120 }, p07: { s: "implemented", owner: 2, review: -30 },
  p10: { s: "implemented", owner: 2, review: -90 }, p11: { s: "implemented", owner: 2, review: -90 },
  p12: { s: "partially_implemented", owner: 2, review: -90 }, p13: { s: "implemented", owner: 2, review: -300 },
  p16: { s: "partially_implemented", owner: 2, review: -80 }, p21: { s: "partially_implemented", owner: 9, review: -40 },
  p22: { s: "implemented", owner: 2, review: -40 }, p27: { s: "partially_implemented", owner: 9, review: -70 },
  p30: { s: "implemented", owner: 1, review: -100 }, p31: { s: "implemented", owner: 1, review: -100 },
  p34: { s: "partially_implemented", owner: 5, review: -100 }, p36: { s: "partially_implemented", owner: 2, review: -210, doc: "demo-d10" },
  p37: { s: "implemented", owner: 3, review: -60 }, p41: { s: "partially_implemented", owner: 2, review: -120 },
  p42: { s: "partially_implemented", owner: 6, review: -150 }, p44: { s: "implemented", owner: 7, review: -45 },
  p45: { s: "implemented", owner: 7, review: -45 }, p48: { s: "not_implemented", owner: 2, review: -10 },
  p50: { s: "partially_implemented", owner: 4, review: -90, doc: "demo-d13" }, p51: { s: "partially_implemented", owner: 5, review: -100 },
  D11: { s: "implemented", owner: 8, review: -250 }, D13: { s: "implemented", owner: 0, review: -150 },
  D14: { s: "implemented", owner: 1, review: -100 }, D43: { s: "implemented", owner: 0, review: -150 },
  D25: { s: "implemented", owner: 4, review: -14, doc: "demo-d12" }, D26: { s: "not_implemented", owner: 7, review: -5 },
  D27: { s: "partially_implemented", owner: 4, review: -20 }, D63: { s: "partially_implemented", owner: 4, review: -20 },
  D01: { s: "partially_implemented", owner: 1, review: -10 }, D03: { s: "implemented", owner: 1, review: -190, doc: "demo-d02" },
};

// ── Vorfälle ─────────────────────────────────────────────────────────────────
const INCIDENTS = [
  { id: "demo-i1", title: "Phishing-Welle mit kompromittiertem Postfach", severity: "high", status: "closed",
    detectedAt: iso(-75).slice(0, 16), occurredAt: iso(-76).slice(0, 16), containedAt: iso(-75, 14).slice(0, 16), resolvedAt: iso(-72).slice(0, 16),
    description: "Ein Mitarbeiterpostfach wurde über eine Phishing-Mail übernommen und für den Versand weiterer Mails genutzt.",
    notes: "", impactDescription: "Ein Postfach, 312 ausgehende Phishing-Mails; keine Kundendaten betroffen.",
    measuresTaken: "Konto gesperrt, Passwort und Tokens zurückgesetzt, Absender geblockt.", measuresPlanned: "Phishing-resistente MFA für alle Konten.",
    lessonsLearned: "Meldeknopf im Mailclient wurde gut genutzt — Erkennung nach 40 Minuten.", crossBorder: false, serviceRecipientsAffected: false },
  { id: "demo-i2", title: "Ausfall Fernwirkverbindung Umspannwerk Nord", severity: "critical", status: "contained",
    detectedAt: iso(-9).slice(0, 16), occurredAt: iso(-9).slice(0, 16), containedAt: iso(-8).slice(0, 16),
    description: "Die Leitwarte verlor für 3 Stunden die Verbindung zu einem Umspannwerk; Ursache: fehlerhafte Firewall-Regel nach Change.",
    notes: "", impactDescription: "Keine Versorgungsunterbrechung; manuelle Überwachung vor Ort.", measuresTaken: "Change zurückgerollt, Regelwerk geprüft.",
    measuresPlanned: "Vier-Augen-Prinzip für OT-Firewall-Changes.", crossBorder: false, serviceRecipientsAffected: true },
  { id: "demo-i3", title: "Chatbot gibt falsche Tarifauskunft", severity: "medium", status: "investigating",
    detectedAt: iso(-3).slice(0, 16), description: "Der Kunden-Chatbot nannte in mehreren Gesprächen einen veralteten Grundpreis.",
    notes: "", impactDescription: "Beschwerden von 5 Kunden.", crossBorder: false, serviceRecipientsAffected: true },
  { id: "demo-i4", title: "Verlorenes Notebook (verschlüsselt)", severity: "low", status: "closed",
    detectedAt: iso(-40).slice(0, 16), resolvedAt: iso(-39).slice(0, 16), description: "Notebook im Zug vergessen; BitLocker aktiv, Gerät remote gesperrt.",
    notes: "", crossBorder: false, serviceRecipientsAffected: false },
];

// ── Lieferanten / DORA-Register / BCM ────────────────────────────────────────
const SUPPLIERS: Supplier[] = [
  { id: "demo-s1", name: "Microsoft Ireland Operations Ltd.", service: "M365, Azure ML, Copilot", criticality: "high", dataAccess: "personal", certs: ["ISO27001", "SOC2", "C5"],
    answers: { "q-contract": "yes", "q-incident": "yes", "q-avv": "yes", "q-cert": "yes", "q-subchain": "yes", "q-access": "yes", "q-audit": "no", "q-review": "yes", "q-cloud": "yes", "q-bcp": "yes", "q-exit": "no" },
    lastReview: tag(-100), reviewMonths: 12, assessedBy: P["demo-p07"], archived: false, notes: "" },
  { id: "demo-s2", name: "Siemens Energy (Leittechnik-Wartung)", service: "Wartung SCADA-Leitsystem", criticality: "critical", dataAccess: "internal", certs: ["ISO27001"],
    answers: { "q-contract": "yes", "q-incident": "no", "q-cert": "yes", "q-subchain": "no", "q-access": "yes", "q-audit": "yes", "q-review": "yes", "q-cloud": "na", "q-bcp": "yes", "q-exit": "yes" },
    lastReview: tag(-400), reviewMonths: 12, assessedBy: P["demo-p06"], archived: false, notes: "Meldepflicht bei Vorfällen fehlt im Vertrag." },
  { id: "demo-s3", name: "HR-Tech Anbieter (Bewerber-Ranking)", service: "SaaS Bewerbermanagement mit KI", criticality: "medium", dataAccess: "sensitive", certs: [],
    answers: { "q-contract": "yes", "q-incident": "yes", "q-avv": "yes", "q-cert": "no", "q-subchain": "", "q-access": "yes", "q-audit": "no", "q-review": "", "q-cloud": "yes", "q-bcp": "no", "q-exit": "" },
    lastReview: tag(-30), reviewMonths: 12, assessedBy: P["demo-p07"], archived: false, notes: "KI-VO: Anbieter muss Gebrauchsanweisung (Art. 13) liefern." },
  { id: "demo-s4", name: "Meteo-Datendienst GmbH", service: "Wetter- und Marktdaten für die Prognose", criticality: "high", dataAccess: "none", certs: [],
    answers: { "q-contract": "yes", "q-incident": "no", "q-cert": "no", "q-subchain": "no", "q-access": "yes", "q-audit": "no", "q-review": "", "q-cloud": "na", "q-bcp": "no", "q-exit": "no" },
    lastReview: "", reviewMonths: 12, assessedBy: P["demo-p05"], archived: false, notes: "Single Point of Failure für die Lastprognose." },
];
const TPRM: Dienstleister[] = [
  { id: "demo-t1", name: "Microsoft Ireland Operations Ltd.", lei: "635400ZB3NXOEE3WTQ51", kat: "ikt", kritikalitaet: "kritisch_wichtig", funktionen: "Kollaboration, KI-Plattform", region: "IE/EU",
    riskScore: 42, letztePruefung: tag(-100), klauseln: ["Zugangs-/Auditrechte", "Datenstandorte", "Sicherheitsanforderungen", "Kündigungsrechte"], personenbezug: true, avvVorhanden: true,
    exitStrategie: false, exitGetestet: "", zertifikatBis: tag(300), subdienstleister: "Rechenzentren EU", status: "aktiv", supplierId: "demo-s1" },
  { id: "demo-t2", name: "Siemens Energy (Leittechnik-Wartung)", lei: "", kat: "ikt", kritikalitaet: "kritisch_wichtig", funktionen: "Wartung Netzleitsystem", region: "DE",
    riskScore: 61, letztePruefung: tag(-400), klauseln: ["Zugangs-/Auditrechte", "Sicherheitsanforderungen"], personenbezug: false, avvVorhanden: false,
    exitStrategie: true, exitGetestet: "", zertifikatBis: tag(120), subdienstleister: "", status: "aktiv", supplierId: "demo-s2" },
];
const BCM: { prozesse: BcmProzess[]; anlagen: any[] } = {
  prozesse: [
    { id: "demo-b1", name: "Netzleitsystem Strom (OT)", verantwortlicher: P["demo-p06"], kritisch: true, rtoStunden: 2, rpoStunden: 1, planVorhanden: true, planRtoStunden: 4, letzteUebung: tag(-100), backupRestoreTest: tag(-150) },
    { id: "demo-b2", name: "Abrechnung & Kundenportal", verantwortlicher: P["demo-p03"], kritisch: true, rtoStunden: 24, rpoStunden: 4, planVorhanden: true, planRtoStunden: 24, letzteUebung: tag(-300), backupRestoreTest: tag(-210) },
    { id: "demo-b3", name: "Last- & Erzeugungsprognose (KI)", verantwortlicher: P["demo-p05"], kritisch: true, rtoStunden: 8, rpoStunden: 4, planVorhanden: false, planRtoStunden: 0, letzteUebung: "", backupRestoreTest: "" },
    { id: "demo-b4", name: "Zentrale IT-Infrastruktur (RZ, Netz, IAM)", verantwortlicher: P["demo-p03"], kritisch: true, rtoStunden: 4, rpoStunden: 1, planVorhanden: true, planRtoStunden: 8, letzteUebung: tag(-100), backupRestoreTest: tag(-210) },
  ],
  anlagen: [],
};

// Blob-Schlüssel, die das Paket schreibt (und die „Alles löschen" leert)
const LS_KEYS_TO_CLEAR = [
  "nis2-personnel", "cws-ki-governance", "cws-document-lifecycle", "nis2-policies", "cws-incident-register",
  "cws-supplier-check", "cws-tprm", "cws-bcm", "cws-audit-workbench", "cws-audit-actions", "cws-management-review",
  "risk-treatment", "manual-risks", "risk-appetite", "nis2suite-soa", "umsetzung-progress", "nis2-bundle-owners",
  "cws.framework-inheritance", "cws-tool-suggestions", "nis2_training", "cws-datenschutz-cockpit", "cws-procurement-check",
  "cws-step-data", "cws-sector-data", "cws-risk-matrix", "cws.scope-gates.v1", "cws.framework.active", "cws.framework.primary",
];

/** Browser-Zwischenstände entfernen — sonst schreibt useToolData alte lokale Daten zurück. */
export function clearLocalCaches(): void {
  try {
    for (const k of LS_KEYS_TO_CLEAR) localStorage.removeItem(k);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && /^(cws-|nis2suite-|nis2-policies|umsetzung-)/.test(k) && !/sidebar|assessment-mode|accent|theme|palette/.test(k)) localStorage.removeItem(k);
    }
  } catch { /* privat/gesperrt */ }
}

// ── Löschen ──────────────────────────────────────────────────────────────────
/** Alle fachlichen Daten des Mandanten löschen (Konto, Rollen, Lizenzen bleiben). */
export async function wipeTenant(tenantId: string, step: Step): Promise<void> {
  const byTenant = ["answer_evidence", "control_test_results", "control_tests", "evidence", "answers", "implementation_status",
    "compliance_deadlines", "kpi_snapshots", "maturity_targets", "quant_scenarios", "coverage_review"];
  const byUser = ["roadmap_items", "training_completions", "training_quiz_results", "dependencies", "assets", "services", "user_tool_data"];
  for (const t of byTenant) {
    step(`Lösche ${t} …`);
    const { error } = await (supabase.from(t).delete().eq("tenant_id", tenantId) as any);
    if (error && !/does not exist|relation/.test(error.message ?? "")) throw new Error(`${t}: ${error.message}`);
  }
  for (const t of byUser) {
    step(`Lösche ${t} …`);
    let qb: any = supabase.from(t).delete().eq("user_id", tenantId);
    if (t === "user_tool_data") qb = qb.neq("tool_key", "nis2-notification-settings");
    const { error } = await qb;
    if (error && !/does not exist|relation/.test(error.message ?? "")) throw new Error(`${t}: ${error.message}`);
  }
  step("Lösche Anwendungsbereich-Fragen …");
  await (supabase.from("org_tool_data").delete().eq("tenant_id", tenantId).neq("tool_key", "engine-config") as any);
  clearLocalCaches();
}

// ── Laden ────────────────────────────────────────────────────────────────────
interface CtrlRow extends RawControl { tags: string[] | null; muss?: string | null; sub_sector?: string | null }

/** Antwortquote je Framework (ja / teilweise / nein / n.a. / offen) — realistisch unterschiedlich reif. */
const REIFE: Record<string, [number, number, number, number]> = {
  ISO27001: [0.58, 0.18, 0.14, 0.04], NIS2: [0.50, 0.20, 0.18, 0.04], ISO42001: [0.34, 0.24, 0.26, 0.04], AIACT: [0.28, 0.22, 0.26, 0.12],
};
function antwortFuer(fw: string, id: string): Antwort | null {
  const [ja, tw, ne, na] = REIFE[fw] ?? [0.5, 0.2, 0.2, 0.05];
  const h = hash(`${fw}:${id}`);
  if (h < ja) return "ja";
  if (h < ja + tw) return "teilweise";
  if (h < ja + tw + ne) return "nein";
  if (h < ja + tw + ne + na) return "na";
  return null; // noch nicht bewertet
}
const EVIDENZ = ["DMS://ISMS/Richtlinien", "Ticket CHG-2026-0412", "Screenshot MFA-Abdeckung", "Protokoll Management-Review", "Schulungsnachweise LMS", "Auditbericht intern 2026"];

export async function loadDemoPackage(tenantId: string, userId: string, step: Step): Promise<{ antworten: number; assets: number; deps: number; buendel: number }> {
  await wipeTenant(tenantId, step);

  // 1) Firmenprofil / Scope
  step("Firmenprofil und Frameworks …");
  const profil = {
    user_id: tenantId, company_name: DEMO_COMPANY, sector: "Energie", country: "DE", company_size: "large",
    employee_count: 420, annual_revenue: 95000000, entity_type: "essential", in_scope: true, enabled_frameworks: DEMO_FRAMEWORKS,
    kritis_sub_sectors: [], critical_services: SERVICES.filter(s => s.criticality >= 3).map(s => s.name),
    it_structure: "Zentrales RZ mit Virtualisierung, OT-Netz über DMZ getrennt, Microsoft 365, Azure ML für KI-Prognosen.",
  };
  const vorhanden = await q<any>(supabase.from("company_profiles").select("id").eq("user_id", tenantId).limit(1).maybeSingle() as any, "company_profiles lesen");
  if (vorhanden?.id) await q(supabase.from("company_profiles").update(profil).eq("id", vorhanden.id) as any, "company_profiles");
  else await q(supabase.from("company_profiles").insert(profil) as any, "company_profiles");
  try { localStorage.setItem("cws.framework.active", JSON.stringify(DEMO_FRAMEWORKS)); } catch { /* egal */ }

  // 2) Inventar + Abhängigkeiten
  step("Inventar: Services, Assets, Abhängigkeiten …");
  const svcRows = await q<any[]>(supabase.from("services").insert(SERVICES.map(s => ({
    user_id: tenantId, name: s.name, description: s.description, category: s.category, criticality: s.criticality,
    owner: s.owner, rto_hours: s.rto, rpo_hours: s.rpo, notes: "",
    // BIA-Assistent (Phase 02): gewichtete Bewertung passend zur Kritikalität
    criticality_assessment: { ...BIA[s.key], score: s.criticality, updated_at: iso(-200) },
  }))).select("id,name") as any, "services");
  const svcId = new Map(svcRows.map(r => [SERVICES.find(s => s.name === r.name)!.key, r.id]));
  const astRows = await q<any[]>(supabase.from("assets").insert(ASSETS.map(a => ({
    user_id: tenantId, service_id: svcId.get(a.svc), asset_name: a.name, asset_type: a.type, owner: a.owner,
    environment: a.env, data_sensitivity: a.sens, external_exposure: a.exposed, vendor: a.vendor,
    inherited_criticality: true, instance_count: (a as any).count ?? 1, notes: "",
  }))).select("id,asset_name") as any, "assets");
  const astByName = new Map(astRows.map(r => [r.asset_name, r.id]));
  const ast = (k: string) => { const a = ASSETS.find(x => x.key === k)!; return { id: astByName.get(a.name), name: a.name }; };
  await q(supabase.from("dependencies").insert(DEPS.map(d => {
    const s = ast(d.s), t = ast(d.t);
    return { user_id: tenantId, source_type: "asset", source_id: s.id, source_label: s.name, target_type: "asset", target_id: t.id, target_label: t.name,
      dependency_type: d.type, criticality: d.crit, is_spof: !!d.spof, notes: d.note };
  })) as any, "dependencies");

  // BIA-Prozesse mit den Inventar-Services verknüpfen (Phase 02 → BCM)
  const svcKeyByName = new Map(SERVICES.map(s => [s.name, s.key]));
  for (const pr of BCM.prozesse) { const k = svcKeyByName.get(pr.name); if (k) pr.serviceId = svcId.get(k); }

  // Schulungsnachweise (Werkzeug Schulungen)
  const kurse: [string, string, number[]][] = [
    ["g01", "management", [0, 1, 2]], ["g02", "management", [0]], ["a01", "all", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]],
    ["a02", "all", [1, 2, 3, 4, 6, 8, 9]], ["a03", "all", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]], ["i01", "it", [1, 2, 9]],
    ["i02", "management", [0, 1, 5]], ["r02", "management", [1, 2, 5]], ["x03", "all", [2, 3, 4, 7, 8]],
  ];
  const tc: any[] = [];
  kurse.forEach(([topic, track, wer], ki) => wer.forEach((pi, j) => {
    const p = DEMO_PEOPLE[pi];
    tc.push({ user_id: tenantId, topic_id: topic, role_track: track, participant_name: p.name, participant_email: p.email ?? "",
      participant_role: p.title, completed_at: iso(-(15 + ki * 20 + j * 3)), next_due_at: iso(365 - (15 + ki * 20 + j * 3)), notes: "" });
  }));
  await q(supabase.from("training_completions").insert(tc) as any, "training_completions");

  // 3) Gap-Analyse: Antworten für alle vier Frameworks
  step("Gap-Analyse: Kontrollen laden …");
  const ctrls: CtrlRow[] = [];
  for (let from = 0; from < 20000; from += 1000) {
    const page = await q<CtrlRow[]>(supabase.from("controls").select("id, framework, sub_sector, req_de, req_en, muss, effort_pt, meta, tags")
      .in("framework", DEMO_FRAMEWORKS).order("id").range(from, from + 999) as any, "controls");
    ctrls.push(...page);
    if (page.length < 1000) break;
  }
  const bewertbar = ctrls.filter(c => !c.tags?.includes("sub") && (c.meta as any)?.scored !== false);
  const jetzt = new Date().toISOString();
  const antworten: any[] = [];
  const antwortMap = new Map<string, Antwort>();
  bewertbar.forEach((c, i) => {
    const key = `${c.framework}:${c.id}`;
    const gate = DEMO_GATE_CONTROLS.has(key);      // Scope-Frage „TLD-Register" = Nein
    let a = gate ? "na" : antwortFuer(c.framework, c.id);
    if (a === "na" && istPflichtKlausel(c.framework, c.id)) a = "teilweise"; // ISO-Klauseln 4–10 sind Pflicht
    // AI Act rollenkonsistent (SoA-Prüfbericht C-7): „n. a." genau dann, wenn kein Demo-KI-System
    // die Kontrolle in seiner Rolle/Klasse auslöst — sonst Konflikt in der Matrix.
    if (c.framework === "AIACT") {
      const frei = untriggeredJustification({ id: c.id, catalog: catalogMetaOf(c.meta) }, DEMO_KI);
      if (frei) a = "na"; else if (a === "na") a = "teilweise";
    }
    if (!a) return;
    antwortMap.set(key, a);
    const h = hash(`${key}#r`);
    antworten.push({
      tenant_id: tenantId, framework: c.framework, control_id: c.id, asset_id: null, antwort: a,
      // Reifegrad realistisch gestreut: ja 3–5, teilweise 2–3, nein 0–1
      reifegrad: a === "ja" ? 3 + Math.floor(h * 2.99) : a === "teilweise" ? 2 + Math.floor(h * 1.99) : a === "nein" ? Math.floor(h * 1.99) : null,
      evidence: a === "ja" ? EVIDENZ[i % EVIDENZ.length] : null,
      note: gate ? DEMO_GATE_NOTE : null, updated_by: userId,
      // Bewertungszeitpunkte über ~9 Monate verteilt (Aktualität, Verlauf)
      updated_at: iso(-Math.round(8 + hash(`${key}#t`) * 262)),
    });
  });
  step(`Gap-Analyse: ${antworten.length} Antworten speichern …`);
  for (let i = 0; i < antworten.length; i += 400) {
    await q(supabase.from("answers").upsert(antworten.slice(i, i + 400), { onConflict: "tenant_id,framework,control_id,asset_id" }) as any, "answers");
  }

  // 4) Umsetzung: Status je Bündel (aus den Antworten abgeleitet), mit Verlauf
  step("Umsetzung: Aufgaben und Verlauf …");
  const view = buildUmsetzungView(ctrls, DEMO_FRAMEWORKS as any, ctrls);
  const buendel = [...view.shared, ...Object.values(view.deltaByFramework).flat()];
  const impl: any[] = [];
  buendel.forEach((b, i) => {
    const ants = b.memberControlIds.map(m => antwortMap.get(m)).filter(Boolean) as Antwort[];
    if (ants.length === 0) return;
    const alleJa = ants.every(a => a === "ja" || a === "na");
    const nein = ants.includes("nein");
    const h = hash(b.bundle_key);
    let status: "offen" | "laufend" | "fertig" | "blockiert";
    if (alleJa) status = "fertig";
    else if (nein) status = h < 0.12 ? "blockiert" : h < 0.45 ? "laufend" : "offen";
    else status = "laufend";
    const fertigTag = -Math.round(10 + h * 260);           // über ~9 Monate verteilt → Fortschrittskurve
    impl.push({
      tenant_id: tenantId, bundle_key: b.bundle_key, status, owner: person(1 + (i % 9)),
      // ein Teil der offenen Aufgaben ist überfällig (Dashboard-/Umsetzungs-Warnungen)
      due_date: status === "fertig" ? null : tag(hash(b.bundle_key + "#frist") < (status === "laufend" ? 0.1 : 0.3) ? -Math.round(3 + hash(b.bundle_key + "#t") * 40) : Math.round(20 + h * 180)),
      completed_at: status === "fertig" ? tag(fertigTag) : null,
      first_implemented_at: status === "fertig" ? tag(fertigTag) : status === "laufend" ? tag(-Math.round(5 + h * 60)) : null,
      evidence_url: status === "fertig" && h < 0.8 ? `DMS://ISMS/Nachweise/${b.bundle_key.replace(/[^A-Za-z0-9.-]/g, "_")}` : null,
      note: status === "blockiert" ? "Wartet auf Freigabe des Herstellers / Budget 2027." : null, updated_by: userId,
    });
  });
  for (let i = 0; i < impl.length; i += 400) {
    await q(supabase.from("implementation_status").upsert(impl.slice(i, i + 400), { onConflict: "tenant_id,bundle_key" }) as any, "implementation_status");
  }

  // 5) Nachweise (Evidence) an einigen erfüllten Kontrollen
  step("Nachweise …");
  const nachweise = [
    { title: "Informationssicherheitsleitlinie v2.1 (freigegeben)", kind: "document", url: "https://dms.nordwerk-demo.example/isms/leitlinie", valid: 365 },
    { title: "MFA-Abdeckungsbericht Entra ID", kind: "screenshot", url: "https://dms.nordwerk-demo.example/it/mfa", valid: 90 },
    { title: "Protokoll Blackout-Übung Leitwarte", kind: "document", url: "https://dms.nordwerk-demo.example/bcm/uebung", valid: 365 },
    { title: "KI-Systemregister (Export)", kind: "document", url: "https://dms.nordwerk-demo.example/ki/register", valid: 180 },
    { title: "Schulungsnachweise Awareness 2026", kind: "attestation", url: "https://lms.nordwerk-demo.example/berichte", valid: 365 },
    { title: "Backup-Restore-Test Protokoll", kind: "log", url: "https://dms.nordwerk-demo.example/it/restore", valid: -30 },
  ];
  const evRows = await q<any[]>(supabase.from("evidence").insert(nachweise.map((n, i) => ({
    tenant_id: tenantId, title: n.title, kind: n.kind, external_url: n.url, description: "Abgelegt im Dokumentenmanagement (DMS).",
    collected_at: iso(-(20 + i * 15)), valid_until: tag(n.valid), collected_by: userId,
  }))).select("id") as any, "evidence");
  const erfuellt = antworten.filter(a => a.antwort === "ja");
  const links: any[] = [];
  evRows.forEach((e, i) => {
    for (let k = 0; k < 4; k++) {
      const a = erfuellt[(i * 37 + k * 11) % Math.max(1, erfuellt.length)];
      if (a && !links.some(l => l.evidence_id === e.id && l.control_id === a.control_id && l.framework === a.framework))
        links.push({ evidence_id: e.id, tenant_id: tenantId, framework: a.framework, control_id: a.control_id });
    }
  });
  if (links.length) await q(supabase.from("answer_evidence").insert(links) as any, "answer_evidence");

  // 6) Fristen und KPI-Verlauf
  step("Fristen und Kennzahlen-Verlauf …");
  const fristen = [
    { kind: "ai_act_deadline", framework: "AIACT", label: "KI-VO: Hochrisiko-Pflichten Anhang III (Lastfluss-Prognose, Bewerber-Ranking)", starts_at: iso(-60), due_at: "2027-12-02T00:00:00Z" },
    { kind: "document_review", framework: "ISO27001", label: "Management-Review ISMS/AIMS durchführen", starts_at: iso(-380), due_at: iso(-15) },
    { kind: "audit_cycle", framework: "ISO42001", label: "Internes AIMS-Audit (ISO/IEC 42001)", starts_at: iso(-30), due_at: iso(45) },
    { kind: "training_cycle", framework: "NIS2", label: "Schulung Geschäftsleitung (§ 38 Abs. 3 BSIG)", starts_at: iso(-300), due_at: iso(65), recurrence: "1 year" },
    { kind: "exercise", framework: "NIS2", label: "Krisenübung Ransomware (Leitwarte + IT)", starts_at: iso(-10), due_at: iso(90) },
    { kind: "evidence_review", framework: "ISO27001", label: "Backup-Restore-Test wiederholen", starts_at: iso(-210), due_at: iso(-30) },
  ];
  await q(supabase.from("compliance_deadlines").insert(fristen.map(f => ({ tenant_id: tenantId, status: "open", meta: { demo: true }, ...f }))) as any, "compliance_deadlines");
  // Verlauf endet knapp unter dem heutigen Stand (ja + ½·teilweise über bewertete, anwendbare Kontrollen)
  const zaehl = { ja: 0, tw: 0, basis: 0 };
  for (const a of antwortMap.values()) { if (a === "na") continue; zaehl.basis++; if (a === "ja") zaehl.ja++; if (a === "teilweise") zaehl.tw++; }
  const heute = zaehl.basis ? (zaehl.ja + 0.5 * zaehl.tw) / zaehl.basis : 0.5;
  const verlauf = [0.34, 0.42, 0.5, 0.57, 0.64, 0.7, 0.77, 0.85, 0.93].map(f => Math.round(heute * f * 1000) / 1000);
  await q(supabase.from("kpi_snapshots").insert(verlauf.map((v, i) => ({
    tenant_id: tenantId, taken_at: new Date(Date.now() - (verlauf.length - i) * 30 * 86400_000).toISOString(),
    metrics: { compliance_overall: v }, has_data: { compliance_overall: true }, source: "manual",
  }))) as any, "kpi_snapshots");

  // 7) Werkzeug-Daten
  step("Personen, KI-Register, Dokumente, Richtlinien …");
  const policies: Record<string, any> = {};
  for (const [id, v] of Object.entries(POLICY_STATUS)) {
    policies[id] = {
      implementationStatus: v.s, policyOwner: person(v.owner), lastReviewDate: tag(v.review), nextReviewDate: tag(v.review + 365),
      approvalAuthority: P["demo-p01"], responsibleRoles: `${P["demo-p02"]}, ${P["demo-p03"]}`,
      scope: "Nordwerk Energie GmbH, alle Standorte, Mitarbeitenden, Dienstleister und Systeme im Geltungsbereich von ISMS und AIMS",
      version: v.s === "implemented" ? "2.0" : "1.1", ...(v.doc ? { documentId: v.doc } : {}),
    };
  }
  const audItems: Record<string, AuditItem> = {};
  const neinAntworten = antworten.filter(a => a.antwort === "nein" && (a.framework === "ISO27001" || a.framework === "NIS2")).slice(0, 8);
  neinAntworten.forEach((a, i) => {
    audItems[`${a.framework}::${a.control_id}`] = {
      severity: i < 2 ? "major" : i < 6 ? "minor" : "beobachtung", riskIds: [], manualRisks: [],
      measures: "Maßnahme festlegen, umsetzen und Wirksamkeit prüfen.", note: "Befund aus internem Audit 2026.",
      evidence: "", state: i < 3 ? "in_bearbeitung" : i < 6 ? "offen" : "erledigt", owner: person(1 + i), due: tag(20 + i * 10),
      ...(i >= 6 ? { closedAt: iso(-5) } : {}),
    };
  });
  const audits: AuditRecord[] = [
    { id: "demo-a1", typ: "intern", titel: "Internes Audit ISMS 2026 (ISO 27001 / NIS2)", auditor: P["demo-p09"], datum: tag(-120), urteil: "Mit Auflagen konform: 2 Hauptabweichungen, 4 Nebenabweichungen.",
      status: "abgeschlossen", scopeFrameworks: ["ISO27001", "NIS2"], items: audItems, abgeschlossenAm: tag(-110), naechstesAudit: tag(245), createdAt: iso(-125) },
    { id: "demo-a2", typ: "intern", titel: "Internes AIMS-Audit (ISO/IEC 42001 / KI-VO)", auditor: P["demo-p09"], datum: tag(45), urteil: "",
      status: "geplant", scopeFrameworks: ["ISO42001", "AIACT"], items: {}, createdAt: iso(-10) },
  ];
  const auditState: AuditState = { items: audItems, auditor: audits[0].auditor, datum: audits[0].datum, urteil: audits[0].urteil, audits, activeAuditId: "demo-a1" };
  const auditActions = neinAntworten.slice(0, 6).map((a, i) => ({
    id: `demo-aa${i + 1}`, framework: a.framework, controlId: a.control_id,
    controlReq: (ctrls.find(c => c.framework === a.framework && c.id === a.control_id)?.req_de ?? a.control_id).slice(0, 180),
    severity: i < 2 ? "major" : "minor", measure: "Korrekturmaßnahme aus dem internen Audit umsetzen und Nachweis ablegen.",
    createdAt: iso(-110), done: i === 5, owner: person(1 + i), due: tag(20 + i * 10), ...(i === 5 ? { doneAt: iso(-3) } : {}), auditId: "demo-a1",
  }));
  const review = {
    reviews: [{
      id: "demo-mr1", createdAt: iso(-380), teilnehmer: `${P["demo-p01"]}, ${P["demo-p02"]}, ${P["demo-p03"]}, ${P["demo-p04"]}`,
      beschluesse: "Budget für OT-Segmentierung und phishing-resistente MFA freigegeben; KI-Governance mit KI-Beauftragter eingeführt.",
      chancen: "ISO/IEC 42001-Zertifizierung als Vertrauensmerkmal gegenüber Kommunen.", ressourcen: "1 zusätzliche Stelle Informationssicherheit, externe Unterstützung KI-VO.",
      nis2Kenntnisnahme: "Risikomanagementmaßnahmen nach § 30 BSIG gebilligt; Überwachung der Umsetzung quartalsweise.", nis2Bestaetigt: true,
      snapshot: { compliance: [{ framework: "ISO27001", pct: 38, applicable: 300 }, { framework: "NIS2", pct: 31, applicable: 250 }], topRisks: [], incidents: { total: 2, open: 0, critical: 0 }, openDeadlines: 3 },
    }],
  };
  const manualRisks = {
    risks: [
      { id: "custom-demo-1", source: "custom", title_de: "Modelldrift der Lastprognose", title_en: "Load forecast model drift",
        description_de: "Veränderte Einspeisemuster (PV, Wärmepumpen) verschlechtern die Prognosegüte unbemerkt; Fehlsteuerung im Netz möglich.",
        description_en: "Changing feed-in patterns silently degrade forecast quality; possible grid mis-control.",
        likelihood: 3, impact: 4, scope: "asset", asset_id: ast("modell").id, asset_name: ast("modell").name, cia: ["I", "A"], created_at: iso(-60) },
      { id: "custom-demo-2", source: "custom", title_de: "Prompt-Injection über den Kunden-Chatbot", title_en: "Prompt injection via customer chatbot",
        description_de: "Manipulierte Eingaben bringen den Chatbot zu falschen Auskünften oder zur Preisgabe interner Informationen.",
        description_en: "Crafted inputs make the chatbot give wrong answers or disclose internal information.",
        likelihood: 3, impact: 3, scope: "asset", asset_id: ast("chatbot").id, asset_name: ast("chatbot").name, cia: ["C", "I"], created_at: iso(-20) },
      { id: "custom-demo-3", source: "custom", title_de: "Diskriminierende Vorauswahl im Bewerber-Ranking", title_en: "Discriminatory pre-selection in applicant ranking",
        description_de: "Verzerrte Trainingsdaten führen zu Benachteiligung bestimmter Gruppen (Art. 10, Art. 27 KI-VO; AGG).",
        description_en: "Biased training data disadvantage certain groups (AI Act Art. 10, 27).",
        likelihood: 2, impact: 4, scope: "asset", asset_id: ast("bewerber").id, asset_name: ast("bewerber").name, cia: ["I"], created_at: iso(-45) },
    ],
    overrides: {},
  };
  const blobs: Record<string, unknown> = {
    "nis2-personnel": { people: DEMO_PEOPLE },
    "ki-governance": { systeme: DEMO_KI },
    "document-lifecycle": { docs: DOCS },
    "policies": policies,
    "incident-register": { incidents: INCIDENTS },
    "supplier-check": { suppliers: SUPPLIERS },
    "tprm": { dienstleister: TPRM },
    "bcm": BCM,
    "audit-workbench": auditState,
    "audit-actions": { actions: auditActions },
    "management-review": review,
    "manual-risks": manualRisks,
    "risk-appetite": { mode: "class", classLevel: "medium", overCells: [] },
    "framework-inheritance": { mode: "applied", appliedAt: jetzt, v: 2 },
  };
  // Ergänzung: alles, was sonst erst durch Seitenbesuche/Nutzeraktionen entsteht
  const zusatz = await ladeZusatz({
    tenantId, userId, step, frameworks: DEMO_FRAMEWORKS, ctrls, antwortMap, impl, buendel, P, person, ast: ast as any, svcId,
    evidenceIds: evRows.map((e: any) => e.id), incidents: INCIDENTS, suppliers: SUPPLIERS, tprm: TPRM, bcm: BCM, docs: DOCS,
    policies, review, manualRisks: manualRisks as any, kiSysteme: DEMO_KI,
  });
  Object.assign(blobs, zusatz);
  step("Werkzeugdaten speichern …");
  for (const [tool_key, data] of Object.entries(blobs)) {
    await q(supabase.from("user_tool_data").upsert({ user_id: tenantId, tool_key, data }, { onConflict: "user_id,tool_key" }) as any, `Werkzeug ${tool_key}`);
  }
  clearLocalCaches();
  try { localStorage.setItem("cws.framework.active", JSON.stringify(DEMO_FRAMEWORKS)); } catch { /* egal */ }
  step("Fertig.");
  return { antworten: antworten.length, assets: astRows.length, deps: DEPS.length, buendel: impl.length };
}
