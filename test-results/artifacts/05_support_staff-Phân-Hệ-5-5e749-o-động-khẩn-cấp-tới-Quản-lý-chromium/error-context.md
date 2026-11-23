# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05_support_staff.spec.js >> Phân Hệ 5: Hỗ Trợ Thực Khách & Nút Gọi Nhân Viên (SPEC-MOD-05) >> TC-SUP-10: Khách bức xúc vì chờ món quá lâu, kích hoạt báo động khẩn cấp tới Quản lý
- Location: tests/blackbox/05_support_staff.spec.js:145:3

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /(xin lỗi|thành thật|quản lý|chậm trễ|khắc phục|ngay lập tức|ưu tiên|thông cảm)/i
Received string:  "dạ, aria xin gợi ý kem trái dừa · 45.000đ rất phù hợp với yêu cầu của quý khách ạ. kem dừa mát lạnh phục vụ trong trái dừa tươi. ngoài ra, quý khách cũng có thể thử thêm kem xôi dừa thái lan thơm bùi · 49.000đ ạ!·
kem trái dừa·
kem dừa mát lạnh phục vụ trong trái dừa tươi.·
45.000 ₫·
add
thêm·
kem xôi dừa thái lan thơm bùi·
viên kem dừa non mát lạnh phục vụ trong gáo dừa tươi, lót xôi nếp lá dứa dẻo thơm, rắc dừa nạo và đậu phộng rang giòn.·
49.000 ₫·
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
      - paragraph [ref=e281]: Phục vụ quá tệ, 40 phút rồi chưa có món, tôi cần gặp quản lý ngay lập tức!
      - generic [ref=e282]:
        - generic [ref=e283]: A
        - generic [ref=e284]:
          - paragraph [ref=e286]:
            - text: Dạ, Aria xin gợi ý
            - strong [ref=e287]: Kem Trái Dừa
            - text: · 45.000đ rất phù hợp với yêu cầu của quý khách ạ. Kem dừa mát lạnh phục vụ trong trái dừa tươi. Ngoài ra, quý khách cũng có thể thử thêm
            - strong [ref=e288]: Kem Xôi Dừa Thái Lan Thơm Bùi
            - text: · 49.000đ ạ!
          - generic [ref=e289]:
            - generic [ref=e290]:
              - img "Kem Trái Dừa" [ref=e291]
              - generic [ref=e292]:
                - paragraph [ref=e293]: Kem Trái Dừa
                - paragraph [ref=e294]: Kem dừa mát lạnh phục vụ trong trái dừa tươi.
                - paragraph [ref=e295]: 45.000 ₫
              - button "Thêm Kem Trái Dừa vào giỏ" [ref=e296] [cursor=pointer]:
                - generic [ref=e297]: add
                - generic [ref=e298]: Thêm
            - generic [ref=e299]:
              - img "Kem Xôi Dừa Thái Lan Thơm Bùi" [ref=e300]
              - generic [ref=e301]:
                - paragraph [ref=e302]: Kem Xôi Dừa Thái Lan Thơm Bùi
                - paragraph [ref=e303]: Viên kem dừa non mát lạnh phục vụ trong gáo dừa tươi, lót xôi nếp lá dứa dẻo thơm, rắc dừa nạo và đậu phộng rang giòn.
                - paragraph [ref=e304]: 49.000 ₫
              - button "Thêm Kem Xôi Dừa Thái Lan Thơm Bùi vào giỏ" [ref=e305] [cursor=pointer]:
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
  100 |     await expect(quickTag).toBeVisible({ timeout: 4000 });
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
> 153 |     expect(response.toLowerCase()).toMatch(/(xin lỗi|thành thật|quản lý|chậm trễ|khắc phục|ngay lập tức|ưu tiên|thông cảm)/i);
      |                                    ^ Error: expect(received).toMatch(expected)
  154 |   });
  155 | });
  156 | 
```