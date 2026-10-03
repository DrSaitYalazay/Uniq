/**
 * Global PDF progress store.
 *
 * Any PDF generator across the app emits progress here so a single
 * <PdfProgressOverlay /> mounted in App.tsx can show a unified
 * progress + ETA modal — without needing to thread callbacks through
 * every export function.
 */

export type PdfProgressPhase = "prepare" | "render" | "finalize";

export interface PdfProgressState {
  active: boolean;
  label: string;
  done: number;
  total: number;
  phase: PdfProgressPhase;
  startedAt: number;
}

const initial: PdfProgressState = {
  active: false,
  label: "",
  done: 0,
  total: 0,
  phase: "prepare",
  startedAt: 0,
};

let state: PdfProgressState = { ...initial };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export const pdfProgress = {
  start(label = "PDF") {
    state = { active: true, label, done: 0, total: 1, phase: "prepare", startedAt: Date.now() };
    emit();
  },
  setTotal(total: number, phase: PdfProgressPhase = "render") {
    state = { ...state, total: Math.max(1, total), phase };
    emit();
  },
  update(done: number, total?: number, phase?: PdfProgressPhase) {
    state = {
      ...state,
      done,
      total: total ?? state.total,
      phase: phase ?? state.phase,
    };
    emit();
  },
  finalize() {
    state = { ...state, phase: "finalize", done: state.total };
    emit();
  },
  end() {
    state = { ...initial };
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
  getState: (): PdfProgressState => state,
};

/**
 * Helper: wrap a PDF-producing async function with start/end calls,
 * so light-weight generators get at least a spinner without code changes.
 */
export async function withPdfProgress<T>(label: string, fn: () => Promise<T>): Promise<T> {
  pdfProgress.start(label);
  try {
    const res = await fn();
    return res;
  } finally {
    pdfProgress.end();
  }
}
