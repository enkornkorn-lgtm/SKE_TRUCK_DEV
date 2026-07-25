// SKE TRUCK Unified Service Worker V8
const CACHE_PREFIX = 'ske-truck-';
const CACHE_NAME = CACHE_PREFIX + 'v8-3-20260725';
const STATIC_ASSETS = ['./manifest.json?v=8.3', './icon-192.png', './icon-512.png', './ske-logo.png'];

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDNx3pN0T_VKHMKfJOiuo5FmcZlVp73h8g",
  authDomain: "ske-status-2.firebaseapp.com",
  databaseURL: "https://ske-status-2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ske-status-2",
  storageBucket: "ske-status-2.firebasestorage.app",
  messagingSenderId: "170552278274",
  appId: "1:170552278274:web:80f699b101cc1867c5161b"
});
const messaging = firebase.messaging();


self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => Promise.allSettled(STATIC_ASSETS.map(asset => cache.add(asset))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Firebase/CDN ไม่ผ่าน cache ของเรา

  // HTML/JS/CSS ใช้ network-first เพื่อรับเวอร์ชันใหม่ทันที พร้อม fallback เฉพาะตอน offline จริง
  if (request.mode === 'navigate' || ['document','script','style'].includes(request.destination)) {
    event.respondWith(fetch(request, { cache: 'no-store' }).then(response => {
      if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request).then(r => r || caches.match('./'))));
    return;
  }

  if (['image','font','manifest'].includes(request.destination)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    })));
  }
});

messaging.onBackgroundMessage(payload => {
  const n = payload.notification || {};
  return self.registration.showNotification(n.title || 'SKE TRUCK', {
    body: n.body || '', icon: n.icon || './icon-192.png', badge: './icon-192.png',
    data: payload.data || {}, tag: (payload.data && payload.data.tag) || 'ske-alert'
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list => {
    for (const client of list) if ('focus' in client) return client.focus();
    return clients.openWindow('./');
  }));
});
