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
│   ├── entity_extractor.py               # Trích xuất thực thể món ăn từ văn bản
│   ├── fallback_handler.py               # Xử lý an toàn khi thiếu dữ liệu hoặc lỗi
│   └── system_prompt_builder.py          # Ghép dynamic context vào system prompt
├── scripts/                              # Các công cụ dòng lệnh (CLI Tools & Automation)
│   ├── bulk_ingest_serialized.py         # [Bước 1.3] Đồng bộ hàng loạt lên Supabase & xuất JSON
│   ├── build_indexes.py                  # [Bước 2.1] Xây dựng và lưu trữ chỉ mục ra đĩa
│   ├── benchmark_search.py               # [Bước 2.2] Đo tốc độ và truy xuất thử nghiệm thời gian thực
│   └── verify_supabase_rag.py            # Kiểm tra kết nối Supabase và hàm RPC pgvector
├── tests/                                # Bộ kiểm thử tự động (Unit Tests)
│   ├── test_serializer.py                # 12 test cases cho Row Serializer Engine
│   ├── test_index_manager.py             # 5 test cases cho Tokenizer & Index Manager
│   └── test_hybrid_retriever.py          # 7 test cases cho HybridRetriever & Min-Max
├── .env.example                          # Mẫu cấu hình biến môi trường
├── requirements.txt                      # Danh mục các thư viện Python phụ thuộc
├── Dockerfile                            # Docker container hóa microservice
└── main.py                               # FastAPI application entrypoint
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

## 🧪 Kiểm Thử Tự Động (Unit Testing)

Chạy toàn bộ 24 bài kiểm thử của cả 3 phân hệ:
```bash
PYTHONPATH=. .venv/bin/python -m unittest discover -s tests -v
```

**Báo cáo kiểm thử thực tế:**
```text
test_01_full_menu_item (test_serializer.TestRowSerializer) ... ok
test_02_minimal_menu_item (test_serializer.TestRowSerializer) ... ok
... (12 tests cho Row Serializer) ... ok
test_01_vietnamese_text_normalization (test_index_manager.TestIndexManager) ... ok
test_02_vietnamese_tokenizer_compounds (test_index_manager.TestIndexManager) ... ok
... (5 tests cho Index Manager) ... ok
test_01_min_max_normalize_standard (test_hybrid_retriever.TestHybridMenuRetriever) ... ok
test_02_min_max_normalize_edge_cases (test_hybrid_retriever.TestHybridMenuRetriever) ... ok
test_03_exact_keyword_boost (test_hybrid_retriever.TestHybridMenuRetriever) ... ok
test_04_dense_vector_boost (test_hybrid_retriever.TestHybridMenuRetriever) ... ok
test_05_alpha_weighting_impact (test_hybrid_retriever.TestHybridMenuRetriever) ... ok
test_06_score_breakdown_and_bounds (test_hybrid_retriever.TestHybridMenuRetriever) ... ok
test_07_empty_query_safety (test_hybrid_retriever.TestHybridMenuRetriever) ... ok

----------------------------------------------------------------------
Ran 24 tests in 0.027s
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
| **Tỷ lệ kiểm thử tự động vượt qua** | $100\%$ | **24 / 24 Tests (100%)** | Tuyệt đối | ✅ **ĐẠT** |

---

## 📚 Tài Liệu Kỹ Thuật Tham Chiếu
- **Kế hoạch triển khai tổng thể 5 pha:** [`.lavish/05_advancing_rag_implementation_plan.html`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/.lavish/05_advancing_rag_implementation_plan.html)
- **Nhật ký triển khai & Chi tiết thuật toán:** [`.lavish/06_advancing_rag_implementation_notes.html`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/.lavish/06_advancing_rag_implementation_notes.html)
- **Cổng danh mục tài liệu nghiên cứu Hub:** [`.lavish/index.html`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/.lavish/index.html)
