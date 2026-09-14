import { Modal, Text } from "react-native";
import { Button, Note, Page, s, Title } from "../components/ui";
import { analytics } from "../services/analytics";
import { subscriptionService } from "../services/subscription";
import { AppData } from "../storage";
type Tab = "Home" | "Build" | "Saved" | "Profile";
export function SubscriptionModal({
  data,
  setPaywall,
  safe,
  persist,
  paywall,
  error,
}: {
  data: AppData;
  setPaywall: (v: boolean) => void;
  safe: (fn: () => Promise<void>) => Promise<void>;
  persist: (d: AppData) => Promise<void>;
  paywall: boolean;
  error: string;
}) {
  return (
    <Modal
      visible={paywall}
      animationType="slide"
      onRequestClose={() => setPaywall(false)}
    >
      <Page inset>
        {!!error && <Note error text={error} />}
        <Button
          secondary
          title="Close plans"
          onPress={() => setPaywall(false)}
        />
        <Title
          eyebrow="FITFIND PREMIUM · DEMO"
          title={"More outfits.\nMore possibilities."}
          body="Three free generations, then explore a 7-day trial. All controls below simulate access locally."
        />
        <Note text="No payment will be taken. These are development subscription states, not App Store or Google Play purchases." />
        <Button
          title="Start 7-day demo trial"
          disabled={!!data.subscription.trialStartedAt}
          onPress={() =>
            safe(async () => {
              await persist({
                ...data,
                subscription: subscriptionService.startTrial(data.subscription),
              });
              analytics.track("trial_started");
              setPaywall(false);
            })
          }
        />
        <Button
          secondary
          title="Simulate monthly · £5.99/month"
          onPress={() =>
            safe(async () => {
              await persist({
                ...data,
                subscription: subscriptionService.subscribe(
                  data.subscription,
                  "monthly",
                ),
              });
              analytics.track("subscription_started");
              setPaywall(false);
            })
          }
        />
        <Button
          secondary
          title="Simulate annual · £49.99/year"
          onPress={() =>
            safe(async () => {
              await persist({
                ...data,
                subscription: subscriptionService.subscribe(
                  data.subscription,
                  "annual",
                ),
              });
              analytics.track("subscription_started");
              setPaywall(false);
            })
          }
        />
        <Button
          secondary
          title="Return to free demo plan"
          onPress={() =>
            safe(async () => {
              await persist({
                ...data,
                subscription: { ...data.subscription, tier: "free" },
              });
              setPaywall(false);
            })
          }
        />
        <Text style={s.body}>
          Real subscriptions require platform billing, server receipt
          validation, restore purchases and cancellation links before release.
        </Text>
      </Page>
    </Modal>
  );
}
