/**
 * chartLabels — Beschriftung von Ring-/Tortendiagrammen, kollisionsfrei.
 *
 * REGEL (Befund Dr. Sait, 13.09.2026): In einem Ring-/Tortendiagramm darf ein
 * Segmentwert NIEMALS ausserhalb des Rings gezeichnet werden.
 *
 * Warum: Recharts setzt `label={...}` ohne Positionsangabe AUSSERHALB des
 * Aussenradius ab. In einem flachen Container (z. B. height 220 mit einer
 * Legende von 36 px) landet die Beschriftung des unteren Segments genau auf der
 * Legende — auf der Roadmap stand „Laufend: 84" quer über „Laufend  Offen".
 * Dieselbe Zeichenkette zweimal, uebereinander: der Nutzer sieht Matsch.
 *
 * Deshalb:
 *   • Der Wert steht IM Ring (zwischen Innen- und Aussenradius) — dort kann er
 *     mit nichts kollidieren, weil der Platz dem Segment allein gehoert.
 *   • Zu schmale Segmente bekommen GAR KEINE Beschriftung (sonst ueberlappen
 *     die Beschriftungen benachbarter Duennsegmente einander).
 *   • Namen gehoeren in eine HTML-Legende neben/unter das Diagramm, nicht als
 *     SVG-Text in die Zeichenflaeche.
 *
 * Durchgesetzt von `web/scripts/check-chart-labels.mjs` (Deploy-Gate).
 */
import React from "react";

type SliceProps = {
  cx: number; cy: number;
  innerRadius: number; outerRadius: number;
  midAngle: number; percent: number; value: number;
};

/** Farbe für Text auf gefüllten Segmenten — bewusst fix, nicht themenabhängig. */
const ON_SLICE = "#fff";

/**
 * Beschriftung INNERHALB des Rings.
 *
 * @param mode      "percent" → „42 %"  ·  "value" → die absolute Zahl
 * @param minPercent Segmente unterhalb dieses Anteils bleiben unbeschriftet
 *                   (Default 0.08 = 8 %; darunter passt keine Zahl in den Bogen)
 */
export function insideSliceLabel(
  mode: "percent" | "value" = "percent",
  minPercent = 0.08,
) {
  return function renderInsideLabel(e: SliceProps) {
    if (!e || typeof e.percent !== "number") return null;
    if (e.percent < minPercent) return null;               // zu schmal → nichts
    const RAD = Math.PI / 180;
    // Mitte des Ringbandes: dort ist der Bogen am breitesten nutzbar.
    const r = e.innerRadius + (e.outerRadius - e.innerRadius) * 0.5;
    const x = e.cx + r * Math.cos(-e.midAngle * RAD);
    const y = e.cy + r * Math.sin(-e.midAngle * RAD);
    const text = mode === "percent" ? `${Math.round(e.percent * 100)} %` : String(e.value);
    return (
      <text
        x={x} y={y}
        fill={ON_SLICE}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={700}
      >
        {text}
      </text>
    );
  };
}
