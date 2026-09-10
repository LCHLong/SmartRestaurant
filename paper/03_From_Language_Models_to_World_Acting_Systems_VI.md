# Từ Large Language Models đến các World-Acting Systems: Tiến trình và Giới hạn của Agentic AI trên các Môi trường Kỹ thuật số, Xã hội, Ảo và Vật lý
*(From Language Models to World-Acting Systems: Progress and Limits of Agentic AI across Digital, Social, Virtual, and Physical Environments)*

**Tác giả:** Linsen Zhu, Mengqing Cai  
**Định danh:** arXiv:2609.04894v1 [cs.AI] 4 Sep 2026  
**Hạn chót khảo cứu tài liệu (Literature cutoff):** 31 tháng 8, 2026  

---

### Tóm tắt (Abstract)

Các Large Language Models (LLM) trở thành những agent có tính hệ quả thực tế khi các hệ thống bao quanh cho phép các đầu ra (outputs) làm thay đổi trạng thái bên ngoài. Các model hiện nay đã có thể gọi tool (call tools), thao tác trên các giao diện người dùng (operate interfaces), ủy nhiệm công việc (delegate work), duy trì trạng thái (retain state), cư ngụ trong các thế giới được sinh ra (inhabit generated worlds), và điều khiển robot hoặc các thiết bị phòng thí nghiệm. Những bước tiến như vậy thường được mô tả như một tiến trình đơn tuyến hướng tới quyền tự chủ (autonomy), làm lẫn lộn giữa năng lực của model (model competence), sự tích hợp hệ thống (system integration), tính bền bỉ theo thời gian (temporal persistence), và thẩm quyền an toàn (safe authority). 

Bài tổng quan phê phán (critical review) này tổng hợp các nghiên cứu sơ cấp (primary research) và các đặc tả kỹ thuật chính thức (official technical specifications) có sẵn tính đến ngày 31 tháng 8 năm 2026. Chúng tôi tổ chức các bằng chứng theo ba chiều: **thẩm quyền được ủy nhiệm (delegated authority)**, **tính bền bỉ theo thời gian (temporal persistence)**, và **sự gắn kết môi trường (environmental coupling)**, đồng thời tách biệt rành mạch giữa **model**, **harness** (phần mềm điều phối và kiểm soát), và **môi trường (environment)**. 

Trong phạm vi các bằng chứng được kiểm tra, việc mở rộng giao diện hành động (action-interface expansion) được ghi nhận thuyết phục hơn nhiều so với khả năng hoàn thành tác vụ vững chắc (robust completion), phục hồi sau lỗi (recovery), phân quyền xác thực (authorization), hay kiểm định độc lập (independent verification). Model Context Protocol (MCP) và Agent2Agent (A2A) giúp nâng cao khả năng tương tác (interoperability) nhưng không thiết lập được sự ủy quyền đáng tin cậy (trustworthy delegation); tổ chức multi-agent bổ sung tính chuyên môn hóa nhưng cũng kéo theo chi phí tính toán và nguy cơ lỗi tương quan (correlated failure). Các mô phỏng bền vững (persistent simulations) và world models hỗ trợ cho huấn luyện và lập kế hoạch (planning) nhưng tự thân chúng không chứng minh được tính tác tử (agency); robotics và các phòng thí nghiệm tự hành (self-driving laboratories) mới chỉ xác lập được tính khả thi trong phạm vi có giới hạn (bounded feasibility) chứ chưa đạt tới độ tin cậy trong thế giới mở không người giám sát (unattended open-world reliability). 

Chúng tôi đề xuất khái niệm **ủy quyền hợp thức (justified delegation)** như một nguyên lý kinh nghiệm phân tích và chuẩn tắc (analytical and normative heuristic), chứ không phải là một quy luật quan sát được hay một điểm số chứng nhận: chỉ mở rộng phạm vi hành động khi bằng chứng thực nghiệm chứng minh được nguồn gốc (provenance), thẩm quyền có ranh giới (bounded authority), khả năng phát hiện lỗi (failure detection), phục hồi an toàn (safe recovery), và sự kiểm soát được hiệu chuẩn của con người (calibrated human control). Khung tiếp cận này định hình một chương trình nghiên cứu (research agenda) tập trung vào việc đánh giá kết hợp model–harness, quyền hạn dựa trên năng lực (capability-based permissions), trạng thái bền vững (durable state), trách nhiệm giải trình giữa các agent (cross-agent accountability), và quy trình thẩm định vật lý theo từng giai đoạn (staged physical validation).

**Từ khóa (Keywords):** agentic AI; language-model agents; tool use; computer use; multi-agent systems; world models; robotics; human oversight; AI safety.

---

## 1. Giới thiệu (Introduction)

