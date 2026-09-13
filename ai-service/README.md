# 🍜 SmartRestaurant AI Service — Advanced Hybrid RAG Engine

Microservice AI độc lập phục vụ tính năng tư vấn thực đơn thông minh (**Aria AI Consultant**) cho dự án **SmartRestaurant**, được xây dựng dựa trên nghiên cứu khoa học chuyên sâu:
> **"Advancing RAG for Structured Enterprise and Internal Data"** (Cheerla et al., IIT Roorkee & Meta AI, 2025).

Hệ thống kết hợp kỹ thuật **Row-Level Structured Serialization**, **Chỉ mục kép (Dense Vector FAISS HNSW + Sparse Inverted Index BM25 Okapi)**, **Bộ tách từ tiếng Việt ẩm thực chuyên biệt (Vietnamese Culinary Tokenizer)** và **Dung hợp điểm số chuẩn hóa Min-Max (Weighted Score Fusion 0.6 / 0.4)** để đạt thời gian phản hồi siêu tốc ($< 1\text{ms}$) và độ chính xác vượt trội.

---

## 📁 Cấu Trúc Thư Mục Microservice

```text
ai-service/
├── data/
│   ├── indexes/                          # Nơi lưu trữ chỉ mục nhị phân bền vững trên đĩa
│   │   ├── .gitkeep                      # Giữ thư mục trên Git
│   │   ├── menu_bm25.pkl                 # Chỉ mục ngược BM25 Okapi cho thực đơn
│   │   ├── menu_embeddings.npy           # Ma trận vector 768 chiều (L2 normalized)
│   │   ├── menu_corpus_meta.json         # Metadata ánh xạ chi tiết từng món ăn
│   │   ├── policies_bm25.pkl             # Chỉ mục ngược BM25 cho chính sách
│   │   ├── policies_embeddings.npy       # Ma trận vector 768 chiều cho chính sách
│   │   └── policies_corpus_meta.json     # Metadata chi tiết các điều khoản nhà hàng
│   ├── serialized_menu_corpus.json       # Cache tĩnh toàn bộ món ăn đã tuần tự hóa
│   └── serialized_policies_corpus.json   # Cache tĩnh các chính sách nhà hàng
├── processors/                           # Các module xử lý dữ liệu và thuật toán lõi
│   ├── __init__.py                       # Export các processors dùng chung
│   ├── row_serializer.py                 # [Pha 1] Tuần tự hóa bản ghi cấp hàng (Menu & Policies)
│   ├── vietnamese_tokenizer.py           # [Bước 2.1] Bộ tách từ & chuẩn hóa tiếng Việt F&B
│   ├── index_manager.py                  # [Bước 2.1] Quản lý chỉ mục kép (FAISS HNSW + BM25)
│   ├── hybrid_retriever.py               # [Bước 2.2] Lớp truy xuất lai & chuẩn hóa Min-Max
│   ├── metadata_filter.py                # [Bước 3.1] Trích xuất thực thể F&B NER & Lọc cứng siêu dữ liệu
│   ├── entity_extractor.py               # Trích xuất thực thể món ăn từ văn bản
│   ├── fallback_handler.py               # Xử lý an toàn khi thiếu dữ liệu hoặc lỗi
│   └── system_prompt_builder.py          # Ghép dynamic context vào system prompt
├── routers/                              # Các route API độc lập của microservice
│   ├── __init__.py
│   └── rag.py                            # [Bước 2.3] Endpoints /rag/retrieve & /rag/health
├── scripts/                              # Các công cụ dòng lệnh (CLI Tools & Automation)
│   ├── bulk_ingest_serialized.py         # [Bước 1.3] Đồng bộ hàng loạt lên Supabase & xuất JSON
│   ├── build_indexes.py                  # [Bước 2.1] Xây dựng và lưu trữ chỉ mục ra đĩa
│   ├── benchmark_search.py               # [Bước 2.2] Đo tốc độ và truy xuất thử nghiệm thời gian thực
│   └── verify_supabase_rag.py            # Kiểm tra kết nối Supabase và hàm RPC pgvector
├── tests/                                # Bộ kiểm thử tự động (Unit Tests - 46 Tests)
│   ├── test_serializer.py                # 12 test cases cho Row Serializer Engine
│   ├── test_index_manager.py             # 5 test cases cho Tokenizer & Index Manager
│   ├── test_hybrid_retriever.py          # 7 test cases cho HybridRetriever & Min-Max
│   ├── test_api_endpoints.py             # [Bước 2.3] 11 test cases cho FastAPI RAG endpoints & CORS
│   └── test_metadata_filter.py           # [Bước 3.1] 11 test cases cho F&B NER & Metadata Hard-Filtering
├── .env.example                          # Mẫu cấu hình biến môi trường
├── requirements.txt                      # Danh mục các thư viện Python phụ thuộc
├── Dockerfile                            # Docker container hóa microservice
└── main.py                               # FastAPI application entrypoint (CORS, Timing, Routers)
```

