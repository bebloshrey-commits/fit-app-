// Server-only execution: node --experimental-strip-types server/server.ts
import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { searchApprovedFeeds, TARGET_RETAILERS } from "./retailers.ts";
const port = Number(process.env.PORT ?? 8787);
const token = process.env.SERVER_ACCESS_TOKEN;
const key = process.env.AI_API_KEY;
const openWeatherKey = process.env.OPENWEATHER_API_KEY;
const channel3Key = process.env.CHANNEL3_API_KEY;
const aiModel = process.env.AI_MODEL ?? "gpt-4o-mini";
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
      weatherCredentialsConfigured: Boolean(openWeatherKey),
      channel3Configured: Boolean(channel3Key),
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
      if (!key) {
        send(200, { provider: "deterministic", explanation: `Selected for ${input.occasion}: coordinate a restrained palette and balance the silhouette across your chosen pieces. Product costs, stock and delivery are verified separately by deterministic services.` });
        return;
      }
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: aiModel, temperature: 0.4, max_tokens: 120, messages: [
          { role: "system", content: "You are FitFind's concise personal stylist. Explain the outfit in two friendly sentences. Do not invent prices, stock, delivery, or weather." },
          { role: "user", content: JSON.stringify({ occasion: input.occasion, styles: input.styles, items: input.items }) },
        ] }),
        signal: AbortSignal.timeout(8000),
      });
      if (!aiResponse.ok) throw Error("AI provider unavailable");
      const aiJson = await aiResponse.json();
      const explanation = aiJson.choices?.[0]?.message?.content;
      if (typeof explanation !== "string" || !explanation.trim()) throw Error("Empty AI response");
      send(200, { provider: "openai", explanation: explanation.trim() });
    } catch (error) {
      if (error instanceof SyntaxError) {
        send(400, { error: "Invalid request" });
      } else {
        send(502, { error: "AI provider is temporarily unavailable." });
      }
    }
    return;
  }
  if (req.url?.startsWith("/weather")) {
    if (!openWeatherKey) { send(200, null); return; }
    try {
      const requestUrl = new URL(req.url, "http://localhost");
      const location = requestUrl.searchParams.get("location")?.trim();
      if (!location) { send(400, { error: "Location is required" }); return; }
      const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${encodeURIComponent(openWeatherKey)}`, { signal: AbortSignal.timeout(5000) });
      if (!weatherResponse.ok) { send(502, null); return; }
      const weather = await weatherResponse.json();
      const rain = Number(weather.rain?.["1h"] ?? weather.rain?.["3h"] ?? 0);
      send(200, { temperature: Number(weather.main?.temp ?? 0), feelsLike: Number(weather.main?.feels_like ?? 0), rainProbability: rain > 0 ? 100 : 0, precipitation: rain, wind: Number(weather.wind?.speed ?? 0), condition: String(weather.weather?.[0]?.main ?? "Unknown") });
    } catch { send(502, null); }
    return;
  }
  send(404, { error: "Not found" });
});
// Local development only. Put authenticated TLS ingress and per-user rate limits in front of a deployment.
server.listen(port, "127.0.0.1", () =>
  console.log(`FitFind API: http://127.0.0.1:${port} (local development)`),
);
