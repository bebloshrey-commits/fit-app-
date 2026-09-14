import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { MotionIntro } from "../components/MotionIntro";
import { Garment } from "../components/Garment";
import { Button, Note, Page, s, Title } from "../components/ui";
import { Outfit } from "../models";
import { AppData } from "../storage";
type Tab = "Home" | "Build" | "Saved" | "Profile";
export function HomeScreen({
  data,
  setResult,
  setTab,
  setWardrobeOpen,
  outfitTile,
}: {
  data: AppData;
  setResult: (o: Outfit | null) => void;
  setTab: (t: Tab) => void;
  setWardrobeOpen: (v: boolean) => void;
  outfitTile: (o: Outfit) => ReactNode;
}) {
  return (
    <Page>
      <Title
        eyebrow={`HELLO${data.profile.name ? `, ${data.profile.name}` : ""} / LET’S GET DRESSED`}
        title={"Your next plan.\nYour next great fit."}
        body="A whole outfit. A real budget. Less endless scrolling."
      />
      <View
        style={{
          backgroundColor: "#EFEFF1",
          borderRadius: 28,
          padding: 22,
          gap: 10,
          overflow: "hidden",
        }}
      >
        <View style={s.row}>
          <Text style={s.eyebrow}>THE EVERYDAY EDIT</Text>
          <Text style={s.small}>01 / FITFIND</Text>
        </View>
        <MotionIntro />
        <Text style={[s.h2, { fontSize: 27 }]}>Less searching. More you.</Text>
        <Text style={s.body}>
          Start with your plans. We’ll handle the outfit maths.
        </Text>
        <Button
          title="Build an outfit →"
          onPress={() => {
            setResult(null);
            setTab("Build");
          }}
        />
      </View>
      <View style={s.card}>
        <Text style={s.h2}>A head start in your wardrobe.</Text>
        <Text style={s.body}>
          Your favourite jeans deserve another outing. Build around pieces you
          already own.
        </Text>
        <Button
          secondary
          title={`Use what I own · ${data.wardrobe.length} items`}
          onPress={() => setWardrobeOpen(true)}
        />
      </View>
      <View style={s.row}>
        <Text style={s.h2}>Your latest fits</Text>
        <Pressable onPress={() => setTab("Saved")}>
          <Text style={s.label}>Saved ↗</Text>
        </Pressable>
      </View>
      {data.recent.length ? (
        data.recent.slice(0, 3).map(outfitTile)
      ) : (
        <Text style={s.body}>
          Your first outfit starts with a plan. Try a £50 party look.
        </Text>
      )}
      {data.recent
        .filter(
          (o) =>
            o.request.deadline &&
            o.request.deadline >= new Date().toISOString().slice(0, 10),
        )
        .slice(0, 1)
        .map((o) => (
          <Note
            key={o.id}
            text={`Upcoming: ${o.request.occasion} on ${o.request.deadline}. Delivery not verified — check before buying.`}
          />
        ))}
      <Text style={s.small}>
        Independent matching. Affiliate commission never affects outfit ranking.
      </Text>
    </Page>
  );
}
