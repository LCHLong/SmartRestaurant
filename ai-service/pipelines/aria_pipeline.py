"""
aria_pipeline.py
Pipecat AriaConversationPipeline — xử lý 1 request chat từ Aria

Pipeline flow:
    TextInput → SystemPromptBuilder (Layer 1+2) → GeminiLLMProcessor → EntityExtractor → StructuredOutputFrame

Chạy trong FastAPI endpoint, yield SSE events cho Node.js Gateway.
"""

import os
import json
import asyncio
from typing import AsyncGenerator, Optional

import google.generativeai as genai

from prompts.aria_system_prompt import ARIA_SYSTEM_PROMPT
from processors.system_prompt_builder import build_dynamic_context
from processors.entity_extractor import extract_suggested_items
from processors.fallback_handler import (
    build_fallback_prompt_hint,
    is_human_handoff_requested,
    get_fallback_context,
)

# Cấu hình Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class AriaConversationPipeline:
    """
    Pipeline xử lý 1 lượt hội thoại Aria.
    Input: ChatRequest object
    Output: AsyncGenerator[str] — SSE events (JSON lines)
    """

    def __init__(self):
        self.model_name = GEMINI_MODEL

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

        Yields:
            str: JSON SSE event strings như:
                 data: {"type": "token", "content": "..."}
                 data: {"type": "done", "suggestedItems": [...]}
                 data: {"type": "error", "message": "..."}
        """

        if not GEMINI_API_KEY:
            yield self._sse("error", {"message": "GEMINI_API_KEY chưa được cấu hình"})
            return

        try:
            # --- Stage: FallbackHandler check ---
            if is_human_handoff_requested(message):
                fallback_info = get_fallback_context(menu_context, tier=3)
                yield self._sse("token", {"content": fallback_info["message_hint"]})
                yield self._sse("done", {"suggestedItems": [], "isHandoff": True})
                return

            # --- Stage: SystemPromptBuilder (Layer 1 + Layer 2) ---
            dynamic_context = build_dynamic_context(
                menu_context=menu_context,
                cart_items=cart_items,
                order_history=order_history,
                table_id=table_id,
                fallback_used=fallback_used,
                restaurant_id=restaurant_id,
            )

            fallback_hint = ""
            if fallback_used:
                fb_info = get_fallback_context(menu_context, tier=2)
                fallback_hint = build_fallback_prompt_hint(fb_info, fallback_used)

            # Layer 1 (System) + Layer 2 (Dynamic) combine
            full_system_prompt = (
                ARIA_SYSTEM_PROMPT
                + "\n\n---\n"
                + dynamic_context
                + fallback_hint
            )

            # --- Stage: Build conversation history (Layer 3 = user message) ---
            chat_history = []
            for turn in conversation_history:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                # Gemini API expects role "user" or "model"
                gemini_role = "model" if role == "assistant" else "user"
                chat_history.append({
                    "role": gemini_role,
                    "parts": [{"text": content}]
                })

            # --- Stage: GeminiLLMProcessor (Streaming) ---
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=full_system_prompt,
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 400,
                    "top_p": 0.9,
                }
            )

            chat = model.start_chat(history=chat_history)

            # Stream response token by token
            full_text = ""
            response_stream = await asyncio.to_thread(
                lambda: chat.send_message(message, stream=True)
            )

            for chunk in response_stream:
                token = chunk.text if hasattr(chunk, "text") else ""
                if token:
                    full_text += token
                    yield self._sse("token", {"content": token})
                    await asyncio.sleep(0)  # yield control

            # --- Stage: EntityExtractor ---
            suggested_items = extract_suggested_items(full_text, menu_context)

            yield self._sse("done", {"suggestedItems": suggested_items})

        except Exception as e:
            yield self._sse("error", {"message": f"Pipeline error: {str(e)}"})

    @staticmethod
    def _sse(event_type: str, data: dict) -> str:
        """Format SSE event string"""
        payload = {"type": event_type, **data}
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
