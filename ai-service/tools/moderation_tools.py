"""
moderation_tools.py
Bộ xử lý kiểm duyệt nội dung (Toxicity Moderation) & Chuyển tiếp khẩn cấp Quản lý (Manager Escalation):
- SPEC-MOD-05 (TC-SEC-02): Phòng thủ trước ngôn từ công kích, xúc phạm, tục tĩu hoặc khiêu khích.
- SPEC-MOD-06 (TC-SUP-10): Nhận diện sự cố dịch vụ khẩn cấp (chờ món quá lâu, phục vụ tệ...) và kích hoạt cảnh báo đỏ (Red Alert) tới Quản lý ca trực.
"""

import re
from typing import Tuple, List, Dict, Any, Optional

# Phản hồi chuẩn mực từ chối đối thoại độc hại (SPEC-MOD-05)
TOXICITY_MODERATION_ANSWER = (
    "Dạ, Aria rất hiểu cảm xúc của quý khách, tuy nhiên Aria xin phép từ chối phản hồi "
    "các nội dung có sử dụng ngôn từ thiếu chuẩn mực hoặc khiêu khích ạ. "
    "Kính mong quý khách giữ bình tĩnh và cùng trao đổi văn minh, lịch thiệp "
    "để Aria có thể lắng nghe và hỗ trợ quý khách tốt nhất ạ!"
)

# Phản hồi khẩn cấp giải cứu trải nghiệm dịch vụ & chuyển tiếp Quản lý (SPEC-MOD-05 & SPEC-MOD-06)
MANAGER_ESCALATION_ANSWER = (
    "Aria thành thật xin lỗi vì sự chậm trễ này ạ! Aria đã báo khẩn cấp tới Quản lý nhà hàng, "
    "Quản lý sẽ tới bàn của bạn trong ít phút để kiểm tra và xử lý ngay lập tức! "
    "Tín hiệu cảnh báo đỏ (Red Alert / Priority Alert) khẩn cấp đã được phát tới thiết bị của Quản lý ca trực. "
    "Quản lý đang di chuyển đến bàn hỗ trợ ngay. Kính mong bạn thông cảm cho sự bất tiện này của nhà hàng ạ! 🔔"
)

# Danh sách từ khóa và mẫu chửi bới, tục tĩu, khiêu khích (Toxicity Keywords)
TOXIC_KEYWORDS = [
    # Viết tắt / Tiếng lóng thô tục
    "đm", "dm", "đcm", "dcm", "đmm", "dmm", "đkm", "dkm", "vcl", "vcc", "vkl", "vl",
    "clgt", "mẹ kiếp", "đậu má", "đụ má", "đụ mẹ", "địt mẹ", "địt bà", "địt con mẹ",
    # Từ ngữ thô tục cơ bản
    "địt", "đụ", "lồn", "cặc", "buồi", "dái", "đéo", "đếch",
    # Chửi bới, xúc phạm nhân phẩm
    "khốn nạn", "chó chết", "chó đẻ", "đồ chó", "thằng chó", "con chó", "đồ ngu",
    "óc chó", "óc lợn", "con bot ngu", "bot ngu", "mất dạy", "súc vật", "con đĩ",
    "thằng khốn", "mẹ mày", "mả cha", "mả mẹ", "lũ khốn",
    # Cụm từ công kích chất lượng kèm tục tĩu
    "như hạch", "như rác", "như lồn", "như cặc", "như cc", "như cl", "cái cc", "cái cl", "quán như cc", "quán như cl",
    # Đuổi thô lỗ
    "cút đi", "cút mẹ", "cút xéo",
    # Tiếng Anh thô tục
    "fuck", "fucking", "shit", "bitch", "bastard", "asshole"
]


def is_toxic_message(message: str) -> Tuple[bool, List[str]]:
    """
    Kiểm tra xem câu thoại có chứa ngôn từ độc hại, chửi bới, xúc phạm hay không (SPEC-MOD-05).
    Returns:
        Tuple[bool, List[str]]: (có vi phạm không, danh sách từ khóa khớp)
    """
    if not message or not message.strip():
        return False, []

    msg = message.lower().strip()
    matched = []

    for kw in TOXIC_KEYWORDS:
        # Sử dụng boundary hoặc ký tự biên để tránh match nhầm các từ thực đơn hợp lệ (vd: chim cút, đậu phụ...)
        pattern = r"(?:\b|_|^|\s)" + re.escape(kw) + r"(?:\b|_|$|\s)"
        if re.search(pattern, msg):
            matched.append(kw)

    # Kiểm tra thêm mẫu chửi ghép: "như [từ thô tục]" hoặc "làm ăn như..."
    if not matched:
        if re.search(r"\b(như|làm ăn như|phục vụ như)\s+(hạch|rác|cc|cl|cặc|lồn|shit)\b", msg):
            matched.append("toxic_phrase")

    return len(matched) > 0, matched


def get_toxicity_moderation_response() -> str:
    """Trả về câu phản hồi chuẩn mực khi vi phạm kiểm duyệt ngôn từ."""
    return TOXICITY_MODERATION_ANSWER


