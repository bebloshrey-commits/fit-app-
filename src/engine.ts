import {
  BuildRequest,
  Category,
  OCCASIONS,
  Outfit,
  Product,
  Scores,
} from "./models";
import { deliveryEngine } from "./services/delivery";
export const WEIGHTS = {
  occasion: 0.25,
  style: 0.2,
  colour: 0.15,
  budget: 0.15,
  delivery: 0.15,
  weather: 0.05,
  versatility: 0.05,
};
export const money = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    pence / 100,
  );
export const productCost = (p: Product) =>
  p.price + (p.deliveryCost ?? 0) + (p.taxAmount ?? 0) + (p.mandatoryFees ?? 0);
/** Delivery is charged once per retailer order. Use the highest quoted charge
 * when a provider repeats an order-level delivery quote on each product. */
export const outfitTotal = (products: Product[]) => {
  const deliveryByRetailer = new Map<string, number>();
  for (const product of products) {
    deliveryByRetailer.set(
      product.retailer,
      Math.max(
        deliveryByRetailer.get(product.retailer) ?? 0,
        product.deliveryCost ?? 0,
      ),
    );
  }
  return (
    products.reduce(
      (total, product) =>
        total +
        product.price +
        (product.taxAmount ?? 0) +
        (product.mandatoryFees ?? 0),
      0,
    ) +
    [...deliveryByRetailer.values()].reduce((total, cost) => total + cost, 0)
  );
};
export const checkoutBreakdown = (products: Product[]) => ({
  items: products.reduce((total, product) => total + product.price, 0),
  delivery: [
    ...products
      .reduce((costs, product) => {
        costs.set(
          product.retailer,
          Math.max(costs.get(product.retailer) ?? 0, product.deliveryCost ?? 0),
        );
        return costs;
      }, new Map<string, number>())
      .values(),
  ].reduce((total, cost) => total + cost, 0),
  tax: products.reduce((total, product) => total + (product.taxAmount ?? 0), 0),
  fees: products.reduce(
    (total, product) => total + (product.mandatoryFees ?? 0),
    0,
  ),
});
export function validateBudget(v: string): number | undefined {
  if (!/^\d+(\.\d{1,2})?$/.test(v.trim())) return;
  const n = Math.round(Number(v) * 100);
  return n >= 100 && n <= 1000000 ? n : undefined;
}
export class OutfitError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
const brands = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
export function eligible(p: Product, r: BuildRequest): boolean {
  const status = deliveryEngine.evaluate(p, r.deadline, r.location);
  return (
    p.availability &&
    p.stockStatus !== "out_of_stock" &&
    p.currency === "GBP" &&
    p.region === "GB" &&
    Number.isSafeInteger(p.price) &&
    p.price >= 0 &&
    (p.deliveryCost === null ||
      (Number.isSafeInteger(p.deliveryCost) && p.deliveryCost >= 0)) &&
    (p.source === "demo" ||
      (p.deliveryCost !== null &&
        p.taxIncluded === true &&
        p.taxAmount !== null &&
        p.taxAmount !== undefined &&
        p.mandatoryFees !== null &&
        p.mandatoryFees !== undefined &&
        !!p.costVerifiedAt &&
        !!p.productUrl?.startsWith("https://"))) &&
    p.availableSizes.includes(r.profile.sizes[p.category]) &&
    !p.colours.some((c) => r.profile.avoidColours.includes(c)) &&
    !brands(r.profile.avoidBrands).includes(p.brand.toLowerCase()) &&
    (!OCCASIONS.includes(r.occasion) || p.occasionTags.includes(r.occasion)) &&
    (!r.profile.styles.length ||
      r.profile.styles.some((s) => p.styleTags.includes(s))) &&
    status !== "UNAVAILABLE_BEFORE_DEADLINE" &&
    (!r.requireVerifiedDelivery || status !== "DELIVERY_UNCONFIRMED")
  );
}
function itemScore(p: Product, r: BuildRequest): Omit<Scores, "overallScore"> {
  const preferred = [...r.profile.colours, ...r.owned.map((o) => o.colour)];
  const neutral = p.colours.some((c) =>
    ["Black", "White", "Grey", "Navy", "Beige"].includes(c),
  );
  const signature = r.profile.styles.some((style) =>
    style === "Minimal" || style === "Clean"
      ? /pocket|polo|chinos|court|overshirt/i.test(p.name)
      : style === "Streetwear"
        ? /relaxed|wide-leg|court|cap/i.test(p.name)
        : style === "Formal" || style === "Smart casual"
          ? /Oxford|tailored|loafers|blazer/i.test(p.name)
          : /linen|canvas|cotton/i.test(p.name),
  );
  return {
    styleScore: r.profile.styles.length
      ? ((signature ? 100 : 80) *
          r.profile.styles.filter((s) => p.styleTags.includes(s)).length) /
        r.profile.styles.length
      : 70,
    occasionScore: p.occasionTags.includes(r.occasion) ? 100 : 45,
    colourScore: p.colours.some((c) => preferred.includes(c))
      ? 100
      : neutral
        ? 75
        : 45,
    weatherScore: !r.weather
      ? 50
      : r.weather.rainProbability > 50
        ? /shell|derbies/.test(p.name)
          ? 100
          : /canvas|linen/i.test(p.name)
            ? 20
            : 60
        : r.weather.temperature > 22
          ? /linen|shorts|tee/i.test(p.name)
            ? 100
            : 50
          : /jacket|knit|overshirt/i.test(p.name)
            ? 100
            : 60,
    deliveryScore:
      deliveryEngine.evaluate(p, r.deadline, r.location) ===
      "DELIVERY_UNCONFIRMED"
        ? 0
        : 100,
    versatilityScore: Math.min(
      100,
      p.occasionTags.length * 13 +
        (brands(r.profile.brands).includes(p.brand.toLowerCase()) ? 10 : 0),
    ),
  };
}
export function score(products: Product[], r: BuildRequest): Scores {
  const sums: Omit<Scores, "overallScore"> = {
    styleScore: 0,
    occasionScore: 0,
    colourScore: 0,
    weatherScore: 0,
    deliveryScore: 0,
    versatilityScore: 0,
  };
  products.forEach((p) => {
    const s = itemScore(p, r);
    (Object.keys(sums) as (keyof typeof sums)[]).forEach(
      (k) => (sums[k] += s[k] / products.length),
    );
  });
  if (!products.length)
    Object.keys(sums).forEach((k) => (sums[k as keyof typeof sums] = 100));
  const colourCount = new Set([
    ...products.flatMap((p) => p.colours),
    ...r.owned.map((o) => o.colour),
  ]).size;
  sums.colourScore = Math.max(
    0,
    sums.colourScore - Math.max(0, colourCount - 3) * 15,
  );
  const budgetScore = outfitTotal(products) <= r.budget ? 100 : 0;
  return {
    ...sums,
    overallScore:
      sums.occasionScore * WEIGHTS.occasion +
      sums.styleScore * WEIGHTS.style +
      sums.colourScore * WEIGHTS.colour +
      budgetScore * WEIGHTS.budget +
      sums.deliveryScore * WEIGHTS.delivery +
      sums.weatherScore * WEIGHTS.weather +
      sums.versatilityScore * WEIGHTS.versatility,
  };
}
export function materialize(
  products: Product[],
  request: BuildRequest,
  variant: Outfit["variant"] = "Best Overall",
): Outfit {
  const totalPrice = outfitTotal(products);
  if (totalPrice > request.budget)
    throw new OutfitError("budget", "The outfit exceeds your maximum budget.");
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `${request.profile.styles[0] ?? "Everyday"} ${request.occasion.toLowerCase()}`,
    products: products.map((p) => ({
      ...p,
      selectedSize: request.profile.sizes[p.category],
    })),
    totalPrice,
    budgetRemaining: request.budget - totalPrice,
    request: JSON.parse(JSON.stringify(request)),
    variant,
    createdAt: new Date().toISOString(),
    ...score(products, request),
  };
}
export class OutfitGenerationService {
  generate(products: Product[], r: BuildRequest): Outfit[] {
    if (!Number.isSafeInteger(r.budget) || r.budget < 100)
      throw new OutfitError("budget", "Enter a valid budget of at least £1.");
    const categories = r.categories.filter(
      (c) => !r.owned.some((o) => o.category === c),
    );
    if (!categories.length) return [materialize([], r)];
    const choices = categories.map((c) =>
      products
        .filter((p) => p.category === c && eligible(p, r))
        .sort((a, b) => productCost(a) - productCost(b)),
    );
    if (choices.some((c) => !c.length))
      throw new OutfitError(
        "no-match",
        r.requireVerifiedDelivery
          ? "No complete outfit has verified delivery for this location and deadline. Allow unverified estimates, use your wardrobe, or change the deadline."
          : "No complete outfit matches your sizes, occasion and preferences. Change a size or style, remove a category, use your wardrobe, or try another retailer.",
      );
    const cheapest = choices.map((c) => c[0]!);
    if (outfitTotal(cheapest) > r.budget)
      throw new OutfitError(
        "budget",
        `The lowest matching item total is ${money(outfitTotal(cheapest))}. Increase your budget, remove a category, or use what you own.`,
      );
    // Reserve the minimum cost of remaining categories so pruning cannot lose feasibility.
    let beam: Product[][] = [[]];
    choices.forEach((list, index) => {
      const reserve = outfitTotal(cheapest.slice(index + 1));
      beam = beam.flatMap((part) =>
        list
          .filter(
            (p) => outfitTotal(part) + productCost(p) + reserve <= r.budget,
          )
          .map((p) => [...part, p]),
      );
      beam.sort((a, b) => score(b, r).overallScore - score(a, r).overallScore);
      beam = beam.slice(0, 180);
    });
    const best = beam[0] ?? cheapest;
    const stylish =
      [...beam]
        .sort((a, b) => {
          const x = score(a, r),
            y = score(b, r);
          return (
            y.styleScore +
              y.colourScore +
              y.occasionScore -
              (x.styleScore + x.colourScore + x.occasionScore) ||
            y.overallScore - x.overallScore
          );
        })
        .find(
          (p) => p.map((x) => x.id).join() !== best.map((x) => x.id).join(),
        ) ?? best;
    return [
      materialize(best, r),
      materialize(cheapest, r, "Cheapest"),
      materialize(stylish, r, "Most Stylish"),
    ];
  }
  alternatives(
    outfit: Outfit,
    category: Category,
    products: Product[],
  ): Product[] {
    const rest = outfit.products.filter((p) => p.category !== category);
    return products
      .filter(
        (p) =>
          p.category === category &&
          eligible(p, outfit.request) &&
          !outfit.products.some((x) => x.id === p.id) &&
          outfitTotal([...rest, p]) <= outfit.request.budget,
      )
      .sort(
        (a, b) =>
          score([...rest, b], outfit.request).overallScore -
          score([...rest, a], outfit.request).overallScore,
      );
  }
  swap(outfit: Outfit, product: Product): Outfit {
    if (
      !outfit.products.some((p) => p.category === product.category) ||
      !eligible(product, outfit.request)
    )
      throw new OutfitError(
        "unavailable",
        "This product or selected size is no longer available. Choose another alternative.",
      );
    return materialize(
      outfit.products.map((p) =>
        p.category === product.category ? product : p,
      ),
      outfit.request,
    );
  }
  cheaper(
    outfit: Outfit,
    products: Product[],
    target = outfit.totalPrice - 1,
  ): Outfit {
    if (
      !Number.isSafeInteger(target) ||
      target < 100 ||
      target > outfit.request.budget
    )
      throw new OutfitError(
        "budget",
        "Choose a target between £1 and your original budget.",
      );
    const r = { ...outfit.request, budget: target };
    let current = [...outfit.products];
    while (outfitTotal(current) > target) {
      const swaps = current.flatMap((old) =>
        products
          .filter(
            (p) =>
              p.category === old.category &&
              eligible(p, r) &&
              productCost(p) < productCost(old),
          )
          .map((p) => ({
            next: current.map((x) => (x.id === old.id ? p : x)),
            saving: productCost(old) - productCost(p),
          })),
      );
      // Prefer minimal styling loss per pound saved; do not replace everything blindly.
      swaps.sort(
        (a, b) =>
          (score(b.next, r).overallScore - score(current, r).overallScore) /
            b.saving -
          (score(a.next, r).overallScore - score(current, r).overallScore) /
            a.saving,
      );
      if (!swaps[0])
        throw new OutfitError(
          "budget",
          "No cheaper complete outfit matches these constraints. Use an owned item or remove a category.",
        );
      current = swaps[0].next;
    }
    return materialize(current, r);
  }
  upgrade(outfit: Outfit, products: Product[]): Outfit {
    const options = outfit.products
      .flatMap((p) =>
        this.alternatives(outfit, p.category, products)
          .filter((a) => productCost(a) > productCost(p))
          .map((a) => this.swap(outfit, a)),
      )
      .filter(
        (o) =>
          o.overallScore > outfit.overallScore ||
          o.styleScore > outfit.styleScore ||
          o.colourScore > outfit.colourScore ||
          o.versatilityScore > outfit.versatilityScore,
      );
    options.sort((a, b) => b.overallScore - a.overallScore);
    if (!options[0])
      throw new OutfitError(
        "no-upgrade",
        "No better matching upgrade fits your budget. Your current outfit is the stronger choice.",
      );
    return options[0];
  }
}
export const outfitEngine = new OutfitGenerationService();
export function describeChanges(a: Outfit, b: Outfit): string {
  return (
    a.products
      .flatMap((p) => {
        const q = b.products.find((x) => x.category === p.category);
        return q && q.id !== p.id
          ? [
              `Swapped ${p.name} (${money(p.price)}) for ${q.name} (${money(q.price)}).`,
            ]
          : [];
      })
      .join(" ") + ` New total: ${money(b.totalPrice)}.`
  );
}
