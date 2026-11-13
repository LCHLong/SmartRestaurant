"""
test_memgpt_memory.py
Bộ kiểm thử tự động cho Tính năng F4: Bộ Nhớ Dài Hạn Khách Quen (MemGPT)
Kiểm thử 3 tầng bộ nhớ (Working, Recall, Archival) và cơ chế Allergy Safety Latch.
"""

import pytest
from tools.guest_profile_store import GuestProfile, GuestProfileStore, AllergySafetyLatch
from processors.memory_loader import MemGPTMemoryLoader
from processors.session_summarizer import SessionSummarizer
from processors.system_prompt_builder import build_dynamic_context
from processors.metadata_filter import MetadataFilter, CulinaryEntityExtractor


def test_allergy_safety_latch_union_and_invariance():
    """Kiểm tra nguyên tắc bất biến toán học của Allergy Safety Latch (chỉ thêm, không mất)."""
    current_allergies = ["đậu phộng", "sữa"]
    new_detected = ["hải sản", "đậu phộng"]

    merged = AllergySafetyLatch.merge_allergies(current_allergies, new_detected)
    assert set(merged) == {"đậu phộng", "sữa", "hải sản"}
    assert AllergySafetyLatch.verify_no_allergy_loss(current_allergies, merged) is True


def test_allergy_safety_latch_detects_loss():
    """Kiểm tra khi bị cố tình xóa dị ứng cũ thì verify_no_allergy_loss phải trả về False."""
    current_allergies = ["đậu phộng", "tôm"]
    compromised_allergies = ["tôm"]  # Mất đậu phộng

    assert AllergySafetyLatch.verify_no_allergy_loss(current_allergies, compromised_allergies) is False


def test_guest_profile_store_update():
    """Kiểm tra kho lưu trữ Archival Memory với cập nhật an toàn."""
    store = GuestProfileStore()
    user_id = "user_test_123"

    initial_profile = GuestProfile(
        user_id=user_id,
        allergies=["đậu phộng"],
        spice_preference="ít cay",
        preferred_zone="cạnh cửa sổ",
        favorite_dishes=["Phở bò"]
    )
    store.set_profile(initial_profile)

    updated = store.update_with_safety_latch(
        user_id=user_id,
        detected_allergies=["hải sản"],
        detected_spice="vừa",
        detected_zone="phòng VIP",
        favorite_dishes=["Chả giò"],
        increment_visit=True
    )

    assert "đậu phộng" in updated.allergies
    assert "hải sản" in updated.allergies
    assert updated.spice_preference == "vừa"
    assert updated.preferred_zone == "phòng VIP"
    assert "Phở bò" in updated.favorite_dishes
    assert "Chả giò" in updated.favorite_dishes
    assert updated.visit_count == 2


def test_memgpt_memory_loader():
    """Kiểm tra nạp 3 tầng bộ nhớ MemGPT (Working, Recall, Archival)."""
    loader = MemGPTMemoryLoader()
    user_id = "user_456"

    guest_payload = {
        "user_id": user_id,
        "allergies": ["cua", "tôm"],
        "spice_preference": "không cay",
        "preferred_zone": "ngoài trời",
        "favorite_dishes": ["Cơm chiên hải sản chay"],
        "visit_count": 5
    }

    conversation_history = [
        {"role": "user", "content": "Xin chào Aria"},
        {"role": "assistant", "content": "Chào anh/chị ạ!"}
    ]

    order_history = [
        {"id": 1, "name": "Lẩu nấm thiên nhiên"}
    ]

    recall_memories = [
        "Khách từng khen nhân viên phục vụ chu đáo ở lần ghé trước"
    ]

    bundle = loader.load_memory(
        user_id=user_id,
        session_id="session_xyz",
        conversation_history=conversation_history,
        guest_profile_payload=guest_payload,
        order_history=order_history,
        recall_memories=recall_memories
    )

    assert bundle["working_memory"]["turn_count"] == 2
    assert bundle["is_returning_customer"] is True
    assert "cua" in bundle["archival_memory"]["allergies"]
    assert any("Lẩu nấm thiên nhiên" in m for m in bundle["recall_memory"])
    assert any("khen nhân viên" in m for m in bundle["recall_memory"])

    prompt_text = loader.format_for_prompt(bundle)
    assert "BỘ NHỚ DÀI HẠN KHÁCH QUEN" in prompt_text
    assert "DỊ ỨNG THỰC PHẨM ĐÃ LƯU" in prompt_text
    assert "CUA" in prompt_text
    assert "TÔM" in prompt_text
    assert "ngoài trời" in prompt_text


