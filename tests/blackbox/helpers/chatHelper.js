// tests/blackbox/helpers/chatHelper.js
const { expect } = require('@playwright/test');

/**
 * Helper điều khiển tương tác Chatbox Aria trên trang /menu
 */
class AriaChatHelper {
  constructor(page) {
    this.page = page;
  }

  // 1. Mở trang /menu và kích hoạt Chatbox Aria
  async openMenuAndChat() {
    await this.page.goto('/menu');
    await this.page.waitForLoadState('networkidle');

    // Tìm và mở chatbox nếu chưa mở
    const chatToggle = this.page.locator('button[data-testid="aria-chat-toggle"], button[aria-label*="Aria"], [data-testid="btn-chat-aria"], button:has-text("Aria")').first();
    if (await chatToggle.isVisible()) {
      await chatToggle.click();
      await this.page.waitForTimeout(500);
    }
  }

  // 2. Gửi một tin nhắn văn bản vào Aria
  async sendMessage(messageText) {
    const input = this.page.locator('input[data-testid="input-chat-message"], textarea[data-testid="input-chat-message"], input[placeholder*="Aria"], textarea[placeholder*="Aria"], input[placeholder*="nhắn"], textarea[placeholder*="nhắn"]').first();
    await input.fill(messageText);
    await this.page.keyboard.press('Enter');
    
    // Đợi Aria trả lời (loading biến mất hoặc tin nhắn mới xuất hiện)
    await this.page.waitForTimeout(2000);
  }

  // 3. Lấy tin nhắn phản hồi mới nhất của Aria
  async getLastAriaResponse() {
    const messages = this.page.locator('[data-testid="chat-message-aria"], .aria-message, [data-sender="aria"]').all();
    const list = await messages;
    if (list.length > 0) {
      return await list[list.length - 1].innerText();
    }
    return '';
  }

  // 4. Chụp ảnh màn hình bước kiểm thử
  async takeStepScreenshot(stepName) {
    await this.page.screenshot({ path: `test-results/screenshots/${stepName}.png` });
  }
}

module.exports = { AriaChatHelper };
