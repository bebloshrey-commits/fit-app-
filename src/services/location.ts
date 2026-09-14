export interface LocationAdapter {
  requestForegroundPermissionsAsync(): Promise<{ status: string }>;
  getCurrentPositionAsync(options: {
    accuracy: number;
  }): Promise<{ coords: { latitude: number; longitude: number } }>;
  reverseGeocodeAsync(coords: {
    latitude: number;
    longitude: number;
  }): Promise<{ city?: string | null; region?: string | null }[]>;
}
export async function resolveLocation(
  adapter: LocationAdapter,
): Promise<{ location?: string; message?: string }> {
  const permission = await adapter.requestForegroundPermissionsAsync();
  if (permission.status !== "granted")
    return {
      message: "Location permission denied. Enter a city or postcode manually.",
    };
  const position = await adapter.getCurrentPositionAsync({ accuracy: 3 });
  const places = await adapter.reverseGeocodeAsync(position.coords);
  const location = places[0]?.city ?? places[0]?.region;
  return location
    ? { location }
    : { message: "Could not identify your city. Enter it manually." };
}
export async function safeLocation(
  adapter: LocationAdapter,
): Promise<{ location?: string; message?: string }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      resolveLocation(adapter),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), 10000);
      }),
    ]);
  } catch {
    return {
      message: "Location is unavailable. Enter a city or postcode manually.",
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
