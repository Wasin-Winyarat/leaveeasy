// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — ตั้งค่า Firebase ให้ทุกหน้าเรียกใช้ร่วมกัน
// export ตัวแปร db (Firestore) และ auth (Authentication) ให้ไฟล์อื่น import ไปใช้
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCjjDxThc0VTSi8CbI5oEBG2ms2QoNW_FQ",
  authDomain: "leaveeasy-wasinwinyarat.firebaseapp.com",
  projectId: "leaveeasy-wasinwinyarat",
  storageBucket: "leaveeasy-wasinwinyarat.firebasestorage.app",
  messagingSenderId: "149079708393",
  appId: "1:149079708393:web:e9e3388a1f23955f389678",
  measurementId: "G-HMV4YP9KFT"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
