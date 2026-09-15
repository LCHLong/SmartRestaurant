"""
aria_pipeline.py
Thuộc Bước 3.3 - Pha 3: Tích hợp hoàn chỉnh Lõi RAG vào Aria Conversation Pipeline
Theo Paper 01: Advancing RAG for Structured Enterprise Data (IIT Roorkee 2025 - Mục 3.6)

Chuỗi xử lý hoàn chỉnh (End-to-End Flow):
  User Message
      ↓
  Human Handoff Pre-check
      ↓
  F&B NER & Metadata Pre-Filtering (Bước 3.1)
      ↓
  Hybrid Dense + Sparse Search (Bước 2.2)
      ↓
  Cross-Encoder Contextual Reranking (Bước 3.2)
      ↓
  Grounded Prompt Template Generation (Mục 3.6)
      ↓
  Session History Memory Buffer (10 lượt gần nhất)
      ↓
  Groq LLM SSE Stream (TTFT < 400ms) / Offline Grounded Fallback
      ↓
  Entity Extraction & Done Event
"""

import os
import json
import time
import asyncio
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


class AriaConversationPipeline:
    """
    Pipeline hội thoại AI Consultant Aria hoàn chỉnh tích hợp Lõi Advanced Hybrid RAG.
    
    Quy trình:
      1. Nhận yêu cầu và kiểm tra chuyển giao nhân viên (Human Handoff).
      2. Tái cấu trúc truy vấn thích ứng (Bước 4.1 - Query Reformulator).
      3. Truy xuất RAG động: F&B NER Filter -> Hybrid Retrieval -> Cross-Encoder Reranking.
      4. Định dạng Grounded Knowledge Base Context theo Paper 01 (Mục 3.6).
      5. Quản lý bộ đệm lịch sử hội thoại (Conversation Memory Buffer 10 turns).
      6. Stream câu trả lời qua Server-Sent Events (SSE) với chỉ số TTFT < 400ms.
    """

    def __init__(self, model: Optional[str] = None, max_history_turns: int = 10):
        self.model = model or os.getenv("GROQ_MODEL", GROQ_MODEL)
        self.max_history_turns = max_history_turns
        # Khởi tạo Lõi RAG nội tại & Bộ viết lại truy vấn thích ứng
        self.retriever = HybridMenuRetriever(index_type="menu")
        self.reformulator = QueryReformulator()

    async def process(
        self,
        message: str,
        menu_context: Optional[List[Dict[str, Any]]] = None,
        cart_items: Optional[List[Dict[str, Any]]] = None,
        order_history: Optional[List[Dict[str, Any]]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        table_id: str = "T01",
        session_id: Optional[str] = None,
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
            # ── 1. Kiểm tra yêu cầu chuyển giao nhân viên (Human Handoff) ───────
            if is_human_handoff_requested(message):
                fb = get_fallback_context(menu_context or [], tier=3)
                yield self._sse("token", {"content": fb["message_hint"]})
                yield self._sse("done", {
                    "suggestedItems": [],
                    "groundedItems": [],
                    "isHandoff": True,
                    "metrics": {
                        "ttft_ms": round((time.perf_counter() - t_start) * 1000, 2),
                        "total_time_ms": round((time.perf_counter() - t_start) * 1000, 2),
                        "rag_count": 0,
                    }
                })
                return

            # ── 2. Tái cấu trúc truy vấn thích ứng (Bước 4.1 - Query Reformulator) ──
            reformulation_res = self.reformulator.reformulate(
                query=message,
                conversation_history=conversation_history,
                feedback_type=feedback_type,
                rejected_items=rejected_items,
            )
            search_query = reformulation_res.standalone_query

            # ── 3. Truy xuất RAG động (Dynamic RAG Retrieval + Reranking) ──────
            grounded_candidates: List[Dict[str, Any]] = []
            rerank_stats: Dict[str, Any] = {}

            if not menu_context:
                # Tự động truy xuất từ Lõi RAG toàn trình với search_query đã được viết lại
                grounded_candidates = self.retriever.retrieve(
                    query=search_query,
                    top_k=top_k,
                    enable_rerank=enable_rerank,
                    rerank_weight=rerank_weight,
                )
                rerank_stats = self.retriever.last_rerank_stats or {}
            else:
                # Nếu client truyền sẵn menu_context, thực hiện tái xếp hạng nếu bật enable_rerank
                if enable_rerank and hasattr(self.retriever, "reranker"):
                    grounded_candidates = self.retriever.reranker.rerank(
                        query=search_query,
                        candidates=menu_context,
                        top_k=top_k,
                        rerank_weight=rerank_weight,
                    )
                    rerank_stats = {
                        "engine": self.retriever.reranker.engine_type,
                        "candidate_count": len(grounded_candidates),
                    }
                else:
                    grounded_candidates = menu_context[:top_k]

            # Loại bỏ các món bị khách từ chối nếu có negative feedback
            if reformulation_res.excluded_items:
                grounded_candidates = [
                    c for c in grounded_candidates
                    if c.get("name") not in reformulation_res.excluded_items
                ]

            # ── 3. Định dạng Grounded Knowledge Base Prompt Template ──────────
            grounded_menu_text = format_grounded_candidates(grounded_candidates, max_items=top_k)

            dynamic_ctx = build_dynamic_context(
                menu_context=[],  # Đã đưa vào grounded_menu_text chuyên biệt
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

            # ── 4. Quản lý bộ đệm ngữ cảnh hội thoại (History Buffer Memory) ───
            messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]

            # Cắt lấy tối đa N lượt gần nhất để tránh tràn context window & duy trì TTFT < 400ms
            recent_history = conversation_history[-self.max_history_turns:]
            for turn in recent_history:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                groq_role = "assistant" if role in ("assistant", "ai") else "user"
                messages.append({"role": groq_role, "content": content})

            # User message hiện tại
            messages.append({"role": "user", "content": message})

            # ── 5. Khởi tạo Stream (Groq API hoặc Offline Grounded Fallback) ───
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
                except Exception as groq_err:
                    # Nếu Groq gặp lỗi kết nối/quota -> chuyển sang offline grounded generator
                    async for token in self._stream_offline_grounded(message, grounded_candidates):
                        if ttft_ms is None:
                            ttft_ms = (time.perf_counter() - t_start) * 1000
                        full_text += token
                        yield self._sse("token", {"content": token})
            else:
                # Chế độ Offline / Không có API key: sinh câu trả lời Grounded tất định
                async for token in self._stream_offline_grounded(message, grounded_candidates):
                    if ttft_ms is None:
                        ttft_ms = (time.perf_counter() - t_start) * 1000
                    full_text += token
                    yield self._sse("token", {"content": token})

            if ttft_ms is None:
                ttft_ms = (time.perf_counter() - t_start) * 1000

            # ── 6. Bóc tách thực thể món ăn & Gửi Event Done ───────────────────
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

    async def _stream_offline_grounded(
        self,
        query: str,
        candidates: List[Dict[str, Any]]
    ) -> AsyncGenerator[str, None]:
        """
        Sinh phản hồi Grounded token-by-token ngoại tuyến dựa trên thực đơn xác thực.
        Đảm bảo hệ thống vận hành 100% không bao giờ gián đoạn, TTFT < 50ms.
        """
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
            await asyncio.sleep(0.005)  # Giả lập độ trễ streaming mượt mà
            yield t

    @staticmethod
    def _sse(event_type: str, data: dict) -> str:
        """Đóng gói Server-Sent Event (SSE) theo chuẩn W3C."""
        payload = {"type": event_type, **data}
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
