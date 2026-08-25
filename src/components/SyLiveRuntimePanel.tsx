import { useState } from 'react';
import { useLiveRuntime } from './context/useLiveRuntime';

const STATUS_COLOR = {
  active: '#22C55E',
  syncing: '#38BDF8',
  waiting: '#94A3B8',
  error: '#EF4444',
};

export function SyLiveRuntimePanel() {
  const {
    snapshot,
    connected,
    loading,
    error,
    refresh,
    decide,
  } = useLiveRuntime();
  const [expanded, setExpanded] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState(
    () => sessionStorage.getItem('sykasif-runtime-admin-token') || ''
  );

  return (
    <section
      style={{
        marginBottom: '18px',
        padding: '10px',
        borderRadius: '8px',
        border: `1px solid ${connected ? 'rgba(34,197,94,.4)' : 'rgba(245,158,11,.4)'}`,
        background: 'rgba(2,6,23,.65)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div>
          <div style={{ color: '#67E8F9', fontSize: '12px', fontWeight: 800 }}>
            CANLI EKOSİSTEM
          </div>
          <div
            style={{
              marginTop: '3px',
              color: connected ? '#4ADE80' : '#FBBF24',
              fontSize: '10px',
            }}
          >
            ● {connected ? 'SSE BAĞLI' : loading ? 'BAĞLANIYOR' : 'PERİYODİK TARAMA / CANLI AKIŞ AKTİF'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          style={{
            border: '1px solid #155E75',
            background: '#083344',
            color: '#A5F3FC',
            borderRadius: '5px',
            padding: '5px 7px',
            cursor: loading ? 'wait' : 'pointer',
            fontSize: '10px',
          }}
        >
          {loading ? '...' : 'YENİLE'}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: '8px',
            padding: '6px',
            borderRadius: '5px',
            color: '#FCA5A5',
            background: 'rgba(127,29,29,.35)',
            fontSize: '10px',
            lineHeight: 1.4,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '6px',
          marginTop: '9px',
        }}
      >
        {[
          ['AKTİF AJAN', snapshot.metrics.activeAgents, '#4ADE80'],
          ['CANLI OLAY', snapshot.metrics.liveEvents, '#38BDF8'],
          ['KAYNAK', snapshot.metrics.onlineSources, '#FBBF24'],
          ['ONAY', snapshot.metrics.pendingApprovals, '#C084FC'],
        ].map(([label, value, color]) => (
          <div
            key={String(label)}
            style={{
              padding: '7px',
              background: 'rgba(15,23,42,.8)',
              borderRadius: '5px',
              border: '1px solid rgba(148,163,184,.12)',
            }}
          >
            <div style={{ color: '#64748B', fontSize: '8px' }}>{label}</div>
            <div style={{ color: String(color), fontSize: '16px', fontWeight: 900 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        style={{
          width: '100%',
          marginTop: '8px',
          border: 0,
          background: 'transparent',
          color: '#93C5FD',
          cursor: 'pointer',
          fontSize: '10px',
        }}
      >
        {expanded ? 'AYRINTILARI KAPAT ▲' : 'AJAN VE KAYNAKLAR ▼'}
      </button>

      {expanded && (
        <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
          <div style={{ color: '#94A3B8', fontSize: '9px', margin: '5px 0' }}>
            GÜVENİLİR KAYNAKLAR
          </div>
          {snapshot.sources.map((source) => (
            <div
              key={source.id}
              style={{
                padding: '6px 0',
                borderTop: '1px solid rgba(148,163,184,.1)',
                fontSize: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{source.name}</span>
                <span
                  style={{
                    color:
                      source.status === 'ONLINE / ÇEVRİMİÇİ'
                        ? '#4ADE80'
                        : source.status === 'ERROR / BAĞLANTI HATASI'
                          ? '#F87171'
                          : '#38BDF8',
                  }}
                >
                  {source.status.toUpperCase()}
                </span>
              </div>
              <div style={{ color: '#64748B', marginTop: '2px' }}>
                {source.eventCount} kayıt
                {source.error ? ` • ${source.error}` : ''}
              </div>
            </div>
          ))}

          <div style={{ color: '#94A3B8', fontSize: '9px', margin: '9px 0 4px' }}>
            DİNAMİK AJANLAR
          </div>
          {snapshot.agents.slice(0, 15).map((agent) => (
            <div
              key={agent.id}
              style={{
                display: 'flex',
                gap: '6px',
                padding: '5px 0',
                borderTop: '1px solid rgba(148,163,184,.08)',
                fontSize: '9px',
              }}
            >
              <span style={{ color: STATUS_COLOR[agent.status] }}>●</span>
              <span style={{ color: '#CBD5E1' }}>{agent.name}</span>
            </div>
          ))}
          {snapshot.agents.length > 15 && (
            <div style={{ color: '#64748B', fontSize: '9px', marginTop: '4px' }}>
              +{snapshot.agents.length - 15} ajan daha
            </div>
          )}
        </div>
      )}

      {snapshot.approvals.length > 0 && (
        <div style={{ marginTop: '9px' }}>
          <div style={{ color: '#E9D5FF', fontSize: '9px' }}>ONAY KUYRUĞU</div>
          <input
            type="password"
            value={adminToken}
            onChange={(event) => {
              const value = event.target.value;
              setAdminToken(value);
              sessionStorage.setItem('sykasif-runtime-admin-token', value);
            }}
            placeholder="Cloudflare ADMIN_TOKEN"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              marginTop: '5px',
              padding: '5px',
              fontSize: '9px',
            }}
          />
          {snapshot.approvals.map((approval) => (
            <div
              key={approval.id}
              style={{
                marginTop: '5px',
                padding: '7px',
                borderRadius: '5px',
                background: 'rgba(88,28,135,.25)',
              }}
            >
              <div style={{ fontSize: '10px' }}>{approval.title}</div>
              <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                <button
                  type="button"
                  onClick={() =>
                    void decide(approval.id, 'approved').catch((caught) =>
                      setDecisionError(
                        caught instanceof Error ? caught.message : 'Onay başarısız.'
                      )
                    )
                  }
                >
                  Onayla
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void decide(approval.id, 'rejected').catch((caught) =>
                      setDecisionError(
                        caught instanceof Error ? caught.message : 'Ret başarısız.'
                      )
                    )
                  }
                >
                  Reddet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {decisionError && (
        <div style={{ color: '#FCA5A5', fontSize: '9px', marginTop: '5px' }}>
          {decisionError}
        </div>
      )}
    </section>
  );
}
