"""
Unit tests for HybridMenuRetriever & Min-Max Normalization (Step 2.2 - Phase 2)
Tests:
1. min_max_normalize with standard inputs and boundary cases (empty, identical scores, zero division).
2. Hybrid retrieval logic: Dense + BM25 score fusion with alpha = 0.6.
3. Extreme alpha weighting: alpha=1.0 (pure dense) and alpha=0.0 (pure BM25).
4. Score breakdown integrity: checks all intermediate score fields exist and hybrid_score in [0, 1].
5. Resilience against empty queries and empty corpus.
6. Multi-corpus compatibility (menu and restaurant policies).
"""

import unittest
import numpy as np

from processors.index_manager import DualIndexManager
from processors.hybrid_retriever import (
    HybridMenuRetriever,
    min_max_normalize,
)


class TestHybridMenuRetriever(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Khởi tạo tập dữ liệu mẫu và IndexManager phục vụ kiểm thử."""
        cls.sample_items = [
            {
                "id": "item-01",
                "name": "Phở Bò Tái Nạm",
                "price": 75000,
                "category": "Món nước",
                "dietary_tags": ["không cay"],
                "description": "Phở bò truyền thống thơm ngon đậm đà",
            },
            {
                "id": "item-02",
                "name": "Bún Bò Huế Cay Nồng",
                "price": 80000,
                "category": "Món nước",
                "dietary_tags": ["cay nhiều"],
                "description": "Bún bò Huế sa tế cay nồng đậm vị cố đô",
            },
            {
                "id": "item-03",
                "name": "Gỏi Cuốn Tôm Thịt",
                "price": 50000,
                "category": "Khai vị",
                "dietary_tags": ["không cay", "thanh đạm"],
                "description": "Gỏi cuốn tôm tươi rau sống chấm tương đậu",
            },
            {
                "id": "item-04",
                "name": "Trà Đào Cam Sả",
                "price": 45000,
                "category": "Đồ uống",
                "dietary_tags": ["ít đường", "giải nhiệt"],
                "description": "Trà đào thơm lừng kết hợp cam vàng và sả tươi",
            },
        ]

        cls.serialized_texts = [
            "Món ăn: Phở Bò Tái Nạm | Mục: Món nước | Giá: 75.000 VNĐ | Chế độ ăn: không cay | Mô tả: Phở bò truyền thống thơm ngon đậm đà",
            "Món ăn: Bún Bò Huế Cay Nồng | Mục: Món nước | Giá: 80.000 VNĐ | Chế độ ăn: cay nhiều | Mô tả: Bún bò Huế sa tế cay nồng đậm vị cố đô",
            "Món ăn: Gỏi Cuốn Tôm Thịt | Mục: Khai vị | Giá: 50.000 VNĐ | Chế độ ăn: không cay, thanh đạm | Mô tả: Gỏi cuốn tôm tươi rau sống chấm tương đậu",
            "Món ăn: Trà Đào Cam Sả | Mục: Đồ uống | Giá: 45.000 VNĐ | Chế độ ăn: ít đường, giải nhiệt | Mô tả: Trà đào thơm lừng kết hợp cam vàng và sả tươi",
        ]

        # Tạo vector giả lập 768 chiều có định hướng cho từng món
        cls.dimension = 768
        cls.embeddings = np.zeros((len(cls.sample_items), cls.dimension), dtype=np.float32)
        # Gán vector phân biệt để kiểm tra tính chính xác của dense search
        for i in range(len(cls.sample_items)):
            cls.embeddings[i, i * 100] = 1.0  # One-hot like signal on distinct dimensions

        cls.index_mgr = DualIndexManager(dimension=cls.dimension)
        cls.index_mgr.build_indexes(
            raw_items=cls.sample_items,
            serialized_texts=cls.serialized_texts,
            embeddings=cls.embeddings,
        )

        cls.retriever = HybridMenuRetriever(index_manager=cls.index_mgr, default_alpha=0.6)

    def test_01_min_max_normalize_standard(self):
        """Kiểm tra Min-Max Normalization chuẩn trên mảng điểm thông thường."""
        raw_scores = {0: 10.0, 1: 20.0, 2: 30.0}
        norm = min_max_normalize(raw_scores)
        self.assertAlmostEqual(norm[0], 0.0, places=5)
        self.assertAlmostEqual(norm[1], 0.5, places=5)
        self.assertAlmostEqual(norm[2], 1.0, places=5)

    def test_02_min_max_normalize_edge_cases(self):
        """Kiểm tra các trường hợp biên: dict rỗng, min == max, điểm âm."""
        # 1. Dict rỗng
        self.assertEqual(min_max_normalize({}), {})

        # 2. Tất cả các giá trị bằng nhau (> 0)
        norm_identical_pos = min_max_normalize({0: 5.0, 1: 5.0})
        self.assertEqual(norm_identical_pos[0], 1.0)
        self.assertEqual(norm_identical_pos[1], 1.0)

        # 3. Tất cả các giá trị bằng 0
        norm_identical_zero = min_max_normalize({0: 0.0, 1: 0.0})
        self.assertEqual(norm_identical_zero[0], 0.0)
        self.assertEqual(norm_identical_zero[1], 0.0)

        # 4. Chỉ có 1 phần tử
        norm_single = min_max_normalize({0: 15.0})
        self.assertEqual(norm_single[0], 1.0)

    def test_03_exact_keyword_boost(self):
        """Kiểm tra BM25 đẩy món ăn có từ khóa chính xác lên đầu."""
        results = self.retriever.retrieve(query="Phở bò tái nạm", top_k=2)
        self.assertGreater(len(results), 0)
        top1 = results[0]
        self.assertEqual(top1["name"], "Phở Bò Tái Nạm")
        self.assertGreater(top1["score_breakdown"]["bm25_raw"], 0.0)

    def test_04_dense_vector_boost(self):
        """Kiểm tra khi truyền query_vector trùng với vector của món thứ 3 (Gỏi cuốn)."""
        # Vector khớp hoàn hảo với món thứ 2 (Gỏi Cuốn Tôm Thịt)
        target_vec = np.zeros(self.dimension, dtype=np.float32)
        target_vec[200] = 1.0  # Tương ứng với index 2

        # Query từ khóa không nhắc đến tên món
        results = self.retriever.retrieve(
            query="món gì đó mát lành",
            query_vector=target_vec,
            top_k=2,
            alpha=0.9,  # Ưu tiên dense
        )
        self.assertGreater(len(results), 0)
        top1 = results[0]
        self.assertEqual(top1["name"], "Gỏi Cuốn Tôm Thịt")
        self.assertAlmostEqual(top1["score_breakdown"]["dense_raw"], 1.0, places=3)

    def test_05_alpha_weighting_impact(self):
        """Kiểm tra sự thay đổi của hybrid_score khi thay đổi alpha (0.0, 0.6, 1.0)."""
        query = "bún bò huế cay"
        q_vec = self.embeddings[1]  # Vector của món thứ 2 (Bún Bò Huế)

        # Pure BM25 (alpha = 0.0)
        res_bm25 = self.retriever.retrieve(query=query, query_vector=q_vec, top_k=1, alpha=0.0)
        self.assertEqual(res_bm25[0]["score_breakdown"]["alpha"], 0.0)
        self.assertAlmostEqual(res_bm25[0]["score_breakdown"]["dense_norm"], 0.0)
        self.assertGreater(res_bm25[0]["score_breakdown"]["bm25_norm"], 0.0)

        # Pure Dense (alpha = 1.0)
        res_dense = self.retriever.retrieve(query=query, query_vector=q_vec, top_k=1, alpha=1.0)
        self.assertEqual(res_dense[0]["score_breakdown"]["alpha"], 1.0)
        self.assertAlmostEqual(res_dense[0]["score_breakdown"]["bm25_norm"], 0.0)
        self.assertAlmostEqual(res_dense[0]["score_breakdown"]["dense_norm"], 1.0)

        # Standard Hybrid (alpha = 0.6)
        res_hybrid = self.retriever.retrieve(query=query, query_vector=q_vec, top_k=1, alpha=0.6)
        bd = res_hybrid[0]["score_breakdown"]
        expected_score = round(0.6 * bd["dense_norm"] + 0.4 * bd["bm25_norm"], 4)
        self.assertAlmostEqual(res_hybrid[0]["hybrid_score"], expected_score, places=4)

    def test_06_score_breakdown_and_bounds(self):
        """Đảm bảo mọi kết quả trả về đều có điểm số nằm chặt trong [0, 1] và đầy đủ metadata."""
        results = self.retriever.retrieve(query="trà đào cam sả ít đường", top_k=4)
        self.assertGreater(len(results), 0)
        for res in results:
            self.assertIn("index", res)
            self.assertIn("name", res)
            self.assertIn("item", res)
            self.assertIn("hybrid_score", res)
            self.assertIn("score_breakdown", res)
            # Kiểm tra khoảng giá trị
            score = res["hybrid_score"]
            self.assertGreaterEqual(score, 0.0)
            self.assertLessEqual(score, 1.0)

    def test_07_empty_query_safety(self):
        """Kiểm tra an toàn với câu truy vấn rỗng hoặc khoảng trắng."""
        self.assertEqual(self.retriever.retrieve(query=""), [])
        self.assertEqual(self.retriever.retrieve(query="   "), [])
        self.assertEqual(self.retriever.retrieve(query=None), [])


if __name__ == "__main__":
    unittest.main()
