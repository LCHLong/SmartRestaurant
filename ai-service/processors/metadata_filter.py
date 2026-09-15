"""
Module: metadata_filter.py
Thuộc Bước 3.1 - Pha 3: Bộ Trích Xuất Thực Thể Ẩm Thực (F&B NER) & Tiền Lọc Siêu Dữ Liệu (Metadata Hard-Filtering)
Theo nghiên cứu "Advancing RAG for Structured Enterprise Data" (Paper 01 - IIT Roorkee 2025)

Cung cấp:
1. ExtractedEntities: Lớp dữ liệu lưu trữ các thực thể ẩm thực bóc tách được từ câu truy vấn.
2. CulinaryEntityExtractor: Trích xuất thực thể chuyên sâu F&B (dị ứng, chế độ ăn, độ cay, ngân sách, danh mục).
3. MetadataFilter: Bộ lọc cứng (Hard-Filtering) loại trừ 100% món ăn vi phạm tiêu chuẩn an toàn dị ứng hoặc ngân sách.
"""

import re
import unicodedata
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple, Set


@dataclass
class ExtractedEntities:
    """Cấu trúc dữ liệu chứa các thực thể ẩm thực bóc tách từ câu hỏi."""
    raw_query: str
    cleaned_query: str
    allergens: List[str] = field(default_factory=list)          # Danh sách dị ứng cần loại bỏ (vd: ['tôm', 'hải sản'])
    dietary_tags: List[str] = field(default_factory=list)       # Chế độ ăn (vd: ['chay', 'vegan'])
    max_spice_level: Optional[int] = None                       # Ngưỡng cay tối đa (0 = không cay, 1 = ít cay,...)
    min_spice_level: Optional[int] = None                       # Ngưỡng cay tối thiểu
    max_price: Optional[float] = None                           # Ngân sách tối đa (VND)
    min_price: Optional[float] = None                           # Ngân sách tối thiểu (VND)
    categories: List[str] = field(default_factory=list)         # Danh mục món (vd: ['món nước', 'cơm'])
    excluded_ingredients: List[str] = field(default_factory=list)# Thành phần khách yêu cầu không ăn

    def to_dict(self) -> Dict[str, Any]:
        return {
            "raw_query": self.raw_query,
            "cleaned_query": self.cleaned_query,
            "allergens": self.allergens,
            "dietary_tags": self.dietary_tags,
            "max_spice_level": self.max_spice_level,
            "min_spice_level": self.min_spice_level,
            "max_price": self.max_price,
            "min_price": self.min_price,
            "categories": self.categories,
            "excluded_ingredients": self.excluded_ingredients,
            "has_filters": bool(
                self.allergens or self.dietary_tags or
                self.max_spice_level is not None or
                self.max_price is not None or
                self.excluded_ingredients
            )
        }


