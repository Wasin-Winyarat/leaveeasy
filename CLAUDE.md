# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LeaveEasy is a student assignment project (ADT-RAISE Non-Degree Batch 2 · Module 2, weeks 6–9) — a plain HTML/CSS/JS online leave-request system backed by Firestore. The student (`Wasin Winyarat`) is expected to write the code themselves, week by week, following `leaveeasy-spec.md`. **Always read `leaveeasy-spec.md` before implementing a feature** — it defines exact folder/field names, page behavior, and role permissions, and states explicitly: do only what's written there, don't add unspecified features, and don't implement a later week's work early (spec §0.1, §8, §9).

There is a separate reference/solution repo (`cnacha-mfu/leaveeasy`, tagged `week6-end`, `week7-end`, etc.) that the course explicitly says is for comparison only — its own README states not to copy its code into a student submission ("ห้าม fork repo นี้ไปส่งเป็นงานของกลุ่ม" / "ใช้ดูเทียบเท่านั้น"). Do not port code from it wholesale; if asked to "merge" from it, only pull in things the student's repo genuinely lacks, never replace already-completed work.

## Commands

```bash
npm run dev        # serve the static site at http://localhost:3000 (via `serve`)
firebase deploy    # deploy Hosting + Firestore rules/indexes (after firebase login)
```

There is no build step, bundler, linter, or test suite — it's hand-written static HTML/CSS/JS loaded directly by the browser (ES modules via `<script type="module">` where Firestore is used).

## Hard technical constraints (spec §0.2 — do not deviate)

- Plain HTML/CSS/JS only — **no framework** (no React/Vue/Next/Tailwind/etc.)
- One `.html` file per screen; styling in `css/style.css`; page logic in `js/`
- **No custom backend/server** — pages talk to Firestore directly from the browser
- Firestore for data, Firebase Authentication for login (from week 7), Security Rules (minimum "must be logged in" from week 7, full per-role rules from week 8), Firebase Hosting to deploy (from week 7)
- All UI text in Thai; file names and Firestore field names in English per the spec's naming table
- **Never put secret keys in any file that gets pushed to GitHub** — this includes the OpenRouter API key (week 8's AI assistant feature) and any Firebase service-account/admin JSON key. Put them in a file matched by `.gitignore` (`config.js`, `js/config.js`, `secrets.js`, `.env*`, `*serviceAccount*.json`, `*firebase-adminsdk*.json`) and read them from there, never inline. Before every push, run `git status` and check nothing matching those patterns is staged. If a secret is ever pushed by mistake: **revoke/rotate that key first**, then remove it from the repo — deleting the commit alone does not undo the leak.
  - Exception: the Firebase Web SDK config in `js/firebase-config.js` (`apiKey`, `projectId`, etc.) is a client-side identifier, not a secret — Firebase is designed to have it public and relies on Security Rules for protection. It is fine as committed code; the `.gitignore` comment about "adding key protection in week 7" refers to the *real* secrets above, added as they're introduced in later weeks — don't move `firebase-config.js` into a gitignored file preemptively.

## Architecture

**Pages** (each is a standalone `.html` + matching `js/<page>.js`, no router):
- `index.html` — landing page, links to the others
- `leave-requests.html` / `js/leave-requests.js` — list, reads `leaveRequests` from Firestore
- `new-leave-request.html` / `js/new-leave-request.js` — submit form (in-memory only until week 7 write support lands)
- `leave-request-detail.html` / `js/leave-request-detail.js` — one leave request, approve/reject buttons, comment thread
- `leave-types.html` / `js/leave-types.js` — CRUD-ish admin table for leave types
- `dashboard.html` (spec's page 5, not required as a real feature until Module 3 — a static prototype shell is enough for Module 2)

**Shared JS**: `js/nav.js` renders the top navbar into `<div id="nav"></div>` on every page and owns `showConfigWarning()`. `js/util.js` has cross-page helpers: `esc()` (HTML-escaping), `ป้ายสถานะ()` (status badge markup), `เวลาตอนนี้()` (Thai-locale timestamp string), `ค่าจากURL()` (query param reader). `js/data.js` is the original fake in-memory dataset (`window.LEAVE_DATA`) — being phased out page by page as each screen moves to reading real Firestore data. `js/firebase-config.js` initializes the Firebase app and exports `db` (the Firestore instance) for other modules to import; it holds this project's real Firebase config (not a placeholder).

**Identifier style**: variable/function names are Thai throughout the codebase (e.g. `กล่อง`, `รายการ`, `ป้ายสถานะ()`) — match this convention when editing existing files rather than switching to English names.

**Firestore folders (collections) — exactly these 4, no underscores** (unlike the ERD in spec §5.1 which uses `leave_requests`/`leave_types`):
- `users` — top-level collection
- `leaveTypes` — top-level collection
- `leaveRequests` — top-level collection
- `approvals` — **subcollection nested under each `leaveRequests/{id}`**, not a top-level collection

```
users/{uid}            { name, email, role }              role ∈ employee | manager | hr
leaveTypes/{id}         { name }
leaveRequests/{id}      { title, reason, status, startDate, endDate, createdAt,
                          requesterId, requesterName,   ← denormalized name alongside every FK
                          approverId,  approverName,
                          leaveTypeId, leaveTypeName }
  leaveRequests/{id}/approvals/{id}   { authorId, authorName, message, createdAt }  (subcollection)
```
Every foreign key (`requesterId`, `approverId`, `leaveTypeId`, `authorId`) is stored alongside a denormalized `*Name` field, because Firestore has no JOIN — always keep both in sync when writing.

**`status` has exactly 3 values, one-way only** (spec §6):
1. `รอพิจารณา` (pending) — the only status a newly-created request may start at, set automatically
2. `อนุมัติ` (approved) — terminal, cannot change further
3. `ไม่อนุมัติ` (rejected) — terminal, cannot change further; requires at least one existing `approvals` entry before a request may move here

Only `manager`/`hr` may change status (never the requester); a status change must touch only the `status` field, nothing else; a request can only be deleted while still `รอพิจารณา`.

**Firebase project**: `leaveeasy-wasinwinyarat` (see `.firebaserc`). `firebase.json` configures Hosting with `public: "."` (the repo root is served as-is, no build output dir) and Firestore rules/indexes. `firestore.rules` is currently fully open (`allow read, write: if true`) — locking this down to "must be logged in" and then per-role rules is week 7/8 work per the spec, not a bug to fix early.

**Seeding**: `seed.html` + `js/seed.js` push `window.LEAVE_DATA` into Firestore using fixed document IDs (`u001`, `lt001`, `lr001`, `ap001`, ...) via `setDoc`, so re-running the seed overwrites rather than duplicates.
