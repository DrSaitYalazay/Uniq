// OTOMATİK ÜRETİLDİ — kaynak: vorfall_meldeformulare.json (Komplettpaket 2026-07-04, v3).
// Vorfall-Meldeformulare: Assessment-Felder, Meldepflicht-Trigger, 7 Frameworks × Meldestufen.
// dauer_h = Fristdauer in Stunden (Spec 2.5); null = keine feste Frist (auf Ersuchen / Register). frist = Wortlaut mit Rechtsgrundlage.

export interface FormFeld { feld_id: string; label_de: string; typ: string; pflicht?: boolean; }
export interface MeldeStufe { stufe: string; label: string; frist: string; dauer_h: number | null; felder: FormFeld[]; }
export interface FrameworkFormular { delta_doc: string; empfaenger: string; rechtsgrundlage: string; vorbedingung?: string; stufen: MeldeStufe[]; }
export interface AssessmentFeld { feld_id: string; frage: string; typ: string; abhaengig_von?: string; hinweis?: string; }
export interface TriggerRegel { framework: string; bedingung: string; formulare: string; frist_start: string; }

export const VORFALL_ASSESSMENT_FELDER: AssessmentFeld[] = [
  {
    "feld_id": "personenbezug",
    "frage": "Sind personenbezogene Daten betroffen (Verletzung der Vertraulichkeit/Integrität/Verfügbarkeit)?",
    "typ": "ja/nein/unbekannt"
  },
  {
    "feld_id": "risiko_betroffene",
    "frage": "Risiko für Rechte und Freiheiten natürlicher Personen? (kein/normal/hoch)",
    "typ": "choice",
    "abhaengig_von": "personenbezug in (ja, unbekannt)"
  },
  {
    "feld_id": "erheblich_nis2",
    "frage": "Erheblicher Sicherheitsvorfall? (schwerwiegende Betriebsstörung / finanzielle Verluste / erheblicher Schaden für andere möglich)",
    "typ": "ja/nein/unbekannt"
  },
  {
    "feld_id": "dora_schwerwiegend",
    "frage": "Klassifizierung nach RTS (EU) 2024/1772: schwerwiegender IKT-Vorfall?",
    "typ": "ja/nein/unbekannt",
    "hinweis": "Kriterien-Assistent: Kunden/Gegenparteien, Dauer, Geografie, Datenverluste, Kritikalität, Kosten"
  },
  {
    "feld_id": "kritis_stoerung",
    "frage": "Störung mit (potenzieller) Auswirkung auf die kritische Dienstleistung?",
    "typ": "ja/nein/unbekannt"
  },
  {
    "feld_id": "dachg_vorfall",
    "frage": "Vorfall mit erheblicher Beeinträchtigung der kritischen Anlage (physisch)?",
    "typ": "ja/nein/unbekannt"
  },
  {
    "feld_id": "cra_produktvorfall",
    "frage": "Aktiv ausgenutzte Schwachstelle im eigenen Produkt ODER schwerwiegender Vorfall mit Auswirkung auf die Produktsicherheit?",
    "typ": "ja/nein/unbekannt",
    "auswahl_zweig": "schwachstelle/vorfall"
  },
  {
    "feld_id": "aiact_art73",
    "frage": "Schwerwiegender Vorfall i.S.v. Art. 73 AI Act im Zusammenhang mit einem Hochrisiko-KI-System (Tod, schwere Schädigung, Grundrechtsverletzung, kritische Infrastruktur)?",
    "typ": "ja/nein/unbekannt"
  }
];

export const VORFALL_TRIGGER_LOGIK = "Formular-Sets erscheinen nur, wenn (a) das Framework beim Mandanten AKTIV ist UND (b) die Trigger-Bedingung aus dem Assessment erfüllt ist. Unbekannt = wie 'ja' behandeln (Fristen laufen!), Assessment-Ergebnis mit Begründung in D83 dokumentieren (auch bei Nicht-Meldung).";

