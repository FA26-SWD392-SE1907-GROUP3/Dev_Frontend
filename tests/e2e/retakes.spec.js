import { test, expect } from '@playwright/test';

const teacher={id:'b37d81ba-6124-49ae-8b4c-1055b439068c',role:'LECTURER',email:'teacher@example.com',fullName:'Giảng viên'};
const student={id:'c37d81ba-6124-49ae-8b4c-1055b439068c',role:'STUDENT',email:'student@example.com',fullName:'Sinh viên'};
const candidateId='e37d81ba-6124-49ae-8b4c-1055b439068c',previousId='a37d81ba-6124-49ae-8b4c-1055b439068c';
const token=user=>[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,...user,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'sig'].join('.');
async function login(page,user){await page.goto('/');await page.getByPlaceholder('lecturer@example.com').fill(user.email);await page.getByPlaceholder('Nhập mật khẩu').fill('test123456');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();}
async function teacherRoom(page,{reject=false}={}){
  const exam={id:'e1',courseId:'c1',title:'Kỳ thi đã đóng',status:'CLOSED',rubricId:'r1',mainQuestionCount:1,maxFollowupsPerQuestion:2,maxFollowupsPerStudent:2,answerTimeLimitSeconds:60};
  const candidate={id:candidateId,studentId:student.id,fullName:'Sinh viên gặp sự cố',studentEmail:student.email,status:'COMPLETED',scheduledStart:new Date(Date.now()-3600000).toISOString(),scheduledEnd:new Date().toISOString(),latestAttemptId:previousId,canRetake:true,retakePending:false};
  let grants=[],activation=0,posts=[];
  await page.route('**/api/v1/**',async route=>{
    const url=new URL(route.request().url()),p=url.pathname,method=route.request().method();
    if(p==='/api/v1/auth/login')return route.fulfill({json:{code:200,data:{authenticate:true,token:token(teacher)}}});
    if(p===`/api/v1/users/${teacher.id}`)return route.fulfill({json:{code:200,data:teacher}});
    if(p==='/api/v1/courses')return route.fulfill({json:[{id:'c1',code:'SWD392',name:'Architecture'}]});
    if(p==='/api/v1/exams')return route.fulfill({json:[exam]});
    if(p==='/api/v1/exams/e1')return route.fulfill({json:exam});
    if(p==='/api/v1/exams/e1/monitor')return route.fulfill({json:{candidates:[{...candidate,attempts:[{id:previousId,status:'COMPLETED'}]}]}});
    if(p==='/api/v1/exams/e1/questions')return route.fulfill({json:[{id:'q1',status:'APPROVED',content:'Câu hỏi chính',difficulty:'MEDIUM'}]});
    if(p==='/api/v1/exams/e1/candidates')return route.fulfill({json:[candidate]});
    if(p===`/api/v1/exams/e1/candidates/${candidateId}/retakes`){
      if(method==='POST'){
        const body=route.request().postDataJSON();posts.push(body);
        if(reject)return route.fulfill({status:409,json:{message:'Đã có một lịch thi lại chưa sử dụng.'}});
        expect(body.previousAttemptId).toBe(previousId);expect(body.reason.trim()).not.toBe('');expect(Date.parse(body.scheduledStart)).toBeLessThan(Date.parse(body.scheduledEnd));
        candidate.status='READY';candidate.retakePending=true;candidate.canRetake=false;candidate.retakeReason=body.reason;candidate.scheduledStart=body.scheduledStart;candidate.scheduledEnd=body.scheduledEnd;
        grants.push({id:'g1',...body,nextAttemptNo:2,grantedAt:new Date().toISOString(),consumedAt:null,revokedAt:null});return route.fulfill({json:candidate});
      }
      return route.fulfill({json:grants});
    }
    if(p===`/api/v1/exams/e1/candidates/${candidateId}`&&method==='DELETE'){
      candidate.status='CANCELLED';candidate.retakePending=false;candidate.canRetake=true;grants.at(-1).revokedAt=new Date().toISOString();return route.fulfill({status:200,body:''});
    }
    if(p==='/api/v1/exams/e1/activate'){activation++;exam.status='ACTIVE';return route.fulfill({json:exam});}
    if(p.startsWith('/api/v1/courses/c1/'))return route.fulfill({json:[]});
    return route.fulfill({status:404,json:{message:'Unexpected '+p}});
  });
  await login(page,teacher);await page.getByRole('button',{name:'Ca thi vấn đáp',exact:true}).click();
  return {exam,candidate,grants,posts,activations:()=>activation};
}

