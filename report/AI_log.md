# AI Audit Report

I use AI tools for the following tasks:
- Analyzing assignment requirements (`HW04 – Automation Testing`) and selected features (`FR-02`, `FR-07`, `FR-12`).
- Setting up Git branching (`hw-automation` from upstream `ttbhanh/eshop-sut`).
- Initializing Playwright automation project structure, multi-browser configuration, and HTML report stamping.

---

## Interaction Log

### Interaction 1 — Branch Setup & Repo Structure Clarification
- **AI Tool:** Antigravity (Gemini)
- **Date & Time:** 2026-11-28T16:22:11+07:00 – 2026-11-28T16:33:40+07:00
- **Prompt:**
  > (1) bây giờ tui muốn tạo 1 repo mới như này ở remote https://github.com/otis275275/HW-automation, nhưng hiện do repo này đã fork về từ đề gốc nên gặp chút trục trặt
  > (2) tui cần giữ repo fork, hiện đang ở nhánh main (trước repo gốc vài commit), tách các commit đó sáng branch hw-api. Rồi để branch main về i như repo gốc, sau đó tạo branch mới là hw-automation và push lên
  > (3) đây là repo gốc: https://github.com/ttbhanh/eshop-sut. đây là repo fork nhưng nhánh main đã trước https://github.com/otis275275/eshop-sut
  > (4) Không, bây giờ nhánh main của fork để nguyên đó, giờ tạo branch mới là hw-automation nhưng là code của repo gốc không phải của main fork đc k?
  > (5) làm đi
- **AI Output:**
  - Explained how to keep `main` intact on the forked repo (`otis275275/eshop-sut`) while creating a clean `hw-automation` branch directly from `upstream/main` (`ttbhanh/eshop-sut`).
  - Configured `.git/config` with `origin` (`https://github.com/otis275275/eshop-sut.git`) and `upstream` (`https://github.com/ttbhanh/eshop-sut.git`).
  - Executed `git fetch upstream`, created `hw-automation` from `upstream/main` (`85af3ba`), and pushed `hw-automation` to `origin`.

---

### Interaction 2 — Assignment Analysis & Step-by-Step Plan (FR-02, FR-07, FR-12)
- **AI Tool:** Antigravity (Gemini)
- **Date & Time:** 2026-11-28T16:48:12+07:00
- **Prompt:**
  > @[2026.HW04.Automation Testing_En.md] oke đây là đề, tui làm FR 2, 7, 12, đầu tiền hãy phân tích đề và huongws dãn tui các bước để làm
- **AI Output:**
  - Analyzed mandatory constraints in `HW04 – Automation Testing`:
    - 3 features across Pools A–C (`FR-02`, `FR-07`, `FR-12`), minimum 12 test cases per feature.
    - Data-driven approach (external `.csv`/`.json` files), $\ge$ 3 distinct assertion patterns.
    - Multi-browser execution (Chromium, Firefox, WebKit — minimum 9 browser runs).
    - HTML report displaying `"Run by: {StudentID}"` with ISO timestamp.
    - Git history ($\ge$ 8 commits touching test script files), Demo video ($\ge$ 5 mins, Vietnamese, `whoami`/`hostname` or face-cam), Agent Skill + demo video, AI Audit Report, AI Critique (200–300 words), Bug Report + GitHub Issues.
  - Analyzed specific test scenarios for `FR-02` (Login & 30s lockout), `FR-07` (Shopping Cart UI, calculations, confirm delete, "Tổng cộng" label), and `FR-12` (Admin Access Control UI + API JWT/role checks).
  - Proposed a 6-step execution roadmap.

---

### Interaction 3 — Playwright Initialization & AI Audit Logging
- **AI Tool:** Antigravity (Gemini)
- **Date & Time:** 2026-11-28T16:51:30+07:00
- **Prompt:**
  > @[report/AI_log.md] khởi tạo playwright trước đi, append tất cả cuộc trò chuyện của ta vào file AI log, để làm phần AI audit
- **AI Output:**
  - Created `automation/` project with `package.json`, `playwright.config.ts` (configured for `chromium`, `firefox`, `webkit` and HTML reporter), `scripts/stamp-report.js` (to inject `"Run by: {StudentID} | {ISO_TIMESTAMP}"` into the HTML report), and `.gitignore`.
  - Installed `@playwright/test` and Playwright browsers.
  - Populated `report/AI_log.md` with the mandatory declaration and interaction history.

---

### Interaction 4 — Codebase Analysis & FR-02 Test Generation
- **AI Tool:** Antigravity (Gemini)
- **Date & Time:** 2026-11-28T16:56:28+07:00 – 2026-11-28T16:58:36+07:00
- **Prompt:**
  > (1) oke đọc full code đi
  > (2) mssv là 23120228, bắt đầu từ FR02 đi
