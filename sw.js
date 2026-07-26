// SKE TRUCK DEV V4 — Service Worker intentionally disabled.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.registration.unregister(),
      caches.keys().then(keys =>
        Promise.all(
          keys.filter(key => key.includes('ske-truck-dev')).map(key => caches.delete(key))
        )
      )
    ])
  );
});

// No fetch handler. All requests go directly to the network.
