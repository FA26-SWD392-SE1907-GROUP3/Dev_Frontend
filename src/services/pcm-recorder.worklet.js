class VivaPcmRecorder extends AudioWorkletProcessor {
  constructor() { super(); this.samples = new Int16Array(2400); this.index = 0; this.phase = 0; }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (input) for (const sample of input) {
      this.phase += 24000 / sampleRate;
      if (this.phase >= 1) {
        this.phase -= 1;
        this.samples[this.index++] = Math.round(Math.max(-1, Math.min(1, sample)) * 32767);
        if (this.index === this.samples.length) {
          this.port.postMessage(this.samples.buffer, [this.samples.buffer]);
          this.samples = new Int16Array(2400); this.index = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('viva-pcm-recorder', VivaPcmRecorder);
