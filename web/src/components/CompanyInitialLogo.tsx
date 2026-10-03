import { companyInitial } from "@/lib/companyBrand";

interface Props {
  name: string;
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Standard-Firmenlogo: Anfangsbuchstabe des Firmennamens auf weißer Kachel,
 * Buchstabe im Marken-/Akzent-Verlauf (folgt der gewählten Akzentfarbe live).
 * Wird ersetzt, sobald der Nutzer ein eigenes Logo hochlädt.
 */
const CompanyInitialLogo = ({ name, size = 48, className = "", title }: Props) => {
  const ch = companyInitial(name) || "•";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg border border-border shrink-0 select-none ${className}`}
      style={{ width: size, height: size, background: "#ffffff" }}
      title={title ?? name}
      aria-label={name}
      role="img"
    >
      <span
        className="gold-gradient-text font-heading font-extrabold leading-none"
        style={{ fontSize: Math.round(size * 0.6), transform: "translateY(1px)" }}
      >
        {ch}
      </span>
    </span>
  );
};

export default CompanyInitialLogo;
