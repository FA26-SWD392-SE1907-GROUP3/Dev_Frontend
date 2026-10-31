import {test,expect} from '@playwright/test';

const teacher={id:'b37d81ba-6124-49ae-8b4c-1055b439068c',role:'LECTURER',fullName:'Teacher',email:'teacher@example.com'};
const token=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:teacher.id,...teacher,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'sig'].join('.');
async function openMaterials(page,handler){
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(await handler(route,path))return;
    let body;
    if(path==='/api/v1/auth/login')body={code:200,data:{authenticate:true,token}};
    else if(path===`/api/v1/users/${teacher.id}`)body={code:200,data:teacher};
    else if(path==='/api/v1/courses')body=[{id:'c1',code:'SWD392',name:'Software Design'}];
    else if(path==='/api/v1/ai/status')body={configured:true};
    else if(path==='/api/v1/courses/c1/materials')body=[{id:'m1',originalFilename:'case-study.pdf',extractionStatus:'READY',uploadedAt:new Date().toISOString()}];
    else if(path==='/api/v1/courses/c1/rubrics')body=[{id:'r1',name:'Rubric 10 điểm',status:'PUBLISHED'}];
    else if(path==='/api/v1/courses/c1/generation-jobs')body=[];
    else return route.fulfill({status:404,json:{message:'Unexpected '+path}});
    await route.fulfill({json:body});
  });
  await page.goto('/');await page.getByPlaceholder('lecturer@example.com').fill(teacher.email);await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.getByRole('button',{name:'Tài liệu học tập',exact:true}).click();await page.getByLabel('Môn học').selectOption('c1');await page.getByRole('button',{name:'Nhờ AI tạo câu hỏi',exact:true}).click();await page.getByRole('checkbox',{name:'case-study.pdf',exact:true}).check();
}
test('generation needs only source materials and one of three levels, then shows reviewable drafts',async({page})=>{
  let requests=0,release;const pending=new Promise(resolve=>release=resolve);let completed=false;
  await openMaterials(page,async(route,path)=>{
    if(path==='/api/v1/courses/c1/generation-jobs'){
      if(route.request().method()==='POST'){requests++;expect(route.request().postDataJSON()).not.toHaveProperty('rubricId');expect(route.request().postDataJSON()).not.toHaveProperty('bloomLevel');expect(route.request().postDataJSON().difficulty).toBe('MEDIUM');await pending;completed=true;await route.fulfill({json:{id:'j1',status:'COMPLETED',generatedCount:1}});}
      else await route.fulfill({json:completed?[{id:'j1',status:'COMPLETED',generatedCount:1,createdAt:new Date().toISOString()}]:[]});return true;
    }
    if(path==='/api/v1/generation-jobs/j1/questions'){await route.fulfill({json:[{id:'q1',rubricId:'r1',content:'Vì sao cần tách trách nhiệm giữa các thành phần?',referenceAnswer:'Để mỗi thành phần có vai trò rõ ràng.',bloomLevel:'UNDERSTAND',difficulty:'MEDIUM',status:'PENDING_REVIEW'}]});return true;}
  });
  await expect(page.getByLabel('Rubric đã công bố')).toHaveCount(0);await expect(page.getByLabel('Mức Bloom')).toHaveCount(0);await expect(page.getByLabel('Mức câu hỏi').locator('option')).toHaveText(['Dễ','Trung bình','Khó']);
  await page.getByLabel('Số câu hỏi (1–20)').fill('1');await page.getByRole('button',{name:'Sinh câu hỏi AI',exact:true}).click();
  await expect(page.getByRole('button',{name:'Đang sinh câu hỏi...',exact:true})).toBeDisabled();await expect(page.getByText(/AI đang đọc tài liệu và sinh câu hỏi/)).toBeVisible();release();
  await expect(page.getByRole('heading',{name:'Câu hỏi AI đã tạo',exact:true})).toBeVisible();await expect(page.getByText('1. Vì sao cần tách trách nhiệm giữa các thành phần?',{exact:true})).toBeVisible();await expect(page.getByText(/Đáp án tham khảo:.*mỗi thành phần/)).toBeVisible();await expect(page.getByRole('alert')).toHaveCount(0);expect(requests).toBe(1);
  await page.reload();await page.getByRole('button',{name:'Tài liệu học tập',exact:true}).click();await page.getByLabel('Môn học').selectOption('c1');await page.getByRole('button',{name:'Nhờ AI tạo câu hỏi',exact:true}).click();await page.getByRole('button',{name:'Xem câu hỏi',exact:true}).click();await expect(page.getByRole('heading',{name:'Câu hỏi AI đã tạo',exact:true})).toBeVisible();
  await page.screenshot({path:'test-results/generation-feedback.png',fullPage:true});
});
test('a course with no rubric can generate questions',async({page})=>{
  let requests=0;
  await openMaterials(page,async(route,path)=>{
    if(path==='/api/v1/courses/c1/rubrics')throw new Error('Question generation must not request rubrics');
    if(path==='/api/v1/courses/c1/generation-jobs'&&route.request().method()==='POST'){
      requests++;expect(route.request().postDataJSON().difficulty).toBe('HARD');
      await route.fulfill({json:{id:'j1',status:'COMPLETED',generatedCount:1}});return true;
    }
    if(path==='/api/v1/generation-jobs/j1/questions'){await route.fulfill({json:[{id:'q1',content:'Câu hỏi khó',difficulty:'HARD',status:'PENDING_REVIEW'}]});return true;}
  });
  await page.getByLabel('Mức câu hỏi').selectOption('HARD');await page.getByRole('button',{name:'Sinh câu hỏi AI',exact:true}).click();
  await expect(page.getByText('1. Câu hỏi khó',{exact:true})).toBeVisible();expect(requests).toBe(1);
});
test('provider failure is shown next to the generation form',async({page})=>{
  await openMaterials(page,async(route,path)=>{
    if(path==='/api/v1/courses/c1/generation-jobs'&&route.request().method()==='POST'){await route.fulfill({json:{id:'failed-job',status:'FAILED',generatedCount:0,errorMessage:'OpenAI đang giới hạn yêu cầu. Vui lòng thử lại sau.'}});return true;}
  });
  await page.getByRole('button',{name:'Sinh câu hỏi AI',exact:true}).click();
  const panel=page.locator('section').filter({has:page.getByRole('heading',{name:'Sinh câu hỏi bằng AI',exact:true})}).last();await expect(panel.getByRole('alert')).toContainText('OpenAI đang giới hạn yêu cầu');await expect(page.getByRole('heading',{name:'Câu hỏi AI đã tạo',exact:true})).toHaveCount(0);
});
