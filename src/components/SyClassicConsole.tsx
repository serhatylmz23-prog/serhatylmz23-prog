import React, { useState } from 'react';
import { SyMasterCore } from './SyMasterCore';
import { SyWorldMonitorCore } from './SyWorldMonitorCore';
import { SyDigitalTwinRuntime } from './SyDigitalTwinRuntime';
import { SyFrameVisionAnalyzer } from './SyFrameVisionAnalyzer';
import { SyHeritageGlobalCore } from './SyHeritageGlobalCore';
import { SyAgentSwarmDashboard } from './SyAgentSwarmDashboard';
import { SyMediaUpload } from './SyMediaUpload';
import { SyEcosystemDashboard } from '../data/SyEcosystemDashboard';

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
 * SyClassicConsole — projenin ilk sürümünde bulunan, sekmeli/panelli
 * "klasik" operasyon konsolu. SyMasterCore, SyWorldMonitorCore, SyDTSECore,
 * SyFrameVisionAnalyzer, SyHeritageGlobalCore, SyAgentSwarmDashboard,
 * SyMediaUpload, SyEcosystemDashboard ve KasifAssistant burada toplanır.
 *
 * Proje daha sonra yeni bir Harita + Çoklu Ajan Orkestrasyonu (SyMap +
 * SyContext + agents/) mimarisine geçtiği için bu dosya yeniden hiçbir
 * yerden import edilmiyordu; SyAppShell'e eklenen mod anahtarıyla tekrar
 * erişilebilir hale getirildi.
 */
const SyClassicConsole: React.FC = () => {
  const [aktifSekme, setAktifSekme] = useState<SekmeId>('KONSOL');

  return (
    <div style={{ backgroundColor: '#020611', minHeight: '100%', height: '100%', overflowY: 'auto' }}>
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

      <div
        role="status"
        style={{
          margin: '10px 10px 0',
          padding: '9px 12px',
          borderRadius: '7px',
          border: '1px solid rgba(245,158,11,0.55)',
          backgroundColor: 'rgba(245,158,11,0.1)',
          color: '#fde68a',
          fontSize: '0.75rem',
          lineHeight: 1.5,
        }}
      >
        <strong>KAPSAM UYARISI:</strong> Ana Konsol ve eski görsel panellerdeki
        sabit sensör değerleri demo verisidir. “DTSE Tarama”, Harita modundaki
        Canlı Ekosistem ve KÂŞİF bağlantıları gerçek servis durumunu gösterir.
      </div>

      <div style={{ padding: '10px' }}>
        {aktifSekme === 'KONSOL' && <SyMasterCore />}
        {aktifSekme === 'DUNYA' && <SyWorldMonitorCore />}
        {aktifSekme === 'DTSE' && <SyDigitalTwinRuntime />}
        {aktifSekme === 'GORUNTU' && <SyFrameVisionAnalyzer />}
        {aktifSekme === 'MIRAS' && <SyHeritageGlobalCore />}
        {aktifSekme === 'AJANLAR' && <SyAgentSwarmDashboard />}
        {aktifSekme === 'MEDYA' && <SyMediaUpload />}
        {aktifSekme === 'EKOSISTEM' && <SyEcosystemDashboard />}
      </div>
    </div>
  );
};

export default SyClassicConsole;
