import React, { useState } from 'react';
import { api } from '../../services/api';
import { button, input, Heading, Panel, Field, useRemote, useMutation, State, Table, Notice } from './parts';

const roles = ['ADMIN', 'LECTURER', 'STUDENT'];
const emptyForm = { fullName: '', email: '', password: '', role: 'STUDENT' };
const columns = [
  { key: 'fullName', label: 'Họ tên' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Vai trò', render: user => user.registrationStatus==='PENDING'?'Chưa phân quyền':user.role },
  { key: 'active', label: 'Trạng thái', render: user => user.registrationStatus==='PENDING'?'Chờ phân quyền':user.active ? 'Hoạt động' : 'Đã khóa' },
  { key: 'id', label: 'User ID' },
];

export default function Users({ user }) {
  const data = useRemote(() => api.users());
  const mutation = useMutation(data.reload);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [approving,setApproving]=useState(null),[approvedRole,setApprovedRole]=useState('');

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
  }

  function editUser(account) {
    setEditing(account);
    setForm({ fullName: account.fullName, email: account.email, password: '', role: account.role });
  }

  function removeUser(account) {
    if (window.confirm(`Ngừng sử dụng tài khoản ${account.email}? Lịch sử được giữ lại.`)) {
      mutation.run(() => api.deleteUser(account.id), 'Đã ngừng sử dụng tài khoản; lịch sử được giữ lại.');
    }
  }

  async function submit(event) {
    event.preventDefault();
    const result = await mutation.run(() => editing
      ? api.updateUser(editing.id, { fullName: form.fullName, email: form.email, role: form.role })
      : api.createUser(form), editing ? 'Đã cập nhật người dùng.' : 'Đã tạo tài khoản.');
    if (result) resetForm();
  }

  return <section className="space-y-5">
    <Heading title="Quản lý người dùng" subtitle="Tạo, phân quyền và quản lý tài khoản. Người đăng ký mới cần Admin duyệt."
      action={<button className={button} onClick={data.reload}>Tải lại</button>} />
    {approving&&<Panel title="Phân quyền tài khoản mới"><p>{approving.fullName} · {approving.email}</p>
      <form onSubmit={async event=>{event.preventDefault();if(!approvedRole)return;const result=await mutation.run(()=>api.approveRegistration(approving.id,approvedRole),'Đã phân quyền và kích hoạt tài khoản.');if(result){setApproving(null);setApprovedRole('');}}} className="space-y-3">
        <Field label="Vai trò được cấp" required><select className={input} required disabled={mutation.busy} value={approvedRole} onChange={event=>setApprovedRole(event.target.value)}><option value="">— Chọn vai trò —</option><option value="STUDENT">Sinh viên</option><option value="LECTURER">Giảng viên</option><option value="ADMIN">Quản trị viên</option></select></Field>
        <div className="flex gap-2"><button className={button} disabled={mutation.busy||!approvedRole}>Xác nhận phân quyền</button><button type="button" className={button} disabled={mutation.busy} onClick={()=>setApproving(null)}>Hủy phân quyền</button></div>
      </form><State error={mutation.error}/></Panel>}
    <Panel title={editing ? 'Sửa tài khoản' : 'Thêm tài khoản'}>
      <form onSubmit={submit} className="grid md:grid-cols-2 gap-3">
        <fieldset disabled={mutation.busy} className="contents">
          <Field label="Họ tên" required>
            <input className={input} required maxLength={150} value={form.fullName}
              onChange={event => setForm({ ...form, fullName: event.target.value })} />
          </Field>
          <Field label="Email" required>
            <input className={input} type="email" required maxLength={255} value={form.email}
              onChange={event => setForm({ ...form, email: event.target.value })} />
          </Field>
          {!editing && <Field label="Mật khẩu (≥ 8 ký tự)" required>
            <input className={input} type="password" required minLength={8} maxLength={100} value={form.password}
              onChange={event => setForm({ ...form, password: event.target.value })} />
          </Field>}
          <Field label="Vai trò (chỉ Admin được sửa)">
            <select className={input} value={form.role} onChange={event => setForm({ ...form, role: event.target.value })}>
              {roles.map(role => <option key={role}>{role}</option>)}
            </select>
          </Field>
          <div className="md:col-span-2 flex gap-2">
            <button className={button}>{editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}</button>
            {editing && <button type="button" className={button} onClick={resetForm}>Hủy</button>}
          </div>
        </fieldset>
      </form>
      <State error={mutation.error} success={mutation.success} />
    </Panel>
    {data.error && <Notice type="error">{data.error}</Notice>}
    {data.loading ? <p>Đang tải tài khoản...</p> : <Table rows={[...data.items].sort((a,b)=>Number(b.registrationStatus==='PENDING')-Number(a.registrationStatus==='PENDING'))} columns={columns} actions={account =>
      <div className="flex flex-wrap gap-2">
        {account.registrationStatus==='PENDING'?<button className={button} disabled={mutation.busy} onClick={()=>{setApproving(account);setApprovedRole('');mutation.setError('');}}>Phân quyền</button>:<>
        <button className={button} disabled={mutation.busy} onClick={() => editUser(account)}>Sửa</button>
        <button className={button} disabled={mutation.busy || account.id === user.id}
          onClick={() => mutation.run(() => api.setUserActive(account.id, !account.active), account.active ? 'Đã khóa tài khoản.' : 'Đã mở tài khoản.')}>
          {account.active ? 'Khóa' : 'Mở'}
        </button>
        {account.active && account.id !== user.id &&
          <button className={button} disabled={mutation.busy} onClick={() => removeUser(account)}>Xóa</button>}
        </>}
      </div>}
    />}
  </section>;
}
