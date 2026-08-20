const CACHE_NAME = 'sykasif-app-v2';
const APP_SHELL = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // API, harita karoları, POST istekleri ve diğer origin'ler önbelleğe alınmaz.
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put('/', response.clone()));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('/');
          return (
            cached ||
            new Response('Çevrimdışı ve uygulama önbelleği bulunamadı.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(
          () =>
            cached ||
            new Response('Kaynak çevrimdışı kullanılamıyor.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
        );

      return cached || network;
    })
  );
});
