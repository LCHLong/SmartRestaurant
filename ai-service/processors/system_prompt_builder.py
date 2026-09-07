"""
system_prompt_builder.py
Layer 2 — Dynamic Context Builder cho Aria Pipeline

Build prompt động từ:
- Menu context (Top 6-8 món từ RAG)
- Cart items hiện tại
- Order history (nếu đăng nhập)
- Thông tin bàn & thời điểm ngày
- Conversation history (session memory)
"""

import json
from datetime import datetime
from typing import Optional


def _format_price(price: float) -> str:
    """Format giá tiền dạng: 45.000đ"""
    try:
        return f"{int(price):,}đ".replace(",", ".")
    except Exception:
        return str(price)


def _get_time_of_day() -> str:
    hour = datetime.now().hour
    if 6 <= hour < 11:
        return "buổi sáng"
    elif 11 <= hour < 14:
        return "buổi trưa"
    elif 14 <= hour < 17:
        return "buổi chiều"
    else:
        return "buổi tối"


def _format_menu_item(item: dict) -> str:
    """Format 1 món ăn cho context prompt — súc tích, giàu thông tin"""
    parts = [f"- {item.get('name', 'N/A')} ({_format_price(item.get('price', 0))})"]

    desc = item.get("ai_description") or item.get("description")
    if desc:
        parts.append(f"  Mô tả: {desc[:100]}")

    if item.get("spice_level") is not None:
        parts.append(f"  Độ cay: {item['spice_level']}/5")

    if item.get("calories"):
        parts.append(f"  Calories: {item['calories']} kcal")

    ingredients = item.get("ingredients")
    if ingredients:
        parts.append(f"  Nguyên liệu: {', '.join(ingredients[:5])}")
    else:
        parts.append("  Nguyên liệu: [Chưa có dữ liệu — phải hỏi nhân viên nếu khách hỏi]")

    allergens = item.get("allergens")
    if allergens:
        parts.append(f"  Dị ứng: {', '.join(allergens)}")

    category = item.get("categories", {})
    if isinstance(category, dict) and category.get("name"):
        parts.append(f"  Danh mục: {category['name']}")

    if item.get("is_trending"):
        parts.append("  🔥 Trending hôm nay")

    return "\n".join(parts)


def build_dynamic_context(
    menu_context: list[dict],
    cart_items: list[dict],
    order_history: list[dict],
    table_id: str,
    fallback_used: bool = False,
    restaurant_id: Optional[str] = None,
) -> str:
    """
    Build Layer 2 — Dynamic Context string để inject vào prompt Gemini.

    Returns:
        str: Chuỗi context đầy đủ cho prompt
    """
    lines = []

    # --- Thông tin bàn & thời gian ---
    time_of_day = _get_time_of_day()
    lines.append(f"## THÔNG TIN NGỮ CẢNH")
    lines.append(f"- Bàn số: {table_id}")
    lines.append(f"- Thời điểm: {time_of_day} ({datetime.now().strftime('%H:%M')})")
    lines.append("")

    # --- Menu context (RAG result) ---
    if fallback_used:
        lines.append("## THỰC ĐƠN GỢI Ý (Best-Seller — không khớp yêu cầu cụ thể)")
    else:
        lines.append("## THỰC ĐƠN LIÊN QUAN (Kết quả RAG)")

    if menu_context:
        for item in menu_context:
            lines.append(_format_menu_item(item))
    else:
        lines.append("- [Không có dữ liệu thực đơn]")
    lines.append("")

    # --- Giỏ hàng hiện tại ---
    lines.append("## GIỎ HÀNG HIỆN TẠI CỦA KHÁCH")
    if cart_items:
        for c in cart_items:
            qty = c.get("quantity", 1)
            name = c.get("name", "?")
            price = _format_price(c.get("price", 0))
            lines.append(f"- {name} x{qty} — {price}")
    else:
        lines.append("- (Giỏ hàng trống)")
    lines.append("")

    # --- Lịch sử đặt món (nếu đăng nhập) ---
    if order_history:
        lines.append("## LỊCH SỬ ĐẶT MÓN TRƯỚC ĐÓ (Cá nhân hóa)")
        for h in order_history[:5]:
            lines.append(f"- {h.get('name', 'N/A')}")
        lines.append("")

    return "\n".join(lines)
