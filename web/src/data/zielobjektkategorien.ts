/**
 * BSI Grundschutz++ (März 2026) — Zielobjektkategorien (ZOK)
 *
 * 52 hierarchical target object categories across 10 root nodes, max 4 levels.
 * Each asset is mapped to 1..N ZOK; requirements (measures + risks) attached
 * to a ZOK are inherited DOWN the tree (children inherit from parents).
 *
 * Reference: BSI Leitfaden zur Methodik Grundschutz++, Abbildung 6
 */

export type ZokId =
  // Standorte
  | "standorte" | "gebaeude" | "raeume" | "raeume_techn_infra" | "datentraegerarchiv" | "serverraeume"
  // Nutzende
  | "nutzende" | "mitarbeitende" | "fuehrungskraefte" | "institutionsleitung" | "administrierende" | "externe"
  // Netze
  | "netze" | "netze_intern" | "wlans" | "netze_extern" | "internet_anbindung" | "vpn" | "wan_provider"
  // IT-Systeme
  | "it_systeme" | "hostsysteme" | "endgeraete" | "mobiltelefone" | "fahrzeuge"
  | "netzkomponenten" | "drucker" | "speichersysteme"
  // ICS / OT (eigener Root — NIS2 KRITIS-relevant, BSI IND.*)
  | "ics_ot" | "scada_leitsystem" | "sps_plc" | "sensoren_aktoren" | "safety_systems" | "ics_maschinen" | "fernwartung_ot"
  // IoT (eigener Root)
  | "iot"
  // Informationen
  | "informationen" | "daten" | "dokumente"
  // Prozesse (eigener Root — ISO 27005 Primary Asset)
  | "prozesse" | "geschaeftsprozesse" | "fachverfahren"
  // Lieferanten / Dienstleister (eigener Root — NIS2 Art. 21(2) d)
  | "lieferanten" | "lieferanten_kritisch"
  // Anwendungen
  | "anwendungen" | "webbrowser" | "webserver" | "webanwendungen"
  | "vk_anwendungen" | "tk_anwendungen" | "email"
  | "interpersonelle_komm" | "office_anwendungen"
  | "datenbanken" | "verzeichnisdienste" | "cloud_services";

export type ZokRoot =
  | "standorte" | "nutzende" | "netze" | "it_systeme"
  | "ics_ot" | "iot" | "prozesse" | "lieferanten"
  | "informationen" | "anwendungen";

export interface ZokNode {
  id: ZokId;
  parentId: ZokId | null;
  rootId: ZokRoot;
  label_de: string;
  label_en: string;
  description_de: string;
  description_en: string;
  level: 1 | 2 | 3 | 4;
  /** Lucide icon name */
  icon: string;
}

