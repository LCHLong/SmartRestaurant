#!/usr/bin/env python3
"""
Script: verify_step32_reranker.py
Công dụng: Kiểm chứng hoạt động của Bước 3.2 (Cross-Encoder Contextual Reranking)
So sánh trực quan kết quả TRƯỚC và SAU khi qua tầng Reranker.
"""

import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from processors.hybrid_retriever import HybridMenuRetriever


def verify_reranker(query: str = "phở bò đặc sản", top_k: int = 5, rerank_weight: float = 0.7):
    print("\n" + "=" * 95)
    print("🎯 KIỂM TRA ĐỘ CHÍNH XÁC & TÁI XẾP HẠNG BƯỚC 3.2: CROSS-ENCODER CONTEXTUAL RERANKER")
    print("=" * 95)
    print(f"🔍 Câu hỏi kiểm thử: \"{query}\"")
    print(f"⚖️  Trọng số Reranker: weight = {rerank_weight:.1f} (Rerank: {rerank_weight*100:.0f}% | Hybrid Prior: {(1-rerank_weight)*100:.0f}%)")
    print(f"🎯 Số lượng Top-K: {top_k}")
    print("-" * 95)

    # Khởi tạo retriever
    retriever = HybridMenuRetriever(index_type="menu")
    if len(retriever.index_manager.corpus_items) == 0:
        print("❌ Chỉ mục trống. Vui lòng chạy: python scripts/build_indexes.py")
        return

    # 1. Chạy TRƯỚC khi Rerank (Chỉ Hybrid + Filter)
    t0_hybrid = time.perf_counter()
    results_before = retriever.retrieve(query=query, top_k=top_k, enable_rerank=False)
    time_hybrid = (time.perf_counter() - t0_hybrid) * 1000

    # 2. Chạy SAU khi Rerank (Hybrid + Filter + Cross-Encoder Rerank)
    t0_rerank = time.perf_counter()
    results_after = retriever.retrieve(query=query, top_k=top_k, enable_rerank=True, rerank_weight=rerank_weight)
    time_total = (time.perf_counter() - t0_rerank) * 1000
    rerank_stats = retriever.last_rerank_stats or {}

    if not results_after:
        print("⚠️ Không có món ăn nào thỏa mãn (có thể do bộ lọc dị ứng hoặc ăn chay ở Bước 3.1 loại bỏ).")
        print("💡 Hãy thử câu hỏi khác như: 'phở bò đặc sản', 'món nước đậm đà', 'bún bò huế'.")
        return

    # 3. Hiển thị bảng kết quả so sánh
    print(f"\n📊 BẢNG SO SÁNH KẾT QUẢ TRƯỚC VS SAU KHI QUA CROSS-ENCODER RERANKER:")
    print("-" * 95)
    header = f"{'#Init':<7} {'#Final':<8} {'Biến động':<15} {'Tên món ăn':<28} {'Điểm Hybrid':<13} {'Điểm Rerank':<13} {'Điểm Chung'}"
    print(header)
    print("-" * 95)

    for item in results_after:
        init_rank = item.get("initial_rank", "-")
        final_rank = item.get("final_rank", "-")
        name = item.get("name", "N/A")
        h_score = item.get("hybrid_score", 0.0)
        r_score = item.get("rerank_score", 0.0)
        c_score = item.get("combined_score", 0.0)

        # Tính toán mũi tên biến động
        if isinstance(init_rank, int) and isinstance(final_rank, int):
            delta = init_rank - final_rank
            if delta > 0:
                change = f"🔺 +{delta} (Lên)"
            elif delta < 0:
                change = f"🔻 {delta} (Xuống)"
            else:
                change = f"⏸️  Giữ nguyên"
        else:
            change = "N/A"

        init_str = f"#{init_rank}" if isinstance(init_rank, int) else "-"
        final_str = f"#{final_rank}" if isinstance(final_rank, int) else "-"

        print(f"{init_str:<7} {final_str:<8} {change:<15} {name:<28} {h_score:<13.4f} {r_score:<13.4f} {c_score:<10.4f}")

    # 4. Đánh giá chất lượng và SLA
    engine = str(rerank_stats.get("engine", getattr(retriever.reranker, "active_engine", "fallback")))
    rerank_ms = rerank_stats.get("rerank_time_ms", 0.0)
    
    print("-" * 95)
    print(f"⏱️  CHỈ SỐ HIỆU NĂNG & ĐỘ TRỄ (GATE 3 SLA CHECK):")
    print(f"   • Động cơ Reranker đang dùng:   {engine.upper()}")
    print(f"   • Thời gian Reranking:           {rerank_ms:.4f} ms (Chuẩn Paper 01 SLA: < 25.0 ms)")
    print(f"   • Thời gian toàn trình Pipeline: {time_total:.4f} ms")
    print(f"   • Đánh giá SLA:                  {'✅ ĐẠT CHUẨN (Cực nhanh)' if rerank_ms < 25.0 else '❌ VƯỢT QUÁ SLA'}")
    print("=" * 95 + "\n")


if __name__ == "__main__":
    q = sys.argv[1] if len(sys.argv) > 1 else "phở bò đặc sản"
    k = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    w = float(sys.argv[3]) if len(sys.argv) > 3 else 0.7
    verify_reranker(q, k, w)
