// Server-only execution: node --experimental-strip-types server/server.ts
import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { searchApprovedFeeds, TARGET_RETAILERS } from "./retailers.ts";
const port = Number(process.env.PORT ?? 8787);
const token = process.env.SERVER_ACCESS_TOKEN;
const key = process.env.AI_API_KEY;
const equal = (a: string, b: string) =>
  Buffer.byteLength(a) === Buffer.byteLength(b) &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));
const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  const send = (status: number, body: unknown) => {
    res.statusCode = status;
    res.end(JSON.stringify(body));
  };
  if (req.url === "/health") {
    send(200, {
      ok: true,
      mode: "mock",
      aiCredentialsConfigured: Boolean(key),
      products: "not-connected",
      retailers: TARGET_RETAILERS,
    });
    return;
  }
  // Product catalogue data is public. Source credentials remain server-side.
  if (req.url?.startsWith("/products") && req.method === "GET") {
    try {
      const requestUrl = new URL(req.url, "http://localhost");
      const products = await searchApprovedFeeds(requestUrl.searchParams);
      if (!process.env.RETAILER_FEEDS_JSON) {
        send(503, {
          error: "No approved retailer feed configured. Use demo inventory.",
          retailers: TARGET_RETAILERS,
        });
        return;
      }
      send(200, products);
    } catch {
      send(502, { error: "Retailer feeds are temporarily unavailable." });
    }
    return;
  }
  if (!token || !equal(req.headers.authorization ?? "", `Bearer ${token}`)) {
    send(401, {
      error: "Configure a server access token and supply authorization.",
    });
    return;
  }
  if (req.url === "/style" && req.method === "POST") {
    try {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 16384) {
          send(413, { error: "Request too large" });
          return;
        }
      }
      const input = JSON.parse(raw);
      if (
        typeof input.occasion !== "string" ||
        input.occasion.length > 100 ||
        !Array.isArray(input.styles) ||
        !Array.isArray(input.items) ||
        input.items.length > 5 ||
        input.items.some(
          (x: unknown) =>
            !x || typeof (x as { name?: unknown }).name !== "string",
        )
      ) {
        send(400, { error: "Invalid styling request" });
        return;
      }
      // Deterministic fallback is a fully working offline boundary. No provider-specific secret enters the client.
      send(200, {
        provider: "deterministic",
        explanation: `Selected for ${input.occasion}: coordinate a restrained palette and balance the silhouette across your chosen pieces. Product costs, stock and delivery are verified separately by deterministic services.`,
      });
    } catch {
      send(400, { error: "Invalid request" });
    }
    return;
  }
  if (req.url?.startsWith("/weather")) {
    send(200, null);
    return;
  }
  send(404, { error: "Not found" });
});
// Local development only. Put authenticated TLS ingress and per-user rate limits in front of a deployment.
server.listen(port, "127.0.0.1", () =>
  console.log(`FitFind API: http://127.0.0.1:${port} (local development)`),
);
