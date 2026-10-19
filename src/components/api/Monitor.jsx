import React,{useEffect,useState,useRef} from 'react';
import {api} from '../../services/api';
import usePolling from '../../hooks/usePolling';
import {Heading,Notice,Panel,Field,State,Table,button,input,useRemote} from './parts';

const dates=value=>value?new Date(value).toLocaleString('vi-VN'):'—';
const phases={PREPARING:'Chuẩn bị câu hỏi',QUESTION_READY:'Đang nghe câu hỏi',ANSWERING:'Đang trả lời',PROCESSING:'Đang xử lý câu trả lời',TRANSCRIPTION_FAILED:'Lỗi nhận dạng giọng nói',AI_FAILED:'AI cần thử lại',DEADLINE_REACHED:'Đã hết thời gian câu',COMPLETED:'Hoàn thành',IN_PROGRESS:'Đang thi',CANCELLED:'Đã hủy',TIMED_OUT:'Hết giờ'};
function Transcript({examId,attemptId,onClose}){
  const data=usePolling(()=>api.examTranscript(examId,attemptId),[examId,attemptId]);
  const [audio,setAudio]=useState(null),[audioError,setAudioError]=useState(''),[audioBusy,setAudioBusy]=useState('');
  const alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>()=>{if(audio?.url)URL.revokeObjectURL(audio.url);},[audio?.url]);
  async function listen(turn){
    setAudioBusy(turn.id);setAudioError('');
    try{const blob=await api.examRecording(examId,attemptId,turn.id);if(alive.current)setAudio({id:turn.id,url:URL.createObjectURL(blob)});}
    catch(error){if(alive.current)setAudioError(error.message);}finally{if(alive.current)setAudioBusy('');}
  }
  function download(){
    const value=data.value;if(!value)return;
    const text=[`Hội thoại thi vấn đáp — ${value.studentName}`,value.email,`Lượt ${value.attemptNo} · ${phases[value.status]||value.status}`,`Bắt đầu: ${dates(value.startedAt)}`,`Kết thúc: ${dates(value.endedAt)}`,...value.turns.map(t=>`\n[${dates(t.createdAt)}] Câu ${t.sequenceNo}${t.followupNumber?` · Đào sâu ${t.followupNumber}`:''} · ${t.speaker==='STUDENT'?'Sinh viên':'Giám khảo AI'}\n${t.text||'Chưa có văn bản nhận dạng.'}`)].join('\n');
    const url=URL.createObjectURL(new Blob(['\ufeff',text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`hoi-thoai-${attemptId}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <Panel title="Hội thoại lượt thi"><div className="flex flex-wrap gap-2"><button className={button} onClick={onClose}>Đóng hội thoại</button><button className={button} onClick={data.reload}>Tải lại hội thoại</button><button className={button} disabled={!data.value} onClick={download}>Tải transcript</button></div>
    <State error={data.error||audioError}/>{data.loading&&<p role="status">Đang tải hội thoại...</p>}
    {data.value&&<><p><strong>{data.value.studentName}</strong> · {data.value.email} · Lượt {data.value.attemptNo} · {phases[data.value.status]||data.value.status}</p><p className="text-sm text-mutedtext">Bắt đầu: {dates(data.value.startedAt)} · Kết thúc: {dates(data.value.endedAt)} · Cập nhật: {dates(data.value.serverNow)}</p>
      <div className="max-h-[650px] overflow-y-auto space-y-3" aria-label="Nội dung hội thoại">{data.value.turns.length?data.value.turns.map(t=><article key={t.id} className={`border border-appborder rounded-lg p-4 ${t.speaker==='AI'?'bg-primary-light':''}`}><p className="font-semibold text-sm">{t.speaker==='STUDENT'?'Sinh viên':'Giám khảo AI'} · Câu {t.sequenceNo}{t.followupNumber?` · Đào sâu ${t.followupNumber}`:''}</p><p className="text-xs text-mutedtext mt-1">{dates(t.createdAt)}{t.deadline?` · Hạn trả lời: ${dates(t.deadline)}`:''}</p><p className="whitespace-pre-wrap mt-2 text-sm">{t.text||(t.speechStatus==='PROCESSING'?'Đang chuyển âm thanh thành văn bản...':t.speechStatus==='FAILED'?'Nhận dạng bản ghi thất bại.':'Chưa có nội dung.')}</p>{t.hasAudio&&<div className="mt-3"><button className={button} disabled={!!audioBusy} onClick={()=>listen(t)}>{audioBusy===t.id?'Đang tải âm thanh...':'Nghe bản ghi'}</button>{audio?.id===t.id&&<audio className="mt-2 max-w-full" src={audio.url} controls autoPlay aria-label="Bản ghi lượt hội thoại"/>}</div>}</article>):<p>Chưa có lượt hội thoại được lưu.</p>}</div>
    </>}
    <p className="text-xs text-mutedtext">Chỉ hiển thị câu trả lời và âm thanh đã được nộp lên máy chủ. Phụ đề tạm thời và bản ghi chưa nộp trên máy sinh viên chưa xuất hiện ở đây.</p>
  </Panel>;
}
export default function Monitor(){
  const exams=useRemote(()=>api.exams());
  const [examId,setExamId]=useState(''),[search,setSearch]=useState(''),[filter,setFilter]=useState('ALL'),[selected,setSelected]=useState(''),[now,setNow]=useState(Date.now());
  const data=usePolling(()=>api.examMonitor(examId),[examId],!!examId);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  const value=data.value,rows=value?.candidates||[];
  const serverNow=now-(data.receivedAt&&value?data.receivedAt-Date.parse(value.serverNow):0);
  const latest=c=>c.attempts?.[0];
  const category=c=>latest(c)?.status||'WAITING';
  function status(c){const a=latest(c);return a?(phases[a.phase]||phases[a.status]||a.status):c.status==='CANCELLED'?'Đã hủy':Date.parse(c.scheduledEnd)<serverNow?'Quá giờ chưa thi':Date.parse(c.scheduledStart)>serverNow?'Chưa đến giờ':'Chờ vào thi';}
  const filtered=rows.filter(c=>(filter==='ALL'||(filter==='ATTENTION'?['TRANSCRIPTION_FAILED','AI_FAILED','DEADLINE_REACHED'].includes(latest(c)?.phase):category(c)===filter))&&`${c.fullName} ${c.email}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
  return <section className="space-y-5"><Heading title="Giám sát ca thi" subtitle="Theo dõi tiến độ và hội thoại của các kỳ thi thuộc môn được phân công. Tự cập nhật mỗi 5 giây."/>
    <Panel title="Chọn kỳ thi"><Field label="Kỳ thi cần giám sát"><select className={input} value={examId} onChange={e=>{setExamId(e.target.value);setSelected('');setFilter('ALL');setSearch('');}}><option value="">— Chọn kỳ thi —</option>{exams.items.map(e=><option key={e.id} value={e.id}>{e.title} ({e.status})</option>)}</select></Field><State error={exams.error}/>{!exams.loading&&!exams.error&&!exams.items.length&&<p>Chưa có kỳ thi thuộc môn bạn phụ trách.</p>}</Panel>
    <State error={data.error}/>{data.error&&!value&&<Notice>Nếu vừa cập nhật hệ thống, hãy khởi động lại backend rồi tải lại trang để sử dụng chức năng giám sát mới.</Notice>}{data.error&&value&&<Notice>Dữ liệu đang hiển thị từ lần cập nhật thành công trước. Máy chủ chưa đồng bộ được thông tin mới.</Notice>}{data.loading&&<p role="status">Đang tải giám sát...</p>}
    {value&&<><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold">{value.title} · {value.examStatus}</h2><p className="text-sm">{value.courseCode} — {value.courseName}</p><p className="text-xs text-mutedtext">Cập nhật thành công: {dates(value.serverNow)}</p></div><button className={button} onClick={data.reload}>Cập nhật ngay</button></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[['Tổng thí sinh',rows.length],['Chưa bắt đầu',rows.filter(c=>!latest(c)).length],['Đang thi',rows.filter(c=>category(c)==='IN_PROGRESS').length],['Hoàn thành',rows.filter(c=>category(c)==='COMPLETED').length]].map(([label,count])=><div key={label} className="border border-appborder bg-surface rounded-xl p-4"><p className="text-sm text-mutedtext">{label}</p><p className="text-2xl font-semibold">{count}</p></div>)}</div>
      <div className="grid md:grid-cols-2 gap-3"><Field label="Tìm sinh viên"><input className={input} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Họ tên hoặc email"/></Field><Field label="Lọc trạng thái"><select className={input} value={filter} onChange={e=>setFilter(e.target.value)}><option value="ALL">Tất cả</option><option value="WAITING">Chưa bắt đầu</option><option value="IN_PROGRESS">Đang thi</option><option value="COMPLETED">Hoàn thành</option><option value="ATTENTION">Cần chú ý</option></select></Field></div>
      <Table rows={filtered} columns={[{key:'fullName',label:'Sinh viên',render:c=><><p className="font-semibold">{c.fullName}</p><p>{c.email}</p></>},{key:'scheduledStart',label:'Lịch thi',render:c=><>{dates(c.scheduledStart)}<br/>{dates(c.scheduledEnd)}</>},{key:'status',label:'Trạng thái',render:c=><><p>{status(c)}</p>{category(c)==='IN_PROGRESS'&&latest(c)?.currentSequence&&<p>Câu chính {latest(c).currentSequence}</p>}{category(c)==='IN_PROGRESS'&&latest(c)?.deadline&&<p>Còn {Math.max(0,Math.ceil((Date.parse(latest(c).deadline)-serverNow)/1000))} giây</p>}</>},{key:'progress',label:'Tiến độ',render:c=>latest(c)?<><p>{latest(c).completedQuestions}/{latest(c).questionCount} câu chính</p><p>{latest(c).followupsUsed} hỏi xoáy · {latest(c).timedOutQuestions} câu hết giờ</p><p className="text-xs text-mutedtext">Hoạt động cuối: {dates(latest(c).lastActivityAt)}</p></>:'Chưa có lượt thi'}]} actions={c=>c.attempts?.length?<div className="space-y-2">{c.attempts.map(a=><button key={a.id} className={button} onClick={()=>setSelected(a.id)}>Xem hội thoại lượt {a.attemptNo}</button>)}</div>:<span className="text-mutedtext">Chưa bắt đầu</span>}/>
      {selected&&<Transcript key={`${examId}-${selected}`} examId={examId} attemptId={selected} onClose={()=>setSelected('')}/>}
    </>}
  </section>;
}
