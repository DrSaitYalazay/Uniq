import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function latestMigrationContaining(fragment: string): string {
  const dir = join(process.cwd(), "supabase", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (let i = files.length - 1; i >= 0; i--) {
    const body = readFileSync(join(dir, files[i]), "utf8");
    if (body.includes(fragment)) return body;
  }
  throw new Error(`missing migration containing ${fragment}`);
}

function allMigrationsSql(): string {
  const dir = join(process.cwd(), "supabase", "migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .join("\n");
}

describe("lecturer team entitlement", () => {
  it("keeps lecturer organizations at 50 invited students plus the lecturer owner", () => {
    const sql = latestMigrationContaining("CREATE OR REPLACE FUNCTION public.org_seat_limit");
    expect(sql).toMatch(/role::text\s+IN\s*\(\s*'admin'\s*,\s*'lecturer'\s*\)[\s\S]*THEN\s+51/i);
    expect(allMigrationsSql()).toMatch(/org_total_seat_count\(org_id\)\s*<\s*public\.org_seat_limit\(org_id\)/i);
  });

  it("uses the same classroom limit in the frontend", () => {
    const source = readFileSync(join(process.cwd(), "src", "lib", "tierConfig.ts"), "utf8");
    expect(source).toMatch(/lecturer:\s*51/);
    expect(source).toMatch(/flags\.isLecturer[\s\S]*SEAT_LIMITS\.lecturer/);
  });
});