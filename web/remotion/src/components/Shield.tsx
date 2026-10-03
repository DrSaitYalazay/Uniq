import { C } from "../theme";

export const Shield: React.FC<{ size?: number }> = ({ size = 120 }) => (
  <svg width={size} height={size * (66 / 62)} viewBox="0 0 62 66" fill="none">
    <path
      d="M31 2 L58 12 V32 C58 50 31 64 31 64 C31 64 4 50 4 32 V12 Z"
      fill="rgba(230,138,23,0.10)"
      stroke={C.copper}
      strokeWidth="2.4"
    />
    <path
      d="M31 10 L50 17 V32 C50 46 31 56 31 56 C31 56 12 46 12 32 V17 Z"
      fill="none"
      stroke={C.copper}
      strokeWidth="1.4"
      opacity="0.6"
    />
    <text
      x="31"
      y="38"
      textAnchor="middle"
      fill={C.copper}
      fontSize="14"
      fontWeight="800"
      fontFamily="Archivo, sans-serif"
      letterSpacing="0.5"
    >
      N2S
    </text>
  </svg>
);
