import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { Plus, MoreVertical, Tv } from 'lucide-react';

export default function LecturerSessions({ examSessions, onOpenWizard, onOpenMonitor, t }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-apptext tracking-tight">{t.navSessions}</h1>
          <p className="text-sm text-mutedtext mt-1">{t.recentSessionsSub}</p>
        </div>
        <button
          onClick={onOpenWizard}
          className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium flex items-center space-x-2 transition-colors self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{t.createExamSession}</span>
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-appborder shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-appborder text-xs font-semibold uppercase">
              <tr>
                <th className="px-5 py-3">{t.colExamSession}</th>
                <th className="px-5 py-3">{t.colCourse}</th>
                <th className="px-5 py-3">{t.colSchedule}</th>
                <th className="px-5 py-3">{t.colCandidates}</th>
                <th className="px-5 py-3">{t.colStatus}</th>
                <th className="px-5 py-3 text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-appborder">
              {examSessions.map((session) => (
                <tr key={session.id} className="h-[52px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-2 font-medium text-apptext">{session.name}</td>
                  <td className="px-5 py-2 text-mutedtext">{session.course}</td>
                  <td className="px-5 py-2 text-mutedtext">{session.dateTime}</td>
                  <td className="px-5 py-2 text-mutedtext">{session.studentsCount} {t.colCandidates || 'Candidates'}</td>
                  <td className="px-5 py-2">
                    <StatusBadge status={session.status === 'In Progress' ? t.statusInProgress : t.statusScheduled} />
                  </td>
                  <td className="px-5 py-2 text-right">
                    {session.status === 'In Progress' ? (
                      <button
                        onClick={onOpenMonitor}
                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center space-x-1"
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span>{t.navMonitor}</span>
                      </button>
                    ) : (
                      <button className="p-1 rounded text-mutedtext hover:text-apptext">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
