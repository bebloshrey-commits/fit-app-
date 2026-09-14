import { useId } from "react";
import { View } from "react-native";
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { Category } from "../models";
const colours: Record<string, string> = {
  Black: "#34383A",
  White: "#E9E7DE",
  Navy: "#344455",
  Beige: "#C9B89D",
  Olive: "#70765B",
  Grey: "#9B9B94",
  Blue: "#687F9C",
  Brown: "#7D614B",
  Pink: "#CEA4A9",
  Red: "#A2574D",
};
const shapes: Record<Category, string> = {
  top: "M73 38 L99 28 Q120 46 141 28 L167 38 L194 77 L167 95 L151 73 L154 193 Q120 199 86 193 L89 73 L73 95 L46 77 Z",
  bottom:
    "M78 28 L161 28 L166 79 L155 205 L121 205 L117 99 L107 205 L73 205 L72 79 Z",
  shoes:
    "M40 115 Q70 103 77 64 L108 76 L115 113 L157 128 Q194 133 197 155 L193 177 L41 177 Q22 152 40 115 Z",
  jacket:
    "M86 29 L105 23 L120 44 L136 23 L155 29 L174 45 L194 166 L169 174 L151 91 L153 203 L87 203 L89 91 L71 174 L46 166 L66 45 Z",
  accessory:
    "M66 79 L174 79 L182 193 Q120 207 58 193 Z M91 80 L91 57 Q91 26 120 26 Q149 26 149 57 L149 80 L138 80 L138 56 Q138 38 120 38 Q102 38 102 56 L102 80 Z",
};
export function Garment({
  category,
  colour = "Black",
  size = 200,
}: {
  category: Category;
  colour?: string;
  size?: number;
}) {
  const fill = colours[colour] ?? colours.Black;
  const gradientId = useId().replace(/:/g, "");
  return (
    <View
      accessible
      accessibilityLabel={`${colour} ${category} sample illustration`}
      style={{ alignItems: "center", justifyContent: "center" }}
    >
      <Svg width={size} height={size} viewBox="0 0 240 240">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={fill} />
            <Stop offset="1" stopColor={fill} stopOpacity=".78" />
          </LinearGradient>
        </Defs>
        <Ellipse
          cx="120"
          cy="216"
          rx="65"
          ry="9"
          fill="#20342B"
          opacity=".08"
        />
        <Path
          d={shapes[category]}
          fill={`url(#${gradientId})`}
          stroke="#25352E"
          strokeOpacity=".15"
          strokeWidth="2"
        />
        {category === "top" && (
          <Path
            d="M99 28 Q120 65 141 28 M91 181 L150 181"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity=".22"
            strokeWidth="2"
          />
        )}
        {category === "bottom" && (
          <Path
            d="M118 29 L118 86 M79 46 Q98 67 78 78 M160 46 Q142 67 162 78"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity=".22"
            strokeWidth="2"
          />
        )}
        {category === "jacket" && (
          <Path
            d="M120 44 L120 202 M105 23 L91 66 L113 80 M136 23 L149 66 L125 80 M92 135 L111 135 M132 135 L150 135"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity=".3"
            strokeWidth="2"
          />
        )}
        {category === "shoes" && (
          <Path
            d="M39 164 L195 164 M87 101 L112 96 M82 112 L119 108 M78 123 L131 120"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity=".5"
            strokeWidth="4"
          />
        )}
      </Svg>
    </View>
  );
}
