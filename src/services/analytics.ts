export type AnalyticsEvent =
  | "app_opened"
  | "onboarding_completed"
  | "outfit_generation_started"
  | "outfit_generated"
  | "product_clicked"
  | "product_swapped"
  | "make_cheaper_used"
  | "upgrade_used"
  | "outfit_saved"
  | "outfit_shared"
  | "paywall_viewed"
  | "trial_started"
  | "subscription_started";
export interface Analytics {
  track(
    event: AnalyticsEvent,
    metadata?: { productId?: string; retailer?: string },
  ): void;
  clear(): void;
}
// Bounded, memory-only, no personal data and no external transmission.
export class LocalAnalytics implements Analytics {
  events: {
    event: AnalyticsEvent;
    at: number;
    metadata?: { productId?: string; retailer?: string };
  }[] = [];
  track(
    event: AnalyticsEvent,
    metadata?: { productId?: string; retailer?: string },
  ) {
    this.events = [
      ...this.events.slice(-99),
      { event, at: Date.now(), metadata },
    ];
  }
  clear() {
    this.events = [];
  }
}
export const analytics = new LocalAnalytics();
