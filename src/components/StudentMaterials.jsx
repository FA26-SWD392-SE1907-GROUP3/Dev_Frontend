import React, { useState } from 'react';
import { api } from '../services/api';
import { button, CourseSelect, Notice, Panel, State, Table, useRemote } from './api/parts';
import MaterialViewer from './common/MaterialViewer';

export default function StudentMaterials({ user }) {
  const courses=useRemote(()=>api.courses(),[user.id]);
  const [courseId,setCourseId]=useState(''),[viewing,setViewing]=useState(null),[downloading,setDownloading]=useState(''),[error,setError]=useState('');
  const materials=useRemote(()=>courseId?api.materials(courseId):Promise.resolve([]),[courseId]);
  async function download(material){
    if(downloading)return;setDownloading(material.id);setError('');
    try{
      const blob=await api.downloadMaterial(material.id);const url=URL.createObjectURL(blob);
      const link=document.createElement('a');link.href=url;link.download=material.originalFilename;document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(failure){setError(failure.message);}finally{setDownloading('');}
  }
  return <div className="space-y-5">
    <State error={courses.error||materials.error||error}/>
    {courses.error&&<button className={button} onClick={courses.reload}>Thử tải lại môn học</button>}
    {courses.loading?<p role="status">Đang tải môn học...</p>:!courses.items.length?<Notice>Bạn chưa được ghi danh môn học. Nhờ Admin ghi danh để xem tài liệu.</Notice>:<>
      <CourseSelect courses={courses.items} value={courseId} onChange={value=>{setCourseId(value);setViewing(null);setError('');}}/>
      {courseId&&<Panel title="Tài liệu của môn học"><button className={button} onClick={materials.reload} disabled={materials.loading}>Làm mới tài liệu</button>
        {materials.loading?<p role="status">Đang tải tài liệu...</p>:<Table rows={materials.items} columns={[
          {key:'originalFilename',label:'Tên tài liệu'},
          {key:'mimeType',label:'Định dạng',render:item=>item.originalFilename.split('.').pop().toUpperCase()},
          {key:'uploadedAt',label:'Ngày tải lên',render:item=>new Date(item.uploadedAt).toLocaleString('vi-VN')},
        ]} actions={material=><div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={()=>setViewing(material)}>Xem tài liệu</button><button type="button" className={button} disabled={!!downloading} onClick={()=>download(material)}>{downloading===material.id?'Đang tải...':'Tải xuống'}</button></div>}/>}
      </Panel>}
      {viewing&&<MaterialViewer material={viewing} onClose={()=>setViewing(null)}/>}
    </>}
  </div>;
}