def test_session_summarizer_extraction():
    """Kiểm tra bóc tách thông tin mới từ hội thoại và hợp nhất an toàn."""
    summarizer = SessionSummarizer()

    conversation = [
        {"role": "user", "content": "Tôi bị dị ứng đậu phộng và không ăn cay được nhé"},
        {"role": "assistant", "content": "Dạ em đã ghi nhận bạn dị ứng đậu phộng và không ăn cay ạ."},
        {"role": "user", "content": "Cho tôi bàn ở khu ngoài trời cho thoáng mát nha"},
        {"role": "assistant", "content": "Dạ vâng ạ, quán sẽ sắp xếp bàn ngoài trời cho mình."}
    ]

    attrs = summarizer.extract_new_attributes(conversation)
    assert "đậu phộng" in attrs["detected_allergies"]
    assert attrs["detected_spice"] == "không cay"
    assert attrs["detected_zone"] == "ngoài trời"

    # Hợp nhất với hồ sơ hiện tại có sẵn dị ứng sữa
    current_profile = GuestProfile(
        user_id="user_789",
        allergies=["sữa"],
        spice_preference="vừa",
        visit_count=1
    )

    merged = summarizer.summarize_and_merge(current_profile, conversation)
    assert "sữa" in merged["allergies"]  # Bảo toàn
    assert "đậu phộng" in merged["allergies"]  # Bổ sung
    assert merged["spice_preference"] == "không cay"
    assert merged["preferred_zone"] == "ngoài trời"
    assert merged["visit_count"] == 2
    assert merged["new_allergy_detected"] is True
    assert "memory_facts" in merged
    assert len(merged["memory_facts"]) > 0


def test_dynamic_context_with_guest_profile():
    """Kiểm tra system prompt builder nhúng đầy đủ MemGPT Archival context."""
    profile = {
        "allergies": ["hải sản"],
        "spice_preference": "cay nồng",
        "preferred_zone": "phòng VIP",
        "favorite_dishes": ["Bò lúc lắc"],
        "special_notes": "Đi kèm đối tác kinh doanh",
        "visit_count": 8
    }

    ctx = build_dynamic_context(
        menu_context=[],
        cart_items=[],
        order_history=[],
        table_id="T05",
        guest_profile=profile,
        recall_memories=["Khách thích dùng vang đỏ cùng món bò"]
    )

    assert "BỘ NHỚ DÀI HẠN KHÁCH QUEN" in ctx
    assert "HẢI SẢN" in ctx
    assert "cay nồng" in ctx
    assert "phòng VIP" in ctx
    assert "Đi kèm đối tác kinh doanh" in ctx
    assert "vang đỏ" in ctx


def test_archival_allergy_metadata_filtering():
    """
    Kiểm tra tính an toàn tuyệt đối:
    Nếu khách có dị ứng 'đậu phộng' trong hồ sơ dài hạn,
    bộ lọc MetadataFilter phải chặn 100% món chứa đậu phộng
    ngay cả khi trong lượt chat hiện tại khách không hề nhắc lại từ 'đậu phộng'.
    """
    extractor = CulinaryEntityExtractor()
    query = "quán gợi ý cho mình món ăn ngon hôm nay nhé"
    entities = extractor.extract(query)

    # Khách không nhắc dị ứng trong câu, nhưng hồ sơ dài hạn có 'đậu phộng'
    guest_profile_allergies = ["đậu phộng"]
    for a in guest_profile_allergies:
        if a not in entities.allergens:
            entities.allergens.append(a)

    menu_candidates = [
        {
            "id": "1",
            "name": "Gỏi ngó sen tôm thịt",
            "allergens": ["đậu phộng", "tôm"],
            "price": 85000
        },
        {
            "id": "2",
            "name": "Cơm chiên dưa bò",
            "allergens": ["bò"],
            "price": 75000
        }
    ]

    clean_items, rejected_items = MetadataFilter.filter_items(menu_candidates, entities, extractor)
    clean_names = [it["name"] for it in clean_items]

    # Món chứa đậu phộng BẮT BUỘC phải bị loại bỏ
    assert "Gỏi ngó sen tôm thịt" not in clean_names
    assert "Cơm chiên dưa bò" in clean_names
    assert any("đậu phộng" in r.get("rejection_reason", "") for r in rejected_items)


