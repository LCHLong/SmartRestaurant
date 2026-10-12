"""
slot_extractor.py
Trích xuất thực thể (slots) đặt bàn từ câu thoại của người dùng:
- Ngày, giờ, tính mơ hồ của giờ
- Số khách (xử lý người lớn + trẻ em)
- Tên và SĐT (chuẩn hoá SĐT Việt Nam)
- Yêu cầu đặc biệt (khu vực, ghế trẻ em, cửa sổ, dị ứng...)
- Phát hiện đổi ý giữa chừng (Slot correction)
- Phát hiện hủy / xác nhận
"""

import re
from typing import Optional, Dict, Any, Tuple
from tools.datetime_parser import parse_date, parse_time, validate_reservation_time

VN_MOBILE_PREFIXES = ('03', '05', '07', '08', '09')
VN_PHONE_REGEX = re.compile(r'(?:\+84[\s.-]?|0)[35789](?:[\s.-]?\d){8}\b')
LANDLINE_PHONE_REGEX = re.compile(r'(?:\+84[\s.-]?|0)2(?:[\s.-]?\d){9}\b')


def is_valid_vn_phone(phone: Optional[str]) -> bool:
    """
    Kiểm tra số điện thoại di động Việt Nam hợp lệ:
    - Đúng chuẩn 10 chữ số
    - Bắt đầu bằng một trong các đầu số hợp lệ: 03, 05, 07, 08, 09
    """
    if not phone or not isinstance(phone, str):
        return False
    digits = re.sub(r'[\s.-]', '', phone.strip())
    if digits.startswith("+84"):
        digits = "0" + digits[3:]
    return bool(re.match(r'^0[35789]\d{8}$', digits))


