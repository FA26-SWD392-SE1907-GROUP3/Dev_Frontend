// AIVES Application Controller & Router
import { state } from './state.js';
import { t } from './i18n.js';
import { TTS } from './audio/tts.js';
import { AudioEngine } from './audio/visualizer.js';

// Import Views
import { renderLoginView } from './views/authView.js';
import { 
  renderAdminDashboard, 
  renderUserManagement, 
  renderRolesPermissions, 
  renderCoursesSubjects,
  renderAdminExamSettings 
} from './views/adminViews.js';
import { 
  renderLecturerDashboard, 
  renderQuestionBank, 
  renderUploadMaterials, 
  renderAIQuestionGeneration, 
  renderRubricManagement, 
  renderExamSessions, 
  renderCreateExamSession, 
  renderExamSessionDetail, 
  renderLiveExamMonitoring 
} from './views/lecturerViews.js';
import { 
  renderStudentDashboard, 
  renderStudentMyExams, 
  renderPreExamCheck, 
  renderAIOralExamination, 
  renderExamCompleted 
} from './views/studentViews.js';
import { 
  renderTranscriptReview, 
  renderAIScoring, 
  renderLecturerResults, 
  renderStudentResults 
} from './views/reviewViews.js';
import { renderProfileView } from './views/profileView.js';

class AIVESApp {
  constructor() {
    this.modalContainer = null;
    this.toastContainer = null;
    this.recordTimerInterval = null;
    this.examTimerInterval = null;
  }

  init() {
    this.modalContainer = document.getElementById('modalRoot');
    this.toastContainer = document.getElementById('toastRoot');

    // Subscribe to state changes
    state.subscribe(() => {
      this.render();
    });

    // Initial render
    this.render();
  }

  navigate(viewName, params = {}) {
    TTS.stop();
    if (state.vivaSession.isRecording) {
      this.stopStudentRecording(true);
    }
    state.navigate(viewName, params);
  }

  switchPersona(role) {
    TTS.stop();
    state.setRole(role);
    const isVi = state.lang === 'vi';
    const roleLabel = role === 'admin' ? t('roleAdmin') : (role === 'lecturer' ? t('roleLecturer') : t('roleStudent'));
    this.showToast(isVi ? `Đã chuyển sang vai trò ${state.currentUser.name} (${roleLabel})` : `Switched persona to ${state.currentUser.name} (${role.toUpperCase()})`, 'info');
  }

  toggleTheme() {
    state.toggleTheme();
    const modeName = state.theme === 'dark' ? 'Dark Slate' : 'Light Academic';
    this.showToast(state.lang === 'vi' ? `Đã chuyển sang giao diện ${state.theme === 'dark' ? 'Tối (Dark Slate)' : 'Sáng (Light Academic)'}` : `Switched to ${modeName} theme.`, 'info');
  }

  setTheme(theme) {
    state.setTheme(theme);
    const modeName = theme === 'dark' ? 'Dark Slate' : 'Light Academic';
    this.showToast(state.lang === 'vi' ? `Giao diện thiết lập thành ${theme === 'dark' ? 'Tối' : 'Sáng'}` : `Appearance set to ${modeName}.`, 'info');
  }

  toggleLanguage() {
    state.toggleLanguage();
    const langLabel = state.lang === 'vi' ? 'Tiếng Việt' : 'English';
    this.showToast(state.lang === 'vi' ? `Đã chuyển giao diện sang Tiếng Việt` : `Switched interface language to English`, 'info');
  }

  setLanguage(lang) {
    state.setLanguage(lang);
    this.showToast(state.lang === 'vi' ? `Đã chuyển giao diện sang Tiếng Việt` : `Switched interface language to English`, 'info');
  }

  handleLogin() {
    this.showToast(state.lang === 'vi' ? `Đăng nhập thành công với vai trò ${state.currentUser.name}` : `Logged in successfully as ${state.currentUser.name}`, 'success');
    if (state.currentRole === 'admin') {
      this.navigate('admin-dashboard');
    } else if (state.currentRole === 'lecturer') {
      this.navigate('lecturer-dashboard');
    } else {
      this.navigate('student-dashboard');
    }
  }

  handleLogout() {
    TTS.stop();
    state.currentRole = 'guest';
    state.currentView = 'login';
    state.notify();
  }

  // Build breadcrumbs trail
  getBreadcrumbs() {
    const v = state.currentView;
    if (v === 'login') return '';

    const labels = state.lang === 'vi' ? {
      'admin-dashboard': ['Quản trị', 'Bảng điều khiển'],
      'user-management': ['Quản trị', 'Quản lý Người dùng'],
      'roles-permissions': ['Quản trị', 'Vai trò & Phân quyền'],
      'courses-subjects': ['Chương trình học', 'Môn học & Học phần'],
      'admin-exam-settings': ['Quản trị', 'Cài đặt Kỳ thi & Quy chế'],
      'lecturer-dashboard': ['Giảng viên', 'Bảng điều khiển'],
      'question-bank': ['Đánh giá', 'Ngân hàng Câu hỏi'],
      'upload-materials': ['Chuẩn bị AI', 'Tải Tài liệu Học tập'],
      'ai-question-generation': ['Chuẩn bị AI', 'Tổng hợp & Phê duyệt Câu hỏi'],
      'rubrics': ['Đánh giá', 'Quản lý Tiêu chí Rubric'],
      'exam-sessions': ['Kỳ thi', 'Phiên thi Vấn đáp'],
      'create-exam-session': ['Kỳ thi', 'Tạo Phiên thi Mới (Wizard)'],
      'exam-session-detail': ['Kỳ thi', 'Chi tiết Phiên thi'],
      'live-monitoring': ['Kỳ thi', 'Giám sát Trực tiếp'],
      'student-dashboard': ['Sinh viên', 'Bảng điều khiển'],
      'student-my-exams': ['Sinh viên', 'Kỳ thi của tôi'],
      'pre-exam-check': ['Kỳ thi', 'Kiểm tra Thiết bị Trước giờ thi'],
      'viva-oral-exam': ['Kỳ thi', 'Phòng thi Vấn đáp Trực tuyến AI'],
      'exam-completed': ['Kỳ thi', 'Đã Nộp bài Thành công'],
      'transcript-review': ['Chấm thi', 'Bản ghi Lời nói & Đánh giá AI'],
      'ai-scoring': ['Chấm thi', 'Bảng Chấm điểm Giảng viên (Human-in-the-Loop)'],
      'lecturer-results': ['Chấm thi', 'Bảng điểm & Kết quả'],
      'student-results': ['Sinh viên', 'Bảng điểm Chính thức'],
      'profile': ['Tài khoản', 'Hồ sơ & Tùy chọn']
    } : {
      'admin-dashboard': ['Admin', 'Dashboard'],
      'user-management': ['Admin', 'User Management'],
      'roles-permissions': ['Admin', 'Roles & Permissions'],
      'courses-subjects': ['Curriculum', 'Courses & Subjects'],
      'admin-exam-settings': ['Admin', 'Exam Settings & Governance'],
      'lecturer-dashboard': ['Lecturer', 'Dashboard'],
      'question-bank': ['Assessment', 'Question Bank'],
      'upload-materials': ['AI Preparation', 'Upload Learning Materials'],
      'ai-question-generation': ['AI Preparation', 'Question Synthesis & Review'],
      'rubrics': ['Assessment', 'Rubric Management'],
      'exam-sessions': ['Examination', 'Exam Sessions'],
      'create-exam-session': ['Examination', 'Create Exam Session (Wizard)'],
      'exam-session-detail': ['Examination', 'Session Details'],
      'live-monitoring': ['Examination', 'Live Oral Monitoring'],
      'student-dashboard': ['Student', 'Dashboard'],
      'student-my-exams': ['Student', 'My Exams'],
      'pre-exam-check': ['Examination', 'Pre-Exam Device Diagnostics'],
      'viva-oral-exam': ['Examination', 'AI Oral Viva Voce Room'],
      'exam-completed': ['Examination', 'Submission Concluded'],
      'transcript-review': ['Grading', 'Transcript & AI Review'],
      'ai-scoring': ['Grading', 'Human-in-the-Loop Scoring Matrix'],
      'lecturer-results': ['Grading', 'Grade Book & Results'],
      'student-results': ['Student', 'Official Grade Report'],
      'profile': ['Account', 'Profile & Preferences']
    };

    const parts = labels[v] || ['AIVES', v];
    return `
      <div class="breadcrumb-trail">
        <span>${parts[0]}</span>
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        <span class="active">${parts[1]}</span>
      </div>
    `;
  }

