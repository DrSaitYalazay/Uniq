/**
 * Quick-Check: läuft vollständig im Browser. Keine Übertragung, keine Speicherung.
 * DOM wird ohne innerHTML aufgebaut (Trusted Types).
 */
import { bus, state, type Answer, type QcView } from '../state';

type Q = { id: string; weight: number; ref: Record<string, string>; q: Record<string, string>; why: Record<string, string>; rec: Record<string, string> };
type Fw = { id: string; color: string; requirements: number; name: Record<string, string>; intro: Record<string, string>; questions: Q[] };

const VAL: Record<Answer, number> = { yes: 100, partly: 50, no: 0 };

export function scoreOf(fw: Fw, answers: (Answer | null)[]) {
  let s = 0, w = 0;
  fw.questions.forEach((q, i) => { const a = answers[i]; if (a) { s += VAL[a] * q.weight; w += q.weight; } });
  return w ? Math.round(s / w) : 0;
}
export const bandOf = (x: number) => (x >= 70 ? 'green' : x >= 40 ? 'amber' : 'red') as 'green' | 'amber' | 'red';

type Child = Node | string | null | undefined | false;
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string | boolean | number | ((e: Event) => void)> = {}, ...kids: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (v === false || v === undefined) continue;
    else if (k === 'class') el.className = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of kids) if (c !== null && c !== undefined && c !== false) el.append(c as Node | string);
  return el;
}
const svgNS = 'http://www.w3.org/2000/svg';
function barSvg(value: number, label: string) {
  const s = document.createElementNS(svgNS, 'svg');
  s.setAttribute('class', 'bar'); s.setAttribute('viewBox', '0 0 100 8'); s.setAttribute('preserveAspectRatio', 'none');
  s.setAttribute('role', 'img'); s.setAttribute('aria-label', label);
  const t = document.createElementNS(svgNS, 'rect'); t.setAttribute('class', 'track'); t.setAttribute('width', '100'); t.setAttribute('height', '8'); t.setAttribute('rx', '4');
  const v = document.createElementNS(svgNS, 'rect'); v.setAttribute('class', 'val'); v.setAttribute('width', String(Math.max(1, value))); v.setAttribute('height', '8'); v.setAttribute('rx', '4');
  s.append(t, v);
  return s;
}

