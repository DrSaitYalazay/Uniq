// Inspiration Checklist — comprehensive typical services & assets per NIS2/KRITIS sector.
// Pure suggestions, no criticality / owner / musterdata. User picks what applies.
// Depth target: ~15-25 services per sector, 6-12 assets per service, covering
// business, OT/ICS (where relevant), IT, security, support & compliance layers.

export type InspirationAsset = {
  name: string;
  type:
    | "Server"
    | "Application"
    | "Database"
    | "Network"
    | "Endpoint"
    | "Cloud"
    | "SaaS"
    | "Data"
    | "AI Model"
    | "Document"
    | "Other";
};
export type InspirationService = {
  name: string;
  category: "Business" | "Support" | "IT";
  description?: string;
  assets: InspirationAsset[];
};
export type InspirationSector = {
  key: string;
  de: string;
  en: string;
  services: InspirationService[];
};

// ---------- Shared building blocks ----------

const IT_CORE: InspirationService = {
  name: "IT-Basisdienste (Core IT)",
  category: "IT",
  description: "AD/Entra, DNS, DHCP, File, Print, Email, Backup",
  assets: [
    { name: "Active Directory / Entra ID", type: "Application" },
    { name: "DNS/DHCP Server", type: "Server" },
    { name: "File Server / NAS", type: "Server" },
    { name: "Mail Gateway (Exchange/M365)", type: "Application" },
    { name: "Print Server", type: "Server" },
    { name: "Backup System (Veeam/Commvault)", type: "Application" },
    { name: "Patch Management (WSUS/Intune)", type: "Application" },
    { name: "MDM / UEM", type: "Application" },
    { name: "PKI / Certificate Authority", type: "Application" },
    { name: "Zeitserver (NTP)", type: "Server" },
  ],
};

const NETWORK_CORE: InspirationService = {
  name: "Netzwerk & Perimeter",
  category: "IT",
  description: "Firewall, Router, Switching, WLAN, VPN, Proxy",
  assets: [
    { name: "Perimeter Firewall", type: "Network" },
    { name: "Internal Firewall / Segmentation", type: "Network" },
    { name: "Core Switches", type: "Network" },
    { name: "Edge/Access Switches", type: "Network" },
    { name: "Router / SD-WAN Edge", type: "Network" },
    { name: "WLAN Controller & Access Points", type: "Network" },
    { name: "VPN Gateway (IPsec/SSL)", type: "Network" },
    { name: "Web Proxy / Secure Web Gateway", type: "Application" },
    { name: "Load Balancer / WAF", type: "Network" },
    { name: "DDoS Mitigation", type: "Cloud" },
  ],
};

const SEC_OPS: InspirationService = {
  name: "Security Operations (SOC)",
  category: "Support",
  description: "SIEM, EDR, IDS/IPS, Vulnerability, Threat Intel",
  assets: [
    { name: "SIEM (Splunk/Sentinel/QRadar)", type: "Application" },
    { name: "EDR / XDR Agent", type: "Endpoint" },
    { name: "IDS/IPS Sensor", type: "Network" },
    { name: "Vulnerability Scanner (Tenable/Qualys)", type: "Application" },
    { name: "Threat Intelligence Platform", type: "Application" },
    { name: "Ticket/Incident System (Jira/ServiceNow SIR)", type: "Application" },
    { name: "Log Collector / Syslog", type: "Server" },
    { name: "PAM / Privileged Access", type: "Application" },
    { name: "IAM / SSO (Keycloak/Okta)", type: "Application" },
    { name: "Sandbox / Malware Analysis", type: "Application" },
  ],
};

