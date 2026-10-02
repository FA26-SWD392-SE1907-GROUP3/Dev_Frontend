import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { ArrowRight } from 'lucide-react';

export default function AdminDashboard({ onNavigate, t }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-apptext tracking-tight">{t.adminOverviewTitle}</h1>
        <p className="text-sm text-mutedtext mt-1">{t.adminOverviewSub}</p>
      </div>

      {/* 4 Compact Summary Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-xl border border-appborder shadow-xs transition-colors">
          <div className="text-xs font-medium text-mutedtext">{t.totalUsers}</div>
          <div className="text-2xl font-bold text-apptext mt-1">428</div>
          <div className="text-xs text-mutedtext mt-1">{t.totalUsersSub}</div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-appborder shadow-xs transition-colors">
          <div className="text-xs font-medium text-mutedtext">{t.activeCourses}</div>
          <div className="text-2xl font-bold text-apptext mt-1">16</div>
          <div className="text-xs text-mutedtext mt-1">{t.activeCoursesSub}</div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-appborder shadow-xs transition-colors">
          <div className="text-xs font-medium text-mutedtext">{t.questionBankItems}</div>
          <div className="text-2xl font-bold text-apptext mt-1">1,240</div>
          <div className="text-xs text-mutedtext mt-1">{t.questionBankItemsSub}</div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-appborder shadow-xs transition-colors">
          <div className="text-xs font-medium text-mutedtext">{t.examSessionsCount}</div>
          <div className="text-2xl font-bold text-apptext mt-1">28</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">{t.examSessionsCountSub}</div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-surface rounded-xl border border-appborder shadow-xs overflow-hidden transition-colors">
        <div className="px-5 py-4 border-b border-appborder flex justify-between items-center">
          <div>
            <h3 className="text-base font-semibold text-apptext">{t.recentSessions}</h3>
            <p className="text-xs text-mutedtext">{t.recentSessionsSub}</p>
          </div>
          <button 
            onClick={() => onNavigate('admin-sessions')}
            className="text-xs font-semibold text-primary hover:underline flex items-center space-x-1"
          >
            <span>{t.viewAllSessions}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-appborder text-xs font-semibold uppercase">
              <tr>
                <th className="px-5 py-3">{t.colExamSession}</th>
                <th className="px-5 py-3">{t.colCourse}</th>
                <th className="px-5 py-3">{t.colAssignedLecturer}</th>
                <th className="px-5 py-3">{t.colSchedule}</th>
                <th className="px-5 py-3">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-appborder">
              <tr className="h-[52px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="px-5 py-2 font-medium text-apptext">SWD392 Oral Viva - Lớp SE1801</td>
                <td className="px-5 py-2 text-mutedtext">SWD392 - Kiến trúc phần mềm</td>
                <td className="px-5 py-2 text-mutedtext">TS. Hoàng Văn Thụ</td>
                <td className="px-5 py-2 text-mutedtext">Hôm nay, 08:30 AM</td>
                <td className="px-5 py-2"><StatusBadge status={t.statusInProgress} /></td>
              </tr>
              <tr className="h-[52px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="px-5 py-2 font-medium text-apptext">PRN231 Midterm Viva - Lớp SE1802</td>
                <td className="px-5 py-2 text-mutedtext">PRN231 - Ứng dụng phân tán .NET</td>
                <td className="px-5 py-2 text-mutedtext">ThS. Lê Thành Đạt</td>
                <td className="px-5 py-2 text-mutedtext">Ngày mai, 01:30 PM</td>
                <td className="px-5 py-2"><StatusBadge status={t.statusScheduled} /></td>
              </tr>
              <tr className="h-[52px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="px-5 py-2 font-medium text-apptext">CSD201 Final Viva Voce - Lớp CS1801</td>
                <td className="px-5 py-2 text-mutedtext">CSD201 - Cấu trúc dữ liệu & giải thuật</td>
                <td className="px-5 py-2 text-mutedtext">TS. Hoàng Văn Thụ</td>
                <td className="px-5 py-2 text-mutedtext">18/10/2026, 09:00 AM</td>
                <td className="px-5 py-2"><StatusBadge status={t.statusScheduled} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