export const zokNodes: ZokNode[] = [
  // ── Standorte ──
  { id: "standorte", parentId: null, rootId: "standorte", level: 1, icon: "Building2",
    label_de: "Standorte", label_en: "Locations",
    description_de: "Geografische Standorte der Institution.", description_en: "Geographic locations of the institution." },
  { id: "gebaeude", parentId: "standorte", rootId: "standorte", level: 2, icon: "Building",
    label_de: "Gebäude", label_en: "Buildings",
    description_de: "Gebäude an einem Standort.", description_en: "Buildings at a site." },
  { id: "raeume", parentId: "gebaeude", rootId: "standorte", level: 3, icon: "DoorOpen",
    label_de: "Räume", label_en: "Rooms",
    description_de: "Allgemeine Räume in Gebäuden.", description_en: "General rooms within buildings." },
  { id: "raeume_techn_infra", parentId: "raeume", rootId: "standorte", level: 4, icon: "Cpu",
    label_de: "Räume für technische Infrastruktur", label_en: "Technical Infrastructure Rooms",
    description_de: "Räume mit Netz- und Versorgungstechnik.", description_en: "Rooms hosting network and utility infrastructure." },
  { id: "serverraeume", parentId: "raeume", rootId: "standorte", level: 4, icon: "Server",
    label_de: "Serverräume", label_en: "Server Rooms",
    description_de: "Räume mit Servern und zentraler IT (BSI INF.2).", description_en: "Rooms containing servers and central IT (BSI INF.2)." },
  { id: "datentraegerarchiv", parentId: "raeume", rootId: "standorte", level: 4, icon: "Archive",
    label_de: "Datenträgerarchiv", label_en: "Media Archive",
    description_de: "Räume zur Aufbewahrung von Datenträgern.", description_en: "Rooms used for storage of data media." },

  // ── Nutzende ──
  { id: "nutzende", parentId: null, rootId: "nutzende", level: 1, icon: "Users",
    label_de: "Nutzende", label_en: "Users",
    description_de: "Alle Personen, die mit Informationen arbeiten.", description_en: "All persons working with information." },
  { id: "mitarbeitende", parentId: "nutzende", rootId: "nutzende", level: 2, icon: "User",
    label_de: "Mitarbeitende", label_en: "Employees",
    description_de: "Reguläre interne Mitarbeitende der Institution.", description_en: "Regular internal employees of the institution." },
  { id: "fuehrungskraefte", parentId: "nutzende", rootId: "nutzende", level: 2, icon: "UserCog",
    label_de: "Führungskräfte", label_en: "Managers",
    description_de: "Personen mit Führungs- und Personalverantwortung (alle Ebenen außer Top-Leitung).", description_en: "Persons with managerial and HR responsibility (all levels except top leadership)." },
  { id: "institutionsleitung", parentId: "nutzende", rootId: "nutzende", level: 2, icon: "Crown",
    label_de: "Institutionsleitung", label_en: "Executive Leadership",
    description_de: "Oberste Leitungsebene (Geschäftsführung/Vorstand) — gemäß NIS2 Art. 20 persönlich verantwortlich.", description_en: "Top-level leadership (executive board) — personally accountable per NIS2 Art. 20." },
  { id: "administrierende", parentId: "nutzende", rootId: "nutzende", level: 2, icon: "ShieldCheck",
    label_de: "Administrierende", label_en: "Administrators",
    description_de: "Personen mit privilegierten/administrativen Rechten (intern oder extern).", description_en: "Persons holding privileged/administrative rights (internal or external)." },
  { id: "externe", parentId: "nutzende", rootId: "nutzende", level: 2, icon: "UserPlus",
    label_de: "Externe", label_en: "External Personnel",
    description_de: "Externe Mitarbeitende, Dienstleister, Auftragnehmer mit Zugriff auf Informationen oder Systeme.", description_en: "External staff, service providers, contractors with access to information or systems." },

  // ── Netze ──
  { id: "netze", parentId: null, rootId: "netze", level: 1, icon: "Network",
    label_de: "Netze", label_en: "Networks",
    description_de: "Datennetze der Institution.", description_en: "Data networks of the institution." },
  { id: "netze_intern", parentId: "netze", rootId: "netze", level: 2, icon: "Router",
    label_de: "Interne Netze", label_en: "Internal Networks",
    description_de: "LANs, VLANs, segmentierte Bereiche.", description_en: "LANs, VLANs, segmented zones." },
  { id: "wlans", parentId: "netze_intern", rootId: "netze", level: 3, icon: "Wifi",
    label_de: "WLANs", label_en: "Wireless Networks",
    description_de: "Drahtlose Netze.", description_en: "Wireless networks." },
  { id: "netze_extern", parentId: "netze", rootId: "netze", level: 2, icon: "Globe",
    label_de: "Externe Netze", label_en: "External Networks",
    description_de: "Sammelkategorie für nicht-interne Netze.", description_en: "Umbrella for non-internal networks." },
  { id: "internet_anbindung", parentId: "netze_extern", rootId: "netze", level: 3, icon: "Cloud",
    label_de: "Internet-Anbindung", label_en: "Internet Uplink",
    description_de: "Öffentlicher Internet-Anschluss — untrusted, hohes Bedrohungsniveau (BSI NET.1.1).", description_en: "Public internet uplink — untrusted, high threat level (BSI NET.1.1)." },
  { id: "vpn", parentId: "netze_extern", rootId: "netze", level: 3, icon: "Lock",
    label_de: "VPN", label_en: "VPN",
    description_de: "Verschlüsselte, authentifizierte Tunnel (Site-to-Site, Remote Access) — BSI NET.3.3.", description_en: "Encrypted, authenticated tunnels (site-to-site, remote access) — BSI NET.3.3." },
  { id: "wan_provider", parentId: "netze_extern", rootId: "netze", level: 3, icon: "Network",
    label_de: "WAN / Provider-Netze", label_en: "WAN / Provider Networks",
    description_de: "Vertraglich gebundene Provider-Verbindungen (MPLS, SD-WAN, Standortkopplungen).", description_en: "Contracted provider links (MPLS, SD-WAN, site interconnects)." },

  // ── IT-Systeme ──
  { id: "it_systeme", parentId: null, rootId: "it_systeme", level: 1, icon: "HardDrive",
    label_de: "IT-Systeme", label_en: "IT Systems",
    description_de: "Hardware und Plattformen.", description_en: "Hardware and platforms." },
  { id: "hostsysteme", parentId: "it_systeme", rootId: "it_systeme", level: 2, icon: "Server",
    label_de: "Hostsysteme", label_en: "Host Systems",
    description_de: "Server, Virtualisierungshosts, zentrale Systeme.", description_en: "Servers, virtualization hosts, central systems." },
  { id: "endgeraete", parentId: "it_systeme", rootId: "it_systeme", level: 2, icon: "Monitor",
    label_de: "Endgeräte", label_en: "End Devices",
    description_de: "Arbeitsplatzrechner, Laptops, Thin Clients.", description_en: "Workstations, laptops, thin clients." },
  { id: "mobiltelefone", parentId: "endgeraete", rootId: "it_systeme", level: 3, icon: "Smartphone",
    label_de: "Mobiltelefone", label_en: "Mobile Phones",
    description_de: "Smartphones und mobile Endgeräte.", description_en: "Smartphones and mobile devices." },
  { id: "fahrzeuge", parentId: "it_systeme", rootId: "it_systeme", level: 2, icon: "Car",
    label_de: "Fahrzeuge", label_en: "Vehicles",
    description_de: "Fahrzeuge mit IT-Komponenten (BSI INF.10) — Telematik, Infotainment, OT.", description_en: "Vehicles with IT components (BSI INF.10) — telematics, infotainment, OT." },
  // (ICS/OT and IoT are now eigene Roots — siehe unten)
  { id: "netzkomponenten", parentId: "it_systeme", rootId: "it_systeme", level: 2, icon: "Router",
    label_de: "Netzkomponenten", label_en: "Network Components",
    description_de: "Router, Switches, Firewalls, Load Balancer (BSI NET.3.*).", description_en: "Routers, switches, firewalls, load balancers (BSI NET.3.*)." },
  { id: "drucker", parentId: "it_systeme", rootId: "it_systeme", level: 2, icon: "Printer",
    label_de: "Drucker / Multifunktionsgeräte", label_en: "Printers / Multifunction Devices",
    description_de: "Drucker, Scanner, MFP — oft unterschätzte Angriffsfläche (BSI SYS.4.1).", description_en: "Printers, scanners, MFP — often underestimated attack surface (BSI SYS.4.1)." },
  { id: "speichersysteme", parentId: "it_systeme", rootId: "it_systeme", level: 2, icon: "Database",
    label_de: "Speichersysteme", label_en: "Storage Systems",
    description_de: "SAN, NAS, Backup-Appliances, Tape Libraries (BSI SYS.1.8).", description_en: "SAN, NAS, backup appliances, tape libraries (BSI SYS.1.8)." },

  // ── ICS / OT (eigener Root, NIS2 KRITIS — BSI IND.*) ──
  { id: "ics_ot", parentId: null, rootId: "ics_ot", level: 1, icon: "Factory",
    label_de: "ICS / OT-Systeme", label_en: "ICS / OT Systems",
    description_de: "Industrielle Steuerungs- und Automatisierungstechnik (BSI IND.*) — kritisch für NIS2-Sektoren Energie, Wasser, Produktion, Transport.", description_en: "Industrial control & automation technology (BSI IND.*) — critical for NIS2 sectors energy, water, manufacturing, transport." },
  { id: "scada_leitsystem", parentId: "ics_ot", rootId: "ics_ot", level: 2, icon: "MonitorCog",
    label_de: "SCADA / Leitsysteme / HMI", label_en: "SCADA / Control Systems / HMI",
    description_de: "Prozessleit- und Überwachungssysteme, HMI-Stationen, Engineering-Workstations (BSI IND.1).", description_en: "Process control and supervisory systems, HMI stations, engineering workstations (BSI IND.1)." },
  { id: "sps_plc", parentId: "ics_ot", rootId: "ics_ot", level: 2, icon: "Cpu",
    label_de: "Speicherprogrammierbare Steuerungen (SPS / PLC)", label_en: "Programmable Logic Controllers (PLC)",
    description_de: "SPS/PLC-Steuerungen, RTUs, DCS-Controller (BSI IND.2.2).", description_en: "PLC controllers, RTUs, DCS controllers (BSI IND.2.2)." },
  { id: "sensoren_aktoren", parentId: "ics_ot", rootId: "ics_ot", level: 2, icon: "Activity",
    label_de: "Sensoren & Aktoren (Field Devices)", label_en: "Sensors & Actuators (Field Devices)",
    description_de: "Feldgeräte, Messumformer, Ventile, intelligente Sensorik (BSI IND.2.3).", description_en: "Field devices, transmitters, valves, smart sensors (BSI IND.2.3)." },
  { id: "safety_systems", parentId: "ics_ot", rootId: "ics_ot", level: 2, icon: "ShieldAlert",
    label_de: "Sicherheits-/Safety-Systeme (SIS)", label_en: "Safety Instrumented Systems (SIS)",
    description_de: "Sicherheitsgerichtete Steuerungen und Notabschaltsysteme (BSI IND.2.7) — IEC 61511 / 61508.", description_en: "Safety-related control and emergency shutdown systems (BSI IND.2.7) — IEC 61511 / 61508." },
  { id: "ics_maschinen", parentId: "ics_ot", rootId: "ics_ot", level: 2, icon: "Cog",
    label_de: "Maschinen & Anlagen", label_en: "Machines & Plant Equipment",
    description_de: "Vernetzte Produktionsmaschinen, Roboter, CNC, Anlagen (BSI IND.2.4).", description_en: "Networked production machines, robots, CNC, plant equipment (BSI IND.2.4)." },
  { id: "fernwartung_ot", parentId: "ics_ot", rootId: "ics_ot", level: 2, icon: "Wrench",
    label_de: "Fernwartungszugänge OT", label_en: "OT Remote Maintenance Access",
    description_de: "Fernwartungs- und Hersteller-Zugänge in OT-Umgebungen (BSI IND.3.2) — kritischer Angriffsvektor.", description_en: "Remote maintenance and vendor access into OT environments (BSI IND.3.2) — critical attack vector." },

  // ── IoT (eigener Root) ──
  { id: "iot", parentId: null, rootId: "iot", level: 1, icon: "Radio",
    label_de: "IoT-Geräte", label_en: "IoT Devices",
    description_de: "Vernetzte Sensoren, Aktoren und Smart Devices außerhalb klassischer IT/OT (BSI SYS.4.4).", description_en: "Connected sensors, actuators and smart devices outside classical IT/OT (BSI SYS.4.4)." },

  // ── Prozesse (eigener Root — ISO 27005 Primary Asset) ──
  { id: "prozesse", parentId: null, rootId: "prozesse", level: 1, icon: "Workflow",
    label_de: "Prozesse", label_en: "Processes",
    description_de: "Geschäftsprozesse und Fachverfahren als primäre Schutzobjekte (ISO 27005, BSI CON.1).", description_en: "Business processes and specialized procedures as primary assets (ISO 27005, BSI CON.1)." },
  { id: "geschaeftsprozesse", parentId: "prozesse", rootId: "prozesse", level: 2, icon: "GitBranch",
    label_de: "Geschäftsprozesse", label_en: "Business Processes",
    description_de: "Kritische Geschäftsprozesse und ihre Informationsverarbeitung.", description_en: "Critical business processes and their information handling." },
  { id: "fachverfahren", parentId: "prozesse", rootId: "prozesse", level: 2, icon: "ClipboardList",
    label_de: "Fachverfahren", label_en: "Specialized Procedures",
    description_de: "Fachspezifische, regulierte Verfahren (z. B. Patientenversorgung, Wasseraufbereitung, Energieerzeugung) — NIS2 sektorspezifisch.", description_en: "Sector-specific regulated procedures (e.g. patient care, water treatment, energy generation) — NIS2 sector-specific." },

  // ── Lieferanten / Dienstleister (eigener Root — NIS2 Art. 21(2) d Supply Chain) ──
  { id: "lieferanten", parentId: null, rootId: "lieferanten", level: 1, icon: "Truck",
    label_de: "Lieferanten & Dienstleister", label_en: "Suppliers & Service Providers",
    description_de: "Externe Lieferanten, IT-Dienstleister, Cloud-Anbieter, Wartungspartner (NIS2 Art. 21(2) d — Supply-Chain-Sicherheit).", description_en: "External suppliers, IT service providers, cloud vendors, maintenance partners (NIS2 Art. 21(2) d — supply-chain security)." },
  { id: "lieferanten_kritisch", parentId: "lieferanten", rootId: "lieferanten", level: 2, icon: "AlertTriangle",
    label_de: "Kritische Lieferanten", label_en: "Critical Suppliers",
    description_de: "Lieferanten mit Zugriff auf kritische Systeme/Daten oder ohne kurzfristige Substituierbarkeit — verschärfte Kontrollen.", description_en: "Suppliers with access to critical systems/data or without short-term substitutability — enhanced controls." },

  // ── Informationen ──
  { id: "informationen", parentId: null, rootId: "informationen", level: 1, icon: "FileText",
    label_de: "Informationen", label_en: "Information",
    description_de: "Schutzwürdige Informationen.", description_en: "Information requiring protection." },
  { id: "daten", parentId: "informationen", rootId: "informationen", level: 2, icon: "Database",
    label_de: "Daten", label_en: "Data",
    description_de: "Strukturierte und unstrukturierte Daten (Dateien, Records, Logs).", description_en: "Structured and unstructured data (files, records, logs)." },
  { id: "dokumente", parentId: "informationen", rootId: "informationen", level: 2, icon: "FileText",
    label_de: "Dokumente", label_en: "Documents",
    description_de: "Verträge, Pläne, Aufzeichnungen, Wissensartefakte (BSI CON.6).", description_en: "Contracts, plans, records, knowledge artifacts (BSI CON.6)." },

  // ── Anwendungen ──
  { id: "anwendungen", parentId: null, rootId: "anwendungen", level: 1, icon: "AppWindow",
    label_de: "Anwendungen", label_en: "Applications",
    description_de: "Software, die Informationen verarbeitet.", description_en: "Software processing information." },
  { id: "webbrowser", parentId: "anwendungen", rootId: "anwendungen", level: 2, icon: "Compass",
    label_de: "Webbrowser", label_en: "Web Browsers",
    description_de: "Clientseitige Webbrowser.", description_en: "Client-side web browsers." },
  { id: "webserver", parentId: "anwendungen", rootId: "anwendungen", level: 2, icon: "Server",
    label_de: "Webserver", label_en: "Web Servers",
    description_de: "Serverseitige Webserver-Software.", description_en: "Server-side web server software." },
  { id: "webanwendungen", parentId: "anwendungen", rootId: "anwendungen", level: 2, icon: "Globe",
    label_de: "Webanwendungen", label_en: "Web Applications",
    description_de: "Browserbasierte Anwendungen.", description_en: "Browser-based applications." },
  { id: "vk_anwendungen", parentId: "anwendungen", rootId: "anwendungen", level: 2, icon: "Video",
    label_de: "VK-Anwendungen", label_en: "Videoconferencing Applications",
    description_de: "Videokonferenz-Software.", description_en: "Videoconferencing software." },
  { id: "tk_anwendungen", parentId: "anwendungen", rootId: "anwendungen", level: 2, icon: "Phone",
    label_de: "TK-Anwendungen", label_en: "Telecommunication Applications",
    description_de: "Telekommunikations-Software (VoIP, PBX).", description_en: "Telecom software (VoIP, PBX)." },
  { id: "email", parentId: "anwendungen", rootId: "anwendungen", level: 2, icon: "Mail",
    label_de: "E-Mail", label_en: "E-Mail",
    description_de: "E-Mail-Server und -Clients (BSI APP.5.3).", description_en: "E-mail servers and clients (BSI APP.5.3)." },
  { id: "interpersonelle_komm", parentId: "anwendungen", rootId: "anwendungen", level: 2, icon: "MessageSquare",
    label_de: "Interpersonelle Kommunikationsanwendungen", label_en: "Interpersonal Communication Apps",
    description_de: "Chat, Messaging, Kollaboration.", description_en: "Chat, messaging, collaboration." },
  { id: "office_anwendungen", parentId: "anwendungen", rootId: "anwendungen", level: 2, icon: "FileSpreadsheet",
    label_de: "Office-Anwendungen", label_en: "Office Applications",
    description_de: "Bürosoftware (Textverarbeitung, Tabellen, Präsentation).", description_en: "Office productivity software." },
  { id: "datenbanken", parentId: "anwendungen", rootId: "anwendungen", level: 2, icon: "Database",
    label_de: "Datenbanken", label_en: "Databases",
    description_de: "Datenbankmanagementsysteme (BSI APP.4.3) — relational, NoSQL, Data Warehouses.", description_en: "Database management systems (BSI APP.4.3) — relational, NoSQL, data warehouses." },
  { id: "verzeichnisdienste", parentId: "anwendungen", rootId: "anwendungen", level: 2, icon: "Users",
    label_de: "Verzeichnisdienste", label_en: "Directory Services",
    description_de: "Active Directory, LDAP, IAM-Verzeichnisse (BSI APP.2.1/2.2).", description_en: "Active Directory, LDAP, IAM directories (BSI APP.2.1/2.2)." },
  { id: "cloud_services", parentId: "anwendungen", rootId: "anwendungen", level: 2, icon: "Cloud",
    label_de: "Cloud-Dienste", label_en: "Cloud Services",
    description_de: "Genutzte SaaS/PaaS/IaaS-Dienste (BSI OPS.2.2) — Microsoft 365, AWS, Azure usw.", description_en: "Consumed SaaS/PaaS/IaaS services (BSI OPS.2.2) — Microsoft 365, AWS, Azure, etc." },
];

