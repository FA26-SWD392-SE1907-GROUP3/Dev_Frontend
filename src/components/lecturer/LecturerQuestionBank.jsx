import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { Plus, MoreVertical, Sparkles, Search, Filter, Tag, CheckCircle } from 'lucide-react';

export default function LecturerQuestionBank({ questions, setQuestions, onShowToast, t }) {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Add question form state
  const [newContent, setNewContent] = useState('');
  const [newCourse, setNewCourse] = useState('CS301 - Operating Systems & Concurrency');
  const [newTopic, setNewTopic] = useState('General Topic');
  const [newIdealPoints, setNewIdealPoints] = useState('');

  const handleOpenDetail = (q) => {
    setSelectedQuestion({ ...q, idealAnswerPoints: q.idealAnswerPoints || [] });
    setIsDetailOpen(true);
  };

  const handleSaveDetail = () => {
    setQuestions(questions.map((q) => (q.id === selectedQuestion.id ? selectedQuestion : q)));
    setIsDetailOpen(false);
    onShowToast(t.saveChanges);
  };

  const handleAddIdealPoint = (point) => {
    if (!point.trim()) return;
    setSelectedQuestion({
      ...selectedQuestion,
      idealAnswerPoints: [...(selectedQuestion.idealAnswerPoints || []), point.trim()],
    });
  };

  const handleRemoveIdealPoint = (index) => {
    setSelectedQuestion({
      ...selectedQuestion,
      idealAnswerPoints: selectedQuestion.idealAnswerPoints.filter((_, idx) => idx !== index),
    });
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const pointsArr = newIdealPoints
      ? newIdealPoints.split(',').map((p) => p.trim()).filter(Boolean)
      : ['Accurate conceptual definition', 'Technical terminology'];

    const newQ = {
      id: `q-${Date.now()}`,
      content: newContent.trim(),
      course: newCourse,
      source: 'Manual Entry',
      status: 'Approved',
      topic: newTopic.trim() || 'General Topic',
      idealAnswerPoints: pointsArr,
    };

    setQuestions([newQ, ...questions]);
    setIsAddOpen(false);
    setNewContent('');
    setNewIdealPoints('');
    onShowToast(t.addQuestion);
  };

  // Filtered questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.topic && q.topic.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'AI') return q.source.includes('AI');
    if (selectedFilter === 'MANUAL') return q.source.includes('Manual');
    if (selectedFilter === 'SWD392') return q.course.includes('SWD392');
    if (selectedFilter === 'PRN231') return q.course.includes('PRN231');
    if (selectedFilter === 'CSD201') return q.course.includes('CSD201');
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-apptext tracking-tight">{t.qbTitle}</h1>
          <p className="text-sm text-mutedtext mt-1">{t.qbSub}</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium flex items-center space-x-2 transition-colors self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addQuestion}</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface p-3.5 rounded-xl border border-appborder shadow-xs transition-colors">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-mutedtext" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchQuestions}
            className="w-full h-10 pl-9 pr-3 bg-canvas border border-appborder rounded-lg text-xs text-apptext focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-mutedtext shrink-0" />
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              selectedFilter === 'ALL'
                ? 'bg-primary text-white font-semibold'
                : 'text-mutedtext hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.filterAll}
          </button>
          <button
            onClick={() => setSelectedFilter('SWD392')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              selectedFilter === 'SWD392'
                ? 'bg-primary text-white font-semibold'
                : 'text-mutedtext hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            SWD392
          </button>
          <button
            onClick={() => setSelectedFilter('PRN231')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              selectedFilter === 'PRN231'
                ? 'bg-primary text-white font-semibold'
                : 'text-mutedtext hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            PRN231
          </button>
          <button
            onClick={() => setSelectedFilter('CSD201')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              selectedFilter === 'CSD201'
                ? 'bg-primary text-white font-semibold'
                : 'text-mutedtext hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            CSD201
          </button>
          <button
            onClick={() => setSelectedFilter('AI')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              selectedFilter === 'AI'
                ? 'bg-primary text-white font-semibold'
                : 'text-mutedtext hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.filterAIOnly}
          </button>
          <button
            onClick={() => setSelectedFilter('MANUAL')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              selectedFilter === 'MANUAL'
                ? 'bg-primary text-white font-semibold'
                : 'text-mutedtext hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.filterManualOnly}
          </button>
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
                <th className="px-5 py-3">Topic / Source</th>
                <th className="px-5 py-3">{t.colStatus}</th>
                <th className="px-5 py-3 text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-appborder">
              {filteredQuestions.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => handleOpenDetail(q)}
                  className="h-[52px] hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-2.5 font-medium text-apptext max-w-md">
                    <p className="line-clamp-2 leading-snug">{q.content}</p>
                  </td>
                  <td className="px-5 py-2.5 text-mutedtext whitespace-nowrap">{q.course}</td>
                  <td className="px-5 py-2.5 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      {q.topic && (
                        <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-mutedtext px-2 py-0.5 rounded border border-appborder">
                          {q.topic}
                        </span>
                      )}
                      <span className="inline-flex items-center space-x-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {q.source.includes('AI') && <Sparkles className="w-3 h-3 text-primary" />}
                        <span>{q.source}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 whitespace-nowrap">
                    <StatusBadge status={t.statusApproved} />
                  </td>
                  <td className="px-5 py-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenDetail(q)}
                      className="p-1 rounded text-mutedtext hover:text-apptext hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Question Detail Modal with Ideal Points */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={t.questionDetail}
        maxWidth="max-w-2xl"
      >
        {selectedQuestion && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-mutedtext uppercase tracking-wider">
                  {t.questionDetail}
                </label>
                {selectedQuestion.source.includes('AI') && (
                  <span className="text-[11px] text-primary flex items-center space-x-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Generated</span>
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={selectedQuestion.content}
                onChange={(e) => setSelectedQuestion({ ...selectedQuestion, content: e.target.value })}
                className="w-full p-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:outline-none leading-relaxed"
              />
            </div>

            {/* Ideal Points / Đáp án mẫu chi tiết */}
            <div className="p-4 rounded-xl bg-canvas border border-appborder space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-apptext flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{t.sampleIdealPoints}</span>
                </span>
                <span className="text-[11px] text-mutedtext">AI & Lecturer Benchmark</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(selectedQuestion.idealAnswerPoints || []).map((point, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 bg-surface border border-appborder text-xs px-2.5 py-1 rounded-md text-apptext"
                  >
                    <span>&bull; {point}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIdealPoint(idx)}
                      className="text-mutedtext hover:text-red-500 ml-1 text-sm font-bold"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="+ Thêm ý chuẩn (nhấn Enter)..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddIdealPoint(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="flex-1 h-8 px-2.5 bg-surface border border-appborder rounded text-xs text-apptext focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-mutedtext block">{t.colCourse}</span>
                <span className="font-medium text-apptext">{selectedQuestion.course}</span>
              </div>
              <div>
                <span className="text-mutedtext block">{t.colStatus}</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{t.statusApproved}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-appborder flex justify-end space-x-2">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="h-9 px-4 rounded-lg border border-appborder text-xs font-medium text-mutedtext hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDetail}
                className="h-9 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs"
              >
                {t.saveChanges}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Question Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={t.addQuestion}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAddQuestion} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-apptext mb-1">{t.questionDetail}</label>
            <textarea
              required
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. Compare Dijkstra's Shortest Path algorithm with the Bellman-Ford algorithm..."
              className="w-full p-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-apptext mb-1">Topic / Chủ đề</label>
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g. Concurrency / Memory Management"
              className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-apptext mb-1">{t.sampleIdealPoints} (cách nhau bằng dấu phẩy)</label>
            <input
              type="text"
              value={newIdealPoints}
              onChange={(e) => setNewIdealPoints(e.target.value)}
              placeholder="Mutual exclusion, Hold and wait, No preemption, Circular wait"
              className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-apptext mb-1">{t.colCourse}</label>
            <select
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="CS301 - Operating Systems & Concurrency">CS301 - Operating Systems & Concurrency</option>
              <option value="CS204 - Data Structures & Algorithms">CS204 - Data Structures & Algorithms</option>
              <option value="CS410 - Distributed Systems Architecture">CS410 - Distributed Systems Architecture</option>
            </select>
          </div>
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="h-10 px-4 rounded-lg border border-appborder text-xs font-medium text-mutedtext hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs"
            >
              {t.addQuestion}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
