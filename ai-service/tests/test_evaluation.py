"""Unit tests for Phase 5 Evaluation Suite (LLM-as-a-Judge & Golden Dataset).
"""

import unittest
from evaluation.golden_dataset import (
    GOLDEN_BENCHMARK_DATASET,
    UserGroup,
    BenchmarkCase,
    get_benchmark_by_group,
)
from evaluation.judge import RAGJudge, EvaluationResult


class TestEvaluationSuite(unittest.TestCase):
    """Test suite for golden dataset and judge logic."""

    def setUp(self):
        self.judge = RAGJudge()

    def test_golden_dataset_size_and_integrity(self):
        """Golden benchmark dataset must contain exactly 100 test items."""
        self.assertEqual(len(GOLDEN_BENCHMARK_DATASET), 100)

        # Check required fields on BenchmarkCase pydantic model
        for idx, case in enumerate(GOLDEN_BENCHMARK_DATASET):
            self.assertIsInstance(case, BenchmarkCase)
            self.assertTrue(case.id.startswith("tc_"), f"Invalid id format at {idx}")
            self.assertIsInstance(case.user_group, UserGroup)
            self.assertTrue(len(case.query) > 5, f"Query too short at {idx}")
            self.assertIsInstance(case.expected_constraints, dict)
            self.assertIsInstance(case.expected_dishes, list)
            self.assertIsInstance(case.forbidden_dishes, list)

    def test_dataset_group_distribution(self):
        """Ensure all 5 archetypes have 20 test cases each."""
        groups = [
            UserGroup.FAMILY_ELDERLY,
            UserGroup.OFFICE_LUNCH,
            UserGroup.DIETARY_ALLERGEN,
            UserGroup.FRIENDS_GATHERING,
            UserGroup.COUPLES_DATE,
        ]
        for g in groups:
            items = get_benchmark_by_group(g)
            self.assertEqual(len(items), 20, f"Group {g} must have exactly 20 cases")

    def test_extract_suggested_dishes(self):
        """Verify extraction of bolded dish names from answers."""
        sample_answer = (
            "Dạ, quán xin gợi ý cho gia đình món **Chả Giò Hải Sản** giòn rụm "
            "và **Canh Chua Cá Lóc** đậm đà vị miền Tây."
        )
        detected = self.judge.extract_suggested_dishes(sample_answer)
        self.assertIn("Chả Giò Hải Sản", detected)
        self.assertIn("Canh Chua Cá Lóc", detected)
        self.assertNotIn("Cơm chiên hải sản", detected)

    def test_deterministic_evaluation_calculation(self):
        """Test faithfulness, relevance, and precision calculation on simulated response."""
        case = BenchmarkCase(
            id="tc_mock_01",
            user_group=UserGroup.OFFICE_LUNCH,
            query="Cơm trưa văn phòng nhanh gọn dưới 80k",
            expected_constraints={"max_budget": 80000},
            expected_dishes=["Cơm Tấm Sườn Bì Chả", "Cơm Gà Xối Mỡ"],
            forbidden_dishes=["Lẩu Hải Sản"],
            description="Mock test case for office lunch",
        )
        mock_response = (
            "Dạ quán gợi ý bạn món **Cơm Tấm Sườn Bì Chả** giá 65.000đ "
            "rất thích hợp cho bữa trưa nhanh gọn và no bụng ạ."
        )
        mock_retrieved = [
            {"name": "Cơm Tấm Sườn Bì Chả", "price": 65000, "category": "Cơm"},
            {"name": "Trà Đá", "price": 5000, "category": "Đồ uống"},
        ]

        result = self.judge.evaluate(case, mock_response, mock_retrieved)
        self.assertIsInstance(result, EvaluationResult)
        self.assertGreaterEqual(result.faithfulness, 0.80)
        self.assertGreaterEqual(result.relevance, 0.70)
        self.assertGreaterEqual(result.precision, 0.80)
        self.assertFalse(result.allergen_violation)
        self.assertFalse(result.price_violation)

    def test_allergen_violation_detection(self):
        """Ensure judge catches forbidden dishes and marks zero allergen safety."""
        case = BenchmarkCase(
            id="tc_mock_allergen",
            user_group=UserGroup.DIETARY_ALLERGEN,
            query="Tôi dị ứng tôm cua, tuyệt đối không ăn hải sản",
            expected_constraints={"allergens": ["tôm", "hải sản"]},
            expected_dishes=["Gà Hấp Lá Chanh"],
            forbidden_dishes=["Tôm Sú Sốt Me", "Gỏi Cuốn Tôm Thịt"],
            description="Mock allergen violation test",
        )
        bad_response = (
            "Dạ em mời anh chị thưởng thức món **Tôm Sú Sốt Me** thơm ngon đậm đà ạ!"
        )
        result = self.judge.evaluate(case, bad_response, [])
        self.assertTrue(result.allergen_violation)
        self.assertEqual(result.faithfulness, 0.0)


if __name__ == "__main__":
    unittest.main()
