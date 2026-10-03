import type { ComplianceStatus, NIS2Domain } from "@/data/nis2Controls";

const VALID_STATUSES = new Set<Exclude<ComplianceStatus, null>>(["ja", "teilweise", "nein", "entbehrlich"]);

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sanitizeStatuses = (value: unknown): Record<string, ComplianceStatus> => {
  if (!isRecord(value)) return {};

  const cleaned: Record<string, ComplianceStatus> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === "string" && VALID_STATUSES.has(raw as Exclude<ComplianceStatus, null>)) {
      cleaned[key] = raw as ComplianceStatus;
    }
  }
  return cleaned;
};

const sanitizeComments = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) return {};

  const cleaned: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === "string") cleaned[key] = raw;
  }
  return cleaned;
};

const parsePayload = (
  payload: unknown,
  statuses: Record<string, ComplianceStatus>,
  comments: Record<string, string>,
  depth = 0,
) => {
  if (depth > 4 || !isRecord(payload)) return;

  const hasUnifiedShape = "statuses" in payload || "comments" in payload;

  if (hasUnifiedShape) {
    Object.assign(statuses, sanitizeStatuses(payload.statuses));
    Object.assign(comments, sanitizeComments(payload.comments));

    // Handle previously corrupted nested objects like { statuses: { ..., statuses: {...} } }
    parsePayload(payload.statuses, statuses, comments, depth + 1);
    return;
  }

  // Legacy flat format: { "a-01": "ja", ... }
  Object.assign(statuses, sanitizeStatuses(payload));
};

export interface StoredComplianceCheckData {
  statuses: Record<string, ComplianceStatus>;
  comments: Record<string, string>;
}

export const getStoredComplianceCheckData = (storageKey: string): StoredComplianceCheckData => {
  const statuses: Record<string, ComplianceStatus> = {};
  const comments: Record<string, string> = {};

  const raw = localStorage.getItem(storageKey);
  if (raw) {
    try {
      parsePayload(JSON.parse(raw), statuses, comments);
    } catch {
      // ignore invalid JSON
    }
  }

  // Backward compatibility with old split comments key
  const legacyCommentsRaw = localStorage.getItem(`${storageKey}-comments`);
  if (legacyCommentsRaw) {
    try {
      Object.assign(comments, sanitizeComments(JSON.parse(legacyCommentsRaw)));
    } catch {
      // ignore invalid JSON
    }
  }

  return { statuses, comments };
};

export const hydrateDomainsWithStoredData = (
  domains: NIS2Domain[],
  storedData: StoredComplianceCheckData,
): NIS2Domain[] => {
  const { statuses, comments } = storedData;

  return domains.map((domain) => ({
    ...domain,
    categories: domain.categories.map((cat) => ({
      ...cat,
      questions: cat.questions.map((q) => ({
        ...q,
        status: statuses[q.id] ?? null,
        comment: comments[q.id] ?? "",
      })),
    })),
  }));
};