  // Render Sidebar tailored by role
  renderSidebar() {
    if (state.currentView === 'login') return '';

    const role = state.currentRole;
    const v = state.currentView;

    let navItemsHtml = '';

    if (role === 'admin') {
      navItemsHtml = `
        <div class="nav-section-title">${t('navAdmin')}</div>
        <div class="nav-item ${v === 'admin-dashboard' ? 'active' : ''}" onclick="window.app.navigate('admin-dashboard')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span class="nav-label">${t('navDashboard')}</span>
        </div>
        <div class="nav-item ${v === 'user-management' ? 'active' : ''}" onclick="window.app.navigate('user-management')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span class="nav-label">${t('navUsers')}</span>
          <span class="nav-badge-pill">${state.data.users.length}</span>
        </div>
        <div class="nav-item ${v === 'roles-permissions' ? 'active' : ''}" onclick="window.app.navigate('roles-permissions')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span class="nav-label">${t('navRoles')}</span>
        </div>
        <div class="nav-item ${v === 'courses-subjects' ? 'active' : ''}" onclick="window.app.navigate('courses-subjects')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <span class="nav-label">${t('navCourses')}</span>
          <span class="nav-badge-pill">${state.data.courses.length}</span>
        </div>
        <div class="nav-item ${v === 'admin-exam-settings' ? 'active' : ''}" onclick="window.app.navigate('admin-exam-settings')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span class="nav-label">${t('navExamSettings')}</span>
        </div>
        <div class="nav-item ${v === 'question-bank' ? 'active' : ''}" onclick="window.app.navigate('question-bank')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span class="nav-label">${t('navQuestionBank')}</span>
        </div>
        <div class="nav-item ${v === 'exam-sessions' ? 'active' : ''}" onclick="window.app.navigate('exam-sessions')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
          <span class="nav-label">${t('navExamSessions')}</span>
          <span class="nav-badge-pill">${state.data.examSessions.length}</span>
        </div>
      `;
    } else if (role === 'lecturer') {
      const pendingReviews = Object.values(state.data.detailedTranscripts).filter(t => t.status === 'Pending Review').length;
      navItemsHtml = `
        <div class="nav-section-title">${t('navLecturer')}</div>
        <div class="nav-item ${v === 'lecturer-dashboard' ? 'active' : ''}" onclick="window.app.navigate('lecturer-dashboard')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span class="nav-label">${t('navDashboard')}</span>
        </div>
        <div class="nav-item ${v === 'courses-subjects' ? 'active' : ''}" onclick="window.app.navigate('courses-subjects')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <span class="nav-label">${t('navCourses')}</span>
        </div>
        <div class="nav-item ${v === 'question-bank' || v === 'upload-materials' || v === 'ai-question-generation' ? 'active' : ''}" onclick="window.app.navigate('question-bank')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span class="nav-label">${t('navQuestionBank')}</span>
        </div>
        <div class="nav-item ${v === 'rubrics' ? 'active' : ''}" onclick="window.app.navigate('rubrics')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <span class="nav-label">${t('navRubrics')}</span>
        </div>
        <div class="nav-item ${v === 'exam-sessions' || v === 'create-exam-session' || v === 'exam-session-detail' ? 'active' : ''}" onclick="window.app.navigate('exam-sessions')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
          <span class="nav-label">${t('navExamSessions')}</span>
        </div>
        <div class="nav-item ${v === 'live-monitoring' ? 'active' : ''}" onclick="window.app.navigate('live-monitoring')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span class="nav-label">${t('navMonitoring')}</span>
          <span class="nav-badge-pill" style="background:var(--status-danger-bg); color:var(--status-danger-text);">Live</span>
        </div>
        <div class="nav-item ${v === 'transcript-review' || v === 'ai-scoring' || v === 'lecturer-results' ? 'active' : ''}" onclick="window.app.navigate('lecturer-results')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span class="nav-label">${t('navReviewsResults')}</span>
          ${pendingReviews > 0 ? `<span class="nav-badge-pill" style="background:var(--status-pending-bg); color:var(--status-pending-text);">${pendingReviews}</span>` : ''}
        </div>
      `;
    } else if (role === 'student') {
      navItemsHtml = `
        <div class="nav-section-title">${t('navStudent')}</div>
        <div class="nav-item ${v === 'student-dashboard' ? 'active' : ''}" onclick="window.app.navigate('student-dashboard')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span class="nav-label">${t('navDashboard')}</span>
        </div>
        <div class="nav-item ${v === 'student-my-exams' || v === 'pre-exam-check' || v === 'viva-oral-exam' ? 'active' : ''}" onclick="window.app.navigate('student-my-exams')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
          <span class="nav-label">${t('navMyExams')}</span>
        </div>
        <div class="nav-item ${v === 'student-results' ? 'active' : ''}" onclick="window.app.navigate('student-results')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span class="nav-label">${t('navResults')}</span>
        </div>
        <div class="nav-item ${v === 'profile' ? 'active' : ''}" onclick="window.app.navigate('profile')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span class="nav-label">${t('navProfile')}</span>
        </div>
      `;
    }

    const roleName = role === 'admin' ? t('roleAdmin') : (role === 'lecturer' ? t('roleLecturer') : t('roleStudent'));

    return `
      <aside class="app-sidebar">
        <div class="sidebar-header">
          <div class="logo-badge">A</div>
          <div class="logo-text-group">
            <span class="logo-title">AIVES</span>
            <span class="logo-subtitle">${t('appSubtitle')}</span>
          </div>
        </div>

        <div class="sidebar-role-indicator">
          <span class="role-tag">${roleName.toUpperCase()} ${t('roleView')}</span>
          <span class="role-desc">${t('academicPortal')}</span>
        </div>

        <nav class="sidebar-nav">
          ${navItemsHtml}
        </nav>

        <div class="sidebar-footer">
          <div class="user-snippet" onclick="window.app.navigate('profile')">
            <div class="user-avatar">${state.currentUser ? state.currentUser.name.split(' ').map(n=>n[0]).join('') : 'U'}</div>
            <div class="user-details">
              <span class="user-name">${state.currentUser ? state.currentUser.name : 'User'}</span>
              <span class="user-id">${state.currentUser ? state.currentUser.email : ''}</span>
            </div>
          </div>
          <button class="btn-logout" title="${t('signOut')}" onclick="window.app.handleLogout()">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>
    `;
  }

  // Render Top Header with Theme Switcher, Language Switcher & Notifications
  renderHeader() {
    if (state.currentView === 'login') return '';

    const unreadCount = state.getUnreadNotificationsCount();

    return `
      <header class="app-header">
        <div class="header-left">
          ${this.getBreadcrumbs()}
        </div>

        <div class="header-right">
          <!-- Language Quick Switcher Pill (VI / EN) -->
          <div class="role-quick-switcher" title="Chuyển đổi ngôn ngữ / Switch Language" style="display:flex; align-items:center;">
            <button class="role-switcher-btn ${state.lang === 'vi' ? 'active' : ''}" onclick="window.app.setLanguage('vi')">🇻🇳 Tiếng Việt</button>
            <button class="role-switcher-btn ${state.lang === 'en' ? 'active' : ''}" onclick="window.app.setLanguage('en')">🇬🇧 English</button>
          </div>

          <!-- Dark / Light Mode Toggle Button -->
          <button class="header-icon-btn" id="themeToggleBtn" title="${state.theme === 'dark' ? t('themeLight') : t('themeDark')}" onclick="window.app.toggleTheme()">
            ${state.theme === 'dark' ? `
              <!-- Sun Icon for switching to light -->
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ` : `
              <!-- Moon Icon for switching to dark -->
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            `}
          </button>

          <!-- Interactive Notifications Button -->
          <button class="header-icon-btn" title="${t('notifications')} (${unreadCount})" onclick="window.app.openNotificationsModal()">
            ${unreadCount > 0 ? `<span class="badge-dot"></span>` : ''}
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </button>
        </div>
      </header>
    `;
  }

  // Master Render Loop
  render() {
    const root = document.getElementById('app');
    if (!root) return;

    const v = state.currentView;

    // Login View renders standalone
    if (v === 'login') {
      root.innerHTML = renderLoginView();
      return;
    }

    let mainContentHtml = '';

    switch (v) {
      // Admin Views (2-5 & Exam Settings)
      case 'admin-dashboard': mainContentHtml = renderAdminDashboard(); break;
      case 'user-management': mainContentHtml = renderUserManagement(); break;
      case 'roles-permissions': mainContentHtml = renderRolesPermissions(); break;
      case 'courses-subjects': mainContentHtml = renderCoursesSubjects(); break;
      case 'admin-exam-settings': mainContentHtml = renderAdminExamSettings(); break;

      // Lecturer Views (6-14)
      case 'lecturer-dashboard': mainContentHtml = renderLecturerDashboard(); break;
      case 'question-bank': mainContentHtml = renderQuestionBank(); break;
      case 'upload-materials': mainContentHtml = renderUploadMaterials(); break;
      case 'ai-question-generation': mainContentHtml = renderAIQuestionGeneration(); break;
      case 'rubrics': mainContentHtml = renderRubricManagement(); break;
      case 'exam-sessions': mainContentHtml = renderExamSessions(); break;
      case 'create-exam-session': mainContentHtml = renderCreateExamSession(); break;
      case 'exam-session-detail': mainContentHtml = renderExamSessionDetail(); break;
      case 'live-monitoring': mainContentHtml = renderLiveExamMonitoring(); break;

      // Student Views (15-20)
      case 'student-dashboard': mainContentHtml = renderStudentDashboard(); break;
      case 'student-my-exams': mainContentHtml = renderStudentMyExams(); break;
      case 'pre-exam-check': mainContentHtml = renderPreExamCheck(); break;
      case 'viva-oral-exam': mainContentHtml = renderAIOralExamination(); break;
      case 'exam-completed': mainContentHtml = renderExamCompleted(); break;

      // Review & Grading Views (21-24)
      case 'transcript-review': mainContentHtml = renderTranscriptReview(state.scoringState.studentId); break;
      case 'ai-scoring': mainContentHtml = renderAIScoring(state.scoringState.studentId); break;
      case 'lecturer-results': mainContentHtml = renderLecturerResults(); break;
      case 'student-results': mainContentHtml = renderStudentResults(); break;

      // Profile (25)
      case 'profile': mainContentHtml = renderProfileView(); break;

      default: mainContentHtml = renderLecturerDashboard(); break;
    }

    root.innerHTML = `
      <div class="app-shell">
        ${this.renderSidebar()}
        <div class="app-main">
          ${this.renderHeader()}
          <main class="main-content">
            ${mainContentHtml}
          </main>
        </div>
      </div>
    `;

    // Hook up canvas when viva oral exam is active
    if (v === 'viva-oral-exam') {
      const canvas = document.getElementById('vivaWaveformCanvas');
      if (canvas && !state.vivaSession.isRecording) {
        AudioEngine.stopWaveform(canvas);
      }
    }
  }

