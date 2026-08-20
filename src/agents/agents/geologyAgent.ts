import type {
  SyAgent,
  AgentContext,
  AgentResult,
} from '../agentTypes';

import {
  searchSources,
} from '../../services/sourceService';

export const geologyAgent: SyAgent = {
  id: 'jeoloji',

  name: 'Jeoloji Ajanı',

  description:
    'Seçilen bölgenin jeolojik ve jeomorfolojik verilerini araştırır.',

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
          `jeoloji ${context.latitude} ${context.longitude}`
        );

      return {
        agentId: 'jeoloji',
        status: 'tamamlandı',
        findings: [],
        sources,
        startedAt,
        completedAt:
          new Date().toISOString(),
      };
    } catch (error) {
      return {
        agentId: 'jeoloji',
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