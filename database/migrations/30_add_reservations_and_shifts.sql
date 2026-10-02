-- ==============================================================================
-- Migration 30: Add Reservations & Staff Shifts Tables (Phase 5 - Stage 1)
-- ==============================================================================
-- Mô tả:
-- 1. Bổ sung các bảng nghiệp vụ Đặt bàn trước (Table Reservation) với cơ chế
--    chống lỗi IDOR (booking_code), buffer 90 phút và gán bàn linh hoạt (Soft Reservation).
-- 2. Bổ sung các bảng Quản lý ca làm việc (Staff Shifts), Phân công lịch trực
--    (Shift Assignments), Điểm danh và Đổi ca (Shift Swap Requests).
-- ==============================================================================

-- 1. ĐỊNH NGHĨA CÁC KIỂU ENUM MỚI (NẾU CHƯA TỒN TẠI)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
        CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deposit_status') THEN
        CREATE TYPE deposit_status AS ENUM ('none', 'pending', 'paid', 'refunded');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_status') THEN
        CREATE TYPE shift_status AS ENUM ('scheduled', 'checked_in', 'checked_out', 'absent', 'swapped');
    END IF;
END $$;

-- 2. BẢNG ĐẶT BÀN TRƯỚC (reservations)
CREATE TABLE IF NOT EXISTS reservations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code      VARCHAR(20) UNIQUE NOT NULL, -- Mã đặt bàn ngẫu nhiên bí mật (chống quét IDOR)
    user_id           UUID REFERENCES users(id) ON DELETE SET NULL, -- Null nếu khách vãng lai đặt
    customer_name     VARCHAR(100) NOT NULL,
    customer_phone    VARCHAR(20) NOT NULL,
    customer_email    VARCHAR(100) DEFAULT NULL,
    table_id          UUID REFERENCES tables(id) ON DELETE SET NULL, -- Cho phép NULL ban đầu nếu chọn Soft Allocation
    guest_count       INT NOT NULL CHECK (guest_count > 0 AND guest_count <= 50),
    reservation_date  DATE NOT NULL,
    reservation_time  TIME NOT NULL,
    end_time          TIME NOT NULL,
    status            reservation_status DEFAULT 'pending',
    deposit_amount    NUMERIC(10, 2) DEFAULT 0 CHECK (deposit_amount >= 0),
    deposit_status    deposit_status DEFAULT 'none',
    payment_intent_id VARCHAR(255) DEFAULT NULL, -- Mã giao dịch Stripe/ZaloPay nếu có cọc
    special_requests  TEXT DEFAULT NULL,
    buffer_minutes    INT DEFAULT 90, -- Khung thời gian dùng bữa đệm chống lấn giờ
    cancellation_reason TEXT DEFAULT NULL,
    idempotency_key   VARCHAR(36) UNIQUE DEFAULT NULL, -- UUIDv4 từ client, chống double-submit
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE reservations IS 'Bảng lưu trữ thông tin đặt bàn trước của khách hàng với cơ chế chống trùng slot và chống IDOR';
COMMENT ON COLUMN reservations.booking_code IS 'Mã ngẫu nhiên định danh lượt đặt bàn dùng để tra cứu công khai hoặc check-in';
COMMENT ON COLUMN reservations.buffer_minutes IS 'Khoảng thời gian đệm (phút) dùng bữa tiêu chuẩn nhằm tránh khách ngồi lấn giờ';

-- 3. BẢNG ĐỊNH NGHĨA CA LÀM VIỆC (shifts)
CREATE TABLE IF NOT EXISTS shifts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL, -- Ví dụ: "Ca Sáng", "Ca Chiều", "Ca Gãy"
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    min_staff   JSONB NOT NULL DEFAULT '{"waiter": 2, "kitchen": 2, "admin": 1}'::jsonb, -- Định mức tối thiểu theo vai trò
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE shifts IS 'Bảng cấu hình các khung ca làm việc và định mức nhân sự tối thiểu trong ca';

-- 4. BẢNG PHÂN CÔNG CA TRỰC NHÂN VIÊN (shift_assignments)
CREATE TABLE IF NOT EXISTS shift_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id        UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_date      DATE NOT NULL,
    status          shift_status DEFAULT 'scheduled',
    check_in_time   TIMESTAMPTZ DEFAULT NULL,
    check_out_time  TIMESTAMPTZ DEFAULT NULL,
    attendance_ip   VARCHAR(45) DEFAULT NULL, -- Lưu IP kiểm tra mạng Wifi nội bộ quán
    notes           TEXT DEFAULT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_shift_date UNIQUE (user_id, shift_date, shift_id)
);

COMMENT ON TABLE shift_assignments IS 'Bảng lưu lịch trực tuần của từng nhân viên và dữ liệu điểm danh thực tế';

-- 5. BẢNG YÊU CẦU ĐỔI CA TRỰC (shift_swap_requests)
CREATE TABLE IF NOT EXISTS shift_swap_requests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id           UUID NOT NULL REFERENCES shift_assignments(id) ON DELETE CASCADE,
    requester_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status                  VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted_by_peer', 'approved_by_admin', 'rejected', 'cancelled')),
    reason                  TEXT DEFAULT NULL,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE shift_swap_requests IS 'Bảng lưu yêu cầu đổi ca trực giữa 2 nhân viên và tiến trình phê duyệt của Quản lý';

-- 6. TẠO INDEXES TỐI ƯU TRUY VẤN
-- Tối ưu tra cứu bàn & khung giờ trống
CREATE INDEX IF NOT EXISTS idx_reservations_datetime ON reservations (reservation_date, reservation_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations (status);
CREATE INDEX IF NOT EXISTS idx_reservations_booking_code ON reservations (booking_code);
CREATE INDEX IF NOT EXISTS idx_reservations_phone ON reservations (customer_phone);
CREATE INDEX IF NOT EXISTS idx_reservations_table_id ON reservations (table_id) WHERE table_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_idempotency ON reservations (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Tối ưu tra cứu lịch trực tuần & điểm danh nhân viên
CREATE INDEX IF NOT EXISTS idx_shift_assignments_date_shift ON shift_assignments (shift_date, shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_user_date ON shift_assignments (user_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_status ON shift_assignments (status);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_status ON shift_swap_requests (status);
