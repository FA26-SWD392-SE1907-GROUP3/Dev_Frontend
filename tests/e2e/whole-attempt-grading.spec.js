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

test('completed exam shows one total and criterion scores for the entire attempt', async ({ page }) => {
  await history(page, route => route.fulfill({ json: { attemptId, status: 'COMPLETED', result } }));
  const grade = page.getByRole('region', { name: 'Kết quả chấm toàn bài', exact: true });
  await expect(grade.getByText('8.25 / 10 điểm', { exact: true })).toBeVisible();
  await expect(grade.getByText('Kiến thức toàn bài: 5 / 6', { exact: true })).toBeVisible();
  await expect(grade.getByText('Lập luận toàn bài: 3.25 / 4', { exact: true })).toBeVisible();
  await expect(grade.getByText(result.feedback, { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/whole-attempt-grade.png', fullPage: true });
});

test('pending result refreshes and a failed grade can be retried without repeating the exam', async ({ page }) => {
  let retried = false;
  await history(page, async (route, path) => {
    if (path.endsWith('/retry')) { retried = true; return route.fulfill({ json: { attemptId, status: 'PENDING' } }); }
    return route.fulfill({ json: retried ? { attemptId, status: 'COMPLETED', result } : { attemptId, status: 'FAILED', error: 'AI chưa chấm xong bài thi.' } });
  });
  await expect(page.getByRole('alert')).toContainText('AI chưa chấm xong bài thi.');
  await page.getByRole('button', { name: 'Thử chấm lại', exact: true }).click();
  await expect(page.getByText('8.25 / 10 điểm', { exact: true })).toBeVisible();
  expect(retried).toBe(true);
  await expect(page.getByRole('button', { name: 'Bắt đầu lượt thi', exact: true })).toHaveCount(0);
});
