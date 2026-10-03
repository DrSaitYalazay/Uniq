# Umbau-Spec: Rein knoten-basierte Cross-Framework-Projektion („node-only")

Stand: 2026-07-19 · Autor: Fable5 (forensisch verifiziert gegen den realen Code) · Umsetzer: Opus 4.8

## 0. Zielmodell (Vorgabe Dr. Sait, verbindlich)

> „Jedes Framework arbeitet UNABHÄNGIG. Werden mehrere Frameworks gewählt, werden nur die
> GEMEINSAMEN Kontrollen (derselbe same-as-Knoten = `control_node_member`) gemeinsam behandelt —
> das ist alles. Kein Framework ist Hub/Zentrum, KEIN ISO/BSI-Pivot."

Konsequenz für den Code:

1. **RAUS:** jeder `control_iso`-Anker-Aufbau (loser 1:N-ISO-Crosswalk, 1009 von 3230 Kontrollen
   mappen auf >1 `iso_id`, bis zu 53 — keine Äquivalenz) **und** jeder ISO-Selbstanker-Fallback
   (`fw === "ISO27001" ? [cid] : []` bzw. `control.framework === "ISO27001" ? [{anchorId: control.id, …}] : []`).
2. **BLEIBT:** Anker einer Kontrolle = **nur** ihr `node_id` aus `control_node_member`
   (aktuell 1634 Mitglieder / 551 Knoten `KN-00001`…, verifiziert per Grep in
   `db/seeds/overrides.sql`) **plus** die framework-neutrale `control_mapping`
   (deklarierte Relationen; Tabelle derzeit LEER → keine Wirkung, Pfad aber erhalten).
3. Kontrolle in **keinem** Knoten ⇒ **unabhängig**: nur die eigene Antwort zählt, keine
   Cross-Framework-Vererbung in keine Richtung.
4. **UNVERÄNDERT bleiben:** LWW-Semantik, Intra-Framework-Geschwister-Guard
   (`a.framework === control.framework && a.control_id !== control.id → skip`),
   `inheritanceMode === "off"` (leere Anker-Antwort-Map), subset/intersects-Deckelung
   („ja"→„teilweise"), weighted-Modus (E4), `computeStats`.

**WICHTIG — Fundstellen über die 3 genannten Hooks hinaus (verifiziert):** Der ISO-Selbstanker
steht an **6** Stellen, nicht 3. Alle müssen fallen, sonst bleibt der Pivot teilweise aktiv:

| # | Datei | Zeile(n) | Was |
|---|-------|----------|-----|
| 1 | `web/src/lib/assessmentEngine.ts` | 157–159 | Fallback in `projectAnswer` (LWW-Pfad) |
| 2 | `web/src/lib/assessmentEngine.ts` | 280–282 | Fallback in `projectAnswerWeighted` |
| 3 | `web/src/hooks/useAssessment.ts` | 204–227 | `anchorsBySpokeControl`: control_iso-Loop |
| 4 | `web/src/hooks/useComplianceOverview.ts` | 62 | `anchorsFor`-Fallback |
| 5 | `web/src/hooks/useRiskAnalysis.ts` | 279–283, 286 | control_iso-Loop + `anchorsFor`-Fallback |
| 6 | `web/src/pages/Assessment.tsx` | 140 | `anchorsFor`-Fallback |
| 7 | `web/src/pages/AuditWorkbench.tsx` | 210 | `anchorsFor`-Fallback |

Zusätzlich hängt in `Assessment.tsx` (Z. 147–157, 222–236) ein **ISO-only Asset-Vererbungspfad**
an ISO-Kontroll-IDs als Anker-Keys — der würde nach dem Umbau still leerlaufen und muss auf
Knoten-Keys umgestellt werden (§1.5). Und `AuditWorkbench.tsx` (Z. 273–278) nutzt die
Projektions-Anker **zweitverwertet** für die Familien-Ableitung (`familyFromIsoIds`) — dieser
Anzeigepfad braucht die `control_iso`-Daten weiterhin und wird entkoppelt (§1.6).

---

## 1. Änderungen pro Datei (exakt, mit Ziel-Code)

