export interface SubscriptionState {
  generations: number;
  tier: "free" | "trial" | "monthly" | "annual";
  trialStartedAt: string | null;
}
export const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  generations: 0,
  tier: "free",
  trialStartedAt: null,
};
export interface SubscriptionService {
  canGenerate(s: SubscriptionState): boolean;
  startTrial(s: SubscriptionState): SubscriptionState;
  subscribe(
    s: SubscriptionState,
    tier: "monthly" | "annual",
  ): SubscriptionState;
}
export class MockSubscriptionService implements SubscriptionService {
  canGenerate(s: SubscriptionState) {
    return (
      s.generations < 3 ||
      s.tier === "monthly" ||
      s.tier === "annual" ||
      (s.tier === "trial" &&
        !!s.trialStartedAt &&
        Date.now() - Date.parse(s.trialStartedAt) < 7 * 86400000)
    );
  }
  startTrial(s: SubscriptionState): SubscriptionState {
    if (s.trialStartedAt)
      throw new Error(
        "The demo trial has already been used. Choose a demo plan.",
      );
    return { ...s, tier: "trial", trialStartedAt: new Date().toISOString() };
  }
  subscribe(
    s: SubscriptionState,
    tier: "monthly" | "annual",
  ): SubscriptionState {
    return { ...s, tier };
  }
}
export const subscriptionService = new MockSubscriptionService();
