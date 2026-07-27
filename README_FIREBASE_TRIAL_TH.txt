TRUCK TEST — CUSTOMER FIREBASE TRIAL V1
======================================

รุ่นนี้เชื่อม Realtime Database ของโปรเจกต์ทดลอง ske-truck-dev
ไม่เชื่อมต่อฐานข้อมูลจริงของ SKE และข้อมูลตั้งต้นทุกหมวดเป็นค่าว่าง

ไฟล์ที่ต้องอัปขึ้น GitHub Pages
- index.html
- manifest.json
- sw.js
- icon-192.png
- icon-512.png
- ske-logo.png

รหัสเริ่มต้น
- ผู้ดูแล: admin1234
- แอดมินดูแผนงาน: view1234
- PIN ชั้นที่ 2: 135790
- Emergency Code: SKE-RESET-2025

สิ่งที่ใช้งานได้
- ซิงก์พนักงาน รถ สถานะ จังหวัด และประวัติแบบเรียลไทม์หลายเครื่อง
- เพิ่ม แก้ไข และลบข้อมูลผ่าน Firebase โปรเจกต์ทดลอง
- ระบบแจ้งซ่อม ของเหลว เบิกเงิน ลา เอกสาร เที่ยววิ่ง แผนงาน และความคิดเห็น
- แก้การเชื่อมต่อเมื่อสลับ Wi-Fi กับ 4G/5G ตามรุ่นหลักล่าสุด

สิ่งที่ยังต้องตั้งค่าเพิ่ม
- Push Notification ต้องสร้าง Web Push certificate (VAPID key) ของ ske-truck-dev
- Cloud Function สำหรับส่ง Push ต้อง Deploy แยก ไม่ได้ทำงานจาก GitHub Pages

คำเตือนด้านความปลอดภัย
- ขณะจัดทำ Realtime Database นี้เปิดให้อ่านและเขียนจากหน้าเว็บได้โดยไม่มี Firebase Authentication
- ใช้สำหรับข้อมูลทดลองเท่านั้น ห้ามใส่ข้อมูลส่วนบุคคลหรือข้อมูลจริงที่เป็นความลับ
- ก่อนนำไปใช้งานจริงควรเพิ่ม Firebase Authentication, App Check และปรับ Database Rules
