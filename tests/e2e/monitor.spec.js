import {test,expect} from '@playwright/test';
const course={id:'c1',code:'SWD392',name:'Software Design'};
const exam={id:'e1',courseId:'c1',title:'Ca thi kiến trúc',status:'ACTIVE'};
async function login(page,role,handle){
  const user={id:'u1',role,email:role.toLowerCase()+'@example.com',fullName:role==='ADMIN'?'Admin':'Giảng viên'};
  const token=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,role,email:user.email,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'signature'].join('.');
  await page.route('**/api/v1/**',async route=>{
    const url=new URL(route.request().url()),path=url.pathname;
    if(path==='/api/v1/auth/login')return route.fulfill({json:{code:200,data:{authenticate:true,token}}});
    if(path==='/api/v1/users/u1')return route.fulfill({json:{code:200,data:user}});
    if(await handle(route,path,url))return;
    if(path==='/api/v1/courses')return route.fulfill({json:[course]});
    if(path==='/api/v1/exams')return route.fulfill({json:[exam]});
    if(path==='/api/v1/users')return route.fulfill({json:[]});
    return route.fulfill({status:404,json:{message:'Unexpected '+path}});
  });
  await page.goto('/');await page.getByPlaceholder('lecturer@example.com').fill(user.email);await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
}
function snapshot(){
  const startedAt=new Date().toISOString(),scheduledEnd=new Date(Date.now()+1200000).toISOString();
  return {examId:'e1',title:exam.title,examStatus:'ACTIVE',courseCode:'SWD392',courseName:course.name,serverNow:startedAt,candidates:[
    {id:'candidate1',fullName:'Nguyễn An',email:'an@example.com',scheduledStart:startedAt,scheduledEnd,status:'IN_PROGRESS',attempts:[{id:'a1',attemptNo:1,status:'IN_PROGRESS',phase:'ANSWERING',startedAt,lastActivityAt:startedAt,completedQuestions:1,questionCount:3,timedOutQuestions:0,followupsUsed:1,currentSequence:2,deadline:new Date(Date.now()+60000).toISOString()}]},
    {id:'candidate2',fullName:'Trần Bình',email:'binh@example.com',scheduledStart:startedAt,scheduledEnd,status:'REGISTERED',attempts:[]}
  ]};
}
test('lecturer sees live exam progress, saved transcript and audio then polling updates completion',async({page})=>{
  await page.clock.install();
  const data=snapshot();let monitorCalls=0,monitorFailure=false;
  await login(page,'LECTURER',async(route,path)=>{
    if(path==='/api/v1/exams/e1/monitor'){monitorCalls++;data.serverNow=new Date().toISOString();await route.fulfill(monitorFailure?{status:503,json:{message:'Tạm mất kết nối giám sát.'}}:{json:data});return true;}
    if(path==='/api/v1/exams/e1/attempts/a1/transcript'){
      await route.fulfill({json:{attemptId:'a1',studentName:'Nguyễn An',email:'an@example.com',attemptNo:1,status:'IN_PROGRESS',serverNow:new Date().toISOString(),turns:[{id:'t1',sequenceNo:1,turnNo:1,speaker:'AI',followupNumber:0,text:'Giải thích trách nhiệm các thành phần.',createdAt:new Date().toISOString(),hasAudio:false},{id:'t2',sequenceNo:1,turnNo:2,speaker:'STUDENT',followupNumber:0,text:'Các thành phần có trách nhiệm tách biệt.',createdAt:new Date().toISOString(),speechStatus:'SUCCEEDED',hasAudio:true}]}});return true;
    }
    if(path.endsWith('/audio/t2')){const bytes=Buffer.alloc(4844);bytes.write('RIFF');bytes.writeUInt32LE(4836,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(24000,24);bytes.writeUInt32LE(48000,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(4800,40);await route.fulfill({contentType:'audio/wav',body:bytes});return true;}
  });
  await expect(page.getByRole('navigation').getByRole('button',{name:'Môn học & sinh viên',exact:true})).toHaveCount(0);
  await page.getByRole('navigation').getByRole('button',{name:'Giám sát ca thi',exact:true}).click();await page.getByRole('button',{name:'Xem giám sát',exact:true}).click();
  await expect(page.getByRole('row').filter({hasText:'Nguyễn An'})).toContainText('Đang trả lời');
  await page.getByRole('row').filter({hasText:'Nguyễn An'}).getByRole('button',{name:'Xem hội thoại lượt 1',exact:true}).click();
  await expect(page.getByText('Các thành phần có trách nhiệm tách biệt.',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Nghe bản ghi',exact:true}).click();await expect(page.getByLabel('Bản ghi lượt hội thoại')).toBeVisible();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Tải transcript',exact:true}).click();expect((await download).suggestedFilename()).toBe('hoi-thoai-a1.txt');
  data.candidates[0].attempts[0].phase='COMPLETED';data.candidates[0].attempts[0].status='COMPLETED';data.candidates[0].attempts[0].completedQuestions=3;
  await page.clock.fastForward(5000);
  await expect(page.getByRole('row').filter({hasText:'Nguyễn An'})).toContainText('Hoàn thành',{timeout:10000});expect(monitorCalls).toBeGreaterThan(1);
  await page.getByLabel('Tìm sinh viên').fill('an@example.com');await expect(page.getByRole('row').filter({hasText:'Trần Bình'})).toHaveCount(0);
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'test-results/lecturer-monitor.png',fullPage:true});
  monitorFailure=true;
  await page.getByRole('button',{name:'Cập nhật ngay',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Tạm mất kết nối giám sát.',{timeout:10000});
  await expect(page.getByRole('row').filter({hasText:'Nguyễn An'})).toContainText('Hoàn thành');
  await expect(page.getByText('Dữ liệu đang hiển thị từ lần cập nhật thành công trước.',{exact:false})).toBeVisible();
  monitorFailure=false;await page.clock.fastForward(5000);await expect(page.getByRole('alert')).toHaveCount(0,{timeout:10000});
});
test('admin manages teacher courses and students while monitor is absent',async({page})=>{
  let filtered=false,enrolled=false;
  await login(page,'ADMIN',async(route,path,url)=>{
    if(path==='/api/v1/users'){await route.fulfill({json:[{id:'teacher1',role:'LECTURER',fullName:'Nguyễn Giảng Viên',email:'teacher@example.com'}]});return true;}
    if(path==='/api/v1/courses'&&url.searchParams.get('lecturerId')){expect(url.searchParams.get('lecturerId')).toBe('teacher1');filtered=true;await route.fulfill({json:[course]});return true;}
    if(path==='/api/v1/courses/c1/lecturers'){await route.fulfill({json:[{id:'teacher1',fullName:'Nguyễn Giảng Viên',email:'teacher@example.com'}]});return true;}
    if(path==='/api/v1/courses/c1/students'){
      if(route.request().method()==='POST'){expect(route.request().postDataJSON().email).toBe('an@example.com');enrolled=true;await route.fulfill({status:200,body:''});}
      else await route.fulfill({json:enrolled?[{id:'s1',fullName:'Nguyễn An',email:'an@example.com',enrollmentStatus:'ACTIVE',active:true}]:[]});return true;
    }
  });
  await expect(page.getByRole('button',{name:'Giám sát ca thi',exact:true})).toHaveCount(0);
  await page.getByRole('navigation').getByRole('button',{name:'Môn học & sinh viên',exact:true}).click();await page.getByLabel('Lọc theo giảng viên').selectOption('teacher1');await expect.poll(()=>filtered).toBe(true);
  await page.getByRole('combobox',{name:'Môn học',exact:true}).selectOption('c1');await page.getByLabel('Email người dùng').fill('an@example.com');await page.getByRole('button',{name:'Xác nhận',exact:true}).click();
  await expect(page.getByRole('cell',{name:'an@example.com',exact:true})).toBeVisible();
});

test('admin edits courses, archives and restores them, and replaces a lecturer',async({page})=>{
  const item={...course,description:'Original',active:true};let assigned={id:'teacher1',fullName:'Giảng viên cũ',email:'old@example.com'};
  await login(page,'ADMIN',async(route,path)=>{
    if(path==='/api/v1/courses'){await route.fulfill({json:[item]});return true;}
    if(path==='/api/v1/courses/c1'){
      if(route.request().method()==='PUT')Object.assign(item,route.request().postDataJSON());
      else if(route.request().method()==='DELETE')item.active=false;
      await route.fulfill({json:item});return true;
    }
    if(path==='/api/v1/courses/c1/restore'){item.active=true;await route.fulfill({json:item});return true;}
    if(path==='/api/v1/courses/c1/lecturers'){await route.fulfill({json:[assigned]});return true;}
    if(path==='/api/v1/courses/c1/lecturers/teacher1'){
      expect(route.request().method()).toBe('PUT');expect(route.request().postDataJSON().email).toBe('new@example.com');
      assigned={id:'teacher2',fullName:'Giảng viên mới',email:'new@example.com'};await route.fulfill({body:''});return true;
    }
    if(path==='/api/v1/courses/c1/students'){await route.fulfill({json:[]});return true;}
  });
  await page.getByRole('navigation').getByRole('button',{name:'Môn học & sinh viên',exact:true}).click();
  await page.getByRole('button',{name:'Sửa môn',exact:true}).click();await page.getByLabel('Tên môn',{exact:false}).fill('Thiết kế phần mềm mới');
  await page.getByRole('button',{name:'Lưu môn học',exact:true}).click();await expect(page.getByRole('cell',{name:'Thiết kế phần mềm mới',exact:true})).toBeVisible();
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Xóa môn',exact:true}).click();await expect(page.getByRole('cell',{name:'Ngừng sử dụng',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Khôi phục môn',exact:true}).click();await expect(page.getByRole('cell',{name:'Đang sử dụng',exact:true})).toBeVisible();
  await page.getByRole('combobox',{name:'Môn học',exact:true}).selectOption('c1');await page.getByRole('button',{name:'Đổi giảng viên',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Môn học',exact:true})).toBeDisabled();await page.getByLabel('Email người dùng').fill('new@example.com');
  await page.getByRole('button',{name:'Xác nhận',exact:true}).click();await expect(page.getByRole('cell',{name:'new@example.com',exact:true})).toBeVisible();
  await expect(page.getByRole('combobox',{name:'Môn học',exact:true})).toBeEnabled();
});

test('lecturer edits and archives an unused draft rubric and renames and deletes a material',async({page})=>{
  const rubric={id:'r1',courseId:'c1',name:'Rubric nháp',description:'Mô tả gốc',maxScore:10,status:'DRAFT'};
  let material={id:'m1',originalFilename:'original.pdf',extractionStatus:'UPLOADED',uploadedAt:new Date().toISOString()};
  await login(page,'LECTURER',async(route,path)=>{
    if(path==='/api/v1/courses/c1/rubrics'){await route.fulfill({json:[rubric]});return true;}
    if(path==='/api/v1/rubrics/r1'){
      if(route.request().method()==='PUT')Object.assign(rubric,route.request().postDataJSON());else rubric.status='ARCHIVED';
      await route.fulfill({json:rubric});return true;
    }
    if(path==='/api/v1/rubrics/r1/criteria'){await route.fulfill({json:[]});return true;}
    if(path==='/api/v1/courses/c1/materials'){await route.fulfill({json:material?[material]:[]});return true;}
    if(path==='/api/v1/materials/m1'){
      if(route.request().method()==='PUT'){material.originalFilename=route.request().postDataJSON().name;await route.fulfill({json:material});}
      else{material=null;await route.fulfill({body:''});}return true;
    }
    if(path==='/api/v1/ai/status'){await route.fulfill({json:{configured:false}});return true;}
    if(path.endsWith('/generation-jobs')){await route.fulfill({json:[]});return true;}
  });
  await page.getByRole('navigation').getByRole('button',{name:'Tiêu chí Rubric',exact:true}).click();await page.getByRole('combobox',{name:'Môn học',exact:true}).selectOption('c1');
  await page.getByRole('button',{name:'Sửa',exact:true}).click();await page.getByLabel('Tên rubric').fill('Rubric đã sửa');await page.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(page.getByRole('cell',{name:'Rubric đã sửa',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Xóa',exact:true}).click();await page.getByRole('dialog',{name:'Bạn chắc chắn muốn xóa?',exact:true}).getByRole('button',{name:'Xóa',exact:true}).click();await expect(page.getByRole('cell',{name:'ARCHIVED',exact:true})).toBeVisible();
  await page.getByRole('navigation').getByRole('button',{name:'Tài liệu học tập',exact:true}).click();await page.getByRole('combobox',{name:'Môn học',exact:true}).selectOption('c1');
  await page.getByRole('button',{name:'Sửa',exact:true}).click();await page.getByRole('textbox',{name:'Tên tài liệu',exact:true}).fill('renamed.pdf');await page.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(page.getByRole('cell',{name:'renamed.pdf',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Xóa',exact:true}).click();await page.getByRole('dialog',{name:'Bạn chắc chắn muốn xóa?',exact:true}).getByRole('button',{name:'Xóa',exact:true}).click();await expect(page.getByRole('cell',{name:'renamed.pdf',exact:true})).toHaveCount(0);
});

test('monitor explains a missing backend route instead of leaving a blank error screen',async({page})=>{
  await login(page,'LECTURER',async(route,path)=>{if(path==='/api/v1/exams/e1/monitor'){await route.fulfill({status:404,json:{message:'Không tìm thấy API. Khởi động lại backend.'}});return true;}});
  await page.getByRole('navigation').getByRole('button',{name:'Giám sát ca thi',exact:true}).click();await page.getByRole('button',{name:'Xem giám sát',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Khởi động lại backend');
});

test('admin can disable another account with delete while retaining the current account',async({page})=>{
  const student={id:'s1',fullName:'Sinh viên mẫu',email:'student@example.com',role:'STUDENT',active:true};
  await login(page,'ADMIN',async(route,path)=>{
    if(path==='/api/v1/users'){await route.fulfill({json:[{id:'u1',fullName:'Admin',email:'admin@example.com',role:'ADMIN',active:true},student]});return true;}
    if(path==='/api/v1/users/s1'){expect(route.request().method()).toBe('DELETE');student.active=false;await route.fulfill({body:''});return true;}
  });
  await page.getByRole('navigation').getByRole('button',{name:'Người dùng & Vai trò',exact:true}).click();
  await expect(page.getByRole('row').filter({hasText:'admin@example.com'}).getByRole('button',{name:'Xóa',exact:true})).toHaveCount(0);
  page.once('dialog',d=>d.accept());await page.getByRole('row').filter({hasText:'student@example.com'}).getByRole('button',{name:'Xóa',exact:true}).click();
  await expect(page.getByRole('row').filter({hasText:'student@example.com'})).toContainText('Đã khóa');
});

test('lecturer deletes a draft exam from the list',async({page})=>{
  const draft={...exam,status:'DRAFT',mainQuestionCount:1,maxFollowupsPerQuestion:1,maxFollowupsPerStudent:2,answerTimeLimitSeconds:120};let removed=false;
  await login(page,'LECTURER',async(route,path)=>{
    if(path==='/api/v1/exams/e1/monitor'){await route.fulfill({json:{candidates:[]}});return true;}
    if(path==='/api/v1/exams'){await route.fulfill({json:removed?[]:[draft]});return true;}
    if(path==='/api/v1/exams/e1'){
      if(route.request().method()==='DELETE'){removed=true;await route.fulfill({body:''});}else await route.fulfill({json:draft});return true;
    }
    if(['/api/v1/exams/e1/questions','/api/v1/exams/e1/candidates','/api/v1/courses/c1/students','/api/v1/courses/c1/questions'].includes(path)){await route.fulfill({json:[]});return true;}
  });
  await page.getByRole('navigation').getByRole('button',{name:'Ca thi vấn đáp',exact:true}).click();
  await page.getByRole('row').filter({hasText:draft.title}).getByRole('button',{name:'Xóa',exact:true}).click();
  const confirmation=page.getByRole('dialog',{name:'Bạn chắc chắn muốn xóa?',exact:true});
  await expect(confirmation).toBeVisible();await confirmation.getByRole('button',{name:'Xóa',exact:true}).click();
  await expect(page.getByText('Đã xóa kỳ thi nháp.',{exact:true})).toBeVisible();
  await expect(page.getByText('Chưa có dữ liệu',{exact:true})).toBeVisible();
  await expect(page.getByRole('row').filter({hasText:draft.title})).toHaveCount(0);
});
