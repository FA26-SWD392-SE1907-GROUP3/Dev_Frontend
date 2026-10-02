import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';

export default function ExamWizard({ courses, questions, examSessions, setExamSessions, onClose, onFinish, onShowToast, t }) {
  const [step, setStep] = useState(1);

  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.code || 'SWD392');
  const [selectedStudents, setSelectedStudents] = useState(['SE184920', 'SE180123', 'IA180456']);
  const [examDate, setExamDate] = useState('2026-10-18');
  const [examTime, setExamTime] = useState('09:00');
  const [selectedQuestions, setSelectedQuestions] = useState([questions[0]?.id || 'q-1', questions[1]?.id || 'q-2']);
  const [isSuccess, setIsSuccess] = useState(false);

  const studentsList = [
    { id: 'SE184920', name: 'Nguyễn Hoàng Nam' },
    { id: 'SE180123', name: 'Lê Tuấn Anh' },
    { id: 'IA180456', name: 'Trần Mai Linh' },
    { id: 'SE182341', name: 'Vũ Thu Trang' },
    { id: 'SE171564', name: 'Đỗ Minh Đức' },
  ];

  const handleToggleStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter((s) => s !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const handleToggleQuestion = (id) => {
    if (selectedQuestions.includes(id)) {
      setSelectedQuestions(selectedQuestions.filter((q) => q !== id));
    } else {
      setSelectedQuestions([...selectedQuestions, id]);
    }
  };

  const handlePublish = () => {
    const courseObj = courses.find((c) => c.code === selectedCourse);
    const newSession = {
      id: `ses-${Date.now()}`,
      name: `${selectedCourse} Oral Viva - Lớp mới`,
      course: courseObj ? `${courseObj.code} - ${courseObj.name}` : selectedCourse,
      lecturer: 'TS. Hoàng Văn Thụ',
      dateTime: `${examDate} | ${examTime}`,
      studentsCount: selectedStudents.length,
      questionsCount: selectedQuestions.length,
      status: 'Scheduled',
    };

    setExamSessions([newSession, ...examSessions]);
    setIsSuccess(true);
    onShowToast(t.successPublished);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div className="flex items-center justify-between pb-4 border-b border-appborder">
        <div>
          <h2 className="text-xl font-bold text-apptext">{t.wizardTitle}</h2>
          <p className="text-xs text-mutedtext mt-0.5">
            {t.wizardSub}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-mutedtext hover:text-apptext hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Wizard Progress Stepper */}
      <div className="flex items-center justify-between px-2 text-xs">
        {[
          { num: 1, label: t.stepCourse },
          { num: 2, label: t.stepStudents },
          { num: 3, label: t.stepSchedule },
          { num: 4, label: t.stepQuestions },
          { num: 5, label: t.stepConfirm },
        ].map((item, idx) => {
          const isDone = step > item.num;
          const isCurrent = step === item.num;

          return (
            <React.Fragment key={item.num}>
              <div
                className={`flex items-center space-x-1.5 font-medium ${
                  isCurrent
                    ? 'text-primary font-semibold'
                    : isDone
                    ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                    : 'text-mutedtext'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                    isCurrent
                      ? 'bg-primary text-white font-bold'
                      : isDone
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-canvas border border-appborder text-mutedtext'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : item.num}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </div>
              {idx < 4 && <div className="flex-1 h-[1px] bg-appborder mx-2" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* STEP 1: SELECT COURSE */}
      {step === 1 && (
        <div className="bg-surface p-6 rounded-xl border border-appborder shadow-xs space-y-4 transition-colors">
          <h3 className="text-base font-semibold text-apptext">{t.step1Title}</h3>
          <p className="text-xs text-mutedtext">{t.step1Sub}</p>
          <div className="space-y-2 pt-2">
            {courses.map((c) => (
              <label
                key={c.code}
                className={`flex items-center p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  selectedCourse === c.code
                    ? 'border-primary bg-primary-light/40'
                    : 'border-appborder hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="courseSelect"
                  checked={selectedCourse === c.code}
                  onChange={() => setSelectedCourse(c.code)}
                  className="text-primary focus:ring-primary mr-3"
                />
                <div>
                  <div className="text-sm font-semibold text-apptext">
                    {c.code} - {c.name}
                  </div>
                  <div className="text-xs text-mutedtext mt-0.5">
                    Assigned: {c.lecturer} &bull; Candidates: {c.enrolledStudents}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium flex items-center space-x-1 shadow-xs"
            >
              <span>{t.btnContinue}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ADD STUDENTS */}
      {step === 2 && (
        <div className="bg-surface p-6 rounded-xl border border-appborder shadow-xs space-y-4 transition-colors">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-apptext">{t.step2Title}</h3>
              <p className="text-xs text-mutedtext">{t.step2Sub}</p>
            </div>
            <span className="text-xs font-semibold text-primary bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded">
              Selected: {selectedStudents.length}
            </span>
          </div>

          <div className="divide-y divide-appborder border border-appborder rounded-lg overflow-hidden">
            {studentsList.map((st) => (
              <label key={st.id} className="flex items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(st.id)}
                  onChange={() => handleToggleStudent(st.id)}
                  className="rounded text-primary focus:ring-primary mr-3"
                />
                <div className="text-sm text-apptext font-medium">
                  {st.name} <span className="text-xs text-mutedtext">({st.id})</span>
                </div>
              </label>
            ))}
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="h-10 px-4 rounded-lg border border-appborder text-mutedtext hover:text-apptext text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.btnBack}</span>
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={selectedStudents.length === 0}
              className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium flex items-center space-x-1 shadow-xs disabled:opacity-50"
            >
              <span>{t.btnContinue}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SET DATE / TIME */}
      {step === 3 && (
        <div className="bg-surface p-6 rounded-xl border border-appborder shadow-xs space-y-4 transition-colors">
          <h3 className="text-base font-semibold text-apptext">{t.step3Title}</h3>
          <p className="text-xs text-mutedtext">{t.step3Sub}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">Date</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">Start Time</label>
              <input
                type="time"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="h-10 px-4 rounded-lg border border-appborder text-mutedtext hover:text-apptext text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.btnBack}</span>
            </button>
            <button
              onClick={() => setStep(4)}
              className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium flex items-center space-x-1 shadow-xs"
            >
              <span>{t.btnContinue}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CONFIGURE QUESTIONS */}
      {step === 4 && (
        <div className="bg-surface p-6 rounded-xl border border-appborder shadow-xs space-y-4 transition-colors">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-apptext">{t.step4Title}</h3>
              <p className="text-xs text-mutedtext">{t.step4Sub}</p>
            </div>
            <span className="text-xs font-semibold text-primary bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded">
              Selected: {selectedQuestions.length}
            </span>
          </div>

          <div className="divide-y divide-appborder border border-appborder rounded-lg overflow-hidden">
            {questions.map((q) => (
              <label key={q.id} className="flex items-start p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(q.id)}
                  onChange={() => handleToggleQuestion(q.id)}
                  className="mt-1 rounded text-primary focus:ring-primary mr-3"
                />
                <div>
                  <div className="text-sm text-apptext font-medium leading-snug">{q.content}</div>
                  <div className="text-xs text-mutedtext mt-0.5">{q.course}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setStep(3)}
              className="h-10 px-4 rounded-lg border border-appborder text-mutedtext hover:text-apptext text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.btnBack}</span>
            </button>
            <button
              onClick={() => setStep(5)}
              disabled={selectedQuestions.length === 0}
              className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium flex items-center space-x-1 shadow-xs disabled:opacity-50"
            >
              <span>{t.btnContinue}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: CONFIRM EXAM */}
      {step === 5 && !isSuccess && (
        <div className="bg-surface p-6 rounded-xl border border-appborder shadow-xs space-y-4 transition-colors">
          <h3 className="text-base font-semibold text-apptext">{t.step5Title}</h3>
          <p className="text-xs text-mutedtext">{t.step5Sub}</p>

          <div className="bg-canvas rounded-lg p-4 border border-appborder space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-mutedtext">{t.colCourseCode}:</span>
              <span className="font-semibold text-apptext">{selectedCourse}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mutedtext">{t.stepStudents}:</span>
              <span className="font-semibold text-apptext">{selectedStudents.length} Candidates</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mutedtext">{t.stepSchedule}:</span>
              <span className="font-semibold text-apptext">
                {examDate} | {examTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-mutedtext">{t.stepQuestions}:</span>
              <span className="font-semibold text-apptext">{selectedQuestions.length} Questions</span>
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center">
            <button
              onClick={() => setStep(4)}
              className="h-10 px-4 rounded-lg border border-appborder text-mutedtext hover:text-apptext text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.btnBack}</span>
            </button>
            <button
              onClick={handlePublish}
              className="h-10 px-6 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-xs"
            >
              {t.btnConfirmPublish}
            </button>
          </div>
        </div>
      )}

      {/* Success State */}
      {isSuccess && (
        <div className="bg-surface p-8 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-xs text-center space-y-4 animate-fade-in transition-colors">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-apptext">{t.successPublished}</h3>
          <p className="text-xs text-mutedtext max-w-md mx-auto">
            {t.successPublishedSub}
          </p>
          <div className="pt-2 flex justify-center space-x-3">
            <button
              onClick={onFinish}
              className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs"
            >
              {t.navSessions}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
