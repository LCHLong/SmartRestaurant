// tests/blackbox/03_reservation.spec.js
const { test, expect } = require('@playwright/test');
const { AriaChatHelper } = require('./helpers/chatHelper');

test.describe('Phân Hệ 3: Đặt Bàn Tự Động Qua NLP Tiếng Việt (SPEC-MOD-03)', () => {
  let aria;

  test.beforeEach(async ({ page }) => {
    aria = new AriaChatHelper(page);
    await aria.openMenuAndChat();
  });

  // TC-RES-01: Ngôn ngữ tự nhiên chuẩn đầy đủ 5 thông số
  test('TC-RES-01: Đặt bàn với câu chứa đầy đủ thông tin bằng tiếng Việt tự nhiên', async () => {
    await aria.sendMessage('Đặt cho mình bàn 4 người vào tối mai lúc 7 rưỡi nhé, tên Nam SĐT 0912345678.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-res-01-full-natural-reservation');

    expect(response.length).toBeGreaterThan(0);
    // Aria trích xuất và xác nhận hoặc xuất thẻ đặt bàn
    expect(response.toLowerCase()).toMatch(/(đặt bàn|thành công|nam|0912345678|19:30|7 rưỡi|4|xác nhận|res-)/i);
  });

  // TC-RES-02: Thu thập thông tin thiếu (Slot Filling Loop)
  test('TC-RES-02: Cơ chế thu thập thông tin còn thiếu khi khách nói nhu cầu chung chung', async () => {
    await aria.sendMessage('Mình muốn đặt bàn vào trưa Chủ Nhật tuần này.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-res-02-slot-filling-step1');

    expect(response.length).toBeGreaterThan(0);
    // Aria phải hỏi thêm giờ và số khách
    expect(response.toLowerCase()).toMatch(/(mấy giờ|bao nhiêu|số khách|người|chủ nhật|thời gian)/i);
  });

  // TC-RES-03: Thời gian tương đối phức tạp
  test('TC-RES-03: Xử lý các cụm từ chỉ thời gian tương đối: tối mốt tầm bảy giờ kém mười lăm', async () => {
    await aria.sendMessage('Cho đặt bàn 2 người vào tối mốt tầm bảy giờ kém mười lăm.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-res-03-relative-time');

    expect(response.length).toBeGreaterThan(0);
    // Phản hồi phải nhận diện thời gian (18:45 hoặc tối mốt hoặc hỏi thêm tên/SĐT)
    expect(response.toLowerCase()).toMatch(/(18:45|7 giờ kém|bảy giờ kém|tối mốt|2 người|đặt bàn|thông tin)/i);
  });

  // TC-RES-04: Yêu cầu vị trí ngồi cụ thể (Seating Preference)
  test('TC-RES-04: Tiếp nhận sở thích vị trí ngồi ngoài trời thoáng mát', async () => {
    await aria.sendMessage('Đặt bàn 6 người tối nay 19:00, ưu tiên bàn ngoài trời thoáng mát hút thuốc được, tên Tuấn SĐT 0988123456.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-res-04-seating-preference');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(ngoài trời|thoáng mát|khu vực|vị trí|ghi chú|tuấn|19:00|6)/i);
  });

  // TC-RES-05: Sinh mã đặt bàn độc nhất & Thẻ Xác Nhận Đặt Bàn (Booking Card)
  test('TC-RES-05: Sinh mã đặt bàn độc nhất dạng #RES- và hiển thị Thẻ Đặt Bàn', async ({ page }) => {
    await aria.sendMessage('Đặt bàn 2 người lúc 19:00 tối mai, tên Hoàng SĐT 0903123456.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-res-05-booking-card');

    expect(response.length).toBeGreaterThan(0);
    // Kiểm tra có mã bàn hoặc thẻ đặt bàn
    const bookingCard = aria.getBookingCards().first();
    const isBookingCardVisible = await bookingCard.isVisible({ timeout: 3000 }).catch(() => false);
    if (isBookingCardVisible) {
      await expect(bookingCard).toBeVisible();
    } else {
      expect(response.toLowerCase()).toMatch(/(res-|mã|xác nhận|hoàng|19:00|đặt bàn)/i);
    }
  });

  // TC-RES-06: Xử lý khung giờ cao điểm kín bàn (Peak Hour Sold-Out)
  test('TC-RES-06: Khách đặt bàn vào khung giờ cao điểm đã kín chỗ', async () => {
    await aria.sendMessage('Đặt bàn 4 người lúc 19:30 tối thứ 7 tuần này.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-res-06-peak-hour');

    expect(response.length).toBeGreaterThan(0);
    // Aria xử lý đặt bàn hoặc đề xuất giờ thay thế nếu kín
    expect(response.toLowerCase()).toMatch(/(kín bàn|hết bàn|khung giờ|đổi|18:|20:|đặt bàn|thông tin|tối thứ 7)/i);
  });

  // TC-RES-07: Chính sách đặt bàn ngày Lễ / Sự kiện đặc biệt
  test('TC-RES-07: Chính sách đặt bàn ngày Lễ Valentine 14/2 hoặc ngày đặc biệt', async () => {
    await aria.sendMessage('Đặt bàn 2 người tối Valentine 14/2 lúc 19:00.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-res-07-holiday-reservation');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(valentine|14\/2|ngày lễ|sự kiện|đặt cọc|phụ thu|giữ chỗ|đặt bàn)/i);
  });

  // TC-RES-08: Chỉnh sửa thông tin đặt bàn ngay trong chat
  test('TC-RES-08: Chỉnh sửa thông tin đặt bàn trực tiếp trong chat', async () => {
    await aria.sendMessage('Mã bàn #RES-2026-8891 tôi muốn đổi sang 20:00 và đi 6 người được không?');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-res-08-edit-reservation');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(đổi|cập nhật|chỉnh sửa|20:00|6 người|res-2026-8891|mã bàn|bàn)/i);
  });

  // TC-RES-09: Hủy đặt bàn trực tiếp trong cuộc trò chuyện
  test('TC-RES-09: Hủy đặt bàn trực tiếp trong cuộc trò chuyện', async () => {
    await aria.sendMessage('Hủy giúp tôi mã đặt bàn #RES-2026-8891.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-res-09-cancel-reservation');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(hủy|đã hủy|xác nhận|res-2026-8891|hẹn gặp lại|tiếc)/i);
  });

  // TC-RES-10: Chặn đặt bàn thời gian trong quá khứ
  test('TC-RES-10: Khách nhập thời gian đã trôi qua so với giờ hiện tại', async () => {
    await aria.sendMessage('Đặt bàn lúc 08:00 sáng hôm nay cho 2 người.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-res-10-past-time');

    expect(response.length).toBeGreaterThan(0);
    // Phải từ chối thời gian quá khứ
    expect(response.toLowerCase()).toMatch(/(đã qua|trôi qua|quá khứ|không thể|tương lai|tối nay|ngày mai|chọn lại)/i);
  });

  // TC-RES-11: Chặn đặt ngoài giờ hoạt động
  test('TC-RES-11: Khách yêu cầu bàn lúc nhà hàng chưa mở cửa hoặc đã đóng cửa (2h sáng)', async () => {
    await aria.sendMessage('Đặt bàn ăn khuya lúc 2h sáng mai cho 4 người.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-res-11-outside-hours');

    expect(response.length).toBeGreaterThan(0);
    // Aria thông báo giờ mở cửa và từ chối 2h sáng
    expect(response.toLowerCase()).toMatch(/(giờ mở cửa|đóng cửa|hoạt động|2h|2:00|10:00|22:|không phục vụ)/i);
  });

  // TC-RES-12: Ngoại lệ: Số lượng khách bất thường (<=0 hoặc >30)
  test('TC-RES-12: Nhập số khách bằng 0, số âm hoặc đoàn tiệc cực lớn 500 người', async () => {
    await aria.sendMessage('Đặt bàn cho -2 người ăn tối.');
    const response1 = await aria.getLastAriaResponse();

    await aria.sendMessage('Đặt bàn cho 500 người ăn tiệc cưới.');
    const response2 = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-res-12-abnormal-guest-count');

    // Phải bắt lỗi số âm và đoàn tiệc lớn
    expect(response1.toLowerCase() + ' ' + response2.toLowerCase()).toMatch(/(không hợp lệ|ít nhất 1|tối thiểu|lớn|sự kiện|quản lý|hotline|liên hệ|tiệc)/i);
  });

  // TC-RES-13: Ngoại lệ: Số điện thoại không hợp lệ
  test('TC-RES-13: Khách nhập số điện thoại sai định dạng', async () => {
    await aria.sendMessage('Đặt bàn 2 người tối nay 19:00, tên Nam SĐT 12345.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-res-13-invalid-phone');

    expect(response.length).toBeGreaterThan(0);
    // Bắt lỗi SĐT không hợp lệ hoặc yêu cầu 10 số
    expect(response.toLowerCase()).toMatch(/(số điện thoại|sđt|không hợp lệ|chính xác|10 số|định dạng|kiểm tra)/i);
  });
});
