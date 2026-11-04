import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const audioFile=join(tmpdir(),'aives-e2e-voice-turns.wav');
test.use({ permissions: ['microphone'], launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${audioFile}`] } });
test.beforeAll(()=>{
  const samples=24000*10, data=Buffer.alloc(44+samples*2);
  data.write('RIFF');data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(24000,24);data.writeUInt32LE(48000,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(samples*2,40);
  for(let i=0;i<24000*3;i++)data.writeInt16LE(Math.round(Math.sin(2*Math.PI*220*i/24000)*6000),44+i*2);
  writeFileSync(audioFile,data);
});
const ids = { user: 'b37d81ba-6124-49ae-8b4c-1055b439068c', candidate: 'e37d81ba-6124-49ae-8b4c-1055b439068c', attempt: 'a37d81ba-6124-49ae-8b4c-1055b439068c', prompt: 'f37d81ba-6124-49ae-8b4c-1055b439068c', followup: '137d81ba-6124-49ae-8b4c-1055b439068c' };
const user = { id: ids.user, role: 'STUDENT', fullName: 'Viva Student', email: 'student@example.com' };
const token = [Buffer.from('{}').toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, role: user.role, email: user.email, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'signature'].join('.');
function wav() {
  const data = Buffer.alloc(4844); data.write('RIFF'); data.writeUInt32LE(4836, 4); data.write('WAVEfmt ', 8); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22); data.writeUInt32LE(24000, 24); data.writeUInt32LE(48000, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(4800, 40); return data;
}
function initial() {
  const prompt = { id: ids.prompt, questionId: 'question1', sequenceNo: 1, kind: 'MAIN_QUESTION', followupNumber: 0, text: 'Vì sao nên phân chia trách nhiệm?', deadline: null };
  return { attemptId: ids.attempt, status: 'IN_PROGRESS', questionCount: 1, completedQuestions: 0, maxFollowups: 1, maxFollowupsPerQuestion: 2, followupsUsed: 0, answerTimeLimitSeconds: 120, scheduledEnd: new Date(Date.now() + 1200000).toISOString(), serverNow: new Date().toISOString(), prompt, busy: false, needsContinuation: false, answerTurnId: null, error: null, aiConfigured: true,
    turns: [{ ...prompt, speaker: 'AI', speechStatus: 'NONE', hasAudio: false }] };
}
async function setup(page, options = {}) {
  if(options.diagnostics)await page.addInitScript(()=>sessionStorage.setItem('aives-interview-diagnostics','1'));
  if (options.call && !options.cloud) await page.addInitScript(({ denyMic, holdSpeech, denyCamera }) => {
    sessionStorage.setItem('aives-voice-repair','off'); // Existing scenarios also verify the rollback path.
    window.__voiceCancelled = 0;
    window.__spoken=[];window.__mediaRequests=[];
    navigator.mediaDevices.getUserMedia=async constraints=>{window.__mediaRequests.push(constraints);throw new Error('Simulated cloud microphone failure exercises browser speech fallback');};
    class Recognition {
      start() { window.__recognition = this; if (denyMic) setTimeout(() => this.onerror?.({ error: 'not-allowed' }), 10); }
      abort() {}
    }
    window.SpeechRecognition = Recognition;
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      cancel() { window.__voiceCancelled++; }, getVoices() { return []; },
      speak(utterance) { window.__utterance = utterance;window.__spoken.push(utterance.text); if (!holdSpeech) setTimeout(() => utterance.onend?.(), 30); },
    } });
    window.__voiceSay = text => {
      window.__recognition.onspeechstart?.();
      window.__recognition.onresult?.({ results: [[{ transcript: text }]] });
    };
  }, { denyMic: !!options.denyMic, holdSpeech: !!options.holdSpeech,denyCamera:!!options.denyCamera });
  const state = initial(); let draftText="",draftCalls=0; let speechCalls = 0, failedInitialLoad = false, started = false, streamCalls = 0,beginCalls=0;
  const respond = route => route.fulfill({ json: { ...state, serverNow: new Date().toISOString() } });
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/login') return route.fulfill({ json: { code: 200, data: { authenticate: true, token } } });
    if (path === `/api/v1/users/${ids.user}`) return route.fulfill({ json: { code: 200, data: user } });
    if (path === '/api/v1/student/exams') return route.fulfill({ json: [{ id: ids.candidate, examTitle: 'Vấn đáp kiến trúc', courseId: 'course1', status: started ? state.status : 'REGISTERED', action: !started ? 'START' : state.status === 'IN_PROGRESS' ? 'RESUME' : 'VIEW', attemptId: started ? ids.attempt : null, scheduledStart: new Date().toISOString(), scheduledEnd: state.scheduledEnd }] });
    if (path.endsWith('/attempts') && path.startsWith('/api/v1/student/')) return route.fulfill({ json: [{ id: ids.attempt, attemptNo: 1, status: state.status }] });
    if (path === `/api/v1/attempts/start/${ids.candidate}`) { started = true; return route.fulfill({ json: { attemptId: ids.attempt, status: 'IN_PROGRESS' } }); }
    if (path === `/api/v1/interviews/${ids.attempt}`) {
      if (options.initialFailure && !failedInitialLoad) { failedInitialLoad = true; return route.fulfill({ status: 503, json: { message: 'Tạm thời mất kết nối lượt thi.' } }); }
      return respond(route);
    }
    if(path.endsWith('/draft')){draftCalls++;draftText=route.request().postDataJSON().text;return route.fulfill({status:204});}
    if(path.endsWith('/continue/stream')){
      state.needsContinuation=false;state.status='COMPLETED';state.completedQuestions=1;
      return route.fulfill({contentType:'text/event-stream',body:'event: complete\ndata: '+JSON.stringify({...state,serverNow:new Date().toISOString()})+'\n\n'});
    }
    if (path.endsWith('/begin')) {
      beginCalls++;
      expect(route.request().postDataJSON().promptId).toBe(state.prompt.id);
      state.prompt.deadline ||= new Date(Date.now() + (options.shortDeadline ? 1200 : 120000)).toISOString(); return respond(route);
    }
    if (path.includes('/speech/')) { speechCalls++; return route.fulfill({ contentType: 'audio/wav', body: wav() }); }
    if (path.endsWith('/voice')) { speechCalls++; if(options.voiceFailure)return route.fulfill({status:503,json:{message:'Giọng đọc tạm gián đoạn.'}});return route.fulfill({ contentType: 'audio/wav', body: wav() }); }
    if (path.endsWith('/voice-ticket')) return route.fulfill({ json: { ticket: 'one-use-ticket', path: '/api/v1/interviews/live' } });
    if (path.endsWith('/transcribe')) return route.fulfill({json:{text:options.cloud?'Em tách trách nhiệm để dễ bảo trì và kiểm thử.':'Nội dung nhận dạng dự phòng.'}});
    if (path.endsWith('/live-ticket')) return route.fulfill({ json: { ticket: 'one-use-ticket', path: '/api/v1/interviews/live' } });
    if (path.endsWith('/turns/stream')) {
      streamCalls++;
      const body = route.request().postDataJSON();
      expect(route.request().headers()['content-type']).toContain('application/json');
      if (state.needsContinuation) {
        expect(body.promptId).toBe(ids.prompt);
        state.needsContinuation = false; state.error = null; state.status = 'COMPLETED'; state.completedQuestions = 1;
        return route.fulfill({ contentType: 'text/event-stream', body: `event: complete\ndata: ${JSON.stringify({ ...state, serverNow: new Date().toISOString() })}\n\n` });
      }
      expect(body.promptId).toBe(state.prompt.id);
      const followup = state.prompt.followupNumber;
      state.turns.push({ id: `answer-${followup}`, questionId: 'question1', sequenceNo: 1, speaker: 'STUDENT', kind: 'MAIN_ANSWER', followupNumber: followup, text: body.text, speechStatus: 'SUCCEEDED', hasAudio: false });
      if (options.streamFailure) {
        state.prompt = null; state.needsContinuation = true; state.answerTurnId = 'answer-0';
        state.error = 'AI tạm thời gián đoạn, câu trả lời đã lưu.';
        return route.fulfill({ contentType: 'text/event-stream', body: `event: saved\ndata: {"answerTurnId":"answer-0"}\n\nevent: error\ndata: ${JSON.stringify({ message: state.error })}\n\n` });
      }
      if (!followup) {
        state.prompt = { id: ids.followup, questionId: 'question1', sequenceNo: 1, kind: 'FOLLOWUP_QUESTION', followupNumber: 1, text: 'Bạn có thể nêu ví dụ cụ thể?', deadline: null };
        state.turns.push({ ...state.prompt, speaker: 'AI', speechStatus: 'NONE', hasAudio: false });
      } else { state.prompt = null; state.status = 'COMPLETED'; state.completedQuestions = 1; }
      const speech=options.feedback&&state.prompt?`event: speech\ndata: ${JSON.stringify({promptId:state.prompt.id,text:'Mình hiểu ý bạn về tách trách nhiệm. '+state.prompt.text})}\n\n`:'';
      return route.fulfill({ contentType: 'text/event-stream', body: `event: saved\ndata: {"answerTurnId":"answer-${followup}"}\n\nevent: delta\ndata: ${JSON.stringify({ text: state.prompt?.text || '' })}\n\n${speech}event: complete\ndata: ${JSON.stringify({ ...state, serverNow: new Date().toISOString() })}\n\n` });
    }
    if (path.endsWith('/audio-answers')) {
      expect(route.request().headers()['content-type']).toContain('multipart/form-data');
      expect(route.request().postDataBuffer().toString('latin1')).toContain(state.prompt.id);
      const isFollowup = state.prompt.followupNumber;
      state.turns.push({ id: `student-audio-${isFollowup}`, speaker: 'STUDENT', questionId: 'question1', sequenceNo: 1, kind: isFollowup ? 'FOLLOWUP_ANSWER' : 'MAIN_ANSWER', followupNumber: isFollowup, text: 'Bản nhận dạng chính thức từ bản ghi.', speechStatus: 'SUCCEEDED', hasAudio: true });
      if (options.call && !isFollowup) {
        state.prompt = { id: ids.followup, questionId: 'question1', sequenceNo: 1, kind: 'FOLLOWUP_QUESTION', followupNumber: 1, text: 'Bạn có thể nêu ví dụ cụ thể?', deadline: null };
        state.turns.push({ ...state.prompt, speaker:'AI', speechStatus:'NONE', hasAudio:false });
      } else { state.prompt = null; state.status = 'COMPLETED'; state.completedQuestions = 1; }
      return respond(route);
    }
    if (path.endsWith('/answers')) {
      const body = route.request().postDataJSON(); expect(body.promptId).toBe(state.prompt.id);
      const followup = state.prompt.followupNumber;
      state.turns.push({ id: `answer-${followup}`, questionId: 'question1', sequenceNo: 1, speaker: 'STUDENT', kind: followup ? 'FOLLOWUP_ANSWER' : 'MAIN_ANSWER', followupNumber: followup, text: body.text, speechStatus: 'SUCCEEDED', hasAudio: false });
      if (options.providerFailure) { state.prompt = null; state.error = 'AI tạm thời gián đoạn.'; state.needsContinuation = true; state.answerTurnId = 'answer-0'; }
      else if (!followup) { state.prompt = { id: ids.followup, questionId: 'question1', sequenceNo: 1, kind: 'FOLLOWUP_QUESTION', followupNumber: 1, text: 'Bạn có thể nêu ví dụ cụ thể?', deadline: null }; state.turns.push({ ...state.prompt, speaker: 'AI', speechStatus: 'NONE', hasAudio: false }); }
      else { state.prompt = null; state.status = 'COMPLETED'; state.completedQuestions = 1; }
      return respond(route);
    }
    if (path.endsWith('/continue')) { expect(route.request().postDataJSON().answerTurnId).toBe('answer-0'); state.needsContinuation = false; state.error = null; state.status = 'COMPLETED'; state.completedQuestions = 1; return respond(route); }
    if (path.endsWith('/timeout')) {
      expect(route.request().postDataJSON().promptId).toBe(ids.prompt);
      if(options.call&&draftText){state.turns.push({id:'deadline-answer',questionId:'question1',sequenceNo:1,speaker:'STUDENT',kind:'MAIN_ANSWER',followupNumber:0,text:draftText,speechStatus:'SUCCEEDED',hasAudio:false});state.answerTurnId='deadline-answer';state.needsContinuation=true;}
      else{state.status='COMPLETED';state.completedQuestions=1;}
      state.prompt=null;return respond(route);
    }
    return route.fulfill({ status: 404, json: { message: 'Unexpected endpoint ' + path } });
  });
  await page.goto('/');
  await page.getByPlaceholder('lecturer@example.com').fill(user.email); await page.getByPlaceholder('Nhập mật khẩu').fill('test123456'); await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByRole('button', { name: 'Vào phòng thi', exact: true }).click();
  if (!options.call){await page.getByText('Tùy chọn kết nối',{exact:true}).click();await page.getByRole('button', { name: 'Chuyển sang chế độ dự phòng', exact: true }).click();}
  if(!options.prejoin)await page.getByRole('button', { name: options.call?'Tham gia phỏng vấn':'Bắt đầu lượt thi', exact: true }).click();
  if (options.initialFailure) { await expect(page.getByText('Tạm thời mất kết nối lượt thi.', { exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Tải lại lượt thi', exact: true }).click(); }
  if(!options.call)await expect(page.getByText('Vì sao nên phân chia trách nhiệm?', { exact: true }).first()).toBeVisible();
  return { state, speechCalls: () => speechCalls, streamCalls: () => streamCalls,beginCalls:()=>beginCalls,draftCalls:()=>draftCalls };
}

test('text viva restores the deadline after reload and asks an adaptive followup', async ({ page }) => {
  const context = await setup(page);
  await page.getByRole('button', { name: 'Bắt đầu trả lời bằng văn bản', exact: true }).click();
  const deadline = context.state.prompt.deadline;
  await page.getByLabel('Câu trả lời bằng văn bản').fill('Các thành phần nên có vai trò riêng.');
  await page.reload(); await page.getByRole('button', { name: 'Tiếp tục thi', exact: true }).click();
  await expect(page.getByRole('timer')).toBeVisible(); expect(context.state.prompt.deadline).toBe(deadline);
  await page.getByLabel('Câu trả lời bằng văn bản').fill('Các thành phần nên có vai trò riêng.');
  await page.getByRole('button', { name: 'Nộp câu trả lời', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Câu 1 · Hỏi đào sâu 1', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Bắt đầu trả lời bằng văn bản', exact: true }).click();
  await page.getByLabel('Câu trả lời bằng văn bản').fill('Ví dụ tách truy cập database khỏi giao diện.');
  await page.getByRole('button', { name: 'Nộp câu trả lời', exact: true }).click();
  await expect(page.getByText('Đã hoàn thành lượt thi.', { exact: false })).toBeVisible(); expect(context.speechCalls()).toBeGreaterThan(0);
});

test('voice viva displays live captions and submits a real browser recording', async ({ page }) => {
  await page.routeWebSocket('**/api/v1/interviews/live?*', socket => {
    let sent = false; socket.send(JSON.stringify({ type: 'ready' }));
    socket.onMessage(message => { if (typeof message !== 'string' && !sent) { sent = true; socket.send(JSON.stringify({ type: 'delta', itemId: 'live1', text: 'Đang nhận dạng câu trả lời trực tiếp.' })); } });
  });
  await setup(page);
  await page.getByRole('button', { name: 'Bắt đầu ghi âm', exact: true }).click();
  await expect(page.getByText('Đang nhận dạng câu trả lời trực tiếp.', { exact: true })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Dừng ghi âm', exact: true }).click();
  await page.getByRole('button', { name: 'Nộp bản ghi', exact: true }).click();
  await expect(page.getByText('Bản nhận dạng chính thức từ bản ghi.', { exact: true })).toBeVisible();
  await expect(page.getByText('Đã hoàn thành lượt thi.', { exact: false })).toBeVisible();
  await page.screenshot({ path: 'test-results/interview.png', fullPage: true });
});

test('empty answer times out and provider failure preserves an accepted answer', async ({ page }) => {
  await setup(page, { shortDeadline: true });
  await page.getByRole('button', { name: 'Bắt đầu trả lời bằng văn bản', exact: true }).click();
  await expect(page.getByText('Đã hoàn thành lượt thi.', { exact: false })).toBeVisible({ timeout: 10000 });
});

test('a failed AI followup can be retried without resubmitting the saved answer', async ({ page }) => {
  await setup(page, { providerFailure: true });
  await page.getByRole('button', { name: 'Bắt đầu trả lời bằng văn bản', exact: true }).click();
  await page.getByLabel('Câu trả lời bằng văn bản').fill('Câu trả lời phải được giữ lại.');
  await page.getByRole('button', { name: 'Nộp câu trả lời', exact: true }).click();
  await expect(page.getByText('AI tạm thời gián đoạn.', { exact: true })).toBeVisible();
  await expect(page.getByText('Câu trả lời phải được giữ lại.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục phỏng vấn', exact: true }).click();
  await expect(page.getByText('Đã hoàn thành lượt thi.', { exact: false })).toBeVisible();
});

test('an initial connection failure can be retried without losing the attempt', async ({ page }) => {
  await setup(page, { initialFailure: true });
  await expect(page.getByRole('button', { name: 'Bắt đầu ghi âm', exact: true })).toBeEnabled();
});

test('a slow interview refresh does not queue more polls and polling recovers afterwards', async ({ page }) => {
  const { state } = await setup(page);
  await page.clock.install();
  let requests = 0;
  let release;
  const blocked = new Promise(resolve => { release = resolve; });
  await page.route(`**/api/v1/interviews/${ids.attempt}`, async route => {
    requests++;
    if (requests === 1) await blocked;
    await route.fulfill({ json: { ...state, serverNow: new Date().toISOString() } });
  });
  await page.clock.runFor(3100);
  await expect.poll(() => requests).toBe(1);
  await page.clock.runFor(15000);
  expect(requests).toBe(1);
  const response = page.waitForResponse(response => new URL(response.url()).pathname === `/api/v1/interviews/${ids.attempt}`);
  release();
  await response;
  await page.clock.runFor(3100);
  await expect.poll(() => requests).toBe(2);
});

test('cloud microphone streams live captions, commits after silence and continues through an adaptive followup',async({page})=>{
  let commits=0,bytes=0;
  await page.addInitScript(()=>{
    window.__cloudMedia=[];
    const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia=constraints=>{window.__cloudMedia.push(constraints);return original(constraints);};
  });
  await page.routeWebSocket('**/api/v1/interviews/live?*',socket=>{
    socket.send(JSON.stringify({type:'ready'}));
    socket.onMessage(message=>{
      if(typeof message==='string'){
        if(JSON.parse(message).type==='commit'){commits++;socket.send(JSON.stringify({type:'final',itemId:'answer',text:'Em tách trách nhiệm để dễ bảo trì và kiểm thử.'}));}
      }else{bytes+=message.length;}
    });
  });
  const context=await setup(page,{call:true,cloud:true,diagnostics:true});
  const room=page.getByRole('region',{name:'Cuộc phỏng vấn trực tiếp'});
  await expect(room.getByText('Đang nghe em',{exact:true})).toBeVisible({timeout:15000});
  await expect(room.locator('[aria-label="Phụ đề trực tiếp"]')).toContainText('Em tách trách nhiệm');
  expect(context.streamCalls()).toBe(0);
  await expect.poll(()=>context.streamCalls(),{timeout:20000}).toBeGreaterThan(0);
  expect(commits).toBeGreaterThan(0);expect(bytes).toBeGreaterThan(0);expect(context.speechCalls()).toBeGreaterThan(1);
  expect(context.state.turns.find(t=>t.speaker==='STUDENT').text).toBe('Em tách trách nhiệm để dễ bảo trì và kiểm thử.');
  await expect(room.locator('[aria-label="Phụ đề trực tiếp"]')).toContainText('Thí sinh · Lượt trước');
  expect(await page.evaluate(()=>window.__cloudMedia)).toEqual([{audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false}]);
  const diagnostics=await page.evaluate(()=>window.__aivesInterviewDiagnostics||[]);
  expect(diagnostics.some(row=>row.event==='vad.commit'&&row.silenceMs===3500)).toBeTruthy();
  expect(diagnostics.some(row=>row.event==='audio.play_started')).toBeTruthy();
  expect(JSON.stringify(diagnostics)).not.toContain('Em tách trách nhiệm');
  writeFileSync('test-results/phase0-browser-diagnostics.json',JSON.stringify(diagnostics,null,2));
});

test('repair keeps recording and the cloud voice when live STT disconnects after greeting',async({page})=>{
  await page.addInitScript(()=>{
    window.__browserSpeechCount=0;
    const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia=async constraints=>{const stream=await original(constraints);window.__repairStream=stream;return stream;};
    speechSynthesis.speak=()=>{window.__browserSpeechCount++;throw new Error('Browser TTS must not be used');};
  });
  await page.routeWebSocket('**/api/v1/interviews/live?*',socket=>{
    let failed=false;socket.send(JSON.stringify({type:'ready'}));
    socket.onMessage(message=>{if(typeof message!=='string'&&!failed){failed=true;socket.send(JSON.stringify({type:'error',message:'Fixture live STT disconnect'}));}});
  });
  const context=await setup(page,{call:true,cloud:true});
  await expect(page.getByText('Micro vẫn ghi âm',{exact:false})).toBeVisible({timeout:15000});
  expect(await page.evaluate(()=>window.__repairStream.getAudioTracks()[0].readyState)).toBe('live');
  await expect.poll(()=>context.streamCalls(),{timeout:20000}).toBeGreaterThan(0);
  expect(context.state.turns.find(turn=>turn.speaker==='STUDENT').text).toBe('Em tách trách nhiệm để dễ bảo trì và kiểm thử.');
  expect(await page.evaluate(()=>window.__browserSpeechCount)).toBe(0);expect(context.speechCalls()).toBeGreaterThan(1);
});

test('repair retries cloud TTS and switches to text rather than changing to a browser voice',async({page})=>{
  const context=await setup(page,{call:true,cloud:true,voiceFailure:true});
  await expect(page.getByLabel('Câu trả lời',{exact:true})).toBeVisible({timeout:15000});
  await expect(page.getByText('hệ thống không đổi giọng đọc',{exact:false})).toBeVisible();
  expect(context.speechCalls()).toBe(2);expect(context.streamCalls()).toBe(0);
});

test('browser speech sends text and automatically resumes after an adaptive followup', async ({ page }) => {
  const context=await setup(page,{call:true});
  const room=page.getByRole('region',{name:'Cuộc phỏng vấn trực tiếp'});
  await expect(room.getByText('Đang nghe em',{exact:true})).toBeVisible();
  await expect(page.getByLabel('Câu trả lời bằng văn bản')).toHaveCount(0);
  await page.evaluate(() => window.__voiceSay('Tôi đang trình bày câu trả lời.'));
  await expect.poll(()=>context.state.prompt?.followupNumber).toBe(1);
  await expect(room.getByText('Đang nghe em',{exact:true})).toBeVisible();
  await page.screenshot({path:'test-results/online-interview.png',fullPage:true});
  await page.evaluate(() => window.__voiceSay('Ví dụ tách giao diện khỏi dữ liệu.'));
  await expect(page.getByText('Đã hoàn thành lượt thi.',{exact:false})).toBeVisible();
  expect(context.speechCalls()).toBe(0);
});

test.describe('automatic voice turns',()=>{
  test('barge-in preserves both answers and the exam completes automatically after the followup',async({page})=>{
    const context=await setup(page,{call:true,holdSpeech:true});
    const room=page.getByRole('region',{name:'Cuộc phỏng vấn trực tiếp'});
    await expect(room.getByText('Giám khảo đang nói',{exact:true})).toBeVisible();
    // The greeting is protected; barge-in is enabled on the actual question.
    await page.evaluate(()=>window.__utterance.onend());
    await expect.poll(()=>page.evaluate(()=>window.__spoken.at(-1))).toBe('Vì sao nên phân chia trách nhiệm?');
    const before = await page.evaluate(() => window.__voiceCancelled);
    await page.evaluate(() => window.__voiceSay('Tôi muốn trả lời ngay.'));
    expect(await page.evaluate(() => window.__voiceCancelled)).toBeGreaterThan(before);
    await expect(room.getByText('Đang nghe em',{exact:true})).toBeVisible();
    await expect.poll(()=>context.state.prompt?.followupNumber).toBe(1);
    await expect(room.getByRole('button',{name:'Kết thúc',exact:true})).toHaveCount(0);
    await expect(page.getByText('Đã hoàn thành lượt thi.',{exact:false})).toHaveCount(0);
    await page.evaluate(() => window.__voiceSay('Em xin làm rõ phần trả lời trước.'));
    await expect(page.getByText('Đã hoàn thành lượt thi.',{exact:false})).toBeVisible();
    await expect(page.getByText('Tôi muốn trả lời ngay.',{exact:true})).toBeVisible();
  });
  test('microphone rejection switches to text and keeps the same conversation',async({page})=>{
    const context=await setup(page,{call:true,denyMic:true});
    await expect(page.getByText('Không dùng được nhận dạng giọng nói.',{exact:false})).toBeVisible();
    await page.getByLabel('Câu trả lời',{exact:true}).fill('Trả lời bằng văn bản sau khi từ chối mic.');
    await page.getByRole('button',{name:'Gửi câu trả lời',exact:true}).click();
    await expect.poll(()=>context.state.prompt?.followupNumber).toBe(1);
    await page.getByRole('button',{name:'Mở/đóng hội thoại',exact:true}).click();
    await expect(page.getByRole('region',{name:'Hội thoại đã lưu'}).getByText('Trả lời bằng văn bản sau khi từ chối mic.',{exact:true})).toBeVisible();
  });
  test('an interrupted stream retains the accepted answer and retry does not append it twice', async ({ page }) => {
    const context = await setup(page, { call: true, streamFailure: true });
    await expect(page.getByText('Đang nghe em', { exact: true })).toBeVisible();
    await page.evaluate(() => window.__voiceSay('Bằng chứng cần giữ sau lỗi mạng.'));
    await expect(page.getByText('AI tạm thời gián đoạn, câu trả lời đã lưu.', { exact: true }).first()).toBeVisible();
    const cached = await page.evaluate(() => JSON.parse(sessionStorage.getItem('aives-conversation-retry-a37d81ba-6124-49ae-8b4c-1055b439068c')));
    expect(cached.text).toBe('Bằng chứng cần giữ sau lỗi mạng.'); expect(cached.acknowledged).toBe(true);
    await page.getByRole('button', { name: 'Thử tiếp tục câu trả lời đã lưu', exact: true }).click();
    await expect(page.getByText('Đã hoàn thành lượt thi.', { exact: false })).toBeVisible();
    expect(context.state.turns.filter(turn => turn.speaker === 'STUDENT')).toHaveLength(1);
    expect(context.streamCalls()).toBe(2);
  });
});

test('voice prejoin does not start an answer timer and never requests a camera',async({page})=>{
  const context=await setup(page,{call:true,prejoin:true});const room=page.getByRole('region',{name:'Cuộc phỏng vấn trực tiếp'});
  await expect(room.getByText('Sẵn sàng vào phòng',{exact:true})).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);await expect(page.locator('video')).toHaveCount(0);
  await expect(room.getByRole('button',{name:/camera/i})).toHaveCount(0);
  expect(context.beginCalls()).toBe(0);expect(context.state.prompt.deadline).toBeNull();
  await room.getByRole('button',{name:'Tham gia phỏng vấn',exact:true}).click();
  await expect(room.getByText('Đang nghe em',{exact:true})).toBeVisible();expect(context.beginCalls()).toBe(1);
  await expect.poll(()=>page.evaluate(()=>window.__spoken[0])).toContain('Chào em');
  expect(await page.evaluate(()=>window.__mediaRequests)).toEqual([{audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false}]);
  await page.screenshot({path:'test-results/interview-voice-desktop.png',fullPage:true});
});

test('muting the microphone preserves words and resumes the same exchange',async({page})=>{
  const context=await setup(page,{call:true});const room=page.getByRole('region',{name:'Cuộc phỏng vấn trực tiếp'});
  await expect(room.getByText('Đang nghe em',{exact:true})).toBeVisible();
  await page.evaluate(()=>window.__voiceSay('Đầu lập luận'));await room.getByRole('button',{name:'Tắt micro',exact:true}).click();
  await expect(room.getByText('Micro đang tắt',{exact:true})).toBeVisible();
  await page.clock.install();await page.clock.runFor(2000);expect(context.streamCalls()).toBe(0);
  await room.getByRole('button',{name:'Bật micro',exact:true}).click();await page.evaluate(()=>window.__voiceSay('phần tiếp theo'));
  await page.clock.runFor(1600);await expect.poll(()=>context.streamCalls()).toBe(1);
  expect(context.state.turns.find(t=>t.speaker==='STUDENT').text).toBe('Đầu lập luận phần tiếp theo');
});

test('voice room supports mobile and fullscreen without horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});await setup(page,{call:true});const room=page.getByRole('region',{name:'Cuộc phỏng vấn trực tiếp'});
  await expect(room.getByText('Đang nghe em',{exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await room.getByRole('button',{name:'Mở rộng phòng phỏng vấn',exact:true}).click();await expect(room).toHaveClass(/call-room-fullscreen/);
  await page.screenshot({path:'test-results/interview-voice-mobile.png',fullPage:true});
  await page.keyboard.press('Escape');await expect(room).not.toHaveClass(/call-room-fullscreen/);
});

test('deadline seals microphone checkpoints without waiting for 1.5 seconds of silence',async({page})=>{
  const context=await setup(page,{call:true,shortDeadline:true});
  await expect(page.getByText('Đang nghe em',{exact:true})).toBeVisible();
  await page.evaluate(()=>window.__voiceSay('Phần đã nói trước khi hết giờ.'));
  await expect.poll(()=>context.draftCalls()).toBeGreaterThan(0);
  await expect(page.getByText('Đã hoàn thành lượt thi.',{exact:false})).toBeVisible();
  expect(context.streamCalls()).toBe(0);
  expect(context.state.turns.filter(t=>t.speaker==='STUDENT').map(t=>t.text)).toEqual(['Phần đã nói trước khi hết giờ.']);
});

test('the next spoken turn includes the AI contextual acknowledgement without needing a send button',async({page})=>{
  const context=await setup(page,{call:true,feedback:true});const room=page.getByRole('region',{name:'Cuộc phỏng vấn trực tiếp'});
  await expect(room.getByText('Đang nghe em',{exact:true})).toBeVisible();
  await page.evaluate(()=>window.__voiceSay('Em tách nhiệm vụ của từng phần.'));
  await expect.poll(()=>context.streamCalls()).toBe(1);
  await expect.poll(()=>page.evaluate(()=>window.__spoken.at(-1))).toBe('Mình hiểu ý bạn về tách trách nhiệm. Bạn có thể nêu ví dụ cụ thể?');
  await expect(page.getByRole('button',{name:'Gửi câu trả lời',exact:true})).toHaveCount(0);
});

test('switching to the text fallback retains words already captured from the microphone',async({page})=>{
  const context=await setup(page,{call:true});const room=page.getByRole('region',{name:'Cuộc phỏng vấn trực tiếp'});
  await expect(room.getByText('Đang nghe em',{exact:true})).toBeVisible();
  await page.evaluate(()=>window.__voiceSay('Lập luận chưa hoàn thành'));
  await room.getByRole('button',{name:'Chuyển sang gõ chữ',exact:true}).click();
  await expect(page.getByLabel('Câu trả lời',{exact:true})).toHaveValue('Lập luận chưa hoàn thành');
  expect(context.streamCalls()).toBe(0);
});


test('greeting and question are separate, noise and speaker echo do not start an answer or consume a question',async({page})=>{
  const context=await setup(page,{call:true,holdSpeech:true});
  const room=page.getByRole('region',{name:'Cuộc phỏng vấn trực tiếp'});
  await expect(room.getByRole('region',{name:'Câu hỏi đang trao đổi'})).toContainText('Vì sao nên phân chia trách nhiệm?');
  expect(context.beginCalls()).toBe(0);expect(context.streamCalls()).toBe(0);
  expect(await page.evaluate(()=>window.__spoken)).toHaveLength(1);
  await page.evaluate(()=>window.__voiceSay('Em đang chào giám khảo.'));
  expect(context.streamCalls()).toBe(0);expect(context.beginCalls()).toBe(0);
  await page.evaluate(()=>window.__utterance.onend());
  await expect.poll(()=>page.evaluate(()=>window.__spoken.at(-1))).toBe('Vì sao nên phân chia trách nhiệm?');
  const before=await page.evaluate(()=>window.__voiceCancelled);
  await page.evaluate(()=>{window.__recognition.onspeechstart?.();window.__voiceSay('Vì sao nên phân chia trách nhiệm');});
  expect(await page.evaluate(()=>window.__voiceCancelled)).toBe(before);
  expect(context.beginCalls()).toBe(0);expect(context.streamCalls()).toBe(0);
  await expect(room.getByText('Giám khảo đang nói',{exact:true})).toBeVisible();
  await page.evaluate(()=>window.__utterance.onend());
  await expect(room.getByText('Đang nghe em',{exact:true})).toBeVisible();expect(context.beginCalls()).toBe(1);
  await page.evaluate(()=>window.__voiceSay('Mỗi thành phần chịu trách nhiệm riêng.'));
  await expect.poll(()=>context.streamCalls()).toBe(1);
  expect(context.state.turns.find(t=>t.speaker==='STUDENT').text).toBe('Mỗi thành phần chịu trách nhiệm riêng.');
});

test('the question remains visible and replaying it does not reset the server deadline or use another followup',async({page})=>{
  const context=await setup(page,{call:true});const room=page.getByRole('region',{name:'Cuộc phỏng vấn trực tiếp'});
  await expect(room.getByText('Đang nghe em',{exact:true})).toBeVisible();
  const deadline=context.state.prompt.deadline;
  await room.getByRole('button',{name:'Bật/tắt phụ đề',exact:true}).click();
  await expect(room.getByRole('region',{name:'Câu hỏi đang trao đổi'})).toContainText('Vì sao nên phân chia trách nhiệm?');
  await room.getByRole('button',{name:'Nghe lại câu hỏi',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.__spoken.at(-1))).toBe('Vì sao nên phân chia trách nhiệm?');
  await expect(room.getByText('Đang nghe em',{exact:true})).toBeVisible();
  expect(context.state.prompt.deadline).toBe(deadline);expect(context.beginCalls()).toBe(1);expect(context.streamCalls()).toBe(0);
  await page.screenshot({path:'test-results/question-delivery.png',fullPage:true});
});
