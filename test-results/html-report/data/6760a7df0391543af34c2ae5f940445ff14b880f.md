# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05_support_staff.spec.js >> Phân Hệ 5: Hỗ Trợ Thực Khách & Nút Gọi Nhân Viên (SPEC-MOD-05) >> TC-SUP-07: Chọn lý do gọi nhân viên nhanh (Xin thêm đá / Chén đĩa / Thanh toán)
- Location: tests/blackbox/05_support_staff.spec.js:94:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button:has-text("đá"), button:has-text("chén"), button:has-text("thanh toán"), [data-testid*="quick-tag"]').first()
Expected: visible
Timeout: 4000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('button:has-text("đá"), button:has-text("chén"), button:has-text("thanh toán"), [data-testid*="quick-tag"]').first() with timeout 4000ms
  - waiting for locator('button:has-text("đá"), button:has-text("chén"), button:has-text("thanh toán"), [data-testid*="quick-tag"]').first()

```

```yaml
- text: Smart Restaurant
- navigation:
  - link "restaurant_menu Menu":
    - /url: /menu
  - link "event_seat Book a Table":
    - /url: /reservations
  - link "search Lookup Reservation":
    - /url: /reservations/lookup
- button "language Tiếng Việt"
- link "login Login":
  - /url: /login
