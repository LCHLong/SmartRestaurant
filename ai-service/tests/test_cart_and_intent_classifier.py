"""
test_cart_and_intent_classifier.py
Automated Test Suite for Phân Hệ 1 & 2 (SPEC-MOD-01, SPEC-MOD-02):
- TC-ATC-03: Thao tác thêm giỏ hàng nhiều món (Cơm chiên hải sản x1 + Nước chanh dây x2)
- TC-ATC-04: Tùy chỉnh món (Modifiers: 50% đường, 70% đá, ghi chú: không lấy ống hút)
- TC-ATC-09: Xóa/giảm bớt món trong giỏ hàng (Nước chanh dây x1)
- TC-ATC-10: Xem giỏ hàng (view_cart)
- TC-ATC-11: Mặc cả giá sai (Price bargaining)
- TC-REC-09 & TC-REC-10: Hỏi mua sản phẩm của thương hiệu đối thủ (KFC, The Pizza Company)
"""

import json
import pytest
from unittest.mock import patch

from pipelines.aria_pipeline import AriaConversationPipeline
from tools.cart_tools import (
    is_competitor_query,
    get_competitor_refusal,
    is_bargain_query,
    get_bargain_refusal,
    is_cart_action,
    extract_cart_add_items,
    extract_cart_remove_items,
    format_cart_response,
)
from tools.intent_classifier import IntentClassifier, IntentType


def extract_sse_data(events):
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
async def test_tc_atc_03_add_multiple_items_to_cart():
    """
    TC-ATC-03: Thao tác giỏ hàng: Gửi 'Cho 1 phần cơm chiên hải sản và 2 ly nước chanh dây vào giỏ hàng.'
    Aria phải nhận diện add_to_cart, trích xuất đúng 2 món với số lượng, và emit cartAction.
    """
    pipeline = AriaConversationPipeline()
    msg = "Cho 1 phần cơm chiên hải sản và 2 ly nước chanh dây vào giỏ hàng."

    events = []
    async for sse in pipeline.process(message=msg, menu_context=None, cart_items=[]):
        events.append(sse)

    text, done = extract_sse_data(events)

    # 1. Kiểm tra văn bản phản hồi xác nhận
    assert "cơm chiên hải sản" in text.lower()
    assert "chanh dây" in text.lower()
    assert "giỏ hàng" in text.lower()
    # Tuyệt đối không gợi ý lạc đề chả giò
    assert "chả giò" not in text.lower()

    # 2. Kiểm tra payload cartAction
    assert done is not None
    cart_act = done.get("cartAction")
    assert cart_act is not None
    assert cart_act.get("type") == "add_to_cart"
    items = cart_act.get("items", [])
    assert len(items) == 2

    # Món 1: Cơm chiên hải sản (qty: 1)
    com_chien = next((it for it in items if "cơm chiên hải sản" in it["name"].lower()), None)
    assert com_chien is not None
    assert com_chien["quantity"] == 1

    # Món 2: Nước chanh dây (qty: 2)
    chanh_day = next((it for it in items if "chanh dây" in it["name"].lower()), None)
    assert chanh_day is not None
    assert chanh_day["quantity"] == 2


