/**
 * Station 3–4: der Statusring (59 % im Demo-Mandanten) und sein Zerfall in die sechs PDCA-Phasen,
 * davor eine Glasplatte mit dem echten Screenshot der aktiven Phase.
 */
import * as THREE from 'three';
import { arcMaterial, clockTorus, color, GREEN } from './common';

export interface RingParts {
  group: THREE.Group;
  glass: THREE.Mesh;
  track: THREE.Mesh;
  fill: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  halo: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  segments: { root: THREE.Group; glass: THREE.Mesh; core: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>; angle: number }[];
}

export function glassMaterial(tier: number, tint = '#c4d6f2') {
  if (tier >= 2) {
    return new THREE.MeshPhysicalMaterial({
      color: tint, metalness: 0, roughness: 0.1, transmission: 1, thickness: 0.5, ior: 1.5,
      clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 2.4, transparent: true, opacity: 1, depthWrite: false,
      specularIntensity: 1, specularColor: new THREE.Color('#ffffff'),
    });
  }
  return new THREE.MeshStandardMaterial({ color: tint, metalness: 0.5, roughness: 0.14, envMapIntensity: 2.2, transparent: true, opacity: 0.5, depthWrite: false });
}

function sectorGeometry(r0: number, r1: number, span: number, depth: number, bevel: number) {
  const s = new THREE.Shape();
  const a0 = -span / 2, a1 = span / 2;
  s.moveTo(Math.cos(a0) * r1, Math.sin(a0) * r1);
  s.absarc(0, 0, r1, a0, a1, false);
  s.lineTo(Math.cos(a1) * r0, Math.sin(a1) * r0);
  s.absarc(0, 0, r0, a1, a0, true);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 40 });
  g.translate(0, 0, -depth / 2);
  return g;
}

export function buildRing(tier: number, lang: string, segImgs: string[]): RingParts {
  const group = new THREE.Group();

  const glass = new THREE.Mesh(new THREE.TorusGeometry(4, 0.36, 48, 220), glassMaterial(tier));
  const track = new THREE.Mesh(new THREE.TorusGeometry(4, 0.2, 16, 220), new THREE.MeshBasicMaterial({ color: '#22356b', transparent: true, opacity: 0.4, depthWrite: false }));
  const fill = new THREE.Mesh(clockTorus(4, 0.22), arcMaterial(GREEN, 2.8));
  fill.renderOrder = 3;
  glass.renderOrder = 2;

  // weicher Lichthof hinter dem Ring
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0 }, uColor: { value: color(GREEN, 1) } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float uOpacity; uniform vec3 uColor; varying vec2 vUv;
        void main(){ float d = length(vUv - 0.5) * 2.0; float r = smoothstep(1.0, 0.55, d) * smoothstep(0.35, 0.58, d);
        gl_FragColor = vec4(uColor * r * 0.12, r * uOpacity * 0.6); }`,
    }),
  );
  halo.position.z = -0.6;
  group.add(halo, track, glass, fill);

  // Sechs Phasen-Segmente
  const segments: RingParts['segments'] = [];
  const span = (Math.PI * 2) / 6 - 0.11;
  const gGlass = sectorGeometry(4.15, 5.15, span, 0.85, 0.07);
  const gCore = sectorGeometry(4.4, 4.9, span - 0.05, 0.42, 0);
  for (let k = 0; k < 6; k++) {
    const angle = (k * 60 - 90) * (Math.PI / 180);
    const root = new THREE.Group();
    root.rotation.z = angle;
    const sg = new THREE.Mesh(gGlass, glassMaterial(tier, '#bfe8d3'));
    const core = new THREE.Mesh(gCore, new THREE.MeshBasicMaterial({ color: color(GREEN, 0.8), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    root.add(core, sg);
    root.visible = false;
    group.add(root);
    segments.push({ root, glass: sg, core, angle });
  }

  return { group, glass, track, fill, halo, segments };
}
