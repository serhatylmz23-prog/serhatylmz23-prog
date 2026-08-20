import type {
  SyAgent,
  AgentContext,
  AgentResult,
} from '../agentTypes';

export const weatherAgent: SyAgent = {
  id: 'meteoroloji',

  name: 'Meteoroloji Ajanı',

  description:
    'Seçilen bölgenin meteorolojik koşullarını değerlendirir.',

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
    _context: AgentContext
  ): Promise<AgentResult> {
    const startedAt =
      new Date().toISOString();

    return {
      agentId: 'meteoroloji',
      status: 'tamamlandı',
      findings: [],
      sources: [],
      startedAt,
      completedAt:
        new Date().toISOString(),
    };
  },
};