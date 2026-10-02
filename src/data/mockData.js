export const initialUsers = [
  { id: 'usr-1', name: 'TS. Hoàng Văn Thụ', email: 'thuhv@fpt.edu.vn', role: 'Lecturer', status: 'Active', department: 'Bộ môn Kỹ thuật Phần mềm - ĐH FPT' },
  { id: 'usr-2', name: 'Nguyễn Hoàng Nam', email: 'namnhse184920@fpt.edu.vn', studentId: 'SE184920', role: 'Student', status: 'Active', campus: 'FPT University Hà Nội' },
  { id: 'usr-3', name: 'Lê Tuấn Anh', email: 'anhltse180123@fpt.edu.vn', studentId: 'SE180123', role: 'Student', status: 'Active', campus: 'FPT University Hà Nội' },
  { id: 'usr-4', name: 'Trần Mai Linh', email: 'linhtmia180456@fpt.edu.vn', studentId: 'IA180456', role: 'Student', status: 'Active', campus: 'FPT University TP.HCM' },
  { id: 'usr-5', name: 'Marcus Vance', email: 'admin@fpt.edu.vn', role: 'Admin', status: 'Active', department: 'Phòng Khảo Thí & Đảm Bảo Chất Lượng FPTU' },
  { id: 'usr-6', name: 'ThS. Lê Thành Đạt', email: 'datlt@fpt.edu.vn', role: 'Lecturer', status: 'Active', department: 'Bộ môn Kỹ thuật Phần mềm - ĐH FPT' },
  { id: 'usr-7', name: 'Vũ Thu Trang', email: 'trangvttse182341@fpt.edu.vn', studentId: 'SE182341', role: 'Student', status: 'Active', campus: 'FPT University Đà Nẵng' },
  { id: 'usr-8', name: 'Đỗ Minh Đức', email: 'ducdmse171564@fpt.edu.vn', studentId: 'SE171564', role: 'Student', status: 'Active', campus: 'FPT University Hà Nội' },
  { id: 'usr-9', name: 'ThS. Nguyễn Thị Mai', email: 'maint@fpt.edu.vn', role: 'Lecturer', status: 'Active', department: 'Bộ môn An toàn Thông tin - ĐH FPT' },
];

export const initialCourses = [
  { code: 'SWD392', name: 'Kiến trúc và Thiết kế Phần mềm (Software Architecture & Design)', term: 'Fall 2026', lecturer: 'TS. Hoàng Văn Thụ', status: 'Active', enrolledStudents: 32, credits: 3 },
  { code: 'PRN231', name: 'Lập trình ứng dụng phân tán .NET (Building Distributed Applications)', term: 'Fall 2026', lecturer: 'ThS. Lê Thành Đạt', status: 'Active', enrolledStudents: 28, credits: 3 },
  { code: 'SWP391', name: 'Dự án Phát triển Phần mềm (Software Development Project)', term: 'Fall 2026', lecturer: 'ThS. Nguyễn Thị Mai', status: 'Active', enrolledStudents: 30, credits: 3 },
  { code: 'CSD201', name: 'Cấu trúc dữ liệu và giải thuật (Data Structures & Algorithms)', term: 'Fall 2026', lecturer: 'TS. Hoàng Văn Thụ', status: 'Active', enrolledStudents: 35, credits: 3 },
  { code: 'PRJ301', name: 'Lập trình ứng dụng Java Web (Java Web Applications)', term: 'Fall 2026', lecturer: 'ThS. Lê Thành Đạt', status: 'Active', enrolledStudents: 26, credits: 3 },
  { code: 'AIL302m', name: 'Học máy cơ bản (Machine Learning Fundamentals)', term: 'Fall 2026', lecturer: 'TS. Hoàng Văn Thụ', status: 'Active', enrolledStudents: 22, credits: 3 },
];

export const initialMaterials = [
  { id: 'mat-1', title: 'SWD392_Ch04_Microservices_Clean_Architecture.pdf', course: 'SWD392 - Kiến trúc và Thiết kế Phần mềm', type: 'PDF Document', status: 'Ready', uploadDate: '2026-10-01' },
  { id: 'mat-2', title: 'PRN231_Ch02_RESTful_API_and_SignalR_Realtime.pdf', course: 'PRN231 - Lập trình ứng dụng phân tán .NET', type: 'PDF Document', status: 'Ready', uploadDate: '2026-09-28' },
  { id: 'mat-3', title: 'CSD201_Ch05_Binary_Search_Tree_and_AVL.pdf', course: 'CSD201 - Cấu trúc dữ liệu và giải thuật', type: 'PDF Document', status: 'Ready', uploadDate: '2026-10-02' },
];

