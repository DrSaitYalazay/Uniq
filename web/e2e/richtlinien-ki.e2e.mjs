// Browser-Ende-zu-Ende: Richtlinien (NIS2 / ISO 27001 / AI Act / ISO 42001),
// Dokumenten-Lebenszyklus (KI-Dokumente) und KI-Governance — Dozent und Studierende.
// Die API wird im Browser nachgebildet (e2e/mock-api.mjs), es wird nichts gespeichert.
//
// Ausführen (im Ordner web/):
//   npx vite build && npx vite preview --host 127.0.0.1 --port 4173 &
//   node e2e/richtlinien-ki.e2e.mjs
// Optional: CHROMIUM=/pfad/zu/chromium  BASE=http://127.0.0.1:4173
// Benötigt pdftotext und unzip.
import { chromium } from "playwright";
import { makeDb, installMock } from "./mock-api.mjs";
import { tmpdir } from "os";
import { execFileSync } from "child_process";
import { writeFileSync, mkdirSync } from "fs";

const BASE = process.env.BASE || "http://127.0.0.1:4173";
const OUT = `${tmpdir()}/cws-e2e-richtlinien`;
mkdirSync(OUT, { recursive: true });
const results = [];
const ok = (name, cond, info = "") => { results.push({ name, pass: !!cond, info }); console.log((cond ? "PASS " : "FAIL ") + name + (info ? "  — " + info : "")); };

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

async function session(role, orgOwnerRole = null) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const db = makeDb({ role, orgOwnerRole });
  const errs = [];
  page.on("pageerror", e => errs.push("PAGEERROR " + e.message));
  page.on("console", m => { if (m.type() === "error") errs.push("CONSOLE " + m.text()); });
  await installMock(page, db);
  return { ctx, page, db, errs };
}
const bodyText = (page) => page.evaluate(() => document.body.innerText);
async function chip(page, label) {
  const b = page.locator("button", { hasText: new RegExp("^" + label.replace(/[()]/g, "\\$&") + " \\(\\d+\\)$") }).first();
  return b;
}
async function listNames(page) {
  // Richtlinien-Kopfzeilen (erste Zeile im Kopf-Button)
  return page.$$eval("div.bg-card.border.rounded-xl > button span.text-sm.font-semibold", els => els.map(e => e.textContent.trim()));
}
async function saveDownload(dl, name) {
  const f = `${OUT}/${name}`;
  await dl.saveAs(f);
  return f;
}

