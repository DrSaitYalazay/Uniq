/**
 * frameworkBus — tiny cross-page notifier so that when Scope persists a new
 * `enabled_frameworks` / `kritis_sub_sectors` selection, any open page
 * (Assessment, Risk, Roadmap, …) can re-read it without a full reload.
 */

const EVENT = "cws:frameworks-updated";

export interface FrameworkUpdatePayload {
  enabled_frameworks: string[];
  kritis_sub_sectors: string[];
}

export function emitFrameworksUpdated(payload: FrameworkUpdatePayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: payload }));
}

export function onFrameworksUpdated(cb: (p: FrameworkUpdatePayload) => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<FrameworkUpdatePayload>).detail;
    if (detail) cb(detail);
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
