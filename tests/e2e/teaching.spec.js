import { test, expect } from '@playwright/test';

const person = { id: 'b37d81ba-6124-49ae-8b4c-1055b439068c', role: 'LECTURER', fullName: 'Lecturer', email: 'teacher@example.com' };
const token = [Buffer.from('{}').toString('base64url'), Buffer.from(JSON.stringify({ sub: person.id, role: person.role, email: person.email, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'signature'].join('.');
const course = { id: 'c1', code: 'SWD392', name: 'Software Architecture and Design' };
async function login(page) {
  await page.goto('/');
  await page.getByPlaceholder('lecturer@example.com').fill(person.email);
  await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('button', { name: /Rubric/ }).first()).toBeVisible();
}
async function routes(page, handler) {
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/login') return route.fulfill({ json: { code: 200, data: { authenticate: true, token } } });
    if (path === `/api/v1/users/${person.id}`) return route.fulfill({ json: { code: 200, data: person } });
    if (await handler(route, path)) return;
    if (path === '/api/v1/courses') return route.fulfill({ json: [course] });
    if (path === '/api/v1/exams') return route.fulfill({ json: [] });
    return route.fulfill({ status: 404, json: { message: 'Unexpected endpoint ' + path } });
  });
}

test('unassigned lecturer sees assignment guidance and no rubric creation form', async ({ page }) => {
  await routes(page, async (route, path) => { if (path === '/api/v1/courses') { await route.fulfill({ json: [] }); return true; } });
  await login(page);
  await page.getByRole('button', { name: /Rubric/ }).first().click();
  await expect(page.getByText('Chưa có môn học để quản lý.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tạo rubric', exact: true })).toHaveCount(0);
});

