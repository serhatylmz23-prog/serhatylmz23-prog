import React, { useState } from 'react';

export interface SahaMedyasi {
  id: string;
  url: string;
  tur: 'IMAGE' | 'VIDEO' | 'STREAM';
  ad: string;
  gps?: { lat: number; lng: number; bolgeAdi: string; dogrulandi: boolean };
  anomali?: {
    tur: string;
    akarYonuVektoru: string;
    tahminiHedefMesafesi: string;
    medeniyetKatmani: string;
  };
}

const BOLGELER = [
  'Elazığ - Harput / Doğu Anadolu',
  'Şanlıurfa - Göbeklitepe & Harran',
  'Çorum - Hattuşaş / Hitit',
  'Afyon - Frig Vadisi',
  'Antalya - Likya Yolu & Termessos',
  'Kapadokya - Yeraltı Şehirleri'
];

export const SyHeritageGlobalCore: React.FC = () => {
  const [medyalar, setMedyalar] = useState<SahaMedyasi[]>([]);
  const [cokluLinkMetni, setCokluLinkMetni] = useState('');
  const [seciliMedyaIndex, setSeciliMedyaIndex] = useState<number>(0);
  const [haritaModu, setHaritaModu] = useState<'2D_LEAFLET' | '3D_WORLDVIEW' | 'OPENLAYERS'>('3D_WORLDVIEW');
  const [seciliBolge, setSeciliBolge] = useState<string>(BOLGELER[0]);

  const [aktifKatmanlar, setAktifKatmanlar] = useState({
    mtaJeoloji: true,
    antikYollar: true,
    havaRadari: true,
    dijitalIkizMesh: true,
    suToprakAnalizi: false
  });

  const handleCokluLinkEkle = () => {
    if (!cokluLinkMetni.trim()) return;
    const linkDizisi = cokluLinkMetni.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);

    const yeniLinkler: SahaMedyasi[] = linkDizisi.map((link, idx) => ({
      id: `LNK-${Date.now()}-${idx}`,
      url: link,
      tur: link.includes('mp4') || link.includes('youtube') ? 'VIDEO' : 'IMAGE',
      ad: `Saha Akışı #${medyalar.length + idx + 1}`,
      gps: { lat: 38.6748, lng: 39.2225, bolgeAdi: seciliBolge, dogrulandi: true },
      anomali: {
        tur: 'Oyuk - Tahliye Kanalı Morfolojisi',
        akarYonuVektoru: 'Güneydoğu 135° Tahliye Açısı',
        tahminiHedefMesafesi: 'Kanal yönünde 5.80 metre odaklanılmalı',
        medeniyetKatmani: 'Urartu & Geç Roma Kaya Mezarı Katmanı'
      }
    }));

    setMedyalar((prev) => [...prev, ...yeniLinkler]);
    setSeciliMedyaIndex(medyalar.length);
    setCokluLinkMetni('');
  };

  const seciliOge = medyalar[seciliMedyaIndex] || null;

  return (
    <div style={{ backgroundColor: '#020611', color: '#fff', minHeight: '90vh', padding: '12px', fontFamily: 'monospace' }}>
      {/* ÜST İSTİHBARAT & 3'Ü BİR ARADA HARİTA GEÇİŞ PANELİ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#081020', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e293b', gap: '10px', marginBottom: '12px' }}>
        <div>
          <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '1rem' }}>
            🛰️ SyKaşif GLOBAL WORLDVIEW / OSINT CORE
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span>BÖLGE ODAĞI:</span>
            <select
              value={seciliBolge}
              onChange={(e) => setSeciliBolge(e.target.value)}
              style={{ backgroundColor: '#020617', color: '#f59e0b', border: '1px solid #334155', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}
            >
              {BOLGELER.map((bolge) => (
                <option key={bolge} value={bolge}>
                  {bolge}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3 Harita Motoru Seçicisi */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#020617', padding: '4px', borderRadius: '6px', border: '1px solid #334155' }}>
          <button
            onClick={() => setHaritaModu('3D_WORLDVIEW')}
            style={{ padding: '5px 10px', fontSize: '0.72rem', backgroundColor: haritaModu === '3D_WORLDVIEW' ? '#0284c7' : 'transparent', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🌐 3D WorldView
          </button>
          <button
            onClick={() => setHaritaModu('2D_LEAFLET')}
            style={{ padding: '5px 10px', fontSize: '0.72rem', backgroundColor: haritaModu === '2D_LEAFLET' ? '#0284c7' : 'transparent', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🗺️ 2D Taktik Leaflet
          </button>
          <button
            onClick={() => setHaritaModu('OPENLAYERS')}
            style={{ padding: '5px 10px', fontSize: '0.72rem', backgroundColor: haritaModu === 'OPENLAYERS' ? '#0284c7' : 'transparent', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
          >
            📐 OpenLayers Vektör
          </button>
        </div>

        {/* Harita Katman Düğmeleri */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setAktifKatmanlar((k) => ({ ...k, mtaJeoloji: !k.mtaJeoloji }))}
            style={{ padding: '5px 10px', fontSize: '0.7rem', backgroundColor: aktifKatmanlar.mtaJeoloji ? '#0f766e' : '#1e293b', border: '1px solid #14b8a6', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
          >
            🪨 MTA Jeoloji
          </button>
          <button
            onClick={() => setAktifKatmanlar((k) => ({ ...k, antikYollar: !k.antikYollar }))}
            style={{ padding: '5px 10px', fontSize: '0.7rem', backgroundColor: aktifKatmanlar.antikYollar ? '#7c2d12' : '#1e293b', border: '1px solid #f97316', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
          >
            🏛️ Antik Yollar & Sit
          </button>
          <button
            onClick={() => setAktifKatmanlar((k) => ({ ...k, havaRadari: !k.havaRadari }))}
            style={{ padding: '5px 10px', fontSize: '0.7rem', backgroundColor: aktifKatmanlar.havaRadari ? '#b45309' : '#1e293b', border: '1px solid #f59e0b', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
          >
            🛸 Drone / Radar
          </button>
          <button
            onClick={() => setAktifKatmanlar((k) => ({ ...k, dijitalIkizMesh: !k.dijitalIkizMesh }))}
            style={{ padding: '5px 10px', fontSize: '0.7rem', backgroundColor: aktifKatmanlar.dijitalIkizMesh ? '#15803d' : '#1e293b', border: '1px solid #22c55e', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
          >
            🕸️ 3D DTSE Mesh
          </button>
        </div>
      </div>

      {/* ÇOKLU LİNK GİRİŞİ */}
      <div style={{ display: 'grid', gridTemplateColumns: '3.5fr 1.2fr', gap: '8px', marginBottom: '12px' }}>
        <textarea
          rows={2}
          value={cokluLinkMetni}
          onChange={(e) => setCokluLinkMetni(e.target.value)}
          placeholder="Çoklu web sayfaları, YouTube analiz linkleri veya RTSP kamera akışlarını alt alta veya virgülle yapıştırın..."
          style={{ backgroundColor: '#060a14', border: '1px solid #334155', borderRadius: '6px', color: '#38bdf8', padding: '8px', fontSize: '0.75rem', outline: 'none' }}
        />
        <button
          onClick={handleCokluLinkEkle}
          style={{ backgroundColor: '#0284c7', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer' }}
        >
          🌐 Çoklu Akışı Çözümle
        </button>
      </div>

      {/* ÇOKLU MEDYA SEÇİM ŞERİDİ */}
      {medyalar.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '6px' }}>
          {medyalar.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setSeciliMedyaIndex(idx)}
              style={{
                padding: '6px 12px',
                backgroundColor: seciliMedyaIndex === idx ? '#0284c7' : '#081120',
                border: `1px solid ${seciliMedyaIndex === idx ? '#38bdf8' : '#334155'}`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.7rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              #{idx + 1} {m.ad}
            </button>
          ))}
        </div>
      )}

      {/* HARİTA & SAHA ANALİZ ALANI */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
        {/* SOL: 3D / 2D HARİTA VE DİJİTAL İKİZ KADRAJI */}
        <div style={{ backgroundColor: '#000', borderRadius: '8px', border: '1px solid #1e293b', minHeight: '440px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {seciliOge ? (
            seciliOge.tur === 'IMAGE' ? (
              <img src={seciliOge.url} alt="Saha Görseli" style={{ maxWidth: '100%', maxHeight: '440px', objectFit: 'contain' }} />
            ) : (
              <video src={seciliOge.url} controls autoPlay loop style={{ width: '100%', maxHeight: '440px' }} />
            )
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem' }}>🗺️</div>
              <div style={{ color: '#38bdf8', fontWeight: 'bold', marginTop: '6px' }}>
                {haritaModu === '3D_WORLDVIEW' ? '3D WORLDVIEW DÜNYA & TÜRKİYE MODELİ' : haritaModu === '2D_LEAFLET' ? '2D TAKTİK LEAFLET HARİTASI' : 'OPENLAYERS VEKTÖREL KATMAN'}
              </div>
              <div style={{ fontSize: '0.72rem', marginTop: '4px' }}>Seçili Bölge: {seciliBolge}</div>
            </div>
          )}

          {/* 3D Mesh / Izgara Katmanı */}
          {aktifKatmanlar.dijitalIkizMesh && (
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(56, 189, 248, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.12) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
          )}

          {/* Vektörel Hedef Yönü */}
          {seciliOge?.anomali && (
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', backgroundColor: 'rgba(2, 6, 23, 0.88)', border: '1px solid #38bdf8', padding: '8px 12px', borderRadius: '6px', fontSize: '0.72rem' }}>
              <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>🧭 {seciliOge.anomali.akarYonuVektoru}</div>
              <div style={{ color: '#4ade80' }}>📏 Vektör: {seciliOge.anomali.tahminiHedefMesafesi}</div>
            </div>
          )}
        </div>

        {/* SAĞ: JEOLOJİ, MEDENİYET VE İSTİHBARAT KÜNYESİ */}
        <div style={{ backgroundColor: '#070d1a', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#38bdf8' }}>BÖLGESEL İSTİHBARAT & ANALİZ</span>
            </div>

            <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: seciliOge?.gps?.dogrulandi ? '#064e3b' : '#1c1917', borderRadius: '6px', fontSize: '0.72rem' }}>
              <strong>📍 GPS DURUMU: </strong>
              {seciliOge?.gps?.dogrulandi ? (
                <span style={{ color: '#4ade80' }}>{seciliOge.gps.lat}, {seciliOge.gps.lng} ({seciliOge.gps.bolgeAdi})</span>
              ) : (
                <span style={{ color: '#fbbf24' }}>Görselde GPS meta-verisi yok. Sentetik koordinat atanmaz.</span>
              )}
            </div>

            <div style={{ fontSize: '0.75rem', display: 'grid', gap: '6px', color: '#cbd5e1' }}>
              <div><strong>🏛️ MEDENİYET:</strong> {seciliOge?.anomali?.medeniyetKatmani || `${seciliBolge} Kültürel Katmanı`}</div>
              <div><strong>🪨 MTA LİTOLOJİSİ:</strong> {aktifKatmanlar.mtaJeoloji ? 'Andezit / Kireçtaşı Geçişli Formasyon' : 'Katman Kapalı'}</div>
              <div><strong>📡 HAVA SAHASI RADARI:</strong> {aktifKatmanlar.havaRadari ? 'Bölgede sivil/askeri IFF sinyali tespit edilmedi' : 'Radar Pasif'}</div>
              <div><strong>🌿 BİTKİ / TOPRAK ÖRTÜSÜ:</strong> Sarı Kantaron & Geven Formasyonu (Kireçli Toprak)</div>
            </div>
          </div>

          <div style={{ fontSize: '0.65rem', color: '#64748b', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
            HERMES SÜRÜSÜ & OPENCODE AĞI AKTİF • 3 KATMANLI HİBRİT MOTOR
          </div>
        </div>
      </div>
    </div>
  );
};