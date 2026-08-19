import React, { useState, useRef } from 'react';
import { askKasifAI } from './services/aiService';

interface KasifProps {
  onAnalyzeScreen?: () => string;
}

type SistemDurumu = 'BEKLEMEDE' | 'DİNLİYOR' | 'DÜŞÜNÜYOR' | 'KONUŞUYOR';

export const KasifAssistant: React.FC<KasifProps> = ({ onAnalyzeScreen }) => {
  const [durum, setDurum] = useState<SistemDurumu>('BEKLEMEDE');
  const [altMetin, setAltMetin] = useState('Kâşif hazır. Komut verin veya butona dokunun.');
  const [logMetni, setLogMetni] = useState<string>('Sistem Çevrimiçi');
  const [metinGirisi, setMetinGirisi] = useState('');

  const recognitionRef = useRef<any>(null);

  // Seslendirme Motoru (TTS - Cihazın kendi Türkçe sentezleyicisi)
  const seslendir = (metin: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const ses = new SpeechSynthesisUtterance(metin);
      ses.lang = 'tr-TR';
      ses.rate = 1.0;
      ses.pitch = 1.0;

      ses.onstart = () => {
        setDurum('KONUŞUYOR');
        setLogMetni('Yanıt seslendiriliyor...');
      };

      ses.onend = () => {
        setDurum('BEKLEMEDE');
      };

      ses.onerror = () => {
        setDurum('BEKLEMEDE');
      };

      window.speechSynthesis.speak(ses);
    }
  };

  // Analiz & AI İstek Yürütücü
  const komutCalistir = async (komut: string) => {
    if (!komut.trim()) return;

    setDurum('DÜŞÜNÜYOR');
    setAltMetin(`Siz: "${komut}"`);
    setLogMetni('Kâşif telemetriyi analiz ediyor...');

    try {
      const ekranVerisi = onAnalyzeScreen 
        ? onAnalyzeScreen() 
        : "Hedef: Kıymetli Metal (Altın/Bronz), Derinlik: 1.8m, Sinyal: %87, Pil: %94";

      const yanit = await askKasifAI(komut, ekranVerisi);
      setAltMetin(`Kâşif: ${yanit}`);
      setLogMetni('Analiz tamamlandı.');
      seslendir(yanit);
    } catch (hata: any) {
      setDurum('BEKLEMEDE');
      setLogMetni('Hata: ' + (hata.message || 'Bağlantı kesildi'));
      setAltMetin('Komut işlenirken bir sorun oluştu.');
    }
  };

  // Mikrofonla Dinleme
  const mikrofondanDinle = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setLogMetni('Tarayıcı ses tanıma servisine izin vermiyor.');
      setAltMetin('Lütfen alttaki hızlı butonları veya yazılı komutu kullanın.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setDurum('DİNLİYOR');
        setAltMetin('Dinliyorum, komutunuzu söyleyin...');
        setLogMetni('Mikrofon aktif');
      };

      recognition.onresult = (event: any) => {
        const metin = event.results[0][0].transcript;
        komutCalistir(metin);
      };

      recognition.onerror = (e: any) => {
        console.warn('STT Hatası:', e.error);
        setDurum('BEKLEMEDE');
        setLogMetni(`Mikrofon uyarısı: ${e.error}`);
      };

      recognition.onend = () => {
        if (durum === 'DİNLİYOR') {
          setDurum('BEKLEMEDE');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      setDurum('BEKLEMEDE');
      setLogMetni('Mikrofon açılamadı.');
    }
  };

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
      {/* Başlık */}
      <div style={{
        fontSize: '1.4rem',
        fontWeight: 'bold',
        letterSpacing: '0.2em',
        color: '#22d3ee',
        textTransform: 'uppercase'
      }}>
        KÂŞİF
      </div>

      {/* Durum Rozeti */}
      <div style={{
        fontSize: '0.85rem',
        padding: '4px 16px',
        borderRadius: '6px',
        border: '1px solid rgba(6, 182, 212, 0.4)',
        backgroundColor: 'rgba(8, 51, 68, 0.6)',
        color: '#67e8f9',
        fontFamily: 'monospace'
      }}>
        DURUM: {durum}
      </div>

      {/* Ekran & Yanıt Paneli */}
      <div style={{
        minHeight: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '10px 16px',
        color: '#cbd5e1',
        fontSize: '0.95rem',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        borderRadius: '8px',
        width: '100%',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
      }}>
        {altMetin}
      </div>

      {/* Ana Sesli Komut Butonu */}
      <button
        onClick={mikrofondanDinle}
        style={{
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          border: durum === 'DİNLİYOR' ? '3px solid #ef4444' : '3px solid #06b6d4',
          backgroundColor: durum === 'DİNLİYOR' ? 'rgba(127, 29, 29, 0.5)' : 'rgba(8, 51, 68, 0.5)',
          color: durum === 'DİNLİYOR' ? '#f87171' : '#22d3ee',
          fontWeight: 'bold',
          letterSpacing: '0.1em',
          fontSize: '0.95rem',
          cursor: 'pointer',
          boxShadow: durum === 'DİNLİYOR' ? '0 0 25px rgba(239, 68, 68, 0.5)' : '0 0 25px rgba(6, 182, 212, 0.3)',
          transition: 'all 0.3s ease',
          margin: '6px 0'
        }}
      >
        {durum === 'DİNLİYOR' ? 'DİNLİYOR...' : 'KONUŞ'}
      </button>

      {/* Hızlı Analiz Butonları */}
      <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
        <button
          onClick={() => komutCalistir('Hedef durumunu ve derinliği analiz et.')}
          style={{
            flex: 1,
            padding: '8px 10px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#38bdf8',
            borderRadius: '6px',
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          🔍 Hedef Analizi
        </button>
        <button
          onClick={() => komutCalistir('Sistem batarya ve GPS durumunu raporla.')}
          style={{
            flex: 1,
            padding: '8px 10px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#38bdf8',
            borderRadius: '6px',
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          ⚡ Sistem Raporu
        </button>
      </div>

      {/* Yazılı Komut Girişi */}
      <div style={{ display: 'flex', width: '100%', gap: '6px', marginTop: '4px' }}>
        <input
          type="text"
          value={metinGirisi}
          onChange={(e) => setMetinGirisi(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              komutCalistir(metinGirisi);
              setMetinGirisi('');
            }
          }}
          placeholder="Kâşif'e komut yazın..."
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '6px',
            color: '#ffffff',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        />
        <button
          onClick={() => {
            komutCalistir(metinGirisi);
            setMetinGirisi('');
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0284c7',
            border: 'none',
            borderRadius: '6px',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          Gönder
        </button>
      </div>

      {/* Log */}
      <div style={{
        fontSize: '0.75rem',
        color: '#64748b',
        fontFamily: 'monospace',
        textAlign: 'center',
        marginTop: '4px'
      }}>
        BİLGİ: {logMetni}
      </div>
    </div>
  );
};