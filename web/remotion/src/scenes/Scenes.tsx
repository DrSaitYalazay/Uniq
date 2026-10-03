import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { C } from "../theme";
import { fontDisplay, fontBody } from "../fonts";
import { Shield } from "../components/Shield";

// Helper: scene-level fade in/out
export const sceneOpacity = (frame: number, dur: number, fps: number) => {
  const inO = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 14 });
  const outO = interpolate(frame, [dur - 12, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return Math.min(inO, outO);
};

// SCENE 1 — Hook: kinetic typography
export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOpacity(frame, 90, fps);
  const words = ["NIS2", "trifft.", "Hart."];
  return (
    <AbsoluteFill style={{ opacity: op, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 0, color: C.white }}>
      <div style={{ fontFamily: fontBody, color: C.copper, letterSpacing: "0.32em", textTransform: "uppercase", fontWeight: 700, fontSize: 22, marginBottom: 36 }}>
        Die neue Realität
      </div>
      <div style={{ display: "flex", gap: 38, alignItems: "baseline" }}>
        {words.map((w, i) => {
          const s = spring({ frame: frame - 6 - i * 10, fps, config: { damping: 14, stiffness: 140 } });
          const y = interpolate(s, [0, 1], [80, 0]);
          const blur = interpolate(s, [0, 1], [16, 0]);
          return (
            <span
              key={w}
              style={{
                fontFamily: fontDisplay,
                fontWeight: 900,
                fontSize: 200,
                lineHeight: 1,
                color: i === 2 ? C.copper : C.white,
                transform: `translateY(${y}px)`,
                filter: `blur(${blur}px)`,
                opacity: s,
                letterSpacing: "-0.03em",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      <div style={{
        fontFamily: fontBody, fontSize: 24, color: C.ice, marginTop: 44,
        opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        letterSpacing: "0.05em",
      }}>
        BSIG · Persönliche Haftung · 24/72h-Meldepflicht
      </div>
    </AbsoluteFill>
  );
};

// SCENE 2 — Problem: chaos
export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOpacity(frame, 90, fps);
  const items = ["60–120 Beratertage", "Hunderte Kontrollen", "Endlose Excel-Listen", "Dokumenten-Chaos"];
  return (
    <AbsoluteFill style={{ opacity: op, padding: "100px 140px", color: C.white, flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontFamily: fontBody, color: C.copper, letterSpacing: "0.32em", textTransform: "uppercase", fontWeight: 700, fontSize: 18, marginBottom: 24 }}>
        Die versteckte Last
      </div>
      <div style={{ fontFamily: fontDisplay, fontWeight: 900, fontSize: 92, lineHeight: 1.05, letterSpacing: "-0.02em", maxWidth: 1300 }}>
        Compliance frisst <span style={{ color: C.copper }}>Monate.</span>
      </div>
      <div style={{ marginTop: 64, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "26px 60px", maxWidth: 1300 }}>
        {items.map((t, i) => {
          const s = spring({ frame: frame - 18 - i * 8, fps, config: { damping: 18, stiffness: 160 } });
          const x = interpolate(s, [0, 1], [-40, 0]);
          return (
            <div key={t} style={{ opacity: s, transform: `translateX(${x}px)`, display: "flex", alignItems: "center", gap: 22 }}>
              <div style={{ width: 14, height: 14, background: C.copper, borderRadius: 2, transform: "rotate(45deg)" }} />
              <span style={{ fontFamily: fontDisplay, fontSize: 38, fontWeight: 600, color: C.ice }}>{t}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// SCENE 3 — Solution Reveal
export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOpacity(frame, 90, fps);
  const shieldS = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const titleS = spring({ frame: frame - 12, fps, config: { damping: 18 } });
  const subS = spring({ frame: frame - 22, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ opacity: op, alignItems: "center", justifyContent: "center", flexDirection: "column", color: C.white }}>
      <div style={{ transform: `scale(${shieldS})`, opacity: shieldS, marginBottom: 30 }}>
        <Shield size={180} />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 0, opacity: titleS, transform: `translateY(${interpolate(titleS, [0, 1], [30, 0])}px)` }}>
        <span style={{ fontFamily: fontDisplay, fontWeight: 900, fontSize: 160, color: C.white, letterSpacing: "-0.03em" }}>NIS2</span>
        <span style={{ fontFamily: fontDisplay, fontWeight: 900, fontSize: 160, color: C.copper, letterSpacing: "-0.03em" }}>Suite</span>
      </div>
      <div style={{ fontFamily: fontBody, fontSize: 28, color: C.ice, marginTop: 18, opacity: subS, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
        18-Schritt-PDCA-Plattform
      </div>
      {/* underline */}
      <div style={{
        marginTop: 30,
        height: 3,
        width: interpolate(subS, [0, 1], [0, 360]),
        background: C.copper,
      }} />
    </AbsoluteFill>
  );
};

// SCENE 4 — Features dashboard
export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOpacity(frame, 90, fps);

  const cards = [
    { kpi: "206", label: "Kontrollen · NIS2-Mapping", tint: C.copper },
    { kpi: "51", label: "Richtlinien-Templates", tint: C.copper },
    { kpi: "18", label: "PDCA-Schritte", tint: C.copper },
    { kpi: "DE/EN", label: "Durchgängig zweisprachig", tint: C.copper },
    { kpi: "Auto", label: "Gap → Risiko → Maßnahme", tint: C.copper },
    { kpi: "PDF·Word", label: "Audit-Exporte", tint: C.copper },
  ];

  return (
    <AbsoluteFill style={{ opacity: op, padding: "70px 100px", color: C.white, flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontFamily: fontBody, color: C.copper, letterSpacing: "0.32em", textTransform: "uppercase", fontWeight: 700, fontSize: 18, marginBottom: 18 }}>
        Drei Motoren · Ein System
      </div>
      <div style={{ fontFamily: fontDisplay, fontWeight: 900, fontSize: 72, lineHeight: 1.05, marginBottom: 44, letterSpacing: "-0.02em" }}>
        Volle Abdeckung. <span style={{ color: C.copper }}>Belastbare Reports.</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        {cards.map((c, i) => {
          const s = spring({ frame: frame - 14 - i * 6, fps, config: { damping: 16, stiffness: 140 } });
          const y = interpolate(s, [0, 1], [50, 0]);
          return (
            <div
              key={c.label}
              style={{
                opacity: s,
                transform: `translateY(${y}px)`,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(230,138,23,0.25)",
                borderTop: `3px solid ${c.tint}`,
                borderRadius: 10,
                padding: "28px 30px",
              }}
            >
              <div style={{ fontFamily: fontDisplay, fontWeight: 900, fontSize: 56, color: c.tint, lineHeight: 1 }}>{c.kpi}</div>
              <div style={{ fontFamily: fontBody, fontSize: 20, color: C.ice, marginTop: 10, fontWeight: 500 }}>{c.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// SCENE 5 — Closing
export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOpacity(frame, 90, fps);
  const headS = spring({ frame, fps, config: { damping: 16, stiffness: 140 } });
  const subS = spring({ frame: frame - 14, fps, config: { damping: 200 } });
  const tagS = spring({ frame: frame - 26, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ opacity: op, alignItems: "center", justifyContent: "center", flexDirection: "column", color: C.white }}>
      <div style={{
        fontFamily: fontDisplay,
        fontWeight: 900,
        fontSize: 130,
        letterSpacing: "-0.03em",
        textAlign: "center",
        opacity: headS,
        transform: `translateY(${interpolate(headS, [0, 1], [40, 0])}px)`,
        lineHeight: 1,
      }}>
        3–4 Wochen <span style={{ color: C.copper }}>statt</span><br />60–120 Beratertage.
      </div>
      <div style={{
        marginTop: 50, display: "flex", alignItems: "center", gap: 18, opacity: subS,
      }}>
        <Shield size={64} />
        <span style={{ fontFamily: fontDisplay, fontWeight: 900, fontSize: 64, letterSpacing: "-0.02em" }}>
          NIS2<span style={{ color: C.copper }}>Suite</span>
        </span>
      </div>
      <div style={{
        marginTop: 18,
        fontFamily: fontBody,
        fontSize: 22,
        color: C.ice,
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        fontWeight: 600,
        opacity: tagS,
      }}>
        Compliance ohne Beraterhonorar
      </div>
      <div style={{
        marginTop: 14,
        fontFamily: fontBody,
        fontSize: 18,
        color: C.copper,
        letterSpacing: "0.18em",
        fontWeight: 600,
        opacity: tagS,
      }}>
        uniqsuite.com
      </div>
    </AbsoluteFill>
  );
};
