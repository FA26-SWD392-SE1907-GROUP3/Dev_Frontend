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
  return { attemptId: ids.attempt, status: 'IN_PROGRESS', questionCount: 1, completedQuestions: 0, maxFollowups: 1, answerTimeLimitSeconds: 120, scheduledEnd: new Date(Date.now() + 1200000).toISOString(), serverNow: new Date().toISOString(), prompt, busy: false, needsContinuation: false, answerTurnId: null, error: null, aiConfigured: true,
    turns: [{ ...prompt, speaker: 'AI', speechStatus: 'NONE', hasAudio: false }] };
}
async function setup(page, options = {}) {
  if (options.call) await page.addInitScript(({ denyMic, holdSpeech }) => {
    window.__voiceCancelled = 0;
    class Recognition {
      start() { window.__recognition = this; if (denyMic) setTimeout(() => this.onerror?.({ error: 'not-allowed' }), 10); }
      abort() {}
    }
    window.SpeechRecognition = Recognition;
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      cancel() { window.__voiceCancelled++; }, getVoices() { return []; },
      speak(utterance) { window.__utterance = utterance; if (!holdSpeech) setTimeout(() => utterance.onend?.(), 30); },
    } });
    window.__voiceSay = text => {
      window.__recognition.onspeechstart?.();
      window.__recognition.onresult?.({ results: [[{ transcript: text }]] });
    };
  }, { denyMic: !!options.denyMic, holdSpeech: !!options.holdSpeech });
  const state = initial(); let speechCalls = 0, failedInitialLoad = false, started = false, streamCalls = 0;
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
    if (path.endsWith('/begin')) {
      expect(route.request().postDataJSON().promptId).toBe(state.prompt.id);
      state.prompt.deadline ||= new Date(Date.now() + (options.shortDeadline ? 1200 : 120000)).toISOString(); return respond(route);
    }
    if (path.includes('/speech/')) { speechCalls++; return route.fulfill({ contentType: 'audio/wav', body: wav() }); }
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
      return route.fulfill({ contentType: 'text/event-stream', body: `event: saved\ndata: {"answerTurnId":"answer-${followup}"}\n\nevent: delta\ndata: ${JSON.stringify({ text: state.prompt?.text || '' })}\n\nevent: complete\ndata: ${JSON.stringify({ ...state, serverNow: new Date().toISOString() })}\n\n` });
    }
    if (path.endsWith('/finish')) {
      state.prompt = null; state.status = 'COMPLETED'; state.completedQuestions = 1;
      return respond(route);
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
    if (path.endsWith('/timeout')) { expect(route.request().postDataJSON().promptId).toBe(ids.prompt); state.prompt = null; state.status = 'COMPLETED'; state.completedQuestions = 1; return respond(route); }
    return route.fulfill({ status: 404, json: { message: 'Unexpected endpoint ' + path } });
  });
  await page.goto('/');
  await page.getByPlaceholder('lecturer@example.com').fill(user.email); await page.getByPlaceholder('Nhập mật khẩu').fill('test123456'); await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByRole('button', { name: 'Vào phòng thi', exact: true }).click();
  if (!options.call) await page.getByRole('button', { name: 'Chuyển sang chế độ dự phòng', exact: true }).click();
  await page.getByRole('button', { name: 'Bắt đầu lượt thi', exact: true }).click();
  if (options.initialFailure) { await expect(page.getByText('Tạm thời mất kết nối lượt thi.', { exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Tải lại lượt thi', exact: true }).click(); }
  await expect(page.getByText('Vì sao nên phân chia trách nhiệm?', { exact: true }).first()).toBeVisible();
  return { state, speechCalls: () => speechCalls, streamCalls: () => streamCalls };
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

test('browser speech sends text and automatically resumes after an adaptive followup', async ({ page }) => {
  const context=await setup(page,{call:true});
  const room=page.getByRole('region',{name:'Cuộc phỏng vấn trực tiếp'});
  await expect(room.getByText('Đang nghe bạn',{exact:true})).toBeVisible();
  await expect(page.getByLabel('Câu trả lời bằng văn bản')).toHaveCount(0);
  await page.evaluate(() => window.__voiceSay('Tôi đang trình bày câu trả lời.'));
  await expect(room.getByRole('heading',{name:'Câu 1 · Hỏi đào sâu 1',exact:true})).toBeVisible();
  await expect(room.getByText('Đang nghe bạn',{exact:true})).toBeVisible();
  await page.screenshot({path:'test-results/online-interview.png',fullPage:true});
  await page.evaluate(() => window.__voiceSay('Ví dụ tách giao diện khỏi dữ liệu.'));
  await expect(page.getByText('Đã hoàn thành lượt thi.',{exact:false})).toBeVisible();
  expect(context.speechCalls()).toBe(0);
});

test.describe('automatic voice turns',()=>{
  test('barge-in stops speech immediately and finish preserves the accepted transcript',async({page})=>{
    await setup(page,{call:true,holdSpeech:true});
    const room=page.getByRole('region',{name:'Cuộc phỏng vấn trực tiếp'});
    await expect(room.getByText('AI đang nói',{exact:true})).toBeVisible();
    const before = await page.evaluate(() => window.__voiceCancelled);
    await page.evaluate(() => window.__voiceSay('Tôi muốn trả lời ngay.'));
    expect(await page.evaluate(() => window.__voiceCancelled)).toBeGreaterThan(before);
    await expect(room.getByText('Đang nghe bạn',{exact:true})).toBeVisible();
    await expect(room.getByRole('heading',{name:'Câu 1 · Hỏi đào sâu 1',exact:true})).toBeVisible();
    await room.getByRole('button',{name:'Kết thúc',exact:true}).click();
    await expect(page.getByText('Đã hoàn thành lượt thi.',{exact:false})).toBeVisible();
    await expect(page.getByText('Tôi muốn trả lời ngay.',{exact:true})).toBeVisible();
  });
  test('microphone rejection switches to text and keeps the same conversation',async({page})=>{
    await setup(page,{call:true,denyMic:true});
    await expect(page.getByText('Không dùng được nhận dạng giọng nói.',{exact:false})).toBeVisible();
    await page.getByLabel('Câu trả lời',{exact:true}).fill('Trả lời bằng văn bản sau khi từ chối mic.');
    await page.getByRole('button',{name:'Gửi câu trả lời',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Câu 1 · Hỏi đào sâu 1',exact:true})).toBeVisible();
    await expect(page.getByText('Trả lời bằng văn bản sau khi từ chối mic.',{exact:true})).toBeVisible();
  });
  test('an interrupted stream retains the accepted answer and retry does not append it twice', async ({ page }) => {
    const context = await setup(page, { call: true, streamFailure: true });
    await expect(page.getByText('Đang nghe bạn', { exact: true })).toBeVisible();
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
