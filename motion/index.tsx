import React from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  interpolate,
  registerRoot,
  staticFile,
  useCurrentFrame,
} from "remotion";
const Intro = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: "#F7F7F8",
        overflow: "hidden",
        fontFamily: "Arial",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 24,
          borderRadius: 36,
          overflow: "hidden",
          scale: interpolate(f, [0, 90, 179], [1.08, 1, 1.03], {
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <Img
          src={staticFile("style-editorial.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 42,
          left: 42,
          right: 42,
          padding: 24,
          borderRadius: 24,
          background: "rgba(255,255,255,.92)",
          opacity: interpolate(f, [8, 30], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: `0 ${interpolate(f, [8, 36], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) })}px`,
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -2 }}>
          Your style. Found.
        </div>
        <div style={{ fontSize: 20, marginTop: 8, color: "#555" }}>
          One plan. A whole outfit.
        </div>
      </div>
    </AbsoluteFill>
  );
};
registerRoot(() => (
  <Composition
    id="FitFindIntro"
    component={Intro}
    width={720}
    height={600}
    fps={30}
    durationInFrames={180}
  />
));
