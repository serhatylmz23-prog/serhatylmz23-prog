import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    deepfake: true,
    exif: true,
    topography: true,
    geology: true,
    ndvi: true
  });
  const [aiReport, setAiReport] = useState(
    "SyKaşif Derin Saha Analizi Hazır. Lütfen fotoğraf/video yükleyin veya canlı kameraya geçin."
  );

  // 1. TAM EKRAN MODU
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.log(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  };

  // 2. SESLİ ASİSTAN (Speech Synthesis)
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Önceki sesleri durdur
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Cihazınızda sesli sentez desteklenmiyor.");
    }
  };

  // 3. DERİN SAHA ANALİZİ SİMÜLASYONU
  const handleFileUpload = (e) => {
    const reportText = `
[SyKaşif Derin Saha Analiz Raporu]
• Anomali Skoru: %87 (Yüksek Olasılık)
• Jeoloji / Katman: Katmanlı tortul kaya yapısında anormallik tespit edildi.
• Botanik / NDVI: İlgili bölgedeki bitki örtüsü yoğunluğunda düzensiz yapay boşluklar var.
• Saha Önerisi: Doğu açıdan 45 derece eğimle ve UV/LiDAR filtreli ek tarama yapılması önerilir.
    `;
    setAiReport(reportText);
    speakText("Derin saha analizi tamamlandı. Anomali skoru yüzde 87. Doğu açıdan 45 derece eğimle ek tarama yapılması önerilir.");
  };

  return (
    <div className="app-root">
      {/* HEADER & TAM EKRAN BUTONU */}
      <header className="header-bar">
        <div className="logo-section">
          <h2 style={{ margin: 0, color: '#3b82f6' }}>SyKaşif PWA v1.0</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn-fullscreen" onClick={() => speakText("SyKaşif canlı takip ve sesli yönlendirme aktif.")}>
            🔊 {isSpeaking ? "Konuşuyor..." : "Sesli Asistanı Başlat"}
          </button>
          <button className="btn-fullscreen" onClick={toggleFullScreen}>
            ⛶ {isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
          </button>
        </div>
      </header>

      {/* ANA PANEL & HARİTA */}
      <main className="main-container">
        {/* SOL PANEL: KATMANLAR */}
        <aside className="panel">
          <h3>Çapraz Katmanlar</h3>
          <label><input type="checkbox" checked={activeLayers.deepfake} onChange={() => setActiveLayers({...activeLayers, deepfake: !activeLayers.deepfake})} /> Deepfake / AI İzi Filtresi</label><br/><br/>
          <label><input type="checkbox" checked={activeLayers.exif} onChange={() => setActiveLayers({...activeLayers, exif: !activeLayers.exif})} /> EXIF & GPS Zaman Damgası</label><br/><br/>
          <label><input type="checkbox" checked={activeLayers.topography} onChange={() => setActiveLayers({...activeLayers, topography: !activeLayers.topography})} /> Topografya & Eğim Katmanı</label><br/><br/>
          <label><input type="checkbox" checked={activeLayers.geology} onChange={() => setActiveLayers({...activeLayers, geology: !activeLayers.geology})} /> Jeoloji & Kaya Yapısı</label><br/><br/>
          <label><input type="checkbox" checked={activeLayers.ndvi} onChange={() => setActiveLayers({...activeLayers, ndvi: !activeLayers.ndvi})} /> Bitki Örtüsü (NDVI)</label>
        </aside>

        {/* ORTA PANEL: HARİTA VE MEDYA YÜKLEME */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="map-view-container">
            <iframe
              title="SyKaşif Canlı Harita Katmanı"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              src="https://maps.google.com/maps?q=38.6748,39.2225&z=13&output=embed"
            ></iframe>
          </div>

          <div className="upload-zone">
            <input type="file" onChange={handleFileUpload} id="fileInput" style={{ display: 'none' }} />
            <label htmlFor="fileInput" style={{ cursor: 'pointer' }}>
              📁 <strong>Fotoğraf / Video Yükleyin (Çoklu Seçim)</strong>
              <p>Saha görselini veya anomali videosunu seçmek için tıklayın</p>
            </label>
          </div>
        </section>

        {/* SAĞ PANEL: DERİN YAPAY ZEKA RAPORU */}
        <aside className="panel">
          <h3>🤖 Derin Ajan Denetim Raporu</h3>
          <div className="agent-card" style={{ whiteSpace: 'pre-line' }}>
            {aiReport}
          </div>
          <button 
            className="btn-fullscreen" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
            onClick={() => speakText(aiReport)}
          >
            📢 Raporu Sesli Oku
          </button>
        </aside>
      </main>
    </div>
  );
}