// Kittiwalk service worker — cache l'appli pour usage hors-ligne
const CACHE = 'kittiwalk-v2';
const ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'stations.json',
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

// Stratégie : tuiles de carte = cache d'abord (rapide, économe) ;
// fichiers de l'appli = réseau d'abord (les mises à jour GitHub arrivent
// immédiatement), avec cache en secours pour le hors-ligne
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
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
});
