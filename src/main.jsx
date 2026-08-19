import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { KasifAssistant } from './kasif_asistan';
import { SyWorldMonitorCore } from './components/SyWorldMonitorCore';
import { SyDTSECore } from './components/SyDTSECore';
import { SyAgentSwarmDashboard } from './components/SyAgentSwarmDashboard';

function App() {
  const [sekme, setSekme] = useState('HARITA_GIS'); // 'HARITA_GIS' | 'DTSE' | 'AJANLAR'

  const butonStili = (aktif) => ({
    padding: '8px 14px',
    backgroundColor: aktif ? '#0284c7' : '#0f172a',
    border: `1px solid ${aktif ? '#38bdf8' : '#334155'}`,
    borderRadius: '6px',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.78rem',
    transition: 'all 0.15s ease'
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#040711', color: '#fff', fontFamily: 'monospace', padding: '12px' }}>
      
      {/* ÜST STANDART GEZİNTİ ÇUBUĞU */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto 12px auto', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#38bdf8', letterSpacing: '0.05em' }}>
            SyKaşif Heritage Edition
          </h1>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
            TÜRKİYE TAKTİK GIS, MTA JEOLOJİ & DTSE DİJİTAL İKİZ SİSTEMİ
          </span>
        </div>

        {/* EŞİT STANDARTTA BUTONLAR */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setSekme('HARITA_GIS')} style={butonStili(sekme === 'HARITA_GIS')}>
            🗺️ TÜRKİYE GIS HARİTA KATMANI
          </button>

          <button onClick={() => setSekme('DTSE')} style={butonStili(sekme === 'DTSE')}>
            🧭 DTSE 7 AŞAMALI DİJİTAL İKİZ
          </button>

          <button onClick={() => setSekme('AJANLAR')} style={butonStili(sekme === 'AJANLAR')}>
            🛰️ AJAN İSTİHBARAT (SWARM)
          </button>
        </div>
      </header>

      {/* ANA ÇALIŞMA KATMANI */}
      <main style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <KasifAssistant />

        {/* Katman Render */}
        {sekme === 'HARITA_GIS' && <SyWorldMonitorCore />}
        {sekme === 'DTSE' && <SyDTSECore />}
        {sekme === 'AJANLAR' && <SyAgentSwarmDashboard />}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);