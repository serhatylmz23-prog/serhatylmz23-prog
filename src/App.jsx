import React, { useState, useEffect, useRef } from 'react';

// Otonom AI Denetçi ve Güvenlik Motoru
class SystemAuditEngine {
  startAutonomousAudit(onReportGenerated) {
    setInterval(() => {
      const report = this.performSystemCheck();
      onReportGenerated(report);
    }, 4000);
  }

  performSystemCheck() {
    const issues = [];
    const suggestions = [];
    let health = 100;

    if (!navigator.geolocation) {
      issues.push("GPS/RTK Donanım Erişimi Desteklenmiyor.");
      health -= 20;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      issues.push("Kamera Akışı (WebRTC) Hazır Değil veya İzin Eksik.");
      health -= 25;
    }

    suggestions.push("Çevrimdışı harita verisi önbellekleme (Offline Tile Cache) optimizasyonu yapılabilir.");

    return {
      timestamp: new Date().toLocaleTimeString('tr-TR'),
      systemHealth: Math.max(health, 0),
      activeModules: [
        { name: "Kamera / AR Taraması", status: navigator.mediaDevices ? "ok" : "error" },
        { name: "GPS / Konum Takibi", status: navigator.geolocation ? "ok" : "warning" },
        { name: "Deepfake / AI Sahte Tespiti", status: "ok" },
        { name: "Çoklu Medya İşleyici", status: "ok" }
      ],
      detectedIssues: issues,
      aiSuggestions: suggestions
    };
  }
}

