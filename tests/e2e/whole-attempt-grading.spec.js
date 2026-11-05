import { test, expect } from '@playwright/test';

const student = { id: 'b37d81ba-6124-49ae-8b4c-1055b439068c', role: 'STUDENT', fullName: 'Student', email: 'student@example.com' };
const candidateId = 'e37d81ba-6124-49ae-8b4c-1055b439068c';
const attemptId = 'a37d81ba-6124-49ae-8b4c-1055b439068c';
const token = [Buffer.from('{}').toString('base64url'), Buffer.from(JSON.stringify({ sub: student.id, ...student, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'sig'].join('.');
const result = { totalScore: 8.25, maxScore: 10, feedback: 'Đánh giá tổng thể hai câu chính và các câu hỏi xoáy.', criteria: [{ sortOrder: 1, name: 'Kiến thức toàn bài', score: 5, maxPoints: 6, feedback: 'Nắm vững kiến thức ở cả hai câu.' }, { sortOrder: 2, name: 'Lập luận toàn bài', score: 3.25, maxPoints: 4, feedback: 'Lập luận rõ ràng.' }] };

async function history(page, gradeHandler) {
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/login') return route.fulfill({ json: { code: 200, data: { authenticate: true, token } } });
    if (path === `/api/v1/users/${student.id}`) return route.fulfill({ json: { code: 200, data: student } });
    if (path === '/api/v1/student/exams') return route.fulfill({ json: [{ id: candidateId, examTitle: 'Thi vấn đáp đã hoàn tất', status: 'COMPLETED', action: 'VIEW', attemptId, scheduledStart: '2026-10-22T01:00:00Z', scheduledEnd: '2026-10-22T02:00:00Z' }] });
    if (path === `/api/v1/student/exams/${candidateId}/attempts`) return route.fulfill({ json: [{ id: attemptId, attemptNo: 1, status: 'COMPLETED', startedAt: '2026-10-22T01:00:00Z', endedAt: '2026-10-22T01:20:00Z' }] });
    if (path.startsWith(`/api/v1/attempts/${attemptId}/grading`)) return gradeHandler(route, path);
    return route.fulfill({ status: 404, json: { message: `Unexpected ${path}` } });
  });
  await page.goto('/');
  await page.getByPlaceholder('lecturer@example.com').fill(student.email);
  await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByRole('button', { name: 'Xem lượt thi', exact: true }).click();
}

test('student sees only the official score and lecturer feedback after publication', async ({ page }) => {
  let published = false;
  await history(page, route => route.fulfill({ json: published
    ? { attemptId, status: 'PUBLISHED', published: { score: 9, maxScore: 10, feedback: 'Nhận xét chính thức của giảng viên.' } }
    : { attemptId, status: 'AWAITING_PUBLICATION', result } }));
  const grade = page.getByRole('region', { name: 'Kết quả chấm toàn bài', exact: true });
  await expect(grade.getByText('Giảng viên chưa công bố điểm và nhận xét.')).toBeVisible();
  await expect(grade.getByText('8.25 / 10 điểm', { exact: true })).toHaveCount(0);
  await expect(grade.getByText(result.feedback, { exact: true })).toHaveCount(0);
  published = true;
  await expect(grade.getByText('9 / 10 điểm', { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(grade.getByText('Nhận xét chính thức của giảng viên.')).toBeVisible();
});

test('lecturer reviews AI draft, enters a score and feedback, then publishes it', async ({ page }) => {
  const teacher = { ...student, role: 'LECTURER', email: 'lecturer@example.com' };
  const teacherToken = [Buffer.from('{}').toString('base64url'), Buffer.from(JSON.stringify({
    sub: teacher.id, ...teacher, exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url'), 'sig'].join('.');
  let publication;
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/login') return route.fulfill({ json: { code: 200, data: { authenticate: true, token: teacherToken } } });
    if (path === `/api/v1/users/${teacher.id}`) return route.fulfill({ json: { code: 200, data: teacher } });
    if (path === '/api/v1/exams') return route.fulfill({ json: [{ id: 'exam1', title: 'Thi vấn đáp đã hoàn tất', status: 'CLOSED' }] });
    if (path === '/api/v1/exams/exam1/monitor') return route.fulfill({ json: {
      title: 'Thi vấn đáp đã hoàn tất', examStatus: 'CLOSED', serverNow: new Date().toISOString(),
      candidates: [{ id: candidateId, fullName: student.fullName, email: student.email, status: 'COMPLETED',
        attempts: [{ id: attemptId, attemptNo: 1, status: 'COMPLETED', completedQuestions: 2, questionCount: 2 }] }]
    } });
    if (path.endsWith('/transcript')) return route.fulfill({ json: { status: 'COMPLETED', turns: [] } });
    if (path.endsWith('/grading/publish')) {
      publication = route.request().postDataJSON();
      return route.fulfill({ json: { status: 'COMPLETED' } });
    }
    if (path.endsWith('/grading')) return route.fulfill({ json: {
      attemptId, status: 'COMPLETED', maxScore: 10, result, published: publication && { ...publication, maxScore: 10 }
    } });
    return route.fulfill({ json: [] });
  });
  await page.goto('/');
  await page.getByPlaceholder('lecturer@example.com').fill(teacher.email);
  await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByRole('button', { name: 'Giám sát ca thi', exact: true }).first().click();
  await page.getByRole('button', { name: 'Xem giám sát', exact: true }).click();
  await page.getByRole('button', { name: 'Xem hội thoại lượt 1', exact: true }).click();
  await expect(page.getByText('Điểm AI đề xuất')).toBeVisible();
  await page.getByLabel('Điểm chốt').fill('9');
  await page.getByLabel('Nhận xét của giảng viên').fill('Nhận xét chính thức của giảng viên.');
  await page.getByRole('button', { name: 'Chốt và công bố điểm' }).click();
  await expect(page.getByText('9 / 10 điểm', { exact: true })).toBeVisible();
  expect(publication).toEqual({ score: 9, feedback: 'Nhận xét chính thức của giảng viên.' });
});
