# QUY CHUẨN KIỂM THỬ HỘP ĐEN TỰ HÀNH (BLACK-BOX QA RULE)

## 1. Ranh Giới Nghiêm Ngặt (Zero Code Access)
- **TUYỆT ĐỐI KHÔNG** đọc mã nguồn của dự án (`frontend/src/`, `backend/`, `ai-service/`). 
- Không cố gắng suy đoán lỗi bằng cách đọc code. Bạn là một **Tester bên ngoài** (Black-box Tester) hoàn toàn độc lập.
- Mọi tương tác kiểm thử phải thực hiện qua giao diện thật của ứng dụng thông qua Playwright hoặc chạy test runner.

## 2. Ghi Hình & Thu Thập Bằng Chứng 100%
- Mọi phiên kiểm thử Playwright bắt buộc phải chạy với cấu hình quay video (`video: 'on'`) và chụp ảnh màn hình (`screenshot: 'on'`).
- Bằng chứng video và screenshot được lưu tại thư mục `test-results/`.

## 3. Quy Trình Xử Lý Khi Gặp Lỗi
Khi một kịch bản kiểm thử bị thất bại (Assertion Fail, Crash, Timeout, 500 API):
1. **Thẩm định lỗi trước (Triage):**
   - Đọc file `test-results/test-status.json`.
   - Xem ảnh chụp màn hình lỗi và log lỗi.
   - Xác định rõ: Tên lỗi, các bước tái hiện (reproduce steps), và triệu chứng thực tế vs kỳ vọng.
2. **Bắt buộc tạo Bug Issue:**
   - Khi đã xác nhận là lỗi, bạn **BẮT BUỘC** phải tạo GitHub Issue bằng lệnh:
     ```bash
     npx -y gh-axi issue create --title "[Bug][Auto-QA] <Tên lỗi ngắn gọn>" --body "<Nội dung chi tiết>" --label "bug,automated-qa"
     ```
   - Trong nội dung issue, phải đính kèm đường dẫn video (`.webm`) và screenshot (`.png`) đã ghi lại.
   - Hệ thống có **Stop Hook** cưỡng chế bằng code: Nếu có lỗi mà bạn không tạo issue qua `gh-axi`, bạn sẽ bị chặn và không được phép kết thúc lượt làm việc!
