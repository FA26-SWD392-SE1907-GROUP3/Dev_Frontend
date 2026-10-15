import { test, expect } from '@playwright/test';

test('registration, logout and password login use real APIs on desktop and mobile', async ({ page, request }) => {
  const username = `auth_${Date.now()}`;
  let id;
  try {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Chào mừng trở lại.' })).toBeVisible();
    await page.screenshot({ path: 'test-results/auth-desktop.png', fullPage: true });
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await page.getByLabel('Họ và tên', { exact: true }).fill('Nguyễn Minh An');
    await page.getByLabel('Email', { exact: true }).fill(`${username}@aives.local`);
    await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
    await page.getByLabel('Mật khẩu', { exact: true }).fill('BrowserPassword123!');
    await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill('NotMatching123!');
    await page.locator('form').getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('chưa khớp');
    await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill('BrowserPassword123!');
    const saved = page.waitForResponse(r => r.url().endsWith('/api/auth/register') && r.request().method() === 'POST');
    await page.locator('form').getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    const response = await saved; expect(response.status()).toBe(201); id = (await response.json()).user.userId;
    await expect(page.getByRole('heading', { name: /^Xin chào/ })).toBeVisible();
    await expect(page.getByText('Bạn chưa được phân công lịch thi', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'test-results/student-overview.png', fullPage: true });
    await page.getByRole('button', { name: 'Tài khoản của tôi', exact: true }).click();
    await expect(page.getByText(`${username}@aives.local`, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Lịch thi của tôi', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Lịch thi của tôi' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Học phần / Môn học', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
    await page.getByLabel('Mật khẩu', { exact: true }).fill('wrongPassword');
    await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('chưa đúng');
    await page.getByLabel('Mật khẩu', { exact: true }).fill('BrowserPassword123!');
    await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.getByRole('heading', { name: /^Xin chào/ })).toBeVisible();
    await page.reload(); await expect(page.getByRole('heading', { name: /^Xin chào/ })).toBeVisible();
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('heading', { name: 'Chào mừng trở lại.' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/auth-mobile.png', fullPage: true });
    await page.getByRole('button', { name: 'Giao diện tối' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  } finally {
    if (id && process.env.TEST_USERNAME && process.env.TEST_PASSWORD) {
      const login = await request.post('/api/auth/login', { data: { username: process.env.TEST_USERNAME, password: process.env.TEST_PASSWORD } });
      expect(login.ok()).toBe(true);
      const { token } = await login.json();
      const cleanup = await request.delete(`/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      expect(cleanup.ok()).toBe(true);
    }
  }
});
