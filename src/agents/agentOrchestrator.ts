import {
  getAllAgents,
} from './agents/agentRegistry';
import type {
  AgentContext,
  AgentId,
  AgentResult,
} from './agentTypes';

export interface OrchestrationResult {
  context: AgentContext;
  selectedAgents: AgentId[];
  results: AgentResult[];
  startedAt: string;
  completedAt: string;
}

export async function runAgents(
  context: AgentContext
): Promise<OrchestrationResult> {
  const startedAt = new Date().toISOString();
  const selected = getAllAgents().filter(
    (agent) => agent.canRun(context)
  );
  const settled = await Promise.allSettled(
    selected.map((agent) => agent.run(context))
  );
  const results = settled.map(
    (item, index): AgentResult => {
      if (item.status === 'fulfilled') {
        return item.value;
      }

      const timestamp = new Date().toISOString();
      return {
        agentId: selected[index].id,
        status: 'hata',
        findings: [],
        sources: [],
        startedAt,
        completedAt: timestamp,
        error:
          item.reason instanceof Error
            ? item.reason.message
            : 'Ajan beklenmeyen biçimde durdu.',
      };
    }
  );

  return {
    context,
    selectedAgents: selected.map((agent) => agent.id),
    results,
    startedAt,
    completedAt: new Date().toISOString(),
  };
}
