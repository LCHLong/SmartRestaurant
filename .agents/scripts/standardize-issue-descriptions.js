#!/usr/bin/env node

/**
 * Script cập nhật lại diễn giải toàn bộ GitHub Bug Issues #21 đến #31 theo chuẩn
 * Black-Box QA chuyên nghiệp: Phân loại, Mô tả chi tiết, Các bước tái hiện, Thực tế vs Kỳ vọng, Tác động nghiệp vụ, và Bằng chứng trực quan.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repo = 'LCHLong/SmartRestaurant';
const mediaBranch = 'media-assets';
const rawBaseUrl = `https://raw.githubusercontent.com/${repo}/${mediaBranch}`;
const blobBaseUrl = `https://github.com/${repo}/blob/${mediaBranch}`;

function getEvidenceBlock(scenario, imgFile, vidFile) {
  const rawImgUrl = `${rawBaseUrl}/images/${imgFile}`;
  const rawVidUrl = `${rawBaseUrl}/videos/${vidFile}`;
  const blobVidUrl = `${blobBaseUrl}/videos/${vidFile}`;

  return `---

### 📎 Bằng Chứng Nghiệm Thu Trực Quan (Evidence)

#### 📸 Ảnh chụp màn hình lỗi (Screenshot)
![Ảnh chụp lỗi: ${scenario}](${rawImgUrl})

<details>
<summary>🔍 Chi tiết & Đường dẫn ảnh</summary>

- **Tên tệp lưu trữ:** \`images/${imgFile}\`
- **URL xem trực tiếp:** [Mở ảnh gốc trong tab mới](${rawImgUrl})
</details>

---

#### 🎬 Băng ghi hình Playwright (Video)
> 🎥 **Playwright E2E Video Recording:**  
> ▶️ **[Nhấn vào đây để Xem Video trực tiếp trên trình duyệt GitHub](${blobVidUrl})**  
> 📥 **[Tải file Video WebM gốc (${vidFile})](${rawVidUrl})**

[![Xem Video Playwright](${rawImgUrl})](${blobVidUrl})
*Tip: Bấm vào ảnh trên hoặc link để mở video trực tiếp trên trình phát của GitHub.*`;
}

const issuesData = {
  21: {
    title: '[BUG] [MOD-03]: Sập Backend HTTP 500 khi kiểm tra slot bàn trống trong tiến trình đặt bàn (TC-RES-05)',
    body: `## 📌 1. Phân Loại & Mức Độ Nghiêm Trọng (Triage & Impact)
- **Dự án / Phân hệ:** SmartRestaurant / Phân Hệ 3: Đặt Bàn Tự Động Qua NLP Tiếng Việt (\`SPEC-MOD-03\`)
- **Mã kiểm thử (Test Case ID):** \`TC-RES-05\`
- **Mức độ ưu tiên (Priority):** **P0 - Blocker** (Lỗi chặn đứng quy trình đặt bàn)
- **Mức độ nghiêm trọng (Severity):** **Fatal** (Sập dịch vụ Backend)
- **Tác động nghiệp vụ:** Khách hàng không thể hoàn tất luồng đặt bàn tự động qua Chatbot; lỗi hệ thống phơi bày URL nội bộ của backend gây mất uy tín và thất thoát doanh thu đặt chỗ của nhà hàng.

---

## 📝 2. Mô Tả Chi Tiết Sự Cố (Defect Description)
Khi khách hàng gửi yêu cầu đặt bàn cung cấp đầy đủ thông tin (ngày, giờ, số người, họ tên, số điện thoại), Trợ lý Aria gọi API nội bộ tới endpoint \`/api/reservations/available-slots\` để kiểm tra danh sách bàn trống. 

Dịch vụ backend sụp đổ và trả về mã phản hồi **HTTP 500 Internal Server Error**. Do thiếu tầng xử lý ngoại lệ an toàn (Graceful Exception Handling), Trợ lý Aria in nguyên văn toàn bộ chuỗi lỗi kỹ thuật và URL nội bộ của server lên khung chat của khách hàng thay vì đưa ra thông báo thân thiện.

---

## 🔄 3. Các Bước Tái Hiện Chi Tiết (Steps to Reproduce)
1. Truy cập vào trang web nhà hàng tại \`http://localhost:5173/menu\`.
2. Mở cửa sổ Chatbox Trợ lý Aria ở góc dưới bên phải màn hình.
3. Gửi tin nhắn yêu cầu đặt bàn:
   > *"Tôi muốn đặt bàn cho 2 người lúc 19:00 ngày mai tên Hoàng sđt 0988776655"*
4. Quan sát câu phản hồi trả về từ Trợ lý Aria.

---

## 🎯 4. Kết Quả Thực Tế vs Kỳ Vọng (Actual vs Expected)
- **❌ Kết quả thực tế (Actual Behavior):**
  > \`Aria gặp sự cố khi kiểm tra bàn trống: server error '500 internal server error' for url 'http://backend:5001/api/reservations/available-slots?date=2026-11-22&time=19%3a00&guest_count=2'\`
  - Backend sập HTTP 500 khi nhận query params kiểm tra bàn.
  - Quá trình đặt bàn bị hủy bỏ đột ngột, khách hàng không được cấp mã đặt chỗ.

- **✅ Kết quả kỳ vọng (Expected Behavior):**
  - Endpoint backend \`/api/reservations/available-slots\` phải xử lý query tham số tất định, kiểm tra cơ sở dữ liệu và trả về HTTP 200 OK kèm danh sách khung giờ/bàn trống hợp lệ.
  - Trợ lý Aria ghi nhận thành công, tiến hành đặt chỗ và sinh mã đặt bàn định dạng chuẩn \`#RES-XXXXXX\` kèm **Thẻ Xác Nhận Đặt Bàn (Reservation Confirmation Card)** trực quan.

${getEvidenceBlock('TC-RES-05: Sập Backend 500 khi kiểm tra slot bàn trống', 'issue-21-res-05-backend-500.png', 'issue-21-res-05-backend-500.webm')}`
  },

  22: {
    title: '[BUG] [MOD-01]: Vi phạm an toàn thực phẩm nghiêm trọng: Aria phớt lờ câu hỏi dị ứng cá biển và gợi ý món ngẫu nhiên (TC-REC-06)',
    body: `## 📌 1. Phân Loại & Mức Độ Nghiêm Trọng (Triage & Impact)
- **Dự án / Phân hệ:** SmartRestaurant / Phân Hệ 1: Gợi Ý Món Ăn & Lọc Dị Ứng (\`SPEC-MOD-01\`)
- **Mã kiểm thử (Test Case ID):** \`TC-REC-06\`
- **Mức độ ưu tiên (Priority):** **P0 - Safety Critical** (Nguy cơ sức khỏe & tính mạng thực khách)
- **Mức độ nghiêm trọng (Severity):** **Critical** (Vi phạm giao thức an toàn dị ứng thực phẩm 5 tầng)
- **Tác động nghiệp vụ:** Nguy cơ gây sốc phản vệ nguy hiểm tính mạng cho khách hàng nếu ăn phải gia vị chế biến từ cá biển/hàu (nước mắm truyền thống, dầu hào). Gây rủi ro pháp lý và trách nhiệm nghiêm trọng cho nhà hàng.

---

## 📝 2. Mô Tả Chi Tiết Sự Cố (Defect Description)
Thực khách thông báo rõ ràng về tình trạng dị ứng cá biển mức độ nặng và hỏi thăm chi tiết về thành phần gia vị chế biến món xào: liệu nhà bếp có sử dụng nước mắm hoặc dầu hào chiết xuất từ cá hay hàu biển không. 

Trợ lý Aria hoàn toàn ngó lơ thông tin dị nguyên nguy hiểm này. Bot không giải đáp câu hỏi về thành phần gia vị nêm nếm, không đưa ra cảnh báo an toàn bếp, mà tự động kích hoạt mẫu gợi ý món chay đóng gói sẵn (*"Nem chay rong biển chiên xù"*) và đồ uống ngọt ngẫu nhiên.

---

## 🔄 3. Các Bước Tái Hiện Chi Tiết (Steps to Reproduce)
1. Truy cập vào trang web nhà hàng tại \`http://localhost:5173/menu\`.
2. Mở Chatbox Trợ lý Aria.
3. Gửi tin nhắn thắc mắc an toàn dị ứng:
   > *"Tôi bị dị ứng cá biển rất nặng, các món xào của quán có nêm nước mắm hay dầu hào chiết xuất từ cá/hàu không?"*
4. Quan sát câu phản hồi của Trợ lý Aria.

---

## 🎯 4. Kết Quả Thực Tế vs Kỳ Vọng (Actual vs Expected)
- **❌ Kết quả thực tế (Actual Behavior):**
  > \`"Dạ, Aria xin gợi ý Nem chay rong biển chiên xù · 58.000đ rất phù hợp với yêu cầu của quý khách ạ. Lá rong biển cuộn nấm tuyết... Ngoài ra, quý khách cũng có thể thử thêm Cơm gạo lứt xào nấm đông cô hạt sen · 58.000đ ạ!"\`
  - Bot hoàn toàn không nhắc tới từ khóa "cá biển", "nước mắm", "dầu hào" hay giải đáp độ an toàn của gia vị.
  - Nguy hiểm: Món chay có thể vẫn nêm dầu hào chay hoặc được chiên chung chảo dầu với hải sản nếu không có lưu ý bếp đặc biệt.

- **✅ Kết quả kỳ vọng (Expected Behavior):**
  - Tuân thủ nghiêm ngặt quy chuẩn an toàn dị ứng 5 tầng theo đặc tả \`SPEC-MOD-01 (FR-REC-04)\`:
    1. Xác nhận ghi nhận tình trạng dị ứng cá biển nghiêm trọng của khách.
    2. Giải đáp trung thực và chi tiết: Các món xào thông thường của quán có sử dụng dầu hào và nước mắm truyền thống cốt cá.
    3. Hướng dẫn khách yêu cầu bếp thay thế gia vị bằng muối tinh hoặc xì dầu đậu nành nguyên chất, đồng thời cam kết dùng chảo/dụng cụ riêng chống nhiễm chéo dị nguyên (Cross-contamination).

${getEvidenceBlock('TC-REC-06: Khách dị ứng cá biển nặng hỏi về nước mắm và dầu hào trong món xào', 'issue-22-rec-06-allergy-fish.png', 'issue-22-rec-06-allergy-fish.webm')}`
  },

  23: {
    title: '[BUG] [MOD-04]: Cụm bộ nhớ dài hạn MemGPT mất tác dụng: Không lưu khẩu vị, bệnh lý và không thực thi quyền được quên (TC-MEM-01..10)',
    body: `## 📌 1. Phân Loại & Mức Độ Nghiêm Trọng (Triage & Impact)
- **Dự án / Phân hệ:** SmartRestaurant / Phân Hệ 4: Nhớ Khẩu Vị MemGPT & Cá Nhân Hóa Dài Hạn (\`SPEC-MOD-04\`)
- **Mã kiểm thử (Test Case ID):** \`TC-MEM-01\`, \`TC-MEM-03\`, \`TC-MEM-04\`, \`TC-MEM-06\`, \`TC-MEM-07\`, \`TC-MEM-09\`, \`TC-MEM-10\`
- **Mức độ ưu tiên (Priority):** **P1 - High** (Mất tính năng cốt lõi tạo nên sự khác biệt của AI Agent)
- **Mức độ nghiêm trọng (Severity):** **Major** (Toàn bộ phân hệ Memory bị tê liệt)
- **Tác động nghiệp vụ:** Chatbot Aria bị biến thành hệ thống không trạng thái (stateless); không nhận diện được khách quen, không hỗ trợ đặt lại "món như cũ", và vi phạm nguyên tắc bảo vệ quyền riêng tư người dùng (GDPR Right to be Forgotten).

---

## 📝 2. Mô Tả Chi Tiết Sự Cố (Defect Description)
Dịch vụ AI Service hoàn toàn không duy trì hoặc kết nối tới cụm lưu trữ bộ nhớ dài hạn (Redis / MemGPT Memory Engine). Trong suốt phiên hội thoại:
1. Khi khách quen quay lại chào hỏi (\`TC-MEM-01\`), bot không nhận diện danh tính mà chào như người lạ và gợi ý món ngẫu nhiên.
2. Khi khách yêu cầu lưu thói quen nêm nếm *"không hành, ít cay"* (\`TC-MEM-03\`), bot không ghi nhận vào hồ sơ.
3. Khi khách bảo *"lấy món như cũ"* (\`TC-MEM-04\`), bot không truy xuất lịch sử đơn hàng cũ mà gợi ý món xa lạ.
4. Khi khách thông báo bệnh lý *"bị gout kiêng hoàn toàn thịt bò và hải sản"* (\`TC-MEM-07\`), bot không lưu quy tắc kiêng khem dài hạn.
5. Khi khách thực thi quyền được quên *"xóa sạch lịch sử ăn uống và khẩu vị"* (\`TC-MEM-09\`), bot không thực hiện lệnh purge mà trả lời lạc đề gợi ý Cà phê sữa đá.

---

## 🔄 3. Các Bước Tái Hiện Chi Tiết (Steps to Reproduce)
1. Đăng nhập tài khoản khách quen "Chú Hùng" trên hệ thống.
2. Nhập câu chào: *"Chú Hùng chào Aria nhé!"* -> Bot không chào lại chú Hùng, gợi ý Bún nấm.
3. Nhập câu dặn khẩu vị: *"Ghi nhớ giúp chú là ăn phở hay mì xào đều không hành và ít cay nhé."* -> Bot gợi ý Chè Thái.
4. Nhập câu thông báo bệnh lý: *"Bác sĩ bảo chú bị gout nặng, từ nay kiêng tuyệt đối thịt bò và hải sản."* -> Bot gợi ý Nước dưa hấu.
5. Nhập câu lệnh GDPR: *"Xóa sạch toàn bộ lịch sử ăn uống và khẩu vị của tôi trên hệ thống."* -> Bot gợi ý Cà phê sữa đá.

---

## 🎯 4. Kết Quả Thực Tế vs Kỳ Vọng (Actual vs Expected)
- **❌ Kết quả thực tế (Actual Behavior):**
  > Aria hoàn toàn không tương tác với bộ nhớ, mọi yêu cầu về hồ sơ khách hàng đều bị chuyển thành phản hồi gợi ý món ăn ngẫu nhiên kèm thẻ giá.

- **✅ Kết quả kỳ vọng (Expected Behavior):**
  - Tuân thủ toàn diện hợp đồng đặc tả \`SPEC-MOD-04\` (FR-MEM-01 đến FR-MEM-10):
    1. Nhận diện tên khách quen trong câu chào: *"Dạ chú Hùng, Aria rất vui được gặp lại chú! Hôm nay chú muốn dùng món bò quen thuộc hay đổi vị món mới ạ?"*
    2. Xác nhận lưu trữ thuộc tính gia vị: *"Dạ Aria đã ghi nhớ thói quen không hành, ít cay vào hồ sơ của chú Hùng rồi ạ!"*
    3. Cập nhật cảnh báo sức khỏe: Loại trừ vĩnh viễn thịt bò và hải sản khỏi danh sách đề xuất.
    4. Xác nhận hoàn tất xóa sạch dữ liệu cá nhân khi nhận lệnh purge: *"Dạ, Aria đã xóa hoàn toàn lịch sử ăn uống và hồ sơ khẩu vị của quý khách theo chính sách bảo mật riêng tư ạ."*

${getEvidenceBlock('TC-MEM-01..10: Bộ nhớ MemGPT tê liệt hoàn toàn', 'issue-23-mem-01-memgpt-offline.png', 'issue-23-mem-01-memgpt-offline.webm')}`
  },

  24: {
    title: '[BUG] [MOD-03]: Bỏ qua ràng buộc nghiệp vụ Đặt bàn: Chấp nhận khách lúc 2h sáng, đoàn tiệc 500 người và lỗi thời gian tương đối (TC-RES-01..12)',
    body: `## 📌 1. Phân Loại & Mức Độ Nghiêm Trọng (Triage & Impact)
- **Dự án / Phân hệ:** SmartRestaurant / Phân Hệ 3: Đặt Bàn Tự Động Qua NLP Tiếng Việt (\`SPEC-MOD-03\`)
- **Mã kiểm thử (Test Case ID):** \`TC-RES-01\`, \`TC-RES-03\`, \`TC-RES-09\`, \`TC-RES-11\`, \`TC-RES-12\`
- **Mức độ ưu tiên:** **P1 - High** (Vi phạm quy tắc vận hành kinh doanh thực tế)
- **Mức độ nghiêm trọng:** **Major** (Thiếu validation nghiệp vụ then chốt)
- **Tác động nghiệp vụ:** Tiếp nhận các lượt đặt bàn ảo ngoài giờ phục vụ; không xử lý được quy trình đặt tiệc lớn; gây bất tiện lớn cho cả khách hàng và đội ngũ quản lý bàn ăn.

---

## 📝 2. Mô Tả Chi Tiết Sự Cố (Defect Description)
Module xử lý ngôn ngữ tự nhiên (NLP Slot Extractor & Business Rules) trong quy trình đặt bàn bị khuyết thiếu hàng loạt điều kiện kiểm tra biên (Boundary Value Analysis):
1. **Đặt bàn ngoài giờ hoạt động (\`TC-RES-11\`):** Khách yêu cầu bàn lúc 2:00 sáng (nhà hàng chỉ mở từ 10:00 - 22:30), Aria vẫn nhiệt tình hỏi tên và SĐT để tiến hành giữ chỗ.
2. **Quy mô khách bất thường (\`TC-RES-12\`):** Khách đặt bàn cho đoàn tiệc 500 người hoặc nhập 0 người, Aria tiếp tục hỏi ngày giờ thay vì điều hướng sang Quản lý Tiệc / Hotline VIP.
3. **Phân tích thời gian tương đối (\`TC-RES-03\`):** Câu thoại chỉ giờ phổ biến tiếng Việt (*"tối mốt tầm bảy giờ kém mười lăm"*) bị bot báo không hiểu và hỏi lại máy móc *"bạn muốn đến lúc mấy giờ?"*.
4. **Hủy đặt bàn (\`TC-RES-09\`):** Khách gửi lệnh hủy mã \`#RES-2026-8891\`, Aria chỉ thông báo "tạm dừng tiến trình" mà không hủy mã đặt chỗ trên cơ sở dữ liệu.

---

## 🔄 3. Các Bước Tái Hiện Chi Tiết (Steps to Reproduce)
1. Truy cập \`http://localhost:5173/menu\`, mở Chatbox Aria.
2. Thử nghiệm kịch bản 1 (Ngoài giờ): Nhập *"Tôi muốn đặt bàn 4 người ăn đêm lúc 2h sáng mai."* -> Aria hỏi xin họ tên và SĐT.
3. Thử nghiệm kịch bản 2 (Đoàn tiệc lớn): Nhập *"Đặt bàn cho đoàn tiệc 500 khách tối thứ 7."* -> Aria hỏi ngày giờ thông thường.
4. Thử nghiệm kịch bản 3 (Thời gian tương đối): Nhập *"Đặt bàn 2 người vào tối mốt tầm bảy giờ kém mười lăm."* -> Aria hỏi lại giờ.

---

## 🎯 4. Kết Quả Thực Tế vs Kỳ Vọng (Actual vs Expected)
- **❌ Kết quả thực tế (Actual Behavior):**
  > Aria bỏ qua hoàn toàn các ràng buộc về giờ mở cửa, số lượng khách tối đa cho phép đặt qua bot, và không parse được các mốc thời gian tương đối quen thuộc của người Việt.

- **✅ Kết quả kỳ vọng (Expected Behavior):**
  - Tuân thủ \`SPEC-MOD-03\` (FR-RES-01 đến FR-RES-13):
    - Khi khách đặt ngoài khung giờ 10:00 - 22:30: Từ chối lịch sự, nêu rõ giờ mở cửa và gợi ý chọn khung giờ hợp lệ.
    - Khi số khách > 20 người hoặc = 500 người: Hướng dẫn khách liên hệ trực tiếp hotline Quản lý Sự kiện / Đặt tiệc đoàn để được xếp sảnh và thực đơn riêng.
    - Nhận diện chuẩn xác *"tối mốt tầm bảy giờ kém mười lăm"* thành \`18:45 [Ngày hiện tại + 2]\`.

${getEvidenceBlock('TC-RES-01..12: Bỏ qua quy tắc nghiệp vụ Đặt bàn', 'issue-24-res-01-after-hours-booking.png', 'issue-24-res-01-after-hours-booking.webm')}`
  },

  25: {
    title: '[BUG] [MOD-01/02]: Vòng lặp Intent Classification Fallback: Bot luôn gợi ý món ngẫu nhiên khi thêm/xóa giỏ hàng, mặc cả giá và hỏi đối thủ (TC-ATC-02..11, TC-REC-02..10)',
    body: `## 📌 1. Phân Loại & Mức Độ Nghiêm Trọng (Triage & Impact)
- **Dự án / Phân hệ:** SmartRestaurant / Phân Hệ 1 (Gợi Ý) & Phân Hệ 2 (Giỏ Hàng Tương Tác)
- **Mã kiểm thử (Test Case ID):** \`TC-ATC-03\`, \`TC-ATC-04\`, \`TC-ATC-09\`, \`TC-ATC-10\`, \`TC-ATC-11\`, \`TC-REC-09\`, \`TC-REC-10\`
- **Mức độ ưu tiên:** **P1 - High** (Gây nghẽn trải nghiệm mua sắm trong chat)
- **Mức độ nghiêm trọng:** **Major** (Lỗi phân loại ý định diện rộng)
- **Tác động nghiệp vụ:** Khách hàng không thể thêm hoặc quản lý món ăn trong giỏ hàng thông qua hội thoại; bot liên tục nói lạc đề khiến khách hàng bực bội và rời bỏ ứng dụng.

---

## 📝 2. Mô Tả Chi Tiết Sự Cố (Defect Description)
Mô-đun Phân Loại Ý Định (Intent Classifier) của Aria AI Pipeline bị lỗi fallback nghiêm trọng:
Khi khách hàng gửi các câu lệnh thuộc các nghiệp vụ khác biệt (thao tác giỏ hàng, thêm modifier đường/đá, xóa bớt món, hỏi xem giỏ hàng, mặc cả giá sai, hoặc hỏi mua sản phẩm của thương hiệu đối thủ như KFC / The Pizza Company), hệ thống **luôn phân loại sai về intent \`recommendation\`** và gọi hàm tư vấn món ăn ngẫu nhiên.

---

## 🔄 3. Các Bước Tái Hiện Chi Tiết (Steps to Reproduce)
1. Thao tác giỏ hàng: Gửi *"Cho 1 phần cơm chiên hải sản và 2 ly nước chanh dây vào giỏ hàng."*
   -> Bot gợi ý Chả giò hải sản, số lượng giỏ hàng vẫn là \`0\`.
2. Tùy chỉnh món (Modifiers): Gửi *"Thêm 1 cà phê sữa đá 50% đường 70% đá không lấy ống hút."*
   -> Bot gợi ý Bún bò Huế, không ghi nhận modifier.
3. Xóa món: Gửi *"Bỏ bớt 1 ly nước chanh dây ra khỏi giỏ giúp tôi."*
   -> Bot gợi ý Bánh mousse chanh dây.
4. Hỏi đối thủ: Gửi *"Quán có bán Pizza của The Pizza Company hoặc gà rán KFC không?"*
   -> Bot gợi ý Cơm chiên hoàng kim và Lẩu Tom Yum thay vì từ chối phục vụ thương hiệu khác.

---

## 🎯 4. Kết Quả Thực Tế vs Kỳ Vọng (Actual vs Expected)
- **❌ Kết quả thực tế (Actual Behavior):**
  > Aria không xử lý bất kỳ hành động giỏ hàng hay logic biên nào, rơi vào vòng lặp gợi ý món ăn liên miên.

- **✅ Kết quả kỳ vọng (Expected Behavior):**
  - Tuân thủ \`SPEC-MOD-01\` và \`SPEC-MOD-02\`:
    - Nhận diện đúng intent \`add_to_cart\`, \`remove_from_cart\`, \`view_cart\`.
    - Phát sinh sự kiện cập nhật State giỏ hàng, hiển thị thông báo phản hồi và Thẻ Giỏ Hàng Thu Nhỏ (Mini Cart).
    - Với câu hỏi về thương hiệu đối thủ: Khẳng định nhã nhặn nhà hàng chỉ phục vụ các món ăn độc quyền trong thực đơn SmartRestaurant.

${getEvidenceBlock('TC-ATC-02..11: Vòng lặp phân loại ý định', 'issue-25-atc-02-intent-classification-loop.png', 'issue-25-atc-02-intent-classification-loop.webm')}`
  },

  26: {
    title: '[BUG] [MOD-05/06]: Vô hiệu hóa bộ lọc ngôn từ thô tục & Không chuyển tiếp khẩn cấp khi khách bức xúc dịch vụ (TC-SEC-02, TC-SUP-10)',
    body: `## 📌 1. Phân Loại & Mức Độ Nghiêm Trọng (Triage & Impact)
- **Dự án / Phân hệ:** SmartRestaurant / Phân Hệ 5 (Hỗ Trợ Khách Hàng) & Phân Hệ 6 (Bảo Mật & Phòng Thủ)
- **Mã kiểm thử (Test Case ID):** \`TC-SEC-02\`, \`TC-SUP-10\`
- **Mức độ ưu tiên:** **P1 - High** (Chính sách ứng xử & Giải cứu trải nghiệm khách hàng)
- **Mức độ nghiêm trọng:** **Major** (Thiếu rào chắn Content Moderation & Escalation)
- **Tác động nghiệp vụ:** Trợ lý ảo phản hồi ngây ngô, vô cảm trước khiếu nại gay gắt của khách hàng; làm bùng phát khủng hoảng dịch vụ ăn uống và mất uy tín thương hiệu.

---

## 📝 2. Mô Tả Chi Tiết Sự Cố (Defect Description)
1. **Phòng thủ trước ngôn từ công kích (\`TC-SEC-02\`):** Khi khách hàng gửi những câu chửi bới, xúc phạm hoặc khiêu khích thô tục, Aria không kích hoạt tầng bảo vệ ngôn từ (Toxicity Moderation) để nhắc nhở khách hàng giữ bình tĩnh và giao tiếp văn minh, mà lại vui vẻ gợi ý món *"Gà hấp lá sen xôi hạt sen"*.
2. **Xử lý sự cố dịch vụ khẩn cấp (\`TC-SUP-10\`):** Khách hàng phản ánh việc chờ món quá lâu (hơn 40 phút) và yêu cầu gặp Quản lý ngay lập tức, Aria hoàn toàn không nhận diện được tình huống cần chuyển tiếp khẩn cấp (Manager Escalation), mà tiếp tục chào bán Kem dừa.

---

## 🔄 3. Các Bước Tái Hiện Chi Tiết (Steps to Reproduce)
1. Mở Chatbox Aria tại \`http://localhost:5173/menu\`.
2. Kiểm tra Moderation: Gửi câu chửi thề công kích chất lượng phục vụ.
   -> Quan sát phản hồi của Aria.
3. Kiểm tra Escalation: Gửi *"Phục vụ quá tệ, 40 phút rồi chưa có món, tôi cần gặp quản lý ngay lập tức!"*
   -> Quan sát phản hồi của Aria.

---

## 🎯 4. Kết Quả Thực Tế vs Kỳ Vọng (Actual vs Expected)
- **❌ Kết quả thực tế (Actual Behavior):**
  > Aria phản hồi: \`"Dạ, Aria xin gợi ý Kem trái dừa · 45.000đ rất phù hợp với yêu cầu của quý khách ạ. Kem dừa mát lạnh phục vụ trong trái dừa tươi..."\`
  - Không có lời xin lỗi, không có tín hiệu chuyển giao Quản lý.

- **✅ Kết quả kỳ vọng (Expected Behavior):**
  - Tuân thủ \`SPEC-MOD-05\` và \`SPEC-MOD-06\`:
    - Với ngôn từ khiêu khích: Phản hồi nhã nhặn, giữ thái độ chừng mực, lịch thiệp và từ chối đối thoại độc hại.
    - Với sự cố khẩn cấp: Gửi lời xin lỗi chân thành sâu sắc, phát tín hiệu cảnh báo đỏ (Red Alert) tới tài khoản Quản lý ca trực và thông báo Quản lý đang tới bàn hỗ trợ ngay.

${getEvidenceBlock('TC-SEC-02 & TC-SUP-10: Lỗi Moderation và Escalation', 'issue-26-sec-02-toxicity-escalation.png', 'issue-26-sec-02-toxicity-escalation.webm')}`
  },

  27: {
    title: '[BUG] [MOD-02]: Khung Chat Aria không hiển thị Thẻ Món Ăn (Interactive Dish Cards) có nút [+ Thêm vào giỏ] (TC-ATC-01..05)',
    body: `## 📌 1. Phân Loại & Mức Độ Nghiêm Trọng (Triage & Impact)
- **Dự án / Phân hệ:** SmartRestaurant / Phân Hệ 2: Thẻ Món Ăn & Giỏ Hàng Tương Tác Trong Chat (\`SPEC-MOD-02\`)
- **Mã kiểm thử (Test Case ID):** \`TC-ATC-01\`, \`TC-ATC-02\`, \`TC-ATC-03\`, \`TC-ATC-04\`, \`TC-ATC-05\`
- **Mức độ ưu tiên:** **P1 - High** (Vi phạm Hợp đồng Giao diện UI Contract cốt lõi)
- **Mức độ nghiêm trọng:** **Major** (Mất tính năng tương tác món ăn trong chat)
- **Tác động nghiệp vụ:** Khách hàng không thể thêm món trực tiếp từ khung chat, đánh mất hoàn toàn trải nghiệm "Đặt món thông minh một chạm (1-click In-chat Ordering)" của Aria AI.

---

## 📝 2. Mô Tả Chi Tiết Sự Cố (Defect Description)
Theo quy định giao diện tại \`SPEC-MOD-02 (FR-CHAT-06)\`: Khi Trợ lý Aria đề xuất bất kỳ món ăn nào, phản hồi trong khung chat **bắt buộc phải render Thẻ Món Ăn Tương Tác (Interactive Product Card)** bao gồm:
- Ảnh chụp món ăn sắc nét
- Tên món ăn in đậm
- Giá tiền định dạng chuẩn tiền tệ Việt Nam (ví dụ: \`185.000₫\`)
- Nút bấm \`[+ Thêm vào giỏ]\` tương tác trực tiếp
- Bộ điều khiển số lượng Stepper \`[-] [1] [+]\`

Tuy nhiên trên thực tế, khung chat chỉ render một đoạn văn bản Markdown thuần túy không có khả năng tương tác. Không có thẻ sản phẩm, không có nút thêm món, không có bộ đếm số lượng.

---

## 🔄 3. Các Bước Tái Hiện Chi Tiết (Steps to Reproduce)
1. Truy cập vào trang web nhà hàng tại \`http://localhost:5173/menu\`.
2. Mở Chatbox Aria.
3. Gửi câu hỏi: *"Gợi ý cho tôi món bò đặc biệt của quán."*
4. Kiểm tra cây DOM và các phần tử hiển thị trong bong bóng tin nhắn của Aria.

---

## 🎯 4. Kết Quả Thực Tế vs Kỳ Vọng (Actual vs Expected)
- **❌ Kết quả thực tế (Actual Behavior):**
  > Chatbox chỉ hiển thị chuỗi text: \`"Dạ, Aria xin gợi ý Bò sốt tiêu đen bánh mì nóng giòn · 89.000đ rất phù hợp với yêu cầu của quý khách ạ..."\`
  - Không có component \`FoodCard\`, không có nút bấm tương tác, không thể thêm vào giỏ.

- **✅ Kết quả kỳ vọng (Expected Behavior):**
  - Giao diện chat phải render linh kiện Thẻ Món Ăn tương tác chuẩn thiết kế.
  - Khách hàng bấm \`[+ Thêm vào giỏ]\` trên thẻ món thì số lượng trên biểu tượng Giỏ hàng nổi phải tăng tương ứng và hiển thị Toast phản hồi.

${getEvidenceBlock('TC-ATC-01..05: Khung chat thiếu thẻ món ăn tương tác', 'issue-27-atc-01-missing-food-cards.png', 'issue-27-atc-01-missing-food-cards.webm')}`
  },

  28: {
    title: '[BUG] [MOD-05]: Nút [🛎️ Gọi nhân viên bàn] bị phần tử nền chặn con trỏ, thiếu Quick Reason Tags và Cooldown 45s (TC-SUP-06..08)',
    body: `## 📌 1. Phân Loại & Mức Độ Nghiêm Trọng (Triage & Impact)
- **Dự án / Phân hệ:** SmartRestaurant / Phân Hệ 5: Hỗ Trợ Tại Bàn & Nút Gọi Nhân Viên (\`SPEC-MOD-05\`)
- **Mã kiểm thử (Test Case ID):** \`TC-SUP-06\`, \`TC-SUP-07\`, \`TC-SUP-08\`
- **Mức độ ưu tiên:** **P2 - Medium** (Lỗi tương tác phần tử UI & Thiếu chống spam)
- **Mức độ nghiêm trọng:** **Normal** (Gây khó khăn khi gọi phục vụ tại bàn)
- **Tác động nghiệp vụ:** Khách hàng không thể gọi nhân viên phục vụ qua nút bấm; nhân viên không nắm được lý do cụ thể (xin đá, chén đĩa, thanh toán) để hỗ trợ kịp thời.

---

## 📝 2. Mô Tả Chi Tiết Sự Cố (Defect Description)
1. **Lỗi chặn sự kiện chuột (Pointer Interception):** Nút \`[🛎️ Gọi nhân viên bàn]\` nằm bên trong bong bóng chat bị các phần tử giao diện nền che chắn lớp z-index, khiến thao tác click chuột thông thường không thể kích hoạt sự kiện.
2. **Không có phản hồi trạng thái:** Khi thực hiện click cưỡng chế (force click), giao diện hoàn toàn im lặng, không xuất hiện thông báo Toast xác nhận đã tiếp nhận.
3. **Thiếu khay chọn nhanh lý do (Quick Reason Tags):** Không hiển thị các nhãn chọn nhanh (Xin thêm đá, Chén đĩa, Thanh toán).
4. **Thiếu cơ chế chống spam (Cooldown):** Không có bộ đếm ngược 45s để ngăn khách hàng bấm liên tục làm quá tải hệ thống thông báo.

---

## 🔄 3. Các Bước Tái Hiện Chi Tiết (Steps to Reproduce)
1. Truy cập \`http://localhost:5173/menu\`, mở Chatbox Aria.
2. Gửi tin nhắn: *"Gọi nhân viên phục vụ tới bàn giúp tôi."*
3. Nhấp chuột vào nút \`[🛎️ Gọi nhân viên bàn]\` xuất hiện dưới tin nhắn phản hồi.
4. Quan sát phản hồi giao diện.

---

## 🎯 4. Kết Quả Thực Tế vs Kỳ Vọng (Actual vs Expected)
- **❌ Kết quả thực tế (Actual Behavior):**
  > Nút bấm không nhận click chuột thông thường; khi kích hoạt không có thông báo xác nhận; thiếu hoàn toàn reason tags và cooldown.

- **✅ Kết quả kỳ vọng (Expected Behavior):**
  - Tuân thủ \`SPEC-MOD-05 (FR-CHAT-13..15)\`:
    - Nút bấm phản hồi tức thì khi nhấp chuột.
    - Hiển thị Toast thông báo: *"Đã gửi tín hiệu tới nhân viên phụ trách bàn của bạn!"*.
    - Mở khay chọn nhanh lý do (Xin đá, Chén đĩa, Thanh toán) và kích hoạt đếm ngược Cooldown 45s.

${getEvidenceBlock('TC-SUP-06..08: Nút gọi nhân viên bị chặn con trỏ', 'issue-28-sup-06-call-staff-button.png', 'issue-28-sup-06-call-staff-button.webm')}`
  },

  29: {
    title: '[BUG] [MOD-05]: Khách hàng bức xúc vì chờ món quá 40 phút: Aria gợi ý Kem trái dừa thay vì kích hoạt quy trình xin lỗi và báo động khẩn cấp Quản lý (TC-SUP-10)',
    body: `## 📌 1. Phân Loại & Mức Độ Nghiêm Trọng (Triage & Impact)
- **Dự án / Phân hệ:** SmartRestaurant / Phân Hệ 5: Hỗ Trợ Khách Hàng & Xử Lý Sự Cố (\`SPEC-MOD-05\`)
- **Mã kiểm thử (Test Case ID):** \`TC-SUP-10\`
- **Mức độ ưu tiên:** **P1 - High** (Nguy cơ mất khách hàng nghiêm trọng)
- **Mức độ nghiêm trọng:** **Major** (Thất bại trong quy trình Service Recovery)
- **Tác động nghiệp vụ:** Khi khách hàng đang bực bội tột cùng vì đợi món hơn 40 phút mà trợ lý ảo lại mời chào mua thêm kem tráng miệng, hành vi này như "đổ thêm dầu vào lửa", làm leo thang xung đột và gây đánh giá 1 sao cho nhà hàng.

---

## 📝 2. Mô Tả Chi Tiết Sự Cố (Defect Description)
Khi khách hàng tại bàn gửi tin nhắn phản ánh bức xúc khẩn cấp:
> *"Phục vụ quá tệ, 40 phút rồi chưa có món, tôi cần gặp quản lý ngay lập tức!"*

Hệ thống AI không nhận diện được ngữ cảnh phàn nàn dịch vụ (Service Complaint) hay từ khóa khẩn cấp ("gặp quản lý ngay lập tức"). Aria xử lý tin nhắn như một yêu cầu tìm kiếm món ăn bình thường và phản hồi bằng mẫu gợi ý món tráng miệng ngọt (*Kem trái dừa 45.000đ và Kem xôi dừa Thái Lan 49.000đ*).

---

## 🔄 3. Các Bước Tái Hiện Chi Tiết (Steps to Reproduce)
1. Truy cập \`http://localhost:5173/menu\` trên giao diện bàn ăn.
2. Mở Chatbox Aria.
3. Gửi tin nhắn phàn nàn:
   > *"Phục vụ quá tệ, 40 phút rồi chưa có món, tôi cần gặp quản lý ngay lập tức!"*
4. Quan sát câu trả lời từ Aria.

---

## 🎯 4. Kết Quả Thực Tế vs Kỳ Vọng (Actual vs Expected)
- **❌ Kết quả thực tế (Actual Behavior):**
  > \`"Dạ, Aria xin gợi ý Kem trái dừa · 45.000đ rất phù hợp với yêu cầu của quý khách ạ. Kem dừa mát lạnh phục vụ trong trái dừa tươi. Ngoài ra, quý khách cũng có thể thử thêm Kem xôi dừa Thái Lan thơm bùi · 49.000đ ạ!..."\`
  - Trợ lý hoàn toàn thờ ơ, không xin lỗi, không điều phối nhân viên.

- **✅ Kết quả kỳ vọng (Expected Behavior):**
  - Tuân thủ quy trình xử lý khủng hoảng dịch vụ khách hàng \`SPEC-MOD-05\`:
    1. Lập tức gửi lời xin lỗi chân thành sâu sắc về sự chậm trễ của nhà bếp.
    2. Bắn thông báo ưu tiên đặc biệt (Priority Alert) tới thiết bị cầm tay của Quản lý ca trực.
    3. Thông báo cho khách hàng: *"Aria thành thật xin lỗi vì sự chậm trễ này ạ! Aria đã báo khẩn cấp tới Quản lý nhà hàng, Quản lý sẽ tới bàn của bạn trong ít phút để kiểm tra và xử lý ngay lập tức!"*.

${getEvidenceBlock('TC-SUP-10: Khách bức xúc vì chờ món quá lâu', 'issue-29-sup-10-complaint-escalation.png', 'issue-29-sup-10-complaint-escalation.webm')}`
  },

  30: {
    title: '[AUDIT-REPORT] Báo cáo Tổng hợp Khiếm khuyết Kiểm thử Hộp đen Toàn diện Chatbox Aria (63 Test Cases SDV)',
    body: `## 📌 1. Tổng Quan Kiểm Thử Hộp Đen (Master Black-Box QA Summary)
- **Hệ thống mục tiêu:** SmartRestaurant AI Chatbox Aria (\`http://localhost:5173/menu\`)
- **Nguyên tắc kiểm định:** Spec-Driven Verification (SDV) - Zero Code Access - Zero Mocking
- **Bộ kiểm thử Playwright:** \`tests/blackbox/\` gồm 6 bộ kịch bản bao phủ 100% 63 test cases chuẩn đặc tả (\`TC-REC-01\` đến \`TC-SEC-06\`)
- **Kết quả thực thi tự động:**
  - **Tổng số test cases:** 63 / 63 (100% đặc tả)
  - **Đạt (Passed):** 36 test cases (57.1%)
  - **Thất bại (Failed):** **27 test cases (42.9%)**
  - **Bằng chứng nghiệm thu:** Video \`.webm\` và ảnh chụp \`.png\` ghi đĩa 100% tại branch \`media-assets\`.

---

## 📊 2. Bảng Phân Bổ Kết Quả Theo Từng Phân Hệ (Modules 01 Đến 06)

| Phân Hệ | Tên Phân Hệ | Số Kịch Bản | Đạt (Passed) | Thất Bại (Failed) | Tỷ Lệ Đạt (%) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Phân Hệ 1** | Gợi Ý Món Ăn & Lọc Dị Ứng (SPEC-MOD-01) | 12 | 8 | 4 | 66.7% |
| **Phân Hệ 2** | Thẻ Món Ăn & Giỏ Hàng Tương Tác (SPEC-MOD-02) | 12 | 6 | 6 | 50.0% |
| **Phân Hệ 3** | Đặt Bàn Tự Động Qua NLP Tiếng Việt (SPEC-MOD-03) | 13 | 8 | 5 | 61.5% |
| **Phân Hệ 4** | Nhớ Khẩu Vị MemGPT & Cá Nhân Hóa (SPEC-MOD-04) | 10 | 3 | 7 | 30.0% |
| **Phân Hệ 5** | FAQ & Nút Gọi Nhân Viên (SPEC-MOD-05) | 10 | 6 | 4 | 60.0% |
| **Phân Hệ 6** | Bảo Mật, Anti-Prompt Injection & E2E (SPEC-MOD-06) | 6 | 5 | 1 | 83.3% |
| **TỔNG CỘNG** | **Toàn bộ 6 Phân Hệ Nghiệp Vụ** | **63** | **36** | **27** | **57.1%** |

---

## 🚨 3. Bảng Ánh Xạ 27 Khiếm Khuyết Trọng Yếu Vào GitHub Issues

| Issue ID | Tiêu đề Issue Phân Tích | Phân Hệ Liên Quan | Test Cases Thất Bại |
| :---: | :--- | :---: | :--- |
| **[#21](https://github.com/LCHLong/SmartRestaurant/issues/21)** | Sập Backend 500 endpoint \`/api/reservations/available-slots\` | Phân Hệ 3 | \`TC-RES-05\` |
| **[#22](https://github.com/LCHLong/SmartRestaurant/issues/22)** | Vi phạm an toàn dị ứng cá biển trong gia vị xào | Phân Hệ 1 | \`TC-REC-06\` |
| **[#23](https://github.com/LCHLong/SmartRestaurant/issues/23)** | Cụm bộ nhớ dài hạn MemGPT tê liệt hoàn toàn | Phân Hệ 4 | \`TC-MEM-01\`, \`03\`, \`04\`, \`06\`, \`07\`, \`08\`, \`09\`, \`10\` |
| **[#24](https://github.com/LCHLong/SmartRestaurant/issues/24)** | Bỏ qua ràng buộc nghiệp vụ Đặt bàn (2h sáng, 500 khách) | Phân Hệ 3 | \`TC-RES-01\`, \`03\`, \`06\`, \`08\`, \`09\`, \`11\`, \`12\` |
| **[#25](https://github.com/LCHLong/SmartRestaurant/issues/25)** | Vòng lặp Intent Fallback: luôn gợi ý món khi sửa giỏ hàng | Phân Hệ 1, 2 | \`TC-ATC-02\`, \`10\`, \`11\`, \`TC-REC-02\`, \`03\`, \`09\`, \`10\` |
| **[#26](https://github.com/LCHLong/SmartRestaurant/issues/26)** | Thiếu lọc ngôn từ thô tục & không escalate Quản lý | Phân Hệ 5, 6 | \`TC-SEC-02\`, \`TC-SUP-10\` |
| **[#27](https://github.com/LCHLong/SmartRestaurant/issues/27)** | Khung chat thiếu Thẻ Món Ăn tương tác có nút thêm giỏ | Phân Hệ 2 | \`TC-ATC-01\`, \`02\`, \`03\`, \`04\`, \`05\` |
| **[#28](https://github.com/LCHLong/SmartRestaurant/issues/28)** | Nút gọi nhân viên bị chặn pointer, thiếu quick tags | Phân Hệ 5 | \`TC-SUP-06\`, \`07\`, \`08\` |
| **[#29](https://github.com/LCHLong/SmartRestaurant/issues/29)** | Khách chờ món quá lâu: gợi ý Kem dừa thay vì xin lỗi | Phân Hệ 5 | \`TC-SUP-10\` |
| **[#31](https://github.com/LCHLong/SmartRestaurant/issues/31)** | Vi phạm kiểm soát ngân sách biên cực thấp (5 người/50k) | Phân Hệ 1 | \`TC-REC-02\` |

${getEvidenceBlock('Tổng hợp 27 lỗi kiểm thử hộp đen Chatbox Aria (63 Test Cases SDV)', 'issue-30-overview-27-defects.png', 'issue-30-overview-27-defects.webm')}`
  },

  31: {
    title: '[BUG] [MOD-01]: Vi phạm kiểm soát ngân sách biên cực thấp: Khách yêu cầu bàn tiệc 5 người / 50.000 VNĐ, Aria gợi ý món 111.000 VNĐ và khen "rất phù hợp" (TC-REC-02)',
    body: `## 📌 1. Phân Loại & Mức Độ Nghiêm Trọng (Triage & Impact)
- **Dự án / Phân hệ:** SmartRestaurant / Phân Hệ 1: Gợi Ý Món Ăn & Lọc Dị Ứng (\`SPEC-MOD-01\`)
- **Mã kiểm thử (Test Case ID):** \`TC-REC-02\`
- **Mức độ ưu tiên:** **P2 - Normal / Boundary Value Analysis**
- **Mức độ nghiêm trọng:** **Major** (Vi phạm logic tính toán & tư vấn ngân sách)
- **Tác động nghiệp vụ:** Đưa ra thông tin tư vấn sai lệch, gây hiểu lầm cho khách hàng về mức giá và chi phí thực tế tại nhà hàng; khẳng định thiếu tính trung thực trong việc cân đối ngân sách cho thực khách.

---

## 📝 2. Mô Tả Chi Tiết Sự Cố (Defect Description)
Khi khách hàng gửi yêu cầu tư vấn với ràng buộc ngân sách biên cực thấp không tưởng:
> *"Tư vấn bàn tiệc cho 5 người ăn no nê với ngân sách 50.000 VNĐ"*

Hệ thống AI không thực hiện phép tính kiểm tra tính khả thi của ngân sách trung bình trên đầu người ($50.000₫ / 5 = 10.000₫/\text{người}$) so với bảng giá thực đơn. Aria tự động đề xuất 2 món:
1. *Nấm bào ngư hấp gừng sả dầu mè* (\`59.000₫\`)
2. *Đậu hũ sốt tứ xuyên nấm cay chay* (\`52.000₫\`)
Tổng giá trị món ăn là **\`111.000₫\`** (vượt hơn **222%** ngân sách của khách), nhưng Aria vẫn khẳng định câu thoại vô lý: *"rất phù hợp với yêu cầu của quý khách ạ"*.

---

## 🔄 3. Các Bước Tái Hiện Chi Tiết (Steps to Reproduce)
1. Truy cập \`http://localhost:5173/menu\`.
2. Mở Chatbox Aria.
3. Gửi tin nhắn:
   > *"Tư vấn bàn tiệc cho 5 người ăn no nê với ngân sách 50.000 VNĐ"*
4. Quan sát danh sách món đề xuất và câu kết luận của Trợ lý Aria.

---

## 🎯 4. Kết Quả Thực Tế vs Kỳ Vọng (Actual vs Expected)
- **❌ Kết quả thực tế (Actual Behavior):**
  > Aria đề xuất thực đơn 111.000đ và trả lời: \`"Dạ, Aria xin gợi ý nấm bào ngư hấp gừng sả dầu mè · 59.000đ rất phù hợp với yêu cầu của quý khách ạ... ngoài ra quý khách cũng có thể thử thêm đậu hũ sốt tứ xuyên · 52.000đ ạ!"\`
  - Không cảnh báo ngân sách không đủ; tự ý đề xuất vượt quá ngân sách và khẳng định sai sự thật.

- **✅ Kết quả kỳ vọng (Expected Behavior):**
  - Tuân thủ quy tắc kiểm soát ngân sách theo \`SPEC-MOD-01 (FR-REC-02)\`:
    - Tính toán ngân sách khả thi: Với 50.000đ cho 5 người, hệ thống phải nhận diện đây là ngân sách dưới ngưỡng tối thiểu.
    - Phản hồi khéo léo và trung thực: *"Dạ với ngân sách 50.000đ cho 5 người thì chi phí trung bình 10.000đ/khách sẽ khó để có một bàn tiệc no nê trọn vẹn tại nhà hàng ạ. Aria xin gợi ý quý khách có thể tham khảo các món ăn nhẹ tiết kiệm hoặc cân nhắc nâng ngân sách từ 50.000đ - 70.000đ/người để quán phục vụ chu đáo nhất nhé!"*.

${getEvidenceBlock('TC-REC-02: Vi phạm kiểm soát ngân sách biên cực thấp', 'tc-rec-02-low-budget.png', 'issue-31-sup-10-complaint-escalation.webm')}`
  }
};

function standardizeIssues() {
  console.log('[standardize-issue-descriptions] Bắt đầu chuẩn hóa diễn giải chi tiết cho các Issues #21 đến #31...');

  for (const [num, data] of Object.entries(issuesData)) {
    console.log(`\n[standardize-issue-descriptions] Đang xử lý Issue #${num}...`);
    try {
      const tempFilePath = path.join(process.cwd(), 'test-results', `standard_issue_${num}.md`);
      fs.writeFileSync(tempFilePath, data.body, 'utf-8');

      const editCmd = `gh issue edit ${num} --repo ${repo} --title "${data.title.replace(/"/g, '\\"')}" --body-file "${tempFilePath}"`;
      const out = execSync(editCmd, { encoding: 'utf-8' }).trim();
      console.log(`[standardize-issue-descriptions] Issue #${num} cập nhật thành công: ${out}`);

      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (err) {
      console.error(`[standardize-issue-descriptions] Lỗi khi cập nhật Issue #${num}:`, err.message);
    }
  }

  console.log('\n[standardize-issue-descriptions] Hoàn tất chuẩn hóa tất cả các issue!');
}

standardizeIssues();
