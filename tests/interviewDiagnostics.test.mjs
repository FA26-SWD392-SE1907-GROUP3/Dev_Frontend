import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createInterviewDiagnostics} from '../src/services/interviewDiagnostics.js';

test('diagnostics contain counts and voice metadata but no transcript, answer key, body or credential',()=>{
  const output=[],env={console:{debug:value=>output.push(value)},performance:{now:()=>12}};
  const diagnostic=createInterviewDiagnostics({env,enabled:true,getContext:()=>({attemptId:'attempt',promptId:'prompt'})});
  diagnostic.event('audio.play_started',{model:'gpt-realtime-2.1-mini',voiceId:'marin',speed:1,sampleRate:24000,
    text:'PRIVATE-TRANSCRIPT',referenceAnswer:'PRIVATE-KEY',apiKey:'sk-private',body:{audio:'private'},textChars:30});
  assert.equal(env.__aivesInterviewDiagnostics.length,1);assert.equal(env.__aivesInterviewDiagnostics[0].textChars,30);
  assert.equal(env.__aivesInterviewDiagnostics[0].voiceId,'marin');assert.doesNotMatch(output.join(''),/PRIVATE|sk-private|referenceAnswer|apiKey/);
});
test('diagnostics are disabled unless explicitly enabled and logging failures do not escape',()=>{
  const env={console:{debug(){throw new Error('console unavailable');}}};
  createInterviewDiagnostics({env,enabled:false}).event('off');assert.equal(env.__aivesInterviewDiagnostics,undefined);
  assert.doesNotThrow(()=>createInterviewDiagnostics({env,enabled:true}).event('on',{textChars:1}));
});
test('the browser ring buffer is bounded and keeps independent model/voice metadata for audio sources',()=>{
  const env={};const diagnostic=createInterviewDiagnostics({env,enabled:true});
  for(let i=0;i<2001;i++)diagnostic.event('audio',{source:'live',model:'gpt-realtime-2.1-mini',voiceId:'marin',segmentId:i});
  diagnostic.event('audio',{source:'browser',model:'browser_speechSynthesis',voiceId:'system-voice',segmentId:2001});
  assert.equal(env.__aivesInterviewDiagnostics.length,2000);
  assert.equal(env.__aivesInterviewDiagnostics.at(-1).source,'browser');
  assert.equal(env.__aivesInterviewDiagnostics[0].segmentId,2);
});
