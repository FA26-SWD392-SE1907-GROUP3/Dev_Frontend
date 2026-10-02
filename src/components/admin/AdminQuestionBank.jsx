import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { Search, Filter, Eye, CheckCircle2 } from 'lucide-react';

export default function AdminQuestionBank({ questions, t }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const filteredQuestions = questions.filter((q) => {
    const matchCourse =
      courseFilter === 'all' ||
      (courseFilter === 'SWD392' && q.course.includes('SWD392')) ||
      (courseFilter === 'PRN231' && q.course.includes('PRN231')) ||
      (courseFilter === 'CSD201' && q.course.includes('CSD201'));
    const textMatch =
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.topic && q.topic.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCourse && textMatch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-apptext tracking-tight">{t.qbTitle}</h1>
        <p className="text-sm text-mutedtext mt-1">{t.qbSub}</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-xl border border-appborder p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mutedtext" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchQuestions || 'Tìm kiếm câu hỏi theo từ khóa, chuyên đề...'}
            className="w-full h-10 pl-9 pr-4 bg-canvas border border-appborder rounded-lg text-sm text-apptext placeholder:text-mutedtext focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-mutedtext shrink-0 hidden sm:block" />
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả môn học</option>
            <option value="SWD392">SWD392 - Kiến trúc phần mềm</option>
            <option value="PRN231">PRN231 - Ứng dụng phân tán</option>
            <option value="CSD201">CSD201 - DSA</option>
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-surface rounded-xl border border-appborder shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-appborder text-xs font-semibold uppercase">
              <tr>
                <th className="px-5 py-3">{t.questionDetail}</th>
                <th className="px-5 py-3">{t.colCourse}</th>
                <th className="px-5 py-3">Chuyên đề</th>
                <th className="px-5 py-3">Nguồn</th>
                <th className="px-5 py-3">{t.colStatus}</th>
                <th className="px-5 py-3 text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-appborder">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-mutedtext">
                    Không tìm thấy câu hỏi nào.
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => setSelectedQuestion(q)}
                    className="h-[52px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer"
                  >
                    <td className="px-5 py-2 font-medium text-apptext max-w-md truncate" title={q.content}>
                      {q.content}
                    </td>
                    <td className="px-5 py-2 text-mutedtext text-xs whitespace-nowrap">{q.course}</td>
                    <td className="px-5 py-2 text-xs text-mutedtext whitespace-nowrap">
                      {q.topic || 'Tổng quát'}
                    </td>
                    <td className="px-5 py-2 whitespace-nowrap">
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {q.source}
                      </span>
                    </td>
                    <td className="px-5 py-2 whitespace-nowrap">
                      <StatusBadge status={t.statusApproved} />
                    </td>
                    <td className="px-5 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedQuestion(q);
                        }}
                        className="p-1.5 rounded text-mutedtext hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <Modal
          isOpen={!!selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          title="Chi tiết câu hỏi thi vấn đáp chính thức"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-primary px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                {selectedQuestion.course}
              </span>
              <StatusBadge status={t.statusApproved} />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-mutedtext mb-1">
                Nội dung câu hỏi viva:
              </label>
              <div className="p-3 rounded-lg bg-canvas border border-appborder text-sm text-apptext font-medium leading-relaxed">
                {selectedQuestion.content}
              </div>
            </div>

            {selectedQuestion.idealAnswerPoints && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-mutedtext mb-1">
                  Ý chính đáp án chuẩn (Dành cho AI & Giảng viên đối soát):
                </label>
                <div className="space-y-1.5 p-3 rounded-lg bg-canvas border border-appborder">
                  {selectedQuestion.idealAnswerPoints.map((pt, i) => (
                    <div key={i} className="flex items-start space-x-2 text-xs text-apptext">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                className="h-9 px-4 rounded-lg bg-primary text-white text-xs font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
