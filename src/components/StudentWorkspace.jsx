import React, { useEffect, useState } from 'react';
import { LayoutDashboard, CalendarDays, UserRound, RefreshCw } from 'lucide-react';
import Interview from './Interview';
import ChangePassword from './common/ChangePassword';
import { api } from '../services/api';
import { button, Heading, Panel, Notice } from './api/parts';

const validUuid = value => /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(value);
const displayTime = value => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa xác định';
const displayStatus = value => ({ ACTIVE: 'Đang mở', SCHEDULED: 'Đã lên lịch', COMPLETED: 'Hoàn thành', IN_PROGRESS: 'Đang thi' })[value] || value || '—';

export default function StudentWorkspace({ user }) {
  const [tab, setTab] = useState('overview');
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [examCandidate, setExamCandidate] = useState('');
  const [attemptId, setAttemptId] = useState('');
  const [attempts, setAttempts] = useState({});
  const [attemptLoading, setAttemptLoading] = useState('');
  const savedKey = `aives-student-attempt-${user.id}`;

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
    try {
      const saved = JSON.parse(sessionStorage.getItem(savedKey) || 'null');
      if (saved) { setCandidateId(saved.candidateId || ''); setAttemptId(saved.attemptId || ''); }
    } catch { /* invalid saved session */ }
    loadExams();
  }, [savedKey]);

  function openExam(id, existingAttempt = '') {
    if (!validUuid(id)) { setError('Candidate ID không hợp lệ.'); return; }
    setCandidateId(id); setAttemptId(existingAttempt); setExamCandidate(id); setTab('schedules');
    if (existingAttempt) sessionStorage.setItem(savedKey, JSON.stringify({ candidateId: id, attemptId: existingAttempt }));
  }
  function updateAttempt(id) {
    setAttemptId(id);
    sessionStorage.setItem(savedKey, JSON.stringify({ candidateId: examCandidate, attemptId: id }));
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
      {menu.map(([key, title, Icon]) => <button key={key} className={`nav-item ${tab === key ? 'active' : ''}`} onClick={() => { setTab(key); setExamCandidate(''); }}><Icon size={18}/>{title}</button>)}
    </aside>
    <main className="workspace-content flex-1 min-w-0 p-6 md:p-8 space-y-5">
      {examCandidate ? <Interview candidateId={examCandidate} attemptId={attemptId} onBack={() => { setExamCandidate(''); loadAttempts(examCandidate); }} onAttemptSaved={updateAttempt}/> : <>
        <Heading title={tab === 'profile' ? 'Tài khoản của tôi' : `Xin chào, ${user.fullName || user.email}`} subtitle={tab === 'profile' ? 'Thông tin tài khoản từ Spring Boot.' : 'Lịch thi được đồng bộ trực tiếp từ backend.'}/>
        {tab === 'profile' ? <><Panel title="Hồ sơ"><p><b>Họ tên:</b> {user.fullName || '—'}</p><p><b>Email:</b> {user.email}</p><p><b>Vai trò:</b> {user.role}</p></Panel><ChangePassword user={user}/></> : <>
          {error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>}
          <Panel title="Lịch thi của tôi">
            <div className="flex justify-end mb-3"><button type="button" className={button} onClick={loadExams} disabled={loading}><RefreshCw size={16} className="inline mr-2"/>{loading ? 'Đang tải...' : 'Làm mới'}</button></div>
            {loading && !exams.length ? <p>Đang tải lịch thi...</p> : !exams.length ? <Notice>Chưa có lịch thi được phân công. Nhờ giảng viên phân công bằng email tài khoản của bạn.</Notice> : <div className="space-y-3">
              {exams.map(exam => <div key={exam.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex flex-wrap justify-between gap-2"><strong>Kỳ thi: {exam.examTitle || 'Kỳ thi'}</strong><span>{displayStatus(exam.status)}</span></div>
                <p className="text-sm">Bắt đầu: {displayTime(exam.scheduledStart)} · Kết thúc: {displayTime(exam.scheduledEnd)}</p>
                
                <div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={() => openExam(exam.id)}>Vào phòng thi</button><button type="button" className={button} onClick={() => loadAttempts(exam.id)} disabled={attemptLoading === exam.id}>{attemptLoading === exam.id ? 'Đang tải...' : 'Xem lượt thi'}</button></div>
                {attempts[exam.id] && <div className="border-t pt-2 space-y-2">{attempts[exam.id].length === 0 ? <p className="text-sm">Chưa có lượt thi nào.</p> : attempts[exam.id].map(a => <div key={a.id} className="text-sm flex flex-wrap items-center justify-between gap-2"><span>Lượt {a.attemptNo} — {displayStatus(a.status)} · {displayTime(a.startedAt)}</span>{['IN_PROGRESS', 'STARTED'].includes(a.status) && <button type="button" className={button} onClick={() => openExam(exam.id, a.id)}>Tiếp tục</button>}</div>)}</div>}
              </div>)}
            </div>}
          </Panel>
                    {attemptId && <Panel title="Tiếp tục lượt thi đã lưu"><p className="text-xs break-all">Attempt ID: {attemptId}</p><button type="button" className={button} onClick={() => openExam(candidateId, attemptId)}>Mở lại lượt thi</button></Panel>}
        </>}
      </>}
    </main>
  </div>;
}
