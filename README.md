# FitFind

A working TypeScript / React Native / Expo mobile MVP for iOS and Android, with a web preview. Build an outfit from your occasion, deadline, location, budget, style, colours, separate clothing sizes and manually entered wardrobe. Swap individual items, lower the whole outfit to a new budget, compare alternatives, save, reopen and share.

**This is a demo shopping MVP, not a public-launch shopping service.** Its 110 synthetic products are clearly labelled. No demo entry pretends to be purchasable or have verified stock, shipping or delivery. No real subscription purchase occurs.

## Run

Use Node 22.18+ (tested with 24.19.0) and pnpm. From this project folder:

```sh
pnpm install --config.node-linker=hoisted
pnpm start
```

For a browser preview, run `pnpm web`. The current local preview uses http://localhost:8081. If automatic browser opening is unavailable, use `pnpm start` and open that URL manually. Metro uses one worker for compatibility with constrained Windows hosts.

Commands also work without pnpm script shims after installation:

```sh
node node_modules/expo/bin/cli start --port 8081
node scripts/test.cjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/expo/bin/cli export --platform all
```

## Run on an iPhone

1. For Expo Go use `pnpm start:go`; for an installed custom development client use `pnpm start:dev`. Keep the computer and iPhone on the same Wi-Fi and allow the development server through your local firewall.
2. With an **Expo Go version compatible with Expo SDK 54**, scan the terminal QR code using the iPhone camera. The current App Store version may target a newer SDK; do not assume it can open this pinned SDK.
3. If Expo Go is incompatible, use an EAS internal preview build. With your own Expo account and Apple signing credentials, run `pnpm dlx eas-cli build --platform ios --profile preview`. Register the iPhone when prompted, then open the resulting installation link on it. Apple developer membership/signing may be required. No cloud builds or paid services were initiated here.
4. `pnpm ios` launches a simulator only on a Mac with Xcode; Windows cannot run the iOS simulator.

For Android, use a compatible Expo Go client or `pnpm dlx eas-cli build --platform android --profile preview` to produce an internal APK. `pnpm android` now compiles a development client and requires an Android SDK, compatible JDK and a connected device/emulator. `pnpm ios` compiles the iOS development client on macOS with Xcode. Native projects can be regenerated with `pnpm exec expo prebuild --no-install`; generated `android/` and `ios/` folders are ignored in Git.

## What works

- Four-tab Home / Build / Saved / Profile navigation and persistent onboarding.
- Seven-step builder, custom occasion/date, multiple styles, preferred/excluded colours and brands, top/jacket sizes, waist sizes and UK shoe sizes.
- Manual wardrobe, one owned item per selected category, £0 contribution and palette influence.
- 110 synthetic catalogue entries: 30 tops, 30 bottoms, 20 shoes, 15 jackets, 15 accessories. Local SVG illustrations work offline.
- Deterministic filtering, beam-search ranking, Best Overall / Cheapest / Most Stylish, integer-pence budget validation.
- Category swaps, filtered alternatives, Make it £X, make cheaper, matching-based upgrades, explanations of replacements.
- Search by name/brand, retailer, price, colour, rating and verified delivery; size/style remain constrained by the build request. Best Match / Cheapest / Fastest Delivery / Best Value sorting. Demo products intentionally have no ratings.
- Persistent saved outfits/history/preferences/subscription state; delete all local data.
- Share-card preview, native PNG image sharing and native text sharing; clipboard fallback on web. Web users can screenshot the card. Temporary native PNGs are cleaned up after the share action.
- Three free generations, simulated seven-day trial and simulated monthly/annual plans; no billing credentials or charges.
- Product-provider, weather, AI, delivery, analytics, commerce, image sharing, storage and subscription boundaries. Native safe-area insets and keyboard avoidance are supported.

## Architecture

| Location                    | Responsibility                                                         |
| --------------------------- | ---------------------------------------------------------------------- |
| `App.tsx`                   | App state, navigation and persistent service coordination              |
| `src/screens/`              | Onboarding, home, builder, results, saved, profile, wardrobe and plans |
| `src/components/`           | UI primitives, product cards, local garment illustrations              |
| `src/models.ts`             | Complete product/profile/request/outfit types                          |
| `src/catalog.ts`            | Synthetic catalogue generation                                         |
| `src/engine.ts`             | Filtering, weighted ranking, swaps, cheaper and upgrade logic          |
| `src/providers/products.ts` | ProductProvider interface, demo and HTTPS API adapters                 |
| `src/services/`             | Delivery, weather, location, AI, commerce, analytics, subscription     |
| `src/storage.ts`            | Versioned AsyncStorage and injectable storage driver                   |
| `server/server.ts`          | Separate, local-only, authenticated API boundary                       |
| `scripts/test.cjs`          | Automated behavioural tests; no test framework required                |
| `app.json`, `eas.json`      | Native app and EAS build configuration                                 |

