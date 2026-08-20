import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type {
  AgentId,
  AgentResult,
  AgentStatus,
} from '../../agents/agentTypes';

export interface SyAlert {
  id: string;
  msg: string;
  type:
    | 'info'
    | 'warning'
    | 'danger'
    | 'success';
  createdAt: string;
}

export interface SyLocation {
  lat: number;
  lng: number;
  name: string;
}

export interface SyAgentState {
  id: AgentId;
  name: string;
  status: AgentStatus;
  sourceCount: number;
  findingCount: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface SyAnalysisState {
  running: boolean;
  totalSources: number;
  totalFindings: number;
  summary: string;
}

export interface SyContextValue {
  activeLayers: string[];

  toggleLayer: (
    layerId: string
  ) => void;

  alerts: SyAlert[];

  addAlert: (
    message: string,
    type?: SyAlert['type']
  ) => void;

  clearAlerts: () => void;

  selectedLocation: SyLocation;

  setSelectedLocation: React.Dispatch<
    React.SetStateAction<SyLocation>
  >;

  systemStatus: string;

  setSystemStatus: React.Dispatch<
    React.SetStateAction<string>
  >;

  agents: SyAgentState[];

  setAgentStatus: (
    agentId: AgentId,
    status: AgentStatus
  ) => void;

  applyAgentResults: (
    results: AgentResult[]
  ) => void;

  resetAgents: () => void;

  analysis: SyAnalysisState;

  setAnalysisRunning: (
    running: boolean
  ) => void;

