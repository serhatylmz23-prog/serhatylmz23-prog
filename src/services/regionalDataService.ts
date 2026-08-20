import {
  fetchJson,
  isValidCoordinate,
} from './httpService';

export interface RegionalData {
  country: string;
  province?: string;
  district?: string;
  neighborhood?: string;
  displayName?: string;
  latitude: number;
  longitude: number;
  provider: 'OpenStreetMap Nominatim' | 'fallback';
}

interface NominatimResponse {
  display_name?: string;
  address?: {
    country?: string;
    province?: string;
    state?: string;
    city?: string;
    town?: string;
    county?: string;
    district?: string;
    municipality?: string;
    suburb?: string;
    neighbourhood?: string;
    village?: string;
  };
}

export async function getRegionalData(
  latitude: number,
  longitude: number
): Promise<RegionalData> {
  if (!isValidCoordinate(latitude, longitude)) {
    throw new Error('Geçersiz enlem veya boylam değeri.');
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: latitude.toString(),
    lon: longitude.toString(),
    zoom: '18',
    addressdetails: '1',
    'accept-language': 'tr',
  });

  try {
    const data = await fetchJson<NominatimResponse>(
      `https://nominatim.openstreetmap.org/reverse?${params}`
    );
    const address = data.address ?? {};

    return {
      country: address.country || 'Bilinmiyor',
      province: address.province || address.state,
      district:
        address.city ||
        address.town ||
        address.county ||
        address.district ||
        address.municipality,
      neighborhood:
        address.neighbourhood ||
        address.suburb ||
        address.village,
      displayName: data.display_name,
      latitude,
      longitude,
      provider: 'OpenStreetMap Nominatim',
    };
  } catch (error) {
    console.warn('Ters jeokodlama kullanılamadı:', error);

    return {
      country: 'Bilinmiyor',
      latitude,
      longitude,
      provider: 'fallback',
    };
  }
}
