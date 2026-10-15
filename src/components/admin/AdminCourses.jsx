import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { subjectsApi } from '../../services/api';

const emptyForm = { subjectCode: '', subjectName: '', description: '' };
export default function AdminCourses({ t }) {
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    subjectsApi.list(page, controller.signal).then(result => {
      if (!Array.isArray(result.content)) throw new Error('Dữ liệu danh sách không hợp lệ.');
      setCourses(result.content);
      setTotalPages(result.totalPages);
    }).catch(error => {
      if (error.name !== 'AbortError') { setError(error.message); setCourses([]); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, refresh]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const body = { ...form, subjectCode: form.subjectCode.trim(), subjectName: form.subjectName.trim() };
      if (!body.subjectCode || !body.subjectName) throw new Error('Mã môn và tên môn không được để trống.');
      if (editingId === null) await subjectsApi.create(body);
      else await subjectsApi.update(editingId, body);
      setModalOpen(false);
      setNotice('Đã lưu môn học.');
      setRefresh(value => value + 1);
    } catch (error) { setFormError(error.message); }
    finally { setSaving(false); }
  }

  async function remove(course) {
    if (!window.confirm(`Xóa môn học ${course.subjectCode}?`)) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await subjectsApi.delete(course.subjectId);
      setNotice('Đã xóa môn học.');
      if (courses.length === 1 && page > 0) setPage(page - 1);
      else setRefresh(value => value + 1);
    } catch (error) { setError(error.message); }
    finally { setSaving(false); }
  }

  const inputClass = 'w-full p-3 bg-canvas border border-appborder rounded-lg text-apptext';
  return <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">{t.coursesTitle}</h1>
      <button disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50" onClick={() => {
        setEditingId(null); setForm(emptyForm); setFormError(''); setModalOpen(true);
      }}>Thêm môn học</button>
    </div>
    {error && <p role="alert" className="text-red-600">{error} <button className="underline" onClick={() => setRefresh(value => value + 1)}>Thử lại</button></p>}
    {notice && <p role="status">{notice}</p>}
    <div className="bg-surface border border-appborder rounded-xl overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead><tr><th className="p-4">Mã môn</th><th className="p-4">Tên môn</th><th className="p-4">Mô tả</th><th className="p-4">Thao tác</th></tr></thead>
        <tbody>
          {loading ? <tr><td className="p-4" colSpan={4}>Đang tải...</td></tr> : courses.length === 0 ? <tr><td className="p-4" colSpan={4}>{error ? 'Chưa tải được dữ liệu.' : 'Chưa có môn học.'}</td></tr> : courses.map(course => <tr key={course.subjectId} className="border-t border-appborder">
            <td className="p-4">{course.subjectCode}</td><td className="p-4">{course.subjectName}</td><td className="p-4">{course.description || '—'}</td>
            <td className="p-4 space-x-3"><button disabled={saving} onClick={() => { setEditingId(course.subjectId); setForm({ subjectCode: course.subjectCode, subjectName: course.subjectName, description: course.description || '' }); setFormError(''); setModalOpen(true); }}>Sửa</button><button disabled={saving} className="text-red-600" onClick={() => remove(course)}>Xóa</button></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <div className="flex gap-4 items-center"><button disabled={loading || page === 0} onClick={() => setPage(page - 1)}>Trang trước</button><span>{totalPages ? `${page + 1} / ${totalPages}` : '0 / 0'}</span><button disabled={loading || page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Trang sau</button></div>
    <Modal isOpen={modalOpen} onClose={() => { if (!saving) setModalOpen(false); }} title={editingId === null ? 'Thêm môn học' : 'Sửa môn học'}>
      <form onSubmit={save} className="space-y-4">
        <label className="block">Mã môn<input className={inputClass} required maxLength={20} value={form.subjectCode} onChange={event => setForm({ ...form, subjectCode: event.target.value })} /></label>
        <label className="block">Tên môn<input className={inputClass} required maxLength={100} value={form.subjectName} onChange={event => setForm({ ...form, subjectName: event.target.value })} /></label>
        <label className="block">Mô tả<textarea className={inputClass} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
        {formError && <p role="alert" className="text-red-600">{formError}</p>}
        <button disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu'}</button>
      </form>
    </Modal>
  </div>;
}
