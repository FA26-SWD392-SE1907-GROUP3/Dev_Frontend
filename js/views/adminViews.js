// Admin Views: Screens 2 - 5 & Exam Settings
import { state } from '../state.js';
import { t } from '../i18n.js';

// Helper for status badge HTML
export function getStatusBadge(status) {
  let label = status;
  let cls = 'badge-draft';
  switch (status) {
    case 'Draft': label = t('statusDraft'); cls = 'badge-draft'; break;
    case 'Scheduled': label = t('statusScheduled'); cls = 'badge-scheduled'; break;
    case 'Published': label = t('statusPublished'); cls = 'badge-published'; break;
    case 'In Progress': label = t('statusInProgress'); cls = 'badge-in-progress'; break;
    case 'Completed': label = t('statusCompleted'); cls = 'badge-completed'; break;
    case 'Pending Review': label = t('statusPendingReview'); cls = 'badge-pending'; break;
    case 'Finalized': label = t('statusFinalized'); cls = 'badge-finalized'; break;
    case 'Active': label = t('statusActive'); cls = 'badge-completed'; break;
    case 'Inactive': label = t('statusInactive'); cls = 'badge-draft'; break;
    default: label = status; cls = 'badge-draft'; break;
  }
  return `<span class="status-badge ${cls}">${label}</span>`;
}

