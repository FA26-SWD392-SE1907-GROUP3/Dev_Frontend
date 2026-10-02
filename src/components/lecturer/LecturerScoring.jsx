import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sliders,
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
  Check,
  Clock,
  BookOpen
} from 'lucide-react';

export default function LecturerScoring({
  evaluations = [],
  setEvaluations,
  selectedEvaluationId,
  setSelectedEvaluationId,
  evaluation,
  setEvaluation,
  onBack,
  onShowToast,
  t,
}) {
  const activeList = evaluations && evaluations.length > 0 ? evaluations : (evaluation ? [evaluation] : []);

  // Search and filter states for the student roster
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'finalized'

  // Current active evaluation
  const activeId = selectedEvaluationId || activeList[0]?.id;
  const currentEvaluation = activeList.find((e) => e.id === activeId) || activeList[0] || {};

  // Local state for the current evaluation's rubric and scoring
  const [rubricScores, setRubricScores] = useState(currentEvaluation.rubricScores || []);
  const [finalScoreInput, setFinalScoreInput] = useState(currentEvaluation.lecturerFinalScore ?? 0);
  const [remarksInput, setRemarksInput] = useState(currentEvaluation.lecturerRemarks || '');
  const [isFinalized, setIsFinalized] = useState(currentEvaluation.finalized || false);

  const calculateTotal = (scores) => {
    return scores.reduce((sum, item) => sum + (item.lecturerGiven ?? item.aiGiven), 0);
  };

  // Sync state whenever selected student changes
  useEffect(() => {
    if (currentEvaluation && currentEvaluation.id) {
      setRubricScores(currentEvaluation.rubricScores || []);
      setFinalScoreInput(
        currentEvaluation.lecturerFinalScore ?? calculateTotal(currentEvaluation.rubricScores || [])
      );
      setRemarksInput(currentEvaluation.lecturerRemarks || '');
      setIsFinalized(currentEvaluation.finalized || false);
    }
  }, [currentEvaluation?.id]);

  const handleScoreChange = (index, val) => {
    const num = Math.min(Math.max(0, Number(val)), rubricScores[index].max);
    const updated = [...rubricScores];
    updated[index] = { ...updated[index], lecturerGiven: num };
    setRubricScores(updated);

    const newTotal = calculateTotal(updated);
    setFinalScoreInput(Number(newTotal.toFixed(1)));
  };

  const handleFinalize = (e) => {
    e.preventDefault();
    const updated = {
      ...currentEvaluation,
      rubricScores,
      lecturerFinalScore: Number(finalScoreInput),
      lecturerRemarks: remarksInput,
      finalized: true,
      status: 'Finalized',
    };

    if (setEvaluations && evaluations.length > 0) {
      const nextList = evaluations.map((item) => (item.id === currentEvaluation.id ? updated : item));
      setEvaluations(nextList);
    } else if (setEvaluation) {
      setEvaluation(updated);
    }

    setIsFinalized(true);
    if (onShowToast) {
      onShowToast(`${currentEvaluation.studentName}: ${t.scoreFinalizedLocked}`);
    }
  };

  const handleSelectStudent = (id) => {
    if (setSelectedEvaluationId) {
      setSelectedEvaluationId(id);
    }
  };

  // Next / Previous Student navigation
  const currentIndex = activeList.findIndex((e) => e.id === currentEvaluation?.id);
  const handleNextStudent = () => {
    if (currentIndex < activeList.length - 1) {
      handleSelectStudent(activeList[currentIndex + 1].id);
    }
  };
  const handlePrevStudent = () => {
    if (currentIndex > 0) {
      handleSelectStudent(activeList[currentIndex - 1].id);
    }
  };

  // Filtering candidates
  const filteredCandidates = activeList.filter((item) => {
    const matchesSearch =
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.campus && item.campus.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterStatus === 'pending') return matchesSearch && !item.finalized;
    if (filterStatus === 'finalized') return matchesSearch && item.finalized;
    return matchesSearch;
  });

  const pendingCount = activeList.filter((e) => !e.finalized).length;
  const finalizedCount = activeList.filter((e) => e.finalized).length;

  const scoreDelta = ((finalScoreInput || 0) - (currentEvaluation.aiSuggestedScore || 0)).toFixed(1);

  const getAvatarInitials = (name) => {
    if (!name) return 'SV';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ================= SECTION 1: CANDIDATE ROSTER SELECTOR ================= */}
      <div className="bg-surface rounded-xl border border-appborder p-4 sm:p-5 shadow-xs space-y-3.5 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-appborder">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              <h2 className="text-sm font-bold text-apptext uppercase tracking-wider">
                {t.candidateRoster || 'Danh Sách Thí Sinh Chờ Chấm Điểm'}
              </h2>
            </div>
            <p className="text-xs text-mutedtext mt-0.5">
              {activeList.length} thí sinh dự thi viva &bull; {pendingCount} ca chờ giảng viên duyệt &bull; {finalizedCount} ca đã khóa điểm
            </p>
          </div>

          {/* Search & Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-mutedtext" />
              <input
                type="text"
                placeholder={t.searchCandidatePlaceholder || 'Tìm theo tên, MSSV (SE18...)...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-3 text-xs bg-canvas border border-appborder rounded-lg text-apptext focus:border-primary focus:outline-none w-48 sm:w-60"
              />
            </div>

            {/* Filter Buttons */}
            <div className="inline-flex rounded-lg border border-appborder bg-canvas p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-surface text-primary shadow-xs font-semibold'
                    : 'text-mutedtext hover:text-apptext'
                }`}
              >
                Tất cả ({activeList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('pending')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterStatus === 'pending'
                    ? 'bg-surface text-amber-600 shadow-xs font-semibold'
                    : 'text-mutedtext hover:text-apptext'
                }`}
              >
                Chờ duyệt ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('finalized')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterStatus === 'finalized'
                    ? 'bg-surface text-emerald-600 shadow-xs font-semibold'
                    : 'text-mutedtext hover:text-apptext'
                }`}
              >
                Đã khóa ({finalizedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Candidate Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
          {filteredCandidates.map((stu) => {
            const isSelected = stu.id === currentEvaluation.id;
            return (
              <button
                key={stu.id}
                type="button"
                onClick={() => handleSelectStudent(stu.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 group relative ${
                  isSelected
                    ? 'bg-primary-light/40 border-primary ring-2 ring-primary/20 shadow-xs'
                    : 'bg-canvas hover:bg-slate-50 dark:hover:bg-slate-800/60 border-appborder hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      stu.finalized
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-blue-100 dark:bg-blue-950/70 text-primary border border-blue-300'
                    }`}
                  >
                    {getAvatarInitials(stu.studentName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-apptext truncate group-hover:text-primary transition-colors">
                      {stu.studentName}
                    </div>
                    <div className="text-[11px] text-mutedtext font-mono truncate">
                      {stu.studentId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-appborder/60">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      stu.finalized
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {stu.finalized ? 'Đã khóa điểm' : 'Chờ duyệt'}
                  </span>
                  <span className="font-bold text-apptext text-xs">
                    {stu.finalized
                      ? `${stu.lecturerFinalScore.toFixed(1)}/10`
                      : `AI: ${stu.aiSuggestedScore.toFixed(1)}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= SECTION 2: TOP ACTION & STUDENT IDENTITY HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-appborder gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-mutedtext">
              {t.scoringBreadcrumb}
            </span>
            <span className="text-mutedtext/40">&bull;</span>
            <StatusBadge status={isFinalized ? t.statusFinalized : t.statusPending} />
            <span className="text-mutedtext/40">&bull;</span>
            <span className="text-xs text-mutedtext">
              Thí sinh {currentIndex + 1} / {activeList.length}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-apptext mt-1">
            {t.colStudentName}: {currentEvaluation.studentName}{' '}
            <span className="text-sm font-normal text-mutedtext">
              ({currentEvaluation.studentId} &bull; {currentEvaluation.campus || 'ĐH FPT'})
            </span>
          </h1>
          <p className="text-xs text-mutedtext">
            {t.colCourse}: {currentEvaluation.course} &bull; {t.colExamSession}:{' '}
            {currentEvaluation.examSession} &bull; Thời lượng viva: {currentEvaluation.duration || '08:45'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Previous Candidate Button */}
          <button
            type="button"
            onClick={handlePrevStudent}
            disabled={currentIndex === 0}
            className="h-9 px-3 rounded-lg border border-appborder bg-surface text-xs font-medium text-apptext hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center space-x-1 shadow-xs"
            title={t.prevCandidateBtn || 'Thí sinh trước'}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.prevCandidateBtn || 'Trước'}</span>
          </button>

          {/* Next Candidate Button */}
          <button
            type="button"
            onClick={handleNextStudent}
            disabled={currentIndex === activeList.length - 1}
            className="h-9 px-3 rounded-lg border border-appborder bg-surface text-xs font-medium text-apptext hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center space-x-1 shadow-xs"
            title={t.nextCandidateBtn || 'Thí sinh kế tiếp'}
          >
            <span className="hidden md:inline">{t.nextCandidateBtn || 'Kế tiếp'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="h-9 px-3 rounded-lg border border-appborder bg-surface text-xs font-medium text-apptext hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 shadow-xs"
            title={t.printTranscriptBtn}
          >
            <Printer className="w-3.5 h-3.5 text-mutedtext" />
            <span className="hidden sm:inline">{t.printTranscriptBtn}</span>
          </button>

          {/* Back to Monitor */}
          <button
            onClick={onBack}
            className="h-9 px-3 rounded-lg border border-appborder bg-surface text-xs font-medium text-apptext hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.openMonitorBtn}</span>
          </button>
        </div>
      </div>

      {/* ================= SECTION 3: TWO-COLUMN EVALUATION VIEW ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: EXAM RECORD & TRANSCRIPTS (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface rounded-xl border border-appborder p-5 shadow-xs space-y-5 transition-colors">
            <div className="flex items-center justify-between border-b border-appborder pb-3">
              <h3 className="text-base font-semibold text-apptext">
                {t.examRecordTitle}
              </h3>
              <span className="text-xs font-mono text-mutedtext">
                Session: {currentEvaluation.examSession}
              </span>
            </div>

            {/* Question 1 Block */}
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Câu hỏi thi Viva chính thức
                  </span>
                  <span className="text-[11px] text-mutedtext font-medium">Trọng số 40%</span>
                </div>
                <p className="text-sm font-medium text-apptext mt-1.5 leading-snug">
                  "{currentEvaluation.question}"
                </p>
              </div>

              {/* Student Voice Transcript */}
              <div className="p-4 rounded-lg bg-canvas border border-appborder space-y-1.5">
                <div className="flex items-center justify-between text-xs text-mutedtext">
                  <span className="font-semibold text-apptext">{t.studentVoiceTranscript}</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-mutedtext" />
                    <span>Thời lượng: 42s</span>
                  </span>
                </div>
                <p className="text-xs text-apptext leading-relaxed font-sans bg-surface/60 p-2.5 rounded border border-appborder/50">
                  "{currentEvaluation.studentTranscript}"
                </p>
              </div>

              {/* Follow-up Question Block */}
              {currentEvaluation.followUpTriggered && (
                <>
                  <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                      <span>{t.followUpGeneratedTitle}</span>
                    </div>
                    <p className="text-xs font-medium text-amber-950 dark:text-amber-200 leading-relaxed">
                      "{currentEvaluation.followUpQuestion}"
                    </p>
                  </div>

                  {/* Follow-up Transcript */}
                  <div className="p-4 rounded-lg bg-canvas border border-appborder space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-mutedtext">
                      <span className="font-semibold text-apptext">{t.followUpVoiceTranscript}</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-mutedtext" />
                        <span>Thời lượng: 24s</span>
                      </span>
                    </div>
                    <p className="text-xs text-apptext leading-relaxed font-sans bg-surface/60 p-2.5 rounded border border-appborder/50">
                      "{currentEvaluation.followUpTranscript}"
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RUBRIC, AI SUGGESTED SCORE, LECTURER FINAL SCORE (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Rubric Criteria with Interactive Points Adjustment */}
          <div className="bg-surface rounded-xl border border-appborder p-5 shadow-xs space-y-3.5 transition-colors">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-apptext flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-primary" />
                <span>{t.rubricAssessmentTitle}</span>
              </h3>
              <span className="text-[11px] font-medium text-mutedtext">Tự động cộng điểm</span>
            </div>

            <div className="space-y-3 text-xs">
              {rubricScores.map((r, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-canvas border border-appborder space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-apptext">{r.criterion}</span>
                    <span className="text-mutedtext">Tối đa {r.max.toFixed(1)}đ</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max={r.max}
                      step="0.1"
                      disabled={isFinalized}
                      value={r.lecturerGiven ?? r.aiGiven}
                      onChange={(e) => handleScoreChange(i, e.target.value)}
                      className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="w-10 text-right font-bold text-apptext text-sm">
                      {(r.lecturerGiven ?? r.aiGiven).toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI SUGGESTED SCORE (ADVISORY ONLY) */}
          <div className="bg-canvas rounded-xl border border-appborder p-5 space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-mutedtext">
                {t.aiServiceEvalTitle}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {t.advisorySuggestion}
              </span>
            </div>
            <div className="flex items-baseline space-x-3">
              <span className="text-2xl font-bold text-apptext">
                {currentEvaluation.aiSuggestedScore?.toFixed(1) || '0.0'}
              </span>
              <span className="text-xs text-mutedtext font-medium">/ 10.0</span>
              {scoreDelta !== '0.0' && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    Number(scoreDelta) > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {Number(scoreDelta) > 0 ? `+${scoreDelta}` : scoreDelta} so với Giảng viên
                </span>
              )}
            </div>
            <p className="text-xs text-mutedtext leading-relaxed">
              "{currentEvaluation.aiRationale}"
            </p>
            {/* Supporting Note */}
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-300 flex items-center space-x-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-700" />
              <span className="font-medium">{t.aiNote}</span>
            </div>
          </div>

          {/* LECTURER FINAL SCORE (OFFICIAL AUTHORITY) */}
          <form
            onSubmit={handleFinalize}
            className="bg-surface rounded-xl border-2 border-primary p-5 shadow-xs space-y-4 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {t.lecturerFinalDecision}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary-light text-primary">
                {t.officialAuthority}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-apptext mb-1">
                {t.finalScoreLabel}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  disabled={isFinalized}
                  value={finalScoreInput}
                  onChange={(e) => setFinalScoreInput(Number(e.target.value))}
                  className="w-24 h-11 px-3 text-lg font-bold text-apptext border-2 border-appborder focus:border-primary focus:ring-primary rounded-lg text-center bg-canvas"
                />
                <span className="text-sm font-semibold text-mutedtext">/ 10.0</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-apptext mb-1">
                {t.officialRemarksLabel}
              </label>
              <textarea
                rows={3}
                disabled={isFinalized}
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                placeholder="Nhập nhận xét học thuật chính thức của Giảng viên..."
                className="w-full p-2.5 text-xs text-apptext border border-appborder rounded-lg focus:border-primary focus:ring-1 focus:ring-primary bg-canvas leading-relaxed"
              />
            </div>

            {isFinalized ? (
              <div className="space-y-2">
                <div className="w-full h-11 rounded-lg bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center space-x-2 shadow-xs cursor-default">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.scoreFinalizedLocked}</span>
                </div>
                {currentIndex < activeList.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNextStudent}
                    className="w-full h-10 rounded-lg border border-primary text-primary hover:bg-primary/10 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <span>Chấm sinh viên tiếp theo ({activeList[currentIndex + 1].studentName})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="submit"
                className="w-full h-11 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center justify-center space-x-2 transition-all shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.btnFinalizeScore}</span>
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
