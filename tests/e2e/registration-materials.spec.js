import { test, expect } from '@playwright/test';

const ids={admin:'b37d81ba-6124-49ae-8b4c-1055b439068c',student:'c37d81ba-6124-49ae-8b4c-1055b439068c',pending:'d37d81ba-6124-49ae-8b4c-1055b439068c',course:'e37d81ba-6124-49ae-8b4c-1055b439068c',material:'f37d81ba-6124-49ae-8b4c-1055b439068c'};
const jwt=user=>[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,email:user.email,role:user.role,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'signature'].join('.');
const admin={id:ids.admin,fullName:'Admin',email:'admin@example.com',role:'ADMIN',active:true};
const student={id:ids.student,fullName:'Sinh viên',email:'student@example.com',role:'STUDENT',active:true};
async function login(page,user){
  await page.goto('/');await page.getByPlaceholder('lecturer@example.com').fill(user.email);await page.getByPlaceholder('Nhập mật khẩu').fill('StudyPass123!');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
}

test('public registration waits for admin approval and never offers a role selector',async({page})=>{
  let registrations=0;
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/v1/auth/register'){
      registrations++;expect(route.request().postDataJSON()).toEqual({fullName:'Nguyễn An',email:'new@example.com',password:'StudyPass123!',confirmPassword:'StudyPass123!'});
      return route.fulfill({status:201,json:{code:201,data:{email:'new@example.com',registrationStatus:'PENDING',message:'Đăng ký thành công. Vui lòng chờ Admin phân quyền và kích hoạt tài khoản.'}}});
    }
    return route.fulfill({status:403,json:{message:'Tài khoản đang chờ Admin phân quyền và kích hoạt.'}});
  });
  await page.goto('/');await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).click();
  await page.screenshot({path:'test-results/registration-page.png',fullPage:true});
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await page.getByLabel('Họ và tên',{exact:true}).fill('Nguyễn An');await page.getByLabel('Email',{exact:true}).fill('new@example.com');
  await page.getByLabel('Mật khẩu',{exact:true}).fill('StudyPass123!');await page.getByLabel('Xác nhận mật khẩu',{exact:true}).fill('Different123!');
  await page.getByRole('button',{name:'Đăng ký',exact:true}).click();await expect(page.getByRole('alert')).toContainText('không khớp');expect(registrations).toBe(0);
  await page.getByLabel('Xác nhận mật khẩu',{exact:true}).fill('StudyPass123!');await page.getByRole('button',{name:'Đăng ký',exact:true}).click();
  await expect(page.getByText('Đăng ký thành công. Vui lòng chờ Admin phân quyền và kích hoạt tài khoản.',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Đăng nhập',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>sessionStorage.getItem('aives-token'))).toBeNull();expect(registrations).toBe(1);
  await page.getByLabel('Mật khẩu',{exact:true}).fill('StudyPass123!');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('chờ Admin');
});