All product money fields are **integer GBP pence**. `price` is the current payable item price; `originalPrice`/`salePrice` are optional metadata. Known delivery cost is included per product (conservative for future multi-item retailer orders). Unknown shipping on demo items is visibly disclosed. **Live products with unknown shipping or missing HTTPS product links are excluded**, so the live engine cannot silently understate the total. An approved provider should allocate order-level shipping explicitly to avoid double counting.

Occasion/style/size/avoid-colour/avoid-brand/deadline constraints remain active through swaps and cheaper operations. Colour preferences influence ranking; excluded colours are hard filters. Custom occasions use general matching because no natural-language model is connected. Scores describe clothing matching, never bodies or attractiveness. Upgrades need a matching-score improvement and must remain within budget; higher price is not treated as proof of quality.

The beam keeps 180 partial combinations while reserving the cheapest remaining category costs; a separate cheapest path guarantees a feasible result when a valid combination exists. This is bounded ranking, not exhaustive optimisation. `WEIGHTS` follows the specification. No commission enters the score.

Delivery requires live source data, an explicit verification flag, matching destination, an arrival date, supported fulfilment method and evidence checked within the last hour. Otherwise the app says **Delivery not verified**. Verified late products are excluded. Strict verified delivery correctly returns no demo outfit. Dates use calendar-day deadlines; production integrations should use retailer-local timezone and cutoff data.

## Backend and secrets

The offline app needs **no API key and no backend**. The separate development server starts with `pnpm server`.

`GET /health` is public. `POST /style` requires `Authorization: Bearer <SERVER_ACCESS_TOKEN>`, validates input and uses a deterministic explanation when no AI credential is configured; with a server-only `AI_API_KEY`, it calls the configured model with a prompt that prohibits invented commerce or weather claims. `GET /weather` returns unavailable (`null`) when no weather credential is configured, or normalized current conditions from the configured server-side weather provider. `/products` returns 503 until an approved live provider is connected. The server binds only to `127.0.0.1:8787`.

Copy `.env.example` to `.env` only if you need local server settings, then run:

```sh
node --env-file=.env --experimental-strip-types server/server.ts
```

`SERVER_ACCESS_TOKEN` is a server-side development authorization value; **never embed it in the mobile bundle**. A production adapter must obtain short-lived user tokens from an authentication service. `AI_API_KEY` enables the server-side style explanation adapter only. The client `BackendAIProvider` falls back to deterministic explanations on timeout/failure. No model API is called per swap or calculation.

`.env`, credentials, build folders and signing files are ignored. There are no secrets in the client. Before deploying this development server, add real user authentication, TLS ingress, per-user rate limits, validated provider response schemas and production observability. Do not expose the local development server as-is.

## Live services still required

- **Shopping:** an approved retailer/affiliate feed and a server adapter providing real HTTPS listings, licensed imagery, prices, sizes, stock, shipping and destination-specific delivery evidence. The mobile `ApiProductProvider` already supplies the interface; live ingestion and provider authentication still need implementation.
- **Weather:** the server can normalize current conditions with `OPENWEATHER_API_KEY`; failures already fall back to no weather. The engine uses weather when supplied; it does not automatically add an unrequested jacket.
- **AI:** optional server model integration and credentials for custom-language interpretation/explanations. Current generation is useful deterministic code, not a simulated AI wait.
- **Payments:** App Store / Google Play or a subscription SDK, server receipt validation, restore purchases and entitlement synchronization. Current access is explicitly local simulation.
- **Affiliate attribution:** real programme URLs and an approved click endpoint. Current product click attribution and event names exist; no purchase events are invented. Analytics are memory-only and never transmitted.

## Verification

```sh
pnpm test
pnpm typecheck
pnpm build
```

See `QA.md` for test coverage and observed UI results. The test harness transpiles TypeScript to memory and uses an injected storage driver; it tests actual business logic and persistence serialization. `typecheck` performs strict checking separately.

