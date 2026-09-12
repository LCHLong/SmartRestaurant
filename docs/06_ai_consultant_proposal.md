# 🤖 Proposal: Tích hợp AI Consultant "Aria" vào SmartRestaurant

> **Phiên bản:** 1.0  
> **Ngày:** 31/08/2026  
> **Dự án:** SmartRestaurant — Hệ thống đặt món QR tại bàn  
> **Tech Stack:** React 19 + Vite · Node.js/Express 5 · Supabase (PostgreSQL) · Redis · Socket.io

---

## 1. Tổng quan (Executive Summary)

Đề xuất bổ sung tính năng **AI Consultant "Aria"** — một trợ lý tư vấn món ăn thông minh tích hợp trực tiếp vào giao diện đặt món của khách hàng. Aria sử dụng **Gemini API** để cá nhân hóa trải nghiệm ăn uống, tự động upsell tự nhiên, hỗ trợ tư vấn dị ứng thực phẩm và cung cấp phân tích thông minh cho Admin.

### Mục tiêu kinh doanh

| Chỉ số | Kỳ vọng |
|--------|---------|
| Tăng AOV (Average Order Value) | +15–25% nhờ upsell tự nhiên |
| Giảm thời gian quyết định đặt món | −30% (từ ~4 phút xuống ~2.5 phút) |
| Tăng tỷ lệ khách quay lại | +10% nhờ cá nhân hóa |
| Giảm tải câu hỏi thường gặp cho waiter | −20% |

---

## 2. Phân tích Hiện trạng Hệ thống

### 2.1 Kiến trúc hiện có — Những thành phần sẵn sàng

SmartRestaurant hiện đã có đầy đủ các "trụ cột" hạ tầng để tích hợp AI mà không cần thay đổi kiến trúc cốt lõi:

| Thành phần | Trạng thái | Vai trò đối với Aria |
|---|---|---|
| **Redis** | ✅ Đang hoạt động | Cache dữ liệu menu cho AI, lưu session hội thoại |
| **Socket.io** | ✅ Đang hoạt động | Stream phản hồi AI theo thời gian thực, token-by-token |
| **`table_` Socket Rooms** | ✅ Có sẵn | Định tuyến phản hồi AI đúng bàn của khách |
| **Supabase / PostgreSQL** | ✅ Đang hoạt động | Nguồn dữ liệu menu, lịch sử đặt món |
| **JWT Auth** | ✅ Đang hoạt động | Xác định khách đã đăng nhập để cá nhân hóa |
| **API `/api/menu`** | ✅ Có sẵn | Nguồn menu thực tế truyền vào context AI |
| **API `/api/orders`** | ✅ Có sẵn | Lịch sử đặt món để AI cá nhân hóa gợi ý |

### 2.2 Điểm tích hợp UI

- **`MenuPage.jsx`**: Màn hình chính khách xem thực đơn → nơi hiển thị chat widget
- **`CartPage.jsx`**: Màn hình giỏ hàng → trigger upsell thông minh sau khi khách chọn món
- **`RecommendedItems.jsx`** (đã có): Có thể mở rộng để hiển thị gợi ý từ AI

---

## 3. Kiến trúc Đề xuất

### 3.1 Sơ đồ Tổng thể

```
┌──────────────────────────────────────────────────────────────┐
│                      CUSTOMER BROWSER                        │
│                                                              │
│   MenuPage / CartPage                                        │
│   ┌──────────────────────┐   ┌────────────────────────────┐  │
│   │   Menu Grid / Cart   │   │   🤖 Aria Chat Widget      │  │
│   │                      │   │                            │  │
│   │   [Thêm vào giỏ] ←───┼───┼── [+ Thêm] button in chat │  │
│   └──────────────────────┘   └────────────────────────────┘  │
│                   ↕ Socket.io real-time stream               │
└───────────────────────────────┬──────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────┐
│                   BACKEND (Node.js / Express)                │
│                                                              │
│   POST /api/ai/consult                                       │
│   ┌──────────────────────────────────────────────────────┐   │
│   │  AI Controller                                       │   │
│   │  1. Nhận request (tableId, sessionId, message, cart) │   │
│   │  2. Xác thực & rate-limit                            │   │
│   │  3. Gọi AI Service để xây dựng context + prompt      │   │
│   │  4. Stream kết quả về client qua Socket.io           │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │  AI Service                                          │   │
│   │  - Lấy menu từ Redis cache (hoặc DB nếu cache miss)  │   │
│   │  - Lấy lịch sử đơn hàng từ Supabase (nếu đăng nhập) │   │
│   │  - Xây dựng System Prompt động theo ngữ cảnh         │   │
│   │  - Gọi Gemini API                                    │   │
│   │  - Trích xuất tên món từ phản hồi → map với menu DB  │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
│         ┌──────────────┬────────────────┬──────────────┐     │
│         ▼              ▼                ▼              │     │
│      Supabase        Redis          Gemini API         │     │
│   (order_history)  (menu cache,    (Flash 1.5 /        │     │
│                     AI sessions)    Pro 2.0)           │     │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Luồng Dữ liệu Chi tiết (Data Flow)

```
Khách nhập tin nhắn
        │
        ▼