### 1.1 `web/src/lib/assessmentEngine.ts`

**ENTFERNEN (Block 1) — Z. 157–159 (LWW-Pfad in `projectAnswer`):**

```ts
// ALT (Z. 157–159):
  const mapped = isoAnchorsBySpokeControl.get(`${control.framework}::${control.id}`);
  const anchors: AnchorRef[] = mapped
    ?? (control.framework === "ISO27001" ? [{ anchorId: control.id, relation: "equal" as ControlRelation }] : []);
```

**ZIEL-Code:**

```ts
  // Node-only: Anker = Knoten (control_node_member) + control_mapping. KEIN
  // control_iso, KEIN ISO-Selbstanker. Kontrolle ohne Knoten ⇒ [] ⇒ unabhängig.
  const anchors: AnchorRef[] = isoAnchorsBySpokeControl.get(`${control.framework}::${control.id}`) ?? [];
```

**STEHEN BLEIBT unverändert:** die Kandidaten-Schleife Z. 160–170 **inklusive** des
Geschwister-Guards Z. 163–168 (`if (a.framework === control.framework && a.control_id !== control.id) continue;`),
die Deckelung Z. 184–192, das Ergebnis-Objekt Z. 194–203.

**ENTFERNEN (Block 2) — Z. 280–282 (`projectAnswerWeighted`), identische Änderung:**

```ts
// ALT (Z. 280–282):
  const mapped = isoAnchorsBySpokeControl.get(`${control.framework}::${control.id}`);
  const anchors: AnchorRef[] = mapped
    ?? (control.framework === "ISO27001" ? [{ anchorId: control.id, relation: "equal" as ControlRelation }] : []);
// NEU:
  const anchors: AnchorRef[] = isoAnchorsBySpokeControl.get(`${control.framework}::${control.id}`) ?? [];
```

Der Rest des weighted-Pfads (Z. 283–366) bleibt byte-identisch, inkl. Guard Z. 287.

**Kommentare aktualisieren (kein Codeeffekt, aber Pflicht — sonst lügt die Datei):**
- Header Z. 4–10: Satz „control_iso dient nur als Fallback-Anker …" streichen; ersetzen durch
  „Kontrollen ohne Knoten sind unabhängig (keine Vererbung)."
- Z. 47: „…und control_iso-Fallback bedeuten immer `equal`" → „Knoten-Mitgliedschaft bedeutet immer `equal`".
- Z. 122–125 (Doc `projectAnswer`): „über das ISO-Mapping verbundenen Schwester-Kontrolle" →
  „über den gemeinsamen Kontroll-Knoten verbundenen Schwester-Kontrolle"; „ISO 27001 erbt dadurch
  ebenfalls (control_id = Anker)" streichen.
- Z. 149–156 (Kommentar über dem Anker-Block): die Sätze zum control_iso-Fallback/Übergang streichen.
- Z. 186–189: „(Knoten/control_iso, …)" → „(Knoten, …)".
- Z. 277–279: „control_iso-Fallback für ISO27001" streichen.
- Doc von `buildAnchorAnswerMap` Z. 370–378: „(iso_id → Antwort)" → „(node_id → Antwort)";
  `@param anchorsFor  (framework, controlId) → node_id[] (leer ⇒ Kontrolle unabhängig)`.

**NICHT anfassen:** `interface IsoMapping` (Z. 39–43) — wird weiterhin importiert von
`treatmentEngine.ts:11,123,212` und `useRiskAnalysis.ts:22` (Anzeige/ZOK, §2).
`buildAnchorAnswerMap` (Z. 379–394) bleibt **code-identisch** — die Node-only-Logik kommt
ausschließlich über die `anchorsFor`-Callbacks der Aufrufer.

### 1.2 `web/src/hooks/useAssessment.ts`

**ÄNDERN — `anchorsBySpokeControl` (Z. 204–227).** ALT: (1) control_iso-Loop Z. 207–211,
(2) control_mapping-Loop Z. 214–220 (pusht additiv), (3) nodeMembers Z. 223–225 **ersetzt**
per `m.set(...)` alles Vorherige. NEU: control_iso-Loop RAUS; control_mapping bleibt;
Knoten werden **additiv** ergänzt (damit deklarierte `control_mapping`-Relationen neben dem
Knoten überleben — heute leer ⇒ byte-identisches Ergebnis `[{node_id, "equal"}]`):

