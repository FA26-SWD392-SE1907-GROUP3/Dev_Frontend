import { test, expect } from '@playwright/test';

test('staff workspaces open lists and keep creation, AI and monitoring in separate views', async ({ page }) => {
  const teacher = { id: 'b37d81ba-6124-49ae-8b4c-1055b439068c', fullName: 'Lecturer', role: 'LECTURER', email: 'teacher@example.com' };
  const token = [Buffer.from('{}').toString('base64url'), Buffer.from(JSON.stringify({ sub: teacher.id, role: teacher.role, email: teacher.email, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'signature'].join('.');
  const course = { id: 'c1', code: 'SWD392', name: 'Kiến trúc phần mềm' };
  const rubrics = [{ id: 'r1', name: 'Rubric kiến trúc', maxScore: 10, status: 'PUBLISHED' }];
  const questions = [{ id: 'q1', content: 'Câu hỏi cần giáo viên kiểm tra', status: 'PENDING_REVIEW', rubricId: 'r1', bloomLevel: 'UNDERSTAND', difficulty: 'MEDIUM' }];
  const material = { id: 'm1', originalFilename: 'architecture.pdf', extractionStatus: 'READY', uploadedAt: '2026-10-20T00:00:00Z' };
  const exam = { id: 'e1', courseId: 'c1', title: 'Ca thi kiến trúc', status: 'ACTIVE' };
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname, method = route.request().method();
    if (path === '/api/v1/auth/login') return route.fulfill({ json: { code: 200, data: { authenticate: true, token } } });
    if (path === '/api/v1/users/' + teacher.id) return route.fulfill({ json: { code: 200, data: teacher } });
    if (path === '/api/v1/courses') return route.fulfill({ json: [course] });
    if (path === '/api/v1/exams') return route.fulfill({ json: [exam] });
    if (path === '/api/v1/courses/c1/rubrics') return route.fulfill({ json: rubrics });
    if (path === '/api/v1/rubrics' && method === 'POST') {
      const body = route.request().postDataJSON();
      expect(body.courseId).toBe('c1'); expect(body.maxScore).toBe(10);
      const rubric = { ...body, id: 'r2', status: 'DRAFT' }; rubrics.push(rubric);
      return route.fulfill({ json: rubric });
    }
    if (path === '/api/v1/courses/c1/questions') return route.fulfill({ json: questions });
    if (path === '/api/v1/questions' && method === 'POST') {
      const body = route.request().postDataJSON();
      expect(body.courseId).toBe('c1'); expect(body).not.toHaveProperty('rubricId');expect(body.difficulty).toBe('MEDIUM');
      const question = { ...body, id: 'q2', status: 'PENDING_REVIEW' }; questions.push(question);
      return route.fulfill({ json: question });
    }
    if (path === '/api/v1/courses/c1/materials') return route.fulfill({ json: [material] });
    if (path === '/api/v1/courses/c1/generation-jobs') return route.fulfill({ json: [] });
    if (path === '/api/v1/ai/status') return route.fulfill({ json: { configured: true } });
    if (path === '/api/v1/exams/e1/monitor') return route.fulfill({ json: { title: exam.title, examStatus: 'ACTIVE', courseCode: course.code, courseName: course.name, serverNow: new Date().toISOString(), candidates: [] } });
    return route.fulfill({ status: 404, json: { message: 'Unexpected endpoint ' + path } });
  });
  await page.goto('/');
  await page.getByPlaceholder('lecturer@example.com').fill(teacher.email);
  await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  const navigate = name => page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
  await navigate('Tiêu chí Rubric'); await page.getByLabel('Môn học').selectOption('c1');
  await expect(page.getByLabel('Tên rubric')).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Tìm kiếm', exact: true }).fill('kien truc');
  await expect(page.getByRole('cell', { name: 'Rubric kiến trúc', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '+ Tạo tiêu chí', exact: true }).click();
  await page.getByLabel('Tên rubric').fill('Rubric mới'); await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Rubric mới', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/rubric-list.png', fullPage: true, animations: 'disabled' });

  await navigate('Ngân hàng câu hỏi'); await page.getByLabel('Môn học').selectOption('c1');
  await expect(page.getByLabel('Nội dung câu hỏi')).toHaveCount(0);
  await expect(page.getByLabel('Tệp câu hỏi CSV / JSON')).toHaveCount(0);
  await page.getByRole('button', { name: '+ Tạo câu hỏi', exact: true }).click();
  await page.getByLabel('Nội dung câu hỏi').fill('Câu hỏi được tạo thủ công');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  const questionRow = page.getByRole('row').filter({ hasText: 'Câu hỏi được tạo thủ công' });
  await expect(questionRow).toBeVisible();
  await questionRow.getByRole('button', { name: 'Xóa', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Bạn chắc chắn muốn xóa?', exact: true })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(questionRow.getByRole('button', { name: 'Xóa', exact: true })).toBeFocused();
  await page.setViewportSize({ width: 360, height: 800 });
  await page.locator('html').evaluate(node => node.classList.add('dark'));
  await page.getByRole('region', { name: 'Ngân hàng câu hỏi', exact: true }).evaluate(node => { node.scrollLeft = 0; });
  await page.screenshot({ path: 'test-results/question-list-mobile-dark.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('html').evaluate(node => node.classList.remove('dark'));

  await navigate('Tài liệu học tập'); await page.getByLabel('Môn học').selectOption('c1');
  await expect(page.locator('input[type=file]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Sinh câu hỏi bằng AI', exact: true })).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Tìm kiếm', exact: true }).fill('architecture');
  await expect(page.getByRole('cell', { name: material.originalFilename, exact: true })).toBeVisible();
  await page.getByRole('button', { name: '+ Tải tài liệu lên', exact: true }).click();
  await expect(page.locator('input[type=file]')).toBeVisible(); await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await page.screenshot({ path: 'test-results/material-list.png', fullPage: true, animations: 'disabled' });

  await navigate('Giám sát ca thi');
  await page.getByRole('searchbox', { name: 'Tìm kiếm', exact: true }).fill('kien truc');
  await expect(page.getByRole('button', { name: /Tạo/ })).toHaveCount(0);
  await page.getByRole('cell', { name: exam.title, exact: true }).click();
  await expect(page.getByRole('heading', { name: exam.title + ' · ACTIVE', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Quay lại danh sách', exact: true }).click();
  await expect(page.getByRole('cell', { name: exam.title, exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/monitor-list.png', fullPage: true, animations: 'disabled' });
});
