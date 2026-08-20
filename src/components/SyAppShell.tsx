import {
  SyProvider,
  useSyContext,
} from './context/SyContext';

import { SyMap } from './SyMap';

interface LayerDefinition {
  id: string;
  label: string;
}

function Sidebar() {
  const {
    activeLayers,
    toggleLayer,
    alerts,
    clearAlerts,
    systemStatus,
    agents,
    analysis,
  } = useSyContext();

  const layers: LayerDefinition[] = [
    {
      id: 'uydu',
      label: 'Uydu Görüntüsü',
    },
    {
      id: 'topografya',
      label: 'Topografya',
    },
    {
      id: 'termal',
      label: 'Termal Analiz (EDS)',
    },
    {
      id: 'gpr',
      label: 'GPR / Yer Altı Radarı',
    },
    {
      id: 'arkeoloji',
      label: 'Arkeolojik Sit Alanları',
    },
  ];

  const getStatusText = (
    status: string
  ) => {
    switch (status) {
      case 'çalışıyor':
        return 'ÇALIŞIYOR';

      case 'tamamlandı':
        return 'TAMAMLANDI';

      case 'hata':
        return 'HATA';

      default:
        return 'BEKLİYOR';
    }
  };

  const getStatusColor = (
    status: string
  ) => {
    switch (status) {
      case 'çalışıyor':
        return '#F59E0B';

      case 'tamamlandı':
        return '#22C55E';

      case 'hata':
        return '#EF4444';

      default:
        return '#64748B';
    }
  };

  return (
    <aside
      style={{
        width: '320px',
        height: '100vh',
        flexShrink: 0,
        boxSizing: 'border-box',
        backgroundColor: '#111827',
        color: '#FFFFFF',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        borderRight:
          '1px solid #374151',
        overflow: 'hidden',
      }}
    >
      {/* BAŞLIK */}
      <div
        style={{
          borderBottom:
            '1px solid #374151',
          paddingBottom: '14px',
          marginBottom: '14px',
        }}
      >
        <h2
          style={{
            color: '#3B82F6',
            margin: 0,
            fontSize: '20px',
          }}
        >
          SyKaşif
        </h2>

        <div
          style={{
            color: '#9CA3AF',
            fontSize: '12px',
            marginTop: '5px',
          }}
        >
          Türkiye Monitörü
        </div>
      </div>

      {/* SİSTEM DURUMU */}
      <div
        style={{
          padding: '10px',
          marginBottom: '15px',
          backgroundColor:
            'rgba(34,197,94,0.08)',
          border:
            '1px solid rgba(34,197,94,0.25)',
          borderRadius: '6px',
          fontSize: '12px',
        }}
      >
        <div
          style={{
            color: '#9CA3AF',
            marginBottom: '4px',
          }}
        >
          SİSTEM DURUMU
        </div>

        <div
          style={{
            color: '#22C55E',
            fontWeight: 600,
          }}
        >
          ● {systemStatus}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '4px',
        }}
      >
        {/* KATMANLAR */}
        <section>
          <h3
            style={{
              fontSize: '13px',
              color: '#93C5FD',
              marginTop: 0,
            }}
          >
            HARİTA KATMANLARI
          </h3>

          {layers.map(
            (layer) => {
              const isActive =
                activeLayers.includes(
                  layer.id
                );

              return (
                <div
                  key={layer.id}
                  style={{
                    marginBottom:
                      '8px',
                    padding: '8px',
                    borderRadius:
                      '6px',
                    backgroundColor:
                      isActive
                        ? 'rgba(59,130,246,0.12)'
                        : 'transparent',
                  }}
                >
                  <label
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: '10px',
                      cursor:
                        'pointer',
                      fontSize:
                        '13px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        isActive
                      }
                      onChange={() =>
                        toggleLayer(
                          layer.id
                        )
                      }
                      style={{
                        width:
                          '17px',
                        height:
                          '17px',
                        cursor:
                          'pointer',
                      }}
                    />

                    <span>
                      {
                        layer.label
                      }
                    </span>
                  </label>
                </div>
              );
            }
          )}
        </section>

        {/* AJANLAR */}
        <section
          style={{
            marginTop: '20px',
          }}
        >
          <h3
            style={{
              fontSize: '13px',
              color: '#93C5FD',
              marginTop: 0,
              marginBottom:
                '10px',
            }}
          >
            AJAN DURUMLARI
          </h3>

          {agents.map(
            (agent) => (
              <div
                key={agent.id}
                style={{
                  padding:
                    '9px',
                  marginBottom:
                    '6px',
                  borderRadius:
                    '6px',
                  backgroundColor:
                    'rgba(255,255,255,0.035)',
                  border:
                    '1px solid rgba(148,163,184,0.1)',
                }}
              >
                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        '12px',
                      color:
                        '#E2E8F0',
                    }}
                  >
                    {agent.name}
                  </span>

                  <span
                    style={{
                      fontSize:
                        '9px',
                      fontWeight:
                        700,
                      color:
                        getStatusColor(
                          agent.status
                        ),
                    }}
                  >
                    ●{' '}
                    {getStatusText(
                      agent.status
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display:
                      'flex',
                    gap: '12px',
                    marginTop:
                      '6px',
                    fontSize:
                      '10px',
                    color:
                      '#94A3B8',
                  }}
                >
                  <span>
                    Kaynak:{' '}
                    {
                      agent.sourceCount
                    }
                  </span>

                  <span>
                    Bulgu:{' '}
                    {
                      agent.findingCount
                    }
                  </span>
                </div>

                {agent.error && (
                  <div
                    style={{
                      marginTop:
                        '5px',
                      color:
                        '#F87171',
                      fontSize:
                        '10px',
                    }}
                  >
                    {agent.error}
                  </div>
                )}
              </div>
            )
          )}
        </section>

        {/* ANALİZ */}
        <section
          style={{
            marginTop: '20px',
          }}
        >
          <h3
            style={{
              fontSize: '13px',
              color: '#93C5FD',
              marginTop: 0,
            }}
          >
            ÇAPRAZ ANALİZ
          </h3>

          <div
            style={{
              padding: '10px',
              borderRadius:
                '6px',
              backgroundColor:
                'rgba(59,130,246,0.08)',
              border:
                '1px solid rgba(59,130,246,0.18)',
              fontSize: '11px',
            }}
          >
            <div>
              Durum:{' '}
              <strong>
                {analysis.running
                  ? 'ANALİZ ÇALIŞIYOR'
                  : 'HAZIR'}
              </strong>
            </div>

            <div
              style={{
                marginTop:
                  '6px',
                color:
                  '#94A3B8',
              }}
            >
              Kaynak:{' '}
              {
                analysis.totalSources
              }
            </div>

            <div
              style={{
                marginTop:
                  '4px',
                color:
                  '#94A3B8',
              }}
            >
              Bulgu:{' '}
              {
                analysis.totalFindings
              }
            </div>

            <div
              style={{
                marginTop:
                  '8px',
                color:
                  '#CBD5E1',
                lineHeight:
                  1.5,
              }}
            >
              {
                analysis.summary
              }
            </div>
          </div>
        </section>

        {/* EDS BİLDİRİMLERİ */}
        <section
          style={{
            marginTop: '20px',
          }}
        >
          <div
            style={{
              display:
                'flex',
              justifyContent:
                'space-between',
              alignItems:
                'center',
            }}
          >
            <h3
              style={{
                color: '#EF4444',
                margin: 0,
                fontSize:
                  '13px',
              }}
            >
              EDS BİLDİRİMLERİ
            </h3>

            {alerts.length >
              0 && (
              <button
                type="button"
                onClick={
                  clearAlerts
                }
                style={{
                  background:
                    'transparent',
                  border:
                    'none',
                  color:
                    '#9CA3AF',
                  cursor:
                    'pointer',
                  fontSize:
                    '11px',
                }}
              >
                Temizle
              </button>
            )}
          </div>

          <div
            style={{
              maxHeight:
                '150px',
              overflowY:
                'auto',
              marginTop:
                '10px',
            }}
          >
            {alerts.length ===
            0 ? (
              <div
                style={{
                  color:
                    '#9CA3AF',
                  fontSize:
                    '12px',
                  padding:
                    '8px',
                  backgroundColor:
                    'rgba(255,255,255,0.03)',
                  borderRadius:
                    '5px',
                }}
              >
                Henüz bildirim
                bulunmuyor.
              </div>
            ) : (
              alerts.map(
                (alert) => (
                  <div
                    key={
                      alert.id
                    }
                    style={{
                      padding:
                        '9px',
                      backgroundColor:
                        '#7F1D1D',
                      marginBottom:
                        '6px',
                      borderRadius:
                        '5px',
                      fontSize:
                        '12px',
                      border:
                        '1px solid rgba(239,68,68,0.3)',
                    }}
                  >
                    {
                      alert.msg
                    }
                  </div>
                )
              )
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}

export function SyAppShell() {
  return (
    <SyProvider>
      <div
        style={{
          display: 'flex',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          fontFamily:
            'Inter, Arial, sans-serif',
          backgroundColor:
            '#020617',
        }}
      >
        <Sidebar />

        <main
          style={{
            flex: 1,
            minWidth: 0,
            height: '100vh',
            overflow: 'hidden',
          }}
        >
          <SyMap />
        </main>
      </div>
    </SyProvider>
  );
}