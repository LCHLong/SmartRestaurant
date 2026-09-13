"""
Module: index_manager.py
Thuộc Bước 2.1 - Pha 2: Cấu hình Môi Trường, FAISS HNSW & BM25 Corpus
Theo nghiên cứu "Advancing RAG for Structured Enterprise Data" (Paper 01)

Chức năng:
1. Xây dựng và quản lý chỉ mục Dense Vector FAISS HNSW ($M=32, efConstruction=200, efSearch=50$).
2. Xây dựng và quản lý chỉ mục Sparse Inverted Index BM25 Okapi với bộ tách từ tiếng Việt.
3. Hỗ trợ lưu trữ bền vững ra đĩa (.bin, .pkl) và nạp tức thì vào RAM khi khởi động.
4. Tích hợp cơ chế Fallback thuần túy (Pure-Numpy) khi môi trường chưa cài FAISS nhị phân.
"""

import os
import math
import pickle
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional, Union
import numpy as np

from processors.vietnamese_tokenizer import tokenize_vietnamese

# Thử import faiss và rank_bm25 nếu môi trường đã cài đặt
try:
    import faiss
    HAS_FAISS = True
except ImportError:
    faiss = None
    HAS_FAISS = False

try:
    from rank_bm25 import BM25Okapi
    HAS_RANK_BM25 = True
except ImportError:
    BM25Okapi = None
    HAS_RANK_BM25 = False


