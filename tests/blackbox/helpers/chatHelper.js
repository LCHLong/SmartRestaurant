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
    this.lastSentMessage = '';
  }

  // 1. Mở trang /menu và kích hoạt mở Widget Chat Aria
  async openMenuAndChat() {
    await this.page.goto('/menu');
    await this.page.waitForLoadState('domcontentloaded');

    // Chờ và bấm modal Welcome ("Continue as Guest") nếu có
    const guestBtn = this.page.locator('button:has-text("Continue as Guest")').first();
    try {
      await guestBtn.waitFor({ state: 'visible', timeout: 3000 });
      await guestBtn.click();
      await this.page.waitForTimeout(400);
    } catch (e) {
      // Bỏ qua nếu không có modal
    }

    // Đóng bất kỳ modal món ăn nào vô tình mở
    const closeBtn = this.page.locator('button:has-text("×"), button:has-text("✕")').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click().catch(() => {});
      await this.page.waitForTimeout(300);
    }

    // Kiểm tra trạng thái thực sự của Aria chat widget
    const chatWidget = this.page.locator('div[class*="fixed bottom-24 right-4"]').first();
    let isWidgetOpen = false;
    try {
      const isVisible = await chatWidget.isVisible({ timeout: 1500 });
      if (isVisible) {
        isWidgetOpen = await chatWidget.evaluate(el => {
          return el.getAttribute('aria-hidden') === 'false' && el.classList.contains('opacity-100');
        }).catch(() => false);
      }
    } catch (e) {
      isWidgetOpen = false;
    }

    if (!isWidgetOpen) {
      const openChatBtn = this.page.locator('button[aria-label="Mở Aria chat"]').first();
      await openChatBtn.waitFor({ state: 'visible', timeout: 8000 });
      await openChatBtn.click();

      // Đợi widget chuyển sang opacity-100 và aria-hidden="false"
      await expect(async () => {
        const isOpen = await chatWidget.evaluate(el => {
          return el.getAttribute('aria-hidden') === 'false' && el.classList.contains('opacity-100');
        }).catch(() => false);
        expect(isOpen).toBe(true);
      }).toPass({ timeout: 6000, intervals: [300, 500] });
    }

    // Đợi ô input sẵn sàng
    const chatInput = this.page.locator('textarea[placeholder="Nhập câu hỏi cho Aria..."]').first();
    await chatInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.page.waitForTimeout(300);
  }

  // 2. Gõ câu hỏi và gửi cho Aria
  async sendMessage(messageText) {
    this.lastSentMessage = messageText;
    const chatWidget = this.page.locator('div[class*="fixed bottom-24 right-4"]').first();

    // Đảm bảo widget đang mở
    let isWidgetOpen = false;
    try {
      const isVisible = await chatWidget.isVisible({ timeout: 1000 });
      if (isVisible) {
        isWidgetOpen = await chatWidget.evaluate(el => {
          return el.getAttribute('aria-hidden') === 'false' && el.classList.contains('opacity-100');
        }).catch(() => false);
      }
    } catch (e) {
      isWidgetOpen = false;
    }
    if (!isWidgetOpen) {
      const openChatBtn = this.page.locator('button[aria-label="Mở Aria chat"]').first();
      if (await openChatBtn.isVisible()) {
        await openChatBtn.click();
        await this.page.waitForTimeout(500);
      }
    }

    const input = this.page.locator('textarea[placeholder="Nhập câu hỏi cho Aria..."]').first();
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.fill(messageText);

    // Đếm số bubble bot hiện có trước khi gửi
    const botBubbles = chatWidget.locator('div.flex:has(div:text-is("A"))');
    const initialBotCount = await botBubbles.count();

    const sendBtn = this.page.locator('button[aria-label="Gửi tin nhắn"]').first();
    await sendBtn.waitFor({ state: 'visible', timeout: 3000 });
    await sendBtn.click();

    // Đợi bubble phản hồi mới của bot xuất hiện
    await expect(async () => {
      const currentCount = await botBubbles.count();
      expect(currentCount).toBeGreaterThan(initialBotCount);
    }).toPass({ timeout: 45000, intervals: [500, 1000] });

    // Đợi phản hồi hoàn thành việc streaming (ổn định độ dài chuỗi text)
    let lastLen = 0;
    let stableCount = 0;
    for (let i = 0; i < 20; i++) {
      await this.page.waitForTimeout(600);
      const text = await this.getLastAriaResponse();
      if (text.length > 0 && text.length === lastLen) {
        stableCount++;
        if (stableCount >= 2) break;
      } else {
        lastLen = text.length;
        stableCount = 0;
      }
    }
  }

  /**
   * 3. Lấy tin nhắn phản hồi mới nhất của Aria
   */
  async getLastAriaResponse() {
    const chatWidget = this.page.locator('div[class*="fixed bottom-24 right-4"]').first();
    const botBubbles = chatWidget.locator('div.flex:has(div:text-is("A"))');
    const count = await botBubbles.count();
    if (count > 0) {
      const text = await botBubbles.nth(count - 1).innerText();
      return text.replace(/^A\s*/i, '').trim();
    }
    return '';
  }

  /**
   * 4. Lấy tất cả tin nhắn phản hồi của Aria
   */
  async getAllAriaResponses() {
    const chatWidget = this.page.locator('div[class*="fixed bottom-24 right-4"]').first();
    const botBubbles = chatWidget.locator('div.flex:has(div:text-is("A"))');
    const count = await botBubbles.count();
    const result = [];
    for (let i = 0; i < count; i++) {
      const text = await botBubbles.nth(i).innerText();
      result.push(text.replace(/^A\s*/i, '').trim());
    }
    return result;
  }

  /**
   * 5. Lấy danh sách thẻ món ăn (Product Cards) trong chat
   */
  getProductCards() {
    const chatWidget = this.page.locator('div[class*="fixed bottom-24 right-4"]').first();
    return chatWidget.locator('div[class*="border-orange-100"]');
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
      '[data-testid="cart-count"], [data-testid="cart-badge"], .cart-badge, [data-testid="badge-cart"], button:has-text("Shopping Cart") span, button:has(span:has-text("shopping_cart")) span'
    ).first();
    if (await badge.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await badge.innerText();
      const count = parseInt(text.replace(/\D/g, '') || '0', 10);
      if (count > 0) return count;
    }
    // Fallback: Kiểm tra trực tiếp giỏ hàng trong window.localStorage
    const storageCount = await this.page.evaluate(() => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        return Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
      } catch (e) {
        return 0;
      }
    }).catch(() => 0);
    return storageCount;
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
