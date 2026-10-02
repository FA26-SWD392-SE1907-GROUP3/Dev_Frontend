// Student Views: Screens 15 - 20
import { state } from '../state.js';
import { getStatusBadge } from './adminViews.js';
import { TTS } from '../audio/tts.js';
import { AudioEngine } from '../audio/visualizer.js';
import { t } from '../i18n.js';

// Screen 15: Student Dashboard
export function renderStudentDashboard() {
  const isVi = state.lang === 'vi';
  return `
    <div class="content-container" style="max-width: 900px;">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Bảng Điều Khiển Sinh Viên' : 'Student Dashboard'}</h1>
          <p>${isVi ? 'Chào mừng sinh viên' : 'Welcome'}, ${state.currentUser ? state.currentUser.name : 'Alex Morgan'}. ${isVi ? 'Tham gia và theo dõi các phiên thi vấn đáp của bạn.' : 'Access your assigned oral viva voce examinations.'}</p>
        </div>
      </div>

      <!-- Large Primary Card: Upcoming Viva Available Now -->
      <div class="card" style="border: 2px solid var(--primary-border); background: var(--bg-surface); padding: 28px; margin-bottom: 28px; box-shadow: var(--shadow-md);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <span class="status-badge badge-in-progress" style="margin-bottom: 8px;">${isVi ? 'Phòng thi Đang mở' : 'Oral Examination Open'}</span>
            <h2 style="font-size: 1.35rem; font-weight: 700; color: var(--text-primary);">SWD392 Oral Viva: Distributed Consistency & Clean Architecture</h2>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              ${isVi ? 'Kiến trúc & Thiết kế Phần mềm • Giảng viên phụ trách: TS. Eleanor Vance' : 'Software Architecture & Design • Presiding Examiner: Dr. Eleanor Vance'}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-light);">${t('allocatedDuration')}</div>
            <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary);">15 ${t('minutes')}</div>
          </div>
        </div>

        <div style="display: flex; gap: 24px; padding: 14px 18px; background-color: var(--bg-subtle); border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 20px; flex-wrap: wrap;">
          <div><span style="color: var(--text-muted);">${isVi ? 'Ngày thi:' : 'Scheduled Date:'}</span> <strong>${isVi ? 'Hôm nay (12/10/2026)' : 'Today (Oct 12, 2026)'}</strong></div>
          <div><span style="color: var(--text-muted);">${isVi ? 'Khung giờ:' : 'Slot Window:'}</span> <strong>09:00 SA – 11:30 SA</strong></div>
          <div><span style="color: var(--text-muted);">${isVi ? 'Hình thức:' : 'Format:'}</span> <strong>${isVi ? 'Vấn đáp Trực tuyến AI' : 'Voice-based AI Viva Voce'}</strong></div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${isVi ? 'Yêu cầu kiểm tra microphone và loa trước khi vào phòng thi.' : 'Microphone & audio test required prior to entrance.'}
          </div>
          <button class="btn btn-primary btn-lg" onclick="window.app.navigate('pre-exam-check')">
            ${t('joinExam')}
          </button>
        </div>
      </div>

      <!-- Secondary: My Exams List -->
      <div class="card" style="margin-bottom: 28px;">
        <div class="card-header">
          <div>
            <h2 class="card-title">${isVi ? 'Danh Sách Kỳ Thi Vấn Đáp Của Tôi' : 'My Assigned Oral Examinations'}</h2>
            <div class="card-subtitle">${isVi ? 'Các phiên thi vấn đáp sắp tới và lịch sử đánh giá của bạn trong học kỳ' : 'Upcoming and concluded viva voce sessions for your academic term'}</div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.app.navigate('student-my-exams')">${isVi ? 'Xem Lịch Thi Đầy Đủ' : 'View Full Schedule'}</button>
        </div>

        <div class="table-container">
          <table class="academic-table">
            <thead>
              <tr>
                <th>${t('course')}</th>
                <th>${isVi ? 'Phiên Thi Vấn Đáp' : 'Exam Session'}</th>
                <th>${isVi ? 'Ngày & Giờ Thi' : 'Scheduled Date'}</th>
                <th>${t('status')}</th>
                <th style="text-align: right;">${t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>SWD392</code></td>
                <td><strong>SWD392 Oral Viva: Distributed Consistency & Clean Architecture</strong></td>
                <td>${isVi ? 'Hôm nay, 09:00 SA' : 'Today, 09:00 AM'}</td>
                <td><span class="status-badge badge-in-progress">${isVi ? 'Đang Mở' : 'Available Now'}</span></td>
                <td style="text-align: right;">
                  <button class="btn btn-primary btn-sm" onclick="window.app.navigate('pre-exam-check')">${t('joinExam')}</button>
                </td>
              </tr>
              <tr>
                <td><code>PRN231</code></td>
                <td><strong>PRN231 Oral Viva: RESTful APIs & JWT Security</strong></td>
                <td>${isVi ? '15/10/2026' : 'Oct 15, 2026'}</td>
                <td>${getStatusBadge('Scheduled')}</td>
                <td style="text-align: right;">
                  <button class="btn btn-secondary btn-sm" onclick="window.app.openExamInstructionsModal()">${isVi ? 'Xem Chi Tiết' : 'View Details'}</button>
                </td>
              </tr>
              <tr>
                <td><code>SWP391</code></td>
                <td><strong>SWP391 Sprint Defense: Agile Architecture</strong></td>
                <td>${isVi ? '02/10/2026' : 'Oct 02, 2026'}</td>
                <td>${getStatusBadge('Finalized')}</td>
                <td style="text-align: right;">
                  <button class="btn btn-outline btn-sm" onclick="window.app.navigate('student-results')">${isVi ? 'Xem Báo Cáo Điểm' : 'View Grade Report'}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Finalized Result Notice -->
      <div class="card" style="background-color: var(--status-finalized-bg); border: 1px solid var(--status-finalized-border);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: var(--status-finalized-bg); color: var(--status-finalized-text); display: flex; align-items: center; justify-content: center; border: 1px solid var(--status-finalized-border);">
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <div style="font-weight: 700; color: var(--status-finalized-text);">${isVi ? 'Kết Quả Điểm Chính Thức Mới Công Bố' : 'Recent Official Result Published'}</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">${isVi ? 'Vấn đáp giữa kỳ CS301 • Đã được TS. Eleanor Vance phê duyệt' : 'CS301 Midterm Viva • Grade finalized by Dr. Eleanor Vance'}</div>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="window.app.navigate('student-results')">
            ${isVi ? 'Xem Đánh Giá & Nhận Xét' : 'Inspect Official Feedback'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// Screen 16: Student – My Exams (Filterable Tabs)
export function renderStudentMyExams() {
  const tab = state.studentExamTab || 'upcoming';
  const isVi = state.lang === 'vi';

  return `
    <div class="content-container" style="max-width: 900px;">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Kỳ Thi Của Tôi' : 'My Exams'}</h1>
          <p>${isVi ? 'Lịch thi vấn đáp trực tuyến và hồ sơ kết quả đánh giá học phần.' : 'Scheduled viva voce oral examinations and historical assessment records.'}</p>
        </div>
      </div>

      <div class="tabs-bar">
        <button class="tab-btn ${tab === 'upcoming' ? 'active' : ''}" onclick="window.app.switchStudentExamTab('upcoming')">
          ${isVi ? 'Sắp Diễn Ra & Đang Mở' : 'Upcoming & Active'} <span class="tab-badge">2</span>
        </button>
        <button class="tab-btn ${tab === 'completed' ? 'active' : ''}" onclick="window.app.switchStudentExamTab('completed')">
          ${isVi ? 'Đã Hoàn Thành & Đã Có Điểm' : 'Concluded & Finalized'} <span class="tab-badge">1</span>
        </button>
      </div>

      <div class="table-container">
        <table class="academic-table">
          <thead>
            <tr>
              <th>${isVi ? 'Tên Kỳ Thi' : 'Exam Name'}</th>
              <th>${t('course')}</th>
              <th>${isVi ? 'Ngày & Giờ' : 'Date & Time'}</th>
              <th>${isVi ? 'Thời Lượng' : 'Duration'}</th>
              <th>${t('status')}</th>
              <th style="text-align: right;">${t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${tab === 'upcoming' ? `
              <tr>
                <td><strong>SWD392 Oral Viva: Distributed Consistency & Clean Architecture</strong></td>
                <td><code>SWD392</code></td>
                <td>${isVi ? 'Hôm nay, 09:00 SA' : 'Today, 09:00 AM'}</td>
                <td>15 ${t('minutes')}</td>
                <td>${getStatusBadge('In Progress')}</td>
                <td style="text-align: right;">
                  <button class="btn btn-primary btn-sm" onclick="window.app.navigate('pre-exam-check')">${t('joinExam')}</button>
                </td>
              </tr>
              <tr>
                <td><strong>PRN231 Oral Viva: RESTful APIs, JWT Auth & EF Core</strong></td>
                <td><code>PRN231</code></td>
                <td>${isVi ? '15/10/2026, 10:30 SA' : 'Oct 15, 2026, 10:30 AM'}</td>
                <td>20 ${t('minutes')}</td>
                <td>${getStatusBadge('Scheduled')}</td>
                <td style="text-align: right;">
                  <button class="btn btn-outline btn-sm" onclick="window.app.openExamInstructionsModal()">${isVi ? 'Xem Hướng Dẫn' : 'Instructions'}</button>
                </td>
              </tr>
            ` : `
              <tr>
                <td><strong>SWP391 Sprint Defense: Agile Architecture & CI/CD Pipeline</strong></td>
                <td><code>SWP391</code></td>
                <td>${isVi ? '02/10/2026' : 'Oct 02, 2026'}</td>
                <td>25 ${t('minutes')}</td>
                <td>${getStatusBadge('Finalized')} (9.0/10)</td>
                <td style="text-align: right;">
                  <button class="btn btn-primary btn-sm" onclick="window.app.navigate('student-results')">${isVi ? 'Xem Báo Cáo Điểm' : 'View Grade Report'}</button>
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Screen 17: Pre-Exam Device Check
export function renderPreExamCheck() {
  const dc = state.deviceCheck;
  const isVi = state.lang === 'vi';

  return `
    <div class="content-container" style="max-width: 720px;">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Kiểm tra Thiết bị & Đường truyền Trước giờ thi' : 'Pre-Exam Device & Environment Check'}</h1>
          <p>${isVi ? 'Kiểm tra tai nghe, micro và kết nối mạng trước khi bước vào phòng thi vấn đáp trực tuyến.' : 'Verify your audio hardware and network connectivity before entering the oral examination room.'}</p>
        </div>
      </div>

      <!-- Exam Summary Box -->
      <div class="card" style="margin-bottom: 20px; background-color: var(--bg-subtle);">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 0.85rem;">
          <div><span style="color: var(--text-muted);">${isVi ? 'Kỳ thi:' : 'Examination:'}</span> <strong>SWD392 Oral Viva Voce</strong></div>
          <div><span style="color: var(--text-muted);">${isVi ? 'Giám khảo phụ trách:' : 'Presiding Examiner:'}</span> <strong>Dr. Eleanor Vance</strong></div>
          <div><span style="color: var(--text-muted);">${isVi ? 'Thời gian cho phép:' : 'Allocated Time:'}</span> <strong>15 ${t('minutes')}</strong></div>
          <div><span style="color: var(--text-muted);">${isVi ? 'Môi trường thi:' : 'Environment:'}</span> <strong>${isVi ? 'Yêu cầu không gian yên tĩnh' : 'Quiet Academic Room Required'}</strong></div>
        </div>
      </div>

      <!-- Device 1: Microphone -->
      <div class="device-check-card">
        <div class="device-info">
          <div class="device-icon-box">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </div>
          <div>
            <strong>${isVi ? 'Kiểm tra Tín hiệu Micro' : 'Microphone Input Test'}</strong>
            <div style="font-size: 0.775rem; color: var(--text-muted);">${isVi ? 'Câu trả lời bằng giọng nói sẽ được ghi âm và chuyển thành văn bản để hội đồng chấm điểm.' : 'Voice answers will be captured and transcribed for lecturer evaluation.'}</div>
            <div id="micFeedbackText" style="font-size: 0.75rem; color: var(--primary); margin-top: 4px; display: none;">
              🎤 ${isVi ? 'Đã nhận tín hiệu âm thanh. Micro hoạt động tốt!' : 'Audio level detected. Microphone operational!'}
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span id="micBadge" class="device-status-badge" style="color: ${dc.micTested ? 'var(--status-completed-text)' : 'var(--text-muted)'};">
            ${dc.micTested ? (isVi ? '✓ Sẵn sàng' : '✓ Ready') : (isVi ? 'Chưa thử' : 'Pending Test')}
          </span>
          <button class="btn btn-secondary btn-sm" id="btnTestMic" onclick="window.app.testMicrophone()">${t('testMic')}</button>
        </div>
      </div>

      <!-- Device 2: Speaker -->
      <div class="device-check-card">
        <div class="device-info">
          <div class="device-icon-box">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          </div>
          <div>
            <strong>${isVi ? 'Kiểm tra Loa & Tai nghe' : 'Speaker & Audio Playback'}</strong>
            <div style="font-size: 0.775rem; color: var(--text-muted);">${isVi ? 'Bạn sẽ nghe giám khảo AI phát âm câu hỏi vấn đáp.' : 'You will listen to the AI examiner articulate viva prompts and questions.'}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span id="speakerBadge" class="device-status-badge" style="color: ${dc.speakerTested ? 'var(--status-completed-text)' : 'var(--text-muted)'};">
            ${dc.speakerTested ? (isVi ? '✓ Sẵn sàng' : '✓ Ready') : (isVi ? 'Chưa thử' : 'Pending Test')}
          </span>
          <button class="btn btn-secondary btn-sm" id="btnTestSpeaker" onclick="window.app.testSpeakerAudio()">${t('testSpeaker')}</button>
        </div>
      </div>

      <!-- Device 3: Network -->
      <div class="device-check-card">
        <div class="device-info">
          <div class="device-icon-box" style="background-color: var(--status-completed-bg); color: var(--status-completed-text);">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
          </div>
          <div>
            <strong>${isVi ? 'Đường truyền Kết nối & Độ trễ' : 'Network Telemetry & Latency'}</strong>
            <div style="font-size: 0.775rem; color: var(--text-muted);">${isVi ? 'Kênh WebSocket Học viện: Độ trễ 24ms • Mất gói 0.0%' : 'Institutional WebSocket Stream: Latency 24ms • Loss 0.0%'}</div>
          </div>
        </div>
        <div>
          <span class="device-status-badge" style="color: var(--status-completed-text);">${isVi ? '✓ Ổn định (24ms)' : '✓ Optimal (24ms)'}</span>
        </div>
      </div>

      <!-- Pre-check CTA Button -->
      <div style="margin-top: 28px; text-align: center;">
        <button class="btn btn-primary btn-lg" id="btnStartExamCTA" onclick="window.app.startVivaSession()" style="min-width: 240px;">
          ${t('startExamNow')}
        </button>
        <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 10px;">
          ${isVi ? 'Bằng việc tiếp tục, phiên thi của bạn sẽ được ghi âm và mã hóa để phục vụ đánh giá học thuật.' : 'By proceeding, your audio session will be recorded and transcribed for academic evaluation.'}
        </div>
      </div>
    </div>
  `;
}

// Screen 18: AI-Based Oral Examination Interface
export function renderAIOralExamination() {
  const sess = state.vivaSession;
  const currentQ = sess.questions[sess.currentQuestionIndex];
  const isFollowUp = sess.isFollowUpMode;
  const questionNumber = sess.currentQuestionIndex + 1;
  const totalQuestions = sess.questions.length;
  const isVi = state.lang === 'vi';

  return `
    <div class="viva-exam-container">
      <!-- Distraction-free Top Bar -->
      <div class="viva-header-bar">
        <div>
          <strong style="font-size: 1rem; color: var(--text-primary);">SWD392 Oral Viva: Distributed Consistency & Clean Architecture</strong>
          <div style="font-size: 0.775rem; color: var(--text-muted);">${isVi ? 'Thí sinh:' : 'Candidate:'} ${state.currentUser ? state.currentUser.name : 'Alex Morgan'} (${isVi ? 'MSSV:' : 'Roll:'} ${state.currentUser && state.currentUser.rollNumber ? state.currentUser.rollNumber : 'SE180101'})</div>
        </div>

        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">
            ${t('question')} <strong>${questionNumber}</strong> ${t('of')} <strong>${totalQuestions}</strong>
          </div>
          <div class="viva-timer-pill" id="vivaTimerDisplay">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span id="timerDigits">11:15</span>
          </div>
        </div>
      </div>

      <!-- Follow-up Question Alert (When active in Screen 19) -->
      ${isFollowUp ? `
        <div class="followup-alert-banner">
          <span class="followup-badge">${t('followUpTitle')}</span>
          <div>
            ${isVi ? 'Giám khảo AI yêu cầu bạn giải thích chi tiết hơn câu trả lời vừa rồi để đánh giá độ sâu hiểu biết:' : 'The AI examiner requires elaboration on your previous statement to probe depth of understanding:'}
          </div>
        </div>
      ` : ''}

      <!-- AI Examiner Panel -->
      <div class="ai-examiner-panel">
        <div class="ai-avatar-row">
          <div class="ai-avatar ${sess.isTTSPlaying ? 'speaking' : ''}" id="aiExaminerAvatar">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          </div>
          <div class="ai-status-indicator">
            <span class="ai-status-name">${isVi ? 'Giám khảo Trí tuệ Nhân tạo AIVES' : 'AIVES AI Examiner'}</span>
            <span class="ai-status-state" id="aiSpeakingState">
              ${sess.isTTSPlaying ? (isVi ? '● Đang đọc câu hỏi...' : '● Articulating question...') : (isVi ? 'Sẵn sàng nghe câu trả lời' : 'Ready for candidate answer')}
            </span>
          </div>
        </div>

        <!-- Question Prompt Text Box -->
        <div class="question-text-box">
          <div class="question-prompt" id="vivaQuestionPrompt">
            ${isFollowUp ? currentQ.followUpText : currentQ.text}
          </div>
        </div>

        <!-- Audio Playback Action -->
        <div class="question-tts-action">
          <button class="btn btn-secondary btn-sm" id="btnPlayTTS" onclick="window.app.playQuestionTTS()">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            ${t('playVoicePrompt')}
          </button>
          <span style="font-size: 0.775rem; color: var(--text-muted);">
            ${isVi ? 'Lắng nghe kỹ câu hỏi trước khi bắt đầu phần trả lời miệng.' : 'Listen carefully to the question before providing your oral answer.'}
          </span>
        </div>
      </div>

      <!-- Student Answer Panel -->
      <div class="student-answer-panel">
        <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
          ${isVi ? 'Bảng Điều Khiển Thu Âm Trả Lời' : 'Candidate Audio Response Console'}
        </div>

        <!-- Realtime Animated Waveform Visualizer -->
        <div class="waveform-canvas-container">
          <canvas id="vivaWaveformCanvas"></canvas>
        </div>

        <!-- Recording Timer & Actions -->
        <div class="recording-timer" id="recordingTimerDisplay">00:00</div>

        <div>
          ${!sess.isRecording ? `
            <button class="btn btn-primary btn-lg record-action-btn" id="btnStartRecord" onclick="window.app.startStudentRecording()">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              ${t('startAnswer')}
            </button>
          ` : `
            <button class="btn btn-danger btn-lg record-action-btn recording" id="btnStopRecord" onclick="window.app.stopStudentRecording()">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"/></svg>
              ${t('stopAnswer')}
            </button>
          `}
        </div>

        <!-- Submitting Processing Indicator -->
        <div id="vivaProcessingBanner" style="display: none; align-items: center; gap: 10px; font-size: 0.825rem; color: var(--primary); margin-top: 10px;">
          <div style="width: 14px; height: 14px; border: 2px solid var(--primary); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <span>${isVi ? 'Đang chuyển lời nói thành văn bản & phân tích câu trả lời...' : 'Converting speech to transcript & analyzing response...'}</span>
        </div>

        <div style="font-size: 0.775rem; color: var(--text-muted); max-width: 440px;">
          ${isVi ? 'Nói rõ ràng vào microphone. Khi hoàn thành, bấm "Dừng & Nộp câu trả lời".' : 'Speak clearly into your microphone. Once completed, click "Stop & Submit Answer".'}
        </div>
      </div>
    </div>
  `;
}

// Screen 20: Exam Completion
export function renderExamCompleted() {
  const isVi = state.lang === 'vi';
  return `
    <div class="content-container">
      <div class="exam-completed-card">
        <div class="success-icon-large">
          <svg width="34" height="34" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>

        <h1 style="font-size: 1.5rem; margin-bottom: 8px;">${t('examConcluded')}</h1>
        <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 24px;">
          ${t('responsesSubmitted')}
        </p>

        <!-- Official Submission Receipt -->
        <div style="background-color: var(--bg-subtle); border-radius: var(--radius-lg); padding: 20px; text-align: left; margin-bottom: 24px; border: 1px solid var(--border-subtle); font-size: 0.85rem; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">${isVi ? 'Kỳ thi:' : 'Examination:'}</span>
            <strong>SWD392 Oral Viva: Distributed Consistency & Clean Architecture</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">${isVi ? 'Môn học:' : 'Course:'}</span>
            <strong>SWD392 – Software Architecture & Design</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">${isVi ? 'Thời gian nộp bài:' : 'Completion Timestamp:'}</span>
            <strong>2026-10-12 • 09:14:10</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">${t('status')}:</span>
            <span class="status-badge badge-pending">${isVi ? 'Đã nộp • Chờ giảng viên chấm' : 'Submitted • Pending Lecturer Review'}</span>
          </div>
        </div>

        <div class="alert-box alert-info" style="text-align: left; margin-bottom: 24px;">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <div>
            <strong>${isVi ? 'Đang chờ hội đồng chấm điểm:' : 'Evaluation In Progress:'}</strong> ${isVi ? 'Bản ghi âm câu trả lời của bạn đã được chuyển đến TS. Eleanor Vance. Điểm số chính thức và nhận xét đánh giá sẽ được cập nhật trên bảng điểm của bạn sau khi hoàn tất.' : 'Your audio responses are queued for evaluation by Dr. Eleanor Vance. Final official grades and lecturer comments will be published on your student dashboard once finalized.'}
          </div>
        </div>

        <button class="btn btn-primary btn-lg" onclick="window.app.navigate('student-dashboard')" style="min-width: 220px;">
          ${t('returnDashboard')}
        </button>
      </div>
    </div>
  `;
}
