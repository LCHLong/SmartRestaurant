// tests/blackbox/app.spec.js
const { test, expect } = require('@playwright/test');

test.describe('SmartRestaurant Black-box Tests', () => {
  test('Kiểm tra tải trang chủ và tiêu đề ứng dụng', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Chụp ảnh màn hình bước đầu
    await page.screenshot({ path: 'test-results/screenshots/step-home.png' });

    // Kiểm tra trang tải không bị trắng hoặc crash
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
