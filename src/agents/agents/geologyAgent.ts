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
  source,
} from './agentHelpers';

interface MacrostratUnit {
  map_id?: number;
  name?: string;
  strat_name?: string;
  lith?: string;
  descrip?: string;
  best_int_name?: string;
  t_age?: number;
  b_age?: number;
}

interface MacrostratResponse {
  success?: {
    data?: MacrostratUnit[];
  };
}

export const geologyAgent: SyAgent = {
  id: 'jeoloji',
  name: 'Jeoloji Ajanı',
  description:
    'Seçilen nokta için Macrostrat açık jeoloji haritasındaki birimleri getirir.',
  canRun: canRunForLocation,

  async run(context: AgentContext): Promise<AgentResult> {
    const startedAt = new Date().toISOString();
    const params = new URLSearchParams({
      lat: context.latitude.toString(),
      lng: context.longitude.toString(),
    });
    const url = `https://macrostrat.org/api/v2/geologic_units/map?${params}`;

    try {
      const data = await fetchJson<MacrostratResponse>(url);
      const geologySource = source(
        `macrostrat-${context.latitude}-${context.longitude}`,
        'Macrostrat geologic units map',
        'Macrostrat',
        'açık_veri',
        url
      );
      const units = data.success?.data ?? [];
      const findings: AgentFinding[] = units
        .slice(0, 5)
        .map((unit, index) => {
          const name =
            unit.strat_name ||
            unit.name ||
            'Adlandırılmamış jeolojik birim';
          const details = [
            unit.lith && `Litoloji: ${unit.lith}`,
            unit.best_int_name &&
              `Jeolojik zaman: ${unit.best_int_name}`,
            Number.isFinite(unit.t_age) &&
              Number.isFinite(unit.b_age) &&
              `Yaş aralığı: ${unit.t_age}-${unit.b_age} milyon yıl`,
            unit.descrip,
          ]
            .filter(Boolean)
            .join(' • ');

          return {
            id: `jeoloji-${unit.map_id ?? index}`,
            agentId: 'jeoloji',
            title: name,
            description:
              details || 'Kaynakta ek birim açıklaması bulunmuyor.',
            confidence: 0.9,
            sources: [geologySource],
            coordinates: {
              lat: context.latitude,
              lng: context.longitude,
            },
          };
        });

      return {
        agentId: 'jeoloji',
        status: 'tamamlandı',
        findings,
        sources: [geologySource],
        startedAt,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      return failedResult('jeoloji', startedAt, error);
    }
  },
};
