// Screen 1: Login Page
import { state } from '../state.js';
import { t } from '../i18n.js';

export function renderLoginView() {
  const isVi = state.lang === 'vi';
  return `
    <div class="login-view-wrapper">
      <div style="position: absolute; top: 20px; right: 20px; display: flex; gap: 8px; align-items: center; z-index: 10;">
        <!-- Language Switcher Pill -->
        <div class="role-quick-switcher" title="Chuyển đổi ngôn ngữ / Switch Language">
          <button class="role-switcher-btn ${state.lang === 'vi' ? 'active' : ''}" onclick="window.app.setLanguage('vi')">🇻🇳 Tiếng Việt</button>
          <button class="role-switcher-btn ${state.lang === 'en' ? 'active' : ''}" onclick="window.app.setLanguage('en')">🇬🇧 English</button>
        </div>
        <!-- Theme Toggle -->
        <button class="header-icon-btn" title="${state.theme === 'dark' ? t('themeLight') : t('themeDark')}" onclick="window.app.toggleTheme()">
          ${state.theme === 'dark' ? `
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ` : `
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          `}
        </button>
      </div>

      <div class="login-card">
        <div class="login-brand">
          <div class="login-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <h1>AIVES</h1>
          <p>${t('appSubtitle')} • ${t('appPortal')}</p>
        </div>

        <form id="loginForm" onsubmit="event.preventDefault(); window.app.handleLogin();">
          <div class="form-group">
            <label class="form-label">${isVi ? 'Email / Mã định danh Cán bộ hoặc Sinh viên' : 'Email / Student or Staff ID'}</label>
            <input type="text" id="loginIdentifier" class="form-input" placeholder="e.g. e.vance@aives.edu or AIVES-2024-0101" value="e.vance@aives.edu" required>
          </div>

          <div class="form-group">
            <label class="form-label">${isVi ? 'Mật khẩu' : 'Password'}</label>
            <input type="password" id="loginPassword" class="form-input" placeholder="••••••••••••" value="password123" required>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <label class="form-checkbox">
              <input type="checkbox" checked>
              <span>${isVi ? 'Ghi nhớ đăng nhập' : 'Remember me'}</span>
            </label>
            <a href="#" style="font-size: 0.8rem;" onclick="alert(window.app && window.app.state && window.app.state.lang === 'vi' ? 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email học viện của bạn.' : 'Password reset instructions have been dispatched to your institutional email.'); return false;">${isVi ? 'Quên mật khẩu?' : 'Forgot password?'}</a>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 10px;">
            ${t('signIn')}
          </button>
        </form>

        <div class="quick-persona-section">
          <div class="quick-persona-title">${isVi ? 'Đăng nhập Nhanh với Vai trò Mẫu' : 'Instant Prototype Access (Select Role)'}</div>
          <div class="quick-persona-grid">
            <button class="persona-btn" onclick="window.app.switchPersona('lecturer')">
              <div>
                <div class="persona-name">Dr. Eleanor Vance</div>
                <div class="persona-role">${isVi ? 'Giảng viên Hội đồng • Kỹ thuật Phần mềm (SE)' : 'Senior Examiner • Software Engineering'}</div>
              </div>
              <span class="status-badge badge-published">${t('roleLecturer')}</span>
            </button>

            <button class="persona-btn" onclick="window.app.switchPersona('student')">
              <div>
                <div class="persona-name">Alex Morgan</div>
                <div class="persona-role">${isVi ? 'Thí sinh / Sinh viên • MSSV: SE180101' : 'Candidate • Roll No: SE180101'}</div>
              </div>
              <span class="status-badge badge-scheduled">${t('roleStudent')}</span>
            </button>

            <button class="persona-btn" onclick="window.app.switchPersona('admin')">
              <div>
                <div class="persona-name">Marcus Chen</div>
                <div class="persona-role">${isVi ? 'Trưởng ban Khảo thí & Quản trị Hệ thống' : 'Examination Administrator'}</div>
              </div>
              <span class="status-badge badge-finalized">${t('roleAdmin')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
