import React, { useState, useRef, useEffect } from 'react';
import { askKasifAI } from './services/aiService';

interface KasifProps {
  onAnalyzeScreen?: () => string;
}

export const KasifAssistant: React.FC<KasifProps> = ({ onAnalyzeScreen }) => {
  const [durum, setDurum] = useState<'BEKLEMEDE' | 'DİNLİYOR' | 'DÜŞÜNÜYOR' | 'KONUŞUYOR'>('BEKLEMEDE');
  const [yanitMetni, setYanitMetni] = useState('Kâşif devrede. Dinlemeye hazır.');
  const [sesGucu, setSesGucu] = useState<number>(0);
  const [canliDiyalog, setCanliDiyalog] = useState<boolean>(false);
  const [metinGirisi, setMetinGirisi] = useState<string>('');

  const canliDiyalogRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const sesAlgilandiRef = useRef<boolean>(false);

  useEffect(() => {
    canliDiyalogRef.current = canliDiyalog;
  }, [canliDiyalog]);

  // Türkçe Seslendirme Motoru (TTS)
  const seslendir = (metin: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(metin);
    utterance.lang = 'tr-TR';
    utterance.rate = 1.05;

    utterance.onstart = () => setDurum('KONUŞUYOR');
    utterance.onend = () => {
      setDurum('BEKLEMEDE');
      if (canliDiyalogRef.current) {
        setTimeout(() => {
          dinlemeyiBaslat();
        }, 500);
      }
    };
    utterance.onerror = () => {
      setDurum('BEKLEMEDE');
      if (canliDiyalogRef.current) {
        setTimeout(() => {
          dinlemeyiBaslat();
        }, 500);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Komut ve Telemetri İşleme
  const komutIsle = async (kullaniciKomutu: string) => {
    setDurum('DÜŞÜNÜYOR');
    setYanitMetni(`Analiz ediliyor: "${kullaniciKomutu}"`);

    const telemetri = onAnalyzeScreen 
      ? onAnalyzeScreen() 
      : 'Hedef: Değerli Metal / Derinlik: 1.85m / Sinyal: %88 / Batarya: %92';

    const cevap = await askKasifAI(kullaniciKomutu, telemetri);
    setYanitMetni(cevap);
    seslendir(cevap);
  };

  // Ses Dinleme ve Seviye Algılama
  const dinlemeyiBaslat = async () => {
    try {
      sesAlgilandiRef.current = false;

      if (!mediaStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkAudio = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
          const level = Math.min(100, Math.round(avg * 2.2));
          setSesGucu(level);
          if (level > 25) sesAlgilandiRef.current = true;
          requestAnimationFrame(checkAudio);
        };
        checkAudio();
      }

      setDurum('DİNLİYOR');
      setYanitMetni('Dinliyorum, konuşabilirsiniz...');

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        if (recognitionRef.current) recognitionRef.current.abort();

        const recog = new SpeechRecognition();
        recog.lang = 'tr-TR';
        recog.continuous = false;
        recog.interimResults = false;

        recog.onresult = (e: any) => {
          const transkript = e.results[0][0].transcript;
          komutIsle(transkript);
        };

        recog.onerror = () => {
          // Tarayıcı STT takılırsa ancak mikrofona ses geldiyse otomatik saha analizi yap
          if (sesAlgilandiRef.current) {
            komutIsle('Mevcut telemetri ve hedef durumunu detaylandır.');
          } else if (canliDiyalogRef.current) {
            setTimeout(() => dinlemeyiBaslat(), 800);
          } else {
            setDurum('BEKLEMEDE');
          }
        };

        recognitionRef.current = recog;
        recog.start();
      } else {
        // STT desteklenmiyorsa ses dalgasından 3 saniye sonra tetikle
        setTimeout(() => {
          komutIsle('Saha genel durumunu raporla.');
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setDurum('BEKLEMEDE');
      setYanitMetni('Mikrofon erişimi sağlanamadı.');
    }
  };

  const diyologAnahtari = () => {
    if (canliDiyalog) {
      setCanliDiyalog(false);
      setDurum('BEKLEMEDE');
      setYanitMetni('Canlı diyalog kapatıldı.');
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    } else {
      setCanliDiyalog(true);
      dinlemeyiBaslat();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metinGirisi.trim()) return;
    komutIsle(metinGirisi);
    setMetinGirisi('');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '14px',
      gap: '12px',
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      {/* JARVIS Başlık */}
      <div style={{
        fontSize: '1.3rem',
        fontWeight: '900',
        letterSpacing: '0.25em',
        color: '#38bdf8',
        textShadow: '0 0 12px rgba(56, 189, 248, 0.6)'
      }}>
        KÂŞİF JARVIS
      </div>

      {/* Durum Rozeti */}
      <div style={{
        fontSize: '0.8rem',
        padding: '4px 14px',
        borderRadius: '20px',
        border: `1px solid ${canliDiyalog ? '#22c55e' : '#0284c7'}`,
        backgroundColor: canliDiyalog ? 'rgba(34, 197, 94, 0.15)' : 'rgba(2, 132, 199, 0.15)',
        color: canliDiyalog ? '#4ade80' : '#38bdf8',
        fontFamily: 'monospace'
      }}>
        {canliDiyalog ? `CANLI DİYALOG AÇIK (${durum})` : `MOD: MANUEL (${durum})`} {durum === 'DİNLİYOR' && `| SİNYAL: %${sesGucu}`}
      </div>

      {/* Yanıt Paneli */}
      <div style={{
        minHeight: '70px',
        width: '100%',
        padding: '12px 16px',
        borderRadius: '10px',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        color: '#f1f5f9',
        fontSize: '0.95rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)'
      }}>
        {yanitMetni}
      </div>

      {/* Ana Mikrofon / Canlı Diyalog Butonu */}
      <button
        onClick={diyologAnahtari}
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: canliDiyalog ? '3px solid #22c55e' : '3px solid #38bdf8',
          backgroundColor: canliDiyalog ? 'rgba(34, 197, 94, 0.2)' : 'rgba(14, 165, 233, 0.15)',
          color: canliDiyalog ? '#4ade80' : '#38bdf8',
          fontWeight: 'bold',
          letterSpacing: '0.05em',
          fontSize: '0.85rem',
          cursor: 'pointer',
          boxShadow: canliDiyalog 
            ? `0 0 ${20 + sesGucu / 2}px rgba(34, 197, 94, 0.8)` 
            : '0 0 20px rgba(56, 189, 248, 0.4)',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
      >
        {canliDiyalog ? (durum === 'KONUŞUYOR' ? 'KÂŞİF' : 'DİNLİYOR') : 'DİYALOĞU BAŞLAT'}
      </button>

      {/* Hızlı Komut Tetikleyicileri */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
        <button
          onClick={() => komutIsle('Hedef derinliğini ve metal türünü analiz et.')}
          style={{
            padding: '10px',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#7dd3fc',
            borderRadius: '6px',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          🎯 Hedef Analizi
        </button>
        <button
          onClick={() => komutIsle('Batarya, GPS ve sinyal durumunu raporla.')}
          style={{
            padding: '10px',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#7dd3fc',
            borderRadius: '6px',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          ⚡ Sistem Raporu
        </button>
      </div>

      {/* Klavye / Manuel Mesaj Girişi */}
      <form onSubmit={handleManualSubmit} style={{ display: 'flex', width: '100%', gap: '6px', marginTop: '4px' }}>
        <input
          type="text"
          value={metinGirisi}
          onChange={(e) => setMetinGirisi(e.target.value)}
          placeholder="Komut yazın veya sorun..."
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            backgroundColor: '#0284c7',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          Gönder
        </button>
      </form>
    </div>
  );
};