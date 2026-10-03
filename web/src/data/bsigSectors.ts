export interface Einrichtungsart {
  id: string;
  text: string;
  textEn?: string;
}

export interface Branche {
  id: string;
  name: string;
  nameEn?: string;
  einrichtungsarten: Einrichtungsart[];
}

export interface Sektor {
  nr: string;
  name: string;
  nameEn?: string;
  branchen: Branche[];
}

export interface AnlageData {
  id: "anlage1" | "anlage2";
  title: string;
  titleEn?: string;
  subtitle: string;
  subtitleEn?: string;
  sektoren: Sektor[];
}

// Source: NIS2-Richtlinie (EU) 2022/2555, Anhang I — Sektoren mit hoher Kritikalität (11 Sektoren)
// Verbatim aligned with Annex I of Directive (EU) 2022/2555.
export const anlage1Data: AnlageData = {
  id: "anlage1",
  title: "Anhang I NIS2 — Sektoren mit hoher Kritikalität",
  titleEn: "NIS2 Annex I — Sectors of High Criticality",
  subtitle: "Richtlinie (EU) 2022/2555, Anhang I · 11 Sektoren (wesentliche Einrichtungen)",
  subtitleEn: "Directive (EU) 2022/2555, Annex I · 11 sectors (essential entities)",
  sektoren: [
    {
      nr: "1",
      name: "Energie",
      nameEn: "Energy",
      branchen: [
        {
          id: "1.1",
          name: "Elektrizität",
          nameEn: "Electricity",
          einrichtungsarten: [
            { id: "1.1.1", text: "Elektrizitätsunternehmen im Sinne von Artikel 2 Nummer 57 der Richtlinie (EU) 2019/944, die die Funktion der 'Versorgung' im Sinne von Artikel 2 Nummer 12 jener Richtlinie wahrnehmen", textEn: "Electricity undertakings as defined in Article 2, point (57), of Directive (EU) 2019/944, which carry out the function of 'supply' as defined in Article 2, point (12), of that Directive" },
            { id: "1.1.2", text: "Verteilernetzbetreiber im Sinne von Artikel 2 Nummer 29 der Richtlinie (EU) 2019/944", textEn: "Distribution system operators as defined in Article 2, point (29), of Directive (EU) 2019/944" },
            { id: "1.1.3", text: "Übertragungsnetzbetreiber im Sinne von Artikel 2 Nummer 35 der Richtlinie (EU) 2019/944", textEn: "Transmission system operators as defined in Article 2, point (35), of Directive (EU) 2019/944" },
            { id: "1.1.4", text: "Erzeuger im Sinne von Artikel 2 Nummer 38 der Richtlinie (EU) 2019/944", textEn: "Producers as defined in Article 2, point (38), of Directive (EU) 2019/944" },
            { id: "1.1.5", text: "Nominierte Strommarktbetreiber im Sinne von Artikel 2 Nummer 8 der Verordnung (EU) 2019/943", textEn: "Nominated electricity market operators as defined in Article 2, point (8), of Regulation (EU) 2019/943" },
            { id: "1.1.6", text: "Marktteilnehmer im Sinne von Artikel 2 Nummer 25 der Verordnung (EU) 2019/943, die Aggregierungs-, Laststeuerungs- oder Energiespeicherungsdienste im Sinne von Artikel 2 Nummern 18, 20 und 59 der Richtlinie (EU) 2019/944 erbringen", textEn: "Market participants as defined in Article 2, point (25), of Regulation (EU) 2019/943 providing aggregation, demand response or energy storage services as defined in Article 2, points (18), (20) and (59), of Directive (EU) 2019/944" },
            { id: "1.1.7", text: "Betreiber eines Ladepunktes, die für die Verwaltung und den Betrieb eines Ladepunktes verantwortlich sind, der einen Aufladedienst für Endnutzer bereitstellt, auch im Namen und im Auftrag eines Mobilitätsdienstleisters", textEn: "Operators of a recharging point that are responsible for the management and operation of a recharging point, which provides a recharging service to end users, including in the name and on behalf of a mobility service provider" },
          ],
        },
        {
          id: "1.2",
          name: "Fernwärme und Fernkälte",
          nameEn: "District heating and cooling",
          einrichtungsarten: [
            { id: "1.2.1", text: "Betreiber von Fernwärme oder Fernkälte im Sinne von Artikel 2 Nummer 19 der Richtlinie (EU) 2018/2001", textEn: "Operators of district heating or district cooling as defined in Article 2, point (19), of Directive (EU) 2018/2001" },
          ],
        },
        {
          id: "1.3",
          name: "Erdöl",
          nameEn: "Oil",
          einrichtungsarten: [
            { id: "1.3.1", text: "Betreiber von Erdölfernleitungen", textEn: "Operators of oil transmission pipelines" },
            { id: "1.3.2", text: "Betreiber von Anlagen zur Förderung, Raffination, Aufbereitung, Lagerung und Fernleitung von Erdöl", textEn: "Operators of oil production, refining and treatment facilities, storage and transmission" },
            { id: "1.3.3", text: "Zentrale Bevorratungsstellen im Sinne von Artikel 2 Buchstabe f der Richtlinie 2009/119/EG des Rates", textEn: "Central stockholding entities as defined in Article 2, point (f), of Council Directive 2009/119/EC" },
          ],
        },
        {
          id: "1.4",
          name: "Erdgas",
          nameEn: "Gas",
          einrichtungsarten: [
            { id: "1.4.1", text: "Versorgungsunternehmen im Sinne von Artikel 2 Nummer 8 der Richtlinie 2009/73/EG", textEn: "Supply undertakings as defined in Article 2, point (8), of Directive 2009/73/EC" },
            { id: "1.4.2", text: "Verteilernetzbetreiber im Sinne von Artikel 2 Nummer 6 der Richtlinie 2009/73/EG", textEn: "Distribution system operators as defined in Article 2, point (6), of Directive 2009/73/EC" },
            { id: "1.4.3", text: "Fernleitungsnetzbetreiber im Sinne von Artikel 2 Nummer 4 der Richtlinie 2009/73/EG", textEn: "Transmission system operators as defined in Article 2, point (4), of Directive 2009/73/EC" },
            { id: "1.4.4", text: "Speicheranlagenbetreiber im Sinne von Artikel 2 Nummer 10 der Richtlinie 2009/73/EG", textEn: "Storage system operators as defined in Article 2, point (10), of Directive 2009/73/EC" },
            { id: "1.4.5", text: "LNG-Anlagenbetreiber im Sinne von Artikel 2 Nummer 12 der Richtlinie 2009/73/EG", textEn: "LNG system operators as defined in Article 2, point (12), of Directive 2009/73/EC" },
            { id: "1.4.6", text: "Erdgasunternehmen im Sinne von Artikel 2 Nummer 1 der Richtlinie 2009/73/EG", textEn: "Natural gas undertakings as defined in Article 2, point (1), of Directive 2009/73/EC" },
            { id: "1.4.7", text: "Betreiber von Anlagen zur Raffination und Aufbereitung von Erdgas", textEn: "Operators of natural gas refining and treatment facilities" },
          ],
        },
        {
          id: "1.5",
          name: "Wasserstoff",
          nameEn: "Hydrogen",
          einrichtungsarten: [
            { id: "1.5.1", text: "Betreiber im Bereich der Erzeugung, Speicherung und Fernleitung von Wasserstoff", textEn: "Operators of hydrogen production, storage and transmission" },
          ],
        },
      ],
    },
    {
      nr: "2",
      name: "Verkehr",
      nameEn: "Transport",
      branchen: [
        {
          id: "2.1",
          name: "Luftverkehr",
          nameEn: "Air",
          einrichtungsarten: [
            { id: "2.1.1", text: "Luftfahrtunternehmen im Sinne von Artikel 3 Nummer 4 der Verordnung (EG) Nr. 300/2008, die zu gewerblichen Zwecken eingesetzt werden", textEn: "Air carriers as defined in Article 3, point (4), of Regulation (EC) No 300/2008 used for commercial purposes" },
            { id: "2.1.2", text: "Flughafenleitungsorgane im Sinne von Artikel 2 Nummer 2 der Richtlinie 2009/12/EG, Flughäfen im Sinne von Artikel 2 Nummer 1 jener Richtlinie, einschließlich der in Abschnitt 2 des Anhangs II der Verordnung (EU) Nr. 1315/2013 aufgeführten Kernflughäfen, sowie Einrichtungen, die zu Flughäfen gehörende Nebeneinrichtungen betreiben", textEn: "Airport managing bodies as defined in Article 2, point (2), of Directive 2009/12/EC, airports as defined in Article 2, point (1), of that Directive, including the core airports listed in Section 2 of Annex II to Regulation (EU) No 1315/2013, and entities operating ancillary installations contained within airports" },
            { id: "2.1.3", text: "Verkehrsmanagement-Kontrollbetreiber, die Flugverkehrskontrolldienste (ATC) im Sinne von Artikel 2 Nummer 1 der Verordnung (EG) Nr. 549/2004 erbringen", textEn: "Traffic management control operators providing air traffic control (ATC) services as defined in Article 2, point (1), of Regulation (EC) No 549/2004" },
          ],
        },
        {
          id: "2.2",
          name: "Schienenverkehr",
          nameEn: "Rail",
          einrichtungsarten: [
            { id: "2.2.1", text: "Betreiber der Infrastruktur im Sinne von Artikel 3 Nummer 2 der Richtlinie 2012/34/EU", textEn: "Infrastructure managers as defined in Article 3, point (2), of Directive 2012/34/EU" },
            { id: "2.2.2", text: "Eisenbahnunternehmen im Sinne von Artikel 3 Nummer 1 der Richtlinie 2012/34/EU, einschließlich Betreiber von Serviceeinrichtungen im Sinne von Artikel 3 Nummer 12 jener Richtlinie", textEn: "Railway undertakings as defined in Article 3, point (1), of Directive 2012/34/EU, including operators of service facilities as defined in Article 3, point (12), of that Directive" },
          ],
        },
        {
          id: "2.3",
          name: "Schifffahrt",
          nameEn: "Water",
          einrichtungsarten: [
            { id: "2.3.1", text: "Passagier- und Frachtbeförderungsunternehmen der Binnen-, See- und Küstenschifffahrt im Sinne der Definition für den Seeverkehr in Anhang I der Verordnung (EG) Nr. 725/2004, ohne die einzelnen Schiffe, die von diesen Unternehmen betrieben werden", textEn: "Inland, sea and coastal passenger and freight water transport companies, as defined for maritime transport in Annex I to Regulation (EC) No 725/2004, not including the individual vessels operated by those companies" },
            { id: "2.3.2", text: "Leitungsorgane von Häfen im Sinne von Artikel 3 Nummer 1 der Richtlinie 2005/65/EG, einschließlich ihrer Hafenanlagen im Sinne von Artikel 2 Nummer 11 der Verordnung (EG) Nr. 725/2004, sowie Einrichtungen, die innerhalb von Häfen Bauwerke und Ausrüstungen betreiben", textEn: "Managing bodies of ports as defined in Article 3, point (1), of Directive 2005/65/EC, including their port facilities as defined in Article 2, point (11), of Regulation (EC) No 725/2004, and entities operating works and equipment contained within ports" },
            { id: "2.3.3", text: "Betreiber von Schiffsverkehrsdiensten (VTS) im Sinne von Artikel 3 Buchstabe o der Richtlinie 2002/59/EG", textEn: "Operators of vessel traffic services (VTS) as defined in Article 3, point (o), of Directive 2002/59/EC" },
          ],
        },
        {
          id: "2.4",
          name: "Straßenverkehr",
          nameEn: "Road",
          einrichtungsarten: [
            { id: "2.4.1", text: "Straßenverkehrsbehörden im Sinne von Artikel 2 Nummer 12 der Delegierten Verordnung (EU) 2015/962, die für die Verkehrssteuerung zuständig sind, mit Ausnahme öffentlicher Einrichtungen, für die das Verkehrsmanagement oder der Betrieb intelligenter Verkehrssysteme kein wesentlicher Teil ihrer allgemeinen Tätigkeit ist", textEn: "Road authorities as defined in Article 2, point (12), of Commission Delegated Regulation (EU) 2015/962 responsible for traffic management control, excluding public entities for which traffic management or the operation of intelligent transport systems is a non-essential part of their general activity" },
            { id: "2.4.2", text: "Betreiber intelligenter Verkehrssysteme im Sinne von Artikel 4 Nummer 1 der Richtlinie 2010/40/EU", textEn: "Operators of Intelligent Transport Systems as defined in Article 4, point (1), of Directive 2010/40/EU" },
          ],
        },
      ],
    },
    {
      nr: "3",
      name: "Bankwesen",
      nameEn: "Banking",
      branchen: [
        {
          id: "3.1",
          name: "Bankwesen",
          nameEn: "Banking",
          einrichtungsarten: [
            { id: "3.1.1", text: "Kreditinstitute im Sinne von Artikel 4 Nummer 1 der Verordnung (EU) Nr. 575/2013", textEn: "Credit institutions as defined in Article 4, point (1), of Regulation (EU) No 575/2013" },
          ],
        },
      ],
    },
    {
      nr: "4",
      name: "Finanzmarktinfrastrukturen",
      nameEn: "Financial market infrastructures",
      branchen: [
        {
          id: "4.1",
          name: "Finanzmarktinfrastrukturen",
          nameEn: "Financial market infrastructures",
          einrichtungsarten: [
            { id: "4.1.1", text: "Betreiber von Handelsplätzen im Sinne von Artikel 4 Nummer 24 der Richtlinie 2014/65/EU", textEn: "Operators of trading venues as defined in Article 4, point (24), of Directive 2014/65/EU" },
            { id: "4.1.2", text: "Zentrale Gegenparteien (CCPs) im Sinne von Artikel 2 Nummer 1 der Verordnung (EU) Nr. 648/2012", textEn: "Central counterparties (CCPs) as defined in Article 2, point (1), of Regulation (EU) No 648/2012" },
          ],
        },
      ],
    },
    {
      nr: "5",
      name: "Gesundheitswesen",
      nameEn: "Health",
      branchen: [
        {
          id: "5.1",
          name: "Gesundheitswesen",
          nameEn: "Health",
          einrichtungsarten: [
            { id: "5.1.1", text: "Gesundheitsdienstleister im Sinne von Artikel 3 Buchstabe g der Richtlinie 2011/24/EU", textEn: "Healthcare providers as defined in Article 3, point (g), of Directive 2011/24/EU" },
            { id: "5.1.2", text: "EU-Referenzlaboratorien im Sinne von Artikel 15 der Verordnung (EU) 2022/2371", textEn: "EU reference laboratories referred to in Article 15 of Regulation (EU) 2022/2371" },
            { id: "5.1.3", text: "Einrichtungen, die Forschungs- und Entwicklungstätigkeiten zu Arzneimitteln im Sinne von Artikel 1 Nummer 2 der Richtlinie 2001/83/EG durchführen", textEn: "Entities carrying out research and development activities of medicinal products as defined in Article 1, point (2), of Directive 2001/83/EC" },
            { id: "5.1.4", text: "Einrichtungen, die pharmazeutische Grundstoffe und pharmazeutische Zubereitungen gemäß Abschnitt C Abteilung 21 der NACE Rev. 2 herstellen", textEn: "Entities manufacturing basic pharmaceutical products and pharmaceutical preparations referred to in section C division 21 of NACE Rev. 2" },
            { id: "5.1.5", text: "Einrichtungen, die Medizinprodukte herstellen, die während einer Notlage im Bereich der öffentlichen Gesundheit als kritisch eingestuft werden (Liste kritischer Medizinprodukte für die öffentliche Gesundheit) im Sinne von Artikel 22 der Verordnung (EU) 2022/123", textEn: "Entities manufacturing medical devices considered to be critical during a public health emergency (public health emergency critical devices list) within the meaning of Article 22 of Regulation (EU) 2022/123" },
          ],
        },
      ],
    },
    {
      nr: "6",
      name: "Trinkwasser",
      nameEn: "Drinking water",
      branchen: [
        {
          id: "6.1",
          name: "Trinkwasser",
          nameEn: "Drinking water",
          einrichtungsarten: [
            { id: "6.1.1", text: "Lieferanten und Verteiler von Wasser für den menschlichen Gebrauch im Sinne von Artikel 2 Nummer 1 Buchstabe a der Richtlinie (EU) 2020/2184, ausgenommen Verteiler, für die die Verteilung von Wasser für den menschlichen Gebrauch kein wesentlicher Teil ihrer allgemeinen Tätigkeit der Verteilung anderer Waren und Güter ist", textEn: "Suppliers and distributors of water intended for human consumption as defined in Article 2, point (1)(a), of Directive (EU) 2020/2184, excluding distributors for which distribution of water for human consumption is a non-essential part of their general activity of distributing other commodities and goods" },
          ],
        },
      ],
    },
    {
      nr: "7",
      name: "Abwasser",
      nameEn: "Waste water",
      branchen: [
        {
          id: "7.1",
          name: "Abwasser",
          nameEn: "Waste water",
          einrichtungsarten: [
            { id: "7.1.1", text: "Unternehmen, die kommunales Abwasser, häusliches Abwasser oder industrielles Abwasser im Sinne von Artikel 2 Nummern 1, 2 und 3 der Richtlinie 91/271/EWG sammeln, entsorgen oder behandeln, ausgenommen Unternehmen, für die das Sammeln, Entsorgen oder Behandeln solchen Abwassers kein wesentlicher Teil ihrer allgemeinen Tätigkeit ist", textEn: "Undertakings collecting, disposing of or treating urban waste water, domestic waste water or industrial waste water as defined in Article 2, points (1), (2) and (3), of Council Directive 91/271/EEC, excluding undertakings for which collecting, disposing of or treating urban waste water, domestic waste water or industrial waste water is a non-essential part of their general activity" },
          ],
        },
      ],
    },
    {
      nr: "8",
      name: "Digitale Infrastruktur",
      nameEn: "Digital infrastructure",
      branchen: [
        {
          id: "8.1",
          name: "Digitale Infrastruktur",
          nameEn: "Digital infrastructure",
          einrichtungsarten: [
            { id: "8.1.1", text: "Betreiber von Internet-Knoten", textEn: "Internet Exchange Point providers" },
            { id: "8.1.2", text: "DNS-Diensteanbieter, ausgenommen Betreiber von Root-Namenservern", textEn: "DNS service providers, excluding operators of root name servers" },
            { id: "8.1.3", text: "TLD-Namenregister", textEn: "TLD name registries" },
            { id: "8.1.4", text: "Anbieter von Cloud-Computing-Diensten", textEn: "Cloud computing service providers" },
            { id: "8.1.5", text: "Anbieter von Rechenzentrumsdiensten", textEn: "Data centre service providers" },
            { id: "8.1.6", text: "Betreiber von Inhaltszustellnetzen (Content Delivery Networks)", textEn: "Content delivery network providers" },
            { id: "8.1.7", text: "Vertrauensdiensteanbieter", textEn: "Trust service providers" },
            { id: "8.1.8", text: "Anbieter öffentlicher elektronischer Kommunikationsnetze", textEn: "Providers of public electronic communications networks" },
            { id: "8.1.9", text: "Anbieter öffentlich zugänglicher elektronischer Kommunikationsdienste", textEn: "Providers of publicly available electronic communications services" },
          ],
        },
      ],
    },
    {
      nr: "9",
      name: "Verwaltung von IKT-Diensten (Business-to-Business)",
      nameEn: "ICT service management (business-to-business)",
      branchen: [
        {
          id: "9.1",
          name: "Verwaltung von IKT-Diensten",
          nameEn: "ICT service management",
          einrichtungsarten: [
            { id: "9.1.1", text: "Anbieter verwalteter Dienste (Managed Service Provider)", textEn: "Managed service providers" },
            { id: "9.1.2", text: "Anbieter verwalteter Sicherheitsdienste (Managed Security Service Provider)", textEn: "Managed security service providers" },
          ],
        },
      ],
    },
    {
      nr: "10",
      name: "Öffentliche Verwaltung",
      nameEn: "Public administration",
      branchen: [
        {
          id: "10.1",
          name: "Öffentliche Verwaltung",
          nameEn: "Public administration",
          einrichtungsarten: [
            { id: "10.1.1", text: "Einrichtungen der öffentlichen Verwaltung von Zentralregierungen, wie von einem Mitgliedstaat im Einklang mit dem nationalen Recht definiert", textEn: "Public administration entities of central governments as defined by a Member State in accordance with national law" },
            { id: "10.1.2", text: "Einrichtungen der öffentlichen Verwaltung auf regionaler Ebene, wie von einem Mitgliedstaat im Einklang mit dem nationalen Recht definiert", textEn: "Public administration entities at regional level as defined by a Member State in accordance with national law" },
          ],
        },
      ],
    },
    {
      nr: "11",
      name: "Weltraum",
      nameEn: "Space",
      branchen: [
        {
          id: "11.1",
          name: "Weltraum",
          nameEn: "Space",
          einrichtungsarten: [
            { id: "11.1.1", text: "Betreiber von Bodeninfrastrukturen, die sich im Eigentum von Mitgliedstaaten oder privaten Parteien befinden, von diesen verwaltet und betrieben werden und die Erbringung weltraumgestützter Dienste unterstützen, ausgenommen Anbieter öffentlicher elektronischer Kommunikationsnetze", textEn: "Operators of ground-based infrastructure, owned, managed and operated by Member States or by private parties, that support the provision of space-based services, excluding providers of public electronic communications networks" },
          ],
        },
      ],
    },
  ],
};