export const initialQuestions = [
  {
    id: 'q-1',
    content: 'Phân tích sự khác biệt cốt lõi giữa Kiến trúc Đơn khối (Monolithic) và Vi dịch vụ (Microservices). Khi nào hệ thống phần mềm nên tách microservices?',
    course: 'SWD392 - Kiến trúc và Thiết kế Phần mềm',
    source: 'AI Assisted',
    status: 'Approved',
    topic: 'Microservices & Modularization',
    idealAnswerPoints: [
      'Độ ghép nối (Coupling) & Độc lập triển khai (Deployment Independence)',
      'Khả năng mở rộng theo chiều ngang (Horizontal Scalability) theo từng dịch vụ tải cao',
      'Giao tiếp liên dịch vụ (REST API, gRPC, Message Broker/Kafka)',
      'Độ phức tạp phân tán (Distributed Tracing, Data Consistency, Eventual Consistency)'
    ]
  },
  {
    id: 'q-2',
    content: 'Giải thích vòng đời của ASP.NET Core Middleware Pipeline trong PRN231. Cơ chế bắt lỗi ngoại lệ tập trung (Global Exception Handling) hoạt động như thế nào?',
    course: 'PRN231 - Lập trình ứng dụng phân tán .NET',
    source: 'AI Assisted',
    status: 'Approved',
    topic: 'ASP.NET Core Middleware',
    idealAnswerPoints: [
      'Thứ tự pipeline dạng Request/Response delegate chain (LIFO/FIFO)',
      'Lời gọi next() để chuyển tiếp sang middleware kế tiếp',
      'Custom ExceptionMiddleware hoặc UseExceptionHandler đặt đầu pipeline',
      'Trả về chuẩn định dạng lỗi RFC 7807 ProblemDetails cho Client'
    ]
  },
  {
    id: 'q-3',
    content: 'So sánh cây nhị phân tìm kiếm cân bằng AVL với Red-Black Tree về chi phí xoay cây (rotation) khi chèn/xóa và tốc độ truy vấn đọc dữ liệu.',
    course: 'CSD201 - Cấu trúc dữ liệu và giải thuật',
    source: 'Manual Entry',
    status: 'Approved',
    topic: 'Binary Search Tree & Balancing',
    idealAnswerPoints: [
      'Hệ số cân bằng nghiêm ngặt (Strict balance factor -1, 0, 1 của cây AVL)',
      'Cây AVL đọc/tìm kiếm nhanh hơn do chiều cao cây tối ưu chặt chẽ hơn',
      'Red-Black Tree tối ưu hơn cho thao tác chèn/xóa vì ít thao tác xoay cây hơn (tối đa 2/3 rotations)',
      'Ứng dụng thực tế (.NET SortedDictionary vs Java TreeMap dùng Red-Black Tree)'
    ]
  },
  {
    id: 'q-4',
    content: 'Trong thiết kế Clean Architecture, nguyên tắc Dependency Inversion (DIP) được áp dụng như thế nào để tách biệt Domain Logic khỏi cơ sở dữ liệu và framework bên ngoài?',
    course: 'SWD392 - Kiến trúc và Thiết kế Phần mềm',
    source: 'AI Assisted',
    status: 'Approved',
    topic: 'Clean Architecture & SOLID',
    idealAnswerPoints: [
      'Domain Layer đặt tại trung tâm, hoàn toàn không phụ thuộc bất kỳ database hay framework nào',
      'Repository Interface được khai báo tại Domain/Application Layer',
      'Infrastructure Layer triển khai thực thi Interface (Inversion of Control)',
      'Sử dụng Dependency Injection Container để đăng ký và tiêm phụ thuộc lúc runtime'
    ]
  },
];

