import { test, expect } from '@playwright/test';

const user={id:'b37d81ba-6124-49ae-8b4c-1055b439068c',role:'STUDENT',email:'student@example.com',fullName:'Student'};
const candidate='e37d81ba-6124-49ae-8b4c-1055b439068c';
const token=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,role:user.role,email:user.email,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'signature'].join('.');

for(const status of [401,403]){
  test(`starting exam handles HTTP ${status} with an actionable explanation`,async({page})=>{
    await page.route('**/api/v1/**',async route=>{
      const path=new URL(route.request().url()).pathname;
      if(path==='/api/v1/auth/login')return route.fulfill({json:{code:200,data:{authenticate:true,token}}});
      if(path===`/api/v1/users/${user.id}`)return route.fulfill({json:{code:200,data:user}});
      if(path==='/api/v1/student/exams')return route.fulfill({json:[{id:candidate,examTitle:'Vấn đáp kiến trúc',status:'REGISTERED',scheduledStart:new Date().toISOString(),scheduledEnd:new Date(Date.now()+1200000).toISOString()}]});
      if(path===`/api/v1/attempts/start/${candidate}`)return route.fulfill({status,body:''});
      return route.fulfill({status:404});
    });
    await page.goto('/');
    await page.getByPlaceholder('lecturer@example.com').fill(user.email);
    await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');
    await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
    await page.getByRole('button',{name:'Vào phòng thi',exact:true}).click();
    await page.getByRole('button',{name:'Chuyển sang chế độ dự phòng',exact:true}).click();
    await page.getByRole('button',{name:'Bắt đầu lượt thi',exact:true}).click();
    if(status===401){
      await expect(page.getByRole('button',{name:'Đăng nhập',exact:true})).toBeVisible();
      await expect(page.getByText('Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.',{exact:true})).toBeVisible();
      expect(await page.evaluate(()=>sessionStorage.getItem('aives-token'))).toBeNull();
    }else{
      await expect(page.getByRole('alert')).toContainText('sinh viên được phân lịch');
      await expect(page.getByRole('heading',{name:'Phòng phỏng vấn AI'})).toBeVisible();
      expect(await page.evaluate(()=>sessionStorage.getItem('aives-token'))).toBe(token);
    }
  });
}
