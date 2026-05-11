const CACHE = 'partitures-shell-v8-pointer-sort';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './oxyd-logo.png',
  './oxyd-full-logo.png',
  './icon-192.png',
  './icon-512.png',
  './preloaded/oxyd-repertori.json',
  './preloaded/oxyd/01-baladeta-85-90-140bpm.pdf',
  './preloaded/oxyd/02-centralia-177bpm.pdf',
  './preloaded/oxyd/03-cuenta-atras-187bpm.pdf',
  './preloaded/oxyd/04-cuernos-al-cielo.pdf',
  './preloaded/oxyd/05-dime-hermano-138bpm.pdf',
  './preloaded/oxyd/06-el-brillo-del-metal-149bpm.pdf',
  './preloaded/oxyd/07-hijos-de-la-mar-130bpm.pdf',
  './preloaded/oxyd/08-la-cancion-del-pirata.pdf',
  './preloaded/oxyd/09-llego-a-su-fin-170bpm.pdf',
  './preloaded/oxyd/10-maktub-167bpm.pdf',
  './preloaded/oxyd/11-nunca-se-sabe-160bpm.pdf',
  './preloaded/oxyd/12-pandemia-187bpm.pdf',
  './preloaded/oxyd/13-testamento-170bpm.pdf',
  './preloaded/oxyd/14-bienvenidos-al-valhalla-170bpm.pdf'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  const isShellFile = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
  if (isShellFile) {
    event.respondWith(
      fetch(req).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy));
        return response;
      }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
});
