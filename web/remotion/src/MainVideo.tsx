import { AbsoluteFill, Series } from "remotion";
import { BgGradient } from "./components/BgGradient";
import { Scene1, Scene2, Scene3, Scene4, Scene5 } from "./scenes/Scenes";
import { fontBody } from "./fonts";

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#08152c", fontFamily: fontBody }}>
      <BgGradient />
      <Series>
        <Series.Sequence durationInFrames={90}><Scene1 /></Series.Sequence>
        <Series.Sequence durationInFrames={90}><Scene2 /></Series.Sequence>
        <Series.Sequence durationInFrames={90}><Scene3 /></Series.Sequence>
        <Series.Sequence durationInFrames={90}><Scene4 /></Series.Sequence>
        <Series.Sequence durationInFrames={90}><Scene5 /></Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