[Frontend] Gửi message + cartItems + tableId lên POST /api/ai/consult
        │
        ▼
[Backend] Kiểm tra Redis cache có menu data không?
        │
   ┌────┴─────┐
   │ Cache Hit │──────────────────────────────────┐
   └───────────┘                                  │
        │ Cache Miss                               │
        ▼                                          │
   Gọi Supabase → Lấy menu → Ghi vào Redis (TTL 5 phút)
        │                                          │
        └──────────────────────────────────────────┘
        │
        ▼
[Backend] Nếu user đã đăng nhập → Lấy order_history từ Supabase
        │
        ▼
[Backend] Xây dựng prompt động:
        System Prompt + Menu JSON + Cart + History + Message
        │
        ▼
[Backend] Gọi Gemini API (streaming mode)
        │
        ▼
[Backend] Stream từng token về client qua Socket.io → room table_{tableId}
        │
        ▼
[Frontend] Hiển thị token-by-token + trích xuất tên món → render nút [+ Thêm vào giỏ]
```

---

## 4. Phạm vi Tính năng (Feature Scope)

### 4.1 MVP — Giai đoạn 1

| # | Tính năng | Mô tả | Trigger |
|---|-----------|-------|---------|
| F1 | **Chat Widget** | Floating bubble trên MenuPage & CartPage | Luôn hiển thị |
| F2 | **Chào hỏi thông minh** | Aria tự khởi động sau 5 giây, dựa vào số bàn & thời điểm ngày | QR scan |
| F3 | **Tư vấn theo ngữ cảnh** | Hiểu yêu cầu → gợi ý 2–3 món từ menu thực | Khách nhập |
| F4 | **Thêm vào giỏ từ chat** | Nút [+ Thêm] ngay trong tin nhắn Aria | AI suggest |
| F5 | **Upsell tự nhiên** | Gợi ý đồ uống / tráng miệng phù hợp món đã chọn | Cart thay đổi |
| F6 | **Tư vấn dị ứng** | Tra nguyên liệu chính xác, gợi ý món thay thế | Khách hỏi |

### 4.2 Nâng cao — Giai đoạn 2

| # | Tính năng | Mô tả |
|---|-----------|-------|
| F7 | **Cá nhân hóa lịch sử** | Dùng `order_history` của tài khoản đã đăng nhập |
| F8 | **Session Memory** | Redis lưu ngữ cảnh hội thoại 30 phút, Aria nhớ ngữ cảnh trong session |
| F9 | **Admin Analytics AI** | Phân tích xu hướng đặt món, gợi ý tối ưu menu |
| F10 | **Trending Badges** | Hiển thị "🔥 Trending hôm nay" dựa trên phân tích AI |

---

## 5. Thiết kế Cấu trúc AI

### 5.1 Mô hình Prompt (Prompt Architecture)

Aria hoạt động theo mô hình **3-Layer Prompt**:

```
┌─────────────────────────────────────────┐
│         LAYER 1 — SYSTEM PROMPT         │
│  Vai trò, nguyên tắc, giới hạn của Aria │
│  (Cố định, build một lần lúc khởi tạo)  │
└───────────────────┬─────────────────────┘
                    │
┌───────────────────▼─────────────────────┐
│         LAYER 2 — DYNAMIC CONTEXT       │
│  - Menu JSON (từ Redis cache)            │
│  - Thông tin bàn & thời điểm ngày        │
│  - Giỏ hàng hiện tại                    │
│  - Lịch sử đặt món (nếu đăng nhập)      │
│  (Build động mỗi request)               │
└───────────────────┬─────────────────────┘
                    │
