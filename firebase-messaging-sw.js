// firebase-messaging-sw.js
// Service worker สำหรับรับการแจ้งเตือน (FCM) แม้ปิดแอปอยู่
// ต้องวางไว้ที่ root เดียวกับ index.html บน GitHub Pages (ห้ามย้ายไปโฟลเดอร์ย่อย)

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

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'SKE TRUCK';
  const options = {
    body: (payload.notification && payload.notification.body) || '',
    icon: (payload.notification && payload.notification.icon) || '/icon-192.png',
    data: payload.data || {}
  };
  self.registration.showNotification(title, options);
});