export const VORFALL_TRIGGER_REGELN: TriggerRegel[] = [
  {
    "framework": "NIS2",
    "bedingung": "erheblich_nis2 == ja",
    "formulare": "NIS2.stufen (24h/72h/1M)",
    "frist_start": "Kenntnis"
  },
  {
    "framework": "DORA",
    "bedingung": "dora_schwerwiegend == ja",
    "formulare": "DORA.stufen (4h/24h, 72h, 1M)",
    "frist_start": "Klassifizierung bzw. Kenntnis"
  },
  {
    "framework": "KRITIS",
    "bedingung": "kritis_stoerung == ja",
    "formulare": "KRITIS.stufen (24h/72h/1M, § 32 BSIG)",
    "frist_start": "Kenntnis"
  },
  {
    "framework": "GDPR",
    "bedingung": "personenbezug == ja → Registereintrag IMMER; zusätzlich Behörden-Meldung wenn risiko_betroffene != kein; Betroffenen-Info wenn risiko_betroffene == hoch",
    "formulare": "GDPR.stufen",
    "frist_start": "Bekanntwerden"
  },
  {
    "framework": "KRITIS_DACHG",
    "bedingung": "dachg_vorfall == ja",
    "formulare": "KRITIS_DACHG.stufen (24h/1M)",
    "frist_start": "Kenntnis"
  },
  {
    "framework": "CRA",
    "bedingung": "cra_produktvorfall == ja",
    "formulare": "CRA.stufen (24h/72h; Abschluss 14T bei Schwachstelle, 1M bei Vorfall)",
    "frist_start": "Kenntnis"
  },
  {
    "framework": "AIACT",
    "bedingung": "aiact_art73 == ja",
    "formulare": "AIACT.stufen (15/10/2 Tage)",
    "frist_start": "Kenntnis des Kausalzusammenhangs"
  }
];

