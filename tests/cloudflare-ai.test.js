import test from 'node:test';
import assert from 'node:assert/strict';
import { handleChat, handleVision } from '../api/cloudflare-ai.js';
import { handleSpeechToken } from '../api/azure-speech.js';
import { createLiveRuntime } from '../server/live-runtime.js';

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };

function request(path, body, origin = 'https://example.test') {
  return new Request(`${origin}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
    },
    body: JSON.stringify(body),
  });
}

function pngDataUri() {
  // Geçerli imzaya sahip küçük test verisi; uzak servis bu testte mock'lanır.
  return `data:image/png;base64,${Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]).toString('base64')}`;
}

test.beforeEach(() => {
  process.env.CLOUDFLARE_ACCOUNT_ID = 'a'.repeat(32);
  process.env.CLOUDFLARE_AI_TOKEN = 'test-token';
  delete process.env.APP_ORIGIN;
  delete process.env.AZURE_SPEECH_KEY;
  delete process.env.AZURE_SPEECH_REGION;
  process.env.NODE_ENV = 'test';
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test.after(() => {
  process.env = originalEnv;
});

test('chat başarılı Cloudflare yanıtını normalize eder', async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ result: { response: '  Hazır.  ' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  const response = await handleChat(request('/api/chat', { prompt: 'Durum?' }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { response: 'Hazır.' });
});

test('chat boş promptu reddeder', async () => {
  const response = await handleChat(request('/api/chat', { prompt: '   ' }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /prompt/);
});

test('üretimde yabancı origin reddedilir', async () => {
  process.env.NODE_ENV = 'production';
  const req = request('/api/chat', { prompt: 'Durum?' }, 'https://evil.test');
  // İstek URL'sini uygulama origin'inden, Origin başlığını yabancı kaynaktan üret.
  const crossOriginRequest = new Request('https://app.test/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://evil.test' },
    body: JSON.stringify({ prompt: 'Durum?' }),
  });
  void req;

  const response = await handleChat(crossOriginRequest);
  assert.equal(response.status, 403);
});

test('vision geçersiz dosya imzasını reddeder', async () => {
  const fakeImage = `data:image/png;base64,${Buffer.from('not-an-image').toString('base64')}`;
  const response = await handleVision(
    request('/api/vision', { prompt: 'Analiz et', imageBase64: fakeImage }),
  );

  assert.equal(response.status, 415);
});

test('vision geçerli isteği uzak modele iletir', async () => {
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.deepEqual(body.image.slice(0, 4), [0x89, 0x50, 0x4e, 0x47]);
    return new Response(JSON.stringify({ result: { description: 'Bir test görseli.' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const response = await handleVision(
    request('/api/vision', { prompt: 'Analiz et', imageBase64: pngDataUri() }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { response: 'Bir test görseli.' });
});

test('Azure Speech eksik yapılandırmayı kontrollü reddeder', async () => {
  const response = await handleSpeechToken(
    request('/api/speech/token', {})
  );
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /Azure Speech yapılandırılmadı/);
});

test('Azure Speech kısa ömürlü tokenı istemciye döndürür', async () => {
  process.env.AZURE_SPEECH_KEY = 'azure-test-key';
  process.env.AZURE_SPEECH_REGION = 'westeurope';
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /westeurope\.api\.cognitive\.microsoft\.com/);
    assert.equal(options.headers['Ocp-Apim-Subscription-Key'], 'azure-test-key');
    return new Response('short-lived-token', { status: 200 });
  };

  const response = await handleSpeechToken(
    request('/api/speech/token', {})
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.token, 'short-lived-token');
  assert.equal(body.voice, 'tr-TR-EmelNeural');
});

test('canlı runtime kaynaklardan olay ve dinamik ajan üretir', async () => {
  globalThis.fetch = async (url) => {
    if (String(url).includes('earthquake.usgs.gov')) {
      return Response.json({
        features: [
          {
            id: 'test-quake',
            properties: {
              mag: 5.2,
              title: 'M5.2 Test Depremi',
              time: Date.now(),
              url: 'https://example.test/quake',
            },
            geometry: { coordinates: [39.2, 38.6, 8.4] },
          },
        ],
      });
    }
    return Response.json({
      events: [
        {
          id: 'test-fire',
          title: 'Test Yangını',
          categories: [{ title: 'Wildfires' }],
          geometry: [
            { date: new Date().toISOString(), coordinates: [30.7, 36.8] },
          ],
        },
      ],
    });
  };

  const runtime = createLiveRuntime();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (runtime.snapshot().lastUpdatedAt) break;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  const snapshot = runtime.snapshot();
  assert.equal(snapshot.metrics.onlineSources, 3);
  assert.equal(snapshot.metrics.liveEvents, 2);
  assert.equal(snapshot.metrics.activeAgents, 5);
});
