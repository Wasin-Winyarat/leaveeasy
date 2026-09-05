// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ
// สัปดาห์ที่ 7: เข้าสู่ระบบด้วยอีเมล/รหัสผ่านผ่าน Firebase Authentication
// ─────────────────────────────────────────────────────────────

import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

var ฟอร์ม = document.getElementById("ฟอร์มเข้าสู่ระบบ");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่มเข้าสู่ระบบ = document.getElementById("ปุ่มเข้าสู่ระบบ");

ฟอร์ม.addEventListener("submit", async function (e) {
  e.preventDefault();

  var อีเมล = document.getElementById("email").value.trim();
  var รหัสผ่าน = document.getElementById("password").value;

  if (!อีเมล || !รหัสผ่าน) {
    เตือน("กรอกไม่ครบ — ต้องกรอกทั้งอีเมลและรหัสผ่าน");
    return;
  }

  ปุ่มเข้าสู่ระบบ.disabled = true;

  try {
    await signInWithEmailAndPassword(auth, อีเมล, รหัสผ่าน);
    location.href = "leave-requests.html";
  } catch (err) {
    เตือน(แปลข้อผิดพลาด(err));
    ปุ่มเข้าสู่ระบบ.disabled = false;
  }
});

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}

function แปลข้อผิดพลาด(err) {
  switch (err.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":     return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "auth/invalid-email":      return "รูปแบบอีเมลไม่ถูกต้อง";
    case "auth/too-many-requests":  return "ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่";
    default:                        return "เข้าสู่ระบบไม่สำเร็จ: " + err.message;
  }
}
