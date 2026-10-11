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
    escalate_reservation,
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
    check_side_query_intent,
    is_valid_vn_phone,
    is_additional_booking_intent,
    is_reschedule_intent,
    check_schedule_choice,
    is_phone_inquiry,
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
    """
    Trả về số điện thoại hiển thị cho khách hàng trong phiên hội thoại.
    Không mask che số để:
    1. Khách hàng kiểm tra, đối chiếu chính xác số điện thoại liên hệ của mình.
    2. Tránh xung đột cú pháp markdown (**0987****321**) làm nuốt dấu sao và hiển thị cụt số (0987321).
    """
    return phone or ""


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

            # Đồng bộ trạng thái đăng nhập: nếu user_id là None (guest/đã logout) nhưng state cũ vẫn lưu user_info
            if not user_id and res_state.get("user_info", {}).get("is_logged_in"):
                res_state["user_info"] = {
                    "is_logged_in": False,
                    "user_id": None,
                    "name": None,
                    "phone": None,
                    "email": None,
                }
                slots = res_state.get("slots", {})
                slots["customer_name"] = None
                slots["customer_phone"] = None
                slots["customer_email"] = None
                await save_state(session_id or "default", res_state)
            elif user_id and res_state.get("user_info", {}).get("user_id") != user_id:
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
                        slots = res_state.get("slots", {})
                        slots["customer_name"] = None
                        slots["customer_phone"] = None
                        slots["customer_email"] = None
                        await save_state(session_id or "default", res_state)
                except Exception:
                    pass

            # Nếu đang ở flow đặt bàn HOẶC phát hiện intent mới
            if (res_state.get("fsm_state") not in ("IDLE", "DONE", "HANDOFF")) or is_res_intent:
                # Nếu mới bắt đầu và user đã login -> nạp user_info để auto-fill
                if res_state.get("fsm_state") in ("IDLE", "DONE", "HANDOFF") and is_res_intent:
                    res_state["fsm_state"] = "COLLECTING_SLOTS"
                    res_state["slots"] = {
                        "date": None,
                        "time": None,
                        "time_ambiguous": False,
                        "pending_ambiguous_hour": None,
                        "guests": None,
                        "customer_name": None,
                        "customer_phone": None,
                        "customer_email": None,
                        "special_requests": None,
                    }
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
                    else:
                        res_state["user_info"] = {
                            "is_logged_in": False,
                            "user_id": None,
                            "name": None,
                            "phone": None,
                            "email": None,
                        }
                    await save_state(session_id or "default", res_state)

                async for sse_item in self._handle_reservation_turn(
                    message=message,
                    state=res_state,
                    session_id=session_id or "default",
                    user_id=user_id,
                    menu_context=menu_context,
                    t_start=t_start,
                    cart_items=cart_items,
                    order_history=order_history,
                    conversation_history=conversation_history,
                    table_id=table_id,
                    fallback_used=fallback_used,
                    restaurant_id=restaurant_id,
                    enable_rerank=enable_rerank,
                    top_k=top_k,
                    rerank_weight=rerank_weight,
                    feedback_type=feedback_type,
                    rejected_items=rejected_items,
                ):
                    yield sse_item
                return  # Kết thúc lượt thoại đặt bàn

            # ── 3. Luồng tư vấn thực đơn RAG chuẩn (Consultation Flow) ───────────
            async for sse_item in self._handle_consultation_flow(
                message=message,
                menu_context=menu_context,
                cart_items=cart_items,
                order_history=order_history,
                conversation_history=conversation_history,
                table_id=table_id,
                fallback_used=fallback_used,
                restaurant_id=restaurant_id,
                enable_rerank=enable_rerank,
                top_k=top_k,
                rerank_weight=rerank_weight,
                feedback_type=feedback_type,
                rejected_items=rejected_items,
                t_start=t_start,
            ):
                yield sse_item

        except Exception as e:
            yield self._sse("error", {"message": f"Aria Pipeline error: {str(e)}"})

    async def _handle_consultation_flow(
        self,
        message: str,
        menu_context: Optional[List[Dict[str, Any]]],
        cart_items: Optional[List[Dict[str, Any]]],
        order_history: Optional[List[Dict[str, Any]]],
        conversation_history: Optional[List[Dict[str, Any]]],
        table_id: str,
        fallback_used: bool,
        restaurant_id: Optional[str],
        enable_rerank: bool,
        top_k: int,
        rerank_weight: Optional[float],
        feedback_type: Optional[str],
        rejected_items: Optional[List[str]],
        t_start: float,
        prefix_message: Optional[str] = None,
        postfix_message: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Luồng tư vấn thực đơn (Hybrid RAG: BM25 + FAISS + Reranker + LLM Stream).
        Hỗ trợ prefix_message và postfix_message khi được gọi từ luồng đặt bàn.
        """
        if prefix_message:
            for t in self._chunk_tokens(prefix_message):
                yield self._sse("token", {"content": t})

        # 1. Tái cấu trúc truy vấn thích ứng (Query Reformulator)
        reformulation_res = self.reformulator.reformulate(
            query=message,
            conversation_history=conversation_history,
            feedback_type=feedback_type,
            rejected_items=rejected_items,
        )
        search_query = reformulation_res.standalone_query

        # 2. Truy xuất RAG động (Dynamic RAG Retrieval + Reranking)
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

        # 3. Grounded Knowledge Base Prompt Template
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

        # 4. Conversation Memory Buffer
        messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
        recent_history = conversation_history[-self.max_history_turns:] if conversation_history else []
        for turn in recent_history:
            role = turn.get("role", "user")
            content = turn.get("content", "")
            groq_role = "assistant" if role in ("assistant", "ai") else "user"
            messages.append({"role": groq_role, "content": content})

        messages.append({"role": "user", "content": message})

        # 5. Khởi tạo Stream (Groq API hoặc Offline Fallback)
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

        # Nếu có lời nhắc postfix (quay lại đặt bàn)
        if postfix_message:
            for t in self._chunk_tokens(postfix_message):
                yield self._sse("token", {"content": t})

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

    async def _handle_reservation_turn(
        self,
        message: str,
        state: Dict[str, Any],
        session_id: str,
        user_id: Optional[str],
        menu_context: Optional[List[Dict[str, Any]]],
        t_start: float,
        cart_items: Optional[List[Dict[str, Any]]] = None,
        order_history: Optional[List[Dict[str, Any]]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        table_id: str = "T01",
        fallback_used: bool = False,
        restaurant_id: Optional[str] = None,
        enable_rerank: bool = True,
        top_k: int = 5,
        rerank_weight: Optional[float] = None,
        feedback_type: Optional[str] = None,
        rejected_items: Optional[List[str]] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Bộ máy trạng thái (FSM) xử lý lượt hội thoại đặt bàn.
        """
        # 1. Khách hủy hoặc tạm dừng giữa chừng (Proposal T17)
        if is_cancellation(message):
            await clear_state(session_id)
            is_side_query, q_type = check_side_query_intent(message)
            if is_side_query and q_type == "MENU_CONSULTATION":
                # Khách tạm dừng / hủy để xem thực đơn -> Chuyển sang tư vấn món ngay
                prefix = "Dạ, Aria đã tạm dừng tiến trình đặt bàn rồi ạ. Về thực đơn và các món của quán:\n\n"
                async for item in self._handle_consultation_flow(
                    message=message,
                    menu_context=menu_context,
                    cart_items=cart_items,
                    order_history=order_history,
                    conversation_history=conversation_history,
                    table_id=table_id,
                    fallback_used=fallback_used,
                    restaurant_id=restaurant_id,
                    enable_rerank=enable_rerank,
                    top_k=top_k,
                    rerank_weight=rerank_weight,
                    feedback_type=feedback_type,
                    rejected_items=rejected_items,
                    t_start=t_start,
                    prefix_message=prefix,
                ):
                    yield item
                return

            resp = "Dạ, Aria đã tạm dừng tiến trình đặt bàn rồi ạ. Bạn có muốn Aria tư vấn thêm món ngon nào của quán không?"
            for t in self._chunk_tokens(resp):
                yield self._sse("token", {"content": t})
            yield self._sse("done", {
                "suggestedItems": [],
                "groundedItems": [],
                "metrics": {"total_time_ms": round((time.perf_counter() - t_start) * 1000, 2)}
            })
            return

        # 1.1 Khách đang có lựa chọn giữa đổi lịch hay đặt thêm bàn (pending_schedule_choice)
        if state.get("pending_schedule_choice"):
            choice = check_schedule_choice(message)
            psc = state.pop("pending_schedule_choice")
            slots = state["slots"]
            if choice == "RESCHEDULE":
                if psc.get("date"):
                    slots["date"] = psc["date"]
                if psc.get("time"):
                    slots["time"] = psc["time"]
                if psc.get("guests"):
                    slots["guests"] = psc["guests"]
                await save_state(session_id, state)
            elif choice == "ADD_NEW":
                state["queued_booking"] = psc
                missing = self._get_missing_slots(state)
                if missing:
                    state["fsm_state"] = "COLLECTING_SLOTS"
                    await save_state(session_id, state)
                    slot_q = self._build_slot_question(missing, state, reask_count=1)
                    if slot_q.startswith("Dạ, "):
                        slot_q = slot_q[4:]
                        slot_q = slot_q[0].upper() + slot_q[1:] if len(slot_q) > 0 else slot_q
                    resp = (
                        f"Dạ, Aria đã ghi nhận bạn muốn đặt thêm bàn vào ngày **{psc.get('date')}** lúc **{psc.get('time')}**.\n"
                        f"Aria xin phép hoàn tất đơn đặt bàn cho ngày **{slots.get('date')}** lúc **{slots.get('time')}** trước nhé!\n\n"
                        f"{slot_q}"
                    )
                    for t in self._chunk_tokens(resp):
                        yield self._sse("token", {"content": t})
                    yield self._sse("done", {"suggestedItems": [], "groundedItems": []})
                    return
                else:
                    await save_state(session_id, state)
            elif choice == "KEEP_CURRENT":
                await save_state(session_id, state)
            else:
                state["pending_schedule_choice"] = psc
                await save_state(session_id, state)
                resp = (
                    f"Dạ, để Aria hỗ trợ tốt nhất, bạn muốn **đổi lịch** đơn hiện tại "
                    f"sang **{psc.get('time')} ngày {psc.get('date')}** hay muốn **đặt thêm bàn mới** ạ? "
                    f"(Bạn có thể trả lời 'đổi lịch' hoặc 'đặt thêm')"
                )
                for t in self._chunk_tokens(resp):
                    yield self._sse("token", {"content": t})
                yield self._sse("done", {"suggestedItems": [], "groundedItems": []})
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
                email = slots.get("customer_email") or user_info.get("email")

                try:
                    res_count = state.get("completed_bookings_count", 0) + 1
                    res_data = await create_reservation(
                        customer_name=name,
                        customer_phone=phone,
                        guest_count=slots["guests"],
                        reservation_date=slots["date"],
                        reservation_time=slots["time"],
                        customer_email=email,
                        special_requests=slots.get("special_requests"),
                        idempotency_key=f"{session_id}_{res_count}",
                        user_id=user_id or user_info.get("user_id"),
                    )

                    state["booking_code"] = res_data.get("booking_code")
                    state["completed_bookings_count"] = res_count

                    dep_note = ""
                    if res_data.get("requires_deposit"):
                        amt = res_data.get("deposit_amount", slots["guests"] * 50000)
                        dep_note = f"\n⚠️ **Lưu ý:** Nhóm ≥ 6 người cần đặt cọc **{amt:,.0f} VNĐ** (50k/người). Nhân viên sẽ liên hệ hướng dẫn thanh toán cọc nhé."

                    email_note = f" và email **{email}**" if email else ""

                    queued = state.pop("queued_booking", None)
                    if queued:
                        new_slots = {
                            "date": queued.get("date"),
                            "time": queued.get("time"),
                            "guests": queued.get("guests") or slots.get("guests") or 2,
                            "customer_name": name,
                            "customer_phone": phone,
                            "customer_email": email,
                            "special_requests": queued.get("special_requests"),
                        }
                        state["slots"] = new_slots

                        settings = await get_restaurant_settings()
                        open_time = settings.get("open_time", "08:00")
                        close_time = settings.get("close_time", "22:00")

                        avail2 = await check_availability(
                            date=new_slots["date"],
                            time=new_slots["time"],
                            guest_count=new_slots["guests"],
                            open_time=open_time,
                            close_time=close_time,
                        )
                        state["last_availability"] = avail2
                        if avail2.get("available"):
                            state["fsm_state"] = "AWAITING_CONFIRMATION"
                            await save_state(session_id, state)

                            dep_note2 = ""
                            if new_slots["guests"] >= 6:
                                amt2 = new_slots["guests"] * 50000
                                dep_note2 = f"\n• Cọc bàn: **{amt2:,.0f} VNĐ** (50.000đ/người)"

                            resp = (
                                f"🎉 **Đặt bàn 1 thành công!**\n\n"
                                f"• Mã đặt bàn: **{res_data.get('booking_code')}**\n"
                                f"• Ngày giờ: **{slots['time']}** · **{slots['date']}**\n"
                                f"• Số lượng: **{slots['guests']} người**\n"
                                f"• Tên: **{name}** · SĐT: **{_mask_phone(phone)}**\n"
                                f"{dep_note}\n\n"
                                f"Nhà hàng đã gửi vé xác nhận có mã QR qua SĐT{email_note}.\n\n"
                                f"---\n\n"
                                f"📋 **Tiếp tục với đơn đặt thêm thứ 2:**\n"
                                f"Dạ bàn vào **{new_slots['date']}** lúc **{new_slots['time']}** cho **{new_slots['guests']} người** vẫn còn trống ạ!\n"
                                f"Thông tin liên hệ được giữ nguyên: **{name}** · SĐT: **{_mask_phone(phone)}**{email_note}{dep_note2}\n\n"
                                f"Bạn có muốn xác nhận đặt luôn bàn thứ 2 này không ạ? (Trả lời **'ok'** hoặc **'xác nhận'**)"
                            )
                        else:
                            state["fsm_state"] = "COLLECTING_SLOTS"
                            state["slots"]["time"] = None
                            await save_state(session_id, state)

                            sug = avail2.get("suggested_times", [])
                            sug_str = f" như **{sug[0]}** hoặc **{sug[1]}**" if len(sug) >= 2 else " khác"
                            resp = (
                                f"🎉 **Đặt bàn 1 thành công!**\n\n"
                                f"• Mã đặt bàn: **{res_data.get('booking_code')}**\n"
                                f"• Ngày giờ: **{slots['time']}** · **{slots['date']}**\n"
                                f"• Số lượng: **{slots['guests']} người**\n"
                                f"• Tên: **{name}** · SĐT: **{_mask_phone(phone)}**\n"
                                f"{dep_note}\n\n"
                                f"Nhà hàng đã gửi vé xác nhận có mã QR qua SĐT{email_note}.\n\n"
                                f"---\n\n"
                                f"📋 **Về đơn đặt thêm thứ 2:**\n"
                                f"Rất tiếc! Ngày **{new_slots['date']}** lúc **{avail2.get('time')}** đã hết bàn cho nhóm {new_slots['guests']} người. "
                                f"Aria có thể gợi ý bạn chọn khung giờ{sug_str} được không ạ?"
                            )
                    else:
                        state["fsm_state"] = "DONE"
                        await save_state(session_id, state)
                        resp = (
                            f"🎉 **Đặt bàn thành công!**\n\n"
                            f"• Mã đặt bàn: **{res_data.get('booking_code')}**\n"
                            f"• Ngày giờ: **{slots['time']}** · **{slots['date']}**\n"
                            f"• Số lượng: **{slots['guests']} người**\n"
                            f"• Tên: **{name}** · SĐT: **{_mask_phone(phone)}**\n"
                            f"{dep_note}\n\n"
                            f"Nhà hàng đã gửi vé xác nhận có mã QR qua SĐT{email_note} và chuẩn bị bàn đón bạn thật chu đáo. Bạn có cần xem thêm món ngon trước không ạ?"
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
                            "reservation_state": state["fsm_state"]
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

            else:
                # Khách đang ở AWAITING_CONFIRMATION nhưng không xác nhận:
                # Kiểm tra xem khách có ý định đổi slot (ngày, giờ, số người, tên...) hay không
                extracted_changes = extract_all_slots(message, state)
                has_slot_change = any(extracted_changes.get(k) is not None for k in ["date", "time", "guests", "customer_name", "customer_phone", "customer_email", "special_requests"])
                is_side_query, q_type = check_side_query_intent(message)

                if not has_slot_change and is_side_query:
                    if q_type == "MENU_CONSULTATION":
                        postfix = "\n\n*(Thông tin đặt bàn trước đó của bạn vẫn đang được lưu. Bạn có muốn xác nhận đặt bàn luôn ('ok' / 'xác nhận') không ạ, hoặc cần Aria tư vấn thêm món nào nữa không?)*"
                        async for item in self._handle_consultation_flow(
                            message=message,
                            menu_context=menu_context,
                            cart_items=cart_items,
                            order_history=order_history,
                            conversation_history=conversation_history,
                            table_id=table_id,
                            fallback_used=fallback_used,
                            restaurant_id=restaurant_id,
                            enable_rerank=enable_rerank,
                            top_k=top_k,
                            rerank_weight=rerank_weight,
                            feedback_type=feedback_type,
                            rejected_items=rejected_items,
                            t_start=t_start,
                            postfix_message=postfix,
                        ):
                            yield item
                        return
                    elif q_type == "FACILITY_INFO":
                        settings = await get_restaurant_settings()
                        ans = self._answer_facility_question(message, settings)
                        reminder = "Thông tin đặt bàn của bạn đã sẵn sàng. Bạn có muốn xác nhận ('ok' / 'xác nhận') hay cần điều chỉnh gì không ạ? (Hoặc có thể nói 'khoan đặt' để tạm dừng nhé)"
                        full_resp = f"{ans}\n\n*({reminder})*"
                        for t in self._chunk_tokens(full_resp):
                            yield self._sse("token", {"content": t})
                        yield self._sse("done", {"suggestedItems": [], "groundedItems": []})
                        return

                if not has_slot_change:
                    # Khách không xác nhận và cũng không đổi slot -> nhắc nhẹ nhàng, không lặp lại toàn bộ thẻ
                    resp = "Dạ, thông tin đặt bàn của bạn đã sẵn sàng. Bạn có muốn điều chỉnh thông tin nào hay xác nhận ('ok' / 'xác nhận') để Aria tiến hành chốt bàn luôn ạ? (Hoặc có thể nói 'khoan đặt' để tạm dừng nhé)"
                    for t in self._chunk_tokens(resp):
                        yield self._sse("token", {"content": t})
                    yield self._sse("done", {
                        "suggestedItems": [],
                        "groundedItems": [],
                        "metrics": {"total_time_ms": round((time.perf_counter() - t_start) * 1000, 2)}
                    })
                    return

        # 3. Trích xuất slots từ tin nhắn hiện tại
        extracted = extract_all_slots(message, state)

        # Cập nhật slot mới
        slots = state["slots"]
        is_add_booking = is_additional_booking_intent(message)
        is_resched = is_reschedule_intent(message)

        if is_add_booking and (slots.get("date") or slots.get("time")):
            # Tách riêng slot của bàn đặt thêm vào queued_booking
            extra_slots = extract_all_slots(message, {})
            queued = state.get("queued_booking") or {}
            if extra_slots.get("date"):
                queued["date"] = extra_slots["date"]
            if extra_slots.get("time"):
                queued["time"] = extra_slots["time"]
            if extra_slots.get("guests"):
                queued["guests"] = extra_slots["guests"]
            elif not queued.get("guests") and slots.get("guests"):
                queued["guests"] = slots["guests"]
            state["queued_booking"] = queued

            # Bảo vệ đơn hiện tại: không ghi đè ngày giờ đơn 1
            extracted.pop("date", None)
            extracted.pop("time", None)
            extracted.pop("time_ambiguous", None)
            extracted.pop("pending_ambiguous_hour", None)
            if slots.get("guests") and extra_slots.get("guests"):
                extracted.pop("guests", None)

        elif not is_add_booking and not is_resched and slots.get("date") and slots.get("time"):
            new_date = extracted.get("date")
            new_time = extracted.get("time")
            has_new_date = new_date and new_date != slots["date"]
            has_new_time = new_time and new_time != slots["time"]

            # Chỉ hỏi khi thực sự có ngày hoặc giờ khác và không phải đang xử lý giờ mơ hồ
            if (has_new_date or has_new_time) and not slots.get("pending_ambiguous_hour"):
                state["pending_schedule_choice"] = {
                    "date": new_date or slots["date"],
                    "time": new_time or slots["time"],
                    "guests": extracted.get("guests") or slots.get("guests"),
                }
                await save_state(session_id, state)
                psc = state["pending_schedule_choice"]
                resp = (
                    f"Aria thấy bạn vừa nhắc tới mốc thời gian **{psc['time']}** ngày **{psc['date']}** "
                    f"(trong khi đơn hiện tại đang chọn là **{slots['time']}** ngày **{slots['date']}**).\n\n"
                    f"Bạn muốn **đổi lịch** đơn hiện tại sang thời gian mới hay muốn **đặt thêm bàn mới** ạ? "
                    f"(Bạn có thể trả lời 'đổi lịch' hoặc 'đặt thêm')"
                )
                for t in self._chunk_tokens(resp):
                    yield self._sse("token", {"content": t})
                yield self._sse("done", {"suggestedItems": [], "groundedItems": []})
                return

        for key in ["date", "time", "guests", "customer_name", "customer_phone", "customer_email", "special_requests"]:
            if extracted.get(key) is not None:
                slots[key] = extracted[key]

        if "pending_ambiguous_hour" in extracted:
            slots["pending_ambiguous_hour"] = extracted["pending_ambiguous_hour"]

        # Cảnh báo số điện thoại sai định dạng nếu có (Proposal T24)
        if extracted.get("phone_warning"):
            await save_state(session_id, state)
            for t in self._chunk_tokens(extracted["phone_warning"]):
                yield self._sse("token", {"content": t})
            yield self._sse("done", {"suggestedItems": [], "groundedItems": []})
            return

        # Cảnh báo số lượng khách không hợp lệ (<= 0) (P1 Validation Bug)
        if extracted.get("guests_warning") or (slots.get("guests") is not None and (not isinstance(slots["guests"], int) or slots["guests"] <= 0)):
            slots["guests"] = None
            if state.get("queued_booking", {}).get("guests") and state["queued_booking"]["guests"] <= 0:
                state["queued_booking"]["guests"] = None
            await save_state(session_id, state)
            warning_msg = extracted.get("guests_warning") or "Dạ, số lượng khách đặt bàn phải từ 1 người trở lên ạ. Quý khách vui lòng cho Aria biết chính xác số người trong nhóm nhé!"
            for t in self._chunk_tokens(warning_msg):
                yield self._sse("token", {"content": t})
            yield self._sse("done", {
                "suggestedItems": [],
                "groundedItems": [],
                "metrics": {"total_time_ms": round((time.perf_counter() - t_start) * 1000, 2)}
            })
            return

        # 4. Lấy cấu hình hệ thống động (hotline, open_time, close_time...)
        settings = await get_restaurant_settings()
        hotline = settings.get("hotline", "0901.234.567")
        open_time = settings.get("open_time", "08:00")
        close_time = settings.get("close_time", "22:00")
        restaurant_name = settings.get("restaurant_name", "SmartRestaurant")
        wifi_password = settings.get("wifi_password", "12345678")

        # 4.1 Kiểm tra nhóm quá đông (> 10 người) -> Bắt buộc có thông tin liên hệ trước khi Handoff (Proposal T07)
        if slots.get("guests") and slots["guests"] > 10:
            user_info = state.get("user_info", {})
            is_logged_in = user_info.get("is_logged_in", False)
            customer_phone = slots.get("customer_phone") or user_info.get("phone")
            customer_name = slots.get("customer_name") or user_info.get("name")
            customer_email = slots.get("customer_email") or user_info.get("email")

            # Nếu chưa có số điện thoại liên hệ:
            if not customer_phone:
                has_new_slot = any(extracted.get(k) is not None for k in ["date", "time", "guests", "customer_name", "customer_phone", "customer_email"])
                is_side_query, q_type = check_side_query_intent(message)

                if not has_new_slot and is_side_query:
                    if q_type == "FACILITY_INFO":
                        ans = self._answer_facility_question(message, settings)
                        reminder = (
                            f"Với nhóm từ {slots['guests']} người, Aria cần chuyển thông tin tới Quản lý sắp xếp bàn lớn. "
                            f"Cho Aria xin họ tên và số điện thoại để nhân viên liên hệ tư vấn nhé!"
                        )
                        full_resp = f"{ans}\n\n*({reminder})*"
                        for t in self._chunk_tokens(full_resp):
                            yield self._sse("token", {"content": t})
                        yield self._sse("done", {"suggestedItems": [], "groundedItems": []})
                        return

                state["fsm_state"] = "COLLECTING_SLOTS"
                await save_state(session_id, state)

                if customer_name:
                    resp = (
                        f"Dạ, với nhóm từ **{slots['guests']} người**, Aria xin phép chuyển yêu cầu tới Quản lý (Admin) "
                        f"và Nhân viên phục vụ (Waiter) để tư vấn sắp xếp bàn lớn / phòng riêng chu đáo nhất. "
                        f"Cho Aria xin số điện thoại của anh/chị **{customer_name}** để nhân viên liên hệ lại tư vấn ngay nhé!"
                    )
                else:
                    resp = (
                        f"Dạ, với nhóm từ **{slots['guests']} người**, Aria xin phép chuyển yêu cầu tới Quản lý (Admin) "
                        f"và Nhân viên phục vụ (Waiter) để tư vấn sắp xếp bàn lớn / phòng riêng chu đáo nhất. "
                        f"Cho Aria xin họ tên và số điện thoại để nhân viên liên hệ lại tư vấn ngay nhé!"
                    )

                for t in self._chunk_tokens(resp):
                    yield self._sse("token", {"content": t})
                yield self._sse("done", {
                    "suggestedItems": [],
                    "groundedItems": [],
                    "metrics": {"total_time_ms": round((time.perf_counter() - t_start) * 1000, 2)}
                })
                return

            # Đã có số điện thoại -> Chốt Handoff tới Admin & Waiter
            state["fsm_state"] = "HANDOFF"
            await save_state(session_id, state)

            name_phrase = f" của anh/chị **{customer_name}**" if customer_name else ""
            phone_phrase = f" qua số điện thoại **{customer_phone}**"

            resp = (
                f"Dạ, với nhóm từ **{slots['guests']} người**, Aria đã ghi nhận thông tin{name_phrase} "
                f"và xin phép chuyển ngay yêu cầu tới Quản lý (Admin) và Nhân viên phục vụ (Waiter) "
                f"để tư vấn sắp xếp bàn lớn / phòng riêng và chuẩn bị chu đáo nhất. "
                f"Nhân viên sẽ liên hệ với bạn trong ít phút{phone_phrase} hoặc "
                f"bạn có thể gọi hotline **{hotline}** nhé!"
            )
            for t in self._chunk_tokens(resp):
                yield self._sse("token", {"content": t})

            summary_parts = []
            if customer_name:
                summary_parts.append(f"Khách: {customer_name}")
            if customer_phone:
                summary_parts.append(f"SĐT: {customer_phone}")
            summary_parts.append(f"Đoàn: {slots['guests']} người")
            if slots.get("date") or slots.get("time"):
                dt_str = f"{slots.get('time') or ''} {slots.get('date') or ''}".strip()
                summary_parts.append(f"Thời gian: {dt_str}")
            if slots.get("special_requests"):
                summary_parts.append(f"Yêu cầu: {slots['special_requests']}")

            summary_text = " | ".join(summary_parts)

            # Đồng bộ sự kiện Escalation về backend để lưu DB và phát realtime alert tới Admin/Waiter
            escalate_res = {}
            try:
                escalate_res = await escalate_reservation(
                    customer_name=customer_name or "Khách đặt đoàn",
                    customer_phone=customer_phone,
                    guest_count=slots["guests"],
                    reservation_date=slots.get("date"),
                    reservation_time=slots.get("time"),
                    customer_email=customer_email,
                    special_requests=slots.get("special_requests"),
                    summary=summary_text,
                    session_id=session_id,
                    user_id=user_id or user_info.get("user_id"),
                )
            except Exception as e:
                print(f"[aria_pipeline] Không thể gọi escalate_reservation: {e}")

            booking_code = escalate_res.get("booking_code")
            if booking_code:
                state["booking_code"] = booking_code
                await save_state(session_id, state)

            yield self._sse("done", {
                "suggestedItems": [],
                "groundedItems": [],
                "isHandoff": True,
                "handoffPayload": {
                    "sessionId": session_id,
                    "booking_code": booking_code,
                    "reservation_id": escalate_res.get("id"),
                    "customer": {
                        "name": customer_name,
                        "phone": customer_phone,
                        "email": customer_email,
                        "isLoggedIn": is_logged_in,
                    },
                    "reason": "GROUP_SIZE_EXCEEDED",
                    "summary": summary_text,
                    "details": {
                        "guests": slots["guests"],
                        "date": slots.get("date"),
                        "time": slots.get("time"),
                        "customer_name": customer_name,
                        "customer_phone": customer_phone,
                        "customer_email": customer_email,
                        "special_requests": slots.get("special_requests"),
                    },
                    "timestamp": datetime.now().isoformat()
                }
            })
            return

        # 5. Kiểm tra câu hỏi chen ngang (Context Distraction - Proposal T20)
        has_new_slot = any(extracted.get(k) is not None for k in ["date", "time", "guests", "customer_name", "customer_phone", "customer_email"])
        is_side_query, q_type = check_side_query_intent(message)

        if not has_new_slot and is_side_query:
            if q_type == "FACILITY_INFO":
                ans = self._answer_facility_question(message, settings)
                missing = self._get_missing_slots(state)
                reminder = self._build_slot_question(missing, state, reask_count=1)
                full_resp = f"{ans}\n\n*(Quay lại thông tin đặt bàn: {reminder})*"
                for t in self._chunk_tokens(full_resp):
                    yield self._sse("token", {"content": t})
                yield self._sse("done", {"suggestedItems": [], "groundedItems": []})
                return
            elif q_type == "MENU_CONSULTATION":
                missing = self._get_missing_slots(state)
                slot_q = self._build_slot_question(missing, state, reask_count=1)
                postfix = f"\n\n*(Quay lại thông tin đặt bàn: {slot_q} Hoặc bạn có thể nói 'khoan đặt' nếu muốn tìm hiểu thực đơn trước nhé!)*"
                async for item in self._handle_consultation_flow(
                    message=message,
                    menu_context=menu_context,
                    cart_items=cart_items,
                    order_history=order_history,
                    conversation_history=conversation_history,
                    table_id=table_id,
                    fallback_used=fallback_used,
                    restaurant_id=restaurant_id,
                    enable_rerank=enable_rerank,
                    top_k=top_k,
                    rerank_weight=rerank_weight,
                    feedback_type=feedback_type,
                    rejected_items=rejected_items,
                    t_start=t_start,
                    postfix_message=postfix,
                ):
                    yield item
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
            amb_h = slots.get("pending_ambiguous_hour") or 7
            slots["pending_ambiguous_hour"] = amb_h
            await save_state(session_id, state)
            resp = f"Bạn muốn đặt bàn lúc **{amb_h}h sáng** hay **{amb_h}h tối ({amb_h + 12}:00)** ạ?"
            for t in self._chunk_tokens(resp):
                yield self._sse("token", {"content": t})
            yield self._sse("done", {"suggestedItems": [], "groundedItems": []})
            return

        # 8. Kiểm tra các slot còn thiếu
        missing = self._get_missing_slots(state)

        # Nếu còn thiếu slot -> Hỏi tiếp (tối đa 1-2 slot mỗi lượt)
        if missing:
            state["fsm_state"] = "COLLECTING_SLOTS"

            # Cập nhật số lần hỏi lại cùng nhóm slot
            last_missing = state.get("last_asked_slots")
            if last_missing == missing:
                reask_count = state.get("slot_reask_count", 0) + 1
            else:
                reask_count = 0
            state["last_asked_slots"] = missing
            state["slot_reask_count"] = reask_count
            await save_state(session_id, state)

            slot_q = self._build_slot_question(missing, state, reask_count=reask_count)
            context_prefix = ""

            # Ngữ cảnh 1: Khách vừa đặt thêm bàn (queued_booking)
            if is_add_booking and state.get("queued_booking"):
                qb = state["queued_booking"]
                context_prefix = (
                    f"Dạ, Aria đã ghi nhận bạn muốn đặt thêm bàn vào ngày **{qb.get('date')}** lúc **{qb.get('time')}**.\n"
                    f"Aria xin phép hoàn tất đơn đặt bàn cho ngày **{slots.get('date')}** lúc **{slots.get('time')}** trước nhé!\n\n"
                )
            # Ngữ cảnh 2: Khách vừa bổ sung yêu cầu đặc biệt (special_requests)
            elif extracted.get("special_requests"):
                spec = extracted["special_requests"]
                context_prefix = f"Dạ, Aria đã ghi nhận yêu cầu '**{spec}**' của bạn rồi ạ!\n\n"
            # Ngữ cảnh 3: Khách hỏi tại sao cần số điện thoại
            elif is_phone_inquiry(message):
                context_prefix = (
                    "Dạ, số điện thoại cần thiết để nhà hàng gửi mã vé xác nhận đặt bàn (kèm mã QR) "
                    "và để nhân viên liên hệ hỗ trợ bạn giữ bàn chu đáo khi tới quán ạ.\n\n"
                )
            # Ngữ cảnh 4: Khách phản hồi đồng ý / xác nhận / giục đơn trong khi chưa có thông tin liên hệ
            elif is_confirmation(message) and ("customer_phone" in missing or "customer_name" in missing):
                dt_str = f" lúc **{slots.get('time')}** ngày **{slots.get('date')}**" if slots.get('time') and slots.get('date') else ""
                g_str = f" cho nhóm **{slots.get('guests')} người**" if slots.get('guests') else ""
                context_prefix = (
                    f"Dạ vâng, để hoàn tất giữ bàn{g_str}{dt_str}, "
                    f"Aria chỉ cần thêm thông tin liên hệ để gửi vé xác nhận có mã QR nữa thôi ạ.\n\n"
                )

            if context_prefix:
                if slot_q.startswith("Dạ, "):
                    slot_q = slot_q[4:]
                    slot_q = slot_q[0].upper() + slot_q[1:] if len(slot_q) > 0 else slot_q

            resp = f"{context_prefix}{slot_q}".strip()

            # Nếu nhóm >= 6 người, kèm lời nhắc cọc (Proposal T06 & T25)
            if slots.get("guests") and slots["guests"] >= 6 and reask_count == 0:
                resp += f"\n\n*(Lưu ý: Với nhóm {slots['guests']} người, theo chính sách nhà hàng cần đặt cọc 50.000đ/người để bảo đảm giữ bàn chu đáo ạ)*"

            for t in self._chunk_tokens(resp):
                yield self._sse("token", {"content": t})
            yield self._sse("done", {"suggestedItems": [], "groundedItems": []})
            return

        # 9. Khi đã đủ toàn bộ slot -> Gọi check_availability
        state["fsm_state"] = "CHECKING_AVAILABILITY"
        state["last_asked_slots"] = None
        state["slot_reask_count"] = 0
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
                email = slots.get("customer_email") or user_info.get("email") or ""

                dep_text = ""
                if slots["guests"] >= 6:
                    amt = slots["guests"] * 50000
                    dep_text = f"\n• Cọc bàn: **{amt:,.0f} VNĐ** (50.000đ/người)"

                special_text = f"\n• Ghi chú: **{slots['special_requests']}**" if slots.get("special_requests") else ""
                email_text = f" · Email: **{email}**" if email else ""

                queued_note = ""
                if state.get("queued_booking"):
                    qb = state["queued_booking"]
                    queued_note = (
                        f"\n\n*(📌 Aria đã ghi nhận yêu cầu đặt thêm bàn vào ngày **{qb.get('date')}** lúc **{qb.get('time')}**. "
                        f"Ngay sau khi bạn xác nhận đơn này, Aria sẽ tiến hành tạo tiếp đơn thứ 2 nhé!)*"
                    )

                resp = (
                    f"Dạ còn bàn trống ạ! Aria tóm tắt lại thông tin đặt bàn:\n\n"
                    f"📅 Ngày: **{slots['date']}** lúc **{slots['time']}**\n"
                    f"👥 Số khách: **{slots['guests']} người**\n"
                    f"👤 Khách hàng: **{name}** · SĐT: **{_mask_phone(phone)}**{email_text}"
                    f"{special_text}"
                    f"{dep_text}\n\n"
                    f"Bạn xác nhận đặt bàn không ạ? (Trả lời **'ok'** hoặc **'xác nhận'**)"
                    f"{queued_note}"
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
        guests = slots.get("guests")
        if not guests or not isinstance(guests, int) or guests <= 0:
            missing.append("guests")

        # Nếu chưa đăng nhập thì bắt buộc cần Tên và SĐT
        if not user_info.get("is_logged_in"):
            if not slots.get("customer_name"):
                missing.append("customer_name")
            if not slots.get("customer_phone"):
                missing.append("customer_phone")

        return missing

    def _build_slot_question(self, missing: List[str], state: Dict[str, Any], reask_count: int = 0) -> str:
        """Tạo câu hỏi tự nhiên cho các slot thiếu, linh hoạt biến đổi văn phong khi hỏi lại."""
        slots = state.get("slots", {})
        user_name = state.get("user_info", {}).get("name") or slots.get("customer_name")
        greeting = f"Chào {user_name}! " if user_name and not slots.get("date") else "Dạ, "

        first = missing[0]
        second = missing[1] if len(missing) > 1 else None

        # 1. Kết hợp họ tên & số điện thoại (chỉ hỏi cùng nhau khi thiếu cả 2)
        if first == "customer_name" and second == "customer_phone":
            if reask_count == 0:
                return f"{greeting}cho Aria xin họ tên, số điện thoại (và email nếu bạn muốn nhận vé xác nhận kèm mã QR) nhé?"
            elif reask_count == 1:
                return "Để Aria tiến hành giữ bàn và gửi vé xác nhận (kèm mã QR) cho bạn chu đáo, bạn vui lòng cho Aria xin họ tên và số điện thoại liên hệ nhé!"
            else:
                return "Aria chỉ cần thêm họ tên và số điện thoại của bạn nữa là hoàn tất đặt bàn ngay rồi ạ. Bạn chia sẻ giúp Aria nhé!"

        # 2. Chỉ thiếu số điện thoại
        if first == "customer_phone":
            c_name = slots.get("customer_name")
            name_suffix = f" của anh/chị **{c_name}**" if c_name else ""
            if reask_count == 0:
                return f"{greeting}cho Aria xin số điện thoại di động{name_suffix} (và email nếu có) để gửi vé xác nhận nhé?"
            elif reask_count == 1:
                return f"Để bảo đảm giữ chỗ chu đáo nhất, bạn vui lòng cho Aria xin số điện thoại liên hệ{name_suffix} với ạ!"
            else:
                return f"Aria chỉ cần số điện thoại liên hệ{name_suffix} nữa thôi là hoàn tất đơn và gửi vé QR ngay ạ!"

        # 3. Chỉ thiếu họ tên
        if first == "customer_name":
            if reask_count == 0:
                return f"{greeting}cho Aria xin họ tên của bạn để đặt bàn nhé?"
            else:
                return "Bạn vui lòng cho Aria biết tên để nhân viên nhà hàng tiện xưng hô và chuẩn bị đón tiếp chu đáo nhé!"

        # 4. Kết hợp ngày & giờ
        if first == "date" and second == "time":
            if reask_count == 0:
                return f"{greeting}bạn muốn đặt bàn ngày nào và lúc mấy giờ ạ?"
            else:
                return "Bạn dự kiến ghé nhà hàng vào ngày nào và khung giờ nào để Aria kiểm tra bàn trống giúp bạn nhé?"

        # 5. Kết hợp ngày & số khách
        if first == "date" and second == "guests":
            if reask_count == 0:
                return f"{greeting}bạn muốn đặt bàn ngày nào và bao nhiêu người ạ?"
            else:
                return "Bạn dự định đến vào ngày nào và nhóm đi khoảng bao nhiêu người ạ?"

        # 6. Kết hợp giờ & số khách
        if first == "time" and second == "guests":
            if reask_count == 0:
                return f"{greeting}bạn muốn đến lúc mấy giờ và nhóm đi bao nhiêu người ạ?"
            else:
                return "Bạn muốn ghé quán lúc mấy giờ và nhóm có bao nhiêu người để Aria kiểm tra bàn nhé?"

        # 7. Thiếu ngày đơn lẻ
        if first == "date":
            if reask_count == 0:
                return f"{greeting}bạn muốn đặt bàn vào ngày nào ạ?"
            else:
                return "Bạn dự định ghé quán vào ngày nào để Aria kiểm tra bàn trống nhé?"

        # 8. Thiếu giờ đơn lẻ
        if first == "time":
            if reask_count == 0:
                return f"{greeting}bạn muốn đến lúc mấy giờ?"
            else:
                return "Bạn muốn đặt bàn vào khung giờ nào để Aria sắp xếp chu đáo ạ?"

        # 9. Thiếu số khách đơn lẻ
        if first == "guests":
            if reask_count == 0:
                return f"{greeting}nhóm bạn dự kiến đi bao nhiêu người ạ?"
            else:
                return "Bạn dự định đi nhóm khoảng bao nhiêu người để quán chuẩn bị xếp bàn vừa vặn nhất ạ?"

        return f"{greeting}cho Aria xin thông tin để tiếp tục đặt bàn nhé!"

    @staticmethod
    def _answer_facility_question(message: str, settings: Dict[str, Any]) -> str:
        """Trả lời các câu hỏi tiện ích, dịch vụ, địa chỉ, giờ mở cửa của nhà hàng."""
        msg = message.lower()
        restaurant_name = settings.get("restaurant_name", "Nhà hàng")
        open_time = settings.get("open_time", "08:00")
        close_time = settings.get("close_time", "22:00")
        wifi_password = settings.get("wifi_password", "12345678")
        address = settings.get("address", "123 Đường Ẩm Thực, Quận 1, TP.HCM")
        hotline = settings.get("hotline", "0901.234.567")

        if any(k in msg for k in ["đỗ xe", "gửi xe", "bãi xe", "bãi đỗ", "bãi giữ", "chỗ để xe", "ô tô", "xe máy"]):
            return f"Dạ, {restaurant_name} có bãi đỗ xe ô tô và xe máy rộng rãi, an toàn, có bảo vệ trông giữ miễn phí ạ."
        if any(k in msg for k in ["wifi", "wi-fi", "mật khẩu", "pass"]):
            return f"Dạ, quán có wifi tốc độ cao miễn phí (Tên wifi: {restaurant_name}, Mật khẩu: {wifi_password}) ạ."
        if any(k in msg for k in ["mở cửa", "đóng cửa", "mấy giờ", "giờ hoạt động", "giờ mở"]):
            return f"Dạ, {restaurant_name} mở cửa đón khách từ {open_time} đến {close_time} hàng ngày với nhiều món ăn đặc sắc ạ."
        if any(k in msg for k in ["địa chỉ", "ở đâu", "vị trí", "đường nào", "chỗ nào", "tìm đường", "quán ở"]):
            return f"Dạ, {restaurant_name} tọa lạc tại {address} ạ."
        if any(k in msg for k in ["ghế trẻ em", "ghế em bé", "ghế ăn dặm"]):
            return f"Dạ, nhà hàng có trang bị sẵn ghế ăn dặm cho trẻ em, sạch sẽ và an toàn chu đáo ạ."
        if any(k in msg for k in ["phòng riêng", "phòng vip"]):
            return f"Dạ, quán có các phòng VIP riêng tư ấm cúng dành cho gia đình hoặc tiếp khách đối tác ạ."
        if any(k in msg for k in ["hút thuốc"]):
            return f"Dạ, để bảo đảm không gian dùng bữa trong lành, khu vực phòng lạnh không hút thuốc; quán có bố trí khu vực ngoài trời thoáng mát cho quý khách có nhu cầu ạ."
        if any(k in msg for k in ["hotline", "số điện thoại", "sđt", "liên hệ"]):
            return f"Dạ, số hotline hỗ trợ khách hàng của nhà hàng là {hotline} ạ."
        if any(k in msg for k in ["vat", "hóa đơn"]):
            return f"Dạ, nhà hàng có xuất hóa đơn đỏ (VAT) điện tử đầy đủ theo yêu cầu của quý khách ạ."

        return f"Dạ, {restaurant_name} mở cửa từ {open_time} đến {close_time} hàng ngày tại {address} ạ."

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
