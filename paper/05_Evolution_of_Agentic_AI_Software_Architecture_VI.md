# Từ Mô hình Prompt–Response đến các Hệ thống Định hướng Mục tiêu: Sự Tiến hóa của Kiến trúc Phần mềm Agentic AI
*(From Prompt–Response to Goal-Directed Systems: The Evolution of Agentic AI Software Architecture)*

**Tác giả:** Mamdouh Alenezi  
*The Saudi Technology and Security Comprehensive Control Company "Tahakom", Riyadh, Saudi Arabia*  
**Định danh:** arXiv:2602.10479v1 [cs.SE] 11 Feb 2026  

---

### Tóm tắt (Abstract)

Agentic AI biểu thị một bước chuyển dịch kiến trúc mang tính căn bản: từ các mô hình tạo sinh phi trạng thái (*stateless*), vận hành theo cơ chế kích hoạt bằng lời nhắc (*prompt-driven*), hướng tới các hệ thống định hướng mục tiêu (*goal-directed systems*) có khả năng tự chủ tri giác (*perception*), lập kế hoạch (*planning*), hành động (*action*), và thích ứng (*adaptation*) thông qua các vòng lặp điều khiển lặp đi lặp lại (*iterative control loops*). 

Bài báo này khảo sát bước chuyển dịch đó bằng cách kết nối các lý thuyết tác tử thông minh nền tảng—bao gồm các mô hình phản ứng (*reactive*), cân nhắc suy tính (*deliberative*), và mô hình Niềm tin–Mong muốn–Ý định (*Belief-Desire-Intention - BDI*)—với các phương pháp tiếp cận đương đại lấy LLM làm trung tâm như gọi công cụ (*tool invocation*), suy luận tăng cường bộ nhớ (*memory-augmented reasoning*), và điều phối đa tác tử (*multi-agent coordination*).

Bài báo trình bày ba đóng góp chính:
1. **Một kiến trúc tham chiếu (*reference architecture*)** dành cho các LLM agent cấp sản xuất (*production-grade*), phân tách rạch ròi giữa suy luận nhận thức (*cognitive reasoning*) và thực thi (*execution*) thông qua các giao diện công cụ định kiểu (*typed tool interfaces*);
2. **Một bảng phân loại (*taxonomy*) các cấu trúc liên kết đa tác tử (*multi-agent topologies*)**, cùng với các chế độ thất bại (*failure modes*) và các phương pháp giảm thiểu tương ứng;
3. **Một danh mục kiểm tra độ vững chắc cho doanh nghiệp (*enterprise hardening checklist*)** tích hợp các cân nhắc về quản trị (*governance*), khả năng quan sát (*observability*), và tính tái lặp (*reproducibility*).

Thông qua việc phân tích các nền tảng công nghiệp mới nổi bao gồm Kore.ai, Salesforce Agentforce, TrueFoundry, ZenML và LangChain, nghiên cứu chỉ ra một sự hội tụ rõ nét hướng tới các vòng lặp agent chuẩn hóa (*standardized agent loops*), các sổ đăng ký (*registries*), và các cơ chế kiểm soát có thể kiểm toán (*auditable control mechanisms*). Bài báo lập luận rằng giai đoạn phát triển tiếp theo của Agentic AI sẽ diễn ra tương tự như quá trình trưởng thành của các dịch vụ web (*web services*), dựa trên các giao thức chia sẻ (*shared protocols*), các hợp đồng định kiểu (*typed contracts*), và các cấu trúc quản trị phân tầng để hỗ trợ quyền tự chủ có khả năng kết hợp và mở rộng quy mô. Những thách thức cố hữu liên quan đến khả năng kiểm chứng (*verifiability*), khả năng tương tác (*interoperability*), và quyền tự chủ an toàn (*safe autonomy*) vẫn là các lĩnh vực then chốt cho nghiên cứu tương lai và triển khai thực tế.

**Từ khóa (Keywords):** *agentic AI; software architecture; LLM agents; tool use; memory; multi-agent systems; governance; observability; reproducibility.*

---

## 1. Giới thiệu (Introduction)

Những tích hợp ban đầu của AI tạo sinh vào phần mềm phần lớn tuân theo mẫu hình *prompt-response* phi trạng thái (*stateless*), trong đó các language model đóng vai trò như các bộ sinh văn bản thụ động được gọi bên trong các ranh giới ứng dụng cố định [17]. Mẫu hình này tỏ ra hữu dụng cho việc tạo nội dung và hỏi đáp đơn giản, nhưng lại cực kỳ giòn gãy (*brittle*) đối với các khối lượng công việc vận hành trong thế giới thực—nơi các tác vụ trải dài qua nhiều bước, các giao diện công cụ bên ngoài thay đổi theo thời gian, hoặc các yêu cầu quy định pháp lý đòi hỏi phải có dấu vết kiểm toán chống giả mạo (*tamper-evident audit trails*) [19]. Trong thực tế, các kỹ sư thường bao bọc các model mạnh mẽ bằng các giàn giáo mong manh (*fragile scaffolding*)—như nối chuỗi prompt thủ công, các bộ quản lý trạng thái bên ngoài, logic thử lại chắp vá (*ad-hoc retry logic*)—để bù đắp cho các lỗ hổng kiến trúc thay vì giải quyết nguyên nhân gốc rễ của chúng [20].

Một sự tái cấu hình có tính hệ quả sâu sắc hiện đang diễn ra: các hệ thống Agentic AI tái định vị model như một **nhân nhận thức (*cognitive kernel*) bên trong một kiến trúc kiểm soát vòng lặp khép kín (*closed-loop control architecture*)** [21, 18]. Khác với cơ chế gọi phi trạng thái, một kiến trúc mang tính tác tử:
* Bảo toàn trạng thái bền vững (*persistent state*) xuyên suốt các phiên tương tác;
* Soạn thảo và điều chỉnh các kế hoạch có thể thực thi thông qua các giao diện công cụ định kiểu (*typed tool interfaces*);
* Tiếp nhận phản hồi từ môi trường để thích ứng hành vi; và
* Thực thi các ràng buộc quản trị ngay lúc thực thi (*runtime*) [22].

Điều quan trọng là, **tính tác tử (*agency*) ở đây là một năng lực kiến trúc phần mềm, chứ không phải là ý chí mang tính nhân hình (*anthropomorphic intent*)**; nó phát sinh từ sự phân tách rạch ròi giữa nhận thức khỏi thực thi, quản lý trạng thái, và thực thi chính sách.

```
+-----------------------------------------------------------------------------------+
|               HÌNH 1: TÓM TẮT TRỰC QUAN (VISUAL ABSTRACT)                         |
|           Từ các Model Thụ động đến các Hệ thống Định hướng Mục tiêu             |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [THỜI KỲ ĐẦU: PROMPT-RESPONSE]              [HIỆN TẠI & TƯƠNG LAI: AGENTIC AI]   |
|                                                                                   |
|  User Prompt                                 User Goal                            |
|       │                                           │                               |
|       ▼                                           ▼                               |
|  ┌─────────────┐                             ┌────────────────────────┐           |
|  │ LLM Thụ động│                             │   NHÂN NHẬN THỨC (LLM) │           |
|  │ (Stateless) │                             │   (Cognitive Kernel)   │           |
|  └──────┬──────┘                             └───────────┬────────────┘           |
|         │                                                │                        |
|         ▼                                  ┌─────────────┴─────────────┐          |
|  Static Response                           ▼                           ▼          |
|                                    ┌──────────────┐             ┌──────────────┐  |
|                                    │  LẬP KẾ HOẠCH│ <─────────> │  BỘ NHỚ PHÂN │  |
|                                    │   (Planning) │  Phản hồi   │   TẦNG VÀ    │  |
|                                    └──────┬───────┘  từ Môi     │  QUẢN LÝ     │  |
|                                           │          trường     │  TRẠNG THÁI  │  |
|                                           ▼                     └──────────────┘  |
|                                    ┌──────────────┐                               |
|                                    │ THỰC THI TOOL│                               |
|                                    │ ĐỊNH KIỂU &  │                               |
|                                    │ CỔNG QUẢN TRỊ│                               |
|                                    └──────┬───────┘                               |
|                                           │                                       |
|                                           ▼                                       |
|                                   Môi trường / Hành động                          |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```
*Hình 1: Tóm tắt trực quan: Từ các Model Thụ động đến các Hệ thống Định hướng Mục tiêu.*

Sự chuyển dịch này có cả chiều kích chiến lược lẫn hạ tầng:
* **Ở cấp độ doanh nghiệp:** Ý niệm về một "Doanh nghiệp Tác tử" (*Agentic Enterprise*) tái định vị thành phần AI từ một dịch vụ phụ trợ cấp dưới thành một giao diện điều phối trung gian đóng vai trò cầu nối giữa ý định của con người và hành động tính toán, như được thấy trong các chiến lược sản phẩm mới nổi như Salesforce Agentforce [1].
* **Ở cấp độ nền tảng:** Mức độ sẵn sàng cho môi trường sản xuất (*production readiness*) đang thúc đẩy đầu tư vào khả năng quan sát (*observability*), triển khai có quản trị, và các đường ống có thể tái lập—LangChain nhấn mạnh dấu vết thực thi (*traces*) như các tạo phẩm quan sát hạng nhất [5], các mô hình triển khai lấy cổng (*gateway-centric*) tập trung vào kiểm soát lưu lượng dựa trên chính sách, và các bộ công cụ ưu tiên đường ống (*pipeline-first*) hướng tới tính tái lặp và khả năng kiểm toán [4].

Về mặt kiến trúc, các đội ngũ kỹ thuật đối mặt với sự lựa chọn thiết kế thực dụng trên một phổ liên tục:
* **Ở một đầu phổ (Symbolic / Classical):** Các thiết kế biểu tượng hoặc cổ điển chuyển việc lập kế hoạch ra các mô-đun tất định bên ngoài và các máy trạng thái tường minh, cho phép kiểm chứng chặt chẽ nhưng phải đánh đổi bằng sự linh hoạt.
* **Ở đầu phổ ngược lại (Neural / Generative):** Các thiết kế nơ-ron hoặc tạo sinh tận dụng các đầu ra ngẫu nhiên của LLM cho việc lập kế hoạch và phân rã tác vụ, đạt được khả năng thích ứng cao nhưng hy sinh tính dự đoán được.
* **Mô hình Lai (Hybrid):** Các hệ thống sản xuất ngày càng áp dụng các mẫu hình lai, sử dụng LLM cho việc phân rã mục tiêu cấp cao trong khi áp đặt các ràng buộc biểu tượng chặt chẽ lên quá trình thực thi công cụ nhằm cân bằng giữa an toàn và khả năng thích ứng [18, 17].

Bên dưới các lựa chọn này là một cơ sở hạ tầng kỹ thuật then chốt thường bị bỏ qua trong các cuộc thảo luận chỉ tập trung thuần túy vào năng lực của model:
* Chính sách bộ nhớ đệm Key-Value (*KV cache policies*) quyết định khả năng duy trì ngữ cảnh dưới tải cao;
* Độ trễ của cơ sở dữ liệu vector (*vector database latency*) ràng buộc các chu kỳ tri giác; và
* Việc phân bổ ngân sách cửa sổ ngữ cảnh (*context-window budgeting*) định hình cả chi phí tài chính lẫn hiệu quả suy luận thực tế.

Những ràng buộc ở cấp độ hệ thống này bắt buộc phải được **đồng thiết kế (*co-designed*)** cùng với các thành phần nhận thức chứ không thể xem như những suy nghĩ nảy sinh sau cùng; các khoản đầu tư nền tảng vào kiến trúc cổng (*gateways*), phân tầng bộ nhớ (*memory tiering*), và môi trường cô lập thực thi (*execution sandboxes*) phản ánh rõ mệnh lệnh đồng thiết kế này.

Bài báo này áp dụng lăng kính kiến trúc phần mềm để tổng hợp các chiều kích kỹ thuật, chiến lược và vận hành của Agentic AI. Chúng tôi tập trung vào **ba câu hỏi nghiên cứu cốt lõi**:
1. Những nguyên thủy phần mềm (*software primitives*) và mẫu thiết kế (*design patterns*) nào định hình các kiến trúc agentic vượt ra ngoài phạm vi kỹ nghệ prompt (*prompt engineering*)?
2. Các kiến trúc tiến hóa như thế nào từ các vòng lặp điều khiển đơn agent (*single-agent control loops*) sang các cấu trúc liên kết đa agent phối hợp (*coordinated multi-agent topologies*)?
3. Những cơ chế về độ tin cậy, bảo mật và quản trị nào là bắt buộc để triển khai trong môi trường sản xuất ở quy mô lớn?

Để trả lời, bài báo đóng góp:
* Một **kiến trúc tham chiếu** phân tách giữa suy luận nhận thức, bộ nhớ phân tầng, gọi công cụ định kiểu, và quản trị nhúng;
* Một **bảng phân loại các mẫu hình đa agent** đi kèm bản đồ các chế độ thất bại và biện pháp giảm thiểu;
* Một **danh mục kiểm tra độ vững chắc cho doanh nghiệp** liên kết khả năng quan sát, thực thi chính sách và tính tái lập với các trụ cột quản trị bao trùm tổ chức, tuân thủ, vận hành và an toàn.

---

## 2. Các Công trình Liên quan và Định vị Nghiên cứu (Related Work and Positioning)

Việc thiết kế các hệ thống AI định hướng mục tiêu dựa trên hàng thập kỷ nghiên cứu về các kiến trúc kiểm soát phản ứng (*reactive*), cân nhắc suy tính (*deliberative*), và lai (*hybrid*):
* **Kiến trúc phản ứng (Reactive architectures):** Ánh xạ các tri giác trực tiếp thành hành động thông qua các quy tắc điều kiện–hành động (*condition–action rules*) hoặc các chính sách học được, mang lại độ trễ cực thấp nhưng rất giòn gãy khi tác vụ đòi hỏi phải nhìn trước tương lai hoặc suy luận về trạng thái ẩn (ví dụ: kiến trúc Subsumption của Brooks [23]).
* **Kiến trúc cân nhắc (Deliberative architectures):** Duy trì các mô hình thế giới tường minh và sử dụng tìm kiếm/lập kế hoạch để lựa chọn hành động; xuất sắc về khả năng giải thích và tính nhất quán mục tiêu nhưng chịu độ trễ cao và dễ thất bại khi có sự sai lệch giữa mô hình và thực tế [24].
* **Kiến trúc lai (Hybrid architectures):** Kết hợp cả hai: dùng các tầng phản ứng cho các vòng lặp điều khiển nhanh, chặt chẽ và các tầng cân nhắc cho việc thiết lập mục tiêu và tái lập kế hoạch; độ tin cậy của chúng phụ thuộc vào các giao diện được định nghĩa rõ ràng, quy tắc leo thang và ngân sách thời gian [25].
* **Mô hình Niềm tin–Mong muốn–Ý định (Belief–Desire–Intention - BDI):** Cung cấp một khung làm việc có nguyên tắc để cấu trúc hóa tính tác tử: **Niềm tin (*Beliefs*)** tương ứng với trạng thái thế giới và bộ nhớ; **Mong muốn (*Desires*)** tương ứng với mục tiêu và ràng buộc; và **Ý định (*Intentions*)** tương ứng với các kế hoạch đã chấp nhận và các lệnh gọi công cụ [26]. Các chiến lược cam kết và chính sách điều chỉnh ý định của BDI cung cấp một bộ khung điều khiển rõ ràng mà các generative agent hiện đại có thể kế thừa, phân tách quá trình tạo sinh tự do khỏi hành vi có quản trị.

Các LLM agent hiện đại mở rộng vòng lặp cổ điển bằng cách tích hợp các mô hình tạo sinh làm nền tảng suy luận:
* **Sử dụng công cụ (Tool use):** Là một năng lực cốt lõi, cho phép agent truy xuất thông tin gắn kết thực tế, thực hiện hành động và tương tác với môi trường bên ngoài. Các LLM gần đây hỗ trợ gọi hàm tự nhiên (*native function calling*), tự quyết định có nên gọi công cụ hay không, chọn công cụ thích hợp và sinh các tham số bắt buộc [27].
* **Lập kế hoạch và suy luận (Planning and reasoning):** Là yếu tố sống còn cho các tác vụ nhiều bước. Mô hình **ReAct** minh họa điều này bằng cách đan xen các bước suy luận với việc sử dụng công cụ, cho phép agent điều chỉnh hành động theo ngữ cảnh đang tiến triển [28]. Các công trình tiếp theo đã tinh chỉnh mẫu hình này với chu kỳ lập-kế-hoạch-rồi-thực-thi tường minh, tự phản tư (ví dụ: **Reflexion**), và tìm kiếm trên cây (ví dụ: **Tree of Thoughts**) [29].
* Việc đánh giá các năng lực này đã tiến hóa vượt ra ngoài các benchmark tĩnh để chuyển sang các chỉ số động dựa trên thực thi, đo lường độ chính xác chọn công cụ, tính đúng đắn của tham số, và tốc độ tiến triển trong các quỹ đạo thời gian thực.

