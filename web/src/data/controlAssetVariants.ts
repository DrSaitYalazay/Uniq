/**
 * Asset-Type Question Variants — full Asset × Control matrix.
 *
 * Generic IT-office wording is replaced with domain-specific phrasing per
 * asset class (BSI Grundschutz++ ZOK root). The engine remains
 * deterministic: control id, family, scoring, and gap mapping never
 * change — only the prompt the user reads is rewritten.
 *
 * Coverage rule: every (controlId × applicable asset class) combination
 * defined in `controlMetadata.applicable_to` should have a variant. Cells
 * for non-applicable classes are harmless (never fired) but kept absent
 * to make audits of the matrix obvious.
 *
 * Asset classes:
 *   standorte     — sites, rooms, datacentres
 *   nutzende      — user identities / staff records
 *   netze         — switches, routers, firewalls, gateways, WLAN
 *   it_systeme    — servers, endpoints, storage, mobile devices
 *   ics_ot        — PLC, SCADA, RTU, HMI, safety systems
 *   iot           — sensors, smart devices, telemetry
 *   prozesse      — process descriptions
 *   lieferanten   — suppliers / third parties
 *   informationen — data assets, databases, documents
 *   anwendungen   — applications, SaaS, cloud services
 */

import type { ControlQuestion } from "./nis2Controls";
import type { AssetClassId } from "./controlEngine";

export interface ControlVariant {
  question: string;
  questionEn: string;
  description: string;
  descriptionEn: string;
}

type VariantTable = Partial<Record<AssetClassId, ControlVariant>>;

