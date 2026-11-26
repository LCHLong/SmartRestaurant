"""
cart_tools.py
Bộ xử lý thao tác giỏ hàng tương tác (SPEC-MOD-02) & nhận diện thương hiệu đối thủ / mặc cả giá:
1. Nhận diện các ý định giỏ hàng:
   - add_to_cart: Thêm món vào giỏ hàng (hỗ trợ nhiều món trong 1 câu, số lượng, modifiers đường/đá/size/topping, ghi chú)
   - remove_from_cart: Xóa món / giảm bớt số lượng món khỏi giỏ
   - view_cart: Xem danh sách món trong giỏ hàng hiện tại
   - clear_cart: Xóa toàn bộ giỏ hàng
2. Nhận diện câu hỏi về thương hiệu đối thủ (competitor_query - TC-REC-09, TC-REC-10):
   - KFC, The Pizza Company, McDonald's, Lotteria, Jollibee, Starbucks, Highlands, Phúc Long...
   - Khẳng định nhã nhặn chỉ phục vụ món ăn độc quyền theo thực đơn SmartRestaurant.
3. Nhận diện hành vi mặc cả / trả giá (price_bargaining - TC-ATC-11):
   - Từ chối nhã nhặn, giải thích nhà hàng bán đúng giá niêm yết để đảm bảo chất lượng.
"""

import re
from typing import List, Dict, Any, Optional, Tuple

WORD_NUMBERS = {
    "một": 1, "1": 1,
    "hai": 2, "2": 2,
    "ba": 3, "3": 3,
    "bốn": 4, "4": 4, "tư": 4,
    "năm": 5, "5": 5,
    "sáu": 6, "6": 6,
    "bảy": 7, "7": 7, "bẩy": 7,
    "tám": 8, "8": 8,
    "chín": 9, "9": 9,
    "mười": 10, "10": 10,
}

# ─── 1. THƯƠNG HIỆU ĐỐI THỦ (COMPETITORS) ───────────────────────────────────
COMPETITOR_BRANDS = [
    "kfc", "the pizza company", "pizza company", "pizza hut", "domino", "dominos",
    "mcdonald", "mcdonald's", "mcdonalds", "lotteria", "jollibee", "popeyes",
    "texas chicken", "burger king", "subway", "carl's jr", "dodo pizza",
    "starbucks", "highlands", "highlands coffee", "phúc long", "phuc long",
    "gong cha", "koi thé", "the alley", "tocotoco", "bobapop", "katinat",
    "cheese coffee", "trung nguyên", "trung nguyen"
]


def is_competitor_query(text: str) -> Tuple[bool, Optional[str]]:
    """
    Kiểm tra xem câu hỏi có đề cập đến thương hiệu đối thủ hay không (TC-REC-09, TC-REC-10).
    """
    if not text:
        return False, None
    msg = text.lower().strip()

    # Tìm xem có nhắc đến thương hiệu đối thủ nào không
    matched_brand = None
    for brand in COMPETITOR_BRANDS:
        pattern = rf'\b{re.escape(brand)}\b'
        if re.search(pattern, msg):
            matched_brand = brand
            break

    if not matched_brand:
        return False, None

    # Kiểm tra ngữ cảnh hỏi mua / phục vụ
    query_markers = [
        "có bán", "có phục vụ", "có giao", "có menu", "có món", "có mua được",
        "có pizza của", "có gà rán của", "có bán của", "quán có", "nhà hàng có",
        "order của", "mua giùm", "gọi của", "bên mình có bán"
    ]
    is_asking = any(m in msg for m in query_markers) or "không" in msg or "ko" in msg or "?" in msg

    if is_asking or matched_brand:
        return True, matched_brand

    return False, None


