import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Garment } from "../components/Garment";
import { Button, Chips, Page, s, Title } from "../components/ui";
import { Outfit } from "../models";
import { AppData } from "../storage";
type Tab = "Home" | "Build" | "Saved" | "Profile";
export function SavedScreen({
  data,
  outfitTile,
  safe,
  persist,
  setResult,
  setTab,
}: {
  data: AppData;
  outfitTile: (o: Outfit) => ReactNode;
  safe: (fn: () => Promise<void>) => Promise<void>;
  persist: (d: AppData) => Promise<void>;
  setResult: (o: Outfit | null) => void;
  setTab: (t: Tab) => void;
}) {
  return (
    <Page>
      <Title
        eyebrow="THE KEEPERS"
        title="Good fits, on repeat."
        body={`${data.saved.length} saved outfits · Stored on this device`}
      />
      {data.saved.length ? (
        data.saved.map((o) => (
          <View key={o.id} style={{ gap: 8 }}>
            {outfitTile(o)}
            <Text style={s.label}>Your rating</Text>
            <Chips
              options={["1", "2", "3", "4", "5"]}
              values={
                data.ratings.find((rating) => rating.outfitId === o.id)
                  ? [
                      String(
                        data.ratings.find((rating) => rating.outfitId === o.id)!
                          .stars,
                      ),
                    ]
                  : []
              }
              onChange={(value) =>
                safe(() =>
                  persist({
                    ...data,
                    ratings: [
                      ...data.ratings.filter(
                        (rating) => rating.outfitId !== o.id,
                      ),
                      {
                        outfitId: o.id,
                        stars: Number(value) as 1 | 2 | 3 | 4 | 5,
                        note: "",
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  }),
                )
              }
            />
            <Button
              secondary
              title={`Remove ${o.name}`}
              onPress={() =>
                safe(() =>
                  persist({
                    ...data,
                    saved: data.saved.filter((x) => x.id !== o.id),
                  }),
                )
              }
            />
          </View>
        ))
      ) : (
        <View style={s.card}>
          <Garment category="accessory" colour="Beige" size={180} />
          <Text style={s.h2}>Make room for a favourite.</Text>
          <Text style={s.body}>
            Build an outfit and save it here for your next plan.
          </Text>
          <Button
            title="Build my first outfit"
            onPress={() => {
              setResult(null);
              setTab("Build");
            }}
          />
        </View>
      )}
    </Page>
  );
}