┌───────────────────▼─────────────────────┐
│         LAYER 3 — USER MESSAGE          │
│  Tin nhắn thực tế của khách             │
│  (Sanitized & validated trước khi gửi)  │
└─────────────────────────────────────────┘
```

### 5.2 Thiết kế System Prompt

System Prompt bao gồm 5 phần chính:

| Phần | Nội dung |
|------|---------|
| **Danh tính** | Aria là trợ lý tư vấn món ăn của nhà hàng, không phải chatbot đa năng |
| **Phạm vi kiến thức** | Menu thực tế + ngữ cảnh bàn + giỏ hàng + lịch sử |
| **Nguyên tắc tư vấn** | Gợi ý cụ thể, upsell tự nhiên, minh bạch nguyên liệu |
| **Định dạng phản hồi** | < 150 từ, gợi ý theo format: [Tên món] · [Giá] · [Lý do 1 câu] |
| **Giới hạn cứng** | Không nói ngoài chủ đề; không cam kết thời gian chế biến; disclaimer dị ứng |

### 5.3 Các Loại Prompt Theo Ngữ cảnh

| Kịch bản | Trigger | Prompt Template |
|----------|---------|----------------|
| **Khách mới quét QR** | Vào trang, sau 5 giây | Chào + hỏi khẩu vị + gợi ý 1 combo theo giờ |
| **Khách mô tả khẩu vị** | Nhập tự do | Xác nhận → gợi ý 2–3 món → hỏi tinh chỉnh |
| **Hỏi dị ứng / nguyên liệu** | Từ khóa: "dị ứng", "có chứa", "ăn kiêng" | Trả lời trực tiếp → gợi ý món thay thế |
| **Upsell sau chọn món** | Cart thay đổi | Gợi ý 1–2 món bổ sung phù hợp, tối đa 3 câu |
| **Khách phân vân** | Đề cập 2 tên món | So sánh trải nghiệm → hỏi ưu tiên → chốt gợi ý |

### 5.4 Chiến lược Caching & Session

```
Loại dữ liệu        │ Nơi lưu  │ TTL       │ Key format
────────────────────┼──────────┼───────────┼────────────────────────
Menu data           │ Redis    │ 5 phút    │ menu:{restaurantId}
Session hội thoại   │ Redis    │ 30 phút   │ ai_session:{sessionId}
Order history       │ Redis    │ 10 phút   │ order_history:{userId}
Rate limit counter  │ Redis    │ 1 phút    │ ai_ratelimit:{sessionId}
```

### 5.5 Cơ chế Trích xuất Món (Entity Extraction)

Sau khi Gemini trả về văn bản, backend cần thực hiện thêm bước:

1. **Parse tên món** từ phản hồi AI (dựa theo format đã định nghĩa trong prompt)
2. **Map với menu DB** — đối chiếu tên món trong phản hồi với danh sách `id` trong Supabase
3. **Trả về structured data** — mỗi gợi ý kèm `item_id`, `name`, `price`, `image_url`
4. **Frontend render** — hiển thị card món ăn mini kèm nút **[+ Thêm vào giỏ]**

> Nếu tên món không khớp → không hiển thị nút thêm, chỉ hiển thị văn bản thuần.

### 5.6 [Bổ sung thêm] Kiến trúc Lightweight RAG (2-Stage Retrieval) & Fallback 3 Tầng

Nhằm giải quyết nguy cơ đội chi phí token và tăng độ trễ khi nhà hàng có thực đơn lớn (80–200 món), hệ thống áp dụng kỹ thuật RAG 2 giai đoạn tinh gọn:

| Tiêu chí so sánh | Cách truyền thống (Bơm toàn bộ Menu) | Lightweight RAG (2-Stage) |
|---|---|---|
| **Token Input / Request** | ~2.500 – 3.500 token | **~200 – 350 token (-85%)** |
| **Thời gian phản hồi (TTFT)** | ~1.6 – 2.2 giây | **< 0.8 giây (-50%)** |
| **Chi phí ước tính / 100 chat** | ~$0.04 (1.000đ/ngày) | **~$0.008 (< 250đ/ngày)** |
| **Độ tập trung (Attention)** | Dễ loãng ngữ cảnh khi menu dài | **Tập trung 100% vào món liên quan** |

**Cơ chế vận hành:**
- **Giai đoạn 1 (Lọc nhanh tại Database):** Khi khách gửi yêu cầu (ví dụ: *"Có món lẩu bò nào cay không?"*), Backend truy vấn sơ bộ qua Category/Tags hoặc hàm `match_menu_items()` (pgvector trong Supabase) để rút ra **Top 6–8 món** khớp nhất.
- **Giai đoạn 2 (Bơm vào Context Gemini):** Thay vì gửi cả menu 100 món, Backend chỉ nhúng 6–8 món này kèm giỏ hàng hiện tại vào dynamic prompt.

**Cơ chế Dự phòng Fallback 3 Tầng (Khi RAG không tìm ra món phù hợp hoặc kết quả rỗng):**
1. **Tầng 1 - Nới lỏng ràng buộc (Relax Filters):** Nếu bộ lọc quá chặt (ví dụ: "món chay không nấm không đậu phụ < 30k" trả về 0 món), Backend tự động gỡ bỏ các tiêu chí phụ, giữ Category chính để lấy danh sách món rộng hơn.
2. **Tầng 2 - Best-Seller & Trending Fallback (Redis):** Nếu câu hỏi quá xa lạ hoặc ngoài tầm, Backend tự động lấy Top 5 món Best-Seller & Trending trong Redis nạp vào prompt để AI thành thật: *"Dạ quán chưa có món đúng 100% yêu cầu, nhưng Aria xin gợi ý các món đang được yêu thích nhất hôm nay..."*
3. **Tầng 3 - Human Handoff (Chuyển giao nhân viên):** Nếu khách có yêu cầu đặc biệt ngoài khả năng của AI, Aria phản hồi lịch sự kèm nút bấm **[🔔 Gọi nhân viên bàn]** để phục vụ hỗ trợ trực tiếp tại bàn.

---

## 6. Cấu trúc Các Thành phần Cần Xây dựng

### 6.1 Backend

```
backend/src/
├── routes/
│   └── aiRoutes.js             ← Định nghĩa endpoint POST /api/ai/consult
├── controllers/
│   └── aiController.js         ← Validate request, điều phối luồng, emit Socket
└── services/
    ├── aiService.js             ← Gọi Gemini API, xây dựng context
    └── prompts/
        └── ariaSystemPrompt.js  ← System prompt template (tách riêng để dễ chỉnh)
