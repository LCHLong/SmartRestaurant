// tests/blackbox/05_support_staff.spec.js
const { test, expect } = require('@playwright/test');
const { AriaChatHelper } = require('./helpers/chatHelper');

test.describe('Phân Hệ 5: Hỗ Trợ Thực Khách & Nút Gọi Nhân Viên (SPEC-MOD-05)', () => {
  let aria;

  test.beforeEach(async ({ page }) => {
    aria = new AriaChatHelper(page);
    await aria.openMenuAndChat();
  });

  // TC-SUP-01: FAQ: Mạng Wifi & Tiện ích
  test('TC-SUP-01: Cung cấp thông tin tên mạng wifi và mật khẩu chính xác', async () => {
    await aria.sendMessage('Cho xin pass wifi quán mình với.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-sup-01-wifi-faq');

    expect(response.length).toBeGreaterThan(0);
    // Kiểm tra có nhắc tới mật khẩu wifi hoặc tên wifi
    expect(response.toLowerCase()).toMatch(/(wifi|pass|mật khẩu|smartrestaurant|kết nối|guest)/i);
  });

  // TC-SUP-02: FAQ: Bãi đỗ xe máy & Ô tô 7 chỗ
  test('TC-SUP-02: Khách hỏi về chỗ gửi xe, bãi đỗ ô tô 7 chỗ và biểu phí gửi xe', async () => {
    await aria.sendMessage('Quán có chỗ đỗ xe ô tô 7 chỗ không? Phí gửi xe bao nhiêu?');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-sup-02-parking-faq');

    expect(response.length).toBeGreaterThan(0);
    // Kiểm tra thông tin bãi xe, ô tô, miễn phí hoặc phí gửi
    expect(response.toLowerCase()).toMatch(/(đỗ xe|bãi|ô tô|7 chỗ|miễn phí|bảo vệ|gửi xe)/i);
  });

  // TC-SUP-03: FAQ: Hóa đơn đỏ (VAT) & Thanh toán
  test('TC-SUP-03: Khách hỏi về xuất hóa đơn GTGT công ty và các cổng thanh toán', async () => {
    await aria.sendMessage('Quán có xuất hóa đơn đỏ trong ngày không? Có quẹt thẻ tín dụng hay chuyển khoản QR không?');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-sup-03-vat-and-payment');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(hóa đơn|vat|gtgt|thẻ|quẹt|qr|chuyển khoản|thanh toán|mã số thuế)/i);
  });

  // TC-SUP-04: FAQ: Phụ thu mang đồ ngoài & Thú cưng
  test('TC-SUP-04: Chính sách phụ thu rượu, bánh kem sinh nhật và quy định thú cưng', async () => {
    await aria.sendMessage('Tôi mang chai rượu vang và bánh kem sinh nhật từ ngoài vào có tính phí phụ thu không? Có được dắt cún cưng theo không?');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-sup-04-surcharge-and-pets');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(rượu|bánh kem|sinh nhật|phụ thu|phí|thú cưng|cún|ngoài trời|miễn phí)/i);
  });

  // TC-SUP-05: Hỗ trợ đặt món mang về (Takeaway)
  test('TC-SUP-05: Quy trình hỗ trợ đặt món mang về (Takeaway) hẹn giờ lấy', async () => {
    await aria.sendMessage('Tôi muốn đặt 2 suất cơm sườn mang về lúc 12h15 ghé lấy.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-sup-05-takeaway');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(mang về|takeaway|12h15|cơm sườn|2 suất|chuẩn bị|ghé lấy|hộp)/i);
  });

  // TC-SUP-06: Thao tác nút "Gọi nhân viên bàn" 1 chạm
  test('TC-SUP-06: Thực khách nhấn nút [🛎️ Gọi nhân viên bàn]', async ({ page }) => {
    // Gửi lệnh gọi nhân viên qua chat
    await aria.sendMessage('Gọi nhân viên phục vụ tới bàn giúp tôi.');
    const response = await aria.getLastAriaResponse();

    // Theo FR-CHAT-13: Nút gọi nhân viên bàn phải hiển thị trong chat
    const callStaffBtn = page.locator(
      'button:has-text("Gọi nhân viên"), button[data-testid="btn-call-staff"], button[aria-label*="Gọi phục vụ"]'
    ).first();

    await expect(callStaffBtn).toBeVisible({ timeout: 5000 });
    await aria.takeStepScreenshot('tc-sup-06-call-staff-button');

    // Thao tác click vào nút
    await callStaffBtn.click();
    await page.waitForTimeout(1000);

    // Kiểm tra có thông báo tiếp nhận gọi nhân viên hoặc toast xác nhận
    const alertOrMsg = page.locator('text=/đã gửi|tiếp nhận|nhân viên sẽ|đang đến|thông báo tới nhân viên/i');
    await expect(alertOrMsg.first()).toBeVisible({ timeout: 5000 });
  });

  // TC-SUP-07: Chọn lý do gọi nhân viên nhanh qua Quick Tags
  test('TC-SUP-07: Chọn lý do gọi nhân viên nhanh (Xin thêm đá / Chén đĩa / Thanh toán)', async ({ page }) => {
    await aria.sendMessage('Gọi nhân viên phục vụ tới bàn giúp tôi.');
    await page.waitForTimeout(1000);

    // Theo FR-CHAT-14: Phải hiển thị các tùy chọn tag lý do nhanh
    const quickTag = page.locator('button:has-text("đá"), button:has-text("chén"), button:has-text("thanh toán"), [data-testid*="quick-tag"]').first();
    await expect(quickTag).toBeVisible({ timeout: 4000 });
    await aria.takeStepScreenshot('tc-sup-07-call-staff-quick-tag');
  });

  // TC-SUP-08: Chống spam nút gọi nhân viên (Rate Limiting Cooldown 45s)
  test('TC-SUP-08: Nhấn nút gọi nhân viên liên tục kiểm tra cooldown', async ({ page }) => {
    await aria.sendMessage('Gọi nhân viên phục vụ tới bàn giúp tôi.');
    await page.waitForTimeout(1000);

    const callStaffBtn = page.locator(
      'button:has-text("Gọi nhân viên"), [data-testid="btn-call-staff"]'
    ).first();

    await expect(callStaffBtn).toBeVisible({ timeout: 5000 });
    await callStaffBtn.click({ force: true });
    await page.waitForTimeout(200);
    // Bấm liên tiếp lần 2
    await callStaffBtn.click({ force: true });

    await aria.takeStepScreenshot('tc-sup-08-call-staff-cooldown');

    // Theo FR-CHAT-15: Hệ thống phải bật cooldown 45s hoặc cảnh báo vui lòng đợi
    const cooldownNotice = page.locator('text=/vui lòng đợi|cooldown|45s|đang tiếp nhận/i');
    await expect(cooldownNotice.first()).toBeVisible({ timeout: 4000 });
  });

  // TC-SUP-09: Xử lý gián đoạn mạng khi gọi nhân viên
  test('TC-SUP-09: Bắt lỗi hoặc xử lý gián đoạn kết nối khi gọi phục vụ', async ({ page }) => {
    await page.context().setOffline(true);
    try {
      const input = page.locator('textarea[placeholder*="Aria"], input[placeholder*="Aria"]').first();
      await input.fill('Gọi nhân viên bàn!');
      await input.press('Enter');
      await page.waitForTimeout(2000);

      await aria.takeStepScreenshot('tc-sup-09-network-resilience');
      // Khi offline hệ thống phải hiển thị thông báo lỗi mạng
      const errorMsg = page.locator('text=/gián đoạn|mất kết nối|mạng|offline|thử lại/i');
      await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
    } finally {
      await page.context().setOffline(false);
    }
  });

  // TC-SUP-10: Tiếp nhận phàn nàn & Báo động khẩn cấp tới Quản lý
  test('TC-SUP-10: Khách bức xúc vì chờ món quá lâu, kích hoạt báo động khẩn cấp tới Quản lý', async () => {
    await aria.sendMessage('Phục vụ quá tệ, 40 phút rồi chưa có món, tôi cần gặp quản lý ngay lập tức!');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-sup-10-complaint-escalation');

    expect(response.length).toBeGreaterThan(0);
    // Aria xin lỗi chân thành và báo quản lý
    expect(response.toLowerCase()).toMatch(/(xin lỗi|thành thật|quản lý|chậm trễ|khắc phục|ngay lập tức|ưu tiên|thông cảm)/i);
  });
});
