import React, { useState, useEffect, useRef } from 'react';
import { runAgents } from '../agents/agentOrchestrator';
import type { AgentId, AgentFinding } from '../agents/agentTypes';

interface HaritaKatmani {
  id: string;
  ad: string;
  ikon: string;
  aktif: boolean;
  // null = henüz taranmadı. Uydurma bir sayı YOKTUR; yalnızca gerçek bir
  // ilTara() çağrısından sonra o katmana ait gerçek bulgu adedi yazılır.
  veriAdedi: number | null;
  // Şu an GERÇEKTEN çalışan bir ajan tarafından besleniyor mu?
  destekleniyor: boolean;
  agentId?: AgentId;
}

interface BolgeOlayi {
  id: string;
  baslik: string;
  kategori: AgentId;
  detay: string;
  koordinat: string;
  guven: number; // GERÇEK: ilgili AgentFinding.confidence * 100
  zaman: string;
  lat: number;
  lng: number;
  kaynaklar: { title: string; url?: string; provider: string }[];
}

// Yalnızca gerçekten çalışan 5 ajanla eşleşen 5 katman "destekleniyor: true"
// olarak işaretli. Radar/Botanik/Termal katmanları için karşılık gelen bir
// ajan henüz yazılmadı — bu yüzden dürüstçe "Yakında" olarak işaretlendi,
// fiktif bir veri adedi verilmedi.
const VARSAYILAN_KATMANLAR: HaritaKatmani[] = [
  { id: 'kat_jeoloji', ad: 'Jeoloji (Macrostrat açık veri)', ikon: '🪨', aktif: true, veriAdedi: null, destekleniyor: true, agentId: 'jeoloji' },
  { id: 'kat_arkeo', ad: 'Arkeoloji (OpenStreetMap/Overpass)', ikon: '🏛️', aktif: true, veriAdedi: null, destekleniyor: true, agentId: 'arkeoloji' },
  { id: 'kat_sismo', ad: 'Sismoloji (USGS, son 30 gün)', ikon: '⚡', aktif: true, veriAdedi: null, destekleniyor: true, agentId: 'sismoloji' },
  { id: 'kat_meteo', ad: 'Meteoroloji (Open-Meteo)', ikon: '🌦️', aktif: true, veriAdedi: null, destekleniyor: true, agentId: 'meteoroloji' },
  { id: 'kat_uydu', ad: 'Uydu Katman Kaynağı (Esri)', ikon: '🛰️', aktif: true, veriAdedi: null, destekleniyor: true, agentId: 'uydu' },
  { id: 'kat_radar', ad: 'Drone / ADS-B Canlı Radar', ikon: '🛸', aktif: false, veriAdedi: null, destekleniyor: false },
  { id: 'kat_botanik', ad: 'Anadolu Florası & Toprak Mineralleri', ikon: '🌿', aktif: false, veriAdedi: null, destekleniyor: false },
  { id: 'kat_termal', ad: 'Termal / Karstik Boşluk Anomalisi', ikon: '📡', aktif: false, veriAdedi: null, destekleniyor: false },
];

