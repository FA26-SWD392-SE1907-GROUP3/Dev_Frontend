import AttemptGrade from './common/AttemptGrade';
import ConversationInterview from './ConversationInterview';
import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { createVoiceCapture } from '../services/voiceCapture';
import { button, input, Heading, Panel, Notice, State } from './api/parts';

export default function InterviewScreen(props) {
  const [legacy, setLegacy] = useState(() => sessionStorage.getItem('aives-interview-mode') === 'manual');
  return legacy
    ? <Interview {...props} onVoice={() => { sessionStorage.setItem('aives-interview-mode', 'call'); setLegacy(false); }} />
    : <ConversationInterview {...props} onLegacy={() => { sessionStorage.setItem('aives-interview-mode', 'manual'); setLegacy(true); }} />;
}

function Interview({ candidateId, attemptId: initialAttemptId = '', onBack, onAttemptSaved, onVoice }) {
  const [attemptId, setAttemptId] = useState(initialAttemptId);
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [working, setWorking] = useState('');
  const [draft, setDraft] = useState('');
  const [recording, setRecording] = useState(false);
  const [pendingAudio, setPendingAudio] = useState(null);
  const [liveText, setLiveText] = useState('');
  const [liveStatus, setLiveStatus] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [speechUrl, setSpeechUrl] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [autoRead, setAutoRead] = useState(true);
  const [callMode, setCallMode] = useState(() => sessionStorage.getItem('aives-interview-mode') !== 'manual');
  const [connected, setConnected] = useState(false);
  const [callPhase, setCallPhase] = useState('ready');
  const [micLevel, setMicLevel] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [offset, setOffset] = useState(0);
  const capture = useRef(null), player = useRef(null), alive = useRef(true), operating = useRef(false), revision = useRef(0), current = useRef(null);
  const refreshRequest = useRef(null);
  const expiredPrompt = useRef('');
  const speechObject = useRef(''), savedPlayer = useRef(null), playRequested = useRef(false);
  const callStream = useRef(null), callActive = useRef(false), modeRef = useRef(callMode), speechPrompt = useRef('');
  const prompt = session?.prompt;
  const draftKey = attemptId && prompt ? `aives-answer-${attemptId}-${prompt.id}` : '';
  const remaining = prompt?.deadline ? Math.max(0, Date.parse(prompt.deadline) - (now - offset)) : null;
  const busy = !!working || session?.busy;

  function accept(state) {
    if (!alive.current) return;
    if (current.current?.attemptId === state.attemptId && Date.parse(current.current.serverNow) > Date.parse(state.serverNow)) return;
    current.current = state;
    setSession(state);
    setOffset(Date.now() - Date.parse(state.serverNow));
  }
  async function refresh(id = attemptId) {
    if (!id || operating.current || refreshRequest.current) return;
    const controller = new AbortController();
    refreshRequest.current = controller;
    const expected = revision.current;
    try {
      const state = await api.interview(id, { signal: controller.signal });
      if (alive.current && !controller.signal.aborted && expected === revision.current) { accept(state); setError(''); }
    } catch (e) {
      if (alive.current && !controller.signal.aborted && expected === revision.current) setError(e.message);
    } finally {
      if (refreshRequest.current === controller) refreshRequest.current = null;
    }
  }
  async function run(label, operation) {
    if (operating.current) return null;
    operating.current = true; revision.current += 1; setWorking(label); setError('');
    try { const state = await operation(); accept(state); return state; }
    catch (e) { if (alive.current) setError(e.message); return null; }
    finally { operating.current = false; if (alive.current) setWorking(''); }
  }
  function stopSavedAudio() {
    if (savedPlayer.current) { savedPlayer.current.sound.pause(); URL.revokeObjectURL(savedPlayer.current.url); savedPlayer.current = null; }
  }
  function replaceSpeech(blob) {
    if (speechObject.current) URL.revokeObjectURL(speechObject.current);
    speechObject.current = blob ? URL.createObjectURL(blob) : ''; setSpeechUrl(speechObject.current);
  }
  useEffect(() => {
    alive.current = true;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => { alive.current = false; callActive.current = false; clearInterval(timer); capture.current?.cancel(); capture.current = null; callStream.current?.getTracks().forEach(track => track.stop()); stopSavedAudio(); };
  }, []);
  useEffect(() => {
    if (!attemptId) return;
    refresh(attemptId);
    const timer = setInterval(() => { if (!operating.current && current.current?.status === 'IN_PROGRESS') refresh(attemptId); }, 3000);
    return () => {
      clearInterval(timer);
      refreshRequest.current?.abort();
      refreshRequest.current = null;
    };
  }, [attemptId]);
  useEffect(() => {
    capture.current?.cancel(); capture.current = null; setRecording(false); setPendingAudio(null); setLiveText(''); setLiveStatus(''); setVoiceError(''); expiredPrompt.current = '';
    setDraft(draftKey ? sessionStorage.getItem(draftKey) || '' : '');
  }, [prompt?.id]);
  useEffect(() => { if (draftKey) sessionStorage.setItem(draftKey, draft); }, [draftKey, draft]);
  useEffect(() => {
    if (!pendingAudio) { setRecordingUrl(''); return; }
    const url = URL.createObjectURL(pendingAudio); setRecordingUrl(url); return () => URL.revokeObjectURL(url);
  }, [pendingAudio]);
  useEffect(() => {
    let live = true;
    replaceSpeech(null); stopSavedAudio();
    if (attemptId && prompt && autoRead && session?.aiConfigured && (!callMode || connected)) {
      if (callMode) setCallPhase('preparing');
      api.interviewSpeech(attemptId, prompt.id).then(blob => {
        if (live) { speechPrompt.current = prompt.id; replaceSpeech(blob); }
      }).catch(e => { if (live) { setVoiceError(e.message); setCallPhase('blocked'); } });
    }
    return () => { live = false; player.current?.pause(); if (speechObject.current) { URL.revokeObjectURL(speechObject.current); speechObject.current = ''; } };
  }, [attemptId, prompt?.id, autoRead, callMode, connected]);
  useEffect(() => {
    if (speechUrl && (autoRead || playRequested.current)) {
      playRequested.current = false;
      player.current?.play().then(() => { if (modeRef.current) setCallPhase('speaking'); }).catch(() => {
        if (modeRef.current) { setCallPhase('blocked'); setVoiceError('Trình duyệt chưa cho phát giọng nói. Bấm Nghe câu hỏi để tiếp tục cuộc phỏng vấn.'); }
      });
    }
  }, [speechUrl]);
  useEffect(() => {
    if (session && session.status !== 'IN_PROGRESS') {
      callActive.current = false; setConnected(false); setCallPhase('finished');
      player.current?.pause();
      capture.current?.cancel(); capture.current = null; setRecording(false);
      callStream.current?.getTracks().forEach(track => track.stop()); callStream.current = null;
    }
  }, [session?.status]);
  useEffect(() => {
    if (!prompt?.deadline || busy || expiredPrompt.current === prompt.id || remaining === null) return;
    // Stop a little before the deadline to allow the recorded file to reach the server.
    if (remaining <= 2000 && (recording || pendingAudio || draft.trim())) {
      expiredPrompt.current = prompt.id;
      if (recording) stopRecording(true);
      else if (pendingAudio) submitAudio(pendingAudio);
      else submitText();
    } else if (remaining === 0) {
      expiredPrompt.current = prompt.id;
      run('Đang chuyển câu...', () => api.timeoutInterview(attemptId, prompt.id));
    }
  }, [remaining, busy, recording, pendingAudio, draft, prompt?.id]);

  async function start() {
    if (operating.current) return;
    operating.current = true; setWorking('Đang bắt đầu...'); setError('');
    try {
      const result = await api.startAttempt(candidateId);
      if (alive.current) { setAttemptId(result.attemptId); onAttemptSaved?.(result.attemptId); }
      return true;
    } catch (e) { if (alive.current) setError(e.message); return false; }
    finally { operating.current = false; if (alive.current) setWorking(''); }
  }
  async function joinCall() {
    if (operating.current) return;
    setVoiceError(''); setCallPhase('connecting');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Micro cần HTTPS hoặc localhost. Hãy kiểm tra trình duyệt hoặc chuyển sang trả lời bằng văn bản.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (!alive.current) { stream.getTracks().forEach(track => track.stop()); return; }
      callStream.current?.getTracks().forEach(track => track.stop()); callStream.current = stream;
      callActive.current = true; setConnected(true); setAutoRead(true);
      if (!attemptId && !await start()) {
        callActive.current = false; setConnected(false); stream.getTracks().forEach(track => track.stop()); setCallPhase('blocked'); return;
      }
      setCallPhase('preparing');
    } catch (e) {
      setVoiceError(e.name === 'NotAllowedError' ? 'Hãy cấp quyền micro để tham gia phỏng vấn bằng giọng nói.' : e.message);
      setCallPhase('blocked');
    }
  }
  function switchMode() {
    if (!callMode && onVoice) { onVoice(); return; }
    const next = !callMode; modeRef.current = next; setCallMode(next);
    sessionStorage.setItem('aives-interview-mode',next ? 'call' : 'manual');
    callActive.current = false; setConnected(false); player.current?.pause();
    capture.current?.cancel(); capture.current = null; setRecording(false);
    callStream.current?.getTracks().forEach(track => track.stop()); callStream.current = null;
    setCallPhase('ready');
  }
  function speechEnded() {
    if (modeRef.current && callActive.current && speechPrompt.current === current.current?.prompt?.id) startRecording();
  }
  async function beginText() {
    if (prompt) await run('Đang bắt đầu thời gian trả lời...', () => api.beginInterviewAnswer(attemptId, prompt.id));
  }
  async function startRecording() {
    if (!prompt || operating.current || recording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setVoiceError('Trình duyệt không hỗ trợ micro. Dùng HTTPS hoặc localhost và thử Chrome/Edge, hoặc nhập văn bản.'); return; }
    operating.current = true; setWorking('Đang mở micro...'); setVoiceError(''); setLiveText('');
    const expectedPrompt = prompt.id;
    let stream;
    try {
      stream = modeRef.current && callStream.current?.getAudioTracks().some(track => track.readyState === 'live')
        ? callStream.current
        : await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (!alive.current || current.current?.prompt?.id !== expectedPrompt) { stream.getTracks().forEach(track => track.stop()); return; }
      player.current?.pause(); stopSavedAudio();
      const updated = await api.beginInterviewAnswer(attemptId, expectedPrompt); revision.current += 1; accept(updated);
      if (!updated.prompt || updated.prompt.id !== expectedPrompt) throw new Error('Câu hỏi đã thay đổi. Hãy tải lại lượt thi.');
      capture.current = createVoiceCapture(stream, attemptId, expectedPrompt, {
        onTranscript: text => { if (alive.current) setLiveText(text); },
        onLiveStatus: text => { if (alive.current) setLiveStatus(text); },
        onLiveError: text => { if (alive.current) setVoiceError(text); },
        keepStream: modeRef.current,
        onLevel: level => { if (alive.current) setMicLevel(level); },
        onTurnEnd: modeRef.current ? () => {
          if (callActive.current && current.current?.prompt?.id === expectedPrompt) stopRecording(true);
        } : undefined,
      });
      setPendingAudio(null); setRecording(true); setCallPhase('listening');
    } catch (e) {
      stream?.getTracks().forEach(track => track.stop());
      if (alive.current) { setVoiceError(e.name === 'NotAllowedError' ? 'Bạn chưa cho phép dùng micro. Hãy cấp quyền micro hoặc nhập câu trả lời.' : e.message); setCallPhase('blocked'); }
    } finally { operating.current = false; if (alive.current) setWorking(''); }
  }
  async function stopRecording(submit = false) {
    const controller = capture.current; capture.current = null;
    if (!controller) return;
    setRecording(false);
    try {
      const file = await controller.stop();
      if (!alive.current) return;
      setPendingAudio(file); setLiveStatus('Đã dừng ghi âm. Bản ghi sẽ được nhận dạng lại trên máy chủ khi nộp.');
      if (submit) await submitAudio(file);
    } catch (e) { if (alive.current) setVoiceError(e.message); }
  }
  async function submitAudio(file = pendingAudio) {
    if (!file || !prompt) return;
    setCallPhase('thinking');
    const state = await run('Đang nhận dạng và xử lý câu trả lời...', () => api.interviewAudioAnswer(attemptId, prompt.id, file));
    if (state && (state.prompt?.id !== prompt.id || state.needsContinuation || state.busy)) { setPendingAudio(null); sessionStorage.removeItem(draftKey); }
    if (!state) { setCallPhase('blocked'); refresh(); }
  }
  async function submitText(event) {
    event?.preventDefault();
    if (!draft.trim() || !prompt) return;
    const state = await run('AI đang phân tích câu trả lời...', () => api.interviewAnswer(attemptId, prompt.id, draft.trim()));
    if (state) { setDraft(''); sessionStorage.removeItem(draftKey); }
    else refresh();
  }
  async function playSpeech() {
    if (!prompt) return;
    setVoiceError('');
    try {
      if (speechUrl) { await player.current?.play(); if (modeRef.current) setCallPhase('speaking'); }
      else { const expected = prompt.id; const blob = await api.interviewSpeech(attemptId, expected); if (alive.current && current.current?.prompt?.id === expected) { playRequested.current = true; replaceSpeech(blob); } }
    } catch (e) { setVoiceError(e.message); }
  }
  async function playSaved(turnId) {
    try {
      stopSavedAudio(); player.current?.pause(); const blob = await api.interviewAudio(attemptId, turnId); if (!alive.current) return;
      const url = URL.createObjectURL(blob); const sound = new Audio(url); savedPlayer.current = { sound, url };
      sound.onended = () => { URL.revokeObjectURL(url); if (savedPlayer.current?.sound === sound) savedPlayer.current = null; };
      sound.onerror = sound.onended; await sound.play();
    } catch (e) { setVoiceError(e.message); }
  }
  return <section className="space-y-5">
    <div className="flex flex-wrap justify-between gap-3"><Heading title="Phòng phỏng vấn AI" subtitle="Trao đổi trực tiếp bằng giọng nói với giám khảo AI." /><div className="flex flex-wrap gap-2"><button className={button} disabled={busy || recording} onClick={switchMode}>{callMode ? 'Chuyển sang chế độ dự phòng' : 'Trở lại phòng phỏng vấn trực tiếp'}</button><button className={button} disabled={!!working || recording} onClick={onBack}>← Quay lại</button></div></div>
    <Notice>{callMode ? 'AI sẽ nói trước, sau đó micro tự mở để nghe bạn. Khi bạn đã nói và ngừng khoảng 4 giây, hệ thống gửi câu trả lời và AI tiếp tục hội thoại. Giọng giám khảo được tạo bằng AI.' : 'Chế độ dự phòng cho phép ghi âm hoặc nhập văn bản và nộp từng câu. Thời hạn được kiểm soát trên máy chủ.'}</Notice>
    <State error={error || session?.error} />
    {!attemptId && <Panel title="Sẵn sàng vào thi"><p className="text-sm">{callMode ? 'Cho phép micro, ngồi ở nơi yên tĩnh và dùng tai nghe. Vào phòng để AI bắt đầu phỏng vấn.' : 'Bạn có thể ghi âm hoặc nhập văn bản.'}</p><State error={voiceError}/><button className={button} disabled={busy || callPhase === 'connecting'} onClick={callMode ? joinCall : start}>Bắt đầu lượt thi</button></Panel>}
    {attemptId && !session && !error && <p role="status">Đang tải lượt thi...</p>}
    {attemptId && !session && error && <button className={button} onClick={() => refresh()}>Tải lại lượt thi</button>}
    {session && <>
      {callMode ? <div className="flex flex-wrap justify-between gap-2 text-sm"><p>Câu chính: {session.completedQuestions}/{session.questionCount} · Hỏi xoáy câu hiện tại: {prompt?.followupNumber??0}/{session.maxFollowupsPerQuestion??session.maxFollowups} · Tổng đào sâu: {session.followupsUsed??0}/{session.maxFollowups}</p><p>Kết thúc ca: {new Date(session.scheduledEnd).toLocaleString('vi-VN')}</p></div> : <Panel title={`Tiến độ: ${session.completedQuestions}/${session.questionCount} câu chính`}>
        <p className="text-sm">Đào sâu câu hiện tại: {prompt?.followupNumber??0}/{session.maxFollowupsPerQuestion??session.maxFollowups} · Đã dùng {session.followupsUsed??0}/{session.maxFollowups} câu đào sâu cho toàn bộ lượt thi · {session.answerTimeLimitSeconds} giây mỗi lượt trả lời.</p>
        <p className="text-sm">Ca thi kết thúc: {new Date(session.scheduledEnd).toLocaleString('vi-VN')}</p>
        {!callMode && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoRead} onChange={e => setAutoRead(e.target.checked)} />Tự động đọc câu hỏi</label>}
        <button className={button} disabled={busy || recording} onClick={() => refresh()}>Đồng bộ lượt thi</button>
      </Panel>}
      {callMode && !session.aiConfigured && <Notice type="error">Máy chủ chưa cấu hình dịch vụ AI cho phỏng vấn. Hãy liên hệ giảng viên để kiểm tra cấu hình.</Notice>}
      {session.status === 'COMPLETED' && <><Notice>Đã hoàn thành lượt thi. AI sẽ chấm toàn bộ bài theo rubric của kỳ thi.</Notice><AttemptGrade attemptId={session.attemptId}/></>}
      {session.status === 'ABORTED' && <Notice>Lịch thi đã bị giảng viên hủy. Lượt thi đã dừng; hội thoại và các bản ghi đã nộp vẫn được lưu.</Notice>}
      {session.busy && <Notice>Máy chủ đang xử lý câu trả lời đã nộp. Bạn có thể chờ hoặc tải lại trang để tiếp tục theo dõi.</Notice>}
      {session.needsContinuation && <Panel title="Tiếp tục sau câu trả lời đã lưu"><p>Câu trả lời của bạn đã được lưu. Hãy tiếp tục để AI đặt câu hỏi làm rõ hoặc chuyển câu.</p><button className={button} disabled={busy} onClick={() => run('AI đang tiếp tục...', () => api.continueInterview(attemptId, session.answerTurnId))}>Tiếp tục phỏng vấn</button></Panel>}
      {callMode && session.status === 'IN_PROGRESS' && <section className="interview-call rounded-2xl bg-slate-950 text-white p-6 space-y-5" aria-label="Cuộc phỏng vấn trực tiếp">
        <div className="flex justify-between gap-3"><span className="text-sm">{connected ? '● Đang trong phòng thi' : 'Phòng thi sẵn sàng'}</span><span role="status">{busy || session.busy ? 'AI đang suy nghĩ...' : ({ready:'Chờ kết nối',connecting:'Đang mở micro...',preparing:'AI đang chuẩn bị câu hỏi...',speaking:'Giám khảo AI đang nói',listening:'AI đang lắng nghe bạn',thinking:'AI đang phân tích câu trả lời...',blocked:'Cần thao tác để tiếp tục'})[callPhase]}</span></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-800 p-5 text-center space-y-3"><div className={`mx-auto rounded-full w-16 h-16 flex items-center justify-center bg-indigo-600 text-2xl font-bold ${callPhase === 'speaking' ? 'animate-pulse ring-4 ring-indigo-300' : ''}`}>AI</div><h2 className="font-semibold">Giám khảo AI</h2><p className="text-sm text-slate-300">{callPhase === 'speaking' ? 'Đang đặt câu hỏi' : 'Phỏng vấn vấn đáp'}</p></div>
          <div className={`rounded-xl bg-slate-800 p-5 text-center space-y-3 ${recording ? 'ring-2 ring-emerald-400' : ''}`}><div className="mx-auto rounded-full w-16 h-16 flex items-center justify-center bg-slate-600 text-xl">Bạn</div><h2 className="font-semibold">Thí sinh</h2><p className="text-sm text-slate-300">{recording ? 'Micro đang mở · Hãy trả lời' : 'Micro chờ đến lượt bạn'}</p><div className="h-2 rounded bg-slate-700 overflow-hidden" aria-label="Mức âm thanh micro"><div className="h-full bg-emerald-400 transition-all" style={{width:`${Math.max(3,micLevel*100)}%`}}/></div></div>
        </div>
        {prompt && <div className="space-y-2"><h2 className="font-semibold">{prompt.followupNumber ? `Câu ${prompt.sequenceNo} · Hỏi đào sâu ${prompt.followupNumber}` : `Câu chính ${prompt.sequenceNo}/${session.questionCount}`}</h2><p className="text-lg whitespace-pre-wrap">{prompt.text}</p>{prompt.deadline && <p role="timer" className={remaining <= 10000 ? 'text-red-300 font-bold' : 'text-emerald-300'}>Thời gian còn lại: {Math.ceil((remaining || 0) / 1000)} giây</p>}</div>}
        {speechUrl && <audio ref={player} src={speechUrl} onEnded={speechEnded} onError={()=>{setCallPhase('blocked');setVoiceError('Không phát được giọng đọc. Hãy thử nghe lại câu hỏi.');}} aria-label="Giọng đọc câu hỏi AI"/>}
        <div className="rounded-lg bg-slate-800 p-4 min-h-24" aria-live="polite"><p className="text-xs text-slate-300 mb-2">Phụ đề câu trả lời trực tiếp</p><p>{liveText || (recording ? 'Bạn có thể bắt đầu nói. Hệ thống đang lắng nghe...' : 'Phụ đề sẽ hiện khi bạn trả lời bằng giọng nói.')}</p></div>
        <State error={voiceError}/>
        <div className="flex flex-wrap gap-3">
          {!connected && <button className={button} disabled={busy || callPhase === 'connecting' || !session.aiConfigured} onClick={joinCall}>Tham gia phỏng vấn</button>}
          {recording && <button className={button} onClick={()=>stopRecording(true)}>Tôi đã trả lời xong</button>}
          {connected && prompt && !recording && !busy && callPhase === 'blocked' && <><button className={button} onClick={playSpeech}>Nghe câu hỏi</button>{pendingAudio ? <button className={button} onClick={()=>submitAudio()}>Thử gửi lại câu trả lời</button> : <button className={button} onClick={startRecording}>Mở lại micro</button>}</>}
        </div>
        <p className="text-xs text-slate-300">Đồng hồ trả lời bắt đầu khi AI đọc xong và micro mở. Khoảng lặng sau khi đã nói có thể kết thúc lượt trả lời; dùng nút hoàn tất nếu không muốn chờ.</p>
      </section>}
      {prompt && !callMode && <Panel title={prompt.followupNumber ? `Câu ${prompt.sequenceNo} · Hỏi đào sâu ${prompt.followupNumber}` : `Câu chính ${prompt.sequenceNo}/${session.questionCount}`}>
        <p className="whitespace-pre-wrap font-medium">{prompt.text}</p>
        <div className="flex flex-wrap items-center gap-3"><button className={button} disabled={recording || busy || !session.aiConfigured} onClick={playSpeech}>Nghe câu hỏi</button>{speechUrl && <audio ref={player} controls src={speechUrl} aria-label="Giọng đọc câu hỏi AI" />}</div>
        <State error={voiceError} />
        {prompt.deadline && <p role="timer" className={`font-semibold ${remaining <= 10000 ? 'text-red-700' : ''}`}>Thời gian còn lại: {Math.ceil((remaining || 0) / 1000)} giây</p>}
        <div className="flex flex-wrap gap-2">
          {!recording ? <button className={button} disabled={busy || !session.aiConfigured || (remaining !== null && remaining <= 0)} onClick={startRecording}>{pendingAudio ? 'Ghi âm lại' : 'Bắt đầu ghi âm'}</button> : <button className={button} onClick={() => stopRecording(false)}>Dừng ghi âm</button>}
          {pendingAudio && <button className={button} disabled={busy || (remaining !== null && remaining <= 0)} onClick={() => submitAudio()}>Nộp bản ghi</button>}
          {!prompt.deadline && <button className={button} disabled={busy || recording} onClick={beginText}>Bắt đầu trả lời bằng văn bản</button>}
        </div>
        {recording && <Notice>Đang ghi âm. {liveStatus}<p className="whitespace-pre-wrap mt-2" aria-live="polite">{liveText || 'Văn bản sẽ hiển thị khi bạn nói...'}</p></Notice>}
        {recordingUrl && <audio controls src={recordingUrl} aria-label="Nghe lại bản ghi chưa nộp" />}
        {pendingAudio && liveText && <p className="whitespace-pre-wrap text-sm">Nhận dạng trực tiếp: {liveText}</p>}
        <form onSubmit={submitText} className="space-y-3"><label className="block text-sm font-medium">Câu trả lời bằng văn bản<textarea className={`${input} mt-1`} disabled={busy || recording || !prompt.deadline || remaining <= 0} rows={5} maxLength={12000} placeholder="Nhập câu trả lời nếu không dùng micro..." value={draft} onChange={e => setDraft(e.target.value)} /></label><button className={button} disabled={busy || recording || !draft.trim() || !prompt.deadline || remaining <= 0}>Nộp câu trả lời</button></form>
        {prompt.deadline && <p className="text-xs text-mutedtext">Khi gần hết giờ, hệ thống tự nộp nội dung hiện có. Bản ghi đang ghi sẽ dừng sớm 2 giây để gửi lên máy chủ.</p>}
      </Panel>}
      {working && <p role="status">{working}</p>}
      <Panel title="Hội thoại đã lưu"><div className="space-y-3">{session.turns.map(turn => <article key={turn.id} className={`border border-appborder rounded-lg p-3 ${turn.speaker === 'AI' ? 'bg-primary-light' : ''}`}><p className="text-sm font-semibold">{turn.speaker === 'AI' ? 'Giám khảo AI' : 'Bạn'} · Câu {turn.sequenceNo}{turn.followupNumber > 0 ? ` · Làm rõ ${turn.followupNumber}` : ''}</p><p className="text-sm whitespace-pre-wrap mt-2">{turn.text || (turn.speechStatus === 'PROCESSING' ? 'Đang chuyển bản ghi thành văn bản...' : 'Chưa nhận dạng được bản ghi.')}</p>{turn.hasAudio && <button className={`${button} mt-2`} onClick={() => playSaved(turn.id)}>Nghe âm thanh đã lưu</button>}</article>)}</div></Panel>
    </>}
  </section>;
}
