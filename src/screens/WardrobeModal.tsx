import { useState } from "react";
import { Modal, Text, View } from "react-native";
import { Button, Chips, Field, Note, Page, s, Title } from "../components/ui";
import { CATEGORIES, Category, COLOURS, LABELS, Outfit } from "../models";
import { AppData } from "../storage";
type Tab = "Home" | "Build" | "Saved" | "Profile";
export function WardrobeModal({
  data,
  setWardrobeOpen,
  setResult,
  setTab,
  safe,
  persist,
  wardrobeOpen,
  error,
}: {
  data: AppData;
  setWardrobeOpen: (v: boolean) => void;
  setResult: (o: Outfit | null) => void;
  setTab: (t: Tab) => void;
  safe: (fn: () => Promise<void>) => Promise<void>;
  persist: (d: AppData) => Promise<void>;
  wardrobeOpen: boolean;
  error: string;
}) {
  const [ownedName, setOwnedName] = useState(""),
    [ownedCat, setOwnedCat] = useState<Category>("top"),
    [ownedColour, setOwnedColour] = useState("Black");
  const duplicate = data.wardrobe.some(
    (item) =>
      item.category === ownedCat &&
      item.name.toLowerCase() === ownedName.trim().toLowerCase(),
  );
  return (
    <Modal
      visible={wardrobeOpen}
      animationType="slide"
      onRequestClose={() => setWardrobeOpen(false)}
    >
      <Page inset>
        {!!error && <Note error text={error} />}
        <Button
          secondary
          title="← Back home"
          onPress={() => setWardrobeOpen(false)}
        />
        <Title
          title="Already yours."
          body="Add an item manually. Select it in the builder to create the rest of your outfit around it."
        />
        <Field
          label="Item name"
          value={ownedName}
          onChange={setOwnedName}
          placeholder="My black straight-leg jeans"
        />
        <Chips
          options={CATEGORIES.map((c) => LABELS[c])}
          values={[LABELS[ownedCat]]}
          onChange={(v) =>
            setOwnedCat(CATEGORIES.find((c) => LABELS[c] === v)!)
          }
        />
        <Chips
          options={COLOURS}
          values={[ownedColour]}
          onChange={setOwnedColour}
        />
        {duplicate && (
          <Note text="This item is already in your wardrobe. Give it a different name if it is a different piece." />
        )}
        <Button
          title="Add to wardrobe"
          disabled={!ownedName.trim() || duplicate}
          onPress={() =>
            safe(async () => {
              await persist({
                ...data,
                wardrobe: [
                  ...data.wardrobe,
                  {
                    id: String(Date.now()),
                    name: ownedName.trim(),
                    category: ownedCat,
                    colour: ownedColour,
                  },
                ],
              });
              setOwnedName("");
            })
          }
        />
        {data.wardrobe.map((o) => (
          <View key={o.id} style={s.card}>
            <Text style={s.h2}>{o.name}</Text>
            <Text style={s.small}>
              {LABELS[o.category]} · {o.colour} · Already owned
            </Text>
            <Button
              secondary
              title={`Remove ${o.name}`}
              onPress={() =>
                safe(() =>
                  persist({
                    ...data,
                    wardrobe: data.wardrobe.filter((x) => x.id !== o.id),
                  }),
                )
              }
            />
          </View>
        ))}
        <Button
          title="Build around my wardrobe →"
          onPress={() => {
            setWardrobeOpen(false);
            setResult(null);
            setTab("Build");
          }}
        />
      </Page>
    </Modal>
  );
}
