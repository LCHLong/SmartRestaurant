# Hệ thống Hỗ trợ Khách hàng Agentic Tự tiến hóa tại LinkedIn
## (Self-evolving Agentic Customer Support System at LinkedIn)

**Chih Hui Wang\*, Mengdie Tu\*, Qianyun Zhang\*, Wei Wu\*, Lili Zhou, Mingqi Shen, Changshuai Wei†**  
*LinkedIn*  
`{ciwang, metu, qazhang, wwu1, lizhou, minshen, chawei}@linkedin.com`  
*arXiv:2608.10224v1 [cs.AI] 10 Aug 2026*  
(\* Đóng góp ngang nhau; † Tác giả liên hệ)

---

### Tóm tắt (Abstract)

Các tác tử hỗ trợ khách hàng cấp doanh nghiệp (*enterprise support agents*) hoạt động trong các môi trường thay đổi nhanh chóng, nơi các chính sách (*policies*), năng lực sản phẩm, và cơ sở tri thức (*knowledge bases*) liên tục tiến hóa, khiến các trợ lý tĩnh (*static assistants*) trở nên mong manh (*brittle*) và tốn kém chi phí bảo trì. Chúng tôi giới thiệu hệ thống hỗ trợ mang tính tác tử tự tiến hóa (*self-evolving agentic support system*) của LinkedIn, tích hợp kỹ thuật sinh tăng cường truy xuất (*retrieval-augmented generation - RAG*) với cơ chế tự động tối ưu hóa câu nhắc bằng thuật toán tiến hóa (*evolutionary auto-prompting*) và một khuôn khổ đánh giá mô-đun hóa, bám sát môi trường sản xuất (*production-aligned evaluation framework*) nhằm tạo điều kiện cải tiến liên tục, an toàn mà không cần tái huấn luyện các mô hình nền tảng (*foundation models*). Hệ thống xử lý các câu nhắc (*prompts*), quá trình truy xuất (*retrieval*), và việc đánh giá (*evaluation*) như một quy trình làm việc khép kín, có quản lý phiên bản (*versioned workflow*) kèm theo các rào chắn vận hành (*operational guardrails*). 

Các mô phỏng ngoại tuyến (*offline simulations*) và các nghiên cứu cắt bỏ (*ablations*) cho thấy sự cải thiện chất lượng rõ rệt so với RAG thông thường (*vanilla RAG*) và các tác tử đường cơ sở (*baseline agents*), bao gồm việc giảm thiểu ảo giác (*hallucinations*) và cải thiện độ hoàn thiện của câu trả lời (*completeness*). Trong một thử nghiệm A/B ngẫu nhiên hóa theo người dùng (*user-randomized A/B test*) kéo dài hai tuần trên lưu lượng hỗ trợ thực tế của LinkedIn, quy trình làm việc tự tiến hóa tích hợp đã giúp tăng tỷ lệ tự phục vụ hỏi đáp (*QA self-serve*) thêm 9,0 điểm phần trăm (*percentage points*), tỷ lệ tự phục vụ hủy dịch vụ (*cancellation self-serve*) thêm 4,8 điểm phần trăm, và độ chính xác định tuyến (*routing accuracy*) thêm 30,6 điểm phần trăm. Những kết quả này chứng minh một lộ trình thực tiễn để xây dựng các tác tử AI tự tiến hóa, có khả năng mở rộng trong các bối cảnh doanh nghiệp thực tế.

---

## 1. Giới thiệu (Introduction)

Hỗ trợ khách hàng trong doanh nghiệp ngày càng được làm trung gian bởi các tác tử AI (*AI agents*), tuy nhiên các triển khai trong thế giới thực phải đối mặt với một vấn đề về độ tin cậy mang tính chất khác biệt về mặt bản chất so với các bộ chuẩn đánh giá chatbot thông thường. Tại LinkedIn, dịch vụ hỗ trợ trải rộng trên nhiều bề mặt sản phẩm (*product surfaces*), nhiều mảng kinh doanh (*lines of business - LoB*), và hàng chục ngôn ngữ, trong khi hệ sinh thái nền tảng liên tục biến đổi: các đợt ra mắt sản phẩm định hình lại cơ sở tri thức, nội dung được xuất bản mới hoặc ngừng sử dụng (*deprecated*), các chỉ mục truy xuất được làm mới, các câu nhắc (*prompts*) tiến hóa, và các LLM cũng như API công cụ bên dưới thay đổi theo thời gian. Ngay cả những thay đổi nhỏ ở thượng nguồn (*upstream changes*) cũng có thể gây ra hiện tượng thoái lui (*regressions*) — ảo giác (*hallucinations*), chỉ dẫn lỗi thời (*stale guidance*), các luồng công cụ bị gãy đổ, hoặc giọng điệu đa ngôn ngữ không nhất quán — khiến cho một trợ lý kiểu "thiết lập một lần rồi bỏ mặc" (*set-and-forget*) trở nên mong manh và cực kỳ tốn kém để bảo trì. 

Các tác tử hỗ trợ trong môi trường sản xuất truyền thống — được xây dựng dựa trên một câu nhắc thủ công (*handcrafted prompt*), một đường ống truy xuất cố định (*fixed retrieval pipeline*), và quy trình đảm bảo chất lượng (QA) định kỳ của con người — không thể mở rộng kịp với tốc độ biến đổi này, đồng thời thiếu đi một vòng lặp phản hồi có nguyên tắc (*principled feedback loop*) có thể phát hiện sự thoái lui, khoanh vùng lỗi vào các thành phần cụ thể, và tự thích ứng mà không cần sự can thiệp nặng nề của con người.

Ba hướng nghiên cứu gần đây thúc đẩy thiết kế mà chúng tôi trình bày:
1. **Tối ưu hóa câu nhắc (Prompt Optimization):** Xử lý các *prompts* như các chương trình phần mềm, với tìm kiếm dựa trên điểm số (APE [Zhou et al., 2023]), sử dụng LLM như bộ tối ưu hóa (OPRO [Yang et al., 2024]), tìm kiếm tiến hóa (PromptBreeder, EvoPrompt [Fernando et al., 2023; Guo et al., 2024]), và biên dịch khai báo (DSPy [Khattab et al., 2023]), tất cả đều chứng minh rằng các câu nhắc có thể được tiến hóa ngoại tuyến dựa trên các chỉ số nhiệm vụ và được phân phối như các tạo tác có quản lý phiên bản (*versioned artifacts*).
2. **Đánh giá bằng LLM-as-a-judge:** Cho phép đánh giá chất lượng đa chiều có thể mở rộng (Zheng et al., 2023; Liu et al., 2023), với các thiên lệch đã được ghi nhận có thể được giảm thiểu thông qua các bảng tiêu chí đánh giá có cấu trúc (*structured rubrics*), kiểm soát độ dài (Dubois et al., 2024), và các mô hình đánh giá mở (Kim et al., 2024).
3. **Sinh tăng cường truy xuất (Retrieval-Augmented Generation - RAG):** Tiếp đất (*grounds*) các câu trả lời vào tri thức độc quyền (Lewis et al., 2020b; Karpukhin et al., 2020; Gao et al., 2023a), và các biến thể tự phản tư gần đây (Self-RAG, CRAG [Asai et al., 2024; Yan et al., 2024]) xử lý việc truy xuất như một hành động tác tử tường minh (*explicit agent action*) thay vì một bước tiền xử lý, phù hợp với các mô hình mẫu suy luận và hành động (*reasoning-and-acting paradigms* [Yao et al., 2023]).

Đối với hỗ trợ khách hàng doanh nghiệp, hàm ý vận hành của những tiến bộ này là: **prompts, bộ truy xuất, và bộ đánh giá đều trở thành các tạo tác có quản lý phiên bản có thể thay đổi thường xuyên** — và thường hoạt động giống như các thay đổi chính sách ảnh hưởng đến việc định tuyến (*routing*), ngưỡng leo thang (*escalation thresholds*), tư thế an toàn, và giọng điệu thương hiệu trên nhiều sản phẩm và ngôn ngữ. Do đó, một hệ thống tự tiến hóa đòi hỏi không chỉ sự tối ưu hóa, mà còn cả kỷ luật kỹ nghệ (*engineering discipline*) để triển khai các thay đổi này một cách an toàn: kiểm thử hồi quy (*regression testing*), triển khai theo giai đoạn (*staged rollout*), thăng cấp có kiểm duyệt (*gated promotion*), và khả năng khôi phục phiên bản (*rollback*). Tầng đánh giá của chúng tôi lần lượt phải đủ tin cậy để thúc đẩy các quyết định này ở quy mô lớn, vững vàng trước sự trôi dạt tri thức (*knowledge drift*), và được phân rã thành các tín hiệu có thể giải thích được để các lỗi hỏng có thể được quy gán nguyên nhân và xử lý triệt để.

