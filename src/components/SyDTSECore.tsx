import React, { useState } from 'react';

export const SyDTSECore: React.FC = () => {
  const [aktifAsama, setAktifAsama] = useState<number>(3); // 1: Algılama ... 7: Rapor
  const [seciliKatmanlar, setSeciliKatmanlar] = useState<Record<string, boolean>>({
    noktaBulutu: true,
    mesh: true,
    yuzeyModeli: true,
    renkHaritasi: false,
    oyuklar: true,
    kanallar: true,
    catlaklar: true,
    mineralDamar: true,
    egimAnalizi: true,
    puruzluluk: true,
    termal: false,
    spektral: false,
    nemHaritasi: false
  });

  const katmanToggle = (key: string) => {
    setSeciliKatmanlar(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const asamalar = [
    { no: 1, ad: 'ALGILAMA', yuzde: '%12' },
    { no: 2, ad: 'NOKTA BULUTU', yuzde: '%35' },
    { no: 3, ad: 'ADAPTİF MESH', yuzde: '%58' },
    { no: 4, ad: 'YÜZEY OLUŞUMU', yuzde: '%76' },
    { no: 5, ad: 'RENKLENDİRME', yuzde: '%91' },
    { no: 6, ad: 'ANALİZ KATLARI', yuzde: '%97' },
    { no: 7, ad: 'SONUÇ & RAPOR', yuzde: '%100' }
  ];

  return (
    <div style={{ backgroundColor: '#030712', color: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b', fontFamily: 'monospace', minHeight: '90vh' }}>
      
      {/* ÜST BAŞLIK VE LOGO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '1.6rem', color: '#f59e0b' }}>🧭</div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#f8fafc', letterSpacing: '0.08em' }}>
              SYK DIGITAL TWIN SURFACE ENGINE (DTSE)
            </div>
            <div style={{ fontSize: '0.7rem', color: '#38bdf8' }}>
              TAŞ YÜZEY ZEKA VE DİJİTAL İKİZ KANAL/OYUK ANALİZ MOTORU
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#64748b' }}>
          <div>KAYIT KODU: <span style={{ color: '#38bdf8' }}>SYK-DTSE-2026-0524-0017</span></div>
          <div>DURUM: <span style={{ color: '#22c55e' }}>● RTK FIX 3D TARAMA AKTİF</span></div>
        </div>
      </div>

      {/* 7 AŞAMALI AKILLI YÜZEY ANALİZ ŞERİDİ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '14px' }}>
        {asamalar.map((as) => (
          <div
            key={as.no}
            onClick={() => setAktifAsama(as.no)}
            style={{
              backgroundColor: aktifAsama === as.no ? 'rgba(56, 189, 248, 0.18)' : '#081120',
              border: `1px solid ${aktifAsama === as.no ? '#38bdf8' : '#1e293b'}`,
              borderRadius: '6px',
              padding: '6px 4px',
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: '0.65rem', color: aktifAsama === as.no ? '#38bdf8' : '#94a3b8', fontWeight: 'bold' }}>
              {as.no} {as.ad}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '2px' }}>{as.yuzde}</div>
          </div>
        ))}
      </div>

      {/* ANA GÖVDE: SOL MENÜ / MERKEZ KANVAS / SAĞ KATMAN PANELİ */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 240px', gap: '12px' }}>
        
        {/* SOL: SİSTEM & KONTROL DURUMU */}
        <div style={{ backgroundColor: '#070d1a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ color: '#38bdf8', fontWeight: 'bold', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
            CANLI ANALİZ EKRANI
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button style={{ padding: '6px', backgroundColor: '#0284c7', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '0.7rem', cursor: 'pointer', textAlign: 'left' }}>
              🎯 Gerçek Zamanlı Tarama
            </button>
            <button style={{ padding: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#94a3b8', fontSize: '0.7rem', cursor: 'pointer', textAlign: 'left' }}>
              🔄 3D Döndür / Yaklaştır
            </button>
            <button style={{ padding: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#94a3b8', fontSize: '0.7rem', cursor: 'pointer', textAlign: 'left' }}>
              📐 Ölçüm (Mesafe/Hacim)
            </button>
          </div>

          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '8px', color: '#94a3b8', fontSize: '0.68rem', display: 'grid', gap: '4px' }}>
            <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>SİSTEM DURUMU</div>
            <div>Sensörler: <span style={{ color: '#22c55e' }}>● 9/9 Aktif</span></div>
            <div>Konum: <span style={{ color: '#fbbf24' }}>Bağıl Geometrik (GPS Yok)</span></div>
            <div>FPS: <span style={{ color: '#38bdf8' }}>30.0 FPS</span></div>
            <div>Sıcaklık: <span style={{ color: '#38bdf8' }}>28.6 °C</span></div>
            <div>Batarya: <span style={{ color: '#22c55e' }}>%78</span></div>
          </div>
        </div>

        {/* ORTA: 3D DİJİTAL İKİZ KANVASI & ÇAPRAZ ÇAĞRI VEKTÖRLERİ */}
        <div style={{ backgroundColor: '#000', borderRadius: '8px', border: '1px solid #1e293b', position: 'relative', minHeight: '460px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Arka Plan Mesh Izgarası */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(56, 189, 248, 0.15) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          {/* Taş Yüzeyi Üzerindeki DTSE Telemetri Etiketleri (Görsel 2 Birebir) */}
          <div style={{ position: 'absolute', top: '15%', left: '15%', backgroundColor: 'rgba(7, 13, 26, 0.85)', border: '1px solid #38bdf8', padding: '6px 10px', borderRadius: '6px', fontSize: '0.68rem' }}>
            <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>OYUK-01</div>
            <div>Çap: 2.34 cm</div>
            <div>Derinlik: 0.78 cm</div>
            <div style={{ color: '#22c55e' }}>Güven: %99.2</div>
          </div>

          <div style={{ position: 'absolute', top: '42%', left: '12%', backgroundColor: 'rgba(7, 13, 26, 0.85)', border: '1px solid #06b6d4', padding: '6px 10px', borderRadius: '6px', fontSize: '0.68rem' }}>
            <div style={{ color: '#06b6d4', fontWeight: 'bold' }}>KANAL-02 (TAHLİYE AKARI)</div>
            <div>Genişlik: 1.12 cm | Derinlik: 0.53 cm</div>
            <div style={{ color: '#f59e0b' }}>Yön: 128° Güneydoğu</div>
            <div style={{ color: '#22c55e' }}>Güven: %98.7</div>
          </div>

          <div style={{ position: 'absolute', bottom: '15%', left: '15%', backgroundColor: 'rgba(7, 13, 26, 0.85)', border: '1px solid #ef4444', padding: '6px 10px', borderRadius: '6px', fontSize: '0.68rem' }}>
            <div style={{ color: '#ef4444', fontWeight: 'bold' }}>ÇATLAK-03 (DOĞAL AYRIM)</div>
            <div>Uzunluk: 14.6 cm | Açıklık: 0.3-1.2 mm</div>
            <div style={{ color: '#22c55e' }}>İnsan İzi Değil (Doğal Faylanma)</div>
          </div>

          <div style={{ position: 'absolute', top: '15%', right: '15%', backgroundColor: 'rgba(7, 13, 26, 0.85)', border: '1px solid #f59e0b', padding: '6px 10px', borderRadius: '6px', fontSize: '0.68rem' }}>
            <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>YÜZEY AŞINIMI</div>
            <div>Orta - Yüksek Derece</div>
            <div>Pürüzlülük: 0.62 mm</div>
          </div>

          <div style={{ position: 'absolute', top: '45%', right: '12%', backgroundColor: 'rgba(7, 13, 26, 0.85)', border: '1px solid #a855f7', padding: '6px 10px', borderRadius: '6px', fontSize: '0.68rem' }}>
            <div style={{ color: '#a855f7', fontWeight: 'bold' }}>MİNERAL DAMAR</div>
            <div>Kuvars / Kalsit Dolgulu</div>
            <div>Genişlik: 0.2 - 1.8 cm</div>
          </div>

          {/* VİDEO 7: HEDEF VEKTÖRÜ (5-7 METRE KURALI) */}
          <div style={{ position: 'absolute', bottom: '14px', right: '14px', backgroundColor: 'rgba(2, 6, 23, 0.92)', border: '1px solid #22c55e', padding: '8px 12px', borderRadius: '6px', fontSize: '0.72rem', maxWidth: '320px' }}>
            <div style={{ color: '#22c55e', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🧭</span> VEKTÖREL HEDEF ÇÖZÜMLEMESİ (7. VİDEO KURALI)
            </div>
            <div style={{ color: '#cbd5e1', marginTop: '4px', lineHeight: '1.3' }}>
              ⚠️ <strong>Hata Uyarısı:</strong> Ana odak taşın altı değildir. Kanal-02 tahliye akarı istikametinde (128°) <strong>5.40 - 7.00 metre</strong> mesafeye odaklanılmalıdır.
            </div>
          </div>
        </div>

        {/* SAĞ: KATMAN YÖNETİMİ & MİLİMETRİK ÖLÇÜMLER */}
        <div style={{ backgroundColor: '#070d1a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#38bdf8', fontWeight: 'bold', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '8px' }}>
              KATMAN YÖNETİMİ
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.keys(seciliKatmanlar).map((k) => (
                <div
                  key={k}
                  onClick={() => katmanToggle(k)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    backgroundColor: seciliKatmanlar[k] ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    cursor: 'pointer',
                    color: seciliKatmanlar[k] ? '#fff' : '#64748b'
                  }}
                >
                  <span>{k.toUpperCase()}</span>
                  <span>{seciliKatmanlar[k] ? '👁️' : '🕶️'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ANA ÖLÇÜMLER */}
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '8px', marginTop: '8px' }}>
            <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '4px' }}>ANA ÖLÇÜMLER</div>
            <div style={{ display: 'grid', gap: '2px', color: '#cbd5e1' }}>
              <div>Yüzey Alanı: <strong style={{ color: '#38bdf8' }}>1.842 m²</strong></div>
              <div>Hacim: <strong style={{ color: '#38bdf8' }}>0.213 m³</strong></div>
              <div>Min/Maks Derinlik: <strong style={{ color: '#38bdf8' }}>-2.34 / 3.12 cm</strong></div>
              <div>Ort. Pürüzlülük: <strong style={{ color: '#38bdf8' }}>0.62 mm</strong></div>
              <div>Güven Skoru: <strong style={{ color: '#22c55e' }}>%98.6</strong></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};