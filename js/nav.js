// ─────────────────────────────────────────────────────────────
// js/nav.js — แถบเมนูด้านบนที่ใช้ร่วมกันทุกหน้า
// แก้เมนูที่ไฟล์นี้ที่เดียว ทุกหน้าเปลี่ยนตามพร้อมกัน
//
// วิธีใช้: ทุกหน้ามี <div id="nav"></div> ไว้บนสุดของ body
//
// สัปดาห์ที่ 7: เช็คสถานะล็อกอินด้วย Firebase Authentication
// ยังไม่ล็อกอินและไม่ได้อยู่หน้า login/signup → เด้งไปหน้าเข้าสู่ระบบทันที
// ล็อกอินอยู่ → แสดงชื่อ + ปุ่มออกจากระบบ ในช่อง #navUser
// สัปดาห์ที่ 8: ซ่อนเมนู "ประเภทการลา" ถ้าไม่ใช่ฝ่ายบุคคล (hr) ตาม ACL.md
// ─────────────────────────────────────────────────────────────

import { auth } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getCurrentUser } from "./auth-helpers.js";

var เมนู = [
  { href: "index.html",             ชื่อ: "หน้าแรก" },
  { href: "leave-requests.html",    ชื่อ: "รายการใบลา" },
  { href: "new-leave-request.html", ชื่อ: "ยื่นใบลาใหม่" },
  { href: "leave-types.html",       ชื่อ: "ประเภทการลา" }
];

// หน้าที่เข้าได้โดยไม่ต้องล็อกอิน
var หน้าไม่ต้องล็อกอิน = ["login.html", "signup.html"];

// ชื่อไฟล์ของหน้าที่กำลังเปิดอยู่ เอาไว้ขีดเส้นใต้เมนูที่ตรงกัน
var หน้าปัจจุบัน = location.pathname.split("/").pop() || "index.html";

var html = '<div class="navbar"><span class="brand">🔧 LeaveEasy</span>';
เมนู.forEach(function (m) {
  var active = m.href === หน้าปัจจุบัน ? ' class="active"' : "";
  html += '<a href="' + m.href + '"' + active + ">" + m.ชื่อ + "</a>";
});
html += '<span class="nav-user" id="navUser"></span></div>';

var ที่วาง = document.getElementById("nav");
if (ที่วาง) ที่วาง.innerHTML = html;

var ผู้ใช้ = await getCurrentUser();

if (!ผู้ใช้) {
  if (หน้าไม่ต้องล็อกอิน.indexOf(หน้าปัจจุบัน) === -1) {
    location.href = "login.html";
  }
} else {
  if (ผู้ใช้.role !== "hr") {
    var ลิงก์ประเภทการลา = document.querySelector('a[href="leave-types.html"]');
    if (ลิงก์ประเภทการลา) ลิงก์ประเภทการลา.remove();
  }

  var navUser = document.getElementById("navUser");
  if (navUser) {
    navUser.innerHTML = "";

    var ชื่อ = document.createElement("span");
    ชื่อ.textContent = ผู้ใช้.displayName;
    navUser.appendChild(ชื่อ);

    var ปุ่มออกจากระบบ = document.createElement("button");
    ปุ่มออกจากระบบ.type = "button";
    ปุ่มออกจากระบบ.className = "btn-ghost";
    ปุ่มออกจากระบบ.textContent = "ออกจากระบบ";
    ปุ่มออกจากระบบ.addEventListener("click", function () {
      signOut(auth).then(function () { location.href = "login.html"; });
    });
    navUser.appendChild(ปุ่มออกจากระบบ);
  }
}

// แถบเตือนสีเหลือง ใช้ตอนที่ยังไม่ได้ตั้งค่า Firebase
function showConfigWarning(ข้อความ) {
  var กล่อง = document.createElement("div");
  กล่อง.className = "alert alert-warn";
  กล่อง.innerHTML =
    "⚠️ <strong>ยังไม่ได้ตั้งค่า Firebase</strong> — " +
    (ข้อความ || "หน้านี้จึงยังไม่ได้อ่านข้อมูลจากฐานข้อมูลจริง") +
    "<br>วิธีตั้งค่าอยู่ในไฟล์ SETUP.md ขั้นที่ 4";
  var ที่วาง = document.querySelector(".container") || document.body;
  ที่วาง.insertBefore(กล่อง, ที่วาง.firstChild);
}
