import React, { useEffect, useState } from 'react';

interface SaglayiciDurumu {
  id: string;
  ad: string;
  yapilandirildi: boolean;
  not: string;
}

interface DurumYaniti {
  generatedAt: string;
  aktifMetinSaglayici: string;
  providers: SaglayiciDurumu[];
}

// Bu bileşen HİÇBİR sayı uydurmaz. /api/system-status yalnızca "yapılandırıldı
// mı?" (true/false) döndürür; anahtar değerleri asla istemciye gitmez.
// Amaç: SyMasterCore ve benzeri panellerdeki "AKTİF TARAMA / %98,4 güven"
// tarzı sahte rozetlerin yerini gerçek, doğrulanabilir bir duruma bırakması.
export const SySistemDurumu: React.FC = () => {
  const [durum, setDurum] = useState<DurumYaniti | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const yanit = await fetch('/api/system-status');
        if (!yanit.ok) throw new Error(`Sunucu HTTP ${yanit.status} döndürdü.`);
        const veri = (await yanit.json()) as DurumYaniti;
        if (!iptal) setDurum(veri);
      } catch (err) {
        if (!iptal) {
          setHata(
            err instanceof Error
              ? err.message
              : 'Sistem durumu alınamadı (yerel geliştirmede "npm run dev" çalışıyor mu?).'
          );
        }
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    })();
    return () => {
      iptal = true;
    };
  }, []);

  return (
    <div
      style={{
        backgroundColor: '#070e1c',
        border: '1px solid #1e293b',
        borderRadius: '8px',
        padding: '10px',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '6px',
          marginBottom: '8px',
        }}
      >
        <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.8rem' }}>
          🔌 AI / SES / HARİTA SAĞLAYICI DURUMU
        </span>
        <span style={{ color: '#64748b', fontSize: '0.6rem' }}>
          Anahtar DEĞERLERİ asla gösterilmez — yalnızca var/yok bilgisi
        </span>
      </div>

      {yukleniyor && (
        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Durum kontrol ediliyor…</div>
      )}

      {hata && (
        <div
          style={{
            padding: '6px 8px',
            backgroundColor: '#450a0a',
            border: '1px solid #ef4444',
            borderRadius: '4px',
            color: '#fca5a5',
            fontSize: '0.65rem',
          }}
        >
          ⚠️ {hata}
        </div>
      )}

      {durum && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
          {durum.providers.map((p) => (
            <div
              key={p.id}
              style={{
                backgroundColor: '#030712',
                border: `1px solid ${p.yapilandirildi ? '#22c55e' : '#334155'}`,
                borderRadius: '6px',
                padding: '8px',
                fontSize: '0.68rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: '#e2e8f0' }}>{p.ad}</strong>
                <span style={{ color: p.yapilandirildi ? '#4ade80' : '#94a3b8', fontWeight: 'bold' }}>
                  {p.yapilandirildi ? 'YAPILANDIRILDI' : 'YAPILANDIRILMADI'}
                </span>
              </div>
              <div style={{ color: '#64748b', fontSize: '0.62rem', marginTop: '2px' }}>{p.not}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