export const initialRubric = [
  { id: 'rub-1', criterion: 'Độ chính xác kỹ thuật & Kiến trúc', description: 'Định nghĩa chuẩn xác các nguyên lý kiến trúc, mẫu thiết kế (Patterns), thuật toán và thuật ngữ chuyên ngành.', weight: 4.0, maxPoints: 4.0 },
  { id: 'rub-2', criterion: 'Khả năng phản biện & Lập luận viva', description: 'Giải thích mạch lạc, tự tin giải trình căn cứ lựa chọn giải pháp kỹ thuật, phân tích trade-off.', weight: 4.0, maxPoints: 4.0 },
  { id: 'rub-3', criterion: 'Ứng biến với câu hỏi phụ AI', description: 'Khả năng bổ sung luận điểm và làm rõ các chi tiết bị thiếu khi AI Examiner đặt câu hỏi đào sâu.', weight: 2.0, maxPoints: 2.0 },
];

export const initialExamSessions = [
  {
    id: 'ses-1',
    name: 'SWD392 Oral Viva - Lớp SE1801',
    course: 'SWD392 - Kiến trúc và Thiết kế Phần mềm',
    lecturer: 'TS. Hoàng Văn Thụ',
    dateTime: 'Hôm nay | 08:30 - 11:30',
    studentsCount: 32,
    questionsCount: 2,
    status: 'In Progress',
  },
  {
    id: 'ses-2',
    name: 'PRN231 Midterm Viva - Lớp SE1802',
    course: 'PRN231 - Lập trình ứng dụng phân tán .NET',
    lecturer: 'ThS. Lê Thành Đạt',
    dateTime: 'Ngày mai | 13:30 - 17:00',
    studentsCount: 28,
    questionsCount: 2,
    status: 'Scheduled',
  },
  {
    id: 'ses-3',
    name: 'CSD201 Final Viva Voce - Lớp CS1801',
    course: 'CSD201 - Cấu trúc dữ liệu và giải thuật',
    lecturer: 'TS. Hoàng Văn Thụ',
    dateTime: '18/10/2026 | 09:00',
    studentsCount: 35,
    questionsCount: 3,
    status: 'Scheduled',
  },
];

export const initialMonitorStudents = [
  { id: 'st-1', name: 'Nguyễn Hoàng Nam', studentId: 'SE184920', status: 'In Progress', currentQ: 'Câu 1 của 2 (Đang hỏi phụ)', elapsed: '05:42' },
  { id: 'st-2', name: 'Lê Tuấn Anh', studentId: 'SE180123', status: 'Completed', currentQ: 'Đã hoàn thành thi', elapsed: '11:20' },
  { id: 'st-3', name: 'Trần Mai Linh', studentId: 'IA180456', status: 'Waiting', currentQ: 'Hàng đợi vị trí #1', elapsed: '00:00' },
  { id: 'st-4', name: 'Vũ Thu Trang', studentId: 'SE182341', status: 'Waiting', currentQ: 'Hàng đợi vị trí #2', elapsed: '00:00' },
];

