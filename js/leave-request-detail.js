// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: อ่านจาก Firestore จริง (โฟลเดอร์ leaveRequests + โฟลเดอร์ย่อย approvals)
// ปุ่มอนุมัติ/ไม่อนุมัติ บันทึกลง Firestore จริง แก้เฉพาะช่อง status เท่านั้น
// ปุ่มลบ ถามยืนยันก่อนเสมอ แล้วลบไฟล์จริงจาก Firestore (ลบได้เฉพาะใบที่ยังรอพิจารณา)
// ส่งความเห็น บันทึกลง Firestore จริงในโฟลเดอร์ย่อย approvals ของใบนั้น
//
// สัปดาห์ที่ 8: จำกัดปุ่มตาม ACL.md (แค่ฝั่งหน้าจอ ยังไม่ใช่ Security Rules)
// - employee เปิดดูใบลาของคนอื่นไม่ได้ — บล็อกทั้งหน้าถ้าไม่ใช่เจ้าของ
// - อนุมัติ/ไม่อนุมัติ ทำได้เฉพาะ manager/hr และห้ามอนุมัติใบลาของตัวเอง
// - ลบใบลาได้เฉพาะเจ้าของใบลาเท่านั้น (ไม่ใช่ตามบทบาท)
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getCurrentUser } from "./auth-helpers.js";

var รหัสใบลา = ค่าจากURL("id");
var กล่องใบลา = document.getElementById("กล่องใบลา");
var กล่องความเห็น = document.getElementById("กล่องความเห็น");

var ผู้ใช้, ใบ, ความเห็น, เป็นเจ้าของ;

โหลดข้อมูล();

// ── อ่านใบลา 1 ใบ พร้อมความเห็นทั้งหมด จาก Firestore ──
async function โหลดข้อมูล() {
  try {
    ผู้ใช้ = await getCurrentUser();
    if (!ผู้ใช้) return; // nav.js จะเด้งไปหน้า login ให้เอง

    var สแนปใบลา = await getDoc(doc(db, "leaveRequests", รหัสใบลา));
    if (!สแนปใบลา.exists()) {
      กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
      return;
    }
    ใบ = Object.assign({ id: สแนปใบลา.id }, สแนปใบลา.data());
    เป็นเจ้าของ = ผู้ใช้.uid === ใบ.requesterId;

    // employee เปิดดูใบลาของคนอื่นไม่ได้ (ACL.md)
    if (ผู้ใช้.role === "employee" && !เป็นเจ้าของ) {
      กล่องใบลา.innerHTML = '<p class="hint">🔒 คุณไม่มีสิทธิ์ดูใบลานี้ — เปิดดูได้เฉพาะใบลาของตัวเอง</p>';
      return;
    }

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

  var เป็นรอพิจารณา = ใบ.status === "รอพิจารณา";
  var เป็นผู้อนุมัติหรือhr = ผู้ใช้.role === "manager" || ผู้ใช้.role === "hr";

  if (!เป็นรอพิจารณา) {
    html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
  } else if (เป็นผู้อนุมัติหรือhr && เป็นเจ้าของ) {
    html += '<p class="hint">🔒 อนุมัติใบลาของตัวเองไม่ได้ ต้องรอผู้อนุมัติคนอื่น</p>';
  } else if (เป็นผู้อนุมัติหรือhr) {
    html +=
      '<div class="btn-row">' +
      '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
      '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
      "</div>";
  } else {
    html += '<p class="hint">ใบนี้ยังรอผู้อนุมัติพิจารณา</p>';
  }

  // ปุ่มลบ — กดได้เฉพาะเจ้าของใบลาเท่านั้น และเฉพาะตอนยังรอพิจารณา
  html +=
    '<div class="btn-row">' +
    '<button type="button" class="btn-danger" id="ปุ่มลบ"' + (เป็นรอพิจารณา && เป็นเจ้าของ ? "" : " disabled") + ">ลบใบลานี้</button>" +
    "</div>";

  กล่องใบลา.innerHTML = html;

  if (เป็นรอพิจารณา && เป็นผู้อนุมัติหรือhr && !เป็นเจ้าของ) {
    document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
    document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
  }
  document.getElementById("ปุ่มลบ").addEventListener("click", ลบใบลา);
}

// ── เปลี่ยนสถานะ — บันทึกลง Firestore จริง แก้เฉพาะช่อง status ช่องเดียว ──
async function เปลี่ยนสถานะ(สถานะใหม่) {
  // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
  if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
    alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
    return;
  }

  var ปุ่มอนุมัติ = document.getElementById("ปุ่มอนุมัติ");
  var ปุ่มไม่อนุมัติ = document.getElementById("ปุ่มไม่อนุมัติ");
  ปุ่มอนุมัติ.disabled = true;
  ปุ่มไม่อนุมัติ.disabled = true;

  try {
    await updateDoc(doc(db, "leaveRequests", รหัสใบลา), { status: สถานะใหม่ });
    ใบ.status = สถานะใหม่;
    วาดใบลา();
  } catch (err) {
    alert("บันทึกสถานะไม่สำเร็จ: " + err.message);
    ปุ่มอนุมัติ.disabled = false;
    ปุ่มไม่อนุมัติ.disabled = false;
  }
}

// ── ลบใบลา — ถามยืนยันก่อนเสมอ กดยกเลิกแล้วต้องไม่ลบ ──
async function ลบใบลา() {
  if (!confirm('ยืนยันการลบใบลา "' + ใบ.title + '" หรือไม่ — ลบแล้วกู้คืนไม่ได้')) return;

  var ปุ่ม = document.getElementById("ปุ่มลบ");
  ปุ่ม.disabled = true;

  try {
    await deleteDoc(doc(db, "leaveRequests", รหัสใบลา));
    location.href = "leave-requests.html";
  } catch (err) {
    alert("ลบไม่สำเร็จ: " + err.message);
    ปุ่ม.disabled = false;
  }
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

// ── ส่งความเห็นใหม่ — บันทึกลง Firestore จริงในโฟลเดอร์ย่อย approvals ──
async function ส่งความเห็น() {
  var ช่อง = document.getElementById("ข้อความความเห็น");
  var เตือน = document.getElementById("เตือนความเห็น");
  var ปุ่ม = document.getElementById("ปุ่มส่งความเห็น");
  var ข้อความ = ช่อง.value.trim();

  if (!ข้อความ) {
    เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
    เตือน.classList.remove("hidden");
    return;
  }
  เตือน.classList.add("hidden");
  ปุ่ม.disabled = true;

  var ความเห็นใหม่ = {
    authorId: ผู้ใช้.uid,
    authorName: ผู้ใช้.displayName,
    message: ข้อความ,
    createdAt: เวลาตอนนี้()
  };

  try {
    var เอกสารใหม่ = await addDoc(collection(db, "leaveRequests", รหัสใบลา, "approvals"), ความเห็นใหม่);
    ความเห็น.push(Object.assign({ id: เอกสารใหม่.id }, ความเห็นใหม่));
    ช่อง.value = "";
    วาดความเห็น();
  } catch (err) {
    เตือน.textContent = "⚠️ ส่งความเห็นไม่สำเร็จ: " + err.message;
    เตือน.classList.remove("hidden");
  } finally {
    ปุ่ม.disabled = false;
  }
}
