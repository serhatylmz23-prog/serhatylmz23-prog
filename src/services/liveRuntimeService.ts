export type LiveSeverity = 'low' | 'medium' | 'high' | 'critical';
export type LiveAgentStatus = 'active' | 'syncing' | 'waiting' | 'error';

export interface LiveEvent {
  id: string;
  sourceId: string;
  category: string;
  title: string;
  summary: string;
  severity: LiveSeverity;
  lat: number;
  lng: number;
  observedAt: string;
  url: string | null;
  data: Record<string, unknown>;
}

export interface LiveAgent {
  id: string;
  kind: 'source' | 'event';
  name: string;
  status: LiveAgentStatus;
  sourceId: string;
  eventId: string | null;
  category: string;
  lastUpdatedAt: string | null;
  detail: string;
}

export interface LiveSource {
  id: string;
  name: string;
  provider: string;
  status: 'waiting' | 'syncing' | 'online' | 'error';
  eventCount: number;
  lastSyncAt: string | null;
  error: string | null;
  trusted: boolean;
}

export interface LiveApproval {
  id: string;
  type: 'source' | 'model' | 'rule';
  title: string;
  description: string;
  status: 'pending';
  createdAt: string;
}

export interface LiveSnapshot {
  mode: 'live';
  generatedAt: string;
  lastUpdatedAt: string | null;
  syncing: boolean;
  agents: LiveAgent[];
  sources: LiveSource[];
  events: LiveEvent[];
  approvals: LiveApproval[];
  metrics: {
    activeAgents: number;
    syncingAgents: number;
    errorAgents: number;
    liveEvents: number;
    onlineSources: number;
    pendingApprovals: number;
  };
}

export const EMPTY_LIVE_SNAPSHOT: LiveSnapshot = {
  mode: 'live',
  generatedAt: new Date(0).toISOString(),
  lastUpdatedAt: null,
  syncing: false,
  agents: [],
  sources: [],
  events: [],
  approvals: [],
  metrics: {
    activeAgents: 0,
    syncingAgents: 0,
    errorAgents: 0,
    liveEvents: 0,
    onlineSources: 0,
    pendingApprovals: 0,
  },
};

export function runtimeBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_SYKASIF_RUNTIME_URL || '').replace(/\/$/, '');
  return envUrl || 'https://sykasif-runtime.serhatylmz23.workers.dev';
}

function runtimeUrl(path: string): string {
  return runtimeBaseUrl() + path;
}

export async function getLiveSnapshot(): Promise<LiveSnapshot> {
  const response = await fetch(runtimeUrl('/api/runtime/snapshot'), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Canlı çalışma zamanı HTTP ${response.status} döndürdü.`);
  }
  return (await response.json()) as LiveSnapshot;
}

export async function forceLiveSync(): Promise<LiveSnapshot> {
  const response = await fetch(runtimeUrl('/api/runtime/sync'), {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Canlı senkronizasyon HTTP ${response.status} döndürdü.`);
  }
  return (await response.json()) as LiveSnapshot;
}

export async function decideApproval(
  id: string,
  decision: 'approved' | 'rejected'
): Promise<void> {
  const response = await fetch(
    runtimeUrl(
      `/api/runtime/approvals/${encodeURIComponent(id)}/${decision}`
    ),
    {
      method: 'POST',
      headers: {
        'X-SyKasif-Admin':
          sessionStorage.getItem('sykasif-runtime-admin-token') || '',
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Onay işlemi HTTP ${response.status} döndürdü.`);
  }
}

export function openLiveStream(
  onSnapshot: (snapshot: LiveSnapshot) => void,
  onError: () => void
): EventSource {
  const source = new EventSource(runtimeUrl('/api/runtime/stream'));
  const events = [
    'snapshot',
    'sync-start',
    'source-update',
    'approval-update',
  ];
  for (const eventName of events) {
    source.addEventListener(eventName, (event) => {
      try {
        onSnapshot(JSON.parse((event as MessageEvent<string>).data));
      } catch {
        onError();
      }
    });
  }
  source.onerror = onError;
  return source;
}