  setAnalysisResult: (
    totalSources: number,
    totalFindings: number,
    summary: string
  ) => void;
}

const SyContext =
  createContext<
    SyContextValue | undefined
  >(undefined);

const INITIAL_LAYERS = [
  'uydu',
  'topografya',
];

const INITIAL_AGENTS: SyAgentState[] = [
  {
    id: 'jeoloji',
    name: 'Jeoloji Ajanı',
    status: 'bekliyor',
    sourceCount: 0,
    findingCount: 0,
  },
  {
    id: 'arkeoloji',
    name: 'Arkeoloji Ajanı',
    status: 'bekliyor',
    sourceCount: 0,
    findingCount: 0,
  },
  {
    id: 'sismoloji',
    name: 'Sismoloji Ajanı',
    status: 'bekliyor',
    sourceCount: 0,
    findingCount: 0,
  },
  {
    id: 'meteoroloji',
    name: 'Meteoroloji Ajanı',
    status: 'bekliyor',
    sourceCount: 0,
    findingCount: 0,
  },
  {
    id: 'uydu',
    name: 'Uydu Ajanı',
    status: 'bekliyor',
    sourceCount: 0,
    findingCount: 0,
  },
];

export function SyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    activeLayers,
    setActiveLayers,
  ] = useState<string[]>(
    INITIAL_LAYERS
  );

  const [
    alerts,
    setAlerts,
  ] = useState<SyAlert[]>([]);

  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState<SyLocation>({
    lat: 39.0,
    lng: 35.0,
    name: 'Türkiye',
  });

  const [
    systemStatus,
    setSystemStatus,
  ] = useState<string>(
    'Hazır'
  );

  const [
    agents,
    setAgents,
  ] = useState<SyAgentState[]>(
    INITIAL_AGENTS
  );

  const [
    analysis,
    setAnalysis,
  ] = useState<SyAnalysisState>({
    running: false,
    totalSources: 0,
    totalFindings: 0,
    summary: 'Henüz analiz yapılmadı.',
  });

  /*
   * -------------------------------------------------------
   * KATMANLAR
   * -------------------------------------------------------
   */

  const toggleLayer = useCallback(
    (layerId: string) => {
      setActiveLayers(
        (currentLayers) => {
          if (
            currentLayers.includes(
              layerId
            )
          ) {
            return currentLayers.filter(
              (id) =>
                id !== layerId
            );
          }

          return [
            ...currentLayers,
            layerId,
          ];
        }
      );
    },
    []
  );

  /*
   * -------------------------------------------------------
   * BİLDİRİMLER
   * -------------------------------------------------------
   */

  const addAlert = useCallback(
    (
      message: string,
      type: SyAlert['type'] = 'info'
    ) => {
      const newAlert: SyAlert = {
        id: `${Date.now()}-${Math.random()}`,
        msg: message,
        type,
        createdAt:
          new Date().toISOString(),
      };

      setAlerts(
        (currentAlerts) => [
          newAlert,
          ...currentAlerts,
        ]
      );
    },
    []
  );

  const clearAlerts =
    useCallback(() => {
      setAlerts([]);
    }, []);

  /*
   * -------------------------------------------------------
   * AJAN DURUMU
   * -------------------------------------------------------
   */

  const setAgentStatus =
    useCallback(
      (
        agentId: AgentId,
        status: AgentStatus
      ) => {
        setAgents(
          (currentAgents) =>
            currentAgents.map(
              (agent) =>
                agent.id === agentId
                  ? {
                      ...agent,
                      status,
                    }
                  : agent
            )
        );
      },
      []
    );

  /*
   * -------------------------------------------------------
   * AJAN SONUÇLARI
   * -------------------------------------------------------
   */

  const applyAgentResults =
    useCallback(
      (results: AgentResult[]) => {
        setAgents(
          (currentAgents) =>
            currentAgents.map(
              (agent) => {
                const result =
                  results.find(
                    (item) =>
                      item.agentId ===
                      agent.id
                  );

                if (!result) {
                  return agent;
                }

                return {
                  ...agent,
                  status:
                    result.status,
                  sourceCount:
                    result.sources
                      .length,
                  findingCount:
                    result.findings
                      .length,
                  error:
                    result.error,
                  startedAt:
                    result.startedAt,
                  completedAt:
                    result.completedAt,
                };
              }
            )
        );
      },
      []
    );

  /*
   * -------------------------------------------------------
   * AJANLARI SIFIRLA
   * -------------------------------------------------------
   */

  const resetAgents =
    useCallback(() => {
      setAgents(
        INITIAL_AGENTS.map(
          (agent) => ({
            ...agent,
          })
        )
      );

      setAnalysis({
        running: false,
        totalSources: 0,
        totalFindings: 0,
        summary:
          'Henüz analiz yapılmadı.',
      });
    }, []);

  /*
   * -------------------------------------------------------
   * ANALİZ DURUMU
   * -------------------------------------------------------
   */

  const setAnalysisRunning =
    useCallback(
      (running: boolean) => {
        setAnalysis(
          (current) => ({
            ...current,
            running,
          })
        );
      },
      []
    );

  const setAnalysisResult =
    useCallback(
      (
        totalSources: number,
        totalFindings: number,
        summary: string
      ) => {
        setAnalysis({
          running: false,
          totalSources,
          totalFindings,
          summary,
        });
      },
      []
    );

  /*
   * -------------------------------------------------------
   * CONTEXT VALUE
   * -------------------------------------------------------
   */

  const value =
    useMemo<SyContextValue>(
      () => ({
        activeLayers,
        toggleLayer,

        alerts,
        addAlert,
        clearAlerts,

        selectedLocation,
        setSelectedLocation,

        systemStatus,
        setSystemStatus,

        agents,
        setAgentStatus,
        applyAgentResults,
        resetAgents,

        analysis,
        setAnalysisRunning,
        setAnalysisResult,
      }),
      [
        activeLayers,
        toggleLayer,

        alerts,
        addAlert,
        clearAlerts,

        selectedLocation,
        setSelectedLocation,

        systemStatus,
        setSystemStatus,

        agents,
        setAgentStatus,
        applyAgentResults,
        resetAgents,

        analysis,
        setAnalysisRunning,
        setAnalysisResult,
      ]
    );

  return (
    <SyContext.Provider
      value={value}
    >
      {children}
    </SyContext.Provider>
  );
}

export function useSyContext(): SyContextValue {
  const context =
    useContext(SyContext);

  if (!context) {
    throw new Error(
      'useSyContext yalnızca SyProvider içerisinde kullanılabilir.'
    );
  }

  return context;
}