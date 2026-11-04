const configured=import.meta.env?.VITE_INTERVIEW_DIAGNOSTICS==='true';
const allowed=new Set(['attemptId','promptId','answerId','segmentId','mode','source','model','voiceId','speed','pitch','sampleRate','format',
  'elapsedMs','fromSpeechEndMs','sinceCommitMs','firstTokenMs','firstByteMs','speechKind','status','reason','errorType','eventType',
  'textChars','rawChars','messageChars','audioBytes','transcriptChars','voicedMs','quietMs','rms','minRms','maxRms','windowMs','silenceMs',
  'reminderMs','threshold','muted','speaking','phase','deadlinePresent','remainingMs','httpStatus','responseBytes','captureRate','playbackRate',
  'ready','sentBytes','queuedBytes','generation','resultFinal','inputChars','followupsUsed','maxFollowups','answerLimitSeconds']);

export function createInterviewDiagnostics({env=globalThis,getContext=()=>({}),enabled}={}){
  const now=()=>{try{return env.performance?.now?.()??Date.now();}catch{return Date.now();}};
  function active(){
    if(typeof enabled==='boolean')return enabled;
    try{return configured||env.sessionStorage?.getItem('aives-interview-diagnostics')==='1';}catch{return configured;}
  }
  function event(name,fields={}){
    if(!active())return;
    try{
      const record={event:name,timestamp:new Date().toISOString(),sourceRuntime:'browser',monotonicMs:now()};
      for(const [key,value]of Object.entries({...getContext(),...fields})){
        if(!allowed.has(key)||value===undefined||value===null)continue;
        if(typeof value==='number'&&Number.isFinite(value)||typeof value==='boolean')record[key]=value;
        else if(typeof value==='string'&&value.length<=180&&!/sk-[a-z0-9]|bearer\s|eyJ[a-z0-9_-]{12}/i.test(value))record[key]=value;
      }
      const records=env.__aivesInterviewDiagnostics??(env.__aivesInterviewDiagnostics=[]);
      records.push(record);if(records.length>2000)records.splice(0,records.length-2000);
      env.console?.debug?.('INTERVIEW_DIAG '+JSON.stringify(record));
    }catch{/* Diagnostic storage or console failure must never interrupt an exam. */}
  }
  return {now,event,enabled:active};
}