def is_manager_escalation_requested(message: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Kiểm tra xem câu thoại có thuộc tình huống sự cố dịch vụ khẩn cấp cần gặp Quản lý hay không (SPEC-MOD-06).
    Các yếu tố cấu thành:
    - Chậm trễ món: 40 phút, 30 phút, hơn 40 phút, chưa có món, chờ quá lâu...
    - Sự cố phục vụ / bức xúc: phục vụ quá tệ, làm ăn quá kém, khiếu nại...
    - Yêu cầu Quản lý: gặp quản lý, gọi quản lý, cần gặp quản lý, quản lý đâu...
    - Tính khẩn cấp: ngay lập tức, gấp, ngay bây giờ...
    """
    if not message or not message.strip():
        return False, {}

    msg = message.lower().strip()

    # 1. Nhận diện Quản lý / Manager
    has_mgr_keyword = any(k in msg for k in [
        "quản lý", "quan ly", "manager", "chủ quán", "chu quan", "quản lý ca", "quan ly ca"
    ])
    has_mgr_action = any(k in msg for k in [
        "gặp", "gap", "gọi", "goi", "yêu cầu", "yeu cau", "cần", "can",
        "tìm", "tim", "báo", "bao", "nói chuyện", "noi chuyen", "ra đây", "ra day",
        "đâu rồi", "dau roi", "đâu", "dau"
    ])
    mgr_demanded = (has_mgr_keyword and has_mgr_action) or any(k in msg for k in [
        "gặp quản lý", "goi quan ly", "gọi quản lý", "can gap quan ly", "cần gặp quản lý",
        "yêu cầu gặp quản lý", "quản lý đâu", "quan ly dau", "quản lý ca", "quan ly ca",
        "nói chuyện với quản lý", "bao quan ly", "báo quản lý"
    ])

    # 2. Khẩn cấp / Ngay lập tức
    has_urgency = any(k in msg for k in [
        "ngay lập tức", "ngay lap tuc", "gấp", "gap", "khẩn cấp", "khan cap",
        "ngay bây giờ", "ngay bay gio", "ngay và luôn", "ngay va luon", "liền", "lien", "ngay"
    ])

    # 3. Chậm trễ / Đợi lâu / Chưa có món (đặc biệt mốc thời gian >= 20-40 phút)
    delay_regex = re.search(r"\b(1[5-9]|[2-9][0-9]|\d{3,})\s*(phút|p|m)\b", msg)
    has_delay_kw = any(k in msg for k in [
        "chưa có món", "chua co mon", "chưa lên món", "chua len mon", "món chưa ra", "mon chua ra",
        "chờ lâu", "cho lau", "đợi lâu", "doi lau", "quá lâu", "qua lau", "chờ mãi", "cho mai",
        "nửa tiếng", "nua tieng", "cả tiếng", "ca tieng", "chờ hơn", "đợi hơn"
    ])
    has_delay = bool(delay_regex or has_delay_kw)

    # 4. Bức xúc / Khiếu nại / Phục vụ tệ
    has_complaint = any(k in msg for k in [
        "phục vụ quá tệ", "phuc vu qua te", "quá tệ", "qua te", "quá kém", "qua kem",
        "làm ăn", "lam an", "bức xúc", "buc xuc", "thất vọng", "that vong", "thái độ", "thai do",
        "chất lượng", "chat luong", "khiếu nại", "khieu nai", "sự cố", "su co",
        "không chấp nhận được", "khong chap nhan duoc", "tệ hại", "te hai"
    ])

    # ── ĐIỀU KIỆN KÍCH HOẠT QUẢN LÝ (SPEC-MOD-06) ──
    # Quy tắc 1: Tái hiện đúng kịch bản TC-SUP-10 (Đòi gặp quản lý + sự cố phục vụ tệ/chậm trễ hoặc tính khẩn cấp)
    if mgr_demanded and (has_delay or has_complaint or has_urgency):
        return True, {
            "reason": "MANAGER_ESCALATION",
            "delay": has_delay,
            "complaint": has_complaint,
            "urgency": has_urgency,
            "mgr_demanded": True
        }

    # Quy tắc 2: Phục vụ tệ/sự cố nghiêm trọng + Chờ món lâu (>= 30-40 phút) + Yêu cầu giải quyết khẩn cấp
    if has_complaint and has_delay and has_urgency:
        return True, {
            "reason": "MANAGER_ESCALATION",
            "delay": True,
            "complaint": True,
            "urgency": True,
            "mgr_demanded": mgr_demanded
        }

    # Quy tắc 3: Bất kỳ yêu cầu gặp quản lý có tính chất khẩn cấp hoặc khiếu nại gay gắt
    if has_mgr_keyword and (has_urgency or has_complaint):
        return True, {
            "reason": "MANAGER_ESCALATION",
            "delay": has_delay,
            "complaint": has_complaint,
            "urgency": has_urgency,
            "mgr_demanded": True
        }

    return False, {}


def get_manager_escalation_response(table_id: str = "T01") -> str:
    """Trả về thông điệp phản hồi khẩn cấp cho Quản lý ca trực."""
    return MANAGER_ESCALATION_ANSWER
