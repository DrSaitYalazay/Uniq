#!/usr/bin/env node
/**
 * check-undefined-imports — findet Bezeichner, die benutzt, aber weder importiert
 * noch definiert sind (z. B. `useCallback` ohne React-Import).
 *
 * Warum: esbuild/vite bündeln solche Fehler klaglos — die Seite stürzt erst zur
 * LAUFZEIT ab („ReferenceError: useCallback is not defined", 11.09.2026 auf
 * /roadmap). tsc würde es finden, läuft aber nicht im Build. Dieser Check ist
 * schnell (< 1 s) und läuft im Deploy vor dem Docker-Build.
 *
 * Aufruf: node scripts/check-undefined-imports.mjs [srcDir]
 * Exit 1 + ::error, wenn etwas fehlt.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.argv[2] ?? "src";

/** Bekannte Browser-/JS-/TS-Globals, die nie importiert werden müssen. */
const GLOBALS = new Set([
  "window", "document", "console", "Math", "JSON", "Object", "Array", "String", "Number", "Boolean",
  "Date", "Set", "Map", "WeakMap", "WeakSet", "Promise", "Error", "RegExp", "Intl", "URL", "URLSearchParams",
  "Blob", "File", "FileReader", "FormData", "Headers", "Request", "Response", "AbortController",
  "Image", "Audio", "Event", "CustomEvent", "MutationObserver", "IntersectionObserver", "ResizeObserver",
  "TextEncoder", "TextDecoder", "Uint8Array", "ArrayBuffer", "DataView", "Symbol", "Proxy", "Reflect",
  "BigInt", "Infinity", "NaN", "React", "globalThis", "process", "structuredClone", "crypto", "performance",
  "setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame",
  "fetch", "alert", "confirm", "prompt", "btoa", "atob", "encodeURIComponent", "decodeURIComponent",
  "parseInt", "parseFloat", "isNaN", "isFinite", "Function", "Buffer", "NodeJS", "JSX",
]);

/** Sprachkonstrukte, die syntaktisch wie ein Aufruf aussehen. */
const KEYWORDS = new Set([
  "if", "for", "while", "switch", "catch", "return", "typeof", "instanceof", "void", "await",
  "new", "delete", "in", "of", "do", "else", "function", "class", "import", "export", "yield",
  "super", "this", "constructor", "require",
]);

/** camelCase-CSS-Funktionen in Style-Strings — keine JS-Aufrufe. */
const CSS_FUNCS = new Set([
  "translateX", "translateY", "translateZ", "translate3d", "scaleX", "scaleY", "scaleZ",
  "rotateX", "rotateY", "rotateZ", "skewX", "skewY", "linearGradient", "radialGradient",
  "cubicBezier", "colorMix", "fitContent", "minMax",
]);

/**
 * Kommentare und String-Literale entfernen — ZEILENWEISE.
 *
 * Die frühere Fassung lief über die ganze Datei und behandelte jedes `'` als
 * String-Anfang. In JSX-Text („Don't", „l'accès") ist ein Apostroph aber
 * bloßer Text: der Scanner lief dann bis zum nächsten Apostroph mehrere
 * hundert Zeilen weiter und löschte alles dazwischen — darunter echte
 * Deklarationen. Der Wächter meldete daraufhin Dutzende „fehlende Importe",
 * die es nie gab (12.09.2026), und wurde dadurch unbrauchbar.
 *
 * Jetzt wird Zeile für Zeile gearbeitet und nur ein VOLLSTÄNDIG geschlossenes
 * Anführungszeichen-Paar innerhalb derselben Zeile entfernt. Ein einzelner
 * Apostroph bleibt stehen und schadet nicht — er erzeugt keinen Aufruf.
 * Blockkommentare sind der einzige Zustand, der über Zeilen hinweg gilt.
 * Template-Literale bleiben absichtlich erhalten: ihr `${…}` enthält echten
 * Code, der geprüft werden muss.
 */
function stripCommentsAndStrings(src) {
  const out = [];
  let inBlock = false;
  for (let line of src.split("\n")) {
    if (inBlock) {
      const end = line.indexOf("*/");
      if (end < 0) { out.push(""); continue; }
      line = line.slice(end + 2);
      inBlock = false;
    }
    // Blockkommentare innerhalb der Zeile
    for (;;) {
      const s = line.indexOf("/*");
      if (s < 0) break;
      const e = line.indexOf("*/", s + 2);
      if (e < 0) { line = line.slice(0, s); inBlock = true; break; }
      line = line.slice(0, s) + " " + line.slice(e + 2);
    }
    // Zeilenkommentar (nicht innerhalb eines Strings — grobe, ausreichende Regel)
    line = line.replace(/(^|[^:"'\\])\/\/.*$/, "$1");
    // Nur geschlossene Anführungszeichen-Paare leeren
    line = line.replace(/"(?:[^"\\\n]|\\.)*"/g, '""').replace(/'(?:[^'\\\n]|\\.)*'/g, '""');
    out.push(line);
  }
  return out.join("\n");
}

function collectFiles(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) collectFiles(p, acc);
    else if ([".ts", ".tsx"].includes(extname(p))) acc.push(p);
  }
  return acc;
}

