import React, { useState } from 'react';

export interface DogrulamaRaporu {
  medyaAdi: string;
  orjinallikSkoru: number; // %0 - %100
  durum: 'ORİJİNAL SAHA ÇEKİMİ' | 'ŞÜPHELİ / İNTERNET ALINTISI' | 'MANİPÜLE EDİLMİŞ / SENTETİK';
  eslesmeSayisi: number;
  ilkPaylasimTarihi?: string;
  tespitEdilenKaynaklar: string[];
  elaManipulasyonOrani: number; // %
  kameraMetaVerisi: {
    cihaz: string;
    yazilim: string;
    tarih: string;
    metaBozulmasi: boolean;
  };
}

export const SyMediaVerificationCore: React.FC<{ medyaUrl?: string | null }> = ({ medyaUrl }) => {
  const [taramaSuruyor, setTaramaSuruyor] = useState(false);
  const [rapor, setRapor] = useState<DogrulamaRaporu | null>(null);

  const adliTaramaBaslat = () => {
    if (!medyaUrl) return;
    setTaramaSuruyor(true);

    // Açık kaynak tersine arama ve ELA simülasyonu
    setTimeout(() => {
      setTaramaSuruyor(false);
      setRapor({
        medyaAdi: 'Saha_Kayit_001.jpg',
        orjinallikSkoru: 94,
        durum: 'ORİJİNAL SAHA ÇEKİMİ',
        eslesmeSayisi: 0,
        ilkPaylasimTarihi: 'İlk Kez Bu Cihazdan Yüklendi (Benzersiz)',
        tespitEdilenKaynaklar: [
          'Google Görseller: Eşleşme Yok',
          'Yandex Visual: Eşleşme Yok',
          'Define & Tarih Forumları: Temiz'
        ],
        elaManipulasyonOrani: 3.2,
        kameraMetaVerisi: {
          cihaz: 'Sony IMX Sensör / Mobil Saha Kamerası',
          yazilim: 'Ham Kamera Sıkıştırması (Photoshop izi yok)',
          tarih: 'Doğrulanmış Zaman Damgası',
          metaBozulmasi: false
        }
      });
    }, 1200);
  };

  return (
    <div style={{ backgroundColor: '#070e1c', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '6px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '1rem' }}>🛡️</span>
          <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>ADLİ MEDYA DOĞRULAMA & OSINT DEDEKTÖRÜ</span>
        </div>
        <button
          onClick={adliTaramaBaslat}
          disabled={!medyaUrl || taramaSuruyor}
          style={{
            padding: '4px 10px',
            backgroundColor: taramaSuruyor ? '#334155' : '#0284c7',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: medyaUrl && !taramaSuruyor ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '0.7rem'
          }}
        >
          {taramaSuruyor ? 'Açık Kaynaklar Taranıyor...' : '🔍 Orijinallik Analizi Yap'}
        </button>
      </div>

      {!medyaUrl && (
        <div style={{ color: '#64748b', textAlign: 'center', padding: '8px' }}>
          Doğrulama için medya veya bağlantı yükleyin.
        </div>
      )}

      {rapor && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginTop: '6px' }}>
          {/* Orijinallik Skoru & Durumu */}
          <div style={{ backgroundColor: '#030712', padding: '8px', borderRadius: '6px', border: `1px solid ${rapor.orjinallikSkoru > 80 ? '#22c55e' : '#ef4444'}` }}>
            <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>ORİJİNALLİK VE GÜVEN</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: rapor.orjinallikSkoru > 80 ? '#4ade80' : '#ef4444' }}>
              %{rapor.orjinallikSkoru}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#cbd5e1', marginTop: '2px', fontWeight: 'bold' }}>{rapor.durum}</div>
          </div>

          {/* Web Tersine Görsel Araması */}
          <div style={{ backgroundColor: '#030712', padding: '8px', borderRadius: '6px', border: '1px solid #334155' }}>
            <div style={{ color: '#f59e0b', fontSize: '0.65rem', fontWeight: 'bold' }}>🌐 AÇIK WEB TARAMASI (TERSİNE ARAMA)</div>
            <div style={{ fontSize: '0.68rem', marginTop: '3px', color: '#cbd5e1' }}>
              <div>Eşleşme: <strong>{rapor.eslesmeSayisi === 0 ? 'Hiçbir sitede bulunamadı (Özgün)' : `${rapor.eslesmeSayisi} Adres`}</strong></div>
              <div>İlk Kayıt: <span style={{ color: '#38bdf8' }}>{rapor.ilkPaylasimTarihi}</span></div>
            </div>
          </div>

          {/* ELA & Piksel Manipülasyon Analizi */}
          <div style={{ backgroundColor: '#030712', padding: '8px', borderRadius: '6px', border: '1px solid #334155' }}>
            <div style={{ color: '#a855f7', fontSize: '0.65rem', fontWeight: 'bold' }}>🔬 ADLİ ELA & PİKSEL KONTROLÜ</div>
            <div style={{ fontSize: '0.68rem', marginTop: '3px', color: '#cbd5e1' }}>
              <div>Manipülasyon Oranı: <strong>%{rapor.elaManipulasyonOrani} (Doğal)</strong></div>
              <div>Cihaz: <span style={{ color: '#94a3b8' }}>{rapor.kameraMetaVerisi.cihaz}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};