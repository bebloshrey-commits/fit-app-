import { useEffect, useState } from "react";
import { AccessibilityInfo, Image, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
export function MotionIntro() {
  const [reduced, setReduced] = useState(true);
  const player = useVideoPlayer(
    require("../../assets/fitfind-intro.mp4"),
    (p) => {
      p.muted = true;
      p.loop = true;
    },
  );
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (reduced) player.pause();
    else player.play();
  }, [reduced, player]);
  return (
    <View
      style={{
        aspectRatio: 1.2,
        borderRadius: 28,
        overflow: "hidden",
        backgroundColor: "#EFEFEF",
      }}
    >
      {reduced ? (
        <Image
          source={require("../../assets/style-editorial.png")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : (
        <VideoView
          player={player}
          style={{ width: "100%", height: "100%" }}
          nativeControls={false}
          contentFit="cover"
        />
      )}
    </View>
  );
}
