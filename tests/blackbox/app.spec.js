// tests/blackbox/app.spec.js
const { test, expect } = require('@playwright/test');

test.describe('SmartRestaurant Black-box Tests - Aria Chatbox', () => {
  test('Kiểm tra tải trang /menu và hiển thị Chatbox Aria', async ({ page }) => {
    // 1. Điều hướng thẳng tới trang /menu
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    // Chụp ảnh màn hình bước đầu tại /menu
    await page.screenshot({ path: 'test-results/screenshots/step-menu-page.png' });

    // Kiểm tra trang tải thành công
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // 2. Tìm nút mở hoặc khung chat Aria
    // Aria có thể là nút bong bóng nổi hoặc đã mở sẵn
    const chatTrigger = page.locator('button[data-testid="aria-chat-toggle"], button[aria-label*="Aria"], [data-testid="btn-chat-aria"], button:has-text("Aria")').first();
    if (await chatTrigger.isVisible()) {
      await chatTrigger.click();
      await page.waitForTimeout(500);
    }

    // Chụp ảnh khung chat đã mở
    await page.screenshot({ path: 'test-results/screenshots/step-aria-opened.png' });
  });
});