Việc mở rộng quy mô từ agent đơn lẻ sang các đội nhóm làm nảy sinh các thách thức phối hợp được giải quyết bởi nhiều mẫu hình cấu trúc liên kết:
* Các khảo sát về hệ thống multi-agent dựa trên LLM phân loại cấu trúc cộng tác thành ngang hàng (*peer-to-peer*), tập trung (*orchestrator-worker*), hoặc phân tán; và chiến lược điều phối theo vai trò (*role-based*), theo quy tắc (*rule-based*), hoặc theo mô hình (*model-based*) [30].
* Trong thực tế, các hệ thống phân cấp *orchestrator-worker* phân công một agent giám sát để phân rã tác vụ và ủy quyền các tác vụ phụ cho các worker chuyên biệt; các giao thức tranh luận/phản biện (*debate/critique*) cho phép các agent tranh luận về các đề xuất trước khi đạt đồng thuận; các thiết lập phân tầng lồng ghép các agent với các cấp thẩm quyền khác nhau; và các mô hình bầy đàn/thị trường (*swarm/market*) sử dụng cơ chế đấu thầu cạnh tranh hoặc hợp tác để phân bổ tài nguyên.
* Những cơ chế này cho phép các nhóm LLM agent chia sẻ tri thức, song song hóa tác vụ phụ, và hợp lực hướng tới mục tiêu chung, bù đắp cho các hạn chế của từng model riêng lẻ [31]. Tuy nhiên, các thất bại phối hợp—như thông tin sai lệch, bế tắc (*deadlock*), hoặc thông đồng tiêu cực—vẫn là các lĩnh vực nghiên cứu nóng hổi.

Việc triển khai LLM agent vào môi trường sản xuất đòi hỏi các thực hành kỹ thuật nghiêm ngặt:
* **Khả năng quan sát (Observability):** Cung cấp khả năng truy vết (*tracing*) chu kỳ yêu cầu–phản hồi của LLM, theo dõi phiên bản prompt, và giám sát agent/tool, giúp chẩn đoán sự cố và tối ưu hiệu năng.
* **Khung đánh giá (Evaluation frameworks):** Đánh giá có hệ thống các năng lực của agent (lập kế hoạch, sử dụng tool, bộ nhớ, cộng tác) cũng như độ tin cậy, an toàn và căn chỉnh (*alignment*).
* **Bảo mật (Security):** Các cuộc tấn công *prompt injection* thao túng LLM hoạt động ngoài ranh giới an toàn; các khảo sát phân loại các cuộc tấn công này theo ranh giới tin cậy và khuyến nghị các biện pháp phòng vệ kỹ thuật–xã hội kết hợp [32].
* **Thực thi chính sách (Policy enforcement):** Đòi hỏi các bộ giám sát lúc thực thi (*runtime monitors*) kiểm tra sự tuân thủ, tính công bằng và các bất biến an toàn.
* **Tính tái lập (Reproducibility):** Được hỗ trợ bởi các nền tảng điều phối luồng công việc (như ZenML, LangChain) quản lý phiên bản prompt, công cụ và ngữ cảnh thực thi [33]. Cùng nhau, các thực hành này hình thành nên một ngăn xếp **LLMOps** biến các agent thử nghiệm thành các hệ thống sản xuất có quản trị, có thể kiểm toán và có thể mở rộng quy mô.

Sự tiến hóa từ các vòng lặp prompt-response sang các hệ thống agentic định hướng mục tiêu thể hiện sự hội tụ giữa lý thuyết tác tử cổ điển và thực tiễn hiện đại lấy LLM làm trung tâm. Giai đoạn tiếp theo của kiến trúc agentic sẽ giống như sự trưởng thành của các dịch vụ web: **các giao thức chia sẻ, hợp đồng định kiểu và quản trị phân tầng** giúp cho quyền tự chủ có thể kết hợp được ở quy mô lớn.

---



## 3. Từ các mô hình Reactive đến các hệ thống mang tính Agentic và một Kiến trúc Tham chiếu (From Reactive Models to Agentic Systems and a Reference Architecture)

Cách tiếp cận của chúng tôi bắt đầu bằng một bài tổng quan có mục tiêu về các tài liệu nghiên cứu tác tử thông minh (*intelligent agent*) kinh điển nhằm đặt nền móng cho cuộc thảo luận trên các mô hình mẫu (*paradigms*) đã được thiết lập vững chắc, chẳng hạn như điều khiển phản ứng (*reactive control*), lập kế hoạch cân nhắc (*deliberative planning*), và các mô hình Niềm tin - Mong muốn - Ý định (*Belief-Desire-Intention - BDI*). Các công trình nền tảng này đã cung cấp hệ thống từ vựng và các đòn bẩy phân tích mà chúng tôi tái sử dụng khi ánh xạ các khái niệm *agent* trước đây sang các mô hình mẫu hiện đại lấy LLM làm trung tâm (*LLM-centric patterns*) [10, 11, 12, 9, 8]. Bổ sung cho tầng lịch sử đó, chúng tôi khảo sát các nghiên cứu đương đại về sử dụng công cụ (*tool use*), sinh tăng cường truy xuất (*retrieval-augmented generation - RAG*), và các vòng lặp tác tử (*agent loops*) để nắm bắt các cơ chế mà nhờ đó mô hình ngôn ngữ thu nạp được các khả năng bên ngoài, ngữ cảnh bền vững (*persistent context*), và các hành vi ra quyết định lặp (*iterative decision-making behaviors*) [13, 14, 15, 16].

Để thu hẹp khoảng cách giữa góc nhìn học thuật và thực tiễn vận hành, chúng tôi thu thập một cách có hệ thống các tài liệu từ các nhà cung cấp và nền tảng mô tả về điều phối tác tử (*agent orchestration*), giao diện công cụ (*tool interfaces*), các mô hình triển khai (*deployment models*), và các tính năng khả năng quan sát (*observability*). Các nguồn này bao gồm các bản tóm tắt sản phẩm công khai, bài viết blog kỹ thuật, tài liệu API, và các tuyên bố định vị nhà cung cấp từ một tập hợp các nhà cung cấp tiêu biểu [2, 1, 3, 4, 5, 6]. Chúng tôi xử lý các tài liệu này như tài liệu xám (*grey literature*): chúng cung cấp nhiều thông tin để nhận diện các ràng buộc trong thế giới thực, các mẫu thiết kế chung (*common design patterns*), và các ưu tiên kỹ thuật, nhưng chúng không được sử dụng làm bằng chứng cho các tuyên bố so sánh hiệu năng. Khi mô tả nền tảng đưa ra các khẳng định kiến trúc cụ thể, chúng tôi trích xuất nguyên văn các tuyên bố và chú thích trong văn bản để người đọc có thể phân biệt giữa báo cáo mô tả và suy luận phân tích.

Nền tảng khái niệm của AI mang tính tác tử (*agentic AI*) đã có từ nhiều thập kỷ trước LLM. AI kinh điển xem một tác tử (*agent*) như một thực thể tiếp nhận/cảm nhận môi trường (*perceives an environment*) và hành động để đạt được các mục tiêu (*acts to achieve goals*) [8]. Về mặt lịch sử, các kiến trúc trải dài từ điều khiển phản ứng (*reactive control*), lập kế hoạch cân nhắc (*deliberative planning*), cho đến các kết hợp lai (*hybrid combinations*). Điều khiển phản ứng biểu thị các vòng lặp cảm nhận - hành động (*perception-action loops*) gắn kết chặt chẽ với trạng thái nội bộ tối thiểu, được minh họa bằng điều khiển phân tầng kiểu bao hàm (*subsumption-style layered control*) trong robot học [9]. Lập kế hoạch cân nhắc dựa vào các mô hình thế giới nội bộ tường minh (*explicit internal world models*) và lập kế hoạch mang tính biểu tượng (*symbolic planning*), thường tốn kém về mặt tính toán nhưng có thể giải thích được (*interpretable*). Các hệ thống lai kết hợp các tầng phản ứng cung cấp sự an toàn và kiểm soát nhanh chóng với các tầng cân nhắc thực hiện lập kế hoạch, cân bằng giữa tính vững chắc (*robustness*) và tính linh hoạt (*flexibility*). Kiến trúc BDI (*Belief-Desire-Intention*) đã hình thức hóa suy luận của một tác tử dưới dạng trạng thái thông tin (*beliefs* - niềm tin), mục tiêu (*desires* - mong muốn), và các kế hoạch đã cam kết (*intentions* - ý định) [10, 11]. Nghiên cứu về các hệ thống đa tác tử (*multi-agent systems*) đã khám phá sự phối hợp (*coordination*), thương lượng (*negotiation*), và hành vi nổi lên (*emergent behavior*) giữa các tác tử tương tác với nhau [12]. Cùng nhau, các mô hình mẫu này đã thiết lập vòng lặp *sense-think-act* (cảm nhận - suy nghĩ - hành động) và quan niệm rằng trí thông minh một phần là thuộc tính của kiến trúc — trạng thái, luồng điều khiển, và giao diện — chứ không chỉ riêng của một mô hình đã học (*learned model*).

Các mô hình ngôn ngữ lớn đã đưa ra một cơ chế thực tiễn cho việc hiểu và sinh ngôn ngữ tự nhiên trên miền rộng, nhưng các tích hợp ban đầu thường mang tính nguyên khối (*monolithic*): một *prompt* đầu vào, một câu trả lời đầu ra. Khi các LLM được yêu cầu thực hiện những việc như truy xuất dữ liệu mới, cập nhật bản ghi, hoặc chạy các phân tích, các kiến trúc hệ thống bắt đầu giống với các hệ thống AI phức hợp (*compound AI systems*), trong đó một thành phần suy luận đóng vai trò điều phối các lệnh gọi tới các công cụ (*tools*) và bộ truy xuất (*retrievers*) [13, 14, 15]. Sự chuyển dịch then chốt là mô hình không còn là toàn bộ ứng dụng nữa; nó là một nhân nhận thức (*cognitive kernel*) được nhúng trong một vòng lặp điều khiển bao gồm kích hoạt công cụ (*tool invocation*) như tìm kiếm, thực thi mã và các API, bộ nhớ ngoài và truy xuất (*external memory and retrieval*), lập kế hoạch lặp và tự sửa sai (*iterative planning and self-correction*), cùng với giám sát và quản trị (*monitoring and governance*). Các bài viết gần đây của LangChain nhấn mạnh sự trỗi dậy của kỹ nghệ tác tử (*agent engineering*) như một chuyên ngành, tập trung vào việc phân tích hành vi ở quy mô lớn và tính trung tâm của các dấu vết vết thực thi (*traces*) để hiểu các quyết định của tác tử [5]. Điều này nhất quán với một bài học kiến trúc rộng lớn hơn: khi luồng điều khiển được học một phần và mang tính ngẫu nhiên (*stochastic*), khả năng quan sát tại thời gian chạy (*runtime observability*) trở nên quan trọng ngang bằng với việc kiểm tra mã tĩnh (*static code inspection*).

```
+---------------------------------------------------------------------------------------------------+
|               HÌNH 2: SO SÁNH SINGLE-TURN LLM VS. VÒNG LẶP ReAct VS. ĐIỀU PHỐI MULTI-AGENT        |
+---------------------------------------------------------------------------------------------------+
| 1. SINGLE-TURN LLM            | 2. ReAct LOOP                 | 3. MULTI-AGENT ORCHESTRATION      |
|    (Monolithic)               |    (Reasoning & Acting)       |    (Collaborative Swarm)          |
|                               |                               |                                   |
|      [ User Prompt ]          |        [ User Goal ]          |       [ Complex Objective ]       |
|             │                 |              │                |                 │                 |
|             ▼                 |              ▼                |                 ▼                 |
|     ┌──────────────┐          |     ┌─────────────────┐       |      ┌─────────────────────┐      |
|     │              │          |  ┌─►│ LLM Controller  ├─┐     |      │  Orchestrator Agent │◄──┐  |
|     │     LLM      │          |  │  └─────────────────┘ │     |      └──────────┬──────────┘   │  |
|     │    (Large    │          |  │ Thought & Plan       │     |        ┌────────┼────────┐     │  |
|     │   Language   │          |  │                      ▼     |        ▼        ▼        ▼     │  |
|     │    Model)    │          |  │  ┌─────────────────┐       |   ┌────────┐┌────────┐┌────────┐ │  |
|     │              │          |  │  │Action Execution │       |   │ Coder  ││Research││Reviewer│ │  |
|     └──────┬───────┘          |  │  └────────┬────────┘       |   │ Agent  ││ Agent  ││ Agent  │ │  |
|             │                 |  │           │                |   │ (Loop) ││ (Loop) ││ (Loop) │ │  |
|             ▼                 |  │           ▼                |   └───┬────┘└───┬────┘└───┬────┘ │  |
|     [ Final Response ]        |  │  ┌─────────────────┐       |       │         │         │      │  |
|                               |  │  │  Tools / APIs / │       |       ▼         ▼         ▼      │  |
|                               |  │  │   Environment   ├─┐     |   ┌───────┐ ┌───────┐ ┌───────┐  │  |
|                               |  │  └─────────────────┘ │     |   │Domain │ │Domain │ │Domain │  │  |
|                               |  │ Observation          │     |   │ Tools │ │ Tools │ │ Tools │  │  |
|                               |  └──────────────────────┘     |   └───────┘ └───────┘ └───────┘  │  |
|                               |              │                |                 │                │  |
|                               |              ▼                |                 └────────────────┘  |
|                               |      [ Task Completion ]      |                 ▼                 |
|                               |                               |       [ Synthesized Outcome ]     |
|  Direct, stateless prompt-    |  Iterative, tool-using cycle  |  Distributed, hierarchical,       |
|  response.                    |  with feedback.               |  role-based collaboration.        |
+---------------------------------------------------------------------------------------------------+
```
*Hình 2: So sánh LLM Đơn lượt (Single-Turn LLM) vs. Vòng lặp ReAct (ReAct Loop) vs. Điều phối Đa tác tử (Multi-Agent Orchestration).*

Hình 3 trình bày một kiến trúc tham chiếu phân tầng cho các tác tử hiện đại dựa trên LLM, được thiết kế để phân tách các mối quan tâm (*separation of concerns*) và hỗ trợ tính quản trị ngay từ khâu thiết kế (*governance-by-construction*). Ở đỉnh của ngăn xếp là tác nhân con người cung cấp ý định (*intent*) và các ràng buộc (*constraints*), cùng với giao diện tác tử (*agent interface*) có thể là chat, giao diện người dùng (UI), hoặc API. Lõi tác tử (*Agent Core*) chứa thành phần suy luận LLM. Nhằm tách biệt nhận thức khỏi thực thi, một tầng điều khiển (*control layer*) triển khai logic lập kế hoạch (*planner*) và chính sách (*policy*), các máy trạng thái (*state machines*), logic thử lại và lùi thời gian chờ (*retry & backoff*), và các bộ ngắt mạch (*circuit breakers*). Một tầng bộ nhớ (*memory layer*) lưu giữ ngữ cảnh làm việc (*working context*), kho lưu trữ phân đoạn (*episodic store*), các cơ sở tri thức ngữ nghĩa (*semantic knowledge bases*) và cơ sở dữ liệu vector (*vector stores*), cùng với hồ sơ và tùy chọn của người dùng (*user preferences & profiles*). Tầng công cụ (*tooling layer*) triển khai sổ đăng ký công cụ (*tool registry*) và các lược đồ (*schemas*), các bộ kết nối và chuyển đổi (*connectors & adapters*), các môi trường thực thi hộp cát (*sandboxed execution environments*), và truy xuất RAG (*retrieval-augmented generation*). Quản trị và khả năng quan sát (*Governance & Observability*) là các mối quan tâm xuyên suốt (*cross-cutting*), bao gồm kiểm soát truy cập dựa trên vai trò (*Role-Based Access Control - RBAC*) và nhật ký kiểm toán (*audit logs*), truy vết và đánh giá (*tracing & evaluation*), thực thi chính sách (*policy enforcement*), cùng với các giới hạn chi phí và tần suất (*cost & rate limits*). Các tích hợp môi trường bên ngoài (*external environment*) kết nối với các ứng dụng, dữ liệu, tài nguyên web, và hạ tầng. Nhận thức (LLM) được cố ý tách biệt khỏi luồng điều khiển, bộ nhớ, và thực thi công cụ; quản trị và khả năng quan sát cắt ngang toàn bộ ngăn xếp. Sự phân tách này phản ánh trọng tâm của các nền tảng doanh nghiệp về điều phối, bảo mật, và truy vết [2, 3, 4, 5].

