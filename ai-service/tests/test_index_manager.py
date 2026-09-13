"""
Unit Tests for vietnamese_tokenizer.py and index_manager.py
Kiểm thử toàn diện cho Bước 2.1: Tokenizer tiếng Việt, FAISS HNSW & BM25 Index Manager
"""

import unittest
import tempfile
import shutil
from pathlib import Path
import numpy as np

from processors.vietnamese_tokenizer import (
    normalize_vietnamese_text,
    tokenize_vietnamese,
)
from processors.index_manager import DualIndexManager


class TestIndexManager(unittest.TestCase):

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.sample_items = [
            {
                "id": "1",
                "name": "Phở Bò Tái Nạm",
                "category": {"name": "Món chính"},
                "price": 75000,
                "ingredients": ["Bánh phở", "Bắp bò", "Nạm bò"],
                "allergens": [],
                "dietary_tags": ["không gluten"],
            },
            {
                "id": "2",
                "name": "Gỏi cuốn Tôm Thịt",
                "category": {"name": "Khai vị"},
                "price": 45000,
                "ingredients": ["Tôm", "Thịt heo", "Bún tươi"],
                "allergens": ["Hải sản"],
                "dietary_tags": ["thanh đạm"],
            },
            {
                "id": "3",
                "name": "Cà phê Sữa Đá",
                "category": {"name": "Đồ uống"},
                "price": 35000,
                "ingredients": ["Cà phê", "Sữa đặc"],
                "allergens": ["Sữa"],
                "dietary_tags": [],
            },
        ]
        self.sample_serialized = [
            "[MÓN ĂN: Phở Bò Tái Nạm]\n• Phân loại: Món chính\n• Giá bán: 75,000 VND\n• Độ cay: 0/5 (Không cay)\n• Thành phần nguyên liệu: Bánh phở, Bắp bò, Nạm bò\n• Cảnh báo dị ứng: Không có dị ứng phổ biến",
            "[MÓN ĂN: Gỏi cuốn Tôm Thịt]\n• Phân loại: Khai vị\n• Giá bán: 45,000 VND\n• Độ cay: 0/5 (Không cay)\n• Thành phần nguyên liệu: Tôm, Thịt heo, Bún tươi\n• Cảnh báo dị ứng: Hải sản",
            "[MÓN ĂN: Cà phê Sữa Đá]\n• Phân loại: Đồ uống\n• Giá bán: 35,000 VND\n• Độ cay: 0/5 (Không cay)\n• Thành phần nguyên liệu: Cà phê, Sữa đặc\n• Cảnh báo dị ứng: Sữa",
        ]

    def tearDown(self):
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_01_vietnamese_text_normalization(self):
        """Kiểm tra chuẩn hóa Unicode và loại bỏ ký tự lạ."""
        raw = "   Phở Bò - Tái Nạm (Nước Dùng Đậm Đà!)   "
        clean = normalize_vietnamese_text(raw)
        self.assertEqual(clean, "phở bò tái nạm nước dùng đậm đà")

    def test_02_vietnamese_tokenizer_compounds(self):
        """Kiểm tra bắt đúng các từ ghép F&B quan trọng."""
        text = "Cho tôi một tô phở bò không cay và một ly cà phê sữa đá"
        tokens = tokenize_vietnamese(text)
        self.assertIn("phở_bò", tokens)
        self.assertIn("không_cay", tokens)
        self.assertIn("cà_phê_sữa_đá", tokens)

    def test_03_index_manager_build_and_search_sparse(self):
        """Kiểm tra khởi tạo và truy vấn BM25 tìm trúng từ khóa món ăn."""
        manager = DualIndexManager(dimension=768, storage_dir=self.test_dir)
        manager.build_indexes(self.sample_items, self.sample_serialized)

        # Tìm kiếm BM25 chính xác
        results = manager.search_sparse("phở bò", top_k=2)
        self.assertTrue(len(results) > 0)
        top_idx, score = results[0]
        self.assertEqual(top_idx, 0)  # Phải là Phở Bò Tái Nạm
        self.assertTrue(score > 0.0)

    def test_04_index_manager_search_dense(self):
        """Kiểm tra tìm kiếm vector Dense search hoạt động với độ trễ < 5ms."""
        import time
        manager = DualIndexManager(dimension=768, storage_dir=self.test_dir)
        manager.build_indexes(self.sample_items, self.sample_serialized)

        query_vec = np.random.randn(768).astype(np.float32)
        t0 = time.perf_counter()
        results = manager.search_dense(query_vec, top_k=2)
        latency_ms = (time.perf_counter() - t0) * 1000

        self.assertEqual(len(results), 2)
        self.assertLess(latency_ms, 5.0)  # Phải nhỏ hơn 5ms

    def test_05_disk_persistence(self):
        """Kiểm tra lưu chỉ mục ra đĩa và nạp lại vào đối tượng mới."""
        manager1 = DualIndexManager(dimension=768, storage_dir=self.test_dir)
        manager1.build_indexes(self.sample_items, self.sample_serialized)
        manager1.save_to_disk(prefix="test_menu")

        # Nạp vào manager mới
        manager2 = DualIndexManager(dimension=768, storage_dir=self.test_dir)
        loaded = manager2.load_from_disk(prefix="test_menu")

        self.assertTrue(loaded)
        self.assertEqual(len(manager2.corpus_items), 3)

        # Kiểm tra truy vấn trên manager sau khi load từ đĩa
        results = manager2.search_sparse("cà phê sữa", top_k=1)
        self.assertTrue(len(results) > 0)
        self.assertEqual(results[0][0], 2)  # Cà phê Sữa Đá


if __name__ == "__main__":
    unittest.main()
