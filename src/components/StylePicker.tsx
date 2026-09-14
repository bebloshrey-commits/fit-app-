import { Image, Pressable, Text, View } from "react-native";
import { s } from "./ui";
const choices = [
  ["Y2K", "Denim. Layers. A little nostalgia."],
  ["Streetwear", "Relaxed shapes. Everyday edge."],
  ["Formal", "Sharp tailoring. Clean lines."],
  ["Smart casual", "Polished, with room to relax."],
];
export function StylePicker({
  values,
  onChange,
}: {
  values: string[];
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      <Text style={s.h2}>Find your kind of style.</Text>
      <Text style={s.body}>
        Choose one or mix a few. You can change these any time.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {choices.map(([name, description], index) => (
          <Pressable
            key={name}
            accessibilityRole="checkbox"
            accessibilityLabel={name}
            accessibilityState={{ checked: values.includes(name!) }}
            onPress={() => onChange(name!)}
            style={{
              width: "47%",
              borderRadius: 20,
              overflow: "hidden",
              borderWidth: 2,
              borderColor: values.includes(name!) ? "#111" : "#E5E5E7",
              backgroundColor: "#FFF",
            }}
          >
            <View style={{ aspectRatio: 0.375, overflow: "hidden" }}>
              <Image
                source={require("../../assets/style-editorial.png")}
                style={{
                  position: "absolute",
                  width: "400%",
                  height: "100%",
                  left: `${-index * 100}%`,
                }}
                resizeMode="stretch"
              />
              <View
                style={{
                  position: "absolute",
                  right: 10,
                  top: 10,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: values.includes(name!) ? "#111" : "#FFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFF" }}>
                  {values.includes(name!) ? "✓" : ""}
                </Text>
              </View>
            </View>
            <View style={{ padding: 12, gap: 5 }}>
              <Text style={s.label}>{name}</Text>
              <Text style={s.small}>{description}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <Text style={s.small}>
        AI-generated style inspiration. These are not shop products.
      </Text>
    </View>
  );
}
