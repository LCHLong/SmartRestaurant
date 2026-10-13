"""
recommendation_engine.py
Module đề xuất và lọc thực đơn dựa trên ràng buộc thời gian (Urgent / Fast Dining):
- Xử lý các yêu cầu ăn gấp, đang vội, giới hạn thời gian (ví dụ: trong 15 phút, ra nhanh nhất).
- Loại bỏ tuyệt đối các món chế biến lâu, hầm nhừ, lẩu (như Bò Sốt Tiêu Đen Bánh Mì Nóng Giòn).
- Ưu tiên món có sẵn (instant <= 5m) hoặc sơ chế/trụng nhanh (fast <= 10m).
- Tự động gắn cam kết ghi chú báo bếp ưu tiên làm gấp.
"""

import re
from typing import List, Dict, Any, Optional, Tuple
from tools.menu_catalog import (
    ServingSpeed,
    classify_serving_speed,
    get_preparation_time_minutes,
    enrich_item_speed_metadata,
    SLOW_PREP_KEYWORDS,
)

KITCHEN_PRIORITY_NOTE = "*(Aria xin phép ghi chú báo bếp ưu tiên làm gấp ngay để quý khách kịp giờ nhé!)*"

URGENT_PHRASES = [
    r"\bvội\b",
    r"\bđang vội\b",
    r"\bgấp\b",
    r"\bcần gấp\b",
    r"\băn gấp\b",
    r"\băn nhanh\b",
    r"\blàm gấp\b",
    r"\bra nhanh\b",
    r"\bra nhanh nhất\b",
    r"\bnhanh nhất\b",
    r"\bmón nào nhanh\b",
    r"\băn liền\b",
    r"\bcó sẵn\b",
    r"\blấy ngay\b",
    r"\bkịp giờ\b",
    r"\bgấp gáp\b",
]

PREP_TIME_PATTERN = re.compile(
    r"(?:trong|dưới|tối đa|khoảng|trong vòng|tầm)?\s*(\d+)\s*(?:phút|phut|p)\b",
    re.IGNORECASE,
)


def detect_urgency(text: str) -> Tuple[bool, Optional[int]]:
    """
    Phát hiện nhu cầu ăn nhanh / thời gian giới hạn từ câu hỏi của khách hàng.
    Returns:
        (is_urgent: bool, max_prep_time_minutes: Optional[int])
    """
    if not text:
        return False, None

    text_lower = text.lower()

    # Tìm số phút cụ thể
    minute_limit: Optional[int] = None
    m = PREP_TIME_PATTERN.search(text_lower)
    if m:
        try:
            val = int(m.group(1))
            if 1 <= val <= 120:
                minute_limit = val
        except (ValueError, TypeError):
            pass

    is_urgent = False
    for pat in URGENT_PHRASES:
        if re.search(pat, text_lower, re.IGNORECASE):
            is_urgent = True
            break

    # Nếu có mốc thời gian gấp <= 20 phút kết hợp với ngữ cảnh ăn uống -> xem là urgent
    if minute_limit is not None and minute_limit <= 20:
        is_urgent = True
    elif is_urgent and minute_limit is None:
        minute_limit = 15

    return is_urgent, minute_limit


def filter_menu_by_urgency(
    items: List[Dict[str, Any]],
    max_prep_time_minutes: int = 15,
    is_urgent: bool = True,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Lọc danh sách món ăn khi khách cần ăn gấp:
    - Loại bỏ món có thời gian chuẩn bị > max_prep_time_minutes.
    - Loại bỏ món thuộc nhóm SLOW hoặc có từ khóa hầm/om/lẩu.
    - Trả về (accepted, rejected).
    """
    accepted: List[Dict[str, Any]] = []
    rejected: List[Dict[str, Any]] = []

    for it in items:
        raw = it.get("item", it) if isinstance(it, dict) else it
        enriched = enrich_item_speed_metadata(raw)
        prep_time = enriched["preparation_time_minutes"]
        speed = enriched["serving_speed"]

        name = str(raw.get("name", "")).lower()
        desc = str(raw.get("description", "")).lower()
        full_text = f"{name} {desc}"

        reasons = []
        if is_urgent:
            # 1. Kiểm tra từ khóa món hầm / nấu chậm
            if any(k in full_text for k in SLOW_PREP_KEYWORDS):
                reasons.append("Món hầm mềm / nấu chậm cần thời gian ninh nhừ")
            elif speed == ServingSpeed.SLOW.value:
                reasons.append(f"Tốc độ phục vụ chậm ({prep_time} phút)")
            elif prep_time > max_prep_time_minutes:
                reasons.append(
                    f"Thời gian chế biến ({prep_time} phút) vượt giới hạn yêu cầu (tối đa {max_prep_time_minutes} phút)"
                )

        if reasons:
            rej = dict(it)
            rej["rejection_reason"] = "; ".join(reasons)
            rejected.append(rej)
        else:
            acc = dict(it)
            # Gắn metadata tốc độ vào item để dùng hiển thị
            if isinstance(it.get("item"), dict):
                acc["item"] = {**it["item"], **enriched}
            else:
                acc.update(enriched)
            accepted.append(acc)

    # Sắp xếp món được chấp nhận theo thời gian chế biến tăng dần (món ra nhanh nhất lên đầu)
    accepted.sort(
        key=lambda x: get_preparation_time_minutes(x.get("item", x))
    )

    return accepted, rejected


def recommend_urgent_dining_items(
    items: List[Dict[str, Any]],
    max_prep_time_minutes: int = 15,
    top_k: int = 3,
) -> Dict[str, Any]:
    """
    Đề xuất danh sách món nhanh nhất và tạo ghi chú ưu tiên cho bếp.
    """
    accepted, rejected = filter_menu_by_urgency(
        items,
        max_prep_time_minutes=max_prep_time_minutes,
        is_urgent=True,
    )

    recommendations = accepted[:top_k]

    return {
        "recommended_items": recommendations,
        "max_prep_time_minutes": max_prep_time_minutes,
        "kitchen_priority_note": KITCHEN_PRIORITY_NOTE,
        "rejected_count": len(rejected),
    }
