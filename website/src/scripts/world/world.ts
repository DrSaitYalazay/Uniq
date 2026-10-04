/**
 * Die 3D-Welt: eine Leinwand, eine Kamerafahrt (Catmull-Rom über Schlüsselpunkte),
 * gesteuert allein vom Scroll-Parameter u (state.u) – rückwärts exakt umkehrbar.
 */
import * as THREE from 'three';
import { BloomEffect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect } from 'postprocessing';
import { bus, state, type QcView } from '../state';
import { band, BAND, clamp, color, FW_COLOR, FW_ORDER, lerp, NAVY, rng, sstep } from './common';
import { buildParticles } from './particles';
import { buildRing } from './ring';
import { buildDeadlines, FLOOR_Y } from './deadlines';
import { buildSkyline, TOWER_MAX } from './skyline';

type V3 = [number, number, number];
interface Key { u: number; p: V3; t: V3 }

export async function init(canvas: HTMLCanvasElement) {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const stillU = params.has('still') ? parseFloat(params.get('still') || '0') : null;
  const data = state.data();
  const lang: string = data?.lang ?? 'de';
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(innerWidth, innerHeight) < 700;
  let tier = stillU !== null ? 3 : coarse || small ? 1 : 3;
  if (params.has('tier')) tier = parseInt(params.get('tier')!, 10);

  // ── Renderer ────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: tier === 1, alpha: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: stillU !== null });
  renderer.setClearColor(NAVY, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const dprCap = () => (tier >= 3 ? 2 : tier === 2 ? 1.5 : 1.25);
  renderer.setPixelRatio(Math.min(devicePixelRatio, dprCap()));

  const scene = new THREE.Scene();
  scene.background = color(NAVY);
  scene.fog = new THREE.FogExp2(NAVY, 0.0085);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);

  // Umgebung für Glasreflexe (aus env-studio, in PMREM gefiltert)
  const pmrem = new THREE.PMREMGenerator(renderer);
  new THREE.TextureLoader().load('/img/tex/env-studio.jpg', (tex) => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const env = pmrem.fromEquirectangular(tex).texture;
    scene.environment = env;
    tex.dispose();
  });

  // ── Inhalte ─────────────────────────────────────────────────────────────
  const P = buildParticles(renderer.getPixelRatio(), tier === 1);
  scene.add(P.points, P.lines);

  const segImgs: string[] = (data?.seg ?? []).map((s: any) => s.img);
  const R = buildRing(tier >= 3 ? 3 : 2, lang, segImgs);
  scene.add(R.group, R.panel);

  const msFw = ['nis2', 'nis2', 'aiact', 'cra', 'aiact', 'cra', 'aiact'];
  const D = buildDeadlines(msFw);
  scene.add(D.floor, D.road, D.sparks);
  D.timers.forEach((t) => scene.add(t.group));
  D.milestones.forEach((m) => scene.add(m.group));

  const S = buildSkyline(tier >= 3 ? 3 : 2);
  S.towers.forEach((t) => scene.add(t.root));
  scene.add(S.resultRing, S.columns);
  const floorU = D.floor.material.uniforms;
  S.towers.forEach((t, i) => (floorU.uTowerCol.value[i] = color(FW_COLOR[t.fw], 1)));

  // weiche Nebel-Lichter hinter der Wolke (Dekor, keine Datenpunkte)
  const nebula = new THREE.Group();
  {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,0.9)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.28)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    const spots: [number, number, number, string, number][] = [
      [-12, 2.5, -2, FW_COLOR.nis2, 13], [-5, 1, 0, FW_COLOR.iso27001, 15], [2, -1.5, 1, FW_COLOR.nis2, 12],
      [8, -2.5, -1, FW_COLOR.aiact, 13], [13, -1, 0, FW_COLOR.iso42001, 11], [16, 0.5, -3, FW_COLOR.cra, 8],
    ];
    spots.forEach(([x, y, z, hex, sc]) => {
      const m = new THREE.SpriteMaterial({ map: tex, color: color(hex, 1), transparent: true, opacity: 0.14, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
      const sp = new THREE.Sprite(m);
      sp.position.set(x, y, z);
      sp.scale.set(sc, sc * 0.7, 1);
      nebula.add(sp);
    });
    scene.add(nebula);
  }

  // ferner Sternenstaub für Tiefe
  {
    const r = rng(77);
    const n = tier === 1 ? 700 : 1400;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([(r() - 0.5) * 220, (r() - 0.35) * 90, 40 - r() * 230], i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(g, new THREE.PointsMaterial({ color: '#8fa6d6', size: 0.11, sizeAttenuation: true, transparent: true, opacity: 0.55, depthWrite: false, fog: false }));
    scene.add(stars);
  }

  // ── Nachbearbeitung (adaptiv) ───────────────────────────────────────────
  let composer: EffectComposer | null = null;
  const setupComposer = () => {
    composer?.dispose();
    composer = null;
    if (tier <= 1) {
      renderer.toneMapping = THREE.NeutralToneMapping;
      return;
    }
    renderer.toneMapping = THREE.NoToneMapping;
    composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType, multisampling: tier >= 3 ? 4 : 0 });
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new BloomEffect({ mipmapBlur: true, luminanceThreshold: 0.9, luminanceSmoothing: 0.2, intensity: 1.25, radius: 0.75 });
    const vignette = new VignetteEffect({ offset: 0.32, darkness: 0.58 });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL });
    composer.addPass(new EffectPass(camera, bloom, vignette, tone));
  };
  setupComposer();

  // ── Kamera-Schlüsselpunkte ──────────────────────────────────────────────
  const K: Key[] = [
    { u: 0, p: [-2, 1.0, 23], t: [-8.5, 1.4, 0] },
    { u: 1, p: [0, 0.8, 19], t: [-3, 0.8, 0] },
    { u: 2, p: [4.5, 1.2, 16.5], t: [0, 0, 0] },
    { u: 3, p: [2, 1.4, 18], t: [0, 0, 0] },
    { u: 4, p: [0, 0.4, 21], t: [0, 0, 0] },
    { u: 5, p: [0, 3.6, 21], t: [0, -0.6, 0] },
  ];
  for (let k = 0; k <= 10; k++) {
    const th = (k * 30 * Math.PI) / 180;
    K.push({ u: 6 + k * 0.5, p: [13 * Math.sin(th), 7.5, 13 * Math.cos(th)], t: [0, -1.2, 0] });
  }
  K.push({ u: 11.6, p: [-6.5, 9, 13], t: [0, -1.5, -4] });
  K.push({ u: 12.2, p: [0, 10, 15], t: [0, -2.5, -14] });
  K.push({ u: 13, p: [-6, -2.8, -6], t: [1.2, -3.6, -34] });
  K.push({ u: 14, p: [-6, -3.2, -13], t: [-2, -3.6, -38] });
  for (let j = 0; j <= 12; j++) {
    const s = 0.22 + (j * (0.86 - 0.22)) / 12;
    const c = D.curve.getPointAt(s);
    const tan = D.curve.getTangentAt(s);
    const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize().multiplyScalar(0.9);
    const ahead = D.curve.getPointAt(Math.min(1, s + 0.075));
    K.push({ u: 14.6 + j * 0.25, p: [c.x + side.x, FLOOR_Y + 1.9, c.z + side.z], t: [ahead.x, FLOOR_Y + 1.1, ahead.z] });
  }
  K.push({ u: 18, p: [0, -3.2, -98], t: [3, 0.5, -140] });
  K.push({ u: 19, p: [0, -4.3, -101], t: [3.5, 3, -140] });
  K.push({ u: 20, p: [0, -3, -103], t: [3.5, 2, -140] });
  K.push({ u: 20.5, p: [0, -2.8, -104], t: [3.5, 2, -140] });

  const cr = (a: number, b: number, c: number, d: number, t: number) => {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  };
  const pathAt = (u: number, outP: THREE.Vector3, outT: THREE.Vector3) => {
    // an jeder PDCA-Phase kurz verweilen
    if (u > 6 && u < 11) {
      const f = u - 6, k = Math.floor(f), fr = f - k;
      u = 6 + k + sstep(0.22, 0.78, fr);
    }
    u = clamp(u, K[0].u, K[K.length - 1].u);
    let i = 0;
    while (i < K.length - 2 && K[i + 1].u <= u) i++;
    const a = K[Math.max(0, i - 1)], b = K[i], c = K[i + 1], d = K[Math.min(K.length - 1, i + 2)];
    const t = (u - b.u) / Math.max(1e-6, c.u - b.u);
    outP.set(cr(a.p[0], b.p[0], c.p[0], d.p[0], t), cr(a.p[1], b.p[1], c.p[1], d.p[1], t), cr(a.p[2], b.p[2], c.p[2], d.p[2], t));
    outT.set(cr(a.t[0], b.t[0], c.t[0], d.t[0], t), cr(a.t[1], b.t[1], c.t[1], d.t[1], t), cr(a.t[2], b.t[2], c.t[2], d.t[2], t));
  };

  // ── Größe ───────────────────────────────────────────────────────────────
  let W = 1, H = 1, portrait = false;
  const resize = () => {
    W = innerWidth; H = innerHeight; portrait = W / H < 0.9;
    if (stillU !== null && params.has('w')) { W = parseInt(params.get('w')!, 10); H = parseInt(params.get('h') || '900', 10); portrait = W / H < 0.9; }
    renderer.setSize(W, H, false);
    composer?.setSize(W, H);
    camera.aspect = W / H;
    camera.fov = portrait ? 52 : 38;
    // Desktop: Szene nach rechts (Text links); Hochformat: nach oben (Text unten)
    if (portrait) camera.setViewOffset(W, H, 0, H * 0.15, W, H);
    else camera.setViewOffset(W, H, -W * (W > 1100 ? 0.17 : 0.1), 0, W, H);
    camera.updateProjectionMatrix();
    P.uniforms.uPR.value = renderer.getPixelRatio();
    (D.sparks.material as THREE.ShaderMaterial).uniforms.uPR.value = renderer.getPixelRatio();
  };
  resize();
  addEventListener('resize', resize, { passive: true });

  // ── Labels (DOM, gestochen scharf) ─────────────────────────────────────
  const lbl = new Map<string, HTMLElement>();
  document.querySelectorAll<HTMLElement>('.labels [data-l]').forEach((el) => lbl.set(el.dataset.l!, el));
  const countEl = document.querySelector<HTMLElement>('[data-l="ring"] [data-count]');
  const tip = document.querySelector<HTMLElement>('.tip');
  const v = new THREE.Vector3();
  const place = (name: string, pos: THREE.Vector3, op: number) => {
    const el = lbl.get(name);
    if (!el) return;
    if (op < 0.01) { if (el.style.opacity !== '0') el.style.opacity = '0'; return; }
    v.copy(pos).project(camera);
    if (v.z > 1 || v.z < -1) { el.style.opacity = '0'; return; }
    const x = (v.x * 0.5 + 0.5) * innerWidth;
    const y = (-v.y * 0.5 + 0.5) * innerHeight;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    el.style.opacity = op.toFixed(3);
  };

  // ── Zeiger: Cursor-Reaktion, Knoten-Tooltip, Türme, Säulen ─────────────
  const mouse = new THREE.Vector2(9, 9);
  const ndc = new THREE.Vector2();
  let pointerX = -1, pointerY = -1, overUi = true, pointerDirty = false;
  const isUi = (t: EventTarget | null) => !!(t as Element)?.closest?.('a, button, input, label, summary, .panel, .qc-card, .card, .site-header, .rail, .trust, .wp, .final, .site-footer');
  addEventListener('pointermove', (e) => {
    pointerX = e.clientX; pointerY = e.clientY; overUi = isUi(e.target); pointerDirty = true;
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  }, { passive: true });
  addEventListener('pointerleave', () => { pointerX = -1; mouse.set(9, 9); });
  const ray = new THREE.Raycaster();
  let hoverTower = -1;
  addEventListener('click', (e) => {
    if (hoverTower < 0 || isUi(e.target)) return;
    bus.emit('world:tower', S.towers[hoverTower].fw);
  });

  const setTip = (html: { title: string; text?: string } | null) => {
    if (!tip) return;
    if (!html) { tip.classList.remove('on'); return; }
    tip.replaceChildren();
    const b = document.createElement('b');
    b.textContent = html.title;
    tip.append(b);
    if (html.text) { const p = document.createElement('div'); p.textContent = html.text; tip.append(p); }
    tip.style.transform = `translate3d(${Math.min(innerWidth - 330, pointerX + 16)}px, ${pointerY + 16}px, 0)`;
    tip.classList.add('on');
  };

  // ── Quick-Check-Zustand ─────────────────────────────────────────────────
  let qc: QcView = state.qc;
  let qcBlend = 0;
  let resultFill = 0;
  bus.on('qc:view', (view: QcView) => {
    qc = view;
    if (view.mode !== 'pick' && view.answers) S.setColumns(view.answers);
  });

  // ── Adaptive Qualität ───────────────────────────────────────────────────
  let frames = 0, acc = 0, warm = 0;
  const downgrade = () => {
    if (tier <= 1) return;
    tier -= 1;
    renderer.setPixelRatio(Math.min(devicePixelRatio, dprCap()));
    if (tier === 2) {
      [R.glass, S.resultGlass, ...R.segments.map((s) => s.glass)].forEach((m) => {
        const mat = m.material as THREE.MeshPhysicalMaterial;
        mat.transmission = 0; mat.opacity = 0.55; mat.needsUpdate = true;
      });
    }
    setupComposer();
    resize();
  };

  // ── Bild-Schleife ───────────────────────────────────────────────────────
  const camP = new THREE.Vector3(), camT = new THREE.Vector3(), qP = new THREE.Vector3(), qT = new THREE.Vector3();
  const curP = new THREE.Vector3(), curT = new THREE.Vector3();
  let uS = stillU ?? state.u;
  let last = performance.now();
  let first = true;
  let time = stillU !== null ? 8 : 0;
  const segLbl = Array.from({ length: 6 }, (_, i) => lbl.get(`seg-${i}`));
  let lastPanel = -1;
  pathAt(uS, curP, curT);

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (document.hidden) return;
    if (stillU === null) time += dt;
    const target = stillU ?? state.u;
    // leichte Kameraträgheit (Bewegung bleibt rein scrollabhängig)
    uS += (target - uS) * (1 - Math.exp(-dt * 6));
    if (Math.abs(target - uS) < 1e-4) uS = target;
    const u = uS;

    // Abgedunkelte Abschnitte: nicht mehr rendern, wenn ganz verdeckt
    if (state.dim > 0.93 && !first && stillU === null) return;

    // Kamera
    pathAt(u, camP, camT);
    if (portrait) {
      // im Hochformat weiter zurück, damit alles ins Bild passt
      const k = 1.28 + 0.15 * band(12.4, 13, 14.2, 14.8, u) + 0.7 * sstep(17.4, 18.4, u);
      camP.sub(camT).multiplyScalar(k).add(camT);
      camT.x *= 1 - 0.5 * sstep(17.4, 18.4, u);
    }
    // Quick-Check: Kamera auf Ergebnisbühne
    const inQc = u > 19.7 && qc.mode !== 'pick';
    qcBlend += ((inQc ? 1 : 0) - qcBlend) * (1 - Math.exp(-dt * 3));
    if (qcBlend > 0.001) {
      qP.set(0, 1.0, -101); qT.set(0, -0.2, -134);
      if (portrait) { qP.set(0, 3.5, -96); qT.set(0, -1.5, -134); }
      camP.lerp(qP, qcBlend); camT.lerp(qT, qcBlend);
    }
    if (first) { curP.copy(camP); curT.copy(camT); }
    curP.lerp(camP, 1 - Math.exp(-dt * 9));
    curT.lerp(camT, 1 - Math.exp(-dt * 9));
    camera.position.copy(stillU !== null ? camP : curP);
    camera.lookAt(stillU !== null ? camT : curT);

    // Partikel
    const pu = P.uniforms;
    pu.uTime.value = time;
    pu.uM1.value = sstep(1.25, 2.7, u);
    pu.uM2.value = sstep(3.15, 4.05, u);
    pu.uFil.value = band(1.4, 2.0, 2.9, 3.4, u) * (tier === 1 ? 0.6 : 0.85);
    pu.uFlat.value = sstep(5, 6, u);
    pu.uHero.value = 1 - sstep(0.7, 2.0, u);
    const neb = 1 - sstep(1.4, 3.2, u);
    nebula.visible = neb > 0.001;
    nebula.children.forEach((c) => ((c as THREE.Sprite).material.opacity = 0.14 * neb));
    pu.uOpacity.value = 1 - sstep(11.8, 12.8, u) * 0.92;
    pu.uFocus.value = camera.position.distanceTo(camT);
    mouse.lerp(pointerX < 0 || overUi ? new THREE.Vector2(9, 9) : ndc, 0.2);
    pu.uMouse.value.copy(mouse);
    P.points.visible = u < 13.5;
    P.lines.visible = pu.uFil.value > 0.01;

    // Statusring und PDCA
    const ringIn = sstep(3.25, 3.95, u);
    const open = sstep(5.0, 5.9, u);
    const ringOut = 1 - sstep(11.7, 12.6, u);
    R.group.visible = ringIn > 0.001 && ringOut > 0.001;
    R.group.rotation.x = (-Math.PI / 2) * sstep(4.85, 5.85, u);
    R.group.scale.setScalar(0.86 + 0.14 * ringIn);
    const fillT = sstep(3.85, 4.6, u);
    R.fill.material.uniforms.uFill.value = 0.59 * fillT;
    R.fill.material.uniforms.uOpacity.value = ringIn * (1 - open);
    R.fill.visible = open < 0.999;
    R.glass.visible = R.track.visible = open < 0.999;
    (R.glass.material as THREE.Material).opacity = (tier >= 3 ? 1 : 0.55) * ringIn * (1 - open);
    (R.track.material as THREE.MeshBasicMaterial).opacity = 0.4 * ringIn * (1 - open);
    R.halo.material.uniforms.uOpacity.value = ringIn * (1 - open * 0.7) * ringOut;
    if (countEl) countEl.textContent = String(Math.round(59 * fillT));
    floorU.uRing.value = ringIn * ringOut;

    const phaseF = clamp(u - 6, -1, 6);
    const active = Math.round(clamp(phaseF, 0, 5));
    R.segments.forEach((s, k) => {
      s.root.visible = open > 0.001 && ringOut > 0.001;
      const out = 0.55 * open;
      s.root.position.set(Math.cos(s.angle) * out, Math.sin(s.angle) * out, 0);
      const isA = k === active && u > 5.6;
      const target = (isA ? 1.6 : 0.5) * open * ringOut;
      s.core.material.opacity += (target - s.core.material.opacity) * 0.15;
      (s.glass.material as THREE.Material).opacity = (tier >= 3 ? 1 : 0.5) * open * ringOut;
    });
    // Screenshot-Platte vor dem aktiven Segment, zur Kamera gedreht
    const panelVis = band(5.75, 6.15, 11.2, 11.65, u) * (portrait ? 0 : 1);
    R.panel.visible = panelVis > 0.001;
    if (R.panel.visible) {
      const th = Math.atan2(camera.position.x, camera.position.z);
      R.panel.position.set(Math.sin(th) * 6.4, 1.7, Math.cos(th) * 6.4);
      R.panel.lookAt(camera.position);
      const frac = clamp(phaseF, 0, 5) - Math.floor(clamp(phaseF, 0, 5) + 0.5);
      const dip = 1 - sstep(0.3, 0.5, Math.abs(frac));
      if (active !== lastPanel) { lastPanel = active; }
      R.setPanelTexture(active);
      R.panel.material.uniforms.uOpacity.value = panelVis * dip;
      R.panel.material.uniforms.uTime.value = time;
    }

    // Fristen
    const tIn = band(12.3, 13.0, 15.4, 16.2, u);
    D.timers.forEach((t, i) => {
      t.group.visible = tIn > 0.001;
      t.fill.material.uniforms.uFill.value = t.target * (0.18 + 0.82 * sstep(12.8 + i * 0.15, 14.2 + i * 0.1, u));
      t.fill.material.uniforms.uOpacity.value = tIn;
      t.track.material.opacity = 0.6 * tIn;
      t.group.rotation.z = 0;
    });
    (D.sparks.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
    (D.sparks.material as THREE.ShaderMaterial).uniforms.uOpacity.value = tIn;
    D.sparks.visible = tIn > 0.001;
    const roadU = D.road.material.uniforms;
    roadU.uDraw.value = 0.02 + 0.98 * sstep(13.1, 17.9, u);
    roadU.uOpacity.value = sstep(12.6, 13.2, u);
    roadU.uTime.value = time;
    D.road.visible = u > 12.5;
    D.milestones.forEach((m) => {
      const lit = sstep(m.s - 0.02, m.s + 0.01, roadU.uDraw.value) * (1 - sstep(17.7, 18.2, u));
      m.mat.opacity = lit;
      m.group.visible = lit > 0.001;
    });

    // Boden
    D.floor.material.uniforms.uOpacity.value = sstep(3.6, 4.6, u);
    D.floor.material.uniforms.uCam.value.copy(camera.position);

    // Türme
    const towerU = u;
    const isResult = qc.mode === 'result' && qc.scores && Object.keys(qc.scores).length > 1;
    S.towers.forEach((t, i) => {
      const grow = sstep(17.6 + i * 0.12, 18.9 + i * 0.12, towerU);
      let h = t.hReq * grow;
      if (isResult && qcBlend > 0.01) {
        const sc = qc.scores![t.fw];
        const hs = sc !== undefined ? Math.max(0.4, (sc / 100) * TOWER_MAX) : 0.5;
        h = lerp(h, hs, qcBlend);
      }
      t.h += (h - t.h) * 0.12;
      const hh = Math.max(0.001, t.h);
      t.root.visible = hh > 0.01;
      t.shell.scale.set(3, hh, 3);
      t.edges.scale.set(3, hh, 3);
      t.glow.scale.set(2.5, hh * 0.996, 2.5);
      t.glow.material.uniforms.uH.value = hh;
      t.glow.material.uniforms.uTime.value = time;
      const boost = i === hoverTower ? 1 : qc.mode !== 'pick' && qc.fw === t.fw ? 0.7 : 0;
      t.glow.material.uniforms.uBoost.value += (boost - t.glow.material.uniforms.uBoost.value) * 0.15;
      const dim = qc.mode === 'question' && qc.fw !== t.fw ? 0.35 : 1;
      t.glow.material.uniforms.uOpacity.value += (dim - t.glow.material.uniforms.uOpacity.value) * 0.1;
      t.door.material.opacity = grow * (0.55 + 0.45 * (i === hoverTower ? 1 : 0.5 + 0.5 * Math.sin(time * 1.6 + i)));
      floorU.uTowers.value[i].set(t.x, -140, grow * 0.9, 0);
    });

    // Ergebnis: Ring + Säulen
    const showRes = qcBlend > 0.01;
    S.resultRing.visible = showRes;
    S.columns.visible = showRes;
    if (showRes) {
      const score = qc.mode === 'result' ? (qc.overall ?? qc.score ?? 0) : 0;
      resultFill += (score / 100 - resultFill) * 0.06;
      S.resultFill.material.uniforms.uFill.value = Math.max(0.001, resultFill) * (qc.mode === 'result' ? 1 : 0);
      const bandHex = score >= 70 ? BAND.green : score >= 40 ? BAND.amber : BAND.red;
      S.resultFill.material.uniforms.uColor.value.copy(color(bandHex, 2.8));
      S.resultFill.material.uniforms.uOpacity.value = qcBlend;
      S.resultRing.rotation.y = Math.sin(time * 0.4) * 0.12 + (mouse.x < 5 ? mouse.x * 0.1 : 0);
      S.resultRing.scale.setScalar(0.6 + 0.4 * qcBlend);
      S.colMeshes.forEach((m) => {
        m.scale.y += ((m.userData.target ?? 0.04) - m.scale.y) * 0.12;
        m.material.opacity = 0.9 * qcBlend;
      });
    }

    // Zeiger-Interaktionen (höchstens einmal pro Bild)
    if (pointerDirty && stillU === null) {
      pointerDirty = false;
      let tipSet = false;
      hoverTower = -1;
      if (!overUi && pointerX >= 0) {
        if (u > 2.2 && u < 3.4) {
          // nächster Knoten am Cursor
          let best = 24 * 24, bi = -1;
          for (let k = 0; k < P.nodePos.length; k++) {
            v.copy(P.nodePos[k]).project(camera);
            const x = (v.x * 0.5 + 0.5) * innerWidth - pointerX, y = (-v.y * 0.5 + 0.5) * innerHeight - pointerY;
            const d = x * x + y * y;
            if (d < best && v.z < 1) { best = d; bi = k; }
          }
          if (bi >= 0) {
            const names = P.nodeFw[bi].map((f) => data?.fwNames?.[f] ?? f).join(' · ');
            setTip({ title: `${data?.qc ? (lang === 'de' ? '1 Antwort →' : '1 answer →') : ''} ${names}` });
            tipSet = true;
          }
        }
        if (u > 18.3) {
          ray.setFromCamera(ndc, camera);
          const hits = ray.intersectObjects(S.towers.map((t) => t.shell), false);
          if (hits.length) hoverTower = S.towers.findIndex((t) => t.shell === hits[0].object);
          if (showRes && !hits.length) {
            const ch = ray.intersectObjects(S.colMeshes.filter((m) => m.visible), false);
            if (ch.length && qc.fw) {
              const i = ch[0].object.userData.index as number;
              const fw = data?.data?.frameworks?.find((f: any) => f.id === qc.fw);
              const q = fw?.questions?.[i];
              if (q) { setTip({ title: `${i + 1}. ${q.q[lang]}`, text: q.rec[lang] }); tipSet = true; }
            }
          }
        }
      }
      if (!tipSet) setTip(null);
      root.classList.toggle('pointer-3d', hoverTower >= 0);
    }

    // Labels
    R.group.getWorldPosition(v);
    place('ring', v.clone(), band(3.85, 4.2, 4.85, 5.2, u) * (1 - qcBlend));
    R.segments.forEach((s, k) => {
      const w = new THREE.Vector3(Math.cos(s.angle) * 6.1, Math.sin(s.angle) * 6.1, 0);
      w.applyMatrix4(R.group.matrixWorld);
      place(`seg-${k}`, w, band(5.7, 6.1, 11.3, 11.7, u) * (k === active ? 1 : 0.55));
      segLbl[k]?.classList.toggle('on', k === active);
    });
    D.timers.forEach((t, i) => place(`timer-${i}`, t.center, band(12.7, 13.2, 14.4, 15.0, u)));
    D.milestones.forEach((m, i) => {
      const dist = camera.position.distanceTo(m.pos);
      const ahead = v.copy(m.pos).sub(camera.position).dot(camera.getWorldDirection(new THREE.Vector3())) > 0;
      place(`ms-${i}`, m.pos, ahead ? sstep(60, 34, dist) * sstep(3, 8, dist) * m.mat.opacity * band(14, 14.6, 17.9, 18.4, u) : 0);
    });
    S.towers.forEach((t, i) => {
      const top = new THREE.Vector3(t.x, FLOOR_Y + t.h + 0.6, -140);
      place(`tower-${i}`, top, sstep(18.3, 19.0, u) * (1 - sstep(19.75, 19.95, u) * (portrait ? 1 : 1 - qcBlend)) * (t.h > 0.5 ? 1 : 0));
      const valEl = lbl.get(`tower-${i}`)?.querySelector<HTMLElement>('[data-tower-val]');
      if (valEl) {
        const sc = isResult ? qc.scores?.[t.fw] : undefined;
        const txt = sc !== undefined ? `${sc} %` : String([268, 318, 130, 111, 83][i]);
        if (valEl.textContent !== txt) valEl.textContent = txt;
      }
    });

    // Rendern
    if (composer) composer.render(dt);
    else renderer.render(scene, camera);

    if (first) {
      first = false;
      root.classList.add('has3d');
      if (stillU !== null) setTimeout(() => (root.dataset.still = 'ready'), 2500);
    }

    // Leistung messen und ggf. herunterschalten
    if (stillU === null) {
      warm++;
      if (warm > 90) {
        frames++; acc += dt;
        if (frames >= 120) {
          if (acc / frames > 1 / 38) downgrade();
          frames = 0; acc = 0;
        }
      }
    }
  };
  bus.on('frame', frame);

  // Kontextverlust: zurück auf Standbilder
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); root.classList.remove('has3d'); });

  // Schnappschuss (PDF / Standbilder)
  (window as any).__uqSnap = (type = 'image/jpeg', q = 0.92) => {
    if (composer) composer.render(0); else renderer.render(scene, camera);
    return canvas.toDataURL(type, q);
  };
  bus.on('world:snapshot', (cb: (url: string) => void) => cb((window as any).__uqSnap()));
}