### Vòng lặp tác tử như một cấu trúc điều khiển hạng nhất (Agent loop as a first-class control structure)

Hành vi mang tính tác tử (*agentic behavior*) phát sinh từ một vòng lặp điều khiển có tính lặp (*iterative control loop*) chứ không phải từ một lần suy luận đơn lẻ. Thuật toán 1 phác thảo một vòng lặp khái quát phù hợp với phương pháp đan xen giữa suy luận và hành động kiểu ReAct (*ReAct-style interleaving of reasoning and acting*) [14].

---

**Thuật toán 1: Generic agent loop (goal-directed tool-using agent)**
*(Vòng lặp tác tử khái quát - tác tử sử dụng công cụ định hướng mục tiêu)*

- **Require (Yêu cầu đầu vào):** mục tiêu của người dùng $g$ (*user goal*), các công cụ $T$ kèm theo lược đồ (*tools with schemas*), bộ nhớ $M$ (*memory*), các chính sách $P$ (*policies*).
- **1:** $s \leftarrow \text{InitState}(g)$
- **2:** **for** $k = 1$ **to** $K_{\max}$ **do**
- **3:** $\quad c \leftarrow \text{BuildContext}(s, M, P)$
- **4:** $\quad p \leftarrow \text{PlanStep}(\text{LLM}, c) \quad$ *\{đề xuất hành động tiếp theo hoặc mục tiêu phụ - propose next action or subgoal\}*
- **5:** $\quad$ **if** $\text{ViolatesPolicy}(p, P)$ **then**
- **6:** $\quad\quad p \leftarrow \text{RepairPlan}(p, P)$
- **7:** $\quad$ **end if**
- **8:** $\quad$ **if** $\text{IsToolCall}(p)$ **then**
- **9:** $\quad\quad r \leftarrow \text{ExecuteTool}(p, T) \quad$ *\{kích hoạt có định kiểu + hộp cát - typed invocation + sandbox\}*
- **10:** $\quad\quad s \leftarrow \text{UpdateState}(s, p, r)$
- **11:** $\quad\quad \text{WriteMemory}(M, s, p, r)$
- **12:** $\quad$ **else**
- **13:** $\quad\quad$ **return** $\text{FinalizeAnswer}(p, s)$
- **14:** $\quad$ **end if**
- **15:** $\quad$ **if** $\text{ShouldStop}(s)$ **then**
- **16:** $\quad\quad$ **return** $\text{SummarizeProgress}(s)$
- **17:** $\quad$ **end if**
- **18:** **end for**
- **19:** **return** $\text{FailSafe}(s) \quad$ *\{suy giảm an toàn + leo thang - graceful degradation + escalation\}*

---

Về mặt kiến trúc, điểm mấu chốt là việc thực thi công cụ không phải là một phần của mô hình; nó được làm trung gian bởi các giao diện có định kiểu (*typed interfaces*), các hộp cát (*sandboxes*), và các chính sách (*policies*). Sự tách biệt này hỗ trợ tính quản trị và khả năng kiểm toán được nhấn mạnh trong các nền tảng tác tử doanh nghiệp [2, 3, 1].

```
+---------------------------------------------------------------------------------------------------+
|              HÌNH 3: KIẾN TRÚC THAM CHIẾU CHO CÁC HỆ THỐNG AGENTIC AI (REFERENCE ARCHITECTURE)    |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|                                        ┌───────────────────┐                                      |
|                                        │       HUMAN       │                                      |
|                                        │(intent,constraints│                                      |
|                                        └─────────┬─────────┘                                      |
|                                                  │                                                |
|                                                  ▼                                                |
|                                        ┌───────────────────┐                                      |
|                                        │  AGENT INTERFACE  │                                      |
|                                        │ (chat, UI, API)   │                                      |
|                                        └─────────┬─────────┘                                      |
|   ┌──────────────────────────────────────────────┼────────────────────────────────────────────┐   |
|   │                                              ▼                                            │   |
|   │                                    ┌───────────────────┐                                  │   |
|   │                                    │    AGENT CORE     │                                  │   |
|   │                                    │   LLM reasoning   │                                  │   |
|   │                                    └─────────┬─────────┘                                  │   |
|   │                                              │                                            │   |
|   │  ┌───────────────────────────────────────────┴─────────────────────────────────────────┐  │   |
|   │  │                                     CONTROL LAYER                                   │  │   |
| G │  │  • Planner / policy logic                    • Retry & backoff                      │  │ G |
| O │  │  • State machines                            • Circuit breakers                     │  │ O |
| V │  └───────────────────────────────────────────┬─────────────────────────────────────────┘  │ V |
| E │                                              │                                            │ E |
| R │  ┌───────────────────────────────────────────┴─────────────────────────────────────────┐  │ R |
| N │  │                                     MEMORY LAYER                                    │  │ N |
| A │  │  • Working context                           • Semantic KB / vector store           │  │ A |
| N │  │  • Episodic store                            • Preferences & profiles               │  │ N |
| C │  └───────────────────────────────────────────┬─────────────────────────────────────────┘  │ C |
| E │                                              │                                            │ E |
|   │  ┌───────────────────────────────────────────┴─────────────────────────────────────────┐  │   |
| & │  │                                    TOOLING LAYER                                    │  │ & |
|   │  │  • Tool registry + schemas                   • Sandboxed execution                  │  │   |
| O │  │  • Connectors / adapters                     • RAG retrieval                        │  │ O |
| B │  └───────────────────────────────────────────┬─────────────────────────────────────────┘  │ B |
| S │                                              │                                            │ S |
| E │  ════════════════════════════════════════════╪══════════════════════════════════════════  │ E |
| R │                                              ▼                                            │ R |
| V │                                    ┌───────────────────┐                                  │ V |
| A │                                    │EXTERNAL ENVIRONMENT│                                  │ A |
| B │                                    │(apps,data,web,inf)│                                  │ B |
| I │                                    └───────────────────┘                                  │ I |
| L │                                                                                           │ L |
| I │  GOVERNANCE & OBSERVABILITY (CROSS-CUTTING):                                              │ I |
| T │  • RBAC & Audit Logs                         • Tracing & Evaluation                       │ T |
| Y │  • Policy Enforcement                        • Cost & Rate Limits                         │ Y |
|   └───────────────────────────────────────────────────────────────────────────────────────────┘   |
+---------------------------------------------------------------------------------------------------+
```
*Hình 3: Kiến trúc tham chiếu cho các hệ thống Agentic AI. Nhận thức (LLM) được phân tách khỏi luồng điều khiển, bộ nhớ, và thực thi công cụ; quản trị và khả năng quan sát cắt ngang toàn bộ ngăn xếp. Sự phân tách này phản ánh sự nhấn mạnh của nền tảng doanh nghiệp vào điều phối, bảo mật, và truy vết [2, 3, 4, 5].*

### Giao diện công cụ: có định kiểu, có thể khám phá, và có thể quản trị (Tool interfaces: typed, discoverable, and governable)

Sử dụng công cụ là cây cầu nối giữa ngôn ngữ và hành động. Các hệ thống ban đầu thường sử dụng các mẫu *prompt* phi cấu trúc và điều này đã bộc lộ tính mong manh (*fragile*). Các thiết kế hiện đại xử lý các công cụ như:
1. **Các bản hợp đồng có định kiểu (*typed contracts*)** phơi bày các lược đồ (*schemas*) cho dữ liệu đầu vào, đầu ra, và các điều kiện tiên quyết (*preconditions*);
2. **Các mục đăng ký có thể khám phá (*discoverable registry entries*)** được liệt kê, đánh phiên bản, và kiểm soát truy cập;
3. **Các đơn vị thực thi trong hộp cát (*sandboxed execution units*)** chạy dưới nguyên tắc đặc quyền tối thiểu (*least privilege*) với các giới hạn tần suất (*rate limits*) và các giá trị mặc định an toàn (*safe defaults*).

TrueFoundry mô tả một cách rõ ràng các sổ đăng ký (*registries*), việc xác thực lược đồ (*schema validation*), và triển khai hướng chính sách của các máy chủ Giao thức Ngữ cảnh Mô hình (*Model Context Protocol - MCP*) để quản lý lưu lượng truy cập của tác tử và thực thi các giới hạn [3]. Kore.ai nhấn mạnh các tích hợp công cụ và hội thoại, các kiểm soát quản trị viên cùng với các năng lực quản trị như RBAC, nhật ký kiểm toán, và các rào chắn bảo vệ (*guardrails*) [2]. Những mô tả này phù hợp với quỹ đạo hướng tới các sổ đăng ký công cụ (*tool registries*) như là một cấu trúc tương đương trong kỷ nguyên tác tử của các cổng API (*API gateways*) trong kiến trúc vi dịch vụ (*microservices*).

### Bộ nhớ: từ cửa sổ ngữ cảnh đến trạng thái phân tầng (Memory: from context windows to hierarchical state)

Hành vi hướng tới chân trời dài hạn (*long-horizon behavior*) đòi hỏi trạng thái vượt ra ngoài một cửa sổ ngữ cảnh đơn lẻ. Về mặt kiến trúc, người ta có thể phân biệt:
- **Bộ nhớ làm việc (*working memory*):** ngữ cảnh *prompt* tức thời và tạm thời (*ephemeral*);
- **Bộ nhớ phân đoạn (*episodic memory*):** các dấu vết tương tác và kết quả được tóm tắt, được đánh chỉ mục theo thời gian và nhiệm vụ;
- **Bộ nhớ ngữ nghĩa (*semantic memory*):** tri thức bền vững được lưu trữ trong các tài liệu, véc-tơ nhúng (*embeddings*), hoặc đồ thị tri thức (*knowledge graphs*);
- **Bộ nhớ tùy chọn hoặc hồ sơ (*preference or profile memory*):** ghi lại các ràng buộc cụ thể của người dùng và phong cách ưu tiên khi có sự đồng thuận.

Bộ nhớ làm gia tăng năng lực nhưng lại làm phát sinh các mối lo ngại về quyền riêng tư và quản trị, thúc đẩy sự ra đời của truy xuất nhận biết chính sách (*policy-aware retrieval*) và kiểm soát truy cập. Các nền tảng doanh nghiệp đưa các nguyên thủy quản trị bao gồm RBAC, nhật ký kiểm toán, và thực thi chính sách lên hàng đầu như những yếu tố kiến trúc không thể tách rời thay vì là những suy nghĩ bổ sung sau (*afterthoughts*) [2, 3, 1]. ZenML đóng khung quản trị theo góc nhìn quy trình làm việc (*workflow*), nhấn mạnh quản lý khóa tập trung, kiểm soát truy cập dựa trên vai trò, và dòng dõi nguồn gốc sẵn sàng cho kiểm toán (*audit-ready lineage*) từ dữ liệu thô đến đầu ra cuối cùng [4].

### Đường ống lập kế hoạch và tự sửa lỗi (Planning and self-correction pipelines)

Lập kế hoạch trong các hệ thống tác tử trải rộng trên một dải phổ:
- Từ **lập kế hoạch ngầm định (*implicit planning*)**, nơi kế hoạch chỉ đơn giản nổi lên trong đầu ra của LLM;
- Đến **lập kế hoạch tường minh (*explicit planning*)**, trong đó một mô-đun lập kế hoạch (*planner module*) tạo ra một đồ thị nhiệm vụ (*task graph*) và một bộ thực thi (*executor*) sẽ chạy nó;
- Đến **phản tư lặp (*iterative reflection*)**, nơi tác tử tự phê bình các kết quả trung gian, sửa chữa kế hoạch, và thử lại.

ReAct cung cấp một khuôn mẫu có tầm ảnh hưởng lớn: đan xen suy luận với hành động để các bước tiếp theo được tiếp đất (*grounded*) trên các quan sát thu được [14]. Các phương pháp dựa trên phản tư (*reflection-based methods*) nhằm mục đích giảm tích tụ sai số bằng cách sửa đổi kế hoạch dựa trên kết quả thực tế [16]. Dưới góc độ kiến trúc, điểm quan trọng là lập kế hoạch là một **đường ống (*pipeline*)** chứ không phải một *prompt*; đường ống này có thể được đo đạc (*instrumented*), đánh giá (*evaluated*), và ràng buộc (*constrained*).

```
+---------------------------------------------------------------------------------------------------+
|                  HÌNH 4: KIẾN TRÚC THAM CHIẾU CÓ QUẢN TRỊ (THE GOVERNED REFERENCE ARCHITECTURE)     |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  ┌───────────────────────────────┐       ┌─────────────────────────────┐                          |
|  │  Layered Cognitive Stack      │       │  Governance-by-Construction │                          |
|  │  Tách biệt Agent Core (LLM)   │       │  RBAC, nhật ký kiểm toán,   │                          |
|  │  khỏi Tầng Điều khiển, Tầng   │       │  và thực thi chính sách là  │                          |
|  │  Bộ nhớ, và Tầng Công cụ.     │       │  thiết yếu cho an toàn      │                          |
|  └──────────────┬────────────────┘       │  trong môi trường sản xuất. │                          |
|                 │                        └──────────────┬──────────────┘                          |
|                 ▼                                       │                                         |
|      ╔═══════════════════════════════════════════════╗  │                                         |
|      ║  🛡️ SHIELD: GOVERNANCE-BY-CONSTRUCTION       ║◄─┘                                         |
|      ║  ┌─────────────────────────────────────────┐  ║                                            |
|      ║  │            AGENT CORE (LLM)             │  ║                                            |
|      ║  └────────────────────┬────────────────────┘  ║                                            |
|      ║                       │                       ║       ┌─────────────────────────────────┐  |
|      ║                       ▼                       ║       │        PHÂN LOẠI BỘ NHỚ         │  |
|      ║  ┌─────────────────────────────────────────┐  ║       ├─────────────────────────────────┤  |
|      ║  │              CONTROL LAYER              │  ║       │ • Working (Bộ nhớ làm việc):    │  |
|      ║  │  [RBAC]     [Audit Logs]    [Policy Enf]│  ║       │   Ngữ cảnh tức thời, tạm thời   │  |
|      ║  └────────────────────┬────────────────────┘  ║       │   bên trong prompt hiện tại.    │  |
|      ║                       │                       ║       │                                 │  |
|      ║                       ▼                       ║       │ • Episodic (Bộ nhớ phân đoạn):  │  |
|      ║  ┌─────────────────────────────────────────┐  ║       │   Các dấu vết tương tác và kết  │  |
|      ║  │              MEMORY LAYER               │  ║──────►│   quả được tóm tắt, đánh chỉ mục│  |
|      ║  │  [Working]    [Episodic]     [Semantic] │  ║       │   theo từng nhiệm vụ.           │  |
|      ║  └────────────────────┬────────────────────┘  ║       │                                 │  |
|      ║                       │                       ║       │ • Semantic (Bộ nhớ ngữ nghĩa):  │  |
|      ║                       ▼                       ║       │   Tri thức bền vững lưu trong   │  |
|      ║  ┌─────────────────────────────────────────┐  ║       │   vector DB hoặc đồ thị tri     │  |
|      ║  │              TOOLING LAYER              │  ║       │   thức (knowledge graphs).      │  |
|      ║  │  ┌───────────────┐   ┌────────────────┐ │  ║       └─────────────────────────────────┘  |
|      ║  │  │Typed Interface│   │Sandboxed Exec. │ │  ║                                            |
|      ║  │  └───────▲───────┘   └────────┬───────┘ │  ║                                            |
|      ║  └──────────┼────────────────────┼─────────┘  ║                                            |
|      ╚═════════════╪════════════════════╪════════════╝                                            |
|                    │                    │                                                         |
|          ┌─────────┴────────┐           ▼                                                         |
|          │   TOOL GATEWAY   │───► [External APIs, DBs, Microservices, Web]                        |
|          └──────────────────┘                                                                     |
|          Mọi hành động bên ngoài đều được trung gian qua các giao diện có định kiểu               |
|          và môi trường thực thi hộp cát nhằm ngăn chặn quyền hạn không bị giới hạn.              |
+---------------------------------------------------------------------------------------------------+
```
*Hình 4: Kiến trúc tham chiếu có quản trị (The Governed Reference Architecture).*

