"""
Module: vietnamese_tokenizer.py
Bộ tách từ và chuẩn hóa từ khóa tiếng Việt phục vụ chỉ mục BM25 Okapi cho F&B
Đảm bảo bắt trúng từ ghép ẩm thực (vd: 'phở bò', 'bún bò', 'gỏi cuốn', 'chả giò', 'không cay')
"""

import re
import unicodedata
from typing import List, Set

# Danh mục từ ghép và thuật ngữ ẩm thực F&B thường gặp
COMMON_COMPOUND_TERMS: Set[str] = {
    # Món ăn & Nguyên liệu
    "phở bò", "phở gà", "bún bò", "bún bò huế", "bún chả", "cơm tấm", "bánh mì",
    "gỏi cuốn", "chả giò", "chả ram", "súp cua", "súp bắp cua", "mì quảng",
    "gà nướng", "cơm lam", "lẩu thái", "lẩu hải sản", "thịt bò", "bắp bò", "nạm bò",
    "ba chỉ", "sườn bì chả", "hải sản", "tôm sú", "tôm thịt", "thịt heo", "thịt luộc",
    # Đồ uống & Tráng miệng
    "cà phê", "cà phê sữa", "cà phê sữa đá", "trà đào", "cam sả", "nước ép", "dưa hấu",
    "sinh tố", "sinh tố bơ", "bánh flan", "chè thái", "kem dừa", "nước cốt dừa",
    # Thuộc tính dinh dưỡng & Chế độ ăn
    "không cay", "cay vừa", "cay nhiều", "siêu cay", "ít đường", "không đường",
    "không gluten", "thuần chay", "ăn chay", "ăn mặn", "ít béo", "giảm cân",
    "dị ứng", "đậu phộng", "đậu nành", "hải sản",
}


def normalize_vietnamese_text(text: str) -> str:
    """Chuẩn hóa ký tự Unicode tiếng Việt (NFC) và loại bỏ ký tự lạ."""
    if not text:
        return ""
    # Chuẩn hóa về dạng Unicode dựng sẵn NFC
    normalized = unicodedata.normalize("NFC", str(text).lower())
    # Thay thế các dấu câu bằng khoảng trắng, giữ lại chữ và số
    cleaned = re.sub(r"[^\w\s\d]", " ", normalized)
    # Loại bỏ khoảng trắng thừa
    return re.sub(r"\s+", " ", cleaned).strip()


def tokenize_vietnamese(text: str, enable_bigrams: bool = True) -> List[str]:
    """
    Tách từ tiếng Việt cho mô hình BM25:
    1. Chuẩn hóa văn bản.
    2. Ghép từ ghép ẩm thực đã định nghĩa sẵn.
    3. Tùy chọn sinh thêm unigram và bigram để tối ưu độ phủ Recall của BM25.
    
    Args:
        text: Chuỗi văn bản cần tách từ (vd: "Phở bò tái nạm không cay")
        enable_bigrams: Bật sinh bigrams từ ghép kế tiếp để tăng độ khớp từ khóa

    Returns:
        Danh sách các token từ khóa (vd: ['phở_bò', 'tái', 'nạm', 'không_cay', ...])
    """
    normalized = normalize_vietnamese_text(text)
    if not normalized:
        return []

    tokens: List[str] = []
    temp_text = f" {normalized} "

    # 1. Tìm và đóng băng các từ ghép ẩm thực ưu tiên
    found_compounds = []
    for term in sorted(COMMON_COMPOUND_TERMS, key=len, reverse=True):
        term_pattern = f" {term} "
        if term_pattern in temp_text:
            compound_token = term.replace(" ", "_")
            found_compounds.append(compound_token)
            temp_text = temp_text.replace(term_pattern, f" {compound_token} ")

    # 2. Tách từ cơ bản theo khoảng trắng
    raw_words = temp_text.strip().split()
    tokens.extend(raw_words)

    # 3. Tùy chọn bổ sung bigram kế cận cho các từ chưa ghép
    if enable_bigrams and len(raw_words) > 1:
        for i in range(len(raw_words) - 1):
            w1, w2 = raw_words[i], raw_words[i + 1]
            if "_" not in w1 and "_" not in w2:
                tokens.append(f"{w1}_{w2}")

    return tokens
