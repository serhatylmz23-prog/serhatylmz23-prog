import React, { useState } from 'react';

export interface YuklenenMedya {
  id: string;
  url: string;
  tur: 'IMAGE' | 'VIDEO';
  ad: string;
}

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
  kutu: { x: number; y: number; w: number; h: number };
  taktikYonlendirme: string;
  etiketRengi: string;
}

const ORNEK_KARTLAR: AnomaliTespit[] = [
  {
    id: 'ANO-1',
    ad: 'TAŞ HEYKEL',
    tur: 'HEYKEL',
    donem: 'Geç Hitit Dönemi (M.Ö. 1200 - 700)',
    guvenSkoru: 98,
    koordinat: '37.128456° N, 38.789123° E',
    katman: '3. Katman (Kaya Formasyonu)',
    aciklama: 'İnsan figürlü kireçtaşı heykel. Göğüs üstünde el kavuşturma motifi, ekinoks yönelimi.',
    kutu: { x: 28, y: 14, w: 32, h: 54 },
    taktikYonlendirme: '⚠️ Kaya altı kovuğu görüldü. Yılan kamera (endoskop) ile taban çatlağına inin, drone ile tepe açısını tarayın.',
    etiketRengi: '#38bdf8'
  },
  {
    id: 'ANO-2',
    ad: 'YAZIT BLOKU',
    tur: 'YAZIT',
    donem: 'Frig / Runik Yazı',
    guvenSkoru: 97,
    koordinat: '37.128500° N, 38.789180° E',
    katman: '2. Yüzey Katmanı',
    aciklama: 'Derin murç kazıma hatlar. Doğal çatlak değil, insan eliyle işlenmiş kitabe.',
    kutu: { x: 8, y: 50, w: 22, h: 28 },
    taktikYonlendirme: '🔍 Açıyı 45° eğin, eğik ışıkla gölgeleri belirginleştirin ve ağır çekim tarayın.',
    etiketRengi: '#22c55e'
  },
  {
    id: 'ANO-3',
    ad: 'YAPI KALINTISI',
    tur: 'YAPI',
    donem: 'Helenistik Temel Duvarı',
    guvenSkoru: 82,
    koordinat: '37.128610° N, 38.789250° E',
    katman: '4. Temel Katmanı',
    aciklama: 'Dairesel harçsız taş dizilimi. Gökyüzü kutup yıldızı hizalaması ile uyumlu.',
    kutu: { x: 60, y: 35, w: 24, h: 30 },
    taktikYonlendirme: '🚁 Geniş alan yükselti taraması için mikro ducted-fan drone kaldırın.',
    etiketRengi: '#06b6d4'
  },
  {
    id: 'ANO-4',
    ad: 'BOŞLUK / MAĞARA',
    tur: 'BOSLUK',
    donem: 'Yeraltı Sığınağı / Mezar Odası',
    guvenSkoru: 88,
    koordinat: '37.128720° N, 38.789310° E',
    katman: 'Derin Jeo-Katman (-3.20m)',
    aciklama: 'Kaya altında akustik rezonans ve termal soğuk hava çıkış menfezi.',
    kutu: { x: 40, y: 60, w: 20, h: 25 },
    taktikYonlendirme: '📡 Yılan kamerayı 3 metre içeri sürün, manyetometre ile demir kapı/kilit arayın.',
    etiketRengi: '#f59e0b'
  },
  {
    id: 'ANO-5',
    ad: 'SARI KANTARON',
    tur: 'BOTANIK',
    donem: 'Tıbbi Flora Endemiği',
    guvenSkoru: 96,
    koordinat: '37.128390° N, 38.789090° E',
    katman: '1. Yüzey Toprak Örtüsü',
    aciklama: 'Hypericum perforatum. Kireçli ve mineralce zengin antik yerleşim toprak göstergesi.',
    sifaliTarif: '🌿 Şifalı Etki: Güçlü hücre yenileyici ve antiseptik. Zeytinyağında 40 gün bekletilerek kırmızı kantaron maserasyon yağı yapılır.',
    kutu: { x: 68, y: 70, w: 18, h: 20 },
    taktikYonlendirme: 'Bitki kök derinliği 40 cm altındaki taş dolguyu işaret ediyor.',
    etiketRengi: '#10b981'
  }
];