const WORKPLACE: InspirationService = {
  name: "Arbeitsplatz & Kollaboration",
  category: "Support",
  description: "Client-Endgeräte, Office, Chat, Telefonie",
  assets: [
    { name: "Client Notebooks", type: "Endpoint" },
    { name: "Virtual Desktop (VDI/AVD)", type: "Cloud" },
    { name: "Microsoft 365 / Google Workspace", type: "SaaS" },
    { name: "Teams / Slack", type: "SaaS" },
    { name: "IP Telefonie (PBX/Teams Voice)", type: "Application" },
    { name: "Videokonferenz-Räume", type: "Endpoint" },
    { name: "Mobile Devices (iOS/Android)", type: "Endpoint" },
  ],
};

// ---------- Sector catalog ----------

export const INSPIRATION_CATALOG: InspirationSector[] = [
  // ============================== ENERGY ==============================
  {
    key: "energy",
    de: "Energie",
    en: "Energy",
    services: [
      {
        name: "Netzleitsystem (SCADA/EMS)",
        category: "Business",
        description: "Echtzeit-Netzführung Übertragungs-/Verteilnetz",
        assets: [
          { name: "SCADA Master (Primary)", type: "Server" },
          { name: "SCADA Master (Standby/DR)", type: "Server" },
          { name: "Historian (PI/AVEVA)", type: "Database" },
          { name: "HMI / Operator Workstations", type: "Endpoint" },
          { name: "Front-End Processor (FEP)", type: "Server" },
          { name: "Engineering Workstation", type: "Endpoint" },
          { name: "ICCP/TASE.2 Gateway", type: "Application" },
        ],
      },
      {
        name: "Fernwirktechnik & Umspannwerks-Automatisierung",
        category: "Business",
        description: "IEC 60870-5-104, IEC 61850",
        assets: [
          { name: "RTU / Fernwirkgeräte", type: "Other" },
          { name: "Schutz- & Steuergeräte (IED)", type: "Other" },
          { name: "IEC 61850 Station Bus", type: "Network" },
          { name: "Prozess-Bus (SV/GOOSE)", type: "Network" },
          { name: "Merging Units", type: "Other" },
          { name: "Zeitsynchronisation (PTP/GPS)", type: "Other" },
        ],
      },
      {
        name: "Kraftwerks-Leittechnik (DCS)",
        category: "Business",
        description: "Erzeugung Konv./Regenerativ",
        assets: [
          { name: "DCS Controller (Siemens T3000 / ABB 800xA)", type: "Server" },
          { name: "Turbinen-/Kesselregler", type: "Other" },
          { name: "Vibration Monitoring", type: "Other" },
          { name: "Emissions Monitoring (CEMS)", type: "Application" },
        ],
      },
      {
        name: "Smart Metering (SMGWA)",
        category: "Business",
        assets: [
          { name: "Smart-Meter-Gateway-Administration", type: "Application" },
          { name: "Meter Data Management (MDM)", type: "Application" },
          { name: "Head-End System (HES)", type: "Application" },
          { name: "PKI SMGW", type: "Application" },
        ],
      },
      {
        name: "Marktkommunikation (EDIFACT/AS4)",
        category: "Business",
        assets: [
          { name: "EDI/AS4 Gateway", type: "Application" },
          { name: "MaKo Clearing", type: "Application" },
          { name: "BDEW-Zertifikate", type: "Other" },
        ],
      },
      {
        name: "Energiedatenmanagement (EDM)",
        category: "Business",
        assets: [
          { name: "EDM System", type: "Application" },
          { name: "Prognose-/Fahrplanmanagement", type: "Application" },
          { name: "Bilanzkreis-Tool", type: "Application" },
        ],
      },
      {
        name: "Handel & Portfolio (ETRM)",
        category: "Business",
        assets: [
          { name: "ETRM (Allegro/Endur)", type: "Application" },
          { name: "Marktdaten-Feeds", type: "Data" },
        ],
      },
      {
        name: "Ladeinfrastruktur (E-Mobilität)",
        category: "Business",
        assets: [
          { name: "CPO Backend (OCPP)", type: "Application" },
          { name: "Ladesäulen", type: "Other" },
          { name: "Roaming-Plattform (OCPI)", type: "Application" },
        ],
      },
      {
        name: "GIS & Netzdokumentation",
        category: "Support",
        assets: [
          { name: "GIS Server (Smallworld/ArcGIS)", type: "Application" },
          { name: "Netzdokumentations-DB", type: "Database" },
          { name: "Feldgeräte / Tablets", type: "Endpoint" },
        ],
      },
      {
        name: "Instandhaltung (EAM)",
        category: "Support",
        assets: [
          { name: "SAP PM / IBM Maximo", type: "Application" },
          { name: "Mobile Wartungs-Apps", type: "Endpoint" },
        ],
      },
      {
        name: "Kundenservice & Abrechnung (CRM/Billing)",
        category: "Business",
        assets: [
          { name: "SAP IS-U / Kraken", type: "Application" },
          { name: "CRM (Salesforce/MS Dynamics)", type: "Application" },
          { name: "Kundenportal", type: "Application" },
        ],
      },
      {
        name: "OT-Fernzugriff (Jump/Bastion)",
        category: "Support",
        assets: [
          { name: "Jump Server / Bastion", type: "Server" },
          { name: "OT-DMZ Firewall", type: "Network" },
          { name: "Data Diode", type: "Other" },
        ],
      },
      NETWORK_CORE,
      SEC_OPS,
      IT_CORE,
      WORKPLACE,
    ],
  },

  // ============================== WATER ==============================
  {
    key: "water",
    de: "Wasser",
    en: "Water",
    services: [
      {
        name: "Trinkwasseraufbereitung (SCADA)",
        category: "Business",
        assets: [
          { name: "SCADA Leitstand", type: "Server" },
          { name: "PLCs / SPS (Siemens S7 / Rockwell)", type: "Other" },
          { name: "Chlor-/Trübungsmesssysteme", type: "Other" },
          { name: "Historian", type: "Database" },
          { name: "HMI Panels", type: "Endpoint" },
        ],
      },
      {
        name: "Abwasserbehandlung",
        category: "Business",
        assets: [
          { name: "Kläranlagen-SPS", type: "Other" },
          { name: "Belebungsbecken-Sensorik", type: "Other" },
          { name: "Faulturm-Steuerung", type: "Other" },
        ],
      },
      {
        name: "Netzsteuerung Pumpwerke/Ventile",
        category: "Business",
        assets: [
          { name: "Telemetrie-Netz (GPRS/LTE)", type: "Network" },
          { name: "Fernwirkgeräte", type: "Other" },
        ],
      },
      {
        name: "Regenwasser-/Kanalmanagement",
        category: "Business",
        assets: [{ name: "Kanal-SCADA", type: "Server" }, { name: "Pegelmessung", type: "Other" }],
      },
      {
        name: "Labor-Informationssystem (LIMS)",
        category: "Support",
        assets: [
          { name: "LIMS", type: "Application" },
          { name: "Laborgeräte-Anbindung", type: "Other" },
        ],
      },
      {
        name: "Netzdokumentation & GIS",
        category: "Support",
        assets: [{ name: "GIS", type: "Application" }, { name: "Kataster-DB", type: "Database" }],
      },
      {
        name: "Kundenabrechnung",
        category: "Business",
        assets: [{ name: "Abrechnungssystem", type: "Application" }, { name: "Kundenportal", type: "Application" }],
      },
      {
        name: "Instandhaltung",
        category: "Support",
        assets: [{ name: "EAM System", type: "Application" }],
      },
      {
        name: "OT-Fernzugriff",
        category: "Support",
        assets: [{ name: "Jump Server", type: "Server" }, { name: "OT-Firewall", type: "Network" }],
      },
      NETWORK_CORE,
      SEC_OPS,
      IT_CORE,
      WORKPLACE,
    ],
  },

  // ============================== FOOD ==============================
  {
    key: "food",
    de: "Ernährung",
    en: "Food",
    services: [
      {
        name: "Produktions-MES",
        category: "Business",
        assets: [
          { name: "MES Server", type: "Server" },
          { name: "OEE Terminals", type: "Endpoint" },
          { name: "Rezeptur-DB", type: "Database" },
          { name: "SPS (Abfüllung/Verpackung)", type: "Other" },
        ],
      },
      {
        name: "Kühl-/Lagersteuerung",
        category: "Business",
        assets: [
          { name: "Kälte-SCADA", type: "Server" },
          { name: "Temperatursensorik", type: "Other" },
          { name: "Alarmserver", type: "Application" },
        ],
      },
      {
        name: "Qualitätsmanagement (QM/HACCP)",
        category: "Business",
        assets: [{ name: "QM-System", type: "Application" }, { name: "CCP-Monitoring", type: "Application" }],
      },
      {
        name: "Rückverfolgbarkeit / Chargen",
        category: "Business",
        assets: [
          { name: "Traceability DB", type: "Database" },
          { name: "Barcode/RFID Scanner", type: "Endpoint" },
        ],
      },
      {
        name: "Warenwirtschaft (ERP)",
        category: "Business",
        assets: [{ name: "SAP S/4HANA", type: "Application" }, { name: "Stammdaten (MDM)", type: "Database" }],
      },
      {
        name: "Lagerverwaltung (WMS)",
        category: "Business",
        assets: [{ name: "WMS", type: "Application" }, { name: "Staplerleitsystem", type: "Application" }],
      },
      {
        name: "Logistik / TMS",
        category: "Support",
        assets: [{ name: "TMS", type: "Application" }, { name: "Fuhrpark-Telematik", type: "Application" }],
      },
      {
        name: "E-Commerce / B2B-Portal",
        category: "Business",
        assets: [{ name: "Shop-System", type: "Application" }, { name: "EDI (VDA/EDIFACT)", type: "Application" }],
      },
      NETWORK_CORE,
      SEC_OPS,
      IT_CORE,
      WORKPLACE,
    ],
  },

  // ============================== HEALTHCARE ==============================
  {
    key: "health",
    de: "Gesundheit",
    en: "Healthcare",
    services: [
      {
        name: "Krankenhaus-Informationssystem (KIS)",
        category: "Business",
        assets: [
          { name: "KIS Application Server", type: "Server" },
          { name: "KIS Datenbank", type: "Database" },
          { name: "Klinische Arbeitsplätze", type: "Endpoint" },
          { name: "Integration Engine (HL7/FHIR)", type: "Application" },
        ],
      },
      {
        name: "Radiologie (PACS/RIS)",
        category: "Business",
        assets: [
          { name: "PACS Server", type: "Server" },
          { name: "PACS Archiv", type: "Database" },
          { name: "RIS", type: "Application" },
          { name: "Modalitäten (CT/MRT/Röntgen)", type: "Other" },
          { name: "Befundungs-Workstations", type: "Endpoint" },
        ],
      },
      {
        name: "Labor (LIS)",
        category: "Business",
        assets: [
          { name: "LIS", type: "Application" },
          { name: "Laboranalyzer-Anbindung", type: "Other" },
        ],
      },
      {
        name: "Apotheke / Medikation",
        category: "Business",
        assets: [
          { name: "Apotheken-Software", type: "Application" },
          { name: "Medikamenten-Kommissionierer", type: "Other" },
        ],
      },
      {
        name: "OP-Planung & Anästhesie",
        category: "Business",
        assets: [
          { name: "OP-Planungs-System", type: "Application" },
          { name: "PDMS (Anästhesie/ITS)", type: "Application" },
          { name: "Medizinische Monitore", type: "Other" },
        ],
      },
      {
        name: "Medizingeräte-Netz",
        category: "Business",
        assets: [
          { name: "MedTech VLAN", type: "Network" },
          { name: "Infusionspumpen (vernetzt)", type: "Other" },
          { name: "Patientenmonitore", type: "Other" },
          { name: "Beatmungsgeräte", type: "Other" },
        ],
      },
      {
        name: "Telematikinfrastruktur (TI)",
        category: "Business",
        assets: [
          { name: "TI-Konnektor", type: "Other" },
          { name: "eHBA / SMC-B", type: "Other" },
          { name: "KIM Fachdienst", type: "Application" },
          { name: "eRezept-Modul", type: "Application" },
        ],
      },
      {
        name: "Patientenportal & Terminmanagement",
        category: "Business",
        assets: [{ name: "Portal", type: "Application" }, { name: "Terminbuchung", type: "Application" }],
      },
      {
        name: "Notaufnahme (ED)",
        category: "Business",
        assets: [{ name: "ED-Board", type: "Application" }, { name: "Triage-App", type: "Application" }],
      },
      {
        name: "Abrechnung (DRG/EBM)",
        category: "Support",
        assets: [{ name: "Abrechnungssystem", type: "Application" }, { name: "MD-Prüfung-Tool", type: "Application" }],
      },
      {
        name: "Archivierung (KAS/DMS)",
        category: "Support",
        assets: [{ name: "Klinisches Archiv", type: "Application" }, { name: "DMS", type: "Application" }],
      },
      NETWORK_CORE,
      SEC_OPS,
      IT_CORE,
      WORKPLACE,
    ],
  },

  // ============================== FINANCE ==============================
  {
    key: "finance",
    de: "Finanz",
    en: "Finance",
    services: [
      {
        name: "Kernbankensystem",
        category: "Business",
        assets: [
          { name: "Core Banking Application", type: "Application" },
          { name: "Core Banking DB", type: "Database" },
          { name: "Batch-Framework", type: "Application" },
        ],
      },
      {
        name: "Zahlungsverkehr (SEPA/Instant/SWIFT)",
        category: "Business",
        assets: [
          { name: "Payment Hub", type: "Application" },
          { name: "SWIFT Alliance Gateway", type: "Application" },
          { name: "HSM (Zahlungssicherung)", type: "Other" },
          { name: "TARGET2/T2 Anbindung", type: "Network" },
        ],
      },
      {
        name: "Karten & Terminals",
        category: "Business",
        assets: [
          { name: "Card Management System", type: "Application" },
          { name: "Autorisierungs-Host", type: "Server" },
          { name: "POS/ATM Netzwerk", type: "Network" },
        ],
      },
      {
        name: "Online-/Mobile-Banking",
        category: "Business",
        assets: [
          { name: "eBanking Frontend", type: "Application" },
          { name: "Mobile App Backend", type: "Application" },
          { name: "Starke Kundenauthentifizierung (PSD2)", type: "Application" },
          { name: "PSD2 XS2A API", type: "Application" },
        ],
      },
      {
        name: "Trading / Depot / Custody",
        category: "Business",
        assets: [
          { name: "OMS/EMS", type: "Application" },
          { name: "Marktdaten (Reuters/Bloomberg)", type: "Data" },
          { name: "Depotführungssystem", type: "Application" },
        ],
      },
      {
        name: "Kreditprozess (Origination/Servicing)",
        category: "Business",
        assets: [{ name: "Loan Origination", type: "Application" }, { name: "Rating-Engine", type: "Application" }],
      },
      {
        name: "KYC / AML / Fraud",
        category: "Support",
        assets: [
          { name: "AML-System (Actimize/Fircosoft)", type: "Application" },
          { name: "Sanctions-Screening", type: "Application" },
          { name: "Fraud Detection (ML)", type: "AI Model" },
        ],
      },
      {
        name: "Meldewesen (BaFin/Bundesbank/EZB)",
        category: "Support",
        assets: [{ name: "Reporting Engine (Abacus)", type: "Application" }],
      },
      {
        name: "Data Warehouse / Analytics",
        category: "Support",
        assets: [
          { name: "DWH (Teradata/Snowflake)", type: "Database" },
          { name: "BI (Tableau/PowerBI)", type: "Application" },
        ],
      },
      {
        name: "Kundenservice / CRM",
        category: "Business",
        assets: [{ name: "CRM (Salesforce)", type: "Application" }, { name: "Contact Center", type: "Application" }],
      },
      {
        name: "DORA-relevante ICT-Third-Party",
        category: "Support",
        assets: [{ name: "Register of Information", type: "Document" }, { name: "TLPT-Umgebung", type: "Application" }],
      },
      NETWORK_CORE,
      SEC_OPS,
      IT_CORE,
      WORKPLACE,
    ],
  },

  // ============================== TRANSPORT ==============================
  {
    key: "transport",
    de: "Verkehr",
    en: "Transport",
    services: [
      {
        name: "Betriebsleitsystem (ITCS/RBL)",
        category: "Business",
        assets: [
          { name: "ITCS Server", type: "Server" },
          { name: "Fahrzeug-Bordrechner", type: "Endpoint" },
          { name: "Funk (TETRA/LTE)", type: "Network" },
        ],
      },
      {
        name: "Leit- & Sicherungstechnik (LST)",
        category: "Business",
        assets: [
          { name: "Stellwerk (ESTW)", type: "Server" },
          { name: "ETCS/PZB", type: "Other" },
          { name: "Bahnübergangs-Steuerung", type: "Other" },
        ],
      },
      {
        name: "Fahrgast-Information (DFI/DISS)",
        category: "Business",
        assets: [
          { name: "DFI Displays", type: "Endpoint" },
          { name: "Ansage-System", type: "Application" },
          { name: "Fahrplan-Server", type: "Server" },
        ],
      },
      {
        name: "Ticketing / eTicketing / Vertrieb",
        category: "Business",
        assets: [
          { name: "Ticket-Backend", type: "Application" },
          { name: "Automaten", type: "Endpoint" },
          { name: "Validatoren", type: "Endpoint" },
          { name: "Mobile Ticket App", type: "Application" },
        ],
      },
      {
        name: "Flottenmanagement / Telematik",
        category: "Business",
        assets: [{ name: "Fleet Telemetry", type: "Application" }, { name: "OBU", type: "Endpoint" }],
      },
      {
        name: "Instandhaltung (IPS)",
        category: "Support",
        assets: [{ name: "IPS/EAM", type: "Application" }, { name: "Diagnose-Tools", type: "Endpoint" }],
      },
      {
        name: "Verkehrsmanagementzentrale (Straße)",
        category: "Business",
        assets: [
          { name: "VMZ-Leitstand", type: "Server" },
          { name: "Wechselverkehrszeichen", type: "Other" },
          { name: "Kamerasystem", type: "Other" },
        ],
      },
      {
        name: "Flughafen/Hafen-Operations",
        category: "Business",
        assets: [
          { name: "AODB / PODB", type: "Database" },
          { name: "Gepäckförderanlage", type: "Other" },
          { name: "Landeseite-IT", type: "Application" },
        ],
      },
      NETWORK_CORE,
      SEC_OPS,
      IT_CORE,
      WORKPLACE,
    ],
  },

  // ============================== DIGITAL INFRA ==============================
  {
    key: "digital",
    de: "Digitale Infrastruktur",
    en: "Digital Infrastructure",
    services: [
      {
        name: "DNS-Betrieb",
        category: "Business",
        assets: [
          { name: "Authoritative DNS", type: "Server" },
          { name: "Recursive DNS", type: "Server" },
          { name: "DNSSEC Signer", type: "Application" },
          { name: "Anycast Nodes", type: "Network" },
        ],
      },
      {
        name: "IX / Peering",
        category: "Business",
        assets: [
          { name: "Route Server", type: "Network" },
          { name: "Switching Fabric", type: "Network" },
          { name: "Looking Glass", type: "Application" },
        ],
      },
      {
        name: "Colocation / Rechenzentrum",
        category: "Business",
        assets: [
          { name: "Kühlung (CRAC/CRAH)", type: "Other" },
          { name: "USV", type: "Other" },
          { name: "Diesel-Generatoren", type: "Other" },
          { name: "Brandmelde-/Löschanlage", type: "Other" },
          { name: "Zutrittssystem", type: "Other" },
          { name: "DCIM", type: "Application" },
        ],
      },
      {
        name: "Cloud/Hosting-Plattform",
        category: "Business",
        assets: [
          { name: "Hypervisor Cluster (VMware/KVM)", type: "Server" },
          { name: "Kubernetes Cluster", type: "Cloud" },
          { name: "Object Storage (S3-kompatibel)", type: "Cloud" },
          { name: "Container Registry", type: "Application" },
        ],
      },
      {
        name: "CDN / Edge",
        category: "Business",
        assets: [{ name: "Edge Nodes", type: "Cloud" }, { name: "Origin Shield", type: "Cloud" }],
      },
      {
        name: "Trust Service (eIDAS/QTSP)",
        category: "Business",
        assets: [
          { name: "CA / Sub-CA", type: "Application" },
          { name: "HSM", type: "Other" },
          { name: "Timestamping Authority", type: "Application" },
        ],
      },
      {
        name: "Managed Email / Anti-Spam",
        category: "Support",
        assets: [{ name: "Mail Relay", type: "Server" }, { name: "Anti-Spam Cluster", type: "Application" }],
      },
      {
        name: "TK / Carrier-Netz",
        category: "Business",
        assets: [
          { name: "SBC (Session Border Controller)", type: "Network" },
          { name: "IMS Core", type: "Application" },
          { name: "Softswitch", type: "Application" },
        ],
      },
      NETWORK_CORE,
      SEC_OPS,
      IT_CORE,
      WORKPLACE,
    ],
  },

  // ============================== PUBLIC ADMIN ==============================
  {
    key: "public",
    de: "Öffentliche Verwaltung",
    en: "Public Administration",
    services: [
      {
        name: "Bürgerportal / OZG-Leistungen",
        category: "Business",
        assets: [
          { name: "Portal Frontend", type: "Application" },
          { name: "Formular-Server (FIM)", type: "Application" },
          { name: "Servicekonto / BundID", type: "Application" },
        ],
      },
      {
        name: "Melde-/Fachverfahren",
        category: "Business",
        assets: [
          { name: "Einwohnermeldewesen", type: "Application" },
          { name: "KFZ-Zulassung", type: "Application" },
          { name: "Gewerbewesen", type: "Application" },
          { name: "Sozialhilfe/SGB", type: "Application" },
        ],
      },
      {
        name: "E-Akte / DMS",
        category: "Business",
        assets: [{ name: "E-Akte Plattform (nscale/VIS)", type: "Application" }, { name: "Langzeitarchiv", type: "Application" }],
      },
      {
        name: "Zahlungsverkehr / HKR",
        category: "Support",
        assets: [{ name: "Haushalts-/Kassensystem (SAP PSCD)", type: "Application" }],
      },
      {
        name: "GIS / Geodaten",
        category: "Support",
        assets: [{ name: "GIS (ArcGIS)", type: "Application" }, { name: "ALKIS", type: "Database" }],
      },
      {
        name: "Schul-IT / Lernplattform",
        category: "Business",
        assets: [{ name: "Moodle/itslearning", type: "Application" }, { name: "Schülerverwaltung", type: "Application" }],
      },
      {
        name: "Verwaltungs-PKI / nPA-Nutzung",
        category: "Support",
        assets: [{ name: "PKI Verwaltung", type: "Application" }, { name: "eID-Server", type: "Application" }],
      },
      {
        name: "Registermodernisierung",
        category: "Business",
        assets: [{ name: "Register-Anbindung (XÖV)", type: "Application" }],
      },
      NETWORK_CORE,
      SEC_OPS,
      IT_CORE,
      WORKPLACE,
    ],
  },

  // ============================== WASTE ==============================
  {
    key: "waste",
    de: "Entsorgung",
    en: "Waste",
    services: [
      {
        name: "Tourenplanung & Disposition",
        category: "Business",
        assets: [{ name: "Dispositionssoftware", type: "Application" }, { name: "Routen-Optimierer", type: "Application" }],
      },
      {
        name: "Fahrzeug-Telematik",
        category: "Business",
        assets: [
          { name: "Bordrechner", type: "Endpoint" },
          { name: "Identsysteme (RFID Tonne)", type: "Other" },
        ],
      },
      {
        name: "Verwiegung / Waagen",
        category: "Business",
        assets: [{ name: "Waagesoftware", type: "Application" }, { name: "Brückenwaagen", type: "Other" }],
      },
      {
        name: "Anlagensteuerung (MVA/MBA/Deponie)",
        category: "Business",
        assets: [
          { name: "Anlagen-SCADA", type: "Server" },
          { name: "SPS Verbrennung", type: "Other" },
          { name: "Emissions-Monitoring", type: "Application" },
        ],
      },
      {
        name: "Umlade-/Sortieranlagen",
        category: "Business",
        assets: [{ name: "Sortier-Steuerung", type: "Server" }, { name: "NIR-Sortierer", type: "Other" }],
      },
      {
        name: "Kunden- & Abrechnungssystem",
        category: "Business",
        assets: [{ name: "Abrechnung (Gebühren)", type: "Application" }, { name: "Kundenportal", type: "Application" }],
      },
      NETWORK_CORE,
      SEC_OPS,
      IT_CORE,
      WORKPLACE,
    ],
  },

  // ============================== CHEMICAL ==============================
  {
    key: "chemical",
    de: "Chemie",
    en: "Chemical",
    services: [
      {
        name: "Prozessleitsystem (PLS/DCS)",
        category: "Business",
        assets: [
          { name: "DCS Controller (Siemens PCS 7 / Emerson DeltaV)", type: "Server" },
          { name: "Operator Stations", type: "Endpoint" },
          { name: "Engineering Station", type: "Endpoint" },
          { name: "Historian (OSIsoft PI)", type: "Database" },
        ],
      },
      {
        name: "Safety Instrumented System (SIS)",
        category: "Business",
        assets: [
          { name: "SIS Logic Solver (SIL2/3)", type: "Other" },
          { name: "Not-Aus-Kreise", type: "Other" },
        ],
      },
      {
        name: "MES / Batch",
        category: "Business",
        assets: [{ name: "MES (ISA-88)", type: "Application" }, { name: "Rezeptur-Verwaltung", type: "Application" }],
      },
      {
        name: "Labor (LIMS/ELN)",
        category: "Support",
        assets: [{ name: "LIMS", type: "Application" }, { name: "ELN", type: "Application" }],
      },
      {
        name: "Gefahrstoff- & SDB-Management",
        category: "Support",
        assets: [{ name: "SDB-System (SAP EHS)", type: "Application" }, { name: "Gefahrstoffkataster", type: "Database" }],
      },
      {
        name: "Tank- & Logistiksteuerung",
        category: "Business",
        assets: [
          { name: "Tanklager-SCADA", type: "Server" },
          { name: "Verladesteuerung", type: "Application" },
        ],
      },
      {
        name: "ERP (SAP)",
        category: "Business",
        assets: [{ name: "SAP S/4HANA", type: "Application" }, { name: "SAP EWM", type: "Application" }],
      },
      {
        name: "OT-DMZ & Fernwartung",
        category: "Support",
        assets: [
          { name: "OT-DMZ Firewall", type: "Network" },
          { name: "Vendor-Fernwartung (Jump)", type: "Server" },
        ],
      },
      NETWORK_CORE,
      SEC_OPS,
      IT_CORE,
      WORKPLACE,
    ],
  },
];
