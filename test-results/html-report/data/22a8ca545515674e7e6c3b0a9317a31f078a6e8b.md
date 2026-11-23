# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02_in_chat_cart.spec.js >> Phân Hệ 2: Thẻ Món Ăn & Giỏ Hàng Tương Tác Trong Chat (SPEC-MOD-02) >> TC-ATC-05: Tăng/Giảm số lượng trực tiếp trên thẻ món ăn trước khi thêm
- Location: tests/blackbox/02_in_chat_cart.spec.js:81:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('div[class*="fixed bottom-24 right-4"]').first().locator('div[class*="border-orange-100"]').first().locator('button:has-text("+"), [data-testid="btn-increase"]').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('div[class*="fixed bottom-24 right-4"]').first().locator('div[class*="border-orange-100"]').first().locator('button:has-text("+"), [data-testid="btn-increase"]').first() with timeout 10000ms
  - waiting for locator('div[class*="fixed bottom-24 right-4"]').first().locator('div[class*="border-orange-100"]').first().locator('button:has-text("+"), [data-testid="btn-increase"]').first()

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
- paragraph: Cho tôi xem món Bò bít tết sốt tiêu đen.
- text: A
- paragraph:
  - text: Dạ, Aria xin gợi ý
  - strong: Bò Sốt Tiêu Đen Bánh Mì Nóng Giòn
  - text: · 89.000đ rất phù hợp với yêu cầu của quý khách ạ. Bắp bò hầm mềm mọng trong nước sốt tiêu đen sánh đậm, thơm bơ tỏi, dùng kèm bánh mì đặc ruột nướng nóng giòn. Ngoài ra, quý khách cũng có thể thử thêm
  - strong: Steak Thăn Lưng Bò Mỹ Sốt Tiêu Đen Phú Quốc
  - text: · 195.000đ ạ!
