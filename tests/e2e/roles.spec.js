import { test, expect } from '@playwright/test';

test('admin changes account role in the edit dialog and old session is revoked', async ({ page, request }) => {
  test.skip(!process.env.TEST_USERNAME || !process.env.TEST_PASSWORD, 'Set test admin credentials.');
  const adminLogin = await request.post('/api/auth/login', { data: { username: process.env.TEST_USERNAME, password: process.env.TEST_PASSWORD } });
  expect(adminLogin.ok()).toBe(true);
  const { token } = await adminLogin.json(); const headers = { Authorization: `Bearer ${token}` };
  const username = `role_${Date.now()}`; let id;
  try {
    const created = await request.post('/api/users', { headers, data: { username, password: 'RolePassword123!', fullName: 'Role test student', email: `${username}@aives.local`, role: 'STUDENT' } });
    expect(created.ok()).toBe(true); id = (await created.json()).userId;
    const studentLogin = await request.post('/api/auth/login', { data: { username, password: 'RolePassword123!' } });
    const studentToken = (await studentLogin.json()).token;
    await page.goto('/');
    await page.getByLabel('Tên đăng nhập', { exact: true }).fill(process.env.TEST_USERNAME);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env.TEST_PASSWORD);
    await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.getByRole('button', { name: 'Người dùng & Vai trò', exact: true }).click();
    const row = page.getByRole('row').filter({ hasText: username });
    await row.getByRole('button', { name: 'Sửa', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Sửa Tài khoản' });
    await expect(dialog.getByLabel('Vai trò')).toHaveValue('STUDENT');
    await dialog.getByLabel('Vai trò').selectOption('LECTURER');
    const saved = page.waitForResponse(r => r.url().endsWith(`/api/users/${id}`) && r.request().method() === 'PUT');
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
    expect((await saved).status()).toBe(200);
    await expect(row).toContainText('LECTURER');
    const oldSession = await request.get('/api/auth/me', { headers: { Authorization: `Bearer ${studentToken}` } });
    expect(oldSession.status()).toBe(401);
    await page.reload(); await page.getByRole('button', { name: 'Người dùng & Vai trò', exact: true }).click();
    await expect(row).toContainText('LECTURER');
  } finally {
    if (id) expect((await request.delete(`/api/users/${id}`, { headers })).ok()).toBe(true);
  }
});
