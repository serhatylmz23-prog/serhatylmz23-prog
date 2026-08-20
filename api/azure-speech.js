const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

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

export async function handleSpeechToken(request) {
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

  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    return json(
      request,
      {
        error:
          'Azure Speech yapılandırılmadı. AZURE_SPEECH_KEY ve AZURE_SPEECH_REGION gereklidir.',
      },
      503
    );
  }
  if (!/^[a-z0-9-]+$/i.test(region)) {
    return json(request, { error: 'AZURE_SPEECH_REGION biçimi geçersiz.' }, 503);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Length': '0',
        },
        signal: controller.signal,
      }
    );
    if (!response.ok) {
      console.error('Azure Speech token hatası:', response.status);
      return json(request, { error: 'Azure Speech yetkilendirmesi başarısız.' }, 502);
    }
    return json(request, {
      token: await response.text(),
      region,
      voice: 'tr-TR-EmelNeural',
      expiresInSeconds: 540,
    });
  } catch (error) {
    return json(
      request,
      {
        error:
          error?.name === 'AbortError'
            ? 'Azure Speech isteği zaman aşımına uğradı.'
            : 'Azure Speech servisine ulaşılamadı.',
      },
      502
    );
  } finally {
    clearTimeout(timeout);
  }
}
