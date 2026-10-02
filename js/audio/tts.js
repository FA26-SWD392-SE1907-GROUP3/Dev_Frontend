// AIVES Web Speech Text-to-Speech Handler
export const TTS = {
  isSpeaking: false,
  currentUtterance: null,

  speak(text, onStart, onEnd) {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser. Simulating audio playback.');
      this.isSpeaking = true;
      if (onStart) onStart();
      setTimeout(() => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      }, 4000);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Pick natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('David')));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error or cancelled:', e);
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);

    // Fallback safety timeout in case onend never fires
    const estimatedDuration = Math.max(3000, (text.split(' ').length / 2.5) * 1000);
    setTimeout(() => {
      if (this.isSpeaking) {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      }
    }, estimatedDuration + 1000);
  },

  stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }
};
