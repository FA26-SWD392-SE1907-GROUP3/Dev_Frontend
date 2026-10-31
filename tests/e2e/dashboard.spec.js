import { test, expect } from '@playwright/test';

async function capture(page, path) {
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
}

async function setup(page, role, state = {}) {
  const user = { id: 'b37d81ba-6124-49ae-8b4c-1055b439068c', role, fullName: role === 'ADMIN' ? 'Quản trị viên AIVES' : 'Nguyễn Minh Anh', email: 'teacher@example.com' };
  const token = [Buffer.from('{}').toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, role, email: user.email, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'signature'].join('.');
  state.userRequests = 0;
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/login') return route.fulfill({ json: { code: 200, data: { authenticate: true, token } } });
    if (path === '/api/v1/users/' + user.id) return route.fulfill({ json: { code: 200, data: user } });
    if (path === '/api/v1/courses') return state.failed ? route.fulfill({ status: 503, json: { message: 'Tạm thời không tải được môn học.' } }) : route.fulfill({ json: state.empty ? [] : [{ id: 'c1', code: 'SWD392', name: 'Kiến trúc và thiết kế phần mềm' }, { id: 'c2', code: 'PRN212', name: 'Lập trình ứng dụng với nền tảng .NET' }] });
    if (path === '/api/v1/users') { state.userRequests++; return route.fulfill({ json: state.empty ? [] : [user, { id: 'u2' }, { id: 'u3' }] }); }
    if (path === '/api/v1/exams') return route.fulfill({ json: [] });
    return route.fulfill({ status: 404, json: { message: 'Unexpected endpoint ' + path } });
  });
  await page.goto('/');
  await page.getByPlaceholder('lecturer@example.com').fill(user.email);
  await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
}

for (const role of ['ADMIN', 'LECTURER']) {
  test(role + ' home uses real data, role-specific shortcuts and responsive light/dark layouts', async ({ page }) => {
    const admin = role === 'ADMIN', state = {};
    await page.setViewportSize({ width: 1440, height: 1000 });
    await setup(page, role, state);
    const title = admin ? 'Tổng quan quản trị' : 'Không gian giảng viên';
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByText('Kiến trúc và thiết kế phần mềm', { exact: true })).toBeVisible();
    const stats = page.getByRole('region', { name: 'Tổng quan công việc', exact: true });
    await expect(stats.getByText('2', { exact: true })).toBeVisible();
    if (admin) await expect(stats.getByText('3', { exact: true })).toBeVisible();
    else expect(state.userRequests).toBe(0);
    await expect(page.getByLabel('Mật khẩu hiện tại')).toBeHidden();
    await page.locator('summary').filter({ hasText: 'Đổi mật khẩu' }).click();
    await expect(page.getByLabel('Mật khẩu hiện tại')).toBeVisible();
    await page.locator('summary').filter({ hasText: 'Đổi mật khẩu' }).click();
    await capture(page, 'test-results/home-' + role.toLowerCase() + '-desktop.png');
    await page.locator('html').evaluate(node => node.classList.add('dark'));
    await capture(page, 'test-results/home-' + role.toLowerCase() + '-dark.png');
    await page.setViewportSize({ width: 360, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await capture(page, 'test-results/home-' + role.toLowerCase() + '-mobile.png');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('html').evaluate(node => node.classList.remove('dark'));
    const hero = page.getByRole('region', { name: 'Chào mừng đến với AIVES', exact: true });
    await hero.getByRole('button', { name: admin ? 'Quản lý môn học' : 'Quản lý ca thi', exact: true }).click();
    await expect(page.getByRole('heading', { name: admin ? 'Môn học & sinh viên' : 'Ca thi vấn đáp', exact: true })).toBeVisible();
  });
}

test('home preserves empty assignment guidance and can retry a failed course request', async ({ page }) => {
  const state = { failed: true, empty: true };
  await setup(page, 'LECTURER', state);
  await expect(page.getByRole('alert')).toContainText('Tạm thời không tải được môn học.');
  state.failed = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByText('Chưa có môn học', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  state.empty = false;
  await page.getByRole('button', { name: 'Tải lại', exact: true }).click();
  await expect(page.getByText('Kiến trúc và thiết kế phần mềm', { exact: true })).toBeVisible();
});
