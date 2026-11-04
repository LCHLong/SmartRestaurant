"""
memory_loader.py
Bộ nạp Ngữ cảnh Phân tầng theo kiến trúc MemGPT (Packer et al., UC Berkeley 2023)
Phối hợp 3 tầng bộ nhớ: Working Memory, Recall Memory và Archival Memory.
"""

from typing import Dict, Any, List, Optional
from tools.guest_profile_store import GuestProfile, GuestProfileStore


class MemGPTMemoryLoader:
    """
    Bộ nạp ngữ cảnh 3 tầng:
    1. Working Memory: Ngữ cảnh hội thoại tức thời của phiên (Session History + Active State)
    2. Recall Memory: Ký ức các sự kiện, món ăn, phản hồi trong các lần tương tác trước
    3. Archival Memory: Hồ sơ dài hạn (dị ứng thực phẩm, độ cay, vị trí bàn quen, thói quen ẩm thực)
    """

    def __init__(self, profile_store: Optional[GuestProfileStore] = None):
        self.profile_store = profile_store or GuestProfileStore()

    def load_memory(
        self,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        guest_profile_payload: Optional[Dict[str, Any]] = None,
        order_history: Optional[List[Dict[str, Any]]] = None,
        recall_memories: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Nạp và cấu trúc hóa toàn bộ 3 tầng bộ nhớ để cấp cho LLM và RAG pipeline.
        """
        # ── 1. WORKING MEMORY ────────────────────────────────────────────────
        working_memory = {
            "session_id": session_id or "default",
            "turn_count": len(conversation_history or []),
            "history": conversation_history or []
        }

        # ── 2. ARCHIVAL MEMORY ───────────────────────────────────────────────
        archival_memory: Optional[GuestProfile] = None

        if guest_profile_payload and isinstance(guest_profile_payload, dict):
            # Dữ liệu truyền từ Backend Node.js
            archival_memory = GuestProfile(
                user_id=user_id or guest_profile_payload.get("user_id", "guest"),
                allergies=guest_profile_payload.get("allergies", []),
                dietary_preferences=guest_profile_payload.get("dietary_preferences", {}),
                favorite_dishes=guest_profile_payload.get("favorite_dishes", []),
                spice_preference=guest_profile_payload.get("spice_preference", "vừa"),
                preferred_zone=guest_profile_payload.get("preferred_zone"),
                special_notes=guest_profile_payload.get("special_notes"),
                special_dates=guest_profile_payload.get("special_dates", []),
                visit_count=guest_profile_payload.get("visit_count", 1),
                last_visit=guest_profile_payload.get("last_visit")
            )
            self.profile_store.set_profile(archival_memory)
        elif user_id:
            archival_memory = self.profile_store.get_profile(user_id)

        # ── 3. RECALL MEMORY ─────────────────────────────────────────────────
        # Hợp nhất các ký ức hồi tưởng từ đơn hàng cũ và sự kiện tương tác
        extracted_recall: List[str] = list(recall_memories or [])

        if order_history:
            recent_dishes = [d.get("name") for d in order_history if d.get("name")]
            if recent_dishes:
                extracted_recall.append(f"Khách từng gọi các món: {', '.join(recent_dishes[:5])}")

        if archival_memory and archival_memory.favorite_dishes:
            extracted_recall.append(f"Món yêu thích thường dùng: {', '.join(archival_memory.favorite_dishes[:3])}")

        return {
            "working_memory": working_memory,
            "archival_memory": archival_memory.model_dump() if archival_memory else None,
            "recall_memory": extracted_recall,
            "is_returning_customer": bool(archival_memory and archival_memory.visit_count > 1)
        }

    def format_for_prompt(self, memory_bundle: Dict[str, Any]) -> str:
        """
        Định dạng khối bộ nhớ dài hạn để tiêm vào System Prompt của Aria.
        """
        archival = memory_bundle.get("archival_memory")
        recall = memory_bundle.get("recall_memory") or []

        if not archival and not recall:
            return ""

        lines = ["## BỘ NHỚ DÀI HẠN KHÁCH QUEN (MemGPT Archival & Recall Memory)"]

        if archival:
            visit_count = archival.get("visit_count", 1)
            lines.append(f"- Phân loại thực khách: Khách quen thân thiết (Số lần ghé: {visit_count})")
            
            # Ràng buộc dị ứng cực kỳ quan trọng
            allergies = archival.get("allergies", [])
            if allergies:
                lines.append(f"- ⚠️ DỊ ỨNG THỰC PHẨM ĐÃ LƯU (TUYỆT ĐỐI KHÔNG GỢI Ý MÓN CÓ CHỨA): {', '.join(allergies).upper()}")
            else:
                lines.append("- Dị ứng thực phẩm: Chưa ghi nhận tiền sử dị ứng")

            spice = archival.get("spice_preference", "vừa")
            lines.append(f"- Gu ăn cay: {spice}")

            zone = archival.get("preferred_zone")
            if zone:
                lines.append(f"- Vị trí / khu vực bàn yêu thích: {zone}")

            notes = archival.get("special_notes")
            if notes:
                lines.append(f"- Ghi chú cá nhân: {notes}")

            favs = archival.get("favorite_dishes", [])
            if favs:
                lines.append(f"- Món ăn quen thuộc: {', '.join(favs)}")

        if recall:
            lines.append("## KÝ ỨC HỒI TƯỞNG (Recall Events):")
            for r in recall:
                lines.append(f"- {r}")

        lines.append("")
        return "\n".join(lines)
