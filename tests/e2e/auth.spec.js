import { test, expect } from '@playwright/test';
const jwt = data => [Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({...data,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'stub'].join('.');
test('login uses email/password and opens admin dashboard from backend JWT/profile',async({page})=>{
  const token=jwt({sub:'a3a8f003-bfa6-4d66-9588-b825f20273cb',email:'admin@example.com',role:'ADMIN'});
  await page.route('**/api/v1/**',async route=>{
    const u=new URL(route.request().url());
    if(u.pathname==='/api/v1/auth/login'){
      expect(route.request().postDataJSON()).toEqual({email:'admin@example.com',password:'pass123456'});
      return route.fulfill({json:{code:200,data:{authenticate:true,token}}});
    }
    if(u.pathname.includes('/users/'))return route.fulfill({json:{code:200,data:{id:'a3a8f003-bfa6-4d66-9588-b825f20273cb',email:'admin@example.com',fullName:'Admin Demo',role:'ADMIN',active:true}}});
    if(u.pathname==='/api/v1/users'||u.pathname==='/api/v1/courses')return route.fulfill({json:[]});
    return route.fulfill({status:404,json:{message:'Unknown mock'}});
  });
  await page.goto('/');
  await page.getByPlaceholder('lecturer@example.com').fill('admin@example.com');
  await page.getByPlaceholder('Nhập mật khẩu').fill('pass123456');
  await page.getByRole('button',{name:'Đăng nhập'}).click();
  await expect(page.getByText('Tổng quan quản trị')).toBeVisible();
});