Sự nhấn mạnh của LangChain vào các tác tử chuyên sâu (*deep agents*) và quản lý ngữ cảnh phản ánh sự chuyển dịch này: khi độ dài nhiệm vụ tăng lên, hệ thống phải quản lý ngữ cảnh và cung cấp khả năng gỡ lỗi (*debugging*) thông qua các dấu vết có cấu trúc (*structured traces*) và các công cụ phân tích [5].

### Khả năng quan sát: Traces như một chất nền gỡ lỗi mới (Observability: traces as the new debugging substrate)

Hành vi của tác tử mang tính ngẫu nhiên (*stochastic*) và phụ thuộc vào công cụ, điều này khiến kiểm thử đơn vị truyền thống (*traditional unit testing*) trở nên không đủ. Khả năng quan sát (*observability*) do đó trở thành một yêu cầu kiến trúc hàng đầu. Hệ thống phải:
1. Ghi lại các dấu vết chi tiết (*detailed traces*) của từng bước bao gồm *prompts*, các lệnh gọi công cụ, phản hồi, độ trễ, và lỗi;
2. Chạy các bộ kiểm thử hồi quy (*regression suites*) trên các tác vụ tiêu biểu và đo lường tính chính xác của việc sử dụng công cụ;
3. Giám sát các yếu tố kích hoạt chi phí (*cost drivers*) chẳng hạn như số lượng token, phí API công cụ, và mức độ sử dụng GPU đối với các mô hình tự lưu trữ (*self-hosted models*).

TrueFoundry nhấn mạnh khả năng quan sát toàn diện cho tác tử bao gồm từ *prompt* đến thực thi công cụ và khả năng tích hợp tương thích với OpenTelemetry với Grafana, Datadog, và Prometheus [3]. Kore.ai mô tả khả năng kiểm soát và quan sát tích hợp sẵn thông qua truy vết, phân tích, nhật ký kiểm toán, và quản trị [2]. Các tài liệu của LangChain nhấn mạnh việc gỡ lỗi và thấu hiểu hành vi của tác tử ở quy mô lớn thông qua các *traces* [5]. Những chủ đề này hội tụ về một khẳng định kiến trúc chung: **nếu không có các dấu vết thực thi (traces), các hệ thống tác tử không thể được kỹ nghệ hóa một cách đáng tin cậy.**

### Hình thức hóa ý đồ kiến trúc thành các bất biến có thể thực thi (Invariants)

Việc chuyển đổi một kiến trúc tham chiếu thành một đặc tả có thể thực thi (*executable specification*) đòi hỏi phải hình thức hóa ý đồ kiến trúc thành các **bất biến có thể cưỡng chế (*enforceable invariants*)** nhằm ràng buộc hành vi hệ thống trên mọi triển khai. Sự phân tách các mối quan tâm được đề xuất giữa nhận thức LLM, điều phối và kiểm soát, công cụ, và bộ nhớ chỉ trở thành khả năng vận hành thực tế khi được mã hóa thành các yêu cầu chuẩn tắc (*normative requirements*) được biểu đạt qua các điều khoản bắt buộc (*mandatory*) và khuyến nghị (*recommended*).

- **Thực thi qua cổng chính sách:** Ví dụ, tất cả các hành động tạo ra tác dụng phụ (*side-effecting actions*) **bắt buộc** phải được làm trung gian bởi một cổng thực thi chính sách (*policy enforcement gateway*), qua đó ngăn chặn việc mô hình ngôn ngữ kích hoạt công cụ trực tiếp và đảm bảo rằng việc cấp quyền (*authorization*), tuân thủ (*compliance*), và đánh giá rủi ro (*risk evaluation*) luôn đi trước bất kỳ tương tác bên ngoài nào.
- **Định kiểu mạnh và đánh phiên bản:** Tương tự như vậy, mọi lệnh gọi công cụ **nên** được định kiểu mạnh và đánh phiên bản, với lược đồ và phiên bản công cụ được ghi lại như một phần của siêu dữ liệu thực thi (*execution metadata*). Yêu cầu này thiết lập tính tái lập (*reproducibility*) và tính kiểm toán (*auditability*), cho phép phát lại có tính tất định (*deterministic replay*) và đánh giá theo chiều dọc (*longitudinal evaluation*) qua các đợt nâng cấp mô hình và công cụ.

Bằng cách quy chuẩn hóa các ràng buộc này, kiến trúc tiến hóa từ một mô hình phân tầng mang tính khái niệm thành một **bản hợp đồng có thể kiểm chứng (*verifiable contract*)** điều chỉnh cách các tác tử thông minh tương tác với các hệ thống bên ngoài.

Trách nhiệm giải trình vận hành (*operational accountability*) phụ thuộc sâu hơn vào khả năng quan sát được chuẩn hóa và tính tự chủ có giới hạn (*bounded autonomy*). Mỗi lượt chạy thực thi **bắt buộc** phải tạo ra một dấu vết (*trace*) ghi lại một tập hợp thuộc tính nguồn gốc tối thiểu nhưng đầy đủ (*provenance attributes*), bao gồm định danh mô hình, phiên bản *prompt*, phiên bản công cụ, các quyết định chính sách, các thao tác bộ nhớ, danh tính chủ thể (*principal identity*), và ngân sách tài nguyên. Các dấu vết như vậy hỗ trợ quản trị, ứng phó sự cố, và nghiên cứu thực nghiệm bằng cách cung cấp một chất nền nhất quán cho việc giám sát và đánh giá.

Song song đó, **quyền tự chủ có ngân sách (*budgeted autonomy*)** nên được coi là một bất biến hạng nhất: các hệ thống **bắt buộc** phải thực thi các giới hạn tường minh về số lượng token, thời gian thực thi, số lần kích hoạt công cụ, và chi phí tiền tệ, đồng thời **bắt buộc** phải xác định hành vi chấm dứt an toàn khi thất bại (*fail-safe termination behavior*) khi các giới hạn bị vượt quá. Yêu cầu này hình thức hóa sự suy giảm an toàn (*safe degradation*) và ngăn ngừa hành vi tác tử không giới hạn. Cùng nhau, các bất biến này nâng tầm kiến trúc thành một đặc tả chuẩn tắc có thể được triển khai, kiểm toán, và đánh chuẩn (*benchmarked*) giữa các tổ chức, từ đó thúc đẩy khả năng tương tác (*interoperability*), sự tin cậy (*trust*), và sự tương thích quy định (*regulatory alignment*) trong việc triển khai các hệ thống tác tử AI.



## 4. Tôi luyện trong Môi trường Sản xuất: Quản trị, Độ tin cậy và Bảo mật (Production Hardening: Governance, Reliability, and Security)

Sự chuyển dịch của AI mang tính tác tử (*agentic AI*) từ các nguyên mẫu nghiên cứu (*research prototypes*) sang các hệ thống sản xuất cấp doanh nghiệp (*enterprise production systems*) đòi hỏi một sự chuyển đổi kiến trúc căn bản hướng tới tính an toàn nội tại (*intrinsic safety*) và tính vững chắc trong vận hành (*operational robustness*). Khác với phần mềm tất định (*deterministic software*), các hệ thống tác tử sở hữu một lõi sinh động (*dynamic, generative core*) làm mở rộng phạm vi bán kính ảnh hưởng (*blast radius*) tiềm tàng của các lỗi hỏng — một ảo giác (*hallucination*) đơn lẻ có thể tạo hiệu ứng dây chuyền (*cascade*) thành một thao tác ghi sai vào cơ sở dữ liệu, và một cuộc tấn công tiêm nhiễm lệnh (*prompt injection*) có thể leo thang thành một hành động có đặc quyền (*privileged action*). Do đó, việc tôi luyện cho môi trường sản xuất (*production hardening*) không đơn thuần là một phần bổ sung chắp vá (*add-on*) mà phải được thiết kế như các tầng kiến trúc nền tảng, lồng ghép chặt chẽ vào nhau, bao quát toàn diện việc quản trị (*governance*), độ tin cậy (*reliability*), và bảo mật (*security*). Các nền tảng doanh nghiệp phản ánh tính cấp bách này bằng cách nhúng các mối quan tâm đó như các nguyên thủy hạng nhất (*first-class primitives*), báo hiệu rằng các hệ thống tác tử phải tích hợp vào các khuôn khổ tuân thủ và rủi ro hiện hữu của tổ chức, chứ không thể tồn tại như những ngoại lệ thử nghiệm (*experimental outliers*).

### Mô hình Bảo mật và Kiểm soát Truy cập (Security and Access Control Model)

Trọng tâm của kiến trúc này là một mô hình bảo mật và kiểm soát truy cập được xây dựng trên các nguyên tắc đặc quyền tối thiểu (*least-privilege principles*). Điều này đòi hỏi:
- Một tầng danh tính vững chắc (*robust identity layer*) liên kết mọi hành động với một chủ thể có thể xác minh (*verifiable principal*) — cho dù đó là người dùng là con người, tài khoản dịch vụ (*service account*), hay một vai trò tác tử cụ thể (*specific agent role*);
- Tiếp theo là việc thực thi ủy quyền nghiêm ngặt bằng cách sử dụng Kiểm soát Truy cập Dựa trên Vai trò (*Role-Based Access Control - RBAC*) hoặc Kiểm soát Truy cập Dựa trên Thuộc tính (*Attribute-Based Access Control - ABAC*) đối với các công cụ và kho lưu trữ dữ liệu.

Một thách thức kỹ thuật then chốt là quản lý bí mật (*secret management*), nhằm ngăn chặn việc rò rỉ khóa API (*API keys*) và thông tin xác thực (*credentials*) vào trong ngữ cảnh của mô hình. Các nền tảng như Kore.ai thiết kế kiến trúc tường minh cho mục tiêu này, liệt kê bảo mật AI, rào chắn (*guardrails*), RBAC, và nhật ký kiểm toán toàn diện như các tính năng cốt lõi [2]. Tương tự, TrueFoundry nhấn mạnh đăng nhập một lần (*Single Sign-On - SSO*), RBAC, và việc ghi nhật ký kiểm toán bất biến (*immutable audit logging*) như các nguyên thủy quản trị không thể thương lượng [3]. Về mặt kiến trúc, sự nhấn mạnh tập thể này hàm ý rằng các ngăn xếp tác tử đòi hỏi một **mặt phẳng ủy quyền chuyên dụng (*dedicated authorization plane*)**, tương tự như các mô hình bảo mật *Zero-Trust* được áp dụng trong các hệ sinh thái vi dịch vụ hiện đại, nơi mà mọi giao tiếp giữa tác tử với công cụ và giữa các tác tử với nhau đều bắt buộc phải được làm trung gian.

### Độ tin cậy cho các Tác nhân Phi tất định (Reliability for Non-Deterministic Actors)

Các hệ thống tác tử mang lại những thách thức về độ tin cậy hoàn toàn mới mẻ, khác biệt so với các dịch vụ tất định truyền thống. Các tác tử được vận hành bởi LLM có thể rơi vào các vòng lặp vô hạn (*unbounded loops*), trôi dạt khỏi mục tiêu ban đầu (*objective drift*), hoặc liên tục chọn các hành động dưới mức tối ưu. Việc giảm thiểu các thất bại này đòi hỏi các mẫu thiết kế (*patterns*) được chuyển thể từ kỹ nghệ hệ thống phân tán (*distributed systems engineering*) nhưng được tinh chỉnh dành riêng cho các tác nhân phi tất định (*non-deterministic actors*):
- Áp đặt các vòng lặp có giới hạn với giới hạn số bước tối đa $K_{\max}$ và mức trần cho các lần gọi công cụ (*tool-call caps*);
- Triển khai các bộ ngắt mạch (*circuit breakers*) để tạm dừng thực thi khi tỷ lệ lỗi tăng đột biến hoặc khi các chuỗi hành động không an toàn bị phát hiện;
- Thiết kế các công cụ mang tính lũy đẳng (*idempotent tools*) để ngăn chặn các tác dụng phụ bị trùng lặp do các lần thử lại (*retries*);
- Tích hợp các cổng phê duyệt bắt buộc có con người can thiệp (*human-in-the-loop approval gates*) đối với các hành động rủi ro cao như giao dịch tài chính hoặc xóa dữ liệu.

Các cơ chế kiểm soát này được nhấn mạnh một cách nhất quán trên các nền tảng công nghiệp như một phần của các tầng kiểm soát quản trị và thực thi chính sách [2, 3]. Việc áp dụng chúng phản ánh một thực tế doanh nghiệp rộng lớn hơn: các năng lực tác tử phải được tích hợp liền mạch vào các khuôn khổ rủi ro vận hành đã được thiết lập — một chủ đề được lặp lại trong các tài liệu tư vấn doanh nghiệp nhằm ưu tiên quản trị và chủ quyền dữ liệu song hành cùng năng lực [6].

### Tuân thủ, Khả năng Kiểm toán và Chủ quyền Dữ liệu (Compliance, Auditability, and Sovereignty)

Khi các hệ thống tác tử xử lý dữ liệu chịu sự điều chỉnh của quy định, tính tuân thủ (*compliance*), khả năng kiểm toán (*auditability*), và chủ quyền dữ liệu (*sovereignty*) chuyển hóa trực tiếp thành các mệnh lệnh kiến trúc (*architectural mandates*). Điều này đòi hỏi:
- **Nhật ký kiểm toán chi tiết và bất biến (*immutable, granular audit logs*):** ghi lại toàn bộ chuỗi nhân quả — chủ thể nào đã khởi xướng một hành động, thông qua tác tử nào, sử dụng phiên bản mô hình và *prompt* nào, tại thời điểm nào, và với kết quả ra sao.
- **Ràng buộc cư trú dữ liệu (*data residency requirements*):** đòi hỏi các kiến trúc đảm bảo dữ liệu không bao giờ rời khỏi các môi trường được chỉ định, chẳng hạn như Đám mây Riêng Ảo (*Virtual Private Clouds - VPC*), hạ tầng tại chỗ (*on-premises*), hoặc các khu vực địa chính trị cụ thể.
- **Quản trị mô hình (*model governance*):** đòi hỏi quản lý phiên bản nghiêm ngặt, các quy trình phê duyệt, và việc đánh giá trước khi triển khai.

Kiến trúc của TrueFoundry nhấn mạnh việc triển khai trong VPC, *on-prem*, hoặc các môi trường cách ly hoàn toàn (*air-gapped environments*), nhấn mạnh rằng *"không có dữ liệu nào rời khỏi miền của bạn"* trong khi vẫn hỗ trợ tuân thủ các tiêu chuẩn như SOC 2, HIPAA, và GDPR [3]. ZenML tương tự nhấn mạnh việc triển khai cấp doanh nghiệp bên trong môi trường của khách hàng và tư thế tuân thủ mạnh mẽ (SOC 2, ISO 27001), định hình nền tảng như một mặt phẳng điều khiển (*control plane*) nơi điện toán và dữ liệu duy trì tính chủ quyền [4]. Trọng tâm kiến trúc về chủ quyền này hoàn toàn phù hợp với các mối quan tâm của ban lãnh đạo chiến lược về các ràng buộc pháp lý và địa chính trị [6].

### Quản lý Thay đổi và Tính Tái lập (Change Management and Reproducibility)

Sau cùng, bản chất phi tất định của LLM khiến tính tái lập (*reproducibility*) và quản lý thay đổi có hệ thống (*systematic change management*) trở nên tối quan trọng. Hành vi của tác tử là một hàm phức tạp phụ thuộc vào *prompts*, định nghĩa công cụ, kho ngữ liệu truy xuất (*retrieval corpora*), và phiên bản mô hình. Đảm bảo tính tái lập đòi hỏi:
1. Các *prompts* và công cụ được kiểm soát phiên bản (*version-controlled*) với khả năng theo dõi thay đổi và khôi phục (*rollback*);
2. Dòng dõi nguồn gốc tạo tác toàn diện (*comprehensive artifact lineage*) ghi lại các bộ dữ liệu, ảnh chụp nhanh truy xuất (*retrieval snapshots*), và các kết quả trung gian;
3. Các môi trường thực thi được đóng gói/chụp lại (ví dụ: bộ chứa *containers*) để cho phép chạy lại có tính tất định (*deterministic re-runs*).

