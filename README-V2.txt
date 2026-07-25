SKE TRUCK CONNECTION V2

ไฟล์ที่ต้องอัปโหลดทับบน GitHub:
1) index.html
2) sw.js
3) manifest.json

สำคัญ:
- เก็บ icon-192.png และ icon-512.png เดิมไว้ใน root
- ลบ firebase-messaging-sw.js ได้หลังอัปโหลด เพราะ V2 รวม FCM ไว้ใน sw.js แล้ว
- หลัง GitHub Pages deploy สำเร็จ ให้ปิดแอปแล้วเปิดใหม่ 1-2 รอบเพื่อให้ Service Worker v3 เข้าควบคุม
- ไม่จำเป็นต้องล้างข้อมูล Chrome ก่อนทดสอบ หากยังได้โค้ดเก่า ให้เปิดหน้าเว็บใน Chrome แล้วรีโหลดหนึ่งครั้ง

สิ่งที่แก้:
- ไม่ตัด Firebase connection อัตโนมัติทุกครั้งที่กลับเข้าแอป
- ปุ่มลองใหม่ใช้ soft refresh ก่อน แล้วค่อย hard reconnect เมื่อจำเป็น
- มี cooldown กันตัดต่อ socket รัว
- ยกเลิก location.reload อัตโนมัติจาก reconnect
- รวม PWA Service Worker และ Firebase Messaging เป็นไฟล์เดียว
- ไม่ cache index.html หรือ Firebase/API response