// Source: NIS2-Richtlinie (EU) 2022/2555, Anhang II — 7 Sektoren „sonstige kritische Sektoren" (wichtige Einrichtungen)
// Verbatim aligned with Annex II of Directive (EU) 2022/2555.
export const anlage2Data: AnlageData = {
  id: "anlage2",
  title: "Anhang II NIS2 — Sonstige kritische Sektoren (wichtige Einrichtungen)",
  titleEn: "NIS2 Annex II — Other Critical Sectors (Important Entities)",
  subtitle: "Richtlinie (EU) 2022/2555, Anhang II · 7 Sektoren",
  subtitleEn: "Directive (EU) 2022/2555, Annex II · 7 sectors",
  sektoren: [
    {
      nr: "1",
      name: "Post- und Kurierdienste",
      nameEn: "Postal and courier services",
      branchen: [
        {
          id: "1.1",
          name: "Post- und Kurierdienste",
          nameEn: "Postal and courier services",
          einrichtungsarten: [
            {
              id: "1.1.1",
              text: "Postdiensteanbieter im Sinne von Artikel 2 Nummer 1a der Richtlinie 97/67/EG, einschließlich Anbieter von Kurierdiensten",
              textEn: "Postal service providers as defined in Article 2, point (1a), of Directive 97/67/EC, including providers of courier services",
            },
          ],
        },
      ],
    },
    {
      nr: "2",
      name: "Abfallbewirtschaftung",
      nameEn: "Waste management",
      branchen: [
        {
          id: "2.1",
          name: "Abfallbewirtschaftung",
          nameEn: "Waste management",
          einrichtungsarten: [
            {
              id: "2.1.1",
              text: "Unternehmen, die Abfallbewirtschaftung im Sinne von Artikel 3 Nummer 9 der Richtlinie 2008/98/EG betreiben, ausgenommen Unternehmen, deren Haupttätigkeit nicht die Abfallbewirtschaftung ist",
              textEn: "Undertakings carrying out waste management as defined in Article 3, point (9), of Directive 2008/98/EC, excluding undertakings for whom waste management is not their principal economic activity",
            },
          ],
        },
      ],
    },
    {
      nr: "3",
      name: "Produktion, Herstellung und Handel mit chemischen Stoffen",
      nameEn: "Manufacture, production and distribution of chemicals",
      branchen: [
        {
          id: "3.1",
          name: "Produktion, Herstellung und Handel mit chemischen Stoffen",
          nameEn: "Manufacture, production and distribution of chemicals",
          einrichtungsarten: [
            {
              id: "3.1.1",
              text: "Unternehmen, die die Herstellung von Stoffen und den Vertrieb von Stoffen oder Gemischen gemäß Artikel 3 Nummern 9 und 14 der Verordnung (EG) Nr. 1907/2006 durchführen, sowie Unternehmen, die die Produktion von Erzeugnissen im Sinne von Artikel 3 Nummer 3 jener Verordnung aus Stoffen oder Gemischen durchführen",
              textEn: "Undertakings carrying out the manufacture of substances and the distribution of substances or mixtures, as referred to in Article 3, points (9) and (14), of Regulation (EC) No 1907/2006, and undertakings carrying out the production of articles, as defined in Article 3, point (3), of that Regulation, from substances or mixtures",
            },
          ],
        },
      ],
    },
    {
      nr: "4",
      name: "Produktion, Verarbeitung und Vertrieb von Lebensmitteln",
      nameEn: "Production, processing and distribution of food",
      branchen: [
        {
          id: "4.1",
          name: "Produktion, Verarbeitung und Vertrieb von Lebensmitteln",
          nameEn: "Production, processing and distribution of food",
          einrichtungsarten: [
            {
              id: "4.1.1",
              text: "Lebensmittelunternehmen im Sinne von Artikel 3 Nummer 2 der Verordnung (EG) Nr. 178/2002, die im Großhandelsvertrieb sowie in der industriellen Produktion und Verarbeitung tätig sind",
              textEn: "Food businesses as defined in Article 3, point (2), of Regulation (EC) No 178/2002 which are engaged in wholesale distribution and industrial production and processing",
            },
          ],
        },
      ],
    },
    {
      nr: "5",
      name: "Verarbeitendes Gewerbe / Herstellung von Waren",
      nameEn: "Manufacturing",
      branchen: [
        {
          id: "5.1",
          name: "Herstellung von Medizinprodukten und In-vitro-Diagnostika",
          nameEn: "Manufacture of medical devices and in vitro diagnostic medical devices",
          einrichtungsarten: [
            {
              id: "5.1.1",
              text: "Einrichtungen, die Medizinprodukte im Sinne von Artikel 2 Nummer 1 der Verordnung (EU) 2017/745 herstellen, sowie Einrichtungen, die In-vitro-Diagnostika im Sinne von Artikel 2 Nummer 2 der Verordnung (EU) 2017/746 herstellen, mit Ausnahme von Einrichtungen, die Medizinprodukte gemäß Anhang I Nummer 5 fünfter Gedankenstrich der NIS2-Richtlinie herstellen",
              textEn: "Entities manufacturing medical devices as defined in Article 2, point (1), of Regulation (EU) 2017/745, and entities manufacturing in vitro diagnostic medical devices as defined in Article 2, point (2), of Regulation (EU) 2017/746, with the exception of entities manufacturing medical devices referred to in Annex I, point 5, fifth indent, of the NIS2 Directive",
            },
          ],
        },
        {
          id: "5.2",
          name: "Herstellung von Datenverarbeitungsgeräten, elektronischen und optischen Erzeugnissen",
          nameEn: "Manufacture of computer, electronic and optical products",
          einrichtungsarten: [
            {
              id: "5.2.1",
              text: "Unternehmen, die eine der Wirtschaftstätigkeiten nach Abschnitt C Abteilung 26 der NACE Rev. 2 ausüben",
              textEn: "Undertakings carrying out any of the economic activities referred to in section C division 26 of NACE Rev. 2",
            },
          ],
        },
        {
          id: "5.3",
          name: "Herstellung von elektrischen Ausrüstungen",
          nameEn: "Manufacture of electrical equipment",
          einrichtungsarten: [
            {
              id: "5.3.1",
              text: "Unternehmen, die eine der Wirtschaftstätigkeiten nach Abschnitt C Abteilung 27 der NACE Rev. 2 ausüben",
              textEn: "Undertakings carrying out any of the economic activities referred to in section C division 27 of NACE Rev. 2",
            },
          ],
        },
        {
          id: "5.4",
          name: "Maschinenbau (a.n.g.)",
          nameEn: "Manufacture of machinery and equipment n.e.c.",
          einrichtungsarten: [
            {
              id: "5.4.1",
              text: "Unternehmen, die eine der Wirtschaftstätigkeiten nach Abschnitt C Abteilung 28 der NACE Rev. 2 ausüben",
              textEn: "Undertakings carrying out any of the economic activities referred to in section C division 28 of NACE Rev. 2",
            },
          ],
        },
        {
          id: "5.5",
          name: "Herstellung von Kraftwagen, Anhängern und Sattelanhängern",
          nameEn: "Manufacture of motor vehicles, trailers and semi-trailers",
          einrichtungsarten: [
            {
              id: "5.5.1",
              text: "Unternehmen, die eine der Wirtschaftstätigkeiten nach Abschnitt C Abteilung 29 der NACE Rev. 2 ausüben",
              textEn: "Undertakings carrying out any of the economic activities referred to in section C division 29 of NACE Rev. 2",
            },
          ],
        },
        {
          id: "5.6",
          name: "Sonstiger Fahrzeugbau",
          nameEn: "Manufacture of other transport equipment",
          einrichtungsarten: [
            {
              id: "5.6.1",
              text: "Unternehmen, die eine der Wirtschaftstätigkeiten nach Abschnitt C Abteilung 30 der NACE Rev. 2 ausüben",
              textEn: "Undertakings carrying out any of the economic activities referred to in section C division 30 of NACE Rev. 2",
            },
          ],
        },
      ],
    },
    {
      nr: "6",
      name: "Anbieter digitaler Dienste",
      nameEn: "Digital providers",
      branchen: [
        {
          id: "6.1",
          name: "Anbieter digitaler Dienste",
          nameEn: "Digital providers",
          einrichtungsarten: [
            { id: "6.1.1", text: "Anbieter von Online-Marktplätzen", textEn: "Providers of online marketplaces" },
            { id: "6.1.2", text: "Anbieter von Online-Suchmaschinen", textEn: "Providers of online search engines" },
            { id: "6.1.3", text: "Anbieter von Plattformen für Dienste sozialer Netzwerke", textEn: "Providers of social networking services platforms" },
          ],
        },
      ],
    },
    {
      nr: "7",
      name: "Forschung",
      nameEn: "Research",
      branchen: [
        {
          id: "7.1",
          name: "Forschung",
          nameEn: "Research",
          einrichtungsarten: [
            { id: "7.1.1", text: "Forschungseinrichtungen", textEn: "Research organisations" },
          ],
        },
      ],
    },
  ],
};

