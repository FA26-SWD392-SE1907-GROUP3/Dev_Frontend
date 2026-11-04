import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export function parseRecords(text){
  try{const value=JSON.parse(text);if(Array.isArray(value))return value.filter(row=>row&&typeof row.event==='string');}catch{}
  return text.split(/\r?\n/).flatMap(line=>{
    const offset=line.indexOf('INTERVIEW_DIAG ');
    if(offset<0)return [];
    try{const row=JSON.parse(line.slice(offset+15));return row&&typeof row.event==='string'?[row]:[];}catch{return [];}
  });
}
export function summarize(records){
  const values=new Map(),pending=new Map(),voices=new Map(),finishes=new Map();
  const add=(name,value)=>{if(typeof value==='number'&&Number.isFinite(value)&&value>=0){if(!values.has(name))values.set(name,[]);values.get(name).push(value);}};
  for(const row of records){
    const runtime=row.sourceRuntime||'unknown';
    if(row.elapsedMs!==undefined)add(`${runtime}:${row.event}`,row.elapsedMs);
    if(row.firstTokenMs!==undefined)add(`${runtime}:${row.event}:firstTokenMs`,row.firstTokenMs);
    if(row.firstByteMs!==undefined)add(`${runtime}:${row.event}:firstByteMs`,row.firstByteMs);
    if(row.event==='stt.final')add('browser:stt.final:fromSpeechEndMs',row.fromSpeechEndMs);
    if(row.event==='stt.live.final')add('backend:stt.live.final:sinceCommitMs',row.sinceCommitMs);
    if(runtime==='browser'&&row.attemptId&&row.event==='vad.commit'&&row.fromSpeechEndMs>=0)
      pending.set(row.attemptId,row.monotonicMs-row.fromSpeechEndMs);
    if(runtime==='browser'&&row.attemptId&&row.event==='audio.play_started'&&pending.has(row.attemptId)){
      add('browser:pipeline.speech_end_to_audio',row.monotonicMs-pending.get(row.attemptId));pending.delete(row.attemptId);
    }
    if(row.finishReason){const key=`${row.event}:${row.finishReason}`;finishes.set(key,(finishes.get(key)||0)+1);}
    if(row.model&&row.voiceId){const key=JSON.stringify({source:row.source,model:row.model,voiceId:row.voiceId,speed:row.speed,pitch:row.pitch,sampleRate:row.sampleRate,format:row.format});voices.set(key,(voices.get(key)||0)+1);}
  }
  const metrics=[...values].map(([stage,list])=>{const sorted=[...list].sort((a,b)=>a-b);const percentile=p=>sorted[Math.max(0,Math.ceil(p*sorted.length)-1)];return {stage,count:sorted.length,p50Ms:percentile(.5),p95Ms:percentile(.95)};});
  return {recordCount:records.length,metrics,voiceObservations:[...voices].map(([key,count])=>({...JSON.parse(key),count})),finishReasons:Object.fromEntries(finishes),
    notes:records.length?['Counts describe log events, not unique generated clips.','server_config/unknown_cached cannot prove voice identity.','No cross-machine clock subtraction; pipeline timing uses browser monotonic timestamps only.']:['NO_SESSION_DATA: reproduce a real session with diagnostics enabled; no latency baseline can be inferred.']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const files=process.argv.slice(2);if(!files.length){console.error('Usage: node scripts/summarize-interview-diagnostics.mjs backend.log browser.json');process.exitCode=1;}
  else console.log(JSON.stringify(summarize(files.flatMap(file=>parseRecords(readFileSync(file,'utf8')))),null,2));
}