// ════════ 1. Dozent: Richtlinien ════════
{
  const { ctx, page, db, errs } = await session("admin");
  await page.goto(BASE + "/policies");
  await page.waitForSelector("text=Framework:", { timeout: 20000 });
  await page.waitForTimeout(1500);
  const t = await bodyText(page);
  const m = (re) => (t.match(re) || [])[1];
  ok("Chips NIS2/ISO 27001/ISO 42001/AI Act sichtbar", /NIS2 \(\d+\)/.test(t) && /ISO 27001 \(\d+\)/.test(t) && /ISO 42001 \(\d+\)/.test(t) && /AI Act \(\d+\)/.test(t),
    `NIS2 ${m(/NIS2 \((\d+)\)/)} · ISO27001 ${m(/ISO 27001 \((\d+)\)/)} · ISO42001 ${m(/ISO 42001 \((\d+)\)/)} · AI Act ${m(/AI Act \((\d+)\)/)}`);
  ok("keine Chips fremder Frameworks (DORA, KRITIS, CRA)", !/\bDORA \(\d+\)/.test(t) && !/KRITIS \(\d+\)/.test(t) && !/\bCRA \(\d+\)/.test(t));
  const alle = Number(m(/Alle \((\d+)\)/));
  const gesamt = Number((t.match(/(\d+)\nGesamt/) || [])[1]);
  ok("Kennzahl Gesamt = sichtbare Richtlinien", alle === gesamt, `Alle ${alle} / Gesamt ${gesamt}`);

  const all = await listNames(page);
  ok("DORA-/KRITIS-Dokumente ausgeblendet", !all.includes("TLPT-Programm") && !all.includes("KRITIS-Nachweis nach § 39 BSIG"), `${all.length} Einträge`);

  const checks = [
    ["NIS2", ["Registrierung bei der zuständigen Behörde", "Meldeverfahren an die Behörde (NIS2 Artikel 23)", "Beschluss des Leitungsorgans (Billigung der Maßnahmen)", "Nachweis Geschäftsleitungs-Schulung", "Vorfallmeldungs-Richtlinie"], []],
    ["ISO 27001", ["Erklärung zur Anwendbarkeit (SoA)", "ISMS-Geltungsbereich (Scope)", "Risikobehandlungsplan (RTP)", "Management-Review-Protokoll"], []],
    ["AI Act", ["KI-Systemregister", "KI-Auswirkungsabschätzung / FRIA", "Technische Dokumentation Anhang IV", "Qualitätsmanagementsystem für Hochrisiko-KI (Art. 17)", "Sichere KI-Nutzungs-Richtlinie"], ["Passwort-Richtlinie"]],
    ["ISO 42001", ["KI-Systemregister", "Sichere KI-Nutzungs-Richtlinie", "Konzept menschliche Aufsicht (KI)"], ["Passwort-Richtlinie"]],
  ];
  for (const [label, must, mustNot] of checks) {
    await (await chip(page, label)).click();
    await page.waitForTimeout(600);
    const names = await listNames(page);
    const fehlt = must.filter(x => !names.includes(x));
    const falsch = mustNot.filter(x => names.includes(x));
    ok(`Chip ${label}: Pflichtdokumente enthalten`, fehlt.length === 0 && falsch.length === 0, `${names.length} Einträge${fehlt.length ? " · fehlt: " + fehlt.join(", ") : ""}${falsch.length ? " · falsch: " + falsch.join(", ") : ""}`);
    await (await chip(page, label)).click(); // zurück auf „Alle"
    await page.waitForTimeout(300);
  }

  // Kategorienfilter enthält die früher fehlenden Kategorien
  await page.locator("button[role=combobox]").first().click();
  await page.waitForTimeout(300);
  const opts = await page.$$eval("[role=option]", els => els.map(e => e.textContent.trim()));
  ok("Kategorienfilter: ISMS-Grundlagendokumente / Risikomanagement-Nachweise / Ergänzende", ["ISMS-Grundlagendokumente", "Risikomanagement-Nachweise", "Ergänzende Richtlinien und Nachweise"].every(c => opts.includes(c)));
  await page.keyboard.press("Escape");

  // KI-Systemregister öffnen, Klauseln, Quellen, Export Word + PDF
  await (await chip(page, "AI Act")).click();
  await page.waitForTimeout(400);
  await page.locator("button", { hasText: "KI-Systemregister" }).first().click();
  await page.waitForTimeout(800);
  const t2 = await bodyText(page);
  ok("KI-Systemregister: Klauseln vorausgewählt", /5\/5/.test(t2) || /Richtlinie als Word exportieren/.test(t2));
  for (const fmt of ["Word (.docx)", "PDF"]) {
    await page.locator("button", { hasText: "Richtlinie als Word exportieren" }).first().click();
    await page.waitForSelector("text=Wählen Sie Format und Optionen für den Export.");
    await page.locator("[role=dialog] button", { hasText: fmt }).first().click();
    const [dl] = await Promise.all([
      page.waitForEvent("download", { timeout: 20000 }),
      page.locator("[role=dialog] button", { hasText: /^Exportieren/ }).click(),
    ]);
    const f = await saveDownload(dl, "D25." + (fmt === "PDF" ? "pdf" : "docx"));
    if (fmt === "PDF") {
      const txt = execFileSync("pdftotext", ["-enc", "UTF-8", f, "-"]).toString("utf8");
      ok("PDF KI-Systemregister: Titel, Klauseln, KI-VO-Quelle", /KI-Systemregister/.test(txt) && /AI Act Arts?\./.test(txt), dl.suggestedFilename());
    } else {
      const xml = execFileSync("unzip", ["-p", f, "word/document.xml"]).toString("utf8");
      ok("Word KI-Systemregister: erzeugt", xml.includes("KI-Systemregister"), dl.suggestedFilename());
    }
    await page.waitForTimeout(500);
  }

  // Übersichtsbericht Word
  await page.locator("button", { hasText: "Bericht erstellen" }).first().click();
  await page.waitForTimeout(800);
  const dlgTxt = await page.locator("[role=dialog]").innerText().catch(() => "");
  ok("Übersichtsbericht-Dialog listet keine DORA-Dokumente", dlgTxt.length > 0 && !dlgTxt.includes("TLPT-Programm"), `${dlgTxt.length} Zeichen`);
  const wordBtn = page.locator("[role=dialog] button", { hasText: /Word/ }).first();
  if (await wordBtn.count()) {
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), wordBtn.click()]);
    const f = await saveDownload(dl, "uebersicht.docx");
    const xml = execFileSync("unzip", ["-p", f, "word/document.xml"]).toString("utf8");
    ok("Übersicht Word: KI-Dokumente drin, DORA nicht", xml.includes("KI-Systemregister") && !xml.includes("TLPT-Programm"));
  } else ok("Übersicht Word-Knopf gefunden", false);
  await page.keyboard.press("Escape");

  // Speichern landet in der DB
  await page.locator("button", { hasText: /^Speichern$/ }).first().click();
  await page.waitForTimeout(1500);
  const saves = db.writes.filter(w => /tool_data/.test(w.table));
  ok("Richtlinien-Stand wird gespeichert (org_tool_data)", saves.length > 0, `${saves.length} Schreibvorgänge`);
  ok("Richtlinien: keine JS-Fehler", errs.length === 0, errs.slice(0, 3).join(" | "));
  await page.screenshot({ path: `${OUT}/policies.png` });
  await ctx.close();
}

