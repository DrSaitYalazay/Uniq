/**
 * Control Catalog Generator
 *
 * Generates ISO 27002 + BSI IT-Grundschutz aligned measures and risks
 * for every NIS2 control, via Lovable AI Gateway.
 *
 * Run: bun run scripts/generate_control_catalog.ts
 *
 * Output: src/data/controlCatalog.ts
 * Resume cache: /tmp/catalog_progress.json
 */

import { nis2Domains } from "../src/data/nis2Controls";
import { controlMetadata } from "../src/data/controlMetadata";
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const API_KEY = process.env.LOVABLE_API_KEY;
if (!API_KEY) {
  console.error("LOVABLE_API_KEY missing");
  process.exit(1);
}

const MODEL = process.env.MODEL || "google/gemini-2.5-flash";
const ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";
const PROGRESS_FILE = "/tmp/catalog_progress.json";
const OUTPUT_FILE = "src/data/controlCatalog.ts";
const DELAY_MS = parseInt(process.env.DELAY_MS || "300");

type Progress = Record<string, any>;
const progress: Progress = existsSync(PROGRESS_FILE)
  ? JSON.parse(readFileSync(PROGRESS_FILE, "utf-8"))
  : {};

const SYSTEM_PROMPT = `Du bist ein erfahrener ISO/IEC 27002:2022 + BSI IT-Grundschutz Auditor mit Spezialisierung auf NIS2.
Aufgabe: Generiere für eine konkrete NIS2-Kontrolle praxistaugliche, marktübliche Maßnahmen und typische Risiken.

Anforderungen:
- 4-6 Maßnahmen, jede konkret umsetzbar (kein Marketing, keine Platzhalter)
- 3-4 typische Risiken (Bedrohung + Auswirkung)
- Zweisprachig: Deutsch + Englisch
- ISO 27002:2022 und BSI IT-Grundschutz Referenzen wenn passend
- Likelihood/Impact als Markt-Baseline (1-5) realistisch eingestuft
- Sprachstil: professionell, präzise, audit-tauglich
- KEINE türkischen Wörter, KEINE Emojis`;

const tool = {
  type: "function",
  function: {
    name: "emit_catalog",
    description: "Emit measures and typical risks for the control",
    parameters: {
      type: "object",
      properties: {
        measures: {
          type: "array",
          minItems: 4,
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              title_de: { type: "string" },
              title_en: { type: "string" },
              description_de: { type: "string", description: "2-3 Sätze, umsetzungsorientiert" },
              description_en: { type: "string" },
              effort: { type: "string", enum: ["low", "medium", "high"] },
              priority: { type: "string", enum: ["must", "should", "could"] },
              iso_ref: { type: "string", description: "z.B. 'ISO 27002:2022 A.5.17' (leer wenn nicht passend)" },
              bsi_ref: { type: "string", description: "z.B. 'ORP.4.A8' (leer wenn nicht passend)" },
            },
            required: ["title_de", "title_en", "description_de", "description_en", "effort", "priority", "iso_ref", "bsi_ref"],
            additionalProperties: false,
          },
        },
        risks: {
          type: "array",
          minItems: 3,
          maxItems: 4,
          items: {
            type: "object",
            properties: {
              title_de: { type: "string" },
              title_en: { type: "string" },
              description_de: { type: "string", description: "Bedrohung + konkrete Auswirkung" },
              description_en: { type: "string" },
              cia: {
                type: "array",
                items: { type: "string", enum: ["C", "I", "A"] },
                minItems: 1,
              },
              typical_likelihood: { type: "integer", minimum: 1, maximum: 5 },
              typical_impact: { type: "integer", minimum: 1, maximum: 5 },
              threat_category: {
                type: "string",
                description: "z.B. Malware, Insider, Supply Chain, Misconfiguration, Phishing, DoS, Physical, Compliance",
              },
            },
            required: ["title_de", "title_en", "description_de", "description_en", "cia", "typical_likelihood", "typical_impact", "threat_category"],
            additionalProperties: false,
          },
        },
      },
      required: ["measures", "risks"],
      additionalProperties: false,
    },
  },
};

