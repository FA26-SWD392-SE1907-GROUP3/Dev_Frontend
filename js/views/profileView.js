// Screen 25: User Profile
import { state } from '../state.js';
import { t } from '../i18n.js';

export function renderProfileView() {
  const user = state.currentUser || state.data.users[1];
  const isVi = state.lang === 'vi';

  return `
    <div class="content-container" style="max-width: 800px;">
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isVi ? 'Hồ Sơ & Tùy Chọn Tài Khoản' : 'Account Profile & Preferences'}</h1>
          <p>${isVi ? 'Thông tin danh tính học viện, cấu hình thiết bị âm thanh và giao diện hệ thống.' : 'Institutional identity, audio peripherals configuration, and visual theme settings.'}</p>
        </div>
      </div>

      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 20px;">
          <div class="user-avatar" style="width: 64px; height: 64px; font-size: 1.4rem;">
            ${user.name.split(' ').map(n=>n[0]).join('')}
          </div>
          <div>
            <h2 style="font-size: 1.25rem;">${user.name}</h2>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
              ${user.department} • <span class="status-badge badge-published">${user.role === 'Lecturer' ? t('roleLecturer') : user.role === 'Admin' ? t('roleAdmin') : t('roleStudent')}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-light); margin-top: 4px;">
              ${isVi ? 'Mã số Học viện:' : 'Institutional ID:'} <code>${user.id}</code>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label form-label-required">${isVi ? 'Họ và Tên' : 'Full Legal Name'}</label>
            <input type="text" id="profileFullName" class="form-input" value="${user.name}">
          </div>
          <div class="form-group">
            <label class="form-label">${isVi ? 'Email Học viện' : 'Institutional Email'}</label>
            <input type="email" class="form-input" value="${user.email}" readonly style="background-color: var(--bg-subtle);">
          </div>
          <div class="form-group">
            <label class="form-label form-label-required">${isVi ? 'Khoa / Viện Đào tạo' : 'Academic Department / Faculty'}</label>
            <input type="text" id="profileDepartment" class="form-input" value="${user.department}">
          </div>
          <div class="form-group">
            <label class="form-label">${isVi ? 'Vai trò Hệ thống' : 'System Role Authority'}</label>
            <input type="text" class="form-input" value="${user.role === 'Lecturer' ? t('roleLecturer') : user.role === 'Admin' ? t('roleAdmin') : t('roleStudent')}" readonly style="background-color: var(--bg-subtle);">
          </div>
        </div>
      </div>

      <!-- Language Preferences (Chuyển đổi ngôn ngữ Tiếng Việt / English) -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <div>
            <h2 class="card-title">🌐 ${isVi ? 'Ngôn Ngữ Giao Diện' : 'Interface Language'}</h2>
            <div class="card-subtitle">${isVi ? 'Chọn ngôn ngữ hiển thị chính trên toàn bộ hệ thống AIVES' : 'Select your preferred language for the system interface'}</div>
          </div>
        </div>

        <div class="grid-2">
          <div style="padding: 16px; border: 2px solid ${state.lang === 'vi' ? 'var(--primary)' : 'var(--border-subtle)'}; border-radius: var(--radius-md); background: var(--bg-surface); cursor: pointer;" onclick="window.app.setLanguage('vi')">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <strong style="color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                🇻🇳 Tiếng Việt
              </strong>
              ${state.lang === 'vi' ? `<span class="status-badge badge-published">${isVi ? 'Đang dùng' : 'Active'}</span>` : ''}
            </div>
            <p style="font-size: 0.775rem; color: var(--text-muted);">${isVi ? 'Giao diện hoàn toàn bằng tiếng Việt với các thuật ngữ học thuật và khảo thí chuẩn đại học.' : 'Vietnamese interface tailored for domestic academic institutions.'}</p>
          </div>

          <div style="padding: 16px; border: 2px solid ${state.lang === 'en' ? 'var(--primary)' : 'var(--border-subtle)'}; border-radius: var(--radius-md); background: var(--bg-surface); cursor: pointer;" onclick="window.app.setLanguage('en')">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <strong style="color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                🇬🇧 English (UK / US)
              </strong>
              ${state.lang === 'en' ? `<span class="status-badge badge-published">${isVi ? 'Đang dùng' : 'Active'}</span>` : ''}
            </div>
            <p style="font-size: 0.775rem; color: var(--text-muted);">${isVi ? 'Giao diện tiếng Anh học thuật chuẩn quốc tế phục vụ các chương trình liên kết.' : 'Standard international academic English interface for international examination governance.'}</p>
          </div>
        </div>
      </div>

      <!-- Theme & Interface Preferences (Chế độ sáng tối) -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <div>
            <h2 class="card-title">${isVi ? 'Giao Diện & Chế Độ Sáng / Tối' : 'Interface Appearance & Theme'}</h2>
            <div class="card-subtitle">${isVi ? 'Lựa chọn phong cách hiển thị sáng rõ ban ngày hoặc tối êm dịu mắt' : 'Choose your preferred visual presentation for high contrast or low-light conditions'}</div>
          </div>
        </div>

        <div class="grid-2">
          <div style="padding: 16px; border: 2px solid ${state.theme === 'light' ? 'var(--primary)' : 'var(--border-subtle)'}; border-radius: var(--radius-md); background: var(--bg-surface); cursor: pointer;" onclick="window.app.setTheme('light')">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <strong style="color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                ☀️ ${isVi ? 'Chế độ Sáng (Light Academic)' : 'Light Academic Theme'}
              </strong>
              ${state.theme === 'light' ? `<span class="status-badge badge-published">${isVi ? 'Đang dùng' : 'Active'}</span>` : ''}
            </div>
            <p style="font-size: 0.775rem; color: var(--text-muted);">${isVi ? 'Nền sáng trang nhã, độ tương phản sắc nét phục vụ công tác khảo thí ban ngày.' : 'Crisp white and soft slate surfaces engineered for daytime examination management.'}</p>
          </div>

          <div style="padding: 16px; border: 2px solid ${state.theme === 'dark' ? 'var(--primary)' : 'var(--border-subtle)'}; border-radius: var(--radius-md); background: var(--bg-surface); cursor: pointer;" onclick="window.app.setTheme('dark')">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <strong style="color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                🌙 ${isVi ? 'Chế độ Tối (Dark Slate)' : 'Dark Slate Theme'}
              </strong>
              ${state.theme === 'dark' ? `<span class="status-badge badge-published">${isVi ? 'Đang dùng' : 'Active'}</span>` : ''}
            </div>
            <p style="font-size: 0.775rem; color: var(--text-muted);">${isVi ? 'Tông màu xanh đen dịu mắt, chống mỏi mắt khi chấm thi và theo dõi phiên thi dài.' : 'Deep navy and slate surfaces designed to minimize eye strain during long viva grading sessions.'}</p>
          </div>
        </div>
      </div>

      <!-- Examination Audio Preferences -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <div>
            <h2 class="card-title">${isVi ? 'Cài Đặt Âm Thanh & Giọng Đọc Vấn Đáp' : 'Viva Audio & Speech Synthesis Preferences'}</h2>
            <div class="card-subtitle">${isVi ? 'Các thiết bị ngoại vi được sử dụng trong các buổi thi vấn đáp trực tuyến' : 'Peripherals utilized during oral examination sessions'}</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">${isVi ? 'Microphone Thu Âm Mặc Định' : 'Default Microphone Device'}</label>
            <select class="form-select" id="prefMic">
              <option>${isVi ? 'Micro Mặc định của Hệ thống' : 'Default System Microphone (Internal Array)'}</option>
              <option>${isVi ? 'Micro Tai nghe Chống ồn' : 'Headset Microphone (Noise Cancelling)'}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${isVi ? 'Thiết Bị Loa Phát Mặc Định' : 'Default Speaker Device'}</label>
            <select class="form-select" id="prefSpeaker">
              <option>${isVi ? 'Loa Ngoài Mặc định của Máy' : 'Default System Output Speakers'}</option>
              <option>${isVi ? 'Tai nghe Stereo Chuyên dụng' : 'Headphones (Stereo Output)'}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${isVi ? 'Giọng Đọc Giám Khảo AI' : 'AI Examiner Voice Persona'}</label>
            <select class="form-select" id="prefVoice">
              <option>British English (Natural Academic)</option>
              <option>American English (Standard Faculty)</option>
              <option>International English (Clear Neutral)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${isVi ? 'Tốc Độ Phát Âm' : 'Speech Pacing'}</label>
            <select class="form-select" id="prefPacing">
              <option>${isVi ? 'Tiêu chuẩn (1.0x)' : 'Standard (1.0x)'}</option>
              <option selected>${isVi ? 'Học thuật Rõ ràng (0.95x)' : 'Careful Academic (0.95x)'}</option>
              <option>${isVi ? 'Nhanh (1.1x)' : 'Brisk (1.1x)'}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Password & Security -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <h2 class="card-title">${isVi ? 'Bảo Mật Tài Khoản Học Viện' : 'Institutional Account Security'}</h2>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">${isVi ? 'Mật khẩu Hiện tại' : 'Current Password'}</label>
            <input type="password" id="currentPass" class="form-input" placeholder="••••••••">
          </div>
          <div class="form-group">
            <label class="form-label">${isVi ? 'Mật khẩu Mới' : 'New Password'}</label>
            <input type="password" id="newPass" class="form-input" placeholder="${isVi ? 'Tối thiểu 8 ký tự' : 'Min. 8 characters'}">
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn btn-secondary" onclick="window.app.navigate('lecturer-dashboard')">${isVi ? 'Hủy' : 'Cancel'}</button>
        <button class="btn btn-primary" onclick="window.app.saveProfileChanges()">${isVi ? 'Lưu Hồ Sơ & Cài Đặt' : 'Save Profile & Preferences'}</button>
      </div>
    </div>
  `;
}