test('lecturer grants one retake with schedule and reason, sees the audit, then reopens the closed exam',async({page})=>{
  const context=await teacherRoom(page);await page.getByRole('button',{name:'Chi tiết',exact:true}).click();
  await page.getByRole('button',{name:'Cho phép thi lại',exact:true}).click();
  await expect(page.getByRole('button',{name:'Xác nhận cho thi lại',exact:true})).toBeDisabled();
  await page.getByLabel('Lý do cho thi lại').fill('Micro bị ngắt giữa buổi vấn đáp.');
  await page.getByRole('button',{name:'Xác nhận cho thi lại',exact:true}).click();
  await expect(page.getByText('Đã cấp lịch thi lại · Micro bị ngắt giữa buổi vấn đáp.',{exact:true})).toBeVisible();
  expect(context.posts).toHaveLength(1);await expect(page.getByRole('button',{name:'Cho phép thi lại',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Lịch sử cấp thi lại',exact:true}).click();await expect(page.getByRole('cell',{name:'Micro bị ngắt giữa buổi vấn đáp.',exact:true})).toBeVisible();
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Mở lại kỳ thi',exact:true}).click();
  await expect.poll(()=>context.activations()).toBe(1);await expect(page.getByRole('button',{name:'Đóng ca thi',exact:true})).toBeVisible();
  await page.screenshot({path:'test-results/retake-granted.png',fullPage:true});
});

test('lecturer can cancel an unused retake while the exam is closed, retaining the audit',async({page})=>{
  const context=await teacherRoom(page);await page.getByRole('button',{name:'Chi tiết',exact:true}).click();
  await page.getByRole('button',{name:'Cho phép thi lại',exact:true}).click();await page.getByLabel('Lý do cho thi lại').fill('Thi lại do mất mạng.');
  await page.getByRole('button',{name:'Xác nhận cho thi lại',exact:true}).click();await page.getByRole('button',{name:'Hủy lịch thi',exact:true}).click();
  await expect(page.getByRole('button',{name:'Cho phép thi lại',exact:true})).toBeVisible();expect(context.grants[0].revokedAt).not.toBeNull();
  await page.getByRole('button',{name:'Lịch sử cấp thi lại',exact:true}).click();await expect(page.getByRole('cell',{name:'Đã hủy',exact:true})).toBeVisible();
});

test('stale grant conflict stays visible and reopening can be cancelled from the list',async({page})=>{
  const context=await teacherRoom(page,{reject:true});page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Mở lại kỳ thi',exact:true}).click();expect(context.activations()).toBe(0);
  await page.getByRole('button',{name:'Chi tiết',exact:true}).click();await page.getByRole('button',{name:'Cho phép thi lại',exact:true}).click();
  await page.getByLabel('Lý do cho thi lại').fill('Một yêu cầu từ màn hình cũ.');await page.getByRole('button',{name:'Xác nhận cho thi lại',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Đã có một lịch thi lại chưa sử dụng.');expect(context.candidate.status).toBe('COMPLETED');
});

test('student granted a retake can inspect the old attempt and enters a new room rather than the old attempt',async({page})=>{
  let started=0;const newAttempt='d37d81ba-6124-49ae-8b4c-1055b439068c';
  const schedule={id:candidateId,examTitle:'Kỳ thi được thi lại',status:'READY',action:'START',attemptId:previousId,scheduledStart:new Date().toISOString(),scheduledEnd:new Date(Date.now()+1800000).toISOString()};
  await page.addInitScript(()=>sessionStorage.setItem('aives-interview-mode','manual'));
  await page.route('**/api/v1/**',route=>{
    const p=new URL(route.request().url()).pathname;
    if(p==='/api/v1/auth/login')return route.fulfill({json:{code:200,data:{authenticate:true,token:token(student)}}});
    if(p===`/api/v1/users/${student.id}`)return route.fulfill({json:{code:200,data:student}});
    if(p==='/api/v1/student/exams')return route.fulfill({json:[schedule]});
    if(p===`/api/v1/student/exams/${candidateId}/attempts`)return route.fulfill({json:[{id:previousId,attemptNo:1,status:'ABORTED',startedAt:schedule.scheduledStart,endedAt:schedule.scheduledStart}]});
    if(p===`/api/v1/attempts/start/${candidateId}`){started++;return route.fulfill({json:{attemptId:newAttempt,status:'IN_PROGRESS'}});}
    if(p===`/api/v1/interviews/${previousId}`)throw Error('Must not resume the old attempt');
    if(p===`/api/v1/interviews/${newAttempt}`)return route.fulfill({json:{attemptId:newAttempt,status:'IN_PROGRESS',questionCount:1,completedQuestions:0,maxFollowups:2,maxFollowupsPerQuestion:2,followupsUsed:0,answerTimeLimitSeconds:60,scheduledEnd:schedule.scheduledEnd,serverNow:new Date().toISOString(),busy:false,needsContinuation:false,aiConfigured:false,turns:[],prompt:{id:'f37d81ba-6124-49ae-8b4c-1055b439068c',text:'Câu hỏi cho lượt thi lại',deadline:null,sequenceNo:1,followupNumber:0}}});
    return route.fulfill({status:404,json:{message:'Unexpected '+p}});
  });
  await login(page,student);await expect(page.getByText('Giảng viên đã cấp một lượt thi lại theo lịch mới.',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Xem lượt thi',exact:true}).click();await expect(page.getByText('Lượt 1 — Đã dừng',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Vào thi lại',exact:true}).click();await page.getByRole('button',{name:'Bắt đầu lượt thi',exact:true}).click();
  await expect(page.getByText('Câu hỏi cho lượt thi lại',{exact:true}).first()).toBeVisible();expect(started).toBe(1);
});
