"""
takeaway_tools.py
Bộ xử lý dịch vụ & đơn hàng mua mang về (Takeaway & Pickup Tools) cho trợ lý Aria:
- Nhận diện ý định mua mang về / ghé lấy (Takeaway Inquiry & Order).
- Xác nhận chính sách đóng gói mang về (đóng hộp giữ nhiệt an toàn).
- Bóc tách món ăn, số lượng, tính tổng tiền từ thực đơn nhà hàng.
- Hướng dẫn khách cung cấp thời gian ghé lấy và thông tin liên hệ.
"""

import re
from typing import List, Dict, Any, Optional, Tuple

WORD_NUMBERS = {
    "một": 1, "1": 1,
    "hai": 2, "2": 2,
    "ba": 3, "3": 3,
    "bốn": 4, "4": 4,
    "năm": 5, "5": 5,
    "sáu": 6, "6": 6,
    "bảy": 7, "7": 7,
    "tám": 8, "8": 8,
    "chín": 9, "9": 9,
    "mười": 10, "10": 10,
}

TAKEAWAY_MARKERS = [
    "mang về", "bán mang về", "mua mang về", "đem về", "takeaway", "take away",
    "ghé lấy", "đến lấy", "tới lấy", "qua lấy", "đóng gói mang về", "gói mang về",
    "hộp mang về", "mua về", "đóng hộp", "mang đi"
]


def is_takeaway_message(text: str) -> bool:
    """Kiểm tra xem câu thoại có liên quan đến mua mang về / ghé lấy hay không."""
    if not text:
        return False
    msg = text.lower()
    return any(marker in msg for marker in TAKEAWAY_MARKERS)


def extract_takeaway_items(
    text: str,
    menu_items: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Trích xuất danh sách món và số lượng khách muốn mua mang về.
    """
    if not text:
        return []

    text_lower = text.lower().strip()

    # Nếu không truyền menu_items, cố gắng nạp từ DualIndexManager
    if not menu_items:
        try:
            from processors.index_manager import DualIndexManager
            idx_mgr = DualIndexManager()
            idx_mgr.load_from_disk()
            menu_items = idx_mgr.corpus_items or []
        except Exception:
            menu_items = []

    extracted_items = []
    matched_names = set()

    # Sắp xếp các món theo độ dài tên giảm dần để ưu tiên tên dài hơn (tránh match tên con trước)
    sorted_items = sorted(menu_items, key=lambda x: len(x.get("name", "")), reverse=True)

    for item in sorted_items:
        name = item.get("name", "")
        if not name:
            continue
        name_lower = name.lower()

        # Kiểm tra xem tên món có xuất hiện trong câu nói không
        if name_lower in text_lower:
            # Tránh trùng lặp nếu tên này là một phần của món dài hơn đã được match
            if any(name_lower in m for m in matched_names):
                continue

            quantity = 1

            # Pattern 1: Số lượng trước tên món (VD: "2 phần Bún Bò Huế", "2 tô bún bò")
            pattern_pre = re.search(
                r'(?:lấy|đặt|mua|cho|xin|muốn)?\s*(\d+|một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười)\s*(?:phần|suất|tô|bát|dĩa|đĩa|hộp|ly|cốc|chai|lon|gói)?\s*' + re.escape(name_lower),
                text_lower
            )
            if pattern_pre:
                raw_q = pattern_pre.group(1)
                quantity = int(raw_q) if raw_q.isdigit() else WORD_NUMBERS.get(raw_q, 1)
            else:
                # Pattern 2: Số lượng sau tên món (VD: "Bún Bò Huế 2 phần")
                pattern_post = re.search(
                    re.escape(name_lower) + r'\s*(\d+|một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười)\s*(?:phần|suất|tô|bát|dĩa|đĩa|hộp)?',
                    text_lower
                )
                if pattern_post:
                    raw_q = pattern_post.group(1)
                    quantity = int(raw_q) if raw_q.isdigit() else WORD_NUMBERS.get(raw_q, 1)

            unit_price = item.get("price") or 0
            try:
                unit_price = float(unit_price)
            except Exception:
                unit_price = 0.0

            total_price = unit_price * quantity

            extracted_items.append({
                "id": item.get("id"),
                "name": name,
                "quantity": quantity,
                "unit_price": unit_price,
                "total_price": total_price,
                "item": item
            })
            matched_names.add(name_lower)

    return extracted_items


def format_takeaway_response(
    items: List[Dict[str, Any]],
    settings: Optional[Dict[str, Any]] = None
) -> str:
    """
    Tạo văn bản phản hồi chuẩn cho dịch vụ mua mang về (TC-LV10-03).
    """
    confirm_header = "Dạ nhà hàng có phục vụ mua mang về (đóng hộp giữ nhiệt cẩn thận) ạ!"

    if not items:
        return f"{confirm_header} Bạn muốn đặt món nào để Aria chuẩn bị cho bạn ghé lấy nhé?"

    items_strs = []
    total_bill = 0.0
    for it in items:
        qty = it.get("quantity", 1)
        name = it.get("name", "")
        tot = it.get("total_price", 0.0)
        total_bill += tot
        items_strs.append(f"{qty} phần {name}")

    items_summary = ", ".join(items_strs)
    total_str = f"{total_bill:,.0f}đ".replace(",", ".")

    body = f"Aria xin ghi nhận {items_summary} (tổng {total_str}). Bạn dự kiến khoảng mấy giờ ghé lấy để bếp chuẩn bị nóng hổi sẵn sàng ạ?"

    return f"{confirm_header}\n\n{body}"
