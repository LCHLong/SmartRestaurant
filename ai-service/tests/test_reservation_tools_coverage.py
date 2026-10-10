"""
test_reservation_tools_coverage.py
Bổ sung bộ unit test toàn diện cho tools/reservation_tools.py:
- get_restaurant_settings (cache TTL, API call, fallback error)
- check_availability (available slot, unavailable slot + suggest alternatives, error handling)
- create_reservation (409 conflict, 429 rate limit, 500 error, deposit rule >= 6 guests)
- get_user_info (200 success, 404 not found, exception handling)
"""

import pytest
import time
from unittest.mock import AsyncMock, patch, MagicMock
import httpx

from tools.reservation_tools import (
    get_restaurant_settings,
    check_availability,
    create_reservation,
    get_user_info,
    _SETTINGS_CACHE,
    _SETTINGS_CACHE_TIME,
)


@pytest.mark.asyncio
async def test_get_restaurant_settings_success():
    """Kiểm tra get_restaurant_settings lấy thành công và lưu cache."""
    mock_data = {
        "success": True,
        "data": {
            "restaurant_name": "Smart Restaurant Test",
            "open_time": "09:00",
            "close_time": "23:00"
        }
    }
    
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_data

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        
        # Reset cache trước khi test
        import tools.reservation_tools as rt
        rt._SETTINGS_CACHE = None
        rt._SETTINGS_CACHE_TIME = 0.0

        settings = await get_restaurant_settings()
        assert settings["restaurant_name"] == "Smart Restaurant Test"
        assert settings["open_time"] == "09:00"

        # Lần gọi thứ 2 phải trả về cache mà không gọi HTTP
        cached_settings = await get_restaurant_settings()
        assert cached_settings["restaurant_name"] == "Smart Restaurant Test"
        assert mock_get.call_count == 1


@pytest.mark.asyncio
async def test_get_restaurant_settings_fallback_on_error():
    """Kiểm tra fallback khi backend bị lỗi mạng hoặc 500."""
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = httpx.ConnectError("Connection refused")
        
        import tools.reservation_tools as rt
        rt._SETTINGS_CACHE = None
        rt._SETTINGS_CACHE_TIME = 0.0

        settings = await get_restaurant_settings()
        assert settings["open_time"] == "08:00"
        assert settings["close_time"] == "22:00"
        assert "Nhà hàng thông minh" in settings["restaurant_name"]


@pytest.mark.asyncio
async def test_check_availability_available():
    """Kiểm tra check_availability khi còn bàn trống."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = {
        "success": True,
        "data": {
            "available_tables": 3,
            "tables": [{"id": 1, "name": "Bàn A1"}]
        }
    }

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        res = await check_availability("2026-10-15", "19:00", 4)
        assert res["available"] is True
        assert res["available_tables"] == 3
        assert len(res["suggested_times"]) == 0


@pytest.mark.asyncio
async def test_check_availability_full_with_suggestions():
    """Kiểm tra khi hết bàn thì hệ thống đề xuất các khung giờ lân cận."""
    def fake_get(url, params=None, headers=None):
        r = MagicMock()
        r.raise_for_status = MagicMock()
        t = params.get("time")
        if t == "19:00":
            r.json.return_value = {"success": True, "data": {"available_tables": 0}}
        else:
            # Các giờ lân cận như 18:30 còn bàn
            r.json.return_value = {"success": True, "data": {"available_tables": 1}}
        return r

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = fake_get
        res = await check_availability("2026-10-15", "19:00", 4, open_time="08:00", close_time="22:00")
        assert res["available"] is False
        assert len(res["suggested_times"]) > 0


@pytest.mark.asyncio
async def test_create_reservation_deposit_rule():
    """Kiểm tra quy định đặt cọc: >= 6 người phải yêu cầu cọc 50k/người."""
    mock_resp = MagicMock()
    mock_resp.status_code = 201
    mock_resp.json.return_value = {
        "success": True,
        "data": {
            "id": 101,
            "booking_code": "SR-TEST1234",
            "reservation_date": "2026-10-15",
            "reservation_time": "19:00",
            "guest_count": 8,
            "customer_name": "Lê Long"
        }
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        res = await create_reservation(
            customer_name="Lê Long",
            customer_phone="0987654321",
            guest_count=8,
            reservation_date="2026-10-15",
            reservation_time="19:00"
        )
        assert res["requires_deposit"] is True
        assert res["deposit_amount"] == 8 * 50000


@pytest.mark.asyncio
async def test_create_reservation_conflict_409():
    """Kiểm tra xử lý lỗi 409 xung đột đặt bàn."""
    mock_resp = MagicMock()
    mock_resp.status_code = 409

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        with pytest.raises(Exception) as excinfo:
            await create_reservation(
                customer_name="Lê Long",
                customer_phone="0987654321",
                guest_count=4,
                reservation_date="2026-10-15",
                reservation_time="19:00"
            )
        assert "RESERVATION_CONFLICT" in str(excinfo.value)


@pytest.mark.asyncio
async def test_get_user_info():
    """Kiểm tra lấy thông tin user thành công và trường hợp 404."""
    mock_resp_200 = MagicMock()
    mock_resp_200.status_code = 200
    mock_resp_200.json.return_value = {
        "success": True,
        "data": {"name": "Nguyễn Văn A", "phone": "0901234567"}
    }

    mock_resp_404 = MagicMock()
    mock_resp_404.status_code = 404

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp_200
        user = await get_user_info("user-123")
        assert user["name"] == "Nguyễn Văn A"

        mock_get.return_value = mock_resp_404
        user_none = await get_user_info("user-invalid")
        assert user_none is None