Chúng tôi đồng tiến hóa (*co-evolve*) ba tầng này dưới sự kiểm soát phiên bản nghiêm ngặt, **cố ý tránh việc tinh chỉnh trọng số mô hình (fine-tuning)** vì tri thức hỗ trợ thay đổi quá nhanh so với các chu kỳ tái huấn luyện, và vì việc nạp tri thức dựa trên truy xuất thường vượt trội hơn tinh chỉnh không giám sát đối với các cập nhật mang tính sự kiện thực tế (Ovadia et al., 2024; Soudani et al., 2024). Tầng đánh giá của chúng tôi được cấu trúc dưới dạng các tác tử đánh giá chuyên biệt (*specialized evaluator agents* [Wu et al., 2023]), và "bộ nhớ" vận hành của chúng tôi được triển khai dưới dạng các tạo tác có giới hạn, có thể kiểm toán và có phiên bản (*bounded, auditable, versioned artifacts*) thay vì bộ nhớ dài hạn không bị ràng buộc (Packer et al., 2023; Shinn et al., 2023).

### Các đóng góp chính (Contributions)
Chúng tôi:
1. Mô tả một tác tử hỗ trợ tự tiến hóa từ đầu đến cuối (*end-to-end self-evolving support agent*) duy trì được độ tin cậy dưới sự thay đổi liên tục ở thượng nguồn thông qua đánh giá và tối ưu hóa khép kín;
2. Trình bày một bộ máy tiến hóa câu nhắc tự động (*automatic prompt evolution engine*) phù hợp với các ràng buộc doanh nghiệp (giọng điệu, chính sách, đa ngôn ngữ);
3. Đề xuất một khuôn khổ đánh giá đa tín hiệu, có tính mô-đun (*modular, multi-signal evaluation framework*) có khả năng hành động để gỡ lỗi ở quy mô lớn;
4. Trình bày chi tiết một tầng công cụ và RAG được kiểm soát phiên bản, hỗ trợ tính tái lập (*reproducibility*), triển khai an toàn, và khôi phục khi có sự cố.

---

## 2. Phương pháp luận (Methodology)

### 2.1 Hệ thống Tổng thể (Overall system)

Hình 1 minh họa Tác tử AI Hỗ trợ (*Support AI Agent*) như một hệ thống tự tiến hóa khép kín, trong đó việc tạo câu nhắc (*prompting*), truy xuất (*retrieval*), và đánh giá (*evaluation*) tạo thành một chu trình phản hồi tường minh (*explicit feedback cycle*). 

Tại thời điểm suy luận (*inference time*), tác tử được điều kiện hóa bởi một câu nhắc hệ thống (*system prompt*) từ Bộ máy Câu nhắc Tự động (*Automatic Prompt Engine*), mã hóa các hướng dẫn nhiệm vụ, giọng điệu, và các chính sách ngầm định về độ sâu suy luận cùng việc sử dụng công cụ. RAG được phơi bày như một hành động tường minh (*explicit action*) thay vì một bước tiền xử lý, cho phép tác tử tự quyết định thời điểm cần truy xuất và cách tích hợp bằng chứng, nhất quán với các mô hình mẫu suy luận và hành động (*reasoning-and-acting* [Yao et al., 2023; Schick et al., 2023]). 

Các đầu ra được chấm điểm bởi một khuôn khổ đánh giá mô-đun hóa, phân rã chất lượng thành:
- Tính bám sát ngữ cảnh (*grounding*);
- Sự căn chỉnh ý định (*intent alignment*);
- Độ trung thực đa ngôn ngữ (*multilingual fidelity*);
- Tính tuân thủ phong cách (*stylistic compliance*);
sử dụng các chẩn đoán dựa trên quy tắc (*rule-based diagnostics*) kết hợp với các giám khảo dựa trên LLM (*LLM-based judges* [Zheng et al., 2023]). 

Các tín hiệu độ phù hợp tổng hợp (*aggregate fitness signals*) được đưa ngược trở lại bộ máy câu nhắc, nơi tinh chỉnh câu nhắc hệ thống thông qua tìm kiếm tiến hóa (*evolutionary search*). Kiến trúc phơi bày hai vòng lặp lồng nhau:
- **Vòng lặp suy luận bên trong (Inner inference loop):** `tác tử ↔ RAG ↔ hồ nội dung (content lake)`;
- **Vòng lặp tối ưu hóa bên ngoài (Outer optimization loop):** `auto-prompt → tác tử → bộ đánh giá → auto-prompt`;
cho phép tự cải tiến có khả năng mở rộng và thích ứng nhanh chóng trên nhiều sản phẩm và ngôn ngữ mà không cần sửa đổi mô hình gốc (*base model*) hay kho ngữ liệu truy xuất.

```
+---------------------------------------------------------------------------------------------------+
|               HÌNH 1: KIẾN TRÚC TÁC TỬ AI HỖ TRỢ TỰ TIẾN HÓA (SELF-EVOLVING SUPPORT AGENT)        |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|                       ┌─────────────────────────┐             ┌─────────────────────────┐         |
|                       │       User Query        │             │     Agent Response      │         |
|                       │     + Chat Context      │             │      (+ citations)      │         |
|                       └────────────┬────────────┘             └────────────▲────────────┘         |
|                                    │ Request                               │                      |
|   ╔════════════════════════════════╪═══════════════════════════════════════╪══════════════════╗   |
|   ║ CLOSED-LOOP SELF-EVOLUTION     │                                       │                  ║   |
|   ║                                ▼                                       │                  ║   |
|   ║   ┌──────────────────┐    optimized     ┌──────────────────┐  responses │ ┌───────────────┐ ║   |
|   ║   │   Auto-Prompt    │  system prompt   │ Support AI Agent │  + traces  │ │    Modular    │ ║   |
|   ║   │      Engine      ├─────────────────►│   (reason + act) ├────────────┴►│  Evaluation   │ ║   |
|   ║   │  (evolutionary   │                  └────────▲───┬─────┘              │   Framework   │ ║   |
|   ║   │     search)      │                           │   │                    │   (scores &   │ ║   |
|   ║   └────────▲─────────┘          grounding docs   │   │ tool invocation    │  diagnostics) │ ║   |
|   ║            │                    + provenance     │   │ (as action)        └───────┬───────┘ ║   |
|   ║            │                                     │   │                            │         ║   |
|   ║            │ fitness signals (multi-metric)      │   ▼                            │         ║   |
|   ║            └─────────────────────────────────────┼───┴────────────────────────────┘         ║   |
|   ║                                                  │                                          ║   |
|   ╚══════════════════════════════════════════════════╪══════════════════════════════════════════╝   |
|                                                      │                                            |
|                                                      ▼                                            |
|                                            ┌──────────────────┐                                   |
|                                            │     RAG Tool     │                                   |
|                                            │(retrieve evidence│                                   |
|                                            └─────────┬────────┘                                   |
|                                                      │ retrieve top-k evidence                    |
|                                                      ▼                                            |
|                                            ┌──────────────────┐                                   |
|                                            │Versioned Content │                                   |
|                                            │       Lake       │                                   |
|                                            │ (help/learn/docs)│                                   |
|                                            └──────────────────┘                                   |
|                                                                                                   |
|   • What evolves (Thành phần tiến hóa): Chính sách câu nhắc (sử dụng tool, giọng điệu, cấu trúc). |
|   • What stays fixed per iteration (Thành phần cố định): Base LLM (GPT-4o-mini) + Content snapshot|
+---------------------------------------------------------------------------------------------------+
```
*Hình 1: Kiến trúc Tác tử AI Hỗ trợ tự tiến hóa. Điều tiến hóa: các chính sách câu nhắc (sử dụng công cụ, giọng điệu, cấu trúc). Điều cố định trong mỗi lần lặp: LLM nền tảng (GPT-4o-mini qua Azure OpenAI) + ảnh chụp nhanh nội dung (content snapshot).*

### 2.2 Auto-Prompt (Bộ máy Câu nhắc Tự động)

