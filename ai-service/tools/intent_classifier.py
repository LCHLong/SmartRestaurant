"""
intent_classifier.py
Bộ phân loại ý định hội thoại (Conversational Intent Classifier) cho trợ lý Aria:
- Nhận diện chính xác ý định tra cứu tiện ích nhà hàng (Facility & FAQ Inquiry).
- Phân biệt rõ giữa:
  * facility_inquiry (bãi đỗ/đậu xe, wifi, giờ mở cửa, địa chỉ, hotline, phòng riêng, ghế trẻ em...)
  * reservation (đặt bàn, giữ chỗ, đổi lịch...)
  * menu_consultation (hỏi món, gợi ý món, giá cả, thực đơn...)
  * human_handoff (yêu cầu gặp nhân viên / quản lý)
"""

import re
from enum import Enum
from typing import Dict, Any, Optional, List, Tuple


class IntentType(str, Enum):
    FACILITY_INQUIRY = "facility_inquiry"
    POLICY_INQUIRY = "policy_inquiry"
    CORKAGE_POLICY = "corkage_policy"
    RESERVATION = "reservation"
    MENU_CONSULTATION = "menu_consultation"
    HUMAN_HANDOFF = "human_handoff"
    GREETING = "greeting"
    UNKNOWN = "unknown"


PARKING_KEYWORDS = [
    "bãi đỗ xe", "bãi đậu xe", "đỗ xe", "đậu xe", "gửi xe",
    "chỗ để xe", "chỗ đỗ xe", "chỗ đậu xe", "chỗ gửi xe",
    "bãi xe", "bãi đỗ", "bãi đậu", "bãi giữ xe", "bãi giữ",
    "ô tô", "xe ô tô", "xe hơi", "xe máy", "trông xe", "giữ xe"
]

WIFI_KEYWORDS = [
    "wifi", "wi-fi", "mật khẩu wifi", "pass wifi", "mạng", "internet"
]

HOURS_KEYWORDS = [
    "mở cửa", "đóng cửa", "mấy giờ mở", "mấy giờ đóng", "giờ hoạt động", "giờ mở",
    "thời gian hoạt động", "mấy giờ quán mở", "mấy giờ quán đóng"
]

LOCATION_KEYWORDS = [
    "địa chỉ", "ở đâu", "vị trí", "đường nào", "quán ở", "chỗ nào", "tìm đường", "quán nằm ở"
]

CORKAGE_KEYWORDS = [
    "khui rượu", "phí khui rượu", "phí khui", "phụ thu rượu", "phụ thu mang rượu",
    "corkage", "corkage fee", "rượu mang vào", "rượu mang theo", "mang rượu",
    "mang rượu từ nhà", "rượu từ nhà", "tính phí khui", "mở rượu", "phí mở rượu",
    "phí mở", "đem rượu", "tự mang rượu", "uống rượu mang theo", "phụ thu đồ uống",
    "đồ uống ngoài", "đồ uống từ ngoài", "mang nước ngoài vào", "mang bia từ nhà",
    "phí mang rượu", "mang chai rượu", "mang 1 chai rượu", "mang rượu vang", "chai rượu vang từ nhà"
]

BIRTHDAY_KEYWORDS = [
    "bánh kem", "mang bánh kem", "bánh sinh nhật", "tổ chức sinh nhật",
    "tiệc sinh nhật", "trang trí sinh nhật", "hỗ trợ sinh nhật", "hỗ trợ trang trí",
    "trang trí", "giữ lạnh bánh kem", "giữ lạnh bánh", "giữ lạnh", "bảo quản bánh kem",
    "bảo quản bánh", "tủ lạnh", "giữ mát bánh kem", "giữ mát bánh", "bảo quản",
    "gói trang trí", "nến sinh nhật", "bong bóng sinh nhật", "đặt bàn sinh nhật"
]

TAKEAWAY_KEYWORDS = [
    "mua mang về", "mang về", "take away", "takeaway", "đóng gói mang về", "gói mang về", "đem về"
]

POLICY_SUB_INTENTS = {
    "corkage_policy": CORKAGE_KEYWORDS,
    "birthday_policy": BIRTHDAY_KEYWORDS,
    "takeaway_policy": TAKEAWAY_KEYWORDS,
}

FACILITY_SUB_INTENTS = {
    "faq_parking": PARKING_KEYWORDS,
    "faq_wifi": WIFI_KEYWORDS,
    "faq_hours": HOURS_KEYWORDS,
    "faq_location": LOCATION_KEYWORDS,
    "faq_baby_chair": ["ghế trẻ em", "ghế em bé", "ghế ăn dặm", "ghế cho bé"],
    "faq_vip_room": ["phòng riêng", "phòng vip", "phòng gia đình"],
    "faq_smoking": ["hút thuốc", "khu vực hút thuốc", "phòng hút thuốc"],
    "faq_contact": ["hotline", "số điện thoại nhà hàng", "sđt nhà hàng", "liên hệ", "số quán"],
    "faq_vat": ["vat", "hóa đơn", "hóa đơn đỏ", "xuất vat", "xuất hóa đơn"],
}

