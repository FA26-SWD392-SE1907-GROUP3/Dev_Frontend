import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWebSpeech } from '../src/services/webSpeech.js';

function setup({ supported = true } = {}) {
  let now = 0, next = 0, cancelled = 0;
  const timers = new Map(), recognitions = [], utterances = [], answers = [], phases = [], fallback = [], transcripts = [], listening = [];
  const env = {
    setTimeout(fn, delay) { const id = ++next; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    SpeechRecognition: class {
      constructor() { recognitions.push(this); }
      start() {} abort() { this.aborted = true; }
    },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    speechSynthesis: { cancel() { cancelled++; }, getVoices: () => [], speak: value => utterances.push(value) },
  };
  if (!supported) delete env.SpeechRecognition;
  const engine = createWebSpeech({ env, onAnswer: text => answers.push(text), onPhase: value => phases.push(value),
    onListening: () => listening.push(true), onFallback: value => fallback.push(value), onTranscript: value => transcripts.push(value) });
  function tick(ms) {
    const end = now + ms;
    while (true) {
      const entry = [...timers].filter(([, value]) => value.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!entry) break;
      now = entry[1].at; timers.delete(entry[0]); entry[1].fn();
    }
    now = end;
  }
  const sayResult = text => recognitions.at(-1).onresult({ results: [[{ transcript: text }]] });
  return { engine, env, tick, sayResult, answers, phases, fallback, transcripts, listening, recognitions, utterances, cancelled: () => cancelled };
}

test('silence sends one answer after 1.5 seconds and includes the latest interim result', () => {
  const s = setup(); s.engine.start(); s.engine.present('Câu hỏi?'); s.utterances.at(-1).onend();
  s.sayResult('Tôi nghĩ'); s.tick(1400); assert.deepEqual(s.answers, []);
  s.sayResult('Tôi nghĩ nên tách trách nhiệm'); s.tick(1499); assert.deepEqual(s.answers, []);
  s.tick(1); assert.deepEqual(s.answers, ['Tôi nghĩ nên tách trách nhiệm']);
  s.tick(10000); assert.equal(s.answers.length, 1); s.engine.stop();
});

test('empty silence prompts gently once and never submits an empty answer', () => {
  const s = setup(); s.engine.start(); s.engine.present('Câu hỏi?'); s.utterances.at(-1).onend();
  s.tick(8000); assert.equal(s.utterances.length, 2); assert.match(s.utterances.at(-1).text, /bình tĩnh/);
  s.utterances.at(-1).onend(); s.tick(20000);
  assert.equal(s.utterances.length, 2); assert.deepEqual(s.answers, []); s.engine.stop();
});

test('recognized student barge-in cancels AI speech and ignores its stale onend callback', () => {
  const s = setup(); s.engine.start(); s.engine.present('Một câu hỏi đang được đọc?');
  const old = s.utterances.at(-1), count = s.cancelled();
  s.recognitions.at(-1).onspeechstart(); assert.equal(s.cancelled(), count);
  s.sayResult('Xin giải thích');assert.equal(s.cancelled(),count+1);
  assert.equal(s.phases.at(-1), 'listening');
  old.onend(); s.tick(1500);
  assert.deepEqual(s.answers, ['Xin giải thích']); s.engine.stop();
});

test('recognition restarts without losing words or duplicating browser result lists', () => {
  const s = setup(); s.engine.start(); s.engine.present('Câu hỏi?'); s.utterances.at(-1).onend();
  s.sayResult('Đầu câu'); s.recognitions.at(-1).onend(); s.tick(250);
  s.sayResult('cuối câu'); s.sayResult('cuối câu đầy đủ'); s.tick(1500);
  assert.deepEqual(s.answers, ['Đầu câu cuối câu đầy đủ']); s.engine.stop();
});

test('unsupported browsers and denied microphones enter text fallback and clean up timers', () => {
  const s = setup({ supported: false });
  assert.equal(s.engine.start(), false); assert.equal(s.fallback.length, 1);
  const denied = setup(); denied.engine.start(); denied.recognitions[0].onerror({ error: 'not-allowed' });
  assert.equal(denied.fallback.length, 1); assert.equal(denied.recognitions[0].aborted, true);
  denied.tick(10000); assert.deepEqual(denied.answers, []);
});

test('leaving a conversation cancels pending answers and stale synthesis callbacks', () => {
  const s = setup(); s.engine.start(); s.engine.present('Câu hỏi?'); s.utterances.at(-1).onend();
  s.sayResult('Chưa gửi'); s.engine.stop(); s.tick(10000); s.utterances.at(-1).onend();
  assert.deepEqual(s.answers, []);
});

test('muting the microphone keeps captured words and does not submit until unmuted',()=>{
  const s=setup();s.engine.start();s.engine.present('Câu hỏi?');s.utterances.at(-1).onend();
  s.sayResult('Đầu câu');const previous=s.recognitions.at(-1);
  s.engine.setMuted(true);s.tick(10000);assert.deepEqual(s.answers,[]);assert.equal(previous.aborted,true);
  s.engine.setMuted(false);s.sayResult('cuối câu');s.tick(1500);
  assert.deepEqual(s.answers,['Đầu câu cuối câu']);s.engine.stop();
});

test('muting does not stop AI speech and finishing speech while muted never opens recognition',()=>{
  const s=setup();s.engine.start();s.engine.present('AI đang hỏi?');
  const count=s.cancelled();s.engine.setMuted(true);s.utterances.at(-1).onend();s.tick(12000);
  assert.equal(s.cancelled(),count);assert.deepEqual(s.answers,[]);
  const recognitions=s.recognitions.length;s.engine.setMuted(false);assert.equal(s.recognitions.length,recognitions+1);s.engine.stop();
});

test('new AI turn never reuses cumulative recognition results from the previous turn',()=>{
  const s=setup();s.engine.start();s.engine.present('Câu một?');s.utterances.at(-1).onend();
  s.sayResult('Câu cũ');s.tick(1500);const previous=s.recognitions.at(-1);
  s.engine.present('Câu hai?');s.utterances.at(-1).onend();
  previous.onresult({results:[[{transcript:'Kết quả cũ đến muộn'}]]});s.sayResult('Chỉ câu mới');s.tick(1500);
  assert.deepEqual(s.answers,['Câu cũ','Chỉ câu mới']);s.engine.stop();
});


test('closing acknowledgement finishes speech without opening another answer turn',()=>{
  const s=setup();s.engine.start();s.engine.present('Câu hỏi?');s.utterances.at(-1).onend();
  s.engine.closeWith('Cảm ơn em đã trao đổi.');const count=s.recognitions.length;
  s.utterances.at(-1).onend();s.tick(20000);
  assert.equal(s.recognitions.length,count);assert.equal(s.phases.at(-1),'finished');assert.deepEqual(s.answers,[]);
});


test('permission warmup cannot submit speech before any question is presented',()=>{
  const s=setup();s.engine.start();s.sayResult('Lời nói trước khi vào phòng');s.tick(10000);
  assert.deepEqual(s.answers,[]);assert.deepEqual(s.transcripts,[]);assert.equal(s.listening.length,0);s.engine.stop();
});

test('introduction must finish then the actual question must finish before the answer timer starts',()=>{
  const s=setup();s.engine.start();const warmup=s.recognitions.at(-1);
  s.engine.present('Vì sao em chọn cách tách trách nhiệm?',{introduction:'Chào em, chúng ta cùng bắt đầu nhé.'});
  assert.equal(s.utterances.at(-1).text,'Chào em, chúng ta cùng bắt đầu nhé.');
  assert.equal(warmup.aborted,true);warmup.onresult({results:[[{transcript:'Chào em chúng ta cùng bắt đầu nhé'}]]});s.tick(2000);
  assert.deepEqual(s.answers,[]);assert.equal(s.listening.length,0);
  s.utterances.at(-1).onend();assert.equal(s.utterances.at(-1).text,'Vì sao em chọn cách tách trách nhiệm?');
  assert.equal(s.listening.length,0);s.utterances.at(-1).onend();assert.equal(s.listening.length,1);
  s.sayResult('Em muốn mỗi phần có thể thay đổi riêng.');s.tick(1500);assert.deepEqual(s.answers,['Em muốn mỗi phần có thể thay đổi riêng.']);s.engine.stop();
});

test('noise and recognition of the AI question cannot interrupt or submit the question as a student answer',()=>{
  const s=setup();s.engine.start();s.engine.present('Vì sao em chọn cách tách trách nhiệm?');
  const before=s.cancelled();s.recognitions.at(-1).onspeechstart();assert.equal(s.cancelled(),before);
  s.sayResult('Vì sao em chọn cách tách trách nhiệm');s.tick(2000);
  assert.equal(s.cancelled(),before);assert.equal(s.listening.length,0);assert.deepEqual(s.answers,[]);
  s.utterances.at(-1).onend();s.sayResult('Vì sao em chọn cách tách trách nhiệm');s.tick(200);
  assert.deepEqual(s.answers,[]);
  s.sayResult('Mỗi phần có thể thay đổi độc lập.');s.tick(1500);assert.deepEqual(s.answers,['Mỗi phần có thể thay đổi độc lập.']);s.engine.stop();
});

test('replaying the question keeps student words and never opens an answer turn before the replay ends',()=>{
  const s=setup();s.engine.start();s.engine.present('Câu hỏi về kiến trúc?');s.utterances.at(-1).onend();
  s.sayResult('Em nghĩ');const prior=s.listening.length;
  s.engine.present('Câu hỏi về kiến trúc?',{preserveTranscript:true});assert.equal(s.listening.length,prior);
  s.utterances.at(-1).onend();s.sayResult('nên tách trách nhiệm');s.tick(1500);
  assert.deepEqual(s.answers,['Em nghĩ nên tách trách nhiệm']);s.engine.stop();
});
