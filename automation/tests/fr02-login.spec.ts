/**
 * FR-02: Login and Account Lockout (Data-Driven Multi-Browser Suite)
 * Covers positive login, JWT Bearer header, lockout thresholds, 30s unlock, and FR-21/22/23 UI specs.
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const dataPath = path.resolve(__dirname, '../data/fr02-login.json');
const testData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const API_URL = testData.apiUrl;

test.describe('FR-02: Login and Account Lockout', () => {
  // Helper to fill and submit the login form on /login
  async function submitLoginForm(page: any, email: string, password: string) {
    const inputs = page.locator('form input');
    await inputs.nth(0).fill(email);
    await inputs.nth(1).fill(password);
    await page.locator('form button[type="submit"]').click();
  }

  // Data-driven positive & non-existent email login cases
  for (const tc of testData.loginCases) {
    test(`${tc.id}: ${tc.title}`, async ({ page }) => {
      await page.goto('/login');
      await submitLoginForm(page, tc.email, tc.password);

      if (tc.shouldHaveToken) {
        await expect(page).toHaveURL(tc.expectedUrl);
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeTruthy();
      } else {
        await expect(page).toHaveURL(/\/login/);
        const errorBanner = page.locator('div.bg-red-100');
        await expect(errorBanner).toBeVisible();
        await expect(errorBanner).toContainText(tc.expectedError);
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeNull();
      }
    });
  }

  // TC-FR02-03: Verify JWT Bearer token is sent on authenticated API requests
  test(`${testData.uiSpecCases['TC-FR02-03'].id}: ${testData.uiSpecCases['TC-FR02-03'].title}`, async ({ page }) => {
    const tc = testData.uiSpecCases['TC-FR02-03'];
    await page.goto('/login');

    const meRequestPromise = page.waitForRequest(
      (req) => req.url().includes('/api/users/me') && req.method() === 'GET'
    );

    await submitLoginForm(page, tc.email, tc.password);
    const meRequest = await meRequestPromise;
    const authHeader = meRequest.headers()['authorization'];

    expect(authHeader).toBeDefined();
    expect(authHeader).toMatch(/^Bearer\s+\S+/);
  });

  // Data-driven lockout & unlock boundary cases (isolated user per test & browser)
  for (const tc of testData.lockoutCases) {
    test(`${tc.id}: ${tc.title}`, async ({ page, request }, testInfo) => {
      test.setTimeout(tc.waitSeconds > 0 ? 60000 : 30000);

      // Register an isolated user so tests across browsers do not lock shared seed accounts
      const uniqueEmail = `locktest_${tc.id.toLowerCase()}_${testInfo.project.name}_${Date.now()}@eshop.com`;
      const regRes = await request.post(`${API_URL}/api/register`, {
        data: {
          name: 'Lockout Test User',
          email: uniqueEmail,
          password: tc.validPassword,
        },
      });
      expect(regRes.status()).toBe(200);

      await page.goto('/login');

      for (let i = 0; i < tc.wrongAttempts; i++) {
        const loginResPromise = page.waitForResponse(
          (res) => res.url().includes('/api/login') && res.request().method() === 'POST'
        );
        await submitLoginForm(page, uniqueEmail, tc.wrongPassword);
        await loginResPromise;
      }

      if (tc.waitSeconds > 0) {
        await page.waitForTimeout(tc.waitSeconds * 1000);
      }

      const finalLoginPromise = page.waitForResponse(
        (res) => res.url().includes('/api/login') && res.request().method() === 'POST'
      );
      await submitLoginForm(page, uniqueEmail, tc.validPassword);
      const finalRes = await finalLoginPromise;

      if (tc.expectLocked) {
        expect(finalRes.status()).toBe(403);
        const body = await finalRes.json();
        expect(body.error).toContain('khóa');
        await expect(page).toHaveURL(/\/login/);
      } else {
        expect(finalRes.status()).toBe(200);
        await expect(page).toHaveURL('/');
      }
    });
  }

  // TC-FR02-09 & TC-FR02-10: Input validation cases
  test(`${testData.validationCases[0].id}: ${testData.validationCases[0].title}`, async ({ page }) => {
    const tc = testData.validationCases[0];
    await page.goto('/login');

    let loginApiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/login')) loginApiCalled = true;
    });

    await submitLoginForm(page, tc.email, tc.password);
    await expect(page).toHaveURL(/\/login/);
    expect(loginApiCalled).toBe(false);
  });

  test(`${testData.validationCases[1].id}: ${testData.validationCases[1].title}`, async ({ page }) => {
    const tc = testData.validationCases[1];
    await page.goto('/login');

    const emailInput = page.locator('form input').nth(0);
    await expect(emailInput).toHaveAttribute('type', tc.expectedInputType);
  });

  // TC-FR02-11: Password masking check
  test(`${testData.uiSpecCases['TC-FR02-11'].id}: ${testData.uiSpecCases['TC-FR02-11'].title}`, async ({ page }) => {
    const tc = testData.uiSpecCases['TC-FR02-11'];
    await page.goto('/login');

    const passwordInput = page.locator('form input').nth(1);
    await expect(passwordInput).toHaveAttribute('type', tc.expectedType);
  });

  // TC-FR02-12: Error message position above submit button (FR-22)
  test(`${testData.uiSpecCases['TC-FR02-12'].id}: ${testData.uiSpecCases['TC-FR02-12'].title}`, async ({ page }) => {
    const tc = testData.uiSpecCases['TC-FR02-12'];
    await page.goto('/login');

    await submitLoginForm(page, tc.email, tc.password);
    const errorBanner = page.locator('div.bg-red-100');
    const submitBtn = page.locator('form button[type="submit"]');

    await expect(errorBanner).toBeVisible();
    const errorBox = await errorBanner.boundingBox();
    const submitBox = await submitBtn.boundingBox();

    expect(errorBox).not.toBeNull();
    expect(submitBox).not.toBeNull();
    expect(errorBox!.y).toBeLessThan(submitBox!.y);
  });

  // TC-FR02-13: Vietnamese UI heading & submit button label (FR-21)
  test(`${testData.uiSpecCases['TC-FR02-13'].id}: ${testData.uiSpecCases['TC-FR02-13'].title}`, async ({ page }) => {
    const tc = testData.uiSpecCases['TC-FR02-13'];
    await page.goto('/login');

    const heading = page.locator('h1, h2').first();
    const submitBtn = page.locator('form button[type="submit"]');

    await expect(heading).toHaveText(new RegExp(tc.expectedHeading, 'i'));
    await expect(submitBtn).toHaveText(new RegExp(tc.expectedButtonText, 'i'));
  });

  // TC-FR02-14: Logout button label 'Đăng xuất' (FR-23)
  test(`${testData.uiSpecCases['TC-FR02-14'].id}: ${testData.uiSpecCases['TC-FR02-14'].title}`, async ({ page }) => {
    const tc = testData.uiSpecCases['TC-FR02-14'];
    await page.goto('/login');
    await submitLoginForm(page, tc.email, tc.password);
    await expect(page).toHaveURL('/');

    const logoutBtn = page.locator('header nav button');
    await expect(logoutBtn).toBeVisible();
    await expect(logoutBtn).toHaveText(tc.expectedLogoutLabel);
  });
});
