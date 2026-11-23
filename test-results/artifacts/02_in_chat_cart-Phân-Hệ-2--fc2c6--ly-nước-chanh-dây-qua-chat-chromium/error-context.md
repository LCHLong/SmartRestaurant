# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02_in_chat_cart.spec.js >> Phân Hệ 2: Thẻ Món Ăn & Giỏ Hàng Tương Tác Trong Chat (SPEC-MOD-02) >> TC-ATC-03: Thêm đồng thời cơm chiên hải sản và 2 ly nước chanh dây qua chat
- Location: tests/blackbox/02_in_chat_cart.spec.js:54:3

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /(đã thêm|giỏ hàng|thành công)/i
Received string:  "dạ, aria xin gợi ý cơm chiên hải sản hoàng kim · 78.000đ rất phù hợp với yêu cầu của quý khách ạ. cơm hạt tơi vàng bọc lòng đỏ trứng muối bùi béo, xào cùng tôm sú giòn ngọt, mực ống tươi và đậu hà lan. ngoài ra, quý khách cũng có thể thử thêm chả giò hải sản · 65.000đ ạ!·
cơm chiên hải sản hoàng kim·
cơm hạt tơi vàng bọc lòng đỏ trứng muối bùi béo, xào cùng tôm sú giòn ngọt, mực ống tươi và đậu hà lan.·
78.000 ₫·
add
thêm·
chả giò hải sản·
chả giò chiên giòn với nhân hải sản, nấm mèo và cà rốt.·
65.000 ₫·
add
thêm
gợi ý này có hữu ích?
thumb_up
thumb_down
đổi món"
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]: Smart Restaurant
    - navigation [ref=e8]:
      - link "restaurant_menu Menu" [ref=e9] [cursor=pointer]:
        - /url: /menu
        - generic [ref=e10]: restaurant_menu
        - generic [ref=e11]: Menu
      - link "event_seat Book a Table" [ref=e12] [cursor=pointer]:
        - /url: /reservations
        - generic [ref=e13]: event_seat
        - generic [ref=e14]: Book a Table
      - link "search Lookup Reservation" [ref=e15] [cursor=pointer]:
        - /url: /reservations/lookup
        - generic [ref=e16]: search
        - generic [ref=e17]: Lookup Reservation
    - generic [ref=e18]:
      - button "language Tiếng Việt" [ref=e19] [cursor=pointer]:
        - generic [ref=e20]: language
        - text: Tiếng Việt
      - link "login Login" [ref=e21] [cursor=pointer]:
        - /url: /login
        - generic [ref=e22]: login
        - text: Login
  - main [ref=e23]:
    - generic [ref=e24]:
      - generic [ref=e25]:
        - generic [ref=e26]:
          - heading "Menu" [level=1] [ref=e27]
          - paragraph [ref=e28]: Discover delicious food
        - generic [ref=e29]:
          - button "event_seat Book a Table" [ref=e30] [cursor=pointer]:
            - generic [ref=e31]: event_seat
            - generic [ref=e32]: Book a Table
          - button "shopping_cart Shopping Cart" [ref=e33] [cursor=pointer]:
            - generic [ref=e34]: shopping_cart
            - generic [ref=e36]: Shopping Cart
      - generic [ref=e38]:
        - generic [ref=e39]: info
        - generic [ref=e41]:
          - heading "Welcome to Our Restaurant" [level=3] [ref=e42]
          - paragraph [ref=e43]: Please scan the QR code on your table to view our menu and start ordering.
      - generic [ref=e45]:
        - textbox "Search for your favorite food..." [ref=e46]
        - generic [ref=e47]: search
      - generic [ref=e48]:
        - button "auto_awesome All" [ref=e49] [cursor=pointer]:
          - generic [ref=e50]: auto_awesome
          - text: All
        - button "Khai vị (Starters)" [ref=e51] [cursor=pointer]
        - button "Món chính (Main Dish)" [ref=e52] [cursor=pointer]
        - button "Món chay & Healthy (Vegetarian)" [ref=e53] [cursor=pointer]
        - button "Đồ uống (Drinks)" [ref=e54] [cursor=pointer]
        - button "Tráng miệng (Desserts)" [ref=e55] [cursor=pointer]
        - button "Đặc biệt (Special)" [ref=e56] [cursor=pointer]
      - generic [ref=e57]:
        - generic [ref=e58]:
          - generic [ref=e59]: sort
          - text: "Sort by:"
        - combobox [ref=e60] [cursor=pointer]:
          - option "Name (A-Z)" [selected]
          - option "Newest"
          - option "Most Popular"
          - 'option "Price: Low to High"'
          - 'option "Price: High to Low"'
        - button "restaurant_menu Chef's Choice" [ref=e61] [cursor=pointer]:
          - generic [ref=e62]: restaurant_menu
          - generic [ref=e63]: Chef's Choice
      - generic [ref=e64]:
        - generic [ref=e65] [cursor=pointer]:
          - img "Bạc Xỉu Ba Tầng Sài Gòn Xưa - Image 1" [ref=e67]
          - generic [ref=e68]:
            - heading "Bạc Xỉu Ba Tầng Sài Gòn Xưa" [level=3] [ref=e69]
            - paragraph [ref=e70]: Tầng sữa đặc ngọt ngào ở đáy, lớp sữa tươi béo mịn ở giữa và phủ lớp cà phê phin đánh bọt nâu bồng bềnh bên trên.
            - generic [ref=e71]: 38.000 ₫
        - generic [ref=e73] [cursor=pointer]:
          - generic [ref=e74]:
            - img "Bánh Flan - Image 1" [ref=e75]
            - generic [ref=e76]:
              - button "Go to image 1" [ref=e77]
              - button "Go to image 2" [ref=e78]
          - generic [ref=e79]:
            - heading "Bánh Flan" [level=3] [ref=e80]
            - paragraph [ref=e81]: Bánh flan mềm mịn, thơm mùi trứng và caramel.
            - generic [ref=e82]: 25.000 ₫
        - generic [ref=e84] [cursor=pointer]:
          - img "Bánh Flan Caramel Hạt Cafe Truyền Thống - Image 1" [ref=e86]
          - generic [ref=e87]:
            - heading "Bánh Flan Caramel Hạt Cafe Truyền Thống" [level=3] [ref=e88]
            - paragraph [ref=e89]: Bánh flan mềm mượt không rỗ mặt làm từ trứng gà ta tươi và sữa đặc, chan sốt caramel đường thốt nốt và chút cốt cà phê đắng nhẹ.
            - generic [ref=e90]: 32.000 ₫
        - generic [ref=e92] [cursor=pointer]:
          - img "Bánh Mì Thập Cẩm Xá Xíu Ba Tê Trứ Danh - Image 1" [ref=e94]
          - generic [ref=e95]:
            - heading "Bánh Mì Thập Cẩm Xá Xíu Ba Tê Trứ Danh" [level=3] [ref=e96]
            - paragraph [ref=e97]: Vỏ bánh mì nướng giòn rụm bên ngoài ruột xốp, phết pate gan heo béo ngậy, thịt xá xíu mềm thơm, chả lụa và đồ chua.
            - generic [ref=e98]: 35.000 ₫
        - generic [ref=e100] [cursor=pointer]:
          - img "Bánh Mousse Chanh Dây Phủ Gương Vàng - Image 1" [ref=e102]
          - generic [ref=e103]:
            - heading "Bánh Mousse Chanh Dây Phủ Gương Vàng" [level=3] [ref=e104]
            - paragraph [ref=e105]: Đế bánh bông lan xốp nhẹ, lớp kem mousse phô mai mịn mượt phủ thạch chanh leo tráng gương chua dịu lấp lánh.
            - generic [ref=e106]: 48.000 ₫
        - generic [ref=e108] [cursor=pointer]:
          - generic [ref=e109]:
            - img "Bò Lúc Lắc Khoai Tây Chiên Pháp - Image 1" [ref=e110]
            - generic [ref=e111]:
              - generic [ref=e112]: restaurant_menu
              - generic [ref=e113]: Chef's Choice
          - generic [ref=e114]:
            - heading "Bò Lúc Lắc Khoai Tây Chiên Pháp" [level=3] [ref=e115]
            - paragraph [ref=e116]: Thịt bò thăn mềm xắt quân cờ xào lửa lớn sốt tiêu đen bơ tỏi, ớt chuông ba màu và khoai tây chiên giòn.
            - generic [ref=e117]: 119.000 ₫
        - generic [ref=e119] [cursor=pointer]:
          - img "Bò Sốt Tiêu Đen Bánh Mì Nóng Giòn - Image 1" [ref=e121]
          - generic [ref=e122]:
            - heading "Bò Sốt Tiêu Đen Bánh Mì Nóng Giòn" [level=3] [ref=e123]
            - paragraph [ref=e124]: Bắp bò hầm mềm mọng trong nước sốt tiêu đen sánh đậm, thơm bơ tỏi, dùng kèm bánh mì đặc ruột nướng nóng giòn.
            - generic [ref=e125]: 89.000 ₫
        - generic [ref=e127] [cursor=pointer]:
          - generic [ref=e128]:
            - img "Bún Bò Huế - Image 1" [ref=e129]
            - generic [ref=e130]:
              - button "Go to image 1" [ref=e131]
              - button "Go to image 2" [ref=e132]
              - button "Go to image 3" [ref=e133]
          - generic [ref=e134]:
            - heading "Bún Bò Huế" [level=3] [ref=e135]
            - paragraph [ref=e136]: Bún bò cay nồng đặc trưng Huế với bắp bò, giò heo.
            - generic [ref=e137]: 70.000 ₫
        - generic [ref=e139] [cursor=pointer]:
          - img "Bún Bò Huế Cố Đô Cay Nồng - Image 1" [ref=e141]
          - generic [ref=e142]:
            - heading "Bún Bò Huế Cố Đô Cay Nồng" [level=3] [ref=e143]
            - paragraph [ref=e144]: Bún sợi tròn to đặc trưng, bắp bò hoa giòn, giò heo mềm rục, chả cua Huế và nước dùng mắm ruốc sả ớt đỏ au.
            - generic [ref=e145]: 75.000 ₫
        - generic [ref=e147] [cursor=pointer]:
          - generic [ref=e148]:
            - img "Bún Chả Hà Nội - Image 1" [ref=e149]
            - generic [ref=e150]:
              - button "Go to image 1" [ref=e151]
              - button "Go to image 2" [ref=e152]
          - generic [ref=e153]:
            - heading "Bún Chả Hà Nội" [level=3] [ref=e154]
            - paragraph [ref=e155]: Thịt nướng và chả viên nướng than hồng.
            - generic [ref=e156]: 65.000 ₫
        - generic [ref=e158] [cursor=pointer]:
          - generic [ref=e159]:
            - img "Bún Chả Hà Nội Nướng Than Hoa - Image 1" [ref=e160]
            - generic [ref=e161]:
              - generic [ref=e162]: restaurant_menu
              - generic [ref=e163]: Chef's Choice
          - generic [ref=e164]:
            - heading "Bún Chả Hà Nội Nướng Than Hoa" [level=3] [ref=e165]
            - paragraph [ref=e166]: Thịt ba chỉ thái mỏng ướp mắm tiêu và chả băm viên nướng trên vỉ than hồng, ăn cùng nước chấm ấm và bún tươi.
            - generic [ref=e167]: 69.000 ₫
        - generic [ref=e169] [cursor=pointer]:
          - img "Bún Nấm Thanh Đạm Rong Biển - Image 1" [ref=e171]
          - generic [ref=e172]:
            - heading "Bún Nấm Thanh Đạm Rong Biển" [level=3] [ref=e173]
            - paragraph [ref=e174]: Bún tươi chan nước dùng hầm củ quả lê táo ngọt thanh, các loại nấm rơm, nấm bào ngư, nấm kim châm và rong biển Wakame.
            - generic [ref=e175]: 55.000 ₫
        - generic [ref=e177] [cursor=pointer]:
          - img "Bún Riêu Cua Đồng Ốc Lụa Giòn Sần Sật - Image 1" [ref=e179]
          - generic [ref=e180]:
            - heading "Bún Riêu Cua Đồng Ốc Lụa Giòn Sần Sật" [level=3] [ref=e181]
            - paragraph [ref=e182]: Cua đồng giã tay đóng tảng riêu béo ngậy, ốc bươu giòn sần sật, đậu hũ chiên phồng ngấm nước lèo chua thanh cà chua và giấm bỗng.
            - generic [ref=e183]: 65.000 ₫
        - generic [ref=e185] [cursor=pointer]:
          - generic [ref=e186]:
            - img "Cá Hồi Áp Chảo Sốt Bơ Chanh Măng Tây - Image 1" [ref=e187]
            - generic [ref=e188]:
              - generic [ref=e189]: restaurant_menu
              - generic [ref=e190]: Chef's Choice
          - generic [ref=e191]:
            - heading "Cá Hồi Áp Chảo Sốt Bơ Chanh Măng Tây" [level=3] [ref=e192]
            - paragraph [ref=e193]: Phi-lê cá hồi Na Uy tươi áp chảo vàng da giòn rụm thịt mềm hồng, phủ sốt bơ chanh vàng Dill thơm dịu và măng tây xào bơ.
            - generic [ref=e194]: 165.000 ₫
        - generic [ref=e196] [cursor=pointer]:
          - img "Cà Phê Đen Đá Buôn Ma Thuột - Image 1" [ref=e198]
          - generic [ref=e199]:
            - heading "Cà Phê Đen Đá Buôn Ma Thuột" [level=3] [ref=e200]
            - paragraph [ref=e201]: 100% cà phê Robusta hảo hạng pha phin truyền thống, thơm đượm nồng nàn không pha tạp, vị đắng mộc mạc nguyên bản.
            - generic [ref=e202]: 29.000 ₫
        - generic [ref=e204] [cursor=pointer]:
          - generic [ref=e205]:
            - img "Cà Phê Muối Cố Đô Béo Mặn - Image 1" [ref=e206]
            - generic [ref=e207]:
              - generic [ref=e208]: restaurant_menu
              - generic [ref=e209]: Chef's Choice
          - generic [ref=e210]:
            - heading "Cà Phê Muối Cố Đô Béo Mặn" [level=3] [ref=e211]
            - paragraph [ref=e212]: Cốt cà phê phin đậm đặc kết hợp lớp kem sữa muối mặn mặn béo ngậy phía trên, khuấy đều tạo hương vị gây nghiện.
            - generic [ref=e213]: 42.000 ₫
        - generic [ref=e215] [cursor=pointer]:
          - img "Cà phê Sữa Đá - Image 1" [ref=e217]
          - generic [ref=e218]:
            - heading "Cà phê Sữa Đá" [level=3] [ref=e219]
            - paragraph [ref=e220]: Cà phê pha phin truyền thống hòa quyện cùng sữa đặc.
            - generic [ref=e221]: 35.000 ₫
        - generic [ref=e223] [cursor=pointer]:
          - generic [ref=e224]:
            - img "Cà Phê Sữa Đá Sài Gòn Truyền Thống - Image 1" [ref=e225]
            - generic [ref=e226]:
              - generic [ref=e227]: restaurant_menu
              - generic [ref=e228]: Chef's Choice
          - generic [ref=e229]:
            - heading "Cà Phê Sữa Đá Sài Gòn Truyền Thống" [level=3] [ref=e230]
            - paragraph [ref=e231]: Cà phê Robusta Buôn Ma Thuột rang mộc pha phin truyền thống nhỏ giọt, hòa quyện sữa đặc thơm ngọt và đá viên tinh khiết.
            - generic [ref=e232]: 35.000 ₫
        - generic [ref=e234] [cursor=pointer]:
          - generic [ref=e235]:
            - img "Canh Hạt Sen Củ Sen Táo Đỏ Bổ Dưỡng - Image 1" [ref=e236]
            - generic [ref=e237]:
              - generic [ref=e238]: restaurant_menu
              - generic [ref=e239]: Chef's Choice
          - generic [ref=e240]:
            - heading "Canh Hạt Sen Củ Sen Táo Đỏ Bổ Dưỡng" [level=3] [ref=e241]
            - paragraph [ref=e242]: Hạt sen tươi hầm mềm bùi cùng củ sen giòn nhẹ, táo đỏ Tân Cương ngọt thơm và nấm tuyết trong vắt thanh tao.
            - generic [ref=e243]: 49.000 ₫
        - generic [ref=e246] [cursor=pointer]:
          - generic [ref=e247]:
            - img "Chả giò Hải sản - Image 1" [ref=e248]
            - generic [ref=e249]:
              - button "Go to image 1" [ref=e250]
              - button "Go to image 2" [ref=e251]
          - generic [ref=e252]:
            - heading "Chả giò Hải sản" [level=3] [ref=e253]
            - paragraph [ref=e254]: Chả giò chiên giòn với nhân hải sản, nấm mèo và cà rốt.
            - generic [ref=e255]: 65.000 ₫
  - generic [ref=e257]:
    - generic [ref=e258]:
      - generic [ref=e259]: smart_toy
      - generic [ref=e261]:
        - paragraph [ref=e263]: Aria
        - paragraph [ref=e265]: Trợ lý tư vấn ẩm thực & đặt bàn
      - generic [ref=e266]:
        - button "Phóng to khung chat" [ref=e267] [cursor=pointer]:
          - generic [ref=e268]: open_in_full
        - button "Đóng chat" [ref=e269] [cursor=pointer]:
          - generic [ref=e270]: close
    - generic [ref=e271]:
      - generic [ref=e272]:
        - generic [ref=e273]: A
        - paragraph [ref=e276]:
          - text: Xin chào! Em là
          - strong [ref=e277]: Aria
          - generic [ref=e278]: — trợ lý tư vấn món ăn của nhà hàng 🍽️
          - text: Bạn muốn tìm món gì hôm nay, hoặc có khẩu vị/yêu cầu dị ứng nào không ạ?
      - paragraph [ref=e281]: Cho 1 phần Cơm chiên hải sản và 2 ly Nước chanh dây vào giỏ nhé.
      - generic [ref=e282]:
        - generic [ref=e283]: A
        - generic [ref=e284]:
          - paragraph [ref=e286]:
            - text: Dạ, Aria xin gợi ý
            - strong [ref=e287]: Cơm Chiên Hải Sản Hoàng Kim
            - text: · 78.000đ rất phù hợp với yêu cầu của quý khách ạ. Cơm hạt tơi vàng bọc lòng đỏ trứng muối bùi béo, xào cùng tôm sú giòn ngọt, mực ống tươi và đậu Hà Lan. Ngoài ra, quý khách cũng có thể thử thêm
            - strong [ref=e288]: Chả giò Hải sản
            - text: · 65.000đ ạ!
          - generic [ref=e289]:
            - generic [ref=e290]:
              - img "Cơm Chiên Hải Sản Hoàng Kim" [ref=e291]
              - generic [ref=e292]:
                - paragraph [ref=e293]: Cơm Chiên Hải Sản Hoàng Kim
                - paragraph [ref=e294]: Cơm hạt tơi vàng bọc lòng đỏ trứng muối bùi béo, xào cùng tôm sú giòn ngọt, mực ống tươi và đậu Hà Lan.
                - paragraph [ref=e295]: 78.000 ₫
              - button "Thêm Cơm Chiên Hải Sản Hoàng Kim vào giỏ" [ref=e296] [cursor=pointer]:
                - generic [ref=e297]: add
                - generic [ref=e298]: Thêm
            - generic [ref=e299]:
              - img "Chả giò Hải sản" [ref=e300]
              - generic [ref=e301]:
                - paragraph [ref=e302]: Chả giò Hải sản
                - paragraph [ref=e303]: Chả giò chiên giòn với nhân hải sản, nấm mèo và cà rốt.
                - paragraph [ref=e304]: 65.000 ₫
              - button "Thêm Chả giò Hải sản vào giỏ" [ref=e305] [cursor=pointer]:
                - generic [ref=e306]: add
                - generic [ref=e307]: Thêm
          - generic [ref=e308]:
            - generic [ref=e309]: Gợi ý này có hữu ích?
            - button "Thích gợi ý này" [ref=e310] [cursor=pointer]:
              - generic [ref=e311]: thumb_up
            - button "Đổi món khác" [ref=e312] [cursor=pointer]:
              - generic [ref=e313]: thumb_down
              - generic [ref=e314]: Đổi món
    - generic [ref=e315]:
      - generic [ref=e316]:
        - textbox "Nhập câu hỏi cho Aria..." [ref=e317]
        - button "Gửi tin nhắn" [disabled] [ref=e318] [cursor=pointer]:
          - generic [ref=e319]: send
      - paragraph [ref=e320]: Aria • AI Consultant
  - button "Đóng Aria chat" [ref=e321] [cursor=pointer]:
    - generic [ref=e322]: close
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
> 63  |     expect(response.toLowerCase()).toMatch(/(đã thêm|giỏ hàng|thành công)/i);
      |                                    ^ Error: expect(received).toMatch(expected)
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
  90  |       await expect(plusBtn).toBeVisible();
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
```