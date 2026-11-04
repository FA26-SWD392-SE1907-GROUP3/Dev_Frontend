import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCloudVoice } from '../src/services/cloudVoice.js';
import { readVoiceRepairConfig } from '../src/services/voiceRepairConfig.js';

const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function setup({deny=false,voiceFailure=false,sttFailure=false,holdMic=false,browser=false,diagnostics=false,repair=false,fileText='Nhận dạng dự phòng.',holdFile=false,fileFailure=false}={}){
  const calls=[],answers=[],captions=[],phases=[],fallbacks=[],players=[],sockets=[],timers=new Map();
  let node,clock=0,next=0,begins=0,stopped=0,micResolve,fileResolve,voiceAttempt=0;
  const track={enabled:true,stop(){stopped++;}};
  const stream={getTracks:()=>[track],getAudioTracks:()=>[track]};
  class Context {
    constructor(){this.audioWorklet={addModule:async()=>{}};this.state='running';this.destination={};}
    createMediaStreamSource(){return {connect(){},disconnect(){}};}
    createGain(){return {gain:{value:0},connect(){},disconnect(){}};}
    async resume(){} async close(){this.state='closed';}
  }
  class Worklet {constructor(){this.port={};node=this;}connect(){}disconnect(){}}
  class Socket {
    constructor(){this.readyState=1;this.bufferedAmount=0;this.sent=[];sockets.push(this);}
    send(value){this.sent.push(value);if(typeof value==='string'&&JSON.parse(value).type==='commit')this.event({type:'final',itemId:'student',text:'Em tách trách nhiệm để dễ sửa đổi.'});}
    close(){this.readyState=3;this.onclose?.();}
    event(value){this.onmessage?.({data:JSON.stringify(value)});}
  }
  class Audio {
    constructor(){players.push(this);this.paused=false;}async play(){}pause(){this.paused=true;}
    end(){this.onended?.();}
  }
  const env={AudioContext:Context,AudioWorkletNode:Worklet,Audio,WebSocket:Socket,Blob,AbortController,
    sessionStorage:{getItem:()=>diagnostics?'1':null},console:{debug(){}},performance:{now:()=>clock},
    URL:{createObjectURL:()=>`blob:${players.length}`,revokeObjectURL(){}},
    navigator:{mediaDevices:{async getUserMedia(constraints){calls.push(['microphone',constraints]);if(deny)throw Object.assign(new Error(),{name:'NotAllowedError'});if(holdMic)return new Promise(resolve=>{micResolve=resolve;});return stream;}}},
    setTimeout(fn,ms){const id=++next;timers.set(id,{at:clock+ms,fn});return id;},clearTimeout(id){timers.delete(id);}};
  const utterances=[],recognitions=[];
  if(browser){
    env.SpeechRecognition=class {constructor(){recognitions.push(this);}start(){}abort(){}};
    env.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
    env.speechSynthesis={getVoices:()=>[],cancel(){},speak(value){utterances.push(value);}};
  }
  const api={
    async conversationVoice(id,prompt,kind){calls.push(['voice',id,prompt,kind]);if(voiceFailure&&(voiceFailure!=='once'||voiceAttempt++===0))throw new Error('provider');return new Blob(['wave']);},
    async conversationVoiceTicket(id,prompt){calls.push(['ticket',id,prompt]);if(sttFailure)throw new Error('provider');return {ticket:'one-use'};},
    async transcribeConversation(id,prompt,file,options){calls.push(['transcribe',file,options]);if(fileFailure)throw new Error('File STT unavailable');if(holdFile)return new Promise(resolve=>{fileResolve=resolve;});return {text:fileText};},
  };
  const engine=createCloudVoice({api,env,repairs:{enabled:repair,silenceMs:3500,threshold:.008},getAttemptId:()=> 'attempt',socketUrl:ticket=>'wss://app/live?ticket='+ticket,
    onListening:()=>{begins++;},onTranscript:text=>captions.push(text),onAnswer:text=>answers.push(text),
    onPhase:value=>phases.push(value),onFallback:text=>fallbacks.push(text)});
  return {engine,env,calls,answers,captions,phases,fallbacks,players,sockets,utterances,recognitions,
    begins:()=>begins,stopped:()=>stopped,releaseMic:()=>micResolve(stream),
    releaseFile:text=>fileResolve({text}),
    frame(value=0){node.port.onmessage({data:new Int16Array(2400).fill(value).buffer});},
    tick(ms){clock+=ms;for(const [id,timer]of [...timers])if(timer.at<=clock){timers.delete(id);timer.fn();}},
    ready(){sockets.at(-1).event({type:'ready'});},
  };
}

