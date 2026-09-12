# 🏗️ Đề xuất Kiến trúc AI Consultant "Aria" — Tích hợp Pipecat / LiveKit / TEN

> **Dựa trên:** Proposal `ai_consultant_proposal.md` v1.0  
> **Tech Stack hiện tại:** React 19 + Vite · Node.js/Express 5 · Supabase · Redis · Socket.io

---

## 1. Phân tích Nhanh 3 Framework

| Tiêu chí | **Pipecat** | **LiveKit Agents** | **TEN Framework** |
|---|---|---|---|
| **Triết lý cốt lõi** | Pipeline xử lý Frame tuần tự | Infrastructure WebRTC + Agent Room | Directed Graph của Extensions |
| **Ngôn ngữ** | Python | Python (SDK đa nền tảng) | C++ core + Python/JS binding |
| **Transport** | Agnostic (Daily, LiveKit, WS, Twilio) | LiveKit WebRTC (tự quản) | Agnostic |
| **Realtime Voice** | ✅ Mạnh | ✅ Rất mạnh (WebRTC native) | ✅ Mạnh |
| **Text/Chat mode** | ✅ Có | ✅ Có | ✅ Có |
| **Độ phức tạp setup** | 🟡 Trung bình | 🟡 Trung bình | 🔴 Cao |
| **Khả năng mở rộng** | 🟡 Trung bình | 🟢 Cao (production-grade) | 🟢 Rất cao |
| **Phù hợp KLTN/Demo** | ✅ **Tốt nhất** | ✅ Tốt | ⚠️ Overkill |
| **Tích hợp Gemini** | ✅ Native plugin | ✅ Supported | ✅ Supported |
| **Tích hợp Socket.io** | 🔧 Cần custom | ✅ Thay thế Socket.io | 🔧 Cần custom |

---

## 2. Đánh giá Từng Framework với Ngữ cảnh SmartRestaurant

### 2.1 🐱 Pipecat — *"Bộ não linh hoạt"*

**Phù hợp với:** Text-based chat (use case chính của Aria), custom RAG pipeline, entity extraction.

**Điểm mạnh trong context này:**
- Dễ dàng xây dựng pipeline: **User Input → RAG Filter → Gemini → Entity Extractor → Response**
- Có thể chạy cạnh Node.js backend hiện tại thông qua WebSocket transport
- Hỗ trợ streaming token-by-token tự nhiên (đúng yêu cầu proposal)
- Dễ A/B test prompt (thay đổi `ariaSystemPrompt` không cần đụng vào logic pipeline)

**Hạn chế:**
- Cần thêm Python service riêng (microservice) chạy song song với Node.js backend
- Không có WebRTC built-in (nếu sau này muốn voice thì cần tích hợp thêm)

---

### 2.2 🎙️ LiveKit — *"Cơ sở hạ tầng realtime"*

**Phù hợp với:** Nếu Aria mở rộng sang **Voice Mode** (khách nói chuyện trực tiếp với Aria)

**Điểm mạnh trong context này:**
- WebRTC-native: khách hàng nói → Aria nghe → trả lời bằng giọng (STT + LLM + TTS)
- Agent tham gia vào "Room" theo bàn → khớp hoàn hảo với `table_socket_rooms` đã có
- Có thể **thay thế hoàn toàn Socket.io** cho luồng AI (nhưng cần giữ Socket.io cho các feature khác như order notification)
- Production-ready, dễ scale cho nhiều bàn đồng thời

**Hạn chế:**
- Cần deploy LiveKit Server (self-hosted hoặc LiveKit Cloud)
- Overkill cho text-only chat trong MVP
- Tăng độ phức tạp infrastructure cho KLTN demo

---

### 2.3 🕸️ TEN Framework — *"Bộ não phức tạp"*

**Phù hợp với:** Multi-agent orchestration, stateful planning (quá mức cần thiết cho MVP)

**Điểm mạnh:**
- Modular extensions: mỗi node là 1 extension (RAG, Gemini, Entity Extractor...)
- Phù hợp nếu sau này mở rộng sang **Multi-Agent** (Aria + Admin Analytics AI + Kitchen AI cùng hoạt động)