Phát triển câu nhắc thủ công là một nút thắt cổ chai lớn trong môi trường sản xuất: trong triển khai của chúng tôi, một lần lặp cho một mảng kinh doanh (*line of business - LoB*) có thể mất hàng tuần. Chúng tôi thay thế quy trình này bằng Bộ máy Kỹ nghệ Câu nhắc Tự động (*Automatic Prompt Engineering Engine - "Auto-Prompt"*), công thức hóa việc tối ưu hóa câu nhắc dưới dạng tìm kiếm tiến hóa (*evolutionary search*) lấy cảm hứng từ các giải thuật di truyền (*genetic algorithms* [Holland, 1992; Whitley, 1994]). 

Các quy tắc kinh doanh đặc thù của miền (*domain-specific business rules*) sẽ dẫn hướng giai đoạn khởi tạo do LLM điều khiển, sau đó một quần thể các câu nhắc ứng viên (*population of candidate prompts*) sẽ tiến hóa thông qua:
- **Chọn lọc (*Selection*);**
- **Lai ghép (*Crossover*);**
- **Đột biến (*Mutation*);**
được đánh giá ở mỗi thế hệ dựa trên các chỉ số đặc thù của nhiệm vụ; chỉ những cá thể mạnh nhất mới tồn tại vào lần lặp tiếp theo. Toàn bộ mã giả được thể hiện trong **Thuật toán 1**.

Tìm kiếm tiến hóa đặc biệt phù hợp với bối cảnh này vì tối ưu hóa câu nhắc là bài toán tìm kiếm hộp đen (*black-box*), không khả vi (*non-differentiable search*) trên không gian văn bản rời rạc, với độ phù hợp (*fitness*) được cung cấp bởi các bộ đánh giá dựa trên LLM và dựa trên quy tắc. Không giống như phương pháp leo đồi với một ứng viên duy nhất (*single-candidate hill climbing*), một quần thể lưu giữ các kết hợp đa dạng về giọng điệu, chính sách sử dụng công cụ, độ sâu suy luận, và cấu trúc câu trả lời; phép lai ghép (*crossover*) tái tổ hợp các chỉ dẫn bổ trợ được phát hiện trong các dòng dõi khác nhau, trong khi phép đột biến (*mutation*) cung cấp khả năng khám phá cục bộ (*local exploration*). 

Các phương pháp như APE và OPRO tối ưu hóa câu nhắc thông qua sinh văn bản được dẫn hướng bởi điểm số (Zhou et al., 2023; Yang et al., 2024), và DSPy biên dịch các chương trình khai báo dựa trên các chỉ số (Khattab et al., 2023); việc chúng tôi sử dụng tiến hóa có ràng buộc (*constrained evolution*) nhấn mạnh vào tính đa dạng của quần thể, sự tái tổ hợp, và các bộ lọc chính sách doanh nghiệp bất biến. Nghiên cứu cắt bỏ trong Bảng 2 kiểm tra xem liệu cả hai toán tử tiến hóa này có thực sự cần thiết hay không.

Để ngăn chặn sự trôi dạt tiến hóa (*evolutionary drift*) vi phạm các yêu cầu an toàn hoặc chính sách, các quy tắc kinh doanh được xử lý như **các ràng buộc cứng bất biến (*immutable hard constraints*)** chứ không phải các mục tiêu tối ưu hóa: các câu nhắc vi phạm sẽ bị lọc bỏ hoặc bị gán độ phù hợp bằng 0 trước khi thực hiện chọn lọc. Do đó, lai ghép và đột biến hoạt động bên trong một không gian câu nhắc bị ràng buộc, bảo tồn các hành vi bắt buộc ngay từ cấu trúc thiết kế (*by construction*), đảm bảo các cải tiến tiến hóa nhắm trúng vào độ chính xác mà không làm xói mòn tính tuân thủ hoặc các bất biến của sản phẩm.

---

**Thuật toán 1: Genetic Prompt Optimization (Tối ưu hóa Câu nhắc bằng Giải thuật Di truyền)**

