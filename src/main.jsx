import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { KasifAssistant } from './kasif_asistan';
import { SyEcosystemDashboard } from './data/SyEcosystemDashboard';
import { SyMediaUpload } from './components/SyMediaUpload';

export function App() {
  const [pilYuzdesi, setPilYuzdesi] = useState(92);
  const [sarjdaMi, setSarjdaMi] = useState(false);
  const [gpsDurum, setGpsDurum] = useState('RTK FIX (±1.8 cm)');
  const [aktifModul, setAktifModul] = useState('KANIT & KARAR');

  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        setPilYuzdesi(Math.round(battery.level * 100));
        setSarjdaMi(battery.charging);
        battery.onlevelchange = () => setPilYuzdesi(Math.round(battery.level * 100));
        battery.onchargingchange = () => setSarjdaMi(battery.charging);
      });
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      {/* ÜST TELEMETRİ */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        borderBottom: '1px solid rgba(217, 119, 6, 0.3)',
        backgroundColor: '#050b14'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '2px solid #f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            color: '#f59e0b',
            boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)'
          }}>S</div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: '900', letterSpacing: '0.15em', color: '#f59e0b' }}>
              SyKaşif <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'normal' }}>HERITAGE EDITION</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>HAYALLER → GERÇEKLER</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
          <span style={{ color: '#38bdf8' }}>🛰️ {gpsDurum}</span>
          <span style={{ color: '#4ade80' }}>⚡ PİL: %{pilYuzdesi} {sarjdaMi ? '(ŞARJDA)' : ''}</span>
          <span style={{ color: '#f59e0b' }}>🌐 SİNYAL: %88 GÜÇLÜ</span>
        </div>
      </header>

      {/* ANA ÇALIŞMA ALANI */}
      <div style={{ display: 'flex', flex: 1, padding: '16px', gap: '16px', overflow: 'hidden' }}>
        {/* Sol Modül Menüsü */}
        <aside style={{
          width: '180px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: '#080d1a',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}>TEMEL MODÜLLER</div>
          {['KANIT & KARAR', 'HARİTALAR', 'JEO-RADAR', 'FREKANS', 'LİDAR', 'RAPORLAR'].map((m) => (
            <button
              key={m}
              onClick={() => setAktifModul(m)}
              style={{
                padding: '8px 12px',
                textAlign: 'left',
                backgroundColor: aktifModul === m ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                border: `1px solid ${aktifModul === m ? '#f59e0b' : 'transparent'}`,
                borderRadius: '6px',
                color: aktifModul === m ? '#fbbf24' : '#94a3b8',
                fontSize: '0.78rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {m}
            </button>
          ))}
        </aside>

        {/* Orta & Sağ Bölüm */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {/* Asistan */}
          <KasifAssistant />

          {/* Çoklu Medya & Kanıt Yükleme Modülü */}
          {aktifModul === 'KANIT & KARAR' && <SyMediaUpload />}

          {/* Dinamik Ekosistem İkonları */}
          <SyEcosystemDashboard />
        </main>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}