test('rubric loads saved criteria, adds missing points and publishes', async ({ page }) => {
  let status = 'DRAFT';
  const criteria = [{ id: 'criterion1', criterionName: 'Kiến thức', description: 'Đúng nội dung', maxPoints: 4, sortOrder: 1 }];
  await routes(page, async (route, path) => {
    if (path === '/api/v1/courses/c1/rubrics') { await route.fulfill({ json: [{ id: 'r1', name: 'Kiến thức kiến trúc', maxScore: 10, status }] }); return true; }
    if (path === '/api/v1/rubrics/r1/criteria') {
      if (route.request().method() === 'POST') { const body = route.request().postDataJSON(); criteria.push({ id: 'criterion2', ...body }); await route.fulfill({ json: criteria.at(-1) }); }
      else await route.fulfill({ json: criteria });
      return true;
    }
    if (path === '/api/v1/rubrics/r1/publish') { status = 'PUBLISHED'; await route.fulfill({ json: { id: 'r1', status } }); return true; }
  });
  await login(page);
  await page.getByRole('button', { name: /Rubric/ }).first().click();
  await page.getByLabel('Môn học').selectOption('c1');
  await page.getByRole('button', { name: 'Tiêu chí', exact: true }).click();
  await expect(page.getByText('Đúng nội dung', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Công bố rubric' })).toBeDisabled();
  await page.getByRole('button', { name: 'Thêm tiêu chí', exact: true }).click();
  await page.getByLabel('Tên tiêu chí').fill('Vận dụng');
  await page.getByLabel('Điểm', { exact: false }).last().fill('6');
  await page.getByLabel('Thứ tự').fill('2');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByText('Tổng điểm: 10.00 / 10.00')).toBeVisible();
  await page.getByRole('button', { name: 'Công bố rubric' }).click();
  await expect(page.getByText('Rubric đã công bố.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '← Quay lại danh sách', exact: true }).click();
  await page.getByRole('button', { name: 'Tiêu chí', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Vận dụng', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/rubrics.png', fullPage: true });
});

test('materials support upload, indexing, text preview and download without an AI key', async ({ page }) => {
  let material = null;
  await routes(page, async (route, path) => {
    if (path === '/api/v1/courses/c1/materials') {
      if (route.request().method() === 'POST') { material = { id: 'm1', originalFilename: 'lecture.docx', extractionStatus: 'UPLOADED', uploadedAt: new Date().toISOString() }; await route.fulfill({ status: 201, json: material }); }
      else await route.fulfill({ json: material ? [material] : [] });
      return true;
    }
    if (path === '/api/v1/materials/m1/index') { material.extractionStatus = 'READY'; await route.fulfill({ json: material }); return true; }
    if (path === '/api/v1/materials/m1/chunks') { await route.fulfill({ json: [{ id: 'chunk1', content: 'Nội dung kiến trúc phần mềm đã trích xuất.' }] }); return true; }
    if (path === '/api/v1/materials/m1/download') { await route.fulfill({ contentType: 'application/octet-stream', body: 'downloaded document' }); return true; }
    if (path === '/api/v1/ai/status') { await route.fulfill({ json: { configured: false } }); return true; }
    if (path === '/api/v1/courses/c1/rubrics' || path === '/api/v1/courses/c1/generation-jobs') { await route.fulfill({ json: [] }); return true; }
  });
  await login(page);
  await page.getByRole('button', { name: /Tài liệu/i }).first().click();
  await page.getByLabel('Môn học').selectOption('c1');
  await page.getByRole('button', { name: '+ Tải tài liệu lên', exact: true }).first().click();
  await page.locator('input[type=file]').setInputFiles({ name: 'lecture.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('fixture') });
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Đã tải lên', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xử lý văn bản', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Sẵn sàng', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xem văn bản', exact: true }).click();
  await expect(page.getByText('Nội dung kiến trúc phần mềm đã trích xuất.')).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải xuống', exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe('lecture.docx');
  await page.getByRole('button', { name: 'Nhờ AI tạo câu hỏi', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sinh câu hỏi AI', exact: true })).toBeDisabled();
  await page.screenshot({ path: 'test-results/materials.png', fullPage: true });
});

test('AI questions show source evidence and can be reviewed before use', async ({ page }) => {
  let job = null;
  const question = { id: 'q1', content: 'Vì sao cần phân chia trách nhiệm?', bloomLevel: 'UNDERSTAND', difficulty: 'MEDIUM', status: 'PENDING_REVIEW' };
  await routes(page, async (route, path) => {
    if (path === '/api/v1/ai/status') { await route.fulfill({ json: { configured: true, model: 'test-model' } }); return true; }
    if (path === '/api/v1/courses/c1/materials') { await route.fulfill({ json: [{ id: 'm1', originalFilename: 'architecture.docx', extractionStatus: 'READY', uploadedAt: new Date().toISOString() }] }); return true; }
    if (path === '/api/v1/courses/c1/rubrics') { await route.fulfill({ json: [{ id: 'r1', name: 'Kiến trúc', maxScore: 10, status: 'PUBLISHED' }] }); return true; }
    if (path === '/api/v1/courses/c1/generation-jobs') {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        expect(body.materialIds).toEqual(['m1']); expect(body).not.toHaveProperty('rubricId');expect(body).not.toHaveProperty('bloomLevel'); expect(body.desiredCount).toBe(2);
        job = { id: 'job1', status: 'COMPLETED', generatedCount: 2, createdAt: new Date().toISOString() };
        await route.fulfill({ status: 201, json: job });
      } else await route.fulfill({ json: job ? [job] : [] });
      return true;
    }
    if (path === '/api/v1/courses/c1/questions') { await route.fulfill({ json: [question] }); return true; }
    if (path === '/api/v1/generation-jobs/job1/questions') { await route.fulfill({ json: [{...question,referenceAnswer:'Tách biệt vai trò các thành phần.'}] }); return true; }
    if (path === '/api/v1/questions/q1') { await route.fulfill({ json: { ...question, referenceAnswer: 'Tách biệt vai trò các thành phần.', sourceType: 'AI', sources: [{ chunkId: 'chunk1', filename: 'architecture.docx', content: 'Mỗi thành phần đảm nhận một trách nhiệm.' }] } }); return true; }
    if (path === '/api/v1/questions/q1/review') { expect(new URL(route.request().url()).searchParams.get('approve')).toBe('true'); question.status = 'APPROVED'; await route.fulfill({ json: question }); return true; }
  });
  await login(page);
  await page.getByRole('button', { name: /Tài liệu/i }).first().click();
  await page.getByLabel('Môn học').selectOption('c1');
  await page.getByRole('button', { name: 'Nhờ AI tạo câu hỏi', exact: true }).click();
  await page.getByRole('checkbox', { name: 'architecture.docx' }).check();
  await page.getByLabel('Số câu hỏi', { exact: false }).fill('2');
  await page.getByRole('button', { name: 'Sinh câu hỏi AI', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'COMPLETED', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Ngân hàng câu hỏi/i }).first().click();
  await page.getByLabel('Môn học').selectOption('c1');
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await expect(page.getByText('Tách biệt vai trò các thành phần.', { exact: true })).toBeVisible();
  await expect(page.getByText('Mỗi thành phần đảm nhận một trách nhiệm.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Duyệt', exact: true }).click();
  await page.getByRole('button', { name: /Ngân hàng chính thức/ }).click();
  await expect(page.getByRole('cell', { name: 'Đã duyệt', exact: true })).toBeVisible();
});

test('failed indexing refreshes the material status and can be retried',async({page})=>{
  let attempts=0;
  const material={id:'m1',originalFilename:'case-study.pdf',extractionStatus:'UPLOADED',uploadedAt:new Date().toISOString()};
  await routes(page,async(route,path)=>{
    if(path==='/api/v1/courses/c1/materials'){await route.fulfill({json:[material]});return true;}
    if(path==='/api/v1/materials/m1/index'){
      attempts++;material.extractionStatus=attempts===1?'FAILED':'READY';
      if(attempts===1)await route.fulfill({status:500,json:{message:'Không lưu được văn bản đã trích xuất. Vui lòng thử lại.'}});
      else await route.fulfill({json:material});return true;
    }
    if(path==='/api/v1/ai/status'){await route.fulfill({json:{configured:false}});return true;}
    if(path==='/api/v1/courses/c1/rubrics'||path==='/api/v1/courses/c1/generation-jobs'){await route.fulfill({json:[]});return true;}
  });
  await login(page);await page.getByRole('button',{name:'Tài liệu học tập',exact:true}).click();await page.getByLabel('Môn học').selectOption('c1');
  await page.getByRole('button',{name:'Xử lý văn bản',exact:true}).click();await expect(page.getByRole('cell',{name:'Xử lý thất bại',exact:true})).toBeVisible();await expect(page.getByRole('alert')).toContainText('Không lưu được văn bản');
  await page.getByRole('button',{name:'Thử xử lý lại',exact:true}).click();await expect(page.getByRole('cell',{name:'Sẵn sàng',exact:true})).toBeVisible();await expect(page.getByRole('alert')).toHaveCount(0);expect(attempts).toBe(2);
});
