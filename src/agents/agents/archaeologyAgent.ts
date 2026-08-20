import type {
  SyAgent,
  AgentContext,
  AgentResult,
} from '../agentTypes';

import {
  searchSources,
} from '../../services/sourceService';

export const archaeologyAgent: SyAgent = {
  id: 'arkeoloji',

  name: 'Arkeoloji Ajanı',

  description:
    'Seçilen bölgedeki arkeolojik ve kültürel miras verilerini araştırır.',

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
          `arkeoloji sit alanı kültürel miras ${context.latitude} ${context.longitude}`
        );

      return {
        agentId: 'arkeoloji',
        status: 'tamamlandı',
        findings: [],
        sources,
        startedAt,
        completedAt:
          new Date().toISOString(),
      };
    } catch (error) {
      return {
        agentId: 'arkeoloji',
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