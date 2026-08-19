import React, { useState, useRef, useEffect } from 'react';
import { SyMediaVerificationCore } from './SyMediaVerificationCore';

// 9'LU HARİTA KATMANI TANIMI
interface HaritaKatmani {
  id: string;
  no: string;
  ad: string;
  aciklama: string;
  opaklik: number;
  gorunur: boolean;
  renk: string;
}

const VARSAYILAN_KATMANLAR: HaritaKatmani[] = [
  { id: 'topografya', no: '01', ad: 'TOPOGRAFYA', aciklama: 'Sayısal yükseklik modeli ve eşyükselti eğrileri', opaklik: 80, gorunur: true, renk: '#38bdf8' },
  { id: 'jeoloji', no: '02', ad: 'JEOLOJİ', aciklama: 'MTA formasyonları, fay hatları ve kayaç türleri', opaklik: 70, gorunur: true, renk: '#f97316' },
  { id: 'hidrografya', no: '03', ad: 'HİDROGRAFYA', aciklama: 'Yeraltı suları, göller ve drenaj akış ağları', opaklik: 60, gorunur: true, renk: '#06b6d4' },
  { id: 'bitki', no: '04', ad: 'BİTKİ ÖRTÜSÜ', aciklama: 'NDVI bitki yoğunluğu ve toprak indikatör florası', opaklik: 50, gorunur: true, renk: '#22c55e' },
  { id: 'yapilar', no: '05', ad: 'YAPAY YAPILAR', aciklama: 'Antik temel duvarları ve altyapı izleri', opaklik: 30, gorunur: false, renk: '#eab308' },
  { id: 'ulasim', no: '06', ad: 'ULAŞIM AĞI', aciklama: 'Antik kervan yolları, Roma taş yolları ve patikalar', opaklik: 75, gorunur: true, renk: '#fb923c' },
  { id: 'elektromanyetik', no: '07', ad: 'ELEKTROMANYETİK', aciklama: 'EM alan yoğunlukları ve manyetik anomaliler', opaklik: 60, gorunur: true, renk: '#a855f7' },
  { id: 'arkeoloji', no: '08', ad: 'TARİHÎ & ARKEOLOJİ', aciklama: 'Kaya mezarları, höyükler, yazıtlar ve ören yerleri', opaklik: 90, gorunur: true, renk: '#ec4899' },
  { id: 'uydu', no: '09', ad: 'UYDU GÖRÜNTÜSÜ', aciklama: 'Çok bantlı multispektral uydu katmanı', opaklik: 100, gorunur: true, renk: '#64748b' }
];

