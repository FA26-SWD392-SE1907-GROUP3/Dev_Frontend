import React, { useRef, useState } from 'react';
import { api } from '../../services/api';
import { button, input, Panel, Field, CourseSelect, useRemote, useMutation, State, Notice } from './parts';
import {Button,FormPage,ListPage,SuccessToast} from '../ui';
import StatusBadge from '../common/StatusBadge';
import { difficultyLabels } from '../common/questionLevels';
import useCourseCollection from '../../hooks/useCourseCollection';

const labels = { UPLOADED: 'Đã tải lên', PROCESSING: 'Đang xử lý', READY: 'Sẵn sàng', FAILED: 'Xử lý thất bại' };
export function CourseMaterials({ courseId='', courseState, onQuestionsGenerated, toolbar, initialView='list' }) {
  const scope = courseState || {items: courseId ? [{id:courseId}] : [], loading:false, error:''};
  const [view,setView]=useState(initialView);
  const [actionCourseId,setActionCourseId]=useState(courseId);
  const data = useCourseCollection(scope, api.materials);
  const rows = courseId ? data.items.filter(row=>row.courseId===courseId) : data.items;
  const sourceMaterials = data.items.filter(row=>row.courseId===actionCourseId);
  const jobs = useRemote(() => view==='ai'&&actionCourseId ? api.generationJobs(actionCourseId) : Promise.resolve([]), [view,actionCourseId]);
  const ai = useRemote(() => view==='ai' ? api.aiStatus() : Promise.resolve([]), [view]);
  const [previewId, setPreviewId] = useState('');
  const preview = useRemote(() => previewId ? api.materialChunks(previewId) : Promise.resolve([]), [previewId]);
  const m = useMutation(() => { data.reload(); jobs.reload(); });
  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [editingMaterial,setEditingMaterial]=useState(null),[materialName,setMaterialName]=useState('');
  const [selected, setSelected] = useState([]);
  const [generation, setGeneration] = useState({ desiredCount: 5, difficulty: 'MEDIUM', instruction: '' });
  const [generating,setGenerating]=useState(false),[generationError,setGenerationError]=useState(''),[generationSuccess,setGenerationSuccess]=useState(''),[generatedJobId,setGeneratedJobId]=useState('');
  const generated=useRemote(()=>generatedJobId?api.generationQuestions(generatedJobId):Promise.resolve([]),[generatedJobId]);
  const configured = ai.items[0]?.configured;
  async function upload(e) {
    e.preventDefault();
    if (!actionCourseId) { m.setError('Chọn môn học cho tài liệu mới.'); return; }
    if (!file || !/\.(pdf|docx)$/i.test(file.name) || file.size === 0 || file.size > 20 * 1024 * 1024) { m.setError('Chọn một tệp PDF/DOCX không rỗng, tối đa 20 MB.'); return; }
    const result = await m.run(() => api.uploadMaterial(actionCourseId, file), 'Đã tải tài liệu lên. Chọn Xử lý văn bản để dùng cho AI.');
    if (result) { setFile(null); fileInput.current.value = '';setView('list'); }
  }
  async function download(material) {
    await m.run(async () => {
      const blob = await api.downloadMaterial(material.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = material.originalFilename; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'Đã tải tệp.');
  }
  async function generate(e) {
    e.preventDefault();
    if(generating||m.busy)return;
    setGenerationError('');setGenerationSuccess('');
    if(!actionCourseId){setGenerationError('Chọn môn học để sinh câu hỏi.');return;}
    if(!selected.length||selected.length>5){setGenerationError('Chọn từ 1 đến 5 tài liệu đã xử lý ở phần Tài liệu nguồn.');return;}
    if(!difficultyLabels[generation.difficulty]){setGenerationError('Chọn mức câu hỏi Dễ, Trung bình hoặc Khó.');return;}
    const count=Number(generation.desiredCount);
    if(!Number.isInteger(count)||count<1||count>20){setGenerationError('Số câu hỏi phải là số nguyên từ 1 đến 20.');return;}
    setGenerating(true);
    try{
      const job = await api.generateQuestions(actionCourseId, { ...generation, desiredCount: count, materialIds: selected });
      if (job.status === 'FAILED') throw new Error(job.errorMessage || 'Sinh câu hỏi thất bại. Vui lòng thử lại.');
      if(job.status!=='COMPLETED'||!job.generatedCount)throw new Error('Lần sinh này chưa có câu hỏi hoàn tất. Hãy kiểm tra lịch sử sinh câu hỏi bên dưới.');
      setGeneratedJobId(job.id);setGenerationSuccess(`Đã tạo ${job.generatedCount} câu hỏi chờ giáo viên duyệt. Câu hỏi hiển thị bên dưới; chưa đưa vào ngân hàng chính thức.`);
      onQuestionsGenerated?.(job);
    }catch(error){setGenerationError(error.message||'Không sinh được câu hỏi. Vui lòng thử lại.');}
    finally{setGenerating(false);jobs.reload();}
  }
  async function index(material) {
    const result=await m.run(()=>api.indexMaterial(material.id),'Đã xử lý văn bản. Tài liệu sẵn sàng để tạo câu hỏi.');
    if(!result)data.reload();
  }
  function changeActionCourse(id) {
    setActionCourseId(id);setSelected([]);setGeneratedJobId('');setGenerationError('');setGenerationSuccess('');
  }
  function beginAction(nextView) {
    changeActionCourse(courseId || (scope.items.length===1?scope.items[0].id:''));
    setFile(null);setView(nextView);m.setError('');
  }
  const actionPicker=courseState?<CourseSelect courses={scope.items} value={actionCourseId} disabled={m.busy||generating} onChange={changeActionCourse}/>:null;
  const back=()=>{setView('list');setEditingMaterial(null);m.setError('');};
  const toast=<SuccessToast message={m.success} onClose={()=>m.setSuccess('')}/>;
  if(view==='create')return <><FormPage title="Tải tài liệu lên" onBack={back} onSubmit={upload} saving={m.busy} disabled={!actionCourseId||!file||!!data.error} error={m.error||data.error}>
    {actionPicker}
    <Field label="Tệp PDF hoặc DOCX (tối đa 20 MB)" required><input ref={fileInput} type="file" accept=".pdf,.docx" className={input} required onChange={e=>setFile(e.target.files?.[0]||null)}/></Field>
    <p className="mt-3 text-sm text-mutedtext">PDF cần có văn bản có thể chọn và sao chép. Tệp PDF ảnh cần được OCR trước.</p>
  </FormPage>{toast}</>;
  if(view==='edit')return <><FormPage title="Đổi tên tài liệu" onBack={back} onSubmit={async e=>{e.preventDefault();const result=await m.run(()=>api.renameMaterial(editingMaterial.id,materialName),'Đã đổi tên tài liệu.');if(result){setEditingMaterial(null);setView('list');}}} saving={m.busy} error={m.error}>
    <Field label="Tên tài liệu"><input className={input} required maxLength={255} value={materialName} onChange={e=>setMaterialName(e.target.value)}/></Field>
  </FormPage>{toast}</>;
  if(view==='ai')return <section className="min-w-0 space-y-6"><Button variant="ghost" disabled={generating||m.busy} onClick={back}>← Quay lại danh sách</Button>
    <Panel title="Sinh câu hỏi bằng AI">
      <State error={ai.error || data.error} />
      {(ai.loading||data.loading)&&<p role="status">Đang kiểm tra tài liệu và cấu hình AI...</p>}
      {!ai.loading && !configured && !ai.error && <Notice>Quản trị viên cần cấu hình OpenAI API key trên máy chủ để bật chức năng sinh câu hỏi.</Notice>}
      <p className="text-sm text-mutedtext">Chọn tối đa 5 tài liệu đã xử lý và mức câu hỏi Dễ, Trung bình hoặc Khó. Rubric được chọn tại kỳ thi để chấm toàn bài sau khi thi xong.</p>
      {actionPicker}
      <form onSubmit={generate} noValidate className="space-y-3">
        <fieldset disabled={m.busy || generating || !configured || data.loading || !!data.error} className="space-y-3">
          <legend className="text-sm font-medium mb-2">Tài liệu nguồn</legend>
          {sourceMaterials.filter(item => item.extractionStatus === 'READY').map(material => <label className="flex gap-2 items-center text-sm" key={material.id}><input type="checkbox" checked={selected.includes(material.id)} disabled={!selected.includes(material.id) && selected.length >= 5} onChange={e => setSelected(e.target.checked ? [...selected, material.id] : selected.filter(id => id !== material.id))} />{material.originalFilename}</label>)}
          {!sourceMaterials.some(item => item.extractionStatus === 'READY') && <p className="text-sm text-mutedtext">Tải lên và xử lý tài liệu trước khi sinh câu hỏi.</p>}
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Số câu hỏi (1–20)" required><input className={input} type="number" required min="1" max="20" step="1" value={generation.desiredCount} onChange={e => setGeneration({ ...generation, desiredCount: e.target.value })} /></Field>
            <Field label="Mức câu hỏi"><select className={input} value={generation.difficulty} onChange={e => setGeneration({ ...generation, difficulty: e.target.value })}>{Object.entries(difficultyLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          </div>
          <Field label="Yêu cầu bổ sung"><textarea className={input} maxLength={2000} value={generation.instruction} onChange={e => setGeneration({ ...generation, instruction: e.target.value })} placeholder="Ví dụ: ưu tiên câu hỏi vận dụng về kiến trúc phần mềm" /></Field>
          <button className={button}>{generating ? 'Đang sinh câu hỏi...' : 'Sinh câu hỏi AI'}</button>
        </fieldset>
        {generating&&<Notice>AI đang đọc tài liệu và sinh câu hỏi. Có thể mất khoảng 1–2 phút; vui lòng chờ kết quả.</Notice>}
        <State error={generationError} success={generationSuccess}/>
      </form>
    </Panel>
    {generatedJobId&&<Panel title="Câu hỏi AI đã tạo"><State error={generated.error}/>{generated.loading?<p>Đang tải câu hỏi đã tạo...</p>:<>
      <p className="text-sm">Giáo viên mở <strong>Ngân hàng câu hỏi → Chờ giáo viên duyệt</strong> của môn này để xem nguồn, sửa, từ chối hoặc duyệt. Các câu dưới đây vẫn giữ trạng thái do giáo viên quyết định.</p>
      {!generated.items.length&&!generated.error&&<Notice>Chưa tìm thấy câu hỏi của lần sinh này.</Notice>}
      {generated.items.map((q,index)=><article key={q.id} className="border border-appborder rounded-lg p-3 space-y-2"><h3 className="font-medium">{index+1}. {q.content}</h3><p className="text-sm">Mức câu hỏi: {difficultyLabels[q.difficulty]||q.difficulty}</p><p className="text-sm whitespace-pre-wrap"><strong>Đáp án tham khảo:</strong> {q.referenceAnswer}</p></article>)}
    </>}<button type="button" className={button} disabled={generated.loading} onClick={generated.reload}>Tải lại câu hỏi của lần sinh này</button></Panel>}

    <ListPage title="Lịch sử sinh câu hỏi" rows={jobs.items} loading={jobs.loading} error={jobs.error} onRetry={jobs.reload} searchKeys={['status','errorMessage']}
      secondaryActions={<Button variant="secondary" disabled={jobs.loading} onClick={jobs.reload}>Tải lại lịch sử sinh câu hỏi</Button>}
      columns={[{key:'createdAt',label:'Thời gian',render:row=>new Date(row.createdAt).toLocaleString('vi-VN')},{key:'status',label:'Trạng thái'},{key:'generatedCount',label:'Số câu đã sinh'},{key:'errorMessage',label:'Thông báo'}]}
      extraRowActions={job=>job.status==='COMPLETED'&&job.generatedCount>0?<Button variant="secondary" onClick={()=>{setGeneratedJobId(job.id);if(job.id===generatedJobId)generated.reload();}}>Xem câu hỏi</Button>:null}/>
    {toast}
  </section>;
  return <section className="min-w-0 space-y-6"><ListPage title="Tài liệu học tập" description="Tải PDF/DOCX, xử lý văn bản và tạo câu hỏi chờ duyệt từ tài liệu." toolbar={toolbar}
    rows={rows} loading={data.loading} error={data.error} onRetry={()=>{m.setError('');data.reload();}} searchKeys={['originalFilename','name','courseCode','courseName']} onCreate={scope.items.length?()=>beginAction('create'):undefined} createLabel="+ Tải tài liệu lên"
    secondaryActions={<Button variant="secondary" disabled={!scope.items.length||data.loading} onClick={()=>beginAction('ai')}>Nhờ AI tạo câu hỏi</Button>}
    onEdit={material=>{setEditingMaterial(material);setMaterialName(material.originalFilename);setView('edit');m.setError('');}}
    onDelete={async material=>{await api.deleteMaterial(material.id);data.reload();setSelected(ids=>ids.filter(id=>id!==material.id));if(previewId===material.id)setPreviewId('');m.setSuccess('Đã xóa tài liệu chưa sử dụng.');}} canDeleteRow={()=>!generating}
    getRowLabel={material=>material.originalFilename}
    columns={[{key:'originalFilename',label:'Tên tài liệu',className:'min-w-56'},{key:'courseLabel',label:'Môn học'},{key:'extractionStatus',label:'Trạng thái',render:row=><StatusBadge status={labels[row.extractionStatus]||row.extractionStatus}/>},{key:'uploadedAt',label:'Ngày tải lên',render:row=>new Date(row.uploadedAt).toLocaleString('vi-VN')}]}
    extraRowActions={material=><>
      <Button variant="secondary" disabled={m.busy} onClick={()=>download(material)}>Tải xuống</Button>
      {material.extractionStatus!=='READY'&&<Button variant="secondary" disabled={m.busy||material.extractionStatus==='PROCESSING'} onClick={()=>index(material)}>{material.extractionStatus==='FAILED'?'Thử xử lý lại':'Xử lý văn bản'}</Button>}
      {material.extractionStatus==='READY'&&<Button variant="secondary" disabled={m.busy} onClick={()=>setPreviewId(material.id)}>Xem văn bản</Button>}
    </>}/>
    <State error={m.error}/>
    {!data.loading&&!data.error&&!scope.items.length&&<Notice>Chưa có môn học để quản lý. Giảng viên cần được quản trị viên phân công môn học.</Notice>}
    {previewId&&<Panel title="Văn bản đã trích xuất"><Button variant="secondary" onClick={()=>setPreviewId('')}>Đóng văn bản</Button><State error={preview.error}/>{preview.error&&<Button variant="secondary" onClick={preview.reload}>Thử lại</Button>}{preview.loading?<p>Đang tải văn bản...</p>:<div className="max-h-80 space-y-3 overflow-y-auto">{preview.items.map(chunk=><p key={chunk.id} className="whitespace-pre-wrap text-sm">{chunk.content}</p>)}</div>}</Panel>}
    {toast}
  </section>;
}

export default function Materials(){
  const courses=useRemote(()=>api.courses());
  const [courseId,setCourseId]=useState('');
  const toolbar=<CourseSelect courses={courses.items} value={courseId} onChange={setCourseId} placeholder="Tất cả môn học"/>;
  return <CourseMaterials courseId={courseId} courseState={courses} toolbar={toolbar}/>;
}
