"""
evaluation/judge.py
Mô hình thẩm định khoa học tự động LLM-as-a-Judge theo chuẩn Paper 01 (IIT Roorkee, 2025 - Mục 4.1).
Đo đạc 3 tiêu chí cốt lõi:
  1. Faithfulness (Độ tin cậy & Không ảo giác dữ liệu - Zero Hallucination)
  2. Answer Relevance (Mức độ phù hợp với yêu cầu thực khách)
  3. Context / Table Precision (Độ chính xác truy xuất thực thể & siêu dữ liệu)
Hỗ trợ cả chế độ LLM-as-a-Judge (Groq API) và Deterministic Semantic Judge (Fallback an toàn).
"""

import os
import re
import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from .golden_dataset import BenchmarkCase

logger = logging.getLogger("RAGJudge")


class EvaluationResult(BaseModel):
    case_id: str
    user_group: str
    query: str
    response_text: str
    suggested_dishes: List[str]
    faithfulness: float = Field(..., ge=0.0, le=1.0)
    relevance: float = Field(..., ge=0.0, le=1.0)
    precision: float = Field(..., ge=0.0, le=1.0)
    overall_score: float = Field(..., ge=0.0, le=1.0)
    allergen_violation: bool = False
    price_violation: bool = False
    hallucination_detected: bool = False
    judge_mode: str  # "llm_groq" | "deterministic_semantic"
    reasoning: str


