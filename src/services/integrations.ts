export type IntegrationId =
  | "productFeeds"
  | "affiliateTracking"
  | "weather"
  | "screenshotStyling"
  | "virtualTryOn"
  | "voiceInput"
  | "accounts"
  | "payments"
  | "priceAlerts"
  | "groupPlanner"
  | "admin";

export type IntegrationState = "ready" | "requires_provider";
export const integrations: Record<
  IntegrationId,
  { label: string; state: IntegrationState; detail: string }
> = {
  productFeeds: {
    label: "Live product feeds",
    state: "requires_provider",
    detail: "Requires approved retailer or affiliate feeds.",
  },
  affiliateTracking: {
    label: "Affiliate attribution",
    state: "requires_provider",
    detail: "Requires approved affiliate links and a backend redirect.",
  },
  weather: {
    label: "Weather",
    state: "requires_provider",
    detail: "Uses a verified weather backend when configured.",
  },
  screenshotStyling: {
    label: "Screenshot-to-outfit",
    state: "requires_provider",
    detail: "Requires an opt-in vision provider and image privacy controls.",
  },
  virtualTryOn: {
    label: "Virtual try-on",
    state: "requires_provider",
    detail:
      "Requires an opt-in image processing provider; no body inference is performed locally.",
  },
  voiceInput: {
    label: "Voice commands",
    state: "requires_provider",
    detail: "Requires a speech-recognition capability or backend.",
  },
  accounts: {
    label: "Accounts and groups",
    state: "requires_provider",
    detail: "Requires authentication, sync and invitation services.",
  },
  payments: {
    label: "Secure payments",
    state: "requires_provider",
    detail: "Requires App Store / Play Billing and server receipt validation.",
  },
  priceAlerts: {
    label: "Price-drop and restock alerts",
    state: "requires_provider",
    detail: "Requires scheduled feed monitoring and notification permission.",
  },
  groupPlanner: {
    label: "Group outfit planner",
    state: "requires_provider",
    detail: "Requires authenticated shared plans and real-time sync.",
  },
  admin: {
    label: "Admin tools",
    state: "requires_provider",
    detail: "Requires role-based server access and audit logs.",
  },
};
