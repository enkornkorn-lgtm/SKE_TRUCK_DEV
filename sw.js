// SKE TRUCK Unified Service Worker v3
// ใช้ตัวเดียวสำหรับ PWA cache + Firebase Cloud Messaging
const CACHE_NAME = 'ske-truck-v3';
const STATIC_ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png'];

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
  // ไฟล์ใดไม่มีอยู่จะไม่ทำให้ SW ติดตั้งล้มเหลวทั้งชุด
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(STATIC_ASSETS.map(asset => cache.add(asset))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Firebase/API/HTML ต้องผ่าน network โดยตรง ไม่เก็บ response เก่า
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') ||
      request.mode === 'navigate' ||
      request.destination === 'document') {
    return;
  }

  // Cache เฉพาะไฟล์ static จริง
  const allowed = ['script', 'style', 'image', 'font', 'manifest'];
  if (!allowed.includes(request.destination)) return;

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response && response.ok && response.type !== 'opaque') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
      return cached || network;
    })
  );
});

messaging.onBackgroundMessage(payload => {
  // ถ้า FCM ส่ง notification payload เบราว์เซอร์อาจแสดงเองอยู่แล้ว
  // โค้ดนี้รองรับ data-only และกำหนด fallback ที่สม่ำเสมอ
  const n = payload.notification || {};
  const title = n.title || 'SKE TRUCK';
  const options = {
    body: n.body || '',
    icon: n.icon || './icon-192.png',
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
