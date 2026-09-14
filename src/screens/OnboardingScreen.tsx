import { Reveal } from "../components/Reveal";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotionIntro } from "../components/MotionIntro";
import { Garment } from "../components/Garment";
import { Button, Note, Page, s, theme, Title } from "../components/ui";
import { analytics } from "../services/analytics";
import { AppData } from "../storage";
import { ProfileFields } from "./ProfileFields";
type Tab = "Home" | "Build" | "Saved" | "Profile";
export function OnboardingScreen({
  data,
  setData,
  onboardStep,
  setOnboardStep,
  error,
  safe,
  persist,
}: {
  data: AppData;
  setData: (d: AppData) => void;
  onboardStep: number;
  setOnboardStep: (v: number) => void;
  error: string;
  safe: (fn: () => Promise<void>) => Promise<void>;
  persist: (d: AppData) => Promise<void>;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.paper }}>
      <StatusBar style="dark" />
      <Page key={onboardStep}>
        <Reveal>
          <Text style={[s.h2, { letterSpacing: 1.5 }]}>
            fitfind<Text style={{ color: "#111111" }}> ✳</Text>
          </Text>
          {onboardStep === 0 ? (
            <>
              <MotionIntro />
              <Title
                title={"Good outfits.\nGreat plans."}
                body="Tell us where you’re going and what you want to spend. We’ll put the pieces together."
              />
              <Note text="Explore the working demo with 110 sample products. Live shopping and delivery will need a connected retailer." />
            </>
          ) : (
            <>
              <Title
                eyebrow={`A LITTLE ABOUT YOU · ${onboardStep} / 4`}
                title={
                  onboardStep === 1
                    ? "Let’s make it yours."
                    : onboardStep === 2
                      ? "A fit that feels right."
                      : onboardStep === 3
                        ? "Choose your usual sizes."
                        : "What feels like you?"
                }
                body="Your preferences stay on this device. Change or delete them any time."
              />
              <ProfileFields
                profile={data.profile}
                onChange={(profile) => setData({ ...data, profile })}
                section={
                  onboardStep === 1
                    ? "intro"
                    : onboardStep === 2
                      ? "fit"
                      : onboardStep === 3
                        ? "sizes"
                        : "style"
                }
              />
            </>
          )}
          {onboardStep === 2 && (
            <Button
              title="Skip optional fit details"
              secondary
              onPress={() => setOnboardStep(3)}
            />
          )}
          {!!error && <Note error text={error} />}
          <Button
            title={
              onboardStep === 0
                ? "Find my style →"
                : onboardStep === 4
                  ? "Let’s find your fit →"
                  : "Continue →"
            }
            onPress={() => {
              if (onboardStep < 4) setOnboardStep(onboardStep + 1);
              else
                safe(async () => {
                  await persist({ ...data, onboarded: true });
                  analytics.track("onboarding_completed");
                });
            }}
          />
          {onboardStep > 0 && (
            <Button
              title="Back"
              secondary
              onPress={() => setOnboardStep(onboardStep - 1)}
            />
          )}
          <Text style={[s.small, { textAlign: "center" }]}>
            Clothing, confidence and a little less guesswork.
          </Text>
        </Reveal>
      </Page>
    </SafeAreaView>
  );
}
