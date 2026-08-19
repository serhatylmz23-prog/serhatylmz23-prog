import React, { useState, useRef } from 'react';

export interface AnomaliTespit {
  id: string;
  ad: string;
  tur: 'HEYKEL' | 'YAZIT' | 'YAPI' | 'SERAMIK' | 'BOSLUK' | 'BOTANIK' | 'MINERAL';
  donem: string;
  guvenSkoru: number;
  koordinat: string;
  katman: string;
  aciklama: string;
  sifaliTarif?: string;
  kutu: { x: number; y: number; w: number; h: number }; // Bounding Box oranları (%)
  taktikYonlendirme: string; // Drone, Yılan Kamera, Açı değiştir vb.
  yonlendirmeTuru: 'DRONE' | 'YILAN_KAMERA' | 'ACI_DEGISTIR' | 'AGIR_CEKIM' | 'STABIL';
}

export const SyFrameVisionAnalyzer: React.FC = () => {
  const [medyaUrl, setMedyaUrl] = useState<string | null>(null);
  const [medyaTuru, setMedyaTuru] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [tespitler, setTespitler] = useState<AnomaliTespit[]>([]);
  const [seciliTespit, setSeciliTespit] = useState<AnomaliTespit | null>(null);
  const [analizEdiliyor, setAnalizEdiliyor] = useState(false);
  const [linkInput, setLinkInput] = useState('');

  // Canlı / Yüklenen Medyayı İşleme
  const handleMedyaYukle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setMedyaTuru(file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');
    setMedyaUrl(URL.createObjectURL(file));
    sahteAnalizBaslat();
  };

  // Video / Görsel Linki İşleme
  const handleLinkYukle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput) return;
    setMedyaUrl(linkInput);
    setMedyaTuru(linkInput.includes('mp4') || linkInput.includes('youtube') ? 'VIDEO' : 'IMAGE');
    sahteAnalizBaslat();
  };

  const sahteAnalizBaslat = () => {
    setAnalizEdiliyor(true);
    setTimeout(() => {
      const ornekTespit: AnomaliTespit = {
        id: 'ANO-8841',
        ad: 'KANTARON VE TAŞ ANOMALİSİ',
        tur: 'BOTANIK',
        donem: 'Geç Roma / Bölgesel Bitki Örtüsü',
        guvenSkoru: 98,
        koordinat: '38.6748° N, 39.2225° E',
        katman: '1. Yüzey Katmanı & 3. Taş Katmanı',
        aciklama: 'Yüzeyde Hypericum perforatum (Sarı Kantaron) yoğunlaşması ve taşta 3 adet 2.34cm murç oyuğu.',
        sifaliTarif: 'Şifalı Özellik: Yara iyileştirici, antiseptik. Zeytinyağında 40 gün bekletilerek kırmızı kantaron yağı elde edilir.',
        kutu: { x: 28, y: 18, w: 38, h: 52 },
        taktikYonlendirme: '⚠️ DİKKAT: Kaya altı kovuğu görüldü. Yılan kamera (endoskop) ile iç boşluğa girin, drone ile tepe açısını tarayın.',
        yonlendirmeTuru: 'YILAN_KAMERA'
      };

      setTespitler([ornekTespit]);
      setSeciliTespit(ornekTespit);
      setAnalizEdiliyor(false);

      // JARVIS Sesli Taktik Komutu
      if ('speechSynthesis' in window) {
        const ut = new SpeechSynthesisUtterance(
          `Hedef işaretlendi. Güven skoru yüzde ${ornekTespit.guvenSkoru}. ${ornekTespit.taktikYonlendirme}`
        );
        ut.lang = 'tr-TR';
        window.speechSynthesis.speak(ut);
      }
    }, 1200);
  };

  return (
    <div style={{
      backgroundColor: '#030712',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      borderRadius: '12px',
      padding: '16px',
      color: '#fff',
      maxWidth: '1100px',
      margin: '0 auto'
    }}>
      {/* ÜST PANEL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#38bdf8', letterSpacing: '0.1em' }}>
            SyFrame™ DİJİTAL İKİZ VE EDS ANOMALİ İŞARETLEME
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            BOTANİK • DTSE YÜZEY MOTORU • ÇAPRAZ AKADEMİK OSINT AJANLARI
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <label style={{
            padding: '6px 12px',
            backgroundColor: '#0284c7',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            📁 Video/Foto Yükle
            <input type="file" accept="image/*,video/*" onChange={handleMedyaYukle} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* LİNK GİRİŞ ÇUBUĞU */}
      <form onSubmit={handleLinkYukle} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <input
          type="text"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          placeholder="Web / YouTube / Canlı Yayın RTSP bağlantısı yapıştırın..."
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#081120',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '0.8rem'
          }}
        />
        <button type="submit" style={{ padding: '8px 14px', backgroundColor: '#f59e0b', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#000' }}>
          Taramayı Başlat
        </button>
      </form>

      {/* ANA GÖRÜNTÜ ALANI VE EDS ÇERÇEVELEME */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '16px' }}>
        {/* SOL: GÖRSEL & ÇERÇEVE */}
        <div style={{
          position: 'relative',
          backgroundColor: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          minHeight: '380px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {medyaUrl ? (
            medyaTuru === 'IMAGE' ? (
              <img src={medyaUrl} alt="Tarama" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <video src={medyaUrl} controls autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              Analiz edilecek fotoğraf, video veya kamera akışı bekleniyor...
            </div>
          )}

          {/* EDS Neon Çerçeve (Bounding Box) */}
          {seciliTespit && (
            <div style={{
              position: 'absolute',
              top: `${seciliTespit.kutu.y}%`,
              left: `${seciliTespit.kutu.x}%`,
              width: `${seciliTespit.kutu.w}%`,
              height: `${seciliTespit.kutu.h}%`,
              border: '2px solid #38bdf8',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.8)',
              borderRadius: '6px',
              pointerEvents: 'none'
            }}>
              {/* Köşe Vurguları */}
              <div style={{ position: 'absolute', top: -4, left: -4, width: 12, height: 12, borderTop: '3px solid #f59e0b', borderLeft: '3px solid #f59e0b' }} />
              <div style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderTop: '3px solid #f59e0b', borderRight: '3px solid #f59e0b' }} />
              <div style={{ position: 'absolute', bottom: -4, left: -4, width: 12, height: 12, borderBottom: '3px solid #f59e0b', borderLeft: '3px solid #f59e0b' }} />
              <div style={{ position: 'absolute', bottom: -4, right: -4, width: 12, height: 12, borderBottom: '3px solid #f59e0b', borderRight: '3px solid #f59e0b' }} />
              
              {/* Noktalı Lider Çizgisi Bağlantı Noktası */}
              <div style={{
                position: 'absolute',
                right: -6,
                top: '50%',
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 8px #38bdf8'
              }} />
            </div>
          )}
        </div>

        {/* SAĞ: DETAY KÜNYESİ VE TAKTİK YÖNLENDİRME (Görsel 3 Modeli) */}
        <div style={{
          backgroundColor: '#081120',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          {seciliTespit ? (
            <div>
              {/* Başlık & Güven */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#38bdf8' }}>{seciliTespit.ad}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>TÜR: {seciliTespit.tur}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#4ade80' }}>%{seciliTespit.guvenSkoru}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>GÜVEN SKORU</div>
                </div>
              </div>

              {/* Bilgi Grid */}
              <div style={{ fontSize: '0.78rem', display: 'grid', gridTemplateColumns: '1fr', gap: '6px', color: '#cbd5e1' }}>
                <div><strong>⏳ DÖNEM:</strong> {seciliTespit.donem}</div>
                <div><strong>📍 KOORDİNAT:</strong> {seciliTespit.koordinat}</div>
                <div><strong>🧱 KATMAN:</strong> {seciliTespit.katman}</div>
                <div style={{ marginTop: '4px', color: '#94a3b8' }}>{seciliTespit.aciklama}</div>
                {seciliTespit.sifaliTarif && (
                  <div style={{ marginTop: '6px', padding: '6px', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '4px', color: '#86efac' }}>
                    🌿 {seciliTespit.sifaliTarif}
                  </div>
                )}
              </div>

              {/* TAKTİK SAHA YÖNLENDİRMESİ */}
              <div style={{
                marginTop: '12px',
                padding: '10px',
                backgroundColor: '#1e1b4b',
                border: '1px solid #818cf8',
                borderRadius: '6px',
                fontSize: '0.78rem',
                color: '#c7d2fe'
              }}>
                <div style={{ fontWeight: 'bold', color: '#a5b4fc', marginBottom: '4px' }}>
                  📡 AJAN SAHA VE DONANIM TALİMATI:
                </div>
                {seciliTespit.taktikYonlendirme}
              </div>
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', margin: 'auto' }}>
              {analizEdiliyor ? 'Kâşif Çoklu Ajanları analiz ediyor...' : 'İşaretli bir anomali seçilmedi.'}
            </div>
          )}

          <div style={{ fontSize: '0.65rem', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', marginTop: '10px' }}>
            MÜHÜR: SHA-256 DOĞRULANDI • MTA / OSINT ENTEGRE
          </div>
        </div>
      </div>
    </div>
  );
};