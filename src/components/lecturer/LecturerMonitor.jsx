import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import {
  Tv,
  ExternalLink,
  Volume2,
  VolumeX,
  Mic,
  AlertTriangle,
  FileText,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye
} from 'lucide-react';

export default function LecturerMonitor({ monitorStudents, onReviewTranscript, onShowToast, t }) {
  const [liveStudent, setLiveStudent] = useState(null);
  const [transcriptStudent, setTranscriptStudent] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [hasWarned, setHasWarned] = useState(false);

  const waitingCount = monitorStudents.filter((s) => s.status === 'Waiting').length;
  const inProgressCount = monitorStudents.filter((s) => s.status === 'In Progress').length;
  const completedCount = monitorStudents.filter((s) => s.status === 'Completed').length;

  const handleOpenLiveScreen = (student) => {
    setLiveStudent(student);
    setHasWarned(false);
  };

  const handleOpenTranscript = (student) => {
    setTranscriptStudent(student);
  };

  const handleSendWarning = () => {
    setHasWarned(true);
    if (onShowToast) {
      onShowToast(`Đã gửi cảnh báo giám thị đến thí sinh ${liveStudent.name}: Vui lòng chú ý góc nhìn camera.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calm Header */}
      <div className="bg-surface p-6 rounded-xl border border-appborder shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">{t.liveSessionActive}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-apptext mt-2">{t.monitorTitle}</h1>
          <p className="text-xs text-mutedtext mt-0.5">
            {t.monitorSub}
          </p>
        </div>

        {/* Status Counter Pills */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="text-center px-3 py-1.5 bg-canvas rounded-lg border border-appborder">
            <div className="text-mutedtext font-medium">{t.statusWaiting}</div>
            <div className="text-base font-bold text-amber-700 dark:text-amber-400">{waitingCount}</div>
          </div>
          <div className="text-center px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-blue-800 dark:text-blue-300 font-medium">{t.statusInProgress}</div>
            <div className="text-base font-bold text-primary">{inProgressCount}</div>
          </div>
          <div className="text-center px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="text-emerald-800 dark:text-emerald-300 font-medium">{t.statusCompleted}</div>
            <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">{completedCount}</div>
          </div>
        </div>
      </div>

      {/* Candidates Monitoring Table */}
      <div className="bg-surface rounded-xl border border-appborder shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-appborder text-xs font-semibold uppercase">
              <tr>
                <th className="px-5 py-3">{t.colStudentName}</th>
                <th className="px-5 py-3">{t.colExamStatus}</th>
                <th className="px-5 py-3">{t.colProgress}</th>
                <th className="px-5 py-3 text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-appborder">
              {monitorStudents.map((st) => (
                <tr key={st.id} className="h-[52px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-2 font-medium text-apptext">
                    <div className="font-semibold text-apptext flex items-center space-x-2">
                      <span>{st.name}</span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-primary border border-blue-200 dark:border-blue-900 font-medium">
                        {st.studentId}
                      </span>
                    </div>
                    <div className="text-xs text-mutedtext font-normal">ĐH FPT Hà Nội</div>
                  </td>
                  <td className="px-5 py-2">
                    <StatusBadge
                      status={
                        st.status === 'Completed'
                          ? t.statusCompleted
                          : st.status === 'In Progress'
                          ? t.statusInProgress
                          : t.statusWaiting
                      }
                    />
                  </td>
                  <td className="px-5 py-2 text-xs text-mutedtext">
                    <div className="font-medium text-apptext">{st.currentQ}</div>
                    <div className="text-[11px] text-mutedtext">Thời gian: {st.elapsed}</div>
                  </td>
                  <td className="px-5 py-2 text-right">
                    {st.status === 'Completed' ? (
                      <button
                        onClick={() => handleOpenTranscript(st)}
                        className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center space-x-1"
                        title="Xem biên bản thi đã kết thúc"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{t.reviewTranscript}</span>
                      </button>
                    ) : st.status === 'In Progress' ? (
                      <button
                        onClick={() => handleOpenLiveScreen(st)}
                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center space-x-1"
                        title="Mở màn hình giám sát thi trực tiếp"
                      >
                        <span>{t.viewLiveScreen}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-xs text-mutedtext">{t.statusWaiting}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL 1: LIVE EXAM SCREEN MONITORING ================= */}
      {liveStudent && (
        <Modal
          isOpen={!!liveStudent}
          onClose={() => setLiveStudent(null)}
          title={`Giám Sát Trực Tiếp: ${liveStudent.name} (${liveStudent.studentId})`}
        >
          <div className="space-y-4">
            {/* Live Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900 text-white text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span className="font-bold tracking-wider uppercase text-red-400">🔴 LIVE PROCTORING</span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-slate-300">1080p WebRTC Feed (Ping: 16ms)</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-300">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Thời gian thi: <strong className="text-white font-mono">{liveStudent.elapsed}</strong></span>
                </span>
              </div>
            </div>

            {/* Split Screen View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Simulated Camera Video & Audio Waveform */}
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex flex-col items-center justify-center p-4 text-white shadow-inner">
                  {/* Face outline box */}
                  <div className="w-28 h-36 rounded-2xl border-2 border-emerald-400/80 bg-slate-900/60 flex flex-col items-center justify-center relative shadow-lg">
                    <div className="w-14 h-14 rounded-full bg-slate-800 text-primary flex items-center justify-center text-lg font-bold border border-slate-700">
                      {liveStudent.name.split(' ').slice(-1)[0][0]}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-200 mt-2 text-center px-1">
                      {liveStudent.name}
                    </div>
                    {/* Bounding box marker */}
                    <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-emerald-400"></div>
                    <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-emerald-400"></div>
                    <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-emerald-400"></div>
                    <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-emerald-400"></div>
                  </div>

                  {/* Top Overlay Badge */}
                  <div className="absolute top-2 left-2 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                    <UserCheck className="w-3 h-3" />
                    <span>AI Face Verification: Verified (ĐH FPT)</span>
                  </div>

                  {/* Audio waveform overlay */}
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2">
                      <Mic className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                      <span className="text-slate-300 font-medium">Microphone Live (STT)</span>
                    </div>

                    {/* Equalizer bars */}
                    <div className="flex items-center space-x-1 h-4">
                      <div className="w-1 bg-emerald-400 rounded-full animate-bounce h-3"></div>
                      <div className="w-1 bg-emerald-400 rounded-full animate-bounce h-4 delay-75"></div>
                      <div className="w-1 bg-emerald-400 rounded-full animate-bounce h-2 delay-150"></div>
                      <div className="w-1 bg-emerald-400 rounded-full animate-bounce h-4 delay-100"></div>
                      <div className="w-1 bg-emerald-400 rounded-full animate-bounce h-3 delay-200"></div>
                    </div>
                  </div>
                </div>

                {/* Audio volume controller */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-canvas border border-appborder text-xs">
                  <span className="text-mutedtext">Âm thanh tai nghe giám thị:</span>
                  <button
                    type="button"
                    onClick={() => setIsAudioMuted(!isAudioMuted)}
                    className="px-2.5 py-1 rounded border border-appborder text-apptext hover:bg-surface flex items-center space-x-1"
                  >
                    {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-mutedtext" /> : <Volume2 className="w-3.5 h-3.5 text-primary" />}
                    <span>{isAudioMuted ? 'Đang tắt tiếng' : 'Đang nghe trực tiếp'}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Question & Live Speech-to-Text Feed */}
              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-mutedtext mb-1">
                    Nội dung câu hỏi viva hiện tại:
                  </div>
                  <div className="p-3 rounded-lg bg-surface border border-appborder text-xs text-apptext font-medium leading-relaxed">
                    "Phân tích sự khác biệt cốt lõi giữa Kiến trúc Đơn khối (Monolithic) và Vi dịch vụ (Microservices). Khi nào hệ thống phần mềm nên tách microservices?"
                  </div>

                  {/* Follow-up question badge */}
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
                    <span className="font-bold text-amber-800 dark:text-amber-300">Câu hỏi phụ AI vừa đặt:</span>
                    <p className="text-amber-950 dark:text-amber-200 mt-0.5 text-[11px] leading-relaxed">
                      "Khi tách sang Microservices, bạn giải quyết thách thức về tính nhất quán dữ liệu (Data Consistency) giữa các dịch vụ như thế nào thay cho ACID transaction?"
                    </p>
                  </div>
                </div>

                {/* Live Transcript Stream */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-mutedtext mb-1">
                    <span className="flex items-center space-x-1 text-primary">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t.liveSTTFeed || 'Biên bản nhận diện trực tiếp (STT Feed)'}</span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-[10px] lowercase font-normal">đang truyền luồng…</span>
                  </div>
                  <div className="p-3 rounded-lg bg-canvas border border-appborder text-xs text-apptext font-mono leading-relaxed max-h-32 overflow-y-auto">
                    <p className="text-mutedtext">
                      "...Dạ trong Microservices ta sử dụng mô hình Tính nhất quán sau cùng (<span className="text-primary font-semibold">Eventual Consistency</span>) và triển khai <span className="text-primary font-semibold">Saga Pattern</span> kết hợp <span className="text-primary font-semibold">Outbox Pattern</span> với Message Broker như Kafka, đồng thời xây dựng các giao dịch bù trừ (<span className="text-primary font-semibold">Compensating Transactions</span>) khi có bước bị thất bại..."
                    </p>
                  </div>
                </div>

                {/* Real-time AI Assistant Indicators */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-canvas border border-appborder">
                    <span className="text-mutedtext">{t.keywordMatch || 'Độ khớp từ khóa'}:</span>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">94% (Rất chuẩn)</div>
                  </div>
                  <div className="p-2 rounded bg-canvas border border-appborder">
                    <span className="text-mutedtext">{t.speakingPace || 'Tốc độ trả lời'}:</span>
                    <div className="font-bold text-apptext mt-0.5">140 từ/phút (Lưu loát)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Proctor Actions */}
            <div className="pt-3 border-t border-appborder flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleSendWarning}
                className={`h-9 px-3.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                  hasWarned
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300'
                    : 'border-appborder text-mutedtext hover:text-apptext hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>{hasWarned ? 'Đã gửi cảnh báo' : (t.warnCandidateBtn || 'Gửi cảnh báo / Nhắc nhở')}</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setLiveStudent(null)}
                  className="h-9 px-4 rounded-lg border border-appborder text-xs font-medium text-mutedtext hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const st = liveStudent;
                    setLiveStudent(null);
                    if (onReviewTranscript) onReviewTranscript(st);
                  }}
                  className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs"
                >
                  <span>{t.goToScoringBtn || 'Chuyển sang phiếu chấm điểm'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL 2: COMPLETED TRANSCRIPT RECORD ================= */}
      {transcriptStudent && (
        <Modal
          isOpen={!!transcriptStudent}
          onClose={() => setTranscriptStudent(null)}
          title={`Biên Bản Vấn Đáp Hoàn Thành: ${transcriptStudent.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-canvas border border-appborder space-y-1">
              <div><strong className="text-apptext">Thí sinh:</strong> {transcriptStudent.name} ({transcriptStudent.studentId})</div>
              <div><strong className="text-apptext">Trạng thái:</strong> <span className="text-emerald-600 font-semibold">Đã hoàn thành toàn bộ câu hỏi viva</span></div>
              <div><strong className="text-apptext">Thời lượng tổng cộng:</strong> {transcriptStudent.elapsed}</div>
            </div>

            <div>
              <div className="font-semibold text-apptext mb-1">Câu hỏi 1 & Câu trả lời:</div>
              <p className="p-3 rounded-lg bg-surface border border-appborder text-mutedtext leading-relaxed font-mono">
                "Thí sinh đã trình bày đầy đủ 4 điều kiện Deadlock và giải thích chi tiết cơ chế Resource Ordering để triệt tiêu Circular Wait. Phản hồi câu hỏi phụ chính xác trong 35 giây."
              </p>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-primary">
              <strong>Điểm AI Service đề xuất:</strong> 8.8 / 10.0 (Cần Giảng viên thẩm định và khóa điểm chính thức).
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setTranscriptStudent(null)}
                className="h-9 px-4 rounded-lg border border-appborder text-xs font-medium text-mutedtext"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const st = transcriptStudent;
                  setTranscriptStudent(null);
                  if (onReviewTranscript) onReviewTranscript(st);
                }}
                className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center space-x-1.5"
              >
                <span>Mở phiếu chấm điểm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