// ════════ 2. Dozent: Dokumenten-Lebenszyklus ════════
{
  const { ctx, page, db, errs } = await session("admin");
  await page.goto(BASE + "/documents");
  await page.waitForSelector("text=Dokumenten-Lebenszyklus", { timeout: 20000 });
  await page.waitForTimeout(1200);
  const opts = await page.$$eval("select option", els => els.map(e => e.textContent.trim()));
  const ki = ["KI-Systemregister (KI-Inventar)", "Grundrechte-Folgenabschätzung (FRIA)", "Technische Dokumentation Hochrisiko-KI", "KI-Politik (AI Policy)", "Internes AIMS-Audit", "Register schwerwiegender KI-Vorfälle", "Nachweise KI-Kompetenz"];
  const fehlt = ki.filter(k => !opts.some(o => o.startsWith(k)));
  ok("Katalog enthält KI-Dokumente", fehlt.length === 0, fehlt.join(", "));
  // Hinzufügen: KI-Systemregister
  const val = await page.$eval("select", s => [...s.options].find(o => o.textContent.startsWith("KI-Systemregister"))?.value);
  await page.selectOption("select", val);
  await page.locator("button", { hasText: "Aus Vorlage hinzufügen" }).click();
  await page.waitForTimeout(800);
  const nameVals = await page.$$eval("input", els => els.map(e => e.value));
  ok("KI-Systemregister als Register angelegt", nameVals.includes("KI-Systemregister (KI-Inventar)"));
  const t = await bodyText(page);
  ok("Normgrundlage angezeigt", t.includes("ISO/IEC 42001 A.4 / KI-VO Art. 6"));
  // Matrix: AI-Act-Karte mit Hinweis
  await page.locator("button", { hasText: "Framework-Pflichtdokumente (Matrix)" }).click();
  await page.waitForTimeout(500);
  const t2 = await bodyText(page);
  ok("Matrix zeigt EU AI Act und ISO 42001", t2.includes("EU AI Act") && t2.includes("ISO/IEC 42001 (AIMS)"));
  const hinweis = await page.$$eval("[aria-label]", els => els.map(e => e.getAttribute("aria-label")).filter(a => a && a.includes("02.12.2027")).length);
  ok("Matrix: Fristhinweis 02.12.2027 an KI-Hochrisiko-Dokumenten", hinweis >= 8, `${hinweis} Hinweise`);
  await page.waitForTimeout(2500);
  ok("Dokumente: gespeichert", db.writes.some(w => /tool_data/.test(w.table)));
  ok("Dokumente: keine JS-Fehler", errs.length === 0, errs.slice(0, 3).join(" | "));
  await page.screenshot({ path: `${OUT}/documents.png`, fullPage: true });
  await ctx.close();
}

