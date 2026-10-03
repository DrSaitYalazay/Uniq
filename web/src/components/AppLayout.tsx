import { useState, useEffect, useMemo, Suspense, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import AppSidebar, { SIDEBAR_STATE_KEY } from "./AppSidebar";
import AppHeader from "./AppHeader";
import PageErrorBoundary from "./PageErrorBoundary";
import { PHASE_GROUPS_V2 } from "@/config/phaseGroups";
import { useLanguage } from "@/contexts/LanguageContext";
import { rememberRoute } from "@/lib/lastRoute";

const ContentLoader = () => (
  <div className="flex-1 min-w-0 flex items-center justify-center p-8">
    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_STATE_KEY) === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { lang } = useLanguage();

  useEffect(() => {
    rememberRoute(location.pathname + location.search);
  }, [location.pathname, location.search]);

  const currentPhase = useMemo(() => {
    return PHASE_GROUPS_V2.find((p) =>
      location.pathname === p.path || location.pathname.startsWith(p.path + "/"),
    );
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden md:block">
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full z-50 md:hidden">
            <AppSidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden sticky top-0 z-30 bg-primary text-primary-foreground px-3 py-2 flex items-center gap-2 border-b border-primary/40">
          <button
            onClick={() => setMobileOpen(true)}
            className="size-8 rounded hover:bg-primary-foreground/10 flex items-center justify-center"
            aria-label={lang === "de" ? "Menü öffnen" : "Open menu"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <div className="text-xs font-bold uppercase tracking-wider truncate">
            {currentPhase ? (lang === "de" ? currentPhase.de : currentPhase.en) : (lang === "de" ? "Menü" : "Menu")}
          </div>
        </div>

        <AppHeader />

        <div className="flex-1 min-w-0">
          <PageErrorBoundary key={location.pathname}>
            <Suspense fallback={<ContentLoader />}>{children}</Suspense>
          </PageErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