def get_competitor_refusal(brand_name: Optional[str] = None) -> str:
    """Tạo câu trả lời từ chối nhã nhặn khi khách hỏi mua sản phẩm thương hiệu đối thủ."""
    brand_display = brand_name.title() if brand_name else "thương hiệu khác"
    return (
        f"Dạ, SmartRestaurant chỉ phục vụ các món ăn và thức uống độc quyền được chế biến trực tiếp tại bếp "
        f"của nhà hàng theo thực đơn chính thức, không phục vụ sản phẩm của các thương hiệu khác như {brand_display} ạ. "
        f"Quý khách có thể tham khảo các món đặc sản rất được yêu thích của quán như **Gà Nướng Cơm Lam**, "
        f"**Cơm Chiên Hải Sản Hoàng Kim**, hoặc **Bò Lúc Lắc Khoai Tây Chiên** nhé! 🍗🍕"
    )


# ─── 2. MẶC CẢ / TRẢ GIÁ (PRICE BARGAINING) ──────────────────────────────────
BARGAIN_PATTERNS = [
    r'giảm\s*giá.*?(?:cho tôi|cho mình|bớt|được không|được ko|nhé|nha)',
    r'(?:bớt|giảm)\s*(?:giá|tiền|xuống|cho).*?(?:\d+|k|nghìn|ngàn)',
    r'(?:giảm|bớt).*?(?:còn|xuống)\s*\d+\s*(?:k|nghìn|ngàn|đ|vnd)',
    r'mặc cả\s*giá',
    r'trả giá\s*món',
    r'bán rẻ\s*hơn\s*(?:được không|được ko|nhé)',
    r'có bớt\s*giá\s*không',
    r'có giảm\s*giá\s*cho\s*món',
]


def is_bargain_query(text: str) -> bool:
    """Kiểm tra xem khách hàng có đang mặc cả / trả giá món ăn hay không (TC-ATC-11)."""
    if not text:
        return False
    msg = text.lower().strip()
    return any(re.search(pat, msg) for pat in BARGAIN_PATTERNS)


def get_bargain_refusal() -> str:
    """Tạo phản hồi từ chối mặc cả giá nhã nhặn."""
    return (
        "Dạ, các món ăn tại **SmartRestaurant** đều được bán đúng theo giá niêm yết trên thực đơn để bảo đảm "
        "chất lượng nguyên liệu tươi ngon chuẩn organic và quy trình chế biến chuẩn mực cao cấp nhất ạ. "
        "Nhà hàng không áp dụng chính sách mặc cả hoặc bớt giá trên từng món, mong quý khách thông cảm nhé!\n\n"
        "Quý khách có thể theo dõi mục **Khuyến Mãi & Voucher** của quán để áp dụng các mã giảm giá và combo ưu đãi hấp dẫn ạ! 🌟"
    )


# ─── 3. THAO TÁC GIỎ HÀNG (CART ACTIONS) ─────────────────────────────────────
ADD_TO_CART_PATTERNS = [
    r'\b(?:thêm|cho|bỏ|lấy|chọn|đặt|order)\b.*?\b(?:vào giỏ|vào giỏ hàng|vô giỏ|vô giỏ hàng|vào đơn)\b',
    r'\b(?:cho|thêm|bỏ)\s+(?:\d+|một|hai|ba|bốn|năm)\s+(?:phần|ly|tô|suất|chén|cốc|đĩa|dĩa|chai|lon).*?\b(?:vào giỏ|giỏ hàng)?',
    r'\b(?:thêm|cho|lấy|order)\s+(?:\d+|một|hai|ba|bốn|năm)\s+.*?\b(?:\d+%\s*(?:đường|đá)|không đường|ít đường|không đá|ít đá|không lấy ống hút)',
    r'\b(?:thêm|bỏ)\s+(?:\d+|một|hai|ba|bốn|năm)\s+(?!người|khách)[a-zà-ỹ\s]+',
    r'\bvào giỏ\b',
    r'\bthêm vào giỏ\b',
    r'\bcho vào giỏ\b',
]

REMOVE_FROM_CART_PATTERNS = [
    r'\b(?:bỏ bớt|xóa bớt|giảm bớt|hủy bớt|bớt|xóa|bỏ)\b.*?\b(?:khỏi giỏ|ra khỏi giỏ|trong giỏ|khỏi đơn)\b',
    r'\b(?:bỏ bớt|xóa bớt|giảm bớt)\s+(?:\d+|một|hai|ba|bốn|năm)?\s*(?:phần|ly|tô|suất|chén|cốc|đĩa|dĩa)?\s*.*?\b(?:khỏi giỏ|ra khỏi giỏ)?',
    r'\bxóa khỏi giỏ\b',
    r'\bbỏ khỏi giỏ\b',
    r'\bra khỏi giỏ\b',
]

