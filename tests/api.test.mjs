import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { api, request, setToken, decodeJwt, ApiError } from '../src/services/api.js';

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  setToken(null);
});

test('a late unauthorized response cannot log out a newer session', async () => {
  globalThis.window = new EventTarget();
  let unauthorized = 0, respond;
  window.addEventListener('aives:unauthorized', () => unauthorized++);
  globalThis.fetch = () => new Promise(resolve => { respond = resolve; });
  setToken('old-session');
  const pending = api.courses();
  setToken('new-session');
  respond(Response.json({ message: 'Expired token' }, { status: 401 }));
  await assert.rejects(pending, error => error.status === 401);
  assert.equal(unauthorized, 0);
});

test('unauthorized response from the current session still requests logout', async () => {
  globalThis.window = new EventTarget();
  let unauthorized = 0;
  window.addEventListener('aives:unauthorized', () => unauthorized++);
  setToken('current-session');
  globalThis.fetch = async () => Response.json({ message: 'Expired token' }, { status: 401 });
  await assert.rejects(api.courses(), error => error.status === 401);
  assert.equal(unauthorized, 1);
});

for (const responseType of ['text', 'blob']) {
  test(`timeout while reading the ${responseType} response has a useful error`, async () => {
    globalThis.fetch = async () => ({
      ok: true, status: 200,
      [responseType]: async () => { throw new DOMException('Timed out reading response', 'TimeoutError'); },
    });
    await assert.rejects(request('/slow-response', { responseType }),
      error => error instanceof ApiError && error.status === 0 && /phản hồi quá lâu/.test(error.message));
  });
}

test('login calls Spring Boot /api/v1/auth/login using email and unwraps ApiResponse', async () => {
  globalThis.fetch = async (url, opts) => {
    assert.equal(url, '/api/v1/auth/login');
    assert.equal(opts.method, 'POST');
    assert.deepEqual(JSON.parse(opts.body), { email: 'teacher@example.com', password: 'demo' });
    return Response.json({ code: 200, data: { authenticate: true, token: 'ey.fake.jwt' } });
  };
  assert.deepEqual(await api.login('teacher@example.com', 'demo'), { authenticate: true, token: 'ey.fake.jwt' });
});

test('get profile sends JWT header and uses UUID endpoint', async () => {
  const id='3b127dc2-e35f-48a4-a58f-6cf26d0bcf44';
  setToken('jwt-abc');
  globalThis.fetch = async (url,opts) => {
    assert.equal(url, `/api/v1/users/${id}`);
    assert.equal(opts.headers.Authorization, 'Bearer jwt-abc');
    return Response.json({code:200,data:{id,role:'LECTURER',fullName:'Teacher'}});
  };
  assert.equal((await api.me(id)).role, 'LECTURER');
});

test('creating course sends code/name, not old subjectCode fields', async () => {
  const body={code:'SWD392',name:'Software Design',description:''};
  globalThis.fetch = async (url,opts) => {
    assert.equal(url,'/api/v1/courses');
    assert.deepEqual(JSON.parse(opts.body),body);
    return Response.json({...body,id:'uuid1'});
  };
  assert.equal((await api.createCourse(body)).id,'uuid1');
});

test('question review uses PATCH and approve query parameter',async()=>{
  globalThis.fetch=async(url,opts)=>{
    assert.equal(url,'/api/v1/questions/q-id/review?approve=false');
    assert.equal(opts.method,'PATCH');
    assert.equal(opts.body,'Nội dung chưa chính xác');
    assert.equal(opts.headers['Content-Type'],'text/plain');
    return Response.json({id:'q-id',status:'REJECTED'});
  };
  assert.equal((await api.reviewQuestion('q-id',false,'Nội dung chưa chính xác')).status,'REJECTED');
});

