// TRUCK TEST CUSTOMER FIREBASE TRIAL V1
// ทำหน้าที่รับ FCM เท่านั้น ไม่ดัก fetch และไม่ cache HTML/Firebase/API
// เพื่อไม่ให้ worker รุ่นเก่าทำให้แอปค้างหลังสลับ Wi‑Fi กับสัญญาณมือถือ

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
const SKE_CACHE_PREFIXES = ['ske-truck-customer-trial-', 'ske_truck_customer_trial_'];

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
  const title = notification.title || 'TRUCK TEST';
  const options = {
    body: notification.body || '',
    icon: notification.icon || './icon-192.png?v=test-logo-v1',
    badge: './icon-192.png?v=test-logo-v1',
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
