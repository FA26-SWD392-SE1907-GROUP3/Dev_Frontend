import {test,expect} from '@playwright/test';
const token=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:'b37d81ba-6124-49ae-8b4c-1055b439068c',role:'ADMIN',email:'admin@example.com',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'signature'].join('.');
test('create course sends code/name once even when the form is submitted twice',async({page})=>{
  let created=0;
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/v1/auth/login')return route.fulfill({json:{code:200,data:{authenticate:true,token}}});
    if(path.startsWith('/api/v1/users/')&&route.request().method()==='GET')return route.fulfill({json:{code:200,data:{id:'b37d81ba-6124-49ae-8b4c-1055b439068c',role:'ADMIN',fullName:'Admin',email:'admin@example.com'}}});
    if(path==='/api/v1/users')return route.fulfill({json:[]});
    if(path==='/api/v1/courses'&&route.request().method()==='POST'){
      const body=route.request().postDataJSON();expect(body.code).toBe('SWD392');expect(body.name).toBe('Software Design');created++;
      return route.fulfill({json:{id:'course-id',...body}});
    }
    if(path==='/api/v1/courses')return route.fulfill({json:[]});
    return route.fulfill({status:404});
  });
  await page.goto('/');
  await page.getByPlaceholder('lecturer@example.com').fill('admin@example.com');
  await page.getByPlaceholder('Nhập mật khẩu').fill('pass123456');
  await page.getByRole('button',{name:'Đăng nhập'}).click();
  await page.getByRole('button',{name:/Môn học/}).first().click();
  const inputs=page.locator('form input');
  await inputs.nth(0).fill('SWD392');
  await inputs.nth(1).fill('Software Design');
  await page.locator('form').filter({has:page.getByRole('button',{name:'Tạo môn học',exact:true})}).evaluate(form=>{
    form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  });
  await expect(page.getByText('Đã tạo môn học.',{exact:true})).toBeVisible();
  expect(created).toBe(1);
});