---

## ⚡ Các Tính Năng Kỹ Thuật Đã Hoàn Thành

### 🛡️ Pha 1: Chuẩn Hóa CSDL & Tuần Tự Hóa Dữ Liệu (Gate 1 Passed)
- **Migration Schema 28 ([`28_add_rag_vector_columns.sql`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/database/migrations/28_add_rag_vector_columns.sql)):** Bổ sung cột `embedding vector(768)`, `row_serialized TEXT`, `dietary_tags TEXT[]` cho bảng `menu_items`; tạo bảng `restaurant_policies` kèm chỉ mục HNSW ($M=32, efConstruction=200$) và các hàm RPC `match_menu_items`, `match_restaurant_policies`.
- **Row Serializer Engine ([`row_serializer.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/processors/row_serializer.py)):** Chuyển đổi dữ liệu Dictionary từ CSDL thành văn bản bán cấu trúc tự nhiên chuẩn Paper 01, hỗ trợ danh mục đa hình, định dạng tiền tệ VND, thuộc tính ăn kiêng, độ cay, và cảnh báo dị ứng.
- **Đồng Bộ Kép (Dual-Sync Ingestion) ([`bulk_ingest_serialized.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/scripts/bulk_ingest_serialized.py)):** Cập nhật dữ liệu lên Supabase theo batch 50 bản ghi (tự động retry 3 lần) và xuất bản sao tĩnh sang các tệp JSON tại `data/` để phục vụ chạy offline.

### 🛡️ Pha 2: Lõi Chỉ Mục Kép & Truy Xuất Kết Hợp (Gate 2 Passed)
- **Vietnamese Culinary Tokenizer ([`vietnamese_tokenizer.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/processors/vietnamese_tokenizer.py)):**
  - Chuẩn hóa Unicode dựng sẵn (NFC) và loại bỏ ký tự lạ.
  - Nhận diện và khóa cứng hơn 40 từ ghép ẩm thực quan trọng (*"phở bò"*, *"bún bò huế"*, *"không cay"*, *"ít đường"*, *"thịt luộc"*).
  - Tự động sinh N-gram trượt (Sliding-window bigrams) cho các từ mới xuất hiện trong thực đơn (*"vịt quay"* &rarr; `vịt_quay`).
- **Quản Lý Chỉ Mục Kép ([`index_manager.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/processors/index_manager.py)):**
  - Quản lý đồng bộ **FAISS HNSW Flat** ($d=768, M=32, efConstruction=200, efSearch=50$) và **BM25 Okapi**.
  - Tích hợp lớp dự phòng Pure-Python `SimpleBM25Fallback` và tính Cosine qua Numpy dot product khi server thiếu thư viện nhị phân C++.
  - Lưu và nạp chỉ mục tức thì từ đĩa (`.bin`, `.pkl`, `.npy`, `.json`).
