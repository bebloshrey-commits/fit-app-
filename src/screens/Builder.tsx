import * as Location from "expo-location";
import { useState } from "react";
import { Switch, Text, View } from "react-native";
import { Button, Chips, Field, Note, Page, s, Title } from "../components/ui";
import { validateBudget } from "../engine";
import {
  BuildRequest,
  CATEGORIES,
  Category,
  LABELS,
  OCCASIONS,
  OwnedItem,
  Profile,
} from "../models";
import { safeLocation } from "../services/location";
import { ProfileFields } from "./ProfileFields";
export function dateAfter(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function Builder({
  profile,
  wardrobe,
  onBuild,
  busy,
}: {
  profile: Profile;
  wardrobe: OwnedItem[];
  onBuild: (r: BuildRequest) => void;
  busy: boolean;
}) {
  const [step, setStep] = useState(0),
    [p, setP] = useState(profile),
    [occasion, setOccasion] = useState("Party"),
    [deadline, setDeadline] = useState<string | null>(dateAfter(1)),
    [budget, setBudget] = useState("50"),
    [categories, setCategories] = useState<Category[]>([
      "top",
      "bottom",
      "shoes",
    ]),
    [owned, setOwned] = useState<OwnedItem[]>([]),
    [strict, setStrict] = useState(false),
    [note, setNote] = useState("");
  const titles = [
    "What’s the occasion?",
    "When do you need it?",
    "Where are you headed?",
    "A budget that works.",
    "Make it your style.",
    "Find your palette.",
    "The right fit.",
  ];
  const bodies = [
    "A good outfit starts with a plan.",
    "We only promise delivery when a source verifies it.",
    "Location helps check delivery and local conditions.",
    "Your maximum includes all known shipping costs.",
    "Choose the styles you want to bring together.",
    "Pick favourites, and leave out colours you dislike.",
    "Choose each size. No guesswork, no body ratings.",
  ];
  const locate = async () => {
    const result = await safeLocation(Location);
    if (result.location) setP({ ...p, location: result.location });
    if (result.message) setNote(result.message);
  };
  const next = () => {
    setNote("");
    if (step === 0 && !occasion.trim()) {
      setNote("Enter an occasion to continue.");
      return;
    }
    if (
      step === 1 &&
      deadline &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) ||
        !Number.isFinite(Date.parse(deadline)) ||
        new Date(deadline).toISOString().slice(0, 10) !== deadline ||
        deadline < dateAfter(0))
    ) {
      setNote("Enter a valid date today or later, using YYYY-MM-DD.");
      return;
    }
    if (step === 2 && !p.location.trim()) {
      setNote("Enter a city or postcode.");
      return;
    }
    if (step === 3 && (!validateBudget(budget) || !categories.length)) {
      setNote("Enter a valid budget and select at least one category.");
      return;
    }
    if (step < 6) setStep(step + 1);
    else
      onBuild({
        profile: p,
        occasion: occasion.trim(),
        budget: validateBudget(budget)!,
        deadline,
        location: p.location,
        categories,
        owned: owned.filter((o) => categories.includes(o.category)),
        requireVerifiedDelivery: strict,
        weather: null,
      });
  };
  return (
    <Page>
      <View style={s.row}>
        <Text style={s.eyebrow}>THE OUTFIT BUILDER</Text>
        <Text style={s.small}>{step + 1} / 7</Text>
      </View>
      <View style={{ height: 4, backgroundColor: "#E5E5E7", borderRadius: 8 }}>
        <View
          style={{
            width: `${((step + 1) / 7) * 100}%`,
            height: 4,
            backgroundColor: "#555555",
            borderRadius: 8,
          }}
        />
      </View>
      <Title title={titles[step]!} body={bodies[step]} />
      {step === 0 && (
        <>
          <Chips
            options={OCCASIONS}
            values={[occasion]}
            onChange={setOccasion}
          />
          <Field
            label="Or tell us your occasion"
            value={occasion}
            onChange={setOccasion}
          />
        </>
      )}
      {step === 1 && (
        <>
          <Chips
            options={[
              "Today",
              "Tomorrow",
              "This weekend",
              "Next week",
              "No deadline",
            ]}
            values={[
              deadline === null
                ? "No deadline"
                : deadline === dateAfter(0)
                  ? "Today"
                  : deadline === dateAfter(1)
                    ? "Tomorrow"
                    : "",
            ]}
            onChange={(v) =>
              setDeadline(
                v === "No deadline"
                  ? null
                  : dateAfter(
                      v === "Today"
                        ? 0
                        : v === "Tomorrow"
                          ? 1
                          : v === "Next week"
                            ? 7
                            : (6 - new Date().getDay() + 7) % 7,
                    ),
              )
            }
          />
          <Field
            label="Custom date (YYYY-MM-DD)"
            value={deadline ?? ""}
            onChange={(v) => setDeadline(v || null)}
            placeholder="2026-09-20"
          />
          <View style={s.row}>
            <Text style={[s.body, { flex: 1 }]}>
              Only include verified delivery
            </Text>
            <Switch
              accessibilityLabel="Only include verified delivery"
              value={strict}
              onValueChange={setStrict}
            />
          </View>
          <Note text="Demo inventory has no verified delivery. Enabling this option will correctly return no matching outfit." />
        </>
      )}
      {step === 2 && (
        <>
          <Field
            label="City or postcode"
            value={p.location}
            onChange={(location) => setP({ ...p, location })}
          />
          <Button title="Use my location" secondary onPress={locate} />
          <Text style={s.small}>
            Manual location works without permission. Weather is optional and
            will never block your outfit.
          </Text>
        </>
      )}
      {step === 3 && (
        <>
          <Field
            label="Maximum budget (£)"
            number
            value={budget}
            onChange={setBudget}
          />
          <Chips
            options={["30", "50", "75", "100", "150"]}
            values={[budget]}
            onChange={setBudget}
          />
          <Text style={s.label}>What should your outfit include?</Text>
          <Chips
            options={CATEGORIES.map((c) => LABELS[c])}
            values={categories.map((c) => LABELS[c])}
            onChange={(label) => {
              const c = CATEGORIES.find((c) => LABELS[c] === label)!;
              setCategories(
                categories.includes(c)
                  ? categories.filter((x) => x !== c)
                  : [...categories, c],
              );
            }}
          />
          <Text style={s.label}>Use what I own</Text>
          {wardrobe.length ? (
            <Chips
              options={wardrobe.map((o) => `${o.name} · ${LABELS[o.category]}`)}
              values={owned.map((o) => `${o.name} · ${LABELS[o.category]}`)}
              onChange={(name) => {
                const item = wardrobe.find(
                  (o) => `${o.name} · ${LABELS[o.category]}` === name,
                )!;
                setOwned(
                  owned.some((o) => o.id === item.id)
                    ? owned.filter((o) => o.id !== item.id)
                    : [
                        ...owned.filter((o) => o.category !== item.category),
                        item,
                      ],
                );
              }}
            />
          ) : (
            <Text style={s.body}>
              Add clothes in Home → Use what I own. Owned items cost £0.
            </Text>
          )}
        </>
      )}
      {step === 4 && (
        <ProfileFields profile={p} onChange={setP} section="style" />
      )}
      {step === 5 && (
        <ProfileFields profile={p} onChange={setP} section="colours" />
      )}
      {step === 6 && (
        <>
          <ProfileFields profile={p} onChange={setP} section="sizes" />
          <Note
            text={`${occasion} · £${budget} · ${p.location} · ${deadline ?? "No deadline"}. Demo prices and sizes; shipping and delivery unverified.`}
          />
        </>
      )}
      {!!note && <Note text={note} error />}
      <Button
        title={
          busy
            ? "Checking your outfit…"
            : step === 6
              ? "Build my outfit →"
              : "Continue →"
        }
        onPress={next}
        disabled={busy}
      />
      {step > 0 && (
        <Button
          title="Back"
          secondary
          onPress={() => setStep(step - 1)}
          disabled={busy}
        />
      )}
    </Page>
  );
}
