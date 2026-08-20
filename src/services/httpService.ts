export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 12_000
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...init.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Veri sağlayıcısı HTTP ${response.status} döndürdü.`
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      throw new Error('Veri sağlayıcısı zaman aşımına uğradı.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function isValidCoordinate(
  latitude: number,
  longitude: number
): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function normalizeRadius(radiusKm: number): number {
  if (!Number.isFinite(radiusKm)) return 10;
  return Math.min(100, Math.max(1, radiusKm));
}
