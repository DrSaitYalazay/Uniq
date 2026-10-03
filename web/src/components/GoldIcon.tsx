import { type LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  className?: string;
  size?: number;
}

/**
 * Wraps a Lucide icon and paints its stroke with the brand gold-gradient
 * (matches CSS --gold-gradient: linear-gradient(135deg, hsl(40 90% 55%), hsl(25 80% 50%))).
 * Use for brand bullets, brand checkmarks, etc. — NOT for severity icons.
 */
const GoldIcon = ({ icon: Icon, className = "", size = 16 }: Props) => (
  <span className={`inline-block leading-none ${className}`} style={{ width: size, height: size }}>
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <linearGradient id="lov-gold-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          {/* NIS2Suite-Verlauf: helles Gold (accent-2) → Bakır (accent). */}
          <stop offset="0%" stopColor="hsl(var(--accent-2-h) var(--accent-2-s) 55%)" />
          <stop offset="100%" stopColor="hsl(var(--accent-h) var(--accent-s) 50%)" />
        </linearGradient>
      </defs>
    </svg>
    <Icon
      width={size}
      height={size}
      style={{ stroke: "url(#lov-gold-stroke)" }}
      strokeWidth={2}
    />
  </span>
);

export default GoldIcon;
