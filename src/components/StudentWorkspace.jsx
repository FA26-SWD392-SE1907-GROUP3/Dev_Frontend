import AttemptGrade from './common/AttemptGrade';
import React, { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, CalendarDays, UserRound, RefreshCw } from 'lucide-react';
import Interview from './Interview';
import ChangePassword from './common/ChangePassword';
import { api } from '../services/api';
import { button, Heading, Panel, Notice } from './api/parts';

const validUuid = value => /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(value);
const displayTime = value => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa xác định';
const displayStatus = value => ({ ACTIVE: 'Đang mở', SCHEDULED: 'Đã lên lịch', REGISTERED: 'Đã phân lịch', READY: 'Sẵn sàng', COMPLETED: 'Hoàn thành', IN_PROGRESS: 'Đang thi', CANCELLED: 'Đã hủy lịch', ABORTED: 'Đã dừng', ABSENT: 'Vắng thi' })[value] || value || '—';
const examAction = exam => exam.action || (['COMPLETED', 'CANCELLED', 'ABSENT'].includes(exam.status) ? 'VIEW' : exam.status === 'IN_PROGRESS' ? 'RESUME' : ['REGISTERED', 'READY'].includes(exam.status) ? 'START' : 'UNAVAILABLE');

export default function StudentWorkspace({ user }) {
  const [tab, setTab] = useState('overview');
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [room, setRoom] = useState(null);
  const [attempts, setAttempts] = useState({});
  const [attemptLoading, setAttemptLoading] = useState('');
  const [opening, setOpening] = useState('');
  const actionInFlight = useRef(false);

  async function loadExams() {
    setLoading(true); setError('');
    try {
      const data = await api.studentExams();
      if (!Array.isArray(data)) throw new Error('Dữ liệu lịch thi không đúng định dạng.');
      setExams(data);
    } catch (err) { setError(err.message || 'Không thể tải lịch thi.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    setRoom(null); setAttempts({});
    loadExams();
  }, [user.id]);

  async function openExam(id) {
    if (actionInFlight.current) return;
    if (!validUuid(id)) { setError('Mã lịch thi không hợp lệ.'); return; }
    actionInFlight.current = true; setOpening(id); setError('');
    try {
      // Resolve again on entry: another tab or the lecturer may have changed this schedule.
      const schedules = await api.studentExams();
      if (!Array.isArray(schedules)) throw new Error('Dữ liệu lịch thi không đúng định dạng.');
      setExams(schedules);
      const exam = schedules.find(item => item.id === id);
      if (!exam) throw new Error('Lịch thi không còn tồn tại. Hãy liên hệ giảng viên.');
      const action = examAction(exam);
      if (action === 'VIEW') { await loadAttempts(id); return; }
      if (action === 'UNAVAILABLE') throw new Error('Lịch thi chưa sẵn sàng. Hãy liên hệ giảng viên kiểm tra trạng thái.');
      if (action === 'RESUME' && !validUuid(exam.attemptId)) throw new Error('Không tìm thấy lượt đang thi. Hãy làm mới lịch thi hoặc liên hệ giảng viên.');
      setRoom({ candidateId: id, attemptId: action === 'RESUME' ? exam.attemptId : '' });
      setTab('schedules');
    } catch (err) { setError(err.message || 'Không thể mở phòng thi.'); }
    finally { actionInFlight.current = false; setOpening(''); }
  }
  function updateAttempt(id) {
    const candidateId = room.candidateId;
    setRoom(previous => ({ ...previous, attemptId: id }));
    setExams(previous => previous.map(exam => exam.id === candidateId ? { ...exam, status: 'IN_PROGRESS', action: 'RESUME', attemptId: id } : exam));
  }
  async function loadAttempts(id) {
    setAttemptLoading(id); setError('');
    try {
      const data = await api.studentAttempts(id);
      if (!Array.isArray(data)) throw new Error('Dữ liệu lượt thi không đúng định dạng.');
      setAttempts(previous => ({ ...previous, [id]: data }));
    } catch (err) { setError(err.message || 'Không thể tải lịch sử lượt thi.'); }
    finally { setAttemptLoading(''); }
  }
  const menu = [['overview', 'Tổng quan', LayoutDashboard], ['schedules', 'Lịch thi / Phòng thi', CalendarDays], ['profile', 'Tài khoản', UserRound]];
  return <div className="workspace-layout flex min-h-[calc(100vh-80px)]">
    <aside className="workspace-nav"><p className="nav-caption">KHÔNG GIAN SINH VIÊN</p>
      {menu.map(([key, title, Icon]) => <button key={key} className={`nav-item ${tab === key ? 'active' : ''}`} onClick={() => { setTab(key); setRoom(null); setAttempts({}); if (key !== 'profile') loadExams(); }}><Icon size={18}/>{title}</button>)}
    </aside>
    <main className="workspace-content flex-1 min-w-0 p-6 md:p-8 space-y-5">
      {room ? <Interview key={room.candidateId} candidateId={room.candidateId} attemptId={room.attemptId} onBack={() => { setRoom(null); setAttempts({}); loadExams(); }} onAttemptSaved={updateAttempt}/> : <>
        <Heading title={tab === 'profile' ? 'Tài khoản của tôi' : `Xin chào, ${user.fullName || user.email}`} subtitle={tab === 'profile' ? 'Thông tin tài khoản từ Spring Boot.' : 'Lịch thi được đồng bộ trực tiếp từ backend.'}/>
        {tab === 'profile' ? <><Panel title="Hồ sơ"><p><b>Họ tên:</b> {user.fullName || '—'}</p><p><b>Email:</b> {user.email}</p><p><b>Vai trò:</b> {user.role}</p></Panel><ChangePassword user={user}/></> : <>
          {error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>}
          <Panel title="Lịch thi của tôi">
            <div className="flex justify-end mb-3"><button type="button" className={button} onClick={loadExams} disabled={loading}><RefreshCw size={16} className="inline mr-2"/>{loading ? 'Đang tải...' : 'Làm mới'}</button></div>
            {loading && !exams.length ? <p>Đang tải lịch thi...</p> : !exams.length ? <Notice>Chưa có lịch thi được phân công. Nhờ giảng viên phân công bằng email tài khoản của bạn.</Notice> : <div className="space-y-3">
              {exams.map(exam => <div key={exam.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex flex-wrap justify-between gap-2"><strong>Kỳ thi: {exam.examTitle || 'Kỳ thi'}</strong><span>{displayStatus(exam.status)}</span></div>
                <p className="text-sm">Bắt đầu: {displayTime(exam.scheduledStart)} · Kết thúc: {displayTime(exam.scheduledEnd)}</p>
                
                <div className="flex flex-wrap gap-2">
                  {['START', 'RESUME'].includes(examAction(exam)) && <button type="button" className={button} disabled={!!opening || loading} onClick={() => openExam(exam.id)}>{opening === exam.id ? 'Đang mở...' : examAction(exam) === 'RESUME' ? 'Tiếp tục thi' : 'Vào phòng thi'}</button>}
                  {examAction(exam) === 'VIEW' && <button type="button" className={button} onClick={() => loadAttempts(exam.id)} disabled={attemptLoading === exam.id}>{attemptLoading === exam.id ? 'Đang tải...' : 'Xem lượt thi'}</button>}
                  {examAction(exam) === 'UNAVAILABLE' && <Notice>Lịch thi chưa sẵn sàng. Vui lòng liên hệ giảng viên.</Notice>}
                </div>
                {examAction(exam) === 'VIEW' && attempts[exam.id] && <div className="border-t pt-2 space-y-2">{attempts[exam.id].length === 0 ? <p className="text-sm">{exam.status === 'CANCELLED' ? 'Lịch thi đã bị hủy trước khi sinh viên bắt đầu. Chưa có lượt thi nào.' : 'Chưa có lượt thi nào.'}</p> : attempts[exam.id].map(a => <div key={a.id} className="text-sm space-y-1"><p>Lượt {a.attemptNo} — {displayStatus(a.status)}</p><p>Bắt đầu: {displayTime(a.startedAt)} · Kết thúc: {displayTime(a.endedAt)}</p>{a.status==='COMPLETED'&&<AttemptGrade attemptId={a.id}/>}</div>)}</div>}
              </div>)}
            </div>}
          </Panel>
        </>}
      </>}
    </main>
  </div>;
}
