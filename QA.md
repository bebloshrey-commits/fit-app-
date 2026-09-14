# FitFind QA record

Verified on Windows with Node 24.19.0, Expo SDK 54 and a 390 × 844 browser viewport.

## Automated

34 automated checks pass via `node scripts/test.cjs`:

- Required catalogue counts and demo provenance.
- Complete £30, £50 and £100 outfits; occasion, size and total invariants.
- Empty catalogue, unaffordable catalogue, unavailable products and unavailable sizes.
- Unknown delivery, strict verified delivery, wrong location, stale evidence and late arrivals.
- Known shipping arithmetic and rejection of unknown live shipping.
- Swaps, stale swaps, cheaper replacements, multi-item Make it £X and budget-safe upgrades.
- Owned categories and colour/brand exclusions.
- Save/reopen/restart, deletion and unreadable storage recovery.
- Privacy-safe sharing and safe retailer URL selection.
- Free limit, trial expiry, repeat-trial prevention and mock plans.
- AI failure, weather failure, product network failure, location denied/provider failure.
- Search filters and malformed budgets.
- Native image-sharing orchestration, temporary file cleanup and fallback errors.
- Native JSX text containment, preventing stray whitespace outside Text components.

Strict TypeScript check passed. Web, iOS and Android production exports passed, including native Hermes bytecode. API health returns 200; unauthenticated styling requests return 401.

## Browser interaction checks

- Inspected onboarding and separate size/style steps.
- Inspected Home and all seven builder steps at phone width.
- Generated a £50-budget party outfit at £38.00.
- Swapped black pocket tee for white: £38.75.
- Applied Make it £33: two replacements, total £32.50.
- Saved, reloaded the app, reopened the same £32.50 outfit with £33 budget.
- Inspected share card, including item prices/total and absence of personal details.
- Opened sample product details; no fictional retailer link is offered.
- Inspected Profile and explicitly labelled demo subscription options.
- Added black jeans to the wardrobe and generated a £25 outfit within a £30 budget; the owned jeans cost £0.
- Activated the local seven-day demo trial without billing.
- Fixed duplicate SVG gradient IDs, reduced-budget alternative selection, invisible action feedback, navigation state retention and literal newline rendering during QA.

## Limits of verification

No physical mobile device or native simulator was connected. Native permission dialogs, GPS, native share sheets and signed store packages need device acceptance testing. Live stock, delivery, payment, AI and weather integrations remain disconnected. Automated tests exercise service contracts and failure handling; they do not verify external retailer purchases. Demo artwork is illustrative, not licensed retailer photography.

Monochrome redesign: 36/36 automated tests pass, including all five featured styles and optional measurement persistence. Browser checked profile, setup introduction, location, optional measurements, skip, sizes and visual picker. Corrected photo aspect ratios after screenshot inspection. Remotion MP4 rendered and bundled; physical-device playback and signed store builds remain unverified.
