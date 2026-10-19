import React, {useState} from 'react';
import {api} from '../../services/api';
import {button,input,Heading,Panel,Field,CourseSelect,useRemote,useMutation,State,Table,Notice} from './parts';

const defaults={title:'',mainQuestionCount:3,maxFollowupsPerStudent:6,maxFollowupsPerQuestion:2,selectionMode:'RANDOM',answerTimeLimitSeconds:120};
const dateTime=value=>new Date(value).toLocaleString('vi-VN');
const localTime=value=>{const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
const numeric=form=>({title:form.title,mainQuestionCount:Number(form.mainQuestionCount),maxFollowupsPerQuestion:Number(form.maxFollowupsPerQuestion??2),maxFollowupsPerStudent:Number(form.maxFollowupsPerStudent??form.maxFollowupsPerQuestion??0),selectionMode:form.selectionMode||'RANDOM',answerTimeLimitSeconds:Number(form.answerTimeLimitSeconds)});
function Settings({form,onChange}){
  const field=(key,value)=>onChange({...form,[key]:value});
  return <><Field label="Tên kỳ thi" required><input required className={input} maxLength={200} value={form.title} onChange={e=>field('title',e.target.value)}/></Field>
    <Field label="Số câu chính (1–100)"><input className={input} required type="number" min={1} max={100} value={form.mainQuestionCount} onChange={e=>field('mainQuestionCount',e.target.value)}/></Field>
    <Field label="Số câu đào sâu tối đa mỗi sinh viên (0–100)"><input className={input} required type="number" min={0} max={100} value={form.maxFollowupsPerStudent??form.maxFollowupsPerQuestion??0} onChange={e=>field('maxFollowupsPerStudent',e.target.value)}/></Field>
    <Field label="Số lượt hỏi xoáy tối đa mỗi câu chính (0–10)"><input className={input} required type="number" min={0} max={10} value={form.maxFollowupsPerQuestion??2} onChange={e=>field('maxFollowupsPerQuestion',e.target.value)}/></Field>
    <Field label="Cách chọn bộ câu hỏi"><select className={input} value={form.selectionMode||'RANDOM'} onChange={e=>field('selectionMode',e.target.value)}><option value="RANDOM">Ngẫu nhiên · tránh lặp lượt liền trước</option><option value="ADAPTIVE">Thích ứng · mức sử dụng và phân bố Bloom/độ khó</option></select></Field>
    <Field label="Thời gian mỗi lượt trả lời (15–600 giây)"><input className={input} required type="number" min={15} max={600} value={form.answerTimeLimitSeconds} onChange={e=>field('answerTimeLimitSeconds',e.target.value)}/></Field></>;
}
function SelectedExam({initial,courses,onChanged,onDeleted}){
  const [exam,setExam]=useState(initial),[settings,setSettings]=useState(null),[questionId,setQuestionId]=useState('');
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
  async function saveSettings(e){
    e.preventDefault();const result=await m.run(()=>api.updateExam(exam.id,{...numeric(settings),courseId:exam.courseId}),'Đã cập nhật cấu hình kỳ thi.');
    if(result){setExam(result);setSettings(null);onChanged(result);}
  }
  async function activate(){
    const result=await m.run(()=>api.activateExam(exam.id),'Đã kích hoạt kỳ thi. Sinh viên vào thi trong đúng khung giờ được phân.');
    if(result){setExam(result);setSettings(null);onChanged(result);}
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
      <div className="flex flex-wrap gap-2">{draft&&<button className={button} disabled={m.busy} onClick={()=>setSettings({...exam})}>Sửa cấu hình kỳ thi</button>}{['DRAFT','SCHEDULED'].includes(exam.status)&&<button className={button} disabled={m.busy||pool.loading||!!pool.error||readyCount<exam.mainQuestionCount} onClick={activate}>Kích hoạt kỳ thi</button>}</div>
      {draft&&<button className={button} disabled={m.busy} onClick={async()=>{if(window.confirm(`Xóa kỳ thi nháp ${exam.title} cùng đề và lịch nháp? Kỳ thi có lượt thi sẽ không được xóa.`)){const result=await m.run(()=>api.deleteExam(exam.id),'Đã xóa kỳ thi nháp.');if(result)onDeleted?.();}}}>Xóa kỳ thi nháp</button>}
      {['DRAFT','SCHEDULED'].includes(exam.status)&&readyCount<exam.mainQuestionCount&&<Notice>Cần ít nhất {exam.mainQuestionCount} câu đã duyệt trong đề trước khi kích hoạt. Hiện có {readyCount} câu hợp lệ.</Notice>}
      {exam.status==='ACTIVE'&&<><button className={button} disabled={m.busy} onClick={async()=>{const result=await m.run(()=>api.closeExam(exam.id),'Đã kết thúc kỳ thi. Lịch sử thi được giữ lại.');if(result){setExam(result);onChanged(result);}}}>Kết thúc kỳ thi</button><p className="text-sm text-mutedtext">Chỉ kết thúc sau khi không còn sinh viên đang thi. Sau khi kết thúc, sinh viên chưa thi sẽ không thể bắt đầu lượt mới.</p></>}
    </Panel>
    <State error={m.error} success={m.success}/>
    {settings&&<Panel title="Sửa cấu hình kỳ thi"><form onSubmit={saveSettings} className="grid md:grid-cols-2 gap-3"><Settings form={settings} onChange={setSettings}/><button className={button} disabled={m.busy}>Lưu cấu hình</button><button type="button" className={button} onClick={()=>setSettings(null)}>Hủy sửa cấu hình</button></form></Panel>}
    <Panel title={`Câu hỏi trong đề (${pool.items.length})`}>
      <State error={pool.error||questions.error}/>
      {draft&&<form onSubmit={async e=>{e.preventDefault();const result=await m.run(()=>api.addExamQuestion(exam.id,questionId),'Đã thêm câu hỏi đã duyệt vào đề.');if(result)setQuestionId('');}} className="flex flex-wrap gap-2">
        <select aria-label="Câu hỏi đã duyệt" className={`${input} flex-1`} required value={questionId} onChange={e=>setQuestionId(e.target.value)}><option value="">— Chọn câu hỏi đã được giáo viên duyệt —</option>{questions.items.filter(q=>q.status==='APPROVED'&&!pool.items.some(p=>p.id===q.id)).map(q=><option key={q.id} value={q.id}>{q.content.slice(0,120)}</option>)}</select>
        <button className={button} disabled={m.busy||!questionId||pool.loading||!!pool.error}>Thêm câu hỏi</button>
      </form>}
      {pool.loading?<p>Đang tải câu hỏi trong đề...</p>:<Table rows={pool.items} columns={[{key:'content',label:'Câu hỏi'},{key:'bloomLevel',label:'Bloom'},{key:'difficulty',label:'Độ khó'},{key:'status',label:'Trạng thái'}]} actions={draft?q=><button className={button} disabled={m.busy} onClick={()=>m.run(()=>api.removeExamQuestion(exam.id,q.id),'Đã gỡ câu hỏi khỏi đề thi nháp.')}>Gỡ khỏi đề</button>:undefined}/>}
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
      {candidates.loading?<p>Đang tải thí sinh...</p>:<Table rows={candidates.items} columns={[{key:'fullName',label:'Sinh viên'},{key:'studentEmail',label:'Email'},{key:'scheduledStart',label:'Bắt đầu',render:c=>dateTime(c.scheduledStart)},{key:'scheduledEnd',label:'Kết thúc',render:c=>dateTime(c.scheduledEnd)},{key:'status',label:'Trạng thái'}]} actions={c=>editable&&['REGISTERED','READY'].includes(c.status)?<div className="flex flex-wrap gap-2"><button className={button} disabled={m.busy} onClick={()=>{setEditingSchedule(c);setReschedule({start:localTime(c.scheduledStart),end:localTime(c.scheduledEnd)});}}>Sửa lịch</button><button className={button} disabled={m.busy} onClick={()=>m.run(()=>api.removeCandidate(exam.id,c.id),'Đã bỏ sinh viên khỏi lịch thi; ghi danh môn học vẫn được giữ.')}>Bỏ khỏi kỳ thi</button></div>:<span className="text-sm text-mutedtext">Giữ lịch sử lượt thi</span>}/>} 
      <p className="text-sm text-mutedtext">Sinh viên đăng nhập để xem lịch theo tên kỳ thi. Chỉ sửa hoặc bỏ lịch khi sinh viên chưa bắt đầu thi.</p>
    </Panel>
    {editingSchedule&&<Panel title={`Đổi lịch: ${editingSchedule.fullName}`}><form onSubmit={saveSchedule} className="grid md:grid-cols-2 gap-3"><Field label="Bắt đầu mới" required><input className={input} type="datetime-local" required value={reschedule.start} onChange={e=>setReschedule({...reschedule,start:e.target.value})}/></Field><Field label="Kết thúc mới" required><input className={input} type="datetime-local" required value={reschedule.end} onChange={e=>setReschedule({...reschedule,end:e.target.value})}/></Field><button className={button} disabled={m.busy}>Lưu lịch thi</button><button className={button} type="button" onClick={()=>setEditingSchedule(null)}>Hủy đổi lịch</button></form></Panel>}
  </div>;
}
export default function Exams(){
  const courses=useRemote(()=>api.courses()),list=useRemote(()=>api.exams());
  const [courseId,setCourseId]=useState(''),[form,setForm]=useState(defaults),[examId,setExamId]=useState(''),[exam,setExam]=useState(null);
  const m=useMutation(list.reload);
  async function create(e){e.preventDefault();const result=await m.run(()=>api.createExam({...numeric(form),courseId}),'Giáo viên đã tạo kỳ thi nháp.');if(result){setExam(result);setExamId(result.id);setForm(defaults);}}
  async function lookup(){if(!examId)return;const result=await m.run(()=>api.exam(examId),'Đã tải kỳ thi.');if(result)setExam(result);}
  return <section className="space-y-5"><Heading title="Giáo viên quản lý kỳ thi & lịch thi" subtitle="Giáo viên tạo kỳ thi, cấu hình câu hỏi chính/hỏi xoáy, quản lý đề, sinh viên và khung giờ thi."/>
    <Panel title="Tạo kỳ thi"><form onSubmit={create} className="grid md:grid-cols-2 gap-3"><CourseSelect courses={courses.items} value={courseId} disabled={m.busy} onChange={setCourseId}/><Settings form={form} onChange={setForm}/><button className={button} disabled={m.busy||!courseId}>Tạo kỳ thi</button></form></Panel>
    <Panel title="Mở kỳ thi theo tên"><div className="flex gap-2"><select aria-label="Kỳ thi cần mở" className={`${input} flex-1`} value={examId} disabled={m.busy} onChange={e=>{setExamId(e.target.value);setExam(null);m.setError('');m.setSuccess('');}}><option value="">— Chọn kỳ thi theo tên —</option>{list.items.map(e=><option value={e.id} key={e.id}>{e.title} ({e.status})</option>)}</select><button className={button} disabled={m.busy||!examId} onClick={lookup}>Tìm kỳ thi</button></div></Panel>
    <State error={m.error||courses.error||list.error} success={m.success}/>
    {exam&&<SelectedExam key={exam.id} initial={exam} courses={courses.items} onChanged={value=>{setExam(value);list.reload();}} onDeleted={()=>{setExam(null);setExamId('');list.reload();m.setSuccess('Đã xóa kỳ thi nháp.');}}/>}
  </section>;
}
