import React, { useRef, useState } from 'react';
import { api } from '../../services/api';
import { button, input, Heading, Panel, Field, CourseSelect, useRemote, useMutation, State, Notice, Table } from './parts';

const labels = { UPLOADED: 'Đã tải lên', PROCESSING: 'Đang xử lý', READY: 'Sẵn sàng', FAILED: 'Xử lý thất bại' };
export function CourseMaterials({ courseId, onQuestionsGenerated }) {
  const data = useRemote(() => api.materials(courseId), [courseId]);
  const rubrics = useRemote(() => api.rubrics(courseId), [courseId]);
  const jobs = useRemote(() => api.generationJobs(courseId), [courseId]);
  const ai = useRemote(() => api.aiStatus());
  const [previewId, setPreviewId] = useState('');
  const preview = useRemote(() => previewId ? api.materialChunks(previewId) : Promise.resolve([]), [previewId]);
  const m = useMutation(() => { data.reload(); jobs.reload(); });
  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [editingMaterial,setEditingMaterial]=useState(null),[materialName,setMaterialName]=useState('');
  const [selected, setSelected] = useState([]);
  const [generation, setGeneration] = useState({ rubricId: '', desiredCount: 5, bloomLevel: 'UNDERSTAND', difficulty: 'MEDIUM', instruction: '' });
  const [generating,setGenerating]=useState(false),[generationError,setGenerationError]=useState(''),[generationSuccess,setGenerationSuccess]=useState(''),[generatedJobId,setGeneratedJobId]=useState('');
  const generated=useRemote(()=>generatedJobId?api.generationQuestions(generatedJobId):Promise.resolve([]),[generatedJobId]);
  const rubricSelect=useRef(null);
  const publishedRubrics=rubrics.items.filter(r=>r.status==='PUBLISHED');
  const configured = ai.items[0]?.configured;
  async function upload(e) {
    e.preventDefault();
    if (!file || !/\.(pdf|docx)$/i.test(file.name) || file.size === 0 || file.size > 20 * 1024 * 1024) { m.setError('Chọn một tệp PDF/DOCX không rỗng, tối đa 20 MB.'); return; }
    const result = await m.run(() => api.uploadMaterial(courseId, file), 'Đã tải tài liệu lên. Chọn Xử lý văn bản để dùng cho AI.');
    if (result) { setFile(null); fileInput.current.value = ''; }
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
    if(!selected.length){setGenerationError('Bạn cần chọn ít nhất một tài liệu đã xử lý ở phần Tài liệu nguồn.');return;}
    if(!publishedRubrics.some(r=>r.id===generation.rubricId)){
      setGenerationError(publishedRubrics.length?'Bạn chưa chọn rubric đã công bố. Hãy chọn rubric để gắn tiêu chí và thang điểm cho câu hỏi.':'Môn học chưa có rubric đã công bố. Vào Tiêu chí Rubric, thêm các tiêu chí đủ tổng điểm và bấm Công bố rubric trước khi sinh câu hỏi.');
      rubricSelect.current?.focus();return;
    }
    const count=Number(generation.desiredCount);
    if(!Number.isInteger(count)||count<1||count>20){setGenerationError('Số câu hỏi phải là số nguyên từ 1 đến 20.');return;}
    setGenerating(true);
    try{
      const job = await api.generateQuestions(courseId, { ...generation, desiredCount: count, materialIds: selected });
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
  return <>
    <Panel title="Tải tài liệu lên"><form onSubmit={upload} className="space-y-3">
      <Field label="Tệp PDF hoặc DOCX (tối đa 20 MB)" required><input ref={fileInput} type="file" accept=".pdf,.docx" className={input} required onChange={e => setFile(e.target.files?.[0] || null)} /></Field>
      <p className="text-sm text-mutedtext">PDF cần có văn bản có thể chọn và sao chép. Tệp PDF ảnh cần được OCR trước.</p>
      <button className={button} disabled={m.busy || !file || !!data.error}>Tải tài liệu lên</button>
    </form></Panel>
    <State error={m.error} success={m.success} />
    <Panel title="Tài liệu của môn học">
      <State error={data.error} />
      {data.loading ? <p>Đang tải tài liệu...</p> : <Table rows={data.items} columns={[{ key: 'originalFilename', label: 'Tên tài liệu' }, { key: 'extractionStatus', label: 'Trạng thái', render: row => labels[row.extractionStatus] || row.extractionStatus }, { key: 'uploadedAt', label: 'Ngày tải lên', render: row => new Date(row.uploadedAt).toLocaleString('vi-VN') }]} actions={material => <div className="flex flex-wrap gap-2">
        <button className={button} disabled={m.busy} onClick={() => download(material)}>Tải xuống</button>
        <button className={button} disabled={m.busy} onClick={()=>{setEditingMaterial(material);setMaterialName(material.originalFilename);}}>Đổi tên</button>
        <button className={button} disabled={m.busy||generating} onClick={async()=>{if(window.confirm(`Xóa tài liệu ${material.originalFilename}? Tài liệu đã dùng sinh câu hỏi sẽ không được xóa.`)){const result=await m.run(()=>api.deleteMaterial(material.id),'Đã xóa tài liệu chưa sử dụng.');if(result){setSelected(ids=>ids.filter(id=>id!==material.id));if(previewId===material.id)setPreviewId('');if(editingMaterial?.id===material.id)setEditingMaterial(null);}}}}>Xóa tài liệu</button>
        {material.extractionStatus !== 'READY' && <button className={button} disabled={m.busy || material.extractionStatus === 'PROCESSING'} onClick={() => index(material)}>{material.extractionStatus === 'FAILED' ? 'Thử xử lý lại' : 'Xử lý văn bản'}</button>}
        {material.extractionStatus === 'READY' && <button className={button} disabled={m.busy} onClick={() => setPreviewId(material.id)}>Xem văn bản</button>}
      </div>} />}
    </Panel>
    {editingMaterial&&<Panel title="Đổi tên tài liệu"><form className="flex flex-wrap gap-2" onSubmit={async e=>{e.preventDefault();const result=await m.run(()=>api.renameMaterial(editingMaterial.id,materialName),'Đã đổi tên tài liệu.');if(result)setEditingMaterial(null);}}><Field label="Tên tài liệu"><input className={input} required maxLength={255} value={materialName} onChange={e=>setMaterialName(e.target.value)}/></Field><button className={button} disabled={m.busy}>Lưu tên tài liệu</button><button type="button" className={button} onClick={()=>setEditingMaterial(null)}>Hủy đổi tên</button></form></Panel>}
    {previewId && <Panel title="Văn bản đã trích xuất"><button className={button} onClick={() => setPreviewId('')}>Đóng văn bản</button><State error={preview.error} />{preview.loading ? <p>Đang tải văn bản...</p> : <div className="max-h-80 overflow-y-auto space-y-3">{preview.items.map(chunk => <p key={chunk.id} className="whitespace-pre-wrap text-sm">{chunk.content}</p>)}</div>}</Panel>}
    <Panel title="Sinh câu hỏi bằng AI">
      <State error={ai.error || rubrics.error || data.error} />
      {(ai.loading||rubrics.loading||data.loading)&&<p role="status">Đang kiểm tra tài liệu, rubric và cấu hình AI...</p>}
      {!ai.loading && !configured && !ai.error && <Notice>Quản trị viên cần cấu hình OpenAI API key trên máy chủ để bật chức năng sinh câu hỏi.</Notice>}
      <p className="text-sm text-mutedtext">Chọn tối đa 5 tài liệu đã xử lý và rubric đã công bố. Câu hỏi AI luôn cần giảng viên duyệt.</p>
      {!rubrics.loading&&!rubrics.error&&publishedRubrics.length===0&&<Notice>Chưa có rubric đã công bố cho môn này. Vào <strong>Tiêu chí Rubric</strong> → chọn môn → tạo/chọn rubric → thêm tiêu chí đủ tổng điểm → <strong>Công bố rubric</strong>, sau đó quay lại chọn rubric để sinh câu hỏi.</Notice>}
      <button type="button" className={button} disabled={rubrics.loading||generating} onClick={rubrics.reload}>Tải lại danh sách rubric</button>
      <form onSubmit={generate} noValidate className="space-y-3">
        <fieldset disabled={m.busy || generating || !configured || data.loading || !!data.error || rubrics.loading || !!rubrics.error} className="space-y-3">
          <legend className="text-sm font-medium mb-2">Tài liệu nguồn</legend>
          {data.items.filter(item => item.extractionStatus === 'READY').map(material => <label className="flex gap-2 items-center text-sm" key={material.id}><input type="checkbox" checked={selected.includes(material.id)} disabled={!selected.includes(material.id) && selected.length >= 5} onChange={e => setSelected(e.target.checked ? [...selected, material.id] : selected.filter(id => id !== material.id))} />{material.originalFilename}</label>)}
          {!data.items.some(item => item.extractionStatus === 'READY') && <p className="text-sm text-mutedtext">Tải lên và xử lý tài liệu trước khi sinh câu hỏi.</p>}
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Rubric đã công bố" required><select ref={rubricSelect} className={input} required value={generation.rubricId} onChange={e => {setGeneration({ ...generation, rubricId: e.target.value });setGenerationError('');}}><option value="">{publishedRubrics.length?'— Chọn rubric —':'— Chưa có rubric đã công bố —'}</option>{publishedRubrics.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
            <Field label="Số câu hỏi (1–20)" required><input className={input} type="number" required min="1" max="20" step="1" value={generation.desiredCount} onChange={e => setGeneration({ ...generation, desiredCount: e.target.value })} /></Field>
            <Field label="Mức Bloom"><select className={input} value={generation.bloomLevel} onChange={e => setGeneration({ ...generation, bloomLevel: e.target.value })}>{Object.entries({REMEMBER:'Nhớ',UNDERSTAND:'Hiểu',APPLY:'Vận dụng',ANALYZE:'Phân tích'}).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="Độ khó"><select className={input} value={generation.difficulty} onChange={e => setGeneration({ ...generation, difficulty: e.target.value })}>{['EASY', 'MEDIUM', 'HARD'].map(value => <option key={value}>{value}</option>)}</select></Field>
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
      {generated.items.map((q,index)=><article key={q.id} className="border border-appborder rounded-lg p-3 space-y-2"><h3 className="font-medium">{index+1}. {q.content}</h3><p className="text-sm">Bloom: {({REMEMBER:'Nhớ',UNDERSTAND:'Hiểu',APPLY:'Vận dụng',ANALYZE:'Phân tích'})[q.bloomLevel]||q.bloomLevel} · {q.difficulty} · {({PENDING_REVIEW:'Chờ giáo viên duyệt',APPROVED:'Đã duyệt',REJECTED:'Đã từ chối',ARCHIVED:'Đã loại bỏ'})[q.status]||q.status}</p><p className="text-sm whitespace-pre-wrap"><strong>Đáp án tham khảo:</strong> {q.referenceAnswer}</p></article>)}
    </>}<button type="button" className={button} disabled={generated.loading} onClick={generated.reload}>Tải lại câu hỏi của lần sinh này</button></Panel>}
    <Panel title="Lịch sử sinh câu hỏi"><button type="button" className={button} disabled={jobs.loading} onClick={jobs.reload}>Tải lại lịch sử sinh câu hỏi</button><State error={jobs.error} />{jobs.loading ? <p>Đang tải lịch sử...</p> : <Table rows={jobs.items} columns={[{ key: 'createdAt', label: 'Thời gian', render: row => new Date(row.createdAt).toLocaleString('vi-VN') }, { key: 'status', label: 'Trạng thái' }, { key: 'generatedCount', label: 'Số câu đã sinh' }, { key: 'errorMessage', label: 'Thông báo' }]} actions={job=>job.status==='COMPLETED'&&job.generatedCount>0?<button type="button" className={button} onClick={()=>{setGeneratedJobId(job.id);if(job.id===generatedJobId)generated.reload();}}>Xem câu hỏi</button>:null}/>}</Panel>
  </>;
}

export default function Materials() {
  const courses = useRemote(() => api.courses());
  const [courseId, setCourseId] = useState('');
  return <section className="space-y-5"><Heading title="Tài liệu môn học" subtitle="Tải PDF/DOCX, xử lý văn bản và tạo câu hỏi chờ duyệt từ tài liệu." />
    <CourseSelect courses={courses.items} value={courseId} onChange={setCourseId} /><State error={courses.error} />
    {!courses.loading && !courses.error && !courses.items.length && <Notice>Chưa có môn học để quản lý. Giảng viên cần được quản trị viên phân công môn học.</Notice>}
    {courseId && <CourseMaterials key={courseId} courseId={courseId} />}
  </section>;
}
