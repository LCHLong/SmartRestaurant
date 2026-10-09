"""
aria_pipeline.py
Pipeline hội thoại AI Consultant "Aria" tích hợp:
1. Đặt bàn tự động qua hội thoại (Conversational Booking State Machine)
2. Lõi Advanced Hybrid RAG (Dense FAISS + Sparse BM25 + Cross-Encoder Reranker)
3. Chuyển giao nhân viên (Human Handoff tới Admin & Waiter)
"""

import os
import re
import json
import time
import asyncio
from datetime import datetime
from typing import AsyncGenerator, Optional, List, Dict, Any

from groq import AsyncGroq

from prompts.grounded_rag_prompt import (
    ARIA_GROUNDED_SYSTEM_PROMPT,
    format_grounded_candidates,
    build_grounded_system_prompt,
    _format_price,
)
from processors.system_prompt_builder import build_dynamic_context
from processors.entity_extractor import extract_suggested_items
from processors.fallback_handler import (
    build_fallback_prompt_hint,
    is_human_handoff_requested,
    get_fallback_context,
)
from processors.hybrid_retriever import HybridMenuRetriever
from processors.query_reformulator import QueryReformulator
from processors.metadata_filter import MetadataFilter, CulinaryEntityExtractor

# Reservation tools & state machine
from tools.reservation_state import (
    get_state,
    save_state,
    clear_state,
    is_slots_complete,
    is_guest_info_complete,
)
from tools.reservation_tools import (
    check_availability,
    create_reservation,
    get_user_info,
    get_restaurant_settings,
)
from tools.datetime_parser import (
    parse_date,
    parse_time,
    validate_reservation_time,
)
from tools.slot_extractor import (
    extract_all_slots,
    is_confirmation,
    is_cancellation,
)

# ─── Cấu hình Groq ──────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

_groq_client: Optional[AsyncGroq] = None


def _get_client() -> Optional[AsyncGroq]:
    global _groq_client
    if _groq_client is None:
        key = os.getenv("GROQ_API_KEY", "")
        if key:
            _groq_client = AsyncGroq(api_key=key)
    return _groq_client


def _mask_phone(phone: Optional[str]) -> str:
    if not phone or len(phone) < 6:
        return phone or ""
    return phone[:4] + "****" + phone[-3:]


