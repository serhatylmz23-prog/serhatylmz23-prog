import React, { useState, useEffect, useRef } from 'react';

interface HaritaKatmani {
  id: string;
  ad: string;
  ikon: string;
  aktif: boolean;
  veriAdedi: number;
}

interface BolgeOlayi {
  id: string;
  baslik: string;
  kategori: 'ARKEOLOJI' | 'MTA_JEOLOJI' | 'RADAR' | 'BOTANIK';
  detay: string;
  koordinat: string;
  guven: number;
  zaman: string;
  lat: number;
  lng: number;
}

const VARSAYILAN_KATMANLAR: HaritaKatmani[] = [
  { id: 'kat_mta', ad: 'MTA Jeoloji & Diri Fay Hatları', ikon: '🪨', aktif: true, veriAdedi: 142 },
  { id: 'kat_arkeo', ad: 'Kültür Envanteri & Höyük/Sit', ikon: '🏛️', aktif: true, veriAdedi: 89 },
  { id: 'kat_radar', ad: 'Drone / ADS-B Canlı Radar', ikon: '🛸', aktif: true, veriAdedi: 6 },
  { id: 'kat_deprem', ad: 'Kandilli / Son Sismik Hareketler', ikon: '⚡', aktif: false, veriAdedi: 12 },
  { id: 'kat_botanik', ad: 'Anadolu Florası & Toprak Mineralleri', ikon: '🌿', aktif: true, veriAdedi: 54 },
  { id: 'kat_termal', ad: 'Termal / Karstik Boşluk Anomalisi', ikon: '📡', aktif: false, veriAdedi: 18 }
];

const TURKIYE_SAHA_VERILERI: Record<string, BolgeOlayi[]> = {
  'Elazığ': [
    {
      id: 'ELZ-01',
      baslik: 'Harput Kalesi & Su Tünelleri',
      kategori: 'ARKEOLOJI',
      detay: 'Urartu basamaklı su tünelleri ve kaya mezarı formasyonu teyitli.',
      koordinat: '38.7042° N, 39.2561° E',
      lat: 38.7042,
      lng: 39.2561,
      guven: 98,
      zaman: '5 dk önce doğrulandı'
    },
    {
      id: 'ELZ-02',
      baslik: 'MTA Doğu Anadolu Litolojisi',
      kategori: 'MTA_JEOLOJI',
      detay: 'Kireçtaşı-Andezit litolojik geçiş zonu. Doğal karstik boşluk riski: Düşük.',
      koordinat: '38.6748° N, 39.2225° E',
      lat: 38.6748,
      lng: 39.2225,
      guven: 96,
      zaman: 'MTA Katmanı Aktif'
    }
  ],
  'Malatya': [
    {
      id: 'MLT-01',
      baslik: 'Arslantepe Höyüğü Çevre Katmanı',
      kategori: 'ARKEOLOJI',
      detay: 'Geç Kalkolitik kerpiç saray kompleksi ve metalurji izleri.',
      koordinat: '38.3825° N, 38.3597° E',
      lat: 38.3825,
      lng: 38.3597,
      guven: 99,
      zaman: 'Arşiv Eşleşti'
    }
  ],
  'Şanlıurfa': [
    {
      id: 'URF-01',
      baslik: 'Göbeklitepe / Karahantepe Taş Tepeler',
      kategori: 'ARKEOLOJI',
      detay: 'T biçimli dikilitaşlar ve astronomik ekinoks hizalama vektörleri.',
      koordinat: '37.2231° N, 38.9224° E',
      lat: 37.2231,
      lng: 38.9224,
      guven: 99,
      zaman: 'Astro-Arkeo Senkron'
    }
  ],
  'Afyon': [
    {
      id: 'AFY-01',
      baslik: 'Frig Vadisi Kaya Anıtları',
      kategori: 'ARKEOLOJI',
      detay: 'Kaya fasadları, runik yazıtlar ve antik tekerlek izleri formasyonu.',
      koordinat: '39.0431° N, 30.5412° E',
      lat: 39.0431,
      lng: 30.5412,
      guven: 97,
      zaman: 'Frig Arşivi Aktif'
    }
  ]
};

