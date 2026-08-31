import type {
  AgentContext,
  AgentFinding,
  AgentResult,
  SyAgent,
} from '../agentTypes';
import { fetchJson } from '../../services/httpService';
import {
  canRunForLocation,
  source,
} from './agentHelpers';

// SkyFi Platform API v2.0.0 OpenAPI şemasındaki gerçek ArchiveResponse
// alanları (kullanıcının kendi SkyFi hesabından indirdiği şemayla doğrulandı).
interface SkyfiArchive {
  archiveId: string;
  provider: string;
  constellation?: string;
  productType?: string;
  resolution?: string;
  captureTimestamp?: string;
  cloudCoveragePercent?: number | null;
  gsd?: number;
}

interface SkyfiProxyResponse {
  configured: boolean;
  archives?: SkyfiArchive[];
  error?: string;
  message?: string;
}

export const satelliteAgent: SyAgent = {
  id: 'uydu',
  name: 'Uydu Ajanı',
  description:
    'Esri World Imagery katman kaynağını raporlar; SKYFI_API_KEY tanımlıysa SkyFi açık veri arşivini (POST /archives) de sorgular. Otomatik görüntü yorumu yapmaz.',
  canRun: canRunForLocation,

  async run(context: AgentContext): Promise<AgentResult> {
    const startedAt = new Date().toISOString();
    const imagerySource = source(
      'esri-world-imagery',
      'Esri World Imagery basemap',
      'Esri',
      'harita',
      'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9'
    );

    const findings: AgentFinding[] = [];
    const sources = [imagerySource];

    // SkyFi sorgusu YALNIZCA backend'de SKYFI_API_KEY tanımlıysa gerçek bir
    // sonuç döndürür. Anahtar yoksa ya da SkyFi hata döndürürse, bu ajan
    // sessizce "tamamlandı" der ve YALNIZCA Esri kaynağını raporlar — asla
    // sahte bir SAR/optik bulgusu uydurmaz.
    try {
      const skyfi = await fetchJson<SkyfiProxyResponse>('/api/skyfi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: context.latitude,
          longitude: context.longitude,
          openData: true,
        }),
      });

      if (skyfi.configured && skyfi.error) {
        console.warn('SkyFi API hatası:', skyfi.error);
      } else if (skyfi.configured && Array.isArray(skyfi.archives) && skyfi.archives.length > 0) {
        const skyfiSource = source(
          `skyfi-${context.latitude}-${context.longitude}`,
          'SkyFi Uydu Arşivi (açık veri)',
          'SkyFi',
          'açık_veri',
          'https://skyfi.com'
        );
        sources.push(skyfiSource);

        // En yeni 3 çekimi bulgu olarak ekle.
        skyfi.archives
          .slice()
          .sort((a, b) => (b.captureTimestamp || '').localeCompare(a.captureTimestamp || ''))
          .slice(0, 3)
          .forEach((archive) => {
            const captureDate = archive.captureTimestamp
              ? new Date(archive.captureTimestamp).toLocaleString('tr-TR')
              : 'tarih bilinmiyor';
            const sensor = archive.constellation || archive.provider || 'bilinmeyen sensör';
            const bulut =
              typeof archive.cloudCoveragePercent === 'number'
                ? ` • Bulut örtüsü: %${archive.cloudCoveragePercent.toFixed(0)}`
                : '';
            const cozunurluk = archive.resolution ? ` • Çözünürlük: ${archive.resolution}` : '';

            findings.push({
              id: `skyfi-${archive.archiveId}`,
              agentId: 'uydu',
              title: `SkyFi arşiv görüntüsü — ${sensor} (${archive.productType || 'bilinmeyen tür'})`,
              description: `Çekim tarihi: ${captureDate}${cozunurluk}${bulut}. Sağlayıcı: ${archive.provider}.`,
              confidence: 1,
              sources: [skyfiSource],
              coordinates: { lat: context.latitude, lng: context.longitude },
            });
          });
      }
      // skyfi.configured === false ise: SKYFI_API_KEY tanımlı değil,
      // sessizce hiçbir şey eklemeden devam edilir. Bu bir hata değildir.
    } catch (error) {
      // /api/skyfi'ye ulaşılamadıysa bu da bir hata değil, yalnızca SkyFi
      // bulgusu eklenmeden devam edilir. Ana Esri raporu her durumda döner.
      console.warn('SkyFi proxy çağrısı başarısız (Esri raporu yine de dönüyor):', error);
    }

    return {
      agentId: 'uydu',
      status: 'tamamlandı',
      findings,
      sources,
      startedAt,
      completedAt: new Date().toISOString(),
    };
  },
};
