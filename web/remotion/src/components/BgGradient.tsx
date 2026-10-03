import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { C } from "../theme";

export const BgGradient: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = interpolate(frame, [0, 450], [0, 20]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 80% at ${75 + shift}% -10%, rgba(230,138,23,0.22), transparent 55%), linear-gradient(160deg, ${C.navy} 0%, #0a1a36 60%, ${C.navyDeep} 100%)`,
      }}
    >
      {/* grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(120% 80% at 80% 0%, #000, transparent 70%)",
          WebkitMaskImage: "radial-gradient(120% 80% at 80% 0%, #000, transparent 70%)",
        }}
      />
      {/* copper corner frames */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          top: -160,
          right: -120,
          border: `2px solid ${C.line}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          top: -60,
          right: 20,
          border: `2px solid rgba(230,138,23,0.18)`,
        }}
      />
    </AbsoluteFill>
  );
};