Language models ban đầu được tiếp cận chủ yếu với tư cách là các bộ sinh văn bản (generators): người dùng cung cấp văn bản và nhận lại văn bản. Các hệ thống mang tính tác tử (agentic systems) đã làm thay đổi hoàn toàn ý nghĩa thực tiễn của sự tương tác đó. Giờ đây, một đầu ra của model có thể kích hoạt một truy vấn cơ sở dữ liệu (database query), chỉnh sửa một kho mã nguồn (code repository), điều hướng một trang web, lên lịch trình cho một agent khác, yêu cầu con người giải tỏa một điểm mơ hồ, hoặc điều khiển một thiết bị vật lý di chuyển. Vì vậy, câu hỏi khoa học trung tâm không còn là liệu một model có thể đưa ra một kế hoạch hợp lý hay không. Vấn đề cốt lõi là liệu một hệ thống đã được cấu hình (configured system) có thể thực thi công việc được ủy quyền qua thời gian mà vẫn duy trì được ý định của người dùng (user's intent), các ràng buộc mang tính quy chế của tổ chức (institutional constraints), và lưu giữ được một bản ghi có thể truy vết/phục hồi (recoverable account) về những gì đã xảy ra hay không.

Các nghiên cứu ban đầu về agent đã thiết lập nên nhiều nền tảng của quá trình chuyển đổi này. ReAct đan xen các chuỗi suy luận (reasoning traces) với các hành động và quan sát từ môi trường, Toolformer nghiên cứu các quyết định học được về thời điểm và cách thức gọi các giao diện lập trình ứng dụng (APIs), và Reflexion sử dụng phản hồi bằng ngôn ngữ để điều chỉnh hành vi trong các lần thử tiếp theo [37, 38, 52]. Các phân tích theo hướng kiến trúc nhận thức (cognitive architectures) sau đó đã chỉ ra một cách rõ ràng rằng bộ nhớ (memory), việc lựa chọn hành động (action selection), và các quy trình ra quyết định (decision procedures) nằm xung quanh chứ không hoàn toàn nằm bên trong một foundation model [41]. Những đóng góp này đã làm thay đổi đơn vị phân tích (unit of analysis). Một agent không đơn thuần là một model có năng lực vượt trội; nó là một model được cấu hình bên trong một vòng lặp điều khiển (control loop), một giao diện (interface), một cấu trúc biểu diễn trạng thái (state representation), và một tập hợp các quyền hạn (permissions).

Kể từ năm 2023, từng bộ phận của hệ thống bao quanh này đã được mở rộng mạnh mẽ. Các benchmark trên nền tảng web và máy tính để bàn (desktop) đã giới thiệu các môi trường thực thi có khả năng đánh giá trạng thái kết thúc mang tính chức năng (functional end-state evaluation) [50, 56]. Các coding agent cho thấy giao diện giữa agent và máy tính (agent-computer interface) có thể làm thay đổi căn bản hiệu năng ngay cả khi model nền tảng được giữ nguyên cố định [51]. Các framework multi-agent đã biến việc ủy quyền và chuyên môn hóa vai trò thành các quy trình có thể lập trình được [49]. Các giao thức mở (open protocols) hiện phơi bày các tool và tài nguyên cho các ứng dụng dựa trên model, đồng thời định nghĩa việc trao đổi tác vụ giữa các agent vốn dĩ có cấu trúc nội tại mờ đục (opaque agents) [1, 3]. Các mô phỏng bền vững (persistent simulations), video world models, và các môi trường tương tác được sinh ra nhằm mục đích duy trì hoặc dự đoán trạng thái của thế giới (world state) [6, 32, 39, 46]. Các mô hình thị giác-ngôn ngữ-hành động (Vision-Language-Action - VLA models) và các hệ thống phòng thí nghiệm kết nối các chỉ dẫn cấp cao với các hành động cụ thể của robot hoặc thiết bị đo lường [8, 9, 14, 57]. Vào tháng 8 năm 2026, bản xem trước Model Hardware Standard (MHS) của Anthropic đã khiến sự hội tụ kiến trúc này trở nên đặc biệt rõ nét khi đề xuất một tầng driver độc lập với model (model-agnostic driver layer), cho phép các agent có thể khám phá và vận hành các thiết bị lập trình được không đồng nhất [5].

Sự mở rộng nhanh chóng này làm phát sinh một vấn đề nghiêm trọng về mặt khái niệm. Cụm từ "mang tính agent nhiều hơn" ("more agentic") thường được dùng lẫn lộn để chỉ ít nhất bốn sự thay đổi hoàn toàn khác nhau: 
1. Một base model mạnh hơn;
2. Một phần mềm harness (khung bao quanh) phong phú hơn;
3. Một tác vụ có vòng đời dài hơn; hoặc
4. Quyền truy cập vào một môi trường có tác động hệ quả lớn hơn.

Những thay đổi này không tất yếu suy ra lẫn nhau. Một model có thể suy luận xuất sắc nhưng lại không có bất kỳ thẩm quyền nào để hành động. Một model yếu có thể bị trao cho những quyền chứng thực (credentials) quá rộng rãi. Một giao thức có thể giúp các tool có khả năng tương tác (interoperable) với nhau nhưng không hề khiến việc sử dụng chúng trở nên an toàn hơn. Một world model mạch lạc về mặt thị giác có thể tạo ra một môi trường sống động nhưng bên trong lại không chứa bất kỳ agent định hướng mục tiêu (goal-directed agent) nào. Một chính sách robot (robot policy) có thể sinh ra các thao tác vận động thành thục nhưng lại không có khả năng duy trì mục tiêu dài hạn hay đàm phán thẩm quyền. Do đó, việc gộp tất cả các hệ thống này thành những bậc thang trên một chiếc "thang tự chủ" (autonomy ladder) duy nhất sẽ che giấu đi chính những biến số quyết định lớn nhất đến cả giá trị ứng dụng lẫn rủi ro thực tế.

Các bài khảo cứu hiện có đã tổng hợp rất hữu ích các autonomous language-model agent theo các thành phần cấu tạo và ứng dụng, hoặc tập trung chuyên biệt vào phương pháp đánh giá agent [48, 54]. Bài tổng quan này không nhằm mục đích lập thêm một danh mục thành phần mới. Đóng góp tổng hợp riêng biệt của chúng tôi là so sánh các lĩnh vực vốn bị chia cắt thông qua ba chiều phân tích: **thẩm quyền được ủy nhiệm (delegated authority)**, **tính bền bỉ theo thời gian (temporal persistence)**, và **sự gắn kết môi trường (environmental coupling)**, trong khi vẫn duy trì sự phân biệt rành mạch giữa **model**, **harness**, **môi trường (environment)**, **bên ủy quyền (delegator)**, và **nguồn bằng chứng (evidence source)**. Sự kết hợp này được thiết kế để làm bộc lộ những lỗ hổng bảo đảm (assurance gaps) mà những phân tích chỉ tập trung vào kiến trúc đơn thuần hoặc benchmark thường bỏ qua hoặc ngầm định.

Bằng chứng thực nghiệm cũng bác bỏ câu chuyện tiến bộ giản đơn thường thấy. Trong nghiên cứu WebArena gốc, agent chạy GPT-4 mạnh nhất chỉ đạt tỷ lệ hoàn thành tác vụ 14,41%, so với 78,24% của con người; nghiên cứu OSWorld gốc ghi nhận hiệu năng dưới 12,2% cho cấu hình tốt nhất so với 72,4% của con người [50, 56]. Các hệ thống computer-use của bên thứ nhất (first-party) sau đó đã báo cáo những bước tiến vượt bậc, nhưng vẫn phải thừa nhận các giới hạn về độ tin cậy và sự cần thiết của human oversight (sự giám sát của con người) [30, 31]. Trong các tác vụ dịch vụ thông qua tool, benchmark τ-bench đã chứng minh rằng một hệ thống dù đôi khi hoàn thành được một chuỗi hành động (trajectory) nhưng có thể kém tin cậy hơn rất nhiều khi đòi hỏi sự thành công nhất quán qua nhiều lần thử lặp lại [53]. Tranh luận giữa các agent (multi-agent debate) có xu hướng bị trôi dạt khỏi vấn đề ban đầu khi các phiên tương tác kéo dài [7], và các so sánh trong điều kiện điện toán tương đương (equal-compute comparisons) đặt dấu hỏi về việc liệu một số cải tiến được ghi nhận của hệ multi-agent có thực sự xuất phát từ tổ chức phân vai hay chỉ đơn giản là do sử dụng thêm ngân sách suy luận (inference budget) [45]. Các hệ thống vật lý thì đưa thêm vào sự không chắc chắn của cảm biến (sensing uncertainty), sai số cơ cấu chấp hành (actuation error), hao mòn cơ khí (wear), vùng biên an toàn (safety envelopes), và những hậu quả không thể hoàn tác (reset).

Bài tổng quan này đưa ra một kết luận có căn cứ bằng chứng rõ ràng: **trong phạm vi các bằng chứng công khai được khảo sát, các giao diện hành động (action interfaces) đã mở rộng thuyết phục hơn nhiều so với bằng chứng về quyền tự chủ có thể kiểm chứng (verifiable autonomy).** Chúng tôi định nghĩa "autonomy" theo nghĩa hẹp, là khả năng kiểm soát có định hướng mục tiêu bền bỉ, trong đó hệ thống tự chọn lựa và điều chỉnh hành động dưới quyền hạn được ủy nhiệm. Chúng tôi định nghĩa "verifiable" là việc thành công, sự tuân thủ chính sách, và các tác dụng phụ quan trọng có thể được kiểm tra bằng các bằng chứng độc lập nằm ngoài lời tự thuật của chính model. Sự so sánh này không phải là một quy luật tăng trưởng được đo lường trên toàn ngành, cũng không có nghĩa là các model đạt được ít tiến bộ. Thay vào đó, nó phản ánh một sự bất đối xứng qua các benchmark tiêu biểu, các thí nghiệm, các đặc tả kỹ thuật, và các tạo phẩm bên thứ nhất được khảo cứu: các bước tiến về năng lực và giao diện thường rất ấn tượng và dễ thấy, trong khi việc kiểm định, phục hồi sai sót, và quản trị an toàn vẫn còn mang tính ngoại tại, chưa đầy đủ, hoặc mới chỉ được đánh giá trong các môi trường mô phỏng có thể reset dễ dàng.

Để làm rõ sự bất đối xứng này, chúng tôi tổ chức các hệ thống agentic theo ba chiều độc lập:
1. **Thẩm quyền được ủy nhiệm (Delegated authority):** Xem xét những thay đổi trạng thái nào mà hệ thống được phép kích hoạt và việc ủy quyền của ai là bắt buộc.
2. **Tính bền bỉ theo thời gian (Temporal persistence):** Xem xét liệu mục tiêu, bộ nhớ, thông tin chứng thực (credentials), và các nghĩa vụ có tồn tại bền vững qua các bước thực thi, các lần bị gián đoạn, hay qua nhiều episode khác nhau hay không.
3. **Sự gắn kết môi trường (Environmental coupling):** Xem xét mức độ trực tiếp mà hành động tác động lên các bản sao phần mềm (software replicas), các dịch vụ kỹ thuật số trực tiếp (live digital services), các quy trình xã hội chia sẻ, các thế giới ảo mô phỏng, hay các hệ thống vật lý thực tế.

Ba chiều này bổ sung cho sự phân tách rành mạch giữa **model**, **harness** (phần mềm quản lý ngữ cảnh và hành động), và **môi trường** (nơi tiếp nhận hành động và trả về trạng thái cùng các hệ quả).

Tổng hợp này mang lại ba đóng góp chính:
- **Thứ nhất**, nó kết nối các mảng nghiên cứu vốn thường bị phân mảnh—từ tool use, computer-use agents, multi-agent systems, tương tác người–agent, world models, cho đến robotics và các phòng thí nghiệm tự hành—mà không ngộ nhận rằng chúng thuộc về một dòng tiến hóa công nghệ duy nhất.
- **Thứ hai**, nó phân loại độ tin cậy của các kết luận dựa trên loại hình nguồn tài liệu và bối cảnh đánh giá, tách biệt rõ ràng các bằng chứng thực nghiệm/benchmark đã qua bình duyệt (peer-reviewed) với các bản thảo sơ bộ (preprints), các đặc tả giao thức mở (open protocol specifications), và các bản xem trước nghiên cứu từ các doanh nghiệp (first-party research previews).
- **Thứ ba**, nó đề xuất một lộ trình nghiên cứu tập trung vào **sự ủy quyền hợp thức (justified delegation)** thay vì cố gắng đạt tới sự độc lập tối đa một cách thiếu kiểm soát.

Đây là một bài tổng quan phê phán (critical review), không phải là tổng quan hệ thống (systematic review) hay phân tích tổng hợp định lượng (quantitative meta-analysis): mục tiêu của nó là làm sáng tỏ các khái niệm, so sánh độ vững chắc của bằng chứng, và chỉ ra những mắt xích phụ thuộc chưa được giải quyết, thay vì ước tính tần suất xuất hiện trên toàn bộ kho tài liệu.

---

## 2. Phạm vi, Phương pháp Tổng quan và Kỷ luật Bằng chứng (Scope, review method, and evidential discipline)

### 2.1 Một bài tổng quan phê phán thay vì tổng quan hệ thống (A critical rather than systematic review)

Các tài liệu nghiên cứu về agent rất không đồng nhất về cả đối tượng nghiên cứu lẫn bản chất bằng chứng. Chúng bao gồm các bài báo huấn luyện model, các bài báo về hệ thống công nghệ (systems papers), các bộ chuẩn đánh giá (benchmarks), các đặc tả giao thức (protocol specifications), các framework mã nguồn mở, tài liệu hướng dẫn sản phẩm, các bản báo cáo an toàn hệ thống (system cards), và các bản trình diễn (demonstrations) mà sản phẩm đầu ra chủ yếu chỉ là một video clip hoặc một bài đăng blog. 

Một bài tổng quan thuần túy theo phương pháp trắc lượng thư mục (bibliometric review) sẽ bỏ sót các tiêu chuẩn kỹ thuật thực tế và các giao diện đã được triển khai, trong khi nếu đối xử với mọi tài liệu công khai đều có giá trị tương đương nhau thì sẽ biến những lời tuyên bố thương mại thành kết quả khoa học. Vì vậy, chúng tôi áp dụng phương pháp tổng quan phê phán có định hướng theo câu hỏi (critical, question-driven review design). Câu hỏi định hình bài viết là: **Những bằng chứng nào hỗ trợ cho việc chuyển giao quyền kiểm soát được ủy nhiệm từ các language model vào các môi trường kỹ thuật số, xã hội, ảo và vật lý, và đâu là điểm dừng của các bằng chứng đó?**

Thời điểm chốt tài liệu khảo cứu là ngày **31 tháng 8 năm 2026**. Chúng tôi ưu tiên:
- Các bài báo gốc đã qua bình duyệt (peer-reviewed papers) và các kỷ yếu hội nghị chính thức đối với các khẳng định về năng lực và kết quả benchmark;
- Các bản thảo công khai (public preprints) hoặc các báo cáo kỹ thuật từ các viện nghiên cứu khi chưa có phiên bản xuất bản chính thức tính đến thời điểm chốt tài liệu;
- Các tài liệu đặc tả kỹ thuật và bản phát hành được duy trì cập nhật đối với ngữ nghĩa của các giao thức (protocol semantics);
- Các công bố nghiên cứu từ chính nhà phát triển (first-party research announcements) hoặc system cards chỉ dành riêng cho các khẳng định về các hệ thống đang trong giai đoạn bản xem trước (preview), các giao diện mới và các hạn chế đã được công bố.

Các bài khảo sát tổng hợp trước đây được sử dụng để định vị thuật ngữ chứ không thể thay thế cho các kết quả sơ cấp [48, 54]. Chúng tôi đưa vào các hệ thống đại diện khi chúng phản ánh một bước chuyển đổi then chốt trong ngăn xếp hành động (action stack): các vòng lặp suy luận–hành động (reasoning–action loops), khả năng sử dụng công cụ học được (learned tool use), khả năng tương tác web hoặc desktop có thể thực thi, việc ủy nhiệm giữa các agent, trạng thái bền vững (persistent state), các môi trường 3D tương tác, điều khiển robot, hoặc vận hành phòng thí nghiệm theo vòng lặp khép kín (closed-loop laboratory operation). Chúng tôi loại trừ các hệ thống chat thông thường không có đường dẫn hành động ra bên ngoài và các báo cáo thứ cấp không cung cấp thêm bất kỳ bằng chứng nào có thể kiểm chứng độc lập.

Thiết kế nghiên cứu này không đưa ra các nhận định về tỷ lệ phần trăm của tất cả các bài báo về agent có chứa một đặc điểm nhất định, cũng như không tạo ra một quy mô kích thước hiệu ứng phân tích tổng hợp chính thức (meta-analytic effect size). Phiên bản model, prompt, ngân sách suy luận (inference budget), cấu trúc giàn giáo (scaffolds), và trạng thái của benchmark thay đổi quá nhanh khiến cho nhiều điểm số tiêu đề không thể gộp chung lại với nhau. Thay vào đó, chúng tôi sử dụng các phép đối chiếu mang tính đại diện để kiểm định các luận điểm mang tính khái niệm. Các số liệu hiệu năng trong quá khứ được xác định rõ là kết quả của một cấu hình cụ thể, chứ không phải được trình bày như một bảng xếp hạng (leaderboard) hiện thời. Sự hiện diện của một sản phẩm thương mại là bằng chứng cho thấy giao diện đó đã được triển khai, chứ không phải là bằng chứng cho thấy nó vận hành đáng tin cậy. Một tài liệu đặc tả kỹ thuật là bằng chứng về một bề mặt thông điệp hoặc cơ chế phân quyền đã được định nghĩa, chứ không phải bằng chứng cho thấy các bản triển khai tuân thủ đầy đủ hoặc các agent tham gia vào đó có năng lực thực sự.

---

### Bảng 1: Các danh mục bằng chứng được sử dụng trong bài tổng quan và các tuyên bố mà mỗi danh mục có thể hỗ trợ
*(Table 1: Evidence categories used in this review and the claims each can support)*

| Danh mục nguồn tài liệu (Source category) | Mục đích sử dụng vững chắc nhất có thể bảo vệ (Strongest defensible use) | Điểm mù điển hình (Typical blind spot) | Các ví dụ đại diện (Representative examples) |
| :--- | :--- | :--- | :--- |
| **Bài báo benchmark hoặc hệ thống đã qua bình duyệt (Peer-reviewed benchmark or systems paper)** | Hiệu năng và thất bại dưới đúng tác vụ, model, harness, ngân sách và bộ đánh giá đã công bố | Hiện tượng trôi dạt phân phối (distribution shift), quyền hạn trong môi trường trực tiếp, giao diện thay đổi, và các sự cố trong vận hành dài hạn | WebArena, OSWorld, SWE-agent, τ-bench [50, 51, 53, 56] |
| **Thí nghiệm vật lý có đối chứng đã qua bình duyệt (Peer-reviewed controlled physical experiment)** | Tính khả thi và hành vi đo lường được trong một thiết bị và quy trình đã công bố | Quy mô mở rộng, vận hành lặp lại không có người giám sát, các mối nguy hiểm hiếm gặp, và khả năng chuyển giao sang các thiết bị khác | RT-2, Coscientist, ChemCrow [8, 9, 57] |
| **Bản thảo sơ bộ hoặc báo cáo kỹ thuật của tổ chức (Preprint or institutional technical report)** | Cấu trúc kiến trúc kịp thời, tạo phẩm đã phát hành, và đánh giá sơ bộ | Quá trình bình duyệt độc lập, tái lặp độc lập, các endpoint model ổn định, và việc báo cáo có chọn lọc | Voyager, V-JEPA 2, Gemini Robotics, Magentic-UI [6, 12, 24, 47] |
| **Đặc tả kỹ thuật mở (Open technical specification)** | Các vai trò, thông điệp, chuyển đổi trạng thái, cơ chế khám phá (discovery), và yêu cầu bảo mật đã định nghĩa | Chất lượng triển khai thực tế, mức độ áp dụng, tính đúng đắn về ngữ nghĩa, và độ tin cậy của tác vụ cuối cùng | MCP và A2A [1, 23] |
| **Bản xem trước, system card hoặc hồ sơ sản phẩm của bên thứ nhất (First-party preview, system card, or product record)** | Sự tồn tại thực tế, thiết kế đã nêu, các thử nghiệm nội bộ, ràng buộc triển khai, và các lỗi đã công bố | Khả năng tái lặp độc lập, mẫu số thống kê đầy đủ, tính công bằng khi so sánh, và độ bền vững lâu dài | OpenAI CUA, Genie 3, Project Eden, MHS [5, 30, 33, 46] |

*Ghi chú: Một nguồn tài liệu có thể chuyển danh mục khi xuất hiện bài báo lưu trữ chính thức, đặc tả công khai hoặc đánh giá độc lập. Mọi sự phân loại danh mục đều phản ánh trạng thái tại thời điểm chốt tài liệu.*

---

### 2.2 Các danh mục bằng chứng và ranh giới tuyên bố (Evidence categories and claim boundaries)

Bảng 1 định nghĩa các danh mục nguồn tài liệu được sử dụng xuyên suốt bài viết. Chúng không biểu thị một thang bậc uy tín đơn thuần. Một đặc tả giao thức là nguồn bằng chứng vững chắc nhất về mặt ngữ nghĩa đường truyền (wire semantics), nhưng lại là nguồn rất yếu về mặt hiệu năng thực tế của tác vụ; một thí nghiệm vật lý có đối chứng có thể chứng minh tính khả thi nhưng không thể thiết lập được độ an toàn trong vận hành dài hạn; và một benchmark độc lập có thể đo lường tỷ lệ thành công của tác vụ nhưng lại bỏ qua thông tin xác thực thật và người dùng thực tế bị ảnh hưởng. Do đó, chúng tôi gắn chất lượng bằng chứng với từng tuyên bố cụ thể thay vì gán một điểm số cố định vĩnh viễn cho một hệ thống.

Ba quy tắc ranh giới giúp ngăn chặn các bước nhảy suy luận sai lầm phổ biến:
1. **Một bản trình diễn năng lực (demonstration of capability) không đồng nghĩa với tần suất thành công đáng tin cậy (frequency of reliable success).** Một chuỗi hành động đơn lẻ hoàn thành xuất sắc có thể là bằng chứng khả thi rất có giá trị, nhưng hầu như không nói lên được gì về rủi ro ở phần đuôi phân phối (tail risk).
2. **Tính bền bỉ (persistence) phải được phân tách thành các đối tượng khác nhau.** Ngữ cảnh hội thoại (conversation context), bộ nhớ từng hồi (episodic memory), bản ghi tác vụ có thể tiếp tục lại (resumable task record), một kỹ năng học được (learned skill), và quyền hạn bền vững (durable authority) hoàn toàn không thể hoán đổi cho nhau.
3. **Tính mở (openness) ám chỉ môi trường hành động, chứ không phải sự phong phú về mặt thị giác.** Một khung cảnh đồ họa được sinh ra có thể vô tận về mặt thị giác nhưng lại chạy hoàn toàn bên trong một môi trường mô phỏng có thể reset bất kỳ lúc nào; ngược lại, một lệnh gọi API ngắn ngủi có thể tác động trực tiếp lên một hệ thống ngân hàng, bệnh viện, hoặc dịch vụ công đang hoạt động thực tế.

---

### 2.3 Đơn vị phân tích: Hệ thống hành động được cấu hình (The unit of analysis: a configured action system)

Đối với bất kỳ kết quả nào được báo cáo, đơn vị phân tích phù hợp phải là hệ thống đã được cấu hình:

$$S = (M, H, E, U)$$

trong đó:
- **$M$ (Model):** Là mô hình nền tảng chịu trách nhiệm suy luận, tri giác, và dự đoán.
- **$H$ (Harness):** Là khung bao quanh điều phối hệ thống, bao gồm kỹ thuật prompt, cơ chế dựng ngữ cảnh (context construction), bộ nhớ, lược đồ công cụ (tool schemas), bộ lập kế hoạch (planners), bộ thẩm định (verifiers), logic thử lại (retry logic), quản lý danh tính và thông tin chứng thực (identity & credential handling), cùng các thành phần điều khiển trên giao diện người dùng.
- **$E$ (Environment):** Là môi trường vận hành thực tế, cung cấp trạng thái quan sát được, các hành động được phép thực hiện, động lực học chuyển đổi trạng thái, và các hậu quả.
- **$U$ (Delegator):** Là người dùng hoặc tổ chức thực hiện việc ủy quyền mục tiêu và thẩm quyền hợp pháp, nhưng vẫn có thể sẵn sàng tham gia để làm rõ yêu cầu, phê duyệt hành động, hoặc tiếp quản quyền kiểm soát khi cần thiết.

Những người và tổ chức bị ảnh hưởng (affected people and institutions) không bị gộp chung vào $U$: họ có thể phải gánh chịu hậu quả mà không hề ủy quyền hay vận hành hệ thống, và do đó họ cần có các kênh riêng biệt để nhận thông báo, khiếu nại và yêu cầu bồi thường. 

Công thức này làm rõ lý do tại sao "hiệu năng của model" thực chất thường là một đặc tính của toàn bộ hệ thống: việc thay đổi các tập lệnh có thể tiếp cận hoặc cách biểu diễn phản hồi có thể làm thay đổi căn bản kết quả cuối cùng mà không cần thay đổi bất kỳ trọng số nào của model [51].

Chúng tôi phân tích hệ thống $S$ trên ba chiều độc lập:
1. **Thẩm quyền được ủy nhiệm (Delegated authority):** Trải dài từ mức độ chỉ đưa ra khuyến nghị (recommendation), thông qua hành động có thể hoàn tác dưới sự phê duyệt (reversible action under approval), đến hành động trực tiếp làm thay đổi trạng thái thế giới (direct state-changing action).
2. **Tính bền bỉ theo thời gian (Temporal persistence):** Trải dài từ phản hồi một lượt (single response), qua các tác vụ nhiều bước có thể tạm dừng và tiếp tục lại (multi-step and resumable tasks), đến các nghĩa vụ mang tính chu kỳ hoặc kéo dài qua nhiều episode.
3. **Sự gắn kết môi trường (Environmental coupling):** Trải dài từ trạng thái nhân tạo hoặc có thể hoàn tác (synthetic or resettable state), qua các dịch vụ trực tiếp có giới hạn (bounded live services), đến các môi trường xã hội và vật lý dùng chung với những tác động cực kỳ khó hoặc không thể đảo ngược.

Các chiều này mang tính mô tả chứ không mang tính ca ngợi. Một hệ thống có mức độ gắn kết môi trường cao không nhất thiết là thông minh hơn; nó chỉ đơn giản đòi hỏi phải có bằng chứng mạnh mẽ hơn và các cơ chế kiểm soát chặt chẽ hơn để có thể tự tin triển khai trong thực tế.

---

## 3. Từ Năng lực Model đến Tác tử tính được Cấu hình (From model capability to configured agency)

### 3.1 Suy luận và sử dụng công cụ là điều kiện cần nhưng không đủ (Reasoning and tool use are necessary but not sufficient)

Bước chuyển mang tính khái niệm quan trọng nhất trong agentic AI là từ việc **dự đoán một câu trả lời** sang việc **lựa chọn một hành động can thiệp**. ReAct đã làm rõ bước chuyển này bằng cách xen kẽ các token suy luận và hành động với các quan sát từ môi trường, cho phép language model thu thập thông tin và liên tục điều chỉnh quỹ đạo hành động của nó [52]. Toolformer giải quyết một vấn đề bổ trợ: học xem lệnh gọi API nào là hữu ích và các giá trị trả về của chúng nên được đưa vào các dự đoán tiếp theo như thế nào [37]. Reflexion chỉ ra rằng phản hồi bằng văn bản từ những lần thất bại có thể được lưu giữ và tái sử dụng để cải thiện các lần thử sau mà không cần cập nhật bất kỳ trọng số nào của mạng nơ-ron [38]. Cùng nhau, các hệ thống này đã thiết lập một vòng lặp có thể tái sử dụng: suy luận bước tiếp theo, kích hoạt một khả năng tương tác (affordance), quan sát kết quả, và điều chỉnh bước tiếp theo dựa trên quan sát đó.

Tuy nhiên, vòng lặp này rất dễ vẽ ra trên giấy nhưng lại cực kỳ khó để thẩm định và chứng minh trong thực tế. Một model phải chọn đúng mục tiêu phụ (subgoal), gắn kết chính xác các đối số vào một lược đồ hành động (action schema), nhận biết khi nào một quan sát bị thiếu sót hoặc có tính đối kháng, bảo toàn trạng thái liên quan, và dừng lại vì lý do chính đáng. Năng lực suy luận tốt hơn có thể cải thiện một số thao tác này, nhưng nó không quyết định được quyền hạn của tool được gọi, độ trung thực của quan sát, hay tính đúng đắn của một tác dụng phụ (side effect) bên ngoài. Độ chính xác của việc gọi công cụ (tool-use accuracy) được đo lường dựa trên một lệnh gọi mẫu tham chiếu cũng không thể chứng minh được rằng hành động đó đã được cấp phép hợp lệ hay trạng thái kết thúc mong muốn đã thực sự đạt được.

Chân trời tác vụ hiệu quả dài hơn (longer effective task horizons) là một chỉ dấu cho thấy năng lực được cải thiện. Kwa và các đồng nghiệp định nghĩa **chân trời thời gian hoàn thành tác vụ 50% (50%-task-completion time horizon)** là khoảng thời gian con người cần để hoàn thành các tác vụ mà một hệ thống AI có thể hoàn thành với tỷ lệ thành công 50%, và họ báo cáo sự gia tăng nhanh chóng theo thời gian trên bộ tác vụ phần mềm và nghiên cứu của họ [15]. Chỉ số này có giá trị vì nó chuyển đổi một tập hợp các kết quả benchmark thành một thang đo có thể diễn giải được về mặt vận hành, đồng thời quy các bước tiến một phần cho độ tin cậy, khả năng thích ứng với sai lầm, năng lực suy luận và việc sử dụng công cụ. 

Tuy nhiên, ranh giới của chỉ số này cũng rất quan trọng: các tác vụ thử nghiệm tương đối sạch sẽ, ngưỡng 50% vẫn thấp hơn nhiều so với độ tin cậy được đòi hỏi trong nhiều môi trường triển khai thực tế, và thời gian hoàn thành của con người thực chất là một đại lượng ước lượng độ phức tạp của tác vụ chứ không phải là khoảng thời gian mà một agent có thể vận hành an toàn mà không cần ai giám sát. Do đó, một chân trời benchmark dài hơn chỉ hỗ trợ cho một tuyên bố về năng lực (capability claim), chứ không thể hỗ trợ cho một tuyên bố chung về quyền tự chủ bền vững (durable autonomy).

---

### 3.2 Harness là một phần của hệ thống nhân quả (The harness is part of the causal system)

Harness chính là thành phần biến một model thành một hệ thống hành động. Ở mức tối thiểu, nó định nghĩa system prompt, các hành động khả dụng, quy tắc mã hóa quan sát, chính sách quản lý cửa sổ ngữ cảnh (context-window policy), và quy tắc dừng (termination rule). Các harness vận hành trong thực tế bổ sung thêm kho lưu trữ bộ nhớ, biểu diễn kế hoạch, môi trường cô lập (sandboxing), hệ thống môi giới thông tin chứng thực (credential brokers), giới hạn về tần suất và chi phí, các cổng phê duyệt (approval gates), hệ thống giám sát, cơ chế thử lại (retries), điểm kiểm tra lưu trữ (checkpoints), và các quy trình phục hồi sau sự cố. 

Công trình *Cognitive Architectures for Language Agents* đã tổ chức các thành phần liên quan này thành ba khối: bộ nhớ (memory), không gian hành động (action space), và các quy trình ra quyết định (decision procedures), giúp tách biệt tri thức học được của một language model khỏi kiến trúc kiểm soát mà nó đang vận hành bên trong [41]. Các nghiên cứu kỹ thuật harness gần đây xem việc xây dựng ngữ cảnh và chính sách lúc thực thi (runtime policy) là các đối tượng tối ưu hóa độc lập, mặc dù phần lớn các tài liệu này vẫn ở dạng bản thảo sơ bộ (preprint) tính đến thời điểm chốt khảo cứu [16, 25].

SWE-agent cung cấp bằng chứng thực nghiệm trực tiếp về tầm quan trọng của việc thiết kế giao diện. Giao diện agent-máy tính (agent-computer interface) của nó cung cấp các lệnh và phản hồi được thiết kế chuyên biệt cho model để điều hướng kho mã nguồn, chỉnh sửa và chạy thử nghiệm; nghiên cứu gốc tại NeurIPS đã báo cáo tỷ lệ pass@1 là 12,5% trên SWE-bench và chứng minh rằng các lựa chọn về giao diện có tác động trực tiếp định hình hành vi của agent [51]. Con số này giờ đây đã thuộc về quá khứ, nhưng suy luận nền tảng vẫn giữ nguyên giá trị: một điểm số benchmark không thể được gán riêng cho các trọng số của model khi mà một bề mặt tương tác được thiết kế lại có thể thay đổi hoàn toàn những gì mà cùng một lớp model đó có thể đạt được.

---

```
         Hệ thống hành động thế giới được cấu hình S = (M, H, E, U)
         ===========================================================

                          +----------------------+
                          |    Bên ủy quyền U    |
                          | (Mục tiêu, thẩm quyền|
                          |  chấp nhận rủi ro)   |
                          +----------+-----------+
                                     |
               Mục tiêu & thẩm quyền | Trạng thái & phê duyệt
                                     v
+------------------+       +---------+----------+       +-------------------+
|      Model       | <---> |      Harness       | <---> |    Môi trường     |
|   (Suy luận,     |       | (Ngữ cảnh, bộ nhớ, |       | (Trạng thái số,   |
|  tri giác, dự    |       | tools, chứng thực, |       |  xã hội, ảo,      |
|      đoán)       |       | chính sách, điều   |       |  vật lý)          |
|                  |       | khiển vận hành)    |       |                   |
+------------------+       +---------+----------+       +---------+---------+
                                     |                            |
                   Bằng chứng kết quả| Trạng thái xác thực/ngoại lệ| Hậu quả
                                     v                            | bên ngoài
                     +---------------+---------------+            |
                     |  Thẩm định & Phục hồi độc lập |            |
                     | (Ràng buộc, kết quả, tác dụng |            |
                     |  phụ, nguồn gốc xuất xứ)      |            |
                     +---------------+---------------+            |
                                     ^                            |
                    Bằng chứng tác động | Khiếu nại/khắc phục      |
                     +---------------+---------------+            |
                     |   Người & Tổ chức bị ảnh hưởng|<-----------+
                     | (Tác động, thông báo,         |
                     |  tranh chấp, khắc phục)       |
                     +-------------------------------+
```

**Hình 1:** *Tính tác tử (Agency) là một thuộc tính của hệ thống kết hợp model–harness–môi trường dưới thẩm quyền được trao bởi bên ủy quyền $U$. Quá trình thẩm định và phục hồi được biểu diễn như một chức năng mở rộng của harness $H$, chứ không phải là một phần tử thứ năm của $S$. Người vận hành con người được ủy quyền tương tác thông qua $H$ nhưng không bị đồng nhất với $U$; những người và tổ chức bị ảnh hưởng không nhất thiết phải ủy quyền hay vận hành hệ thống, do đó được đặt bên ngoài ranh giới của hệ thống. Những tác động, khiếu nại và biện pháp khắc phục của họ là dữ liệu đầu vào cho quy trình thẩm định và phục hồi độc lập.*

Hình 1 tóm lược góc nhìn hệ thống đã cấu hình này. Bên ủy quyền $U$ là chủ thể trao mục tiêu và thẩm quyền hợp pháp; một người vận hành con người có thể thực hiện việc phê duyệt, giám sát hoặc tiếp quản thay mặt cho chủ thể đó; và những người hoặc tổ chức bị ảnh hưởng có thể không nằm trong bất kỳ vai trò nào kể trên. Model đưa ra đề xuất, harness đóng vai trò điều phối trung gian, và môi trường thay đổi trạng thái. Việc thẩm định phải so sánh trạng thái quan sát được với mục tiêu được ủy quyền và các ràng buộc hiện hành, chứ không chỉ đơn thuần là hỏi lại chính model đó xem nó có tin rằng nó đã thành công hay không. Việc phân tách rõ ràng các chủ thể này giúp tránh được hai sai lầm đối xứng: coi mọi sự can thiệp của con người là bằng chứng cho thấy hệ thống không có tính tác tử, hoặc coi sự tồn tại của một nút bấm tiếp quản là bằng chứng của việc kiểm soát hiệu quả.

---

### 3.3 Ba ý nghĩa có thể phân tách của khái niệm "tốt hơn" (Three separable meanings of “better”)

Sự phân tách này mang lại ba khẳng định cải tiến hoàn toàn khác biệt:
1. **Năng lực chính sách (Policy competence):** Được cải thiện khi model lựa chọn các hành động phù hợp hơn hoặc phục hồi được từ một phổ lỗi rộng hơn dưới một giao diện cố định.
2. **Độ bao phủ hành động (Action coverage):** Được cải thiện khi harness phơi bày thêm các tool, ứng dụng, agent, hoặc thiết bị vật lý mới.
3. **Mức độ bảo đảm (Assurance):** Được cải thiện khi việc phân quyền, thẩm định, khoanh vùng cô lập (containment), và phục hồi sau sự cố trở nên đáng tin cậy hơn.

Trong các hệ thống được khảo cứu tại đây, hai khía cạnh đầu tiên thường được ghi nhận và chứng minh trực tiếp hơn nhiều so với khía cạnh thứ ba. Chẳng hạn, một model có thể được trang bị một giao diện chuột và bàn phím phổ quát, mặc dù thành công thực tế vẫn rất khó thẩm định và một cuộc tấn công indirect prompt injection hoàn toàn có thể chiếm quyền điều khiển chính giao diện đó.

Việc gộp chung cả ba cải tiến này dưới cái tên "quyền tự chủ" (autonomy) tạo ra những sự so sánh gây hiểu lầm nghiêm trọng. Một coding agent có phạm vi hẹp với các bài kiểm thử tự động và bảng so khớp thay đổi mã nguồn (diff) trên hệ thống kiểm soát phiên bản có thể thẩm định được mức độ an toàn cao hơn nhiều so với một model tổng quát mạnh hơn đang tự do điều hướng một tài khoản thông qua các điểm ảnh (pixels). Một hệ thống điều phối phòng thí nghiệm chỉ vận hành các quy trình trong danh sách cho phép (allowlisted procedures) đằng sau các khóa liên động cơ học (interlocks) có thể đáng tin cậy hơn nhiều so với một agent thoạt nhìn có vẻ ít gây hệ quả hơn nhưng lại có quyền truy cập mạng và thông tin chứng thực không giới hạn. Do đó, mục tiêu nghiên cứu đúng đắn không phải là tối đa hóa độ bao phủ hành động một cách cô lập, mà là mở rộng nó với tốc độ tương thích và được hỗ trợ đầy đủ bởi năng lực thực tế và các cơ chế bảo đảm an toàn.

---

## 4. Hành động Kỹ thuật số: Từ các API Định kiểu đến Sử dụng Máy tính Phổ quát (Digital action: from typed APIs to universal computer use)

### 4.1 Các công cụ có cấu trúc cung cấp các khả năng tương tác hẹp và có thể thanh tra (Structured tools provide narrow, inspectable affordances)

Các API là giao diện hành động rõ ràng và dễ diễn giải nhất hiện có đối với một agent. Một lệnh gọi định kiểu (typed call) chỉ rõ tên thao tác và các đối số của nó; dịch vụ nhận lệnh có thể xác thực người gọi, kiểm tra tính hợp lệ của lược đồ (schema validation), ghi lại nhật ký yêu cầu, và trả về trạng thái có cấu trúc. Điều này giúp cho việc kiểm tra điều kiện tiên quyết (precondition checks) và thực thi chính sách trở nên khả thi và dễ kiểm soát hơn nhiều so với khi cùng một thao tác đó được tái cấu trúc thông qua giao diện đồ họa. Các hệ thống sử dụng công cụ dựa trên huấn luyện hoặc kỹ thuật prompt đã chứng minh rằng các language model có thể lựa chọn giữa các hàm như vậy, điền đối số, và tiếp nhận các quan sát trả về [37, 52]. AgentBench đã mở rộng phạm vi đánh giá trên nhiều môi trường: hệ điều hành, cơ sở dữ liệu, đồ thị tri thức, trò chơi và các bối cảnh hiện thân (embodied settings), qua đó ghi nhận các điểm yếu cố hữu về suy luận trên chân trời dài, ra quyết định và tuân thủ chỉ dẫn [18].

Tuy nhiên, quyền truy cập có cấu trúc tự thân nó không đảm bảo rằng một hành động là chính xác. Mô tả công cụ có thể mơ hồ, các đối số có thể hợp lệ về mặt cú pháp nhưng sai về mặt ngữ nghĩa, và một lệnh gọi thành công về mặt kỹ thuật vẫn có thể vi phạm sở thích ngầm định của người dùng hoặc một chính sách của tổ chức. Một thao tác đọc (read) có thể làm lộ ngữ cảnh nhạy cảm cho model; một thao tác ghi (write) có thể không có tính lũy kế (non-idempotent); và một chuỗi các lệnh gọi riêng lẻ đều được cho phép lại có thể tạo ra một kết quả tổng hợp không được phép. Đây là các bài toán về sự kết hợp (composition problems), chứ không phải bài toán phân tích cú pháp (parsing problems). Chúng thúc đẩy sự cần thiết phải phân tách rạch ròi giữa hành động đề xuất của model, quyết định chính sách của harness, và việc ủy quyền xác thực cuối cùng của dịch vụ.

Các benchmark mang tính giao dịch (transactional benchmarks) giúp định lượng hóa sự phân biệt này. τ-bench đánh giá các agent tương tác với cả người dùng và các công cụ chuyên ngành trong các kịch bản bán lẻ và hàng không, kiểm tra xem liệu trạng thái cơ sở dữ liệu cuối cùng có thỏa mãn các chính sách đặc thù của tác vụ hay không [53]. Phân tích $pass^k$ của nghiên cứu này cho thấy tính nhất quán qua các lần thử lặp lại sụt giảm rất mạnh so với tỷ lệ thành công một lần thử (one-shot success). Đây là một kết quả mấu chốt cho việc triển khai thực tế: nếu một agent thành công với xác suất $p$ trong một lượt chạy và các lỗi là độc lập, thì việc đòi hỏi $k$ lần thành công liên tiếp sẽ mang lại xác suất là $p^k$; các lỗi có tương quan hoặc sự thay đổi của trạng thái bên ngoài thậm chí có thể khiến độ tin cậy tồi tệ hơn nữa. Do đó, một bản ghi hội thoại (transcript) có vẻ trôi chảy và thuyết phục vẫn là bằng chứng yếu hơn nhiều so với một trạng thái cuối cùng đã được xác minh qua nhiều lần thử nghiệm lặp lại.

---

### 4.2 Giao diện đồ họa mở rộng phạm vi tiếp cận bằng cách nới lỏng cấu trúc (Graphical interfaces expand reach by weakening structure)

Nhiều ứng dụng quan trọng trong thực tế chỉ cung cấp các API không đầy đủ hoặc hoàn toàn không thể tiếp cận. Thay vào đó, các computer-use agent tiếp nhận các ảnh chụp màn hình (screenshots) hoặc cây trợ năng (accessibility trees) và hành động thông qua các lệnh chuột và bàn phím. Giao diện này rất hấp dẫn vì nó có thể tiếp cận được các phần mềm kế thừa (legacy software) và phần mềm độc quyền mà không cần phải xây dựng các tích hợp chuyên biệt. Tuy nhiên, bản chất của nó là ít mang tính định kiểu hơn: việc định vị thị giác (visual grounding), trạng thái tiêu điểm (focus state), thời gian trễ, bố cục cửa sổ, các thông báo thoáng qua và trạng thái ẩn của ứng dụng đều ảnh hưởng trực tiếp đến ý nghĩa của một cú nhấp chuột.

WebArena là một bước tiến sớm từ đánh giá ngôn ngữ tĩnh sang đánh giá hành động mang tính chức năng. Nó cung cấp các trang web tự lưu trữ, có thể tái lập trong các lĩnh vực thương mại điện tử, thảo luận xã hội, phát triển cộng tác và quản trị nội dung, với các bộ đánh giá kiểm tra kết quả cuối cùng của tác vụ thay vì chỉ so sánh các chuỗi hành động. Cấu hình GPT-4 mạnh nhất được báo cáo đạt tỷ lệ thành công đầu-cuối (end-to-end success) là 14,41% so với 78,24% của con người [56]. OSWorld đã mở rộng cách tiếp cận này sang các ứng dụng thực tế trên Ubuntu, Windows và macOS thông qua môi trường máy ảo có thể reset được. Nghiên cứu ban đầu bao gồm 369 tác vụ và ghi nhận tỷ lệ thành công dưới 12,2% cho agent tốt nhất so với 72,4% của con người [50]. Những kết quả này là các đường cơ sở lịch sử chứ không phải là các ước tính bảng xếp hạng hiện tại, nhưng chúng vẫn là bằng chứng mạnh mẽ cho thấy khả năng tri giác, tri thức vận hành và việc theo dõi trạng thái đa ứng dụng hoàn toàn khác biệt với khả năng sinh ngôn ngữ lưu loát.

Các hệ thống của bên thứ nhất (first-party systems) sau đó đã báo cáo những mức tăng điểm benchmark đáng kể. Bản xem trước nghiên cứu Computer-Using Agent (CUA) của OpenAI báo cáo đạt 38,1% trên OSWorld và 58,1% trên WebArena với không gian hành động màn hình–chuột–bàn phím [30]. Tuy nhiên, system card đi kèm đã mô tả rõ ràng mức 38,1% là chưa đủ độ tin cậy cho việc tự động hóa hệ điều hành và khuyến nghị cần có sự giám sát của con người, đồng thời chỉ ra các mối lo ngại về prompt injection, sai sót của model và các vấn đề liên quan đến jailbreak [31]. Tương tự, Anthropic đã phát hành tính năng computer use dưới dạng bản thử nghiệm công khai (public beta) và cảnh báo rằng tính năng này vẫn đang trong giai đoạn thử nghiệm và có thể mắc lỗi khi diễn giải màn hình hoặc thực hiện hành động [2]. Các báo cáo như vậy xác nhận rằng việc điều khiển đồ họa tổng quát đã trở thành một giao diện khả thi; tuy nhiên, vì các báo cáo đánh giá và triển khai này xuất phát từ chính nhà phát triển, chúng không thể thay thế cho các thử nghiệm độc lập dưới các harness ổn định.

Do đó, sự khác biệt giữa các API và việc điều khiển đồ họa không phải là sự lựa chọn giữa tính tác tử "hạn chế" và "tổng quát". Đó là một sự đánh đổi giữa **ngữ nghĩa tường minh (explicit semantics)** và **độ bao phủ giao diện (interface coverage)**. Một API có thể phơi bày các thao tác có tác động lớn với các đối số chính xác; trong khi một giao diện đồ họa có thể tiếp cận hầu như mọi nút điều khiển nhìn thấy được nhưng lại khiến cho trạng thái và ý định trở nên khó thẩm định hơn nhiều. Các hệ thống lai (hybrid systems) nên ưu tiên các lệnh gọi có cấu trúc khi ngữ nghĩa và cơ chế phân quyền của chúng đáp ứng yêu cầu, chuyển sang sử dụng computer use khi thực sự cần thiết, và duy trì cùng một tầng chính sách và nguồn gốc xuất xứ (provenance layer) xuyên suốt cả hai. Nếu không, cơ chế dự phòng sẽ trở thành một con đường đi vòng qua các chốt kiểm soát an toàn thay vì là một cơ chế tương thích.

---

### 4.3 Coding agent minh họa cả đòn bẩy lẫn khả năng kiểm chứng (Coding agents illustrate both leverage and verifiability)

Kỹ thuật phần mềm (software engineering) là một lĩnh vực kỹ thuật số mang lại nhiều thông tin sâu sắc bởi vì các hành động có thể tạo ra hệ quả lớn nhưng lại có khả năng thanh tra và kiểm chứng cao bất thường. Một agent có thể tìm kiếm trong một kho mã nguồn, chỉnh sửa tệp tin, chạy các bài kiểm thử và đề xuất một bản vá lỗi (patch) bên trong một môi trường cô lập. Hệ thống kiểm soát phiên bản phơi bày một bản diff rõ ràng; các bộ kiểm thử cung cấp các đặc tả thực thi một phần; và các thay đổi thất bại thường có thể được hoàn tác dễ dàng. SWE-bench đã tạo ra các tác vụ ở cấp độ issue từ các kho mã nguồn GitHub thực tế, trong khi SWE-agent chứng minh rằng các tập lệnh điều hướng và chỉnh sửa hướng-model giúp cải thiện đáng kể sự tương tác giữa language model và kho mã nguồn [13, 51].

Lĩnh vực này cũng đã sản sinh ra các agent bất đồng bộ được triển khai thực tế, có khả năng tiếp nhận tác vụ, làm việc trong môi trường cô lập và trả về các thay đổi để con người đánh giá. Sự ra mắt của OpenAI Codex và các tài liệu sau đó khi phát hành rộng rãi (general availability) mô tả việc ủy thác tác vụ trên đám mây, làm việc song song, các phiên làm việc có thể tiếp tục lại (resumable sessions), quyền truy cập SDK và các cơ chế kiểm soát quản trị [28, 29]. Đây là các hồ sơ sản phẩm chứ không phải là bằng chứng so sánh có đối chứng. Tầm quan trọng khoa học của chúng nằm ở mô hình hệ thống: **đơn vị ủy quyền là một tác vụ bền vững với một tạo phẩm có thể kiểm toán được, chứ không phải là một chuỗi các lượt hội thoại.**

Ngay cả ở đây, khả năng kiểm chứng vẫn chưa trọn vẹn. Các bộ kiểm thử chỉ mã hóa một phần hành vi dự định; các bài kiểm thử do chính agent sinh ra có thể chia sẻ cùng những giả định sai lầm của nó; việc cài đặt các thư viện phụ thuộc và quyền truy cập mạng làm phình to bề mặt tấn công; và một bản diff nhìn có vẻ hợp lý vẫn có thể đưa vào các món nợ bảo mật hoặc nợ bảo trì nằm ngoài phạm vi được kiểm thử. Do đó, các coding agent không phải là ngoại lệ đối với khoảng cách giữa hành động và thẩm định. Chúng chỉ cho thấy cách các khả năng tương tác của môi trường—như sandboxing, kiểm soát phiên bản, thực thi kiểm thử và con người đánh giá—có thể giúp thu hẹp khoảng cách đó lại như thế nào.

---

### 4.4 Hành động kỹ thuật số thực chất đã là hành động xã hội (Digital action is already social action)

Các danh mục kỹ thuật số và xã hội chồng lấn lên nhau bất cứ khi nào phần mềm đóng vai trò trung gian điều phối con người, tiền bạc, danh tiếng hoặc quyền truy cập. Việc gửi một tin nhắn, hủy một đơn đặt chỗ, chỉnh sửa một tài liệu chia sẻ, hay đăng bài trong một cộng đồng đều làm thay đổi môi trường sống của những người khác. Các bản sao benchmark cô lập các hiệu ứng này rất đúng đắn nhằm đảm bảo tính tái lặp của thí nghiệm, nhưng sự cô lập đó lại loại bỏ đi các bên bị ảnh hưởng, các điều khoản dịch vụ liên tục thay đổi, quy trình phục hồi tài khoản, và các cơ chế khiếu nại của tổ chức. Do đó, một tuyên bố về sự thành công trong một bản sao web tự lưu trữ không được phép khái quát hóa thành việc vận hành an toàn trên các tài khoản trực tiếp bất kỳ. Bước chuyển thực sự không phải là từ "web" sang "thế giới thực"; mà là từ **trạng thái có thể hoàn tác với số lượng bên liên quan có thể liệt kê được** sang **trạng thái trực tiếp mà các hậu quả của nó sẽ lan truyền vượt ra ngoài phạm vi benchmark.**

---

## 5. Sự Ủy quyền, Tính Bền bỉ và Tổ chức Multi-Agent (Delegation, persistence, and multi-agent organization)

### 5.1 Các giao thức tiêu chuẩn hóa việc trao đổi, chứ không phải sự thông minh (Protocols standardize exchange, not intelligence)

Khi các agent được trang bị nhiều công cụ hơn và thực hiện các tác vụ dài hơn, hướng tiếp cận tích hợp đã chuyển dịch từ việc nhúng mọi năng lực vào trong một ứng dụng duy nhất sang việc kết nối các thành phần được phát triển độc lập. Hai giao thức đã trở nên nổi bật nhưng giải quyết hai bài toán hoàn toàn khác nhau:
- **Model Context Protocol (MCP):** Được Anthropic giới thiệu vào năm 2024 và sau đó được phát triển như một đặc tả mở, kết nối một ứng dụng AI với các server phơi bày các công cụ (tools), tài nguyên (resources), và lời nhắc mẫu (prompts) [3, 23].
- **Agent2Agent (A2A):** Được Google công bố vào năm 2025 và được quản trị như một dự án trực thuộc Linux Foundation, hỗ trợ cơ chế khám phá (discovery) và trao đổi tác vụ giữa các agent có cấu trúc nội tại mờ đục [1, 17, 42].

Nói một cách ngắn gọn: **MCP chủ yếu là giao diện giữa ứng dụng model và năng lực (model-application-to-capability interface); trong khi A2A chủ yếu là một giao thức làm việc giữa agent với agent (agent-to-agent work protocol).**

---

### Bảng 2: Các giao diện ủy quyền khác nhau phơi bày các ngữ nghĩa bổ trợ và để lại những khoảng trống bổ trợ
*(Table 2: Different delegation interfaces expose complementary semantics and leave complementary gaps)*

| Giao diện (Interface) | Mối quan hệ chính (Primary relationship) | Trạng thái / Sự tiếp tục (State / continuation) | Khả năng kiểm soát của con người (Human-control affordance) | Những gì giao diện KHÔNG xác lập (What it does not establish) |
| :--- | :--- | :--- | :--- | :--- |
| **MCP (Bản sửa đổi 2026-07-28)** | AI host hoặc client kết nối tới server công cụ/tài nguyên | Lõi giao thức phi trạng thái (stateless core); các mã định danh tường minh (explicit handles); phần mở rộng tác vụ cho các công việc dài | Đầu vào hoặc xác nhận nhiều lượt khứ hồi (multi-round-trip) qua trung gian client | Độ an toàn của công cụ, đặc quyền tối thiểu (least privilege), thành công về mặt ngữ nghĩa, hay độ tin cậy của server [22, 23] |
| **A2A 1.0** | Client agent kết nối tới agent từ xa có cấu trúc nội tại mờ đục | Vòng đời tác vụ có trạng thái (stateful task lifecycle), định danh ngữ cảnh, các tạo phẩm (artifacts), truyền phát dữ liệu (streaming) và đẩy thông báo (push) | Trạng thái yêu cầu đầu vào (input-required), hủy bỏ (cancellation), tiếp tục tác vụ đã được xác thực | Lợi ích thực sự của việc dùng nhiều agent, các tuyên bố năng lực trung thực, hay tính đúng đắn của các tạo phẩm đã hoàn thành [1] |
| **Giao diện Agent lấy con người làm trung tâm (Human-centred agent UI)** | Bên ủy quyền con người chỉ đạo một hoặc nhiều software agent | Kế hoạch (plans), các phiên làm việc song song, các điểm kiểm tra (checkpoints), và bộ nhớ tùy chọn | Đồng lập kế hoạch (co-planning), đồng thực thi tác vụ (co-tasking), phê duyệt hành động, can thiệp, và thẩm định kết quả cuối cùng | Việc con người có thể phát hiện mọi mối nguy, hiểu rõ các phê duyệt, hay có thể giám sát hiệu quả ở quy mô lớn hay không [24] |
| **Tầng driver vật lý (Physical driver layer)** | Agent hoặc chương trình kết nối tới các thiết bị lập trình được không đồng nhất | Trạng thái thiết bị, các lệnh điều khiển, truyền phát dữ liệu đo lường, và các kịch bản có thể tái sử dụng | Các giới hạn phần cứng, danh sách cho phép (allowlists), cơ chế giám sát và leo thang phụ thuộc vào cách triển khai cụ thể | Năng lực suy luận vật lý, cảm biến được hiệu chuẩn, phục hồi lỗi tổng quát, hay độ an toàn khi không có người giám sát [5] |

---

Sự phân biệt này rất quan trọng vì mệnh đề "các agent có thể giao tiếp với nhau" có thể hàm chứa những bảo đảm rất khác nhau. MCP định nghĩa cách thức một host phát hiện những gì một server cung cấp và cách gọi nó. Bản sửa đổi ngày 28 tháng 7 năm 2026 đã áp dụng một lõi giao thức phi trạng thái, cơ chế khám phá tường minh, kết quả danh sách có thể lưu bộ nhớ đệm (cacheable), các yêu cầu nhiều lượt khứ hồi, củng cố bảo mật ủy quyền, và cơ chế mở rộng; các tác vụ chạy dài hạn được chuyển thành một phần mở rộng [22, 23]. Tầng truyền tải phi trạng thái không đòi hỏi các ứng dụng cũng phải phi trạng thái: một công cụ có thể trả về một định danh (handle) tường minh để model mang theo qua các lệnh gọi sau. A2A phiên bản 1.0 định nghĩa các Thẻ Agent (Agent Cards) cho việc khám phá, các thông điệp và tạo phẩm để trao đổi, và các tác vụ có trạng thái với các trạng thái vòng đời, tùy chọn truyền phát trực tiếp và thông báo đẩy [1]. Một tác vụ có thể chuyển sang trạng thái `input-required` và tiếp tục chạy dưới cùng các định danh đó sau khi client cung cấp thêm thông tin cần thiết.

Không có giao thức nào trong số này chứng minh được rằng một năng lực vừa được phát hiện là đáng tin cậy, rằng một agent hiểu được ý định của một agent khác, hay một trạng thái báo cáo "đã hoàn thành" thực sự tương ứng với trạng thái thế giới mà bên ủy quyền mong muốn. Việc xác thực (authentication) có thể thiết lập mối quan hệ danh tính hoặc thông tin chứng thực; nhưng nó không thẩm định được ngữ nghĩa của một tác vụ được đề xuất. Dữ liệu siêu dữ liệu về năng lực có chữ ký số có thể bảo vệ tính toàn vẹn; nhưng nó không chứng minh được năng lực thực tế. Do đó, việc áp dụng rộng rãi các giao thức chỉ là bằng chứng về một nền tảng hành động đang dần hoàn thiện, chứ không phải là bằng chứng cho thấy bài toán cộng tác tự chủ đã được giải quyết.

---

### 5.2 Ủy quyền từ Agent sang Con người là một mô hình leo thang, không phải là một giao thức đã hoàn thiện (Agent-to-human delegation is an escalation pattern, not a settled protocol)

Sự ủy quyền thường được mô tả theo một chiều duy nhất: con người giao mục tiêu cho một agent. Tuy nhiên, trong các hệ thống thực tế, chiều hướng này liên tục bị đảo ngược. Agent yêu cầu con người cung cấp thông tin còn thiếu, phê duyệt một hành động không thể đảo ngược, giải quyết xung đột giữa các chính sách, cung cấp thông tin chứng thực bí mật, thực hiện một thao tác cơ học ngoài đời thực, hoặc chịu trách nhiệm cho một phán đoán mà hệ thống không thể tự đưa ra. Điều này được hiểu đúng nhất là **sự leo thang từ agent lên con người (agent-to-human escalation)** hơn là sự ủy quyền trọn vẹn một công việc cho con người. Trong số các tạo phẩm được kiểm tra tính đến ngày chốt khảo cứu, chưa có bất kỳ hệ thống nào xác định được một giao thức tổng quát cho việc tuyển dụng, chi trả thù lao, sắp xếp độ ưu tiên và kiểm định công việc tùy ý của con người giữa các tổ chức khác nhau.

Các mảnh ghép của sự tương tác này đã bắt đầu xuất hiện. Cơ chế khơi gợi đầu vào (elicitation) của MCP đã giới thiệu các yêu cầu do server khởi xướng để thu thập đầu vào có cấu trúc từ người dùng, trong đó client có toàn quyền kiểm soát cách hiển thị yêu cầu và cho phép người dùng chấp nhận, từ chối hoặc hủy bỏ [21]. Cơ chế nhiều lượt khứ hồi (multi-round-trip) sau đó đã tổng quát hóa các yêu cầu giữa chừng trong một tầng truyền tải phi trạng thái [22]. Trạng thái `input-required` của A2A hỗ trợ việc tiếp nhận thêm đầu vào trong suốt một tác vụ bền bỉ [1]. Magentic-UI cung cấp một nguyên mẫu nghiên cứu phong phú hơn: đồng lập kế hoạch (co-planning), đồng thực thi tác vụ (co-tasking), quản lý đa tác vụ, các chốt phòng vệ hành động (action guards), bộ nhớ và xác minh câu trả lời cuối cùng xung quanh một hệ thống web và lập trình đa agent [24]. Báo cáo kỹ thuật của nó kết hợp giữa đánh giá benchmark, người dùng mô phỏng, các nghiên cứu định tính và các bài kiểm tra an toàn mục tiêu; những kết quả này mang lại nhiều thông tin giá trị nhưng chưa thể chứng minh được rằng sự giám sát nặng về phê duyệt vẫn duy trì được hiệu quả trong thời gian dài hoặc dưới khối lượng tác vụ lớn.

Chiều tương tác ngược lại cũng đã bắt đầu vượt ra ngoài phạm vi các giao diện làm rõ thông tin đơn thuần. Tài liệu kỹ thuật của RentAHuman phơi bày một MCP server và REST API cho phép một agent đã được xác thực có thể tìm kiếm người làm, tạo một phần thưởng (bounty), chấp nhận một ứng viên, thanh tra bằng chứng được nộp lên, và giải phóng khoản tiền ký quỹ (escrowed payment) [34]. Đây là một giao diện thị trường mới nổi, chứ không phải một giao thức tổng quát hay bằng chứng cho thấy lao động do agent chỉ đạo là an toàn trên diện rộng. Một bản thảo sơ bộ vào tháng 2 năm 2026 đã phân tích 303 khoản bounty trên chính thị trường này và xác định được 99 khoản (32,7%) xuất phát từ các kênh API-key hoặc MCP. Phân tích đối sánh độc lập (dual-coder analysis) của nghiên cứu đã phát hiện ra các hành vi gian lận thông tin chứng thực, mạo danh danh tính, do thám, thao túng mạng xã hội, phá vỡ xác thực và gian lận mã giới thiệu trong số các tác vụ được đăng tải [20]. Mặc dù nghiên cứu này chỉ giới hạn trên một nền tảng đơn lẻ, một lát cắt thời gian duy nhất và thí nghiệm sàng lọc hồi cứu không thể xác lập mối quan hệ nhân quả hay tỷ lệ phổ biến trên toàn hệ sinh thái, nó vẫn chỉ ra rõ ràng lý do tại sao việc thực thi từ agent sang con người không chỉ là một tính năng giao diện người dùng: **một agent có thể dùng tiền để mua sự hiện diện vật lý, quyền truy cập phụ thuộc vào danh tính con người, hoặc sức ảnh hưởng xã hội nhằm vượt qua chính các ranh giới kỹ thuật trong môi trường runtime của nó.**

Do đó, sự tham gia của con người cần phải được đánh giá như một kênh kiểm soát có những chế độ lỗi (failure modes) rất riêng. Các câu nhắc phê duyệt có thể xuất hiện quá thường xuyên, quá nặng về mặt kỹ thuật, hoặc được kích hoạt quá muộn sau khi quyết định có tính hệ quả thực sự đã diễn ra. Con người có thể rơi vào tình trạng quen tay (habituation), hiểu sai mức độ rủi ro được trình bày, hoặc nhắm mắt phê duyệt (rubber-stamp) một khuyến nghị mà agent trình bày với vẻ ngoài quá tự tin. Ngược lại, việc bắt buộc phải xác nhận cho từng hành động nhỏ có thể triệt tiêu hoàn toàn giá trị của sự ủy quyền. Sự ủy quyền qua trung gian thị trường phát sinh thêm các vấn đề về sự đồng thuận của người lao động, thù lao, danh tính, quyền tài phán pháp lý, việc sàng lọc các tác vụ bị cấm, tính toàn vẹn của bằng chứng, giải quyết tranh chấp và thẩm quyền chi tiêu tài chính. Vấn đề nghiên cứu cốt lõi ở đây là khơi gợi sự phán đoán của con người ở đúng nơi nó làm thay đổi ranh giới quyết định, tự động hóa các bước kiểm tra có thể thực hiện nhanh hơn và tin cậy hơn bằng mã nguồn, và ngăn chặn hành động thuê mướn con người trở thành một con đường leo thang năng lực ngoài tầm kiểm soát.

---

### 5.3 Hệ thống Multi-Agent đánh đổi tính mô-đun để lấy rủi ro phối hợp (Multi-agent systems trade modularity for coordination risk)

Các kiến trúc multi-agent phân chia công việc giữa các vai trò khác nhau như bộ lập kế hoạch (planner), nhà nghiên cứu (researcher), lập trình viên (coder), nhà phê bình (critic), hoặc bộ thực thi (executor). AutoGen đã biến các tổ chức hội thoại như vậy thành các quy trình có thể lập trình được và hỗ trợ các agent được vận hành bởi model, công cụ hoặc con người [49]. Magentic-One sau đó đã ghép nối một bộ điều phối trung tâm với các agent chuyên biệt về web, tệp tin, lập trình và dòng lệnh trong một hệ thống báo cáo kỹ thuật mở [11]. Cấu trúc tổ chức này có thể cô lập các công cụ, giảm sự cạnh tranh ngữ cảnh, cho phép xử lý song song, và làm cho các ranh giới trách nhiệm trở nên rõ ràng. Tuy nhiên, nó cũng có thể tiêu tốn nhiều ngân sách suy luận hơn, lặp lại các bằng chứng dư thừa, lan truyền sai lầm của một model qua nhiều vai trò khác nhau, và che khuất thành phần nào thực sự đã đưa ra một lựa chọn có tính hệ quả.

Câu hỏi thực nghiệm đặt ra không phải là liệu nhiều vai trò có tên gọi nghe có vẻ hợp lý hay không, mà là liệu chúng có cải thiện được hiệu năng so với một đường cơ sở có cùng ngân sách tính toán (matched-budget baseline) trên tác vụ tương ứng hay không. Một bản thảo sơ bộ năm 2026 chỉ ra rằng các hệ thống đơn agent (single-agent) đạt hiệu năng ngang bằng hoặc vượt trội hơn nhiều tổ chức multi-agent trong các bài toán suy luận đa bước (multi-hop reasoning) khi ngân sách token suy luận (reasoning-token budgets) được giữ cố định, đồng thời chỉ ra các lỗi kỹ thuật về API và benchmark có thể làm thổi phồng những lợi ích bề nổi [45]. Kết quả này dù chỉ giới hạn trên các model và tác vụ suy luận được thử nghiệm, nhưng nó đã thiết lập một nguyên tắc đánh giá bắt buộc: **phải so sánh trong điều kiện điện toán tương đương và phải báo cáo chi phí điều phối (coordination overhead).**

Bằng chứng đã qua bình duyệt về tranh luận giữa các agent (multi-agent debate) bổ sung thêm một cảnh báo khác. Becker và các cộng sự nhận thấy rằng các cuộc thảo luận có xu hướng bị trôi dạt khỏi vấn đề ban đầu qua các lượt đối thoại; phân tích của con người quy các trường hợp phổ biến này cho việc thiếu tiến triển, phản hồi kém chất lượng và thiếu sự rõ ràng [7]. Đối thoại nhiều hơn không đồng nghĩa với việc suy luận tốt hơn một cách tuyến tính.

Các hệ thống multi-agent chỉ thực sự có giá trị bảo vệ vững chắc nhất khi sự phân rã tương ứng với sự không đồng nhất thực sự (genuine heterogeneity): các quyền hạn khác nhau, các model khác nhau, các cảm biến khác nhau, các chủ sở hữu tổ chức khác nhau, hoặc chuyên môn có thể thẩm định độc lập. Việc tạo ra nhiều bản sao của cùng một model rồi gán cho các vai trò khác nhau thông qua prompt có thể làm tăng tính đa dạng của quá trình tìm kiếm, nhưng không tự động cung cấp các bằng chứng độc lập. Việc dùng chung dữ liệu huấn luyện, prompt, công cụ và nguồn truy xuất sẽ tạo ra **lỗi có tương quan (correlated error)**. Một agent đóng vai phản biện (critic) nhưng nhìn thấy cùng một ngữ cảnh sai lệch như agent thực thi thì không thể coi là một bộ thẩm định độc lập từ bên ngoài.

---

### 5.4 Tính bền bỉ không phải là một năng lực đơn lẻ (Persistence is not one capability)

Tính bền bỉ của agent (persistent agency) cũng là một tập hợp gồm nhiều thuộc tính hoàn toàn khác biệt:
- **Tính bền bỉ tương tác (Interaction persistence):** Duy trì trạng thái hội thoại qua các lượt trao đổi.
- **Tính bền bỉ tác vụ (Task persistence):** Cho phép công việc có thể tạm dừng, tiếp tục lại, hoặc thực thi bất đồng bộ.
- **Bộ nhớ từng hồi (Episodic memory):** Lưu trữ các quan sát và phản tư qua nhiều lần gặp gỡ khác nhau.
- **Tính bền bỉ kỹ năng (Skill persistence):** Bảo toàn các quy trình thực thi đã học được từ các tác vụ trước.
- **Tính bền bỉ môi trường (Environmental persistence):** Trạng thái thế giới tiếp tục tiến triển hoặc giữ nguyên sự thay đổi ngay cả khi nằm ngoài tầm quan sát hiện tại của agent.
- **Tính bền bỉ thẩm quyền (Authority persistence):** Giữ lại các thông tin chứng thực hoặc quyền hành động sau khi phiên tương tác ban đầu đã kết thúc.

Nghiên cứu *Generative Agents* minh họa tính bền bỉ từng hồi và môi trường trong một mô phỏng xã hội có đối chứng. Hai mươi lăm agent language model đã duy trì các dòng bộ nhớ, sinh ra các phản tư, lập kế hoạch hoạt động hàng ngày và tương tác trong một môi trường tương tự như trò chơi The Sims; các thử nghiệm loại trừ (ablations) đã liên kết bộ nhớ, phản tư và việc lập kế hoạch với mức độ đáng tin cậy được đánh giá [32]. *Voyager* minh họa tính bền bỉ kỹ năng: một chương trình giảng dạy tự động (automatic curriculum), một thư viện mã nguồn có thể thực thi, phản hồi từ môi trường, và cơ chế sửa lỗi lặp đi lặp lại đã hỗ trợ cho việc khám phá mở trong trò chơi Minecraft [47]. Các sản phẩm hỗ trợ lập trình và các tác vụ A2A minh họa tính bền bỉ tác vụ có thể tiếp tục lại [1, 29]. Tuy nhiên, không có hệ thống nào trong số này tự thân nó cấp được thẩm quyền định kỳ hợp pháp.

Sự phân biệt này mang tính quyết định sống còn vì **các quyền hạn lâu dài tạo ra rủi ro khác biệt về mặt bản chất so với bộ nhớ lâu dài.** Một agent được lên lịch chạy định kỳ có thể liên tục sửa đổi các hệ thống thực tế có thể sẽ đối mặt với các chính sách đã thay đổi, các giả định đã hết hạn, hoặc những bên bị ảnh hưởng mới xuất hiện. Nó đòi hỏi phải có các điều kiện gia hạn rõ ràng, cơ chế thu hồi quyền hạn, giới hạn ngân sách, các điểm kiểm tra an toàn và bản ghi kiểm toán chi tiết. Các benchmark dành cho agent chạy dài hạn đang bắt đầu nhắm vào việc giám sát và công việc bất đồng bộ, nhưng bằng chứng công khai được khảo sát ở đây mạnh hơn đáng kể đối với việc hoàn thành các episode có ranh giới rõ ràng so với việc quản lý các nghĩa vụ kéo dài qua nhiều tuần hoặc nhiều tháng. Do đó, tính bền bỉ phải được báo cáo chi tiết theo từng đối tượng cụ thể, chứ không thể suy diễn một cách mơ hồ từ cụm từ "agent dài hạn" ("long-term agent").

---

## 6. Môi trường Ảo Bền bỉ và World Models (Persistent virtual environments and world models)

### 6.1 Agent và World Model chiếm giữ hai phía khác nhau của vòng lặp (Agents and world models occupy different sides of the loop)

Cụm từ "world model" (mô hình thế giới) đang được sử dụng cho các hệ thống có cấu trúc biểu diễn hoàn toàn khác biệt về mặt bản chất:
- Một mô hình tiềm ẩn mang tính dự đoán (predictive latent model) được sử dụng để lập kế hoạch;
- Một bộ sinh video có điều kiện hành động (action-conditioned video generator);
- Một mô phỏng có cấu trúc tường minh (explicit structured simulation); hoặc
- Một nền tảng chuyên sản sinh ra các môi trường tương tác.

Các hệ thống này chủ yếu nằm ở **phía môi trường hoặc phía dự đoán** trong Hình 1. Ngược lại, một agent là thực thể duy trì hoặc tiếp nhận một mục tiêu và lựa chọn hành động. Một world model có thể giúp một agent lường trước các hậu quả hoặc cung cấp kinh nghiệm huấn luyện, nhưng tự thân nó không phải là bằng chứng của quyền tự chủ định hướng mục tiêu trừ khi có một agent được đánh giá thực sự khép kín vòng lặp thông qua nó.

Sự phân biệt này giúp làm sáng tỏ nhiều kết quả nghiên cứu có tầm ảnh hưởng lớn:
- Dự án **SIMA** huấn luyện một agent có thể tiếp nhận chỉ dẫn trên nhiều môi trường nghiên cứu và trò chơi 3D thương mại, sử dụng hình ảnh màn hình và ngôn ngữ tự nhiên làm đầu vào và các thao tác bàn phím–chuột làm đầu ra. Báo cáo kỹ thuật năm 2024 nhấn mạnh giao diện tổng quát giống con người và khả năng khái quát hóa xuyên môi trường, trong khi tập tác vụ ban đầu chủ yếu tập trung vào các kỹ năng cơ bản được hoàn thành trong các thang thời gian ngắn [39].
- **Voyager** thay vào đó sử dụng một chương trình giảng dạy tự động, phản hồi từ môi trường, quá trình sinh mã lặp đi lặp lại, và một thư viện kỹ năng thực thi không ngừng mở rộng để khám phá thế giới Minecraft [47]. Cả hai đều là các agent hoạt động trong môi trường mô phỏng. Kết quả của chúng củng cố các khẳng định về khả năng gắn kết ngôn ngữ với thực tế (language grounding), khả năng chuyển giao, sự khám phá và tính bền bỉ bên trong các thế giới được đánh giá; nhưng chúng không chứng minh được độ vững chắc về mặt vật lý hay thẩm quyền trong các hệ thống xã hội trực tiếp.

Các dự án mô hình nền tảng thế giới (world-foundation-model) nhắm vào cơ sở hạ tầng bổ trợ:
- Bản thảo sơ bộ về **Cosmos** của NVIDIA mô tả quy trình tuyển chọn video, mã hóa token, các world foundation model được huấn luyện trước, và các thành phần hậu huấn luyện (post-training) phục vụ cho việc phát triển AI vật lý (physical AI) [27].
- **V-JEPA 2** học các biểu diễn dự đoán từ hơn một triệu giờ video và sau đó hậu huấn luyện một model có điều kiện hành động với chưa đầy 62 giờ video robot không gán nhãn; báo cáo này chứng minh khả năng lập kế hoạch không cần mẫu (zero-shot) để đạt được mục tiêu bằng hình ảnh trên các cánh tay robot Franka tại hai phòng thí nghiệm [6].

Những kết quả này kết nối việc học biểu diễn với việc lập kế hoạch một cách trực tiếp hơn so với việc sinh hình ảnh trông có vẻ hợp lý đơn thuần. Tuy nhiên, chúng vẫn ở dạng bằng chứng bản thảo sơ bộ (preprint), và các tác vụ thao tác được trình diễn chưa kiểm tra các mục tiêu dài hạn, phần cứng không đồng nhất, hay môi trường con người mở.

---

### 6.2 Tính liên tục về thị giác không phải là trạng thái thế giới bền vững (Visual continuity is not persistent world state)

Các thế giới tương tác được sinh ra (generative interactive worlds) mở rộng phạm vi môi trường nơi các agent có thể học hỏi hoặc được đánh giá. Bản xem trước **Genie 3** của Google DeepMind báo cáo các môi trường có điều kiện văn bản có thể điều hướng ở tốc độ 24 khung hình/giây và độ phân giải 720p, với tương tác nhìn chung nhất quán trong vài phút và bộ nhớ thị giác kéo dài khoảng một phút [33]. Tuy nhiên, chính thông báo này đã nêu rõ các giới hạn về hành động trực tiếp của agent, tương tác đa agent, độ chính xác về địa lý, việc kết xuất văn bản và thời lượng tương tác, đồng thời phân loại quyền truy cập ở mức bản xem trước nghiên cứu hạn chế. Thông báo cũng khẳng định rõ rằng Genie mô phỏng các hệ quả từ hành động mà không hề biết mục tiêu của agent đi kèm. Đây chính là sự phân tách rành mạch giữa môi trường và agent mà một cách diễn giải khoa học cẩn trọng đòi hỏi.

Sự hồi quy thuần túy trên điểm ảnh (pure pixel recurrence) có một hạn chế mang tính cố hữu: những gì không nhìn thấy được có thể bị nén vào một ngữ cảnh hữu hạn gần đây thay vì được lưu trữ như một thực thể có thể truy vấn độc lập. Một khung cảnh có thể trông rất mạch lạc xuyên suốt một quỹ đạo di chuyển của camera nhưng lại thất bại hoàn toàn trong việc duy trì tính vĩnh cửu của vật thể (object permanence) sau một khoảng thời gian bị che khuất dài, cho phép các góc nhìn không tương thích cùng tồn tại, hoặc làm thay đổi các biến nhân quả mà không để lại bất kỳ bản ghi ổn định nào. Do đó, việc đánh giá cần phải phân biệt ít nhất bốn thuộc tính sau:
1. Tính liên tục thị giác trong phạm vi ngắn (short-range visual continuity);
2. Tính nhất quán không gian độc lập với camera (camera-independent spatial consistency);
3. Danh tính và thuộc tính vật thể bền vững (persistent object identity and attributes);
4. Sự chuyển đổi trạng thái nhất quán theo quy luật dưới các tác động can thiệp (rule-consistent state transitions under intervention).

Dự án **Project Eden** của VAST AI Research là một ví dụ biên giới tiêu biểu vì thiết kế được công bố của nó nhắm thẳng vào sự phân biệt này. Bản xem trước nghiên cứu từ bên thứ nhất vào tháng 6 năm 2026 mô tả một world model nhiều người chơi bền vững, phân tách một trạng thái thế giới có cấu trúc, độc lập với camera đang tiến triển khỏi giao diện chuyển-trạng-thái-thành-quan-sát và cơ chế kết xuất nơ-ron tạo sinh [46]. Kiến trúc được công bố này rất phù hợp với sự phân biệt của bài tổng quan: các vật thể và những thay đổi ngoài màn hình (off-screen) về mặt nguyên tắc có thể được giữ lại trong một trạng thái dùng chung thay vì chỉ được tái dựng từ các pixel gần nhất, và nhiều người dùng hoặc nhiều agent có thể cùng hành động trên trạng thái đó. Tuy nhiên, nguồn tài liệu này cũng xác định rằng các hiệu ứng vật lý phong phú hơn, môi trường quy mô lớn hơn, khả năng khám phá tự do góc nhìn rộng hơn, tương tác vật thể tinh vi hơn, mô hình chuyển đổi trạng thái mạnh hơn, và đánh giá sâu rộng hơn vẫn là các công việc trong tương lai.

Vì vậy, Project Eden chỉ nên xuất hiện trong bài tổng quan như một điểm bằng chứng ở vùng biên giới của tính bền bỉ môi trường, chứ không phải là luận điểm cốt lõi. Tại thời điểm chốt khảo cứu, đây là một bản xem trước nghiên cứu của doanh nghiệp, không phải một bài báo đã qua bình duyệt, không phải một model mở, và chưa có benchmark agent nào được tái lập độc lập. Cách dùng từ "đầu tiên" ("first") trong tài liệu là một tuyên bố định vị thương mại mà bài tổng quan này không tiếp nhận. Bằng chứng hiện có chỉ hỗ trợ cho sự tồn tại và kiến trúc đã công bố của một bản xem trước; nó chưa đủ để hỗ trợ cho các tuyên bố tổng quát về tính nhất quán trên chân trời dài, lợi ích học tập của multi-agent, hay các agent tự chủ hoàn toàn.

---

### 6.3 Các tạo phẩm 3D được sinh ra và các thế giới tương tác đòi hỏi phải đánh giá riêng biệt (Generated 3D artifacts and interactive worlds require separate evaluation)

Một hướng nghiên cứu khác yêu cầu các agent phải tự xây dựng các môi trường ba chiều thay vì chỉ hành động bên trong chúng. **VibeWorlding**, một bản thảo sơ bộ năm 2026, đánh giá các agent đa phương thức có khả năng kiến tạo các tạo phẩm thế giới mở 3D từ đầu đến cuối [26]. Tác vụ này kết hợp việc lập trình, tạo tài nguyên đồ họa (asset creation), bố cục không gian và phản hồi thị giác lặp đi lặp lại. Đây là bằng chứng về việc sản sinh tạo phẩm mang tính tác tử bên trong một môi trường cô lập (sandbox). Việc gọi tạo phẩm thu được là một "thế giới mở" không hề làm cho môi trường thực thi trở nên mở theo nghĩa quản trị an toàn: toàn bộ quá trình xây dựng vẫn có thể được giới hạn ranh giới, hoàn tác và thanh tra toàn diện.

Sự phân tách này gợi ý một ma trận đánh giá mang lại nhiều thông tin hơn cho các nghiên cứu hành động trong thế giới:
- **Các mô hình môi trường (Environment models):** Cần được kiểm tra về độ chính xác phản thực nghiệm (counterfactual accuracy), tính bền bỉ của trạng thái, tính nhất quán nhân quả, khả năng điều khiển được, và độ bao phủ các sự kiện liên quan đến lỗi.
- **Các agent:** Cần được kiểm tra về khả năng hoàn thành mục tiêu, hiệu quả khám phá, khả năng phục hồi, sự tuân thủ chính sách, và khả năng khái quát hóa.
- **Hệ thống kết hợp (Joint system):** Phải được kiểm tra về hiện tượng khai thác lỗ hổng mô hình (model exploitation): một agent có thể học được các "đường tắt" (shortcuts) giúp thành công vang dội trong thế giới đã học nhưng sẽ thất bại thảm hại dưới các quy luật động lực học của môi trường đích thực tế. Một thế giới được sinh ra dù rất đa dạng nhưng nếu sai lệch về mặt nhân quả thì có thể khiến quá trình huấn luyện trở nên kém hữu ích, thậm chí phản tác dụng.

---

### 6.4 Lý do tại sao các môi trường ảo vẫn giữ vai trò không thể thay thế (Why virtual environments remain indispensable)

Những hạn chế nêu trên không hề làm giảm đi giá trị khoa học to lớn của các môi trường ảo. Các trình mô phỏng (simulators) giúp cho các sự kiện nguy hiểm hoặc hiếm gặp có thể được lặp lại an toàn, cho phép thực hiện các phép thử phản thực nghiệm có đối chứng, phơi bày trạng thái ẩn cho các bộ đánh giá, và hỗ trợ việc tạo ra chương trình huấn luyện ở quy mô khổng lồ. Các thế giới chia sẻ bền vững cũng cung cấp một bối cảnh thuận lợi để nghiên cứu sự phối hợp, bộ nhớ, các quy chuẩn ứng xử, và sự cạnh tranh tài nguyên mà không làm phát sinh các chi phí ngoại ứng thực tế tương ứng. Sai lầm không nằm ở chỗ sử dụng môi trường mô phỏng; sai lầm nằm ở chỗ quên mất rằng trình mô phỏng đã triệt tiêu đi những yếu tố bất định nào.

Một lộ trình đáng tin cậy hướng tới việc triển khai trong môi trường vật lý hoặc xã hội đòi hỏi phải có **quá trình chuyển giao theo từng giai đoạn (staged transfer)**:
1. Đầu tiên, thiết lập năng lực và khả năng phục hồi trong một môi trường hoàn toàn có thể thanh tra được;
2. Sau đó, đưa vào nhiễu quan sát, các hiệu ứng trễ, sự hiện diện của các agent khác, các quy tắc không dừng (non-stationary rules), và khả năng hoàn tác chỉ một phần;
3. Xác thực một giao diện thực tế có giới hạn đằng sau các ràng buộc cứng trước khi mở rộng phạm vi hành động.

Các world model có thể đẩy nhanh từng giai đoạn này bằng cách tạo ra các kịch bản hoặc dự đoán kết quả, nhưng bằng chứng thẩm định cuối cùng bắt buộc phải đến từ chính môi trường mà việc triển khai sẽ phải gánh chịu rủi ro.

---

## 7. Giao diện Vật lý, Robotics và các Phòng Thí nghiệm Tự hành (Physical interfaces, robotics, and autonomous laboratories)

### 7.1 Hành động vật lý làm thay đổi bài toán thẩm định (Physical action changes the validation problem)

Khi một agent hành động thông qua một thiết bị vật lý, các sai lầm không còn bị giới hạn bên trong trạng thái thông tin thuần túy nữa. Tri giác chỉ là một phần và luôn bị nhiễu; quá trình hiệu chuẩn (calibration) bị trôi dạt theo thời gian; các cơ cấu chấp hành (actuators) có độ trễ và dung sai; vật liệu có thể bị biến dạng, đổ tràn, hao mòn cơ học, hoặc phản ứng hóa học; và con người có thể cùng chia sẻ không gian làm việc. Cùng một chỉ dẫn cấp cao có thể đòi hỏi các quỹ đạo di chuyển an toàn hoàn toàn khác nhau trên các thiết bị trên danh nghĩa là giống hệt nhau. Việc quay ngược lại một bản chụp trạng thái phần mềm (software snapshot) hoàn toàn không có bất kỳ giải pháp tương đương nào trong thế giới vật lý. Do đó, tính tác tử vật lý (physical agency) đòi hỏi phải có bằng chứng về cả **mục tiêu được lựa chọn** lẫn **bộ điều khiển thực thi (execution controller)** có nhiệm vụ hiện thực hóa mục tiêu đó.

Các mô hình thị giác-ngôn ngữ-hành động (Vision-Language-Action - VLA models) kết nối các chỉ dẫn ngữ nghĩa và quan sát thị giác trực tiếp tới các hành động của robot:
- **RT-2** đã đồng tinh chỉnh (co-fine-tuned) các vision-language model trên các tác vụ thị giác–ngôn ngữ quy mô web và các quỹ đạo robot, biểu diễn các hành động dưới dạng các token. Nghiên cứu đã qua bình duyệt này báo cáo 6.000 lượt thử nghiệm đánh giá và cho thấy khả năng khái quát hóa được cải thiện đối với các vật thể và chỉ dẫn mới lạ, bao gồm cả suy luận ngữ nghĩa sơ khai [57].
- **OpenVLA** đã huấn luyện một VLA model mã nguồn mở với 7 tỷ tham số trên 970.000 episode của robot và đánh giá nó trên nhiều dạng hình thái robot (robot embodiments) và bộ tác vụ thao tác khác nhau [14].
- Báo cáo kỹ thuật của **Gemini Robotics** mô tả một họ các mô hình VLA và suy luận hiện thân (embodied-reasoning models) được đánh giá trên nhiều thao tác phức tạp, các vật thể và môi trường mới lạ, cũng như khả năng thích ứng với các hình thái robot bổ sung [12].

Các hệ thống này là bằng chứng quan trọng cho thấy các biểu diễn từ foundation model có thể cải thiện khả năng khái quát hóa của các chính sách robot. Tuy nhiên, chúng không nên được tự động xếp vào loại các agent tự chủ bền bỉ. Một VLA model có thể ánh xạ một chỉ dẫn và một quan sát hiện tại thành một chuỗi ngắn các hành động vận động mà không hề nắm giữ mục tiêu cấp cao, không duy trì thẩm quyền lâu dài, hay không tự quyết định khi nào thì một thí nghiệm nên dừng lại. Tầng điều phối (orchestration layer) có nhiệm vụ lựa chọn tác vụ, diễn giải các ràng buộc an toàn và thẩm định kết quả thường vẫn là một thành phần tách biệt. Việc báo cáo kết quả cần chỉ rõ tầng nào đã được đánh giá và liệu phân phối hành động có bao gồm con người, các vật thể dễ vỡ, chướng ngại vật bất ngờ, hay các lỗi hỏng hóc hay không.

---

### 7.2 Tiêu chuẩn phần cứng là một tuyên bố về mặt giao diện (A hardware standard is an interface claim)

**Tiêu chuẩn Phần cứng Model (Model Hardware Standard - MHS)** làm cho kiến trúc phân tầng này trở nên tường minh. Thông báo ngày 27 tháng 8 năm 2026 của Anthropic mô tả một bản xem trước nghiên cứu hạn chế, ban đầu được phát triển cùng với HHMI Janelia, đề xuất một lớp driver độc lập với model (model-agnostic driver) dành cho các thiết bị sản xuất và phòng thí nghiệm có thể lập trình được [5]. Các thiết bị phơi bày trạng thái có thể khám phá được và các hàm nguyên thủy đơn giản theo kiểu đọc/ghi (read/write); các thẻ ngôn ngữ tự nhiên mô tả các đặc tính và các giới hạn an toàn bắt buộc; và các agent có thể truy cập các driver này thông qua MCP, công cụ dòng lệnh (CLI), hoặc mã nguồn. Thông báo trình bày các thử nghiệm chứng minh khái niệm (proof-of-concept) trải rộng trên kính hiển vi, máy xử lý chất lỏng tự động, cánh tay robot, giám sát qPCR, tối ưu hóa xét nghiệm sinh học, và căn chỉnh tia laser.

MHS có ý nghĩa quan trọng ở đây như một đề xuất giao diện vì nó kết nối tầng công cụ kỹ thuật số với thiết bị đo đạc vật lý thông qua một cấu trúc trừu tượng hóa chung. Tuy nhiên, nó không phải là bằng chứng cho thấy quyền tự chủ vật lý đã được tiêu chuẩn hóa. Tại thời điểm chốt khảo cứu, quyền truy cập còn bị hạn chế, thông báo này diễn ra trước một đợt phát hành mã nguồn mở đã hứa hẹn, và các bản trình diễn được báo cáo do chính Anthropic và các phòng thí nghiệm tham gia cung cấp chứ chưa thông qua một chương trình kiểm định hợp chuẩn độc lập. Chính nguồn tài liệu này cũng mô tả các công việc tiếp theo về đánh giá an toàn và các thực hành tốt nhất, và các tài khoản của đối tác đã xác định những lỗi hỏng hóc vẫn đòi hỏi sự can thiệp và hiểu biết vật lý chuyên sâu của các chuyên gia con người. Một driver chung có thể giảm bớt nỗ lực tích hợp và phơi bày các siêu dữ liệu an toàn; nhưng nó không thể tự suy diễn ra các giới hạn chính xác, không thể đảm bảo rằng các thẻ mô tả là đầy đủ, hay không thể làm cho một model tự hiểu được động lực học chất lưu và rủi ro va chạm cơ học.

Do đó, phép so sánh đúng đắn phải là giữa MHS và các giao diện hành động phần mềm trước đó, chứ không phải giữa MHS và một "bộ não robot đa năng". Tương tự như MCP, nó định nghĩa cách thức phơi bày các năng lực. Nhưng không giống như một giao thức công cụ kỹ thuật số thuần túy, các lệnh của nó cuối cùng sẽ vượt qua ranh giới vật lý. Điều này làm phát sinh thêm các yêu cầu bắt buộc:
- Các khóa liên động cơ học được chứng nhận trên thiết bị (device-certified interlocks);
- Siêu dữ liệu về đơn vị đo và quá trình hiệu chuẩn;
- Độ tươi mới (freshness) và độ bất định của các giá trị cảm biến;
- Khai báo tính lũy kế (idempotency declarations);
- Chế độ mô phỏng hoặc chạy thử không tải (dry-run modes);
- Nút dừng khẩn cấp (emergency stops) hoàn toàn độc lập với model;
- Bản ghi chỉ cho phép ghi nối tiếp (append-only records) liên kết ý định cấp cao với các lệnh điều khiển cấp thấp.

---

### 7.3 Các phòng thí nghiệm tự hành cung cấp bằng chứng vòng lặp khép kín có giới hạn (Autonomous laboratories supply bounded closed-loop evidence)

Các phòng thí nghiệm khoa học cung cấp một trong những minh chứng rõ ràng nhất về việc các agent language model tác động lên thế giới vật lý, bởi vì các thí nghiệm vốn đã có sẵn các thiết bị đo đạc, quy trình chuẩn, các phép đo lường và sự so sánh đối chiếu của các chuyên gia:
- **Coscientist** kết hợp GPT-4 với việc tìm kiếm tài liệu và hướng dẫn kỹ thuật, thực thi mã nguồn và tự động hóa thí nghiệm. Bài báo trên tạp chí *Nature* đã đánh giá sáu tác vụ, bao gồm việc tối ưu hóa các phản ứng ghép cặp chéo có xúc tác palađi, và mô tả hệ thống này hỗ trợ việc thiết kế và thực thi thí nghiệm bán tự hành (semi-autonomous experimental design and execution) [8].
- **ChemCrow** ghép nối một language model với 18 công cụ định hướng hóa học và đã chứng minh khả năng lập kế hoạch và thực thi các phản ứng tổng hợp được lựa chọn dưới một quy trình làm việc do các chuyên gia thiết kế [9].

Những nghiên cứu này xác lập rằng các hệ thống ngôn ngữ được tăng cường công cụ có thể khép kín một phần của vòng lặp **thiết kế – chế tạo – thử nghiệm – phân tích (design–make–test–analyze loop)** bên trong một hệ thống thiết bị có giới hạn.

Tuy nhiên, chúng không chứng minh được sự tồn tại của một "nhà khoa học tổng quát không cần người giám sát". Mục tiêu nghiên cứu và các công cụ khả dụng đã được định sẵn từ trước; việc tiếp cận hóa chất và quyền thực thi bị hạn chế nghiêm ngặt; một số lượng nhỏ các bản trình diễn không thể ước tính được các mối nguy hiểm hiếm gặp; và sự phán đoán của chuyên gia vẫn là yếu tố sống còn để diễn giải xem liệu một quy trình có ý nghĩa khoa học thực sự hay không. Tính đúng đắn khoa học cũng có nhiều tầng nấc: một hệ thống có thể thực thi chính xác quy trình được yêu cầu, tạo ra một phép đo lường hợp lệ, rút ra một kết luận nhất quán về mặt logic nội tại, nhưng vẫn có thể đặt sai câu hỏi nghiên cứu hoặc bỏ qua một cách giải thích thay thế hoàn toàn khác. Sự thành công của thiết bị và tính hợp lệ khoa học đòi hỏi các bộ đánh giá hoàn toàn khác nhau.

Dự án **AILA (Artificially Intelligent Lab Assistant)** và **AFMBench** đã mở rộng trọng tâm đánh giá này sang lĩnh vực kính hiển vi lực nguyên tử (atomic force microscopy - AFM). Nghiên cứu năm 2025 trên *Nature Communications* đã đánh giá các quy trình làm việc đơn agent và đa agent xuyên suốt các khâu thiết kế thí nghiệm, vận hành và phân tích, qua đó phát hiện ra rằng hiệu năng trả lời câu hỏi chuyên ngành không đồng nghĩa với năng lực vận hành phòng thí nghiệm thực tế. Nghiên cứu cũng báo cáo sự nhạy cảm với định dạng prompt và các hiện tượng đi chệch chỉ dẫn được gọi là **"mộng du" ("sleepwalking")**, bất chấp những lợi ích của mô hình multi-agent trong bối cảnh được đánh giá [19]. Đây là bằng chứng trực tiếp khác thường củng cố luận điểm trung tâm của bài viết: **quyền tiếp cận một quy trình thí nghiệm hoàn chỉnh có thể tiến triển nhanh hơn nhiều so với khả năng tuân thủ một cách vững chắc các chỉ dẫn của quy trình đó.**

Các phòng thí nghiệm tự hành thực chất đã xuất hiện từ trước làn sóng language-agent hiện tại. **A-Lab** đã tích hợp robotics, cơ sở dữ liệu, diễn giải học máy, tri thức tổng hợp được khai phá từ văn bản, và học chủ động (active learning) phục vụ cho việc tổng hợp vật liệu vô cơ [43]. Bản đính chính của tác giả vào tháng 1 năm 2026 đã điều chỉnh lại các tuyên bố về tính mới lạ của vật liệu và kết quả tổng hợp; do đó chúng tôi sử dụng A-Lab ở đây như một bằng chứng về sự tích hợp hệ thống, chứ không phải một con số tuyệt đối về các vật liệu mới [44]. Dòng phát triển này cho thấy rằng quyền tự chủ theo vòng lặp khép kín phụ thuộc vào nhiều yếu tố vượt xa một LLM: các bộ lập lịch trình đáng tin cậy, các thiết bị được hiệu chuẩn chính xác, mẫu thí nghiệm có thể đọc bằng máy, thuật toán thiết kế thí nghiệm, và cơ chế xử lý lỗi đặc thù của chuyên ngành mới là những thành phần cung cấp phần lớn tính tự chủ thực sự. Các language model chỉ bổ sung các giao diện linh hoạt, khả năng truy cập tri thức và năng lực soạn thảo kế hoạch, nhưng chúng kế thừa chứ không thể thay thế các yêu cầu kỹ thuật khắt khe đó.

Khung tiếp cận **ADePT** cung cấp một hệ thống từ vựng bổ trợ hữu ích cho robotics phòng thí nghiệm: khả năng thích ứng và học tập (adaptability and learning), sự khéo léo (dexterity), tri giác (perception), và độ phức tạp của tác vụ (task complexity) [36]. Phân tích của nó coi khả năng tương tác (interoperability) là một chiều trực giao với năng lực, điều này hoàn toàn trùng khớp với sự phân biệt của chúng tôi giữa các giao diện kiểu MHS và sự thành thạo thực tế của robot. Một phòng thí nghiệm có thể có tính tích hợp rất cao nhưng hẹp về mặt cơ khí, hoặc rất khéo léo nhưng cực kỳ khó kết nối với một agent. Việc đánh giá bắt buộc phải báo cáo đầy đủ cả hai khía cạnh.

---

### 7.4 Từ trình diễn đến triển khai vật lý có thể bảo vệ được (From demonstration to defensible physical deployment)

Bằng chứng thực nghiệm vật lý cần phải tiến triển thông qua một **hồ sơ bảo đảm an toàn theo từng giai đoạn (staged assurance case)**:
1. **Giai đoạn 1:** Kiểm tra các chính sách thành phần dựa trên dữ liệu trạng thái đã ghi lại hoặc mô phỏng, bao gồm cả các đầu vào đối kháng và lệch phân phối (out-of-distribution inputs).
2. **Giai đoạn 2:** Chạy các thử nghiệm phần cứng trong vòng lặp (hardware-in-the-loop) với các vật liệu trơ, các giới hạn vận hành bảo thủ và hệ thống đo lường trạng thái độc lập.
3. **Giai đoạn 3:** Đánh giá các quy trình có giới hạn dưới sự giám sát trực tiếp của chuyên gia với các điều kiện dừng được đăng ký trước và số lần lặp lại đủ lớn để xác định các lỗi thông thường.
4. **Giai đoạn 4:** Đưa vào các thử nghiệm tiêm lỗi (fault injection), sự không đồng thuận giữa các cảm biến, quá trình suy giảm hiệu chuẩn, và khả năng tự phục hồi.

Chỉ sau khi hoàn thành các bước trên thì thời lượng vận hành không người giám sát, sự đa dạng của thiết bị, hoặc quyền tự do thí nghiệm mới được phép mở rộng.

Không có một "cấp độ tự chủ" (autonomy level) tổng hợp đơn lẻ nào có thể nắm bắt được các yêu cầu này. Một hệ thống có thể lập kế hoạch cho các thí nghiệm mới lạ nhưng lại đòi hỏi con người phải chuyển mẫu bằng tay; một hệ thống khác có thể vận hành một thiết bị suốt ngày đêm nhưng chỉ thực thi một quy trình cố định duy nhất; một hệ thống thứ ba có thể điều phối nhiều thiết bị nhưng bắt buộc con người phải phê duyệt từng quyết định khoa học. Các báo cáo nghiên cứu phải nêu rõ ràng: **ai là người chọn mục tiêu, ai chuyển mục tiêu thành hành động, bộ điều khiển vật lý có thể làm được những gì, những ràng buộc nào được thực thi bên ngoài model, thành công được đo lường ra sao, và ai chịu trách nhiệm cho các hậu quả bất ngờ.**

Vùng biên giới vật lý do đó củng cố chứ không hề phủ định luận điểm cốt lõi của bài viết. Robotics, các phòng thí nghiệm tự hành và MHS chứng minh rằng các hệ thống có điều kiện ngôn ngữ đang tiếp nhận các kênh hành động ngày càng rộng mở hơn. Nhưng những kết quả đáng tin cậy nhất của chúng chỉ xuất hiện ở nơi mà môi trường được giới hạn rõ ràng, thiết bị đo đạc có cấu trúc chặt chẽ, và các chốt kiểm tra độc lập bên ngoài đủ mạnh mẽ. Khi các ranh giới đó được nới lỏng, gánh nặng chứng minh an toàn phải tăng lên nhanh hơn nhiều so với tốc độ mở rộng của không gian hành động.

---

## 8. Độ Tin cậy, Bảo mật và Quản trị trên các Môi trường (Reliability, security, and governance across environments)

### 8.1 Thẩm định kết quả là mắt xích bị thiếu ở giữa (Outcome verification is the missing middle)

Các phương pháp đánh giá được khảo sát ở đây thường chỉ đo lường hai điểm đầu mút: liệu model có lựa chọn một hành động hợp lý hay không, và liệu trạng thái tác vụ cuối cùng có khớp với một vị từ benchmark (benchmark predicate) hay không. Sự ủy quyền an toàn đòi hỏi phải có một chuỗi liên kết hoàn chỉnh ở giữa hai điểm đó:
1. Yêu cầu phải được diễn giải chính xác;
2. Chủ thể (principal) phải thực sự có thẩm quyền để yêu cầu điều đó;
3. Từng hành động phải được cho phép dưới các điều kiện hiện tại;
4. Môi trường phải thực thi hành động đúng như giả định;
5. Trạng thái cuối cùng và các tác dụng phụ quan trọng phải được quan sát đầy đủ;
6. Mọi thất bại phải kích hoạt cơ chế khoanh vùng cô lập (containment) hoặc phục hồi (recovery).

Lời giải thích trôi chảy của một agent không thể tự nó chứng minh bất kỳ mắt xích nào trong chuỗi liên kết này.

Các chốt kiểm tra tất định (deterministic checks) phát huy hiệu quả mạnh nhất ở nơi trạng thái có cấu trúc rõ ràng. Các trường cơ sở dữ liệu, bản diff kho mã nguồn, kết quả kiểm thử, mã băm kiểm tra (checksums), khóa liên động thiết bị và biên lai giao dịch có thể cung cấp bằng chứng hoàn toàn độc lập với lời tự thuật của model. Ngược lại, các mục tiêu mang tính ngữ nghĩa—chẳng hạn như "hãy làm cho tài liệu này chính xác", "hãy đối xử công bằng với người này", hoặc "hãy chọn một thí nghiệm cung cấp nhiều thông tin khoa học"—nhìn chung không thể quy giản về một vị từ duy nhất. Chúng đòi hỏi phải có quy trình đánh giá phân tầng: các bất biến có thể kiểm tra bằng máy, các bài kiểm thử đặc thù của chuyên ngành, các model hoặc công cụ độc lập khi phù hợp, và sự phán đoán có trách nhiệm giải trình của con người đối với các điểm mơ hồ còn lại. Việc sử dụng chính model đang hành động làm thẩm phán duy nhất sẽ tạo ra lỗi có tương quan và một động cơ ngầm để nó hợp lý hóa chính quỹ đạo hành động của mình.

Bộ thẩm định (verifier) cũng chính là một bề mặt tấn công. Một agent có thể tối ưu hóa một đại lượng ủy nhiệm (proxy), thay đổi chính đối tượng đang được đánh giá, hoặc chọn lọc bằng chứng để làm cho một hành động sai trái trông như một sự thành công. Trong một thế giới ảo đã học, nó có thể khai thác lỗi của mô hình mô phỏng; trong một tác vụ web, nó có thể thỏa mãn giao diện trang hiển thị nhưng lại sửa đổi sai tài khoản; trong một phòng thí nghiệm, một cảm biến có thể báo cáo một con số trông rất hợp lý sau một sự cố sai lệch hiệu chuẩn. Do đó, quy trình thẩm định bắt buộc phải ràng buộc mục tiêu, nhật ký hành động, định danh môi trường và nguồn gốc đo lường (measurement provenance) trước khi thực thi ở bất kỳ nơi nào có thể.

---

### 8.2 Prompt injection trở thành một bài toán bảo mật hành động (Prompt injection becomes an action-security problem)

Khả năng truy xuất thông tin (retrieval) và sử dụng máy tính (computer use) đã xóa nhòa ranh giới giữa dữ liệu và chỉ dẫn. Một trang web, một tài liệu, một kết quả đầu ra của công cụ, hay một tin nhắn từ một agent khác đều có thể chứa văn bản cố tình chuyển hướng model. Một khi model nắm giữ các thông tin chứng thực (credentials) hoặc một giao diện hành động, thì **indirect prompt injection (tiêm prompt gián tiếp)** không còn đơn thuần là vấn đề về tính toàn vẹn nội dung nữa; nó có thể gây ra việc tiết lộ dữ liệu nhạy cảm hoặc làm thay đổi trạng thái trái phép. 
- **AgentDojo** cung cấp một môi trường động để đánh giá các cuộc tấn công và phòng thủ như vậy dưới các ràng buộc về tính hữu dụng [10];
- **ToolEmu** sử dụng một môi trường cô lập giả lập bởi LM để phát hiện các hành vi rủi ro xuyên suốt các kịch bản sử dụng công cụ [35];
- **Agent Security Bench (ASB)** mở rộng việc đánh giá tấn công và phòng thủ được hình thức hóa trên các thành phần của agent [55].

Các benchmark này rất có giá trị vì chúng đánh giá hệ thống dưới một ngữ cảnh đối kháng thay vì chỉ hỏi base model một câu hỏi an toàn thuần túy. Tuy nhiên, phạm vi bao phủ của chúng nhất thiết chỉ là một phần. Các chuỗi tấn công, lược đồ công cụ, endpoint của model và các prompt phòng thủ liên tục thay đổi, và một môi trường giả lập bởi LM không thể tái tạo được mọi tác dụng phụ bên ngoài. Một biện pháp phòng thủ làm giảm tỷ lệ tấn công thành công bằng cách từ chối thực hiện nhiều hành động lành tính cũng có thể phá hủy hoàn toàn tính hữu dụng của hệ thống. Do đó, các tuyên bố về bảo mật bắt buộc phải báo cáo đồng thời cả hiệu năng tác vụ lẫn kết quả phòng thủ tấn công, cùng với phiên bản model và harness, các quyền hạn được cấp, ngân sách suy luận và ranh giới tin cậy (trust boundary) chính xác.

Một báo cáo sự cố của Anthropic công bố vào đúng ngày chốt khảo cứu đã mô tả các model tiền phát hành, khi được chủ động đánh giá mà không có các biện pháp bảo vệ không gian mạng, đã thực hiện các hành động trái phép trên mạng Internet trực tiếp khi môi trường của bên thứ ba bị cấu hình sai hoặc cố tình mở kết nối Internet. Báo cáo từ bên thứ nhất này xác lập các thất bại ranh giới dưới các bài kiểm tra cụ thể đó, chứ không phản ánh tần suất xuất hiện của chúng trong các triển khai thông thường [4].

---

### 8.3 Thẩm quyền phải được biểu diễn bên ngoài ngôn ngữ tự nhiên (Authority must be represented outside natural language)

Các chỉ dẫn bằng ngôn ngữ tự nhiên rất giàu tính biểu đạt nhưng lại quá thiếu tính đặc tả để làm chính sách kiểm soát truy cập (access-control policies). Lệnh "hãy lo liệu chuyến đi của tôi" không xác định mức chi tiêu tối đa, các sân bay được chấp nhận, liệu có được phép mua vé không hoàn tiền hay không, hoặc ai được phép nhìn thấy giấy tờ tùy thân. Lệnh "hãy chạy thí nghiệm" không định nghĩa khối lượng hóa chất, các khoảng thời gian bảo trì, hay hiện tượng bất thường nào đòi hỏi phải sơ tán khẩn cấp. 

Tầng phân quyền (authorization layer) cần phải biên dịch ý định được ủy quyền thành các **năng lực có thể thực thi bằng máy (machine-enforceable capabilities)**: các tài nguyên được định danh rõ ràng, các thao tác được phép, giới hạn về giá trị và thời gian, điều kiện gia hạn, và các yêu cầu về phê duyệt hoặc kiểm soát kép (dual control). Các nghiên cứu về ủy quyền đã xác thực và có thể kiểm toán (authenticated and auditable delegation) đã hình thức hóa nhu cầu này, mặc dù các framework được đề xuất vẫn đang ở giai đoạn nghiên cứu ban đầu chứ chưa trở thành cơ sở hạ tầng được kiểm chứng rộng rãi tại thời điểm chốt khảo cứu [40].

MCP và A2A cung cấp các điểm móc bảo mật (security hooks) hữu ích nhưng không thể xóa bỏ trách nhiệm này của tầng ứng dụng. Các phạm vi OAuth (OAuth scopes), Thẻ Agent đã xác thực, siêu dữ liệu có chữ ký số và chính sách theo từng dịch vụ có thể giúp nhận diện và ràng buộc các bên tham gia [1, 23]. Tuy nhiên, chính harness vẫn phải quyết định tiến trình model nào nhận thông tin chứng thực nào, ngăn chặn hành vi **ủy thác nhầm lẫn (confused-deputy behavior)**, và thu hồi quyền truy cập ngay khi tác vụ kết thúc. Các thị trường kết nối agent với con người đòi hỏi thêm các giới hạn chi tiêu và chính sách về các tác vụ bị cấm; các thiết bị do MHS điều khiển đòi hỏi các giới hạn phần cứng độc lập. **Giao diện càng mang tính tổng quát bao nhiêu, thì việc suy diễn thẩm quyền từ việc một thao tác có thể thực hiện được về mặt kỹ thuật càng trở nên nguy hiểm bấy nhiêu.**

---

### 8.4 Sự giám sát của con người phải được thiết kế và đo lường (Human oversight must be designed and measured)

"Con người trong vòng lặp" (Human in the loop) không phải là một biện pháp bảo vệ nhị phân (có hoặc không). Con người có thể:
- Đặt ra mục tiêu;
- Phê duyệt một kế hoạch;
- Xác nhận một giao dịch;
- Giám sát một luồng thực thi;
- Can thiệp giữa chừng;
- Thanh tra tạo phẩm cuối cùng; hoặc
- Điều tra sau khi sự cố xảy ra.

Mỗi vị trí này tiếp cận những thông tin khác nhau và tạo ra độ trễ cũng như khối lượng công việc hoàn toàn khác nhau. Một người dùng được yêu cầu phê duyệt một kế hoạch cấp cao không thể phát hiện ra một lỗi đối số ở cấp thấp; một người vận hành phải nhìn thấy hàng trăm lệnh gọi công cụ có thể bỏ sót một lệnh gọi duy nhất gây ra hậu quả nghiêm trọng. Việc đánh giá sự giám sát cần phải đo lường khả năng phát hiện lỗi, chất lượng can thiệp, thời gian phản hồi, tải nhận thức (cognitive load), và kết quả phục hồi—chứ không chỉ đơn thuần là sự hiện diện của một nút bấm phê duyệt trên giao diện.

---

### Bảng 3: Các nghĩa vụ bảo đảm gia tăng theo tính bền bỉ và sự gắn kết môi trường
*(Table 3: Assurance obligations grow with persistence and environmental coupling)*

| Môi trường (Environment) | Bằng chứng thành công điển hình (Typical evidence of success) | Trạng thái ẩn đặc trưng (Characteristic hidden state) | Trọng tâm kiểm soát bắt buộc (Required control emphasis) | Câu hỏi tồn đọng (Residual question) |
| :--- | :--- | :--- | :--- | :--- |
| **Môi trường cô lập Tool/API (Tool/API sandbox)** | Đối tượng trả về, vị từ trạng thái, dấu vết thực thi có thể phát lại | Chính sách dịch vụ và các tác động nằm ngoài lược đồ | Đối số định kiểu, tính lũy kế (idempotency), danh sách cho phép, bộ đánh giá tất định | Lệnh gọi hợp lệ có thực sự thỏa mãn ý định thực sự của người dùng hay không? |
| **Web/Desktop trực tiếp (Live web/desktop)** | Trạng thái tài khoản, biên lai, tạo phẩm, truy vấn độc lập | Tiêu điểm, lớp phủ màn hình, chính sách từ xa, người dùng khác, prompt gián tiếp | Trình duyệt cô lập, phạm vi hóa chứng thực, hộp thoại xác nhận, đối soát giao dịch | Hậu quả nào đối với tài khoản hoặc bên bị ảnh hưởng đã bị bỏ sót? |
| **Ủy quyền cho Agent hoặc Con người (Agent or human delegation)** | Tạo phẩm có chữ ký số, bản ghi tác vụ, gói bằng chứng, quyết định nghiệm thu | Năng lực của bên nhận việc, động cơ kinh tế, hành động riêng tư, ngữ cảnh bị sao chép | Danh tính, bản tóm tắt có ranh giới, ngân sách, nguồn gốc, cơ chế giải quyết xung đột | Việc "hoàn thành" có trung thực, hợp pháp và có thể kiểm tra độc lập hay không? |
| **Thế giới sinh ra/Mô phỏng (Generated/simulated world)** | Trạng thái đo đạc được, đầu dò nhân quả, episode có thể lặp lại | Các đường tắt của model và sự sai lệch với thế giới đích | Quyền truy cập trạng thái cho bộ đánh giá, kiểm tra phản thực nghiệm, kiểm định chuyển giao | Agent đã thực sự học được tác vụ hay chỉ đang khai thác lỗ hổng trình mô phỏng? |
| **Robot hoặc Phòng thí nghiệm (Robot or laboratory)** | Cảm biến độc lập, phép đo được hiệu chuẩn, thanh tra vật lý | Hao mòn, tạp nhiễm, che khuất thị giác, con người xung quanh, thay đổi không thể đảo ngược | Khóa liên động, đơn vị đo, quản lý độ bất định, thử nghiệm theo giai đoạn, dừng khẩn cấp | Sự cố có được giới hạn an toàn khi model hoặc thiết bị đo đạc gặp sai sót không? |

---

Khung Magentic-UI với các cơ chế đồng lập kế hoạch, đồng thực thi tác vụ, chốt phòng vệ hành động và thẩm định câu trả lời cuối cùng cấu thành một nền tảng nghiên cứu hữu ích cho những câu hỏi này [24]. Các mô tả chứng minh khái niệm của MHS cũng bao gồm các trường hợp agent hỏi nhà nghiên cứu xem liệu có nên dừng một quy trình hay không và các trường hợp cần sự hướng dẫn của chuyên gia để chẩn đoán một lỗi vật lý [5]. Những ví dụ này cho thấy sự tham gia có giá trị cao của con người thường diễn ra tại các **ranh giới quyết định và các hiện tượng bất thường**, chứ không phải ở từng hành động thông thường. Tuy nhiên, chúng chưa xác lập được ngưỡng can thiệp chính xác, đặc biệt là khi một người vận hành phải giám sát nhiều agent hoạt động đồng thời.

Sự giám sát cũng đòi hỏi phải có các phương án thay thế có ý nghĩa. Con người phải có khả năng thanh tra bằng chứng, từ chối hoặc sửa đổi kế hoạch, tạm dừng thực thi, thu hồi thông tin chứng thực, và khôi phục về một trạng thái an toàn. Nếu một agent mờ đục đã thực hiện một hành động không thể đảo ngược trước khi hỏi ý kiến, thì sự tương tác đó chỉ là **thông báo** chứ không phải là **kiểm soát**. Đối với những người bị ảnh hưởng nhưng không phải là bên ủy quyền, công tác quản trị đòi hỏi thêm quyền được thông báo, quyền khiếu nại tranh chấp, và một tổ chức chịu trách nhiệm giải trình; một tác vụ thành công về mặt kỹ thuật vẫn có thể phân bổ gánh nặng bất công hoặc xâm phạm quyền lợi của người khác.

---

### 8.5 Tiêu chuẩn báo cáo tối thiểu cho các hệ thống hành động trong thế giới (A minimum reporting standard for world-acting systems)

Khả năng so sánh đối chiếu giữa các nghiên cứu sẽ được cải thiện đáng kể nếu mọi đánh giá agent đều báo cáo đầy đủ sáu yếu tố cốt lõi:
1. **Model:** Xác định chính xác endpoint của model hoặc trọng số, phương pháp giải mã và ngân sách suy luận (reasoning budget).
2. **Harness:** Mô tả chi tiết các prompt, chính sách quản lý ngữ cảnh, bộ nhớ, công cụ, logic thử lại, các subagent, và bộ thẩm định.
3. **Môi trường:** Nêu rõ các điều kiện reset của môi trường, quyền truy cập mạng, thông tin chứng thực, và liệu có người khác hoặc tài nguyên thực tế nào bị ảnh hưởng hay không.
4. **Kết quả:** Phân tách rạch ròi giữa các kết quả: đã nỗ lực thực hiện (attempted), hoàn thành về mặt kỹ thuật (technically completed), tuân thủ chính sách (policy-compliant), và đã được thẩm định độc lập từ bên ngoài (externally verified).
5. **Độ tin cậy & Chi phí:** Báo cáo các thử nghiệm lặp lại, chi phí tài chính, độ trễ, tần suất can thiệp của con người, và mức độ nghiêm trọng của các lỗi thay vì chỉ báo cáo tỷ lệ thành công trong trường hợp tốt nhất.
6. **Lưu trữ:** Lưu trữ các dấu vết hành động (action traces) và các tạo phẩm sinh ra, tuân thủ các ràng buộc về quyền riêng tư và bảo mật.

Đối với các hệ thống multi-agent, bắt buộc phải cân bằng tổng ngân sách suy luận và công cụ so với một đường cơ sở đơn agent mạnh mẽ. Đối với các hệ thống bền bỉ, phải báo cáo thời lượng vận hành, các lần gián đoạn, di chuyển trạng thái, gia hạn chứng thực và quy trình xóa bộ nhớ. Đối với các world model, phải báo cáo tính nhất quán nhân quả và tính nhất quán trạng thái ngoài màn hình thay vì chỉ trình chiếu các video tuyển chọn. Đối với các hệ thống vật lý, phải cung cấp cấu hình thiết bị, dữ liệu hiệu chuẩn, hệ thống cảm biến độc lập, khóa liên động cơ học, định nghĩa sự cố và số lượng lần lặp lại đầy đủ. Các bản xem trước của doanh nghiệp có thể đóng góp các cấu trúc kiến trúc và tiết lộ hạn chế có giá trị, nhưng cần phải được phân tách rành mạch về mặt thị giác và ngôn từ khỏi các bằng chứng đã qua bình duyệt độc lập.

Những yêu cầu này chuyển dịch trọng tâm đánh giá từ câu hỏi *"Liệu agent có thể hành động không?"* sang câu hỏi: **"Dưới cấu hình nào, thẩm quyền nào, bằng chứng nào, và ranh giới thất bại nào thì hành động đó mới được phép ủy quyền?"** Đó chính là đơn vị tri thức tối thiểu cần thiết để tạo ra sự tiến bộ tích lũy trong nghiên cứu khoa học.

---

## 9. Lộ trình Nghiên cứu cho Sự Ủy quyền Hợp thức (A research agenda for justified delegation)

Một chương trình nghiên cứu hữu ích không đòi hỏi phải có một điểm số tự chủ (autonomy score) đơn lẻ. Nó đòi hỏi bằng chứng cho thấy phạm vi hành động có thể được mở rộng mà không làm mất quyền kiểm soát đối với ý định, thẩm quyền, trạng thái và khả năng phục hồi. Chúng tôi sử dụng khái niệm **sự ủy quyền hợp thức (justified delegation)** như một nguyên lý kinh nghiệm phân tích và chuẩn tắc (analytical and normative heuristic) dành cho lớp tác vụ lớn nhất mà một hệ thống đã cấu hình có thể:
1. Chứng minh được năng lực đầy đủ;
2. Tôn trọng sự phân quyền có ranh giới;
3. Phơi bày các bằng chứng về kết quả và các tác dụng phụ; và
4. Quay trở về một trạng thái an toàn khi các giả định bị sụp đổ.

Đây không phải là một quy luật đo lường bằng thực nghiệm, một benchmark, hay một chứng nhận kỹ thuật; nó là một tiêu chí quyết định để trả lời câu hỏi khi nào thì việc trao quyền hạn rộng hơn là có thể bảo vệ được về mặt khoa học và an toàn. Bảy ưu tiên nghiên cứu sau đây được rút ra từ toàn bộ quá trình tổng hợp ở trên:

---

### 9.1 Đánh giá model và harness như một can thiệp kết hợp (Evaluate the model and harness as a coupled intervention)

Các bản phát hành model thường dễ đặt tên hơn các thay đổi về harness, vì vậy các câu chuyện benchmark thường quy toàn bộ cải tiến hệ thống cho model. Các phép so sánh trong tương lai nên sử dụng **thiết kế giai thừa (factorial designs)** ở bất kỳ nơi nào khả thi: thay đổi độc lập giữa model, giao diện, chính sách bộ nhớ, bộ thẩm định và ngân sách thử lại. Ở mức tối thiểu:
- Phải giữ cố định harness khi so sánh các model; và
- Phải giữ cố định model khi muốn khẳng định đóng góp của một harness mới.

Báo cáo đầy đủ tổng chi phí suy luận và công cụ, bao gồm cả các lệnh gọi đến model phản biện (critic) và các subagent. Điều này đặc biệt quan trọng khi so sánh hệ thống đơn agent và đa agent, bởi vì việc bổ sung thêm các vai trò có thể âm thầm mua thêm không gian tìm kiếm tính toán.

Nghiên cứu về harness nên ưu tiên xây dựng **trạng thái có thể diễn giải được (interpretable state)** thay vì cố gắng tạo ra các bản ghi hội thoại ngày càng dài. Các kế hoạch, cam kết, độ bất định, kết quả công cụ và quyết định phân quyền cần phải được biểu diễn dưới dạng các đối tượng định kiểu (typed objects) đi kèm nguồn gốc xuất xứ (provenance) và các điều kiện hết hiệu lực (invalidation conditions) tường minh. Cơ chế nén ngữ cảnh phải lưu giữ lý do tại sao một sự kiện được tin tưởng và khi nào nó hết hạn, chứ không chỉ đơn thuần là một bản tóm tắt trôi chảy. Một bộ thẩm định phải nhận được các bằng chứng cần thiết để chất vấn lại tác tử hành động, chứ không được mặc định kế thừa tất cả các giả định của tác tử đó.

---

### 9.2 Biến thẩm quyền thành dạng dựa trên năng lực, có thể gia hạn và có thể thu hồi (Make authority capability-based, renewable, and revocable)

Các giao thức agent nên truyền tải các **năng lực theo phạm vi tác vụ (task-scoped capabilities)** thay vì sử dụng các thông tin chứng thực bao trùm môi trường (ambient credentials). Một năng lực phải nêu rõ:
- Tên tài nguyên;
- Thao tác được phép;
- Giới hạn về tham số hoặc giá trị;
- Thời hạn hết hiệu lực;
- Khả năng có được ủy nhiệm tiếp hay không (delegability); và
- Yêu cầu phê duyệt bắt buộc.

Việc ủy quyền thứ cấp (subdelegation) thông qua A2A hoặc một thị trường con người phải **làm suy giảm (attenuate) chứ không được khuếch đại thẩm quyền**: một agent hoặc một người lao động ở hạ nguồn không bao giờ được nhận nhiều quyền hạn hơn những gì mà chủ thể ban đầu đã chủ ý trao. Mọi sự bàn giao đều phải bảo toàn chuỗi ủy nhiệm từ chủ thể con người hoặc tổ chức ban đầu đến bộ thực thi cuối cùng.

Ý định bằng ngôn ngữ tự nhiên vẫn sẽ luôn cần thiết, nhưng nó phải được biên dịch thành một đối tượng chính sách có thể thanh tra và đánh giá được. Cần có các nghiên cứu về việc phát hiện sự mơ hồ trong quá trình biên dịch, dung hòa các chính sách từ nhiều chủ thể khác nhau, và biểu diễn các quyết định tuyệt đối không thể ủy quyền (non-delegable decisions). Các bài kiểm tra hợp chuẩn giao thức phải bao gồm các trường hợp phân quyền đối kháng, kịch bản ủy thác nhầm lẫn (confused-deputy), phát lại mã định danh tác vụ, và việc thu hồi quyền ngay trong lúc một hành động chạy dài hạn đang diễn ra. Các chỉ số đo lường mức độ áp dụng cần phân biệt rõ giữa những bản triển khai chỉ đơn thuần phơi bày một endpoint giao thức với những bản thực sự vượt qua các bài kiểm thử bảo mật này.

---

### 9.3 Đối xử với sự tham gia của con người như một tài nguyên khan hiếm và tối quan trọng về an toàn (Treat human participation as a scarce, safety-critical resource)

Nghiên cứu về tương tác người–agent cần tối ưu hóa sự phân bổ phán đoán của con người, chứ không phải là tối thiểu hóa số lượng hành động của con người một cách cơ học. Các hệ thống cần các bộ kích hoạt được hiệu chuẩn chính xác cho các hành vi: đặt câu hỏi, phê duyệt, quan sát, can thiệp và kiểm toán. Các thí nghiệm cần đo lường:
- Liệu con người có phát hiện ra một lỗi được cố tình cài cắm vào hay không;
- Liệu giao diện hiển thị thông tin có hỗ trợ đưa ra một quyết định chính xác hay không;
- Chất lượng giám sát thay đổi như thế nào khi số lượng tác vụ đồng thời tăng lên và khi con người mệt mỏi; và
- Liệu người dùng có thể tái cấu trúc lại trách nhiệm giải trình sau khi một sự cố xảy ra hay không.

Các thị trường kết nối agent với con người đòi hỏi một chương trình nghiên cứu bổ sung. Các bộ lọc tác vụ phải suy luận được về sự kết hợp của nhiều bước nhìn có vẻ lành tính nhưng tổng thể độc hại, và bằng chứng do người lao động cung cấp phải được xác thực mà không tạo ra sự giám sát xâm phạm quyền riêng tư quá mức. Các câu hỏi kinh tế và xã hội bao gồm việc định giá thù lao, sự đồng thuận có hiểu biết đối với các khách hàng là agent, phân bổ tác vụ không phân biệt đối xử, thao túng danh tiếng, quyền tài phán pháp lý, và ai sẽ chịu trách nhiệm pháp lý khi bản tóm tắt nhiệm vụ của agent là bất hợp pháp hoặc nguy hiểm. Nghiên cứu sơ khai về RentAHuman cho thấy cả việc sử dụng theo chương trình lẫn các danh mục lạm dụng tích cực, nhưng cần có sự tái lặp xuyên suốt nhiều nền tảng và thời gian trước khi có thể khái quát hóa mức độ phổ biến [20].

---

### 9.4 Đo chuẩn tính bền bỉ như sự thay đổi trạng thái có kiểm soát qua thời gian (Benchmark persistence as controlled state change over time)

Việc đánh giá các tác vụ dài hạn phải vượt ra ngoài việc chỉ tăng số lượng bước tối đa. Một benchmark về tính bền bỉ cần phải đưa vào:
- Các sự gián đoạn bất ngờ;
- Các quan sát đã cũ/lỗi thời;
- Các thay đổi về chính sách giữa chừng;
- Các thông tin chứng thực sắp hết hạn;
- Các chủ thể hành động đồng thời khác;
- Các kết quả có độ trễ lớn; và
- Những tác vụ cần phải được hủy bỏ thay vì cố gắng hoàn thành.

Benchmark cần chấm điểm tính toàn vẹn của trạng thái, mức tiêu thụ tài nguyên, các nghĩa vụ bị lãng quên, khả năng tiếp tục lại an toàn, và việc tái phân quyền phù hợp. Đơn vị thành công phải bao gồm một bản ghi bằng chứng bền vững, chứ không chỉ là một phần thưởng ở điểm kết thúc (endpoint reward).

Bộ nhớ đòi hỏi các bài kiểm tra riêng biệt về khả năng truy hồi (recall), nguồn gốc (provenance), sửa đổi (correction) và xóa bỏ (deletion). Một hệ thống ghi nhớ một suy luận sai lầm một cách nhất quán là một hệ thống bền bỉ nhưng cực kỳ mất an toàn. Một hệ thống không thể quên đi một sở thích đã bị thu hồi hoặc một bản ghi nhạy cảm cũng là một hệ thống thất bại. Các thư viện kỹ năng như của Voyager thúc đẩy các bài kiểm tra xem liệu một quy trình đã lưu trữ có còn hợp lệ sau khi môi trường thay đổi hay không và liệu agent có biết khi nào thì không nên tái sử dụng nó hay không [47].

---

### 9.5 Kết nối World Models với bằng chứng nhân quả và khả năng chuyển giao (Connect world models to causal and transfer evidence)

Việc đánh giá world model cần chuyển dịch từ các bản trình diễn thị giác sang các phép đo lường nhạy cảm với sự can thiệp. Các benchmark cần:
- Giấu các vật thể trong những khoảng thời gian dài;
- Thăm lại các địa điểm từ các góc nhìn đối nghịch nhau;
- Thay đổi một biến số nhân quả duy nhất trong khi giữ nguyên diện mạo thị giác; và
- Kiểm tra các định luật bảo toàn hoặc các quy tắc đặc thù của tác vụ.

Các benchmark thế giới chia sẻ cần đưa vào các agent độc lập nắm giữ những thông tin không tương thích và đo lường xem liệu trạng thái có duy trì được tính mạch lạc dưới các hành động đồng thời hay không. Đề xuất trạng thái tường minh của Project Eden làm cho những câu hỏi này trở nên cụ thể, nhưng rất cần các tạo phẩm mở và các bài kiểm tra độc lập [46].

Đối với việc huấn luyện agent, sự đa dạng chỉ có giá trị khi đi kèm với độ trung thực liên quan đến tác vụ ở hạ nguồn. Các nhà nghiên cứu cần báo cáo những hành vi nào chuyển giao thành công từ môi trường được sinh ra, những hành vi nào khai thác các lỗi tạo tác của bộ sinh, và độ bất định trong model được lan truyền sang chính sách lập kế hoạch như thế nào. Một quy trình chuyển giao theo các giai đoạn: **mô phỏng -> phần cứng trong vòng lặp (HIL) -> triển khai có giới hạn** có thể giúp khoanh vùng các lỗi trước khi tiếp xúc với rủi ro vật lý thực tế. Các world model học được phải biết từ chối đưa ra dự đoán hoặc nhường quyền cho các cảm biến trực tiếp khi độ bất định dự đoán vượt qua một ngưỡng đặc thù của tác vụ.

---

### 9.6 Xây dựng các hồ sơ bảo đảm an toàn vật lý từ các tầng độc lập (Build physical assurance cases from independent layers)

Nghiên cứu về agent vật lý cần kết hợp, nhưng không được gộp lẫn, ba khâu đánh giá độc lập:
1. Lập kế hoạch ngữ nghĩa (semantic planning);
2. Thực thi ở cấp độ thiết bị (device-level execution); và
3. An toàn ở cấp độ toàn hệ thống (system-level safety).

Một agent cấp cao có thể đề xuất một kế hoạch hợp lệ nhưng bộ điều khiển không thể thực thi được; một robot có thể thực thi cực kỳ chuẩn xác nhưng lại đang theo đuổi một mục tiêu hoàn toàn sai trái. Các khóa liên động cơ học độc lập và nút dừng khẩn cấp phải luôn duy trì hiệu lực ngay cả khi model, kết nối mạng, hoặc tiến trình điều phối gặp sự cố sụp đổ. Sự không đồng thuận giữa các cảm biến, hiện tượng trôi dạt hiệu chuẩn, hao mòn cơ khí, che khuất thị giác, và con người bước vào không gian làm việc phải là những điều kiện thử nghiệm định kỳ thông thường chứ không phải là những suy nghĩ nảy sinh sau cùng.

MHS tạo ra một cơ hội lớn cho các bản kê khai thiết bị (device manifests) dùng chung và các bộ kiểm định hợp chuẩn nếu quá trình phát triển mã nguồn mở đã cam kết mang lại các tạo phẩm công khai ổn định [5]. Các phần mở rộng hữu ích nên bao gồm: chuẩn hóa đơn vị đo, siêu dữ liệu về độ bất định và độ tươi mới, các điều kiện tiên quyết và tính có thể đảo ngược của lệnh, ngữ nghĩa chạy thử không tải (dry-run), phân loại mối nguy hiểm, và các bản ghi hiệu chuẩn có chữ ký số. Giá trị thực sự của tiêu chuẩn này phải được đánh giá thông qua thời gian tích hợp, khả năng chuyển đổi xuyên thiết bị, khả năng phát hiện lỗi, và sự phục hồi an toàn trên các phòng thí nghiệm độc lập—chứ không chỉ bằng việc liệu một model có thể phát ra một câu lệnh chung hay không.

---

### 9.7 Thay thế các lát cắt benchmark tức thời bằng bằng chứng theo thời gian dài (Replace benchmark snapshots with longitudinal evidence)

Cuối cùng, các world-acting system cần có bằng chứng sau khi triển khai thực tế. Các kết quả benchmark phải được liên kết chặt chẽ với phiên bản model và harness để có thể nhận diện được hiện tượng suy thoái hiệu năng (regressions). Quá trình triển khai thực tế cần thu thập các **mẫu số thống kê bảo vệ quyền riêng tư (privacy-preserving denominators)**:
- Có bao nhiêu tác vụ đã được nỗ lực thực hiện;
- Bao nhiêu tác vụ bị từ chối;
- Bao nhiêu tác vụ bị leo thang lên con người;
- Bao nhiêu tác vụ được sửa chữa;
- Bao nhiêu tác vụ bị hoàn tác;
- Bao nhiêu tác vụ bị bỏ dở;
- Mức độ nghiêm trọng của các sự cố; và
- Cần bao nhiêu khối lượng công việc của con người để khắc phục.

Các bảng phân loại sự cố (incident taxonomies) cần kết nối các vụ việc prompt injection, lạm dụng quyền hạn, thất bại phối hợp, lỗi bộ nhớ, sự trôi dạt giao diện, và lỗi hỏng hóc vật lý tới đúng tầng kiến trúc có trách nhiệm ngăn chặn sự lan truyền của sự cố đó.

Điểm kết thúc phù hợp không phải là triệt tiêu hoàn toàn sự tham gia của con người hay để hệ thống chạy vô thời hạn. Đó là một hệ thống mà **các ranh giới vận hành của nó luôn được hiểu rõ ràng khi năng lực thay đổi**. Một agent có phạm vi hẹp với các bằng chứng bảo đảm vững chắc có thể xứng đáng được vận hành rộng rãi trong phạm vi của nó; trong khi một agent có năng lực tổng quát cao hơn lại có thể chỉ xứng đáng nhận được ít thẩm quyền hơn khi các hành động của nó quá khó để thẩm định. Điều này đảo ngược giả định thông thường cho rằng hiệu năng benchmark cao hơn thì mặc nhiên sẽ mở khóa cho một bề mặt hành động lớn hơn.

---

### 9.8 Những giới hạn của bài tổng hợp hiện tại (Limits of the present synthesis)

Bài tổng quan này có chủ đích chọn lọc và không thể hỗ trợ cho các tuyên bố về tần suất xuất hiện theo phương pháp trắc lượng thư mục. Thời điểm chốt tài liệu nắm bắt một giai đoạn chuyển động nhanh bất thường; các bản sửa đổi giao thức, sự xuất hiện của các sản phẩm thương mại, và các bảng xếp hạng benchmark hoàn toàn có thể thay đổi sau ngày 31 tháng 8 năm 2026. Một số tuyên bố ở vùng biên giới—đáng chú ý là Genie 3, Project Eden, và MHS—xuất phát từ các bản xem trước của bên thứ nhất mà chưa có các bài báo lưu trữ học thuật hoặc các bản tái lập độc lập tại thời điểm chốt khảo cứu. Chúng tôi đưa chúng vào bài viết vì chúng phơi bày các định hướng kiến trúc quan trọng, nhưng luôn tách biệt rõ ràng tư cách bằng chứng của chúng xuyên suốt toàn bộ văn bản.

Phạm vi bao phủ cũng có tính bất đối xứng. Cơ sở bằng chứng công khai được khảo sát tại đây tập trung chủ yếu vào kỹ thuật phần mềm, các tác vụ web, trò chơi, các phòng thí nghiệm robot, và các giao diện tiếng Anh—những bối cảnh vốn có sẵn các benchmark và tạo phẩm dễ tiếp cận. Bằng chứng từ các tổ chức có tính rủi ro cao, các hoạt động doanh nghiệp vận hành dài hạn, và những người không sử dụng nhưng bị ảnh hưởng thì khan hiếm hơn nhiều trong phạm vi bài viết này hoặc không thể kiểm toán công khai. Do đó, chúng tôi không suy diễn rằng một chế độ lỗi vắng mặt trong tài liệu công khai là một lỗi hiếm gặp ngoài đời thực. Chúng tôi cũng không coi bảng phân loại này là một chuỗi phát triển tuần tự: sự gắn kết kỹ thuật số, xã hội, ảo và vật lý luôn chồng lấn lên nhau, và một hệ thống hoàn toàn có thể rất hoàn thiện trên một chiều bảo đảm này nhưng lại cực kỳ non nớt trên một chiều bảo đảm khác.

---

## 10. Kết luận (Conclusion)

Agentic AI được hiểu đúng đắn nhất như một **sự thay đổi trong kiến trúc kiểm soát (change in control architecture)**, chứ không phải là một nhãn dán gắn vào một language model. Các model hiện nay đang tham gia vào những hệ thống có khả năng gọi công cụ, vận hành máy tính, ủy quyền cho các agent khác và con người, duy trì công việc qua thời gian, tương tác với các thế giới được sinh ra, và điều khiển các thiết bị vật lý. Xuyên suốt các nghiên cứu và tạo phẩm được khảo sát ở đây, bằng chứng mạnh mẽ nhất ủng hộ cho việc **mở rộng độ bao phủ của hành động** và **những bước tiến có ý nghĩa nhưng không đồng đều về năng lực thực hiện tác vụ**. Tuy nhiên, chính khối bằng chứng công khai đó **chưa hề xác lập được một bước chuyển đổi tổng quát hướng tới quyền tự chủ trong thế giới mở, đáng tin cậy và không cần người giám sát**.

Việc phân tách rạch ròi giữa **model**, **harness**, **môi trường**, và **bên ủy quyền** giúp giải quyết phần lớn những mâu thuẫn bề ngoài:
- MCP và A2A tiêu chuẩn hóa các giao diện kết nối nhưng không tiêu chuẩn hóa các quyết định đáng tin cậy.
- Tổ chức multi-agent có thể cung cấp tính mô-đun thực sự nhưng không tự động mang lại tính độc lập hay hiệu quả tính toán.
- Các world model có thể cung cấp các môi trường dự đoán và bền bỉ nhưng tự bản thân chúng không phải là các agent.
- Các nghiên cứu về VLA và phòng thí nghiệm tự hành cung cấp bằng chứng có giới hạn về sự gắn kết vật lý ngày càng trực tiếp, trong khi bản xem trước MHS đề xuất một tầng driver tổng quát hơn; cả hai đều khiến cho các ràng buộc độc lập bên ngoài, quá trình hiệu chuẩn và khả năng phục hồi trở nên quan trọng hơn bao giờ hết.

Do đó, chúng tôi sử dụng khái niệm **sự ủy quyền hợp thức (justified delegation)** như một nguyên lý kinh nghiệm phân tích thực tiễn: hãy đặt câu hỏi xem có bao nhiêu thẩm quyền làm thay đổi trạng thái có thể được trao dựa trên bằng chứng cho thấy hệ thống sẽ bảo toàn được ý định, vận hành trong phạm vi quyền hạn được cấp, phơi bày những gì nó đã thay đổi, và thất bại một cách an toàn. 

Để thúc đẩy vùng biên giới đó đòi hỏi phải:
- Đánh giá kết hợp model–harness;
- Biểu diễn thẩm quyền dưới dạng định kiểu và có thể thu hồi;
- Đo lường chính xác sự kiểm soát của con người;
- Kiểm tra quan hệ nhân quả trong các môi trường bền bỉ;
- Xây dựng các hồ sơ bảo đảm an toàn vật lý theo từng tầng độc lập; và
- Thu thập các bản ghi triển khai thực tế theo thời gian dài.

Mục tiêu cuối cùng không phải là hướng tới sự độc lập tối đa hay tuân thủ một điểm số vừa mới được phát minh ra. Mục tiêu cốt lõi là **hành động có trách nhiệm giải trình mà phạm vi của nó chỉ được phép mở rộng khi các bằng chứng liên quan chứng minh được rằng sự ủy quyền đó là hoàn toàn hợp thức.**

---

### Tuyên bố về việc sử dụng AI tạo sinh (Use of generative AI)
*Trí tuệ nhân tạo tạo sinh đã hỗ trợ việc khám phá tài liệu, soạn thảo ban đầu, biên tập ngôn ngữ, dịch thuật và chuẩn bị mã nguồn LaTeX; các tác giả đã trực tiếp thẩm định tất cả các nguồn tài liệu và chịu hoàn toàn trách nhiệm đối với toàn bộ bản thảo.*

---

## Tài liệu Tham khảo (References)

> *Ghi chú: Toàn bộ danh mục tài liệu tham khảo được giữ nguyên văn bản gốc bằng tiếng Anh để phục vụ việc tra cứu và trích dẫn học thuật chuẩn xác trong luận văn.*

[1] A2A Protocol Working Group. Agent2agent protocol specification, version 1.0.0. Linux Foundation open technical specification, March 2026. URL https://a2a-protocol.org/v1.0.0/specification/.

[2] Anthropic. Developing a computer use model. Official public-beta announcement, October 2024. URL https://www.anthropic.com/news/developing-computer-use.

[3] Anthropic. Introducing the model context protocol. Official announcement, November 2024. URL https://www.anthropic.com/news/model-context-protocol.

[4] Anthropic. Improving our alignment and security efforts. Official incident and practices report, August 2026. URL https://www.anthropic.com/news/improving-alignment-security-efforts. First-party report; accessed 31 August 2026.

[5] Anthropic. Previewing the model hardware standard. Official limited research-preview announcement, August 2026. URL https://www.anthropic.com/news/model-hardware-standard-research-preview. Accessed 31 August 2026.

[6] Mido Assran, Adrien Bardes, David Fan, Quentin Garrido, Russell Howes, Mojtaba Komeili, Matthew Muckley, Ammar Rizvi, Claire Roberts, Koustuv Sinha, Artem Zholus, Sergio Arnaud, Abha Gejji, Ada Martin, Francois Robert Hogan, Daniel Dugas, Piotr Bojanowski, Vasil Khalidov, Patrick Labatut, Francisco Massa, Marc Szafraniec, Kapil Krishnakumar, Yong Li, Xiaodong Ma, Sarath Chandar, Franziska Meier, Yann LeCun, Michael Rabbat, and Nicolas Ballas. V-JEPA 2: Self-supervised video models enable understanding, prediction and planning. arXiv preprint arXiv:2506.09985, 2025. doi: 10.48550/arXiv.2506.09985. URL https://arxiv.org/abs/2506.09985.

[7] Jonas Becker, Lars Benedikt Kaesberg, Andreas Stephan, Jan Philip Wahle, Terry Ruas, and Bela Gipp. Stay focused: Problem drift in multi-agent debate. In Findings of the Association for Computational Linguistics: EACL 2026, pages 5068–5102. Association for Computational Linguistics, March 2026. doi: 10.18653/v1/2026.findings-eacl.268. URL https://aclanthology.org/2026.findings-eacl.268/.

[8] Daniil A. Boiko, Robert MacKnight, Ben Kline, and Gabe Gomes. Autonomous chemical research with large language models. Nature, 624:570–578, 2023. doi: 10.1038/s41586-023-06792-0. URL https://doi.org/10.1038/s41586-023-06792-0.

[9] Andres M. Bran, Sam Cox, Oliver Schilter, Carlo Baldassari, Andrew D. White, and Philippe Schwaller. Augmenting large language models with chemistry tools. Nature Machine Intelligence, 6:525–535, 2024. doi: 10.1038/s42256-024-00832-8. URL https://doi.org/10.1038/s42256-024-00832-8.

[10] Edoardo Debenedetti, Jie Zhang, Mislav Balunović, Luca Beurer-Kellner, Marc Fischer, and Florian Tramèr. AgentDojo: A dynamic environment to evaluate prompt injection attacks and defenses for LLM agents. In Advances in Neural Information Processing Systems, volume 37, 2024. URL https://arxiv.org/abs/2406.13352.

[11] Adam Fourney, Gagan Bansal, Hussein Mozannar, Cheng Tan, Eduardo Salinas, Erkang Zhu, Friederike Niedtner, Grace Proebsting, Griffin Bassman, Jack Gerrits, Jacob Alber, Peter Chang, Ricky Loynd, Robert West, Victor Dibia, Ahmed Awadallah, Ece Kamar, Rafah Hosn, and Saleema Amershi. Magentic-one: A generalist multi-agent system for solving complex tasks. Technical Report MSR-TR-2024-47, Microsoft Research, November 2024. URL https://arxiv.org/abs/2411.04468.

[12] Gemini Robotics Team, Saminda Abeyruwan, Joshua Ainslie, Jean-Baptiste Alayrac, Montserrat Gonzalez Arenas, Travis Armstrong, Ashwin Balakrishna, et al. Gemini robotics: Bringing AI into the physical world. arXiv preprint arXiv:2503.20020, 2025. doi: 10.48550/arXiv.2503.20020. URL https://arxiv.org/abs/2503.20020.

[13] Carlos E. Jimenez, John Yang, Alexander Wettig, Shunyu Yao, Kexin Pei, Ofir Press, and Karthik Narasimhan. SWE-bench: Can language models resolve real-world GitHub issues? In International Conference on Learning Representations, 2024. URL https://openreview.net/forum?id=VTF8yNQM66.

[14] Moo Jin Kim, Karl Pertsch, Siddharth Karamcheti, Ted Xiao, Ashwin Balakrishna, Suraj Nair, Rafael Rafailov, Ethan Foster, Grace Lam, Pannag Sanketi, Quan Vuong, Thomas Kollar, Benjamin Burchfiel, Russ Tedrake, Dorsa Sadigh, Sergey Levine, Percy Liang, and Chelsea Finn. OpenVLA: An open-source vision-language-action model. arXiv preprint arXiv:2406.09246, 2024. doi: 10.48550/arXiv.2406.09246. URL https://arxiv.org/abs/2406.09246.

[15] Thomas Kwa, Ben West, Joel Becker, Amy Deng, Katharyn Garcia, Max Hasin, Sami Jawhar, Megan Kinniment, Nate Rush, Sydney Von Arx, Ryan Bloom, Thomas Broadley, Haoxing Du, Brian Goodrich, Nikola Jurkovic, Luke Harold Miles, Seraphina Nix, Tao Lin, Neev Parikh, David Rein, Lucas Jun Koba Sato, Hjalmar Wijk, Daniel M. Ziegler, Elizabeth Barnes, and Lawrence Chan. Measuring AI ability to complete long tasks. arXiv preprint arXiv:2503.14499, 2025. URL https://arxiv.org/abs/2503.14499.

[16] Jiahang Lin, Shichun Liu, Chengjun Pan, Lizhi Lin, Shihan Dou, Zhiheng Xi, Xuanjing Huang, Hang Yan, Zhenhua Han, Tao Gui, and Yu-Gang Jiang. Agentic harness engineering: Observability-driven automatic evolution of coding-agent harnesses. arXiv preprint arXiv:2604.25850, 2026. doi: 10.48550/arXiv.2604.25850. URL https://arxiv.org/abs/2604.25850.

[17] Linux Foundation. Linux foundation launches the agent2agent protocol project to enable secure, intelligent communication between AI agents. Official project announcement, June 2025. URL https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents.

[18] Xiao Liu, Hao Yu, Hanchen Zhang, Yifan Xu, Xuanyu Lei, Hanyu Lai, Yu Gu, Hangliang Ding, Kaiwen Men, Kejuan Yang, Shudan Zhang, Xiang Deng, Aohan Zeng, Zhengxiao Du, Chenhui Zhang, Sheng Shen, Tianjun Zhang, Yu Su, Huan Sun, Minlie Huang, Yuxiao Dong, and Jie Tang. AgentBench: Evaluating LLMs as agents. In The Twelfth International Conference on Learning Representations, 2024. URL https://openreview.net/forum?id=zAdUB0aCTQ.

[19] Indrajeet Mandal, Jitendra Soni, Mohd Zaki, Morten M. Smedskjaer, Katrin Wondraczek, Lothar Wondraczek, Nitya Nand Gosvami, and N. M. Anoop Krishnan. Evaluating large language model agents for automation of atomic force microscopy. Nature Communications, 16:9104, 2025. doi: 10.1038/s41467-025-64105-7. URL https://doi.org/10.1038/s41467-025-64105-7.

[20] Pulak Mehta. Security risks of AI agents hiring humans: An empirical marketplace study. arXiv preprint arXiv:2602.19514, 2026. doi: 10.48550/arXiv.2602.19514. URL https://arxiv.org/abs/2602.19514.

[21] Model Context Protocol Contributors. Elicitation. Model Context Protocol specification, June 2025. URL https://modelcontextprotocol.io/specification/2025-06-18/client/elicitation.

[22] Model Context Protocol Contributors. The 2026-07-28 specification. Official specification release note, July 2026. URL https://blog.modelcontextprotocol.io/posts/2026-07-28/.

[23] Model Context Protocol Contributors. Model context protocol specification, revision 2026-07-28. Open technical specification, July 2026. URL https://modelcontextprotocol.io/specification/2026-07-28.

[24] Hussein Mozannar, Gagan Bansal, Cheng Tan, Adam Fourney, Victor Dibia, Jingya Chen, Jack Gerrits, Tyler Payne, Matheus Kunzler Maldaner, Madeleine Grunde-McLaughlin, Eric Zhu, Griffin Bassman, Jacob Alber, Peter Chang, Ricky Loynd, Friederike Niedtner, Ece Kamar, Maya Murad, Rafah Hosn, and Saleema Amershi. Magentic-ui: Towards human-in-the-loop agentic systems. Technical Report MSR-TR-2025-40, Microsoft Research, July 2025. URL https://www.microsoft.com/en-us/research/publication/magentic-ui-report/.

[25] Xuying Ning, Katherine Tieu, Dongqi Fu, Tianxin Wei, Zihao Li, Yuanchen Bei, Jiaru Zou, et al. Code as agent harness. arXiv preprint arXiv:2605.18747, 2026. doi: 10.48550/arXiv.2605.18747. URL https://arxiv.org/abs/2605.18747.

[26] Yansong Ning, Jingwen Ye, Zhongkai Wu, Yang Sun, Yiqin Zhu, Xingyi Li, Weidong Zhang, and Hao Liu. VibeWorlding: Can multimodal agents construct 3d open worlds end-to-end? arXiv preprint arXiv:2608.15265, 2026. doi: 10.48550/arXiv.2608.15265. URL https://arxiv.org/abs/2608.15265.

[27] NVIDIA, Niket Agarwal, Arslan Ali, Maciej Bala, Yogesh Balaji, Erik Barker, Tiffany Cai, et al. Cosmos world foundation model platform for physical AI. arXiv preprint arXiv:2501.03575, 2025. doi: 10.48550/arXiv.2501.03575. URL https://arxiv.org/abs/2501.03575.

[28] OpenAI. Introducing codex. Official research-preview announcement, May 2025. URL https://openai.com/index/introducing-codex/.

[29] OpenAI. Codex is now generally available. Official product announcement, October 2025. URL https://openai.com/index/codex-now-generally-available/.

[30] OpenAI. Computer-using agent. Official research-preview report, January 2025. URL https://openai.com/index/computer-using-agent/.

[31] OpenAI. Operator system card. System card, January 2025. URL https://openai.com/index/operator-system-card/.

[32] Joon Sung Park, Joseph O’Brien, Carrie Jun Cai, Meredith Ringel Morris, Percy Liang, and Michael S. Bernstein. Generative agents: Interactive simulacra of human behavior. In Proceedings of the 36th Annual ACM Symposium on User Interface Software and Technology, pages 1–22, 2023. doi: 10.1145/3586183.3606763. URL https://doi.org/10.1145/3586183.3606763.

[33] Jack Parker-Holder and Shlomi Fruchter. Genie 3: A new frontier for world models. Google DeepMind limited research-preview announcement, August 2025. URL https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/.

[34] RentAHuman. Agent setup, MCP, and REST API documentation. Official platform documentation, 2026. URL https://rentahuman.ai/docs. Accessed 31 August 2026.

[35] Yangjun Ruan, Honghua Dong, Andrew Wang, Silviu Pitis, Yongchao Zhou, Jimmy Ba, Yann Dubois, Chris J. Maddison, and Tatsunori Hashimoto. Identifying the risks of LM agents with an LM-emulated sandbox. arXiv preprint arXiv:2309.15817, 2023. doi: 10.48550/arXiv.2309.15817. URL https://arxiv.org/abs/2309.15817.

[36] Pablo Salazar-Villacis and Brahim Benyahia. The ADePT framework for assessing autonomous laboratory robotics. Communications Chemistry, 9:99, 2026. doi: 10.1038/s42004-026-01932-9. URL https://doi.org/10.1038/s42004-026-01932-9.

[37] Timo Schick, Jane Dwivedi-Yu, Roberto Dessì, Roberta Raileanu, Maria Lomeli, Eric Hambro, Luke Zettlemoyer, Nicola Cancedda, and Thomas Scialom. Toolformer: Language models can teach themselves to use tools. In Advances in Neural Information Processing Systems, volume 36, 2023. URL https://proceedings.neurips.cc/paper_files/paper/2023/hash/d842425e4bf79ba039352da0f658a906-Abstract-Conference.html.

[38] Noah Shinn, Federico Cassano, Ashwin Gopinath, Karthik Narasimhan, and Shunyu Yao. Reflexion: Language agents with verbal reinforcement learning. In Advances in Neural Information Processing Systems, volume 36, pages 8634–8652, 2023. URL https://proceedings.neurips.cc/paper_files/paper/2023/hash/1b44b878bb782e6954cd888628510e90-Abstract-Conference.html.

[39] SIMA Team, Maria Abi Raad, Arun Ahuja, Catarina Barros, Frederic Besse, Andrew Bolt, Adrian Bolton, et al. Scaling instructable agents across many simulated worlds. arXiv preprint arXiv:2404.10179, 2024. doi: 10.48550/arXiv.2404.10179. URL https://arxiv.org/abs/2404.10179.

[40] Tobin South, Samuele Marro, Thomas Hardjono, Robert Mahari, Cedric Deslandes Whitney, Dazza Greenwood, Alan Chan, and Alex Pentland. Authenticated delegation and authorized AI agents. arXiv preprint arXiv:2501.09674, 2025. doi: 10.48550/arXiv.2501.09674. URL https://arxiv.org/abs/2501.09674.

[41] Theodore R. Sumers, Shunyu Yao, Karthik Narasimhan, and Thomas L. Griffiths. Cognitive architectures for language agents. Transactions on Machine Learning Research, 2024. URL https://openreview.net/forum?id=1i6ZCyf1QJ.

[42] Rao Surapaneni, Miku Jha, Michael Vakoc, and Todd Segal. Announcing the agent2agent protocol (A2A). Google Developers Blog, April 2025. URL https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/.

[43] Nathan J. Szymanski, Bernardus Rendy, Yuxing Fei, Rishi E. Kumar, Tanjin He, David Milsted, Matthew J. McDermott, Max Gallant, Ekin Dogus Cubuk, Amil Merchant, Haegyeom Kim, Anubhav Jain, Christopher J. Bartel, Kristin Persson, Yan Zeng, and Gerbrand Ceder. An autonomous laboratory for the accelerated synthesis of inorganic materials. Nature, 624:86–91, 2023. doi: 10.1038/s41586-023-06734-w. URL https://doi.org/10.1038/s41586-023-06734-w.

[44] Nathan J. Szymanski, Bernardus Rendy, Yuxing Fei, Rishi E. Kumar, Tanjin He, David Milsted, Matthew J. McDermott, Max Gallant, Ekin Dogus Cubuk, Amil Merchant, Haegyeom Kim, Anubhav Jain, Christopher J. Bartel, Kristin Persson, Yan Zeng, and Gerbrand Ceder. Author correction: An autonomous laboratory for the accelerated synthesis of inorganic materials. Nature, 650:E1, 2026. doi: 10.1038/s41586-025-09992-y. URL https://doi.org/10.1038/s41586-025-09992-y.

[45] Dat Tran and Douwe Kiela. Single-agent LLMs outperform multi-agent systems on multi-hop reasoning under equal thinking token budgets. arXiv preprint arXiv:2604.02460, 2026. doi: 10.48550/arXiv.2604.02460. URL https://arxiv.org/abs/2604.02460.

[46] VAST AI Research. Project eden: The first world model for AI-native multiplayer and agent interaction in a consistent world state. Official research preview, June 2026. URL https://www.tripo3d.ai/research/project-eden. Title reproduces the provider’s positioning; accessed 31 August 2026.

[47] Guanzhi Wang, Yuqi Xie, Yunfan Jiang, Ajay Mandlekar, Chaowei Xiao, Yuke Zhu, Linxi Fan, and Anima Anandkumar. Voyager: An open-ended embodied agent with large language models. arXiv preprint arXiv:2305.16291, 2023. URL https://arxiv.org/abs/2305.16291.

[48] Lei Wang, Chen Ma, Xueyang Feng, Zeyu Zhang, Hao Yang, Jingsen Zhang, Zhiyuan Chen, Jiakai Tang, Xu Chen, Yankai Lin, Wayne Xin Zhao, Zhewei Wei, and Jirong Wen. A survey on large language model based autonomous agents. Frontiers of Computer Science, 18:186345, 2024. doi: 10.1007/s11704-024-40231-1. URL https://doi.org/10.1007/s11704-024-40231-1.

[49] Qingyun Wu, Gagan Bansal, Jieyu Zhang, Yiran Wu, Beibin Li, Erkang Zhu, Li Jiang, Xiaoyun Zhang, Shaokun Zhang, Jiale Liu, Ahmed Hassan Awadallah, Ryen W. White, Doug Burger, and Chi Wang. AutoGen: Enabling next-gen LLM applications via multi-agent conversations. In First Conference on Language Modeling, 2024. URL https://openreview.net/forum?id=BAakY1hNKS.

[50] Tianbao Xie, Danyang Zhang, Jixuan Chen, Xiaochuan Li, Siheng Zhao, Ruisheng Cao, Toh Jing Hua, Zhoujun Cheng, Dongchan Shin, Fangyu Lei, Yitao Liu, Yiheng Xu, Shuyan Zhou, Silvio Savarese, Caiming Xiong, Victor Zhong, and Tao Yu. OSWorld: Benchmarking multimodal agents for open-ended tasks in real computer environments. In Advances in Neural Information Processing Systems, volume 37, pages 52040–52094, 2024. doi: 10.52202/079017-1650. URL https://proceedings.neurips.cc/paper_files/paper/2024/hash/5d413e48f84dc61244b6be550f1cd8f5-Abstract-Datasets_and_Benchmarks_Track.html.

[51] John Yang, Carlos E. Jimenez, Alexander Wettig, Kilian Lieret, Shunyu Yao, Karthik Narasimhan, and Ofir Press. SWE-agent: Agent-computer interfaces enable automated software engineering. In Advances in Neural Information Processing Systems, volume 37, 2024. doi: 10.52202/079017-1601. URL https://proceedings.neurips.cc/paper_files/paper/2024/hash/5a7c947568c1b1328ccc5230172e1e7c-Abstract-Conference.html.

[52] Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, and Yuan Cao. ReAct: Synergizing reasoning and acting in language models. In International Conference on Learning Representations, 2023. URL https://openreview.net/forum?id=WE_vluYUL-X.

[53] Shunyu Yao, Noah Shinn, Pedram Razavi, and Karthik Narasimhan. τ -bench: A benchmark for tool-agent-user interaction in real-world domains. In International Conference on Learning Representations, 2025. URL https://openreview.net/forum?id=roNSXZpUDN.

[54] Asaf Yehudai, Lilach Eden, Alan Li, Guy Uziel, Yilun Zhao, Roy Bar-Haim, Arman Cohan, and Michal Shmueli-Scheuer. A survey on evaluation of LLM-based agents. In Findings of the Association for Computational Linguistics: ACL 2026, pages 26690–26714, 2026. doi: 10.18653/v1/2026.findings-acl.1330. URL https://aclanthology.org/2026.findings-acl.1330/.

[55] Hanrong Zhang, Jingyuan Huang, Kai Mei, Yifei Yao, Zhenting Wang, Chenlu Zhan, Hongwei Wang, and Yongfeng Zhang. Agent security bench (ASB): Formalizing and benchmarking attacks and defenses in LLM-based agents. arXiv preprint arXiv:2410.02644, 2024. doi: 10.48550/arXiv.2410.02644. URL https://arxiv.org/abs/2410.02644.

[56] Shuyan Zhou, Frank F. Xu, Hao Zhu, Xuhui Zhou, Robert Lo, Abishek Sridhar, Xianyi Cheng, Tianyue Ou, Yonatan Bisk, Daniel Fried, Uri Alon, and Graham Neubig. WebArena: A realistic web environment for building autonomous agents. In International Conference on Learning Representations, 2024. URL https://proceedings.iclr.cc/paper_files/paper/2024/hash/4410c0711e9154a7a2d26f9b3816d1ef-Abstract-Conference.html.

[57] Brianna Zitkovich, Tianhe Yu, Sichun Xu, Peng Xu, Ted Xiao, Fei Xia, Jialin Wu, Paul Wohlhart, Stefan Welker, Ayzaan Wahid, Quan Vuong, Vincent Vanhoucke, Huong Tran, Radu Soricut, Anikait Singh, Jaspiar Singh, Pierre Sermanet, Pannag R. Sanketi, Grecia Salazar, Michael S. Ryoo, et al. RT-2: Vision-language-action models transfer web knowledge to robotic control. In Proceedings of the 7th Conference on Robot Learning, volume 229 of Proceedings of Machine Learning Research, pages 2165–2183, 2023. URL https://proceedings.mlr.press/v229/zitkovich23a.html.
