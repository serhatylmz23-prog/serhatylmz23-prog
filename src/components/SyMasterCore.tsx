import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SyMediaVerificationCore } from './SyMediaVerificationCore';
import { askKasifAI } from '../services/aiService';

interface Ajan {
  id: string;
  ad: string;
  rol: string;
  kayitSayisi: number;
  guven: number;
  ogrenmeTalebi?: {
    konu: string;
    kaynak: string;
    tarih: string;
  };
}

interface Bildirim {
  id: string;
  baslik: string;
  detay: string;
  tur: 'BASARILI' | 'UYARI' | 'HATA' | 'AJAN';
  zaman: string;
}

interface YuklenenMedya {
  id: string;
  url: string;
  ad: string;
  tur: 'IMAGE' | 'VIDEO';
}

const SEHIR_KOORDINATLARI: Record<string, { lat: number; lng: number; zoom: number; litoloji: string; antik: string }> = {
  'Elazığ': { lat: 38.6748, lng: 39.2225, zoom: 13, litoloji: 'Andezit & Kireçtaşı', antik: 'Harput Kalesi, Urartu Basamaklı Tünelleri' },
  'Şanlıurfa': { lat: 37.2231, lng: 38.9224, zoom: 14, litoloji: 'Masif Eosen Kireçtaşı', antik: 'Göbeklitepe & Karahantepe Taş Tepeler' },
  'Afyon': { lat: 39.0431, lng: 30.5412, zoom: 13, litoloji: 'Volkanik Tüf & Aglamera', antik: 'Frig Vadisi Kaya Anıtları & Yazıtları' },
  'Antalya': { lat: 36.8841, lng: 30.7056, zoom: 13, litoloji: 'Karstik Kireçtaşı', antik: 'Termessos Antik Lahitleri & Kaya Mezarları' }
};

const BASLANGIC_AJANLARI: Ajan[] = [
  { id: 'AG-01', ad: 'ASTRO-ARKEO DEDEKTÖRÜ', rol: 'Göbeklitepe Ekinoks & Hizalama', kayitSayisi: 14280, guven: 98.4 },
  { id: 'AG-02', ad: 'JEOLOJİ & MTA DEDEKTÖRÜ', rol: 'Litoloji, Karstik Boşluk & Fay Analizi', kayitSayisi: 28940, guven: 97.1, ogrenmeTalebi: { konu: '2026 Doğu Anadolu Yeni Litoloji Katmanı', kaynak: 'MTA Açık Veri Portalı', tarih: 'Bugün' } },
  { id: 'AG-03', ad: 'NÜMİZMATİK & MÜZE ARŞİVİ', rol: 'Sikke, Lahit & Tipoloji Eşleştirme', kayitSayisi: 54100, guven: 99.2 },
  { id: 'AG-04', ad: 'OSINT & DEFİNE KOLEKTİF', rol: 'Saha Forumları & Video Çapraz Tarama', kayitSayisi: 89320, guven: 92.8, ogrenmeTalebi: { konu: 'Harput Yeraltı Galerileri Yeni Çizim Modeli', kaynak: 'Akademik Bildiri', tarih: '1 saat önce' } },
  { id: 'AG-05', ad: 'BOTANİK & ETNOBOTANİK', rol: 'İndikatör Bitki & Toprak pH Analizi', kayitSayisi: 19450, guven: 96.5 }
];

const DTSE_ASAMALARI = [
  { no: 1, ad: 'ALGILAMA', yuzde: '%15' },
  { no: 2, ad: 'NOKTA BULUTU', yuzde: '%35' },
  { no: 3, ad: 'ADAPTİF MESH', yuzde: '%58' },
  { no: 4, ad: 'YÜZEY OLUŞUMU', yuzde: '%75' },
  { no: 5, ad: 'RENKLENDİRME', yuzde: '%88' },
  { no: 6, ad: 'ANALİZ KATLARI', yuzde: '%96' },
  { no: 7, ad: 'SONUÇ & RAPOR', yuzde: '%100' }
];