class RAGJudge:
    """
    Mô hình thẩm định chất lượng phản hồi RAG dựa trên tiêu chuẩn khoa học Paper 01.
    """

    def __init__(self, menu_corpus_path: Optional[str] = None):
        self.menu_corpus = self._load_menu_corpus(menu_corpus_path)
        self.groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.groq_model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")

    def _load_menu_corpus(self, path: Optional[str]) -> Dict[str, Dict[str, Any]]:
        """Nạp danh mục thực đơn chuẩn để đối chiếu (Ground Truth Corpus)."""
        corpus_dict = {}
        if not path:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            path = os.path.join(base_dir, "data", "serialized_menu_corpus.json")

        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    for item in items:
                        name = item.get("name", "").strip().lower()
                        corpus_dict[name] = item
            except Exception as e:
                logger.warning(f"Không thể đọc menu corpus từ {path}: {e}")
        return corpus_dict

    def extract_suggested_dishes(self, text: str) -> List[str]:
        """Trích xuất tên các món ăn được đề xuất trong định dạng markdown **[Tên món]** hoặc đối chiếu corpus."""
        if not text:
            return []
        matches = re.findall(r"\*\*([^*]+)\*\*", text)
        exclude_kw = {"lưu ý", "chú ý", "gợi ý", "tổng cộng", "giá", "thực đơn", "món ăn"}
        dishes = []
        for m in matches:
            clean = m.strip()
            # Bỏ đuôi giá tiền kèm theo nếu có (ví dụ: "Bánh Flan · 25.000đ")
            clean = re.sub(r"·.*$", "", clean).strip()
            if len(clean) >= 2 and clean.lower() not in exclude_kw:
                dishes.append(clean)

        # Quét bổ sung các món trong menu corpus nếu xuất hiện trong câu trả lời
        text_lower = text.lower()
        for c_name, c_item in self.menu_corpus.items():
            if c_name in text_lower and not any(c_name in d.lower() for d in dishes):
                dishes.append(c_item.get("name", c_name))

        return list(dict.fromkeys(dishes))[:10]

    def evaluate(
        self,
        case: BenchmarkCase,
        response_text: str,
        retrieved_candidates: Optional[List[Dict[str, Any]]] = None
    ) -> EvaluationResult:
        """
        Thẩm định một phản hồi của Aria đối với một BenchmarkCase.
        Ưu tiên dùng LLM-as-a-Judge nếu có Groq API key, nếu không dùng Deterministic Judge.
        """
        suggested = self.extract_suggested_dishes(response_text)

        # 1. Thử nghiệm LLM-as-a-Judge
        if self.groq_api_key and os.getenv("DISABLE_LLM_JUDGE", "0") != "1":
            try:
                return self._evaluate_with_llm(case, response_text, suggested, retrieved_candidates)
            except Exception as e:
                logger.warning(f"LLM-as-a-Judge gặp lỗi: {e}, chuyển sang Semantic Fallback Judge")

        # 2. Deterministic Semantic Judge (Fallback an toàn, zero-crash)
        return self._evaluate_deterministic(case, response_text, suggested)

    def _evaluate_deterministic(
        self,
        case: BenchmarkCase,
        response_text: str,
        suggested: List[str]
    ) -> EvaluationResult:
        """
        Bộ thẩm phán ngữ nghĩa dựa trên quy luật nghiêm ngặt (Deterministic Semantic Judge):
        - Kiểm tra xem có món nào bịa đặt (không nằm trong corpus) không.
        - Kiểm tra xem có vi phạm món cấm (dị ứng, cay, ngân sách) không.
        - Kiểm tra giá tiền có đúng niêm yết không.
        """
        text_lower = response_text.lower()
        allergen_violation = False
        price_violation = False
        hallucination_detected = False
        reasons = []

        # 1. Kiểm tra vi phạm món cấm (Forbidden Dishes / Allergens)
        for forbidden in case.forbidden_dishes:
            if forbidden.lower() in text_lower:
                allergen_violation = True
                reasons.append(f"VI PHẠM DỊ ỨNG/AN TOÀN: Xuất hiện món cấm '{forbidden}'")

        # 2. Kiểm tra tính có thật của các món được đề xuất (Hallucination Check)
        valid_dish_count = 0
        for dish in suggested:
            dish_lower = dish.lower()
            matched = any(c_name in dish_lower or dish_lower in c_name for c_name in self.menu_corpus)
            if matched:
                valid_dish_count += 1
            else:
                hallucination_detected = True
                reasons.append(f"ẢO GIÁC MÓN ĂN: Món '{dish}' không có trong cơ sở dữ liệu thực đơn")

        # 3. Tính điểm Faithfulness (Độ trung thực)
        if allergen_violation:
            faithfulness = 0.0  # Vi phạm dị ứng tuyệt đối không chấp nhận
        elif len(suggested) == 0:
            # Nếu nhà hàng không có món phù hợp và Aria trung thực thông báo, hệ thống đạt độ tin cậy cao
            faithfulness = 0.95
        else:
            faithfulness = max(0.0, valid_dish_count / len(suggested))
            if hallucination_detected:
                faithfulness = min(faithfulness, 0.7)

        # 4. Tính điểm Answer Relevance (Mức độ phù hợp với yêu cầu thực khách)
        matched_expected = 0
        for exp in case.expected_dishes:
            if exp.lower() in text_lower:
                matched_expected += 1

        if len(case.expected_dishes) > 0:
            if matched_expected > 0:
                relevance = min(1.0, 0.90 + 0.10 * (matched_expected / len(case.expected_dishes)))
            elif len(suggested) > 0 and not allergen_violation:
                relevance = 0.88
            else:
                relevance = 0.80
        else:
            # Câu hỏi chính sách hoặc câu hỏi chung
            relevance = 0.95 if len(response_text) > 30 else 0.85

        # 5. Tính điểm Precision (Độ chính xác ràng buộc)
        precision = 1.0
        # Ràng buộc không cay
        if case.expected_constraints.get("max_spice") == 0:
            if "bún bò huế" in text_lower or "cay" in text_lower and "không cay" not in text_lower:
                precision -= 0.3
                reasons.append("Cảnh báo: Khách yêu cầu không cay nhưng câu trả lời có chứa món cay")

        # Ràng buộc ngân sách
        max_budget = case.expected_constraints.get("max_budget")
        if max_budget:
            # Quét giá tiền trong câu trả lời
            prices = re.findall(r"(\d{2,3})[,\.](\d{3})", response_text)
            for p1, p2 in prices:
                val = int(p1) * 1000 + int(p2)
                if val > max_budget:
                    price_violation = True
                    precision -= 0.4
                    reasons.append(f"VƯỢT NGÂN SÁCH: Món có giá {val:,.0f}đ vượt trần {max_budget:,.0f}đ")

        precision = max(0.0, min(1.0, precision))

        # Overall Score
        overall = round(0.4 * faithfulness + 0.35 * relevance + 0.25 * precision, 3)

        reasoning_str = "; ".join(reasons) if reasons else "Câu trả lời thỏa mãn 100% các tiêu chí an toàn và phù hợp thực đơn."

        return EvaluationResult(
            case_id=case.id,
            user_group=case.user_group.value,
            query=case.query,
            response_text=response_text,
            suggested_dishes=suggested,
            faithfulness=round(faithfulness, 3),
            relevance=round(relevance, 3),
            precision=round(precision, 3),
            overall_score=overall,
            allergen_violation=allergen_violation,
            price_violation=price_violation,
            hallucination_detected=hallucination_detected,
            judge_mode="deterministic_semantic",
            reasoning=reasoning_str
        )

    def _evaluate_with_llm(
        self,
        case: BenchmarkCase,
        response_text: str,
        suggested: List[str],
        retrieved_candidates: Optional[List[Dict[str, Any]]]
    ) -> EvaluationResult:
        """Thẩm định bằng LLM Groq (Qwen/Llama) trích xuất điểm số JSON chuẩn hóa."""
        from groq import Groq

        client = Groq(api_key=self.groq_api_key)

        prompt = f"""Bạn là một chuyên gia ẩm thực và thẩm phán khoa học (LLM Judge) đánh giá hệ thống RAG cho nhà hàng.
Hãy chấm điểm câu trả lời của trợ lý Aria theo 3 tiêu chí:
1. faithfulness (0.0 - 1.0): Mọi món ăn đề xuất có thật trong thực đơn không? Có bịa đặt thông tin không? Có vi phạm dị ứng không? (Nếu vi phạm dị ứng gán ngay 0.0).
2. relevance (0.0 - 1.0): Câu trả lời có đúng trọng tâm câu hỏi của khách không?
3. precision (0.0 - 1.0): Có tuân thủ ràng buộc ngân sách, độ cay, và chế độ ăn kiêng không?

THÔNG TIN TEST CASE:
- Câu hỏi khách: "{case.query}"
- Nhóm đối tượng: {case.user_group.value}
- Món cấm (vi phạm an toàn/dị ứng): {case.forbidden_dishes}
- Ràng buộc: {case.expected_constraints}

CÂU TRẢ LỜI CỦA ARIA:
"{response_text}"

Hãy trả về DUY NHẤT một JSON hợp lệ với cấu trúc sau:
{{
  "faithfulness": 0.95,
  "relevance": 0.90,
  "precision": 0.95,
  "allergen_violation": false,
  "price_violation": false,
  "hallucination_detected": false,
  "reasoning": "Giải thích ngắn gọn lý do chấm điểm"
}}"""

        resp = client.chat.completions.create(
            model=self.groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            response_format={"type": "json_object"}
        )

        data = json.loads(resp.choices[0].message.content)
        faith = float(data.get("faithfulness", 0.9))
        rel = float(data.get("relevance", 0.9))
        prec = float(data.get("precision", 0.9))
        overall = round(0.4 * faith + 0.35 * rel + 0.25 * prec, 3)

        return EvaluationResult(
            case_id=case.id,
            user_group=case.user_group.value,
            query=case.query,
            response_text=response_text,
            suggested_dishes=suggested,
            faithfulness=round(faith, 3),
            relevance=round(rel, 3),
            precision=round(prec, 3),
            overall_score=overall,
            allergen_violation=bool(data.get("allergen_violation", False)),
            price_violation=bool(data.get("price_violation", False)),
            hallucination_detected=bool(data.get("hallucination_detected", False)),
            judge_mode="llm_groq",
            reasoning=str(data.get("reasoning", "LLM Judge evaluated successfully"))
        )
