"""
fallback_handler.py
Fallback 3 Tầng cho Aria khi RAG không tìm ra món phù hợp

Tầng 1: Nới lỏng filter (relax constraints)
Tầng 2: Best-Seller / Trending từ menu
Tầng 3: Human Handoff — yêu cầu gọi nhân viên
"""

from typing import Optional


# Thông báo Tầng 3 — Human Handoff
HUMAN_HANDOFF_MESSAGE = (
    "Dạ, yêu cầu của bạn có vẻ cần sự hỗ trợ trực tiếp từ nhân viên của chúng tôi ạ. "
    "Bạn có thể nhấn nút bên dưới để gọi nhân viên đến bàn nhé! 🔔"
)

HUMAN_HANDOFF_TRIGGER_KEYWORDS = [
    "gọi nhân viên", "gọi phục vụ", "gọi waiter", "call staff",
    "nói chuyện với người", "speak to human", "need help",
    "đặc biệt", "yêu cầu riêng", "custom order",
    "dị ứng nặng", "severe allergy", "vegan strict",
]


def is_human_handoff_requested(user_message: str) -> bool:
    """Kiểm tra xem user có yêu cầu gặp nhân viên không"""
    msg_lower = user_message.lower()
    return any(kw in msg_lower for kw in HUMAN_HANDOFF_TRIGGER_KEYWORDS)


def get_fallback_context(
    all_items: list[dict],
    tier: int = 2,
) -> dict:
    """
    Trả về fallback context theo tầng.

    Args:
        all_items: Toàn bộ menu items
        tier: 1=relax, 2=best-seller, 3=human handoff

    Returns:
        dict: { items: list, message_hint: str, is_handoff: bool }
    """
    if tier == 3 or not all_items:
        return {
            "items": [],
            "message_hint": HUMAN_HANDOFF_MESSAGE,
            "is_handoff": True,
        }

    if tier == 1:
        # Tầng 1: Lấy món theo danh mục phổ biến nhất
        return {
            "items": all_items[:8],
            "message_hint": "Dạ, quán có một số món đang rất được yêu thích, Aria xin giới thiệu ạ:",
            "is_handoff": False,
        }

    # Tầng 2: Best-Seller & Trending
    trending = [i for i in all_items if i.get("is_trending")]
    result = trending[:6] if len(trending) >= 3 else all_items[:6]

    return {
        "items": result,
        "message_hint": (
            "Dạ, quán chưa có món đúng 100% yêu cầu, nhưng Aria xin gợi ý "
            "các món đang được yêu thích nhất hôm nay ạ:"
        ),
        "is_handoff": False,
    }


def build_fallback_prompt_hint(fallback_info: dict, fallback_used: bool) -> str:
    """
    Build thêm hint cho system prompt khi fallback được kích hoạt.
    Giúp Gemini biết đây là kết quả fallback và phản hồi phù hợp.
    """
    if not fallback_used:
        return ""

    if fallback_info.get("is_handoff"):
        return "\n\n[INSTRUCTION: Đây là tình huống Human Handoff. Phản hồi lịch sự và đề nghị khách nhấn nút Gọi nhân viên.]"

    hint = fallback_info.get("message_hint", "")
    return f"\n\n[INSTRUCTION: Không tìm thấy món khớp hoàn toàn. Hãy thành thật nói với khách và gợi ý các món trending. Bắt đầu bằng: \"{hint}\"]"