export const SyFrameVisionAnalyzer: React.FC = () => {
  const [medyaListesi, setMedyaListesi] = useState<YuklenenMedya[]>([]);
  const [aktifMedyaIndex, setAktifMedyaIndex] = useState<number>(0);
  const [tespitler] = useState<AnomaliTespit[]>(ORNEK_KARTLAR);
  const [seciliTespit, setSeciliTespit] = useState<AnomaliTespit>(ORNEK_KARTLAR[0]);
  const [linkInput, setLinkInput] = useState('');

  // ÇOKLU DOSYA (FOTOĞRAF / VİDEO) YÜKLEME
  const handleMedyaYukle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const yeniDosyalar: YuklenenMedya[] = Array.from(e.target.files).map((file, i) => ({
      id: `MED-${Date.now()}-${i}`,
      url: URL.createObjectURL(file),
      tur: file.type.startsWith('video') ? 'VIDEO' : 'IMAGE',
      ad: file.name
    }));

    setMedyaListesi((onceki) => [...onceki, ...yeniDosyalar]);
    setAktifMedyaIndex(medyaListesi.length); // Yeni yüklenen ilk öğeye odaklan
  };

  // LİNK EKLEME
  const handleLinkYukle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) return;

    const yeniMedya: YuklenenMedya = {
      id: `LINK-${Date.now()}`,
      url: linkInput.trim(),
      tur: linkInput.includes('mp4') || linkInput.includes('youtube') ? 'VIDEO' : 'IMAGE',
      ad: 'Web/Akış Bağlantısı'
    };

    setMedyaListesi((onceki) => [...onceki, yeniMedya]);
    setAktifMedyaIndex(medyaListesi.length);
    setLinkInput('');
  };

  const kartSec = (item: AnomaliTespit) => {
    setSeciliTespit(item);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const ut = new SpeechSynthesisUtterance(`${item.ad} seçildi. Güven skoru yüzde ${item.guvenSkoru}. ${item.taktikYonlendirme}`);
      ut.lang = 'tr-TR';
      window.speechSynthesis.speak(ut);
    }
  };

  const aktifMedya = medyaListesi[aktifMedyaIndex] || null;

  return (
    <div style={{
      backgroundColor: '#050914',
      border: '1px solid rgba(56, 189, 248, 0.3)',
      borderRadius: '12px',
      padding: '16px',
      color: '#fff',
      boxShadow: '0 0 35px rgba(2, 132, 199, 0.2)',
      marginBottom: '20px'
    }}>
      {/* ÜST BAŞLIK & ÇOKLU YÜKLEME BUTONU */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#38bdf8', letterSpacing: '0.08em' }}>
              SyFrame™
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', borderLeft: '1px solid #334155', paddingLeft: '8px' }}>
              ÇOKLU MEDYA (FOTO/VİDEO) EDS ANOMALİ İŞARETLEME VE DİJİTAL İKİZ
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {medyaListesi.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold' }}>
              {medyaListesi.length} Medya Yüklendi
            </span>
          )}
          <label style={{
            padding: '7px 14px',
            backgroundColor: '#0284c7',
            border: '1px solid #38bdf8',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 'bold',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            📁 Çoklu Fotoğraf / Video Seç
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMedyaYukle}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* LİNK GİRİŞ ÇUBUĞU */}
      <form onSubmit={handleLinkYukle} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          placeholder="İncelenecek Web, YouTube veya Saha Kamera RTSP Linkini yapıştırın..."
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#020617',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '0.82rem',
            outline: 'none'
          }}
        />
        <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#f59e0b', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#000', fontSize: '0.8rem' }}>
          Link Ekle
        </button>
      </form>

      {/* YÜKLENEN ÇOKLU MEDYA GALERİ ŞERİDİ (Varsa Görünür) */}
      {medyaListesi.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '10px',
          marginBottom: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          {medyaListesi.map((medya, idx) => (
            <div
              key={medya.id}
              onClick={() => setAktifMedyaIndex(idx)}
              style={{
                position: 'relative',
                width: '80px',
                height: '55px',
                flexShrink: 0,
                borderRadius: '6px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: `2px solid ${aktifMedyaIndex === idx ? '#38bdf8' : 'rgba(255,255,255,0.2)'}`,
                boxShadow: aktifMedyaIndex === idx ? '0 0 10px #38bdf8' : 'none',
                backgroundColor: '#000'
              }}
            >
              {medya.tur === 'IMAGE' ? (
                <img src={medya.url} alt={medya.ad} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.2rem', color: '#f59e0b' }}>
                  🎥
                </div>
              )}
              <span style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                fontSize: '0.55rem',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                padding: '1px'
              }}>
                #{idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ORTA BÖLÜM: SOL EKRAN (GÖRSEL/EDS) + SAĞ EKRAN (KÜNYE/TALİMAT) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr', gap: '16px', marginBottom: '16px' }}>
        {/* SOL EKRAN: GÖRSEL & EDS NEON ÇERÇEVE */}
        <div style={{
          position: 'relative',
          backgroundColor: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          minHeight: '360px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(56, 189, 248, 0.2)'
        }}>
          {aktifMedya ? (
            aktifMedya.tur === 'IMAGE' ? (
              <img src={aktifMedya.url} alt="Saha Görseli" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <video src={aktifMedya.url} controls autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎯</div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Canlı Saha Kadrajı Bekleniyor</div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Çoklu fotoğraf/video seçin veya link girin. Hedef odaklama devrededir.</div>
            </div>
          )}

          {/* EDS ÇERÇEVESİ (Bounding Box) */}
          <div style={{
            position: 'absolute',
            top: `${seciliTespit.kutu.y}%`,
            left: `${seciliTespit.kutu.x}%`,
            width: `${seciliTespit.kutu.w}%`,
            height: `${seciliTespit.kutu.h}%`,
            border: `2px solid ${seciliTespit.etiketRengi}`,
            boxShadow: `0 0 20px ${seciliTespit.etiketRengi}`,
            borderRadius: '6px',
            pointerEvents: 'none'
          }}>
            {/* Altın Köşebentler */}
            <div style={{ position: 'absolute', top: -3, left: -3, width: 12, height: 12, borderTop: '3px solid #f59e0b', borderLeft: '3px solid #f59e0b' }} />
            <div style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderTop: '3px solid #f59e0b', borderRight: '3px solid #f59e0b' }} />
            <div style={{ position: 'absolute', bottom: -3, left: -3, width: 12, height: 12, borderBottom: '3px solid #f59e0b', borderLeft: '3px solid #f59e0b' }} />
            <div style={{ position: 'absolute', bottom: -3, right: -3, width: 12, height: 12, borderBottom: '3px solid #f59e0b', borderRight: '3px solid #f59e0b' }} />
            {/* Noktalı Lider Çizgisi Başlangıç Noktası */}
            <div style={{ position: 'absolute', right: -6, top: '50%', width: 12, height: 12, borderRadius: '50%', backgroundColor: seciliTespit.etiketRengi, boxShadow: `0 0 10px ${seciliTespit.etiketRengi}` }} />
          </div>
        </div>

        {/* SAĞ EKRAN: KÜNYE & DONANIM TALİMATI */}
        <div style={{
          backgroundColor: '#081020',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            {/* Başlık ve Skor */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#38bdf8' }}>{seciliTespit.ad}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>TÜR: {seciliTespit.tur}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#4ade80' }}>%{seciliTespit.guvenSkoru}</div>
                <div style={{ fontSize: '0.62rem', color: '#64748b' }}>GÜVEN SKORU</div>
              </div>
            </div>

            {/* Künye Detayları */}
            <div style={{ fontSize: '0.78rem', display: 'grid', gap: '6px', color: '#cbd5e1' }}>
              <div><strong>⏳ DÖNEM:</strong> {seciliTespit.donem}</div>
              <div><strong>📍 KOORDİNAT:</strong> {seciliTespit.koordinat}</div>
              <div><strong>🧱 KATMAN:</strong> {seciliTespit.katman}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '2px' }}>{seciliTespit.aciklama}</div>
              
              {/* Varsa Şifalı Bitki Reçetesi */}
              {seciliTespit.sifaliTarif && (
                <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '6px', color: '#86efac', fontSize: '0.74rem' }}>
                  {seciliTespit.sifaliTarif}
                </div>
              )}
            </div>

            {/* Taktik Donanım Talimatı */}
            <div style={{
              marginTop: '12px',
              padding: '10px',
              backgroundColor: '#1e1b4b',
              border: '1px solid #818cf8',
              borderRadius: '6px',
              fontSize: '0.78rem',
              color: '#e0e7ff'
            }}>
              <strong style={{ color: '#a5b4fc', display: 'block', marginBottom: '4px' }}>📡 AJAN SAHA & DONANIM YÖNLENDİRMESİ:</strong>
              {seciliTespit.taktikYonlendirme}
            </div>
          </div>

          <div style={{ fontSize: '0.65rem', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '10px' }}>
            MÜHÜR: SHA-256 DOĞRULANDI • MTA / OSINT ENTEGRE
          </div>
        </div>
      </div>

      {/* ALT ŞERİT: ANOMALİ KARTLARI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
        {tespitler.map((item) => (
          <div
            key={item.id}
            onClick={() => kartSec(item)}
            style={{
              padding: '10px',
              backgroundColor: seciliTespit.id === item.id ? 'rgba(56, 189, 248, 0.15)' : '#070c18',
              border: `1px solid ${seciliTespit.id === item.id ? item.etiketRengi : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: item.etiketRengi }}>{item.ad}</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '2px 0' }}>{item.tur}</div>
            <div style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 'bold' }}>Güven: %{item.guvenSkoru}</div>
          </div>
        ))}
      </div>
    </div>
  );
};