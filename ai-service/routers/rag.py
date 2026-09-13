"""
Router: rag.py
Thuộc Bước 2.3 - Pha 2: Xây dựng Endpoint Truy Xuất Độc Lập (FastAPI /rag/retrieve)
Theo nghiên cứu "Advancing RAG for Structured Enterprise Data" (Paper 01)

Endpoints:
- POST /rag/retrieve  — Truy xuất lai Top-K ứng viên (Dense + Sparse + Min-Max Fusion)
- GET  /rag/health    — Kiểm tra trạng thái hoạt động của các bộ chỉ mục RAG
"""

import time
from typing import List, Dict, Any, Optional
import numpy as np
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from processors.hybrid_retriever import HybridMenuRetriever

router = APIRouter(prefix="/rag", tags=["Advanced Hybrid RAG"])

# Singleton retrievers cho cả thực đơn và chính sách
_menu_retriever: Optional[HybridMenuRetriever] = None
_policies_retriever: Optional[HybridMenuRetriever] = None


def get_retriever(index_type: str = "menu") -> HybridMenuRetriever:
    """Lấy hoặc khởi tạo singleton instance của HybridMenuRetriever theo loại chỉ mục."""
    global _menu_retriever, _policies_retriever

    norm_type = index_type.lower().strip()
    if norm_type in ("policies", "policy", "restaurant_policies"):
        if _policies_retriever is None:
            _policies_retriever = HybridMenuRetriever(default_alpha=0.6, index_type="policies")
        return _policies_retriever
    else:
        if _menu_retriever is None:
            _menu_retriever = HybridMenuRetriever(default_alpha=0.6, index_type="menu")
        return _menu_retriever


# ---------- Pydantic Schemas ----------

class RetrieveRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Câu hỏi hoặc từ khóa tìm kiếm của khách hàng (vd: 'phở bò không cay')",
        examples=["phở bò không cay"]
    )
    top_k: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Số lượng ứng viên tối đa cần lấy về",
        examples=[10]
    )
    alpha: float = Field(
        default=0.6,
        ge=0.0,
        le=1.0,
        description="Trọng số Dense vector Cosine (mặc định 0.6 theo Paper 01). BM25 nhận trọng số (1 - alpha) = 0.4",
        examples=[0.6]
    )
    query_vector: Optional[List[float]] = Field(
        default=None,
        description="Vector nhúng 768 chiều tương ứng với câu query (nếu có từ mô hình embedding)"
    )
    index_type: str = Field(
        default="menu",
        description="Kho ngữ liệu cần truy xuất: 'menu' (thực đơn) hoặc 'policies' (chính sách nhà hàng)",
        examples=["menu"]
    )
    auto_mock_vector: bool = Field(
        default=False,
        description="Tự động sinh vector giả lập khi không truyền query_vector (phục vụ testing/offline)"
    )
    enable_metadata_filter: bool = Field(
        default=True,
        description="Bật bộ lọc siêu dữ liệu cứng (Metadata Hard-Filtering) loại trừ 100% món dị ứng hoặc vượt ngân sách"
    )


class RetrieveItemResponse(BaseModel):
    index: int = Field(..., description="Chỉ số bản ghi trong kho ngữ liệu")
    id: Optional[str] = Field(default=None, description="UUID bản ghi trong cơ sở dữ liệu")
    name: str = Field(..., description="Tên món ăn hoặc tiêu đề chính sách")
    item: Dict[str, Any] = Field(..., description="Dữ liệu gốc chi tiết của bản ghi")
    serialized_text: str = Field(default="", description="Chuỗi văn bản bán cấu trúc tuần tự hóa cấp hàng")
    hybrid_score: float = Field(..., description="Điểm số lai sau khi dung hợp (nằm trong [0, 1])")
    score_breakdown: Dict[str, Any] = Field(
        ...,
        description="Chi tiết phân rã điểm số: dense_raw, dense_norm, bm25_raw, bm25_norm, alpha"
    )


class RetrieveResponse(BaseModel):
    status: str = Field(default="success", description="Trạng thái phản hồi API")
    query: str = Field(..., description="Câu truy vấn đã xử lý")
    index_type: str = Field(..., description="Kho chỉ mục đã sử dụng ('menu' hoặc 'policies')")
    alpha: float = Field(..., description="Trọng số Dense áp dụng")
    total_matches: int = Field(..., description="Số lượng kết quả tìm thấy")
    latency_ms: float = Field(..., description="Thời gian thực thi thuật toán truy xuất lai (mili-giây)")
    extracted_entities: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Chi tiết các thực thể ẩm thực bóc tách được (dị ứng, ngân sách, độ cay, chế độ ăn)"
    )
    filtered_out_count: int = Field(
        default=0,
        description="Số lượng ứng viên bị loại bỏ bởi bộ lọc cứng siêu dữ liệu an toàn"
    )
    results: List[RetrieveItemResponse] = Field(..., description="Danh sách kết quả Top-K đã xếp hạng")