// ── DIRECTLY SUBJECT (auto bwE) — shortcut for entities affected regardless of size thresholds ──
export interface DirectlySubjectEntity {
  id: string;
  /** Pre-selected sector → branche → einrichtungsart for traceability */
  anlage: "anlage1";
  sektorNr: string;
  brancheId: string;
  einrichtungsartId: string;
  labelDe: string;
  labelEn: string;
  legalRef: string;
}

// Source: § 28 Abs. 1 Nr. 1 & Nr. 2 BSIG — 6 Kategorien, die unabhängig von der Unternehmensgröße als bwE gelten
export const directlySubjectEntities: DirectlySubjectEntity[] = [
  {
    id: "tk-netz",
    anlage: "anlage1",
    sektorNr: "8",
    brancheId: "8.1",
    einrichtungsartId: "8.1.8",
    labelDe: "Betreiber öffentlicher Telekommunikationsnetze",
    labelEn: "Public telecommunications network operator",
    legalRef: "§ 28 Abs. 1 Nr. 2 BSIG",
  },
  {
    id: "tk-dienst",
    anlage: "anlage1",
    sektorNr: "8",
    brancheId: "8.1",
    einrichtungsartId: "8.1.9",
    labelDe: "Anbieter öffentlich zugänglicher TK-Dienste",
    labelEn: "Provider of publicly available telecom services",
    legalRef: "§ 28 Abs. 1 Nr. 2 BSIG",
  },
  {
    id: "dns",
    anlage: "anlage1",
    sektorNr: "8",
    brancheId: "8.1",
    einrichtungsartId: "8.1.2",
    labelDe: "DNS-Dienstanbieter",
    labelEn: "DNS service provider",
    legalRef: "§ 28 Abs. 1 Nr. 2 BSIG",
  },
  {
    id: "tld",
    anlage: "anlage1",
    sektorNr: "8",
    brancheId: "8.1",
    einrichtungsartId: "8.1.3",
    labelDe: "Top-Level-Domain-Name-Registry",
    labelEn: "Top-level domain name registry",
    legalRef: "§ 28 Abs. 1 Nr. 2 BSIG",
  },
  {
    id: "trust",
    anlage: "anlage1",
    sektorNr: "8",
    brancheId: "8.1",
    einrichtungsartId: "8.1.7",
    labelDe: "Qualifizierter Vertrauensdiensteanbieter (eIDAS)",
    labelEn: "Qualified trust service provider (eIDAS)",
    legalRef: "§ 28 Abs. 1 Nr. 2 BSIG",
  },
  {
    id: "kritis",
    anlage: "anlage1",
    sektorNr: "8",
    brancheId: "8.1",
    einrichtungsartId: "8.1.4",
    labelDe: "KRITIS-Betreiber (BSI-KritisV)",
    labelEn: "CRITIS operator (BSI-KritisV)",
    legalRef: "§ 28 Abs. 1 Nr. 1 BSIG",
  },
];

