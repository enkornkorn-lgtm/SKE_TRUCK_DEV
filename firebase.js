import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { getDatabase, ref, set, onValue, get, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
  import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

  const firebaseConfig = {
    apiKey: "AIzaSyDNx3pN0T_VKHMKfJOiuo5FmcZlVp73h8g",
    authDomain: "ske-status-2.firebaseapp.com",
    databaseURL: "https://ske-status-2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ske-status-2",
    storageBucket: "ske-status-2.firebasestorage.app",
    messagingSenderId: "170552278274",
    appId: "1:170552278274:web:80f699b101cc1867c5161b"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  // ── ตัวควบคุมการเชื่อมต่อ V8 ─────────────────────────────────────────────
  // ไม่ตัด socket, ไม่ reload, ไม่ล้าง cache และไม่ยิง read ซ้ำระหว่าง reconnect
  let _reconnectWatchTimer = null;
  window.forceReconnectNow = function(source){
    if (typeof window._skeDebugLog === 'function') window._skeDebugLog('Reconnect', 'V8 รอ SDK reconnect จาก ' + (source || 'manual'));
    if (window._fbConnected === true) return;
    clearInterval(_reconnectWatchTimer);
    const started = Date.now();
    _reconnectWatchTimer = setInterval(()=>{
      if (window._fbConnected === true) {
        clearInterval(_reconnectWatchTimer); _reconnectWatchTimer = null;
        if (typeof window._skeDebugLog === 'function') window._skeDebugLog('Reconnect', 'SDK reconnect สำเร็จใน ' + Math.ceil((Date.now()-started)/1000) + ' วินาที');
      } else if (Date.now()-started >= 30000) {
        clearInterval(_reconnectWatchTimer); _reconnectWatchTimer = null;
        if (typeof window._skeDebugLog === 'function') window._skeDebugLog('Reconnect', 'timeout 30 วินาที — ไม่มีการตัดต่อ socket เพิ่ม');
      }
    },1000);
  };

  // ══ ระบบเก็บ log ปัญหาจริงในเครื่อง — ดูได้จากในแอพเลย ไม่ต้องต่อคอมพิวเตอร์/USB debugging ══
  // เก็บ error จริงที่ Chrome เจอ + เหตุการณ์เชื่อมต่อสำคัญ ไว้ดูย้อนหลังตอนแบนเนอร์แดงค้าง
  const SKE_DEBUG_LOG_KEY = 'ske_debug_log';
  const SKE_DEBUG_LOG_MAX = 50;
  function skeDebugLog(type, msg){
    try{
      let log = JSON.parse(localStorage.getItem(SKE_DEBUG_LOG_KEY) || '[]');
      log.push({ t: Date.now(), type, msg: String(msg).slice(0, 500) });
      if (log.length > SKE_DEBUG_LOG_MAX) log = log.slice(log.length - SKE_DEBUG_LOG_MAX);
      localStorage.setItem(SKE_DEBUG_LOG_KEY, JSON.stringify(log));
    }catch(e){}
  }
  window._skeDebugLog = skeDebugLog;
  window.addEventListener('error', (e) => {
    skeDebugLog('JS Error', (e.message || 'unknown') + (e.filename ? ' @' + e.filename.split('/').pop() + ':' + e.lineno : ''));
  });
  window.addEventListener('unhandledrejection', (e) => {
    skeDebugLog('Promise Rejected', (e.reason && (e.reason.message || e.reason.code || e.reason)) || 'unknown');
  });

  // แสดง log ทั้งหมดเป็นหน้าต่างดูได้ — เรียกจากการแตะข้อความเวอร์ชันรัวๆ 5 ครั้ง
  window.showSkeDebugLog = function(){
    let log = [];
    try{ log = JSON.parse(localStorage.getItem(SKE_DEBUG_LOG_KEY) || '[]'); }catch(e){}
    const state = [
      'เวลาเปิดดู: ' + new Date().toLocaleString('th-TH'),
      'navigator.onLine: ' + navigator.onLine,
      'Firebase .info/connected: ' + window._fbConnected,
      'User Agent: ' + navigator.userAgent
    ].join('\n');
    const logText = log.length
      ? log.slice().reverse().map(l => `[${new Date(l.t).toLocaleString('th-TH')}] ${l.type}: ${l.msg}`).join('\n')
      : '(ยังไม่มี error บันทึกไว้ — แสดงว่ายังไม่เจอ error จริงตั้งแต่เปิดแอพครั้งนี้)';
    let modal = document.getElementById('skeDebugModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'skeDebugModal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(15,23,42,.85);display:flex;align-items:flex-end;justify-content:center;padding:0;';
      modal.innerHTML = `
        <div style="background:#fff;border-radius:16px 16px 0 0;width:100%;max-width:600px;max-height:80vh;display:flex;flex-direction:column;">
          <div style="padding:14px 16px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
            <b style="font-size:15px;">🔧 Debug Log (สำหรับส่งให้ผู้พัฒนา)</b>
            <button onclick="document.getElementById('skeDebugModal').remove()" style="border:none;background:#eee;border-radius:8px;padding:6px 12px;font-size:14px;">ปิด</button>
          </div>
          <div style="padding:12px 16px;overflow-y:auto;flex:1;">
            <div id="skeDebugState" style="background:#F3F4F6;border-radius:10px;padding:10px 12px;font-size:12px;white-space:pre-wrap;margin-bottom:10px;font-family:monospace;"></div>
            <textarea id="skeDebugText" readonly style="width:100%;min-height:300px;font-family:monospace;font-size:11px;border:1px solid #ddd;border-radius:10px;padding:10px;box-sizing:border-box;" onclick="this.select()"></textarea>
          </div>
          <div style="padding:12px 16px;border-top:1px solid #eee;">
            <button id="skeDebugCopyBtn" style="width:100%;padding:12px;background:#1E90D6;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;">📋 คัดลอกทั้งหมด</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      document.getElementById('skeDebugCopyBtn').addEventListener('click', () => {
        const full = document.getElementById('skeDebugState').textContent + '\n\n' + document.getElementById('skeDebugText').value;
        navigator.clipboard.writeText(full).then(() => {
          document.getElementById('skeDebugCopyBtn').textContent = '✅ คัดลอกแล้ว — ไปวางในแชทได้เลย';
        }).catch(() => {
          document.getElementById('skeDebugText').select();
          document.getElementById('skeDebugCopyBtn').textContent = 'กด select ข้อความแล้ว copy เองได้เลย';
        });
      });
    }
    document.getElementById('skeDebugState').textContent = state;
    document.getElementById('skeDebugText').value = logText;
  };

  // ผูกการแตะรัว 5 ครั้งกับข้อความเวอร์ชัน เพื่อเปิดหน้าต่าง debug log
  (function setupDebugTapTrigger(){
    let tapCount = 0, tapTimer = null;
    function onVersionTap(){
      tapCount++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { tapCount = 0; }, 2000);
      if (tapCount >= 5) { tapCount = 0; if (localStorage.getItem('ske_adminRole')) window.showSkeDebugLog(); }
    }
    window._skeVersionTap = onVersionTap;
    function attach(){
      document.querySelectorAll('.ske-version-tag').forEach(el => {
        if (el.dataset.debugBound) return;
        el.dataset.debugBound = '1';
        el.style.cursor = 'pointer';
        el.addEventListener('click', onVersionTap);
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
    else attach();
    // เผื่อ element เวอร์ชันถูกสร้างทีหลัง (re-render) — เช็คซ้ำเป็นระยะ
    setInterval(attach, 3000);
  })();


  // ✅ VAPID key ของโปรเจกต์ ske-status-2 (ใส่แล้ว 16/07/2569)
  const VAPID_KEY = "BP2BuLTCkxjZKw8o_Htq7jvlSIY2Uc0x6eMywhCEFirDmNGmXIPRTXhNfsVCG7RwnK3FWphgMn7eVdi9AQyjzFs";
  let _messaging = null;

  // ขอ permission + ลงทะเบียน FCM token ของเครื่องนี้ขึ้น Firebase
  // ลงทะเบียนเฉพาะ "เครื่องผู้ดูแล/แอดมิน" เท่านั้น (คนที่ต้องรับแจ้งเตือนเมื่อพนักงานเปลี่ยนสถานะ)
  window.fbRegisterPushToken = async function(role) {
    try {
      if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
      if (VAPID_KEY === "PASTE_YOUR_VAPID_KEY_HERE") { console.info('FCM: ยังไม่ได้ใส่ VAPID key — ข้ามการลงทะเบียน push'); return; }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
      // ใช้ Service Worker หลักตัวเดียวร่วมกันทั้ง PWA cache และ FCM
      const swReg = await navigator.serviceWorker.register('sw.js?v=8.2-20260725', { scope: './' });
      if (!_messaging) _messaging = getMessaging(app);
      const token = await getToken(_messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
      if (!token) return;
      // เก็บ token ไว้ใน Firebase ใต้ pushTokens/<token> = {role, ts}
      // ใช้ token เป็น key กันซ้ำ — เครื่องเดิมลงทะเบียนใหม่ก็ทับ key เดิม
      await set(ref(db, 'pushTokens/' + token.replace(/[.#$\[\]\/]/g, '_')), {
        token: token, role: role || 'admin', ts: Date.now()
      });
      localStorage.setItem('ske_push_token', token);
      console.info('FCM: ลงทะเบียน push token สำเร็จ');
      // รับข้อความตอนแอปเปิดอยู่ (foreground) — เด้ง notification เอง
      onMessage(_messaging, (payload) => {
        const n = payload.notification || {};
        if (typeof showSystemNotification === 'function') {
          showSystemNotification(n.title || '🔔 SKE TRUCK', { body: n.body || '' });
        }
        if (typeof playAlertSound === 'function') playAlertSound();
      });
    } catch (e) { console.warn('FCM register error', e); }
  };

  // ลบ token ออกจาก Firebase ตอน logout (กันแจ้งเตือนค้างไปเครื่องที่ออกจากระบบแล้ว)
  window.fbUnregisterPushToken = async function() {
    try {
      const token = localStorage.getItem('ske_push_token');
      if (token) {
        await remove(ref(db, 'pushTokens/' + token.replace(/[.#$\[\]\/]/g, '_')));
        localStorage.removeItem('ske_push_token');
      }
    } catch (e) { console.warn('FCM unregister error', e); }
  };

  // ── Firebase helpers ──────────────────────────────────────────────────────────
  window._fbReady = false;

  // Firebase RTDB อาจแปลง array → object เองเมื่อมีค่า null/ช่องว่าง (เช่นตอน set standbyAt=null หรือลบรายการกลางๆ)
  // ฟังก์ชันนี้แปลงข้อมูลที่ได้กลับมาให้เป็น array เสมอ ไม่ว่าจะมาในรูป array หรือ object
  // กันบั๊ก "ฝั่งผู้ดูแลไม่อัพเดท" เพราะเดิมถ้าได้ object กลับมาจะเช็ค Array.isArray ไม่ผ่านแล้วข้ามทิ้ง
  function normalizeList(data) {
    if (!data) return null;
    if (Array.isArray(data)) return data.filter(e => e);
    if (typeof data === 'object') {
      return Object.keys(data)
        .sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0))
        .map(k => data[k])
        .filter(e => e && typeof e === 'object');
    }
    return null;
  }
  function normalizeEmployees(data) { return normalizeList(data); }
  window._normalizeEmployees = normalizeEmployees;

  // ══ ตัวเขียน cache ลงเครื่องแบบไม่มีวันพัง ══
  // ปัญหา: localStorage มีเพดาน ~5-10MB แต่แอพเก็บสำเนาข้อมูลทุกชุด "พร้อมรูป base64" ลงเครื่อง
  // (รูปซ่อม 12 เดือน + รูปของเหลว + รูปเอกสารทุกคน + รูปโปรไฟล์) พอเต็มแล้วการเขียนใดๆ จะ throw
  // "The quota has been exceeded" ทันที — ระเบิดกลางทางตอนพนักงานอัปโหลดเอกสาร ทั้งที่รูปขึ้น Firebase สำเร็จแล้ว
  // ทางแก้: ถ้าเขียนเต็มไม่ได้ ให้ "ตัดรูปออกจาก cache ในเครื่อง" แล้วเขียนใหม่ (ข้อมูลจริง+รูปอยู่บน Firebase ครบ ไม่หายไปไหน
  // เดี๋ยว realtime sync ก็ดึงกลับมาแสดงเอง) — cache ในเครื่องมีไว้แค่ให้เปิดแอพเร็วตอนเน็ตช้าเท่านั้น
  const _SKE_CACHE_STRIP = {
    ske_emp: list => (list || []).map(e => e ? { ...e, photo: null } : e),
    ske_repairs: list => (list || []).map(r => r ? { ...r, photos: [], empPhotos: [] } : r),
    ske_fluid: list => (list || []).map(f => f ? { ...f, photos: [] } : f),
    ske_monthly_docs: list => (list || []).map(d => d ? { ...d, photo: null } : d)
  };
  function _skeCacheSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) {
      try {
        const strip = _SKE_CACHE_STRIP[key];
        if (strip) {
          localStorage.setItem(key, JSON.stringify(strip(value)));
          console.warn('[SKE] พื้นที่เก็บในเครื่องเต็ม — เก็บ cache "' + key + '" แบบไม่รวมรูปแทน (ข้อมูลจริงอยู่บน Firebase ครบ)');
          return true;
        }
      } catch (e2) { /* ยังเต็มอยู่ — ปล่อยไปลบทิ้งด้านล่าง */ }
      try { localStorage.removeItem(key); } catch (e3) {}
      console.error('[SKE] พื้นที่เก็บในเครื่องเต็มจนบันทึก cache ไม่ได้: ' + key);
      return false;
    }
  }
  window._skeCacheSet = _skeCacheSet;

  // เช็คตอนเปิดแอพ: ถ้าพื้นที่เต็มอยู่แล้ว ให้ล้างรูปออกจาก cache ทุกชุดทันที เพื่อให้แอพกลับมาบันทึกอะไรก็ได้ตามปกติ
  (function _lsHygiene() {
    try { localStorage.setItem('ske_quota_canary', '1'); localStorage.removeItem('ske_quota_canary'); return; } catch (e) {}
    console.warn('[SKE] ตรวจพบพื้นที่เก็บในเครื่องเต็ม — กำลังล้างรูปออกจาก cache เพื่อกู้พื้นที่');
    Object.keys(_SKE_CACHE_STRIP).forEach(k => {
      try {
        const v = JSON.parse(localStorage.getItem(k) || 'null');
        if (Array.isArray(v)) _skeCacheSet(k, v); // ถ้ายังเต็มจะถูก strip รูปให้อัตโนมัติ
      } catch (e) { try { localStorage.removeItem(k); } catch (e2) {} }
    });
  })();

  // หา "คีย์จริง" ของรายการบน Firebase ก่อนเขียนแบบเจาะจงตำแหน่ง (กันแพตช์ลงผิดคน)
  // ปัญหา: Firebase เก็บ array เป็น object {0:..,1:..} — ถ้าบนเซิร์ฟเวอร์มีช่องว่าง (จากการลบ/เขียนพลาดในอดีต)
  // แล้วฝั่งเครื่อง normalize บีบลำดับใหม่ ตำแหน่งจะคลาดกัน → แพตช์ "จังหวัด/สถานะ" ไปลงคนข้างๆแทน
  // วิธีนี้: เช็คตำแหน่งที่คาดไว้ก่อน โดยอ่านแค่ฟิลด์ id ฟิลด์เดียว (เบามาก ไม่กี่ไบต์ แม้เน็ตอ่อนก็เร็ว)
  // ถ้าตรง → ใช้เลย ถ้าไม่ตรง/อ่านไม่ได้ → โหลดชุดดิบจากเซิร์ฟเวอร์แล้วไล่หาคีย์จริงจาก id (ไม่ผ่าน normalize เพื่อไม่ให้ index เพี้ยน)
  async function _findServerKey(path, itemId, localList) {
    const localIdx = Array.isArray(localList) ? localList.findIndex(x => x && x.id === itemId) : -1;
    if (localIdx !== -1) {
      try {
        const s = await _withTimeout(get(ref(db, path + '/' + localIdx + '/id')), 8000, 'timeout:verify-id');
        if (s.val() === itemId) return String(localIdx);
      } catch (e) { /* เช็คเร็วไม่ผ่าน — ตกไปหาจากชุดเต็มด้านล่าง */ }
    }
    const snap = await _withTimeout(get(ref(db, path)), SKE_WRITE_TIMEOUT_MS, 'timeout:' + path + '-get');
    const raw = snap.val();
    if (!raw) return null;
    if (Array.isArray(raw)) {
      for (let i = 0; i < raw.length; i++) if (raw[i] && raw[i].id === itemId) return String(i);
      return null;
    }
    if (typeof raw === 'object') {
      for (const k of Object.keys(raw)) if (raw[k] && raw[k].id === itemId) return k;
    }
    return null;
  }

  // ══ คลังรูปแยก (photo store) ══
  // หัวใจของการลด bandwidth: ข้อมูลหลัก (employees/repairs/ฯลฯ) เก็บแค่ "รหัสรูป" (ph_...)
  // ตัวรูป base64 จริงแยกเก็บที่โหนด photos/{id} ซึ่ง "ไม่มี listener" — จะโหลดก็ต่อเมื่อผู้ใช้เปิดดูเท่านั้น
  // ผลลัพธ์: เปิดแอป/ซิงก์แต่ละครั้งโหลดแค่ข้อความไม่กี่ร้อย KB แทนที่จะเป็นรูปทั้งระบบหลาย MB ทุกรอบ
  window.fbSavePhoto = function(photoId, dataUrl) {
    return _withTimeout(update(ref(db), { ['photos/' + photoId]: dataUrl }), 30000, 'timeout:photo-save');
  };
  window.fbGetPhotoRemote = function(photoId) {
    return _withTimeout(get(ref(db, 'photos/' + photoId)), 20000, 'timeout:photo-get').then(s => s.val() || null);
  };
  window.fbDeletePhotos = function(ids) {
    const updates = {};
    (ids || []).forEach(id => { if (id && !String(id).startsWith('data:')) updates['photos/' + id] = null; });
    if (!Object.keys(updates).length) return Promise.resolve();
    return update(ref(db), updates).catch(() => {});
  };

  // ติดตามว่าแต่ละชุดข้อมูล sync ครั้งแรกเสร็จหรือยัง — ใช้กันบั๊ก "ข้อมูลที่ลบไปแล้วฟื้นคืนชีพ"
  // (เดิม: พอลบรายการจนหมด ข้อมูลเป็น null → listener เข้าใจผิดว่า Firebase ว่าง แล้วอัพโหลดข้อมูลเก่าในเครื่องกลับขึ้นไป)
  // หลักการใหม่: อัพโหลดข้อมูลเครื่องขึ้น Firebase ได้ "เฉพาะครั้งแรกสุด" เท่านั้น หลังจากนั้น null = ว่างจริง ให้เคารพค่าว่าง
  const _firstSync = { employees:false, vehicles:false, repairs:false, fluidLogs:false, cashRequests:false, leaveLogs:false, runLogs:false, monthlyDocs:false, jobPlan:false, jobRouteTemplates:false, feedbacks:false };

  // ══ ระบบกันบันทึกหาย (Offline-safe save queue / outbox) ═══════════════════════
  // ปัญหาเดิม: ถ้าเน็ตหลุด/อ่อนตอนกำลังบันทึก (เปลี่ยนสถานะ, อัปโหลดรูป, แจ้งซ่อม, เบิกเงิน, ลา ฯลฯ)
  // การเขียนขึ้น Firebase อาจ "ค้างไม่มีกำหนด" หรือ "ล้มเหลวเงียบๆ" โดยไม่แจ้งเตือนและไม่มีการส่งซ้ำ
  // ถ้าผู้ใช้ปิดแอพ/รีเฟรชระหว่างนั้น ข้อมูลที่เพิ่งเปลี่ยนจะหายไปเลย เพราะยังไม่ทันขึ้น Firebase จริง
  // แล้วพอเปิดแอพใหม่ ตัว onValue จะดึงค่าเก่าจากเซิร์ฟเวอร์มาทับข้อมูลในเครื่องทันที ดูเหมือน "สถานะย้อนกลับ"
  //
  // ทางแก้: ทุกครั้งที่เริ่มบันทึกจะขึ้น "งานค้าง" ไว้ใน localStorage (outbox) ก่อน แล้วค่อยลบออกเมื่อสำเร็จ
  // ตราบใดที่ยังมีงานค้างของชุดข้อมูลไหนอยู่ onValue ของชุดนั้นจะ "ไม่เอาข้อมูลเซิร์ฟเวอร์มาทับข้อมูลเครื่อง"
  // และระบบจะพยายามส่งซ้ำอัตโนมัติทุก 8 วิ และทันทีที่เน็ตกลับมา (.info/connected) จนกว่าจะสำเร็จ
  console.log('[SKE TRUCK] app version: v2026.07.25-connection-v8.3-startup-screen-fix');
  const SKE_OUTBOX_KEY = 'ske_outbox_v1';
  // งานค้างมีอายุจำกัด — เกินนี้ให้ "ทิ้ง" แทนที่จะส่งซ้ำ เพราะ payload เป็นข้อมูลทั้งชุด ณ เวลานั้น
  // ถ้าปล่อยให้คิวเก่าหลายนาที/ชั่วโมงส่งสำเร็จทีหลัง มันจะเอาข้อมูล "ทั้งก้อนเวอร์ชันเก่า" ทับขึ้นเซิร์ฟเวอร์
  // ลบสถานะ/จังหวัดที่เครื่องอื่นๆ เพิ่งอัพเดทไประหว่างนั้นทิ้งทั้งหมด (อันตรายกว่าเสียงานค้าง 1 รายการมาก)
  // และตราบใดที่คิวค้างอยู่ onValue จะไม่รับข้อมูลใหม่จากเซิร์ฟเวอร์เลย = เครื่องนั้นค้างของเก่าถาวร
  const SKE_OUTBOX_MAX_AGE_MS = 10 * 60 * 1000;
  function _obLoad() { try { return JSON.parse(localStorage.getItem(SKE_OUTBOX_KEY) || '{}'); } catch (e) { return {}; } }
  function _obSaveAll(ob) { try { localStorage.setItem(SKE_OUTBOX_KEY, JSON.stringify(ob)); } catch (e) {} }
  function _obMark(key, payload) { const ob = _obLoad(); ob[key] = { payload, ts: Date.now() }; _obSaveAll(ob); _obUpdateIndicator(); }
  function _obClear(key) { const ob = _obLoad(); if (ob[key]) { delete ob[key]; _obSaveAll(ob); _obUpdateIndicator(); } }
  function _obHas(key) { return !!_obLoad()[key]; }
  // เช็คว่ามีงานค้างที่ "ยังไม่หมดอายุ" ไหม — ถ้าหมดอายุแล้วให้ล้างทิ้งทันทีและถือว่าไม่มี
  // ใช้กับ onValue guard เพื่อไม่ให้เครื่องที่มีคิวเก่าค้าง ปิดกั้นตัวเองจากข้อมูลใหม่บนเซิร์ฟเวอร์ตลอดไป
  function _obHasFresh(key) {
    const entry = _obLoad()[key];
    if (!entry) return false;
    if (Date.now() - (entry.ts || 0) > SKE_OUTBOX_MAX_AGE_MS) {
      console.warn('[SKE outbox] งานค้าง "' + key + '" หมดอายุ (เกิน 10 นาที) — ทิ้งเพื่อไม่ให้ข้อมูลเก่าย้อนไปทับเซิร์ฟเวอร์');
      _obClear(key);
      return false;
    }
    return true;
  }
  function _obUpdateIndicator() {
    const n = Object.keys(_obLoad()).length;
    if (typeof window._setSyncPending === 'function') window._setSyncPending(n > 0);
  }
  // ครอบ Promise ด้วย timeout กันเคส get()/set()/update() ค้างรอเฉยๆไม่มีกำหนดตอนเน็ตแย่
  function _withTimeout(promise, ms, msg) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(msg || 'timeout')), ms))
    ]);
  }
  const SKE_WRITE_TIMEOUT_MS = 25000;
  // ส่งข้อมูลค้าง (ถ้ามี) ของทุกชุดซ้ำอีกครั้ง — เรียกตอนเน็ตกลับมา หรือทุก 8 วิ
  function _obFlushAll() {
    const ob = _obLoad();
    Object.keys(ob).forEach(key => {
      const entry = ob[key];
      if (!entry) return;
      // งานค้างเก่าเกินไป — ห้ามส่ง (payload ทั้งชุด ณ เวลานั้นจะไปทับข้อมูลใหม่ของเครื่องอื่น) ทิ้งแล้วปลดล็อกรับข้อมูลใหม่
      if (Date.now() - (entry.ts || 0) > SKE_OUTBOX_MAX_AGE_MS) {
        console.warn('[SKE outbox] งานค้าง "' + key + '" หมดอายุ — ทิ้ง ไม่ส่งซ้ำ');
        _obClear(key);
        return;
      }
      if (key === 'employees' && window.fbSaveEmployees) window.fbSaveEmployees(entry.payload);
      else if (key === 'vehicles' && window.fbSaveVehicles) window.fbSaveVehicles(entry.payload);
      else if (key === 'repairs' && window.fbSaveRepairs) window.fbSaveRepairs(entry.payload);
      else if (key === 'fluidLogs' && window.fbSaveFluidLogs) window.fbSaveFluidLogs(entry.payload);
      else if (key === 'cashRequests' && window.fbSaveCashRequests) window.fbSaveCashRequests(entry.payload);
      else if (key === 'leaveLogs' && window.fbSaveLeaveLogs) window.fbSaveLeaveLogs(entry.payload);
      else if (key === 'monthlyDocs' && window.fbSaveMonthlyDocs) window.fbSaveMonthlyDocs(entry.payload);
      else if (key === 'jobPlan' && window.fbSaveJobPlan) window.fbSaveJobPlan(entry.payload);
      else if (key === 'jobRouteTemplates' && window.fbSaveJobRouteTemplates) window.fbSaveJobRouteTemplates(entry.payload);
      else if (key === 'feedbacks' && window.fbSaveFeedbacks) window.fbSaveFeedbacks(entry.payload);
    });
  }
  let _fbConnectedAt = 0;
  setInterval(() => {
    if (window._fbConnected === true && Date.now() - _fbConnectedAt >= 15000 && Object.keys(_obLoad()).length > 0) _obFlushAll();
  }, 8000);
  window._obHas = _obHas;

  // ── แถบแจ้งสถานะซิงค์ข้อมูล/ออฟไลน์ (ไม่มีมาก่อน) ──────────────────────────────
  // ให้พนักงานเห็นชัดว่า "ยังบันทึกไม่เสร็จ อย่าเพิ่งปิดแอพ" แทนที่จะปิดแอพไปเงียบๆ แล้วข้อมูลหาย
  (function initSyncBanner(){
    function ensureBanner(){
      let el = document.getElementById('skeSyncBanner');
      if (el) return el;
      el = document.createElement('div');
      el.id = 'skeSyncBanner';
      // เผื่อ safe-area ด้านล่าง (gesture bar ของมือถือ) กันพื้นที่แตะไปโดนโซนสไวป์ระบบ
      el.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;display:none;align-items:center;justify-content:center;gap:8px;padding:9px 14px calc(9px + env(safe-area-inset-bottom,0px)) 14px;font-size:12.5px;font-weight:800;color:#fff;text-align:center;transition:background .2s;pointer-events:auto;-webkit-tap-highlight-color:rgba(255,255,255,.25);touch-action:manipulation;';
      document.body.appendChild(el);
      // ผูก listener ครั้งเดียวตอนสร้าง element — ใช้ addEventListener แทน el.onclick เพราะบางมือถือ
      // แตะแล้ว onclick ไม่ยิง ถ้า event ก่อนหน้าถูก preventDefault ไว้ที่อื่น ส่วน touchend ช่วยให้ตอบสนองไวขึ้นด้วย
      let _lastTap = 0;
      const handleTap = (ev) => {
        if (!el.dataset.offline) return; // แตะได้เฉพาะตอนแดง (offline) เท่านั้น
        const now = Date.now();
        if (now - _lastTap < 800) return; // กันแตะรัว/กัน touchend+click ยิงซ้อนกัน
        _lastTap = now;
        if (ev && ev.type === 'touchend') ev.preventDefault();
        // ให้ผลตอบรับทันทีแบบ sync ก่อน ไม่ต้องรอผล reconnect เพื่อให้รู้ว่าแตะติดแล้ว
        if (typeof window._setReconnecting === 'function') window._setReconnecting(true);
        if (typeof window.forceReconnectNow === 'function') {
          window.forceReconnectNow();
        } else {
          // เผื่อกรณีร้ายแรงที่ฟังก์ชันยังไม่พร้อมด้วยเหตุผลใดก็ตาม — รีโหลดหน้าเป็นทางสำรองสุดท้าย
          setTimeout(() => location.reload(), 300);
        }
      };
      el.addEventListener('touchend', handleTap, {passive:false});
      el.addEventListener('click', handleTap);
      return el;
    }
    let offline = false, pending = false, reconnecting = false;
    function render(){
      const el = ensureBanner();
      if (reconnecting) {
        delete el.dataset.offline;
        el.style.display='flex'; el.style.background='#F59E0B'; el.style.cursor='default';
        el.textContent = '🔄 กำลังลองเชื่อมต่อใหม่...';
      } else if (offline) {
        el.dataset.offline = '1';
        el.style.display='flex'; el.style.background='#DC2626'; el.style.cursor='pointer';
        el.textContent = '📡 เน็ตหลุดอยู่ — แตะตรงนี้เพื่อลองเชื่อมต่อใหม่';
        // ปิดการเด้ง debug log อัตโนมัติแล้ว (เลือกใช้แบบแตะเวอร์ชัน 5 ครั้งเองแทน ตามที่ผู้ใช้ต้องการ)
      } else {
        delete el.dataset.offline;
        if (pending) {
          el.style.display='flex'; el.style.background='#F59E0B'; el.style.cursor='default';
          el.textContent = '🔄 กำลังซิงค์ข้อมูล... กรุณาอย่าเพิ่งปิดแอพ';
        } else {
          el.style.display='none';
        }
      }
    }
    // ── ป้องกันแบนเนอร์ "เน็ตหลุด" เป็นๆ หายๆ จาก .info/connected ที่ flap บ่อย ──
    // ผสม 2 สัญญาณ: .info/connected (websocket ถึง Firebase) + navigator.onLine (เน็ตเวิร์กระดับเครื่อง)
    // - เน็ตเครื่องหลุดจริง (navigator.onLine=false) → โชว์แดงทันที ไม่ต้องรอ
    // - แค่ websocket Firebase สะดุด (navigator.onLine=true) → รอ debounce ก่อนค่อยโชว์ กันกระตุกสั้นๆ
    // - กลับมาออนไลน์ → รอ debounce สั้นๆ ก่อนซ่อน กัน flap ซ้ำถี่ๆ
    const DISCONNECT_DEBOUNCE_MS = 12000; // ต้องหลุดต่อเนื่องเกินนี้ถึงจะถือว่าหลุดจริง (ถ้า navigator.onLine ยัง true)
    const RECONNECT_DEBOUNCE_MS = 1000;  // รอสั้นๆ ก่อนซ่อนแดง กัน flap ซ้ำ
    let disconnectTimer = null, reconnectTimer = null;
    window._fbConnected = true; // ค่าเริ่มต้น เผื่อ listener ยังไม่ยิง event แรก

    function setOfflineNow(isOffline){
      offline = isOffline;
      if (typeof window._skeDebugLog === 'function') window._skeDebugLog('Connection', isOffline ? 'แสดงแบนเนอร์แดง (offline)' : 'ซ่อนแบนเนอร์แดง (online)');
      render();
    }

    window._setOnlineDot = function(connected){
      window._fbConnected = connected;
      if (typeof window._skeDebugLog === 'function') window._skeDebugLog('Firebase .info/connected', connected ? 'true (ต่อติด)' : 'false (หลุด) — navigator.onLine=' + navigator.onLine);
      clearTimeout(disconnectTimer);
      clearTimeout(reconnectTimer);

      if (connected) {
        reconnectTimer = setTimeout(() => setOfflineNow(false), RECONNECT_DEBOUNCE_MS);
      } else {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          // เน็ตเครื่องหลุดจริง — โชว์ทันที ไม่ต้องรอ
          setOfflineNow(true);
        } else {
          // websocket Firebase สะดุดเฉยๆ รอดูก่อนว่า reconnect เองไหม
          disconnectTimer = setTimeout(() => {
            if (window._fbConnected === false) setOfflineNow(true);
          }, DISCONNECT_DEBOUNCE_MS);
        }
      }
    };
    window._setSyncPending = function(isPending){ pending = !!isPending; render(); };
    window._setReconnecting = function(isReconnecting){ reconnecting = !!isReconnecting; render(); };

    // navigator.onLine เชื่อถือได้เรื่อง "เน็ตเครื่องหลุดจริงไหม" — ใช้เสริมเป็นสัญญาณแม่นสุด
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => window._setOnlineDot(window._fbConnected));
      window.addEventListener('offline', () => { clearTimeout(disconnectTimer); clearTimeout(reconnectTimer); setOfflineNow(true); });
    }

    if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>{ ensureBanner(); });
    else ensureBanner();
  })();


  // V8.2: listener สถานะการเชื่อมต่อหลัก — ต้องมีเพียงหนึ่งตัว
  // ใช้ .info/connected จาก RTDB เป็นแหล่งความจริง แล้วส่งสถานะให้ UI
  // เก็บ unsubscribe ไว้บน window เพื่อกันติดตั้งซ้ำ หากสคริปต์ถูกโหลดซ้ำโดยไม่ตั้งใจ
  if (typeof window._skeInfoConnectedUnsubscribe === 'function') {
    try { window._skeInfoConnectedUnsubscribe(); } catch (e) {}
  }
  window._skeInfoConnectedUnsubscribe = onValue(
    ref(db, '.info/connected'),
    (snapshot) => {
      const connected = snapshot.val() === true;
      if (connected) _fbConnectedAt = Date.now();
      if (typeof window._setOnlineDot === 'function') {
        window._setOnlineDot(connected);
      } else {
        window._fbConnected = connected;
      }
    },
    (error) => {
      window._fbConnected = false;
      if (typeof window._setOnlineDot === 'function') window._setOnlineDot(false);
      if (typeof window._skeDebugLog === 'function') {
        window._skeDebugLog('.info/connected error', error && (error.code || error.message || String(error)));
      }
    }
  );



  // บันทึกข้อมูลพนักงานทั้งหมดขึ้น Firebase
  window.fbSaveEmployees = function(emps) {
    _obMark('employees', emps);
    return _withTimeout(set(ref(db, 'employees'), emps), SKE_WRITE_TIMEOUT_MS, 'timeout:employees')
      .then(() => { _obClear('employees'); })
      .catch(e => console.error('fbSave error', e));
  };

  // อัพเดทเฉพาะ "ของพนักงานคนเดียว" (ดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์มาก่อนแล้วแก้เฉพาะฟิลด์ที่เปลี่ยน)
  // ป้องกันปัญหาเขียนทับทั้งรายชื่อแล้วทำสถานะของพนักงานคนอื่นที่เพิ่งอัพเดทไปหายโดยไม่ได้ตั้งใจ
  // ครอบด้วย timeout กันเคสเน็ตช้า/หลุดกลางทางแล้วค้างรอไม่มีกำหนด (จุดที่ .catch fallback ของทุกจุดเรียกจะยังทำงานได้)
  window.fbUpdateEmployeeFields = async function(empId, patch) {
    const key = await _findServerKey('employees', empId, employees);
    if (key == null) throw new Error('employee not found');
    const updates = {};
    Object.keys(patch).forEach(k => { updates[`employees/${key}/${k}`] = patch[k]; });
    await _withTimeout(update(ref(db), updates), SKE_WRITE_TIMEOUT_MS, 'timeout:employees-update');
    employees = (employees || []).map(e => e && e.id === empId ? { ...e, ...patch } : e);
    _skeCacheSet('ske_emp', employees);
    _obClear('employees');
  };

  // บันทึกรายการรถทั้งหมดขึ้น Firebase (ทะเบียนรถเป็น "เอนทิตี้แยก" ไม่ผูกกับพนักงานอีกต่อไป)
  window.fbSaveVehicles = function(list) {
    _obMark('vehicles', list);
    return _withTimeout(set(ref(db, 'vehicles'), list), SKE_WRITE_TIMEOUT_MS, 'timeout:vehicles')
      .then(() => { _obClear('vehicles'); })
      .catch(e => console.error('fbSaveVehicles error', e));
  };

  // อัพเดทเฉพาะ "รถคันเดียว" (ดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์มาก่อนแล้วแก้เฉพาะฟิลด์ที่เปลี่ยน)
  window.fbUpdateVehicleFields = async function(vehId, patch) {
    const key = await _findServerKey('vehicles', vehId, vehicles);
    if (key == null) throw new Error('vehicle not found');
    const updates = {};
    Object.keys(patch).forEach(k => { updates[`vehicles/${key}/${k}`] = patch[k]; });
    await _withTimeout(update(ref(db), updates), SKE_WRITE_TIMEOUT_MS, 'timeout:vehicles-update');
    vehicles = (vehicles || []).map(v => v && v.id === vehId ? { ...v, ...patch } : v);
    localStorage.setItem('ske_vehicles', JSON.stringify(vehicles));
    _obClear('vehicles');
  };

  // บันทึก admin password (รหัสผู้ดูแล — สิทธิ์เต็ม) — เก็บเป็น SHA-256 hash เท่านั้น ไม่ส่ง/เก็บ plain text ขึ้น Firebase อีกต่อไป
  window.fbSaveAdminPwHash = function(hash) {
    set(ref(db, 'adminPwHash'), hash).catch(e => console.error('fbSavePw error', e));
  };

  // บันทึก viewer password (รหัสแอดมิน — ดูเฉพาะแผนผังงาน) — เก็บเป็น hash เท่านั้น
  window.fbSaveViewerPwHash = function(hash) {
    set(ref(db, 'viewerPwHash'), hash).catch(e => console.error('fbSaveViewerPw error', e));
  };

  // บันทึก PIN ชั้นที่ 2 (รหัสยืนยันเพิ่มเติมตอนล็อกอินหลังบ้าน) — เก็บเป็น hash เท่านั้น
  window.fbSaveAdminPin2Hash = function(hash) {
    set(ref(db, 'adminPin2Hash'), hash).catch(e => console.error('fbSavePin2 error', e));
  };

  // บันทึกรหัสฉุกเฉิน (Emergency Code) — เก็บเป็น hash เท่านั้น ห้ามเก็บ plain text ในไฟล์เด็ดขาด (จะถูก view-source เห็นได้)
  window.fbSaveEmergencyCodeHash = function(hash) {
    set(ref(db, 'emergencyCodeHash'), hash).catch(e => console.error('fbSaveEmerg error', e));
  };

  // บันทึกรายการแจ้งซ่อมขึ้น Firebase
  window.fbSaveRepairs = function(list) {
    _obMark('repairs', list);
    return _withTimeout(set(ref(db, 'repairs'), list), SKE_WRITE_TIMEOUT_MS, 'timeout:repairs')
      .then(() => { _obClear('repairs'); })
      .catch(e => { console.error('fbSaveRepairs error', e); throw e; });
  };

  // อัพเดทเฉพาะ "รายการแจ้งซ่อมรายการเดียว" (ดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์มาก่อนแล้วแก้เฉพาะฟิลด์ที่เปลี่ยน)
  // แก้ปัญหาเดิม: repairs เก็บรูปแนบสะสมไว้ 12 เดือน พอมีคนเดียวเปลี่ยน 1 รายการ (เช่นแนบรูปเพิ่ม)
  // ระบบเดิมจะอัพโหลด "ประวัติทั้งหมดของทุกคน" ซ้ำทุกครั้ง ทำให้ช้ามากบนเน็ตมือถือ และเสี่ยง timeout จนบันทึกไม่สำเร็จแบบเงียบๆ
  window.fbUpdateRepairFields = async function(repairId, patch) {
    const key = await _findServerKey('repairs', repairId, repairs);
    if (key == null) throw new Error('repair not found');
    const updates = {};
    Object.keys(patch).forEach(k => { updates[`repairs/${key}/${k}`] = patch[k]; });
    await _withTimeout(update(ref(db), updates), SKE_WRITE_TIMEOUT_MS, 'timeout:repairs-update');
    repairs = (repairs || []).map(r => r && r.id === repairId ? { ...r, ...patch } : r);
    _skeCacheSet('ske_repairs', repairs);
    _obClear('repairs');
  };

  // บันทึกรายการเปลี่ยนถ่ายของเหลวขึ้น Firebase
  window.fbSaveFluidLogs = function(list) {
    _obMark('fluidLogs', list);
    return _withTimeout(set(ref(db, 'fluidLogs'), list), SKE_WRITE_TIMEOUT_MS, 'timeout:fluidLogs')
      .then(() => { _obClear('fluidLogs'); })
      .catch(e => { console.error('fbSaveFluidLogs error', e); throw e; });
  };

  // อัพเดทเฉพาะ "รายการเปลี่ยนถ่ายของเหลวรายการเดียว" — เหตุผลเดียวกับ fbUpdateRepairFields ด้านบน
  window.fbUpdateFluidFields = async function(fluidId, patch) {
    const key = await _findServerKey('fluidLogs', fluidId, fluidLogs);
    if (key == null) throw new Error('fluid log not found');
    const updates = {};
    Object.keys(patch).forEach(k => { updates[`fluidLogs/${key}/${k}`] = patch[k]; });
    await _withTimeout(update(ref(db), updates), SKE_WRITE_TIMEOUT_MS, 'timeout:fluidLogs-update');
    fluidLogs = (fluidLogs || []).map(f => f && f.id === fluidId ? { ...f, ...patch } : f);
    _skeCacheSet('ske_fluid', fluidLogs);
    _obClear('fluidLogs');
  };

  // บันทึกรายการเบิกเงินพนักงานขึ้น Firebase
  window.fbSaveCashRequests = function(list) {
    _obMark('cashRequests', list);
    return _withTimeout(set(ref(db, 'cashRequests'), list), SKE_WRITE_TIMEOUT_MS, 'timeout:cashRequests')
      .then(() => { _obClear('cashRequests'); })
      .catch(e => console.error('fbSaveCashRequests error', e));
  };

  // บันทึกประวัติการลาขึ้น Firebase
  window.fbSaveLeaveLogs = function(list) {
    _obMark('leaveLogs', list);
    return _withTimeout(set(ref(db, 'leaveLogs'), list), SKE_WRITE_TIMEOUT_MS, 'timeout:leaveLogs')
      .then(() => { _obClear('leaveLogs'); })
      .catch(e => console.error('fbSaveLeaveLogs error', e));
  };

  // บันทึกประวัติเที่ยววิ่งงาน (บันทึกถาวร ไม่ขึ้นกับสถานะปัจจุบันของพนักงาน) ขึ้น Firebase
  window.fbSaveRunLogs = function(list) {
    set(ref(db, 'runLogs'), list).catch(e => console.error('fbSaveRunLogs error', e));
  };

  // ดึงข้อมูลล่าสุดจาก Firebase ทันที (สำหรับปุ่มรีเฟรชของผู้ดูแล)
  window.fbForceRefresh = function(cb) {
    // V8: ตัด startup get() ที่ซ้ำกับ realtime onValue() ออกทั้งหมด
  // ลด burst read ตอนเปิดแอปและตอน connection กลับมา
  window._fbReady = true;


  // ══ Monthly document submissions — realtime Firebase sync ══
  // คืนค่า Promise เสมอ เพื่อให้ฝั่งอัปโหลดรอจน Firebase บันทึกสำเร็จจริงก่อนแจ้งผล
  window.fbSaveMonthlyDocs = function(list) {
    const clean = Array.isArray(list) ? list.filter(x => x && typeof x === 'object') : [];
    _obMark('monthlyDocs', clean);
    return _withTimeout(set(ref(db, 'monthlyDocs'), clean), SKE_WRITE_TIMEOUT_MS, 'timeout:monthlyDocs')
      .then(() => { _obClear('monthlyDocs'); })
      .catch(e => { console.error('fbSaveMonthlyDocs error', e); throw e; });
  };

  // อัปเดตเอกสารรายคนแบบปลอดภัย — ใช้ข้อมูลที่ sync แบบเรียลไทม์ไว้ในเครื่องอยู่แล้วก่อนเสมอ (ไม่ต้องดึงทั้งก้อนใหม่ทุกครั้ง)
  // แก้ปัญหาเดิม: ก่อนหน้านี้ทุกครั้งที่ส่งเอกสาร ต้อง get() รูปเอกสารของพนักงาน "ทุกคน" ในเดือนนั้นก่อน แล้วค่อย set() ทั้งก้อนกลับ
  // บนเน็ตมือถือที่สัญญาณอ่อน ก้อนข้อมูลนี้ (รวมรูปของทุกคน) มักโหลดไม่ทันภายใน timeout ทำให้ "ดึงข้อมูลไม่สำเร็จ" บ่อยๆ
  // ตอนนี้ถ้าเครื่องเคย sync ข้อมูลชุดนี้มาแล้วอย่างน้อย 1 ครั้ง (มี realtime listener คอยอัพเดทอยู่แล้ว) จะใช้ข้อมูลในเครื่องเลย
  // แล้วเขียนขึ้น Firebase "เฉพาะรายการของตัวเอง" เท่านั้น ไม่แตะรูปของคนอื่น — เร็วขึ้นมากบนสัญญาณอ่อน
  window.fbUpsertMonthlyDoc = async function(rec) {
    if (!rec || !rec.id) throw new Error('invalid monthly doc record');
    if (window._fbConnected === false) throw new Error('การเชื่อมต่ออินเทอร์เน็ตหลุดอยู่ กรุณาเช็คสัญญาณแล้วลองใหม่');
    // หา "คีย์จริง" ของรายการนี้บนเซิร์ฟเวอร์ก่อนเสมอ (ยืนยันด้วย id กันเขียนทับรายการของคนอื่น)
    let key = await _findServerKey('monthlyDocs', rec.id, monthlyDocs);
    if (key == null) {
      // ยังไม่เคยส่งเดือนนี้ — ต้องหา slot ว่างต่อท้ายจากข้อมูลดิบบนเซิร์ฟเวอร์ (ไม่ผ่าน normalize กัน index เพี้ยน)
      const snap = await _withTimeout(get(ref(db, 'monthlyDocs')), 25000, 'เชื่อมต่อ Firebase ช้าเกินไป (ดึงข้อมูลไม่สำเร็จ) กรุณาลองใหม่เมื่อสัญญาณเน็ตดีขึ้น');
      const raw = snap.val();
      if (!raw) key = '0';
      else if (Array.isArray(raw)) key = String(raw.length);
      else {
        const nums = Object.keys(raw).map(k => parseInt(k, 10)).filter(n => !isNaN(n));
        key = String(nums.length ? Math.max(...nums) + 1 : 0);
      }
    }
    await _withTimeout(update(ref(db), { [`monthlyDocs/${key}`]: rec }), 30000, 'บันทึกไม่สำเร็จเพราะเน็ตช้า/หลุดระหว่างส่ง กรุณาลองส่งใหม่อีกครั้ง (รูปยังไม่ถูกบันทึก)');
    const exists = (monthlyDocs || []).some(x => x && x.id === rec.id);
    monthlyDocs = exists ? monthlyDocs.map(x => x && x.id === rec.id ? rec : x) : (monthlyDocs || []).concat([rec]);
    _skeCacheSet('ske_monthly_docs', monthlyDocs);
    return monthlyDocs;
  };


  // อัพเดทเฉพาะฟิลด์ของเอกสารรายการเดียว (เช่น อนุมัติ/ไม่อนุมัติ) — ยืนยันคีย์จริงบนเซิร์ฟเวอร์ก่อนเขียนเสมอ กันแพตช์ลงผิดรายการ
  window.fbUpdateMonthlyDocFields = async function(docId, patch) {
    const key = await _findServerKey('monthlyDocs', docId, monthlyDocs);
    if (key == null) throw new Error('monthly doc not found');
    const updates = {};
    Object.keys(patch).forEach(k => { updates[`monthlyDocs/${key}/${k}`] = patch[k]; });
    await _withTimeout(update(ref(db), updates), SKE_WRITE_TIMEOUT_MS, 'timeout:monthlyDocs-update');
    monthlyDocs = (monthlyDocs || []).map(d => d && d.id === docId ? { ...d, ...patch } : d);
    _skeCacheSet('ske_monthly_docs', monthlyDocs);
  };

  window.fbGetMonthlyDocs = async function() {
    const snap = await get(ref(db, 'monthlyDocs'));
    return normalizeList(snap.val()) || [];
  };

  onValue(ref(db, 'monthlyDocs'), (snapshot) => {
    const data = normalizeList(snapshot.val());
    if (data) {
      monthlyDocs = data;
      _skeCacheSet('ske_monthly_docs', data);
      const dash = document.getElementById('dashboard');
      const admin = document.getElementById('admin');
      if (dash && !dash.classList.contains('hidden') && typeof renderDashboard === 'function') renderDashboard();
      if (admin && !admin.classList.contains('hidden') && typeof renderAdmin === 'function') renderAdmin();
    } else if (!_firstSync.monthlyDocs) {
      monthlyDocs = [];
      localStorage.setItem('ske_monthly_docs', '[]');
    } else {
      monthlyDocs = [];
      localStorage.setItem('ske_monthly_docs', '[]');
      const dash = document.getElementById('dashboard');
      const admin = document.getElementById('admin');
      if (dash && !dash.classList.contains('hidden') && typeof renderDashboard === 'function') renderDashboard();
      if (admin && !admin.classList.contains('hidden') && typeof renderAdmin === 'function') renderAdmin();
    }
    _firstSync.monthlyDocs = true;
  });
  get(ref(db, 'feedbacks')).then(snapshot => {
    const data = normalizeList(snapshot.val());
    if (data) {
      companyFeedbacks = data;
      _skeCacheSet('ske_feedbacks', data);
    }
    _firstSync.feedbacks = true;
  }).catch(e => { _firstSync.feedbacks = true; console.error('fbGet feedbacks error', e); });
