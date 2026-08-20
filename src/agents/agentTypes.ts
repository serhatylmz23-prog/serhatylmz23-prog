export type AgentId =
  | 'jeoloji'
  | 'arkeoloji'
  | 'sismoloji'
  | 'meteoroloji'
  | 'uydu';

export type AgentStatus =
  | 'bekliyor'
  | 'çalışıyor'
  | 'tamamlandı'
  | 'hata';

export interface AgentContext {
  latitude: number;
  longitude: number;
  region?: string;
  district?: string;
  radiusKm: number;
}

export interface AgentSource {
  id: string;
  title: string;
  url?: string;
  provider: string;
  type: 'resmi' | 'bilimsel' | 'harita' | 'açık_veri';
  retrievedAt: string;
}

export interface AgentFinding {
  id: string;
  agentId: AgentId;
  title: string;
  description: string;
  confidence: number;
  sources: AgentSource[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface AgentResult {
  agentId: AgentId;
  status: AgentStatus;
  findings: AgentFinding[];
  sources: AgentSource[];
  startedAt: string;
  completedAt: string;
  error?: string;
}

export interface SyAgent {
  id: AgentId;
  name: string;
  description: string;
  canRun: (
    context: AgentContext
  ) => boolean;

  run: (
    context: AgentContext
  ) => Promise<AgentResult>;
}