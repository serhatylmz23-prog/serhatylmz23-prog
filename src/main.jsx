import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { KasifAssistant } from './kasif_asistan';

export function App() {
  const [pilYuzdesi, setPilYuzdesi] = useState(null);
  const [sarjdaMi, setSarjdaMi] = useState(false);
  const [gpsKonum, setGpsKonum] = useState(null);
  const [gpsDurum, setGpsDurum] = useState('GPS Aranıyor...');

  // 1. Canlı Pil Durumunu Oku
  useEffect(() => {
    const pilKontrol = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery = await navigator.getBattery();
          const guncelle = () => {
            setPilYuzdesi(Math.round(battery.level * 100));
            setSarjdaMi(battery.charging);
          };
          guncelle();
          battery.addEventListener('levelchange', guncelle);
          battery.addEventListener('chargingchange', guncelle);
        } else {
          setPilYuzdesi(85); // API desteklenmezse varsayılan telemetri
        }
      } catch (e) {
        setPilYuzdesi(85);
      }
    };
    pilKontrol();
  }, []);

  // 2. Canlı GPS Konumunu Oku
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsKonum({
            enlem: pos.coords.latitude,
            boylam: pos.coords.longitude
          });
          setGpsDurum('');
        },
        (err) => {
          console.warn('GPS İzin Hatası:', err);
          // İzin henüz verilmediyse varsayılan operasyonel saha koordinatını göster
          setGpsDurum('38.6748° N, 39.2225° E (Saha)');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setGpsDurum('GPS Desteklenmiyor');
    }
  }, []);

  // Kâşif'e Canlı Telemetriyi İlet
  const ekranAnalizi = () => {
    const pilMetni = pilYuzdesi !== null ? `%${pilYuzdesi} ${sarjdaMi ? '(Şarjda)' : ''}` : '%85';
    const gpsMetni = gpsKonum 
      ? `${gpsKonum.enlem.toFixed(4)}° N, ${gpsKonum.boylam.toFixed(4)}° E` 
      : (gpsDurum || '38.6748° N, 39.2225° E');

    return `Sistem Verileri -> Pil: ${pilMetni}, GPS Konumu: ${gpsMetni}, Hedef: Kıymetli Metal, Derinlik: 1.8m, Sinyal: %87`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#030712', color: '#ffffff', padding: '16px' }}>
      {/* Üst Telemetri Başlığı */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#38bdf8', letterSpacing: '2px', margin: 0 }}>
          KÂŞİF ALAN TARAMA & RADAR
        </h1>
        
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '6px', fontFamily: 'monospace' }}>
          GPS: <span style={{ color: '#4ade80' }}>
            {gpsKonum ? `${gpsKonum.enlem.toFixed(4)}° N, ${gpsKonum.boylam.toFixed(4)}° E` : gpsDurum}
          </span>
          {' | '}
          PİL: <span style={{ color: '#38bdf8' }}>
            {pilYuzdesi !== null ? `%${pilYuzdesi}` : '%85'}
          </span>
          {sarjdaMi && <span style={{ color: '#22c55e' }}> ⚡</span>}
        </div>
      </div>

      {/* Hedef Bilgi Kartı */}
      <div style={{
        maxWidth: '450px',
        margin: '0 auto 16px auto',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: '12px',
        padding: '14px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#94a3b8' }}>Hedef Tipi:</span>
          <span style={{ color: '#22d3ee', fontWeight: 'bold' }}>Kıymetli Metal (Altın / Bronz)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#94a3b8' }}>Derinlik:</span>
          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>1.8 metre</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Sinyal Kararlılığı:</span>
          <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>%87</span>
        </div>
      </div>

      {/* Kâşif Asistan Modülü */}
      <KasifAssistant onAnalyzeScreen={ekranAnalizi} />
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}