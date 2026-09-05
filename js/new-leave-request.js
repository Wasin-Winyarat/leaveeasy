// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7: บันทึกลง Firestore จริง (โฟลเดอร์ leaveRequests)
// ประเภทการลาในรายการเลื่อนลงก็อ่านจากโฟลเดอร์ leaveTypes จริงแล้ว
// ─────────────────────────────────────────────────────────────

import { db, auth } from "./firebase-config.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

var ผู้ใช้ปัจจุบัน = null;
onAuthStateChanged(auth, function (ผู้ใช้) { ผู้ใช้ปัจจุบัน = ผู้ใช้; });

var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
var ช่องประเภท = document.getElementById("leaveTypeId");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");

โหลดประเภทการลา();

// เติมรายการเลื่อนลงด้วยประเภทการลาจากฐานข้อมูลจริง
async function โหลดประเภทการลา() {
  try {
    var สแนปช็อต = await getDocs(collection(db, "leaveTypes"));
    สแนปช็อต.docs.forEach(function (d) {
      var ตัวเลือก = document.createElement("option");
      ตัวเลือก.value = d.id;
      ตัวเลือก.textContent = d.data().name;
      ช่องประเภท.appendChild(ตัวเลือก);
    });
  } catch (err) {
    เตือน("โหลดประเภทการลาไม่สำเร็จ: " + err.message);
  }
}

ฟอร์ม.addEventListener("submit", async function (e) {
  e.preventDefault();

  var ค่า = {
    title: document.getElementById("title").value.trim(),
    reason: document.getElementById("reason").value.trim(),
    leaveTypeId: ช่องประเภท.value,
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value
  };

  // ตรวจว่ากรอกครบก่อนบันทึก
  if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
    เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
    return;
  }
  if (ค่า.endDate < ค่า.startDate) {
    เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
    return;
  }
  if (!ผู้ใช้ปัจจุบัน) {
    เตือน("ยังไม่ได้เข้าสู่ระบบ — กรุณาเข้าสู่ระบบก่อนยื่นใบลา");
    return;
  }

  var ชื่อประเภท = ช่องประเภท.selectedOptions[0].textContent;

  ปุ่มบันทึก.disabled = true;

  try {
    await addDoc(collection(db, "leaveRequests"), {
      title: ค่า.title,
      reason: ค่า.reason,
      status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
      requesterId: ผู้ใช้ปัจจุบัน.uid,
      requesterName: ผู้ใช้ปัจจุบัน.displayName || ผู้ใช้ปัจจุบัน.email,
      approverId: "",      approverName: "",
      leaveTypeId: ค่า.leaveTypeId, leaveTypeName: ชื่อประเภท,
      startDate: ค่า.startDate,
      endDate: ค่า.endDate,
      createdAt: เวลาตอนนี้()
    });

    location.href = "leave-requests.html";
  } catch (err) {
    เตือน("บันทึกไม่สำเร็จ: " + err.message);
    ปุ่มบันทึก.disabled = false;
  }
});

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}
