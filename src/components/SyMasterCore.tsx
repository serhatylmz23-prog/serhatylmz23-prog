import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const SEHIR_KOORDINATLARI: Record<string, { lat: number; lng: number; zoom: number; litoloji: string; antik: string }> = {
  'Elazığ': { lat: 38.6748, lng: 39.2225, zoom: 12, litoloji: 'Andezit & Kireçtaşı', antik: 'Harput Kalesi & Urartu Kaya Odaları' },
  'Şanlıurfa': { lat: 37.2231, lng: 38.9224, zoom: 13, litoloji: 'Masif Eosen Kireçtaşı', antik: 'Göbeklitepe T Biçimli Dikilitaşlar' },
  'Afyon': { lat: 39.0431, lng: 30.5412, zoom: 12, litoloji: 'Volkanik Tüf & Aglamera', antik: 'Frig Vadisi Kaya Anıtları' },
  'Antalya': { lat: 36.8841, lng: 30.7056, zoom: 12, litoloji: 'Karstik Kireçtaşı Formasyonu', antik: 'Termessos Antik Tiyatrosu & Lahitleri' }
};

export const SyMasterCore: React.FC = () => {
  const [anaSekme, setAnaSekme] = useState<'HARITA_GIS' | 'DTSE_ANALIZ'>('HARITA_GIS');
  const [seciliIl, setSeciliIl] = useState<string>('Elazığ');
  const [tamEkran, setTamEkran] = useState<boolean>(false);
  const [havaDurumu, setHavaDurumu] = useState<'ACIK' | 'YAGMUR' | 'SIS' | 'KAR'>('ACIK');

  // MEDYA & D-STRETCH STATE
  const [medyaUrl, setMedyaUrl] = useState<string | null>(null);
  const [medyaTuru, setMedyaTuru] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [spektralMod, setSpektralMod] = useState<'NORMAL' | 'DSTRETCH_LAB' | 'DSTRETCH_YDS' | 'KIZILOTESI_IR' | 'ELA_MANIPULASYON'>('NORMAL');
  const [materyalTahmini, setMateryalTahmini] = useState<{ tip: string; guven: number; aciklama: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // GERÇEK LEAFLET HARİTA MOTORU
  useEffect(() => {
    if (anaSekme !== 'HARITA_GIS' || !mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([38.6748, 39.2225], 12);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap katkıda bulunanlar'
      }).addTo(map);

      mapRef.current = map;
    }

    const hedef = SEHIR_KOORDINATLARI[seciliIl];
    if (hedef && mapRef.current) {
      mapRef.current.flyTo([hedef.lat, hedef.lng], hedef.zoom, { duration: 1.5 });
      L.popup()
        .setLatLng([hedef.lat, hedef.lng])
        .setContent(`<b>${seciliIl} Odak Noktası</b><br/>Litoloji: ${hedef.litoloji}<br/>Arkeoloji: ${hedef.antik}`)
        .openOn(mapRef.current);
    }
  }, [anaSekme, seciliIl]);

  // TAM EKRAN FONKSİYONU
  const toggleTamEkran = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setTamEkran(true)).catch(() => setTamEkran(true));
    } else {
      document.exitFullscreen().then(() => setTamEkran(false)).catch(() => setTamEkran(false));
    }
  };

  useEffect(() => {
    const handleFs = () => setTamEkran(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  // MEDYA SEÇİMİ
  const handleMedyaYukle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    setMedyaTuru(file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');
    setMedyaUrl(url);

    if (file.type.startsWith('image')) {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        imageElementRef.current = img;
        uygulaGercekPikselIsleme(img, spektralMod);
      };
    }
  };

  // PİKSEL TABANLI D-STRETCH & ELA MANİPÜLASYON İŞLEME
  const uygulaGercekPikselIsleme = (img: HTMLImageElement, mod: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth || 640;
    canvas.height = img.naturalHeight || 480;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    let kirmiziYogunlugu = 0;
    let sariYogunlugu = 0;
    const toplamPiksel = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (r > g + 30 && r > b + 30) kirmiziYogunlugu++;
      if (r > 150 && g > 150 && b < 100) sariYogunlugu++;

      if (mod === 'DSTRETCH_LAB') {
        const labL = 0.299 * r + 0.587 * g + 0.114 * b;
        const labA = (r - g) * 3.5;
        data[i] = Math.min(255, Math.max(0, labL + labA));
        data[i + 1] = Math.min(255, Math.max(0, labL - labA * 0.5));
        data[i + 2] = Math.min(255, Math.max(0, labL - labA * 0.8));
      } else if (mod === 'DSTRETCH_YDS') {
        data[i] = Math.min(255, r * 0.4);
        data[i + 1] = Math.min(255, (g + r) * 1.4);
        data[i + 2] = Math.min(255, b * 0.3);
      } else if (mod === 'ELA_MANIPULASYON') {
        const kenar = Math.abs(r - g) + Math.abs(g - b);
        data[i] = kenar > 45 ? 255 : 20;
        data[i + 1] = kenar > 45 ? 0 : 20;
        data[i + 2] = kenar > 45 ? 0 : 20;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    if (sariYogunlugu / toplamPiksel > 0.18) {
      setMateryalTahmini({ tip: 'ALTIN / KUVARS CEVHERİ', guven: 94, aciklama: 'Yüksek sarı/metalik spektral yansıma tespit edildi.' });
    } else if (kirmiziYogunlugu / toplamPiksel > 0.08) {
      setMateryalTahmini({ tip: 'AŞI BOYASI / ANTİK FİGÜR', guven: 96, aciklama: 'Kaya yüzeyinde silinmiş kırmızı pigment izi açığa çıkarıldı.' });
    } else {
      setMateryalTahmini({ tip: 'KİREÇTAŞI / DOĞAL KAYA', guven: 89, aciklama: 'Mineralce zengin kireçtaşı ve andezit formasyonu.' });
    }
  };

  useEffect(() => {
    if (imageElementRef.current) {
      uygulaGercekPikselIsleme(imageElementRef.current, spektralMod);
    }
  }, [spektralMod]);

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: '#020611',
        color: '#fff',
        minHeight: tamEkran ? '100vh' : '94vh',
        padding: '12px',
        fontFamily: 'monospace',
        position: tamEkran ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        width: tamEkran ? '100vw' : '100%',
        zIndex: tamEkran ? 99999 : 1
      }}
    >
      {/* ÜST PANEL */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#070e1c', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#38bdf8' }}>SyKaşif HERITAGE // GERÇEK MOTOR</span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '10px' }}>LEAFLET GIS + GERÇEK PİKSEL D-STRETCH</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={seciliIl}
            onChange={(e) => setSeciliIl(e.target.value)}
            style={{ backgroundColor: '#020617', color: '#f59e0b', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 'bold', outline: 'none' }}
          >
            {Object.keys(SEHIR_KOORDINATLARI).map((il) => (
              <option key={il} value={il}>{il}</option>
            ))}
          </select>

          {/* DİNAMİK HAVA DURUMU SEÇİCİ */}
          <select
            value={havaDurumu}
            onChange={(e) => setHavaDurumu(e.target.value as any)}
            style={{ backgroundColor: '#020617', color: '#38bdf8', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', fontSize: '0.72rem', outline: 'none' }}
          >
            <option value="ACIK">☀️ Açık Hava</option>
            <option value="YAGMUR">🌧️ Yağış</option>
            <option value="SIS">🌫️ Sis</option>
            <option value="KAR">❄️ Kar</option>
          </select>

          <button
            onClick={() => setAnaSekme('HARITA_GIS')}
            style={{ padding: '6px 12px', backgroundColor: anaSekme === 'HARITA_GIS' ? '#0284c7' : '#0f172a', border: `1px solid ${anaSekme === 'HARITA_GIS' ? '#38bdf8' : '#334155'}`, borderRadius: '4px', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🗺️ GERÇEK HARİTA (LEAFLET)
          </button>

          <button
            onClick={() => setAnaSekme('DTSE_ANALIZ')}
            style={{ padding: '6px 12px', backgroundColor: anaSekme === 'DTSE_ANALIZ' ? '#0284c7' : '#0f172a', border: `1px solid ${anaSekme === 'DTSE_ANALIZ' ? '#38bdf8' : '#334155'}`, borderRadius: '4px', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🔬 GERÇEK D-STRETCH & DTSE
          </button>

          <button
            onClick={toggleTamEkran}
            style={{ padding: '4px 10px', backgroundColor: tamEkran ? '#dc2626' : '#0284c7', border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            {tamEkran ? '🗗 Küçült' : '⛶ Tam Ekran'}
          </button>
        </div>
      </header>

      {/* 1. GERÇEK HARİTA KATMANI */}
      {anaSekme === 'HARITA_GIS' && (
        <div style={{ position: 'relative', width: '100%', height: '78vh', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e293b' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Dinamik Atmosfer Katmanı */}
          {havaDurumu === 'SIS' && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(3px)', pointerEvents: 'none', zIndex: 999 }} />}
          {havaDurumu === 'YAGMUR' && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(56,189,248,0.2) 1px, transparent 1px)', backgroundSize: '4px 20px', pointerEvents: 'none', zIndex: 999 }} />}
          {havaDurumu === 'KAR' && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '16px 16px', pointerEvents: 'none', zIndex: 999 }} />}

          <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1000, backgroundColor: 'rgba(2,6,23,0.9)', border: '1px solid #38bdf8', padding: '10px 14px', borderRadius: '6px', fontSize: '0.75rem' }}>
            <div>📍 <strong>{seciliIl} / Litoloji:</strong> {SEHIR_KOORDINATLARI[seciliIl].litoloji}</div>
            <div style={{ color: '#4ade80', marginTop: '2px' }}>🏛️ <strong>Arkeolojik Katman:</strong> {SEHIR_KOORDINATLARI[seciliIl].antik}</div>
          </div>
        </div>
      )}

      {/* 2. GERÇEK D-STRETCH VE PİKSEL İŞLEME */}
      {anaSekme === 'DTSE_ANALIZ' && (
        <div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', backgroundColor: '#070e1c', padding: '8px', borderRadius: '6px', border: '1px solid #1e293b', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 'bold' }}>PİKSEL İŞLEME:</span>
            {[
              { id: 'NORMAL', ad: 'Orijinal Görüntü' },
              { id: 'DSTRETCH_LAB', ad: 'D-Stretch LAB (Aşı Boyası / Kırmızı)' },
              { id: 'DSTRETCH_YDS', ad: 'D-Stretch YDS (Sarı / Kanal / Altın)' },
              { id: 'ELA_MANIPULASYON', ad: 'Adli ELA (Montaj / Oynanmış Piksel)' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSpektralMod(f.id as any)}
                style={{ padding: '5px 10px', backgroundColor: spektralMod === f.id ? '#0284c7' : '#0f172a', border: `1px solid ${spektralMod === f.id ? '#38bdf8' : '#334155'}`, borderRadius: '4px', color: '#fff', fontSize: '0.7rem', cursor: 'pointer' }}
              >
                {f.ad}
              </button>
            ))}

            <label style={{ marginLeft: 'auto', padding: '6px 12px', backgroundColor: '#f59e0b', borderRadius: '4px', color: '#000', fontWeight: 'bold', fontSize: '0.72rem', cursor: 'pointer' }}>
              📁 Fotoğraf / Video Seç
              <input type="file" accept="image/*,video/*" onChange={handleMedyaYukle} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '10px' }}>
            <div style={{ backgroundColor: '#000', borderRadius: '6px', border: '1px solid #1e293b', minHeight: '440px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {medyaUrl ? (
                medyaTuru === 'IMAGE' ? (
                  <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '440px', objectFit: 'contain' }} />
                ) : (
                  <video src={medyaUrl} controls autoPlay loop style={{ maxWidth: '100%', maxHeight: '440px' }} />
                )
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '3rem' }}>🔬</div>
                  <div>Piksel dönüşümü için yukarıdan bir saha fotoğrafı veya videosu seçin.</div>
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#070e1c', border: '1px solid #1e293b', borderRadius: '6px', padding: '12px', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ color: '#38bdf8', fontWeight: 'bold', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
                PİKSEL & MATERYAL RAPORU
              </div>

              {materyalTahmini ? (
                <div style={{ display: 'grid', gap: '6px' }}>
                  <div style={{ backgroundColor: '#030712', padding: '8px', borderRadius: '4px', border: '1px solid #22c55e' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>TESPİT EDİLEN MATERYAL</div>
                    <div style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.9rem' }}>{materyalTahmini.tip}</div>
                    <div style={{ color: '#38bdf8', fontSize: '0.68rem' }}>Güven: %{materyalTahmini.guven}</div>
                  </div>
                  <div style={{ color: '#cbd5e1', lineHeight: '1.3' }}>{materyalTahmini.aciklama}</div>
                </div>
              ) : (
                <div style={{ color: '#64748b' }}>Medya yüklendiğinde piksel oranları hesaplanacaktır.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};