```ts
  /**
   * Anker je Kontrolle (framework-neutral, node-only):
   *   • control_mapping  — deklarierte Relationen (partiell/gerichtet); Tabelle leer ⇒ keine Wirkung.
   *   • control_node_member — strikte same-as-Knoten, relation "equal".
   * KEIN control_iso, KEIN ISO-Selbstanker. Kontrolle ohne Eintrag ⇒ unabhängig.
   */
  const anchorsBySpokeControl = useMemo(() => {
    const m = new Map<string, AnchorRef[]>();
    // control_mapping ⇒ deklarierte Relation (partiell/gerichtet).
    for (const r of controlMappings) {
      const anchorId = r.target_node_id ?? r.target_control_id;
      if (!anchorId) continue;
      const k = `${r.source_framework}::${r.source_control_id}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push({ anchorId, relation: r.relation });
    }
    // Knoten-Mitgliedschaft ⇒ relation "equal", additiv (Dedupe auf gleichen equal-Anker).
    for (const r of nodeMembers) {
      const k = `${r.framework}::${r.control_id}`;
      if (!m.has(k)) m.set(k, []);
      const arr = m.get(k)!;
      if (!arr.some((a) => a.anchorId === r.node_id && a.relation === "equal")) {
        arr.push({ anchorId: r.node_id, relation: "equal" });
      }
    }
    return m;
  }, [nodeMembers, controlMappings]);
```

(Beachte: `isoMappings` fliegt aus dem Dependency-Array.)

**BLEIBT (bewusste Entscheidung):**
- Der `control_iso`-Fetch Z. 85–92, der State `isoMappings` Z. 40, `setIsoMappings` Z. 125 und
  der Export Z. 268 bleiben — **neuer** Konsument ist die Familien-Ableitung in
  `AuditWorkbench.tsx` (§1.6). Aktuell destrukturiert kein Aufrufer `isoMappings`
  (verifiziert: Assessment.tsx:126, AuditWorkbench.tsx:132, useComplianceOverview.ts:50).
- `activeFrameworks` Z. 47–50 (ISO27001 wird immer mitgeladen) bleibt in DIESEM Commit
  unverändert — das ist reine **Daten-Verfügbarkeit** (welche Antworten geladen werden), kein
  Anker-Pivot; Knoten-Vererbung gilt bewusst über alle geladenen Frameworks. Kommentar Z. 46
  umformulieren: „ISO27001 wird mitgeladen, damit vorhandene ISO-Antworten ihre Knoten speisen
  können (Daten-Verfügbarkeit, kein Hub)." → Folge-Entscheidung siehe §6 (offen).
- Kommentar Z. 93–94, Z. 110–112, Docstring Z. 198–203 anpassen (control_iso-Erwähnungen raus).
- Hook-Doc Z. 1–10: „their ISO 27001 mappings" → „node membership + declared mappings".

### 1.3 `web/src/hooks/useComplianceOverview.ts`

**ÄNDERN — Z. 59–64:**

```ts
// ALT (Z. 62):
      : buildAnchorAnswerMap(answers, (fw, cid) => isoAnchorsBySpokeControl.get(`${fw}::${cid}`)?.map((a) => a.anchorId) ?? (fw === "ISO27001" ? [cid] : [])),
// NEU:
      : buildAnchorAnswerMap(answers, (fw, cid) => isoAnchorsBySpokeControl.get(`${fw}::${cid}`)?.map((a) => a.anchorId) ?? []),
