// Healthcare sector pack — validated HealthCore reference + ENISA hospital guidance.
import type { SectorPack } from "./types";

export const healthcarePack: SectorPack = {
  id: "healthcare-hospital-v1",
  sectorKey: "health",
  label_de: "Gesundheit / Krankenhaus",
  label_en: "Healthcare / Hospital",
  source_de: "Basiert auf validiertem HealthCore-Referenzmodell (Epic EHR, PACS, LIS, Personio, BMS) und ENISA-Krankenhaus-Leitfaden. Ausgangspunkt — bitte an konkrete Umgebung anpassen.",
  source_en: "Based on the validated HealthCore reference model (Epic EHR, PACS, LIS, Personio, BMS) and ENISA hospital sector guidance. Starting point — please adapt to your environment.",

  services: [
    {
      service_name: "EHR — Elektronische Patientenakte",
      category: "Business", criticality: 4,
      description: "Zentrales klinisches Informationssystem für Patientenakten, Verordnungen, Anamnese.",
      rto_hours: 4, rpo_hours: 1,
      assets: [
        { asset_name: "EHR-Anwendung (Epic)", asset_type: "Application", environment: "Production", vendor: "Epic Systems", data_sensitivity: "Highly Confidential", external_exposure: false, notes: "Kernanwendung — 24/7 Verfügbarkeit." },
        { asset_name: "EHR-Datenbank", asset_type: "Database", environment: "Production", vendor: "Oracle", data_sensitivity: "Highly Confidential", external_exposure: false, notes: "DSGVO Art. 9 Gesundheitsdaten." },
        { asset_name: "Identity-Gateway (AD/Entra ID)", asset_type: "Application", environment: "Production", vendor: "Microsoft", data_sensitivity: "Confidential", external_exposure: false },
        { asset_name: "HL7 / Integration-Engine", asset_type: "Application", environment: "Production", vendor: "Mirth/Rhapsody", data_sensitivity: "Highly Confidential", external_exposure: false },
      ],
    },
    {
      service_name: "PACS — Bildarchivierung",
      category: "Business", criticality: 4,
      description: "DICOM-basierte Bildarchivierung (Röntgen, CT, MRT).",
      rto_hours: 8, rpo_hours: 4,
      assets: [
        { asset_name: "PACS-Server", asset_type: "Server", environment: "Production", data_sensitivity: "Highly Confidential", external_exposure: false },
        { asset_name: "DICOM-Storage", asset_type: "Data", environment: "Production", data_sensitivity: "Highly Confidential", external_exposure: false, notes: "Aufbewahrung 10-30 Jahre." },
        { asset_name: "PACS-Viewer", asset_type: "Application", environment: "Production", data_sensitivity: "Confidential", external_exposure: false },
        { asset_name: "Modality-Gateway", asset_type: "Network", environment: "Production", data_sensitivity: "Confidential", external_exposure: false, notes: "Kopplung zu CT/MRT/Röntgen." },
      ],
    },
    {
      service_name: "LIS — Laborinformationssystem",
      category: "Business", criticality: 4,
      description: "Laboraufträge, Analyseergebnisse, Befundkommunikation.",
      rto_hours: 8, rpo_hours: 2,
      assets: [
        { asset_name: "LIS-Anwendung", asset_type: "Application", environment: "Production", data_sensitivity: "Highly Confidential", external_exposure: false },
        { asset_name: "LIS-Datenbank", asset_type: "Database", environment: "Production", data_sensitivity: "Highly Confidential", external_exposure: false },
        { asset_name: "Analyzer-Interface (HL7)", asset_type: "Network", environment: "Production", data_sensitivity: "Confidential", external_exposure: false },
      ],
    },
    {
      service_name: "Klinische Arbeitsplätze",
      category: "Support", criticality: 3,
      description: "Endgeräte am Krankenbett, Stationszimmer, Visite.",
      assets: [
        { asset_name: "Workstations Stationen", asset_type: "Endpoint", environment: "Production", data_sensitivity: "Confidential", external_exposure: false, instance_count: 120, notes: "Gruppen-Asset." },
        { asset_name: "Mobile Visite-Tablets", asset_type: "Endpoint", environment: "Production", data_sensitivity: "Confidential", external_exposure: false, instance_count: 30, notes: "MDM-verwaltet." },
      ],
    },
    {
      service_name: "HR / Personalwesen",
      category: "Support", criticality: 2,
      description: "Personalverwaltung, Dienstplanung, Lohn.",
      assets: [
        { asset_name: "Personio (HR-SaaS)", asset_type: "SaaS", environment: "Production", vendor: "Personio SE", data_sensitivity: "Confidential", external_exposure: true, notes: "AV nach DSGVO Art. 28." },
      ],
    },
    {
      service_name: "Gebäudeleittechnik (BMS/OT)",
      category: "Support", criticality: 3,
      description: "Gebäudeautomation, HLK, Zutrittskontrolle, kritische Stromversorgung.",
      assets: [
        { asset_name: "BMS-Server", asset_type: "Server", environment: "Production", data_sensitivity: "Normal", external_exposure: false },
        { asset_name: "HLK-Controller", asset_type: "Other", environment: "Production", data_sensitivity: "Normal", external_exposure: false, instance_count: 12 },
        { asset_name: "Zutrittskontrollsystem", asset_type: "Other", environment: "Production", data_sensitivity: "Confidential", external_exposure: false },
      ],
    },
    {
      service_name: "IT-Infrastruktur",
      category: "IT", criticality: 4,
      description: "Querschnittliche IT — Netzwerk und Backup, von allen Diensten gemeinsam genutzt.",
      assets: [
        { asset_name: "Netzwerk-Backbone", asset_type: "Network", environment: "Production", data_sensitivity: "Confidential", external_exposure: false, notes: "Zentrale Netzwerkkomponente." },
        { asset_name: "Backup-Server (intern)", asset_type: "Server", environment: "Production", data_sensitivity: "Highly Confidential", external_exposure: false },
      ],
    },
  ],

  dependencies: [
    { source_asset_name: "EHR-Anwendung (Epic)", target_asset_name: "EHR-Datenbank", description: "EHR-Anwendung liest und schreibt Patientendaten in der EHR-Datenbank." },
    { source_asset_name: "EHR-Anwendung (Epic)", target_asset_name: "Identity-Gateway (AD/Entra ID)", description: "EHR-Anmeldung nutzt das zentrale Identity-Gateway." },
    { source_asset_name: "HL7 / Integration-Engine", target_asset_name: "EHR-Datenbank", description: "Integrations-Engine verarbeitet klinische Nachrichten gegen die EHR-Datenbasis." },
    { source_asset_name: "PACS-Viewer", target_asset_name: "PACS-Server", description: "Viewer benötigt den PACS-Server für Bildabruf." },
    { source_asset_name: "PACS-Server", target_asset_name: "DICOM-Storage", description: "PACS-Server speichert und lädt Bilddaten aus dem DICOM-Storage." },
    { source_asset_name: "LIS-Anwendung", target_asset_name: "LIS-Datenbank", description: "Laboranwendung benötigt die LIS-Datenbank." },
    { source_asset_name: "Analyzer-Interface (HL7)", target_asset_name: "LIS-Anwendung", description: "Analyzer-Interface übergibt Laborwerte an die LIS-Anwendung." },
    { source_asset_name: "Workstations Stationen", target_asset_name: "EHR-Anwendung (Epic)", description: "Stationsarbeitsplätze nutzen die EHR-Anwendung." },
    { source_asset_name: "Mobile Visite-Tablets", target_asset_name: "EHR-Anwendung (Epic)", description: "Mobile Endgeräte greifen auf die EHR-Anwendung zu." },
  ],
};