  // Toasts
  showToast(message, type = 'info') {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div>${message}</div>`;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 300ms ease';
      setTimeout(() => toast.remove(), 350);
    }, 3500);
  }

  // Modal helpers
  openModal(html) {
    if (!this.modalContainer) return;
    this.modalContainer.innerHTML = html;
  }

  closeModal() {
    if (!this.modalContainer) return;
    this.modalContainer.innerHTML = '';
  }

  // Interactive Notifications Modal
  openNotificationsModal() {
    const notifs = state.notifications;
    const isVi = state.lang === 'vi';
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) window.app.closeModal()">
        <div class="modal-dialog">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <h3>${isVi ? 'Thông Báo Hệ Thống' : 'System Notifications'}</h3>
            </div>
            <button class="modal-close-btn" onclick="window.app.closeModal()">✕</button>
          </div>
          <div class="modal-body" style="max-height: 380px;">
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${notifs.map(n => `
                <div style="padding: 12px 14px; border-radius: var(--radius-md); background: ${n.read ? 'var(--bg-subtle)' : 'var(--primary-light)'}; border: 1px solid ${n.read ? 'var(--border-subtle)' : 'var(--primary-border)'}; display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                      ${!n.read ? '<span style="width: 6px; height: 6px; border-radius: 50%; background: var(--primary);"></span>' : ''}
                      ${n.title}
                    </div>
                    <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 2px;">${n.message}</div>
                  </div>
                  <span style="font-size: 0.7rem; color: var(--text-light); white-space: nowrap;">${n.time}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="modal-footer" style="justify-content: space-between;">
            <button class="btn btn-secondary btn-sm" onclick="window.app.markAllRead()">${isVi ? 'Đánh dấu tất cả đã đọc' : 'Mark All as Read'}</button>
            <button class="btn btn-primary btn-sm" onclick="window.app.closeModal()">${isVi ? 'Đóng' : 'Close'}</button>
          </div>
        </div>
      </div>
    `);
  }

  markAllRead() {
    state.markAllNotificationsRead();
    this.closeModal();
    this.showToast(state.lang === 'vi' ? 'Đã đánh dấu tất cả thông báo là đã đọc.' : 'All notifications marked as read.', 'info');
  }

  // Admin Actions: User Management
  openAddUserModal() {
    const isVi = state.lang === 'vi';
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) window.app.closeModal()">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>${isVi ? 'Thêm Người Dùng Học Viện Mới' : 'Add New Institutional User'}</h3>
            <button class="modal-close-btn" onclick="window.app.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label form-label-required">${isVi ? 'Họ và Tên' : 'Full Name'}</label>
              <input type="text" id="modalUserName" class="form-input" placeholder="${isVi ? 'VD: TS. Nguyễn Văn An' : 'e.g. Dr. Julian Vance'}">
            </div>
            <div class="form-group">
              <label class="form-label form-label-required">${isVi ? 'Mã Định Danh / MSSV' : 'Student Roll / User ID'}</label>
              <input type="text" id="modalUserId" class="form-input" placeholder="${isVi ? 'VD: SE180999 (Sinh viên) hoặc LEC-009' : 'e.g. SE180999 (Student) or LEC-009'}">
            </div>
            <div class="form-group">
              <label class="form-label form-label-required">${isVi ? 'Email Học Viện' : 'Institutional Email'}</label>
              <input type="email" id="modalUserEmail" class="form-input" placeholder="e.g. namnhse180999@fpt.edu.vn">
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label form-label-required">${isVi ? 'Vai Trò Hệ Thống' : 'System Role'}</label>
                <select id="modalUserRole" class="form-select">
                  <option value="Student">${t('roleStudent')}</option>
                  <option value="Lecturer">${t('roleLecturer')}</option>
                  <option value="Admin">${t('roleAdmin')}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label form-label-required">${t('status')}</label>
                <select id="modalUserStatus" class="form-select">
                  <option value="Active">${t('statusActive')}</option>
                  <option value="Inactive">${t('statusInactive')}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.app.closeModal()">${isVi ? 'Hủy' : 'Cancel'}</button>
            <button class="btn btn-primary" onclick="window.app.submitNewUser()">${isVi ? 'Lưu & Cấp Tài Khoản' : 'Save & Provision User'}</button>
          </div>
        </div>
      </div>
    `);
  }

  submitNewUser() {
    const isVi = state.lang === 'vi';
    const name = document.getElementById('modalUserName')?.value.trim();
    const id = document.getElementById('modalUserId')?.value.trim();
    const email = document.getElementById('modalUserEmail')?.value.trim();
    const role = document.getElementById('modalUserRole')?.value;
    const status = document.getElementById('modalUserStatus')?.value;

    if (!name || !id || !email) {
      alert(isVi ? 'Vui lòng điền đầy đủ các trường bắt buộc.' : 'Please fill out all required fields.');
      return;
    }

    state.data.users.unshift({
      id,
      rollNumber: id,
      name,
      email,
      role,
      department: role === 'Student' ? 'Kỹ thuật Phần mềm (Software Engineering)' : 'Công nghệ Thông tin (IT)',
      status
    });

    this.closeModal();
    this.showToast(isVi ? `Đã thêm thành công người dùng ${name}.` : `User ${name} successfully enrolled.`, 'success');
    state.notify();
  }

  openEditUserModal(userId) {
    const user = state.data.users.find(u => u.id === userId);
    if (!user) return;
    const isVi = state.lang === 'vi';

    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) window.app.closeModal()">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>${isVi ? 'Chỉnh Sửa Người Dùng:' : 'Edit Institutional User:'} ${user.name}</h3>
            <button class="modal-close-btn" onclick="window.app.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label form-label-required">${isVi ? 'Họ và Tên' : 'Full Legal Name'}</label>
              <input type="text" id="editUserName" class="form-input" value="${user.name}">
            </div>
            <div class="form-group">
              <label class="form-label form-label-required">${isVi ? 'Mã Định Danh' : 'User ID'}</label>
              <input type="text" id="editUserId" class="form-input" value="${user.id}" readonly style="background-color: var(--bg-subtle);">
            </div>
            <div class="form-group">
              <label class="form-label form-label-required">${isVi ? 'Email Học Viện' : 'Institutional Email'}</label>
              <input type="email" id="editUserEmail" class="form-input" value="${user.email}">
            </div>
            <div class="form-group">
              <label class="form-label">${isVi ? 'Khoa / Bộ Môn' : 'Department / Program'}</label>
              <input type="text" id="editUserDept" class="form-input" value="${user.department}">
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label form-label-required">${isVi ? 'Vai Trò' : 'Role'}</label>
                <select id="editUserRole" class="form-select">
                  <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>${t('roleAdmin')}</option>
                  <option value="Lecturer" ${user.role === 'Lecturer' ? 'selected' : ''}>${t('roleLecturer')}</option>
                  <option value="Student" ${user.role === 'Student' ? 'selected' : ''}>${t('roleStudent')}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label form-label-required">${t('status')}</label>
                <select id="editUserStatus" class="form-select">
                  <option value="Active" ${user.status === 'Active' ? 'selected' : ''}>${t('statusActive')}</option>
                  <option value="Inactive" ${user.status === 'Inactive' ? 'selected' : ''}>${t('statusInactive')}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.app.closeModal()">${isVi ? 'Hủy' : 'Cancel'}</button>
            <button class="btn btn-primary" onclick="window.app.submitEditUser('${user.id}')">${isVi ? 'Lưu Thay Đổi' : 'Save Changes'}</button>
          </div>
        </div>
      </div>
    `);
  }

  submitEditUser(userId) {
    const user = state.data.users.find(u => u.id === userId);
    if (!user) return;
    const isVi = state.lang === 'vi';

    user.name = document.getElementById('editUserName')?.value.trim() || user.name;
    user.email = document.getElementById('editUserEmail')?.value.trim() || user.email;
    user.department = document.getElementById('editUserDept')?.value.trim() || user.department;
    user.role = document.getElementById('editUserRole')?.value || user.role;
    user.status = document.getElementById('editUserStatus')?.value || user.status;

    this.closeModal();
    this.showToast(isVi ? `Đã cập nhật thông tin người dùng ${user.name}.` : `User ${user.name} updated successfully.`, 'success');
    state.notify();
  }

  deleteUser(userId) {
    const user = state.data.users.find(u => u.id === userId);
    if (!user) return;
    const isVi = state.lang === 'vi';
    if (confirm(isVi ? `Bạn có chắc chắn muốn xóa người dùng "${user.name}" (${user.id}) không?` : `Are you sure you want to remove user "${user.name}" (${user.id})?`)) {
      state.data.users = state.data.users.filter(u => u.id !== userId);
      this.showToast(isVi ? `Đã xóa người dùng ${user.name}.` : `User ${user.name} removed from registry.`, 'info');
      state.notify();
    }
  }

  toggleUserStatus(userId) {
    const user = state.data.users.find(u => u.id === userId);
    if (user) {
      user.status = user.status === 'Active' ? 'Inactive' : 'Active';
      const isVi = state.lang === 'vi';
      this.showToast(isVi ? `Trạng thái của ${user.name} đã chuyển sang ${user.status === 'Active' ? 'Hoạt động' : 'Khóa'}.` : `User status for ${user.name} changed to ${user.status}.`, 'info');
      state.notify();
    }
  }

  filterUsersTable() {
    const query = document.getElementById('userSearchInput')?.value.toLowerCase() || '';
    const role = document.getElementById('userRoleFilter')?.value || 'All';
    const status = document.getElementById('userStatusFilter')?.value || 'All';

    const rows = document.querySelectorAll('#usersTableBody tr');
    let visible = 0;
    rows.forEach(row => {
      const matchQuery = row.getAttribute('data-query').includes(query);
      const matchRole = role === 'All' || row.getAttribute('data-role') === role;
      const matchStatus = status === 'All' || row.getAttribute('data-status') === status;

      if (matchQuery && matchRole && matchStatus) {
        row.style.display = '';
        visible++;
      } else {
        row.style.display = 'none';
      }
    });

    const countEl = document.getElementById('userCount');
    if (countEl) countEl.innerText = visible;
  }

  // Admin Actions: Courses
  openAddCourseModal() {
    const isVi = state.lang === 'vi';
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) window.app.closeModal()">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>${isVi ? 'Thêm Môn Học / Học Phần Mới' : 'Add Academic Course / Subject'}</h3>
            <button class="modal-close-btn" onclick="window.app.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label form-label-required">${t('courseCode')}</label>
                <input type="text" id="modalCourseCode" class="form-input" placeholder="e.g. SWD392 hoặc PRN231">
              </div>
              <div class="form-group">
                <label class="form-label form-label-required">${isVi ? 'Giảng Viên Phụ Trách' : 'Assigned Presiding Lecturer'}</label>
                <select id="modalCourseLecturer" class="form-select">
                  <option>Dr. Eleanor Vance</option>
                  <option>Dr. Michael Chang</option>
                  <option>Prof. Sarah Jenkins</option>
                  <option>ThS. Nguyễn Văn Vũ</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label form-label-required">${t('courseName')}</label>
              <input type="text" id="modalCourseName" class="form-input" placeholder="${isVi ? 'VD: Kiến trúc & Thiết kế Phần mềm' : 'e.g. Software Architecture & Design'}">
            </div>
            <div class="form-group">
              <label class="form-label">${isVi ? 'Mô Tả & Đề Cương Học Phần' : 'Syllabus Overview'}</label>
              <textarea id="modalCourseDesc" class="form-textarea" placeholder="${isVi ? 'Nội dung cốt lõi và chuẩn đầu ra...' : 'Key topics and learning outcomes...'}"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.app.closeModal()">${isVi ? 'Hủy' : 'Cancel'}</button>
            <button class="btn btn-primary" onclick="window.app.submitNewCourse()">${isVi ? 'Lưu Môn Học' : 'Save Course'}</button>
          </div>
        </div>
      </div>
    `);
  }

  submitNewCourse() {
    const isVi = state.lang === 'vi';
    const code = document.getElementById('modalCourseCode')?.value.trim();
    const name = document.getElementById('modalCourseName')?.value.trim();
    const lecturer = document.getElementById('modalCourseLecturer')?.value;
    const desc = document.getElementById('modalCourseDesc')?.value.trim() || 'Comprehensive course syllabus and oral assessment modules.';

    if (!code || !name) {
      alert(isVi ? 'Vui lòng điền Mã môn học và Tên môn học.' : 'Please fill out Course Code and Course Name.');
      return;
    }

    state.data.courses.unshift({
      id: `crs-${Date.now().toString().slice(-2)}`,
      code,
      name,
      lecturer,
      studentsCount: 30,
      status: 'Active',
      description: desc
    });

    this.closeModal();
    this.showToast(isVi ? `Đã tạo thành công môn học ${code} – ${name}.` : `Course ${code} – ${name} provisioned successfully.`, 'success');
    state.notify();
  }

  openEditCourseModal(courseId) {
    const course = state.data.courses.find(c => c.id === courseId);
    if (!course) return;
    const isVi = state.lang === 'vi';

    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) window.app.closeModal()">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>${isVi ? 'Chỉnh Sửa Môn Học:' : 'Edit Course:'} ${course.code}</h3>
            <button class="modal-close-btn" onclick="window.app.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label form-label-required">${t('courseName')}</label>
              <input type="text" id="editCourseName" class="form-input" value="${course.name}">
            </div>
            <div class="form-group">
              <label class="form-label form-label-required">${isVi ? 'Giảng Viên Phụ Trách' : 'Assigned Lecturer'}</label>
              <select id="editCourseLecturer" class="form-select">
                <option ${course.lecturer === 'Dr. Eleanor Vance' ? 'selected' : ''}>Dr. Eleanor Vance</option>
                <option ${course.lecturer === 'Dr. Michael Chang' ? 'selected' : ''}>Dr. Michael Chang</option>
                <option ${course.lecturer === 'Prof. Sarah Jenkins' ? 'selected' : ''}>Prof. Sarah Jenkins</option>
                <option ${course.lecturer === 'Dr. Marcus Chen' ? 'selected' : ''}>Dr. Marcus Chen</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">${isVi ? 'Mô Tả Học Phần' : 'Syllabus Description'}</label>
              <textarea id="editCourseDesc" class="form-textarea">${course.description}</textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.app.closeModal()">${isVi ? 'Hủy' : 'Cancel'}</button>
            <button class="btn btn-primary" onclick="window.app.submitEditCourse('${course.id}')">${isVi ? 'Lưu Thay Đổi' : 'Save Changes'}</button>
          </div>
        </div>
      </div>
    `);
  }

  submitEditCourse(courseId) {
    const course = state.data.courses.find(c => c.id === courseId);
    if (!course) return;
    const isVi = state.lang === 'vi';

    course.name = document.getElementById('editCourseName')?.value.trim() || course.name;
    course.lecturer = document.getElementById('editCourseLecturer')?.value || course.lecturer;
    course.description = document.getElementById('editCourseDesc')?.value.trim() || course.description;

    this.closeModal();
    this.showToast(isVi ? `Đã cập nhật môn học ${course.code}.` : `Course ${course.code} updated.`, 'success');
    state.notify();
  }

  filterCoursesTable() {
    const q = document.getElementById('courseSearchInput')?.value.toLowerCase().trim() || '';
    const rows = document.querySelectorAll('#coursesTableBody tr');
    rows.forEach(r => {
      const match = !q || (r.getAttribute('data-query') || '').toLowerCase().includes(q);
      r.style.display = match ? '' : 'none';
    });
  }

  toggleCourseStatus(courseId) {
    const course = state.data.courses.find(c => c.id === courseId);
    if (!course) return;
    const isVi = state.lang === 'vi';
    course.status = course.status === 'Active' ? 'Inactive' : 'Active';
    this.showToast(isVi ? `Trạng thái môn học ${course.code} đã chuyển sang ${course.status === 'Active' ? 'Hoạt động' : 'Tạm dừng'}.` : `Course status for ${course.code} set to ${course.status}.`, 'info');
    state.notify();
  }

  deleteCourse(courseId) {
    const course = state.data.courses.find(c => c.id === courseId);
    if (!course) return;
    const isVi = state.lang === 'vi';
    if (confirm(isVi ? `Bạn có chắc muốn xóa môn học "${course.code} – ${course.name}"?` : `Are you sure you want to remove course "${course.code} – ${course.name}"?`)) {
      state.data.courses = state.data.courses.filter(c => c.id !== courseId);
      this.showToast(isVi ? `Đã xóa môn học ${course.code}.` : `Course ${course.code} deleted.`, 'info');
      state.notify();
    }
  }

  viewCourseDetail(courseId) {
    const course = state.data.courses.find(c => c.id === courseId) || state.data.courses[0];
    const isVi = state.lang === 'vi';
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) window.app.closeModal()">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <h3>${isVi ? 'Tổng Quan Học Phần:' : 'Course Overview:'} ${course.code} – ${course.name}</h3>
            <button class="modal-close-btn" onclick="window.app.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="grid-3" style="margin-bottom: 20px;">
              <div class="stat-card">
                <div class="stat-info">
                  <span class="stat-label">${isVi ? 'Sinh viên Đăng ký' : 'Enrolled Students'}</span>
                  <span class="stat-value">${course.studentsCount}</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-info">
                  <span class="stat-label">${isVi ? 'Giảng viên Phụ trách' : 'Presiding Faculty'}</span>
                  <strong style="font-size: 0.95rem; margin-top: 4px;">${course.lecturer}</strong>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-info">
                  <span class="stat-label">${t('status')}</span>
                  <div style="margin-top: 4px;">${course.status === 'Active' ? `<span class="status-badge badge-completed">${t('statusActive')}</span>` : `<span class="status-badge badge-draft">${t('statusInactive')}</span>`}</div>
                </div>
              </div>
            </div>

            <p style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px;">${course.description}</p>

            <div style="display: flex; gap: 12px;">
              <button class="btn btn-secondary btn-sm" onclick="window.app.closeModal(); window.app.navigate('question-bank');">
                ${isVi ? 'Mở Ngân Hàng Câu Hỏi' : 'Open Question Bank'}
              </button>
              <button class="btn btn-primary btn-sm" onclick="window.app.closeModal(); window.app.navigate('exam-sessions');">
                ${isVi ? 'Xem Các Phiên Thi' : 'View Exam Sessions'}
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.app.closeModal()">${isVi ? 'Đóng' : 'Close'}</button>
          </div>
        </div>
      </div>
    `);
  }

  // Admin Exam Settings
  saveAdminExamSettings() {
    state.examSettings.defaultDuration = parseInt(document.getElementById('settingDuration')?.value) || 15;
    state.examSettings.maxFollowUps = parseInt(document.getElementById('settingFollowUps')?.value) || 1;
    state.examSettings.silenceThreshold = parseInt(document.getElementById('settingSilence')?.value) || 5;
    state.examSettings.voicePersona = document.getElementById('settingVoice')?.value || state.examSettings.voicePersona;
    state.examSettings.enableWebcamProctoring = document.getElementById('settingWebcam')?.checked ?? true;
    state.examSettings.enableTabMonitoring = document.getElementById('settingTabMonitoring')?.checked ?? true;
    state.examSettings.allowCandidateReplay = document.getElementById('settingCandidateReplay')?.checked ?? true;

    this.showToast(state.lang === 'vi' ? '✓ Cài đặt kỳ thi học viện đã được lưu và áp dụng.' : '✓ Institutional Examination Settings saved and deployed.', 'success');
    state.notify();
  }

  // Question Bank Actions
  openEditQuestionModal(qId) {
    const q = state.data.questionBank.find(item => item.id === qId);
    if (!q) return;
    const isVi = state.lang === 'vi';

    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) window.app.closeModal()">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <h3>${isVi ? 'Chỉnh Sửa Câu Hỏi:' : 'Edit Question:'} ${q.id}</h3>
            <button class="modal-close-btn" onclick="window.app.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label form-label-required">${isVi ? 'Nội dung Câu hỏi Vấn đáp' : 'Question Prompt'}</label>
              <!-- Preserved authored question text -->
              <textarea id="editQuestionPrompt" class="form-textarea" style="min-height: 90px;">${q.question}</textarea>
            </div>
            <div class="grid-3">
              <div class="form-group">
                <label class="form-label form-label-required">${t('course')}</label>
                <select id="editQuestionCourse" class="form-select">
                  <option ${q.course === 'CS301' ? 'selected' : ''}>CS301</option>
                  <option ${q.course === 'AI402' ? 'selected' : ''}>AI402</option>
                  <option ${q.course === 'DS205' ? 'selected' : ''}>DS205</option>
                  <option ${q.course === 'CY503' ? 'selected' : ''}>CY503</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label form-label-required">${isVi ? 'Chủ đề' : 'Topic'}</label>
                <input type="text" id="editQuestionTopic" class="form-input" value="${q.topic}">
              </div>
              <div class="form-group">
                <label class="form-label form-label-required">${isVi ? 'Độ khó' : 'Difficulty'}</label>
                <select id="editQuestionDiff" class="form-select">
                  <option value="Easy" ${q.difficulty === 'Easy' ? 'selected' : ''}>${isVi ? 'Dễ' : 'Easy'}</option>
                  <option value="Medium" ${q.difficulty === 'Medium' ? 'selected' : ''}>${isVi ? 'Trung bình' : 'Medium'}</option>
                  <option value="Hard" ${q.difficulty === 'Hard' ? 'selected' : ''}>${isVi ? 'Khó' : 'Hard'}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.app.closeModal()">${isVi ? 'Hủy' : 'Cancel'}</button>
            <button class="btn btn-primary" onclick="window.app.submitEditQuestion('${q.id}')">${isVi ? 'Lưu Câu Hỏi' : 'Save Question'}</button>
          </div>
        </div>
      </div>
    `);
  }

  submitEditQuestion(qId) {
    const q = state.data.questionBank.find(item => item.id === qId);
    if (!q) return;
    const isVi = state.lang === 'vi';

    q.question = document.getElementById('editQuestionPrompt')?.value.trim() || q.question;
    q.course = document.getElementById('editQuestionCourse')?.value || q.course;
    q.topic = document.getElementById('editQuestionTopic')?.value.trim() || q.topic;
    q.difficulty = document.getElementById('editQuestionDiff')?.value || q.difficulty;

    this.closeModal();
    this.showToast(isVi ? 'Đã cập nhật câu hỏi thành công.' : 'Question updated successfully.', 'success');
    state.notify();
  }

  deleteQuestion(qId) {
    const isVi = state.lang === 'vi';
    if (confirm(isVi ? 'Bạn có chắc chắn muốn xóa câu hỏi này khỏi Ngân hàng không?' : 'Are you sure you want to delete this question from the Question Bank?')) {
      state.data.questionBank = state.data.questionBank.filter(q => q.id !== qId);
      this.showToast(isVi ? 'Đã xóa câu hỏi khỏi ngân hàng.' : 'Question deleted from bank.', 'info');
      state.notify();
    }
  }

  filterQuestionBank() {
    const qText = document.getElementById('qbankSearch')?.value.toLowerCase() || '';
    const course = document.getElementById('qbankCourse')?.value || 'All';
    const diff = document.getElementById('qbankDifficulty')?.value || 'All';
    const source = document.getElementById('qbankSource')?.value || 'All';

    const rows = document.querySelectorAll('#questionsTableBody tr');
    let visible = 0;
    rows.forEach(row => {
      const matchText = row.getAttribute('data-text').includes(qText);
      const matchCourse = course === 'All' || row.getAttribute('data-course') === course;
      const matchDiff = diff === 'All' || row.getAttribute('data-diff') === diff;
      const matchSource = source === 'All' || row.getAttribute('data-source') === source;

      if (matchText && matchCourse && matchDiff && matchSource) {
        row.style.display = '';
        visible++;
      } else {
        row.style.display = 'none';
      }
    });

    const countEl = document.getElementById('qbankCount');
    if (countEl) countEl.innerText = visible;
  }

  openAddQuestionModal() {
    const isVi = state.lang === 'vi';
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) window.app.closeModal()">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <h3>${isVi ? 'Thêm Câu Hỏi Mới vào Ngân Hàng' : 'Add Question to Bank'}</h3>
            <button class="modal-close-btn" onclick="window.app.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label form-label-required">${isVi ? 'Nội dung Câu hỏi Vấn đáp' : 'Question Prompt'}</label>
              <!-- The question authored here remains in whatever language the lecturer types -->
              <textarea id="manualQText" class="form-textarea" placeholder="${isVi ? 'Soạn nội dung câu hỏi vấn đáp miệng...' : 'Formulate the viva question prompt...'}"></textarea>
            </div>
            <div class="grid-3">
              <div class="form-group">
                <label class="form-label form-label-required">${t('course')}</label>
                <select id="manualQCourse" class="form-select">
                  <option value="CS301">CS301</option>
                  <option value="AI402">AI402</option>
                  <option value="DS205">DS205</option>
                  <option value="CY503">CY503</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label form-label-required">${isVi ? 'Chủ đề' : 'Topic'}</label>
                <input type="text" id="manualQTopic" class="form-input" placeholder="${isVi ? 'VD: Đồng thuận Phân tán' : 'e.g. Distributed Consensus'}">
              </div>
              <div class="form-group">
                <label class="form-label form-label-required">${isVi ? 'Độ khó' : 'Difficulty'}</label>
                <select id="manualQDiff" class="form-select">
                  <option value="Easy">${isVi ? 'Dễ' : 'Easy'}</option>
                  <option value="Medium">${isVi ? 'Trung bình' : 'Medium'}</option>
                  <option value="Hard">${isVi ? 'Khó' : 'Hard'}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.app.closeModal()">${isVi ? 'Hủy' : 'Cancel'}</button>
            <button class="btn btn-primary" onclick="window.app.submitManualQuestion()">${isVi ? 'Lưu vào Ngân Hàng Câu Hỏi' : 'Save to Question Bank'}</button>
          </div>
        </div>
      </div>
    `);
  }

  submitManualQuestion() {
    const isVi = state.lang === 'vi';
    const question = document.getElementById('manualQText')?.value.trim();
    const course = document.getElementById('manualQCourse')?.value;
    const topic = document.getElementById('manualQTopic')?.value.trim();
    const difficulty = document.getElementById('manualQDiff')?.value;

    if (!question || !topic) {
      alert(isVi ? 'Vui lòng điền nội dung câu hỏi và chủ đề.' : 'Please fill out the question text and topic.');
      return;
    }

    state.data.questionBank.unshift({
      id: `q-${Date.now().toString().slice(-4)}`,
      question, course, topic, difficulty, source: 'Manual', status: 'Approved'
    });

    this.closeModal();
    this.showToast(isVi ? 'Đã lưu câu hỏi vào ngân hàng câu hỏi.' : 'Question saved to question bank.', 'success');
    state.notify();
  }

  // Material Upload & AI Generation
  simulateFileUpload() {
    const isVi = state.lang === 'vi';
    this.showToast(isVi ? 'Đang tải lên tài liệu "Chapter 09 - Microservices Choreography.pdf"...' : 'Uploading "Chapter 09 - Microservices Choreography.pdf"...', 'info');
    setTimeout(() => {
      state.data.learningMaterials.unshift({
        id: `mat-${Date.now().toString().slice(-3)}`,
        course: 'CS301',
        title: 'Chapter 09 - Microservices Choreography.pdf',
        size: '3.1 MB',
        uploadDate: '2026-10-01',
        status: 'Questions Generated'
      });
      this.showToast(isVi ? 'Tài liệu đã được xử lý! Đang chuyển đến giao diện Tạo Câu hỏi AI...' : 'File processed! Redirecting to AI Question Generation...', 'success');
      this.navigate('ai-question-generation');
    }, 1200);
  }

  triggerAIGeneration() {
    const isVi = state.lang === 'vi';
    const btn = document.getElementById('btnSynthesize');
    const course = document.getElementById('genCourse')?.value || 'CS301';
    const topic = document.getElementById('genTopic')?.value || 'Leader Election';
    const diff = document.getElementById('genDiff')?.value || 'Hard';

    if (btn) {
      btn.innerHTML = `<span style="display:inline-block; width:14px; height:14px; border:2px solid white; border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite;"></span> ${isVi ? 'Đang tổng hợp câu hỏi...' : 'Synthesizing Questions...'}`;
      btn.disabled = true;
    }

    this.showToast(isVi ? 'AI đang phân tích tài liệu học phần và trích xuất luận điểm...' : 'AI analysis started: Parsing syllabus and claims...', 'info');

    setTimeout(() => {
      // Append newly synthesized questions (question text authored in target domain language)
      state.uploadState.generatedQuestions.unshift(
        {
          id: `gen-${Date.now().toString().slice(-3)}-1`,
          question: `How does ${topic} guarantee safety during split-brain partitions in ${course}? Detail the quorum proof.`,
          topic: topic,
          difficulty: diff,
          approved: false,
          rejected: false
        },
        {
          id: `gen-${Date.now().toString().slice(-3)}-2`,
          question: `Contrast synchronous validation against eventual consistency in ${topic}. What edge-case failures emerge?`,
          topic: topic,
          difficulty: 'Medium',
          approved: false,
          rejected: false
        }
      );

      this.showToast(isVi ? '✓ Đã tạo xong 2 câu hỏi mới! Vui lòng kiểm tra và duyệt bên dưới.' : '✓ 2 new questions synthesized! Review and approve below.', 'success');
      state.notify();
    }, 1200);
  }

  saveGeneratedQuestionEdit(genId) {
    const isVi = state.lang === 'vi';
    const textEl = document.getElementById(`genTextArea_${genId}`);
    const item = state.uploadState.generatedQuestions.find(q => q.id === genId);
    if (textEl && item) {
      item.question = textEl.value.trim();
      this.showToast(isVi ? 'Đã lưu chỉnh sửa câu hỏi dự thảo.' : 'Question draft edits saved.', 'success');
    }
  }

  approveGeneratedQuestion(genId) {
    const isVi = state.lang === 'vi';
    const item = state.uploadState.generatedQuestions.find(q => q.id === genId);
    if (item) {
      item.approved = true;
      item.rejected = false;
      state.data.questionBank.unshift({
        id: `q-gen-${Date.now().toString().slice(-3)}`,
        question: item.question,
        course: 'CS301',
        topic: item.topic,
        difficulty: item.difficulty,
        source: 'AI Generated',
        status: 'Approved'
      });
      this.showToast(isVi ? `Đã duyệt: "${item.topic}" đã được thêm vào Ngân hàng Câu hỏi.` : `Approved: "${item.topic}" added to active Question Bank.`, 'success');
      state.notify();
    }
  }

  rejectGeneratedQuestion(genId) {
    const isVi = state.lang === 'vi';
    const item = state.uploadState.generatedQuestions.find(q => q.id === genId);
    if (item) {
      item.rejected = true;
      item.approved = false;
      this.showToast(isVi ? 'Đã từ chối câu hỏi dự thảo.' : 'Question draft rejected.', 'info');
      state.notify();
    }
  }

  // Rubrics
  openCreateRubricModal() {
    const isVi = state.lang === 'vi';
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) window.app.closeModal()">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <h3>${isVi ? 'Tạo Bộ Tiêu Chí Rubric Mới' : 'Create New Viva Voce Rubric'}</h3>
            <button class="modal-close-btn" onclick="window.app.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label form-label-required">${isVi ? 'Tên Bộ Rubric' : 'Rubric Title'}</label>
                <input type="text" id="newRubricTitle" class="form-input" value="Advanced Distributed Systems Oral Rubric">
              </div>
              <div class="form-group">
                <label class="form-label form-label-required">${isVi ? 'Môn Học Áp Dụng' : 'Associated Course'}</label>
                <select id="newRubricCourse" class="form-select">
                  <option value="CS301">CS301 – Software Architecture</option>
                  <option value="AI402">AI402 – Natural Language Processing</option>
                </select>
              </div>
            </div>
            <div class="alert-box alert-info">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <div>${isVi ? 'Các tiêu chí chuẩn bao gồm: Độ chính xác (25%), Hiểu biết khái niệm (25%), Diễn đạt (20%), Lập luận (15%), Giao tiếp (15%). Tổng trọng số phải bằng 100%.' : 'Standard viva criteria include: Accuracy (25%), Concept Understanding (25%), Explanation Quality (20%), Reasoning (15%), Communication (15%). Total sum must equal 100%.'}</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.app.closeModal()">${isVi ? 'Hủy' : 'Cancel'}</button>
            <button class="btn btn-primary" onclick="window.app.submitNewRubric()">${isVi ? 'Phê Duyệt Bộ Rubric' : 'Approve Rubric'}</button>
          </div>
        </div>
      </div>
    `);
  }

  submitNewRubric() {
    const isVi = state.lang === 'vi';
    const name = document.getElementById('newRubricTitle')?.value.trim() || 'New Viva Rubric';
    const course = document.getElementById('newRubricCourse')?.value || 'CS301';
    state.data.rubrics.unshift({
      id: `rub-${Date.now().toString().slice(-2)}`,
      name,
      course,
      criteriaCount: 5,
      lastUpdated: '2026-10-01',
      status: 'Approved',
      criteria: JSON.parse(JSON.stringify(state.data.rubrics[0].criteria))
    });
    this.closeModal();
    this.showToast(isVi ? `Đã tạo và phê duyệt bộ Rubric "${name}".` : `Rubric "${name}" created and approved.`, 'success');
    state.notify();
  }

  previewRubric(rubricId) {
    state.activeRubricId = rubricId;
    state.notify();
    const rub = state.data.rubrics.find(r => r.id === rubricId);
    if (rub) {
      this.showToast(state.lang === 'vi' ? `Đang xem tiêu chí của "${rub.name}".` : `Inspecting criteria for "${rub.name}".`, 'info');
    }
  }

  deleteRubric(rubricId) {
    const isVi = state.lang === 'vi';
    const rub = state.data.rubrics.find(r => r.id === rubricId);
    if (!rub) return;
    if (confirm(isVi ? `Bạn có chắc muốn xóa bộ rubric "${rub.name}"?` : `Are you sure you want to delete rubric "${rub.name}"?`)) {
      state.data.rubrics = state.data.rubrics.filter(r => r.id !== rubricId);
      if (state.activeRubricId === rubricId) {
        state.activeRubricId = state.data.rubrics[0]?.id || 'rub-01';
      }
      this.showToast(isVi ? `Đã xóa bộ rubric "${rub.name}".` : `Rubric "${rub.name}" deleted.`, 'info');
      state.notify();
    }
  }

  openEditRubricModal(rubricId) {
    const rub = state.data.rubrics.find(r => r.id === rubricId) || state.data.rubrics[0];
    const isVi = state.lang === 'vi';
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) window.app.closeModal()">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <h3>${isVi ? 'Chỉnh Sửa Bộ Rubric:' : 'Edit Rubric:'} ${rub.name}</h3>
            <button class="modal-close-btn" onclick="window.app.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${rub.criteria.map((c, i) => `
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; align-items: center; padding: 10px; background: var(--bg-subtle); border-radius: var(--radius-md);">
                  <div>
                    <label class="form-label" style="font-size: 0.75rem;">${isVi ? 'Tên Tiêu Chí' : 'Criterion Name'}</label>
                    <input type="text" class="form-input crit-name-input" value="${c.name}" data-id="${c.id}">
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 0.75rem;">${isVi ? 'Trọng Số %' : 'Weight %'}</label>
                    <input type="number" class="form-input crit-weight-input" value="${c.weight}" min="5" max="50" data-id="${c.id}">
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 0.75rem;">${isVi ? 'Điểm Tối Đa' : 'Max Points'}</label>
                    <input type="number" class="form-input" value="${c.maxScore}" readonly style="background: var(--bg-surface);">
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.app.closeModal()">${isVi ? 'Hủy' : 'Cancel'}</button>
            <button class="btn btn-primary" onclick="window.app.saveRubricCriteria('${rub.id}')">${isVi ? 'Lưu Thay Đổi' : 'Save Changes'}</button>
          </div>
        </div>
      </div>
    `);
  }

  saveRubricCriteria(rubricId) {
    const rub = state.data.rubrics.find(r => r.id === rubricId);
    if (!rub) return;
    const isVi = state.lang === 'vi';

    const names = document.querySelectorAll('.crit-name-input');
    const weights = document.querySelectorAll('.crit-weight-input');

    let totalWeight = 0;
    rub.criteria.forEach((c, i) => {
      if (names[i]) c.name = names[i].value;
      if (weights[i]) {
        c.weight = parseInt(weights[i].value) || c.weight;
        totalWeight += c.weight;
      }
    });

    this.closeModal();
    this.showToast(isVi ? `Đã cập nhật các tiêu chí của rubric "${rub.name}" (Tổng: ${totalWeight}%).` : `Rubric "${rub.name}" criteria updated (Total: ${totalWeight}%).`, 'success');
    state.notify();
  }

  // Exam Wizard
  startExamWizard() {
    state.examWizard.step = 1;
    this.navigate('create-exam-session');
  }

  goToWizardStep(step) {
    state.examWizard.step = step;
    state.notify();
  }

  toggleWizardStudent(stdId) {
    const list = state.examWizard.formData.selectedStudents;
    const idx = list.indexOf(stdId);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(stdId);
    }
    state.notify();
  }

  toggleWizardQuestion(qId) {
    const list = state.examWizard.formData.selectedQuestions;
    const idx = list.indexOf(qId);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(qId);
    }
    state.notify();
  }

  saveExamDraft() {
    this.showToast(state.lang === 'vi' ? 'Đã lưu bản nháp phiên thi.' : 'Exam session saved as Draft.', 'info');
    this.navigate('exam-sessions');
  }

  publishExamSession() {
    const fd = state.examWizard.formData;
    state.data.examSessions.unshift({
      id: `EX-2026-${Date.now().toString().slice(-2)}`,
      name: fd.name,
      course: fd.course,
      courseName: 'Software Architecture & Distributed Systems',
      lecturer: 'Dr. Eleanor Vance',
      date: fd.date,
      startTime: fd.startTime,
      duration: fd.duration,
      studentsCount: fd.selectedStudents.length,
      status: 'Published',
      description: fd.description
    });

    this.showToast(state.lang === 'vi' ? '✓ Đã công bố phiên thi! Thông báo đã gửi tới thí sinh.' : '✓ Exam session published! Student notifications dispatched.', 'success');
    this.navigate('exam-sessions');
  }

  filterExamSessions() {
    const status = document.getElementById('examStatusFilter')?.value || 'All';
    const course = document.getElementById('examCourseFilter')?.value || 'All';
    const q = document.getElementById('examSearchInput')?.value.toLowerCase().trim() || '';

    const rows = document.querySelectorAll('#examSessionsTableBody tr');
    let visible = 0;
    rows.forEach(row => {
      const matchStatus = status === 'All' || row.getAttribute('data-status') === status;
      const matchCourse = course === 'All' || row.getAttribute('data-course') === course;
      const dataQ = (row.getAttribute('data-query') || '').toLowerCase();
      const matchQ = !q || dataQ.includes(q);

      if (matchStatus && matchCourse && matchQ) {
        row.style.display = '';
        visible++;
      } else {
        row.style.display = 'none';
      }
    });

    const countEl = document.getElementById('examSessionsCount');
    if (countEl) countEl.innerText = visible;
  }

  publishDraftExam(examId) {
    const isVi = state.lang === 'vi';
    const ex = state.data.examSessions.find(e => e.id === examId);
    if (!ex) return;
    ex.status = 'Published';
    this.showToast(isVi ? `Đã công bố phiên thi "${ex.name}" thành công!` : `Exam session "${ex.name}" published successfully!`, 'success');
    state.notify();
  }

  startExamNow(examId) {
    const isVi = state.lang === 'vi';
    const ex = state.data.examSessions.find(e => e.id === examId);
    if (!ex) return;
    ex.status = 'In Progress';
    this.showToast(isVi ? `Đã bắt đầu ca thi "${ex.name}". Chuyển sang bảng giám sát...` : `Exam session "${ex.name}" started. Redirecting to live monitoring...`, 'success');
    state.notify();
    this.navigate('live-monitoring');
  }

  deleteExamSession(examId) {
    const isVi = state.lang === 'vi';
    const ex = state.data.examSessions.find(e => e.id === examId);
    if (!ex) return;
    if (confirm(isVi ? `Bạn có chắc muốn xóa phiên thi "${ex.name}"?` : `Are you sure you want to delete exam session "${ex.name}"?`)) {
      state.data.examSessions = state.data.examSessions.filter(e => e.id !== examId);
      this.showToast(isVi ? `Đã xóa phiên thi "${ex.name}".` : `Exam session "${ex.name}" deleted.`, 'info');
      state.notify();
    }
  }

  switchDetailTab(tab) {
    state.detailActiveTab = tab;
    state.notify();
  }

  switchStudentExamTab(tab) {
    state.studentExamTab = tab;
    state.notify();
  }

  // Live Exam Monitoring Actions
  openLiveStreamModal(studentName, currentQuestion, duration) {
    const isVi = state.lang === 'vi';
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) window.app.closeModal()">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: #22c55e;"></span>
              <h3>${isVi ? 'Luồng Giám Sát Trực Tiếp Thí Sinh:' : 'Live Candidate Stream:'} ${studentName}</h3>
            </div>
            <button class="modal-close-btn" onclick="window.app.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="grid-2" style="margin-bottom: 20px;">
              <div style="background-color: #0f172a; border-radius: var(--radius-md); height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: #334155; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                  <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <span style="font-size: 0.8rem; color: #94a3b8;">${isVi ? 'Luồng Video Giám Sát Mã Hóa' : 'Encrypted Academic Video Stream'}</span>
                <span style="font-size: 0.7rem; color: #4ade80; margin-top: 4px;">● HD 1080p • 30 FPS</span>
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem;">
                <div><span style="color: var(--text-muted);">${isVi ? 'Giai đoạn hiện tại:' : 'Current Active Phase:'}</span> <strong>${currentQuestion}</strong></div>
                <div><span style="color: var(--text-muted);">${isVi ? 'Thời gian thi đã qua:' : 'Elapsed Viva Time:'}</span> <strong>${duration}</strong></div>
                <div><span style="color: var(--text-muted);">${isVi ? 'Tín hiệu Micro:' : 'Candidate Mic Activity:'}</span> <span style="color: var(--status-completed-text);">${isVi ? 'Đang nhận giọng nói (Hoạt động)' : 'Voice Detected (Active)'}</span></div>
                <div><span style="color: var(--text-muted);">${isVi ? 'Luồng nhận dạng giọng nói trực tiếp:' : 'Speech Recognition Stream:'}</span></div>
                <div style="padding: 10px; background: var(--bg-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
                  “...the partition with the majority votes will maintain quorum and continue serving commit logs...”
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.app.closeModal()">${isVi ? 'Đóng Luồng Giám Sát' : 'Close Stream'}</button>
          </div>
        </div>
      </div>
    `);
  }

  openExamInstructionsModal() {
    const isVi = state.lang === 'vi';
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) window.app.closeModal()">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>${isVi ? 'Quy Chế & Hướng Dẫn Phòng Thi Vấn Đáp' : 'Examination Instructions & Code of Conduct'}</h3>
            <button class="modal-close-btn" onclick="window.app.closeModal()">✕</button>
          </div>
          <div class="modal-body" style="font-size: 0.875rem; line-height: 1.6;">
            <p style="margin-bottom: 12px;">${isVi ? 'Chào mừng bạn đến với hệ thống thi vấn đáp trực tuyến AIVES. Vui lòng tuân thủ nghiêm ngặt các quy định sau:' : 'Welcome to the AIVES Oral Viva Voce system. Please adhere to the following rules:'}</p>
            <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 8px; color: var(--text-secondary);">
              <li>${isVi ? 'Ngồi trong phòng yên tĩnh, độc lập, không có tiếng ồn xung quanh.' : 'Ensure you are in a quiet, isolated academic room free from background noise.'}</li>
              <li>${isVi ? 'Bắt buộc sử dụng microphone và tai nghe/loa hoạt động ổn định.' : 'A working microphone and stereo headphones or speakers are strictly required.'}</li>
              <li>${isVi ? 'Bạn có thể nghe lại âm thanh đọc câu hỏi nếu cần thiết.' : 'You may replay the voice prompt of each question if needed.'}</li>
              <li>${isVi ? 'Khi bạn phát biểu, hệ thống tự động ghi âm và chuyển thành văn bản để hội đồng chấm điểm.' : 'When you speak, the system automatically converts your voice into an evaluation transcript.'}</li>
              <li>${isVi ? 'Giám khảo AI có thể đặt thêm câu hỏi phụ để đánh giá độ sâu hiểu biết.' : 'AI follow-up questions may be posed to test the depth of your reasoning.'}</li>
            </ul>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="window.app.closeModal()">${isVi ? 'Tôi Đã Hiểu & Sẵn Sàng' : 'Understood'}</button>
          </div>
        </div>
      </div>
    `);
  }

  // Pre-Exam Check Actions
  testMicrophone() {
    const isVi = state.lang === 'vi';
    const feedback = document.getElementById('micFeedbackText');
    const badge = document.getElementById('micBadge');
    const btn = document.getElementById('btnTestMic');

    if (btn) btn.innerText = isVi ? 'Đang nghe...' : 'Listening...';
    if (feedback) feedback.style.display = 'block';

    // If mediaDevices is available, request mic to ensure permissions
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          setTimeout(() => {
            stream.getTracks().forEach(t => t.stop());
            state.deviceCheck.micTested = true;
            if (btn) btn.innerText = isVi ? 'Thử lại' : 'Retest';
            if (badge) {
              badge.innerText = isVi ? '✓ Sẵn sàng' : '✓ Ready';
              badge.style.color = 'var(--status-completed-text)';
            }
            this.showToast(isVi ? 'Microphone hoạt động tốt và đã sẵn sàng.' : 'Microphone hardware calibrated and active.', 'success');
          }, 1200);
        })
        .catch(() => {
          // Fallback to simulated microphone test
          setTimeout(() => {
            state.deviceCheck.micTested = true;
            if (btn) btn.innerText = isVi ? 'Thử lại' : 'Retest';
            if (badge) {
              badge.innerText = isVi ? '✓ Sẵn sàng' : '✓ Ready';
              badge.style.color = 'var(--status-completed-text)';
            }
            this.showToast(isVi ? 'Đã nhận tín hiệu micro (Thiết bị âm thanh mặc định).' : 'Microphone input detected (Default audio device).', 'success');
          }, 1200);
        });
    } else {
      setTimeout(() => {
        state.deviceCheck.micTested = true;
        if (btn) btn.innerText = isVi ? 'Thử lại' : 'Retest';
        if (badge) {
          badge.innerText = isVi ? '✓ Sẵn sàng' : '✓ Ready';
          badge.style.color = 'var(--status-completed-text)';
        }
        this.showToast(isVi ? 'Đã nhận tín hiệu micro.' : 'Microphone input detected.', 'success');
      }, 1200);
    }
  }

  testSpeakerAudio() {
    const isVi = state.lang === 'vi';
    const badge = document.getElementById('speakerBadge');
    const btn = document.getElementById('btnTestSpeaker');

    if (btn) btn.innerText = isVi ? 'Đang phát...' : 'Playing Tone...';

    AudioEngine.playSpeakerTestTone(() => {
      state.deviceCheck.speakerTested = true;
      if (btn) btn.innerText = isVi ? 'Phát lại' : 'Play Again';
      if (badge) {
        badge.innerText = isVi ? '✓ Sẵn sàng' : '✓ Ready';
        badge.style.color = 'var(--status-completed-text)';
      }
      this.showToast(isVi ? 'Đã phát xong âm thanh kiểm tra loa/tai nghe.' : 'Speaker test tone played.', 'success');
    });
  }

  startVivaSession() {
    const isVi = state.lang === 'vi';
    state.vivaSession.currentQuestionIndex = 0;
    state.vivaSession.isRecording = false;
    state.vivaSession.recordingSeconds = 0;
    state.vivaSession.isFollowUpMode = false;
    state.vivaSession.completed = false;

    this.navigate('viva-oral-exam');
    this.showToast(isVi ? 'Chào mừng bạn vào phòng thi. Nhấp "Nghe phát âm đề bài" để nghe câu hỏi.' : 'Welcome to the examination room. Click "Play Voice Prompt" to hear the question.', 'info');
  }

  // Viva Room Controls
  playQuestionTTS() {
    const isVi = state.lang === 'vi';
    const sess = state.vivaSession;
    const currentQ = sess.questions[sess.currentQuestionIndex];
    const textToSpeak = sess.isFollowUpMode ? currentQ.followUpText : currentQ.text;

    const avatar = document.getElementById('aiExaminerAvatar');
    const statusText = document.getElementById('aiSpeakingState');
    const btn = document.getElementById('btnPlayTTS');

    sess.isTTSPlaying = true;
    if (avatar) avatar.classList.add('speaking');
    if (statusText) statusText.innerText = isVi ? '● Đang phát âm câu hỏi...' : '● Articulating question aloud...';
    if (btn) btn.disabled = true;

    TTS.speak(textToSpeak, 
      () => {}, 
      () => {
        sess.isTTSPlaying = false;
        if (avatar) avatar.classList.remove('speaking');
        if (statusText) statusText.innerText = isVi ? 'Sẵn sàng nghe câu trả lời' : 'Ready for candidate answer';
        if (btn) btn.disabled = false;
      }
    );
  }

  startStudentRecording() {
    const isVi = state.lang === 'vi';
    TTS.stop();
    const sess = state.vivaSession;
    sess.isRecording = true;
    sess.recordingSeconds = 0;

    const canvas = document.getElementById('vivaWaveformCanvas');
    AudioEngine.startWaveform(canvas);

    // Recording timer tick
    clearInterval(this.recordTimerInterval);
    this.recordTimerInterval = setInterval(() => {
      sess.recordingSeconds++;
      const timerEl = document.getElementById('recordingTimerDisplay');
      if (timerEl) {
        const mins = String(Math.floor(sess.recordingSeconds / 60)).padStart(2, '0');
        const secs = String(sess.recordingSeconds % 60).padStart(2, '0');
        timerEl.innerText = `${mins}:${secs}`;
      }
    }, 1000);

    state.notify();
    this.showToast(isVi ? 'Đã bắt đầu ghi âm. Vui lòng nói to rõ câu trả lời.' : 'Recording started. Please speak your answer clearly.', 'info');
  }

  stopStudentRecording(skipAnimation = false) {
    const isVi = state.lang === 'vi';
    clearInterval(this.recordTimerInterval);
    const sess = state.vivaSession;
    sess.isRecording = false;

    const canvas = document.getElementById('vivaWaveformCanvas');
    AudioEngine.stopWaveform(canvas);

    if (skipAnimation) return;

    // Show processing banner
    const banner = document.getElementById('vivaProcessingBanner');
    if (banner) banner.style.display = 'flex';

    setTimeout(() => {
      if (banner) banner.style.display = 'none';

      // Section 21 Logic: If Q1 and not yet follow-up, trigger the follow-up question flow!
      if (sess.currentQuestionIndex === 0 && !sess.isFollowUpMode) {
        sess.isFollowUpMode = true;
        this.showToast(isVi ? 'AI đã phân tích xong: Đang chuẩn bị câu hỏi phụ chuyên sâu...' : 'AI analysis complete: Generating targeted follow-up question...', 'info');
        state.notify();
        // Auto play the follow-up question
        setTimeout(() => this.playQuestionTTS(), 500);
      } else if (sess.currentQuestionIndex === 0 && sess.isFollowUpMode) {
        // Follow-up answered! Proceed to Question 2
        sess.isFollowUpMode = false;
        sess.currentQuestionIndex = 1;
        this.showToast(isVi ? 'Đã lưu câu trả lời phụ. Chuyển sang Câu hỏi 2...' : 'Follow-up answer saved. Advancing to Question 2...', 'success');
        state.notify();
        setTimeout(() => this.playQuestionTTS(), 500);
      } else {
        // Question 2 answered -> Exam Completed!
        sess.completed = true;
        this.navigate('exam-completed');
      }
    }, 1800);
  }

  // Scoring matrix adjustments
  updateCriterionScore(critId, val) {
    const numVal = parseFloat(val);
    state.scoringState.scores[critId] = numVal;

    // Sync other input if present
    const numInput = document.getElementById(`critInput_${critId}`);
    if (numInput) numInput.value = numVal;

    const calculated = state.calculateLecturerFinalScore();
    const liveScoreEl = document.getElementById('liveCalculatedScore');
    if (liveScoreEl) {
      liveScoreEl.innerHTML = `${calculated} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 500;">/ 10</span>`;
    }
  }

  promptFinalizeScoreModal(studentId) {
    const isVi = state.lang === 'vi';
    const finalScore = state.calculateLecturerFinalScore();
    const trans = state.data.detailedTranscripts[studentId] || state.data.detailedTranscripts['std-101'];

    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) window.app.closeModal()">
        <div class="modal-dialog modal-sm">
          <div class="modal-header">
            <h3>${isVi ? 'Chốt Điểm Thi Vấn Đáp Chính Thức' : 'Finalize Official Viva Score'}</h3>
            <button class="modal-close-btn" onclick="window.app.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom: 14px;">
              ${isVi ? `Bạn có chắc chắn muốn chốt điểm chính thức cho thí sinh <strong>${trans.studentName}</strong>?` : `Are you sure you want to finalize the official grade for <strong>${trans.studentName}</strong>?`}
            </p>
            <div style="background-color: var(--primary-light); padding: 14px; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--primary-border); margin-bottom: 16px;">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--primary); font-weight: 700;">${isVi ? 'Điểm Chính Thức Của Giảng Viên' : 'Final Official Grade'}</div>
              <div style="font-size: 2rem; font-weight: 800; color: var(--primary);">${finalScore} / 10</div>
            </div>
            <div class="alert-box alert-warning">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <div>${isVi ? 'Sau khi chốt điểm, kết quả sẽ được công bố trực tiếp lên cổng thông tin sinh viên và lưu vào bảng điểm học viện.' : 'Once finalized, this score will be published directly to the student portal and permanent academic record.'}</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.app.closeModal()">${isVi ? 'Hủy' : 'Cancel'}</button>
            <button class="btn btn-primary" onclick="window.app.confirmFinalizeScore('${studentId}')">
              ${isVi ? 'Xác Nhận & Công Bố Điểm' : 'Confirm & Publish Grade'}
            </button>
          </div>
        </div>
      </div>
    `);
  }

  confirmFinalizeScore(studentId) {
    const isVi = state.lang === 'vi';
    state.finalizeScore(studentId);
    this.closeModal();
    this.showToast(isVi ? 'Đã chốt và công bố điểm thi chính thức cho sinh viên thành công.' : 'Official score successfully finalized and published to student.', 'success');
    this.navigate('lecturer-results');
  }

  // Lecturer Results & Grade Book Actions
  filterResultsTable() {
    const q = document.getElementById('resultsSearchInput')?.value.toLowerCase().trim() || '';
    const status = document.getElementById('resultsStatusFilter')?.value || 'All';
    const course = document.getElementById('resultsExamFilter')?.value || 'All';

    const rows = document.querySelectorAll('#resultsTableBody tr');
    let visible = 0;
    rows.forEach(row => {
      const dataQ = (row.getAttribute('data-query') || '').toLowerCase();
      const matchQ = !q || dataQ.includes(q);
      const matchStatus = status === 'All' || row.getAttribute('data-status') === status;
      const matchCourse = course === 'All' || row.getAttribute('data-course') === course;

      if (matchQ && matchStatus && matchCourse) {
        row.style.display = '';
        visible++;
      } else {
        row.style.display = 'none';
      }
    });

    const countEl = document.getElementById('resultsCount');
    if (countEl) countEl.innerText = visible;
  }

  exportResultsCSV() {
    const isVi = state.lang === 'vi';
    const headers = ["Student ID", "Name", "Course", "Duration", "AI Benchmark Score", "Lecturer Final Score", "Status"];
    const rows = state.data.resultsList.map(r => [
      `"${r.studentId}"`,
      `"${r.name}"`,
      `"${r.course}"`,
      `"${r.duration}"`,
      r.aiScore,
      r.finalScore !== null ? r.finalScore : "",
      `"${r.status}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aives_exam_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast(isVi ? 'Đã xuất dữ liệu bảng điểm ra file CSV thành công.' : 'Assessment grade book exported to CSV.', 'success');
  }

  // Profile Actions
  saveProfileChanges() {
    const isVi = state.lang === 'vi';
    const name = document.getElementById('profileFullName')?.value.trim();
    const dept = document.getElementById('profileDepartment')?.value.trim();
    const newPass = document.getElementById('newPass')?.value;

    if (name && state.currentUser) {
      state.currentUser.name = name;
    }
    if (dept && state.currentUser) {
      state.currentUser.department = dept;
    }

    if (newPass && newPass.length >= 8) {
      this.showToast(isVi ? 'Thông tin cá nhân và mật khẩu học viện đã được cập nhật thành công.' : 'Profile and institutional password updated successfully.', 'success');
    } else {
      this.showToast(isVi ? 'Đã lưu thông tin cá nhân và cài đặt thiết bị âm thanh.' : 'Profile and peripheral preferences saved.', 'success');
    }
    state.notify();
  }
}

// Instantiate and attach to window
if (typeof window !== 'undefined') {
  window.app = new AIVESApp();
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      window.app.init();
    });
  }
}

export { AIVESApp };