```

**Trách nhiệm từng tầng:**

- **Route**: Khai báo endpoint, gắn middleware `optionalAuth` (cho phép cả guest)
- **Controller**: Nhận & validate request → gọi Service → emit kết quả qua Socket.io
- **Service**: Logic nghiệp vụ AI — fetch menu cache, build prompt, gọi Gemini, extract entities
- **Prompt file**: Tách riêng System Prompt để dễ chỉnh sửa, A/B test, không đụng vào logic

### 6.2 Frontend

```
frontend/src/
├── components/
│   └── AriaChatWidget/
│       ├── index.jsx            ← Floating bubble + panel container
│       ├── ChatMessage.jsx      ← Tin nhắn + mini card món + nút [+ Thêm]
│       └── AriaChatWidget.css   ← Glassmorphism, animations, responsive
├── pages/customer/
│   ├── MenuPage.jsx             ← [MODIFY] Nhúng <AriaChatWidget />
│   └── CartPage.jsx             ← [MODIFY] Nhúng <AriaChatWidget /> + auto-trigger
└── contexts/
    └── AiChatContext.jsx        ← Quản lý session ID, socket stream, message history
```

**Trách nhiệm từng tầng:**

- **AriaChatWidget**: UI bubble + slide panel, quản lý trạng thái mở/đóng
- **ChatMessage**: Render văn bản AI (Markdown-light) + card món mini nếu có `item_id`
- **AiChatContext**: Khởi tạo socket listener, lưu lịch sử chat trong session, expose `sendMessage()`

---

## 7. Thiết kế API Endpoint

### `POST /api/ai/consult`

**Request Payload:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `tableId` | string | ✅ | Số bàn từ QR code |
| `sessionId` | string | ✅ | Session ID client tự sinh (UUID) |
| `message` | string | ✅ | Nội dung tin nhắn của khách |
| `cartItems` | array | ✅ | Danh sách món trong giỏ hiện tại |
| `userId` | string | ❌ | ID user (nếu đã đăng nhập, từ JWT) |

**Response:**

- HTTP `200 OK` — xác nhận đã nhận, kết quả trả về qua **Socket.io** (không phải HTTP response)
- HTTP `429` — Rate limit vượt quá (10 request/phút/session)
- HTTP `400` — Payload không hợp lệ

**Socket.io Event:**

| Event | Hướng | Dữ liệu |
|-------|-------|---------|
| `ai_response` | Server → Client | `{ sessionId, content, suggestedItems[] }` |
| `ai_stream_token` | Server → Client | `{ sessionId, token }` (streaming mode) |
| `ai_error` | Server → Client | `{ sessionId, message }` |

---

## 8. Thay đổi Schema Cơ sở Dữ liệu

Cần bổ sung thêm các trường vào bảng `menu_items` (Supabase) để AI có đủ thông tin tư vấn:

| Cột mới | Kiểu dữ liệu | Mục đích |
|---------|-------------|----------|
| `ingredients` | `TEXT[]` | Danh sách nguyên liệu chính (phục vụ tư vấn dị ứng) |
| `allergens` | `TEXT[]` | Các chất gây dị ứng phổ biến (gluten, lactose, hải sản…) |
| `spice_level` | `INTEGER (0–5)` | Mức độ cay để lọc theo sở thích |
| `calories` | `INTEGER` | Hỗ trợ tư vấn ăn kiêng / kiểm soát calo |
| `ai_description` | `TEXT` | Mô tả tối ưu cho AI — súc tích, giàu thông tin cảm quan |
| `is_trending` | `BOOLEAN` | Flag để hiển thị "🔥 Trending" (cập nhật bởi analytics) |

> **Lưu ý migration:** Tất cả cột mới đều có thể `NULL` để không ảnh hưởng dữ liệu cũ.

---

## 9. Thiết kế UX Chat Widget

### Luồng trải nghiệm người dùng

```
Khách quét QR → Vào MenuPage
        │
        ▼ (sau 5 giây)
