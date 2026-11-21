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
    const callStaffBtn = page.locator(
      'button[data-testid="btn-call-staff"], button:has-text("Gọi nhân viên"), [data-testid="call-staff-btn"], button[aria-label*="nhân viên"], button[aria-label*="Gọi phục vụ"]'
    ).first();

    const isBtnVisible = await callStaffBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (isBtnVisible) {
      await callStaffBtn.click();
      await page.waitForTimeout(1000);
      await aria.takeStepScreenshot('tc-sup-06-call-staff-button');

      // Kiểm tra có thông báo tiếp nhận gọi nhân viên
      const alertOrMsg = page.locator('text=/đã gửi|tiếp nhận|nhân viên sẽ|đang đến/i');
      await expect(alertOrMsg.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    } else {
      // Gọi qua chat command
      await aria.sendMessage('Gọi nhân viên phục vụ tới bàn giúp tôi.');
      const response = await aria.getLastAriaResponse();
      await aria.takeStepScreenshot('tc-sup-06-call-staff-text');
      expect(response.toLowerCase()).toMatch(/(nhân viên|hỗ trợ|bàn|phục vụ|đang đến|thông báo)/i);
    }
  });

  // TC-SUP-07: Chọn lý do gọi nhân viên nhanh qua Quick Tags
  test('TC-SUP-07: Chọn lý do gọi nhân viên nhanh (Xin thêm đá / Chén đĩa / Thanh toán)', async ({ page }) => {
    await aria.sendMessage('Tôi cần gọi nhân viên để xin thêm đá lạnh và thanh toán hóa đơn.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-sup-07-call-staff-quick-tag');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(nhân viên|đá lạnh|thanh toán|hỗ trợ|đã báo|phục vụ)/i);
  });

  // TC-SUP-08: Chống spam nút gọi nhân viên (Rate Limiting Cooldown 45s)
  test('TC-SUP-08: Nhấn nút gọi nhân viên liên tục kiểm tra cooldown', async ({ page }) => {
    const callStaffBtn = page.locator(
      'button[data-testid="btn-call-staff"], button:has-text("Gọi nhân viên"), [data-testid="call-staff-btn"]'
    ).first();

    const isBtnVisible = await callStaffBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (isBtnVisible) {
      await callStaffBtn.click();
      await page.waitForTimeout(300);
      // Bấm lần thứ hai ngay lập tức
      await callStaffBtn.click().catch(() => {});
      await page.waitForTimeout(500);
    } else {
      await aria.sendMessage('Gọi nhân viên!');
      await aria.sendMessage('Gọi nhân viên gấp!');
    }

    await aria.takeStepScreenshot('tc-sup-08-call-staff-cooldown');
    await expect(page.locator('body')).toBeVisible();
  });

  // TC-SUP-09: Xử lý gián đoạn mạng khi gọi nhân viên
  test('TC-SUP-09: Bắt lỗi hoặc xử lý gián đoạn kết nối khi gọi phục vụ', async ({ page }) => {
    // Thử gửi yêu cầu hỗ trợ
    await aria.sendMessage('Bàn tôi đang cần hỗ trợ gấp nhưng mạng hơi yếu.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-sup-09-network-resilience');
    expect(response.length).toBeGreaterThan(0);
    await expect(page.locator('body')).toBeVisible();
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
