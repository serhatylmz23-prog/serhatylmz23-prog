import type {
  AgentResult,
  AgentFinding,
} from '../agents/agentTypes';

export interface CrossAnalysis {
  totalFindings: number;
  totalSources: number;
  findings: AgentFinding[];
  summary: string;
}

export function crossAnalyze(
  results: AgentResult[]
): CrossAnalysis {
  const findings =
    results.flatMap(
      (result) =>
        result.findings
    );

  const totalSources =
    results.reduce(
      (total, result) =>
        total +
        result.sources.length,
      0
    );

  return {
    totalFindings:
      findings.length,

    totalSources,

    findings,

    summary:
      results.length === 0
        ? 'Analiz yapılacak ajan sonucu bulunamadı.'
        : `${results.length} ajan değerlendirildi. ${findings.length} bulgu ve ${totalSources} kaynak toplandı.`,
  };
}