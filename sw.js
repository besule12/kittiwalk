// Kittiwalk service worker — cache l'appli pour usage hors-ligne
const CACHE = 'kittiwalk-v1';
const ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stratégie : réseau d'abord pour les tuiles de carte (elles évoluent),
// cache d'abord pour le reste (l'appli marche sans réseau)
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('tile.openstreetmap.org')) {
    e.respondWith(
      caches.open('kittiwalk-tiles').then(cache =>
        cache.match(e.request).then(hit => {
          const fetched = fetch(e.request).then(res => {
            cache.put(e.request, res.clone());
            return res;
          }).catch(() => hit);
          return hit || fetched;
        })
      )
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request))
    );
  }
});
