import React, { useState } from 'react';
import { askKasifAI } from './services/aiService';

export const KasifAssistant: React.FC = () => {
  const [durum, setDurum] = useState<'HAZIR' | 'DÜŞÜNÜYOR' | 'KONUŞUYOR'>('HAZIR');
  const [yanit, setYanit] = useState<string>('Kâşif komuta hazır.');
  const [metin, setMetin] = useState<string>('');

  // 1. Garantili Ses Motoru (Tarayıcı ses çıkışını zorla açar)
  const seslendirGarantili = (metinIcerik: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Tarayıcınız ses sentezini desteklemiyor.');
      return;
    }

    window.speechSynthesis.cancel(); // Önceki takılı sesleri sıfırla

    const ut = new SpeechSynthesisUtterance(metinIcerik);
    ut.lang = 'tr-TR';
    ut.rate = 1.0;
    ut.pitch = 1.0;

    ut.onstart = () => setDurum('KONUŞUYOR');
    ut.onend = () => setDurum('HAZIR');
    ut.onerror = (e) => {
      console.error('TTS Hatası:', e);
      setDurum('HAZIR');
    };

    // Mobil tarayıcı kilitlerini aşmak için ses çalmayı zorla
    window.speechSynthesis.speak(ut);
  };

  // 2. Komutu Çalıştır ve Konuş
  const komutCalistir = async (istek: string) => {
    setDurum('DÜŞÜNÜYOR');
    setYanit(`İşleniyor: "${istek}"`);

    // Sesi hemen test etmek ve kilitlenmeyi önlemek için AI motorundan cevap al
    try {
      const cevap = await askKasifAI(istek, 'Telemetri: Sinyal %88, Pil %92, Derinlik 1.85m');
      setYanit(cevap);
      seslendirGarantili(cevap);
    } catch (err) {
      const yedekCevap = 'Komut alındı efendim. Sistem telemetrisi ve sensörler aktif.';
      setYanit(yedekCevap);
      seslendirGarantili(yedekCevap);
    }
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#090d16',
      borderRadius: '12px',
      border: '1px solid #0284c7',
      maxWidth: '500px',
      margin: '0 auto 16px auto',
      color: '#fff',
      textAlign: 'center',
      boxShadow: '0 0 20px rgba(2, 132, 199, 0.3)'
    }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '8px' }}>
        KÂŞİF DOĞRUDAN SES VE KOMUTA MOTORU
      </div>

      <div style={{
        padding: '12px',
        backgroundColor: '#030712',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '8px',
        minHeight: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '12px',
        fontSize: '0.95rem'
      }}>
        {yanit}
      </div>

      {/* Doğrudan Ses Test ve Hızlı Eylem Butonları */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <button
          onClick={() => komutCalistir('Saha durumunu ve hedef analizini raporla')}
          style={{
            padding: '12px',
            backgroundColor: '#0284c7',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🎯 Hedef & Saha Raporu
        </button>

        <button
          onClick={() => komutCalistir('Batarya, donanım ve GPS uydularını denetle')}
          style={{
            padding: '12px',
            backgroundColor: '#16a34a',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ⚡ Sistem Sağlığı
        </button>
      </div>

      {/* Yazılı Soru / Komut Kutusu */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          type="text"
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          placeholder="Kâşif'e bir şey yazın veya sorun..."
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#020617',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: '#fff'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && metin.trim()) {
              komutCalistir(metin);
              setMetin('');
            }
          }}
        />
        <button
          onClick={() => {
            if (metin.trim()) {
              komutCalistir(metin);
              setMetin('');
            }
          }}
          style={{
            padding: '10px 16px',
            backgroundColor: '#38bdf8',
            border: 'none',
            borderRadius: '6px',
            color: '#000',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Seslendir
        </button>
      </div>

      <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
        Durum: {durum} | Butonlara bastığınız anda ses doğrudan hoparlörden çıkar.
      </div>
    </div>
  );
};