// ════════ 3. Dozent: KI-Governance ════════
{
  const { ctx, page, errs } = await session("admin");
  await page.goto(BASE + "/ki-governance");
  await page.waitForSelector("text=KI-Governance", { timeout: 20000 });
  await page.waitForTimeout(1000);
  let t = await bodyText(page);
  ok("Banner: Anhang III ab 02.12.2027, Anhang I ab 02.08.2028", t.includes("02.12.2027") && t.includes("02.08.2028"));
  ok("Banner behauptet keinen Verstoß seit 02.08.2026", !/Hochrisiko[^.]*seit 02\.08\.2026/.test(t) && !t.includes("jetzt ein Verstoß"));
  await page.locator("button", { hasText: "KI-System" }).click();
  await page.waitForTimeout(400);
  await page.fill("input[placeholder='Name des KI-Systems']", "Bewerber-Ranking");
  // Rolle Anbieter
  await page.locator("select").first().selectOption("anbieter");
  await page.locator("label", { hasText: "Beschäftigung, Personalmanagement" }).locator("input").check();
  await page.waitForTimeout(400);
  t = await bodyText(page);
  ok("Einstufung Hochrisiko bei Anhang III", t.includes("Hochrisiko"));
  ok("Anbieter: kein FRIA, aber Technische Doku/QMS/CE", !t.includes("D26 ") && t.includes("D27") && t.includes("D73") && t.includes("D28"));
  await page.locator("select").first().selectOption("betreiber");
  await page.waitForTimeout(300);
  t = await bodyText(page);
  ok("Betreiber ohne Art.-27-Pflicht: kein FRIA", !/D26\s/.test(t) && t.includes("D63"));
  await page.locator("label", { hasText: "FRIA-pflichtig" }).locator("input").check();
  await page.waitForTimeout(300);
  t = await bodyText(page);
  ok("Betreiber mit Art.-27-Pflicht: FRIA (D26) erscheint", /D26\s/.test(t));
  const art5 = await page.$$eval("label", els => els.filter(e => /\((Art\. 5 Abs\. 1 )?[a-h]\)/.test(e.textContent)).length);
  ok("Art. 5: acht Verbote a–h + neues Verbot", art5 >= 8 && t.includes("Darstellungen sexuellen Kindesmissbrauchs"), `${art5}`);
  ok("KI-Governance: keine JS-Fehler", errs.length === 0, errs.slice(0, 3).join(" | "));
  await page.screenshot({ path: `${OUT}/ki-governance.png`, fullPage: true });
  await ctx.close();
}

