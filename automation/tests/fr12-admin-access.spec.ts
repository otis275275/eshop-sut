/**
 * FR-12: Web Admin Access Control (Data-Driven Multi-Browser Suite)
 * Covers Admin UI login/rejection on :5174 and backend JWT + role='admin' RBAC enforcement on :3000.
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const dataPath = path.resolve(__dirname, '../data/fr12-admin-access.json');
const testData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const ADMIN_URL = testData.adminUrl;
const API_URL = testData.apiUrl;

test.describe('FR-12: Web Admin Access Control', () => {
  async function getToken(request: any, email: string, password: string): Promise<string> {
    const res = await request.post(`${API_URL}/api/login`, {
      data: { email, password },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    return body.token;
  }

  // UI Cases on Web Admin (http://localhost:5174)
  test(`${testData.uiCases['TC-FR12-01'].id}: ${testData.uiCases['TC-FR12-01'].title}`, async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.getByPlaceholder('Email').fill(testData.accounts.admin.email);
    await page.getByPlaceholder('Password').fill(testData.accounts.admin.password);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('h1')).toHaveText('EShop Admin');
    await expect(page.locator('h2')).toHaveText('Dashboard');
    const adminToken = await page.evaluate(() => localStorage.getItem('adminToken'));
    expect(adminToken).toBeTruthy();
  });

  test(`${testData.uiCases['TC-FR12-02'].id}: ${testData.uiCases['TC-FR12-02'].title}`, async ({ page }) => {
    await page.goto(ADMIN_URL);

    const dialogPromise = page.waitForEvent('dialog');
    await page.getByPlaceholder('Email').fill(testData.accounts.user.email);
    await page.getByPlaceholder('Password').fill(testData.accounts.user.password);
    await page.getByRole('button', { name: 'Login' }).click();

    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('không phải là admin');
    await dialog.accept();

    await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();
    const adminToken = await page.evaluate(() => localStorage.getItem('adminToken'));
    expect(adminToken).toBeNull();
  });

  test(`${testData.uiCases['TC-FR12-03'].id}: ${testData.uiCases['TC-FR12-03'].title}`, async ({ page }) => {
    await page.goto(ADMIN_URL);
    await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();
    await expect(page.locator('h1', { hasText: 'EShop Admin' })).toHaveCount(0);
  });

  test(`${testData.uiCases['TC-FR12-04'].id}: ${testData.uiCases['TC-FR12-04'].title}`, async ({ page, request }) => {
    const userToken = await getToken(
      request,
      testData.accounts.user.email,
      testData.accounts.user.password
    );

    await page.goto(ADMIN_URL);
    await page.evaluate((t) => localStorage.setItem('adminToken', t), userToken);
    await page.reload();

    // Backend must reject non-admin token with 403, causing Web Admin to clear token and show Admin Login
    await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();
  });

  // Data-driven API Access Control Cases (http://localhost:3000)
  for (const tc of testData.apiAccessCases) {
    test(`${tc.id}: ${tc.title}`, async ({ request }) => {
      let headers: Record<string, string> = {};
      if (tc.authType === 'invalid') {
        headers['Authorization'] = `Bearer ${testData.invalidToken}`;
      } else if (tc.authType === 'user') {
        const userToken = await getToken(
          request,
          testData.accounts.user.email,
          testData.accounts.user.password
        );
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      // Make payload unique for coupon code if repeated across browsers
      const payload = tc.payload ? { ...tc.payload } : undefined;
      if (payload && payload.code) {
        payload.code = `${payload.code}_${Date.now()}`;
      }

      const response = await request.fetch(`${API_URL}${tc.endpoint}`, {
        method: tc.method,
        headers,
        data: payload,
      });

      // Clean up any leaked record created due to missing server authorization
      if (response.status() === 200 && tc.cleanupEndpoint) {
        try {
          const body = await response.json();
          if (body && body.id) {
            const adminToken = await getToken(
              request,
              testData.accounts.admin.email,
              testData.accounts.admin.password
            );
            await request.delete(`${API_URL}${tc.cleanupEndpoint}/${body.id}`, {
              headers: { Authorization: `Bearer ${adminToken}` },
            });
          }
        } catch {
          // ignore cleanup parse errors
        }
      }

      expect(response.status()).toBe(tc.expectedStatus);
    });
  }
});
