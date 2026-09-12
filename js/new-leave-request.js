// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7: บันทึกลง Firestore จริง (โฟลเดอร์ leaveRequests)
// ประเภทการลาในรายการเลื่อนลงก็อ่านจากโฟลเดอร์ leaveTypes จริงแล้ว
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getCurrentUser } from "./auth-helpers.js";
import { OPENROUTER_API_KEY, OPENROUTER_MODEL } from "./config.js";

var ผู้ใช้ = await getCurrentUser();

var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
var ช่องเหตุผล = document.getElementById("reason");
var ช่องประเภท = document.getElementById("leaveTypeId");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");
var ปุ่มAI = document.getElementById("ปุ่มAI");
var กล่องผลAI = document.getElementById("ผลAI");
var ข้อความปุ่มAIปกติ = ปุ่มAI.textContent;

var ประเภทการลาทั้งหมด = [];

โหลดประเภทการลา();

// เติมรายการเลื่อนลงด้วยประเภทการลาจากฐานข้อมูลจริง
// เก็บ {id, name} ไว้ใน ประเภทการลาทั้งหมด ด้วย เอาไปใช้ตอนส่งให้ AI เลือกประเภท
async function โหลดประเภทการลา() {
  try {
    var สแนปช็อต = await getDocs(collection(db, "leaveTypes"));
    สแนปช็อต.docs.forEach(function (d) {
      ประเภทการลาทั้งหมด.push({ id: d.id, name: d.data().name });

      var ตัวเลือก = document.createElement("option");
      ตัวเลือก.value = d.id;
      ตัวเลือก.textContent = d.data().name;
      ช่องประเภท.appendChild(ตัวเลือก);
    });
  } catch (err) {
    เตือน("โหลดประเภทการลาไม่สำเร็จ: " + err.message);
  }
}

ปุ่มAI.addEventListener("click", จัดประเภทด้วยAI);

async function จัดประเภทด้วยAI() {
  var เหตุผล = ช่องเหตุผล.value.trim();

  if (!เหตุผล) {
    แสดงผลAI("กรอกเหตุผลการลาก่อน ถึงจะให้ AI ช่วยจัดประเภทได้", "alert-error");
    return;
  }
  if (ประเภทการลาทั้งหมด.length === 0) {
    แสดงผลAI("ยังไม่มีประเภทการลาในระบบให้เลือก", "alert-error");
    return;
  }

  ปุ่มAI.disabled = true;
  ปุ่มAI.textContent = "กำลังให้ AI จัดประเภท...";
  กล่องผลAI.classList.add("hidden");

  var รายชื่อประเภท = ประเภทการลาทั้งหมด.map(function (t) { return t.name; }).join(", ");
  var คำสั่ง = "คุณคือผู้ช่วยจัดประเภทการลา ตอบกลับด้วยชื่อประเภทการลาที่ตรงที่สุดเพียงชื่อเดียว " +
    "จากรายการนี้เท่านั้น ห้ามตอบอย่างอื่นนอกจากชื่อในรายการ: " + รายชื่อประเภท +
    "\n\nเหตุผลการลา: \"" + เหตุผล + "\"";

  var ตัวควบคุม = new AbortController();
  var ตัวจับเวลา = setTimeout(function () { ตัวควบคุม.abort(); }, 15000);

  try {
    var res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: ตัวควบคุม.signal,
      headers: {
        "Authorization": "Bearer " + OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: คำสั่ง }]
      })
    });

    var ข้อมูล = await res.json();
    if (!res.ok) {
      throw new Error(ข้อมูล.error?.message || "เรียก API ไม่สำเร็จ (" + res.status + ")");
    }

    var คำตอบ = (ข้อมูล.choices?.[0]?.message?.content || "").trim().replace(/^["'“”]+|["'“”]+$/g, "");
    var ที่ตรงกัน = ประเภทการลาทั้งหมด.find(function (t) {
      return t.name.trim().toLowerCase() === คำตอบ.toLowerCase();
    });

    if (ที่ตรงกัน) {
      ช่องประเภท.value = ที่ตรงกัน.id;
      แสดงผลAI("ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน (" + ที่ตรงกัน.name + ")", "alert-ai");
    } else {
      แสดงผลAI("AI จัดประเภทให้ไม่ได้ — กรุณาเลือกเอง", "alert-error");
    }
  } catch (err) {
    แสดงผลAI("AI จัดประเภทให้ไม่ได้ — กรุณาเลือกเอง", "alert-error");
  } finally {
    clearTimeout(ตัวจับเวลา);
    ปุ่มAI.disabled = false;
    ปุ่มAI.textContent = ข้อความปุ่มAIปกติ;
  }
}

function แสดงผลAI(ข้อความ, คลาส) {
  กล่องผลAI.textContent = ข้อความ;
  กล่องผลAI.classList.remove("hidden", "alert-ai", "alert-error");
  กล่องผลAI.classList.add(คลาส);
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
  if (!ผู้ใช้) {
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
      requesterId: ผู้ใช้.uid,
      requesterName: ผู้ใช้.displayName,
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
