import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { KasifAssistant } from './kasif_asistan';
import { SyWorldMonitorCore } from './components/SyWorldMonitorCore';
import { SyFrameVisionAnalyzer } from './components/SyFrameVisionAnalyzer';
import { SyAgentSwarmDashboard } from './components/SyAgentSwarmDashboard';
import { SyEcosystemDashboard } from './data/SyEcosystemDashboard';

function App() {
  const [sekme, setSekme] = useState('HERITAGE'); // 'HERITAGE' | 'AJANLAR' | 'EKOSISTEM'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#040711', color: '#fff', fontFamily: 'Arial, sans-serif', padding: '16px' }}>
      {/* ÜST GEZİNTİ VE LOGO ÇUBUĞU */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto 16px auto', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#38bdf8', letterSpacing: '0.05em' }}>
            SyKaşif Heritage Edition
          </h1>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            ARKEOLOJİ, JEOLOJİ, ASTRONOMİ VE OSINT ÇAPRAZ İSTİHBARAT SİSTEMİ
          </span>
        </div>

        {/* MODÜL GEÇİŞ BUTONLARI */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setSekme('HERITAGE')}
            style={{
              padding: '8px 14px',
              backgroundColor: sekme === 'HERITAGE' ? '#0284c7' : '#0f172a',
              border: '1px solid #38bdf8',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            🎯 KANIT & ANOMALİ (EDS)
          </button>

          <button
            onClick={() => setSekme('AJANLAR')}
            style={{
              padding: '8px 14px',
              backgroundColor: sekme === 'AJANLAR' ? '#0284c7' : '#0f172a',
              border: '1px solid #38bdf8',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            🛰️ AJAN İSTİHBARAT (SWARM)
          </button>

          <button
            onClick={() => setSekme('EKOSISTEM')}
            style={{
              padding: '8px 14px',
              backgroundColor: sekme === 'EKOSISTEM' ? '#0284c7' : '#0f172a',
              border: '1px solid #38bdf8',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            📊 TELEMETRİ ROZETLERİ
          </button>
        </div>
      </header>

      {/* MERKEZİ KONTROL ALANI */}
      <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Asistan Komuta Kutusu Her Zaman Üstte Hazır */}
        <KasifAssistant />

        {/* Seçilen Sekmeye Göre Ekran Değişimi */}
        {sekme === 'HERITAGE' && <SyFrameVisionAnalyzer />}
        {sekme === 'AJANLAR' && <SyAgentSwarmDashboard />}
        {sekme === 'EKOSISTEM' && <SyEcosystemDashboard />}
        {sekme === 'WORLDMONITOR' && <SyWorldMonitorCore />}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);