import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Changes to this key force a fresh mount (used to retry a failed subtree). */
  resetKey?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryKey: number;
}

const RELOAD_GUARD_KEY = "nis2:chunk-reload-guard";

/**
 * Detects "failed to load module" / stale-chunk errors that happen after a
 * deploy when the previously loaded HTML references chunks that no longer exist.
 */
function isStaleChunkError(error: Error | null): boolean {
  if (!error) return false;
  const msg = `${error.name} ${error.message}`.toLowerCase();
  return (
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("importing a module script failed") ||
    msg.includes("loading chunk") ||
    msg.includes("loading css chunk")
  );
}

/**
 * Per-page error boundary used inside AppLayout.
 *
 * - Stays on the current route. Retry just remounts the subtree.
 * - On stale-chunk errors after a deploy, reloads the current URL once
 *   automatically (guarded against reload loops via sessionStorage).
 * - Only the explicit "Startseite" button navigates home.
 */
class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("PageErrorBoundary caught:", error, errorInfo);

    if (isStaleChunkError(error)) {
      try {
        const alreadyReloaded = sessionStorage.getItem(RELOAD_GUARD_KEY);
        if (!alreadyReloaded) {
          sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
          // Reload current URL to fetch fresh chunks. No redirect to "/".
          window.location.reload();
        }
      } catch {
        /* sessionStorage unavailable — fall through to inline UI */
      }
    } else {
      // Successful render of a non-chunk error path → clear any stale guard
      // so the next deploy can auto-recover again.
      try {
        sessionStorage.removeItem(RELOAD_GUARD_KEY);
      } catch {}
    }
  }

  handleRetry = () => {
    this.setState((s) => ({
      hasError: false,
      error: null,
      retryKey: s.retryKey + 1,
    }));
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      const stale = isStaleChunkError(this.state.error);
      return (
        <div className="flex-1 min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border rounded-xl p-6 text-center space-y-5 shadow-sm">
            <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold font-heading text-foreground">
                {stale
                  ? "Neue Version verfügbar / New version available"
                  : "Etwas ist schiefgelaufen / Something went wrong"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {stale
                  ? "Die Seite wird neu geladen…"
                  : "Sie können diese Seite erneut versuchen, ohne Ihren Fortschritt zu verlieren."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={this.handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Erneut versuchen / Retry
              </Button>
              <Button onClick={this.handleHome} variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                Startseite
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // `key` forces a fresh mount of the subtree on retry.
    return <div key={this.state.retryKey} className="contents">{this.props.children}</div>;
  }
}

export default PageErrorBoundary;