```

**BLEIBT:** alles andere — `inheritanceMode === "off"`-Zweig Z. 60–61, `overview`-Memo Z. 77–98,
Sortierung. Kommentare anpassen: Z. 4–6 („applies the ISO-hub projection" → „applies the
node projection"), Z. 53 („Fallback ISO-Selbstanker" streichen), Z. 56 („füttert den
(Knoten-)Anker" bleibt korrekt).

### 1.4 `web/src/hooks/useRiskAnalysis.ts`

**ÄNDERN — Z. 275–286.** ALT: control_iso-Loop Z. 279–283 + nodeMembers-Override Z. 285 +
Fallback in `anchorsFor` Z. 286. NEU:

```ts
        // Anker (node-only): Kontroll-Knoten (same-as), relation "equal". KEIN control_iso,
        // KEIN ISO-Selbstanker. control_mapping wird in diesem Hook (wie bisher) nicht geladen
        // — Tabelle ist leer; bei Befüllung hier nachziehen (Parität zu useAssessment).
        const anchorsBySpoke = new Map<string, AnchorRef[]>();
        for (const nm of nodeMembers) anchorsBySpoke.set(`${nm.framework}::${nm.control_id}`, [{ anchorId: nm.node_id, relation: "equal" }]);
        const anchorsFor = (fw: string, cid: string) => (anchorsBySpoke.get(`${fw}::${cid}`)?.map((a) => a.anchorId) ?? []);
```

**BLEIBT (Pflicht, nicht löschen):**
- Der `control_iso`-Fetch Z. 207–211 und `controlIsoMappings` — **weiter benutzt** von:
  (a) `isoRefByControlId`-Fallback Z. 316–319 (Knoten-Brücke, Spec-ITEM 18),
  (b) Rückgabe Z. 402/443 → `Risk.tsx:100,175` → `treatmentEngine.ts` (`source_iso_ids`
  für ZOK-Katalogmaßnahmen, Z. 212–232 dort). Das ist Anzeige/Maßnahmen-Katalog, KEINE Projektion.
- `HUB`-Konstante Z. 71 (weiter benutzt in Z. 200, 293, 326) und
  `enabledFrameworks = [HUB, ...userSelected]` Z. 200 (Daten-Verfügbarkeit wie §1.2; Kommentar anpassen).
- `inheritanceMode === "off"`-Zweig Z. 289–291, `projectAnswer`-Aufrufe Z. 302/379.
- Kommentarblock Z. 251–272 ERSETZEN durch: „Node-only Projektion: jede Antwort speist über
  ihre Knoten-Mitgliedschaft den gemeinsamen Anker (LWW). Kontrollen ohne Knoten sind
  unabhängig. Kein ISO-Hub." (Die alten Absätze über ISO-Hub/control_iso sind nach dem Umbau falsch.)
- Header-Doc Z. 4 („Loads the ISO 27001 hub answers") anpassen.

### 1.5 `web/src/pages/Assessment.tsx`

**ÄNDERN (a) — Z. 140:** identisch zu §1.3: `?? (fw === "ISO27001" ? [cid] : [])` → `?? []`.
Kommentare Z. 131 („sonst ISO-Selbstanker" streichen), Z. 134 ok, Z. 186–187
(„ISO 27001 is still loaded in the background as the hub for inheritance" → „…as data source
for node inheritance") anpassen.

**ÄNDERN (b) — Asset-Ebene, Z. 147–157 + 222–236.** Der bestehende Pfad ist ein ISO-Pivot:
`isoAssetAnswerByAsset` sammelt NUR `framework === "ISO27001"`-Asset-Antworten und keyt sie
auf die ISO-`control_id` — die nach dem Umbau nirgends mehr als Anker-ID auftaucht (Anker sind
`KN-…`). Ohne Fix liefe die Asset-Vererbung still leer. Node-only-treue Ersetzung
(framework-neutral, Anker-gekeyt, LWW wie `buildAnchorAnswerMap`):

```ts
  // Node-only: Asset-Antworten JEDES Frameworks speisen je Asset ihre Knoten-Anker (LWW).
  // Bei Modus "off" keine Cross-Framework-Vererbung (leere Map, wie Org-Ebene).
  const assetAnchorAnswerByAsset = useMemo(() => {
    const outer = new Map<string, Map<string, AnswerRow>>();
    if (inheritanceMode === "off") return outer;
    const ts = (r?: AnswerRow) => (r?.updated_at ? Date.parse(r.updated_at) : 0);
    for (const key of Object.keys(answers)) {
      const row = answers[key];
      if (!row.asset_id || !row.antwort) continue;
      const anchors = anchorsBySpokeControl.get(`${row.framework}::${row.control_id}`) ?? [];
      if (anchors.length === 0) continue; // kein Knoten ⇒ unabhängig
      if (!outer.has(row.asset_id)) outer.set(row.asset_id, new Map());
      const inner = outer.get(row.asset_id)!;
      for (const a of anchors) {
        const prev = inner.get(a.anchorId);
        if (!prev || ts(row) >= ts(prev)) inner.set(a.anchorId, row);
      }
    }
    return outer;
  }, [answers, anchorsBySpokeControl, inheritanceMode]);
