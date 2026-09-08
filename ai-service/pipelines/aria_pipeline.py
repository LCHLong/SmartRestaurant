"""
aria_pipeline.py
Pipecat AriaConversationPipeline — dùng Groq API (thay Gemini)

Groq cung cấp inference cực nhanh (TTFT < 0.5s) với các model:
  - llama-3.3-70b-versatile   ← Khuyến nghị: chất lượng cao, hỗ trợ tiếng Việt tốt
  - llama-3.1-8b-instant      ← Nhanh nhất, nhẹ nhất
  - mixtral-8x7b-32768        ← Context dài (32k tokens)
  - gemma2-9b-it              ← Google Gemma trên Groq

Groq SDK tương thích OpenAI — dùng chat.completions.create với stream=True
"""

import os
import json
import asyncio
from typing import AsyncGenerator, Optional

from groq import AsyncGroq

from prompts.aria_system_prompt import ARIA_SYSTEM_PROMPT
from processors.system_prompt_builder import build_dynamic_context
from processors.entity_extractor import extract_suggested_items
from processors.fallback_handler import (
    build_fallback_prompt_hint,
    is_human_handoff_requested,
    get_fallback_context,
)

# ─── Cấu hình Groq ──────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL   = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")

# Tạo AsyncGroq client
_groq_client: Optional[AsyncGroq] = None

def _get_client() -> AsyncGroq:
    global _groq_client
    if _groq_client is None:
        if not GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY chưa được cấu hình trong .env")
        _groq_client = AsyncGroq(api_key=GROQ_API_KEY)
    return _groq_client
# ────────────────────────────────────────────────────────────────────────────


class AriaConversationPipeline:
    """
    Pipeline xử lý 1 lượt hội thoại Aria với Groq LLM (AsyncGroq).

    Input : ChatRequest object (từ FastAPI)
    Output: AsyncGenerator[str] — SSE events (JSON lines)
    """

    def __init__(self):
        self.model = GROQ_MODEL

    async def process(
        self,
        message: str,
        menu_context: list[dict],
        cart_items: list[dict],
        order_history: list[dict],
        conversation_history: list[dict],
        table_id: str,
        session_id: str,
        fallback_used: bool = False,
        restaurant_id: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Xử lý 1 request và yield SSE events.
        """
        if not GROQ_API_KEY:
            yield self._sse("error", {"message": "GROQ_API_KEY chưa được cấu hình"})
            return

        try:
            # ── Fallback: Human Handoff check ────────────────────────────────
            if is_human_handoff_requested(message):
                fb = get_fallback_context(menu_context, tier=3)
                yield self._sse("token",  {"content": fb["message_hint"]})
                yield self._sse("done",   {"suggestedItems": [], "isHandoff": True})
                return

            # ── Layer 1 + 2: Build system prompt ─────────────────────────────
            dynamic_ctx = build_dynamic_context(
                menu_context=menu_context,
                cart_items=cart_items,
                order_history=order_history,
                table_id=table_id,
                fallback_used=fallback_used,
                restaurant_id=restaurant_id,
            )

            fallback_hint = ""
            if fallback_used:
                fb_info       = get_fallback_context(menu_context, tier=2)
                fallback_hint = build_fallback_prompt_hint(fb_info, fallback_used)

            system_prompt = (
                ARIA_SYSTEM_PROMPT
                + "\n\n---\n"
                + dynamic_ctx
                + fallback_hint
            )

            # ── Build messages cho Groq (OpenAI format) ───────────────────────
            messages: list[dict] = [{"role": "system", "content": system_prompt}]

            # Thêm conversation history (session memory)
            for turn in conversation_history:
                role      = turn.get("role", "user")
                content   = turn.get("content", "")
                groq_role = "assistant" if role == "assistant" else "user"
                messages.append({"role": groq_role, "content": content})

            # Layer 3: user message hiện tại
            messages.append({"role": "user", "content": message})

            # ── Gọi AsyncGroq streaming (hoàn toàn non-blocking, cực nhanh) ────
            client = _get_client()
            stream = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True,
                temperature=0.6,
                max_tokens=350,
                top_p=0.9,
            )

            full_text = ""
            async for chunk in stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                token = (delta.content or "") if delta else ""
                if token:
                    full_text += token
                    yield self._sse("token", {"content": token})

            # ── EntityExtractor ───────────────────────────────────────────────
            suggested_items = extract_suggested_items(full_text, menu_context)
            yield self._sse("done", {"suggestedItems": suggested_items})

        except Exception as e:
            yield self._sse("error", {"message": f"Pipeline error: {str(e)}"})

    @staticmethod
    def _sse(event_type: str, data: dict) -> str:
        payload = {"type": event_type, **data}
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