const problems = [];
for (const file of collectFiles(ROOT)) {
  const raw = readFileSync(file, "utf8");
  const code = stripCommentsAndStrings(raw);

  const imported = new Set();
  for (const m of code.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from/gs)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop()?.trim();
      if (name) imported.add(name);
    }
  }
  for (const m of code.matchAll(/import\s+(?:type\s+)?([A-Za-z_$][\w$]*)\s*(?:,|from)/g)) imported.add(m[1]);
  for (const m of code.matchAll(/import\s+\*\s+as\s+([A-Za-z_$][\w$]*)/g)) imported.add(m[1]);
  if (/import\s+(?:\*\s+as\s+)?React\b/.test(code)) imported.add("React");

  // Import-Anweisungen zeilenweise entfernen. Die frühere Fassung nutzte
  // /^\s*import[\s\S]*?from\s*""\s*$/gm — ein `[\s\S]*?` über Zeilengrenzen.
  // Traf es ein `import` ohne `from ""` (CSS-Import, dynamischer Import am
  // Zeilenanfang), fraß der Ausdruck den halben Dateirumpf mit; darin
  // verschwanden echte Deklarationen und der Wächter meldete sie als fehlende
  // Importe. Jetzt wird Zeile für Zeile entschieden.
  const body = (() => {
    const out = [];
    const lines = code.split("\n");
    let inImport = false;
    for (const line of lines) {
      if (!inImport && /^\s*import\b(?!\s*\()/.test(line)) {
        // Einzeiler: endet mit "" (Pfad wurde zu "" entschärft) oder ;
        const done = /from\s*""\s*;?\s*$/.test(line) || /^\s*import\s*""\s*;?\s*$/.test(line);
        inImport = !done;
        out.push("");
        continue;
      }
      if (inImport) {
        if (/from\s*""\s*;?\s*$/.test(line) || /^\s*""\s*;?\s*$/.test(line)) inImport = false;
        out.push("");
        continue;
      }
      out.push(line);
    }
    return out.join("\n");
  })();
  const declared = new Set();
  for (const m of body.matchAll(/\b(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
  for (const m of body.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);

  // Methoden-Kurzschreibweise in Objekt-/Klassenkörpern zählt als Deklaration:
  //   { foo() {…} }  /  class X { foo() {…} }
  // Sonst würde der Aufruf `foo(` als fehlender Import gemeldet.
  // `.*` statt `[^)]*`: Typannotationen enthalten selbst Klammern, etwa
  //   onAuthStateChange(cb: (e: X, s: Y) => void) {
  for (const m of body.matchAll(/^\s*(?:public\s+|private\s+|protected\s+|static\s+|async\s+|get\s+|set\s+)*([A-Za-z_$][\w$]*)\s*\(.*\)\s*[:{]/gm)) declared.add(m[1]);
  // Destrukturierung und Parameter binden ebenfalls Namen.
  for (const m of body.matchAll(/(?:const|let|var)\s*[{[]([^}\]]*)[}\]]/g)) {
    for (const part of m[1].split(",")) {
      const n = part.split(":").pop()?.split("=")[0]?.replace(/[.\s]/g, "");
      if (n) declared.add(n);
    }
  }

  /**
   * Hook-Aufrufe (use…) — die bekannte Sturz-Klasse (11.09.2026, /roadmap).
   */
  for (const m of body.matchAll(/(?<![\w.$])(use[A-Z][\w$]*)\s*\(/g)) {
    const name = m[1];
    if (!imported.has(name) && !declared.has(name) && !GLOBALS.has(name)) {
      problems.push(`${file}: ${name} wird benutzt, ist aber nicht importiert/definiert`);
    }
  }

  /**
   * JEDER andere Funktionsaufruf — dieselbe Sturz-Klasse, nur ohne „use".
   *
   * Warum diese Erweiterung: `resolveChartHex(...)` in riskEngine.ts war nicht
   * importiert. Der alte Wächter prüfte nur Hooks und ließ es durch; die
   * Risikoanalyse stürzte live beim Laden des Moduls ab (12.09.2026).
   *
   * Falschmeldungen vermeiden: gemeldet wird nur, wenn der Name in der ganzen
   * Datei AUSSCHLIESSLICH als Aufruf vorkommt. Ein Parameter, eine lokale
   * Variable oder eine Objektmethode steht immer noch irgendwo ohne Klammer —
   * dann schweigt die Prüfung. Ein fehlender Import hat dagegen genau so viele
   * Vorkommen wie Aufrufe.
   */
  for (const m of body.matchAll(/(?<![\w.$?])([a-z_$][\w$]*)\s*\(/g)) {
    const name = m[1];
    if (imported.has(name) || declared.has(name) || GLOBALS.has(name)) continue;
    if (KEYWORDS.has(name)) continue;
    // Nur camelCase-Namen (mindestens ein Großbuchstabe ab Stelle 2). Das ist
    // die Form, die importierte Hilfsfunktionen praktisch immer haben
    // (resolveChartHex, subscribeAccent, getStoredAccent). Fließtext in JSX
    // („vendor (Lieferant)") und CSS-Funktionen (hsl, var, calc) sind
    // kleingeschrieben und lösen damit keine Falschmeldung mehr aus.
    if (!/[A-Z]/.test(name.slice(1))) continue;
    if (CSS_FUNCS.has(name)) continue;
    const calls = (body.match(new RegExp(`(?<![\\w.$])${name}\\s*\\(`, "g")) || []).length;
    const bare  = (body.match(new RegExp(`(?<![\\w.$])${name}(?![\\w$])`, "g")) || []).length;
    if (calls > 0 && bare === calls) {
      problems.push(`${file}: ${name}() wird aufgerufen, ist aber nicht importiert/definiert`);
    }
  }
}

const unique = [...new Set(problems)];
if (unique.length) {
  for (const p of unique) console.error(`::error::${p}`);
  console.error(`\n${unique.length} fehlende(r) Import(e) gefunden — Build abgebrochen.`);
  process.exit(1);
}
console.log("check-undefined-imports: OK (keine fehlenden Imports)");
