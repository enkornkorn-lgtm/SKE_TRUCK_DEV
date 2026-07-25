// SKE TRUCK DEV Unified Service Worker — Connection V5.2 DEV
// Scope-aware cache; network-first for HTML/JS/CSS; never caches Firebase traffic.
const CACHE_PREFIX = 'ske-truck-dev-pwa-';
const CACHE_NAME = CACHE_PREFIX + 'connection-v5-2-20260725';
const CORE_ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png'];

importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD9Tbm14DG31MYL9eB_0gYBY_tB9GiAyWw",
  authDomain: "ske-truck-dev.firebaseapp.com",
  databaseURL: "https://ske-truck-dev-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ske-truck-dev",
  storageBucket: "ske-truck-dev.firebasestorage.app",
  messagingSenderId: "314092602910",
  appId: "1:314092602910:web:67a73245abd287c2ddd00f"
});
const messaging = firebase.messaging();

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(CORE_ASSETS.map(asset => cache.add(new Request(asset, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isFirebaseOrExternalApi(url) {
  return url.hostname.includes('firebase') ||
         url.hostname.includes('googleapis') ||
         url.hostname.includes('gstatic') ||
         url.protocol === 'chrome-extension:';
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok && response.type !== 'opaque') {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const update = fetch(request).then(response => {
    if (response && response.ok && response.type !== 'opaque') cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || update;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (isFirebaseOrExternalApi(url)) return;

  // Navigation must prefer the latest network copy; do not trap the app on stale HTML.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  // JS/CSS must prefer network, with cache only as an offline fallback.
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Images/fonts/manifest may use cached copy while refreshing in background.
  if (['image', 'font', 'manifest'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

messaging.onBackgroundMessage(payload => {
  const n = payload.notification || {};
  const title = n.title || 'SKE TRUCK DEV';
  const options = {
    body: n.body || '',
    icon: n.icon || './icon-192.png',
    badge: './icon-192.png',
    data: payload.data || {},
    tag: (payload.data && payload.data.tag) || 'ske-dev-alert'
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow('./');
    })
  );
});