export const VORFALL_FORMULARE: Record<string, FrameworkFormular> = {
  "NIS2": {
    "delta_doc": "D14",
    "empfaenger": "BSI (Melde- und Kontaktstelle, MUK-Portal)",
    "rechtsgrundlage": "NIS2 Art. 23 · BSIG (NIS2UmsuCG)",
    "stufen": [
      {
        "stufe": "fruehwarnung",
        "label": "Frühwarnung",
        "frist": "≤ 24 h ab Kenntnis des erheblichen Sicherheitsvorfalls",
        "felder": [
          {
            "feld_id": "vorfall_id",
            "label_de": "Vorfall-Referenz (aus D83)",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "einrichtung",
            "label_de": "Name & Registrierungs-/Kennnummer der Einrichtung",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "kontaktstelle",
            "label_de": "Kontaktstelle (Name, Funktion, Telefon, E-Mail, 24/7-Erreichbarkeit)",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "zeitpunkt_erkennung",
            "label_de": "Zeitpunkt der Erkennung",
            "typ": "datetime",
            "pflicht": true
          },
          {
            "feld_id": "zeitpunkt_eintritt",
            "label_de": "Zeitpunkt des Eintritts (sofern bekannt)",
            "typ": "datetime",
            "pflicht": false
          },
          {
            "feld_id": "verdacht_rechtswidrig",
            "label_de": "Verdacht auf rechtswidrige/böswillige Handlung? (ja/nein/unbekannt)",
            "typ": "choice",
            "pflicht": true
          },
          {
            "feld_id": "grenzueberschreitend",
            "label_de": "Mögliche grenzüberschreitende Auswirkungen? (ja/nein/unbekannt)",
            "typ": "choice",
            "pflicht": true
          },
          {
            "feld_id": "kurzbeschreibung",
            "label_de": "Kurzbeschreibung des Vorfalls",
            "typ": "textarea",
            "pflicht": true
          }
        ],
        "dauer_h": 24
      },
      {
        "stufe": "meldung",
        "label": "Meldung (Update der Frühwarnung)",
        "frist": "≤ 72 h ab Kenntnis",
        "felder": [
          {
            "feld_id": "erstbewertung",
            "label_de": "Erstbewertung: Schweregrad, Auswirkungen auf Dienste/Nutzer",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "iocs",
            "label_de": "Kompromittierungsindikatoren (IoCs), sofern verfügbar",
            "typ": "textarea",
            "pflicht": false
          },
          {
            "feld_id": "betroffene_dienste",
            "label_de": "Betroffene (kritische) Dienste und Nutzerzahlen",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "massnahmen",
            "label_de": "Ergriffene und geplante Abhilfemaßnahmen",
            "typ": "textarea",
            "pflicht": true
          }
        ],
        "dauer_h": 72
      },
      {
        "stufe": "zwischenbericht",
        "label": "Zwischenbericht",
        "frist": "auf Ersuchen des BSI",
        "felder": [
          {
            "feld_id": "statusupdate",
            "label_de": "Relevante Statusaktualisierungen",
            "typ": "textarea",
            "pflicht": true
          }
        ],
        "dauer_h": null
      },
      {
        "stufe": "abschlussbericht",
        "label": "Abschlussbericht",
        "frist": "≤ 1 Monat nach der 72h-Meldung (bei andauerndem Vorfall: ≤ 1 Monat nach Abschluss der Bearbeitung, zuvor Fortschrittsbericht)",
        "felder": [
          {
            "feld_id": "ausfuehrliche_beschreibung",
            "label_de": "Ausführliche Beschreibung inkl. Schweregrad und Auswirkungen",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "bedrohungsart",
            "label_de": "Art der Bedrohung / zugrunde liegende Ursache (Root Cause)",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "abhilfemassnahmen",
            "label_de": "Getroffene und laufende Abhilfemaßnahmen",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "grenz_auswirkungen",
            "label_de": "Ggf. grenzüberschreitende Auswirkungen",
            "typ": "textarea",
            "pflicht": false
          }
        ],
        "dauer_h": 792
      }
    ]
  },
  "DORA": {
    "delta_doc": "D48",
    "empfaenger": "Zuständige Behörde (DE: BaFin, MVP-Portal)",
    "rechtsgrundlage": "DORA Art. 19 · Del. VO (EU) 2025/301 (Fristen/Inhalte) · DVO (EU) 2025/302 (Vorlagen)",
    "vorbedingung": "Klassifizierung als schwerwiegender IKT-Vorfall nach RTS (EU) 2024/1772 (Kriterien: betroffene Kunden/Gegenparteien, Dauer, geografische Ausbreitung, Datenverluste, Kritikalität der Dienste, wirtschaftliche Auswirkungen)",
    "stufen": [
      {
        "stufe": "erstmeldung",
        "label": "Erstmeldung",
        "frist": "≤ 4 h nach Klassifizierung als schwerwiegend, spätestens ≤ 24 h ab Kenntnis",
        "felder": [
          {
            "feld_id": "vorfall_id",
            "label_de": "Vorfall-Referenz (aus D83)",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "einrichtung",
            "label_de": "Name & Registrierungs-/Kennnummer der Einrichtung",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "kontaktstelle",
            "label_de": "Kontaktstelle (Name, Funktion, Telefon, E-Mail, 24/7-Erreichbarkeit)",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "zeitpunkt_erkennung",
            "label_de": "Zeitpunkt der Erkennung",
            "typ": "datetime",
            "pflicht": true
          },
          {
            "feld_id": "zeitpunkt_eintritt",
            "label_de": "Zeitpunkt des Eintritts (sofern bekannt)",
            "typ": "datetime",
            "pflicht": false
          },
          {
            "feld_id": "klassifizierung",
            "label_de": "Klassifizierungsergebnis mit erfüllten Kriterien (RTS 2024/1772)",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "beschreibung",
            "label_de": "Beschreibung des Vorfalls und betroffener Funktionen/Dienste",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "reaktivierung_bcp",
            "label_de": "Business-Continuity-Plan aktiviert? (ja/nein)",
            "typ": "choice",
            "pflicht": true
          },
          {
            "feld_id": "andere_behoerden",
            "label_de": "Weitere informierte Behörden/CSIRTs",
            "typ": "text",
            "pflicht": false
          }
        ],
        "dauer_h": 24
      },
      {
        "stufe": "zwischenmeldung",
        "label": "Zwischenmeldung",
        "frist": "≤ 72 h nach Erstmeldung; zusätzlich bei Statusänderung/Wiederaufnahme des Regelbetriebs",
        "felder": [
          {
            "feld_id": "statusaenderung",
            "label_de": "Statusänderungen, aktualisierte Bewertung der Auswirkungen",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "kennzahlen",
            "label_de": "Kennzahlen: betroffene Kunden/Transaktionen (Anzahl/%), Dauer, Datenverluste",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "massnahmen",
            "label_de": "Ergriffene Wiederherstellungsmaßnahmen",
            "typ": "textarea",
            "pflicht": true
          }
        ],
        "dauer_h": 72
      },
      {
        "stufe": "abschlussmeldung",
        "label": "Abschlussmeldung",
        "frist": "≤ 1 Monat nach der (letzten aktualisierten) Zwischenmeldung",
        "felder": [
          {
            "feld_id": "root_cause",
            "label_de": "Grundursachenanalyse (Root Cause)",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "tatsaechliche_auswirkungen",
            "label_de": "Tatsächliche Auswirkungen inkl. wirtschaftlicher Schäden (direkt/indirekt)",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "abschluss_massnahmen",
            "label_de": "Abgeschlossene Maßnahmen und Lessons Learned (→ D49)",
            "typ": "textarea",
            "pflicht": true
          }
        ],
        "dauer_h": 792
      }
    ]
  },
  "KRITIS": {
    "delta_doc": "D58",
    "empfaenger": "BSI (Meldestelle, gemeinsames Melde-Portal)",
    "rechtsgrundlage": "§ 32 BSIG (ehem. § 8b Abs. 4) · NIS2 Art. 23",
    "stufen": [
      {
        "stufe": "stoerungsmeldung",
        "label": "Erstmeldung",
        "frist": "≤ 24 h ab Kenntnis des erheblichen Sicherheitsvorfalls (§ 32 BSIG)",
        "felder": [
          {
            "feld_id": "vorfall_id",
            "label_de": "Vorfall-Referenz (aus D83)",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "einrichtung",
            "label_de": "Name & Registrierungs-/Kennnummer der Einrichtung",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "kontaktstelle",
            "label_de": "Kontaktstelle (Name, Funktion, Telefon, E-Mail, 24/7-Erreichbarkeit)",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "zeitpunkt_erkennung",
            "label_de": "Zeitpunkt der Erkennung",
            "typ": "datetime",
            "pflicht": true
          },
          {
            "feld_id": "zeitpunkt_eintritt",
            "label_de": "Zeitpunkt des Eintritts (sofern bekannt)",
            "typ": "datetime",
            "pflicht": false
          },
          {
            "feld_id": "kritis_registrierung",
            "label_de": "KRITIS-Registrierungsnummer & Anlage (→ D57)",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "kritische_dienstleistung",
            "label_de": "Betroffene kritische Dienstleistung und Versorgungsgrad",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "art_stoerung",
            "label_de": "Art der Störung (Ausfall/Beeinträchtigung, tatsächlich/potenziell)",
            "typ": "choice",
            "pflicht": true
          },
          {
            "feld_id": "technische_details",
            "label_de": "Technische Rahmenbedingungen, vermutete/bekannte Ursache, betroffene Systeme",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "auswirkung_versorgung",
            "label_de": "Auswirkungen auf die Versorgung der Allgemeinheit",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "branche_uebergreifend",
            "label_de": "Auswirkungen auf andere Sektoren/Betreiber",
            "typ": "textarea",
            "pflicht": false
          }
        ],
        "dauer_h": 24
      },
      {
        "stufe": "folgemeldung",
        "label": "Folgemeldung",
        "frist": "≤ 72 h ab Kenntnis (Aktualisierung/Bewertung)",
        "felder": [
          {
            "feld_id": "update",
            "label_de": "Aktualisierung: Ursache, Behebung, Wiederanlauf, Lessons Learned",
            "typ": "textarea",
            "pflicht": true
          }
        ],
        "dauer_h": 72
      },
      {
        "stufe": "abschlussmeldung",
        "label": "Abschlussmeldung",
        "frist": "≤ 1 Monat",
        "felder": [
          {
            "feld_id": "abschluss",
            "label_de": "Abschlussbericht: Ursache, Behebung, Wiederanlauf, Lessons Learned",
            "typ": "textarea",
            "pflicht": true
          }
        ],
        "dauer_h": 792
      }
    ],
    "hinweis": "NIS2-Meldestufen (D14) gelten parallel; Doppelerfassung vermeiden — ein D83-Eintrag, beide Formularsätze."
  },
  "GDPR": {
    "delta_doc": "D24",
    "empfaenger": "Zuständige Datenschutz-Aufsichtsbehörde; ggf. betroffene Personen (Art. 34)",
    "rechtsgrundlage": "DSGVO Art. 33, 34",
    "stufen": [
      {
        "stufe": "meldung_behoerde",
        "label": "Meldung an die Aufsichtsbehörde",
        "frist": "≤ 72 h nach Bekanntwerden (bei Überschreitung: Begründung der Verzögerung); schrittweise Meldung zulässig (Art. 33 Abs. 4)",
        "felder": [
          {
            "feld_id": "vorfall_id",
            "label_de": "Vorfall-Referenz (aus D83)",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "einrichtung",
            "label_de": "Name des Verantwortlichen (und ggf. des Vertreters)",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "kontaktstelle",
            "label_de": "Anlaufstelle (DSB oder sonstige Kontaktstelle, Art. 33(3)(b))",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "zeitpunkt_erkennung",
            "label_de": "Zeitpunkt der Erkennung",
            "typ": "datetime",
            "pflicht": true
          },
          {
            "feld_id": "zeitpunkt_eintritt",
            "label_de": "Zeitpunkt des Eintritts (sofern bekannt)",
            "typ": "datetime",
            "pflicht": false
          },
          {
            "feld_id": "art_verletzung",
            "label_de": "Art der Verletzung (Vertraulichkeit/Integrität/Verfügbarkeit)",
            "typ": "choice",
            "pflicht": true
          },
          {
            "feld_id": "kategorien_betroffene",
            "label_de": "Kategorien und ungefähre Zahl der betroffenen Personen",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "kategorien_daten",
            "label_de": "Kategorien und ungefähre Zahl der betroffenen Datensätze",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "dsb_kontakt",
            "label_de": "Kontaktdaten des/der Datenschutzbeauftragten (→ D53)",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "folgen",
            "label_de": "Wahrscheinliche Folgen der Verletzung",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "massnahmen",
            "label_de": "Ergriffene/vorgeschlagene Maßnahmen zur Behebung und Abmilderung",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "verzoegerung_begruendung",
            "label_de": "Begründung bei Meldung nach 72 h",
            "typ": "textarea",
            "pflicht": false
          }
        ],
        "dauer_h": 72
      },
      {
        "stufe": "benachrichtigung_betroffene",
        "label": "Benachrichtigung der betroffenen Personen",
        "frist": "unverzüglich, wenn voraussichtlich hohes Risiko (Art. 34); entfällt bei wirksamer Verschlüsselung o. nachträglicher Risikobeseitigung",
        "felder": [
          {
            "feld_id": "klare_sprache",
            "label_de": "Beschreibung in klarer, einfacher Sprache",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "dsb_kontakt2",
            "label_de": "Kontakt DSB/Anlaufstelle",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "folgen2",
            "label_de": "Wahrscheinliche Folgen",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "massnahmen2",
            "label_de": "Ergriffene/empfohlene Maßnahmen (inkl. Selbstschutz)",
            "typ": "textarea",
            "pflicht": true
          }
        ],
        "dauer_h": 0
      },
      {
        "stufe": "registereintrag",
        "label": "Interner Registereintrag",
        "frist": "immer — auch wenn keine Meldepflicht (Art. 33 Abs. 5)",
        "felder": [
          {
            "feld_id": "fakten",
            "label_de": "Fakten, Auswirkungen, Abhilfemaßnahmen (→ D74)",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "nichtmeldung_begruendung",
            "label_de": "Begründung bei Nicht-Meldung",
            "typ": "textarea",
            "pflicht": false
          }
        ],
        "dauer_h": null
      }
    ]
  },
  "CRA": {
    "delta_doc": "D31",
    "empfaenger": "Koordinierendes CSIRT + ENISA (Single Reporting Platform)",
    "rechtsgrundlage": "CRA Art. 14 · anwendbar ab 11.09.2026",
    "vorbedingung": "Trigger cra_produktvorfall = ja; Zweig wählen: aktiv ausgenutzte Schwachstelle ODER schwerwiegender Vorfall",
    "stufen": [
      {
        "stufe": "fruehwarnung",
        "label": "Frühwarnung",
        "frist": "≤ 24 h ab Kenntnis",
        "felder": [
          {
            "feld_id": "produkt",
            "label_de": "Produkt (Name, Version, eindeutige Kennung)",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "art",
            "label_de": "Zweig: aktiv ausgenutzte Schwachstelle / schwerwiegender Vorfall",
            "typ": "choice",
            "pflicht": true
          },
          {
            "feld_id": "kurz",
            "label_de": "Kurzbeschreibung, ggf. betroffene Mitgliedstaaten",
            "typ": "textarea",
            "pflicht": true
          }
        ],
        "dauer_h": 24
      },
      {
        "stufe": "meldung",
        "label": "Meldung",
        "frist": "≤ 72 h ab Kenntnis",
        "felder": [
          {
            "feld_id": "details",
            "label_de": "Allgemeine Angaben, Art der Schwachstelle/des Vorfalls, Abhilfe-/Korrekturmaßnahmen",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "ioc",
            "label_de": "Indikatoren, Ausnutzungsstatus",
            "typ": "textarea",
            "pflicht": false
          }
        ],
        "dauer_h": 72
      },
      {
        "stufe": "abschluss",
        "label": "Abschlussbericht",
        "frist": "Schwachstelle: ≤ 14 Tage nach Verfügbarkeit einer Abhilfemaßnahme (Art. 14(2)); schwerwiegender Vorfall: ≤ 1 Monat (Art. 14(3))",
        "felder": [
          {
            "feld_id": "abschluss",
            "label_de": "Beschreibung, Schweregrad/Auswirkungen, Ursache, angewandte Abhilfemaßnahmen",
            "typ": "textarea",
            "pflicht": true
          }
        ],
        "dauer_h": 336
      }
    ]
  },
  "AIACT": {
    "delta_doc": "D29",
    "empfaenger": "Marktüberwachungsbehörde des Mitgliedstaats des Vorfalls",
    "rechtsgrundlage": "EU AI Act Art. 73",
    "vorbedingung": "Trigger aiact_art73 = ja (Anbieter; Betreiber melden an den Anbieter)",
    "stufen": [
      {
        "stufe": "meldung",
        "label": "Meldung schwerwiegender Vorfall",
        "frist": "≤ 15 Tage ab Kenntnis des Kausalzusammenhangs; Tod ≤ 10 Tage; weitverbreiteter Verstoß/kritische Infrastruktur ≤ 2 Tage",
        "felder": [
          {
            "feld_id": "ki_system",
            "label_de": "KI-System (EU-DB-Referenz D61)",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "vorfallart",
            "label_de": "Art des Vorfalls (Tod/Gesundheit, Grundrechte, kritische Infrastruktur, Sachschaden)",
            "typ": "choice",
            "pflicht": true
          },
          {
            "feld_id": "beschreibung",
            "label_de": "Beschreibung, Kausalzusammenhang, betroffene Personen",
            "typ": "textarea",
            "pflicht": true
          },
          {
            "feld_id": "massnahmen_ki",
            "label_de": "Sofortmaßnahmen, Korrekturmaßnahmen (Art. 20)",
            "typ": "textarea",
            "pflicht": true
          }
        ],
        "dauer_h": 360
      },
      {
        "stufe": "nachbericht",
        "label": "Untersuchungs-/Abschlussbericht",
        "frist": "nach Untersuchung unverzüglich; Zusammenarbeit mit Behörde",
        "felder": [
          {
            "feld_id": "untersuchung",
            "label_de": "Untersuchungsergebnis, Risikobewertung, Post-Market-Update (D29)",
            "typ": "textarea",
            "pflicht": true
          }
        ],
        "dauer_h": null
      }
    ]
  },
  "KRITIS_DACHG": {
    "delta_doc": "D82",
    "empfaenger": "Gemeinsame Meldestelle BBK/BSI",
    "rechtsgrundlage": "KRITIS-DachG · CER-RL Art. 15",
    "vorbedingung": "Trigger dachg_vorfall = ja (erhebliche Beeinträchtigung der kritischen Anlage, physisch)",
    "stufen": [
      {
        "stufe": "erstmeldung",
        "label": "Erstmeldung",
        "frist": "unverzüglich, ≤ 24 h ab Kenntnis",
        "felder": [
          {
            "feld_id": "anlage",
            "label_de": "Kritische Anlage (Registrierungs-Ref. D80)",
            "typ": "text",
            "pflicht": true
          },
          {
            "feld_id": "stoerung",
            "label_de": "Art und Ursache der Störung (Naturereignis/Unfall/Sabotage/…)",
            "typ": "choice",
            "pflicht": true
          },
          {
            "feld_id": "auswirkung",
            "label_de": "Auswirkungen auf die kritische Dienstleistung, Dauer, betroffene Nutzer",
            "typ": "textarea",
            "pflicht": true
          }
        ],
        "dauer_h": 24
      },
      {
        "stufe": "abschlussmeldung",
        "label": "Ausführlicher Bericht",
        "frist": "≤ 1 Monat",
        "felder": [
          {
            "feld_id": "bericht",
            "label_de": "Detaillierter Bericht: Verlauf, Maßnahmen, grenz-/sektorübergreifende Auswirkungen, Lessons Learned",
            "typ": "textarea",
            "pflicht": true
          }
        ],
        "dauer_h": 720
      }
    ]
  }
};
