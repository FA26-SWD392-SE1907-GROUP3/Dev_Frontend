import React, { useEffect, useState } from 'react';
import { LayoutDashboard, CalendarDays, UserRound, ArrowRight, RefreshCw, GraduationCap, Clock3, CheckCircle2, Mic, BookOpen, AlertCircle } from 'lucide-react';
import { request } from '../services/api';
import Interview from './Interview';

const time = value => value ? new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Chưa xác định';
const labels = { NOT_STARTED: 'Chưa bắt đầu', IN_PROGRESS: 'Đang thi', COMPLETED: 'Đã hoàn thành', MISSED: 'Đã bỏ lỡ' };
export default function StudentWorkspace({ user }) {
  const [tab, setTab] = useState('overview'), [items, setItems] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [version, setVersion] = useState(0), [selected, setSelected] = useState(null), [query, setQuery] = useState('');
  useEffect(() => {
    const abort = new AbortController(); setLoading(true); setError('');
    request('/my-schedules', { signal: abort.signal, timeoutMs: 15000 }).then(data => { if (!abort.signal.aborted) setItems(data); })
      .catch(e => { if (!abort.signal.aborted) setError(e.message); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [version]);
  const reload = () => setVersion(v => v + 1);
  const waiting = items.filter(s => s.status === 'NOT_STARTED' || s.status === 'IN_PROGRESS');
  const completed = items.filter(s => s.status === 'COMPLETED');
  const menu = [['overview', 'Tổng quan', LayoutDashboard], ['schedules', 'Lịch thi của tôi', CalendarDays], ['profile', 'Tài khoản của tôi', UserRound]];
  function openTab(key) { setTab(key); setSelected(null); setQuery(''); }
  return <div className="workspace-layout flex min-h-[calc(100vh-80px)]">
    <aside className="workspace-nav"><p className="nav-caption">KHÔNG GIAN SINH VIÊN</p>{menu.map(([key, title, Icon]) => <button key={key} className={`nav-item ${tab === key ? 'active' : ''}`} onClick={() => openTab(key)}><Icon size={18}/>{title}</button>)}</aside>
    <main className="workspace-content flex-1 min-w-0 p-6 md:p-8 space-y-6">
      {selected ? <Interview scheduleId={selected.scheduleId} readOnly={selected.status === 'COMPLETED' || selected.status === 'MISSED'} onBack={() => { setSelected(null); reload(); }} /> : <>
        <div className="student-page-heading"><div><p className="student-eyebrow">AIVES / SINH VIÊN</p><h1>{tab === 'overview' ? `Xin chào, ${user.fullName}.` : tab === 'schedules' ? 'Lịch thi của tôi' : 'Tài khoản của tôi'}</h1><p>{tab === 'overview' ? 'Theo dõi lịch thi và sẵn sàng cho buổi vấn đáp tiếp theo.' : tab === 'schedules' ? 'Các kỳ thi được giảng viên phân công cho tài khoản của bạn.' : 'Thông tin tài khoản đang đăng nhập vào hệ thống.'}</p></div><button className="student-reload" disabled={loading} onClick={reload}><RefreshCw size={15}/>{loading ? 'Đang tải...' : 'Tải lại'}</button></div>
        {tab !== 'profile' && error && <div className="student-error" role="alert"><AlertCircle size={18}/><div><strong>Chưa tải được lịch thi</strong><p>{error}</p></div><button onClick={reload}>Thử lại</button></div>}
        {tab === 'profile' ? <section className="student-profile"><div className="profile-intro"><span className="profile-avatar">{user.fullName?.charAt(0)}</span><div><h2>{user.fullName}</h2><p>Tài khoản Sinh viên</p></div></div><dl>{[['Tên đăng nhập', user.username], ['Email', user.email], ['Vai trò', 'Sinh viên'], ['Trạng thái', user.status === 'ACTIVE' ? 'Đang hoạt động' : user.status]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Chưa cập nhật'}</dd></div>)}</dl><p className="profile-note">Nếu cần cập nhật thông tin hoặc được cấp quyền Giảng viên, hãy liên hệ quản trị viên của nhóm.</p></section> : <>
          {tab === 'overview' && <><div className="student-stats">{[[CalendarDays,'Tổng lịch thi',items.length],[Clock3,'Chưa hoàn thành',waiting.length],[CheckCircle2,'Đã hoàn thành',completed.length]].map(([Icon,label,count]) => <article key={label}><span className="stat-icon"><Icon size={20}/></span><div><p>{label}</p><strong>{loading || error ? '—' : count}</strong></div></article>)}</div>
          <section className="student-welcome"><div><span className="student-eyebrow">CHUẨN BỊ CHO KỲ THI</span><h2>Tự tin thể hiện kiến thức của bạn.</h2><p>Kiểm tra lịch thi, chuẩn bị microphone và chọn không gian yên tĩnh trước khi bắt đầu.</p><button onClick={() => openTab('schedules')}>Xem lịch thi <ArrowRight size={16}/></button></div><span className="welcome-mic"><Mic size={44}/></span></section></>}
          <section className="student-schedules"><div className="schedule-section-heading"><h2>{tab === 'overview' ? 'Lịch thi được phân công' : 'Danh sách lịch thi'}</h2>{tab === 'schedules' && <input aria-label="Tìm kỳ thi" placeholder="Tìm theo tên kỳ thi..." value={query} onChange={e => setQuery(e.target.value)}/>}</div>
            {loading ? <div className="student-empty" role="status"><RefreshCw size={28}/><h3>Đang tải lịch thi</h3><p>Đang lấy dữ liệu từ máy chủ...</p></div> : error ? <div className="student-empty"><AlertCircle size={32}/><h3>Lịch thi chưa khả dụng</h3><p>Nhấn Thử lại ở thông báo phía trên để tải lại dữ liệu.</p></div> : items.length === 0 ? <div className="student-empty"><span className="empty-icon"><CalendarDays size={30}/></span><h3>Bạn chưa được phân công lịch thi</h3><p>Tài khoản của bạn đã sẵn sàng. Khi giảng viên thêm bạn vào kỳ thi, lịch thi sẽ xuất hiện tại đây.</p><div className="student-howto"><span><BookOpen size={16}/> Giảng viên tạo kỳ thi</span><ArrowRight size={14}/><span><GraduationCap size={16}/> Thêm tài khoản của bạn</span><ArrowRight size={14}/><span><Mic size={16}/> Bạn vào phòng thi</span></div><p className="student-username">Gửi tên đăng nhập <strong>{user.username}</strong> cho giảng viên để được xếp lịch.</p></div> : <div className="schedule-list">{items.filter(s => s.examName?.toLowerCase().includes(query.toLowerCase())).map(s => <article key={s.scheduleId}><span className="schedule-icon"><CalendarDays size={22}/></span><div className="schedule-detail"><h3>{s.examName}</h3><p><Clock3 size={13}/> {time(s.allocatedStartTime)} — {time(s.allocatedEndTime)}</p><span className={`schedule-status status-${s.status.toLowerCase()}`}>{labels[s.status] || s.status}</span></div><button onClick={() => setSelected(s)}>{s.status === 'COMPLETED' ? 'Xem transcript' : s.status === 'MISSED' ? 'Xem chi tiết' : 'Vào phòng thi'}<ArrowRight size={15}/></button></article>)}{items.filter(s => s.examName?.toLowerCase().includes(query.toLowerCase())).length === 0 && <p className="p-6 text-mutedtext">Không tìm thấy kỳ thi phù hợp.</p>}</div>}
          </section>
          {tab === 'overview' && <p className="student-footnote">Chỉ lịch thi được gán cho tài khoản của bạn mới xuất hiện. Ngân hàng câu hỏi và quản lý kỳ thi dành cho Giảng viên/Admin.</p>}
        </>}
      </>}
    </main>
  </div>;
}
