import {test,expect} from '@playwright/test';
const user={id:'b37d81ba-6124-49ae-8b4c-1055b439068c',email:'teacher@example.com',role:'LECTURER',fullName:'Teacher'};
const token=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,...user,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'sig'].join('.');
const course={id:'c1',code:'SWD392',name:'Software Architecture'};
const rubric={id:'r1',name:'Rubric kiến thức',status:'PUBLISHED',maxScore:10,criteria:[{name:'Hiểu nội dung',description:'Giải thích đúng',maxPoints:6},{name:'Ví dụ',description:'Ví dụ phù hợp',maxPoints:4}]};
async function start(page,handler,menu='Ngân hàng câu hỏi'){
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/v1/auth/login')return route.fulfill({json:{code:200,data:{authenticate:true,token}}});
    if(path===`/api/v1/users/${user.id}`)return route.fulfill({json:{code:200,data:user}});
    if(await handler(route,path))return;
    if(path==='/api/v1/courses')return route.fulfill({json:[course]});
    if(path==='/api/v1/courses/c1/rubrics')return route.fulfill({json:[rubric]});
    if(path==='/api/v1/exams')return route.fulfill({json:[]});
    return route.fulfill({status:404,json:{message:'Unexpected '+path}});
  });
  await page.goto('/');await page.getByPlaceholder('lecturer@example.com').fill(user.email);await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.getByRole('button',{name:menu,exact:true}).click();
  if(menu==='Ca thi vấn đáp')await page.getByRole('button',{name:'+ Tạo ca thi',exact:true}).first().click();
  await page.getByRole('combobox',{name:'Môn học',exact:true}).selectOption('c1');
}
test('CSV import is previewed and teacher independently approves or rejects each question',async({page})=>{
  let questions=[],committed=false;
  const rows=[{row:2,content:'Câu từ CSV thứ nhất',referenceAnswer:'Đáp án',rubricId:'r1',rubricName:rubric.name,bloomLevel:'REMEMBER',difficulty:'EASY',errors:[]},{row:3,content:'Câu từ CSV thứ hai',referenceAnswer:'Đáp án 2',rubricId:'r1',rubricName:rubric.name,bloomLevel:'ANALYZE',difficulty:'HARD',errors:[]}];
  await start(page,async(route,path)=>{
    if(path==='/api/v1/courses/c1/questions'){await route.fulfill({json:questions});return true;}
    if(path==='/api/v1/courses/c1/question-imports'){
      const body=route.request().postDataBuffer().toString('utf8');expect(body).toContain('questions.csv');expect(body).not.toContain('name="rubricId"');
      const preview=body.includes('name="preview"\r\n\r\ntrue');
      if(!preview){committed=true;questions=rows.map((r,i)=>({...r,id:'q'+i,courseId:'c1',sourceType:'IMPORTED',status:'PENDING_REVIEW'}));}
      await route.fulfill({json:{status:preview?'READY':'COMPLETED',batchId:preview?null:'batch1',totalRows:2,importedRows:preview?0:2,rows}});return true;
    }
    if(path.match(/^\/api\/v1\/questions\/q\d\/review$/)){
      const q=questions.find(q=>path.includes('/'+q.id+'/'));q.status=new URL(route.request().url()).searchParams.get('approve')==='true'?'APPROVED':'REJECTED';await route.fulfill({json:q});return true;
    }
    if(path==='/api/v1/questions/q0'){await route.fulfill({json:{...questions[0],rubric,sources:[]}});return true;}
  });
  await page.getByRole('button',{name:'Nhập / Tạo bằng AI',exact:true}).click();await page.getByRole('button',{name:'Import câu hỏi',exact:true}).click();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Tải mẫu CSV',exact:true}).click();expect((await download).suggestedFilename()).toBe('questions-template.csv');
  await page.getByLabel('Tệp câu hỏi CSV / JSON').setInputFiles({name:'questions.csv',mimeType:'text/csv',buffer:Buffer.from('content,referenceAnswer,bloomLevel,difficulty\nCâu từ CSV thứ nhất,Đáp án,REMEMBER,EASY\nCâu từ CSV thứ hai,Đáp án 2,ANALYZE,HARD')});
  await page.getByRole('button',{name:'Xem trước và kiểm tra tệp',exact:true}).click();await expect(page.getByRole('cell',{name:'Khó',exact:true})).toBeVisible();expect(committed).toBe(false);
  await page.getByRole('button',{name:'Nhập 2 câu vào danh sách chờ duyệt',exact:true}).click();
  await expect(page.getByRole('button',{name:'Ngân hàng chính thức (0)',exact:true})).toBeVisible();
  await page.getByRole('row').filter({hasText:'Câu từ CSV thứ nhất'}).getByRole('button',{name:'Duyệt',exact:true}).click();
  await page.getByRole('row').filter({hasText:'Câu từ CSV thứ hai'}).getByRole('button',{name:'Từ chối',exact:true}).click();
  await page.getByRole('button',{name:'Ngân hàng chính thức (1)',exact:true}).click();await expect(page.getByRole('cell',{name:'Câu từ CSV thứ hai',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Chi tiết',exact:true}).click();await expect(page.getByText('Mức câu hỏi: Dễ',{exact:true})).toBeVisible();await expect(page.getByText('Rubric: Rubric kiến thức · 10 điểm',{exact:true})).toHaveCount(0);
  await page.screenshot({path:'test-results/import-review-flow.png',fullPage:true});
});
test('AI generation returns questions directly to the teacher review queue without approval',async({page})=>{
  let questions=[],reviewCalls=0;
  await start(page,async(route,path)=>{
    let value;
    if(path==='/api/v1/courses/c1/questions')value=questions;
    else if(path==='/api/v1/ai/status')value={configured:true,model:'test'};
    else if(path==='/api/v1/courses/c1/materials')value=[{id:'m1',originalFilename:'lecture.pdf',extractionStatus:'READY',uploadedAt:new Date().toISOString()}];
    else if(path==='/api/v1/courses/c1/generation-jobs'){
      if(route.request().method()==='POST'){expect(route.request().postDataJSON()).not.toHaveProperty('rubricId');questions=[{id:'ai1',content:'Câu AI chờ giáo viên quyết định',rubricId:'r1',bloomLevel:'APPLY',difficulty:'MEDIUM',status:'PENDING_REVIEW'}];value={id:'job1',status:'COMPLETED',generatedCount:1};}else value=[];
    }else if(path.includes('/review')){reviewCalls++;value={};}else return false;
    await route.fulfill({json:value});return true;
  });
  await page.getByRole('button',{name:'Nhập / Tạo bằng AI',exact:true}).click();await page.getByRole('button',{name:'Nhờ AI tạo câu hỏi',exact:true}).click();await page.getByRole('checkbox',{name:'lecture.pdf',exact:true}).check();await page.getByLabel('Số câu hỏi (1–20)').fill('1');await page.getByRole('button',{name:'Sinh câu hỏi AI',exact:true}).click();
  await expect(page.getByRole('cell',{name:'Câu AI chờ giáo viên quyết định',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Ngân hàng chính thức (0)',exact:true})).toBeVisible();expect(reviewCalls).toBe(0);await expect(page.getByRole('cell',{name:'Trung bình',exact:true})).toBeVisible();
});
test('exam config sends adaptive mode and a whole-student deep-question budget',async({page})=>{
  let submitted=false,createdExam=null;
  await start(page,async(route,path)=>{
    if(path==='/api/v1/exams'&&route.request().method()==='POST'){
      const body=route.request().postDataJSON();expect(body.mainQuestionCount).toBe(3);expect(body.maxFollowupsPerStudent).toBe(4);expect(body.selectionMode).toBe('ADAPTIVE');expect(body.maxFollowupsPerQuestion).toBe(2);submitted=true;createdExam={id:'e1',status:'DRAFT',...body};await route.fulfill({json:createdExam});return true;
    }
    if(path==='/api/v1/exams'){await route.fulfill({json:createdExam?[createdExam]:[]});return true;}
    if(path==='/api/v1/exams/e1'){await route.fulfill({json:createdExam});return true;}
    if(path==='/api/v1/exams/e1/monitor'){await route.fulfill({json:{candidates:[]}});return true;}
    if(path==='/api/v1/courses/c1/questions'||path==='/api/v1/courses/c1/students'||path==='/api/v1/exams/e1/questions'||path==='/api/v1/exams/e1/candidates'){await route.fulfill({json:[]});return true;}
  },'Ca thi vấn đáp');
  await page.getByLabel('Rubric chấm toàn bài').selectOption('r1');await page.getByLabel('Tên kỳ thi').fill('Thi 3 câu chính và tối đa 4 câu đào sâu');await page.getByLabel('Số câu đào sâu tối đa mỗi sinh viên').fill('4');await page.getByLabel('Cách chọn bộ câu hỏi').selectOption('ADAPTIVE');await page.getByRole('button',{name:'Lưu',exact:true}).click();await expect.poll(()=>submitted).toBe(true);
  await page.getByRole('button',{name:'Tìm kỳ thi',exact:true}).click();await expect(page.getByText(/3 câu chính \+ tối đa 4 câu đào sâu cho toàn bộ lượt thi/)).toBeVisible();
  await page.screenshot({path:'test-results/student-question-budget.png',fullPage:true});
});
