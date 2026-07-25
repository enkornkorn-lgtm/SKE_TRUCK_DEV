SKE TRUCK CONNECTION V5.1 DEV

ใช้กับ Repository SKE_TRUCK_DEV เท่านั้น

การแก้หลัก:
- ไม่ล้าง cache/localStorage ทุกครั้งที่เปิดแอป
- เพิ่ม recovery เมื่อกลับจาก background, browser online และ watchdog ตอนหน้าแอปมองเห็น
- รอ Firebase SDK reconnect เองก่อน แล้วค่อย reset socket แบบมี cooldown
- จำกัด hard reconnect ไม่เกิน 2 ครั้งต่อนาที ป้องกันการตัดต่อรัว
- Service Worker bump cache เป็น V5.1

อัปไฟล์ทั้งหมดทับ DEV แล้วรอ Deploy จากนั้นล้าง Site Data ของ DEV หนึ่งครั้งเท่านั้น