// Obligations per category
export const weObligations = [
  { ref: "§ 30 BSIG", text: "Risikomanagementmaßnahmen — Einführung geeigneter, verhältnismäßiger und wirksamer technischer und organisatorischer Maßnahmen" },
  { ref: "§ 31 BSIG", text: "Meldepflichten — Erhebliche Sicherheitsvorfälle innerhalb von 24 h (Erstmeldung), 72 h (Bestätigung) und 1 Monat (Abschlussbericht) an das BSI melden" },
  { ref: "§ 32 BSIG", text: "Unterrichtungspflichten — Betroffene über erhebliche Sicherheitsvorfälle unterrichten" },
  { ref: "§ 33 BSIG", text: "Registrierungspflicht — Unverzügliche Registrierung beim BSI über das MUK-Portal" },
  { ref: "§ 34 BSIG", text: "Besondere Registrierungspflicht für DNS, TLD, Domain-Name-Registrierungsdienste" },
  { ref: "§ 38 BSIG", text: "Billigungs-, Überwachungs- und Schulungspflicht der Geschäftsleitung — persönliche Haftung" },
  { ref: "§ 30 Abs. 2 Nr. 4 BSIG", text: "Sicherheit der Lieferkette — Bewertung und Maßnahmen für direkte Anbieter und Dienstleister" },
];

export const bweObligations = [
  ...weObligations,
  { ref: "§ 28 Abs. 1 BSIG", text: "Proaktive BSI-Aufsicht — Das BSI kann jederzeit Nachweise, Audits und Vor-Ort-Prüfungen anordnen" },
  { ref: "§ 39 BSIG", text: "Bußgelder bis 10 Mio. € oder 2 % des weltweiten Jahresumsatzes (statt 7 Mio. / 1,4 % bei wE)" },
];