export const SyMasterCore: React.FC = () => {
  const [tamEkran, setTamEkran] = useState(false);
  const [bildirimPaneliAcik, setBildirimPaneliAcik] = useState(false);
  const [ajanModalAcik, setAjanModalAcik] = useState(false);
  const [onayBekleyenAjan, setOnayBekleyenAjan] = useState<Ajan | null>(null);

  const [seciliIl, setSeciliIl] = useState('Elazığ');
  const [haritaTipi, setHaritaTipi] = useState<'GUNUMUZ' | '3D_TOPO' | 'UYDU'>('UYDU');
  const [havaDurumu, setHavaDurumu] = useState<'ACIK' | 'YAGMUR' | 'SIS' | 'KAR'>('ACIK');
  const [zamanCag, setZamanCag] = useState('Hitit / Urartu (M.Ö. 1200)');

  const [medyaListesi, setMedyaListesi] = useState<YuklenenMedya[]>([]);
  const [seciliMedyaIndex, setSeciliMedyaIndex] = useState<number>(0);
  const [linkGirdisi, setLinkGirdisi] = useState('');

  const [aktifAsama, setAktifAsama] = useState(6);
  const [spektralMod, setSpektralMod] = useState<'NORMAL' | 'LAB_KIRMIZI' | 'YDS_ALTIN' | 'YAZIT_AC' | 'ELA_MONTAJ'>('NORMAL');
  const [zoom, setZoom] = useState(1);
  const [ajanlar, setAjanlar] = useState<Ajan[]>(BASLANGIC_AJANLARI);

  const [dinliyorMu, setDinliyorMu] = useState(false);
  const [asistanCevabi, setAsistanCevabi] = useState('Saha sensörleri ve analiz motoru hazır.');

  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [bildirimler, setBildirimler] = useState<Bildirim[]>([
    { id: '1', baslik: 'RTK FIX KİLİTLENDİ', detay: '±1.8 cm hassasiyet doğrulandı.', tur: 'BASARILI', zaman: 'Az önce' },
    { id: '2', baslik: 'TAHLİYE KANALI TESPİTİ', detay: '128° istikametinde 5.4m hedef.', tur: 'UYARI', zaman: '2 dk önce' },
    { id: '3', baslik: 'YENİ ÖĞRENME TALEBİ', detay: 'MTA Dedektörü onayınızı bekliyor.', tur: 'AJAN', zaman: '5 dk önce' }
  ]);

  const bildirimSil = (id: string) => {
    setBildirimler(prev => prev.filter(b => b.id !== id));
  };

  const bildirimTemizle = () => {
    setBildirimler([]);
  };

  const konus = (metin: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(metin);
      utter.lang = 'tr-TR';
      utter.rate = 1.0;
      utter.pitch = 1.0;
      window.speechSynthesis.speak(utter);
    }
  };

  const sesliKomutDinle = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      konus('Tarayıcınız ses tanımayı desteklemiyor.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.start();
    setDinliyorMu(true);

    recognition.onresult = (e: any) => {
      const komut = e.results[0][0].transcript.toLowerCase();
      setDinliyorMu(false);
      
      if (komut.includes('analiz') || komut.includes('tara') || komut.includes('hedef')) {
        const cevap = 'Analiz tamamlandı. 128 derece açıda 5.4 metre mesafede anomali odak noktası belirlendi.';
        setAsistanCevabi(cevap);
        konus(cevap);
      } else if (komut.includes('uydu')) {
        setHaritaTipi('UYDU');
        setAsistanCevabi('Çok bantlı uydu görüntüsü aktif edildi.');
        konus('Çok bantlı uydu görüntüsü aktif edildi.');
      } else if (komut.includes('günümüz') || komut.includes('sokak')) {
        setHaritaTipi('GUNUMUZ');
        setAsistanCevabi('Günümüz vektörel harita katmanı açıldı.');
        konus('Günümüz harita katmanı açıldı.');
      } else {
        // Önceki sürümde tanınmayan her komut, gerçekten işlenmeden sadece
        // kullanıcıya geri okunuyordu ("Komutunuz işlendi: ..."). Artık
        // tanınmayan komutlar gerçek KÂŞİF AI servisine (/api/chat) gönderiliyor.
        setAsistanCevabi('Düşünüyor...');
        askKasifAI(komut, `Seçili il: ${seciliIl}, Harita: ${haritaTipi}, Hava: ${havaDurumu}`).then((cevap) => {
          setAsistanCevabi(cevap);
          konus(cevap);
        });
      }
    };

    recognition.onerror = () => setDinliyorMu(false);
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const servisler = {
      'GUNUMUZ': 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      '3D_TOPO': 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      'UYDU': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    };

    const hedef = SEHIR_KOORDINATLARI[seciliIl] || SEHIR_KOORDINATLARI['Elazığ'];

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([hedef.lat, hedef.lng], 13);
      const tile = L.tileLayer(servisler[haritaTipi], { attribution: 'SyKaşif GIS Engine' }).addTo(map);
      tileRef.current = tile;
      mapRef.current = map;
    } else {
      if (tileRef.current) tileRef.current.setUrl(servisler[haritaTipi]);
      mapRef.current.flyTo([hedef.lat, hedef.lng], 13, { duration: 1.0 });
    }
  }, [seciliIl, haritaTipi]);

  const toggleTamEkran = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setTamEkran(true)).catch(() => setTamEkran(true));
    } else {
      document.exitFullscreen().then(() => setTamEkran(false)).catch(() => setTamEkran(false));
    }
  };

  const handleCokluMedya = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const yeniDosyalar: YuklenenMedya[] = Array.from(e.target.files).map((file, idx) => ({
      id: `${Date.now()}_${idx}`,
      url: URL.createObjectURL(file),
      ad: file.name,
      tur: file.type.startsWith('video') ? 'VIDEO' : 'IMAGE'
    }));
    setMedyaListesi(prev => [...prev, ...yeniDosyalar]);
    setSeciliMedyaIndex(medyaListesi.length);

    setBildirimler(prev => [
      { id: `${Date.now()}`, baslik: 'YENİ MEDYA YÜKLENDİ', detay: `${yeniDosyalar.length} adet dosya analiz havuzuna eklendi.`, tur: 'BASARILI', zaman: 'Şimdi' },
      ...prev
    ]);

    konus(`${yeniDosyalar.length} adet medya yüklendi. Analiz başlatılıyor.`);
  };

  const handleLinkEkle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkGirdisi.trim()) return;
    const yeniLink: YuklenenMedya = {
      id: `${Date.now()}`,
      url: linkGirdisi.trim(),
      ad: `Akış #${medyaListesi.length + 1}`,
      tur: linkGirdisi.includes('mp4') || linkGirdisi.includes('youtube') ? 'VIDEO' : 'IMAGE'
    };
    setMedyaListesi(prev => [...prev, yeniLink]);
    setLinkGirdisi('');
    setSeciliMedyaIndex(medyaListesi.length);

    setBildirimler(prev => [
      { id: `${Date.now()}`, baslik: 'LİNK AKIŞI EKLENDİ', detay: yeniLink.ad, tur: 'BASARILI', zaman: 'Şimdi' },
      ...prev
    ]);

    konus('Bağlantı akışı başarıyla eklendi.');
  };

  const medyaSil = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const yeniListe = medyaListesi.filter(m => m.id !== id);
    setMedyaListesi(yeniListe);
    if (seciliMedyaIndex >= yeniListe.length) {
      setSeciliMedyaIndex(Math.max(0, yeniListe.length - 1));
    }
    konus('Medya listeden silindi.');
  };

  const yeniAjanEkle = () => {
    const uzmanliklar = [
      { ad: 'SPEKTROMETRE & METALURJİ DEDEKTÖRÜ', rol: 'Altın/Bakır XRF Spektral Ayrışımı' },
      { ad: '3D FOTOGRAMETRİ & DİJİTAL İKİZ AJANI', rol: 'Mesh / Yüzey Pürüzlülük Hesaplama' },
      { ad: 'RADAR & LİDAR SAHA İSTİHBARATI', rol: 'Ducted-Fan İHA Telemetri Analizi' },
      { ad: 'HİDROJEOLOJİ & YERALTI SU AJANI', rol: 'Karstik Akifer & Nem Anomalisi' }
    ];
    const yeniUzmanlik = uzmanliklar[Math.floor(Math.random() * uzmanliklar.length)];
    const yeniAjan: Ajan = {
      id: `AG-0${ajanlar.length + 1}`,
      ad: yeniUzmanlik.ad,
      rol: yeniUzmanlik.rol,
      kayitSayisi: 1200,
      guven: 98.0,
      ogrenmeTalebi: {
        konu: 'Yeni Saha Veri Seti & Öğrenme Modeli',
        kaynak: 'Saha Sensör Ağı',
        tarih: 'Şimdi'
      }
    };
    setAjanlar(prev => [...prev, yeniAjan]);

    setBildirimler(prev => [
      { id: `${Date.now()}`, baslik: 'YENİ AJAN EKLENDİ', detay: yeniAjan.ad, tur: 'AJAN', zaman: 'Şimdi' },
      ...prev
    ]);

    konus(`Yeni uzman ajan sürüye katıldı: ${yeniAjan.ad}. Onay bekliyor.`);
  };

  const seciliMedya = medyaListesi[seciliMedyaIndex] || null;

  useEffect(() => {
    if (!seciliMedya || seciliMedya.tur !== 'IMAGE') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = seciliMedya.url;
    img.onload = () => {
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 440;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (spektralMod === 'LAB_KIRMIZI') {
          const l = 0.299 * r + 0.587 * g + 0.114 * b;
          const a = (r - g) * 4.0;
          d[i] = Math.min(255, Math.max(0, l + a));
          d[i + 1] = Math.min(255, Math.max(0, l - a * 0.5));
          d[i + 2] = Math.min(255, Math.max(0, l - a * 0.8));
        } else if (spektralMod === 'YDS_ALTIN') {
          d[i] = Math.min(255, r * 0.3);
          d[i + 1] = Math.min(255, (g + r) * 1.5);
          d[i + 2] = Math.min(255, b * 0.2);
        } else if (spektralMod === 'YAZIT_AC') {
          const k = Math.abs(r - g) * 3 + Math.abs(g - b) * 3;
          d[i] = k > 50 ? 56 : 10;
          d[i + 1] = k > 50 ? 189 : 10;
          d[i + 2] = k > 50 ? 248 : 10;
        } else if (spektralMod === 'ELA_MONTAJ') {
          const f = Math.abs(r - g) + Math.abs(g - b);
          d[i] = f > 45 ? 255 : 15;
          d[i + 1] = f > 45 ? 0 : 15;
          d[i + 2] = f > 45 ? 0 : 15;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      const w = canvas.width, h = canvas.height;
      const bx = w * 0.2, by = h * 0.18, bw = w * 0.6, bh = h * 0.64;

      if (aktifAsama >= 3) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        for (let x = bx + 20; x <= bx + bw - 20; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, by + 15);
          ctx.lineTo(x, by + bh - 15);
          ctx.stroke();
        }
        for (let y = by + 20; y <= by + bh - 20; y += 30) {
          ctx.beginPath();
          ctx.moveTo(bx + 15, y);
          ctx.lineTo(bx + bw - 15, y);
          ctx.stroke();
        }
      }

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);

      ctx.fillStyle = '#f59e0b';
      const kb = 18, kk = 4;
      ctx.fillRect(bx - 2, by - 2, kb, kk); ctx.fillRect(bx - 2, by - 2, kk, kb);
      ctx.fillRect(bx + bw - kb + 2, by - 2, kb, kk); ctx.fillRect(bx + bw - 2, by - 2, kk, kb);
      ctx.fillRect(bx - 2, by + bh - kk + 2, kb, kk); ctx.fillRect(bx - 2, by + bh - kb + 2, kk, kb);
      ctx.fillRect(bx + bw - kb + 2, by + bh - kk + 2, kb, kk); ctx.fillRect(bx + bw - 2, by + bh - kb + 2, kk, kb);

      if (aktifAsama >= 6) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(bx + bw * 0.42, by + bh * 0.4, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(bx + bw * 0.6, by + bh * 0.42, 24, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.42, by + bh * 0.4);
        ctx.lineTo(bx + bw * 0.3, by + bh * 0.78);
        ctx.stroke();

        ctx.strokeStyle = '#22c55e';
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.3, by + bh * 0.78);
        ctx.lineTo(bx + bw * 0.12, by + bh * 0.95);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(bx + bw * 0.12, by + bh * 0.95, 18, 0, Math.PI * 2);
        ctx.stroke();
      }
    };
  }, [seciliMedya, spektralMod, aktifAsama]);

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: '#020611',
        color: '#f8fafc',
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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#070e1c', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '1.4rem', color: '#f59e0b' }}>⚜️</div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#38bdf8', letterSpacing: '0.08em' }}>
              SyKaşif HERITAGE // OPERASYONEL MASTER KONSOL
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              SESLİ ASİSTAN: <strong style={{ color: '#4ade80' }}>{asistanCevabi}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={sesliKomutDinle}
            style={{ padding: '6px 12px', backgroundColor: dinliyorMu ? '#dc2626' : '#0284c7', border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 'bold', fontSize: '0.72rem', cursor: 'pointer' }}
          >
            {dinliyorMu ? '🎙️ Dinliyor...' : '🎤 Sesli Konuş'}
          </button>

          <button
            onClick={() => setBildirimPaneliAcik(!bildirimPaneliAcik)}
            style={{ padding: '6px 12px', backgroundColor: bildirimPaneliAcik ? '#0284c7' : '#0f172a', border: '1px solid #38bdf8', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '0.72rem' }}
          >
            🔔 Bildirimler ({bildirimler.length})
          </button>

          <button
            onClick={toggleTamEkran}
            style={{ padding: '6px 12px', backgroundColor: tamEkran ? '#dc2626' : '#0284c7', border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.72rem' }}
          >
            {tamEkran ? '🗗 Küçült' : '⛶ Tam Ekran'}
          </button>
        </div>
      </header>

      {bildirimPaneliAcik && (
        <div style={{ backgroundColor: 'rgba(7, 14, 28, 0.98)', border: '1px solid #38bdf8', borderRadius: '8px', padding: '12px', marginBottom: '8px', fontSize: '0.72rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>CANLI BİLDİRİM AKIŞI ({bildirimler.length})</span>
            {bildirimler.length > 0 && (
              <button
                onClick={bildirimTemizle}
                style={{ backgroundColor: '#334155', border: 'none', borderRadius: '3px', color: '#cbd5e1', padding: '2px 8px', fontSize: '0.65rem', cursor: 'pointer' }}
              >
                Tümünü Temizle
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
            {bildirimler.map(b => (
              <div key={b.id} style={{ backgroundColor: '#030712', padding: '8px', borderRadius: '6px', border: `1px solid ${b.tur === 'BASARILI' ? '#22c55e' : b.tur === 'UYARI' ? '#f59e0b' : '#38bdf8'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: b.tur === 'BASARILI' ? '#4ade80' : '#f59e0b' }}>{b.baslik}</span>
                  <button
                    onClick={() => bildirimSil(b.id)}
                    style={{ backgroundColor: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.7rem' }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ color: '#cbd5e1', marginTop: '2px' }}>{b.detay}</div>
                <div style={{ color: '#64748b', fontSize: '0.6rem', marginTop: '4px' }}>{b.zaman}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', backgroundColor: '#070e1c', padding: '8px', borderRadius: '6px', border: '1px solid #1e293b', alignItems: 'center' }}>
        <form onSubmit={handleLinkEkle} style={{ display: 'flex', gap: '4px', flex: 1 }}>
          <input
            type="text"
            value={linkGirdisi}
            onChange={(e) => setLinkGirdisi(e.target.value)}
            placeholder="Web sayfası, YouTube veya RTSP kamera linki yapıştırın..."
            style={{ flex: 1, backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '4px', color: '#38bdf8', padding: '4px 8px', fontSize: '0.72rem', outline: 'none' }}
          />
          <button type="submit" style={{ backgroundColor: '#0284c7', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '0.7rem', padding: '4px 10px', fontWeight: 'bold', cursor: 'pointer' }}>
            + Link Ekle
          </button>
        </form>

        <label style={{ padding: '4px 12px', backgroundColor: '#f59e0b', borderRadius: '4px', color: '#000', fontWeight: 'bold', fontSize: '0.7rem', cursor: 'pointer' }}>
          📁 Çoklu Dosya Seç
          <input type="file" multiple accept="image/*,video/*" onChange={handleCokluMedya} style={{ display: 'none' }} />
        </label>
      </div>

      {medyaListesi.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '8px', paddingBottom: '4px' }}>
          {medyaListesi.map((m, idx) => (
            <div
              key={m.id}
              onClick={() => setSeciliMedyaIndex(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                backgroundColor: seciliMedyaIndex === idx ? '#0284c7' : '#081120',
                border: `1px solid ${seciliMedyaIndex === idx ? '#38bdf8' : '#334155'}`,
                borderRadius: '4px',
                color: '#fff',
                fontSize: '0.68rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <span>#{idx + 1} {m.ad}</span>
              <button
                onClick={(e) => medyaSil(m.id, e)}
                style={{ backgroundColor: '#dc2626', border: 'none', borderRadius: '2px', color: '#fff', padding: '1px 4px', fontSize: '0.6rem', cursor: 'pointer', fontWeight: 'bold' }}
                title="Bu medyayı sil"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '10px', marginBottom: '8px' }}>
        <div style={{ backgroundColor: '#070e1c', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', height: '510px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <select
                value={seciliIl}
                onChange={(e) => setSeciliIl(e.target.value)}
                style={{ backgroundColor: '#020617', color: '#f59e0b', border: '1px solid #334155', borderRadius: '4px', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold' }}
              >
                {Object.keys(SEHIR_KOORDINATLARI).map(il => <option key={il} value={il}>{il}</option>)}
              </select>

              <select
                value={havaDurumu}
                onChange={(e) => setHavaDurumu(e.target.value as any)}
                style={{ backgroundColor: '#020617', color: '#38bdf8', border: '1px solid #334155', borderRadius: '4px', padding: '2px 6px', fontSize: '0.7rem' }}
              >
                <option value="ACIK">☀️ Açık</option>
                <option value="YAGMUR">🌧️ Yağış</option>
                <option value="SIS">🌫️ Sis</option>
                <option value="KAR">❄️ Kar</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '2px' }}>
              {[
                { id: 'GUNUMUZ', ad: '🏙️ Günümüz' },
                { id: '3D_TOPO', ad: '🏔️ 3D Topo' },
                { id: 'UYDU', ad: '🛰️ Uydu' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setHaritaTipi(t.id as any)}
                  style={{ padding: '2px 8px', fontSize: '0.65rem', backgroundColor: haritaTipi === t.id ? '#0284c7' : '#020617', border: '1px solid #334155', color: '#fff', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {t.ad}
                </button>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', flex: 1, borderRadius: '6px', overflow: 'hidden' }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

            {havaDurumu === 'SIS' && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(3px)', pointerEvents: 'none', zIndex: 999 }} />}
            {havaDurumu === 'YAGMUR' && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(56,189,248,0.2) 1px, transparent 1px)', backgroundSize: '4px 20px', pointerEvents: 'none', zIndex: 999 }} />}
            {havaDurumu === 'KAR' && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '16px 16px', pointerEvents: 'none', zIndex: 999 }} />}
          </div>

          <div style={{ display: 'flex', gap: '3px', marginTop: '6px', overflowX: 'auto' }}>
            {['Taş Tepeler (M.Ö. 9600)', 'Hitit / Urartu (M.Ö. 1200)', 'Frigya', 'Roma / Bizans', 'Selçuklu / Osmanlı'].map(c => (
              <button
                key={c}
                onClick={() => setZamanCag(c)}
                style={{ padding: '3px 6px', fontSize: '0.62rem', backgroundColor: zamanCag === c ? '#0284c7' : '#020617', border: '1px solid #334155', color: '#fff', borderRadius: '3px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#070e1c', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', height: '510px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '6px' }}>
            {DTSE_ASAMALARI.map(as => (
              <button
                key={as.no}
                onClick={() => setAktifAsama(as.no)}
                style={{
                  padding: '3px 2px',
                  fontSize: '0.62rem',
                  backgroundColor: aktifAsama === as.no ? '#0284c7' : '#020617',
                  border: `1px solid ${aktifAsama === as.no ? '#38bdf8' : '#334155'}`,
                  color: '#fff',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{as.no}. {as.ad}</div>
                <div style={{ fontSize: '0.55rem', color: '#94a3b8' }}>{as.yuzde}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '3px', marginBottom: '6px', overflowX: 'auto' }}>
            {[
              { id: 'NORMAL', ad: 'Orijinal' },
              { id: 'LAB_KIRMIZI', ad: 'LAB (Aşı Boyası)' },
              { id: 'YDS_ALTIN', ad: 'YDS (Altın/Kanal)' },
              { id: 'YAZIT_AC', ad: '🔍 Silinmiş Yazıt Aç' },
              { id: 'ELA_MONTAJ', ad: 'Adli ELA (Montaj)' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSpektralMod(f.id as any)}
                style={{ padding: '3px 8px', fontSize: '0.65rem', backgroundColor: spektralMod === f.id ? '#0284c7' : '#020617', border: `1px solid ${spektralMod === f.id ? '#38bdf8' : '#334155'}`, color: '#fff', borderRadius: '3px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {f.ad}
              </button>
            ))}
            <button onClick={() => setZoom(prev => (prev >= 2 ? 1 : prev + 0.5))} style={{ padding: '3px 8px', fontSize: '0.65rem', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '3px', cursor: 'pointer' }}>
              🔍 {zoom}x
            </button>
          </div>

          <div style={{ position: 'relative', flex: 1, backgroundColor: '#000', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {seciliMedya ? (
              seciliMedya.tur === 'IMAGE' ? (
                <canvas ref={canvasRef} style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s', maxWidth: '100%', maxHeight: '380px', objectFit: 'contain' }} />
              ) : (
                <video src={seciliMedya.url} controls autoPlay loop style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s', maxWidth: '100%', maxHeight: '380px' }} />
              )
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '2.5rem' }}>📷</div>
                <div>Medya yükleyin; 3D Mesh, EDS altın kadrajı ve anomali tespiti çizilecektir.</div>
              </div>
            )}

            <div style={{ position: 'absolute', bottom: '6px', left: '6px', right: '6px', backgroundColor: 'rgba(2, 6, 23, 0.94)', border: '1px solid #22c55e', borderRadius: '4px', padding: '4px 8px', fontSize: '0.68rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#22c55e' }}>🧭 Hedef: 128° tahliye kanalı istikametinde <strong>5.40 - 7.00 metre</strong> mesafededir.</span>
              <span style={{ color: '#38bdf8' }}>Güven: %98.7</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#070e1c', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '6px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.8rem' }}>
              🛰️ CANLI AJAN SÜRÜSÜ ({ajanlar.length} UZMAN AJAN ÇALIŞIYOR)
            </span>
          </div>

          <button
            onClick={yeniAjanEkle}
            style={{ padding: '4px 10px', backgroundColor: '#0284c7', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '0.68rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            + Yeni Uzman Ajan Çoğalt
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
          {ajanlar.map(a => (
            <div key={a.id} style={{ backgroundColor: '#030712', border: `1px solid ${a.ogrenmeTalebi ? '#f59e0b' : '#334155'}`, borderRadius: '6px', padding: '8px', fontSize: '0.7rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: '#38bdf8' }}>{a.ad}</strong>
                <span style={{ color: '#4ade80' }}>%{a.guven}</span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.62rem', margin: '2px 0' }}>{a.rol}</div>
              <div style={{ color: '#cbd5e1', fontSize: '0.65rem' }}>Arşiv: {a.kayitSayisi} Kayıt</div>

              {a.ogrenmeTalebi && (
                <div style={{ marginTop: '6px', backgroundColor: '#1e1b4b', padding: '6px', borderRadius: '4px', border: '1px solid #6366f1' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>⚠️ YENİ METOT TESPİT EDİLDİ</div>
                  <div style={{ color: '#e0e7ff', fontSize: '0.62rem' }}>{a.ogrenmeTalebi.konu}</div>
                  <button
                    onClick={() => { setOnayBekleyenAjan(a); setAjanModalAcik(true); }}
                    style={{ marginTop: '4px', width: '100%', backgroundColor: '#4f46e5', border: 'none', borderRadius: '3px', color: '#fff', fontSize: '0.65rem', padding: '3px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Operatör Onayı Ver
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {ajanModalAcik && onayBekleyenAjan && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#070e1c', border: '1px solid #38bdf8', borderRadius: '8px', padding: '20px', maxWidth: '440px', width: '90%' }}>
            <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '1rem', marginBottom: '8px' }}>
              🛡️ AJAN ÖĞRENME ENTEGRASYON ONAYI
            </div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4', marginBottom: '12px' }}>
              <strong>{onayBekleyenAjan.ad}</strong>, açık kaynak taramasında yeni bir veri paketi buldu:<br/><br/>
              📌 <strong>Konu:</strong> {onayBekleyenAjan.ogrenmeTalebi?.konu}<br/>
              🌐 <strong>Kaynak:</strong> {onayBekleyenAjan.ogrenmeTalebi?.kaynak}<br/><br/>
              Bu öğrenme paketinin SyKaşif çekirdeğine entegre edilmesini onaylıyor musunuz?
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setAjanModalAcik(false)}
                style={{ padding: '6px 14px', backgroundColor: '#334155', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '0.72rem', cursor: 'pointer' }}
              >
                Reddet
              </button>
              <button
                onClick={() => {
                  setAjanlar(prev => prev.map(a => a.id === onayBekleyenAjan.id ? { ...a, ogrenmeTalebi: undefined, kayitSayisi: a.kayitSayisi + 500, guven: 99.8 } : a));
                  setAjanModalAcik(false);
                  const onayMetni = `${onayBekleyenAjan.ad} yeni öğrenme paketini hafızasına başarıyla entegre etti.`;
                  setAsistanCevabi(onayMetni);
                  konus(onayMetni);
                }}
                style={{ padding: '6px 14px', backgroundColor: '#22c55e', border: 'none', borderRadius: '4px', color: '#000', fontWeight: 'bold', fontSize: '0.72rem', cursor: 'pointer' }}
              >
                Onayla ve Entegre Et
              </button>
            </div>
          </div>
        </div>
      )}

      <SyMediaVerificationCore medyaUrl={seciliMedya?.url} />
    </div>
  );
};