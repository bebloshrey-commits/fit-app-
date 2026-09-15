import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Garment } from "./src/components/Garment";
import { Button, Note, s, theme, Title } from "./src/components/ui";
import { money, outfitEngine } from "./src/engine";
import { BuildRequest, Outfit, Product } from "./src/models";
import {
  DemoProductProvider,
  FallbackProductProvider,
  MerchantFeedProductProvider,
} from "./src/providers/products";
import { Builder } from "./src/screens/Builder";
import { HomeScreen } from "./src/screens/HomeScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { Results } from "./src/screens/Results";
import { SavedScreen } from "./src/screens/SavedScreen";
import { SubscriptionModal } from "./src/screens/SubscriptionModal";
import { WardrobeModal } from "./src/screens/WardrobeModal";
import { PlannerScreen } from "./src/screens/PlannerScreen";
import { analytics } from "./src/services/analytics";
import { subscriptionService } from "./src/services/subscription";
import {
  ApiWeatherService,
  UnavailableWeatherService,
} from "./src/services/weather";
import { AppData, freshData, storage } from "./src/storage";
const demoProvider = new DemoProductProvider();
const liveApiUrl = process.env.EXPO_PUBLIC_FITFIND_API_URL;
const weatherService = liveApiUrl
  ? new ApiWeatherService(liveApiUrl)
  : new UnavailableWeatherService();
const provider = liveApiUrl
  ? new FallbackProductProvider(
      new MerchantFeedProductProvider(liveApiUrl),
      demoProvider,
    )
  : demoProvider;
type Tab = "Home" | "Build" | "Saved" | "Profile";
export default function App() {
  return (
    <SafeAreaProvider>
      <FitFindApp />
    </SafeAreaProvider>
  );
}

