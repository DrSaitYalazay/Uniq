/**
 * Demo-Anfrage: Links mit [data-anfrage] öffnen den Dialog statt mailto.
 * Ohne JavaScript bleibt der mailto-Link als Rückfallebene.
 * Versand: POST /api/anfrage (gleicher Ursprung; Caddy reicht an die App weiter).
 * Keine Speicherung im Browser, kein Tracking.
 */
import { state } from './state';

const FREEMAIL = new Set([
  'gmail.com', 'googlemail.com', 'gmx.de', 'gmx.net', 'gmx.at', 'gmx.ch', 'gmx.com',
  'web.de', 't-online.de', 'freenet.de', 'arcor.de', 'online.de', 'email.de', 'mail.de',
  'posteo.de', 'posteo.net', 'mailbox.org', 'outlook.com', 'outlook.de', 'hotmail.com',
  'hotmail.de', 'live.com', 'live.de', 'msn.com', 'yahoo.com', 'yahoo.de', 'ymail.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com', 'aol.de', 'proton.me', 'protonmail.com',
  'protonmail.ch', 'tutanota.com', 'tutanota.de', 'tuta.io', 'zoho.com', 'yandex.com',
  'yandex.ru', 'mail.ru', 'bluewin.ch', 'gmx.li', 'kabelmail.de', 'vodafonemail.de',
]);
const EMAIL_RE = /^[A-Za-z0-9._%+-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;
const PHONE_RE = /^\+?[0-9][0-9 ()/.-]{4,30}[0-9]$/;

/** Öffnen und Schließen als Kamerafahrt: hinein zur angeklickten Stelle, heraus beim Schließen. */
function zoomed(from: HTMLElement | null, dir: 'vt-in' | 'vt-out', change: () => void) {
  const d = document as any;
  if (!d.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) { change(); return; }
  const root = document.documentElement;
  if (from) {
    const r = from.getBoundingClientRect();
    root.style.setProperty('--vt-x', `${Math.round((r.left + r.width / 2) / innerWidth * 100)}%`);
    root.style.setProperty('--vt-y', `${Math.round((r.top + r.height / 2) / innerHeight * 100)}%`);
  } else { root.style.setProperty('--vt-x', '50%'); root.style.setProperty('--vt-y', '50%'); }
  root.classList.add(dir);
  const vt = d.startViewTransition(change);
  vt.finished.finally(() => root.classList.remove(dir));
}

export function initAnfrage() {
  const dlg = document.querySelector<HTMLDialogElement>('[data-af-dialog]');
  const form = dlg?.querySelector<HTMLFormElement>('[data-af-form]');
  if (!dlg || !form || typeof dlg.showModal !== 'function') return;

  const wrap = dlg.querySelector<HTMLElement>('[data-af-form-wrap]')!;
  const done = dlg.querySelector<HTMLElement>('[data-af-done]')!;
  const status = dlg.querySelector<HTMLElement>('[data-af-status]')!;
  const submit = dlg.querySelector<HTMLButtonElement>('[data-af-submit]')!;
  const emailErr = dlg.querySelector<HTMLElement>('[data-af-email-err]')!;
  const ds = form.dataset;
  const field = (n: string) => form.elements.namedItem(n) as HTMLInputElement;
  let openedAt = 0;
  let opener: HTMLElement | null = null;

  const open = (from: HTMLElement | null) => {
    opener = from;
    openedAt = performance.now();
    if (!done.hidden) { // nach einer gesendeten Anfrage: neues, leeres Formular
      form.reset();
      done.hidden = true;
      wrap.hidden = false;
    }
    status.textContent = '';
    status.classList.remove('err');
    state.lenis?.stop(); // Seite steht still, das Formular scrollt selbst
    zoomed(from, 'vt-in', () => { dlg.showModal(); field('company').focus(); });
  };
  const close = () => zoomed(null, 'vt-out', () => dlg.close());
  dlg.addEventListener('close', () => { state.lenis?.start(); opener?.focus(); });

  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLElement>('[data-anfrage]');
    if (!a || (e as MouseEvent).metaKey || (e as MouseEvent).ctrlKey || (e as MouseEvent).shiftKey) return;
    e.preventDefault();
    open(a);
  });
  dlg.querySelectorAll('[data-af-close]').forEach((b) => b.addEventListener('click', close));
  // Klick auf den abgedunkelten Hintergrund schließt
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  // Esc ebenfalls mit Zoom heraus
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });

  // ── Prüfung (Meldung erst nach Interaktion, siehe CSS :user-invalid) ─────
  const email = field('email');
  const phone = field('phone');
  const checkEmail = () => {
    const v = email.value.trim();
    let msg = '';
    if (v && !EMAIL_RE.test(v)) msg = ds.errEmail!;
    else if (v && FREEMAIL.has(v.split('@')[1].toLowerCase())) msg = ds.errBusiness!;
    email.setCustomValidity(msg);
    emailErr.textContent = msg || (v ? '' : ds.errRequired!) || ds.errEmail!;
  };
  const checkPhone = () => {
    const v = phone.value.trim();
    phone.setCustomValidity(v && !PHONE_RE.test(v) ? ds.errPhone! : '');
  };
  form.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.name !== 'email' && el.name !== 'phone') el.setCustomValidity('');
    el.closest('.af-field')?.classList.remove('has-err');
  });
  email.addEventListener('input', checkEmail);
  phone.addEventListener('input', checkPhone);
  // aria-invalid wie die sichtbare Markierung erst nach Verlassen des Feldes
  form.addEventListener('focusout', (e) => {
    const el = e.target as HTMLInputElement;
    if (el instanceof HTMLInputElement && el.name !== 'website') el.setAttribute('aria-invalid', String(!el.checkValidity()));
  });

  const setStatus = (msg: string, err = false, withMail = false) => {
    status.replaceChildren(document.createTextNode(msg));
    if (withMail) {
      const a = document.createElement('a');
      a.href = `mailto:${ds.mail}`;
      a.textContent = ds.mail!;
      status.append(' ', a, '.');
    }
    status.classList.toggle('err', err);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    checkEmail();
    checkPhone();
    const inputs = Array.from(form.querySelectorAll<HTMLInputElement>('input:not([name="website"])'));
    inputs.forEach((i) => i.setAttribute('aria-invalid', String(!i.checkValidity())));
    const firstBad = inputs.find((i) => !i.checkValidity());
    if (firstBad) {
      form.classList.add('tried');
      inputs.forEach((i) => i.closest('.af-field')?.classList.toggle('has-err', !i.checkValidity()));
      firstBad.focus();
      return;
    }
    inputs.forEach((i) => i.closest('.af-field')?.classList.remove('has-err'));
    const body = {
      company: field('company').value,
      firstName: field('firstName').value,
      lastName: field('lastName').value,
      email: email.value.trim(),
      phone: phone.value.trim(),
      website: field('website').value,
      lang: ds.lang,
      elapsedMs: 0,
    };
    // Mindestdauer (Bot-Filter auf dem Server): sehr schnelles Ausfüllen per
    // Autofill wird kurz abgewartet statt verworfen.
    const elapsed = performance.now() - openedAt;
    if (elapsed < 2600) await new Promise((r) => setTimeout(r, 2600 - elapsed));
    body.elapsedMs = Math.round(performance.now() - openedAt);
    dlg.dataset.state = 'sending';
    submit.disabled = true;
    setStatus(ds.sending!);
    try {
      const r = await fetch('/api/anfrage', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'omit',
        cache: 'no-store',
      });
      if (r.ok) {
        wrap.hidden = true;
        done.hidden = false;
        setStatus('');
        dlg.querySelector<HTMLElement>('[data-af-done-title]')?.focus();
      } else if (r.status === 400) {
        const j = await r.json().catch(() => ({}));
        const f = j?.field === 'email_business' ? 'email' : j?.field;
        const el = f ? field(f) : null;
        if (el) {
          el.setCustomValidity(f === 'email' && j.field === 'email_business' ? ds.errBusiness! : (f === 'phone' ? ds.errPhone! : ds.errRequired!));
          el.closest('.af-field')?.classList.add('has-err');
          if (f === 'email') emailErr.textContent = el.validationMessage;
          el.setAttribute('aria-invalid', 'true');
          el.focus();
          setStatus('');
        } else setStatus(ds.errServer!, true, true);
      } else if (r.status === 429) {
        setStatus(ds.errLimit!, true, true);
      } else {
        setStatus(ds.errServer!, true, true);
      }
    } catch {
      setStatus(ds.errServer!, true, true);
    } finally {
      delete dlg.dataset.state;
      submit.disabled = false;
    }
  });
}
