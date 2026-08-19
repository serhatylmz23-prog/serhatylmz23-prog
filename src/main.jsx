import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { KasifAssistant } from './kasif_asistan';
import { SyEcosystemDashboard } from './data/SyEcosystemDashboard';

export function App() {
  const [pilYuzdesi, setPilYuzdesi] = useState(null);
  const [sarjdaMi, setSarjdaMi] = useState(false);
  const [gpsKonum, setGpsKonum] = useState(null);
  const [gpsDurum, setGpsDurum] = useState('GPS Aranıyor...');

  useEffect(() => {
    // Pil durumu izleme
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        setPilYuzdesi(Math.round(battery.level * 100));
        setSarjdaMi(battery.charging);
        battery.onlevelchange = () => setPilYuzdesi(Math.round(battery.level * 100));
        battery.onchargingchange = () => setSarjdaMi(battery.charging);
      });
    }

    // GPS konumu izleme
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (pos) => {
          setGpsKonum({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsDurum('GPS Kilitli');
        },
        () => setGpsDurum('GPS Alınamadı'),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#020617',
      padding: '16px',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* 1. Sesli Ajan Komuta Merkezi */}
      <KasifAssistant />

      {/* 2. Dinamik İkon ve Telemetri Ekosistemi */}
      <SyEcosystemDashboard />
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}