def extract_phone(text: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Trích xuất và chuẩn hoá số điện thoại Việt Nam (hỗ trợ dấu cách, chấm, gạch ngang).
    Returns:
        (phone_normalized, warning_message)
    """
    # 1. Kiểm tra số máy bàn cố định
    if LANDLINE_PHONE_REGEX.search(text):
        return None, "Số bạn vừa nhập là số máy bàn cố định. Nhà hàng cần số điện thoại di động 10 số (bắt đầu bằng 03, 05, 07, 08, 09) để gửi tin nhắn xác nhận qua SMS/Zalo ạ."

    # 2. Tìm số điện thoại di động 10 số hợp lệ
    m = VN_PHONE_REGEX.search(text)
    if m:
        phone_raw = m.group(0)
        digits = re.sub(r'[\s.-]', '', phone_raw)
        if digits.startswith("+84"):
            digits = "0" + digits[3:]
        if is_valid_vn_phone(digits):
            return digits, None

    # 3. Tìm chuỗi số bất thường hoặc số điện thoại bị thiếu/thừa số (VD: 0987321, 123456)
    potential_phone_patterns = [
        r'\b(?:\+84|0)(?:[\s.-]?\d){4,13}\b',
        r'\b\d{5,15}\b'
    ]
    for pat in potential_phone_patterns:
        matches = re.findall(pat, text)
        for candidate in matches:
            cand_digits = re.sub(r'[\s.-]', '', candidate)
            if cand_digits.startswith("+84"):
                cand_digits = "0" + cand_digits[3:]
            if cand_digits in ("2025", "2026", "2027", "2028"):
                continue
            if 1 <= len(cand_digits) <= 2 and 1 <= int(cand_digits) <= 50:
                continue
            if not is_valid_vn_phone(cand_digits):
                return None, "Số điện thoại chưa đúng định dạng di động 10 số của Việt Nam (VD: 0912345678). Bạn nhập lại giúp Aria nhé!"

    return None, None


def extract_guests(text: str) -> Tuple[Optional[int], Optional[str]]:
    """
    Trích xuất số lượng khách.
    Hỗ trợ trường hợp: "2 người lớn và 1 trẻ em" -> tổng 3 khách, ghi chú "1 trẻ em".
    Hỗ trợ khoảng: "3-4 người", "4-6 khách" -> cận trên để đảm bảo xếp bàn vừa vặn.
    Hỗ trợ câu trả lời ngắn: "2", "4", "4 ng", "4 người", "đi 4", "-2", "0"...
    Hỗ trợ phát hiện số khách âm hoặc bằng 0 (<= 0) để hệ thống cảnh báo và từ chối.
    
    Returns:
        (total_guests: int or None, note: str or None)
    """
    text_lower = text.lower().strip()

    # 1. Trường hợp: X người lớn và Y trẻ em / em bé / bé / nhỏ
    adult_child_pattern = r'([-–—]?\d+)\s*(?:người\s*lớn|lớn).*?(?:và|\+|,)?\s*([-–—]?\d+)\s*(?:trẻ\s*em|em\s*bé|bé|nhỏ)'
    m_combo = re.search(adult_child_pattern, text_lower)
    if m_combo:
        adults = int(m_combo.group(1).replace('–', '-').replace('—', '-'))
        children = int(m_combo.group(2).replace('–', '-').replace('—', '-'))
        total = adults + children
        note = f"{children} trẻ em"
        return total, note

    # 2. Trường hợp khoảng số lượng khách: "3-4 người", "3 - 5 khách" -> lấy cận trên để xếp bàn đủ chỗ
    range_pattern = r'(\d+)\s*[-–—]\s*(\d+)\s*(?:người|khách|pax|chỗ|suất|bạn|ng)'
    m_range = re.search(range_pattern, text_lower)
    if m_range:
        low = int(m_range.group(1))
        high = int(m_range.group(2))
        val = max(low, high)
        if 1 <= val <= 100:
            return val, None

    # 3. Trường hợp số âm độc lập: "-2", "-2 người", "-5 khách", "–3"
    m_single_neg = re.search(r'^(?:dạ|khoảng|tầm|đi|đặt|cho)?\s*[-–—]\s*(\d{1,2})\s*(?:người|khách|pax|chỗ|bạn|ng|ạ|nhe|nhé|nha)?$', text_lower)
    if m_single_neg:
        return -int(m_single_neg.group(1)), None

    # 4. Trường hợp số 0 độc lập: "0", "0 người", "0 khách", "không ai"
    m_single_zero = re.search(r'^(?:dạ|khoảng|tầm|đi|đặt|cho)?\s*0\s*(?:người|khách|pax|chỗ|bạn|ng|ạ|nhe|nhé|nha)?$', text_lower)
    if m_single_zero:
        return 0, None
    if re.search(r'^(?:dạ\s*)?không\s*(?:có\s*)?(?:ai|người\s*nào)$', text_lower):
        return 0, None

    # 5. Các mẫu số khách âm trong câu: "-2 người", "cho -2 khách", "bàn -3 chỗ"...
    neg_patterns = [
        r'(?:^|[^\d])[-–—]\s*(\d+)\s*(?:người|khách|pax|chỗ|suất|bạn|ng|thành\s*viên|đứa)',
        r'bàn\s*[-–—]\s*(\d+)',
        r'nhóm\s*(?:có\s*)?[-–—]\s*(\d+)',
        r'đi\s*[-–—]\s*(\d+)',
        r'([-–—]\s*\d+)\s*(?:người\s*lớn|lớn)',
    ]
    for pat in neg_patterns:
        m = re.search(pat, text_lower)
        if m:
            raw_val = m.group(1).replace(' ', '').replace('–', '-').replace('—', '-')
            if raw_val.startswith('-'):
                return int(raw_val), None
            return -int(raw_val), None

    # 6. Các mẫu số khách bằng 0 trong câu: "0 người", "cho 0 khách", "không người", "bàn 0 người"...
    zero_patterns = [
        r'(?:^|[^\d])0\s*(?:người|khách|pax|chỗ|suất|bạn|ng|thành\s*viên|đứa)',
        r'bàn\s*0\s*(?:người|khách|chỗ)?',
        r'nhóm\s*(?:có\s*)?0',
        r'đi\s*0\s*(?:người|khách)?',
        r'(?:^|[^\d])không\s+(?:người|khách)',
    ]
    for pat in zero_patterns:
        m = re.search(pat, text_lower)
        if m:
            return 0, None

    # 7. Trường hợp câu trả lời chỉ có số dương: "2", "4", "4 ng", "khoảng 4", "tầm 4"
    single_num = re.search(r'^(?:dạ|khoảng|tầm|đi|đặt|cho)?\s*(\d{1,2})\s*(?:người|khách|pax|chỗ|bạn|ng|ạ|nhe|nhé|nha)?$', text_lower)
    if single_num:
        val = int(single_num.group(1))
        if 1 <= val <= 100:
            return val, None

    # 8. Các mẫu số lượng khách thông thường
    patterns = [
        r'(\d+)\s*(?:người|khách|pax|chỗ|suất|bạn|ng|thành\s*viên|đứa)',
        r'bàn\s*(\d+)\s*(?:người|khách|chỗ)?',
        r'nhóm\s*(?:có\s*)?(\d+)',
        r'đi\s*(\d+)\s*(?:người|khách)?',
        r'(\d+)\s*(?:người\s*lớn|lớn)',
    ]

    for pat in patterns:
        m = re.search(pat, text_lower)
        if m:
            val = int(m.group(1))
            if 1 <= val <= 100:
                return val, None

    # 9. Mẫu đổi ý: "đi X người thôi", "đổi thành X người"
    correction_patterns = [
        r'(?:đi|thành|đổi\s*thành|thôi|chỉ)\s*(\d+)\s*(?:người|khách)?',
    ]
    for pat in correction_patterns:
        m = re.search(pat, text_lower)
        if m:
            val = int(m.group(1))
            if 1 <= val <= 100:
                return val, None

    return None, None


def extract_special_requests(text: str) -> list[str]:
    """Trích xuất yêu cầu đặc biệt về chỗ ngồi, tiện ích."""
    text_lower = text.lower()
    requests = []

    if "ngoài trời" in text_lower or "outdoor" in text_lower or "thoáng" in text_lower:
        requests.append("khu vực ngoài trời")
    elif "trong nhà" in text_lower or "phòng lạnh" in text_lower or "máy lạnh" in text_lower:
        requests.append("khu vực trong nhà")

    if "ghế trẻ em" in text_lower or "ghế ăn dặm" in text_lower or "ghế cho bé" in text_lower:
        requests.append("ghế trẻ em")

    if "cửa sổ" in text_lower or "view đẹp" in text_lower or "gần cửa sổ" in text_lower:
        requests.append("gần cửa sổ")

    if "yên tĩnh" in text_lower or "riêng tư" in text_lower:
        requests.append("chỗ yên tĩnh")

    if "sinh nhật" in text_lower or "birthday" in text_lower:
        requests.append("tiệc sinh nhật")

    if "kỷ niệm" in text_lower or "anniversary" in text_lower:
        requests.append("kỷ niệm")

    if "phòng riêng" in text_lower or "phòng vip" in text_lower:
        requests.append("phòng riêng")

    if "dị ứng" in text_lower:
        m = re.search(r'dị ứng\s*([^,\.\n]+)', text_lower)
        if m:
            requests.append(f"dị ứng: {m.group(1).strip()}")

    return requests


def extract_name(text: str, current_state: dict, phone_found: Optional[str] = None, email_found: Optional[str] = None) -> Optional[str]:
    """
    Trích xuất tên người dùng từ tin nhắn:
    - "Mình là Nam"
    - "Tên tôi là Nguyễn Văn A"
    - "Tôi là Lan"
    - "Tên Nam, 0912345678"
    - "Hùng, 0999999999, vuhung@gmail.com"
    - Trả lời tên ngắn khi đang được hỏi tên
    """
    text_clean = text
    if phone_found:
        text_clean = text_clean.replace(phone_found, " ").strip()
    if email_found:
        text_clean = text_clean.replace(email_found, " ").strip()
    # Loại bỏ cả email format nếu có còn sót
    text_clean = re.sub(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}', ' ', text_clean)

    def _sanitize(name_str: str) -> Optional[str]:
        # Bỏ các hư từ xưng hô / trợ từ cuối câu: nha, nhé, nhe, ạ, nè, đây, ơi, nhá, với, giúp
        cleaned = re.sub(r'\b(?:nha|nhé|nhe|ạ|nè|đây|ơi|nhá|với|giúp)\b', '', name_str, flags=re.IGNORECASE)
        # Loại bỏ triệt để các dấu câu thừa như dấu phẩy, chấm, hai chấm...
        clean = re.sub(r'[,.:;!?~_\-/\(\)\[\]"\'`]+', ' ', cleaned)
        words = [w.strip() for w in clean.split() if w.strip()]
        if not words:
            return None
        formatted = " ".join(w.capitalize() for w in words)
        if 2 <= len(formatted) <= 40:
            return formatted
        return None

    # Pattern rõ ràng: "mình là...", "tên là...", "tên: ...", "tôi tên...", "đặt cho...", "anh/chị..."
    intro_patterns = [
        r'(?:tên\s*(?:khách|người\s*đặt)?\s*(?:là|:|\s)\s*|tôi\s*tên\s*(?:là|:)?\s*|mình\s*tên\s*(?:là|:)?\s*|em\s*tên\s*(?:là|:)?\s*|anh\s*tên\s*(?:là|:)?\s*|chị\s*tên\s*(?:là|:)?\s*|tên\s*mình\s*là\s*|tên\s*tôi\s*là\s*|mình\s*là\s*|tôi\s*là\s*|em\s*là\s*|anh\s*là\s*|chị\s*là\s*|đặt\s*cho\s+)([A-ZÀ-Ỹa-zà-ỹ\s]{2,30})',
        r'(?:anh|chị)\s+([A-ZÀ-Ỹa-zà-ỹ]{2,20})',
    ]
    for pat in intro_patterns:
        m = re.search(pat, text_clean, re.IGNORECASE)
        if m:
            raw_name = m.group(1).strip()
            # Cắt trước dấu phẩy, chấm hoặc các từ bắt đầu phần đặt bàn / sđt / email
            parts = re.split(r'[,.\d]|\b(?:đặt|bàn|sđt|số|điện\s*thoại|phone|email|mail|nhé|nha|ạ|vào|ngày|lúc)\b', raw_name, flags=re.IGNORECASE)
            name = _sanitize(parts[0])
            if name:
                return name

    # Mẫu họ tên đứng đầu câu trước dấu phẩy và SĐT/email (VD: "Lê Chí Hoàng Long, 0987654321...")
    leading_match = re.match(r'^\s*([A-ZÀ-Ỹa-zà-ỹ\s]{2,30})\s*,\s*(?:\+84|0|\d)', text)
    if leading_match:
        leading_cand = _sanitize(leading_match.group(1))
        if leading_cand and not any(w.lower() in ("đặt", "bàn", "cho", "mình", "tôi", "ngày", "lúc", "giờ", "quán") for w in leading_cand.split()):
            return leading_cand

    # Nếu đang thiếu tên và câu thoại ngắn (1-4 từ), không chứa các từ khoá ngày/giờ/đặt bàn/món ăn
    slots = current_state.get("slots", {})
    if not slots.get("customer_name") and not current_state.get("user_info", {}).get("is_logged_in"):
        if "?" in text or "¿" in text:
            return None

        # Loại bỏ cụm từ chỉ số lượng khách trước khi trích xuất tên ngắn (hỗ trợ "4 người, Hùng", "Hùng 4 người")
        text_without_guests = re.sub(r'\b(?:khoảng|tầm|chừng|cỡ|đi|đặt|cho|bàn|nhóm)?\s*[-–—]?\d{1,2}\s*(?:người|khách|pax|chỗ|bạn|ng|lớn|trẻ\s*em|em\s*bé|bé)?\b', ' ', text_clean, flags=re.IGNORECASE)
        text_without_guests = re.sub(r'\b(?:khoảng|tầm|chừng|cỡ|đi|đặt|cho|bàn)\s*[-–—]?\d{1,2}\b', ' ', text_without_guests, flags=re.IGNORECASE)

        clean_text = re.sub(r'[,.:;!?~_\-/\(\)\[\]"\'`]+', ' ', text_without_guests).strip()
        # Cắt bỏ các từ nhãn sđt / email nếu còn sót sau khi đã tách phone/email
        clean_text = re.split(r'\b(?:sđt|sdt|số|điện\s*thoại|phone|email|mail|đt)\b', clean_text, flags=re.IGNORECASE)[0].strip()
        words = [w for w in clean_text.split() if w]
        if 1 <= len(words) <= 4:
            non_name_keywords = {
                # Từ để hỏi & câu hỏi
                "gì", "sao", "nào", "đâu", "ai", "mấy", "bao", "nhiêu", "thế", "chưa", "hả", "hử", "nhỉ",
                "phải", "không", "ko", "k", "hông", "hổng", "chi", "được", "ạ",
                # Món ăn & ẩm thực & menu
                "món", "menu", "thực", "đơn", "ăn", "uống", "bán", "nấu", "nướng", "lẩu", "xào", "chiên",
                "hấp", "quán", "nhà", "hàng", "bếp", "combo", "set", "rượu", "bia", "nước", "trà", "giá",
                "tiền", "bill", "chay", "mặn", "hải", "sản", "thịt", "cá", "gà", "bò", "heo", "mực",
                "tôm", "ốc", "cua", "rau", "canh", "cơm", "mì", "bún", "phở", "bánh", "ngon", "cay", "ngọt",
                # Điều hướng & hành động
                "đặt", "bàn", "ok", "oke", "okay", "hủy", "thôi", "khoan", "dừng", "tạm", "chờ", "đợi",
                "sau", "xem", "tư", "vấn", "gợi", "ý", "hỏi", "tìm", "chọn", "giúp", "alo", "chào", "hello",
                "hi", "ơi", "nhé", "nha", "đây", "nè", "chỗ", "người", "khách", "giờ", "hôm", "tối",
                "trưa", "sáng", "chiều", "ngày", "khoảng", "tầm", "chừng", "cỡ",
                # Tiện ích & dịch vụ
                "xe", "đỗ", "gửi", "wifi", "pass", "mật", "khẩu", "cửa", "mở", "đóng", "phòng", "vip", "hút", "thuốc"
            }
            # Nếu chỉ có 1 từ mà là "mai" (ngày mai) -> không phải tên
            if len(words) == 1 and words[0].lower() == "mai":
                return None
            if not any(w.lower() in non_name_keywords for w in words) and not re.search(r'\d', clean_text):
                return _sanitize(" ".join(words))

    return None


def is_confirmation(message: str) -> bool:
    """Kiểm tra câu đồng ý xác nhận đặt bàn."""
    msg = message.lower().strip()
    # Loại bỏ các từ phủ định
    if any(k in msg for k in ["không", "chưa", "hủy", "thôi", "đổi", "sửa", "khoan"]):
        return False

    confirms = [
        "ok", "oke", "okay", "được", "đồng ý", "xác nhận", "yes", "yep",
        "đặt đi", "đặt thôi", "chốt", "chốt luôn", "đúng rồi", "chuẩn rồi",
        "đồng ý nhé", "xác nhận nhé", "đặt bàn nha", "nhất trí", "đặt luôn",
        "tiến hành đi", "tiến hành", "chốt đơn", "đúng rồi nha", "ok em", "chuẩn",
        "chính xác", "duyệt", "dạ", "ừ", "uh", "uk", "vâng", "dạ vâng", "lên đơn",
        "chốt đi", "chốt nha", "được nha", "được nhé", "ok nha", "ok nhé", "rồi nhé",
        "đúng nhé", "tạo đơn", "đặt giúp"
    ]
    words = set(re.findall(r'\b\w+\b', msg))
    for c in confirms:
        if " " in c:
            if c in msg:
                return True
        else:
            if c in words or msg == c:
                return True
    return False


def is_cancellation(message: str) -> bool:
    """Kiểm tra câu hủy / tạm dừng / thoát quy trình đặt bàn (Proposal T17)."""
    msg = message.lower().strip()

    # Loại trừ trường hợp câu xác nhận tiến hành
    if any(k in msg for k in ["đặt thôi", "chốt thôi", "tiến hành thôi", "ăn thôi"]):
        return False

    cancels = [
        "hủy", "thôi", "không đặt", "cancel", "không cần", "bỏ qua",
        "không đặt nữa", "thôi không đặt", "thôi phiền quá", "dừng lại",
        "để khi khác", "để dịp khác", "khoan đặt", "khoan đã", "khoan hãy",
        "tạm dừng", "dừng đặt", "tạm hoãn", "chưa muốn đặt", "chưa đặt",
        "để sau", "để lúc khác", "khi khác đặt", "từ từ đã", "từ từ hãy",
        "chưa cần đặt", "chưa cần", "quay lại menu", "về menu", "về trang chủ",
        "thoát", "tư vấn món trước", "xem menu trước", "xem thực đơn trước",
        "tư vấn trước", "xem món trước", "xem món đã"
    ]
    if any(c in msg for c in cancels):
        return True

    # Kiểm tra các từ dừng riêng biệt
    if re.search(r'\b(khoan|dừng|thôi|thoát)\b', msg):
        return True

    return False


def is_additional_booking_intent(message: str) -> bool:
    """
    Phát hiện ý định đặt thêm bàn / đặt thêm một đơn khác khi đang có bàn:
    VD:
    - 'Ngoài ra tôi còn muốn đặt thêm bàn vào ngày mốt lúc 21 giờ'
    - 'Tôi muốn đặt thêm 1 bàn nữa vào thứ 7'
    - 'Đặt thêm một bàn vào ngày mốt'
    - 'Thêm một bàn nữa lúc 19h'
    - 'Đặt thêm bàn nữa'
    - 'Còn muốn đặt thêm'
    """
    msg = message.lower().strip()
    patterns = [
        r'(?:ngoài\s*ra|tiện\s*thể|với\s*lại).*?(?:đặt|thêm|bàn)',
        r'(?:muốn\s*)?đặt\s*thêm\s*(?:một\s*|1\s*)?(?:bàn|chỗ|suất)?',
        r'thêm\s*(?:một\s*|1\s*)?bàn\s*(?:nữa)?',
        r'đặt\s*(?:một\s*|1\s*)?bàn\s*(?:nữa|khác)',
        r'(?:còn|muốn)\s*đặt\s*thêm',
    ]
    return any(re.search(pat, msg) for pat in patterns)


def is_reschedule_intent(message: str) -> bool:
    """
    Phát hiện ý định đổi lịch / dời giờ của đơn hiện tại:
    VD: 'Đổi sang ngày mai 19h', 'Dời lịch sang thứ 7', 'Chuyển sang 20h', 'Đổi giờ thành 21h'
    """
    msg = message.lower().strip()
    keywords = [
        "đổi sang", "đổi lịch", "đổi giờ", "dời sang", "dời lịch",
        "chuyển sang", "chuyển lịch", "sửa lại", "thay vì", "đổi thành",
        "chuyển thành", "sửa thành", "đổi ngày", "đổi thời gian"
    ]
    return any(k in msg for k in keywords)


def check_schedule_choice(message: str) -> str:
    """
    Phân loại phản hồi của khách khi đang có pending_schedule_choice:
    Returns: 'RESCHEDULE' | 'ADD_NEW' | 'KEEP_CURRENT' | 'UNKNOWN'
    """
    msg = message.lower().strip()
    if any(k in msg for k in ["đổi", "dời", "chuyển", "thay", "lịch mới", "giờ mới", "ngày mới"]):
        return "RESCHEDULE"
    if any(k in msg for k in ["thêm", "đặt thêm", "thêm bàn", "bàn nữa", "mới", "tạo mới", "cả hai", "hai bàn", "thêm đơn"]):
        return "ADD_NEW"
    if any(k in msg for k in ["giữ", "cũ", "không đổi", "ko đổi", "như cũ", "đơn cũ", "giữ nguyên"]):
        return "KEEP_CURRENT"
    return "UNKNOWN"


def is_phone_inquiry(message: str) -> bool:
    """
    Phát hiện câu hỏi của khách về việc tại sao cần số điện thoại / thông tin liên hệ:
    VD: 'Tại sao cần số điện thoại?', 'Sao phải đưa sđt vậy bạn?', 'Cần số đt làm gì?'
    """
    msg = message.lower().strip()
    keywords = [
        "tại sao cần", "sao cần", "sao phải", "cần sđt làm gì", "cần số điện thoại làm gì",
        "cần số đt làm gì", "không cho sđt", "không đưa sđt", "ko cho sđt", "bắt buộc phải có sđt",
        "sao lại xin sđt", "sao xin số", "lấy số điện thoại làm gì", "lấy sđt làm gì",
        "không có sđt", "ko có sđt", "không để sđt", "ko để sđt"
    ]
    return any(k in msg for k in keywords)


def check_side_query_intent(message: str) -> Tuple[bool, str]:
    """
    Phân loại câu hỏi phụ / tư vấn trong khi đang trong flow đặt bàn:
    Returns:
        (is_side_query: bool, query_type: 'FACILITY_INFO' | 'MENU_CONSULTATION' | 'NONE')
    """
    msg = message.lower().strip()

    # 1. Câu hỏi về thông tin / tiện ích / dịch vụ nhà hàng (Facility & Restaurant Info)
    facility_keywords = [
        "đỗ xe", "gửi xe", "bãi xe", "bãi đỗ", "bãi giữ", "chỗ để xe", "ô tô", "xe máy",
        "wifi", "wi-fi", "mật khẩu wifi", "pass wifi",
        "mở cửa", "đóng cửa", "mấy giờ mở", "mấy giờ đóng", "giờ hoạt động", "giờ mở",
        "địa chỉ", "ở đâu", "vị trí", "đường nào", "quán ở", "chỗ nào", "tìm đường",
        "phòng riêng", "phòng vip", "hút thuốc", "ghế trẻ em", "ghế em bé", "ghế ăn dặm",
        "hotline", "số điện thoại nhà hàng", "sđt nhà hàng", "liên hệ", "vat", "hóa đơn"
    ]
    if any(k in msg for k in facility_keywords):
        return True, "FACILITY_INFO"

    # 2. Câu hỏi / yêu cầu tư vấn về thực đơn / món ăn / giá cả (Menu & Culinary Consultation)
    menu_phrases = [
        "món", "thực đơn", "menu", "ăn gì", "uống gì", "món gì", "có món", "món ngon",
        "đặc sản", "best seller", "bán chạy", "nổi tiếng", "ngon nhất", "bảng giá",
        "giá bao nhiêu", "bao nhiêu tiền", "nhiêu tiền", "giá cả", "giá tiền", "giá sao",
        "hải sản", "món chay", "tráng miệng", "khai vị", "đồ uống", "nước ngọt",
        "phần ăn", "khuyến mãi", "ưu đãi", "giảm giá", "voucher",
        "tư vấn món", "tư vấn giúp", "tư vấn cho", "gợi ý món", "cho xem menu", "xem menu",
        "cho xem thực đơn", "xem thực đơn", "quán bán gì", "có gì ăn", "có gì ngon"
    ]
    if any(k in msg for k in menu_phrases):
        return True, "MENU_CONSULTATION"

    # Các từ món ăn ngắn cần khớp ranh giới từ (tránh "gà" trong "ngày", "bò" trong "bóng")
    if re.search(r'\b(lẩu|nướng|bò|gà|heo|cá|mực|tôm|cua|chay|bia|rượu|combo|set)\b', msg):
        return True, "MENU_CONSULTATION"

    # 3. Dấu hiệu câu hỏi nghi vấn nói chung
    if "?" in msg or "¿" in msg:
        return True, "MENU_CONSULTATION"

    question_markers = ["thế nào", "sao thế", "không ạ", "ko ạ", "được không", "được ko", "hả em", "hả quán"]
    if any(q in msg for q in question_markers):
        return True, "MENU_CONSULTATION"

    return False, "NONE"


EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')


def extract_email(text: str) -> Optional[str]:
    """Trích xuất địa chỉ email từ tin nhắn."""
    m = EMAIL_REGEX.search(text)
    if m:
        return m.group(0).lower().strip()
    return None


def extract_all_slots(message: str, current_state: dict) -> Dict[str, Any]:
    """
    Trích xuất toàn bộ slot có trong câu của người dùng.
    """
    extracted: Dict[str, Any] = {}
    pending_hour = current_state.get("slots", {}).get("pending_ambiguous_hour")

    # 1. Ngày
    date_str, date_ambiguous = parse_date(message)
    if date_str:
        extracted["date"] = date_str
        extracted["reservation_date"] = date_str

    # 2. Giờ
    time_str, time_ambiguous, amb_hour = parse_time(message, pending_ambiguous_hour=pending_hour)
    if time_str:
        extracted["time"] = time_str
        extracted["reservation_time"] = time_str
        extracted["time_ambiguous"] = False
        extracted["pending_ambiguous_hour"] = None
    elif time_ambiguous:
        extracted["time_ambiguous"] = True
        extracted["pending_ambiguous_hour"] = amb_hour or 7

    # 2.1 Kiểm tra tính hợp lệ ngày giờ (nếu có đủ date và time)
    if extracted.get("date") and extracted.get("time"):
        extracted["target_iso"] = f"{extracted['date']}T{extracted['time']}:00+07:00"
        is_val, err_code, err_msg = validate_reservation_time(extracted["date"], extracted["time"])
        if not is_val and err_code == "PAST_TIME":
            extracted["past_time_warning"] = err_msg
            extracted["time_in_past"] = True
        else:
            extracted["time_in_past"] = False

    # 3. Số khách
    guests, child_note = extract_guests(message)
    if guests is not None:
        extracted["guests"] = guests
        extracted["party_size"] = guests
        if guests == 0:
            extracted["guests_warning"] = "Dạ, nhà hàng nhận đặt bàn tối thiểu từ 1 người trở lên ạ. Quý khách vui lòng cung cấp số lượng người đi cùng nhé!"
            extracted["is_valid_guests"] = False
        elif guests < 0:
            extracted["guests_warning"] = "Dạ, số lượng khách đặt bàn phải từ 1 người trở lên ạ. Quý khách vui lòng cho Aria biết chính xác số người trong nhóm nhé!"
            extracted["is_valid_guests"] = False
        else:
            extracted["is_valid_guests"] = True

    # 4. Số điện thoại
    phone, phone_warning = extract_phone(message)
    if phone:
        extracted["customer_phone"] = phone
    if phone_warning:
        extracted["phone_warning"] = phone_warning

    # 5. Email
    email = extract_email(message)
    if email:
        extracted["customer_email"] = email

    # 6. Tên
    name = extract_name(message, current_state, phone, email)
    if name:
        extracted["customer_name"] = name

    # 7. Yêu cầu đặc biệt
    specials = extract_special_requests(message)
    if child_note:
        specials.append(child_note)
    if specials:
        extracted["special_requests"] = ", ".join(specials)

    return extracted
