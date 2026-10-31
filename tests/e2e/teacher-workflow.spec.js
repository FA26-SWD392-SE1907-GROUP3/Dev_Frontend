import {test,expect} from '@playwright/test';

const user={id:'b37d81ba-6124-49ae-8b4c-1055b439068c',role:'LECTURER',email:'teacher@example.com',fullName:'Teacher'};
const token=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,...user,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'sig'].join('.');
const course={id:'c1',code:'SWD392',name:'Software Architecture'};
async function setup(page,handle){
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/v1/auth/login')return route.fulfill({json:{code:200,data:{authenticate:true,token}}});
    if(path===`/api/v1/users/${user.id}`)return route.fulfill({json:{code:200,data:user}});
    if(await handle(route,path))return;
    if(path==='/api/v1/courses')return route.fulfill({json:[course]});
    if(path==='/api/v1/courses/c1/rubrics')return route.fulfill({json:[{id:'r1',name:'Rubric chấm toàn bài',status:'PUBLISHED',maxScore:10}]});
    if(path==='/api/v1/exams')return route.fulfill({json:[]});
    return route.fulfill({status:404,json:{message:'Unexpected '+path}});
  });
  await page.goto('/');await page.getByPlaceholder('lecturer@example.com').fill(user.email);await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
}
test('teacher edits AI drafts, approves into official bank and removes unwanted questions',async({page})=>{
  const questions=[{id:'q1',courseId:'c1',rubricId:'r1',content:'Bản AI cần sửa',referenceAnswer:'Đáp án AI',status:'PENDING_REVIEW',bloomLevel:'UNDERSTAND',difficulty:'MEDIUM',sourceType:'AI',sources:[{chunkId:'chunk1',filename:'lecture.pdf',content:'Nguồn tài liệu môn học'}]},{id:'q2',content:'Câu chưa duyệt khác',status:'PENDING_REVIEW'}];
  let edited=false;
  await setup(page,async(route,path)=>{
    if(path==='/api/v1/courses/c1/rubrics'){await route.fulfill({json:[{id:'r1',name:'Rubric',status:'PUBLISHED'}]});return true;}
    if(path==='/api/v1/courses/c1/questions'){await route.fulfill({json:questions});return true;}
    if(path==='/api/v1/questions/q1'){
      if(route.request().method()==='PUT'){const body=route.request().postDataJSON();expect(body.content).toBe('Câu hỏi giáo viên đã chỉnh');expect(body.referenceAnswer).toBe('Đáp án giáo viên kiểm tra');Object.assign(questions[0],body,{status:'PENDING_REVIEW'});edited=true;}
      if(route.request().method()==='DELETE')questions[0].status='ARCHIVED';
      await route.fulfill({json:questions[0]});return true;
    }
    if(path==='/api/v1/questions/q1/review'){expect(edited).toBe(true);questions[0].status='APPROVED';await route.fulfill({json:questions[0]});return true;}
  });
  await page.getByRole('button',{name:'Ngân hàng câu hỏi',exact:true}).click();await page.getByRole('combobox',{name:'Môn học',exact:true}).selectOption('c1');
  await expect(page.getByRole('button',{name:'Ngân hàng chính thức (0)',exact:true})).toBeVisible();
  await page.getByRole('row').filter({hasText:'Bản AI cần sửa'}).getByRole('button',{name:'Sửa',exact:true}).click();
  await page.getByLabel('Nội dung câu hỏi').fill('Câu hỏi giáo viên đã chỉnh');await page.getByLabel('Đáp án tham khảo').fill('Đáp án giáo viên kiểm tra');await page.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(page.getByRole('button',{name:'Ngân hàng chính thức (0)',exact:true})).toBeVisible();
  await page.getByRole('row').filter({hasText:'Câu hỏi giáo viên đã chỉnh'}).getByRole('button',{name:'Duyệt',exact:true}).click();
  await page.getByRole('button',{name:'Ngân hàng chính thức (1)',exact:true}).click();
  await expect(page.getByRole('cell',{name:'Câu hỏi giáo viên đã chỉnh',exact:true})).toBeVisible();await expect(page.getByRole('cell',{name:'Câu chưa duyệt khác',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Xóa',exact:true}).click();await page.getByRole('dialog',{name:'Bạn chắc chắn muốn xóa?',exact:true}).getByRole('button',{name:'Xóa',exact:true}).click();await page.getByRole('button',{name:/Đã loại bỏ \/ từ chối/}).click();
  await expect(page.getByRole('cell',{name:'Đã loại bỏ',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Chi tiết',exact:true}).click();await expect(page.getByText('Nguồn tài liệu môn học',{exact:true})).toBeVisible();
  await page.screenshot({path:'test-results/teacher-question-workflow.png',fullPage:true});
});

test('teacher creates exam, manages its question pool and changes student schedules',async({page})=>{
  let exam=null,roster=[],selected=[],candidates=[];
  const approved={id:'q1',rubricId:'r1',content:'Câu đã được giáo viên duyệt',status:'APPROVED',bloomLevel:'APPLY',difficulty:'MEDIUM'};
  await setup(page,async(route,path)=>{
    const method=route.request().method();let value;
    if(path==='/api/v1/exams'){
      if(method==='POST'){const body=route.request().postDataJSON();expect(body.mainQuestionCount).toBe(1);exam={id:'e1',status:'DRAFT',...body};value=exam;}else value=exam?[exam]:[];
    }else if(path==='/api/v1/exams/e1')value=exam;
    else if(path==='/api/v1/exams/e1/monitor')value={candidates:candidates.map(c=>({...c,attempts:[]}))};
    else if(path==='/api/v1/courses/c1/questions')value=[approved,{id:'pending',content:'Không được dùng',status:'PENDING_REVIEW'}];
    else if(path==='/api/v1/courses/c1/students')value=roster;
    else if(path==='/api/v1/exams/e1/questions'){
      if(method==='POST'){expect(route.request().postDataJSON().questionId).toBe('q1');selected=[approved];value={ok:true};}else value=selected;
    }else if(path==='/api/v1/exams/e1/questions/q1'&&method==='DELETE'){selected=[];value={ok:true};}
    else if(path==='/api/v1/exams/e1/candidates'){
      if(method==='POST'){const body=route.request().postDataJSON();expect(body.enrollIfNeeded).toBeUndefined();candidates=[{id:'candidate1',fullName:'Student',status:'REGISTERED',...body}];value='candidate1';}else value=candidates;
    }else if(path==='/api/v1/exams/e1/candidates/candidate1'){
      if(method==='PUT'){Object.assign(candidates[0],route.request().postDataJSON());value=candidates[0];}else{candidates[0].status='CANCELLED';value={ok:true};}
    }else if(path==='/api/v1/exams/e1/activate'){exam.status='ACTIVE';value=exam;}
    else return false;
    await route.fulfill({json:value});return true;
  });
  await page.getByRole('button',{name:'Ca thi vấn đáp',exact:true}).click();
  await expect(page.getByLabel('Tên kỳ thi')).toHaveCount(0);
  await page.getByRole('button',{name:'+ Tạo ca thi',exact:true}).first().click();
  await page.getByRole('combobox',{name:'Môn học',exact:true}).selectOption('c1');await page.getByLabel('Rubric chấm toàn bài').selectOption('r1');await page.getByLabel('Tên kỳ thi').fill('Kỳ thi giáo viên tổ chức');await page.getByLabel('Số câu chính (1–100)').fill('1');await page.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Ca thi vấn đáp',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Tìm kỳ thi',exact:true}).click();
  await expect(page.getByRole('button',{name:'Mở ca thi',exact:true})).toBeDisabled();
  await expect(page.getByRole('option',{name:'Không được dùng',exact:true})).toHaveCount(0);
  await page.getByLabel('Câu hỏi đã duyệt',{exact:true}).selectOption('q1');await page.getByRole('button',{name:'Thêm câu hỏi',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Câu hỏi trong đề (1)',exact:true})).toBeVisible();await page.getByRole('button',{name:'Gỡ khỏi đề',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Câu hỏi trong đề (0)',exact:true})).toBeVisible();
  await page.getByLabel('Câu hỏi đã duyệt',{exact:true}).selectOption('q1');await page.getByRole('button',{name:'Thêm câu hỏi',exact:true}).click();
  await page.getByLabel('Email sinh viên').fill('student@example.com');await page.getByLabel('Bắt đầu',{exact:false}).fill('2026-12-01T08:00');await page.getByLabel('Kết thúc',{exact:false}).fill('2026-12-01T08:30');await page.getByRole('button',{name:'Phân lịch',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Danh sách thí sinh (1)',exact:true})).toBeVisible();await page.getByRole('button',{name:'Sửa lịch',exact:true}).click();
  await page.getByLabel('Bắt đầu mới').fill('2026-12-01T09:00');await page.getByLabel('Kết thúc mới').fill('2026-12-01T09:30');await page.getByRole('button',{name:'Lưu lịch thi',exact:true}).click();
  await expect(page.getByText('Đã cập nhật khung giờ thi.',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Hủy lịch thi',exact:true}).click();await expect(page.getByRole('heading',{name:'Danh sách thí sinh (1)',exact:true})).toBeVisible();await expect(page.getByRole('cell',{name:'CANCELLED',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Hủy lịch thi',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Mở ca thi',exact:true}).click();await expect(page.getByRole('heading',{name:'Kỳ thi giáo viên tổ chức · ACTIVE',exact:true})).toBeVisible();
  await page.screenshot({path:'test-results/teacher-exam-workflow.png',fullPage:true});
});

test('teacher cancels a running student while keeping the schedule in the roster',async({page})=>{
  const exam={id:'e1',courseId:'c1',title:'Kỳ thi đang mở',status:'ACTIVE',mainQuestionCount:1,maxFollowupsPerStudent:2,maxFollowupsPerQuestion:2,answerTimeLimitSeconds:120};
  const candidate={id:'candidate1',fullName:'Student',studentEmail:'student@example.com',status:'IN_PROGRESS',scheduledStart:new Date(Date.now()-60000).toISOString(),scheduledEnd:new Date(Date.now()+1200000).toISOString()};
  let cancellations=0;
  await setup(page,async(route,path)=>{
    if(path==='/api/v1/exams'){await route.fulfill({json:[exam]});return true;}
    if(path==='/api/v1/exams/e1'){await route.fulfill({json:exam});return true;}
    if(path==='/api/v1/exams/e1/monitor'){await route.fulfill({json:{candidates:[{...candidate,attempts:[{id:'a1'}]}]}});return true;}
    if(path==='/api/v1/exams/e1/candidates'){await route.fulfill({json:[candidate]});return true;}
    if(path==='/api/v1/exams/e1/candidates/candidate1'){
      expect(route.request().method()).toBe('DELETE');cancellations++;candidate.status='CANCELLED';
      await route.fulfill({status:200,body:''});return true;
    }
    if(['/api/v1/courses/c1/questions','/api/v1/courses/c1/students','/api/v1/exams/e1/questions'].includes(path)){await route.fulfill({json:[]});return true;}
    return false;
  });
  await page.getByRole('button',{name:'Ca thi vấn đáp',exact:true}).click();
  await page.getByRole('button',{name:'Tìm kỳ thi',exact:true}).click();
  await expect(page.getByRole('cell',{name:'IN_PROGRESS',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Sửa lịch',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Hủy lịch thi',exact:true}).click();
  await expect(page.getByRole('cell',{name:'CANCELLED',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Danh sách thí sinh (1)',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Hủy lịch thi',exact:true})).toHaveCount(0);
  expect(cancellations).toBe(1);
});
