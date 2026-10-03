/**
 * Y8 · Deckungsdeckel bei framework-übergreifender Übernahme.
 *
 * Codex-Befund (2026-09-12): „Eine positive NIS2-Antwort auf einer geteilten
 * Kontrolle darf für ISO nicht ohne Geltungsbereichs-, Zeitraum- und
 * Nachweisentscheid automatisch voll/100 % erzeugen."
 *
 * Diese Tests fixieren die Regel, damit sie nicht versehentlich zurückgebaut
 * wird — insbesondere die beiden Grenzen: (1) eigene Antworten und Antworten
 * aus DEMSELBEN Framework werden NICHT gedeckelt, (2) ein bestätigter
 * Deckungsentscheid hebt den Deckel auf.
 */
import { describe, it, expect } from "vitest";
import { projectAnswer, type AnswerRow, type ControlRow, type CoverageResolver } from "@/lib/assessmentEngine";

const isoControl: ControlRow = {
  id: "iso-crypto", framework: "ISO27001", sub_sector: null,
  req_de: "Kryptographie", req_en: "Cryptography", muss: null, tags: null, meta: null,
};

const nis2Ja: AnswerRow = {
  framework: "NIS2", control_id: "C39.1", antwort: "ja",
  evidence: null, note: null, updated_at: "2026-09-01T10:00:00.000Z",
};

/** Ein gemeinsamer same-as-Knoten: NIS2-Antwort ist Anker der ISO-Kontrolle. */
const anchors = new Map([["ISO27001::iso-crypto", [{ anchorId: "node-crypto", relation: "equal" as const }]]]);
const anchorAnswers = new Map<string, AnswerRow[]>([["node-crypto", [nis2Ja]]]);

describe("Y8 Deckungsprüfung", () => {
  it(`deckelt ein geerbtes NIS2-„ja“ ohne Entscheid auf teilweise`, () => {
    const eff = projectAnswer(isoControl, undefined, anchorAnswers, anchors);
    expect(eff.status).toBe("teilweise");
    expect(eff.scopeReviewPending).toBe(true);
    expect(eff.scopeReviewFrom?.framework).toBe("NIS2");
    expect(eff.scopeReviewFrom?.status).toBe("ja");
    // Eine gedeckelte Übernahme ist NICHT „voll" — sonst widerspricht der
    // Bericht dem Status.
    expect(eff.projectionQuality).toBe("partial");
  });

  it(`lässt das „ja“ voll gelten, wenn die Deckung bestätigt ist`, () => {
    const coverage: CoverageResolver = () => "voll";
    const eff = projectAnswer(isoControl, undefined, anchorAnswers, anchors, { coverage });
    expect(eff.status).toBe("ja");
    expect(eff.scopeReviewPending).toBeUndefined();
    expect(eff.projectionQuality).toBe("full");
  });

  it(`hält „teilweise gedeckt“ auf teilweise, aber ohne offenen Prüfpunkt`, () => {
    const coverage: CoverageResolver = () => "teilweise";
    const eff = projectAnswer(isoControl, undefined, anchorAnswers, anchors, { coverage });
    expect(eff.status).toBe("teilweise");
    expect(eff.scopeReviewPending).toBeUndefined();
    expect(eff.scopeReviewFrom?.framework).toBe("NIS2");
  });

  it("deckelt eine EIGENE Antwort nicht", () => {
    const own: AnswerRow = {
      framework: "ISO27001", control_id: "iso-crypto", antwort: "ja",
      evidence: null, note: null, updated_at: "2026-09-02T10:00:00.000Z",
    };
    const eff = projectAnswer(isoControl, own, anchorAnswers, anchors);
    expect(eff.status).toBe("ja");
    expect(eff.origin).toBe("explicit");
    expect(eff.scopeReviewFrom).toBeUndefined();
  });

  it(`deckelt „nein“ und „teilweise“ nicht — der Deckel gilt nur nach oben`, () => {
    const nis2Nein: AnswerRow = { ...nis2Ja, antwort: "nein" };
    const eff = projectAnswer(isoControl, undefined, new Map([["node-crypto", [nis2Nein]]]), anchors);
    expect(eff.status).toBe("nein");
    expect(eff.scopeReviewFrom).toBeUndefined();
  });

  it("liefert im weighted-Modus dieselbe Zahl wie im LWW-Modus", () => {
    const lww = projectAnswer(isoControl, undefined, anchorAnswers, anchors);
    const weighted = projectAnswer(isoControl, undefined, anchorAnswers, anchors, { mode: "weighted" });
    expect(weighted.status).toBe(lww.status);
    expect(weighted.scopeReviewPending).toBe(lww.scopeReviewPending);
  });
});
