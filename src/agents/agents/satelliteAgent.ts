import type {
  AgentContext,
  AgentResult,
  SyAgent,
} from '../agentTypes';
import {
  canRunForLocation,
  source,
} from './agentHelpers';

export const satelliteAgent: SyAgent = {
  id: 'uydu',
  name: 'Uydu Ajanı',
  description:
    'Haritadaki Esri World Imagery katmanının kaynağını raporlar; otomatik görüntü yorumu yapmaz.',
  canRun: canRunForLocation,

  async run(_context: AgentContext): Promise<AgentResult> {
    const startedAt = new Date().toISOString();
    const imagerySource = source(
      'esri-world-imagery',
      'Esri World Imagery basemap',
      'Esri',
      'harita',
      'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9'
    );

    return {
      agentId: 'uydu',
      status: 'tamamlandı',
      findings: [],
      sources: [imagerySource],
      startedAt,
      completedAt: new Date().toISOString(),
    };
  },
};
