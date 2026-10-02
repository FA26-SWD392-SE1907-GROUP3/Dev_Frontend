// Lecturer Views: Screens 6 - 14
import { state } from '../state.js';
import { getStatusBadge } from './adminViews.js';
import { t } from '../i18n.js';

// Screen 6: Lecturer Dashboard
export function renderLecturerDashboard() {
  const pendingReviewsCount = Object.values(state.data.detailedTranscripts).filter(t => t.status === 'Pending Review').length;
  const isVi = state.lang === 'vi';

  return `
    <div class="content-container">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Bảng Điều Khiển Giảng Viên' : 'Lecturer Dashboard'}</h1>
          <p>${t('welcomeBack')}, ${state.currentUser ? state.currentUser.name : 'Dr. Eleanor Vance'}. ${isVi ? 'Quản lý thi vấn đáp trực tuyến và duyệt điểm khảo thí.' : 'Manage oral viva assessments and grading.'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="window.app.navigate('upload-materials')">${t('uploadMaterials')}</button>
          <button class="btn btn-ai btn-sm" onclick="window.app.navigate('ai-question-generation')">${t('generateAIQuestions')}</button>
          <button class="btn btn-primary btn-sm" onclick="window.app.startExamWizard()">${t('createExamSession')}</button>
        </div>
      </div>

      <!-- Summary Metrics Cards -->
      <div class="grid-4" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${t('assignedCourses')}</span>
            <span class="stat-value">2</span>
          </div>
          <div class="stat-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${t('activeQuestionBank')}</span>
            <span class="stat-value">${state.data.questionBank.length}</span>
          </div>
          <div class="stat-icon" style="background-color: var(--primary-light); color: var(--primary);">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${t('upcomingExams')}</span>
            <span class="stat-value">2</span>
          </div>
          <div class="stat-icon" style="background-color: rgba(245, 158, 11, 0.15); color: #d97706;">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
          </div>
        </div>

        <div class="stat-card" style="border: 1px solid var(--ai-badge-border); background-color: var(--bg-surface);">
          <div class="stat-info">
            <span class="stat-label" style="color: var(--status-pending-text); font-weight: 600;">${t('pendingReviews')}</span>
            <span class="stat-value" style="color: var(--status-pending-text);">${pendingReviewsCount}</span>
          </div>
          <div class="stat-icon" style="background-color: var(--status-pending-bg); color: var(--status-pending-text);">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
        </div>
      </div>

      <!-- Pending Reviews Section (Human in the loop callout) -->
      ${pendingReviewsCount > 0 ? `
        <div class="card" style="margin-bottom: 24px; border-left: 4px solid var(--status-pending-text);">
          <div class="card-header">
            <div>
              <h2 class="card-title" style="color: var(--status-pending-text); display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                ${t('pendingReviewsTitle')}
              </h2>
              <div class="card-subtitle">${t('pendingReviewsDesc')}</div>
            </div>
            <span class="status-badge badge-pending">${pendingReviewsCount} ${t('requiresAttention')}</span>
          </div>

          <div style="background-color: var(--bg-subtle); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="font-weight: 600; color: var(--text-primary);">Alex Morgan (MSSV: SE180101)</div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                SWD392 Oral Viva: Distributed Consistency & Clean Architecture • ${isVi ? 'Thời lượng' : 'Duration'}: 14m 10s • <span class="ai-suggestion-badge">${t('aiSuggestedScore')}: 8.2 / 10</span>
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" onclick="window.app.navigate('transcript-review', { studentId: 'std-101' })">${t('viewTranscript')}</button>
              <button class="btn btn-primary btn-sm" onclick="window.app.navigate('ai-scoring', { studentId: 'std-101' })">${t('gradeFinalize')}</button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Upcoming Exams Table -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <div>
            <h2 class="card-title">${t('myUpcomingExams')}</h2>
            <div class="card-subtitle">${t('myUpcomingExamsDesc')}</div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.app.navigate('exam-sessions')">${isVi ? 'Xem Tất cả Phiên thi' : 'View All Sessions'}</button>
        </div>

        <div class="table-container">
          <table class="academic-table">
            <thead>
              <tr>
                <th>${isVi ? 'Phiên thi Vấn đáp' : 'Exam Session'}</th>
                <th>${isVi ? 'Môn học' : 'Course'}</th>
                <th>${isVi ? 'Ngày & Giờ' : 'Date & Time'}</th>
                <th>${isVi ? 'Thí sinh Tham gia' : 'Enrolled Candidates'}</th>
                <th>${t('status')}</th>
                <th style="text-align: right;">${t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${state.data.examSessions.map(exam => `
                <tr>
                  <td><strong>${exam.name}</strong></td>
                  <td><code>${exam.course}</code></td>
                  <td>${exam.date} • ${exam.startTime} (${exam.duration})</td>
                  <td>${exam.studentsCount} ${isVi ? 'thí sinh' : 'candidates'}</td>
                  <td>${getStatusBadge(exam.status)}</td>
                  <td style="text-align: right; white-space: nowrap;">
                    ${exam.status === 'In Progress' 
                      ? `<button class="btn btn-primary btn-sm" onclick="window.app.navigate('live-monitoring')">🔴 ${isVi ? 'Giám sát Trực tiếp' : 'Monitor Live'}</button>`
                      : `<button class="btn btn-secondary btn-sm" onclick="window.app.navigate('exam-session-detail', { id: '${exam.id}' })">${t('viewDetails')}</button>`
                    }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="grid-3">
        <div class="card" style="cursor: pointer;" onclick="window.app.startExamWizard()">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
            <div style="width: 36px; height: 36px; border-radius: var(--radius-md); background-color: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center;">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
            <strong style="font-size: 0.95rem;">${isVi ? 'Tạo Phiên thi Mới' : 'Create Exam Session'}</strong>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted);">${isVi ? 'Quy trình hướng dẫn từng bước để chọn thí sinh, lên lịch và gán tiêu chí chấm.' : 'Step-by-step wizard to assign students, schedule dates, and pair question rubrics.'}</p>
        </div>

        <div class="card" style="cursor: pointer;" onclick="window.app.navigate('question-bank')">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
            <div style="width: 36px; height: 36px; border-radius: var(--radius-md); background-color: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center;">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <strong style="font-size: 0.95rem;">${isVi ? 'Quản lý Ngân hàng Câu hỏi' : 'Manage Question Bank'}</strong>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted);">${isVi ? 'Xem, chỉnh sửa và phê duyệt các câu hỏi vấn đáp thủ công và do AI tạo.' : 'Review, edit, and approve manual and AI-synthesized oral examination questions.'}</p>
        </div>

        <div class="card" style="cursor: pointer;" onclick="window.app.navigate('rubrics')">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
            <div style="width: 36px; height: 36px; border-radius: var(--radius-md); background-color: rgba(34, 197, 94, 0.15); color: #16a34a; display: flex; align-items: center; justify-content: center;">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <strong style="font-size: 0.95rem;">${isVi ? 'Quản lý Tiêu chí Rubric' : 'Manage Rubrics'}</strong>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted);">${isVi ? 'Định nghĩa trọng số tiêu chí (Độ chính xác, Lập luận, Giao tiếp) cho việc chấm điểm chuẩn xác.' : 'Define academic criteria weights (Accuracy, Reasoning, Communication) for consistent grading.'}</p>
        </div>
      </div>
    </div>
  `;
}

// Screen 7: Question Bank
export function renderQuestionBank() {
  const isVi = state.lang === 'vi';
  return `
    <div class="content-container">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Ngân Hàng Câu Hỏi Vấn Đáp' : 'Question Bank'}</h1>
          <p>${isVi ? 'Kho câu hỏi vấn đáp miệng, kịch bản tình huống học thuật và câu hỏi do AI tổng hợp.' : 'Curated bank of oral examination prompts, verified theoretical scenarios, and AI-generated questions.'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="window.app.navigate('upload-materials')">${t('uploadMaterials')}</button>
          <button class="btn btn-ai btn-sm" onclick="window.app.navigate('ai-question-generation')">${isVi ? '✨ Tạo bằng AI' : '✨ Generate with AI'}</button>
          <button class="btn btn-primary btn-sm" onclick="window.app.openAddQuestionModal()">${isVi ? '+ Thêm Câu hỏi' : '+ Add Question'}</button>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="filter-toolbar">
        <div class="filter-left">
          <div class="search-input-wrapper">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="form-input" id="qbankSearch" placeholder="${isVi ? 'Tìm kiếm câu hỏi...' : 'Search questions...'}" style="width: 260px;" oninput="window.app.filterQuestionBank()">
          </div>

          <select class="form-select" id="qbankCourse" style="width: 140px;" onchange="window.app.filterQuestionBank()">
            <option value="All">${isVi ? 'Tất cả Môn học' : 'All Courses'}</option>
            ${state.data.courses.map(c => `<option value="${c.code}">${c.code}</option>`).join('')}
          </select>

          <select class="form-select" id="qbankDifficulty" style="width: 140px;" onchange="window.app.filterQuestionBank()">
            <option value="All">${isVi ? 'Tất cả Độ khó' : 'All Difficulties'}</option>
            <option value="Easy">${isVi ? 'Dễ' : 'Easy'}</option>
            <option value="Medium">${isVi ? 'Trung bình' : 'Medium'}</option>
            <option value="Hard">${isVi ? 'Khó' : 'Hard'}</option>
          </select>

          <select class="form-select" id="qbankSource" style="width: 160px;" onchange="window.app.filterQuestionBank()">
            <option value="All">${isVi ? 'Tất cả Nguồn' : 'All Sources'}</option>
            <option value="Manual">${isVi ? 'Biên soạn thủ công' : 'Manual'}</option>
            <option value="AI Generated">${isVi ? 'AI Tự động tạo' : 'AI Generated'}</option>
          </select>
        </div>

        <div class="filter-right">
          <span style="font-size: 0.8rem; color: var(--text-muted);"><span id="qbankCount">${state.data.questionBank.length}</span> ${isVi ? 'câu hỏi' : 'Questions'}</span>
        </div>
      </div>

      <!-- Questions Table -->
      <div class="table-container">
        <table class="academic-table" id="questionsTable">
          <thead>
            <tr>
              <th style="width: 42%;">${isVi ? 'Nội dung Câu hỏi Vấn đáp' : 'Question Prompt'}</th>
              <th style="width: 10%;">${isVi ? 'Môn học' : 'Course'}</th>
              <th style="width: 16%;">${isVi ? 'Chủ đề' : 'Topic'}</th>
              <th style="width: 10%;">${isVi ? 'Độ khó' : 'Difficulty'}</th>
              <th style="width: 12%;">${isVi ? 'Nguồn gốc' : 'Source'}</th>
              <th style="width: 10%; text-align: right;">${t('actions')}</th>
            </tr>
          </thead>
          <tbody id="questionsTableBody">
            ${state.data.questionBank.map(q => `
              <tr data-course="${q.course}" data-diff="${q.difficulty}" data-source="${q.source}" data-text="${q.question.toLowerCase()} ${q.topic.toLowerCase()}">
                <td>
                  <!-- Note: Question prompt text remains untouched in original language as required -->
                  <strong>${q.question}</strong>
                </td>
                <td><code>${q.course}</code></td>
                <td><span style="font-size: 0.8rem; color: var(--text-secondary);">${q.topic}</span></td>
                <td>
                  <span class="status-badge" style="background: ${q.difficulty === 'Hard' ? 'var(--status-danger-bg)' : q.difficulty === 'Medium' ? 'var(--status-in-progress-bg)' : 'var(--status-completed-bg)'}; color: ${q.difficulty === 'Hard' ? 'var(--status-danger-text)' : q.difficulty === 'Medium' ? 'var(--status-in-progress-text)' : 'var(--status-completed-text)'};">
                    ${isVi ? (q.difficulty === 'Hard' ? 'Khó' : q.difficulty === 'Medium' ? 'Trung bình' : 'Dễ') : q.difficulty}
                  </span>
                </td>
                <td>
                  ${q.source === 'AI Generated' 
                    ? `<span class="badge-ai status-badge"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> ${isVi ? 'AI Tự động tạo' : 'AI Generated'}</span>` 
                    : `<span class="status-badge badge-draft">${isVi ? 'Thủ công' : 'Manual'}</span>`
                  }
                </td>
                <td style="text-align: right; white-space: nowrap;">
                  <button class="btn btn-outline btn-sm" onclick="window.app.openEditQuestionModal('${q.id}')">${t('edit')}</button>
                  <button class="btn btn-danger-outline btn-sm" onclick="window.app.deleteQuestion('${q.id}')">${t('delete')}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Screen 8: Upload Learning Materials
export function renderUploadMaterials() {
  const isVi = state.lang === 'vi';
  return `
    <div class="content-container" style="max-width: 900px;">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Tải Giáo Trình & Tài Liệu Môn Học' : 'Upload Learning Materials'}</h1>
          <p>${isVi ? 'Cung cấp bài giảng, giáo trình hoặc tài liệu nghiên cứu để AI phân tích và tổng hợp câu hỏi vấn đáp.' : 'Provide lecture notes, textbook chapters, or research papers for AI question synthesis.'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-outline btn-sm" onclick="window.app.navigate('question-bank')">${isVi ? 'Quay lại Ngân hàng Câu hỏi' : 'Back to Question Bank'}</button>
        </div>
      </div>

      <!-- Architectural Pipeline Diagram -->
      <div class="card" style="margin-bottom: 24px; background-color: var(--bg-subtle);">
        <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; letter-spacing: 0.05em;">
          ${isVi ? 'Quy Trình Tạo Câu Hỏi Vấn Đáp Bằng AI' : 'AI Question Synthesis Workflow'}
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="padding: 6px 12px; background-color: var(--primary); color: white; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.8rem;">1. ${isVi ? 'Tài liệu Học tập' : 'Learning Materials'}</div>
            <span style="color: var(--text-light);">→</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="padding: 6px 12px; background-color: var(--primary-light); color: var(--primary); border-radius: var(--radius-sm); font-weight: 600; font-size: 0.8rem;">2. ${isVi ? 'AI Phân tích' : 'AI Processing'}</div>
            <span style="color: var(--text-light);">→</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="padding: 6px 12px; background-color: var(--status-scheduled-bg); color: var(--status-scheduled-text); border-radius: var(--radius-sm); font-weight: 600; font-size: 0.8rem;">3. ${isVi ? 'Tạo Câu hỏi' : 'Generate Questions'}</div>
            <span style="color: var(--text-light);">→</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="padding: 6px 12px; background-color: var(--status-in-progress-bg); color: var(--status-in-progress-text); border-radius: var(--radius-sm); font-weight: 600; font-size: 0.8rem;">4. ${isVi ? 'Giảng viên Duyệt' : 'Lecturer Review'}</div>
            <span style="color: var(--text-light);">→</span>
          </div>
          <div>
            <div style="padding: 6px 12px; background-color: var(--status-completed-bg); color: var(--status-completed-text); border-radius: var(--radius-sm); font-weight: 600; font-size: 0.8rem;">5. ${isVi ? 'Thêm vào Ngân hàng' : 'Approve to Bank'}</div>
          </div>
        </div>
      </div>

      <!-- Upload Form -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="form-group" style="max-width: 400px; margin-bottom: 20px;">
          <label class="form-label form-label-required">${isVi ? 'Chọn Môn học' : 'Select Course'}</label>
          <select class="form-select" id="uploadCourseSelect">
            ${state.data.courses.map(c => `<option value="${c.code}">${c.code} – ${c.name}</option>`).join('')}
          </select>
        </div>

        <div style="border: 2px dashed var(--border-medium); border-radius: var(--radius-lg); padding: 36px 20px; text-align: center; background-color: var(--bg-subtle); cursor: pointer;" onclick="window.app.simulateFileUpload()">
          <div style="width: 48px; height: 48px; border-radius: 50%; background-color: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto;">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <strong style="font-size: 0.95rem; color: var(--text-primary);">${isVi ? 'Nhấp hoặc Kéo thả File Tài liệu vào đây' : 'Click or Drag Academic Files Here'}</strong>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${isVi ? 'Hỗ trợ file PDF, DOCX, TXT, Slide bài giảng (Tối đa 50MB)' : 'Supports PDF, DOCX, TXT, Markdown lecture notes (Up to 50MB)'}</p>
          <button class="btn btn-secondary btn-sm" style="margin-top: 14px;">${isVi ? 'Chọn file từ máy tính' : 'Browse Local Files'}</button>
        </div>
      </div>

      <!-- File Repository List -->
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">${isVi ? 'Danh Sách Tài Liệu Học Phần Đã Tải Lên' : 'Course Learning Materials Repository'}</h2>
            <div class="card-subtitle">${isVi ? 'Tài liệu đã được hệ thống phân tích hoặc đang chờ tạo câu hỏi' : 'Materials processed or queued for question generation'}</div>
          </div>
        </div>

        <div class="table-container">
          <table class="academic-table">
            <thead>
              <tr>
                <th>${isVi ? 'Tên Tài liệu' : 'Document Name'}</th>
                <th>${isVi ? 'Môn học' : 'Course'}</th>
                <th>${isVi ? 'Dung lượng' : 'File Size'}</th>
                <th>${isVi ? 'Ngày tải lên' : 'Upload Date'}</th>
                <th>${isVi ? 'Trạng thái Xử lý' : 'Processing State'}</th>
                <th style="text-align: right;">${t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${state.data.learningMaterials.map(mat => `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color: #dc2626;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <strong>${mat.title}</strong>
                    </div>
                  </td>
                  <td><code>${mat.course}</code></td>
                  <td>${mat.size}</td>
                  <td>${mat.uploadDate}</td>
                  <td>
                    ${mat.status === 'Questions Generated' 
                      ? `<span class="status-badge badge-completed">${isVi ? 'Đã tạo câu hỏi' : 'Questions Generated'}</span>`
                      : `<span class="status-badge badge-in-progress">${isVi ? 'AI đang phân tích...' : 'AI Processing...'}</span>`
                    }
                  </td>
                  <td style="text-align: right;">
                    <button class="btn btn-ai btn-sm" onclick="window.app.navigate('ai-question-generation')">${isVi ? 'Tạo Câu hỏi' : 'Generate Questions'}</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// Screen 9: AI Question Generation & Review
export function renderAIQuestionGeneration() {
  const uploadState = state.uploadState;
  const isVi = state.lang === 'vi';

  return `
    <div class="content-container">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Tạo & Duyệt Câu Hỏi Bằng AI' : 'AI Question Generation & Review'}</h1>
          <p>${isVi ? 'Cấu hình tham số, AI tự động tổng hợp câu hỏi từ tài liệu và giảng viên duyệt trước khi đưa vào ngân hàng.' : 'Configure parameters, synthesize viva prompts from source materials, and review before approval.'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-outline btn-sm" onclick="window.app.navigate('question-bank')">${isVi ? 'Ngân hàng Câu hỏi' : 'Question Bank'}</button>
        </div>
      </div>

      <div class="alert-box alert-ai">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        <div>
          <strong>${isVi ? 'Bắt buộc Giảng viên Duyệt:' : 'Human Review Mandatory:'}</strong> ${isVi ? 'AI chỉ tạo các câu hỏi dự thảo dựa trên tài liệu. Câu hỏi sẽ KHÔNG xuất hiện trong đề thi sinh viên cho đến khi bạn kiểm tra và bấm phê duyệt.' : 'AI generates draft viva questions based on the uploaded syllabus. Questions will NOT appear in student examinations until you review, edit if necessary, and explicitly approve them.'}
        </div>
      </div>

      <!-- Generation Setup Panel -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <h2 class="card-title">${isVi ? '1. Tham Số Tổng Hợp Câu Hỏi' : '1. Generation Parameters'}</h2>
        </div>
        <div class="grid-3" style="margin-bottom: 16px;">
          <div class="form-group">
            <label class="form-label form-label-required">${isVi ? 'Môn học' : 'Course'}</label>
            <select class="form-select" id="genCourse">
              ${state.data.courses.map(c => `<option value="${c.code}">${c.code} – ${c.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label form-label-required">${isVi ? 'Tài liệu Nguồn' : 'Source Materials'}</label>
            <select class="form-select" id="genMaterials">
              <option>Chapter 06 - Distributed Consensus (Raft & Paxos).pdf</option>
              <option>Lecture 08 - Microservices Resilience.pdf</option>
              <option>${isVi ? 'Tất cả Tài liệu Đã tải lên' : 'All Uploaded Materials'}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label form-label-required">${isVi ? 'Chủ đề / Trọng tâm Khái niệm' : 'Topic / Conceptual Focus'}</label>
            <input type="text" class="form-input" id="genTopic" value="Leader Election & Split-Brain Prevention" placeholder="e.g. Memory Hierarchy or Raft Quorums">
          </div>

          <div class="form-group">
            <label class="form-label form-label-required">${isVi ? 'Số lượng Câu hỏi' : 'Number of Questions'}</label>
            <select class="form-select" id="genCount">
              <option value="3" selected>${isVi ? '3 Câu hỏi' : '3 Questions'}</option>
              <option value="5">${isVi ? '5 Câu hỏi' : '5 Questions'}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label form-label-required">${isVi ? 'Độ khó Mong muốn' : 'Target Difficulty'}</label>
            <select class="form-select" id="genDiff">
              <option value="Easy">${isVi ? 'Dễ (Nhận biết khái niệm)' : 'Easy (Conceptual Recall)'}</option>
              <option value="Medium">${isVi ? 'Trung bình (Vận dụng & Đánh đổi)' : 'Medium (Application & Trade-offs)'}</option>
              <option value="Hard" selected>${isVi ? 'Khó (Tổng hợp kiến trúc & Tình huống biên)' : 'Hard (Architectural Synthesis & Edge-cases)'}</option>
            </select>
          </div>

          <div class="form-group" style="justify-content: flex-end;">
            <button class="btn btn-ai btn-lg" id="btnSynthesize" style="width: 100%;" onclick="window.app.triggerAIGeneration()">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              ${t('synthesizeQuestions')}
            </button>
          </div>
        </div>
      </div>

      <!-- Generated Questions Review Stack -->
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">${isVi ? '2. Duyệt & Phê Duyệt Câu Hỏi AI Tạo' : '2. Review & Approve Generated Questions'}</h2>
            <div class="card-subtitle">${isVi ? 'Chỉnh sửa câu chữ, điều chỉnh độ khó và duyệt câu hỏi vào Ngân hàng' : 'Edit text, adjust difficulty, and approve items to publish into the Question Bank'}</div>
          </div>
          <span class="status-badge badge-pending">${uploadState.generatedQuestions.filter(q => !q.approved && !q.rejected).length} ${isVi ? 'Mục chờ duyệt' : 'Items Pending Review'}</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;" id="generatedQuestionsList">
          ${uploadState.generatedQuestions.map((q, idx) => `
            <div class="card" style="background-color: var(--bg-surface); border: 1px solid ${q.approved ? 'var(--status-completed-border)' : q.rejected ? 'var(--status-danger-border)' : 'var(--border-subtle)'};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span class="badge-ai status-badge">AI Draft Q${idx + 1}</span>
                  <span style="font-size: 0.8rem; color: var(--text-muted);">${isVi ? 'Chủ đề:' : 'Topic:'} <strong>${q.topic}</strong></span>
                  <span class="status-badge" style="background: var(--status-danger-bg); color: var(--status-danger-text);">${isVi ? (q.difficulty === 'Hard' ? 'Khó' : q.difficulty === 'Medium' ? 'Trung bình' : 'Dễ') : q.difficulty}</span>
                </div>
                ${q.approved 
                  ? `<span class="status-badge badge-completed">${isVi ? '✓ Đã duyệt vào Ngân hàng' : '✓ Approved to Bank'}</span>` 
                  : q.rejected 
                  ? `<span class="status-badge badge-draft">${isVi ? 'Đã từ chối' : 'Rejected'}</span>` 
                  : `<span class="status-badge badge-pending">${isVi ? 'Chờ duyệt' : 'Pending Review'}</span>`
                }
              </div>

              <div class="form-group">
                <!-- Question content preserved in original language -->
                <textarea class="form-textarea" id="genTextArea_${q.id}" style="font-size: 0.95rem; font-weight: 500;">${q.question}</textarea>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; flex-wrap: wrap; gap: 10px;">
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                  ${isVi ? 'Liên kết Tiêu chí Gợi ý: Hiểu biết Khái niệm (25%), Lập luận Kỹ thuật (15%)' : 'Suggested Rubric Alignment: Concept Understanding (25%), Reasoning (15%)'}
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm" onclick="window.app.saveGeneratedQuestionEdit('${q.id}')">${t('saveEdits')}</button>
                  <button class="btn btn-danger-outline btn-sm" onclick="window.app.rejectGeneratedQuestion('${q.id}')">${t('reject')}</button>
                  <button class="btn btn-primary btn-sm" onclick="window.app.approveGeneratedQuestion('${q.id}')">${t('approveToBank')}</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Screen 10: Rubrics Management
export function renderRubricManagement() {
  const isVi = state.lang === 'vi';
  return `
    <div class="content-container">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Quản Lý Tiêu Chí Rubric' : 'Rubrics Management'}</h1>
          <p>${isVi ? 'Bộ tiêu chí chấm thi vấn đáp chuẩn hóa và tỷ trọng điểm nhằm đảm bảo tính công bằng.' : 'Standardized viva voce scoring criteria and weight distributions ensuring human grading consistency.'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="window.app.openCreateRubricModal()">${isVi ? '+ Tạo Bộ Rubric Mới' : '+ Create New Rubric'}</button>
        </div>
      </div>

      <div class="table-container" style="margin-bottom: 24px;">
        <table class="academic-table">
          <thead>
            <tr>
              <th>${t('rubricName')}</th>
              <th>${isVi ? 'Môn học Áp dụng' : 'Associated Course'}</th>
              <th>${isVi ? 'Số lượng Tiêu chí' : 'Criteria Count'}</th>
              <th>${isVi ? 'Cập nhật Lần cuối' : 'Last Updated'}</th>
              <th>${t('status')}</th>
              <th style="text-align: right;">${t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${state.data.rubrics.map(rub => `
              <tr>
                <td><strong>${rub.name}</strong></td>
                <td><code>${rub.course}</code></td>
                <td>${rub.criteriaCount} ${isVi ? 'tiêu chí' : 'Dimensions'}</td>
                <td>${rub.lastUpdated}</td>
                <td>${getStatusBadge(rub.status)}</td>
                <td style="text-align: right; white-space: nowrap;">
                  <button class="btn btn-secondary btn-sm" onclick="window.app.previewRubric('${rub.id}')">${isVi ? 'Xem Tiêu Chí' : 'Inspect'}</button>
                  <button class="btn btn-outline btn-sm" onclick="window.app.openEditRubricModal('${rub.id}')">${isVi ? 'Sửa' : 'Edit'}</button>
                  <button class="btn btn-danger-outline btn-sm" onclick="window.app.deleteRubric('${rub.id}')">${t('delete')}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Preview of Selected Criteria Dimensions -->
      ${(() => {
        const activeRub = state.data.rubrics.find(r => r.id === (state.activeRubricId || 'rub-01')) || state.data.rubrics[0];
        const totalW = activeRub.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
        return `
          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">${isVi ? 'Chi Tiết Tiêu Chí Đang Xem:' : 'Inspecting Rubric Dimensions:'} ${activeRub.name}</h2>
                <div class="card-subtitle">${activeRub.course} • ${activeRub.criteriaCount} ${isVi ? 'tiêu chí đánh giá' : 'evaluation dimensions'}</div>
              </div>
              <span class="status-badge badge-published">${isVi ? 'Tổng Trọng Số:' : 'Total Weight:'} ${totalW}%</span>
            </div>

            <div style="display: flex; flex-direction: column;">
              ${activeRub.criteria.map(crit => `
                <div class="rubric-row">
                  <div>
                    <strong>${crit.name}</strong>
                    <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 2px;">${crit.description}</div>
                  </div>
                  <div>
                    <span class="status-badge" style="background:var(--primary-light); color:var(--primary); font-weight:700;">${crit.weight}% ${t('weight')}</span>
                  </div>
                  <div style="text-align: right;">
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">${isVi ? 'Thang điểm: 0 –' : 'Scale: 0 –'} ${crit.maxScore} ${isVi ? 'điểm' : 'pts'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      })()}
    </div>
  `;
}

// Screen 11: Exam Sessions
export function renderExamSessions() {
  const isVi = state.lang === 'vi';
  return `
    <div class="content-container">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Danh Sách Phiên Thi Vấn Đáp' : 'Exam Sessions'}</h1>
          <p>${isVi ? 'Các phiên thi vấn đáp miệng đã lên lịch, đang diễn ra và đã hoàn thành.' : 'Scheduled, ongoing, and completed oral examination sessions.'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="window.app.startExamWizard()">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ${isVi ? '+ Tạo Phiên thi Mới' : 'Create Exam Session'}
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-toolbar">
        <div class="filter-left">
          <div class="search-input-wrapper">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="examSearchInput" class="form-input" placeholder="${isVi ? 'Tìm phiên thi theo tên hoặc mã môn...' : 'Search exams by title or course...'}" style="width: 260px;" oninput="window.app.filterExamSessions()">
          </div>

          <select class="form-select" id="examStatusFilter" style="width: 170px;" onchange="window.app.filterExamSessions()">
            <option value="All">${isVi ? 'Tất cả Trạng thái' : 'All Statuses'}</option>
            <option value="Draft">${t('statusDraft')}</option>
            <option value="Scheduled">${t('statusScheduled')}</option>
            <option value="Published">${t('statusPublished')}</option>
            <option value="In Progress">${t('statusInProgress')}</option>
            <option value="Completed">${t('statusCompleted')}</option>
          </select>

          <select class="form-select" id="examCourseFilter" style="width: 150px;" onchange="window.app.filterExamSessions()">
            <option value="All">${isVi ? 'Tất cả Môn học' : 'All Courses'}</option>
            ${state.data.courses.map(c => `<option value="${c.code}">${c.code}</option>`).join('')}
          </select>
        </div>

        <div class="filter-right">
          <span style="font-size: 0.8rem; color: var(--text-muted);"><span id="examSessionsCount">${state.data.examSessions.length}</span> ${isVi ? 'phiên thi' : 'Sessions'}</span>
        </div>
      </div>

      <div class="table-container">
        <table class="academic-table" id="examSessionsTable">
          <thead>
            <tr>
              <th>${isVi ? 'Tên Phiên thi' : 'Exam Name'}</th>
              <th>${isVi ? 'Môn học' : 'Course'}</th>
              <th>${isVi ? 'Giảng viên' : 'Lecturer'}</th>
              <th>${t('date')}</th>
              <th>${isVi ? 'Giờ bắt đầu' : 'Start Time'}</th>
              <th>${isVi ? 'Thí sinh' : 'Candidates'}</th>
              <th>${t('status')}</th>
              <th style="text-align: right;">${t('actions')}</th>
            </tr>
          </thead>
          <tbody id="examSessionsTableBody">
            ${state.data.examSessions.map(ex => `
              <tr data-status="${ex.status}" data-course="${ex.course}" data-query="${ex.name.toLowerCase()} ${ex.course.toLowerCase()} ${ex.lecturer.toLowerCase()}">
                <td>
                  <strong>${ex.name}</strong>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${ex.description.substring(0, 60)}...</div>
                </td>
                <td><code>${ex.course}</code></td>
                <td>${ex.lecturer}</td>
                <td>${ex.date}</td>
                <td>${ex.startTime} (${ex.duration})</td>
                <td>${ex.studentsCount} ${isVi ? 'thí sinh' : 'Students'}</td>
                <td>${getStatusBadge(ex.status)}</td>
                <td style="text-align: right; white-space: nowrap;">
                  ${ex.status === 'In Progress' 
                    ? `<button class="btn btn-primary btn-sm" onclick="window.app.navigate('live-monitoring')">🔴 ${isVi ? 'Giám sát' : 'Monitor'}</button>`
                    : ex.status === 'Completed'
                    ? `<button class="btn btn-secondary btn-sm" onclick="window.app.navigate('lecturer-results')">${isVi ? 'Bảng điểm' : 'Results'}</button>`
                    : ex.status === 'Draft'
                    ? `<button class="btn btn-primary btn-sm" onclick="window.app.publishDraftExam('${ex.id}')">${isVi ? 'Công bố' : 'Publish'}</button>`
                    : `<button class="btn btn-primary btn-sm" onclick="window.app.startExamNow('${ex.id}')">${isVi ? 'Bắt đầu' : 'Start'}</button>`
                  }
                  <button class="btn btn-outline btn-sm" onclick="window.app.navigate('exam-session-detail', { id: '${ex.id}' })">${t('viewDetails')}</button>
                  <button class="btn btn-danger-outline btn-sm" onclick="window.app.deleteExamSession('${ex.id}')">${t('delete')}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Screen 12: Create Exam Session Workflow (5-Step Wizard)
export function renderCreateExamSession() {
  const wizard = state.examWizard;
  const step = wizard.step;
  const fd = wizard.formData;
  const isVi = state.lang === 'vi';

  return `
    <div class="content-container" style="max-width: 980px;">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Tạo Phiên Thi Vấn Đáp Mới' : 'Create Exam Session'}</h1>
          <p>${isVi ? 'Quy trình thiết lập đợt thi vấn đáp miệng cho danh sách sinh viên tham gia.' : 'Configure a complete viva voce assessment session for enrolled candidates.'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="window.app.navigate('exam-sessions')">${isVi ? 'Hủy' : 'Cancel'}</button>
        </div>
      </div>

      <!-- Multi-step Stepper -->
      <div class="wizard-stepper">
        <div class="wizard-step ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}" onclick="window.app.goToWizardStep(1)">
          <div class="wizard-step-num">${step > 1 ? '✓' : '1'}</div>
          <div class="wizard-step-info">
            <span class="wizard-step-label">${isVi ? 'Thông tin chung' : 'Basic Info'}</span>
            <span class="wizard-step-sub">${isVi ? 'Học phần & Tên kỳ thi' : 'Course & Title'}</span>
          </div>
        </div>

        <div class="wizard-connector ${step > 1 ? 'completed' : ''}"></div>

        <div class="wizard-step ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}" onclick="window.app.goToWizardStep(2)">
          <div class="wizard-step-num">${step > 2 ? '✓' : '2'}</div>
          <div class="wizard-step-info">
            <span class="wizard-step-label">${isVi ? 'Thí sinh' : 'Students'}</span>
            <span class="wizard-step-sub">${isVi ? 'Chỉ định Thí sinh' : 'Assign Candidates'}</span>
          </div>
        </div>

        <div class="wizard-connector ${step > 2 ? 'completed' : ''}"></div>

        <div class="wizard-step ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}" onclick="window.app.goToWizardStep(3)">
          <div class="wizard-step-num">${step > 3 ? '✓' : '3'}</div>
          <div class="wizard-step-info">
            <span class="wizard-step-label">${isVi ? 'Lịch thi' : 'Schedule'}</span>
            <span class="wizard-step-sub">${isVi ? 'Ngày & Thời lượng' : 'Date & Duration'}</span>
          </div>
        </div>

        <div class="wizard-connector ${step > 3 ? 'completed' : ''}"></div>

        <div class="wizard-step ${step === 4 ? 'active' : step > 4 ? 'completed' : ''}" onclick="window.app.goToWizardStep(4)">
          <div class="wizard-step-num">${step > 4 ? '✓' : '4'}</div>
          <div class="wizard-step-info">
            <span class="wizard-step-label">${isVi ? 'Câu hỏi & Rubric' : 'Questions & Rubric'}</span>
            <span class="wizard-step-sub">${isVi ? 'Phạm vi Đánh giá' : 'Assessment Scope'}</span>
          </div>
        </div>

        <div class="wizard-connector ${step > 4 ? 'completed' : ''}"></div>

        <div class="wizard-step ${step === 5 ? 'active' : ''}" onclick="window.app.goToWizardStep(5)">
          <div class="wizard-step-num">5</div>
          <div class="wizard-step-info">
            <span class="wizard-step-label">${isVi ? 'Kiểm tra lại' : 'Review'}</span>
            <span class="wizard-step-sub">${isVi ? 'Xác nhận & Công bố' : 'Confirm & Publish'}</span>
          </div>
        </div>
      </div>

      <!-- Step Content Area -->
      <div class="card" style="padding: 28px;">
        ${step === 1 ? `
          <!-- Step 1: Basic Information -->
          <h2 style="margin-bottom: 20px;">${isVi ? 'Bước 1: Thông tin Chung của Kỳ thi' : 'Step 1: Exam Basic Information'}</h2>
          <div class="form-group">
            <label class="form-label form-label-required">${isVi ? 'Tên Phiên thi / Đợt thi Vấn đáp' : 'Exam Title / Session Name'}</label>
            <input type="text" class="form-input" id="wizName" value="${fd.name}">
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label form-label-required">${isVi ? 'Môn học' : 'Course'}</label>
              <select class="form-select" id="wizCourse">
                ${state.data.courses.map(c => `<option value="${c.code}" ${fd.course === c.code ? 'selected' : ''}>${c.code} – ${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">${isVi ? 'Hình thức Thi' : 'Examination Type'}</label>
              <input type="text" class="form-input" value="${isVi ? 'Thi Vấn đáp Miệng Trực tuyến (Có trợ lý AI)' : 'Oral Viva Voce (AI-Assisted)'}" readonly style="background-color: var(--bg-subtle);">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">${isVi ? 'Mô tả Phiên thi & Hướng dẫn dành cho Thí sinh' : 'Session Description / Instructions for Candidates'}</label>
            <textarea class="form-textarea" id="wizDesc">${fd.description}</textarea>
          </div>
        ` : step === 2 ? `
          <!-- Step 2: Assign Students -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2>${isVi ? 'Bước 2: Chọn Thí sinh Tham gia' : 'Step 2: Select Enrolled Candidates'}</h2>
            <span class="status-badge badge-published">${fd.selectedStudents.length} ${isVi ? 'thí sinh đã chọn' : 'Students Selected'}</span>
          </div>

          <div class="search-input-wrapper" style="margin-bottom: 14px;">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="form-input" placeholder="${isVi ? 'Tìm thí sinh theo tên hoặc MSSV...' : 'Search students by name or ID...'}">
          </div>

          <div class="table-container" style="max-height: 280px; overflow-y: auto;">
            <table class="academic-table">
              <thead>
                <tr>
                  <th style="width: 40px;">${isVi ? 'Chọn' : 'Select'}</th>
                  <th>${isVi ? 'Họ và Tên Sinh viên' : 'Student Name'}</th>
                  <th>${isVi ? 'Mã số Sinh viên' : 'Student ID'}</th>
                  <th>${isVi ? 'Chuyên ngành' : 'Program / Year'}</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.users.filter(u => u.role === 'Student').map(std => `
                  <tr>
                    <td>
                      <input type="checkbox" ${fd.selectedStudents.includes(std.id) ? 'checked' : ''} onchange="window.app.toggleWizardStudent('${std.id}')">
                    </td>
                    <td><strong>${std.name}</strong></td>
                    <td><code>${std.id}</code></td>
                    <td>${std.department}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : step === 3 ? `
          <!-- Step 3: Schedule -->
          <h2 style="margin-bottom: 20px;">${isVi ? 'Bước 3: Lên Lịch Thi & Khung Giờ' : 'Step 3: Examination Schedule & Time Slot'}</h2>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label form-label-required">${t('date')}</label>
              <input type="date" class="form-input" id="wizDate" value="${fd.date}">
            </div>
            <div class="form-group">
              <label class="form-label form-label-required">${isVi ? 'Giờ bắt đầu' : 'Start Time'}</label>
              <input type="text" class="form-input" id="wizTime" value="${fd.startTime}">
            </div>
            <div class="form-group">
              <label class="form-label form-label-required">${isVi ? 'Thời lượng mỗi thí sinh' : 'Candidate Duration'}</label>
              <select class="form-select" id="wizDuration">
                <option value="10 mins">${isVi ? '10 phút / thí sinh' : '10 mins per candidate'}</option>
                <option value="15 mins" selected>${isVi ? '15 phút / thí sinh' : '15 mins per candidate'}</option>
                <option value="20 mins">${isVi ? '20 phút / thí sinh' : '20 mins per candidate'}</option>
                <option value="30 mins">${isVi ? '30 phút / thí sinh' : '30 mins per candidate'}</option>
              </select>
            </div>
          </div>

          <div class="alert-box alert-info" style="margin-top: 10px;">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <div>
              <strong>${isVi ? 'Điều phối thi:' : 'Candidate Pacing:'}</strong> ${isVi ? 'Sinh viên vào phòng thi tuần tự theo lịch đã phân bổ. Bước kiểm tra micro/tai nghe diễn ra 2 phút trước khi ca thi chính thức bắt đầu.' : 'Students enter the examination room sequentially or according to allocated appointment slots. Pre-exam hardware diagnostic takes 2 minutes prior to session start.'}
            </div>
          </div>
        ` : step === 4 ? `
          <!-- Step 4: Questions & Rubric -->
          <h2 style="margin-bottom: 20px;">${isVi ? 'Bước 4: Chọn Bộ Câu Hỏi & Gán Rubric' : 'Step 4: Configure Questions & Assign Rubric'}</h2>

          <div class="form-group" style="margin-bottom: 20px;">
            <label class="form-label form-label-required">${isVi ? 'Chọn Bộ Tiêu chí Đánh giá Rubric' : 'Assign Evaluation Rubric'}</label>
            <select class="form-select" id="wizRubric">
              ${state.data.rubrics.map(r => `
                <option value="${r.id}" ${fd.rubricId === r.id ? 'selected' : ''}>${r.name} (${r.criteriaCount} ${isVi ? 'tiêu chí' : 'dimensions'})</option>
              `).join('')}
            </select>
          </div>

          <label class="form-label form-label-required" style="margin-bottom: 8px;">${isVi ? 'Chọn Câu hỏi từ Ngân hàng (Chọn tối thiểu 2 câu)' : 'Select Questions from Bank (Choose at least 2)'}</label>
          <div class="table-container" style="max-height: 240px; overflow-y: auto;">
            <table class="academic-table">
              <thead>
                <tr>
                  <th style="width: 40px;">${isVi ? 'Chọn' : 'Select'}</th>
                  <th>${isVi ? 'Nội dung Câu hỏi' : 'Question Prompt'}</th>
                  <th>${isVi ? 'Chủ đề' : 'Topic'}</th>
                  <th>${isVi ? 'Độ khó' : 'Difficulty'}</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.questionBank.map(q => `
                  <tr>
                    <td>
                      <input type="checkbox" ${fd.selectedQuestions.includes(q.id) ? 'checked' : ''} onchange="window.app.toggleWizardQuestion('${q.id}')">
                    </td>
                    <td><strong>${q.question}</strong></td>
                    <td>${q.topic}</td>
                    <td><span class="status-badge" style="background:var(--status-danger-bg); color:var(--status-danger-text);">${isVi ? (q.difficulty === 'Hard' ? 'Khó' : q.difficulty === 'Medium' ? 'Trung bình' : 'Dễ') : q.difficulty}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <!-- Step 5: Review & Confirmation -->
          <h2 style="margin-bottom: 16px;">${isVi ? 'Bước 5: Kiểm tra & Công bố Phiên thi' : 'Step 5: Review & Publish Exam Session'}</h2>
          <div class="alert-box alert-success" style="margin-bottom: 20px;">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <div>
              <strong>${isVi ? 'Sẵn sàng Công bố:' : 'Ready to Publish:'}</strong> ${isVi ? 'Sau khi công bố, thông báo sẽ được gửi tới cổng thông tin của các thí sinh và ghi nhận vào thời khóa biểu khảo thí chính thức.' : 'Once published, notifications are dispatched to enrolled student portals and the session is logged into the official examination timetable.'}
            </div>
          </div>

          <div style="background-color: var(--bg-subtle); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">${isVi ? 'Tên Phiên thi:' : 'Exam Session Name:'}</span>
              <strong>${fd.name}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">${isVi ? 'Học phần:' : 'Course:'}</span>
              <strong>${fd.course} – Software Architecture</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">${isVi ? 'Thí sinh Tham gia:' : 'Enrolled Candidates:'}</span>
              <strong>${fd.selectedStudents.length} ${isVi ? 'sinh viên' : 'Students Assigned'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">${isVi ? 'Ngày & Khung giờ:' : 'Date & Time:'}</span>
              <strong>${fd.date} lúc ${fd.startTime} (${fd.duration})</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">${isVi ? 'Bộ câu hỏi đã chọn:' : 'Questions Assigned:'}</span>
              <strong>${fd.selectedQuestions.length} ${isVi ? 'câu hỏi' : 'Questions Configured'}</strong>
            </div>
          </div>
        `}

        <!-- Stepper Navigation Footer Buttons -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 28px; padding-top: 18px; border-top: 1px solid var(--border-subtle);">
          <div>
            ${step > 1 ? `
              <button class="btn btn-secondary" onclick="window.app.goToWizardStep(${step - 1})">
                ${isVi ? '← Quay lại' : '← Previous Step'}
              </button>
            ` : ''}
          </div>

          <div style="display: flex; gap: 10px;">
            ${step < 5 ? `
              <button class="btn btn-secondary" onclick="window.app.saveExamDraft()">${isVi ? 'Lưu Bản nháp' : 'Save as Draft'}</button>
              <button class="btn btn-primary" onclick="window.app.goToWizardStep(${step + 1})">
                ${isVi ? 'Tiếp tục Bước tiếp theo →' : 'Continue to Next Step →'}
              </button>
            ` : `
              <button class="btn btn-secondary" onclick="window.app.saveExamDraft()">${isVi ? 'Lưu Bản nháp' : 'Save as Draft'}</button>
              <button class="btn btn-primary btn-lg" onclick="window.app.publishExamSession()">
                ${isVi ? '✓ Công bố Phiên thi' : '✓ Publish Exam Session'}
              </button>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Screen 13: Exam Session Detail (Interactive Tabs)
export function renderExamSessionDetail(examId = state.activeExamDetailId) {
  const exam = state.data.examSessions.find(e => e.id === examId) || state.data.examSessions[0];
  const tab = state.detailActiveTab || 'overview';
  const isVi = state.lang === 'vi';

  return `
    <div class="content-container">
      <div class="page-header">
        <div class="page-title-group">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
            <h1>${exam.name}</h1>
            ${getStatusBadge(exam.status)}
          </div>
          <p>${exam.course} • ${isVi ? 'Giám khảo Hội đồng:' : 'Presiding Examiner:'} ${exam.lecturer} • ${isVi ? 'Ngày thi:' : 'Scheduled for'} ${exam.date} lúc ${exam.startTime}</p>
        </div>
        <div class="page-actions">
          ${exam.status === 'In Progress' ? `
            <button class="btn btn-primary" onclick="window.app.navigate('live-monitoring')">🔴 ${isVi ? 'Mở Màn hình Giám sát' : 'Open Live Monitor'}</button>
          ` : ''}
          <button class="btn btn-outline" onclick="window.app.navigate('exam-sessions')">${isVi ? 'Tất cả Phiên thi' : 'All Sessions'}</button>
        </div>
      </div>

      <!-- Detail Tabs Bar -->
      <div class="tabs-bar">
        <button class="tab-btn ${tab === 'overview' ? 'active' : ''}" onclick="window.app.switchDetailTab('overview')">${isVi ? 'Tổng quan' : 'Overview'}</button>
        <button class="tab-btn ${tab === 'students' ? 'active' : ''}" onclick="window.app.switchDetailTab('students')">${isVi ? 'Danh sách Thí sinh' : 'Enrolled Students'} <span class="tab-badge">${exam.studentsCount}</span></button>
        <button class="tab-btn ${tab === 'questions' ? 'active' : ''}" onclick="window.app.switchDetailTab('questions')">${isVi ? 'Bộ Câu hỏi Thi' : 'Configured Questions'} <span class="tab-badge">3</span></button>
        <button class="tab-btn ${tab === 'monitoring' ? 'active' : ''}" onclick="window.app.navigate('live-monitoring')">${isVi ? 'Giám sát Trực tiếp' : 'Live Monitoring'}</button>
        <button class="tab-btn ${tab === 'results' ? 'active' : ''}" onclick="window.app.navigate('lecturer-results')">${isVi ? 'Kết quả Điểm' : 'Final Results'}</button>
      </div>

      <!-- Tab Content Area -->
      ${tab === 'overview' ? `
        <div class="grid-2-1">
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div class="card">
              <h3 style="margin-bottom: 12px;">${isVi ? 'Mô tả & Hướng dẫn Phiên thi' : 'Session Description'}</h3>
              <p style="line-height: 1.6;">${exam.description}</p>
              <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border-subtle); display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 0.85rem;">
                <div><span style="color: var(--text-muted);">${isVi ? 'Thời lượng:' : 'Duration:'}</span> <strong>${exam.duration}</strong></div>
                <div><span style="color: var(--text-muted);">${isVi ? 'Bộ Rubric áp dụng:' : 'Assigned Rubric:'}</span> <strong>Standard Engineering Viva (5 Criteria)</strong></div>
                <div><span style="color: var(--text-muted);">${isVi ? 'Ngôn ngữ giọng nói:' : 'Speech Recognition:'}</span> <strong>English (Academic Vocabulary)</strong></div>
                <div><span style="color: var(--text-muted);">${isVi ? 'Câu hỏi phụ AI:' : 'AI Follow-Up:'}</span> <strong>${isVi ? 'Bật (Tối đa 1 câu phụ)' : 'Enabled (Max 1 Follow-up per Q)'}</strong></div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3 class="card-title">${isVi ? 'Danh Sách Câu Hỏi Đã Cấu Hình' : 'Configured Examination Questions'}</h3>
              </div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="padding: 10px 14px; background: var(--bg-subtle); border-radius: var(--radius-md); border-left: 3px solid var(--primary);">
                  <strong>Q1: Raft Consensus Algorithm & Leader Election Safety</strong>
                  <div style="font-size: 0.775rem; color: var(--text-muted);">${isVi ? 'Độ khó: Khó • Nguồn: Thủ công' : 'Difficulty: Hard • Source: Manual'}</div>
                </div>
                <div style="padding: 10px 14px; background: var(--bg-subtle); border-radius: var(--radius-md); border-left: 3px solid var(--primary);">
                  <strong>Q2: Microservice Resilience via Circuit Breaking Patterns</strong>
                  <div style="font-size: 0.775rem; color: var(--text-muted);">${isVi ? 'Độ khó: Trung bình • Nguồn: AI Tự động tạo' : 'Difficulty: Medium • Source: AI Generated'}</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div class="card">
              <h3 style="margin-bottom: 14px;">${isVi ? 'Mức Độ Sẵn Sàng của Thí Sinh' : 'Candidate Readiness'}</h3>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                  <span style="color: var(--text-muted);">${isVi ? 'Tổng số Thí sinh:' : 'Total Candidates:'}</span>
                  <strong>${exam.studentsCount}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                  <span style="color: var(--text-muted);">${isVi ? 'Đã kiểm tra thiết bị đạt:' : 'Pre-check Passed:'}</span>
                  <strong style="color: var(--status-completed-text);">22 / 24</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                  <span style="color: var(--text-muted);">${isVi ? 'Thời gian thi trung bình:' : 'Average Oral Duration:'}</span>
                  <strong>13.4 ${t('minutes')}</strong>
                </div>
              </div>
              <button class="btn btn-primary" style="width: 100%; margin-top: 20px;" onclick="window.app.navigate('live-monitoring')">
                ${isVi ? 'Vào Bảng Giám Sát Trực Tiếp' : 'Enter Live Monitoring Console'}
              </button>
            </div>
          </div>
        </div>
      ` : tab === 'students' ? `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">${isVi ? 'Danh Sách Thí Sinh Tham Gia' : 'Enrolled Candidates for'} ${exam.name}</h3>
          </div>
          <div class="table-container">
            <table class="academic-table">
              <thead>
                <tr>
                  <th>${isVi ? 'Họ và Tên' : 'Student Name'}</th>
                  <th>${isVi ? 'MSSV' : 'Student ID'}</th>
                  <th>${t('status')}</th>
                  <th>${isVi ? 'Tiến độ' : 'Progress'}</th>
                  <th>${isVi ? 'Điểm thi' : 'Score Status'}</th>
                  <th style="text-align: right;">${t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.liveMonitoringStudents.map(s => `
                  <tr>
                    <td><strong>${s.name}</strong></td>
                    <td><code>${s.studentId}</code></td>
                    <td>${getStatusBadge(s.status)}</td>
                    <td>${s.progress}</td>
                    <td>
                      ${s.status === 'Completed' ? `<span class="status-badge badge-pending">${t('statusPendingReview')}</span>` : `<span style="color: var(--text-muted);">${t('statusInProgress')}</span>`}
                    </td>
                    <td style="text-align: right;">
                      ${s.status === 'Completed' ? `<button class="btn btn-secondary btn-sm" onclick="window.app.navigate('transcript-review', { studentId: '${s.id}' })">${isVi ? 'Xem Bài' : 'Review'}</button>` : `<button class="btn btn-outline btn-sm" onclick="window.app.navigate('live-monitoring')">${isVi ? 'Giám sát' : 'Monitor'}</button>`}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">${isVi ? 'Các Câu Hỏi Vấn Đáp Đã Được Chọn' : 'Configured Examination Questions'}</h3>
          </div>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${state.data.questionBank.slice(0, 3).map((q, i) => `
              <div style="padding: 14px; background: var(--bg-subtle); border-radius: var(--radius-md); border-left: 4px solid var(--primary);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span class="status-badge badge-published">${t('question')} ${i + 1}</span>
                  <span class="status-badge" style="background: var(--status-danger-bg); color: var(--status-danger-text);">${isVi ? (q.difficulty === 'Hard' ? 'Khó' : q.difficulty === 'Medium' ? 'Trung bình' : 'Dễ') : q.difficulty}</span>
                </div>
                <!-- Question content preserved -->
                <div style="font-weight: 600; font-size: 0.95rem;">${q.question}</div>
                <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 4px;">${isVi ? 'Chủ đề:' : 'Topic:'} ${q.topic} • ${isVi ? 'Nguồn:' : 'Source:'} ${isVi ? (q.source === 'AI Generated' ? 'AI Tự động tạo' : 'Thủ công') : q.source}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `}
    </div>
  `;
}

// Screen 14: Lecturer Live Exam Monitoring
export function renderLiveExamMonitoring() {
  const students = state.data.liveMonitoringStudents;
  const inProgressCount = students.filter(s => s.status === 'In Progress').length;
  const completedCount = students.filter(s => s.status === 'Completed').length;
  const waitingCount = students.filter(s => s.status === 'Waiting').length;
  const isVi = state.lang === 'vi';

  return `
    <div class="content-container">
      <div class="page-header">
        <div class="page-title-group">
          <div style="display: flex; align-items: center; gap: 10px;">
            <h1>${isVi ? 'Giám Sát Phòng Thi Trực Tiếp' : 'Exam Monitoring'}</h1>
            <span class="status-badge badge-in-progress">${isVi ? 'Phiên Thi Đang Diễn Ra' : 'Live Examination Session'}</span>
          </div>
          <p>SWD392 Oral Viva: Distributed Consistency & Clean Architecture • ${isVi ? 'Theo dõi tín hiệu âm thanh và luồng làm bài của thí sinh theo thời gian thực.' : 'Monitoring active candidate streams.'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="window.app.navigate('exam-session-detail')">${isVi ? 'Chi tiết Phiên thi' : 'Session Details'}</button>
        </div>
      </div>

      <!-- Live Telemetry Summary -->
      <div class="grid-4" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${isVi ? 'Tổng số Thí sinh' : 'Total Candidates'}</span>
            <span class="stat-value">${students.length}</span>
          </div>
          <div class="stat-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${isVi ? 'Đang thi Vấn đáp' : 'Currently In Oral Viva'}</span>
            <span class="stat-value" style="color: #d97706;">${inProgressCount}</span>
          </div>
          <div class="stat-icon" style="background-color: var(--status-in-progress-bg); color: var(--status-in-progress-text);">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${isVi ? 'Chờ đến lượt' : 'Waiting in Queue'}</span>
            <span class="stat-value" style="color: var(--text-muted);">${waitingCount}</span>
          </div>
          <div class="stat-icon" style="background-color: var(--bg-subtle); color: var(--text-muted);">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${isVi ? 'Đã hoàn thành thi' : 'Vivas Completed'}</span>
            <span class="stat-value" style="color: var(--status-completed-text);">${completedCount}</span>
          </div>
          <div class="stat-icon" style="background-color: var(--status-completed-bg); color: var(--status-completed-text);">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>
      </div>

      <!-- Live Student Monitoring Table -->
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">${isVi ? 'Danh Sách Hoạt Động Của Thí Sinh' : 'Live Candidate Activity'}</h2>
            <div class="card-subtitle">${isVi ? 'Trạng thái thi thời gian thực, thời lượng đã qua và kết nối âm thanh' : 'Real-time oral examination status, elapsed duration, and audio connection health'}</div>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block;"></span>
            ${isVi ? 'Tự động làm mới' : 'Auto-refresh active'}
          </span>
        </div>

        <div class="table-container">
          <table class="academic-table">
            <thead>
              <tr>
                <th>${isVi ? 'Thí sinh' : 'Candidate'}</th>
                <th>${isVi ? 'Mã sinh viên' : 'Student ID'}</th>
                <th>${isVi ? 'Trạng thái thi' : 'Exam Status'}</th>
                <th>${isVi ? 'Câu hỏi hiện tại' : 'Current Question'}</th>
                <th>${isVi ? 'Tiến độ' : 'Progress'}</th>
                <th>${isVi ? 'Thời gian' : 'Elapsed Duration'}</th>
                <th>${isVi ? 'Tín hiệu âm thanh' : 'Audio Stream'}</th>
                <th style="text-align: right;">${t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="user-avatar" style="width: 28px; height: 28px; font-size: 0.7rem;">
                        ${s.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <strong>${s.name}</strong>
                    </div>
                  </td>
                  <td><code>${s.studentId}</code></td>
                  <td>${getStatusBadge(s.status)}</td>
                  <td><span style="font-weight: 600;">${s.currentQuestion}</span></td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <div style="width: 60px; height: 6px; background-color: var(--border-subtle); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${s.progress}; height: 100%; background-color: var(--primary);"></div>
                      </div>
                      <span style="font-size: 0.75rem; color: var(--text-muted);">${s.progress}</span>
                    </div>
                  </td>
                  <td><code>${s.duration}</code></td>
                  <td><span style="font-size: 0.775rem; color: var(--status-completed-text);">● ${s.connection}</span></td>
                  <td style="text-align: right; white-space: nowrap;">
                    ${s.status === 'Completed' 
                      ? `<button class="btn btn-secondary btn-sm" onclick="window.app.navigate('transcript-review', { studentId: '${s.id}' })">${isVi ? 'Xem Bài' : 'Review Transcript'}</button>`
                      : `<button class="btn btn-outline btn-sm" onclick="window.app.openLiveStreamModal('${s.name}', '${s.currentQuestion}', '${s.duration}')">${isVi ? 'Theo dõi Trực tiếp' : 'View Live Status'}</button>`
                    }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