test('assign candidate uses schedule fields expected by Spring Boot',async()=>{
  globalThis.fetch=async(url,opts)=>{
    assert.equal(url,'/api/v1/exams/ex1/candidates');
    assert.deepEqual(JSON.parse(opts.body),{
      studentEmail:'student@example.com',scheduledStart:'2026-12-01T08:00:00.000Z',scheduledEnd:'2026-12-01T08:30:00.000Z',enrollIfNeeded:true
    });
    return Response.json('generated-candidate-id');
  };
  assert.equal(await api.assignCandidate('ex1',{studentEmail:'student@example.com',scheduledStart:'2026-12-01T08:00:00.000Z',scheduledEnd:'2026-12-01T08:30:00.000Z',enrollIfNeeded:true}),'generated-candidate-id');
});

test('POST answer accepts backend void response',async()=>{
  globalThis.fetch=async(url,opts)=>{assert.equal(url,'/api/v1/attempts/questions/aq-1/answer');assert.deepEqual(JSON.parse(opts.body),{text:'Answer'});return new Response(null,{status:200});};
  assert.equal(await api.submitAnswer('aq-1','Answer'),null);
});

test('backend ApiResponse error message is visible to the user',async()=>{
  globalThis.fetch=async()=>Response.json({code:403,message:'Access denied'},{status:403});
  await assert.rejects(api.courses(),e=>e instanceof ApiError && e.status===403 && e.message==='Access denied');
});

test('empty forbidden response explains how a student can recover',async()=>{
  globalThis.fetch=async()=>new Response(null,{status:403});
  await assert.rejects(api.startAttempt('candidate'),e=>e.status===403 && /đăng nhập lại/.test(e.message));
});

test('CORS rejection explains the allowed origin configuration',async()=>{
  globalThis.fetch=async()=>new Response('Invalid CORS request',{status:403});
  await assert.rejects(api.startAttempt('candidate'),/CORS_ALLOWED_ORIGINS/);
});

test('network failure is surfaced clearly',async()=>{
  globalThis.fetch=async()=>{throw new TypeError('Failed to fetch');};
  await assert.rejects(api.courses(),/Không kết nối được Spring Boot/);
});

test('decodeJwt supports roles/id without treating an unverified JWT as authorization',()=>{
  const segment=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
  const token=`${segment({alg:'HS256'})}.${segment({sub:'uuid',email:'a@b.test',role:'ADMIN',exp:Math.floor(Date.now()/1000)+3600})}.signature`;
  assert.deepEqual(decodeJwt(token),{id:'uuid',email:'a@b.test',role:'ADMIN'});
  assert.equal(decodeJwt('not-a-jwt'),null);
});

test('material upload sends authenticated multipart without overriding browser boundary', async () => {
  setToken('teacher-jwt');
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/v1/courses/c1/materials');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer teacher-jwt');
    assert.equal(options.headers['Content-Type'], undefined);
    assert.ok(options.body instanceof FormData);
    assert.equal(options.body.get('file').name, 'lecture.pdf');
    return Response.json({ id: 'm1', extractionStatus: 'UPLOADED' }, { status: 201 });
  };
  await api.uploadMaterial('c1', new File(['%PDF-1.7'], 'lecture.pdf', { type: 'application/pdf' }));
});

test('download errors retain backend permission explanation', async () => {
  globalThis.fetch = async () => Response.json({ message: 'Not assigned to this course' }, { status: 403 });
  await assert.rejects(api.downloadMaterial('m1'), error => error.status === 403 && /chưa được phân công/.test(error.message));
});

test('generation request carries selected materials and rubric', async () => {
  const body = { materialIds: ['m1'], rubricId: 'r1', desiredCount: 3, bloomLevel: 'APPLY', difficulty: 'MEDIUM' };
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/v1/courses/c1/generation-jobs');
    assert.deepEqual(JSON.parse(options.body), body);
    return Response.json({ status: 'COMPLETED', generatedCount: 3 });
  };
  assert.equal((await api.generateQuestions('c1', body)).generatedCount, 3);
});
