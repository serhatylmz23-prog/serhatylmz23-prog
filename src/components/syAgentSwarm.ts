export interface AgentReport {
  agentName: string;
  focusArea: string;
  findings: string;
  confidenceScore: number;
  sources: string[];
}

export interface SwarmAnalysisResult {
  isManMade: boolean | null;
  astronomicalAlignment?: string;
  historicalPeriod?: string;
  geologicalContext: string;
  collectiveWisdomMatch: string;
  finalVerdict: string;
  sealHash: string;
}

const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1_600;

function readBlobAsDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Medya okunamadı.'));
    reader.onerror = () => reject(new Error('Medya okunamadı.'));
    reader.readAsDataURL(blob);
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', 0.86);
}

async function imageBlobToDataUri(blob: Blob): Promise<string> {
  if (
    blob.size <= 2_500_000 &&
    ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(blob.type)
  ) {
    return readBlobAsDataUri(blob);
  }

  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height)
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Görsel dönüştürme başlatılamadı.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvasToJpeg(canvas);
  } finally {
    bitmap.close();
  }
}

async function videoBlobToFrame(blob: Blob): Promise<string> {
  const objectUrl = URL.createObjectURL(blob);
  const video = document.createElement('video');
  video.muted = true;
  video.preload = 'auto';
  video.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('Video karesi okunamadı.'));
      video.load();
    });

    if (Number.isFinite(video.duration) && video.duration > 0.2) {
      const target = Math.min(1, video.duration / 2);
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error('Video karesine erişilemedi.'));
        video.currentTime = target;
      });
    }

    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION /
        Math.max(video.videoWidth, video.videoHeight)
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Video karesi dönüştürülemedi.');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvasToJpeg(canvas);
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}

async function mediaUrlToImageDataUri(url: string): Promise<string> {
  if (/^rtsp:/i.test(url) || /(?:youtube\.com|youtu\.be)/i.test(url)) {
    throw new Error(
      'RTSP ve YouTube sayfaları doğrudan analiz edilemez. Yerel bir görsel/video dosyası veya CORS izinli doğrudan medya URL’si kullanın.'
    );
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Medya indirilemedi (HTTP ${response.status}).`);
  }

  const blob = await response.blob();
  if (blob.size === 0) throw new Error('Medya dosyası boş.');
  if (blob.size > MAX_MEDIA_BYTES) {
    throw new Error('Medya boyutu en fazla 25 MB olabilir.');
  }

  if (blob.type.startsWith('image/')) {
    return imageBlobToDataUri(blob);
  }
  if (blob.type.startsWith('video/')) {
    return videoBlobToFrame(blob);
  }

  throw new Error(
    `Desteklenmeyen medya türü: ${blob.type || 'bilinmiyor'}.`
  );
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function inferManMade(text: string): boolean | null {
  const normalized = text.toLocaleLowerCase('tr-TR');
  const artificial = [
    'insan yapımı',
    'insan müdahalesi',
    'yapay iz',
    'oyulmuş',
    'man-made',
    'carved',
  ];
  const natural = [
    'doğal oluşum',
    'doğal erozyon',
    'natural formation',
    'natural erosion',
  ];

  if (artificial.some((phrase) => normalized.includes(phrase))) return true;
  if (natural.some((phrase) => normalized.includes(phrase))) return false;
  return null;
}

export const runSyKasifSwarm = async (
  mediaUrl: string,
  gpsCoords?: { lat: number; lng: number }
): Promise<SwarmAnalysisResult> => {
  const prompt = `Bu görseli yalnızca görünür piksellere dayanarak Türkçe analiz et.
- Gözlenen nesne, yüzey, yazı ve olası insan müdahalesini ayrı ayrı belirt.
- Görselden doğrulanamayacak dönem, astronomik hizalama, yer altı yapısı veya kaynak taraması iddiasında bulunma.
- Belirsizliği açıkça yaz; tıbbi, adli veya arkeolojik kesin hüküm verme.
Koordinat: ${gpsCoords ? `${gpsCoords.lat}, ${gpsCoords.lng}` : 'Sağlanmadı'}`;

  const imageBase64 = await mediaUrlToImageDataUri(mediaUrl);
  const response = await fetch('/api/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, imageBase64 }),
  });
  const data = (await response.json().catch(() => null)) as
    | { response?: string; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.error || `Vision servisi HTTP ${response.status} döndürdü.`);
  }

  const finalVerdict = data?.response?.trim();
  if (!finalVerdict) throw new Error('Vision servisi boş yanıt döndürdü.');

  return {
    isManMade: inferManMade(finalVerdict),
    geologicalContext:
      'Yalnızca görsel model çıktısı üretildi; jeoloji veri tabanı sorgulanmadı.',
    collectiveWisdomMatch:
      'Harici web, forum, müze veya akademik kaynak taraması yapılmadı.',
    finalVerdict,
    sealHash: `SHA256-${await sha256(finalVerdict)}`,
  };
};
