import React, { useState } from 'react';
import { api } from '../../services/api';
import { input,Panel,Field,CourseSelect,useRemote,useMutation,Notice } from './parts';
import {Button,FormPage,ListPage,PageHeader,SuccessToast} from '../ui';
import StatusBadge from '../common/StatusBadge';
import QuestionImport from './QuestionImport';
import { difficultyLabels } from '../common/questionLevels';
import {CourseMaterials} from './Materials';
import useCourseCollection from '../../hooks/useCourseCollection';

const empty={content:'',referenceAnswer:'',difficulty:'MEDIUM'};
const labels={DRAFT:'Bản nháp',PENDING_REVIEW:'Chờ giáo viên duyệt',APPROVED:'Đã duyệt',REJECTED:'Đã từ chối',ARCHIVED:'Đã loại bỏ'};
export default function Questions(){
  const courses=useRemote(()=>api.courses());
  const [courseId,setCourseId]=useState('');
  const data=useCourseCollection(courses,api.questions);
  const rows=courseId?data.items.filter(row=>row.courseId===courseId):data.items;
  const [formCourseId,setFormCourseId]=useState(''),[sourceCourseId,setSourceCourseId]=useState('');
  const [tab,setTab]=useState('all'),[form,setForm]=useState(empty),[editing,setEditing]=useState(null),[detail,setDetail]=useState(null);
  const [mode,setMode]=useState('review'),[view,setView]=useState('list');
  const m=useMutation(data.reload);
  const groups={all:rows,pending:rows.filter(q=>['DRAFT','PENDING_REVIEW'].includes(q.status)),bank:rows.filter(q=>q.status==='APPROVED'),removed:rows.filter(q=>['REJECTED','ARCHIVED'].includes(q.status))};
  async function inspect(q,edit=false){
    const value=await m.run(()=>api.question(q.id),'');
    if(value){setDetail({...q,...value});if(edit){setView('edit');setMode('manual');setEditing(q);setFormCourseId(q.courseId);setForm({content:value.content,referenceAnswer:value.referenceAnswer||'',difficulty:q.difficulty});}}
  }
  async function save(e){
    e.preventDefault();if(!formCourseId)return;const body={...form,courseId:formCourseId};
    const result=await m.run(()=>editing?api.updateQuestion(editing.id,body):api.createQuestion(body),editing?'Đã lưu chỉnh sửa. Câu hỏi cần giáo viên duyệt trước khi vào ngân hàng chính thức.':'Đã tạo câu hỏi chờ giáo viên duyệt.');
    if(result){setEditing(null);setForm(empty);setDetail(null);setTab('pending');setMode('review');setView('list');}
  }
  async function approve(q){
    const result=await m.run(()=>api.reviewQuestion(q.id,true),'Đã đưa câu hỏi vào ngân hàng chính thức.');
    if(result)setDetail(null);
  }
  async function remove(q){
    await api.deleteQuestion(q.id);data.reload();setDetail(null);
    m.setSuccess('Đã loại bỏ câu hỏi khỏi danh sách sử dụng. Lịch sử và nguồn tài liệu được giữ lại.');
  }
  const back=()=>{setView('list');setMode('review');setEditing(null);setDetail(null);setForm(empty);m.setError('');};
  const beginCreate=()=>{setFormCourseId(courseId||(courses.items.length===1?courses.items[0].id:''));setEditing(null);setForm(empty);setDetail(null);setView('create');setMode('manual');m.setError('');};
  const toolbar=<CourseSelect courses={courses.items} value={courseId} onChange={id=>{setCourseId(id);setDetail(null);}} placeholder="Tất cả môn học"/>;
  const toast=<SuccessToast message={m.success} onClose={()=>m.setSuccess('')}/>;
  if(view!=='list')return <><FormPage title={editing?'Chỉnh sửa câu hỏi':'Tạo câu hỏi chờ duyệt'} onBack={back} onSubmit={save} saving={m.busy} disabled={!formCourseId||courses.loading||!!courses.error} error={m.error||courses.error}>
    <CourseSelect courses={courses.items} value={formCourseId} disabled={!!editing||m.busy} onChange={setFormCourseId}/>
    {editing?.status==='APPROVED'&&<Notice>Sau khi sửa, câu hỏi quay về chờ duyệt và được gỡ khỏi các đề thi nháp. Câu đang dùng trong kỳ thi đã mở sẽ không được sửa.</Notice>}
    <div className="grid gap-4 md:grid-cols-2">
        <Field label="Mức câu hỏi"><select className={input} value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})}>{Object.entries(difficultyLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Nội dung câu hỏi" required><textarea className={input} required rows={3} value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/></Field>
        <div className="md:col-span-2"><Field label="Đáp án tham khảo"><textarea className={input} rows={3} value={form.referenceAnswer} onChange={e=>setForm({...form,referenceAnswer:e.target.value})}/></Field></div>
</div>
    <p className="mt-4 text-sm text-mutedtext">Rubric dùng để chấm toàn bộ bài thi và được chọn tại kỳ thi. Câu hỏi chỉ cần nội dung, đáp án và mức Dễ / Trung bình / Khó.</p>
  </FormPage>{toast}</>;
  if(mode!=='review')return <section className="min-w-0 space-y-6"><Button variant="ghost" disabled={m.busy} onClick={back}>← Quay lại danh sách</Button>
    <PageHeader title="Nhập / Tạo bằng AI"/>
    <CourseSelect courses={courses.items} value={sourceCourseId} disabled={m.busy} onChange={setSourceCourseId}/>
    <Notice>Import hoặc nhờ AI tạo câu hỏi → giáo viên kiểm tra mức câu hỏi và đáp án → chỉnh sửa, từ chối hoặc duyệt. Chỉ câu được giáo viên duyệt mới vào ngân hàng chính thức. Bạn có thể giữ câu ở trạng thái chờ duyệt để xem xét sau.</Notice>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Nguồn câu hỏi">
      <Button variant="secondary" disabled={m.busy} aria-pressed={mode==='import'} onClick={()=>setMode('import')}>Import câu hỏi</Button>
      <Button variant="secondary" disabled={m.busy} aria-pressed={mode==='ai'} onClick={()=>setMode('ai')}>Nhờ AI tạo câu hỏi</Button>
      <Button variant="secondary" disabled={m.busy} onClick={beginCreate}>Tạo thủ công</Button>
      <Button variant="ghost" disabled={m.busy} onClick={back}>Xem danh sách duyệt</Button>
    </div>
    {mode==='import'&&sourceCourseId&&<QuestionImport key={sourceCourseId} courseId={sourceCourseId} onImported={result=>{data.reload();setTab('pending');setMode('review');m.setSuccess('Đã import '+result.importedRows+' câu. Giáo viên xem xét từng câu trước khi duyệt.');}}/>}
    {mode==='ai'&&sourceCourseId&&<CourseMaterials key={sourceCourseId} courseId={sourceCourseId} initialView="ai" onQuestionsGenerated={()=>{data.reload();setTab('pending');setMode('review');m.setSuccess('AI đã tạo câu hỏi chờ duyệt. Bạn quyết định sửa, loại bỏ, duyệt hoặc để lại xem xét sau.');}}/>}
    {!sourceCourseId&&<Notice>Chọn môn học để import hoặc sinh câu hỏi.</Notice>}
    {toast}
  </section>;
  return <section className="min-w-0 space-y-6"><ListPage title="Ngân hàng câu hỏi" description="Quản lý câu hỏi Dễ, Trung bình, Khó; giáo viên duyệt trước khi đưa vào ngân hàng."
    rows={groups[tab]} loading={data.loading} error={data.error} onRetry={()=>{m.setError('');data.reload();}} onCreate={courses.items.length?beginCreate:undefined} createLabel="+ Tạo câu hỏi"
    secondaryActions={<Button variant="secondary" disabled={!courses.items.length||data.loading} onClick={()=>{setSourceCourseId(courseId||(courses.items.length===1?courses.items[0].id:''));setMode('sources');}}>Nhập / Tạo bằng AI</Button>}
    toolbar={<div className="w-full min-w-0 space-y-4">{toolbar}<div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Danh sách câu hỏi">{[['all','Tất cả câu hỏi'],['pending','Chờ giáo viên duyệt'],['bank','Ngân hàng chính thức'],['removed','Đã loại bỏ / từ chối']].map(([key,title])=><Button key={key} className="shrink-0 whitespace-nowrap" variant={tab===key?'primary':'secondary'} disabled={m.busy} aria-pressed={tab===key} onClick={()=>{setTab(key);setDetail(null);}}>{title} ({groups[key].length})</Button>)}</div></div>}
    searchKeys={['content','referenceAnswer','difficulty','courseCode','courseName',q=>difficultyLabels[q.difficulty]]}
    onEdit={q=>inspect(q,true)} canEditRow={q=>q.status!=='ARCHIVED'} onDelete={remove} canDeleteRow={q=>q.status!=='ARCHIVED'} getRowLabel={q=>q.content}
    columns={[{key:'content',label:'Câu hỏi',className:'min-w-64'},{key:'courseLabel',label:'Môn học'},{key:'difficulty',label:'Mức câu hỏi',render:q=>difficultyLabels[q.difficulty]||q.difficulty},{key:'status',label:'Trạng thái',render:q=><StatusBadge status={labels[q.status]||q.status}/>} ]}
    extraRowActions={q=><><Button variant="secondary" disabled={m.busy} onClick={()=>inspect(q)}>Chi tiết</Button>{q.status==='PENDING_REVIEW'&&<><Button disabled={m.busy} onClick={()=>approve(q)}>Duyệt</Button><Button variant="ghost" disabled={m.busy} onClick={()=>m.run(()=>api.reviewQuestion(q.id,false,'Giáo viên quyết định không đưa câu hỏi vào ngân hàng.'),'Đã từ chối; câu hỏi không được đưa vào ngân hàng chính thức.')}>Từ chối</Button></>}</>}/>
    {!data.loading&&!data.error&&!courses.items.length&&<Notice>Bạn chưa có môn học được phân công.</Notice>}
    {m.error&&<p role="alert" className="text-sm text-danger-text">{m.error}</p>}
    {detail&&<Panel title="Chi tiết và nguồn câu hỏi"><Button variant="secondary" onClick={()=>setDetail(null)}>Đóng chi tiết</Button><p className="whitespace-pre-wrap font-medium">{detail.content}</p><p>Mức câu hỏi: {difficultyLabels[detail.difficulty]||detail.difficulty}</p><h3 className="font-medium">Đáp án tham khảo</h3><p className="whitespace-pre-wrap">{detail.referenceAnswer||'Chưa có đáp án tham khảo.'}</p>
      {(detail.sources||[]).map(source=><div className="border border-appborder rounded-lg p-3" key={source.chunkId}><p className="font-medium">{source.filename}</p><p className="whitespace-pre-wrap text-sm">{source.content}</p></div>)}</Panel>}

    {toast}
  </section>;
}
