"""
main.py
FastAPI app — Pipecat AI Service entry point

Endpoints:
  GET  /health         — Health check
  POST /chat           — Streaming chat (SSE)
"""

import os
import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from pipelines.aria_pipeline import AriaConversationPipeline
from routers.rag import router as rag_router

app = FastAPI(
    title="SmartRestaurant AI Service",
    description="Pipecat-based AI Consultant 'Aria' & Advanced Hybrid RAG microservice",
    version="1.1.0"
)

# CORS Middleware for Node.js Gateway and web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Tính toán thời gian xử lý mỗi HTTP request và đính kèm vào response header X-Process-Time."""
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.6f}s"
    return response


# Đăng ký RAG Router (POST /rag/retrieve, GET /rag/health)
app.include_router(rag_router)

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
    groq_key_set = bool(os.getenv("GROQ_API_KEY"))
    return {
        "status": "ok",
        "service": "aria-pipecat",
        "llm_provider": "groq",
        "groq_configured": groq_key_set,
        "model": os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
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
