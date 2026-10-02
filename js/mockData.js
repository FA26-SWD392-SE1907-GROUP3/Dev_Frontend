// FPT University Academic Dataset for AIVES – AI Viva Examination System
export const MockData = {
  users: [
    { id: 'usr-001', name: 'Marcus Chen', rollNumber: 'ADM-001', email: 'marcus.chen@fe.edu.vn', role: 'Admin', department: 'FPT Academic IT Operations', status: 'Active' },
    { id: 'usr-002', name: 'Dr. Eleanor Vance', rollNumber: 'LEC-002', email: 'vancee@fe.edu.vn', role: 'Lecturer', department: 'Kỹ thuật Phần mềm (SE)', status: 'Active' },
    { id: 'usr-003', name: 'Dr. Michael Chang', rollNumber: 'LEC-003', email: 'changm@fe.edu.vn', role: 'Lecturer', department: 'Trí tuệ Nhân tạo (AI)', status: 'Active' },
    { id: 'usr-004', name: 'Prof. Sarah Jenkins', rollNumber: 'LEC-004', email: 'jenkinss@fe.edu.vn', role: 'Lecturer', department: 'An toàn Thông tin (IA)', status: 'Active' },
    { id: 'usr-005', name: 'ThS. Nguyễn Văn Vũ', rollNumber: 'LEC-005', email: 'vunv@fe.edu.vn', role: 'Lecturer', department: 'Kỹ thuật Phần mềm (SE)', status: 'Active' },

    { id: 'std-101', name: 'Alex Morgan', rollNumber: 'SE180101', email: 'morganse180101@fpt.edu.vn', role: 'Student', department: 'Kỹ thuật Phần mềm (K18)', status: 'Active' },
    { id: 'std-102', name: 'Maya Patel', rollNumber: 'SE180102', email: 'patelmse180102@fpt.edu.vn', role: 'Student', department: 'Kỹ thuật Phần mềm (K18)', status: 'Active' },
    { id: 'std-103', name: 'David Kim', rollNumber: 'SE170103', email: 'kimdse170103@fpt.edu.vn', role: 'Student', department: 'Kỹ thuật Phần mềm (K17)', status: 'Active' },
    { id: 'std-104', name: 'Elena Rostova', rollNumber: 'AI180104', email: 'rostovaai180104@fpt.edu.vn', role: 'Student', department: 'Trí tuệ Nhân tạo (K18)', status: 'Active' },
    { id: 'std-105', name: 'Liam Thorne', rollNumber: 'SE170105', email: 'thornelse170105@fpt.edu.vn', role: 'Student', department: 'Kỹ thuật Phần mềm (K17)', status: 'Inactive' },
    { id: 'std-106', name: 'Chloe Bennett', rollNumber: 'SE180106', email: 'bennettcse180106@fpt.edu.vn', role: 'Student', department: 'Kỹ thuật Phần mềm (K18)', status: 'Active' },
    { id: 'std-107', name: 'Nguyễn Hoàng Nam', rollNumber: 'SE181122', email: 'namnhse181122@fpt.edu.vn', role: 'Student', department: 'Kỹ thuật Phần mềm (K18 - TP.HCM)', status: 'Active' },
    { id: 'std-108', name: 'Trần Minh Khang', rollNumber: 'HE170345', email: 'khangtmhe170345@fpt.edu.vn', role: 'Student', department: 'Kỹ thuật Phần mềm (K17 - Hòa Lạc)', status: 'Active' },
    { id: 'std-109', name: 'Lê Thị Mai Anh', rollNumber: 'QE180567', email: 'anhltmqe180567@fpt.edu.vn', role: 'Student', department: 'An toàn Thông tin (K18 - Quy Nhơn)', status: 'Active' },
    { id: 'std-110', name: 'Võ Quốc Huy', rollNumber: 'DE180234', email: 'huyvqde180234@fpt.edu.vn', role: 'Student', department: 'Trí tuệ Nhân tạo (K18 - Đà Nẵng)', status: 'Active' },
    { id: 'std-111', name: 'Phạm Hải Đăng', rollNumber: 'CE170890', email: 'dangphce170890@fpt.edu.vn', role: 'Student', department: 'Kỹ thuật Phần mềm (K17 - Cần Thơ)', status: 'Active' },
    { id: 'std-112', name: 'Đặng Tuấn Kiệt', rollNumber: 'IA180412', email: 'kietdtia180412@fpt.edu.vn', role: 'Student', department: 'An toàn Thông tin (K18)', status: 'Active' }
  ],

  permissionsMatrix: [
    { capability: 'Manage Users & Accounts', admin: true, lecturer: false, student: false, desc: 'Create, update, deactivate staff and student accounts' },
    { capability: 'Role & Permission Oversight', admin: true, lecturer: false, student: false, desc: 'Assign system permissions and access controls' },
    { capability: 'Course & Curriculum Management', admin: true, lecturer: true, student: false, desc: 'Provision course units, enrollments, and syllabus links' },
    { capability: 'Upload Learning Materials', admin: false, lecturer: true, student: false, desc: 'Upload lecture slides, papers, and reference documents' },
    { capability: 'Generate & Curate Question Bank', admin: true, lecturer: true, student: false, desc: 'Run AI question generation, edit, approve, and reject items' },
    { capability: 'Configure & Manage Rubrics', admin: false, lecturer: true, student: false, desc: 'Define grading dimensions, criteria weights, and scoring ranges' },
    { capability: 'Create & Publish Exam Sessions', admin: false, lecturer: true, student: false, desc: 'Setup multi-step exam sessions, assign students and question sets' },
    { capability: 'Live Oral Exam Monitoring', admin: true, lecturer: true, student: false, desc: 'Track real-time candidate connections, question progress, and timers' },
    { capability: 'Review Transcripts & AI Scores', admin: false, lecturer: true, student: false, desc: 'Examine candidate speech transcripts, follow-ups, and AI suggestions' },
    { capability: 'Finalize Human-in-the-Loop Scores', admin: false, lecturer: true, student: false, desc: 'Lecturer authority to adjust rubric criteria and finalize official grades' },
    { capability: 'Take AI-Assisted Oral Viva Exam', admin: false, lecturer: false, student: true, desc: 'Undergo voice-driven oral examination and respond to follow-ups' },
    { capability: 'View Finalized Exam Results', admin: false, lecturer: true, student: true, desc: 'Inspect confirmed final scores and lecturer feedback reports' }
  ],

  courses: [
    { id: 'crs-01', code: 'SWD392', name: 'Software Architecture & Design', lecturer: 'Dr. Eleanor Vance', studentsCount: 48, status: 'Active', description: 'Advanced architectural patterns, Clean Architecture, DDD, microservices decomposition, distributed consensus, and event-driven pipelines.' },
    { id: 'crs-02', code: 'SWP391', name: 'Software Development Project', lecturer: 'ThS. Nguyễn Văn Vũ', studentsCount: 45, status: 'Active', description: 'Scrum/Agile teamwork, sprint oral viva defense, continuous integration (CI/CD), branch management, and full-stack software delivery.' },
    { id: 'crs-03', code: 'PRN231', name: 'Building Cross-Platform Web APIs with .NET', lecturer: 'Prof. Sarah Jenkins', studentsCount: 42, status: 'Active', description: 'ASP.NET Core Web API, Entity Framework Core, JWT authentication & authorization, Repository & Unit of Work, RESTful API design.' },
    { id: 'crs-04', code: 'PRJ301', name: 'Java Web Application Development', lecturer: 'Dr. Eleanor Vance', studentsCount: 39, status: 'Active', description: 'Java Servlet, JSP, JSTL, MVC design architecture, Session Management, Filter chains, and JDBC connection pooling.' },
    { id: 'crs-05', code: 'CSD201', name: 'Data Structures and Algorithms', lecturer: 'Dr. Marcus Chen', studentsCount: 52, status: 'Active', description: 'Binary Search Trees, AVL balance rotations, Graph shortest path (Dijkstra, BFS, DFS), and algorithmic time complexity analysis.' },
    { id: 'crs-06', code: 'DBI202', name: 'Database Systems', lecturer: 'Dr. Marcus Chen', studentsCount: 55, status: 'Active', description: 'Relational database modeling, SQL query tuning, functional dependencies, 1NF to BCNF normalization, and ACID concurrency control.' },
    { id: 'crs-07', code: 'AIL302m', name: 'Machine Learning & Deep Learning', lecturer: 'Dr. Michael Chang', studentsCount: 36, status: 'Active', description: 'Supervised and unsupervised models, Neural Networks, CNNs, RNNs, Transformer foundations, self-attention, and LLM fine-tuning.' },
    { id: 'crs-08', code: 'IA201', name: 'Information Assurance & Network Security', lecturer: 'Prof. Sarah Jenkins', studentsCount: 31, status: 'Active', description: 'Cryptographic algorithms (AES, RSA, ECC), digital signatures, TLS 1.3 protocol handshake, network vulnerability scanning, and pen-testing.' }
  ],

  questionBank: [
    { id: 'q-101', question: 'Explain how the Raft consensus algorithm guarantees leader election safety in the event of a network partition.', course: 'SWD392', topic: 'Consensus Protocols', difficulty: 'Hard', source: 'Manual', status: 'Approved' },
    { id: 'q-102', question: 'Compare Event Sourcing with standard CRUD state persistence. What trade-offs arise regarding auditability versus query latency?', course: 'SWD392', topic: 'Architectural Patterns', difficulty: 'Medium', source: 'AI Generated', status: 'Approved' },
    { id: 'q-103', question: 'How do Circuit Breakers prevent cascading failures across distributed microservices? Discuss the three primary states.', course: 'SWD392', topic: 'Fault Tolerance', difficulty: 'Medium', source: 'AI Generated', status: 'Approved' },
    { id: 'q-104', question: 'Explain the Dependency Inversion Principle (DIP) in Clean Architecture and how the Repository pattern decouples the domain entity layer from EF Core/ORM infrastructure.', course: 'SWD392', topic: 'Clean Architecture', difficulty: 'Hard', source: 'Manual', status: 'Approved' },
    { id: 'q-105', question: 'In an Agile Scrum sprint viva defense, how does your project team resolve merge conflicts and guarantee zero regression on the main deployment branch?', course: 'SWP391', topic: 'Agile & DevOps', difficulty: 'Medium', source: 'Manual', status: 'Approved' },
    { id: 'q-106', question: 'Explain the ASP.NET Core middleware execution pipeline and how JWT Bearer Authentication handlers validate tokens before reaching controller actions.', course: 'PRN231', topic: 'Web API & Auth', difficulty: 'Medium', source: 'Manual', status: 'Approved' },
    { id: 'q-107', question: 'In Entity Framework Core, contrast Lazy Loading against Eager Loading via .Include(). How do you diagnose and eliminate the N+1 query problem?', course: 'PRN231', topic: 'ORM Performance', difficulty: 'Hard', source: 'AI Generated', status: 'Approved' },
    { id: 'q-108', question: 'Explain the lifecycle of a Java Servlet (init, service, destroy) and how JSESSIONID maintains state across stateless HTTP requests.', course: 'PRJ301', topic: 'Java Web Core', difficulty: 'Medium', source: 'Manual', status: 'Approved' },
    { id: 'q-109', question: 'Explain the Left-Right (LR) double rotation process in an AVL Tree when a node insertion violates balance factor bounds. What is the time complexity?', course: 'CSD201', topic: 'Balanced Trees', difficulty: 'Hard', source: 'Manual', status: 'Approved' },
    { id: 'q-110', question: 'Compare Dijkstra algorithm with Breadth-First Search (BFS) for finding shortest paths on directed graphs with positive non-uniform edge weights.', course: 'CSD201', topic: 'Graph Algorithms', difficulty: 'Medium', source: 'AI Generated', status: 'Approved' },
    { id: 'q-111', question: 'Explain the conditions required for a relation schema to satisfy Boyce-Codd Normal Form (BCNF). Why might BCNF fail to preserve functional dependencies?', course: 'DBI202', topic: 'Normalization', difficulty: 'Hard', source: 'Manual', status: 'Approved' },
    { id: 'q-112', question: 'Analyze the trade-offs between Two-Phase Locking (2PL) and Snapshot Isolation in high-throughput transactional database engines.', course: 'DBI202', topic: 'Concurrency Control', difficulty: 'Hard', source: 'AI Generated', status: 'Approved' },
    { id: 'q-113', question: 'How does Multi-Head Self-Attention in Transformer models resolve long-range token dependencies compared to Recurrent Neural Networks?', course: 'AIL302m', topic: 'Transformers', difficulty: 'Hard', source: 'AI Generated', status: 'Approved' },
    { id: 'q-114', question: 'What is the mathematical role of temperature parameter in top-k and nucleus (top-p) sampling during autoregressive text generation?', course: 'AIL302m', topic: 'Decoding Strategies', difficulty: 'Easy', source: 'Manual', status: 'Approved' },
    { id: 'q-115', question: 'Explain how Ephemeral Diffie-Hellman (DHE) achieves Perfect Forward Secrecy (PFS) in TLS 1.3 protocol handshakes.', course: 'IA201', topic: 'Applied Cryptography', difficulty: 'Medium', source: 'Manual', status: 'Approved' }
  ],

  learningMaterials: [
    { id: 'mat-01', course: 'SWD392', title: 'Chapter 06 - Distributed Consensus (Raft & Paxos).pdf', size: '4.2 MB', uploadDate: '2026-09-24', status: 'Questions Generated' },
    { id: 'mat-02', course: 'SWD392', title: 'Lecture 08 - Microservices Resilience & Circuit Breaking.pdf', size: '2.8 MB', uploadDate: '2026-09-28', status: 'Questions Generated' },
    { id: 'mat-03', course: 'PRN231', title: 'Module 04 - ASP.NET Core Web API Architecture & JWT Security.pdf', size: '3.5 MB', uploadDate: '2026-09-29', status: 'Questions Generated' },
    { id: 'mat-04', course: 'AIL302m', title: 'Vaswani et al. - Attention Is All You Need Notes.pdf', size: '1.9 MB', uploadDate: '2026-09-30', status: 'Processing' },
    { id: 'mat-05', course: 'CSD201', title: 'Chapter 05 - AVL Trees & Graph Traversal Algorithms.pdf', size: '3.1 MB', uploadDate: '2026-10-01', status: 'Questions Generated' }
  ],

  rubrics: [
    {
      id: 'rub-01',
      name: 'Standard Engineering Viva Rubric',
      course: 'SWD392',
      criteriaCount: 5,
      lastUpdated: '2026-09-22',
      status: 'Approved',
      criteria: [
        { id: 'c1', name: 'Accuracy', weight: 25, maxScore: 10, description: 'Correctness of technical definitions, algorithmic steps, and theoretical boundaries.' },
        { id: 'c2', name: 'Concept Understanding', weight: 25, maxScore: 10, description: 'Grasp of fundamental architectural concepts, trade-offs, and design rationales.' },
        { id: 'c3', name: 'Explanation Quality', weight: 20, maxScore: 10, description: 'Clarity, conciseness, structured delivery, and precision of spoken discourse.' },
        { id: 'c4', name: 'Reasoning & Problem Solving', weight: 15, maxScore: 10, description: 'Capacity to deduce edge-case implications and justify architectural decisions.' },
        { id: 'c5', name: 'Communication & Poise', weight: 15, maxScore: 10, description: 'Professionalism, responsiveness to follow-up prompts, and academic demeanor.' }
      ]
    },
    {
      id: 'rub-02',
      name: 'Advanced AI & Research Viva Rubric',
      course: 'AIL302m',
      criteriaCount: 5,
      lastUpdated: '2026-09-25',
      status: 'Approved',
      criteria: [
        { id: 'c1', name: 'Mathematical Foundations', weight: 30, maxScore: 10, description: 'Rigorous formulation of loss functions, tensor shapes, and attention heads.' },
        { id: 'c2', name: 'Model Architecture Knowledge', weight: 25, maxScore: 10, description: 'Understanding of Transformer layers, positional embeddings, and decoders.' },
        { id: 'c3', name: 'Empirical Evaluation Insight', weight: 20, maxScore: 10, description: 'Critical analysis of BLEU, ROUGE, Perplexity, and human alignment metrics.' },
        { id: 'c4', name: 'Response to AI Follow-ups', weight: 15, maxScore: 10, description: 'Ability to elaborate when probed on nuances or counterexamples.' },
        { id: 'c5', name: 'Verbal Delivery', weight: 10, maxScore: 10, description: 'Coherent verbal pacing, academic terminology, and logical organization.' }
      ]
    },
    {
      id: 'rub-03',
      name: 'Web API & Backend Engineering Rubric',
      course: 'PRN231',
      criteriaCount: 5,
      lastUpdated: '2026-09-28',
      status: 'Approved',
      criteria: [
        { id: 'c1', name: 'API Standards & Security', weight: 25, maxScore: 10, description: 'Adherence to REST conventions, HTTP status codes, and JWT security headers.' },
        { id: 'c2', name: 'ORM & Query Efficiency', weight: 25, maxScore: 10, description: 'Understanding of Entity Framework tracking, indexing, and N+1 prevention.' },
        { id: 'c3', name: 'Architectural Layering', weight: 20, maxScore: 10, description: 'Separation of concerns between Controller, Service, and Repository layers.' },
        { id: 'c4', name: 'Edge Case & Error Handling', weight: 15, maxScore: 10, description: 'Global exception middleware, validation filters, and idempotency guarantees.' },
        { id: 'c5', name: 'Spoken Articulation', weight: 15, maxScore: 10, description: 'Structured technical explanation and defense of design choices.' }
      ]
    }
  ],

  examSessions: [
    {
      id: 'EX-2026-01',
      name: 'SWD392 Oral Viva: Distributed Consistency & Clean Architecture',
      course: 'SWD392',
      courseName: 'Software Architecture & Design',
      lecturer: 'Dr. Eleanor Vance',
      date: '2026-10-12',
      startTime: '09:00 AM',
      duration: '15 mins',
      studentsCount: 36,
      status: 'In Progress',
      rubricId: 'rub-01',
      description: 'Oral assessment covering Raft consensus, Clean Architecture boundaries, circuit breaking, and event sourcing.'
    },
    {
      id: 'EX-2026-02',
      name: 'PRN231 Oral Viva: RESTful APIs, JWT Auth & EF Core Optimization',
      course: 'PRN231',
      courseName: 'Building Cross-Platform Web APIs with .NET',
      lecturer: 'Prof. Sarah Jenkins',
      date: '2026-10-15',
      startTime: '10:30 AM',
      duration: '20 mins',
      studentsCount: 42,
      status: 'Scheduled',
      rubricId: 'rub-03',
      description: 'Oral defense on ASP.NET Core middleware, JWT authentication, Repository & Unit of Work patterns, and Entity Framework query tuning.'
    },
    {
      id: 'EX-2026-03',
      name: 'SWP391 Sprint Defense: Agile Architecture & CI/CD Pipeline',
      course: 'SWP391',
      courseName: 'Software Development Project',
      lecturer: 'ThS. Nguyễn Văn Vũ',
      date: '2026-10-02',
      startTime: '02:00 PM',
      duration: '25 mins',
      studentsCount: 45,
      status: 'Completed',
      rubricId: 'rub-01',
      description: 'Project sprint viva defense, GitHub Actions CI/CD workflows, database migrations, and microservices integration.'
    },
    {
      id: 'EX-2026-04',
      name: 'AIL302m Oral Viva: Attention Mechanisms & Transformer Decoders',
      course: 'AIL302m',
      courseName: 'Machine Learning & Deep Learning',
      lecturer: 'Dr. Michael Chang',
      date: '2026-10-18',
      startTime: '01:30 PM',
      duration: '20 mins',
      studentsCount: 30,
      status: 'Scheduled',
      rubricId: 'rub-02',
      description: 'Viva voce examining self-attention, multi-query attention, KV cache, and temperature decoding in Large Language Models.'
    },
    {
      id: 'EX-2026-05',
      name: 'CSD201 Oral Viva: Balanced Trees, Graph Algorithms & Complexity',
      course: 'CSD201',
      courseName: 'Data Structures and Algorithms',
      lecturer: 'Dr. Marcus Chen',
      date: '2026-10-20',
      startTime: '11:00 AM',
      duration: '15 mins',
      studentsCount: 38,
      status: 'Draft',
      rubricId: 'rub-01',
      description: 'Viva examination on AVL balance factors, Dijkstra shortest paths, and asymptotic complexity trade-offs.'
    },
    {
      id: 'EX-2026-06',
      name: 'DBI202 Oral Viva: Transactional Isolation & Normalization',
      course: 'DBI202',
      courseName: 'Database Systems',
      lecturer: 'Dr. Marcus Chen',
      date: '2026-10-22',
      startTime: '03:00 PM',
      duration: '15 mins',
      studentsCount: 50,
      status: 'Draft',
      rubricId: 'rub-01',
      description: 'Oral viva covering Boyce-Codd Normal Form, Two-Phase Locking, and query optimization.'
    }
  ],

  // Live Exam Monitoring & Student Records with FPT University roll numbers
  liveMonitoringStudents: [
    { id: 'std-101', name: 'Alex Morgan', studentId: 'SE180101', status: 'In Progress', currentQuestion: 'Q2 (Follow-up)', progress: '65%', duration: '08:42', connection: 'Stable (32ms)' },
    { id: 'std-102', name: 'Maya Patel', studentId: 'SE180102', status: 'Completed', currentQuestion: 'Completed', progress: '100%', duration: '14:20', connection: 'Offline' },
    { id: 'std-103', name: 'David Kim', studentId: 'SE170103', status: 'In Progress', currentQuestion: 'Q1', progress: '30%', duration: '04:15', connection: 'Stable (41ms)' },
    { id: 'std-104', name: 'Elena Rostova', studentId: 'AI180104', status: 'Waiting', currentQuestion: 'Pending Start', progress: '0%', duration: '00:00', connection: 'Ready' },
    { id: 'std-106', name: 'Chloe Bennett', studentId: 'SE180106', status: 'Completed', currentQuestion: 'Completed', progress: '100%', duration: '13:50', connection: 'Offline' },
    { id: 'std-107', name: 'Nguyễn Hoàng Nam', studentId: 'SE181122', status: 'In Progress', currentQuestion: 'Q1 (Oral Defense)', progress: '45%', duration: '06:10', connection: 'Stable (28ms)' },
    { id: 'std-108', name: 'Trần Minh Khang', studentId: 'HE170345', status: 'Waiting', currentQuestion: 'Pre-check Passed', progress: '0%', duration: '00:00', connection: 'Ready' },
    { id: 'std-109', name: 'Lê Thị Mai Anh', studentId: 'QE180567', status: 'Waiting', currentQuestion: 'In Queue (Slot 4)', progress: '0%', duration: '00:00', connection: 'Ready' }
  ],

  // Detailed viva transcript with student answers and AI evaluation
  detailedTranscripts: {
    'std-101': {
      studentName: 'Alex Morgan',
      studentId: 'SE180101',
      course: 'SWD392 Software Architecture & Design',
      examName: 'SWD392 Oral Viva: Distributed Consistency & Clean Architecture',
      examId: 'EX-2026-01',
      duration: '14 mins 10 secs',
      status: 'Pending Review',
      aiSuggestedTotal: 8.2,
      lecturerFinalTotal: null,
      lecturerComments: '',
      criteriaScores: {
        c1: 8.5, // Accuracy
        c2: 8.0, // Concept Understanding
        c3: 8.5, // Explanation Quality
        c4: 7.5, // Reasoning
        c5: 8.5  // Communication
      },
      items: [
        {
          index: 1,
          question: 'Explain how the Raft consensus algorithm guarantees leader election safety in the event of a network partition.',
          studentAnswer: 'In Raft, every election term can have at most one leader elected. A candidate must receive votes from a strict majority of nodes in the cluster to win. If a partition occurs, say 3 nodes in one partition and 2 in another, only the majority partition of 3 can gather enough votes. The minority side cannot reach a quorum, so any leader elected there cannot commit entries or will be deposed once connectivity is restored.',
          aiAnalysis: 'The student accurately articulates the majority quorum rule and single leader per term principle. Clearly understands network partition behavior in minority vs majority segments.',
          aiSuggestedScore: '8.5 / 10',
          followupTriggered: true,
          followupQuestion: 'What mechanism prevents candidate nodes from endlessly splitting votes if multiple nodes initiate an election at the exact same moment?',
          followupStudentAnswer: 'Raft relies on randomized election timeouts—typically chosen randomly between 150 milliseconds and 300 milliseconds. Because timeouts are staggered, one candidate will almost always time out first, initiate its election, and collect votes before other nodes compete, which breaks the split-vote deadlock.',
          followupAiAnalysis: 'Precise recall of the randomized election timeout mechanism (150-300ms window) and clear explanation of deadlock avoidance.'
        },
        {
          index: 2,
          question: 'How do Circuit Breakers prevent cascading failures across distributed microservices? Discuss the three primary states.',
          studentAnswer: 'A circuit breaker monitors outgoing remote calls. If failure rates cross a predefined threshold, it opens the circuit to immediately fail fast without overwhelming downstream dependencies. The three states are Closed, where calls proceed normally; Open, where calls immediately fail or return cached fallback data; and Half-Open, where a limited trial number of requests are sent through to test whether the downstream service has recovered.',
          aiAnalysis: 'Correctly identifies all three finite state machine states (Closed, Open, Half-Open). Demonstrates solid comprehension of fail-fast behavior and trial probe recovery.',
          aiSuggestedScore: '8.0 / 10',
          followupTriggered: false
        }
      ]
    },
    'std-102': {
      studentName: 'Maya Patel',
      studentId: 'SE180102',
      course: 'SWD392 Software Architecture & Design',
      examName: 'SWD392 Oral Viva: Distributed Consistency & Clean Architecture',
      examId: 'EX-2026-01',
      duration: '14 mins 20 secs',
      status: 'Finalized',
      aiSuggestedTotal: 8.8,
      lecturerFinalTotal: 9.0,
      lecturerComments: 'Exceptional verbal defense. Demonstrated comprehensive understanding of partition tolerance and stateful rollback. Commended for clarity.',
      criteriaScores: {
        c1: 9.0,
        c2: 9.0,
        c3: 9.5,
        c4: 8.5,
        c5: 9.0
      },
      items: [
        {
          index: 1,
          question: 'Explain how the Raft consensus algorithm guarantees leader election safety in the event of a network partition.',
          studentAnswer: 'In the Raft protocol, leader safety is guaranteed through strict majority quorums and the log matching property. When a candidate solicits RequestVote RPCs, it must receive affirmative votes from more than half of the total cluster nodes. If a network partition splits 5 nodes into 2 and 3, only the 3-node partition can reach majority consensus. The isolated 2 nodes cannot elect a leader or commit entries. Furthermore, Raft ensures that a candidate cannot be elected unless its log is at least as up-to-date as any other voter in the quorum, preventing overwriting committed entries.',
          aiAnalysis: 'Outstanding depth of technical knowledge. Thorough explanation of the log completeness requirement and term progression in partitioned clusters.',
          aiSuggestedScore: '9.0 / 10',
          followupTriggered: true,
          followupQuestion: 'What mechanism prevents candidate nodes from endlessly splitting votes if multiple nodes initiate an election at the exact same moment?',
          followupStudentAnswer: 'Raft incorporates randomized election timeouts chosen independently within a bounded jitter window, typically 150 to 300 milliseconds. This timing entropy ensures one node almost invariably times out and transitions to candidate state first, sending out vote requests and winning the term before competitors can induce a split-vote tie.',
          followupAiAnalysis: 'Spot-on technical description of randomized timer jitter and election timeout resolution.'
        },
        {
          index: 2,
          question: 'How do Circuit Breakers prevent cascading failures across distributed microservices? Discuss the three primary states.',
          studentAnswer: 'Circuit breakers wrap remote RPC invocations. When the downstream service exhibits high latency or error rates exceeding a configured failure threshold, the breaker trips from Closed to Open. In Open state, subsequent calls fail fast immediately, avoiding resource starvation like thread pool exhaustion. After a reset timeout, it transitions to Half-Open to route canary probe requests. If probes succeed, it resets to Closed; otherwise, it returns to Open.',
          aiAnalysis: 'Flawless recall of finite state machine transitions, thread starvation prevention, and canary probe mechanisms.',
          aiSuggestedScore: '8.6 / 10',
          followupTriggered: false
        }
      ]
    },
    'std-106': {
      studentName: 'Chloe Bennett',
      studentId: 'SE180106',
      course: 'SWD392 Software Architecture & Design',
      examName: 'SWD392 Oral Viva: Distributed Consistency & Clean Architecture',
      examId: 'EX-2026-01',
      duration: '13 mins 50 secs',
      status: 'Finalized',
      aiSuggestedTotal: 7.9,
      lecturerFinalTotal: 8.0,
      lecturerComments: 'Good conceptual foundation. Explained circuit breaker states accurately. Minor hesitation during quorum calculation under partitioned network.',
      criteriaScores: {
        c1: 8.0,
        c2: 8.0,
        c3: 8.0,
        c4: 7.5,
        c5: 8.5
      },
      items: [
        {
          index: 1,
          question: 'Explain how the Raft consensus algorithm guarantees leader election safety in the event of a network partition.',
          studentAnswer: 'Raft divides time into terms and uses heartbeat timeouts. When a leader fails, nodes vote. In a partition, only the side with greater than N/2 nodes can successfully vote in a new leader. The smaller side keeps trying but cannot commit any logs.',
          aiAnalysis: 'Accurately identifies the majority requirement and term concept. Good high-level understanding.',
          aiSuggestedScore: '7.8 / 10',
          followupTriggered: false
        },
        {
          index: 2,
          question: 'How do Circuit Breakers prevent cascading failures across distributed microservices? Discuss the three primary states.',
          studentAnswer: 'Circuit breakers isolate failing dependencies so the caller does not hang waiting for timeouts. Closed means normal operation, Open means blocking traffic, and Half-Open tests if the downstream service is back up.',
          aiAnalysis: 'Clear explanation of all three states and failure containment.',
          aiSuggestedScore: '8.0 / 10',
          followupTriggered: false
        }
      ]
    },
    'std-103': {
      studentName: 'David Kim',
      studentId: 'SE170103',
      course: 'SWD392 Software Architecture & Design',
      examName: 'SWD392 Oral Viva: Distributed Consistency & Clean Architecture',
      examId: 'EX-2026-01',
      duration: '04 mins 15 secs',
      status: 'In Progress',
      aiSuggestedTotal: 7.5,
      lecturerFinalTotal: null,
      lecturerComments: '',
      criteriaScores: {
        c1: 7.5,
        c2: 7.5,
        c3: 7.0,
        c4: 7.5,
        c5: 8.0
      },
      items: [
        {
          index: 1,
          question: 'Explain how the Raft consensus algorithm guarantees leader election safety in the event of a network partition.',
          studentAnswer: 'In Raft consensus, nodes elect a leader using randomized timers. In a network partition, you need a strict majority to elect a leader and append entries. So only the side with more than 50 percent can make progress.',
          aiAnalysis: 'Solid grasp of majority requirements. Answer in progress.',
          aiSuggestedScore: '7.5 / 10',
          followupTriggered: false
        }
      ]
    }
  },

  // Student results view records with FPT University roll numbers
  resultsList: [
    {
      studentId: 'std-102',
      name: 'Maya Patel',
      universityId: 'SE180102',
      exam: 'SWD392 Oral Viva: Distributed Consistency & Clean Architecture',
      course: 'SWD392',
      aiSuggestedScore: 8.8,
      finalScore: 9.0,
      status: 'Finalized',
      completionDate: '2026-10-02'
    },
    {
      studentId: 'std-101',
      name: 'Alex Morgan',
      universityId: 'SE180101',
      exam: 'SWD392 Oral Viva: Distributed Consistency & Clean Architecture',
      course: 'SWD392',
      aiSuggestedScore: 8.2,
      finalScore: '—',
      status: 'Pending Review',
      completionDate: '2026-10-02'
    },
    {
      studentId: 'std-106',
      name: 'Chloe Bennett',
      universityId: 'SE180106',
      exam: 'SWD392 Oral Viva: Distributed Consistency & Clean Architecture',
      course: 'SWD392',
      aiSuggestedScore: 7.9,
      finalScore: 8.0,
      status: 'Finalized',
      completionDate: '2026-10-02'
    },
    {
      studentId: 'std-107',
      name: 'Nguyễn Hoàng Nam',
      universityId: 'SE181122',
      exam: 'SWD392 Oral Viva: Distributed Consistency & Clean Architecture',
      course: 'SWD392',
      aiSuggestedScore: 8.5,
      finalScore: '—',
      status: 'Pending Review',
      completionDate: '2026-10-02'
    },
    {
      studentId: 'std-108',
      name: 'Trần Minh Khang',
      universityId: 'HE170345',
      exam: 'PRN231 Oral Viva: RESTful APIs, JWT Auth & EF Core Optimization',
      course: 'PRN231',
      aiSuggestedScore: 8.7,
      finalScore: 8.5,
      status: 'Finalized',
      completionDate: '2026-10-01'
    }
  ],

  recentActivities: [
    { id: 'act-01', action: 'Exam Published', detail: 'SWD392 Oral Viva scheduled for Oct 12, 2026 by Dr. Eleanor Vance', time: '12 mins ago', type: 'exam' },
    { id: 'act-02', action: 'Question Bank Updated', detail: '5 AI-generated questions approved for SWD392 Software Architecture & Design', time: '1 hour ago', type: 'question' },
    { id: 'act-03', action: 'Score Finalized', detail: 'Dr. Eleanor Vance finalized score (9.0/10) for Maya Patel (SE180102) in SWD392', time: '3 hours ago', type: 'score' },
    { id: 'act-04', action: 'New User Enrolled', detail: 'Student Nguyễn Hoàng Nam (SE181122) enrolled into SWD392 cohort by Admin', time: 'Yesterday', type: 'user' }
  ]
};
