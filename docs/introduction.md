# Giới thiệu & Hướng dẫn Cài đặt Dự án SmartRestaurant

## 1. Giới thiệu Tổng quan (System Overview)
**Smart Restaurant** là hệ thống gọi món tại bàn thông qua mã QR dành cho nhà hàng/quán ăn với mô hình phục vụ tại chỗ (**Dine-in**). Hệ thống giúp tối ưu hóa quy trình phục vụ từ lúc khách vào bàn, quét mã chọn món, gửi đơn đến bếp cho đến lúc thanh toán.

### Các tính năng chính:
- **Khách hàng (Customer)**: Quét QR tại bàn, xem menu trực quan, tùy chỉnh món (modifiers), đặt món, theo dõi trạng thái đơn theo thời gian thực và yêu cầu thanh toán.
- **Nhân viên phục vụ (Waiter)**: Nhận thông báo đơn hàng mới, duyệt đơn gửi xuống bếp, hỗ trợ gọi món và xác nhận thanh toán.
- **Bếp (Kitchen Display System - KDS)**: Xem danh sách món cần chế biến theo thứ tự ưu tiên, chuyển trạng thái món khi hoàn thành.
- **Quản trị viên (Admin/Super Admin)**: Quản lý danh mục, món ăn, sơ đồ bàn, tạo mã QR bàn, quản lý nhân viên và xem báo cáo thống kê doanh thu.

---

## 2. Yêu cầu Môi trường (Prerequisites)
Trước khi khởi chạy dự án, hãy đảm bảo máy tính đã cài đặt:
- [Node.js](https://nodejs.org/) (phiên bản 18.x trở lên khuyến nghị) & `npm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (đã được bật và đang chạy)

---

## 3. Hướng dẫn Khởi chạy Hệ thống (Local + Docker Redis)

Mô hình triển khai môi trường phát triển (Development):
- **Redis Server**: Chạy container độc lập thông qua **Docker**.
- **Backend (Node.js/Express)**: Chạy trực tiếp trên **Local máy host**.
- **Frontend (React + Vite)**: Chạy trực tiếp trên **Local máy host**.

```
┌─────────────────────────────────────────────────────────────┐
│                       MÁY HOST (LOCAL)                      │
│                                                             │
│  ┌──────────────────────┐        ┌───────────────────────┐  │
│  │       Frontend       │        │        Backend        │  │
│  │ (React/Vite : 5173)  │───────>│ (Node.js/Exp : 5001)  │  │
│  └──────────────────────┘        └───────────┬───────────┘  │
│                                              │              │
│                                    (redis://127.0.0.1:6379) │
│                                              │              │
│  ┌───────────────────────────────────────────▼───────────┐  │
│  │                    DOCKER ENGINE                      │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ Container: smart-restaurant-redis (Port 6379)   │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### Bước 1: Khởi động Redis Server bằng Docker

1. Mở ứng dụng **Docker Desktop** trên máy tính.
2. Mở Terminal tại thư mục gốc dự án `SmartRestaurant` và khởi chạy chỉ riêng container Redis:

```bash
# Cách 1: Sử dụng Docker Compose để chạy riêng dịch vụ Redis ngầm
docker compose up -d redis

# Cách 2: Chạy trực tiếp bằng lệnh docker run
docker run -d --name smart-restaurant-redis -p 6379:6379 redis:alpine
```

> **Kiểm tra trạng thái Redis:**
> ```bash
> docker ps
> ```
> Khi thấy container `smart-restaurant-redis` có trạng thái `Up` và cổng `0.0.0.0:6379->6379/tcp` là Redis đã sẵn sàng.

---

### Bước 2: Cài đặt & Chạy Backend (Local)

1. Mở một cửa sổ Terminal mới và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```

2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```

3. Kiểm tra file cấu hình môi trường `.env` trong thư mục `backend/`:
   Đảm bảo có biến `REDIS_URL` trỏ về Redis đang chạy trên Docker:
   ```env
   PORT=5001
   REDIS_URL=redis://127.0.0.1:6379
   FRONTEND_URL=http://localhost:5173
   # Các biến cấu hình Supabase, JWT, Mail, Google OAuth,...
   ```

4. Khởi chạy Backend ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   Khi terminal hiển thị:
   ```text
   Server running on port 5001
   ✅ Redis Connected
   ```
   nghĩa là backend đã kết nối thành công với Redis container.

---

### Bước 3: Cài đặt & Chạy Frontend (Local)

1. Mở một cửa sổ Terminal khác và di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```

2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```

3. Kiểm tra file cấu hình `.env` trong thư mục `frontend/` (nếu cần cấu hình Stripe Key, API URL,...).

4. Khởi chạy Frontend:
   ```bash
   npm run dev
   ```
   Mở trình duyệt và truy cập: **`http://localhost:5173`**

---

## 4. Các sự cố thường gặp & Cách xử lý

### 1. Lỗi `Redis Client Error Error: connect ECONNREFUSED 127.0.0.1:6379`
- **Nguyên nhân**: Container Redis trên Docker chưa được bật hoặc Docker Desktop chưa chạy.
- **Khắc phục**: Bật Docker Desktop và chạy lệnh `docker compose up -d redis` (hoặc `docker start smart-restaurant-redis`).
- **Chế độ chạy không cần Redis**: Bạn có thể tạm thời comment dòng `REDIS_URL` trong file `backend/.env` thành `# REDIS_URL=redis://127.0.0.1:6379`. Backend sẽ tự chuyển sang chế độ fallback hoạt động bình thường.

### 2. Lỗi cổng `5001` hoặc `5173` bị chiếm dụng (`address already in use`)
- **Nguyên nhân**: Đang có một tiến trình cũ chạy ngầm chiếm cổng.
- **Khắc phục**:
  ```bash
  # Tắt tiến trình chiếm cổng 5001 (macOS/Linux)
  lsof -ti:5001 | xargs kill -9

  # Tắt tiến trình chiếm cổng 5173 (macOS/Linux)
  lsof -ti:5173 | xargs kill -9
  ```
