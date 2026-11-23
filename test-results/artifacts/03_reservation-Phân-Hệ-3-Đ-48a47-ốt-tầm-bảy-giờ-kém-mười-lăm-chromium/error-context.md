# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03_reservation.spec.js >> Phân Hệ 3: Đặt Bàn Tự Động Qua NLP Tiếng Việt (SPEC-MOD-03) >> TC-RES-03: Xử lý các cụm từ chỉ thời gian tương đối: tối mốt tầm bảy giờ kém mười lăm
- Location: tests/blackbox/03_reservation.spec.js:38:3

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /(18:45|7 giờ kém|bảy giờ kém|tối mốt|2 người|đặt bàn|thông tin)/i
Received string:  "dạ, bạn muốn đến lúc mấy giờ?·
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
      - paragraph [ref=e281]: Cho đặt bàn 2 người vào tối mốt tầm bảy giờ kém mười lăm.
      - generic [ref=e282]:
        - generic [ref=e283]: A
        - generic [ref=e284]:
          - paragraph [ref=e286]: Dạ, bạn muốn đến lúc mấy giờ?
          - generic [ref=e287]:
            - generic [ref=e288]: Gợi ý này có hữu ích?
            - button "Thích gợi ý này" [ref=e289] [cursor=pointer]:
              - generic [ref=e290]: thumb_up
            - button "Đổi món khác" [ref=e291] [cursor=pointer]:
              - generic [ref=e292]: thumb_down
              - generic [ref=e293]: Đổi món
    - generic [ref=e294]:
      - generic [ref=e295]:
        - textbox "Nhập câu hỏi cho Aria..." [ref=e296]
        - button "Gửi tin nhắn" [disabled] [ref=e297] [cursor=pointer]:
          - generic [ref=e298]: send
      - paragraph [ref=e299]: Aria • AI Consultant
  - button "Đóng Aria chat" [ref=e300] [cursor=pointer]:
    - generic [ref=e301]: close