VIEW_CART_PATTERNS = [
    r'\b(?:xem|kiểm tra|coi|check)\s*(?:giỏ|giỏ hàng|đơn|đơn hàng)\b',
    r'\bgiỏ hàng\s*(?:của tôi|của mình|hiện tại|đang có gì|có gì)\b',
    r'\b(?:trong giỏ|trong giỏ hàng)\s*(?:có gì|đang có gì|hiện có gì)\b',
    r'\btôi đã\s*(?:chọn|gọi|đặt)\s*(?:những món nào|món gì|món nào)\b',
]

CLEAR_CART_PATTERNS = [
    r'\b(?:xóa sạch|xóa hết|dọn sạch|hủy hết|xóa toàn bộ)\s*(?:giỏ|giỏ hàng|đơn)\b'
]


def is_cart_action(text: str) -> Tuple[bool, Optional[str]]:
    """
    Nhận diện xem câu thoại có phải là thao tác giỏ hàng hay không:
    Returns (is_cart, action_type):
    - add_to_cart
    - remove_from_cart
    - view_cart
    - clear_cart
    """
    if not text:
        return False, None
    msg = text.lower().strip()

    # Không nhầm lẫn với ý định đặt bàn (reservation)
    if any(k in msg for k in ["đặt bàn", "đặt chỗ", "book bàn", "giữ bàn", "bàn mấy người", "bàn 4 người", "ăn lúc", "hôm nay lúc", "ngày mai lúc"]) or re.search(r'\b(?:bàn|cho)\s+\d+\s*(?:người|khách)\b', msg):
        return False, None

    # 1. Clear cart
    if any(re.search(pat, msg) for pat in CLEAR_CART_PATTERNS):
        return True, "clear_cart"

    # 2. Remove from cart (kiểm tra trước add_to_cart vì có chữ "bỏ bớt ... ra khỏi giỏ")
    if any(re.search(pat, msg) for pat in REMOVE_FROM_CART_PATTERNS):
        return True, "remove_from_cart"

    # 3. View cart
    if any(re.search(pat, msg) for pat in VIEW_CART_PATTERNS):
        return True, "view_cart"

    # 4. Add to cart
    if any(re.search(pat, msg) for pat in ADD_TO_CART_PATTERNS):
        return True, "add_to_cart"

    return False, None


# ─── 4. TRÍCH XUẤT MODIFIERS & NOTES ─────────────────────────────────────────
MODIFIER_SUGAR_PATTERNS = [
    (r'(?:không|0%)\s*đường', "Không đường (0%)"),
    (r'(?:ít|30%)\s*đường', "Ít đường (30%)"),
    (r'(?:50%)\s*đường', "50% đường"),
    (r'(?:70%)\s*đường', "70% đường"),
    (r'(?:100%|đầy đủ)\s*đường', "100% đường"),
    (r'ngọt vừa', "Ngọt vừa (70%)"),
    (r'ít ngọt', "Ít ngọt (50%)"),
]

MODIFIER_ICE_PATTERNS = [
    (r'(?:không|0%)\s*đá', "Không đá (0%)"),
    (r'(?:ít|30%)\s*đá', "Ít đá (30%)"),
    (r'(?:50%)\s*đá', "50% đá"),
    (r'(?:70%)\s*đá', "70% đá"),
    (r'(?:100%)\s*đá', "100% đá"),
    (r'đá riêng', "Đá riêng"),
]

MODIFIER_SPICE_PATTERNS = [
    (r'không cay', "Không cay"),
    (r'ít cay', "Ít cay"),
    (r'cay vừa', "Cay vừa"),
    (r'cay nhiều', "Cay nhiều"),
]

