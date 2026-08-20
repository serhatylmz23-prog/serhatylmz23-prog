import React, { useState } from 'react';
import { SyMasterCore } from './SyMasterCore';
import { SyWorldMonitorCore } from './SyWorldMonitorCore';
import { SyDTSECore } from './SyDTSECore';
import { SyFrameVisionAnalyzer } from './SyFrameVisionAnalyzer';
import { SyHeritageGlobalCore } from './SyHeritageGlobalCore';
import { SyAgentSwarmDashboard } from './SyAgentSwarmDashboard';
import { SyMediaUpload } from './SyMediaUpload';
import { SyEcosystemDashboard } from '../data/SyEcosystemDashboard';
import { KasifAssistant } from '../kasif_asistan';

type SekmeId =
  | 'KONSOL'
  | 'DUNYA'
  | 'DTSE'
  | 'GORUNTU'
  | 'MIRAS'
  | 'AJANLAR'
  | 'MEDYA'
  | 'EKOSISTEM';

const SEKMELER: { id: SekmeId; ad: string; ikon: string }[] = [
  { id: 'KONSOL', ad: 'Ana Konsol', ikon: '⚜️' },
  { id: 'DUNYA', ad: 'Dünya Monitörü', ikon: '🌍' },
  { id: 'DTSE', ad: 'DTSE Tarama', ikon: '🧊' },
  { id: 'GORUNTU', ad: 'Görüntü Analizi', ikon: '👁️' },
  { id: 'MIRAS', ad: 'Miras Küresel', ikon: '🏛️' },
  { id: 'AJANLAR', ad: 'Ajan Ağı', ikon: '🛰️' },
  { id: 'MEDYA', ad: 'Medya Merkezi', ikon: '📁' },
  { id: 'EKOSISTEM', ad: 'Ekosistem', ikon: '📊' },
];

/**
 * SyAppShell — Uygulamanın tek giriş noktası.
 *
 * Bu dosyadan önce src/main.jsx doğrudan <SyMasterCore /> render ediyordu ve
 * projede yazılmış olan aşağıdaki bileşenlerin HİÇBİRİ hiçbir yerden import
 * edilmiyordu (yani kullanıcı arayüzünde asla görünmüyorlardı):
 *   - SyWorldMonitorCore, SyDTSECore, SyFrameVisionAnalyzer,
 *     SyHeritageGlobalCore, SyAgentSwarmDashboard, SyMediaUpload,
 *     SyEcosystemDashboard, KasifAssistant (kasif_asistan.tsx)
 *
 * Bu kabuk, sekmeli bir navigasyon ekleyerek hepsini erişilebilir hale getirir.
 * KÂŞİF sesli/metinli asistan paneli tüm sekmelerde sabit kalır.
 */
export const SyAppShell: React.FC = () => {
  const [aktifSekme, setAktifSekme] = useState<SekmeId>('KONSOL');

  return (
    <div style={{ backgroundColor: '#020611', minHeight: '100vh' }}>
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          padding: '8px 12px',
          backgroundColor: '#05080f',
          borderBottom: '1px solid #1e293b',
          position: 'sticky',
          top: 0,
          zIndex: 500,
        }}
      >
        {SEKMELER.map((s) => (
          <button
            key={s.id}
            onClick={() => setAktifSekme(s.id)}
            style={{
              padding: '6px 12px',
              backgroundColor: aktifSekme === s.id ? '#0284c7' : '#0f172a',
              border: `1px solid ${aktifSekme === s.id ? '#38bdf8' : '#334155'}`,
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            {s.ikon} {s.ad}
          </button>
        ))}
      </nav>

      <div style={{ padding: '10px 10px 0 10px' }}>
        <KasifAssistant />
      </div>

      <div style={{ padding: '0 10px 10px 10px' }}>
        {aktifSekme === 'KONSOL' && <SyMasterCore />}
        {aktifSekme === 'DUNYA' && <SyWorldMonitorCore />}
        {aktifSekme === 'DTSE' && <SyDTSECore />}
        {aktifSekme === 'GORUNTU' && <SyFrameVisionAnalyzer />}
        {aktifSekme === 'MIRAS' && <SyHeritageGlobalCore />}
        {aktifSekme === 'AJANLAR' && <SyAgentSwarmDashboard />}
        {aktifSekme === 'MEDYA' && <SyMediaUpload />}
        {aktifSekme === 'EKOSISTEM' && <SyEcosystemDashboard />}
      </div>
    </div>
  );
};
