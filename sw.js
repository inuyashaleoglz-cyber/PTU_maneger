/* ============================================================
   sw.js · Service Worker · Cache para uso offline
   ============================================================ */
'use strict';

const CACHE_NAME = 'ptu-manager-v1';
const ASSETS = [
  './',
  './index.html',
  './assets/styles.css',
  './data/pokedex.json',
  './data/moves.json',
  './data/abilities.json',
  './data/classes.json',
  './data/items.json',
  './data/glossary.json',
  './src/utils.js',
  './src/storage.js',
  './src/data.js',
  './src/state.js',
  './src/ui.js',
  './src/wizard.js',
  './src/trainer.js',
  './src/pokemon.js',
  './src/combat.js',
  './src/tools.js',
  './src/share.js',
  './src/reference.js',
  './src/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('Cache install parcial:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        fetch(req).then(res => {
          if (res && res.ok) {
            caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
