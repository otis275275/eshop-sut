/**
 * FR-07: Shopping Cart (Data-Driven Multi-Browser Suite)
 * Covers empty state, adding/merging items, quantity controls, delete confirmation, and FR-23/24 UI specs.
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const dataPath = path.resolve(__dirname, '../data/fr07-cart.json');
const testData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

test.describe('FR-07: Shopping Cart', () => {
  // Helper to add a product by name from Home page using client-side navigation (preserves React CartContext state)
  async function addProductFromHome(page: any, productName: string) {
    const card = page.locator('div.border.rounded').filter({ hasText: productName }).first();
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Thêm vào giỏ' }).click();
  }

  async function goToCartViaNavbar(page: any) {
    await page.locator('header nav a[href="/cart"]').click();
    await expect(page).toHaveURL(/\/cart/);
  }

  test('TC-FR07-01: Empty cart displays empty message and link to home', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('h2')).toContainText(testData.expectedLabels.emptyTitle);
    const continueLink = page.getByRole('link', { name: testData.expectedLabels.continueShopping });
    await expect(continueLink).toBeVisible();
    await expect(continueLink).toHaveAttribute('href', '/');
  });

  test('TC-FR07-02: Empty cart displays illustration or icon per FR-07 and FR-24', async ({ page }) => {
    await page.goto('/cart');
    const illustration = page.locator('main img, main svg');
    await expect(illustration.first()).toBeVisible();
  });

  test('TC-FR07-03: Adding 1 product from home displays correct name, quantity and subtotal', async ({ page }) => {
    const product = testData.products.primary;
    await page.goto('/');
    await addProductFromHome(page, product.name);
    await goToCartViaNavbar(page);

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(product.name);
    await expect(rows.first().locator('td').nth(2)).toContainText('1');
    await expect(rows.first().locator('td').nth(3)).toContainText(new RegExp(`${product.pricePattern}\\s*₫`));
  });

  test('TC-FR07-04: Adding 2 different products displays 2 rows and accurate total', async ({ page }) => {
    const p1 = testData.products.primary;
    const p2 = testData.products.secondary;
    await page.goto('/');
    await addProductFromHome(page, p1.name);
    await addProductFromHome(page, p2.name);
    await goToCartViaNavbar(page);

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText(p1.name);
    await expect(rows.nth(1)).toContainText(p2.name);
    await expect(page.locator('main')).toContainText(new RegExp(`${testData.combinedTotalPattern}\\s*₫`));
  });

  test('TC-FR07-05: Adding the same product twice merges into 1 row with quantity 2', async ({ page }) => {
    const product = testData.products.primary;
    await page.goto('/');
    await addProductFromHome(page, product.name);
    await addProductFromHome(page, product.name);
    await goToCartViaNavbar(page);

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator('td').nth(2)).toContainText('2');
  });

  test('TC-FR07-06: Cart table headers match FR-07 specification', async ({ page }) => {
    const product = testData.products.primary;
    await page.goto('/');
    await addProductFromHome(page, product.name);
    await goToCartViaNavbar(page);

    const headers = page.locator('thead th');
    await expect(headers).toHaveCount(testData.expectedColumns.length);
    for (let i = 0; i < testData.expectedColumns.length; i++) {
      await expect(headers.nth(i)).toHaveText(testData.expectedColumns[i]);
    }
  });

  test('TC-FR07-07: Quantity column provides +/- buttons to adjust item quantity', async ({ page }) => {
    const product = testData.products.primary;
    await page.goto('/');
    await addProductFromHome(page, product.name);
    await goToCartViaNavbar(page);

    const qtyCell = page.locator('tbody tr').first().locator('td').nth(2);
    await expect(qtyCell.getByRole('button', { name: '+' })).toBeVisible();
    await expect(qtyCell.getByRole('button', { name: '-' })).toBeVisible();
  });

  test('TC-FR07-08: Clicking Delete prompts a confirmation dialog before removing item', async ({ page }) => {
    const product = testData.products.primary;
    await page.goto('/');
    await addProductFromHome(page, product.name);
    await goToCartViaNavbar(page);

    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await page.locator('tbody tr').first().getByRole('button', { name: 'Xóa' }).click();

    // Either a browser confirm dialog or a custom confirmation modal must appear; item must NOT be deleted without confirmation
    const customConfirm = page.locator('[role="dialog"], .modal');
    const hasCustomModal = (await customConfirm.count()) > 0;
    expect(dialogTriggered || hasCustomModal).toBe(true);
    await expect(page.locator('tbody tr')).toHaveCount(1);
  });

  test("TC-FR07-09: Cart total label must be 'Tổng cộng' per FR-07", async ({ page }) => {
    const product = testData.products.primary;
    await page.goto('/');
    await addProductFromHome(page, product.name);
    await goToCartViaNavbar(page);

    await expect(page.locator('main')).toContainText(testData.expectedLabels.totalLabel);
  });

  test("TC-FR07-10: Continue shopping button must be labeled 'Tiếp tục mua sắm' and navigate home", async ({ page }) => {
    const product = testData.products.primary;
    await page.goto('/');
    await addProductFromHome(page, product.name);
    await goToCartViaNavbar(page);

    const continueBtn = page.getByRole('link', { name: testData.expectedLabels.continueShopping });
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();
    await expect(page).toHaveURL('/');
  });

  test('TC-FR07-11: Navbar Cart link displays item quantity badge per FR-23', async ({ page }) => {
    const product = testData.products.primary;
    await page.goto('/');
    await addProductFromHome(page, product.name);

    const cartLink = page.locator('header nav a[href="/cart"]');
    await expect(cartLink).toContainText('1');
  });

  test('TC-FR07-12: Cart page includes navigation breadcrumb per FR-23', async ({ page }) => {
    await page.goto('/cart');
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"], .breadcrumb');
    await expect(breadcrumb).toBeVisible();
  });

  test('TC-FR07-13: Product detail Add to Cart works on the first click', async ({ page }) => {
    const product = testData.products.primary;
    await page.goto(`/product/${product.id}`);

    const addBtn = page.getByRole('button', { name: /Thêm vào giỏ/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await expect(addBtn).toContainText(testData.expectedLabels.addedFeedback);
  });

  test('TC-FR07-14: Unauthenticated user clicking Checkout is alerted and redirected to /login', async ({ page }) => {
    const product = testData.products.primary;
    await page.goto('/');
    await addProductFromHome(page, product.name);
    await goToCartViaNavbar(page);

    let alertMessage = '';
    page.on('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();
    expect(alertMessage).toContain('đăng nhập');
    await expect(page).toHaveURL(/\/login/);
  });
});