export const initialEvaluations = [
  {
    id: 'eval-1',
    studentName: 'Nguyễn Hoàng Nam',
    studentId: 'SE184920',
    campus: 'FPT University Hà Nội',
    course: 'SWD392 - Kiến trúc và Thiết kế Phần mềm',
    examSession: 'SWD392 Oral Viva - Lớp SE1801',
    status: 'Finalized',
    duration: '08:45',
    question: 'Phân tích sự khác biệt cốt lõi giữa Kiến trúc Đơn khối (Monolithic) và Vi dịch vụ (Microservices). Khi nào hệ thống phần mềm nên tách microservices?',
    studentTranscript: 'Kiến trúc Monolith đóng gói toàn bộ chức năng vào một khối triển khai duy nhất, dễ phát triển ban đầu nhưng khó mở rộng độc lập khi quy mô dự án lớn. Kiến trúc Microservices chia nhỏ hệ thống thành các dịch vụ độc lập theo ranh giới nghiệp vụ (Bounded Context), giao tiếp qua HTTP REST hoặc Message Broker như Kafka/RabbitMQ. Hệ thống nên tách microservices khi quy mô đội ngũ phát triển đông, cần độc lập chu kỳ release và có các module chịu tải đột biến cần scale riêng.',
    followUpTriggered: true,
    followUpQuestion: 'Bạn đã giải thích rất tốt về khả năng mở rộng. Khi tách sang Microservices, bạn sẽ giải quyết thách thức về tính nhất quán dữ liệu (Data Consistency) giữa các dịch vụ như thế nào thay cho ACID transaction truyền thống?',
    followUpTranscript: 'Dạ trong Microservices ta sử dụng mô hình Tính nhất quán sau cùng (Eventual Consistency) và triển khai Saga Pattern (Choreography hoặc Orchestration) cùng Outbox Pattern với Message Broker, kết hợp các giao dịch bù trừ (Compensating Transactions) khi có một bước trong quy trình nghiệp vụ thất bại.',
    rubricScores: [
      { criterion: 'Độ chính xác kỹ thuật & Kiến trúc', max: 4.0, aiGiven: 3.8, lecturerGiven: 3.8 },
      { criterion: 'Khả năng phản biện & Lập luận viva', max: 4.0, aiGiven: 3.6, lecturerGiven: 3.6 },
      { criterion: 'Ứng biến với câu hỏi phụ AI', max: 2.0, aiGiven: 1.8, lecturerGiven: 1.8 },
    ],
    aiSuggestedScore: 9.2,
    aiRationale: 'Thí sinh Nguyễn Hoàng Nam (SE184920) nắm rất vững lý thuyết kiến trúc phần mềm môn SWD392. Phân tích chính xác ưu/nhược điểm Monolith vs Microservices. Phản hồi xuất sắc câu hỏi phụ về Saga Pattern và Eventual Consistency.',
    lecturerFinalScore: 9.2,
    lecturerRemarks: 'Thí sinh hiểu sâu sắc kiến trúc vi dịch vụ, trả lời lưu loát, nắm chắc kỹ thuật Saga và Outbox pattern. Đạt xuất sắc yêu cầu viva môn SWD392 Đại học FPT.',
    finalized: true,
  },
  {
    id: 'eval-2',
    studentName: 'Lê Tuấn Anh',
    studentId: 'SE180123',
    campus: 'FPT University Hà Nội',
    course: 'SWD392 - Kiến trúc và Thiết kế Phần mềm',
    examSession: 'SWD392 Oral Viva - Lớp SE1801',
    status: 'Pending',
    duration: '11:20',
    question: 'Trình bày nguyên lý Dependency Inversion Principle (DIP) trong SOLID và phân biệt với Dependency Injection (DI) cùng Inversion of Control (IoC) trong Clean Architecture.',
    studentTranscript: 'DIP là nguyên lý phát biểu rằng các module cấp cao không nên phụ thuộc vào module cấp thấp, cả hai nên phụ thuộc vào Abstraction. DI là kỹ thuật triển khai thiết kế để tiêm phụ thuộc từ bên ngoài vào qua Constructor hoặc Setter. Còn IoC là khái niệm rộng hơn, đảo ngược quyền điều khiển luồng thực thi cho một framework đảm nhiệm.',
    followUpTriggered: true,
    followUpQuestion: 'Trong Clean Architecture, tại sao Use Cases (Application Core) không được phép import trực tiếp Entity Framework hay SQL Client, và bạn áp dụng DIP ở đây như thế nào?',
    followUpTranscript: 'Dạ trong Clean Architecture, Application Core chỉ định nghĩa Interface Repository (ví dụ IOrderRepository). Lớp Infrastructure bên ngoài mới implement interface đó bằng EF Core. Khi runtime, DI Container sẽ map interface với implementation, giúp Domain logic hoàn toàn độc lập với database.',
    rubricScores: [
      { criterion: 'Độ chính xác kỹ thuật & Kiến trúc', max: 4.0, aiGiven: 3.5, lecturerGiven: 3.6 },
      { criterion: 'Khả năng phản biện & Lập luận viva', max: 4.0, aiGiven: 3.4, lecturerGiven: 3.5 },
      { criterion: 'Ứng biến với câu hỏi phụ AI', max: 2.0, aiGiven: 1.7, lecturerGiven: 1.7 },
    ],
    aiSuggestedScore: 8.6,
    aiRationale: 'Thí sinh nắm chắc phân biệt DIP, DI và IoC. Trả lời chính xác cách áp dụng DIP trong Clean Architecture để tách biệt Application Core và Infrastructure.',
    lecturerFinalScore: 8.8,
    lecturerRemarks: 'Hiểu bản chất SOLID và Clean Architecture rất tốt. Minh họa cấu trúc interface phân tầng rõ ràng.',
    finalized: false,
  },
  {
    id: 'eval-3',
    studentName: 'Trần Mai Linh',
    studentId: 'IA180456',
    campus: 'FPT University TP.HCM',
    course: 'SWD392 - Kiến trúc và Thiết kế Phần mềm',
    examSession: 'SWD392 Oral Viva - Lớp SE1801',
    status: 'Finalized',
    duration: '09:15',
    question: 'Giải thích cơ chế bảo mật xác thực OAuth 2.0 kết hợp JWT Token trong kiến trúc phân tán API Gateway. Làm thế nào để giải quyết bài toán Token Revocation khi token bị lộ?',
    studentTranscript: 'Hệ thống dùng Authorization Server cấp Access Token (JWT) ngắn hạn và Refresh Token lưu bảo mật. API Gateway đóng vai trò Reverse Proxy xác thực chữ ký số RSA của JWT mà không cần gọi database. Với Token Revocation, do JWT là stateless nên nếu bị lộ, ta phải kết hợp lưu Blacklist token trên Redis với TTL bằng thời hạn token, hoặc thu hồi Refresh Token.',
    followUpTriggered: true,
    followUpQuestion: 'Nếu kiểm tra Blacklist trên Redis cho mỗi request thì API Gateway có còn giữ được ưu điểm stateless ban đầu của JWT không?',
    followUpTranscript: 'Dạ đúng là sẽ tăng overhead truy vấn bộ nhớ đệm, nhưng độ trễ Redis ở mức microsecond nên chấp nhận được. Một giải pháp khác là giảm thời gian sống của Access Token xuống còn 5 phút để hạn chế rủi ro mà không cần check blacklist thường xuyên.',
    rubricScores: [
      { criterion: 'Độ chính xác kỹ thuật & Kiến trúc', max: 4.0, aiGiven: 3.9, lecturerGiven: 3.9 },
      { criterion: 'Khả năng phản biện & Lập luận viva', max: 4.0, aiGiven: 3.8, lecturerGiven: 3.8 },
      { criterion: 'Ứng biến với câu hỏi phụ AI', max: 2.0, aiGiven: 1.9, lecturerGiven: 1.8 },
    ],
    aiSuggestedScore: 9.6,
    aiRationale: 'Thí sinh chuyên ngành An toàn thông tin trả lời cực kỳ sắc bén, nắm sâu cơ chế JWT stateless và đánh giá tradeoff bộ nhớ đệm Redis.',
    lecturerFinalScore: 9.5,
    lecturerRemarks: 'Kiến thức an ninh mạng và kiến trúc phân tán xuất sắc. Lập luận phản biện phản ứng nhanh và logic.',
    finalized: true,
  },
  {
    id: 'eval-4',
    studentName: 'Vũ Thu Trang',
    studentId: 'SE182341',
    campus: 'FPT University Đà Nẵng',
    course: 'SWD392 - Kiến trúc và Thiết kế Phần mềm',
    examSession: 'SWD392 Oral Viva - Lớp SE1801',
    status: 'Pending',
    duration: '07:50',
    question: 'Phân tích mẫu thiết kế Repository kết hợp Unit of Work. Khi nào sử dụng mẫu này gây phản tác dụng (anti-pattern) khi làm việc với ORM hiện đại như EF Core hoặc Hibernate?',
    studentTranscript: 'Mẫu Repository trừu tượng hóa tầng truy cập dữ liệu, Unit of Work quản lý một transaction duy nhất cho nhiều thao tác. Gây phản tác dụng khi EF Core bản thân DbContext đã là một Unit of Work và DbSet đã là Repository. Tạo thêm một tầng Generic Repository bên trên chỉ làm tăng code boilerplate mà mất đi các tính năng nâng cao như ChangeTracker hay Include IQueryable.',
    followUpTriggered: true,
    followUpQuestion: 'Nếu không dùng Generic Repository, bạn sẽ tổ chức tầng Data Access như thế nào để vừa kiểm thử (Unit Test) được vừa tận dụng sức mạnh của ORM?',
    followUpTranscript: 'Dạ ta có thể định nghĩa Specific Repository cho từng Aggregate Root với các method nghiệp vụ cụ thể, hoặc dùng CQRS với MediatR, tách truy vấn Query và lệnh Command, dùng InMemory Database hoặc Testcontainers để integration test.',
    rubricScores: [
      { criterion: 'Độ chính xác kỹ thuật & Kiến trúc', max: 4.0, aiGiven: 3.2, lecturerGiven: 3.3 },
      { criterion: 'Khả năng phản biện & Lập luận viva', max: 4.0, aiGiven: 3.1, lecturerGiven: 3.2 },
      { criterion: 'Ứng biến với câu hỏi phụ AI', max: 2.0, aiGiven: 1.5, lecturerGiven: 1.5 },
    ],
    aiSuggestedScore: 7.8,
    aiRationale: 'Hiểu được hạn chế của Generic Repository trên ORM hiện đại. Câu trả lời phần test cần mở rộng thêm về mocking DbContext.',
    lecturerFinalScore: 8.0,
    lecturerRemarks: 'Nắm vững vấn đề thực tế trong phát triển phần mềm doanh nghiệp. Điểm số phù hợp năng lực.',
    finalized: false,
  },
  {
    id: 'eval-5',
    studentName: 'Đỗ Minh Đức',
    studentId: 'SE171564',
    campus: 'FPT University Cần Thơ',
    course: 'SWD392 - Kiến trúc và Thiết kế Phần mềm',
    examSession: 'SWD392 Oral Viva - Lớp SE1801',
    status: 'Pending',
    duration: '10:05',
    question: 'Trình bày mô hình CQRS (Command Query Responsibility Segregation) và Event Sourcing. Những trường hợp nào KHÔNG nên áp dụng kiến trúc này?',
    studentTranscript: 'CQRS tách biệt đường ghi Command và đường đọc Query thành hai model riêng biệt để tối ưu hóa hiệu năng đọc/ghi. Event Sourcing lưu lại toàn bộ các sự kiện thay đổi trạng thái thay vì chỉ lưu trạng thái hiện tại. Không nên áp dụng cho hệ thống CRUD đơn giản, lưu lượng truy cập thấp vì làm tăng độ tích hợp hệ thống, đòi hỏi xử lý Eventual Consistency và chi phí vận hành cao.',
    followUpTriggered: true,
    followUpQuestion: 'Khi Event Sourcing có hàng triệu sự kiện theo thời gian, làm thế nào để tái tạo lại trạng thái đối tượng một cách nhanh chóng mà không phải replay từ sự kiện đầu tiên?',
    followUpTranscript: 'Dạ hệ thống sử dụng cơ chế Snapshotting. Định kỳ cứ sau N sự kiện (ví dụ 100 sự kiện), hệ thống lưu lại snapshot trạng thái hiện tại. Khi cần khôi phục, hệ thống chỉ cần nạp snapshot gần nhất và replay các sự kiện diễn ra sau snapshot đó.',
    rubricScores: [
      { criterion: 'Độ chính xác kỹ thuật & Kiến trúc', max: 4.0, aiGiven: 3.7, lecturerGiven: 3.7 },
      { criterion: 'Khả năng phản biện & Lập luận viva', max: 4.0, aiGiven: 3.6, lecturerGiven: 3.6 },
      { criterion: 'Ứng biến với câu hỏi phụ AI', max: 2.0, aiGiven: 1.8, lecturerGiven: 1.8 },
    ],
    aiSuggestedScore: 9.1,
    aiRationale: 'Thí sinh hiểu rõ bản chất CQRS & Event Sourcing, chỉ ra chính xác kỹ thuật Snapshotting để giải quyết bài toán hiệu năng.',
    lecturerFinalScore: 9.1,
    lecturerRemarks: 'Trả lời mạch lạc, đúng trọng tâm kỹ thuật, giải thích kỹ thuật Snapshotting chính xác.',
    finalized: false,
  },
];

export const initialEvaluation = initialEvaluations[0];

export const initialExamSettings = {
  answerTimeoutSeconds: 120,
  maxFollowUps: 2,
  ttsVoicePersona: 'Academic Standard (Vietnamese / English - FPT Voice)',
  sttConfidenceThreshold: 'Standard (85% confidence)',
  mandatoryLecturerVerification: true,
};
