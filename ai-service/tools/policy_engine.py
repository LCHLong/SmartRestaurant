"""
policy_engine.py
Bộ xử lý chính sách & quy định nhà hàng (Restaurant Policy Engine) cho trợ lý Aria:
- Chính sách mang đồ uống ngoài / phí khui rượu (Corkage fee)
- Chính sách tiệc sinh nhật & mang bánh kem
- Chính sách mua mang về (Takeaway)
- Chính sách hóa đơn VAT
"""

from typing import Dict, Any, Optional

try:
    from tools.intent_classifier import IntentClassifier
except ImportError:
    from .intent_classifier import IntentClassifier


class PolicyEngine:
    """Xử lý và cung cấp thông tin chính sách, phụ thu và dịch vụ của nhà hàng."""

    DEFAULT_CORKAGE_ANSWER = (
        "Dạ, nhà hàng có hỗ trợ khách mang rượu từ ngoài vào với mức phí phụ thu khui rượu "
        "(corkage fee) là 150.000đ/chai vang và phục vụ sẵn ly rượu, xô đá ướp lạnh chu đáo ạ!"
    )

    DEFAULT_BIRTHDAY_ANSWER = (
        "Dạ, nhà hàng rất hân hạnh đón tiếp quý khách tổ chức tiệc sinh nhật! Quán cho phép mang bánh kem "
        "từ ngoài vào (có hỗ trợ tủ mát bảo quản, đĩa nĩa phục vụ) và có hỗ trợ trang trí tiệc theo yêu cầu ạ."
    )

    DEFAULT_TAKEAWAY_ANSWER = (
        "Dạ, nhà hàng có phục vụ mua mang về (takeaway) đầy đủ các món ăn trong thực đơn, "
        "được đóng gói cẩn thận bằng hộp giữ nhiệt an toàn vệ sinh thực phẩm ạ."
    )

    DEFAULT_VAT_ANSWER = (
        "Dạ, nhà hàng có xuất hóa đơn đỏ (VAT) điện tử đầy đủ theo yêu cầu của quý khách ạ."
    )

    @classmethod
    def get_corkage_policy(cls, settings: Optional[Dict[str, Any]] = None) -> str:
        """Trả lời chính sách phụ thu khui rượu (corkage fee)."""
        if settings and settings.get("corkage_policy"):
            return settings["corkage_policy"]
        return cls.DEFAULT_CORKAGE_ANSWER

    @classmethod
    def get_birthday_policy(cls, settings: Optional[Dict[str, Any]] = None) -> str:
        """Trả lời chính sách tổ chức sinh nhật & bánh kem."""
        if settings and settings.get("birthday_policy"):
            return settings["birthday_policy"]
        return cls.DEFAULT_BIRTHDAY_ANSWER

    @classmethod
    def get_takeaway_policy(cls, settings: Optional[Dict[str, Any]] = None) -> str:
        """Trả lời chính sách mua mang về."""
        if settings and settings.get("takeaway_policy"):
            return settings["takeaway_policy"]
        return cls.DEFAULT_TAKEAWAY_ANSWER

    @classmethod
    def get_vat_policy(cls, settings: Optional[Dict[str, Any]] = None) -> str:
        """Trả lời chính sách xuất hóa đơn VAT."""
        if settings and settings.get("vat_policy"):
            return settings["vat_policy"]
        return cls.DEFAULT_VAT_ANSWER

    @classmethod
    def get_policy_answer(
        cls,
        message: str,
        settings: Optional[Dict[str, Any]] = None,
        sub_intent: Optional[str] = None
    ) -> str:
        """
        Sinh câu trả lời chính sách phù hợp theo câu hỏi của khách hàng.
        """
        if settings is None:
            settings = {}

        if not sub_intent:
            classified = IntentClassifier.classify(message)
            sub_intent = classified.get("sub_intent")

        msg = message.lower().strip()

        # 1. Phụ thu khui rượu (Corkage)
        if sub_intent == "corkage_policy" or any(k in msg for k in [
            "khui rượu", "phí khui", "phụ thu rượu", "corkage", "mở rượu",
            "phí mở", "rượu mang vào", "rượu từ nhà", "mang rượu", "rượu vang"
        ]):
            return cls.get_corkage_policy(settings)

        # 2. Sinh nhật / Bánh kem
        if sub_intent == "birthday_policy" or any(k in msg for k in [
            "sinh nhật", "bánh kem", "bánh sinh nhật", "tiệc sinh nhật"
        ]):
            return cls.get_birthday_policy(settings)

        # 3. Mua mang về
        if sub_intent == "takeaway_policy" or any(k in msg for k in [
            "mang về", "takeaway", "take away", "đóng gói mang về", "gói mang về"
        ]):
            return cls.get_takeaway_policy(settings)

        # 4. Hóa đơn VAT
        if sub_intent == "vat_policy" or any(k in msg for k in [
            "vat", "hóa đơn", "hóa đơn đỏ", "xuất vat"
        ]):
            return cls.get_vat_policy(settings)

        return cls.get_corkage_policy(settings)


def get_policy_answer(message: str, settings: Optional[Dict[str, Any]] = None, sub_intent: Optional[str] = None) -> str:
    """Wrapper function tiện ích lấy câu trả lời chính sách."""
    return PolicyEngine.get_policy_answer(message, settings=settings, sub_intent=sub_intent)
