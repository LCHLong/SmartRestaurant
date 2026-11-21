// tests/blackbox/app.spec.js
const { test, expect } = require('@playwright/test');
const { AriaChatHelper } = require('./helpers/chatHelper');

test.describe('SmartRestaurant Black-box Tests - Aria Chatbox Smoke Test', () => {
  test('Kiểm tra tải trang /menu và mở AI Widget Aria', async ({ page }) => {
    const aria = new AriaChatHelper(page);
    await aria.openMenuAndChat();

    // Chụp ảnh màn hình bước đầu tại /menu
    await aria.takeStepScreenshot('smoke-step-1-menu-page');

    // Đợi ô nhập tin nhắn xuất hiện
    const chatInput = page.locator('textarea[placeholder="Nhập câu hỏi cho Aria..."]').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // Chụp ảnh khung chat Aria đã mở hoàn chỉnh
    await aria.takeStepScreenshot('smoke-step-2-aria-widget-opened');
  });
});
