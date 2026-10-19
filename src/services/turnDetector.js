// Conservative end-of-turn detection. A thinking pause before speaking never submits an empty answer.
export function createTurnDetector({ silenceMs = 4000, threshold = 0.018, onEnd, onLevel = () => {} }) {
  let voicedMs = 0, quietMs = 0, ended = false;
  return samples => {
    if (ended || !samples.length) return;
    const rms = Math.sqrt(samples.reduce((sum, value) => sum + (value / 32768) ** 2, 0) / samples.length);
    onLevel(Math.min(1, rms * 8));
    const duration = samples.length / 24; // PCM at 24 kHz, in milliseconds.
    if (rms >= threshold) { voicedMs += duration; quietMs = 0; }
    else if (voicedMs >= 350) quietMs += duration;
    if (voicedMs >= 350 && quietMs >= silenceMs) { ended = true; onEnd(); }
  };
}
