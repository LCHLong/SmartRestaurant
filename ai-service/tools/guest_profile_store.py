"""
guest_profile_store.py
Quản lý Hồ sơ Dài hạn Khách quen (Archival Memory) & Cơ chế Allergy Safety Latch
Căn cứ: MemGPT: Towards LLMs as Operating Systems (UC Berkeley, 2023)
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import copy


class GuestProfile(BaseModel):
    user_id: str
    allergies: List[str] = Field(default_factory=list)
    dietary_preferences: Dict[str, Any] = Field(default_factory=dict)
    favorite_dishes: List[str] = Field(default_factory=list)
    spice_preference: str = "vừa"
    preferred_zone: Optional[str] = None
    special_notes: Optional[str] = None
    special_dates: List[Dict[str, str]] = Field(default_factory=list)
    visit_count: int = 1
    last_visit: Optional[str] = None


class AllergySafetyLatch:
    """
    Rào chắn an toàn bảo toàn dị ứng tuyệt đối (Allergy Safety Latch).
    Nguyên tắc toán học & nghiệp vụ:
    A_new = A_current U A_detected
    Tập hợp dị ứng chỉ có thể tăng (Union), tuyệt đối KHÔNG BAO GIỜ tự ý bị xóa
    bởi các tác vụ LLM tóm tắt ngầm nhằm loại trừ 100% rủi ro ngộ độc / sốc phản vệ.
    """

    @staticmethod
    def merge_allergies(current_allergies: List[str], new_allergies: List[str]) -> List[str]:
        current_set = {a.strip().lower() for a in current_allergies if a and a.strip()}
        new_set = {a.strip().lower() for a in new_allergies if a and a.strip()}
        merged_set = current_set.union(new_set)
        return sorted(list(merged_set))

    @staticmethod
    def verify_no_allergy_loss(original_allergies: List[str], updated_allergies: List[str]) -> bool:
        """
        Kiểm tra tính toàn vẹn (Safety Invariance):
        Mọi dị ứng ban đầu bắt buộc phải tồn tại trong danh sách sau khi cập nhật.
        """
        orig_set = {a.strip().lower() for a in original_allergies if a and a.strip()}
        upd_set = {a.strip().lower() for a in updated_allergies if a and a.strip()}
        return orig_set.issubset(upd_set)


class GuestProfileStore:
    """
    Kho lưu trữ hồ sơ thực khách (Archival Memory Store).
    Hỗ trợ lưu trữ in-memory cache kết hợp cơ chế kiểm soát hợp nhất an toàn.
    """

    def __init__(self):
        self._cache: Dict[str, GuestProfile] = {}

    def get_profile(self, user_id: str) -> Optional[GuestProfile]:
        if not user_id:
            return None
        return self._cache.get(user_id)

    def set_profile(self, profile: GuestProfile) -> None:
        if profile and profile.user_id:
            self._cache[profile.user_id] = copy.deepcopy(profile)

    def update_with_safety_latch(
        self,
        user_id: str,
        detected_allergies: Optional[List[str]] = None,
        detected_spice: Optional[str] = None,
        detected_zone: Optional[str] = None,
        favorite_dishes: Optional[List[str]] = None,
        special_notes: Optional[str] = None,
        increment_visit: bool = False
    ) -> GuestProfile:
        """
        Cập nhật hồ sơ với sự bảo vệ của Allergy Safety Latch.
        """
        existing = self.get_profile(user_id)
        if not existing:
            existing = GuestProfile(user_id=user_id)

        # 1. Bảo toàn dị ứng
        if detected_allergies:
            merged_allergies = AllergySafetyLatch.merge_allergies(
                existing.allergies,
                detected_allergies
            )
            # Kiểm tra Safety Invariance
            assert AllergySafetyLatch.verify_no_allergy_loss(existing.allergies, merged_allergies), \
                "VI PHẠM AN TOÀN: Allergy Safety Latch phát hiện nguy cơ mất dữ liệu dị ứng!"
            existing.allergies = merged_allergies

        # 2. Cập nhật khẩu vị độ cay
        if detected_spice:
            existing.spice_preference = detected_spice

        # 3. Cập nhật khu vực ngồi
        if detected_zone:
            existing.preferred_zone = detected_zone

        # 4. Hợp nhất món yêu thích
        if favorite_dishes:
            fav_set = set(existing.favorite_dishes).union(set(favorite_dishes))
            existing.favorite_dishes = sorted(list(fav_set))

        # 5. Ghi chú đặc biệt
        if special_notes:
            existing.special_notes = special_notes

        # 6. Tăng số lần ghé thăm
        if increment_visit:
            existing.visit_count += 1
            existing.last_visit = datetime.now().isoformat()

        self.set_profile(existing)
        return existing