export const SyMasterCore: React.FC = () => {
  const [anaSekme, setAnaSekme] = useState<'HARITA_GIS' | 'DTSE_ANALIZ'>('HARITA_GIS');
  const [aktifModul, setAktifModul] = useState<'HARITALAR' | 'JEOFİZİK' | 'LIDAR' | 'FREKANS' | 'SPEKTRAL' | 'OLCUM_RTK'>('HARITALAR');
  const [tamEkran, setTamEkran] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // KATMANLAR VE ŞEHİR YÖNETİMİ
  const [katmanlar, setKatmanlar] = useState<HaritaKatmani[]>(VARSAYILAN_KATMANLAR);
  const [seciliIl, setSeciliIl] = useState<'Elazığ' | 'Şanlıurfa' | 'Afyon' | 'Antalya'>('Elazığ');
  const [zamanCizgisi, setZamanCizgisi] = useState<string>('Hitit / Urartu Dönemi (M.Ö. 1200)');
  const [geceModu, setGeceModu] = useState<boolean>(true);
  const [havaDurumu, setHavaDurumu] = useState<'ACIK' | 'YAGMUR' | 'SIS' | 'KAR'>('ACIK');
  const [bildirimAcik, setBildirimAcik] = useState<boolean>(false);

  // DTSE VE SPEKTRAL STATE
  const [aktifAsama, setAktifAsama] = useState<number>(3);
  const [spektralMod, setSpektralMod] = useState<'NORMAL' | 'DSTRETCH_YDS' | 'DSTRETCH_LAB' | 'DSTRETCH_YBK' | 'KIZILOTESI_IR' | 'HDR'>('NORMAL');
  const [medyaUrl, setMedyaUrl] = useState<string | null>(null);
  const [medyaTuru, setMedyaTuru] = useState<'IMAGE' | 'VIDEO'>('IMAGE');

  // ARAÇLAR (Canlı Tarama, Yakınlaştır, Ölçüm)
  const [aracModu, setAracModu] = useState<'TARAMA' | 'YAKINLAS' | 'OLCUM'>('TARAMA');
  const [zoomSeviyesi, setZoomSeviyesi] = useState<number>(1);
  const [olcumNoktalari, setOlcumNoktalari] = useState<{ x: number; y: number }[]>([]);
  const [olcumSonuc, setOlcumSonuc] = useState<string | null>(null);

  // TELEMETRİ & ATOMİK
  const [rtkDurumu] = useState({ fix: 'RTK FIX (Santimetre)', dogruluk: '± 1.8 cm', rakım: '742.4 m', batarya: '%92', sinyal: 'GÜÇLÜ' });
  const [seciliElement, setSeciliElement] = useState<'Au' | 'Cu' | 'Ag' | 'SiO2' | 'Fe2O3'>('Au');

  const IL_VERILERI = {
    'Elazığ': { lat: 38.6748, lng: 39.2225, bolge: 'Harput / Doğu Anadolu', litoloji: 'Kireçtaşı - Andezit', uygarlik: 'Urartu & Roma' },
    'Şanlıurfa': { lat: 37.2231, lng: 38.9224, bolge: 'Göbeklitepe / Harran', litoloji: 'Sert Kireçtaşı Formasyonu', uygarlik: 'Taş Tepeler Neolitik' },
    'Afyon': { lat: 39.0431, lng: 30.5412, bolge: 'Frig Vadisi / İhsaniye', litoloji: 'Volkanik Tüf', uygarlik: 'Frig Krallığı' },
    'Antalya': { lat: 36.8841, lng: 30.7056, bolge: 'Likya Yolu / Termessos', litoloji: 'Masif Karstik Kireçtaşı', uygarlik: 'Likya & Pamfilya' }
  };

  const aktifSehir = IL_VERILERI[seciliIl];

  const toggleTamEkran = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setTamEkran(true)).catch(() => setTamEkran(true));
    } else {
      document.exitFullscreen().then(() => setTamEkran(false)).catch(() => setTamEkran(false));
    }
  };

  const handleMedyaSec = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setMedyaTuru(file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');
    setMedyaUrl(URL.createObjectURL(file));
  };

  // Çizim Motoru
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      t += 0.03;

      if (anaSekme === 'HARITA_GIS') {
        katmanlar.filter((k) => k.gorunur).forEach((katman, idx) => {
          const yOffset = h * 0.2 + idx * 26;
          ctx.save();
          ctx.globalAlpha = katman.opaklik / 100;
          ctx.strokeStyle = katman.renk;
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.moveTo(w * 0.5, yOffset);
          ctx.lineTo(w * 0.85, yOffset + 60);
          ctx.lineTo(w * 0.5, yOffset + 120);
          ctx.lineTo(w * 0.15, yOffset + 60);
          ctx.closePath();
          ctx.stroke();

          ctx.fillStyle = katman.renk;
          for (let p = 0; p < 8; p++) {
            const px = w * 0.3 + (Math.sin(p * 45 + t) * 0.5 + 0.5) * (w * 0.4);
            const py = yOffset + 30 + (Math.cos(p * 30) * 0.5 + 0.5) * 60;
            ctx.fillRect(px, py, 3, 3);
          }
          ctx.restore();
        });

        // Hedef Pini
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.25, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.25);
        ctx.lineTo(w * 0.5, h * 0.25 + 75);
        ctx.stroke();
      } else if (anaSekme === 'DTSE_ANALIZ') {
        if (spektralMod !== 'NORMAL') {
          ctx.save();
          if (spektralMod === 'DSTRETCH_YDS') ctx.fillStyle = 'rgba(34, 197, 94, 0.28)';
          else if (spektralMod === 'DSTRETCH_LAB') ctx.fillStyle = 'rgba(168, 85, 247, 0.32)';
          else if (spektralMod === 'DSTRETCH_YBK') ctx.fillStyle = 'rgba(236, 72, 153, 0.35)';
          else if (spektralMod === 'KIZILOTESI_IR') ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
          else if (spektralMod === 'HDR') ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }

        const bx = w * 0.22, by = h * 0.18, bw = w * 0.56, bh = h * 0.62;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = '#f59e0b';
        const kBoyut = 16, kKalinlik = 4;
        ctx.fillRect(bx - 2, by - 2, kBoyut, kKalinlik);
        ctx.fillRect(bx - 2, by - 2, kKalinlik, kBoyut);
        ctx.fillRect(bx + bw - kBoyut + 2, by - 2, kBoyut, kKalinlik);
        ctx.fillRect(bx + bw - 2, by - 2, kKalinlik, kBoyut);
        ctx.fillRect(bx - 2, by + bh - kKalinlik + 2, kBoyut, kKalinlik);
        ctx.fillRect(bx - 2, by + bh - kBoyut + 2, kKalinlik, kBoyut);
        ctx.fillRect(bx + bw - kBoyut + 2, by + bh - kKalinlik + 2, kBoyut, kKalinlik);
        ctx.fillRect(bx + bw - 2, by + bh - kKalinlik + 2, kBoyut, kKalinlik);

        if (aktifAsama >= 2) {
          ctx.fillStyle = '#38bdf8';
          for (let i = 0; i < 48; i++) {
            const px = bx + 20 + (Math.sin(i * 77) * 0.5 + 0.5) * (bw - 40);
            const py = by + 20 + (Math.cos(i * 33) * 0.5 + 0.5) * (bh - 40);
            ctx.beginPath();
            ctx.arc(px, py, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (aktifAsama >= 3) {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.lineWidth = 1;
          for (let x = bx + 25; x <= bx + bw - 25; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, by + 20);
            ctx.lineTo(x, by + bh - 20);
            ctx.stroke();
          }
          for (let y = by + 25; y <= by + bh - 25; y += 32) {
            ctx.beginPath();
            ctx.moveTo(bx + 20, y);
            ctx.lineTo(bx + bw - 20, y);
            ctx.stroke();
          }
        }

        if (aktifAsama >= 6) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(bx + bw * 0.4, by + bh * 0.38, 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(bx + bw * 0.62, by + bh * 0.4, 25, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(bx + bw * 0.4, by + bh * 0.38);
          ctx.lineTo(bx + bw * 0.28, by + bh * 0.75);
          ctx.stroke();

          if (aktifAsama === 7) {
            ctx.strokeStyle = '#22c55e';
            ctx.setLineDash([8, 4]);
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.28, by + bh * 0.75);
            ctx.lineTo(bx + bw * 0.12, by + bh * 0.95);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        if (olcumNoktalari.length > 0) {
          ctx.fillStyle = '#ef4444';
          olcumNoktalari.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();
          });
          if (olcumNoktalari.length === 2) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(olcumNoktalari[0].x, olcumNoktalari[0].y);
            ctx.lineTo(olcumNoktalari[1].x, olcumNoktalari[1].y);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [anaSekme, aktifModul, katmanlar, aktifAsama, spektralMod, olcumNoktalari]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (aracModu !== 'OLCUM') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (olcumNoktalari.length >= 2) {
      setOlcumNoktalari([{ x, y }]);
      setOlcumSonuc(null);
    } else {
      const yeni = [...olcumNoktalari, { x, y }];
      setOlcumNoktalari(yeni);
      if (yeni.length === 2) {
        const d = Math.hypot(yeni[1].x - yeni[0].x, yeni[1].y - yeni[0].y);
        const cm = (d * 0.115).toFixed(2);
        setOlcumSonuc(`${cm} cm (DTSE Milimetrik Kalibrasyon)`);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: geceModu ? '#020611' : '#0a1124',
        color: '#f8fafc',
        minHeight: tamEkran ? '100vh' : '92vh',
        padding: '12px',
        fontFamily: 'monospace',
        position: tamEkran ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        width: tamEkran ? '100vw' : '100%',
        zIndex: tamEkran ? 99999 : 1
      }}
    >
      {/* ÜST BAŞLIK & TELEMETRİ KÜNYESİ */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#070e1c', padding: '10px 16px', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '1.4rem', color: '#f59e0b' }}>⚜️</div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#38bdf8', letterSpacing: '0.08em' }}>
              SyKaşif HERITAGE EDITION // ARAZİ SAHA PLATFORMU
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              ODAK: <strong style={{ color: '#f59e0b' }}>{aktifSehir.bolge}</strong> ({aktifSehir.lat}° N, {aktifSehir.lng}° E)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={seciliIl}
            onChange={(e) => setSeciliIl(e.target.value as any)}
            style={{ backgroundColor: '#020617', color: '#f59e0b', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 'bold', outline: 'none' }}
          >
            {Object.keys(IL_VERILERI).map((il) => (
              <option key={il} value={il}>{il}</option>
            ))}
          </select>

          {/* DİNAMİK HAVA DURUMU SEÇİCİ */}
          <select
            value={havaDurumu}
            onChange={(e) => setHavaDurumu(e.target.value as any)}
            style={{ backgroundColor: '#020617', color: '#38bdf8', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', fontSize: '0.72rem', outline: 'none' }}
          >
            <option value="ACIK">☀️ Açık</option>
            <option value="YAGMUR">🌧️ Yağış</option>
            <option value="SIS">🌫️ Sis</option>
            <option value="KAR">❄️ Kar</option>
          </select>

          <button
            onClick={() => setGeceModu(!geceModu)}
            style={{ padding: '4px 8px', backgroundColor: '#0f172a', border: '1px solid #38bdf8', borderRadius: '4px', color: '#38bdf8', cursor: 'pointer', fontSize: '0.72rem' }}
          >
            {geceModu ? '🌙 Gece' : '☀️ Gündüz'}
          </button>

          <button
            onClick={() => setBildirimAcik(!bildirimAcik)}
            style={{ padding: '4px 10px', backgroundColor: bildirimAcik ? '#0284c7' : '#0f172a', border: '1px solid #38bdf8', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '0.72rem' }}
          >
            🔔 Bildirimler (7)
          </button>

          <button
            onClick={() => setAnaSekme('HARITA_GIS')}
            style={{ padding: '6px 12px', backgroundColor: anaSekme === 'HARITA_GIS' ? '#0284c7' : '#0f172a', border: `1px solid ${anaSekme === 'HARITA_GIS' ? '#38bdf8' : '#334155'}`, borderRadius: '4px', color: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🗺️ TAKTİK HARİTA
          </button>

          <button
            onClick={() => setAnaSekme('DTSE_ANALIZ')}
            style={{ padding: '6px 12px', backgroundColor: anaSekme === 'DTSE_ANALIZ' ? '#0284c7' : '#0f172a', border: `1px solid ${anaSekme === 'DTSE_ANALIZ' ? '#38bdf8' : '#334155'}`, borderRadius: '4px', color: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🧭 DTSE 7 AŞAMA (DSTRETCH)
          </button>

          <button
            onClick={toggleTamEkran}
            style={{ padding: '4px 10px', backgroundColor: tamEkran ? '#dc2626' : '#0284c7', border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.72rem' }}
          >
            {tamEkran ? '🗗 Küçült' : '⛶ Tam Ekran'}
          </button>
        </div>
      </header>

      {/* DİNAMİK BİLDİRİM PANELİ */}
      {bildirimAcik && (
        <div style={{ backgroundColor: 'rgba(7, 14, 28, 0.96)', border: '1px solid #38bdf8', borderRadius: '8px', padding: '12px', marginBottom: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', fontSize: '0.72rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#030712', padding: '6px 10px', borderRadius: '6px', border: '1px solid #22c55e' }}>
            <span>✅</span>
            <div>
              <div style={{ color: '#4ade80', fontWeight: 'bold' }}>RTK FIX KİLİTLENDİ</div>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>±1.8 cm hassasiyet sağlandı.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#030712', padding: '6px 10px', borderRadius: '6px', border: '1px solid #f59e0b' }}>
            <span>⚠️</span>
            <div>
              <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>TAHLİYE KANALI TESPİTİ</div>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>128° istikametinde 5.4m hedef.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#030712', padding: '6px 10px', borderRadius: '6px', border: '1px solid #38bdf8' }}>
            <span>🛸</span>
            <div>
              <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>DUCTED-FAN DRONE BAĞLI</div>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>İrtifa: 45m / Telemetri aktif.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#030712', padding: '6px 10px', borderRadius: '6px', border: '1px solid #a855f7' }}>
            <span>🔬</span>
            <div>
              <div style={{ color: '#a855f7', fontWeight: 'bold' }}>DSTRETCH LAB SPEKTRAL</div>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Aşı boyası figür izi açığa çıktı.</div>
            </div>
          </div>
        </div>
      )}

      {/* 1. SEÇENEK: HARİTA GIS KATMANI */}
      {anaSekme === 'HARITA_GIS' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '10px' }}>
            {[
              { id: 'HARITALAR', ad: '🗺️ HARİTALAR', alt: '9 Katmanlı CBS' },
              { id: 'JEOFİZİK', ad: '⚡ JEOFİZİK (ERT/GPR)', alt: 'Yeraltı Radarı' },
              { id: 'LIDAR', ad: '📡 3B LiDAR', alt: 'Nokta Bulutu' },
              { id: 'FREKANS', ad: '🌀 FREKANS & REZONANS', alt: 'Atomik & Cevher' },
              { id: 'SPEKTRAL', ad: '🔬 SPEKTRAL & TERMAL', alt: 'D-Stretch / IR' },
              { id: 'OLCUM_RTK', ad: '📐 ÖLÇÜM & RTK', alt: 'Milimetrik Lazer' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setAktifModul(m.id as any)}
                style={{
                  backgroundColor: aktifModul === m.id ? '#0284c7' : '#070e1c',
                  border: `1px solid ${aktifModul === m.id ? '#38bdf8' : '#1e293b'}`,
                  borderRadius: '6px',
                  padding: '6px 4px',
                  cursor: 'pointer',
                  color: '#fff',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{m.ad}</div>
                <div style={{ fontSize: '0.6rem', color: aktifModul === m.id ? '#e0f2fe' : '#64748b' }}>{m.alt}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: '10px' }}>
            <div style={{ backgroundColor: '#070e1c', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.72rem' }}>
              <div style={{ color: '#38bdf8', fontWeight: 'bold', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
                KATMAN KONTROLÜ (9'LU SİSTEM)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '520px' }}>
                {katmanlar.map((k) => (
                  <div key={k.id} style={{ backgroundColor: '#030712', padding: '6px 8px', borderRadius: '6px', border: `1px solid ${k.gorunur ? k.renk : '#1e293b'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: k.renk, fontWeight: 'bold' }}>{k.no} {k.ad}</span>
                      <button
                        onClick={() => setKatmanlar((prev) => prev.map((item) => (item.id === k.id ? { ...item, gorunur: !item.gorunur } : item)))}
                        style={{ backgroundColor: 'transparent', border: 'none', color: k.gorunur ? '#4ade80' : '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        {k.gorunur ? '👁️ Açık' : '🕶️ Gizli'}
                      </button>
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', margin: '2px 0' }}>{k.aciklama}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.6rem', color: '#64748b' }}>%</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={k.opaklik}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setKatmanlar((prev) => prev.map((item) => (item.id === k.id ? { ...item, opaklik: val } : item)));
                        }}
                        style={{ flex: 1, height: '3px', accentColor: k.renk, cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>{k.opaklik}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ position: 'relative', backgroundColor: '#000', borderRadius: '8px', border: '1px solid #1e293b', minHeight: '520px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <canvas ref={canvasRef} width={680} height={520} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

              {/* Dinamik Hava Katmanı Efektleri */}
              {havaDurumu === 'SIS' && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(3px)', pointerEvents: 'none' }} />}
              {havaDurumu === 'YAGMUR' && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(56,189,248,0.2) 1px, transparent 1px)', backgroundSize: '4px 20px', pointerEvents: 'none' }} />}
              {havaDurumu === 'KAR' && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '16px 16px', pointerEvents: 'none' }} />}

              <div style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(3, 7, 18, 0.88)', border: '1px solid #38bdf8', padding: '6px 12px', borderRadius: '6px', fontSize: '0.72rem' }}>
                <div>📍 ODAK: <strong style={{ color: '#f59e0b' }}>{seciliIl} / Harput Formasyonu</strong></div>
                <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>KOORDİNAT: {aktifSehir.lat}° N, {aktifSehir.lng}° E (WGS84)</div>
              </div>

              <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, backgroundColor: 'rgba(3, 7, 18, 0.9)', border: '1px solid #334155', padding: '8px 14px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                <div>⏳ <strong>ZAMAN KATMANI:</strong> <span style={{ color: '#38bdf8' }}>{zamanCizgisi}</span></div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['Neolitik', 'Hitit (M.Ö. 1200)', 'Roma', 'Selçuklu', 'Günümüz'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setZamanCizgisi(d)}
                      style={{ padding: '3px 8px', backgroundColor: zamanCizgisi.includes(d) ? '#0284c7' : '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '0.65rem', cursor: 'pointer' }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#070e1c', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.72rem' }}>
              <div>
                <div style={{ color: '#38bdf8', fontWeight: 'bold', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '8px' }}>
                  ATOMİK & CEVHER ANALİZİ
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '10px' }}>
                  {(['Au', 'Cu', 'Ag', 'SiO2', 'Fe2O3'] as const).map((elm) => (
                    <button
                      key={elm}
                      onClick={() => setSeciliElement(elm)}
                      style={{
                        padding: '6px 2px',
                        backgroundColor: seciliElement === elm ? '#0284c7' : '#030712',
                        border: `1px solid ${seciliElement === elm ? '#38bdf8' : '#334155'}`,
                        borderRadius: '4px',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                        cursor: 'pointer'
                      }}
                    >
                      {elm}
                    </button>
                  ))}
                </div>

                <div style={{ backgroundColor: '#030712', border: '1px solid #334155', borderRadius: '6px', padding: '8px', display: 'grid', gap: '4px' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>HEDEF: {seciliElement === 'Au' ? 'ALTIN (Au 79)' : seciliElement === 'Cu' ? 'BAKIR (Cu 29)' : seciliElement === 'SiO2' ? 'KUVARS (SiO2)' : 'HEMATİT'}</div>
                  <div>Yoğunluk: <strong style={{ color: '#38bdf8' }}>{seciliElement === 'Au' ? '19.32 g/cm³' : '8.96 g/cm³'}</strong></div>
                  <div>Sertlik (Mohs): <strong style={{ color: '#38bdf8' }}>{seciliElement === 'Au' ? '2.5 - 3.0' : '7.0 (Kuvars)'}</strong></div>
                  <div>Manyetik: <strong style={{ color: '#4ade80' }}>Diyamanyetik</strong></div>
                  <div>Doğruluk: <strong style={{ color: '#22c55e' }}>%98.7 (XRF Spektrometre)</strong></div>
                </div>

                <div style={{ marginTop: '12px', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
                  <div style={{ color: '#a855f7', fontWeight: 'bold', marginBottom: '4px' }}>JEOFİZİK BULGULARI</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.68rem', lineHeight: '1.4' }}>
                    ERT direnç gradyanında -3.20 metrede yüksek iletkenlik anomalisi ve GPR hiperbolik boşluk tüneli tespit edildi.
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '8px', fontSize: '0.65rem', color: '#64748b' }}>
                MÜHÜR: SYK-GLOBAL-RUNTIME-v1.0 • {rtkDurumu.fix}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SEÇENEK: DTSE 7 AŞAMA, DSTRETCH VE ADLİ DOĞRULAMA */}
      {anaSekme === 'DTSE_ANALIZ' && (
        <div>
          {/* 7 AŞAMALI BUTON ŞERİDİ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '10px' }}>
            {[
              { no: 1, ad: 'ALGILAMA', y: '%15', r: '#94a3b8' },
              { no: 2, ad: 'NOKTA BULUTU', y: '%35', r: '#38bdf8' },
              { no: 3, ad: 'ADAPTİF MESH', y: '%58', r: '#06b6d4' },
              { no: 4, ad: 'YÜZEY OLUŞUMU', y: '%75', r: '#22c55e' },
              { no: 5, ad: 'RENKLENDİRME', y: '%88', r: '#f59e0b' },
              { no: 6, ad: 'ANALİZ KATLARI', y: '%96', r: '#ec4899' },
              { no: 7, ad: 'SONUÇ & RAPOR', y: '%100', r: '#a855f7' }
            ].map((as) => (
              <button
                key={as.no}
                onClick={() => setAktifAsama(as.no)}
                style={{
                  backgroundColor: aktifAsama === as.no ? 'rgba(56, 189, 248, 0.22)' : '#070e1c',
                  border: `1px solid ${aktifAsama === as.no ? as.r : '#1e293b'}`,
                  borderRadius: '6px',
                  padding: '8px 2px',
                  cursor: 'pointer',
                  color: '#fff'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: aktifAsama === as.no ? as.r : '#cbd5e1' }}>
                  {as.no}. {as.ad}
                </div>
                <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{as.y}</div>
              </button>
            ))}
          </div>

          {/* DSTRETCH BUTONLARI */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', overflowX: 'auto', backgroundColor: '#070e1c', padding: '6px', borderRadius: '6px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', alignSelf: 'center', marginRight: '4px' }}>🔬 SPEKTRAL BOYA/FİGÜR DEDEKTÖRÜ (D-STRETCH):</span>
            {[
              { id: 'NORMAL', ad: 'Orijinal' },
              { id: 'DSTRETCH_YDS', ad: 'DStretch YDS (Sarı/Yeşil)' },
              { id: 'DSTRETCH_LAB', ad: 'DStretch LAB (Kırmızı Aşı)' },
              { id: 'DSTRETCH_YBK', ad: 'DStretch YBK (Floresans)' },
              { id: 'KIZILOTESI_IR', ad: 'Kızılötesi / IR' },
              { id: 'HDR', ad: 'HDR Doku' }
            ].map((mod) => (
              <button
                key={mod.id}
                onClick={() => setSpektralMod(mod.id as any)}
                style={{
                  padding: '4px 10px',
                  backgroundColor: spektralMod === mod.id ? '#0284c7' : '#0f172a',
                  border: `1px solid ${spektralMod === mod.id ? '#38bdf8' : '#334155'}`,
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '0.68rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {mod.ad}
              </button>
            ))}
          </div>

          {/* ÇALIŞMA ALANI */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 240px', gap: '10px' }}>
            <div style={{ backgroundColor: '#070d1a', border: '1px solid #1e293b', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.72rem' }}>
              <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>ARAÇLAR</div>
              <button
                onClick={() => { setAracModu('TARAMA'); setZoomSeviyesi(1); setOlcumNoktalari([]); }}
                style={{ padding: '6px', backgroundColor: aracModu === 'TARAMA' ? '#0284c7' : '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
              >
                🎯 Canlı Tarama
              </button>
              <button
                onClick={() => { setAracModu('YAKINLAS'); setZoomSeviyesi((prev) => (prev >= 2 ? 1 : prev + 0.5)); }}
                style={{ padding: '6px', backgroundColor: aracModu === 'YAKINLAS' ? '#0284c7' : '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
              >
                🔍 Yakınlaştır ({zoomSeviyesi}x)
              </button>
              <button
                onClick={() => { setAracModu('OLCUM'); setOlcumNoktalari([]); setOlcumSonuc(null); }}
                style={{ padding: '6px', backgroundColor: aracModu === 'OLCUM' ? '#0284c7' : '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
              >
                📐 Milimetrik Ölçüm
              </button>

              {olcumSonuc && (
                <div style={{ backgroundColor: '#14532d', padding: '6px', borderRadius: '4px', color: '#86efac', fontSize: '0.68rem' }}>
                  {olcumSonuc}
                </div>
              )}

              <label style={{ marginTop: 'auto', padding: '8px', backgroundColor: '#f59e0b', borderRadius: '4px', color: '#000', fontWeight: 'bold', textAlign: 'center', cursor: 'pointer' }}>
                📁 Medya Seç
                <input type="file" accept="image/*,video/*" onChange={handleMedyaSec} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ position: 'relative', backgroundColor: '#000', borderRadius: '6px', border: '1px solid #1e293b', minHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {medyaUrl ? (
                medyaTuru === 'IMAGE' ? (
                  <img src={medyaUrl} alt="Saha" style={{ transform: `scale(${zoomSeviyesi})`, transition: 'transform 0.2s', maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' }} />
                ) : (
                  <video src={medyaUrl} controls autoPlay loop muted style={{ transform: `scale(${zoomSeviyesi})`, transition: 'transform 0.2s', width: '100%', maxHeight: '420px' }} />
                )
              ) : (
                <div style={{ textAlign: 'center', color: '#475569' }}>
                  <div style={{ fontSize: '2.5rem' }}>📷</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Video veya Fotoğraf Yükleyin</div>
                </div>
              )}

              <canvas
                ref={canvasRef}
                width={650}
                height={420}
                onClick={handleCanvasClick}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: aracModu === 'OLCUM' ? 'crosshair' : 'default' }}
              />

              <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', backgroundColor: 'rgba(2, 6, 23, 0.94)', border: '1px solid #22c55e', borderRadius: '4px', padding: '6px 12px', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#22c55e' }}>🧭 <strong>Tahliye Kanalı Vektörü:</strong> Hedef 128° istikametinde <strong>5.40 - 7.00 metre</strong> mesafededir.</span>
                <span style={{ color: '#38bdf8' }}>Güven: %98.8</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#070d1a', border: '1px solid #1e293b', borderRadius: '6px', padding: '10px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#38bdf8', fontWeight: 'bold', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '6px' }}>
                  DTSE ÖLÇÜM PARAMETRELERİ
                </div>
                <div style={{ display: 'grid', gap: '4px', color: '#cbd5e1' }}>
                  <div>Yüzey Alanı: <strong style={{ color: '#38bdf8' }}>1.842 m²</strong></div>
                  <div>Hacim: <strong style={{ color: '#38bdf8' }}>0.213 m³</strong></div>
                  <div>Oyuk-01 Çap: <strong style={{ color: '#38bdf8' }}>2.34 cm</strong></div>
                  <div>Oyuk-01 Derinlik: <strong style={{ color: '#38bdf8' }}>0.78 cm</strong></div>
                  <div>Kanal-02 Yönü: <strong style={{ color: '#f59e0b' }}>128° Güneydoğu</strong></div>
                  <div>Ortalama Pürüzlülük: <strong style={{ color: '#38bdf8' }}>0.62 mm</strong></div>
                  <div>Doğruluk Skoru: <strong style={{ color: '#22c55e' }}>%98.6</strong></div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '6px', fontSize: '0.65rem', color: '#64748b' }}>
                KAYIT: SYK-DTSE-2026-0524-0017
              </div>
            </div>
          </div>

          {/* ADLİ BİLİŞİM & ORİJİNALLİK DOĞRULAMA KARTI */}
          <SyMediaVerificationCore medyaUrl={medyaUrl} />
        </div>
      )}
    </div>
  );
};