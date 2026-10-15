import { test, expect } from '@playwright/test';

test('question rubric and approval use persisted backend data', async ({ page, request }) => {
  test.skip(!process.env.TEST_USERNAME || !process.env.TEST_PASSWORD, 'Set admin credentials.');
  const stamp = Date.now(); let subjectId, questionId, token;
  await page.goto('/');
  await page.getByLabel('Tên đăng nhập').fill(process.env.TEST_USERNAME);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env.TEST_PASSWORD);
  await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeVisible();
  token = await page.evaluate(() => sessionStorage.getItem('aives-token'));
  const headers = { Authorization: `Bearer ${token}` };
  try {
    const response = await request.post('/api/subjects', { headers, data: { subjectCode: `Q${stamp}`, subjectName: 'Question workflow' } });
    expect(response.status()).toBe(201); subjectId = (await response.json()).subjectId;
    await page.getByRole('button', { name: 'Học phần / Môn học', exact: true }).click();
    await page.getByRole('button', { name: 'Ngân hàng câu hỏi', exact: true }).click();
    await page.getByRole('button', { name: 'Thêm', exact: true }).click();
    const form = page.getByRole('dialog', { name: 'Thêm Ngân hàng câu hỏi' });
    await expect(form.getByLabel('Môn học').locator('option', { hasText: `Q${stamp}` })).toHaveCount(1);
    await form.getByLabel('Môn học').selectOption(String(subjectId));
    await form.getByLabel('Câu hỏi', { exact: true }).fill(`Explain architecture ${stamp}`);
    const saved = page.waitForResponse(r => r.url().endsWith('/api/questions') && r.request().method() === 'POST');
    await form.getByRole('button', { name: 'Lưu', exact: true }).click();
    questionId = (await (await saved).json()).questionId;
    const row = page.getByRole('row').filter({ hasText: `Explain architecture ${stamp}` });
    await expect(row).toContainText('PENDING_APPROVAL');
    await row.getByRole('button', { name: 'Rubric', exact: true }).click();
    const rubric = page.getByRole('dialog', { name: 'Rubric của câu hỏi' });
    await rubric.getByRole('button', { name: 'Thêm', exact: true }).click();
    const criterion = page.getByRole('dialog', { name: 'Thêm Tiêu chí' });
    await criterion.getByLabel('Tiêu chí', { exact: true }).fill('Đúng kiến thức');
    await criterion.getByLabel('Điểm tối đa').fill('10');
    await criterion.getByLabel('Hướng dẫn chấm').fill('Giải thích có ví dụ');
    await criterion.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(criterion).toHaveCount(0);
    await expect(rubric).toContainText('Đúng kiến thức');
    await rubric.getByRole('button', { name: 'Đóng', exact: true }).click();
    await row.getByRole('button', { name: 'Duyệt', exact: true }).click();
    await expect(row).toContainText('APPROVED');
    const list = await request.get('/api/questions', { headers });
    expect((await list.json()).find(q => q.questionId === questionId).status).toBe('APPROVED');
  } finally {
    if (questionId) await request.delete(`/api/questions/${questionId}`, { headers });
    if (subjectId) await request.delete(`/api/subjects/${subjectId}`, { headers });
  }
});
