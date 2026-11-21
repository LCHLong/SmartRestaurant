// tests/blackbox/app.spec.js
const { test, expect } = require('@playwright/test');

test.describe('SmartRestaurant Black-box Tests - Aria Chatbox', () => {
  test('Kiểm tra tải trang /menu và mở AI Widget Aria', async ({ page }) => {
    // 1. Điều hướng thẳng tới trang /menu
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    // Chụp ảnh màn hình bước đầu tại /menu
    await page.screenshot({ path: 'test-results/screenshots/step-1-menu-page.png' });

    // 2. Click vào Floating Bubble ở góc dưới bên phải để mở AI Widget
    const openChatBtn = page.locator('button[aria-label="Mở Aria chat"]').first();
    await expect(openChatBtn).toBeVisible({ timeout: 10000 });
    await openChatBtn.click();

    // 3. Đợi ô nhập tin nhắn xuất hiện
    const chatInput = page.locator('textarea[placeholder="Nhập câu hỏi cho Aria..."]').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // Chụp ảnh khung chat Aria đã mở hoàn chỉnh
    await page.screenshot({ path: 'test-results/screenshots/step-2-aria-widget-opened.png' });
  });
});