test('duplicate signup stays on the form and displays the server explanation',async({page})=>{
  await page.route('**/api/v1/auth/register',route=>route.fulfill({status:409,json:{message:'Email đã được sử dụng.'}}));
  await page.goto('/');await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).click();
  await page.getByLabel('Họ và tên',{exact:true}).fill('Nguyễn An');await page.getByLabel('Email',{exact:true}).fill('existing@example.com');
  await page.getByLabel('Mật khẩu',{exact:true}).fill('StudyPass123!');await page.getByLabel('Xác nhận mật khẩu',{exact:true}).fill('StudyPass123!');await page.getByRole('button',{name:'Đăng ký',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('Email đã được sử dụng.');await expect(page.getByLabel('Họ và tên',{exact:true})).toHaveValue('Nguyễn An');
});

test('admin explicitly selects the role before approving a pending registration',async({page})=>{
  const pending={id:ids.pending,fullName:'Người đăng ký',email:'new@example.com',role:null,active:false,registrationStatus:'PENDING'};let approvals=0;
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/v1/auth/login')return route.fulfill({json:{code:200,data:{authenticate:true,token:jwt(admin)}}});
    if(path===`/api/v1/users/${admin.id}`)return route.fulfill({json:{code:200,data:admin}});
    if(path==='/api/v1/users')return route.fulfill({json:{code:200,data:[admin,pending]}});
    if(path===`/api/v1/users/${pending.id}/approve-registration`){approvals++;expect(route.request().postDataJSON()).toEqual({role:'LECTURER'});Object.assign(pending,{role:'LECTURER',active:true,registrationStatus:'APPROVED'});return route.fulfill({json:{code:200,data:pending}});}
    if(path==='/api/v1/courses')return route.fulfill({json:[]});return route.fulfill({status:404});
  });
  await login(page,admin);await page.getByRole('navigation').getByRole('button',{name:'Người dùng & Vai trò',exact:true}).click();
  await page.getByRole('button',{name:'Phân quyền',exact:true}).click();
  await page.screenshot({path:'test-results/registration-approval.png',fullPage:true});
  await expect(page.getByRole('button',{name:'Xác nhận phân quyền',exact:true})).toBeDisabled();
  await page.getByLabel('Vai trò được cấp',{exact:false}).selectOption('LECTURER');await page.getByRole('button',{name:'Xác nhận phân quyền',exact:true}).click();
  const row=page.getByRole('row').filter({hasText:'new@example.com'});await expect(row).toContainText('LECTURER');await expect(row).toContainText('Hoạt động');expect(approvals).toBe(1);
});

async function studentSetup(page,{enrolled=true,previewFailure=false}={}){
  let previewCalls=0,downloads=0;const mutations=[];
  await page.addInitScript(()=>{window.__revokedPreviews=[];const original=URL.revokeObjectURL.bind(URL);URL.revokeObjectURL=url=>{window.__revokedPreviews.push(url);original(url);};});
  const course={id:ids.course,code:'SWD392',name:'Kiến trúc phần mềm',active:true};
  const records=[{id:ids.material,courseId:ids.course,originalFilename:'Bài giảng.pptx',mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation',extractionStatus:'UPLOADED',uploadedAt:new Date().toISOString()},
    {id:'docx',courseId:ids.course,originalFilename:'Ghi chú.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',uploadedAt:new Date().toISOString()}];
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/v1/auth/login')return route.fulfill({json:{code:200,data:{authenticate:true,token:jwt(student)}}});
    if(path===`/api/v1/users/${student.id}`)return route.fulfill({json:{code:200,data:student}});
    if(route.request().method()!=='GET')mutations.push(path);
    if(path==='/api/v1/student/exams')return route.fulfill({json:[]});
    if(path==='/api/v1/courses')return route.fulfill({json:enrolled?[course]:[]});
    if(path===`/api/v1/courses/${ids.course}/materials`)return route.fulfill({json:records});
    if(path.endsWith('/preview')){previewCalls++;return previewFailure?route.fulfill({status:422,json:{message:'Không tạo được bản xem trước.'}}):route.fulfill({contentType:'application/pdf',body:'%PDF-1.4\n%%EOF'});}
    if(path.endsWith('/text'))return route.fulfill({json:{content:'Nội dung học tập <script>không thực thi</script>'}});
    if(path.endsWith('/download')){downloads++;return route.fulfill({contentType:'application/vnd.openxmlformats-officedocument.presentationml.presentation',headers:{'Content-Disposition':'attachment; filename="lesson.pptx"'},body:'original-presentation'});}
    return route.fulfill({status:404});
  });
  await login(page,student);await page.getByRole('button',{name:'Tài liệu học tập',exact:true}).click();
  if(enrolled)await page.getByRole('combobox',{name:'Môn học',exact:true}).selectOption(ids.course);
  return {mutations,previewCalls:()=>previewCalls,downloads:()=>downloads};
}

