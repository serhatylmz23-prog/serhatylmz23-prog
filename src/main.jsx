import React from 'react';
import ReactDOM from 'react-dom/client';
import { SyAppShell } from './components/SyAppShell';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SyAppShell />
  </React.StrictMode>
);

// Service worker'ı yalnızca production build'de kaydet. Geliştirme sırasında
// (npm run dev / vercel dev) kaydedilirse, Vite'ın anlık modül yenilemesiyle
// çakışıp eski dosyaları önbellekten göstermeye devam edebilir ve "hiçbir şey
// değişmiyor" izlenimi verebilir.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/publicsw.js').catch((err) => {
      console.error('Service worker kaydı başarısız:', err);
    });
  });
}