**Hạn chế cho KLTN:**
- C++ core → build phức tạp, khó debug
- Learning curve cao
- Overkill hoàn toàn cho text chatbot 1 AI đơn giản

---

## 3. 🎯 Đề xuất Kiến trúc Theo 3 Phương án

### Phương án A — **Pipecat-Centric** ⭐ *Khuyến nghị cho KLTN*

> Pipecat xử lý toàn bộ logic AI pipeline, Node.js backend làm gateway

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER BROWSER                            │
│                                                                     │
│   MenuPage / CartPage                                               │
│   ┌──────────────────────┐   ┌──────────────────────────────────┐   │
│   │   Menu Grid / Cart   │   │   🤖 Aria Chat Widget (React)    │   │
│   └──────────────────────┘   └──────────────────────┬───────────┘   │
│                                        ↕ Socket.io (existing)      │
└────────────────────────────────────────┼────────────────────────────┘
                                         │
┌────────────────────────────────────────▼────────────────────────────┐
│              GATEWAY — Node.js / Express (hiện có)                  │
│                                                                     │
│   POST /api/ai/consult                                              │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │  AI Gateway Controller                                       │  │
│   │  1. Validate & rate-limit (Redis)                            │  │
│   │  2. Fetch RAG context (menu top-6 từ Supabase/pgvector)      │  │
│   │  3. Forward sang Pipecat Service qua HTTP / gRPC             │  │
│   │  4. Stream token từ Pipecat → emit Socket.io                 │  │
│   └────────────────────────────────────┬─────────────────────────┘  │
│                                        │                            │
│   ┌────────────────────────────────────▼─────────────────────────┐  │
│   │  Redis                                                       │  │
│   │  - menu:{restaurantId}      TTL 5m                           │  │
│   │  - ai_session:{sessionId}   TTL 30m                          │  │
│   │  - ai_ratelimit:{sessionId} TTL 1m                           │  │
│   └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                         │ HTTP / WebSocket
┌────────────────────────────────────────▼────────────────────────────┐
│              PIPECAT AI SERVICE (Python FastAPI)                     │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │  AriaConversationPipeline                                    │  │
│   │                                                              │  │
│   │  [TextInput Frame]                                           │  │
│   │       │                                                      │  │
│   │       ▼                                                      │  │
│   │  [SystemPromptBuilder]   ← menu_context, cart, history       │  │
│   │       │                                                      │  │
│   │       ▼                                                      │  │
│   │  [GeminiLLMProcessor]    ← Gemini 1.5 Flash (streaming)      │  │
│   │       │                                                      │  │
│   │       ▼                                                      │  │
│   │  [EntityExtractor]       ← Parse tên món → map Supabase IDs  │  │
│   │       │                                                      │  │
│   │       ▼                                                      │  │
│   │  [StructuredOutputFrame] ← { text, suggestedItems[] }        │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
      Supabase               Gemini API
   (pgvector RAG,          (Flash 1.5)
    menu_items,
    order_history)
```

**File structure bổ sung:**
```
SmartRestaurant/
├── backend/                     ← Node.js (hiện có) — làm AI Gateway
│   └── src/
│       ├── routes/aiRoutes.js
│       ├── controllers/aiController.js
│       └── services/
│           ├── ragService.js         ← 2-Stage RAG query (pgvector)
│           └── pipecatClient.js      ← HTTP client gọi Pipecat Service
│
└── ai-service/                  ← NEW: Python Pipecat microservice
    ├── main.py                       ← FastAPI app
    ├── pipelines/
    │   └── aria_pipeline.py          ← AriaConversationPipeline
    ├── processors/
    │   ├── system_prompt_builder.py  ← Layer 1+2 prompt builder
    │   └── entity_extractor.py       ← Extract & map món từ AI response
    ├── prompts/
    │   └── aria_system_prompt.py     ← System prompt template
    └── requirements.txt
        # pipecat-ai[google]
        # fastapi, uvicorn
        # google-generativeai
```

**Luồng hoạt động:**
```
Browser → Socket.io → Node.js Gateway
    → RAG query Supabase (Top 6 món)
    → HTTP POST Pipecat Service {message, context, cart, session}
    → Pipecat Pipeline: Build Prompt → Gemini Flash → Extract Entities
    → Stream tokens back → Node.js → Socket.io emit → Browser render