ZenML giải quyết vấn đề này bằng cách nhấn mạnh việc đánh phiên bản tạo tác và môi trường để giải quyết bài toán "nó chạy tốt trên máy của tôi" (*it worked on my machine*) và tạo điều kiện cho các đợt *rollback* an toàn [4]. TrueFoundry mô tả các sổ đăng ký tập trung để quản lý vòng đời *prompt* [3], trong khi nền tảng của Kore.ai bao gồm các bộ công cụ chuyên dụng (Prompt Studio, Evaluation Studio, Model Hub) để hỗ trợ cải tiến lặp có quản trị [2]. Những yếu tố này hướng tới một kiến trúc doanh nghiệp hội tụ, nơi AI mang tính tác tử kế thừa và mở rộng kỷ luật DevOps — Tích hợp Liên tục (*CI*), Triển khai Liên tục (*CD*), và Khả năng Quan sát (*Observability*) — sang một miền mới bao gồm các *prompts* có phiên bản, đồ thị công cụ (*tool graphs*), và ngữ cảnh truy xuất. Hàm ý kiến trúc cốt lõi là rõ ràng: **các hệ thống tác tử sẵn sàng cho sản xuất không chỉ là các mô hình AI tiên tiến, mà là các nền tảng phần mềm phức tạp, có quản trị, nơi độ tin cậy, bảo mật và khả năng kiểm toán được đan dệt vào chính cấu trúc thiết kế của chúng.**

---

### Bảng 2: Danh mục Kiểm tra Tôi luyện Cấp Doanh nghiệp cho các Hệ thống AI mang tính Tác tử (Enterprise Hardening Checklist for Agentic AI Systems)

| Lĩnh vực Kiểm soát (*Control Area*) | Mức Yêu cầu (*Requirement*) | Mô hình Mẫu Triển khai (*Implementation Pattern*) | Phương pháp Xác minh (*Verification Method*) | Tạo tác Bằng chứng (*Evidence Artifact*) |
| :--- | :---: | :--- | :--- | :--- |
| **Danh tính & Truy cập (*Identity & Access*)** | **MUST** *(Bắt buộc)* | Danh tính mạnh, thông tin xác thực ngắn hạn, RBAC, đặc quyền tối thiểu (*least privilege*) | Kiểm thử đơn vị (*unit tests*), kiểm toán IAM, kiểm thử thâm nhập (*red-team*) | Nhật ký truy cập/token, Principal ID trong *traces* |
| **Thực thi Chính sách (*Policy Enforcement*)** | **MUST** *(Bắt buộc)* | Cổng chính sách tập trung (*central policy gate*), chính sách dưới dạng mã (*policy-as-code*), phê duyệt cho hành động rủi ro cao | Truy vấn vết thực thi (*trace queries*), kiểm thử hồi quy chính sách | Các quyết định chính sách, hồ sơ phê duyệt |
| **Công cụ & Tích hợp (*Tooling & Integrations*)** | **MUST** *(Bắt buộc)* | Giao diện có định kiểu/đánh phiên bản, xác thực lược đồ (*schema validation*), tính lũy đẳng (*idempotency*) | Kiểm thử hợp đồng / lược đồ (*contract/schema tests*) | Sổ đăng ký lược đồ, phiên bản công cụ trong *traces* |
| **Quản lý Bộ nhớ (*Memory Management*)** | **SHOULD** *(Nên có)* | Bộ nhớ phân tầng (*tiered memory*), lọc thông tin định danh cá nhân (*PII filtering*), chính sách lưu giữ (*retention policies*) | Kiểm toán quản trị dữ liệu, kiểm thử tấn công (*red-team*) | Nhật ký truy cập bộ nhớ, hồ sơ lưu giữ dữ liệu |
| **Khả năng Quan sát & Truy vết (*Observability & Tracing*)** | **MUST** *(Bắt buộc)* | Truy vết có cấu trúc đầu-cuối (*E2E structured tracing*), siêu dữ liệu được chuẩn hóa | Truy vấn vết thực thi (*trace queries*), bảng điều khiển (*dashboards*) | Vết thực thi (*traces*) kèm phiên bản model/prompt/tool |
| **Quyền Tự chủ có Ngân sách (*Budgeted Autonomy*)** | **MUST** *(Bắt buộc)* | Mức trần giới hạn (*caps: tokens/time/cost/tool calls*), bộ ngắt mạch (*circuit breakers*), chấm dứt an toàn | Kiểm thử ứng suất / kiểm thử hỗn loạn (*stress/chaos testing*) | Số liệu ngân sách (*budget metrics*), nhật ký chấm dứt |
| **Quản trị Dữ liệu (*Data Governance*)** | **MUST** *(Bắt buộc)* | Phân loại dữ liệu, mã hóa (khi truyền tải / khi lưu trữ), theo dõi dòng dõi dữ liệu (*lineage tracking*) | Kiểm toán tuân thủ (*compliance audit*), kiểm thử hồi quy | Hồ sơ dòng dõi dữ liệu (*lineage records*), cấu hình mã hóa |
| **CI/CD & Đánh giá (*CI/CD & Evaluation*)** | **SHOULD** *(Nên có)* | Đường ống đánh giá liên tục (*continuous eval pipeline*), bộ chuẩn hồi quy/an toàn (*regression/safety benchmarks*) | Kiểm thử hồi quy / đánh chuẩn tự động | Báo cáo đánh giá (*eval reports*), lịch sử benchmark |
| **Kiểm thử Bảo mật (*Security Testing*)** | **SHOULD** *(Nên có)* | Kiểm thử tấn công tiêm nhiễm lệnh (*prompt injection tests*), đội đỏ đối kháng (*adversarial red-teaming*), hộp cát hóa (*sandboxing*) | Đội đỏ (*red-teaming*), kiểm thử thâm nhập (*penetration tests*) | Báo cáo kiểm thử bảo mật, phiếu sự cố (*incident tickets*) |
| **Quản lý Thay đổi (*Change Management*)** | **SHOULD** *(Nên có)* | Ký điện tử cho prompt/chính sách (*signed prompts/policies*), quy trình phê duyệt thay đổi | Kiểm tra khác biệt cấu hình (*config diff checks*), xem xét kiểm toán | Giá trị băm đã ký (*signed hashes*), nhật ký thay đổi (*change logs*) |



## 5. Kiến trúc Đa tác tử: Từ các Khối nguyên khối đến các Nhóm được Điều phối (Multi-Agent Architectures: From Monoliths to Orchestrated Teams)

Sự tiến hóa của AI mang tính tác tử (*agentic AI*) đã bộc lộ những hạn chế cố hữu trong các mô hình mẫu đơn tác tử (*single-agent paradigms*), thúc đẩy sự chuyển dịch hướng tới các mô hình tính toán phân tán và cộng tác nhiều hơn. Mặc dù có khả năng xử lý các nhiệm vụ được định nghĩa rõ ràng, các đơn tác tử nguyên khối (*monolithic single agents*) thường phải vật lộn với **sự ô nhiễm ngữ cảnh (*context pollution*)** — sự pha loãng và nhiễm bẩn dần dần của một cửa sổ ngữ cảnh cố định bởi các thông tin không liên quan xuyên suốt các tương tác dài. Chúng còn phải đối mặt với **sự quá tải công cụ (*tool overload*)**, nơi một tác tử đơn lẻ phải nắm vững một kho vũ khí hàm ngày càng mở rộng và có khả năng mâu thuẫn lẫn nhau, và chúng thường xuyên loạng choạng trong việc suy luận và lập kế hoạch tin cậy trên chân trời dài hạn (*long-horizon reasoning and planning*).

Để đáp lại, các kiến trúc đa tác tử (*multi-agent architectures*) đã nổi lên như một bước tiến nền tảng, phân phối lao động nhận thức (*cognitive labor*) trên các thực thể chuyên biệt và giới thiệu các cơ chế điều phối tường minh (*explicit coordination mechanisms*). Sự chuyển dịch mô hình mẫu này phản chiếu sự phân công lao động trong các tổ chức con người và các hệ thống phức hợp: di chuyển từ một "người đa năng tổng quát" (*generalist*) bị quá tải duy nhất sang một **đội ngũ các chuyên gia được điều phối (*orchestrated specialists*)**. Các lợi thế cốt lõi của cách tiếp cận này gồm nhiều mặt:
- Cho phép thiết kế và kiểm thử theo mô-đun (*modular design and testing*);
- Giới hạn các miền tri thức để giảm thiểu sự can thiệp / xung đột chéo (*reduce interference*);
- Cho phép thực thi nhiệm vụ đồng thời (*concurrent task execution*);
- Cung cấp một khuôn khổ có cấu trúc để quản lý các quy trình làm việc phức tạp, nhiều bước (*complex, multi-step workflows*).

Để hiểu được bức tranh toàn cảnh của các kiến trúc này, việc xem xét một hệ thống phân loại (*taxonomy*) các cấu trúc liên kết đa tác tử (*multi-agent topologies*) phổ biến đã được kết tinh trong cả nghiên cứu và thực tiễn là vô cùng hữu ích. Mỗi mẫu thiết kế hiện thân cho một triết lý khác nhau về việc phân phối tính đại diện/tác tử (*agency*) và quản lý sự điều phối. Hình 5 thể hiện hệ thống phân loại này.

```
+---------------------------------------------------------------------------------------------------+
|               HÌNH 5: HỆ THỐNG PHÂN LOẠI CÁC CẤU TRÚC LIÊN KẾT ĐA TÁC TỬ (MULTI-AGENT TOPOLOGIES)   |
+---------------------------------------------------------------------------------------------------+
| 1. ORCHESTRATOR-WORKER                                | 2. ROUTER-SOLVER                          |
|    (Bộ điều phối - Công nhân / Quản lý - Chuyên gia) |    (Bộ định tuyến - Bộ giải quyết)        |
|                                                       |                                           |
|                   ┌─────────────┐                     |                 ┌────────────┐   ┌──────┐ |
|                   │  ⚙️ MANAGER  │                     |            ┌───►│ Pipeline 1 ├──►│Result│ |
|                   └──────┬──────┘                     |            │    │(Text Anal.)│   │  1   │ |
|            ┌─────────────┼─────────────┐              |            │    └────────────┘   └──────┘ |
|            ▼             ▼             ▼              |    ┌───────┴──┐ ┌────────────┐   ┌──────┐ |
|       ┌─────────┐   ┌─────────┐   ┌─────────┐         |    │🔍Classif. │───► Pipeline 2 ├──►│Result│ |
|       │🤖Worker │   │🤖Worker │   │🤖Worker │         |    │ (Router) ├──┐│ (Image Rec)│   │  2   │ |
|       └─────────┘   └─────────┘   └─────────┘         |    └──────────┘ │└────────────┘   └──────┘ |
|                                                       |                 │┌────────────┐   ┌──────┐ |
|  Nút trung tâm phân quyền nhiệm vụ cho các nút con.   |                 └► Pipeline 3 ├──►│Result│ |
|  (Central node delegates tasks to sub-nodes.)         |                  │(Code Gen.)│   │  3   │ |
|                                                       |                  └────────────┘   └──────┘ |
|                                                       |  Đầu vào định hướng tới đường ống cụ thể. |
|                                                       |  (Input directs to specific pipelines.)   |
+-------------------------------------------------------+-------------------------------------------+
| 3. HIERARCHICAL COMMAND STRUCTURES                    | 4. SWARM OR MARKET-LIKE ARCHITECTURES     |
|    (Cấu trúc Chỉ huy Phân tầng)                      |    (Kiến trúc Đàn / Thị trường Phi tập tr)|
|                                                       |                                           |
|                         /\                            |           ┌────────┐      ┌────────┐      |
|                        /  \                           |           │ Node A │◄────►│ Node B │      |
|                       / 👑 \                          |           └───┬───┬┘\    /└───┬────┘      |
|                      / CEO  \                         |               │   │  \  /     │           |
|                     /────────\                        |               │   │   \/      │           |
|                    /  Mgr A   \                       |               │   ▼   /\      ▼           |
|                   /  & Mgr B   \                      |               │ ┌────┴──┐   ┌────────┐    |
|                  /──────────────\                     |               │ │Node E │◄─►│ Node G │    |
|                 /    Workers     \                    |               │ └────┬──┘   └────▲───┘    |
|                /──────────────────\                   |               ▼      │           │        |
|               ┌────────────────────┐                  |           ┌────────┐ │    ┌──────┴─┐      |
|               │Layered Command Str.│                  |           │ Node D │◄┴───►│ Node F │      |
|               └────────────────────┘                  |           └────────┘      └────────┘      |
|  Cấu trúc chỉ huy phân cấp dạng cây tổ chức.          |  Mạng lưới ngang hàng phi tập trung.      |
|  (Layered command structure: CEO -> Mgrs -> Workers)  |  (Decentralized peer-to-peer network.)    |
+---------------------------------------------------------------------------------------------------+
```
*Hình 5: Hệ thống phân loại các cấu trúc liên kết đa tác tử (Taxonomy of multi-agent topologies).*

### 1. Orchestrator–Worker (Manager–Specialist / Điều phối viên – Công nhân)
Đây có lẽ là mô hình phổ biến và trực quan dễ hiểu nhất. Một tác tử điều phối trung tâm (*central orchestrator*) (hoặc quản lý - *manager*) chịu trách nhiệm thấu hiểu nhiệm vụ mức cao, lập kế hoạch, và phân rã nhiệm vụ (*decomposition*). Sau đó, nó ủy quyền các nhiệm vụ phụ riêng biệt cho một đội ngũ tác tử công nhân chuyên biệt (*specialized worker agents*), chẳng hạn như một tác tử nghiên cứu (*researcher*), một tác tử viết mã (*coder*), một tác tử phê bình (*critic*), hoặc một tác tử thực thi hành động (*action executor*). 

Bộ điều phối tổng hợp đầu ra của các công nhân để tạo ra kết quả cuối cùng. Cấu trúc liên kết này phản chiếu trực tiếp các quy trình làm việc của tổ chức truyền thống và mang lại lợi ích to lớn cho việc đánh giá theo mô-đun (*modular evaluation*) cũng như độ vững chắc của hệ thống, vì mỗi chuyên gia có thể được phát triển, tối ưu hóa, và kiểm chứng độc lập theo vai trò cụ thể của nó. Tuy nhiên, **bộ điều phối trở thành điểm lỗi đơn lẻ chí mạng (*critical single point of failure*) và là nút thắt cổ chai tiềm tàng (*bottleneck*) cho khả năng suy luận của toàn bộ hệ thống.**

### 2. Router–Solver (Bộ định tuyến – Bộ giải quyết)
Cấu trúc liên kết này nhấn mạnh tính hiệu quả và độ tinh khiết của ngữ cảnh (*context purity*). Một tác tử định tuyến (*router agent*) hoạt động như một bộ phân loại (*classifier*), phân tích một nhiệm vụ đến để xác định loại của nó — ví dụ: "sinh mã" (*code generation*), "phân tích dữ liệu" (*data analysis*), hoặc "tóm tắt nội dung" (*content summarization*). Dựa trên phân loại này, bộ định tuyến chuyển hướng nhiệm vụ đến một tác tử giải quyết chuyên biệt (*specialized solver agent*) đã được cấu hình trước, phù hợp nhất cho danh mục đó.

Thiết kế này làm giảm đáng kể sự ô nhiễm ngữ cảnh bằng cách ngăn chặn việc trộn lẫn các bộ công cụ và cơ sở tri thức khác biệt bên trong một tác tử duy nhất. Nó cũng có thể cải thiện độ trễ và giảm chi phí bằng cách chỉ kích hoạt các công cụ thực sự cần thiết cho đường dẫn tác vụ nhất định. Thách thức chính nằm ở việc thiết kế một bộ định tuyến vững chắc và đảm bảo độ bao phủ toàn diện các loại nhiệm vụ bởi tập hợp các bộ giải quyết.

### 3. Cấu trúc Chỉ huy Phân tầng (Hierarchical Command Structures)
Để quản lý các dự án phức tạp, quy mô lớn, một mô hình phẳng *orchestrator–worker* có thể trở nên không đủ. Các cấu trúc phân tầng đưa vào nhiều cấp quản lý, nơi các nhà quản lý cấp cao nhất điều phối các nhà quản lý cấp trung, những người này lại lần lượt giám sát các nhóm công nhân chuyên biệt. 

Sự đệ quy này cho phép phân rã các vấn đề đặc biệt phức tạp thành các bài toán con có thể quản lý được, phân phối trên một cây các tác tử (*tree of agents*). Mặc dù cấu trúc này có thể cải thiện khả năng mở rộng (*scalability*) và cung cấp các ranh giới trách nhiệm rõ ràng, nó cũng làm gia tăng chi phí điều phối (*coordination overhead*), độ trễ giao tiếp, và độ phức tạp của các chế độ lỗi hỏng (*failure modes*), vì các sai số có thể lan truyền dọc theo chuỗi quản lý.