// ════════ 3b. KI-Register: Eingabe → Register-Export → vorbefüllte Dokumente → Richtlinien ════════
{
  const { ctx, page, errs } = await session("admin");
  await page.goto(BASE + "/ki-governance");
  await page.waitForSelector("text=KI-Systemregister (D25)", { timeout: 20000 });
  await page.waitForTimeout(800);
  await page.locator("button", { hasText: /^KI-System$/ }).click();
  await page.fill("input[placeholder='Name des KI-Systems']", "Bewerber-Ranking");
  await page.locator("select").first().selectOption("anbieter");
  await page.fill("input[placeholder='Zweck / Einsatzkontext']", "Vorauswahl von Bewerbungen für Ausbildungsplätze");
  await page.locator("label", { hasText: "Beschäftigung, Personalmanagement" }).locator("input").check();
  // Verantwortliche über das zentrale Personen-Register anlegen
  const ownerSel = page.locator("label", { hasText: "Verantwortlich" }).locator("select");
  await ownerSel.selectOption("__add__");
  await page.fill("input[placeholder='Name *']", "Dr. Erika Muster");
  await page.fill("input[placeholder='Position (opt.)']", "KI-Beauftragte");
  await page.locator("button", { hasText: "✓" }).click();
  await page.locator("select[aria-label='Lebenszyklus']").selectOption("entwicklung");
  await page.waitForTimeout(500);
  const owner = await ownerSel.inputValue();
  ok("Verantwortliche aus Personen-Register gesetzt", owner.includes("Dr. Erika Muster"), owner);

  // Register-Export
  for (const [btn, ext] of [["Register PDF", "pdf"], ["Register Excel", "xlsx"]]) {
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), page.locator("button", { hasText: btn }).click()]);
    const f = await saveDownload(dl, "register." + ext);
    if (ext === "pdf") {
      const txt = execFileSync("pdftotext", ["-enc", "UTF-8", f, "-"]).toString("utf8").replace(/\s+/g, " ");
      ok("Register-PDF enthält System, Zweck, Verantwortliche, Frist", txt.includes("Bewerber-Ranking") && txt.includes("Vorauswahl von Bewerbungen") && txt.includes("Dr. Erika Muster") && txt.includes("02.12.2027"), dl.suggestedFilename());
    } else {
      const xml = execFileSync("unzip", ["-p", f, "xl/sharedStrings.xml"]).toString("utf8");
      ok("Register-Excel enthält System und Verantwortliche", xml.includes("Bewerber-Ranking") && xml.includes("Dr. Erika Muster"), dl.suggestedFilename());
    }
  }

  // Vorbefülltes D27 (Word + PDF)
  await page.locator("select[aria-label='Dokument wählen']").selectOption("D27");
  let [dl] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), page.locator("button", { hasText: /^Word$/ }).click()]);
  let f = await saveDownload(dl, "D27-vorbefuellt.docx");
  let xml = execFileSync("unzip", ["-p", f, "word/document.xml"]).toString("utf8").replace(/<[^>]+>/g, " ");
  ok("D27 Word vorbefüllt (Systemangaben, Zweck, Verantwortliche, Geltungsbereich)", xml.includes("Systemangaben aus dem KI-Register") && xml.includes("Vorauswahl von Bewerbungen") && xml.includes("Dr. Erika Muster") && xml.includes("Bewerber-Ranking"));
  [dl] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), page.locator("button", { hasText: /^PDF$/ }).click()]);
  f = await saveDownload(dl, "D27-vorbefuellt.pdf");
  const txt27 = execFileSync("pdftotext", ["-enc", "UTF-8", f, "-"]).toString("utf8").replace(/\s+/g, " ");
  ok("D27 PDF vorbefüllt", txt27.includes("Systemangaben aus dem KI-Register") && txt27.includes("Bewerber-Ranking") && txt27.includes("Technische Dokumentation"));
  await page.waitForTimeout(400);
  ok("Status D27 nach Erzeugung: Entwurf", /D27 Technische Dokumentation \(Art\. 11, Anhang IV\) · Entwurf/.test(await bodyText(page)));

  // Richtlinien übernehmen die Registerdaten
  await page.waitForTimeout(2500); // Autosave
  await page.goto(BASE + "/policies");
  await page.waitForSelector("text=Framework:", { timeout: 20000 });
  await page.waitForTimeout(1200);
  await (await chip(page, "AI Act")).click();
  await page.locator("div.bg-card.border.rounded-xl > button", { hasText: "KI-Systemregister" }).first().click();
  await page.waitForTimeout(600);
  ok("Richtlinien: Hinweis „Systemangaben aus dem KI-Register (1 System)“", (await bodyText(page)).includes("Systemangaben aus dem KI-Register (1 System)"));
  await page.locator("button", { hasText: "Richtlinie als Word exportieren" }).first().click();
  await page.waitForSelector("text=Wählen Sie Format und Optionen für den Export.");
  await page.locator("[role=dialog] button", { hasText: "PDF" }).first().click();
  [dl] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), page.locator("[role=dialog] button", { hasText: /^Exportieren/ }).click()]);
  f = await saveDownload(dl, "D25-aus-richtlinien.pdf");
  const txt25 = execFileSync("pdftotext", ["-enc", "UTF-8", f, "-"]).toString("utf8").replace(/\s+/g, " ");
  ok("Richtlinien-Export D25 enthält das Registersystem", txt25.includes("Bewerber-Ranking") && txt25.includes("Dr. Erika Muster"));
  ok("KI-Register-Ablauf: keine JS-Fehler", errs.length === 0, errs.slice(0, 3).join(" | "));
  await page.screenshot({ path: `${OUT}/policies-d25.png` });
  await ctx.close();
}