class SimpleBM25Fallback:
    """Bộ cài đặt BM25 Okapi thuần túy bằng Python khi chưa cài thư viện rank-bm25."""
    def __init__(self, corpus_tokens: List[List[str]], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus_size = len(corpus_tokens)
        self.doc_lens = [len(doc) for doc in corpus_tokens]
        self.avg_doc_len = sum(self.doc_lens) / self.corpus_size if self.corpus_size > 0 else 1.0

        # Đếm tần suất tài liệu chứa từ (DF)
        self.doc_freqs: Dict[str, int] = {}
        for doc in corpus_tokens:
            for term in set(doc):
                self.doc_freqs[term] = self.doc_freqs.get(term, 0) + 1

        # Tính toán IDF
        self.idf: Dict[str, float] = {}
        for term, df in self.doc_freqs.items():
            self.idf[term] = math.log((self.corpus_size - df + 0.5) / (df + 0.5) + 1.0)

        # Lưu tần suất từ trong từng tài liệu (TF)
        self.doc_term_freqs: List[Dict[str, int]] = []
        for doc in corpus_tokens:
            tfs: Dict[str, int] = {}
            for term in doc:
                tfs[term] = tfs.get(term, 0) + 1
            self.doc_term_freqs.append(tfs)

    def get_scores(self, query_tokens: List[str]) -> np.ndarray:
        scores = np.zeros(self.corpus_size, dtype=np.float32)
        for i in range(self.corpus_size):
            doc_len = self.doc_lens[i]
            tfs = self.doc_term_freqs[i]
            score = 0.0
            for term in query_tokens:
                if term in tfs:
                    freq = tfs[term]
                    idf_val = self.idf.get(term, 0.0)
                    denom = freq + self.k1 * (1 - self.b + self.b * (doc_len / self.avg_doc_len))
                    score += idf_val * (freq * (self.k1 + 1)) / denom
            scores[i] = score
        return scores


class DualIndexManager:
    """
    Quản lý kho chỉ mục kép:
    - Dense Index: FAISS HNSW (Cosine/L2, dimension 768, M=32)
    - Sparse Index: BM25 Okapi với Tokenizer tiếng Việt
    """
    def __init__(
        self,
        dimension: int = 768,
        m: int = 32,
        ef_construction: int = 200,
        ef_search: int = 50,
        storage_dir: Optional[Union[str, Path]] = None,
    ):
        self.dimension = dimension
        self.m = m
        self.ef_construction = ef_construction
        self.ef_search = ef_search

        if storage_dir is None:
            base_path = Path(__file__).resolve().parent.parent
            self.storage_dir = base_path / "data" / "indexes"
        else:
            self.storage_dir = Path(storage_dir)

        self.storage_dir.mkdir(parents=True, exist_ok=True)

        # Khởi tạo đối tượng chỉ mục
        self.faiss_index = None
        self.bm25 = None
        self.corpus_items: List[Dict[str, Any]] = []
        self.serialized_texts: List[str] = []
        self.numpy_embeddings: Optional[np.ndarray] = None  # Phục vụ fallback hoặc serialization

        self._init_faiss_index()

    def _init_faiss_index(self):
        """Khởi tạo cấu trúc FAISS HNSW Flat."""
        if HAS_FAISS:
            # Dùng inner product trên vector đã chuẩn hóa L2 tương đương với Cosine Similarity
            self.faiss_index = faiss.IndexHNSWFlat(self.dimension, self.m, faiss.METRIC_INNER_PRODUCT)
            self.faiss_index.hnsw.efConstruction = self.ef_construction
            self.faiss_index.hnsw.efSearch = self.ef_search
        else:
            self.faiss_index = None

    def build_indexes(
        self,
        raw_items: List[Dict[str, Any]],
        serialized_texts: List[str],
        embeddings: Optional[np.ndarray] = None,
    ):
        """
        Xây dựng cả 2 bộ chỉ mục FAISS HNSW và BM25 Okapi từ dữ liệu đã tuần tự hóa.
        
        Args:
            raw_items: Danh sách bản ghi gốc (dict) của món ăn hoặc chính sách
            serialized_texts: Danh sách chuỗi văn bản đã tuần tự hóa tương ứng
            embeddings: Ma trận vector numpy shape (N, dimension). Nếu None, khởi tạo vector ngẫu nhiên cho testing.
        """
        if len(raw_items) != len(serialized_texts):
            raise ValueError("Số lượng raw_items và serialized_texts phải bằng nhau!")

        self.corpus_items = raw_items
        self.serialized_texts = serialized_texts
        n_items = len(raw_items)

        # --- 1. Xây dựng BM25 Sparse Index ---
        tokenized_corpus = [tokenize_vietnamese(text) for text in serialized_texts]
        if HAS_RANK_BM25:
            self.bm25 = BM25Okapi(tokenized_corpus)
        else:
            self.bm25 = SimpleBM25Fallback(tokenized_corpus)

        # --- 2. Xây dựng FAISS Dense Index ---
        if embeddings is None:
            # Tạo ma trận embeddings mẫu chuẩn hóa L2 (dùng cho testing/benchmarking)
            rng = np.random.default_rng(seed=42)
            random_emb = rng.standard_normal((n_items, self.dimension)).astype(np.float32)
            # Chuẩn hóa L2 để cosine similarity = dot product
            norms = np.linalg.norm(random_emb, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            embeddings = random_emb / norms

        self.numpy_embeddings = np.ascontiguousarray(embeddings.astype(np.float32))

        if HAS_FAISS:
            self._init_faiss_index()
            self.faiss_index.add(self.numpy_embeddings)

    def search_dense(self, query_embedding: np.ndarray, top_k: int = 20) -> List[Tuple[int, float]]:
        """
        Tìm kiếm lân cận vector (Dense Search) trả về danh sách (index, similarity_score).
        """
        if len(self.corpus_items) == 0:
            return []

        top_k = min(top_k, len(self.corpus_items))
        q_emb = np.ascontiguousarray(query_embedding.reshape(1, -1).astype(np.float32))
        # Chuẩn hóa vector truy vấn
        q_norm = np.linalg.norm(q_emb)
        if q_norm > 0:
            q_emb = q_emb / q_norm

        if HAS_FAISS and self.faiss_index is not None:
            scores, indices = self.faiss_index.search(q_emb, top_k)
            results = []
            for idx, score in zip(indices[0], scores[0]):
                if idx != -1:
                    results.append((int(idx), float(score)))
            return results
        else:
            # Fallback tính cosine trực tiếp bằng numpy
            dot_products = np.dot(self.numpy_embeddings, q_emb.T).flatten()
            top_indices = np.argsort(dot_products)[::-1][:top_k]
            return [(int(idx), float(dot_products[idx])) for idx in top_indices]

    def search_sparse(self, query_text: str, top_k: int = 20) -> List[Tuple[int, float]]:
        """
        Tìm kiếm từ khóa chính xác (BM25 Sparse Search) trả về danh sách (index, bm25_score).
        """
        if len(self.corpus_items) == 0 or self.bm25 is None:
            return []

        top_k = min(top_k, len(self.corpus_items))
        query_tokens = tokenize_vietnamese(query_text)
        if not query_tokens:
            return []

        raw_scores = self.bm25.get_scores(query_tokens)
        top_indices = np.argsort(raw_scores)[::-1][:top_k]

        return [(int(idx), float(raw_scores[idx])) for idx in top_indices if raw_scores[idx] > 0]

    def save_to_disk(self, prefix: str = "menu"):
        """Lưu toàn bộ chỉ mục nhị phân và dữ liệu ánh xạ ra thư mục storage_dir."""
        # 1. Lưu FAISS index (.bin)
        faiss_file = self.storage_dir / f"{prefix}_faiss.bin"
        if HAS_FAISS and self.faiss_index is not None:
            faiss.write_index(self.faiss_index, str(faiss_file))

        # Lưu numpy embeddings dự phòng
        emb_file = self.storage_dir / f"{prefix}_embeddings.npy"
        if self.numpy_embeddings is not None:
            np.save(str(emb_file), self.numpy_embeddings)

        # 2. Lưu BM25 index (.pkl)
        bm25_file = self.storage_dir / f"{prefix}_bm25.pkl"
        with open(bm25_file, "wb") as f:
            pickle.dump(self.bm25, f)

        # 3. Lưu Metadata corpus items (.json)
        meta_file = self.storage_dir / f"{prefix}_corpus_meta.json"
        with open(meta_file, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "items": self.corpus_items,
                    "serialized": self.serialized_texts,
                    "dimension": self.dimension,
                    "total_count": len(self.corpus_items),
                },
                f,
                ensure_ascii=False,
                indent=2,
            )

    def load_from_disk(self, prefix: str = "menu") -> bool:
        """Nạp chỉ mục và metadata đã lưu từ đĩa vào RAM."""
        meta_file = self.storage_dir / f"{prefix}_corpus_meta.json"
        bm25_file = self.storage_dir / f"{prefix}_bm25.pkl"
        faiss_file = self.storage_dir / f"{prefix}_faiss.bin"
        emb_file = self.storage_dir / f"{prefix}_embeddings.npy"

        if not meta_file.exists():
            return False

        try:
            # 1. Nạp metadata
            with open(meta_file, "r", encoding="utf-8") as f:
                meta = json.load(f)
                self.corpus_items = meta.get("items", [])
                self.serialized_texts = meta.get("serialized", [])
                self.dimension = meta.get("dimension", 768)

            # 2. Nạp BM25
            if bm25_file.exists():
                with open(bm25_file, "rb") as f:
                    self.bm25 = pickle.load(f)

            # 3. Nạp Embeddings & FAISS
            if emb_file.exists():
                self.numpy_embeddings = np.load(str(emb_file))

            if HAS_FAISS and faiss_file.exists():
                self.faiss_index = faiss.read_index(str(faiss_file))
                self.faiss_index.hnsw.efSearch = self.ef_search

            return True
        except Exception as e:
            print(f"⚠️ Lỗi khi nạp chỉ mục từ đĩa ({prefix}): {e}")
            return False
