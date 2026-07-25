SKE TRUCK CONNECTION V3 — LONG POLLING

ไฟล์ที่ต้องอัปโหลดทับบน GitHub:
1) index.html
2) sw.js
3) manifest.json

ไฟล์เดิม:
- ลบ firebase-messaging-sw.js ได้ เพราะระบบแจ้งเตือนรวมอยู่ใน sw.js แล้ว
- เก็บ icon-192.png และ icon-512.png ไว้ที่ root เหมือนเดิม

สิ่งที่เปลี่ยนจาก V2:
- บังคับ Firebase Realtime Database ใช้ HTTP long polling แทน WebSocket
- เรียก forceLongPolling() ก่อน getDatabase(app)
- ถอด goOffline()/goOnline() ออกจากปุ่มลองเชื่อมต่อใหม่
- ปุ่มลองใหม่ทำ soft refresh แล้วรอ .info/connected กลับมา
- เพิ่ม log ระบุ transport=long-polling
- เปลี่ยนเลขเวอร์ชันเป็น v2026.07.24-connection-v3

ขั้นตอนหลังอัปโหลด:
1) รอ GitHub Pages deploy สำเร็จ
2) เปิดหน้าเว็บใน Chrome และรีโหลดหนึ่งครั้ง
3) ปิดแอป PWA แล้วเปิดใหม่ 1-2 รอบ เพื่อรับ index.html และ Service Worker รุ่นใหม่
4) ตรวจข้อความเวอร์ชันบนหน้าแอปว่าขึ้น connection-v3
5) ทดสอบเข้า-ออกแอปหลายรอบ แล้วเปิด Debug Log ดูค่า Firebase .info/connected

หมายเหตุ:
- Long polling มักเสถียรกว่าเมื่อ WebSocket ถูกพักหรือค้างบนเครือข่าย/เบราว์เซอร์บางแบบ
- อาจใช้ข้อมูลเครือข่ายมากขึ้นเล็กน้อยและตอบสนองช้ากว่า WebSocket เล็กน้อย
- ยังควรทดสอบบนเครื่องจริง เพราะไม่มีการแก้ใดรับประกันผล 100% ก่อน deploy และใช้งานจริง
