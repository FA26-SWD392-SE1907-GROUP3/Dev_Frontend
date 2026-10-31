import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWebSpeech } from '../src/services/webSpeech.js';

function setup({ supported = true } = {}) {
  let now = 0, next = 0, cancelled = 0;
  const timers = new Map(), recognitions = [], utterances = [], answers = [], phases = [], fallback = [], transcripts = [];
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
    onFallback: value => fallback.push(value), onTranscript: value => transcripts.push(value) });
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
  return { engine, env, tick, sayResult, answers, phases, fallback, transcripts, recognitions, utterances, cancelled: () => cancelled };
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

test('barge-in cancels AI speech immediately and ignores its stale onend callback', () => {
  const s = setup(); s.engine.start(); s.engine.present('Một câu hỏi đang được đọc?');
  const old = s.utterances.at(-1), count = s.cancelled();
  s.recognitions.at(-1).onspeechstart(); assert.equal(s.cancelled(), count + 1);
  assert.equal(s.phases.at(-1), 'listening');
  old.onend(); s.sayResult('Xin giải thích'); s.tick(1500);
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