class AriaConversationPipeline:
    """
    Pipeline hội thoại hoàn chỉnh:
      - Tự động nhận diện ý định đặt bàn (Reservation Intent)
      - Slot Filling tự nhiên (ngày, giờ, số người, yêu cầu, tên, SĐT)
      - Gọi backend REST API kiểm tra bàn & tạo reservation
      - Handoff thời gian thực tới Admin / Waiter
      - Duy trì 100% tính năng tư vấn thực đơn (Hybrid RAG)
    """

    def __init__(self, model: Optional[str] = None, max_history_turns: int = 10):
        self.model = model or os.getenv("GROQ_MODEL", GROQ_MODEL)
        self.max_history_turns = max_history_turns
        self.retriever = HybridMenuRetriever(index_type="menu")
        self.reformulator = QueryReformulator()

    @staticmethod
    def _is_reservation_intent(message: str) -> bool:
        """Nhận diện ý định đặt bàn từ câu thoại."""
        msg = message.lower()
        keywords = [
            "đặt bàn", "đặt chỗ", "book bàn", "book table",
            "muốn đặt", "cho tôi đặt", "cho mình đặt", "cho em đặt",
            "đặt trước", "giữ bàn", "reserve", "tôi muốn đặt",
            "đặt tiệc", "đặt phòng", "muốn book", "đặt 1 bàn", "đặt 2 bàn"
        ]
        return any(k in msg for k in keywords)

    @staticmethod
    def _chunk_tokens(text: str) -> List[str]:
        """Tách text thành các token nhỏ để mô phỏng streaming."""
        words = text.split(" ")
        tokens = []
        for i, w in enumerate(words):
            tokens.append(w + (" " if i < len(words) - 1 else ""))
        return tokens

    async def process(
        self,
        message: str,
        menu_context: Optional[List[Dict[str, Any]]] = None,
        cart_items: Optional[List[Dict[str, Any]]] = None,
        order_history: Optional[List[Dict[str, Any]]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        table_id: str = "T01",
        session_id: Optional[str] = None,
        user_id: Optional[str] = None,
        reservation_mode: bool = False,
        fallback_used: bool = False,
        restaurant_id: Optional[str] = None,
        enable_rerank: bool = True,
        top_k: int = 5,
        rerank_weight: Optional[float] = None,
        feedback_type: Optional[str] = None,
        rejected_items: Optional[List[str]] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Xử lý toàn trình một lượt thoại của khách hàng và stream kết quả qua SSE.
        """
        t_start = time.perf_counter()
        cart_items = cart_items or []
        order_history = order_history or []
        conversation_history = conversation_history or []

        try:
            # ── 1. Kiểm tra yêu cầu chuyển giao nhân viên thủ công ──────────────
            if is_human_handoff_requested(message):
                fb = get_fallback_context(menu_context or [], tier=3)
                yield self._sse("token", {"content": fb["message_hint"]})
                yield self._sse("done", {
                    "suggestedItems": [],
                    "groundedItems": [],
                    "isHandoff": True,
                    "handoffPayload": {
                        "sessionId": session_id or "unknown",
                        "reason": "CUSTOMER_REQUESTED",
                        "summary": message,
                        "timestamp": datetime.now().isoformat()
                    },
                    "metrics": {
                        "ttft_ms": round((time.perf_counter() - t_start) * 1000, 2),
                        "total_time_ms": round((time.perf_counter() - t_start) * 1000, 2),
                        "rag_count": 0,
                    }
                })
                return

            # ── 2. Xử lý ĐẶT BÀN (CONVERSATIONAL RESERVATION FLOW) ──────────────
            res_state = await get_state(session_id or "default")
            is_res_intent = self._is_reservation_intent(message) or reservation_mode

            # Nếu đang ở flow đặt bàn HOẶC phát hiện intent mới
            if (res_state.get("fsm_state") not in ("IDLE", "DONE", "HANDOFF")) or is_res_intent:
                # Nếu mới bắt đầu và user đã login -> nạp user_info để auto-fill
                if res_state.get("fsm_state") in ("IDLE", "DONE", "HANDOFF") and is_res_intent:
                    res_state["fsm_state"] = "COLLECTING_SLOTS"
                    if user_id:
                        try:
                            user_profile = await get_user_info(user_id)
                            if user_profile:
                                res_state["user_info"] = {
                                    "is_logged_in": True,
                                    "user_id": user_id,
                                    "name": user_profile.get("name"),
                                    "phone": user_profile.get("phone"),
                                    "email": user_profile.get("email"),
                                }
                        except Exception:
                            pass
                    await save_state(session_id or "default", res_state)

                async for sse_item in self._handle_reservation_turn(
                    message=message,
                    state=res_state,
                    session_id=session_id or "default",
                    user_id=user_id,
                    menu_context=menu_context,
                    t_start=t_start,
                ):
                    yield sse_item
                return  # Kết thúc lượt thoại đặt bàn, không chạy tiếp RAG

            # ── 3. Tái cấu trúc truy vấn thích ứng (Query Reformulator) ─────────
            reformulation_res = self.reformulator.reformulate(
                query=message,
                conversation_history=conversation_history,
                feedback_type=feedback_type,
                rejected_items=rejected_items,
            )
            search_query = reformulation_res.standalone_query

            # ── 4. Truy xuất RAG động (Dynamic RAG Retrieval + Reranking) ──────
            grounded_candidates: List[Dict[str, Any]] = []
            rerank_stats: Dict[str, Any] = {}

            if not menu_context:
                grounded_candidates = self.retriever.retrieve(
                    query=search_query,
                    top_k=top_k,
                    enable_rerank=enable_rerank,
                    rerank_weight=rerank_weight,
                )
                rerank_stats = self.retriever.last_rerank_stats or {}
            else:
                extractor = getattr(self.retriever, "entity_extractor", None) or CulinaryEntityExtractor()
                entities = extractor.extract(search_query)
                clean_menu_context, _ = MetadataFilter.filter_items(menu_context, entities, extractor)

                if not clean_menu_context:
                    grounded_candidates = self.retriever.retrieve(
                        query=search_query,
                        top_k=top_k,
                        enable_rerank=enable_rerank,
                        rerank_weight=rerank_weight,
                    )
                    rerank_stats = self.retriever.last_rerank_stats or {}
                elif enable_rerank and hasattr(self.retriever, "reranker"):
                    grounded_candidates = self.retriever.reranker.rerank(
                        query=search_query,
                        candidates=clean_menu_context,
                        top_k=top_k,
                        rerank_weight=rerank_weight,
                    )
                    rerank_stats = {
                        "engine": self.retriever.reranker.engine_type,
                        "candidate_count": len(grounded_candidates),
                    }
                else:
                    grounded_candidates = clean_menu_context[:top_k]

            if reformulation_res.excluded_items:
                grounded_candidates = [
                    c for c in grounded_candidates
                    if c.get("name") not in reformulation_res.excluded_items
                ]

            # ── 5. Grounded Knowledge Base Prompt Template ─────────────────────
            grounded_menu_text = format_grounded_candidates(grounded_candidates, max_items=top_k)

            dynamic_ctx = build_dynamic_context(
                menu_context=[],
                cart_items=cart_items,
                order_history=order_history,
                table_id=table_id,
                fallback_used=fallback_used,
                restaurant_id=restaurant_id,
            )

            fallback_hint = ""
            if fallback_used:
                fb_info = get_fallback_context(grounded_candidates, tier=2)
                fallback_hint = build_fallback_prompt_hint(fb_info, fallback_used)

            system_prompt = build_grounded_system_prompt(
                grounded_menu_text=grounded_menu_text,
                dynamic_context=dynamic_ctx,
                fallback_hint=fallback_hint,
            )

            # ── 6. Conversation Memory Buffer ──────────────────────────────────
            messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
            recent_history = conversation_history[-self.max_history_turns:]
            for turn in recent_history:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                groq_role = "assistant" if role in ("assistant", "ai") else "user"
                messages.append({"role": groq_role, "content": content})

            messages.append({"role": "user", "content": message})

            # ── 7. Khởi tạo Stream (Groq API hoặc Offline Fallback) ─────────────
            full_text = ""
            ttft_ms: Optional[float] = None
            client = _get_client()

            if client and os.getenv("GROQ_API_KEY"):
                try:
                    stream = await client.chat.completions.create(
                        model=self.model,
                        messages=messages,
                        stream=True,
                        temperature=0.5,
                        max_tokens=350,
                        top_p=0.9,
                    )

                    async for chunk in stream:
                        delta = chunk.choices[0].delta if chunk.choices else None
                        token = (delta.content or "") if delta else ""
                        if token:
                            if ttft_ms is None:
                                ttft_ms = (time.perf_counter() - t_start) * 1000
                            full_text += token
                            yield self._sse("token", {"content": token})
                except Exception:
                    async for token in self._stream_offline_grounded(message, grounded_candidates):
                        if ttft_ms is None:
                            ttft_ms = (time.perf_counter() - t_start) * 1000
                        full_text += token
                        yield self._sse("token", {"content": token})
            else:
                async for token in self._stream_offline_grounded(message, grounded_candidates):
                    if ttft_ms is None:
                        ttft_ms = (time.perf_counter() - t_start) * 1000
                    full_text += token
                    yield self._sse("token", {"content": token})

            if ttft_ms is None:
                ttft_ms = (time.perf_counter() - t_start) * 1000

            suggested_items = extract_suggested_items(full_text, grounded_candidates)
            total_time_ms = (time.perf_counter() - t_start) * 1000

            yield self._sse("done", {
                "suggestedItems": suggested_items,
                "groundedItems": [
                    {
                        "name": c.get("name"),
                        "price": c.get("item", c).get("price", c.get("price", 0)),
                        "final_rank": c.get("final_rank"),
                        "combined_score": c.get("combined_score"),
                    }
                    for c in grounded_candidates
                ],
                "metrics": {
                    "ttft_ms": round(ttft_ms, 2),
                    "total_time_ms": round(total_time_ms, 2),
                    "rag_count": len(grounded_candidates),
                    "rerank_engine": rerank_stats.get("engine", "offline_fallback"),
                    "reformulation": {
                        "is_reformulated": reformulation_res.is_reformulated,
                        "type": reformulation_res.reformulation_type,
                        "standalone_query": search_query,
                        "latency_ms": reformulation_res.latency_ms,
                    },
                }
            })

        except Exception as e:
            yield self._sse("error", {"message": f"Aria Pipeline error: {str(e)}"})

    async def _handle_reservation_turn(
        self,
        message: str,
        state: Dict[str, Any],
        session_id: str,
        user_id: Optional[str],
        menu_context: Optional[List[Dict[str, Any]]],
        t_start: float,
    ) -> AsyncGenerator[str, None]:
        """
        Bộ máy trạng thái (FSM) xử lý lượt hội thoại đặt bàn.
        """
        # 1. Khách hủy giữa chừng (Proposal T17)
        if is_cancellation(message):
            await clear_state(session_id)
            resp = "Dạ, Aria đã hủy tiến trình đặt bàn rồi ạ. Bạn có muốn Aria tư vấn thêm món ngon nào của quán không?"
            for t in self._chunk_tokens(resp):
                yield self._sse("token", {"content": t})
            yield self._sse("done", {
                "suggestedItems": [],
                "groundedItems": [],
                "metrics": {"total_time_ms": round((time.perf_counter() - t_start) * 1000, 2)}
            })
            return

        # 2. Đang ở trạng thái chờ xác nhận (AWAITING_CONFIRMATION)
        if state.get("fsm_state") == "AWAITING_CONFIRMATION":
            if is_confirmation(message):
                state["fsm_state"] = "CREATING_RESERVATION"
                await save_state(session_id, state)

                slots = state["slots"]
                user_info = state["user_info"]
                name = slots.get("customer_name") or user_info.get("name") or "Quý khách"
                phone = slots.get("customer_phone") or user_info.get("phone") or "0900000000"
                email = user_info.get("email")

                try:
                    res_data = await create_reservation(
                        customer_name=name,
                        customer_phone=phone,
                        guest_count=slots["guests"],
                        reservation_date=slots["date"],
                        reservation_time=slots["time"],
                        customer_email=email,
                        special_requests=slots.get("special_requests"),
                        idempotency_key=session_id,
                        user_id=user_id or user_info.get("user_id"),
                    )

                    state["fsm_state"] = "DONE"
                    state["booking_code"] = res_data.get("booking_code")
                    await save_state(session_id, state)

                    dep_note = ""
                    if res_data.get("requires_deposit"):
                        amt = res_data.get("deposit_amount", slots["guests"] * 50000)
                        dep_note = f"\n⚠️ **Lưu ý:** Nhóm ≥ 6 người cần đặt cọc **{amt:,.0f} VNĐ** (50k/người). Nhân viên sẽ liên hệ hướng dẫn thanh toán cọc nhé."

                    resp = (
                        f"🎉 **Đặt bàn thành công!**\n\n"
                        f"• Mã đặt bàn: **{res_data.get('booking_code')}**\n"
                        f"• Ngày giờ: **{slots['time']}** · **{slots['date']}**\n"
                        f"• Số lượng: **{slots['guests']} người**\n"
                        f"• Tên: **{name}** · SĐT: **{_mask_phone(phone)}**\n"
                        f"{dep_note}\n\n"
                        f"Nhà hàng sẽ gửi thông báo xác nhận và chuẩn bị bàn đón bạn thật chu đáo. Bạn có cần xem thêm món ngon trước không ạ?"
                    )

                    for t in self._chunk_tokens(resp):
                        yield self._sse("token", {"content": t})
                        await asyncio.sleep(0.005)

                    yield self._sse("done", {
                        "suggestedItems": [],
                        "groundedItems": [],
                        "reservation": res_data,
                        "metrics": {
                            "ttft_ms": round((time.perf_counter() - t_start) * 1000, 2),
                            "total_time_ms": round((time.perf_counter() - t_start) * 1000, 2),
                            "reservation_state": "DONE"
                        }
                    })
                    return

                except Exception as e:
                    err_msg = str(e)
                    # 409 Xung đột bàn (Proposal T10)
                    if "RESERVATION_CONFLICT" in err_msg or "409" in err_msg:
                        state["fsm_state"] = "COLLECTING_SLOTS"
                        state["slots"]["time"] = None
                        await save_state(session_id, state)
                        resp = "Rất tiếc! Bàn trong khung giờ này vừa có khách khác đặt trước. Bạn có muốn đổi sang một khung giờ khác gần đó không ạ?"
                    # 500 Lỗi máy chủ (Proposal T11)
                    elif "SERVER_ERROR" in err_msg or "500" in err_msg:
                        state["fsm_state"] = "HANDOFF"
                        await save_state(session_id, state)
                        resp = "Dạ, hệ thống đặt bàn tạm thời gặp sự cố kết nối. Aria đã chuyển ngay thông tin tới bộ phận Quản lý (Admin) để sắp xếp bàn ưu tiên cho bạn nhé!"
                        for t in self._chunk_tokens(resp):
                            yield self._sse("token", {"content": t})
                        yield self._sse("done", {
                            "suggestedItems": [],
                            "groundedItems": [],
                            "isHandoff": True,
                            "handoffPayload": {
                                "sessionId": session_id,
                                "reason": "BACKEND_ERROR",
                                "summary": f"Lỗi tạo đặt bàn: {err_msg}",
                                "timestamp": datetime.now().isoformat()
                            }
                        })
                        return
                    else:
                        state["fsm_state"] = "COLLECTING_SLOTS"
                        await save_state(session_id, state)
                        resp = f"Dạ, quá trình đặt bàn gặp thông báo: {err_msg}. Bạn có muốn chọn lại giờ khác không ạ?"

                    for t in self._chunk_tokens(resp):
                        yield self._sse("token", {"content": t})
                    yield self._sse("done", {
                        "suggestedItems": [],
                        "groundedItems": [],
                        "metrics": {"total_time_ms": round((time.perf_counter() - t_start) * 1000, 2)}
                    })
                    return

            # Nếu khách không trả lời "ok" mà đổi slot (Slot correction - Proposal T16)
            # Tiếp tục chạy xuống logic trích xuất slot bên dưới

        # 3. Trích xuất slots từ tin nhắn hiện tại
        extracted = extract_all_slots(message, state)

        # Cảnh báo số điện thoại sai định dạng nếu có (Proposal T24)
        if extracted.get("phone_warning"):
            for t in self._chunk_tokens(extracted["phone_warning"]):
                yield self._sse("token", {"content": t})
            yield self._sse("done", {"suggestedItems": [], "groundedItems": []})
            return

        # Cập nhật slot mới
        slots = state["slots"]
        for key in ["date", "time", "guests", "customer_name", "customer_phone", "special_requests"]:
            if extracted.get(key) is not None:
                slots[key] = extracted[key]

        # 4. Kiểm tra nhóm quá đông (> 10 người) -> Handoff ngay (Proposal T07)
        if slots.get("guests") and slots["guests"] > 10:
            state["fsm_state"] = "HANDOFF"
            await save_state(session_id, state)
            resp = (
                f"Dạ, với nhóm từ **{slots['guests']} người**, Aria xin phép chuyển ngay yêu cầu "
                f"tới Quản lý (Admin) và Nhân viên phục vụ (Waiter) để tư vấn sắp xếp bàn lớn / phòng riêng "
                f"và chuẩn bị chu đáo nhất. Nhân viên sẽ liên hệ với bạn trong ít phút qua số điện thoại hoặc "
                f"bạn có thể gọi hotline **0901.234.567** nhé!"
            )
            for t in self._chunk_tokens(resp):
                yield self._sse("token", {"content": t})
            yield self._sse("done", {
                "suggestedItems": [],
                "groundedItems": [],
                "isHandoff": True,
                "handoffPayload": {
                    "sessionId": session_id,
                    "reason": "GROUP_SIZE_EXCEEDED",
                    "summary": f"Khách muốn đặt bàn cho {slots['guests']} người",
                    "timestamp": datetime.now().isoformat()
                }
            })
            return

        # 5. Lấy cấu hình hệ thống động (open_time, close_time, wifi, restaurant_name...)
        settings = await get_restaurant_settings()
        open_time = settings.get("open_time", "08:00")
        close_time = settings.get("close_time", "22:00")
        restaurant_name = settings.get("restaurant_name", "SmartRestaurant")
        wifi_password = settings.get("wifi_password", "12345678")

        # 5.1 Kiểm tra câu hỏi chen ngang (Context Distraction - Proposal T20)
        # Nếu câu thoại không chứa slot mới nào, không phải xác nhận/hủy, và có vẻ là câu hỏi
        has_new_slot = any(extracted.get(k) is not None for k in ["date", "time", "guests", "customer_name", "customer_phone"])
        if not has_new_slot and any(q in message.lower() for q in ["đỗ xe", "gửi xe", "wifi", "ở đâu", "mở cửa", "mấy giờ", "có món", "món gì"]):
            # Trả lời câu hỏi phụ
            ans = ""
            if "đỗ xe" in message.lower() or "gửi xe" in message.lower():
                ans = f"Dạ, {restaurant_name} có bãi đỗ xe ô tô và xe máy rộng rãi, có bảo vệ trông giữ miễn phí ạ."
            elif "wifi" in message.lower():
                ans = f"Dạ, quán có wifi tốc độ cao miễn phí (tên wifi: {restaurant_name}, pass: {wifi_password}) ạ."
            else:
                ans = f"Dạ, {restaurant_name} mở cửa đón khách từ {open_time} đến {close_time} hàng ngày với nhiều món ăn đặc sắc ạ."

            missing = self._get_missing_slots(state)
            reminder = self._build_slot_question(missing, state)
            full_resp = f"{ans}\n\n*(Quay lại thông tin đặt bàn: {reminder})*"

            for t in self._chunk_tokens(full_resp):
                yield self._sse("token", {"content": t})
            yield self._sse("done", {"suggestedItems": [], "groundedItems": []})
            return

        # 6. Kiểm tra tính hợp lệ của ngày giờ (nếu có đủ date và time)
        if slots.get("date") and slots.get("time"):
            is_valid, err_code, err_msg = validate_reservation_time(
                slots["date"],
                slots["time"],
                open_time=open_time,
                close_time=close_time,
            )
            if not is_valid:
                if err_code == "PAST_TIME":
                    slots["date"] = None
                    slots["time"] = None
                elif err_code == "OUTSIDE_OPERATING_HOURS":
                    slots["time"] = None
                elif err_code == "POLICY_MAX_DAYS":
                    slots["date"] = None

                await save_state(session_id, state)
                for t in self._chunk_tokens(err_msg):
                    yield self._sse("token", {"content": t})
                yield self._sse("done", {"suggestedItems": [], "groundedItems": []})
                return

        # 7. Nếu người dùng nhập giờ mơ hồ (VD: "7h" không rõ sáng/tối - Proposal T02)
        if extracted.get("time_ambiguous") and not slots.get("time"):
            await save_state(session_id, state)
            resp = "Bạn muốn đặt bàn lúc **7h sáng** hay **7h tối (19:00)** ạ?"
            for t in self._chunk_tokens(resp):
                yield self._sse("token", {"content": t})
            yield self._sse("done", {"suggestedItems": [], "groundedItems": []})
            return

        # 8. Kiểm tra các slot còn thiếu
        missing = self._get_missing_slots(state)

        # Nếu còn thiếu slot -> Hỏi tiếp (tối đa 1-2 slot mỗi lượt)
        if missing:
            state["fsm_state"] = "COLLECTING_SLOTS"
            await save_state(session_id, state)

            resp = self._build_slot_question(missing, state)
            # Nếu nhóm >= 6 người, kèm lời nhắc cọc (Proposal T06 & T25)
            if slots.get("guests") and slots["guests"] >= 6:
                resp += f"\n\n*(Lưu ý: Với nhóm {slots['guests']} người, theo chính sách nhà hàng cần đặt cọc 50.000đ/người để bảo đảm giữ bàn chu đáo ạ)*"

            for t in self._chunk_tokens(resp):
                yield self._sse("token", {"content": t})
            yield self._sse("done", {"suggestedItems": [], "groundedItems": []})
            return

        # 9. Khi đã đủ toàn bộ slot -> Gọi check_availability
        state["fsm_state"] = "CHECKING_AVAILABILITY"
        await save_state(session_id, state)

        try:
            avail = await check_availability(
                date=slots["date"],
                time=slots["time"],
                guest_count=slots["guests"],
                open_time=open_time,
                close_time=close_time,
            )
            state["last_availability"] = avail

            if avail.get("available"):
                state["fsm_state"] = "AWAITING_CONFIRMATION"
                await save_state(session_id, state)

                user_info = state["user_info"]
                name = slots.get("customer_name") or user_info.get("name") or "Quý khách"
                phone = slots.get("customer_phone") or user_info.get("phone") or ""

                dep_text = ""
                if slots["guests"] >= 6:
                    amt = slots["guests"] * 50000
                    dep_text = f"\n• Cọc bàn: **{amt:,.0f} VNĐ** (50.000đ/người)"

                special_text = f"\n• Ghi chú: **{slots['special_requests']}**" if slots.get("special_requests") else ""

                resp = (
                    f"Dạ còn bàn trống ạ! Aria tóm tắt lại thông tin đặt bàn:\n\n"
                    f"📅 Ngày: **{slots['date']}** lúc **{slots['time']}**\n"
                    f"👥 Số khách: **{slots['guests']} người**\n"
                    f"👤 Khách hàng: **{name}** · SĐT: **{_mask_phone(phone)}**"
                    f"{special_text}"
                    f"{dep_text}\n\n"
                    f"Bạn xác nhận đặt bàn không ạ? (Trả lời **'ok'** hoặc **'xác nhận'**)"
                )
            else:
                # Hết bàn trong khung giờ này (Proposal T05)
                state["fsm_state"] = "COLLECTING_SLOTS"
                state["slots"]["time"] = None
                await save_state(session_id, state)

                sug = avail.get("suggested_times", [])
                sug_str = f" như **{sug[0]}** hoặc **{sug[1]}**" if len(sug) >= 2 else " khác"

                resp = (
                    f"Rất tiếc! Ngày **{slots['date']}** lúc **{avail.get('time')}** "
                    f"đã hết bàn cho nhóm {slots['guests']} người. "
                    f"Aria có thể gợi ý bạn chọn khung giờ{sug_str} được không ạ?"
                )

        except Exception as e:
            state["fsm_state"] = "COLLECTING_SLOTS"
            await save_state(session_id, state)
            resp = f"Aria gặp sự cố khi kiểm tra bàn trống: {str(e)}. Bạn có muốn thử lại không?"

        for t in self._chunk_tokens(resp):
            yield self._sse("token", {"content": t})
        yield self._sse("done", {
            "suggestedItems": [],
            "groundedItems": [],
            "metrics": {"total_time_ms": round((time.perf_counter() - t_start) * 1000, 2)}
        })

    def _get_missing_slots(self, state: Dict[str, Any]) -> List[str]:
        """Xác định các slot còn thiếu theo thứ tự ưu tiên."""
        slots = state.get("slots", {})
        user_info = state.get("user_info", {})
        missing = []

        if not slots.get("date"):
            missing.append("date")
        if not slots.get("time"):
            missing.append("time")
        if not slots.get("guests"):
            missing.append("guests")

        # Nếu chưa đăng nhập thì cần hỏi Tên và SĐT
        if not user_info.get("is_logged_in"):
            if not slots.get("customer_name"):
                missing.append("customer_name")
            if not slots.get("customer_phone"):
                missing.append("customer_phone")

        return missing

    def _build_slot_question(self, missing: List[str], state: Dict[str, Any]) -> str:
        """Tạo câu hỏi tự nhiên cho 1-2 slot thiếu đầu tiên."""
        user_name = state.get("user_info", {}).get("name")
        greeting = f"Chào {user_name}! " if user_name and not state.get("slots", {}).get("date") else "Dạ, "

        questions = {
            "date": "bạn muốn đặt bàn vào ngày nào ạ?",
            "time": "bạn muốn đến lúc mấy giờ?",
            "guests": "nhóm bạn dự kiến đi bao nhiêu người?",
            "customer_name": "cho Aria xin họ tên của bạn để đặt bàn nhé?",
            "customer_phone": "cho Aria xin số điện thoại di động để gửi xác nhận nhé?",
        }

        # Chỉ hỏi tối đa 2 câu một lúc để tránh hỏi dồn dập
        first = missing[0]
        if len(missing) == 1:
            return f"{greeting}{questions[first]}"

        second = missing[1]
        # Kết hợp tự nhiên nếu thiếu date + time
        if first == "date" and second == "time":
            return f"{greeting}bạn muốn đặt bàn ngày nào và lúc mấy giờ ạ?"
        # Nếu thiếu date + guests
        if first == "date" and second == "guests":
            return f"{greeting}bạn muốn đặt bàn ngày nào và bao nhiêu người ạ?"
        # Nếu thiếu name + phone
        if first == "customer_name" and second == "customer_phone":
            return f"{greeting}cho Aria xin họ tên và số điện thoại liên hệ của bạn nhé?"

        return f"{greeting}{questions[first]} Và {questions[second]}"

    async def _stream_offline_grounded(
        self,
        query: str,
        candidates: List[Dict[str, Any]]
    ) -> AsyncGenerator[str, None]:
        """Sinh phản hồi Grounded token-by-token ngoại tuyến."""
        if not candidates:
            tokens = [
                "Dạ ", "Aria ", "chào ", "quý khách! ",
                "Hiện ", "tại ", "nhà hàng ", "chưa ", "có ", "món ",
                "phù hợp ", "với ", f"yêu cầu '{query}'. ",
                "Quý khách ", "có muốn ", "xem ", "các ", "món ", "đặc sản ", "khác ", "không ạ?"
            ]
        else:
            top_dish = candidates[0]
            name = top_dish.get("name", "Món ngon")
            raw = top_dish.get("item", top_dish)
            price = _format_price(raw.get("price", top_dish.get("price", 0)))
            desc = raw.get("description", "")

            tokens = [
                "Dạ, ", "Aria ", "xin ", "gợi ý ", f"**{name}** ",
                f"· {price} ", "rất ", "phù hợp ", "với ", "yêu cầu ", "của ", "quý khách ạ. ",
            ]
            if desc:
                tokens.append(f"{desc} ")
            if len(candidates) > 1:
                second_dish = candidates[1]
                s_name = second_dish.get("name")
                s_price = _format_price(second_dish.get("item", second_dish).get("price", 0))
                tokens.extend([
                    "Ngoài ra, ", "quý khách ", "cũng ", "có thể ", "thử thêm ",
                    f"**{s_name}** ", f"· {s_price} ", "ạ!"
                ])

        for t in tokens:
            await asyncio.sleep(0.005)
            yield t

    @staticmethod
    def _sse(event_type: str, data: dict) -> str:
        """Đóng gói Server-Sent Event (SSE) theo chuẩn W3C."""
        payload = {"type": event_type, **data}
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
