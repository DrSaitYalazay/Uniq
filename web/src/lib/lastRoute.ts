// Tracks the user's last visited protected pipeline route so we can restore
// them there after a forced sign-out / token-refresh / browser reload.

const KEY = "nis2:last-route";

// Routes we never want to "restore" the user back to.
const EXCLUDED_PREFIXES = [
  "/auth",
  "/reset-password",
  "/accept-invite",
  "/unsubscribe",
];

export function isRestorablePath(path: string): boolean {
  if (!path || path === "/") return false;
  return !EXCLUDED_PREFIXES.some((p) => path.startsWith(p));
}

export function rememberRoute(pathWithSearch: string) {
  try {
    if (!isRestorablePath(pathWithSearch)) return;
    localStorage.setItem(KEY, pathWithSearch);
  } catch {}
}

export function getRememberedRoute(): string | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v && isRestorablePath(v)) return v;
    return null;
  } catch {
    return null;
  }
}

export function clearRememberedRoute() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
