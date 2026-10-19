import React, { useCallback, useEffect, useRef, useState } from 'react';
export const button='api-button';
export const input='api-input';
export function Heading({title,subtitle,action}){return <div className="flex flex-wrap gap-3 items-start justify-between"><div><h1 className="text-2xl font-bold">{title}</h1>{subtitle&&<p className="text-sm text-mutedtext mt-1">{subtitle}</p>}</div>{action}</div>;}
export function Notice({children,type='info'}){return <div role={type==='error'?'alert':'status'} className={`rounded-lg p-3 text-sm border ${type==='error'?'bg-red-50 text-red-700 border-red-200':'bg-primary-light border-appborder text-apptext'}`}>{children}</div>;}
export function Panel({children,title}){return <section className="bg-surface p-5 border border-appborder rounded-xl space-y-4">{title&&<h2 className="font-semibold text-lg">{title}</h2>}{children}</section>;}
export function Field({label,required,children}){return <label className="block text-sm font-medium space-y-1"><span>{label}{required?' *':''}</span>{children}</label>;}
export function CourseSelect({courses,value,onChange,disabled=false}){return <Field label="Môn học"><select className={input} disabled={disabled} value={value} onChange={e=>onChange(e.target.value)}><option value="">— Chọn môn học —</option>{courses.map(c=><option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}</select></Field>;}
export function useRemote(fetcher,deps=[]){const [items,setItems]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[tick,setTick]=useState(0);
  const reload=useCallback(()=>setTick(v=>v+1),[]);
  useEffect(()=>{let live=true;setItems([]);setLoading(true);setError('');Promise.resolve().then(fetcher).then(r=>{if(live)setItems(Array.isArray(r)?r:r?[r]:[]);}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[tick,...deps]);
  return {items,error,loading,reload,setItems};
}
export function State({error,success}){return <>{error&&<Notice type="error">{error}</Notice>}{success&&<Notice>{success}</Notice>}</>}
export function Empty({children}){return <p className="text-sm text-mutedtext p-4 bg-surface border border-appborder rounded-lg">{children}</p>}
export function Table({columns,rows,keyField='id',actions}){return <div className="overflow-x-auto bg-surface border border-appborder rounded-xl"><table className="w-full text-left text-sm"><thead><tr>{columns.map(c=><th key={c.key} className="p-3 bg-canvas">{c.label}</th>)}{actions&&<th className="p-3 bg-canvas">Thao tác</th>}</tr></thead><tbody>{rows.length?rows.map((row,i)=><tr key={row[keyField]||i} className="border-t border-appborder">{columns.map(c=><td key={c.key} className="p-3 align-top max-w-xs break-words">{c.render?c.render(row):String(row[c.key]??'—')}</td>)}{actions&&<td className="p-3">{actions(row)}</td>}</tr>):<tr><td colSpan={columns.length+(actions?1:0)} className="p-4 text-mutedtext">Chưa có dữ liệu.</td></tr>}</tbody></table></div>}
export function useMutation(reload) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function run(fn, message = 'Đã lưu thành công.') {
    if (inFlight.current || !mounted.current) return null;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await fn();
      if (!mounted.current) return null;
      setSuccess(message);
      reload?.();
      return result ?? { ok: true };
    } catch (error) {
      if (mounted.current) setError(error.message);
      return null;
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return { busy, error, success, run, setError, setSuccess };
}
