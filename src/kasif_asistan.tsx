import React, { useState, useRef, useEffect, useCallback } from 'react';
import { askKasifAI } from './services/aiService';

interface KasifProps {
  onAnalyzeScreen?: () => string;
}

type SistemDurumu = 'BEKLEMEDE' | 'DİNLİYOR' | 'DÜŞÜNÜYOR' | 'KONUŞUYOR';

export const KasifAssistant: React.FC<KasifProps> = ({ onAnalyzeScreen }) => {
  const [durum, setDurum] = useState<SistemDurumu>('BEKLEMEDE');
  const [altMetin, setAltMetin] = useState('Kâşif hazır. Karşılıklı diyalog için "Sohbeti Başlat"a basın.');
  const [sesSeviyesi, setSesSeviyesi] = useState<number>(0);
  const [otomatikMod, setOtomatikMod] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const otomatikModRef = useRef<boolean>(false);

  useEffect(() => {
    otomatikModRef.current = otomatikMod;
  }, [otomatikMod]);

  // Türkçe Seslendirme Motoru (TTS)
  const seslendir = useCallback((metin: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const ses = new SpeechSynthesisUtterance(metin);
      ses.lang = 'tr-TR';
      ses.rate = 1.0;

      ses.onstart = () => {
        setDurum('KONUŞUYOR');
      };

      ses.onend = () => {
        setDurum('BEKLEMEDE');
        // Kâşif konuşmasını bitirince otomatik mod açıksa hemen tekrar dinlemeye geçer
        if (otomatikModRef.current) {
          setTimeout(() => {
            sesliGirdiyiBaslat();
          }, 400);
        }
      };

      ses.onerror = () => {
        setDurum('BEKLEMEDE');
        if (otomatikModRef.current) {
          setTimeout(() => {
            sesliGirdiyiBaslat();
          }, 400);
        }
      };

      window.speechSynthesis.speak(ses);
    }
  }, []);

  // Komut Yürütme Motoru
  const komutCalistir = async (komut: string) => {
    setDurum('DÜŞÜNÜYOR');
    setAltMetin(`Algılandı: "${komut}"`);

    const ekranVerisi = onAnalyzeScreen 
      ? onAnalyzeScreen() 
      : 'Hedef: Kıymetli Metal, Derinlik: 1.8m, Sinyal: %87, GPS: 38.6748, 39.2225';

    const yanit = await askKasifAI(komut, ekranVerisi);
    setAltMetin(yanit);
    seslendir(yanit);
  };

  // Dinleme Motoru
  const sesliGirdiyiBaslat = async () => {
    try {
      if (!mediaStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const sesKontrol = () => {
          analyser.getByteFrequencyData(dataArray);
          let toplam = 0;
          for (let i = 0; i < dataArray.length; i++) {
            toplam += dataArray[i];
          }
          const ortalama = toplam / dataArray.length;
          setSesSeviyesi(Math.min(100, Math.round(ortalama * 2)));
          animFrameRef.current = requestAnimationFrame(sesKontrol);
        };
        sesKontrol();
      }

      setDurum('DİNLİYOR');
      setAltMetin('Sizi dinliyorum, konuşabilirsiniz...');

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'tr-TR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (e: any) => {
          const metin = e.results[0][0].transcript;
          komutCalistir(metin);
        };

        recognition.onerror = (e: any) => {
          console.warn('STT uyarısı:', e.error);
          if (otomatikModRef.current && e.error === 'no-speech') {
            // Sessizlik durumunda dinlemeyi canlı tut
            setTimeout(() => {
              if (otomatikModRef.current) sesliGirdiyiBaslat();
            }, 300);
          } else {
            setDurum('BEKLEMEDE');
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      }
    } catch (err) {
      console.error('Mikrofon erişim hatası:', err);
      setDurum('BEKLEMEDE');
      setAltMetin('Mikrofon bağlantısı kurulamadı.');
    }
  };

  const sohbetModunuDegistir = () => {
    if (otomatikMod) {
      setOtomatikMod(false);
      setDurum('BEKLEMEDE');
      setAltMetin('Karşılıklı konuşma durduruldu.');
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    } else {
      setOtomatikMod(true);
      sesliGirdiyiBaslat();
    }
  };

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px',
      color: '#ffffff',
      gap: '12px',
      width: '100%',
      maxWidth: '460px',
      margin: '0 auto'
    }}>
      <div style={{
        fontSize: '1.4rem',
        fontWeight: 'bold',
        letterSpacing: '0.2em',
        color: '#22d3ee',
        textTransform: 'uppercase'
      }}>
        KÂŞİF
      </div>

      {/* Durum Göstergesi */}
      <div style={{
        fontSize: '0.85rem',
        padding: '4px 16px',
        borderRadius: '6px',
        border: `1px solid ${otomatikMod ? '#22c55e' : 'rgba(6, 182, 212, 0.4)'}`,
        backgroundColor: otomatikMod ? 'rgba(20, 83, 45, 0.6)' : 'rgba(8, 51, 68, 0.6)',
        color: otomatikMod ? '#86efac' : '#67e8f9',
        fontFamily: 'monospace'
      }}>
        MOD: {otomatikMod ? 'CANLI KARŞILIKLI DİYALOG' : 'MANUEL'} | DURUM: {durum} {durum === 'DİNLİYOR' && `(%${sesSeviyesi})`}
      </div>

      {/* Yanıt Kutusu */}
      <div style={{
        minHeight: '65px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '10px 16px',
        color: '#cbd5e1',
        fontSize: '0.92rem',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        borderRadius: '8px',
        width: '100%',
        border: '1px solid rgba(56, 189, 248, 0.2)'
      }}>
        {altMetin}
      </div>

      {/* Ana Karşılıklı Konuşma / Canlı Sohbet Butonu */}
      <button
        onClick={sohbetModunuDegistir}
        style={{
          width: '130px',
          height: '130px',
          borderRadius: '50%',
          border: otomatikMod ? '3px solid #22c55e' : '3px solid #06b6d4',
          backgroundColor: otomatikMod ? 'rgba(20, 83, 45, 0.5)' : 'rgba(8, 51, 68, 0.5)',
          color: otomatikMod ? '#86efac' : '#22d3ee',
          fontWeight: 'bold',
          letterSpacing: '0.08em',
          fontSize: '0.88rem',
          cursor: 'pointer',
          boxShadow: otomatikMod 
            ? `0 0 ${25 + sesSeviyesi / 2}px rgba(34, 197, 94, 0.7)` 
            : '0 0 20px rgba(6, 182, 212, 0.3)',
          transition: 'all 0.2s ease',
          margin: '6px 0',
          textAlign: 'center'
        }}
      >
        {otomatikMod ? (durum === 'KONUŞUYOR' ? 'KÂŞİF ANLATIYOR' : 'DİNLİYOR...') : 'SOHBETİ BAŞLAT'}
      </button>

      {/* Manuel Hızlı Analiz Butonları */}
      <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
        <button
          onClick={() => komutCalistir('Hedef durumunu ve derinliği analiz et.')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#38bdf8',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🔍 Hedef Analizi
        </button>
        <button
          onClick={() => komutCalistir('Sistem batarya ve GPS durumunu raporla.')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#38bdf8',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ⚡ Sistem Raporu
        </button>
      </div>
    </div>
  );
};