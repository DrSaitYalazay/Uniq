/**
 * Station 6: fünf Glastürme, Höhe = bewertbare Anforderungen je Katalog (268 · 318 · 130 · 111 · 83).
 * Jeder Turm ist eine Tür in den Quick-Check. Danach zeigen Ring, Säulen und Türme das eigene Ergebnis.
 */
import * as THREE from 'three';
import { arcMaterial, clockTorus, color, FW_COLOR, FW_COUNT, FW_ORDER, GREEN } from './common';
import { FLOOR_Y } from './deadlines';
import { glassMaterial } from './ring';

export const TOWER_Z = -140;
export const TOWER_MAX = 16;

export interface Tower {
  fw: string;
  root: THREE.Group;
  shell: THREE.Mesh;
  edges: THREE.LineSegments;
  glow: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  door: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  hReq: number;
  h: number;
  x: number;
}

export interface SkylineParts {
  towers: Tower[];
  resultRing: THREE.Group;
  resultFill: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  resultGlass: THREE.Mesh;
  columns: THREE.Group;
  setColumns: (answers: (string | null)[]) => void;
  colMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>[];
}

export function buildSkyline(tier: number): SkylineParts {
  const unit = new THREE.BoxGeometry(1, 1, 1);
  unit.translate(0, 0.5, 0);
  const towers: Tower[] = FW_ORDER.map((fw, i) => {
    const x = (i - 2) * 6.2;
    const root = new THREE.Group();
    root.position.set(x, FLOOR_Y, TOWER_Z);
    const shellMat = new THREE.MeshPhysicalMaterial({ color: '#1a2850', metalness: 0.85, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 2.2, transparent: true, opacity: 0.38, depthWrite: false });
    const shell = new THREE.Mesh(unit, shellMat);
    shell.userData.fw = fw;
    const glow = new THREE.Mesh(unit, new THREE.ShaderMaterial({
      uniforms: { uColor: { value: color(FW_COLOR[fw], 1) }, uH: { value: 1 }, uTime: { value: 0 }, uSeed: { value: i * 1.7 }, uBoost: { value: 0 }, uOpacity: { value: 1 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 vP; varying vec3 vN; void main(){ vP = position; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uH, uTime, uSeed, uBoost, uOpacity; varying vec3 vP; varying vec3 vN;
        float hash(float n){ return fract(sin(n)*43758.5453); }
        void main(){
          float y = vP.y * uH;                       // Höhe in Welt-Einheiten
          float base = exp(-y * 0.28) * 1.1 + 0.12;
          float u = (abs(vN.x) > 0.5 ? vP.z : vP.x) + 0.5;
          float col = floor(u * 22.0);
          float streak = step(0.72, hash(col + uSeed)) * smoothstep(0.0, 1.0, fract(vP.y * 2.0 - uTime * (0.15 + hash(col)*0.25) + hash(col*3.1)));
          float top = smoothstep(0.985, 1.0, vP.y) * 0.6;
          float v = (base + streak * 0.55 * (1.0 - vP.y * 0.6) + top) * (1.0 + uBoost * 0.8);
          gl_FragColor = vec4(uColor * v * 1.6, clamp(v, 0.0, 1.0) * 0.75 * uOpacity);
        }`,
    }));
    glow.scale.set(2.5, 1, 2.5);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.8), new THREE.MeshBasicMaterial({ color: color(FW_COLOR[fw], 2.4), transparent: true, opacity: 0 }));
    door.position.set(0, 0.9, 1.52);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(unit), new THREE.LineBasicMaterial({ color: color(FW_COLOR[fw], 1.1), transparent: true, opacity: 0.55 }));
    edges.userData.edges = true;
    root.add(glow, shell, door, edges);
    const hReq = (FW_COUNT[fw] / 318) * TOWER_MAX;
    return { fw, root, shell, edges, glow, door, hReq, h: 0, x };
  });

  // Ergebnis-Ring (Quick-Check)
  const resultRing = new THREE.Group();
  resultRing.position.set(0, 1.2, TOWER_Z + 10);
  const resultGlass = new THREE.Mesh(new THREE.TorusGeometry(3, 0.28, 40, 180), glassMaterial(tier));
  const track = new THREE.Mesh(new THREE.TorusGeometry(3, 0.16, 12, 180), new THREE.MeshBasicMaterial({ color: '#22356b', transparent: true, opacity: 0.45, depthWrite: false }));
  const resultFill = new THREE.Mesh(clockTorus(3, 0.17), arcMaterial(GREEN, 2.8));
  resultRing.add(track, resultGlass, resultFill);
  resultRing.visible = false;

  // Säulenlandschaft: eine Säule je Frage
  const columns = new THREE.Group();
  columns.position.set(0, FLOOR_Y, TOWER_Z + 13.5);
  const colMeshes: SkylineParts['colMeshes'] = [];
  const colGeo = new THREE.BoxGeometry(0.42, 1, 0.42);
  colGeo.translate(0, 0.5, 0);
  const setColumns = (answers: (string | null)[]) => {
    while (colMeshes.length < answers.length) {
      const m = new THREE.Mesh(colGeo, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 }));
      m.userData.target = 0.04;
      m.scale.y = 0.04;
      columns.add(m);
      colMeshes.push(m);
    }
    const n = answers.length;
    colMeshes.forEach((m, i) => {
      m.visible = i < n;
      if (i >= n) return;
      const a = answers[i];
      const x = (i - (n - 1) / 2) * 0.7;
      m.position.set(x, 0, -Math.abs(x) * 0.12);
      const hex = a === 'yes' ? '#2BB673' : a === 'partly' ? '#F5A524' : a === 'no' ? '#E5484D' : '#22356b';
      m.material.color.copy(color(hex, a ? 1.8 : 0.8));
      m.userData.target = a === 'yes' ? 2.4 : a === 'partly' ? 1.25 : a === 'no' ? 0.22 : 0.04;
      m.userData.answer = a;
      m.userData.index = i;
    });
  };
  columns.visible = false;

  return { towers, resultRing, resultFill, resultGlass, columns, setColumns, colMeshes };
}