- img "Bò Sốt Tiêu Đen Bánh Mì Nóng Giòn"
- paragraph: Bò Sốt Tiêu Đen Bánh Mì Nóng Giòn
- paragraph: Bắp bò hầm mềm mọng trong nước sốt tiêu đen sánh đậm, thơm bơ tỏi, dùng kèm bánh mì đặc ruột nướng nóng giòn.
- paragraph: 89.000 ₫
- button "Thêm Bò Sốt Tiêu Đen Bánh Mì Nóng Giòn vào giỏ": add Thêm
- img "Steak Thăn Lưng Bò Mỹ Sốt Tiêu Đen Phú Quốc"
- paragraph: Steak Thăn Lưng Bò Mỹ Sốt Tiêu Đen Phú Quốc
- paragraph: Thăn lưng bò Mỹ Ribeye nướng tái vừa (Medium Rare), vân mỡ xen kẽ mọng nước, dùng kèm khoai tây nghiền và sốt tiêu đen.
- paragraph: 195.000 ₫
- button "Thêm Steak Thăn Lưng Bò Mỹ Sốt Tiêu Đen Phú Quốc vào giỏ": add Thêm
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
  1   | // tests/blackbox/02_in_chat_cart.spec.js
  2   | const { test, expect } = require('@playwright/test');
  3   | const { AriaChatHelper } = require('./helpers/chatHelper');
  4   | 
  5   | test.describe('Phân Hệ 2: Thẻ Món Ăn & Giỏ Hàng Tương Tác Trong Chat (SPEC-MOD-02)', () => {
  6   |   let aria;
  7   | 
  8   |   test.beforeEach(async ({ page }) => {
  9   |     aria = new AriaChatHelper(page);
  10  |     await aria.openMenuAndChat();
  11  |   });
  12  | 
  13  |   // TC-ATC-01: Hiển thị Thẻ Món Ăn tương tác hoàn chỉnh khi khách hỏi hoặc bot gợi ý
  14  |   test('TC-ATC-01: Hiển thị Thẻ Món Ăn tương tác hoàn chỉnh cho Bò bít tết sốt tiêu đen', async ({ page }) => {
  15  |     await aria.sendMessage('Cho tôi xem món Bò bít tết sốt tiêu đen.');
  16  |     await aria.takeStepScreenshot('tc-atc-01-product-card');
  17  | 
  18  |     const response = await aria.getLastAriaResponse();
  19  |     expect(response.length).toBeGreaterThan(0);
  20  | 
  21  |     // Theo FR-CHAT-06: Bắt buộc hiển thị Thẻ món ăn tương tác với nút thêm vào giỏ
  22  |     const productCard = aria.getProductCards().first();
  23  |     await expect(productCard).toBeVisible({ timeout: 5000 });
  24  |     const addBtn = productCard.locator('button:has-text("Thêm"), button[data-testid*="cart"], button[data-testid*="add"]').first();
  25  |     await expect(addBtn).toBeVisible();
  26  |   });
  27  | 
  28  |   // TC-ATC-02: Thao tác 1 chạm cơ bản trên thẻ món ăn
  29  |   test('TC-ATC-02: Thực khách nhấn nút [+ Thêm vào giỏ] trên thẻ món ăn', async ({ page }) => {
  30  |     await aria.sendMessage('Cho tôi xem món Bò bít tết sốt tiêu đen.');
  31  |     await page.waitForTimeout(1000);
  32  | 
  33  |     const productCard = aria.getProductCards().first();
  34  |     const isCardVisible = await productCard.isVisible({ timeout: 3000 }).catch(() => false);
  35  | 
  36  |     if (isCardVisible) {
  37  |       const addBtn = productCard.locator('button:has-text("Thêm"), button[data-testid*="add"]').first();
  38  |       await addBtn.click();
  39  |       await page.waitForTimeout(1000);
  40  | 
  41  |       await aria.takeStepScreenshot('tc-atc-02-item-added');
  42  |       const cartCount = await aria.getCartCount();
  43  |       expect(cartCount).toBeGreaterThanOrEqual(1);
  44  |     } else {
  45  |       // Nếu là text confirmation
  46  |       await aria.sendMessage('Thêm Bò bít tết vào giỏ hàng giúp tôi.');
  47  |       const response = await aria.getLastAriaResponse();
  48  |       await aria.takeStepScreenshot('tc-atc-02-text-add');
  49  |       expect(response.toLowerCase()).toMatch(/(đã thêm|giỏ hàng|bò bít tết|thành công)/i);
  50  |     }
  51  |   });
  52  | 
  53  |   // TC-ATC-03: Thêm món qua câu lệnh ngôn ngữ tự nhiên
  54  |   test('TC-ATC-03: Thêm đồng thời cơm chiên hải sản và 2 ly nước chanh dây qua chat', async ({ page }) => {
  55  |     const countBefore = await aria.getCartCount();
  56  |     await aria.sendMessage('Cho 1 phần Cơm chiên hải sản và 2 ly Nước chanh dây vào giỏ nhé.');
  57  |     const response = await aria.getLastAriaResponse();
  58  | 
  59  |     await aria.takeStepScreenshot('tc-atc-03-nlp-add-cart');
  60  | 
  61  |     expect(response.length).toBeGreaterThan(0);
  62  |     // Aria phải xác nhận thêm vào giỏ hàng và cập nhật số lượng
  63  |     expect(response.toLowerCase()).toMatch(/(đã thêm|giỏ hàng|thành công)/i);
  64  |     const countAfter = await aria.getCartCount();
  65  |     expect(countAfter).toBeGreaterThan(countBefore);
  66  |   });
  67  | 
  68  |   // TC-ATC-04: Tùy biến món & Ghi chú hương vị (Modifiers)
  69  |   test('TC-ATC-04: Thêm món kèm yêu cầu riêng về đường, đá, rau thơm (Modifiers)', async ({ page }) => {
  70  |     await aria.sendMessage('Thêm 1 Trà sữa Ô Long 50% đường 70% đá, trân châu đen và 1 Phở bò không hành lá nhiều ớt.');
  71  |     const response = await aria.getLastAriaResponse();
  72  | 
  73  |     await aria.takeStepScreenshot('tc-atc-04-modifiers');
  74  | 
  75  |     expect(response.length).toBeGreaterThan(0);
  76  |     // Phải ghi nhận các modifiers/ghi chú hương vị
  77  |     expect(response.toLowerCase()).toMatch(/(ghi chú|tùy chọn|đã lưu|đã thêm|50%|70%|không hành|nhiều ớt)/i);
  78  |   });
  79  | 
  80  |   // TC-ATC-05: Tăng/Giảm số lượng trực tiếp trên thẻ món
  81  |   test('TC-ATC-05: Tăng/Giảm số lượng trực tiếp trên thẻ món ăn trước khi thêm', async ({ page }) => {
  82  |     await aria.sendMessage('Cho tôi xem món Bò bít tết sốt tiêu đen.');
  83  |     await page.waitForTimeout(1000);
  84  | 
  85  |     const productCard = aria.getProductCards().first();
  86  |     const isCardVisible = await productCard.isVisible({ timeout: 3000 }).catch(() => false);
  87  | 
  88  |     if (isCardVisible) {
  89  |       const plusBtn = productCard.locator('button:has-text("+"), [data-testid="btn-increase"]').first();
> 90  |       await expect(plusBtn).toBeVisible();
      |                             ^ Error: expect(locator).toBeVisible() failed
  91  |       await plusBtn.click();
  92  |       await page.waitForTimeout(300);
  93  |       await plusBtn.click();
  94  |       await page.waitForTimeout(300);
  95  |       const addBtn = productCard.locator('button:has-text("Thêm"), [data-testid*="add"]').first();
  96  |       await addBtn.click();
  97  |       await page.waitForTimeout(1000);
  98  |     } else {
  99  |       await aria.sendMessage('Thêm 3 phần Bò bít tết vào giỏ hàng.');
  100 |       const response = await aria.getLastAriaResponse();
  101 |       expect(response.toLowerCase()).toMatch(/(đã thêm 3|3 phần|3 suất|số lượng:? 3|3 bò bít tết)/i);
  102 |     }
  103 | 
  104 |     await aria.takeStepScreenshot('tc-atc-05-quantity-change');
  105 |   });
  106 | 
  107 |   // TC-ATC-06: Xử lý click liên tục (Debounce / Rapid Click)
  108 |   test('TC-ATC-06: Khách hàng nhấn nút [+ Thêm vào giỏ] liên tục kiểm tra debounce', async ({ page }) => {
  109 |     await aria.sendMessage('Cho tôi xem món Bò bít tết sốt tiêu đen.');
  110 |     await page.waitForTimeout(2000);
  111 | 
  112 |     const productCard = aria.getProductCards().first();
  113 |     const isCardVisible = await productCard.isVisible({ timeout: 4000 }).catch(() => false);
  114 | 
  115 |     if (isCardVisible) {
  116 |       const addBtn = productCard.locator('button:has-text("Thêm"), [data-testid*="add"]').first();
  117 |       // Nhấn nhanh 4 lần liên tiếp
  118 |       await Promise.all([
  119 |         addBtn.click().catch(() => {}),
  120 |         addBtn.click().catch(() => {}),
  121 |         addBtn.click().catch(() => {}),
  122 |         addBtn.click().catch(() => {})
  123 |       ]);
  124 |       await page.waitForTimeout(1000);
  125 |     }
  126 | 
  127 |     await aria.takeStepScreenshot('tc-atc-06-debounce');
  128 |     // Không bị crash ứng dụng
  129 |     await expect(page.locator('body')).toBeVisible();
  130 |   });
  131 | 
  132 |   // TC-ATC-07: Món đã tạm hết hàng trong ngày (Out of Stock)
  133 |   test('TC-ATC-07: Xử lý thẻ món ăn của một món đã ngưng phục vụ trong kho', async ({ page }) => {
  134 |     await aria.sendMessage('Tôi muốn xem món Cua hoàng đế hấp.');
  135 |     const response = await aria.getLastAriaResponse();
  136 | 
  137 |     await aria.takeStepScreenshot('tc-atc-07-out-of-stock');
  138 | 
  139 |     expect(response.length).toBeGreaterThan(0);
  140 |     // Nếu hết hàng thì Aria thông báo hoặc nút bị vô hiệu hóa
  141 |     const disabledBtn = page.locator('button:disabled, button:has-text("Tạm hết"), button:has-text("Hết hàng")').first();
  142 |     const isDisabledVisible = await disabledBtn.isVisible({ timeout: 2000 }).catch(() => false);
  143 |     if (!isDisabledVisible) {
  144 |       expect(response.toLowerCase()).toMatch(/(tạm hết|hết món|nguyên liệu|không có|thay thế|tôm hùm|hết hàng|chưa phục vụ)/i);
  145 |     }
  146 |   });
  147 | 
  148 |   // TC-ATC-08: Món hết hàng tại thời điểm bấm (Race condition)
  149 |   test('TC-ATC-08: Bắt lỗi nhẹ nhàng khi món hết hàng đúng thời điểm thêm', async ({ page }) => {
  150 |     await aria.sendMessage('Thêm suất Cua hoàng đế cuối cùng vào giỏ.');
  151 |     const response = await aria.getLastAriaResponse();
  152 | 
  153 |     await aria.takeStepScreenshot('tc-atc-08-race-condition');
  154 | 
  155 |     expect(response.length).toBeGreaterThan(0);
  156 |     // Không làm crash trang
  157 |     await expect(page.locator('body')).toBeVisible();
  158 |   });
  159 | 
  160 |   // TC-ATC-09: Xem tóm tắt giỏ hàng (Mini Cart in Chat)
  161 |   test('TC-ATC-09: Yêu cầu xem lại toàn bộ giỏ hàng hiện tại và tổng tiền trong chat', async ({ page }) => {
  162 |     await aria.sendMessage('Cho tôi xem lại giỏ hàng hiện tại gồm những gì và tổng tiền?');
  163 |     const response = await aria.getLastAriaResponse();
  164 | 
  165 |     await aria.takeStepScreenshot('tc-atc-09-mini-cart');
  166 | 
  167 |     expect(response.length).toBeGreaterThan(0);
  168 |     // Tóm tắt giỏ hàng phải có thông tin danh sách món, tổng tiền hoặc trạng thái giỏ
  169 |     expect(response.toLowerCase()).toMatch(/(giỏ hàng hiện tại|tổng tiền|tạm tính|danh sách món|chưa có món|giỏ hàng của bạn|tiến hành đặt món)/i);
  170 |   });
  171 | 
  172 |   // TC-ATC-10: Xóa hoặc giảm món khỏi giỏ ngay trong chat
  173 |   test('TC-ATC-10: Khách đổi ý muốn bỏ bớt hoặc xóa món đã chọn qua chat', async ({ page }) => {
  174 |     await aria.sendMessage('Bỏ bớt 1 ly nước chanh dây và xóa món cơm chiên ra khỏi giỏ cho tôi.');
  175 |     const response = await aria.getLastAriaResponse();
  176 | 
  177 |     await aria.takeStepScreenshot('tc-atc-10-remove-item');
  178 | 
  179 |     expect(response.length).toBeGreaterThan(0);
  180 |     expect(response.toLowerCase()).toMatch(/(xóa|bỏ|cập nhật|giỏ hàng|cơm chiên|nước chanh|giảm|trống)/i);
  181 |   });
  182 | 
  183 |   // TC-ATC-11: Giới hạn số lượng món tối đa trên đơn lẻ (Boundary Limit)
  184 |   test('TC-ATC-11: Khách yêu cầu thêm số lượng cực lớn 999 phần vào giỏ', async ({ page }) => {
  185 |     await aria.sendMessage('Thêm 999 phần Bò bít tết vào giỏ.');
  186 |     const response = await aria.getLastAriaResponse();
  187 | 
  188 |     await aria.takeStepScreenshot('tc-atc-11-max-quantity-limit');
  189 | 
  190 |     // Hệ thống chặn hoặc nhắc nhở số lượng tối đa / liên hệ hotline
```