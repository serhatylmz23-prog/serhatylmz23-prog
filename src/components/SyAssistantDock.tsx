import { useState } from 'react';
import { KasifAssistant } from '../kasif_asistan';

export function SyAssistantDock() {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        right: 18,
        bottom: 16,
        zIndex: 3500,
        width: open ? 'min(900px, calc(100vw - 36px))' : 'auto',
      }}
    >
      {open && (
        <div
          style={{
            maxHeight: '72vh',
            overflowY: 'auto',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,.65)',
          }}
        >
          <KasifAssistant />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={{
          display: 'block',
          marginLeft: 'auto',
          marginTop: '6px',
          padding: '10px 16px',
          borderRadius: '999px',
          border: '1px solid #22D3EE',
          background: open ? '#0F172A' : '#0E7490',
          color: '#FFF',
          cursor: 'pointer',
          fontWeight: 900,
          boxShadow: '0 0 24px rgba(34,211,238,.35)',
        }}
      >
        {open ? 'KÂŞİF’İ KAPAT' : '🎙️ KÂŞİF İLE KONUŞ'}
      </button>
    </div>
  );
}
