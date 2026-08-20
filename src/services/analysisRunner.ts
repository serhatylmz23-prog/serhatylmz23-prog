import {
  getRegionalData,
} from './regionalDataService';

import {
  runAgents,
} from '../agents/agentOrchestrator';

import {
  crossAnalyze,
} from './analysisService';

export async function analyzeLocation(
  latitude: number,
  longitude: number,
  radiusKm = 10
) {
  const regionalData =
    await getRegionalData(
      latitude,
      longitude
    );

  const context = {
    latitude,
    longitude,
    region:
      regionalData.province,
    district:
      regionalData.district,
    radiusKm,
  };

  const orchestration =
    await runAgents(context);

  const analysis =
    crossAnalyze(
      orchestration.results
    );

  return {
    regionalData,
    orchestration,
    analysis,
  };
}