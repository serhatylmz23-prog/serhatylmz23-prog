import React, { useState, useRef, useEffect } from 'react';
import { askKasifAI } from './services/aiService';

interface KasifProps {
  onAnalyzeScreen?: () => string;
}

type SistemDurumu = 'BEKLEMEDE' | 'DİNLİYOR' | 'DÜŞÜNÜYOR' | 'KONUŞUYOR';

export const KasifAssistant: React.FC<KasifProps> = ({ onAnalyzeScreen }) => {
  const [durum, setDurum] = useState<SistemDurumu>('BEKLEMEDE');
  const [altMetin, setAltMetin] = useState('Kâşif hazır. Komut verin veya butona dokunun.');
  const [sesSeviyesi, setSesSeviyesi] = useState<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Türkçe Seslendirme Motoru (TTS)
  const seslendir = (metin: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const ses = new SpeechSynthesisUtterance(metin);
      ses.lang = 'tr-TR';
      ses.rate = 1.0;

      ses.onstart = () => setDurum('KONUŞUYOR');
      ses.onend = () => setDurum('BEKLEMEDE');
      ses.onerror = () => setDurum('BEKLEMEDE');

      window.speechSynthesis.speak(ses);
    }
  };

  // Komut Yürütme Motoru
  const komutCalistir = async (komut: string) => {
    setDurum('DÜŞÜNÜYOR');
    setAltMetin(`İşleniyor: "${komut}"`);

    const ekranVerisi = onAnalyzeScreen 
      ? onAnalyzeScreen() 
      : 'Hedef: Kıymetli Metal (Altın/Bronz), Derinlik: 1.8m, Sinyal: %87';

    const yanit = await askKasifAI(komut, ekranVerisi);
    setAltMetin(yanit);
    seslendir(yanit);
  };

  // Odysseus Tipi Ham Donanım Ses Girişi
  const sesliGirdiyiBaslat = async () => {
    if (durum === 'DİNLİYOR') {
      sesliGirdiyiDurdur();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setDurum('DİNLİYOR');
      setAltMetin('Dinliyorum... (Konuşmanız izleniyor)');

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

      // Standart STT desteği varsa yakala, yoksa ses algılamasıyla analize yönlendir
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'tr-TR';
        recognition.continuous = false;
        recognition.onresult = (e: any) => {
          const metin = e.results[0][0].transcript;
          sesliGirdiyiDurdur();
          komutCalistir(metin);
        };
        recognition.onerror = () => {
          // STT hata verirse varsayılan hedef analizi yap
          setTimeout(() => {
            sesliGirdiyiDurdur();
            komutCalistir('Hedef durumunu ve derinliği analiz et.');
          }, 3000);
        };
        recognition.start();
      } else {
        setTimeout(() => {
          sesliGirdiyiDurdur();
          komutCalistir('Saha telemetri durumunu özetle.');
        }, 3000);
      }
    } catch (err) {
      console.error('Mikrofon erişim hatası:', err);
      setDurum('BEKLEMEDE');
      setAltMetin('Mikrofon izni alınamadı.');
    }
  };

  const sesliGirdiyiDurdur = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setSesSeviyesi(0);
    if (durum === 'DİNLİYOR') setDurum('BEKLEMEDE');
  };

  useEffect(() => {
    return () => sesliGirdiyiDurdur();
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
        border: '1px solid rgba(6, 182, 212, 0.4)',
        backgroundColor: 'rgba(8, 51, 68, 0.6)',
        color: '#67e8f9',
        fontFamily: 'monospace'
      }}>
        DURUM: {durum} {durum === 'DİNLİYOR' && `(Sinyal: %${sesSeviyesi})`}
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

      {/* Neon Mikrofon / Konuş Butonu */}
      <button
        onClick={sesliGirdiyiBaslat}
        style={{
          width: '115px',
          height: '115px',
          borderRadius: '50%',
          border: durum === 'DİNLİYOR' ? '3px solid #ef4444' : '3px solid #06b6d4',
          backgroundColor: durum === 'DİNLİYOR' ? 'rgba(127, 29, 29, 0.5)' : 'rgba(8, 51, 68, 0.5)',
          color: durum === 'DİNLİYOR' ? '#f87171' : '#22d3ee',
          fontWeight: 'bold',
          letterSpacing: '0.1em',
          fontSize: '0.95rem',
          cursor: 'pointer',
          boxShadow: durum === 'DİNLİYOR' 
            ? `0 0 ${20 + sesSeviyesi / 3}px rgba(239, 68, 68, 0.6)` 
            : '0 0 25px rgba(6, 182, 212, 0.3)',
          transition: 'all 0.2s ease',
          margin: '6px 0'
        }}
      >
        {durum === 'DİNLİYOR' ? 'DİNLİYOR' : 'KONUŞ'}
      </button>

      {/* Hızlı Analiz Butonları */}
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