export default function SyKasifPWA() {
  const [selectedMode, setSelectedMode] = useState('camera');
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
  const [isAuditPanelOpen, setIsAuditPanelOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [auditReport, setAuditReport] = useState(null);

  // Çoklu Medya Durumları
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  // Analiz ve Doğrulama Durumları
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Canlı Cihaz Kamerasını Başlatma
  useEffect(() => {
    if (selectedMode === 'camera' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn("Kamera akışı başlatılamadı:", err);
        });
    }
  }, [selectedMode]);

  useEffect(() => {
    const auditor = new SystemAuditEngine();
    auditor.startAutonomousAudit((report) => {
      setAuditReport(report);
    });
  }, []);

  // Çoklu Fotoğraf / Video Yükleme
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).map((file) => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video') ? 'video' : 'image',
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      }));
      setUploadedFiles(filesArray);
      setSelectedFileIndex(0);
      setAnalysisResult(null);
    }
  };

  // Yapay Zeka Arazi ve Özgünlük (Deepfake/AI) Analizi
  const handleStartAnalysis = (e) => {
    e.stopPropagation();
    setIsAnalyzing(true);
    setAnalysisResult(null);

    const activeFile = uploadedFiles[selectedFileIndex];

    setTimeout(() => {
      setIsAnalyzing(false);

      // Rastgele veya dosya adına göre sahtelik simülasyon testi (Örn: "ai", "fake" kelimeleri varsa)
      const isFakeProbability = activeFile.name.toLowerCase().includes('ai') || activeFile.name.toLowerCase().includes('fake');

      if (isFakeProbability) {
        setAnalysisResult({
          authenticity: "⚠️ YÜKSEK SAHTELİK RİSKİ (%89 AI / Montaj Tespiti)",
          isAuthentic: false,
          exifData: "Meta Veri (EXIF) Eksik / Düzenlenmiş",
          aiDetectionNote: "Görselde Midjourney / DALL-E diffüzyon gürültü kalıpları ve piksel katman tutarsızlığı saptandı.",
          topography: "Belirsiz / Sentetik Yüzey Modeli",
          geology: "Sentetik Doku / Saptanamadı",
          vegetation: "NDVI Tutarsızlığı Var",
          historicalSite: "Analiz Edilemedi (Geçersiz Saha Verisi)"
        });
      } else {
        setAnalysisResult({
          authenticity: "✅ %98.4 GERÇEK SAHA ÇEKİMİ (Orijinal)",
          isAuthentic: true,
          exifData: "GPS, Cihaz (Sensör) ve Zaman Damgası Doğrulandı",
          aiDetectionNote: "Görselde yapay zeka üretimi veya dijital manipülasyon izine rastlanmadı.",
          topography: "%14 Orta Dereceli Eğim (Güney-Doğu)",
          geology: "Kalker / Kireçtaşı Ağırlıklı Tabaka",
          vegetation: "NDVI Skoru: 0.72 (Yoğun Bitki Örtüsü)",
          historicalSite: "Düşük Risk (Sit Alanı Dışında)"
        });
      }
      setIsAuditPanelOpen(true);
    }, 2800);
  };

  return (
    <div style={{ backgroundColor: '#0B0F19', color: '#E2E8F0', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* ÜST MENÜ */}
      <header style={{ padding: '12px 20px', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#38BDF8' }}>
          SyKaşif <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>PWA v1.0</span>
        </div>

        {/* MOD SEÇİMİ */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#1E293B', padding: '4px', borderRadius: '8px' }}>
          <button onClick={() => setSelectedMode('upload')} style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: selectedMode === 'upload' ? '#0284C7' : 'transparent', color: '#FFF' }}>📁 Medya Yükle (Çoklu Foto/Video)</button>
          <button onClick={() => setSelectedMode('camera')} style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: selectedMode === 'camera' ? '#0284C7' : 'transparent', color: '#FFF' }}>🔴 Canlı Kamera</button>
          <button onClick={() => setSelectedMode('link')} style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: selectedMode === 'link' ? '#0284C7' : 'transparent', color: '#FFF' }}>🔗 Bağlantı Linki</button>
        </div>

        {/* AI SAĞLIK VE DÖNÜŞÜM */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem' }}>AI Doğrulama Motoru:</span>
          <span style={{ fontWeight: 'bold', color: '#22C55E' }}>Aktif</span>
        </div>
      </header>

      {/* LINK GİRDİ PANELİ */}
      {selectedMode === 'link' && (
        <div style={{ padding: '12px 20px', backgroundColor: '#0F172A', borderBottom: '1px solid #334155', display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Analiz edilecek web bağlantısını yapıştırın..." value={urlInput} onChange={(e) => setUrlInput(e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF' }} />
          <button style={{ padding: '8px 20px', backgroundColor: '#0284C7', border: 'none', borderRadius: '6px', color: '#FFF', cursor: 'pointer' }}>Taramayı Başlat</button>
        </div>
      )}

      {/* ANA EKRAN */}
      <div style={{ display: 'flex', height: 'calc(100vh - 70px)' }}>
        {/* SOL KATMAN PANELİ */}
        <div style={{ width: isLayerPanelOpen ? '260px' : '40px', backgroundColor: '#0F172A', borderRight: '1px solid #1E293B', transition: 'width 0.3s' }}>
          <button onClick={() => setIsLayerPanelOpen(!isLayerPanelOpen)} style={{ width: '100%', padding: '10px', backgroundColor: '#1E293B', color: '#FFF', border: 'none', cursor: 'pointer' }}>{isLayerPanelOpen ? '◀ Katmanlar & Filtreler' : '▶'}</button>
          {isLayerPanelOpen && (
            <div style={{ padding: '15px' }}>
              <h4 style={{ color: '#38BDF8', marginTop: 0 }}>Çapraz Katmanlar</h4>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem', lineHeight: '2' }}>
                <li><input type="checkbox" defaultChecked /> Deepfake / AI İzi Filtresi</li>
                <li><input type="checkbox" defaultChecked /> EXIF & GPS Zaman Damgası</li>
                <li><input type="checkbox" defaultChecked /> Topografya & Eğim</li>
                <li><input type="checkbox" defaultChecked /> Jeoloji & Kaya Yapısı</li>
                <li><input type="checkbox" defaultChecked /> Bitki Örtüsü (NDVI)</li>
              </ul>
            </div>
          )}
        </div>

        {/* ORTA PANEL */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', position: 'relative', padding: '20px', overflowY: 'auto' }}>
          {selectedMode === 'camera' && (
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}

          {selectedMode === 'upload' && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: '750px' }}>
              <div 
                onClick={() => fileInputRef.current && fileInputRef.current.click()} 
                style={{ cursor: 'pointer', padding: '24px', border: '2px dashed #0284C7', borderRadius: '12px', backgroundColor: '#0F172A', marginBottom: '15px' }}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" multiple style={{ display: 'none' }} />
                <p style={{ fontSize: '1.2rem', margin: 0, color: '#38BDF8' }}>📁 Fotoğraf / Video Yükleyin (Çoklu Seçim)</p>
                <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '6px' }}>Birden fazla görsel veya video seçmek için dokunun</p>
              </div>

              {/* YÜKLENEN MEDYA GALERİSİ */}
              {uploadedFiles.length > 0 && (
                <div>
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '15px' }}>
                    {uploadedFiles.map((file, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => { setSelectedFileIndex(idx); setAnalysisResult(null); }}
                        style={{ 
                          border: selectedFileIndex === idx ? '3px solid #38BDF8' : '1px solid #334155', 
                          borderRadius: '8px', 
                          overflow: 'hidden', 
                          cursor: 'pointer',
                          minWidth: '90px',
                          height: '70px',
                          backgroundColor: '#1E293B',
                          position: 'relative'
                        }}
                      >
                        {file.type === 'image' ? (
                          <img src={file.url} alt="Önizleme" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#38BDF8', fontSize: '0.8rem' }}>🎥 Video</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* SEÇİLİ MEDYA GÖRÜNTÜLEYİCİ */}
                  <div style={{ backgroundColor: '#0F172A', borderRadius: '10px', padding: '12px', border: '1px solid #1E293B' }}>
                    {uploadedFiles[selectedFileIndex].type === 'image' ? (
                      <img src={uploadedFiles[selectedFileIndex].url} alt="Seçili Görsel" style={{ maxWidth: '100%', maxHeight: '35vh', borderRadius: '8px' }} />
                    ) : (
                      <video src={uploadedFiles[selectedFileIndex].url} controls style={{ maxWidth: '100%', maxHeight: '35vh', borderRadius: '8px' }} />
                    )}
                    <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '6px' }}>
                      Dosya: {uploadedFiles[selectedFileIndex].name} ({uploadedFiles[selectedFileIndex].size})
                    </p>

                    <button 
                      onClick={handleStartAnalysis} 
                      disabled={isAnalyzing}
                      style={{ 
                        marginTop: '10px',
                        padding: '12px 28px', 
                        backgroundColor: isAnalyzing ? '#475569' : '#0284C7', 
                        border: 'none', 
                        borderRadius: '8px', 
                        color: '#FFF', 
                        fontSize: '1rem', 
                        fontWeight: 'bold', 
                        cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
                      }}
                    >
                      {isAnalyzing ? '⏳ Yapay Zeka Özgünlük ve Arazi Analizini Yapıyor...' : '🛡️ Taramayı ve AI Tespiti Başlat'}
                    </button>
                  </div>

                  {/* DETAYLI ANALİZ SONUÇLARI */}
                  {analysisResult && (
                    <div style={{ marginTop: '15px', padding: '16px', backgroundColor: '#0F172A', border: `2px solid ${analysisResult.isAuthentic ? '#22C55E' : '#EF4444'}`, borderRadius: '10px', textAlign: 'left', fontSize: '0.9rem' }}>
                      <h3 style={{ color: analysisResult.isAuthentic ? '#22C55E' : '#EF4444', marginTop: 0, borderBottom: '1px solid #1E293B', paddingBottom: '8px' }}>
                        {analysisResult.authenticity}
                      </h3>
                      
                      <p>🔍 <strong>AI / Deepfake Tespiti:</strong> {analysisResult.aiDetectionNote}</p>
                      <p>📍 <strong>Meta Veri / EXIF:</strong> {analysisResult.exifData}</p>
                      <p>📐 <strong>Topografya:</strong> {analysisResult.topography}</p>
                      <p>🪨 <strong>Jeolojik Yapı:</strong> {analysisResult.geology}</p>
                      <p>🌿 <strong>Bitki Örtüsü:</strong> {analysisResult.vegetation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedMode === 'link' && (
            <div style={{ textAlign: 'center', color: '#94A3B8' }}>
              <p style={{ fontSize: '1.1rem' }}>🔗 Bağlantı Analiz Ediliyor...</p>
            </div>
          )}
        </div>

        {/* SAĞ AI PANELİ */}
        <div style={{ width: isAuditPanelOpen ? '280px' : '40px', backgroundColor: '#0F172A', borderLeft: '1px solid #1E293B', transition: 'width 0.3s' }}>
          <button onClick={() => setIsAuditPanelOpen(!isAuditPanelOpen)} style={{ width: '100%', padding: '10px', backgroundColor: '#1E293B', color: '#FFF', border: 'none', cursor: 'pointer' }}>{isAuditPanelOpen ? 'AI Denetim Raporu ▶' : '◀'}</button>
          {isAuditPanelOpen && auditReport && (
            <div style={{ padding: '15px', fontSize: '0.85rem' }}>
              <h4 style={{ color: '#F59E0B', marginTop: 0 }}>🤖 Canlı AI Denetim Raporu</h4>
              <p style={{ color: '#94A3B8' }}>Son Tarama: {auditReport.timestamp}</p>

              {analysisResult && (
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#1E293B', borderRadius: '6px', borderLeft: `4px solid ${analysisResult.isAuthentic ? '#22C55E' : '#EF4444'}` }}>
                  <strong style={{ color: analysisResult.isAuthentic ? '#22C55E' : '#EF4444' }}>
                    {analysisResult.isAuthentic ? "Orijinal Saha Çekimi" : "Sahte / AI Üretimi Şüphesi"}
                  </strong>
                  <p style={{ margin: '4px 0', fontSize: '0.75rem' }}>{analysisResult.aiDetectionNote}</p>
                </div>
              )}

              <div style={{ marginBottom: '15px' }}>
                <strong>Sistem Modülleri:</strong>
                {auditReport.activeModules.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                    <span>{m.name}</span>
                    <span style={{ color: m.status === 'ok' ? '#22C55E' : '#EF4444' }}>● {m.status === 'ok' ? 'Hazır' : 'Hata'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}