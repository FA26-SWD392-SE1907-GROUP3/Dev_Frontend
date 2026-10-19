import React, { useState } from 'react';
import { api } from '../../services/api';
import { button, input, Heading, Panel, Field, CourseSelect, useRemote, useMutation, State, Notice, Table } from './parts';

const emptyCriterion = { criterionName: '', description: '', maxPoints: 1, sortOrder: 1 };
export default function Rubrics() {
  const courses = useRemote(() => api.courses());
  const [courseId, setCourseId] = useState('');
  const data = useRemote(() => courseId ? api.rubrics(courseId) : Promise.resolve([]), [courseId]);
  const [rubricId, setRubricId] = useState('');
  const criteria = useRemote(() => rubricId ? api.criteria(rubricId) : Promise.resolve([]), [rubricId]);
  const m = useMutation(() => { data.reload(); criteria.reload(); });
  const [form, setForm] = useState({ name: '', description: '', maxScore: 10 });
  const [criterion, setCriterion] = useState(emptyCriterion);
  const [editingId, setEditingId] = useState('');
  const [editingRubric,setEditingRubric]=useState('');
  const selected = data.items.find(r => r.id === rubricId);
  const total = criteria.items.reduce((sum, c) => sum + Math.round(Number(c.maxPoints) * 100), 0);
  const canPublish = selected?.status === 'DRAFT' && !criteria.loading && !criteria.error && criteria.items.length > 0 && total === Math.round(Number(selected.maxScore) * 100);
  function selectRubric(id) { setRubricId(id); setEditingId(''); setCriterion(emptyCriterion); m.setError(''); m.setSuccess(''); }
  async function create(e) {
    e.preventDefault();
    const body={ ...form, maxScore: Number(form.maxScore), courseId };
    const result = await m.run(() => editingRubric?api.updateRubric(editingRubric,body):api.createRubric(body), editingRubric?'Đã sửa rubric nháp.':'Đã tạo rubric nháp.');
    if (result) { setEditingRubric('');setForm({ name: '', description: '', maxScore: 10 }); selectRubric(result.id);m.setSuccess('Đã lưu rubric.'); }
  }
  async function save(e) {
    e.preventDefault();
    const body = { ...criterion, maxPoints: Number(criterion.maxPoints), sortOrder: Number(criterion.sortOrder) };
    const result = await m.run(() => editingId ? api.updateCriterion(rubricId, editingId, body) : api.addCriterion(rubricId, body), 'Đã lưu tiêu chí.');
    if (result) { setEditingId(''); setCriterion({ ...emptyCriterion, sortOrder: Math.max(0, ...criteria.items.map(c => c.sortOrder), body.sortOrder) + 1 }); }
  }
  return <section className="space-y-5">
    <Heading title="Rubric và tiêu chí" subtitle="Quản lý rubric của môn được phân công. Tổng điểm tiêu chí phải bằng điểm tối đa trước khi công bố." />
    <CourseSelect courses={courses.items} value={courseId} disabled={m.busy} onChange={id => { setCourseId(id); selectRubric('');setEditingRubric('');setForm({name:'',description:'',maxScore:10}); }} />
    {!courses.loading && !courses.error && !courses.items.length && <Notice>Chưa có môn học để quản lý. Giảng viên cần được quản trị viên phân công môn học tại mục Môn học.</Notice>}
    {(courses.error || data.error) && <Notice type="error">{courses.error || data.error}</Notice>}
    {courseId && !data.error && <>
      <Panel title={editingRubric?'Sửa rubric nháp':'Tạo rubric'}><form onSubmit={create} className="grid md:grid-cols-2 gap-3">
        <Field label="Tên rubric" required><input className={input} required maxLength={180} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Điểm tối đa" required><input className={input} type="number" min="0.01" step="0.01" required value={form.maxScore} onChange={e => setForm({ ...form, maxScore: e.target.value })} /></Field>
        <div className="md:col-span-2"><Field label="Mô tả"><textarea className={input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field></div>
        <button className={button} disabled={m.busy || data.loading}>{editingRubric?'Lưu rubric':'Tạo rubric'}</button>{editingRubric&&<button type="button" className={button} onClick={()=>{setEditingRubric('');setForm({name:'',description:'',maxScore:10});}}>Hủy sửa rubric</button>}
      </form></Panel>
      <Panel title="Danh sách rubric">{data.loading ? <p>Đang tải...</p> : <Table rows={data.items} columns={[{ key: 'name', label: 'Tên rubric' }, { key: 'maxScore', label: 'Điểm tối đa' }, { key: 'status', label: 'Trạng thái' }]} actions={r => <div className="flex flex-wrap gap-2"><button className={button} disabled={m.busy} onClick={() => selectRubric(r.id)}>Tiêu chí</button>{r.status==='DRAFT'&&<button className={button} disabled={m.busy} onClick={()=>{setEditingRubric(r.id);setForm({name:r.name,description:r.description||'',maxScore:r.maxScore});}}>Sửa rubric</button>}{r.status!=='ARCHIVED'&&<button className={button} disabled={m.busy} onClick={async()=>{if(window.confirm(`Ngừng sử dụng rubric ${r.name}? Rubric đã gắn câu hỏi sẽ được bảo vệ.`)){const result=await m.run(()=>api.deleteRubric(r.id),'Đã ngừng sử dụng rubric.');if(result&&rubricId===r.id)selectRubric('');}}}>Xóa rubric</button>}</div>} />}</Panel>
      {rubricId && selected && <Panel title={`Tiêu chí: ${selected.name}`}>
        <State error={criteria.error} />
        {criteria.loading ? <p>Đang tải tiêu chí...</p> : !criteria.error && <>
          <p className="text-sm font-medium">Tổng điểm: {(total / 100).toFixed(2)} / {Number(selected.maxScore).toFixed(2)}</p>
          <Table rows={criteria.items} columns={[{ key: 'criterionName', label: 'Tên tiêu chí' }, { key: 'description', label: 'Mô tả' }, { key: 'maxPoints', label: 'Điểm' }, { key: 'sortOrder', label: 'Thứ tự' }]} actions={selected.status === 'DRAFT' ? c => <div className="flex gap-2">
            <button className={button} disabled={m.busy} onClick={() => { setEditingId(c.id); setCriterion({ criterionName: c.criterionName, description: c.description || '', maxPoints: c.maxPoints, sortOrder: c.sortOrder }); }}>Sửa</button>
            <button className={button} disabled={m.busy} onClick={() => { if (window.confirm(`Xóa tiêu chí "${c.criterionName}"?`)) m.run(() => api.deleteCriterion(rubricId, c.id), 'Đã xóa tiêu chí.').then(result => { if (result) { setEditingId(''); setCriterion(emptyCriterion); } }); }}>Xóa</button>
          </div> : undefined} />
          {selected.status === 'DRAFT' ? <>
            <h3 className="font-medium">{editingId ? 'Sửa tiêu chí' : 'Thêm tiêu chí'}</h3>
            <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
              <Field label="Tên tiêu chí" required><input className={input} required maxLength={180} value={criterion.criterionName} onChange={e => setCriterion({ ...criterion, criterionName: e.target.value })} /></Field>
              <Field label="Điểm" required><input className={input} required type="number" min="0.01" max={selected.maxScore} step="0.01" value={criterion.maxPoints} onChange={e => setCriterion({ ...criterion, maxPoints: e.target.value })} /></Field>
              <Field label="Thứ tự" required><input className={input} required type="number" min="1" step="1" value={criterion.sortOrder} onChange={e => setCriterion({ ...criterion, sortOrder: e.target.value })} /></Field>
              <Field label="Mô tả"><input className={input} value={criterion.description} onChange={e => setCriterion({ ...criterion, description: e.target.value })} /></Field>
              <div className="flex gap-2"><button className={button} disabled={m.busy}>{editingId ? 'Lưu tiêu chí' : 'Thêm tiêu chí'}</button>{editingId && <button type="button" className={button} onClick={() => { setEditingId(''); setCriterion(emptyCriterion); }}>Hủy sửa</button>}</div>
            </form>
            {!canPublish && <p className="text-sm text-mutedtext">Thêm hoặc điều chỉnh tiêu chí để tổng điểm bằng điểm tối đa.</p>}
            <button className={button} disabled={m.busy || !canPublish} onClick={() => m.run(() => api.publishRubric(rubricId), 'Đã công bố rubric.')}>Công bố rubric</button>
          </> : <Notice>{selected.status==='ARCHIVED'?'Rubric đã ngừng sử dụng.':'Rubric đã công bố.'} Các tiêu chí được giữ cố định để bảo đảm chấm điểm nhất quán.</Notice>}
        </>}
      </Panel>}
    </>}
    <State error={m.error} success={m.success} />
  </section>;
}
