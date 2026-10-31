import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { createWebSpeech } from '../services/webSpeech';
import AttemptGrade from './common/AttemptGrade';
import { button, input, Heading, Panel, Notice, State } from './api/parts';

export default function ConversationInterview({ candidateId, attemptId: initialId = '', onBack, onAttemptSaved, onLegacy }) {
  const [attemptId, setAttemptId] = useState(initialId), [session, setSession] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false), [phase, setPhase] = useState('ready');
  const [draft, setDraft] = useState(''), [live, setLive] = useState(''), [partial, setPartial] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [voiceError, setVoiceError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [delivery, setDelivery] = useState(0);
  const mounted = useRef(true), state = useRef(null), voice = useRef(null), running = useRef(false);
  const controller = useRef(null), poll = useRef(null), begin = useRef(null), pending = useRef(null);
  const sendRef = useRef(null), flight = useRef(null), latestText = useRef(''), finishing = useRef(false);
  const prompt = session?.prompt;
  const clockOffset = useRef(0);
  const remaining = prompt?.deadline ? Math.max(0, Date.parse(prompt.deadline) - (now - clockOffset.current)) : null;
  const storageKey = id => `aives-conversation-retry-${id}`;
  function accept(value) {
    if (!mounted.current) return;
    if (state.current && Date.parse(state.current.serverNow) > Date.parse(value.serverNow)) return;
    state.current = value; clockOffset.current = Date.now() - Date.parse(value.serverNow); setSession(value);
  }
  async function refresh(id = attemptId) {
    if (!id || running.current || poll.current) return;
    const abort = new AbortController(); poll.current = abort;
    try {
      const value = await api.interview(id, { signal: abort.signal });
      if (!running.current && !abort.signal.aborted) accept(value);
    } catch (e) { if (mounted.current && !abort.signal.aborted) setError(e.message); }
    finally { if (poll.current === abort) poll.current = null; }
  }
  function beginListening() {
    const current = state.current;
    if (!current?.prompt || current.status !== 'IN_PROGRESS' || finishing.current) return;
    if (begin.current?.id === current.prompt.id) return;
    const promise = api.beginInterviewAnswer(current.attemptId, current.prompt.id).then(accept).catch(e => {
      if (mounted.current) { setError(e.message); voice.current?.pause(); setPhase('blocked'); }
      throw e;
    });
    // Keep the rejection handled even when the user never submits an answer.
    promise.catch(() => {}); begin.current = { id: current.prompt.id, promise };
  }
  function buildVoice() {
    voice.current?.stop();
    voice.current = createWebSpeech({
      onTranscript: text => { latestText.current = text; if (mounted.current) setLive(text); },
      onAnswer: text => sendRef.current?.(text),
      onPhase: value => { if (mounted.current) setPhase(value); },
      onListening: beginListening,
      onFallback: message => {
        if (!mounted.current) return;
        setVoiceError(message); setVoiceEnabled(false); setPhase('text');
        setDraft(value => latestText.current || value); beginListening();
      },
    });
    return voice.current.start();
  }
  async function start() {
    if (running.current) return;
    running.current = true; setBusy(true); setError(''); setVoiceError('');
    const enabled = buildVoice(); setVoiceEnabled(enabled);
    try {
      let id = attemptId;
      if (!id) {
        const result = await api.startAttempt(candidateId); id = result.attemptId;
        if (!mounted.current) return;
        setAttemptId(id); onAttemptSaved?.(id);
      }
      accept(await api.interview(id));
    } catch (e) { if (mounted.current) { setError(e.message); voice.current?.stop(); setVoiceEnabled(false); } }
    finally { running.current = false; if (mounted.current) setBusy(false); }
  }
  async function send(text, retry = null) {
    const current = state.current;
    if (running.current || finishing.current || !current || current.status !== 'IN_PROGRESS') return;
    const saved = retry || { promptId: current.prompt?.id, text: text?.trim() };
    if (!saved.promptId || !saved.text) return;
    running.current = true; setBusy(true); setError(''); setPartial(''); setPhase('thinking');
    voice.current?.pause(); poll.current?.abort();
    pending.current = saved; sessionStorage.setItem(storageKey(current.attemptId), JSON.stringify(saved));
    const abort = new AbortController(); controller.current = abort;
    const operation = (async () => {
      try {
        if (begin.current?.id === saved.promptId) await begin.current.promise;
        const value = await api.streamInterviewAnswer(current.attemptId, saved.promptId, saved.text, {
          signal: abort.signal,
          onEvent: (event, payload) => {
            if (!mounted.current) return;
            if (event === 'saved') {
              saved.acknowledged = true;
              sessionStorage.setItem(storageKey(current.attemptId), JSON.stringify(saved));
            }
            if (event === 'delta') setPartial(value => value + payload.text);
          },
        });
        if (!mounted.current) return;
        pending.current = null; sessionStorage.removeItem(storageKey(current.attemptId));
        sessionStorage.removeItem(`aives-answer-${current.attemptId}-${saved.promptId}`);
        setDraft(''); latestText.current = ''; setLive(''); setPartial(''); accept(value); setDelivery(value => value + 1);
      } catch (e) {
        if (mounted.current && !abort.signal.aborted) {
          setError(e.message || 'Kết nối bị gián đoạn. Hãy thử lại câu trả lời đã giữ.'); setPhase('blocked');
        }
      } finally {
        running.current = false; if (controller.current === abort) controller.current = null;
        if (mounted.current) setBusy(false);
      }
    })();
    flight.current = operation; await operation;
  }
  sendRef.current = send;
  async function resume() {
    if (pending.current) return send(null, pending.current);
    if (running.current || !session?.answerTurnId) return;
    running.current = true; setBusy(true); setError(''); setPartial(''); voice.current?.pause();
    const abort = new AbortController(); controller.current = abort;
    const operation = (async () => {
      try {
        const value = await api.streamInterviewContinue(attemptId, session.answerTurnId, { signal: abort.signal,
          onEvent: (event, payload) => { if (mounted.current && event === 'delta') setPartial(text => text + payload.text); } });
        if (mounted.current) { setPartial(''); accept(value); setDelivery(value => value + 1); }
      } catch (e) { if (mounted.current && !abort.signal.aborted) setError(e.message); }
      finally { running.current = false; if (mounted.current) setBusy(false); }
    })();
    flight.current = operation; await operation;
  }
  async function finish() {
    if (finishing.current) return;
    voice.current?.stop(); setVoiceEnabled(false);
    // Submit captured words before closing; an in-flight answer is already being persisted.
    if (!running.current && (latestText.current.trim() || draft.trim()) && state.current?.prompt)
      await send(latestText.current || draft);
    finishing.current = true; await flight.current;
    if (pending.current && !pending.current.acknowledged) {
      finishing.current = false;
      setError('Chưa xác nhận lưu được câu trả lời. Hãy thử tiếp tục trước khi kết thúc để giữ đủ hội thoại.');
      return;
    }
    setBusy(true); setPhase('thinking');
    try { accept(await api.finishInterview(attemptId)); pending.current = null; sessionStorage.removeItem(storageKey(attemptId)); }
    catch (e) { if (mounted.current) setError(e.message); }
    finally { finishing.current = false; if (mounted.current) setBusy(false); }
  }
  useEffect(() => {
    mounted.current = true;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => { mounted.current = false; clearInterval(timer); voice.current?.stop(); controller.current?.abort(); poll.current?.abort(); };
  }, []);
  useEffect(() => {
    if (!attemptId) return;
    try { pending.current = JSON.parse(sessionStorage.getItem(storageKey(attemptId)) || 'null'); } catch { pending.current = null; }
    refresh(attemptId);
    const timer = setInterval(() => { if (state.current?.status === 'IN_PROGRESS') refresh(attemptId); }, 3000);
    return () => { clearInterval(timer); poll.current?.abort(); };
  }, [attemptId]);
  useEffect(() => {
    if (!prompt) return;
    latestText.current = ''; setLive(''); setPartial(''); begin.current = null;
    setDraft(sessionStorage.getItem(`aives-answer-${attemptId}-${prompt.id}`) || '');
    if (voiceEnabled && !pending.current) voice.current?.present(prompt.text);
    else beginListening();
  }, [prompt?.id, voiceEnabled, delivery]);
  useEffect(() => {
    if (attemptId && prompt) sessionStorage.setItem(`aives-answer-${attemptId}-${prompt.id}`, draft);
  }, [attemptId, prompt?.id, draft]);
  useEffect(() => {
    if (!session || session.status === 'IN_PROGRESS') return;
    voice.current?.stop(); setVoiceEnabled(false); setPhase('finished');
  }, [session?.status]);
  return <section className="space-y-5">
    <Heading title="Phòng phỏng vấn AI" subtitle="Trò chuyện liên tục bằng tiếng Việt." action={<div className="flex gap-2">
      <button className={button} disabled={busy} onClick={() => { voice.current?.stop(); onLegacy?.(); }}>Chuyển sang chế độ dự phòng</button>
      <button className={button} disabled={busy} onClick={onBack}>← Quay lại</button></div>} />
    <Notice>AI nói xong sẽ tự nghe bạn. Ngừng nói khoảng 1,5 giây để chuyển lượt. Bạn có thể nói chen để ngắt giọng AI; nên dùng tai nghe.</Notice>
    <State error={error || session?.error} /><State error={voiceError} />
    {!attemptId && <Panel title="Sẵn sàng vào thi"><button className={button} disabled={busy} onClick={start}>Bắt đầu lượt thi</button></Panel>}
    {attemptId && !session && <p role="status">Đang tải lượt thi...</p>}
    {attemptId && !session && error && <button className={button} onClick={() => refresh()}>Tải lại lượt thi</button>}
    {session && <>
      <div className="flex justify-between gap-3 text-sm"><p>Câu chính: {session.completedQuestions}/{session.questionCount} · Tổng đào sâu: {session.followupsUsed || 0}/{session.maxFollowups}</p><p>Kết thúc ca: {new Date(session.scheduledEnd).toLocaleString('vi-VN')}</p></div>
      {session.status === 'IN_PROGRESS' && <section className="interview-call rounded-2xl bg-slate-950 text-white p-6 space-y-4" aria-label="Cuộc phỏng vấn trực tiếp">
        <p role="status">{busy || session.busy ? 'AI đang suy nghĩ' : ({ ready: 'Sẵn sàng', speaking: 'AI đang nói', listening: 'Đang nghe bạn', text: 'Trả lời bằng văn bản', blocked: 'Cần thử lại', thinking: 'AI đang suy nghĩ' })[phase]}</p>
        {prompt && <><h2 className="font-semibold">{prompt.followupNumber ? `Câu ${prompt.sequenceNo} · Hỏi đào sâu ${prompt.followupNumber}` : `Câu chính ${prompt.sequenceNo}/${session.questionCount}`}</h2><p className="whitespace-pre-wrap text-lg">{prompt.text}</p>
          {remaining !== null && <p role="timer">Thời gian còn lại: {Math.ceil(remaining / 1000)} giây</p>}</>}
        <div className="rounded-lg bg-slate-800 p-4 min-h-24" aria-live="polite"><p>{live || 'Lời nói của bạn sẽ hiện ở đây.'}</p></div>
        {partial && <p className="whitespace-pre-wrap" aria-live="polite">{partial}</p>}
        {!voiceEnabled && <button className={button} disabled={busy} onClick={start}>Tham gia phỏng vấn</button>}
        {voiceEnabled && phase === 'blocked' && <button className={button} disabled={busy} onClick={start}>Thử lại giọng nói</button>}
        {voiceEnabled && <button className={button} disabled={busy} onClick={() => { voice.current?.stop(); setVoiceEnabled(false); setDraft(latestText.current || draft); beginListening(); }}>Chuyển sang gõ chữ</button>}
        <button className={button} onClick={finish} disabled={finishing.current}>Kết thúc</button>
      </section>}
      {session.status === 'IN_PROGRESS' && !voiceEnabled && prompt && <Panel title="Trả lời bằng văn bản"><form onSubmit={e => { e.preventDefault(); send(draft); }} className="space-y-3">
        <label className="block">Câu trả lời<textarea className={input} rows={4} maxLength={12000} value={draft} disabled={busy} onChange={e => setDraft(e.target.value)} /></label>
        <button className={button} disabled={busy || !draft.trim()}>Gửi câu trả lời</button></form></Panel>}
      {(pending.current || session.needsContinuation) && session.status === 'IN_PROGRESS' && <button className={button} disabled={busy || session.busy} onClick={resume}>Thử tiếp tục câu trả lời đã lưu</button>}
      {session.status === 'COMPLETED' && <><Notice>Đã hoàn thành lượt thi. AI chấm toàn bài theo rubric của kỳ thi.</Notice><AttemptGrade attemptId={attemptId} /></>}
      {session.status === 'ABORTED' && <Notice>Lượt thi đã dừng. Hội thoại đã nộp vẫn được lưu.</Notice>}
      <Panel title="Hội thoại đã lưu"><div className="space-y-3">{session.turns.map(turn => <article key={turn.id} className={`rounded-lg border border-appborder p-3 ${turn.speaker === 'AI' ? 'bg-primary-light' : ''}`}>
        <p className="text-sm font-semibold">{turn.speaker === 'AI' ? 'Giám khảo AI' : 'Bạn'} · Câu {turn.sequenceNo}</p><p className="whitespace-pre-wrap">{turn.text}</p>
      </article>)}</div></Panel>
    </>}
  </section>;
}