// Screen 2: Admin Dashboard
export function renderAdminDashboard() {
  const users = state.data.users;
  const totalUsers = users.length;
  const lecturers = users.filter(u => u.role === 'Lecturer').length;
  const students = users.filter(u => u.role === 'Student').length;
  const activeCourses = state.data.courses.filter(c => c.status === 'Active').length;
  const upcomingExams = state.data.examSessions.filter(e => e.status === 'Scheduled' || e.status === 'Published').length;
  const inProgressExams = state.data.examSessions.filter(e => e.status === 'In Progress').length;
  const isVi = state.lang === 'vi';

  return `
    <div class="content-container">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Bảng Điều Khiển Quản Trị' : 'Admin Dashboard'}</h1>
          <p>${isVi ? 'Tổng quan hệ thống, người dùng và hạ tầng phòng thi vấn đáp trực tuyến.' : 'Institutional oversight, user telemetry, and oral examination infrastructure.'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="window.app.navigate('user-management')">${isVi ? 'Quản lý Người dùng' : 'Manage Users'}</button>
          <button class="btn btn-primary btn-sm" onclick="window.app.openAddUserModal()">${t('addNewUser')}</button>
        </div>
      </div>

      <!-- High-level Summary Metrics -->
      <div class="grid-3" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${t('totalUsers')}</span>
            <span class="stat-value">${totalUsers}</span>
          </div>
          <div class="stat-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${t('facultyLecturers')}</span>
            <span class="stat-value">${lecturers}</span>
          </div>
          <div class="stat-icon" style="background-color: var(--primary-light); color: var(--primary);">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${t('registeredStudents')}</span>
            <span class="stat-value">${students}</span>
          </div>
          <div class="stat-icon" style="background-color: rgba(56, 189, 248, 0.15); color: #0284c7;">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${t('activeCourses')}</span>
            <span class="stat-value">${activeCourses}</span>
          </div>
          <div class="stat-icon" style="background-color: rgba(34, 197, 94, 0.15); color: #16a34a;">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${t('upcomingExams')}</span>
            <span class="stat-value">${upcomingExams}</span>
          </div>
          <div class="stat-icon" style="background-color: rgba(245, 158, 11, 0.15); color: #d97706;">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${t('examsInProgress')}</span>
            <span class="stat-value">${inProgressExams}</span>
          </div>
          <div class="stat-icon" style="background-color: rgba(239, 68, 68, 0.15); color: #dc2626;">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
        </div>
      </div>

      <!-- Upcoming Examinations Table -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <div>
            <h2 class="card-title">${isVi ? 'Danh Sách Kỳ Thi Vấn Đáp' : 'Upcoming & Active Examinations'}</h2>
            <div class="card-subtitle">${isVi ? 'Các phiên thi vấn đáp được lên lịch trên toàn học viện' : 'Scheduled oral viva sessions across academic faculties'}</div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.app.navigate('exam-sessions')">${isVi ? 'Xem Tất cả Phiên thi' : 'View All Sessions'}</button>
        </div>

        <div class="table-container">
          <table class="academic-table">
            <thead>
              <tr>
                <th>${isVi ? 'Phiên thi Vấn đáp' : 'Exam Session'}</th>
                <th>${isVi ? 'Môn học' : 'Course'}</th>
                <th>${isVi ? 'Giảng viên Hội đồng' : 'Presiding Lecturer'}</th>
                <th>${isVi ? 'Ngày & Giờ' : 'Date & Time'}</th>
                <th>${isVi ? 'Thí sinh' : 'Students'}</th>
                <th>${t('status')}</th>
              </tr>
            </thead>
            <tbody>
              ${state.data.examSessions.map(exam => `
                <tr>
                  <td><strong>${exam.name}</strong></td>
                  <td><span class="status-badge" style="background:var(--bg-subtle); color:var(--text-secondary);">${exam.course}</span></td>
                  <td>${exam.lecturer}</td>
                  <td>${exam.date} • ${exam.startTime}</td>
                  <td>${exam.studentsCount} ${isVi ? 'thí sinh' : 'candidates'}</td>
                  <td>${getStatusBadge(exam.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent System Activity -->
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">${isVi ? 'Nhật Ký Hoạt Động Hệ Thống' : 'Recent System Activity'}</h2>
            <div class="card-subtitle">${isVi ? 'Lịch sử thao tác học thuật, lên lịch thi và cấp quyền tài khoản' : 'Audited academic actions, exam scheduling, and account provisioning'}</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${state.data.recentActivities.map(act => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-subtle); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background-color: var(--primary);"></div>
                <div>
                  <strong style="font-size: 0.85rem; color: var(--text-primary);">${act.action}</strong>
                  <div style="font-size: 0.775rem; color: var(--text-muted);">${act.detail}</div>
                </div>
              </div>
              <span style="font-size: 0.75rem; color: var(--text-light); white-space: nowrap;">${act.time}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Screen 3: User Management
export function renderUserManagement() {
  const isVi = state.lang === 'vi';
  return `
    <div class="content-container">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Quản Lý Người Dùng' : 'User Management'}</h1>
          <p>${isVi ? 'Danh bạ tài khoản cán bộ quản trị, giảng viên hội đồng và sinh viên học viện.' : 'Institutional directory of administrators, examiners, and examination candidates.'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="window.app.openAddUserModal()">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ${isVi ? '+ Thêm Người dùng Mới' : '+ Add New User'}
          </button>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="filter-toolbar">
        <div class="filter-left">
          <div class="search-input-wrapper">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="userSearchInput" class="form-input" placeholder="${isVi ? 'Tìm theo tên, mã số hoặc email...' : 'Search by name, ID, or email...'}" oninput="window.app.filterUsersTable()" style="width: 280px;">
          </div>

          <select id="userRoleFilter" class="form-select" onchange="window.app.filterUsersTable()" style="width: 150px;">
            <option value="All">${isVi ? 'Tất cả Vai trò' : 'All Roles'}</option>
            <option value="Admin">${t('roleAdmin')}</option>
            <option value="Lecturer">${t('roleLecturer')}</option>
            <option value="Student">${t('roleStudent')}</option>
          </select>

          <select id="userStatusFilter" class="form-select" onchange="window.app.filterUsersTable()" style="width: 140px;">
            <option value="All">${isVi ? 'Tất cả Trạng thái' : 'All Statuses'}</option>
            <option value="Active">${t('statusActive')}</option>
            <option value="Inactive">${t('statusInactive')}</option>
          </select>
        </div>
        <div class="filter-right">
          <span style="font-size: 0.8rem; color: var(--text-muted);"><span id="userCount">${state.data.users.length}</span> ${isVi ? 'người dùng' : 'Total Records'}</span>
        </div>
      </div>

      <!-- Users Table -->
      <div class="table-container">
        <table class="academic-table" id="usersTable">
          <thead>
            <tr>
              <th>${isVi ? 'Họ và Tên' : 'Name'}</th>
              <th>${isVi ? 'Mã số / MSSV' : 'User ID / Roll No.'}</th>
              <th>${isVi ? 'Email Học viện' : 'Institutional Email'}</th>
              <th>${isVi ? 'Vai trò' : 'Role'}</th>
              <th>${isVi ? 'Khoa / Bộ môn' : 'Department / Program'}</th>
              <th>${t('status')}</th>
              <th style="text-align: right;">${t('actions')}</th>
            </tr>
          </thead>
          <tbody id="usersTableBody">
            ${state.data.users.map(u => `
              <tr data-role="${u.role}" data-status="${u.status}" data-query="${u.name.toLowerCase()} ${(u.rollNumber || u.id).toLowerCase()} ${u.email.toLowerCase()}">
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="user-avatar" style="width: 30px; height: 30px; font-size: 0.75rem;">
                      ${u.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <strong>${u.name}</strong>
                  </div>
                </td>
                <td><code>${u.rollNumber || u.id}</code></td>
                <td>${u.email}</td>
                <td>
                  <span class="status-badge" style="background: ${u.role === 'Admin' ? 'var(--status-finalized-bg)' : u.role === 'Lecturer' ? 'var(--status-pending-bg)' : 'var(--status-published-bg)'}; color: ${u.role === 'Admin' ? 'var(--status-finalized-text)' : u.role === 'Lecturer' ? 'var(--status-pending-text)' : 'var(--status-published-text)'};">
                    ${u.role === 'Admin' ? t('roleAdmin') : u.role === 'Lecturer' ? t('roleLecturer') : t('roleStudent')}
                  </span>
                </td>
                <td>${u.department}</td>
                <td>${getStatusBadge(u.status)}</td>
                <td style="text-align: right; white-space: nowrap;">
                  <button class="btn btn-secondary btn-sm" onclick="window.app.toggleUserStatus('${u.id}')">
                    ${u.status === 'Active' ? (isVi ? 'Khóa' : 'Deactivate') : (isVi ? 'Mở khóa' : 'Activate')}
                  </button>
                  <button class="btn btn-outline btn-sm" onclick="window.app.openEditUserModal('${u.id}')">${t('edit')}</button>
                  <button class="btn btn-danger-outline btn-sm" onclick="window.app.deleteUser('${u.id}')">${t('delete')}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Screen 4: Roles & Permissions Matrix
export function renderRolesPermissions() {
  const isVi = state.lang === 'vi';
  return `
    <div class="content-container">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Vai Trò & Phân Quyền Hệ Thống' : 'Roles & Permissions'}</h1>
          <p>${isVi ? 'Ma trận kiểm soát quyền hạn học thuật, tính liêm chính khảo thí và bảo mật thí sinh.' : 'Access control matrix governing academic authority, assessment integrity, and candidate privacy.'}</p>
        </div>
      </div>

      <div class="alert-box alert-info">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div>
          <strong>${isVi ? 'Nguyên tắc Phân cấp Quyền hạn:' : 'Role Hierarchy Principle:'}</strong> ${isVi ? 'Giảng viên giữ độc quyền điều chỉnh tiêu chí rubric, nghe lại bản ghi âm và chốt điểm chính thức. Sinh viên chỉ truy cập phòng thi của mình và bảng điểm sau khi hoàn tất.' : 'Lecturers hold exclusive authority to edit rubrics, review viva audio transcripts, and finalize grades. Students only access their personal examination room and confirmed results.'}
        </div>
      </div>

      <div class="table-container">
        <table class="academic-table">
          <thead>
            <tr>
              <th style="width: 32%;">${isVi ? 'Quyền Hạn Hệ Thống' : 'System Capability'}</th>
              <th style="width: 38%;">${isVi ? 'Mô tả & Phạm vi' : 'Description & Scope'}</th>
              <th style="text-align: center; width: 10%;">${t('roleAdmin')}</th>
              <th style="text-align: center; width: 10%;">${t('roleLecturer')}</th>
              <th style="text-align: center; width: 10%;">${t('roleStudent')}</th>
            </tr>
          </thead>
          <tbody>
            ${state.data.permissionsMatrix.map(item => `
              <tr>
                <td><strong>${item.capability}</strong></td>
                <td style="color: var(--text-muted); font-size: 0.8rem;">${item.desc}</td>
                <td style="text-align: center;">
                  ${item.admin ? `<span style="color: var(--status-completed-text); font-weight: bold; font-size: 1.1rem;">✓</span>` : `<span style="color: var(--border-medium);">—</span>`}
                </td>
                <td style="text-align: center;">
                  ${item.lecturer ? `<span style="color: var(--status-completed-text); font-weight: bold; font-size: 1.1rem;">✓</span>` : `<span style="color: var(--border-medium);">—</span>`}
                </td>
                <td style="text-align: center;">
                  ${item.student ? `<span style="color: var(--status-completed-text); font-weight: bold; font-size: 1.1rem;">✓</span>` : `<span style="color: var(--border-medium);">—</span>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Screen 5: Courses & Subjects
export function renderCoursesSubjects() {
  const isVi = state.lang === 'vi';
  return `
    <div class="content-container">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Môn Học & Học Phần' : 'Courses & Subjects'}</h1>
          <p>${isVi ? 'Các học phần được cấu hình tổ chức thi vấn đáp trực tuyến có trợ lý AI.' : 'Academic courses configured for AI-assisted viva voce assessments.'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="window.app.openAddCourseModal()">${isVi ? '+ Thêm Môn học Mới' : '+ Add Course'}</button>
        </div>
      </div>

      <div class="filter-toolbar">
        <div class="search-input-wrapper">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="courseSearchInput" class="form-input" placeholder="${isVi ? 'Tìm môn học theo mã hoặc tên...' : 'Search course by code or title...'}" style="width: 320px;" oninput="window.app.filterCoursesTable()">
        </div>
      </div>

      <div class="table-container">
        <table class="academic-table" id="coursesTable">
          <thead>
            <tr>
              <th>${t('courseCode')}</th>
              <th>${t('courseName')}</th>
              <th>${isVi ? 'Giảng viên Phụ trách' : 'Assigned Lecturer'}</th>
              <th>${isVi ? 'Sinh viên Đăng ký' : 'Enrolled Students'}</th>
              <th>${t('status')}</th>
              <th style="text-align: right;">${t('actions')}</th>
            </tr>
          </thead>
          <tbody id="coursesTableBody">
            ${state.data.courses.map(course => `
              <tr data-query="${course.code.toLowerCase()} ${course.name.toLowerCase()} ${course.lecturer.toLowerCase()}">
                <td><code><strong>${course.code}</strong></code></td>
                <td>
                  <strong>${course.name}</strong>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${course.description.substring(0, 75)}...</div>
                </td>
                <td>${course.lecturer}</td>
                <td>${course.studentsCount} ${isVi ? 'sinh viên' : 'Students'}</td>
                <td>${getStatusBadge(course.status)}</td>
                <td style="text-align: right; white-space: nowrap;">
                  <button class="btn btn-secondary btn-sm" onclick="window.app.toggleCourseStatus('${course.id}')">
                    ${course.status === 'Active' ? (isVi ? 'Tạm dừng' : 'Deactivate') : (isVi ? 'Kích hoạt' : 'Activate')}
                  </button>
                  <button class="btn btn-outline btn-sm" onclick="window.app.viewCourseDetail('${course.id}')">${t('viewDetails')}</button>
                  <button class="btn btn-outline btn-sm" onclick="window.app.openEditCourseModal('${course.id}')">${t('edit')}</button>
                  <button class="btn btn-danger-outline btn-sm" onclick="window.app.deleteCourse('${course.id}')">${t('delete')}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Screen: Admin Exam Settings
export function renderAdminExamSettings() {
  const s = state.examSettings;
  const isVi = state.lang === 'vi';

  return `
    <div class="content-container" style="max-width: 900px;">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Cài Đặt Kỳ Thi & Quy Chế Học Viện' : 'Examination Settings & Global Governance'}</h1>
          <p>${isVi ? 'Các thiết lập mặc định của trường về giọng đọc AI, an ninh giám sát và thời lượng thi vấn đáp.' : 'Institutional defaults for speech synthesis, proctoring security, and viva duration.'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="window.app.saveAdminExamSettings()">
            ${isVi ? 'Lưu Cài đặt Học viện' : 'Save Institutional Settings'}
          </button>
        </div>
      </div>

      <!-- Settings Form -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <h2 class="card-title">${isVi ? '1. Thông Số Kỳ Thi Vấn Đáp Trực Tuyến' : '1. Oral Viva Examination Parameters'}</h2>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label form-label-required">${isVi ? 'Thời lượng Quy định Mặc định (Phút)' : 'Default Allocated Duration (Minutes)'}</label>
            <input type="number" id="settingDuration" class="form-input" value="${s.defaultDuration}" min="5" max="60">
            <span class="form-hint">${isVi ? 'Thời gian cho phép mỗi thí sinh trả lời các câu hỏi trong ca thi.' : 'Time allotted per candidate for answering scheduled prompts.'}</span>
          </div>

          <div class="form-group">
            <label class="form-label form-label-required">${isVi ? 'Số Câu hỏi Phụ AI Đặt Thêm Tối Đa' : 'Maximum AI Follow-Up Probes'}</label>
            <select id="settingFollowUps" class="form-select">
              <option value="0" ${s.maxFollowUps === 0 ? 'selected' : ''}>${isVi ? 'Không hỏi thêm (0 câu)' : 'Disabled (No follow-ups)'}</option>
              <option value="1" ${s.maxFollowUps === 1 ? 'selected' : ''}>${isVi ? 'Tối đa 1 câu phụ / câu hỏi' : '1 Follow-up per Question'}</option>
              <option value="2" ${s.maxFollowUps === 2 ? 'selected' : ''}>${isVi ? 'Tối đa 2 câu phụ / câu hỏi' : '2 Follow-ups per Question'}</option>
            </select>
            <span class="form-hint">${isVi ? 'Tự động kích hoạt khi câu trả lời của thí sinh cần đào sâu thêm khái niệm.' : 'Triggered when candidate answer needs further conceptual depth.'}</span>
          </div>

          <div class="form-group">
            <label class="form-label form-label-required">${isVi ? 'Ngưỡng Khoảng Lặng Tự Động Kết Thúc (Giây)' : 'Voice Activity Silence Threshold (Seconds)'}</label>
            <input type="number" id="settingSilence" class="form-input" value="${s.silenceThreshold}" min="3" max="15">
            <span class="form-hint">${isVi ? 'Thời gian im lặng trước khi hệ thống ghi nhận thí sinh đã nói xong.' : 'Pause before system confirms candidate has finished speaking.'}</span>
          </div>

          <div class="form-group">
            <label class="form-label form-label-required">${isVi ? 'Giọng Đọc Giám Khảo AI' : 'Examiner Voice Synthesis Persona'}</label>
            <select id="settingVoice" class="form-select">
              <option ${s.voicePersona.includes('British') ? 'selected' : ''}>British English (Natural Academic)</option>
              <option ${s.voicePersona.includes('American') ? 'selected' : ''}>American English (Standard Faculty)</option>
              <option ${s.voicePersona.includes('Neutral') ? 'selected' : ''}>International English (Clear Neutral)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Proctoring & Integrity -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <h2 class="card-title">${isVi ? '2. Liêm Chính Học Thuật & Giám Sát Phòng Thi' : '2. Academic Integrity & Proctoring Checks'}</h2>
        </div>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <label class="form-checkbox">
            <input type="checkbox" id="settingWebcam" ${s.enableWebcamProctoring ? 'checked' : ''}>
            <div>
              <strong>${isVi ? 'Bắt buộc Bật Video Camera & Kiểm tra Tiếng ồn Môi trường' : 'Enforce Candidate Video Feed & Ambient Sound Check'}</strong>
              <div style="font-size: 0.775rem; color: var(--text-muted);">${isVi ? 'Truyền luồng hình ảnh trực tiếp lên màn hình giám sát của Hội đồng Giảng viên.' : 'Enables live webcam telemetry stream visible on the Lecturer Monitoring console.'}</div>
            </div>
          </label>

          <label class="form-checkbox">
            <input type="checkbox" id="settingTabMonitoring" ${s.enableTabMonitoring ? 'checked' : ''}>
            <div>
              <strong>${isVi ? 'Giám sát Chuyển Tab & Thoát Khỏi Màn Hình Thi' : 'Browser Focus & Tab Switch Monitoring'}</strong>
              <div style="font-size: 0.775rem; color: var(--text-muted);">${isVi ? 'Ghi nhận lại các lần thí sinh rời khỏi cửa sổ làm bài trong suốt buổi thi.' : 'Logs candidate tab unfocus events during oral examination sessions.'}</div>
            </div>
          </label>

          <label class="form-checkbox">
            <input type="checkbox" id="settingCandidateReplay" ${s.allowCandidateReplay ? 'checked' : ''}>
            <div>
              <strong>${isVi ? 'Cho Phép Thí Sinh Phát Lại Âm Thanh Câu Hỏi AI' : 'Allow Candidate to Replay AI Question Audio'}</strong>
              <div style="font-size: 0.775rem; color: var(--text-muted);">${isVi ? 'Thí sinh được phép nghe lại đề bài vấn đáp tối đa 2 lần.' : 'Provides candidates the option to listen to the prompt up to 2 times.'}</div>
            </div>
          </label>
        </div>
      </div>

      <!-- Retention -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">${isVi ? '3. Lưu Trữ Dữ Liệu & Hồ Sơ Khảo Thí' : '3. Data Retention & Academic Records'}</h2>
        </div>
        <div class="form-group" style="max-width: 400px;">
          <label class="form-label form-label-required">${isVi ? 'Thời Gian Lưu Trữ Bản Ghi Âm Vấn Đáp' : 'Audio Recordings Retention Period'}</label>
          <select id="settingRetention" class="form-select">
            <option value="180">${isVi ? '6 Tháng (Lưu trữ theo Học kỳ)' : '6 Months (Semester Archival)'}</option>
            <option value="365" selected>${isVi ? '1 Năm (Chu kỳ Năm học Chuẩn)' : '1 Year (Standard Degree Cycle)'}</option>
            <option value="730">${isVi ? '2 Năm (Phục vụ Kiểm định Chất lượng)' : '2 Years (Accreditation Audit)'}</option>
            <option value="9999">${isVi ? 'Vĩnh viễn (Lưu trữ Hồ sơ Quốc gia)' : 'Indefinite (Full Permanent Archival)'}</option>
          </select>
        </div>
      </div>
    </div>
  `;
}
