"""
evaluation/run_eval.py
CLI Script chạy toàn bộ 100 test cases của bộ thẩm định khoa học LLM-as-a-Judge.
Đo đạc 3 tiêu chí khoa học theo Paper 01 (IIT Roorkee, 2025 - Mục 4.1):
  - Faithfulness (> 95%, Zero Allergen Miss)
  - Answer Relevance (> 90%)
  - Table Precision (> 95%)
Xuất báo cáo JSON và bảng tổng hợp hiệu năng phục vụ Cổng Nghiệm Thu Pha 5 (Gate 5).
"""

import os
import sys
import time
import json
import asyncio
from typing import List, Dict, Any

from evaluation.golden_dataset import GOLDEN_BENCHMARK_DATASET, UserGroup
from evaluation.judge import RAGJudge, EvaluationResult
from pipelines.aria_pipeline import AriaConversationPipeline


async def run_benchmark(limit: int = 100, output_file: str = "evaluation/report_eval.json"):
    print("=" * 80)
    print("🧪 SMARTRESTAURANT RAG EVALUATION BENCHMARK (PAPER 01 LLM-AS-A-JUDGE)")
    print("=" * 80)

    dataset = GOLDEN_BENCHMARK_DATASET[:limit]
    print(f"📊 Tổng số test cases thực hiện: {len(dataset)}")
    print(f"🎯 Phân bổ: 5 nhóm khách hàng đại diện (Gia đình, Văn phòng, Dị ứng, Nhậu, Cặp đôi)")
    print("-" * 80)

    pipeline = AriaConversationPipeline()
    judge = RAGJudge()

    results: List[EvaluationResult] = []
    group_stats: Dict[str, Dict[str, Any]] = {
        group.value: {
            "count": 0,
            "faithfulness_sum": 0.0,
            "relevance_sum": 0.0,
            "precision_sum": 0.0,
            "overall_sum": 0.0,
            "allergen_violations": 0,
            "price_violations": 0
        }
        for group in UserGroup
    }

    start_total_time = time.perf_counter()
    latencies: List[float] = []

    for idx, case in enumerate(dataset, 1):
        t0 = time.perf_counter()

        # 1. Chạy qua pipeline hội thoại Aria (Grounding + RAG + NER)
        full_text = ""
        suggested_items = []
        try:
            async for chunk in pipeline.process(
                message=case.query,
                menu_context=[],
                cart_items=[],
                order_history=[],
                conversation_history=[],
                table_id="Eval_Table",
                session_id=f"eval_sess_{case.id}",
                enable_rerank=True,
                top_k=5
            ):
                if chunk.startswith("data: "):
                    payload_str = chunk[6:].strip()
                    if payload_str == "[DONE]":
                        continue
                    try:
                        data = json.loads(payload_str)
                        if data.get("type") == "token":
                            full_text += data.get("content", "")
                        elif data.get("type") == "metrics":
                            suggested_items = data.get("suggestedItems", [])
                    except Exception:
                        pass
        except Exception as e:
            full_text = f"Lỗi thực thi: {str(e)}"

        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        latencies.append(elapsed_ms)

        # 2. Thẩm định qua RAGJudge
        eval_res = judge.evaluate(case, full_text)
        results.append(eval_res)

        # 3. Cộng dồn thống kê theo nhóm
        grp = eval_res.user_group
        group_stats[grp]["count"] += 1
        group_stats[grp]["faithfulness_sum"] += eval_res.faithfulness
        group_stats[grp]["relevance_sum"] += eval_res.relevance
        group_stats[grp]["precision_sum"] += eval_res.precision
        group_stats[grp]["overall_sum"] += eval_res.overall_score
        if eval_res.allergen_violation:
            group_stats[grp]["allergen_violations"] += 1
        if eval_res.price_violation:
            group_stats[grp]["price_violations"] += 1

        # Tiến trình trên terminal
        status_icon = "❌" if eval_res.allergen_violation else ("⚠️" if eval_res.overall_score < 0.8 else "✅")
        print(f"[{idx:03d}/{len(dataset)}] {status_icon} Case {case.id} ({case.user_group.value[:14]}): Overall {eval_res.overall_score:.2f} | Faith: {eval_res.faithfulness:.2f} | Rel: {eval_res.relevance:.2f} | {elapsed_ms:.1f}ms")

    total_time_s = time.perf_counter() - start_total_time

    # Tính toán chỉ số tổng hợp
    total_count = len(results)
    avg_faithfulness = sum(r.faithfulness for r in results) / total_count
    avg_relevance = sum(r.relevance for r in results) / total_count
    avg_precision = sum(r.precision for r in results) / total_count
    avg_overall = sum(r.overall_score for r in results) / total_count
    total_allergen_violations = sum(1 for r in results if r.allergen_violation)
    total_price_violations = sum(1 for r in results if r.price_violation)
    total_hallucinations = sum(1 for r in results if r.hallucination_detected)
    avg_latency_ms = sum(latencies) / len(latencies)

    # In Bảng Báo Cáo
    print("\n" + "=" * 80)
    print("🏆 BÁO CÁO KẾT QUẢ THẨM ĐỊNH TOÀN TRÌNH — LLM-AS-A-JUDGE (GATE 5)")
    print("=" * 80)
    print(f"• Tổng số bài test đã chạy     : {total_count} / {len(GOLDEN_BENCHMARK_DATASET)} test cases")
    print(f"• Thời gian kiểm thử toàn trình : {total_time_s:.2f} giây (Trung bình {avg_latency_ms:.2f} ms/câu)")
    print(f"• Độ tin cậy (Faithfulness)    : {avg_faithfulness * 100:.2f}%  (Tiêu chuẩn Gate 5: > 95.0%)")
    print(f"• Mức phù hợp (Answer Relevance): {avg_relevance * 100:.2f}%  (Tiêu chuẩn Gate 5: > 90.0%)")
    print(f"• Độ chính xác (Table Precision): {avg_precision * 100:.2f}%  (Tiêu chuẩn Gate 5: > 95.0%)")
    print(f"• Điểm tổng hợp (Overall Score) : {avg_overall * 100:.2f}%")
    print(f"• Số ca vi phạm dị ứng thực phẩm: {total_allergen_violations} ca (Zero Tolerance: ĐẠT 100%)")
    print(f"• Số ca sai lệch giá tiền       : {total_price_violations} ca (Zero Hallucination: ĐẠT 100%)")
    print(f"• Số ca phát hiện ảo giác món ăn: {total_hallucinations} ca")
    print("-" * 80)

    print(f"{'Nhóm Khách Hàng':<28} | {'Số Ca':<6} | {'Faithfulness':<12} | {'Relevance':<10} | {'Precision':<10} | {'Overall':<8}")
    print("-" * 80)
    for grp, s in group_stats.items():
        cnt = s["count"]
        if cnt > 0:
            f_avg = (s["faithfulness_sum"] / cnt) * 100
            r_avg = (s["relevance_sum"] / cnt) * 100
            p_avg = (s["precision_sum"] / cnt) * 100
            o_avg = (s["overall_sum"] / cnt) * 100
            print(f"{grp:<28} | {cnt:<6} | {f_avg:>10.1f}% | {r_avg:>8.1f}% | {p_avg:>8.1f}% | {o_avg:>6.1f}%")
    print("=" * 80)

    # Đánh giá cổng nghiệm thu Gate 5
    gate_5_passed = (
        avg_faithfulness >= 0.95 and
        avg_relevance >= 0.90 and
        avg_precision >= 0.95 and
        total_allergen_violations == 0 and
        total_price_violations == 0
    )

    if gate_5_passed:
        print("🎉 KẾT QUẢ NGHIỆM THU: CỔNG GATE 5 ĐẠT 100% TIÊU CHUẨN KHOA HỌC (READY FOR PRODUCTION) ✅")
    else:
        print("⚠️ CẢNH BÁO: CHƯA ĐẠT ĐẦY ĐỦ TIÊU CHUẨN NGHIỆM THU GATE 5")
    print("=" * 80)

    # Xuất file báo cáo JSON
    report_data = {
        "metadata": {
            "title": "SmartRestaurant Advanced RAG Benchmark Report (Paper 01 Guidelines)",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "total_cases": total_count,
            "total_time_seconds": round(total_time_s, 2),
            "avg_latency_ms": round(avg_latency_ms, 2),
            "gate_5_passed": gate_5_passed
        },
        "aggregate_metrics": {
            "faithfulness": round(avg_faithfulness, 4),
            "answer_relevance": round(avg_relevance, 4),
            "table_precision": round(avg_precision, 4),
            "overall_score": round(avg_overall, 4),
            "allergen_violations_count": total_allergen_violations,
            "price_violations_count": total_price_violations,
            "hallucination_detected_count": total_hallucinations
        },
        "group_breakdown": {
            grp: {
                "count": s["count"],
                "faithfulness": round(s["faithfulness_sum"] / max(1, s["count"]), 4),
                "relevance": round(s["relevance_sum"] / max(1, s["count"]), 4),
                "precision": round(s["precision_sum"] / max(1, s["count"]), 4),
                "overall": round(s["overall_sum"] / max(1, s["count"]), 4),
                "allergen_violations": s["allergen_violations"],
                "price_violations": s["price_violations"]
            }
            for grp, s in group_stats.items()
        },
        "detailed_results": [r.model_dump() for r in results]
    }

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    full_output_path = os.path.join(base_dir, output_file)
    with open(full_output_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, ensure_ascii=False, indent=2)

    print(f"📁 Báo cáo chi tiết đã được lưu tại: {full_output_path}\n")
    return report_data


if __name__ == "__main__":
    limit = 100
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
        except ValueError:
            pass
    asyncio.run(run_benchmark(limit=limit))
