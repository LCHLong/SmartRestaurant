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

        # 3. Tiện ích nhà hàng / FAQ (ưu tiên kiểm tra trước khi suy đoán món ăn)
        for sub_intent, kw_list in FACILITY_SUB_INTENTS.items():
            matched = [k for k in kw_list if k in msg]
            if matched:
                return {
                    "intent": IntentType.FACILITY_INQUIRY.value,
                    "sub_intent": sub_intent,
                    "confidence": 0.92,
                    "matched_keywords": matched
                }

        # 4. Mặc định là tư vấn món ăn / thực đơn
        return {
            "intent": IntentType.MENU_CONSULTATION.value,
            "sub_intent": "menu_inquiry",
            "confidence": 0.70,
            "matched_keywords": []
        }

    @classmethod
    def is_facility_inquiry(cls, message: str) -> Tuple[bool, Optional[str]]:
        """Kiểm tra nhanh xem câu hỏi có thuộc nhóm tiện ích / FAQ hay không."""
        res = cls.classify(message)
        if res["intent"] == IntentType.FACILITY_INQUIRY.value:
            return True, res["sub_intent"]
        return False, None

    @classmethod
    def is_parking_inquiry(cls, message: str) -> bool:
        """Kiểm tra cụ thể câu hỏi về bãi đỗ/đậu xe."""
        res = cls.classify(message)
        return res["intent"] == IntentType.FACILITY_INQUIRY.value and res["sub_intent"] == "faq_parking"


def classify_intent(message: str) -> Dict[str, Any]:
    """Hàm wrapper tiện ích phân loại ý định."""
    return IntentClassifier.classify(message)
