import React, { useState } from 'react';

export const SyMediaVerificationCore: React.FC<{
  medyaUrl?: string | null;
}> = ({ medyaUrl }) => {
  const [bilgi, setBilgi] = useState<string | null>(null);

  const adliTaramaBaslat = () => {
    if (!medyaUrl) return;
    setBilgi(
      'Bu sürümde tersine görsel arama, EXIF doğrulama ve ELA analizi için bir adli medya servisi bağlı değil. Sahte bir orijinallik puanı üretilmedi.'
    );
  };

  return (
    <div
      style={{
        backgroundColor: '#070e1c',
        border: '1px solid #1e293b',
        borderRadius: '8px',
        padding: '12px',
        color: '#fff',
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        marginTop: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '6px',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '1rem' }}>🛡️</span>
          <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>
            ADLİ MEDYA DOĞRULAMA
          </span>
        </div>
        <button
          type="button"
          onClick={adliTaramaBaslat}
          disabled={!medyaUrl}
          style={{
            padding: '4px 10px',
            backgroundColor: medyaUrl ? '#334155' : '#1e293b',
            border: '1px solid #64748b',
            borderRadius: '4px',
            color: '#e2e8f0',
            cursor: medyaUrl ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '0.7rem',
          }}
        >
          Entegrasyon Durumunu Göster
        </button>
      </div>

      {!medyaUrl && (
        <div style={{ color: '#64748b', textAlign: 'center', padding: '8px' }}>
          Doğrulama için medya yükleyin.
        </div>
      )}

      {medyaUrl && !bilgi && (
        <div style={{ color: '#fbbf24', lineHeight: 1.5 }}>
          Doğrulama altyapısı bağlı değil; bu panel orijinallik iddiasında bulunmaz.
        </div>
      )}

      {bilgi && (
        <div
          role="status"
          style={{
            padding: '9px',
            color: '#fde68a',
            backgroundColor: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: '6px',
            lineHeight: 1.5,
          }}
        >
          {bilgi}
        </div>
      )}
    </div>
  );
};
