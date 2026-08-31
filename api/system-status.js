// api/system-status.js
//
// Amaç: SyMasterCore / SySistemDurumu panelinin "hangi sağlayıcı gerçekten
// yapılandırılmış" sorusuna DÜRÜST cevap verebilmesi. Hiçbir anahtar DEĞERİ
// döndürülmez — yalnızca "var/yok" (boolean) bilgisi. Bu sayede arayüzde
// artık "AKTİF TARAMA %98,4" gibi uydurma rozetler yerine gerçek durum
// gösterilir.
//
// Vercel/Next tarzı edge fonksiyonu olarak tasarlandı; api/chat.ts ve
// api/speech-token.ts ile aynı desen izlenir.

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

function isAllowedOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  if (origin === new URL(request.url).origin) return true;
  const configured = (process.env.APP_ORIGIN || '')
    .split(',')
    .map((item) => item.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (configured.includes(origin)) return true;
  return (
    process.env.NODE_ENV !== 'production' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  );
}

function json(request, body, status = 200) {
  const headers = { ...JSON_HEADERS, Vary: 'Origin' };
  const origin = request.headers.get('Origin');
  if (origin && isAllowedOrigin(request)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return new Response(JSON.stringify(body), { status, headers });
}

// Cloudflare tarafı hem CLOUDFLARE_AI_TOKEN hem de CLOUDFLARE_API_TOKEN adını
// kabul eder (bkz. api/cloudflare-ai.js — cloudflareApiToken()).
function hasCloudflare() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_AI_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
  return Boolean(accountId && token && /^[a-f\d]{32}$/i.test(accountId));
}

function hasAzureSpeech() {
  return Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
}

function hasAzureMaps() {
  return Boolean(process.env.AZURE_MAPS_KEY);
}

function hasAzureOpenAI() {
  return Boolean(
    process.env.AZURE_OPENAI_KEY &&
      process.env.AZURE_OPENAI_ENDPOINT &&
      process.env.AZURE_OPENAI_DEPLOYMENT
  );
}

function hasGemini() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function hasAbacus() {
  return Boolean(process.env.ABACUS_API_KEY);
}

function hasSkyfi() {
  return Boolean(process.env.SKYFI_API_KEY);
}

function hasVercelDeploy() {
  return Boolean(
    process.env.VERCEL_TOKEN && process.env.VERCEL_ORG_ID && process.env.VERCEL_PROJECT_ID
  );
}

export async function handleSystemStatus(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...JSON_HEADERS,
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  if (!isAllowedOrigin(request)) {
    return json(request, { error: 'Bu origin için erişim izni yok.' }, 403);
  }

  // Metin/görsel AI için hangi sağlayıcının fiilen kullanılacağı
  // (cloudflare-ai.js#detectProvider ile birebir aynı öncelik sırası).
  const textProvider = hasCloudflare()
    ? 'cloudflare'
    : hasGemini()
      ? 'gemini'
      : process.env.OLLAMA_BASE_URL || process.env.OLLAMA_ENABLED === 'true'
        ? 'ollama'
        : 'offline';

  const providers = [
    {
      id: 'cloudflare',
      ad: 'Cloudflare Workers AI (metin + görsel)',
      yapilandirildi: hasCloudflare(),
      not: hasCloudflare()
        ? 'Aktif metin/görsel sağlayıcı.'
        : 'CLOUDFLARE_ACCOUNT_ID ve CLOUDFLARE_API_TOKEN tanımlı değil.',
    },
    {
      id: 'gemini',
      ad: 'Google Gemini (ücretsiz katman, yedek sağlayıcı)',
      yapilandirildi: hasGemini(),
      not: hasGemini()
        ? textProvider === 'gemini'
          ? 'Cloudflare yapılandırılmadığı için aktif sağlayıcı.'
          : 'Yapılandırıldı, ancak Cloudflare önceliği nedeniyle yedek konumda.'
        : 'GEMINI_API_KEY tanımlı değil.',
    },
    {
      id: 'azureSpeech',
      ad: 'Azure Speech (Kâşif Asistanı sesli giriş/çıkış)',
      yapilandirildi: hasAzureSpeech(),
      not: hasAzureSpeech()
        ? 'Sesli asistan Azure ses motorunu kullanıyor.'
        : 'Tanımlı değil — asistan otomatik olarak tarayıcı ses motoruna düşer (bu bir hata değildir).',
    },
    {
      id: 'azureMaps',
      ad: 'Azure Maps',
      yapilandirildi: hasAzureMaps(),
      not: hasAzureMaps()
        ? 'Yapılandırıldı, ancak şu an hiçbir bileşen bu anahtarı kullanmıyor (bkz. yol haritası).'
        : 'AZURE_MAPS_KEY tanımlı değil ve şu an kodda kullanılmıyor.',
    },
    {
      id: 'azureOpenAI',
      ad: 'Azure OpenAI',
      yapilandirildi: hasAzureOpenAI(),
      not: hasAzureOpenAI()
        ? 'Yapılandırıldı, ancak şu an hiçbir bileşen bu anahtarı kullanmıyor (bkz. yol haritası).'
        : 'AZURE_OPENAI_KEY/ENDPOINT/DEPLOYMENT eksik ve şu an kodda kullanılmıyor.',
    },
    {
      id: 'abacus',
      ad: 'Abacus AI',
      yapilandirildi: hasAbacus(),
      not: hasAbacus()
        ? 'Yapılandırıldı, ancak şu an hiçbir bileşen bu anahtarı kullanmıyor (bkz. yol haritası).'
        : 'ABACUS_API_KEY tanımlı değil ve şu an kodda kullanılmıyor.',
    },
    {
      id: 'skyfi',
      ad: 'SkyFi Uydu Arşivi (SAR/optik)',
      yapilandirildi: hasSkyfi(),
      not: hasSkyfi()
        ? 'Uydu ajanı SkyFi açık veri arşivini de sorguluyor (şema doğrulaması gerekebilir, bkz. api/skyfi.js).'
        : 'SKYFI_API_KEY tanımlı değil. Uydu ajanı yalnızca Esri katman kaynağını raporlar.',
    },
    {
      id: 'vercelDeploy',
      ad: 'Vercel Dağıtım Otomasyonu',
      yapilandirildi: hasVercelDeploy(),
      not: hasVercelDeploy()
        ? 'CI/CD dağıtım anahtarları tanımlı.'
        : 'VERCEL_TOKEN/ORG_ID/PROJECT_ID eksik — bu bir çalışma zamanı AI özelliği değil, dağıtım otomasyonudur.',
    },
  ];

  return json(request, {
    generatedAt: new Date().toISOString(),
    aktifMetinSaglayici: textProvider,
    providers,
  });
}
