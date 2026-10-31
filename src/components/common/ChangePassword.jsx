import React,{useState} from 'react';
import {api} from '../../services/api';
import {Panel,Field,input,button,Notice} from '../api/parts';
export default function ChangePassword({user}) {
  const [form,setForm]=useState({oldPassword:'',newPassword:'',confirmPassword:''});
  const [pending,setPending]=useState(false),[error,setError]=useState(''),[ok,setOk]=useState('');
  async function submit(event){
    event.preventDefault();setError('');setOk('');
    if(form.newPassword!==form.confirmPassword){setError('Mật khẩu xác nhận không trùng khớp.');return;}
    setPending(true);
    try {await api.changePassword(user.id,form);setForm({oldPassword:'',newPassword:'',confirmPassword:''});setOk('Đổi mật khẩu thành công.');}
    catch(e){setError(e.message||'Không đổi được mật khẩu.');} finally{setPending(false);}
  }
  return <Panel title="Đổi mật khẩu"><form onSubmit={submit} className="space-y-3 max-w-lg">
    <Field label="Mật khẩu hiện tại" required><input className={input} type="password" required autoComplete="current-password" value={form.oldPassword} onChange={e=>setForm({...form,oldPassword:e.target.value})}/></Field>
    <Field label="Mật khẩu mới (tối thiểu 8 ký tự)" required><input className={input} type="password" required minLength={8} autoComplete="new-password" value={form.newPassword} onChange={e=>setForm({...form,newPassword:e.target.value})}/></Field>
    <Field label="Xác nhận mật khẩu mới" required><input className={input} type="password" required minLength={8} autoComplete="new-password" value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})}/></Field>
    <button className={button} disabled={pending}>{pending?'Đang đổi...':'Đổi mật khẩu'}</button>
    {error&&<Notice type="error">{error}</Notice>}{ok&&<Notice>{ok}</Notice>}
  </form></Panel>;
}
