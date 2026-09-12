// ─────────────────────────────────────────────────────────────
// js/test-ai.js — หน้าทดสอบเรียก AI ผ่าน OpenRouter
// กดปุ่มแล้วส่งข้อความ "สวัสดี" ไปที่โมเดล แล้วแสดงคำตอบบนหน้าจอ
// ─────────────────────────────────────────────────────────────

import { OPENROUTER_API_KEY, OPENROUTER_MODEL } from "./config.js";

var ปุ่มทดสอบ = document.getElementById("ปุ่มทดสอบ");
var กล่องสถานะ = document.getElementById("สถานะ");
var กล่องคำตอบ = document.getElementById("คำตอบ");

ปุ่มทดสอบ.addEventListener("click", ส่งข้อความทดสอบ);

async function ส่งข้อความทดสอบ() {
  ปุ่มทดสอบ.disabled = true;
  กล่องสถานะ.textContent = "กำลังส่งข้อความ...";
  กล่องคำตอบ.textContent = "";

  try {
    var res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: "สวัสดี" }]
      })
    });

    var ข้อมูล = await res.json();

    if (!res.ok) {
      throw new Error(ข้อมูล.error?.message || "เรียก API ไม่สำเร็จ (" + res.status + ")");
    }

    var คำตอบ = ข้อมูล.choices?.[0]?.message?.content || "(ไม่มีคำตอบ)";
    กล่องสถานะ.textContent = "สำเร็จ";
    กล่องคำตอบ.textContent = คำตอบ;
  } catch (err) {
    กล่องสถานะ.textContent = "เกิดข้อผิดพลาด";
    กล่องคำตอบ.textContent = err.message;
  } finally {
    ปุ่มทดสอบ.disabled = false;
  }
}
