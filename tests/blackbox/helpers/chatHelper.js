// tests/blackbox/helpers/chatHelper.js
const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Helper điều khiển tương tác Chatbox Aria trên trang /menu
 * Khớp 100% với cấu trúc UI của AriaChatWidget
 */
class AriaChatHelper {
  constructor(page) {
    this.page = page;
  }

  // 1. Mở trang /menu và kích hoạt mở Widget Chat Aria
  async openMenuAndChat() {
    await this.page.goto('/menu');
    await this.page.waitForLoadState('domcontentloaded');

    // Chờ body sẵn sàng
    await expect(this.page.locator('body')).toBeVisible();

    // Kiểm tra nếu khung chat chưa mở thì mới click mở
    const chatInput = this.page.locator('textarea[placeholder="Nhập câu hỏi cho Aria..."]').first();
    if (!(await chatInput.isVisible())) {
      const openChatBtn = this.page.locator('button[aria-label="Mở Aria chat"]').first();
      await expect(openChatBtn).toBeVisible({ timeout: 10000 });
      await openChatBtn.click();
      await expect(chatInput).toBeVisible({ timeout: 5000 });
      await this.page.waitForTimeout(500);
    }
  }

  // 2. Gõ câu hỏi và gửi cho Aria
  async sendMessage(messageText) {
    const input = this.page.locator('textarea[placeholder="Nhập câu hỏi cho Aria..."]').first();
    await expect(input).toBeVisible();
    await input.fill(messageText);

    // Bấm nút gửi hoặc nhấn Enter
    const sendBtn = this.page.locator('button[aria-label="Gửi tin nhắn"]').first();
    if (await sendBtn.isEnabled()) {
      await sendBtn.click();
    } else {
      await input.press('Enter');
    }

    // Đợi Aria bắt đầu phản hồi và hoàn thành
    await this.page.waitForTimeout(2500);
  }

  /**
   * 3. Lấy tin nhắn phản hồi mới nhất của Aria
   */
  async getLastAriaResponse() {
    // Tin nhắn của Aria hiển thị trong khung chat
    const messages = this.page.locator('.chat-bubble, [class*="chat-message"], p.text-sm').all();
    const list = await messages;
    if (list.length > 0) {
      return await list[list.length - 1].innerText();
    }
    return '';
  }

  /**
   * 4. Lấy tất cả tin nhắn phản hồi của Aria
   */
  async getAllAriaResponses() {
    const botMessages = this.page.locator('div[class*="rounded-tl-sm"]');
    const count = await botMessages.count();
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push((await botMessages.nth(i).innerText()).trim());
    }
    return result;
  }

  /**
   * 5. Lấy danh sách thẻ món ăn (Product Cards) trong chat hoặc menu
   */
  getProductCards() {
    return this.page.locator(
      '[data-testid="food-card"], [data-testid="product-card"], .product-card, .food-card, [data-testid="dish-card"], div[class*="rounded-tl-sm"]:has(button:has-text("Thêm vào giỏ")), div[class*="rounded-tl-sm"]:has(button:has-text("Thêm"))'
    );
  }

  /**
   * 6. Lấy thẻ đặt bàn (Booking Cards)
   */
  getBookingCards() {
    return this.page.locator(
      '[data-testid="booking-card"], [data-testid="reservation-card"], .reservation-card, .booking-card, div[class*="rounded"]:has(button:has-text("Hủy")), div[class*="rounded"]:has(button:has-text("Chỉnh sửa"))'
    );
  }

  /**
   * 7. Lấy số lượng giỏ hàng trên badge
   */
  async getCartCount() {
    const badge = this.page.locator(
      '[data-testid="cart-count"], [data-testid="cart-badge"], .cart-badge, [data-testid="badge-cart"], button:has-text("Shopping Cart") span'
    ).first();
    if (await badge.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await badge.innerText();
      return parseInt(text.replace(/\D/g, '') || '0', 10);
    }
    return 0;
  }

  /**
   * 8. Chụp ảnh màn hình bước kiểm thử
   */
  async takeStepScreenshot(stepName) {
    const dir = path.resolve(process.cwd(), 'test-results/screenshots');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await this.page.screenshot({ path: path.join(dir, `${stepName}.png`), fullPage: false });
  }
}

module.exports = { AriaChatHelper };
