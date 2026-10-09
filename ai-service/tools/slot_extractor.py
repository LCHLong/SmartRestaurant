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
from tools.datetime_parser import parse_date, parse_time

VN_PHONE_REGEX = re.compile(r'(?:\+84[\s.-]?|0)[35789](?:[\s.-]?\d){8}\b')
LANDLINE_PHONE_REGEX = re.compile(r'(?:\+84[\s.-]?|0)2(?:[\s.-]?\d){9}\b')


def extract_phone(text: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Trích xuất và chuẩn hoá số điện thoại Việt Nam (hỗ trợ dấu cách, chấm, gạch ngang).
    Returns:
        (phone_normalized, warning_message)
    """
    # Kiểm tra số bàn cố định
    if LANDLINE_PHONE_REGEX.search(text):
        return None, "Số bạn vừa nhập là số máy bàn cố định. Nhà hàng cần số điện thoại di động 10 số (bắt đầu bằng 03, 05, 07, 08, 09) để gửi tin nhắn xác nhận qua SMS/Zalo ạ."

    m = VN_PHONE_REGEX.search(text)
    if m:
        phone_raw = m.group(0)
        digits = re.sub(r'[\s.-]', '', phone_raw)
        if digits.startswith("+84"):
            digits = "0" + digits[3:]
        if len(digits) == 10:
            return digits, None

    # Tìm chuỗi số bất thường nếu người dùng nhập số điện thoại sai định dạng (VD: 123456)
    number_sequences = re.findall(r'\b\d{5,15}\b', text)
    if number_sequences:
        for candidate in number_sequences:
            if candidate in ("2025", "2026", "2027", "2028"):
                continue
            if 1 <= int(candidate) <= 50:
                continue
            return None, "Số điện thoại chưa đúng định dạng di động 10 số của Việt Nam (VD: 0912345678). Bạn nhập lại giúp Aria nhé!"

    return None, None


def extract_guests(text: str) -> Tuple[Optional[int], Optional[str]]:
    """
    Trích xuất số lượng khách.
    Hỗ trợ trường hợp: "2 người lớn và 1 trẻ em" -> tổng 3 khách, ghi chú "1 trẻ em".
    Hỗ trợ câu trả lời ngắn: "2", "4", "4 ng", "4 người", "đi 4"...
    
    Returns:
        (total_guests: int or None, note: str or None)
    """
    text_lower = text.lower().strip()

    # Trường hợp: X người lớn và Y trẻ em / em bé / bé / nhỏ
    adult_child_pattern = r'(\d+)\s*(?:người\s*lớn|lớn).*?(?:và|\+|,)?\s*(\d+)\s*(?:trẻ\s*em|em\s*bé|bé|nhỏ)'
    m_combo = re.search(adult_child_pattern, text_lower)
    if m_combo:
        adults = int(m_combo.group(1))
        children = int(m_combo.group(2))
        total = adults + children
        note = f"{children} trẻ em"
        return total, note

    # Trường hợp câu trả lời chỉ có số (hoặc số kèm từ phụ nhẹ): "2", "4", "4 ng", "khoảng 4", "tầm 4"
    single_num = re.search(r'^(?:dạ|khoảng|tầm|đi|đặt|cho)?\s*(\d{1,2})\s*(?:người|khách|pax|chỗ|bạn|ng|ạ|nhe|nhé|nha)?$', text_lower)
    if single_num:
        val = int(single_num.group(1))
        if 1 <= val <= 100:
            return val, None

    # Các mẫu số lượng khách thông thường
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

    # Mẫu đổi ý: "đi X người thôi", "đổi thành X người"
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

    # Pattern rõ ràng: "mình là...", "tên là...", "tên: ...", "tôi tên...", "đặt cho..."
    intro_patterns = [
        r'(?:tên\s*(?:khách|người\s*đặt)?\s*(?:là|:|\s)\s*|tôi\s*tên\s*(?:là|:)?\s*|mình\s*tên\s*(?:là|:)?\s*|em\s*tên\s*(?:là|:)?\s*|tên\s*mình\s*là\s*|tên\s*tôi\s*là\s*|mình\s*là\s*|tôi\s*là\s*|em\s*là\s*|đặt\s*cho\s+)([A-ZÀ-Ỹa-zà-ỹ\s]{2,30})',
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

    # Nếu đang thiếu tên và câu thoại ngắn (1-4 từ), không chứa các từ khoá ngày/giờ/đặt bàn
    slots = current_state.get("slots", {})
    if not slots.get("customer_name") and not current_state.get("user_info", {}).get("is_logged_in"):
        clean_text = re.sub(r'[,.:;!?~_\-/\(\)\[\]"\'`]+', ' ', text_clean).strip()
        # Cắt bỏ các từ nhãn sđt / email nếu còn sót sau khi đã tách phone/email
        clean_text = re.split(r'\b(?:sđt|sdt|số|điện\s*thoại|phone|email|mail|đt)\b', clean_text, flags=re.IGNORECASE)[0].strip()
        words = [w for w in clean_text.split() if w]
        if 1 <= len(words) <= 4:
            ignore_keywords = [
                "đặt", "bàn", "ok", "được", "hủy", "thôi", "hôm", "mai", "giờ", "tối",
                "trưa", "sáng", "người", "khách", "không", "có", "chỗ", "alo"
            ]
            if not any(w.lower() in ignore_keywords for w in words) and not re.search(r'\d', clean_text):
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
    """Kiểm tra câu hủy quy trình đặt bàn (Proposal T17)."""
    msg = message.lower().strip()
    cancels = [
        "hủy", "thôi", "không đặt", "cancel", "không cần", "bỏ qua",
        "không đặt nữa", "thôi không đặt", "thôi phiền quá", "dừng lại",
        "để khi khác", "để dịp khác"
    ]
    return any(c in msg for c in cancels)


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

    # 2. Giờ
    time_str, time_ambiguous, amb_hour = parse_time(message, pending_ambiguous_hour=pending_hour)
    if time_str:
        extracted["time"] = time_str
        extracted["time_ambiguous"] = False
        extracted["pending_ambiguous_hour"] = None
    elif time_ambiguous:
        extracted["time_ambiguous"] = True
        extracted["pending_ambiguous_hour"] = amb_hour or 7

    # 3. Số khách
    guests, child_note = extract_guests(message)
    if guests:
        extracted["guests"] = guests

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
