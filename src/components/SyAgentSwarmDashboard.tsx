import React from 'react';

export interface AgentStatus {
  id: string;
  ad: string;
  uzmanlik: string;
  kaynaklar: string[];
  tarananVeriAdedi: number;
  dogrulukKatsayisi: number;
  sonGuncelleme: string;
  ogrenmeDurumu: 'AKTİF TARAMA' | 'SENKRONİZE' | 'MODEL GÜNCELLENDİ';
}

const AJAN_LISTESI: AgentStatus[] = [
  {
    id: 'AGT-01',
    ad: 'ASTRO-ARKEO & GEOMETRİ',
    uzmanlik: 'Giza/Orion Hizalaması, Murç/Kanal Açıları, Ekinoks Yönelimleri',
    kaynaklar: ['NASA SkyMap', 'Antik Takvimler', 'Arkeometri Tezler'],
    tarananVeriAdedi: 14280,
    dogrulukKatsayisi: 98.4,
    sonGuncelleme: 'Anlık Açık Kaynak Taraması',
    ogrenmeDurumu: 'AKTİF TARAMA'
  },
  {
    id: 'AGT-02',
    ad: 'JEOLOJİ & MTA DEDEKTÖRÜ',
    uzmanlik: 'Doğal Aşınma / İnsan İzi Ayrımı, Doku Morfolojisi, Kayaç Analizi',
    kaynaklar: ['MTA Jeoloji Haritaları', 'Kayaç Veritabanı', 'Yüzey Pürüzlülük İndeksi'],
    tarananVeriAdedi: 28940,
    dogrulukKatsayisi: 97.1,
    sonGuncelleme: 'MTA Katmanları Entegre',
    ogrenmeDurumu: 'SENKRONİZE'
  },
  {
    id: 'AGT-03',
    ad: 'NÜMİSMATİK & MÜZE ARŞİVCİSİ',
    uzmanlik: 'Sikke, Lahit, Heykel, Runik/Frig Yazıt ve Medeniyet Tipolojisi',
    kaynaklar: ['Müze Envanterleri', 'Nümismatik Online Portalları', 'Akademik Kataloglar'],
    tarananVeriAdedi: 54100,
    dogrulukKatsayisi: 99.2,
    sonGuncelleme: 'Geç Hitit & Roma Arşivi',
    ogrenmeDurumu: 'MODEL GÜNCELLENDİ'
  },
  {
    id: 'AGT-04',
    ad: 'OSINT & SAHA KOLEKTİF ZEKA',
    uzmanlik: 'Define Forumları, YouTube Arazi Videoları, Yerel Efsaneler & İşaret Yorumları',
    kaynaklar: ['Saha Forumları', 'YouTube Kanal Analizleri', 'Sosyal Medya Paylaşımları'],
    tarananVeriAdedi: 89320,
    dogrulukKatsayisi: 92.8,
    sonGuncelleme: 'Saha Tartışma Havuzu',
    ogrenmeDurumu: 'AKTİF TARAMA'
  },
  {
    id: 'AGT-05',
    ad: 'BOTANİK & ETNOBOTANİK',
    uzmanlik: 'Flora Tespiti, Şifalı Tarifler, Toprak Mineral İndikatör Bitkileri',
    kaynaklar: ['Türkiye Florası', 'Fitoterapi Makaleleri', 'Toprak pH Göstergeleri'],
    tarananVeriAdedi: 19450,
    dogrulukKatsayisi: 96.5,
    sonGuncelleme: 'Tıbbi Reçete Veritabanı',
    ogrenmeDurumu: 'MODEL GÜNCELLENDİ'
  }
];

export const SyAgentSwarmDashboard: React.FC = () => {
  return (
    <div style={{
      backgroundColor: '#030712',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      borderRadius: '12px',
      padding: '16px',
      color: '#fff',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#38bdf8', letterSpacing: '0.08em' }}>
            🛰️ SyKaşif ÇOKLU AJAN & AÇIK KAYNAK İSTİHBARAT AĞI (SWARM)
          </h2>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            MTA, AKADEMİK TEZLER, NÜMİSMATİK, YOUTUBE & DEFİNE FORUMLARININ ÇAPRAZ GELİŞİM MERKEZİ
          </span>
        </div>
        <div style={{ padding: '4px 10px', backgroundColor: '#0f291e', border: '1px solid #22c55e', borderRadius: '20px', color: '#4ade80', fontSize: '0.72rem', fontWeight: 'bold' }}>
          DEMO VERİ SETİ • CANLI DEĞİL
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        {AJAN_LISTESI.map((agent) => (
          <div key={agent.id} style={{ backgroundColor: '#070e1b', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#f59e0b' }}>{agent.ad}</span>
                <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: agent.ogrenmeDurumu === 'AKTİF TARAMA' ? '#1e3a8a' : '#14532d', color: '#fff' }}>
                  {agent.ogrenmeDurumu}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '8px' }}>{agent.uzmanlik}</div>
              <div style={{ fontSize: '0.68rem', color: '#cbd5e1' }}><strong>Kaynaklar:</strong> {agent.kaynaklar.join(', ')}</div>
            </div>

            <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.62rem', color: '#64748b' }}>TARANAN VERİ</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#38bdf8' }}>{agent.tarananVeriAdedi.toLocaleString()} Kayıt</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748b' }}>GÜVEN SKORU</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#4ade80' }}>%{agent.dogrulukKatsayisi}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};