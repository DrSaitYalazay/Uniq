import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import ShieldLogo from "@/components/ShieldLogo";
import { PHASE_GROUPS_V2, STANDALONE_TOOLS, pdcaTitle } from "@/config/phaseGroups";
import { VISIBLE_TOOL_IDS } from "@/config/uniqFeatures";

export const SIDEBAR_STATE_KEY = "cws-sidebar-collapsed";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { lang } = useLanguage();
  const de = lang === "de";

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const width = collapsed ? "w-16" : "w-64";

  return (
    <aside
      // Festes Marken-Navy (bg-sidebar = --sidebar-background), in Hell und Dunkel gleich.
      className={`${width} shrink-0 h-screen sticky top-0 z-10 border-r border-transparent bg-sidebar text-sidebar-foreground flex flex-col transition-[width] duration-200 shadow-[6px_0_22px_-6px_hsl(220_65%_12%/0.45)] dark:shadow-[6px_0_22px_-6px_hsl(220_80%_3%/0.75),1px_0_0_hsl(220_35%_34%/0.35)]`}
    >
      <div className="flex items-center gap-2 px-3 py-3 border-b border-sidebar-border">
        <ShieldLogo className="size-8 shrink-0" />
        {!collapsed && (
          <div className="font-bold text-sm truncate text-sidebar-foreground">
            Uniq<span className="gold-gradient-text">Suite</span>
          </div>
        )}
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="ml-auto size-7 rounded hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {PHASE_GROUPS_V2.map((phase, idx) => {
          const Icon = phase.icon;
          const active = pathname === phase.path || pathname.startsWith(phase.path + "/");
          return (
            <button
              key={phase.id}
              onClick={() => navigate(phase.path)}
              className={[
                "w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                active
                  ? "gold-gradient text-accent-foreground font-semibold shadow-[inset_0_0_0_1px_hsl(0_0%_100%/0.12)]"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              ].join(" ")}
              title={collapsed ? (de ? phase.de : phase.en) : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono opacity-70">{String(idx + 1).padStart(2, "0")}</span>
                    <span className="font-medium truncate">{de ? phase.de : phase.en}</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">
                    {pdcaTitle(phase.pdca)}
                  </div>
                </div>
              )}
            </button>
          );
        })}

        {/* Standalone tools — not numbered, visually separated */}
        <div className="mt-4 mx-2 pt-3 pb-2 border border-sidebar-border/70 bg-white/[0.04] rounded-md">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-sidebar-primary font-semibold">
              {de ? "Werkzeuge" : "Tools"}
            </div>
          )}
          {STANDALONE_TOOLS.filter((t) => VISIBLE_TOOL_IDS.has(t.id)).map((tool) => {
            const Icon = tool.icon;
            const active = pathname === tool.path || pathname.startsWith(tool.path + "/");
            return (
              <button
                key={tool.id}
                onClick={() => navigate(tool.path)}
                className={[
                  "w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors rounded-sm",
                  active
                    ? "gold-gradient text-accent-foreground font-semibold"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                ].join(" ")}
                title={collapsed ? (de ? tool.de : tool.en) : undefined}
              >
                <Icon size={18} className={`shrink-0 ${active ? "" : "text-sidebar-primary/80"}`} />
                {!collapsed && (
                  <span className="font-medium truncate">{de ? tool.de : tool.en}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {!collapsed && (
        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className="gradient-frame-on-sidebar rounded-md px-2 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground">
            PDCA Cycle
          </div>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;
