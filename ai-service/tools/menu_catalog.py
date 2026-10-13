"""
menu_catalog.py
Quản lý thuộc tính danh mục thực đơn F&B:
- preparation_time_minutes: Thời gian chế biến / chuẩn bị (phút)
- serving_speed: Phân loại tốc độ phục vụ ('instant', 'fast', 'standard', 'slow')
  * instant: <= 5m (món làm sẵn, có sẵn, tráng miệng / đồ uống pha sẵn)
  * fast: <= 10m (món sơ chế sẵn, phở/bún trụng nhanh, bánh mì kẹp)
  * standard: <= 20m (món nấu tiêu chuẩn theo order)
  * slow: > 20m (món hầm lâu, om, lẩu, nướng)
"""

from enum import Enum
from typing import Dict, Any, Optional, List


class ServingSpeed(str, Enum):
    INSTANT = "instant"      # Làm sẵn, có sẵn, lấy ngay (<= 5 phút)
    FAST = "fast"            # Sơ chế nhanh, trụng nhanh, kẹp nhanh (<= 10 phút)
    STANDARD = "standard"    # Nấu tiêu chuẩn theo order (<= 20 phút)
    SLOW = "slow"            # Món hầm lâu, lẩu, nướng (> 20 phút)


# Từ điển chỉ định rõ các món hầm lâu / chế biến chậm
SLOW_PREP_KEYWORDS = [
    "hầm mềm", "bò sốt tiêu đen", "bò hầm", "món hầm", "lẩu", "nướng nguyên con", "om dưa", "om chuối đậu"
]

# Từ điển các món làm sẵn / có sẵn tức thì (instant <= 5m)
INSTANT_KEYWORDS = [
    "flan", "bánh flan", "panna cotta", "mousse", "chè", "kem", "cà phê", "nước ép", "trà", "sinh tố", "bạc xỉu"
]

# Từ điển các món sơ chế nhanh / trụng nhanh (fast <= 10m)
FAST_KEYWORDS = [
    "gỏi cuốn", "bánh mì", "phở", "bún", "hủ tiếu", "súp", "salad", "đậu hũ chiên"
]


def classify_serving_speed(item: Dict[str, Any]) -> str:
    """
    Phân loại serving_speed cho món ăn dựa trên thuộc tính và mô tả thực tế.
    """
    name = str(item.get("name") or "").lower()
    desc = str(item.get("description") or "").lower()
    full_text = f"{name} {desc}".lower()

    # 1. Kiểm tra món hầm lâu / lẩu
    if any(k in full_text for k in SLOW_PREP_KEYWORDS):
        return ServingSpeed.SLOW.value

    # 2. Kiểm tra theo preparation_time_minutes hoặc prep_time nếu có
    prep = item.get("preparation_time_minutes") or item.get("prep_time")
    if prep is not None:
        try:
            pt = int(prep)
            if pt <= 5:
                return ServingSpeed.INSTANT.value
            elif pt <= 10:
                return ServingSpeed.FAST.value
            elif pt <= 20:
                return ServingSpeed.STANDARD.value
            else:
                return ServingSpeed.SLOW.value
        except (ValueError, TypeError):
            pass

    # 3. Phân loại theo tên món
    if any(k in name for k in INSTANT_KEYWORDS):
        return ServingSpeed.INSTANT.value
    if any(k in name for k in FAST_KEYWORDS):
        return ServingSpeed.FAST.value

    # 4. Phân loại theo danh mục
    cat = item.get("category") or item.get("categories") or ""
    cat_name = (cat.get("name") if isinstance(cat, dict) else str(cat)).lower()
    if any(k in cat_name for k in ("đồ uống", "drinks", "tráng miệng", "dessert")):
        return ServingSpeed.INSTANT.value
    if "khai vị" in cat_name or "starters" in cat_name:
        return ServingSpeed.FAST.value

    return ServingSpeed.STANDARD.value


def get_preparation_time_minutes(item: Dict[str, Any]) -> int:
    """
    Lấy thời gian chuẩn bị / chế biến tính theo phút.
    """
    name = str(item.get("name") or "").lower()
    desc = str(item.get("description") or "").lower()
    full_text = f"{name} {desc}".lower()

    if any(k in full_text for k in SLOW_PREP_KEYWORDS):
        return 30
    if "lẩu" in full_text:
        return 25

    prep = item.get("preparation_time_minutes") or item.get("prep_time")
    if prep is not None:
        try:
            val = int(prep)
            if val > 0:
                return val
        except (ValueError, TypeError):
            pass

    speed = classify_serving_speed(item)
    if speed == ServingSpeed.INSTANT.value:
        return 5
    elif speed == ServingSpeed.FAST.value:
        return 8
    elif speed == ServingSpeed.SLOW.value:
        return 30
    return 15


def enrich_item_speed_metadata(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Bổ sung hai trường chuẩn:
    - preparation_time_minutes: int
    - serving_speed: 'instant' | 'fast' | 'standard' | 'slow'
    """
    enriched = dict(item)
    prep_time = get_preparation_time_minutes(enriched)
    speed = classify_serving_speed(enriched)
    enriched["preparation_time_minutes"] = prep_time
    enriched["prep_time"] = prep_time
    enriched["serving_speed"] = speed
    return enriched
