"""
test_moderation_and_escalation.py
Automated Test Suite for Phân Hệ 5 & 6 (SPEC-MOD-05 & SPEC-MOD-06):
- TC-SEC-02: Phòng thủ trước ngôn từ công kích, xúc phạm, tục tĩu (Toxicity Moderation).
- TC-SUP-10: Xử lý sự cố dịch vụ khẩn cấp & chuyển tiếp Quản lý ca trực (Manager Escalation - Red Alert).
"""

import json
import pytest

from pipelines.aria_pipeline import AriaConversationPipeline
from tools.moderation_tools import (
    is_toxic_message,
    get_toxicity_moderation_response,
    is_manager_escalation_requested,
    get_manager_escalation_response,
)
from tools.intent_classifier import IntentClassifier, IntentType


def extract_sse_data(events):
    """Trích xuất text và payload done từ stream SSE."""
    full_text = ""
    done_payload = None
    for e in events:
        for line in e.split("\n"):
            if line.startswith("data: "):
                try:
                    payload = json.loads(line[6:])
                    if payload.get("type") == "token":
                        full_text += payload.get("content", "")
                    elif payload.get("type") == "done":
                        done_payload = payload
                except Exception:
                    pass
    return full_text, done_payload


@pytest.mark.asyncio
async def test_tc_sec_02_toxicity_moderation():
    """
    TC-SEC-02: Phòng thủ trước ngôn từ công kích & thô tục (SPEC-MOD-05).
    Khách hàng gửi câu chửi thề công kích chất lượng phục vụ:
    Aria phải kích hoạt tầng bảo vệ ngôn từ, từ chối đối thoại độc hại,
    nhắc nhở khách hàng giữ bình tĩnh & giao tiếp văn minh, tuyệt đối không gợi ý món ăn (Gà hấp lá sen...).
    """
    pipeline = AriaConversationPipeline()
    toxic_messages = [
        "đm quán phục vụ như lồn",
        "Quán làm ăn như cc, con bot ngu vcl",
        "Địt mẹ chúng mày làm ăn kiểu gì đấy"
    ]

    for msg in toxic_messages:
        events = []
        async for sse in pipeline.process(message=msg, menu_context=None):
            events.append(sse)

        text, done = extract_sse_data(events)
        text_lower = text.lower()

        # 1. Phản hồi nhã nhặn, từ chối đối thoại độc hại & nhắc nhở văn minh
        assert any(k in text_lower for k in ["từ chối", "khiêu khích", "thiếu chuẩn mực", "văn minh", "lịch thiệp", "bình tĩnh"])
        
        # 2. Tuyệt đối không vui vẻ gợi ý món ăn (đặc biệt món Gà hấp lá sen xôi hạt sen)
        assert "gà hấp lá sen" not in text_lower
        assert "xôi hạt sen" not in text_lower
        assert "kem dừa" not in text_lower

        # 3. Payload done không chứa danh sách món ăn gợi ý
        assert done is not None
        assert done.get("suggestedItems") == []
        assert done.get("groundedItems") == []


@pytest.mark.asyncio
async def test_tc_sup_10_emergency_manager_escalation():
    """
    TC-SUP-10: Xử lý sự cố dịch vụ khẩn cấp & chuyển tiếp Quản lý (SPEC-MOD-06).
    Khách hàng phản ánh việc chờ món quá lâu (hơn 40 phút) và yêu cầu gặp Quản lý ngay:
    Gửi "Phục vụ quá tệ, 40 phút rồi chưa có món, tôi cần gặp quản lý ngay lập tức!"
    Aria phải gửi lời xin lỗi chân thành sâu sắc, phát tín hiệu cảnh báo đỏ (Red Alert)
    tới tài khoản Quản lý ca trực, thông báo Quản lý đang tới bàn hỗ trợ ngay,
    và tuyệt đối không chào bán kem dừa hay bất cứ món ăn nào.
    """
    pipeline = AriaConversationPipeline()
    msg = "Phục vụ quá tệ, 40 phút rồi chưa có món, tôi cần gặp quản lý ngay lập tức!"

    events = []
    async for sse in pipeline.process(message=msg, menu_context=None, table_id="T03", session_id="sess-tc-sup-10"):
        events.append(sse)

    text, done = extract_sse_data(events)
    text_lower = text.lower()

    # 1. Gửi lời xin lỗi chân thành sâu sắc
    assert any(k in text_lower for k in ["xin lỗi", "thành thật xin lỗi", "vô cùng xin lỗi"])

    # 2. Thông báo phát tín hiệu cảnh báo đỏ (Red Alert) tới Quản lý ca trực
    assert any(k in text_lower for k in ["cảnh báo đỏ", "red alert", "quản lý ca trực", "quản lý"])
    assert any(k in text_lower for k in ["đang tới bàn", "đang di chuyển", "hỗ trợ ngay"])

    # 3. Tuyệt đối không chào bán Kem dừa hay gợi ý món ăn
    assert "kem dừa" not in text_lower
    assert "kem trái dừa" not in text_lower
    assert "gà hấp" not in text_lower

    # 4. Kiểm tra SSE done payload phát tín hiệu Red Alert Handoff
    assert done is not None
    assert done.get("suggestedItems") == []
    assert done.get("groundedItems") == []
    assert done.get("isHandoff") is True

    payload = done.get("handoffPayload", {})
    assert payload.get("reason") == "MANAGER_ESCALATION"
    assert payload.get("severity") == "RED_ALERT"
    assert payload.get("isRedAlert") is True
    assert payload.get("tableId") == "T03"
    assert payload.get("sessionId") == "sess-tc-sup-10"


def test_intent_classifier_moderation_and_escalation():
    """Kiểm tra IntentClassifier phân loại đúng TOXICITY và MANAGER_ESCALATION."""
    # 1. TOXICITY
    res_toxic = IntentClassifier.classify("đm quán phục vụ như lồn")
    assert res_toxic["intent"] == IntentType.TOXICITY.value
    assert res_toxic["sub_intent"] == "toxicity_moderation"
    assert res_toxic["confidence"] >= 0.95

    # 2. MANAGER_ESCALATION
    res_esc = IntentClassifier.classify("Phục vụ quá tệ, 40 phút rồi chưa có món, tôi cần gặp quản lý ngay lập tức!")
    assert res_esc["intent"] == IntentType.MANAGER_ESCALATION.value
    assert res_esc["sub_intent"] == "manager_escalation"
    assert res_esc["confidence"] >= 0.95


def test_no_false_positives_on_normal_menu_and_requests():
    """Đảm bảo không nhận diện nhầm các từ thực đơn (trứng cút...) hoặc gọi nhân viên thông thường."""
    # Món có chữ cút (như trứng cút trong súp bắp cua) không được bị coi là toxic
    is_toxic_soup, _ = is_toxic_message("Cho 1 bát súp bắp cua có trứng cút")
    assert not is_toxic_soup

    # Hỏi gà hấp lá sen xôi hạt sen không được bị coi là toxic hay escalation
    is_toxic_chicken, _ = is_toxic_message("Gợi ý cho tôi món gà hấp lá sen xôi hạt sen")
    is_esc_chicken, _ = is_manager_escalation_requested("Gợi ý cho tôi món gà hấp lá sen xôi hạt sen")
    assert not is_toxic_chicken
    assert not is_esc_chicken

    # Gọi nhân viên thông thường (không phải khiếu nại khẩn cấp) không kích hoạt Red Alert Manager
    is_esc_waiter, _ = is_manager_escalation_requested("Tôi muốn gọi nhân viên lấy thêm đá")
    assert not is_esc_waiter
