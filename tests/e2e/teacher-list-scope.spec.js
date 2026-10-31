import { test, expect } from '@playwright/test';

const teacher = { id: 'b37d81ba-6124-49ae-8b4c-1055b439068c', fullName: 'Lecturer', role: 'LECTURER', email: 'teacher@example.com' };
const token = [Buffer.from('{}').toString('base64url'), Buffer.from(JSON.stringify({ sub: teacher.id, ...teacher, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'signature'].join('.');
const courses = [
  { id: 'c1', code: 'SWD392', name: 'Kiến trúc phần mềm' },
  { id: 'c2', code: 'DBI202', name: 'Cơ sở dữ liệu' },
];

async function setup(page, intercept = async () => false) {
  const collections = {
    materials: [
      [{ id: 'm1', originalFilename: 'architecture.pdf', extractionStatus: 'READY', uploadedAt: '2026-10-20T00:00:00Z' }],
      [{ id: 'm2', originalFilename: 'database.pdf', extractionStatus: 'READY', uploadedAt: '2026-10-20T00:00:00Z' }],
    ],
    questions: [
      [{ id: 'q1', content: 'Giải thích kiến trúc phân lớp', referenceAnswer: 'Chia trách nhiệm theo lớp', difficulty: 'MEDIUM', status: 'APPROVED' }],
      [{ id: 'q2', content: 'Giải thích khóa chính', referenceAnswer: 'Định danh duy nhất', difficulty: 'EASY', status: 'PENDING_REVIEW' }],
    ],
    rubrics: [
      [{ id: 'r1', name: 'Rubric kiến trúc', maxScore: 10, status: 'PUBLISHED' }],
      [{ id: 'r2', name: 'Rubric dữ liệu', maxScore: 10, status: 'DRAFT' }],
    ],
  };
  const reads = [], writes = [];
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (await intercept(route, path)) return;
    if (path === '/api/v1/auth/login') return route.fulfill({ json: { code: 200, data: { authenticate: true, token } } });
    if (path === `/api/v1/users/${teacher.id}`) return route.fulfill({ json: { code: 200, data: teacher } });
    if (path === '/api/v1/courses') return route.fulfill({ json: courses });
    if (path === '/api/v1/exams') return route.fulfill({ json: [] });
    if (path === '/api/v1/ai/status') return route.fulfill({ json: { configured: true } });
    const match = path.match(/^\/api\/v1\/courses\/([^/]+)\/(materials|questions|rubrics|generation-jobs)$/);
    if (match) {
      const [, id, type] = match;
      expect(courses.map(course => course.id)).toContain(id);
      const index = courses.findIndex(course => course.id === id);
      if (method === 'GET') {
        reads.push(path);
        return route.fulfill({ json: type === 'generation-jobs' ? [] : collections[type][index] });
      }
      if (type === 'materials' && method === 'POST') {
        writes.push({ courseId: id });
        const material = { id: 'm3', originalFilename: 'new.pdf', extractionStatus: 'UPLOADED', uploadedAt: new Date().toISOString() };
        collections.materials[index].push(material);
        return route.fulfill({ json: material });
      }
    }
    if (path === '/api/v1/questions/q2') {
      if (method === 'PUT') {
        const body = route.request().postDataJSON();
        writes.push(body);
        Object.assign(collections.questions[1][0], body);
      }
      return route.fulfill({ json: collections.questions[1][0] });
    }
    if (path === '/api/v1/rubrics' && method === 'POST') {
      const body = route.request().postDataJSON();
      writes.push(body);
      const rubric = { ...body, id: 'r3', status: 'DRAFT' };
      collections.rubrics[courses.findIndex(course => course.id === body.courseId)].push(rubric);
      return route.fulfill({ json: rubric });
    }
    return route.fulfill({ status: 404, json: { message: 'Unexpected endpoint ' + path } });
  });
  await page.goto('/');
  await page.getByPlaceholder('lecturer@example.com').fill(teacher.email);
  await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  return { reads, writes };
}

const navigate = (page, name) => page.getByRole('navigation').getByRole('button', { name, exact: true }).click();

for (const [menu, type, first, second] of [
  ['Tài liệu học tập', 'materials', 'architecture.pdf', 'database.pdf'],
  ['Ngân hàng câu hỏi', 'questions', 'Giải thích kiến trúc phân lớp', 'Giải thích khóa chính'],
  ['Tiêu chí Rubric', 'rubrics', 'Rubric kiến trúc', 'Rubric dữ liệu'],
]) {
  test(`${menu} initially shows every permitted course; selectors and search only filter`, async ({ page }) => {
    const { reads } = await setup(page);
    await navigate(page, menu);
    const cell = text => page.getByRole('cell', { name: text, exact: true });
    await expect(page.getByLabel('Môn học')).toHaveValue('');
    await expect(page.getByLabel('Môn học').locator('option:checked')).toHaveText('Tất cả môn học');
    await expect(cell(first)).toBeVisible();
    await expect(cell(second)).toBeVisible();
    await expect(cell('DBI202 — Cơ sở dữ liệu')).toBeVisible();
    const count = reads.filter(path => path.endsWith('/' + type)).length;
    await page.getByLabel('Môn học').selectOption('c2');
    await expect(cell(first)).toHaveCount(0);
    await expect(cell(second)).toBeVisible();
    await page.getByLabel('Môn học').selectOption('');
    await expect(cell(first)).toBeVisible();
    const search = page.getByRole('searchbox', { name: 'Tìm kiếm', exact: true });
    await search.fill('co so du lieu');
    await expect(cell(second)).toBeVisible();
    await expect(cell(first)).toHaveCount(0);
    await search.fill('khong-co-ket-qua');
    await expect(page.getByText('Không tìm thấy kết quả', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Xóa tìm kiếm', exact: true }).click();
    await expect(cell(first)).toBeVisible();
    await expect(cell(second)).toBeVisible();
    expect(reads.filter(path => path.endsWith('/' + type))).toHaveLength(count);
  });
}

test('actions from all courses retain the row course or ask for a separate target course', async ({ page }) => {
  const { writes } = await setup(page);
  await navigate(page, 'Ngân hàng câu hỏi');
  await page.getByRole('row').filter({ hasText: 'Giải thích khóa chính' }).getByRole('button', { name: 'Sửa', exact: true }).click();
  await expect(page.getByLabel('Môn học')).toHaveValue('c2');
  await expect(page.getByLabel('Môn học')).toBeDisabled();
  await page.getByLabel('Nội dung câu hỏi').fill('Câu hỏi khóa chính đã sửa');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Câu hỏi khóa chính đã sửa', exact: true })).toBeVisible();
  expect(writes.at(-1).courseId).toBe('c2');

  await navigate(page, 'Tài liệu học tập');
  await page.getByRole('button', { name: '+ Tải tài liệu lên', exact: true }).click();
  await expect(page.getByLabel('Môn học')).toHaveValue('');
  await page.locator('input[type=file]').setInputFiles({ name: 'new.pdf', mimeType: 'application/pdf', buffer: Buffer.from('fixture') });
  await expect(page.getByRole('button', { name: 'Lưu', exact: true })).toBeDisabled();
  await page.getByLabel('Môn học').selectOption('c2');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'new.pdf', exact: true })).toBeVisible();
  expect(writes.at(-1).courseId).toBe('c2');
  await expect(page.getByLabel('Môn học')).toHaveValue('');
  await page.getByRole('button', { name: 'Nhờ AI tạo câu hỏi', exact: true }).click();
  await page.getByLabel('Môn học').selectOption('c2');
  await expect(page.getByRole('checkbox', { name: 'database.pdf', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'architecture.pdf', exact: true })).toHaveCount(0);

  await navigate(page, 'Tiêu chí Rubric');
  await page.getByRole('button', { name: '+ Tạo tiêu chí', exact: true }).click();
  await page.getByLabel('Tên rubric').fill('Rubric mới môn dữ liệu');
  await expect(page.getByRole('button', { name: 'Lưu', exact: true })).toBeDisabled();
  await page.getByLabel('Môn học').selectOption('c2');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Rubric mới môn dữ liệu', exact: true })).toBeVisible();
  expect(writes.at(-1).courseId).toBe('c2');
});

