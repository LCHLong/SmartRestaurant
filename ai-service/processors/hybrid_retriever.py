"""
Module: hybrid_retriever.py
Thuộc Bước 2.2 - Pha 2: Xây dựng Lớp HybridMenuRetriever & Min-Max Score Normalization
Theo nghiên cứu "Advancing RAG for Structured Enterprise Data" (Paper 01, Mục 3.3.3)

Chức năng:
1. Kết hợp đồng thời 2 luồng truy xuất:
   - Dense Semantic Search (FAISS HNSW / Cosine Similarity 768 chiều)
   - Sparse Keyword Search (BM25 Okapi với Tokenizer tiếng Việt ẩm thực)
2. Chuẩn hóa điểm số Min-Max Normalization về thang đo đồng nhất [0, 1] có bảo vệ chống chia cho 0.
3. Dung hợp điểm số theo trọng số tối ưu Paper 01:
   Score = 0.6 * Dense_norm + 0.4 * BM25_norm
4. Trả về Top-K ứng viên kèm phân rã chi tiết điểm số (Explainable Score Breakdown) phục vụ Reranker.
"""

import math
import hashlib
from typing import List, Dict, Any, Tuple, Optional, Union
import numpy as np

import time
from processors.index_manager import DualIndexManager
from processors.metadata_filter import CulinaryEntityExtractor, MetadataFilter, ExtractedEntities
from processors.cross_encoder_reranker import CrossEncoderReranker


def min_max_normalize(scores_dict: Dict[int, float], eps: float = 1e-9) -> Dict[int, float]:
    """
    Chuẩn hóa các giá trị điểm số về khoảng [0, 1] bằng Min-Max Scaling.
    
    Công thức:
        S_norm = (S - min) / (max - min + eps)
        
    Xử lý trường hợp biên:
        - Nếu tập điểm rỗng: trả về dict rỗng.
        - Nếu min == max:
            + Nếu max > 0: tất cả được gán 1.0.
            + Nếu max <= 0: tất cả được gán 0.0.
            
    Args:
        scores_dict: Dict ánh xạ {index: raw_score}
        eps: Epsilon chống lỗi chia cho 0 (mặc định 1e-9)
        
    Returns:
        Dict ánh xạ {index: normalized_score} với giá trị trong [0.0, 1.0]
    """
    if not scores_dict:
        return {}

    values = list(scores_dict.values())
    min_val = min(values)
    max_val = max(values)

    # Trường hợp đặc biệt: Tất cả các điểm bằng nhau
    if math.isclose(min_val, max_val, abs_tol=eps):
        fallback_val = 1.0 if max_val > 0 else 0.0
        return {idx: fallback_val for idx in scores_dict}

    denom = max_val - min_val
    normalized = {}
    for idx, score in scores_dict.items():
        norm_val = (score - min_val) / denom
        # Giới hạn chặt chẽ trong [0.0, 1.0] để tránh sai số dấu phẩy động
        normalized[idx] = float(np.clip(norm_val, 0.0, 1.0))

    return normalized


