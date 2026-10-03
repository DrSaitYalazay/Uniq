interface Props {
  size?: number;
  className?: string;
}

/**
 * UniqSuite logo — abgerundetes Quadrat im Markenverlauf (Akzent-2 → Akzent)
 * mit einem „U"-Bogen und einem Indigo-Punkt. Der Komponentenname bleibt
 * ShieldLogo, damit alle bestehenden Importe unverändert funktionieren.
 */
const ShieldLogo = ({ size = 40, className = "" }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="UniqSuite"
  >
    <rect x="3" y="3" width="34" height="34" rx="10" fill="url(#uq-logo-gradient)" />
    {/* U-Bogen: weiß, fest — unabhängig vom Dunkelmodus lesbar */}
    <path d="M13 11.5V21a7 7 0 0 0 14 0v-4" stroke="#ffffff" strokeWidth="4.4" strokeLinecap="round" />
    {/* Indigo-Punkt (Grundton der Marke) */}
    <circle cx="27" cy="10.6" r="3.1" fill="hsl(var(--shield-navy))" stroke="#ffffff" strokeWidth="1.4" />
    <defs>
      {/* Folgt dem Laufzeit-Akzent (--accent-h / --accent-2-h), wie bisher. */}
      <linearGradient id="uq-logo-gradient" x1="3" y1="3" x2="37" y2="37" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--accent-2-h) var(--accent-2-s) 58%)" />
        <stop offset="1" stopColor="hsl(var(--accent-h) var(--accent-s) 46%)" />
      </linearGradient>
    </defs>
  </svg>
);

export default ShieldLogo;
