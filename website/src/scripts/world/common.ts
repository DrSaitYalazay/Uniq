import * as THREE from 'three';

export const FW_ORDER = ['nis2', 'iso27001', 'aiact', 'iso42001', 'cra'] as const;
export type Fw = (typeof FW_ORDER)[number];
export const FW_COLOR: Record<string, string> = { nis2: '#2BB673', iso27001: '#3B82F6', aiact: '#8B5CF6', iso42001: '#22D3EE', cra: '#F5A524' };
export const FW_COUNT: Record<string, number> = { nis2: 268, iso27001: 318, aiact: 130, iso42001: 111, cra: 83 };
export const BAND = { red: '#E5484D', amber: '#F5A524', green: '#2BB673' };
export const GREEN = '#2BB673';
export const NAVY = '#0A1226';

/** Deterministischer Zufall (gleiche Szene bei jedem Aufruf → reproduzierbare Standbilder) */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const sstep = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Glockenkurve: 0 außerhalb [a,d], 1 zwischen b und c */
export const band = (a: number, b: number, c: number, d: number, x: number) => sstep(a, b, x) * (1 - sstep(c, d, x));

export function color(hex: string, mul = 1) {
  return new THREE.Color(hex).multiplyScalar(mul);
}

/** Bogen-Material: füllt einen Torus bis uFill (0…1), beginnend oben, im Uhrzeigersinn */
export function arcMaterial(hex: string, intensity = 2.4) {
  return new THREE.ShaderMaterial({
    uniforms: { uFill: { value: 0 }, uColor: { value: color(hex, intensity) }, uOpacity: { value: 1 }, uHead: { value: 1 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uFill, uOpacity, uHead; uniform vec3 uColor; varying vec2 vUv;
      void main() {
        float a = vUv.x;               // 0…1 entlang des Torus
        float edge = smoothstep(uFill, uFill - 0.004, a);
        if (edge <= 0.0) discard;
        float head = smoothstep(uFill - 0.06, uFill, a) * uHead;
        float tube = 1.0 - abs(vUv.y - 0.5) * 1.4;
        vec3 c = uColor * (0.75 + 0.5 * tube) + vec3(1.0) * head * 0.9;
        gl_FragColor = vec4(c, edge * uOpacity);
      }`,
  });
}

/** Torus, dessen uv.x im Uhrzeigersinn ab 12 Uhr läuft */
export function clockTorus(radius: number, tube: number, rs = 24, ts = 220) {
  const g = new THREE.TorusGeometry(radius, tube, rs, ts);
  g.rotateZ(Math.PI / 2); // Start oben
  g.scale(-1, 1, 1);      // im Uhrzeigersinn
  return g;
}