class HybridMenuRetriever:
    """
    Bộ truy xuất lai (Hybrid Retriever) kết hợp Dense Vector (FAISS HNSW)
    và Sparse Inverted Index (BM25 Okapi) cho hệ thống gợi ý thực đơn nhà hàng.
    """

    def __init__(
        self,
        index_manager: Optional[DualIndexManager] = None,
        default_alpha: float = 0.6,
        index_type: str = "menu",
    ):
        """
        Khởi tạo HybridMenuRetriever.
        
        Args:
            index_manager: Đối tượng DualIndexManager đã nạp dữ liệu. Nếu None, tự khởi tạo và nạp từ đĩa.
            default_alpha: Trọng số Dense Search (mặc định 0.6 theo Paper 01). BM25 có trọng số (1 - alpha) = 0.4.
            index_type: Loại chỉ mục ("menu" hoặc "policies").
        """
        self.default_alpha = float(np.clip(default_alpha, 0.0, 1.0))
        self.index_type = index_type

        if index_manager is not None:
            self.index_manager = index_manager
        else:
            self.index_manager = DualIndexManager()
            self.index_manager.load_from_disk(index_type)

        self._vector_cache: Dict[str, np.ndarray] = {}
        self.entity_extractor = CulinaryEntityExtractor()
        self.metadata_filter = MetadataFilter()
        self.reranker = CrossEncoderReranker()
        self.last_extracted_entities: Optional[ExtractedEntities] = None
        self.last_filter_stats: Dict[str, Any] = {}
        self.last_rerank_stats: Dict[str, Any] = {}

    def retrieve(
        self,
        query: str,
        query_vector: Optional[np.ndarray] = None,
        top_k: int = 20,
        alpha: Optional[float] = None,
        search_depth_multiplier: int = 2,
        auto_mock_vector: bool = False,
        enable_metadata_filter: bool = True,
        entities: Optional[ExtractedEntities] = None,
        enable_rerank: bool = True,
        rerank_weight: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """
        Thực hiện truy xuất kết hợp và xếp hạng Top-K ứng viên.
        
        Quy trình xử lý:
        1. Kiểm tra câu truy vấn hợp lệ.
        2. Bóc tách thực thể ẩm thực (F&B NER) nếu chỉ mục là 'menu' và bật lọc.
        3. Chạy Dense Search (FAISS HNSW) nếu có query_vector hoặc auto_mock_vector=True.
        4. Chạy Sparse Search (BM25 Okapi) với bộ tách từ tiếng Việt.
        5. Áp dụng Min-Max Normalization cho từng luồng điểm.
        6. Dung hợp điểm: Score = actual_alpha * Dense_norm + (1 - actual_alpha) * BM25_norm.
        7. Lọc cứng siêu dữ liệu (Metadata Hard-Filtering): loại bỏ 100% món dị ứng / sai ngân sách.
        8. Sắp xếp giảm dần và đóng gói kết quả đầy đủ metadata.
        
        Args:
            query: Chuỗi câu hỏi / từ khóa tìm kiếm của người dùng (vd: "Phở bò không cay")
            query_vector: Vector nhúng 768 chiều tương ứng với câu query
            top_k: Số lượng ứng viên cần trả về (mặc định 20)
            alpha: Trọng số Dense (None sẽ dùng default_alpha = 0.6)
            search_depth_multiplier: Hệ số mở rộng số ứng viên ban đầu cho mỗi luồng (mặc định 2)
            auto_mock_vector: Cho phép tự sinh vector giả lập khi không truyền query_vector (mặc định False)
            enable_metadata_filter: Bật tiền lọc cứng dựa trên thực thể dị ứng / ngân sách (mặc định True)
            entities: Đối tượng ExtractedEntities đã trích xuất sẵn (nếu có)
            
        Returns:
            Danh sách các Dict đại diện cho Top-K món ăn/chính sách, sắp xếp theo hybrid_score giảm dần.
        """
        if not query or not query.strip():
            return []

        if len(self.index_manager.corpus_items) == 0:
            return []

        # --- Bóc tách thực thể ẩm thực (F&B NER) ---
        extracted = entities
        if self.index_type == "menu" and enable_metadata_filter and extracted is None:
            extracted = self.entity_extractor.extract(query)
        self.last_extracted_entities = extracted

        alpha = self.default_alpha if alpha is None else float(np.clip(alpha, 0.0, 1.0))
        
        # Nếu có bộ lọc, mở rộng search_depth ban đầu để sau khi loại trừ vẫn đủ Top-K
        has_active_filters = bool(extracted and extracted.to_dict().get("has_filters", False))
        depth_mult = max(search_depth_multiplier, 3) if has_active_filters else search_depth_multiplier
        search_depth = min(max(top_k * depth_mult, 30), len(self.index_manager.corpus_items))

        # --- 1. Luồng Dense Search (Ngữ nghĩa) ---
        dense_raw_scores: Dict[int, float] = {}
        actual_alpha = alpha

        if query_vector is not None and alpha > 0.0:
            dense_matches = self.index_manager.search_dense(query_vector, top_k=search_depth)
            for idx, score in dense_matches:
                dense_raw_scores[idx] = float(score)
        elif query_vector is None:
            if auto_mock_vector and alpha > 0.0:
                mock_vec = self._create_deterministic_query_vector(query)
                dense_matches = self.index_manager.search_dense(mock_vec, top_k=search_depth)
                for idx, score in dense_matches:
                    dense_raw_scores[idx] = float(score)
            else:
                # Khi không truyền vector và không bật mock: dựa vào BM25 để đảm bảo độ chính xác
                actual_alpha = 0.0

        # --- 2. Luồng Sparse Search (BM25 Từ khóa) ---
        sparse_raw_scores: Dict[int, float] = {}
        if actual_alpha < 1.0:
            sparse_matches = self.index_manager.search_sparse(query, top_k=search_depth)
            for idx, score in sparse_matches:
                sparse_raw_scores[idx] = float(score)

        # --- 3. Chuẩn hóa Min-Max Score Normalization ---
        dense_norm_scores = min_max_normalize(dense_raw_scores)
        sparse_norm_scores = min_max_normalize(sparse_raw_scores)

        # --- 4. Dung hợp điểm số (Score Fusion) ---
        all_candidate_indices = set(dense_raw_scores.keys()).union(sparse_raw_scores.keys())
        if not all_candidate_indices:
            return []

        fusion_results = []
        for idx in all_candidate_indices:
            d_raw = dense_raw_scores.get(idx, 0.0)
            d_norm = dense_norm_scores.get(idx, 0.0)

            s_raw = sparse_raw_scores.get(idx, 0.0)
            s_norm = sparse_norm_scores.get(idx, 0.0)

            # Công thức dung hợp Paper 01: Score = actual_alpha * Dense + (1 - actual_alpha) * Sparse
            hybrid_score = (actual_alpha * d_norm) + ((1.0 - actual_alpha) * s_norm)

            doc_item = self.index_manager.corpus_items[idx]
            serialized_text = (
                self.index_manager.serialized_texts[idx]
                if idx < len(self.index_manager.serialized_texts)
                else ""
            )

            fusion_results.append({
                "index": int(idx),
                "id": doc_item.get("id"),
                "name": doc_item.get("name") or doc_item.get("title", f"Item #{idx}"),
                "item": doc_item,
                "serialized_text": serialized_text,
                "hybrid_score": round(float(hybrid_score), 4),
                "score_breakdown": {
                    "dense_raw": round(float(d_raw), 4),
                    "dense_norm": round(float(d_norm), 4),
                    "bm25_raw": round(float(s_raw), 4),
                    "bm25_norm": round(float(s_norm), 4),
                    "alpha": round(float(actual_alpha), 2),
                }
            })

        # --- 5. Sắp xếp giảm dần theo điểm số lai ---
        fusion_results.sort(key=lambda x: x["hybrid_score"], reverse=True)

        # --- 6. Tiền lọc cứng siêu dữ liệu (Metadata Hard-Filtering) ---
        if self.index_type == "menu" and enable_metadata_filter and has_active_filters and extracted:
            accepted, rejected = self.metadata_filter.filter_items(fusion_results, extracted, self.entity_extractor)
            self.last_filter_stats = {
                "total_before_filter": len(fusion_results),
                "accepted_count": len(accepted),
                "filtered_out_count": len(rejected),
                "rejected_items": [{"name": r["name"], "reason": r.get("rejection_reason")} for r in rejected[:10]]
            }
            final_candidates = accepted
        else:
            self.last_filter_stats = {
                "total_before_filter": len(fusion_results),
                "accepted_count": len(fusion_results),
                "filtered_out_count": 0,
                "rejected_items": []
            }
            final_candidates = fusion_results

        # --- 7. Tái xếp hạng ngữ cảnh sâu (Cross-Encoder Contextual Reranking - Bước 3.2) ---
        if enable_rerank and final_candidates:
            rerank_start = time.perf_counter()
            reranked = self.reranker.rerank(
                query=query,
                candidates=final_candidates,
                top_k=top_k,
                rerank_weight=rerank_weight
            )
            rerank_elapsed_ms = (time.perf_counter() - rerank_start) * 1000.0
            self.last_rerank_stats = {
                "enabled": True,
                "engine": self.reranker.active_engine,
                "latency_ms": round(rerank_elapsed_ms, 3),
                "input_count": len(final_candidates),
                "output_count": len(reranked),
            }
            return reranked
        else:
            self.last_rerank_stats = {
                "enabled": False,
                "engine": None,
                "latency_ms": 0.0,
                "input_count": len(final_candidates),
                "output_count": len(final_candidates[:top_k]),
            }
            return final_candidates[:top_k]

    def _create_deterministic_query_vector(self, query: str) -> np.ndarray:
        """
        Tạo vector chuẩn hóa L2 768 chiều giả lập có tính tất định dựa trên chuỗi query.
        Đảm bảo cùng một query sẽ luôn sinh ra cùng vector để phục vụ testing và chạy offline.
        """
        if query in self._vector_cache:
            return self._vector_cache[query]

        seed_int = int(hashlib.md5(query.encode("utf-8")).hexdigest()[:8], 16)
        dim = self.index_manager.dimension
        # Sinh vector lượng giác phân bố đều tất định siêu nhanh (< 0.01ms)
        idx_arr = np.arange(1, dim + 1, dtype=np.float32)
        freq = float((seed_int % 997) + 1)
        phase = float((seed_int % 1009) + 1)
        vec = np.sin(idx_arr * (freq / 100.0) + phase)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        self._vector_cache[query] = vec
        return vec