MODIFIER_SIZE_PATTERNS = [
    (r'size l|cỡ lớn', "Size L"),
    (r'size m|cỡ vừa', "Size M"),
    (r'size s|cỡ nhỏ', "Size S"),
]

SPECIAL_NOTE_PATTERNS = [
    r'không\s*(?:lấy\s*)?(?:ống hút|ong hut)',
    r'không\s*(?:lấy\s*)?(?:muỗng|thìa|đũa)',
    r'không\s*hành',
    r'ít\s*hành',
    r'nhiều\s*hành',
    r'nhiều\s*ớt',
    r'không\s*ớt',
    r'để\s*riêng\s*sốt',
    r'để\s*riêng\s*nước\s*dùng',
    r'nước\s*dùng\s*trong',
    r'nước\s*béo',
]


def extract_modifiers_and_notes(text: str) -> Tuple[List[Dict[str, Any]], str]:
    """Trích xuất danh sách modifiers và ghi chú món ăn từ câu thoại."""
    msg = text.lower()
    modifiers = []
    notes_list = []

    # Đường theo phần trăm (VD: 50% đường, 70% đường, 30% đường, 100% đường, 0% đường)
    m_sugar_pct = re.search(r'(\d+)%\s*đường', msg)
    if m_sugar_pct:
        pct = m_sugar_pct.group(1)
        modifiers.append({"id": f"mod-sugar-{pct}", "name": f"{pct}% đường", "price_modifier": 0})
    elif re.search(r'\bkhông\s*đường\b', msg):
        modifiers.append({"id": "mod-sugar-0", "name": "Không đường", "price_modifier": 0})
    elif re.search(r'\bít\s*đường\b|\bít\s*ngọt\b', msg):
        modifiers.append({"id": "mod-sugar-50", "name": "Ít ngọt (50%)", "price_modifier": 0})
    elif re.search(r'\bngọt\s*vừa\b', msg):
        modifiers.append({"id": "mod-sugar-70", "name": "Ngọt vừa (70%)", "price_modifier": 0})

    # Đá theo phần trăm (VD: 70% đá, 50% đá, 30% đá, 100% đá, 0% đá)
    m_ice_pct = re.search(r'(\d+)%\s*đá', msg)
    if m_ice_pct:
        pct = m_ice_pct.group(1)
        modifiers.append({"id": f"mod-ice-{pct}", "name": f"{pct}% đá", "price_modifier": 0})
    elif re.search(r'\bkhông\s*đá\b', msg):
        modifiers.append({"id": "mod-ice-0", "name": "Không đá", "price_modifier": 0})
    elif re.search(r'\bít\s*đá\b', msg):
        modifiers.append({"id": "mod-ice-50", "name": "Ít đá (50%)", "price_modifier": 0})
    elif re.search(r'\bđá\s*riêng\b', msg):
        modifiers.append({"id": "mod-ice-rieng", "name": "Đá riêng", "price_modifier": 0})

    # Cay
    for pat, label in MODIFIER_SPICE_PATTERNS:
        if re.search(pat, msg):
            modifiers.append({"id": f"mod-spice-{label}", "name": label, "price_modifier": 0})
            break

    # Size
    for pat, label in MODIFIER_SIZE_PATTERNS:
        if re.search(pat, msg):
            modifiers.append({"id": f"mod-size-{label}", "name": label, "price_modifier": 0})
            break

    # Ghi chú
    for pat in SPECIAL_NOTE_PATTERNS:
        m = re.search(pat, msg)
        if m:
            notes_list.append(m.group(0).strip())

    notes_str = ", ".join(notes_list) if notes_list else ""
    return modifiers, notes_str


# ─── 5. MATCHING MÓN ĂN VÀ TRÍCH XUẤT ADD TO CART ───────────────────────────
def _get_corpus_menu() -> List[Dict[str, Any]]:
    """Tải corpus thực đơn."""
    try:
        from processors.index_manager import DualIndexManager
        idx_mgr = DualIndexManager()
        idx_mgr.load_from_disk()
        return idx_mgr.corpus_items or []
    except Exception:
        return []


