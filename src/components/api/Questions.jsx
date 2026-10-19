import React, { useState } from 'react';
import { api } from '../../services/api';
import { button,input,Heading,Panel,Field,CourseSelect,useRemote,useMutation,State,Table,Notice } from './parts';
import QuestionImport,{bloomLabels} from './QuestionImport';
import {CourseMaterials} from './Materials';

const empty={rubricId:'',content:'',referenceAnswer:'',bloomLevel:'UNDERSTAND',difficulty:'MEDIUM'};
const labels={DRAFT:'Bản nháp',PENDING_REVIEW:'Chờ giáo viên duyệt',APPROVED:'Đã duyệt',REJECTED:'Đã từ chối',ARCHIVED:'Đã loại bỏ'};
function CourseQuestions({courseId}){
  const data=useRemote(()=>api.questions(courseId),[courseId]);
  const rubrics=useRemote(()=>api.rubrics(courseId),[courseId]);
  const [tab,setTab]=useState('pending'),[form,setForm]=useState(empty),[editing,setEditing]=useState(null),[detail,setDetail]=useState(null);
  const [mode,setMode]=useState('import');
  const m=useMutation(data.reload);
  const groups={pending:data.items.filter(q=>['DRAFT','PENDING_REVIEW'].includes(q.status)),bank:data.items.filter(q=>q.status==='APPROVED'),removed:data.items.filter(q=>['REJECTED','ARCHIVED'].includes(q.status))};
  async function inspect(q,edit=false){
    const value=await m.run(()=>api.question(q.id),'');
    if(value){setDetail({...q,...value});if(edit){setMode('manual');setEditing(q);setForm({rubricId:q.rubricId||'',content:value.content,referenceAnswer:value.referenceAnswer||'',bloomLevel:q.bloomLevel,difficulty:q.difficulty});}}
  }
  async function save(e){
    e.preventDefault();const body={...form,courseId};
    const result=await m.run(()=>editing?api.updateQuestion(editing.id,body):api.createQuestion(body),editing?'Đã lưu chỉnh sửa. Câu hỏi cần giáo viên duyệt trước khi vào ngân hàng chính thức.':'Đã tạo câu hỏi chờ giáo viên duyệt.');
    if(result){setEditing(null);setForm(empty);setDetail(null);setTab('pending');setMode('review');}
  }
  async function approve(q){
    const result=await m.run(()=>api.reviewQuestion(q.id,true),'Đã đưa câu hỏi vào ngân hàng chính thức.');
    if(result)setDetail(null);
  }
  async function remove(q){
    const result=await m.run(()=>api.deleteQuestion(q.id),'Đã loại bỏ câu hỏi khỏi danh sách sử dụng. Lịch sử và nguồn tài liệu được giữ lại.');
    if(result){if(editing?.id===q.id){setEditing(null);setForm(empty);}setDetail(null);}
  }
  return <>
    <Notice>Import hoặc nhờ AI tạo câu hỏi → giáo viên kiểm tra Bloom, rubric và đáp án → chỉnh sửa, từ chối hoặc duyệt. Chỉ câu được giáo viên duyệt mới vào ngân hàng chính thức. Bạn có thể giữ câu ở trạng thái chờ duyệt để xem xét sau.</Notice>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Nguồn câu hỏi">{[['import','Import câu hỏi'],['ai','Nhờ AI tạo câu hỏi'],['manual','Tạo thủ công'],['review','Xem danh sách duyệt']].map(([key,title])=><button key={key} className={button} disabled={m.busy} aria-pressed={mode===key} onClick={()=>{setMode(key);setEditing(null);setForm(empty);}}>{title}</button>)}</div>
    {mode==='import'&&<QuestionImport courseId={courseId} rubrics={rubrics.items} onImported={result=>{data.reload();setTab('pending');setMode('review');m.setSuccess(`Đã import ${result.importedRows} câu. Giáo viên xem xét từng câu trước khi duyệt.`);}}/>}
    {mode==='ai'&&<CourseMaterials courseId={courseId} onQuestionsGenerated={()=>{data.reload();setTab('pending');setMode('review');m.setSuccess('AI đã tạo câu hỏi chờ duyệt. Bạn quyết định sửa, loại bỏ, duyệt hoặc để lại xem xét sau.');}}/>}
    {mode==='manual'&&<Panel title={editing?'Chỉnh sửa câu hỏi':'Tạo câu hỏi chờ duyệt'}>
      {editing?.status==='APPROVED'&&<Notice>Sau khi sửa, câu hỏi quay về chờ duyệt và được gỡ khỏi các đề thi nháp. Câu đang dùng trong kỳ thi đã mở sẽ không được sửa.</Notice>}
      <form onSubmit={save} className="grid md:grid-cols-2 gap-3"><fieldset disabled={m.busy} className="contents">
        <Field label="Rubric" required><select className={input} required value={form.rubricId} onChange={e=>setForm({...form,rubricId:e.target.value})}><option value="">— Chọn rubric —</option>{rubrics.items.filter(r=>r.status!=='ARCHIVED').map(r=><option key={r.id} value={r.id}>{r.name} ({r.status})</option>)}</select></Field>
        <Field label="Bloom"><select className={input} value={form.bloomLevel} onChange={e=>setForm({...form,bloomLevel:e.target.value})}>{Object.entries(bloomLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Độ khó"><select className={input} value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})}>{['EASY','MEDIUM','HARD'].map(x=><option key={x}>{x}</option>)}</select></Field>
        <Field label="Nội dung câu hỏi" required><textarea className={input} required rows={3} value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/></Field>
        <div className="md:col-span-2"><Field label="Đáp án tham khảo"><textarea className={input} rows={3} value={form.referenceAnswer} onChange={e=>setForm({...form,referenceAnswer:e.target.value})}/></Field></div>
        <div className="flex gap-2"><button className={button} disabled={!form.rubricId||rubrics.loading||!!rubrics.error}>{editing?'Lưu chỉnh sửa':'Tạo câu hỏi'}</button>{editing&&<button className={button} type="button" onClick={()=>{setEditing(null);setForm(empty);}}>Hủy chỉnh sửa</button>}</div>
      </fieldset></form><p className="text-sm text-mutedtext">Rubric cần được công bố trước khi duyệt câu hỏi. Sinh câu hỏi AI từ PDF/DOCX tại mục Tài liệu học tập.</p>
    </Panel>}
    <State error={m.error||data.error||rubrics.error} success={m.success}/>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Danh sách câu hỏi">
      {[['pending','Chờ giáo viên duyệt'],['bank','Ngân hàng chính thức'],['removed','Đã loại bỏ / từ chối']].map(([key,title])=><button key={key} type="button" className={button} disabled={m.busy} aria-pressed={tab===key} onClick={()=>setTab(key)}>{title} ({groups[key].length})</button>)}
    </div>
    <Panel title={tab==='pending'?'Danh sách chờ duyệt':tab==='bank'?'Ngân hàng câu hỏi chính thức':'Câu hỏi đã loại bỏ / từ chối'}>
      {data.loading?<p>Đang tải câu hỏi...</p>:<Table rows={groups[tab]} columns={[{key:'content',label:'Câu hỏi'},{key:'bloomLevel',label:'Bloom',render:q=>bloomLabels[q.bloomLevel]||q.bloomLevel},{key:'rubricId',label:'Rubric',render:q=>rubrics.items.find(r=>r.id===q.rubricId)?.name||'Chưa gắn rubric'},{key:'difficulty',label:'Độ khó'},{key:'status',label:'Trạng thái',render:q=>labels[q.status]||q.status}]} actions={q=><div className="flex flex-wrap gap-2">
        <button className={button} disabled={m.busy} onClick={()=>inspect(q)}>Chi tiết</button>
        {q.status!=='ARCHIVED'&&<><button className={button} disabled={m.busy} onClick={()=>inspect(q,true)}>Sửa</button>{q.status==='PENDING_REVIEW'&&<><button className={button} disabled={m.busy} onClick={()=>approve(q)}>Duyệt</button><button className={button} disabled={m.busy} onClick={()=>m.run(()=>api.reviewQuestion(q.id,false,'Giáo viên quyết định không đưa câu hỏi vào ngân hàng.'),'Đã từ chối; câu hỏi không được đưa vào ngân hàng chính thức.')}>Từ chối</button></>}<button className={button} disabled={m.busy} onClick={()=>remove(q)}>Loại bỏ</button></>}
      </div>}/>}
    </Panel>
    {detail&&<Panel title="Chi tiết và nguồn câu hỏi"><button className={button} onClick={()=>setDetail(null)}>Đóng chi tiết</button><p className="whitespace-pre-wrap font-medium">{detail.content}</p><p>Bloom: {bloomLabels[detail.bloomLevel]||detail.bloomLevel}</p><h3 className="font-medium">Đáp án tham khảo</h3><p className="whitespace-pre-wrap">{detail.referenceAnswer||'Chưa có đáp án tham khảo.'}</p>
      {detail.rubric&&<><h3 className="font-medium">Rubric: {detail.rubric.name} · {detail.rubric.maxScore} điểm</h3><Table keyField="name" rows={detail.rubric.criteria||[]} columns={[{key:'name',label:'Tiêu chí'},{key:'description',label:'Mô tả'},{key:'maxPoints',label:'Điểm tối đa'}]}/><p className="text-sm text-mutedtext">Rubric và đáp án được lưu cùng câu hỏi tại thời điểm bắt đầu lượt thi để làm căn cứ chấm gợi ý về sau.</p></>}
      {(detail.sources||[]).map(source=><div className="border border-appborder rounded-lg p-3" key={source.chunkId}><p className="font-medium">{source.filename}</p><p className="whitespace-pre-wrap text-sm">{source.content}</p></div>)}</Panel>}
  </>;
}
export default function Questions(){
  const courses=useRemote(()=>api.courses());const [courseId,setCourseId]=useState('');
  return <section className="space-y-5"><Heading title="Giáo viên quản lý câu hỏi" subtitle="Import hoặc sinh bằng AI, gắn Bloom và rubric, giáo viên quyết định duyệt vào ngân hàng."/><CourseSelect courses={courses.items} value={courseId} onChange={setCourseId}/><State error={courses.error}/>{!courses.loading&&!courses.error&&!courses.items.length&&<Notice>Bạn chưa có môn học được phân công.</Notice>}{courseId&&<CourseQuestions key={courseId} courseId={courseId}/>}</section>;
}
