import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { Search, Filter, Calendar, Users, BookOpen } from 'lucide-react';

export default function AdminSessions({ examSessions, t }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredSessions = examSessions.filter((s) => {
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'In Progress' && s.status === 'In Progress') ||
      (statusFilter === 'Scheduled' && s.status === 'Scheduled');
    const q = searchQuery.toLowerCase();
    const matchText =
      s.name.toLowerCase().includes(q) ||
      s.course.toLowerCase().includes(q) ||
      s.lecturer.toLowerCase().includes(q);
    return matchStatus && matchText;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-apptext tracking-tight">{t.examSessionsCount}</h1>
        <p className="text-sm text-mutedtext mt-1">{t.recentSessionsSub}</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-xl border border-appborder p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mutedtext" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm ca thi theo tên ca, môn học hoặc giảng viên..."
            className="w-full h-10 pl-9 pr-4 bg-canvas border border-appborder rounded-lg text-sm text-apptext placeholder:text-mutedtext focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-mutedtext shrink-0 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="In Progress">{t.statusInProgress || 'Đang diễn ra'}</option>
            <option value="Scheduled">{t.statusScheduled || 'Đã lập lịch'}</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-surface rounded-xl border border-appborder shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-appborder text-xs font-semibold uppercase">
              <tr>
                <th className="px-5 py-3">{t.colExamSession}</th>
                <th className="px-5 py-3">{t.colCourse}</th>
                <th className="px-5 py-3">{t.colAssignedLecturer}</th>
                <th className="px-5 py-3">{t.colSchedule}</th>
                <th className="px-5 py-3">Số thí sinh</th>
                <th className="px-5 py-3">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-appborder">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-mutedtext">
                    Không tìm thấy ca thi nào.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="h-[52px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-2 font-semibold text-apptext">{session.name}</td>
                    <td className="px-5 py-2 text-mutedtext text-xs">{session.course}</td>
                    <td className="px-5 py-2 text-mutedtext text-xs">{session.lecturer}</td>
                    <td className="px-5 py-2 text-mutedtext text-xs font-medium">{session.dateTime}</td>
                    <td className="px-5 py-2 text-xs font-semibold text-apptext">
                      {session.studentsCount} thí sinh
                    </td>
                    <td className="px-5 py-2">
                      <StatusBadge status={session.status === 'In Progress' ? t.statusInProgress : t.statusScheduled} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