RESERVATION_KEYWORDS = [
    "đặt bàn", "đặt chỗ", "book bàn", "book table",
    "muốn đặt", "cho tôi đặt", "cho mình đặt", "cho em đặt",
    "đặt trước", "giữ bàn", "reserve", "tôi muốn đặt",
    "đặt tiệc", "đặt phòng", "muốn book", "đặt 1 bàn", "đặt 2 bàn"
]

HANDOFF_KEYWORDS = [
    "gặp nhân viên", "nói chuyện với nhân viên", "gặp người thật",
    "gặp lễ tân", "gặp quản lý", "khiếu nại", "gặp chăm sóc khách hàng"
]


class IntentClassifier:
    """Bộ phân loại ý định hội thoại cho nhà hàng."""

    @classmethod
    def classify(cls, message: str) -> Dict[str, Any]:
        """
        Phân loại ý định từ câu thoại người dùng.
        Returns:
            Dict chứa 'intent', 'sub_intent', 'confidence', 'matched_keywords'
        """
        if not message or not message.strip():
            return {
                "intent": IntentType.UNKNOWN.value,
                "sub_intent": None,
                "confidence": 0.0,
                "matched_keywords": []
            }

        msg = message.lower().strip()

        # 1. Handoff tới nhân viên
        matched_handoff = [k for k in HANDOFF_KEYWORDS if k in msg]
        if matched_handoff:
            return {
                "intent": IntentType.HUMAN_HANDOFF.value,
                "sub_intent": "human_handoff",
                "confidence": 0.95,
                "matched_keywords": matched_handoff
            }

        # 2. Ý định đặt bàn
        matched_res = [k for k in RESERVATION_KEYWORDS if k in msg]
        if matched_res:
            return {
                "intent": IntentType.RESERVATION.value,
                "sub_intent": "book_table",
                "confidence": 0.90,
                "matched_keywords": matched_res
            }

        # 3. Chính sách nhà hàng (Policy Inquiry: Corkage fee, Birthday, Takeaway...)
        corkage_matched = [k for k in CORKAGE_KEYWORDS if k in msg]
        if not corkage_matched:
            has_drink = any(w in msg for w in ["rượu", "vang", "bia", "đồ uống", "thức uống"])
            has_fee = any(w in msg for w in ["khui", "mở", "phụ thu", "tính phí", "corkage", "phí"])
            has_bring = any(w in msg for w in ["mang", "đem", "từ nhà", "ngoài vào", "vào"])
            if (has_drink and has_fee) or (has_drink and has_bring and any(w in msg for w in ["phí", "tính", "được không", "được ko", "không", "ko"])):
                corkage_matched = ["corkage_pattern_matched"]

        if corkage_matched:
            return {
                "intent": IntentType.POLICY_INQUIRY.value,
                "sub_intent": "corkage_policy",
                "confidence": 0.95,
                "matched_keywords": corkage_matched
            }

        for sub_intent, kw_list in POLICY_SUB_INTENTS.items():
            if sub_intent == "corkage_policy":
                continue
            matched = [k for k in kw_list if k in msg]
            if matched:
                return {
                    "intent": IntentType.POLICY_INQUIRY.value,
                    "sub_intent": sub_intent,
                    "confidence": 0.93,
                    "matched_keywords": matched
                }

        # 4. Tiện ích nhà hàng / FAQ (ưu tiên kiểm tra trước khi suy đoán món ăn)
        for sub_intent, kw_list in FACILITY_SUB_INTENTS.items():
            matched = [k for k in kw_list if k in msg]
            if matched:
                return {
                    "intent": IntentType.FACILITY_INQUIRY.value,
                    "sub_intent": sub_intent,
                    "confidence": 0.92,
                    "matched_keywords": matched
                }

        # 5. Mặc định là tư vấn món ăn / thực đơn
        return {
            "intent": IntentType.MENU_CONSULTATION.value,
            "sub_intent": "menu_inquiry",
            "confidence": 0.70,
            "matched_keywords": []
        }

    @classmethod
    def detect_inquiry(cls, message: str) -> Optional[Dict[str, Any]]:
        """
        Phát hiện câu hỏi / thắc mắc tiện ích hoặc chính sách có trong câu thoại
        (áp dụng cho cả câu đơn và câu ghép chứa intent đặt bàn).
        Returns:
            Dict chứa {"type": "policy"|"facility", "sub_intent": str, "matched_keywords": list} hoặc None
        """
        if not message or not message.strip():
            return None
        msg = message.lower().strip()

        # 1. Kiểm tra chính sách sinh nhật / bánh kem / trang trí
        has_bday_svc = any(w in msg for w in ["trang trí", "giữ lạnh", "bảo quản", "tủ lạnh", "giữ mát", "bánh kem", "nến", "bong bóng"])
        has_bday_ctx = any(w in msg for w in ["sinh nhật", "bánh kem", "bạn gái", "người yêu", "tiệc"])
        if (has_bday_svc and has_bday_ctx) or any(k in msg for k in [
            "trang trí sinh nhật", "hỗ trợ trang trí", "giữ lạnh bánh kem",
            "bảo quản bánh kem", "giữ mát bánh kem", "mang bánh kem", "bánh sinh nhật"
        ]):
            return {
                "type": "policy",
                "sub_intent": "birthday_policy",
                "confidence": 0.95,
                "matched_keywords": ["birthday_service_inquiry"]
            }

        # 2. Kiểm tra phụ thu khui rượu (Corkage)
        corkage_matched = [k for k in CORKAGE_KEYWORDS if k in msg]
        if not corkage_matched:
            has_drink = any(w in msg for w in ["rượu", "vang", "bia", "đồ uống", "thức uống"])
            has_fee = any(w in msg for w in ["khui", "mở", "phụ thu", "tính phí", "corkage", "phí"])
            has_bring = any(w in msg for w in ["mang", "đem", "từ nhà", "ngoài vào", "vào"])
            if (has_drink and has_fee) or (has_drink and has_bring and any(w in msg for w in ["phí", "tính", "được không", "được ko", "không", "ko"])):
                corkage_matched = ["corkage_inquiry"]
        if corkage_matched:
            return {
                "type": "policy",
                "sub_intent": "corkage_policy",
                "confidence": 0.95,
                "matched_keywords": corkage_matched
            }

        # 3. Kiểm tra các chính sách khác
        for sub_intent, kw_list in POLICY_SUB_INTENTS.items():
            if sub_intent in ("corkage_policy", "birthday_policy"):
                continue
            matched = [k for k in kw_list if k in msg]
            if matched:
                return {
                    "type": "policy",
                    "sub_intent": sub_intent,
                    "confidence": 0.93,
                    "matched_keywords": matched
                }

        # 4. Kiểm tra tiện ích / FAQ
        for sub_intent, kw_list in FACILITY_SUB_INTENTS.items():
            matched = [k for k in kw_list if k in msg]
            if matched:
                return {
                    "type": "facility",
                    "sub_intent": sub_intent,
                    "confidence": 0.92,
                    "matched_keywords": matched
                }

        return None

    @classmethod
    def is_facility_inquiry(cls, message: str) -> Tuple[bool, Optional[str]]:
        """Kiểm tra nhanh xem câu hỏi có thuộc nhóm tiện ích / FAQ hay không."""
        inq = cls.detect_inquiry(message)
        if inq and inq["type"] == "facility":
            return True, inq["sub_intent"]
        res = cls.classify(message)
        if res["intent"] == IntentType.FACILITY_INQUIRY.value:
            return True, res["sub_intent"]
        return False, None

    @classmethod
    def is_parking_inquiry(cls, message: str) -> bool:
        """Kiểm tra cụ thể câu hỏi về bãi đỗ/đậu xe."""
        inq = cls.detect_inquiry(message)
        if inq and inq["type"] == "facility" and inq["sub_intent"] == "faq_parking":
            return True
        res = cls.classify(message)
        return res["intent"] == IntentType.FACILITY_INQUIRY.value and res["sub_intent"] == "faq_parking"

    @classmethod
    def is_policy_inquiry(cls, message: str) -> Tuple[bool, Optional[str]]:
        """Kiểm tra nhanh xem câu hỏi có thuộc nhóm chính sách (Policy) hay không."""
        inq = cls.detect_inquiry(message)
        if inq and inq["type"] == "policy":
            return True, inq["sub_intent"]
        res = cls.classify(message)
        if res["intent"] in (IntentType.POLICY_INQUIRY.value, "corkage_policy", "restaurant_policy"):
            return True, res["sub_intent"]
        return False, None

    @classmethod
    def is_corkage_inquiry(cls, message: str) -> bool:
        """Kiểm tra cụ thể câu hỏi về phụ thu khui rượu (corkage fee)."""
        inq = cls.detect_inquiry(message)
        if inq and inq["sub_intent"] == "corkage_policy":
            return True
        res = cls.classify(message)
        return res.get("sub_intent") == "corkage_policy" or res.get("intent") in ("corkage_policy", "policy_inquiry")


def classify_intent(message: str) -> Dict[str, Any]:
    """Hàm wrapper tiện ích phân loại ý định."""
    return IntentClassifier.classify(message)


def is_corkage_inquiry(message: str) -> bool:
    """Wrapper kiểm tra nhanh câu hỏi phí khui rượu."""
    return IntentClassifier.is_corkage_inquiry(message)


def is_policy_inquiry(message: str) -> Tuple[bool, Optional[str]]:
    """Wrapper kiểm tra nhanh câu hỏi chính sách."""
    return IntentClassifier.is_policy_inquiry(message)