def test_embedding_generator_dimension_and_consistency():
    """Kiểm tra module sinh vector embedding 768 chiều phục vụ pgvector."""
    from tools.embedding_helper import generate_semantic_embedding, generate_batch_embeddings
    import numpy as np

    text1 = "Khách thích ăn ít cay và ngồi ngoài trời"
    text2 = "Khách thích ăn ít cay và ngồi ngoài trời"
    text3 = "Khách ăn chay thanh đạm"

    vec1 = generate_semantic_embedding(text1, dimension=768)
    vec2 = generate_semantic_embedding(text2, dimension=768)
    vec3 = generate_semantic_embedding(text3, dimension=768)

    assert len(vec1) == 768
    assert len(vec2) == 768
    assert len(vec3) == 768

    # Tính tất định (Deterministic)
    assert vec1 == vec2

    # L2 Normalized (chuẩn hóa độ dài vector xấp xỉ 1.0)
    norm1 = np.linalg.norm(np.array(vec1, dtype=np.float32))
    assert abs(norm1 - 1.0) < 1e-4

    # Batch generation
    batch = generate_batch_embeddings([text1, text3], dimension=768)
    assert len(batch) == 2
    assert batch[0] == vec1
    assert batch[1] == vec3


@pytest.mark.asyncio
async def test_reservation_pipeline_side_queries_preserve_allergy():
    """
    Kiểm tra rào chắn an toàn:
    Khi khách đang ở trong luồng đặt bàn nhưng hỏi ngang về thực đơn (side-query),
    Aria Pipeline bắt buộc phải truyền guest_profile vào _handle_consultation_flow
    để MetadataFilter loại bỏ 100% món ăn chứa chất dị ứng đã lưu trong hồ sơ.
    """
    from unittest.mock import AsyncMock, patch
    from pipelines.aria_pipeline import AriaConversationPipeline

    pipeline = AriaConversationPipeline()

    guest_profile = {
        "allergies": ["đậu phộng"],
        "spice_preference": "vừa",
        "visit_count": 3
    }

    menu_context = [
        {"id": "1", "name": "Gỏi ngó sen tôm thịt", "allergens": ["đậu phộng"], "price": 85000},
        {"id": "2", "name": "Cơm chiên dưa bò", "allergens": ["bò"], "price": 75000}
    ]

    # Kiểm tra phương thức _handle_consultation_flow nhận đúng guest_profile và loại bỏ món dị ứng
    passed_guest_profiles = []

    async def mock_consultation_flow(*args, **kwargs):
        passed_guest_profiles.append(kwargs.get("guest_profile"))
        yield 'data: {"type": "token", "content": "test"}\n\n'

    with patch.object(pipeline, "_handle_consultation_flow", side_effect=mock_consultation_flow):
        # 1. Test side query khi khách tạm dừng / hủy
        with patch("pipelines.aria_pipeline.is_cancellation", return_value=True), \
             patch("pipelines.aria_pipeline.check_side_query_intent", return_value=(True, "MENU_CONSULTATION")), \
             patch("pipelines.aria_pipeline.clear_state", new_callable=AsyncMock):

            items = []
            async for item in pipeline._handle_reservation_turn(
                message="tôi không đặt bàn nữa, cho xem thực đơn",
                session_id="test_sess_1",
                user_id="user_1",
                menu_context=menu_context,
                cart_items=[],
                order_history=[],
                conversation_history=[],
                table_id="T01",
                state={"state": "COLLECTING_SLOTS", "slots": {}},
                t_start=0.0,
                guest_profile=guest_profile
            ):
                items.append(item)

            assert len(passed_guest_profiles) == 1
            assert passed_guest_profiles[0] is not None
            assert "đậu phộng" in passed_guest_profiles[0]["allergies"]

