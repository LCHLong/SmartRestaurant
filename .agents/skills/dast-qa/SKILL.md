---
name: dast-qa
description: Kỹ năng kiểm thử an ninh động (DAST) cho SmartRestaurant trên môi trường triển khai hoặc preview và tự động tạo GitHub Bug Issue qua gh-axi khi phát hiện lỗ hổng bảo mật.
---

# DAST QA & Security Testing Skill

Kỹ năng quét và kiểm thử an ninh động (DAST) cho hệ thống **SmartRestaurant** (Frontend Web, Backend API, AI Service).

> **Lưu ý phân định:** Kỹ năng này phụ trách an ninh hạ tầng, HTTP headers, rò rỉ dữ liệu nhạy cảm và quét lỗ hổng động. Toàn bộ kiểm thử tính năng nghiệp vụ, giá trị biên (BVA), kiểm thử phá hoại (Negative) và hành trình người dùng thuộc kỹ năng `qa-testing`.

---

## 1. Kiểm Tra Ban Đầu (Pre-flight Checks)
- Đảm bảo môi trường đích (target URL) đang hoạt động (ví dụ: `http://localhost:5173`, `http://localhost:3000`, hoặc preview URL).
- Đảm bảo đã cài đặt `gh-axi` để sẵn sàng tạo bug issue khi phát hiện lỗ hổng:
  ```bash
  npx -y gh-axi --version
  ```

---

## 2. Ma Trận Phân Loại Lỗ Hổng (Severity Matrix)

| Mức Độ | Mô Tả & Tiêu Chí | Hành Động Bắt Buộc |
| :--- | :--- | :--- |
| **CRITICAL** | Rò rỉ Secret / API Key / JWT Secret / Database Connection String trong client bundle hoặc response API; Lỗ hổng SQL/NoSQL Injection, RCE. | Dừng xuất xưởng ngay lập tức; Bắn cảnh báo khẩn cấp và tạo Bug Issue ưu tiên số 1. |
| **HIGH** | Rò rỉ Stack Trace chi tiết khi gặp lỗi 500/404; Thiếu kiểm thực quyền hạn (IDOR); Thiếu HSTS trên giao thức HTTPS; Lỗ hổng CORS quá mở (`Access-Control-Allow-Origin: *` kèm credentials). | Bắt buộc vá trước khi phát hành; Tạo Bug Issue gắn nhãn `security,priority-high`. |
| **MEDIUM** | Thiếu Content Security Policy (CSP), thiếu `X-Content-Type-Options: nosniff`, cookie xác thực thiếu cờ `HttpOnly` hoặc `Secure` / `SameSite`. | Tạo Bug Issue phân loại `security,medium`. |
| **LOW** | Lộ header nhận diện server (`X-Powered-By: Express`), thiếu `Referrer-Policy`. | Ghi nhận vào báo cáo an ninh định kỳ. |

---

## 3. Quy Trình Vận Hành (Operational Workflow)

### Bước 1: Kiểm Tra Headers An Ninh Cơ Bản (Security Headers Audit)
Sử dụng cURL để kiểm tra các HTTP headers an ninh trên endpoint đích:
```bash
curl -I -s http://localhost:5173 | grep -Ei "(strict-transport|content-security|x-content-type|x-frame|x-powered-by)"
```

### Bước 2: Kiểm Tra Rò Rỉ Dữ Liệu & Bundle Analysis
- Quét tìm xem client bundle có chứa biến môi trường nhạy cảm (`AI_API_KEY`, `MONGO_URI`, `JWT_SECRET`) hay không.
- Kiểm tra các endpoint trả về lỗi xem có lộ stack trace nội bộ hay không.

### Bước 3: Tạo GitHub Bug Issue Tự Động (Bilingual Song Ngữ)
Khi phát hiện lỗ hổng (từ MEDIUM trở lên), tạo issue qua `gh-axi`:
```bash
npx -y gh-axi issue create \
  --title "[BUG] [DAST]: <Tên lỗ hổng ngắn gọn>" \
  --body-file <path_to_issue_body.md> \
  --label "bug,security,dast"
```

---

## 4. Quy Tắc Bắt Buộc (Enforcement Rules)
1. **CẤM** bỏ qua bất kỳ lỗ hổng nào thuộc mức độ **CRITICAL** hoặc **HIGH**.
2. Mọi Bug Issue an ninh tạo ra phải có đầy đủ bằng chứng tái hiện: cURL command, URL, header/response vi phạm, và hướng khắc phục đề xuất.