// ── Lookup maps ──

const _zokById = new Map<ZokId, ZokNode>(zokNodes.map(n => [n.id, n]));
const _childrenByParent = new Map<ZokId | "ROOT", ZokId[]>();
for (const n of zokNodes) {
  const key = n.parentId ?? "ROOT";
  const arr = _childrenByParent.get(key) ?? [];
  arr.push(n.id);
  _childrenByParent.set(key, arr);
}

export function getZok(id: ZokId): ZokNode | undefined {
  return _zokById.get(id);
}

export function getZokRoots(): ZokNode[] {
  return zokNodes.filter(n => n.parentId === null);
}

export function getZokChildren(id: ZokId | "ROOT"): ZokNode[] {
  const ids = _childrenByParent.get(id) ?? [];
  return ids.map(i => _zokById.get(i)!).filter(Boolean);
}

/** Returns ancestors from immediate parent up to the root (excluding the node itself). */
export function getZokAncestors(id: ZokId): ZokNode[] {
  const out: ZokNode[] = [];
  let current = _zokById.get(id);
  while (current?.parentId) {
    const parent = _zokById.get(current.parentId);
    if (!parent) break;
    out.push(parent);
    current = parent;
  }
  return out;
}

/** Returns all descendants (children, grandchildren, …) of the given node. */
export function getZokDescendants(id: ZokId): ZokNode[] {
  const out: ZokNode[] = [];
  const stack: ZokId[] = [...(_childrenByParent.get(id) ?? [])];
  while (stack.length) {
    const next = stack.pop()!;
    const node = _zokById.get(next);
    if (!node) continue;
    out.push(node);
    stack.push(...(_childrenByParent.get(next) ?? []));
  }
  return out;
}

