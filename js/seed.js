// ─────────────────────────────────────────────────────────────
// js/seed.js — ใส่ข้อมูลตัวอย่างจาก js/data.js ลง Firestore
// ใช้ setDoc + Document ID คงที่ (u001, lt001, lr001, ap001, ...)
// กดปุ่มซ้ำได้เสมอ — เขียนทับด้วยค่าเดิม ไม่สร้างซ้ำซ้อน
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

var ปุ่ม = document.getElementById("ปุ่มSeed");
var กล่องผล = document.getElementById("ผลลัพธ์");

ปุ่ม.addEventListener("click", seedข้อมูล);

async function seedข้อมูล() {
  ปุ่ม.disabled = true;
  เขียนผล("กำลังใส่ข้อมูล...");

  try {
    var ข้อมูล = window.LEAVE_DATA;

    for (var u of ข้อมูล.users) {
      await setDoc(doc(db, "users", u.id), { name: u.name, email: u.email, role: u.role });
    }

    for (var t of ข้อมูล.leaveTypes) {
      await setDoc(doc(db, "leaveTypes", t.id), { name: t.name });
    }

    for (var r of ข้อมูล.leaveRequests) {
      await setDoc(doc(db, "leaveRequests", r.id), {
        title: r.title,
        reason: r.reason,
        status: r.status,
        requesterId: r.requesterId, requesterName: r.requesterName,
        approverId: r.approverId, approverName: r.approverName,
        leaveTypeId: r.leaveTypeId, leaveTypeName: r.leaveTypeName,
        startDate: r.startDate, endDate: r.endDate,
        createdAt: r.createdAt
      });
    }

    for (var a of ข้อมูล.approvals) {
      await setDoc(doc(db, "leaveRequests", a.requestId, "approvals", a.id), {
        authorId: a.authorId, authorName: a.authorName,
        message: a.message, createdAt: a.createdAt
      });
    }

    เขียนผล(
      "✅ เสร็จแล้ว — users " + ข้อมูล.users.length +
      " · leaveTypes " + ข้อมูล.leaveTypes.length +
      " · leaveRequests " + ข้อมูล.leaveRequests.length +
      " · approvals " + ข้อมูล.approvals.length,
      "alert-ok"
    );
  } catch (err) {
    เขียนผล("⚠️ ใส่ข้อมูลไม่สำเร็จ: " + err.message, "alert-error");
  }

  ปุ่ม.disabled = false;
}

function เขียนผล(ข้อความ, คลาส) {
  กล่องผล.textContent = ข้อความ;
  กล่องผล.className = "alert " + (คลาส || "");
}
