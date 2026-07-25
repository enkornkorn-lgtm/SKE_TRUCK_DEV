SKE TRUCK Connection V3.1 Emergency Rollback

สาเหตุ:
- V3 บังคับใช้ Firebase Long Polling แล้วเครื่องทดสอบเชื่อมต่อ Realtime Database ไม่ได้
- ชุดนี้ย้อนกลับไปใช้ transport อัตโนมัติของ Firebase แบบ V2
- ยังคงการแก้เรื่องไม่ตัด connection ทุกครั้งที่กลับเข้าแอป

วิธีอัปโหลด:
1. อัปโหลด index.html, sw.js และ manifest.json ทับไฟล์เดิมบน GitHub
2. Commit changes
3. รอ GitHub Pages deploy
4. ปิดแอปจาก Recent apps แล้วเปิดใหม่
5. ตรวจเวอร์ชันบนหน้าจอให้เป็น v2026.07.24-connection-v3.1-rollback

หมายเหตุ:
- อย่าใช้ไฟล์ V3 เดิมที่มี forceLongPolling()
