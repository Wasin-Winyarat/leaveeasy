// ─────────────────────────────────────────────────────────────
// js/auth-helpers.js — ตัวช่วยกลาง อ่านข้อมูลคนที่ล็อกอินอยู่พร้อม role
// role เก็บอยู่ใน users/{uid} บน Firestore ไม่ได้อยู่ใน Firebase Auth เอง
// จึงต้องอ่านสองที่รวมกัน — ไฟล์นี้มีไว้ให้ทุกหน้าที่ต้องเช็คสิทธิ์เรียกร่วมกัน
// ─────────────────────────────────────────────────────────────

import { db, auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// คืนค่า Promise ที่ resolve เมื่อรู้สถานะล็อกอินแน่นอนแล้ว
// ล็อกอินอยู่ → { uid, displayName, email, role } · ไม่ได้ล็อกอิน → null
export function getCurrentUser() {
  return new Promise(function (resolve) {
    var เลิกฟัง = onAuthStateChanged(auth, async function (ผู้ใช้) {
      เลิกฟัง();
      if (!ผู้ใช้) { resolve(null); return; }

      var role = "employee";
      try {
        var สแนป = await getDoc(doc(db, "users", ผู้ใช้.uid));
        if (สแนป.exists() && สแนป.data().role) role = สแนป.data().role;
      } catch (err) {
        // อ่านไม่สำเร็จ ใช้ค่าเริ่มต้น employee ไปก่อน (สิทธิ์น้อยที่สุด ปลอดภัยไว้ก่อน)
      }

      resolve({
        uid: ผู้ใช้.uid,
        displayName: ผู้ใช้.displayName || ผู้ใช้.email,
        email: ผู้ใช้.email,
        role: role
      });
    });
  });
}