class RagHealthResponse(BaseModel):
    status: str = "ok"
    service: str = "advanced-hybrid-rag"
    paper_reference: str = "Advancing RAG for Structured Enterprise Data (IIT Roorkee 2025)"
    menu_index: Dict[str, Any]
    policies_index: Dict[str, Any]


# ---------- API Endpoints ----------

@router.post(
    "/retrieve",
    response_model=RetrieveResponse,
    status_code=status.HTTP_200_OK,
    summary="Truy xuất lai Top-K ứng viên (Dense + Sparse + Min-Max Score Fusion + Metadata Filter)",
    description="Endpoint độc lập cho phép Gateway gọi sang để tìm kiếm các món ăn hoặc chính sách phù hợp nhất."
)
async def retrieve_candidates(request: RetrieveRequest) -> RetrieveResponse:
    """
    Thực thi thuật toán Hybrid Retrieval:
    1. Tiếp nhận câu hỏi & các tham số kiểm soát (top_k, alpha, enable_metadata_filter).
    2. Bóc tách thực thể F&B NER (dị ứng, chế độ ăn, độ cay, ngân sách).
    3. Gọi bộ chỉ mục kép Dense FAISS HNSW + Sparse BM25 Okapi.
    4. Co giãn Min-Max điểm số về [0, 1] và dung hợp trọng số 0.6 / 0.4.
    5. Áp dụng Metadata Hard-Filtering loại bỏ 100% món vi phạm an toàn dị ứng hoặc vượt ngân sách.
    6. Trả về Top-K ứng viên kèm phân rã điểm số chi tiết và đo lường độ trễ.
    """
    t_start = time.perf_counter()

    clean_query = request.query.strip()
    if not clean_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Câu truy vấn không được để trống hoặc chỉ chứa khoảng trắng."
        )

    retriever = get_retriever(request.index_type)

    # Chuyển đổi query_vector nếu có
    q_vec = None
    if request.query_vector:
        q_vec = np.array(request.query_vector, dtype=np.float32)

    try:
        raw_results = retriever.retrieve(
            query=clean_query,
            query_vector=q_vec,
            top_k=request.top_k,
            alpha=request.alpha,
            auto_mock_vector=request.auto_mock_vector,
            enable_metadata_filter=request.enable_metadata_filter,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi trong quá trình truy xuất dữ liệu: {str(e)}"
        )

    latency_ms = (time.perf_counter() - t_start) * 1000

    items_response = [
        RetrieveItemResponse(
            index=r["index"],
            id=r.get("id"),
            name=r["name"],
            item=r["item"],
            serialized_text=r.get("serialized_text", ""),
            hybrid_score=r["hybrid_score"],
            score_breakdown=r["score_breakdown"],
        )
        for r in raw_results
    ]

    # Trích xuất thông tin filter metadata
    entities_dict = (
        retriever.last_extracted_entities.to_dict()
        if retriever.last_extracted_entities
        else None
    )
    filtered_count = retriever.last_filter_stats.get("filtered_out_count", 0)

    return RetrieveResponse(
        status="success",
        query=clean_query,
        index_type=retriever.index_type,
        alpha=request.alpha,
        total_matches=len(items_response),
        latency_ms=round(latency_ms, 4),
        extracted_entities=entities_dict,
        filtered_out_count=filtered_count,
        results=items_response,
    )


@router.get(
    "/health",
    response_model=RagHealthResponse,
    summary="Kiểm tra trạng thái sẵn sàng của Lõi RAG",
    description="Báo cáo số lượng bản ghi chỉ mục đang tải trong bộ nhớ RAM cho thực đơn và chính sách."
)
async def rag_health():
    """Báo cáo tình trạng của các đối tượng chỉ mục FAISS HNSW và BM25."""
    menu_r = get_retriever("menu")
    pol_r = get_retriever("policies")

    return RagHealthResponse(
        status="ok",
        service="advanced-hybrid-rag",
        paper_reference="Advancing RAG for Structured Enterprise Data (IIT Roorkee 2025)",
        menu_index={
            "loaded_items_count": len(menu_r.index_manager.corpus_items),
            "vector_dimension": menu_r.index_manager.dimension,
            "has_faiss": menu_r.index_manager.faiss_index is not None,
            "has_bm25": menu_r.index_manager.bm25 is not None,
        },
        policies_index={
            "loaded_items_count": len(pol_r.index_manager.corpus_items),
            "vector_dimension": pol_r.index_manager.dimension,
            "has_faiss": pol_r.index_manager.faiss_index is not None,
            "has_bm25": pol_r.index_manager.bm25 is not None,
        }
    )
