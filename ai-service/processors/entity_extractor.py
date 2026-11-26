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

    # Pattern 1: Format có kèm giá tiền [Tên món] · [Giá]đ hoặc **[Tên món]** · [Giá]đ
    price_pattern = re.compile(
        r'(?:gợi\s*ý\s+|thử\s+(?:thêm\s+)?|\*\*\[?)(.*?)(?:\]?\*\*|\s*)\s*[·•\-]\s*([\d\.,]+)\s*(?:đ|₫|vnd|vnđ)',
        re.IGNORECASE
    )
    for match in price_pattern.finditer(ai_text):
        candidate = match.group(1).replace("*", "").replace("[", "").replace("]", "").strip()
        candidate = re.sub(r'^(dạ,?\s*)?(aria\s*xin\s*gợi\s*ý\s*|aria\s*gợi\s*ý\s*)', '', candidate, flags=re.IGNORECASE).strip()
        item = _find_menu_item(candidate, menu_lookup)
        if item:
            item_id = item.get("id") or item.get("name")
            if item_id not in seen_ids:
                suggested.append(_to_suggestion(item))
                seen_ids.add(item_id)

    # Pattern 2: Format **[Tên món]** (format chính thức trong prompt)
    bold_pattern = re.compile(r'\*\*([^\*]+)\*\*')
    for match in bold_pattern.finditer(ai_text):
        candidate = match.group(1).replace("[", "").replace("]", "").strip()
        item = _find_menu_item(candidate, menu_lookup)
        if item:
            item_id = item.get("id") or item.get("name")
            if item_id not in seen_ids:
                suggested.append(_to_suggestion(item))
                seen_ids.add(item_id)

    # Pattern 3: Tên món xuất hiện trực tiếp trong text (fuzzy match)
    if not suggested:
        for name_lower, item in menu_lookup.items():
            item_id = item.get("id") or item.get("name")
            if name_lower in ai_text.lower() and item_id not in seen_ids:
                suggested.append(_to_suggestion(item))
                seen_ids.add(item_id)

    # Giới hạn tối đa 3 gợi ý
    return suggested[:3]


def _find_menu_item(candidate: str, menu_lookup: dict) -> Optional[dict]:
    """
    Tìm menu item bằng exact match, contains match hoặc word overlap.
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

    # Word overlap match (ít nhất 50% từ của candidate xuất hiện trong tên món)
    c_words = set(candidate_lower.split())
    if len(c_words) >= 2:
        best_item = None
        best_score = 0.0
        for name_lower, item in menu_lookup.items():
            n_words = set(name_lower.split())
            overlap = len(c_words.intersection(n_words))
            score = overlap / len(c_words)
            if score > best_score and score >= 0.5:
                best_score = score
                best_item = item
        if best_item:
            return best_item

    return None


def _to_suggestion(candidate: dict) -> dict:
    """Convert menu item sang suggestion format cho Frontend"""
    raw = candidate.get("item", candidate) if isinstance(candidate, dict) else candidate
    cat = raw.get("categories") or raw.get("category") or {}
    cat_name = cat.get("name", "") if isinstance(cat, dict) else str(cat)
    return {
        "id": candidate.get("id") or raw.get("id"),
        "name": candidate.get("name") or raw.get("name"),
        "price": raw.get("price", candidate.get("price")),
        "image_url": raw.get("image_url", candidate.get("image_url")),
        "description": raw.get("ai_description") or raw.get("description") or candidate.get("description", ""),
        "category": cat_name,
    }
