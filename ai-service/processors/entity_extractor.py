"""
entity_extractor.py
Trích xuất tên món từ phản hồi AI và map với menu DB để trả về structured items

Logic:
1. Parse tên món từ text AI (dựa theo format **[Tên món]** hoặc fuzzy match)
2. Map với menu_context (danh sách món đã được RAG cung cấp)
3. Trả về list item có đủ id, name, price, image_url
4. Nếu không khớp chính xác → KHÔNG trả về item (không sinh nút [+ Thêm])
"""

import re
from typing import Optional


def extract_suggested_items(
    ai_text: str,
    menu_context: list[dict],
) -> list[dict]:
    """
    Trích xuất các món được AI gợi ý từ văn bản response.

    Args:
        ai_text: Văn bản phản hồi từ Gemini
        menu_context: Danh sách món từ RAG (đã có id, name, price, image_url...)

    Returns:
        list[dict]: Danh sách món khớp, mỗi item gồm {id, name, price, image_url}
    """
    if not ai_text or not menu_context:
        return []

    # Build lookup dict: name.lower() → item
    menu_lookup = {
        item.get("name", "").lower().strip(): item
        for item in menu_context
        if item.get("name")
    }

    suggested = []
    seen_ids = set()

    # Pattern 1: Format **[Tên món]** (format chính thức trong prompt)
    bold_pattern = re.compile(r'\*\*([^\*]+)\*\*')
    for match in bold_pattern.finditer(ai_text):
        candidate = match.group(1).strip()
        item = _find_menu_item(candidate, menu_lookup)
        if item and item.get("id") not in seen_ids:
            suggested.append(_to_suggestion(item))
            seen_ids.add(item["id"])

    # Pattern 2: Tên món xuất hiện trực tiếp trong text (fuzzy match)
    if not suggested:
        for name_lower, item in menu_lookup.items():
            if name_lower in ai_text.lower() and item.get("id") not in seen_ids:
                suggested.append(_to_suggestion(item))
                seen_ids.add(item["id"])

    # Giới hạn tối đa 3 gợi ý
    return suggested[:3]


def _find_menu_item(candidate: str, menu_lookup: dict) -> Optional[dict]:
    """
    Tìm menu item bằng exact match hoặc contains match.
    Đảm bảo "Closed World" — không tạo item giả.
    """
    candidate_lower = candidate.lower().strip()

    # Exact match
    if candidate_lower in menu_lookup:
        return menu_lookup[candidate_lower]

    # Contains match (tên trong DB có trong candidate hoặc ngược lại)
    for name_lower, item in menu_lookup.items():
        if name_lower in candidate_lower or candidate_lower in name_lower:
            return item

    return None


def _to_suggestion(item: dict) -> dict:
    """Convert menu item sang suggestion format cho Frontend"""
    return {
        "id": item.get("id"),
        "name": item.get("name"),
        "price": item.get("price"),
        "image_url": item.get("image_url"),
        "description": item.get("ai_description") or item.get("description", ""),
        "category": (item.get("categories") or {}).get("name", ""),
    }
