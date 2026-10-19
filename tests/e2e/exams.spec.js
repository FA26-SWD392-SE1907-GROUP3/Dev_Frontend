import { test, expect } from '@playwright/test';

const person = { id: 'b37d81ba-6124-49ae-8b4c-1055b439068c', role: 'LECTURER', fullName: 'Lecturer', email: 'teacher@example.com' };
const token = [Buffer.from('{}').toString('base64url'), Buffer.from(JSON.stringify({ sub: person.id, role: person.role, email: person.email, exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url'), 'signature'].join('.');
const exam = { id:'exam1',courseId:'course1',title:'FA26_SWD392_CP1',status:'DRAFT' };

test('lecturer schedules only after administrator enrolls the student',async({page})=>{
  let submissions=0;
  let candidate=null;
  let enrolled=false;
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/v1/auth/login')return route.fulfill({json:{code:200,data:{authenticate:true,token}}});
    if(path===`/api/v1/users/${person.id}`)return route.fulfill({json:{code:200,data:person}});
    if(path==='/api/v1/courses')return route.fulfill({json:[{id:'course1',code:'SWD392',name:'Software Architecture and Design'}]});
    if(path==='/api/v1/exams')return route.fulfill({json:[exam]});
    if(path==='/api/v1/exams/exam1')return route.fulfill({json:exam});
    if(path==='/api/v1/courses/course1/questions')return route.fulfill({json:[]});
    if(path==='/api/v1/courses/course1/students'||path==='/api/v1/exams/exam1/questions')return route.fulfill({json:[]});
    if(path==='/api/v1/exams/exam1/candidates'){
      if(route.request().method()==='GET')return route.fulfill({json:candidate?[candidate]:[]});
      const body=route.request().postDataJSON();submissions++;
      expect(body.studentEmail).toBe('student@example.com');
      expect(Date.parse(body.scheduledEnd)).toBeGreaterThan(Date.parse(body.scheduledStart));
      expect(body.enrollIfNeeded).toBeUndefined();
      if(!enrolled)return route.fulfill({status:400,json:{message:'Student not enrolled'}});
      candidate={id:'candidate-created',fullName:'Student',status:'REGISTERED',...body};
      return route.fulfill({json:'candidate-created'});
    }
    return route.fulfill({status:404,json:{message:'Unexpected '+path}});
  });
  await page.goto('/');
  await page.getByPlaceholder('lecturer@example.com').fill(person.email);
  await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await page.getByRole('button',{name:'Ca thi vấn đáp',exact:true}).click();
  await page.getByLabel('Kỳ thi cần mở').selectOption('exam1');
  await page.getByRole('button',{name:'Tìm kỳ thi',exact:true}).click();
  await page.getByLabel('Email sinh viên').fill('student@example.com');
  await page.getByLabel('Bắt đầu',{exact:false}).fill('2026-12-01T08:00');
  await page.getByLabel('Kết thúc',{exact:false}).fill('2026-12-01T08:30');
  await expect(page.getByRole('checkbox',{name:'Ghi danh vào môn và phân lịch'})).toHaveCount(0);
  await page.getByRole('button',{name:'Phân lịch',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('chưa được ghi danh');
  await expect(page.getByRole('alert')).toContainText('Admin');
  enrolled=true;
  await page.getByRole('button',{name:'Phân lịch',exact:true}).click();
  await expect(page.getByText('Đã phân lịch cho sinh viên.',{exact:true})).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(submissions).toBe(2);
  await page.screenshot({path:'test-results/exam-enrollment.png',fullPage:true});
});
