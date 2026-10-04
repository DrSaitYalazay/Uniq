/**
 * Station 5: drei Fristen-Ringe (24 h · 72 h · 1 Monat, § 32 BSIG) und die leuchtende Straße
 * der Zeitachse 2025–2028 mit sieben Meilensteinen. Dazu der Boden der ganzen Welt.
 */
import * as THREE from 'three';
import { arcMaterial, clockTorus, color, FW_COLOR } from './common';

export const FLOOR_Y = -6;

export interface DeadlineParts {
  timers: { group: THREE.Group; fill: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>; track: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>; center: THREE.Vector3; target: number }[];
  road: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  curve: THREE.CatmullRomCurve3;
  milestones: { group: THREE.Group; pos: THREE.Vector3; mat: THREE.MeshBasicMaterial; s: number }[];
  sparks: THREE.Points;
  floor: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
}

export function buildDeadlines(fws: string[]): DeadlineParts {
  // Fristen-Ringe: nah (amber, 24 h) → fern (blau, 1 Monat)
  const defs = [
    { c: new THREE.Vector3(4, -3.0, -30), r: 2.3, hex: FW_COLOR.cra, target: 0.93 },
    { c: new THREE.Vector3(-3.5, -3.3, -37), r: 1.85, hex: FW_COLOR.nis2, target: 0.72 },
    { c: new THREE.Vector3(-10.5, -3.6, -44), r: 1.5, hex: FW_COLOR.iso27001, target: 0.42 },
  ];
  const timers = defs.map((d) => {
    const group = new THREE.Group();
    group.position.copy(d.c);
    group.rotation.y = -0.12;
    const track = new THREE.Mesh(new THREE.TorusGeometry(d.r, 0.05, 12, 160), new THREE.MeshBasicMaterial({ color: color(d.hex, 0.35), transparent: true, opacity: 0.6, depthWrite: false }));
    const fill = new THREE.Mesh(clockTorus(d.r, 0.1, 16, 200), arcMaterial(d.hex, 3.2));
    // Stab zum Boden
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, d.c.y - FLOOR_Y - d.r, 6), new THREE.MeshBasicMaterial({ color: color(d.hex, 1.6), transparent: true, opacity: 0.55 }));
    stem.position.y = -d.r - (d.c.y - FLOOR_Y - d.r) / 2;
    group.add(track, fill, stem);
    return { group, fill, track, center: d.c, target: d.target };
  });

  // Funken um den 24-h-Ring
  const sp = 160;
  const sPos = new Float32Array(sp * 3);
  const sSeed = new Float32Array(sp);
  for (let i = 0; i < sp; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2.3 + (Math.random() - 0.5) * 0.9;
    sPos.set([Math.cos(a) * r, Math.sin(a) * r, (Math.random() - 0.5) * 0.6], i * 3);
    sSeed[i] = Math.random();
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sg.setAttribute('aSeed', new THREE.BufferAttribute(sSeed, 1));
  const sparks = new THREE.Points(sg, new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uPR: { value: 1 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aSeed; uniform float uTime, uPR; varying float vA;
      void main(){ vec3 p = position; float t = fract(uTime*0.12 + aSeed); p *= 1.0 + t*0.18; p.y += t*0.6;
        vec4 mv = modelViewMatrix * vec4(p,1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.0 + aSeed*2.0) * uPR * (60.0 / -mv.z); vA = (1.0 - t) * (0.4 + aSeed*0.6); }`,
    fragmentShader: `uniform float uOpacity; varying float vA; void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard;
      gl_FragColor = vec4(vec3(1.0,0.75,0.3)*1.8, smoothstep(0.5,0.0,d)*vA*uOpacity); }`,
  }));
  sparks.position.copy(defs[0].c);
  sparks.rotation.y = -0.12;

  // Straße der Zeitachse
  const pts = [
    [4, -30], [-3.5, -37], [-10.5, -44], [-9.5, -57], [-4, -70], [1.5, -81], [4.5, -92], [3, -103], [0, -114], [0, -126],
  ].map(([x, z]) => new THREE.Vector3(x, FLOOR_Y + 0.02, z));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const roadMat = new THREE.ShaderMaterial({
    uniforms: { uDraw: { value: 0 }, uOpacity: { value: 0 }, uTime: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uDraw, uOpacity, uTime; varying vec2 vUv;
      void main(){
        float s = vUv.x;
        vec3 amber = vec3(0.96,0.65,0.14), green = vec3(0.17,0.71,0.45), blue = vec3(0.23,0.51,0.96), soft = vec3(0.45,0.8,0.62);
        vec3 c = mix(amber, green, smoothstep(0.0, 0.1, s));
        c = mix(c, blue, smoothstep(0.1, 0.2, s));
        c = mix(c, soft, smoothstep(0.24, 0.4, s));
        float on = smoothstep(uDraw, uDraw - 0.01, s);
        float head = exp(-pow((s - uDraw) * 70.0, 2.0)) * 2.5;
        float pulse = 0.85 + 0.15 * sin(s * 120.0 - uTime * 3.0);
        gl_FragColor = vec4(c * (1.6 * pulse + head), (on * 0.9 + head * 0.6) * uOpacity);
      }`,
  });
  const road = new THREE.Mesh(new THREE.TubeGeometry(curve, 500, 0.055, 8, false), roadMat);

  // Meilensteine: kleine Lichtsäulen am Straßenrand
  const msS = [0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.8];
  const milestones = msS.map((s, i) => {
    const p = curve.getPointAt(s);
    const tan = curve.getTangentAt(s);
    const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize().multiplyScalar(i % 2 ? 3.4 : -3.4);
    const pos = p.clone().add(side);
    const hex = FW_COLOR[fws[i]] ?? FW_COLOR.nis2;
    const group = new THREE.Group();
    group.position.copy(pos);
    const mat = new THREE.MeshBasicMaterial({ color: color(hex, 2.2), transparent: true, opacity: 0 });
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4.2, 8), mat);
    pillar.position.y = 2.1;
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), mat);
    top.position.y = 4.25;
    // Lichtlinie quer über die Straße
    const sill = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.015, 0.05), mat);
    const sl = side.length();
    sill.rotation.y = Math.atan2(-side.z / sl, side.x / sl);
    sill.position.set(-side.x / 2, 0.02, -side.z / 2);
    group.add(sill);
    const base = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.32, 40), mat);
    base.rotation.x = -Math.PI / 2;
    base.position.y = 0.02;
    group.add(pillar, top, base);
    return { group, pos: pos.clone().setY(pos.y + 4.8), mat, s };
  });

  // Boden: Punktraster, Glühen unter Ring, Fristen und Türmen, gespiegelte Turmfarben
  const floorMat = new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 0 },
      uTowers: { value: [0, 0, 0, 0, 0].map(() => new THREE.Vector4()) },
      uTowerCol: { value: [0, 0, 0, 0, 0].map(() => new THREE.Color()) },
      uRing: { value: 0 },
      uCam: { value: new THREE.Vector3() },
    },
    transparent: true, depthWrite: false,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity, uRing; uniform vec4 uTowers[5]; uniform vec3 uTowerCol[5]; uniform vec3 uCam; varying vec3 vW;
      void main(){
        vec2 g = abs(fract(vW.xz * 0.6) - 0.5);
        float dotg = smoothstep(0.06, 0.02, length(g));
        float dist = length(vW.xz - uCam.xz);
        float fade = smoothstep(70.0, 6.0, dist);
        vec3 c = vec3(0.6, 0.75, 1.0) * dotg * 0.07 * fade;
        // Glühen unter dem Statusring
        c += vec3(0.17,0.71,0.45) * exp(-dot(vW.xz, vW.xz) * 0.03) * 0.22 * uRing;
        // Spiegelungen der Türme (vertikale Lichtbahnen Richtung Kamera)
        for (int i = 0; i < 5; i++) {
          vec4 t = uTowers[i];
          float dx = vW.x - t.x;
          float dz = vW.z - t.y;
          float strip = exp(-dx*dx*0.9) * smoothstep(-0.5, 2.0, dz) * exp(-max(dz,0.0)*0.09) * t.z;
          float pool = exp(-(dx*dx + dz*dz) * 0.12) * t.z;
          c += uTowerCol[i] * (strip * 0.55 + pool * 0.35);
        }
        float a = (0.85 + length(c)) * uOpacity;
        gl_FragColor = vec4(c + vec3(0.02,0.035,0.07) * fade, clamp(a, 0.0, 1.0) * fade);
      }`,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(220, 240, 1, 1), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, FLOOR_Y, -70);
  floor.renderOrder = -1;

  return { timers, road, curve, milestones, sparks, floor };
}
