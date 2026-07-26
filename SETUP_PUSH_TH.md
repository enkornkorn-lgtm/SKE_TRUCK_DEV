# วิธีเปิดใช้แจ้งเตือนเข้าโทรศัพท์ (แม้ปิดแอป) — SKE TRUCK

ผมทำ code ให้ครบแล้ว เหลือ **4 ขั้นตอนที่คุณต้องทำเองใน Firebase** เพราะเป็นการตั้งค่าในบัญชีของคุณที่ผมเข้าไปทำแทนไม่ได้

ไฟล์ที่ต้องอัปโหลดขึ้นโฮสต์ (ที่เดียวกับ index.html เดิม):
- `index.html` (เวอร์ชันใหม่ — แทนของเดิม)
- `firebase-messaging-sw.js` (ไฟล์ใหม่ — ต้องอยู่ที่ root เดียวกับ index.html)

ไฟล์สำหรับ deploy ฝั่งเซิร์ฟเวอร์:
- `functions/index.js`
- `functions/package.json`

---

## ขั้นที่ 1 — เอา VAPID key มาใส่ใน index.html

1. เข้า https://console.firebase.google.com เลือกโปรเจกต์ **ske-status**
2. ไปที่ ⚙️ **Project settings** → แท็บ **Cloud Messaging**
3. เลื่อนหา **Web Push certificates** → กด **Generate key pair**
4. คัดลอกคีย์ที่ได้ (ยาวๆ ขึ้นต้นด้วยตัวอักษร/ตัวเลข)
5. เปิด `index.html` หาบรรทัด:
   ```
   const VAPID_KEY = "PASTE_YOUR_VAPID_KEY_HERE";
   ```
   แล้ววางคีย์แทนข้อความ `PASTE_YOUR_VAPID_KEY_HERE` (ต้องอยู่ในเครื่องหมายคำพูด)

> ถ้าข้ามขั้นนี้ แอปจะทำงานปกติทุกอย่างเหมือนเดิม แค่ push ตอนปิดแอปจะไม่ทำงาน (มี log บอกใน console)

---

## ขั้นที่ 2 — อัปเกรดเป็น Blaze plan (จำเป็นสำหรับ Cloud Functions)

1. ใน Firebase Console มุมซ้ายล่าง กด **Upgrade** → เลือก **Blaze (Pay as you go)**
2. ต้องผูกบัตร แต่มีโควต้าฟรีเยอะมาก — งานเล็กแบบนี้ปกติ **ไม่เสียเงิน**
3. ตั้ง budget alert ไว้ที่ $1 เพื่อความสบายใจได้

---

## ขั้นที่ 3 — Deploy Cloud Function

ทำบนคอมพิวเตอร์ (Windows/Mac) ที่ติดตั้ง Node.js แล้ว:

```bash
# 1. ติดตั้งเครื่องมือ Firebase (ครั้งเดียว)
npm install -g firebase-tools

# 2. login
firebase login

# 3. เข้าโฟลเดอร์โปรเจกต์ที่มีโฟลเดอร์ functions อยู่
cd path/to/your/project

# 4. ถ้ายังไม่เคย init ให้รัน (เลือก Functions, ใช้โปรเจกต์ ske-status, ภาษา JavaScript)
firebase init functions

# 5. ติดตั้ง dependencies
cd functions
npm install
cd ..

# 6. deploy
firebase deploy --only functions
```

ถ้าสำเร็จจะขึ้นชื่อฟังก์ชัน `notifyStatusChange`

---

## ขั้นที่ 4 — ทดสอบ

1. เปิดแอปบนมือถือ **เครื่องผู้ดูแล** → login เป็นผู้ดูแล → กด **อนุญาต** การแจ้งเตือน
2. ปิดแอปสนิท (สไวป์ออกจาก recent apps)
3. ใช้อีกเครื่อง login เป็นพนักงาน → เปลี่ยนสถานะ
4. เครื่องผู้ดูแลควรเด้งแจ้งเตือนขึ้นถาดระบบภายในไม่กี่วินาที

---

## หลักการทำงาน (สรุปสั้นๆ)

```
พนักงานเปลี่ยนสถานะ
   → เขียนลง Firebase RTDB (/employees)
      → Cloud Function "notifyStatusChange" ตื่นขึ้นมาทำงานบนเซิร์ฟเวอร์
         → ดึง token เครื่องผู้ดูแลทั้งหมดจาก /pushTokens
            → ส่ง push ผ่าน FCM
               → เครื่องผู้ดูแลเด้งแจ้งเตือน (แม้ปิดแอป) ผ่าน firebase-messaging-sw.js
```

- เครื่องผู้ดูแลจะลงทะเบียน token อัตโนมัติตอน login (เก็บไว้ใต้ `/pushTokens`)
- ตอน logout จะลบ token ออก (กันแจ้งเตือนค้าง)
- token เสีย/ถอนแอป Cloud Function จะลบให้เองอัตโนมัติ

---

## หมายเหตุสำคัญ

- **iPhone:** ต้อง "เพิ่มลงหน้าจอหลัก" (Add to Home Screen) แล้วเปิดจากไอคอนนั้นก่อน push ถึงจะทำงาน (ข้อจำกัดของ iOS Safari)
- **Android:** ทำงานได้เลยทั้งใน Chrome และแบบเพิ่มลงหน้าจอหลัก
- ต้องรันบน **HTTPS** จริงเท่านั้น (เปิดไฟล์แบบ file:// ใช้ไม่ได้)
- การแจ้งเตือนตอนแอป "เปิดอยู่" ทำงานเหมือนเดิมทุกอย่าง (ไม่ต้องตั้งค่าอะไรเพิ่ม)
