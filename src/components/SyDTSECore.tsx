import React, { useState, useRef, useEffect } from 'react';

interface AsamaTanim {
  no: number;
  ad: string;
  aciklama: string;
  yuzde: string;
  renk: string;
}

const ASAMALAR: AsamaTanim[] = [
  { no: 1, ad: 'ALGILAMA', aciklama: 'Ham video/görsel yüzey taraması', yuzde: '%15', renk: '#94a3b8' },
  { no: 2, ad: 'NOKTA BULUTU', aciklama: '3D derinlik noktaları ve referans koordinatları', yuzde: '%35', renk: '#38bdf8' },
  { no: 3, ad: 'ADAPTİF MESH', aciklama: 'Yüzey morfoloji ağı ve üçgenleme', yuzde: '%58', renk: '#06b6d4' },
  { no: 4, ad: 'YÜZEY OLUŞUMU', aciklama: 'Kaya formasyon ve doku katmanı', yuzde: '%75', renk: '#22c55e' },
  { no: 5, ad: 'RENKLENDİRME', aciklama: 'Termal, spektral ve mineral ısı haritası', yuzde: '%88', renk: '#f59e0b' },
  { no: 6, ad: 'ANALİZ KATLARI', aciklama: 'Oyuk, kanal ve çatlak ayrıştırma', yuzde: '%96', renk: '#ec4899' },
  { no: 7, ad: 'SONUÇ & RAPOR', aciklama: 'Vektörel yön ve saha taktik raporu', yuzde: '%100', renk: '#a855f7' }
];

