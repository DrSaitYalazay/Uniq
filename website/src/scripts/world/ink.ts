/**
 * Helle Darstellung der 3D-Welt: Die Szene leuchtet auf Nachtblau. Dieser Effekt
 * übersetzt Licht in Tinte auf Papier – Leuchtkraft wird Deckkraft, der Farbton
 * bleibt erhalten (nicht invertiert), Weiß wird Marineblau. Schwache Schleier
 * verschwinden im Papier, statt als Farbnebel stehen zu bleiben.
 */
import * as THREE from 'three';
import { Effect } from 'postprocessing';

const frag = /* glsl */ `
uniform vec3 uBg;
uniform vec3 uPaper;
uniform vec3 uInk;
uniform float uGain;
uniform float uDepth;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 e = max(inputColor.rgb - uBg, 0.0);
  float m = max(max(e.r, e.g), e.b);
  // Deckkraft: schwache Schleier (Bloom-Rand, Nebel) laufen weich ins Papier aus
  float a = smoothstep(0.015, 1.0, m * uGain);
  a = pow(a, 0.72);
  vec3 hue = m > 1e-4 ? e / m : vec3(0.0);
  // Weißanteil herausrechnen: Lichtkerne werden zur satten Grundfarbe, reines Weiß zu Tinte
  float white = min(min(hue.r, hue.g), hue.b);
  vec3 pure = (hue - white) / max(1.0 - white, 1e-3);
  vec3 col = mix(pure * uDepth, uInk, smoothstep(0.8, 0.98, white));
  outputColor = vec4(mix(uPaper, col, a * 0.94), inputColor.a);
}
`;

export class InkEffect extends Effect {
  constructor(bg: string, paper = '#f4f6f8', ink = '#14213f') {
    super('InkEffect', frag, {
      uniforms: new Map<string, THREE.Uniform>([
        ['uBg', new THREE.Uniform(new THREE.Color(bg))],
        ['uPaper', new THREE.Uniform(new THREE.Color(paper))],
        ['uInk', new THREE.Uniform(new THREE.Color(ink))],
        ['uGain', new THREE.Uniform(2.6)],
        ['uDepth', new THREE.Uniform(0.3)],
      ]),
    });
  }
}
