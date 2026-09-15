"""
Unit tests cho Module Cross-Encoder Contextual Reranking (Bước 3.2 - Pha 3)
Kiểm tra tính đúng đắn của thuật toán, chuẩn hóa điểm số, độ trễ và khả năng tích hợp.
"""

import unittest
import time
import numpy as np

from processors.cross_encoder_reranker import CrossEncoderReranker, sigmoid
from processors.hybrid_retriever import HybridMenuRetriever
from processors.index_manager import DualIndexManager


class TestCrossEncoderReranker(unittest.TestCase):
    """Bộ kiểm thử đơn vị cho CrossEncoderReranker."""

    @classmethod
    def setUpClass(cls):
        """Khởi tạo môi trường dữ liệu giả lập cho reranker."""
        cls.reranker = CrossEncoderReranker(rerank_weight=0.7)

        # Mẫu 5 ứng viên giả lập trả về từ tầng Hybrid Retriever
        cls.sample_candidates = [
            {
                "index": 0,
                "id": "item-1",
                "name": "Phở Bò Tái Nạm",
                "item": {
                    "id": "item-1",
                    "name": "Phở Bò Tái Nạm",
                    "category": "Món Nước",
                    "price": 65000,
                    "description": "Phở bò truyền thống nước dùng hầm xương 12 tiếng, thịt bò tươi mềm.",
                    "ingredients": ["bánh phở", "thịt bò", "nước hầm xương", "hành lá", "gừng"],
                    "allergens": [],
                    "dietary_tags": [],
                    "spice_level": 0
                },
                "serialized_text": "Món: Phở Bò Tái Nạm. Phân loại: Món Nước. Giá: 65,000 VND. Mô tả: Phở bò truyền thống.",
                "hybrid_score": 0.85,
                "score_breakdown": {"alpha": 0.6}
            },
            {
                "index": 1,
                "id": "item-2",
                "name": "Bún Bò Huế Đặc Biệt",
                "item": {
                    "id": "item-2",
                    "name": "Bún Bò Huế Đặc Biệt",
                    "category": "Món Nước",
                    "price": 75000,
                    "description": "Bún bò Huế cay nồng vị sả ớt sa tế, giò heo và chả cua thơm lừng.",
                    "ingredients": ["bún", "thịt bò", "giò heo", "sa tế", "sả", "ớt"],
                    "allergens": [],
                    "dietary_tags": [],
                    "spice_level": 3
                },
                "serialized_text": "Món: Bún Bò Huế Đặc Biệt. Phân loại: Món Nước. Giá: 75,000 VND. Mô tả: Bún bò huế cay nồng.",
                "hybrid_score": 0.80,
                "score_breakdown": {"alpha": 0.6}
            },
            {
                "index": 2,
                "id": "item-3",
                "name": "Gỏi Cuốn Tôm Thịt",
                "item": {
                    "id": "item-3",
                    "name": "Gỏi Cuốn Tôm Thịt",
                    "category": "Khai Vị",
                    "price": 45000,
                    "description": "Gỏi cuốn bánh tráng thanh đạm, tôm tươi, thịt ba chỉ luộc, rau thơm.",
                    "ingredients": ["bánh tráng", "tôm", "thịt heo", "bún", "rau thơm"],
                    "allergens": ["hải sản", "tôm"],
                    "dietary_tags": [],
                    "spice_level": 0
                },
                "serialized_text": "Món: Gỏi Cuốn Tôm Thịt. Phân loại: Khai Vị. Giá: 45,000 VND. Mô tả: Gỏi cuốn thanh đạm.",
                "hybrid_score": 0.65,
                "score_breakdown": {"alpha": 0.6}
            },
            {
                "index": 3,
                "id": "item-4",
                "name": "Trà Đào Cam Sả Mát Lạnh",
                "item": {
                    "id": "item-4",
                    "name": "Trà Đào Cam Sả Mát Lạnh",
                    "category": "Đồ Uống",
                    "price": 35000,
                    "description": "Trà đào thanh mát giải nhiệt, miếng đào giòn ngâm thơm ngon sảng khoái.",
                    "ingredients": ["trà đen", "đào ngâm", "cam", "sả", "đá"],
                    "allergens": [],
                    "dietary_tags": ["chay", "vegan"],
                    "spice_level": 0
                },
                "serialized_text": "Món: Trà Đào Cam Sả Mát Lạnh. Phân loại: Đồ Uống. Giá: 35,000 VND.",
                "hybrid_score": 0.45,
                "score_breakdown": {"alpha": 0.6}
            }
        ]

    def test_01_sigmoid_utility(self):
        """Kiểm tra hàm sigmoid với các giá trị bình thường và giá trị biên cực đoan."""
        self.assertAlmostEqual(sigmoid(0.0), 0.5, places=4)
        self.assertGreater(sigmoid(5.0), 0.99)
        self.assertLess(sigmoid(-5.0), 0.01)
        # An toàn chống tràn số
        self.assertEqual(sigmoid(1000.0), 1.0)
        self.assertEqual(sigmoid(-1000.0), 0.0)

    def test_02_empty_query_and_empty_candidates(self):
        """Kiểm tra trường hợp danh sách ứng viên rỗng hoặc query rỗng."""
        # 1. Candidates rỗng -> trả về rỗng ngay lập tức
        res_empty = self.reranker.rerank(query="phở bò", candidates=[], top_k=5)
        self.assertEqual(res_empty, [])

        # 2. Query rỗng -> giữ nguyên thứ tự ban đầu và gán rank
        res_blank = self.reranker.rerank(query="   ", candidates=self.sample_candidates, top_k=3)
        self.assertEqual(len(res_blank), 3)
        self.assertEqual(res_blank[0]["name"], "Phở Bò Tái Nạm")
        self.assertEqual(res_blank[0]["initial_rank"], 1)
        self.assertEqual(res_blank[0]["final_rank"], 1)

    def test_03_score_bounds_and_breakdown(self):
        """Đảm bảo mọi rerank_score và combined_score đều nằm chặt trong [0, 1]."""
        results = self.reranker.rerank(
            query="tìm món bún bò huế cay nồng",
            candidates=self.sample_candidates,
            top_k=4
        )
        self.assertEqual(len(results), 4)

        for item in results:
            self.assertIn("rerank_score", item)
            self.assertIn("combined_score", item)
            self.assertIn("initial_rank", item)
            self.assertIn("final_rank", item)
            self.assertIn("rerank_engine", item)

            self.assertGreaterEqual(item["rerank_score"], 0.0)
            self.assertLessEqual(item["rerank_score"], 1.0)

            self.assertGreaterEqual(item["combined_score"], 0.0)
            self.assertLessEqual(item["combined_score"], 1.0)

            breakdown = item["score_breakdown"]
            self.assertIn("rerank_norm", breakdown)
            self.assertIn("combined_score", breakdown)
            self.assertIn("rerank_weight", breakdown)

    def test_04_reordering_impact_intent_and_keyword(self):
        """
        Kiểm tra khả năng tái sắp xếp: Khi hỏi 'bún bò huế cay nồng',
        'Bún Bò Huế Đặc Biệt' ban đầu đứng thứ 2 (hybrid 0.80) phải được đẩy lên hạng 1
        vượt qua 'Phở Bò Tái Nạm' (hybrid 0.85).
        """
        results = self.reranker.rerank(
            query="cho tôi một tô bún bò huế cay nồng nhiều sả ớt",
            candidates=self.sample_candidates,
            top_k=3
        )

        top_1 = results[0]
        self.assertEqual(top_1["name"], "Bún Bò Huế Đặc Biệt")
        self.assertEqual(top_1["final_rank"], 1)
        self.assertEqual(top_1["initial_rank"], 2)  # Ban đầu đứng thứ 2, nay lên thứ 1

    def test_05_weight_influence(self):
        """Kiểm tra sự thay đổi khi điều chỉnh rerank_weight."""
        # Khi weight = 0.0: Điểm tổng hợp hoàn toàn là hybrid_score ban đầu
        res_hybrid_only = self.reranker.rerank(
            query="cho tôi bún bò huế",
            candidates=self.sample_candidates,
            top_k=2,
            rerank_weight=0.0
        )
        self.assertEqual(res_hybrid_only[0]["name"], "Phở Bò Tái Nạm")

        # Khi weight = 1.0: Điểm tổng hợp hoàn toàn là rerank_score (Bún bò lên ngôi)
        res_rerank_only = self.reranker.rerank(
            query="cho tôi bún bò huế",
            candidates=self.sample_candidates,
            top_k=2,
            rerank_weight=1.0
        )
        self.assertEqual(res_rerank_only[0]["name"], "Bún Bò Huế Đặc Biệt")

    def test_06_top_k_truncation(self):
        """Kiểm tra cắt Top-K chính xác theo yêu cầu."""
        res_top1 = self.reranker.rerank(query="uống giải nhiệt", candidates=self.sample_candidates, top_k=1)
        self.assertEqual(len(res_top1), 1)

        res_top2 = self.reranker.rerank(query="uống giải nhiệt", candidates=self.sample_candidates, top_k=2)
        self.assertEqual(len(res_top2), 2)

    def test_07_rerank_latency_sla(self):
        """Đảm bảo thời gian tái xếp hạng 20 ứng viên đạt chuẩn Paper 01 SLA (< 25ms)."""
        # Tạo tập 20 ứng viên giả lập
        expanded_candidates = (self.sample_candidates * 5)[:20]

        start = time.perf_counter()
        results = self.reranker.rerank(
            query="tìm món cuốn thanh đạm giá rẻ dưới 50k",
            candidates=expanded_candidates,
            top_k=5
        )
        elapsed_ms = (time.perf_counter() - start) * 1000.0

        self.assertEqual(len(results), 5)
        # Tiêu chuẩn Gate 3 đề ra: < 25.0ms
        self.assertLess(elapsed_ms, 25.0, f"Độ trễ Rerank {elapsed_ms:.2f}ms vượt ngưỡng 25ms")

    def test_08_hybrid_retriever_integration(self):
        """Kiểm tra tích hợp trực tiếp CrossEncoderReranker vào HybridMenuRetriever."""
        retriever = HybridMenuRetriever(default_alpha=0.6, index_type="menu")

        # Truy vấn với enable_rerank=True (mặc định)
        results_reranked = retriever.retrieve(
            query="phở bò",
            top_k=3,
            auto_mock_vector=True,
            enable_rerank=True
        )

        self.assertGreater(len(results_reranked), 0)
        first_item = results_reranked[0]
        self.assertIn("rerank_score", first_item)
        self.assertIn("final_rank", first_item)
        self.assertIn("rerank_engine", first_item)

        stats = retriever.last_rerank_stats
        self.assertTrue(stats.get("enabled"))
        self.assertIn("latency_ms", stats)

    def test_09_hybrid_retriever_disable_rerank_flag(self):
        """Kiểm tra cờ enable_rerank=False bỏ qua bước rerank."""
        retriever = HybridMenuRetriever(default_alpha=0.6, index_type="menu")

        results_no_rerank = retriever.retrieve(
            query="phở bò",
            top_k=3,
            auto_mock_vector=True,
            enable_rerank=False
        )

        self.assertGreater(len(results_no_rerank), 0)
        stats = retriever.last_rerank_stats
        self.assertFalse(stats.get("enabled"))
        self.assertEqual(stats.get("latency_ms"), 0.0)

    def test_10_policy_index_reranking(self):
        """Kiểm tra reranker hoạt động trơn tru trên chỉ mục chính sách nhà hàng."""
        retriever = HybridMenuRetriever(default_alpha=0.6, index_type="policies")

        results = retriever.retrieve(
            query="quy định hoàn tiền và hủy bàn đặt trước",
            top_k=2,
            auto_mock_vector=True,
            enable_rerank=True
        )

        self.assertGreater(len(results), 0)
        self.assertIn("rerank_score", results[0])


if __name__ == "__main__":
    unittest.main()
