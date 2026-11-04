import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseRecords,summarize} from '../scripts/summarize-interview-diagnostics.mjs';
test('summary joins only browser monotonic timing and reports p50/p95 without inventing missing data',()=>{
  const records=[{event:'vad.commit',sourceRuntime:'browser',attemptId:'a',monotonicMs:2000,fromSpeechEndMs:1500},
    {event:'audio.play_started',sourceRuntime:'browser',attemptId:'a',monotonicMs:4500},
    {event:'llm.end',sourceRuntime:'backend',elapsedMs:800}, {event:'llm.end',sourceRuntime:'backend',elapsedMs:1000}];
  const output=summarize(records);assert.deepEqual(output.metrics.find(row=>row.stage==='backend:llm.end'),{stage:'backend:llm.end',count:2,p50Ms:800,p95Ms:1000});
  assert.equal(output.metrics.find(row=>row.stage==='browser:pipeline.speech_end_to_audio').p50Ms,4000);
  assert.match(summarize([]).notes[0],/NO_SESSION_DATA/);
  assert.equal(parseRecords('prefix INTERVIEW_DIAG '+JSON.stringify(records[0])+'\nnot json').length,1);
});