@pytest.mark.asyncio
async def test_tc_atc_04_add_item_with_modifiers_and_notes():
    """
    TC-ATC-04: Tùy chỉnh món (Modifiers): 'Thêm 1 cà phê sữa đá 50% đường 70% đá không lấy ống hút.'
    Aria phải bóc tách đúng món Cà phê sữa đá, modifier 50% đường, 70% đá, note không lấy ống hút.
    """
    pipeline = AriaConversationPipeline()
    msg = "Thêm 1 cà phê sữa đá 50% đường 70% đá không lấy ống hút."

    events = []
    async for sse in pipeline.process(message=msg, menu_context=None, cart_items=[]):
        events.append(sse)

    text, done = extract_sse_data(events)

    # 1. Kiểm tra văn bản phản hồi xác nhận
    assert "cà phê sữa đá" in text.lower()
    assert "50% đường" in text
    assert "70% đá" in text
    assert "không lấy ống hút" in text.lower()
    # Tuyệt đối không gợi ý bún bò huế
    assert "bún bò huế" not in text.lower()

    # 2. Kiểm tra payload cartAction
    assert done is not None
    cart_act = done.get("cartAction")
    assert cart_act is not None
    assert cart_act.get("type") == "add_to_cart"
    items = cart_act.get("items", [])
    assert len(items) >= 1

    cf = items[0]
    assert "cà phê" in cf["name"].lower()
    assert cf["quantity"] == 1

    mod_names = [m["name"] for m in cf.get("modifiers", [])]
    assert any("50% đường" in m for m in mod_names)
    assert any("70% đá" in m for m in mod_names)
    assert "không lấy ống hút" in cf.get("notes", "")


@pytest.mark.asyncio
async def test_tc_atc_09_remove_item_from_cart():
    """
    TC-ATC-09: Xóa món: 'Bỏ bớt 1 ly nước chanh dây ra khỏi giỏ giúp tôi.'
    Aria phải nhận diện remove_from_cart, emit đúng món Nước chanh dây và số lượng 1.
    """
    pipeline = AriaConversationPipeline()
    msg = "Bỏ bớt 1 ly nước chanh dây ra khỏi giỏ giúp tôi."
    mock_cart = [
        {"id": "1", "name": "Cơm Chiên Hải Sản Hoàng Kim", "quantity": 1, "price": 85000},
        {"id": "2", "name": "Nước Chanh Dây Tươi Mát Lạnh", "quantity": 2, "price": 35000}
    ]

    events = []
    async for sse in pipeline.process(message=msg, menu_context=None, cart_items=mock_cart):
        events.append(sse)

    text, done = extract_sse_data(events)

    # 1. Phản hồi xác nhận đã bỏ bớt món
    assert "bỏ bớt" in text.lower()
    assert "chanh dây" in text.lower()
    assert "khỏi giỏ" in text.lower()
    # Tuyệt đối không gợi ý bánh mousse
    assert "bánh mousse" not in text.lower()

    # 2. Kiểm tra payload cartAction
    assert done is not None
    cart_act = done.get("cartAction")
    assert cart_act is not None
    assert cart_act.get("type") == "remove_from_cart"
    rem_items = cart_act.get("items", [])
    assert len(rem_items) == 1
    assert "chanh dây" in rem_items[0]["name"].lower()
    assert rem_items[0]["quantity"] == 1


@pytest.mark.asyncio
async def test_tc_atc_10_view_cart():
    """
    TC-ATC-10: Xem giỏ hàng: 'Giỏ hàng của tôi hiện có những món gì?'
    Aria phải liệt kê đầy đủ các món trong giỏ hàng và tổng tiền.
    """
    pipeline = AriaConversationPipeline()
    msg = "Giỏ hàng của tôi hiện có những món gì?"
    mock_cart = [
        {"id": "1", "name": "Cơm Chiên Hải Sản Hoàng Kim", "quantity": 1, "price": 85000},
        {"id": "2", "name": "Nước Chanh Dây Tươi Mát Lạnh", "quantity": 2, "price": 35000}
    ]

    events = []
    async for sse in pipeline.process(message=msg, menu_context=None, cart_items=mock_cart):
        events.append(sse)

    text, done = extract_sse_data(events)

    # 1. Liệt kê các món
    assert "cơm chiên hải sản hoàng kim" in text.lower()
    assert "nước chanh dây tươi mát lạnh" in text.lower()
    assert "tổng cộng" in text.lower()
    assert "155.000" in text

    # 2. Payload cartAction
    assert done is not None
    cart_act = done.get("cartAction")
    assert cart_act is not None
    assert cart_act.get("type") == "view_cart"
    assert cart_act.get("total") == 155000.0


