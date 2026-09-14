import { Weather } from "../models";
export interface WeatherService {
  getWeather(location: string, date: string | null): Promise<Weather | null>;
}
export class UnavailableWeatherService implements WeatherService {
  async getWeather() {
    return null;
  }
}
export class ApiWeatherService implements WeatherService {
  private cache = new Map<string, { expires: number; value: Weather | null }>();
  constructor(private baseUrl: string) {}
  async getWeather(
    location: string,
    date: string | null,
  ): Promise<Weather | null> {
    const key = `${location}:${date}`;
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.value;
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?location=${encodeURIComponent(location)}&date=${date ?? ""}`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (!response.ok) return null;
      const value = await response.json();
      this.cache.set(key, { expires: Date.now() + 900000, value });
      return value;
    } catch {
      return null;
    }
  }
}
