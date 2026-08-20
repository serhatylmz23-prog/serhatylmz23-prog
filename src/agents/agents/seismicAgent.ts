import type {
  SyAgent,
  AgentContext,
  AgentResult,
} from '../agentTypes';

import {
  searchSources,
} from '../../services/sourceService';

export const seismicAgent: SyAgent = {
  id: 'sismoloji',

  name: 'Sismoloji Ajanı',

  description:
    'Seçilen bölgenin deprem ve fay verilerini araştırır.',

  canRun: (
    context: AgentContext
  ) => {
    return (
      context.latitude >= -90 &&
      context.latitude <= 90 &&
      context.longitude >= -180 &&
      context.longitude <= 180
    );
  },

  async run(
    context: AgentContext
  ): Promise<AgentResult> {
    const startedAt =
      new Date().toISOString();

    try {
      const sources =
        await searchSources(
          `deprem fay sismoloji ${context.latitude} ${context.longitude}`
        );

      return {
        agentId: 'sismoloji',
        status: 'tamamlandı',
        findings: [],
        sources,
        startedAt,
        completedAt:
          new Date().toISOString(),
      };
    } catch (error) {
      return {
        agentId: 'sismoloji',
        status: 'hata',
        findings: [],
        sources: [],
        startedAt,
        completedAt:
          new Date().toISOString(),
        error:
          error instanceof Error
            ? error.message
            : 'Bilinmeyen hata',
      };
    }
  },
};