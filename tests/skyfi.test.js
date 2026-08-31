import test from 'node:test';
import assert from 'node:assert/strict';
import { handleSkyfiSearch } from '../api/skyfi.js';

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };

function request(body, origin = 'https://example.test') {
  return new Request(`${origin}/api/skyfi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
    },
    body: JSON.stringify(body),
  });
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env = { ...originalEnv };
});

test('SKYFI_API_KEY tanımlı değilse hata değil, configured:false döner', async () => {
  delete process.env.SKYFI_API_KEY;
  const res = await handleSkyfiSearch(
    request({ latitude: 38.6748, longitude: 39.2225 })
  );
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.configured, false);
  assert.deepEqual(data.archives, []);
});

test('geçersiz koordinat 400 döner', async () => {
  process.env.SKYFI_API_KEY = 'test-key';
  const res = await handleSkyfiSearch(request({ latitude: 'yanlış' }));
  assert.equal(res.status, 400);
});

test('SkyFi POST /archives doğru şemayla çağrılır (WKT AOI + X-Skyfi-Api-Key)', async () => {
  process.env.SKYFI_API_KEY = 'test-key';
  let capturedUrl;
  let capturedInit;
  globalThis.fetch = async (url, init) => {
    capturedUrl = url;
    capturedInit = init;
    return new Response(
      JSON.stringify({
        request: {},
        archives: [
          {
            archiveId: 'abc-123',
            provider: 'SENTINEL1_CREODIAS',
            constellation: 'SENTINEL-1',
            productType: 'SAR',
            resolution: 'MEDIUM',
            captureTimestamp: '2026-08-01T00:00:00Z',
            cloudCoveragePercent: null,
          },
        ],
        nextPage: null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const res = await handleSkyfiSearch(
    request({ latitude: 38.6748, longitude: 39.2225, openData: true })
  );
  const data = await res.json();

  assert.equal(capturedUrl, 'https://app.skyfi.com/platform-api/archives');
  assert.equal(capturedInit.headers['X-Skyfi-Api-Key'], 'test-key');
  const sentBody = JSON.parse(capturedInit.body);
  assert.match(sentBody.aoi, /^POLYGON\(\(.*\)\)$/);
  assert.equal(sentBody.openData, true);

  assert.equal(res.status, 200);
  assert.equal(data.configured, true);
  assert.equal(data.archives.length, 1);
  assert.equal(data.archives[0].provider, 'SENTINEL1_CREODIAS');
});

test('SkyFi HTTP hatası şeffaf şekilde iletilir, sahte sonuç üretilmez', async () => {
  process.env.SKYFI_API_KEY = 'test-key';
  globalThis.fetch = async () =>
    new Response('yetkisiz', { status: 401 });

  const res = await handleSkyfiSearch(
    request({ latitude: 38.6748, longitude: 39.2225 })
  );
  const data = await res.json();
  assert.equal(res.status, 502);
  assert.equal(data.configured, true);
  assert.deepEqual(data.archives, []);
  assert.match(data.error, /401/);
});