```

---

### Phương án B — **LiveKit Voice Extension** ⭐ *Cho giai đoạn 2 — Voice Mode*

> Giữ nguyên Phương án A cho text chat, thêm LiveKit Agent cho voice mode

```
┌──────────────────────────────────────────────────────────────┐
│                    CUSTOMER BROWSER                           │
│                                                              │
│   Aria Chat Widget                                           │
│   ┌───────────────────────────────────────────────────────┐  │
│   │  [💬 Text Mode]  ←───── Socket.io (Pipecat pipeline) │  │
│   │  [🎙️ Voice Mode] ←───── LiveKit WebRTC Room          │  │
│   └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         │ Text                     │ Voice (WebRTC)
         ▼                         ▼
  Node.js Gateway          LiveKit Server
  + Pipecat Service        (self-hosted / Cloud)
                                   │
                           LiveKit Agent (Python)
                           ┌───────────────────┐
                           │ STT (Deepgram)     │
                           │ LLM (Gemini Flash) │  ← Cùng System Prompt
                           │ TTS (ElevenLabs/   │    với Pipecat
                           │      Google TTS)   │
                           └───────────────────┘
```

**LiveKit Agent tham gia room `table_{tableId}`:**
- Khách nhấn nút 🎙️ → Tạo LiveKit Room theo bàn
- Agent join room → lắng nghe voice → STT → Gemini → TTS → phát âm
- Aria nói: *"Chào bàn số 5! Dạ quán có món Bún bò Huế rất ngon hôm nay..."*

---

### Phương án C — **TEN Framework — Multi-Agent Future** *(Nghiên cứu, không dùng ngay)*

> Dùng khi mở rộng sang kiến trúc multi-agent phức tạp

```
TEN Graph:
┌──────────────┐    ┌────────────────┐    ┌─────────────────┐
│ AriaAgent    │───►│ AdminAnalytics │───►│ KitchenAssistant│
│ (Customer    │    │ Agent          │    │ Agent           │
│  Facing)     │    │ (Order trends) │    │ (Prep time est) │
└──────────────┘    └────────────────┘    └─────────────────┘
       │
  Extensions:
  ├── RAGExtension (pgvector)
  ├── GeminiExtension
  ├── EntityExtractorExtension
  └── UpsellTriggerExtension
```

---

## 4. 🏆 Khuyến nghị Cuối cùng

### Roadmap tích hợp theo giai đoạn:

```
Giai đoạn 1 — MVP Text Chat (Phương án A)
    ↓  Node.js Gateway + Pipecat Python Service
    ↓  Text-based Aria, streaming, RAG, entity extraction
    ↓  2–3 tuần implement

Giai đoạn 2 — Voice Mode (Phương án A + B)
    ↓  Thêm LiveKit Server + LiveKit Agent
    ↓  Voice option trong Aria Widget (🎙️ button)
    ↓  STT → Gemini → TTS pipeline
    ↓  1–2 tuần bổ sung

Giai đoạn 3 — Multi-Agent (Phương án C, optional)
    ↓  TEN Framework cho Admin Analytics AI
    ↓  Kết nối Aria Agent ↔ Admin Agent
    ↓  Nghiên cứu dài hạn
