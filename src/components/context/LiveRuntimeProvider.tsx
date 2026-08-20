import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  decideApproval,
  EMPTY_LIVE_SNAPSHOT,
  forceLiveSync,
  getLiveSnapshot,
  openLiveStream,
  type LiveSnapshot,
} from '../../services/liveRuntimeService';
import {
  LiveRuntimeContext,
  type LiveRuntimeContextValue,
} from './LiveRuntimeContextDefinition';

export function LiveRuntimeProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<LiveSnapshot>(
    EMPTY_LIVE_SNAPSHOT
  );
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryTimerRef = useRef<number | null>(null);

  const loadSnapshot = useCallback(async () => {
    try {
      const next = await getLiveSnapshot();
      setSnapshot(next);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Canlı çalışma zamanına ulaşılamadı.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSnapshot();
    const stream = openLiveStream(
      (next) => {
        setSnapshot(next);
        setConnected(true);
        setError(null);
        setLoading(false);
      },
      () => {
        setConnected(false);
        if (retryTimerRef.current === null) {
          retryTimerRef.current = window.setTimeout(() => {
            retryTimerRef.current = null;
            void loadSnapshot();
          }, 5_000);
        }
      }
    );

    const poll = window.setInterval(() => void loadSnapshot(), 60_000);
    return () => {
      stream.close();
      window.clearInterval(poll);
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
      }
    };
  }, [loadSnapshot]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSnapshot(await forceLiveSync());
      setError(null);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Canlı senkronizasyon başarısız.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const decide = useCallback(
    async (id: string, decision: 'approved' | 'rejected') => {
      await decideApproval(id, decision);
      await loadSnapshot();
    },
    [loadSnapshot]
  );

  const value = useMemo<LiveRuntimeContextValue>(
    () => ({
      snapshot,
      connected,
      loading,
      error,
      refresh,
      decide,
    }),
    [snapshot, connected, loading, error, refresh, decide]
  );

  return (
    <LiveRuntimeContext.Provider value={value}>
      {children}
    </LiveRuntimeContext.Provider>
  );
}
