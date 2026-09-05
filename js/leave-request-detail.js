// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: อ่านจาก Firestore จริง (โฟลเดอร์ leaveRequests + โฟลเดอร์ย่อย approvals)
// การอนุมัติ/ไม่อนุมัติ และการส่งความเห็น ยังเปลี่ยนแค่ในหน่วยความจำ
// (บันทึกการเปลี่ยนสถานะ/ความเห็นลง Firestore จริงเป็นงานถัดไป)
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

var รหัสใบลา = ค่าจากURL("id");
var กล่องใบลา = document.getElementById("กล่องใบลา");
var กล่องความเห็น = document.getElementById("กล่องความเห็น");

var ใบ, ความเห็น;

โหลดข้อมูล();

// ── อ่านใบลา 1 ใบ พร้อมความเห็นทั้งหมด จาก Firestore ──
async function โหลดข้อมูล() {
  try {
    var สแนปใบลา = await getDoc(doc(db, "leaveRequests", รหัสใบลา));
    if (!สแนปใบลา.exists()) {
      กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
      return;
    }
    ใบ = Object.assign({ id: สแนปใบลา.id }, สแนปใบลา.data());

    var สแนปความเห็น = await getDocs(collection(db, "leaveRequests", รหัสใบลา, "approvals"));
    ความเห็น = สแนปความเห็น.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });

    วาดใบลา();
    วาดความเห็น();
    กล่องความเห็น.classList.remove("hidden");
    document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);
  } catch (err) {
    กล่องใบลา.innerHTML = "<p>⚠️ โหลดข้อมูลจาก Firestore ไม่สำเร็จ: " + esc(err.message) + "</p>";
  }
}

// ── วาดข้อมูลใบลาลงหน้าจอ ──
function วาดใบลา() {
  var แถว = [
    ["หัวข้อ", esc(ใบ.title)],
    ["เหตุผลการลา", esc(ใบ.reason)],
    ["ประเภทการลา", esc(ใบ.leaveTypeName)],
    ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
    ["ผู้ขอลา", esc(ใบ.requesterName)],
    ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
    ["สถานะ", ป้ายสถานะ(ใบ.status)],
    ["วันที่ยื่น", esc(ใบ.createdAt)]
  ];

  var html = แถว.map(function (r) {
    return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
  }).join("");

  // ปุ่มอนุมัติ / ไม่อนุมัติ ขึ้นเฉพาะใบที่ยังรอพิจารณา
  if (ใบ.status === "รอพิจารณา") {
    html +=
      '<div class="btn-row">' +
      '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
      '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
      "</div>";
  } else {
    html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
  }

  กล่องใบลา.innerHTML = html;

  if (ใบ.status === "รอพิจารณา") {
    document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
    document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
  }
}

// ── เปลี่ยนสถานะ (ตอนนี้เปลี่ยนแค่ในหน่วยความจำ ยังไม่บันทึกลง Firestore) ──
function เปลี่ยนสถานะ(สถานะใหม่) {
  // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
  if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
    alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
    return;
  }
  ใบ.status = สถานะใหม่;   // แก้เฉพาะช่อง status เท่านั้น
  วาดใบลา();
}

// ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
function วาดความเห็น() {
  var ที่วาง = document.getElementById("รายการความเห็น");
  if (ความเห็น.length === 0) {
    ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
    return;
  }
  ที่วาง.innerHTML = ความเห็น
    .slice()
    .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
    .map(function (c) {
      return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
             "</div><div>" + esc(c.message) + "</div></div>";
    }).join("");
}

// ── ส่งความเห็นใหม่ (ตอนนี้เปลี่ยนแค่ในหน่วยความจำ ยังไม่บันทึกลง Firestore) ──
function ส่งความเห็น() {
  var ช่อง = document.getElementById("ข้อความความเห็น");
  var เตือน = document.getElementById("เตือนความเห็น");
  var ข้อความ = ช่อง.value.trim();

  if (!ข้อความ) {
    เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
    เตือน.classList.remove("hidden");
    return;
  }
  เตือน.classList.add("hidden");

  // สัปดาห์ที่ 7 ยังไม่มีล็อกอิน จึงสมมติว่าผู้เขียนคือ สมหญิง รักงาน
  ความเห็น.push({
    id: "ap-ใหม่-" + Date.now(),
    requestId: ใบ.id,
    authorId: "u002", authorName: "สมหญิง รักงาน",
    message: ข้อความ,
    createdAt: เวลาตอนนี้()
  });
  ช่อง.value = "";
  วาดความเห็น();
}
