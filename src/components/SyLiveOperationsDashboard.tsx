import { useLiveRuntime } from './context/useLiveRuntime';

const SEVERITY_COLOR = {
  low: '#38BDF8',
  medium: '#FBBF24',
  high: '#F97316',
  critical: '#EF4444',
};

export function SyLiveOperationsDashboard() {
  const { snapshot, connected, loading, error, refresh } = useLiveRuntime();

  return (
    <div
      style={{
        color: '#E2E8F0',
        background: '#020611',
        border: '1px solid rgba(34,211,238,.25)',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: '#22D3EE', fontSize: '1.05rem' }}>
            SYKAŞİF CANLI KÜRESEL OPERASYON
          </h2>
          <div style={{ marginTop: '4px', color: '#94A3B8', fontSize: '.72rem' }}>
            USGS • NASA EONET • GDACS • Dinamik olay ajanları
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: connected ? '#4ADE80' : '#FBBF24', fontSize: '.72rem' }}>
            ● {connected ? 'SSE CANLI' : 'POLLING'}
          </span>
          <button type="button" onClick={() => void refresh()} disabled={loading}>
            {loading ? 'Senkronize ediliyor…' : 'Şimdi yenile'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: '10px',
            padding: '9px',
            color: '#FCA5A5',
            background: 'rgba(127,29,29,.3)',
            borderRadius: '6px',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '9px',
          marginTop: '13px',
        }}
      >
        {[
          ['Aktif ajan', snapshot.metrics.activeAgents, '#4ADE80'],
          ['Canlı olay', snapshot.metrics.liveEvents, '#38BDF8'],
          ['Çevrimiçi kaynak', snapshot.metrics.onlineSources, '#FBBF24'],
          ['Senkronize ajan', snapshot.metrics.syncingAgents, '#C084FC'],
          ['Hatalı ajan', snapshot.metrics.errorAgents, '#F87171'],
          ['Onay bekleyen', snapshot.metrics.pendingApprovals, '#E879F9'],
        ].map(([label, value, color]) => (
          <div
            key={String(label)}
            style={{
              padding: '12px',
              background: '#07101F',
              border: '1px solid rgba(148,163,184,.14)',
              borderRadius: '8px',
            }}
          >
            <div style={{ color: '#64748B', fontSize: '.65rem' }}>{label}</div>
            <div style={{ color: String(color), fontSize: '1.45rem', fontWeight: 900 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1.25fr) minmax(280px, .75fr)',
          gap: '12px',
          marginTop: '13px',
        }}
      >
        <section
          style={{
            minWidth: 0,
            background: '#050B16',
            borderRadius: '9px',
            border: '1px solid rgba(56,189,248,.18)',
            overflow: 'hidden',
          }}
        >
          <h3 style={{ margin: 0, padding: '10px', color: '#7DD3FC', fontSize: '.78rem' }}>
            SON CANLI OLAYLAR
          </h3>
          <div style={{ maxHeight: '430px', overflowY: 'auto' }}>
            {snapshot.events.slice(0, 30).map((event) => (
              <div
                key={event.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '9px 1fr auto',
                  gap: '8px',
                  padding: '9px 10px',
                  borderTop: '1px solid rgba(148,163,184,.1)',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    marginTop: '4px',
                    borderRadius: '50%',
                    background: SEVERITY_COLOR[event.severity],
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '.73rem',
                    }}
                  >
                    {event.title}
                  </div>
                  <div style={{ color: '#64748B', fontSize: '.63rem', marginTop: '2px' }}>
                    {event.summary} • {event.sourceId}
                  </div>
                </div>
                <div style={{ color: '#94A3B8', fontSize: '.6rem', whiteSpace: 'nowrap' }}>
                  {new Date(event.observedAt).toLocaleString('tr-TR')}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: 'grid', gap: '12px', alignContent: 'start' }}>
          <section
            style={{
              background: '#050B16',
              borderRadius: '9px',
              border: '1px solid rgba(245,158,11,.2)',
              padding: '10px',
            }}
          >
            <h3 style={{ margin: 0, color: '#FBBF24', fontSize: '.75rem' }}>
              GERÇEK KAYNAKLAR
            </h3>
            {snapshot.sources.map((source) => (
              <div
                key={source.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '8px 0',
                  borderTop: '1px solid rgba(148,163,184,.1)',
                  fontSize: '.69rem',
                }}
              >
                <div>
                  <div>{source.name}</div>
                  <div style={{ color: '#64748B' }}>{source.eventCount} kayıt</div>
                </div>
                <span style={{ color: source.status === 'online' ? '#4ADE80' : '#F87171' }}>
                  {source.status.toUpperCase()}
                </span>
              </div>
            ))}
          </section>

          <section
            style={{
              background: '#050B16',
              borderRadius: '9px',
              border: '1px solid rgba(34,197,94,.2)',
              padding: '10px',
            }}
          >
            <h3 style={{ margin: 0, color: '#4ADE80', fontSize: '.75rem' }}>
              AKTİF DİNAMİK AJANLAR
            </h3>
            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {snapshot.agents.slice(0, 25).map((agent) => (
                <div
                  key={agent.id}
                  style={{
                    display: 'flex',
                    gap: '7px',
                    padding: '6px 0',
                    borderTop: '1px solid rgba(148,163,184,.08)',
                    fontSize: '.67rem',
                  }}
                >
                  <span style={{ color: agent.status === 'active' ? '#4ADE80' : '#FBBF24' }}>
                    ●
                  </span>
                  <div>
                    <div>{agent.name}</div>
                    <div style={{ color: '#64748B' }}>{agent.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div style={{ marginTop: '10px', color: '#64748B', fontSize: '.65rem' }}>
        Son başarılı güncelleme:{' '}
        {snapshot.lastUpdatedAt
          ? new Date(snapshot.lastUpdatedAt).toLocaleString('tr-TR')
          : 'Henüz yok'}
      </div>
    </div>
  );
}