test('a failed course request shows an error and retry instead of an empty permitted list', async ({ page }) => {
  let fail = true;
  await setup(page, async (route, path) => {
    if (fail && path === '/api/v1/courses/c2/materials') {
      await route.fulfill({ status: 403, json: { message: 'Không có quyền xem tài liệu môn này' } });
      return true;
    }
    return false;
  });
  await navigate(page, 'Tài liệu học tập');
  await expect(page.getByRole('alert')).toContainText('DBI202: Không có quyền xem tài liệu môn này');
  await expect(page.getByText('Chưa có dữ liệu', { exact: true })).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'architecture.pdf', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'database.pdf', exact: true })).toBeVisible();
});

test('the initial list stays loading until all permitted courses finish loading', async ({ page }) => {
  let release, requested;
  const held = new Promise(resolve => { release = resolve; });
  const started = new Promise(resolve => { requested = resolve; });
  await setup(page, async (route, path) => {
    if (path !== '/api/v1/courses/c2/materials') return false;
    requested();
    await held;
    await route.fulfill({ json: [{ id: 'm2', originalFilename: 'database.pdf', extractionStatus: 'READY' }] });
    return true;
  });
  await navigate(page, 'Tài liệu học tập');
  await started;
  try {
    await expect(page.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByText('Chưa có dữ liệu', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('cell', { name: 'architecture.pdf', exact: true })).toHaveCount(0);
  } finally {
    release();
  }
  await expect(page.getByRole('cell', { name: 'architecture.pdf', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'database.pdf', exact: true })).toBeVisible();
});
