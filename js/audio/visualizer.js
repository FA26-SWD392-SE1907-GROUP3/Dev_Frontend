// AIVES Audio Visualizer & Diagnostics Utility
export const AudioEngine = {
  audioCtx: null,
  animationId: null,
  isRecording: false,

  initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  },

  // Generates a pleasant test chime for speaker testing
  playSpeakerTestTone(onFinish) {
    try {
      this.initAudioContext();
      if (!this.audioCtx) {
        if (onFinish) onFinish();
        return;
      }

      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.15); // E5

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc1.stop(now + 0.65);

      setTimeout(() => {
        if (onFinish) onFinish();
      }, 700);
    } catch (e) {
      console.warn('Audio tone error:', e);
      if (onFinish) onFinish();
    }
  },

  // Start animated waveform visualization on canvas
  startWaveform(canvas) {
    if (!canvas) return;
    this.isRecording = true;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio || 600;
    const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio || 120;
    
    let phase = 0;
    const numBars = 48;
    const barWidth = width / numBars - 4;

    const render = () => {
      if (!this.isRecording) {
        // Draw resting flat line
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, height / 2 - 1, width, 2);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      phase += 0.08;

      for (let i = 0; i < numBars; i++) {
        // Create organic voice-like wave distribution with multiple sine harmonics
        const norm = i / numBars;
        const bellCurve = Math.sin(norm * Math.PI); // Highest in center
        const wave = Math.sin(norm * 14 + phase) * 0.4 + Math.cos(norm * 8 - phase * 1.5) * 0.3 + 0.3;
        const barHeight = Math.max(6, wave * bellCurve * (height * 0.75));

        const x = i * (barWidth + 4);
        const y = (height - barHeight) / 2;

        // Gradient from blue to indigo
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#6366f1');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, 3);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      this.animationId = requestAnimationFrame(render);
    };

    render();
  },

  stopWaveform(canvas) {
    this.isRecording = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, canvas.height / 2 - 1, canvas.width, 2);
    }
  }
};
