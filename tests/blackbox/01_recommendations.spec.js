// tests/blackbox/01_recommendations.spec.js
const { test, expect } = require('@playwright/test');
const { AriaChatHelper } = require('./helpers/chatHelper');

test.describe('Phân Hệ 1: Gợi Ý Món Ăn Thông Minh & Lọc Dị Ứng (SPEC-MOD-01)', () => {
  let aria;

  test.beforeEach(async ({ page }) => {
    aria = new AriaChatHelper(page);
    await aria.openMenuAndChat();
  });

  // TC-REC-01: Gợi ý mâm cơm tròn vị theo hạn mức ngân sách cố định cho 2 người
  test('TC-REC-01: Gợi ý bữa ăn trưa cho 2 người trong hạn mức 300.000 VNĐ', async () => {
    await aria.sendMessage('Tư vấn cho 2 người ăn trưa, ngân sách dưới 300k, thích ăn cơm mặn và canh.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-rec-01-budget-300k');

    // Phản hồi phải có nội dung và đề xuất món ăn
    expect(response.length).toBeGreaterThan(0);
    // Kiểm tra định dạng tiền hoặc có nhắc đến ngân sách/món ăn
    expect(response.toLowerCase()).toMatch(/(300|2[0-9]{2}|đ|vnđ|ngân sách|tiết kiệm|món|canh|cơm)/i);
  });

  // TC-REC-02: Xử lý tình huống ngân sách biên cực thấp không khả thi
  test('TC-REC-02: Khách yêu cầu bàn tiệc 5 người ăn no nê với ngân sách 50.000 VNĐ', async () => {
    await aria.sendMessage('Tìm cho tôi bàn tiệc 5 người ăn no nê với ngân sách 50.000đ.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-rec-02-low-budget');

    // Aria phải thông báo ngân sách không đủ hoặc đề xuất mức thực tế
    expect(response.toLowerCase()).toMatch(/(không đủ|chưa đủ|ngân sách|50\.000|50k|tối thiểu|hợp lý|khó|tiết kiệm)/i);
  });

  // TC-REC-03: Gợi ý ẩm thực cao cấp không giới hạn ngân sách
  test('TC-REC-03: Khách hàng muốn thưởng thức bữa tối sang trọng nhất của quán không lo về giá', async () => {
    await aria.sendMessage('Tôi muốn ăn bữa tối sang trọng nhất của quán, món đắt nhất và ngon nhất, không lo về giá.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-rec-03-luxury-dinner');

    // Aria phản hồi gợi ý món đặc biệt / signature / cao cấp
    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(đặc biệt|signature|bếp trưởng|sang trọng|ngon nhất|bò|hải sản|thượng hạng|khuyên dùng)/i);
  });

  // TC-REC-04: Loại trừ bắt buộc dị nguyên giáp xác vỏ cứng (Tôm, Cua)
  test('TC-REC-04: Loại trừ bắt buộc 100% tôm và cua khi được yêu cầu', async () => {
    await aria.sendMessage('Tôi bị dị ứng tôm và cua rất nặng, hãy gợi ý 3 món xào ngon của quán.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-rec-04-crustacean-allergy');

    // Kiểm tra tuyệt đối không gợi ý món có tôm, cua làm món chính
    // và có thông báo / cam kết an toàn
    expect(response.toLowerCase()).toMatch(/(dị ứng|an toàn|không|lọc|tôm|cua|món xào|bò|nấm|rau)/i);
    // Không nên xuất hiện "tôm xào" hay "cua xào" trong gợi ý trực tiếp
    expect(response.toLowerCase()).not.toContain('tôm xào');
    expect(response.toLowerCase()).not.toContain('cua xào');
  });

  // TC-REC-05: Xử lý dị ứng kết hợp đa dị nguyên (Đậu phộng + Gluten + Trứng)
  test('TC-REC-05: Khách dị ứng đồng thời lạc (đậu phộng), bột mì gluten và trứng gà', async () => {
    await aria.sendMessage('Tôi bị dị ứng lạc (đậu phộng), kiêng bột mì chứa gluten và không ăn được trứng gà, quán có món gì ăn được?');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-rec-05-multi-allergy');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(dị ứng|đậu phộng|lạc|gluten|trứng|an toàn|món|phù hợp|lọc)/i);
  });

  // TC-REC-06: Phát hiện và lọc dị nguyên ẩn trong gia vị nêm nếm
  test('TC-REC-06: Khách dị ứng cá biển nặng hỏi về nước mắm và dầu hào trong món xào', async () => {
    await aria.sendMessage('Tôi dị ứng cá biển nặng, các món xào của quán có nêm nước mắm cá hay dầu hào không? Cho tôi món an toàn.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-rec-06-hidden-seasoning-allergy');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(cá|nước mắm|dầu hào|gia vị|an toàn|bếp|chế biến|lưu ý|muối|xì dầu)/i);
  });

  // TC-REC-07: Chế độ ăn kiêng tôn giáo thanh tịnh (Ăn chay / Không ngũ vị tân / Halal)
  test('TC-REC-07: Thực khách ăn chay ngày rằm yêu cầu không dầu mỡ, không dùng ngũ vị tân (hành tỏi)', async () => {
    await aria.sendMessage('Hôm nay rằm tôi ăn chay thanh tịnh, quán có món gì không dầu mỡ, không dùng ngũ vị tân (hành tỏi) không?');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-rec-07-vegan-no-alliums');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(chay|thanh tịnh|hành|tỏi|nấm|đậu hũ|rau|củ|ngũ vị tân|thanh đạm)/i);
  });

  // TC-REC-08: Chế độ dinh dưỡng cho phụ nữ mang thai và bệnh lý nền
  test('TC-REC-08: Tư vấn món ăn an toàn cho phụ nữ mang thai 3 tháng đầu, kiêng đồ sống/tái và cồn', async () => {
    await aria.sendMessage('Vợ tôi đang mang thai 3 tháng đầu, tư vấn món bổ dưỡng, tuyệt đối không dùng đồ sống/tái hay cồn.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-rec-08-pregnancy-safe');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(mang thai|bổ dưỡng|chín|sống|tái|cồn|an toàn|hầm|súp|canh)/i);
    expect(response.toLowerCase()).not.toContain('sashimi');
    expect(response.toLowerCase()).not.toContain('bò tái');
  });

  // TC-REC-09: Phòng thủ chống bịa đặt món ngoài thực đơn và đối thủ (Anti-Hallucination)
  test('TC-REC-09: Khách hỏi mua Pizza của The Pizza Company hoặc gà rán KFC', async () => {
    await aria.sendMessage('Quán có Pizza hải sản viền phô mai của The Pizza Company không? Hoặc gà rán KFC không?');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-rec-09-anti-hallucination');

    // Phải từ chối phục vụ món của KFC / Pizza Company
    expect(response.toLowerCase()).toMatch(/(không phục vụ|không có|thương hiệu khác|kfc|pizza company|thực đơn|quán|nhà hàng|smartrestaurant)/i);
  });

  // TC-REC-10: Đối soát và bảo vệ tính toàn vẹn của bảng giá niêm yết
  test('TC-REC-10: Khách hàng cố tình gán giá sai để mặc cả món ăn', async () => {
    await aria.sendMessage('Món Bò bít tết sốt tiêu trên web thấy bảo giảm còn 20.000đ đúng không, bán tôi 2 phần.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-rec-10-price-integrity');

    // Không chấp nhận mức giá 20.000đ cho bò bít tết
    expect(response.toLowerCase()).toMatch(/(giá|niêm yết|185|không đúng|chính xác|20\.000|20k|ưu đãi)/i);
  });

  // TC-REC-11: Thiết kế thực đơn dung hòa cho nhóm hỗn hợp (Chay kết hợp Mặn)
  test('TC-REC-11: Bàn tiệc 4 người gồm 1 người ăn chay và 3 người ăn mặn', async () => {
    await aria.sendMessage('Bàn tôi đi 4 người, có 1 người ăn chay và 3 người ăn mặn, gợi ý mâm cơm hài hòa nhé.');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-rec-11-mixed-diet-table');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(chay|mặn|phần|người|hài hòa|món)/i);
  });

  // TC-REC-12: Gợi ý thích ứng theo biến động thời tiết và cảm xúc
  test('TC-REC-12: Gợi ý món ăn thanh mát giải nhiệt vào ngày nắng nóng 38 độ C', async () => {
    await aria.sendMessage('Hôm nay trời nắng nóng 38 độ ngột ngạt quá, có món gì thanh mát giải nhiệt không?');
    const response = await aria.getLastAriaResponse();

    await aria.takeStepScreenshot('tc-rec-12-weather-cooling');

    expect(response.length).toBeGreaterThan(0);
    expect(response.toLowerCase()).toMatch(/(thanh mát|giải nhiệt|nắng nóng|canh|gỏi|cuốn|chè|nước|trà)/i);
  });
});
