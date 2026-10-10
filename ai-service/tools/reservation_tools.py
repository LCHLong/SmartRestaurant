"""
reservation_tools.py
Tool layer gọi Node.js backend reservation API từ Python AI service.
Tất cả hàm đều là async, xử lý timeout, status code, và internal headers.
"""

import os
import httpx
from typing import Optional, Dict, Any, List

BACKEND_URL = os.getenv("BACKEND_INTERNAL_URL", "http://localhost:5001")
INTERNAL_SERVICE_SECRET = os.getenv("INTERNAL_SERVICE_SECRET", "aria-ai-internal-service-secret")
TIMEOUT = 12.0  # seconds


_SETTINGS_CACHE: Optional[Dict[str, Any]] = None
_SETTINGS_CACHE_TIME: float = 0.0
SETTINGS_CACHE_TTL = 300.0  # 5 minutes


async def get_restaurant_settings() -> Dict[str, Any]:
    """
    Lấy thông tin cấu hình hệ thống nhà hàng (open_time, close_time, restaurant_name, wifi_password...)
    từ GET /api/system/settings. Có cache 5 phút để tối ưu hiệu năng.
    """
    global _SETTINGS_CACHE, _SETTINGS_CACHE_TIME
    import time as time_mod
    now = time_mod.time()
    if _SETTINGS_CACHE and (now - _SETTINGS_CACHE_TIME < SETTINGS_CACHE_TTL):
        return _SETTINGS_CACHE

    default_settings = {
        "open_time": "08:00",
        "close_time": "22:00",
        "restaurant_name": "Nhà hàng thông minh",
        "wifi_password": "12345678",
        "vat_rate": "8",
        "currency": "VND",
        "address": "123 Đường Ẩm Thực, Quận 1, TP.HCM",
        "hotline": "0901.234.567"
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(f"{BACKEND_URL}/api/system/settings")
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success") and isinstance(data.get("data"), dict):
                    merged = {**default_settings, **data["data"]}
                    _SETTINGS_CACHE = merged
                    _SETTINGS_CACHE_TIME = now
                    return merged
    except Exception as e:
        print(f"[get_restaurant_settings] Không thể tải settings từ API, dùng fallback: {e}")

    return default_settings


async def check_availability(
    date: str,          # "YYYY-MM-DD"
    time: str,          # "HH:MM"
    guest_count: int,
    open_time: Optional[str] = None,
    close_time: Optional[str] = None
) -> Dict[str, Any]:
    """
    Gọi GET /api/reservations/available-slots
    
    Returns:
        {
            "available": bool,
            "available_tables": int,
            "tables": [...],
            "date": str,
            "guest_count": int,
            "suggested_times": List[str]
        }
    """
    headers = {
        "X-Internal-Service": "aria-ai",
        "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
    }

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.get(
            f"{BACKEND_URL}/api/reservations/available-slots",
            params={
                "date": date,
                "time": time,
                "guest_count": guest_count
            },
            headers=headers
        )
        resp.raise_for_status()
        data = resp.json()
        if not data.get("success"):
            err_msg = data.get("error", {}).get("message", "Lỗi kiểm tra bàn trống")
            raise Exception(err_msg)

        result = data.get("data", {})
        available_count = result.get("available_tables", 0)
        is_available = available_count > 0

        # Nếu không có bàn, tính toán các mốc giờ lân cận trong giờ hoạt động
        suggested_times: List[str] = []
        if not is_available:
            h, m = map(int, time.split(":"))
            req_mins = h * 60 + m
            offsets = [-60, -30, 30, 60, -90, 90]
            candidate_times = []

            open_mins = 8 * 60
            close_mins = 22 * 60
            if open_time:
                try:
                    oh, om = map(int, open_time.split(":"))
                    open_mins = oh * 60 + om
                except Exception:
                    pass
            if close_time:
                try:
                    ch, cm = map(int, close_time.split(":"))
                    close_mins = ch * 60 + cm
                except Exception:
                    pass
            last_seating_mins = max(open_mins, close_mins - 30)

            for off in offsets:
                c_mins = req_mins + off
                if open_mins <= c_mins <= last_seating_mins:
                    c_str = f"{c_mins // 60:02d}:{c_mins % 60:02d}"
                    if c_str not in candidate_times and c_str != time:
                        candidate_times.append(c_str)

            for c_time in candidate_times:
                try:
                    c_resp = await client.get(
                        f"{BACKEND_URL}/api/reservations/available-slots",
                        params={"date": date, "time": c_time, "guest_count": guest_count},
                        headers=headers
                    )
                    c_data = c_resp.json()
                    if c_data.get("success") and c_data.get("data", {}).get("available_tables", 0) > 0:
                        suggested_times.append(c_time)
                        if len(suggested_times) >= 2:
                            break
                except Exception:
                    pass

        return {
            "available": is_available,
            "available_tables": available_count,
            "tables": result.get("tables", []),
            "date": date,
            "time": time,
            "guest_count": guest_count,
            "suggested_times": suggested_times
        }


async def create_reservation(
    customer_name: str,
    customer_phone: str,
    guest_count: int,
    reservation_date: str,   # "YYYY-MM-DD"
    reservation_time: str,   # "HH:MM"
    customer_email: Optional[str] = None,
    special_requests: Optional[str] = None,
    idempotency_key: Optional[str] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Gọi POST /api/reservations
    
    Returns:
        {
            "id": ...,
            "booking_code": "SR-XXXXXXXX",
            "reservation_date": str,
            "reservation_time": str,
            "guest_count": int,
            "customer_name": str,
            "status": "pending",
            "requires_deposit": bool,
            "deposit_amount": int
        }
    """
    body = {
        "customer_name": customer_name,
        "customer_phone": customer_phone,
        "guest_count": guest_count,
        "reservation_date": reservation_date,
        "reservation_time": reservation_time,
    }
    if customer_email:
        body["customer_email"] = customer_email
    if special_requests:
        body["special_requests"] = special_requests

    headers = {
        "Content-Type": "application/json",
        "X-Internal-Service": "aria-ai",
        "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
    }
    if idempotency_key:
        headers["Idempotency-Key"] = idempotency_key
    if user_id:
        headers["X-Internal-User-Id"] = user_id

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(
            f"{BACKEND_URL}/api/reservations",
            json=body,
            headers=headers
        )

        if resp.status_code == 409:
            raise Exception("RESERVATION_CONFLICT: Khung giờ này vừa có khách khác đặt hết bàn. Bạn vui lòng chọn giờ khác nhé.")

        if resp.status_code == 429:
            raise Exception("RATE_LIMIT_EXCEEDED: Hệ thống đang nhận quá nhiều yêu cầu. Vui lòng đợi trong giây lát.")

        if resp.status_code >= 500:
            raise Exception("SERVER_ERROR: Hệ thống backend tạm thời gặp sự cố kỹ thuật.")

        data = resp.json()
        if not data.get("success"):
            err_msg = data.get("error", {}).get("message", "Tạo đặt bàn không thành công")
            raise Exception(err_msg)

        res_data = data.get("data", {})
        # Đính kèm thêm requires_deposit & deposit_amount
        requires_deposit = guest_count >= 6
        res_data["requires_deposit"] = requires_deposit
        res_data["deposit_amount"] = guest_count * 50000 if requires_deposit else 0
        return res_data


async def get_user_info(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Gọi endpoint nội bộ lấy thông tin tài khoản user (name, phone, email) để auto-fill.
    """
    if not user_id:
        return None

    headers = {
        "X-Internal-Service": "aria-ai",
        "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(
                f"{BACKEND_URL}/api/users/{user_id}/basic-info",
                headers=headers
            )
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            data = resp.json()
            if data.get("success"):
                return data.get("data")
    except Exception as e:
        print(f"[get_user_info] Lỗi khi truy vấn user info: {e}")
        return None

    return None
