import { useRef, useState } from "react";
import { Linking, Modal, Platform, Share, Text, View } from "react-native";
import { Garment } from "../components/Garment";
import { ProductCard } from "../components/ProductCard";
import { Button, Chips, Field, Note, Page, s, Title } from "../components/ui";
import {
  describeChanges,
  checkoutBreakdown,
  money,
  outfitEngine,
  validateBudget,
} from "../engine";
import { Category, Outfit, Product } from "../models";
import {
  filterProducts,
  ProductProvider,
  SearchQuery,
} from "../providers/products";
import { analytics } from "../services/analytics";
import { retailerUrl, shareText } from "../services/commerce";
import { deliveryEngine, deliveryLabel } from "../services/delivery";
import { shareCardImage } from "../services/nativeImageShare";
import { speech } from "../services/speech";
export function Results({
  initial,
  variants,
  products,
  provider,
  onSave,
  onBack,
  onChange,
  onCopyStyle,
}: {
  initial: Outfit;
  variants: Outfit[];
  products: Product[];
  provider: ProductProvider;
  onSave: (o: Outfit) => Promise<void>;
  onBack: () => void;
  onChange: (o: Outfit) => void;
  onCopyStyle: (o: Outfit) => Promise<void>;
}) {
  const shareCard = useRef<View>(null);
  const [sharingImage, setSharingImage] = useState(false);
  const shareImage = async () => {
    setSharingImage(true);
    try {
      await shareCardImage(shareCard);
    } finally {
      setSharingImage(false);
    }
  };
  const [outfit, setOutfit] = useState(initial),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [category, setCategory] = useState<Category | null>(null),
    [target, setTarget] = useState(
      String(Math.floor(initial.totalPrice / 100) - 5),
    ),
    [detail, setDetail] = useState<Product | null>(null),
    [shareOpen, setShareOpen] = useState(false),
    [query, setQuery] = useState<SearchQuery>({ sort: "Best Match" }),
    [working, setWorking] = useState(false);
  const run = async (action: () => Promise<void> | void) => {
    setError("");
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong. Please retry.",
      );
    }
  };
  const replace = (next: Outfit) => {
    setNotice(describeChanges(outfit, next));
    setOutfit(next);
    onChange(next);
  };
  const open = async (p: Product) => {
    if (p.source === "demo") {
      setDetail(p);
      return;
    }
    const fresh = await provider.getProduct(p.id);
    if (!fresh || !(await provider.availability(p.id, p.selectedSize!))) {
      throw new Error(
        "This item or size is no longer available. Swap it for an alternative.",
      );
    }
    if (
      fresh.price !== p.price ||
      fresh.deliveryCost !== p.deliveryCost ||
      fresh.taxAmount !== p.taxAmount ||
      fresh.mandatoryFees !== p.mandatoryFees
    )
      throw new Error(
        "The checkout cost changed. Rebuild your outfit before shopping.",
      );
    const url = retailerUrl(fresh);
    if (!url)
      throw new Error("No verified retailer link. Choose another item.");
    await Linking.openURL(url);
    analytics.track("product_clicked", {
      productId: p.id,
      retailer: p.retailer,
    });
  };
  const check = async () => {
    const statuses = await Promise.all(
      outfit.products.map(async (p) => {
        const fresh = await provider.getProduct(p.id);
        if (!fresh || !(await provider.availability(p.id, p.selectedSize!)))
          return `${p.name}: no longer available in your size.`;
        return `${p.name}: ${deliveryLabel[deliveryEngine.evaluate(fresh, outfit.request.deadline, outfit.request.location)]}.`;
      }),
    );
    setNotice(statuses.join("\n"));
  };
  const visibleVariants = variants
    .filter((v) => v.totalPrice <= outfit.request.budget)
    .map((v) => ({
      ...v,
      request: { ...v.request, budget: outfit.request.budget },
      budgetRemaining: outfit.request.budget - v.totalPrice,
    }));
  const candidates = category
    ? filterProducts(
        outfitEngine.alternatives(outfit, category, products),
        query,
      )
    : [];
  const costs = checkoutBreakdown(outfit.products);
  const isDemo = outfit.products.every((product) => product.source === "demo");
  return (
    <>
      <Page>
        <Button secondary title="← Back to builder" onPress={onBack} />
        <Title
          eyebrow="YOUR OUTFIT, FOUND"
          title={outfit.name}
          body={`${outfit.request.occasion} · ${outfit.request.location} · ${outfit.request.deadline ?? "No deadline"}`}
        />
        <View
          style={[
            s.card,
            { backgroundColor: "#EBEBED", borderColor: "#EBEBED" },
          ]}
        >
          <View style={s.row}>
            <View>
              <Text style={s.eyebrow}>OUTFIT TOTAL</Text>
              <Text
                style={{
                  fontSize: 46,
                  letterSpacing: -2,
                  fontWeight: "700",
                  color: "#111111",
                }}
              >
                {money(outfit.totalPrice)}
              </Text>
            </View>
            <View>
              <Text style={s.label}>{money(outfit.budgetRemaining)} left</Text>
              <Text style={s.small}>Budget {money(outfit.request.budget)}</Text>
            </View>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={s.small}>Items {money(costs.items)}</Text>
            <Text style={s.small}>Delivery {money(costs.delivery)}</Text>
            <Text style={s.small}>
              Tax{" "}
              {isDemo
                ? "not verified"
                : costs.tax
                  ? money(costs.tax)
                  : "included"}
            </Text>
            {!!costs.fees && (
              <Text style={s.small}>Mandatory fees {money(costs.fees)}</Text>
            )}
          </View>
        </View>
        {isDemo && (
          <Note text="DEMO COLLECTION · Fictional sample products, prices and sizes. These items are not purchasable listings. Delivery and tax are not verified." />
        )}
        <Chips
          options={visibleVariants.map((v) => v.variant)}
          values={[outfit.variant]}
          onChange={(v) => {
            const next = visibleVariants.find((o) => o.variant === v)!;
            setOutfit(next);
            onChange(next);
            setNotice("");
          }}
        />
        <Text style={s.body}>
          Selected for your style, occasion and palette.{" "}
          {outfit.request.weather
            ? "Local weather influenced the ranking."
            : "Weather unavailable; check conditions before heading out."}
        </Text>
        {!!error && <Note error text={error} />}
        {!!notice && <Note text={notice} />}
        {outfit.products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            request={outfit.request}
            onOpen={() => run(() => open(p))}
            onSwap={() => {
              setCategory(p.category);
              setQuery({ sort: "Best Match" });
            }}
          />
        ))}
        {outfit.request.owned.map((o) => (
          <View key={o.id} style={s.card}>
            <Text style={s.eyebrow}>FROM YOUR WARDROBE</Text>
            <Text style={s.h2}>{o.name}</Text>
            <Text style={s.small}>{o.colour} · Already owned · £0</Text>
          </View>
        ))}
        <View style={s.card}>
          <Text style={s.h2}>Great fit. Smaller spend.</Text>
          <Text style={s.h2}>Current total: {money(outfit.totalPrice)}</Text>
          {!!notice && <Note text={notice} />}
          {!!error && <Note error text={error} />}
          <Field
            label="Make it £X"
            value={target}
            onChange={setTarget}
            number
          />
          <Button
            title={`Make it £${target || "X"}`}
            onPress={() =>
              run(() => {
                const n = validateBudget(target);
                if (!n) throw new Error("Enter a target of at least £1.");
                replace(outfitEngine.cheaper(outfit, products, n));
                analytics.track("make_cheaper_used");
              })
            }
          />
          <Button
            title="Make it cheaper"
            secondary
            onPress={() =>
              run(() => {
                replace(outfitEngine.cheaper(outfit, products));
                analytics.track("make_cheaper_used");
              })
            }
          />
          <Button
            title="Find an upgrade"
            secondary
            onPress={() =>
              run(() => {
                replace(outfitEngine.upgrade(outfit, products));
                analytics.track("upgrade_used");
              })
            }
          />
        </View>
        <Button
          title={working ? "Saving…" : "Save outfit ♡"}
          disabled={working}
          onPress={() =>
            run(async () => {
              setWorking(true);
              try {
                await onSave(outfit);
                setNotice("Saved on this device. Find it in Saved.");
                analytics.track("outfit_saved");
              } finally {
                setWorking(false);
              }
            })
          }
        />
        <Button
          title="Share outfit ↗"
          secondary
          onPress={() => setShareOpen(true)}
        />
        <Button
          title="Copy this style"
          secondary
          onPress={() =>
            run(async () => {
              await onCopyStyle(outfit);
              setNotice(
                "Saved this outfit’s style and colour direction to your profile.",
              );
            })
          }
        />
        <Button
          title="Read outfit aloud"
          secondary
          onPress={() => run(() => speech.speakOutfit(outfit))}
        />
        <Button
          title="Check availability & deadline"
          secondary
          onPress={() => run(check)}
        />
      </Page>
      <Modal
        visible={!!category}
        animationType="slide"
        onRequestClose={() => setCategory(null)}
      >
        <Page inset>
          <Button
            title="← Back to outfit"
            secondary
            onPress={() => setCategory(null)}
          />
          <Title
            title="A fresh alternative."
            body="Every option fits your selected size, preferences and remaining budget."
          />
          {!!error && <Note error text={error} />}
          <Field
            label="Search name or brand"
            value={query.text ?? ""}
            onChange={(text) => setQuery({ ...query, text })}
          />
          <Chips
            options={[
              "Best Match",
              "Cheapest",
              "Fastest Delivery",
              "Best Value",
            ]}
            values={[query.sort!]}
            onChange={(sort) =>
              setQuery({ ...query, sort: sort as SearchQuery["sort"] })
            }
          />
          <Field
            label="Maximum item price (£, optional)"
            value={
              query.maxPrice === undefined ? "" : String(query.maxPrice / 100)
            }
            onChange={(v) =>
              setQuery({
                ...query,
                maxPrice: v ? Math.round(Number(v) * 100) : undefined,
              })
            }
            number
          />
          <Chips
            options={["Any colour", "Black", "White", "Navy", "Beige", "Olive"]}
            values={[query.colour ?? "Any colour"]}
            onChange={(c) =>
              setQuery({ ...query, colour: c === "Any colour" ? undefined : c })
            }
          />
          <Chips
            options={[
              "All retailers",
              ...new Set(products.map((p) => p.retailer)),
            ]}
            values={[query.retailer ?? "All retailers"]}
            onChange={(retailer) =>
              setQuery({
                ...query,
                retailer: retailer === "All retailers" ? undefined : retailer,
              })
            }
          />
          <Chips
            options={["Any rating", "4+ stars"]}
            values={[query.rating ? "4+ stars" : "Any rating"]}
            onChange={(v) =>
              setQuery({ ...query, rating: v === "4+ stars" ? 4 : undefined })
            }
          />
          <Chips
            options={["Any delivery", "Verified only"]}
            values={[query.verifiedOnly ? "Verified only" : "Any delivery"]}
            onChange={(v) =>
              setQuery({
                ...query,
                verifiedOnly: v === "Verified only",
                deadline: outfit.request.deadline,
                location: outfit.request.location,
              })
            }
          />
          {!candidates.length && (
            <Note text="No alternatives match these filters. Clear the filters or adjust your outfit budget." />
          )}
          {candidates.map((p) => (
            <View key={p.id} style={{ gap: 10 }}>
              <ProductCard
                product={p}
                request={outfit.request}
                onOpen={() => run(() => open(p))}
              />
              <Button
                title={`Choose ${p.name}`}
                onPress={() =>
                  run(async () => {
                    if (
                      !(await provider.availability(
                        p.id,
                        outfit.request.profile.sizes[p.category],
                      ))
                    )
                      throw new Error("This size is no longer available.");
                    const fresh = await provider.getProduct(p.id);
                    if (!fresh) throw new Error("Product unavailable.");
                    replace(outfitEngine.swap(outfit, fresh));
                    setCategory(null);
                    analytics.track("product_swapped", { productId: p.id });
                  })
                }
              />
            </View>
          ))}
        </Page>
      </Modal>
      <Modal
        visible={!!detail}
        animationType="slide"
        onRequestClose={() => setDetail(null)}
      >
        <Page inset>
          <Button
            title="Close sample details"
            secondary
            onPress={() => setDetail(null)}
          />
          {detail && (
            <>
              <Garment
                category={detail.category}
                colour={detail.colours[0]}
                size={260}
              />
              <Title
                eyebrow="DEMO PRODUCT"
                title={detail.name}
                body={detail.description}
              />
              <Text style={s.h2}>{money(detail.price)} · sample price</Text>
              <Text style={s.body}>
                {detail.material} · Sizes: {detail.availableSizes.join(", ")}
              </Text>
              <Note text="This is a fictional catalogue entry, so there is no retailer product link. Live providers must supply a real HTTPS listing, current price and availability before shopping is enabled." />
            </>
          )}
        </Page>
      </Modal>
      <Modal
        visible={shareOpen}
        animationType="slide"
        onRequestClose={() => setShareOpen(false)}
      >
        <Page inset>
          <Button
            secondary
            title="Close share card"
            onPress={() => setShareOpen(false)}
          />
          <View
            ref={shareCard}
            collapsable={false}
            style={[s.card, { backgroundColor: "#F0F0F2", padding: 26 }]}
          >
            <Text style={[s.h2, { letterSpacing: 2 }]}>FITFIND</Text>
            <Title
              title={outfit.name}
              body={`${outfit.request.occasion} · ${outfit.request.profile.styles.join(" / ")}`}
            />
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {outfit.products.map((p) => (
                <Garment
                  key={p.id}
                  category={p.category}
                  colour={p.colours[0]}
                  size={110}
                />
              ))}
            </View>
            {outfit.products.map((p) => (
              <View key={p.id} style={s.row}>
                <Text style={[s.body, { flex: 1 }]}>{p.name}</Text>
                <Text style={s.label}>{money(p.price)}</Text>
              </View>
            ))}
            {outfit.request.owned.map((item) => (
              <View key={item.id} style={s.row}>
                <Text style={[s.body, { flex: 1 }]}>{item.name}</Text>
                <Text style={s.label}>Owned · £0</Text>
              </View>
            ))}
            <Text style={s.title}>{money(outfit.totalPrice)}</Text>
            <Text style={s.small}>
              DEMO OUTFIT · Sample prices · Delivery not verified
            </Text>
          </View>
          <Text style={s.small}>
            {Platform.OS === "web"
              ? "Screenshot this card, or share its item list."
              : "Share this card as a PNG image, or send the item list."}{" "}
            Your name, sizes and location are excluded.
          </Text>
          {!!error && <Note error text={error} />}
          {Platform.OS !== "web" && (
            <Button
              title={sharingImage ? "Preparing image…" : "Share outfit image"}
              disabled={sharingImage}
              onPress={() => run(shareImage)}
            />
          )}
          <Button
            title="Share item list"
            onPress={() =>
              run(async () => {
                const message = shareText(outfit);
                if (
                  Platform.OS === "web" &&
                  typeof navigator !== "undefined" &&
                  !navigator.share
                ) {
                  await navigator.clipboard.writeText(message);
                  setShareOpen(false);
                  setNotice("Outfit item list copied to clipboard.");
                  analytics.track("outfit_shared");
                } else {
                  const result = await Share.share({
                    title: "My FitFind outfit",
                    message,
                  });
                  if (result.action === Share.sharedAction)
                    analytics.track("outfit_shared");
                }
              })
            }
          />
        </Page>
      </Modal>
    </>
  );
}