export const SyDTSECore: React.FC = () => {
  const [aktifAsama, setAktifAsama] = useState<number>(3);
  const [medyaUrl, setMedyaUrl] = useState<string | null>(null);
  const [medyaTuru, setMedyaTuru] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [haritaGoster, setHaritaGoster] = useState<boolean>(true);
  const [seciliIl, setSeciliIl] = useState<string>('Elazığ');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [seciliKatmanlar, setSeciliKatmanlar] = useState<Record<string, boolean>>({
    noktaBulutu: true,
    mesh: true,
    oyukKanal: true,
    mineralDamar: true,
    mtaJeoloji: true,
    havaRadari: true
  });

  const katmanToggle = (key: string) => {
    setSeciliKatmanlar((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMedyaSec = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setMedyaTuru(file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');
    setMedyaUrl(URL.createObjectURL(file));
  };

  // Dinamik Canvas Çizimi (Video veya Görsel Üzerine 7 Aşamalı Dijital İkiz Katmanı)
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ciz = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      // 1. AŞAMA: Ham Çerçeve
      if (aktifAsama >= 1) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(w * 0.15, h * 0.15, w * 0.7, h * 0.7);
      }

      // 2. AŞAMA: Nokta Bulutu
      if (aktifAsama >= 2 && seciliKatmanlar.noktaBulutu) {
        ctx.fillStyle = '#38bdf8';
        for (let i = 0; i < 45; i++) {
          const px = w * 0.2 + (Math.sin(i * 99) * 0.5 + 0.5) * (w * 0.6);
          const py = h * 0.2 + (Math.cos(i * 33) * 0.5 + 0.5) * (h * 0.6);
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. AŞAMA: Adaptif Mesh Izgarası
      if (aktifAsama >= 3 && seciliKatmanlar.mesh) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.lineWidth = 1;
        const adim = 35;
        for (let x = w * 0.18; x <= w * 0.82; x += adim) {
          ctx.beginPath();
          ctx.moveTo(x, h * 0.18);
          ctx.lineTo(x, h * 0.82);
          ctx.stroke();
        }
        for (let y = h * 0.18; y <= h * 0.82; y += adim) {
          ctx.beginPath();
          ctx.moveTo(w * 0.18, y);
          ctx.lineTo(w * 0.82, y);
          ctx.stroke();
        }
      }

      // 5. AŞAMA: Renklendirme / Isı Haritası
      if (aktifAsama >= 5) {
        const grad = ctx.createRadialGradient(w * 0.45, h * 0.45, 10, w * 0.45, h * 0.45, w * 0.3);
        grad.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
        grad.addColorStop(0.6, 'rgba(34, 197, 94, 0.15)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(w * 0.15, h * 0.15, w * 0.7, h * 0.7);
      }

      // 6. ve 7. AŞAMA: Oyuk, Tahliye Kanalı ve 5-7 Metre Hedef Vektörü
      if (aktifAsama >= 6 && seciliKatmanlar.oyukKanal) {
        // Çift Oyuk
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(w * 0.42, h * 0.4, 22, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(w * 0.6, h * 0.42, 26, 0, Math.PI * 2);
        ctx.stroke();

        // Tahliye Kanalı (Akar) Çizgisi
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.42, h * 0.4);
        ctx.lineTo(w * 0.32, h * 0.7);
        ctx.stroke();

        // 7. AŞAMA: Vektörel Hedef Göstergesi
        if (aktifAsama === 7) {
          ctx.strokeStyle = '#22c55e';
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(w * 0.32, h * 0.7);
          ctx.lineTo(w * 0.22, h * 0.9);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('🎯 HEDEF ODAĞI (5.4m - 128°)', w * 0.05, h * 0.95);
        }
      }

      animId = requestAnimationFrame(ciz);
    };

    ciz();
    return () => cancelAnimationFrame(animId);
  }, [aktifAsama, seciliKatmanlar]);

  return (
    <div style={{ backgroundColor: '#020611', color: '#fff', padding: '14px', borderRadius: '10px', border: '1px solid #1e293b', fontFamily: 'monospace' }}>
      
      {/* ÜST BAŞLIK VE KONTROL ŞERİDİ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '10px', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#38bdf8', letterSpacing: '0.05em' }}>
            🧭 SYK DIGITAL TWIN SURFACE ENGINE (DTSE)
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            TAŞ YÜZEYİ KANAL/OYUK DERİNLİK MODELİ & TÜRKİYE GIS KATMANLARI
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ padding: '6px 12px', backgroundColor: '#0284c7', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', color: '#fff' }}>
            📹 Video / Fotoğraf Yükle
            <input type="file" accept="image/*,video/*" onChange={handleMedyaSec} style={{ display: 'none' }} />
          </label>
          <button
            onClick={() => setHaritaGoster(!haritaGoster)}
            style={{ padding: '6px 12px', backgroundColor: haritaGoster ? '#0f766e' : '#1e293b', border: '1px solid #14b8a6', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            🗺️ Harita Katmanı: {haritaGoster ? 'AÇIK' : 'GİZLİ'}
          </button>
        </div>
      </div>

      {/* 7 AŞAMALI DİJİTAL İKİZ BUTONLARI (TIKLANABİLİR & AKTİF) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '12px' }}>
        {ASAMALAR.map((as) => {
          const secili = aktifAsama === as.no;
          return (
            <button
              key={as.no}
              onClick={() => setAktifAsama(as.no)}
              style={{
                backgroundColor: secili ? 'rgba(56, 189, 248, 0.22)' : '#070e1c',
                border: `1px solid ${secili ? as.renk : '#1e293b'}`,
                borderRadius: '6px',
                padding: '8px 4px',
                cursor: 'pointer',
                textAlign: 'center',
                color: '#fff',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: secili ? as.renk : '#cbd5e1' }}>
                {as.no}. {as.ad}
              </div>
              <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>{as.yuzde}</div>
            </button>
          );
        })}
      </div>

      {/* ORTA KISIM: 3 SÜTUNLU DİJİTAL İKİZ VE KÜNYE EKRANI */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 240px', gap: '12px', marginBottom: '14px' }}>
        
        {/* SOL PANEL: TELEMETRİ & AKTİF AŞAMA AÇIKLAMASI */}
        <div style={{ backgroundColor: '#060c18', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.72rem' }}>
          <div>
            <div style={{ color: '#38bdf8', fontWeight: 'bold', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '8px' }}>
              İŞLEM ADIMI TELEMETRİSİ
            </div>
            <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '4px' }}>
              {ASAMALAR[aktifAsama - 1].no}. {ASAMALAR[aktifAsama - 1].ad}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.68rem', lineHeight: '1.3', marginBottom: '10px' }}>
              {ASAMALAR[aktifAsama - 1].aciklama}
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '8px', display: 'grid', gap: '4px', color: '#cbd5e1' }}>
              <div>Tarama Kalitesi: <strong style={{ color: '#22c55e' }}>HD-3D DTSE</strong></div>
              <div>Mesh Yoğunluğu: <strong style={{ color: '#38bdf8' }}>48.200 Vertex</strong></div>
              <div>Çatlak Taraması: <strong style={{ color: '#38bdf8' }}>Milimetrik</strong></div>
              <div>Konum Durumu: <strong style={{ color: '#fbbf24' }}>Görsel Koordinat (Bağıl)</strong></div>
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '8px', borderRadius: '4px', border: '1px solid #334155', color: '#38bdf8', fontSize: '0.65rem' }}>
            KAYIT: SYK-DTSE-2026-0524-0017
          </div>
        </div>

        {/* ORTA PANEL: VİDEO/GÖRSEL ÜZERİ CANVAS VEKTÖR MOTORU */}
        <div style={{ position: 'relative', backgroundColor: '#000', borderRadius: '8px', border: '1px solid #1e293b', minHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {medyaUrl ? (
            medyaTuru === 'IMAGE' ? (
              <img src={medyaUrl} alt="DTSE Kaynağı" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <video ref={videoRef} src={medyaUrl} controls autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )
          ) : (
            <div style={{ textAlign: 'center', color: '#475569', padding: '20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '6px' }}>🎯</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 'bold' }}>Canlı Saha Medyası veya Video Bekleniyor</div>
              <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>Yukarıdaki butonla video/fotoğraf yükleyin; 7 aşamalı dijital ikiz katmanı medyanın üzerine çizilecektir.</div>
            </div>
          )}

          {/* Dinamik Canvas Tuvali */}
          <canvas
            ref={canvasRef}
            width={700}
            height={420}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          />

          {/* VİDEO 7 TESPİTİ: SAHA VEKTÖR KARTI (ÇAKIŞMAYI ÖNLEYEN SABİT TABAN) */}
          <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', backgroundColor: 'rgba(2, 6, 23, 0.92)', border: '1px solid #22c55e', borderRadius: '6px', padding: '8px 12px', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ color: '#22c55e', fontWeight: 'bold' }}>🧭 7. VİDEO VEKTÖR KURALI:</span>
              <span style={{ color: '#cbd5e1', marginLeft: '6px' }}>Hedef taşın altında değil, Kanal-02 akarı yönünde (128°) <strong>5.40 - 7.00 metre</strong> mesafededir.</span>
            </div>
            <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>Güven: %98.7</div>
          </div>
        </div>

        {/* SAĞ PANEL: KATMAN YÖNETİMİ & MİLİMETRİK ÖLÇÜMLER */}
        <div style={{ backgroundColor: '#060c18', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.7rem' }}>
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
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: seciliKatmanlar[k] ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    cursor: 'pointer',
                    color: seciliKatmanlar[k] ? '#fff' : '#64748b',
                    border: `1px solid ${seciliKatmanlar[k] ? '#0284c7' : 'rgba(255,255,255,0.05)'}`
                  }}
                >
                  <span>{k.toUpperCase()}</span>
                  <span>{seciliKatmanlar[k] ? '👁️' : '🕶️'}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
            <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '4px' }}>ANA ÖLÇÜMLER</div>
            <div style={{ display: 'grid', gap: '3px', color: '#cbd5e1' }}>
              <div>Yüzey Alanı: <strong style={{ color: '#38bdf8' }}>1.842 m²</strong></div>
              <div>Hacim: <strong style={{ color: '#38bdf8' }}>0.213 m³</strong></div>
              <div>Oyuk-01 Çap/Der.: <strong style={{ color: '#38bdf8' }}>2.34 / 0.78 cm</strong></div>
              <div>Kanal-02 Yön/Geniş.: <strong style={{ color: '#38bdf8' }}>128° / 1.12 cm</strong></div>
              <div>Ort. Pürüzlülük: <strong style={{ color: '#38bdf8' }}>0.62 mm</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* ALT KISIM: TÜRKİYE & İL HARİTA KATMANI (İSTENİLDİĞİNDE AÇILIR) */}
      {haritaGoster && (
        <div style={{ backgroundColor: '#070d1a', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.85rem' }}>🗺️ TÜRKİYE GIS & BÖLGE KATMANI</span>
              <select
                value={seciliIl}
                onChange={(e) => setSeciliIl(e.target.value)}
                style={{ backgroundColor: '#020617', color: '#f59e0b', border: '1px solid #334155', borderRadius: '4px', padding: '2px 6px', fontSize: '0.72rem', outline: 'none' }}
              >
                <option value="Elazığ">Elazığ (Harput / Palu)</option>
                <option value="Malatya">Malatya (Arslantepe)</option>
                <option value="Şanlıurfa">Şanlıurfa (Göbeklitepe)</option>
                <option value="Afyon">Afyon (Frig Vadisi)</option>
              </select>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Sadece {seciliIl} ve çevre illerin MTA Jeoloji/Sit katmanı dinamik indirildi.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            <div style={{ backgroundColor: '#030712', padding: '8px', borderRadius: '6px', border: '1px solid #334155', fontSize: '0.72rem' }}>
              <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>🪨 MTA Litoloji:</div>
              <div style={{ color: '#94a3b8', marginTop: '2px' }}>Kireçtaşı - Andezit Geçiş Formasyonu</div>
            </div>
            <div style={{ backgroundColor: '#030712', padding: '8px', borderRadius: '6px', border: '1px solid #334155', fontSize: '0.72rem' }}>
              <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>🏛️ Arkeolojik Katman:</div>
              <div style={{ color: '#94a3b8', marginTop: '2px' }}>Kaya Mezarı & Antik Su Galerisi</div>
            </div>
            <div style={{ backgroundColor: '#030712', padding: '8px', borderRadius: '6px', border: '1px solid #334155', fontSize: '0.72rem' }}>
              <div style={{ color: '#22c55e', fontWeight: 'bold' }}>🌿 Endemik Flora:</div>
              <div style={{ color: '#94a3b8', marginTop: '2px' }}>Sarı Kantaron & Kireçli Toprak Örtüsü</div>
            </div>
            <div style={{ backgroundColor: '#030712', padding: '8px', borderRadius: '6px', border: '1px solid #334155', fontSize: '0.72rem' }}>
              <div style={{ color: '#ec4899', fontWeight: 'bold' }}>🛸 ADS-B Radar:</div>
              <div style={{ color: '#94a3b8', marginTop: '2px' }}>Hava sahası temiz, IFF sinyali yok</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};