Bubble Aria xuất hiện góc dưới phải
với animation pulse nhẹ
        │
        ▼ (khách click bubble)
Panel chat trượt lên (slide-up animation)
        │
        ▼
Aria gửi tin nhắn chào tự động
theo giờ trong ngày + số bàn
        │
        ▼
Khách nhập → hiện typing indicator
        │
        ▼
Aria phản hồi streaming (giống ChatGPT)
        │
  ┌─────┴──────┐
  │ Có gợi ý món │
  └─────┬──────┘
        ▼
Hiển thị card mini: [Ảnh] [Tên] [Giá] [+ Thêm vào giỏ]
        │
        ▼ (click nút)
Món vào giỏ → Toast notification → Badge giỏ hàng +1
```

### Các trạng thái UI

| Trạng thái | Mô tả |
|-----------|-------|
| **Idle** | Bubble nhỏ, animation pulse mỗi 10 giây |
| **Opening** | Slide-up animation 300ms |
| **Typing (user)** | Input field focused |
| **Loading (AI)** | 3 chấm động (skeleton dots) |
| **Streaming** | Text xuất hiện dần, con trỏ nhấp nháy |
| **Suggestion** | Card món mini với nút [+ Thêm] |
| **Minimized** | Thu về bubble, badge số tin nhắn chưa đọc |
| **Fallback / Error** | Hiển thị thông báo thân thiện khi mất kết nối + nút "Gọi phục vụ bàn" |

---

## 10. Lựa chọn Mô hình AI

| Mô hình | Tốc độ | Chất lượng | Chi phí (ước tính/ngày*) | Khuyến nghị |
|---------|--------|-----------|--------------------------|-------------|
| **Gemini 1.5 Flash** | ⚡ Rất nhanh | ⭐⭐⭐⭐ | ~$0.04 | ✅ **MVP** |
| Gemini 2.0 Flash | ⚡⚡ Siêu nhanh | ⭐⭐⭐⭐⭐ | ~$0.06 | Giai đoạn 2 |
| GPT-4o-mini | Nhanh | ⭐⭐⭐⭐ | ~$0.08 | Dự phòng |

> *Ước tính dựa trên 100 cuộc chat/ngày × 1,000 token/cuộc.

---

## 11. Kế hoạch Triển khai

### Giai đoạn 1 — Backend Foundation (Tuần 1)

- [ ] Cài đặt package `@google/generative-ai` vào backend
- [ ] Thêm biến môi trường `GEMINI_API_KEY` vào `.env`
- [ ] Tạo `aiService.js` với logic fetch menu + cache Redis
- [ ] Tạo `aiController.js` + `aiRoutes.js`
- [ ] Đăng ký route `/api/ai/consult` trong `index.js`
- [ ] Viết `ariaSystemPrompt.js` (prompt template)
- [ ] Test API với Postman / Insomnia

### Giai đoạn 2 — Frontend Widget (Tuần 2)

- [ ] Tạo `AriaChatWidget` component (UI/UX)
- [ ] Thiết lập socket listener trong `AiChatContext`
- [ ] Implement streaming display (token-by-token)
- [ ] Xây dựng `ChatMessage` với card món + nút [+ Thêm vào giỏ]
- [ ] Tích hợp vào `MenuPage.jsx`
- [ ] Implement auto-trigger sau 5 giây

### Giai đoạn 3 — Nâng cao & Tối ưu (Tuần 3)

- [ ] Upsell trigger tại `CartPage.jsx`
- [ ] Session memory qua Redis (TTL 30 phút)
- [ ] Cá nhân hóa theo `order_history`
- [ ] Database migration thêm cột AI vào `menu_items`
- [ ] Rate limiting (10 req/phút/session)
- [ ] Testing E2E + đo lường performance

---

## 12. Phân tích Rủi ro

| Rủi ro | Mức độ | Biện pháp giảm thiểu |
|--------|--------|----------------------|
| AI gợi ý sai tên/giá món | 🔴 Cao | Validate output — chỉ extract món có trong DB; không tin tuyệt đối văn bản AI |
| Latency cao (> 3 giây) | 🟡 Trung bình | Streaming response + skeleton loading; Redis cache menu; Lightweight 2-Stage RAG |
| Prompt injection từ khách | 🟡 Trung bình | Sanitize input; system prompt có guardrail rõ ràng |
| Chi phí API vượt ngân sách | 🟢 Thấp | Rate limit per session; max token per request; monitor monthly; 2-Stage RAG giảm 85% token |
| Thông tin dị ứng không chính xác | 🔴 Cao | Luôn thêm disclaimer; thiếu data → escalate sang nhân viên |
| Widget ảnh hưởng performance trang | 🟢 Thấp | Lazy load widget; code splitting; Lighthouse target ≥ 90 |
| Khai thác dữ liệu & Prompt Leaking (Jailbreak) | 🔴 Cao | Zero-PII Context (không cấp thông tin nhạy cảm cho AI) + Regex Pre-filter tại middleware + Hardened Guardrails + Cô lập Socket room theo bàn + Rate-limit auto-ban 5 phút |

### Phụ Lục Kỹ Thuật Chuyên Sâu

#### Chuyên đề 12.A: Cơ Chế Đảm Bảo AI Hiểu Đúng Database & Chống Tri Thức Ngoài (Anti-Hallucination)
Nhằm đảm bảo Gemini **chỉ tư vấn đúng 100% món có trong quán** mà không bị ảnh hưởng bởi tri thức bên ngoài:
1. **Context Injection (RAG Đóng):** Gemini không tự nhớ menu qua trọng số pre-train. Mỗi request, Backend truy vấn Supabase/Redis và bơm danh mục món đang `is_available: true` vào prompt động.
2. **Khóa Ràng Buộc "Thế Giới Đóng" (System Prompt):** Quy tắc cưỡng chế: *"Bạn CHỈ ĐƯỢC gợi ý các món có tên nguyên văn trong JSON. TUYỆT ĐỐI KHÔNG dùng kiến thức ẩm thực bên ngoài để bịa ra món không có trong thực đơn quán."*
3. **Kiểm Tra Thực Thể 2 Chiều (Code Chặn):** Backend regex tên món trong câu trả lời và đối chiếu ID thực tế trong Supabase. Nếu không khớp chính xác 100%, Frontend **tuyệt đối không sinh nút bấm [+ Thêm vào giỏ]**.
4. **Fail-safe Dị Ứng & Dữ Liệu Khuyết:** Nếu `ingredients` hoặc `allergens` trong DB đang `NULL`, AI bắt buộc phản hồi: *"Món này chưa có dữ liệu nguyên liệu kiểm định trong hệ thống, xin vui lòng hỏi nhân viên phục vụ"*, không được tự phỏng đoán công thức.

#### Chuyên đề 12.B: Kịch Bản Trigger Upsell & 5 Lớp Chống Race Condition Tại CartPage
Nhằm loại bỏ hoàn toàn xung đột trạng thái khi khách hàng thao tác tăng/giảm món liên tục trên giỏ hàng:
1. **Debounce 800ms:** Khi giỏ hàng thay đổi, frontend hoãn 800ms. Thao tác liên tục sẽ reset bộ đếm, chỉ gửi request khi khách đã dừng tay.
2. **AbortController:** Hủy ngay request upsell cũ đang bay trên đường truyền khi có thao tác giỏ hàng mới.
3. **Cart Versioning (`cartVersion: N`):** Gửi kèm version giỏ hàng. Nếu kết quả AI trả về có version cũ hơn giỏ hiện tại, client tự động drop payload.
4. **Client Exclude Filter:** Lọc sạch trước khi render: `suggestions.filter(dish => !cart.some(c => c.id === dish.id))` tránh gợi ý món khách vừa thêm.
5. **Cooldown 45s:** Khóa trigger trong 45 giây sau mỗi lần hiển thị upsell để không làm phiền khách.
6. **Quy Tắc Heuristics:**
   - *Có món ăn nhưng CHƯA có nước:* Ưu tiên gợi ý 1 loại trà/nước trái cây thanh nhiệt.
   - *Đã có món ăn + nước:* Gợi ý món tráng miệng thanh nhẹ ít ngọt.
   - *Đã đủ combo:* Giữ im lặng, không spam pop-up.

---

## 13. Các Quyết Định Thiết Kế Đã Được Duyệt

Toàn bộ các phương án kỹ thuật cốt lõi đã được thống nhất và phê duyệt:

| Hạng mục quyết định | Lựa chọn đã chốt | Rationale & Ghi chú |
|---|---|---|
| **AI Provider** | **Google Gemini 1.5 Flash** | Phản hồi siêu nhanh (TTFT < 1.2s), chi phí ~$0.04/ngày, khả năng xử lý tiếng Việt ẩm thực tự nhiên. |
| **Cơ chế Trigger Widget** | **Click-only** | Widget hiển thị dưới dạng Floating Bubble nhỏ gọn (glassmorphism), chỉ mở khi khách chủ động click để không làm gián đoạn trải nghiệm xem menu truyền thống. |
| **Ngôn ngữ Tư vấn** | **Tự động theo i18n & ngôn ngữ khách nhập (`auto-detect`)** | Tận dụng hạ tầng `i18n.js` có sẵn của dự án, Aria tự động chào và phản hồi song ngữ Anh - Việt linh hoạt. |
| **Chiến lược Menu Input** | **Lightweight 2-Stage RAG + Redis Cache** | Rút gọn từ 3.000 xuống ~250 token/request (tiết kiệm 85% chi phí), kết hợp cơ chế Fallback 3 Tầng khi không tìm thấy món. |
| **Database Migration** | **Bổ sung 6 cột `NULLable` vào `menu_items`** | Thêm `ingredients`, `allergens`, `spice_level`, `calories`, `ai_description`, `is_trending` với giá trị mặc định `NULL`, an toàn 100% không ảnh hưởng hệ thống đang chạy. |

---

## 14. Định nghĩa "Done" (Definition of Done)

- [ ] Khách quét QR → Aria chào trong vòng **2 giây**
- [ ] Nhập yêu cầu → first token xuất hiện trong **1.5 giây**
- [ ] Gợi ý món → click [+ Thêm vào giỏ] → xuất hiện trong CartPage
- [ ] Hỏi dị ứng → nhận thông tin chính xác **hoặc** disclaimer rõ ràng
- [ ] Widget không làm giảm Lighthouse Performance Score (target ≥ 90)
- [ ] Không có lỗ hổng prompt injection
- [ ] Rate limit hoạt động đúng (10 req/phút/session)
