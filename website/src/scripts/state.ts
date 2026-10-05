/** Gemeinsamer Zustand und einfacher Ereignisbus zwischen Seite, 3D-Welt und Quick-Check. */
import type Lenis from 'lenis';

type Fn = (arg?: any) => void;
const handlers = new Map<string, Set<Fn>>();

export const bus = {
  on(ev: string, fn: Fn) {
    if (!handlers.has(ev)) handlers.set(ev, new Set());
    handlers.get(ev)!.add(fn);
    return () => handlers.get(ev)!.delete(fn);
  },
  emit(ev: string, arg?: unknown) {
    handlers.get(ev)?.forEach((fn) => fn(arg));
  },
};

export type Answer = 'yes' | 'partly' | 'no';
export interface QcView {
  mode: 'pick' | 'question' | 'result';
  fw?: string;
  index?: number;
  /** Antworten der aktuellen Frage-Reihe (null = noch offen) */
  answers?: (Answer | null)[];
  score?: number;
  overall?: number | null;
  scores?: Record<string, number>;
}

export const state = {
  /** Weltparameter aus der Scrollposition (0 … 18.1) */
  u: 0,
  /** Abdunkelung der Szene (0 … 1) */
  dim: 0,
  /** Statusring auf dem Bildschirm (nur rund um Regelwerke/Funktionen gesetzt) */
  ring: null as null | { cx: number; cy: number; rx: number; ry: number },
  lenis: null as Lenis | null,
  scrollToEl: (_el: HTMLElement, _push?: boolean, _offset?: number) => {},
  qc: { mode: 'pick' } as QcView,
  data(): any {
    const el = document.getElementById('uq-data');
    if (!el) return null;
    return ((state as any)._d ??= JSON.parse(el.textContent || '{}'));
  },
};

/** Zurücknehmen hinterer Karten: dunkel abdunkeln, hell aufhellen (deckend bleibt beides). */
export const dimFilter = (k: number) =>
  document.documentElement.dataset.theme === 'light'
    ? `brightness(${(1 + (1 - k) * 0.9).toFixed(2)}) saturate(${(0.4 + 0.6 * k).toFixed(2)})`
    : `brightness(${k.toFixed(2)})`;
