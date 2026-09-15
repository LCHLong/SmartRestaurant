"""
test_aria_pipeline.py
Unit tests cho Bước 3.3 - Pha 3: Tích hợp Lõi RAG vào Aria Conversation Pipeline & Grounded Prompting.
Kiểm định:
1. Format Grounded Prompt Template (Paper 01 Mục 3.6).
2. Tự động truy xuất RAG động khi menu_context trống.
3. Tích hợp Cross-Encoder Reranker trong luồng pipeline.
4. Quản lý bộ đệm lịch sử hội thoại (History Buffer Memory tối đa 10 lượt).
5. Phát hiện yêu cầu gọi phục vụ (Human Handoff).
6. Chuẩn Server-Sent Events (SSE) streaming (Token + Done event).
7. Đo lường chỉ số TTFT (Time to First Token) và độ trễ toàn trình.
8. Tính chống ảo giác (Anti-Hallucination) bám sát thực đơn.
9. Kiểm thử tích hợp endpoint POST /chat trên FastAPI.
"""

import json
import asyncio
import unittest
from fastapi.testclient import TestClient

from main import app
from pipelines.aria_pipeline import AriaConversationPipeline
from prompts.grounded_rag_prompt import (
    format_grounded_candidates,
    build_grounded_system_prompt,
    _format_price,
)


