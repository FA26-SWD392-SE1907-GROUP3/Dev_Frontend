import React, { useState } from 'react';
import { Crud, useData } from './ApiContent';
import Interview from '../Interview';
export default function Monitor() {
  const exams = useData('/exams'); const [id,setId] = useState(''), [selected,setSelected] = useState(null);
  if(selected) return <Interview scheduleId={selected.scheduleId} readOnly onBack={() => setSelected(null)}/>;
  return <div className="space-y-5"><h1 className="text-2xl font-bold">Theo dõi lịch thi & transcript</h1><p className="text-sm text-mutedtext">Tải lại để xem tiến độ thực tế. Mở transcript để xem câu hỏi và câu trả lời đã lưu.</p>{exams.error && <p role="alert" className="api-error">{exams.error}</p>}
    <label className="block text-sm">Kỳ thi<select className="api-input mt-2" value={id} onChange={e => setId(e.target.value)}><option value="">Chọn kỳ thi</option>{exams.items.map(e => <option key={e.examId} value={e.examId}>{e.examName}</option>)}</select></label>
    {id && <Crud key={id} title="Danh sách thí sinh" path={`/exams/${id}/schedules`} idKey="scheduleId" fields={[]} allowCreate={false} allowEdit={false} allowDelete={false} columns={[{ name:'studentName',label:'Sinh viên' },{ name:'allocatedStartTime',label:'Bắt đầu' },{ name:'allocatedEndTime',label:'Kết thúc' },{ name:'status',label:'Trạng thái' }]} extra={s => <button className="api-button" onClick={() => setSelected(s)}>Xem transcript</button>}/>}
  </div>;
}