export function init() {
  const D = state.data();
  if (!D) return;
  const lang: 'de' | 'en' = D.lang;
  const T = D.qc;
  const frameworks: Fw[] = D.data.frameworks;
  const byId = new Map(frameworks.map((f) => [f.id, f]));
  const card = document.querySelector<HTMLElement>('[data-qc]')!;
  const section = document.getElementById('quick-check')!;
  const fmt = (s: string, o: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(o[k] ?? ''));

  const results = new Map<string, (Answer | null)[]>();
  let cur: { fw: Fw; i: number; answers: (Answer | null)[] } | null = null;
  let view: 'pick' | 'question' | 'result' = 'pick';
  let lastFw: Fw | null = null;

  const scores = () => Object.fromEntries([...results].map(([id, a]) => [id, scoreOf(byId.get(id)!, a)]));
  const overall = () => { const v = Object.values(scores()); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };

  function emit() {
    const v: QcView = { mode: view, fw: (cur?.fw ?? lastFw)?.id, index: cur?.i, scores: scores(), overall: results.size > 1 ? overall() : null };
    if (view === 'question' && cur) v.answers = cur.answers;
    if (view === 'result' && lastFw) { v.answers = results.get(lastFw.id); v.score = scores()[lastFw.id]; }
    state.qc = v;
    bus.emit('qc:view', v);
  }

  let focusOk = false; // beim ersten Aufbau nicht fokussieren (kein Fokus-Sprung)
  function swap(nodes: (Node | null | false | undefined)[]) {
    card.replaceChildren(...(nodes.filter(Boolean) as Node[]));
    card.classList.remove('swap');
    void card.offsetWidth;
    card.classList.add('swap');
    if (focusOk) card.querySelector<HTMLElement>('[data-qc-focus]')?.focus({ preventScroll: true });
    focusOk = true;
  }

  // ── Auswahl ─────────────────────────────────────────────────────────────
  function renderPick() {
    view = 'pick'; cur = null;
    const list = h('div', { class: 'qc-pick' }, ...frameworks.map((f) => {
      const done = results.has(f.id) ? scores()[f.id] : null;
      return h('button', { type: 'button', class: `fw-choice fw-${f.id}`, 'data-start': f.id },
        h('i'),
        h('span', {}, h('b', {}, f.name[lang]), f.id === 'cra' ? h('small', {}, T.craNote) : null),
        done !== null ? h('span', { class: 'meta done' }, `✓ ${done} %`) : h('span', { class: 'meta' }, fmt(T.questionsCount, { n: f.questions.length })),
      );
    }));
    const nodes: Node[] = [h('h3', { class: 'res-h', 'data-qc-focus': true, tabindex: '-1' }, T.pick), list];
    if (results.size) {
      nodes.push(h('p', { class: 'small muted' }, fmt(T.done, { n: results.size, m: frameworks.length })));
      nodes.push(h('div', { class: 'res-actions' }, h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => renderResult() }, T.resultKicker)));
    }
    swap(nodes);
    emit();
  }

  // ── Frage ───────────────────────────────────────────────────────────────
  function start(id: string) {
    const fw = byId.get(id);
    if (!fw) return;
    cur = { fw, i: 0, answers: fw.questions.map(() => null) };
    lastFw = fw;
    renderQuestion();
    const r = card.getBoundingClientRect();
    if (r.top < 60 || r.top > innerHeight * 0.45) state.scrollToEl(card, false, -96);
  }

  function renderQuestion() {
    if (!cur) return;
    view = 'question';
    const { fw, i, answers } = cur;
    const q = fw.questions[i];
    const n = fw.questions.length;
    const bar = h('i');
    bar.style.transform = `scaleX(${(i + (answers[i] ? 1 : 0)) / n})`;
    const btn = (v: Answer, key: string) => h('button', { type: 'button', class: 'ans', 'data-v': v, 'aria-pressed': answers[i] === v ? 'true' : 'false', 'aria-keyshortcuts': key, onclick: () => answer(v) }, T.answers[v], h('kbd', {}, key));
    swap([
      h('div', { class: `qc-top fw-${fw.id}` }, h('b', {}, fw.name[lang]), h('span', {}, fmt(T.progress, { i: i + 1, n }))),
      h('div', { class: `qc-bar fw-${fw.id}`, role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(n), 'aria-valuenow': String(i), 'aria-label': fmt(T.progress, { i: i + 1, n }) }, bar),
      i === 0 && fw.id === 'cra' ? h('p', { class: 'qc-note' }, T.craNote) : null,
      h('p', { class: 'qc-ref' }, `${T.ref}: ${q.ref[lang]}`),
      h('h3', { class: 'qc-q', 'data-qc-focus': true, tabindex: '-1', id: 'qc-q' }, q.q[lang]),
      h('fieldset', { class: 'qc-answers', 'aria-labelledby': 'qc-q' }, h('legend', { class: 'sr-only' }, q.q[lang]), btn('yes', '1'), btn('partly', '2'), btn('no', '3')),
      h('details', { class: 'qc-why' }, h('summary', {}, T.why), h('p', {}, q.why[lang])),
      h('div', { class: 'qc-foot' },
        i > 0 ? h('button', { type: 'button', class: 'link-btn', onclick: back }, `← ${T.back}`) : h('button', { type: 'button', class: 'link-btn', onclick: () => renderPick() }, T.cancel),
        h('span', { class: 'small muted' }, T.keys),
      ),
    ]);
    emit();
  }

  let advancing = 0;
  function answer(v: Answer) {
    if (!cur) return;
    cur.answers[cur.i] = v;
    emit();
    card.querySelectorAll<HTMLElement>('.ans').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    clearTimeout(advancing);
    advancing = window.setTimeout(next, 260);
  }
  function next() {
    if (!cur) return;
    if (!cur.answers[cur.i]) return;
    if (cur.i < cur.fw.questions.length - 1) { cur.i++; renderQuestion(); }
    else { results.set(cur.fw.id, cur.answers.slice()); lastFw = cur.fw; cur = null; renderResult(); }
  }
  function back() { if (cur && cur.i > 0) { cur.i--; renderQuestion(); } }

  // ── Ergebnis ────────────────────────────────────────────────────────────
  function renderResult() {
    view = 'result';
    cur = null;
    const fw = lastFw ?? byId.get([...results.keys()][0]!)!;
    const ans = results.get(fw.id)!;
    const sc = scoreOf(fw, ans);
    const all = scores();
    const ov = results.size > 1 ? overall()! : null;
    const shown = ov ?? sc;
    const b = bandOf(shown);

    const gaps = fw.questions.map((q, i) => ({ q, i, a: ans[i]! }))
      .filter((x) => x.a !== 'yes')
      .sort((x, y) => (x.a === y.a ? y.q.weight - x.q.weight || x.i - y.i : x.a === 'no' ? -1 : 1));

    const colWrap = h('div', { class: `res-cols`, role: 'img', 'aria-label': T.columnsLabel });
    ans.forEach((a, i) => {
      const c = h('i', { class: a === 'yes' ? 'b-green' : a === 'partly' ? 'b-amber' : 'b-red', title: `${i + 1}. ${T.answers[a!]}` });
      c.style.height = `${a === 'yes' ? 100 : a === 'partly' ? 52 : 10}%`;
      colWrap.append(c);
    });

    const fwRows = results.size > 1
      ? h('div', { class: 'res-fws' }, ...frameworks.filter((f) => results.has(f.id)).map((f) =>
          h('div', { class: `res-fw fw-${f.id}` }, h('span', {}, f.name[lang]), barSvg(all[f.id], `${all[f.id]} %`), h('b', {}, `${all[f.id]} %`))))
      : null;

    const gapList = gaps.length
      ? h('ol', { class: 'gaps' }, ...gaps.slice(0, 3).map((g) => h('li', { class: `gap ${g.a === 'no' ? 'b-red' : 'b-amber'}` },
          h('b', {}, g.q.q[lang]), h('p', {}, g.q.rec[lang]), h('small', {}, `${T.answers[g.a]} · ${g.q.ref[lang]}`))))
      : h('p', { class: 'muted' }, T.noGaps);

    const allRecs = gaps.length > 3
      ? h('details', { class: 'res-table' }, h('summary', {}, `${T.allRecs} (${gaps.length})`),
          h('ol', { class: 'gaps' }, ...gaps.slice(3).map((g) => h('li', { class: `gap ${g.a === 'no' ? 'b-red' : 'b-amber'}` }, h('b', {}, g.q.q[lang]), h('p', {}, g.q.rec[lang]), h('small', {}, `${T.answers[g.a]} · ${g.q.ref[lang]}`)))))
      : null;

    // Tabelle als barrierefreie Alternative zur 3D-Darstellung
    const table = h('details', { class: 'res-table' }, h('summary', {}, T.tableSummary),
      ...frameworks.filter((f) => results.has(f.id)).map((f) => {
        const a = results.get(f.id)!;
        return h('table', {},
          h('caption', { class: 'small muted' }, `${f.name[lang]} – ${all[f.id]} %`),
          h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, '#'), h('th', { scope: 'col' }, T.table.q), h('th', { scope: 'col' }, T.table.a), h('th', { scope: 'col' }, T.table.ref))),
          h('tbody', {}, ...f.questions.map((q, i) => h('tr', {}, h('td', {}, String(i + 1)), h('td', {}, q.q[lang]), h('td', {}, T.answers[a[i]!]), h('td', {}, q.ref[lang])))));
      }));

    const company = h('input', { type: 'text', id: 'qc-company', autocomplete: 'organization', maxlength: '80' }) as HTMLInputElement;
    company.value = (state as any).company ?? '';
    company.addEventListener('input', () => ((state as any).company = company.value));
    const pdfBtn = h('button', { type: 'button', class: 'btn btn-primary' }, T.pdf) as HTMLButtonElement;
    pdfBtn.addEventListener('click', async () => {
      pdfBtn.disabled = true;
      const label = pdfBtn.textContent;
      pdfBtn.textContent = T.pdfBusy;
      try {
        const m = await import('./pdf');
        await m.makePdf({ D, results, company: company.value.trim(), snapshot: (window as any).__uqSnap?.('image/jpeg', 0.9) ?? null });
      } catch (err) { console.error(err); }
      pdfBtn.disabled = false;
      pdfBtn.textContent = label;
    });

    const scoreEl = h('p', { class: `score b-${b}` }, h('span', { 'data-score': true }, '0'), h('small', {}, '%'));
    swap([
      h('p', { class: 'kicker' }, T.resultKicker),
      h('h3', { class: 'res-h', 'data-qc-focus': true, tabindex: '-1' }, ov !== null ? `${T.overall} · ${[...results.keys()].map((id) => byId.get(id)!.name[lang]).join(', ')}` : fw.name[lang]),
      h('div', { class: 'result-head' }, scoreEl, h('span', { class: `band b-${b}` }, h('i'), T.bands[b])),
      fwRows,
      h('p', { class: 'sr-only' }, `${shown} %, ${T.bands[b]}`),
      h('h4', { class: 'res-h' }, `${fw.name[lang]} · ${T.columnsLabel}`),
      colWrap,
      h('h4', { class: 'res-h' }, T.gapsTitle),
      gapList,
      allRecs,
      results.has('aiact') ? h('p', { class: 'small muted' }, T.fineNote) : null,
      h('div', { class: 'whatuniq' }, h('b', {}, T.whatUniqTitle), h('p', {}, T.whatUniq)),
      h('div', { class: 'res-actions' },
        h('a', { class: 'btn btn-primary', href: D.login }, T.ctaLogin),
        h('a', { class: 'btn btn-ghost', href: D.demo, 'data-anfrage': '' }, document.querySelector('.header-actions .btn-ghost')?.textContent?.trim() || 'Demo'),
      ),
      h('label', { class: 'field', for: 'qc-company' }, T.company, company),
      h('div', { class: 'res-actions' }, pdfBtn,
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => renderPick() }, T.another),
        h('button', { type: 'button', class: 'link-btn', onclick: () => { results.clear(); lastFw = null; renderPick(); } }, T.restart)),
      table,
      h('p', { class: 'disclaimer' }, T.disclaimer),
    ]);
    // Zahl hochzählen
    const el = scoreEl.querySelector<HTMLElement>('[data-score]')!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) el.textContent = String(shown);
    else {
      const t0 = performance.now();
      const step = (t: number) => { const k = Math.min(1, (t - t0) / 1000); el.textContent = String(Math.round(shown * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
    emit();
  }

  // ── Tastatur ────────────────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (view !== 'question' || !cur || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select')) return;
    const r = section.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const map: Record<string, Answer> = { '1': 'yes', '2': 'partly', '3': 'no' };
    if (map[e.key]) { e.preventDefault(); answer(map[e.key]); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    else if (e.key === 'ArrowRight' && cur.answers[cur.i]) { e.preventDefault(); next(); }
  });

  bus.on('qc:start', (id: string) => start(id));
  renderPick();
}
