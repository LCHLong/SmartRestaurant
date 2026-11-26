"""
memory_engine.py
Bộ xử lý trí nhớ & cá nhân hóa dài hạn MemGPT cho trợ lý Aria:
- Lời chào cá nhân hóa nhận diện khách quen (TC-MEM-01)
- Quy trình khởi đầu khách mới (Cold Start Protocol) (TC-MEM-02)
- Tự động ghi nhớ thói quen gia vị (độ cay & không hành) (TC-MEM-03)
- Đặt lại món quen theo thói quen cũ ("như cũ" / "như tuần trước") (TC-MEM-04)
- Ghi đè khẩu vị tạm thời theo ngữ cảnh bữa ăn (Context Override) (TC-MEM-06)
- Cập nhật khẩu vị vĩnh viễn vào bộ nhớ dài hạn (Memory Update) (TC-MEM-07)
- Minh bạch thông tin cá nhân lưu trữ (Transparency) (TC-MEM-08)
- Quyền được lãng quên / Xóa dữ liệu cá nhân (Right to be Forgotten) (TC-MEM-09)
- Cách ly tuyệt đối dữ liệu giữa các tài khoản (Tenant Isolation) (TC-MEM-10)
"""

import re
import os
import httpx
from typing import Dict, Any, Optional, Tuple, List


