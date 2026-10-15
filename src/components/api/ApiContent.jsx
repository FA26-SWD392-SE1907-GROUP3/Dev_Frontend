import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import AdminCourses from '../admin/AdminCourses';
import { request, allSubjects, download } from '../../services/api';
import Interview from '../Interview';
import { BookOpen, Users, Files, CircleHelp, CalendarDays, GraduationCap } from 'lucide-react';

const buttonClass = 'px-3 py-2 rounded-lg border border-appborder hover:bg-canvas disabled:opacity-40';
const inputClass = 'w-full p-3 rounded-lg border border-appborder bg-canvas';
const blooms = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE'];
const option = (value, label = value) => ({ value, label });
export function useData(path) {
  const [items, setItems] = useState([]), [error, setError] = useState(''), [loading, setLoading] = useState(true), [version, setVersion] = useState(0);
  useEffect(() => {
    const abort = new AbortController(); setLoading(true); setError('');
    request(path, { signal: abort.signal, timeoutMs: 15000 }).then(result => { if (!abort.signal.aborted) setItems(Array.isArray(result) ? result : result?.content || []); })
      .catch(error => { if (error.name !== 'AbortError') { setError(error.message); setItems([]); } })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [path, version]);
  return { items, error, loading, reload: () => setVersion(v => v + 1) };
}
function Field({ field, value, onChange }) {
  const options = field.options || [];
  const update = e => onChange(field.type === 'number' || field.numeric ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value);
  return <label className="block text-sm">{field.label}
    {field.type === 'select' ? <select aria-label={field.label} required={!field.optional} className={inputClass} value={value ?? ''} onChange={update}>
      <option value="">Chọn...</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select> : field.type === 'textarea' ? <textarea required={!field.optional} maxLength={field.maxLength} className={inputClass} value={value ?? ''} onChange={update} rows={3} /> : <input className={inputClass} required={!field.optional} type={field.type || 'text'} min={field.min} max={field.max} step={field.type === 'datetime-local' ? 1 : field.step} maxLength={field.maxLength} value={field.type === 'datetime-local' && value ? String(value).slice(0,19) : value ?? ''} onChange={update} />}
  </label>;
}
export function Crud({ title, path, idKey, fields, editFields = fields, columns, extra, toolbar, allowCreate = true, allowEdit = true, allowDelete = true, deletePath, version = 0 }) {
  const data = useData(path); const [form, setForm] = useState(null), [editing, setEditing] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [query, setQuery] = useState('');
  useEffect(() => { data.reload(); }, [version]);
  function open(item) {
    setEditing(item); const selected = item ? editFields : fields;
    setForm(Object.fromEntries(selected.map(f => [f.name, item?.[f.name] ?? f.default ?? '']))); setError('');
  }
  async function run(action) { setBusy(true); setError(''); try { await action(); data.reload(); } catch (error) { setError(error.message); } finally { setBusy(false); } }
  async function save(event) {
    event.preventDefault();
    await run(async () => {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' && (editing ? editFields : fields).find(f => f.name === k)?.optional ? null : v]));
      await request(editing ? `${path}/${editing[idKey]}` : path, { method: editing ? 'PUT' : 'POST', body: payload }); setForm(null);
    });
  }
  const shown = data.items.filter(item => columns.some(c => String(item[c.name] ?? '').toLowerCase().includes(query.toLowerCase())));
  return <section className="space-y-5">
    <div className="flex justify-between items-center flex-wrap gap-3"><h1 className="text-2xl font-bold">{title}</h1><div className="flex gap-2">{toolbar?.(data.reload)}<button className={buttonClass} onClick={data.reload}>Tải lại</button>{allowCreate && <button className={buttonClass} disabled={busy} onClick={() => open(null)}>Thêm</button>}</div></div>
    <input className={inputClass} placeholder="Tìm trong danh sách..." value={query} onChange={e => setQuery(e.target.value)} />
    {(error || data.error) && <p role="alert" className="text-red-600">{error || data.error}</p>}
    <div className="overflow-x-auto bg-surface border border-appborder rounded-xl"><table className="w-full text-left text-sm"><thead><tr>{columns.map(c => <th className="p-4" key={c.name}>{c.label}</th>)}<th className="p-4">Thao tác</th></tr></thead><tbody>
      {data.loading ? <tr><td className="p-4" colSpan={columns.length + 1}>Đang tải...</td></tr> : shown.length === 0 ? <tr><td className="p-4" colSpan={columns.length + 1}>{data.error ? 'Chưa tải được dữ liệu.' : 'Chưa có dữ liệu.'}</td></tr> : shown.map(item => <tr key={item[idKey]} className="border-t border-appborder">{columns.map(c => <td key={c.name} className="p-4 max-w-sm break-words">{String(item[c.name] ?? '—')}</td>)}<td className="p-4"><div className="flex flex-wrap gap-2">
        {allowEdit && <button disabled={busy} className={buttonClass} onClick={() => open(item)}>Sửa</button>}
        {allowDelete && <button disabled={busy} className={`${buttonClass} text-red-600`} onClick={() => { if (window.confirm('Xóa bản ghi này?')) run(() => request(deletePath ? deletePath(item) : `${path}/${item[idKey]}`, { method: 'DELETE' })); }}>Xóa</button>}
        {extra?.(item, action => run(action), data.reload, busy)}
      </div></td></tr>)}
    </tbody></table></div>
    <Modal isOpen={form !== null} onClose={() => { if (!busy) setForm(null); }} title={editing ? `Sửa ${title}` : `Thêm ${title}`}>
      {form && <form onSubmit={save} className="space-y-4">{(editing ? editFields : fields).map(f => <Field key={f.name} field={f} value={form[f.name]} onChange={value => setForm({ ...form, [f.name]: value })} />)}{error && <p role="alert" className="text-red-600">{error}</p>}<button disabled={busy} className="w-full p-3 bg-primary text-white rounded-lg">{busy ? 'Đang lưu...' : 'Lưu'}</button></form>}
    </Modal>
  </section>;
}
function DocumentView({ subjects }) {
  const data = useData('/documents'); const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [subjectId, setSubjectId] = useState(''), [title, setTitle] = useState(''), [file, setFile] = useState(null);
  const [generation, setGeneration] = useState(null), [topic, setTopic] = useState(''), [count, setCount] = useState(3), [bloom, setBloom] = useState('UNDERSTAND');
  async function run(action) { setBusy(true); setError(''); try { await action(); data.reload(); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  return <section className="space-y-5"><h1 className="text-2xl font-bold">Tài liệu môn học</h1>
    <form className="bg-surface p-5 rounded-xl border border-appborder space-y-3" onSubmit={e => { e.preventDefault(); run(async () => { const form = new FormData(); form.append('subjectId', subjectId); form.append('title', title); form.append('file', file); await request('/documents', { method: 'POST', body: form }); setTitle(''); }); }}>
      <Field field={{ label: 'Môn học', type: 'select', options: subjects.map(s => option(s.subjectId, s.subjectCode)) }} value={subjectId} onChange={setSubjectId} />
      <Field field={{ label: 'Tên tài liệu', maxLength: 200 }} value={title} onChange={setTitle} />
      <input type="file" required accept=".pdf,.docx,.pptx,.txt" onChange={e => setFile(e.target.files[0])} /><p className="text-sm text-mutedtext">PDF, DOCX, PPTX hoặc TXT, tối đa 20 MB. PDF quét ảnh cần OCR trước.</p>
      <button disabled={busy} className={buttonClass}>{busy ? 'Đang xử lý...' : 'Tải lên và lập chỉ mục'}</button>
    </form>
    {(error || data.error) && <p role="alert" className="text-red-600">{error || data.error}</p>}
    <button className={buttonClass} onClick={data.reload}>Tải lại</button>
    {data.loading ? <p>Đang tải...</p> : data.items.length === 0 ? <p>Chưa có tài liệu.</p> : data.items.map(d => <article key={d.documentId} className="bg-surface p-4 border border-appborder rounded-xl flex flex-wrap justify-between gap-3"><div><strong>{d.title}</strong><p>{d.fileType} · {d.status}</p></div><div className="flex flex-wrap gap-2">
      <button disabled={busy} className={buttonClass} onClick={() => run(() => download(`/documents/${d.documentId}/download`, `document.${d.fileType.toLowerCase()}`))}>Tải file</button>
      <button disabled={busy} className={buttonClass} onClick={() => { const name = window.prompt('Tên tài liệu', d.title); if (name?.trim()) run(() => request(`/documents/${d.documentId}`, { method: 'PUT', body: { title: name } })); }}>Đổi tên</button>
      <button disabled={busy} className={buttonClass} onClick={() => run(() => request(`/documents/${d.documentId}/reindex`, { method: 'POST' }))}>Lập chỉ mục lại</button>
      <button disabled={busy || d.status !== 'INDEXED'} className={buttonClass} onClick={() => { setGeneration(d); setError(''); }}>AI sinh câu hỏi</button>
      <button disabled={busy} className={`${buttonClass} text-red-600`} onClick={() => { if (window.confirm('Xóa tài liệu?')) run(() => request(`/documents/${d.documentId}`, { method: 'DELETE' })); }}>Xóa</button>
    </div></article>)}
    <Modal isOpen={!!generation} onClose={() => { if (!busy) setGeneration(null); }} title="Sinh câu hỏi từ tài liệu">
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); run(async () => { await request(`/documents/${generation.documentId}/generate`, { method: 'POST', body: { topic, count: Number(count), bloomLevel: bloom } }); setGeneration(null); }); }}>
        <Field field={{ label: 'Chủ đề', maxLength: 150 }} value={topic} onChange={setTopic} /><Field field={{ label: 'Số câu hỏi', type: 'number', min: 1, max: 10 }} value={count} onChange={setCount} /><Field field={{ label: 'Bloom', type: 'select', options: blooms.map(b => option(b)) }} value={bloom} onChange={setBloom} />
        {error && <p role="alert" className="text-red-600">{error}</p>}<button disabled={busy} className={buttonClass}>{busy ? 'AI đang xử lý...' : 'Sinh câu hỏi và rubric chờ duyệt'}</button>
      </form>
    </Modal>
  </section>;
}
export default function ApiContent({ user, section }) {
  const admin = user.role === 'ADMIN', student = user.role === 'STUDENT';
  const tab = section;
  const [subjects, setSubjects] = useState([]), [users, setUsers] = useState([]), [documents, setDocuments] = useState([]), [referenceError, setReferenceError] = useState(''), [referenceVersion, setReferenceVersion] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState(null), [selectedExam, setSelectedExam] = useState(null), [selectedSchedule, setSelectedSchedule] = useState(null);
  const [importOpen, setImportOpen] = useState(false), [importText, setImportText] = useState(''), [importError, setImportError] = useState(''), [importBusy, setImportBusy] = useState(false), [questionVersion, setQuestionVersion] = useState(0);
  useEffect(() => {
    const abort = new AbortController(); setReferenceError('');
    Promise.all([allSubjects(abort.signal), student ? Promise.resolve([]) : request('/users', { signal: abort.signal }), student ? Promise.resolve([]) : request('/documents', { signal: abort.signal })]).then(([s, u, d]) => { setSubjects(s); setUsers(u); setDocuments(d); }).catch(e => { if (e.name !== 'AbortError') setReferenceError(e.message); });
    return () => abort.abort();
  }, [student, tab, referenceVersion]);
  const subjectField = { name: 'subjectId', label: 'Môn học', type: 'select', numeric: true, options: subjects.map(s => option(s.subjectId, `${s.subjectCode} · ${s.subjectName}`)) };
  const questionFields = [subjectField, { name: 'documentId', label: 'Tài liệu nguồn (tùy chọn)', optional: true, type: 'select', numeric: true, options: documents.map(d => option(d.documentId, d.title)) }, { name: 'topic', label: 'Chủ đề', optional: true, maxLength: 150 }, { name: 'questionContent', label: 'Câu hỏi', type: 'textarea', maxLength: 20000 }, { name: 'bloomLevel', label: 'Bloom', type: 'select', options: blooms.map(b => option(b)), default: 'UNDERSTAND' }];
  const rubricFields = [{ name: 'criteriaName', label: 'Tiêu chí', maxLength: 255 }, { name: 'maxScore', label: 'Điểm tối đa', type: 'number', min: 0.01, max: 999.99, step: 0.01 }, { name: 'guideline', label: 'Hướng dẫn chấm', type: 'textarea', optional: true }];
  const examFields = [subjectField, { name: 'examName', label: 'Tên kỳ thi', maxLength: 200 }, { name: 'startTime', label: 'Bắt đầu', type: 'datetime-local' }, { name: 'endTime', label: 'Kết thúc', type: 'datetime-local' }, { name: 'maxMainQuestions', label: 'Số câu chính', type: 'number', min: 1, max: 50, default: 3 }, { name: 'maxFollowUpQuestions', label: 'Hỏi thêm tối đa mỗi câu chính', type: 'number', min: 0, max: 5, default: 2 }, { name: 'answerTimeLimitSeconds', label: 'Thời gian mỗi câu (giây)', type: 'number', min: 15, max: 1800, default: 120 }];
  return <div className="api-content space-y-5">
      {referenceError && <p role="alert" className="text-red-600">{referenceError} <button onClick={() => setReferenceVersion(v => v + 1)}>Thử lại</button></p>}
      {tab === 'subjects' && <AdminCourses t={{ coursesTitle: 'Môn học' }} />}
      {tab === 'users' && <Crud title="Tài khoản" path="/users" idKey="userId" fields={[{ name: 'username', label: 'Tên đăng nhập', maxLength: 50 }, { name: 'password', label: 'Mật khẩu (8–72 ký tự)', type: 'password', maxLength: 72 }, { name: 'fullName', label: 'Họ tên', maxLength: 100 }, { name: 'email', label: 'Email', type: 'email', maxLength: 100 }, { name: 'role', label: 'Vai trò', type: 'select', options: ['ADMIN', 'LECTURER', 'STUDENT'].map(r => option(r)) }]} editFields={[{ name: 'fullName', label: 'Họ tên', maxLength: 100 }, { name: 'email', label: 'Email', type: 'email', maxLength: 100 }, { name: 'role', label: 'Vai trò', type: 'select', options: [option('ADMIN', 'Quản trị viên'), option('LECTURER', 'Giảng viên'), option('STUDENT', 'Sinh viên')] }, { name: 'status', label: 'Trạng thái', type: 'select', options: ['ACTIVE', 'INACTIVE'].map(s => option(s)) }]} columns={[{ name: 'username', label: 'Tên đăng nhập' }, { name: 'fullName', label: 'Họ tên' }, { name: 'email', label: 'Email' }, { name: 'role', label: 'Vai trò' }, { name: 'status', label: 'Trạng thái' }]} />}
      {tab === 'documents' && <DocumentView subjects={subjects} />}
      {tab === 'questions' && <Crud title="Ngân hàng câu hỏi" path="/questions" idKey="questionId" fields={questionFields} columns={[{ name: 'questionContent', label: 'Câu hỏi' }, { name: 'topic', label: 'Chủ đề' }, { name: 'bloomLevel', label: 'Bloom' }, { name: 'source', label: 'Nguồn' }, { name: 'status', label: 'Trạng thái' }]} version={questionVersion} toolbar={() => <button className={buttonClass} onClick={() => { setImportOpen(true); setImportError(''); }}>Import JSON</button>} extra={(q, run, reload, busy) => <><button className={buttonClass} onClick={() => setSelectedQuestion(q)}>Rubric</button><button disabled={busy || q.status === 'APPROVED'} className={buttonClass} onClick={() => run(() => request(`/questions/${q.questionId}/review`, { method: 'POST', body: { status: 'APPROVED' } }))}>Duyệt</button><button disabled={busy || q.status === 'REJECTED'} className={buttonClass} onClick={() => run(() => request(`/questions/${q.questionId}/review`, { method: 'POST', body: { status: 'REJECTED' } }))}>Từ chối</button></>} />}
      {tab === 'exams' && <Crud title="Kỳ thi" path="/exams" idKey="examId" fields={examFields} columns={[{ name: 'examName', label: 'Tên kỳ thi' }, { name: 'startTime', label: 'Bắt đầu' }, { name: 'endTime', label: 'Kết thúc' }, { name: 'status', label: 'Trạng thái' }]} extra={(e, run, reload, busy) => <><button className={buttonClass} onClick={() => setSelectedExam(e)}>Lịch thi & transcript</button>{e.status === 'DRAFT' && <button disabled={busy} className={buttonClass} onClick={() => run(() => request(`/exams/${e.examId}/publish`, { method: 'POST' }))}>Xuất bản</button>}{e.status === 'PUBLISHED' && <button disabled={busy} className={buttonClass} onClick={() => run(() => request(`/exams/${e.examId}/complete`, { method: 'POST' }))}>Kết thúc kỳ thi</button>}</>} />}
      {tab === 'student' && (selectedSchedule ? <Interview scheduleId={selectedSchedule.scheduleId} onBack={() => setSelectedSchedule(null)} /> : <Crud title="Lịch thi của tôi" path="/my-schedules" idKey="scheduleId" fields={[]} allowCreate={false} allowEdit={false} allowDelete={false} columns={[{ name: 'examName', label: 'Kỳ thi' }, { name: 'allocatedStartTime', label: 'Bắt đầu' }, { name: 'allocatedEndTime', label: 'Kết thúc' }, { name: 'status', label: 'Trạng thái' }]} extra={s => <button className={buttonClass} onClick={() => setSelectedSchedule(s)}>{s.status === 'COMPLETED' ? 'Xem transcript' : 'Vào phòng thi'}</button>} />)}
      <Modal isOpen={!!selectedQuestion} onClose={() => { setSelectedQuestion(null); setQuestionVersion(v => v + 1); }} title="Rubric của câu hỏi">
        {selectedQuestion && <><p className="mb-4">{selectedQuestion.questionContent}</p><Crud title="Tiêu chí" path={`/questions/${selectedQuestion.questionId}/rubrics`} idKey="rubricId" fields={rubricFields} columns={[{ name: 'criteriaName', label: 'Tiêu chí' }, { name: 'maxScore', label: 'Điểm' }, { name: 'guideline', label: 'Hướng dẫn' }]} deletePath={r => `/rubrics/${r.rubricId}`} /></>}
      </Modal>
      <Modal isOpen={!!selectedExam} onClose={() => { setSelectedExam(null); setSelectedSchedule(null); }} title="Lịch thi & transcript">
        {selectedExam && (selectedSchedule ? <Interview scheduleId={selectedSchedule.scheduleId} readOnly onBack={() => setSelectedSchedule(null)} /> : <Crud title={selectedExam.examName} path={`/exams/${selectedExam.examId}/schedules`} idKey="scheduleId" allowCreate={selectedExam.status === 'DRAFT'} allowEdit={selectedExam.status === 'DRAFT'} allowDelete={selectedExam.status === 'DRAFT'} fields={[{ name: 'studentId', label: 'Sinh viên', type: 'select', numeric: true, options: users.filter(u => u.role === 'STUDENT' && u.status === 'ACTIVE').map(u => option(u.userId, `${u.fullName} (${u.username})`)) }, { name: 'allocatedStartTime', label: 'Bắt đầu lượt thi', type: 'datetime-local' }, { name: 'allocatedEndTime', label: 'Kết thúc lượt thi', type: 'datetime-local' }]} columns={[{ name: 'studentName', label: 'Sinh viên' }, { name: 'allocatedStartTime', label: 'Bắt đầu' }, { name: 'allocatedEndTime', label: 'Kết thúc' }, { name: 'status', label: 'Trạng thái' }]} deletePath={s => `/schedules/${s.scheduleId}`} extra={s => <button className={buttonClass} onClick={() => setSelectedSchedule(s)}>Transcript</button>} />)}
      </Modal>
      <Modal isOpen={importOpen} onClose={() => { if (!importBusy) setImportOpen(false); }} title="Import câu hỏi JSON">
        <form className="space-y-4" onSubmit={async e => { e.preventDefault(); setImportBusy(true); setImportError(''); try { const payload = JSON.parse(importText); if (!Array.isArray(payload)) throw new Error('JSON phải là mảng câu hỏi.'); await request('/questions/import', { method: 'POST', body: payload }); setImportOpen(false); setQuestionVersion(v => v + 1); } catch (e) { setImportError(e.message); } finally { setImportBusy(false); } }}>
          <p className="text-sm">Mỗi câu cần subjectId, questionContent, bloomLevel; topic và documentId là tùy chọn. Tối đa 100 câu.</p><textarea required rows={10} className={inputClass} value={importText} onChange={e => setImportText(e.target.value)} placeholder='[{"subjectId": 1, "questionContent": "...", "bloomLevel": "UNDERSTAND"}]' />{importError && <p role="alert" className="text-red-600">{importError}</p>}<button disabled={importBusy} className={buttonClass}>Import</button>
        </form>
      </Modal>
  </div>;
}
