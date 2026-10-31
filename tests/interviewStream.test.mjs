import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { api, setToken } from '../src/services/api.js';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; setToken(null); });

function response(text, bytesPerChunk = 1) {
  const bytes = new TextEncoder().encode(text);
  return new Response(new ReadableStream({ start(controller) {
    for (let i = 0; i < bytes.length; i += bytesPerChunk) controller.enqueue(bytes.slice(i, i + bytesPerChunk));
    controller.close();
  } }), { headers: { 'Content-Type': 'text/event-stream' } });
}

test('POST SSE preserves split UTF-8, CRLF frames and Bearer authentication', async () => {
  setToken('jwt'); const events = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/v1/interviews/id/turns/stream'); assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer jwt');
    assert.deepEqual(JSON.parse(options.body), { promptId: 'prompt', text: 'Trả lời' });
    return response('event: saved\r\ndata: {"answerTurnId":"answer"}\r\n\r\nevent: delta\r\ndata: {"text":"Vì sao?"}\r\n\r\nevent: complete\r\ndata: {"status":"COMPLETED"}\r\n\r\n');
  };
  const result = await api.streamInterviewAnswer('id', 'prompt', 'Trả lời', { onEvent: (...args) => events.push(args) });
  assert.equal(result.status, 'COMPLETED'); assert.equal(events[1][1].text, 'Vì sao?');
  assert.deepEqual(events.map(([type]) => type), ['saved', 'delta', 'complete']);
});

test('premature disconnect and provider error never look like a completed turn', async () => {
  globalThis.fetch = async () => response('event: saved\ndata: {"answerTurnId":"answer"}\n\n');
  await assert.rejects(api.streamInterviewAnswer('id', 'prompt', 'text'), /Kết nối bị ngắt/);
  globalThis.fetch = async () => response('event: error\ndata: {"message":"Câu trả lời đã lưu"}\n\n');
  await assert.rejects(api.streamInterviewAnswer('id', 'prompt', 'text'), /Câu trả lời đã lưu/);
});

test('HTTP authorization errors remain visible before streaming starts', async () => {
  globalThis.fetch = async () => Response.json({ message: 'Không có quyền' }, { status: 403 });
  await assert.rejects(api.streamInterviewAnswer('id', 'prompt', 'text'), error => error.status === 403 && error.message === 'Không có quyền');
});

test('network failures explain recovery and intentional cancellation stays silent to callers', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(api.streamInterviewAnswer('id', 'prompt', 'text'), /Câu trả lời được giữ để thử lại/);
  const controller = new AbortController(); controller.abort();
  const abort = new DOMException('Aborted', 'AbortError');
  globalThis.fetch = async () => { throw abort; };
  await assert.rejects(api.streamInterviewAnswer('id', 'prompt', 'text', { signal: controller.signal }), error => error === abort);
});
