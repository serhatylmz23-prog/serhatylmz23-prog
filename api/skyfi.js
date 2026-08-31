// api/skyfi.js
//
// SkyFi (skyfi.com), 300+ uydu/hava kaynağından optik + SAR (Synthetic
// Aperture Radar) görüntüsü arayan bir "Satellite-as-a-Service" API'sidir.
// SAR verisi bulutlu havada / gece bile çalıştığı için, define/arkeoloji
// taramasında Esri'nin yalnızca optik basemap'inin veremediği bir bilgi
// sağlar: "bu bölge için en son ne zaman ve hangi sensörle görüntü çekildi".
//
// Bu dosya, kullanıcının SkyFi hesabından indirdiği GERÇEK OpenAPI şemasına
// (SkyFi Platform API v2.0.0) göre yazıldı — artık bir tahmin değil:
//   - Uç nokta: POST /archives  (GET /archives yalnızca sayfalama içindir)
//   - Kimlik doğrulama: header adı tam olarak "X-Skyfi-Api-Key"
//   - AOI alanı GeoJSON DEĞİL, bir WKT (Well-Known Text) POLYGON string'i
//   - Yanıt: { request, archives: ArchiveResponse[], nextPage, total }
//   - Her archive: archiveId, provider, constellation, productType,
//     resolution, captureTimestamp, cloudCoveragePercent, footprint, gsd...

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const SKYFI_BASE_URL =
  process.env.SKYFI_API_URL || 'https://app.skyfi.com/platform-api';

function isAllowedOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  if (origin === new URL(request.url).origin) return true;
  if (
    process.env.NODE_ENV !== 'production' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  ) {
    return true;
  }
  const configured = (process.env.APP_ORIGIN || '')
    .split(',')
    .map((item) => item.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return configured.includes(origin);
}

function json(request, body, status = 200) {
  const headers = { ...JSON_HEADERS, Vary: 'Origin' };
  const origin = request.headers.get('Origin');
  if (origin && isAllowedOrigin(request)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return new Response(JSON.stringify(body), { status, headers });
}

// Merkez nokta etrafında küçük bir kare AOI'yi WKT POLYGON string'ine çevirir.
// SkyFi şeması `aoi` alanının GeoJSON değil, WKT olmasını istiyor
// (örnek: "POLYGON((-99.919 16.847,-99.921 16.826,...,-99.919 16.847))").
// WKT'de sıralama LONGITUDE LATITUDE'dur (GeoJSON ile aynı, [lat,lng] değil).
function buildWktPolygon(latitude, longitude, deltaDeg = 0.02) {
  const points = [
    [longitude - deltaDeg, latitude - deltaDeg],
    [longitude + deltaDeg, latitude - deltaDeg],
    [longitude + deltaDeg, latitude + deltaDeg],
    [longitude - deltaDeg, latitude + deltaDeg],
    [longitude - deltaDeg, latitude - deltaDeg], // halka kapanmalı
  ];
  const ring = points.map(([lng, lat]) => `${lng} ${lat}`).join(',');
  return `POLYGON((${ring}))`;
}

export async function handleSkyfiSearch(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...JSON_HEADERS,
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  if (!isAllowedOrigin(request)) {
    return json(request, { error: 'Bu origin için erişim izni yok.' }, 403);
  }
  if (request.method !== 'POST') {
    return json(request, { error: 'Yalnızca POST kabul edilir.' }, 405);
  }

  const apiKey = process.env.SKYFI_API_KEY;
  if (!apiKey) {
    // Yapılandırılmamışsa hata değil; graceful offline yanıt döneriz.
    // satelliteAgent.ts bu yanıtı görünce SkyFi bulgusu eklemeden devam eder.
    return json(
      request,
      {
        configured: false,
        archives: [],
        message: 'SKYFI_API_KEY tanımlı değil. SAR/optik arşiv taraması atlandı.',
      },
      200
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(request, { error: 'Geçersiz JSON gövdesi.' }, 400);
  }

  const { latitude, longitude, fromDate, toDate, openData = true } = body || {};
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return json(request, { error: 'latitude ve longitude (sayı) zorunludur.' }, 400);
  }

  const aoi = buildWktPolygon(latitude, longitude);

  const requestBody = {
    aoi,
    pageSize: 10,
    openData, // varsayılan true: yalnızca ücretsiz açık veri (Sentinel-1/2 vb.)
  };
  if (fromDate) requestBody.fromDate = fromDate;
  if (toDate) requestBody.toDate = toDate;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${SKYFI_BASE_URL}/archives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Skyfi-Api-Key': apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return json(
        request,
        {
          configured: true,
          archives: [],
          error: `SkyFi API HTTP ${response.status} döndürdü.`,
          detail: detail.slice(0, 800),
        },
        502
      );
    }

    const data = await response.json();
    // data: { request, archives: ArchiveResponse[], nextPage, total }
    return json(request, {
      configured: true,
      archives: Array.isArray(data.archives) ? data.archives : [],
      nextPage: data.nextPage ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'SkyFi API zaman aşımına uğradı.'
        : error instanceof Error
          ? error.message
          : 'Bilinmeyen SkyFi API hatası.';
    return json(request, { configured: true, archives: [], error: message }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
