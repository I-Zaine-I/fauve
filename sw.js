/* Fauve — service worker : l'app marche hors ligne (salle en sous-sol, piscine…) */
const V = 'fauve-v3.0.0';
const CORE = ['./', 'index.html', 'styles.css', 'data.js', 'recipes.js', 'app.js', 'views.js', 'views2.js', 'planner.js', 'boot.js',
  'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'favicon.png'];
const FONTS = 'fauve-fonts';

self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE))); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    // Cache d'abord (instantané, hors ligne), mise à jour en arrière-plan
    const key = req.mode === 'navigate' ? 'index.html' : req;
    e.respondWith(caches.open(V).then(c => c.match(key, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(res => { if (res && res.ok && res.type === 'basic') c.put(key, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }))));
  }
});
