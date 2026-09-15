"""
test_query_reformulator.py
Unit Tests & Integration Tests cho Bước 4.1 - Pha 4: Module Query Reformulator
Theo Paper 01: Advancing RAG for Structured Enterprise Data (IIT Roorkee 2025 - Mục 3.4 & 4.1)
"""

import unittest
import time
from fastapi.testclient import TestClient

from main import app
from processors.query_reformulator import QueryReformulator, ReformulatedQueryResult
from pipelines.aria_pipeline import AriaConversationPipeline


class TestQueryReformulator(unittest.TestCase):
    """Bộ kiểm thử đơn vị và tích hợp cho module Query Reformulator."""

    @classmethod
    def setUpClass(cls):
        cls.reformulator = QueryReformulator()
        cls.client = TestClient(app)

    def test_01_direct_unambiguous_query(self):
        """Câu hỏi đã cụ thể, rõ ràng không bị biến dạng và giữ nguyên direct."""
        query = "Cho tôi một tô phở bò tái nạm ít hành"
        res = self.reformulator.reformulate(query)

        self.assertFalse(res.is_reformulated)
        self.assertEqual(res.reformulation_type, "direct")
        self.assertEqual(res.standalone_query, query)
        self.assertEqual(len(res.excluded_items), 0)

    def test_02_ambiguous_short_query_expansion(self):
        """Câu hỏi quá ngắn hoặc mơ hồ được tự động làm rõ ngữ nghĩa ẩm thực."""
        queries = ["uống gì ngon", "ăn gì", "món chay", "tráng miệng"]
        for q in queries:
            res = self.reformulator.reformulate(q)
            self.assertTrue(res.is_reformulated)
            self.assertEqual(res.reformulation_type, "ambiguity_resolution")
            self.assertGreater(len(res.standalone_query.split()), len(q.split()))

    def test_03_contextual_anaphora_mon_nay(self):
        """Khử đại từ 'món này' khi người dùng hỏi tiếp về món vừa được Aria gợi ý."""
        history = [
            {"role": "user", "content": "Quán có món gì cay đậm đà không?"},
            {
                "role": "assistant",
                "content": "Dạ quán có **Bún Bò Huế** · 70.000đ · Cay nồng đặc trưng hương vị cố đô."
            }
        ]
        query = "Món này có cay nhiều không em?"
        res = self.reformulator.reformulate(query, conversation_history=history)

        self.assertTrue(res.is_reformulated)
        self.assertEqual(res.reformulation_type, "context_enrichment")
        self.assertEqual(res.detected_referenced_dish, "Bún Bò Huế")
        self.assertIn("Bún Bò Huế", res.standalone_query)
        self.assertNotIn("món này", res.standalone_query.lower())

    def test_04_contextual_anaphora_mon_do_and_no(self):
        """Khử đại từ 'món đó' hoặc 'nó' dựa trên lịch sử đàm thoại."""
        history = [
            {"role": "user", "content": "Có nước gì giải nhiệt không?"},
            {
                "role": "assistant",
                "content": "Aria gợi ý **Trà Đào Cam Sả** · 45.000đ · Thơm mát sảng khoái."
            }
        ]
        query = "Món đó giá bao nhiêu?"
        res = self.reformulator.reformulate(query, conversation_history=history)

        self.assertTrue(res.is_reformulated)
        self.assertEqual(res.detected_referenced_dish, "Trà Đào Cam Sả")
        self.assertIn("Trà Đào Cam Sả", res.standalone_query)

    def test_05_negative_feedback_expansion(self):
        """Khi khách nói không thích hoặc muốn đổi món, tự động mở rộng và loại trừ món cũ."""
        history = [
            {"role": "user", "content": "Gợi ý món bò"},
            {
                "role": "assistant",
                "content": "Dạ có **Phở Bò Tái Nạm** và **Bún Bò Huế** rất ngon ạ."
            }
        ]
        query = "Tôi không thích ăn bò, đổi món khác đi"
        res = self.reformulator.reformulate(
            query,
            conversation_history=history,
            rejected_items=["Phở Bò Tái Nạm"]
        )

        self.assertTrue(res.is_reformulated)
        self.assertEqual(res.reformulation_type, "negative_feedback_expansion")
        self.assertIn("Phở Bò Tái Nạm", res.excluded_items)
        self.assertIn("Bún Bò Huế", res.excluded_items)

    def test_06_thumbs_down_feedback_flag(self):
        """Khi nhận cờ thumbs_down, tự động kích hoạt Negative Feedback Expansion."""
        res = self.reformulator.reformulate(
            query="Gợi ý món khác",
            feedback_type="thumbs_down",
            rejected_items=["Gà Nướng Cơm Lam"]
        )
        self.assertTrue(res.is_reformulated)
        self.assertEqual(res.reformulation_type, "negative_feedback_expansion")
        self.assertIn("Gà Nướng Cơm Lam", res.excluded_items)

    def test_07_empty_query_safety(self):
        """Kiểm tra an toàn dữ liệu với câu truy vấn rỗng hoặc None."""
        res = self.reformulator.reformulate("")
        self.assertTrue(res.is_reformulated)
        self.assertGreater(len(res.standalone_query), 0)

        res_none = self.reformulator.reformulate(None)
        self.assertTrue(res_none.is_reformulated)

    def test_08_reformulation_latency_sla(self):
        """Đảm bảo độ trễ tái cấu trúc câu hỏi đạt chuẩn siêu tốc (< 5ms)."""
        history = [
            {"role": "assistant", "content": "Quán có món **Bánh Flan** thơm ngon."}
        ]
        t0 = time.perf_counter()
        res = self.reformulator.reformulate("Món này bao nhiêu calo?", conversation_history=history)
        elapsed_ms = (time.perf_counter() - t0) * 1000

        self.assertLess(elapsed_ms, 5.0, f"Latency {elapsed_ms}ms vượt quá SLA 5ms")
        self.assertLess(res.latency_ms, 5.0)

    def test_09_api_reformulate_endpoint(self):
        """Kiểm tra endpoint HTTP POST /rag/reformulate."""
        payload = {
            "query": "Món này có cay không?",
            "history": [
                {"role": "assistant", "content": "Em xin gợi ý **Mì Quảng Tôm Thịt** đậm đà."}
            ]
        }
        response = self.client.post("/rag/reformulate", json=payload)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertTrue(data["is_reformulated"])
        self.assertEqual(data["detected_referenced_dish"], "Mì Quảng Tôm Thịt")
        self.assertIn("Mì Quảng Tôm Thịt", data["standalone_query"])

    def test_10_api_reformulate_negative_endpoint(self):
        """Kiểm tra endpoint HTTP POST /rag/reformulate với feedback tiêu cực."""
        payload = {
            "query": "Đổi món khác",
            "feedback_type": "thumbs_down",
            "rejected_items": ["Nước Ép Dưa Hấu"]
        }
        response = self.client.post("/rag/reformulate", json=payload)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["reformulation_type"], "negative_feedback_expansion")
        self.assertIn("Nước Ép Dưa Hấu", data["excluded_items"])


if __name__ == "__main__":
    unittest.main()
