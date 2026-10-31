import { test, expect } from '@playwright/test';

const student = { id: 'b37d81ba-6124-49ae-8b4c-1055b439068c', role: 'STUDENT', fullName: 'Student', email: 'student@example.com' };
const candidateId = 'e37d81ba-6124-49ae-8b4c-1055b439068c';
const attemptId = 'a37d81ba-6124-49ae-8b4c-1055b439068c';
const token = [Buffer.from('{}').toString('base64url'), Buffer.from(JSON.stringify({ sub: student.id, role: student.role, email: student.email, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'signature'].join('.');

async function setup(page, action = 'START', cancelled = false) {
  const schedule = { id: candidateId, examTitle: 'Lịch thi theo trạng thái', status: action === 'START' ? 'REGISTERED' : cancelled ? 'CANCELLED' : action === 'RESUME' ? 'IN_PROGRESS' : 'COMPLETED', action, attemptId: action === 'START' ? null : attemptId, scheduledStart: new Date(Date.now() - 60000).toISOString(), scheduledEnd: new Date(Date.now() + 1200000).toISOString() };
  const session = { attemptId, status: cancelled ? 'ABORTED' : action === 'VIEW' ? 'COMPLETED' : 'IN_PROGRESS', questionCount: 1, completedQuestions: action === 'VIEW' && !cancelled ? 1 : 0, maxFollowups: 1, maxFollowupsPerQuestion: 1, followupsUsed: 0, answerTimeLimitSeconds: 120, scheduledEnd: schedule.scheduledEnd, serverNow: new Date().toISOString(), busy: false, needsContinuation: false, aiConfigured: false, turns: [], prompt: { id: 'f37d81ba-6124-49ae-8b4c-1055b439068c', sequenceNo: 1, followupNumber: 0, text: 'Câu hỏi đang trả lời', deadline: new Date(Date.now() + 120000).toISOString() } };
  const calls = { start: 0, history: 0, state: 0 };
  await page.addInitScript(({ student, candidateId, attemptId }) => {
    sessionStorage.setItem('aives-interview-mode', 'manual');
    // An old browser cache must never expose a resume button for a finished schedule.
    sessionStorage.setItem(`aives-student-attempt-${student.id}`, JSON.stringify({ candidateId, attemptId }));
  }, { student, candidateId, attemptId });
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/login') return route.fulfill({ json: { code: 200, data: { authenticate: true, token } } });
    if (path === `/api/v1/users/${student.id}`) return route.fulfill({ json: { code: 200, data: student } });
    if (path === '/api/v1/student/exams') return route.fulfill({ json: [schedule] });
    if (path === `/api/v1/student/exams/${candidateId}/attempts`) {
      calls.history++;
      return route.fulfill({ json: schedule.attemptId ? [{ id: attemptId, attemptNo: 1, status: session.status, startedAt: schedule.scheduledStart, endedAt: new Date().toISOString() }] : [] });
    }
    if (path === `/api/v1/attempts/start/${candidateId}`) {
      calls.start++; schedule.status = 'IN_PROGRESS'; schedule.action = 'RESUME'; schedule.attemptId = attemptId;
      return route.fulfill({ json: { attemptId, status: 'IN_PROGRESS' } });
    }
    if (path === `/api/v1/interviews/${attemptId}`) { calls.state++; return route.fulfill({ json: { ...session, serverNow: new Date().toISOString() } }); }
    if (path === `/api/v1/attempts/${attemptId}/grading`) return route.fulfill({ json: { attemptId, status: 'UNAVAILABLE' } });
    return route.fulfill({ status: 404, json: { message: `Unexpected endpoint ${path}` } });
  });
  await page.goto('/');
  await page.getByPlaceholder('lecturer@example.com').fill(student.email);
  await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  return { schedule, session, calls };
}

test('a new schedule only allows entry and an active schedule only allows continuation across reloads', async ({ page }) => {
  const { calls, session } = await setup(page);
  await expect(page.getByRole('button', { name: 'Vào phòng thi', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xem lượt thi', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tiếp tục thi', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Vào phòng thi', exact: true }).click();
  await page.getByRole('button', { name: 'Bắt đầu lượt thi', exact: true }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  const deadline = session.prompt.deadline;
  await page.getByRole('button', { name: '← Quay lại', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tiếp tục thi', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vào phòng thi', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Xem lượt thi', exact: true })).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Tiếp tục thi', exact: true }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bắt đầu lượt thi', exact: true })).toHaveCount(0);
  expect(session.prompt.deadline).toBe(deadline);
  expect(calls.start).toBe(1); expect(calls.history).toBe(0);
});

test('an active attempt is resumed from server data even without a browser cache', async ({ page }) => {
  const { calls } = await setup(page, 'RESUME');
  await page.evaluate(() => sessionStorage.removeItem(`aives-student-attempt-b37d81ba-6124-49ae-8b4c-1055b439068c`));
  await page.getByRole('button', { name: 'Tiếp tục thi', exact: true }).click();
  await expect(page.getByText('Câu hỏi đang trả lời', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bắt đầu lượt thi', exact: true })).toHaveCount(0);
  expect(calls.start).toBe(0); expect(calls.history).toBe(0);
});

test('a stale entry button resolves an attempt started in another tab', async ({ page }) => {
  const { schedule, calls } = await setup(page);
  await expect(page.getByRole('button', { name: 'Vào phòng thi', exact: true })).toBeVisible();
  Object.assign(schedule, { action: 'RESUME', status: 'IN_PROGRESS', attemptId });
  await page.getByRole('button', { name: 'Vào phòng thi', exact: true }).click();
  await expect(page.getByText('Câu hỏi đang trả lời', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bắt đầu lượt thi', exact: true })).toHaveCount(0);
  expect(calls.start).toBe(0);
});

for (const cancelled of [false, true]) {
  test(`${cancelled ? 'a cancelled' : 'a completed'} schedule only offers read-only attempt history`, async ({ page }) => {
    const { calls } = await setup(page, 'VIEW', cancelled);
    await page.getByRole('button', { name: 'Xem lượt thi', exact: true }).click();
    await expect(page.getByText(`Lượt 1 — ${cancelled ? 'Đã dừng' : 'Hoàn thành'}`, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Vào phòng thi', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tiếp tục thi', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Mở lại lượt thi', exact: true })).toHaveCount(0);
    expect(calls.start).toBe(0); expect(calls.state).toBe(0);
  });
}

test('a schedule cancelled before the student starts retains an empty history', async ({ page }) => {
  const { schedule } = await setup(page, 'VIEW', true);
  schedule.attemptId = null;
  await page.getByRole('button', { name: 'Xem lượt thi', exact: true }).click();
  await expect(page.getByText('Lịch thi đã bị hủy trước khi sinh viên bắt đầu. Chưa có lượt thi nào.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vào phòng thi', exact: true })).toHaveCount(0);
});

test('cancellation while a student is in the room removes answering controls and returns to history', async ({ page }) => {
  const { schedule, session } = await setup(page, 'RESUME');
  await page.getByRole('button', { name: 'Tiếp tục thi', exact: true }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  Object.assign(schedule, { status: 'CANCELLED', action: 'VIEW' });
  Object.assign(session, { status: 'ABORTED', prompt: null });
  await expect(page.getByText(/Lịch thi đã bị giảng viên hủy\. Lượt thi đã dừng/)).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Nộp câu trả lời', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '← Quay lại', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Xem lượt thi', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tiếp tục thi', exact: true })).toHaveCount(0);
});
