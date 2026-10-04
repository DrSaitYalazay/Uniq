/**
 * Die 910 Anforderungen als Punkte (Farbe = Regelwerk) und die Lichtfäden.
 * Zustände: Wolke (uM1=0) → 227 gemeinsame Kontrollpunkte (uM1=1) → Umlaufbahnen um den Ring (uM2=1).
 * Die Zuordnung zu den Knoten stammt aus dem echten Katalog (data/nodes.json).
 */
import * as THREE from 'three';
import nodes from '../../data/nodes.json';
import { FW_ORDER, FW_COLOR, FW_COUNT, rng } from './common';

const DRIFT = /* glsl */ `
vec3 drift(float s, float t) {
  return vec3(sin(t * 0.31 + s * 6.283), cos(t * 0.23 + s * 4.1), sin(t * 0.19 + s * 2.7)) * 0.32;
}
vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
`;

export interface Particles {
  points: THREE.Points;
  lines: THREE.LineSegments;
  uniforms: Record<string, THREE.IUniform>;
  /** Weltpositionen der 227 Knoten (für Tooltip) */
  nodePos: THREE.Vector3[];
  nodeFw: string[][];
}

export function buildParticles(pixelRatio: number, mobile: boolean): Particles {
  const rand = rng(910);
  const gauss = () => { let s = 0; for (let i = 0; i < 4; i++) s += rand(); return (s - 2) / 2; };
  const N = 910;
  const cloud = new Float32Array(N * 3);
  const node = new Float32Array(N * 3);
  const ring = new Float32Array(N * 3);
  const color = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  const kind = new Float32Array(N);
  const size = new Float32Array(N);

  // Regelwerk je Punkt
  const fwOf: string[] = [];
  FW_ORDER.forEach((f) => { for (let i = 0; i < FW_COUNT[f]; i++) fwOf.push(f); });
  // Bandbreite der Regelwerke im „Wolkenband“ (überlappend)
  const span: Record<string, [number, number]> = { nis2: [0, 0.5], iso27001: [0.18, 0.78], aiact: [0.5, 0.9], iso42001: [0.58, 1], cra: [0.72, 1] };

  const tmpC = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const f = fwOf[i];
    const [a0, a1] = span[f];
    const a = a0 + (a1 - a0) * rand();
    const x = (a - 0.5) * 34;
    const y = Math.sin(a * Math.PI * 2.4 + 0.6) * 3.4 + gauss() * 2.3;
    const z = Math.cos(a * Math.PI * 1.5) * 4 + gauss() * 4.2;
    cloud.set([x, y, z], i * 3);
    tmpC.set(FW_COLOR[f]);
    color.set([tmpC.r, tmpC.g, tmpC.b], i * 3);
    seed[i] = rand();
    size[i] = 0.6 + rand() * 0.9;
    // Umlaufbahnen: drei leicht geneigte Ellipsen um den Ring
    const e = i % 3;
    const ang = rand() * Math.PI * 2;
    const R = [6.4, 7.6, 8.8][e] + gauss() * 0.25;
    const tilt = [0.16, -0.1, 0.24][e];
    const rx = Math.cos(ang) * R, rz = Math.sin(ang) * R * 0.82;
    ring.set([rx, rz * Math.sin(tilt) + gauss() * 0.12 - 0.4, rz * Math.cos(tilt)], i * 3);
  }

  // Gemeinsame Kontrollpunkte: je Knoten zwei Anforderungen aus verschiedenen Regelwerken
  const pool: Record<string, number[]> = {};
  FW_ORDER.forEach((f) => (pool[f] = []));
  fwOf.forEach((f, i) => pool[f].push(i));
  // Pools mischen (deterministisch)
  FW_ORDER.forEach((f) => pool[f].sort(() => rand() - 0.5));

  const nodePos: THREE.Vector3[] = [];
  const nodeFw: string[][] = [];
  const pairs: [number, number][] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  (nodes as Record<string, number>[]).forEach((n, k) => {
    const r = Math.cbrt((k + 0.5) / nodes.length);
    const yy = 1 - 2 * ((k + 0.5) / nodes.length);
    const rr = Math.sqrt(1 - yy * yy);
    const th = golden * k;
    const p = new THREE.Vector3(Math.cos(th) * rr * 10.5 * (0.45 + 0.55 * r), yy * 4.6 * (0.6 + 0.4 * r), Math.sin(th) * rr * 6.5 * (0.45 + 0.55 * r));
    p.x += gauss() * 0.4; p.y += gauss() * 0.3; p.z += gauss() * 0.4;
    nodePos.push(p);
    const fws = Object.keys(n);
    nodeFw.push(fws);
    const members: number[] = [];
    fws.forEach((f) => { for (let c = 0; c < n[f]; c++) { const idx = pool[f].pop(); if (idx !== undefined) members.push(idx); } });
    members.forEach((idx) => { node.set([p.x, p.y, p.z], idx * 3); kind[idx] = 1; });
    if (members.length >= 2) for (let m = 0; m < members.length; m++) pairs.push([members[m], k]);
  });
  // Nicht geteilte Anforderungen: bleiben in der (zusammengezogenen) Wolke
  for (let i = 0; i < N; i++) if (!kind[i]) node.set([cloud[i * 3] * 0.72, cloud[i * 3 + 1] * 0.8, cloud[i * 3 + 2] * 0.72], i * 3);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(cloud, 3));
  g.setAttribute('aCloud', new THREE.BufferAttribute(cloud, 3));
  g.setAttribute('aNode', new THREE.BufferAttribute(node, 3));
  g.setAttribute('aRing', new THREE.BufferAttribute(ring, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);

  const uniforms: Record<string, THREE.IUniform> = {
    uTime: { value: 0 },
    uM1: { value: 0 },
    uM2: { value: 0 },
    uFil: { value: 0 },
    uOpacity: { value: 1 },
    uPR: { value: pixelRatio },
    uScale: { value: mobile ? 1.15 : 1 },
    uFocus: { value: 30 },
    uMouse: { value: new THREE.Vector2(9, 9) },
    uOrbit: { value: 0 },
    uFlat: { value: 0 },
    uHero: { value: 1 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aCloud; attribute vec3 aNode; attribute vec3 aRing; attribute vec3 aColor;
      attribute float aSeed; attribute float aKind; attribute float aSize;
      uniform float uTime, uM1, uM2, uPR, uScale, uFocus, uOrbit, uFlat, uHero;
      uniform vec2 uMouse;
      varying vec3 vColor; varying float vAlpha; varying float vNode;
      ${DRIFT}
      void main() {
        vec3 d = drift(aSeed, uTime) * (1.0 - uM1 * aKind * 0.85);
        vec3 p = mix(aCloud + d, aNode + d * 0.25, uM1);
        vec3 r = rotY(aRing, uTime * (0.035 + aSeed * 0.02) + uOrbit);
        r.y *= 1.0 - uFlat * 0.6;
        p = mix(p, r, uM2);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        // Cursor: Punkte weichen sanft aus
        vec4 cp = projectionMatrix * mv;
        vec2 ndc = cp.xy / cp.w;
        vec2 dm = ndc - uMouse;
        float md = length(dm);
        float push = smoothstep(0.22, 0.0, md) * (1.0 - uM2) * 0.9;
        mv.xy += normalize(dm + 1e-5) * push;
        gl_Position = projectionMatrix * mv;
        float depth = -mv.z;
        float blur = clamp(abs(depth - uFocus) / max(uFocus, 1.0), 0.0, 2.5);
        float isNode = aKind * uM1 * (1.0 - uM2);
        float s = aSize * (1.0 + isNode * 0.9) * (1.0 + blur * 0.9) * (1.0 + uHero * 0.65);
        gl_PointSize = s * uScale * uPR * (300.0 / depth);
        vColor = aColor;
        vNode = isNode;
        float dimUnshared = mix(1.0, 0.42, uM1 * (1.0 - aKind) * (1.0 - uM2));
        vAlpha = dimUnshared / (1.0 + blur * 1.7);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3 vColor; varying float vAlpha; varying float vNode;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float core = exp(-d * d * 60.0);
        float halo = exp(-d * d * 9.0) * 0.38;
        float ring = smoothstep(0.42, 0.36, d) * smoothstep(0.27, 0.34, d) * vNode;
        vec3 col = vColor * (core * 1.6 + halo) + vec3(1.0) * exp(-d * d * 160.0) * (0.5 + vNode * 0.6) + vColor * ring * 0.9;
        float a = (core + halo + ring * 0.7) * smoothstep(0.5, 0.42, d);
        gl_FragColor = vec4(col, a * vAlpha * uOpacity);
      }`,
  });
  const points = new THREE.Points(g, mat);
  points.frustumCulled = false;

  // Lichtfäden: vom Ursprung der Anforderung in der Wolke zu ihrem Knoten
  const L = pairs.length;
  const lCloud = new Float32Array(L * 6), lNode = new Float32Array(L * 6), lEnd = new Float32Array(L * 2), lColor = new Float32Array(L * 6), lSeed = new Float32Array(L * 2);
  pairs.forEach(([idx, k], j) => {
    for (let v = 0; v < 2; v++) {
      lCloud.set([cloud[idx * 3], cloud[idx * 3 + 1], cloud[idx * 3 + 2]], (j * 2 + v) * 3);
      lNode.set([nodePos[k].x, nodePos[k].y, nodePos[k].z], (j * 2 + v) * 3);
      lColor.set([color[idx * 3], color[idx * 3 + 1], color[idx * 3 + 2]], (j * 2 + v) * 3);
      lEnd[j * 2 + v] = v;
      lSeed[j * 2 + v] = seed[idx];
    }
  });
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(lCloud, 3));
  lg.setAttribute('aCloud', new THREE.BufferAttribute(lCloud, 3));
  lg.setAttribute('aNode', new THREE.BufferAttribute(lNode, 3));
  lg.setAttribute('aEnd', new THREE.BufferAttribute(lEnd, 1));
  lg.setAttribute('aColor', new THREE.BufferAttribute(lColor, 3));
  lg.setAttribute('aSeed', new THREE.BufferAttribute(lSeed, 1));
  const lmat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aCloud; attribute vec3 aNode; attribute vec3 aColor; attribute float aEnd; attribute float aSeed;
      uniform float uTime, uM1;
      varying vec3 vColor; varying float vA;
      ${DRIFT}
      void main() {
        vec3 d = drift(aSeed, uTime);
        vec3 head = mix(aCloud + d, aNode + d * 0.25, uM1);
        vec3 p = aEnd < 0.5 ? head : aCloud + d;
        vColor = aColor;
        vA = mix(0.55, 0.0, aEnd) * (1.0 - uM1 * 0.55);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uFil;
      varying vec3 vColor; varying float vA;
      void main() { gl_FragColor = vec4(vColor * 1.4, vA * uFil); }`,
  });
  const lines = new THREE.LineSegments(lg, lmat);
  lines.frustumCulled = false;

  return { points, lines, uniforms, nodePos, nodeFw };
}
