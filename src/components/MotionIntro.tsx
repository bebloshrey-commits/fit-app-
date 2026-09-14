import { Image, View } from "react-native";
export function MotionIntro() {
  return (
    <View
      style={{
        aspectRatio: 1.2,
        borderRadius: 28,
        overflow: "hidden",
        backgroundColor: "#EFEFEF",
      }}
    >
      <Image
        source={require("../../assets/style-editorial.png")}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
    </View>
  );
}
