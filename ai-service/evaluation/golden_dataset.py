"""
evaluation/golden_dataset.py
Tập dữ liệu chuẩn mực (Golden Benchmark Dataset) gồm 100 câu hỏi test thực nghiệm
cho 5 nhóm khách hàng trọng tâm của nhà hàng thông minh SmartRestaurant.
Tuân thủ tiêu chuẩn thẩm định khoa học của Paper 01 (IIT Roorkee, 2025 - Mục 4.1).
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class UserGroup(str, Enum):
    FAMILY_ELDERLY = "family_and_elderly"        # Gia đình có trẻ nhỏ & người già (Không cay, thanh đạm, mềm)
    OFFICE_LUNCH = "office_lunch"                # Dân văn phòng ăn trưa nhanh (Ngân sách < 70k, nhanh, đủ no)
    DIETARY_ALLERGEN = "dietary_and_allergen"    # Ăn kiêng & dị ứng thực phẩm (Chay, kiêng hải sản, đậu phộng)
    FRIENDS_GATHERING = "friends_gathering"      # Bạn bè liên hoan / khách nhậu (Món nhậu, lẩu, chia sẻ phần lớn)
    COUPLES_DATE = "couples_date"                # Cặp đôi hẹn hò (Món tinh tế, tráng miệng, thức uống đẹp mắt)


class BenchmarkCase(BaseModel):
    id: str = Field(..., description="Mã định danh test case (tc_001 -> tc_100)")
    user_group: UserGroup = Field(..., description="Nhóm khách hàng đại diện")
    query: str = Field(..., description="Câu hỏi tiếng Việt tự nhiên của thực khách")
    expected_constraints: Dict[str, Any] = Field(
        default_factory=dict,
        description="Ràng buộc cứng: allergens, max_spice, max_budget, vegetarian"
    )
    expected_dishes: List[str] = Field(
        default_factory=list,
        description="Các món ăn nên được gợi ý (ground truth)"
    )
    forbidden_dishes: List[str] = Field(
        default_factory=list,
        description="Các món tuyệt đối không được xuất hiện (vi phạm dị ứng, cay, ngân sách)"
    )
    description: str = Field("", description="Mục đích và tình huống thực tế của test case")


# Danh sách 100 Test Cases
GOLDEN_BENCHMARK_DATASET: List[BenchmarkCase] = [
    # =========================================================================
    # NHÓM 1: GIA ĐÌNH CÓ TRẺ NHỎ & NGƯỜI CAO TUỔI (20 test cases: tc_001 -> tc_020)
    # Ràng buộc: Không cay (max_spice=0), thanh đạm, mềm dễ nhai, không dầu mỡ
    # =========================================================================
    BenchmarkCase(
        id="tc_001", user_group=UserGroup.FAMILY_ELDERLY,
        query="Bàn mình có em bé 4 tuổi, gợi ý món nào thanh đạm, không cay hoàn toàn nhé",
        expected_constraints={"max_spice": 0, "allergens": []},
        expected_dishes=["Bánh Flan", "Canh Cua Rau Đay"],
        forbidden_dishes=["Bún Bò Huế"],
        description="Trẻ em ăn món thanh, hoàn toàn không cay"
    ),
    BenchmarkCase(
        id="tc_002", user_group=UserGroup.FAMILY_ELDERLY,
        query="Ông bà mình thích món nước nóng sốt, mềm dễ ăn và không cay",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Phở Bò Tái Nạm", "Bún Mọc"],
        forbidden_dishes=["Bún Bò Huế"],
        description="Người già thích món nước mềm, không cay"
    ),
    BenchmarkCase(
        id="tc_003", user_group=UserGroup.FAMILY_ELDERLY,
        query="Gợi ý món tráng miệng ngọt dịu cho bé ăn sau bữa trưa",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Bánh Flan"],
        forbidden_dishes=[],
        description="Tráng miệng cho trẻ em"
    ),
    BenchmarkCase(
        id="tc_004", user_group=UserGroup.FAMILY_ELDERLY,
        query="Có món canh nào giải nhiệt mùa hè cho cả nhà có trẻ con không?",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Canh Cua Rau Đay"],
        forbidden_dishes=[],
        description="Canh giải nhiệt gia đình"
    ),
    BenchmarkCase(
        id="tc_005", user_group=UserGroup.FAMILY_ELDERLY,
        query="Nhà mình đi 4 người có người già và trẻ con, tư vấn món không cay, dễ tiêu hóa",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Phở Bò Tái Nạm", "Bánh Flan"],
        forbidden_dishes=["Bún Bò Huế"],
        description="Thực đơn gia đình 4 người không cay"
    ),
    BenchmarkCase(
        id="tc_006", user_group=UserGroup.FAMILY_ELDERLY,
        query="Món nào ít dầu mỡ, luộc hoặc hấp cho người huyết áp cao?",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Gỏi Cuốn Tôm Thịt"],
        forbidden_dishes=[],
        description="Ít dầu mỡ cho người cao tuổi"
    ),
    BenchmarkCase(
        id="tc_007", user_group=UserGroup.FAMILY_ELDERLY,
        query="Bé nhà mình thích ăn đồ ngọt, có món nào lành bụng không?",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Bánh Flan"],
        forbidden_dishes=[],
        description="Món ngọt mềm an toàn cho trẻ nhỏ"
    ),
    BenchmarkCase(
        id="tc_008", user_group=UserGroup.FAMILY_ELDERLY,
        query="Mẹ mình răng yếu, cần món mềm và nước dùng ngọt thanh",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Phở Bò Tái Nạm"],
        forbidden_dishes=["Bún Bò Huế"],
        description="Răng yếu cần thức ăn mềm, ngọt thanh"
    ),
    BenchmarkCase(
        id="tc_009", user_group=UserGroup.FAMILY_ELDERLY,
        query="Tìm món ăn sáng cho gia đình, không ăn cay được đâu nhé",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Phở Bò Tái Nạm", "Bún Chả Hà Nội"],
        forbidden_dishes=["Bún Bò Huế"],
        description="Ăn sáng gia đình không cay"
    ),
    BenchmarkCase(
        id="tc_010", user_group=UserGroup.FAMILY_ELDERLY,
        query="Có món gì có rau củ thanh mát cho trẻ nhỏ lười ăn rau không?",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Canh Cua Rau Đay"],
        forbidden_dishes=[],
        description="Rau củ thanh mát cho trẻ nhỏ"
    ),
    BenchmarkCase(
        id="tc_011", user_group=UserGroup.FAMILY_ELDERLY,
        query="Trời lạnh muốn ăn tô bún phở nóng hổi nhưng không cho ớt hay sa tế",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Phở Bò Tái Nạm"],
        forbidden_dishes=["Bún Bò Huế"],
        description="Món nước nóng không sa tế"
    ),
    BenchmarkCase(
        id="tc_012", user_group=UserGroup.FAMILY_ELDERLY,
        query="Bữa trưa gia đình ấm cúng, có món canh và món mặn nào hợp nhau?",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Canh Cua Rau Đay", "Cơm Tấm Sườn Bì Chả"],
        forbidden_dishes=[],
        description="Mâm cơm gia đình canh mặn"
    ),
    BenchmarkCase(
        id="tc_013", user_group=UserGroup.FAMILY_ELDERLY,
        query="Em bé uống được loại nước ép hoặc sinh tố nào không ngọt gắt?",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Trà Đào Cam Sả"],
        forbidden_dishes=[],
        description="Đồ uống cho trẻ nhỏ"
    ),
    BenchmarkCase(
        id="tc_014", user_group=UserGroup.FAMILY_ELDERLY,
        query="Gợi ý món ăn nhẹ giữa buổi cho người cao tuổi",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Bánh Flan"],
        forbidden_dishes=[],
        description="Ăn nhẹ giữa buổi người cao tuổi"
    ),
    BenchmarkCase(
        id="tc_015", user_group=UserGroup.FAMILY_ELDERLY,
        query="Nhà có 2 người lớn và 1 bé 5 tuổi, tổng tiền khoảng 200k ăn món gì?",
        expected_constraints={"max_budget": 200000, "max_spice": 0},
        expected_dishes=["Phở Bò Tái Nạm", "Bánh Flan"],
        forbidden_dishes=[],
        description="Gia đình ngân sách 200k"
    ),
    BenchmarkCase(
        id="tc_016", user_group=UserGroup.FAMILY_ELDERLY,
        query="Người già ăn tối muốn ăn nhẹ bụng để ngủ ngon, không cay",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Canh Cua Rau Đay", "Phở Bò Tái Nạm"],
        forbidden_dishes=["Bún Bò Huế"],
        description="Ăn tối nhẹ bụng người già"
    ),
    BenchmarkCase(
        id="tc_017", user_group=UserGroup.FAMILY_ELDERLY,
        query="Trẻ con thích ăn cơm sườn, quán có cơm sườn mềm không?",
        expected_constraints={},
        expected_dishes=["Cơm Tấm Sườn Bì Chả"],
        forbidden_dishes=[],
        description="Cơm sườn cho trẻ nhỏ"
    ),
    BenchmarkCase(
        id="tc_018", user_group=UserGroup.FAMILY_ELDERLY,
        query="Gợi ý món cuốn thanh mát nhiều rau xanh cho cả nhà",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Gỏi Cuốn Tôm Thịt"],
        forbidden_dishes=[],
        description="Món cuốn rau xanh gia đình"
    ),
    BenchmarkCase(
        id="tc_019", user_group=UserGroup.FAMILY_ELDERLY,
        query="Người nhà mới ốm dậy, cần món cháo hoặc súp bồi bổ sức khỏe",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Phở Bò Tái Nạm"],
        forbidden_dishes=["Bún Bò Huế"],
        description="Hồi phục sức khỏe sau ốm"
    ),
    BenchmarkCase(
        id="tc_020", user_group=UserGroup.FAMILY_ELDERLY,
        query="Tất cả các món nhà mình gọi đều không được cay nhé, kiểm tra giúp mình",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Phở Bò Tái Nạm", "Canh Cua Rau Đay"],
        forbidden_dishes=["Bún Bò Huế"],
        description="Yêu cầu tuyệt đối không cay cho bàn tiệc"
    ),

    # =========================================================================
    # NHÓM 2: DÂN VĂN PHÒNG ĂN TRƯA NHANH (20 test cases: tc_021 -> tc_040)
    # Ràng buộc: Ngân sách rõ ràng (dưới 70k, 80k), phục vụ nhanh, no lâu
    # =========================================================================
    BenchmarkCase(
        id="tc_021", user_group=UserGroup.OFFICE_LUNCH,
        query="Bữa trưa văn phòng dưới 70k, ăn no và ra món nhanh",
        expected_constraints={"max_budget": 70000},
        expected_dishes=["Bún Chả Hà Nội", "Cơm Tấm Sườn Bì Chả"],
        forbidden_dishes=[],
        description="Ăn trưa nhanh ngân sách dưới 70k"
    ),
    BenchmarkCase(
        id="tc_022", user_group=UserGroup.OFFICE_LUNCH,
        query="Có món cơm nào chắc dạ giá dưới 80 nghìn không?",
        expected_constraints={"max_budget": 80000},
        expected_dishes=["Cơm Tấm Sườn Bì Chả"],
        forbidden_dishes=[],
        description="Cơm no lâu dưới 80k"
    ),
    BenchmarkCase(
        id="tc_023", user_group=UserGroup.OFFICE_LUNCH,
        query="Ăn trưa nhanh 1 người, ngân sách 50k",
        expected_constraints={"max_budget": 50000},
        expected_dishes=["Gỏi Cuốn Tôm Thịt", "Bánh Flan"],
        forbidden_dishes=["Bún Bò Huế", "Phở Bò Tái Nạm"],
        description="Bữa trưa tiết kiệm dưới 50k"
    ),
    BenchmarkCase(
        id="tc_024", user_group=UserGroup.OFFICE_LUNCH,
        query="Combo ăn trưa kèm đồ uống dưới 100k cho dân công sở",
        expected_constraints={"max_budget": 100000},
        expected_dishes=["Cơm Tấm Sườn Bì Chả", "Trà Đào Cam Sả"],
        forbidden_dishes=[],
        description="Combo cơm và nước dưới 100k"
    ),
    BenchmarkCase(
        id="tc_025", user_group=UserGroup.OFFICE_LUNCH,
        query="Trưa nay vội quá, món nào làm trong vòng 10-15 phút?",
        expected_constraints={},
        expected_dishes=["Bún Chả Hà Nội", "Phở Bò Tái Nạm"],
        forbidden_dishes=[],
        description="Ra món siêu tốc cho dân văn phòng"
    ),
    BenchmarkCase(
        id="tc_026", user_group=UserGroup.OFFICE_LUNCH,
        query="Trưa ăn bún gì đậm đà chống ngấy giá tầm 60k - 70k?",
        expected_constraints={"max_budget": 70000},
        expected_dishes=["Bún Chả Hà Nội", "Bún Bò Huế"],
        forbidden_dishes=[],
        description="Bún đậm đà tầm 70k"
    ),
    BenchmarkCase(
        id="tc_027", user_group=UserGroup.OFFICE_LUNCH,
        query="Hôm nay trời mưa mát mẻ, văn phòng mình muốn ăn món bún nóng hổi",
        expected_constraints={},
        expected_dishes=["Bún Bò Huế", "Phở Bò Tái Nạm"],
        forbidden_dishes=[],
        description="Món nước ngày mưa mát"
    ),
    BenchmarkCase(
        id="tc_028", user_group=UserGroup.OFFICE_LUNCH,
        query="Nhóm văn phòng 3 người, mỗi người khoảng 70k thì gọi những món gì?",
        expected_constraints={"max_budget": 210000},
        expected_dishes=["Cơm Tấm Sườn Bì Chả", "Bún Chả Hà Nội", "Bún Bò Huế"],
        forbidden_dishes=[],
        description="Nhóm 3 người văn phòng"
    ),
    BenchmarkCase(
        id="tc_029", user_group=UserGroup.OFFICE_LUNCH,
        query="Cần suất ăn trưa nhiều đạm, nhiều thịt nướng",
        expected_constraints={},
        expected_dishes=["Bún Chả Hà Nội", "Cơm Tấm Sườn Bì Chả"],
        forbidden_dishes=[],
        description="Giàu đạm thịt nướng"
    ),
    BenchmarkCase(
        id="tc_030", user_group=UserGroup.OFFICE_LUNCH,
        query="Đang buồn ngủ quá, có món đồ uống nào tỉnh táo làm việc chiều?",
        expected_constraints={},
        expected_dishes=["Trà Đào Cam Sả"],
        forbidden_dishes=[],
        description="Đồ uống tỉnh táo buổi chiều"
    ),
    BenchmarkCase(
        id="tc_031", user_group=UserGroup.OFFICE_LUNCH,
        query="Món bún chả bao nhiêu tiền một phần?",
        expected_constraints={},
        expected_dishes=["Bún Chả Hà Nội"],
        forbidden_dishes=[],
        description="Hỏi giá bún chả"
    ),
    BenchmarkCase(
        id="tc_032", user_group=UserGroup.OFFICE_LUNCH,
        query="Cơm tấm sườn bì chả ở đây giá bao nhiêu?",
        expected_constraints={},
        expected_dishes=["Cơm Tấm Sườn Bì Chả"],
        forbidden_dishes=[],
        description="Hỏi giá cơm tấm"
    ),
    BenchmarkCase(
        id="tc_033", user_group=UserGroup.OFFICE_LUNCH,
        query="Ăn trưa nhanh gọn không bị dính mùi quần áo",
        expected_constraints={},
        expected_dishes=["Cơm Tấm Sườn Bì Chả", "Gỏi Cuốn Tôm Thịt"],
        forbidden_dishes=[],
        description="Gọn gàng sạch sẽ cho công sở"
    ),
    BenchmarkCase(
        id="tc_034", user_group=UserGroup.OFFICE_LUNCH,
        query="Có món nào dưới 30k để ăn phụ không?",
        expected_constraints={"max_budget": 30000},
        expected_dishes=["Bánh Flan"],
        forbidden_dishes=["Bún Bò Huế", "Phở Bò Tái Nạm"],
        description="Món ăn phụ dưới 30k"
    ),
    BenchmarkCase(
        id="tc_035", user_group=UserGroup.OFFICE_LUNCH,
        query="Trưa nay muốn ăn thanh mát nhiều rau xanh, giá dưới 80k",
        expected_constraints={"max_budget": 80000},
        expected_dishes=["Bún Chả Hà Nội", "Gỏi Cuốn Tôm Thịt"],
        forbidden_dishes=[],
        description="Nhiều rau xanh thanh mát"
    ),
    BenchmarkCase(
        id="tc_036", user_group=UserGroup.OFFICE_LUNCH,
        query="Tư vấn suất ăn trưa đầy đủ tinh bột, thịt và rau cho nam giới",
        expected_constraints={},
        expected_dishes=["Cơm Tấm Sườn Bì Chả", "Bún Chả Hà Nội"],
        forbidden_dishes=[],
        description="Dinh dưỡng cân bằng no lâu"
    ),
    BenchmarkCase(
        id="tc_037", user_group=UserGroup.OFFICE_LUNCH,
        query="Mình chỉ có 75k thôi, ăn được món nước gì ngon nhất?",
        expected_constraints={"max_budget": 75000},
        expected_dishes=["Phở Bò Tái Nạm", "Bún Bò Huế"],
        forbidden_dishes=[],
        description="Món nước ngon dưới 75k"
    ),
    BenchmarkCase(
        id="tc_038", user_group=UserGroup.OFFICE_LUNCH,
        query="Ăn trưa xong muốn mua thêm 1 tráng miệng, tổng dưới 90k",
        expected_constraints={"max_budget": 90000},
        expected_dishes=["Bún Chả Hà Nội", "Bánh Flan"],
        forbidden_dishes=[],
        description="Món chính + tráng miệng dưới 90k"
    ),
    BenchmarkCase(
        id="tc_039", user_group=UserGroup.OFFICE_LUNCH,
        query="Thời gian chuẩn bị món cơm sườn mất bao lâu?",
        expected_constraints={},
        expected_dishes=["Cơm Tấm Sườn Bì Chả"],
        forbidden_dishes=[],
        description="Thời gian phục vụ món cơm"
    ),
    BenchmarkCase(
        id="tc_040", user_group=UserGroup.OFFICE_LUNCH,
        query="Một người ăn trưa bình dân ở quán thì nên chọn món nào?",
        expected_constraints={"max_budget": 70000},
        expected_dishes=["Bún Chả Hà Nội", "Cơm Tấm Sườn Bì Chả"],
        forbidden_dishes=[],
        description="Gợi ý ăn trưa bình dân"
    ),

    # =========================================================================
    # NHÓM 3: NGƯỜI KIÊNG KHEM & DỊ ỨNG THỰC PHẨM (20 test cases: tc_041 -> tc_060)
    # Ràng buộc: Dị ứng hải sản/tôm/cua, ăn chay/vegan, kiêng thịt bò, kiêng cay
    # =========================================================================
    BenchmarkCase(
        id="tc_041", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Tôi bị dị ứng tôm và cua nặng, tuyệt đối không được có tôm cua",
        expected_constraints={"allergens": ["tôm", "cua"]},
        expected_dishes=["Phở Bò Tái Nạm", "Bún Chả Hà Nội"],
        forbidden_dishes=["Canh Cua Rau Đay", "Gỏi Cuốn Tôm Thịt"],
        description="Dị ứng tôm và cua tuyệt đối"
    ),
    BenchmarkCase(
        id="tc_042", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Tôi không ăn được thịt bò vì lý do tôn giáo, gợi ý món heo hoặc gà",
        expected_constraints={"allergens": ["bò"]},
        expected_dishes=["Bún Chả Hà Nội", "Cơm Tấm Sườn Bì Chả"],
        forbidden_dishes=["Phở Bò Tái Nạm", "Bún Bò Huế"],
        description="Kiêng thịt bò tôn giáo"
    ),
    BenchmarkCase(
        id="tc_043", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Hôm nay mùng một mình ăn chay, quán có món chay nào không?",
        expected_constraints={"vegetarian": True},
        expected_dishes=["Bánh Flan"],
        forbidden_dishes=["Phở Bò Tái Nạm", "Bún Bò Huế", "Cơm Tấm Sườn Bì Chả"],
        description="Ăn chay ngày mùng một"
    ),
    BenchmarkCase(
        id="tc_044", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Tôi dị ứng lạc đậu phộng, món nào không rắc đậu phộng?",
        expected_constraints={"allergens": ["đậu phộng", "lạc"]},
        expected_dishes=["Phở Bò Tái Nạm"],
        forbidden_dishes=[],
        description="Dị ứng đậu phộng"
    ),
    BenchmarkCase(
        id="tc_045", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Tôi không ăn được hải sản, gợi ý món thịt heo",
        expected_constraints={"allergens": ["hải sản"]},
        expected_dishes=["Bún Chả Hà Nội", "Cơm Tấm Sườn Bì Chả"],
        forbidden_dishes=["Canh Cua Rau Đay", "Gỏi Cuốn Tôm Thịt"],
        description="Kiêng toàn bộ hải sản"
    ),
    BenchmarkCase(
        id="tc_046", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Đang ăn chế độ keto giảm tinh bột, có món cuốn nào nhiều thịt rau ít bún?",
        expected_constraints={},
        expected_dishes=["Gỏi Cuốn Tôm Thịt"],
        forbidden_dishes=[],
        description="Keto ít tinh bột"
    ),
    BenchmarkCase(
        id="tc_047", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Dị ứng trứng gà vịt, món nào không có trứng?",
        expected_constraints={"allergens": ["trứng"]},
        expected_dishes=["Phở Bò Tái Nạm", "Bún Chả Hà Nội"],
        forbidden_dishes=["Bánh Flan"],
        description="Dị ứng trứng gia cầm"
    ),
    BenchmarkCase(
        id="tc_048", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Tôi bị đau dạ dày không ăn được cay, món nào lành tính nhất?",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Phở Bò Tái Nạm", "Canh Cua Rau Đay"],
        forbidden_dishes=["Bún Bò Huế"],
        description="Đau dạ dày kiêng cay tuyệt đối"
    ),
    BenchmarkCase(
        id="tc_049", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Bị dị ứng tôm nhưng thích ăn món cuốn, có gỏi cuốn nào không có tôm không?",
        expected_constraints={"allergens": ["tôm"]},
        expected_dishes=["Bún Chả Hà Nội"],
        forbidden_dishes=["Gỏi Cuốn Tôm Thịt"],
        description="Dị ứng tôm loại bỏ gỏi cuốn tôm"
    ),
    BenchmarkCase(
        id="tc_050", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Món canh cua rau đay có cua đồng không, mình dị ứng giáp xác",
        expected_constraints={"allergens": ["cua"]},
        expected_dishes=["Phở Bò Tái Nạm"],
        forbidden_dishes=["Canh Cua Rau Đay"],
        description="Hỏi thành phần canh cua khi dị ứng giáp xác"
    ),
    BenchmarkCase(
        id="tc_051", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Mình ăn chay thanh tịnh, tư vấn đồ uống và tráng miệng",
        expected_constraints={"vegetarian": True},
        expected_dishes=["Trà Đào Cam Sả", "Bánh Flan"],
        forbidden_dishes=[],
        description="Ăn chay tráng miệng đồ uống"
    ),
    BenchmarkCase(
        id="tc_052", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Kiêng mỡ heo và bì heo, cơm tấm có thể đổi thịt khác không?",
        expected_constraints={},
        expected_dishes=["Phở Bò Tái Nạm"],
        forbidden_dishes=[],
        description="Kiêng mỡ và bì heo"
    ),
    BenchmarkCase(
        id="tc_053", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Không ăn được đồ ngọt do tiểu đường, trà đào có làm không đường được không?",
        expected_constraints={},
        expected_dishes=["Trà Đào Cam Sả"],
        forbidden_dishes=[],
        description="Tiểu đường kiêng đường"
    ),
    BenchmarkCase(
        id="tc_054", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Dị ứng hải sản thì có ăn được bún bò huế không?",
        expected_constraints={"allergens": ["hải sản"]},
        expected_dishes=["Bún Bò Huế"],
        forbidden_dishes=["Canh Cua Rau Đay"],
        description="Kiểm tra thành phần bún bò với dị ứng hải sản"
    ),
    BenchmarkCase(
        id="tc_055", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Tư vấn món hoàn toàn không chứa sữa bò và lactose",
        expected_constraints={"allergens": ["sữa"]},
        expected_dishes=["Phở Bò Tái Nạm", "Bún Chả Hà Nội"],
        forbidden_dishes=["Bánh Flan"],
        description="Không dung nạp lactose / sữa bò"
    ),
    BenchmarkCase(
        id="tc_056", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Mình ăn kiêng gluten, có món bún gạo nào an toàn?",
        expected_constraints={},
        expected_dishes=["Phở Bò Tái Nạm", "Bún Chả Hà Nội"],
        forbidden_dishes=[],
        description="Gluten-free bún phở gạo"
    ),
    BenchmarkCase(
        id="tc_057", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Người đang giảm cân cần món ít calo nhất quán",
        expected_constraints={},
        expected_dishes=["Gỏi Cuốn Tôm Thịt", "Canh Cua Rau Đay"],
        forbidden_dishes=["Cơm Tấm Sườn Bì Chả"],
        description="Giảm cân ít calo"
    ),
    BenchmarkCase(
        id="tc_058", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Dị ứng cua nhưng ăn được tôm thì nên chọn món nào?",
        expected_constraints={"allergens": ["cua"]},
        expected_dishes=["Gỏi Cuốn Tôm Thịt"],
        forbidden_dishes=["Canh Cua Rau Đay"],
        description="Dị ứng cua nhưng ăn được tôm"
    ),
    BenchmarkCase(
        id="tc_059", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Món nào không dùng bột ngọt (mì chính)?",
        expected_constraints={},
        expected_dishes=["Canh Cua Rau Đay", "Bánh Flan"],
        forbidden_dishes=[],
        description="Không dùng bột ngọt"
    ),
    BenchmarkCase(
        id="tc_060", user_group=UserGroup.DIETARY_ALLERGEN,
        query="Vừa kiêng thịt bò vừa không ăn cay, gọi món gì an toàn?",
        expected_constraints={"allergens": ["bò"], "max_spice": 0},
        expected_dishes=["Bún Chả Hà Nội", "Canh Cua Rau Đay"],
        forbidden_dishes=["Phở Bò Tái Nạm", "Bún Bò Huế"],
        description="Ràng buộc kép: kiêng bò và kiêng cay"
    ),

    # =========================================================================
    # NHÓM 4: BẠN BÈ LIÊN HOAN / KHÁCH NHẬU (20 test cases: tc_061 -> tc_080)
    # Ràng buộc: Món đậm đà, cay nồng, ăn nhậu, phần lớn chia sẻ, nước giải khát
    # =========================================================================
    BenchmarkCase(
        id="tc_061", user_group=UserGroup.FRIENDS_GATHERING,
        query="Nhóm bạn nhậu muốn ăn món cay nồng đậm vị để lai rai",
        expected_constraints={},
        expected_dishes=["Bún Bò Huế"],
        forbidden_dishes=[],
        description="Món đậm đà cay nồng cho nhóm nhậu"
    ),
    BenchmarkCase(
        id="tc_062", user_group=UserGroup.FRIENDS_GATHERING,
        query="Bàn nhậu 5 người muốn gọi món khai vị cuốn chấm lai rai",
        expected_constraints={},
        expected_dishes=["Gỏi Cuốn Tôm Thịt"],
        forbidden_dishes=[],
        description="Khai vị cuốn cho bàn đông"
    ),
    BenchmarkCase(
        id="tc_063", user_group=UserGroup.FRIENDS_GATHERING,
        query="Có món thịt nướng than hoa nào ăn nhậu đậm đà không?",
        expected_constraints={},
        expected_dishes=["Bún Chả Hà Nội", "Cơm Tấm Sườn Bì Chả"],
        forbidden_dishes=[],
        description="Thịt nướng nhắm bia"
    ),
    BenchmarkCase(
        id="tc_064", user_group=UserGroup.FRIENDS_GATHERING,
        query="Tụi mình đi 6 người, tư vấn set món ăn no và hợp nhậu",
        expected_constraints={},
        expected_dishes=["Bún Chả Hà Nội", "Bún Bò Huế", "Gỏi Cuốn Tôm Thịt"],
        forbidden_dishes=[],
        description="Set món cho nhóm 6 người"
    ),
    BenchmarkCase(
        id="tc_065", user_group=UserGroup.FRIENDS_GATHERING,
        query="Món bún bò huế ở đây có cay nhiều không, cho thêm ớt sa tế được không?",
        expected_constraints={},
        expected_dishes=["Bún Bò Huế"],
        forbidden_dishes=[],
        description="Hỏi độ cay bún bò"
    ),
    BenchmarkCase(
        id="tc_066", user_group=UserGroup.FRIENDS_GATHERING,
        query="Sau khi nhậu muốn ăn một tô nước dùng chua cay nóng giải rượu",
        expected_constraints={},
        expected_dishes=["Bún Bò Huế"],
        forbidden_dishes=[],
        description="Món nước giải rượu sau nhậu"
    ),
    BenchmarkCase(
        id="tc_067", user_group=UserGroup.FRIENDS_GATHERING,
        query="Bàn tụi mình thích ăn thịt bò tái, có món phở hay bún nào nhiều bò?",
        expected_constraints={},
        expected_dishes=["Phở Bò Tái Nạm", "Bún Bò Huế"],
        forbidden_dishes=[],
        description="Thịt bò tái cho nhóm bạn"
    ),
    BenchmarkCase(
        id="tc_068", user_group=UserGroup.FRIENDS_GATHERING,
        query="Nhóm bạn muốn gọi vài ly nước thanh nhiệt sau khi ăn đồ cay nóng",
        expected_constraints={},
        expected_dishes=["Trà Đào Cam Sả"],
        forbidden_dishes=[],
        description="Nước thanh nhiệt sau đồ cay"
    ),
    BenchmarkCase(
        id="tc_069", user_group=UserGroup.FRIENDS_GATHERING,
        query="Có món gì ăn bốc tay nhanh hoặc cuốn chấm không cần dùng đũa nhiều?",
        expected_constraints={},
        expected_dishes=["Gỏi Cuốn Tôm Thịt"],
        forbidden_dishes=[],
        description="Món ăn chơi cuốn chấm"
    ),
    BenchmarkCase(
        id="tc_070", user_group=UserGroup.FRIENDS_GATHERING,
        query="Gợi ý món ăn kèm với cơm tấm cho nhóm đông người chia sẻ",
        expected_constraints={},
        expected_dishes=["Cơm Tấm Sườn Bì Chả", "Canh Cua Rau Đay"],
        forbidden_dishes=[],
        description="Chia sẻ phần ăn nhóm đông"
    ),
    BenchmarkCase(
        id="tc_071", user_group=UserGroup.FRIENDS_GATHERING,
        query="Bàn 4 người ăn nhậu hết khoảng bao nhiêu tiền?",
        expected_constraints={},
        expected_dishes=["Bún Chả Hà Nội", "Bún Bò Huế"],
        forbidden_dishes=[],
        description="Dự trù kinh phí bàn 4 người"
    ),
    BenchmarkCase(
        id="tc_072", user_group=UserGroup.FRIENDS_GATHERING,
        query="Món nào là đặc sản nổi tiếng nhất của quán để bạn bè phương xa thử?",
        expected_constraints={},
        expected_dishes=["Phở Bò Tái Nạm", "Bún Chả Hà Nội"],
        forbidden_dishes=[],
        description="Đặc sản đãi bạn phương xa"
    ),
    BenchmarkCase(
        id="tc_073", user_group=UserGroup.FRIENDS_GATHERING,
        query="Muốn ăn món gì có chả nướng và nước mắm chua ngọt chuẩn vị",
        expected_constraints={},
        expected_dishes=["Bún Chả Hà Nội"],
        forbidden_dishes=[],
        description="Món chả nướng mắm chua ngọt"
    ),
    BenchmarkCase(
        id="tc_074", user_group=UserGroup.FRIENDS_GATHERING,
        query="Bún bò huế ở đây có bắp bò và giò heo không?",
        expected_constraints={},
        expected_dishes=["Bún Bò Huế"],
        forbidden_dishes=[],
        description="Thành phần giò bắp bún bò"
    ),
    BenchmarkCase(
        id="tc_075", user_group=UserGroup.FRIENDS_GATHERING,
        query="Có khuyến mãi hay combo gì cho bàn tiệc sinh nhật không?",
        expected_constraints={},
        expected_dishes=[],
        forbidden_dishes=[],
        description="Chính sách bàn sinh nhật"
    ),
    BenchmarkCase(
        id="tc_076", user_group=UserGroup.FRIENDS_GATHERING,
        query="Muốn ăn món nào thật nhiều năng lượng để chuẩn bị đi đá bóng",
        expected_constraints={},
        expected_dishes=["Cơm Tấm Sườn Bì Chả", "Phở Bò Tái Nạm"],
        forbidden_dishes=[],
        description="Bữa ăn giàu thể lực"
    ),
    BenchmarkCase(
        id="tc_077", user_group=UserGroup.FRIENDS_GATHERING,
        query="Món sườn nướng cơm tấm có ướp mật ong không?",
        expected_constraints={},
        expected_dishes=["Cơm Tấm Sườn Bì Chả"],
        forbidden_dishes=[],
        description="Gia vị ướp sườn nướng"
    ),
    BenchmarkCase(
        id="tc_078", user_group=UserGroup.FRIENDS_GATHERING,
        query="Nhóm 8 người muốn ăn các món truyền thống 3 miền Bắc Trung Nam",
        expected_constraints={},
        expected_dishes=["Phở Bò Tái Nạm", "Bún Bò Huế", "Cơm Tấm Sườn Bì Chả"],
        forbidden_dishes=[],
        description="Ẩm thực 3 miền hội ngộ"
    ),
    BenchmarkCase(
        id="tc_079", user_group=UserGroup.FRIENDS_GATHERING,
        query="Quán có phục vụ bia hoặc rượu để uống cùng món nướng không?",
        expected_constraints={},
        expected_dishes=[],
        forbidden_dishes=[],
        description="Hỏi chính sách đồ uống có cồn"
    ),
    BenchmarkCase(
        id="tc_080", user_group=UserGroup.FRIENDS_GATHERING,
        query="Bàn mình ngồi nhậu lâu có bị tính phí giữ bàn không?",
        expected_constraints={},
        expected_dishes=[],
        forbidden_dishes=[],
        description="Hỏi chính sách giờ ngồi ăn"
    ),

    # =========================================================================
    # NHÓM 5: CẶP ĐÔI HẸN HÒ LÃNG MẠN (20 test cases: tc_081 -> tc_100)
    # Ràng buộc: Món tinh tế, thanh nhã, tráng miệng ngọt ngào, thức uống kèm
    # =========================================================================
    BenchmarkCase(
        id="tc_081", user_group=UserGroup.COUPLES_DATE,
        query="Mình và bạn gái đi hẹn hò, tư vấn set ăn 2 người nhẹ nhàng tinh tế",
        expected_constraints={},
        expected_dishes=["Gỏi Cuốn Tôm Thịt", "Phở Bò Tái Nạm", "Bánh Flan"],
        forbidden_dishes=[],
        description="Set hẹn hò 2 người tinh tế"
    ),
    BenchmarkCase(
        id="tc_082", user_group=UserGroup.COUPLES_DATE,
        query="Bạn gái mình thích đồ ngọt, có món tráng miệng nào ngon đẹp mắt?",
        expected_constraints={},
        expected_dishes=["Bánh Flan"],
        forbidden_dishes=[],
        description="Tráng miệng đẹp mắt cho bạn gái"
    ),
    BenchmarkCase(
        id="tc_083", user_group=UserGroup.COUPLES_DATE,
        query="Tư vấn 2 ly đồ uống hoa quả thơm mát cho cặp đôi",
        expected_constraints={},
        expected_dishes=["Trà Đào Cam Sả"],
        forbidden_dishes=[],
        description="Đồ uống cặp đôi"
    ),
    BenchmarkCase(
        id="tc_084", user_group=UserGroup.COUPLES_DATE,
        query="Muốn ăn món nước vị ngọt thanh, hình thức đẹp để chụp ảnh",
        expected_constraints={},
        expected_dishes=["Phở Bò Tái Nạm"],
        forbidden_dishes=[],
        description="Món nước ngọt thanh đẹp mắt"
    ),
    BenchmarkCase(
        id="tc_085", user_group=UserGroup.COUPLES_DATE,
        query="Bạn gái không thích ăn hành, phở bò có dặn không lấy hành được không?",
        expected_constraints={},
        expected_dishes=["Phở Bò Tái Nạm"],
        forbidden_dishes=[],
        description="Dặn không hành cho bạn gái"
    ),
    BenchmarkCase(
        id="tc_086", user_group=UserGroup.COUPLES_DATE,
        query="Cặp đôi ăn tối nhẹ nhàng tổng khoảng 150k",
        expected_constraints={"max_budget": 150000},
        expected_dishes=["Phở Bò Tái Nạm", "Bún Chả Hà Nội"],
        forbidden_dishes=[],
        description="Hẹn hò ngân sách 150k"
    ),
    BenchmarkCase(
        id="tc_087", user_group=UserGroup.COUPLES_DATE,
        query="Trà đào cam sả ở đây có thơm mùi sả tươi không bạn?",
        expected_constraints={},
        expected_dishes=["Trà Đào Cam Sả"],
        forbidden_dishes=[],
        description="Hương vị trà đào cam sả"
    ),
    BenchmarkCase(
        id="tc_088", user_group=UserGroup.COUPLES_DATE,
        query="Bánh flan ở quán có vị đắng của cà phê caramel không?",
        expected_constraints={},
        expected_dishes=["Bánh Flan"],
        forbidden_dishes=[],
        description="Chi tiết vị bánh flan"
    ),
    BenchmarkCase(
        id="tc_089", user_group=UserGroup.COUPLES_DATE,
        query="Gợi ý món ăn ít mùi tỏi ớt để tiện trò chuyện sau bữa ăn",
        expected_constraints={"max_spice": 0},
        expected_dishes=["Gỏi Cuốn Tôm Thịt", "Bánh Flan"],
        forbidden_dishes=["Bún Bò Huế"],
        description="Ít mùi gia vị nồng sau ăn"
    ),
    BenchmarkCase(
        id="tc_090", user_group=UserGroup.COUPLES_DATE,
        query="Mình muốn tạo bất ngờ cho bạn gái, quán có nến hoặc trang trí bàn không?",
        expected_constraints={},
        expected_dishes=[],
        forbidden_dishes=[],
        description="Dịch vụ trang trí lãng mạn"
    ),
    BenchmarkCase(
        id="tc_091", user_group=UserGroup.COUPLES_DATE,
        query="Món gỏi cuốn tôm thịt có mấy cuốn trong một đĩa?",
        expected_constraints={},
        expected_dishes=["Gỏi Cuốn Tôm Thịt"],
        forbidden_dishes=[],
        description="Định lượng phần gỏi cuốn"
    ),
    BenchmarkCase(
        id="tc_092", user_group=UserGroup.COUPLES_DATE,
        query="Tụi mình muốn ăn chung một phần lớn vừa no vừa vui",
        expected_constraints={},
        expected_dishes=["Cơm Tấm Sườn Bì Chả", "Bún Chả Hà Nội"],
        forbidden_dishes=[],
        description="Món ăn chia sẻ cặp đôi"
    ),
    BenchmarkCase(
        id="tc_093", user_group=UserGroup.COUPLES_DATE,
        query="Buổi tối mùa thu se lạnh, hẹn hò nên gọi 2 tô gì nóng sốt?",
        expected_constraints={},
        expected_dishes=["Phở Bò Tái Nạm", "Bún Bò Huế"],
        forbidden_dishes=[],
        description="Món nước hẹn hò trời lạnh"
    ),
    BenchmarkCase(
        id="tc_094", user_group=UserGroup.COUPLES_DATE,
        query="Bạn gái mình ăn rất ít, có món nào nhỏ nhắn thanh đạm không?",
        expected_constraints={},
        expected_dishes=["Gỏi Cuốn Tôm Thịt", "Bánh Flan"],
        forbidden_dishes=["Cơm Tấm Sườn Bì Chả"],
        description="Khẩu phần nhỏ cho nữ"
    ),
    BenchmarkCase(
        id="tc_095", user_group=UserGroup.COUPLES_DATE,
        query="Thực đơn ở đây có món nào mang phong cách ẩm thực Hà Nội không?",
        expected_constraints={},
        expected_dishes=["Bún Chả Hà Nội", "Phở Bò Tái Nạm"],
        forbidden_dishes=[],
        description="Phong vị ẩm thực Hà Nội"
    ),
    BenchmarkCase(
        id="tc_096", user_group=UserGroup.COUPLES_DATE,
        query="Hai người ăn tráng miệng bánh flan và uống trà đào hết bao nhiêu tiền?",
        expected_constraints={},
        expected_dishes=["Bánh Flan", "Trà Đào Cam Sả"],
        forbidden_dishes=[],
        description="Tính tiền tráng miệng cặp đôi"
    ),
    BenchmarkCase(
        id="tc_097", user_group=UserGroup.COUPLES_DATE,
        query="Quán có không gian góc bàn yên tĩnh cho 2 người không?",
        expected_constraints={},
        expected_dishes=[],
        forbidden_dishes=[],
        description="Không gian hẹn hò yên tĩnh"
    ),
    BenchmarkCase(
        id="tc_098", user_group=UserGroup.COUPLES_DATE,
        query="Món bún chả có nhiều rau sống và dưa góp ăn kèm không?",
        expected_constraints={},
        expected_dishes=["Bún Chả Hà Nội"],
        forbidden_dishes=[],
        description="Đồ chua rau sống ăn kèm"
    ),
    BenchmarkCase(
        id="tc_099", user_group=UserGroup.COUPLES_DATE,
        query="Tư vấn cho tụi mình 1 món mặn, 1 món cuốn và 1 tráng miệng",
        expected_constraints={},
        expected_dishes=["Phở Bò Tái Nạm", "Gỏi Cuốn Tôm Thịt", "Bánh Flan"],
        forbidden_dishes=[],
        description="Thực đơn 3 món hoàn chỉnh"
    ),
    BenchmarkCase(
        id="tc_100", user_group=UserGroup.COUPLES_DATE,
        query="Lần đầu tiên dẫn người yêu đến quán, món nào là 'chữ ký' đặc biệt nhất?",
        expected_constraints={},
        expected_dishes=["Phở Bò Tái Nạm", "Cơm Tấm Sườn Bì Chả"],
        forbidden_dishes=[],
        description="Món signature tạo ấn tượng đầu"
    )
]


def get_benchmark_by_group(group: Any) -> List[BenchmarkCase]:
    """Lấy danh sách test case theo nhóm khách hàng (UserGroup enum hoặc string)."""
    target = group.value if hasattr(group, "value") else str(group)
    target_clean = target.lower().replace("-", "_")
    results = []
    for case in GOLDEN_BENCHMARK_DATASET:
        case_val = case.user_group.value if hasattr(case.user_group, "value") else str(case.user_group)
        case_clean = case_val.lower().replace("-", "_")
        if (
            case_clean == target_clean
            or target_clean in case_clean
            or case_clean in target_clean
        ):
            results.append(case)
    return results
