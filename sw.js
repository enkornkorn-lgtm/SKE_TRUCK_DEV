// SKE TRUCK DEV Service Worker — V3.1 Reconnect Logo V2 (safe cache)
// เป้าหมาย: ห้าม Service Worker สะสม Firebase/API/Long Polling และห้าม cache ชนกับ Production

const CACHE_NAME = 'ske-truck-dev-ske-truck-dev-v31-reconnect-logo-v2';
const OLD_DEV_CACHES = new Set([
  'ske-truck-dev-v31-reconnect-logo-v1',
  'ske-truck-dev-handoff-v1'
]);

// เก็บเฉพาะไฟล์ static ที่รู้แน่ ๆ เท่านั้น
const STATIC_ASSETS = [
  './manifest.json?v=dev-v31-reconnect-logo-v2',
  './icon-192.png',
  './icon-512.png',
  './ske-logo.png'
];

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

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(
        STATIC_ASSETS.map(asset => cache.add(new Request(asset, { cache: 'reload' })))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          // ลบเฉพาะ cache DEV รุ่นก่อน ห้ามลบ cache ของ Production/โปรเจกต์อื่นบน origin เดียวกัน
          .filter(key => OLD_DEV_CACHES.has(key))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  // ไม่แตะคำขอที่ไม่ใช่ GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // ห้าม Service Worker ดัก/แคชคำขอข้าม origin ทุกชนิด
  // ครอบคลุม Firebase RTDB WebSocket fallback, long polling lp?start=..., FCM,
  // gstatic, googleapis, firebaseio, firebasedatabase และ API ภายนอกทั้งหมด
  if (url.origin !== self.location.origin) return;

  // หน้า HTML ต้อง network โดยตรง เพื่อรับเวอร์ชันล่าสุดเสมอ
  if (request.mode === 'navigate' || request.destination === 'document') return;

  // อนุญาตตอบจาก cache เฉพาะรายการที่ precache ไว้เท่านั้น
  const staticUrls = new Set(STATIC_ASSETS.map(asset => new URL(asset, self.registration.scope).href));
  if (!staticUrls.has(url.href)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request, { ignoreSearch: false }).then(cached => cached || fetch(request))
    )
  );
});

messaging.onBackgroundMessage(payload => {
  const notification = payload.notification || {};
  const title = notification.title || 'SKE TRUCK';
  const options = {
    body: notification.body || '',
    icon: notification.icon || './icon-192.png',
    badge: './icon-192.png',
    data: payload.data || {},
    tag: (payload.data && payload.data.tag) || 'ske-alert'
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
