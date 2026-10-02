import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { ArrowRight, Plus } from 'lucide-react';

export default function LecturerDashboard({ onNavigate, onOpenWizard, t }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-apptext tracking-tight">{t.lecturerDashTitle}</h1>
          <p className="text-sm text-mutedtext mt-1">{t.lecturerDashSub}</p>
        </div>
        <button
          onClick={onOpenWizard}
          className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium flex items-center space-x-2 transition-colors self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{t.createExamSession}</span>
        </button>
      </div>

      {/* Attention Work Queue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Queue Item 1 */}
        <div className="bg-surface p-5 rounded-xl border border-appborder shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <StatusBadge status={t.actionRequired} />
              <span className="text-xs text-mutedtext font-medium">CS301</span>
            </div>
            <h3 className="text-base font-semibold text-apptext mt-3">{t.pendingReviewsTitle}</h3>
            <p className="text-xs text-mutedtext mt-1 leading-relaxed">
              {t.pendingReviewsDesc}
            </p>
          </div>
          <button
            onClick={() => onNavigate('lecturer-materials')}
            className="mt-4 text-xs font-semibold text-primary hover:underline text-left flex items-center space-x-1"
          >
            <span>{t.reviewQuestionsBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Queue Item 2 */}
        <div className="bg-surface p-5 rounded-xl border border-appborder shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <StatusBadge status={t.statusInProgress} />
              <span className="text-xs text-mutedtext font-medium">Active Now</span>
            </div>
            <h3 className="text-base font-semibold text-apptext mt-3">SWD392 Oral Viva - Lớp SE1801</h3>
            <p className="text-xs text-mutedtext mt-1 leading-relaxed">
              {t.liveSessionDesc}
            </p>
          </div>
          <button
            onClick={() => onNavigate('lecturer-monitor')}
            className="mt-4 text-xs font-semibold text-primary hover:underline text-left flex items-center space-x-1"
          >
            <span>{t.openMonitorBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Queue Item 3 */}
        <div className="bg-surface p-5 rounded-xl border border-appborder shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <StatusBadge status={t.statusPending} />
              <span className="text-xs text-mutedtext font-medium">8 Transcripts</span>
            </div>
            <h3 className="text-base font-semibold text-apptext mt-3">{t.pendingScoresTitle}</h3>
            <p className="text-xs text-mutedtext mt-1 leading-relaxed">
              {t.pendingScoresDesc}
            </p>
          </div>
          <button
            onClick={() => onNavigate('lecturer-scoring')}
            className="mt-4 text-xs font-semibold text-primary hover:underline text-left flex items-center space-x-1"
          >
            <span>{t.finalizeScoresBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Exam Sessions List */}
      <div className="bg-surface rounded-xl border border-appborder shadow-xs overflow-hidden transition-colors">
        <div className="px-5 py-4 border-b border-appborder flex justify-between items-center">
          <h3 className="text-base font-semibold text-apptext">{t.myActiveSessions}</h3>
          <button
            onClick={() => onNavigate('lecturer-sessions')}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t.viewAllSessions} &rarr;
          </button>
        </div>
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
              <tr className="h-[52px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="px-5 py-2 font-medium text-apptext">SWD392 Oral Viva - Lớp SE1801</td>
                <td className="px-5 py-2 text-mutedtext">Kiến trúc và Thiết kế Phần mềm</td>
                <td className="px-5 py-2 text-mutedtext">Hôm nay, 08:30 AM</td>
                <td className="px-5 py-2 text-mutedtext">32 {t.colCandidates || 'Sinh viên'}</td>
                <td className="px-5 py-2"><StatusBadge status={t.statusInProgress} /></td>
                <td className="px-5 py-2 text-right">
                  <button
                    onClick={() => onNavigate('lecturer-monitor')}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {t.navMonitor}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