### 4. Kiến trúc Đàn hoặc Thị trường (Swarm or Market-Like Architectures)
Rời xa các hệ thống phân cấp cứng nhắc và định trước, kiến trúc đàn sử dụng sự điều phối mang tính động và phi tập trung hơn. Trong các hệ thống như vậy, một nhóm tác tử (*pool of agents*), có khả năng sở hữu các năng lực chồng lấn hoặc tiến hóa liên tục, có thể lắng nghe một thông điệp phát sóng nhiệm vụ (*task broadcast*). Sau đó, các tác tử có thể tham gia đấu thầu (*bid*) cho nhiệm vụ dựa trên khả năng tự đánh giá và khối lượng công việc hiện tại của chúng, hoặc tự động tiếp quản quyền kiểm soát khi mức độ tự tin của chúng trong việc giải quyết một bài toán con đạt mức cao.

Mô hình này có thể tạo ra sự chuyên môn hóa nổi lên (*emergent specialization*) và cân bằng tải mạnh mẽ, thích ứng một cách tự nhiên với các phân phối nhiệm vụ biến đổi. Tuy nhiên, nó đưa ra những thách thức đáng kể trong quản trị, khả năng dự đoán, và việc đảm bảo chất lượng nhất quán, vì các tương tác giữa các tác tử ít mang tính mệnh lệnh áp đặt hơn mà mang tính nổi sinh (*emergent*) nhiều hơn.

---

Sự tiến triển từ các tác tử nguyên khối sang các đội ngũ được điều phối này đại diện cho một bước trưởng thành căn bản trong kiến trúc phần mềm AI. Nó thay thế mô hình mẫu về một trí thông minh đơn độc, toàn năng (*solitary, omni-capable intelligence*) bằng một mô hình kỹ thuật - xã hội (*socio-technical model*) về giải quyết vấn đề có tính cộng tác. Việc lựa chọn cấu trúc liên kết không chỉ là một chi tiết triển khai mà là một **quyết định kiến trúc cốt lõi** đánh đổi giữa khả năng kiểm soát (*control*) và tính nổi sinh (*emergence*), giữa hiệu quả (*efficiency*) và độ vững chắc (*robustness*), giữa tính đơn giản (*simplicity*) và khả năng mở rộng (*scalability*).

Khi các hệ thống này tiếp tục tiến hóa, bản thân các cơ chế điều phối — các giao thức giao tiếp, thương lượng, và cùng lập kế hoạch (*joint planning*) — trở thành chất nền quan trọng cho trí thông minh tác tử nâng cao, đánh dấu sự chuyển đổi từ các chuỗi *prompt–response* đơn giản sang các hệ thống thực sự định hướng mục tiêu ở quy mô tổ chức (*organizational-scale systems*).

---

### Bảng 1: Các Chế độ Lỗi hỏng của Cấu trúc Liên kết Đa tác tử, Nguyên nhân Gốc rễ, Mẫu Giảm thiểu và Tín hiệu Phát hiện (Multi-Agent Topology Failure Modes, Root Causes, Mitigation Patterns, and Detection Signals)

| Cấu trúc Liên kết (*Topology*) | Chế độ Lỗi hỏng (*Failure Mode*) | Nguyên nhân Gốc rễ (*Root Cause*) | Mẫu Giảm thiểu (*Mitigation Pattern*) | Tín hiệu Phát hiện (*Detection Signal*) |
| :--- | :--- | :--- | :--- | :--- |
| **Orchestrator–Worker** | Thất bại âm thầm của công nhân (*Silent worker failure*) | Công nhân thất bại nhưng không báo cáo trạng thái; bộ điều phối giả định vẫn đang tiến triển | Nhịp tim (*Heartbeats*) + phản hồi rõ ràng ACK/NACK | Thiếu vắng nhịp tim; hết thời gian nhiệm vụ (*task timeout*) mà không có nhật ký lỗi |
| **Orchestrator–Worker** | Không khớp năng lực (*Capability mismatch*) | Nhiệm vụ vượt quá phạm vi công cụ/hàm của công nhân | Sổ đăng ký năng lực ngữ nghĩa (*Semantic capability registry*) + xác thực thời gian chạy | Lỗi công cụ lặp đi lặp lại; gia tăng đột biến tỷ lệ từ chối của công nhân |
| **Router–Solver** | Định tuyến sai (*Misrouting*) | Bộ phân loại thiếu các đặc trưng phân biệt cho sự chuyên môn hóa của bộ giải quyết | Định tuyến theo nhóm (*Ensemble routing*) kèm ngưỡng tin cậy + dự phòng con người can thiệp (*HITL fallback*) | Tỷ lệ từ chối của bộ giải quyết cao; các chu kỳ tái định tuyến lặp lại |
| **Router–Solver** | Quá tải dây chuyền bộ giải quyết (*Solver overload cascade*) | Lưu lượng tập trung vào bộ giải quyết hàng đầu gây ra bão hòa | Định tuyến nhận biết tải (*Load-aware routing*) kèm áp lực ngược (*backpressure*); hạn ngạch công suất | Cảnh báo độ sâu hàng đợi (*Queue depth alerts*); suy giảm độ trễ trên đường dẫn cụ thể |
| **Hierarchical Command Structures** | Xuyên tạc mệnh lệnh (*Command distortion*) | Ngữ nghĩa mục tiêu bị suy giảm qua các tầng (hiệu ứng "tam sao thất bản" - *'telephone effect'*) | Lan truyền ý định có chữ ký (*Signed intent propagation*); căn chỉnh định kỳ với mục tiêu gốc | Phân kỳ (*Divergence*): các hành động tại nút lá mâu thuẫn với các mục tiêu gốc |
| **Hierarchical Command Structures** | Bế tắc ủy quyền (*Delegation deadlock*) | Các phụ thuộc nhiệm vụ phụ vòng tròn giữa các tác tử đồng cấp (*circular subtask dependencies*) | Thực thi đồ thị có hướng không chu trình (*DAG enforcement*); thu hồi dựa trên thời gian chờ (*timeout-based revocation*) | Hết thời gian vòng lặp lập kế hoạch; bàn giao lặp lại liên tục mà không có tiến triển |
| **Swarm or Market-Like** | Hành vi bầy đàn (*Herding behavior*) | Hội tụ về các cực trị địa phương (*local optima*) triệt tiêu việc khám phá / tính đa dạng | Khuyến khích bảo toàn entropy (*Entropy-preserving incentives*); phạt tương quan nghịch | Vi phạm hệ số Gini (*Gini coefficient breach*); sụp đổ không gian giải pháp |
| **Swarm or Market-Like** | Thao túng chiến lược (*Strategic manipulation*) | Thông đồng giả mạo danh tính (tấn công Sybil) bóp méo tín hiệu thị trường / đàn | Đường cong liên kết (*Bonding curves*) kèm trừng phạt cổ phần (*stake slashing*); hàm trễ có thể xác minh (*VDF*) | Rút lại giá thầu bất thường; thổi phồng danh tiếng mà không có đóng góp thực tế |



## 6. Các Nền tảng Công nghiệp và Ngăn xếp Kiến trúc Mới nổi (Industry Platforms and Emerging Architectural Stacks)

Sự tiến hóa lý thuyết hướng tới các hệ thống đa tác tử được điều phối (*orchestrated multi-agent systems*) được phản ánh một cách cụ thể trong các lộ trình phát triển và mô tả công khai của các nền tảng công nghiệp mới nổi. Các hệ sinh thái thương mại và mã nguồn mở này đang tích cực định hình các "ngăn xếp" (*stacks*) thực tế cho AI mang tính tác tử (*agentic AI*), vượt ra khỏi các khung sườn (*frameworks*) biệt lập để hướng tới các môi trường tích hợp giải quyết toàn bộ vòng đời phát triển, triển khai, và quản trị. 

Chẳng hạn:
- **Kore.ai** đưa điều phối đa tác tử (*multi-agent orchestration*) lên hàng đầu như một năng lực cốt lõi một cách rõ ràng, nhấn mạnh sự cộng tác tác tử, các tác tử giám sát (*supervisor agents*), bộ nhớ, và các giao thức chính thức liên tác tử (*formal inter-agent protocols*) [2].
- Tương tự, **ZenML** viện dẫn các quy trình làm việc sẵn sàng cho sản xuất kết hợp "các đàn LangGraph" (*LangGraph swarms*), đặt các mẫu thiết kế tác tử vào trong các đường ống MLOps đã được thiết lập [4].
- Sự trưởng thành của các tầng trừu tượng điều phối này còn được minh chứng thêm qua việc đưa tin sâu rộng trên blog của **LangChain** về LangGraph và các mẫu ứng dụng đa tác tử, báo hiệu sự chuyển dịch từ thiết kế nguyên mẫu (*prototype*) sang thiết kế cấp sản xuất (*production-grade design*) [5].

Việc vận hành các kiến trúc này đòi hỏi các giao thức giao tiếp nghiêm ngặt và các cơ chế ngữ cảnh chia sẻ (*shared context mechanisms*). Các hệ thống đa tác tử yêu cầu các bản hợp đồng giao tiếp tường minh, đặt ra các câu hỏi thiết kế cốt lõi:
- Liệu lược đồ thông điệp (*message schemas*) nên là ngôn ngữ tự nhiên dạng tự do hay là các trường có cấu trúc (ví dụ: nhiệm vụ, bằng chứng, ràng buộc)?
- Liệu bộ nhớ chia sẻ được triển khai tốt nhất dưới dạng một bảng nháp toàn cục (*global scratchpad*) hay dưới dạng bộ nhớ riêng của từng tác tử kèm theo cơ chế chia sẻ có chọn lọc?
- Hơn nữa, các mô hình quyền hạn và leo thang (*authority and escalation models*) phải được xác định rõ — chỉ định cụ thể tác tử nào có thể cam kết các hành động ra bên ngoài và khi nào thì bắt buộc phải có sự phê duyệt của con người.

Trong thực tế, các hệ thống doanh nghiệp nghiêng về các giao thức liên tác tử có cấu trúc, có thể kiểm toán và có thể được xác thực tĩnh (*statically validated*). Nhu cầu thực thi hợp đồng này đang thúc đẩy việc áp dụng các **kiến trúc hướng cổng (*gateway-oriented architectures*)**, nơi các sổ đăng ký công cụ (*tool registries*), các máy chủ Giao thức Ngữ cảnh Mô hình (*Model Context Protocol - MCP*), và các tầng chính sách tập trung đóng vai trò như cơ chế thực thi cho các tương tác này [3].

Tuy nhiên, các kiến trúc đa tác tử mang lại các bề mặt lỗi hỏng mới mẻ và phức tạp mà các nền tảng bắt buộc phải giảm thiểu:
1. **Lỗi điều phối (*coordination failures*):** chẳng hạn như bế tắc (*deadlocks*), công việc dư thừa trùng lặp, hoặc các hành động xung đột trực tiếp;
2. **Khuếch đại lỗi (*error amplification*):** nơi ảo giác của một tác tử trở thành tiền đề không bị nghi ngờ cho một tác tử khác;
3. **Gọi công cụ dây chuyền (*cascading tool calls*):** tạo ra các đồ thị hành động vô hạn dẫn đến bùng nổ chi phí hoặc các sự cố vận hành;
4. **Vượt mặt chính sách thông qua ủy quyền (*policy bypass through delegation*):** trong đó một hành động bị hạn chế do một tác tử đề xuất lại được thực thi bởi một tác tử cộng tác có đặc quyền cao hơn.

Do đó, các nền tảng hiệu quả kết hợp các giải pháp giảm thiểu mang tính kiến trúc: thực thi chính sách tập trung cho tất cả các lệnh gọi công cụ, phân tách đặc quyền nghiêm ngặt giữa các vai trò tác tử, giới hạn ngân sách thực thi, cùng với việc truy vết chi tiết tới từng bước (*step-level tracing*) và nhật ký kiểm toán bất biến [2, 3, 5].

---

### Bảng 3: So sánh Cấp cao về các Điểm nhấn được Mô tả Công khai trên các Nền tảng và Hệ sinh thái AI mang tính Tác tử Tiêu biểu (High-Level Platform Comparison)
*(Các mục tóm tắt những gì tài liệu tham chiếu nhấn mạnh thay vì đánh chuẩn hiệu năng).*

| Nền tảng (*Platform*) | Định vị Chính (*Primary Framing*) | Các Điểm nhấn Đáng chú ý (*Notable Architectural Emphases*) | Hàm ý đối với Kiến trúc Tác tử (*Implications for Agent Architecture*) |
| :--- | :--- | :--- | :--- |
| **Salesforce (Agentforce)** [1] | Nền tảng CRM doanh nghiệp mang tính tác tử (*Agentic enterprise CRM platform*) | Hợp nhất ứng dụng, dữ liệu, tác tử; niềm tin & quản trị (*trust & governance*); giải pháp theo ngành; nhấn mạnh ROI | Tác tử như một giao diện cho các quy trình làm việc doanh nghiệp (*Agent as interface to enterprise workflows*); quản trị phải là hạng nhất (*first-class*); tích hợp sâu với các đối tượng kinh doanh và quy trình nghiệp vụ. |
| **Kore.ai (Agent Platform)** [2] | Nền tảng tác tử doanh nghiệp cho công việc/dịch vụ/quy trình (*Enterprise agent platform for work/service/process*) | Điều phối đa tác tử (*multi-agent orchestration*); tầng tìm kiếm & dữ liệu kèm bộ kết nối; no-code + pro-code; khả năng quan sát; bảo mật & quản trị (RBAC, nhật ký kiểm toán, rào chắn guardrails) | Phân tách mạnh mẽ giữa điều phối, kết nối dữ liệu, và quản trị (*Strong separation of orchestration, data connectivity, and governance*); ưu tiên các sổ đăng ký và quản trị chuẩn hóa. |
| **TrueFoundry** [3] | Triển khai tác tử + các cổng kết nối (*Agentic deployment + gateways*) | AI Gateway; các máy chủ MCP (*Model Context Protocol servers*); sổ đăng ký (*registries*); vòng đời prompt; truy vết (*tracing*); OpenTelemetry; triển khai tại chỗ on-prem/VPC; RBAC và ghi nhật ký kiểm toán bất biến | Kiến trúc "Ưu tiên Cổng" (*“Gateway-first” architecture*) xử lý lưu lượng tác tử như lưu lượng API được quản lý chặt chẽ; nhấn mạnh chủ quyền, cô lập, và khả năng kiểm toán. |
| **ZenML** [4] | Xương sống quy trình làm việc từ đường ống đến tác tử (*Workflow backbone from pipelines to agents*) | Điều phối đồ thị có hướng không chu trình hợp nhất (*Unified DAG orchestration - ML + agents*); đánh phiên bản tạo tác / môi trường; lưu bộ nhớ đệm (*caching*); trừu tượng hóa hạ tầng; quản trị và quản lý bí mật; tuân thủ SOC 2 / ISO | Định vị các tác tử như các quy trình làm việc có thể tái lập (*reproducible workflows*); đẩy các hệ thống tác tử hướng tới kỷ luật MLOps và gỡ lỗi dựa trên dòng dõi nguồn gốc dữ liệu (*lineage-driven debugging*). |
| **LangChain / LangSmith** [5] | Kỹ nghệ tác tử + gỡ lỗi (*Agent engineering + debugging*) | Các tác tử chuyên sâu (*deep agents*); quản lý ngữ cảnh; các mẫu dựng sẵn cho tác tử (*agent builder templates*); chuyển vết thực thi thành thông tin chi tiết (*traces-to-insights*); gỡ lỗi trong môi trường sản xuất | Củng cố khả năng quan sát (*observability*) như yếu tố trung tâm; phát triển tác tử trở thành kỹ nghệ lặp với cải tiến được thúc đẩy bởi các dấu vết thực thi (*trace-driven improvement*). |

---

Một góc nhìn so sánh từ các nền tảng được chọn lọc, tóm tắt trong Bảng 3, tiết lộ cách mà các hệ sinh thái khác nhau đang định hình ngăn xếp kiến trúc tác tử thông qua các trọng tâm riêng biệt của chúng:
- **Salesforce Agentforce [1]** định khung tác tử như giao diện chính cho các quy trình CRM doanh nghiệp, ưu tiên tích hợp sâu với các đối tượng nghiệp vụ song hành cùng quản trị vững chắc.
- **Kore.ai [2]** cấu trúc nền tảng xung quanh sự tách biệt rõ ràng giữa điều phối đa tác tử, tầng kết nối dữ liệu hợp nhất, và quản trị hành chính.
- **TrueFoundry [3]** ủng hộ kiến trúc "gateway-first", xử lý lưu lượng liên tác tử và tác tử - công cụ như lưu lượng API được quản lý để thực thi chủ quyền dữ liệu, sự cô lập và tính kiểm toán.
- **ZenML [4]** định vị tác tử như các quy trình làm việc có phiên bản, có thể tái lập bên trong hệ thống điều phối DAG hợp nhất, mở rộng kỷ luật MLOps sang các hệ thống tác tử.
- **LangChain và LangSmith [5]** tập trung vào trải nghiệm nhà phát triển, củng cố khả năng quan sát sâu và gỡ lỗi dựa trên *traces* như trọng tâm của kỹ nghệ tác tử.

