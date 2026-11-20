---
name: bug-fixer
description: Kỹ năng tiếp nhận GitHub Bug Issues, phân tích nguyên nhân gốc dựa trên log lỗi/DAST/ảnh/video, viết mã vá lỗi, bổ sung kiểm thử hồi quy (regression tests) và mở PR liên kết đóng issue.
---

# Bug Fixer Skill

Quy trình tự động tiếp nhận và sửa chữa lỗi phần mềm từ GitHub Issues cho dự án **SmartRestaurant**.

---

## 1. Kiểm Tra Ban Đầu (Pre-flight Checks)
- Kiểm tra danh sách bug issues đang mở chưa có người xử lý trong repository:
  ```bash
  npx -y gh-axi issue list --label bug --state open
  ```
  *Lưu ý:* Bỏ qua các issue đã có nhãn `status: in-progress` hoặc `status: pr-submitted`.

---

## 2. Quy Trình Vận Hành (Operational Workflow)

### Bước 1: Tiếp Nhận Issue & Gắn Nhãn Trạng Thái
- Đọc chi tiết issue cần xử lý (mô tả, các bước tái hiện, ảnh chụp, video bằng chứng):
  ```bash
  npx -y gh-axi issue view <issue_number>
  ```
- Cập nhật nhãn để thông báo đang xử lý, tránh xung đột giữa các agent:
  ```bash
  npx -y gh-axi issue edit <issue_number> --add-label "status: in-progress"
  ```

### Bước 2: Phân Tích Nguyên Nhân Gốc (Root Cause Analysis)
- Đọc kỹ mô tả lỗi, error stack trace, log server, bằng chứng video (`.webm`) hoặc ảnh chụp (`.png`) trong `test-results/`.
- Xác định chính xác module hoặc phân hệ bị ảnh hưởng (`frontend`, `backend`, hoặc `ai-service`).

### Bước 3: Thực Thi Sửa Lỗi & Bổ Sung Regression Test
- Tiến hành sửa lỗi tại mã nguồn tương ứng.
- **BẮT BUỘC:** Viết bài kiểm tra mới trong `tests/` để chống tái diễn lỗi (Regression Testing).
- Bài test mới phải tái hiện lại kịch bản lỗi trước khi sửa và xác nhận thành công sau khi sửa.

### Bước 4: Nghiệm Thu Cơ Học
- Chạy toàn bộ các bài test để xác minh bản vá không làm hỏng tính năng khác:
  ```bash
  npm run test:blackbox
  ```

### Bước 5: Đóng Gói & Mở/Cập Nhật Pull Request
- Commit mã nguồn với cú pháp chuẩn:
  ```bash
  git add .
  git commit -m "fix(<scope>): <mô tả ngắn gọn> (Fixes #<issue_number>)"
  ```
- Mở hoặc cập nhật Pull Request. **BẮT BUỘC** phần mô tả PR phải chứa từ khóa `Fixes #<issue_number>` để GitHub tự động đóng Issue khi PR được duyệt và merge.

### Bước 6: Cập Nhật Nhãn Vòng Đời (Lifecycle Labeling)
- Chuyển trạng thái issue sang `status: pr-submitted`:
  ```bash
  npx -y gh-axi issue edit <issue_number> --remove-label "status: in-progress" --add-label "status: pr-submitted"
  ```
- **TUYỆT ĐỐI KHÔNG** đóng issue bằng lệnh thủ công (`npx -y gh-axi issue close`) khi PR chưa được merge, nhằm bảo toàn truy vết tiến độ kiểm định.

---

## 3. Quy Tắc Bắt Buộc (Enforcement Rules)
1. **CẤM** nhận lại issue đang có nhãn `status: in-progress` hoặc `status: pr-submitted`.
2. **CẤM** tự ý đóng issue thủ công trước khi PR được merge vào nhánh chính.
3. **BẮT BUỘC** liên kết PR với issue thông qua cú pháp chuẩn `Fixes #<issue_number>`.
4. Bản vá phải có ít nhất 1 bài regression test đi kèm và pass 100% test suite trước khi commit.
