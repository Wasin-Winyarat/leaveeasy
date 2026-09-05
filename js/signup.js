// ─────────────────────────────────────────────────────────────
// js/signup.js — หน้าสมัครสมาชิก
// สัปดาห์ที่ 7: สมัครด้วยอีเมล/รหัสผ่านผ่าน Firebase Authentication
// สมัครสำเร็จแล้วสร้างไฟล์ใน users/{uid} ทันที role เริ่มต้นเป็น employee เสมอ
// ─────────────────────────────────────────────────────────────

import { db, auth } from "./firebase-config.js";
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

var ฟอร์ม = document.getElementById("ฟอร์มสมัคร");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่มสมัคร = document.getElementById("ปุ่มสมัคร");

ฟอร์ม.addEventListener("submit", async function (e) {
  e.preventDefault();

  var ค่า = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value
  };

  if (!ค่า.name || !ค่า.email || !ค่า.password) {
    เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนสมัคร");
    return;
  }

  ปุ่มสมัคร.disabled = true;

  try {
    var ผล = await createUserWithEmailAndPassword(auth, ค่า.email, ค่า.password);
    await updateProfile(ผล.user, { displayName: ค่า.name });
    await setDoc(doc(db, "users", ผล.user.uid), {
      name: ค่า.name,
      email: ค่า.email,
      role: "employee"
    });
    location.href = "leave-requests.html";
  } catch (err) {
    เตือน(แปลข้อผิดพลาด(err));
    ปุ่มสมัคร.disabled = false;
  }
});

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}

function แปลข้อผิดพลาด(err) {
  switch (err.code) {
    case "auth/email-already-in-use": return "อีเมลนี้สมัครไว้แล้ว ลองเข้าสู่ระบบแทน";
    case "auth/invalid-email":        return "รูปแบบอีเมลไม่ถูกต้อง";
    case "auth/weak-password":        return "รหัสผ่านสั้นเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร";
    default:                          return "สมัครไม่สำเร็จ: " + err.message;
  }
}