async function callAI(controlId: string, ctx: any, retry = 0): Promise<any> {
  const userPrompt = `NIS2-Kontrolle:
ID: ${controlId}
Kategorie: ${ctx.category} (${ctx.article})
Familie: ${ctx.family}
Scope: ${ctx.scope}

Frage (DE): ${ctx.question_de}
Frage (EN): ${ctx.question_en}

Beschreibung (DE): ${ctx.description_de}
Beschreibung (EN): ${ctx.description_en}

Generiere jetzt die Maßnahmen und typischen Risiken für genau diese Kontrolle.`;

  const resp = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      tools: [tool],
      tool_choice: { type: "function", function: { name: "emit_catalog" } },
      temperature: 0.3,
    }),
  });

  if (resp.status === 429 || resp.status >= 500) {
    if (retry < 4) {
      const wait = 2000 * Math.pow(2, retry);
      console.warn(`  [${controlId}] ${resp.status} — retry in ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
      return callAI(controlId, ctx, retry + 1);
    }
    throw new Error(`HTTP ${resp.status} after retries: ${await resp.text()}`);
  }
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);

  const json = await resp.json();
  const call = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) throw new Error(`No tool call: ${JSON.stringify(json).slice(0, 300)}`);
  return JSON.parse(call.function.arguments);
}

// Walk controls
type ControlCtx = {
  id: string;
  category: string;
  article: string;
  family: string;
  scope: string;
  question_de: string;
  question_en: string;
  description_de: string;
  description_en: string;
};

const controls: ControlCtx[] = [];
for (const domain of nis2Domains) {
  for (const cat of domain.categories) {
    for (const q of cat.questions) {
      const meta = (controlMetadata as any)[q.id] ?? {};
      controls.push({
        id: q.id,
        category: cat.title,
        article: cat.article,
        family: meta.familyId ?? "unknown",
        scope: meta.scope ?? "organization",
        question_de: q.question,
        question_en: q.questionEn,
        description_de: q.description,
        description_en: q.descriptionEn,
      });
    }
  }
}

const LIMIT = process.env.CONTROL_LIMIT ? parseInt(process.env.CONTROL_LIMIT) : controls.length;
const SKIP_WRITE = process.env.SKIP_WRITE === "1";
console.log(`Total controls: ${controls.length} (processing ${LIMIT})`);
console.log(`Already cached: ${Object.keys(progress).length}`);

const todo = controls.slice(0, LIMIT);

const CONCURRENCY = parseInt(process.env.CONCURRENCY || "6");
let done = todo.filter((c) => progress[c.id]).length;
let failed = 0;
const start = Date.now();
const queue = todo.filter((c) => !progress[c.id]);
console.log(`Queued: ${queue.length}, concurrency: ${CONCURRENCY}`);

async function worker() {
  while (queue.length) {
    const ctrl = queue.shift();
    if (!ctrl) return;
    try {
      const result = await callAI(ctrl.id, ctrl);
      result.measures.forEach((m: any, i: number) => (m.id = `${ctrl.id}-m${i + 1}`));
      result.risks.forEach((r: any, i: number) => (r.id = `${ctrl.id}-r${i + 1}`));
      progress[ctrl.id] = { control_id: ctrl.id, ...result };
      done++;
      writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
      if (done % 5 === 0) {
        const elapsed = (Date.now() - start) / 1000;
        const rate = done / elapsed;
        const remaining = (todo.length - done) / Math.max(rate, 0.01);
        console.log(`  ${done}/${todo.length} — ${rate.toFixed(2)}/s — ETA ${Math.round(remaining)}s`);
      }
    } catch (e: any) {
      failed++;
      console.error(`  [${ctrl.id}] FAILED: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
console.log(`Done. ${done} ok, ${failed} failed.`);

if (SKIP_WRITE) {
  console.log(`Skipping TS write (SKIP_WRITE=1). Cached ${Object.keys(progress).length} entries.`);
  process.exit(0);
}

// Emit TS file
const header = `/**
 * Control Catalog — ISO 27002:2022 + BSI IT-Grundschutz aligned
 *
 * AUTO-GENERATED by scripts/generate_control_catalog.ts
 * Do not edit by hand — regenerate via the script.
 *
 * Per control:
 *  - 4–6 concrete measures (DE/EN, with effort/priority/standard refs)
 *  - 3–4 typical risks (DE/EN, with likelihood/impact baseline)
 */

export interface CatalogMeasure {
  id: string;
  title_de: string;
  title_en: string;
  description_de: string;
  description_en: string;
  effort: "low" | "medium" | "high";
  priority: "must" | "should" | "could";
  iso_ref: string;
  bsi_ref: string;
}

export interface CatalogRisk {
  id: string;
  title_de: string;
  title_en: string;
  description_de: string;
  description_en: string;
  cia: ("C" | "I" | "A")[];
  typical_likelihood: number;
  typical_impact: number;
  threat_category: string;
}

export interface CatalogEntry {
  control_id: string;
  measures: CatalogMeasure[];
  risks: CatalogRisk[];
}

export const controlCatalog: Record<string, CatalogEntry> = ${JSON.stringify(progress, null, 2)};

export const getCatalogEntry = (controlId: string): CatalogEntry | undefined =>
  controlCatalog[controlId];
`;

writeFileSync(OUTPUT_FILE, header);
console.log(`\n✓ Wrote ${OUTPUT_FILE} with ${Object.keys(progress).length} entries`);
