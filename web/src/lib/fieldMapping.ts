// Simple JSON-path resolver: supports "a.b.c", "a.b[0].c", "*" root array.
export function resolvePath(obj: unknown, path: string): unknown {
  if (!path) return undefined;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

// Given a JSON payload, try to auto-detect the array of records.
export function detectRecordArray(payload: unknown): { rootPath: string; records: any[] } {
  if (Array.isArray(payload)) return { rootPath: "", records: payload };
  if (payload && typeof payload === "object") {
    // Common wrappers
    for (const key of ["result", "data", "items", "records", "value", "results"]) {
      const v = (payload as any)[key];
      if (Array.isArray(v)) return { rootPath: key, records: v };
    }
    // Fallback: first array-valued field
    for (const [k, v] of Object.entries(payload as any)) {
      if (Array.isArray(v)) return { rootPath: k, records: v as any[] };
    }
  }
  return { rootPath: "", records: [] };
}

// Flatten first record keys to help user pick source fields.
export function collectSourceFields(records: any[], limit = 20): string[] {
  const set = new Set<string>();
  for (const r of records.slice(0, limit)) {
    if (r && typeof r === "object") {
      Object.keys(r).forEach((k) => set.add(k));
    }
  }
  return [...set].sort();
}

export type MappingTarget = "asset_name" | "asset_type" | "environment" | "vendor" | "owner" | "external_id" | "service_name";

export const ASSET_TARGETS: { key: MappingTarget; label: string; required?: boolean }[] = [
  { key: "external_id", label: "External ID", required: true },
  { key: "asset_name",  label: "Asset Name", required: true },
  { key: "asset_type",  label: "Type" },
  { key: "environment", label: "Environment" },
  { key: "vendor",      label: "Vendor" },
  { key: "owner",       label: "Owner" },
  { key: "service_name",label: "Linked Service (by name)" },
];

export type FieldMap = Partial<Record<MappingTarget, string>>;

export function applyMapping(records: any[], map: FieldMap) {
  return records.map((r) => {
    const out: any = {};
    for (const [tgt, path] of Object.entries(map)) {
      if (path) out[tgt] = resolvePath(r, path);
    }
    return out;
  });
}
