"""
Unit tests for Step 3.1 - Phase 3:
CulinaryEntityExtractor & MetadataFilter (F&B NER & Pre-retrieval Hard-Filtering)
"""

import unittest
from processors.metadata_filter import (
    CulinaryEntityExtractor,
    MetadataFilter,
    ExtractedEntities,
)
from processors.hybrid_retriever import HybridMenuRetriever


class TestMetadataFilter(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.extractor = CulinaryEntityExtractor()
        cls.filter = MetadataFilter()

        # Dữ liệu giả lập thực đơn phục vụ kiểm thử
        cls.mock_menu_items = [
            {
                "id": "item-1",
                "name": "Phở Bò Tái Nạm",
                "description": "Phở bò truyền thống với thịt bò tươi ngon, nước dùng hầm xương.",
                "price": 75000.0,
                "spice_level": 0,
                "allergens": ["thịt bò"],
                "dietary_tags": [],
            },
            {
                "id": "item-2",
                "name": "Bún Bò Huế Cay Nồng",
                "description": "Bún bò huế đậm đà cay nồng sa tế ớt hiểm.",
                "price": 85000.0,
                "spice_level": 4,
                "allergens": ["thịt bò", "mắm ruốc"],
                "dietary_tags": [],
            },
            {
                "id": "item-3",
                "name": "Gỏi Cuốn Tôm Thịt",
                "description": "Gỏi cuốn nhân tôm sú tươi và thịt ba chỉ, kèm tương đậu phộng.",
                "price": 55000.0,
                "spice_level": 0,
                "allergens": ["tôm", "hải sản", "đậu phộng"],
                "dietary_tags": [],
            },
            {
                "id": "item-4",
                "name": "Cơm Chiên Hải Sản",
                "description": "Cơm chiên giòn thơm với mực, tôm, chả cá.",
                "price": 65000.0,
                "spice_level": 1,
                "allergens": ["hải sản", "tôm", "mực", "trứng"],
                "dietary_tags": [],
            },
            {
                "id": "item-5",
                "name": "Đậu Hũ Sốt Nấm Chay",
                "description": "Món chay thanh đạm từ đậu hũ non và nấm hương tươi.",
                "price": 45000.0,
                "spice_level": 0,
                "allergens": [],
                "dietary_tags": ["chay", "vegan"],
            },
            {
                "id": "item-6",
                "name": "Trà Đào Cam Sả",
                "description": "Trà đen hương đào mát lạnh kết hợp cam tươi và sả cây.",
                "price": 40000.0,
                "spice_level": 0,
                "allergens": [],
                "dietary_tags": ["chay"],
            },
        ]

    def test_01_allergen_extraction(self):
        """Kiểm tra trích xuất các nhóm dị ứng chính xác từ nhiều mẫu câu."""
        q1 = "tôi bị dị ứng hải sản và tôm"
        res1 = self.extractor.extract(q1)
        self.assertIn("hải sản", res1.allergens)
        self.assertIn("tôm", res1.allergens)

        q2 = "không ăn được đậu phộng với trứng"
        res2 = self.extractor.extract(q2)
        self.assertIn("đậu phộng", res2.allergens)
        self.assertIn("trứng", res2.allergens)

        q3 = "đừng cho bột mì vì tôi dị ứng gluten"
        res3 = self.extractor.extract(q3)
        self.assertIn("gluten", res3.allergens)

    def test_02_dietary_tag_extraction(self):
        """Kiểm tra nhận diện chế độ ăn chay, vegan, keto."""
        res1 = self.extractor.extract("quán có món chay nào thanh đạm không?")
        self.assertIn("chay", res1.dietary_tags)

        res2 = self.extractor.extract("tìm đồ ăn thuần chay vegan")
        self.assertIn("vegan", res2.dietary_tags)

        res3 = self.extractor.extract("chế độ ăn keto ít tinh bột")
        self.assertIn("keto", res3.dietary_tags)

    def test_03_spice_level_extraction(self):
        """Kiểm tra bóc tách ngưỡng cay mong muốn."""
        res_no = self.extractor.extract("cho tôi một tô phở không cay nhé")
        self.assertEqual(res_no.max_spice_level, 0)

        res_mild = self.extractor.extract("món nào ít cay hoặc cay nhẹ thôi")
        self.assertEqual(res_mild.max_spice_level, 1)

        res_hot = self.extractor.extract("tìm lẩu cay nồng rất cay")
        self.assertEqual(res_hot.max_spice_level, 5)
        self.assertEqual(res_hot.min_spice_level, 3)

    def test_04_budget_extraction(self):
        """Kiểm tra bóc tách ngân sách tối đa và khoảng giá."""
        res1 = self.extractor.extract("tìm món dưới 50k")
        self.assertEqual(res1.max_price, 50000.0)

        res2 = self.extractor.extract("ngân sách không quá 100 nghìn")
        self.assertEqual(res2.max_price, 100000.0)

        res3 = self.extractor.extract("món từ 30k đến 70k")
        self.assertEqual(res3.min_price, 30000.0)
        self.assertEqual(res3.max_price, 70000.0)

    def test_05_category_extraction(self):
        """Kiểm tra bóc tách phân loại món ăn."""
        res1 = self.extractor.extract("tìm món nước buổi sáng")
        self.assertIn("món nước", res1.categories)

        res2 = self.extractor.extract("uống trà đào hay đồ uống gì")
        self.assertIn("đồ uống", res2.categories)

    def test_06_hard_filter_allergens(self):
        """Kiểm tra loại trừ 100% món ăn chứa dị ứng khi khách đã nêu dị ứng."""
        query = "tôi bị dị ứng hải sản và tôm sú"
        entities = self.extractor.extract(query)
        accepted, rejected = self.filter.filter_items(self.mock_menu_items, entities, self.extractor)

        # Gỏi cuốn (item-3) và Cơm chiên hải sản (item-4) phải bị loại trừ hoàn toàn!
        accepted_ids = [item["id"] for item in accepted]
        self.assertNotIn("item-3", accepted_ids)
        self.assertNotIn("item-4", accepted_ids)

        # Các món không chứa hải sản (Phở bò, Đậu hũ chay, Trà đào) phải còn lại
        self.assertIn("item-1", accepted_ids)
        self.assertIn("item-5", accepted_ids)
        self.assertIn("item-6", accepted_ids)

        # Kiểm tra lý do từ chối
        rejected_reasons = [r["rejection_reason"] for r in rejected]
        self.assertTrue(any("hải sản" in r or "tôm" in r for r in rejected_reasons))

    def test_07_hard_filter_max_price(self):
        """Kiểm tra loại bỏ các món có giá vượt quá ngân sách."""
        query = "tìm món giá dưới 60k"
        entities = self.extractor.extract(query)
        accepted, rejected = self.filter.filter_items(self.mock_menu_items, entities, self.extractor)

        accepted_ids = [item["id"] for item in accepted]
        # Phở bò (75k), Bún bò (85k), Cơm chiên hải sản (65k) phải bị loại
        self.assertNotIn("item-1", accepted_ids)
        self.assertNotIn("item-2", accepted_ids)
        self.assertNotIn("item-4", accepted_ids)

        # Gỏi cuốn (55k), Đậu hũ (45k), Trà đào (40k) phải được giữ
        self.assertIn("item-3", accepted_ids)
        self.assertIn("item-5", accepted_ids)
        self.assertIn("item-6", accepted_ids)

    def test_08_hard_filter_spice_level(self):
        """Kiểm tra lọc bỏ món cay khi khách yêu cầu không cay."""
        query = "cho tôi món không cay"
        entities = self.extractor.extract(query)
        accepted, rejected = self.filter.filter_items(self.mock_menu_items, entities, self.extractor)

        accepted_ids = [item["id"] for item in accepted]
        # Bún bò huế cay nồng (spice 4) và Cơm chiên (spice 1) phải bị loại
        self.assertNotIn("item-2", accepted_ids)
        self.assertNotIn("item-4", accepted_ids)

        # Món spice_level = 0 phải được giữ
        self.assertIn("item-1", accepted_ids)
        self.assertIn("item-5", accepted_ids)
        self.assertIn("item-6", accepted_ids)

    def test_09_hard_filter_vegetarian(self):
        """Kiểm tra lọc chế độ ăn chay chỉ giữ món chay."""
        query = "tôi ăn chay cần tìm đồ ăn"
        entities = self.extractor.extract(query)
        accepted, rejected = self.filter.filter_items(self.mock_menu_items, entities, self.extractor)

        accepted_ids = [item["id"] for item in accepted]
        # Phở bò, Bún bò, Gỏi cuốn tôm thịt, Cơm chiên hải sản phải bị loại
        self.assertNotIn("item-1", accepted_ids)
        self.assertNotIn("item-2", accepted_ids)
        self.assertNotIn("item-3", accepted_ids)
        self.assertNotIn("item-4", accepted_ids)

        # Đậu hũ sốt nấm chay và Trà đào được giữ
        self.assertIn("item-5", accepted_ids)
        self.assertIn("item-6", accepted_ids)

    def test_10_no_filter_when_no_constraints(self):
        """Kiểm tra câu hỏi thông thường không bị lọc mất dữ liệu."""
        query = "quán có món gì ngon giới thiệu cho tôi"
        entities = self.extractor.extract(query)
        self.assertFalse(entities.to_dict()["has_filters"])

        accepted, rejected = self.filter.filter_items(self.mock_menu_items, entities, self.extractor)
        self.assertEqual(len(accepted), len(self.mock_menu_items))
        self.assertEqual(len(rejected), 0)

    def test_11_hybrid_retriever_metadata_filter_integration(self):
        """Kiểm tra tích hợp trực tiếp MetadataFilter vào HybridMenuRetriever."""
        retriever = HybridMenuRetriever(default_alpha=0.6, index_type="menu")
        
        # Truy vấn có dị ứng tôm và hải sản
        results = retriever.retrieve("tôi dị ứng tôm và hải sản", top_k=10, enable_metadata_filter=True)
        
        # Đảm bảo không có món nào chứa tôm hoặc hải sản
        for r in results:
            name_lower = r["name"].lower()
            self.assertNotIn("tôm", name_lower)
            self.assertNotIn("hải sản", name_lower)
            self.assertNotIn("mực", name_lower)

        # Kiểm tra thông số lọc được ghi nhận
        self.assertIsNotNone(retriever.last_extracted_entities)
        self.assertIn("tôm", retriever.last_extracted_entities.allergens)
        self.assertIn("total_before_filter", retriever.last_filter_stats)

    def test_12_meat_exclusion_on_negation_queries(self):
        """Kiểm tra loại bỏ 100% món thịt khi khách nêu các biến thể phủ định thịt (thit / thịt / không muốn ăn / ngán)."""
        test_queries = [
            "tôi không muốn ăn món có thit",
            "tôi không muốn ăn món có thịt",
            "tôi không thích ăn thịt",
            "tôi không ăn thịt",
            "ngán thịt quá kiếm gì thanh đạm",
            "không ăn món có thịt"
        ]

        for q in test_queries:
            entities = self.extractor.extract(q)
            self.assertIn("thịt", entities.allergens, f"Thực thể 'thịt' phải được bóc tách từ: {q}")

            accepted, rejected = self.filter.filter_items(self.mock_menu_items, entities, self.extractor)
            accepted_ids = [item["id"] for item in accepted]
            rejected_ids = [item["id"] for item in rejected]

            # Phở bò (item-1), Bún bò huế (item-2), Gỏi cuốn tôm thịt (item-3) PHẢI bị loại
            self.assertNotIn("item-1", accepted_ids, f"Phở bò không được có trong accepted cho query: {q}")
            self.assertNotIn("item-2", accepted_ids, f"Bún bò không được có trong accepted cho query: {q}")
            self.assertNotIn("item-3", accepted_ids, f"Gỏi cuốn tôm thịt không được có trong accepted cho query: {q}")

            self.assertIn("item-1", rejected_ids)
            self.assertIn("item-2", rejected_ids)
            self.assertIn("item-3", rejected_ids)

            # Món không chứa thịt (Đậu hũ sốt nấm, Trà đào) được giữ
            self.assertIn("item-5", accepted_ids)
            self.assertIn("item-6", accepted_ids)


if __name__ == "__main__":
    unittest.main()
