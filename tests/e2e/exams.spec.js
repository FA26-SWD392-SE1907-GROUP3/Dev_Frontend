import { test, expect } from '@playwright/test';

const person = { id: 'b37d81ba-6124-49ae-8b4c-1055b439068c', role: 'LECTURER', fullName: 'Lecturer', email: 'teacher@example.com' };
const token = [Buffer.from('{}').toString('base64url'), Buffer.from(JSON.stringify({ sub: person.id, role: person.role, email: person.email, exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url'), 'signature'].join('.');
const exam = { rubricId:'r1',id:'exam1',courseId:'course1',title:'FA26_SWD392_CP1',status:'DRAFT' };

test('exam edit and delete require no started attempts and recheck before saving or deleting',async({page})=>{
  const base={...exam,status:'CLOSED',mainQuestionCount:1,maxFollowupsPerStudent:2,maxFollowupsPerQuestion:2,selectionMode:'RANDOM',answerTimeLimitSeconds:120};
  let rows=[{...base,id:'empty',title:'Ca trống'},{...base,id:'scheduled',title:'Ca đã phân lịch'},{...base,id:'completed',title:'Ca đã có lượt thi'},{...base,id:'cancelled',title:'Ca đã hủy lượt thi'},{...base,id:'open',title:'Ca đang mở',status:'ACTIVE'},{...base,id:'unknown',title:'Ca mất kết nối'}];
  const candidates={empty:[],scheduled:[{status:'REGISTERED',attempts:[]}],completed:[{status:'COMPLETED',attempts:[{id:'a1'}]}],cancelled:[{status:'CANCELLED',attempts:[{id:'a2',status:'ABORTED'}]}],open:[]};
  let updates=0,deletes=0;
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname,method=route.request().method();
    if(path==='/api/v1/auth/login')return route.fulfill({json:{code:200,data:{authenticate:true,token}}});
    if(path==='/api/v1/users/'+person.id)return route.fulfill({json:{code:200,data:person}});
    if(path==='/api/v1/courses/course1/rubrics')return route.fulfill({json:[{id:'r1',name:'Rubric toàn bài',maxScore:10,status:'PUBLISHED'}]});
    if(path==='/api/v1/courses')return route.fulfill({json:[{id:'course1',code:'SWD392',name:'Architecture'}]});
    if(path==='/api/v1/exams')return route.fulfill({json:rows});
    const match=path.match(/^\/api\/v1\/exams\/([^/]+)(\/monitor)?$/);
    if(match){
      const id=match[1],row=rows.find(row=>row.id===id);
      if(match[2])return id==='unknown'?route.fulfill({status:503,json:{message:'Không xác minh được lịch sử.'}}):route.fulfill({json:{candidates:candidates[id]}});
      if(method==='PUT'){updates++;Object.assign(row,route.request().postDataJSON());}
      if(method==='DELETE'){deletes++;rows=rows.filter(row=>row.id!==id);return route.fulfill({body:''});}
      return route.fulfill({json:row});
    }
    return route.fulfill({status:404,json:{message:'Unexpected '+path}});
  });
  await page.goto('/');await page.getByPlaceholder('lecturer@example.com').fill(person.email);await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await page.getByRole('button',{name:'Ca thi vấn đáp',exact:true}).click();
  const row=name=>page.getByRole('row').filter({hasText:name});
  await expect(row('Ca đã phân lịch').getByRole('button',{name:'Sửa',exact:true})).toBeEnabled();
  for(const title of ['Ca đã có lượt thi','Ca đã hủy lượt thi','Ca mất kết nối']){
    await expect(row(title).getByRole('button',{name:'Sửa',exact:true})).toBeDisabled();
    await expect(row(title).getByRole('button',{name:'Xóa',exact:true})).toBeDisabled();
  }
  await expect(row('Ca đang mở').getByRole('button',{name:'Sửa',exact:true})).toBeDisabled();
  await expect(row('Ca đang mở').getByRole('button',{name:'Xóa',exact:true})).toBeEnabled();
  await row('Ca đã phân lịch').getByRole('button',{name:'Sửa',exact:true}).click();
  await page.getByLabel('Tên kỳ thi').fill('Ca đóng đã sửa');await page.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(row('Ca đóng đã sửa')).toBeVisible();expect(updates).toBe(1);
  await row('Ca đóng đã sửa').getByRole('button',{name:'Sửa',exact:true}).click();
  candidates.scheduled[0]={status:'IN_PROGRESS',attempts:[{id:'new-attempt'}]};
  await page.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('đã có thí sinh tham gia');expect(updates).toBe(1);
  await page.getByRole('button',{name:'← Quay lại danh sách',exact:true}).click();
  await row('Ca trống').getByRole('button',{name:'Xóa',exact:true}).click();
  candidates.empty=[{status:'IN_PROGRESS',attempts:[{id:'race'}]}];
  const confirmation=page.getByRole('dialog',{name:'Bạn chắc chắn muốn xóa?',exact:true});
  await confirmation.getByRole('button',{name:'Xóa',exact:true}).click();
  await expect(confirmation.getByRole('alert')).toContainText('đã có thí sinh tham gia');expect(deletes).toBe(0);
  await confirmation.getByRole('button',{name:'Hủy',exact:true}).click();
  await page.getByRole('button',{name:'Cập nhật',exact:true}).click();
  await expect(row('Ca trống').getByRole('button',{name:'Xóa',exact:true})).toBeDisabled();
  await row('Ca đang mở').getByRole('button',{name:'Xóa',exact:true}).click();
  await page.getByRole('dialog',{name:'Bạn chắc chắn muốn xóa?',exact:true}).getByRole('button',{name:'Xóa',exact:true}).click();
  await expect(row('Ca đang mở')).toHaveCount(0);expect(deletes).toBe(1);
});

test('exam list supports search, full-page editing and confirmed closing at mobile width',async({page})=>{
  const draft={...exam,mainQuestionCount:3,maxFollowupsPerStudent:6,maxFollowupsPerQuestion:2,selectionMode:'RANDOM',answerTimeLimitSeconds:120};
  const active={...draft,id:'active1',title:'Ca đang diễn ra',status:'ACTIVE'};
  let updates=0,closes=0,opens=0;
  await page.setViewportSize({width:360,height:800});
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname,method=route.request().method();
    if(path==='/api/v1/auth/login')return route.fulfill({json:{code:200,data:{authenticate:true,token}}});
    if(path===`/api/v1/users/${person.id}`)return route.fulfill({json:{code:200,data:person}});
    if(path==='/api/v1/courses/course1/rubrics')return route.fulfill({json:[{id:'r1',name:'Rubric toàn bài',maxScore:10,status:'PUBLISHED'}]});
    if(path==='/api/v1/courses')return route.fulfill({json:[{id:'course1',code:'SWD392',name:'Software Architecture and Design'}]});
    if(path==='/api/v1/exams')return route.fulfill({json:[draft,active]});
    if(path.endsWith('/monitor'))return route.fulfill({json:{candidates:[]}});
    if(path==='/api/v1/exams/active1')return route.fulfill({json:active});
    if(path==='/api/v1/exams/active1/questions')return route.fulfill({json:Array.from({length:3},(_,i)=>({id:'q'+i,status:'APPROVED'}))});
    if(path==='/api/v1/exams/active1/activate'){opens++;active.status='ACTIVE';return route.fulfill({json:active});}
    if(path==='/api/v1/exams/exam1'){
      if(method==='PUT'){const body=route.request().postDataJSON();expect(body.courseId).toBe('course1');expect(body.mainQuestionCount).toBe(3);Object.assign(draft,body);updates++;}
      return route.fulfill({json:draft});
    }
    if(path==='/api/v1/exams/active1/close'){
      expect(method).toBe('PATCH');closes++;active.status='CLOSED';return route.fulfill({json:active});
    }
    return route.fulfill({status:404,json:{message:'Unexpected '+path}});
  });
  await page.goto('/');await page.getByPlaceholder('lecturer@example.com').fill(person.email);await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await page.getByRole('button',{name:'Ca thi vấn đáp',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Ca thi vấn đáp',exact:true})).toBeVisible();
  await expect(page.getByLabel('Tên kỳ thi')).toHaveCount(0);
  const search=page.getByRole('searchbox',{name:'Tìm kiếm',exact:true});
  await search.fill('dang dien ra');await expect(page.getByRole('cell',{name:active.title,exact:true})).toBeVisible();await expect(page.getByRole('cell',{name:draft.title,exact:true})).toHaveCount(0);
  await search.fill('không có ca này');await expect(page.getByText('Không tìm thấy kết quả',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Xóa tìm kiếm',exact:true}).click();
  await page.getByRole('button',{name:'+ Tạo ca thi',exact:true}).click();
  await expect(page.getByRole('form',{name:'Tạo kỳ thi',exact:true})).toBeVisible();await page.getByRole('button',{name:'Hủy',exact:true}).click();
  await page.getByRole('row').filter({hasText:draft.title}).getByRole('button',{name:'Sửa',exact:true}).click();
  await expect(page.getByLabel('Tên kỳ thi')).toHaveValue(draft.title);
  await page.getByLabel('Tên kỳ thi').fill('Ca đã chỉnh sửa');await page.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(page.getByRole('cell',{name:'Ca đã chỉnh sửa',exact:true})).toBeVisible();expect(updates).toBe(1);
  await expect(page.getByRole('row').filter({hasText:'Ca đã chỉnh sửa'}).getByRole('button',{name:'Đóng ca thi',exact:true})).toHaveCount(0);
  const activeRow=page.getByRole('row').filter({hasText:active.title});
  await expect(activeRow.getByRole('button',{name:'Sửa',exact:true})).toBeDisabled();
  await expect(activeRow.getByRole('button',{name:'Xóa',exact:true})).toBeEnabled();
  page.once('dialog',dialog=>dialog.dismiss());await activeRow.getByRole('button',{name:'Đóng ca thi',exact:true}).click();expect(closes).toBe(0);
  page.once('dialog',dialog=>dialog.accept());await activeRow.getByRole('button',{name:'Đóng ca thi',exact:true}).click();
  await expect(activeRow.getByRole('cell',{name:'CLOSED',exact:true})).toBeVisible();expect(closes).toBe(1);
  await expect(page.getByRole('button',{name:'Đóng ca thi',exact:true})).toHaveCount(0);
  await expect(activeRow.getByRole('button',{name:'Sửa',exact:true})).toBeEnabled();
  await activeRow.getByRole('button',{name:'Mở ca thi',exact:true}).click();
  await expect(activeRow.getByRole('cell',{name:'ACTIVE',exact:true})).toBeVisible();expect(opens).toBe(1);
  await expect(activeRow.getByRole('button',{name:'Sửa',exact:true})).toBeDisabled();
  const table=page.getByRole('region',{name:'Ca thi vấn đáp',exact:true});
  expect(await table.evaluate(node=>node.scrollWidth>node.clientWidth)).toBe(true);
  await page.locator('html').evaluate(node=>node.classList.add('dark'));
  await table.evaluate(node=>{node.scrollLeft=0;});
  await page.screenshot({path:'test-results/exam-list-mobile-dark.png',fullPage:true,animations:'disabled'});
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('html').evaluate(node=>node.classList.remove('dark'));
  await page.screenshot({path:'test-results/exam-list-desktop.png',fullPage:true,animations:'disabled'});
});

test('lecturer schedules only after administrator enrolls the student',async({page})=>{
  let submissions=0;
  let candidate=null;
  let enrolled=false;
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/v1/auth/login')return route.fulfill({json:{code:200,data:{authenticate:true,token}}});
    if(path===`/api/v1/users/${person.id}`)return route.fulfill({json:{code:200,data:person}});
    if(path==='/api/v1/courses/course1/rubrics')return route.fulfill({json:[{id:'r1',name:'Rubric toàn bài',maxScore:10,status:'PUBLISHED'}]});
    if(path==='/api/v1/courses')return route.fulfill({json:[{id:'course1',code:'SWD392',name:'Software Architecture and Design'}]});
    if(path==='/api/v1/exams')return route.fulfill({json:[exam]});
    if(path==='/api/v1/exams/exam1')return route.fulfill({json:exam});
    if(path==='/api/v1/exams/exam1/monitor')return route.fulfill({json:{candidates:candidate?[{...candidate,attempts:[]}]:[]}});
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
