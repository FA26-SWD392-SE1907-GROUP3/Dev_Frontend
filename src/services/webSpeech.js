// Browser-only audio. The application sends text to Spring Boot, never recordings.
export function createWebSpeech({ onTranscript = () => {}, onAnswer = () => {}, onPhase = () => {},
  onListening = () => {}, onFallback = () => {}, onInterruption = () => {},
  env = globalThis, silenceMs = 1500, reminderMs = 8000 }) {
  const Recognition = env.SpeechRecognition || env.webkitSpeechRecognition;
  const synthesis = env.speechSynthesis;
  let active = false, paused = true, speaking = false, transcript = '', recognition = null;
  let silenceTimer, reminderTimer, restartTimer, generation = 0, reminded = false;
  const clear = () => { env.clearTimeout(silenceTimer); env.clearTimeout(reminderTimer); silenceTimer = null; reminderTimer = null; };
  function fallback(message) {
    stop(); onFallback(message);
  }
  function arm() {
    env.clearTimeout(silenceTimer);
    if (!active || paused || speaking) return;
    if (transcript.trim()) { env.clearTimeout(reminderTimer); reminderTimer = null; silenceTimer = env.setTimeout(() => {
      const text = transcript.trim();
      if (!text || paused || speaking || !active) return;
      pause(); transcript = ''; onAnswer(text);
    }, silenceMs); }
    else if (!reminded && !reminderTimer) reminderTimer = env.setTimeout(() => {
      if (!active || paused || transcript.trim()) return;
      reminded = true; say('Bạn cứ bình tĩnh. Bạn có thể trình bày điều mình hiểu về câu hỏi vừa rồi.');
    }, reminderMs);
  }
  function listen() {
    if (!active) return;
    speaking = false; paused = false; onPhase('listening'); onListening(); arm(); ensureRecognition();
  }
  function ensureRecognition() {
    if (!active || paused || recognition) return;
    const current = new Recognition(), prefix = transcript;
    recognition = current;
    current.lang = 'vi-VN'; current.continuous = true; current.interimResults = true;
    current.onspeechstart = () => {
      if (!active || paused || recognition !== current) return;
      if (speaking) {
        generation++; speaking = false; synthesis.cancel();
        onInterruption(); listen();
      }
      env.clearTimeout(reminderTimer); env.clearTimeout(silenceTimer);
      reminderTimer = null;
    };
    current.onresult = event => {
      if (!active || paused || recognition !== current) return;
      const parts = [];
      for (let i = 0; i < event.results.length; i++) parts.push(event.results[i][0].transcript);
      transcript = `${prefix} ${parts.join(' ')}`.trim().slice(0, 12000);
      if (speaking && transcript) {
        generation++; speaking = false; synthesis.cancel(); onInterruption(); listen();
      }
      onTranscript(transcript); arm();
    };
    current.onerror = event => {
      if (!active || recognition !== current) return;
      if (['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'language-not-supported'].includes(event.error))
        fallback('Không dùng được nhận dạng giọng nói. Bạn có thể tiếp tục bằng văn bản.');
    };
    current.onend = () => {
      if (recognition !== current) return;
      recognition = null;
      if (active && !paused) { arm(); restartTimer = env.setTimeout(ensureRecognition, 250); }
    };
    try { current.start(); } catch { fallback('Không mở được nhận dạng giọng nói. Hãy tiếp tục bằng văn bản.'); }
  }
  function say(text) {
    if (!active) return;
    const version = ++generation;
    synthesis.cancel(); clear();
    paused = false; speaking = true; onPhase('speaking'); ensureRecognition();
    const utterance = new env.SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN'; utterance.rate = 1;
    const voice = synthesis.getVoices().find(v => v.lang?.toLowerCase().startsWith('vi'));
    if (voice) utterance.voice = voice;
    utterance.onend = () => { if (active && version === generation) listen(); };
    utterance.onerror = event => {
      if (active && version === generation && !['canceled', 'interrupted'].includes(event.error))
        fallback('Không phát được giọng đọc. Bạn có thể đọc câu hỏi và tiếp tục bằng văn bản.');
    };
    synthesis.speak(utterance);
  }
  function pause() {
    paused = true; speaking = false; generation++; clear(); env.clearTimeout(restartTimer);
    const current = recognition; recognition = null; current?.abort(); synthesis?.cancel();
  }
  function stop() { active = false; pause(); }
  return {
    start() {
      if (!Recognition || !synthesis || !env.SpeechSynthesisUtterance) {
        fallback('Trình duyệt chưa hỗ trợ hội thoại giọng nói. Bạn có thể tiếp tục bằng văn bản.'); return false;
      }
      active = true; paused = false;
      // Start in the user's click handler to request microphone permission once.
      ensureRecognition(); return active;
    },
    present(text) { if (!active) return; transcript = ''; reminded = false; onTranscript(''); say(text); },
    pause, stop,
  };
}