- main:
  - heading "Menu" [level=1]
  - paragraph: Discover delicious food
  - button "event_seat Book a Table"
  - button "shopping_cart Shopping Cart"
  - text: info
  - heading "Welcome to Our Restaurant" [level=3]
  - paragraph: Please scan the QR code on your table to view our menu and start ordering.
  - textbox "Search for your favorite food..."
  - text: search
  - button "auto_awesome All"
  - button "Khai vị (Starters)"
  - button "Món chính (Main Dish)"
  - button "Món chay & Healthy (Vegetarian)"
  - button "Đồ uống (Drinks)"
  - button "Tráng miệng (Desserts)"
  - button "Đặc biệt (Special)"
  - text: "sort Sort by:"
  - combobox:
    - option "Name (A-Z)" [selected]
    - option "Newest"
    - option "Most Popular"
    - 'option "Price: Low to High"'
    - 'option "Price: High to Low"'
  - button "restaurant_menu Chef's Choice"
  - img "Bạc Xỉu Ba Tầng Sài Gòn Xưa - Image 1"
  - heading "Bạc Xỉu Ba Tầng Sài Gòn Xưa" [level=3]
  - paragraph: Tầng sữa đặc ngọt ngào ở đáy, lớp sữa tươi béo mịn ở giữa và phủ lớp cà phê phin đánh bọt nâu bồng bềnh bên trên.
  - text: 38.000 ₫
  - img "Bánh Flan - Image 1"
  - button "Go to image 1"
  - button "Go to image 2"
  - heading "Bánh Flan" [level=3]
  - paragraph: Bánh flan mềm mịn, thơm mùi trứng và caramel.
  - text: 25.000 ₫
  - img "Bánh Flan Caramel Hạt Cafe Truyền Thống - Image 1"
  - heading "Bánh Flan Caramel Hạt Cafe Truyền Thống" [level=3]
  - paragraph: Bánh flan mềm mượt không rỗ mặt làm từ trứng gà ta tươi và sữa đặc, chan sốt caramel đường thốt nốt và chút cốt cà phê đắng nhẹ.
  - text: 32.000 ₫
  - img "Bánh Mì Thập Cẩm Xá Xíu Ba Tê Trứ Danh - Image 1"
  - heading "Bánh Mì Thập Cẩm Xá Xíu Ba Tê Trứ Danh" [level=3]
  - paragraph: Vỏ bánh mì nướng giòn rụm bên ngoài ruột xốp, phết pate gan heo béo ngậy, thịt xá xíu mềm thơm, chả lụa và đồ chua.
  - text: 35.000 ₫
  - img "Bánh Mousse Chanh Dây Phủ Gương Vàng - Image 1"
  - heading "Bánh Mousse Chanh Dây Phủ Gương Vàng" [level=3]
  - paragraph: Đế bánh bông lan xốp nhẹ, lớp kem mousse phô mai mịn mượt phủ thạch chanh leo tráng gương chua dịu lấp lánh.
  - text: 48.000 ₫
  - img "Bò Lúc Lắc Khoai Tây Chiên Pháp - Image 1"
  - text: restaurant_menu Chef's Choice
  - heading "Bò Lúc Lắc Khoai Tây Chiên Pháp" [level=3]
  - paragraph: Thịt bò thăn mềm xắt quân cờ xào lửa lớn sốt tiêu đen bơ tỏi, ớt chuông ba màu và khoai tây chiên giòn.
  - text: 119.000 ₫
  - img "Bò Sốt Tiêu Đen Bánh Mì Nóng Giòn - Image 1"
  - heading "Bò Sốt Tiêu Đen Bánh Mì Nóng Giòn" [level=3]
  - paragraph: Bắp bò hầm mềm mọng trong nước sốt tiêu đen sánh đậm, thơm bơ tỏi, dùng kèm bánh mì đặc ruột nướng nóng giòn.
  - text: 89.000 ₫
  - img "Bún Bò Huế - Image 1"
  - button "Go to image 1"
  - button "Go to image 2"
  - button "Go to image 3"
  - heading "Bún Bò Huế" [level=3]
  - paragraph: Bún bò cay nồng đặc trưng Huế với bắp bò, giò heo.
  - text: 70.000 ₫
  - img "Bún Bò Huế Cố Đô Cay Nồng - Image 1"
  - heading "Bún Bò Huế Cố Đô Cay Nồng" [level=3]
  - paragraph: Bún sợi tròn to đặc trưng, bắp bò hoa giòn, giò heo mềm rục, chả cua Huế và nước dùng mắm ruốc sả ớt đỏ au.
  - text: 75.000 ₫
  - img "Bún Chả Hà Nội - Image 1"
  - button "Go to image 1"
  - button "Go to image 2"
  - heading "Bún Chả Hà Nội" [level=3]
  - paragraph: Thịt nướng và chả viên nướng than hồng.
  - text: 65.000 ₫
  - img "Bún Chả Hà Nội Nướng Than Hoa - Image 1"
  - text: restaurant_menu Chef's Choice
  - heading "Bún Chả Hà Nội Nướng Than Hoa" [level=3]
  - paragraph: Thịt ba chỉ thái mỏng ướp mắm tiêu và chả băm viên nướng trên vỉ than hồng, ăn cùng nước chấm ấm và bún tươi.
  - text: 69.000 ₫
  - img "Bún Nấm Thanh Đạm Rong Biển - Image 1"
  - heading "Bún Nấm Thanh Đạm Rong Biển" [level=3]
  - paragraph: Bún tươi chan nước dùng hầm củ quả lê táo ngọt thanh, các loại nấm rơm, nấm bào ngư, nấm kim châm và rong biển Wakame.
  - text: 55.000 ₫
  - img "Bún Riêu Cua Đồng Ốc Lụa Giòn Sần Sật - Image 1"
  - heading "Bún Riêu Cua Đồng Ốc Lụa Giòn Sần Sật" [level=3]
  - paragraph: Cua đồng giã tay đóng tảng riêu béo ngậy, ốc bươu giòn sần sật, đậu hũ chiên phồng ngấm nước lèo chua thanh cà chua và giấm bỗng.
  - text: 65.000 ₫
  - img "Cá Hồi Áp Chảo Sốt Bơ Chanh Măng Tây - Image 1"
  - text: restaurant_menu Chef's Choice
  - heading "Cá Hồi Áp Chảo Sốt Bơ Chanh Măng Tây" [level=3]
  - paragraph: Phi-lê cá hồi Na Uy tươi áp chảo vàng da giòn rụm thịt mềm hồng, phủ sốt bơ chanh vàng Dill thơm dịu và măng tây xào bơ.
  - text: 165.000 ₫
  - img "Cà Phê Đen Đá Buôn Ma Thuột - Image 1"
  - heading "Cà Phê Đen Đá Buôn Ma Thuột" [level=3]
  - paragraph: 100% cà phê Robusta hảo hạng pha phin truyền thống, thơm đượm nồng nàn không pha tạp, vị đắng mộc mạc nguyên bản.
  - text: 29.000 ₫
  - img "Cà Phê Muối Cố Đô Béo Mặn - Image 1"
  - text: restaurant_menu Chef's Choice
  - heading "Cà Phê Muối Cố Đô Béo Mặn" [level=3]
  - paragraph: Cốt cà phê phin đậm đặc kết hợp lớp kem sữa muối mặn mặn béo ngậy phía trên, khuấy đều tạo hương vị gây nghiện.
  - text: 42.000 ₫
  - img "Cà phê Sữa Đá - Image 1"
  - heading "Cà phê Sữa Đá" [level=3]
  - paragraph: Cà phê pha phin truyền thống hòa quyện cùng sữa đặc.
  - text: 35.000 ₫
  - img "Cà Phê Sữa Đá Sài Gòn Truyền Thống - Image 1"
  - text: restaurant_menu Chef's Choice
  - heading "Cà Phê Sữa Đá Sài Gòn Truyền Thống" [level=3]
  - paragraph: Cà phê Robusta Buôn Ma Thuột rang mộc pha phin truyền thống nhỏ giọt, hòa quyện sữa đặc thơm ngọt và đá viên tinh khiết.
  - text: 35.000 ₫
  - img "Canh Hạt Sen Củ Sen Táo Đỏ Bổ Dưỡng - Image 1"
  - text: restaurant_menu Chef's Choice
  - heading "Canh Hạt Sen Củ Sen Táo Đỏ Bổ Dưỡng" [level=3]
  - paragraph: Hạt sen tươi hầm mềm bùi cùng củ sen giòn nhẹ, táo đỏ Tân Cương ngọt thơm và nấm tuyết trong vắt thanh tao.
  - text: 49.000 ₫
  - img "Chả giò Hải sản - Image 1"
  - button "Go to image 1"
  - button "Go to image 2"
  - heading "Chả giò Hải sản" [level=3]
  - paragraph: Chả giò chiên giòn với nhân hải sản, nấm mèo và cà rốt.
  - text: 65.000 ₫
