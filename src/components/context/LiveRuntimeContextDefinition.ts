import { createContext } from 'react';
import type { LiveSnapshot } from '../../services/liveRuntimeService';

export interface LiveRuntimeContextValue {
  snapshot: LiveSnapshot;
  connected: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  decide: (
    id: string,
    decision: 'approved' | 'rejected'
  ) => Promise<void>;
}

export const LiveRuntimeContext =
  createContext<LiveRuntimeContextValue | undefined>(undefined);