Hai chủ đề kiến trúc bao trùm được kết tinh từ bối cảnh này:
1. **Quản trị xuyên suốt (*Cross-cutting governance*) không còn là điều tùy chọn:** Trên khắp các nền tảng doanh nghiệp, RBAC, nhật ký kiểm toán bất biến, và thực thi chính sách là các mối quan tâm hạng nhất, chỉ ra rằng các hệ thống tác tử đang được tích hợp trực tiếp vào các quy trình kinh doanh chịu sự điều chỉnh của quy định chứ không còn bị giới hạn trong các hộp cát thử nghiệm [2, 3, 1].
2. **Khả năng quan sát và tính tái lập (*Observability and reproducibility*) đang hội tụ thành các yêu cầu cốt lõi:** Sự nhấn mạnh vào truy vết toàn diện (LangChain/LangSmith, TrueFoundry) và dòng dõi quy trình làm việc cùng quản lý phiên bản tạo tác (ZenML) giải quyết một nhu cầu chung: giải thích hành vi hệ thống, tái tạo kết quả, và tạo điều kiện cho cải tiến lặp an toàn [5, 3, 4]. Cùng nhau, các chủ đề này khẳng định rằng sự tiến hóa của kiến trúc tác tử liên quan nhiều đến việc thiết lập kỹ nghệ phần mềm và sự nghiêm ngặt trong vận hành tương đương với việc nâng cao năng lực nhận thức.

```
+---------------------------------------------------------------------------------------------------+
|               HÌNH 6: SỰ HỘI TỤ CỦA NGĂN XẾP NỀN TẢNG AI CÔNG NGHIỆP HIỆN ĐẠI                     |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  ┌──────────────────────────────────────────────┐    ┌──────────────────────────────────────────┐ |
|  │          SALESFORCE AGENTFORCE               │    │                 KORE.AI                  │ |
|  │  Agent as Interface (Tác tử như Giao diện)   │    │  Separation of Concerns (Phân tách Quan) │ |
|  │  Tích hợp sâu với các đối tượng kinh doanh   │    │  Tách bạch các tầng: Điều phối, Dữ liệu, │ |
|  │  và quy trình làm việc CRM doanh nghiệp.     │    │  và Quản trị Hành chính.                 │ |
|  └──────────────────────┬───────────────────────┘    └─────────────────────┬────────────────────┘ |
|                         │                                                  │                      |
|                         │              ┌──────────────────┐                │                      |
|                         └─────────────►│   COMMON CORE:   │◄───────────────┘                      |
|                                        │    Gateways,     │                                       |
|                                        │   Registries,    │                                       |
|                         ┌─────────────►│Policy Enforcement│◄───────────────┐                      |
|                         │              └──────────────────┘                │                      |
|                         │                                                  │                      |
|  ┌──────────────────────┴───────────────────────┐    ┌─────────────────────┴────────────────────┐ |
|  │               TRUEFOUNDRY                    │    │                  ZenML                   │ |
|  │  Gateway-First (Ưu tiên Cổng kết nối)        │    │  MLOps Discipline (Kỷ luật MLOps)        │ |
|  │  Xử lý lưu lượng tác tử như API được quản lý │    │  Tác tử như các quy trình công việc      │ |
|  │  nghiêm ngặt (Chủ quyền & Sự cô lập).        │    │  có thể tái lập, đánh phiên bản (DAGs).  │ |
|  └──────────────────────────────────────────────┘    └──────────────────────────────────────────┘ |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```
*Hình 6: Sự hội tụ hướng tới một ngăn xếp nền tảng AI chuẩn hóa xung quanh điều phối (orchestration) và quản trị (governance) làm các tầng cốt lõi.*

Hình 6 minh họa sự hội tụ của ngành công nghiệp hướng tới một ngăn xếp nền tảng AI chuẩn hóa được xây dựng xung quanh điều phối và quản trị như các tầng cốt lõi. Sự hội tụ này được thúc đẩy bởi một số chiến lược nền tảng then chốt, bao gồm việc sử dụng tác tử làm giao diện tương tác chính, phân tách rõ ràng các mối quan tâm trên các tầng hệ thống, cách tiếp cận kiến trúc ưu tiên cổng kết nối (*gateway-first*), và việc áp dụng thực hành MLOps có kỷ luật để đảm bảo khả năng mở rộng, độ tin cậy, và quản trị vòng đời.



## 7. Các Thách thức Mở và Hướng Nghiên cứu (Open Challenges and Research Directions)

Sự chuyển dịch từ các giao diện *prompt–response* sang các hệ thống mang tính tác tử định hướng mục tiêu (*goal-directed, agentic systems*) đại diện cho một sự thay đổi căn bản trong kiến trúc phần mềm, mang lại những thách thức sâu sắc vượt ra ngoài phạm vi công cụ đơn thuần. Mặc dù các nền tảng hiện tại cung cấp giàn giáo (*scaffolding*) thiết yếu cho việc điều phối, tích hợp công cụ, và bộ nhớ, một số lĩnh vực trọng yếu vẫn chưa được giải quyết. Những thách thức này không chỉ là các cải tiến gia tăng mang tính cục bộ mà có thể đòi hỏi các tầng trừu tượng mới và các nghiên cứu nền tảng để đảm bảo việc triển khai các tác tử tự chủ trong các môi trường thực tế một cách vững chắc, an toàn, và có khả năng mở rộng.

### 1. Tính có thể kiểm chứng và các Đảm bảo hình thức (Verifiability and Formal Guarantees)
Trở ngại hàng đầu nằm ở việc đạt được tính có thể kiểm chứng (*verifiability*) và các đảm bảo hình thức (*formal guarantees*) đối với hành vi của tác tử. Tính ngẫu nhiên cố hữu (*inherent stochasticity*) và các quy trình suy luận mờ đục (*opaque reasoning processes*) của các mô hình ngôn ngữ lớn (LLM) khiến việc xác minh tính chính xác, an toàn, hoặc tính tuân thủ của các quyết định tác tử theo kiểu hậu kiểm (*post-hoc*) trở nên khó khăn. 

Các hướng nghiên cứu đầy hứa hẹn nhằm mục đích áp đặt cấu trúc lên sự không chắc chắn này bao gồm:
- **Phát triển các kế hoạch hành động có định kiểu (*typed action plans*):** ràng buộc tác tử sinh ra các chuỗi có thể thực thi tuân theo một lược đồ được định nghĩa trước, cho phép tự động xác thực tính nhất quán của kế hoạch và các điều kiện tiên quyết an toàn (*safety preconditions*).
- **Hành động mang bằng chứng (*Proof-carrying actions*):** yêu cầu tác tử đính kèm bằng chứng có thể hành động — chẳng hạn như các trích dẫn truy xuất, đầu ra của công cụ, hoặc điểm tin cậy (*confidence scores*) — vào các quyết định quan trọng của chúng, tạo ra một đường mòn kiểm toán (*audit trail*).
- **Khuôn khổ kiểm thử mức độ tuân thủ (*Conformance testing frameworks*):** bao gồm các bộ kiểm thử hồi quy trên các đồ thị công cụ phức tạp và quy trình công việc đa tác tử, là thiết yếu để duy trì độ tin cậy khi hệ thống tiến hóa.

Trong bối cảnh doanh nghiệp, các phương pháp kỹ thuật này phải kết nối liền mạch với các cơ chế kiểm toán, tuân thủ và quản trị đã được thiết lập — một yêu cầu được nhấn mạnh bởi các thiết kế nền tảng thương mại [2, 3].

### 2. Khả năng tương tác và An toàn khi Hợp thành (Interoperability and Compositional Safety)
Liên quan chặt chẽ là thách thức về khả năng tương tác (*interoperability*) và an toàn khi hợp thành (*compositional safety*). Khi các hệ sinh thái tác tử phát triển, một nhu cầu kiến trúc lặp đi lặp lại là cần có các giao thức chuẩn hóa cho giao tiếp giữa tác tử với công cụ và giữa tác tử với tác tử, hoàn chỉnh với việc xác thực lược đồ và kiểm soát chính sách. Các chuyển động của ngành công nghiệp, chẳng hạn như việc áp dụng Giao thức Ngữ cảnh Mô hình (*Model Context Protocol - MCP*) để khám phá công cụ và phát triển các kênh giao tiếp liên tác tử, báo hiệu một sự thúc đẩy hướng tới các tiêu chuẩn chung [3, 2]. 

Điều này đặt ra một câu hỏi nghiên cứu nền tảng: **Đâu là bản hợp đồng tối thiểu, ổn định — bao gồm các năng lực, quyền hạn, và ngữ nghĩa lỗi — cho phép sự hợp thành an toàn và hiệu quả của các tác tử và công cụ không đồng nhất (*heterogeneous agents and tools*) vượt qua ranh giới tổ chức?** Một tầm nhìn tương tự như *"REST cho các tác tử"* đang xuất hiện, nhưng đó là một tầm nhìn phải giải quyết các thách thức về sự tin cậy, khám phá động, và thương lượng vượt xa các thách thức của các dịch vụ web truyền thống.

### 3. An toàn và Suy giảm An toàn khi Thất bại (Safety and Graceful Degradation)
Quyền tự chủ gia tăng trao cho các tác tử đòi hỏi các khuôn khổ nghiêm ngặt về an toàn và khả năng suy giảm an toàn khi thất bại (*graceful degradation*). Các hệ thống tác tử phải được thiết kế để thất bại một cách an toàn (*fail safely*), tránh các thất bại thảm khốc khi đối mặt với sự mới lạ, tính mơ hồ, hoặc lỗi. Các mẫu thiết kế kiến trúc then chốt bao gồm:
- Thiết lập các **đường dẫn leo thang rõ ràng (*escalation paths*)** để định tuyến các trường hợp không chắc chắn sang sự giám sát của con người hoặc các quy trình làm việc tất định dự phòng;
- Triển khai **quyền tự chủ có ngân sách (*budgeted autonomy*)** — thực thi các hạn ngạch nghiêm ngặt về token, thời gian suy luận, số lần gọi công cụ, hoặc chi phí tiền tệ — là tối quan trọng để giới hạn rủi ro vận hành và mức độ phơi nhiễm tài chính;
- Mô hình **thực thi ưu tiên hộp cát (*sandbox-first execution paradigm*)**, nơi các tác tử có thể mô phỏng hoặc đánh giá các tác dụng phụ tiềm tàng của hành động trong một môi trường được kiểm soát trước khi chính thức cam kết thực hiện.

Các nguyên tắc này hoàn toàn phù hợp với trọng tâm của doanh nghiệp vào sự cộng tác có quản trị, như được thấy trong các nền tảng nhấn mạnh các kiểm soát có con người tham gia vào vòng lặp (*human-in-the-loop*) và quản trị hành chính thay vì tự động hóa không bị kiềm tỏa [1, 2].

### 4. Quản trị Dữ liệu, Quyền riêng tư và Chủ quyền (Data Governance, Privacy, and Sovereignty)
Các khả năng được mở rộng cho bộ nhớ bền vững và quyền truy cập công cụ sâu rộng làm gia tăng các mối lo ngại về quản trị dữ liệu, quyền riêng tư, và chủ quyền. Các mẫu kiến trúc cho hệ thống tác tử phải nhúng các nguyên tắc **thiết kế chú trọng quyền riêng tư ngay từ đầu (*privacy-by-design*)**:
- Các chiến lược giảm thiểu dữ liệu cá nhân được lưu trữ, ưu tiên việc giữ lại các tham chiếu băm (*hashed references*), các tóm tắt ẩn danh, hoặc ngữ cảnh tạm thời hơn là các thông tin nhạy cảm thô;
- **Các cơ chế truy xuất nhận biết chính sách (*policy-aware retrieval mechanisms*)** phải đảm bảo rằng bộ nhớ của tác tử và quyền truy cập công cụ được lọc động dựa trên quyền hạn của người dùng hiện tại và mục đích cụ thể của nhiệm vụ;
- Đối với các ngành được quản lý chặt chẽ, hỗ trợ kiến trúc cho việc triển khai tại chỗ (*on-premises*) hoặc trong Đám mây Riêng Ảo (VPC) là điều không thể thương lượng, đảm bảo rằng dữ liệu không bao giờ rời khỏi miền được kiểm soát của khách hàng.

Cách tiếp cận **chủ quyền theo thiết kế (*sovereignty-by-design*)** này được đưa lên hàng đầu một cách tường minh bởi các nền tảng nhắm mục tiêu vào các ngành chịu sự quản lý và được củng cố như một mối quan tâm hàng đầu của giới lãnh đạo trong việc ứng dụng cấp doanh nghiệp [3, 4, 6].

### 5. Giao thoa với Tác tử Hiện thân và Hệ thống Thực - Ảo (Embodied and Cyber-Physical Agents)
Cuối cùng, sự tiến hóa của kiến trúc tác tử chắc chắn sẽ giao thoa với thế giới vật lý thông qua các tác tử hiện thân (*embodied agents*) và hệ thống thực - ảo (*cyber-physical systems*). Mặc dù bài báo này tập trung vào các tác tử phần mềm, các nguyên tắc kiến trúc phải mở rộng sang robot học và các hệ thống nơi các tác tử kích hoạt sự thay đổi trong môi trường thực. Nghiên cứu trong các lĩnh vực lân cận, chẳng hạn như sử dụng LLM để mô phỏng bệnh nhân ảo hoặc lập kế hoạch nhiệm vụ robot, làm nổi bật sự hội tụ này [7]. 

Trong các bối cảnh thực - ảo, mô hình kiến trúc phải lai ghép: các tầng an toàn phản ứng mức thấp (*low-level, reactive safety layers*) triển khai các ràng buộc cứng (bắt nguồn từ lý thuyết điều khiển kinh điển và các hệ thống lai) phải cùng tồn tại với, và có quyền ghi đè (*override*), các bộ lập kế hoạch cân nhắc mức cao (*high-level deliberative planners*) [9, 8]. Điều này đưa lĩnh vực quay trở lại các câu hỏi kinh điển trong kiến trúc AI nhưng với các thành phần suy luận lấy nơ-ron làm trung tâm mới, đòi hỏi các khuôn khổ mới mẻ cho việc xác minh, hiệu năng thời gian thực, và đảm bảo an toàn bắc cầu giữa các miền biểu tượng rời rạc và các miền vật lý liên tục.

---

## 8. Các Mối đe dọa đối với Tính hợp lệ (Threats to Validity)

Là một khảo sát phân tích tập trung vào sự tiến hóa kiến trúc của AI mang tính tác tử, bài báo này chịu một số hạn chế về phương pháp luận và bối cảnh cần được thừa nhận để xác định đúng ranh giới các kết luận và định hướng cho các nghiên cứu trong tương lai.

