import { api, interviewSocketUrl } from './api';
import { createTurnDetector } from './turnDetector';

// A complete local recording is retained even when live captions disconnect.
export function createVoiceCapture(stream, attemptId, promptId, { onTranscript, onLiveStatus, onLiveError, onTurnEnd, onLevel, keepStream = false }) {
  const preferred = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type));
  const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);
  const chunks = [];
  let socket, context, source, node, gain, closed = false, stopping = null, ready = false;
  const items = new Map();
  const detect = onTurnEnd ? createTurnDetector({ onEnd: onTurnEnd, onLevel }) : null;
  const complete = new Promise((resolve, reject) => {
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => reject(new Error('Không ghi được âm thanh. Hãy kiểm tra micro.'));
    recorder.onstop = () => {
      const type = recorder.mimeType || preferred || 'audio/webm';
      const extension = type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : 'webm';
      resolve(new File(chunks, `answer.${extension}`, { type }));
    };
  });
  // A recording error can arrive before the user presses Stop.
  complete.catch(() => {});
  recorder.start(250);
  onLiveStatus('Đang kết nối nhận dạng trực tiếp...');
  (async () => {
    const connectLive = async () => {
      const ticket = await api.interviewLiveTicket(attemptId, promptId);
      if (closed) return;
      socket = new WebSocket(interviewSocketUrl(ticket.ticket));
      socket.binaryType = 'arraybuffer';
      socket.onmessage = event => {
        if (closed) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ready') { ready = true; onLiveStatus('Đang nhận dạng giọng nói trực tiếp'); }
          else if (data.type === 'delta' || data.type === 'final') {
            const previous = items.get(data.itemId) || '';
            items.set(data.itemId, data.type === 'final' ? data.text : previous + data.text);
            onTranscript([...items.values()].join(' '));
          } else if (data.type === 'error') onLiveError(data.message);
        } catch { onLiveError('Không đọc được nhận dạng trực tiếp. Bản ghi vẫn được giữ để nộp.'); }
      };
      socket.onerror = () => { if (!closed) onLiveError('Kết nối nhận dạng trực tiếp bị gián đoạn. Bản ghi vẫn được giữ để nộp.'); };
      socket.onclose = () => { if (!closed) onLiveStatus('Đã ngắt nhận dạng trực tiếp; vẫn đang ghi âm'); };
    };
    // Capturing and turn detection continue even if live captions are unavailable.
    connectLive().catch(error => { if (!closed) onLiveError(error.message || 'Nhận dạng trực tiếp bị gián đoạn; bản ghi vẫn được giữ.'); });
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass || !window.AudioWorkletNode) throw new Error('Trình duyệt không hỗ trợ nhận dạng trực tiếp. Bản ghi vẫn được giữ để nộp.');
    context = new AudioContextClass({ sampleRate: 24000 });
    await context.audioWorklet.addModule(new URL('./pcm-recorder.worklet.js', import.meta.url));
    if (closed) { await context.close(); return; }
    source = context.createMediaStreamSource(stream);
    node = new AudioWorkletNode(context, 'viva-pcm-recorder'); gain = context.createGain(); gain.gain.value = 0;
    node.port.onmessage = event => {
      if (closed) return;
      detect?.(new Int16Array(event.data));
      if (ready && socket?.readyState === WebSocket.OPEN && socket.bufferedAmount < 96000) socket.send(event.data);
    };
    source.connect(node); node.connect(gain); gain.connect(context.destination); await context.resume();
  })().catch(error => { socket?.close(); if (!closed) onLiveError(error.message || 'Nhận dạng trực tiếp chưa sẵn sàng. Bản ghi vẫn được giữ để nộp.'); });

  async function stop() {
    if (stopping) return stopping;
    closed = true;
    if (recorder.state !== 'inactive') recorder.stop();
    if (!keepStream) stream.getTracks().forEach(track => track.stop());
    source?.disconnect(); node?.disconnect(); gain?.disconnect();
    if (context && context.state !== 'closed') context.close().catch(() => {});
    if (socket?.readyState === WebSocket.OPEN) { socket.send(JSON.stringify({ type: 'commit' })); socket.close(); }
    else socket?.close();
    stopping = complete;
    return stopping;
  }
  return { stop, cancel: () => { stop().catch(() => {}); } };
}