- **Require (Yêu cầu đầu vào):** Quy tắc nghiệp vụ $\mathcal{R}$ (*Business rules*), tập dữ liệu đánh giá $\mathcal{D}$ (*evaluation dataset*), kích thước quần thể $N$ (*population size*), số lượng cá thể tinh hoa $K$ (*elite size*), số thế hệ tối đa $G$ (*maximum generations*), hàm chấm điểm $\mathcal{S}(\cdot)$ (*scoring function*).
- **Ensure (Đầu ra đảm bảo):** Câu nhắc tối ưu $p^*$ (*Optimized prompt*).
- **1:** Khởi tạo quần thể câu nhắc ban đầu: $P_0 \leftarrow \text{LLMGenerate}(\mathcal{R}, N)$
- **2:** Khởi tạo bộ nhớ đệm đánh giá: $\mathcal{C} \leftarrow \emptyset$
- **3:** **for** $g = 1$ **to** $G$ **do**
- **4:** $\quad$ **for each** prompt $p \in P_{g-1}$ **do**
- **5:** $\quad\quad$ **if** $p \notin \mathcal{C}$ **then**
- **6:** $\quad\quad\quad$ Chạy suy luận LLM trên tập $\mathcal{D}$ sử dụng $p$
- **7:** $\quad\quad\quad$ Tính toán độ phù hợp: $f(p) \leftarrow \mathcal{S}(p, \mathcal{D})$
- **8:** $\quad\quad\quad$ Lưu $(p, f(p))$ vào bộ nhớ đệm $\mathcal{C}$
- **9:** $\quad\quad$ **else**
- **10:** $\quad\quad\quad$ Lấy $f(p)$ từ bộ nhớ đệm $\mathcal{C}$
- **11:** $\quad\quad$ **end if**
- **12:** $\quad$ **end for**
- **13:** $\quad$ Chọn ra top-$K$ câu nhắc tinh hoa $E_g \subset P_{g-1}$ dựa trên độ phù hợp $f(p)$
- **14:** $\quad$ Khởi tạo quần thể mới: $P_g \leftarrow E_g$
- **15:** $\quad$ **while** $|P_g| < N$ **do**
- **16:** $\quad\quad$ Lấy mẫu cặp câu nhắc cha mẹ $(p_i, p_j)$ từ tập tinh hoa $E_g$
- **17:** $\quad\quad$ $p' \leftarrow \text{SemanticBlend}(p_i, p_j)$ *(Lai ghép ngữ nghĩa qua tái tổ hợp prompt do LLM dẫn hướng)*
- **18:** $\quad\quad$ $p'' \leftarrow \text{Mutate}(p')$ *(Đột biến áp dụng các nhiễu loạn ngữ nghĩa: diễn đạt lại, tái cân bằng trọng số ràng buộc bằng LLM)*
- **19:** $\quad\quad$ Thêm $p''$ vào quần thể $P_g$
- **20:** $\quad$ **end while**
- **21:** **end for**
- **22:** **return** $p^* \leftarrow \arg\max_{p \in P_G} f(p)$

---

### 2.3 Sinh Tăng cường Truy xuất (Retrieval Augmented Generation - RAG)

Tri thức hỗ trợ mang tính độc quyền và liên tục thay đổi, do đó chúng tôi tiếp đất (*ground*) các câu trả lời vào nội dung được truy xuất thay vì dựa vào tri thức tham số của mô hình (*parametric model knowledge* [Lewis et al., 2020b; Guu et al., 2020]). Chúng tôi rời xa các đường ống truy xuất cố định và **phơi bày RAG như một công cụ mà tác tử chủ động kích hoạt bên trong vòng lặp suy luận của nó** (Yao et al., 2023; Schick et al., 2023), cho phép mô hình tự quyết định khi nào cần truy xuất và truy vấn như thế nào, phản chiếu các hệ thống RAG mang tính tác tử (*agentic RAG*) gần đây (Press et al., 2023; Shinn et al., 2023).

Cơ sở tri thức hợp nhất của chúng tôi củng cố ba nguồn nội dung:
1. Các bài viết trợ giúp (*help articles*);
2. Nội dung học tập (*learning content*);
3. Các trang web vi mô tài liệu sản phẩm (*product documentation microsites*).

Các nguồn này được làm mới bởi một đường ống ETL (*Extract–Transform–Load*) thực hiện việc phân mảnh (*chunks*), tạo véc-tơ nhúng (*embeds*), phân diện (*facets*), và cho ngừng hoạt động (*retires*) nội dung trước khi tải vào hồ nội dung có quản lý phiên bản (*versioned content lake*). 

Việc cho ngừng hoạt động được thực thi thông qua một **con trỏ ảnh chụp nhanh (*snapshot pointer*)**, do đó mỗi lần làm mới sẽ giới hạn phạm vi truy xuất vào ảnh chụp nhanh mới nhất và thay thế nội dung trước đó mà không cần phải xóa bỏ vật lý. Mỗi tài liệu được gắn thẻ với ba khía cạnh diện mạo:
- Sản phẩm (*product - line of business*);
- Ngôn ngữ/địa phương (*locale - hơn 7 ngôn ngữ*);
- Ngày chụp ảnh nhanh (*snapshot date*);
cho phép truy xuất có phạm vi và có thể tái lập (Lin et al., 2021; Gao et al., 2023b). 

Tại thời điểm truy vấn, quá trình truy xuất lai kết hợp dày đặc - thưa thớt (*hybrid dense–sparse retrieval*) được tiếp nối bởi bước tái xếp hạng ngữ nghĩa (*semantic re-ranking* [Berntson, 2023; Nogueira and Cho, 2019]), trả về các tài liệu tiếp đất đã được xếp hạng kèm theo thông tin nguồn gốc dòng dõi (*provenance*: URL, locale, nguồn) phục vụ trích dẫn và kiểm toán (trong quá trình triển khai thực tế, GPT-4o-mini thông qua Azure OpenAI được sử dụng làm LLM nền tảng tại thời điểm bài báo được viết).

### 2.4 Khuôn khổ Đánh giá (Evaluation Framework)

Hoạt động trên hơn 36 ngôn ngữ và nhiều dòng sản phẩm với một cơ sở tri thức liên tục trôi dạt, chúng tôi không thể dựa vào các bộ dữ liệu vàng cố định (*fixed gold sets*) hay các bộ chuẩn tĩnh (*static benchmarks* [Lewis et al., 2020a; Longpre et al., 2021]). Thay vào đó, chúng tôi sử dụng một **khuôn khổ mô-đun hóa, nhận biết tác tử (*modular, agent-aware framework*)**, phân rã chất lượng thành các chiều kích có thể giải thích được:
1. **Tính bám sát dữ liệu (*Grounding*);**
2. **Thấu hiểu ý định (*Intent understanding*);**
3. **Tính chính xác khi thực thi công cụ (*Tool-execution correctness*);**
4. **Độ trung thực đa ngôn ngữ (*Multilingual fidelity*).**

Mỗi chiều kích được chấm điểm bởi các bộ đánh giá chuyên biệt kết hợp giữa kiểm tra dựa trên quy tắc (*rule-based checks*) và phán quyết của LLM (*LLM judgments*). Chất lượng đa ngôn ngữ được đánh giá bởi các mô-đun chuyên dụng giúp phát hiện các đoạn văn bản chưa được dịch (*untranslated spans*), xác minh thuật ngữ chuyên ngành, và đo lường độ trôi chảy thông qua độ bối rối XGLM (*XGLM perplexity* [Lin et al., 2022]), trong khi một bộ đánh giá LLM sẽ chấm điểm độ trung thực ngữ nghĩa dưới các điều kiện đối thoại thực tế. Việc giám sát sản xuất bao quát toàn bộ các ngôn ngữ được hỗ trợ, trong khi bộ chuẩn có kiểm soát ở Mục 4.4 tập trung vào cặp ngôn ngữ xa và đầy thách thức: Tiếng Anh $\leftrightarrow$ Tiếng Trung.

Khác với các bộ chuẩn tĩnh, **quá trình đánh giá được điều kiện hóa dựa trên ngữ cảnh được truy xuất tại thời điểm suy luận**, trực tiếp giải quyết vấn đề trôi dạt tri thức (Zheng et al., 2023). Các tín hiệu được tổng hợp thông qua một tầng đồng thuận (*consensus layer*) được hiệu chuẩn định kỳ đối với các nhãn chú thích của con người, được lưu trữ dưới định dạng có thể phát lại có phiên bản (*versioned replayable format*), và được tiêu thụ bởi quá trình tối ưu hóa ở thượng nguồn (lặp câu nhắc tự động và RAG), đóng kín vòng lặp giữa hành vi tác tử, phép đo lường, và sự tự tiến hóa có kiểm soát.



## 3. Kiến trúc Kỹ nghệ và Triển khai (Engineering Architecture and Deployment)

Sự tiến hóa liên tục của các câu nhắc (*prompts*), quá trình truy xuất (*retrieval*), và việc đánh giá (*evaluation*) làm mở rộng bề mặt lỗi hỏng (*failure surface*) so với các triển khai tĩnh. Kiến trúc sản xuất (Hình 2) được cấu trúc xung quanh bốn nguyên tắc cốt lõi:

### 1. Độ tin cậy là điều kiện tiên quyết cho sự tự tiến hóa (Reliability as a prerequisite for self-evolution)
Một tầng điều phối và dự phòng nhẹ (*lightweight orchestration and fallback layer*) làm trung gian cho lưu lượng người dùng với khả năng định tuyến tất định (*deterministic routing*), xử lý lỗi, và suy giảm an toàn (*graceful degradation*). Tầng này cô lập người dùng cuối khỏi tốc độ lặp nhanh chóng ở tầng tác tử và cho phép chuyển tiếp dự phòng sang hỗ trợ có con người trợ giúp (*human-assisted support*) khi các thành phần AI ở hạ nguồn bị suy giảm hoặc gặp sự cố.

### 2. Môi trường thực thi như một ranh giới đột biến có kiểm soát (Runtime as a controlled mutation boundary)
Thay vì nhúng cứng hành vi vào trong mã nguồn (*code*), các câu nhắc được lắp ráp một cách linh hoạt (*dynamically assembled*), các chính sách xây dựng ngữ cảnh có thể hoán đổi cho nhau, và việc sử dụng công cụ được cấu hình mang tính khai báo (*declaratively configured*). Do đó, sự tiến hóa của câu nhắc, việc tinh chỉnh truy xuất, và các cập nhật quy trình làm việc được phát hành thông qua các cập nhật cấu hình và tạo tác (*configuration and artifact updates*) thay vì triển khai mã nguồn mới (*code deploys*), cho phép các cải tiến hành vi được lan truyền mà không cần phải tái triển khai chính môi trường thực thi (*runtime*).

### 3. Bộ nhớ dưới dạng các tạo tác có phiên bản, không phải trạng thái tiềm ẩn (Memory as versioned artifacts, not latent state)
Môi trường thực thi không mang trạng thái tiềm ẩn xuyên phiên (*cross-session latent state*) nào ngoài ngữ cảnh ngắn hạn, có phạm vi theo nhiệm vụ (*task-scoped context*) cần thiết cho tính liên tục của cuộc hội thoại. Tri thức tồn tại lâu dài hơn chỉ được thăng cấp thông qua các tạo tác đã được đánh giá và đánh phiên bản tường minh (*explicitly versioned and evaluated artifacts*), mang lại khả năng kiểm toán (*auditability*), tính tái lập (*reproducibility*), khả năng khôi phục có kiểm soát (*controlled rollback*), và việc thăng cấp các cải tiến có nguyên tắc trong khi ngăn chặn sự trôi dạt bộ nhớ không thể kiểm soát.

### 4. Dữ liệu đo từ xa như một chất nền đánh giá (Telemetry as an evaluation substrate)
Dữ liệu đo từ xa khi thực thi (*execution telemetry*) phục vụ cho cả việc giám sát và đánh giá tự động. Các luồng sự kiện có cấu trúc (*structured event streams*) cung cấp dữ liệu cho các bước kiểm tra chất lượng cận tuyến (*nearline quality checks*) và các bộ đánh giá ngoại tuyến đo lường tính bám sát ngữ cảnh (*groundedness*), độ liên quan (*relevance*), độ hoàn thiện (*completeness*), và sự tuân thủ chính sách, hình thành nên **mặt phẳng điều khiển (control plane)** thúc đẩy sự tiến hóa câu nhắc, tinh chỉnh truy xuất, và triển khai có kiểm duyệt mà không cần tái huấn luyện mô hình trực tiếp.

```
+---------------------------------------------------------------------------------------------------+
|               HÌNH 2: KIẾN TRÚC SẢN XUẤT CHO TÁC TỬ HỖ TRỢ TỰ TIẾN HÓA (PRODUCTION ARCHITECTURE)   |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|                                   ┌──────────────────────┐                                        |
|                                   │ User Chat Interfaces │                                        |
|                                   └──────────┬───────────┘                                        |
|                                              │                                                    |
|                                              ▼                                                    |
|                                   ┌──────────────────────┐                                        |
|                                   │   Orchestration &    │                                        |
|                                   │       Fallback       │                                        |
|                                   └──────────┬───────────┘                                        |
|                                              │                                                    |
|  EXECUTION PLANE                             ▼                                                    |
|  ┌───────────────────────────────────────────────────┐     ┌──────────────────────────────────┐   |
|  │                   AGENT RUNTIME                   │     │  VERSIONED EXTERNAL CAPABILITIES │   |
|  │  • Prompt assembly                                │◄───►│  • LLM gateway    • Tool APIs    │   |
|  │  • Context / RAG                                  │     │  • Knowledge store               │   |
|  │  • Tool invocation                                │     │  • Moderation                    │   |
|  └───────────────────────────▲───────────────────────┘     └──────────────────────────────────┘   |
|                              │                                                                    |
|  ════════════════════════════╪══════════════════════════════════════════════════════════════════  |
|                              │ gated deploy / rollback (dashed)                                   |
|  CONTROL PLANE (SELF-EVOL.)  │                                                                    |
|  ┌───────────────────────────┴───┐  eval-driven    ┌──────────────────────────┐                   |
|  │    TELEMETRY & EVENT STREAM   │   evolution     │ MODULAR EVALUATION AGENTS│                   |
|  │  • Traces                     ├────────────────►│ • Groundedness • Relevance│                   |
|  │  • Events                     │                 │ • Completeness • Translat│                   |
|  │  • ETL                        │                 └─────────────┬────────────┘                   |
|  └───────────────────────────────┘                               │                                |
|                                              scores + regressions│                                |
|                                                                  ▼                                |
|  ┌───────────────────────────────┐  candidate      ┌──────────────────────────┐                   |
|  │  VERSIONED ARTIFACTS REGISTRY │  artifacts      │OPTIMIZATION & SAFE ROLLOUT│                  |
|  │  • Scores                     │◄────────────────┤ • Prompt evolution       │                   |
|  │  • Datasets                   │                 │ • Retrieval tuning       │                   |
|  │  • Regressions                │                 │ • Gated deploy / rollback│                   |
|  └───────────────────────────────┘                 └──────────────────────────┘                   |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```
*Hình 2: Kiến trúc sản xuất cho một tác tử hỗ trợ tự tiến hóa. Thành phần "Optimization and Safe Rollout" tiêu thụ điểm số của bộ đánh giá và các tín hiệu thoái lui cùng với các tạo tác ứng viên có phiên bản, sau đó phát ra các quyết định triển khai có kiểm duyệt hoặc khôi phục phiên bản về mặt phẳng thực thi (execution plane).*

### Nhịp độ tối ưu hóa (Optimization cadence)
Vòng lặp tối ưu hóa bên ngoài thường chạy hàng tuần và cũng có thể được kích hoạt bởi các đợt làm mới nội dung hoặc khi phát hiện các hiện tượng thoái lui. Một chu kỳ tiến hóa từ đầu đến cuối mất từ vài giờ đến vài ngày tùy thuộc vào kích thước tập dữ liệu và ngân sách đánh giá độ phù hợp. Các câu nhắc và cấu hình truy xuất ứng viên chỉ được thăng cấp sau các bước kiểm tra hồi quy ngoại tuyến và triển khai theo giai đoạn; mặt phẳng thực thi có thể quay lui về tạo tác có phiên bản trước đó nếu các rào chắn (*guardrails*) thất bại.

### Bài học kinh nghiệm triển khai (Deployment learnings)
Trong môi trường sản xuất, ba mẫu thiết kế đã chứng tỏ vai trò chịu tải trụ cột (*load-bearing*):
1. **Thực thi tập trung thông qua cấu hình, câu nhắc theo mô-đun, và lựa chọn công cụ mang tính khai báo (*Centralized execution through configuration*):** Thay vì phân nhánh mã nguồn riêng theo từng dòng sản phẩm (*per-LoB code forks*) hoặc duy trì các đường dẫn mã riêng biệt, cách tiếp cận tập trung là tối quan trọng để tránh phân kỳ hành vi và đảm bảo các cải tiến được khái quát hóa trên mọi quy trình làm việc.
2. **Dự phòng an toàn phân tầng (*Layered fail-safes*):** Chẳng hạn như việc chuyển hướng truy vấn có mục tiêu, cho phép định tuyến lưu lượng truy cập tới một nhóm nội dung đã biết là an toàn khi chỉ mục vector bị ô nhiễm cần nhiều giờ để tái lập chỉ mục, giúp cắt giảm thời gian khôi phục từ vài giờ xuống vài phút và hạn chế tối đa sự can thiệp thủ công.
3. **Triển khai theo giai đoạn (*Staged rollout*) cho các mẫu thực thi mới trong các quy trình làm việc sơ khai (*greenfield workflows*):** Sử dụng các quy trình làm việc mới, lưu lượng thấp làm bãi thử nghiệm có kiểm soát trước khi mở rộng sang lưu lượng trưởng thành, cho phép các cơ chế tiến hóa và tín hiệu đánh giá đạt độ chín muồi trước khi triển khai rộng rãi. Cùng nhau, các thực hành này duy trì sự cải tiến liên tục dưới bối cảnh các mô hình, chính sách, và tri thức thay đổi nhanh chóng.

---

## 4. Nghiên cứu Mô phỏng và Cắt bỏ (Simulation and Ablation Studies)

Chúng tôi đánh giá tác tử thông qua các mô phỏng có kiểm soát nhằm phát lại các tương tác hỗ trợ lịch sử đã được ẩn danh hóa và các trường hợp biên tổng hợp (*synthetic edge cases*) trên các thiết lập đa ngôn ngữ, sản phẩm đa dạng, và tri thức biến đổi liên tục. Mỗi mô phỏng đóng vai trò như một nghiên cứu cắt bỏ ở cấp độ hệ thống (*system-level ablation*), so sánh các cấu hình với các năng lực tác tử khác nhau được kích hoạt dưới cùng một tiêu chí đánh giá đồng nhất.

### 4.1 Mô phỏng RAG (RAG Simulation)

Chúng tôi so sánh bốn cấu hình sinh câu trả lời bằng cách sử dụng bộ đánh giá dựa trên LLM (GPT-4.1 thông qua dịch vụ Azure OpenAI):
1. Vanilla RAG;
2. Tác tử chỉ dùng RAG theo phong cách ReAct (*ReAct-style RAG-only agent*);
3. Tác tử chỉ dùng RAG với cơ chế kích hoạt công cụ của OpenAI (*OpenAI tool invocation*);
4. Tác tử AI Hỗ trợ đầy đủ (*full Support AI Agent*).

Mô hình sinh câu trả lời trong sản xuất là GPT-4o-mini trong khi giám khảo ngoại tuyến là GPT-4.1, vì vậy chúng là hai mô hình hoàn toàn khác nhau. Chúng tôi đo lường chất lượng tổng thể, tỷ lệ ảo giác (*hallucination rate*), và độ hoàn thiện (*completeness*) đối với các bài viết hỗ trợ được truy xuất; một câu trả lời bị coi là ảo giác nếu nó chứa bất kỳ khẳng định thực tế nào không thể quy gán cho nội dung được truy xuất cung cấp cho mô hình tại thời điểm suy luận. Bảng 3 hiệu chuẩn giám khảo này so với các nhãn của con người.

---

### Bảng 1: Kết quả Mô phỏng RAG (RAG Simulation Results)

| Cấu hình Thiết lập (*Setting*)¹ | Điểm Tổng thể (*Overall Score*)² | Tỷ lệ Ảo giác (*Hallucination*)³ | Độ Hoàn thiện (*Completeness*)⁴ |
| :--- | :---: | :---: | :---: |
| **Vanilla RAG** | 2,59 | 5,3% | 78,7% |
| **RAG Only (ReAct Agent)** | 2,56 | 4,8% | 79,0% |
| **RAG Only (OpenAI Tool Agent)** | 2,48 | 6,2% | 75,0% |
| **Support AI Agent** | **2,78** | **<0,1%** | **87,8%** |

*Ghi chú:*  
¹ Mô phỏng sử dụng một tập hợp 100 tương tác hỗ trợ đã được ẩn danh hóa và được con người xác thực, với nhiều lượt suy luận trên mỗi tương tác.  
² Điểm tổng thể nằm trên thang điểm từ 0–3 để đo lường chất lượng tổng thể của câu trả lời.  
³ Một câu trả lời được gắn nhãn ảo giác nếu nó chứa bất kỳ tuyên bố thực tế nào không thể truy nguyên từ các bài viết hỗ trợ được truy xuất cung cấp cho mô hình tại thời điểm suy luận.  
⁴ Một câu trả lời được gắn nhãn hoàn thiện nếu nó giải quyết đầy đủ tất cả các khía cạnh trong câu hỏi của người dùng.

---

Như được thể hiện trong Bảng 1, các cấu hình Vanilla RAG và RAG tác tử thông thường có tỷ lệ ảo giác từ 4,8–6,2%, trong khi Tác tử AI Hỗ trợ đầy đủ đạt tỷ lệ ảo giác **<0,1%** cùng điểm tổng thể cao nhất (**2,78**) và độ hoàn thiện cao nhất (**87,8%**). Sự cải thiện này đến từ các ràng buộc tác tử tường minh ưu tiên tổng hợp từ nội dung có thẩm quyền được truy xuất và triệt tiêu sự phụ thuộc vào tri thức tham số khi các nguồn tiếp đất tồn tại.

### 4.2 Mô phỏng Auto-Prompt (Auto-Prompt Simulation)

Trên tập dữ liệu phát hiện ý định định tuyến (*routing intent detection dataset*), chúng tôi tối ưu hóa lặp đi lặp lại các câu nhắc ban đầu do LLM sinh ra qua các thế hệ bằng đường ống giải thuật di truyền (Thuật toán 1). 

---

### Bảng 2: Mô phỏng Tối ưu hóa Câu nhắc Tự động (Automatic Prompt Optimization Simulation)

| Thế hệ (*Generation*) | Lai ghép + Đột biến (*Crossover + Mutation*) | Không Đột biến (*No Mutation*) | Không Lai ghép (*No Crossover*) |
| :---: | :---: | :---: | :---: |
| **0 (Baseline)** | 62,6% / 66,7% | 62,6% / 66,7% | 62,6% / 66,7% |
| **1** | 66,7% / 73,3% | 63,3% / 66,7% | 62,6% / 66,7% |
| **2** | **68,0% / 73,3%** | 64,0% / 66,7% | 63,3% / 66,7% |

*Ghi chú:* Mô phỏng sử dụng tập dữ liệu phát hiện ý định được tuyển chọn và được con người xác thực (Tìm kiếm Cơ sở Tri thức vs. Chuyển trực tiếp tới Chuyên viên Tư vấn; $N = 30$). Các chỉ số biểu diễn: **độ chính xác trung bình của prompt / độ chính xác của prompt tốt nhất** trên mỗi thế hệ.

---

Bảng 2 cho thấy độ chính xác của câu nhắc chỉ cải thiện một cách nhất quán khi **cả hai toán tử lai ghép và đột biến đều được kích hoạt** — nâng độ chính xác trung bình từ 62,6% lên 68,0% sau hai thế hệ, với câu nhắc tốt nhất đạt 73,3%. Việc loại bỏ bất kỳ toán tử nào cũng làm chậm sự cải tiến và sớm bão hòa, chỉ ra rằng **sự tiến hóa câu nhắc (prompt evolution), chứ không phải việc lấy mẫu ngẫu nhiên, chính là động lực thúc đẩy các bước tiến bền vững.**

### 4.3 Nghiên cứu Cắt bỏ Tín hiệu Bộ Đánh giá (Evaluator-Signal Ablation)

Vượt ra ngoài các mô phỏng cấp hệ thống ở trên, chúng tôi cắt bỏ từng tín hiệu đánh giá riêng lẻ để cô lập đóng góp của chúng, phát lại từng cấu hình trên một tập kiểm thực đã ẩn danh hóa và so sánh với dữ liệu tham chiếu do con người dán nhãn.

---

### Bảng 3: Nghiên cứu Cắt bỏ các Chiều kích Tự đánh giá RAG (Ablation Study of RAG Auto-Evaluation Dimensions)

| Thiết lập Đánh giá (*Evaluation Setting*) | Mức độ Căn chỉnh với Nhãn Con người¹ (*Alignment w/ Human Labels*)² |
| :--- | :---: |
| **Full RAG Evaluation (Baseline)** | **87%** |
| A1: Không có Tính bám sát dữ liệu (*No Groundedness*) | 76% (-11) |
| A2: Không có Độ liên quan nội dung (*No Content Relevance*) | 82% (-5) |
| A3: Không có Độ hoàn thiện (*No Completeness*) | 86% (-1) |
| A4: Chỉ dùng Điểm Tổng thể (*Overall Score Only*) | 67% (-20) |

*Ghi chú:*  
¹ Mức độ căn chỉnh được đo lường so với nhãn chân lý do con người gắn trên một tập mẫu ngẫu nhiên gồm 100 cuộc trò chuyện hỗ trợ thuê bao cao cấp (*premium-tier*), với nhiều lượt chạy cho mỗi tương tác.  
² Ba người đánh giá đã qua đào tạo, mù đối với điều kiện hệ thống (*blind to system condition*), tuân theo các hướng dẫn chuẩn hóa. Tỷ lệ đồng thuận thô là 92%; các bất đồng được giải quyết bằng biểu quyết đa số.

---

Như thể hiện trong Bảng 3, **tính bám sát câu trả lời (groundedness) là động lực chủ đạo cho độ tin cậy của bộ đánh giá** — việc loại bỏ nó gây ra sự sụt giảm lớn nhất về mức độ căn chỉnh với nhãn con người (-11 điểm), trong khi loại bỏ độ hoàn thiện hầu như không làm thay đổi kết quả (-1 điểm). Đáng chú ý, việc gộp tất cả các tín hiệu vào một điểm tổng thể duy nhất (A4) mang lại hiệu năng kém nhất (67%, giảm 20 điểm), che khuất các chế độ lỗi nghiêm trọng. Những phát hiện này biện minh cho việc giữ lại tính bám sát, độ liên quan, và độ hoàn thiện như các chiều kích hạng nhất, được báo cáo độc lập (Qiao et al., 2025; Park et al., 2025; Es et al., 2023).

### 4.4 Đánh giá Chất lượng Dịch thuật Đa ngôn ngữ (Multilingual Translation Evaluation)

Nghiên cứu cắt bỏ thiết kế bộ đánh giá này kiểm tra bộ đánh giá đa tác tử theo mô-đun sản sinh ra các tín hiệu độ phù hợp (*fitness signals*) thúc đẩy quá trình lặp của Auto-Prompt và RAG. Chúng tôi so sánh trên lát cắt Tiếng Anh $\leftrightarrow$ Tiếng Trung giữa phương pháp COMET (Rei et al., 2020), giám khảo LLM đơn tác tử, và bộ đánh giá đa tác tử theo mô-đun.

---

### Bảng 4: Kết quả Đánh giá Chất lượng Dịch thuật (Translation Quality Evaluation Result)¹

| Mô hình Đánh giá (*Evaluation Paradigm*) | Độ Chính xác (*Accuracy %*) |
| :--- | :---: |
| Đánh giá dựa trên mô hình (*Model-based eval - COMET*) | 49,7% |
| Giám khảo LLM đơn tác tử thuần túy (*Pure LLM single-agent eval*) | 76,5% |
| **Đánh giá đa tác tử theo mô-đun (*Modular multi-agent eval*)** | **84,8%** |

*Ghi chú:*  
¹ Đánh giá được thực hiện trên tập dữ liệu trò chuyện hỗ trợ đã được ẩn danh hóa ($N = 300$).

---

Như được tóm tắt trong Bảng 4, độ chính xác tăng từ 49,7% (COMET) lên 76,5% (LLM đơn tác tử) và đạt **84,8%** (bộ đánh giá đa tác tử theo mô-đun). Việc phân rã chất lượng dịch thuật thành các chiều kích chuyên biệt nắm bắt được các yêu cầu đặc thù của miền và nhạy cảm với ngữ cảnh trong các tương tác hỗ trợ mà việc chấm điểm dựa trên số liệu truyền thống bỏ sót.

---

## 5. Thử nghiệm Trực tuyến trong Môi trường Sản xuất (Online Experiment)

Chúng tôi đã tiến hành một thử nghiệm A/B kéo dài hai tuần trên lưu lượng hỗ trợ khách hàng và hội viên thực tế liên tục của LinkedIn. Người dùng được ngẫu nhiên hóa một lần với tỷ lệ phân bổ cố định 50/50 và duy trì trong một nhánh duy nhất trong suốt thử nghiệm, ngăn chặn sự lây nhiễm chéo do cùng một người dùng lặp lại qua các điều kiện (*repeated-user contamination*). 

- **Nhóm Đối chứng (Control):** Tác tử sản xuất ban đầu — một câu nhắc thủ công, đường ống truy xuất cố định, và QA định kỳ của con người.
- **Nhóm Can thiệp (Treatment):** Quy trình làm việc tự tiến hóa tích hợp (*integrated self-evolved workflow*), kết hợp: (i) Auto-Prompt đã tiến hóa, (ii) RAG do tác tử kích hoạt, và (iii) quy trình lặp dựa trên bộ đánh giá khép kín kèm theo triển khai có kiểm duyệt (*gated rollout*). Ba chỉ số sử dụng các quần thể con ngẫu nhiên hóa riêng biệt.

Thử nghiệm được lên kế hoạch trong bốn tuần với cơ chế giám sát tuần tự (*sequential monitoring*) và được kết luận sau hai tuần, khi các hiệu ứng đã ổn định, lực thống kê (*statistical power*) đạt mức đầy đủ, và các ranh giới dừng định trước (*pre-specified stopping boundaries*) đã bị vượt qua cho cả ba kết quả chính. Người dùng là đơn vị suy luận (*inference unit*); số lượng hội thoại trung bình trên mỗi người dùng xấp xỉ 1,26 cho QA và 1,53 cho hủy dịch vụ. Hiệu chỉnh phân cụm tương ứng là khiêm tốn (hệ số thiết kế $\le 1,5$), và sai số chuẩn GEE/CR2 phân cụm theo người dùng vẫn duy trì ý nghĩa thống kê cho tất cả các kết quả; ví dụ: thống kê cho hủy dịch vụ thay đổi từ $z = 10,0$ thành $z = 8,1$. Bảng 5 báo cáo các ước lượng điểm và khoảng tin cậy không phân cụm.

---

### Bảng 5: Kết quả Thử nghiệm Trực tuyến trên Lưu lượng Thực tế (Online Experiment Results)

| Chỉ số (*Metric*) | Đối chứng (*Control*)<br>*(Tác tử sản xuất ban đầu)* | Can thiệp (*Treatment*)<br>*(Quy trình tự tiến hóa tích hợp)* | Độ Nâng Tuyệt đối (*Absolute Lift*)<br>**(95% CI)** | Giá trị $z$ |
| :--- | :---: | :---: | :---: | :---: |
| **Tự phục vụ QA (*QA self-serve*)**¹ | 33,7% | **42,7%** | **+9,0 pp** [8,4; 9,6] | 27,6 |
| **Tự phục vụ Hủy dịch vụ (*Cancellation self-serve*)**² | 61,9% | **66,6%** | **+4,8 pp** [3,8; 5,7] | 10,0 |
| **Độ chính xác Định tuyến (*Routing accuracy*)**³ | 38,2% | **68,8%** | **+30,6 pp** [23,6; 37,6] | 8,2 |

*Ghi chú:*  
¹ QA: 42.982 / 45.669 cuộc hội thoại và 35.867 / 34.334 người dùng (đối chứng / can thiệp).  
² Hủy dịch vụ: 20.468 / 20.456 cuộc hội thoại và 13.442 / 13.308 người dùng (đối chứng / can thiệp).  
³ Định tuyến: 356 / 356 quyết định (đối chứng / can thiệp) trên một tập đánh giá cố định có nhãn.  
Kiểm định $z$ hai tỷ lệ, hai phía (*two-sided two-proportion z-tests*); tất cả $p \ll 10^{-4}$ và đều có ý nghĩa thống kê sau hiệu chỉnh Holm.

---

### Phân tích chi tiết các kết quả:

- **Tự phục vụ QA (QA self-serve):** Đây là tỷ lệ các cuộc trò chuyện về câu hỏi sản phẩm hoặc kỹ thuật được giải quyết mà không cần leo thang tới con người. Tỷ lệ này tăng từ 33,7% lên **42,7%**, đạt mức nâng tuyệt đối **9,0 điểm phần trăm** (95% CI [8,4; 9,6]; $z = 27,6$).
- **Tự phục vụ Hủy dịch vụ (Cancellation self-serve):** Đây là tỷ lệ các cuộc trò chuyện có ý định hủy gói dịch vụ được hoàn thành từ đầu đến cuối mà không cần bàn giao nhân viên. Tỷ lệ này tăng từ 61,9% lên **66,6%**, mức nâng tuyệt đối **4,8 điểm phần trăm** (95% CI [3,8; 5,7]; $z = 10,0$).
- **Độ chính xác Định tuyến (Routing accuracy):** Đây là tỷ lệ định tuyến đúng vào hàng đợi nhân viên hỗ trợ phù hợp so với mục tiêu có nhãn. Tỷ lệ này tăng từ 38,2% lên **68,8%**, mức nâng tuyệt đối lên tới **30,6 điểm phần trăm** (95% CI [23,6; 37,6]; $z = 8,2$).

Cả ba kết quả đều có $p \ll 10^{-4}$ và duy trì ý nghĩa thống kê sau hiệu chỉnh Holm (*Holm correction*). Chúng tôi cũng theo dõi sát sao: tỷ lệ leo thang (*escalation rate*), phản hồi thích/không thích (*thumbs-up/down*), độ trễ (*latency*), điểm số hài lòng của khách hàng (*CSAT*), và các sự cố kiểm duyệt (*moderation incidents*); **không có chỉ số nào bị thoái lui dưới điều kiện can thiệp**. Nghiên cứu trực tuyến báo cáo hiệu ứng toàn hệ thống từ đầu đến cuối của quy trình tự tiến hóa tích hợp, trong khi các Bảng 1–3 đã cô lập từng thành phần ngoại tuyến.

Vượt ra ngoài các lợi ích tổng hợp, những kết quả này chứng minh rằng quy trình làm việc tự tiến hóa tích hợp đã cải thiện rõ rệt các kết quả đo lường được xuyên suốt khung thời gian triển khai hai tuần, nhất quán với các lời kêu gọi về việc đánh giá toàn diện, hướng tới môi trường sản xuất thực tế (Liang et al., 2023; Es et al., 2023; Qiao et al., 2025).

---

## 6. Các Hạn chế (Limitations)

1. **Sự phụ thuộc vào bộ đánh giá (Evaluator dependence):** Vòng lặp khép kín phụ thuộc vào các bộ đánh giá LLM-as-a-judge (GPT-4.1) để cung cấp tín hiệu độ phù hợp. Các nghiên cứu cắt bỏ của chúng tôi đo lường sự căn chỉnh với nhãn của con người (Bảng 3); các kích thước mẫu lớn hơn và kiểm tra chéo với các bộ đánh giá mở sẽ mô tả rõ nét hơn phương sai và độ nhạy cảm của giám khảo đối với từng mô hình cụ thể (Zheng et al., 2023; Dubois et al., 2024).
2. **Chi phí và độ trễ của quá trình tiến hóa (Cost and latency of evolution):** Tìm kiếm câu nhắc di truyền phát sinh thêm chi phí suy luận trên mỗi thế hệ, và các chu kỳ tiến hóa từ đầu đến cuối mất từ vài giờ đến vài ngày tùy thuộc vào kích thước tập dữ liệu và ngân sách đánh giá độ phù hợp. Các nghiên cứu trong tương lai có thể khám phá các cửa sổ thích ứng chặt chẽ hơn cho tri thức thay đổi nhanh chóng.
3. **Đánh giá trên một đối tượng khách hàng đơn lẻ (Single-tenant evaluation):** Nghiên cứu trực tuyến bao quát hai tuần trên một bề mặt triển khai tại một doanh nghiệp duy nhất (LinkedIn). Các cửa sổ quan sát dài hơn và việc triển khai trong các miền khác sẽ kiểm tra độ bền vững và khả năng chuyển giao sang các kho công cụ và môi trường vận hành khác nhau.
4. **Quy kết thành phần trực tuyến (Online component attribution):** Nhánh can thiệp trực tuyến đóng gói gộp cả Auto-Prompt, RAG do tác tử kích hoạt, và chu trình lặp do bộ đánh giá dẫn dắt thành quy trình tự tiến hóa tích hợp. Các triển khai theo giai thừa (*factorial deployments*) trong tương lai có thể định lượng đóng góp biên và sự tương tác của từng thành phần riêng lẻ.
5. **Trần hiệu năng truy xuất (Retrieval ceiling):** Chất lượng câu trả lời bị giới hạn bởi độ bao phủ của việc truy xuất. Khi hồ nội dung bên dưới thiếu tài liệu có thẩm quyền, các ràng buộc tiếp đất của tác tử sẽ triệt tiêu ảo giác một cách chính xác nhưng không thể tổng hợp ra câu trả lời đúng; việc đạt được các bước tiến xa hơn đòi hỏi phải cải thiện độ phủ truy xuất (*retrieval recall*) và độ bao phủ nội dung có thẩm quyền — những yếu tố độc lập trực giao với vòng lặp tự tiến hóa.
6. **Kiểm thử ứng suất đa ngôn ngữ còn hạn chế (Limited multilingual stress test):** Nghiên cứu dịch thuật có kiểm soát tập trung vào cặp ngôn ngữ Tiếng Anh $\leftrightarrow$ Tiếng Trung (Mục 4.4). Đánh giá có hệ thống trên các ngôn ngữ tài nguyên thấp (*low-resource languages*) và đầu vào trộn mã (*code-mixed input*) vẫn là một hướng mở rộng quan trọng.
7. **Sự phụ thuộc vào mã nguồn đóng (Closed-source dependencies):** Hệ thống sản xuất phụ thuộc vào các mô hình nền tảng nguồn đóng (GPT-4o-mini, GPT-4.1) và một backend tìm kiếm độc quyền. Việc tái lập bằng các giải pháp nguồn mở tương đương (ví dụ: Llama 3, các bộ truy xuất BGE) là khả thi về mặt nguyên lý nhưng chưa được xác minh từ đầu đến cuối.

---

## Lời cảm ơn (Acknowledgments)

Chúng tôi xin chân thành cảm ơn Artem Grigoryan, Tony Huynh, Zhentao Lin, Chris Korbel, Umang Lahoti và Ajay Vishwanathan vì sự hỗ trợ và hợp tác quý báu của họ đối với ứng dụng tác tử và thử nghiệm A/B.

## Sử dụng Hỗ trợ của AI (Use of AI assistance)

Trong quá trình chuẩn bị bản thảo này, các tác giả đã sử dụng Claude của Anthropic (thông qua Claude Code) để trau chuốt văn phong, định dạng LaTeX và bố cục bảng, tái cấu trúc thứ tự các phần, và hỗ trợ soạn thảo phần Hạn chế (*Limitations*). Toàn bộ các khẳng định kỹ thuật, thiết kế thực nghiệm, kết quả, hình vẽ, và trích dẫn đều do các tác giả là con người trực tiếp sáng tác, xem xét, và xác minh; các tác giả chịu hoàn toàn trách nhiệm về nội dung của bài báo.

---

## Tài liệu Tham khảo (References)

- **Akari Asai and 1 others. 2024.** Self-rag: Learning to retrieve, generate, and critique through self-reflection. In *ICLR*.
- **Alec Berntson. 2023.** Azure ai search: Outperforming vector search with hybrid retrieval and reranking.
- **Yann Dubois and 1 others. 2024.** Length-controlled alpacaeval: A simple way to debias automatic evaluators. *arXiv:2404.04475*.
- **Shahul Es and 1 others. 2023.** Ragas: Automated evaluation of retrieval augmented generation. *arXiv:2309.15217*.
- **Chrisantha Fernando and 1 others. 2023.** Promptbreeder: Self-referential self-improvement via prompt evolution. *arXiv:2309.16797*.
- **Luyu Gao and 1 others. 2023a.** Precise zero-shot dense retrieval without relevance labels. In *ACL*.
- **Yunfan Gao and 1 others. 2023b.** Retrieval-augmented generation for large language models: A survey. *arXiv:2312.10997*.
- **Qingyan Guo and 1 others. 2024.** Connecting large language models with evolutionary algorithms yields powerful prompt optimizers. In *ICLR*.
- **Kelvin Guu and 1 others. 2020.** Realm: Retrieval-augmented language model pre-training. *ICML*.
- **John H. Holland. 1992.** *Adaptation in Natural and Artificial Systems*. MIT Press.
- **Vladimir Karpukhin and 1 others. 2020.** Dense passage retrieval for open-domain question answering. In *EMNLP*.
- **Omar Khattab and 1 others. 2023.** Dspy: Compiling declarative language model calls into self-improving pipelines. *arXiv:2310.03714*.
- **Seungone Kim and 1 others. 2024.** Prometheus 2: An open source language model specialized in evaluating other language models. In *EMNLP*.
- **Patrick Lewis and 1 others. 2020a.** Mlqa: Evaluating cross-lingual extractive question answering. In *Proceedings of the 58th Annual Meeting of the Association for Computational Linguistics*.
- **Patrick Lewis and 1 others. 2020b.** Retrieval-augmented generation for knowledge-intensive nlp tasks. In *NeurIPS*.
- **Percy Liang and 1 others. 2023.** Holistic evaluation of language models. *Transactions on Machine Learning Research (TMLR)*. *arXiv:2211.09110*.
- **Jimmy Lin and 1 others. 2021.** Pretrained transformers for text ranking: Bert and beyond. *Synthesis Lectures on Human Language Technologies*.
- **Xi Victoria Lin and 1 others. 2022.** Few-shot learning with multilingual generative language models. In *Proceedings of the 2022 Conference on Empirical Methods in Natural Language Processing (EMNLP)*, pages 9019–9052.
- **Yang Liu and 1 others. 2023.** G-eval: Nlg evaluation using gpt-4 with better human alignment. In *EMNLP*.
- **Shayne Longpre and 1 others. 2021.** Mkqa: A linguistically diverse benchmark for multilingual open domain question answering. *Transactions of the Association for Computational Linguistics*, 9:1389–1406.
- **Rodrigo Nogueira and Kyunghyun Cho. 2019.** Passage re-ranking with bert. *arXiv:1901.04085*.
- **Oded Ovadia and 1 others. 2024.** Fine-tuning or retrieval? comparing knowledge injection in llms. *arXiv:2312.05934*.
- **Charles Packer and 1 others. 2023.** Memgpt: Towards llms as operating systems. *arXiv:2310.08560*.
- **Chanhee Park and 1 others. 2025.** Mirage: A metric-intensive benchmark for retrieval-augmented generation evaluation. *Findings of NAACL*. *arXiv:2504.17137*.
- **Ofir Press and 1 others. 2023.** Measuring and narrowing the compositionality gap in language models. In *Findings of EMNLP*. *arXiv:2210.03350*.
- **Shuofei Qiao and 1 others. 2025.** Benchmarking agentic workflow generation. In *ICLR*. *arXiv:2410.07869*.
- **Ricardo Rei and 1 others. 2020.** Comet: A neural framework for mt evaluation. *arXiv preprint arXiv:2009.09025*.
- **Timo Schick and 1 others. 2023.** Toolformer: Language models can teach themselves to use tools. *NeurIPS*.
- **Noah Shinn and 1 others. 2023.** Reflexion: Language agents with verbal reinforcement learning. *arXiv:2303.11366*.
- **Heydar Soudani and 1 others. 2024.** Fine tuning vs. retrieval augmented generation for less popular knowledge. *arXiv:2403.01432*.
- **Darrell Whitley. 1994.** A genetic algorithm tutorial. *Statistics and Computing*.
- **Qingyun Wu and 1 others. 2023.** Autogen: Enabling next-gen llm applications via multi-agent conversation. *arXiv:2308.08155*.
- **Shi-Qi Yan and 1 others. 2024.** Corrective retrieval augmented generation. *arXiv:2401.15884*.
- **Chengrun Yang and 1 others. 2024.** Large language models as optimizers. In *ICLR*.
- **Shunyu Yao and 1 others. 2023.** React: Synergizing reasoning and acting in language models. In *ICLR*.
- **Lianmin Zheng and 1 others. 2023.** Judging llm-as-a-judge with mt-bench and chatbot arena. *arXiv:2306.05685*.
- **Yongchao Zhou and 1 others. 2023.** Large language models are human-level prompt engineers. In *ICLR*.
