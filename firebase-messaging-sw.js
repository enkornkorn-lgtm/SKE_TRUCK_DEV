// Compatibility shim สำหรับเครื่องที่เคยลงทะเบียน worker ชื่อเดิมไว้
// โหลด worker รุ่นแก้ network/cache เพื่อให้เครื่องเก่าอัปเดตได้โดยไม่ต้องลบข้อมูลเว็บไซต์
importScripts('./sw.js?v=dev-v322-transport-fix');
