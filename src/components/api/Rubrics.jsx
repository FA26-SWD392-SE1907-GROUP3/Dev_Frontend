import React, { useState } from 'react';
import { Crud, useData } from './ApiContent';
export default function Rubrics() {
  const data = useData('/questions'); const [id, setId] = useState('');
  return <div className="space-y-5"><div><h1 className="text-2xl font-bold">Rubric theo câu hỏi</h1><p className="text-sm text-mutedtext mt-1">Mỗi câu hỏi có tiêu chí và điểm tối đa riêng. Cần rubric trước khi duyệt câu hỏi.</p></div>{data.error && <p role="alert" className="api-error">{data.error}</p>}
    <label className="block text-sm">Câu hỏi<select className="api-input mt-2" value={id} onChange={e => setId(e.target.value)}><option value="">{data.loading ? 'Đang tải câu hỏi...' : 'Chọn câu hỏi để xem rubric'}</option>{data.items.map(q => <option key={q.questionId} value={q.questionId}>{q.questionContent}</option>)}</select></label>
    {id ? <Crud key={id} title="Tiêu chí chấm điểm" path={`/questions/${id}/rubrics`} idKey="rubricId" fields={[{ name:'criteriaName',label:'Tiêu chí',maxLength:255 },{ name:'maxScore',label:'Điểm tối đa',type:'number',min:.01,max:999.99,step:.01 },{ name:'guideline',label:'Hướng dẫn chấm',type:'textarea',optional:true }]} columns={[{ name:'criteriaName',label:'Tiêu chí' },{ name:'maxScore',label:'Điểm tối đa' },{ name:'guideline',label:'Hướng dẫn' }]} deletePath={r => `/rubrics/${r.rubricId}`}/> : <div className="bg-surface border border-appborder p-8 rounded-xl text-mutedtext text-sm">{!data.loading && !data.error && !data.items.length ? 'Chưa có câu hỏi. Tạo hoặc import câu hỏi trong Ngân hàng câu hỏi.' : 'Chọn câu hỏi phía trên để quản lý tiêu chí.'}</div>}
  </div>;
}
