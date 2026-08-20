import type {
  SyAgent,
  AgentContext,
  AgentResult,
} from '../agentTypes';

export const satelliteAgent: SyAgent = {
  id: 'uydu',

  name: 'Uydu Ajanı',

  description:
    'Seçilen bölge için uydu ve uzaktan algılama verilerini araştırır.',

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

    return {
      agentId: 'uydu',
      status: 'tamamlandı',
      findings: [],
      sources: [],
      startedAt,
      completedAt:
        new Date().toISOString(),
    };
  },
};