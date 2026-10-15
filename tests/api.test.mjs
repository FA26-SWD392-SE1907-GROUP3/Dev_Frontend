import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { subjectsApi, request } from '../src/services/api.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('create sends backend subject fields and returns saved ID', async () => {
  const body = { subjectCode: 'SWD392', subjectName: 'Design', description: null };
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/subjects');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), body);
    return new Response(JSON.stringify({ ...body, subjectId: 12 }), { status: 201 });
  };
  assert.equal((await subjectsApi.create(body)).subjectId, 12);
});

test('failed delete rejects with server conflict instead of fake success', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: 'Subject is referenced' }), { status: 409 });
  await assert.rejects(subjectsApi.delete(12), /Subject is referenced/);
});

test('network failure is surfaced instead of sample data', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(subjectsApi.list(), /Không kết nối/);
});

test('successful delete accepts an empty 204 response', async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await subjectsApi.delete(12), null);
});

test('a stalled schedules request times out with an actionable error', async () => {
  globalThis.fetch = (url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
  const keepAlive = setTimeout(() => {}, 1000);
  try { await assert.rejects(request('/my-schedules', { timeoutMs: 20 }), /Máy chủ phản hồi quá lâu/); }
  finally { clearTimeout(keepAlive); }
});
