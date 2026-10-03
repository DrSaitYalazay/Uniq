/**
 * ScenarioList — „Was droht konkret": nummerierte, klar getrennte Risikoszenarien
 * je betroffener Kontrolle (Katalog `risks`). Katalogtexte sind lang (600–900
 * Zeichen) → standardmäßig Kurzfassung (erste 1–2 Sätze), Volltext per „Mehr".
 * Gemeinsam für Risikoanalyse (Accordion) und Risikobehandlung (TreatmentTable).
 */
import { useState } from "react";
import type { RiskScenario } from "@/lib/riskEngine";

/**
 * Kurzfassung: ganze Sätze (mind. ~120 Zeichen, max. 300), nie mitten im Wort.
 * Ein einzelner Satz > 300 Zeichen wird an einer Satzteil-Grenze („:", „–", „;", „,")
 * gekürzt und mit „…" markiert. Auf dem Katalog (2.426 Texte) geprüft: 50–300 Zeichen,
 * Ø 184, kein Abbruch mitten im Satz.
 */
/** Satzgrenzen: „. ! ?" gefolgt von Leerzeichen + Großbuchstabe/Ziffer/Anführung — Abkürzungen
 *  (Art., Abs., Nr., z. B., bzw., ggf., u. a., i. V. m., gem., vgl., Mio., jeder Einzelbuchstabe)
 *  trennen NICHT; innerhalb eines „…"-Zitats wird nie getrennt (eingebettete Prüffragen). */
const ABBR = /(?:\b(?:Art|Abs|Nr|Nrn|Ziff|lit|bzw|ggf|gem|vgl|evtl|inkl|zzgl|etc|ca|sog|usw|Dr|Prof|Hr|Fr|St|Mio|Mrd|Tsd|Std|Min|max|min|ff|Anh|Kap|Abschn|Rn|Buchst|Alt|Var|EG|VO|RL|Bd|Aufl)|\b[A-Za-zÄÖÜäöü])\.$/;
export function splitSentences(t: string): string[] {
  const out: string[] = [];
  let start = 0;
  let quote = 0; // Tiefe „…" / "…"
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === "„" || ch === "»") { quote++; continue; }
    if ((ch === "“" || ch === "«") && quote > 0) { quote--; continue; }
    if (ch === "\"") { quote = quote > 0 ? quote - 1 : 1; continue; }
    if (ch !== "." && ch !== "!" && ch !== "?") continue;
    if (quote > 0) continue;
    let j = i; while (j + 1 < t.length && /[.!?)]/.test(t[j + 1])) j++;
    const atEnd = j + 1 >= t.length;
    const boundary = atEnd || /^\s+[A-ZÄÖÜ0-9„"“(§]/.test(t.slice(j + 1, j + 4));
    if (!boundary) { i = j; continue; }
    if (ch === "." && ABBR.test(t.slice(start, i + 1).trimEnd())) { i = j; continue; }
    out.push(t.slice(start, j + 1).trim());
    start = j + 1; i = j;
  }
  const rest = t.slice(start).trim();
  if (rest) out.push(rest);
  return out.filter(Boolean);
}

export function scenarioSummary(text: string, limit = 220): { short: string; truncated: boolean } {
  const t = (text ?? "").trim();
  if (t.length <= limit) return { short: t, truncated: false };
  const sentences = splitSentences(t);
  let out = "";
  for (const sen of sentences) {
    if (out && (out + " " + sen).length > Math.max(limit, 300)) break;
    out = out ? out + " " + sen : sen;
    if (out.length >= 120) break;
  }
  if (out.length > 300) {
    const cut = out.slice(0, 280);
    const m = cut.match(/^(.*?)[,;:–—-]\s[^,;:–—-]*$/);
    out = (m ? m[1] : cut.replace(/\s+\S*$/, "")) + " …";
  }
  return { short: out, truncated: out.length < t.length };
}

function ScenarioItem({ sc, idx, de }: { sc: RiskScenario; idx: number; de: boolean }) {
  const [open, setOpen] = useState(false);
  const full = (de ? sc.text_de : sc.text_en) || sc.text_de || "";
  const { short, truncated } = scenarioSummary(full);
  const missing = sc.finding_type === "missing";
  return (
    <li className="flex gap-3 rounded-lg border border-border bg-card/60 p-3">
      <span className={`shrink-0 mt-0.5 inline-flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${missing ? "bg-destructive/15 text-destructive" : "st-teilweise-tint st-teilweise-text"}`}>
        {idx + 1}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-mono text-[10px] text-muted-foreground">{sc.control_id}</span>
          <span className="text-sm font-medium text-foreground leading-snug">{de ? sc.control_title : sc.control_title_en}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${missing ? "border-destructive/40 text-destructive" : "st-teilweise-border st-teilweise-text"}`}>
            {missing ? (de ? "fehlt" : "missing") : (de ? "teilweise" : "partial")}
          </span>
        </div>
        <p className="text-[13px] text-foreground/85 leading-relaxed whitespace-normal break-words">
          {open || !truncated ? full : short}
        </p>
        {truncated && (
          <button type="button" onClick={() => setOpen(o => !o)} className="text-[11px] font-medium text-primary hover:underline">
            {open ? (de ? "Weniger anzeigen" : "Show less") : (de ? "Mehr anzeigen" : "Show more")}
          </button>
        )}
      </div>
    </li>
  );
}

export function ScenarioList({ scenarios, de, max = 4, moreHint }: {
  scenarios: RiskScenario[]; de: boolean; max?: number; moreHint?: string;
}) {
  if (!scenarios?.length) return null;
  return (
    <ol className="space-y-2">
      {scenarios.slice(0, max).map((sc, i) => <ScenarioItem key={`${sc.control_id}-${i}`} sc={sc} idx={i} de={de} />)}
      {scenarios.length > max && (
        <li className="text-[11px] text-muted-foreground pl-9">
          {moreHint ?? (de ? `+ ${scenarios.length - max} weitere Szenarien` : `+ ${scenarios.length - max} more scenarios`)}
        </li>
      )}
    </ol>
  );
}
