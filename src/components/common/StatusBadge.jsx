import React from 'react';

export default function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  if (s.includes('progress') || s.includes('active') || s.includes('speaking') || s.includes('diễn ra') || s.includes('hoạt động')) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
  } else if (s.includes('scheduled') || s.includes('waiting') || s.includes('review') || s.includes('draft') || s.includes('pending') || s.includes('lập lịch') || s.includes('đang chờ') || s.includes('bản thảo') || s.includes('chờ') || s.includes('cần xử lý')) {
    styles = 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
  } else if (s.includes('completed') || s.includes('approved') || s.includes('ready') || s.includes('finalized') || s.includes('hoàn thành') || s.includes('đã duyệt') || s.includes('sẵn sàng') || s.includes('khóa điểm')) {
    styles = 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
  } else if (s.includes('score') || s.includes('final') || s.includes('chấm') || s.includes('admin')) {
    styles = 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800';
  } else if (s.includes('insufficient') || s.includes('error') || s.includes('rejected') || s.includes('thiếu')) {
    styles = 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles} transition-colors whitespace-nowrap`}>
      {status}
    </span>
  );
}