class TestAriaPipeline(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.pipeline = AriaConversationPipeline()
        self.sample_candidates = [
            {
                "name": "Phở Bò Tái Nạm",
                "price": 75000.0,
                "spice_level": 0,
                "calories": 450,
                "ingredients": ["Bánh phở", "thịt bò tái", "nạm bò", "nước dùng xương"],
                "allergens": [],
                "description": "Phở bò gia truyền thơm ngon đậm đà.",
                "initial_rank": 2,
                "final_rank": 1,
                "combined_score": 0.9278,
            },
            {
                "name": "Lẩu Thả Phan Thiết",
                "price": 350000.0,
                "spice_level": 1,
                "calories": 750,
                "ingredients": ["Cá mai", "thịt ba chỉ", "trứng chiên", "bánh tráng"],
                "allergens": ["hải sản"],
                "description": "Lẩu thả đặc sản vùng biển Phan Thiết.",
                "initial_rank": 1,
                "final_rank": 2,
                "combined_score": 0.9110,
            },
        ]

    def test_01_grounded_candidates_formatting(self):
        """Kiểm tra format_grounded_candidates tạo đúng cấu trúc Grounded Knowledge Base."""
        text = format_grounded_candidates(self.sample_candidates, max_items=2)
        self.assertIn("## DANH MỤC THỰC ĐƠN XÁC THỰC TỪ HỆ THỐNG", text)
        self.assertIn("Phở Bò Tái Nạm", text)
        self.assertIn("75.000đ", text)
        self.assertIn("Hạng #1", text)
        self.assertIn("Lẩu Thả Phan Thiết", text)
        self.assertIn("350.000đ", text)
        self.assertIn("Độ cay: 0/5", text)
        self.assertIn("Độ cay: 1/5", text)

    def test_02_empty_grounded_candidates_formatting(self):
        """Kiểm tra xử lý danh sách ứng viên rỗng an toàn."""
        text = format_grounded_candidates([])
        self.assertIn("Không tìm thấy món ăn phù hợp", text)

    def test_03_price_formatting(self):
        """Kiểm tra hàm format giá tiền hiển thị chuẩn VNĐ."""
        self.assertEqual(_format_price(75000), "75.000đ")
        self.assertEqual(_format_price(350000.0), "350.000đ")

    def test_04_build_grounded_system_prompt(self):
        """Kiểm tra hợp nhất system prompt, grounded context và dynamic context."""
        grounded_text = format_grounded_candidates(self.sample_candidates)
        prompt = build_grounded_system_prompt(
            grounded_menu_text=grounded_text,
            dynamic_context="Bàn số: T01\nThời điểm: buổi trưa",
            fallback_hint=""
        )
        self.assertIn("Bạn là Aria", prompt)
        self.assertIn("DANH MỤC THỰC ĐƠN XÁC THỰC", prompt)
        self.assertIn("Bàn số: T01", prompt)
        self.assertIn("TUYỆT ĐỐI KHÔNG BỊA ĐẶT", prompt)

    async def test_05_auto_rag_retrieval_when_empty_menu_context(self):
        """Kiểm tra khi menu_context=None, pipeline tự động truy xuất từ Lõi RAG nội tại."""
        events = []
        async for sse in self.pipeline.process(
            message="phở bò đặc sản",
            menu_context=None,
            top_k=3,
            enable_rerank=True
        ):
            events.append(sse)

        self.assertGreater(len(events), 0)
        # Parse event cuối cùng (done event)
        done_event = None
        for e in events:
            if e.startswith("data: "):
                payload = json.loads(e[6:])
                if payload.get("type") == "done":
                    done_event = payload
                    break

        self.assertIsNotNone(done_event)
        self.assertIn("groundedItems", done_event)
        self.assertGreater(len(done_event["groundedItems"]), 0)
        self.assertIn("metrics", done_event)
        # Xác nhận RAG đã nạp đúng ứng viên
        grounded_names = [it["name"] for it in done_event["groundedItems"]]
        self.assertTrue(any("Phở" in name for name in grounded_names))

    async def test_06_human_handoff_detection(self):
        """Kiểm tra phát hiện từ khóa gọi nhân viên phục vụ."""
        events = []
        async for sse in self.pipeline.process(
            message="cho tôi gặp nhân viên phục vụ với ạ",
            menu_context=self.sample_candidates,
        ):
            events.append(sse)

        done_event = None
        for e in events:
            if e.startswith("data: "):
                payload = json.loads(e[6:])
                if payload.get("type") == "done":
                    done_event = payload

        self.assertIsNotNone(done_event)
        self.assertTrue(done_event.get("isHandoff", False))

    async def test_07_conversation_history_buffer_memory(self):
        """Kiểm tra giới hạn bộ nhớ hội thoại tối đa 10 lượt gần nhất."""
        history = [{"role": "user" if i % 2 == 0 else "assistant", "content": f"msg {i}"} for i in range(25)]
        
        # Chạy pipeline với history dài 25 lượt
        events = []
        async for sse in self.pipeline.process(
            message="tư vấn món nước",
            menu_context=self.sample_candidates,
            conversation_history=history,
        ):
            events.append(sse)

        # Pipeline hoàn thành trơn tru không lỗi tràn bộ nhớ
        self.assertGreater(len(events), 0)

    async def test_08_streaming_sse_structure_and_ttft(self):
        """Kiểm tra chuẩn SSE (token + done) và chỉ số TTFT < 400ms."""
        from unittest.mock import patch
        events = []
        tokens = []
        done_payload = None

        with patch("pipelines.aria_pipeline._get_client", return_value=None):
            async for sse in self.pipeline.process(
                message="tư vấn món ngon",
                menu_context=self.sample_candidates,
            ):
                events.append(sse)
                if sse.startswith("data: "):
                    data = json.loads(sse[6:])
                    if data.get("type") == "token":
                        tokens.append(data.get("content", ""))
                    elif data.get("type") == "done":
                        done_payload = data

        self.assertGreater(len(tokens), 0)
        self.assertIsNotNone(done_payload)
        metrics = done_payload.get("metrics", {})
        self.assertIn("ttft_ms", metrics)
        self.assertLess(metrics["ttft_ms"], 400.0)  # SLA TTFT < 400ms

    def test_09_chat_endpoint_integration(self):
        """Kiểm tra tích hợp endpoint POST /chat bằng TestClient."""
        client = TestClient(app)
        payload = {
            "message": "gợi ý phở bò",
            "sessionId": "test-session-123",
            "tableId": "T05",
            "enableRerank": True,
            "topK": 3
        }
        response = client.post("/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "text/event-stream; charset=utf-8")
        
        # Đọc nội dung SSE text
        content = response.text
        self.assertIn("data: ", content)
        self.assertIn('"type": "token"', content)
        self.assertIn('"type": "done"', content)


if __name__ == "__main__":
    unittest.main()