```

### Ma trận Quyết định theo mục tiêu KLTN:

| Mục tiêu | Phương án A (Pipecat) | Phương án B (LiveKit) | Phương án C (TEN) |
|---|---|---|---|
| **Demo KLTN trong 3 tuần** | ✅ Khả thi | ⚠️ Cần thêm infra | ❌ Quá phức tạp |
| **Text chat Aria** | ✅ Core use case | ✅ Được | ✅ Được |
| **Voice mode** | ⚠️ Cần thêm STT/TTS | ✅ Native | ✅ Được |
| **RAG + Entity Extraction** | ✅ Dễ custom processor | ✅ Được | ✅ Native |
| **Tích hợp Socket.io hiện có** | ✅ Giữ nguyên | ⚠️ Thay thế một phần | ✅ Giữ nguyên |
| **Không phá vỡ kiến trúc cũ** | ✅ Hoàn toàn additive | ⚠️ Cần LiveKit Server | ✅ Additive |
| **Production Scale** | 🟡 | ✅ | ✅ |

---

## 5. Cấu trúc Thư mục Đề xuất (Phương án A — Khuyến nghị)

```
SmartRestaurant/
├── backend/                          ← Node.js (hiện có)
│   └── src/
│       ├── routes/
│       │   └── aiRoutes.js           ← POST /api/ai/consult
│       ├── controllers/
│       │   └── aiController.js       ← Validate, rate-limit, Socket emit
│       └── services/
│           ├── ragService.js         ← 2-Stage RAG (pgvector Supabase)
│           ├── pipecatClient.js      ← Gọi Pipecat microservice
│           └── prompts/
│               └── ariaSystemPrompt.js  ← Dùng chung với Python
│
├── ai-service/                       ← NEW: Pipecat Python microservice
│   ├── Dockerfile
│   ├── main.py                       ← FastAPI + WebSocket endpoint
│   ├── pipelines/
│   │   └── aria_pipeline.py          ← Pipecat Pipeline definition
│   ├── processors/
│   │   ├── system_prompt_builder.py  ← Dynamic context builder
│   │   ├── entity_extractor.py       ← Menu name → Supabase ID map
│   │   └── fallback_handler.py       ← Fallback 3 tầng logic
│   ├── prompts/
│   │   └── aria_system_prompt.py     ← System prompt (Tiếng Việt)
│   └── requirements.txt
│
├── frontend/                         ← React (hiện có)
│   └── src/
│       ├── components/
│       │   └── AriaChatWidget/
│       │       ├── index.jsx
│       │       ├── ChatMessage.jsx
│       │       └── AriaChatWidget.css
│       ├── pages/customer/
│       │   ├── MenuPage.jsx          ← [MODIFY] embed widget
│       │   └── CartPage.jsx          ← [MODIFY] embed + upsell trigger
│       └── contexts/
│           └── AiChatContext.jsx     ← Socket listener, session mgmt
│
└── docker-compose.yml               ← [MODIFY] thêm ai-service container
```

---

## 6. Mapping Yêu cầu Proposal → Framework Component

| Yêu cầu từ Proposal | Component xử lý | Framework |
|---|---|---|
| 3-Layer Prompt (System + Dynamic + User) | `SystemPromptBuilder` processor | **Pipecat** |
| Lightweight 2-Stage RAG | `ragService.js` → `GeminiLLMProcessor` | Node.js + **Pipecat** |
| Streaming token-by-token | Pipecat native streaming → Socket.io | **Pipecat** + Socket.io |
| Entity Extraction (tên món → ID) | `EntityExtractor` processor | **Pipecat** |
| Fallback 3 tầng | `FallbackHandler` processor | **Pipecat** |
| Session Memory (Redis TTL 30m) | Redis + session frame context | Node.js Redis |
| Rate Limiting | AI Gateway Controller | Node.js |
| Voice Mode (tương lai) | LiveKit Agent (STT+LLM+TTS) | **LiveKit** |
| Multi-Agent (Admin AI, Kitchen AI) | TEN Extensions Graph | **TEN** |

---

## 7. So sánh Kiến trúc Proposal Gốc vs. Kiến trúc Mới

| Thành phần | Proposal Gốc | Kiến trúc Pipecat |
|---|---|---|
| **AI call** | `aiService.js` gọi Gemini trực tiếp | Pipecat Pipeline gọi Gemini |
| **Prompt building** | Logic trong `aiService.js` | `SystemPromptBuilder` processor (tách biệt) |
| **Entity extraction** | Hàm trong `aiService.js` | `EntityExtractor` processor (tách biệt) |
| **Streaming** | Gemini stream → Socket.io emit | Pipecat OutputFrame → Node.js → Socket.io |
| **Fallback** | Logic trong `aiService.js` | `FallbackHandler` processor (tách biệt) |
| **Testability** | Test cả `aiService.js` | Test từng processor riêng biệt ✅ |
| **Extensibility** | Thêm vào `aiService.js` | Thêm processor mới vào pipeline ✅ |

> **Lợi ích chính:** Pipecat giúp tách bạch từng bước xử lý thành processor độc lập → dễ test, dễ swap (đổi từ Gemini sang GPT-4o chỉ cần đổi 1 processor), dễ A/B test prompt.
