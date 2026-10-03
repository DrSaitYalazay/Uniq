import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, LogOut, Crown, Settings, UserCog, Shield, LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import ShieldLogo from "@/components/ShieldLogo";
import CompanyInitialLogo from "@/components/CompanyInitialLogo";

import {
  getCompanyBrand,
  subscribeCompanyBrand,
  hydrateCompanyBrandFromCloud,
  type CompanyBrand,
} from "@/lib/companyBrand";

interface NavItem {
  label: string;
  target: string;
}

interface Props {
  showBadge?: boolean;
  navItems?: NavItem[];
  onNavClick?: (target: string) => void;
}

const AppHeader = ({ showBadge: _showBadge = false, navItems, onNavClick }: Props) => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { user, isPro, isPremium, isAdmin, signOut, getTenantId } = useAuth();
  const [brand, setBrand] = useState<CompanyBrand>(() => getCompanyBrand());

  // Keep the header in sync with the shared brand cache (updated when the
  // user saves the Company Profile in Step 1 or uploads a new logo).
  useEffect(() => subscribeCompanyBrand(setBrand), []);

  // On sign-in, hydrate the brand once from the cloud so the header shows
  // the tenant's company name / logo even before they visit Step 1.
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const tenantId = (await getTenantId()) || user.id;
        if (active) await hydrateCompanyBrandFromCloud(tenantId);
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, [user, getTenantId]);

  return (
    <header className="bg-card text-foreground border-b border-border dark:bg-sidebar dark:text-sidebar-foreground dark:border-transparent dark:shadow-[0_4px_18px_-4px_hsl(220_80%_4%/0.7)] relative z-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Top row: logo + actions */}
        <div className="flex items-center justify-between gap-2 py-4 sm:py-5">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity min-w-0"
          >
            {brand.logoDataUrl ? (
              <span
                className="flex items-center justify-center rounded-lg border border-border flex-shrink-0"
                style={{ background: "#ffffff", width: 48, height: 48, padding: 5 }}
                title={brand.companyName || undefined}
              >
                <img
                  src={brand.logoDataUrl}
                  alt={brand.companyName || "Company logo"}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
                />
              </span>
            ) : brand.companyName ? (
              // Standard: Anfangsbuchstabe des Firmennamens in Akzentfarbe —
              // bis der Nutzer ein eigenes Logo hochlädt.
              <CompanyInitialLogo name={brand.companyName} size={48} className="flex-shrink-0" />
            ) : (
              <ShieldLogo size={48} className="flex-shrink-0" />
            )}
            <div className="text-left min-w-0">
              <span className="block text-lg sm:text-2xl font-bold tracking-tight font-heading truncate">
                {brand.companyName
                  ? <span className="gold-gradient-text">{brand.companyName}</span>
                  : <>Uniq<span className="gold-gradient-text">Suite</span></>}
              </span>
              <span className="block text-xs sm:text-sm opacity-80 font-body truncate">{t("header.subtitle")}</span>
            </div>
          </button>

          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
            <LanguageToggle />
            <ThemeToggle />
            {user ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground h-8 px-3 rounded-lg text-xs font-semibold hover:bg-muted transition-colors whitespace-nowrap"
                  title={lang === "de" ? "Management-Dashboard" : "Management dashboard"}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
                {isPremium && (
                  <span className="hidden sm:inline-flex items-center gap-1 gold-gradient text-accent-foreground h-8 px-3 rounded-lg text-[11px] font-bold whitespace-nowrap">
                    <Crown className="h-3 w-3" /> Enterprise
                  </span>
                )}
                {!isPremium && isPro && (
                  <span className="hidden sm:inline-flex items-center gap-1 eu-gradient text-primary-foreground h-8 px-3 rounded-lg text-[11px] font-bold whitespace-nowrap">
                    <Shield className="h-3 w-3" /> Core
                  </span>
                )}
                <button
                  onClick={() => navigate("/settings")}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground h-8 px-3 rounded-lg text-xs font-semibold hover:bg-muted transition-colors whitespace-nowrap"
                >
                  <UserCog className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{lang === "de" ? "Konto" : "Account"}</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground h-8 px-3 rounded-lg text-xs font-semibold hover:bg-muted transition-colors whitespace-nowrap"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                )}
                <button
                  onClick={async () => { await signOut(); navigate("/"); }}
                  className="flex items-center gap-1.5 gold-gradient text-accent-foreground h-8 px-3 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{lang === "de" ? "Abmelden" : "Sign Out"}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="flex items-center gap-1.5 eu-gradient text-primary-foreground h-8 px-3 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <LogIn className="h-3.5 w-3.5" />
                {t("auth.login")}
              </button>
            )}
          </div>
        </div>

        {/* Bottom row: landing nav items (desktop only) */}
        {navItems && navItems.length > 0 && (
          <div className="hidden md:flex items-center gap-1 pb-2 border-t border-border/50 pt-2">
            {navItems.map((item, i) => (
              <button
                key={item.target}
                onClick={() => onNavClick?.(item.target)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  i === 0
                    ? "border border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
