# HW04 — Automation Testing Report

- **Student ID:** `23120228`
- **SUT:** EShop (`https://github.com/ttbhanh/eshop-sut`)
- **Forked Repository (Branch `hw-automation`):** https://github.com/otis275275/eshop-sut/tree/hw-automation
- **Framework & Reporter:** Playwright (`@playwright/test`) + Playwright HTML Reporter
- **Browsers Executed:** Chromium, Microsoft Edge (`msedge`), WebKit (3 browsers)

---

## 1. Selected Features (Pools A–C)

| Pool | Feature ID | Feature Name | Test Cases | Data File | Spec File |
| :--- | :--- | :--- | :---: | :--- | :--- |
| Pool A | **FR-02** | Login & Account Lockout | 14 | `automation/data/fr02-login.json` | `automation/tests/fr02-login.spec.ts` |
| Pool B | **FR-07** | Shopping Cart | 14 | `automation/data/fr07-cart.json` | `automation/tests/fr07-cart.spec.ts` |
| Pool C | **FR-12** | Web Admin Access Control | 14 | `automation/data/fr12-admin-access.json` | `automation/tests/fr12-admin-access.spec.ts` |
| **Total** | **3 Features** | — | **42** | **3 JSON files** | **3 Spec files** |

---

## 2. Automation Architecture & Requirement Compliance

1. **Data-Driven Design:** All test cases, inputs, credentials, endpoints, and expected labels are externalized into `.json` files under `automation/data/`. No inline test data arrays are hardcoded inside `.spec.ts` files.
2. **Distinct Assertion Patterns ($\ge 3$):**
   - **Navigation / URL:** `expect(page).toHaveURL(...)`
   - **Visibility & Text Content:** `expect(locator).toBeVisible()`, `expect(locator).toContainText(...)`, `expect(locator).toHaveText(...)`
   - **DOM Attributes & Counts:** `expect(locator).toHaveAttribute('type', ...)`, `expect(locator).toHaveCount(...)`
   - **Layout Geometry & API Status:** `expect(errorBox.y).toBeLessThan(submitBox.y)`, `expect(response.status()).toBe(...)`
3. **Multi-Browser Execution (9 Browser Runs / 126 Test Executions):**
   - Configured 3 projects (`chromium`, `msedge`, `webkit`) in `automation/playwright.config.ts`.
   - Executed `npm.cmd test` end-to-end across all 3 features and all 3 browsers: **42 test cases × 3 browsers = 126 total runs**.
4. **HTML Report Stamping (Anti-AI-Cheat):**
   - `automation/scripts/stamp-report.js` injects `Run by: 23120228 | <ISO_TIMESTAMP>` into both `<title>` and a top header banner in `report/playwright-report/index.html`.
   - Verified stamp: `Run by: 23120228 | 2026-11-28T11:30:44.564Z`.

---

## 3. Execution Summary

| Feature | Cases | Browser Runs (×3) | Passed | Failed (Genuine SUT Bugs) | Script Errors |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **FR-02** | 14 | 42 | 21 (7×3) | 21 (7×3) | 0 |
| **FR-07** | 14 | 42 | 12 (4×3) | 30 (10×3) | 0 |
| **FR-12** | 14 | 42 | 15 (5×3) | 27 (9×3) | 0 |
| **Total** | **42** | **126** | **48** | **78** | **0** |

All 26 failing test cases (78 failed runs) are deterministic across Chromium, Edge, and WebKit and correspond to **12 distinct defects** logged in [Bug_Report.md](./Bug_Report.md) and on [GitHub Issues](https://github.com/otis275275/eshop-sut/issues).

---

## 4. Human Review & Gap Analysis (What AI Missed / Got Wrong)

During step-by-step collaboration with the AI, the following issues were caught and corrected through human review:

1. **Async Dialog Race Condition (`TC-FR12-02`):**
   - *AI mistake:* Initial generated code attached `page.on('dialog', ...)` and immediately asserted `expect(alertMessage).toContain(...)` right after `click()`. Because Web Admin calls `POST /api/login` asynchronously before calling `alert("Bạn không phải là admin!")`, the assertion ran before the dialog fired, causing a false failure.
   - *Human fix:* Replaced with `const dialogPromise = page.waitForEvent('dialog')` before clicking Login, then `await dialogPromise`, `expect(dialog.message())`, and `await dialog.accept()`.
   - *Why AI missed it:* The AI treated `alert()` as synchronous without checking that `handleLogin` in `frontend-admin/src/App.jsx` awaits `axios.post(...)` first.

2. **Cross-Browser State Pollution in Lockout Tests (`FR-02`):**
   - *Risk caught:* Using seed account `test@eshop.com` for failed-attempt lockout tests would lock the account for 180 seconds during the Chromium run, breaking subsequent runs on Edge and WebKit.
   - *Fix:* Dynamically registered an isolated user via `POST /api/register` per `(testCase, browserProject)` in `TC-FR02-05` through `TC-FR02-08`.

3. **In-Memory Cart Context Preservation (`FR-07`):**
   - *Risk caught:* `CartContext.jsx` stores cart items in React state (no `localStorage` persistence). Calling `page.goto('/cart')` directly after adding items resets the cart to empty.
   - *Fix:* Used client-side navbar link clicks (`goToCartViaNavbar`) to preserve React Router state.

4. **Cross-Browser Environment & Locale Differences:**
   - *Environment fix:* Locally cached `firefox-1543` failed with a `Browser.setDownloadOptions` protocol mismatch against Playwright 1.59, so the third browser project was switched to Microsoft Edge (`msedge`) per assignment rules.
   - *Locale fix:* Currency formatting (`toLocaleString()`) varies between `,` and `.` across browser locales, so assertions use `[.,]` regex patterns.

---

## 5. Reusable Agent Skill
- Built at `.agents/skills/playwright-data-driven-automation/SKILL.md` with template `references/test-template.md`.
- Standardizes the 5-phase workflow: Spec & SUT Code Analysis $\rightarrow$ External JSON Data Design $\rightarrow$ Multi-Browser Script Generation $\rightarrow$ Human Review Triage $\rightarrow$ Report Stamping & Git Commits.
