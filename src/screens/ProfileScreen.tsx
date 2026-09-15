import { Switch, Text, View } from "react-native";
import { Button, Note, Page, s, Title } from "../components/ui";
import { analytics } from "../services/analytics";
import { integrations } from "../services/integrations";
import { AppData } from "../storage";
import { ProfileFields } from "./ProfileFields";
type Tab = "Home" | "Build" | "Saved" | "Profile";
export function ProfileScreen({
  data,
  setData,
  safe,
  persist,
  setNotice,
  notice,
  setPaywall,
  setDeleteOpen,
}: {
  data: AppData;
  setData: (d: AppData) => void;
  safe: (fn: () => Promise<void>) => Promise<void>;
  persist: (d: AppData) => Promise<void>;
  setNotice: (s: string) => void;
  notice: string;
  setPaywall: (v: boolean) => void;
  setDeleteOpen: (v: boolean) => void;
}) {
  return (
    <Page>
      <Title
        eyebrow="MADE FOR YOU"
        title="Your style profile."
        body="Useful preferences. Nothing more."
      />
      <Button
        title="Open setup guide"
        secondary
        onPress={() => setData({ ...data, onboarded: false })}
      />
      <ProfileFields
        profile={data.profile}
        onChange={(profile) => setData({ ...data, profile })}
      />
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.h2}>Sustainable mode</Text>
          <Text style={s.body}>
            Show only retailer-verified sustainability claims when live product
            data supports it.
          </Text>
        </View>
        <Switch
          accessibilityLabel="Sustainable mode"
          value={data.profile.sustainableMode ?? false}
          onValueChange={(sustainableMode) =>
            setData({ ...data, profile: { ...data.profile, sustainableMode } })
          }
        />
      </View>
      <Button
        title="Save preferences"
        onPress={() =>
          safe(async () => {
            await persist(data);
            setNotice("Preferences saved on this device.");
          })
        }
      />
      {!!notice && <Note text={notice} />}
      <View style={s.card}>
        <Text style={s.h2}>FitFind Premium</Text>
        <Text style={s.body}>
          Demo status: {data.subscription.tier}.{" "}
          {Math.max(0, 3 - data.subscription.generations)} free generations
          left.
        </Text>
        <Button
          secondary
          title="Explore demo plans"
          onPress={() => {
            setPaywall(true);
            analytics.track("paywall_viewed");
          }}
        />
      </View>
      <View style={s.card}>
        <Text style={s.h2}>Connected features</Text>
        <Text style={s.body}>
          These features activate only with approved services. FitFind will not
          simulate live shopping, voice, payments or try-on results.
        </Text>
        {Object.values(integrations).map((integration) => (
          <Text key={integration.label} style={s.small}>
            {integration.label} ·{" "}
            {integration.state === "ready" ? "ready" : "provider needed"}
          </Text>
        ))}
      </View>
      <Text style={s.h2}>Your privacy</Text>
      <Text style={s.body}>
        Preferences, outfits and your wardrobe are stored locally. Analytics are
        anonymous events kept only in memory. No accounts, advertising trackers,
        body ratings or background location tracking. Sharing excludes your
        personal details.
      </Text>
      <Button
        secondary
        title="Delete all my data"
        onPress={() => setDeleteOpen(true)}
      />
      <Text style={s.small}>
        FitFind 1.0 · Demo MVP · Weather, live retail and payments are not
        connected.
      </Text>
    </Page>
  );
}
