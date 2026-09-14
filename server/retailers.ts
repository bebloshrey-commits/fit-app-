type FeedConfig = { retailer: string; url: string };

export const TARGET_RETAILERS = [
  { name: "UNIQLO", status: "feed-required" },
  { name: "Zara", status: "feed-required" },
  { name: "Pull&Bear", status: "feed-required" },
] as const;

const integer = (value: unknown) =>
  Number.isSafeInteger(value) && Number(value) >= 0;

/** Fail closed: a live item is recommendable only when its complete payable
 * cost, stock, selected sizes and delivery evidence are supplied by a feed. */
export function validLiveProduct(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    p.source === "live" &&
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.retailer === "string" &&
    typeof p.productUrl === "string" &&
    p.productUrl.startsWith("https://") &&
    p.currency === "GBP" &&
    integer(p.price) &&
    integer(p.deliveryCost) &&
    p.taxIncluded === true &&
    integer(p.taxAmount) &&
    integer(p.mandatoryFees) &&
    typeof p.costVerifiedAt === "string" &&
    !Number.isNaN(Date.parse(p.costVerifiedAt)) &&
    Array.isArray(p.availableSizes) &&
    p.availableSizes.length > 0 &&
    p.availability === true &&
    p.stockStatus === "in_stock" &&
    !!p.deliveryEstimate &&
    typeof p.deliveryEstimate === "object" &&
    (p.deliveryEstimate as Record<string, unknown>).verified === true
  );
}

function configuredFeeds(): FeedConfig[] {
  const raw = process.env.RETAILER_FEEDS_JSON;
  if (!raw) return [];
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed))
    throw new Error("RETAILER_FEEDS_JSON must be an array");
  return parsed.filter(
    (x): x is FeedConfig =>
      !!x &&
      typeof x === "object" &&
      typeof (x as FeedConfig).retailer === "string" &&
      typeof (x as FeedConfig).url === "string" &&
      (x as FeedConfig).url.startsWith("https://"),
  );
}

export async function searchApprovedFeeds(params: URLSearchParams) {
  const feeds = configuredFeeds();
  const results = await Promise.allSettled(
    feeds.map(async ({ retailer, url }) => {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(8_000),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`${retailer} feed unavailable`);
      const body = (await response.json()) as unknown;
      if (!Array.isArray(body))
        throw new Error(`${retailer} feed is not an array`);
      return body.filter(validLiveProduct);
    }),
  );
  const products = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );
  const text = params.get("text")?.toLowerCase();
  const id = params.get("id");
  const size = params.get("size");
  const category = params.get("category");
  const retailer = params.get("retailer");
  const style = params.get("style");
  const maxPrice = Number(params.get("maxPrice") ?? Number.MAX_SAFE_INTEGER);
  return products.filter((product) => {
    const p = product as Record<string, any>;
    const payable = p.price + p.deliveryCost + p.taxAmount + p.mandatoryFees;
    return (
      (!id || p.id === id) &&
      (!text ||
        `${p.name} ${p.brand} ${p.description}`.toLowerCase().includes(text)) &&
      (!size || p.availableSizes.includes(size)) &&
      (!category || p.category === category) &&
      (!retailer || p.retailer === retailer) &&
      (!style || p.styleTags.includes(style)) &&
      payable <= maxPrice
    );
  });
}