Production web JavaScript and native Hermes bundles export into `dist/`. These **are not signed IPA/APK/AAB packages**. Physical iPhone/Android testing, platform share sheets and permission prompts have not been run on this Windows host.

## Before App Store / Google Play submission

For both stores: connect trustworthy shopping data, replace mock billing, validate real fulfilment and shipping, add licensed product photography, finish accessibility/device/network QA, create icon/splash/store imagery, publish a privacy policy/support URL and choose publisher-owned app identifiers. Review dependencies and upgrade the pinned Expo SDK as required by store/toolchain support at submission time.

Apple: configure signing/provisioning and App Store Connect, test on physical iPhones/TestFlight, set up subscriptions/restores and complete privacy disclosures and review information.

Google: configure signing/upload key and Play Console, produce a signed AAB, verify the then-required target SDK and device compatibility, set up Play Billing, complete Data Safety/content declarations and testing requirements.

This repository is a working offline MVP, not ready for public commerce or paid subscriptions.

## Monochrome design and guided setup

Profile > Open setup guide reopens onboarding without deleting saved outfits. The guide collects location, optional height (cm), weight (kg), self-described body shape and fit preference, explicit clothing sizes, and visual style selections. Measurements are local context only; no retailer size or body rating is inferred. Y2K and Smart streetwear are supported catalogue tags.

Remotion 4.0.524 composition: `motion/index.tsx`. Run `pnpm motion:studio` to edit, `pnpm motion:render` to regenerate `assets/fitfind-intro.mp4`. Expo Video 3 plays this bundled silent animation on mobile and web; Reduce Motion shows a static image. Native setup transitions use React Native Animated because Remotion compositions render to video rather than native interactive controls.

Generated artwork: `assets/style-editorial.png` (built-in image generation tool; no API key). Prompt: four equal editorial panels showing adult models in Y2K denim and layers, oversized streetwear, black formal tailoring, and smart casual tailoring; black/white/charcoal palette, neutral grey studio, full outfits, soft lighting, no text, brands or watermarks. The style picker crops this contact sheet at display time. Inspiration images are labelled and are never presented as purchasable products.

Native development clients must be rebuilt after adding Expo Video. Expo Go requires a version compatible with SDK 54. Store release still requires real retailer data, production subscription integration, privacy declarations, signed builds and device QA.

## Live multi-retailer shopping

FitFind has a server-side, no-key merchant-feed adapter for normalized JSON feeds. Configure `RETAILER_FEEDS_JSON` from `.env.example` with retailer-approved HTTPS feed URLs. UNIQLO, Zara and Pull&Bear are listed as target integrations, but remain disabled until approved feeds or partner APIs are supplied. FitFind does not scrape their sites or turn retailer search pages into unverifiable inventory.

Every live result must provide price, known order-level delivery cost, VAT status, additional tax, unavoidable fees, size stock, product URL, cost verification time and verified destination-specific delivery evidence. Missing fields make the item ineligible. Outfit totals group delivery once per retailer and show item, delivery, tax and fee components. UK consumer prices are expected to include VAT; the feed must explicitly confirm that instead of FitFind adding 20% again.

The backend intentionally returns `503` when no approved feed is configured, so the client continues with clearly labelled demo data. Product credentials, if a future partner requires them, belong only on the backend.

## Expanded feature status

Working locally now: AI-assisted deterministic outfit ranking, explicit budget and checkout calculations, cheaper alternatives, wardrobe, saved outfits, style profile and likes/dislikes, copy-this-style, personal outfit ratings, weather-aware generation when a verified weather backend is configured, outfit calendar entries, packing lists, sustainable-only filtering based on verified retailer claims, text-to-speech outfit summaries, mock subscription state, privacy deletion and bounded local analytics.

The following are intentionally provider-gated: real product/affiliate links, screenshot-to-outfit, virtual try-on, voice-to-text, price-drop/restock monitoring, notifications, group collaboration, user accounts, secure payments and admin tools. Their integration contracts are enumerated in `src/services/integrations.ts`; they do not display invented results. Add approved providers, backend authentication, consent flows, encrypted server storage, role checks, audit logs and platform receipt validation before enabling them for customers.

`expo-speech` provides the native text-to-speech button. Rebuild iOS and Android development clients after adding it.
