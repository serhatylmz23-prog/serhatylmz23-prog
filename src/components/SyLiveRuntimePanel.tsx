import React, { useState } from 'react';

interface LayerGroup {
  title: string;
  items: { id: string; label: string; active: boolean; icon?: string }[];
}

// NOT: Bu dosya Tailwind CSS class'ları (className="flex bg-..." vb.) ile
// yazılmıştı, ama bu projede Tailwind hiç kurulu değil (package.json'da
// tailwindcss yok, tailwind.config.js yok). Bu yüzden bütün class'lar
// tarayıcı tarafından sessizce yok sayılıyor ve panel biçimsiz/karışık
// görünüyordu. Aşağıda projenin geri kalanıyla tutarlı olacak şekilde
// inline style kullanıldı.

const renk = {
  bg: '#0f172a',
  panel: '#1e293b',
  border: 'rgba(148, 163, 184, 0.15)',
  cyan: '#38bdf8',
  green: '#4ade80',
  red: '#f87171',
  amber: '#fbbf24',
  textMuted: '#94a3b8',
};

const KATMAN_GRUPLARI: LayerGroup[] = [
  {
    title: 'HARİTA TEMEL KATMANLARI',
    items: [
      { id: 'topo', label: 'Topografya & Yükseklik', active: true },
      { id: 'geology', label: 'Jeolojik Katmanlar & Faylar', active: true },
      { id: 'hydro', label: 'Hidrografya (Su/Akarsu)', active: false },
      { id: 'flora', label: 'Bitki Örtüsü / NDVI', active: false },
      { id: 'satellite', label: 'Yüksek Çözünürlüklü Uydu', active: true },
      { id: 'transport', label: 'Ulaşım & Yol Ağları', active: false },
    ],
  },
  {
    title: 'JEOLOJİ & YERALTI ANALİZİ',
    items: [
      { id: 'gpr', label: 'GPR (Yeraltı Radarı)', active: false },
      { id: 'ert', label: 'Elektrik Direnç (ERT)', active: false },
      { id: 'mag', label: 'Manyetik & Gravite Anomalisi', active: false },
      { id: 'seismic', label: 'Sismik Hareketlilik (USGS)', active: true },
      { id: 'thermal', label: 'Termal & Spektral Anomali', active: false },
      { id: 'cavity', label: 'Boşluk & Yeraltı Yapıları', active: false },
    ],
  },
  {
    title: 'TARİH & ARKEOLOJİ KATMANI',
    items: [
      { id: 'settlements', label: 'Antik Yerleşimler & Höyükler', active: true },
      { id: 'tumulus', label: 'Tümülüs & Kaya Mezarları', active: false },
      { id: 'roads', label: 'Tarihi Yol Ağları', active: false },
      { id: 'excavation', label: 'Kazı Alanları & Buluntular', active: false },
    ],
  },
  {
    title: 'CİHAZ VE SENSÖR EKOSİSTEMİ',
    items: [
      { id: 'gps_rtk', label: 'GPS / RTK Santimetre Hassasiyet', active: false },
      { id: 'drone', label: 'Mikro Drone Telemetrisi', active: false },
      { id: 'snake_cam', label: 'Yılan Kamera (Wi-Fi/BT)', active: false },
    ],
  },
];

export const SyLiveRuntimePanel: React.FC = () => {
  const [layers, setLayers] = useState<LayerGroup[]>(KATMAN_GRUPLARI);

  const toggleLayer = (groupIndex: number, itemIndex: number) => {
    const updated = layers.map((g, gi) =>
      gi !== groupIndex
        ? g
        : {
            ...g,
            items: g.items.map((it, ii) =>
              ii !== itemIndex ? it : { ...it, active: !it.active },
            ),
          },
    );
    setLayers(updated);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: renk.bg,
        color: '#e2e8f0',
        padding: '12px',
        gap: '12px',
        overflowY: 'auto',
        fontSize: '0.75rem',
        fontFamily: 'inherit',
      }}
    >
      {/* Panel amacı — dürüst açıklama */}
      <div
        style={{
          fontSize: '0.62rem',
          color: renk.textMuted,
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          border: `1px solid ${renk.border}`,
          borderRadius: '6px',
          padding: '6px 8px',
        }}
      >
        Bu panel bir katman <strong>düzenleme taslağıdır</strong> — kutucuklar
        yalnızca görsel bir işaretleme yapar, haritadaki gerçek veriye henüz
        bağlı değildir. Gerçek tarama için "Harita & Ajanlar" sekmesindeki
        "Gerçek Tarama" düğmesini kullan.
      </div>

      {/* Dinamik Katman Ağacı */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {layers.map((group, gIdx) => (
          <div
            key={group.title}
            style={{
              backgroundColor: renk.panel,
              border: `1px solid ${renk.border}`,
              borderRadius: '8px',
              padding: '8px 10px',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: renk.cyan,
                fontSize: '0.68rem',
                letterSpacing: '0.03em',
                borderBottom: `1px solid ${renk.border}`,
                paddingBottom: '6px',
                marginBottom: '6px',
              }}
            >
              {group.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {group.items.map((item, iIdx) => (
                <label
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 6px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.active}
                    onChange={() => toggleLayer(gIdx, iIdx)}
                    style={{ accentColor: renk.cyan, cursor: 'pointer' }}
                  />
                  <span
                    style={{
                      color: item.active ? '#f1f5f9' : renk.textMuted,
                      fontWeight: item.active ? 600 : 400,
                    }}
                  >
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};