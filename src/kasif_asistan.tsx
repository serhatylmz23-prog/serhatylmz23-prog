import React, { useState, useRef } from 'react';
import { askKasifAI } from './services/aiService';

export const KasifAssistant: React.FC = () => {
  const [dinliyor, setDinliyor] = useState<boolean>(false);
  const [durum, setDurum] = useState<'HAZIR' | 'DİNLİYOR' | 'DÜŞÜNÜYOR' | 'KONUŞUYOR'>('HAZIR');
  const [yanit, setYanit] = useState<string>('Kâşif komuta hazır.');
  const [metin, setMetin] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);

  // Ses Çıkış Motoru (TTS)
  const seslendir = (metinIcerik: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const ut = new SpeechSynthesisUtterance(metinIcerik);
    ut.lang = 'tr-TR';
    ut.rate = 1.05;
    ut.pitch = 1.0;

    ut.onstart = () => setDurum('KONUŞUYOR');
    ut.onend = () => setDurum('HAZIR');
    ut.onerror = () => setDurum('HAZIR');

    window.speechSynthesis.speak(ut);
  };

  // Yapay Zekaya Gönder ve Cevapla
  const komutIsle = async (kullaniciGirdisi: string) => {
    if (!kullaniciGirdisi.trim()) return;
    setDurum('DÜŞÜNÜYOR');
    setYanit(`İşleniyor: "${kullaniciGirdisi}"...`);

    try {
      const cevap = await askKasifAI(kullaniciGirdisi, 'Telemetri: Sinyal %88, Pil %92, Derinlik 1.85m');
      setYanit(cevap);
      seslendir(cevap);
    } catch {
      const yedek = 'Komut alındı. Sistem telemetrisi ve sensörler aktif.';
      setYanit(yedek);
      seslendir(yedek);
    }
  };

  // Kompakt Mikrofon Tetikleyici
  const mikrofonTetikle = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Tarayıcınız ses tanıma desteklemiyor.');
      return;
    }

    if (dinliyor) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setDinliyor(false);
      setDurum('HAZIR');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'tr-TR';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setDinliyor(true);
        setDurum('DİNLİYOR');
        setYanit('Dinleniyor...');
      };

      rec.onresult = (event: any) => {
        const algilananSes = event.results[0][0].transcript;
        setDinliyor(false);
        komutIsle(algilananSes);
      };

      rec.onerror = () => {
        setDinliyor(false);
        setDurum('HAZIR');
      };

      rec.onend = () => {
        setDinliyor(false);
        if (durum === 'DİNLİYOR') setDurum('HAZIR');
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setDinliyor(false);
      setDurum('HAZIR');
    }
  };

  return (
    <div style={{
      padding: '14px',
      backgroundColor: '#090d16',
      borderRadius: '10px',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      maxWidth: '850px',
      margin: '0 auto 12px auto',
      color: '#fff',
      boxShadow: '0 0 20px rgba(0,0,0,0.5)'
    }}>
      {/* Üst Durum Şeridi */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#38bdf8', letterSpacing: '0.05em' }}>
            KÂŞİF ASİSTAN
          </span>
          <span style={{
            fontSize: '0.65rem',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: durum === 'DİNLİYOR' ? '#dc2626' : durum === 'KONUŞUYOR' ? '#16a34a' : durum === 'DÜŞÜNÜYOR' ? '#d97706' : '#1e293b',
            color: '#fff',
            fontFamily: 'monospace'
          }}>
            {durum}
          </span>
        </div>

        {/* Hızlı Aksiyon Butonları */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => komutIsle('Hedef ve saha durumunu raporla')}
            style={{
              padding: '4px 10px',
              backgroundColor: '#0f172a',
              border: '1px solid #0284c7',
              borderRadius: '4px',
              color: '#38bdf8',
              fontSize: '0.72rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🎯 Hedef Analizi
          </button>
          <button
            onClick={() => komutIsle('Donanım ve GPS telemetrisini denetle')}
            style={{
              padding: '4px 10px',
              backgroundColor: '#0f172a',
              border: '1px solid #16a34a',
              borderRadius: '4px',
              color: '#4ade80',
              fontSize: '0.72rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ⚡ Telemetri
          </button>
        </div>
      </div>

      {/* Yanıt / Geri Bildirim Satırı */}
      <div style={{
        padding: '10px 12px',
        backgroundColor: '#030712',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '6px',
        minHeight: '36px',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '10px',
        fontSize: '0.85rem',
        color: '#e2e8f0'
      }}>
        {yanit}
      </div>

      {/* Kompakt Girdi Çubuğu (İnput + Mikrofon Butonu + Gönder) */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input
          type="text"
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          placeholder="Komut verin veya soru sorun..."
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#020617',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '0.82rem',
            outline: 'none'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && metin.trim()) {
              komutIsle(metin);
              setMetin('');
            }
          }}
        />

        {/* Kompakt Mikrofon Butonu */}
        <button
          onClick={mikrofonTetikle}
          title={dinliyor ? 'Dinlemeyi Durdur' : 'Sesle Konuş'}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            backgroundColor: dinliyor ? '#dc2626' : '#0f172a',
            border: `1px solid ${dinliyor ? '#f87171' : '#0284c7'}`,
            boxShadow: dinliyor ? '0 0 10px #dc2626' : 'none',
            color: '#fff',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          {dinliyor ? '⏹' : '🎙️'}
        </button>

        {/* Gönder Butonu */}
        <button
          onClick={() => {
            if (metin.trim()) {
              komutIsle(metin);
              setMetin('');
            }
          }}
          style={{
            padding: '8px 14px',
            backgroundColor: '#0284c7',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Gönder
        </button>
      </div>
    </div>
  );
};