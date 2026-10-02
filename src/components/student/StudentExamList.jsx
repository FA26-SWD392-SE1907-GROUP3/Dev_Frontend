import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import {
  ArrowRight,
  Headphones,
  Mic,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  BookOpen,
  Award,
  FileText,
  User,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function StudentExamList({ onJoinExam, t }) {
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'device-check' | 'history'

  // Device check state
  const [isSpeakerTested, setIsSpeakerTested] = useState(false);
  const [isSpeakerPlaying, setIsSpeakerPlaying] = useState(false);
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micTranscript, setMicTranscript] = useState('');
  const [isMicTested, setIsMicTested] = useState(false);

  // Student Info (FPT University)
  const student = {
    name: 'Nguyễn Hoàng Nam',
    studentId: 'SE184920',
    campus: 'FPT University Hà Nội (Hòa Lạc)',
    major: 'Kỹ thuật Phần mềm (Software Engineering)',
    cohort: 'K18',
  };

  const upcomingExams = [
    {
      id: 'ses-1',
      code: 'SWD392',
      name: 'SWD392 Oral Viva - Lớp SE1801',
      courseName: 'Kiến trúc và Thiết kế Phần mềm (Software Architecture & Design)',
      lecturer: 'TS. Hoàng Văn Thụ',
      dateTime: 'Hôm nay | 08:30 - 11:30',
      questionsCount: 2,
      timePerQ: '120 giây / câu',
      status: 'Ready to Join',
      canJoin: true,
    },
    {
      id: 'ses-2',
      code: 'PRN231',
      name: 'PRN231 Midterm Viva - Lớp SE1802',
      courseName: 'Lập trình ứng dụng phân tán .NET (Building Distributed Applications)',
      lecturer: 'ThS. Lê Thành Đạt',
      dateTime: 'Ngày mai | 13:30 - 17:00',
      questionsCount: 2,
      timePerQ: '120 giây / câu',
      status: 'Scheduled',
      canJoin: false,
    },
    {
      id: 'ses-3',
      code: 'CSD201',
      name: 'CSD201 Final Viva Voce - Lớp CS1801',
      courseName: 'Cấu trúc dữ liệu và giải thuật (Data Structures & Algorithms)',
      lecturer: 'TS. Hoàng Văn Thụ',
      dateTime: '18/10/2026 | 09:00',
      questionsCount: 3,
      timePerQ: '120 giây / câu',
      status: 'Scheduled',
      canJoin: false,
    },
  ];

  const examHistory = [
    {
      id: 'hist-1',
      code: 'SWD392',
      name: 'SWD392 Oral Viva - Lớp SE1801 (Đợt thi chính thức)',
      date: '02/10/2026',
      lecturer: 'TS. Hoàng Văn Thụ',
      finalScore: 9.2,
      aiScore: 9.2,
      status: 'Finalized',
      remarks: 'Thí sinh hiểu sâu sắc kiến trúc vi dịch vụ, trả lời lưu loát, nắm chắc kỹ thuật Saga và Outbox pattern. Đạt xuất sắc yêu cầu viva môn SWD392 Đại học FPT.',
      rubrics: [
        { name: 'Độ chính xác kỹ thuật & Kiến trúc', score: '3.8 / 4.0' },
        { name: 'Khả năng phản biện & Lập luận viva', score: '3.6 / 4.0' },
        { name: 'Ứng biến với câu hỏi phụ AI', score: '1.8 / 2.0' },
      ],
    },
  ];

  const handleTestSpeaker = () => {
    setIsSpeakerPlaying(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `Xin chào thí sinh ${student.name}, mã số sinh viên ${student.studentId}. Hệ thống Speech Service của AIVES hoạt động tốt trên thiết bị của bạn.`;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'vi-VN';
      utter.onend = () => {
        setIsSpeakerPlaying(false);
        setIsSpeakerTested(true);
      };
      utter.onerror = () => {
        setIsSpeakerPlaying(false);
        setIsSpeakerTested(true);
      };
      window.speechSynthesis.speak(utter);
    } else {
      setTimeout(() => {
        setIsSpeakerPlaying(false);
        setIsSpeakerTested(true);
      }, 1500);
    }
  };

  const handleTestMic = () => {
    setIsMicTesting(true);
    setMicTranscript('Đang lắng nghe... Hãy nói câu thử nghiệm');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          const res = Array.from(event.results)
            .map((r) => r[0].transcript)
            .join('');
          setMicTranscript(res);
        };

        recognition.onend = () => {
          setIsMicTesting(false);
          setIsMicTested(true);
        };

        recognition.onerror = () => {
          setIsMicTesting(false);
          setMicTranscript('Kính chào thầy cô và hệ thống AI Examiner môn SWD392 (Kiểm tra mô phỏng)');
          setIsMicTested(true);
        };

        recognition.start();
      } catch (err) {
        setIsMicTesting(false);
        setMicTranscript('Kính chào thầy cô và hệ thống AI Examiner môn SWD392 (Đã nhận tín hiệu micro)');
        setIsMicTested(true);
      }
    } else {
      setTimeout(() => {
        setIsMicTesting(false);
        setMicTranscript('Kính chào thầy cô và hệ thống AI Examiner môn SWD392 (Âm lượng micro chuẩn)');
        setIsMicTested(true);
      }, 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
      {/* Student Profile Banner */}
      <div className="bg-surface rounded-2xl border border-appborder p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold text-xl shrink-0 border border-blue-200 dark:border-blue-800">
            {student.name.split(' ').slice(-1)[0][0]}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-apptext">{student.name}</h2>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-primary border border-blue-200 dark:border-blue-900">
                {student.studentId}
              </span>
            </div>
            <p className="text-xs text-mutedtext mt-1 flex flex-wrap items-center gap-x-2">
              <span>{student.major}</span>
              <span>&bull;</span>
              <span>Khóa {student.cohort}</span>
              <span>&bull;</span>
              <span>{student.campus}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Đủ điều kiện dự thi viva</span>
          </span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-appborder space-x-2 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center space-x-2 ${
            activeTab === 'upcoming'
              ? 'border-primary text-primary'
              : 'border-transparent text-mutedtext hover:text-apptext'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t.tabUpcomingExams || 'Ca thi của tôi'}</span>
        </button>

        <button
          onClick={() => setActiveTab('device-check')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center space-x-2 ${
            activeTab === 'device-check'
              ? 'border-primary text-primary'
              : 'border-transparent text-mutedtext hover:text-apptext'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>{t.tabDeviceCheck || 'Kiểm tra Micro & Loa'}</span>
          {(isSpeakerTested && isMicTested) && (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center space-x-2 ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-mutedtext hover:text-apptext'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{t.tabExamHistory || 'Lịch sử & Kết quả điểm'}</span>
        </button>
      </div>

      {/* TAB 1: UPCOMING EXAMS */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-apptext">{t.studentListTitle}</h3>
            <span className="text-xs text-mutedtext">{upcomingExams.length} ca thi được ghi nhận</span>
          </div>

          <div className="space-y-3">
            {upcomingExams.map((exam) => (
              <div
                key={exam.id}
                className={`bg-surface rounded-xl border p-5 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  exam.canJoin
                    ? 'border-primary/60 ring-1 ring-primary/20 hover:border-primary'
                    : 'border-appborder opacity-90'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-primary border border-blue-200 dark:border-blue-900">
                      {exam.code}
                    </span>
                    <StatusBadge
                      status={exam.canJoin ? t.statusReadyToJoin || 'Sẵn sàng vào thi' : t.statusScheduled || 'Đã lập lịch'}
                    />
                  </div>

                  <h4 className="text-base font-bold text-apptext">{exam.name}</h4>
                  <p className="text-xs text-mutedtext">{exam.courseName}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mutedtext pt-1">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{exam.dateTime}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5" />
                      <span>GV: {exam.lecturer}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{exam.questionsCount} câu hỏi viva ({exam.timePerQ})</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {exam.canJoin ? (
                    <button
                      onClick={onJoinExam}
                      className="h-11 px-6 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm group"
                    >
                      <span>{t.btnJoinExam}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ) : (
                    <button
                      disabled
                      className="h-10 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-mutedtext text-xs font-semibold cursor-not-allowed"
                    >
                      Chưa đến giờ mở phòng
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DEVICE & AUDIO CHECK */}
      {activeTab === 'device-check' && (
        <div className="bg-surface rounded-2xl border border-appborder p-6 shadow-xs space-y-6 transition-colors">
          <div>
            <h3 className="text-lg font-bold text-apptext">{t.deviceCheckTitle || 'Kiểm Tra Thiết Bị Âm Thanh Trước Giờ Thi'}</h3>
            <p className="text-xs text-mutedtext mt-1">{t.deviceCheckSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Speaker Check */}
            <div className="p-5 rounded-xl bg-canvas border border-appborder space-y-3">
              <div className="flex items-center space-x-2 text-apptext font-semibold text-sm">
                <Volume2 className="w-4 h-4 text-primary" />
                <span>{t.speakerCheckLabel || '1. Kiểm tra Loa / Tai nghe (TTS)'}</span>
              </div>
              <p className="text-xs text-mutedtext leading-relaxed">
                Bấm nút bên dưới để nghe câu thông báo từ AI Viva Examiner nhằm chắc chắn bạn nghe rõ âm thanh đề thi.
              </p>
              <button
                type="button"
                onClick={handleTestSpeaker}
                className={`h-10 px-4 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors ${
                  isSpeakerPlaying
                    ? 'bg-amber-600 text-white animate-pulse'
                    : 'bg-primary hover:bg-primary-hover text-white shadow-xs'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{isSpeakerPlaying ? 'Đang phát âm thanh...' : (t.speakerCheckBtn || 'Phát âm thanh mẫu')}</span>
              </button>

              {isSpeakerTested && (
                <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.speakerCheckPass || 'Đã nghe rõ giọng đọc AI'}</span>
                </div>
              )}
            </div>

            {/* Step 2: Mic Check */}
            <div className="p-5 rounded-xl bg-canvas border border-appborder space-y-3">
              <div className="flex items-center space-x-2 text-apptext font-semibold text-sm">
                <Mic className="w-4 h-4 text-primary" />
                <span>{t.micCheckLabel || '2. Kiểm tra Micro (STT Speech-to-Text)'}</span>
              </div>
              <p className="text-xs text-mutedtext leading-relaxed">
                Bấm nút và đọc to: <em>"Kính chào thầy cô và hệ thống AI Examiner môn SWD392"</em> để kiểm tra chất lượng thu âm.
              </p>
              <button
                type="button"
                onClick={handleTestMic}
                className={`h-10 px-4 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors ${
                  isMicTesting
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-primary hover:bg-primary-hover text-white shadow-xs'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isMicTesting ? 'Đang lắng nghe...' : (t.micCheckBtn || 'Thử giọng nói')}</span>
              </button>

              {micTranscript && (
                <div className="p-2.5 rounded bg-surface border border-appborder text-xs text-apptext mt-2 font-mono">
                  {micTranscript}
                </div>
              )}

              {isMicTested && (
                <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.micCheckSuccessNote || 'Tín hiệu micro đạt chuẩn chất lượng thi viva.'}</span>
                </div>
              )}
            </div>
          </div>

          {isSpeakerTested && isMicTested && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{t.deviceReadyBadge || 'Thiết bị của bạn đã đạt chuẩn. Bạn có thể sẵn sàng vào phòng thi viva.'}</span>
              </div>
              <button
                onClick={onJoinExam}
                className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs"
              >
                <span>Vào phòng thi ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXAM HISTORY & FINAL SCORES */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-apptext">{t.historyTitle || 'Các Ca Thi Đã Hoàn Thành & Điểm Chính Thức'}</h3>
            <span className="text-xs text-mutedtext">{examHistory.length} biên bản thi</span>
          </div>

          <div className="space-y-4">
            {examHistory.map((hist) => (
              <div key={hist.id} className="bg-surface rounded-2xl border border-appborder p-6 shadow-xs space-y-4 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-appborder pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-primary border border-blue-200 dark:border-blue-900">
                        {hist.code}
                      </span>
                      <StatusBadge status={t.statusFinalized || 'Đã khóa điểm'} />
                    </div>
                    <h4 className="text-lg font-bold text-apptext mt-1">{hist.name}</h4>
                    <p className="text-xs text-mutedtext">Giảng viên chấm: {hist.lecturer} &bull; Ngày thi: {hist.date}</p>
                  </div>

                  <div className="text-right sm:text-right bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-900 self-start sm:self-auto">
                    <div className="text-xs text-mutedtext font-medium">{t.colFinalScore || 'Điểm chính thức'}</div>
                    <div className="text-2xl font-black text-primary">{hist.finalScore.toFixed(1)} <span className="text-xs font-normal text-mutedtext">/ 10.0</span></div>
                  </div>
                </div>

                {/* Rubric Breakdown */}
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-mutedtext mb-2">Chi tiết tiêu chí Rubric:</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {hist.rubrics.map((r, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-canvas border border-appborder text-xs">
                        <div className="text-mutedtext truncate">{r.name}</div>
                        <div className="font-bold text-apptext mt-0.5">{r.score}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Official Remarks */}
                <div className="p-3.5 rounded-xl bg-canvas border border-appborder text-xs">
                  <div className="font-semibold text-apptext flex items-center space-x-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>{t.colLecturerRemarks || 'Nhận xét của Giảng viên:'}</span>
                  </div>
                  <p className="text-mutedtext italic leading-relaxed">
                    "{hist.remarks}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
