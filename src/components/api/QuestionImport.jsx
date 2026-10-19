import React,{useState} from 'react';
import {api} from '../../services/api';
import {button,input,Panel,Field,State,Notice,Table} from './parts';
export const bloomLabels={REMEMBER:'Nhớ',UNDERSTAND:'Hiểu',APPLY:'Vận dụng',ANALYZE:'Phân tích'};
export default function QuestionImport({courseId,rubrics,onImported}){
  const [file,setFile]=useState(null),[rubricId,setRubricId]=useState(''),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  function template(format){
    const row={content:'Giải thích nguyên tắc phân chia trách nhiệm.',referenceAnswer:'Mỗi thành phần chịu một trách nhiệm rõ ràng.',bloomLevel:'UNDERSTAND',difficulty:'MEDIUM',rubricId:''};
    const text=format==='json'?JSON.stringify([row],null,2):'\uFEFF'+Object.keys(row).join(',')+'\r\n'+Object.values(row).map(v=>'"'+v.replaceAll('"','""')+'"').join(',')+'\r\n';
    const url=URL.createObjectURL(new Blob([text],{type:format==='json'?'application/json':'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`questions-template.${format}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function upload(commit=false){
    if(!file||file.size===0||file.size>2*1024*1024||!/\.(csv|json)$/i.test(file.name)){setError('Chọn CSV UTF-8 hoặc JSON không rỗng, tối đa 2 MB.');return;}
    setBusy(true);setError('');try{
      const response=await api.importQuestions(courseId,file,rubricId,!commit);setResult(response);
      if(commit&&response.status==='COMPLETED')onImported(response);
      else if(response.status==='FAILED'||response.status==='INVALID')setError('Chưa nhập câu hỏi nào. Sửa các lỗi từng dòng dưới đây rồi xem trước lại.');
    }catch(e){setError(e.message);setResult(null);}finally{setBusy(false);}
  }
  return <Panel title="Import câu hỏi từ tệp"><p className="text-sm">Tải mẫu CSV/JSON, điền nội dung, đáp án, Bloom và độ khó. Chọn rubric đã công bố bên dưới hoặc điền rubricId riêng cho mỗi dòng. Tối đa 200 câu/lần.</p>
    <div className="flex gap-2"><button type="button" className={button} disabled={busy} onClick={()=>template('csv')}>Tải mẫu CSV</button><button type="button" className={button} disabled={busy} onClick={()=>template('json')}>Tải mẫu JSON</button></div>
    <div className="grid md:grid-cols-2 gap-3"><Field label="Tệp câu hỏi CSV / JSON" required><input className={input} type="file" accept=".csv,.json" disabled={busy} onChange={e=>{setFile(e.target.files?.[0]||null);setResult(null);setError('');}}/></Field>
    <Field label="Rubric mặc định cho tệp"><select className={input} value={rubricId} disabled={busy} onChange={e=>{setRubricId(e.target.value);setResult(null);}}><option value="">— Dùng rubricId trong từng dòng —</option>{rubrics.filter(r=>r.status==='PUBLISHED').map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></Field></div>
    <State error={error}/><button type="button" className={button} disabled={busy||!file} onClick={()=>upload(false)}>{busy?'Đang kiểm tra...':'Xem trước và kiểm tra tệp'}</button>
    {result&&<><Notice>{result.totalRows} dòng · {result.rows.filter(r=>r.errors.length===0).length} dòng hợp lệ. Câu hỏi chỉ được đưa vào danh sách chờ duyệt; giáo viên quyết định có đưa vào ngân hàng chính thức.</Notice>
      <Table keyField="row" rows={result.rows} columns={[{key:'row',label:'Dòng'},{key:'content',label:'Câu hỏi'},{key:'bloomLevel',label:'Bloom',render:r=>bloomLabels[r.bloomLevel]||r.bloomLevel},{key:'rubricName',label:'Rubric'},{key:'errors',label:'Kiểm tra',render:r=>r.errors.length?r.errors.join(' '):'Hợp lệ'}]}/>
      <button type="button" className={button} disabled={busy||result.status!=='READY'} onClick={()=>upload(true)}>Nhập {result.totalRows} câu vào danh sách chờ duyệt</button></>}
  </Panel>;
}
