"""
grounded_rag_prompt.py
Thuộc Bước 3.3 - Pha 3: Grounded Prompt Template & Ràng Buộc Sinh Nội Dung Dựa Trên Thực Đơn
Theo Paper 01: Advancing RAG for Structured Enterprise Data (IIT Roorkee 2025 - Mục 3.6)
"""

from typing import List, Dict, Any, Optional

ARIA_GROUNDED_SYSTEM_PROMPT = """Bạn là Aria — trợ lý AI tư vấn ẩm thực thông minh và thân thiện của nhà hàng SmartRestaurant.

## VAI TRÒ & PHẠM VI HOẠT ĐỘNG
- Tư vấn, giải thích và gợi ý các món ăn từ thực đơn của nhà hàng cho khách đang ngồi tại bàn.
- Cung cấp thông tin chính xác về nguyên liệu, giá bán, mức độ cay, lượng calo và cảnh báo dị ứng.
- Tuyệt đối chỉ trao đổi các chủ đề liên quan đến ẩm thực, dịch vụ nhà hàng và trải nghiệm dùng bữa.

## NGUYÊN TẮC RÀNG BUỘC GROUNDED (TUÂN THỦ TUYỆT ĐỐI - ZERO HALLUCINATION)
1. CHỈ ĐƯỢC PHÉP tư vấn và đề xuất các món ăn nằm trong khối [DANH MỤC THỰC ĐƠN XÁC THỰC] được cung cấp bên dưới.
2. TUYỆT ĐỐI KHÔNG BỊA ĐẶT món ăn, KHÔNG tự sáng tác giá tiền hay bịa ra nguyên liệu không có trong thực đơn quán.
3. KHÔNG sử dụng kiến thức ẩm thực bên ngoài để giới thiệu các món không có trong danh mục xác thực.
4. NẾU KHÁCH HỎI MÓN KHÔNG CÓ TRONG THỰC ĐƠN:
   - Phải thông báo lịch sự, ngắn gọn rằng nhà hàng hiện chưa phục vụ món đó.
   - Sau đó gợi ý 1-2 món tương tự CÓ SẴN trong [DANH MỤC THỰC ĐƠN XÁC THỰC].
5. TUÂN THỦ AN TOÀN DỊ ỨNG:
   - Nếu khách nêu dị ứng, tuyệt đối không đề xuất bất kỳ món nào có chứa thành phần đó.
   - Nếu trường nguyên liệu/dị ứng ghi [Chưa có dữ liệu kiểm định], phải dặn khách: "Xin vui lòng hỏi lại nhân viên phục vụ để đảm bảo an toàn tuyệt đối".
6. TRÍCH DẪN GIÁ BÁN CHÍNH XÁC:
   - Luôn kèm theo giá bán chuẩn định dạng VNĐ (vd: 75.000đ hoặc 75.000 VNĐ).
7. LINH HOẠT THEO THỜI ĐIỂM & ĐÚNG Ý KHÁCH HÀNG:
   - Nếu khách hỏi món ăn/thức uống cho một buổi cụ thể (ví dụ: "buổi sáng", "ăn sáng", "buổi trưa", "buổi tối", "ăn khuya"), HÃY ƯU TIÊN GỢI Ý ĐÚNG CÁC MÓN PHÙ HỢP VỚI BUỔI MÀ KHÁCH HỎI (ví dụ: khách hỏi sáng thì gợi ý Phở bò, Bún bò, Mì quảng, Nước ép... có trong thực đơn).
   - TUYỆT ĐỐI KHÔNG BẮT BẺ hay nhắc thời gian thực tế để từ chối khách (ví dụ: KHÔNG ĐƯỢC NÓI "hiện tại là buổi chiều rồi" để bẻ lái sang món khác). Luôn tôn trọng yêu cầu của khách!

## ĐỊNH DẠNG TRẢ LỜI & GỢI Ý MÓN
Khi đề xuất món ăn cho khách, luôn dùng định dạng rõ ràng (mỗi món 1 dòng):
**[Tên món chính xác]** · [Giá tiền]đ · [Lý do gợi ý ngắn gọn 1 câu]

## PHONG CÁCH GIAO TIẾP
- Thân thiện, chu đáo, súc tích (mỗi phản hồi dưới 150 từ, tránh dài dòng).
- Xưng hô "Aria" hoặc "dạ/em", gọi khách là "anh/chị" hoặc "quý khách".
- Tự động phản hồi theo đúng ngôn ngữ của khách (Tiếng Việt hoặc Tiếng Anh).
"""