function FitFindApp() {
  const [data, setData] = useState<AppData | null>(null),
    [tab, setTab] = useState<Tab>("Home"),
    [onboardStep, setOnboardStep] = useState(0),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState<Outfit | null>(null),
    [variants, setVariants] = useState<Outfit[]>([]),
    [products, setProducts] = useState<Product[]>([]),
    [wardrobeOpen, setWardrobeOpen] = useState(false),
    [paywall, setPaywall] = useState(false),
    [deleteOpen, setDeleteOpen] = useState(false),
    [plannerOpen, setPlannerOpen] = useState(false);
  useEffect(() => {
    storage
      .load()
      .then(setData)
      .catch((e) => setError(e.message));
    provider
      .search({})
      .then(setProducts)
      .catch(() =>
        setError("Catalogue unavailable. Restart the app to retry."),
      );
    analytics.track("app_opened");
  }, []);
  const persist = async (next: AppData) => {
    await storage.save(next);
    setData(next);
  };
  const safe = async (fn: () => Promise<void>) => {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save your changes. Try again.",
      );
    }
  };
  const generate = async (r: BuildRequest) => {
    if (!data || busy) return;
    if (!subscriptionService.canGenerate(data.subscription)) {
      analytics.track("paywall_viewed");
      setPaywall(true);
      return;
    }
    setBusy(true);
    setError("");
    analytics.track("outfit_generation_started");
    try {
      const weather = await weatherService.getWeather(r.location, r.deadline);
      const list = await provider.search({});
      const outfits = outfitEngine.generate(list, { ...r, weather });
      await persist({
        ...data,
        profile: r.profile,
        recent: [outfits[0]!, ...data.recent].slice(0, 12),
        subscription: {
          ...data.subscription,
          generations: data.subscription.generations + 1,
        },
      });
      setProducts(list);
      setVariants(outfits);
      setResult(outfits[0]!);
      analytics.track("outfit_generated");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not build your outfit. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  };
  const reset = async () => {
    await storage.deleteAll();
    analytics.clear();
    setData(freshData());
    setResult(null);
    setVariants([]);
    setTab("Home");
    setDeleteOpen(false);
    setOnboardStep(0);
    setError("");
    setNotice("");
  };
  if (!data)
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.paper,
          justifyContent: "center",
          padding: 30,
          gap: 20,
        }}
      >
        <StatusBar style="dark" />
        {error ? (
          <>
            <Note error text={error} />
            <Button
              title="Reset unreadable local data"
              onPress={() => safe(reset)}
            />
          </>
        ) : (
          <>
            <ActivityIndicator color={theme.ink} />
            <Text style={s.body}>Opening FitFind…</Text>
          </>
        )}
      </SafeAreaView>
    );
  if (!data.onboarded)
    return (
      <OnboardingScreen
        data={data}
        setData={setData}
        onboardStep={onboardStep}
        setOnboardStep={setOnboardStep}
        error={error}
        safe={safe}
        persist={persist}
      />
    );
  const reopen = (o: Outfit) => {
    setResult(o);
    setVariants([o]);
    setTab("Build");
  };
  const outfitTile = (o: Outfit) => (
    <Pressable
      key={o.id}
      accessibilityRole="button"
      accessibilityLabel={`Open ${o.name}`}
      onPress={() => reopen(o)}
      style={s.card}
    >
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.h2}>{o.name}</Text>
          <Text style={s.small}>
            {o.request.occasion} · {money(o.totalPrice)}
          </Text>
        </View>
        <Garment
          category={o.products[0]?.category ?? "top"}
          colour={o.products[0]?.colours[0]}
          size={75}
        />
      </View>
      <Text style={s.small}>
        {o.request.deadline ? `Needed ${o.request.deadline}` : "No deadline"} ·
        Demo outfit
      </Text>
    </Pressable>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.paper }}>
      <StatusBar style="dark" />
      <View
        style={{ flex: 1, width: "100%", maxWidth: 720, alignSelf: "center" }}
      >
        <View style={[s.row, { paddingHorizontal: 24, paddingVertical: 18 }]}>
          <Text style={[s.h2, { fontSize: 25, letterSpacing: -1 }]}>
            fitfind<Text style={{ color: "#111111" }}> ✳</Text>
          </Text>
          <View
            style={{
              backgroundColor: "#EFEFEF",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
            }}
          >
            <Text
              style={[
                s.eyebrow,
                { fontSize: 9, color: "#555555", letterSpacing: 1 },
              ]}
            >
              DEMO COLLECTION
            </Text>
          </View>
        </View>
        {!!error && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
            <Note text={error} error />
            <Pressable accessibilityRole="button" onPress={() => setError("")}>
              <Text style={s.small}>Dismiss</Text>
            </Pressable>
          </View>
        )}
        {tab === "Home" && (
          <HomeScreen
            data={data}
            setResult={setResult}
            setTab={setTab}
            setWardrobeOpen={setWardrobeOpen}
            setPlannerOpen={setPlannerOpen}
            outfitTile={outfitTile}
          />
        )}
        {tab === "Build" &&
          (result ? (
            <Results
              onChange={setResult}
              initial={result}
              variants={variants}
              products={products}
              provider={provider}
              onBack={() => setResult(null)}
              onSave={async (o) =>
                persist({
                  ...data,
                  saved: [o, ...data.saved.filter((x) => x.id !== o.id)],
                })
              }
              onCopyStyle={async (o) =>
                persist({
                  ...data,
                  profile: {
                    ...data.profile,
                    styles: o.request.profile.styles,
                    colours: o.request.profile.colours,
                    avoidColours: o.request.profile.avoidColours,
                  },
                })
              }
            />
          ) : (
            <Builder
              profile={data.profile}
              wardrobe={data.wardrobe}
              onBuild={generate}
              busy={busy}
            />
          ))}
        {tab === "Saved" && (
          <SavedScreen
            data={data}
            outfitTile={outfitTile}
            safe={safe}
            persist={persist}
            setResult={setResult}
            setTab={setTab}
          />
        )}
        {tab === "Profile" && (
          <ProfileScreen
            data={data}
            setData={setData}
            safe={safe}
            persist={persist}
            setNotice={setNotice}
            notice={notice}
            setPaywall={setPaywall}
            setDeleteOpen={setDeleteOpen}
          />
        )}
        <View
          style={{
            flexDirection: "row",
            borderTopWidth: 1,
            borderColor: theme.line,
            backgroundColor: "#FFFFFF",
            paddingVertical: 10,
          }}
        >
          {(["Home", "Build", "Saved", "Profile"] as Tab[]).map((t, i) => (
            <Pressable
              key={t}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              onPress={() => {
                setTab(t);
                setError("");
              }}
              style={{ flex: 1, alignItems: "center", gap: 5, padding: 6 }}
            >
              <View
                style={{
                  backgroundColor: tab === t ? "#EAEAEA" : "transparent",
                  borderRadius: 15,
                  paddingHorizontal: 20,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ color: theme.ink, fontSize: 20 }}>
                  {["⌂", "＋", "♡", "☷"][i]}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: tab === t ? "700" : "400",
                  color: theme.ink,
                }}
              >
                {t.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <WardrobeModal
        error={error}
        data={data}
        setWardrobeOpen={setWardrobeOpen}
        setResult={setResult}
        setTab={setTab}
        safe={safe}
        persist={persist}
        wardrobeOpen={wardrobeOpen}
      />
      <SubscriptionModal
        error={error}
        data={data}
        setPaywall={setPaywall}
        safe={safe}
        persist={persist}
        paywall={paywall}
      />
      <Modal
        visible={plannerOpen}
        animationType="slide"
        onRequestClose={() => setPlannerOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.paper }}>
          <PlannerScreen
            data={data}
            persist={persist}
            onClose={() => setPlannerOpen(false)}
          />
        </SafeAreaView>
      </Modal>
      <Modal
        visible={deleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#0008",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View style={s.card}>
            <Title
              title="Delete local data?"
              body="This removes your profile, wardrobe, saved outfits, history and demo subscription from this device. It cannot be undone."
            />
            <Button title="Delete everything" onPress={() => safe(reset)} />
            <Button
              secondary
              title="Keep my data"
              onPress={() => setDeleteOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
