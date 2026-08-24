import React, { useState } from 'react';
import { SyDigitalTwinRuntime } from './SyDigitalTwinRuntime';
import { SyFrameVisionAnalyzer } from './SyFrameVisionAnalyzer';
import { SyMediaUpload } from './SyMediaUpload';
import { SyLiveOperationsDashboard } from './SyLiveOperationsDashboard';

type SekmeId = 'CANLI' | 'DTSE' | 'GORUNTU' | 'MEDYA';

const SEKMELER: { id: SekmeId; ad: string; ikon: string }[] = [
  { id: 'CANLI', ad: 'Canlı Operasyon', ikon: '🌐' },
  { id: 'DTSE', ad: 'Dijital İkiz', ikon: '🧊' },
  { id: 'GORUNTU', ad: 'EDS Görüntü Analizi', ikon: '👁️' },
  { id: 'MEDYA', ad: 'Medya Merkezi', ikon: '📁' },
];

const SyClassicConsole: React.FC = () => {
  const [aktifSekme, setAktifSekme] = useState<SekmeId>('CANLI');

  return (
    <div
      style={{
        backgroundColor: '#020611',
        minHeight: '100%',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          padding: '8px 12px',
          backgroundColor: '#05080F',
          borderBottom: '1px solid #1E293B',
          position: 'sticky',
          top: 0,
          zIndex: 500,
        }}
      >
        {SEKMELER.map((sekme) => (
          <button
            key={sekme.id}
            type="button"
            onClick={() => setAktifSekme(sekme.id)}
            style={{
              padding: '7px 13px',
              backgroundColor: aktifSekme === sekme.id ? '#0E7490' : '#0F172A',
              border: `1px solid ${aktifSekme === sekme.id ? '#22D3EE' : '#334155'}`,
              borderRadius: '6px',
              color: '#FFF',
              fontSize: '.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            {sekme.ikon} {sekme.ad}
          </button>
        ))}

        <div
          style={{
            marginLeft: 'auto',
            alignSelf: 'center',
            color: '#4ADE80',
            fontSize: '.68rem',
          }}
        >
          ● YALNIZCA GERÇEK SERVİS ÇIKTILARI
        </div>
      </nav>

      <div style={{ padding: '10px' }}>
        {aktifSekme === 'CANLI' && <SyLiveOperationsDashboard />}
        {aktifSekme === 'DTSE' && <SyDigitalTwinRuntime />}
        {aktifSekme === 'GORUNTU' && <SyFrameVisionAnalyzer />}
        {aktifSekme === 'MEDYA' && <SyMediaUpload />}
      </div>
    </div>
  );
};

export default SyClassicConsole;
