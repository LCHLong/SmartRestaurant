"""
faq_engine.py
Bộ xử lý câu hỏi thường gặp & tiện ích nhà hàng (Facility & FAQ Engine) cho trợ lý Aria:
- Trả lời các câu hỏi về:
  * Bãi đỗ xe (ô tô, xe máy, gửi xe)
  * Wifi (tên mạng, mật khẩu)
  * Giờ mở cửa / đóng cửa
  * Địa chỉ / Vị trí quán
  * Ghế trẻ em / em bé
  * Phòng VIP / phòng riêng
  * Khu vực hút thuốc
  * Hotline / Liên hệ
  * Hóa đơn VAT
"""

from typing import Dict, Any, Optional

try:
    from tools.intent_classifier import IntentClassifier
except ImportError:
    from .intent_classifier import IntentClassifier


class FAQEngine:
    """Xử lý và sinh câu trả lời cho các thắc mắc về tiện ích, dịch vụ của nhà hàng."""

    @classmethod
    def get_faq_answer(
        cls,
        message: str,
        settings: Optional[Dict[str, Any]] = None,
        sub_intent: Optional[str] = None
    ) -> str:
        """
        Sinh câu trả lời chuẩn mực theo câu hỏi tiện ích của khách hàng.
        """
        if settings is None:
            settings = {}

        restaurant_name = settings.get("restaurant_name", "nhà hàng")
        open_time = settings.get("open_time", "08:00")
        close_time = settings.get("close_time", "22:00")
        wifi_password = settings.get("wifi_password", "12345678")
        address = settings.get("address", "123 Đường Ẩm Thực, Quận 1, TP.HCM")
        hotline = settings.get("hotline", "0901.234.567")

        if not sub_intent:
            classified = IntentClassifier.classify(message)
            sub_intent = classified.get("sub_intent")

        msg = message.lower().strip()

        # 0. Phụ thu khui rượu (Corkage)
        if sub_intent == "corkage_policy" or any(k in msg for k in [
            "khui rượu", "phí khui", "phụ thu rượu", "corkage", "mở rượu",
            "phí mở", "rượu mang vào", "rượu từ nhà", "mang rượu"
        ]):
            return "Dạ, nhà hàng có hỗ trợ khách mang rượu từ ngoài vào với mức phí phụ thu khui rượu (corkage fee) là 150.000đ/chai vang và phục vụ sẵn ly rượu, xô đá ướp lạnh chu đáo ạ!"

        # 1. Bãi đỗ / đậu xe
        if sub_intent == "faq_parking" or any(k in msg for k in [
            "đỗ xe", "đậu xe", "bãi đỗ", "bãi đậu", "bãi xe", "gửi xe",
            "chỗ để xe", "chỗ đỗ xe", "chỗ đậu xe", "chỗ gửi xe",
            "ô tô", "xe ô tô", "xe hơi", "xe máy", "trông xe", "giữ xe"
        ]):
            return "Dạ, nhà hàng có bãi đỗ xe ô tô và xe máy rộng rãi, an toàn, có nhân viên bảo vệ hỗ trợ hướng dẫn đỗ xe miễn phí cho quý khách ạ!"

        # 2. Wifi
        if sub_intent == "faq_wifi" or any(k in msg for k in ["wifi", "wi-fi", "mật khẩu", "pass wifi"]):
            return f"Dạ, quán có wifi tốc độ cao miễn phí (Tên wifi: {restaurant_name}, Mật khẩu: {wifi_password}) ạ."

        # 3. Giờ mở / đóng cửa
        if sub_intent == "faq_hours" or any(k in msg for k in ["mở cửa", "đóng cửa", "mấy giờ", "giờ hoạt động", "giờ mở"]):
            return f"Dạ, {restaurant_name} mở cửa đón khách từ {open_time} đến {close_time} hàng ngày với nhiều món ăn đặc sắc ạ."

        # 4. Địa chỉ / Vị trí
        if sub_intent == "faq_location" or any(k in msg for k in ["địa chỉ", "ở đâu", "vị trí", "đường nào", "chỗ nào", "tìm đường", "quán ở"]):
            return f"Dạ, {restaurant_name} tọa lạc tại {address} ạ."

        # 5. Ghế trẻ em
        if sub_intent == "faq_baby_chair" or any(k in msg for k in ["ghế trẻ em", "ghế em bé", "ghế ăn dặm", "ghế cho bé"]):
            return "Dạ, nhà hàng có trang bị sẵn ghế ăn dặm cho trẻ em, sạch sẽ và an toàn chu đáo ạ."

        # 6. Phòng riêng / VIP
        if sub_intent == "faq_vip_room" or any(k in msg for k in ["phòng riêng", "phòng vip", "phòng gia đình"]):
            return "Dạ, quán có các phòng VIP riêng tư ấm cúng dành cho gia đình hoặc tiếp khách đối tác ạ."

        # 7. Hút thuốc
        if sub_intent == "faq_smoking" or any(k in msg for k in ["hút thuốc"]):
            return "Dạ, để bảo đảm không gian dùng bữa trong lành, khu vực phòng lạnh không hút thuốc; quán có bố trí khu vực ngoài trời thoáng mát cho quý khách có nhu cầu ạ."

        # 8. Hotline / Liên hệ
        if sub_intent == "faq_contact" or any(k in msg for k in ["hotline", "số điện thoại", "sđt", "liên hệ", "số quán"]):
            return f"Dạ, số hotline hỗ trợ khách hàng của nhà hàng là {hotline} ạ."

        # 9. VAT / Hóa đơn
        if sub_intent == "faq_vat" or any(k in msg for k in ["vat", "hóa đơn", "hóa đơn đỏ", "xuất vat"]):
            return "Dạ, nhà hàng có xuất hóa đơn đỏ (VAT) điện tử đầy đủ theo yêu cầu của quý khách ạ."

        return f"Dạ, {restaurant_name} mở cửa từ {open_time} đến {close_time} hàng ngày tại {address} ạ."


def get_faq_answer(message: str, settings: Optional[Dict[str, Any]] = None, sub_intent: Optional[str] = None) -> str:
    """Wrapper function tiện ích lấy câu trả lời FAQ."""
    return FAQEngine.get_faq_answer(message, settings=settings, sub_intent=sub_intent)
