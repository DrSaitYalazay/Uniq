/**
 * Framework registry — shared types.
 *
 * All compliance frameworks (ISO 27001, NIS2, BSI IT-Grundschutz, TISAX,
 * DORA…) declare their control catalogue with the same shape. ISO 27001
 * Annex A (2022) is the MASTER; every other framework maps onto it via
 * files under `src/data/frameworkMappings/`.
 */

export type FrameworkId = "iso27001" | "nis2" | "bsi" | "tisax" | "dora";

export type AnswerStatus = "ja" | "teilweise" | "nein" | "entbehrlich";

export interface ControlDef {
  /** Framework-local id (e.g. "A.5.1", "NIS2-21-2-a", "SYS.1.1"). */
  id: string;
  /** Framework this control belongs to. */
  framework: FrameworkId;
  /** Group / theme (Annex A: Organizational/People/Physical/Technological). */
  theme: string;
  titleDe: string;
  titleEn: string;
  descriptionDe?: string;
  descriptionEn?: string;
  /** Optional legal / standard reference. */
  reference?: string;
}

export interface FrameworkCatalog {
  id: FrameworkId;
  version: string;
  labelDe: string;
  labelEn: string;
  /** True for ISO 27001 — the canonical write target. */
  isMaster: boolean;
  controls: ControlDef[];
}