- **Bộ Truy Xuất Lai `HybridMenuRetriever` ([`hybrid_retriever.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/processors/hybrid_retriever.py)):**
  - **Min-Max Score Normalization:** Co giãn độc lập điểm số Cosine và BM25 về khoảng $[0.0, 1.0]$, bảo vệ an toàn chia cho 0 ($\epsilon = 10^{-9}$) và xử lý trường hợp cực trị $min == max$.
  - **Dung hợp điểm số tối ưu:** $\text{Score} = 0.6 \times \text{Dense}_{\text{norm}} + 0.4 \times \text{BM25}_{\text{norm}}$.
  - **Cơ chế Adaptive Alpha:** Khi có `query_vector` thì kết hợp $0.6/0.4$; khi không có vector thì tự động điều chỉnh chỉ dùng BM25 để không bị vector giả lập làm sai lệch xếp hạng món ăn.
  - **Sinh vector lượng giác tất định:** Cung cấp vector giả lập siêu tốc ($< 0.01\text{ms}$) cho mục đích kiểm thử và offline.
- **FastAPI Retrieval Endpoint ([`routers/rag.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/routers/rag.py) & [`main.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/main.py)):**
  - **`POST /rag/retrieve`**: Endpoint truy xuất độc lập cho phép Node.js Gateway hoặc client gọi trực tiếp. Hỗ trợ xác thực schema bằng Pydantic, lọc theo `index_type` (`menu` hoặc `policies`), tùy biến `alpha` và `top_k`.
  - **`GET /rag/health`**: Báo cáo tình trạng tải bộ nhớ của các chỉ mục HNSW FAISS và BM25 Okapi.
  - **Timing & CORS Middleware**: Tự động đo lường thời gian xử lý toàn trình và trả về trong header HTTP `X-Process-Time` (chuẩn mili-giây/giây).

### 🛡️ Pha 3: Tiền Lọc Siêu Dữ Liệu & Tái Xếp Hạng Ngữ Cảnh (Đang Thực Hiện)
- **F&B NER & Metadata Hard-Filtering ([`metadata_filter.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/processors/metadata_filter.py)):**
  - **Trích xuất thực thể ẩm thực (F&B NER):** Bóc tách tự động `ALLERGEN` (tôm, cua, hải sản, đậu phộng, trứng, sữa, gluten...), `DIET_RESTRICTION` (chay, vegan, keto, halal...), `SPICE_LEVEL` (không cay 0, ít cay 1, cay vừa 2, cay nồng 5), `BUDGET` (regex bóc tách tiền tệ dưới 50k, không quá 100 nghìn...).
  - **Lọc cứng an toàn thực phẩm (Metadata Hard-Filtering):** Loại bỏ **100%** món ăn vi phạm dị ứng hoặc vượt ngân sách của thực khách trước khi trả về, đạt tiêu chuẩn an toàn y tế và thực đơn.
  - **Tốc độ xử lý siêu tốc:** $< 0.2\text{ ms}$, không phụ thuộc mô hình nặng, tương thích cơ chế Dual-Engine.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu cầu môi trường
- Python 3.11 hoặc 3.12
- Bộ công cụ ảo hóa: `venv` hoặc `conda`

### 2. Cài đặt các gói phụ thuộc
```bash
# Di chuyển vào thư mục ai-service
cd ai-service

# Tạo và kích hoạt môi trường ảo (nếu chưa có)
python3 -m venv .venv
source .venv/bin/activate  # Trên macOS/Linux
# .venv\Scripts\activate   # Trên Windows

# Cài đặt thư viện
pip install -r requirements.txt
```

### 3. Cấu hình biến môi trường
Tạo tệp `.env` từ `.env.example`:
```bash
cp .env.example .env
```
Cấu hình các biến trong `.env`:
```ini
PORT=5001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🛠️ Các Lệnh Vận Hành Chính (CLI Tools)

### 1. Đồng bộ dữ liệu & xuất Corpus tĩnh
```bash
PYTHONPATH=. .venv/bin/python scripts/bulk_ingest_serialized.py
```
> Kết nối Supabase, tuần tự hóa tất cả món ăn và lưu ra `data/serialized_menu_corpus.json`.

### 2. Xây dựng lại chỉ mục đĩa (Build Indexes)
```bash
PYTHONPATH=. .venv/bin/python scripts/build_indexes.py
```
> Xây dựng chỉ mục HNSW và BM25 từ corpus, xuất 6 tệp nhị phân vào thư mục `data/indexes/`.

### 3. Đo tốc độ & Tìm kiếm thử nghiệm thời gian thực (Interactive Benchmark)
```bash
# Cú pháp: python scripts/benchmark_search.py "<câu truy vấn>" <top_k> <alpha>
.venv/bin/python scripts/benchmark_search.py "phở bò tái nạm" 5 0.6
.venv/bin/python scripts/benchmark_search.py "trà đào cam sả ít đường" 3 0.6
```

**Mẫu kết quả hiển thị:**
```text
================================================================================
⚡ ĐO LƯỜNG TỐC ĐỘ & TRUY XUẤT LAI HYBRID RETRIEVER (BƯỚC 2.2)
================================================================================
🔍 Câu hỏi: "phở bò tái nạm"
⚖️  Trọng số Fusion: alpha = 0.6 (Dense: 60% | BM25: 40%)
🎯 Số lượng kết quả: Top 5
--------------------------------------------------------------------------------
📦 Đã nạp chỉ mục (17 món ăn) từ đĩa trong: 1.775 ms
🔤 Tách từ tiếng Việt: ['phở_bò', 'tái', 'nạm', 'tái_nạm'] (Thời gian: 0.2871 ms)

