import React, { useState } from 'react';
import { api } from '../../services/api';
import { input, Field, CourseSelect, useRemote, useMutation, Notice } from './parts';
import {Button,FormPage,ListPage,SuccessToast} from '../ui';
import StatusBadge from '../common/StatusBadge';
import useCourseCollection from '../../hooks/useCourseCollection';

const emptyCriterion = { criterionName: '', description: '', maxPoints: 1, sortOrder: 1 };
export default function Rubrics() {
  const courses = useRemote(() => api.courses());
  const [courseId, setCourseId] = useState('');
  const data=useCourseCollection(courses,api.rubrics);
  const rows=courseId?data.items.filter(row=>row.courseId===courseId):data.items;
  const [formCourseId,setFormCourseId]=useState('');
  const [rubricId, setRubricId] = useState('');
  const criteria = useRemote(() => rubricId ? api.criteria(rubricId) : Promise.resolve([]), [rubricId]);
  const m = useMutation(() => { data.reload(); criteria.reload(); });
  const [form, setForm] = useState({ name: '', description: '', maxScore: 10 });
  const [criterion, setCriterion] = useState(emptyCriterion);
  const [editingId, setEditingId] = useState('');
  const [editingRubric,setEditingRubric]=useState('');
  const [view,setView]=useState('list'),[criterionView,setCriterionView]=useState('list');
  const selected = data.items.find(r => r.id === rubricId);
  const total = criteria.items.reduce((sum, c) => sum + Math.round(Number(c.maxPoints) * 100), 0);
  const canPublish = selected?.status === 'DRAFT' && !criteria.loading && !criteria.error && criteria.items.length > 0 && total === Math.round(Number(selected.maxScore) * 100);
  function selectRubric(id) { setRubricId(id); setEditingId(''); setCriterion(emptyCriterion); m.setError(''); m.setSuccess(''); }
  async function create(e) {
    e.preventDefault();
    if (!formCourseId) return;
    const body={ ...form, maxScore: Number(form.maxScore), courseId:formCourseId };
    const result = await m.run(() => editingRubric?api.updateRubric(editingRubric,body):api.createRubric(body), editingRubric?'Đã sửa rubric nháp.':'Đã tạo rubric nháp.');
    if (result) { setEditingRubric('');setForm({ name: '', description: '', maxScore: 10 }); selectRubric('');setView('list');m.setSuccess('Đã lưu rubric.'); }
  }
  async function save(e) {
    e.preventDefault();
    const body = { ...criterion, maxPoints: Number(criterion.maxPoints), sortOrder: Number(criterion.sortOrder) };
    const result = await m.run(() => editingId ? api.updateCriterion(rubricId, editingId, body) : api.addCriterion(rubricId, body), 'Đã lưu tiêu chí.');
    if (result) { setCriterionView('list');setEditingId(''); setCriterion({ ...emptyCriterion, sortOrder: Math.max(0, ...criteria.items.map(c => c.sortOrder), body.sortOrder) + 1 }); }
  }
  const back=()=>{setView('list');setEditingRubric('');m.setError('');};
  const coursePicker=<CourseSelect placeholder="Tất cả môn học" courses={courses.items} value={courseId} disabled={m.busy||view==='edit'} onChange={id=>{setCourseId(id);selectRubric('');m.setError('');setCriterionView('list');}}/>;
  const toast=<SuccessToast message={m.success} onClose={()=>m.setSuccess('')}/>;
  if(view!=='list')return <><FormPage title={view==='edit'?'Sửa rubric nháp':'Tạo rubric'} onBack={back} onSubmit={create} saving={m.busy} disabled={!formCourseId||data.loading||!!courses.error} error={m.error||courses.error}>
    <div className="grid gap-4 md:grid-cols-2"><CourseSelect courses={courses.items} value={formCourseId} disabled={m.busy||!!editingRubric} onChange={setFormCourseId}/>
      <Field label="Tên rubric" required><input className={input} required maxLength={180} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
      <Field label="Điểm tối đa" required><input className={input} type="number" min="0.01" step="0.01" required value={form.maxScore} onChange={e=>setForm({...form,maxScore:e.target.value})}/></Field>
      <div className="md:col-span-2"><Field label="Mô tả"><textarea className={input} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></Field></div>
    </div>
  </FormPage>{toast}</>;
  if(rubricId&&selected){
    const backToCriteria=()=>{setCriterionView('list');setEditingId('');m.setError('');};
    if(criterionView!=='list'&&selected.status==='DRAFT')return <><FormPage title={editingId?'Sửa tiêu chí':'Thêm tiêu chí'} onBack={backToCriteria} onSubmit={save} saving={m.busy} error={m.error}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tên tiêu chí" required><input className={input} required maxLength={180} value={criterion.criterionName} onChange={e=>setCriterion({...criterion,criterionName:e.target.value})}/></Field>
        <Field label="Điểm" required><input className={input} required type="number" min="0.01" max={selected.maxScore} step="0.01" value={criterion.maxPoints} onChange={e=>setCriterion({...criterion,maxPoints:e.target.value})}/></Field>
        <Field label="Thứ tự" required><input className={input} required type="number" min="1" step="1" value={criterion.sortOrder} onChange={e=>setCriterion({...criterion,sortOrder:e.target.value})}/></Field>
        <Field label="Mô tả"><input className={input} value={criterion.description} onChange={e=>setCriterion({...criterion,description:e.target.value})}/></Field>
      </div>
    </FormPage>{toast}</>;
    return <section className="min-w-0 space-y-6"><Button variant="ghost" onClick={()=>selectRubric('')}>← Quay lại danh sách</Button>
      <ListPage title={'Tiêu chí: '+selected.name} description={'Tổng điểm: '+(total/100).toFixed(2)+' / '+Number(selected.maxScore).toFixed(2)}
        rows={criteria.items} loading={criteria.loading} error={criteria.error} onRetry={()=>{m.setError('');criteria.reload();}} searchKeys={['criterionName','description']}
        onCreate={selected.status==='DRAFT'?()=>{setEditingId('');setCriterion({...emptyCriterion,sortOrder:Math.max(0,...criteria.items.map(c=>c.sortOrder))+1});setCriterionView('create');}:undefined} createLabel="Thêm tiêu chí"
        onEdit={selected.status==='DRAFT'?c=>{setEditingId(c.id);setCriterion({criterionName:c.criterionName,description:c.description||'',maxPoints:c.maxPoints,sortOrder:c.sortOrder});setCriterionView('edit');}:undefined}
        onDelete={selected.status==='DRAFT'?async c=>{await api.deleteCriterion(rubricId,c.id);criteria.reload();m.setSuccess('Đã xóa tiêu chí.');}:undefined}
        columns={[{key:'criterionName',label:'Tên tiêu chí'},{key:'description',label:'Mô tả'},{key:'maxPoints',label:'Điểm'},{key:'sortOrder',label:'Thứ tự'}]}/>
      {selected.status==='DRAFT'?<div className="space-y-3">{!canPublish&&<p className="text-sm text-mutedtext">Thêm hoặc điều chỉnh tiêu chí để tổng điểm bằng điểm tối đa.</p>}<Button disabled={m.busy||!canPublish} onClick={()=>m.run(()=>api.publishRubric(rubricId),'Đã công bố rubric.')}>Công bố rubric</Button></div>:<Notice>{selected.status==='ARCHIVED'?'Rubric đã ngừng sử dụng.':'Rubric đã công bố.'} Các tiêu chí được giữ cố định để bảo đảm chấm điểm nhất quán.</Notice>}
      {m.error&&<p role="alert" className="text-sm text-danger-text">{m.error}</p>}
      {toast}
    </section>;
  }
  return <section className="min-w-0 space-y-6"><ListPage title="Rubric và tiêu chí" description="Rubric dùng chung để AI chấm toàn bộ bài thi sau khi hoàn tất. Chọn rubric đã công bố tại cấu hình kỳ thi; tổng điểm tiêu chí phải bằng điểm tối đa."
    toolbar={coursePicker} rows={rows} loading={data.loading} error={data.error} onRetry={()=>{m.setError('');data.reload();}}
    onCreate={courses.items.length?()=>{setFormCourseId(courseId||(courses.items.length===1?courses.items[0].id:''));setForm({name:'',description:'',maxScore:10});setEditingRubric('');setView('create');m.setError('');}:undefined} createLabel="+ Tạo tiêu chí"
    onEdit={r=>{setFormCourseId(r.courseId);setEditingRubric(r.id);setForm({name:r.name,description:r.description||'',maxScore:r.maxScore});setView('edit');m.setError('');}} canEditRow={r=>r.status==='DRAFT'}
    onDelete={async r=>{await api.deleteRubric(r.id);data.reload();m.setSuccess('Đã ngừng sử dụng rubric.');}} canDeleteRow={r=>r.status!=='ARCHIVED'} searchKeys={['name','description','courseCode','courseName']}
    extraRowActions={r=><Button variant="secondary" disabled={m.busy} onClick={()=>{selectRubric(r.id);setCriterionView('list');}}>Tiêu chí</Button>}
    columns={[{key:'name',label:'Tên rubric'},{key:'courseLabel',label:'Môn học'},{key:'maxScore',label:'Điểm tối đa'},{key:'status',label:'Trạng thái',render:r=><StatusBadge status={r.status}/>}]} />
    {!courses.loading&&!courses.error&&!courses.items.length&&<Notice>Chưa có môn học để quản lý. Giảng viên cần được quản trị viên phân công môn học tại mục Môn học.</Notice>}
    {m.error&&<p role="alert" className="text-sm text-danger-text">{m.error}</p>}
    {toast}
  </section>;
}
