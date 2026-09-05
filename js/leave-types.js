// ─────────────────────────────────────────────────────────────
// js/leave-types.js — หน้าที่ 4 จัดการประเภทการลา
// สัปดาห์ที่ 6 (ต้นสัปดาห์): เพิ่ม แก้ ลบ ในหน่วยความจำเท่านั้น
// สัปดาห์ที่ 8: จำกัดปุ่มเพิ่ม/แก้ไข/ลบ ให้เฉพาะฝ่ายบุคคล (hr) ตาม ACL.md
// (แค่ซ่อนปุ่มฝั่งหน้าจอ ยังไม่ใช่การกันจริงระดับ Security Rules)
// ─────────────────────────────────────────────────────────────

import { getCurrentUser } from "./auth-helpers.js";

var ผู้ใช้ = await getCurrentUser();
var เป็นhr = !!ผู้ใช้ && ผู้ใช้.role === "hr";

var รายการ = window.LEAVE_DATA.leaveTypes.slice();   // ทำสำเนาไว้แก้
var ที่วางตาราง = document.getElementById("ตารางประเภท");
var ช่องชื่อใหม่ = document.getElementById("ชื่อประเภทใหม่");
var กล่องเตือน = document.getElementById("เตือนประเภท");
var ปุ่มเพิ่ม = document.getElementById("ปุ่มเพิ่ม");

วาดตาราง();

if (เป็นhr) {
  ปุ่มเพิ่ม.addEventListener("click", เพิ่มประเภท);
} else {
  document.getElementById("คำเตือนสิทธิ์").classList.remove("hidden");
  ช่องชื่อใหม่.disabled = true;
  ปุ่มเพิ่ม.disabled = true;
}

function วาดตาราง() {
  if (รายการ.length === 0) {
    ที่วางตาราง.innerHTML = "<p>ยังไม่มีประเภทการลาในระบบ</p>";
    return;
  }

  var html = "<table><thead><tr><th>ชื่อประเภทการลา</th><th>จัดการ</th></tr></thead><tbody>";
  รายการ.forEach(function (ประเภท) {
    html += "<tr><td>" + esc(ประเภท.name) + "</td><td>";
    if (เป็นhr) {
      html +=
        '<button type="button" class="btn-ghost" data-edit="' + esc(ประเภท.id) + '">แก้ไข</button> ' +
        '<button type="button" class="btn-danger" data-del="' + esc(ประเภท.id) + '">ลบ</button>';
    } else {
      html += '<span class="hint">—</span>';
    }
    html += "</td></tr>";
  });
  html += "</tbody></table>";
  ที่วางตาราง.innerHTML = html;

  if (เป็นhr) {
    ที่วางตาราง.querySelectorAll("[data-edit]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { แก้ประเภท(ปุ่ม.dataset.edit); });
    });
    ที่วางตาราง.querySelectorAll("[data-del]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { ลบประเภท(ปุ่ม.dataset.del); });
    });
  }
}

function เพิ่มประเภท() {
  var ชื่อ = ช่องชื่อใหม่.value.trim();
  if (!ชื่อ) {
    กล่องเตือน.textContent = "⚠️ พิมพ์ชื่อประเภทการลาก่อน จึงจะเพิ่มได้";
    กล่องเตือน.classList.remove("hidden");
    return;
  }
  กล่องเตือน.classList.add("hidden");
  รายการ.push({ id: "lt-ใหม่-" + Date.now(), name: ชื่อ });
  ช่องชื่อใหม่.value = "";
  วาดตาราง();
}

function แก้ประเภท(id) {
  var ประเภท = รายการ.find(function (t) { return t.id === id; });
  var ชื่อใหม่ = prompt("แก้ชื่อประเภทการลา", ประเภท.name);
  if (ชื่อใหม่ === null) return;              // กดยกเลิก
  if (!ชื่อใหม่.trim()) { alert("ชื่อประเภทการลาว่างเปล่าไม่ได้"); return; }
  ประเภท.name = ชื่อใหม่.trim();
  วาดตาราง();
}

function ลบประเภท(id) {
  var ประเภท = รายการ.find(function (t) { return t.id === id; });
  if (!confirm('ยืนยันการลบประเภท "' + ประเภท.name + '" หรือไม่')) return;
  รายการ = รายการ.filter(function (t) { return t.id !== id; });
  วาดตาราง();
}