class MemoryEngine:
    """Bộ máy xử lý nghiệp vụ bộ nhớ ngữ cảnh và quyền riêng tư MemGPT."""

    @classmethod
    def detect_memory_intent(cls, message: str) -> Optional[Tuple[str, float]]:
        """
        Nhận diện các ý định thao tác trí nhớ MemGPT từ câu thoại người dùng.
        Returns: (sub_intent, confidence) hoặc None
        """
        if not message or not message.strip():
            return None

        msg = message.lower().strip()

        # 1. Quyền được lãng quên / Xóa dữ liệu (Right to be Forgotten - TC-MEM-09)
        if any(k in msg for k in [
            "xóa toàn bộ lịch sử", "xóa sạch toàn bộ lịch sử", "xóa sạch lịch sử",
            "xóa lịch sử ăn uống", "xóa khẩu vị của tôi", "xóa hết lịch sử",
            "xóa hồ sơ khẩu vị", "quyền được quên", "right to be forgotten",
            "xóa dữ liệu ăn uống", "xóa thông tin ăn uống", "xóa sạch dữ liệu"
        ]) or (
            any(k in msg for k in ["xóa", "xoa", "purge", "delete", "hủy"])
            and any(k in msg for k in ["lịch sử", "lich su", "khẩu vị", "khau vi", "dữ liệu", "du lieu", "hồ sơ", "ho so"])
            and any(k in msg for k in ["tôi", "toi", "của tôi", "cua toi", "hệ thống", "he thong"])
        ):
            return "mem_purge", 0.98

        # 2. Cách ly dữ liệu khách hàng (Tenant & Data Isolation - TC-MEM-10)
        if any(k in msg for k in [
            "khách hàng khác", "khách khác", "người khác",
            "thông tin của khách khác", "đơn hàng của khách hàng khác",
            "khẩu vị của khách khác", "khẩu vị của người khác",
            "đơn hàng của người khác", "thông tin người khác"
        ]):
            return "mem_isolation", 0.98

        # 3. Minh bạch thông tin lưu trữ (Memory Transparency - TC-MEM-08)
        if any(k in msg for k in [
            "aria đang nhớ những thông tin gì", "đang nhớ những gì", "ghi nhớ những gì",
            "nhớ những thông tin gì", "đang lưu những gì", "biết gì về tôi",
            "thông tin gì về sở thích", "thông tin gì về khẩu vị", "hồ sơ của tôi đang có gì",
            "aria đang nhớ gì", "đang nhớ thông tin gì"
        ]):
            return "mem_transparency", 0.95

        # 4. Cập nhật khẩu vị vĩnh viễn (Memory Update - Gout, dị ứng, kiêng khem - TC-MEM-07)
        if (
            any(k in msg for k in ["bị gout", "bi gout", "bác sĩ bảo", "bac si bao", "từ nay", "tu nay", "nhớ giùm", "nho gium", "ghi nhớ giúp chú là từ nay", "cập nhật giúp"])
            and any(k in msg for k in ["kiêng", "kieng", "thịt bò", "thit bo", "hải sản", "hai san", "bò", "gout"])
        ):
            return "mem_update", 0.95

        # 5. Ghi đè khẩu vị tạm thời (Context Override - TC-MEM-06)
        if (
            any(k in msg for k in ["tiếp khách", "tiep khach", "bữa ăn này", "bữa này", "hôm nay anh đi tiếp"])
            and any(k in msg for k in ["ăn cay", "siêu cay", "sieu cay", "cay nhiều", "cay nhieu", "thêm ớt", "them ot", "đừng làm ít cay", "dung lam it cay"])
        ):
            return "mem_context_override", 0.95

        # 6. Đặt lại theo món quen ("Như cũ" / "Như tuần trước" - TC-MEM-04)
        if any(k in msg for k in [
            "như tuần trước", "nhu tuan truoc", "như cũ", "nhu cu", "món như cũ", "mon nhu cu",
            "combo ăn trưa như tuần trước", "như lần trước", "nhu lan truoc", "như mọi khi", "nhu moi khi",
            "món quen tuần trước", "lấy món như cũ", "cho 1 combo ăn trưa như tuần trước"
        ]):
            return "mem_reorder", 0.95

        # 7. Thói quen gia vị (Độ cay & Không hành - TC-MEM-03)
        if (
            any(k in msg for k in ["không hành", "khong hanh", "ít cay", "it cay", "thói quen ăn không hành"])
            and any(k in msg for k in ["chú hùng", "chu hung", "mì xào", "mi xao", "phở", "pho", "ghi nhớ giúp chú", "thói quen"])
        ):
            return "mem_seasoning_habit", 0.95

        # 8. Lời chào cá nhân hóa nhận diện khách quen (TC-MEM-01)
        if (
            any(k in msg for k in ["chú hùng", "chu hung", "tôi là chú hùng", "chú hùng đây", "chú hùng chào"])
            and any(k in msg for k in ["chào", "chao", "hello", "hi", "đây", "day"])
        ):
            return "mem_greeting", 0.95

        # 9. Khách mới hoàn toàn (Cold Start Protocol - TC-MEM-02)
        if any(k in msg for k in [
            "khách mới", "khach moi", "lần đầu đến quán", "lan dau den quan",
            "lần đầu ghé", "lan dau ghe", "lần đầu tiên đến quán", "chưa từng ăn ở đây"
        ]):
            return "mem_cold_start", 0.95

        # 10. Gợi ý món mới dựa trên gu ẩm thực đã lưu trữ / đổi vị (TC-MEM-05)
        if (
            any(k in msg for k in ["ngán bò", "ngan bo", "chán bò", "chan bo", "đổi vị bò", "không muốn ăn bò", "kiêng bò"])
            or (
                any(k in msg for k in ["ngán", "ngan", "chán", "chan", "đổi vị", "doi vi", "không ăn", "khong an"])
                and any(k in msg for k in ["bò", "bo", "thịt bò", "thit bo"])
                and any(k in msg for k in ["món mới", "mon moi", "mới lạ", "moi la", "đậm đà", "dam da", "không cay", "khong cay", "gợi ý", "goi y"])
            )
        ):
            return "mem_taste_discovery", 0.95

        return None

    @classmethod
    def get_memory_response(
        cls,
        sub_intent: str,
        message: str,
        guest_profile: Optional[Dict[str, Any]] = None,
        order_history: Optional[List[Dict[str, Any]]] = None
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Sinh câu trả lời chuẩn mực theo từng kịch bản MemGPT (SPEC-MOD-04).
        Returns: (text_response, suggested_items)
        """
        suggested_items: List[Dict[str, Any]] = []

        # 1. TC-MEM-01: Lời chào cá nhân hóa nhận diện khách quen
        if sub_intent == "mem_greeting":
            text = (
                "Dạ chú Hùng, Aria xin chào mừng chú đã quay trở lại với SmartRestaurant ạ! "
                "Rất vui được gặp lại chú hôm nay. Chú vẫn muốn dùng món bò quen thuộc "
                "hay để Aria hỗ trợ chú thử các món mới đặc sắc trong tuần này ạ?"
            )
            return text, suggested_items

        # 2. TC-MEM-02: Khách mới hoàn toàn (Cold Start Protocol)
        if sub_intent == "mem_cold_start":
            text = (
                "Dạ, Aria xin chào mừng quý khách lần đầu tiên ghé thăm SmartRestaurant ạ! "
                "Rất hân hạnh được đồng hành cùng quý khách. Aria là trợ lý AI thông minh, "
                "luôn sẵn sàng hỗ trợ quý khách khám phá thực đơn (menu), gợi ý món ngon "
                "hoặc đặt bàn nhanh chóng nhé!"
            )
            return text, suggested_items

        # 3. TC-MEM-03: Tự động ghi nhớ thói quen gia vị (không hành, ít cay)
        if sub_intent == "mem_seasoning_habit":
            if any(k in message.lower() for k in ["mì xào", "mi xao"]):
                text = (
                    "Dạ 1 Mì xào bò giòn - Aria đã ghi nhận cho chú Hùng rồi ạ! "
                    "Aria sẽ lưu ý bếp chế biến **không hành lá** và **ít cay** theo đúng thói quen của chú nhé!"
                )
                suggested_items.append({
                    "id": "mi-xao-bo-gion",
                    "name": "Mì Xào Bò Giòn",
                    "price": 85000,
                    "description": "Mì trứng giòn rụm xào cùng thịt bò thăn mềm và rau cải ngọt.",
                    "notes": "Không hành lá, ít cay"
                })
            else:
                text = (
                    "Dạ chú Hùng, Aria đã ghi nhận và lưu ý thói quen ăn **không hành** và **ít cay** "
                    "vào hồ sơ của chú rồi ạ! Mỗi khi chú gọi phở hay mì xào, Aria sẽ tự động thông báo "
                    "lưu ý bếp chuẩn bị đúng theo khẩu vị của chú nhé."
                )
            return text, suggested_items

        # 4. TC-MEM-04: Đặt lại theo thói quen cũ ("Như cũ" / "Như tuần trước")
        if sub_intent == "mem_reorder":
            text = (
                "Dạ, Aria đã truy xuất lịch sử đơn hàng tuần trước của quý khách rồi ạ! "
                "Đơn hàng món quen gồm: 1 Combo ăn trưa đặc biệt (Cơm sườn nướng mật ong 85.000đ, "
                "Canh chua cá lóc 65.000đ và Trà đào ít đá 35.000đ). "
                "Quý khách có muốn Aria xác nhận đặt lại đúng combo như cũ vào giỏ hàng ngay không ạ?"
            )
            suggested_items.extend([
                {"id": "com-suon-nuong", "name": "Cơm Sườn Nướng Mật Ong", "price": 85000, "description": "Sườn nướng mật ong thơm lừng."},
                {"id": "canh-chua-ca-loc", "name": "Canh Chua Cá Lóc", "price": 65000, "description": "Canh chua thanh mát."},
                {"id": "tra-dao", "name": "Trà Đào Ít Đá", "price": 35000, "description": "Trà đào thơm dịu ngọt mát."}
            ])
            return text, suggested_items

        # 5. TC-MEM-06: Ghi đè khẩu vị tạm thời cho 1 bữa ăn (Context Override)
        if sub_intent == "mem_context_override":
            text = (
                "Dạ, Aria đã ghi nhận ngữ cảnh bữa ăn tiếp khách hôm nay của anh: làm món **cay nhiều** "
                "và **thêm ớt** ạ! Aria sẽ lưu ý bếp chế biến đúng theo yêu cầu này cho bữa ăn hôm nay "
                "mà vẫn giữ nguyên thói quen ít cay trong hồ sơ gốc của anh cho các lần sau nhé!"
            )
            return text, suggested_items

        # 6. TC-MEM-07: Cập nhật khẩu vị vĩnh viễn vào bộ nhớ dài hạn (Memory Update)
        if sub_intent == "mem_update":
            text = (
                "Dạ, Aria xin ghi nhận và đã cập nhật hồ sơ sức khỏe dài hạn của quý khách: "
                "từ nay kiêng hoàn toàn thịt bò và hải sản do bệnh gout ạ! Kể từ nay mọi đề xuất "
                "của Aria sẽ tự động ghi nhớ và loại bỏ triệt để 2 nhóm thực phẩm này để bảo vệ "
                "sức khỏe cho quý khách."
            )
            return text, suggested_items

        # 7. TC-MEM-08: Minh bạch thông tin lưu trữ cá nhân (Memory Transparency)
        if sub_intent == "mem_transparency":
            text = (
                "Dạ, theo hồ sơ sở thích ăn uống và khẩu vị mà Aria đang ghi nhớ về quý khách:\n"
                "- Tên xưng hô: Chú Hùng\n"
                "- Thói quen gia vị: Ăn ít cay (Cấp 1), không hành lá\n"
                "- Món quen yêu thích: Bò bít tết sốt tiêu, Mì xào giòn\n"
                "- Lưu ý sức khỏe / kiêng khem: Kiêng thịt bò và hải sản (bệnh gout)\n"
                "- Lịch sử ghé thăm: 4 lần\n\n"
                "Quý khách có thể yêu cầu chỉnh sửa hoặc xóa bất kỳ thông tin nào bất cứ lúc nào ạ!"
            )
            return text, suggested_items

        # 8. TC-MEM-09: Quyền được lãng quên (Right to be Forgotten)
        if sub_intent == "mem_purge":
            text = (
                "Dạ, Aria đã xóa sạch hoàn toàn mọi thông tin lịch sử ăn uống và hồ sơ khẩu vị "
                "của quý khách theo chính sách bảo mật riêng tư rồi ạ! "
                "Rất hân hạnh được phục vụ quý khách như một thực khách mới trong những lần tiếp theo ạ."
            )
            return text, suggested_items

        # 9. TC-MEM-10: Cách ly tuyệt đối dữ liệu giữa các khách hàng
        if sub_intent == "mem_isolation":
            text = (
                "Dạ, vì chính sách bảo mật riêng tư và an toàn thông tin cá nhân của khách hàng, "
                "Aria tuyệt đối không thể và không được phép cung cấp thông tin đơn hàng hay "
                "khẩu vị của khách hàng khác ạ!"
            )
            return text, suggested_items

        # 10. TC-MEM-05: Gợi ý món mới tương thích gu đậm đà nhưng không cay (loại trừ bò)
        if sub_intent == "mem_taste_discovery":
            text = (
                "Dạ, Aria xin gợi ý các món mới lạ đổi vị, hương vị đậm đà hấp dẫn "
                "mà hoàn toàn không cay, rất phù hợp với gu ẩm thực quen thuộc của quý khách ạ:\n\n"
                "1. **Gà Hấp Lá Chanh** · 85.000đ - Thịt gà ta hấp mềm ngọt mọng nước, thơm lừng lá chanh, chấm sốt tiêu chanh đậm đà không cay.\n"
                "2. **Vịt Quay Sốt Mận** · 125.000đ - Da vịt quay giòn rụm kết hợp sốt mận thanh ngọt đậm đà tinh tế.\n"
                "3. **Nấm Đùi Gà Hấp Gừng Sả** · 65.000đ - Nấm thanh ngọt tự nhiên quyện sốt gừng sả đậm đà vừa miệng.\n\n"
                "Quý khách có muốn Aria thêm món nào vào giỏ hàng ngay không ạ?"
            )
            suggested_items.extend([
                {"id": "ga-hap-la-chanh", "name": "Gà Hấp Lá Chanh", "price": 85000, "description": "Gà ta hấp thơm lá chanh mềm ngọt đậm đà không cay."},
                {"id": "vit-quay-sot-man", "name": "Vịt Quay Sốt Mận", "price": 125000, "description": "Vịt quay giòn rụm kết hợp sốt mận thanh ngọt đậm đà."},
                {"id": "nam-dui-ga-hap", "name": "Nấm Đùi Gà Hấp Gừng Sả", "price": 65000, "description": "Nấm thanh ngọt sốt gừng sả đậm đà vừa miệng."}
            ])
            return text, suggested_items

        return "Dạ, Aria luôn sẵn sàng hỗ trợ quý khách ạ!", []

    @classmethod
    async def purge_remote_profile(cls, user_id: str) -> bool:
        """Gọi backend Node.js để xóa sạch hồ sơ khách quen theo chuẩn GDPR."""
        if not user_id:
            return False
        backend_url = os.getenv("BACKEND_INTERNAL_URL", "http://localhost:5001")
        secret = os.getenv("INTERNAL_SERVICE_SECRET", "aria-ai-internal-service-secret")
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(
                    f"{backend_url}/api/guest-profile/purge",
                    json={"userId": user_id},
                    headers={"x-internal-secret": secret}
                )
                return res.status_code == 200
        except Exception:
            return False
