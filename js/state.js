import { MockData } from './mockData.js';

// Deep clone helper
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

class AppState {
  constructor() {
    this.listeners = [];
    this.data = deepClone(MockData);

    // Language (vi: Tiếng Việt, en: English)
    let savedLang = 'vi';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        savedLang = window.localStorage.getItem('aives_lang') || 'vi';
      }
    } catch (e) {}
    this.lang = savedLang;
    if (typeof window !== 'undefined') {
      window.appLang = savedLang;
    }

    // Theme (Light / Dark)
    let savedTheme = 'light';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        savedTheme = window.localStorage.getItem('aives_theme') || 'light';
      }
    } catch (e) {}
    this.theme = savedTheme;
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Initial role and view
    this.currentRole = 'lecturer'; // default demo persona: Dr. Eleanor Vance
    this.currentView = 'lecturer-dashboard';
    this.currentUser = this.data.users.find(u => u.id === 'usr-002'); // Dr. Eleanor Vance

    // System Notifications
    this.notifications = [
      { id: 'notif-1', title: 'Oral Viva Responses Submitted', message: 'Candidate Alex Morgan (SE180101) completed SWD392 Viva. Ready for lecturer review.', time: '12m ago', read: false },
      { id: 'notif-2', title: 'AI Questions Synthesized', message: '4 new draft questions generated for SWD392 from uploaded PDF.', time: '45m ago', read: false },
      { id: 'notif-3', title: 'Score Finalized & Published', message: 'Dr. Eleanor Vance confirmed 9.0/10 for Maya Patel (SE180102) in SWD392.', time: '2h ago', read: true },
      { id: 'notif-4', title: 'Hardware Diagnostics Passed', message: '36 of 36 candidates passed pre-exam audio & network check.', time: '3h ago', read: true }
    ];

    // Admin Exam Settings
    this.examSettings = {
      defaultDuration: 15,
      maxFollowUps: 1,
      silenceThreshold: 5,
      voicePersona: 'British English (Natural Academic)',
      speechRate: 0.95,
      enableWebcamProctoring: true,
      enableTabMonitoring: true,
      autoArchiveDays: 365,
      allowCandidateReplay: true
    };

    // UI Tab States
    this.detailActiveTab = 'overview';
    this.activeExamDetailId = 'EX-2026-01';
    this.studentExamTab = 'upcoming';

    // Viva Exam Interactive Session State (for student)
    this.vivaSession = {
      examId: 'EX-2026-01',
      studentId: 'std-101',
      currentQuestionIndex: 0,
      isRecording: false,
      recordingSeconds: 0,
      isSubmitting: false,
      isFollowUpMode: false,
      isTTSPlaying: false,
      questions: [
        {
          index: 1,
          text: 'Explain how the Raft consensus algorithm guarantees leader election safety in the event of a network partition.',
          hasFollowUp: true,
          followUpText: 'What mechanism prevents candidate nodes from endlessly splitting votes if multiple nodes initiate an election at the exact same moment?'
        },
        {
          index: 2,
          text: 'How do Circuit Breakers prevent cascading failures across distributed microservices? Discuss the three primary states.',
          hasFollowUp: false
        }
      ],
      examTimerSeconds: 15 * 60 - 240, // 11 mins remaining
      completed: false
    };

    // Pre-Exam Hardware Check State
    this.deviceCheck = {
      micTested: false,
      speakerTested: false,
      networkTested: true
    };

    // Create Exam Session Wizard State
    this.examWizard = {
      step: 1,
      formData: {
        name: 'SWD392 Oral Viva: Event-Driven Architectures & Clean Code',
        course: 'SWD392',
        description: 'Comprehensive oral examination testing asynchronous choreography vs orchestration and Domain-Driven Design.',
        selectedStudents: ['std-101', 'std-102', 'std-103', 'std-107'],
        date: '2026-10-25',
        startTime: '10:00 AM',
        duration: '15 mins',
        selectedQuestions: ['q-101', 'q-102', 'q-103'],
        rubricId: 'rub-01'
      }
    };

    // AI-Assisted Scoring State (Human-in-the-Loop)
    this.scoringState = {
      studentId: 'std-101',
      scores: {
        c1: 8.5, // Accuracy
        c2: 8.0, // Concept Understanding
        c3: 8.5, // Explanation Quality
        c4: 7.5, // Reasoning
        c5: 8.5  // Communication
      },
      comments: 'Clear verbal justification of quorum safety. Addressed the split-vote follow-up prompt accurately.'
    };

    // Material Upload State
    this.uploadState = {
      selectedCourse: 'SWD392',
      fileUploaded: false,
      isProcessing: false,
      processingStep: 0,
      generatedQuestions: [
        {
          id: 'gen-01',
          question: 'How does Log Compaction in distributed state machines preserve storage without sacrificing determinism during node catch-up?',
          topic: 'Log Compaction & Snapshots',
          difficulty: 'Hard',
          approved: false,
          rejected: false
        },
        {
          id: 'gen-02',
          question: 'Explain the difference between idempotent and non-idempotent operations in message-driven saga compensation.',
          topic: 'Saga Compensations',
          difficulty: 'Medium',
          approved: false,
          rejected: false
        },
        {
          id: 'gen-03',
          question: 'Why does the CAP theorem assert that consistency and availability cannot both be guaranteed under network partition?',
          topic: 'Distributed Systems Theory',
          difficulty: 'Easy',
          approved: false,
          rejected: false
        }
      ]
    };
  }

  // Toggle Theme
  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('aives_theme', this.theme);
      }
    } catch (e) {}
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', this.theme);
    }
    this.notify();
  }

  setTheme(newTheme) {
    this.theme = newTheme;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('aives_theme', this.theme);
      }
    } catch (e) {}
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', this.theme);
    }
    this.notify();
  }

  // Toggle Language (vi <-> en)
  toggleLanguage() {
    this.lang = this.lang === 'vi' ? 'en' : 'vi';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('aives_lang', this.lang);
      }
    } catch (e) {}
    if (typeof window !== 'undefined') {
      window.appLang = this.lang;
    }
    this.notify();
  }

  setLanguage(newLang) {
    this.lang = newLang;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('aives_lang', this.lang);
      }
    } catch (e) {}
    if (typeof window !== 'undefined') {
      window.appLang = this.lang;
    }
    this.notify();
  }

  // Mark all notifications read
  markAllNotificationsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notify();
  }

  getUnreadNotificationsCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Subscribe to changes
  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  // Set User Role
  setRole(role) {
    this.currentRole = role;
    if (role === 'admin') {
      this.currentUser = this.data.users.find(u => u.role === 'Admin');
      this.currentView = 'admin-dashboard';
    } else if (role === 'lecturer') {
      this.currentUser = this.data.users.find(u => u.id === 'usr-002'); // Dr. Eleanor Vance
      this.currentView = 'lecturer-dashboard';
    } else if (role === 'student') {
      this.currentUser = this.data.users.find(u => u.role === 'Student'); // Alex Morgan
      this.currentView = 'student-dashboard';
    }
    this.notify();
  }

  // Set current view
  navigate(viewName, params = {}) {
    this.currentView = viewName;
    if (params.studentId) {
      this.scoringState.studentId = params.studentId;
      const trans = this.data.detailedTranscripts[params.studentId];
      if (trans) {
        if (trans.criteriaScores) {
          this.scoringState.scores = JSON.parse(JSON.stringify(trans.criteriaScores));
        }
        this.scoringState.comments = trans.lecturerComments || '';
      }
    }
    if (params.id) {
      this.activeExamDetailId = params.id;
    }
    this.notify();
  }

  // Calculate live weighted score for scoring
  calculateLecturerFinalScore() {
    const rubric = this.data.rubrics.find(r => r.id === 'rub-01');
    if (!rubric) return 0;
    let total = 0;
    rubric.criteria.forEach(crit => {
      const score = this.scoringState.scores[crit.id] || 0;
      total += (score * crit.weight) / 100;
    });
    return Math.round(total * 10) / 10;
  }

  // Finalize Score Action
  finalizeScore(studentId) {
    const finalScore = this.calculateLecturerFinalScore();
    const transcript = this.data.detailedTranscripts[studentId];
    if (transcript) {
      transcript.status = 'Finalized';
      transcript.lecturerFinalTotal = finalScore;
      transcript.lecturerComments = this.scoringState.comments;
    }

    // Update results table
    const resultEntry = this.data.resultsList.find(r => r.studentId === studentId);
    if (resultEntry) {
      resultEntry.status = 'Finalized';
      resultEntry.finalScore = finalScore;
    }

    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'Score Finalized',
      message: `Finalized score (${finalScore}/10) for candidate ${transcript ? transcript.studentName : studentId}.`,
      time: 'Just now',
      read: false
    });

    this.notify();
  }
}

export const state = new AppState();
