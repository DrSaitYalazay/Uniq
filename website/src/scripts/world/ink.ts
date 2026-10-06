/**
 * Helle Darstellung der 3D-Welt: Die Szene leuchtet auf Nachtblau. Dieser Effekt
 * übersetzt Licht in Tinte auf Papier – Leuchtkraft wird Deckkraft. Gezeichnet wird
 * zweifarbig wie ein Stich: Grüntöne in der Akzentfarbe, alles andere in Schiefer,
 * reines Weiß in Tinte. Schwache Schleier verschwinden im Papier.
 */
import * as THREE from 'three';
import { Effect } from 'postprocessing';

const frag = /* glsl */ `
uniform vec3 uBg;
uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uSlate;
uniform vec3 uAccent;
uniform float uLo;
uniform float uHi;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 e = max(inputColor.rgb - uBg, 0.0);
  float m = max(max(e.r, e.g), e.b);
  // harte Kante: Kerne und Linien voll, Lichthöfe fallen weg
  float a = smoothstep(uLo, uHi, m);
  vec3 hue = m > 1e-4 ? e / m : vec3(0.0);
  float white = min(min(hue.r, hue.g), hue.b);
  vec3 pure = (hue - white) / max(1.0 - white, 1e-3);
  // Grünanteil: Grün klar vor Rot und Blau
  float green = smoothstep(0.25, 0.7, pure.g - max(pure.r, pure.b) * 0.8);
  // Regelwerksfarben bleiben erkennbar, aber gedämpft in Richtung Schiefer (wie Druckfarbe)
  vec3 col = mix(mix(pure * 0.4, uSlate, 0.38), uAccent, green);
  col = mix(col, uInk, smoothstep(0.8, 0.98, white));
  outputColor = vec4(mix(uPaper, col, a * 0.95), inputColor.a);
}
`;

export interface InkPalette { paper: string; ink: string; slate: string; accent: string }

export class InkEffect extends Effect {
  constructor(bg: string, p: InkPalette, lo = 0.04, hi = 0.35) {
    super('InkEffect', frag, {
      uniforms: new Map<string, THREE.Uniform>([
        ['uBg', new THREE.Uniform(new THREE.Color(bg))],
        ['uPaper', new THREE.Uniform(new THREE.Color(p.paper))],
        ['uInk', new THREE.Uniform(new THREE.Color(p.ink))],
        ['uSlate', new THREE.Uniform(new THREE.Color(p.slate))],
        ['uAccent', new THREE.Uniform(new THREE.Color(p.accent))],
        ['uLo', new THREE.Uniform(lo)],
        ['uHi', new THREE.Uniform(hi)],
      ]),
    });
  }
}

/** Palette aus den CSS-Variablen der hellen Darstellung – eine Quelle für Seite und 3D */
export function inkPalette(): InkPalette {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, d: string) => cs.getPropertyValue(n).trim() || d;
  return { paper: v('--ink-paper', '#f7f8fa'), ink: v('--ink-ink', '#0b1530'), slate: v('--ink-slate', '#3a4868'), accent: v('--ink-accent', '#12875a') };
}
