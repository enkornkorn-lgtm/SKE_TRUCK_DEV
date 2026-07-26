// SKE TRUCK Service Worker — V3.2.2 Transport Fix
// ทำหน้าที่รับ FCM เท่านั้น ไม่ดัก fetch และไม่ cache HTML/Firebase/API
// เพื่อไม่ให้ worker รุ่นเก่าทำให้แอปค้างหลังสลับ Wi‑Fi กับสัญญาณมือถือ

importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js');

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
const SKE_CACHE_PREFIXES = ['ske-truck-dev-', 'ske_truck_dev_'];

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          // ล้างเฉพาะ cache ที่ SKE รุ่นเก่าสร้าง ไม่กระทบเว็บอื่นบน origin เดียวกัน
          .filter(key => SKE_CACHE_PREFIXES.some(prefix => key.toLowerCase().startsWith(prefix)))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// จงใจไม่มี fetch handler:
// navigation, Firebase WebSocket/long polling, REST และ static asset วิ่งตรงเข้า network
// จึงไม่มี response เก่าค้างใน Service Worker หลัง network handoff

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
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow('./');
    })
  );
});
