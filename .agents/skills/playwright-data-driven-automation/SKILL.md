---
name: playwright-data-driven-automation
description: Step-by-step workflow to design, generate, review, execute, and maintain data-driven, multi-browser Playwright automation test suites for web features, including HTML report stamping and AI audit logging.
---

# Playwright Data-Driven Multi-Browser Automation Skill

Use this skill whenever you need to automate end-to-end (E2E), UI, or access-control tests for a web feature using **Playwright**, following a disciplined **AI-First + Human Review** workflow.

---

## Step 1: Analyze Specification & Real SUT Source Code
1. Read the feature specification (e.g., `README.md` or SRS document) and list all functional, validation, UI, and security requirements.
2. Inspect the actual frontend components and backend API handlers to identify:
   - Exact routes, DOM roles/labels, input types, and API endpoints.
   - Potential discrepancies between the specification and implementation (intentional or real defects).
3. **Rule:** Always write assertions against the **specification** (expected behavior), not against buggy implementation behavior, so real SUT defects are surfaced as failing assertions.

---

## Step 2: Design Test Cases & Externalize Test Data
1. Design at least **12 test cases** per feature covering:
   - **Positive cases** (happy paths)
   - **Negative cases** (invalid inputs, unauthorized roles, missing tokens)
   - **Boundary / Edge cases** (timeouts, empty states, duplicate items, thresholds)
   - **UI / Spec compliance cases** (input `type`, labels, error placement, breadcrumbs, badges)
2. Store all test inputs, accounts, routes, and expected values in a dedicated external file:
   - `automation/data/<feature-id>.json` (or `.csv`)
   - **Never** hardcode inline test data arrays or credential objects inside `.spec.ts`.

---

## Step 3: Generate Data-Driven Playwright Script
Create `automation/tests/<feature-id>.spec.ts` following these reliability rules:
1. **Load external data:** Read and parse `automation/data/<feature-id>.json` using `fs` and `path`.
2. **Use $\ge 3$ distinct assertion patterns**, such as:
   - Navigation: `await expect(page).toHaveURL(...)`
   - Visibility & text: `await expect(locator).toBeVisible()`, `await expect(locator).toContainText(...)`
   - Attributes & count: `await expect(locator).toHaveAttribute(...)`, `await expect(locator).toHaveCount(...)`
   - API status & layout: `expect(res.status()).toBe(...)`, `expect(boxA.y).toBeLessThan(boxB.y)`
3. **Prevent cross-browser test pollution:**
   - For stateful tests (e.g., account lockout, user deletion), dynamically register an isolated user per `(testCase, browserProject)` via API instead of mutating shared seed accounts.
   - For mutations that may bypass authorization checks, clean up created records in the test teardown.
4. **Avoid common flakiness & race conditions:**
   - For `alert()` / `confirm()` triggered after an async API call, register `const dialogPromise = page.waitForEvent('dialog')` **before** clicking, then `await dialogPromise`.
   - Use locale-tolerant regex for formatted numbers/currency (e.g., `/30[.,]000[.,]000\s*₫/`) across Chromium, Edge, and WebKit.
   - Use client-side navigation (navbar link clicks) instead of `page.goto()` when testing in-memory React Context state (e.g., shopping cart).

---

## Step 4: Execute Multi-Browser & Perform Human Review
1. Validate test discovery across all 3 configured browsers (`chromium`, `msedge`/`firefox`, `webkit`):
   ```powershell
   npx.cmd playwright test tests/<feature-id>.spec.ts --list
   ```
2. Run the feature suite across all 3 browsers:
   ```powershell
   node scripts/run-tests.js tests/<feature-id>.spec.ts
   ```
3. **Human Review Triage:**
   - Inspect every failure in `report/playwright-report/index.html` and `automation/test-results/`.
   - Separate **script defects** (race conditions, wrong selectors, missing waits) from **genuine SUT defects** (spec violations).
   - Fix all script defects immediately and re-run to confirm consistent behavior across all 3 browsers.
   - Document genuine SUT defects with screenshots in the Bug Report and GitHub Issues.

---

## Step 5: Stamp Report, Update AI Log & Commit
1. Ensure `scripts/stamp-report.js` stamps `report/playwright-report/index.html` with:
   ```text
   Run by: <StudentID> | <ISO-8601 Timestamp>
   ```
2. Append the interaction (AI tool, ISO timestamp, prompt, output, and human fixes) to `report/AI_log.md`.
3. Commit test script and data changes with clear, atomic commit messages (e.g., `test(fr02): add data-driven login and lockout suite`, `fix(fr12): await async dialog event to prevent race condition`).

---

## Reference Templates
See [test-template.md](references/test-template.md) for the standard JSON data and `.spec.ts` skeleton.
