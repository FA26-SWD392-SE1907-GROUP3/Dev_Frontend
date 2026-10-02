import React, { useState } from 'react';
import { ShieldCheck, Volume2, Mic, RotateCcw, Save } from 'lucide-react';

export default function AdminSettings({ settings, setSettings, onShowToast, t }) {
  const [formState, setFormState] = useState(settings);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSettings(formState);
    onShowToast(t.settingsSavedSuccess || 'Đã lưu cấu hình kỳ thi thành công.');
  };

  const handleReset = () => {
    const defaults = {
      answerTimeoutSeconds: 120,
      maxFollowUps: 2,
      ttsVoicePersona: 'Academic Standard (Vietnamese / English - FPT Voice)',
      sttConfidenceThreshold: 'Standard (85% confidence)',
      mandatoryLecturerVerification: true,
    };
    setFormState(defaults);
    setSettings(defaults);
    onShowToast('Đã khôi phục cài đặt mặc định của hệ thống.');
  };

  const testTTSAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const testPhrase = 'Kính chào quý thầy cô và sinh viên Đại học FPT, đây là âm thanh kiểm tra từ Dịch vụ Tổng hợp Giọng nói của hệ thống AIVES.';
      const utter = new SpeechSynthesisUtterance(testPhrase);
      utter.lang = 'vi-VN';
      utter.rate = 0.95;
      setIsPlayingTTS(true);
      utter.onend = () => setIsPlayingTTS(false);
      utter.onerror = () => setIsPlayingTTS(false);
      window.speechSynthesis.speak(utter);
    } else {
      setIsPlayingTTS(true);
      setTimeout(() => setIsPlayingTTS(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-apptext tracking-tight">{t.settingsTitle}</h1>
        <p className="text-sm text-mutedtext mt-1">{t.settingsSub}</p>
      </div>

      <form onSubmit={handleSave} className="bg-surface rounded-xl border border-appborder p-6 space-y-6 shadow-xs max-w-3xl transition-colors">
        {/* Group 1: Timing */}
        <div>
          <h3 className="text-base font-semibold text-apptext">{t.timingGroup}</h3>
          <p className="text-xs text-mutedtext mt-0.5">{t.timingGroupSub}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">{t.answerTimeout}</label>
              <select
                value={formState.answerTimeoutSeconds}
                onChange={(e) => setFormState({ ...formState, answerTimeoutSeconds: Number(e.target.value) })}
                className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value={90}>90 giây (1.5 phút / câu viva)</option>
                <option value={120}>120 giây (2 phút / câu viva - Chuẩn FPT)</option>
                <option value={180}>180 giây (3 phút / câu viva)</option>
                <option value={240}>240 giây (4 phút / câu viva)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">{t.maxFollowUps}</label>
              <select
                value={formState.maxFollowUps}
                onChange={(e) => setFormState({ ...formState, maxFollowUps: Number(e.target.value) })}
                className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value={1}>Tối đa 1 câu hỏi phụ</option>
                <option value={2}>Tối đa 2 câu hỏi phụ (Khuyên dùng)</option>
                <option value={3}>Tối đa 3 câu hỏi phụ</option>
              </select>
            </div>
          </div>
        </div>

        <hr className="border-appborder" />

        {/* Group 2: Speech Services */}
        <div>
          <h3 className="text-base font-semibold text-apptext">{t.speechGroup}</h3>
          <p className="text-xs text-mutedtext mt-0.5">{t.speechGroupSub}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">{t.ttsVoice}</label>
              <select
                value={formState.ttsVoicePersona}
                onChange={(e) => setFormState({ ...formState, ttsVoicePersona: e.target.value })}
                className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="Academic Standard (Vietnamese / English - FPT Voice)">FPT Academic Voice (Song ngữ Việt - Anh)</option>
                <option value="Academic Formal (Voice B)">Academic Formal (Voice B - Giọng chuẩn khảo thí)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">{t.sttThreshold}</label>
              <select
                value={formState.sttConfidenceThreshold}
                onChange={(e) => setFormState({ ...formState, sttConfidenceThreshold: e.target.value })}
                className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="Standard (85% confidence)">Tiêu chuẩn (Ngưỡng 85% độ tin cậy)</option>
                <option value="Strict (92% confidence)">Nghiêm ngặt (Ngưỡng 92% độ tin cậy)</option>
              </select>
            </div>
          </div>

          {/* Interactive Audio Testing Widget */}
          <div className="mt-4 p-4 rounded-xl bg-canvas border border-appborder flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-apptext flex items-center space-x-1.5">
                <Volume2 className="w-4 h-4 text-primary" />
                <span>Kiểm tra thực tế âm thanh Speech Service (TTS Test)</span>
              </div>
              <p className="text-[11px] text-mutedtext mt-0.5">
                Phát thử câu thông báo mẫu để rà soát âm lượng và chất lượng phát âm trên thiết bị phòng thi.
              </p>
            </div>
            <button
              type="button"
              onClick={testTTSAudio}
              className={`h-9 px-4 rounded-lg text-xs font-semibold flex items-center space-x-2 shrink-0 transition-colors ${
                isPlayingTTS
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-primary hover:bg-primary-hover text-white shadow-xs'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingTTS ? 'Đang phát âm thanh...' : (t.btnTestTTS || 'Phát thử giọng đọc TTS')}</span>
            </button>
          </div>
        </div>

        <hr className="border-appborder" />

        {/* Group 3: Human Verification Enforcements */}
        <div>
          <h3 className="text-base font-semibold text-apptext">{t.governanceGroup}</h3>
          <p className="text-xs text-mutedtext mt-0.5">{t.governanceGroupSub}</p>
          <div className="mt-4 p-4 rounded-lg bg-canvas border border-appborder flex items-start space-x-3">
            <input
              type="checkbox"
              checked={formState.mandatoryLecturerVerification}
              disabled
              className="mt-1 rounded text-primary focus:ring-primary"
            />
            <div>
              <div className="text-sm font-semibold text-apptext flex items-center space-x-1.5">
                <span>{t.mandatoryScoreConfirm}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-primary">
                  {t.activeRubric ? 'Bắt buộc' : 'Enforced'}
                </span>
              </div>
              <p className="text-xs text-mutedtext mt-1 leading-relaxed">
                {t.mandatoryScoreConfirmSub}
              </p>
            </div>
          </div>
        </div>

        {/* Save / Reset buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-appborder">
          <button
            type="button"
            onClick={handleReset}
            className="h-10 px-4 rounded-lg border border-appborder text-xs font-medium text-mutedtext hover:text-apptext hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.btnResetDefaults || 'Khôi phục mặc định'}</span>
          </button>

          <button
            type="submit"
            className="h-10 px-6 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center space-x-2 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{t.saveSettings}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