export const SyWorldMonitorCore: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tamEkran, setTamEkran] = useState(false);
  const [havaDurumu, setHavaDurumu] = useState<'ACIK' | 'YAGMUR' | 'SIS' | 'KAR'>('ACIK');
  const [geceModu, setGeceModu] = useState(true);

  const [katmanlar, setKatmanlar] = useState<HaritaKatmani[]>(VARSAYILAN_KATMANLAR);
  const [katmanMenuAcik, setKatmanMenuAcik] = useState(true);
  const [seciliIl, setSeciliIl] = useState('Elazığ');
  const [zamanFiltresi, setZamanFiltresi] = useState<'1h' | '6h' | '24h' | 'Tümü'>('24h');

  const aktifOlaylar = TURKIYE_SAHA_VERILERI[seciliIl] || TURKIYE_SAHA_VERILERI['Elazığ'];
  const [seciliOlay, setSeciliOlay] = useState<BolgeOlayi>(aktifOlaylar[0]);

  // İl değiştikçe o ilin ilk olayını seç
  useEffect(() => {
    if (TURKIYE_SAHA_VERILERI[seciliIl]) {
      setSeciliOlay(TURKIYE_SAHA_VERILERI[seciliIl][0]);
    }
  }, [seciliIl]);

  // Gerçek Tam Ekran API Yönetimi
  const toggleTamEkran = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setTamEkran(true)).catch(() => setTamEkran(true));
    } else {
      document.exitFullscreen().then(() => setTamEkran(false)).catch(() => setTamEkran(false));
    }
  };

  useEffect(() => {
    const handleFsChange = () => setTamEkran(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const katmanDegistir = (id: string) => {
    setKatmanlar((prev) =>
      prev.map((k) => (k.id === id ? { ...k, aktif: !k.aktif } : k))
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: tamEkran ? 'fixed' : 'relative',
        top: tamEkran ? 0 : 'auto',
        left: tamEkran ? 0 : 'auto',
        width: tamEkran ? '100vw' : '100%',
        height: tamEkran ? '100vh' : '82vh',
        backgroundColor: geceModu ? '#020611' : '#0f172a',
        color: '#fff',
        borderRadius: tamEkran ? '0px' : '10px',
        overflow: 'hidden',
        border: tamEkran ? 'none' : '1px solid #1e293b',
        fontFamily: 'monospace',
        zIndex: tamEkran ? 99999 : 10
      }}
    >
      {/* ÜST KONTROL ŞERİDİ */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        zIndex: 30,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(7, 13, 26, 0.92)',
        backdropFilter: 'blur(10px)',
        padding: '8px 14px',
        borderRadius: '8px',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        gap: '8px'
      }}>
        {/* Başlık & Bölgesel Odak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem', fontWeight: '900', color: '#38bdf8', letterSpacing: '0.08em' }}>
            🇹🇷 TÜRKİYE TAKTİK GIS SAHA MONİTÖRÜ
          </span>
          <span style={{ fontSize: '0.68rem', backgroundColor: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
            MTA & OSINT AKTİF
          </span>
        </div>

        {/* Dinamik Atmosfer & Şehir Kontrolleri */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setGeceModu(!geceModu)}
            style={{ padding: '4px 8px', fontSize: '0.72rem', backgroundColor: '#0f172a', border: '1px solid #38bdf8', borderRadius: '4px', color: '#38bdf8', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {geceModu ? '🌙 Gece Modu' : '☀️ Gündüz Modu'}
          </button>

          <select
            value={havaDurumu}
            onChange={(e) => setHavaDurumu(e.target.value as any)}
            style={{ backgroundColor: '#020617', color: '#38bdf8', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', fontSize: '0.72rem', outline: 'none', cursor: 'pointer' }}
          >
            <option value="ACIK">☀️ Açık Hava</option>
            <option value="YAGMUR">🌧️ Yağış Katmanı</option>
            <option value="SIS">🌫️ Yoğun Sis Katmanı</option>
            <option value="KAR">❄️ Kar Katmanı</option>
          </select>

          {/* İl Seçici */}
          <select
            value={seciliIl}
            onChange={(e) => setSeciliIl(e.target.value)}
            style={{ backgroundColor: '#020617', color: '#f59e0b', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', fontSize: '0.72rem', outline: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <option value="Elazığ">Elazığ (Harput / Palu)</option>
            <option value="Malatya">Malatya (Arslantepe)</option>
            <option value="Şanlıurfa">Şanlıurfa (Göbeklitepe)</option>
            <option value="Afyon">Afyon (Frig Vadisi)</option>
          </select>

          {/* Zaman Filtresi */}
          <div style={{ display: 'flex', gap: '2px' }}>
            {(['1h', '6h', '24h', 'Tümü'] as const).map((z) => (
              <button
                key={z}
                onClick={() => setZamanFiltresi(z)}
                style={{ padding: '3px 6px', fontSize: '0.68rem', backgroundColor: zamanFiltresi === z ? '#0284c7' : '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '3px', cursor: 'pointer' }}
              >
                {z}
              </button>
            ))}
          </div>

          {/* Tam Ekran Butonu */}
          <button
            onClick={toggleTamEkran}
            style={{ padding: '4px 10px', fontSize: '0.75rem', backgroundColor: tamEkran ? '#dc2626' : '#0284c7', border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {tamEkran ? '🗗 Küçült' : '⛶ Tam Ekran'}
          </button>
        </div>
      </div>

      {/* SOL AÇILIR KATMAN MENÜSÜ */}
      <div style={{
        position: 'absolute',
        top: 66,
        left: 12,
        zIndex: 30,
        width: katmanMenuAcik ? '230px' : '38px',
        backgroundColor: 'rgba(5, 10, 20, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '8px',
        padding: '8px',
        transition: 'all 0.2s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: katmanMenuAcik ? '8px' : '0' }}>
          <button
            onClick={() => setKatmanMenuAcik(!katmanMenuAcik)}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
          >
            {katmanMenuAcik ? '☰ KATMANLARI GİZLE' : '☰'}
          </button>
        </div>

        {katmanMenuAcik && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {katmanlar.map((katman) => (
              <div
                key={katman.id}
                onClick={() => katmanDegistir(katman.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '5px 8px',
                  backgroundColor: katman.aktif ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${katman.aktif ? '#0284c7' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.7rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{katman.ikon}</span>
                  <span style={{ color: katman.aktif ? '#fff' : '#64748b' }}>{katman.ad}</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: katman.aktif ? '#38bdf8' : '#475569', fontWeight: 'bold' }}>
                  {katman.veriAdedi}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TÜRKİYE HARİTA MATRİSİ & DİNAMİK ATMOSFER */}
      <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Gece/Gündüz Litoloji Izgarası */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: geceModu
            ? 'radial-gradient(rgba(56, 189, 248, 0.15) 1px, transparent 1px)'
            : 'radial-gradient(rgba(2, 132, 199, 0.25) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        {/* Dinamik Atmosfer Efektleri */}
        {havaDurumu === 'SIS' && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(3px)', pointerEvents: 'none', zIndex: 15 }} />
        )}
        {havaDurumu === 'YAGMUR' && (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(56, 189, 248, 0.2) 1px, transparent 1px)', backgroundSize: '4px 20px', pointerEvents: 'none', zIndex: 15, opacity: 0.7 }} />
        )}
        {havaDurumu === 'KAR' && (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '16px 16px', pointerEvents: 'none', zIndex: 15, opacity: 0.8 }} />
        )}

        {/* Seçili İldeki Taktik Noktalar */}
        {aktifOlaylar.map((olay, idx) => (
          <div
            key={olay.id}
            onClick={() => setSeciliOlay(olay)}
            style={{
              position: 'absolute',
              top: `${44 + idx * 12}%`,
              left: `${46 + idx * 8}%`,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 20
            }}
          >
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: olay.kategori === 'ARKEOLOJI' ? '#0284c7' : olay.kategori === 'MTA_JEOLOJI' ? '#f59e0b' : '#22c55e',
              border: '2px solid #fff',
              boxShadow: '0 0 15px currentColor'
            }} />
            <span style={{ fontSize: '0.62rem', color: '#fff', backgroundColor: 'rgba(0,0,0,0.85)', padding: '1px 5px', borderRadius: '3px', marginTop: '3px', whiteSpace: 'nowrap' }}>
              {olay.baslik}
            </span>
          </div>
        ))}
      </div>

      {/* SAĞ ALTTAKİ İSTİHBARAT KARTI */}
      {seciliOlay && (
        <div style={{
          position: 'absolute',
          bottom: 14,
          right: 14,
          width: '320px',
          backgroundColor: 'rgba(6, 12, 24, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '8px',
          padding: '12px',
          zIndex: 30
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#38bdf8' }}>{seciliOlay.baslik}</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>KATEGORİ: {seciliOlay.kategori}</div>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '900', color: '#4ade80' }}>%{seciliOlay.guven}</div>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '8px', lineHeight: '1.4' }}>
            {seciliOlay.detay}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <span>📍 {seciliOlay.koordinat}</span>
            <span style={{ color: '#f59e0b' }}>{seciliOlay.zaman}</span>
          </div>
        </div>
      )}
    </div>
  );
};