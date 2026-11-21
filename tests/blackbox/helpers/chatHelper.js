// tests/blackbox/helpers/chatHelper.js
const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

class AriaChatHelper {
  constructor(page) {
    this.page = page;
  }

  /**
   * 1. Mở trang /menu, xử lý Modal Welcome và kích hoạt Chatbox Aria
   */
  async openMenuAndChat() {
    await this.page.goto('/menu');
    await this.page.waitForLoadState('domcontentloaded');

    // Chờ body sẵn sàng
    await expect(this.page.locator('body')).toBeVisible();

    // 1.1 Xử lý Modal "Welcome! How would you like to order?" nếu xuất hiện
    const guestBtn = this.page.locator(
      'button:has-text("Continue as Guest"), button:has-text("Order without login"), button:has-text("Khách"), [data-testid="btn-guest"]'
    ).first();

    if (await guestBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await guestBtn.click();
      await this.page.waitForTimeout(400);
    }

    // 1.2 Kiểm tra xem ô chat đã mở sẵn chưa
    const chatInput = this.page.locator('textarea[placeholder*="Aria"], input[placeholder*="Aria"]').first();

    const isInputVisible = await chatInput.isVisible({ timeout: 500 }).catch(() => false);
    if (!isInputVisible) {
      // Tìm và click nút "Mở Aria chat" (nút tròn robot màu cam)
      const chatToggle = this.page.locator(
        'button[aria-label="Mở Aria chat"], button[data-testid="aria-chat-toggle"], button:has([class*="bot"]), button.fixed.bottom-5.right-4, button.fixed.bottom-6.right-6'
      ).first();

      if (await chatToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
        await chatToggle.click();
        await this.page.waitForTimeout(600);
      }
    }

    // Đợi ô chat input xuất hiện
    await expect(this.page.locator('textarea[placeholder*="Aria"], input[placeholder*="Aria"]').first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * 2. Gửi một tin nhắn văn bản vào Aria và chờ phản hồi hoàn tất
   */
  async sendMessage(messageText, waitMs = 0) {
    const input = this.page.locator('textarea[placeholder*="Aria"], input[placeholder*="Aria"]').first();
    await expect(input).toBeVisible({ timeout: 10000 });

    const botMessages = this.page.locator('div[class*="rounded-tl-sm"]');
    const initialCount = await botMessages.count();

    await input.fill(messageText);
    await input.press('Enter');

    // Chờ phản hồi mới xuất hiện và nội dung ổn định
    const startTime = Date.now();
    let prevText = '';
    let stableCount = 0;

    while (Date.now() - startTime < 35000) {
      await this.page.waitForTimeout(500);
      const currentCount = await botMessages.count();
      if (currentCount > initialCount) {
        const currentText = (await botMessages.last().innerText()).trim();
        if (currentText.length > 0 && currentText === prevText) {
          stableCount++;
          if (stableCount >= 2) {
            break;
          }
        } else {
          stableCount = 0;
          prevText = currentText;
        }
      }
    }

    if (waitMs > 0) {
      await this.page.waitForTimeout(waitMs);
    } else {
      await this.page.waitForTimeout(400);
    }
  }

  /**
   * 3. Lấy tin nhắn phản hồi mới nhất của Aria
   */
  async getLastAriaResponse() {
    const botMessages = this.page.locator('div[class*="rounded-tl-sm"]');
    const count = await botMessages.count();
    if (count > 0) {
      return (await botMessages.last().innerText()).trim();
    }
    // Fallback: tìm qua các selector khác
    const fallback = this.page.locator('[data-testid="chat-message-aria"], [data-sender="aria"], .aria-message');
    const fbCount = await fallback.count();
    if (fbCount > 0) {
      return (await fallback.last().innerText()).trim();
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
