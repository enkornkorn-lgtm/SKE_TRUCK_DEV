SKE TRUCK CONNECTION V5.2 DEV

สิ่งที่แก้จาก V5.1
1. อัปเกรด Firebase JavaScript SDK จาก 10.12.0 เป็น 12.16.0
2. บังคับ Realtime Database ใช้ long-polling แทน WebSocket เพื่อทดสอบอาการค้างหลังสลับ Wi-Fi/4G บน Android PWA
3. ลบการสั่ง goOffline()/goOnline() ออกจาก recovery เพราะการสั่งนี้ตัด connection เอง
4. soft refresh ก่อน และ reload หน้า 1 ครั้งเฉพาะเมื่อ .info/connected=false ต่อเนื่องเกิน 30 วินาที
5. ไม่ล้าง Cache, localStorage, session/login หรือ outbox
6. เปลี่ยน cache และ query version เป็น V5.2

ทดสอบใน DEV เท่านั้นก่อน ห้ามลง Production จนกว่าจะผ่านการสลับเครือข่ายและพักแอป
