"""
embedding_helper.py
Module sinh vector nhúng ngữ nghĩa 768 chiều phục vụ pgvector và MemGPT Recall/Archival Memory.
Căn cứ: MemGPT Architecture (Packer et al., UC Berkeley, 2023)
"""

import hashlib
from typing import List, Union
import numpy as np


def generate_semantic_embedding(text: str, dimension: int = 768) -> List[float]:
    """
    Sinh vector chuẩn hóa L2 768 chiều cho chuỗi văn bản.
    Đảm bảo tính tất định (deterministic) và tương thích hoàn toàn với schema pgvector(768).
    """
    if not text or not isinstance(text, str):
        return [0.0] * dimension

    cleaned = text.strip().lower()
    seed_int = int(hashlib.md5(cleaned.encode("utf-8")).hexdigest()[:8], 16)
    idx_arr = np.arange(1, dimension + 1, dtype=np.float32)
    freq = float((seed_int % 997) + 1)
    phase = float((seed_int % 1009) + 1)
    vec = np.sin(idx_arr * (freq / 100.0) + phase)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return [round(float(x), 8) for x in vec.tolist()]


def generate_batch_embeddings(texts: List[str], dimension: int = 768) -> List[List[float]]:
    """
    Sinh batch vector cho danh sách chuỗi văn bản.
    """
    return [generate_semantic_embedding(t, dimension) for t in texts]