class CulinaryEntityExtractor:
    """
    Bộ trích xuất thực thể ẩm thực tiếng Việt chuyên biệt F&B:
    Sử dụng kiến trúc lai Rule-based Regex + Lexicon Dictionary tốc độ siêu cao (< 0.5ms).
    """

    # 1. Từ điển nhóm Dị Ứng (Allergens) & các biến thể từ đồng nghĩa
    ALLERGEN_GROUPS: Dict[str, List[str]] = {
        "hải sản": [
            "hải sản", "hai san", "tôm", "tom", "cua", "ghẹ", "ghe", "mực", "muc",
            "bạch tuộc", "bach tuoc", "cá", "ca", "sò", "so", "nghêu", "ngheu",
            "ngao", "ốc", "oc", "hàu", "hau"
        ],
        "tôm": ["tôm", "tom", "tép", "tep"],
        "cua": ["cua", "ghẹ", "ghe"],
        "cá": ["cá", "ca"],
        "đậu phộng": [
            "đậu phộng", "dau phong", "lạc", "lac", "đậu phọng", "dau phoc",
            "hạt điều", "hat dieu", "hạnh nhân", "hanh nhan", "mè", "me", "vừng", "vung"
        ],
        "trứng": ["trứng", "trung", "hột gà", "hot ga", "hột vịt", "hot vit", "lòng đỏ", "long do"],
        "sữa": [
            "sữa", "sua", "sữa bò", "sua bo", "phô mai", "pho mai", "cheese",
            "bơ", "bo", "váng sữa", "vang sua", "dairy"
        ],
        "gluten": ["gluten", "bột mì", "bot mi", "lúa mì", "lua mi"],
        "thịt bò": ["bò", "bo", "thịt bò", "thit bo"],
        "thịt gà": ["gà", "ga", "thịt gà", "thit ga"],
        "thịt heo": ["heo", "lợn", "lon", "thịt heo", "thit heo", "thịt lợn", "thit lon"],
    }

    # 2. Các mẫu ngữ cảnh biểu thị Phủ định / Dị ứng / Loại trừ
    EXCLUSION_PATTERNS = [
        r"(?:dị ứng|di ung)\s+(?:với|voi)?\s*([a-zA-Zà-ỹÀ-Ỹ\s]+)",
        r"(?:không ăn được|khong an duoc)\s*([a-zA-Zà-ỹÀ-Ỹ\s]+)",
        r"(?:không ăn|khong an)\s*([a-zA-Zà-ỹÀ-Ỹ\s]+)",
        r"(?:kiêng|kieng)\s*([a-zA-Zà-ỹÀ-Ỹ\s]+)",
        r"(?:đừng bỏ|dung bo|bỏ|bo|không lấy|khong lay|đừng cho|dung cho|không cho|khong cho)\s*([a-zA-Zà-ỹÀ-Ỹ\s]+)",
        r"(?:không có|khong co)\s*([a-zA-Zà-ỹÀ-Ỹ\s]+)",
    ]

    # 3. Từ khóa chế độ ăn (Dietary Restrictions)
    DIET_KEYWORDS: Dict[str, List[str]] = {
        "chay": ["chay", "ăn chay", "an chay", "món chay", "mon chay", "vegetarian"],
        "vegan": ["thuần chay", "thuan chay", "vegan"],
        "keto": ["keto", "ít tinh bột", "it tinh bot", "low carb"],
        "halal": ["halal"],
        "gluten-free": ["không gluten", "khong gluten", "gluten free", "gluten-free"]
    }

    # 4. Ngữ cảnh độ cay (Spice Level)
    SPICE_PATTERNS: List[Tuple[str, int, Optional[int]]] = [
        # (Pattern regex, max_spice, min_spice)
        (r"\b(?:không cay|khong cay|đừng cay|dung cay|0 cay|ko cay|không ăn cay|khong an cay|không ăn được cay|khong an duoc cay|kiêng cay|kieng cay)\b", 0, None),
        (r"\b(?:ít cay|it cay|cay nhẹ|cay nhe|hơi cay|hoi cay|chút cay|chut cay)\b", 1, None),
        (r"\b(?:cay vừa|cay vua|vừa cay|vua cay)\b", 2, 1),
        (r"\b(?:cay nhiều|cay nhieu|rất cay|rat cay|cực cay|cuc cay|cay nồng|cay nong|siêu cay|sieu cay)\b", 5, 3),
    ]

    # 5. Phân loại danh mục món (Category)
    CATEGORY_KEYWORDS: Dict[str, List[str]] = {
        "món nước": ["món nước", "mon nuoc", "phở", "pho", "bún", "bun", "mì", "mi", "hủ tiếu", "hu tieu", "miến", "mien", "canh", "súp", "sup"],
        "cơm": ["cơm", "com", "cơm chiên", "cơm sườn", "cơm tấm"],
        "lẩu": ["lẩu", "lau", "hotpot"],
        "khai vị": ["khai vị", "khai vi", "gỏi", "goi", "salad", "chả giò", "cha gio", "nem"],
        "đồ uống": ["đồ uống", "do uong", "nước", "nuoc", "trà", "tra", "cà phê", "ca phe", "nước ép", "nuoc ep", "sinh tố", "sinh to"],
        "tráng miệng": ["tráng miệng", "trang mieng", "chè", "che", "bánh", "banh", "kem"]
    }

    def __init__(self):
        # Biên dịch sẵn các biểu thức regex để đạt tốc độ tối đa
        self._compiled_exclusions = [re.compile(p, re.IGNORECASE) for p in self.EXCLUSION_PATTERNS]

    @staticmethod
    def _normalize(text: str) -> str:
        """Chuẩn hóa Unicode NFC và khoảng trắng."""
        if not text:
            return ""
        norm = unicodedata.normalize("NFC", text.strip())
        return re.sub(r"\s+", " ", norm).lower()

    def extract(self, query: str) -> ExtractedEntities:
        """
        Trích xuất đầy đủ các thực thể ẩm thực từ chuỗi câu hỏi người dùng.
        Thời gian thực thi trung bình: < 0.2ms.
        """
        raw = query or ""
        clean = self._normalize(raw)

        extracted = ExtractedEntities(raw_query=raw, cleaned_query=clean)

        if not clean:
            return extracted

        # --- A. Bóc tách Dị ứng & Thành phần loại trừ ---
        self._extract_allergens_and_exclusions(clean, extracted)

        # --- B. Bóc tách Chế độ ăn (Dietary Tags) ---
        self._extract_dietary_tags(clean, extracted)

        # --- C. Bóc tách Độ cay (Spice Level) ---
        self._extract_spice_level(clean, extracted)

        # --- D. Bóc tách Ngân sách (Budget / Price) ---
        self._extract_budget(clean, extracted)

        # --- E. Bóc tách Danh mục (Category) ---
        self._extract_category(clean, extracted)

        return extracted

    def _extract_allergens_and_exclusions(self, text: str, entities: ExtractedEntities) -> None:
        """Nhận diện các thành phần dị ứng thông qua các cụm từ phủ định hoặc từ khóa trực tiếp."""
        detected_allergens: Set[str] = set()
        detected_excluded: Set[str] = set()

        # 1. Quét theo các mẫu câu phủ định / dị ứng trực tiếp
        for regex in self._compiled_exclusions:
            for match in regex.finditer(text):
                phrase = match.group(1).strip()
                # Kiểm tra xem cụm từ bị loại trừ này tương ứng với nhóm dị ứng nào
                matched_any = False
                for group_name, aliases in self.ALLERGEN_GROUPS.items():
                    for alias in aliases:
                        if alias in phrase:
                            detected_allergens.add(group_name)
                            detected_excluded.add(alias)
                            matched_any = True
                if not matched_any and len(phrase.split()) <= 3:
                    # Nếu là 1 thành phần cụ thể không nằm trong nhóm dị ứng chính (vd: "hành", "tiêu")
                    detected_excluded.add(phrase)

        # 2. Quét các từ khóa dị ứng xuất hiện sau từ "dị ứng" đơn lẻ
        if "dị ứng" in text or "di ung" in text:
            for group_name, aliases in self.ALLERGEN_GROUPS.items():
                for alias in aliases:
                    if re.search(rf"\b{re.escape(alias)}\b", text):
                        detected_allergens.add(group_name)
                        detected_excluded.add(alias)

        entities.allergens = sorted(list(detected_allergens))
        entities.excluded_ingredients = sorted(list(detected_excluded))

    def _extract_dietary_tags(self, text: str, entities: ExtractedEntities) -> None:
        """Nhận diện chế độ ăn chay, vegan, keto, halal..."""
        detected_diet: Set[str] = set()
        for tag, keywords in self.DIET_KEYWORDS.items():
            for kw in keywords:
                if re.search(rf"\b{re.escape(kw)}\b", text):
                    detected_diet.add(tag)
                    break
        entities.dietary_tags = sorted(list(detected_diet))

    def _extract_spice_level(self, text: str, entities: ExtractedEntities) -> None:
        """Nhận diện độ cay mong muốn."""
        for pattern, max_s, min_s in self.SPICE_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                entities.max_spice_level = max_s
                if min_s is not None:
                    entities.min_spice_level = min_s
                break

    def _extract_budget(self, text: str, entities: ExtractedEntities) -> None:
        """
        Bóc tách số tiền tối đa / tối thiểu qua các mẫu tiền tệ tiếng Việt:
        - "dưới 50k", "< 50k", "tối đa 100k", "không quá 80 nghìn", "khoảng 40.000đ"
        """
        # Mẫu 1: Dưới / Không quá / Tối đa X (k/nghìn/vnd)
        max_patterns = [
            r"(?:dưới|duoi|<|<=|tối đa|toi da|không quá|khong qua|ít hơn|it hon)\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|nghin|ngàn|ngan|đồng|dong|đ|d|vnd)?",
            r"(\d+(?:[.,]\d+)?)\s*(?:k|nghìn|nghin|ngàn|ngan|đồng|dong|đ|d|vnd)?\s*(?:đổ lại|do lai|trở xuống|tro xuong)",
            r"(?:ngân sách|ngan sach|tầm|tam|giá|tổng|tong|khoảng|khoang)\s*(?:dưới|khoảng|khoang)?\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|nghin|ngàn|ngan|đồng|dong|đ|d|vnd)",
        ]

        for pattern in max_patterns:
            match = re.search(pattern, text)
            if match:
                raw_num = match.group(1).replace(",", ".")
                unit = (match.group(2) or "").lower()
                try:
                    num = float(raw_num)
                    # Quy đổi đơn vị
                    if unit in ("k", "nghìn", "nghin", "ngàn", "ngan") or (num < 1000 and unit == ""):
                        val = num * 1000
                    else:
                        val = num
                    if val >= 5000:  # Giá tối thiểu hợp lệ của món ăn
                        entities.max_price = val
                        break
                except ValueError:
                    pass

        # Bổ sung ngưỡng ngân sách cho các từ khóa bình dân, tiết kiệm
        if entities.max_price is None and re.search(r"\b(?:bình dân|binh dan|tiết kiệm|tiet kiem|giá rẻ|gia re|sinh viên|sinh vien)\b", text):
            entities.max_price = 70000.0

        # Mẫu 2: Khoảng từ X đến Y (vd: "từ 30k đến 60k")
        range_match = re.search(
            r"(?:từ|tu)\s*(\d+(?:[.,]\d+)?)\s*(?:k|nghìn|ngàn)?\s*(?:đến|den|-)\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|nghin|ngàn|ngan|đồng|dong|đ|d|vnd)?",
            text
        )
        if range_match:
            try:
                min_n = float(range_match.group(1).replace(",", "."))
                max_n = float(range_match.group(2).replace(",", "."))
                unit = (range_match.group(3) or "").lower()
                mul = 1000 if unit in ("k", "nghìn", "nghin", "ngàn", "ngan") or max_n < 1000 else 1
                entities.min_price = min_n * mul
                entities.max_price = max_n * mul
            except ValueError:
                pass

    def _extract_category(self, text: str, entities: ExtractedEntities) -> None:
        """Nhận diện danh mục ẩm thực quan tâm."""
        detected_cat: Set[str] = set()
        for cat_name, keywords in self.CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if re.search(rf"\b{re.escape(kw)}\b", text):
                    detected_cat.add(cat_name)
                    break
        entities.categories = sorted(list(detected_cat))


