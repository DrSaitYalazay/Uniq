/**
 * GlossaryCard — zentrale, management-taugliche Legende für ALLE Kürzel und
 * Fachbegriffe, die im Dashboard und in den Diagrammen vorkommen. Dr. Sait:
 * „kısaltmalar dahi bir yerde referans verilip açıklanmalı" — keine nackten
 * Abkürzungen ohne Erklärung. Ein-/ausklappbar, zweisprachig.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";

interface Term {
  term: { de: string; en: string };
  desc: { de: string; en: string };
}

const TERMS: Term[] = [
  {
    term: { de: "Konformität / Compliance", en: "Conformity / Compliance" },
    desc: {
      de: "Anteil der Anforderungen eines Frameworks, die erfüllt sind — in Prozent.",
      en: "Share of a framework's requirements that are met — as a percentage.",
    },
  },
  {
    term: { de: "Reifegrad (0–5)", en: "Maturity (0–5)" },
    desc: {
      de: "Selbst eingeschätzter Umsetzungsstand einer Maßnahme: 0 = nicht vorhanden, 5 = optimiert/gelebt.",
      en: "Self-assessed implementation level of a measure: 0 = none, 5 = optimised/embedded.",
    },
  },
  {
    term: { de: "Sicherheits-Posture", en: "Security posture" },
    desc: {
      de: "Ein Gesamtscore (0–100) aus vorhandenen Daten: Konformität, Nachweis-Aktualität, Reifegrad, Fristen-Treue und Risiko. Fehlende Teile werden ehrlich weggelassen.",
      en: "One overall score (0–100) from existing data: conformity, evidence freshness, maturity, deadline adherence and risk. Missing parts are honestly dropped.",
    },
  },
  {
    term: { de: "MUSS-Anforderung", en: "MUST requirement" },
    desc: {
      de: "Pflichtanforderung — muss zwingend erfüllt werden (im Gegensatz zu SOLL/Empfehlung).",
      en: "Mandatory requirement — must be met (as opposed to a SHOULD/recommendation).",
    },
  },
  {
    term: { de: "Nachweis (Evidence)", en: "Evidence" },
    desc: {
      de: "Dokument oder Beleg, der belegt, dass eine Kontrolle tatsächlich umgesetzt ist (z. B. Richtlinie, Screenshot, Protokoll).",
      en: "A document or proof that a control is actually implemented (e.g. policy, screenshot, log).",
    },
  },
  {
    term: { de: "Frist / Fristen-Treue", en: "Deadline / deadline adherence" },
    desc: {
      de: "Gesetzliche oder interne Termine (z. B. Meldepflichten). Fristen-Treue = Anteil rechtzeitig erledigter Fristen.",
      en: "Legal or internal due dates (e.g. reporting obligations). Adherence = share of deadlines met on time.",
    },
  },
  {
    term: { de: "CCM (Continuous Control Monitoring)", en: "CCM (Continuous Control Monitoring)" },
    desc: {
      de: "Laufende, automatische Überwachung, ob eine Kontrolle noch wirksam ist (statt nur einmal jährlich zu prüfen).",
      en: "Ongoing, automated checking that a control is still effective (instead of a once-a-year review).",
    },
  },
  {
    term: { de: "Kontroll-Knoten (same-as)", en: "Control node (same-as)" },
    desc: {
      de: "Inhaltlich gleiche Kontrollen verschiedener Frameworks werden zu EINEM Knoten zusammengefasst. Eine Antwort gilt dann für alle. KEIN Framework ist dabei ein Hauptframework.",
      en: "Content-equivalent controls of different frameworks are grouped into ONE node. One answer then counts for all. NO framework acts as a master.",
    },
  },
  {
    term: { de: "Delta", en: "Delta" },
    desc: {
      de: "Zusätzliche, framework-spezifische Anforderung, die es nur in einem Framework gibt (kein Pendant in anderen).",
      en: "An extra, framework-specific requirement that exists only in one framework (no equivalent elsewhere).",
    },
  },
  {
    term: { de: "Weakest-Link-Prinzip", en: "Weakest-link rule" },
    desc: {
      de: "Teilen sich mehrere Kontrollen einen Knoten, zählt der schlechteste Status: nicht erfüllt < teilweise < erfüllt.",
      en: "When controls share a node, the worst status counts: not met < partial < met.",
    },
  },
  {
    term: { de: "Status: Umgesetzt / Teilweise / Nicht umgesetzt / N.a. / Unbeantwortet", en: "Status: Implemented / Partial / Not implemented / N/A / Unanswered" },
    desc: {
      de: "Umgesetzt = vollständig erfüllt · Teilweise = angefangen · Nicht umgesetzt = Lücke · N.a. = nicht anwendbar · Unbeantwortet = noch nicht bewertet.",
      en: "Met = implemented · Partial = started · Not met = gap · N/A = not applicable · Open = not yet assessed.",
    },
  },
  {
    term: { de: "Radar-Achsen (z. B. A.5, DE)", en: "Radar axes (e.g. A.5, DE)" },
    desc: {
      de: "Kurzcodes für Themengebiete/Kapitel eines Frameworks. Die volle Bezeichnung steht als Legende direkt unter jedem Radar-Diagramm.",
      en: "Short codes for a framework's topic areas/chapters. The full name is listed as a legend right below each radar chart.",
    },
  },
];

export default function GlossaryCard({ de }: { de: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 w-full text-left"
          aria-expanded={open}
        >
          {open ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
          <BookOpen className="size-4 text-primary shrink-0" />
          <CardTitle className="text-base">
            {de ? "Legende & Begriffe (für alle Grafiken)" : "Legend & glossary (for all charts)"}
          </CardTitle>
        </button>
        {!open && (
          <p className="text-xs text-muted-foreground mt-1 pl-6">
            {de
              ? "Was bedeuten die Kürzel und Kennzahlen? Klicken zum Aufklappen."
              : "What do the abbreviations and metrics mean? Click to expand."}
          </p>
        )}
      </CardHeader>
      {open && (
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            {TERMS.map((t) => (
              <div key={t.term.en} className="rounded-md border border-border px-3 py-2">
                <dt className="text-sm font-semibold text-foreground">{de ? t.term.de : t.term.en}</dt>
                <dd className="text-xs text-muted-foreground mt-0.5 leading-snug">{de ? t.desc.de : t.desc.en}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      )}
    </Card>
  );
}
