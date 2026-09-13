"""
Unit tests for FastAPI endpoints:
- GET /health
- GET /rag/health
- POST /rag/retrieve (validation, menu retrieval, policies retrieval, custom alpha, timing header)
"""

import unittest
import numpy as np
from fastapi.testclient import TestClient
from main import app


class TestApiEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_get_root_health(self):
        """Kiểm tra endpoint GET /health gốc của AI service."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["service"], "aria-pipecat")
        # Kiểm tra timing middleware header
        self.assertIn("x-process-time", response.headers)
        self.assertTrue(response.headers["x-process-time"].endswith("s"))

    def test_get_rag_health(self):
        """Kiểm tra endpoint GET /rag/health báo cáo trạng thái chỉ mục RAG."""
        response = self.client.get("/rag/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["service"], "advanced-hybrid-rag")
        self.assertIn("menu_index", data)
        self.assertIn("policies_index", data)
        self.assertGreater(data["menu_index"]["loaded_items_count"], 0)
        self.assertGreater(data["policies_index"]["loaded_items_count"], 0)
        self.assertEqual(data["menu_index"]["vector_dimension"], 768)

    def test_retrieve_menu_items_success(self):
        """Kiểm tra POST /rag/retrieve với truy vấn thực đơn hợp lệ."""
        payload = {
            "query": "phở bò tái nạm",
            "top_k": 5,
            "alpha": 0.6,
            "index_type": "menu"
        }
        response = self.client.post("/rag/retrieve", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["query"], "phở bò tái nạm")
        self.assertEqual(data["index_type"], "menu")
        self.assertLessEqual(len(data["results"]), 5)
        self.assertGreater(data["total_matches"], 0)
        self.assertIn("latency_ms", data)
        self.assertLess(data["latency_ms"], 50.0)  # Cần phản hồi siêu tốc dưới 50ms

        # Kiểm tra chi tiết cấu trúc item
        first_item = data["results"][0]
        self.assertIn("name", first_item)
        self.assertIn("hybrid_score", first_item)
        self.assertIn("score_breakdown", first_item)
        self.assertIn("bm25_norm", first_item["score_breakdown"])
        self.assertIn("dense_norm", first_item["score_breakdown"])

    def test_retrieve_policies_success(self):
        """Kiểm tra POST /rag/retrieve với kho ngữ liệu chính sách."""
        payload = {
            "query": "chính sách hoàn tiền hủy bàn",
            "top_k": 3,
            "index_type": "policies"
        }
        response = self.client.post("/rag/retrieve", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["index_type"], "policies")
        self.assertGreater(len(data["results"]), 0)

    def test_retrieve_validation_empty_query(self):
        """Kiểm tra validation từ chối query rỗng (422 Unprocessable Entity do min_length=1)."""
        response = self.client.post("/rag/retrieve", json={"query": ""})
        self.assertEqual(response.status_code, 422)

    def test_retrieve_validation_whitespace_query(self):
        """Kiểm tra validation từ chối query chỉ toàn khoảng trắng (400 Bad Request)."""
        response = self.client.post("/rag/retrieve", json={"query": "     "})
        self.assertEqual(response.status_code, 400)

    def test_retrieve_validation_invalid_top_k(self):
        """Kiểm tra validation top_k vượt ngưỡng le=100 hoặc < 1."""
        response = self.client.post("/rag/retrieve", json={"query": "bún bò", "top_k": 200})
        self.assertEqual(response.status_code, 422)
        response_neg = self.client.post("/rag/retrieve", json={"query": "bún bò", "top_k": 0})
        self.assertEqual(response_neg.status_code, 422)

    def test_retrieve_with_explicit_vector(self):
        """Kiểm tra POST /rag/retrieve khi truyền query_vector tường minh 768 chiều."""
        dummy_vector = [0.01 * (i % 10) for i in range(768)]
        payload = {
            "query": "lẩu hải sản chua cay",
            "query_vector": dummy_vector,
            "top_k": 4,
            "alpha": 0.7
        }
        response = self.client.post("/rag/retrieve", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["results"]), 4)
        # Vì có query_vector, actual_alpha dùng đúng 0.7
        breakdown = data["results"][0]["score_breakdown"]
        self.assertEqual(breakdown["alpha"], 0.7)

    def test_retrieve_cors_header(self):
        """Kiểm tra CORS headers phản hồi cho web clients."""
        response = self.client.options(
            "/rag/retrieve",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST"
            }
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access-control-allow-origin", response.headers)


if __name__ == "__main__":
    unittest.main()
