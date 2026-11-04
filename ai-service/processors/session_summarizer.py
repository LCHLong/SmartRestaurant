"""
session_summarizer.py
Tác vụ Tóm tắt Phiên ngầm & Cập nhật Hồ sơ Dài hạn (MemGPT Archival Write-Back)
Căn cứ: MemGPT: Towards LLMs as Operating Systems (Packer et al., 2023)
"""

from typing import List, Dict, Any, Optional
import re
from tools.guest_profile_store import AllergySafetyLatch, GuestProfile


class SessionSummarizer:
    """
    Tiến trình ngầm phân tích hội thoại cuối phiên:
    1. Bóc tách thông tin khẩu vị mới xuất hiện trong phiên.
    2. Phát hiện các tuyên bố về dị ứng thực phẩm.
    3. Hợp nhất vào hồ sơ dài hạn qua AllergySafetyLatch (Zero Allergy Loss).
    4. Trả về cấu trúc cập nhật để đồng bộ với cơ sở dữ liệu.
    """

    KNOWN_ALLERGENS = [
        "đậu phộng", "lạc", "hải sản", "tôm", "cua", "mực", "cá",
        "trứng", "sữa", "gluten", "bột mì", "bò", "đậu nành", "mè", "vừng"
    ]

    ALLERGY_PATTERNS = [
        r"dị\s*ứng\s*(?:với\s*)?([a-zà-ỹ\s]+)",
        r"không\s*ăn\s*(?:được\s*)?([a-zà-ỹ\s]+)",
        r"kiêng\s*([a-zà-ỹ\s]+)",
        r"bị\s*dị\s*ứng\s*([a-zà-ỹ\s]+)"
    ]

    def __init__(self):
        pass

    def extract_new_attributes(
        self,
        conversation_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Bóc tách các thuộc tính mới xuất hiện từ lịch sử trao đổi của khách hàng.
        """
        detected_allergies = set()
        detected_spice = None
        detected_zone = None
        detected_favorites = set()
        detected_notes = []

        # Ghép tất cả các câu nói của user
        user_messages = [
            turn.get("content", "")
            for turn in conversation_history
            if turn.get("role") == "user"
        ]
        full_text = " ".join(user_messages).lower()

        # 1. Phát hiện dị ứng
        for allergen in self.KNOWN_ALLERGENS:
            for pattern in self.ALLERGY_PATTERNS:
                regex = pattern.replace(r"([a-zà-ỹ\s]+)", allergen)
                if re.search(regex, full_text):
                    detected_allergies.add(allergen)

        # 2. Phát hiện độ cay
        if re.search(r"không\s*ăn\s*cay|không\s*cay|đừng\s*bỏ\s*ớt", full_text):
            detected_spice = "không cay"
        elif re.search(r"ít\s*cay|hơi\s*cay|cay\s*nhẹ", full_text):
            detected_spice = "ít cay"
        elif re.search(r"ăn\s*cay\s*(?:nhiều|giỏi)|thích\s*cay|cay\s*nồng", full_text):
            detected_spice = "cay nồng"

        # 3. Phát hiện khu vực ngồi ưa thích
        if re.search(r"ngoài\s*trời|sân\s*vườn|thoáng\s*mát", full_text):
            detected_zone = "ngoài trời"
        elif re.search(r"phòng\s*vip|phòng\s*riêng|yên\s*tĩnh", full_text):
            detected_zone = "phòng VIP"
        elif re.search(r"cạnh\s*cửa\s*sổ|gần\s*cửa\s*sổ|view\s*đẹp", full_text):
            detected_zone = "cạnh cửa sổ"
        elif re.search(r"tầng\s*2|trên\s*lầu", full_text):
            detected_zone = "tầng 2"

        # 4. Phát hiện ghi chú đặc biệt (vd: có trẻ nhỏ, ghế ăn dặm)
        if re.search(r"trẻ\s*nhỏ|em\s*bé|ghế\s*trẻ\s*em|ghế\s*ăn\s*dặm", full_text):
            detected_notes.append("Có trẻ nhỏ, ưu tiên ghế em bé")

        return {
            "detected_allergies": sorted(list(detected_allergies)),
            "detected_spice": detected_spice,
            "detected_zone": detected_zone,
            "detected_favorites": sorted(list(detected_favorites)),
            "special_notes": "; ".join(detected_notes) if detected_notes else None
        }

    def summarize_and_merge(
        self,
        current_profile: Optional[GuestProfile],
        conversation_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Thực thi chu trình tóm tắt và hợp nhất an toàn với Allergy Safety Latch.
        """
        extracted = self.extract_new_attributes(conversation_history)

        current_allergies = current_profile.allergies if current_profile else []
        merged_allergies = AllergySafetyLatch.merge_allergies(
            current_allergies,
            extracted["detected_allergies"]
        )

        # Kiểm tra bất biến an toàn
        assert AllergySafetyLatch.verify_no_allergy_loss(current_allergies, merged_allergies), \
            "LỖI AN TOÀN: Allergy Safety Latch chặn đứng nguy cơ mất dữ liệu dị ứng!"

        current_favs = current_profile.favorite_dishes if current_profile else []
        merged_favs = sorted(list(set(current_favs).union(set(extracted["detected_favorites"]))))

        updated_spice = extracted["detected_spice"] or (current_profile.spice_preference if current_profile else "vừa")
        updated_zone = extracted["detected_zone"] or (current_profile.preferred_zone if current_profile else None)
        updated_notes = extracted["special_notes"] or (current_profile.special_notes if current_profile else None)

        memory_facts = []
        if extracted.get("detected_allergies"):
            memory_facts.append(f"Khách có đề cập dị ứng: {', '.join(extracted['detected_allergies'])}")
        if extracted.get("detected_spice"):
            memory_facts.append(f"Khẩu vị cay: {extracted['detected_spice']}")
        if extracted.get("detected_zone"):
            memory_facts.append(f"Vị trí bàn yêu thích: {extracted['detected_zone']}")
        if extracted.get("special_notes"):
            memory_facts.append(f"Ghi chú phục vụ: {extracted['special_notes']}")
        if not memory_facts and conversation_history:
            memory_facts.append("Khách đã hoàn thành phiên trao đổi tư vấn với Aria")

        return {
            "allergies": merged_allergies,
            "spice_preference": updated_spice,
            "preferred_zone": updated_zone,
            "favorite_dishes": merged_favs,
            "special_notes": updated_notes,
            "visit_count": (current_profile.visit_count + 1) if current_profile else 1,
            "new_allergy_detected": len(merged_allergies) > len(current_allergies),
            "memory_facts": memory_facts
        }