// ════════ 4. Studierende: Export-Kontingent (ohne Org / in Org eines Admins) ════════
for (const ownerRole of [null, "admin"]) {
  const { ctx, page, errs, db } = await session("student", ownerRole);
  await page.goto(BASE + "/policies");
  await page.waitForSelector("text=Framework:", { timeout: 20000 });
  await page.waitForTimeout(1500);
  const exportiere = async (name) => {
    await page.locator("div.bg-card.border.rounded-xl > button", { hasText: name }).first().click();
    await page.waitForTimeout(500);
    const btn = page.locator("button", { hasText: "Richtlinie als Word exportieren" }).first();
    if (await btn.isDisabled()) return "gesperrt";
    await btn.click();
    await page.waitForSelector("text=Wählen Sie Format und Optionen für den Export.");
    const dl = page.waitForEvent("download", { timeout: 8000 }).then(() => "ok").catch(() => "kein Download");
    await page.locator("[role=dialog] button", { hasText: /^Exportieren/ }).click();
    const r = await dl;
    await page.keyboard.press("Escape");
    await page.locator("div.bg-card.border.rounded-xl > button", { hasText: name }).first().click();
    await page.waitForTimeout(300);
    return r;
  };
  const r1 = await exportiere("KI-Systemregister");
  const r2 = await exportiere("Vorfallmeldungs-Richtlinie");
  const r3 = await exportiere("Informationssicherheitsrichtlinie");
  ok(`Studierende (Org-Inhaber: ${ownerRole ?? "keiner"}): 2 Exporte erlaubt, 3. gesperrt`, r1 === "ok" && r2 === "ok" && r3 !== "ok", `${r1} / ${r2} / ${r3}`);
  if (ownerRole) ok("Studierende: Exporte in student_policy_downloads gespeichert", (db.tables.student_policy_downloads ?? []).length === 2);
  ok("Studierende: kein Admin-Link", !(await bodyText(page)).split("\n").includes("Admin"));
  if (!ownerRole) {
    await page.goto(BASE + "/ki-governance");
    await page.waitForSelector("text=KI-Systemregister (D25)", { timeout: 20000 });
    await page.locator("button", { hasText: /^KI-System$/ }).click();
    await page.locator("label", { hasText: "Beschäftigung, Personalmanagement" }).locator("input").check();
    await page.waitForTimeout(300);
    const t = await bodyText(page);
    ok("Studierende: KI-Dokumente nur über Richtlinien-Kontingent", t.includes("für Studierende über „Richtlinien“") && !(await page.locator("select[aria-label='Dokument wählen']").count()));
  }
  await page.locator("button", { hasText: "Bericht erstellen" }).first().click().catch(() => {});
  await page.waitForTimeout(600);
  ok("Studierende: keine JS-Fehler", errs.length === 0, errs.slice(0, 3).join(" | "));
  await ctx.close();
}

await browser.close();
const fail = results.filter(r => !r.pass);
writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 1));
console.log(`\n${results.length - fail.length}/${results.length} bestanden`);
process.exit(fail.length ? 1 : 0);
