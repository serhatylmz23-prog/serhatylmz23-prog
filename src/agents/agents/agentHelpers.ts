import type {
  AgentContext,
  AgentId,
  AgentResult,
  AgentSource,
} from '../agentTypes';
import {
  isValidCoordinate,
  normalizeRadius,
} from '../../services/httpService';

export function canRunForLocation(
  context: AgentContext
): boolean {
  return (
    isValidCoordinate(
      context.latitude,
      context.longitude
    ) &&
    Number.isFinite(context.radiusKm) &&
    context.radiusKm > 0
  );
}

export function radiusFor(context: AgentContext): number {
  return normalizeRadius(context.radiusKm);
}

export function source(
  id: string,
  title: string,
  provider: string,
  type: AgentSource['type'],
  url: string
): AgentSource {
  return {
    id,
    title,
    provider,
    type,
    url,
    retrievedAt: new Date().toISOString(),
  };
}

export function failedResult(
  agentId: AgentId,
  startedAt: string,
  error: unknown
): AgentResult {
  return {
    agentId,
    status: 'hata',
    findings: [],
    sources: [],
    startedAt,
    completedAt: new Date().toISOString(),
    error:
      error instanceof Error
        ? error.message
        : 'Bilinmeyen hata',
  };
}