def _format_price(price: Any) -> str:
    """Định dạng giá tiền hiển thị dạng 75.000đ"""
    try:
        val = float(price)
        return f"{int(val):,}đ".replace(",", ".")
    except Exception:
        return f"{price}đ"


def format_grounded_candidates(candidates: List[Dict[str, Any]], max_items: int = 5) -> str:
    """
    Định dạng danh sách ứng viên Top-K đã qua Cross-Encoder Reranker thành khối kiến thức nền tảng Grounded.
    
    Args:
        candidates: Danh sách kết quả từ Lõi RAG (đã có name, price, rank, scores, item metadata).
        max_items: Số lượng món hiển thị tối đa trong prompt (mặc định 5 món).
        
    Returns:
        str: Đoạn văn bản cấu trúc chứa đầy đủ thông tin xác thực để inject vào LLM.
    """
    if not candidates:
        return "## DANH MỤC THỰC ĐƠN XÁC THỰC (GROUNDED KNOWLEDGE BASE)\n- [Không tìm thấy món ăn phù hợp với tiêu chí hiện tại]\n"

    lines = ["## DANH MỤC THỰC ĐƠN XÁC THỰC TỪ HỆ THỐNG (GROUNDED KNOWLEDGE BASE):"]
    lines.append("*(Chỉ được phép sử dụng các thông tin xác thực dưới đây, tuyệt đối không suy diễn)*\n")

    top_candidates = candidates[:max_items]
    for idx, c in enumerate(top_candidates, start=1):
        raw = c.get("item", c)
        name = c.get("name") or raw.get("name", "N/A")
        price = _format_price(raw.get("price", c.get("price", 0)))
        desc = raw.get("description") or c.get("description") or "Không có mô tả chi tiết"
        
        # Spice & Calo
        spice = raw.get("spice_level", c.get("spice_level", 0))
        spice_str = f"{spice}/5" if spice is not None else "0/5 (Không cay)"
        calo = raw.get("calories", c.get("calories"))
        calo_str = f"{calo} kcal" if calo else "Chưa công bố"

        # Ingredients & Allergens
        ingr = raw.get("ingredients") or c.get("ingredients")
        if isinstance(ingr, list) and ingr:
            ingr_str = ", ".join(ingr)
        elif isinstance(ingr, str) and ingr:
            ingr_str = ingr
        else:
            ingr_str = "Chưa ghi chú cụ thể (cần hỏi nhân viên nếu có yêu cầu đặc biệt)"

        allergens = raw.get("allergens") or c.get("allergens")
        if isinstance(allergens, list) and allergens:
            allergen_str = ", ".join(allergens)
        elif isinstance(allergens, str) and allergens:
            allergen_str = allergens
        else:
            allergen_str = "Không có cảnh báo dị ứng phổ biến"

        # Rerank Metadata
        final_rank = c.get("final_rank", idx)
        combined_score = c.get("combined_score")
        score_str = f" | Độ phù hợp: {combined_score:.4f}" if combined_score is not None else ""

        block = [
            f"[{idx}] **{name}** (Hạng #{final_rank}{score_str})",
            f"   • Giá niêm yết: {price}",
            f"   • Độ cay: {spice_str} | Năng lượng: {calo_str}",
            f"   • Thành phần nguyên liệu: {ingr_str}",
            f"   • Cảnh báo dị ứng: {allergen_str}",
            f"   • Mô tả hương vị: {desc[:150]}",
        ]
        lines.append("\n".join(block))

    return "\n\n".join(lines) + "\n"


def build_grounded_system_prompt(
    grounded_menu_text: str,
    dynamic_context: str = "",
    policies_context: str = "",
    fallback_hint: str = ""
) -> str:
    """
    Hợp nhất System Prompt chỉ thị, Khối thực đơn Grounded và Ngữ cảnh động tại bàn.
    """
    parts = [ARIA_GROUNDED_SYSTEM_PROMPT, "---"]
    
    if dynamic_context:
        parts.append(dynamic_context)
        parts.append("---")
        
    if grounded_menu_text:
        parts.append(grounded_menu_text)
        parts.append("---")
        
    if policies_context:
        parts.append(policies_context)
        parts.append("---")
        
    if fallback_hint:
        parts.append(fallback_hint)

    return "\n\n".join(parts)