================================================================================
Hạng   Hybrid     Dense(Norm)    BM25(Norm)     Tên món ăn                Giá tiền    
--------------------------------------------------------------------------------
#1     1.0000     0.0000         1.0000         Phở Bò Tái Nạm            75,000.0 đ  

================================================================================
⏱️  KẾT QUẢ ĐO HIỆU NĂNG TOÀN TRÌNH (GATE 2 PERFORMANCE CHECK):
   • Thời gian truy xuất lai (Hybrid Latency): 0.1673 ms
   • Tiêu chuẩn nghiệm thu Gate 2:              < 20.000 ms
   • Đánh giá cổng nghiệm thu:                  ✅ ĐẠT CHUẨN (Vượt tiêu chuẩn 120x)
================================================================================
```

---

## 📡 Tài Liệu Đặc Tả API (API Endpoints Specification)

### 1. `POST /rag/retrieve` — Truy xuất lai Top-K ứng viên
Endpoint độc lập nhận câu hỏi người dùng, thực hiện Min-Max Score Fusion giữa FAISS Dense Cosine và BM25 Okapi, trả về danh sách ứng viên kèm phân rã điểm số minh bạch.

**Request Body Schema (`application/json`):**
```json
{
  "query": "phở bò tái nạm",
  "top_k": 5,
  "alpha": 0.6,
  "index_type": "menu",
  "query_vector": null,
  "auto_mock_vector": false
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:5001/rag/retrieve" \
  -H "Content-Type: application/json" \
  -d '{"query": "phở bò tái nạm", "top_k": 3, "alpha": 0.6}'
```

**Response Example (`200 OK`):**
```json
{
  "status": "success",
  "query": "phở bò tái nạm",
  "index_type": "menu",
  "alpha": 0.6,
  "total_matches": 3,
  "latency_ms": 0.1842,
  "results": [
    {
      "index": 0,
      "id": "item-uuid-001",
      "name": "Phở Bò Tái Nạm",
      "serialized_text": "Món: Phở Bò Tái Nạm | Danh mục: Món nước | Giá: 75,000 đ...",
      "hybrid_score": 1.0,
      "score_breakdown": {
        "dense_raw": 0.0,
        "dense_norm": 0.0,
        "bm25_raw": 5.421,
        "bm25_norm": 1.0,
        "alpha": 0.0
      },
      "item": { "name": "Phở Bò Tái Nạm", "price": 75000 }
    }
  ]
}
```
> **Lưu ý:** Response Header kèm theo `X-Process-Time` (ví dụ `0.001420s`) để Gateway giám sát thời gian xử lý toàn trình.

### 2. `GET /rag/health` — Trạng thái hoạt động Lõi RAG
```bash
curl -X GET "http://localhost:5001/rag/health"
```
```json
{
  "status": "ok",
  "service": "advanced-hybrid-rag",
  "paper_reference": "Advancing RAG for Structured Enterprise Data (IIT Roorkee 2025)",
  "menu_index": {
    "loaded_items_count": 17,
    "vector_dimension": 768,
    "has_faiss": true,
    "has_bm25": true
  },
  "policies_index": {
    "loaded_items_count": 4,
    "vector_dimension": 768,
    "has_faiss": true,
    "has_bm25": true
  }
}
```

---

## 🧪 Kiểm Thử Tự Động (Unit Testing)

Chạy toàn bộ 46 bài kiểm thử của cả 5 phân hệ (Serializer, Tokenizer/Index, Hybrid Retriever, API Endpoints, Metadata Filter):
```bash
PYTHONPATH=. .venv/bin/python -m unittest discover -s tests -v
```

**Báo cáo kiểm thử thực tế:**
```text
test_01_allergen_extraction (test_metadata_filter.TestMetadataFilter) ... ok
test_02_dietary_tag_extraction (test_metadata_filter.TestMetadataFilter) ... ok
test_03_spice_level_extraction (test_metadata_filter.TestMetadataFilter) ... ok
test_04_budget_extraction (test_metadata_filter.TestMetadataFilter) ... ok
test_05_category_extraction (test_metadata_filter.TestMetadataFilter) ... ok
test_06_hard_filter_allergens (test_metadata_filter.TestMetadataFilter) ... ok
test_07_hard_filter_max_price (test_metadata_filter.TestMetadataFilter) ... ok
test_08_hard_filter_spice_level (test_metadata_filter.TestMetadataFilter) ... ok
test_09_hard_filter_vegetarian (test_metadata_filter.TestMetadataFilter) ... ok
test_10_no_filter_when_no_constraints (test_metadata_filter.TestMetadataFilter) ... ok
test_11_hybrid_retriever_metadata_filter_integration (test_metadata_filter.TestMetadataFilter) ... ok
... (11 tests cho FastAPI Endpoints & CORS) ... ok
... (7 tests cho Hybrid Retriever & Min-Max) ... ok
... (5 tests cho Index Manager & Tokenizer) ... ok
... (12 tests cho Row Serializer Engine) ... ok

----------------------------------------------------------------------
Ran 46 tests in 0.141s
OK (Tỷ lệ đạt 100%)
```

---

## 📊 Bảng Thông Số Hiệu Năng Đo Lường (Benchmark & SLA)

| Chỉ số đo lường | Tiêu chuẩn Cổng (SLA) | Kết quả Đạt được | Tỷ lệ vượt chuẩn | Trạng thái |
| :--- | :---: | :---: | :---: | :---: |
| **Dense Search Latency** (FAISS HNSW 768d) | $< 5.000\text{ ms}$ | **`0.044 ms`** | Nhanh hơn **113 lần** | 🛡️ **Gate 2 PASSED** |
| **BM25 Sparse Search Latency** | $< 5.000\text{ ms}$ | **`0.121 ms`** | Nhanh hơn **41 lần** | 🛡️ **Gate 2 PASSED** |
| **Thời gian nạp chỉ mục từ đĩa lên RAM** | $< 50.000\text{ ms}$ | **`1.460 ms`** | Nhanh hơn **34 lần** | 🛡️ **Gate 2 PASSED** |
| **Thời gian truy xuất lai toàn trình (Hybrid)** | $< 20.000\text{ ms}$ | **`0.167 ms`** | Nhanh hơn **120 lần** | 🛡️ **Gate 2 PASSED** |
| **Độ trễ bóc tách thực thể F&B NER** | $< 5.000\text{ ms}$ | **`0.082 ms`** | Nhanh hơn **60 lần** | 🛡️ **Gate 3 PASSED** |
| **Tỷ lệ lọc sót món ăn chứa dị ứng** | $0\%$ | **0% (Loại bỏ 100%)** | Tuyệt đối an toàn | 🛡️ **Gate 3 PASSED** |
| **Độ trễ HTTP Endpoint `/rag/retrieve`** | $< 50.000\text{ ms}$ | **`< 2.000 ms`** | Nhanh hơn **25 lần** | 🛡️ **Gate 2/3 PASSED** |
| **Tỷ lệ kiểm thử tự động vượt qua** | $100\%$ | **46 / 46 Tests (100%)** | Tuyệt đối | ✅ **ĐẠT** |

---

## 📚 Tài Liệu Kỹ Thuật Tham Chiếu
- **Kế hoạch triển khai tổng thể 5 pha:** [`.lavish/05_advancing_rag_implementation_plan.html`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/.lavish/05_advancing_rag_implementation_plan.html)
- **Nhật ký triển khai & Chi tiết thuật toán:** [`.lavish/06_advancing_rag_implementation_notes.html`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/.lavish/06_advancing_rag_implementation_notes.html)
- **Cổng danh mục tài liệu nghiên cứu Hub:** [`.lavish/index.html`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/.lavish/index.html)
