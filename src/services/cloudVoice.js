import { createWebSpeech } from './webSpeech.js';
import { createInterviewDiagnostics } from './interviewDiagnostics.js';
import { readVoiceRepairConfig } from './voiceRepairConfig.js';

// Audio goes only to the authenticated Spring API. The OpenAI key never reaches the browser.
export function createCloudVoice({ api, socketUrl, getAttemptId, onTranscript=()=>{}, onAnswer=()=>{},
  onPhase=()=>{}, onListening=()=>{}, onFallback=()=>{}, onDegraded=()=>{}, onSpoken=()=>{}, onVoiceActivity=()=>{},
  getRemainingMs=()=>Infinity,
  env=globalThis, silenceMs, reminderMs=8000, repairs=readVoiceRepairConfig(env) }) {
  silenceMs??=repairs.enabled?repairs.silenceMs:1500;
  const threshold=repairs.enabled?repairs.threshold:.018;
  let active=false, paused=true, muted=false, speaking=false, protectedSpeech=false, generation=0;
  let stream, context, source, node, gain, socket, ready=false, player, objectUrl, request;
  let fallback, browserReady=false, browserCarry='', promptId, transcript='', aiText='', voicedMs=0, quietMs=0, frames=[], pendingFrames=[], queuedBytes=0;
  let reminder, finalTimer, connectTimer, audioTimer, echoTimer, echoWindow=false, committing=false, finalResolve, reminded=false;
  let questionText='', speechKind='', prefix='';
  let liveUnavailable=false;
  let previewRequest=null, previewVoicedMs=0, previewText='';
  const resumeConfirmationMs=200;
  let speechRunMs=0, resumedFrames=[];
  let uncommittedBytes=0, uncommittedVoiceMs=0;
  const items=new Map();
  const diagnostic=createInterviewDiagnostics({env,getContext:()=>({attemptId:getAttemptId(),promptId,mode:'cloud',generation})});
  let speechEndedAt=null,commitAt=null,segmentId=0,windowMs=0,minRms=1,maxRms=0;
  const clearTimer=name=>env.clearTimeout(name);
  const phase=value=>{if(active)onPhase(value);};
  const normalize=value=>value.normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/gi,'d').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').trim();
  const echo=text=>{
    const candidate=normalize(text), original=normalize(aiText);
    return (speaking||echoWindow) && (candidate.split(' ').length<2 || original.includes(candidate));
  };
  function cancelAudio(reason='cleanup'){
    if(player||request)diagnostic.event('audio.cancel',{reason,segmentId,speechKind,speaking});
    request?.abort();request=null;clearTimer(audioTimer);
    if(player){player.onended=null;player.onerror=null;player.pause();player.src='';player=null;}
    if(objectUrl){env.URL.revokeObjectURL(objectUrl);objectUrl=null;}
  }
  function disconnect(){
    clearTimer(connectTimer);ready=false;
    uncommittedBytes=uncommittedVoiceMs=0;
    const previous=socket;socket=null;if(previous)previous.close();
    pendingFrames=[];queuedBytes=0;
  }
  function commitCaptions(){
    if(!ready||socket?.readyState!==1||uncommittedBytes<4800)return;
    socket.send(JSON.stringify({type:'commit'}));
    uncommittedBytes=uncommittedVoiceMs=0;
  }
  function pause(){
    generation++;paused=true;speaking=false;protectedSpeech=false;committing=false;
    speechRunMs=0;resumedFrames=[];
    previewRequest?.abort();previewRequest=null;
    onVoiceActivity(false);
    clearTimer(echoTimer);echoWindow=false;
    clearTimer(reminder);clearTimer(finalTimer);finalResolve?.();finalResolve=null;
    cancelAudio();disconnect();fallback?.pause();
  }
  function stop(){
    active=false;pause();fallback?.stop();fallback=null;
    stream?.getTracks().forEach(track=>track.stop());stream=null;
    source?.disconnect();node?.disconnect();gain?.disconnect();
    if(context&&context.state!=='closed')context.close().catch(()=>{});context=null;
  }
  function failToText(message){if(!active)return;stop();onFallback(message);}
  function useBrowser(message){
    if(!active||fallback)return;
    if(repairs.enabled){failToText(message+' Em có thể tiếp tục bằng văn bản; hệ thống không đổi giọng đọc.');return;}
    diagnostic.event('voice.fallback',{source:'browser',speechKind,transcriptChars:transcript.length});
    const introduction=speechKind==='GREETING'?aiText:'';
    const closing=speechKind==='CLOSING'?aiText:'';
    browserCarry=transcript;pause();
    stream?.getTracks().forEach(track=>track.stop());stream=null;
    source?.disconnect();node?.disconnect();gain?.disconnect();
    if(context&&context.state!=='closed')context.close().catch(()=>{});context=null;
    onDegraded(message+' Đang dùng nhận dạng và giọng đọc dự phòng của trình duyệt.');
    fallback=createWebSpeech({env,onPhase,onListening,diagnosticsContext:()=>({attemptId:getAttemptId(),promptId}),
      onTranscript:text=>{transcript=(browserCarry+' '+text).trim().slice(0,12000);onTranscript(transcript);},
      onAnswer:text=>onAnswer((browserCarry+' '+text).trim().slice(0,12000)),onFallback:failToText});
    browserReady=fallback.start();
    if(browserReady){
      if(closing)fallback.closeWith(closing);
      else if(promptId&&questionText)fallback.present(questionText,{introduction,preserveTranscript:true});
      fallback.setMuted(muted);
    }
  }
  function liveFailed(message){
    if(!active)return;
    if(!repairs.enabled){useBrowser(message);return;}
    liveUnavailable=true;disconnect();
    diagnostic.event('stt.recording_fallback',{source:'live',transcriptChars:transcript.length});
    onDegraded('Phụ đề trực tiếp tạm gián đoạn. Micro vẫn ghi âm và chữ sẽ cập nhật từ bản ghi.');
  }
  function armReminder(){
    clearTimer(reminder);
    if(paused||speaking||muted||committing||transcript.trim()||reminded)return;
    reminder=env.setTimeout(()=>{
      if(!active||paused||speaking||muted||transcript.trim())return;
      reminded=true;void say('REMINDER','Em cứ bình tĩnh, nói theo cách em hiểu về câu hỏi vừa rồi nhé.');
    },reminderMs);
  }
  function listen(interrupted=false){
    if(!active)return;
    speaking=false;protectedSpeech=false;paused=false;phase('listening');
    if(!interrupted){echoWindow=true;clearTimer(echoTimer);echoTimer=env.setTimeout(()=>{echoWindow=false;},600);}
    const version=generation;
    if(!interrupted){disconnect();if(!transcript)items.clear();}
    Promise.resolve(onListening()).then(()=>{if(!interrupted&&active&&!paused&&version===generation)void connect(version);})
      .catch(()=>failToText('Chưa bắt đầu được lượt trả lời. Em có thể tiếp tục bằng văn bản.'));
    armReminder();
  }
  function onText(data){
    const previous=items.get(data.itemId)||'';
    const next=data.type==='final'?data.text:previous+data.text;
    items.set(data.itemId,next);
    const recognized=[...items.values()].join(' ').trim();
    const text=(prefix+' '+recognized).trim().slice(0,12000);
    diagnostic.event(data.type==='final'?'stt.final':'stt.delta',{source:'live',transcriptChars:recognized.length,messageChars:text.length,
      resultFinal:data.type==='final',sinceCommitMs:commitAt===null?-1:diagnostic.now()-commitAt,
      fromSpeechEndMs:speechEndedAt===null?-1:diagnostic.now()-speechEndedAt});
    if(!recognized||echo(recognized))return;
    if(repairs.enabled&&!speaking&&text.length<previewText.length)return;
    transcript=text;
    if(speaking&&!protectedSpeech){
      diagnostic.event('audio.barge_in',{segmentId,transcriptChars:transcript.length});
      generation++;echoWindow=false;cancelAudio('barge_in');listen(true);
    }
    onTranscript(transcript);
    if(data.type==='final'&&committing){finalResolve?.();finalResolve=null;}
  }
  async function connect(version){
    if(repairs.enabled&&liveUnavailable)return;
    const buffered=pendingFrames,bufferedBytes=queuedBytes;
    disconnect();pendingFrames=buffered;queuedBytes=bufferedBytes;
    try{
      const ticket=await api.conversationVoiceTicket(getAttemptId(),promptId);
      if(!active||paused||version!==generation||fallback)return;
      const current=new env.WebSocket(socketUrl(ticket.ticket));socket=current;
      connectTimer=env.setTimeout(()=>{if(!ready&&socket===current)liveFailed('Nhận dạng AI kết nối quá lâu.');},10000);
      current.onmessage=event=>{
        if(!active||socket!==current||paused||fallback)return;
        try{
          const data=JSON.parse(event.data);
          if(data.type==='ready'){
            diagnostic.event('stt.ready',{source:'live',sampleRate:24000,format:'pcm16',queuedBytes});
            ready=true;clearTimer(connectTimer);
            for(const frame of pendingFrames)current.send(frame);
            uncommittedBytes=queuedBytes;pendingFrames=[];queuedBytes=0;
          }else if(data.type==='delta'||data.type==='final')onText(data);
          else if(data.type==='error')liveFailed('Nhận dạng giọng nói AI bị gián đoạn.');
        }catch{liveFailed('Không đọc được kết quả nhận dạng giọng nói.');}
      };
      current.onerror=()=>{if(socket===current)liveFailed('Không kết nối được nhận dạng giọng nói AI.');};
      current.onclose=()=>{if(socket===current&&active&&!paused)liveFailed('Kết nối micro AI đã đóng.');};
    }catch{if(active&&version===generation)liveFailed('Chưa kết nối được nhận dạng giọng nói AI.');}
  }
  function wav(samples){
    const size=samples.reduce((sum,part)=>sum+part.byteLength,0);
    const buffer=new ArrayBuffer(44+size),view=new DataView(buffer);
    const label=(offset,text)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i));};
    label(0,'RIFF');view.setUint32(4,36+size,true);label(8,'WAVEfmt ');view.setUint32(16,16,true);
    view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,24000,true);view.setUint32(28,48000,true);
    view.setUint16(32,2,true);view.setUint16(34,16,true);label(36,'data');view.setUint32(40,size,true);
    let offset=44;for(const part of samples){new Uint8Array(buffer,offset,part.byteLength).set(new Uint8Array(part));offset+=part.byteLength;}
    return new env.Blob([buffer],{type:'audio/wav'});
  }
  async function previewRecording(){
    if(!repairs.enabled||previewRequest||committing||echoWindow||voicedMs<350)return;
    const nearDeadline=getRemainingMs()<=12000;
    const missingCaptions=liveUnavailable||!transcript.trim();
    if(!missingCaptions&&!nearDeadline)return;
    const newVoiceMs=voicedMs-previewVoicedMs;
    if(previewVoicedMs ? newVoiceMs<(nearDeadline?1500:5000) : voicedMs<3000&&quietMs<700)return;
    const version=generation;
    const controller=new env.AbortController();
    const before=transcript;
    previewRequest=controller;previewVoicedMs=voicedMs;
    try{
      const result=await api.transcribeConversation(getAttemptId(),promptId,wav(frames),{signal:controller.signal});
      if(!active||paused||muted||version!==generation||controller.signal.aborted)return;
      const text=result.text?.trim().slice(0,12000);
      if(text&&(transcript===before||text.length>transcript.length)){
        previewText=text;
        transcript=text;
        onTranscript(text);
      }
    }catch{
      // The full recording still has its own transcription attempt at the end of the turn.
    }finally{
      if(previewRequest===controller)previewRequest=null;
    }
  }
  async function finishTurn(){
    if(!active||paused||speaking||muted||committing||voicedMs<350)return;
    committing=true;resumedFrames=[];clearTimer(reminder);const version=generation;
    commitAt=diagnostic.now();
    diagnostic.event('vad.commit',{reason:'silence',voicedMs,quietMs,silenceMs,transcriptChars:transcript.length,
      fromSpeechEndMs:speechEndedAt===null?-1:commitAt-speechEndedAt,ready,threshold});
    try{
      if(repairs.enabled){
        try{commitCaptions();}catch{liveFailed('Không chốt được phụ đề trực tiếp.');}
      }
      if(!repairs.enabled&&ready&&socket?.readyState===1){
        await new Promise(resolve=>{finalResolve=resolve;socket.send(JSON.stringify({type:'commit'}));finalTimer=env.setTimeout(resolve,2500);});
        clearTimer(finalTimer);finalResolve=null;
      }
      if(!active||paused||version!==generation)return;
      if((repairs.enabled||!transcript.trim())&&frames.length){
        diagnostic.event('stt.file_fallback',{source:'live',audioBytes:frames.reduce((sum,part)=>sum+part.byteLength,0)});
        phase('thinking');
        const controller=new env.AbortController();
        request=controller;
        const transcription=api.transcribeConversation(getAttemptId(),promptId,wav(frames),{signal:controller.signal});
        let result;
        if(repairs.enabled&&transcript.trim()){
          // Give the complete recording a chance to improve the transcript without blocking
          // the conversation until the full request timeout or exam deadline.
          const waitMs=Math.max(0,Math.min(2500,getRemainingMs()-500));
          let timer;
          try{
            result=await Promise.race([transcription,new Promise(resolve=>{
              timer=env.setTimeout(()=>resolve(null),waitMs);
            })]);
            if(result===null)controller.abort();
          }finally{clearTimer(timer);}
        }else{
          result=await transcription;
        }
        if(!active||paused||version!==generation)return;
        const fullText=result?.text?.trim().slice(0,12000);
        if(fullText){transcript=fullText;onTranscript(transcript);}
      }
      if(!transcript.trim()){
        if(repairs.enabled){
          failToText('Micro đã thu âm nhưng chưa nhận dạng được lời nói. Em có thể nhập câu trả lời cho lượt này.');
          return;
        }
        committing=false;voicedMs=quietMs=0;listen();return;
      }
      diagnostic.event('answer.auto_submit',{reason:'silence',textChars:transcript.length,sinceCommitMs:diagnostic.now()-commitAt});
      const text=transcript;pause();onAnswer(text);
    }catch{if(active&&!paused&&version===generation)useBrowser('Chưa chốt được nhận dạng. Nội dung đã nghe vẫn được giữ.');}
  }
  function frame(buffer){
    if(!active||paused||muted||protectedSpeech||fallback||committing&&!repairs.enabled)return;
    const samples=new Int16Array(buffer);
    const rms=Math.sqrt(samples.reduce((sum,value)=>sum+(value/32768)**2,0)/Math.max(1,samples.length));
    const duration=samples.length/24;
    const voiced=rms>=threshold;
    speechRunMs=voiced?speechRunMs+duration:0;
    if(committing&&repairs.enabled){
      if(!voiced){resumedFrames=[];return;}
      if(speechRunMs<resumeConfirmationMs){resumedFrames.push(buffer.slice(0));return;}
      // The student resumed while file STT was pending. Keep all audio and cancel only that stale result.
      frames.push(...resumedFrames);resumedFrames=[];
      voicedMs+=speechRunMs-duration;
      generation++;request?.abort();request=null;committing=false;quietMs=0;phase('listening');
      diagnostic.event('vad.resumed',{reason:'speech_during_transcription'});
    }
    windowMs+=duration;minRms=Math.min(minRms,rms);maxRms=Math.max(maxRms,rms);
    if(windowMs>=1000){diagnostic.event('vad.window',{windowMs,minRms,maxRms,rms,voicedMs,quietMs,threshold,speaking,muted,sampleRate:24000});windowMs=0;minRms=1;maxRms=0;}
    const confirmedSpeech=voiced&&(!repairs.enabled||speechRunMs>=resumeConfirmationMs);
    if(confirmedSpeech)speechEndedAt=diagnostic.now();
    // Echo cancellation is requested from the browser; text matching also guards speaker echo.
    if(!speaking){
      if(frames.reduce((sum,p)=>sum+p.byteLength,0)<20*1024*1024)frames.push(buffer.slice(0));
      if(voiced){if(!voicedMs)onVoiceActivity(true);voicedMs+=duration;clearTimer(reminder);}
      if(confirmedSpeech)quietMs=0;
      else if(voicedMs>=350&&!voiced)quietMs+=duration;
    }
    if(ready&&socket?.readyState===1){
      if(socket.bufferedAmount>96000){liveFailed('Mạng quá chậm để truyền micro trực tiếp.');return;}
      try{
        socket.send(buffer);
        uncommittedBytes+=buffer.byteLength;
        // A short pause refreshes captions; continuous speech also gets a preview.
        // Only the existing turn-end path can submit the complete recording.
        if(repairs.enabled&&!speaking&&!echoWindow){
          if(rms>=threshold)uncommittedVoiceMs+=duration;
          if(uncommittedVoiceMs>=2200||(uncommittedVoiceMs>=350&&quietMs>=450))commitCaptions();
        }
      }catch{liveFailed('Không truyền được âm thanh trực tiếp.');}
    }else if(!liveUnavailable&&queuedBytes+buffer.byteLength<=480000){pendingFrames.push(buffer.slice(0));queuedBytes+=buffer.byteLength;}
    if(!speaking){
      if(!voiced&&quietMs>=silenceMs)void finishTurn();
      else void previewRecording();
    }
  }
  async function say(kind,text,next=null){
    if(!active)return;
    const version=++generation;cancelAudio('new_speech');clearTimer(reminder);
    const speechSegment=++segmentId,ttsStarted=diagnostic.now();
    diagnostic.event('tts.request',{segmentId:speechSegment,speechKind:kind,textChars:text.length,source:'live',model:'server_config',voiceId:'server_config',speed:1,pitch:'provider_default',sampleRate:24000,format:'wav'});
    // Do not let speaker echo or an early transcript cut off a new question
    // and start its answer timer before the student has heard it.
    protectedSpeech=kind==='GREETING'||kind==='CLOSING'||(repairs.enabled&&kind==='PROMPT');
    paused=false;speaking=true;aiText=text;speechKind=kind;phase('speaking');
    if(!protectedSpeech)void connect(version);
    request=new env.AbortController();
    try{
      const voiceRequest=request;
      let blob;
      for(let attempt=0;attempt<(repairs.enabled?2:1);attempt++){
        try{
          if(!active||version!==generation||voiceRequest.signal.aborted)throw new Error('Cancelled voice request');
          blob=await api.conversationVoice(getAttemptId(),promptId,kind,{signal:voiceRequest.signal});break;
        }catch(error){
          if(!repairs.enabled||attempt===1||!active||version!==generation||voiceRequest.signal.aborted
              ||[400,401,403,404,409,422,429].includes(error?.status))throw error;
          diagnostic.event('tts.retry',{segmentId:speechSegment,speechKind:kind,reason:'transient_failure'});
        }
      }
      if(!active||version!==generation)return;
      diagnostic.event('tts.ready',{segmentId:speechSegment,speechKind:kind,elapsedMs:diagnostic.now()-ttsStarted,audioBytes:blob.size,source:'live'});
      objectUrl=env.URL.createObjectURL(blob);player=new env.Audio(objectUrl);
      const done=()=>{
        if(!active||version!==generation)return;
        diagnostic.event('audio.ended',{segmentId:speechSegment,speechKind:kind,elapsedMs:diagnostic.now()-ttsStarted});
        cancelAudio('ended');protectedSpeech=false;
        if(next){next();return;}
        if(kind==='CLOSING'){stop();onPhase('finished');return;}
        listen();
      };
      player.onended=done;player.onerror=()=>{diagnostic.event('audio.error',{segmentId:speechSegment,speechKind:kind});if(version===generation)useBrowser('Không phát được giọng đọc AI.');};
      audioTimer=env.setTimeout(()=>{if(version===generation)useBrowser('Giọng đọc AI bị gián đoạn.');},120000);
      await player.play();
      if(active&&version===generation)onSpoken(text);
      diagnostic.event('audio.play_started',{segmentId:speechSegment,speechKind:kind,elapsedMs:diagnostic.now()-ttsStarted,source:'live',playbackRate:player.playbackRate??1,sampleRate:24000,format:'wav'});
    }catch{diagnostic.event('tts.error',{segmentId:speechSegment,speechKind:kind,status:request?.signal.aborted?'aborted':'failed',elapsedMs:diagnostic.now()-ttsStarted});if(active&&version===generation)useBrowser('Chưa tải được giọng đọc AI.');}
  }
  return {
    async start(){
      if(!env.navigator?.mediaDevices?.getUserMedia||!env.AudioWorkletNode){
        active=true;useBrowser('Trình duyệt chưa hỗ trợ micro trực tiếp.');return browserReady;
      }
      active=true;const version=++generation;
      try{
        const obtained=await env.navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
        if(!active||version!==generation){obtained.getTracks().forEach(t=>t.stop());return false;}stream=obtained;
        const Context=env.AudioContext||env.webkitAudioContext;context=new Context({sampleRate:24000});
        await context.audioWorklet.addModule(new URL('./pcm-recorder.worklet.js',import.meta.url));
        if(!active||version!==generation){stop();return false;}
        source=context.createMediaStreamSource(stream);node=new env.AudioWorkletNode(context,'viva-pcm-recorder');
        diagnostic.event('microphone.opened',{captureRate:context.sampleRate??24000,sampleRate:24000,format:'pcm16',silenceMs,reminderMs,threshold});
        gain=context.createGain();gain.gain.value=0;node.port.onmessage=event=>frame(event.data);
        source.connect(node);node.connect(gain);gain.connect(context.destination);await context.resume();return true;
      }catch(error){
        if(!active)return false;
        if(error?.name==='NotAllowedError'||error?.name==='NotFoundError')failToText('Không truy cập được micro. Em có thể tiếp tục bằng văn bản.');
        else useBrowser('Micro trực tiếp chưa sẵn sàng.');
        return browserReady;
      }
    },
    present(text,{introduction='',preserveTranscript=false,promptId:nextPrompt}={}){
      if(!active)return;promptId=nextPrompt;
      questionText=text;
      if(fallback){if(!preserveTranscript)browserCarry='';fallback.present(text,{introduction,preserveTranscript});return;}
      pause();paused=false;frames=preserveTranscript&&repairs.enabled?frames:[];items.clear();voicedMs=quietMs=0;reminded=false;liveUnavailable=false;
      previewVoicedMs=0;previewText='';
      speechEndedAt=null;commitAt=null;windowMs=0;minRms=1;maxRms=0;
      prefix=preserveTranscript?transcript:'';
      if(!preserveTranscript){transcript='';onTranscript('');}
      const kind=preserveTranscript?'REPLAY':'PROMPT';
      if(introduction.trim())void say('GREETING',introduction,()=>say(kind,text));else void say(kind,text);
    },
    setMuted(value){
      muted=!!value;fallback?.setMuted(muted);
      stream?.getAudioTracks().forEach(track=>{track.enabled=!muted;});
      if(muted){clearTimer(reminder);quietMs=0;}else if(!paused&&!speaking)armReminder();
    },
    closeWith(text){if(fallback)fallback.closeWith(text);else {pause();void say('CLOSING',text);}},
    pause,stop,
  };
}