```

und in `buildAssetEffective` (Z. 222–236): `isoAssetAnswerByAsset` → `assetAnchorAnswerByAsset`
(beide Vorkommen Z. 224/230) und die Hub-Sonderbedingung `fw !== "ISO27001" &&` in Z. 230
**ersatzlos streichen**:

```ts
    if (assetAnchorAnswerByAsset.has(assetId)) {
      const projected = projectAnswer(control, undefined, assetAnswers, isoAnchorsBySpokeControl);
      if (projected.status) return projected;
    }
```

(Z. 224 `const assetAnswers = assetAnchorAnswerByAsset.get(assetId) ?? isoAnswerByControl;`
— Fallback auf die Org-Anker-Map bleibt.) Semantik-Delta dokumentiert in §3.

### 1.6 `web/src/pages/AuditWorkbench.tsx`

**ÄNDERN (a) — Z. 210:** `?? (fw === "ISO27001" ? [cid] : [])` → `?? []` (wie §1.3).

**ÄNDERN (b) — Familien-Ableitung Z. 269–278 entkoppeln.** Heute speist
`isoAnchorsBySpokeControl` dort `familyFromIsoIds` („Crosswalk deckt BSI 100 %"). Nach dem
Umbau enthielte die Anker-Map nur noch `KN-…`-IDs (die in `isoFamilyMap.ts:276–283` nie
matchen) bzw. gar nichts ⇒ BSI-Befunde verlören ihre Familie ⇒ `assessedRank` fiele auf 0 ⇒
falsch niedrigere Schwere-Vorschläge. Fix: Familien-Quelle direkt aus `isoMappings` bauen
(reine Anzeige-/Severity-Nutzung des Crosswalks, KEINE Projektion):

1. Z. 132: `const { controls, answers, anchorsBySpokeControl, isoMappings, loading } = useAssessment(enabledFrameworks);`
2. Neues Memo (direkt nach Z. 201 einfügen):

```ts
  // Familien-Ableitung (Anzeige/Severity): ISO-Crosswalk NUR für familyFromIsoIds —
  // bewusst getrennt von der (node-only) Projektions-Anker-Map.
  const isoIdsByControl = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const r of isoMappings) {
      const k = `${r.framework}::${r.control_id}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r.iso_id);
    }
    return m;
  }, [isoMappings]);
```

3. Z. 273–276 ersetzen:

```ts
        const anchors = [
          ...((c.meta as { iso_ids?: string[] } | null)?.iso_ids ?? []),
          ...(isoIdsByControl.get(`${fw}::${c.id}`) ?? []),
        ];
```

4. Im Dependency-Array des `findings`-Memos (Z. 287) `isoAnchorsBySpokeControl` durch
   `isoIdsByControl` ersetzen. Kommentar Z. 270–272 anpassen („aus control_iso, nur für
   die Familien-/Severity-Ableitung; Projektion läuft node-only").

Verhaltens-Delta: für Nicht-Knoten-Kontrollen identisch zu heute; für Knoten-Mitglieder kann
`assessedRank` jetzt ERSTMALS greifen (heute bekamen sie `KN-…`-Strings, die nie matchten) —
Schwere-VORSCHLAG kann steigen, Compliance-% unberührt. Bewusst akzeptiert (korrekter).

### 1.7 `web/src/lib/__fixtures__/weightedProjection.fixture.mjs`

Kein Code-Fix nötig: Der Fallback-Zweig (Z. 129–135, `useMapping=false` nur bei `ai===0`
⇒ `anchorState=null` ⇒ kein Anker-Kandidat vorhanden) liefert vor wie nach dem Umbau
dieselben Ergebnisse; der Identitätstest vergleicht ohnehin neue Pfade gegeneinander.
Nur den Kommentar Z. 129 aktualisieren („Fallback-Selbstanker" existiert nicht mehr;
leerer Map-Eintrag = unabhängige Kontrolle). Fixture MUSS nach dem Umbau weiter mit exit 0 laufen.

---

## 2. control_iso-Fetches: was bleibt, was fällt

| Fetch | Entscheidung | Beleg |
|---|---|---|
| `useAssessment.ts` Z. 85–92 | **BLEIBT** (Export `isoMappings` bekommt mit §1.6 seinen ersten echten Konsumenten: AuditWorkbench-Familien) | Grep: bisher destrukturiert kein Aufrufer `isoMappings`; nach Umbau AuditWorkbench.tsx:132 |
| `useRiskAnalysis.ts` Z. 207–211 | **BLEIBT** | Konsumenten: `isoRefByControlId` Z. 316–319; `controlIsoMappings` → Risk.tsx:100/175 → treatmentEngine.ts:212–232 (`source_iso_ids`/ZOK) |
| `Roadmap.tsx` Z. 541 (eigener Fetch) | **UNBERÜHRT** | reine „Framework gilt auch für"-Badges (RoadmapFrameworkPanels.tsx:47–67), keine Projektion |

`evidenceEngine.ts`/`EvidencePanel.tsx` sind bereits rein node-basiert (nur `node_id`,
kein `control_iso` — verifiziert per Grep) ⇒ keine Änderung. `oscalExport.ts` exportiert
Mappings deklarativ ⇒ keine Änderung.

---

## 3. Semantische Folgen (präzise)

**ENTFÄLLT:**
- Jede Vererbung über den losen ISO-Crosswalk: eine Antwort in Framework A projizierte bisher
  auf ALLE Kontrollen (jedes Frameworks), die irgendeine ihrer bis zu 53 `iso_id`s teilen.
- Der ISO-Selbstanker: ISO-Kontrollen empfingen bisher Antworten JEDES Frameworks, das per
  `control_iso` auf sie zeigte; umgekehrt speiste jede ISO-Antwort alle Crosswalk-Nachbarn.
- Asset-Ebene: der ISO-only-Kanal (nur ISO-Asset-Antworten vererbten) wird durch den
  framework-neutralen Knoten-Kanal ersetzt (§1.5) — Vererbung nur noch je Knoten, dafür aus
  jedem Framework.

**BLEIBT:**
- Strikte Knoten-Vererbung (1634 Mitglieder / 551 Knoten), LWW über alle geladenen Frameworks.
- Geschwister-Guard, `na`-Handling, `inheritanceMode`-Toggle, subset/intersects-Deckelung
  (wirkt erst, wenn `control_mapping` befüllt wird), weighted-Modus.
- Eigene explizite Antworten IMMER (sie sind Kandidat 1 in `projectAnswer`, unabhängig von Ankern).

**Erwartete Richtung der Compliance-%:** je Framework sinkt zuerst `progressPct`
(weniger geerbte = weniger „beantwortete" Kontrollen). `compliancePct` sinkt überall dort, wo
geerbte „ja/teilweise" überwogen (Regelfall bei „ISO gut gepflegt, Rest erbt" — z. B. DORA
fällt von den Crosswalk-getriebenen Werten auf den Anteil seiner Knoten-Mitglieder). Sie kann
punktuell STEIGEN, wo überwiegend „nein"/„na" geerbt wurde (`applicable` ändert sich über `na`).
`criticalOpen` kann sinken (geerbte „nein" auf muss-Kontrollen entfallen). Alle Deltas =
weniger Cross-Bleed; Knoten-Vererbung selbst ändert sich NICHT (Knoten überschrieben schon
bisher die control_iso-Anker).

---

## 4. Edge-Cases

**(a) Nur ISO27001 aktiv.** Eigene Antworten sind Kandidat 1 → Ergebnis identisch. Der
Selbstanker diente nur dazu, FREMDE Antworten auf die ISO-Kontrolle zu holen; da Antworten
ohnehin nur für `activeFrameworks` geladen werden (useAssessment.ts:102–108), existieren bei
ISO-only keine fremden Antworten im Speicher ⇒ Statistiken byte-identisch. ISO-interne
Wirkung bricht NICHT (kein worst-wins, keine ISO-Geschwister-Vererbung — der Guard verhinderte
das schon immer).

**(b) Kontrolle in Knoten UND control_iso.** Bisher gewann der Knoten (m.set-Override) —
Ergebnis nach Umbau identisch, nur ist der control_iso-Zweig jetzt gar nicht mehr da.

**(c) `inheritanceMode === "off"`.** Unverändert: leere Anker-Antwort-Map ⇒ `projectAnswer`
findet keine Anker-Kandidaten ⇒ nur eigene Antwort. Gilt neu auch für den Asset-Pfad (§1.5,
early return).

**(d) `buildAnchorAnswerMap` mit leerem `anchorsFor`-Ergebnis.** Innere Schleife läuft 0-mal ⇒
die Antwort speist keinen Anker; eine Kontrolle ohne Knoten taucht in der Map weder als Quelle
noch als Ziel auf ⇒ vollständig unabhängig. Leere Map insgesamt ist zulässig (Schleife in
`projectAnswer` findet nichts).

**(e) `control_mapping` auf `target_control_id` (statt Knoten).** Vorbestehende Lücke, nicht
neu: ein solcher Anker matcht nur, wenn die Ziel-Kontrolle denselben String als Anker speist —
tut sie node-only nicht. Tabelle ist leer; bei Befüllung ausschließlich `target_node_id`
verwenden (im Spec-Kommentar in useAssessment vermerken).

---

## 5. Verifikationsplan

### 5.1 Node-Fixture (NEU): `web/src/lib/__fixtures__/nodeOnlyProjection.fixture.mjs`

Gleiche Harness wie `weightedProjection.fixture.mjs` (esbuild-Transform von
`assessmentEngine.ts`, loader ts, exit 0/1). Asserts (alle über `projectAnswer` +
`buildAnchorAnswerMap` mit `anchorsFor = map.get(...) ?? []`):

1. **Singleton erbt nicht:** Kontrolle `DORA::D-1` ohne Map-Eintrag; Anker-Antwort-Map enthält
   fremde Antworten unter `KN-0001`. Erwartung: ohne eigene Antwort `origin:"empty"`,
   `status:null`; mit eigener Antwort `origin:"explicit"`.
2. **Knoten-Geschwister erben (cross-fw):** `BSI::OPS.1.1` und `DORA::D-2` beide →
   `[{anchorId:"KN-0001",relation:"equal"}]`; DORA-Antwort „ja" (neuer) ⇒ BSI-Projektion
   `status:"ja"`, `origin:"inherited"`, `inheritedFrom:["KN-0001"]`.
3. **Kein ISO-Selbstanker mehr:** `ISO27001::a5-15` OHNE Map-Eintrag, Anker-Antwort-Map
   enthält Eintrag unter `"a5-15"` (simulierter Alt-Anker) ⇒ Erwartung `origin:"empty"`
   (der Alt-Pfad hätte geerbt). Eigene Antwort vorhanden ⇒ `origin:"explicit"`, Status = eigener.
4. **Geschwister-Guard:** zwei BSI-Kontrollen im selben Knoten; Antwort auf BSI-A speist
   `KN-0002`; Projektion für BSI-B ⇒ `origin:"empty"` (gleiche fw, andere control_id → skip).
5. **buildAnchorAnswerMap:** `anchorsFor` liefert `[]` für alle ⇒ Map ist leer; mit Knoten ⇒
   LWW-Gewinner pro `KN-…` korrekt (zwei Antworten, neuere gewinnt).
6. **LWW + Deckelung unverändert:** ein subset-of-Anker (aus control_mapping simuliert) mit
   „ja" ⇒ geerbt „teilweise" (Regression für den erhaltenen Pfad).

### 5.2 Bestehende Checks (Opus, Sandbox)

- `node web/src/lib/__fixtures__/weightedProjection.fixture.mjs` → exit 0 (unverändert).
- `node web/src/lib/__fixtures__/nodeOnlyProjection.fixture.mjs` → exit 0.
- Syntax/Imports aller 6 geänderten Dateien via esbuild (kein tsc): kleines Einmal-Skript oder
  `cd web && npx vite build` (wenn die Sandbox das Bundle schafft); mindestens
  `esbuild.transform` je Datei (Loader ts/tsx) ohne Fehler.
- `node db/tools/projection_diff.mjs <dump.json>` (vorhandenes Tool) mit einem Demo-Dump:
  zeigt exakt, welche Kontrollen ALT (control_iso) ≠ NEU (Knoten) ankern — das ist die
  erwartete Delta-Menge, KEIN Fehler.

### 5.3 Demo-Vergleich alt↔neu (Dr. Sait, vor Push)

Auf dem Demo-Tenant je Zustand notieren (alt = Stand vor Commit, neu = danach):
1. **Dashboard:** je Framework `compliancePct` / `progressPct` / `criticalOpen`
   (useComplianceOverview → computeStats). Erwartung: ISO27001 ±0 bei ISO-only-Antworten;
   Nicht-Knoten-lastige Frameworks (z. B. DORA) sinken deutlich.
2. **Bewertung:** Anzahl Kontrollen mit Badge „geerbt" (origin inherited) je Framework —
   neu ⊆ alt, und neu enthält NUR Knoten-Mitglieder. Stichprobe: 3 Kontrollen ohne Knoten,
   die alt „geerbt" zeigten, müssen neu „unbewertet" sein.
3. **Risikoanalyse:** `answered`, Anzahl findings/gaps, Anzahl Risiken. Erwartung: weniger
   geerbte findings; keine leere Ansicht, solange direkte Antworten existieren.
4. **Audit-Werkbench:** Befund-Anzahl + Stichprobe Schwere-Vorschläge (§1.6-Delta möglich:
   Knoten-Mitglieder können höher vorgeschlagen werden).
5. **SQL-Sanity:** `select framework, count(*) from control_node_member group by 1 order by 1;`
   — nur diese Anteile dürfen überhaupt noch erben.

---

## 6. Reihenfolge / Commit-Plan / Rollback

**EIN Commit** (atomar revertierbar):
`engine: node-only Projektion — control_iso-Anker + ISO-Selbstanker entfernt (Dr.-Sait-Modell)`

Reihenfolge innerhalb des Commits (Umsetzung → jeweils esbuild-Smoke):
1. `assessmentEngine.ts` (§1.1) → weightedProjection-Fixture laufen lassen.
2. `useAssessment.ts` (§1.2).
3. `useComplianceOverview.ts` (§1.3), `useRiskAnalysis.ts` (§1.4).
4. `Assessment.tsx` (§1.5), `AuditWorkbench.tsx` (§1.6).
5. Neues Fixture `nodeOnlyProjection.fixture.mjs` (§5.1) + Kommentar-Update im weighted-Fixture.
6. Alle Checks aus §5.2. Commit lokal; Dr. Sait vergleicht Demo alt↔neu (§5.3) und pusht selbst.

**Rollback:** `git revert <commit-sha>` (ein Commit, keine DB-Migration, keine Datenänderung —
der Umbau ist rein lesend/projektiv; `control_iso`-Daten bleiben in der DB unangetastet).

**Explizit OFFEN (separat entscheiden, NICHT in diesem Commit):**
- Zwangs-Laden von ISO27001 in `useAssessment.ts:47–50` / `useRiskAnalysis.ts:200` — heute
  Daten-Verfügbarkeits-Bias zugunsten ISO. Vollständig neutral wäre: Antworten ALLER Frameworks
  mit Knoten-Mitgliedschaft laden (oder nur der gewählten). Ändert Zahlen erneut → eigener Commit.
- `control_mapping`-Laden in `useRiskAnalysis` nachziehen, sobald die Tabelle befüllt wird (§1.4).
- Doku-Nachzug: `docs/architektur/audit/hooks.md` / `ARCHITECTURE.md` beschreiben noch den
  control_iso-Fallback.
