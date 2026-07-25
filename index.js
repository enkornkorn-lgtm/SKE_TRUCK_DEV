// functions/index.js
// Cloud Function — เมื่อพนักงานเปลี่ยนสถานะใน RTDB จะส่ง push ไปยังเครื่องผู้ดูแลทุกเครื่องที่ลงทะเบียน token ไว้
//
// Deploy:  firebase deploy --only functions
//
// ต้องใช้ Firebase Blaze plan (จ่ายตามใช้จริง — โควต้าฟรีเยอะมาก ปกติไม่เสียเงินสำหรับงานเล็ก)

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const STATUS_LABELS = {
  standby: "สแตนด์บาย/ว่าง",
  traveling: "กำลังเดินทาง",
  returning: "ขากลับ",
  done: "ว่างงาน (สแตนด์บาย)",
  loading_bay: "จอดรอขึ้นสินค้า",
  unload_bay: "จอดรอลงสินค้า",
  loading: "กำลังขึ้นสินค้า",
  unloading: "กำลังลงสินค้า",
  repair: "ซ่อมบำรุง",
};

// ทำงานเมื่อ employees ทั้งก้อนมีการเขียน (RTDB array)
exports.notifyStatusChange = functions
  .region("asia-southeast1")
  .database.ref("/employees")
  .onWrite(async (change, context) => {
    const before = change.before.val();
    const after = change.after.val();
    if (!after) return null;

    // แปลงเป็น map id -> employee (รองรับทั้ง array และ object)
    const toMap = (data) => {
      const m = {};
      if (!data) return m;
      const arr = Array.isArray(data) ? data : Object.values(data);
      arr.forEach((e) => { if (e && e.id) m[e.id] = e; });
      return m;
    };
    const bMap = toMap(before);
    const aMap = toMap(after);

    // หาคนที่ "สถานะเปลี่ยนจริง" (มีอยู่เดิม + status ต่างจากเดิม)
    const changed = [];
    Object.keys(aMap).forEach((id) => {
      const prev = bMap[id];
      const cur = aMap[id];
      if (prev && prev.status !== cur.status) changed.push(cur);
    });
    if (!changed.length) return null;

    // ประกอบข้อความ
    const detail = changed
      .map((e) => `${e.name || "รถ"} → ${STATUS_LABELS[e.status] || e.status}`)
      .join(" • ");
    const title = changed.some((e) => e.status === "done")
      ? "✅ มีรถว่างงานใหม่!"
      : "🔔 มีการเปลี่ยนสถานะรถ";

    // ดึง token ทั้งหมดที่ลงทะเบียนไว้
    const tokensSnap = await admin.database().ref("/pushTokens").once("value");
    const tokensData = tokensSnap.val();
    if (!tokensData) return null;
    const tokens = Object.values(tokensData)
      .map((t) => (t && t.token ? t.token : null))
      .filter(Boolean);
    if (!tokens.length) return null;

    // ส่ง push (multicast)
    const message = {
      notification: { title, body: detail },
      tokens: tokens,
    };
    const resp = await admin.messaging().sendEachForMulticast(message);

    // ลบ token ที่ใช้ไม่ได้แล้ว (เครื่องถอนแอป/หมดอายุ)
    const invalid = [];
    resp.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error && r.error.code;
        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          invalid.push(tokens[i]);
        }
      }
    });
    await Promise.all(
      invalid.map((tok) =>
        admin
          .database()
          .ref("/pushTokens/" + tok.replace(/[.#$\[\]/]/g, "_"))
          .remove()
      )
    );

    console.log(`ส่ง push ${resp.successCount}/${tokens.length} สำเร็จ`);
    return null;
  });
