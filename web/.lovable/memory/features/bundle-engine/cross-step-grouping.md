---
name: ISO-Bundle cross-step grouping & owner
description: The 59 ISO 27001:2022 Annex A controls form a shared mid-layer between Steps 8 (Risk), 9 (Decisions) and 15 (Roadmap). Owner overrides live in nis2-bundle-owners, editable in Step 9 + Step 15, read-only mirror in Step 8.
type: feature
---

Hierarchy across the pipeline:
NIS2 main category (unchanged) → ISO bundle (one of 59 Annex A controls) → individual measure/risk.

## Shared state
`useToolData("nis2-bundle-owners")` via `useBundleOwners()` (`src/hooks/useBundleOwners.ts`).
- Shape: `{ owners: Record<isoRef, { owner: string; updated_at: string }> }`
- `resolveOwner(key, memberOwners)` → explicit override > majority of member owners > "".

## Mapping helpers (`src/lib/bundleEngine.ts`)
- `getIsoRefForControl(controlId)` — majority vote across catalog measure `iso_ref`s.
- `getIsoRefForRisk(risk)` — majority vote across risk.supporting_findings via the helper above; fallback to `related_gap_id` prefix.
- `getBundleMeta(key)`, `groupByBundle`, `sortBundleKeys`, `STANDALONE_BUNDLE_KEY`.

## View-mode toggle (Steps 8 & 9, Roadmap-pattern)
Both pages have a small "Detailliert / Nach ISO-Bundle" pill toggle.
- Default = `detailed` (flat list — current UX unchanged).
- `consolidated` = collapse risks/treatments into bundle accordion cards. Default closed.

## Editability per step
- Step 9 Decisions: inline `PersonnelPicker` in bundle header → writes via `setBundleOwner`.
- Step 15 Roadmap: inline `PersonnelPicker` in bundle header (consolidated mode).
- Step 8 RiskMatrix: read-only owner badge (mirror of explicit override). No write here — risk is identification, not assignment.

## Invariants
- Per-measure / per-risk owner remains the source of truth for workload chart and KPI engine. Bundle-owner is a lead/RACI-A marker only.
- Standalone bucket key `__no_iso__` collects items with no derivable ISO ref. No write to owner allowed there.
- All new accordions default-collapsed (memory rule).
