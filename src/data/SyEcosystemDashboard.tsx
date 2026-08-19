import React, { useState } from 'react';
import { SY_ECOSYSTEM_DATA, STATE_COLORS } from './sykasifEcosystem';
import type { SyCategoryItem, SyState } from './sykasifEcosystem';

export const SyEcosystemDashboard: React.FC = () => {
  const [data, setData] = useState(SY_ECOSYSTEM_DATA);
  const [aktifKategori, setAktifKategori] = useState<string>('CİHAZLAR VE SENSÖRLER');

  const handleBadgeClick = (item: SyCategoryItem) => {
    const durumSirasi: SyState[] = ['PASIF', 'AKTIF', 'ISLENIYOR', 'TAMAMLANDI', 'UYARI', 'KRITIK'];
    const yeniDurum = durumSirasi[(durumSirasi.indexOf(item.state) + 1) % durumSirasi.length];

    setData((prev) => ({
      ...prev,
      [aktifKategori]: prev[aktifKategori].map((it) =>
        it.id === item.id ? { ...it, state: yeniDurum } : it
      ),
    }));

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const mesaj = `${item.name} durumu ${yeniDurum.toLowerCase()} olarak güncellendi.`;
      const ut = new SpeechSynthesisUtterance(mesaj);
      ut.lang = 'tr-TR';
      ut.rate = 1.1;
      window.speechSynthesis.speak(ut);
    }
  };

  return (
    <div style={{
      backgroundColor: '#030712',
      border: '1px solid rgba(217, 119, 6, 0.3)',
      borderRadius: '12px',
      padding: '16px',
      color: '#fff',
      maxWidth: '850px',
      margin: '12px auto',
      boxShadow: '0 0 30px rgba(0,0,0,0.8)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '0.15em', color: '#f59e0b' }}>
            SYKAŞİF DİNAMİK EKOSİSTEM
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>TEK MÜHÜR • TEK DİL • TEK EKOSİSTEM</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
        {Object.keys(data).map((kat) => (
          <button
            key={kat}
            onClick={() => setAktifKategori(kat)}
            style={{
              padding: '6px 12px',
              backgroundColor: aktifKategori === kat ? 'rgba(245, 158, 11, 0.2)' : 'rgba(15, 23, 42, 0.8)',
              border: `1px solid ${aktifKategori === kat ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '6px',
              color: aktifKategori === kat ? '#fbbf24' : '#94a3b8',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {kat}
          </button>
        ))}
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px',
        backgroundColor: '#080d1a',
        padding: '16px',
        borderRadius: '8px',
      }}>
        {data[aktifKategori].map((item) => {
          const currentTheme = STATE_COLORS[item.state];
          return (
            <div
              key={item.id}
              onClick={() => handleBadgeClick(item)}
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                margin: '6px',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '4px' }}>
                {item.id}. {item.name}
              </span>
              <div style={{
                position: 'relative',
                width: '95px',
                height: '95px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #09101f 0%, #030712 100%)',
                border: `2px solid ${currentTheme.ring}`,
                boxShadow: `0 0 14px ${currentTheme.glow}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}>
                <span style={{ color: currentTheme.text, fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {item.value || '●'}
                </span>
                <div style={{
                  position: 'absolute',
                  bottom: '-6px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#0f172a',
                  border: `1.5px solid ${currentTheme.ring}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6rem',
                  fontWeight: '900',
                  color: '#f59e0b',
                }}>
                  S
                </div>
              </div>
              <div style={{ display: 'flex', gap: '3px', marginTop: '8px' }}>
                {(['PASIF', 'AKTIF', 'ISLENIYOR', 'TAMAMLANDI', 'UYARI', 'KRITIK'] as SyState[]).map((st) => (
                  <span
                    key={st}
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: item.state === st ? STATE_COLORS[st].ring : '#334155',
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};