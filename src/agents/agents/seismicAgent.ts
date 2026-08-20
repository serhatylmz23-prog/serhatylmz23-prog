import type {
  AgentContext,
  AgentFinding,
  AgentResult,
  SyAgent,
} from '../agentTypes';
import { fetchJson } from '../../services/httpService';
import {
  canRunForLocation,
  failedResult,
  radiusFor,
  source,
} from './agentHelpers';

interface EarthquakeFeature {
  id: string;
  properties?: {
    mag?: number;
    place?: string;
    time?: number;
    url?: string;
  };
  geometry?: {
    coordinates?: [number, number, number];
  };
}

interface EarthquakeResponse {
  features?: EarthquakeFeature[];
}

export const seismicAgent: SyAgent = {
  id: 'sismoloji',
  name: 'Sismoloji Ajanı',
  description:
    'USGS kataloğundaki son 30 günlük deprem kayıtlarını konuma göre sorgular.',
  canRun: canRunForLocation,

  async run(context: AgentContext): Promise<AgentResult> {
    const startedAt = new Date().toISOString();
    const startDate = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1_000
    )
      .toISOString()
      .slice(0, 10);
    const params = new URLSearchParams({
      format: 'geojson',
      latitude: context.latitude.toString(),
      longitude: context.longitude.toString(),
      maxradiuskm: radiusFor(context).toString(),
      starttime: startDate,
      orderby: 'time',
      limit: '50',
    });
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`;

    try {
      const data = await fetchJson<EarthquakeResponse>(url);
      const catalogSource = source(
        `usgs-${context.latitude}-${context.longitude}-${startDate}`,
        'USGS Earthquake Catalog — son 30 gün',
        'USGS',
        'resmi',
        url
      );
      const findings: AgentFinding[] = (data.features ?? []).map(
        (feature) => {
          const [lng, lat, depth] =
            feature.geometry?.coordinates ?? [
              context.longitude,
              context.latitude,
              Number.NaN,
            ];
          const magnitude = feature.properties?.mag;
          const time = feature.properties?.time;
          const description = [
            Number.isFinite(magnitude) && `Büyüklük: M${magnitude}`,
            Number.isFinite(depth) && `Derinlik: ${depth} km`,
            Number.isFinite(time) &&
              `Zaman: ${new Date(time as number).toLocaleString('tr-TR')}`,
          ]
            .filter(Boolean)
            .join(' • ');

          return {
            id: `sismoloji-${feature.id}`,
            agentId: 'sismoloji',
            title:
              feature.properties?.place ||
              'Konumu adlandırılmamış deprem kaydı',
            description,
            confidence: 1,
            sources: [
              feature.properties?.url
                ? {
                    ...catalogSource,
                    id: `usgs-event-${feature.id}`,
                    title: `USGS olay kaydı ${feature.id}`,
                    url: feature.properties.url,
                  }
                : catalogSource,
            ],
            coordinates: { lat, lng },
          };
        }
      );

      return {
        agentId: 'sismoloji',
        status: 'tamamlandı',
        findings,
        sources: [catalogSource],
        startedAt,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      return failedResult('sismoloji', startedAt, error);
    }
  },
};
