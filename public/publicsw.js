const CACHE_NAME = 'sykasif-heritage-offline-v1';
// NOT: Production build'de JS/CSS dosya adları hash'lenir (ör. index-CTFHuLua.js),
// bu yüzden burada sabit /src/... yolları önbelleğe almak hatalıydı ve build sonrası
// hiçbir zaman eşleşmeyecekti. Sadece kök sayfa önceden önbelleğe alınır; geri kalan
// varlıklar aşağıdaki 'fetch' olayında ilk ziyarette otomatik önbelleğe eklenir.
const ASSETS_TO_CACHE = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // /api/* isteklerini asla önbellekten karşılama; bunlar her zaman canlı
  // sunucuya gitmeli (aksi halde eski/hatalı bir AI yanıtı önbellekten
  // tekrar tekrar gösterilebilir).
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match('/index.html'));

      return cachedResponse || networkFetch;
    })
  );
});