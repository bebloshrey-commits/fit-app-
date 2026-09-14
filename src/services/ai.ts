import { Outfit } from "../models";
export interface AIProvider {
  explain(outfit: Outfit): Promise<string>;
}
export class MockAIProvider implements AIProvider {
  async explain(o: Outfit) {
    return `${o.request.profile.styles.join(" / ")} pieces selected for ${o.request.occasion.toLowerCase()}, with compatible colours and your selected sizes. ${o.request.weather ? "Weather was included in ranking." : "Weather is unavailable; check local conditions."}`;
  }
}
export class BackendAIProvider implements AIProvider {
  constructor(
    private baseUrl: string,
    private token: () => Promise<string>,
  ) {}
  async explain(outfit: Outfit) {
    try {
      const r = await fetch(`${this.baseUrl}/style`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.token()}`,
        },
        body: JSON.stringify({
          occasion: outfit.request.occasion,
          styles: outfit.request.profile.styles,
          items: outfit.products.map((p) => ({
            name: p.name,
            colours: p.colours,
          })),
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw Error();
      return (await r.json()).explanation as string;
    } catch {
      return new MockAIProvider().explain(outfit);
    }
  }
}
