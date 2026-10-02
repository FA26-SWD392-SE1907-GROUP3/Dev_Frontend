import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { Plus, MoreVertical, Search, Filter, BookOpen, GraduationCap } from 'lucide-react';

export default function AdminCourses({ courses, setCourses, onShowToast, t }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [termFilter, setTermFilter] = useState('all');

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState(3);
  const [lecturer, setLecturer] = useState('TS. Hoàng Văn Thụ');
  const [term, setTerm] = useState('Fall 2026');

  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    const newCourse = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      term,
      credits: Number(credits) || 3,
      lecturer,
      status: 'Active',
      enrolledStudents: 0,
    };

    setCourses([newCourse, ...courses]);
    setIsModalOpen(false);
    setCode('');
    setName('');
    onShowToast(`Đã thêm môn học ${newCourse.code} thành công vào hệ thống thi.`);
  };

  const handleToggleCourseStatus = (courseCode) => {
    setCourses(
      courses.map((c) =>
        c.code === courseCode ? { ...c, status: c.status === 'Active' ? 'Inactive' : 'Active' } : c
      )
    );
    onShowToast(`Đã cập nhật trạng thái môn học ${courseCode}.`);
  };

  const filteredCourses = courses.filter((c) => {
    const matchTerm = termFilter === 'all' || c.term === termFilter;
    const q = searchQuery.toLowerCase();
    const matchQuery =
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.lecturer.toLowerCase().includes(q);
    return matchTerm && matchQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-apptext tracking-tight">{t.coursesTitle}</h1>
          <p className="text-sm text-mutedtext mt-1">{t.coursesSub}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium flex items-center space-x-2 transition-colors self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addCourse}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-xl border border-appborder p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mutedtext" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm môn học theo mã môn (SWD392, PRN231...), tên môn hoặc giảng viên..."
            className="w-full h-10 pl-9 pr-4 bg-canvas border border-appborder rounded-lg text-sm text-apptext placeholder:text-mutedtext focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-mutedtext shrink-0 hidden sm:block" />
          <select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            className="h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="all">{t.filterAllTerms || 'Tất cả học kỳ'}</option>
            <option value="Fall 2026">Học kỳ Fall 2026</option>
            <option value="Summer 2026">Học kỳ Summer 2026</option>
            <option value="Spring 2026">Học kỳ Spring 2026</option>
          </select>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-surface rounded-xl border border-appborder shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-appborder text-xs font-semibold uppercase">
              <tr>
                <th className="px-5 py-3">{t.colCourseCode}</th>
                <th className="px-5 py-3">{t.colCourseName}</th>
                <th className="px-5 py-3">{t.colAssignedLecturer}</th>
                <th className="px-5 py-3">Học kỳ / Tín chỉ</th>
                <th className="px-5 py-3">SV dự thi</th>
                <th className="px-5 py-3">{t.colStatus}</th>
                <th className="px-5 py-3 text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-appborder">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-mutedtext">
                    Không tìm thấy môn học nào.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.code} className="h-[52px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-2">
                      <span className="font-mono font-bold text-primary px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                        {course.code}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-apptext font-medium">{course.name}</td>
                    <td className="px-5 py-2 text-mutedtext text-xs">{course.lecturer}</td>
                    <td className="px-5 py-2 text-xs text-mutedtext">
                      <span className="font-medium text-apptext">{course.term}</span> &bull; {course.credits || 3} tín chỉ
                    </td>
                    <td className="px-5 py-2 text-xs font-medium text-apptext">
                      {course.enrolledStudents} sinh viên
                    </td>
                    <td className="px-5 py-2">
                      <StatusBadge status={course.status === 'Active' ? t.statusActive : t.statusInactive} />
                    </td>
                    <td className="px-5 py-2 text-right">
                      <button
                        onClick={() => handleToggleCourseStatus(course.code)}
                        className="text-xs px-2.5 py-1 rounded border border-appborder text-mutedtext hover:text-apptext hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Bật/Tắt trạng thái hoạt động"
                      >
                        {course.status === 'Active' ? 'Khóa môn' : 'Kích hoạt'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Course Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t.addCourse}>
        <form onSubmit={handleAddCourse} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">{t.colCourseCode} (Mã FPT) *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: SWD392 hoặc PRN231"
                className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">Số tín chỉ</label>
              <select
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value={3}>3 tín chỉ</option>
                <option value={4}>4 tín chỉ</option>
                <option value={2}>2 tín chỉ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-apptext mb-1">{t.colCourseName} *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Kiến trúc và Thiết kế Phần mềm"
              className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">{t.colAssignedLecturer} *</label>
              <select
                value={lecturer}
                onChange={(e) => setLecturer(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="TS. Hoàng Văn Thụ">TS. Hoàng Văn Thụ (SE Department)</option>
                <option value="ThS. Lê Thành Đạt">ThS. Lê Thành Đạt (SE Department)</option>
                <option value="ThS. Nguyễn Thị Mai">ThS. Nguyễn Thị Mai (IA Department)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">Học kỳ áp dụng</label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="Fall 2026">Fall 2026</option>
                <option value="Summer 2026">Summer 2026</option>
                <option value="Spring 2026">Spring 2026</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="h-10 px-4 rounded-lg border border-appborder text-xs font-medium text-mutedtext hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs"
            >
              {t.addCourse}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
