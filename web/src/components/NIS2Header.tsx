import { Shield } from "lucide-react";

const NIS2Header = () => {
  return (
    <header className="eu-gradient text-primary-foreground py-6 px-6 hero-shadow">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="gold-gradient p-2.5 rounded-xl">
            <Shield className="h-7 w-7 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              Uniq<span className="gold-gradient-text">Suite</span>
            </h1>
            <p className="text-sm opacity-80 font-body">
              NIS2-Umsetzung & Prüfung für Kommunen
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm opacity-70">
          <span className="gold-gradient text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold">
            EU NIS2 Directive 2022/2555
          </span>
        </div>
      </div>
    </header>
  );
};

export default NIS2Header;
