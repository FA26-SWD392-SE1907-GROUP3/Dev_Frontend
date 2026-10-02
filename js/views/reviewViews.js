// Review & Results Views: Screens 21 - 24
import { state } from '../state.js';
import { getStatusBadge } from './adminViews.js';
import { t } from '../i18n.js';

// Screen 21: Lecturer Transcript Review
export function renderTranscriptReview(studentId = 'std-101') {
  const trans = state.data.detailedTranscripts[studentId] || state.data.detailedTranscripts['std-101'];
  const isVi = state.lang === 'vi';

  return `
    <div class="content-container">
      <div class="page-header">
        <div class="page-title-group">
          <div style="display: flex; align-items: center; gap: 10px;">
            <h1>${isVi ? 'Xem Bản Ghi Âm & Lời Nói Thí Sinh' : 'Exam Transcript Review'}</h1>
            ${getStatusBadge(trans.status)}
          </div>
          <p>${trans.examName} • ${isVi ? 'Thí sinh:' : 'Candidate:'} <strong>${trans.studentName}</strong> (<code>${trans.studentId}</code>) • ${isVi ? 'Thời gian thi:' : 'Elapsed Viva:'} ${trans.duration}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="window.app.navigate('exam-sessions')">${isVi ? 'Phiên thi' : 'Exam Sessions'}</button>
          <button class="btn btn-primary" onclick="window.app.navigate('ai-scoring', { studentId: '${studentId}' })">
            ${t('proceedScoring')}
          </button>
        </div>
      </div>

      <!-- Human in the loop guidance alert -->
      <div class="alert-box alert-ai">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        <div>
          <strong>${isVi ? 'Khuyến nghị & Phân tích từ AI:' : 'AI Advisory Analysis:'}</strong> ${isVi ? 'Mọi bản chuyển lời nói thành văn bản, phân tích thuật ngữ và điểm gợi ý dưới đây chỉ mang tính chất tham khảo. Giảng viên hội đồng giữ toàn quyền chuyên môn trong việc kiểm chứng câu trả lời và chốt điểm chính thức.' : 'All automated speech transcripts, diagnostic analyses, and score benchmarks below are AI-generated suggestions. As presiding lecturer, you retain complete authority to verify spoken accuracy and calibrate final marks.'}
        </div>
      </div>

      <!-- Question by Question Transcript Cards -->
      <div style="display: flex; flex-direction: column; gap: 24px;">
        ${trans.items ? trans.items.map(item => `
          <div class="transcript-card">
            <!-- Question Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
              <div>
                <span class="status-badge badge-published" style="margin-bottom: 4px;">${t('question')} ${item.index}</span>
                <!-- Preserved question text in original language -->
                <h3 style="font-size: 1.05rem; font-weight: 600; color: var(--text-primary); margin-top: 4px;">${item.question}</h3>
              </div>
              <div>
                <span class="ai-suggestion-badge">${t('aiSuggested')}: ${item.aiSuggestedScore}</span>
              </div>
            </div>

            <!-- Student Spoken Answer (STT Transcript) -->
            <div class="transcript-section-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
              ${isVi ? 'Câu trả lời giọng nói sinh viên (Bản ghi STT)' : 'Student Voice Answer (Speech-to-Text Transcript)'}
            </div>
            <div class="transcript-bubble">
              “${item.studentAnswer}”
            </div>

            <!-- AI Linguistic & Concept Analysis -->
            <div class="ai-eval-box">
              <div class="transcript-section-label" style="color: #6d28d9;">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                ${isVi ? 'Phân tích Khái niệm & Tiêu chí Rubric từ AI' : 'AI Concept & Rubric Analysis'}
              </div>
              <div style="font-size: 0.85rem; color: #4c1d95; line-height: 1.5;">
                ${item.aiAnalysis}
              </div>
            </div>

            <!-- Follow-up Question Block if triggered -->
            ${item.followupTriggered ? `
              <div style="margin-top: 18px; padding-top: 16px; border-top: 1px dashed var(--border-medium);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span class="status-badge" style="background:#fef3c7; color:#b45309; font-weight:700;">${isVi ? 'Câu hỏi Phụ từ Giám khảo AI' : 'AI Follow-Up Question'}</span>
                  <!-- Preserved follow-up question text in original language -->
                  <strong style="font-size: 0.95rem; color: var(--text-primary);">${item.followupQuestion}</strong>
                </div>

                <div class="transcript-section-label" style="margin-top: 12px;">
                  ${isVi ? 'Câu trả lời vấn đáp bổ sung của thí sinh' : 'Student Follow-up Voice Response'}
                </div>
                <div class="transcript-bubble" style="background-color: #faf5ff;">
                  “${item.followupStudentAnswer}”
                </div>

                <div class="ai-eval-box" style="background-color: #fdf4ff; border-color: #f0abfc;">
                  <div class="transcript-section-label" style="color: #86198f;">
                    ${isVi ? 'Đánh giá Câu hỏi Phụ từ AI' : 'AI Follow-Up Evaluation'}
                  </div>
                  <div style="font-size: 0.85rem; color: #701a75; line-height: 1.5;">
                    ${item.followupAiAnalysis}
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        `).join('') : `
          <div class="card">
            <p>${isVi ? 'Hồ sơ bản ghi âm đã hoàn thành và được lưu trữ.' : 'Transcript record completed and indexed.'}</p>
          </div>
        `}
      </div>

      <div style="margin-top: 24px; text-align: right;">
        <button class="btn btn-primary btn-lg" onclick="window.app.navigate('ai-scoring', { studentId: '${studentId}' })">
          ${isVi ? 'Chuyển sang Bảng chấm điểm & Phê duyệt →' : 'Proceed to Scoring Matrix & Finalization →'}
        </button>
      </div>
    </div>
  `;
}

// Screen 22: Human-in-the-Loop AI-Assisted Scoring
export function renderAIScoring(studentId = 'std-101') {
  const trans = state.data.detailedTranscripts[studentId] || state.data.detailedTranscripts['std-101'];
  const rubric = state.data.rubrics[0];
  const calculatedFinal = state.calculateLecturerFinalScore();

  return `
    <div class="content-container" style="max-width: 960px;">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Bảng Chấm Điểm & Phê Duyệt Chuyên Môn (Human-in-the-Loop)' : 'Human-in-the-Loop Scoring Console'}</h1>
          <p>${isVi ? 'Thí sinh:' : 'Candidate:'} <strong>${trans.studentName}</strong> (<code>${trans.studentId}</code>) • ${trans.course}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="window.app.navigate('transcript-review', { studentId: '${studentId}' })">${isVi ? 'Xem Lại Bản Ghi Âm' : 'Review Transcript'}</button>
        </div>
      </div>

      <!-- Core Principle: AI Suggestion != Final Score Comparison Banner -->
      <div class="score-comparison-banner">
        <div class="score-box ai-suggested">
          <span class="score-box-label">
            <span class="ai-suggestion-badge">${t('aiSuggestedScore')}</span>
          </span>
          <div class="score-box-num">${trans.aiSuggestedTotal} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 500;">/ 10</span></div>
          <span style="font-size: 0.725rem; color: var(--text-muted);">${isVi ? 'Điểm tham khảo không có giá trị quyết định' : 'Non-authoritative benchmark'}</span>
        </div>

        <div style="font-size: 1.5rem; color: var(--border-medium); font-weight: 300;">≠</div>

        <div class="score-box final-lecturer" style="text-align: right;">
          <span class="score-box-label" style="color: var(--primary);">${t('lecturerFinalScore')}</span>
          <div class="score-box-num" id="liveCalculatedScore">
            ${trans.status === 'Finalized' ? trans.lecturerFinalTotal : calculatedFinal} 
            <span style="font-size: 1rem; color: var(--text-muted); font-weight: 500;">/ 10</span>
          </div>
          <span style="font-size: 0.725rem; color: var(--status-completed-text); font-weight: 600;">
            ${trans.status === 'Finalized' ? (isVi ? '✓ Đã chốt điểm chính thức' : '✓ Officially Finalized') : (isVi ? 'Tự động tính theo trọng số Rubric bên dưới' : 'Calibrated via Rubric Below')}
          </span>
        </div>
      </div>

      <!-- Rubric Criteria Calibration Matrix -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <div>
            <h2 class="card-title">${isVi ? 'Các Tiêu Chí Rubric & Hiệu Chỉnh Của Giảng Viên' : 'Rubric Dimensions & Lecturer Adjustments'}</h2>
            <div class="card-subtitle">${isVi ? 'Kéo thanh trượt hoặc nhập điểm theo đánh giá chuyên môn của bạn' : 'Adjust criteria marks based on your evaluation of candidate oral fluency and technical accuracy'}</div>
          </div>
          <span class="status-badge badge-published">${isVi ? 'Bộ Rubric Khảo Thí Chuẩn Kỹ Thuật' : 'Standard Engineering Viva Rubric'}</span>
        </div>

        <div style="display: flex; flex-direction: column;">
          ${rubric.criteria.map(crit => {
            const currentVal = state.scoringState.scores[crit.id] || 8.0;
            return `
              <div class="rubric-row" style="padding: 16px 0; border-bottom: 1px solid var(--border-subtle);">
                <div>
                  <strong style="font-size: 0.95rem; color: var(--text-primary);">${crit.name}</strong>
                  <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 2px;">
                    ${crit.description}
                  </div>
                </div>

                <div>
                  <span class="status-badge" style="background: #f1f5f9; color: #334155; font-weight: 600;">
                    ${t('weight')}: ${crit.weight}%
                  </span>
                </div>

                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 12px;">
                  <input type="range" min="0" max="10" step="0.5" value="${currentVal}" 
                    style="width: 110px; accent-color: var(--primary);"
                    oninput="window.app.updateCriterionScore('${crit.id}', this.value)">
                  <input type="number" min="0" max="10" step="0.5" value="${currentVal}" id="critInput_${crit.id}"
                    class="form-input" style="width: 65px; text-align: center; font-weight: 700; padding: 4px;"
                    onchange="window.app.updateCriterionScore('${crit.id}', this.value)">
                  <span style="font-size: 0.8rem; color: var(--text-muted);">/ 10</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Lecturer Comments & Feedback -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <h2 class="card-title">${isVi ? 'Nhận Xét Đánh Giá & Góp Ý Của Giảng Viên' : 'Official Lecturer Comments & Constructive Feedback'}</h2>
        </div>
        <div class="form-group">
          <textarea class="form-textarea" id="lecturerFeedbackText" style="min-height: 100px;" oninput="state.scoringState.comments = this.value" placeholder="${isVi ? 'Nhập nhận xét chuyên môn (sẽ hiển thị trên bảng điểm chính thức của sinh viên)...' : 'Provide qualitative feedback that will be visible on the student\'s official grade report...'}">${state.scoringState.comments}</textarea>
        </div>
      </div>

      <!-- Action Finalize Row -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button class="btn btn-secondary" onclick="window.app.navigate('transcript-review', { studentId: '${studentId}' })">
          ${isVi ? '← Quay lại Bản ghi âm' : '← Back to Transcript'}
        </button>

        <button class="btn btn-primary btn-lg" onclick="window.app.promptFinalizeScoreModal('${studentId}')" style="min-width: 220px;">
          ${trans.status === 'Finalized' ? (isVi ? 'Cập Nhật & Lưu Điểm' : 'Update & Re-save Grade') : t('finalizeScoreBtn')}
        </button>
      </div>
    </div>
  `;
}

// Screen 23: Lecturer Results
export function renderLecturerResults() {
  const isVi = state.lang === 'vi';
  return `
    <div class="content-container">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Bảng Điểm & Kết Quả Đánh Giá Vấn Đáp' : 'Assessment Results & Grade Book'}</h1>
          <p>${isVi ? 'Tổng hợp điểm thi vấn đáp, đối chiếu giữa điểm gợi ý AI và điểm chính thức do giảng viên phê duyệt.' : 'Consolidated oral viva scores, comparing AI benchmarks against finalized lecturer marks.'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="window.app.exportResultsCSV()">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            ${isVi ? 'Xuất Bảng Điểm (CSV)' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div class="filter-toolbar">
        <div class="filter-left">
          <div class="search-input-wrapper">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="resultsSearchInput" class="form-input" placeholder="${isVi ? 'Tìm thí sinh theo tên hoặc MSSV...' : 'Search student by name or ID...'}" style="width: 260px;" oninput="window.app.filterResultsTable()">
          </div>

          <select class="form-select" id="resultsStatusFilter" style="width: 170px;" onchange="window.app.filterResultsTable()">
            <option value="All">${isVi ? 'Tất cả trạng thái' : 'All Statuses'}</option>
            <option value="Finalized">${t('statusFinalized')}</option>
            <option value="Pending Review">${t('statusPendingReview')}</option>
          </select>

          <select class="form-select" id="resultsExamFilter" style="width: 170px;" onchange="window.app.filterResultsTable()">
            <option value="All">${isVi ? 'Tất cả môn học' : 'All Courses'}</option>
            ${state.data.courses.map(c => `<option value="${c.code}">${c.code}</option>`).join('')}
          </select>
        </div>

        <div class="filter-right">
          <span style="font-size: 0.8rem; color: var(--text-muted);"><span id="resultsCount">${state.data.resultsList.length}</span> ${isVi ? 'kết quả' : 'Records'}</span>
        </div>
      </div>

      <div class="table-container">
        <table class="academic-table" id="resultsTable">
          <thead>
            <tr>
              <th>${isVi ? 'Họ và tên Thí sinh' : 'Candidate Name'}</th>
              <th>${isVi ? 'Mã sinh viên' : 'Student ID'}</th>
              <th>${isVi ? 'Phiên thi' : 'Exam Session'}</th>
              <th>${isVi ? 'Điểm gợi ý AI' : 'AI Suggested Score'}</th>
              <th>${isVi ? 'Điểm chính thức GV' : 'Lecturer Final Score'}</th>
              <th>${t('status')}</th>
              <th style="text-align: right;">${t('actions')}</th>
            </tr>
          </thead>
          <tbody id="resultsTableBody">
            ${state.data.resultsList.map(res => `
              <tr data-status="${res.status}" data-course="${res.course}" data-query="${res.name.toLowerCase()} ${res.universityId.toLowerCase()}">
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="user-avatar" style="width: 28px; height: 28px; font-size: 0.7rem;">
                      ${res.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <strong>${res.name}</strong>
                  </div>
                </td>
                <td><code>${res.universityId}</code></td>
                <td><span style="font-weight: 500;">${res.exam}</span></td>
                <td><span class="ai-suggestion-badge">${res.aiSuggestedScore} / 10</span></td>
                <td>
                  ${res.finalScore !== '—' 
                    ? `<strong style="font-size: 1.05rem; color: var(--primary);">${res.finalScore} / 10</strong>` 
                    : `<span style="color: var(--text-light);">${isVi ? 'Chờ chấm' : 'Pending'}</span>`
                  }
                </td>
                <td>${getStatusBadge(res.status)}</td>
                <td style="text-align: right; white-space: nowrap;">
                  <button class="btn btn-secondary btn-sm" onclick="window.app.navigate('transcript-review', { studentId: '${res.studentId}' })">${isVi ? 'Xem Bản Ghi' : 'Transcript'}</button>
                  <button class="btn btn-primary btn-sm" onclick="window.app.navigate('ai-scoring', { studentId: '${res.studentId}' })">${res.status === 'Pending Review' ? (isVi ? 'Chấm Điểm' : 'Grade') : (isVi ? 'Xem & Sửa' : 'Inspect')}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Screen 24: Student Results
export function renderStudentResults() {
  const isVi = state.lang === 'vi';
  const finalized = state.data.resultsList.find(r => r.studentId === 'std-102' && r.status === 'Finalized') 
    || { studentId: 'std-101', name: 'Alex Morgan', exam: 'CS301 Oral Viva: Distributed Consistency & Resiliency', finalScore: 8.5, completionDate: '2026-10-12' };

  return `
    <div class="content-container" style="max-width: 820px;">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Kết Quả Điểm Thi Vấn Đáp Chính Thức' : 'Official Examination Result'}</h1>
          <p>${isVi ? 'Chứng nhận kết quả học phần chính thức được phê duyệt bởi giảng viên hội đồng.' : 'Institutional grade certification approved by presiding academic examiner.'}</p>
        </div>
      </div>

      <!-- Result Report Card -->
      <div class="card" style="padding: 32px; box-shadow: var(--shadow-md);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border-subtle);">
          <div>
            <span class="status-badge badge-finalized" style="margin-bottom: 8px;">${isVi ? 'Đã Chốt Điểm Chính Thức' : 'Official Grade Confirmed'}</span>
            <h2 style="font-size: 1.3rem; margin-top: 4px;">SWD392 Oral Viva: Distributed Consistency & Clean Architecture</h2>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
              ${isVi ? 'Thí sinh:' : 'Candidate:'} <strong>Alex Morgan</strong> (${isVi ? 'MSSV:' : 'Roll:'} <code>SE180101</code>) • ${isVi ? 'Giám khảo:' : 'Examiner:'} Dr. Eleanor Vance
            </div>
          </div>
          <div style="text-align: center; background-color: var(--primary-light); padding: 12px 20px; border-radius: var(--radius-lg); border: 1px solid var(--primary-border);">
            <div style="font-size: 0.72rem; font-weight: 700; color: var(--primary); text-transform: uppercase;">${isVi ? 'Điểm Chính Thức' : 'Official Score'}</div>
            <div style="font-size: 2.2rem; font-weight: 800; color: var(--primary); line-height: 1.1;">
              ${state.data.detailedTranscripts['std-101'].status === 'Finalized' ? state.data.detailedTranscripts['std-101'].lecturerFinalTotal : '9.0'}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${isVi ? 'Thang điểm 10.0' : 'Out of 10.0'}</div>
          </div>
        </div>

        <!-- Rubric Breakdown -->
        <h3 style="font-size: 1rem; margin-bottom: 14px;">${isVi ? 'Chi Tiết Đánh Giá Theo Tiêu Chí Rubric' : 'Rubric Performance Breakdown'}</h3>
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 8px 12px; background: #f8fafc; border-radius: var(--radius-sm);">
            <span>${isVi ? 'Độ chính xác kỹ thuật' : 'Technical Accuracy'} (${t('weight')} 25%)</span>
            <strong>8.5 / 10</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 8px 12px; background: #f8fafc; border-radius: var(--radius-sm);">
            <span>${isVi ? 'Hiểu biết khái niệm cốt lõi' : 'Concept Understanding'} (${t('weight')} 25%)</span>
            <strong>8.5 / 10</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 8px 12px; background: #f8fafc; border-radius: var(--radius-sm);">
            <span>${isVi ? 'Chất lượng diễn đạt & Cấu trúc luận điểm' : 'Explanation Quality & Structure'} (${t('weight')} 20%)</span>
            <strong>9.0 / 10</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 8px 12px; background: #f8fafc; border-radius: var(--radius-sm);">
            <span>${isVi ? 'Tư duy logic & Xử lý tình huống' : 'Reasoning & Problem Solving'} (${t('weight')} 15%)</span>
            <strong>8.0 / 10</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 8px 12px; background: #f8fafc; border-radius: var(--radius-sm);">
            <span>${isVi ? 'Kỹ năng giao tiếp & Tác phong vấn đáp' : 'Verbal Communication & Poise'} (${t('weight')} 15%)</span>
            <strong>9.0 / 10</strong>
          </div>
        </div>

        <!-- Examiner Comments -->
        <h3 style="font-size: 1rem; margin-bottom: 8px;">${isVi ? 'Nhận Xét & Đánh Giá Của Giảng Viên' : 'Examiner Constructive Feedback'}</h3>
        <div style="background-color: var(--bg-subtle); border-radius: var(--radius-md); padding: 16px; font-size: 0.875rem; line-height: 1.6; color: var(--text-primary); margin-bottom: 24px; border-left: 3px solid var(--primary);">
          ${isVi ? '“Kỹ năng phản biện vấn đáp rất tốt. Thí sinh trình bày rõ ràng nguyên tắc đồng thuận bầu chọn Leader và thể hiện hiểu biết kỹ thuật vững chắc khi trả lời câu hỏi phụ về kịch bản timeout split-vote. Đánh giá xuất sắc.”' : '“Excellent verbal defense. The candidate articulated the leader election quorum safety rules clearly and demonstrated solid technical understanding during the randomized split-vote timeout follow-up prompt. Highly commended.”'}
        </div>

        <div style="text-align: right;">
          <button class="btn btn-secondary" onclick="window.app.navigate('student-dashboard')">
            ${isVi ? '← Trở về Bảng Điều Khiển' : '← Return to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  `;
}
