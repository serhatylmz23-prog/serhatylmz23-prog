import type {
  AgentFinding,
  AgentResult,
  AgentSource,
} from '../agents/agentTypes';

export interface CrossAnalysis {
  totalFindings: number;
  totalSources: number;
  findings: AgentFinding[];
  sources: AgentSource[];
  summary: string;
}

export function crossAnalyze(
  results: AgentResult[]
): CrossAnalysis {
  const findings = results.flatMap(
    (result) => result.findings
  );
  const sourceMap = new Map<string, AgentSource>();
  for (const result of results) {
    for (const item of result.sources) {
      sourceMap.set(item.id, item);
    }
  }
  const sources = [...sourceMap.values()];
  const errorCount = results.filter(
    (result) => result.status === 'hata'
  ).length;
  const successfulCount = results.length - errorCount;

  let summary =
    results.length === 0
      ? 'Analiz yapılacak uygun ajan bulunamadı.'
      : `${successfulCount}/${results.length} ajan tamamlandı; ${findings.length} bulgu ve ${sources.length} kaynak alındı.`;

  if (errorCount > 0) {
    summary += ` ${errorCount} ajan hata verdi; ayrıntılar ajan kartlarında gösteriliyor.`;
  }

  return {
    totalFindings: findings.length,
    totalSources: sources.length,
    findings,
    sources,
    summary,
  };
}