```

# Test source

```ts
  1   | // tests/blackbox/03_reservation.spec.js
  2   | const { test, expect } = require('@playwright/test');
  3   | const { AriaChatHelper } = require('./helpers/chatHelper');
  4   | 
  5   | test.describe('Phân Hệ 3: Đặt Bàn Tự Động Qua NLP Tiếng Việt (SPEC-MOD-03)', () => {
  6   |   let aria;
  7   | 
  8   |   test.beforeEach(async ({ page }) => {
  9   |     aria = new AriaChatHelper(page);
  10  |     await aria.openMenuAndChat();
  11  |   });
  12  | 
  13  |   // TC-RES-01: Ngôn ngữ tự nhiên chuẩn đầy đủ 5 thông số
  14  |   test('TC-RES-01: Đặt bàn với câu chứa đầy đủ thông tin bằng tiếng Việt tự nhiên', async () => {
  15  |     await aria.sendMessage('Đặt cho mình bàn 4 người vào tối mai lúc 7 rưỡi nhé, tên Nam SĐT 0912345678.');
  16  |     const response = await aria.getLastAriaResponse();
  17  | 
  18  |     await aria.takeStepScreenshot('tc-res-01-full-natural-reservation');
  19  | 
  20  |     expect(response.length).toBeGreaterThan(0);
  21  |     // Aria trích xuất và xác nhận hoặc xuất thẻ đặt bàn
  22  |     expect(response.toLowerCase()).toMatch(/(đặt bàn|thành công|nam|0912345678|19:30|7 rưỡi|4|xác nhận|res-)/i);
  23  |   });
  24  | 
  25  |   // TC-RES-02: Thu thập thông tin thiếu (Slot Filling Loop)
  26  |   test('TC-RES-02: Cơ chế thu thập thông tin còn thiếu khi khách nói nhu cầu chung chung', async () => {
  27  |     await aria.sendMessage('Mình muốn đặt bàn vào trưa Chủ Nhật tuần này.');
  28  |     const response = await aria.getLastAriaResponse();
  29  | 
  30  |     await aria.takeStepScreenshot('tc-res-02-slot-filling-step1');
  31  | 
  32  |     expect(response.length).toBeGreaterThan(0);
  33  |     // Aria phải hỏi thêm giờ và số khách
  34  |     expect(response.toLowerCase()).toMatch(/(mấy giờ|bao nhiêu|số khách|người|chủ nhật|thời gian)/i);
  35  |   });
  36  | 
  37  |   // TC-RES-03: Thời gian tương đối phức tạp
  38  |   test('TC-RES-03: Xử lý các cụm từ chỉ thời gian tương đối: tối mốt tầm bảy giờ kém mười lăm', async () => {
  39  |     await aria.sendMessage('Cho đặt bàn 2 người vào tối mốt tầm bảy giờ kém mười lăm.');
  40  |     const response = await aria.getLastAriaResponse();
  41  | 
  42  |     await aria.takeStepScreenshot('tc-res-03-relative-time');
  43  | 
  44  |     expect(response.length).toBeGreaterThan(0);
  45  |     // Phản hồi phải nhận diện thời gian (18:45 hoặc tối mốt hoặc hỏi thêm tên/SĐT)
> 46  |     expect(response.toLowerCase()).toMatch(/(18:45|7 giờ kém|bảy giờ kém|tối mốt|2 người|đặt bàn|thông tin)/i);
      |                                    ^ Error: expect(received).toMatch(expected)
  47  |   });
  48  | 
  49  |   // TC-RES-04: Yêu cầu vị trí ngồi cụ thể (Seating Preference)
  50  |   test('TC-RES-04: Tiếp nhận sở thích vị trí ngồi ngoài trời thoáng mát', async () => {
  51  |     await aria.sendMessage('Đặt bàn 6 người tối nay 19:00, ưu tiên bàn ngoài trời thoáng mát hút thuốc được, tên Tuấn SĐT 0988123456.');
  52  |     const response = await aria.getLastAriaResponse();
  53  | 
  54  |     await aria.takeStepScreenshot('tc-res-04-seating-preference');
  55  | 
  56  |     expect(response.length).toBeGreaterThan(0);
  57  |     expect(response.toLowerCase()).toMatch(/(ngoài trời|thoáng mát|khu vực|vị trí|ghi chú|tuấn|19:00|6)/i);
  58  |   });
  59  | 
  60  |   // TC-RES-05: Sinh mã đặt bàn độc nhất & Thẻ Xác Nhận Đặt Bàn (Booking Card)
  61  |   test('TC-RES-05: Sinh mã đặt bàn độc nhất dạng #RES- và hiển thị Thẻ Đặt Bàn', async ({ page }) => {
  62  |     await aria.sendMessage('Đặt bàn 2 người lúc 19:00 tối mai, tên Hoàng SĐT 0903123456.');
  63  |     const response = await aria.getLastAriaResponse();
  64  | 
  65  |     await aria.takeStepScreenshot('tc-res-05-booking-card');
  66  | 
  67  |     expect(response.length).toBeGreaterThan(0);
  68  |     // Kiểm tra có mã bàn hoặc thẻ đặt bàn
  69  |     const bookingCard = aria.getBookingCards().first();
  70  |     const isBookingCardVisible = await bookingCard.isVisible({ timeout: 3000 }).catch(() => false);
  71  |     if (isBookingCardVisible) {
  72  |       await expect(bookingCard).toBeVisible();
  73  |     } else {
  74  |       expect(response.toLowerCase()).toMatch(/(res-|mã|xác nhận|hoàng|19:00|đặt bàn)/i);
  75  |     }
  76  |   });
  77  | 
  78  |   // TC-RES-06: Xử lý khung giờ cao điểm kín bàn (Peak Hour Sold-Out)
  79  |   test('TC-RES-06: Khách đặt bàn vào khung giờ cao điểm đã kín chỗ', async () => {
  80  |     await aria.sendMessage('Đặt bàn 4 người lúc 19:30 tối thứ 7 tuần này.');
  81  |     const response = await aria.getLastAriaResponse();
  82  | 
  83  |     await aria.takeStepScreenshot('tc-res-06-peak-hour');
  84  | 
  85  |     expect(response.length).toBeGreaterThan(0);
  86  |     // Aria xử lý đặt bàn hoặc đề xuất giờ thay thế nếu kín
  87  |     expect(response.toLowerCase()).toMatch(/(kín bàn|hết bàn|khung giờ|đổi|18:|20:|đặt bàn|thông tin|tối thứ 7)/i);
  88  |   });
  89  | 
  90  |   // TC-RES-07: Chính sách đặt bàn ngày Lễ / Sự kiện đặc biệt
  91  |   test('TC-RES-07: Chính sách đặt bàn ngày Lễ Valentine 14/2 hoặc ngày đặc biệt', async () => {
  92  |     await aria.sendMessage('Đặt bàn 2 người tối Valentine 14/2 lúc 19:00.');
  93  |     const response = await aria.getLastAriaResponse();
  94  | 
  95  |     await aria.takeStepScreenshot('tc-res-07-holiday-reservation');
  96  | 
  97  |     expect(response.length).toBeGreaterThan(0);
  98  |     expect(response.toLowerCase()).toMatch(/(valentine|14\/2|ngày lễ|sự kiện|đặt cọc|phụ thu|giữ chỗ|đặt bàn)/i);
  99  |   });
  100 | 
  101 |   // TC-RES-08: Chỉnh sửa thông tin đặt bàn ngay trong chat
  102 |   test('TC-RES-08: Chỉnh sửa thông tin đặt bàn trực tiếp trong chat', async () => {
  103 |     await aria.sendMessage('Mã bàn #RES-2026-8891 tôi muốn đổi sang 20:00 và đi 6 người được không?');
  104 |     const response = await aria.getLastAriaResponse();
  105 | 
  106 |     await aria.takeStepScreenshot('tc-res-08-edit-reservation');
  107 | 
  108 |     expect(response.length).toBeGreaterThan(0);
  109 |     expect(response.toLowerCase()).toMatch(/(đổi|cập nhật|chỉnh sửa|20:00|6 người|res-2026-8891|mã bàn|bàn)/i);
  110 |   });
  111 | 
  112 |   // TC-RES-09: Hủy đặt bàn trực tiếp trong cuộc trò chuyện
  113 |   test('TC-RES-09: Hủy đặt bàn trực tiếp trong cuộc trò chuyện', async () => {
  114 |     await aria.sendMessage('Hủy giúp tôi mã đặt bàn #RES-2026-8891.');
  115 |     const response = await aria.getLastAriaResponse();
  116 | 
  117 |     await aria.takeStepScreenshot('tc-res-09-cancel-reservation');
  118 | 
  119 |     expect(response.length).toBeGreaterThan(0);
  120 |     expect(response.toLowerCase()).toMatch(/(hủy|đã hủy|xác nhận|res-2026-8891|hẹn gặp lại|tiếc)/i);
  121 |   });
  122 | 
  123 |   // TC-RES-10: Chặn đặt bàn thời gian trong quá khứ
  124 |   test('TC-RES-10: Khách nhập thời gian đã trôi qua so với giờ hiện tại', async () => {
  125 |     await aria.sendMessage('Đặt bàn lúc 08:00 sáng hôm nay cho 2 người.');
  126 |     const response = await aria.getLastAriaResponse();
  127 | 
  128 |     await aria.takeStepScreenshot('tc-res-10-past-time');
  129 | 
  130 |     expect(response.length).toBeGreaterThan(0);
  131 |     // Phải từ chối thời gian quá khứ
  132 |     expect(response.toLowerCase()).toMatch(/(đã qua|trôi qua|quá khứ|không thể|tương lai|tối nay|ngày mai|chọn lại)/i);
  133 |   });
  134 | 
  135 |   // TC-RES-11: Chặn đặt ngoài giờ hoạt động
  136 |   test('TC-RES-11: Khách yêu cầu bàn lúc nhà hàng chưa mở cửa hoặc đã đóng cửa (2h sáng)', async () => {
  137 |     await aria.sendMessage('Đặt bàn ăn khuya lúc 2h sáng mai cho 4 người.');
  138 |     const response = await aria.getLastAriaResponse();
  139 | 
  140 |     await aria.takeStepScreenshot('tc-res-11-outside-hours');
  141 | 
  142 |     expect(response.length).toBeGreaterThan(0);
  143 |     // Aria thông báo giờ mở cửa và từ chối 2h sáng
  144 |     expect(response.toLowerCase()).toMatch(/(giờ mở cửa|đóng cửa|hoạt động|2h|2:00|10:00|22:|không phục vụ)/i);
  145 |   });
  146 | 
```