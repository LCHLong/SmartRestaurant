"""
reservation_state.py
Quản lý trạng thái đặt bàn (State Machine) per-session trong Redis (có memory fallback).
Key: aria_reservation:{session_id}
TTL: 600 giây (10 phút)
"""

import json
import os
import time
from typing import Optional, Dict, Any, Tuple
from datetime import datetime
import redis.asyncio as aioredis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
STATE_TTL = 600  # 10 phút

_redis_client: Optional[aioredis.Redis] = None
_MEMORY_STORE: Dict[str, Tuple[Dict[str, Any], float]] = {}  # {session_id: (state, expire_at)}


def _get_default_state() -> Dict[str, Any]:
    return {
        "fsm_state": "IDLE",
        "slots": {
            "date": None,
            "time": None,
            "guests": None,
            "customer_name": None,
            "customer_phone": None,
            "special_requests": None,
        },
        "user_info": {
            "is_logged_in": False,
            "user_id": None,
            "name": None,
            "phone": None,
            "email": None,
        },
        "last_availability": None,
        "booking_code": None,
        "created_at": None,
        "updated_at": None,
    }


async def _get_redis() -> Optional[aioredis.Redis]:
    global _redis_client
    if _redis_client is None:
        try:
            client = aioredis.from_url(
                REDIS_URL,
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0
            )
            # Test ping
            await client.ping()
            _redis_client = client
        except Exception:
            _redis_client = None
    return _redis_client


async def get_state(session_id: str) -> Dict[str, Any]:
    """Lấy reservation state. Trả về default state nếu chưa có hoặc đã hết hạn."""
    if not session_id:
        return _get_default_state()

    client = await _get_redis()
    if client:
        try:
            raw = await client.get(f"aria_reservation:{session_id}")
            if raw:
                return json.loads(raw)
        except Exception:
            pass

    # Memory fallback
    if session_id in _MEMORY_STORE:
        state, expire_at = _MEMORY_STORE[session_id]
        if time.time() < expire_at:
            return json.loads(json.dumps(state))
        else:
            del _MEMORY_STORE[session_id]

    return _get_default_state()


async def save_state(session_id: str, state: Dict[str, Any]) -> None:
    """Lưu state vào Redis hoặc Memory fallback kèm TTL."""
    if not session_id:
        return

    now_iso = datetime.now().isoformat()
    if not state.get("created_at"):
        state["created_at"] = now_iso
    state["updated_at"] = now_iso

    client = await _get_redis()
    if client:
        try:
            await client.set(
                f"aria_reservation:{session_id}",
                json.dumps(state, ensure_ascii=False),
                ex=STATE_TTL
            )
            return
        except Exception:
            pass

    # Memory fallback
    _MEMORY_STORE[session_id] = (
        json.loads(json.dumps(state)),
        time.time() + STATE_TTL
    )


async def clear_state(session_id: str) -> None:
    """Xóa state khi DONE hoặc HANDOFF."""
    if not session_id:
        return

    client = await _get_redis()
    if client:
        try:
            await client.delete(f"aria_reservation:{session_id}")
        except Exception:
            pass

    _MEMORY_STORE.pop(session_id, None)


def is_slots_complete(state: Dict[str, Any]) -> bool:
    """Kiểm tra xem đã đủ 3 slot cốt lõi (date, time, guests) để check availability chưa."""
    slots = state.get("slots", {})
    return bool(slots.get("date") and slots.get("time") and slots.get("guests"))


def is_guest_info_complete(state: Dict[str, Any]) -> bool:
    """Kiểm tra đủ thông tin định danh khách (Tên + SĐT)."""
    if state.get("user_info", {}).get("is_logged_in"):
        return True
    slots = state.get("slots", {})
    return bool(slots.get("customer_name") and slots.get("customer_phone"))
