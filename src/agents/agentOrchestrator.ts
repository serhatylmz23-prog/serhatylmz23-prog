import {
  getAllAgents,
} from './agentRegistry';

import type {
  AgentContext,
  AgentResult,
} from './agentTypes';

export interface OrchestrationResult {
  context: AgentContext;
  selectedAgents: string[];
  results: AgentResult[];
  startedAt: string;
  completedAt: string;
}

export async function runAgents(
  context: AgentContext
): Promise<OrchestrationResult> {
  const startedAt =
    new Date().toISOString();

  const agents =
    getAllAgents();

  /*
   * Konuma uygun ajanları seç.
   */
  const selected =
    agents.filter((agent) =>
      agent.canRun(context)
    );

  /*
   * Şimdilik paralel çalıştırıyoruz.
   *
   * Daha sonra önceliklendirme,
   * bağımlılık ve kaynak maliyeti
   * sistemi eklenebilir.
   */
  const results =
    await Promise.all(
      selected.map((agent) =>
        agent.run(context)
      )
    );

  return {
    context,
    selectedAgents:
      selected.map(
        (agent) => agent.id
      ),
    results,
    startedAt,
    completedAt:
      new Date().toISOString(),
  };
}