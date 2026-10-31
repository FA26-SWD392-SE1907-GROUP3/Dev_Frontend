import test from 'node:test';
import assert from 'node:assert/strict';
import { createTurnDetector } from '../src/services/turnDetector.js';
const frame = amplitude => new Int16Array(2400).fill(amplitude);

test('thinking silently before speaking does not end a turn',()=>{
  let ended=0;const detect=createTurnDetector({onEnd:()=>ended++});
  for(let i=0;i<200;i++)detect(frame(0));
  assert.equal(ended,0);
});
test('a short pause keeps the microphone open; sustained silence ends once',()=>{
  let ended=0;const detect=createTurnDetector({onEnd:()=>ended++});
  for(let i=0;i<6;i++)detect(frame(3000));
  for(let i=0;i<35;i++)detect(frame(0));
  assert.equal(ended,0);
  for(let i=0;i<5;i++)detect(frame(0));
  assert.equal(ended,1);
  for(let i=0;i<100;i++)detect(frame(0));
  assert.equal(ended,1);
});
test('speaking again resets the silence period and brief noise is ignored',()=>{
  let ended=0;const detect=createTurnDetector({onEnd:()=>ended++});
  detect(frame(3000));for(let i=0;i<80;i++)detect(frame(0));
  assert.equal(ended,0);
  for(let i=0;i<5;i++)detect(frame(3000));
  for(let i=0;i<30;i++)detect(frame(0));
  detect(frame(3000));for(let i=0;i<30;i++)detect(frame(0));
  assert.equal(ended,0);
  for(let i=0;i<10;i++)detect(frame(0));
  assert.equal(ended,1);
});
