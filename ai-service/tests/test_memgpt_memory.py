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
