"""
Unit Tests for row_serializer.py
Bao phủ 100% các hàm và kịch bản null-safety, tiếng Việt có dấu, định dạng số, mảng rỗng.
"""

import unittest
from processors.row_serializer import (
    serialize_menu_row,
    serialize_menu_item,
    serialize_restaurant_policy,
)


class TestRowSerializer(unittest.TestCase):

    def test_01_full_menu_item(self):
        """Kiểm tra tuần tự hóa một món ăn có đầy đủ 100% thuộc tính."""
        item = {
            "name": "Phở Bò Tái Nạm",
            "category": {"name": "Món chính (Main Dish)"},
            "price": 75000,
            "spice_level": 1,
            "calories": 480,
            "ingredients": ["Bánh phở", "Bắp bò", "Nạm bò", "Hành lá", "Nước dùng xương"],
            "allergens": [],
            "dietary_tags": ["không gluten"],
            "description": "Phở bò truyền thống thơm ngon đậm đà.",
            "ai_description": "Nước dùng trong, ngọt hậu từ xương ống hầm 12 tiếng.",
            "is_trending": True,
        }
        res = serialize_menu_row(item)

        self.assertIn("[MÓN ĂN: Phở Bò Tái Nạm (Món thịnh hành ⭐)]", res)
        self.assertIn("• Phân loại: Món chính (Main Dish)", res)
        self.assertIn("• Giá bán: 75,000 VND", res)
        self.assertIn("• Độ cay: 1/5", res)
        self.assertIn("• Lượng Calo: 480 kcal", res)
        self.assertIn("• Thành phần nguyên liệu: Bánh phở, Bắp bò, Nạm bò, Hành lá, Nước dùng xương", res)
        self.assertIn("• Cảnh báo dị ứng: Không có dị ứng phổ biến", res)
        self.assertIn("• Nhãn chế độ ăn: không gluten", res)
        self.assertIn("Phở bò truyền thống thơm ngon đậm đà. Nước dùng trong, ngọt hậu từ xương ống hầm 12 tiếng.", res)

    def test_02_minimal_menu_item(self):
        """Kiểm tra món ăn chỉ có tên và giá, các trường khác là None/thiếu."""
        item = {
            "name": "Trà Đá",
            "price": 5000,
        }
        res = serialize_menu_row(item)

        self.assertIn("[MÓN ĂN: Trà Đá]", res)
        self.assertIn("• Phân loại: Khác", res)
        self.assertIn("• Giá bán: 5,000 VND", res)
        self.assertIn("• Độ cay: 0/5 (Không cay)", res)
        self.assertIn("• Lượng Calo: N/A", res)
        self.assertIn("• Thành phần nguyên liệu: Không ghi chú", res)
        self.assertIn("• Cảnh báo dị ứng: Không có dị ứng phổ biến", res)
        self.assertIn("• Nhãn chế độ ăn: Không có nhãn đặc biệt", res)

    def test_03_null_and_empty_inputs(self):
        """Kiểm tra đầu vào None, dict rỗng, hoặc kiểu dữ liệu không hợp lệ."""
        self.assertEqual(serialize_menu_row(None), "")
        self.assertEqual(serialize_menu_row({}), "")
        self.assertEqual(serialize_menu_row("invalid string"), "")
        self.assertEqual(serialize_menu_row([]), "")

    def test_04_category_formats(self):
        """Kiểm tra các biến thể cấu trúc category (dict, string, categories, null)."""
        # 1. category dạng dict
        item1 = {"name": "Món A", "category": {"name": "Khai vị"}}
        self.assertIn("• Phân loại: Khai vị", serialize_menu_row(item1))

        # 2. category dạng string
        item2 = {"name": "Món B", "category": "Đồ uống"}
        self.assertIn("• Phân loại: Đồ uống", serialize_menu_row(item2))

        # 3. categories dạng dict (Supabase foreign key relation)
        item3 = {"name": "Món C", "categories": {"name": "Tráng miệng"}}
        self.assertIn("• Phân loại: Tráng miệng", serialize_menu_row(item3))

        # 4. category rỗng
        item4 = {"name": "Món D", "category": None}
        self.assertIn("• Phân loại: Khác", serialize_menu_row(item4))

    def test_05_price_formatting(self):
        """Kiểm tra các định dạng giá tiền khác nhau (int, float, string, None)."""
        self.assertIn("• Giá bán: 120,000 VND", serialize_menu_row({"name": "A", "price": 120000}))
        self.assertIn("• Giá bán: 95,000 VND", serialize_menu_row({"name": "B", "price": 95000.0}))
        self.assertIn("• Giá bán: 45,000 VND", serialize_menu_row({"name": "C", "price": "45000"}))
        self.assertIn("• Giá bán: Liên hệ", serialize_menu_row({"name": "D", "price": None}))

    def test_06_spice_level_and_calories(self):
        """Kiểm tra xử lý spice_level và calories."""
        # Độ cay cấp 4
        item = {"name": "Lẩu Thái Siêu Cay", "spice_level": 4, "calories": 650}
        res = serialize_menu_row(item)
        self.assertIn("• Độ cay: 4/5", res)
        self.assertIn("• Lượng Calo: 650 kcal", res)

        # Độ cay 0
        item0 = {"name": "Canh Chua", "spice_level": 0}
        self.assertIn("• Độ cay: 0/5", serialize_menu_row(item0))

    def test_07_allergens_and_dietary_tags(self):
        """Kiểm tra danh sách dị ứng và nhãn ăn kiêng đa phần tử."""
        item = {
            "name": "Chả Giò Hải Sản",
            "allergens": ["Tôm", "Cua", "Đậu phộng"],
            "dietary_tags": ["ăn mặn", "không phù hợp cho người dị ứng hải sản"],
        }
        res = serialize_menu_row(item)
        self.assertIn("• Cảnh báo dị ứng: Tôm, Cua, Đậu phộng", res)
        self.assertIn("• Nhãn chế độ ăn: ăn mặn, không phù hợp cho người dị ứng hải sản", res)

    def test_08_alias_function(self):
        """Đảm bảo serialize_menu_item và serialize_menu_row cho kết quả đồng nhất."""
        item = {"name": "Cơm Tấm Sườn Bì Chả", "price": 60000}
        self.assertEqual(serialize_menu_item(item), serialize_menu_row(item))

    def test_09_vietnamese_unicode_integrity(self):
        """Đảm bảo dấu tiếng Việt được bảo toàn trọn vẹn, không bị lỗi font hay escape unicode."""
        sample_name = "Gà Nướng Cơm Lam Đặc Sản Tây Nguyên Ớt Xiêm Xanh"
        item = {"name": sample_name, "description": "Hương vị cay nồng, thơm ngát lá é và muối hột."}
        res = serialize_menu_row(item)
        self.assertIn(sample_name, res)
        self.assertIn("Hương vị cay nồng, thơm ngát lá é và muối hột.", res)

    def test_10_policy_serialization(self):
        """Kiểm tra tuần tự hóa chính sách nhà hàng (voucher, refund, booking...)."""
        policy = {
            "policy_type": "voucher",
            "title": "Chính sách áp dụng mã giảm giá & Voucher",
            "content": "Mỗi hóa đơn chỉ áp dụng tối đa 01 mã voucher giảm giá.",
            "is_active": True,
        }
        res = serialize_restaurant_policy(policy)

        self.assertIn("[CHÍNH SÁCH NHÀ HÀNG: Chính sách áp dụng mã giảm giá & Voucher]", res)
        self.assertIn("• Phân loại quy định: Khuyến mãi & Mã giảm giá (voucher)", res)
        self.assertIn("• Trạng thái: Đang áp dụng", res)
        self.assertIn("• Nội dung điều khoản: Mỗi hóa đơn chỉ áp dụng tối đa 01 mã voucher giảm giá.", res)

    def test_11_policy_inactive_and_custom_type(self):
        """Kiểm tra chính sách tạm ngưng hiệu lực và loại chính sách tùy biến."""
        policy = {
            "policy_type": "refund",
            "title": "Quy định đổi trả món",
            "content": "Đổi món trong 15 phút nếu có lỗi.",
            "is_active": False,
        }
        res = serialize_restaurant_policy(policy)
        self.assertIn("• Phân loại quy định: Đổi trả món & Hoàn tiền (refund)", res)
        self.assertIn("• Trạng thái: Tạm ngưng hiệu lực", res)

    def test_12_policy_null_safety(self):
        """Kiểm tra an toàn dữ liệu rỗng cho hàm chính sách."""
        self.assertEqual(serialize_restaurant_policy(None), "")
        self.assertEqual(serialize_restaurant_policy({}), "")
        self.assertEqual(serialize_restaurant_policy("invalid"), "")


if __name__ == "__main__":
    unittest.main()