- **AI Output:**
  - Read `backend/server.js`, `backend/database.js`, `frontend-web/src/pages/Login.jsx`, `Cart.jsx`, `Home.jsx`, `ProductDetail.jsx`, `CartContext.jsx`, `AuthContext.jsx`, `App.jsx`, and `frontend-admin/src/App.jsx` to map real selectors and identify intentional SUT bugs against `README.md`.
  - Updated `STUDENT_ID` default to `23120228` in `automation/playwright.config.ts` and `automation/scripts/stamp-report.js`.
  - Created external test data file `automation/data/fr02-login.json` (14 test cases covering positive login, JWT Bearer header, non-existent email, lockout attempt thresholds, 30s unlock boundary, HTML5 validation, password masking, error placement, and Vietnamese UI labels).
  - Created `automation/tests/fr02-login.spec.ts` using isolated dynamic users via `/api/register` for lockout tests so multi-browser runs remain independent.

---

### Interaction 5 — Running FR-02 Multi-Browser & Switching Firefox to Microsoft Edge
- **AI Tool:** Antigravity (Gemini)
- **Date & Time:** 2026-11-28T17:23:51+07:00 – 2026-11-28T17:42:29+07:00
- **Prompt:**
  > (1) oke chạy FR2 trước đi, các kết quả báo cáo vào report/
  > (2) oke medge đi
- **AI Output:**
  - Configured HTML report output folder to `report/playwright-report`, added `webServer` entries in `automation/playwright.config.ts` and `automation/scripts/run-tests.js` so `stamp-report.js` always runs even when SUT bug assertions fail.
  - Executed FR-02 across Chromium, Firefox, and WebKit. Chromium and WebKit each produced 7 passed / 7 failed (detecting 7 real SUT bugs: `login_attempts + 2`, 180s lockout instead of 30s, `type="text"` on email & password, error below submit button, wrong heading/button labels, and `"Thoát"` instead of `"Đăng xuất"`).
  - Identified protocol incompatibility with the locally cached `firefox-1543` (`legacyInterceptor` in `Browser.setDownloadOptions`) and switched the third browser project to Microsoft Edge (`msedge`) per assignment rules.

---

### Interaction 6 — FR-07 (Shopping Cart) Test Design & Execution
- **AI Tool:** Antigravity (Gemini)
- **Date & Time:** 2026-11-28T17:52:19+07:00
- **Prompt:**
  > oke làm PR7 luôn đi
- **AI Output:**
  - Created external test data file `automation/data/fr07-cart.json` (14 test cases covering empty cart state, empty illustration, single/multiple/duplicate item addition, table headers, +/- quantity controls, delete confirmation dialog, "Tổng cộng" & "Tiếp tục mua sắm" labels, navbar badge, breadcrumb, product detail first-click behavior, and unauthenticated checkout redirect).
  - Created `automation/tests/fr07-cart.spec.ts` using client-side navigation to preserve in-memory `CartContext` state and locale-tolerant currency regex patterns.

---

### Interaction 7 — FR-12 (Web Admin Access Control) Test Design & Execution
- **AI Tool:** Antigravity (Gemini)
- **Date & Time:** 2026-11-28T17:57:43+07:00
- **Prompt:**
  > oke tiếp FR12 luôn
- **AI Output:**
  - Created external test data file `automation/data/fr12-admin-access.json` (14 test cases: 4 Web Admin UI access control cases on port 5174 + 10 Backend API RBAC/JWT cases on port 3000 covering `/api/admin/*`, `/api/products`, `/api/categories`, `/api/admin/coupons`).
  - Created `automation/tests/fr12-admin-access.spec.ts` with automatic cleanup if unauthorized mutations succeed due to missing backend authorization middleware.
  - Human Review Fix: Fixed async race condition in `TC-FR12-02` where `page.on('dialog')` was evaluated before the asynchronous `/api/login` response triggered `alert()`, replacing it with `await page.waitForEvent('dialog')`.

---

### Interaction 8 — Building Reusable Agent Skill
- **AI Tool:** Antigravity (Gemini)
- **Date & Time:** 2026-11-28T21:01:12+07:00
- **Prompt:**
  > Xây dựng agent skill đi
- **AI Output:**
  - Created reusable workspace Agent Skill at `.agents/skills/playwright-data-driven-automation/SKILL.md` and reference template `.agents/skills/playwright-data-driven-automation/references/test-template.md`.
  - Documented the 5-step workflow: (1) Specification & SUT code analysis, (2) Test case design & external JSON/CSV data separation, (3) Multi-browser Playwright script generation with isolation & anti-flakiness patterns, (4) Human review triage, and (5) HTML report stamping (`Run by: {StudentID}` + ISO timestamp), AI audit logging, and atomic Git commits.