- **Thiên lệch tài liệu xám (*Grey Literature Bias*):** Phân tích này kết hợp chặt chẽ các bài blog kỹ thuật, báo cáo chuyên đề (*white papers*), và tài liệu nền tảng từ các nhà cung cấp và công ty tư vấn hàng đầu. Về bản chất, các nguồn này có xu hướng nhấn mạnh các khả năng, thế mạnh, và tầm nhìn chiến lược trong khi bỏ sót các hạn chế, thất bại, và các trở ngại triển khai. Để giảm thiểu sự thiên lệch này, phương pháp của chúng tôi giới hạn các khẳng định ở những tuyên bố mô tả rõ ràng, hiển ngôn được tìm thấy trong các tài liệu này liên quan đến thiết kế hệ thống, giao diện thành phần, và các ưu tiên đã công bố. Chúng tôi có ý thức không sử dụng các nguồn này làm bằng chứng về hiệu quả hay hiệu năng, mà coi chúng như các tạo tác phản ánh xu hướng kiến trúc toàn ngành, các mô hình mẫu đồng thuận, và các ưu tiên thiết kế mới nổi. Cách tiếp cận này cho phép chúng tôi lập bản đồ bối cảnh khái niệm như được trình bày bởi các nhà xây dựng hệ sinh thái then chốt, đồng thời thừa nhận rằng một bức tranh hoàn chỉnh đòi hỏi dữ liệu bổ sung từ nghiên cứu được bình duyệt đồng cấp (*peer-reviewed research*) và các nghiên cứu thực nghiệm độc lập.
- **Sự phát triển cực kỳ nhanh chóng của công cụ và thuật ngữ (*Rapid Evolution of Tooling and Terminology*):** Các khung sườn mới, môi trường thực thi tác tử (*agent runtimes*), và các nền tảng độc quyền được công bố liên tục, thường đi kèm với các tập tính năng dịch chuyển và các định nghĩa chồng chéo về các khái niệm cốt lõi như "bộ nhớ" (*memory*), "công cụ" (*tools*), hoặc "điều phối" (*orchestration*). Mặc dù tính động lực này đặt ra thách thức cho bất kỳ phân tích đương đại nào, chúng tôi khẳng định rằng các **nguyên thủy kiến trúc nền tảng** được thảo luận trong bài báo này — chẳng hạn như vòng lặp điều khiển cho suy luận và hành động, các cơ chế cho bộ nhớ có trạng thái, các giao diện cho trừu tượng hóa công cụ, và các tầng quản trị — thể hiện tính ổn định tương đối. Các thành phần này đại diện cho các yêu cầu tính toán căn bản để xây dựng các hệ thống định hướng mục tiêu, bất kể sự hiện thực hóa cụ thể của chúng trong bất kỳ thư viện hay sản phẩm nào. Do đó, trong khi các API và các sản phẩm thương mại cụ thể chắc chắn sẽ thay đổi, khuôn khổ khái niệm về kiến trúc tác tử được trình bày ở đây nhằm mục đích cung cấp một lăng kính bền vững để thấu hiểu các phát triển trong tương lai.
- **Ranh giới phạm vi phân tích (*Deliberately Constrained Scope*):** Cuối cùng, phạm vi của bài báo này được kiềm chế có chủ đích. Nó tập trung chủ yếu vào kiến trúc phần mềm cho các tác tử kỹ thuật số hoạt động trong các hệ thống thông tin, loại trừ tường minh miền phức tạp của robot học hiện thân và các hệ thống thực - ảo, ngoại trừ một cuộc thảo luận ngắn về các giao điểm tương lai. Hơn nữa, công trình này là một **khảo sát và tổng hợp phân tích, không phải là một đánh giá thực nghiệm**. Nó không trình bày các bài đo chuẩn hiệu năng (*performance benchmarks*), số liệu hiệu quả so sánh, hoặc kết quả xác minh hình thức cho các kiến trúc được mô tả. Hạn chế phạm vi này có nghĩa là bài báo xác định những gì đang được xây dựng và cách nó được cấu trúc về mặt khái niệm, nhưng không khẳng định mức độ hiệu quả của các mẫu thiết kế khác nhau trong các điều kiện cụ thể. Nghiên cứu trong tương lai là thiết yếu để bổ sung cho bản đồ kiến trúc này bằng các thử nghiệm có kiểm soát, nghiêm ngặt nhằm đo lường tính vững chắc, khả năng mở rộng, và tính an toàn, cũng như các phân tích theo chiều dọc về các sự cố triển khai trong thế giới thực. Nghiên cứu thực nghiệm như vậy sẽ rất quan trọng để chuyển đổi bối cảnh hiện tại của các mẫu kiến trúc đầy hứa hẹn thành một chuyên ngành kỹ nghệ trưởng thành với các đánh đổi đã biết và các thực hành tốt nhất được xác thực.

---

## 9. Kết luận (Conclusion)

Phân tích này về bức tranh toàn cảnh AI mang tính tác tử cho thấy rằng sự chuyển dịch từ các giao diện *prompt–response* đơn giản sang các hệ thống tự chủ đại diện cho một **sự tái tổ chức căn bản của kiến trúc phần mềm**, một sự chuyển đổi vượt xa những cải tiến gia tăng trong kỹ nghệ tạo câu nhắc (*prompt engineering*). Về cốt lõi, sự tiến hóa này đánh dấu sự xuất hiện của một mô hình mẫu kiến trúc mới: **việc xây dựng các vòng lặp điều khiển định hướng mục tiêu (*goal-directed control loops*) trong đó các mô hình ngôn ngữ lớn hoạt động như các nhân nhận thức (*cognitive kernels*) cho việc lập kế hoạch và suy luận mức cao.** Các nhân này sau đó được nhúng một cách có hệ thống vào bên trong một chòm sao hỗ trợ gồm các thành phần chuyên biệt — các hệ thống bộ nhớ phân đoạn và bền vững, các tầng trừu tượng hóa công cụ, các bộ máy thực thi chính sách, và các khuôn khổ khả năng quan sát toàn diện — mang lại cho chúng khả năng hành động một cách đáng tin cậy và có trách nhiệm giải trình theo thời gian.

Sự hiện thực hóa hiện đại này bắt nguồn sâu xa từ các tầng trừu tượng trường tồn của lý thuyết tác tử kinh điển, vốn nhấn mạnh tính tối cao của trạng thái, ý định, sự cân nhắc, và tính phản ứng (*state, intent, deliberation, and reactivity*). Các kiến trúc đương đại hiện thực hóa các khái niệm này một cách tường minh, chuyển dịch chúng thành các thành phần cho quản lý trạng thái (thông qua cơ sở dữ liệu vector và bộ nhớ đệm phiên), phân rã ý định (thông qua các mô-đun lập kế hoạch), và giám sát phản ứng (thông qua các mô hình rào chắn guardrails và bộ ngắt mạch circuit breakers). Bước tiến quan trọng nằm ở cách mà thực tiễn doanh nghiệp hiện đại đang **tôi luyện (*hardening*)** các cấu trúc lý thuyết này:
- **Quản trị ngay từ khâu thiết kế (*Governance-by-design*)** hiện là một yêu cầu không thể thương lượng, biểu hiện qua các tính năng kiến trúc như Kiểm soát Truy cập Dựa trên Vai trò (RBAC) chi tiết cho các công cụ và bộ nhớ, nhật ký kiểm toán bất biến cho khả năng truy xuất nguồn gốc đầy đủ, và các móc chính sách bản địa để xác thực tuân thủ.
- Đồng thời, mệnh lệnh về **tính tái lập quy trình làm việc (*workflow reproducibility*)** đang thúc đẩy việc tích hợp các thực hành kỹ nghệ phần mềm tốt nhất, bao gồm quản lý phiên bản cho *prompts*, đặc tả công cụ, và cấu hình tác tử, cũng như việc sử dụng các môi trường được đóng gói trong bộ chứa (*containerized environments*) để đảm bảo thực thi nhất quán.

Một đánh giá về các nền tảng và khung sườn đương đại chỉ ra một sự **hội tụ đáng chú ý trong các bản thiết kế kiến trúc (*architectural blueprints*)**. Mặc dù các triển khai có sự khác nhau, một mẫu chung đã kết tinh xung quanh các dịch vụ hạ tầng cốt lõi:
- Các sổ đăng ký tập trung cho các tác tử, công cụ, và kỹ năng;
- Các cổng API (*API gateways*) quản lý xác thực, định tuyến, và giới hạn tần suất;
- Các lược đồ chuẩn hóa (ví dụ: OpenAPI, MCP) cho khả năng tương tác của công cụ;
- Và các bộ máy điều phối tinh vi có khả năng quản lý các quy trình làm việc đa tác tử phân cấp phức tạp — tất cả đều hoạt động dưới một chiếc ô thống nhất gồm các kiểm soát có thể kiểm toán [2, 3, 4, 5, 1].

Sự hội tụ này báo hiệu sự trưởng thành của AI mang tính tác tử từ một nguyên mẫu nghiên cứu thành một hạng mục phần mềm doanh nghiệp đích thực, đòi hỏi và đang phát triển ngăn xếp chuyên dụng của riêng nó.

Nhìn về tương lai, giai đoạn tiến hóa tiếp theo sẽ được định nghĩa bởi thách thức về **khả năng hợp thành an toàn (*safe composability*)**. Khi các hệ thống tác tử gia tăng nhanh chóng và phải tương tác qua các ranh giới tổ chức — tương tự như các vi dịch vụ trong một hệ thống phân tán — nhu cầu về các giao thức có khả năng tương tác và các kỹ thuật xác minh mạnh mẽ hơn trở nên tối quan trọng. Quỹ đạo tương lai chỉ ra sự phát triển của một **"lưới dịch vụ cho các tác tử" (*service mesh for agents*)**, bao gồm các bản hợp đồng tiêu chuẩn cho việc khám phá năng lực, thương lượng niềm tin, và trao đổi thông tin xác thực có thể kiểm chứng. Hơn nữa, việc đảm bảo độ tin cậy ở quy mô lớn sẽ đòi hỏi những bước tiến trong các phương pháp xác minh hình thức và xác suất để cung cấp các đảm bảo cho hành vi của tác tử, vượt ra ngoài việc giám sát thụ động để hướng tới các ràng buộc có thể chứng minh được. 

Sự tương đồng lịch sử là rất rõ ràng: giống như cuộc cách mạng dịch vụ web đã được thúc đẩy bởi các tiêu chuẩn giao diện chung (SOAP, REST) và quản trị phân tầng (quản lý API), việc triển khai rộng rãi và đáng tin cậy các hệ thống tác tử tự chủ phụ thuộc vào khả năng của cộng đồng trong việc thiết lập các nền tảng tương đương cho sự hợp thành an toàn, có thể mở rộng, và minh bạch. Do đó, sự tiến hóa từ *prompt–response* sang các hệ thống định hướng mục tiêu không đơn thuần là một sự thay đổi kỹ thuật, mà là **sự khởi đầu của một phân ngành kỹ nghệ phần mềm mới (*genesis of a new software engineering sub-discipline*)**, một phân ngành phải hòa quyện liền mạch những hiểu biết sâu sắc từ trí tuệ nhân tạo, các hệ thống phân tán, và thiết kế quan trọng về mặt an toàn (*safety-critical design*).

---

## Tài liệu Tham khảo (References)

[1] Salesforce. Salesforce: The #1 AI CRM — Agentforce transforms Sales, Service, Commerce, Marketing, IT, and more. Website (accessed via provided content), 2026. https://www.salesforce.com/?bc=SOC  
[2] Kore.ai. Enterprise AI Agents for Work, Service & Process — Kore.ai Agent Platform. Website (accessed via provided content), 2026. https://www.kore.ai/  
[3] TrueFoundry. Enterprise-Ready Agentic AI — AI Gateway & Agentic Deployment Platform. Website (accessed via provided content), 2025. https://www.truefoundry.com/  
[4] ZenML. ZenML — One AI Platform: From Pipelines to Agents. Website (accessed via provided content), 2025. https://www.zenml.io/  
[5] LangChain. LangChain Blog. Website (accessed via provided content), 2026. https://www.blog.langchain.com/  
[6] Bain & Company. Global Management Consulting Firm — Bain & Company (AI sovereignty and enterprise AI themes). Website (accessed via provided content), 2026. https://www.bain.com/  
[7] Carnegie Mellon University Robotics Institute. Robotics Institute, Carnegie Mellon University: Robotics Education and Research Leader (events and news). Website (accessed via provided content), 2026. https://www.ri.cmu.edu/  
[8] Stuart Russell and Peter Norvig. Artificial Intelligence: A Modern Approach. Pearson, 4th edition, 2020.  
[9] Rodney A. Brooks. A robust layered control system for a mobile robot. IEEE Journal of Robotics and Automation, 2(1):14–23, 1986.  
[10] Michael E. Bratman. Intention, Plans, and Practical Reason. Harvard University Press, 1987.  
[11] Anand S. Rao and Michael P. Georgeff. BDI agents: From theory to practice. In Proceedings of the First International Conference on Multiagent Systems (ICMAS), 1995.  
[12] Michael Wooldridge. An Introduction to MultiAgent Systems. John Wiley & Sons, 2002.  
[13] Patrick Lewis, Ethan Perez, Aleksandra Piktus, et al. Retrieval-augmented generation for knowledge-intensive NLP tasks. In Advances in Neural Information Processing Systems (NeurIPS), 2020.  
[14] Shunyu Yao, Jeffrey Zhao, Dian Yu, et al. ReAct: Synergizing reasoning and acting in language models. In International Conference on Learning Representations (ICLR), 2023.  
[15] Timo Schick, Jane Dwivedi-Yu, Roberto Dessì, et al. Toolformer: Language models can teach themselves to use tools. arXiv preprint arXiv:2302.04761, 2023.  
[16] Noah Shinn, Federico Cassano, Ashwin Gopinath, et al. Reflexion: Language agents with verbal reinforcement learning. arXiv preprint arXiv:2303.11366, 2023.  
[17] M. Abou Ali, F. Dornaika, and J. Charafeddine. Agentic AI: A Comprehensive Survey of Architectures, Applications, and Future Directions. Artificial Intelligence Review, vol. 59, no. 1, p. 11, 2025.  
[18] S. Murugesan. The rise of agentic AI: implications, concerns, and the path forward. IEEE Intelligent Systems, vol. 40, no. 2, pp. 8–14, 2025.  
[19] Dwivedi, Y. K., Helal, M. Y. I., Elgendy, I. A., Alahmad, R., Walton, P., Suh, A., Singh, V., and Jeon, I. Agentic AI Systems: What It Is and Isn’t. Global Business and Organizational Excellence, 2025.  
[20] Bandi, A., Kongari, B., Naguru, R., Pasnoor, S., and Vilipala, S. V. The rise of agentic AI: A review of definitions, frameworks, architectures, applications, evaluation metrics, and challenges. Future Internet, vol. 17, no. 9, p. 404, 2025.  
[21] Pati, A. K. Agentic AI: A Comprehensive Survey of Technologies, Applications, and Societal Implications. IEEE Access, 2025.  
[22] Derouiche, H., Brahmi, Z., and Mazeni, H. Agentic AI frameworks: Architectures, protocols, and design challenges. arXiv preprint arXiv:2508.10146, 2025.  
[23] A. Stavrou, J. Lin, and R. Zhou (eds.). Generative and Agentic AI Reliability: Architectures, Challenges, and Trust for Autonomous Systems. Studies in Computational Intelligence, Springer, Cham, 1st ed., 2026.  
[24] M. Á. González-Santamarta, F. J. Rodríguez-Lera, and V. Matellán-Olivera. Cognitive Architectures in Autonomous Robotics: A Systematic Review of Behavior Generation Approaches and Evaluation Strategies. IEEE Access, vol. 13, pp. 191619-191644, 2025.  
[25] A. Grosvenor, A. Zemlyansky, A. Wahab, K. Bohachov, A. Dogan, and D. Deighan. Hybrid intelligence systems for reliable automation: Advancing knowledge work and autonomous operations with scalable AI architectures. Frontiers in Robotics and AI, vol. 12, Art. no. 1566623, 2025.  
[26] L. Frering, G. Steinbauer-Wagner, and A. Holzinger. Integrating Belief-Desire-Intention agents with large language models for reliable human-robot interaction and explainable Artificial Intelligence. Engineering Applications of Artificial Intelligence, vol. 141, Art. no. 109771, 2025.  
[27] M. Mohammadi, Y. Li, J. Lo, and W. Yip. Evaluation and benchmarking of LLM agents: A survey. In Proc. 31st ACM SIGKDD Conf. Knowledge Discovery and Data Mining, Vol. 2, pp. 6129–6139, 2025.  
[28] W. Xu, C. Huang, S. Gao, and S. Shang. LLM-Based Agents for Tool Learning: A Survey. Data Science and Engineering, 2025, pp. 1–31.  
[29] Y. Ren, L. Chen, D. Li, X. Wang, Z. Wu, Y. Miao, and Y. Bai. Transcending cost-quality tradeoff in agent serving via session-awareness. In Proc. 39th Annu. Conf. Neural Information Processing Systems (NeurIPS), 2025.  
[30] K.-T. Tran, D. Dao, M.-D. Nguyen, Q.-V. Pham, B. O’Sullivan, and H. D. Nguyen. Multi-agent collaboration mechanisms: A survey of LLMs. arXiv preprint arXiv:2501.06322, 2025.  
[31] M. A. Sami, Z. Zhang, M. Waseem, K.-K. Kemell, Z. Rasheed, T. Herda, and P. Abrahamsson. Bridging humans and LLMs: Investigating human-AI collaboration in multi-agent requirements analysis for organizational AI adoption. e-Informatica Software Engineering Journal, vol. 20, no. 1, Art. no. 260103, 2026.  
[32] T. Geng, Y. Qu, and W. E. Wong. A white-box prompt injection attack on embodied AI agents driven by large language models. Journal of Systems and Software, 2026, Art. no. 112782.  
[33] S. Pahune and Z. Akhtar. Transitioning from MLOps to LLMOps: Navigating the unique challenges of large language models. Information, vol. 16, no. 2, Art. no. 87, 2025.
