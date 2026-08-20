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

interface OverpassElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

export const archaeologyAgent: SyAgent = {
  id: 'arkeoloji',
  name: 'Arkeoloji Ajanı',
  description:
    'OpenStreetMap üzerinde işaretlenmiş arkeolojik alan ve kalıntıları getirir.',
  canRun: canRunForLocation,

  async run(context: AgentContext): Promise<AgentResult> {
    const startedAt = new Date().toISOString();
    // Genel Overpass sunucusunu aşırı yüklememek için bu ajan 25 km ile sınırlıdır.
    const radiusMeters = Math.round(
      Math.min(radiusFor(context), 25) * 1_000
    );
    const around = `${radiusMeters},${context.latitude},${context.longitude}`;
    const query = `[out:json][timeout:15];(
      nwr["historic"="archaeological_site"](around:${around});
      nwr["historic"="ruins"](around:${around});
      nwr["archaeological_site"](around:${around});
    );out center tags 30;`;

    try {
      const data = await fetchJson<OverpassResponse>(
        'https://overpass-api.de/api/interpreter',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
          body: new URLSearchParams({ data: query }),
        },
        20_000
      );
      const osmSource = source(
        `osm-archaeology-${context.latitude}-${context.longitude}`,
        'OpenStreetMap kültürel miras etiketleri',
        'OpenStreetMap / Overpass API',
        'açık_veri',
        'https://www.openstreetmap.org/copyright'
      );

      const findings: AgentFinding[] = (data.elements ?? []).map(
        (element, index) => {
          const tags = element.tags ?? {};
          const lat = element.lat ?? element.center?.lat;
          const lng = element.lon ?? element.center?.lon;
          const title =
            tags['name:tr'] ||
            tags.name ||
            tags.historic ||
            'Adlandırılmamış kültürel miras kaydı';
          const details = [
            tags.historic && `Tür: ${tags.historic}`,
            tags.archaeological_site &&
              `Alan türü: ${tags.archaeological_site}`,
            tags.site_type && `Sit türü: ${tags.site_type}`,
            tags.wikipedia && `Wikipedia: ${tags.wikipedia}`,
          ]
            .filter(Boolean)
            .join(' • ');

          return {
            id: `arkeoloji-${element.type}-${element.id}-${index}`,
            agentId: 'arkeoloji',
            title,
            description:
              details ||
              'OpenStreetMap kaydında ayrıntılı açıklama bulunmuyor.',
            confidence: 0.8,
            sources: [osmSource],
            coordinates:
              Number.isFinite(lat) && Number.isFinite(lng)
                ? { lat: lat as number, lng: lng as number }
                : undefined,
          };
        }
      );

      return {
        agentId: 'arkeoloji',
        status: 'tamamlandı',
        findings,
        sources: [osmSource],
        startedAt,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      return failedResult('arkeoloji', startedAt, error);
    }
  },
};
