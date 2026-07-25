SKE TRUCK — Modular DEV V1

สถานะ: โปรเจกต์ทดสอบเท่านั้น ห้ามอัปทับระบบจริง
ฐาน: Connection V3.1 Rollback (Stable)

โครงสร้างใหม่:
- index.html              โครงหน้าเว็บ
- css/app.css             สไตล์หลัก
- css/overrides.css       สไตล์แก้ไขเพิ่มเติม
- js/firebase.js          Firebase, sync, connection, push
- js/app.js               ฟังก์ชันธุรกิจและหน้าจอหลัก
- js/static-icons.js      เติมไอคอนสแตติก
- js/ui-patch.js          ปรับข้อความ/ซ่อนปุ่มเฉพาะหน้า
- sw.js                   Service Worker
- manifest.json           PWA manifest

หลักความปลอดภัย:
1. ใช้ GitHub Repository หรือ branch ใหม่สำหรับ DEV
2. ห้ามแทนที่ repo ระบบจริงในรอบนี้
3. ใช้ Firebase เดิมได้ในการทดสอบแบบอ่านข้อมูล แต่การกดบันทึกจะเขียนข้อมูลจริง
   จึงควรสร้าง Firebase Test Project แยกก่อนทดสอบการเขียน
4. ทดสอบทุกหน้าจอและทุกบทบาทก่อนนำไป production

สิ่งที่เปลี่ยนในรอบนี้:
- แยกไฟล์เท่านั้น ไม่ตั้งใจเปลี่ยน business logic
- ปรับ Service Worker ให้ precache ไฟล์ JS/CSS ใหม่
- เปลี่ยนป้ายเวอร์ชันเป็น modular-dev-v1
