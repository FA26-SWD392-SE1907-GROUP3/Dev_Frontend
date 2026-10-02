import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Mic, Square, Loader2, CheckCircle2, GraduationCap, Clock, AlertCircle } from 'lucide-react';

export default function StudentOralExam({ onExitToPortal, onShowToast, lang, t }) {
  const [questionIndex, setQuestionIndex] = useState(1);
  const [isFollowUpActive, setIsFollowUpActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [micState, setMicState] = useState('ready');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');

  // 120s Countdown timer per question
  const [timeLeft, setTimeLeft] = useState(120);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  const questionsEn = [
    {
      id: 1,
      text: 'Explain the fundamental differences between Monolithic and Microservices architecture. Under what system conditions should an engineering team decompose into microservices?',
      followUp: 'How do you handle data consistency across independent microservice databases instead of traditional ACID transactions?',
    },
    {
      id: 2,
      text: 'In Clean Architecture, how does the Dependency Inversion Principle (DIP) keep core Domain logic isolated from external databases and UI frameworks?',
      followUp: 'If you replace Entity Framework Core with Dapper or MongoDB in the Infrastructure layer, why do Domain and Application layers remain untouched?',
    },
  ];

  const questionsVi = [
    {
      id: 1,
      text: 'Hãy phân tích sự khác biệt cốt lõi giữa Kiến trúc Đơn khối (Monolithic) và Vi dịch vụ (Microservices). Khi nào hệ thống phần mềm nên chuyển sang Microservices?',
      followUp: 'Khi tách sang Microservices, bạn sẽ giải quyết thách thức về tính nhất quán dữ liệu (Data Consistency) giữa các dịch vụ như thế nào thay cho ACID transaction truyền thống?',
    },
    {
      id: 2,
      text: 'Trong thiết kế Clean Architecture, nguyên tắc Dependency Inversion (DIP) được áp dụng như thế nào để tách biệt Domain Logic khỏi cơ sở dữ liệu và framework bên ngoài?',
      followUp: 'Nếu muốn thay thế Entity Framework Core bằng Dapper hoặc MongoDB cho hạ tầng lưu trữ, tầng Domain và Application Layer có cần phải chỉnh sửa mã nguồn không? Hãy giải thích cơ chế.',
    },
  ];

  const questions = lang === 'vi' ? questionsVi : questionsEn;
  const currentQ = questions[questionIndex - 1];

  // Question countdown timer
  useEffect(() => {
    setTimeLeft(120);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [questionIndex, isFollowUpActive]);

  // Speech Recognition setup (Web Speech API with graceful fallback)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang === 'vi' ? 'vi-VN' : 'en-US';

      recognition.onresult = (event) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentText.trim());
      };

      recognition.onerror = () => {};
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      clearInterval(timerRef.current);
    };
  }, [lang]);

  // Text to Speech Synthesizer
  const handlePlayTTS = () => {
    setIsTTSPlaying(true);
    const textToSpeak = isFollowUpActive ? currentQ.followUp : currentQ.text;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
      utterance.rate = 0.95;
      utterance.onend = () => setIsTTSPlaying(false);
      utterance.onerror = () => setIsTTSPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsTTSPlaying(false), 2500);
    }
  };

  // Microphone controller
  const handleStartRecording = () => {
    setMicState('listening');
    setTranscript('');
    setRecordingSeconds(0);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {}
    }

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        const next = prev + 1;
        if (next >= 2) setMicState('answering');
        return next;
      });
    }, 1000);
  };

  const handleStopRecording = () => {
    clearInterval(timerRef.current);
    setMicState('finished');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Fallback simulated transcript if microphone not speaking or permissions denied
    if (!transcript) {
      if (lang === 'vi') {
        if (isFollowUpActive) {
          setTranscript('Dạ trong Microservices ta sử dụng mô hình Tính nhất quán sau cùng (Eventual Consistency) và triển khai Saga Pattern kết hợp Outbox Pattern với Kafka/RabbitMQ, cùng các compensating transactions khi gặp lỗi.');
        } else if (questionIndex === 1) {
          setTranscript('Kiến trúc Monolith đóng gói toàn bộ chức năng vào một khối triển khai duy nhất. Kiến trúc Microservices chia nhỏ hệ thống thành các dịch vụ độc lập theo ranh giới nghiệp vụ (Bounded Context), giao tiếp qua HTTP REST hoặc Message Broker. Hệ thống nên tách khi quy mô đội ngũ phát triển đông và có các module chịu tải đột biến cần scale riêng.');
        } else {
          setTranscript('Trong Clean Architecture, Domain Layer nằm ở tâm, định nghĩa Interface Repository. Infrastructure Layer sẽ implements interface đó. Áp dụng Dependency Inversion giúp Domain không bị phụ thuộc vào Entity Framework Core hay Database cụ thể.');
        }
      } else {
        if (isFollowUpActive) {
          setTranscript('In microservices, we implement eventual consistency using the Saga Pattern (orchestration or choreography) combined with the Outbox Pattern and compensating transactions.');
        } else if (questionIndex === 1) {
          setTranscript('Monolithic architecture packages all features into a single deployable unit, whereas Microservices decomposes them into independent services around bounded contexts. Decomposing is recommended when teams scale or specific modules demand isolated elasticity.');
        } else {
          setTranscript('In Clean Architecture, domain entities define repository interfaces. The infrastructure layer implements them, ensuring domain logic remains decoupled from external databases.');
        }
      }
    }
  };

  const handleSubmitAnswer = () => {
    setIsAnalyzing(true);

    setTimeout(() => {
      setIsAnalyzing(false);

      if (!isFollowUpActive && questionIndex === 1) {
        setIsFollowUpActive(true);
        resetMic();
        onShowToast(t.followUpQuestionLabel);
      } else {
        if (questionIndex < questions.length) {
          setQuestionIndex((prev) => prev + 1);
          setIsFollowUpActive(false);
          resetMic();
          onShowToast(`${t.questionCounter} 2`);
        } else {
          setIsCompleted(true);
          onShowToast(t.examCompletedTitle);
        }
      }
    }, 1800);
  };

  const resetMic = () => {
    setMicState('ready');
    setTranscript('');
    setRecordingSeconds(0);
    clearInterval(timerRef.current);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // EXAM COMPLETED SCREEN (Zero raw AI scores displayed)
  if (isCompleted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-lg mx-auto animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-apptext">{t.examCompletedTitle}</h1>
        <p className="text-sm text-mutedtext leading-relaxed">
          {t.examCompletedSub}
        </p>

        <div className="p-4 rounded-xl bg-canvas border border-appborder text-xs text-apptext text-left space-y-1 w-full">
          <div className="font-semibold text-apptext">{t.evaluationInProgress}</div>
          <p className="leading-relaxed text-mutedtext">
            {t.evaluationInProgressSub}
          </p>
        </div>

        <button
          onClick={onExitToPortal}
          className="mt-4 h-10 px-5 rounded-lg border border-appborder bg-surface text-xs font-semibold text-apptext hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
        >
          {t.btnBackToPortal}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between max-w-[720px] mx-auto w-full px-4 py-8 animate-fade-in">
      {/* TOP HEADER: MINIMAL LOGO, COURSE TITLE, TIMER, QUESTION COUNTER */}
      <div className="flex items-center justify-between pb-5 border-b border-appborder">
        <div className="flex items-center space-x-2 text-sm font-bold text-primary">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <span>{t.systemName}</span>
        </div>

        {/* Live Question Countdown Timer */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-surface border border-appborder text-xs font-semibold">
          <Clock className={`w-3.5 h-3.5 ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-mutedtext'}`} />
          <span className={timeLeft < 30 ? 'text-red-600 font-bold' : 'text-apptext'}>
            {formatTimer(timeLeft)}
          </span>
        </div>

        <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-primary border border-blue-100 dark:border-blue-900/50">
          {t.questionCounter} {questionIndex} / {questions.length}
        </div>
      </div>

      {/* CANDIDATE & SUBJECT IDENTITY SUB-BAR */}
      <div className="pt-3 pb-1 flex flex-wrap items-center justify-between text-xs text-mutedtext gap-2">
        <div>
          Thí sinh: <strong className="text-apptext">Nguyễn Hoàng Nam (SE184920)</strong> &bull; ĐH FPT
        </div>
        <div className="font-mono text-primary font-semibold text-xs">
          Môn thi: SWD392 - Kiến trúc phần mềm
        </div>
      </div>

      {/* CENTER AREA: QUESTION & INTERACTION */}
      <div className="my-auto py-8 space-y-6">

        {/* QUESTION CARD AREA */}
        <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-appborder shadow-xs space-y-4 transition-colors">
          <div className="text-[11px] font-bold uppercase tracking-wider text-mutedtext">
            {t.questionCounter} {questionIndex}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-apptext leading-snug">
            "{currentQ.text}"
          </h2>

          {/* QUESTION AUDIO ACTION (TEXT TO SPEECH) */}
          <div className="pt-2">
            <button
              onClick={handlePlayTTS}
              disabled={isTTSPlaying}
              className={`h-10 px-4 rounded-lg border text-xs font-semibold inline-flex items-center space-x-2 transition-all shadow-xs ${
                isTTSPlaying
                  ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-400 text-blue-900 dark:text-blue-200'
                  : 'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-primary'
              }`}
            >
              <Volume2 className={`w-4 h-4 ${isTTSPlaying ? 'animate-pulse text-primary' : ''}`} />
              <span>{isTTSPlaying ? t.speechServicePlaying : t.listenToQuestion}</span>
            </button>
          </div>
        </div>

        {/* FOLLOW-UP QUESTION AREA (Conditional) */}
        {isFollowUpActive && (
          <div className="bg-amber-50/80 dark:bg-amber-950/30 p-5 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2.5 animate-fade-in transition-colors">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-200 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                {t.followUpQuestionLabel}
              </span>
              <span className="text-xs text-amber-800 dark:text-amber-400 font-medium">{t.aiClarification}</span>
            </div>
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-200 leading-relaxed">
              "{currentQ.followUp}"
            </p>
            <button
              onClick={handlePlayTTS}
              className="text-xs text-amber-900 dark:text-amber-300 font-semibold underline inline-flex items-center space-x-1"
            >
              <span>{t.listenToFollowUp}</span>
            </button>
          </div>
        )}

        {/* VOICE ANSWER AREA (80PX DOMINANT MICROPHONE WITH 4 STATES) */}
        <div className="bg-surface p-8 rounded-2xl border border-appborder shadow-xs text-center space-y-4 transition-colors">

          {/* Soundwave Visualizer */}
          {(micState === 'listening' || micState === 'answering') && (
            <div className="h-8 flex items-center justify-center space-x-1.5 animate-fade-in">
              <div className="w-1 bg-primary rounded-full animate-soundwave" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 bg-primary rounded-full animate-soundwave" style={{ animationDelay: '0.3s' }} />
              <div className="w-1 bg-primary rounded-full animate-soundwave" style={{ animationDelay: '0.2s' }} />
              <div className="w-1 bg-primary rounded-full animate-soundwave" style={{ animationDelay: '0.5s' }} />
              <div className="w-1 bg-primary rounded-full animate-soundwave" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 bg-primary rounded-full animate-soundwave" style={{ animationDelay: '0.4s' }} />
              <div className="w-1 bg-primary rounded-full animate-soundwave" style={{ animationDelay: '0.2s' }} />
            </div>
          )}

          {/* 80px Circular Microphone Button */}
          <div className="relative inline-flex items-center justify-center">
            {(micState === 'listening' || micState === 'answering') && (
              <div className="absolute w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/40 animate-pulse-ring" />
            )}
            <button
              onClick={() => {
                if (micState === 'ready') handleStartRecording();
                else if (micState === 'listening' || micState === 'answering') handleStopRecording();
              }}
              disabled={isAnalyzing}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all focus:outline-none ${
                micState === 'listening' || micState === 'answering'
                  ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-4 focus:ring-red-200'
                  : micState === 'finished'
                  ? 'bg-slate-700 text-white'
                  : 'bg-primary hover:bg-primary-hover text-white focus:ring-4 focus:ring-blue-200'
              }`}
            >
              {micState === 'listening' || micState === 'answering' ? (
                <Square className="w-7 h-7 fill-white" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* State Text Descriptions */}
          {!isAnalyzing && (
            <div>
              <div className="text-sm font-semibold text-apptext">
                {micState === 'ready' && t.micReady}
                {micState === 'listening' && `${t.micListening} (${recordingSeconds}s)`}
                {micState === 'answering' && `${t.micAnswering} (${recordingSeconds}s)`}
                {micState === 'finished' && t.micFinished}
              </div>
              <div className="text-xs text-mutedtext mt-0.5">
                {micState === 'ready' && t.micReadySub}
                {(micState === 'listening' || micState === 'answering') &&
                  `${recordingSeconds}s • Tap button to stop.`}
                {micState === 'finished' && t.micFinishedSub}
              </div>
            </div>
          )}

          {/* Transcript Preview Box */}
          {micState === 'finished' && transcript && !isAnalyzing && (
            <div className="p-3.5 bg-canvas rounded-lg border border-appborder text-left animate-fade-in transition-colors">
              <span className="text-[11px] font-semibold text-mutedtext uppercase tracking-wider">
                {t.voiceTranscriptPreview}
              </span>
              <p className="text-xs text-apptext mt-1 leading-relaxed italic">
                "{transcript}"
              </p>
            </div>
          )}

          {/* Finished Action CTAs: Re-record / Submit */}
          {micState === 'finished' && !isAnalyzing && (
            <div className="pt-2 flex justify-center space-x-3">
              <button
                onClick={resetMic}
                className="h-10 px-4 rounded-lg border border-appborder bg-surface text-xs font-semibold text-apptext hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t.btnReRecord}
              </button>
              <button
                onClick={handleSubmitAnswer}
                className="h-10 px-6 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors shadow-xs"
              >
                {t.btnSubmitAnswer} &rarr;
              </button>
            </div>
          )}

          {/* Analysis Loading State */}
          {isAnalyzing && (
            <div className="p-4 space-y-2 animate-fade-in">
              <div className="inline-flex items-center space-x-2 text-primary font-semibold text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t.analyzingAnswer}</span>
              </div>
              <p className="text-xs text-mutedtext">
                {t.analyzingAnswerSub}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center text-xs text-mutedtext pt-4 border-t border-appborder">
        {t.humanInTheLoopNote}
      </div>
    </div>
  );
}