/**
 * Vererbung: returns the set of effective ZOK IDs for an asset.
 * Includes the directly assigned IDs PLUS all ancestors (so requirements
 * defined on a parent category apply to children automatically).
 */
export function getEffectiveZokIds(assignedZokIds: ZokId[]): ZokId[] {
  const set = new Set<ZokId>();
  for (const id of assignedZokIds) {
    if (!_zokById.has(id)) continue;
    set.add(id);
    for (const a of getZokAncestors(id)) set.add(a.id);
  }
  return [...set];
}

/** Render-friendly inheritance path "Standorte › Gebäude › Räume › Serverräume" */
export function getZokPath(id: ZokId, lang: "de" | "en" = "de"): string {
  const node = _zokById.get(id);
  if (!node) return id;
  const chain = [...getZokAncestors(id).reverse(), node];
  return chain.map(n => (lang === "de" ? n.label_de : n.label_en)).join(" › ");
}

// ── Legacy asset_type → ZOK default mapping (one-time migration helper) ──

export const LEGACY_ASSET_TYPE_TO_ZOK: Record<string, ZokId[]> = {
  Application: ["webanwendungen"],
  Server: ["hostsysteme"],
  Database: ["datenbanken"],
  Cloud: ["cloud_services"],
  Network: ["netzkomponenten", "netze_intern"],
  "OT/ICS": ["ics_ot"],
  SCADA: ["scada_leitsystem"],
  PLC: ["sps_plc"],
  Sensor: ["sensoren_aktoren"],
  Safety: ["safety_systems"],
  Machine: ["ics_maschinen"],
  External: ["netze_extern"],
  Endpoint: ["endgeraete"],
  "Mobile Device": ["mobiltelefone"],
  IoT: ["iot"],
  "Security Tool": ["anwendungen"],
  Storage: ["speichersysteme"],
  Printer: ["drucker"],
  Directory: ["verzeichnisdienste"],
  Process: ["geschaeftsprozesse"],
  Document: ["dokumente"],
  Supplier: ["lieferanten"],
  "Critical Supplier": ["lieferanten_kritisch"],
};

export function mapLegacyAssetType(legacyType: string): ZokId[] {
  return LEGACY_ASSET_TYPE_TO_ZOK[legacyType] ?? ["it_systeme"];
}
