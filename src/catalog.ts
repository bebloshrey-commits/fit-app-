import { Category, Product, SIZES } from "./models";
export { CATEGORIES, Category, Product } from "./models";
// Synthetic inventory only. No live stock, prices or fulfilment claims.
const templates: Record<Category, string[]> = {
  top: [
    "Cotton crew tee",
    "Relaxed pocket tee",
    "Oxford shirt",
    "Fine-knit polo",
    "Ribbed vest",
    "Linen camp shirt",
  ],
  bottom: [
    "Straight-leg jeans",
    "Relaxed chinos",
    "Tailored trousers",
    "Wide-leg cargos",
    "Drawstring shorts",
    "Tapered joggers",
  ],
  shoes: [
    "Canvas trainers",
    "Court sneakers",
    "Penny loafers",
    "Lace-up derbies",
  ],
  jacket: ["Cotton overshirt", "Unstructured blazer", "Lightweight rain shell"],
  accessory: ["Canvas tote", "Twill cap", "Woven belt"],
};
const palettes = ["Black", "White", "Navy", "Beige", "Olive"];
const base: Record<Category, number> = {
  top: 600,
  bottom: 950,
  shoes: 1200,
  jacket: 1700,
  accessory: 350,
};
export const DEMO_CATALOG: Product[] = (
  Object.keys(templates) as Category[]
).flatMap((category) =>
  templates[category].flatMap((name, index) =>
    palettes.map((colour, c) => {
      const formal = /Oxford|polo|Tailored|loafers|derbies|blazer|belt/.test(
        name,
      );
      const sporty = /joggers|trainers|shell|cap|vest/.test(name);
      return {
        id: `demo-${category}-${index}-${c}`,
        name: `${colour} ${name.toLowerCase()}`,
        brand: ["Form Studio", "Everyday Dept.", "North & Co."][index % 3]!,
        retailer: "FitFind Demo Studio",
        category,
        subcategory: name,
        description: `A sample ${name.toLowerCase()} for exploring outfit combinations. Illustration, price and sizes are fictional.`,
        price: base[category] + index * 350 + c * 75,
        currency: "GBP",
        originalPrice: null,
        salePrice: null,
        imageUrl: "",
        productUrl: null,
        affiliateUrl: null,
        availableSizes: [...SIZES[category]],
        colours: [colour],
        styleTags: formal
          ? ["Smart streetwear", "Smart casual", "Formal", "Preppy", "Clean", "Minimal"]
          : sporty
            ? ["Y2K", "Smart streetwear", "Sporty", "Casual", "Streetwear", "Clean", "Minimal"]
            : ["Y2K", "Smart streetwear", "Minimal", "Streetwear", "Casual", "Vintage", "Trendy", "Clean"],
        occasionTags: formal
          ? ["Work", "Wedding", "Date", "Dinner", "Night out", "Party"]
          : sporty
            ? ["Gym", "Casual", "University", "Holiday", "School"]
            : [
                "Casual",
                "Party",
                "Date",
                "University",
                "School",
                "Holiday",
                "Night out",
              ],
        genderCategory: "Unisex",
        material: /shell/.test(name)
          ? "Water-resistant polyester (demo)"
          : "Cotton blend (demo)",
        rating: null,
        reviewCount: null,
        availability: true,
        stockStatus: "unknown",
        deliveryEstimate: null,
        deliveryAvailable: null,
        deliveryCost: null,
        expressAvailable: null,
        clickAndCollectAvailable: null,
        clickAndCollectLocation: null,
        lastUpdated: "2026-09-13T00:00:00.000Z",
        source: "demo",
        region: "GB",
      } satisfies Product;
    }),
  ),
);