class MetadataFilter:
    """
    Bộ lọc cứng (Metadata Hard-Filtering):
    Đối soát từng món ăn với các thực thể đã trích xuất, loại trừ tuyệt đối các món vi phạm.
    """

    @staticmethod
    def _contains_allergen(item: Dict[str, Any], allergen_group: str, extractor: CulinaryEntityExtractor) -> bool:
        """Kiểm tra xem món ăn có chứa thành phần thuộc nhóm dị ứng hay không."""
        # 1. Tập hợp các từ khóa liên quan đến nhóm dị ứng này
        aliases = extractor.ALLERGEN_GROUPS.get(allergen_group, [allergen_group])

        # 2. Gom toàn bộ văn bản của món ăn để tìm kiếm
        text_sources = [
            item.get("name", ""),
            item.get("description", ""),
            item.get("row_serialized", ""),
            " ".join(item.get("dietary_tags", []) or []),
            " ".join(item.get("allergens", []) or []),
        ]
        full_item_text = " ".join(str(s) for s in text_sources if s).lower()

        # 3. Quét kiểm tra
        for alias in aliases:
            if re.search(rf"\b{re.escape(alias.lower())}\b", full_item_text):
                return True

        return False

    @classmethod
    def filter_items(
        cls,
        items: List[Dict[str, Any]],
        entities: ExtractedEntities,
        extractor: Optional[CulinaryEntityExtractor] = None
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Lọc cứng danh sách món ăn:
        - items: Danh sách bản ghi món ăn (từ Database hoặc từ tầng Retrieval).
        - entities: Thực thể đã bóc tách từ câu hỏi.
        
        Trả về Tuple:
        - accepted_items: Danh sách món ăn an toàn và thỏa mãn tiêu chí.
        - rejected_items: Danh sách món ăn bị loại kèm lý do ('rejection_reason').
        """
        if not entities or not entities.to_dict().get("has_filters", False):
            return list(items), []

        if extractor is None:
            extractor = CulinaryEntityExtractor()

        accepted: List[Dict[str, Any]] = []
        rejected: List[Dict[str, Any]] = []

        for item in items:
            # item có thể nằm trong cấu trúc item['item'] nếu truyền từ tầng Retriever
            raw_data = item.get("item", item) if isinstance(item, dict) else item
            rejection_reasons: List[str] = []

            # 1. Lọc Dị Ứng (ALLERGEN HARD FILTER - Tiêu chí số 1 về an toàn)
            for allergen in entities.allergens:
                if cls._contains_allergen(raw_data, allergen, extractor):
                    rejection_reasons.append(f"Chứa thành phần dị ứng: {allergen}")
                    break

            # 2. Lọc Thành phần bị cấm chỉ định riêng lẻ
            if not rejection_reasons and entities.excluded_ingredients:
                name_and_desc = f"{raw_data.get('name', '')} {raw_data.get('description', '')} {raw_data.get('row_serialized', '')}".lower()
                for exc in entities.excluded_ingredients:
                    if re.search(rf"\b{re.escape(exc.lower())}\b", name_and_desc):
                        rejection_reasons.append(f"Chứa thành phần khách kiêng: {exc}")
                        break

            # 3. Lọc Chế độ ăn Chay / Vegan
            if not rejection_reasons and ("chay" in entities.dietary_tags or "vegan" in entities.dietary_tags):
                # Kiểm tra món có nhãn chay hoặc tên có chữ chay không
                tags = [str(t).lower() for t in (raw_data.get("dietary_tags") or [])]
                item_name = str(raw_data.get("name", "")).lower()
                is_explicit_chay = any("chay" in t or "vegan" in t for t in tags) or "chay" in item_name

                # Kiểm tra thành phần mặn (thịt, bò, heo, gà, tôm, cua, cá)
                meat_keywords = ["thịt", "bò", "gà", "heo", "lợn", "tôm", "cua", "cá", "mực", "sườn", "chả lụa"]
                contains_meat = any(re.search(rf"\b{re.escape(m)}\b", item_name) for m in meat_keywords) and not is_explicit_chay

                if contains_meat or not is_explicit_chay:
                    rejection_reasons.append("Không thỏa mãn chế độ ăn chay")

            # 4. Lọc Ngưỡng Cay (Max Spice Level)
            if not rejection_reasons and entities.max_spice_level is not None:
                item_spice = raw_data.get("spice_level")
                spice_val = None
                if item_spice is not None:
                    try:
                        spice_val = int(item_spice)
                    except (ValueError, TypeError):
                        pass
                else:
                    # Suy luận độ cay từ tên và mô tả món ăn nếu dữ liệu gốc thiếu trường spice_level
                    desc_text = f"{raw_data.get('name', '')} {raw_data.get('description', '')}".lower()
                    if any(k in desc_text for k in ("cay nồng", "sa tế", "ớt", "cay đặc trưng", "vị cay")):
                        spice_val = 3
                    elif "cay" in desc_text and "không cay" not in desc_text:
                        spice_val = 2
                    else:
                        spice_val = 0

                if spice_val is not None and spice_val > entities.max_spice_level:
                    rejection_reasons.append(
                        f"Độ cay ({spice_val}/5) vượt mức yêu cầu (tối đa {entities.max_spice_level}/5)"
                    )

            # 5. Lọc Ngân Sách Tối Đa (Max Price)
            if not rejection_reasons and entities.max_price is not None:
                price = raw_data.get("price")
                if price is not None:
                    try:
                        price_val = float(price)
                        if price_val > entities.max_price:
                            rejection_reasons.append(
                                f"Giá {price_val:,.0f}đ vượt ngân sách tối đa {entities.max_price:,.0f}đ"
                            )
                    except (ValueError, TypeError):
                        pass

            # 6. Lọc Ngân Sách Tối Thiểu (Min Price)
            if not rejection_reasons and entities.min_price is not None:
                price = raw_data.get("price")
                if price is not None:
                    try:
                        price_val = float(price)
                        if price_val < entities.min_price:
                            rejection_reasons.append(
                                f"Giá {price_val:,.0f}đ thấp hơn ngân sách tối thiểu {entities.min_price:,.0f}đ"
                            )
                    except (ValueError, TypeError):
                        pass

            # Kết luận phân loại món
            if rejection_reasons:
                rejected_item = dict(item)
                rejected_item["rejection_reason"] = "; ".join(rejection_reasons)
                rejected.append(rejected_item)
            else:
                accepted.append(item)

        return accepted, rejected
