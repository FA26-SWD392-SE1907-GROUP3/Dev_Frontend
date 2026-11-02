// Browser-only audio. The application sends text to Spring Boot, never recordings.
export function createWebSpeech({ onTranscript = () => {}, onAnswer = () => {}, onPhase = () => {},
  onListening = () => {}, onFallback = () => {}, onInterruption = () => {},
  env = globalThis, silenceMs = 1500, reminderMs = 8000 }) {
  const Recognition = env.SpeechRecognition || env.webkitSpeechRecognition;
  const synthesis = env.speechSynthesis;
  let active = false, paused = true, speaking = false, muted = false, transcript = '', recognition = null;
  let silenceTimer, reminderTimer, restartTimer, echoTimer, generation = 0, reminded = false;
  let protectedSpeech = false, aiText = '', echoWindow = false;
  const words = value => value.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi,'d')
    .toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  function isEcho(text) {
    const candidate = words(text), source = words(aiText);
    if (!candidate.length) return true;
    if (candidate.length === 1 && speaking) return true;
    const phrase = candidate.join(' '), original = source.join(' ');
    if (candidate.length >= 2 && original.includes(phrase)) return true;
    if (candidate.length < 4) return false;
    // Compare short contiguous windows, not a bag of topic words shared by a real answer.
    for (let offset=0;offset<source.length;offset++) {
      let matching=0;
      for(let i=0;i<candidate.length;i++)if(candidate[i]===source[offset+i])matching++;
      if(matching/candidate.length>=.85)return true;
    }
    return false;
  }
  const clear = () => { env.clearTimeout(silenceTimer); env.clearTimeout(reminderTimer); silenceTimer = null; reminderTimer = null; };
  function fallback(message) {
    stop(); onFallback(message);
  }
  function arm() {
    env.clearTimeout(silenceTimer);
    if (!active || paused || speaking || muted) return;
    if (transcript.trim()) { env.clearTimeout(reminderTimer); reminderTimer = null; silenceTimer = env.setTimeout(() => {
      const text = transcript.trim();
      if (!text || paused || speaking || muted || !active) return;
      pause(); transcript = ''; onAnswer(text);
    }, silenceMs); }
    else if (!reminded && !reminderTimer) reminderTimer = env.setTimeout(() => {
      if (!active || paused || transcript.trim()) return;
      reminded = true; const reminder='Bạn cứ bình tĩnh. Bạn có thể trình bày điều mình hiểu về câu hỏi vừa rồi.';aiText=reminder;say(reminder);
    }, reminderMs);
  }
  function listen() {
    if (!active) return;
    speaking = false; paused = false; onPhase('listening'); onListening(); arm(); ensureRecognition();
  }
  function ensureRecognition(warmup = false) {
    if (!active || (paused && !warmup) || muted || recognition || protectedSpeech) return;
    const current = new Recognition(), prefix = transcript;
    recognition = current;
    current.lang = 'vi-VN'; current.continuous = true; current.interimResults = true;
    current.onspeechstart = () => {
      if (!active || paused || muted || recognition !== current) return;
      // Speech-start also fires for loudspeakers/noise. Interrupt only on actual non-echo text.
      env.clearTimeout(reminderTimer); env.clearTimeout(silenceTimer);
      reminderTimer = null;
    };
    current.onresult = event => {
      if (!active || paused || muted || recognition !== current) return;
      const parts = [];
      for (let i = 0; i < event.results.length; i++) parts.push(event.results[i][0].transcript);
      const recognized = parts.join(' ').trim();
      if (protectedSpeech) return;
      if ((speaking || echoWindow) && isEcho(recognized)) {
        // Discard cumulative results containing the AI's voice before the next student utterance.
        recognition=null;current.abort();env.clearTimeout(restartTimer);
        restartTimer=env.setTimeout(ensureRecognition,150);return;
      }
      transcript = `${prefix} ${recognized}`.trim().slice(0, 12000);
      if (speaking && transcript) {
        generation++; speaking = false; echoWindow=false; synthesis.cancel(); onInterruption(); listen();
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
      if (active && !paused && !muted) { arm(); restartTimer = env.setTimeout(ensureRecognition, 250); }
    };
    try { current.start(); } catch { fallback('Không mở được nhận dạng giọng nói. Hãy tiếp tục bằng văn bản.'); }
  }
  function say(text, closing = false, next = null) {
    if (!active) return;
    const version = ++generation;
    synthesis.cancel(); clear();
    paused = false; speaking = true; protectedSpeech=closing||!!next;echoWindow=true;
    env.clearTimeout(echoTimer);
    if(protectedSpeech){const previous=recognition;recognition=null;previous?.abort();}
    onPhase('speaking'); if(!protectedSpeech)ensureRecognition();
    const utterance = new env.SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN'; utterance.rate = 1;
    const voice = synthesis.getVoices().find(v => v.lang?.toLowerCase().startsWith('vi'));
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (!active || version !== generation) return;
      protectedSpeech=false;
      if(next){next();return;}
      if(closing){stop();onPhase('finished');return;}
      echoTimer=env.setTimeout(()=>{echoWindow=false;},600);
      listen();
    };
    utterance.onerror = event => {
      if (active && version === generation && !['canceled', 'interrupted'].includes(event.error))
        fallback('Không phát được giọng đọc. Bạn có thể đọc câu hỏi và tiếp tục bằng văn bản.');
    };
    try { synthesis.speak(utterance); } catch { fallback('Không phát được giọng đọc. Em có thể đọc câu hỏi và tiếp tục bằng văn bản.'); }
  }
  function pause() {
    paused = true; speaking = false; protectedSpeech=false;echoWindow=false;generation++; clear(); env.clearTimeout(restartTimer);env.clearTimeout(echoTimer);
    const current = recognition; recognition = null; current?.abort(); synthesis?.cancel();
  }
  function stop() { active = false; pause(); }
  return {
    start() {
      if (!Recognition || !synthesis || !env.SpeechSynthesisUtterance) {
        fallback('Trình duyệt chưa hỗ trợ hội thoại giọng nói. Bạn có thể tiếp tục bằng văn bản.'); return false;
      }
      active = true; paused = true;
      // Request permission in the click handler, but ignore speech before the first question.
      ensureRecognition(true); return active;
    },
    present(text, { introduction = '', preserveTranscript = false } = {}) {
      if (!active) return;
      // Each browser recognition instance owns its cumulative results. A new AI turn
      // must not re-use the previous turn's result list and submit it a second time.
      const previous=recognition;recognition=null;previous?.abort();
      if(!text?.trim()){fallback('Chưa tải được câu hỏi. Em hãy tải lại phòng thi.');return;}
      if(!preserveTranscript){transcript='';onTranscript('');}
      reminded=false;aiText=introduction+' '+text;
      if(introduction.trim())say(introduction,false,()=>say(text));else say(text);
    },
    closeWith(text) {
      const previous=recognition;recognition=null;previous?.abort();say(text,true);
    },
    setMuted(value) {
      muted=!!value;
      if(muted){clear();env.clearTimeout(restartTimer);const previous=recognition;recognition=null;previous?.abort();}
      else if(active&&!paused){ensureRecognition();if(!speaking){onPhase('listening');onListening();arm();}}
    },
    pause, stop,
  };
}
