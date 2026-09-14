import { Image, Text, View } from "react-native";
import { money } from "../engine";
import { BuildRequest, LABELS, Product } from "../models";
import { deliveryEngine, deliveryLabel } from "../services/delivery";
import { Garment } from "./Garment";
import { Button, s } from "./ui";
export function ProductCard({
  product: p,
  request,
  onSwap,
  onOpen,
}: {
  product: Product;
  request: BuildRequest;
  onSwap?: () => void;
  onOpen: () => void;
}) {
  return (
    <View style={[s.card, { padding: 0, overflow: "hidden" }]}>
      <View style={{ backgroundColor: "#ECEEE7", padding: 12 }}>
        {p.imageUrl ? (
          <Image
            accessibilityLabel={p.name}
            source={{ uri: p.imageUrl }}
            style={{ height: 210, width: "100%" }}
            resizeMode="contain"
          />
        ) : (
          <Garment category={p.category} colour={p.colours[0]} />
        )}
        <Text style={[s.eyebrow, { position: "absolute", top: 18, left: 18 }]}>
          {LABELS[p.category]}
        </Text>
        <Text style={[s.small, { textAlign: "right" }]}>
          {p.source === "demo" ? "DEMO · SAMPLE ILLUSTRATION" : ""}
        </Text>
      </View>
      <View style={{ padding: 20, gap: 10 }}>
        <View style={s.row}>
          <Text style={s.eyebrow}>{p.brand.toUpperCase()}</Text>
          <Text style={s.h2}>{money(p.price)} item</Text>
        </View>
        <Text style={[s.h2, { fontSize: 18 }]}>{p.name}</Text>
        <Text style={s.small}>
          {p.colours.join(", ")} · {p.category === "shoes" ? "UK " : ""}
          {p.selectedSize ?? request.profile.sizes[p.category]} · {p.retailer}
        </Text>
        <Text style={s.small}>
          {
            deliveryLabel[
              deliveryEngine.evaluate(p, request.deadline, request.location)
            ]
          }{" "}
          ·{" "}
          {p.deliveryCost === null
            ? "Shipping unknown"
            : `Shipping ${money(p.deliveryCost)}`}
        </Text>
        {p.source === "live" && (
          <Text style={s.small}>
            VAT {p.taxIncluded ? "included" : "unverified"} · Mandatory fees{" "}
            {p.mandatoryFees === null || p.mandatoryFees === undefined
              ? "unverified"
              : money(p.mandatoryFees)}
          </Text>
        )}
        <Text style={s.body}>
          {p.styleTags
            .filter((x) => request.profile.styles.includes(x))
            .join(" / ") || "Versatile"}{" "}
          styling for {request.occasion.toLowerCase()};{" "}
          {request.profile.colours.some((c) => p.colours.includes(c))
            ? "matches your preferred palette."
            : "a supporting colour for the outfit."}
        </Text>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Button
              secondary
              title={
                p.source === "demo" ? "Sample details" : "Open retailer ↗"
              }
              onPress={onOpen}
            />
          </View>
          {onSwap && (
            <View style={{ flex: 1 }}>
              <Button
                secondary
                title={`Swap ${LABELS[p.category].toLowerCase()}`}
                onPress={onSwap}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