test('requests only microphone with echo cancellation and waits through greeting and question before starting clock',async()=>{
  const s=setup();assert.equal(await s.engine.start(),true);
  s.engine.present('Vì sao dễ bảo trì?',{introduction:'Chào em.',promptId:'question'});await flush();
  assert.equal(s.begins(),0);assert.equal(s.sockets.length,0);s.frame(6000);
  assert.deepEqual(s.calls[0][1],{audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
  s.players.at(-1).end();await flush();assert.equal(s.begins(),0);
  assert.deepEqual(s.calls.filter(c=>c[0]==='voice').map(c=>c[3]),['GREETING','PROMPT']);
  s.players.at(-1).end();await flush();assert.equal(s.begins(),1);s.engine.stop();assert.ok(s.stopped()>0);
});
test('streams PCM and transcript, commits after 1.5 seconds of silence and sends the final text exactly once',async()=>{
  const s=setup();await s.engine.start();s.engine.present('Câu hỏi?',{promptId:'question'});await flush();
  s.players.at(-1).end();await flush();s.ready();
  s.sockets.at(-1).event({type:'delta',itemId:'student',text:'Em tách trách nhiệm'});
  for(let i=0;i<4;i++)s.frame(6000);for(let i=0;i<14;i++)s.frame();await flush();assert.deepEqual(s.answers,[]);
  s.frame();await flush();assert.deepEqual(s.answers,['Em tách trách nhiệm để dễ sửa đổi.']);
  s.frame();await flush();assert.equal(s.answers.length,1);s.engine.stop();
});
test('commits live captions during continuous speech without submitting or losing recorded audio',async()=>{
  const s=setup({repair:true});await s.engine.start();
  s.engine.present('Câu hỏi?',{promptId:'question'});await flush();
  s.players.at(-1).end();await flush();s.ready();s.tick(650);
  for(let i=0;i<24;i++)s.frame(6000);
  assert.match(s.captions.at(-1),/Em tách trách nhiệm/);
  assert.deepEqual(s.answers,[]);
  assert.equal(s.calls.filter(c=>c[0]==='transcribe').length,0);
  for(let i=0;i<35;i++)s.frame();
  await flush();
  assert.deepEqual(s.answers,['Nhận dạng dự phòng.']);
  assert.equal(s.calls.find(c=>c[0]==='transcribe')[1].size,44+59*4800);
  s.engine.stop();
});
test('new cloud questions finish playing before audio capture or the answer timer starts',async()=>{
  const s=setup({repair:true});
  await s.engine.start();
  s.engine.present('Câu hỏi cần nghe đầy đủ?',{promptId:'question'});
  await flush();
  for(let i=0;i<40;i++)s.frame(6000);
  assert.equal(s.sockets.length,0);
  assert.equal(s.begins(),0);
  assert.deepEqual(s.answers,[]);
  s.players.at(-1).end();
  await flush();
  assert.equal(s.begins(),1);
  assert.equal(s.sockets.length,1);
  s.engine.stop();
});
test('real student text interrupts AI audio and stale playback completion cannot resume another turn',async()=>{
  const s=setup();await s.engine.start();s.engine.present('Câu hỏi đang đọc?',{promptId:'question'});await flush();s.ready();
  const audio=s.players.at(-1),oldEnd=audio.onended;
  s.sockets.at(-1).event({type:'delta',itemId:'student',text:'Xin thầy giải thích thêm.'});await flush();
  assert.equal(audio.paused,true);assert.equal(s.phases.at(-1),'listening');assert.equal(s.begins(),1);
  oldEnd();assert.equal(s.begins(),1);s.engine.stop();
});
test('speaker echo does not count as an answer or interrupt the question',async()=>{
  const s=setup();await s.engine.start();s.engine.present('Vì sao nên tách trách nhiệm?',{promptId:'question'});await flush();s.ready();
  s.sockets.at(-1).event({type:'delta',itemId:'echo',text:'Vì sao nên tách trách nhiệm'});
  assert.equal(s.players.at(-1).paused,false);assert.deepEqual(s.captions,['']);assert.equal(s.begins(),0);s.engine.stop();
});
test('the tail of the AI voice immediately after playback does not become the student answer',async()=>{
  const s=setup();await s.engine.start();s.engine.present('Vì sao nên tách trách nhiệm?',{promptId:'question'});await flush();
  s.players.at(-1).end();await flush();s.ready();
  s.sockets.at(-1).event({type:'delta',itemId:'echo',text:'Vì sao nên tách trách nhiệm'});
  assert.deepEqual(s.captions,['']);assert.deepEqual(s.answers,[]);s.engine.stop();
});
test('denied microphone switches to text without opening cloud speech or a socket',async()=>{
  const s=setup({deny:true});assert.equal(await s.engine.start(),false);assert.equal(s.fallbacks.length,1);
  assert.equal(s.players.length,0);assert.equal(s.sockets.length,0);
});
test('an unavailable cloud voice with no browser speech support falls back without starting an empty answer',async()=>{
  const s=setup({voiceFailure:true});await s.engine.start();s.engine.present('Câu hỏi?',{promptId:'question'});await flush();
  assert.equal(s.fallbacks.length,1);assert.deepEqual(s.answers,[]);assert.ok(s.stopped()>0);
});
test('muting suppresses audio upload and never submits an empty turn',async()=>{
  const s=setup();await s.engine.start();s.engine.present('Câu hỏi?',{promptId:'question'});await flush();
  s.players.at(-1).end();await flush();s.ready();s.engine.setMuted(true);
  const socket=s.sockets.at(-1),count=socket.sent.length;for(let i=0;i<30;i++)s.frame(6000);
  s.tick(20000);await flush();assert.equal(socket.sent.length,count);assert.deepEqual(s.answers,[]);s.engine.stop();
});
test('long silence requests only a reminder and does not submit or consume a follow-up',async()=>{
  const s=setup();await s.engine.start();s.engine.present('Câu hỏi?',{promptId:'question'});await flush();s.players.at(-1).end();await flush();
  s.tick(8000);await flush();assert.equal(s.calls.filter(c=>c[0]==='voice').at(-1)[3],'REMINDER');assert.deepEqual(s.answers,[]);s.engine.stop();
});
test('late microphone permission is released after leaving the room',async()=>{
  const s=setup({holdMic:true});const started=s.engine.start();await flush();s.engine.stop();s.releaseMic();
  assert.equal(await started,false);assert.ok(s.stopped()>0);assert.equal(s.sockets.length,0);
});

test('cloud failure during greeting replays greeting then the real question before listening in browser fallback',async()=>{
  const s=setup({voiceFailure:true,browser:true});await s.engine.start();
  s.engine.present('Vì sao nên tách trách nhiệm?',{introduction:'Chào em.',promptId:'question'});await flush();
  assert.equal(s.utterances.at(-1).text,'Chào em.');assert.equal(s.begins(),0);
  s.utterances.at(-1).onend();assert.equal(s.utterances.at(-1).text,'Vì sao nên tách trách nhiệm?');assert.equal(s.begins(),0);
  s.utterances.at(-1).onend();assert.equal(s.begins(),1);s.engine.stop();
});

test('replaying a cloud question preserves the student draft across new recognition items',async()=>{
  const s=setup();await s.engine.start();s.engine.present('Câu hỏi?',{promptId:'question'});await flush();
  s.players.at(-1).end();await flush();s.ready();
  s.sockets.at(-1).event({type:'delta',itemId:'first',text:'Em bắt đầu.'});
  s.engine.present('Câu hỏi?',{promptId:'question',preserveTranscript:true});await flush();
  s.players.at(-1).end();await flush();s.ready();
  s.sockets.at(-1).event({type:'delta',itemId:'second',text:'Phần tiếp theo.'});
  assert.equal(s.captions.at(-1),'Em bắt đầu. Phần tiếp theo.');s.engine.stop();
});
test('enabling diagnostics preserves the same VAD threshold, silence boundary and submitted answer',async()=>{
  const outputs=[];
  for(const enabled of [false,true]){
    const s=setup({diagnostics:enabled});await s.engine.start();s.engine.present('Câu hỏi?',{promptId:'question'});await flush();
    s.players.at(-1).end();await flush();s.ready();
    s.sockets.at(-1).event({type:'delta',itemId:'student',text:'Em trình bày một ý.'});
    for(let i=0;i<4;i++)s.frame(6000);for(let i=0;i<15;i++)s.frame();await flush();outputs.push(s.answers);
    if(enabled){
      const commit=s.env.__aivesInterviewDiagnostics.find(row=>row.event==='vad.commit');
      assert.equal(commit.silenceMs,1500);assert.equal(commit.threshold,.018);assert.equal(commit.quietMs,1500);
      assert.ok(s.env.__aivesInterviewDiagnostics.some(row=>row.event==='audio.play_started'));
      assert.doesNotMatch(JSON.stringify(s.env.__aivesInterviewDiagnostics),/Em trình bày|Câu hỏi/);
    }else assert.equal(s.env.__aivesInterviewDiagnostics,undefined);
    s.engine.stop();
  }
  assert.deepEqual(outputs[0],outputs[1]);
});
test('phase 0 reproduces voice switching when STT fails after the cloud greeting without changing behavior',async()=>{
  const s=setup({diagnostics:true,sttFailure:true,browser:true});await s.engine.start();
  s.engine.present('Câu hỏi chính?',{introduction:'Chào em.',promptId:'question'});await flush();
  assert.equal(s.calls.filter(row=>row[0]==='voice')[0][3],'GREETING');
  s.players.at(-1).end();await flush();
  assert.equal(s.utterances.at(-1).text,'Câu hỏi chính?');
  const records=s.env.__aivesInterviewDiagnostics;
  assert.ok(records.some(row=>row.event==='voice.fallback'&&row.source==='browser'));
  assert.ok(records.some(row=>row.event==='tts.browser.request'&&row.model==='browser_speechSynthesis'));
  assert.deepEqual(s.answers,[]);s.engine.stop();
});

test('repair keeps cloud voice and the microphone alive when live STT fails, then submits the retained recording',async()=>{
  const s=setup({repair:true,sttFailure:true,browser:true,fileText:'Em trình bày đủ nội dung từ bản ghi.'});await s.engine.start();
  s.engine.present('Câu hỏi chính?',{introduction:'Chào em.',promptId:'question'});await flush();
  s.players.at(-1).end();await flush();
  assert.equal(s.players.at(-1).paused,false);assert.equal(s.stopped(),0);assert.equal(s.utterances.length,0);
  s.players.at(-1).end();await flush();
  for(let i=0;i<4;i++)s.frame(400);for(let i=0;i<30;i++)s.frame();await flush();assert.deepEqual(s.answers,[]);
  for(let i=0;i<5;i++)s.frame();await flush();
  assert.deepEqual(s.answers,['Em trình bày đủ nội dung từ bản ghi.']);assert.equal(s.fallbacks.length,0);
  const file=s.calls.find(row=>row[0]==='transcribe')[1];assert.ok(file.size>44);
  assert.equal(new TextDecoder().decode((await file.arrayBuffer()).slice(0,4)),'RIFF');s.engine.stop();
});
test('repair retries a failed TTS request once and never invokes browser speech after both attempts fail',async()=>{
  const s=setup({repair:true,voiceFailure:true,browser:true});await s.engine.start();
  s.engine.present('Câu hỏi?',{promptId:'question'});await flush();
  assert.equal(s.calls.filter(row=>row[0]==='voice').length,2);assert.equal(s.utterances.length,0);
  assert.equal(s.fallbacks.length,1);assert.equal(s.begins(),0);s.engine.stop();
});
test('repair recovers a transient TTS failure using the same cloud speech kind',async()=>{
  const s=setup({repair:true,voiceFailure:'once',browser:true});await s.engine.start();
  s.engine.present('Câu hỏi?',{promptId:'question'});await flush();
  assert.deepEqual(s.calls.filter(row=>row[0]==='voice').map(row=>row[3]),['PROMPT','PROMPT']);
  assert.equal(s.players.length,1);assert.equal(s.utterances.length,0);assert.equal(s.fallbacks.length,0);s.engine.stop();
});
test('repair uses the full file transcript rather than submitting a short interim or unrelated live final',async()=>{
  const full='Em giải thích đầy đủ cả nguyên nhân và ví dụ từ bản ghi.';
  const s=setup({repair:true,fileText:full});await s.engine.start();s.engine.present('Câu hỏi?',{promptId:'question'});await flush();
  s.players.at(-1).end();await flush();s.ready();
  s.sockets.at(-1).event({type:'delta',itemId:'student',text:'Em nghĩ'});
  for(let i=0;i<4;i++)s.frame(6000);for(let i=0;i<35;i++)s.frame();await flush();
  assert.deepEqual(s.answers,[full]);s.engine.stop();
});
test('repair cancels a stale transcription and keeps both audio parts when the student resumes speaking',async()=>{
  const s=setup({repair:true,holdFile:true});await s.engine.start();s.engine.present('Câu hỏi?',{promptId:'question'});await flush();
  s.players.at(-1).end();await flush();s.ready();
  for(let i=0;i<4;i++)s.frame(6000);for(let i=0;i<35;i++)s.frame();await flush();
  const first=s.calls.find(row=>row[0]==='transcribe');assert.ok(first);
  s.frame(6000);assert.equal(first[2].signal.aborted,true);s.releaseFile('Câu cũ bị cắt');await flush();assert.deepEqual(s.answers,[]);
  for(let i=0;i<3;i++)s.frame(6000);for(let i=0;i<35;i++)s.frame();await flush();
  const second=s.calls.filter(row=>row[0]==='transcribe').at(-1);assert.ok(second[1].size>first[1].size);
  s.releaseFile('Câu đầy đủ sau khi em nói tiếp.');await flush();assert.deepEqual(s.answers,['Câu đầy đủ sau khi em nói tiếp.']);s.engine.stop();
});
test('repair retains recognized words and switches to text if final file transcription fails',async()=>{
  const s=setup({repair:true,fileFailure:true,browser:true});await s.engine.start();s.engine.present('Câu hỏi?',{promptId:'question'});await flush();
  s.players.at(-1).end();await flush();s.ready();s.sockets.at(-1).event({type:'delta',itemId:'student',text:'Phần em đã nói.'});
  for(let i=0;i<4;i++)s.frame(6000);for(let i=0;i<35;i++)s.frame();await flush();
  assert.deepEqual(s.answers,[]);assert.equal(s.fallbacks.length,1);assert.equal(s.utterances.length,0);
  assert.ok(s.captions.includes('Phần em đã nói.'));s.engine.stop();
});
test('repair configuration defaults to a 3.5 second pause and supports an explicit rollback switch',()=>{
  const profile=readVoiceRepairConfig({sessionStorage:{getItem:()=>null}});
  assert.equal(profile.enabled,true);assert.equal(profile.silenceMs,3500);assert.equal(profile.threshold,.008);
  assert.equal(readVoiceRepairConfig({sessionStorage:{getItem:()=> 'off'}}).enabled,false);
});
