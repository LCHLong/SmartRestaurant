"""
Module: row_serializer.py
Triển khai Trụ cột 1: Table-Aware Row-Level Serialization
Theo nghiên cứu "Advancing RAG for Structured Enterprise Data" (Paper 01, Mục 3.1.2)

Chức năng:
Chuyển đổi dữ liệu bảng nhiều cột (thực đơn, chính sách nhà hàng) thành chuỗi văn bản
bán cấu trúc có ngữ cảnh rõ ràng, bảo toàn trọn vẹn mối quan hệ hàng - cột cho cả
mô hình Dense Embedding (Sentence-Transformers) và Sparse Search (BM25).
"""

from typing import Dict, Any, Optional, List, Union


def _format_list(value: Optional[Union[List[str], str]], default: str) -> str:
    """Chuẩn hóa giá trị mảng hoặc chuỗi thành danh sách phân cách bởi dấu phẩy."""
    if value is None:
        return default
    if isinstance(value, list):
        filtered = [str(v).strip() for v in value if v and str(v).strip()]
        return ", ".join(filtered) if filtered else default
    if isinstance(value, str):
        cleaned = value.strip()
        return cleaned if cleaned else default
    return str(value)


def _format_price(price: Optional[Union[int, float, str]]) -> str:
    """Định dạng giá tiền VND rõ ràng."""
    if price is None:
        return "Liên hệ"
    try:
        numeric_price = int(float(price))
        return f"{numeric_price:,} VND"
    except (ValueError, TypeError):
        return f"{price} VND" if str(price).strip() else "Liên hệ"


def _extract_category_name(item: Dict[str, Any]) -> str:
    """Trích xuất tên danh mục từ nhiều biến thể cấu trúc của Supabase / PostgreSQL."""
    category = item.get("category")
    if isinstance(category, dict):
        cat_name = category.get("name")
        if cat_name and str(cat_name).strip():
            return str(cat_name).strip()
    elif isinstance(category, str) and category.strip():
        return category.strip()

    categories = item.get("categories")
    if isinstance(categories, dict):
        cat_name = categories.get("name")
        if cat_name and str(cat_name).strip():
            return str(cat_name).strip()
    elif isinstance(categories, str) and categories.strip():
        return categories.strip()

    return "Khác"


def serialize_menu_row(item: Optional[Dict[str, Any]]) -> str:
    """
    Tuần tự hóa một bản ghi của bảng `menu_items` thành chuỗi biểu diễn có cấu trúc.
    
    Bảo toàn toàn bộ các thuộc tính quan hệ:
    - Tên món ăn
    - Danh mục phân loại
    - Giá bán (VND)
    - Cấp độ cay (0-5)
    - Lượng Calorie
    - Thành phần nguyên liệu
    - Cảnh báo dị ứng
    - Nhãn ăn kiêng (chay, vegan, gluten-free...)
    - Mô tả hương vị & AI description
    - Món nổi bật (trending)

    Args:
        item: Dictionary biểu diễn một dòng dữ liệu của menu_items

    Returns:
        Chuỗi văn bản tuần tự hóa cấp hàng, chuẩn hóa null-safety
    """
    if not item or not isinstance(item, dict):
        return ""

    name = str(item.get("name") or "Chưa rõ").strip()
    category_name = _extract_category_name(item)
    price_vnd = _format_price(item.get("price"))

    # Cấp độ cay
    spice_raw = item.get("spice_level")
    spice_str = f"{spice_raw}/5" if spice_raw is not None else "0/5 (Không cay)"

    # Calorie
    calories = item.get("calories")
    calories_str = f"{calories} kcal" if calories is not None else "N/A"

    # Nguyên liệu, Dị ứng, Nhãn ăn kiêng
    ingredients = _format_list(item.get("ingredients"), "Không ghi chú")
    allergens = _format_list(item.get("allergens"), "Không có dị ứng phổ biến")
    dietary_tags = _format_list(item.get("dietary_tags"), "Không có nhãn đặc biệt")

    # Mô tả
    desc = str(item.get("description") or "").strip()
    ai_desc = str(item.get("ai_description") or "").strip()
    combined_desc = f"{desc} {ai_desc}".strip() or "Đang cập nhật mô tả món ăn."

    # Trạng thái trending
    trending_str = " (Món thịnh hành ⭐)" if item.get("is_trending") else ""

    serialized = (
        f"[MÓN ĂN: {name}{trending_str}]\n"
        f"• Phân loại: {category_name}\n"
        f"• Giá bán: {price_vnd}\n"
        f"• Độ cay: {spice_str}\n"
        f"• Lượng Calo: {calories_str}\n"
        f"• Thành phần nguyên liệu: {ingredients}\n"
        f"• Cảnh báo dị ứng: {allergens}\n"
        f"• Nhãn chế độ ăn: {dietary_tags}\n"
        f"• Mô tả hương vị: {combined_desc}"
    )
    return serialized.strip()


# Alias tương thích với tên gọi trong tài liệu kế hoạch
serialize_menu_item = serialize_menu_row


def serialize_restaurant_policy(policy: Optional[Dict[str, Any]]) -> str:
    """
    Tuần tự hóa một bản ghi của bảng `restaurant_policies` thành chuỗi biểu diễn có cấu trúc.

    Bảo toàn các thuộc tính:
    - Tiêu đề chính sách
    - Nhóm / phân loại quy định
    - Trạng thái hiệu lực
    - Nội dung điều khoản chi tiết

    Args:
        policy: Dictionary biểu diễn một dòng dữ liệu của restaurant_policies

    Returns:
        Chuỗi văn bản tuần tự hóa chính sách
    """
    if not policy or not isinstance(policy, dict):
        return ""

    title = str(policy.get("title") or "Quy định nhà hàng").strip()
    policy_type = str(policy.get("policy_type") or "Chung").strip()
    content = str(policy.get("content") or "Đang cập nhật nội dung quy định.").strip()

    # Chuyển đổi mã policy_type sang nhãn tiếng Việt dễ hiểu cho LLM
    type_labels = {
        "voucher": "Khuyến mãi & Mã giảm giá",
        "refund": "Đổi trả món & Hoàn tiền",
        "table_booking": "Đặt bàn & Giữ chỗ",
        "allergen": "An toàn thực phẩm & Cảnh báo dị ứng",
        "outside_food": "Quy định mang đồ ăn ngoài",
        "general": "Quy định chung",
    }
    policy_label = type_labels.get(policy_type, policy_type.capitalize())

    is_active = policy.get("is_active", True)
    status_str = "Đang áp dụng" if is_active else "Tạm ngưng hiệu lực"

    serialized = (
        f"[CHÍNH SÁCH NHÀ HÀNG: {title}]\n"
        f"• Phân loại quy định: {policy_label} ({policy_type})\n"
        f"• Trạng thái: {status_str}\n"
        f"• Nội dung điều khoản: {content}"
    )
    return serialized.strip()
