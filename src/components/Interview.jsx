import React, { useEffect, useRef, useState } from 'react';
import { request, download } from '../services/api';
const buttonClass = 'px-3 py-2 rounded-lg border border-appborder disabled:opacity-40';
export default function Interview({ scheduleId, onBack, readOnly = false }) {
  const [state, setState] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState(''), [recording, setRecording] = useState(false), [clock, setClock] = useState(Date.now());
  const recorder = useRef(null), recognition = useRef(null), stream = useRef(null), recordingBlob = useRef(null), autoAdvanced = useRef(null), submitRef = useRef(null);
  const prefix = `/interviews/${scheduleId}`;
  const active = state?.logs?.at(-1), completed = state?.schedule?.status === 'COMPLETED', inProgress = state?.schedule?.status === 'IN_PROGRESS';
  const offset = state ? new Date(state.serverTime).getTime() - (state.receivedAt || Date.now()) : 0;
  const slotEnd = state ? new Date(state.schedule.allocatedEndTime).getTime() : Infinity;
  const deadline = active ? Math.min(new Date(active.askedAt).getTime() + state.answerTimeLimitSeconds * 1000, slotEnd) : Infinity;
  const remaining = Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - clock - offset) / 1000)) : 0;
  function accept(result) { setState({ ...result, receivedAt: Date.now() }); }
  async function run(action) { setBusy(true); setError(''); try { const result = await action(); if (result) accept(result); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  function releaseMic() {
    try { recognition.current?.stop(); } catch {}
    const stopping = recorder.current?.state === 'recording';
    if (stopping) recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
    if (!stopping) setRecording(false);
  }
  useEffect(() => {
    const abort = new AbortController();
    request(prefix, { signal: abort.signal }).then(accept).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => { abort.abort(); clearInterval(timer); releaseMic(); window.speechSynthesis?.cancel(); };
  }, [scheduleId]);
  useEffect(() => {
    setTranscript(active?.studentAnswerTranscript || ''); recordingBlob.current = null; autoAdvanced.current = null;
    if (active && !readOnly && inProgress && !active.answeredAt && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(active.questionContent); utterance.lang = 'vi-VN'; window.speechSynthesis.speak(utterance);
    }
    return () => { releaseMic(); window.speechSynthesis?.cancel(); };
  }, [active?.logId, readOnly]);
  useEffect(() => {
    if (!readOnly && inProgress && active && remaining === 0 && !busy && autoAdvanced.current !== active.logId) {
      autoAdvanced.current = active.logId; releaseMic(); run(() => request(`${prefix}/next?afterLogId=${active.logId}`, { method: 'POST' }));
    }
  }, [remaining, inProgress, active?.logId, busy]);
  async function startRecording() {
    setError('');
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setError('Trình duyệt chưa hỗ trợ nhận dạng giọng nói. Dùng Chrome/Edge hoặc nhập transcript trực tiếp.'); return; }
    try {
      window.speechSynthesis?.cancel();
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('Trình duyệt chưa hỗ trợ ghi âm.');
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      let type = ['audio/webm', 'audio/ogg', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported(t));
      if (!type) throw new Error('Không tìm thấy định dạng ghi âm được hỗ trợ.');
      const media = new MediaRecorder(stream.current, { mimeType: type }); const chunks = [];
      media.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      media.onstop = () => { recordingBlob.current = new Blob(chunks, { type }); setRecording(false); };
      recorder.current = media; media.start();
      const speech = new Recognition(); speech.lang = 'vi-VN'; speech.continuous = true; speech.interimResults = true;
      const before = transcript;
      speech.onresult = event => { const text = Array.from(event.results).map(r => r[0].transcript).join(' '); setTranscript(`${before} ${text}`.trim()); };
      speech.onerror = event => { setError(`Nhận dạng giọng nói thất bại: ${event.error}. Bạn có thể sửa transcript trước khi gửi.`); releaseMic(); };
      speech.onend = () => { releaseMic(); };
      recognition.current = speech; speech.start(); setRecording(true);
    } catch (e) { releaseMic(); setError(e.message); }
  }
  async function submit() {
    if (!transcript.trim()) { setError('Chưa có transcript để gửi.'); return; }
    await run(async () => {
      if (recordingBlob.current?.size) {
        const blob = recordingBlob.current; const form = new FormData(); form.append('file', blob, 'answer');
        await request(`/logs/${active.logId}/audio`, { method: 'POST', body: form });
      }
      return request(`${prefix}/answer`, { method: 'POST', body: { logId: active.logId, transcript } });
    });
  }
  submitRef.current = submit;
  return <section className="space-y-5">
    <div className="flex gap-4 justify-between"><h1 className="text-2xl font-bold">{state?.schedule?.examName || 'Phòng thi vấn đáp'}</h1><button className={buttonClass} disabled={busy} onClick={onBack}>Quay lại</button></div>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {!state ? <button className={buttonClass} disabled={busy} onClick={() => run(() => request(prefix))}>Tải lại phòng thi</button> : <>
      <p>{state.schedule.studentName} · {state.schedule.status}</p>
      {!readOnly && state.schedule.status === 'NOT_STARTED' && <button className="p-3 rounded-lg bg-primary text-white disabled:opacity-40" disabled={busy} onClick={() => run(() => request(`${prefix}/start`, { method: 'POST' }))}>Bắt đầu lượt thi</button>}
      {!readOnly && inProgress && active && <article className="bg-surface p-6 rounded-xl border border-appborder space-y-4">
        <div className="flex justify-between"><strong>Câu {active.sequenceNumber} · {active.questionType === 'MAIN' ? 'Câu chính' : 'Hỏi đào sâu'}</strong><span role="timer">{remaining} giây</span></div>
        <p className="text-lg">{active.questionContent}</p>
        <div className="flex flex-wrap gap-3"><button className={buttonClass} onClick={() => {
          if (!window.speechSynthesis) { setError('Trình duyệt không hỗ trợ đọc giọng nói.'); return; }
          window.speechSynthesis.cancel(); const utter = new SpeechSynthesisUtterance(active.questionContent); utter.lang = 'vi-VN'; window.speechSynthesis.speak(utter);
        }}>Đọc câu hỏi</button><button className={buttonClass} disabled={busy || !!active.answeredAt || remaining === 0} onClick={recording ? releaseMic : startRecording}>{recording ? 'Dừng ghi âm' : 'Trả lời bằng giọng nói'}</button></div>
        <label className="block">Transcript (có thể sửa trước khi gửi)<textarea rows={6} className="w-full bg-canvas border border-appborder rounded-lg p-3 mt-2" disabled={!!active.answeredAt || remaining === 0 || busy} value={transcript} onChange={e => setTranscript(e.target.value)} /></label>
        <div className="flex gap-3"><button className="p-3 bg-primary text-white rounded-lg disabled:opacity-40" disabled={busy || recording || !!active.answeredAt || remaining === 0} onClick={submit}>Gửi câu trả lời</button><button className={buttonClass} disabled={busy || recording || (!active.answeredAt && remaining > 0)} onClick={() => run(() => request(`${prefix}/next?afterLogId=${active.logId}`, { method: 'POST' }))}>{busy ? 'Đang xử lý...' : 'Tiếp tục / hỏi đào sâu'}</button></div>
        <p className="text-sm text-mutedtext">Thời gian được kiểm tra tại máy chủ. Câu trả lời đã gửi sẽ được giữ lại nếu dịch vụ AI lỗi; nhấn Tiếp tục để thử lại.</p>
      </article>}
      {completed && <p role="status" className="p-4 bg-surface border border-appborder rounded-lg">Lượt thi đã hoàn thành. Transcript được lưu để giảng viên xem lại.</p>}
      {(readOnly || completed) && <div className="space-y-4">{state.logs.length === 0 ? <p>Chưa có câu hỏi trong lượt thi.</p> : state.logs.map(log => <article key={log.logId} className="p-4 rounded-xl bg-surface border border-appborder space-y-2"><strong>{log.sequenceNumber}. {log.questionContent}</strong><p className="whitespace-pre-wrap">{log.studentAnswerTranscript || (log.answeredAt ? 'Không có câu trả lời trước hạn.' : 'Chưa trả lời.')}</p><p className="text-xs text-mutedtext">{log.questionType} · {log.timeTakenSeconds ?? '—'} giây</p>{log.hasAnswerAudio && <button className={buttonClass} onClick={async () => { try { await download(`/logs/${log.logId}/audio`, `answer-${log.logId}.webm`); } catch (e) { setError(e.message); } }}>Tải ghi âm</button>}</article>)}</div>}
      <button className={buttonClass} disabled={busy} onClick={() => run(() => request(prefix))}>Cập nhật trạng thái</button>
    </>}
  </section>;
}