- text: smart_toy
- paragraph: Aria
- paragraph: Trợ lý tư vấn ẩm thực & đặt bàn
- button "Phóng to khung chat": open_in_full
- button "Đóng chat": close
- text: A
- paragraph:
  - text: Xin chào! Em là
  - strong: Aria
  - text: — trợ lý tư vấn món ăn của nhà hàng 🍽️ Bạn muốn tìm món gì hôm nay, hoặc có khẩu vị/yêu cầu dị ứng nào không ạ?
- paragraph: Gọi nhân viên phục vụ tới bàn giúp tôi.
- text: A
- paragraph: Dạ, yêu cầu của bạn có vẻ cần sự hỗ trợ trực tiếp từ nhân viên của chúng tôi ạ. Bạn có thể nhấn nút bên dưới để gọi nhân viên đến bàn nhé! 🔔
- button "notifications Gọi nhân viên bàn"
- text: Gợi ý này có hữu ích?
- button "Thích gợi ý này": thumb_up
- button "Đổi món khác": thumb_down Đổi món
- textbox "Nhập câu hỏi cho Aria..."
- button "Gửi tin nhắn" [disabled]: send
- paragraph: Aria • AI Consultant
- button "Đóng Aria chat": close
```

# Test source

```ts
  1   | // tests/blackbox/05_support_staff.spec.js
  2   | const { test, expect } = require('@playwright/test');
  3   | const { AriaChatHelper } = require('./helpers/chatHelper');
  4   | 
  5   | test.describe('Phân Hệ 5: Hỗ Trợ Thực Khách & Nút Gọi Nhân Viên (SPEC-MOD-05)', () => {
  6   |   let aria;
  7   | 
  8   |   test.beforeEach(async ({ page }) => {
  9   |     aria = new AriaChatHelper(page);
  10  |     await aria.openMenuAndChat();
  11  |   });
  12  | 
  13  |   // TC-SUP-01: FAQ: Mạng Wifi & Tiện ích
  14  |   test('TC-SUP-01: Cung cấp thông tin tên mạng wifi và mật khẩu chính xác', async () => {
  15  |     await aria.sendMessage('Cho xin pass wifi quán mình với.');
  16  |     const response = await aria.getLastAriaResponse();
  17  | 
  18  |     await aria.takeStepScreenshot('tc-sup-01-wifi-faq');
  19  | 
  20  |     expect(response.length).toBeGreaterThan(0);
  21  |     // Kiểm tra có nhắc tới mật khẩu wifi hoặc tên wifi
  22  |     expect(response.toLowerCase()).toMatch(/(wifi|pass|mật khẩu|smartrestaurant|kết nối|guest)/i);
  23  |   });
  24  | 
  25  |   // TC-SUP-02: FAQ: Bãi đỗ xe máy & Ô tô 7 chỗ
  26  |   test('TC-SUP-02: Khách hỏi về chỗ gửi xe, bãi đỗ ô tô 7 chỗ và biểu phí gửi xe', async () => {
  27  |     await aria.sendMessage('Quán có chỗ đỗ xe ô tô 7 chỗ không? Phí gửi xe bao nhiêu?');
  28  |     const response = await aria.getLastAriaResponse();
  29  | 
  30  |     await aria.takeStepScreenshot('tc-sup-02-parking-faq');
  31  | 
  32  |     expect(response.length).toBeGreaterThan(0);
  33  |     // Kiểm tra thông tin bãi xe, ô tô, miễn phí hoặc phí gửi
  34  |     expect(response.toLowerCase()).toMatch(/(đỗ xe|bãi|ô tô|7 chỗ|miễn phí|bảo vệ|gửi xe)/i);
  35  |   });
  36  | 
  37  |   // TC-SUP-03: FAQ: Hóa đơn đỏ (VAT) & Thanh toán
  38  |   test('TC-SUP-03: Khách hỏi về xuất hóa đơn GTGT công ty và các cổng thanh toán', async () => {
  39  |     await aria.sendMessage('Quán có xuất hóa đơn đỏ trong ngày không? Có quẹt thẻ tín dụng hay chuyển khoản QR không?');
  40  |     const response = await aria.getLastAriaResponse();
  41  | 
  42  |     await aria.takeStepScreenshot('tc-sup-03-vat-and-payment');
  43  | 
  44  |     expect(response.length).toBeGreaterThan(0);
  45  |     expect(response.toLowerCase()).toMatch(/(hóa đơn|vat|gtgt|thẻ|quẹt|qr|chuyển khoản|thanh toán|mã số thuế)/i);
  46  |   });
  47  | 
  48  |   // TC-SUP-04: FAQ: Phụ thu mang đồ ngoài & Thú cưng
  49  |   test('TC-SUP-04: Chính sách phụ thu rượu, bánh kem sinh nhật và quy định thú cưng', async () => {
  50  |     await aria.sendMessage('Tôi mang chai rượu vang và bánh kem sinh nhật từ ngoài vào có tính phí phụ thu không? Có được dắt cún cưng theo không?');
  51  |     const response = await aria.getLastAriaResponse();
  52  | 
  53  |     await aria.takeStepScreenshot('tc-sup-04-surcharge-and-pets');
  54  | 
  55  |     expect(response.length).toBeGreaterThan(0);
  56  |     expect(response.toLowerCase()).toMatch(/(rượu|bánh kem|sinh nhật|phụ thu|phí|thú cưng|cún|ngoài trời|miễn phí)/i);
  57  |   });
  58  | 
  59  |   // TC-SUP-05: Hỗ trợ đặt món mang về (Takeaway)
  60  |   test('TC-SUP-05: Quy trình hỗ trợ đặt món mang về (Takeaway) hẹn giờ lấy', async () => {
  61  |     await aria.sendMessage('Tôi muốn đặt 2 suất cơm sườn mang về lúc 12h15 ghé lấy.');
  62  |     const response = await aria.getLastAriaResponse();
  63  | 
  64  |     await aria.takeStepScreenshot('tc-sup-05-takeaway');
  65  | 
  66  |     expect(response.length).toBeGreaterThan(0);
  67  |     expect(response.toLowerCase()).toMatch(/(mang về|takeaway|12h15|cơm sườn|2 suất|chuẩn bị|ghé lấy|hộp)/i);
  68  |   });
  69  | 
  70  |   // TC-SUP-06: Thao tác nút "Gọi nhân viên bàn" 1 chạm
  71  |   test('TC-SUP-06: Thực khách nhấn nút [🛎️ Gọi nhân viên bàn]', async ({ page }) => {
  72  |     // Gửi lệnh gọi nhân viên qua chat
  73  |     await aria.sendMessage('Gọi nhân viên phục vụ tới bàn giúp tôi.');
  74  |     const response = await aria.getLastAriaResponse();
  75  | 
  76  |     // Theo FR-CHAT-13: Nút gọi nhân viên bàn phải hiển thị trong chat
  77  |     const callStaffBtn = page.locator(
  78  |       'button:has-text("Gọi nhân viên"), button[data-testid="btn-call-staff"], button[aria-label*="Gọi phục vụ"]'
  79  |     ).first();
  80  | 
  81  |     await expect(callStaffBtn).toBeVisible({ timeout: 5000 });
  82  |     await aria.takeStepScreenshot('tc-sup-06-call-staff-button');
  83  | 
  84  |     // Thao tác click vào nút
  85  |     await callStaffBtn.click();
  86  |     await page.waitForTimeout(1000);
  87  | 
  88  |     // Kiểm tra có thông báo tiếp nhận gọi nhân viên hoặc toast xác nhận
  89  |     const alertOrMsg = page.locator('text=/đã gửi|tiếp nhận|nhân viên sẽ|đang đến|thông báo tới nhân viên/i');
  90  |     await expect(alertOrMsg.first()).toBeVisible({ timeout: 5000 });
  91  |   });
  92  | 
  93  |   // TC-SUP-07: Chọn lý do gọi nhân viên nhanh qua Quick Tags
  94  |   test('TC-SUP-07: Chọn lý do gọi nhân viên nhanh (Xin thêm đá / Chén đĩa / Thanh toán)', async ({ page }) => {
  95  |     await aria.sendMessage('Gọi nhân viên phục vụ tới bàn giúp tôi.');
  96  |     await page.waitForTimeout(1000);
  97  | 
  98  |     // Theo FR-CHAT-14: Phải hiển thị các tùy chọn tag lý do nhanh
  99  |     const quickTag = page.locator('button:has-text("đá"), button:has-text("chén"), button:has-text("thanh toán"), [data-testid*="quick-tag"]').first();
> 100 |     await expect(quickTag).toBeVisible({ timeout: 4000 });
      |                            ^ Error: expect(locator).toBeVisible() failed
  101 |     await aria.takeStepScreenshot('tc-sup-07-call-staff-quick-tag');
  102 |   });
  103 | 
  104 |   // TC-SUP-08: Chống spam nút gọi nhân viên (Rate Limiting Cooldown 45s)
  105 |   test('TC-SUP-08: Nhấn nút gọi nhân viên liên tục kiểm tra cooldown', async ({ page }) => {
  106 |     await aria.sendMessage('Gọi nhân viên phục vụ tới bàn giúp tôi.');
  107 |     await page.waitForTimeout(1000);
  108 | 
  109 |     const callStaffBtn = page.locator(
  110 |       'button:has-text("Gọi nhân viên"), [data-testid="btn-call-staff"]'
  111 |     ).first();
  112 | 
  113 |     await expect(callStaffBtn).toBeVisible({ timeout: 5000 });
  114 |     await callStaffBtn.click({ force: true });
  115 |     await page.waitForTimeout(200);
  116 |     // Bấm liên tiếp lần 2
  117 |     await callStaffBtn.click({ force: true });
  118 | 
  119 |     await aria.takeStepScreenshot('tc-sup-08-call-staff-cooldown');
  120 | 
  121 |     // Theo FR-CHAT-15: Hệ thống phải bật cooldown 45s hoặc cảnh báo vui lòng đợi
  122 |     const cooldownNotice = page.locator('text=/vui lòng đợi|cooldown|45s|đang tiếp nhận/i');
  123 |     await expect(cooldownNotice.first()).toBeVisible({ timeout: 4000 });
  124 |   });
  125 | 
  126 |   // TC-SUP-09: Xử lý gián đoạn mạng khi gọi nhân viên
  127 |   test('TC-SUP-09: Bắt lỗi hoặc xử lý gián đoạn kết nối khi gọi phục vụ', async ({ page }) => {
  128 |     await page.context().setOffline(true);
  129 |     try {
  130 |       const input = page.locator('textarea[placeholder*="Aria"], input[placeholder*="Aria"]').first();
  131 |       await input.fill('Gọi nhân viên bàn!');
  132 |       await input.press('Enter');
  133 |       await page.waitForTimeout(2000);
  134 | 
  135 |       await aria.takeStepScreenshot('tc-sup-09-network-resilience');
  136 |       // Khi offline hệ thống phải hiển thị thông báo lỗi mạng
  137 |       const errorMsg = page.locator('text=/gián đoạn|mất kết nối|mạng|offline|thử lại/i');
  138 |       await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  139 |     } finally {
  140 |       await page.context().setOffline(false);
  141 |     }
  142 |   });
  143 | 
  144 |   // TC-SUP-10: Tiếp nhận phàn nàn & Báo động khẩn cấp tới Quản lý
  145 |   test('TC-SUP-10: Khách bức xúc vì chờ món quá lâu, kích hoạt báo động khẩn cấp tới Quản lý', async () => {
  146 |     await aria.sendMessage('Phục vụ quá tệ, 40 phút rồi chưa có món, tôi cần gặp quản lý ngay lập tức!');
  147 |     const response = await aria.getLastAriaResponse();
  148 | 
  149 |     await aria.takeStepScreenshot('tc-sup-10-complaint-escalation');
  150 | 
  151 |     expect(response.length).toBeGreaterThan(0);
  152 |     // Aria xin lỗi chân thành và báo quản lý
  153 |     expect(response.toLowerCase()).toMatch(/(xin lỗi|thành thật|quản lý|chậm trễ|khắc phục|ngay lập tức|ưu tiên|thông cảm)/i);
  154 |   });
  155 | });
  156 | 
```