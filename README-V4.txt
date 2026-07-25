SKE TRUCK Connection V4 — Network Switch Recovery

สิ่งที่เปลี่ยน:
1. ไม่ใช้ forceLongPolling()
2. ไม่สั่ง goOffline()/goOnline() จากปุ่ม reconnect
3. หลัง online, กลับเข้าแอป หรือ Network Information API แจ้งว่าเครือข่ายเปลี่ยน:
   - รอ 3–3.5 วินาทีให้เครือข่ายนิ่ง
   - ทดสอบอ่าน Firebase ผ่าน HTTPS
   - รอ realtime connection กลับมาอีกประมาณ 6 วินาที
   - หาก HTTPS ผ่านแต่ realtime ยัง false จะ reload หน้าเพียง 1 ครั้ง
4. มี sessionStorage cooldown 60 วินาที ป้องกัน reload วน
5. Debug Log เพิ่ม Network, Network Change และ Network Recovery

วิธีติดตั้ง:
- อัปโหลด index.html, sw.js และ manifest.json ทับไฟล์เดิมบน GitHub
- Commit แล้วรอ GitHub Pages deploy
- ปิดแอปจาก Recent apps แล้วเปิดใหม่
- ตรวจเวอร์ชันบนหน้าจอ: v2026.07.25-connection-v4

วิธีทดสอบ:
- เปิดด้วย Wi‑Fi ให้ Firebase connected
- ปิด Wi‑Fi เพื่อเปลี่ยนเป็นเน็ตมือถือ
- รอ 10–15 วินาที
- แอปอาจ reload หนึ่งครั้ง แล้วควรกลับมา connected
- หากยังไม่กลับมา ให้เปิด Debug Log แล้วส่งบรรทัด Network Recovery ล่าสุด
