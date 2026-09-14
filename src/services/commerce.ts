import { money } from "../engine";
import { Outfit, Product } from "../models";
export function retailerUrl(p: Product): string | null {
  if (p.source === "demo") return null;
  const link = p.affiliateUrl ?? p.productUrl;
  try {
    return link && new URL(link).protocol === "https:" ? link : null;
  } catch {
    return null;
  }
}
export function shareText(o: Outfit): string {
  return [
    "FITFIND",
    o.name,
    `${o.request.occasion} · ${o.request.profile.styles.join(", ")}`,
    ...o.products.map((p) => `${p.name} — ${money(p.price)}`),
    ...o.request.owned
      .filter((x) => o.request.categories.includes(x.category))
      .map((x) => `${x.name} — already owned`),
    `Total including known shipping: ${money(o.totalPrice)}`,
    o.products.some((p) => p.source === "demo")
      ? "DEMO outfit • Sample prices, not live inventory."
      : "Recheck price, stock and delivery with each retailer.",
    "Delivery and unknown shipping are not verified.",
  ].join("\n");
}
