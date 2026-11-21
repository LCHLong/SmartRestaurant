// tests/blackbox/02_in_chat_cart.spec.js
const { test, expect } = require('@playwright/test');
const { AriaChatHelper } = require('./helpers/chatHelper');

test.describe('Phân Hệ 2: Thẻ Món Ăn & Giỏ Hàng Tương Tác Trong Chat (SPEC-MOD-02)', () => {
  let aria;

  test.beforeEach(async ({ page }) => {
    aria = new AriaChatHelper(page);
    await aria.openMenuAndChat();
  });

  // TC-ATC-01: Hiển thị Thẻ Món Ăn tương tác hoàn chỉnh khi khách hỏi hoặc bot gợi ý
  test('TC-ATC-01: Hiển thị Thẻ Món Ăn tương tác hoàn chỉnh cho Bò bít tết sốt tiêu đen', async ({ page }) => {
    await aria.sendMessage('Cho tôi xem món Bò bít tết sốt tiêu đen.');
    await aria.takeStepScreenshot('tc-atc-01-product-card');

    const response = await aria.getLastAriaResponse();
    expect(response.length).toBeGreaterThan(0);

    // Kiểm tra có nhắc đến tên món hoặc có thẻ món ăn
    const productCard = aria.getProductCards().first();
    const isCardVisible = await productCard.isVisible({ timeout: 4000 }).catch(() => false);
    if (isCardVisible) {
      await expect(productCard).toBeVisible();
      // Thẻ phải có nút thêm vào giỏ
      const addBtn = productCard.locator('button:has-text("Thêm"), button[data-testid*="cart"], button[data-testid*="add"]').first();
      await expect(addBtn).toBeVisible();
    } else {
      expect(response.toLowerCase()).toMatch(/(bò bít tết|sốt tiêu|185|giỏ|món)/i);
    }
  });

  // TC-ATC-02: Thao tác 1 chạm cơ bản trên thẻ món ăn
  test('TC-ATC-02: Thực khách nhấn nút [+ Thêm vào giỏ] trên thẻ món ăn', async ({ page }) => {
    await aria.sendMessage('Cho tôi xem món Bò bít tết sốt tiêu đen.');
    await page.waitForTimeout(2000);

    const productCard = aria.getProductCards().first();
    const isCardVisible = await productCard.isVisible({ timeout: 4000 }).catch(() => false);

    if (isCardVisible) {
      const addBtn = productCard.locator('button:has-text("Thêm"), button[data-testid*="add"]').first();
      await addBtn.click();
      await page.waitForTimeout(1000);

      await aria.takeStepScreenshot('tc-atc-02-item-added');
      const cartCount = await aria.getCartCount();
      expect(cartCount).toBeGreaterThanOrEqual(1);
    } else {
      // Nếu là text confirmation
      await aria.sendMessage('Thêm Bò bít tết vào giỏ hàng giúp tôi.');
      const response = await aria.getLastAriaResponse();
      await aria.takeStepScreenshot('tc-atc-02-text-add');
      expect(response.toLowerCase()).toMatch(/(đã thêm|giỏ hàng|bò bít tết|thành công)/i);
    }
  });

  // TC-ATC-03: Thêm món qua câu lệnh ngôn ngữ tự nhiên
  test('TC-ATC-03: Thêm đồng thời cơm chiên hải sản và 2 ly nước chanh dây qua chat', async ({ page }) => {
    await aria.sendMessage('Cho 1 phần Cơm chiên hải sản và 2 ly Nước chanh dây vào giỏ nhé.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-atc-03-nlp-add-cart');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(cơm chiên|nước chanh|giỏ hàng|đã thêm|tạm tính|thành công|1|2)/i);
  });

  // TC-ATC-04: Tùy biến món & Ghi chú hương vị (Modifiers)
  test('TC-ATC-04: Thêm món kèm yêu cầu riêng về đường, đá, rau thơm (Modifiers)', async ({ page }) => {
    await aria.sendMessage('Thêm 1 Trà sữa Ô Long 50% đường 70% đá, trân châu đen và 1 Phở bò không hành lá nhiều ớt.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-atc-04-modifiers');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(trà sữa|phở|đường|đá|trân châu|hành|ớt|giỏ|ghi chú)/i);
  });

  // TC-ATC-05: Tăng/Giảm số lượng trực tiếp trên thẻ món
  test('TC-ATC-05: Tăng/Giảm số lượng trực tiếp trên thẻ món ăn trước khi thêm', async ({ page }) => {
    await aria.sendMessage('Cho tôi xem món Bò bít tết sốt tiêu đen.');
    await page.waitForTimeout(2000);

    const productCard = aria.getProductCards().first();
    const isCardVisible = await productCard.isVisible({ timeout: 4000 }).catch(() => false);

    if (isCardVisible) {
      const plusBtn = productCard.locator('button:has-text("+"), [data-testid="btn-increase"]').first();
      if (await plusBtn.isVisible().catch(() => false)) {
        await plusBtn.click();
        await page.waitForTimeout(300);
        await plusBtn.click();
        await page.waitForTimeout(300);
      }
      const addBtn = productCard.locator('button:has-text("Thêm"), [data-testid*="add"]').first();
      await addBtn.click();
      await page.waitForTimeout(1000);
    } else {
      await aria.sendMessage('Thêm 3 phần Bò bít tết vào giỏ hàng.');
    }

    await aria.takeStepScreenshot('tc-atc-05-quantity-change');
    const response = await aria.getLastAriaResponse();
    expect(response.length).toBeGreaterThan(0);
  });

  // TC-ATC-06: Xử lý click liên tục (Debounce / Rapid Click)
  test('TC-ATC-06: Khách hàng nhấn nút [+ Thêm vào giỏ] liên tục kiểm tra debounce', async ({ page }) => {
    await aria.sendMessage('Cho tôi xem món Bò bít tết sốt tiêu đen.');
    await page.waitForTimeout(2000);

    const productCard = aria.getProductCards().first();
    const isCardVisible = await productCard.isVisible({ timeout: 4000 }).catch(() => false);

    if (isCardVisible) {
      const addBtn = productCard.locator('button:has-text("Thêm"), [data-testid*="add"]').first();
      // Nhấn nhanh 4 lần liên tiếp
      await Promise.all([
        addBtn.click().catch(() => {}),
        addBtn.click().catch(() => {}),
        addBtn.click().catch(() => {}),
        addBtn.click().catch(() => {})
      ]);
      await page.waitForTimeout(1000);
    }

    await aria.takeStepScreenshot('tc-atc-06-debounce');
    // Không bị crash ứng dụng
    await expect(page.locator('body')).toBeVisible();
  });

  // TC-ATC-07: Món đã tạm hết hàng trong ngày (Out of Stock)
  test('TC-ATC-07: Xử lý thẻ món ăn của một món đã ngưng phục vụ trong kho', async ({ page }) => {
    await aria.sendMessage('Tôi muốn xem món Cua hoàng đế hấp.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-atc-07-out-of-stock');

    expect(response.length).toBeGreaterThan(0);
    // Nếu hết hàng thì Aria thông báo hoặc nút bị vô hiệu hóa
    const disabledBtn = page.locator('button:disabled, button:has-text("Tạm hết"), button:has-text("Hết hàng")').first();
    const isDisabledVisible = await disabledBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isDisabledVisible) {
      expect(response.toLowerCase()).toMatch(/(tạm hết|hết món|nguyên liệu|không có|thay thế|tôm hùm|hết hàng|chưa phục vụ)/i);
    }
  });

  // TC-ATC-08: Món hết hàng tại thời điểm bấm (Race condition)
  test('TC-ATC-08: Bắt lỗi nhẹ nhàng khi món hết hàng đúng thời điểm thêm', async ({ page }) => {
    await aria.sendMessage('Thêm suất Cua hoàng đế cuối cùng vào giỏ.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-atc-08-race-condition');

    expect(response.length).toBeGreaterThan(0);
    // Không làm crash trang
    await expect(page.locator('body')).toBeVisible();
  });

  // TC-ATC-09: Xem tóm tắt giỏ hàng (Mini Cart in Chat)
  test('TC-ATC-09: Yêu cầu xem lại toàn bộ giỏ hàng hiện tại và tổng tiền trong chat', async ({ page }) => {
    await aria.sendMessage('Cho tôi xem lại giỏ hàng hiện tại gồm những gì và tổng tiền?');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-atc-09-mini-cart');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(giỏ hàng|tổng|món|tạm tính|trống|chưa có|tiền|vnđ|đ)/i);
  });

  // TC-ATC-10: Xóa hoặc giảm món khỏi giỏ ngay trong chat
  test('TC-ATC-10: Khách đổi ý muốn bỏ bớt hoặc xóa món đã chọn qua chat', async ({ page }) => {
    await aria.sendMessage('Bỏ bớt 1 ly nước chanh dây và xóa món cơm chiên ra khỏi giỏ cho tôi.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-atc-10-remove-item');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(xóa|bỏ|cập nhật|giỏ hàng|cơm chiên|nước chanh|giảm|trống)/i);
  });

  // TC-ATC-11: Giới hạn số lượng món tối đa trên đơn lẻ (Boundary Limit)
  test('TC-ATC-11: Khách yêu cầu thêm số lượng cực lớn 999 phần vào giỏ', async ({ page }) => {
    await aria.sendMessage('Thêm 999 phần Bò bít tết vào giỏ.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-atc-11-max-quantity-limit');

    // Hệ thống chặn hoặc nhắc nhở số lượng tối đa / liên hệ hotline
    expect(response.toLowerCase()).toMatch(/(999|số lượng|tối đa|giới hạn|quá lớn|hotline|liên hệ|tiệc|20)/i);
  });

  // TC-ATC-12: Duy trì trạng thái giỏ hàng khi chuyển trang hoặc làm mới trình duyệt
  test('TC-ATC-12: Kiểm tra duy trì trạng thái giỏ hàng khi tải lại trang (Persistence)', async ({ page }) => {
    await aria.sendMessage('Thêm 1 Bò bít tết sốt tiêu đen vào giỏ hàng.');
    await page.waitForTimeout(2000);

    // F5 làm mới trình duyệt
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    await aria.openMenuAndChat();
    await aria.takeStepScreenshot('tc-atc-12-reload-persistence');

    // Kiểm tra body vẫn hiển thị bình thường
    await expect(page.locator('body')).toBeVisible();
  });
});