// Haritadaki 4 örnek il için gerçek koordinatlar. Bu koordinatlar
// agentOrchestrator.runAgents()'a GERÇEKTEN gönderilir; aşağıdaki liste
// artık "gösterim" değil, "girdi" olarak kullanılıyor.
const IL_KOORDINATLARI: Record<string, { lat: number; lng: number }> = {
  'Elazığ': { lat: 38.6748, lng: 39.2225 },
  'Malatya': { lat: 38.3552, lng: 38.3095 },
  'Şanlıurfa': { lat: 37.2231, lng: 38.9224 },
  'Afyon': { lat: 38.7638, lng: 30.5406 },
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

  // Artık statik bir "TURKIYE_SAHA_VERILERI" tablosu yok. Olaylar yalnızca
  // gerçek bir tarama sonrası doldurulur.
  const [olaylar, setOlaylar] = useState<BolgeOlayi[]>([]);
  const [seciliOlay, setSeciliOlay] = useState<BolgeOlayi | null>(null);
  const [taraniyor, setTaraniyor] = useState(false);
  const [taramaHatasi, setTaramaHatasi] = useState<string | null>(null);
  const [sonTaramaIl, setSonTaramaIl] = useState<string | null>(null);

  // Gerçek tarama: seçili ilin koordinatları için agentOrchestrator.runAgents()
  // çağrılır. Hiçbir başlık/güven değeri elle yazılmaz; hepsi API yanıtından
  // gelir. Bir agent'ın karşılığı olmayan katmanlar (radar/botanik/termal)
  // bu taramaya hiç dahil edilmez.
  const ilTara = async () => {
    const hedef = IL_KOORDINATLARI[seciliIl];
    if (!hedef) return;
    setTaraniyor(true);
    setTaramaHatasi(null);
    try {
      const { results } = await runAgents({
        latitude: hedef.lat,
        longitude: hedef.lng,
        radiusKm: 30,
      });

      const yeniOlaylar: BolgeOlayi[] = [];
      results.forEach((sonuc) => {
        sonuc.findings.forEach((bulgu: AgentFinding) => {
          const konum = bulgu.coordinates ?? hedef;
          yeniOlaylar.push({
            id: bulgu.id,
            baslik: bulgu.title,
            kategori: bulgu.agentId,
            detay: bulgu.description,
            koordinat: `${konum.lat.toFixed(4)}° N, ${konum.lng.toFixed(4)}° E`,
            guven: Math.round(bulgu.confidence * 1000) / 10,
            zaman: 'Az önce tarandı',
            lat: konum.lat,
            lng: konum.lng,
            kaynaklar: bulgu.sources.map((s) => ({ title: s.title, url: s.url, provider: s.provider })),
          });
        });
      });

      setOlaylar(yeniOlaylar);
      setSeciliOlay(yeniOlaylar[0] ?? null);
      setSonTaramaIl(seciliIl);

      // Katman kutucuklarındaki sayılar artık gerçek bulgu adedini gösteriyor.
      setKatmanlar((prev) =>
        prev.map((k) => {
          if (!k.destekleniyor || !k.agentId) return k;
          const sonuc = results.find((r) => r.agentId === k.agentId);
          return { ...k, veriAdedi: sonuc ? sonuc.findings.length : 0 };
        })
      );

      const hataliAjan = results.filter((r) => r.status === 'hata');
      if (hataliAjan.length > 0) {
        setTaramaHatasi(
          `${hataliAjan.length} ajan yanıt veremedi: ${hataliAjan.map((r) => r.agentId).join(', ')}.`
        );
      }
    } catch (err) {
      setTaramaHatasi(err instanceof Error ? err.message : 'Bilinmeyen ağ hatası.');
    } finally {
      setTaraniyor(false);
    }
  };

  // İl değiştiğinde önceki ile ait bulgular otomatik temizlenir — aksi halde
  // Malatya için taranan sonuçlar Afyon seçiliyken hâlâ görünür kalır ve bu
  // yanıltıcı olur.
  useEffect(() => {
    setOlaylar([]);
    setSeciliOlay(null);
    setTaramaHatasi(null);
    if (sonTaramaIl && sonTaramaIl !== seciliIl) {
      setKatmanlar((prev) => prev.map((k) => (k.destekleniyor ? { ...k, veriAdedi: null } : k)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seciliIl]);
  const toggleTamEkran = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setTamEkran(true)).catch(() => setTamEkran(false));
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
          <span
            style={{
              fontSize: '0.68rem',
              backgroundColor: sonTaramaIl === seciliIl ? '#0284c7' : '#334155',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            {sonTaramaIl === seciliIl ? 'GERÇEK VERİ • TARANDI' : 'HENÜZ TARANMADI'}
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

          {/* Gerçek Tarama Butonu */}
          <button
            onClick={ilTara}
            disabled={taraniyor}
            style={{ padding: '4px 10px', fontSize: '0.72rem', backgroundColor: taraniyor ? '#334155' : '#16a34a', border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 'bold', cursor: taraniyor ? 'not-allowed' : 'pointer' }}
          >
            {taraniyor ? 'Taranıyor…' : `🔎 ${seciliIl} İçin Gerçek Tarama`}
          </button>

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
        width: katmanMenuAcik ? '250px' : '40px',
        backgroundColor: 'rgba(5, 10, 20, 0.94)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '10px',
        padding: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        transition: 'width 0.2s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: katmanMenuAcik ? '10px' : '0', paddingBottom: katmanMenuAcik ? '8px' : '0', borderBottom: katmanMenuAcik ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
          <button
            onClick={() => setKatmanMenuAcik(!katmanMenuAcik)}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', padding: 0 }}
          >
            {katmanMenuAcik ? '☰  KATMANLAR' : '☰'}
          </button>
          {katmanMenuAcik && (
            <span style={{ fontSize: '0.6rem', color: '#64748b' }}>
              {katmanlar.filter((k) => k.destekleniyor).length}/{katmanlar.length} aktif
            </span>
          )}
        </div>

        {katmanMenuAcik && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {katmanlar.map((katman) => (
              <div
                key={katman.id}
                onClick={() => katman.destekleniyor && katmanDegistir(katman.id)}
                title={katman.ad}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  backgroundColor: katman.aktif ? 'rgba(2, 132, 199, 0.18)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${katman.aktif ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '6px',
                  cursor: katman.destekleniyor ? 'pointer' : 'not-allowed',
                  opacity: katman.destekleniyor ? 1 : 0.5,
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{katman.ikon}</span>
                  <span
                    style={{
                      color: katman.aktif ? '#f1f5f9' : '#64748b',
                      fontSize: '0.68rem',
                      fontWeight: katman.aktif ? 600 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {katman.ad}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.62rem',
                    color: katman.aktif ? '#38bdf8' : '#475569',
                    fontWeight: 700,
                    flexShrink: 0,
                    backgroundColor: katman.aktif ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    padding: katman.aktif ? '1px 6px' : 0,
                    borderRadius: '10px',
                  }}
                >
                  {!katman.destekleniyor ? 'Yakında' : katman.veriAdedi === null ? '—' : katman.veriAdedi}
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

        {/* Boş durum: henüz taranmadı */}
        {olaylar.length === 0 && !taraniyor && (
          <div style={{ zIndex: 20, textAlign: 'center', color: '#64748b', fontSize: '0.8rem', maxWidth: '260px' }}>
            📡 {seciliIl} için henüz gerçek bir tarama yapılmadı.<br />
            Üstteki <strong>"Gerçek Tarama"</strong> düğmesine basarak Macrostrat, OSM, USGS ve
            Open-Meteo'dan canlı veri çekebilirsin.
          </div>
        )}
        {taraniyor && (
          <div style={{ zIndex: 20, color: '#38bdf8', fontSize: '0.85rem', fontWeight: 'bold' }}>
            🔎 Açık veri kaynakları taranıyor…
          </div>
        )}
        {taramaHatasi && (
          <div style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 30, maxWidth: '280px', padding: '8px 10px', backgroundColor: '#450a0a', border: '1px solid #ef4444', borderRadius: '6px', color: '#fca5a5', fontSize: '0.68rem' }}>
            ⚠️ {taramaHatasi}
          </div>
        )}

        {/* Seçili İldeki GERÇEK Bulgular */}
        {olaylar.map((olay, idx) => (
          <div
            key={olay.id}
            onClick={() => setSeciliOlay(olay)}
            style={{
              position: 'absolute',
              top: `${30 + (idx % 5) * 12}%`,
              left: `${34 + Math.floor(idx / 5) * 14 + (idx % 3) * 6}%`,
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
              backgroundColor: olay.kategori === 'arkeoloji' ? '#0284c7' : olay.kategori === 'jeoloji' ? '#f59e0b' : olay.kategori === 'sismoloji' ? '#ef4444' : olay.kategori === 'meteoroloji' ? '#22d3ee' : '#22c55e',
              border: '2px solid #fff',
              boxShadow: '0 0 15px currentColor'
            }} />
            <span style={{ fontSize: '0.62rem', color: '#fff', backgroundColor: 'rgba(0,0,0,0.85)', padding: '1px 5px', borderRadius: '3px', marginTop: '3px', whiteSpace: 'nowrap', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>AJAN: {seciliOlay.kategori.toUpperCase()}</div>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '900', color: '#4ade80' }}>%{seciliOlay.guven}</div>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '8px', lineHeight: '1.4' }}>
            {seciliOlay.detay}
          </div>

          {seciliOlay.kaynaklar.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: '3px' }}>KAYNAKLAR:</div>
              {seciliOlay.kaynaklar.map((k, i) => (
                <div key={i} style={{ fontSize: '0.65rem', color: '#7dd3fc' }}>
                  {k.url ? (
                    <a href={k.url} target="_blank" rel="noreferrer" style={{ color: '#7dd3fc' }}>
                      {k.title} ({k.provider})
                    </a>
                  ) : (
                    `${k.title} (${k.provider})`
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <span>📍 {seciliOlay.koordinat}</span>
            <span style={{ color: '#f59e0b' }}>{seciliOlay.zaman}</span>
          </div>
        </div>
      )}
    </div>
  );
};