@pytest.mark.asyncio
async def test_tc_atc_11_price_bargaining_rejection():
    """
    TC-ATC-11: Mặc cả giá sai: 'Món bò lúc lắc này giảm giá cho tôi còn 50k được không?'
    Aria phải từ chối lịch sự, khẳng định bán đúng giá niêm yết trên thực đơn.
    """
    pipeline = AriaConversationPipeline()
    msg = "Món bò lúc lắc này giảm giá cho tôi còn 50k được không?"

    events = []
    async for sse in pipeline.process(message=msg, menu_context=None, cart_items=[]):
        events.append(sse)

    text, done = extract_sse_data(events)

    # Phải từ chối mặc cả, nhắc giá niêm yết
    assert any(k in text.lower() for k in ["giá niêm yết", "đúng giá", "không áp dụng", "mặc cả", "bớt giá"])
    assert any(k in text.lower() for k in ["chất lượng", "thực đơn", "khuyến mãi", "combo", "voucher"])


@pytest.mark.asyncio
async def test_tc_rec_09_10_competitor_brand_rejection():
    """
    TC-REC-09 & TC-REC-10: Hỏi đối thủ: 'Quán có bán Pizza của The Pizza Company hoặc gà rán KFC không?'
    Aria phải khẳng định nhã nhặn nhà hàng chỉ phục vụ món ăn độc quyền theo thực đơn,
    từ chối sản phẩm KFC/The Pizza Company và không gợi ý lung tung.
    """
    pipeline = AriaConversationPipeline()
    queries = [
        "Quán có bán Pizza của The Pizza Company hoặc gà rán KFC không?",
        "Bên mình có bán gà rán KFC không bạn?",
        "Có pizza của The Pizza Company không?"
    ]

    for q in queries:
        events = []
        async for sse in pipeline.process(message=q, menu_context=None, cart_items=[]):
            events.append(sse)

        text, done = extract_sse_data(events)

        # Phải từ chối thương hiệu đối thủ
        assert any(k in text.lower() for k in ["kfc", "the pizza company", "pizza company"])
        assert any(k in text.lower() for k in ["độc quyền", "chỉ phục vụ", "không phục vụ", "thực đơn chính thức"])
        # Không được gợi ý lạc đề lẩu tom yum
        assert "lẩu tom yum" not in text.lower()


@pytest.mark.asyncio
async def test_tc_rec_02_unrealistic_low_budget():
    """
    TC-REC-02: Vi phạm kiểm soát ngân sách biên cực thấp (5 người / 50k).
    Khi khách yêu cầu gợi ý món cho 5 người với 50k (10k/người),
    Aria phải giải thích lịch thiệp ngân sách chưa đủ và đề xuất khoảng ngân sách hợp lý,
    tuyệt đối không gợi ý món ăn đơn lẻ gây hiểu nhầm hoặc vượt ngân sách.
    """
    pipeline = AriaConversationPipeline()
    queries = [
        "Tư vấn bàn tiệc cho 5 người ăn no nê với ngân sách 50.000 VNĐ",
        "Nhóm 5 người ngân sách 50k",
        "Gợi ý món cho nhóm 5 người với ngân sách 50k",
        "5 người mà chỉ có 50k ăn gì ạ"
    ]

    for q in queries:
        events = []
        async for sse in pipeline.process(message=q, menu_context=None, cart_items=[]):
            events.append(sse)

        text, done = extract_sse_data(events)
        text_lower = text.lower()

        assert any(k in text_lower for k in ["ngân sách", "50.000", "50k"])
        assert any(k in text_lower for k in ["5 người", "người"])
        assert any(k in text_lower for k in ["chi phí trung bình 10.000đ/khách sẽ khó để có một bàn tiệc no nê trọn vẹn", "khó để có một bàn tiệc", "quá thấp", "chưa đủ"])
        assert done is not None
        assert done.get("suggestedItems") == []
