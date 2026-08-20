export interface RegionalData {
  country: string;
  province?: string;
  district?: string;
  neighborhood?: string;
  latitude: number;
  longitude: number;
}

export async function getRegionalData(
  latitude: number,
  longitude: number
): Promise<RegionalData> {
  /*
   * İlk aşamada servis sözleşmesini kuruyoruz.
   *
   * Gerçek ters-jeokodlama servisi daha sonra
   * burada devreye alınacak.
   */

  return {
    country: 'Türkiye',
    latitude,
    longitude,
  };
}