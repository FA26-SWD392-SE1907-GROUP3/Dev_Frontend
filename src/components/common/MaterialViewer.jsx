import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { button, Panel, State } from '../api/parts';

export default function MaterialViewer({ material, onClose }) {
  const [url,setUrl]=useState(''),[text,setText]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    let active=true,objectUrl='';const controller=new AbortController();
    setUrl('');setText('');setError('');setLoading(true);
    const word=material.mimeType==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'||/\.docx$/i.test(material.originalFilename);
    (async()=>{
      try {
        if(word){const result=await api.materialText(material.id,{signal:controller.signal});if(active)setText(result.content);}
        else {
          const blob=await api.previewMaterial(material.id,{signal:controller.signal});
          if(!blob.type.toLowerCase().startsWith('application/pdf'))throw new Error('Không nhận được bản xem trước PDF hợp lệ.');
          if(active){objectUrl=URL.createObjectURL(blob);setUrl(objectUrl);}
        }
      } catch(failure){if(active&&!controller.signal.aborted)setError(failure.message);}
      finally{if(active)setLoading(false);}
    })();
    return()=>{active=false;controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[material.id,retry]);
  return <Panel title={`Xem tài liệu: ${material.originalFilename}`}>
    <button type="button" className={button} onClick={onClose}>Đóng tài liệu</button>
    {loading&&<p role="status">Đang chuẩn bị bản xem trước...</p>}
    <State error={error}/>{error&&<><p className="text-sm">Bạn vẫn có thể dùng nút Tải xuống để mở tệp gốc.</p><button type="button" className={button} onClick={()=>setRetry(value=>value+1)}>Thử xem lại</button></>}
    {url&&<iframe title={`Xem ${material.originalFilename}`} src={url} className="w-full h-[65vh] min-h-96 rounded-lg border border-appborder" referrerPolicy="no-referrer"/>}
    {text&&<div className="max-h-[65vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">{text}</div>}
  </Panel>;
}
