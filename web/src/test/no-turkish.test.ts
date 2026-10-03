/**
 * CI Guard: Ensures the codebase contains no Turkish text.
 *
 * Project policy (see mem://constraints/language-and-localization):
 *   - Strictly DE/EN bilingual.
 *   - Non-English characters limited to German umlauts (ä, ö, ü, ß) and ß.
 *   - Turkish-only characters (ç, ğ, ı, ş, İ, Ç, Ğ, Ş) are forbidden.
 *   - Common Turkish stop words / verbs are forbidden even without diacritics.
 *
 * The scanner walks `src/` and `supabase/`, skipping this file itself,
 * lockfiles, build artifacts, and binary assets.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOTS = ["src", "supabase"];
const SCAN_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".md", ".html", ".css", ".sql", ".toml", ".yml", ".yaml",
]);
const SKIP_DIRS = new Set([
  "node_modules", "dist", "build", ".git", ".next", ".turbo", "coverage",
]);
// Skip the scanner itself so its own patterns do not self-trigger.
const SELF = "src/test/no-turkish.test.ts";

// Turkish-only characters (German umlauts ä/ö/ü/ß are explicitly allowed).
const TR_CHAR_RE = /[çğışİÇĞŞ]/;

// Common Turkish stop-words/verbs that do not require diacritics.
// Word-bounded, case-insensitive.
const TR_WORD_RE = new RegExp(
  "\\b(" +
    [
      "Madde",
      "silindi",
      "iceriği",
      "birlestir",
      "kopyaland",
      "panoya",
      "kullanici",
      "guvenlik",
      "yonetim",
      "sirket",
      "calisan",
      "tarand",
    ].join("|") +
  ")\\b",
  "i",
);

function walk(dir: string, acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, acc);
    } else if (st.isFile() && SCAN_EXT.has(extname(name))) {
      acc.push(full);
    }
  }
  return acc;
}

describe("language policy — no Turkish in source", () => {
  const files = ROOTS.flatMap((r) => walk(r)).filter(
    (f) => relative(".", f) !== SELF,
  );

  it("scans at least one file", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("contains no Turkish-only characters (ç, ğ, ı, ş, İ)", () => {
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        if (TR_CHAR_RE.test(line)) {
          hits.push(`${file}:${i + 1}  ${line.trim().slice(0, 160)}`);
        }
      });
    }
    expect(hits, `Turkish characters found:\n${hits.join("\n")}`).toEqual([]);
  });

  it("contains no common Turkish stop-words", () => {
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        if (TR_WORD_RE.test(line)) {
          hits.push(`${file}:${i + 1}  ${line.trim().slice(0, 160)}`);
        }
      });
    }
    expect(hits, `Turkish stop-words found:\n${hits.join("\n")}`).toEqual([]);
  });
});
