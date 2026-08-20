import type {
  AgentContext,
  AgentResult,
  SyAgent,
} from '../agentTypes';
import { fetchJson } from '../../services/httpService';
import {
  canRunForLocation,
  failedResult,
  source,
} from './agentHelpers';

interface WeatherResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  current_units?: Record<string, string>;
  timezone?: string;
}

function weatherCodeText(code?: number): string {
  if (code === 0) return 'Açık';
  if (code === 1 || code === 2 || code === 3) return 'Parçalı veya çok bulutlu';
  if (code === 45 || code === 48) return 'Sisli';
  if (code !== undefined && code >= 51 && code <= 67) return 'Yağışlı';
  if (code !== undefined && code >= 71 && code <= 77) return 'Karlı';
  if (code !== undefined && code >= 80 && code <= 82) return 'Sağanak yağışlı';
  if (code !== undefined && code >= 95) return 'Gök gürültülü';
  return 'Durum kodu bilinmiyor';
}

export const weatherAgent: SyAgent = {
  id: 'meteoroloji',
  name: 'Meteoroloji Ajanı',
  description:
    'Open-Meteo üzerinden seçilen noktanın güncel hava koşullarını getirir.',
  canRun: canRunForLocation,

  async run(context: AgentContext): Promise<AgentResult> {
    const startedAt = new Date().toISOString();
    const params = new URLSearchParams({
      latitude: context.latitude.toString(),
      longitude: context.longitude.toString(),
      current:
        'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
      timezone: 'auto',
    });
    const url = `https://api.open-meteo.com/v1/forecast?${params}`;

    try {
      const data = await fetchJson<WeatherResponse>(url);
      if (!data.current) {
        throw new Error('Hava durumu sağlayıcısı güncel veri döndürmedi.');
      }

      const weatherSource = source(
        `open-meteo-${context.latitude}-${context.longitude}`,
        'Open-Meteo Forecast API',
        'Open-Meteo',
        'açık_veri',
        url
      );
      const units = data.current_units ?? {};
      const current = data.current;
      const description = [
        `Koşul: ${weatherCodeText(current.weather_code)}`,
        Number.isFinite(current.temperature_2m) &&
          `Sıcaklık: ${current.temperature_2m}${units.temperature_2m || '°C'}`,
        Number.isFinite(current.relative_humidity_2m) &&
          `Nem: ${current.relative_humidity_2m}${units.relative_humidity_2m || '%'}`,
        Number.isFinite(current.wind_speed_10m) &&
          `Rüzgâr: ${current.wind_speed_10m} ${units.wind_speed_10m || 'km/h'}`,
        Number.isFinite(current.precipitation) &&
          `Yağış: ${current.precipitation} ${units.precipitation || 'mm'}`,
        current.time && `Ölçüm zamanı: ${current.time} (${data.timezone || 'yerel'})`,
      ]
        .filter(Boolean)
        .join(' • ');

      return {
        agentId: 'meteoroloji',
        status: 'tamamlandı',
        findings: [
          {
            id: `meteoroloji-${context.latitude}-${context.longitude}-${current.time || 'current'}`,
            agentId: 'meteoroloji',
            title: 'Güncel hava koşulları',
            description,
            confidence: 1,
            sources: [weatherSource],
            coordinates: {
              lat: context.latitude,
              lng: context.longitude,
            },
          },
        ],
        sources: [weatherSource],
        startedAt,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      return failedResult('meteoroloji', startedAt, error);
    }
  },
};