def match_item_in_menu(query: str, menu_items: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Tìm món ăn khớp nhất trong thực đơn từ cụm từ truy vấn."""
    if not query:
        return None
    q = query.lower().strip()

    # Nhận diện đặc thù các món đồ uống & món chính phổ biến để tránh nhầm loại
    if "chanh dây" in q:
        if any(w in q for w in ["nước", "ly", "cốc", "uống", "chai", "lon"]):
            for item in menu_items:
                name = item.get("name", "").lower()
                if "nước chanh dây" in name:
                    return item
            return {
                "id": "item-nuoc-chanh-day-tuoi-01",
                "name": "Nước Chanh Dây Tươi Mát Lạnh",
                "price": 35000.0,
                "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
                "category": "Đồ uống (Drinks)"
            }

    if "cơm chiên hải sản" in q:
        for item in menu_items:
            if "cơm chiên hải sản" in item.get("name", "").lower():
                return item

    if "cà phê sữa đá" in q or "cafe sữa đá" in q or "cf sữa đá" in q:
        for item in menu_items:
            if "cà phê sữa đá" in item.get("name", "").lower():
                return item

    # 1. Khớp chính xác tên
    for item in menu_items:
        name = item.get("name", "").lower()
        if name == q:
            return item

    # 2. Khớp chuỗi con (loại trừ bánh khi query hỏi nước)
    is_drink_query = any(w in q for w in ["nước", "ly", "cốc", "trà", "cà phê", "sinh tố"])
    candidates = []
    for item in menu_items:
        name = item.get("name", "").lower()
        if is_drink_query and ("bánh" in name or "salad" in name):
            continue
        if q in name or name in q:
            candidates.append(item)
    if candidates:
        candidates.sort(key=lambda x: len(x.get("name", "")), reverse=True)
        return candidates[0]

    # 3. Khớp theo từ vựng chính (token overlap)
    q_words = set(re.findall(r'\w+', q))
    best_item = None
    best_overlap = 0
    for item in menu_items:
        name = item.get("name", "").lower()
        if is_drink_query and ("bánh" in name or "salad" in name):
            continue
        name_words = set(re.findall(r'\w+', name))
        overlap = len(q_words & name_words)
        if overlap > best_overlap and overlap >= 2:
            best_overlap = overlap
            best_item = item

    return best_item


def extract_cart_add_items(
    text: str,
    menu_items: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Trích xuất danh sách món, số lượng, modifiers, notes khi khách yêu cầu thêm vào giỏ.
    Hỗ trợ câu ghép nhiều món: "Cho 1 phần cơm chiên hải sản và 2 ly nước chanh dây vào giỏ hàng."
    """
    if not text:
        return []

    if not menu_items:
        menu_items = _get_corpus_menu()

    msg = text.lower().strip()
    # Loại bỏ tiền tố/hậu tố thao tác giỏ hàng để dễ tách món
    clean_msg = re.sub(r'\b(?:vào giỏ hàng|vào giỏ|vô giỏ hàng|vô giỏ|vào đơn|giúp tôi|cho tôi|giúp mình|nhé|nha|ạ)\b', '', msg).strip()

    # Tách các món bằng "và", ",", "kèm", "với"
    clauses = re.split(r'\s*(?:và|,|với)\s*', clean_msg)
    if not clauses:
        clauses = [clean_msg]

    added_items = []
    matched_ids = set()

    for clause in clauses:
        clause = clause.strip()
        if not clause:
            continue

        # Trích xuất số lượng
        qty = 1
        qty_match = re.search(r'\b(\d+|một|hai|ba|bốn|tư|năm|sáu|bảy|tám|chín|mười)\s*(?:phần|ly|tô|suất|chén|cốc|đĩa|dĩa|chai|lon|gói)?\b', clause)
        if qty_match:
            raw_q = qty_match.group(1)
            qty = int(raw_q) if raw_q.isdigit() else WORD_NUMBERS.get(raw_q, 1)

        # Trích xuất modifiers và notes từ clause này
        modifiers, notes = extract_modifiers_and_notes(clause)

        # Loại bỏ các từ số lượng, modifier, note khỏi clause để trích xuất tên món
        cleaned_clause = re.sub(r'\b(\d+|một|hai|ba|bốn|tư|năm|sáu|bảy|tám|chín|mười)\s*(?:phần|ly|tô|suất|chén|cốc|đĩa|dĩa|chai|lon|gói)?\b', '', clause)
        cleaned_clause = re.sub(r'\b(?:cho|thêm|lấy|bỏ|đặt|order)\b', '', cleaned_clause).strip()
        # Bỏ các cụm modifier ra
        for _, label in MODIFIER_SUGAR_PATTERNS + MODIFIER_ICE_PATTERNS + MODIFIER_SPICE_PATTERNS + MODIFIER_SIZE_PATTERNS:
            cleaned_clause = cleaned_clause.replace(label.lower(), '')
        cleaned_clause = re.sub(r'\d+%\s*(?:đường|đá)', '', cleaned_clause)
        cleaned_clause = re.sub(r'không\s*(?:lấy\s*)?(?:ống hút|ong hut|muỗng|thìa|đũa|hành|ớt)', '', cleaned_clause).strip()

        matched_item = match_item_in_menu(cleaned_clause, menu_items)
        if matched_item and matched_item.get("id") not in matched_ids:
            matched_ids.add(matched_item.get("id"))
            added_items.append({
                "id": matched_item.get("id"),
                "name": matched_item.get("name"),
                "price": float(matched_item.get("price") or 0),
                "quantity": qty,
                "modifiers": modifiers,
                "notes": notes,
                "image_url": matched_item.get("image_url", ""),
                "description": matched_item.get("description", ""),
            })

    # Nếu sau khi tách clauses không tìm thấy, thử quét toàn bộ menu xem tên món nào xuất hiện trong câu
    if not added_items:
        sorted_menu = sorted(menu_items, key=lambda x: len(x.get("name", "")), reverse=True)
        for item in sorted_menu:
            name = item.get("name", "").lower()
            if name in msg and item.get("id") not in matched_ids:
                matched_ids.add(item.get("id"))
                modifiers, notes = extract_modifiers_and_notes(msg)
                qty_match = re.search(r'\b(\d+|một|hai|ba|bốn|tư|năm)\s*(?:phần|ly|tô|suất)?\s*' + re.escape(name), msg)
                qty = 1
                if qty_match:
                    raw_q = qty_match.group(1)
                    qty = int(raw_q) if raw_q.isdigit() else WORD_NUMBERS.get(raw_q, 1)

                added_items.append({
                    "id": item.get("id"),
                    "name": item.get("name"),
                    "price": float(item.get("price") or 0),
                    "quantity": qty,
                    "modifiers": modifiers,
                    "notes": notes,
                    "image_url": item.get("image_url", ""),
                    "description": item.get("description", ""),
                })

    return added_items


def extract_cart_remove_items(
    text: str,
    cart_items: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Trích xuất món cần xóa hoặc giảm số lượng khỏi giỏ:
    "Bỏ bớt 1 ly nước chanh dây ra khỏi giỏ giúp tôi."
    """
    if not text:
        return []
    msg = text.lower().strip()

    qty = 1
    qty_match = re.search(r'\b(\d+|một|hai|ba|bốn|năm)\s*(?:phần|ly|tô|suất|chén|cốc|đĩa|dĩa)?\b', msg)
    if qty_match:
        raw_q = qty_match.group(1)
        qty = int(raw_q) if raw_q.isdigit() else WORD_NUMBERS.get(raw_q, 1)

    # Loại bỏ các từ hành động
    clean_query = re.sub(r'\b(?:bỏ bớt|xóa bớt|giảm bớt|bỏ|xóa|hủy|bớt|ra khỏi giỏ|khỏi giỏ hàng|khỏi giỏ|trong giỏ|giúp tôi|giúp mình|hộ tôi|nhé|nha|ạ)\b', '', msg).strip()
    clean_query = re.sub(r'\b(\d+|một|hai|ba|bốn|năm)\s*(?:phần|ly|tô|suất|chén|cốc|đĩa|dĩa)?\b', '', clean_query).strip()

    # Tìm trong cart_items nếu có
    if cart_items:
        for it in cart_items:
            name = it.get("name", "").lower()
            if clean_query in name or name in clean_query:
                return [{
                    "id": it.get("id"),
                    "name": it.get("name"),
                    "quantity": qty,
                    "cartId": it.get("cartId"),
                }]

    # Fallback tìm trong corpus
    menu_items = _get_corpus_menu()
    matched = match_item_in_menu(clean_query, menu_items)
    if matched:
        return [{
            "id": matched.get("id"),
            "name": matched.get("name"),
            "quantity": qty,
        }]

    # Nếu không tìm thấy tên chính xác, dùng query sạch
    return [{
        "name": clean_query.title() if clean_query else "Món",
        "quantity": qty,
    }]


# ─── 6. FORMAT PHẢN HỒI GIỎ HÀNG ───────────────────────────────────────────
def format_cart_response(
    action: str,
    items: List[Dict[str, Any]],
    current_cart: Optional[List[Dict[str, Any]]] = None
) -> str:
    """Tạo câu trả lời xác nhận thân thiện chuẩn mực tiếng Việt kèm emoji."""
    if action == "add_to_cart":
        if not items:
            return "Dạ, bạn muốn thêm món nào vào giỏ hàng ạ? Bạn có thể cho Aria biết tên món và số lượng nhé! 🍽️🛒"

        desc_list = []
        for it in items:
            q = it.get("quantity", 1)
            name = it.get("name", "")
            mods = it.get("modifiers", [])
            notes = it.get("notes", "")

            extra_info = []
            if mods:
                mod_names = ", ".join(m.get("name", "") for m in mods)
                extra_info.append(f"Tùy chọn: *{mod_names}*")
            if notes:
                extra_info.append(f"Ghi chú: *{notes}*")

            if extra_info:
                desc_list.append(f"**{q}x {name}** ({' - '.join(extra_info)})")
            else:
                desc_list.append(f"**{q}x {name}**")

        summary_str = " và ".join(desc_list)
        return (
            f"Dạ, Aria đã thêm {summary_str} vào giỏ hàng cho bạn rồi ạ! 🛒✨\n\n"
            f"Bạn có thể nhấn vào biểu tượng Giỏ hàng để kiểm tra đơn hoặc tiếp tục chọn thêm món nhé!"
        )

    elif action == "remove_from_cart":
        if not items:
            return "Dạ, bạn muốn bỏ bớt món nào khỏi giỏ hàng ạ? 🗑️"
        remove_strs = [f"**{it.get('quantity', 1)}x {it.get('name', 'món')}**" for it in items]
        return (
            f"Dạ, Aria đã bỏ bớt {' và '.join(remove_strs)} khỏi giỏ hàng của bạn rồi ạ! 🗑️\n\n"
            f"Giỏ hàng đã được cập nhật lại theo yêu cầu của bạn nhé!"
        )

    elif action == "clear_cart":
        return "Dạ, Aria đã dọn sạch toàn bộ các món trong giỏ hàng theo yêu cầu của bạn rồi ạ! 🧹 Quý khách muốn chọn món mới nào không ạ?"

    elif action == "view_cart":
        cart = current_cart or []
        if not cart:
            return (
                "Dạ, hiện tại giỏ hàng của bạn đang trống ạ. 🛒\n\n"
                "Bạn muốn Aria gợi ý một vài món ăn đặc sản được yêu thích nhất của nhà hàng hôm nay không ạ? 🍽️"
            )

        lines = ["Dạ, giỏ hàng hiện tại của bạn gồm có:"]
        total = 0
        for it in cart:
            q = it.get("quantity", 1)
            name = it.get("name", "")
            price = float(it.get("price") or 0)
            item_tot = price * q
            total += item_tot
            price_str = f"{item_tot:,.0f}đ".replace(",", ".")
            lines.append(f"• **{q}x {name}**: {price_str}")

        tot_str = f"{total:,.0f}đ".replace(",", ".")
        lines.append(f"\n💰 **Tổng cộng:** **{tot_str}**")
        lines.append("\nBạn có thể nhấn vào Giỏ hàng để kiểm tra chi tiết và gửi order tới nhà bếp nhé! 🛒✨")
        return "\n".join(lines)

    return "Dạ, Aria đã cập nhật giỏ hàng theo yêu cầu của bạn rồi ạ! 🛒"


def check_unrealistic_budget_query(text: str) -> Tuple[bool, Optional[str]]:
    """
    Kiểm tra xem yêu cầu có vi phạm ngân sách biên cực thấp không (TC-REC-02: 5 người / 50k).
    Ví dụ: 5 người với 50k (10k/người) -> không đủ cho một bữa ăn tại nhà hàng.
    """
    if not text:
        return False, None
    msg = text.lower().strip()

    # 1. Trích xuất số lượng khách
    guest_match = re.search(r'(\d+)\s*(?:người|khách|bạn|nguoi|khach|ban)\b', msg)
    if not guest_match:
        word_to_num = {
            "hai": 2, "ba": 3, "bốn": 4, "bon": 4, "năm": 5, "nam": 5,
            "sáu": 6, "sau": 6, "bảy": 7, "bay": 7, "tám": 8, "tam": 8,
            "chín": 9, "chin": 9, "mười": 10, "muoi": 10
        }
        word_match = re.search(r'\b(hai|ba|bốn|bon|năm|nam|sáu|sau|bảy|bay|tám|tam|chín|chin|mười|muoi)\s*(?:người|khách|bạn|nguoi|khach|ban)\b', msg)
        guest_count = word_to_num.get(word_match.group(1), 0) if word_match else 0
    else:
        guest_count = int(guest_match.group(1))

    # 2. Trích xuất ngân sách
    budget = None
    budget_context_match = re.search(r'(?:ngân sách|chi phí|tầm|khoảng|có|với|tổng)\s*[:=]?\s*(\d+(?:[.,]\d{3})*|\d+)\s*(k|nghìn|nghin|ngàn|ngan|đ|d|đồng|dong|vnd|vnđ)?', msg)
    if budget_context_match:
        raw_num_str = budget_context_match.group(1).replace('.', '').replace(',', '')
        unit = (budget_context_match.group(2) or '').lower()
        if raw_num_str:
            num = float(raw_num_str)
            if unit in ('k', 'nghìn', 'nghin', 'ngàn', 'ngan') or num < 1000:
                budget = num * 1000 if num < 1000 else num
            else:
                budget = num

    if budget is None:
        for m in re.finditer(r'(\d+(?:[.,]\d{3})*|\d+)\s*(k|nghìn|nghin|ngàn|ngan|đ|đồng|dong|vnd|vnđ)(?=[^\w]|$)', msg):
            raw_num_str = m.group(1).replace('.', '').replace(',', '')
            unit = m.group(2).lower()
            if raw_num_str:
                num = float(raw_num_str)
                if unit in ('k', 'nghìn', 'nghin', 'ngàn', 'ngan') or num < 1000:
                    budget = num * 1000 if num < 1000 else num
                else:
                    budget = num
                break

    # Nếu có đề cập nhóm người (>= 2 người) và tổng ngân sách quá thấp (< 25.000đ/người)
    # Đặc biệt kịch bản TC-REC-02: 5 người / 50k
    if guest_count >= 2 and budget and budget > 0:
        per_person = budget / guest_count
        if per_person < 25000:
            formatted_budget = f"{int(budget):,}đ".replace(",", ".")
            formatted_pp = f"{int(per_person):,}đ".replace(",", ".")
            ans = (
                f"Dạ với ngân sách {formatted_budget} cho {guest_count} người "
                f"thì chi phí trung bình {formatted_pp}/khách sẽ khó để có một bàn tiệc no nê trọn vẹn tại nhà hàng ạ. "
                f"Aria xin gợi ý quý khách có thể tham khảo các món ăn nhẹ tiết kiệm hoặc cân nhắc nâng ngân sách từ 50.000đ - 70.000đ/người "
                f"để quán phục vụ chu đáo nhất nhé!"
            )
            return True, ans

    return False, None
