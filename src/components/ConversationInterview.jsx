import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { createWebSpeech } from '../services/webSpeech';
import InterviewCallRoom from './InterviewCallRoom';
import '../interview-call.css';
import AttemptGrade from './common/AttemptGrade';
import { button, input, Heading, Panel, Notice, State } from './api/parts';

export default function ConversationInterview({ candidateId, attemptId: initialId = '', onBack, onAttemptSaved, onLegacy }) {
  const [attemptId, setAttemptId] = useState(initialId), [session, setSession] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false), [phase, setPhase] = useState('ready');
  const [draft, setDraft] = useState(''), [live, setLive] = useState(''), [partial, setPartial] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [voiceError, setVoiceError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [delivery, setDelivery] = useState(0);
  const [joined,setJoined]=useState(false),[micMuted,setMicMuted]=useState(false),[textMode,setTextMode]=useState(false);
  const [captions,setCaptions]=useState(true),[transcriptOpen,setTranscriptOpen]=useState(false),[fullscreen,setFullscreen]=useState(false);
  const [spoken,setSpoken]=useState(''),[joinedAt,setJoinedAt]=useState(null);
  const mutedRef=useRef(false),greeted=useRef(false);
  const lastPresented=useRef('');
  const lastPrompt=useRef('');
  const plannedSpeech=useRef(null);
  const checkpointRef=useRef(null);
  const draftFlight=useRef(null),draftRevision=useRef(Date.now()),lastCheckpoint=useRef(''),expiredPrompt=useRef(null),autoContinued=useRef(null);
  const draftRef=useRef('');draftRef.current=draft;
  const mounted = useRef(true), state = useRef(null), voice = useRef(null), running = useRef(false);
  const controller = useRef(null), poll = useRef(null), begin = useRef(null), pending = useRef(null);
  const sendRef = useRef(null), latestText = useRef('');
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
    if (!current?.prompt || current.status !== 'IN_PROGRESS') return;
    if (begin.current?.id === current.prompt.id) return;
    const promise = api.beginInterviewAnswer(current.attemptId, current.prompt.id).then(accept).catch(e => {
      if (mounted.current) { setError(e.message); voice.current?.pause(); setPhase('blocked'); }
      throw e;
    });
    // Keep the rejection handled even when the user never submits an answer.
    promise.catch(() => {}); begin.current = { id: current.prompt.id, promise };
  }
  async function checkpoint() {
    const current=state.current;
    const text=(textMode?draftRef.current:latestText.current).slice(0,12000);
    if(!joined||running.current||!current?.prompt?.deadline||draftFlight.current||!text.trim())return;
    const signature=current.prompt.id+':'+text;
    if(signature===lastCheckpoint.current)return;
    const promise=(async()=>{
      try{
        if(begin.current?.id===current.prompt.id)await begin.current.promise;
        await api.checkpointInterview(current.attemptId,current.prompt.id,++draftRevision.current,text);
        lastCheckpoint.current=signature;
      }catch{/* A final submission or server timeout resolves checkpoints racing the deadline. */}
      finally{
        draftFlight.current=null;
        const latest=textMode?draftRef.current:latestText.current;
        if(mounted.current&&state.current?.prompt?.id===current.prompt.id&&latest!==text)
          queueMicrotask(()=>checkpointRef.current?.());
      }
    })();
    draftFlight.current=promise;return promise;
  }
  checkpointRef.current=checkpoint;
  function buildVoice() {
    voice.current?.stop();
    voice.current = createWebSpeech({
      onTranscript: text => { latestText.current = text; if (mounted.current) { setLive(text);void checkpointRef.current?.(); } },
      onAnswer: text => sendRef.current?.(text),
      onPhase: value => { if (mounted.current) setPhase(value); },
      onListening: beginListening,
      onFallback: message => {
        if (!mounted.current) return;
        setVoiceError(message); setVoiceEnabled(false); setPhase('text');
        setTextMode(true);
        setDraft(value => latestText.current || value); beginListening();
      },
    });
    return voice.current.start();
  }
  function toggleMic() {
    const next=!mutedRef.current;mutedRef.current=next;setMicMuted(next);voice.current?.setMuted(next);
  }
  function switchToText() {
    mutedRef.current=false;setMicMuted(false);
    voice.current?.stop();setVoiceEnabled(false);setTextMode(true);setJoined(true);
    setDraft(latestText.current||draft);setPhase('text');
    if(!attemptId)start(false);else beginListening();
  }
  async function start(useVoice = true) {
    if (running.current) return;
    running.current = true; setBusy(true); setError(''); setVoiceError('');
    mutedRef.current=false;setMicMuted(false);setTextMode(!useVoice);
    const enabled = useVoice && buildVoice(); setVoiceEnabled(enabled);
    try {
      let id = attemptId;
      if (!id) {
        const result = await api.startAttempt(candidateId); id = result.attemptId;
        if (!mounted.current) return;
        setAttemptId(id); onAttemptSaved?.(id);
      }
      accept(await api.interview(id));
      if(mounted.current){setJoined(true);setJoinedAt(value=>value||Date.now());setDelivery(value=>value+1);if(!enabled){setTextMode(true);beginListening();}}
    } catch (e) { if (mounted.current) { setError(e.message); voice.current?.stop(); setVoiceEnabled(false); } }
    finally { running.current = false; if (mounted.current) setBusy(false); }
  }
  async function send(text, retry = null) {
    const current = state.current;
    if (running.current || !current || current.status !== 'IN_PROGRESS') return;
    const saved = retry || { promptId: current.prompt?.id, text: text?.trim() };
    if (!saved.promptId || !saved.text) return;
    running.current = true; setBusy(true); setError(''); setPartial(''); setPhase('thinking');
    voice.current?.pause(); poll.current?.abort();
    pending.current = saved; sessionStorage.setItem(storageKey(current.attemptId), JSON.stringify(saved));
    const abort = new AbortController(); controller.current = abort;
    const operation = (async () => {
      try {
        if (begin.current?.id === saved.promptId) await begin.current.promise;
        await draftFlight.current;
        const value = await api.streamInterviewAnswer(current.attemptId, saved.promptId, saved.text, {
          signal: abort.signal,
          onEvent: (event, payload) => {
            if (!mounted.current) return;
            if (event === 'saved') {
              saved.acknowledged = true;
              sessionStorage.setItem(storageKey(current.attemptId), JSON.stringify(saved));
            }
            if (event === 'delta') setPartial(value => value + payload.text);
            if (event === 'speech') plannedSpeech.current=payload;
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
    await operation;
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
          onEvent: (event, payload) => { if (!mounted.current)return;if(event==='delta')setPartial(text => text + payload.text);if(event==='speech')plannedSpeech.current=payload; } });
        if (mounted.current) { latestText.current='';setLive('');setPartial(''); accept(value); setDelivery(value => value + 1); }
      } catch (e) { if (mounted.current && !abort.signal.aborted) setError(e.message); }
      finally { running.current = false; if (mounted.current) setBusy(false); }
    })();
    await operation;
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
    if (!prompt || !joined) return;
    const signature=`${prompt.id}:${delivery}:${voiceEnabled}`;
    if(lastPresented.current===signature)return;
    lastPresented.current=signature;
    if(lastPrompt.current!==prompt.id){
      lastPrompt.current=prompt.id;latestText.current='';setLive('');setPartial('');begin.current=null;
      setDraft(sessionStorage.getItem(`aives-answer-${attemptId}-${prompt.id}`)||'');
    }
    if (voiceEnabled && !pending.current) {
      const greeting=greeted.current?'': 'Chào em, tôi là giám khảo AI trong buổi vấn đáp hôm nay. Em cứ trao đổi tự nhiên; nếu chưa rõ câu hỏi, em có thể hỏi lại nhé. ';
      const transition=greeted.current&&prompt.kind==='MAIN_QUESTION'?'Tôi đã ghi nhận. Chúng ta trao đổi tiếp nhé. ':'';
      const words=plannedSpeech.current?.promptId===prompt.id?plannedSpeech.current.text:transition+prompt.text;
      plannedSpeech.current=null;greeted.current=true;setSpoken(greeting+words);
      voice.current?.present(words,{introduction:greeting});voice.current?.setMuted(mutedRef.current);
    } else if(textMode)beginListening();
  }, [prompt?.id, voiceEnabled, delivery, joined, textMode]);
  useEffect(()=>{
    if(!joined||!prompt?.deadline)return;
    const timer=setInterval(()=>{void checkpoint();},500);
    return()=>clearInterval(timer);
  },[joined,prompt?.id,prompt?.deadline,textMode]);
  useEffect(()=>{
    if(!joined||!prompt?.deadline||remaining!==0||busy||expiredPrompt.current===prompt.id)return;
    expiredPrompt.current=prompt.id;voice.current?.pause();
    const id=session.attemptId,expected=prompt.id;
    (async()=>{
      await draftFlight.current;
      try{accept(await api.timeoutInterview(id,expected));}
      catch(e){if(mounted.current){setError(e.message);expiredPrompt.current=null;}}
    })();
  },[joined,prompt?.id,remaining,busy]);
  useEffect(()=>{
    if(!joined||!session?.needsContinuation||session.busy||busy||pending.current||autoContinued.current===session.answerTurnId)return;
    autoContinued.current=session.answerTurnId;void resume();
  },[joined,session?.needsContinuation,session?.answerTurnId,session?.busy,busy]);
  useEffect(() => {
    if (attemptId && prompt) sessionStorage.setItem(`aives-answer-${attemptId}-${prompt.id}`, draft);
  }, [attemptId, prompt?.id, draft]);
  useEffect(() => {
    if (!session || session.status === 'IN_PROGRESS') return;
    const closing=plannedSpeech.current?.text;
    plannedSpeech.current=null;
    if(closing&&voiceEnabled)voice.current?.closeWith(closing);else voice.current?.stop();
    setJoined(false); setVoiceEnabled(false); setPhase('finished');setFullscreen(false);
  }, [session?.status]);
  useEffect(()=>{
    if(!fullscreen)return;
    const previous=document.body.style.overflow;document.body.style.overflow='hidden';
    const close=event=>{if(event.key==='Escape')setFullscreen(false);};document.addEventListener('keydown',close);
    return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',close);};
  },[fullscreen]);
  function replayQuestion(){
    if(!prompt||busy||session?.busy)return;
    if(!voiceEnabled){start();return;}
    setSpoken(prompt.text);voice.current?.present(prompt.text,{preserveTranscript:true});
    voice.current?.setMuted(mutedRef.current);
  }
  const inProgress=!session||session.status==='IN_PROGRESS';
  return <section className="space-y-5">
    <Heading title="Phỏng vấn trực tiếp" subtitle="Một cuộc trò chuyện cùng giám khảo AI." action={<button className={button} disabled={busy} onClick={()=>{voice.current?.stop();onBack?.();}}>← Quay lại</button>}/>
    <State error={error||session?.error}/><State error={voiceError}/>
    {inProgress&&<InterviewCallRoom phase={phase} joined={joined} muted={micMuted} followupsRemaining={Math.max(0,Math.min(session?.maxFollowupsPerQuestion-(prompt?.followupNumber||0),session?.maxFollowups-session?.followupsUsed))}
      captions={captions} transcriptOpen={transcriptOpen} live={live} spoken={partial||spoken} busy={busy||session?.busy} remaining={remaining}
      elapsed={joinedAt?Math.max(0,Math.floor((now-joinedAt)/1000)):0} fullscreen={fullscreen} 
      onJoin={()=>start()} onMic={toggleMic} onCaptions={()=>setCaptions(value=>!value)} onTranscript={()=>setTranscriptOpen(value=>!value)}
      question={prompt?.text} onReplay={replayQuestion} onText={switchToText} onFullscreen={()=>setFullscreen(value=>!value)}/>}
    {attemptId&&!session&&<p role="status">Đang tải lượt thi...</p>}
    {attemptId&&!session&&error&&<button className={button} onClick={()=>refresh()}>Tải lại lượt thi</button>}
    {session&&<>
      <div className="call-metadata"><span>Tiến độ buổi phỏng vấn: {session.completedQuestions}/{session.questionCount}</span><span>Kết thúc ca: {new Date(session.scheduledEnd).toLocaleString('vi-VN')}</span></div>
      {joined&&phase==='blocked'&&voiceEnabled&&!pending.current&&<button className={button} disabled={busy} onClick={()=>start()}>Thử lại giọng nói</button>}
      {session.status==='IN_PROGRESS'&&joined&&textMode&&prompt&&<Panel title="Trao đổi bằng văn bản">
        <p className="text-sm whitespace-pre-wrap">{prompt.text}</p>
        <form onSubmit={event=>{event.preventDefault();send(draft);}} className="space-y-3"><label className="block">Câu trả lời<textarea aria-label="Câu trả lời" className={input} rows={3} maxLength={12000} value={draft} disabled={busy} onChange={event=>setDraft(event.target.value)}/></label>
          <div className="flex flex-wrap gap-2"><button className={button} disabled={busy||!draft.trim()}>Gửi câu trả lời</button><button type="button" className={button} disabled={busy} onClick={()=>start()}>Trở lại trò chuyện giọng nói</button></div>
        </form>
      </Panel>}
      {(pending.current||session.needsContinuation)&&session.status==='IN_PROGRESS'&&<button className={button} disabled={busy||session.busy} onClick={resume}>Thử tiếp tục câu trả lời đã lưu</button>}
      {session.status==='COMPLETED'&&<><Notice>Đã hoàn thành lượt thi. AI chấm toàn bài theo rubric của kỳ thi.</Notice><AttemptGrade attemptId={attemptId}/></>}
      {session.status==='ABORTED'&&<Notice>Lượt thi đã dừng. Hội thoại đã nộp vẫn được lưu.</Notice>}
      {(transcriptOpen||session.status!=='IN_PROGRESS')&&<section className="call-transcript-drawer" aria-label="Hội thoại đã lưu">
        <div className="call-transcript-heading"><h2>Hội thoại đã lưu</h2>{session.status==='IN_PROGRESS'&&<button type="button" onClick={()=>setTranscriptOpen(false)}>Đóng hội thoại</button>}</div>
        <div className="call-transcript-messages">{session.turns.map(turn=><article key={turn.id} className={turn.speaker==='STUDENT'?'student-message':''}><strong>{turn.speaker==='AI'?'Giám khảo AI':'Bạn'}</strong><p className="whitespace-pre-wrap">{turn.text}</p></article>)}
          {live&&<article className="student-message"><strong>Bạn · Đang nói</strong><p>{live}</p></article>}
          {partial&&<article><strong>Giám khảo AI · Đang phản hồi</strong><p>{partial}</p></article>}
        </div>
      </section>}
    </>}
    <details className="text-xs text-mutedtext"><summary className="cursor-pointer">Tùy chọn kết nối</summary><p className="my-3">Cuộc vấn đáp sử dụng micro. Nếu trình duyệt không nhận giọng nói, em có thể tiếp tục bằng văn bản.</p><button className={button} disabled={busy} onClick={()=>{voice.current?.stop();onLegacy?.();}}>Chuyển sang chế độ dự phòng</button></details>
  </section>;
}
