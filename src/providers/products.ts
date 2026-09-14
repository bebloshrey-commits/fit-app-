import { DEMO_CATALOG } from "../catalog";
import { Category, Product } from "../models";
import { deliveryEngine } from "../services/delivery";
export interface SearchQuery {
  category?: Category;
  text?: string;
  maxPrice?: number;
  retailer?: string;
  size?: string;
  colour?: string;
  style?: string;
  rating?: number;
  deadline?: string | null;
  location?: string;
  verifiedOnly?: boolean;
  sort?: "Best Match" | "Cheapest" | "Fastest Delivery" | "Best Value";
}
export interface ProductProvider {
  search(query: SearchQuery): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  availability(id: string, size: string): Promise<boolean>;
  delivery(id: string): Promise<Product["deliveryEstimate"]>;
}
export function filterProducts(products: Product[], q: SearchQuery): Product[] {
  const result = products.filter(
    (p) =>
      p.availability &&
      (!q.category || p.category === q.category) &&
      (!q.text ||
        `${p.name} ${p.brand}`.toLowerCase().includes(q.text.toLowerCase())) &&
      (q.maxPrice === undefined ||
        p.price + (p.deliveryCost ?? 0) <= q.maxPrice) &&
      (!q.retailer || p.retailer === q.retailer) &&
      (!q.size || p.availableSizes.includes(q.size)) &&
      (!q.colour || p.colours.includes(q.colour)) &&
      (!q.style || p.styleTags.includes(q.style)) &&
      (!q.rating || (p.rating ?? 0) >= q.rating) &&
      (!q.verifiedOnly ||
        !["DELIVERY_UNCONFIRMED", "UNAVAILABLE_BEFORE_DEADLINE"].includes(
          deliveryEngine.evaluate(p, q.deadline ?? null, q.location ?? ""),
        )),
  );
  return result.sort((a, b) =>
    q.sort === "Fastest Delivery"
      ? (a.deliveryEstimate?.verified
          ? Date.parse(a.deliveryEstimate.latestArrival)
          : Infinity) -
        (b.deliveryEstimate?.verified
          ? Date.parse(b.deliveryEstimate.latestArrival)
          : Infinity)
      : q.sort === "Best Value"
        ? (b.rating ?? 0) / b.price - (a.rating ?? 0) / a.price
        : q.sort === "Cheapest"
          ? a.price + (a.deliveryCost ?? 0) - (b.price + (b.deliveryCost ?? 0))
          : 0,
  );
}
export class DemoProductProvider implements ProductProvider {
  constructor(private products = DEMO_CATALOG) {}
  async search(q: SearchQuery) {
    return filterProducts(this.products, q);
  }
  async getProduct(id: string) {
    return this.products.find((p) => p.id === id) ?? null;
  }
  async availability(id: string, size: string) {
    const p = await this.getProduct(id);
    return !!p?.availability && p.availableSizes.includes(size);
  }
  async delivery(id: string) {
    return (await this.getProduct(id))?.deliveryEstimate ?? null;
  }
}
export class ApiProductProvider implements ProductProvider {
  constructor(
    private baseUrl: string,
    private accessToken?: () => Promise<string>,
  ) {
    if (!baseUrl.startsWith("https://"))
      throw new Error("Live products require HTTPS");
  }
  private async get(path: string) {
    const token = await this.accessToken?.();
    const r = await fetch(this.baseUrl + path, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok)
      throw new Error(
        "Retailer unavailable. Retry or switch to demo inventory.",
      );
    return r.json();
  }
  async search(q: SearchQuery): Promise<Product[]> {
    return this.get(
      "/products?" +
        new URLSearchParams(
          Object.entries(q)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        ),
    );
  }
  async getProduct(id: string): Promise<Product | null> {
    const products = (await this.get(
      "/products?id=" + encodeURIComponent(id),
    )) as Product[];
    return products[0] ?? null;
  }
  async availability(id: string, size: string) {
    const p = await this.getProduct(id);
    return !!p?.availability && p.availableSizes.includes(size);
  }
  async delivery(id: string) {
    return (await this.getProduct(id))?.deliveryEstimate ?? null;
  }
}

/** Reads normalized, retailer-approved product feeds through the FitFind API.
 * The backend owns credentials and source-specific adapters; the app only sees
 * validated products with explicit cost and fulfilment evidence. */
export class MerchantFeedProductProvider extends ApiProductProvider {}

export class FallbackProductProvider implements ProductProvider {
  constructor(
    private primary: ProductProvider,
    private fallback: ProductProvider,
  ) {}
  search(query: SearchQuery) {
    return this.primary.search(query).catch(() => this.fallback.search(query));
  }
  getProduct(id: string) {
    return this.primary
      .getProduct(id)
      .catch(() => this.fallback.getProduct(id));
  }
  availability(id: string, size: string) {
    return this.primary
      .availability(id, size)
      .catch(() => this.fallback.availability(id, size));
  }
  delivery(id: string) {
    return this.primary.delivery(id).catch(() => this.fallback.delivery(id));
  }
}
