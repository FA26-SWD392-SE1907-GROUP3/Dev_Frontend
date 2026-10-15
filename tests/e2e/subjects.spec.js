import { test, expect } from '@playwright/test';

test('authenticated subject CRUD persists across reload on the real backend', async ({ page, request }) => {
  test.skip(!process.env.TEST_USERNAME || !process.env.TEST_PASSWORD, 'Set TEST_USERNAME/TEST_PASSWORD for an AIVES admin.');
  let id;
  await page.goto('/');
  await page.getByLabel('Tên đăng nhập').fill(process.env.TEST_USERNAME);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env.TEST_PASSWORD);
  await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Học phần / Môn học', exact: true }).click();
  const code = `E2E${Date.now()}`;
  try {
    await page.getByRole('button', { name: 'Thêm môn học' }).click();
    await page.getByLabel('Mã môn', { exact: true }).fill(code);
    await page.getByLabel('Tên môn', { exact: true }).fill('Kiểm tra Unicode tiếng Việt');
    const created = page.waitForResponse(r => r.url().endsWith('/api/subjects') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    const response = await created; expect(response.status()).toBe(201); id = (await response.json()).subjectId;
    await expect(page.getByRole('dialog')).toHaveCount(0);
    let row = page.getByRole('row').filter({ hasText: code });
    for (let count = 0; count < 100 && await row.count() === 0; count++) {
      await expect(page.getByText('Đang tải...', { exact: true })).toHaveCount(0);
      if (await row.count()) break;
      const next = page.getByRole('button', { name: 'Trang sau' }); if (await next.isDisabled()) break;
      await Promise.all([page.waitForResponse(r => r.url().includes('/api/subjects?page=') && r.request().method() === 'GET'), next.click()]);
    }
    await expect(row).toContainText('Kiểm tra Unicode tiếng Việt');
    await row.getByRole('button', { name: 'Sửa', exact: true }).click();
    await page.getByLabel('Tên môn', { exact: true }).fill('Tên đã cập nhật');
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(row).toContainText('Tên đã cập nhật');
    await page.reload();
    await page.getByRole('button', { name: 'Học phần / Môn học', exact: true }).click();
    for (let count = 0; count < 100 && await row.count() === 0; count++) {
      await expect(page.getByText('Đang tải...', { exact: true })).toHaveCount(0);
      if (await row.count()) break;
      const next = page.getByRole('button', { name: 'Trang sau' }); if (await next.isDisabled()) break;
      await Promise.all([page.waitForResponse(r => r.url().includes('/api/subjects?page=') && r.request().method() === 'GET'), next.click()]);
    }
    await expect(row).toContainText('Tên đã cập nhật');
    page.once('dialog', dialog => dialog.accept());
    await row.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(row).toHaveCount(0);
  } finally {
    if (id) {
      const token = await page.evaluate(() => sessionStorage.getItem('aives-token'));
      await request.delete(`/api/subjects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    }
  }
});
