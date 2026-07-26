SKE TRUCK DEV V3.2.2 — REALTIME TRANSPORT FIX

ฐาน: V3.2.1 Network Fix

แก้สาเหตุที่พบจาก Debug Log เครื่อง Android:
- REST เข้าได้ แต่ Firebase realtime ต่อไม่ได้
- WebSocket ล้มเหลวแล้ว SDK เปลี่ยนไปใช้ long-polling
- CSP รุ่นเดิมบล็อก script/iframe ของ long-polling
- ต้องลบข้อมูลเว็บไซต์เพื่อเคลียร์ transport flag

รุ่นนี้อนุญาตเฉพาะโดเมน Firebase ที่ long-polling ต้องใช้ และล้างเฉพาะ
firebase:previous_websocket_failure หนึ่งครั้ง จึงไม่ทำให้ข้อมูลล็อกอินหรือ
งานค้างในเครื่องหาย

ดูขั้นตอนอัปโหลดและทดสอบใน DEV_TEST_INSTRUCTIONS.txt
