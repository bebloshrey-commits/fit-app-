import { StylePicker } from "../components/StylePicker";
import { Text, View } from "react-native";
import { Chips, Field, s, toggle } from "../components/ui";
import { Category, COLOURS, LABELS, Profile, SIZES, STYLES } from "../models";
export function ProfileFields({
  profile: p,
  onChange,
  section = "all",
}: {
  profile: Profile;
  onChange: (p: Profile) => void;
  section?: "all" | "intro" | "sizes" | "style" | "colours" | "fit";
}) {
  return (
    <View style={{ gap: 22 }}>
      {(section === "all" || section === "fit") && (
        <>
          <Text style={s.body}>
            Optional fit details. Stored on this device, never used to rate your
            body or guess a retailer size.
          </Text>
          <Field
            label="Height (cm, optional)"
            number
            value={p.heightCm ?? ""}
            onChange={(v) =>
              onChange({
                ...p,
                heightCm: v.replace(/[^0-9.]/g, "").slice(0, 6),
              })
            }
          />
          <Field
            label="Weight (kg, optional)"
            number
            value={p.weightKg ?? ""}
            onChange={(v) =>
              onChange({
                ...p,
                weightKg: v.replace(/[^0-9.]/g, "").slice(0, 6),
              })
            }
          />
          <Text style={s.label}>Body shape · optional, self-described</Text>
          <Chips
            options={[
              "Straight",
              "Broader shoulders",
              "Broader hips",
              "Balanced curves",
              "Prefer not to say",
            ]}
            values={[p.bodyShape ?? "Prefer not to say"]}
            onChange={(bodyShape) => onChange({ ...p, bodyShape })}
          />
          <Text style={s.label}>How do you like clothes to fit?</Text>
          <Chips
            options={["Fitted", "Regular", "Relaxed", "Oversized"]}
            values={[p.fitPreference ?? "Regular"]}
            onChange={(fitPreference) => onChange({ ...p, fitPreference })}
          />
        </>
      )}
      {(section === "all" || section === "intro") && (
        <>
          <Field
            label="First name or nickname (optional)"
            value={p.name}
            onChange={(name) => onChange({ ...p, name })}
          />
          <Field
            label="Location"
            value={p.location}
            onChange={(location) => onChange({ ...p, location })}
            placeholder="City or postcode"
          />
        </>
      )}
      {(section === "all" || section === "sizes") &&
        (["top", "bottom", "shoes", "jacket"] as Category[]).map((c) => (
          <View key={c} style={{ gap: 10 }}>
            <Text style={s.label}>
              {LABELS[c]}{" "}
              {c === "shoes"
                ? "(UK size)"
                : c === "bottom"
                  ? "(waist inches)"
                  : ""}
            </Text>
            <Chips
              options={SIZES[c]}
              values={[p.sizes[c]]}
              onChange={(v) =>
                onChange({ ...p, sizes: { ...p.sizes, [c]: v } })
              }
            />
          </View>
        ))}
      {(section === "all" || section === "style") && (
        <>
          <StylePicker
            values={p.styles}
            onChange={(v) => onChange({ ...p, styles: toggle(p.styles, v) })}
          />
          <Chips
            options={STYLES}
            values={p.styles}
            onChange={(v) => onChange({ ...p, styles: toggle(p.styles, v) })}
          />
        </>
      )}
      {(section === "all" || section === "colours") && (
        <>
          <Text style={s.label}>Preferred colours</Text>
          <Chips
            options={COLOURS}
            values={p.colours}
            onChange={(v) =>
              onChange({
                ...p,
                colours: toggle(p.colours, v),
                avoidColours: p.avoidColours.filter((c) => c !== v),
              })
            }
          />
          <Text style={s.label}>Colours to avoid</Text>
          <Chips
            options={COLOURS}
            values={p.avoidColours}
            onChange={(v) =>
              onChange({
                ...p,
                avoidColours: toggle(p.avoidColours, v),
                colours: p.colours.filter((c) => c !== v),
              })
            }
          />
        </>
      )}
      {section === "all" && (
        <>
          <Field
            label="Preferred brands (comma separated)"
            value={p.brands}
            onChange={(brands) => onChange({ ...p, brands })}
          />
          <Field
            label="Brands to avoid (comma separated)"
            value={p.avoidBrands}
            onChange={(avoidBrands) => onChange({ ...p, avoidBrands })}
          />
        </>
      )}
    </View>
  );
}