export const controlAssetVariants: Record<string, VariantTable> = {
  // ─────────────────────────────────────────────────────────────────
  // e-05 — Default credentials / standard passwords
  //   applicable_to: it_systeme, netze (Paket B excluded ics_ot)
  //   Extra variants (iot, anwendungen, ics_ot) remain inert under current
  //   metadata but stay authored so a future re-scoping does not lose them.
  // ─────────────────────────────────────────────────────────────────
  "e-05": {
    it_systeme: {
      question: "Werden auf Servern, Endgeräten und Storage-Systemen werksseitige Standard-Konten und Default-Passwörter vor Inbetriebnahme entfernt oder rotiert?",
      questionEn: "Are factory default accounts and default passwords removed or rotated on servers, endpoints, and storage before go-live?",
      description: "Build-Images und Auto-Provisioning müssen Default-Credentials beim Onboarding eines Systems automatisch ersetzen — manueller Check skaliert nicht.",
      descriptionEn: "Build images and auto-provisioning must replace default credentials when a system is onboarded — manual checks do not scale.",
    },
    netze: {
      question: "Werden auf aktiven Netzwerkkomponenten (Switches, Router, Firewalls, WLAN-Controller) Hersteller-Standardkonten deaktiviert und Management-Passwörter aus dem Vault rotiert?",
      questionEn: "Are vendor default accounts disabled on active network gear (switches, routers, firewalls, WLAN controllers) and management passwords rotated from a vault?",
      description: "Netzwerkgeräte werden meist über CLI/SSH provisioniert — Default-Logins müssen vor dem Anschluss an das Produktivnetz entfernt sein.",
      descriptionEn: "Network gear is typically provisioned via CLI/SSH — default logins must be removed before joining the production network.",
    },
    ics_ot: {
      question: "Werden Werks-/Standard-Zugangsdaten an Steuerungs- und Engineering-Komponenten (PLC, HMI, RTU, Engineering-Workstation) im Rahmen geplanter Wartungsfenster geändert und dokumentiert?",
      questionEn: "Are factory/default credentials on control and engineering components (PLC, HMI, RTU, engineering workstation) changed and documented within planned maintenance windows?",
      description: "OT-Komponenten lassen sich nicht spontan rotieren — Änderungen erfordern ein freigegebenes Change-Window, Rückfall-Optionen und Abstimmung mit dem Anlagenbetreiber.",
      descriptionEn: "OT components cannot be rotated ad-hoc — changes require an approved change window, fallback options, and coordination with the plant operator.",
    },
    iot: {
      question: "Werden bei IoT-Geräten Standard-Zugangsdaten und vorinstallierte Cloud-Tokens vor Inbetriebnahme ersetzt oder per Provisioning-Profil zentral verwaltet?",
      questionEn: "Are default credentials and pre-installed cloud tokens on IoT devices replaced before deployment or managed centrally via provisioning profiles?",
      description: "Massen-IoT-Rollouts sind anfällig für persistente Default-Credentials; Zero-Touch-Provisioning ersetzt diese pro Geräteseriennummer.",
      descriptionEn: "Mass IoT rollouts are exposed to persistent default credentials; zero-touch provisioning replaces them per device serial.",
    },
    anwendungen: {
      question: "Werden bei der Inbetriebnahme von Anwendungen und SaaS-Diensten initiale Admin-Konten, API-Keys und Sample-Accounts ersetzt?",
      questionEn: "On application and SaaS go-live, are initial admin accounts, API keys, and sample accounts replaced?",
      description: "Frisch deployte Anwendungen tragen häufig Setup-Tokens und Demo-Accounts, die nach Go-Live deaktiviert werden müssen.",
      descriptionEn: "Freshly deployed applications often carry setup tokens and demo accounts that must be disabled after go-live.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // g-02 — Multi-factor authentication
  //   applicable_to (after Paket B): it_systeme, nutzende
  // ─────────────────────────────────────────────────────────────────
  "g-02": {
    it_systeme: {
      question: "Wird Multi-Faktor-Authentifizierung auf privilegierten Konten von Servern, Hypervisoren und Backup-Konsolen erzwungen?",
      questionEn: "Is multi-factor authentication enforced on privileged accounts of servers, hypervisors, and backup consoles?",
      description: "Adminzugänge zu Kerninfrastruktur (Hypervisor, Backup, Domänencontroller) sind die wertvollsten Ziele — MFA an dieser Stelle ist nicht verhandelbar.",
      descriptionEn: "Admin access to core infrastructure (hypervisor, backup, domain controllers) is the highest-value target — MFA here is non-negotiable.",
    },
    nutzende: {
      question: "Wird MFA für alle Mitarbeitenden mit Remote-Zugriff bzw. privilegierter Rolle aus dem Identity Provider heraus erzwungen?",
      questionEn: "Is MFA enforced for every employee with remote access or a privileged role directly from the identity provider?",
      description: "MFA wird zentral pro Identität gesteuert (Conditional Access / Risk-based) — nicht pro Anwendung verhandelt.",
      descriptionEn: "MFA is enforced centrally per identity (conditional / risk-based access) rather than negotiated per application.",
    },
    ics_ot: {
      question: "Wird der Zugriff auf Engineering-Workstations und Fernwartungs-Sprungserver für die OT-Zone mit MFA abgesichert?",
      questionEn: "Is access to engineering workstations and remote-maintenance jump hosts for the OT zone protected with MFA?",
      description: "MFA wird in der OT typischerweise am Übergang (Jump-Host, VPN, Engineering-WS) erzwungen — nicht direkt auf Feldgeräten.",
      descriptionEn: "MFA in OT is typically enforced at the boundary (jump host, VPN, engineering WS) rather than on field devices.",
    },
    iot: {
      question: "Werden administrative Zugänge zu IoT-Plattformen und Fleet-Management-Konsolen mit MFA geschützt?",
      questionEn: "Are administrative access paths to IoT platforms and fleet-management consoles protected with MFA?",
      description: "IoT-Geräte selbst tragen keine MFA — Schutz erfolgt auf der Verwaltungsebene (Cloud-Konsole, Provisioning-Backend).",
      descriptionEn: "IoT devices themselves cannot carry MFA — protection happens at the management plane (cloud console, provisioning back-end).",
    },
    netze: {
      question: "Werden Management-Zugriffe auf Netzwerkkomponenten (SSH/HTTPS/Console) zwingend über MFA bzw. einen MFA-geschützten Bastion-Host geführt?",
      questionEn: "Are management connections to network gear (SSH/HTTPS/console) enforced via MFA or an MFA-protected bastion host?",
      description: "Direkter SSH/HTTPS-Zugang ohne zweiten Faktor ist eine häufige Schwäche; Bastion mit MFA + Session-Recording schließt sie.",
      descriptionEn: "Direct SSH/HTTPS without a second factor is a common weakness; an MFA bastion with session recording closes it.",
    },
    anwendungen: {
      question: "Wird MFA für externe Endnutzer- und Admin-Zugänge zur Anwendung (insbesondere SaaS-Konsolen) erzwungen?",
      questionEn: "Is MFA enforced for external end-user and admin access to the application (especially SaaS consoles)?",
      description: "Bei Anwendungen unterscheidet sich der MFA-Bedarf zwischen Endnutzer-Login (SSO/MFA) und Admin-Konsole (immer MFA + Conditional Access).",
      descriptionEn: "For applications, MFA needs differ between end-user login (SSO/MFA) and admin console (always MFA + conditional access).",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // g-09 — Endpoint protection / EDR
  //   applicable_to: it_systeme
  // ─────────────────────────────────────────────────────────────────
  "g-09": {
    it_systeme: {
      question: "Sind Server, Endgeräte und mobile Systeme mit aktueller EDR-/Anti-Malware-Lösung ausgestattet, deren Telemetrie zentral ausgewertet wird?",
      questionEn: "Are servers, endpoints, and mobile systems equipped with up-to-date EDR/anti-malware whose telemetry is analysed centrally?",
      description: "EDR ohne SOC-Anbindung erzeugt nur Logs — Schutzwirkung entsteht durch zentrale Detection-Plattform und Response-Workflow.",
      descriptionEn: "EDR without SOC integration only produces logs — protection comes from a central detection platform and response workflow.",
    },
    ics_ot: {
      question: "Wird auf OT-fähigen Komponenten (Engineering-WS, HMI-Panels) eine vom Hersteller freigegebene Endpoint-Protection (Allowlisting/EDR) eingesetzt?",
      questionEn: "Is vendor-approved endpoint protection (allowlisting/EDR) deployed on OT-capable components (engineering WS, HMI panels)?",
      description: "Klassische AV-Signaturen sind in OT oft nicht freigegeben — Allowlisting / Application Control ist die typische Lösung.",
      descriptionEn: "Classic AV signatures are often not vendor-approved on OT — application allowlisting is the typical solution.",
    },
    iot: {
      question: "Werden IoT-Geräte mit signierter Firmware betrieben und ist deren Integrität über Geräte-Attestierung prüfbar?",
      questionEn: "Are IoT devices running signed firmware with integrity verifiable via device attestation?",
      description: "EDR existiert auf IoT meist nicht; die äquivalente Kontrolle ist Secure-Boot + Firmware-Signing + Attestation.",
      descriptionEn: "EDR rarely exists on IoT; the equivalent control is secure boot + firmware signing + attestation.",
    },
    netze: {
      question: "Werden Netzwerkkomponenten anhand digital signierter Firmware-Images aktualisiert und über NDR/Flow-Telemetrie überwacht?",
      questionEn: "Are network components updated via digitally signed firmware images and monitored through NDR/flow telemetry?",
      description: "Endpoint-EDR existiert auf Switches/Routern nicht — Schutzwirkung kommt aus signierter Firmware und Netzwerk-Telemetrie.",
      descriptionEn: "Endpoint EDR does not exist on switches/routers — protection comes from signed firmware and network telemetry.",
    },
    anwendungen: {
      question: "Werden serverseitige Laufzeitumgebungen der Anwendung mit Runtime-Schutz (CWPP/RASP) oder Container-Isolation abgesichert?",
      questionEn: "Are server-side application runtimes protected with runtime defense (CWPP/RASP) or container isolation?",
      description: "Für Anwendungen tritt Cloud Workload Protection oder Application-Sandboxing an die Stelle klassischer Endpoint-AV.",
      descriptionEn: "For applications, cloud workload protection or app sandboxing replaces classic endpoint AV.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // e-03 — Session locks / inactivity protection
  //   applicable_to: it_systeme
  // ─────────────────────────────────────────────────────────────────
  "e-03": {
    it_systeme: {
      question: "Werden Bildschirm- und Sitzungssperren auf Servern, Workstations und mobilen Geräten nach max. 10 Minuten Inaktivität zentral erzwungen?",
      questionEn: "Are screen and session locks enforced centrally on servers, workstations, and mobile devices after at most 10 minutes of inactivity?",
      description: "Konfiguration via Domain-Policy / MDM — lokale Nutzer-Einstellungen reichen für NIS2-Nachweise nicht.",
      descriptionEn: "Configuration via domain policy / MDM — local user settings are insufficient for NIS2 evidence.",
    },
    ics_ot: {
      question: "Werden HMI-Bedienkonsolen so konfiguriert, dass Bedieneranmeldungen nach Schichtende oder Inaktivität getrennt werden, ohne den Anlagen-Sichtmodus zu verlieren?",
      questionEn: "Are HMI consoles configured to drop operator sessions after shift end or inactivity without losing the plant view mode?",
      description: "OT-HMIs müssen weiter Anlagenstatus zeigen — Schutz erfolgt über getrennte 'View'- und 'Operate'-Rollen mit Re-Auth bei Aktion.",
      descriptionEn: "OT HMIs must keep displaying plant status — protection comes from separate 'view' and 'operate' roles with re-auth before action.",
    },
    netze: {
      question: "Werden Management-Sessions auf Netzwerkkomponenten nach definierter Inaktivität automatisch beendet (exec-timeout / idle-timeout)?",
      questionEn: "Are management sessions on network gear automatically closed after a defined idle period (exec-timeout / idle-timeout)?",
      description: "Vergessene SSH-Sessions auf Routern/Firewalls sind ein häufiger Initialvektor — idle-timeout pro Geräteklasse härtet das ab.",
      descriptionEn: "Forgotten SSH sessions on routers/firewalls are a common initial vector — per-device-class idle timeouts harden against this.",
    },
    anwendungen: {
      question: "Erzwingt die Anwendung serverseitige Session-Timeouts und Re-Authentifizierung für sensible Aktionen (Step-Up Auth)?",
      questionEn: "Does the application enforce server-side session timeouts and re-authentication for sensitive actions (step-up auth)?",
      description: "Reine Client-Logout-Buttons reichen nicht — Session-Tokens müssen serverseitig invalide werden.",
      descriptionEn: "Client-side logout buttons alone are insufficient — session tokens must be invalidated server-side.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // tech-01 — Approved-device inventory
  //   applicable_to: it_systeme
  // ─────────────────────────────────────────────────────────────────
  "tech-01": {
    it_systeme: {
      question: "Existiert ein zentrales Inventar aller IT-Systeme (Server, Endgeräte, mobile Geräte) inkl. Eigentümer, Standort, Lifecycle-Status und Compliance-Bewertung?",
      questionEn: "Is there a central inventory of all IT systems (servers, endpoints, mobile devices) including owner, location, lifecycle status, and compliance rating?",
      description: "CMDB/Asset-Inventar ist Grundlage für Patch-Steuerung, Lizenz-Compliance und Notfall-Wiederherstellung.",
      descriptionEn: "CMDB/asset inventory underpins patch governance, licence compliance, and disaster recovery.",
    },
    ics_ot: {
      question: "Existiert eine vollständige Inventarliste aller PLCs, RTUs, HMIs und Engineering-Workstations inkl. Firmware-Stand und Verantwortlichem?",
      questionEn: "Is there a complete inventory of all PLCs, RTUs, HMIs, and engineering workstations including firmware level and owner?",
      description: "OT-Inventare müssen Firmware-Versionen und Lebenszyklus-Status führen — viele Geräte sind 10+ Jahre im Betrieb.",
      descriptionEn: "OT inventories must track firmware versions and lifecycle status — many devices stay in operation for 10+ years.",
    },
    iot: {
      question: "Werden alle IoT-Geräte über ein zentrales Geräte-Register (Seriennummer, Standort, Firmware, Owner) geführt?",
      questionEn: "Are all IoT devices tracked in a central device registry (serial number, location, firmware, owner)?",
      description: "Schatten-IoT (autorisiert oder nicht) entzieht sich Patch-Pflichten — ein zentrales Register mit Discovery-Abgleich verhindert das.",
      descriptionEn: "Shadow IoT (authorized or not) escapes patch obligations — a central registry with discovery reconciliation prevents this.",
    },
    netze: {
      question: "Existiert eine aktuelle Inventarliste aller aktiven Netzwerkkomponenten (Switch/Router/Firewall/AP) mit Modell, Firmware, Standort und EoL-Datum?",
      questionEn: "Is there a current inventory of all active network components (switch/router/firewall/AP) with model, firmware, location, and EoL date?",
      description: "Netzwerk-Inventar ist Grundlage für Patch-Status, Lifecycle-Planung und Notfall-Tausch.",
      descriptionEn: "Network inventory is the basis for patch status, lifecycle planning, and emergency replacement.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // net-02 — Network access control (802.1X)
  //   applicable_to: netze, it_systeme
  // ─────────────────────────────────────────────────────────────────
  "net-02": {
    it_systeme: {
      question: "Erhalten Server und Endgeräte Netzwerkzugang ausschließlich über zertifikatsbasierte 802.1X-Authentifizierung an Switch-Port und WLAN?",
      questionEn: "Do servers and endpoints receive network access only via certificate-based 802.1X authentication on switch port and WLAN?",
      description: "Geräte-Zertifikate aus zentraler PKI verhindern, dass nicht inventarisierte Systeme Zugang ins Netz erhalten.",
      descriptionEn: "Device certificates from a central PKI prevent unmanaged systems from obtaining network access.",
    },
    netze: {
      question: "Wird 802.1X (oder MAC-Authentication-Bypass mit Profilierung) auf allen Edge-Switch-Ports und Wireless-Access-Points erzwungen?",
      questionEn: "Is 802.1X (or MAB with profiling) enforced on all edge switch ports and wireless access points?",
      description: "Klassisches NAC-Modell: 802.1X für unterstützte Endgeräte, MAB + Profiling für Drucker/Telefone.",
      descriptionEn: "Classic NAC pattern: 802.1X for capable endpoints, MAB + profiling for printers/phones.",
    },
    ics_ot: {
      question: "Werden OT-Netzsegmente gegenüber dem Office-Netz strikt getrennt (DMZ/Conduit nach IEC 62443) statt 802.1X auf Feldgeräten zu erzwingen?",
      questionEn: "Are OT network segments strictly separated from office networks (DMZ/conduit per IEC 62443) instead of enforcing 802.1X on field devices?",
      description: "802.1X auf Feldgeräten ist meist nicht implementierbar — die wirksame Kontrolle ist Zonen-/Conduit-Architektur (Purdue Model).",
      descriptionEn: "802.1X on field devices is rarely implementable — the effective control is zone/conduit architecture (Purdue model).",
    },
    iot: {
      question: "Werden IoT-Geräte in dedizierte VLANs/SSIDs platziert und ihr Verkehr über Microsegmentation auf erlaubte Zieldienste eingeschränkt?",
      questionEn: "Are IoT devices placed in dedicated VLANs/SSIDs with traffic restricted via microsegmentation to allowed target services?",
      description: "IoT-Geräte können selten 802.1X — Schutz entsteht durch Segmentierung und Egress-Filtering auf erlaubte Cloud-Endpunkte.",
      descriptionEn: "IoT devices rarely support 802.1X — protection comes from segmentation and egress filtering to allowed cloud endpoints.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // j-06 — IoT/OT security concept
  //   applicable_to: ics_ot, netze (and iot in practice)
  // ─────────────────────────────────────────────────────────────────
  "j-06": {
    ics_ot: {
      question: "Existiert ein Sicherheitskonzept für die Kommunikation zwischen OT-Zellen (z. B. mTLS, signierte Firmware, passive Monitoring statt aktivem Scan)?",
      questionEn: "Is there a security concept for communication between OT cells (e.g. mTLS, signed firmware, passive monitoring instead of active scanning)?",
      description: "OT-Kommunikation muss deterministisch bleiben — passive Network-Monitoring (Tap/SPAN) ersetzt aktives Scannen.",
      descriptionEn: "OT communication must stay deterministic — passive network monitoring (TAP/SPAN) replaces active scanning.",
    },
    iot: {
      question: "Existiert ein Konzept zur Absicherung von IoT-Geräten und ihrer Kommunikation (Geräte-Identität, mTLS, Cloud-Endpunkt-Pinning)?",
      questionEn: "Is there a concept for securing IoT devices and their communication (device identity, mTLS, cloud endpoint pinning)?",
      description: "IoT-Sicherheit ruht auf eindeutiger Geräteidentität, gegenseitig authentisierter Verbindung und kontrolliertem Cloud-Backend.",
      descriptionEn: "IoT security rests on unique device identity, mutually authenticated communication, and a controlled cloud back-end.",
    },
    netze: {
      question: "Werden IoT-/OT-fähige Netzwerksegmente technisch (VLAN, ACL, FW-Regeln) und logisch (Asset-Profil, Verkehrsmuster) gegen das Office-Netz isoliert?",
      questionEn: "Are IoT/OT-capable network segments isolated from the office network technically (VLAN, ACL, FW rules) and logically (asset profile, traffic baseline)?",
      description: "Auf Netzebene materialisiert sich das IoT/OT-Konzept in dedizierten Segmenten mit Egress-Whitelist und Anomalie-Detection.",
      descriptionEn: "At the network layer the IoT/OT concept materialises as dedicated segments with egress allowlist and anomaly detection.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // e-06 — Disable unused services / ports
  //   applicable_to: it_systeme, netze
  // ─────────────────────────────────────────────────────────────────
  "e-06": {
    it_systeme: {
      question: "Werden auf Servern und Endgeräten ungenutzte Dienste, Ports und Protokolle per Hardening-Baseline deaktiviert?",
      questionEn: "Are unused services, ports, and protocols on servers and endpoints disabled via a hardening baseline?",
      description: "CIS-Benchmark-/STIG-Templates pro Plattform halten die Angriffsfläche minimal und sind audit-tauglich.",
      descriptionEn: "Per-platform CIS Benchmark / STIG templates keep the attack surface minimal and audit-ready.",
    },
    ics_ot: {
      question: "Werden auf OT-Komponenten nicht benötigte Protokolle (z. B. Telnet, FTP, SNMPv1) nach Herstellerfreigabe deaktiviert?",
      questionEn: "Are unused protocols (e.g. Telnet, FTP, SNMPv1) on OT components disabled after vendor approval?",
      description: "Service-Deaktivierung in der OT muss vom Hersteller freigegeben sein — sonst Garantieverlust und Funktionsstörungen.",
      descriptionEn: "Service deactivation on OT must be vendor-approved — otherwise warranty loss and functional impact.",
    },
    netze: {
      question: "Werden auf Netzwerkkomponenten ungenutzte Management-Dienste (HTTP, Telnet, ältere SNMP-Versionen) deaktiviert und nur das nötige Mgmt-VLAN exponiert?",
      questionEn: "Are unused management services (HTTP, Telnet, legacy SNMP) on network gear disabled and only the required management VLAN exposed?",
      description: "Härtungs-Templates pro Geräteklasse halten die Mgmt-Plane minimal.",
      descriptionEn: "Per-device-class hardening templates keep the management plane minimal.",
    },
    anwendungen: {
      question: "Werden ungenutzte API-Endpunkte, Debug-Routen und Management-Ports der Anwendung im Produktivbetrieb abgeschaltet?",
      questionEn: "Are unused API endpoints, debug routes, and management ports of the application disabled in production?",
      description: "Debug-/Sample-Endpunkte (z. B. /actuator, /debug, /swagger) gehören in Produktion abgeschaltet oder zugriffsbeschränkt.",
      descriptionEn: "Debug/sample endpoints (e.g. /actuator, /debug, /swagger) must be disabled or access-restricted in production.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // h-03 — Encryption at rest
  //   applicable_to: informationen, anwendungen, it_systeme
  // ─────────────────────────────────────────────────────────────────
  "h-03": {
    it_systeme: {
      question: "Werden Datenträger von Servern, Endgeräten und mobilen Systemen mit Full-Disk-Encryption (z. B. BitLocker, LUKS, FileVault) geschützt?",
      questionEn: "Are storage media on servers, endpoints, and mobile systems protected with full-disk encryption (e.g. BitLocker, LUKS, FileVault)?",
      description: "FDE schützt bei Diebstahl/Außerbetriebnahme — Recovery-Keys gehören in einen abgesicherten Schlüsselverwahrer.",
      descriptionEn: "FDE protects against theft/decommission — recovery keys belong in a secured key escrow.",
    },
    informationen: {
      question: "Werden sensible Datenbestände (Datenbanken, Dateifreigaben, Object-Stores) mit verwalteten Schlüsseln verschlüsselt und Schlüsselrotation durchgeführt?",
      questionEn: "Are sensitive data stores (databases, file shares, object stores) encrypted with managed keys and key rotation enforced?",
      description: "Verschlüsselung folgt der Daten-Klassifizierung (siehe a-07): hoch eingestufte Datensätze brauchen tenant-getrennte Schlüssel.",
      descriptionEn: "Encryption follows data classification (see a-07): highly classified data sets require tenant-separated keys.",
    },
    ics_ot: {
      question: "Werden Konfigurations-Backups und Engineering-Projekte (PLC-Programme, Rezepturen) verschlüsselt aufbewahrt?",
      questionEn: "Are configuration backups and engineering projects (PLC programs, recipes) stored encrypted?",
      description: "Verschlüsselung im OT-Feld ist meist nicht möglich — Schutz konzentriert sich auf Backups und Engineering-Artefakte.",
      descriptionEn: "Field-level encryption is rarely possible in OT — protection focuses on backups and engineering artefacts.",
    },
    netze: {
      question: "Werden Konfigurations-Backups von Netzwerkkomponenten verschlüsselt im Repository gehalten und Schlüssel rotiert?",
      questionEn: "Are configuration backups of network gear stored encrypted in the repository with rotated keys?",
      description: "Klartext-Configs (mit eingebetteten Pre-Shared-Keys) im Backup sind ein klassisches Datenleck-Szenario.",
      descriptionEn: "Plaintext configs (with embedded pre-shared keys) in backups are a classic data-leak scenario.",
    },
    anwendungen: {
      question: "Werden Anwendungsdaten in der Datenbank, im Object-Storage und in Backups mit verwalteten Schlüsseln verschlüsselt?",
      questionEn: "Is application data encrypted at rest in the database, object storage, and backups using managed keys?",
      description: "At-Rest-Verschlüsselung muss alle Datenebenen abdecken (DB, Storage, Backup, Snapshots) und mit dem KMS verzahnt sein.",
      descriptionEn: "At-rest encryption must cover every data tier (DB, storage, backup, snapshots) and integrate with the KMS.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // tech-04 — Web filtering / edge protection
  //   applicable_to: netze, it_systeme (cond: external_exposure=true)
  // ─────────────────────────────────────────────────────────────────
  "tech-04": {
    it_systeme: {
      question: "Werden ausgehende Verbindungen extern exponierter Server über Forward-Proxy / Egress-Filter kontrolliert?",
      questionEn: "Are outbound connections from externally exposed servers controlled via forward proxy / egress filtering?",
      description: "Egress-Kontrolle verhindert C2-Beaconing und Datenabfluss aus kompromittierten Servern.",
      descriptionEn: "Egress control prevents C2 beaconing and data exfiltration from compromised servers.",
    },
    netze: {
      question: "Werden ausgehende Web-/DNS-Verbindungen aus dem Unternehmensnetz über Secure-Web-Gateway / DNS-Filter geleitet und kategorienbasiert geblockt?",
      questionEn: "Is outbound web/DNS traffic from the corporate network routed through a secure web gateway / DNS filter and category-blocked?",
      description: "Edge-Filtering blockt Phishing- und C2-Domänen bevor der Endpoint überhaupt verbindet.",
      descriptionEn: "Edge filtering blocks phishing and C2 domains before the endpoint even connects.",
    },
    anwendungen: {
      question: "Wird die nach außen exponierte Anwendung über eine WAF/Edge-Plattform abgesichert (OWASP-Top-10-Regelsatz, Bot-Mgmt, Rate-Limit)?",
      questionEn: "Is the externally exposed application protected via a WAF/edge platform (OWASP Top-10 ruleset, bot management, rate limiting)?",
      description: "Bei Web-Anwendungen wirkt 'Edge-Schutz' als WAF — Web-Filter-Logik gilt für Anwendungs-Eingaben, nicht für Nutzer-Browsing.",
      descriptionEn: "For web applications 'edge protection' equals a WAF — filtering logic applies to inbound app traffic, not user browsing.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // e-12 — Secure management protocols (SSH/SNMPv3)
  //   applicable_to: netze, it_systeme
  // ─────────────────────────────────────────────────────────────────
  "e-12": {
    it_systeme: {
      question: "Werden administrative Zugriffe auf Server und Hypervisoren ausschließlich über SSHv2, RDP-over-TLS oder vergleichbar verschlüsselte Protokolle geführt?",
      questionEn: "Is admin access to servers and hypervisors carried only over SSHv2, RDP-over-TLS, or comparably encrypted protocols?",
      description: "Klartext-Mgmt (Telnet, rlogin, unverschlüsseltes VNC) muss in Produktiv-Servern abgeschaltet sein.",
      descriptionEn: "Cleartext management (Telnet, rlogin, unencrypted VNC) must be disabled on production servers.",
    },
    ics_ot: {
      question: "Werden Management-Zugriffe auf OT-Komponenten ausschließlich über sichere Protokolle (SSHv2, HTTPS, herstellerfreigegebene Tunnel) geführt?",
      questionEn: "Is management access to OT components carried only over secure protocols (SSHv2, HTTPS, vendor-approved tunnels)?",
      description: "Telnet/HTTP-Mgmt auf älteren OT-Geräten muss durch einen Jump-Host mit Protokoll-Wrapping ersetzt werden.",
      descriptionEn: "Telnet/HTTP management on legacy OT must be wrapped through a jump host that terminates secure protocols.",
    },
    netze: {
      question: "Wird Netzwerk-Mgmt ausschließlich über SSHv2, HTTPS und SNMPv3 betrieben — Telnet/HTTP/SNMPv1 deaktiviert?",
      questionEn: "Is network management operated exclusively over SSHv2, HTTPS, and SNMPv3 — with Telnet/HTTP/SNMPv1 disabled?",
      description: "Mgmt-Plane-Härtung pro Geräteklasse: Klartext-Protokolle vollständig aus dem Netz entfernen.",
      descriptionEn: "Management-plane hardening per device class: remove cleartext protocols entirely from the network.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // e-13 — IDS/IPS (network and host)
  //   applicable_to: netze, it_systeme, anwendungen
  // ─────────────────────────────────────────────────────────────────
  "e-13": {
    it_systeme: {
      question: "Sind auf kritischen Servern und Endgeräten Host-basierte IDS/IPS- bzw. EDR-Detection-Regeln aktiv und an das SIEM/SOC angebunden?",
      questionEn: "Are host-based IDS/IPS or EDR detection rules active on critical servers and endpoints and connected to SIEM/SOC?",
      description: "HIDS auf Servern erfasst lokale Anomalien (Prozess-Injection, Persistenz) die Netzwerk-IDS nicht sieht.",
      descriptionEn: "Host-based IDS on servers captures local anomalies (process injection, persistence) that network IDS cannot see.",
    },
    ics_ot: {
      question: "Wird in OT-Segmenten passive Anomalie-Detektion (TAP/SPAN-basiert, Deep-Packet-Inspection für OT-Protokolle wie Modbus/S7) eingesetzt?",
      questionEn: "Is passive anomaly detection (TAP/SPAN-based, deep-packet inspection for OT protocols such as Modbus/S7) deployed in OT segments?",
      description: "Aktive IPS-Inline-Geräte sind in der OT meist tabu — passive OT-NDR liefert Sichtbarkeit ohne Eingriff in Steuerprozesse.",
      descriptionEn: "Active inline IPS is usually off-limits in OT — passive OT-NDR provides visibility without interfering with control processes.",
    },
    netze: {
      question: "Werden Nord-Süd- und Ost-West-Verkehr durch IDS/IPS analysiert, Signaturen aktuell gehalten und Alarme im SIEM korreliert?",
      questionEn: "Are north-south and east-west traffic inspected by IDS/IPS, with signatures kept current and alerts correlated in the SIEM?",
      description: "IDS/IPS allein erzeugt nur Alerts — Wirkung entsteht über Korrelation im SIEM und definierte Response-Playbooks.",
      descriptionEn: "IDS/IPS alone only produces alerts — effect comes from SIEM correlation and defined response playbooks.",
    },
    anwendungen: {
      question: "Werden Anwendungs-Logs auf verdächtige Muster (Brute-Force, Path-Traversal, anomale API-Aufrufe) automatisch ausgewertet?",
      questionEn: "Are application logs automatically analysed for suspicious patterns (brute force, path traversal, anomalous API calls)?",
      description: "Auf Anwendungsebene tritt App-Layer-Detection (WAF-Logs, RASP-Events, Auth-Anomalien) an die Stelle des Netzwerk-IDS.",
      descriptionEn: "At the application layer, app-layer detection (WAF logs, RASP events, auth anomalies) replaces network IDS.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // g-13 — Role-based access (RBAC) / least privilege
  //   applicable_to: nutzende, anwendungen, it_systeme
  // ─────────────────────────────────────────────────────────────────
  "g-13": {
    nutzende: {
      question: "Sind Rollen und Berechtigungen pro Mitarbeitenden-Funktion definiert und werden sie mind. jährlich rezertifiziert?",
      questionEn: "Are roles and permissions defined per staff function and recertified at least annually?",
      description: "Rollen-Drift entsteht durch Funktionswechsel ohne Berechtigungsabbau — Rezertifizierung schließt diese Lücke.",
      descriptionEn: "Role drift accumulates when staff change function without permission removal — recertification closes the gap.",
    },
    it_systeme: {
      question: "Sind administrative Rollen auf System-/Hypervisor-Ebene nach Least-Privilege segmentiert (separate Konten für Tier-0/1/2)?",
      questionEn: "Are administrative roles on system/hypervisor level segmented by least privilege (separate Tier-0/1/2 accounts)?",
      description: "Tier-0-Konten (DC, Backup, Hypervisor) dürfen nicht für tägliche Admin-Tätigkeiten verwendet werden.",
      descriptionEn: "Tier-0 accounts (DC, backup, hypervisor) must not be used for day-to-day admin work.",
    },
    anwendungen: {
      question: "Trennt die Anwendung Lese-, Schreib- und Admin-Rollen klar und protokolliert Rollenwechsel?",
      questionEn: "Does the application clearly separate read, write, and admin roles and log role changes?",
      description: "Auch SaaS-Apps brauchen ein dokumentiertes Rollenmodell und Audit-Log für Berechtigungsänderungen.",
      descriptionEn: "Even SaaS apps need a documented role model and audit log for permission changes.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // phy-01 — Physical access control
  //   applicable_to: it_systeme, netze, ics_ot, standorte
  // ─────────────────────────────────────────────────────────────────
  "phy-01": {
    standorte: {
      question: "Sind Liegenschaften und Räume mit Schutzbedarfsklassifizierung in Zonen unterteilt und ist der Zutritt protokolliert?",
      questionEn: "Are sites and rooms zoned by protection-need classification with access logged?",
      description: "Zonen-Modell (Empfang → Büro → Serverraum → Hochsicherheitsbereich) trennt Besucher von kritischer Infrastruktur.",
      descriptionEn: "Zone model (reception → office → server room → high-security area) separates visitors from critical infrastructure.",
    },
    it_systeme: {
      question: "Sind Server- und Storage-Standorte gegen unbefugten Zutritt geschützt (Schließanlage, Vereinzelung, Videoüberwachung)?",
      questionEn: "Are server and storage locations protected against unauthorised access (locking system, mantrap, video surveillance)?",
      description: "Physischer Zugriff auf einen Server entwertet alle Software-Kontrollen — Schutz beginnt am Rack/Käfig.",
      descriptionEn: "Physical access to a server bypasses all software controls — protection starts at the rack/cage.",
    },
    netze: {
      question: "Sind Verteilerräume und Patch-Schränke verschlossen und Zutritt protokolliert?",
      questionEn: "Are distribution rooms and patch cabinets locked and access logged?",
      description: "Offen zugängliche Switches/Patchpanel sind ein Einfallstor für Rogue-Devices und Tap-Attacken.",
      descriptionEn: "Openly accessible switches/patch panels are an entry point for rogue devices and TAP attacks.",
    },
    ics_ot: {
      question: "Sind Schaltschränke, Steuerungsräume und Engineering-Workstations gegen unbefugten physischen Zugriff geschützt?",
      questionEn: "Are control cabinets, control rooms, and engineering workstations protected against unauthorised physical access?",
      description: "Direkter Zugriff auf einen PLC-Schaltschrank ermöglicht Reset/Reflash — physische Zonenkontrolle ist Teil der OT-Sicherheit.",
      descriptionEn: "Direct access to a PLC cabinet allows reset/reflash — physical zone control is part of OT security.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // a-08 — Hardening process / secure baseline
  // ─────────────────────────────────────────────────────────────────
  "a-08": {
    it_systeme: {
      question: "Existiert ein dokumentierter Härtungs-Prozess pro Plattform (Windows-Server, Linux, Hypervisor) mit regelmäßigem Compliance-Scan?",
      questionEn: "Is there a documented hardening process per platform (Windows Server, Linux, hypervisor) with periodic compliance scanning?",
      description: "CIS-Benchmark-Templates plus automatisierter Drift-Scan halten den Härtungsstand auch nach Patches stabil.",
      descriptionEn: "CIS Benchmark templates plus automated drift scanning keep hardening posture stable across patches.",
    },
    netze: {
      question: "Existieren Härtungs-Templates pro Netzwerkgeräteklasse (Switch, Router, Firewall, AP) und werden Konfigurationen gegen Drift geprüft?",
      questionEn: "Are hardening templates maintained per network device class (switch, router, firewall, AP) and configurations checked for drift?",
      description: "Config-Drift-Detection (z. B. via Git-Repo + Daily-Diff) zeigt unautorisierte Änderungen frühzeitig.",
      descriptionEn: "Config drift detection (e.g. via Git repo + daily diff) surfaces unauthorised changes early.",
    },
    ics_ot: {
      question: "Werden OT-Komponenten nach IEC-62443-Zonenmodell und Hersteller-Härtungsleitfaden konfiguriert und Abweichungen freigegeben?",
      questionEn: "Are OT components configured per IEC 62443 zone model and vendor hardening guide, with deviations formally approved?",
      description: "OT-Härtung ist Hersteller-spezifisch und ändert sich mit jeder Firmware — Baseline muss versioniert geführt werden.",
      descriptionEn: "OT hardening is vendor-specific and shifts with each firmware release — baselines must be version-controlled.",
    },
  },

  // ─── Asset Inventory ───────────────────────────────────────────
  "a-03": {
    it_systeme: { question: "Sind alle Server, Endgeräte, Storage- und mobilen Systeme inkl. Eigentümer, Standort und Lifecycle-Status inventarisiert?", questionEn: "Are all servers, endpoints, storage, and mobile systems inventoried with owner, location, and lifecycle status?", description: "CMDB-Pflege ist Voraussetzung für Patch-, Lizenz- und DR-Steuerung.", descriptionEn: "CMDB maintenance underpins patch, licence, and DR governance." },
    netze: { question: "Sind alle aktiven Netzwerkkomponenten (Switch/Router/FW/AP) mit Modell, Firmware, Standort und EoL-Datum inventarisiert?", questionEn: "Are all active network components (switch/router/FW/AP) inventoried with model, firmware, location, and EoL date?", description: "Netzwerk-Inventar ist Basis für Patchplanung und Notfall-Tausch.", descriptionEn: "Network inventory is the basis for patching and emergency replacement." },
    ics_ot: { question: "Sind alle PLCs, RTUs, HMIs, SIS und Engineering-Workstations inkl. Firmware-Stand und Verantwortlichem erfasst?", questionEn: "Are all PLCs, RTUs, HMIs, SIS, and engineering workstations inventoried with firmware level and owner?", description: "OT-Inventare müssen Firmware und Lifecycle führen — Geräte laufen oft 10+ Jahre.", descriptionEn: "OT inventories must track firmware and lifecycle — devices often run 10+ years." },
    iot: { question: "Sind alle IoT-Geräte über Seriennummer, Standort, Firmware und Owner zentral registriert?", questionEn: "Are all IoT devices centrally registered with serial number, location, firmware, and owner?", description: "Schatten-IoT entzieht sich Patch-Pflichten — Discovery-Abgleich verhindert das.", descriptionEn: "Shadow IoT escapes patch obligations — discovery reconciliation prevents this." },
    standorte: { question: "Sind alle Liegenschaften, Räume und Rechenzentren mit Schutzbedarf, Eigentümer und Zonenklassifizierung erfasst?", questionEn: "Are all sites, rooms, and data centres listed with protection need, owner, and zone classification?", description: "Standort-Inventar bildet die Grundlage für physische Schutzmaßnahmen.", descriptionEn: "Site inventory is the basis for physical protection measures." },
    informationen: { question: "Sind alle wesentlichen Datenbestände (Datenbanken, Repositories, Dateifreigaben) mit Eigentümer und Klassifizierung erfasst?", questionEn: "Are all material data stores (databases, repositories, file shares) inventoried with owner and classification?", description: "Information-Asset-Register erlaubt zielgerichtete Schutzmaßnahmen.", descriptionEn: "An information asset register enables targeted protection." },
    anwendungen: { question: "Sind alle Anwendungen und Cloud-Services mit Eigentümer, Hosting-Modell und Datenklassifizierung inventarisiert?", questionEn: "Are all applications and cloud services inventoried with owner, hosting model, and data classification?", description: "App-Inventar verhindert Schatten-IT und unterstützt Lieferantensteuerung.", descriptionEn: "App inventory prevents shadow IT and supports supplier governance." },
  },
  "a-04": {
    it_systeme: { question: "Wird auf Servern und Endgeräten die installierte Software inkl. Version automatisch erfasst und mit Soll-Liste abgeglichen?", questionEn: "Is installed software on servers and endpoints captured automatically and reconciled against an approved baseline?", description: "Software-Inventar ist Voraussetzung für CVE-Mapping und Lizenz-Compliance.", descriptionEn: "Software inventory underpins CVE mapping and licence compliance." },
    anwendungen: { question: "Sind alle Anwendungen mit Version, Lizenzstatus und Support-Ende erfasst?", questionEn: "Are all applications inventoried with version, licence status, and end-of-support date?", description: "EoL-Anwendungen sind ein Top-Risiko — Lifecycle-Tracking ist Pflicht.", descriptionEn: "EoL applications are a top risk — lifecycle tracking is mandatory." },
  },
  "a-16": {
    anwendungen: { question: "Sind alle genutzten Cloud-Dienste (IaaS/PaaS/SaaS) erfasst und einer Risiko-/Datenschutzbewertung unterzogen?", questionEn: "Are all consumed cloud services (IaaS/PaaS/SaaS) inventoried and assessed for risk and privacy?", description: "SaaS-Wildwuchs ist häufigster Schatten-IT-Vektor; Cloud-Register schließt die Lücke.", descriptionEn: "SaaS sprawl is the most common shadow-IT vector; a cloud register closes the gap." },
    lieferanten: { question: "Sind Cloud-Provider als Lieferanten erfasst, vertraglich gebunden (DPA, SLA) und in der Lieferantenrisikoanalyse berücksichtigt?", questionEn: "Are cloud providers tracked as suppliers, contractually bound (DPA, SLA), and included in supplier risk analysis?", description: "Cloud-Provider sind kritische Lieferanten gemäß NIS2 Art. 21(2)d.", descriptionEn: "Cloud providers count as critical suppliers under NIS2 Art. 21(2)d." },
  },
  "a-17": {
    informationen: { question: "Sind die Datenflüsse jedes Datenbestands (Quelle → Verarbeitung → Ziel, intern/extern) dokumentiert?", questionEn: "Are data flows for each data store (source → processing → destination, internal/external) documented?", description: "Data-Flow-Mapping ist Grundlage für DLP, Verschlüsselung und Drittlandtransfer-Bewertung.", descriptionEn: "Data flow mapping underpins DLP, encryption, and third-country transfer assessments." },
    anwendungen: { question: "Sind die Daten-Schnittstellen der Anwendung (APIs, ETL, File-Drops) inkl. Frequenz und Sensitivität dokumentiert?", questionEn: "Are the application's data interfaces (APIs, ETL, file drops) documented including frequency and sensitivity?", description: "Schnittstellen-Inventar ist Grundlage für API-Security und Drittparteien-Mgmt.", descriptionEn: "Interface inventory underpins API security and third-party management." },
    it_systeme: { question: "Sind die ein- und ausgehenden Datenströme des Systems (z. B. Backup, Replikation, Monitoring) dokumentiert?", questionEn: "Are inbound and outbound data flows of the system (e.g. backup, replication, monitoring) documented?", description: "Daten-Flow-Sicht je System hilft, Schatten-Replikation und ungewollte Exfiltration zu erkennen.", descriptionEn: "System-level data flow views surface shadow replication and unwanted exfiltration." },
  },

  // ─── IAM technical ─────────────────────────────────────────────
  "g-03": {
    nutzende: { question: "Werden Mitarbeitende über ein zentrales IAM mit automatisiertem Joiner/Mover/Leaver-Prozess provisioniert und deprovisioniert?", questionEn: "Are employees provisioned/deprovisioned via a central IAM with automated joiner/mover/leaver workflow?", description: "Manuelles Offboarding hinterlässt verwaiste Konten — Automatisierung schließt diese Lücke.", descriptionEn: "Manual offboarding leaves orphaned accounts — automation closes the gap." },
    anwendungen: { question: "Bezieht die Anwendung Identitäten via SSO/SCIM aus dem zentralen IAM statt lokaler Konten?", questionEn: "Does the application source identities via SSO/SCIM from the central IAM instead of local accounts?", description: "Lokale App-Konten umgehen Lifecycle-Prozesse und sind ein häufiger Audit-Befund.", descriptionEn: "Local app accounts bypass lifecycle processes and are a common audit finding." },
    it_systeme: { question: "Werden System-Konten (Server, Hypervisor) über zentrales IAM/Verzeichnis verwaltet und beim Offboarding entzogen?", questionEn: "Are system accounts (servers, hypervisor) managed via central IAM/directory and revoked on offboarding?", description: "Domain-Join + Just-in-Time-Admin verhindert verwaiste Lokal-Admins auf Servern.", descriptionEn: "Domain join + just-in-time admin prevents orphaned local admins on servers." },
  },
  "g-04": {
    nutzende: { question: "Sind Rollen pro Mitarbeitenden-Funktion definiert und werden Berechtigungen mind. jährlich rezertifiziert?", questionEn: "Are roles defined per staff function and permissions recertified at least annually?", description: "Rezertifizierung schließt Rollen-Drift bei Funktionswechseln.", descriptionEn: "Recertification closes role drift after function changes." },
    anwendungen: { question: "Setzt die Anwendung ein dokumentiertes RBAC-Modell ein und werden Rollen-Reviews periodisch durchgeführt?", questionEn: "Does the application enforce a documented RBAC model with periodic role reviews?", description: "App-RBAC muss mit Identity-Governance-Reviews verzahnt sein.", descriptionEn: "App-level RBAC must integrate with identity governance reviews." },
    it_systeme: { question: "Sind Admin-Rollen auf System-/Hypervisor-Ebene nach Tier-0/1/2 segmentiert und reviewbar?", questionEn: "Are admin roles on system/hypervisor level segmented per Tier-0/1/2 and reviewable?", description: "Tier-Trennung reduziert Lateral-Movement-Risiko.", descriptionEn: "Tier separation reduces lateral movement risk." },
  },
  "i-09": {
    nutzende: { question: "Werden Berechtigungen je Mitarbeitenden nach Need-to-Know vergeben und periodisch reviewed?", questionEn: "Are permissions per employee granted on need-to-know and reviewed periodically?", description: "Need-to-Know erfordert nicht nur Erstvergabe, sondern fortlaufende Re-Validierung.", descriptionEn: "Need-to-know requires not just initial grant but continuous re-validation." },
    anwendungen: { question: "Wird der Zugriff auf Anwendungs-Funktionen/Daten nach Need-to-Know modelliert (Datenscope, Mandantengrenzen)?", questionEn: "Is access to application functions/data modelled on need-to-know (data scope, tenant boundaries)?", description: "Auf App-Ebene: Daten-Scope-Filter und Tenant-Isolation, nicht nur Rollen-Grant.", descriptionEn: "At app level: data scope filters and tenant isolation, not just role grants." },
    informationen: { question: "Wird der Zugriff auf den Datenbestand nach Need-to-Know und Klassifizierungsstufe eingeschränkt?", questionEn: "Is access to the data store limited by need-to-know and classification level?", description: "Daten-Klassifizierung (a-07) treibt Berechtigungsumfang.", descriptionEn: "Data classification (a-07) drives the permission scope." },
  },

  // ─── Business Continuity asset-level ───────────────────────────
  "c-11": {
    it_systeme: { question: "Existiert für das System ein DR-Plan mit georedundanter Datenhaltung und definiertem RTO/RPO?", questionEn: "Does the system have a DR plan with geo-redundant data hosting and defined RTO/RPO?", description: "DR ohne Geo-Redundanz schützt nicht gegen Standort-/Regionsausfall.", descriptionEn: "DR without geo-redundancy does not protect against site/region outage." },
    informationen: { question: "Werden die Daten georedundant gespeichert und ist Wiederherstellung in einer alternativen Region erprobt?", questionEn: "Is the data stored geo-redundantly and recovery in an alternate region tested?", description: "Georedundanz muss regelmäßig per Restore-Test verifiziert werden.", descriptionEn: "Geo-redundancy must be verified regularly via restore test." },
    anwendungen: { question: "Ist die Anwendung mit Multi-Region-/Failover-Architektur ausgelegt und ein DR-Runbook vorhanden?", questionEn: "Is the application designed with multi-region/failover architecture and a DR runbook in place?", description: "DR-Runbook + jährlicher Failover-Test sind Pflicht für kritische Apps.", descriptionEn: "DR runbook + annual failover test is mandatory for critical apps." },
  },
  "c-12": {
    it_systeme: { question: "Sind kritische Server/Storage redundant ausgelegt (Cluster, HA-Pair, RAID, USV)?", questionEn: "Are critical servers/storage deployed redundantly (cluster, HA pair, RAID, UPS)?", description: "Single Points of Failure auf Hardware-Ebene sind die häufigste Verfügbarkeitsursache.", descriptionEn: "Hardware single points of failure are the leading availability cause." },
    anwendungen: { question: "Läuft die Anwendung in HA-Konfiguration (Load-Balancer, mehrere Instanzen) ohne Single Point of Failure?", questionEn: "Does the application run in HA configuration (load balancer, multiple instances) without single point of failure?", description: "App-HA muss bis zur Datenbank durchgezogen sein, sonst nur Schein-Verfügbarkeit.", descriptionEn: "App HA must extend to the database, otherwise only apparent availability." },
    informationen: { question: "Wird der Datenbestand mit Replikation/Mirroring redundant gehalten?", questionEn: "Is the data store kept redundant via replication/mirroring?", description: "Replikation ersetzt kein Backup — beide Schichten sind nötig.", descriptionEn: "Replication does not replace backup — both layers are needed." },
    netze: { question: "Sind Netzwerkpfade (Uplinks, Core-Switches, Internet-Anbindung) redundant ausgelegt?", questionEn: "Are network paths (uplinks, core switches, internet links) deployed redundantly?", description: "Netzwerk-SPOF entwertet jede Anwendungs-HA.", descriptionEn: "Network SPOFs invalidate every application HA design." },
  },

  // ─── Physical access (asset-level) ─────────────────────────────
  "i-04": {
    it_systeme: { question: "Sind Serverräume/Racks mit Zutrittskontrolle (Karte/Biometrie) und Protokollierung gesichert?", questionEn: "Are server rooms/racks secured with access control (card/biometric) and logging?", description: "Physischer Zugriff entwertet alle logischen Kontrollen.", descriptionEn: "Physical access bypasses every logical control." },
    netze: { question: "Sind Verteilerräume und Netzwerk-Schränke verschlossen und Zutritte protokolliert?", questionEn: "Are distribution rooms and network cabinets locked with access logged?", description: "Offene Patchpanels ermöglichen Rogue-Devices und TAP-Angriffe.", descriptionEn: "Open patch panels enable rogue devices and TAP attacks." },
    ics_ot: { question: "Sind Steuerungsräume und Schaltschränke der OT-Anlagen gegen unbefugten physischen Zugriff geschützt?", questionEn: "Are OT control rooms and cabinets protected against unauthorised physical access?", description: "PLC-Schränke ohne Schloss erlauben Reset/Reflash vor Ort.", descriptionEn: "Unlocked PLC cabinets allow on-site reset/reflash." },
  },
  "i-05": {
    it_systeme: { question: "Werden Besucherzugänge zu IT-Bereichen mit Begleitung, Ausweis und Logbuch dokumentiert?", questionEn: "Are visitor accesses to IT areas documented with escort, badge, and logbook?", description: "Unbeaufsichtigte Besucher in Serverräumen sind ein klassischer Audit-Befund.", descriptionEn: "Unescorted visitors in server rooms are a classic audit finding." },
    netze: { question: "Werden Wartungsbesuche an Netzwerk-Verteilerräumen begleitet und dokumentiert?", questionEn: "Are maintenance visits to network distribution rooms escorted and logged?", description: "Externe Techniker brauchen Begleitung und protokollierten Zutritt.", descriptionEn: "External technicians require escort and logged access." },
    ics_ot: { question: "Werden externe OT-Techniker bei Anwesenheit in Steuerungsbereichen begleitet und Zutritte dokumentiert?", questionEn: "Are external OT technicians escorted in control areas and access documented?", description: "OT-Wartungseinsätze sind häufigster Initialvektor für Sabotage/Fehlbedienung.", descriptionEn: "OT maintenance visits are the leading initial vector for sabotage/error." },
  },
  "phy-02": {
    it_systeme: { question: "Sind Räume mit IT-Geräten gegen unbefugten Zutritt und Einsicht (Sichtschutz, Bildschirmsperre) geschützt?", questionEn: "Are rooms with IT equipment protected against unauthorised access and overlooking (privacy filter, screen lock)?", description: "Open-Office mit unverschlossenen Notebooks ist ein Datenleck-Vektor.", descriptionEn: "Open offices with unlocked laptops are a data-leak vector." },
    netze: { question: "Sind Räume mit Netzwerk-Geräten zugriffsgeschützt und gegen Einsicht abgesichert?", questionEn: "Are rooms with network gear access-protected and shielded from overlooking?", description: "Verteilerräume mit offen sichtbaren Configs sind Aufklärungsziel.", descriptionEn: "Distribution rooms with visible configs are reconnaissance targets." },
  },
  "phy-03": {
    it_systeme: { question: "Werden IT-Bereiche mit Videoüberwachung und Einbruchmeldetechnik überwacht?", questionEn: "Are IT areas covered by CCTV and intrusion detection?", description: "CCTV-Aufzeichnung mit definierter Aufbewahrung dient als Forensik-Beleg.", descriptionEn: "CCTV recording with defined retention serves as forensic evidence." },
    netze: { question: "Werden Verteiler-/Netzwerkräume per CCTV oder Türkontakt überwacht?", questionEn: "Are network/distribution rooms monitored via CCTV or door contact?", description: "Türkontakt + Alarm bei Off-Hours-Öffnung ist die Mindestanforderung.", descriptionEn: "Door contact + alarm on off-hours opening is the minimum.", },
    ics_ot: { question: "Werden Steuerungsräume und Anlagenbereiche mit physischer Überwachung (CCTV, Bewegungssensoren) abgesichert?", questionEn: "Are OT control rooms and plant areas covered by physical surveillance (CCTV, motion sensors)?", description: "OT-Sabotage erfolgt häufig physisch — Detektion ist Voraussetzung für Reaktion.", descriptionEn: "OT sabotage is often physical — detection enables response." },
  },
  "phy-04": {
    it_systeme: { question: "Sind Regeln für Arbeiten in Sicherheitsbereichen (Foto-/Aufzeichnungsverbot, Clean-Desk) dokumentiert?", questionEn: "Are rules for work in secure areas (no photos/recording, clean desk) documented?", description: "Clean-Desk + Aufzeichnungsverbot werden auditiert, nicht nur kommuniziert.", descriptionEn: "Clean-desk and recording bans are audited, not only communicated." },
    ics_ot: { question: "Existieren Verhaltensregeln für Arbeiten in OT-Sicherheitszonen (USB-Verbot, freigegebene Geräte)?", questionEn: "Are behaviour rules for work in OT secure zones (USB ban, approved devices) defined?", description: "USB an Engineering-Workstations ist ein klassischer Malware-Vektor.", descriptionEn: "USB on engineering workstations is a classic malware vector." },
  },
  "phy-05": {
    it_systeme: { question: "Sind Server- und Storage-Räume gegen Feuer, Wasser, Hitze und Stromausfall (USV/NEA, Klima, Brandfrüherkennung) geschützt?", questionEn: "Are server and storage rooms protected against fire, water, heat, and power loss (UPS/genset, A/C, early fire detection)?", description: "Umweltschutz inkl. USV-Tests gehört zum jährlichen DR-Programm.", descriptionEn: "Environmental protection incl. UPS testing is part of the annual DR programme." },
    netze: { question: "Sind Netzwerk-Räume gegen Feuer, Wasser und Stromausfall geschützt (USV, Brandfrüherkennung)?", questionEn: "Are network rooms protected against fire, water, and power loss (UPS, early fire detection)?", description: "Netz-Ausfall durch Klima/Strom erschüttert die gesamte Infrastruktur.", descriptionEn: "Climate/power loss in network rooms shakes the whole infrastructure." },
    ics_ot: { question: "Sind Schaltanlagen/Schaltschränke gegen Umweltrisiken (Hitze, Staub, Vibration, EMV) geschützt?", questionEn: "Are control cabinets protected against environmental risks (heat, dust, vibration, EMC)?", description: "OT-Umgebungen erfordern industrietaugliche Schutzklassen (IP-Rating).", descriptionEn: "OT environments require industrial protection ratings (IP rating)." },
  },
  "phy-06": {
    it_systeme: { question: "Sind IT-Geräte so platziert, dass sie nicht von Unbefugten erreicht oder eingesehen werden können?", questionEn: "Are IT devices placed so they cannot be reached or overlooked by unauthorised parties?", description: "Bildschirme in Empfangsbereichen brauchen Sichtschutz oder Reorientierung.", descriptionEn: "Screens in reception areas need privacy filters or repositioning." },
    netze: { question: "Sind Netzwerkdosen in öffentlichen Bereichen deaktiviert oder per NAC abgesichert?", questionEn: "Are network sockets in public areas disabled or NAC-protected?", description: "Aktive Wandbuchsen ohne 802.1X sind ein klassischer Initialvektor.", descriptionEn: "Active wall sockets without 802.1X are a classic initial vector." },
  },
  "phy-07": {
    it_systeme: { question: "Sind außerhalb des Unternehmens betriebene Geräte (Notebooks, Mobile) per FDE, MDM und Diebstahlschutz abgesichert?", questionEn: "Are devices used outside premises (laptops, mobiles) protected via FDE, MDM, and anti-theft?", description: "Off-Site-Geräte sind das häufigste Diebstahls-/Verlustziel.", descriptionEn: "Off-site devices are the most common theft/loss target." },
  },
  "phy-08": {
    it_systeme: { question: "Werden Speichermedien über ihren gesamten Lebenszyklus (Empfang, Nutzung, Vernichtung) sicher verwaltet?", questionEn: "Are storage media securely managed across their lifecycle (intake, use, destruction)?", description: "Datenträgervernichtung muss zertifiziert sein (DIN 66399).", descriptionEn: "Media destruction must be certified (DIN 66399)." },
  },
  "phy-09": {
    it_systeme: { question: "Sind Strom-, Klima- und Wasserversorgung der IT-Bereiche redundant ausgelegt und werden regelmäßig getestet?", questionEn: "Are power, A/C, and water supply for IT areas redundant and regularly tested?", description: "Versorgungsausfall ist die häufigste DC-Ursache für ungeplante Downtime.", descriptionEn: "Utility failure is the leading DC cause of unplanned downtime." },
    netze: { question: "Sind Stromversorgung und Kühlung der Netzwerk-Räume redundant ausgelegt?", questionEn: "Are power and cooling for network rooms redundant?", description: "USV ohne NEA-Backup hält keine längeren Ausfälle aus.", descriptionEn: "UPS without genset backup cannot handle longer outages." },
  },
  "phy-10": {
    it_systeme: { question: "Ist die Strom- und Datenverkabelung gegen Beschädigung, Abhören und Manipulation geschützt (Trassen, Schächte)?", questionEn: "Are power and data cables protected against damage, eavesdropping, and tampering (trays, conduits)?", description: "Offene Trassen ermöglichen TAPs und Sabotage.", descriptionEn: "Open trays enable TAPs and sabotage." },
    netze: { question: "Ist die Verkabelung im Verteilerbereich strukturiert, beschriftet und gegen Manipulation gesichert?", questionEn: "Is wiring in distribution areas structured, labelled, and tamper-protected?", description: "Strukturierte Verkabelung erleichtert auch Forensik bei Vorfällen.", descriptionEn: "Structured wiring also eases forensic work after incidents." },
    ics_ot: { question: "Ist die OT-Feldverkabelung (Steuer-/Sicherheitsleitungen) gegen mechanische und elektromagnetische Störungen geschützt?", questionEn: "Is OT field wiring (control/safety lines) protected against mechanical and EMC interference?", description: "OT-Verkabelung muss zusätzlich Safety-Anforderungen erfüllen.", descriptionEn: "OT wiring must additionally meet safety requirements." },
  },
  "phy-11": {
    it_systeme: { question: "Werden IT-Geräte nach Wartungsplan gewartet und Wartungsnachweise dokumentiert?", questionEn: "Is IT equipment maintained per schedule and maintenance evidence documented?", description: "Garantie + Verfügbarkeit hängen an dokumentierter Wartung.", descriptionEn: "Warranty and availability depend on documented maintenance." },
    netze: { question: "Werden Netzwerkkomponenten nach Lifecycle-Plan inkl. Firmware-Update und Hardware-Tausch gewartet?", questionEn: "Is network gear maintained per lifecycle plan incl. firmware updates and hardware swap?", description: "EoL-Switches ohne Patches sind ein vermeidbares Risiko.", descriptionEn: "EoL switches without patches are an avoidable risk." },
    ics_ot: { question: "Werden OT-Komponenten nach Hersteller-Wartungsplan gewartet und Wartungsfenster mit Anlagenbetrieb abgestimmt?", questionEn: "Is OT equipment serviced per vendor schedule with windows coordinated with plant operations?", description: "OT-Wartung ohne Change-Window-Abstimmung gefährdet die Produktion.", descriptionEn: "OT maintenance without change-window coordination endangers production." },
  },
  "i-07": {
    it_systeme: { question: "Werden Asset-Management-Prozesse (Beschaffung, Inbetriebnahme, Außerbetriebnahme) durchgängig für IT-Systeme angewendet?", questionEn: "Are asset management processes (procurement, deployment, decommission) applied end-to-end for IT systems?", description: "Lifecycle-Lücken (z. B. ungemeldete Außerbetriebnahmen) verzerren das Inventar.", descriptionEn: "Lifecycle gaps (e.g. unreported decommissions) distort the inventory." },
  },
  "i-08": {
    it_systeme: { question: "Existieren Verfahren für sichere Entsorgung/Wiederverwendung von IT-Geräten inkl. zertifizierter Datenlöschung?", questionEn: "Are procedures for secure disposal/reuse of IT equipment with certified data wiping in place?", description: "Datenlöschung muss zertifiziert (z. B. NIST 800-88) und dokumentiert sein.", descriptionEn: "Data wiping must be certified (e.g. NIST 800-88) and documented." },
  },

  // ─── Endpoint security extended ────────────────────────────────
  "e-20": {
    it_systeme: { question: "Werden Smartphones und Tablets über MDM mit Compliance-Profilen, App-Allowlist und Remote-Wipe verwaltet?", questionEn: "Are smartphones and tablets managed via MDM with compliance profiles, app allowlist, and remote wipe?", description: "MDM ohne Compliance-Erzwingung ist nur ein Inventar-Tool.", descriptionEn: "MDM without compliance enforcement is just an inventory tool." },
  },
  "g-05": {
    it_systeme: { question: "Werden privilegierte Konten über PAM (Vault, Session-Recording, JIT-Zugriff) verwaltet und überwacht?", questionEn: "Are privileged accounts managed via PAM (vault, session recording, JIT access) and monitored?", description: "Daueraktive Admin-Konten ohne PAM sind ein primärer Angriffsvektor.", descriptionEn: "Standing admin accounts without PAM are a primary attack vector." },
    anwendungen: { question: "Werden privilegierte App-Konten (Admin, Service-Accounts, API-Keys) im Vault gehalten und rotiert?", questionEn: "Are privileged app accounts (admin, service, API keys) held in a vault and rotated?", description: "Hardcoded Service-Accounts in Configs sind ein klassischer Audit-Fund.", descriptionEn: "Hardcoded service accounts in configs are a classic audit finding." },
  },
  "tech-02": {
    anwendungen: { question: "Ist der Zugriff auf Quellcode-Repositories und Build-Pipelines per RBAC und MFA abgesichert?", questionEn: "Is access to source repositories and build pipelines secured via RBAC and MFA?", description: "Repo-Kompromittierung führt direkt zur Supply-Chain-Lücke (siehe SolarWinds).", descriptionEn: "Repo compromise directly enables supply-chain gaps (cf. SolarWinds)." },
  },
  "tech-03": {
    anwendungen: { question: "Verwendet die Anwendung sichere Auth-Mechanismen (TLS, hashed Passwords mit Bcrypt/Argon2, MFA-Hooks)?", questionEn: "Does the application use secure auth mechanisms (TLS, hashed passwords with bcrypt/argon2, MFA hooks)?", description: "Klartext-Passwörter oder MD5-Hashes sind sofortige NIS2-Befunde.", descriptionEn: "Cleartext passwords or MD5 hashes are immediate NIS2 findings." },
    it_systeme: { question: "Werden Anmeldungen an System-Endpunkten (SSH, RDP, Console) ausschließlich verschlüsselt geführt?", questionEn: "Are sign-ins to system endpoints (SSH, RDP, console) carried encrypted only?", description: "Telnet/rsh/unverschlüsseltes VNC darf in Produktivsystemen nicht aktiv sein.", descriptionEn: "Telnet/rsh/unencrypted VNC must not be active in production." },
  },
  "ep-01": {
    it_systeme: { question: "Werden Endgeräte nach Hardening-Standard (CIS Benchmark, STIG) konfiguriert und Drift überwacht?", questionEn: "Are endpoints configured per a hardening standard (CIS Benchmark, STIG) with drift monitoring?", description: "Hardening ohne Drift-Detection erodiert nach jedem Patch.", descriptionEn: "Hardening without drift detection erodes after every patch." },
  },
  "ep-02": {
    it_systeme: { question: "Wird Application-Allowlisting (z. B. AppLocker, WDAC) auf Endgeräten erzwungen?", questionEn: "Is application allowlisting (e.g. AppLocker, WDAC) enforced on endpoints?", description: "Allowlisting verhindert ausführbare Schadsoftware auch ohne Signatur.", descriptionEn: "Allowlisting blocks executable malware even without a signature." },
  },

  // ─── Network security additional ───────────────────────────────
  "e-01": {
    netze: { question: "Sind alle Netzwerkkomponenten (Router/Switch/FW) nach Härtungs-Baseline konfiguriert (sichere Mgmt-Plane, deaktivierte Default-Dienste)?", questionEn: "Are all network components (router/switch/FW) configured per hardening baseline (secure mgmt plane, default services disabled)?", description: "Mgmt-Plane-Härtung ist die wirksamste Einzelmaßnahme im Netz.", descriptionEn: "Management-plane hardening is the most effective single measure in networks." },
    it_systeme: { question: "Sind hostbasierte Netzwerkdienste (Firewall-Regeln, IPv6, Discovery-Protokolle) auf Servern und Endgeräten gehärtet?", questionEn: "Are host-based network services (firewall rules, IPv6, discovery protocols) hardened on servers and endpoints?", description: "Ungehärtete Hosts ermöglichen Lateral Movement trotz Netzwerk-Segmentierung.", descriptionEn: "Unhardened hosts enable lateral movement despite network segmentation." },
    ics_ot: { question: "Sind OT-Netz-Komponenten nach IEC-62443-Konzept konfiguriert und ungenutzte industrielle Protokolle deaktiviert?", questionEn: "Are OT network components configured per IEC 62443 and unused industrial protocols disabled?", description: "Hersteller-Defaults in OT enthalten oft offene Engineering-Protokolle.", descriptionEn: "OT vendor defaults often expose open engineering protocols." },
  },
  "e-02": {
    netze: { question: "Ist das Netzwerk in Sicherheitszonen segmentiert (Server, User-LAN, Gäste-WLAN, DMZ, OT) mit Firewall-Regeln zwischen den Zonen?", questionEn: "Is the network segmented into security zones (server, user LAN, guest WLAN, DMZ, OT) with firewall rules between zones?", description: "Flat-Network ist die häufigste Ursache für massive Lateral-Movement-Vorfälle.", descriptionEn: "Flat networks are the leading cause of massive lateral-movement incidents." },
    it_systeme: { question: "Sind Server in Tier-getrennten Netzsegmenten (Tier-0/1/2, Backup, Management) platziert?", questionEn: "Are servers placed in tier-separated network segments (Tier-0/1/2, backup, management)?", description: "Tier-0-Systeme (DC, Backup, Hypervisor-Mgmt) gehören in eigenes isoliertes Netz.", descriptionEn: "Tier-0 systems (DC, backup, hypervisor mgmt) belong in their own isolated network." },
    ics_ot: { question: "Sind OT-Zellen gegenüber Office- und Internet-Zonen über DMZ/Conduit (Purdue Model) getrennt?", questionEn: "Are OT cells separated from office and internet zones via DMZ/conduit (Purdue model)?", description: "Direkte OT-Office-Konnektivität ist die häufigste Ursache für OT-Vorfälle.", descriptionEn: "Direct OT-office connectivity is the leading cause of OT incidents." },
  },
  "e-04": {
    it_systeme: { question: "Sind hostbasierte Firewalls auf Servern und Endgeräten aktiviert mit Default-Deny-Policy?", questionEn: "Are host-based firewalls active on servers and endpoints with default-deny policy?", description: "Host-FW ergänzt Netz-FW gegen Lateral Movement im selben Segment.", descriptionEn: "Host firewalls complement network firewalls against intra-segment lateral movement." },
    netze: { question: "Sind Perimeter- und Interzonen-Firewalls mit Default-Deny und dokumentiertem Regelwerk konfiguriert?", questionEn: "Are perimeter and inter-zone firewalls configured default-deny with documented rule sets?", description: "Regel-Reviews und Cleanup verhindern Regel-Wildwuchs über die Jahre.", descriptionEn: "Rule reviews and clean-up prevent rule sprawl over the years." },
  },
  "j-05": {
    netze: { question: "Werden DNS-Anfragen über DNSSEC validiert und ausgehende DNS-Auflösung über kontrollierte Resolver (DoH/DoT) geführt?", questionEn: "Are DNS queries validated via DNSSEC and outbound resolution routed through controlled resolvers (DoH/DoT)?", description: "Ungesicherte DNS-Auflösung ist primärer C2-/Phishing-Vektor.", descriptionEn: "Unsecured DNS resolution is a primary C2/phishing vector." },
    it_systeme: { question: "Beziehen Server und Endgeräte DNS ausschließlich über die zentral kontrollierten Unternehmens-Resolver?", questionEn: "Do servers and endpoints obtain DNS exclusively via centrally controlled corporate resolvers?", description: "Direktes Public-DNS umgeht alle DNS-Filter.", descriptionEn: "Direct public DNS bypasses all DNS filters." },
  },
  "j-07": {
    netze: { question: "Wird Zero-Trust-Netzwerkzugang (Microsegmentation, Identity-aware Proxy) statt klassischem Perimeter-VPN umgesetzt?", questionEn: "Is zero-trust network access (microsegmentation, identity-aware proxy) used instead of classic perimeter VPN?", description: "Klassisches VPN gewährt zu breiten Zugang nach erfolgreicher Auth.", descriptionEn: "Classic VPN grants overly broad access after successful auth." },
    anwendungen: { question: "Erzwingt der Anwendungszugang Zero-Trust-Prinzipien (Identity + Device Posture + Session Context)?", questionEn: "Does application access enforce zero-trust principles (identity + device posture + session context)?", description: "Conditional Access mit Geräte-Compliance ist der ZTA-Minimalstand für Apps.", descriptionEn: "Conditional access with device compliance is the ZTA baseline for apps." },
    it_systeme: { question: "Werden System-Zugriffe nach Zero-Trust-Mustern (kein implizites Vertrauen aus Netzwerkposition) gesteuert?", questionEn: "Are system accesses governed via zero-trust patterns (no implicit trust from network location)?", description: "Auch interne Hosts dürfen sich nicht ohne Auth gegenseitig vertrauen.", descriptionEn: "Even internal hosts must not trust each other without authentication." },
  },
  "e-11": {
    netze: { question: "Werden Netzwerkkomponenten regelmäßig auf aktueller Firmware/Software gehalten und Patch-Stand zentral überwacht?", questionEn: "Is network gear kept on current firmware/software and patch level centrally monitored?", description: "Veraltete Switch-/FW-Firmware ist häufigste Eintrittsstelle für Netz-Schwachstellen.", descriptionEn: "Outdated switch/FW firmware is the most common entry for network vulnerabilities." },
    it_systeme: { question: "Sind Server-Hardware-Firmware (BIOS/UEFI/BMC) und Treiber auf aktuellem Stand?", questionEn: "Are server hardware firmware (BIOS/UEFI/BMC) and drivers kept current?", description: "BMC/IPMI-Schwachstellen erlauben Out-of-Band-Übernahme.", descriptionEn: "BMC/IPMI vulnerabilities enable out-of-band takeover." },
  },
  "net-01": {
    netze: { question: "Werden regelmäßige Netzwerk-Penetrationstests (intern und extern) durchgeführt und Findings nachverfolgt?", questionEn: "Are regular network penetration tests (internal and external) performed and findings tracked?", description: "Pen-Tests prüfen die Wirksamkeit der Segmentierung in der Realität.", descriptionEn: "Pen tests validate segmentation effectiveness in practice." },
    it_systeme: { question: "Werden Server und Infrastruktur-Komponenten in den Scope regelmäßiger Pen-Tests einbezogen?", questionEn: "Are servers and infrastructure components included in regular pen-test scope?", description: "Server-Härtung wird erst durch Pen-Test verifiziert, nicht durch Scans allein.", descriptionEn: "Server hardening is only verified by pen tests, not by scans alone." },
    anwendungen: { question: "Werden öffentlich erreichbare Anwendungen regelmäßig durch externe Pen-Tester geprüft?", questionEn: "Are externally reachable applications regularly tested by external pen testers?", description: "App-Pen-Test gehört bei jedem Major-Release in den Release-Prozess.", descriptionEn: "App pen tests belong in the release process for every major version." },
  },
  "net-03": {
    netze: { question: "Sind alle WLAN-SSIDs mit WPA3 (oder WPA2-Enterprise mit 802.1X) abgesichert und Gast-/Corp-Netz strikt getrennt?", questionEn: "Are all WLAN SSIDs secured with WPA3 (or WPA2-Enterprise with 802.1X) and guest/corp networks strictly separated?", description: "WPA2-PSK in Corp-Netzen ist eine NIS2-relevante Schwäche.", descriptionEn: "WPA2-PSK in corporate networks is a NIS2-relevant weakness." },
  },

  // ─── Cryptography ──────────────────────────────────────────────
  "h-02": {
    anwendungen: { question: "Erzwingt die Anwendung TLS 1.2/1.3 für alle ein- und ausgehenden Verbindungen ohne Fallback auf schwache Cipher-Suites?", questionEn: "Does the application enforce TLS 1.2/1.3 for all inbound/outbound connections without fallback to weak cipher suites?", description: "TLS-Konfig wird per externem Scan (z. B. SSL Labs A+) verifiziert.", descriptionEn: "TLS config is verified via external scan (e.g. SSL Labs A+)." },
    informationen: { question: "Werden Datenbestände bei Übertragung (Replication, Backup-Streams, ETL) verschlüsselt übermittelt?", questionEn: "Are data stores encrypted in transit (replication, backup streams, ETL)?", description: "Backup-Streams im Klartext sind ein häufiger Audit-Befund.", descriptionEn: "Backup streams in cleartext are a common audit finding." },
  },
  "h-04": {
    anwendungen: { question: "Werden kryptographische Schlüssel der Anwendung in einem KMS/HSM gehalten und Rotation automatisiert?", questionEn: "Are application crypto keys held in a KMS/HSM with automated rotation?", description: "Schlüssel im Code/Config sind unmittelbarer Befund.", descriptionEn: "Keys in code/config are immediate findings." },
    it_systeme: { question: "Werden System-Schlüssel (FDE, SSH-Hostkeys, TLS-Zertifikate) zentral verwaltet und rotiert?", questionEn: "Are system keys (FDE, SSH host keys, TLS certs) centrally managed and rotated?", description: "FDE-Recovery-Keys gehören in einen abgesicherten Schlüsselverwahrer.", descriptionEn: "FDE recovery keys belong in a secured key escrow." },
    informationen: { question: "Werden Verschlüsselungsschlüssel des Datenbestands von den verschlüsselten Daten getrennt verwaltet (KMS)?", questionEn: "Are encryption keys for the data store managed separately from the encrypted data (KMS)?", description: "BYOK/HYOK-Modelle erhöhen Tenant-Isolation in geteilten Plattformen.", descriptionEn: "BYOK/HYOK increases tenant isolation in shared platforms." },
  },
  "h-05": {
    anwendungen: { question: "Werden eingesetzte Crypto-Bibliotheken/Algorithmen jährlich gegen aktuelle BSI/TR-Empfehlungen geprüft?", questionEn: "Are crypto libraries/algorithms reviewed annually against current BSI/TR recommendations?", description: "MD5, SHA-1, RC4, 3DES sind nicht mehr akzeptabel.", descriptionEn: "MD5, SHA-1, RC4, 3DES are no longer acceptable." },
    it_systeme: { question: "Werden Crypto-Konfigurationen auf Servern (TLS, SSH, IPSec) periodisch auf veraltete Algorithmen geprüft?", questionEn: "Are crypto configurations on servers (TLS, SSH, IPSec) periodically reviewed for legacy algorithms?", description: "Server-Configs altern still vor sich hin — automatisierte Scans sind Pflicht.", descriptionEn: "Server configs silently age — automated scans are mandatory." },
  },
  "h-06": {
    anwendungen: { question: "Wird E-Mail-Verkehr mit vertraulichem Inhalt verschlüsselt (S/MIME, PGP) oder über sichere Portale ausgetauscht?", questionEn: "Are emails with confidential content encrypted (S/MIME, PGP) or exchanged via secure portals?", description: "Vertrauliche Anhänge im Klartext sind ein DSGVO-Risiko.", descriptionEn: "Cleartext confidential attachments are a GDPR risk." },
  },
  "h-07": {
    netze: { question: "Werden Remote-Zugriffe über VPN mit aktuellen Cipher-Suites (z. B. IKEv2, WireGuard) und MFA abgesichert?", questionEn: "Is remote access via VPN secured with current cipher suites (e.g. IKEv2, WireGuard) and MFA?", description: "Legacy-VPN (PPTP, L2TP/PSK) ist nicht NIS2-konform.", descriptionEn: "Legacy VPN (PPTP, L2TP/PSK) is not NIS2 compliant." },
    it_systeme: { question: "Werden Server-Remote-Zugänge ausschließlich über VPN/Bastion mit MFA und Session-Logging geführt?", questionEn: "Is server remote access only via VPN/bastion with MFA and session logging?", description: "Direkt aus dem Internet erreichbare Mgmt-Ports sind ein NIS2-No-Go.", descriptionEn: "Internet-exposed management ports are a NIS2 no-go." },
    anwendungen: { question: "Werden Admin-Konsolen der Anwendung über Bastion/VPN mit MFA exponiert statt direkt im Internet?", questionEn: "Are application admin consoles exposed via bastion/VPN with MFA instead of directly on the internet?", description: "Direkt erreichbare Admin-UIs sind primäres Target für Brute-Force.", descriptionEn: "Directly reachable admin UIs are prime brute-force targets." },
  },
  "h-08": {
    it_systeme: { question: "Werden Server-/Service-Zertifikate zentral inventarisiert und automatisiert vor Ablauf erneuert?", questionEn: "Are server/service certificates centrally inventoried and renewed automatically before expiry?", description: "Cert-Outages sind eine häufige Verfügbarkeitsursache.", descriptionEn: "Certificate outages are a frequent availability cause." },
    anwendungen: { question: "Werden Anwendungs-Zertifikate (TLS, mTLS, Signing) automatisch über ACME/Cert-Manager erneuert?", questionEn: "Are application certificates (TLS, mTLS, signing) renewed automatically via ACME/cert-manager?", description: "Manuelle Renewals führen unweigerlich zu Ausfällen.", descriptionEn: "Manual renewals inevitably cause outages." },
    nutzende: { question: "Werden Nutzer-/Geräte-Zertifikate (Smartcard, Client-Cert) zentral ausgegeben und bei Offboarding revoked?", questionEn: "Are user/device certificates (smartcard, client cert) centrally issued and revoked on offboarding?", description: "Verwaiste User-Zerts ermöglichen weiteren Zugriff nach Austritt.", descriptionEn: "Orphaned user certs enable continued access after departure." },
  },
  "h-09": {
    nutzende: { question: "Existiert ein Plan/Awareness zur Migration auf quantensichere Authentifizierungs-/Signatur-Verfahren (PQC)?", questionEn: "Is there a plan/awareness for migration to quantum-safe authentication/signature schemes (PQC)?", description: "Identity-PKI ist 'harvest-now-decrypt-later'-anfällig — frühe Inventur sinnvoll.", descriptionEn: "Identity PKI is harvest-now-decrypt-later vulnerable — early inventory is sensible." },
    anwendungen: { question: "Wurde die Anwendung auf Crypto-Agility (austauschbare Algorithmen) und PQC-Migration bewertet?", questionEn: "Has the application been assessed for crypto agility (swappable algorithms) and PQC migration?", description: "Hartcodierte Algorithmen verhindern Notfall-Migration.", descriptionEn: "Hardcoded algorithms block emergency migration." },
    it_systeme: { question: "Wurden System-Crypto-Stacks (TLS-Libs, SSH, VPN) auf PQC-Roadmap und Update-Pfad geprüft?", questionEn: "Have system crypto stacks (TLS libs, SSH, VPN) been reviewed for PQC roadmap and update path?", description: "Lieferanten-Roadmaps für PQC sind unterschiedlich weit — Inventur lohnt sich.", descriptionEn: "Vendor PQC roadmaps differ widely — inventory pays off." },
  },
  "j-01": {
    anwendungen: { question: "Bietet die Anwendung gesicherte Kommunikationskanäle (E2EE-Chat, Signal-Protokoll, verschlüsselte Anrufe) für vertrauliche interne Kommunikation?", questionEn: "Does the application provide secure communication channels (E2EE chat, Signal protocol, encrypted calls) for confidential internal use?", description: "Schatten-Messenger entstehen, wenn keine genehmigte Lösung existiert.", descriptionEn: "Shadow messengers appear when no approved solution exists." },
  },
  "j-02": {
    anwendungen: { question: "Existiert ein vom Hauptnetz unabhängiger Notfall-Kommunikationskanal (Out-of-Band, Mobilfunk, Sat-Link)?", questionEn: "Is an out-of-band emergency communication channel (mobile, satellite link) available, independent of the main network?", description: "Wenn die Hauptinfrastruktur ausfällt, müssen Krisenstabskanäle weiter funktionieren.", descriptionEn: "When primary infrastructure fails, crisis-team channels must keep working." },
    it_systeme: { question: "Verfügen kritische IT-Systeme über einen Out-of-Band-Management-Zugang (separates Mgmt-VLAN, Konsolen-Server, LTE-Backup), der bei Ausfall des Produktivnetzes weiter erreichbar bleibt?", questionEn: "Do critical IT systems provide out-of-band management access (separate mgmt VLAN, console server, LTE backup) that remains reachable if the production network fails?", description: "Wenn das Produktivnetz kompromittiert oder ausgefallen ist, ist OOB-Management der einzige Pfad für Recovery-Operationen.", descriptionEn: "When the production network is compromised or down, OOB management is the only path for recovery operations." },
  },
  "j-03": {
    anwendungen: { question: "Sind Videokonferenz-Räume mit E2EE, Warteraum, Passwort und Recording-Kontrolle gehärtet?", questionEn: "Are video-conference rooms hardened with E2EE, waiting room, passcode, and recording controls?", description: "Offene Konferenzräume sind ein bekannter Spionage-Vektor.", descriptionEn: "Open conference rooms are a known espionage vector." },
  },
  "j-04": {
    anwendungen: { question: "Existiert ein gesicherter Datei-Austauschkanal (verschlüsselte Portale, kein Klartext-FTP/E-Mail-Anhang) für vertrauliche Dokumente?", questionEn: "Is there a secure file exchange channel (encrypted portals, no cleartext FTP/email attachment) for confidential documents?", description: "Klartext-FTP/Mail-Anhang ist DSGVO- und NIS2-relevant.", descriptionEn: "Cleartext FTP/email attachment is GDPR- and NIS2-relevant." },
  },

  // ─── Vulnerability mgmt ────────────────────────────────────────
  "a-09": {
    it_systeme: { question: "Werden Server und Endgeräte regelmäßig per Vulnerability-Scanner geprüft und Findings nach SLA behoben?", questionEn: "Are servers and endpoints regularly scanned and findings remediated per SLA?", description: "Scan ohne Remediation-SLA ist nur Risikodokumentation.", descriptionEn: "Scanning without remediation SLA is just risk documentation." },
    netze: { question: "Werden Netzwerkkomponenten gegen CVE-Listen abgeglichen und Patches innerhalb definierter SLAs eingespielt?", questionEn: "Are network components matched against CVE lists and patched within defined SLAs?", description: "Netzwerk-Patches brauchen Wartungsfenster, müssen aber dennoch SLA-konform laufen.", descriptionEn: "Network patches need maintenance windows but must still meet SLAs." },
    anwendungen: { question: "Werden Anwendungs-Komponenten (inkl. Drittbibliotheken/SBOM) auf CVEs geprüft und Updates priorisiert eingespielt?", questionEn: "Are application components (incl. third-party libs/SBOM) checked for CVEs and updates prioritised?", description: "Log4Shell hat gezeigt: SBOM ist Voraussetzung für schnelle Reaktion.", descriptionEn: "Log4Shell proved SBOM is required for rapid response." },
    informationen: { question: "Wird das Datenhaltungs-System (DBMS, Storage-OS) gegen CVEs gepatcht?", questionEn: "Is the data-store platform (DBMS, storage OS) patched against CVEs?", description: "Datenbanken bleiben oft Versionen zurück — gezielte Patch-Strategie nötig.", descriptionEn: "Databases often lag versions — a targeted patch strategy is needed." },
    ics_ot: { question: "Werden OT-Komponenten gegen herstellerspezifische Advisories abgeglichen und Patches im Wartungsfenster eingespielt?", questionEn: "Are OT components matched against vendor advisories and patches applied in maintenance windows?", description: "OT-Patches sind hersteller-getrieben und nicht beliebig planbar.", descriptionEn: "OT patches are vendor-driven and cannot be scheduled arbitrarily." },
  },
  "e-07": {
    it_systeme: { question: "Werden OS-Patches für Server und Endgeräte automatisiert verteilt (WSUS, Intune, Patchmanager) und Status zentral überwacht?", questionEn: "Are OS patches for servers and endpoints distributed automatically (WSUS, Intune, patch manager) with status centrally monitored?", description: "Manuelle Patch-Runden skalieren nicht ab ~50 Hosts.", descriptionEn: "Manual patch rounds do not scale beyond ~50 hosts." },
    informationen: { question: "Wird das OS unter dem Datenbestand (DB-Server, Storage-Appliance) regelmäßig gepatcht?", questionEn: "Is the OS underlying the data store (DB server, storage appliance) regularly patched?", description: "DBMS-Patches dürfen nicht hinter OS-Patches zurückbleiben.", descriptionEn: "DBMS patches must not lag OS patches." },
    anwendungen: { question: "Wird das OS der Anwendungs-Hosts (VM, Container-Base-Image) regelmäßig auf aktuellem Patch-Stand gehalten?", questionEn: "Is the OS of application hosts (VM, container base image) kept on current patch level?", description: "Container-Base-Images müssen mind. monatlich rebuildet werden.", descriptionEn: "Container base images must be rebuilt at least monthly." },
  },
  "e-08": {
    anwendungen: { question: "Werden Anwendungs-Updates (Frameworks, Libs, Hotfixes) automatisiert in CI/CD verteilt und Rollback geprüft?", questionEn: "Are application updates (frameworks, libs, hotfixes) automated through CI/CD with rollback tested?", description: "Lib-Updates ohne CI-Tests führen zu Production-Outages.", descriptionEn: "Lib updates without CI tests cause production outages." },
    it_systeme: { question: "Werden System-Anwendungen (Office, Browser, Reader, Drittsoftware) zentral aktualisiert?", questionEn: "Are system applications (office, browser, reader, third-party software) updated centrally?", description: "Drittsoftware ohne Patch-Mgmt ist primäres Phishing-Ziel.", descriptionEn: "Third-party software without patch mgmt is a prime phishing target." },
  },
  "e-09": {
    it_systeme: { question: "Werden Server und Endgeräte mind. wöchentlich intern und monatlich extern gescannt?", questionEn: "Are servers and endpoints scanned at least weekly internally and monthly externally?", description: "Scan-Frequenz pro Risikoklasse: kritisch wöchentlich, Standard monatlich.", descriptionEn: "Scan frequency per risk class: critical weekly, standard monthly." },
    netze: { question: "Werden Netzwerkkomponenten regelmäßig auf CVEs/Konfigurationsschwächen gescannt?", questionEn: "Are network components scanned regularly for CVEs/config weaknesses?", description: "Spezialisierte Tools (z. B. Nipper, Tenable) gehen über generische Scanner hinaus.", descriptionEn: "Specialised tools (e.g. Nipper, Tenable) go beyond generic scanners." },
    anwendungen: { question: "Wird die Anwendung mit DAST und Auth-DAST regelmäßig gescannt?", questionEn: "Is the application regularly scanned via DAST and authenticated DAST?", description: "Auth-DAST findet Lücken hinter Login, die Standard-DAST verpasst.", descriptionEn: "Authenticated DAST finds gaps behind login that standard DAST misses." },
  },
  "e-10": {
    it_systeme: { question: "Werden Findings nach CVSS/EPSS priorisiert und SLAs (z. B. kritisch <14 Tage) eingehalten und gemessen?", questionEn: "Are findings prioritised by CVSS/EPSS with SLAs (e.g. critical <14 days) enforced and measured?", description: "EPSS verbessert Priorisierung gegenüber reinem CVSS deutlich.", descriptionEn: "EPSS notably improves prioritisation versus pure CVSS." },
    netze: { question: "Werden Netz-Findings priorisiert und SLA-konform behoben (Notfall-Patch-Fenster vorhanden)?", questionEn: "Are network findings prioritised and remediated per SLA (emergency patch windows available)?", description: "Notfall-Patch-Fenster gehören vorab freigegeben, nicht ad-hoc verhandelt.", descriptionEn: "Emergency patch windows must be pre-approved, not ad-hoc." },
    anwendungen: { question: "Werden App-Findings priorisiert und in den Sprint/Release-Plan aufgenommen?", questionEn: "Are app findings prioritised and added to sprint/release planning?", description: "App-Sec-Tickets müssen wie Bugs behandelt werden, nicht als Feature-Wunsch.", descriptionEn: "App-sec tickets must be treated like bugs, not feature requests." },
  },
  "a-11": {
    anwendungen: { question: "Werden öffentlich erreichbare Anwendungen mind. jährlich durch externe Pen-Tester geprüft?", questionEn: "Are publicly reachable applications pen-tested by external testers at least annually?", description: "Bei Major-Releases zusätzlich pen-testen.", descriptionEn: "Pen test additionally on major releases." },
    it_systeme: { question: "Werden extern exponierte Server (Web, Mail, VPN) im Pen-Test-Scope berücksichtigt?", questionEn: "Are externally exposed servers (web, mail, VPN) included in pen-test scope?", description: "Externe Pen-Tests testen die tatsächliche Angriffsfläche aus dem Internet.", descriptionEn: "External pen tests probe the real attack surface from the internet." },
    netze: { question: "Werden Perimeter-Komponenten (FW, VPN, WAF) im externen Pen-Test berücksichtigt?", questionEn: "Are perimeter components (FW, VPN, WAF) included in external pen tests?", description: "Falsch konfigurierte WAFs maskieren App-Lücken nur scheinbar.", descriptionEn: "Misconfigured WAFs only seemingly mask app gaps." },
  },
  "e-19": {
    it_systeme: { question: "Existiert ein Prozess, der Hersteller-Advisories (z. B. MS Patch Tuesday, RHSA) automatisch in das Patch-Management überführt?", questionEn: "Is there a process that automatically funnels vendor advisories (e.g. MS Patch Tuesday, RHSA) into patch management?", description: "Manuelle Advisory-Sichtung übersieht zwangsläufig Einzelfälle.", descriptionEn: "Manual advisory review inevitably misses individual cases." },
    netze: { question: "Werden Hersteller-Advisories für Netzwerkkomponenten (z. B. Cisco PSIRT) abonniert und in Patch-Tickets übersetzt?", questionEn: "Are vendor advisories for network gear (e.g. Cisco PSIRT) subscribed and translated into patch tickets?", description: "Netzwerk-Advisories haben oft eigene Kanäle, nicht nur generische CVE-Feeds.", descriptionEn: "Network advisories often use dedicated channels, not just generic CVE feeds." },
    anwendungen: { question: "Werden Advisories der eingesetzten Frameworks/Libs (GitHub Security Advisories, npm audit) automatisch ins Backlog überführt?", questionEn: "Are advisories of used frameworks/libs (GitHub Security Advisories, npm audit) automatically funnelled into the backlog?", description: "Dependabot/Renovate verzahnt Advisory-Strom mit dem Repo.", descriptionEn: "Dependabot/Renovate links the advisory stream with the repo." },
  },
  "a-05": {
    netze: { question: "Werden unautorisierte Geräte am Switchport (NAC-Profil-Mismatch) automatisch erkannt und blockiert?", questionEn: "Are unauthorised devices on switch ports (NAC profile mismatch) detected and blocked automatically?", description: "NAC ohne Quarantäne-VLAN ist nur Inventarisierung.", descriptionEn: "NAC without a quarantine VLAN is just inventory." },
    it_systeme: { question: "Werden im Netzwerk neu auftauchende Server/Endgeräte mit dem CMDB-Inventar abgeglichen?", questionEn: "Are newly appearing servers/endpoints reconciled against the CMDB inventory?", description: "Discovery-Reconciliation findet Schatten-IT in der Praxis.", descriptionEn: "Discovery reconciliation finds shadow IT in practice." },
  },
  "a-06": {
    it_systeme: { question: "Wird sichergestellt, dass keine End-of-Life-Software (Windows 7/Server 2012, alte DBs) produktiv im Einsatz ist?", questionEn: "Is it ensured that no end-of-life software (Windows 7/Server 2012, legacy DBs) runs in production?", description: "EoL-Software ist permanenter Hochrisiko-Befund.", descriptionEn: "EoL software is a permanent high-risk finding." },
  },
  "tech-05": {
    it_systeme: { question: "Ist eine zentral gemanagte Anti-Malware-/EDR-Lösung auf allen Servern und Endgeräten aktiv und aktuell?", questionEn: "Is a centrally managed anti-malware/EDR solution active and current on all servers and endpoints?", description: "Lokale AV ohne zentrales Management ist nicht NIS2-tauglich.", descriptionEn: "Local AV without central management is not NIS2-grade." },
    anwendungen: { question: "Werden Anwendungs-Workloads (Container, Functions) mit Runtime-Threat-Detection (CWPP/RASP) überwacht?", questionEn: "Are application workloads (containers, functions) monitored with runtime threat detection (CWPP/RASP)?", description: "Klassische AV passt nicht zu Container/Functions — CWPP übernimmt diese Rolle.", descriptionEn: "Classic AV does not fit containers/functions — CWPP takes that role." },
  },
  "tech-06": {
    it_systeme: { question: "Werden Endgeräte vor dem Aufruf bösartiger URLs durch Web-Filter / Browser-Isolation / DNS-Filter geschützt?", questionEn: "Are endpoints protected from malicious URL access via web filtering / browser isolation / DNS filtering?", description: "Phishing-Klick wird abgefangen, bevor Payload geladen wird.", descriptionEn: "Phishing clicks are intercepted before payload load." },
    netze: { question: "Werden ausgehende Web-Verbindungen über ein zentrales Secure-Web-Gateway gegen URL-Kategorien geprüft?", questionEn: "Is outbound web traffic inspected via a central secure web gateway against URL categories?", description: "Egress-Filter wirken auch wenn Endpoint-Filter umgangen wird.", descriptionEn: "Egress filters work even when endpoint filters are bypassed." },
  },

  // ─── Secure Development ────────────────────────────────────────
  "e-14": {
    anwendungen: { question: "Existiert ein dokumentierter Secure-SDLC-Prozess (Threat-Modeling, Security-Reviews, Secure-Coding) für eigene Anwendungen?", questionEn: "Is a documented Secure SDLC (threat modelling, security reviews, secure coding) in place for in-house apps?", description: "SDLC ohne Threat-Modeling übersieht Architekturschwächen früh.", descriptionEn: "SDLC without threat modelling misses architecture weaknesses early." },
  },
  "e-16": {
    anwendungen: { question: "Sind Entwicklungs-, Test- und Produktivumgebungen der Anwendung strikt getrennt (Daten, Credentials, Netz)?", questionEn: "Are development, test, and production environments strictly separated (data, credentials, network)?", description: "Echte Produktionsdaten in DEV ist klassischer DSGVO-/NIS2-Befund.", descriptionEn: "Real production data in DEV is a classic GDPR/NIS2 finding." },
    it_systeme: { question: "Sind die Hosts der Umgebungsstufen (DEV/TEST/PROD) auch netz- und identitätsseitig getrennt?", questionEn: "Are hosts of the environment tiers (DEV/TEST/PROD) also separated by network and identity?", description: "Geteilte Admin-Konten DEV↔PROD entwerten die Trennung.", descriptionEn: "Shared admin accounts DEV↔PROD invalidate the separation." },
  },
  "e-17": {
    anwendungen: { question: "Ist die Anwendung mit einer WAF (managed Ruleset, OWASP-Top-10, Bot-Mgmt, Rate-Limit) abgesichert?", questionEn: "Is the application protected with a WAF (managed ruleset, OWASP Top-10, bot mgmt, rate limit)?", description: "WAF im 'Detect-Only' wirkt nicht — Blocking-Mode mit Tuning ist nötig.", descriptionEn: "WAF in detect-only does not protect — blocking mode with tuning is required." },
  },
  "e-18": {
    anwendungen: { question: "Sind Sicherheitsanforderungen Pflicht-Auswahlkriterium bei Beschaffung neuer Anwendungen (Auditberichte, Pen-Test, SBOM)?", questionEn: "Are security requirements a mandatory selection criterion when procuring new applications (audit reports, pen test, SBOM)?", description: "Sicherheit als Nachgedanke bei Beschaffung führt zu unhaltbaren Lieferantenrisiken.", descriptionEn: "Security as a procurement afterthought yields untenable supplier risks." },
    it_systeme: { question: "Sind Sicherheitsanforderungen Pflicht-Auswahlkriterium bei Beschaffung neuer IT-Systeme/Hardware?", questionEn: "Are security requirements a mandatory selection criterion when procuring new IT systems/hardware?", description: "Hardware mit fehlendem Lifecycle-Support darf gar nicht erst beschafft werden.", descriptionEn: "Hardware without lifecycle support must not be procured at all." },
  },
  "e-15": {
    anwendungen: { question: "Werden vor Major-Releases der Anwendung externe und interne Pen-Tests durchgeführt und Findings vor Go-Live behoben?", questionEn: "Are external and internal pen tests performed before major application releases with findings remediated pre-go-live?", description: "Go-Live mit offenen High-Findings ist riskante Praxis.", descriptionEn: "Going live with open high findings is risky practice." },
    it_systeme: { question: "Werden Pen-Tests auch auf System-Ebene (interne Lateral-Movement-Tests, Red-Team) durchgeführt?", questionEn: "Are pen tests also conducted at system level (internal lateral-movement tests, red team)?", description: "Externer Pen-Test allein lässt interne Eskalationspfade ungetestet.", descriptionEn: "External pen tests alone leave internal escalation paths untested." },
  },
  "tech-07": {
    anwendungen: { question: "Werden verbindliche Secure-Coding-Richtlinien (OWASP Top 10, OWASP ASVS) in Code-Reviews durchgesetzt?", questionEn: "Are mandatory secure-coding guidelines (OWASP Top 10, OWASP ASVS) enforced in code reviews?", description: "Guidelines ohne Review-Erzwingung sind reine Dokumentation.", descriptionEn: "Guidelines without review enforcement are mere documentation." },
  },
  "tech-08": {
    anwendungen: { question: "Sind SAST, DAST und SCA in die CI/CD-Pipeline integriert und blockieren Releases bei kritischen Findings?", questionEn: "Are SAST, DAST, and SCA integrated into CI/CD, blocking releases on critical findings?", description: "Security-Tests, die Releases nicht blocken können, werden ignoriert.", descriptionEn: "Security tests that cannot block releases get ignored." },
  },
  "tech-09": {
    anwendungen: { question: "Werden ausgelagerte Entwicklungsprojekte vertraglich auf Secure-SDLC, SBOM und Penetration-Tests verpflichtet?", questionEn: "Are outsourced dev projects contractually committed to Secure SDLC, SBOM, and penetration tests?", description: "Auslagerung verlagert Risiko, nicht Verantwortung.", descriptionEn: "Outsourcing shifts risk, not responsibility." },
  },
  "tech-10": {
    anwendungen: { question: "Werden Testdaten in Nicht-Produktivumgebungen anonymisiert/pseudonymisiert und Zugriffe protokolliert?", questionEn: "Is test data in non-production environments anonymised/pseudonymised and access logged?", description: "Klartext-Produktivdaten in DEV/TEST sind GDPR-/NIS2-Befund.", descriptionEn: "Cleartext production data in DEV/TEST is a GDPR/NIS2 finding." },
  },

  // ─── Monitoring & Logging ──────────────────────────────────────
  "a-10": {
    it_systeme: { question: "Werden System-Logs (OS, Auth, Sudo) zentral gesammelt, mit definierter Retention aufbewahrt und SIEM-korreliert?", questionEn: "Are system logs (OS, auth, sudo) centrally collected, retained per policy, and SIEM-correlated?", description: "Lokale Logs werden bei Vorfall vom Angreifer zuerst gelöscht.", descriptionEn: "Local logs are wiped first by attackers during incidents." },
    nutzende: { question: "Werden Identity-/Auth-Events (Logins, MFA, Privilege-Use) zentral protokolliert?", questionEn: "Are identity/auth events (logins, MFA, privilege use) centrally logged?", description: "Identity-Logs sind Grundlage für Account-Compromise-Detection.", descriptionEn: "Identity logs underpin account-compromise detection." },
    anwendungen: { question: "Sammelt die Anwendung Audit-Logs (User-Aktionen, Datenzugriff, Admin-Eingriffe) zentral mit definierter Aufbewahrung?", questionEn: "Does the application centrally collect audit logs (user actions, data access, admin actions) with defined retention?", description: "App-Audit-Log ist häufig forensisch wertvoller als reine OS-Logs.", descriptionEn: "App audit logs are often forensically more valuable than OS logs alone." },
    informationen: { question: "Werden Datenzugriffe auf den schutzbedürftigen Datenbestand protokolliert (DB-Audit, File-Audit)?", questionEn: "Are data accesses to the protected data store logged (DB audit, file audit)?", description: "DB-Audit zeigt Insider-Threats, die App-Logs verbergen können.", descriptionEn: "DB audit reveals insider threats that app logs may hide." },
  },
  "b-10": {
    it_systeme: { question: "Werden Logs der Server/Endgeräte in einem SIEM korreliert und nach Use-Cases (z. B. MITRE ATT&CK) ausgewertet?", questionEn: "Are server/endpoint logs correlated in a SIEM and analysed via use cases (e.g. MITRE ATT&CK)?", description: "SIEM ohne Use-Case-Bibliothek ist nur Log-Lager.", descriptionEn: "A SIEM without a use-case library is just a log lake." },
    anwendungen: { question: "Werden App-Logs (Auth, API-Calls, WAF-Events) im SIEM mit Korrelations-Regeln ausgewertet?", questionEn: "Are app logs (auth, API calls, WAF events) analysed in the SIEM with correlation rules?", description: "App-Brute-Force fällt nur in Korrelation auf, nicht in einzelnen Logs.", descriptionEn: "App brute force only surfaces in correlation, not in individual logs." },
  },
  "j-08": {
    anwendungen: { question: "Werden regelmäßig Audits der Anwendungs-Kommunikation (genutzte Protokolle, externe Endpunkte) durchgeführt?", questionEn: "Are regular audits of application communications (protocols used, external endpoints) performed?", description: "Schatten-Integrationen entstehen, wenn Kommunikationsmuster nicht überprüft werden.", descriptionEn: "Shadow integrations grow when communication patterns are not reviewed." },
  },
  "tech-11": {
    it_systeme: { question: "Werden Server und Endgeräte auf anomales Verhalten (UEBA, Process-Anomalien) überwacht?", questionEn: "Are servers and endpoints monitored for anomalous behaviour (UEBA, process anomalies)?", description: "Signaturbasierte Detection allein verpasst Living-off-the-Land-Techniken.", descriptionEn: "Signature-based detection alone misses living-off-the-land techniques." },
    netze: { question: "Wird Netzverkehr auf Anomalien (Beaconing, Lateral-Movement-Muster) überwacht (NDR/Flow-Analyse)?", questionEn: "Is network traffic monitored for anomalies (beaconing, lateral-movement patterns) via NDR/flow analysis?", description: "NDR sieht Angreifer auch ohne Endpoint-Sichtbarkeit.", descriptionEn: "NDR sees attackers even without endpoint visibility." },
    anwendungen: { question: "Werden Anwendungs-Metriken auf Anomalien (Auth-Spikes, abnorme Datenmengen) überwacht?", questionEn: "Are application metrics monitored for anomalies (auth spikes, abnormal data volumes)?", description: "Anomalie-Erkennung auf App-Ebene findet Datendiebstahl, den Logs verbergen.", descriptionEn: "App-level anomaly detection finds data theft that logs may hide." },
    ics_ot: { question: "Werden OT-Netzsegmente passiv (TAP/SPAN) auf untypische Protokolle/Verbindungen überwacht?", questionEn: "Are OT network segments monitored passively (TAP/SPAN) for atypical protocols/connections?", description: "Passive OT-NDR liefert Sichtbarkeit ohne Eingriff in Steuerprozesse.", descriptionEn: "Passive OT-NDR provides visibility without interfering with control processes." },
  },
  "tech-12": {
    it_systeme: { question: "Werden alle System-Uhren mit einer authentifizierten Zeitquelle (NTP/Authenticated NTS) synchronisiert?", questionEn: "Are all system clocks synced to an authenticated time source (NTP/Authenticated NTS)?", description: "Falsche Uhrzeit zerstört Forensik und MFA-Token-Validierung.", descriptionEn: "Wrong time wrecks forensics and MFA token validation." },
    netze: { question: "Sind Netzwerkkomponenten zeitsynchron mit dem zentralen NTP-Pool und ist NTP-Quelle gehärtet?", questionEn: "Are network components time-synced to the central NTP pool with the NTP source hardened?", description: "Switch-Logs ohne NTP sind im SIEM nicht korrelierbar.", descriptionEn: "Switch logs without NTP cannot be correlated in the SIEM." },
    anwendungen: { question: "Verwendet die Anwendung serverseitig synchronisierte Zeit für Logs, Tokens und Zertifikatsprüfung?", questionEn: "Does the application use server-synced time for logs, tokens, and certificate validation?", description: "Token-Replay-Schutz hängt an exakter Server-Zeit.", descriptionEn: "Token replay protection depends on exact server time." },
  },
  "tech-13": {
    it_systeme: { question: "Wird die Auslastung (CPU, RAM, Storage, IOPS) der Server überwacht und Kapazitätsplanung daraus abgeleitet?", questionEn: "Is server utilisation (CPU, RAM, storage, IOPS) monitored with capacity planning derived from it?", description: "Kapazitäts-Engpass = Verfügbarkeitsvorfall = NIS2-relevant.", descriptionEn: "Capacity bottleneck = availability incident = NIS2-relevant." },
    anwendungen: { question: "Werden App-Performance-Indikatoren (Latenz, Error-Rate, Throughput) überwacht und Skalierung darauf reagiert?", questionEn: "Are app performance indicators (latency, error rate, throughput) monitored with scaling triggered accordingly?", description: "APM ohne Auto-Scaling ist nur Diagnose, keine Reaktion.", descriptionEn: "APM without auto-scaling is only diagnosis, not response." },
    informationen: { question: "Wird die Wachstumsrate des Datenbestands überwacht und Storage-Kapazität proaktiv geplant?", questionEn: "Is data store growth monitored and storage capacity planned proactively?", description: "'Disk full' ist häufiger Auslöser für Datenkorruption.", descriptionEn: "'Disk full' is a frequent cause of data corruption." },
  },

  // ─── Backup & Recovery ─────────────────────────────────────────
  "c-01": {
    it_systeme: { question: "Existiert ein dokumentierter Backup-Prozess für alle Server-Workloads (Umfang, Frequenz, Retention, RPO/RTO)?", questionEn: "Is there a documented backup process for all server workloads (scope, frequency, retention, RPO/RTO)?", description: "Backup ohne dokumentierte Wiederherstellungsziele ist nicht testbar.", descriptionEn: "Backup without documented recovery objectives cannot be tested." },
    informationen: { question: "Werden Datenbestände nach klassifiziertem RPO (Datenverlust-Toleranz) gesichert?", questionEn: "Are data stores backed up per classified RPO (data-loss tolerance)?", description: "RPO muss mit Geschäftsanforderung übereinstimmen, nicht mit Technik-Default.", descriptionEn: "RPO must align with business requirements, not tech defaults." },
    anwendungen: { question: "Sind Backups der Anwendung (Datenbank, Konfiguration, Secrets) konsistent (App-aware) und in Runbooks dokumentiert?", questionEn: "Are application backups (database, configuration, secrets) consistent (app-aware) and documented in runbooks?", description: "Crash-konsistente Backups ohne App-Awareness sind oft unwiederherstellbar.", descriptionEn: "Crash-consistent backups without app awareness are often unrecoverable." },
  },
  "c-02": {
    it_systeme: { question: "Werden alle kritischen Server automatisiert nach Plan gesichert und Erfolgsstatus zentral überwacht?", questionEn: "Are all critical servers backed up automatically per schedule with success status centrally monitored?", description: "Stille Backup-Failures sind häufiger als gedacht.", descriptionEn: "Silent backup failures occur more often than expected." },
    informationen: { question: "Werden alle kritischen Datenbestände automatisiert mit definierter Frequenz gesichert?", questionEn: "Are all critical data stores backed up automatically with defined frequency?", description: "DB-Logs/Transaktions-Backups ergänzen Snapshots.", descriptionEn: "DB log/transaction backups complement snapshots." },
    anwendungen: { question: "Werden Anwendungsdaten und -konfiguration konsistent gesichert (App-Quiesce/Snapshot)?", questionEn: "Are application data and configuration backed up consistently (app quiesce/snapshot)?", description: "Backup ohne App-Quiesce produziert beschädigte DB-Dumps.", descriptionEn: "Backup without app quiesce yields corrupt DB dumps." },
  },
  "c-03": {
    it_systeme: { question: "Sind Backups verschlüsselt, in einem getrennten Tier und gegen Manipulation (Immutable/WORM) geschützt?", questionEn: "Are backups encrypted, in a separated tier, and protected against tampering (immutable/WORM)?", description: "Ransomware zielt zuerst auf Backups — Immutable Storage ist Pflicht.", descriptionEn: "Ransomware targets backups first — immutable storage is mandatory." },
    informationen: { question: "Sind Backups des Datenbestands verschlüsselt und Schlüssel getrennt vom Backup verwahrt?", questionEn: "Are data store backups encrypted with keys held separately from the backup?", description: "Schlüssel im Backup-System sind kein 'getrennter Schlüssel'.", descriptionEn: "Keys inside the backup system are not 'separated keys'." },
    anwendungen: { question: "Sind Anwendungs-Backups verschlüsselt und Zugriff darauf streng beschränkt (Backup-Operator-Tier)?", questionEn: "Are application backups encrypted with access strictly limited (backup operator tier)?", description: "Backup-Konten gehören in das Tier-0-Modell.", descriptionEn: "Backup accounts belong in the Tier-0 model." },
  },
  "c-04": {
    it_systeme: { question: "Existiert eine zusätzliche Offline-/Air-Gapped-Kopie der Server-Backups, geschützt gegen Online-Kompromittierung?", questionEn: "Is there an additional offline/air-gapped copy of server backups, protected against online compromise?", description: "3-2-1-Regel: 3 Kopien, 2 Medien, 1 offline.", descriptionEn: "3-2-1 rule: 3 copies, 2 media, 1 offline." },
    informationen: { question: "Existiert eine Offline-Kopie kritischer Datenbestände (Tape, Immutable Object Lock)?", questionEn: "Is there an offline copy of critical data stores (tape, immutable object lock)?", description: "Object-Lock auf S3/Azure ist akzeptables Online-Äquivalent zu Tape.", descriptionEn: "Object lock on S3/Azure is an acceptable online equivalent to tape." },
    anwendungen: { question: "Existiert eine isolierte Kopie der Anwendungs-Backups für Ransomware-Recovery?", questionEn: "Is there an isolated copy of application backups for ransomware recovery?", description: "Backup-Kopien im selben Cloud-Konto bieten keine Isolation.", descriptionEn: "Backup copies in the same cloud account do not provide isolation." },
  },
  "c-05": {
    it_systeme: { question: "Werden Wiederherstellungstests pro System mind. jährlich durchgeführt und Ergebnisse dokumentiert?", questionEn: "Are recovery tests per system performed at least annually and results documented?", description: "Backup, der nie restored wurde, ist kein Backup.", descriptionEn: "A backup never restored is not a backup." },
    informationen: { question: "Werden Restore-Tests des Datenbestands mit Datenkonsistenz-Validierung durchgeführt?", questionEn: "Are data store restore tests performed with data consistency validation?", description: "Restore ohne Konsistenzprüfung übersieht stille Korruption.", descriptionEn: "Restore without consistency check misses silent corruption." },
    anwendungen: { question: "Werden vollständige Restore-Tests der Anwendung (DB+App+Config+Secrets) jährlich erprobt?", questionEn: "Are full application restore tests (DB+app+config+secrets) practised annually?", description: "Komponenten einzeln restorebar ≠ App lauffähig restorebar.", descriptionEn: "Individually restorable components ≠ a runnable restored app." },
  },

  // ─── Data Protection ───────────────────────────────────────────
  "tech-14": {
    it_systeme: { question: "Existiert eine Richtlinie zur sicheren Löschung von System-Datenträgern (Decommission, Cloud-Resource-Teardown)?", questionEn: "Is there a policy for secure deletion of system media (decommission, cloud resource teardown)?", description: "Verlassene Cloud-Volumes/Snapshots sind ein wachsendes Datenleck-Risiko.", descriptionEn: "Abandoned cloud volumes/snapshots are a growing data-leak risk." },
    informationen: { question: "Existieren dokumentierte Lösch-/Aufbewahrungsregeln je Datenklassifizierung mit technischer Erzwingung?", questionEn: "Are documented retention/deletion rules per data classification in place with technical enforcement?", description: "Aufbewahrungsregeln auf Papier ohne Lifecycle-Policy verfehlen DSGVO.", descriptionEn: "Retention rules on paper without lifecycle policy fail GDPR." },
    anwendungen: { question: "Bietet die Anwendung eine sichere Lösch-Funktion (cryptographic erase / lifecycle delete) konform zur Datenklassifizierung?", questionEn: "Does the application provide a secure delete function (cryptographic erase / lifecycle delete) per data classification?", description: "Soft-Delete allein erfüllt 'Recht auf Löschung' nicht.", descriptionEn: "Soft delete alone does not satisfy the 'right to erasure'." },
  },
  "tech-15": {
    informationen: { question: "Werden vertrauliche Daten in Test-/Reporting-Umgebungen maskiert oder pseudonymisiert?", questionEn: "Is confidential data masked or pseudonymised in test/reporting environments?", description: "Maskierung ist DSGVO-Pflicht für Tests mit echten Personenbezügen.", descriptionEn: "Masking is a GDPR requirement for tests with real personal data." },
    anwendungen: { question: "Bietet die Anwendung Daten-Masking je Rollen-Sicht (z. B. Maskierung von PAN, IBAN, PII)?", questionEn: "Does the application provide role-based data masking (e.g. masking PAN, IBAN, PII)?", description: "Role-based Masking reduziert Insider-Threat-Risiko.", descriptionEn: "Role-based masking reduces insider-threat risk." },
  },
  "tech-16": {
    it_systeme: { question: "Sind DLP-Regeln auf Endgeräten und Servern aktiv, die Abfluss klassifizierter Daten (USB, Cloud-Upload) erkennen/blockieren?", questionEn: "Are DLP rules active on endpoints and servers detecting/blocking exfiltration of classified data (USB, cloud upload)?", description: "Endpoint-DLP wirkt direkt am Punkt des Abflusses.", descriptionEn: "Endpoint DLP acts at the point of exfiltration." },
    anwendungen: { question: "Erkennt die Anwendung ungewöhnliche Datenexports (Massendownload, anomale Query-Pattern) und alarmiert/blockiert?", questionEn: "Does the application detect unusual data exports (mass download, anomalous query patterns) and alert/block?", description: "API-Mass-Download ist primärer Daten-Exfiltrationspfad.", descriptionEn: "API mass download is a primary data-exfiltration path." },
    informationen: { question: "Werden Massenexporte aus dem Datenbestand technisch limitiert und protokolliert?", questionEn: "Are mass exports from the data store technically limited and logged?", description: "Rate-Limit + Audit ergibt zumindest Detection, wenn Prävention fehlt.", descriptionEn: "Rate limit + audit yields detection where prevention is missing." },
  },
  "tech-17": {
    it_systeme: { question: "Sind Server-Verarbeitungskapazitäten redundant ausgelegt, um Lastspitzen ohne Ausfall zu bewältigen?", questionEn: "Are server processing capacities deployed redundantly to handle load spikes without outage?", description: "Kapazitätsreserve ≥ Spitzenlast inkl. Failover-Szenarien.", descriptionEn: "Capacity reserve ≥ peak load including failover scenarios." },
    informationen: { question: "Sind Datenhaltungs-Systeme (DB-Cluster, Storage) redundant ausgelegt, um Verfügbarkeit zu gewährleisten?", questionEn: "Are data-storage systems (DB cluster, storage) deployed redundantly to ensure availability?", description: "Cluster ohne georedundante Replikation schützt nur lokal.", descriptionEn: "Clusters without geo-redundant replication protect only locally." },
    anwendungen: { question: "Ist die Anwendung mit ausreichender Redundanz (Multi-Instance, Auto-Scaling) ausgelegt?", questionEn: "Is the application designed with sufficient redundancy (multi-instance, auto-scaling)?", description: "Single-Instance-Apps verletzen Verfügbarkeitsanforderungen kritischer Services.", descriptionEn: "Single-instance apps violate availability requirements of critical services." },
  },
  "tech-18": {
    it_systeme: { question: "Wird die Nutzung privilegierter Dienstprogramme (psexec, regedit, sc, debug) kontrolliert und vollständig protokolliert?", questionEn: "Is the use of privileged utilities (psexec, regedit, sc, debug) controlled and fully logged?", description: "Living-off-the-Land-Tools sind häufigster Eskalationspfad.", descriptionEn: "Living-off-the-land tools are the most common escalation path." },
    anwendungen: { question: "Sind privilegierte Wartungstools der Anwendung (DB-Konsole, Admin-CLI) zugriffsbeschränkt und Audit-loggend?", questionEn: "Are privileged maintenance tools of the application (DB console, admin CLI) access-restricted and audit-logged?", description: "DBA-Konsolen ohne Audit-Log sind Insider-Threat-Hotspots.", descriptionEn: "DBA consoles without audit logging are insider-threat hotspots." },
    informationen: { question: "Sind Tools zur Direktbearbeitung des Datenbestands (DB-Tools, Storage-CLI) reglementiert und protokolliert?", questionEn: "Are tools for direct data-store manipulation (DB tools, storage CLI) regulated and logged?", description: "Direkte DB-Manipulation umgeht App-Audit komplett.", descriptionEn: "Direct DB manipulation bypasses app audit completely." },
  },
  "tech-19": {
    it_systeme: { question: "Existiert ein Change-/Freigabeprozess für Software-Installationen auf Produktiv-Servern (signierte Pakete, Approval)?", questionEn: "Is there a change/approval process for software installs on production servers (signed packages, approval)?", description: "Ad-hoc Installs ohne Change sind häufiger Initialvektor.", descriptionEn: "Ad-hoc installs without change control are a frequent initial vector." },
    anwendungen: { question: "Werden Releases der Anwendung über versionierte signierte Artefakte und freigegebene Pipelines deployed?", questionEn: "Are application releases deployed via versioned signed artefacts and approved pipelines?", description: "Manuelle Prod-Deployments ohne Pipeline-Audit sind ein klassischer Befund.", descriptionEn: "Manual prod deployments without pipeline audit are a classic finding." },
  },
  "tech-20": {
    it_systeme: { question: "Werden Audit-/Scan-Aktivitäten so geplant, dass produktive Server nicht beeinträchtigt werden (Off-Peak, gedrosselte Scans)?", questionEn: "Are audit/scan activities planned so production servers are not affected (off-peak, throttled scans)?", description: "Aggressive Scans haben schon DBs offline gebracht.", descriptionEn: "Aggressive scans have taken databases offline." },
    informationen: { question: "Werden Audit-Queries gegen produktive Datenbestände ressourcenschonend durchgeführt (Read-Replica, Resource-Limits)?", questionEn: "Are audit queries against production data stores executed gently (read replica, resource limits)?", description: "Reporting auf Production-DB ohne Limits beeinträchtigt Live-Last.", descriptionEn: "Reporting on the production DB without limits hurts live load." },
    anwendungen: { question: "Werden Audit-Aktivitäten gegen die Anwendung im Produktivbetrieb risikoarm geplant (Read-Only-Endpoints, Maintenance-Window)?", questionEn: "Are audit activities against the application in production planned with low risk (read-only endpoints, maintenance window)?", description: "Pen-Tests gegen Prod brauchen Notfall-Rollback-Plan.", descriptionEn: "Pen tests against production require an emergency rollback plan." },
  },
};

/**
 * Apply an asset-class-specific variant to a control question, if one is
 * defined. Returns a new ControlQuestion object — the original is left
 * untouched so the same control can render differently per asset class.
 */
export function applyAssetVariant(
  control: ControlQuestion,
  assetClass: AssetClassId,
): ControlQuestion {
  const variant = controlAssetVariants[control.id]?.[assetClass];
  if (!variant) return control;
  return {
    ...control,
    question: variant.question,
    questionEn: variant.questionEn,
    description: variant.description,
    descriptionEn: variant.descriptionEn,
  };
}

/** Total number of (controlId, assetClass) override cells defined. */
export function countVariantCells(): number {
  let n = 0;
  for (const tbl of Object.values(controlAssetVariants)) {
    n += Object.keys(tbl).length;
  }
  return n;
}
