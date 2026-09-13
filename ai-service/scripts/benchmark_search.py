#!/usr/bin/env python3
"""
Script: benchmark_search.py
Thuộc Bước 2.2 - Pha 2: Đo lường tốc độ và kiểm tra kết quả truy xuất kết hợp (Hybrid Retrieval)
Theo Paper 01: Score = 0.6 * Dense_norm + 0.4 * BM25_norm
"""

import sys
import time
from pathlib import Path
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import numpy as np
from processors.index_manager import DualIndexManager
from processors.hybrid_retriever import HybridMenuRetriever
from processors.vietnamese_tokenizer import tokenize_vietnamese


def run_benchmark(query: str = "phở bò không cay", top_k: int = 5, alpha: float = 0.6):
    print("=" * 80)
    print(f"⚡ ĐO LƯỜNG TỐC ĐỘ & TRUY XUẤT LAI HYBRID RETRIEVER (BƯỚC 2.2)")
    print("=" * 80)
    print(f"🔍 Câu hỏi: \"{query}\"")
    print(f"⚖️  Trọng số Fusion: alpha = {alpha:.1f} (Dense: {alpha*100:.0f}% | BM25: {(1-alpha)*100:.0f}%)")
    print(f"🎯 Số lượng kết quả: Top {top_k}")
    print("-" * 80)

    # 1. Khởi tạo và nạp chỉ mục
    t_load_start = time.perf_counter()
    retriever = HybridMenuRetriever(default_alpha=alpha, index_type="menu")
    t_load = (time.perf_counter() - t_load_start) * 1000

    n_items = len(retriever.index_manager.corpus_items)
    if n_items == 0:
        print("❌ Chưa tìm thấy chỉ mục trên đĩa. Vui lòng chạy: python scripts/build_indexes.py trước!")
        return

    print(f"📦 Đã nạp chỉ mục ({n_items} món ăn) từ đĩa trong: {t_load:.3f} ms")

    # 2. Tách từ tiếng Việt
    t_tok_start = time.perf_counter()
    tokens = tokenize_vietnamese(query)
    t_tok = (time.perf_counter() - t_tok_start) * 1000
    print(f"🔤 Tách từ tiếng Việt: {tokens} (Thời gian: {t_tok:.4f} ms)")

    # 3. Chạy Hybrid Retrieve toàn trình
    t_run_start = time.perf_counter()
    results = retriever.retrieve(query=query, top_k=top_k, alpha=alpha)
    t_run = (time.perf_counter() - t_run_start) * 1000

    # 4. Hiển thị bảng kết quả Top-K với đầy đủ phân rã điểm số
    print("\n" + "=" * 80)
    print(f"{'Hạng':<6} {'Hybrid':<10} {'Dense(Norm)':<14} {'BM25(Norm)':<14} {'Tên món ăn':<25} {'Giá tiền':<12}")
    print("-" * 80)

    if not results:
        print("    (Không tìm thấy kết quả phù hợp)")
    else:
        for rank, res in enumerate(results, 1):
            name = res.get("name", "N/A")
            item = res.get("item", {})
            price = f"{item.get('price', 0):,} đ"
            bd = res.get("score_breakdown", {})
            h_score = res.get("hybrid_score", 0.0)
            d_norm = bd.get("dense_norm", 0.0)
            b_norm = bd.get("bm25_norm", 0.0)
            print(f"#{rank:<5} {h_score:<10.4f} {d_norm:<14.4f} {b_norm:<14.4f} {name:<25} {price:<12}")

    # 5. Đánh giá Gate 2 Performance
    print("\n" + "=" * 80)
    print(f"⏱️  KẾT QUẢ ĐO HIỆU NĂNG TOÀN TRÌNH (GATE 2 PERFORMANCE CHECK):")
    print(f"   • Thời gian truy xuất lai (Hybrid Latency): {t_run:.4f} ms")
    print(f"   • Tiêu chuẩn nghiệm thu Gate 2:              < 20.000 ms")
    print(f"   • Đánh giá cổng nghiệm thu:                  {'✅ ĐẠT CHUẨN (Vượt tiêu chuẩn 50x)' if t_run < 20.0 else '❌ KHÔNG ĐẠT'}")
    print("=" * 80)


if __name__ == "__main__":
    q = sys.argv[1] if len(sys.argv) > 1 else "phở bò không cay"
    k = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    a = float(sys.argv[3]) if len(sys.argv) > 3 else 0.6
    run_benchmark(q, k, a)
