import React, {useEffect,useState} from 'react';
import {api} from '../../services/api';
import {button,input,Panel,Field,CourseSelect,useRemote,useMutation,State,Table,Notice} from './parts';
import {Button,FormPage,ListPage} from '../ui';
import StatusBadge from '../common/StatusBadge';
import Toast from '../common/Toast';
import { difficultyLabels } from '../common/questionLevels';

const defaults={rubricId:'',title:'',mainQuestionCount:3,maxFollowupsPerStudent:6,maxFollowupsPerQuestion:2,selectionMode:'RANDOM',answerTimeLimitSeconds:120};
const dateTime=value=>new Date(value).toLocaleString('vi-VN');
const localTime=value=>{const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
const numeric=form=>({rubricId:form.rubricId||null,title:form.title,mainQuestionCount:Number(form.mainQuestionCount),maxFollowupsPerQuestion:Number(form.maxFollowupsPerQuestion??2),maxFollowupsPerStudent:Number(form.maxFollowupsPerStudent??form.maxFollowupsPerQuestion??0),selectionMode:form.selectionMode||'RANDOM',answerTimeLimitSeconds:Number(form.answerTimeLimitSeconds)});
const isClosed=exam=>['DRAFT','SCHEDULED','CLOSED'].includes(exam.status);
function participation(snapshot){
  if(!Array.isArray(snapshot?.candidates)||snapshot.candidates.some(c=>!Array.isArray(c.attempts)))throw new Error('Chưa xác minh được lịch sử tham gia. Vui lòng thử lại.');
  return snapshot.candidates.filter(c=>c.attempts.length>0||['IN_PROGRESS','COMPLETED','TIMED_OUT','ABORTED'].includes(c.status)).length;
}
async function verifyExam(row,edit=false){
  const [current,snapshot]=await Promise.all([api.exam(row.id),api.examMonitor(row.id)]);
  if(participation(snapshot)>0)throw new Error('Ca thi đã có thí sinh tham gia, không thể sửa hoặc xóa.');
  if(edit&&!isClosed(current))throw new Error('Chỉ được sửa khi ca thi đang đóng. Hãy đóng ca thi trước.');
  return current;
}
function Settings({form,onChange,rubrics}){
  const field=(key,value)=>onChange({...form,[key]:value});
  return <><Field label="Tên kỳ thi" required><input required className={input} maxLength={200} value={form.title} onChange={e=>field('title',e.target.value)}/></Field>
    <Field label="Rubric chấm toàn bài" required><select required className={input} value={form.rubricId||''} onChange={e=>field('rubricId',e.target.value)}><option value="">— Chọn rubric đã công bố —</option>{rubrics.filter(r=>r.status==='PUBLISHED').map(r=><option key={r.id} value={r.id}>{r.name} · {r.maxScore} điểm</option>)}</select><p className="mt-1 text-sm text-mutedtext">AI áp dụng rubric này một lần cho toàn bộ câu hỏi và câu trả lời sau khi lượt thi kết thúc.</p></Field>
    <Field label="Số câu chính (1–100)"><input className={input} required type="number" min={1} max={100} value={form.mainQuestionCount} onChange={e=>field('mainQuestionCount',e.target.value)}/></Field>
    <Field label="Số câu đào sâu tối đa mỗi sinh viên (0–100)"><input className={input} required type="number" min={0} max={100} value={form.maxFollowupsPerStudent??form.maxFollowupsPerQuestion??0} onChange={e=>field('maxFollowupsPerStudent',e.target.value)}/></Field>
    <Field label="Số lượt hỏi xoáy tối đa mỗi câu chính (0–10)"><input className={input} required type="number" min={0} max={10} value={form.maxFollowupsPerQuestion??2} onChange={e=>field('maxFollowupsPerQuestion',e.target.value)}/></Field>
    <Field label="Cách chọn bộ câu hỏi"><select className={input} value={form.selectionMode||'RANDOM'} onChange={e=>field('selectionMode',e.target.value)}><option value="RANDOM">Ngẫu nhiên · tránh lặp lượt liền trước</option><option value="ADAPTIVE">Thích ứng · mức sử dụng và phân bố Dễ / Trung bình / Khó</option></select></Field>
    <Field label="Thời gian mỗi lượt trả lời (15–600 giây)"><input className={input} required type="number" min={15} max={600} value={form.answerTimeLimitSeconds} onChange={e=>field('answerTimeLimitSeconds',e.target.value)}/></Field></>;
}
function SelectedExam({initial,courses,onChanged,onDelete,onEdit,access,onRefreshAccess}){
  const [exam,setExam]=useState(initial),[questionId,setQuestionId]=useState('');
  const [studentEmail,setStudentEmail]=useState(''),[start,setStart]=useState(''),[end,setEnd]=useState('');
  const [editingSchedule,setEditingSchedule]=useState(null),[reschedule,setReschedule]=useState({start:'',end:''});
  const questions=useRemote(()=>api.questions(exam.courseId),[exam.courseId]);
  const pool=useRemote(()=>api.examPool(exam.id),[exam.id]);
  const candidates=useRemote(()=>api.examCandidates(exam.id),[exam.id]);
  const students=useRemote(()=>api.courseStudents(exam.courseId),[exam.courseId]);
  const m=useMutation(()=>{pool.reload();candidates.reload();students.reload();});
  const course=courses.find(c=>c.id===exam.courseId),draft=exam.status==='DRAFT';
  const editable=['DRAFT','SCHEDULED','ACTIVE'].includes(exam.status);
  const readyCount=pool.items.filter(q=>q.status==='APPROVED').length;
  const unchecked=!access||!!access.error;
  const locked=unchecked||access.count>0;
  async function activate(){
    const result=await m.run(()=>api.activateExam(exam.id),'Đã kích hoạt kỳ thi. Sinh viên vào thi trong đúng khung giờ được phân.');
    if(result){setExam(result);onChanged(result);}
  }
  async function assign(e){
    e.preventDefault();if(new Date(start)>=new Date(end)){m.setError('Thời gian kết thúc phải sau thời gian bắt đầu.');return;}
    const result=await m.run(()=>api.assignCandidate(exam.id,{studentEmail:studentEmail.trim(),scheduledStart:new Date(start).toISOString(),scheduledEnd:new Date(end).toISOString()}),'Đã phân lịch cho sinh viên.');
    if(result)setStudentEmail('');
  }
  async function saveSchedule(e){
    e.preventDefault();if(new Date(reschedule.start)>=new Date(reschedule.end)){m.setError('Thời gian kết thúc phải sau thời gian bắt đầu.');return;}
    const result=await m.run(()=>api.rescheduleCandidate(exam.id,editingSchedule.id,{scheduledStart:new Date(reschedule.start).toISOString(),scheduledEnd:new Date(reschedule.end).toISOString()}),'Đã cập nhật khung giờ thi.');
    if(result)setEditingSchedule(null);
  }
  return <div className="space-y-5">
    <Panel title={`${exam.title} · ${exam.status}`}>
      <p>Môn học: <strong>{course?`${course.code} — ${course.name}`:'Đang tải môn học'}</strong></p>
      <p className="text-sm">Mỗi sinh viên: {exam.mainQuestionCount} câu chính + tối đa {exam.maxFollowupsPerStudent??exam.maxFollowupsPerQuestion??0} câu đào sâu cho toàn bộ lượt thi · {exam.answerTimeLimitSeconds} giây/lượt trả lời.</p>
      <p className="text-sm">Mỗi câu chính có tối đa {exam.maxFollowupsPerQuestion??2} lượt hỏi xoáy; vẫn bị chặn bởi tổng ngân sách đào sâu của sinh viên.</p>
      <p className="text-sm text-mutedtext">{exam.selectionMode==='ADAPTIVE'?'Thích ứng theo lịch sử sử dụng 20 lượt gần nhất, phân bố Bloom và độ khó; không suy đoán năng lực hay điểm sinh viên.':'Chọn ngẫu nhiên từ câu hỏi đã được giáo viên duyệt trong đề.'} Ưu tiên tránh lặp bộ câu hỏi của thí sinh thi ngay trước.</p>
      {!pool.loading&&readyCount>=exam.mainQuestionCount&&readyCount<2*exam.mainQuestionCount&&<Notice>Đề có {readyCount} câu cho {exam.mainQuestionCount} câu chính/sinh viên. Có thể phải trùng ít nhất {2*exam.mainQuestionCount-readyCount} câu giữa hai lượt liền nhau; thêm câu đã duyệt vào đề để giảm trùng.</Notice>}
      <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={m.busy||locked||!isClosed(exam)} onClick={()=>onEdit(exam)}>Sửa cấu hình kỳ thi</Button><Button variant="danger" disabled={m.busy||locked} onClick={()=>{if(window.confirm('Bạn chắc chắn muốn xóa?'))m.run(()=>onDelete(exam),'');}}>Xóa</Button>{isClosed(exam)&&<button className={button} disabled={m.busy||pool.loading||!!pool.error||readyCount<exam.mainQuestionCount} onClick={activate}>Mở ca thi</button>}</div>
      <p className="text-sm text-mutedtext">Chỉ xóa khi chưa có thí sinh tham gia. Chỉ sửa khi ca đang đóng hoặc chưa mở và chưa có thí sinh tham gia.</p>
      {access?.error&&<><p role="alert" className="text-sm text-danger-text">{access.error}</p><Button variant="secondary" onClick={onRefreshAccess}>Thử lại</Button></>}
      {isClosed(exam)&&readyCount<exam.mainQuestionCount&&<Notice>Cần ít nhất {exam.mainQuestionCount} câu đã duyệt trong đề trước khi kích hoạt. Hiện có {readyCount} câu hợp lệ.</Notice>}
      {exam.status==='ACTIVE'&&<><button className={button} disabled={m.busy} onClick={async()=>{if(!window.confirm(`Kết thúc kỳ thi ${exam.title}? Sinh viên chưa thi sẽ không thể bắt đầu lượt mới.`))return;const result=await m.run(()=>api.closeExam(exam.id),'Đã kết thúc kỳ thi. Lịch sử thi được giữ lại.');if(result){setExam(result);onChanged(result);}}}>Đóng ca thi</button><p className="text-sm text-mutedtext">Chỉ kết thúc sau khi không còn sinh viên đang thi. Sau khi kết thúc, sinh viên chưa thi sẽ không thể bắt đầu lượt mới.</p></>}
    </Panel>
    <State error={m.error} success={m.success}/>
    <Panel title={`Câu hỏi trong đề (${pool.items.length})`}>
      <State error={pool.error||questions.error}/>
      {draft&&<form onSubmit={async e=>{e.preventDefault();const result=await m.run(()=>api.addExamQuestion(exam.id,questionId),'Đã thêm câu hỏi đã duyệt vào đề.');if(result)setQuestionId('');}} className="flex flex-wrap gap-2">
        <select aria-label="Câu hỏi đã duyệt" className={`${input} flex-1`} required value={questionId} onChange={e=>setQuestionId(e.target.value)}><option value="">— Chọn câu hỏi đã được giáo viên duyệt —</option>{questions.items.filter(q=>q.status==='APPROVED'&&!pool.items.some(p=>p.id===q.id)).map(q=><option key={q.id} value={q.id}>{q.content.slice(0,120)}</option>)}</select>
        <button className={button} disabled={m.busy||!questionId||pool.loading||!!pool.error}>Thêm câu hỏi</button>
      </form>}
      {pool.loading?<p>Đang tải câu hỏi trong đề...</p>:<Table rows={pool.items} columns={[{key:'content',label:'Câu hỏi'},{key:'difficulty',label:'Mức câu hỏi',render:q=>difficultyLabels[q.difficulty]||q.difficulty},{key:'status',label:'Trạng thái'}]} actions={draft?q=><button className={button} disabled={m.busy} onClick={()=>m.run(()=>api.removeExamQuestion(exam.id,q.id),'Đã gỡ câu hỏi khỏi đề thi nháp.')}>Gỡ khỏi đề</button>:undefined}/>}
    </Panel>
    {editable&&<Panel title="Xếp lịch thí sinh">
      <p className="text-sm">Chọn sinh viên đã được Admin ghi danh vào môn để phân lịch. Nếu chưa có sinh viên, nhờ Admin cập nhật tại Môn học & sinh viên.</p>
      <State error={students.error}/>
      <Field label="Chọn sinh viên đã ghi danh"><select className={input} disabled={m.busy} value={students.items.some(s=>s.email===studentEmail)?studentEmail:''} onChange={e=>setStudentEmail(e.target.value)}><option value="">— Hoặc nhập email bên dưới —</option>{students.items.filter(s=>s.active&&s.enrollmentStatus==='ACTIVE').map(s=><option key={s.id} value={s.email}>{s.fullName} · {s.email}</option>)}</select></Field>
      <form onSubmit={assign} className="grid md:grid-cols-3 gap-3"><Field label="Email sinh viên" required><input className={input} type="email" required disabled={m.busy} value={studentEmail} onChange={e=>setStudentEmail(e.target.value)} placeholder="student@example.com"/></Field><Field label="Bắt đầu" required><input className={input} type="datetime-local" required disabled={m.busy} value={start} onChange={e=>setStart(e.target.value)}/></Field><Field label="Kết thúc" required><input className={input} type="datetime-local" required disabled={m.busy} value={end} onChange={e=>setEnd(e.target.value)}/></Field>
        <button className={button} disabled={m.busy}>Phân lịch</button>
      </form>
    </Panel>}
    <Panel title={`Danh sách thí sinh (${candidates.items.length})`}>
      <State error={candidates.error}/>
      {candidates.loading?<p>Đang tải thí sinh...</p>:<Table rows={candidates.items} columns={[{key:'fullName',label:'Sinh viên'},{key:'studentEmail',label:'Email'},{key:'scheduledStart',label:'Bắt đầu',render:c=>dateTime(c.scheduledStart)},{key:'scheduledEnd',label:'Kết thúc',render:c=>dateTime(c.scheduledEnd)},{key:'status',label:'Trạng thái'}]} actions={c=>editable&&['REGISTERED','READY','IN_PROGRESS'].includes(c.status)?<div className="flex flex-wrap gap-2">
        {['REGISTERED','READY'].includes(c.status)&&<button className={button} disabled={m.busy} onClick={()=>{setEditingSchedule(c);setReschedule({start:localTime(c.scheduledStart),end:localTime(c.scheduledEnd)});}}>Sửa lịch</button>}
        <button className={button} disabled={m.busy} onClick={()=>m.run(()=>api.cancelCandidate(exam.id,c.id),'Đã hủy lịch thi. Lịch sử lượt thi và ghi danh môn học vẫn được giữ.')}>Hủy lịch thi</button>
      </div>:<span className="text-sm text-mutedtext">Giữ lịch sử lượt thi</span>}/>}
      <p className="text-sm text-mutedtext">Chỉ sửa khung giờ trước khi sinh viên bắt đầu. Hủy lịch sẽ dừng lượt đang thi và giữ lịch sử đã nộp.</p>
    </Panel>
    {editingSchedule&&<Panel title={`Đổi lịch: ${editingSchedule.fullName}`}><form onSubmit={saveSchedule} className="grid md:grid-cols-2 gap-3"><Field label="Bắt đầu mới" required><input className={input} type="datetime-local" required value={reschedule.start} onChange={e=>setReschedule({...reschedule,start:e.target.value})}/></Field><Field label="Kết thúc mới" required><input className={input} type="datetime-local" required value={reschedule.end} onChange={e=>setReschedule({...reschedule,end:e.target.value})}/></Field><button className={button} disabled={m.busy}>Lưu lịch thi</button><button className={button} type="button" onClick={()=>setEditingSchedule(null)}>Hủy đổi lịch</button></form></Panel>}
  </div>;
}
export default function Exams(){
  const courses=useRemote(()=>api.courses()),list=useRemote(()=>api.exams());
  const [view,setView]=useState('list'),[courseId,setCourseId]=useState(''),[form,setForm]=useState(defaults);
  const rubrics=useRemote(()=>courseId?api.rubrics(courseId):Promise.resolve([]),[courseId]);
  const [exam,setExam]=useState(null),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[toast,setToast]=useState('');
  const [checks,setChecks]=useState({});
  const accessKey=JSON.stringify(list.items.map(row=>[row.id,row.status]));
  useEffect(()=>{
    if(list.loading)return;
    let current=true;
    setChecks({});
    Promise.allSettled(list.items.map(row=>api.examMonitor(row.id).then(participation))).then(results=>{
      if(current)setChecks(Object.fromEntries(results.map((result,index)=>[list.items[index].id,result.status==='fulfilled'?{count:result.value}:{error:result.reason?.message||'Không thể xác minh lịch sử tham gia.'}])));
    });
    return()=>{current=false;};
  },[accessKey,list.loading]);
  const locked=row=>!checks[row.id]||!!checks[row.id].error||checks[row.id].count>0;
  const courseName=row=>{const course=courses.items.find(c=>c.id===row.courseId);return course?`${course.code} — ${course.name}`:row.courseName||row.courseCode||'—';};
  const back=()=>{setView('list');setExam(null);setEditing(null);setError('');};
  function beginCreate(){back();setForm({...defaults});setCourseId('');setView('create');}
  function beginEdit(row){if(!isClosed(row))return;setEditing(row);setForm({...defaults,...row});setCourseId(row.courseId);setExam(null);setError('');setView('edit');}
  async function open(row,edit=false){
    if(busy)return;setBusy(true);setError('');
    try{const result=edit?await verifyExam(row,true):await api.exam(row.id);if(edit)beginEdit(result);else setExam(result);}
    catch(failure){setError(failure.message);list.reload();}finally{setBusy(false);}
  }
  async function save(){
    if(busy||!courseId)return;setBusy(true);setError('');
    try{
      const body={...numeric(form),courseId};
      if(view==='edit'){await verifyExam(editing,true);await api.updateExam(editing.id,body);}else await api.createExam(body);
      setToast(view==='edit'?'Đã cập nhật cấu hình kỳ thi.':'Giáo viên đã tạo kỳ thi nháp.');back();list.reload();
    }catch(failure){setError(failure.message);}finally{setBusy(false);}
  }
  async function remove(row){
    const current=await verifyExam(row);
    await api.deleteExam(row.id);back();list.reload();setToast(current.status==='DRAFT'?'Đã xóa kỳ thi nháp.':'Đã xóa ca thi.');
  }
  async function activate(row){
    if(busy)return;setBusy(true);setError('');
    try{
      const [current,pool]=await Promise.all([api.exam(row.id),api.examPool(row.id)]);
      if(!isClosed(current))throw new Error('Ca thi không ở trạng thái đóng hoặc chưa mở. Vui lòng tải lại danh sách.');
      const readyCount=Array.isArray(pool)?pool.filter(q=>q.status==='APPROVED').length:0;
      if(readyCount<Number(current.mainQuestionCount||defaults.mainQuestionCount))throw new Error('Cần đủ câu hỏi đã duyệt trong đề trước khi mở ca thi.');
      await api.activateExam(row.id);list.reload();setToast('Đã kích hoạt kỳ thi. Sinh viên vào thi trong đúng khung giờ được phân.');
    }catch(failure){setError(failure.message);}finally{setBusy(false);}
  }
  async function close(row){
    if(busy||row.status!=='ACTIVE'||!window.confirm(`Kết thúc kỳ thi ${row.title}? Sinh viên chưa thi sẽ không thể bắt đầu lượt mới.`))return;
    setBusy(true);setError('');
    try{await api.closeExam(row.id);list.reload();setToast('Đã kết thúc kỳ thi. Lịch sử thi được giữ lại.');}
    catch(failure){setError(failure.message);}finally{setBusy(false);}
  }
  return <>
    {view!=='list'?<FormPage title={view==='edit'?'Sửa cấu hình kỳ thi':'Tạo kỳ thi'} onBack={back} onSubmit={save} saving={busy} disabled={!courseId||rubrics.loading||!!courses.error||!!rubrics.error} error={error||courses.error||rubrics.error}>
      <div className="grid gap-4 md:grid-cols-2"><CourseSelect courses={courses.items} value={courseId} disabled={busy||view==='edit'} onChange={value=>{setCourseId(value);setForm(previous=>({...previous,rubricId:''}));}}/><Settings form={form} onChange={setForm} rubrics={rubrics.items}/></div>
    </FormPage>:exam?<section className="min-w-0 space-y-6">
      <Button variant="ghost" disabled={busy} onClick={back}>← Quay lại danh sách</Button>
      <State error={error}/>
      <SelectedExam key={exam.id} initial={exam} courses={courses.items} onEdit={row=>open(row,true)} onDelete={remove} access={checks[exam.id]} onRefreshAccess={list.reload} onChanged={value=>{setExam(value);list.reload();}}/>
    </section>:<ListPage title="Ca thi vấn đáp" description="Giáo viên tạo kỳ thi, cấu hình câu hỏi chính/hỏi xoáy, quản lý đề, sinh viên và khung giờ thi."
      rows={list.items} loading={list.loading||courses.loading||busy} error={list.error||courses.error} onRetry={()=>{setError('');list.reload();courses.reload();}}
      secondaryActions={<Button variant="secondary" onClick={list.reload}>Cập nhật</Button>}
      onCreate={beginCreate} createLabel="+ Tạo ca thi" onEdit={row=>open(row,true)} onDelete={remove} editDisabled={row=>busy||locked(row)||!isClosed(row)} deleteDisabled={row=>busy||locked(row)}
      editTitle="Chỉ sửa khi ca đang đóng hoặc chưa mở và chưa có thí sinh tham gia." deleteTitle="Chỉ xóa khi chưa có thí sinh tham gia."
      searchKeys={['title','courseName','courseCode',courseName]} searchPlaceholder="Tìm kiếm ca thi theo tên hoặc môn học..."
      extraRowActions={row=><><Button variant="secondary" disabled={busy} onClick={()=>open(row)}>Tìm kỳ thi</Button>{isClosed(row)&&<Button disabled={busy} onClick={()=>activate(row)}>Mở ca thi</Button>}{row.status==='ACTIVE'&&<Button variant="danger" disabled={busy} onClick={()=>close(row)}>Đóng ca thi</Button>}{checks[row.id]?.error&&<Button variant="secondary" title={checks[row.id].error} onClick={list.reload}>Thử lại</Button>}</>}
      columns={[{key:'title',label:'Tên kỳ thi',className:'min-w-56',render:row=><span className="font-medium">{row.title}</span>},{key:'courseId',label:'Môn học',render:courseName},{key:'status',label:'Trạng thái',render:row=><StatusBadge status={row.status}/>},{key:'participation',label:'Thí sinh tham gia',render:row=>!checks[row.id]?'Đang kiểm tra...':checks[row.id].error?'Chưa xác minh':checks[row.id].count+' thí sinh'}]} />}
    {view==='list'&&!exam&&<State error={error}/>}
    {toast&&<div role="status"><Toast toast={{message:toast}} onClose={()=>setToast('')}/></div>}
  </>;
}
