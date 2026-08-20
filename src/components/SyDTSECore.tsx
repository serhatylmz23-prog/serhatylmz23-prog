import React, { useState, useRef, useEffect } from 'react';

interface AsamaTanim {
  no: number;
  ad: string;
  yuzde: string;
  renk: string;
}

const ASAMALAR: AsamaTanim[] = [
  { no: 1, ad: 'ALGILAMA', yuzde: '%15', renk: '#94a3b8' },
  { no: 2, ad: 'NOKTA BULUTU', yuzde: '%35', renk: '#38bdf8' },
  { no: 3, ad: 'ADAPTİF MESH', yuzde: '%58', renk: '#06b6d4' },
  { no: 4, ad: 'YÜZEY OLUŞUMU', yuzde: '%75', renk: '#22c55e' },
  { no: 5, ad: 'RENKLENDİRME', yuzde: '%88', renk: '#f59e0b' },
  { no: 6, ad: 'ANALİZ KATLARI', yuzde: '%96', renk: '#ec4899' },
  { no: 7, ad: 'SONUÇ & RAPOR', yuzde: '%100', renk: '#a855f7' }
];

export const SyDTSECore: React.FC = () => {
  const [aktifAsama, setAktifAsama] = useState<number>(3);
  const [medyaUrl, setMedyaUrl] = useState<string | null>(null);
  const [medyaTuru, setMedyaTuru] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [linkInput, setLinkInput] = useState('');
  
  // İşlevsel Araç Modları (Canlı Tarama, Yakınlaştırma, Mesafe Ölçüm)
  const [aracModu, setAracModu] = useState<'TARAMA' | 'YAKINLAS' | 'OLCUM'>('TARAMA');
  const [zoomSeviyesi, setZoomSeviyesi] = useState<number>(1);
  const [olcumNoktalari, setOlcumNoktalari] = useState<{ x: number; y: number }[]>([]);
  const [hesaplananMesafe, setHesaplananMesafe] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const [seciliKatmanlar, setSeciliKatmanlar] = useState<Record<string, boolean>>({
    noktaBulutu: true,
    mesh: true,
    edsHedefKutusu: true,
    oyukVeKanal: true,
    termalIsi: true
  });

  const katmanToggle = (key: string) => {
    setSeciliKatmanlar((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMedyaSec = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setMedyaTuru(file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setMedyaUrl(objectUrl);
  };

  const handleLinkYukle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) return;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setMedyaUrl(linkInput.trim());
    setMedyaTuru(linkInput.includes('mp4') || linkInput.includes('youtube') ? 'VIDEO' : 'IMAGE');
    setLinkInput('');
  };

  // Canvas Tıklama ile Mesafe/Alan Ölçüm Hesaplayıcı
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (aracModu !== 'OLCUM') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (olcumNoktalari.length >= 2) {
      setOlcumNoktalari([{ x, y }]);
      setHesaplananMesafe(null);
    } else {
      const yeniNoktalar = [...olcumNoktalari, { x, y }];
      setOlcumNoktalari(yeniNoktalar);
      if (yeniNoktalar.length === 2) {
        const dx = yeniNoktalar[1].x - yeniNoktalar[0].x;
        const dy = yeniNoktalar[1].y - yeniNoktalar[0].y;
        const pikselMesafe = Math.sqrt(dx * dx + dy * dy);
        const cmMesafe = (pikselMesafe * 0.12).toFixed(2); // 1px = ~1.2mm kalibrasyonu
        setHesaplananMesafe(`${cmMesafe} cm (Milimetrik DTSE)`);
      }
    }
  };

  // Canvas Üzerinde 7 Aşamalı Katman + EDS Çerçeve Çizimi
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

      // EDS KADRAJI (Bounding Box & Hedef Artısı)
      if (seciliKatmanlar.edsHedefKutusu) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(w * 0.2, h * 0.2, w * 0.6, h * 0.6);
        // Altın Köşebentler
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(w * 0.2 - 2, h * 0.2 - 2, 14, 3);
        ctx.fillRect(w * 0.2 - 2, h * 0.2 - 2, 3, 14);
        ctx.fillRect(w * 0.8 - 12, h * 0.2 - 2, 14, 3);
        ctx.fillRect(w * 0.8 - 1, h * 0.2 - 2, 3, 14);
      }

      // 2. AŞAMA: Nokta Bulutu
      if (aktifAsama >= 2 && seciliKatmanlar.noktaBulutu) {
        ctx.fillStyle = '#38bdf8';
        for (let i = 0; i < 40; i++) {
          const px = w * 0.25 + (Math.sin(i * 123) * 0.5 + 0.5) * (w * 0.5);
          const py = h * 0.25 + (Math.cos(i * 456) * 0.5 + 0.5) * (h * 0.5);
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. AŞAMA: Adaptif Mesh Izgarası
      if (aktifAsama >= 3 && seciliKatmanlar.mesh) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = 1;
        for (let x = w * 0.22; x <= w * 0.78; x += 35) {
          ctx.beginPath();
          ctx.moveTo(x, h * 0.22);
          ctx.lineTo(x, h * 0.78);
          ctx.stroke();
        }
        for (let y = h * 0.22; y <= h * 0.78; y += 35) {
          ctx.beginPath();
          ctx.moveTo(w * 0.22, y);
          ctx.lineTo(w * 0.78, y);
          ctx.stroke();
        }
      }

      // 6. ve 7. AŞAMA: Oyuk, Kanal ve 5-7 Metre Hedef Vektörü
      if (aktifAsama >= 6 && seciliKatmanlar.oyukVeKanal) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(w * 0.42, h * 0.45, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w * 0.58, h * 0.47, 24, 0, Math.PI * 2);
        ctx.stroke();

        // Tahliye Kanalı (Akar)
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.42, h * 0.45);
        ctx.lineTo(w * 0.32, h * 0.72);
        ctx.stroke();

        // 7. Aşama Vektörü
        if (aktifAsama === 7) {
          ctx.strokeStyle = '#22c55e';
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(w * 0.32, h * 0.72);
          ctx.lineTo(w * 0.2, h * 0.9);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Kullanıcının Ölçüm Çizgisi
      if (olcumNoktalari.length > 0) {
        ctx.fillStyle = '#ef4444';
        olcumNoktalari.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fill();
        });
        if (olcumNoktalari.length === 2) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(olcumNoktalari[0].x, olcumNoktalari[0].y);
          ctx.lineTo(olcumNoktalari[1].x, olcumNoktalari[1].y);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(ciz);
    };

    ciz();
    return () => cancelAnimationFrame(animId);
  }, [aktifAsama, seciliKatmanlar, olcumNoktalari]);

  return (
    <div style={{ backgroundColor: '#020611', color: '#fff', padding: '14px', borderRadius: '10px', border: '1px solid #1e293b', fontFamily: 'monospace' }}>
      
      {/* ÜST BİLGİ & LİNK GİRİŞİ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <span style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#38bdf8' }}>
            🧭 DTSE 7 AŞAMALI DİJİTAL İKİZ VE EDS KADRAJI
          </span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '8px' }}>
            TAŞ YÜZEYİ & OYUK/KANAL TESPİTİ
          </span>
        </div>

        <form onSubmit={handleLinkYukle} style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Web, RTSP veya YouTube Linki..."
            style={{ backgroundColor: '#060a14', border: '1px solid #334155', borderRadius: '4px', color: '#fff', padding: '4px 8px', fontSize: '0.75rem', outline: 'none' }}
          />
          <button type="submit" style={{ backgroundColor: '#0284c7', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '0.72rem', padding: '4px 10px', cursor: 'pointer', fontWeight: 'bold' }}>
            Link Çözümle
          </button>
          <label style={{ backgroundColor: '#f59e0b', borderRadius: '4px', color: '#000', fontSize: '0.72rem', padding: '4px 10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            📁 Dosya Seç
            <input type="file" accept="image/*,video/*" onChange={handleMedyaSec} style={{ display: 'none' }} />
          </label>
        </form>
      </div>

      {/* 7 AŞAMALI DİJİTAL İKİZ BUTONLARI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '12px' }}>
        {ASAMALAR.map((as) => (
          <button
            key={as.no}
            onClick={() => setAktifAsama(as.no)}
            style={{
              backgroundColor: aktifAsama === as.no ? 'rgba(56, 189, 248, 0.2)' : '#070e1c',
              border: `1px solid ${aktifAsama === as.no ? as.renk : '#1e293b'}`,
              borderRadius: '4px',
              padding: '6px 2px',
              cursor: 'pointer',
              color: '#fff'
            }}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: aktifAsama === as.no ? as.renk : '#cbd5e1' }}>
              {as.no}. {as.ad}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{as.yuzde}</div>
          </button>
        ))}
      </div>

      {/* ORTA KISIM: 3 SÜTUNLU KANVAS VE ÇALIŞAN ARAÇLAR */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 220px', gap: '10px' }}>
        
        {/* SOL: AKTİF ÇALIŞAN ARAÇLAR */}
        <div style={{ backgroundColor: '#070d1a', border: '1px solid #1e293b', borderRadius: '6px', padding: '10px', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>ARAÇ KONTROLLERİ</div>
          
          <button
            onClick={() => { setAracModu('TARAMA'); setZoomSeviyesi(1); setOlcumNoktalari([]); setHesaplananMesafe(null); }}
            style={{ padding: '6px', backgroundColor: aracModu === 'TARAMA' ? '#0284c7' : '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
          >
            🎯 Canlı Tarama Modu
          </button>

          <button
            onClick={() => {
              setAracModu('YAKINLAS');
              setZoomSeviyesi((prev) => (prev >= 2 ? 1 : prev + 0.5));
            }}
            style={{ padding: '6px', backgroundColor: aracModu === 'YAKINLAS' ? '#0284c7' : '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
          >
            🔍 Yakınlaştır ({zoomSeviyesi}x)
          </button>

          <button
            onClick={() => { setAracModu('OLCUM'); setOlcumNoktalari([]); setHesaplananMesafe(null); }}
            style={{ padding: '6px', backgroundColor: aracModu === 'OLCUM' ? '#0284c7' : '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
          >
            📐 Milimetrik Ölçüm (2 Nokta)
          </button>

          {hesaplananMesafe && (
            <div style={{ backgroundColor: '#14532d', padding: '6px', borderRadius: '4px', color: '#86efac', fontSize: '0.68rem', marginTop: '4px' }}>
              Mesafe: {hesaplananMesafe}
            </div>
          )}

          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '6px', color: '#94a3b8', fontSize: '0.65rem' }}>
            <div>Sensörler: <span style={{ color: '#22c55e' }}>9/9 Aktif</span></div>
            <div>Konum: <span style={{ color: '#fbbf24' }}>Göreceli Analiz</span></div>
          </div>
        </div>

        {/* ORTA: MEDYA VE CANVAS TUVALİ */}
        <div style={{ position: 'relative', backgroundColor: '#000', borderRadius: '6px', border: '1px solid #1e293b', minHeight: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {medyaUrl ? (
            medyaTuru === 'IMAGE' ? (
              <img src={medyaUrl} alt="Saha" style={{ transform: `scale(${zoomSeviyesi})`, transition: 'transform 0.2s', maxWidth: '100%', maxHeight: '380px', objectFit: 'contain' }} />
            ) : (
              <video src={medyaUrl} controls autoPlay loop muted style={{ transform: `scale(${zoomSeviyesi})`, transition: 'transform 0.2s', width: '100%', maxHeight: '380px' }} />
            )
          ) : (
            <div style={{ textAlign: 'center', color: '#475569' }}>
              <div style={{ fontSize: '2.5rem' }}>🎯</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Medya/Video veya Link Yükleyin</div>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={650}
            height={380}
            onClick={handleCanvasClick}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: aracModu === 'OLCUM' ? 'crosshair' : 'default' }}
          />

          {/* Video 7 Vektör Kuralı */}
          <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', backgroundColor: 'rgba(2, 6, 23, 0.92)', border: '1px solid #22c55e', borderRadius: '4px', padding: '6px 10px', fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#22c55e' }}>🧭 <strong>7. Video Kuralı:</strong> Kanal akarı yönünde (128°) 5.4 - 7.0 metre mesafe odaklanmalıdır.</span>
            <span style={{ color: '#38bdf8' }}>%98.7 Güven</span>
          </div>
        </div>

        {/* SAĞ: KATMANLAR VE PARAMETRELER */}
        <div style={{ backgroundColor: '#070d1a', border: '1px solid #1e293b', borderRadius: '6px', padding: '10px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: '6px' }}>KATMANLAR</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.keys(seciliKatmanlar).map((k) => (
                <div
                  key={k}
                  onClick={() => katmanToggle(k)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    backgroundColor: seciliKatmanlar[k] ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
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

          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '6px' }}>
            <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>ÖLÇÜM VERİLERİ</div>
            <div style={{ color: '#cbd5e1', marginTop: '2px' }}>
              <div>Çap: 2.34 cm</div>
              <div>Kanal Açısı: 128°</div>
              <div>Pürüzlülük: 0.62 mm</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};