test('student views and downloads PPTX without any editing or processing actions',async({page})=>{
  const context=await studentSetup(page);const row=page.getByRole('row').filter({hasText:'Bài giảng.pptx'});
  await page.screenshot({path:'test-results/student-materials.png',fullPage:true});
  for(const label of ['Tải tài liệu lên','Xử lý văn bản','Sinh câu hỏi AI','Sửa','Xóa'])await expect(page.getByRole('button',{name:label,exact:true})).toHaveCount(0);
  await row.getByRole('button',{name:'Xem tài liệu',exact:true}).click();await expect(page.getByTitle('Xem Bài giảng.pptx')).toHaveAttribute('src',/^blob:/);
  await page.getByRole('button',{name:'Đóng tài liệu',exact:true}).click();await expect(page.getByTitle('Xem Bài giảng.pptx')).toHaveCount(0);
  expect(await page.evaluate(()=>window.__revokedPreviews.length)).toBeGreaterThan(0);
  const download=page.waitForEvent('download');await row.getByRole('button',{name:'Tải xuống',exact:true}).click();expect((await download).suggestedFilename()).toBe('Bài giảng.pptx');
  expect(context.previewCalls()).toBeGreaterThan(0);expect(context.downloads()).toBe(1);expect(context.mutations).toEqual([]);
});

test('DOCX is shown as escaped text and missing preview still permits downloading',async({page})=>{
  await studentSetup(page,{previewFailure:true});await page.getByRole('row').filter({hasText:'Bài giảng.pptx'}).getByRole('button',{name:'Xem tài liệu',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('Không tạo được bản xem trước.');await expect(page.getByRole('button',{name:'Tải xuống',exact:true}).first()).toBeEnabled();
  await page.getByRole('row').filter({hasText:'Ghi chú.docx'}).getByRole('button',{name:'Xem tài liệu',exact:true}).click();
  await expect(page.getByText('Nội dung học tập <script>không thực thi</script>',{exact:true})).toBeVisible();
});

test('student without enrollment sees guidance rather than staff material controls',async({page})=>{
  await studentSetup(page,{enrolled:false});await expect(page.getByText('Bạn chưa được ghi danh môn học.',{exact:false})).toBeVisible();
  await expect(page.getByRole('button',{name:'Xem tài liệu',exact:true})).toHaveCount(0);
});

for(const extension of ['ppt','pptx'])test(`lecturer can select and upload a ${extension.toUpperCase()} material`,async({page})=>{
  const lecturer={id:ids.admin,fullName:'Giảng viên',email:'lecturer@example.com',role:'LECTURER',active:true};
  let uploaded=false;
  const course={id:ids.course,code:'SWD392',name:'Kiến trúc phần mềm'};
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/v1/auth/login')return route.fulfill({json:{code:200,data:{authenticate:true,token:jwt(lecturer)}}});
    if(path===`/api/v1/users/${lecturer.id}`)return route.fulfill({json:{code:200,data:lecturer}});
    if(path==='/api/v1/courses')return route.fulfill({json:[course]});
    if(path===`/api/v1/courses/${course.id}/materials`){
      const material={id:ids.material,courseId:course.id,originalFilename:`lesson.${extension}`,mimeType:extension==='ppt'?'application/vnd.ms-powerpoint':'application/vnd.openxmlformats-officedocument.presentationml.presentation',extractionStatus:'UPLOADED',uploadedAt:new Date().toISOString()};
      if(route.request().method()==='POST'){uploaded=true;expect(route.request().postDataBuffer().toString('latin1')).toContain(`lesson.${extension}`);return route.fulfill({status:201,json:material});}
      return route.fulfill({json:uploaded?[material]:[]});
    }
    if(path.endsWith('/rubrics')||path.endsWith('/generation-jobs'))return route.fulfill({json:[]});
    return route.fulfill({status:404});
  });
  await login(page,lecturer);await page.getByRole('navigation').getByRole('button',{name:'Tài liệu học tập',exact:true}).click();
  await page.getByRole('button',{name:'+ Tải tài liệu lên',exact:true}).click();
  await expect(page.locator('input[type=file]')).toHaveAttribute('accept','.pdf,.docx,.ppt,.pptx');
  await page.locator('input[type=file]').setInputFiles({name:`lesson.${extension}`,mimeType:'application/octet-stream',buffer:Buffer.from('browser-fixture')});
  await page.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(page.getByRole('cell',{name:`lesson.${extension}`,exact:true})).toBeVisible();expect(uploaded).toBe(true);
});
