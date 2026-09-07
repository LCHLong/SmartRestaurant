"""
main.py
FastAPI app — Pipecat AI Service entry point

Endpoints:
  GET  /health         — Health check
  POST /chat           — Streaming chat (SSE)
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from pipelines.aria_pipeline import AriaConversationPipeline

app = FastAPI(
    title="SmartRestaurant AI Service",
    description="Pipecat-based AI Consultant 'Aria' microservice",
    version="1.0.0"
)

# Singleton pipeline instance
pipeline = AriaConversationPipeline()


# ---------- Request/Response Models ----------

class CartItem(BaseModel):
    id: str | int
    name: str
    price: float
    quantity: int = 1


class HistoryItem(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    sessionId: str
    tableId: str
    cartItems: list[CartItem] = []
    menuContext: list[dict] = []
    orderHistory: list[dict] = []
    conversationHistory: list[HistoryItem] = []
    fallbackUsed: bool = False
    restaurantId: Optional[str] = None


# ---------- Endpoints ----------

@app.get("/health")
async def health_check():
    """Health check — Node.js Gateway dùng endpoint này để kiểm tra Pipecat status"""
    gemini_key_set = bool(os.getenv("GEMINI_API_KEY"))
    return {
        "status": "ok",
        "service": "aria-pipecat",
        "gemini_configured": gemini_key_set,
        "model": os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Streaming Chat endpoint — trả về SSE (text/event-stream)

    Node.js Gateway forward request vào đây, nhận SSE stream,
    rồi emit từng token qua Socket.io đến browser.
    """

    async def event_generator():
        try:
            async for sse_chunk in pipeline.process(
                message=request.message,
                menu_context=request.menuContext,
                cart_items=[c.model_dump() for c in request.cartItems],
                order_history=request.orderHistory,
                conversation_history=[h.model_dump() for h in request.conversationHistory],
                table_id=request.tableId,
                session_id=request.sessionId,
                fallback_used=request.fallbackUsed,
                restaurant_id=request.restaurantId,
            ):
                yield sse_chunk
        except Exception as e:
            import json
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )
