SKE TRUCK DEV — PWA CACHE FIX V1

อัปโหลดแทนไฟล์เดิมใน Repository SKE_TRUCK_DEV เท่านั้น:
1) index.html
2) app.js
3) firebase.js
4) sw.js
5) manifest.json
6) icon-192.png
7) icon-512.png

ห้ามอัปขึ้น Production ในขั้นทดสอบนี้
หลัง GitHub Pages deploy แล้ว ให้ลบข้อมูลเว็บไซต์ SKE_TRUCK_DEV เพียงครั้งเดียว จากนั้นเปิดใหม่และทดสอบเปิด/ปิดแอปกับสลับ Wi-Fi/4G หลายรอบ

การแก้หลัก:
- Service Worker ลงทะเบียนผ่านจุดเดียว
- JS/CSS ใช้ network-first
- HTML ไม่ถูก Service Worker cache
- ลบเฉพาะ cache ของ DEV ไม่ลบ cache ของโปรเจกต์อื่นบน github.io
- เพิ่ม icon 192/512 ที่ขาด
- เพิ่ม cache-busting query ให้ไฟล์หลัก
